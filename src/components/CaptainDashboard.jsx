import { useState, useMemo } from 'react';
import { AlertTriangle, Trophy, TrendingUp, Bell, MapPin, Zap, Zap as ZapIcon } from 'lucide-react';
import { useApp, getLocation } from '../context/AppContext';
import { today, fromDateStr, formatShort, DAYS_SHORT } from '../utils/dates';
import WeekCard from './WeekCard';
import { getSelectionDetails } from '../utils/practiceSelector';

export default function CaptainDashboard({ weeks, currentWeekIndex }) {
  const {
    getWeekStats, getCaptainStats, captains,
    dayDetails, attendance, settings,
  } = useApp();

  const todayStr = today();

  const currentWeek = weeks[currentWeekIndex] ?? weeks[0];

  const selectionDetails = useMemo(() => {
    if (!currentWeek) return [];
    return getSelectionDetails(currentWeek.days, attendance, captains, dayDetails, 3);
  }, [currentWeek, attendance, captains, dayDetails]);
  const weekStats = getWeekStats(currentWeek?.days || []);
  const { coveredCount, totalActive, isCovered, isPartial } = weekStats;
  const missingDays = Math.max(0, settings.minCoveredDays - coveredCount);

  const captainStatsMap = getCaptainStats();
  const topCaptain = [...captains].sort((a, b) => (captainStatsMap[b.id] || 0) - (captainStatsMap[a.id] || 0))[0];
  const topCount = captainStatsMap[topCaptain?.id] || 0;

  const totalCovered = useMemo(() => {
    return weeks.reduce((acc, w) => {
      const { coveredCount: c } = getWeekStats(w.days);
      return acc + c;
    }, 0);
  }, [weeks, getWeekStats]);

  const dayCoverageItems = useMemo(() => {
    if (!currentWeek) return [];
    return currentWeek.days.map((dateStr, di) => {
      const cancelled = dayDetails[dateStr]?.cancelled;
      if (cancelled) return { dateStr, di, status: 'cancelled', count: 0 };
      const count = captains.filter(c => attendance[dateStr]?.[c.id] === true).length;
      if (count >= settings.minCaptainsPerDay) return { dateStr, di, status: 'covered', count };
      if (count > 0) return { dateStr, di, status: 'partial', count };
      return { dateStr, di, status: 'uncovered', count: 0 };
    });
  }, [currentWeek, dayDetails, captains, attendance, settings.minCaptainsPerDay]);

  const upcomingUncovered = useMemo(() => {
    const out = [];
    const allDays = weeks.flatMap(w => w.days);
    for (const d of allDays) {
      if (d <= todayStr) continue;
      if (dayDetails[d]?.cancelled) continue;
      const count = captains.filter(c => attendance[d]?.[c.id] === true).length;
      if (count === 0) {
        const dDate = fromDateStr(d);
        const nowDate = fromDateStr(todayStr);
        const diff = Math.round((dDate - nowDate) / 86400000);
        if (diff <= 14) out.push({ date: d, diff });
      }
      if (out.length >= 3) break;
    }
    return out;
  }, [weeks, dayDetails, captains, attendance, todayStr]);

  const coverageStatus = isCovered ? 'Covered' : isPartial ? 'Partial' : coveredCount === 0 && totalActive > 0 ? 'Needs Help' : 'Covered';
  const statusColor = isCovered
    ? { bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-300' }
    : isPartial
    ? { bg: 'bg-amber-500/20 border-amber-400/30', text: 'text-amber-300' }
    : coveredCount === 0 && totalActive > 0
    ? { bg: 'bg-red-500/20 border-red-400/30', text: 'text-red-300' }
    : { bg: 'bg-gray-500/20 border-gray-400/30', text: 'text-gray-300' };

  const barColor = (status) => {
    if (status === 'covered')   return '#10b981';
    if (status === 'partial')   return '#f59e0b';
    if (status === 'uncovered') return '#ef4444';
    return '#374151';
  };

  // Leaderboard: captains with at least 1 attended day
  const sortedCaptains = useMemo(() => {
    return [...captains]
      .map(c => ({ ...c, total: captainStatsMap[c.id] || 0 }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [captains, captainStatsMap]);

  const maxTotal = sortedCaptains[0]?.total || 1;

  // Schedule show/hide weeks
  const defaultShowCount = Math.min(weeks.length, Math.max(1, currentWeekIndex + 2));
  const [showCount, setShowCount] = useState(defaultShowCount);
  const visibleWeeks = weeks.slice(0, showCount);
  const showAll = showCount >= weeks.length;

  // Active announcements
  const activeAnnouncements = (settings.announcements || []).filter(a => a.active !== false);

  return (
    <div className="px-4 pt-4 pb-8 space-y-3">

      {/* Announcements strip */}
      {activeAnnouncements.length > 0 && (
        <div className="space-y-2">
          {activeAnnouncements.map(ann => (
            <div
              key={ann.id}
              className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-amber-950/40 border border-amber-800/40"
            >
              <Bell size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 font-medium leading-snug">{ann.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stats hero card */}
      <div className="bg-gradient-hero rounded-3xl overflow-hidden shadow-card-lg">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Zap size={12} className="text-emerald-400" fill="currentColor" />
                </div>
                <span className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-widest">
                  Week {currentWeekIndex + 1}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white leading-none tabular-nums">
                  {coveredCount}
                  <span className="text-2xl font-bold text-white/40">/{totalActive}</span>
                </span>
              </div>
              <p className="text-sm text-white/50 font-medium mt-0.5">days covered</p>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-sm ${statusColor.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isCovered ? 'bg-emerald-400' : isPartial ? 'bg-amber-400' : 'bg-red-400'
              }`} />
              <span className={`text-xs font-bold ${statusColor.text}`}>{coverageStatus}</span>
            </div>
          </div>

          {dayCoverageItems.length > 0 && (
            <div className="flex gap-1.5">
              {dayCoverageItems.map(({ dateStr, di, status }) => (
                <div key={dateStr} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-full transition-all duration-500"
                    style={{
                      height: '6px',
                      backgroundColor: status === 'cancelled' ? 'rgba(107,114,128,0.3)' : barColor(status),
                      opacity: status === 'cancelled' ? 0.4 : 1,
                      boxShadow: status !== 'cancelled' ? `0 0 8px ${barColor(status)}66` : 'none',
                    }}
                  />
                  <span className={`text-[9px] font-bold uppercase tracking-wide ${
                    status === 'covered'   ? 'text-emerald-400' :
                    status === 'partial'   ? 'text-amber-400' :
                    status === 'uncovered' ? 'text-red-400' :
                    'text-gray-600'
                  }`}>
                    {DAYS_SHORT[di]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats mini grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`rounded-2xl p-3.5 ${
          missingDays === 0 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-amber-50 dark:bg-amber-950/40'
        }`}>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={12} className={missingDays === 0 ? 'text-emerald-500' : 'text-amber-500'} />
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Missing</span>
          </div>
          <span className={`text-2xl font-black leading-none block ${
            missingDays === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}>{missingDays}</span>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">day{missingDays !== 1 ? 's' : ''} needed</p>
        </div>

        <div className="rounded-2xl p-3.5 bg-violet-50 dark:bg-violet-950/40">
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy size={12} className="text-violet-500 dark:text-violet-400" />
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Top</span>
          </div>
          <div className="flex items-center gap-1.5">
            {topCaptain && <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: topCaptain.color }} />}
            <span className="text-sm font-black text-violet-600 dark:text-violet-400 leading-none truncate">
              {topCaptain?.name?.split(' ')[0] || '—'}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{topCount > 0 ? `${topCount} days` : 'no data'}</p>
        </div>

        <div className="rounded-2xl p-3.5 bg-blue-50 dark:bg-blue-950/40">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={12} className="text-blue-500 dark:text-blue-400" />
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Season</span>
          </div>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none block">{totalCovered}</span>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">days covered</p>
        </div>
      </div>

      {/* Needs Coverage Soon */}
      {upcomingUncovered.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
              <Bell size={13} className="text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
              Needs Coverage Soon
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {upcomingUncovered.map(({ date, diff }) => {
              const loc = dayDetails[date]?.location;
              return (
                <div
                  key={date}
                  className="flex items-center gap-1.5 bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm"
                >
                  <MapPin size={11} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    {formatShort(date)}{loc ? ` · ${loc}` : ''}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {diff === 1 ? 'tmrw' : `${diff}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Voting transparency — this week's auto-selected days */}
      {selectionDetails.length > 0 && (
        <div>
          <div className="mb-2">
            <h2 className="text-base font-extrabold text-white">This Week's Picks</h2>
            <p className="text-xs text-gray-500 mt-0.5">Auto-selected by captain votes</p>
          </div>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            {selectionDetails.map((item, idx) => {
              const d = fromDateStr(item.date);
              const dow = d.toLocaleDateString('en-US', { weekday: 'short' });
              const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const loc = getLocation(dayDetails[item.date]?.location);
              return (
                <div
                  key={item.date}
                  className={`px-4 py-3 flex items-start gap-3 ${idx < selectionDetails.length - 1 ? 'border-b border-gray-800/60' : ''} ${item.isSelected ? '' : 'opacity-40'}`}
                >
                  {/* Selected indicator */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.isSelected ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                    {item.isSelected && <span className="text-white text-[9px] font-black">✓</span>}
                  </div>

                  {/* Day + votes */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-xs font-black text-gray-200">{dow} {dateLabel}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${item.isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700 text-gray-500'}`}>
                        {item.captainCount} vote{item.captainCount !== 1 ? 's' : ''}
                      </span>
                      {item.duncanTiebreaker && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 flex items-center gap-0.5">
                          ⚡ Duncan tiebreaker
                        </span>
                      )}
                      {item.isSelected && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md text-white/60 font-semibold" style={{ backgroundColor: loc.color + '33', color: loc.color }}>
                          {loc.short}
                        </span>
                      )}
                    </div>
                    {/* Voting captains */}
                    {item.votingCaptains.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {item.votingCaptains.map(c => (
                          <span
                            key={c.id}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: c.color + '20', color: c.color }}
                          >
                            {c.name.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-600">No votes yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule section */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-extrabold text-white">Practice Schedule</h2>
          <p className="text-xs text-gray-500 mt-0.5">Tap a day to toggle your attendance</p>
        </div>
        <div className="space-y-3">
          {visibleWeeks.map(week => (
            <WeekCard
              key={week.id}
              week={week}
              isCurrentWeek={week.index === currentWeekIndex}
              weekIndex={week.index}
            />
          ))}
        </div>
        {weeks.length > defaultShowCount && (
          <button
            onClick={() => setShowCount(showAll ? defaultShowCount : weeks.length)}
            className="w-full mt-3 py-3 rounded-2xl bg-gray-800/60 text-gray-400 text-xs font-bold border border-gray-700 hover:bg-gray-800 hover:text-gray-300 transition-all active:scale-[0.98]"
          >
            {showAll
              ? 'Show fewer'
              : `Show all ${weeks.length} weeks`}
          </button>
        )}
      </div>

      {/* Attendance Leaderboard */}
      {sortedCaptains.length > 0 && (
        <div>
          <div className="mb-3">
            <h2 className="text-base font-extrabold text-white">Captain Attendance</h2>
          </div>
          <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
            {sortedCaptains.map((captain, idx) => (
              <div
                key={captain.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx < sortedCaptains.length - 1 ? 'border-b border-gray-800/60' : ''
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: captain.color }}
                />
                <span className="text-sm font-semibold text-gray-200 w-20 flex-shrink-0 truncate">
                  {captain.name.split(' ')[0]}
                </span>
                <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(captain.total / maxTotal) * 100}%`,
                      backgroundColor: captain.color,
                    }}
                  />
                </div>
                <span
                  className="text-xs font-black w-8 text-right flex-shrink-0"
                  style={{ color: captain.color }}
                >
                  {captain.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
