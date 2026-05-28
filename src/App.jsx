import { useState, useMemo, useEffect } from 'react';
import {
  Moon, Sun, LogOut, Zap,
  CalendarDays, Users, Shield,
} from 'lucide-react';
import { useApp } from './context/AppContext';
import { generateSchedule, today, fromDateStr } from './utils/dates';
import AccessGate from './components/AccessGate';
import Dashboard from './components/Dashboard';
import WeekCard from './components/WeekCard';
import AdminPanel from './components/AdminPanel';
import SchedulePage from './components/SchedulePage';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingFlow from './components/OnboardingFlow';

// ── Tab bar ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'schedule',     label: 'Schedule',     Icon: CalendarDays },
  { id: 'availability', label: 'Availability', Icon: Users        },
  { id: 'admin',        label: 'Admin',        Icon: Shield       },
];

export default function App() {
  const {
    demoMode, authLoading, dataLoading, syncError,
    settings, captains, dayDetails,
    currentCaptainId, currentCaptain,
    userMode, athleteName,
    deselectCaptain,
    darkMode, toggleDarkMode,
    getCaptainStats,
    onboardingDone, markOnboardingDone,
  } = useApp();

  const [activeTab,     setActiveTab]     = useState('schedule');
  const [showAdmin,     setShowAdmin]     = useState(false);
  const [showAllWeeks,  setShowAllWeeks]  = useState(false);
  const [showHelp,      setShowHelp]      = useState(false);
  const [syncDismissed, setSyncDismissed] = useState(false);

  const isLoading = authLoading || (dataLoading && captains.length === 0);

  // Switch to availability tab if user taps "Availability"
  const handleTabChange = (id) => {
    if (id === 'admin') {
      if (userMode === 'captain' || currentCaptainId === 'admin') {
        setShowAdmin(true);
      } else {
        setActiveTab('admin');
      }
      return;
    }
    setActiveTab(id);
  };

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

  const activeAnnouncements = useMemo(() =>
    (settings.announcements || []).filter(a => a.active !== false),
    [settings.announcements]
  );

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center animate-fade-in">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
              <Zap size={32} className="text-emerald-400" fill="currentColor" />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 animate-ping" />
          </div>
          <p className="text-base font-bold text-white tracking-wide">Loading team…</p>
          <p className="text-xs text-emerald-400/70 mt-1 animate-pulse">Syncing schedule</p>
        </div>
      </div>
    );
  }

  if (!currentCaptainId) return <AccessGate />;

  // ── Display name for header chip ───────────────────────────────────────────
  const displayName = userMode === 'athlete'
    ? (athleteName || 'Athlete')
    : currentCaptain?.name || 'Admin';

  const chipColor = userMode === 'athlete'
    ? '#10b981'
    : currentCaptain?.color || '#6b7280';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-lg mx-auto pb-24">

          {/* ── Sticky header ──────────────────────────────────────────────── */}
          <div className="sticky top-0 z-40 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 pt-safe">

              {/* Left: logo + team name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-brand flex-shrink-0 flex items-center justify-center shadow-brand">
                  <Zap size={16} className="text-white" fill="white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight truncate">
                    {settings.teamName}
                  </h1>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-none mt-0.5">
                    {userMode === 'athlete' ? 'Athlete' : userMode === 'captain' ? 'Captain' : 'Admin'} · {demoMode ? 'Local' : 'Live'}
                    {!demoMode && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 mb-[1px] shadow-sm" />}
                  </p>
                </div>
              </div>

              {/* Right: dark mode + user chip */}
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

                {/* User chip */}
                <button
                  onClick={deselectCaptain}
                  className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full transition-all active:scale-90 hover:opacity-80 min-h-[36px]"
                  style={{ backgroundColor: chipColor + '22' }}
                  aria-label="Switch user"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-sm"
                    style={{ backgroundColor: chipColor }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold" style={{ color: chipColor }}>
                    {displayName.split(' ')[0]}
                  </span>
                  <LogOut size={10} className="text-gray-400 dark:text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Announcements ──────────────────────────────────────────────── */}
          {activeAnnouncements.length > 0 && (
            <div className="mx-4 mt-3 space-y-1.5 animate-fade-in">
              {activeAnnouncements.map(ann => (
                <div key={ann.id} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60">
                  <span className="text-base flex-shrink-0" aria-hidden>📢</span>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 leading-snug flex-1">{ann.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Sync error banner ──────────────────────────────────────────── */}
          {syncError && !syncDismissed && (
            <div className="mx-4 mt-2 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 animate-fade-in">
              <span className="text-base flex-shrink-0" aria-hidden>⚠️</span>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex-1 leading-snug">
                Sync unavailable — changes save locally only
              </p>
              <button onClick={() => window.location.reload()} className="text-[11px] font-bold text-amber-700 dark:text-amber-300 underline underline-offset-2 flex-shrink-0 active:opacity-70">
                Retry
              </button>
              <button onClick={() => setSyncDismissed(true)} className="text-amber-400 dark:text-amber-600 flex-shrink-0 active:opacity-70 ml-1" aria-label="Dismiss">
                ×
              </button>
            </div>
          )}

          {/* ── Tab content ────────────────────────────────────────────────── */}
          {activeTab === 'schedule' && (
            <SchedulePage weeks={weeks} currentWeekIndex={currentWeekIndex} />
          )}

          {activeTab === 'availability' && (
            <div className="mt-4">
              {/* Welcome banner */}
              {userMode === 'captain' && currentCaptain && (
                <div
                  className="mx-4 mb-3 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 animate-slide-down"
                  style={{ backgroundColor: currentCaptain.color + '18', color: currentCaptain.color }}
                >
                  <span>👋</span>
                  <span>Hi {currentCaptain.name}! Tap a day to toggle your attendance</span>
                </div>
              )}
              {userMode === 'athlete' && (
                <div className="mx-4 mb-3 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 animate-slide-down bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                  <span>👋</span>
                  <span>Hi {athleteName || 'Athlete'}! Tap days to mark your attendance</span>
                </div>
              )}

              {/* Dashboard stats */}
              <div className="mb-4">
                <Dashboard weeks={weeks} currentWeekIndex={currentWeekIndex} />
              </div>

              {/* Legend */}
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

              {/* Week cards */}
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

              <div className="px-4 mt-4">
                <button
                  onClick={() => setShowAllWeeks(s => !s)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all active:scale-[0.98] shadow-sm"
                >
                  {showAllWeeks ? '↑ Show fewer weeks' : `↓ Show all ${weeks.length} weeks`}
                </button>
              </div>

              {/* Leaderboard */}
              <div className="mx-4 mt-5 rounded-3xl overflow-hidden shadow-card-lg">
                <div className="bg-gradient-hero px-5 pt-5 pb-5">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🏆</span>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white tracking-tight leading-tight">Team Attendance</h3>
                      <p className="text-[11px] text-emerald-400/80 font-medium">Season leaderboard</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 px-5 py-5 space-y-5">
                  {[...Object.keys(captainStats || {})]
                    .map(id => ({ captain: captains.find(c => c.id === id), count: captainStats[id] || 0 }))
                    .filter(({ captain }) => captain)
                    .sort((a, b) => b.count - a.count)
                    .map(({ captain, count }, rankIdx) => {
                      const pct    = totalActiveDays > 0 ? Math.round((count / totalActiveDays) * 100) : 0;
                      const isMe   = captain.id === currentCaptainId;
                      const medal  = rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : rankIdx === 2 ? '🥉' : null;
                      return (
                        <div key={captain.id} className="flex items-center gap-3">
                          <div className="w-6 text-center flex-shrink-0">
                            {medal
                              ? <span className="text-base leading-none">{medal}</span>
                              : <span className="text-xs font-black text-gray-300 dark:text-gray-600">{rankIdx + 1}</span>
                            }
                          </div>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 shadow-sm" style={{ backgroundColor: captain.color }}>
                            {captain.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`text-sm font-bold leading-none truncate ${isMe ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                                  {captain.name}
                                </span>
                                {isMe && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: captain.color }}>you</span>}
                              </div>
                              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 tabular-nums ml-2 flex-shrink-0">
                                {count}<span className="font-normal opacity-60">/{totalActiveDays}</span>
                              </span>
                            </div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: captain.color, boxShadow: `0 0 10px ${captain.color}55` }} />
                            </div>
                            <div className="mt-1 text-[10px] text-gray-400 dark:text-gray-600 font-medium">{pct}% coverage</div>
                          </div>
                        </div>
                      );
                    })}
                  {captains.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No captains yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && userMode !== 'captain' && currentCaptainId !== 'admin' && (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Shield size={28} className="text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">Captain Access Only</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Use the captain code to access admin settings.
              </p>
            </div>
          )}

        </div>{/* /max-w-lg */}

        {/* ── Bottom tab bar ─────────────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-800/60 pb-safe">
          <div className="max-w-lg mx-auto flex">
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id || (id === 'admin' && showAdmin);
              const isCaptainOnly = id === 'admin';
              return (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95 ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <div className="relative">
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                    {isCaptainOnly && userMode !== 'captain' && currentCaptainId !== 'admin' && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-[6px] font-black text-gray-500 dark:text-gray-400">🔒</span>
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold leading-none ${isActive ? '' : ''}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Admin panel modal ──────────────────────────────────────────────── */}
        {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

        {/* ── Onboarding ─────────────────────────────────────────────────────── */}
        {!onboardingDone && !showHelp && (
          <OnboardingFlow onComplete={() => {}} />
        )}
        {showHelp && (
          <OnboardingFlow
            isHelp
            onComplete={() => {
              if (!onboardingDone) markOnboardingDone();
              setShowHelp(false);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
