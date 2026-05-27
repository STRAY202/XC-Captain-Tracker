import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, useMemo
} from 'react';

// ── Safe localStorage (iOS Safari private mode & storage quota) ───────────────
function safeGet(key) {
  try { return window.localStorage.getItem(key); }
  catch (e) { console.warn('[storage] read failed:', key, e); return null; }
}
function safeSet(key, value) {
  try { window.localStorage.setItem(key, String(value)); }
  catch (e) { console.warn('[storage] write failed:', key, e); }
}
function safeRemove(key) {
  try { window.localStorage.removeItem(key); }
  catch (e) { console.warn('[storage] remove failed:', key, e); }
}
function safeSessionGet(key) {
  try { return window.sessionStorage.getItem(key); }
  catch { return null; }
}
function safeSessionSet(key, value) {
  try { window.sessionStorage.setItem(key, String(value)); }
  catch {}
}
function safeSessionRemove(key) {
  try { window.sessionStorage.removeItem(key); }
  catch {}
}
import {
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc, collection, onSnapshot, setDoc, updateDoc,
  deleteDoc, serverTimestamp, writeBatch, query, orderBy,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../firebase';
import { generateSeedData, DEFAULT_CAPTAINS, CAPTAIN_COLORS } from '../utils/seedData';
import { addDays } from '../utils/dates';

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  teamName:          'XC Summer Training',
  startDate:         '2026-06-15',
  numWeeks:          11,
  defaultTime:       '8:00 AM',
  practiceDays:      [0, 1, 2, 3, 4],
  minCoveredDays:    3,
  minCaptainsPerDay: 1,
  teamCode:          'xc2026',
  adminCode:         'admin2026',
};

const STORAGE = {
  TEAM_VERIFIED: 'xc-team-ok',
  CAPTAIN_ID:    'xc-captain',
  ADMIN:         'xc-admin',
  DARK_MODE:     'xc-dark',
  DEMO:          'xc-demo-v3',   // bumped → clears stale data with old captain names
};

// ── Demo-mode helpers ─────────────────────────────────────────────────────────

