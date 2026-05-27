import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef
} from 'react';
import {
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc, collection, onSnapshot, setDoc, updateDoc,
  deleteDoc, serverTimestamp, writeBatch, query, orderBy,
  getDoc,
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
  practiceDays:      [0, 1, 2, 3, 4],   // 0 = Mon offset
  minCoveredDays:    3,
  minCaptainsPerDay: 1,
  teamCode:          'xc2026',
  adminCode:         'admin2026',
};

const STORAGE = {
  TEAM_VERIFIED: 'xc-team-ok',
  CAPTAIN_ID:    'xc-captain',
  ADMIN:         'xc-admin',        // sessionStorage
  DARK_MODE:     'xc-dark',
};

// ── Context ───────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  /* ── Auth ─────────────────────────────────────────────────────────────── */
  const [firebaseUser,  setFirebaseUser]  = useState(null);
  const [authLoading,   setAuthLoading]   = useState(isFirebaseConfigured);

  /* ── Access ───────────────────────────────────────────────────────────── */
  const [teamVerified, setTeamVerified] = useState(
    () => localStorage.getItem(STORAGE.TEAM_VERIFIED) === 'true'
  );
  const [isAdmin, setIsAdmin] = useState(
    () => sessionStorage.getItem(STORAGE.ADMIN) === 'true'
  );

  /* ── Captain ──────────────────────────────────────────────────────────── */
  const [currentCaptainId, setCurrentCaptainId] = useState(
    () => localStorage.getItem(STORAGE.CAPTAIN_ID) || null
  );

  /* ── Dark mode ────────────────────────────────────────────────────────── */
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(STORAGE.DARK_MODE) === 'true'
  );

  /* ── Firestore data ───────────────────────────────────────────────────── */
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);
  const [captains,    setCaptains]    = useState([]);
  const [attendance,  setAttendance]  = useState({});   // { dateStr: { capId: bool } }
  const [dayDetails,  setDayDetails]  = useState({});   // { dateStr: { workoutType, ... } }
  const [dataLoading, setDataLoading] = useState(true);

  const initializing = useRef(false);

  /* ── Dark mode side-effect ────────────────────────────────────────────── */
  useEffect(() => {
    localStorage.setItem(STORAGE.DARK_MODE, darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  /* ── Firebase Anonymous Auth ──────────────────────────────────────────── */
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
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
          console.error('Anonymous sign-in failed:', err);
          setAuthLoading(false);
        }
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  /* ── Firestore Listeners ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !firebaseUser) return;

    const unsubs = [];

    // config/main
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
      }, (err) => {
        console.error('config/main listener error:', err);
        setDataLoading(false);
      })
    );

    // captains (ordered)
    unsubs.push(
      onSnapshot(
        query(collection(db, 'captains'), orderBy('order', 'asc')),
        (snap) => {
          setCaptains(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        },
        (err) => console.error('captains listener error:', err)
      )
    );

    // attendance (all docs)
    unsubs.push(
      onSnapshot(collection(db, 'attendance'), (snap) => {
        const data = {};
        snap.docs.forEach(d => { data[d.id] = d.data(); });
        setAttendance(data);
      }, (err) => console.error('attendance listener error:', err))
    );

    // dayDetails (all docs)
    unsubs.push(
      onSnapshot(collection(db, 'dayDetails'), (snap) => {
        const data = {};
        snap.docs.forEach(d => { data[d.id] = d.data(); });
        setDayDetails(data);
      }, (err) => console.error('dayDetails listener error:', err))
    );

    return () => unsubs.forEach(u => u());
  }, [firebaseUser]);

  /* ── First-run initialization ─────────────────────────────────────────── */
  async function initDatabase() {
    const seed = generateSeedData(DEFAULT_SETTINGS.startDate);
    const batch = writeBatch(db);

    // Config
    batch.set(doc(db, 'config', 'main'), {
      ...DEFAULT_SETTINGS,
      createdAt: serverTimestamp(),
    });

    // Captains
    seed.captains.forEach((cap, i) => {
      batch.set(doc(db, 'captains', cap.id), {
        name:      cap.name,
        color:     cap.color,
        order:     i,
        createdAt: serverTimestamp(),
      });
    });

    // Day details
    Object.entries(seed.dayDetails).forEach(([dateStr, detail]) => {
      batch.set(doc(db, 'dayDetails', dateStr), {
        ...detail,
        updatedAt: serverTimestamp(),
      });
    });

    // Attendance
    Object.entries(seed.attendance).forEach(([dateStr, data]) => {
      batch.set(doc(db, 'attendance', dateStr), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  /* ── Team/Admin verification ──────────────────────────────────────────── */
  const verifyTeamCode = useCallback(async (code) => {
    if (!isFirebaseConfigured) {
      setTeamVerified(true);
      localStorage.setItem(STORAGE.TEAM_VERIFIED, 'true');
      return true;
    }
    const correct = code.trim().toLowerCase() === (settings.teamCode || '').toLowerCase();
    if (correct) {
      setTeamVerified(true);
      localStorage.setItem(STORAGE.TEAM_VERIFIED, 'true');
    }
    return correct;
  }, [settings.teamCode]);

  const verifyAdminCode = useCallback((code) => {
    const correct = code.trim() === settings.adminCode;
    if (correct) {
      setIsAdmin(true);
      sessionStorage.setItem(STORAGE.ADMIN, 'true');
    }
    return correct;
  }, [settings.adminCode]);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    sessionStorage.removeItem(STORAGE.ADMIN);
  }, []);

  /* ── Captain selection ────────────────────────────────────────────────── */
  const selectCaptain = useCallback((id) => {
    setCurrentCaptainId(id);
    localStorage.setItem(STORAGE.CAPTAIN_ID, id);
  }, []);

  const deselectCaptain = useCallback(() => {
    setCurrentCaptainId(null);
    localStorage.removeItem(STORAGE.CAPTAIN_ID);
  }, []);

  /* ── Attendance ───────────────────────────────────────────────────────── */
  const toggleAttendance = useCallback(async (dateStr, captainId) => {
    if (!db) return;
    const current = attendance[dateStr]?.[captainId] === true;
    try {
      await setDoc(
        doc(db, 'attendance', dateStr),
        { [captainId]: !current, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (err) {
      console.error('toggleAttendance failed:', err);
    }
  }, [attendance]);

  /* ── Settings ─────────────────────────────────────────────────────────── */
  const updateSettings = useCallback(async (updates) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'config', 'main'), {
        ...updates,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('updateSettings failed:', err);
    }
  }, []);

  /* ── Captains ─────────────────────────────────────────────────────────── */
  const addCaptain = useCallback(async (name, color) => {
    if (!db) return;
    const id = `cap_${Date.now()}`;
    await setDoc(doc(db, 'captains', id), {
      name:      name.trim(),
      color:     color || CAPTAIN_COLORS[captains.length % CAPTAIN_COLORS.length],
      order:     captains.length,
      createdAt: serverTimestamp(),
    });
  }, [captains.length]);

  const removeCaptain = useCallback(async (captainId) => {
    if (!db) return;
    await deleteDoc(doc(db, 'captains', captainId));
    // Also clean up attendance
    const batch = writeBatch(db);
    for (const dateStr of Object.keys(attendance)) {
      if (attendance[dateStr]?.[captainId] !== undefined) {
        const ref = doc(db, 'attendance', dateStr);
        // Firestore FieldValue.delete() workaround with merge false:
        // Re-set doc minus that field
        const cleaned = { ...attendance[dateStr] };
        delete cleaned[captainId];
        delete cleaned.updatedAt;
        batch.set(ref, { ...cleaned, updatedAt: serverTimestamp() });
      }
    }
    await batch.commit();
  }, [attendance]);

  const updateCaptain = useCallback(async (captainId, updates) => {
    if (!db) return;
    await updateDoc(doc(db, 'captains', captainId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }, []);

  /* ── Day details ──────────────────────────────────────────────────────── */
  const setDayDetail = useCallback(async (dateStr, detail) => {
    if (!db) return;
    await setDoc(
      doc(db, 'dayDetails', dateStr),
      { ...detail, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }, []);

  const clearDayDetail = useCallback(async (dateStr) => {
    if (!db) return;
    await deleteDoc(doc(db, 'dayDetails', dateStr));
  }, []);

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
    let coveredCount  = 0;
    let totalActive   = 0;
    const uncoveredDates = [];

    for (const d of dayDates) {
      if (dayDetails[d]?.cancelled) continue;
      totalActive++;
      const count = captains.filter(c => attendance[d]?.[c.id] === true).length;
      if (count >= settings.minCaptainsPerDay) {
        coveredCount++;
      } else {
        uncoveredDates.push(d);
      }
    }

    return {
      coveredCount,
      totalActive,
      uncoveredDates,
      isCovered:  coveredCount >= settings.minCoveredDays,
      isPartial:  coveredCount > 0 && coveredCount < settings.minCoveredDays,
    };
  }, [dayDetails, attendance, captains, settings.minCaptainsPerDay, settings.minCoveredDays]);

  const getCaptainStats = useCallback(() => {
    const stats = {};
    for (const c of captains) {
      stats[c.id] = Object.values(attendance).reduce((acc, day) => {
        return acc + (day[c.id] === true ? 1 : 0);
      }, 0);
    }
    return stats;
  }, [captains, attendance]);

  /* ── Expose ───────────────────────────────────────────────────────────── */
  const value = {
    // Status
    isFirebaseConfigured,
    authLoading,
    dataLoading,
    firebaseUser,

    // Access
    teamVerified,
    isAdmin,
    verifyTeamCode,
    verifyAdminCode,
    logoutAdmin,

    // Captain identity
    currentCaptainId,
    selectCaptain,
    deselectCaptain,
    currentCaptain: captains.find(c => c.id === currentCaptainId) || null,

    // Data
    settings,
    captains,
    attendance,
    dayDetails,

    // Dark mode
    darkMode,
    toggleDarkMode: () => setDarkMode(d => !d),

    // Mutations
    toggleAttendance,
    updateSettings,
    addCaptain,
    removeCaptain,
    updateCaptain,
    setDayDetail,
    clearDayDetail,

    // Derived
    getAttendingCaptains,
    isDayCancelled,
    isCaptainAttending,
    getWeekStats,
    getCaptainStats,

    // Constants available to UI
    CAPTAIN_COLORS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
