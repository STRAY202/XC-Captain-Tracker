import { useState, useEffect, useMemo } from 'react';
import { Moon, Sun, Settings, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from './hooks/useStore';
import { generateSchedule, today, fromDateStr } from './utils/dates';
import ProfileSelector from './components/ProfileSelector';
import Dashboard from './components/Dashboard';
import WeekCard from './components/WeekCard';
import AdminPanel from './components/AdminPanel';

const LOCAL_CAPTAIN_KEY = 'xc-last-captain';

export default function App() {
  const store = useStore();
  const { state } = store;
  const { settings, captains, attendance, dayOverrides } = state;

  const [currentCaptainId, setCurrentCaptainId] = useState(() => {
    return localStorage.getItem(LOCAL_CAPTAIN_KEY) || null;
  });
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const handleSelectCaptain = (id) => {
    setCurrentCaptainId(id);
    localStorage.setItem(LOCAL_CAPTAIN_KEY, id);
  };

  const handleLogout = () => {
    setCurrentCaptainId(null);
    localStorage.removeItem(LOCAL_CAPTAIN_KEY);
  };

  // Generate weeks schedule
  const weeks = useMemo(() => {
    return generateSchedule(settings.startDate, settings.numWeeks, settings.practiceDays);
  }, [settings.startDate, settings.numWeeks, settings.practiceDays]);

  // Find current week index
  const todayStr = today();
  const currentWeekIndex = useMemo(() => {
    const idx = weeks.findIndex(w => {
      const first = fromDateStr(w.days[0]);
      const last = fromDateStr(w.days[w.days.length - 1]);
      const now = fromDateStr(todayStr);
      return now >= first && now <= last;
    });
    return idx >= 0 ? idx : 0;
  }, [weeks, todayStr]);

  // Only show current week +/- a few by default
  const visibleWeeks = useMemo(() => {
    if (showAllWeeks) return weeks;
    const start = Math.max(0, currentWeekIndex - 1);
    const end = Math.min(weeks.length - 1, currentWeekIndex + 3);
    return weeks.slice(start, end + 1);
  }, [weeks, currentWeekIndex, showAllWeeks]);

  const currentCaptain = captains.find(c => c.id === currentCaptainId);

  // Show profile selector if no captain selected
  if (!currentCaptainId) {
    return (
      <ProfileSelector
        captains={captains}
        teamName={settings.teamName}
        onSelect={handleSelectCaptain}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-lg mx-auto pb-24">

        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800/80">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                {settings.teamName}
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                Summer Schedule
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={store.toggleDarkMode}
                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
              >
                {settings.darkMode
                  ? <Sun size={16} className="text-amber-400" />
                  : <Moon size={16} className="text-gray-500" />
                }
              </button>
              <button
                onClick={() => setShowAdmin(true)}
                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
              >
                <Settings size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
              {currentCaptain ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full transition-all active:scale-90 hover:opacity-80"
                  style={{ backgroundColor: currentCaptain.color + '22' }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: currentCaptain.color }}
                  >
                    {currentCaptain.name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: currentCaptain.color }}>
                    {currentCaptain.name.split(' ')[0]}
                  </span>
                  <LogOut size={11} className="text-gray-400" />
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 transition-all active:scale-90"
                >
                  Admin <LogOut size={11} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Welcome hint */}
        {currentCaptain && (
          <div
            className="mx-4 mt-3 px-4 py-2.5 rounded-2xl text-xs font-medium text-center animate-fade-in"
            style={{ backgroundColor: currentCaptain.color + '18', color: currentCaptain.color }}
          >
            👋 Hi {currentCaptain.name}! Tap any day to toggle your attendance ↓
          </div>
        )}

        {/* Dashboard */}
        <div className="mt-4">
          <Dashboard
            weeks={weeks}
            attendance={attendance}
            dayOverrides={dayOverrides}
            captains={captains}
            settings={settings}
            getWeekCoverage={store.getWeekCoverage}
            getCaptainStats={store.getCaptainStats}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 mb-4 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            You attending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-600 inline-block" />
            Covered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 inline-block" />
            Uncovered
          </span>
        </div>

        {/* Week cards */}
        <div className="px-4 space-y-3">
          {visibleWeeks.map((week) => (
            <WeekCard
              key={week.id}
              week={week}
              captains={captains}
              currentCaptainId={currentCaptainId}
              attendance={attendance}
              dayOverrides={dayOverrides}
              settings={settings}
              isCurrentWeek={week.index === currentWeekIndex}
              getWeekCoverage={store.getWeekCoverage}
              onToggle={store.toggleAttendance}
              weekIndex={week.index}
            />
          ))}
        </div>

        {/* Show all / collapse toggle */}
        <div className="px-4 mt-4">
          <button
            onClick={() => setShowAllWeeks(s => !s)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all active:scale-[0.98]"
          >
            {showAllWeeks ? (
              <><ChevronUp size={16} /> Show fewer weeks</>
            ) : (
              <><ChevronDown size={16} /> Show all {weeks.length} weeks</>
            )}
          </button>
        </div>

        {/* Captain attendance bar chart */}
        <div className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Captain Attendance</h3>
          <div className="space-y-2.5">
            {[...captains]
              .sort((a, b) => (store.getCaptainStats()[b.id] || 0) - (store.getCaptainStats()[a.id] || 0))
              .map(captain => {
                const count = store.getCaptainStats()[captain.id] || 0;
                const totalDays = weeks.flatMap(w => w.days).filter(d => !dayOverrides[d]?.cancelled).length;
                const pct = totalDays > 0 ? Math.round((count / totalDays) * 100) : 0;
                const isMe = captain.id === currentCaptainId;
                return (
                  <div key={captain.id} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: captain.color }}
                    >
                      {captain.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold ${isMe ? 'text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                          {captain.name}
                          {isMe && <span className="ml-1 text-[10px] font-normal text-gray-400">(you)</span>}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{count} days</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: captain.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

      </div>

      {/* Admin Panel Modal */}
      {showAdmin && (
        <AdminPanel
          captains={captains}
          settings={settings}
          weeks={weeks}
          dayOverrides={dayOverrides}
          onAddCaptain={store.addCaptain}
          onRemoveCaptain={store.removeCaptain}
          onUpdateCaptain={store.updateCaptain}
          onUpdateSettings={store.updateSettings}
          onSetDayOverride={store.setDayOverride}
          onClearDayOverride={store.clearDayOverride}
          onClose={() => setShowAdmin(false)}
          CAPTAIN_COLORS={store.CAPTAIN_COLORS}
        />
      )}
    </div>
  );
}
