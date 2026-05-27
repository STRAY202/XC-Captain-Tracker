import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'xc-captain-tracker-v1';

const CAPTAIN_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
];

const DEFAULT_CAPTAINS = [
  { id: '1', name: 'Alex', color: CAPTAIN_COLORS[0] },
  { id: '2', name: 'Jordan', color: CAPTAIN_COLORS[1] },
  { id: '3', name: 'Sam', color: CAPTAIN_COLORS[2] },
  { id: '4', name: 'Taylor', color: CAPTAIN_COLORS[3] },
];

const DEFAULT_STATE = {
  captains: DEFAULT_CAPTAINS,
  attendance: {},       // { "YYYY-MM-DD": ["captain-id", ...] }
  dayOverrides: {},     // { "YYYY-MM-DD": { cancelled, optional, customTime } }
  settings: {
    teamName: 'XC Summer Training',
    startDate: '2026-06-15',
    numWeeks: 11,
    defaultTime: '8:00 AM',
    practiceDays: [0, 1, 2, 3, 4], // Mon–Fri offsets
    minCoveredDays: 3,
    minCaptainsPerDay: 1,
    darkMode: false,
  },
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);
    // Merge with defaults in case new fields added
    return {
      ...DEFAULT_STATE,
      ...saved,
      settings: { ...DEFAULT_STATE.settings, ...saved.settings },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

export function useStore() {
  const [state, setState] = useState(loadState);

  // Auto-save whenever state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // ── Attendance ──────────────────────────────────────────────────────────────

  const toggleAttendance = useCallback((dateStr, captainId) => {
    setState(prev => {
      const current = prev.attendance[dateStr] || [];
      const isAttending = current.includes(captainId);
      const updated = isAttending
        ? current.filter(id => id !== captainId)
        : [...current, captainId];
      return {
        ...prev,
        attendance: { ...prev.attendance, [dateStr]: updated },
      };
    });
  }, []);

  const setDayAttendance = useCallback((dateStr, captainIds) => {
    setState(prev => ({
      ...prev,
      attendance: { ...prev.attendance, [dateStr]: captainIds },
    }));
  }, []);

  // ── Day Overrides ────────────────────────────────────────────────────────────

  const setDayOverride = useCallback((dateStr, overrideData) => {
    setState(prev => ({
      ...prev,
      dayOverrides: {
        ...prev.dayOverrides,
        [dateStr]: { ...(prev.dayOverrides[dateStr] || {}), ...overrideData },
      },
    }));
  }, []);

  const clearDayOverride = useCallback((dateStr) => {
    setState(prev => {
      const next = { ...prev.dayOverrides };
      delete next[dateStr];
      return { ...prev, dayOverrides: next };
    });
  }, []);

  // ── Captains ─────────────────────────────────────────────────────────────────

  const addCaptain = useCallback((name) => {
    setState(prev => {
      const usedColors = prev.captains.map(c => c.color);
      const color = CAPTAIN_COLORS.find(c => !usedColors.includes(c)) || CAPTAIN_COLORS[prev.captains.length % CAPTAIN_COLORS.length];
      const newCaptain = {
        id: String(Date.now()),
        name: name.trim(),
        color,
      };
      return { ...prev, captains: [...prev.captains, newCaptain] };
    });
  }, []);

  const removeCaptain = useCallback((captainId) => {
    setState(prev => {
      // Also remove from all attendance records
      const attendance = {};
      for (const [date, ids] of Object.entries(prev.attendance)) {
        attendance[date] = ids.filter(id => id !== captainId);
      }
      return {
        ...prev,
        captains: prev.captains.filter(c => c.id !== captainId),
        attendance,
      };
    });
  }, []);

  const updateCaptain = useCallback((captainId, updates) => {
    setState(prev => ({
      ...prev,
      captains: prev.captains.map(c => c.id === captainId ? { ...c, ...updates } : c),
    }));
  }, []);

  // ── Settings ─────────────────────────────────────────────────────────────────

  const updateSettings = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, darkMode: !prev.settings.darkMode },
    }));
  }, []);

  // ── Reset ────────────────────────────────────────────────────────────────────

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  // ── Derived helpers ───────────────────────────────────────────────────────────

  const getAttendanceForDay = useCallback((dateStr) => {
    return state.attendance[dateStr] || [];
  }, [state.attendance]);

  const getCaptainsForDay = useCallback((dateStr) => {
    const ids = state.attendance[dateStr] || [];
    return ids.map(id => state.captains.find(c => c.id === id)).filter(Boolean);
  }, [state.attendance, state.captains]);

  const isCaptainAttending = useCallback((dateStr, captainId) => {
    return (state.attendance[dateStr] || []).includes(captainId);
  }, [state.attendance]);

  const isDayCovered = useCallback((dateStr) => {
    const override = state.dayOverrides[dateStr];
    if (override?.cancelled) return null; // null = doesn't count
    const count = (state.attendance[dateStr] || []).length;
    return count >= state.settings.minCaptainsPerDay;
  }, [state.attendance, state.dayOverrides, state.settings.minCaptainsPerDay]);

  const getWeekCoverage = useCallback((dayDates) => {
    let coveredCount = 0;
    let totalActive = 0;
    for (const d of dayDates) {
      const override = state.dayOverrides[d];
      if (override?.cancelled) continue;
      totalActive++;
      const count = (state.attendance[d] || []).length;
      if (count >= state.settings.minCaptainsPerDay) coveredCount++;
    }
    return { coveredCount, totalActive };
  }, [state.attendance, state.dayOverrides, state.settings.minCaptainsPerDay]);

  const isWeekCovered = useCallback((dayDates) => {
    const { coveredCount } = getWeekCoverage(dayDates);
    return coveredCount >= state.settings.minCoveredDays;
  }, [getWeekCoverage, state.settings.minCoveredDays]);

  // Captain stats: total attendance count across all days
  const getCaptainStats = useCallback(() => {
    const stats = {};
    for (const captain of state.captains) {
      stats[captain.id] = 0;
    }
    for (const [, ids] of Object.entries(state.attendance)) {
      for (const id of ids) {
        if (stats[id] !== undefined) stats[id]++;
      }
    }
    return stats;
  }, [state.attendance, state.captains]);

  return {
    state,
    // Attendance
    toggleAttendance,
    setDayAttendance,
    getAttendanceForDay,
    getCaptainsForDay,
    isCaptainAttending,
    isDayCovered,
    getWeekCoverage,
    isWeekCovered,
    // Day overrides
    setDayOverride,
    clearDayOverride,
    // Captains
    addCaptain,
    removeCaptain,
    updateCaptain,
    // Settings
    updateSettings,
    toggleDarkMode,
    resetAll,
    // Stats
    getCaptainStats,
    CAPTAIN_COLORS,
  };
}
