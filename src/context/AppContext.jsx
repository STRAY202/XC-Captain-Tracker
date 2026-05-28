import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, useMemo
} from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { CAPTAIN_COLORS, DEFAULT_CAPTAINS } from '../utils/seedData';

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

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  teamName:          'XC Summer Training',
  startDate:         '2026-06-15',
  numWeeks:          11,
  defaultTime:       '8:00 AM',
  practiceDays:      [0, 1, 2, 3, 4, 5],
  minCoveredDays:    3,
  minCaptainsPerDay: 1,
  teamCode:          'xc2026',
  adminCode:         'admin2026',
  announcements:     [],
  onboarding: {
    welcomeTitle:    '',
    welcomeSubtitle: '',
    slides:          [],
  },
};

const STORAGE = {
  TEAM_VERIFIED:   'xc-team-ok',
  CAPTAIN_ID:      'xc-captain',
  ADMIN:           'xc-admin',
  DARK_MODE:       'xc-dark',
  ONBOARDING_DONE: 'xc-onboarding',
};

// ── Data transformation helpers (Supabase snake_case ↔ app camelCase) ─────────

function dbToSettings(row) {
  return {
    teamName:          row.team_name,
    startDate:         row.start_date,
    numWeeks:          row.num_weeks,
    defaultTime:       row.default_time,
    practiceDays:      row.practice_days,
    minCoveredDays:    row.min_covered_days,
    minCaptainsPerDay: row.min_captains_per_day,
    teamCode:          row.team_code,
    adminCode:         row.admin_code,
    announcements:     row.announcements || [],
    onboarding:        row.onboarding || { welcomeTitle: '', welcomeSubtitle: '', slides: [] },
  };
}

function settingsToDB(s) {
  return {
    team_name:            s.teamName,
    start_date:           s.startDate,
    num_weeks:            s.numWeeks,
    default_time:         s.defaultTime,
    practice_days:        s.practiceDays,
    min_covered_days:     s.minCoveredDays,
    min_captains_per_day: s.minCaptainsPerDay,
    team_code:            s.teamCode,
    admin_code:           s.adminCode,
    announcements:        s.announcements,
    onboarding:           s.onboarding,
    updated_at:           new Date().toISOString(),
  };
}

function dbToAttendance(rows) {
  const out = {};
  for (const row of rows) {
    if (!out[row.date]) out[row.date] = {};
    out[row.date][row.captain_id] = row.attending;
  }
  return out;
}

