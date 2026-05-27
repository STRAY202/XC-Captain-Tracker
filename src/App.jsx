import { useState, useMemo, useEffect } from 'react';
import {
  Moon, Sun, Settings, LogOut, ChevronDown, ChevronUp,
  Database, RefreshCw, Zap,
} from 'lucide-react';
import { useApp } from './context/AppContext';
import { generateSchedule, today, fromDateStr } from './utils/dates';
import AccessGate from './components/AccessGate';
import Dashboard from './components/Dashboard';
import WeekCard from './components/WeekCard';
import AdminPanel from './components/AdminPanel';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const {
    demoMode, authLoading, dataLoading, loadError,
    settings, captains, dayDetails,
    currentCaptainId, currentCaptain, deselectCaptain,
    darkMode, toggleDarkMode,
    getCaptainStats,
  } = useApp();

  // ── All hooks must be called unconditionally before any conditional return ──
  const [showAdmin,    setShowAdmin]    = useState(false);
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  const [timedOut,     setTimedOut]     = useState(false);

  const isLoading = authLoading || (dataLoading && captains.length === 0);

  useEffect(() => {
    if (!isLoading) { setTimedOut(false); return; }
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, [isLoading]);

  useEffect(() => {
    if (dataLoading || !captains.length || !currentCaptainId) return;
    if (currentCaptainId === 'admin') return;
    const found = captains.some(c => c.id === currentCaptainId);
    if (!found) {
      console.warn('[App] Stale captain ID, deselecting:', currentCaptainId);
      deselectCaptain();
    }
  }, [dataLoading, captains, currentCaptainId, deselectCaptain]);

  const weeks = useMemo(() =>
    generateSchedule(settings.startDate, settings.numWeeks, settings.practiceDays),
    [settings.startDate, settings.numWeeks, settings.practiceDays]
  );

  const todayStr = today();

  const currentWeekIndex = useMemo(() => {
    const idx = weeks.findIndex(w => {
      const first = fromDateStr(w.days[0]);
      const last  = fromDateStr(w.days[w.days.length - 1]);
      const now   = fromDateStr(todayStr);
      return now >= first && now <= last;
    });
    return idx >= 0 ? idx : 0;
  }, [weeks, todayStr]);

  const visibleWeeks = useMemo(() => {
    if (showAllWeeks) return weeks;
    const s = Math.max(0, currentWeekIndex - 1);
    const e = Math.min(weeks.length - 1, currentWeekIndex + 3);
    return weeks.slice(s, e + 1);
  }, [weeks, currentWeekIndex, showAllWeeks]);

  const captainStats = useMemo(() => getCaptainStats(), [getCaptainStats]);

  const totalActiveDays = useMemo(() =>
    weeks.flatMap(w => w.days).filter(d => !dayDetails[d]?.cancelled).length,
    [weeks, dayDetails]
  );

  // ── Routing guards — after all hooks ──────────────────────────────────────────

  if (timedOut || loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <div className="text-center animate-fade-in max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
            {loadError ? 'Connection Error' : 'Taking too long…'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {loadError
              ? 'Could not connect to the server. Check your connection and try again.'
              : 'The app is taking longer than expected to load.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mx-auto"
          >
            <RefreshCw size={15} /> Reload App
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏃</span>
          </div>
          <p className="text-sm font-semibold text-emerald-400 animate-pulse tracking-wide">
            Loading team…
          </p>
        </div>
      </div>
    );
  }

  if (!currentCaptainId) return <AccessGate />;

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-lg mx-auto pb-24">

          {/* ── Sticky glass header ──────────────────────────────────────── */}
          <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 pt-safe">

              {/* Left: brand mark + team info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-brand flex-shrink-0 flex items-center justify-center shadow-brand">
                  <Zap size={14} className="text-white" fill="white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight truncate">
                    {settings.teamName}
                  </h1>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-none mt-0.5">
                    {demoMode ? 'Demo Mode · Local Only' : 'Live Schedule · Synced 🟢'}
                  </p>
                </div>
              </div>

              {/* Right: controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <button
                  onClick={toggleDarkMode}
                  className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
                  aria-label="Toggle dark mode"
                >
                  {darkMode
                    ? <Sun size={15} className="text-amber-400" />
                    : <Moon size={15} className="text-gray-500" />
                  }
                </button>

                <button
                  onClick={() => setShowAdmin(true)}
                  className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
                  aria-label="Open settings"
                >
                  <Settings size={15} className="text-gray-500 dark:text-gray-400" />
                </button>

                {/* Captain chip */}
                {currentCaptain ? (
                  <button
                    onClick={deselectCaptain}
                    className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full transition-all active:scale-90 hover:opacity-80 min-h-[36px]"
                    style={{ backgroundColor: currentCaptain.color + '22' }}
                    aria-label="Switch captain"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-sm"
                      style={{ backgroundColor: currentCaptain.color }}
                    >
                      {currentCaptain.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold" style={{ color: currentCaptain.color }}>
                      {currentCaptain.name.split(' ')[0]}
                    </span>
                    <LogOut size={10} className="text-gray-400 dark:text-gray-500" />
                  </button>
                ) : (
                  <button
                    onClick={deselectCaptain}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 active:scale-90 min-h-[36px]"
                  >
                    Admin <LogOut size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Captain welcome banner ───────────────────────────────────── */}
          {currentCaptain && (
            <div
              className="mx-4 mt-3 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 animate-slide-down"
              style={{ backgroundColor: currentCaptain.color + '18', color: currentCaptain.color }}
            >
              <span>👋</span>
              <span>Hi {currentCaptain.name}! Tap any day button to toggle your attendance</span>
            </div>
          )}

          {/* ── Demo mode banner ─────────────────────────────────────────── */}
          {demoMode && (
            <div className="mx-4 mt-2 flex items-start gap-2 px-3.5 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/70 text-xs text-blue-700 dark:text-blue-300 animate-fade-in">
              <Database size={13} className="flex-shrink-0 mt-0.5 text-blue-500" />
              <span>
                <strong>Demo mode</strong> — data saves to this device only.{' '}
                <a href="https://firebase.google.com" className="underline underline-offset-2 opacity-70 hover:opacity-100">
                  Add Firebase
                </a>{' '}
                for real-time sync across all phones.
              </span>
            </div>
          )}

          {/* ── Dashboard stats ──────────────────────────────────────────── */}
          <div className="mt-4 mb-4">
            <Dashboard weeks={weeks} currentWeekIndex={currentWeekIndex} />
          </div>

          {/* ── Legend ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-4 px-4 mb-3 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-sm" />
              You attending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-white dark:bg-gray-800 border-2 border-emerald-400 dark:border-emerald-600 inline-block" />
              Covered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 inline-block" />
              Open
            </span>
          </div>

          {/* ── Week cards ───────────────────────────────────────────────── */}
          <div className="px-4 space-y-3">
            {visibleWeeks.map(week => (
              <WeekCard
                key={week.id}
                week={week}
                isCurrentWeek={week.index === currentWeekIndex}
                weekIndex={week.index}
              />
            ))}
          </div>

          {/* ── Show all toggle ──────────────────────────────────────────── */}
          <div className="px-4 mt-4">
            <button
              onClick={() => setShowAllWeeks(s => !s)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all active:scale-[0.98] shadow-sm"
            >
              {showAllWeeks
                ? <><ChevronUp size={15} /> Show fewer weeks</>
                : <><ChevronDown size={15} /> Show all {weeks.length} weeks</>
              }
            </button>
          </div>

          {/* ── Team Attendance leaderboard ──────────────────────────────── */}
          <div className="mx-4 mt-4 rounded-3xl overflow-hidden shadow-card-lg">
            {/* Gradient header */}
            <div className="bg-gradient-hero px-5 pt-5 pb-4">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🏆</span>
                </div>
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Team Attendance
                </h3>
              </div>
              <p className="text-[11px] text-emerald-400/80 font-medium ml-9">
                Season leaderboard
              </p>
            </div>

            {/* Stats list */}
            <div className="bg-white dark:bg-gray-900 px-5 py-4 space-y-4">
              {[...Object.keys(captainStats || {})]
                .map(id => ({ captain: captains.find(c => c.id === id), count: captainStats[id] || 0 }))
                .filter(({ captain }) => captain)
                .sort((a, b) => b.count - a.count)
                .map(({ captain, count }, rankIdx) => {
                  const pct = totalActiveDays > 0
                    ? Math.round((count / totalActiveDays) * 100)
                    : 0;
                  const isMe = captain.id === currentCaptainId;

                  return (
                    <div key={captain.id} className="flex items-center gap-3">
                      {/* Rank number */}
                      <div className="w-5 text-center">
                        <span className={`text-xs font-black ${
                          rankIdx === 0
                            ? 'text-amber-400'
                            : rankIdx === 1
                            ? 'text-gray-400'
                            : rankIdx === 2
                            ? 'text-amber-700'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}>
                          {rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : rankIdx === 2 ? '🥉' : `${rankIdx + 1}`}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: captain.color }}
                      >
                        {captain.name.charAt(0)}
                      </div>

                      {/* Name + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-sm font-bold leading-none ${
                            isMe
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-200'
                          }`}>
                            {captain.name}
                            {isMe && (
                              <span
                                className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: captain.color }}
                              >
                                you
                              </span>
                            )}
                          </span>
                          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 tabular-nums ml-2">
                            {count}<span className="font-normal opacity-60">/{totalActiveDays}</span>
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: captain.color,
                              boxShadow: `0 0 8px ${captain.color}66`,
                            }}
                          />
                        </div>
                        <div className="mt-1 text-[10px] text-gray-400 dark:text-gray-600 font-medium">
                          {pct}% coverage
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

        </div>{/* /max-w-lg */}

        {/* ── Admin panel modal ──────────────────────────────────────────── */}
        {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      </div>
    </ErrorBoundary>
  );
}
