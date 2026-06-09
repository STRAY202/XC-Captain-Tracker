import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, useMemo
} from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { CAPTAIN_COLORS, DEFAULT_CAPTAINS } from '../utils/seedData';

// ── Locations ─────────────────────────────────────────────────────────────────
export const LOCATIONS = [
  { id: 'Memorial',  label: 'Memorial',              short: 'Memorial',  color: '#10b981' },
  { id: 'Cutler',    label: 'Cutler Park',            short: 'Cutler',    color: '#3b82f6' },
  { id: 'Peninsula', label: 'Charles River Peninsula',short: 'Peninsula', color: '#8b5cf6' },
];
export function getLocation(id) {
  return LOCATIONS.find(l => l.id === id || l.label === id) ?? LOCATIONS[0];
}

// ── Safe localStorage ─────────────────────────────────────────────────────────
function safeGet(key) {
  try { return window.localStorage.getItem(key); }
  catch { return null; }
}
function safeSet(key, value) {
  try { window.localStorage.setItem(key, String(value)); }
  catch {}
}
function safeGetJSON(key) {
  try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function safeRemove(key) {
  try { window.localStorage.removeItem(key); }
  catch {}
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
    captainCode:     'captain2026',
    weatherLat:      42.2807,
    weatherLon:      -71.2298,
    sheetsUrl:       '',
    workouts:        {},
    weatherOverrides: {},
    timeOverrides:    {},
    activeWeekIndex: 0,
    athleteSlides:   null,
    captainSlides:   null,
  },
};

const STORAGE = {
  TEAM_VERIFIED:      'xc-team-ok',
  CAPTAIN_ID:         'xc-captain',
  ADMIN:              'xc-admin',
  DARK_MODE:          'xc-dark',
  ONBOARDING_DONE:    'xc-onboarding',
  USER_MODE:          'xc-user-mode',
  ATHLETE_NAME:       'xc-athlete-name',
  ATHLETE_ONBOARDED:  'xc-ath-ob',
  CAPTAIN_ONBOARDED:  'xc-cap-ob',
};

