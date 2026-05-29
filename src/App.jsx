import { useState, useMemo } from 'react';
import { LogOut, Zap, BarChart2, Eye, HelpCircle, Settings, Moon, Sun } from 'lucide-react';
import { useApp } from './context/AppContext';
import { generateSchedule, today, fromDateStr } from './utils/dates';
import AccessGate from './components/AccessGate';
import AthleteDashboard from './components/AthleteDashboard';
import CaptainDashboard from './components/CaptainDashboard';
import SettingsPanel from './components/SettingsPanel';
import RoleOnboarding from './components/RoleOnboarding';
import ErrorBoundary from './components/ErrorBoundary';

// ── Captain tab bar ────────────────────────────────────────────────────────────
const CAP_TABS = [
  { id: 'dashboard', label: 'Dashboard', Icon: BarChart2 },
  { id: 'athletes',  label: 'Athletes',  Icon: Eye },
];

// ── Top Header ─────────────────────────────────────────────────────────────────
function Header({
  title, chipLabel, chipColor,
  onLogout, onHelp, onSettings, darkMode, onToggleDarkMode,
}) {
  return (
    <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800/60">
      <div className="flex items-center justify-between px-4 py-3 pt-safe max-w-lg mx-auto">
        {/* Left: brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <h1 className="text-sm font-extrabold text-gray-900 dark:text-white truncate leading-tight">{title}</h1>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
          {/* Dark mode toggle */}
          <button
            onClick={onToggleDarkMode}
            className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode
              ? <Sun size={14} className="text-gray-600 dark:text-gray-400" />
              : <Moon size={14} className="text-gray-600 dark:text-gray-400" />
            }
          </button>

          {/* Help / onboarding replay */}
          <button
            onClick={onHelp}
            className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
            title="How to use this app"
          >
            <HelpCircle size={14} className="text-gray-600 dark:text-gray-400" />
          </button>

          {/* Settings */}
          <button
            onClick={onSettings}
            className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
            title="Settings"
          >
            <Settings size={14} className="text-gray-600 dark:text-gray-400" />
          </button>

          {/* Profile chip / logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full min-h-[34px] transition-all active:scale-90 hover:opacity-80"
            style={{ backgroundColor: chipColor + '22' }}
            title="Log out"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold"
              style={{ backgroundColor: chipColor }}
            >
              {chipLabel.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] font-bold" style={{ color: chipColor }}>
              {chipLabel.split(' ')[0]}
            </span>
            <LogOut size={9} className="text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function App() {
  const {
    authLoading, dataLoading, captains,
    settings,
    currentCaptainId, currentCaptain,
    userMode, athleteName,
    athleteOnboarded, captainOnboarded,
    darkMode, toggleDarkMode,
    deselectCaptain,
    markAthleteOnboarded, markCaptainOnboarded,
    syncError,
  } = useApp();

  const [captainTab,           setCaptainTab]           = useState('dashboard');
  const [showSettings,         setShowSettings]         = useState(false);
  const [showOnboardingReplay, setShowOnboardingReplay] = useState(false);
  const [syncDismissed,        setSyncDismissed]        = useState(false);

  const isLoading = authLoading || (dataLoading && captains.length === 0);

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

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Zap size={26} className="text-emerald-400" fill="currentColor" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 animate-ping" />
          </div>
          <p className="text-sm font-bold text-white">Loading…</p>
          <p className="text-xs text-gray-600 mt-1 animate-pulse">Syncing schedule</p>
        </div>
      </div>
    );
  }

  if (!currentCaptainId) return <AccessGate />;

  // Role-specific onboarding (mandatory, full-screen)
  if (userMode === 'athlete' && !athleteOnboarded) {
    return <RoleOnboarding role="athlete" onComplete={markAthleteOnboarded} />;
  }
  if (userMode === 'captain' && !captainOnboarded) {
    return <RoleOnboarding role="captain" onComplete={markCaptainOnboarded} />;
  }

  // ── Header props ────────────────────────────────────────────────────────────
  const chipLabel = userMode === 'athlete'
    ? (athleteName || 'Athlete')
    : currentCaptain?.name || 'Admin';
  const chipColor = userMode === 'athlete'
    ? '#10b981'
    : currentCaptain?.color || '#6b7280';

  const onboardingRole = userMode === 'athlete' ? 'athlete' : 'captain';

  // ── Athlete view ─────────────────────────────────────────────────────────────
  if (userMode === 'athlete') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
          <Header
            title={settings.teamName}
            chipLabel={chipLabel}
            chipColor={chipColor}
            onLogout={deselectCaptain}
            onHelp={() => setShowOnboardingReplay(true)}
            onSettings={() => setShowSettings(true)}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
          />
          <div className="max-w-lg mx-auto pb-8">
            {syncError && !syncDismissed && (
              <div className="mx-4 mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-950/40 border border-amber-800/40">
                <span className="text-sm flex-shrink-0">⚠️</span>
                <p className="text-xs text-amber-400 flex-1">Offline — showing cached data</p>
                <button onClick={() => setSyncDismissed(true)} className="text-amber-700 text-base flex-shrink-0">×</button>
              </div>
            )}
            <AthleteDashboard weeks={weeks} />
          </div>

          {showSettings && (
            <SettingsPanel
              athleteMode
              onClose={() => setShowSettings(false)}
              onReplayOnboarding={() => { setShowSettings(false); setShowOnboardingReplay(true); }}
            />
          )}
          {showOnboardingReplay && (
            <RoleOnboarding
              role={onboardingRole}
              isReplay={true}
              onComplete={() => setShowOnboardingReplay(false)}
            />
          )}
        </div>
      </ErrorBoundary>
    );
  }

  // ── Captain / Admin view ────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        <Header
          title={settings.teamName}
          chipLabel={chipLabel}
          chipColor={chipColor}
          onLogout={deselectCaptain}
          onHelp={() => setShowOnboardingReplay(true)}
          onSettings={() => setShowSettings(true)}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        <div className="max-w-lg mx-auto pb-24">
          {syncError && !syncDismissed && (
            <div className="mx-4 mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-950/40 border border-amber-800/40">
              <span className="text-sm flex-shrink-0">⚠️</span>
              <p className="text-xs text-amber-400 flex-1">Sync unavailable — changes save locally only</p>
              <button onClick={() => window.location.reload()} className="text-xs font-bold text-amber-400 underline flex-shrink-0">Retry</button>
              <button onClick={() => setSyncDismissed(true)} className="text-amber-700 text-base flex-shrink-0 ml-1">×</button>
            </div>
          )}

          {captainTab === 'dashboard' && (
            <CaptainDashboard weeks={weeks} currentWeekIndex={currentWeekIndex} />
          )}

          {captainTab === 'athletes' && (
            <div className="pt-4">
              <AthleteDashboard weeks={weeks} />
            </div>
          )}
        </div>

        {/* ── Bottom tab bar ──────────────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800/60 pb-safe">
          <div className="max-w-lg mx-auto flex">
            {CAP_TABS.map(({ id, label, Icon }) => {
              const isActive = captainTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setCaptainTab(id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95 ${
                    isActive ? 'text-emerald-400' : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="text-[10px] font-bold">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Overlays ────────────────────────────────────────────────────────── */}
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        {showOnboardingReplay && (
          <RoleOnboarding
            role={onboardingRole}
            isReplay={true}
            onComplete={() => setShowOnboardingReplay(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
