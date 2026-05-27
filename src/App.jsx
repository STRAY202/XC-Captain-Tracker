import { useState, useMemo } from 'react';
import { Moon, Sun, Settings, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from './context/AppContext';
import { generateSchedule, today, fromDateStr } from './utils/dates';
import SetupGuide from './components/SetupGuide';
import AccessGate from './components/AccessGate';
import Dashboard from './components/Dashboard';
import WeekCard from './components/WeekCard';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const {
    isFirebaseConfigured, authLoading, dataLoading,
    settings, captains, dayDetails, attendance,
    currentCaptainId, currentCaptain, deselectCaptain,
    teamVerified, darkMode, toggleDarkMode,
    getCaptainStats,
  } = useApp();

  const [showAdmin,    setShowAdmin]    = useState(false);
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  // ── Routing guards ─────────────────────────────────────────────────────────

  // 1. Firebase not configured → setup guide
  if (!isFirebaseConfigured) return <SetupGuide />;

  // 2. Auth or data still loading → spinner
  if (authLoading || (dataLoading && captains.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center animate-fade-in">
          <div className="text-4xl mb-4">🏃</div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
            Loading team…
          </p>
        </div>
      </div>
    );
  }

  // 3. Team not verified or no captain selected → access gate
  if (!teamVerified || !currentCaptainId) return <AccessGate />;

  // ── Schedule generation ────────────────────────────────────────────────────
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

  // ── Stats for bar chart ────────────────────────────────────────────────────
  const captainStats = getCaptainStats();
  const totalActiveDays = weeks
    .flatMap(w => w.days)
    .filter(d => !dayDetails[d]?.cancelled).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-lg mx-auto pb-24">

        {/* ── Sticky header ─────────────────────────────────────────────── */}
        <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left: brand */}
            <div>
              <h1 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                {settings.teamName}
              </h1>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                Summer Schedule · Live 🔴
              </p>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-2">
              <button onClick={toggleDarkMode}
                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
              >
                {darkMode
                  ? <Sun size={15} className="text-amber-400" />
                  : <Moon size={15} className="text-gray-500" />
                }
              </button>

              <button onClick={() => setShowAdmin(true)}
                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
              >
                <Settings size={15} className="text-gray-500 dark:text-gray-400" />
              </button>

              {/* Captain chip */}
              {currentCaptain ? (
                <button onClick={deselectCaptain}
                  className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full transition-all active:scale-90 hover:opacity-80"
                  style={{ backgroundColor: currentCaptain.color + '22' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-extrabold"
                    style={{ backgroundColor: currentCaptain.color }}
                  >
                    {currentCaptain.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold" style={{ color: currentCaptain.color }}>
                    {currentCaptain.name.split(' ')[0]}
                  </span>
                  <LogOut size={11} className="text-gray-400" />
                </button>
              ) : (
                <button onClick={deselectCaptain}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300 active:scale-90"
                >
                  Admin <LogOut size={11} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Welcome banner ─────────────────────────────────────────────── */}
        {currentCaptain && (
          <div
            className="mx-4 mt-3 px-4 py-2.5 rounded-2xl text-xs font-semibold text-center animate-fade-in"
            style={{ backgroundColor: currentCaptain.color + '18', color: currentCaptain.color }}
          >
            👋 Hi {currentCaptain.name}! Tap any day to toggle your attendance
          </div>
        )}

        {/* ── Dashboard stats ─────────────────────────────────────────────── */}
        <div className="mt-4 mb-4">
          <Dashboard weeks={weeks} currentWeekIndex={currentWeekIndex} />
        </div>

        {/* ── Legend ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-4 mb-3 text-[11px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> You attending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-white dark:bg-gray-800 border-2 border-emerald-300 dark:border-emerald-700 inline-block" /> Covered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 inline-block" /> Open
          </span>
        </div>

        {/* ── Week cards ──────────────────────────────────────────────────── */}
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

        {/* ── Show all toggle ─────────────────────────────────────────────── */}
        <div className="px-4 mt-4">
          <button
            onClick={() => setShowAllWeeks(s => !s)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all active:scale-[0.98]"
          >
            {showAllWeeks
              ? <><ChevronUp size={15} /> Show fewer weeks</>
              : <><ChevronDown size={15} /> Show all {weeks.length} weeks</>
            }
          </button>
        </div>

        {/* ── Captain attendance bars ─────────────────────────────────────── */}
        <div className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <h3 className="text-sm font-extrabold text-gray-700 dark:text-gray-200 mb-3">
            Captain Attendance
          </h3>
          <div className="space-y-3">
            {[...captains]
              .sort((a, b) => (captainStats[b.id] || 0) - (captainStats[a.id] || 0))
              .map(captain => {
                const count = captainStats[captain.id] || 0;
                const pct   = totalActiveDays > 0 ? Math.round((count / totalActiveDays) * 100) : 0;
                const isMe  = captain.id === currentCaptainId;
                return (
                  <div key={captain.id} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
                      style={{ backgroundColor: captain.color }}
                    >
                      {captain.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold ${isMe ? 'text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                          {captain.name}
                          {isMe && <span className="ml-1 text-[10px] text-gray-400 font-normal">(you)</span>}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                          {count} / {totalActiveDays}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${pct}%`, backgroundColor: captain.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

      </div>{/* /max-w-lg */}

      {/* ── Admin panel modal ──────────────────────────────────────────────── */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