// ── DB transformers ────────────────────────────────────────────────────────────
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
    onboarding:        row.onboarding || DEFAULT_SETTINGS.onboarding,
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
  for (const r of rows) {
    if (!out[r.date]) out[r.date] = {};
    out[r.date][r.captain_id] = r.attending;
  }
  return out;
}
function dbToDayDetails(rows) {
  const out = {};
  for (const r of rows) {
    const obj = {};
    if (r.location  != null) obj.location  = r.location;
    if (r.cancelled != null) obj.cancelled = r.cancelled;
    if (r.notes     != null) obj.notes     = r.notes;
    if (Object.keys(obj).length) out[r.date] = obj;
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

const APP_VERSION = 'v3';

export function AppProvider({ children }) {
  const versionOk = safeGet('xc-app-version') === APP_VERSION;

  // Auth / session state
  const [teamVerified,    setTeamVerified]    = useState(() => safeGet(STORAGE.TEAM_VERIFIED) === 'true');
  const [isAdmin,         setIsAdmin]         = useState(() => safeSessionGet(STORAGE.ADMIN) === 'true');
  const [currentCaptainId, setCurrentCaptainIdState] = useState(() => safeGet(STORAGE.CAPTAIN_ID) || null);
  const [userMode,        setUserMode]        = useState(() => {
    const stored = safeGet(STORAGE.USER_MODE);
    if (stored) return stored;
    const id = safeGet(STORAGE.CAPTAIN_ID);
    if (!id) return null;
    return id.startsWith('athlete_') ? 'athlete' : 'captain';
  });
  const [athleteName,     setAthleteName]     = useState(() => safeGet(STORAGE.ATHLETE_NAME) || '');

  // Role-specific onboarding flags
  // Existing sessions skip onboarding — only new sign-ins go through it
  const [athleteOnboarded, setAthleteOnboarded] = useState(() => {
    const hasSession = safeGet(STORAGE.CAPTAIN_ID) !== null;
    if (hasSession) return true;
    return safeGet(STORAGE.ATHLETE_ONBOARDED) === 'true';
  });
  const [captainOnboarded, setCaptainOnboarded] = useState(() => {
    const hasSession = safeGet(STORAGE.CAPTAIN_ID) !== null;
    if (hasSession) return true;
    return safeGet(STORAGE.CAPTAIN_ONBOARDED) === 'true';
  });

  const [darkMode, setDarkMode] = useState(() => {
    if (!versionOk) return true;
    const saved = safeGet(STORAGE.DARK_MODE);
    return saved === null ? true : saved === 'true';
  });

  // Version migration
  useEffect(() => {
    if (safeGet('xc-app-version') !== APP_VERSION) {
      safeSet(STORAGE.DARK_MODE, 'true');
      safeSet('xc-app-version', APP_VERSION);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cloud data
  const [settings,    setSettings]    = useState(DEFAULT_SETTINGS);
  const [captains,    setCaptains]    = useState(DEFAULT_CAPTAINS);
  const [attendance,  setAttendance]  = useState({});
  const [dayDetails,  setDayDetails]  = useState({});
  const [dataLoading, setDataLoading] = useState(true);
  const [syncError,   setSyncError]   = useState(false);
  const [syncErrorMsg, setSyncErrorMsg] = useState('');

  // Stale-closure-safe refs
  const dayDetailsRef  = useRef({});
  const attendanceRef  = useRef({});
  const settingsRef    = useRef(DEFAULT_SETTINGS);
  const captainsRef    = useRef(DEFAULT_CAPTAINS);
  useEffect(() => { dayDetailsRef.current  = dayDetails;  }, [dayDetails]);
  useEffect(() => { attendanceRef.current  = attendance;  }, [attendance]);
  useEffect(() => { settingsRef.current    = settings;    }, [settings]);
  useEffect(() => { captainsRef.current    = captains;    }, [captains]);

  // Dark mode sync to DOM
  useEffect(() => {
    safeSet(STORAGE.DARK_MODE, darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Stale captain cleanup (skip admin and athlete IDs)
  useEffect(() => {
    if (dataLoading || !captains.length || !currentCaptainId) return;
    if (currentCaptainId === 'admin' || currentCaptainId.startsWith('athlete_')) return;
    if (!captains.some(c => c.id === currentCaptainId)) deselectCaptain();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading, captains, currentCaptainId]);

  // Supabase load + realtime
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setSyncError(true);
      setSyncErrorMsg('Supabase not configured (missing env vars)');
      setDataLoading(false);
      return;
    }

    let channel;

    async function seedDatabase() {
      await supabase.from('settings').insert({ id: 'main', ...settingsToDB(DEFAULT_SETTINGS) });
      for (let i = 0; i < DEFAULT_CAPTAINS.length; i++) {
        await supabase.from('captains').insert({
          id: DEFAULT_CAPTAINS[i].id, name: DEFAULT_CAPTAINS[i].name,
          color: DEFAULT_CAPTAINS[i].color, order: i,
        });
      }
    }

    async function load() {
      const failsafe = setTimeout(() => {
        setSyncError(true); setDataLoading(false);
      }, 25000);
      try {
        const [sRes, cRes, aRes, dRes] = await Promise.all([
          supabase.from('settings').select('*').eq('id', 'main').maybeSingle(),
          supabase.from('captains').select('*').order('order', { ascending: true }),
          supabase.from('attendance').select('*'),
          supabase.from('day_details').select('*'),
        ]);
        clearTimeout(failsafe);
        if (sRes.error) throw sRes.error;
        if (cRes.error) throw cRes.error;

        if (!sRes.data) {
          await seedDatabase();
          const [s2, c2] = await Promise.all([
            supabase.from('settings').select('*').eq('id', 'main').single(),
            supabase.from('captains').select('*').order('order', { ascending: true }),
          ]);
          if (s2.data) setSettings(dbToSettings(s2.data));
          if (c2.data?.length) setCaptains(c2.data.map(r => ({ id: r.id, name: r.name, color: r.color, order: r.order })));
        } else {
          setSettings(dbToSettings(sRes.data));
          if (cRes.data?.length) setCaptains(cRes.data.map(r => ({ id: r.id, name: r.name, color: r.color, order: r.order })));
        }
        if (aRes.data?.length) setAttendance(dbToAttendance(aRes.data));
        if (dRes.data?.length) setDayDetails(dbToDayDetails(dRes.data));
        setDataLoading(false);
      } catch (err) {
        clearTimeout(failsafe);
        console.error('[AppContext] load error:', err);
        setSyncError(true);
        setSyncErrorMsg(err?.message || err?.code || String(err));
        setDataLoading(false);
      }
    }

    function setupRealtime() {
      channel = supabase.channel('xc-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, ({ new: row }) => {
          if (row) setSettings(dbToSettings(row));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'captains' }, () => {
          supabase.from('captains').select('*').order('order', { ascending: true })
            .then(({ data }) => { if (data) setCaptains(data.map(r => ({ id: r.id, name: r.name, color: r.color, order: r.order }))); });
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
    const merged = { ...(dayDetailsRef.current[dateStr] || {}), ...patch };
    setDayDetails(prev => ({ ...prev, [dateStr]: merged }));
    supabase.from('day_details').upsert({
      date: dateStr, location: merged.location ?? null,
      cancelled: merged.cancelled ?? false, notes: merged.notes ?? null,
      updated_at: new Date().toISOString(),
    }).then(({ error }) => { if (error) console.error('setDayDetail:', error); });
  }, []);

  const clearDayDetail = useCallback(async (dateStr) => {
    setDayDetails(prev => { const next = { ...prev }; delete next[dateStr]; return next; });
    supabase.from('day_details').delete().eq('date', dateStr)
      .then(({ error }) => { if (error) console.error('clearDayDetail:', error); });
  }, []);

  const toggleAttendance = useCallback(async (dateStr, captainId) => {
    const newVal = !(attendanceRef.current[dateStr]?.[captainId] ?? false);
    setAttendance(prev => ({ ...prev, [dateStr]: { ...(prev[dateStr] || {}), [captainId]: newVal } }));
    supabase.from('attendance').upsert({
      date: dateStr, captain_id: captainId, attending: newVal, updated_at: new Date().toISOString(),
    }).then(({ error }) => { if (error) console.error('toggleAttendance:', error); });
  }, []);

  const isCaptainAttending = useCallback((dateStr, captainId) =>
    attendance[dateStr]?.[captainId] === true,
  [attendance]);

  const updateSettings = useCallback(async (patch) => {
    const merged = { ...settingsRef.current, ...patch };
    setSettings(merged);
    supabase.from('settings').update(settingsToDB(merged)).eq('id', 'main')
      .then(({ error }) => { if (error) console.error('updateSettings:', error); });
  }, []);

  const updateOnboarding = useCallback(async (patch) => {
    const ob = { ...(settingsRef.current.onboarding || {}), ...patch };
    updateSettings({ onboarding: ob });
  }, [updateSettings]);

  const addCaptain = useCallback(async (name, color) => {
    const id = `cap_${Date.now()}`, order = captainsRef.current.length;
    setCaptains(prev => [...prev, { id, name, color, order }]);
    supabase.from('captains').insert({ id, name, color, order, created_at: new Date().toISOString() })
      .then(({ error }) => { if (error) console.error('addCaptain:', error); });
  }, []);

  const removeCaptain = useCallback(async (id) => {
    setCaptains(prev => prev.filter(c => c.id !== id));
    supabase.from('captains').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('removeCaptain:', error); });
  }, []);

  const updateCaptain = useCallback(async (id, patch) => {
    setCaptains(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    supabase.from('captains').update(patch).eq('id', id)
      .then(({ error }) => { if (error) console.error('updateCaptain:', error); });
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────────
  const verifyTeamCode = useCallback(async (code) => {
    const ok = code.trim().toLowerCase() === (settingsRef.current.teamCode || '').toLowerCase();
    if (ok) { setTeamVerified(true); safeSet(STORAGE.TEAM_VERIFIED, 'true'); }
    return ok;
  }, []);

  const verifyAdminCode = useCallback((code) => {
    const ok = code.trim() === settingsRef.current.adminCode;
    if (ok) { setIsAdmin(true); safeSessionSet(STORAGE.ADMIN, 'true'); }
    return ok;
  }, []);

  const verifyCaptainCode = useCallback((code) => {
    const stored = settingsRef.current.onboarding?.captainCode || 'captain2026';
    return code.trim() === stored;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false); safeSessionRemove(STORAGE.ADMIN);
  }, []);

  const deselectCaptain = useCallback(() => {
    setCurrentCaptainIdState(null); setIsAdmin(false);
    setTeamVerified(false); setUserMode(null); setAthleteName('');
    safeRemove(STORAGE.CAPTAIN_ID); safeRemove(STORAGE.TEAM_VERIFIED);
    safeRemove(STORAGE.USER_MODE); safeRemove(STORAGE.ATHLETE_NAME);
    safeSessionRemove(STORAGE.ADMIN);
  }, []);

  const selectCaptain = useCallback((id) => {
    setCurrentCaptainIdState(id); setUserMode('captain');
    safeSet(STORAGE.CAPTAIN_ID, id); safeSet(STORAGE.USER_MODE, 'captain');
  }, []);

  const selectAthleteMode = useCallback((name) => {
    const slug = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const id   = `athlete_${slug}`;
    const now  = new Date().toISOString();

    // Track login stats locally
    const statsKey = `xc-ath-stats-${id}`;
    const existing = safeGetJSON(statsKey) || {};
    const stats = {
      id,
      name:       name.trim(),
      firstLogin: existing.firstLogin || now,
      lastLogin:  now,
      loginCount: (existing.loginCount || 0) + 1,
    };
    safeSet(statsKey, JSON.stringify(stats));

    // Sync to settings so captains can see athlete activity
    const athletes = [...(settingsRef.current.onboarding?.athletes || [])];
    const idx = athletes.findIndex(a => a.id === id);
    if (idx >= 0) {
      athletes[idx] = { ...athletes[idx], name: stats.name, lastLogin: now, loginCount: stats.loginCount };
    } else {
      athletes.push(stats);
    }
    updateOnboarding({ athletes });

    setCurrentCaptainIdState(id); setUserMode('athlete'); setAthleteName(name.trim());
    safeSet(STORAGE.CAPTAIN_ID, id); safeSet(STORAGE.USER_MODE, 'athlete');
    safeSet(STORAGE.ATHLETE_NAME, name.trim());
  }, [updateOnboarding]);

  const markAthleteOnboarded = useCallback(() => {
    setAthleteOnboarded(true); safeSet(STORAGE.ATHLETE_ONBOARDED, 'true');
  }, []);

  const markCaptainOnboarded = useCallback(() => {
    setCaptainOnboarded(true); safeSet(STORAGE.CAPTAIN_ONBOARDED, 'true');
  }, []);

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), []);

  const setWorkout = useCallback(async (dateStr, text) => {
    const next = { ...(settingsRef.current.onboarding?.workouts || {}) };
    if (text && text.trim()) {
      next[dateStr] = text.trim();
    } else {
      delete next[dateStr];
    }
    updateOnboarding({ workouts: next });
  }, [updateOnboarding]);

  const setWeatherOverride = useCallback(async (dateStr, text) => {
    const next = { ...(settingsRef.current.onboarding?.weatherOverrides || {}) };
    if (text && text.trim()) { next[dateStr] = text.trim(); } else { delete next[dateStr]; }
    updateOnboarding({ weatherOverrides: next });
  }, [updateOnboarding]);

  const setTimeOverride = useCallback(async (dateStr, text) => {
    const next = { ...(settingsRef.current.onboarding?.timeOverrides || {}) };
    if (text && text.trim()) { next[dateStr] = text.trim(); } else { delete next[dateStr]; }
    updateOnboarding({ timeOverrides: next });
  }, [updateOnboarding]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const currentCaptain = useMemo(
    () => captains.find(c => c.id === currentCaptainId) || null,
    [captains, currentCaptainId]
  );

  const getAttendingCaptains = useCallback((dateStr) => {
    const day = attendance[dateStr] || {};
    return captains.filter(c => day[c.id] === true);
  }, [attendance, captains]);

  const isDayCancelled = useCallback((dateStr) =>
    dayDetails[dateStr]?.cancelled === true,
  [dayDetails]);

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
    return { coveredCount, totalActive, uncoveredDates,
      isCovered: coveredCount >= settings.minCoveredDays,
      isPartial: coveredCount > 0 && coveredCount < settings.minCoveredDays };
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

  // Active week index for athlete view
  const activeWeekIndex = settings.onboarding?.activeWeekIndex ?? 0;

  const workouts         = settings.onboarding?.workouts          || {};
  const weatherOverrides = settings.onboarding?.weatherOverrides  || {};
  const timeOverrides    = settings.onboarding?.timeOverrides     || {};

  // ── Context value ─────────────────────────────────────────────────────────────
  return (
    <AppContext.Provider value={{
      settings, captains, attendance, dayDetails, workouts, weatherOverrides, timeOverrides,
      dataLoading, syncError, syncErrorMsg,
      demoMode: false, authLoading: false,
      teamVerified, isAdmin, currentCaptainId, currentCaptain,
      userMode, athleteName,
      athleteOnboarded, captainOnboarded,
      activeWeekIndex,
      darkMode, CAPTAIN_COLORS, LOCATIONS,
      verifyTeamCode, verifyAdminCode, verifyCaptainCode, logoutAdmin,
      selectAthleteMode, selectCaptain,
      setCurrentCaptainId: selectCaptain,
      deselectCaptain, toggleDarkMode, setWorkout, setWeatherOverride, setTimeOverride,
      markAthleteOnboarded, markCaptainOnboarded,
      addCaptain, removeCaptain, updateCaptain,
      setDayDetail, clearDayDetail,
      toggleAttendance, isCaptainAttending,
      getAttendingCaptains, isDayCancelled,
      updateSettings, updateOnboarding,
      getWeekStats, getCaptainStats,
    }}>
      {children}
    </AppContext.Provider>
  );
}