function loadDemo() {
  try {
    const raw = localStorage.getItem(STORAGE.DEMO);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDemo(patch) {
  try {
    const cur = loadDemo() || {};
    localStorage.setItem(STORAGE.DEMO, JSON.stringify({ ...cur, ...patch }));
  } catch {}
}

// ── Context ───────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  // Demo mode = no Firebase env vars → use localStorage only
  const demoMode = !isFirebaseConfigured;

  /* ── Auth ─────────────────────────────────────────────────────────────── */
  const [firebaseUser,  setFirebaseUser]  = useState(null);
  const [authLoading,   setAuthLoading]   = useState(!demoMode && isFirebaseConfigured);

  /* ── Access ───────────────────────────────────────────────────────────── */
  const [teamVerified, setTeamVerified] = useState(
    () => demoMode || safeGet(STORAGE.TEAM_VERIFIED) === 'true'
  );
  const [isAdmin, setIsAdmin] = useState(
    () => safeSessionGet(STORAGE.ADMIN) === 'true'
  );

  /* ── Captain ──────────────────────────────────────────────────────────── */
  const [currentCaptainId, setCurrentCaptainId] = useState(
    () => safeGet(STORAGE.CAPTAIN_ID) || null
  );

  /* ── Dark mode ────────────────────────────────────────────────────────── */
  const [darkMode, setDarkMode] = useState(
    () => safeGet(STORAGE.DARK_MODE) === 'true'
  );

  /* ── Data ─────────────────────────────────────────────────────────────── */
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);
  const [captains,    setCaptains]    = useState([]);
  const [attendance,  setAttendance]  = useState({});
  const [dayDetails,  setDayDetails]  = useState({});
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError,   setLoadError]   = useState(false);

  const initializing = useRef(false);

  /* ── Dark mode sync ───────────────────────────────────────────────────── */
  useEffect(() => {
    safeSet(STORAGE.DARK_MODE, darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  /* ── Demo mode bootstrap ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!demoMode) return;

    const saved = loadDemo();
    if (saved?.captains?.length) {
      setSettings({ ...DEFAULT_SETTINGS, ...(saved.settings || {}) });
      setCaptains(saved.captains);
      setAttendance(saved.attendance || {});
      setDayDetails(saved.dayDetails || {});
    } else {
      // First visit: seed demo data
      const seed = generateSeedData(DEFAULT_SETTINGS.startDate);
      setSettings(DEFAULT_SETTINGS);
      setCaptains(seed.captains);
      setAttendance(seed.attendance);
      setDayDetails(seed.dayDetails);
      saveDemo({
        settings:   DEFAULT_SETTINGS,
        captains:   seed.captains,
        attendance: seed.attendance,
        dayDetails: seed.dayDetails,
      });
    }
    setDataLoading(false);
  }, [demoMode]);

  /* ── Firebase timeout — clears dataLoading if Firebase never responds ──── */
  useEffect(() => {
    if (demoMode || !dataLoading) return;
    const t = setTimeout(() => {
      console.error('[AppContext] Firebase load timed out after 10s — falling back to demo data');
      const seed = generateSeedData(DEFAULT_SETTINGS.startDate);
      setCaptains(seed.captains);
      setAttendance(seed.attendance);
      setDayDetails(seed.dayDetails);
      setDataLoading(false);
      setLoadError(true);
    }, 10000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  /* ── Firebase Anonymous Auth ──────────────────────────────────────────── */
  useEffect(() => {
    if (demoMode || !auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        try {
          const result = await signInAnonymously(auth);
          setFirebaseUser(result.user);
        } catch (err) {
          console.error('[AppContext] Anonymous sign-in failed:', err);
          setAuthLoading(false);
          setDataLoading(false);  // won't get Firestore listeners without auth
          setLoadError(true);
          return;
        }
      }
      setAuthLoading(false);
    }, (err) => {
      console.error('[AppContext] onAuthStateChanged error:', err);
      setAuthLoading(false);
      setDataLoading(false);
      setLoadError(true);
    });
    return unsub;
  }, [demoMode]);

  /* ── Firestore Listeners ──────────────────────────────────────────────── */
  useEffect(() => {
    if (demoMode || !db || !firebaseUser) return;

    const unsubs = [];

    unsubs.push(
      onSnapshot(doc(db, 'config', 'main'), async (snap) => {
        if (!snap.exists()) {
          if (!initializing.current) {
            initializing.current = true;
            await initDatabase();
          }
        } else {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
          setDataLoading(false);
        }
      }, (err) => { console.error('config listener:', err); setDataLoading(false); })
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'captains'), orderBy('order', 'asc')),
        (snap) => setCaptains(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => console.error('captains listener:', err)
      )
    );

    unsubs.push(
      onSnapshot(collection(db, 'attendance'), (snap) => {
        const data = {};
        snap.docs.forEach(d => { data[d.id] = d.data(); });
        setAttendance(data);
      }, (err) => console.error('attendance listener:', err))
    );

    unsubs.push(
      onSnapshot(collection(db, 'dayDetails'), (snap) => {
        const data = {};
        snap.docs.forEach(d => { data[d.id] = d.data(); });
        setDayDetails(data);
      }, (err) => console.error('dayDetails listener:', err))
    );

    return () => unsubs.forEach(u => u());
  }, [demoMode, firebaseUser]);

  /* ── First-run Firebase initialization ───────────────────────────────── */
  async function initDatabase() {
    const seed = generateSeedData(DEFAULT_SETTINGS.startDate);
    const batch = writeBatch(db);
    batch.set(doc(db, 'config', 'main'), { ...DEFAULT_SETTINGS, createdAt: serverTimestamp() });
    seed.captains.forEach((cap, i) => {
      batch.set(doc(db, 'captains', cap.id), { name: cap.name, color: cap.color, order: i, createdAt: serverTimestamp() });
    });
    Object.entries(seed.dayDetails).forEach(([d, v]) => batch.set(doc(db, 'dayDetails', d), { ...v, updatedAt: serverTimestamp() }));
    Object.entries(seed.attendance).forEach(([d, v]) => batch.set(doc(db, 'attendance', d), { ...v, updatedAt: serverTimestamp() }));
    await batch.commit();
  }

  /* ── Team/Admin verification ──────────────────────────────────────────── */
  const verifyTeamCode = useCallback(async (code) => {
    if (demoMode) return true;
    const correct = code.trim().toLowerCase() === (settings.teamCode || '').toLowerCase();
    if (correct) {
      setTeamVerified(true);
      safeSet(STORAGE.TEAM_VERIFIED, 'true');
    }
    return correct;
  }, [demoMode, settings.teamCode]);

  const verifyAdminCode = useCallback((code) => {
    const correct = code.trim() === settings.adminCode;
    if (correct) {
      setIsAdmin(true);
      safeSessionSet(STORAGE.ADMIN, 'true');
    }
    return correct;
  }, [settings.adminCode]);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    safeSessionRemove(STORAGE.ADMIN);
  }, []);

  /* ── Captain selection ────────────────────────────────────────────────── */
  const selectCaptain = useCallback((id) => {
    console.log('[AppContext] Captain selected:', id);
    setCurrentCaptainId(id);
    safeSet(STORAGE.CAPTAIN_ID, id);
  }, []);

  const deselectCaptain = useCallback(() => {
    console.log('[AppContext] Captain deselected');
    setCurrentCaptainId(null);
    safeRemove(STORAGE.CAPTAIN_ID);
  }, []);

  /* ── Attendance ───────────────────────────────────────────────────────── */
  const toggleAttendance = useCallback(async (dateStr, captainId) => {
    if (demoMode) {
      setAttendance(prev => {
        const next = {
          ...prev,
          [dateStr]: { ...(prev[dateStr] || {}), [captainId]: !(prev[dateStr]?.[captainId]) },
        };
        saveDemo({ attendance: next });
        return next;
      });
      return;
    }
    if (!db) return;
    const current = attendance[dateStr]?.[captainId] === true;
    try {
      await setDoc(doc(db, 'attendance', dateStr), { [captainId]: !current, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) { console.error('toggleAttendance:', err); }
  }, [demoMode, attendance]);

  /* ── Settings ─────────────────────────────────────────────────────────── */
  const updateSettings = useCallback(async (updates) => {
    if (demoMode) {
      setSettings(prev => {
        const next = { ...prev, ...updates };
        saveDemo({ settings: next });
        return next;
      });
      return;
    }
    if (!db) return;
    try {
      await setDoc(doc(db, 'config', 'main'), { ...updates, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) { console.error('updateSettings:', err); }
  }, [demoMode]);

  /* ── Captains ─────────────────────────────────────────────────────────── */
  const addCaptain = useCallback(async (name, color) => {
    const id = `cap_${Date.now()}`;
    if (demoMode) {
      setCaptains(prev => {
        const next = [...prev, { id, name: name.trim(), color: color || CAPTAIN_COLORS[prev.length % CAPTAIN_COLORS.length], order: prev.length }];
        saveDemo({ captains: next });
        return next;
      });
      return;
    }
    if (!db) return;
    await setDoc(doc(db, 'captains', id), {
      name: name.trim(),
      color: color || CAPTAIN_COLORS[captains.length % CAPTAIN_COLORS.length],
      order: captains.length,
      createdAt: serverTimestamp(),
    });
  }, [demoMode, captains.length]);

  const removeCaptain = useCallback(async (captainId) => {
    if (demoMode) {
      setCaptains(prev => {
        const next = prev.filter(c => c.id !== captainId);
        saveDemo({ captains: next });
        return next;
      });
      setAttendance(prev => {
        const next = {};
        for (const [d, v] of Object.entries(prev)) {
          const { [captainId]: _, ...rest } = v;
          next[d] = rest;
        }
        saveDemo({ attendance: next });
        return next;
      });
      return;
    }
    if (!db) return;
    await deleteDoc(doc(db, 'captains', captainId));
    const batch = writeBatch(db);
    for (const dateStr of Object.keys(attendance)) {
      if (attendance[dateStr]?.[captainId] !== undefined) {
        const cleaned = { ...attendance[dateStr] };
        delete cleaned[captainId];
        delete cleaned.updatedAt;
        batch.set(doc(db, 'attendance', dateStr), { ...cleaned, updatedAt: serverTimestamp() });
      }
    }
    await batch.commit();
  }, [demoMode, attendance]);

  const updateCaptain = useCallback(async (captainId, updates) => {
    if (demoMode) {
      setCaptains(prev => {
        const next = prev.map(c => c.id === captainId ? { ...c, ...updates } : c);
        saveDemo({ captains: next });
        return next;
      });
      return;
    }
    if (!db) return;
    await updateDoc(doc(db, 'captains', captainId), { ...updates, updatedAt: serverTimestamp() });
  }, [demoMode]);

  /* ── Day details ──────────────────────────────────────────────────────── */
  const setDayDetail = useCallback(async (dateStr, detail) => {
    if (demoMode) {
      setDayDetails(prev => {
        const next = { ...prev, [dateStr]: { ...(prev[dateStr] || {}), ...detail } };
        saveDemo({ dayDetails: next });
        return next;
      });
      return;
    }
    if (!db) return;
    await setDoc(doc(db, 'dayDetails', dateStr), { ...detail, updatedAt: serverTimestamp() }, { merge: true });
  }, [demoMode]);

  const clearDayDetail = useCallback(async (dateStr) => {
    if (demoMode) {
      setDayDetails(prev => {
        const next = { ...prev };
        delete next[dateStr];
        saveDemo({ dayDetails: next });
        return next;
      });
      return;
    }
    if (!db) return;
    await deleteDoc(doc(db, 'dayDetails', dateStr));
  }, [demoMode]);

  /* ── Derived helpers ──────────────────────────────────────────────────── */
  const getAttendingCaptains = useCallback((dateStr) => {
    const day = attendance[dateStr] || {};
    return captains.filter(c => day[c.id] === true);
  }, [attendance, captains]);

  const isDayCancelled = useCallback((dateStr) => {
    return dayDetails[dateStr]?.cancelled === true;
  }, [dayDetails]);

  const isCaptainAttending = useCallback((dateStr, captainId) => {
    return attendance[dateStr]?.[captainId] === true;
  }, [attendance]);

  const getWeekStats = useCallback((dayDates) => {
    let coveredCount = 0, totalActive = 0;
    const uncoveredDates = [];
    for (const d of dayDates) {
      if (dayDetails[d]?.cancelled) continue;
      totalActive++;
      const count = captains.filter(c => attendance[d]?.[c.id] === true).length;
      if (count >= settings.minCaptainsPerDay) coveredCount++;
      else uncoveredDates.push(d);
    }
    return {
      coveredCount, totalActive, uncoveredDates,
      isCovered:  coveredCount >= settings.minCoveredDays,
      isPartial:  coveredCount > 0 && coveredCount < settings.minCoveredDays,
    };
  }, [dayDetails, attendance, captains, settings.minCaptainsPerDay, settings.minCoveredDays]);

  const getCaptainStats = useCallback(() => {
    const stats = {};
    for (const c of captains) {
      stats[c.id] = Object.values(attendance).reduce((acc, day) => acc + (day[c.id] === true ? 1 : 0), 0);
    }
    return stats;
  }, [captains, attendance]);

  /* ── Expose ───────────────────────────────────────────────────────────── */
  const value = {
    isFirebaseConfigured, demoMode,
    authLoading, dataLoading, loadError, firebaseUser,
    teamVerified, isAdmin, verifyTeamCode, verifyAdminCode, logoutAdmin,
    currentCaptainId, selectCaptain, deselectCaptain,
    currentCaptain: captains.find(c => c.id === currentCaptainId) || null,
    settings, captains, attendance, dayDetails,
    darkMode, toggleDarkMode: () => setDarkMode(d => !d),
    toggleAttendance, updateSettings,
    addCaptain, removeCaptain, updateCaptain,
    setDayDetail, clearDayDetail,
    getAttendingCaptains, isDayCancelled, isCaptainAttending,
    getWeekStats, getCaptainStats,
    CAPTAIN_COLORS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