function dbToDayDetails(rows) {
  const out = {};
  for (const row of rows) {
    const obj = {};
    if (row.location  != null) obj.location  = row.location;
    if (row.cancelled != null) obj.cancelled = row.cancelled;
    if (row.notes     != null) obj.notes     = row.notes;
    if (Object.keys(obj).length) out[row.date] = obj;
  }
  return out;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

// Bump this string any time you want all users to get a fresh onboarding + dark-mode reset.
const APP_VERSION = 'v2';

export function AppProvider({ children }) {
  // Version migration: runs synchronously inside lazy initialisers so there is no flash.
  // If the stored version doesn't match APP_VERSION we treat onboarding as unseen and
  // reset dark mode back to the default (dark).  Captain / team login is preserved.
  const versionOk = safeGet('xc-app-version') === APP_VERSION;

  // localStorage-backed UI/session state (device preferences only)
  const [teamVerified, setTeamVerified] = useState(() => safeGet(STORAGE.TEAM_VERIFIED) === 'true');
  const [isAdmin, setIsAdmin] = useState(() => safeSessionGet(STORAGE.ADMIN) === 'true');
  const [currentCaptainId, setCurrentCaptainIdState] = useState(() => safeGet(STORAGE.CAPTAIN_ID) || null);
  const [darkMode, setDarkMode] = useState(() => {
    if (!versionOk) return true;           // always start dark after a version bump
    const saved = safeGet(STORAGE.DARK_MODE);
    return saved === null ? true : saved === 'true';
  });
  const [onboardingDone, setOnboardingDone] = useState(() => {
    if (!versionOk) return false;          // always show tour after a version bump
    return safeGet(STORAGE.ONBOARDING_DONE) === 'true';
  });

  // Persist the migration so the reset only happens once per version
  useEffect(() => {
    if (safeGet('xc-app-version') !== APP_VERSION) {
      safeRemove(STORAGE.ONBOARDING_DONE);
      safeSet(STORAGE.DARK_MODE, 'true');
      safeSet('xc-app-version', APP_VERSION);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shared cloud data state
  const [settings, setSettings]     = useState(DEFAULT_SETTINGS);
  const [captains, setCaptains]     = useState(DEFAULT_CAPTAINS);
  const [attendance, setAttendance] = useState({});
  const [dayDetails, setDayDetails] = useState({});
  const [dataLoading, setDataLoading] = useState(true);
  const [syncError, setSyncError]   = useState(false);

  // Refs for stale-closure-safe callbacks
  const dayDetailsRef  = useRef({});
  const attendanceRef  = useRef({});
  const settingsRef    = useRef(DEFAULT_SETTINGS);
  const captainsRef    = useRef([]);
  useEffect(() => { dayDetailsRef.current  = dayDetails;  }, [dayDetails]);
  useEffect(() => { attendanceRef.current  = attendance;  }, [attendance]);
  useEffect(() => { settingsRef.current    = settings;    }, [settings]);
  useEffect(() => { captainsRef.current    = captains;    }, [captains]);

  // Dark mode sync
  useEffect(() => {
    safeSet(STORAGE.DARK_MODE, darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Stale captain cleanup
  useEffect(() => {
    if (dataLoading || !captains.length || !currentCaptainId) return;
    if (currentCaptainId === 'admin') return;
    const found = captains.some(c => c.id === currentCaptainId);
    if (!found) deselectCaptain();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading, captains, currentCaptainId]);

  // Load + realtime
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('[AppContext] Supabase not configured — running with defaults');
      setSyncError(true);
      setDataLoading(false);
      return;
    }

    let channel;

    async function seedDatabase() {
      await supabase.from('settings').insert({ id: 'main', ...settingsToDB(DEFAULT_SETTINGS) });
      for (let i = 0; i < DEFAULT_CAPTAINS.length; i++) {
        await supabase.from('captains').insert({
          id: DEFAULT_CAPTAINS[i].id,
          name: DEFAULT_CAPTAINS[i].name,
          color: DEFAULT_CAPTAINS[i].color,
          order: i,
        });
      }
    }

    async function load() {
      // Always resolve within 12s — never leave the app stuck spinning
      const failsafe = setTimeout(() => {
        console.warn('[AppContext] Load timeout — showing app with defaults');
        setSyncError(true);
        setDataLoading(false);
      }, 12000);

      try {
        const [sRes, cRes, aRes, dRes] = await Promise.all([
          supabase.from('settings').select('*').eq('id', 'main').maybeSingle(),
          supabase.from('captains').select('*').order('order', { ascending: true }),
          supabase.from('attendance').select('*'),
          supabase.from('day_details').select('*'),
        ]);

        clearTimeout(failsafe);

        // Throw on any table error so the catch block preserves DEFAULT_CAPTAINS
        if (sRes.error) throw sRes.error;
        if (cRes.error) throw cRes.error;

        if (!sRes.data) {
          // Fresh DB — seed settings + default captains then reload
          await seedDatabase();
          const [s2, c2] = await Promise.all([
            supabase.from('settings').select('*').eq('id', 'main').single(),
            supabase.from('captains').select('*').order('order', { ascending: true }),
          ]);
          if (s2.data) setSettings(dbToSettings(s2.data));
          if (c2.data?.length) setCaptains(c2.data.map(r => ({ id: r.id, name: r.name, color: r.color, order: r.order })));
        } else {
          setSettings(dbToSettings(sRes.data));
          // Only overwrite captains if Supabase actually returned some — otherwise keep defaults
          if (cRes.data?.length) {
            setCaptains(cRes.data.map(r => ({ id: r.id, name: r.name, color: r.color, order: r.order })));
          }
        }

        if (aRes.data?.length) setAttendance(dbToAttendance(aRes.data));
        if (dRes.data?.length) setDayDetails(dbToDayDetails(dRes.data));
        setDataLoading(false);
      } catch (err) {
        clearTimeout(failsafe);
        console.error('[AppContext] load error:', err);
        setSyncError(true);
        setDataLoading(false);
      }
    }

    function setupRealtime() {
      channel = supabase.channel('xc-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, ({ new: row }) => {
          if (row) setSettings(dbToSettings(row));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'captains' }, () => {
          supabase.from('captains').select('*').order('order', { ascending: true }).then(({ data }) => {
            if (data) setCaptains(data.map(r => ({ id: r.id, name: r.name, color: r.color, order: r.order })));
          });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, ({ new: r }) => {
          setAttendance(prev => ({ ...prev, [r.date]: { ...(prev[r.date] || {}), [r.captain_id]: r.attending } }));
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance' }, ({ new: r }) => {
          setAttendance(prev => ({ ...prev, [r.date]: { ...(prev[r.date] || {}), [r.captain_id]: r.attending } }));
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'attendance' }, ({ old: r }) => {
          setAttendance(prev => {
            const next = { ...prev };
            if (next[r.date]) { next[r.date] = { ...next[r.date] }; delete next[r.date][r.captain_id]; }
            return next;
          });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'day_details' }, ({ new: r }) => {
          setDayDetails(prev => ({ ...prev, [r.date]: { location: r.location, cancelled: r.cancelled, notes: r.notes } }));
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'day_details' }, ({ new: r }) => {
          setDayDetails(prev => ({ ...prev, [r.date]: { location: r.location, cancelled: r.cancelled, notes: r.notes } }));
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'day_details' }, ({ old: r }) => {
          setDayDetails(prev => { const next = { ...prev }; delete next[r.date]; return next; });
        })
        .subscribe();
    }

    load();
    setupRealtime();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  // ── Write operations ──────────────────────────────────────────────────────────

  const setDayDetail = useCallback(async (dateStr, patch) => {
    const current = dayDetailsRef.current[dateStr] || {};
    const merged  = { ...current, ...patch };
    setDayDetails(prev => ({ ...prev, [dateStr]: merged }));
    supabase.from('day_details').upsert({
      date: dateStr, location: merged.location ?? null, cancelled: merged.cancelled ?? false,
      notes: merged.notes ?? null, updated_at: new Date().toISOString(),
    }).then(({ error }) => { if (error) console.error('setDayDetail:', error); });
  }, []);

  const clearDayDetail = useCallback(async (dateStr) => {
    setDayDetails(prev => { const next = { ...prev }; delete next[dateStr]; return next; });
    supabase.from('day_details').delete().eq('date', dateStr)
      .then(({ error }) => { if (error) console.error('clearDayDetail:', error); });
  }, []);

  const toggleAttendance = useCallback(async (dateStr, captainId) => {
    const current = attendanceRef.current[dateStr]?.[captainId] ?? false;
    const newVal  = !current;
    setAttendance(prev => ({ ...prev, [dateStr]: { ...(prev[dateStr] || {}), [captainId]: newVal } }));
    supabase.from('attendance').upsert({
      date: dateStr, captain_id: captainId, attending: newVal, updated_at: new Date().toISOString(),
    }).then(({ error }) => { if (error) console.error('toggleAttendance:', error); });
  }, []);

  const isCaptainAttending = useCallback((dateStr, captainId) => {
    return attendance[dateStr]?.[captainId] === true;
  }, [attendance]);

  const updateSettings = useCallback(async (patch) => {
    const merged = { ...settingsRef.current, ...patch };
    setSettings(merged);
    supabase.from('settings').update(settingsToDB(merged)).eq('id', 'main')
      .then(({ error }) => { if (error) console.error('updateSettings:', error); });
  }, []);

  const addCaptain = useCallback(async (name, color) => {
    const id    = `cap_${Date.now()}`;
    const order = captainsRef.current.length;
    setCaptains(prev => [...prev, { id, name, color, order }]);
    supabase.from('captains').insert({ id, name, color, order, created_at: new Date().toISOString() })
      .then(({ error }) => { if (error) console.error('addCaptain:', error); });
  }, []);

  const removeCaptain = useCallback(async (id) => {
    setCaptains(prev => prev.filter(c => c.id !== id));
    setAttendance(prev => {
      const next = {};
      for (const [date, map] of Object.entries(prev)) {
        const m = { ...map }; delete m[id]; next[date] = m;
      }
      return next;
    });
    supabase.from('captains').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('removeCaptain:', error); });
  }, []);

  const updateCaptain = useCallback(async (id, patch) => {
    setCaptains(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    supabase.from('captains').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
      .then(({ error }) => { if (error) console.error('updateCaptain:', error); });
  }, []);

  // ── Auth callbacks ────────────────────────────────────────────────────────────

  const verifyTeamCode = useCallback(async (code) => {
    const correct = code.trim().toLowerCase() === (settingsRef.current.teamCode || '').toLowerCase();
    if (correct) { setTeamVerified(true); safeSet(STORAGE.TEAM_VERIFIED, 'true'); }
    return correct;
  }, []);

  const verifyAdminCode = useCallback((code) => {
    const correct = code.trim() === settingsRef.current.adminCode;
    if (correct) { setIsAdmin(true); safeSessionSet(STORAGE.ADMIN, 'true'); }
    return correct;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    safeSessionRemove(STORAGE.ADMIN);
  }, []);

  const deselectCaptain = useCallback(() => {
    setCurrentCaptainIdState(null);
    setIsAdmin(false);
    setTeamVerified(false);
    safeRemove(STORAGE.CAPTAIN_ID);
    safeRemove(STORAGE.TEAM_VERIFIED);
    safeSessionRemove(STORAGE.ADMIN);
  }, []);

  const selectCaptain = useCallback((id) => {
    setCurrentCaptainIdState(id);
    safeSet(STORAGE.CAPTAIN_ID, id);
  }, []);

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), []);

  const markOnboardingDone = useCallback(() => {
    setOnboardingDone(true);
    safeSet(STORAGE.ONBOARDING_DONE, 'true');
  }, []);

  // ── Derived helpers ───────────────────────────────────────────────────────────

  const currentCaptain = useMemo(
    () => captains.find(c => c.id === currentCaptainId) || null,
    [captains, currentCaptainId]
  );

  const getAttendingCaptains = useCallback((dateStr) => {
    const day = attendance[dateStr] || {};
    return captains.filter(c => day[c.id] === true);
  }, [attendance, captains]);

  const isDayCancelled = useCallback((dateStr) => {
    return dayDetails[dateStr]?.cancelled === true;
  }, [dayDetails]);

  const getWeekStats = useCallback((days) => {
    let coveredCount = 0, totalActive = 0;
    const uncoveredDates = [];
    for (const d of days) {
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
  }, [captains, attendance, dayDetails, settings]);

  const getCaptainStats = useCallback(() => {
    const stats = {};
    for (const [date, map] of Object.entries(attendance)) {
      if (dayDetails[date]?.cancelled) continue;
      for (const [cid, val] of Object.entries(map)) {
        if (val) stats[cid] = (stats[cid] || 0) + 1;
      }
    }
    return stats;
  }, [attendance, dayDetails]);

  // ── Context value ─────────────────────────────────────────────────────────────

  return (
    <AppContext.Provider value={{
      settings, captains, attendance, dayDetails,
      dataLoading, syncError,
      demoMode: false, authLoading: false,
      teamVerified, isAdmin, currentCaptainId, currentCaptain,
      darkMode, onboardingDone,
      CAPTAIN_COLORS,
      verifyTeamCode, verifyAdminCode, logoutAdmin,
      setCurrentCaptainId: selectCaptain,
      selectCaptain,
      deselectCaptain, toggleDarkMode, markOnboardingDone,
      addCaptain, removeCaptain, updateCaptain,
      setDayDetail, clearDayDetail,
      toggleAttendance, isCaptainAttending,
      getAttendingCaptains, isDayCancelled,
      updateSettings,
      getWeekStats, getCaptainStats,
    }}>
      {children}
    </AppContext.Provider>
  );
}
