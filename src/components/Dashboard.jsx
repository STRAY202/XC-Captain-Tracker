import { useMemo } from 'react';
import { CalendarCheck, AlertTriangle, Trophy, TrendingUp, Bell, Zap, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { today, fromDateStr, formatShort, DAYS_SHORT } from '../utils/dates';

export default function Dashboard({ weeks, currentWeekIndex }) {
  const { getWeekStats, getCaptainStats, captains, dayDetails, attendance, settings, currentCaptainId } = useApp();
  const todayStr = today();

  const currentWeek = weeks[currentWeekIndex] ?? weeks[0];
  const weekStats = getWeekStats(currentWeek?.days || []);
  const { coveredCount, totalActive, isCovered, isPartial } = weekStats;
  const missingDays = Math.max(0, settings.minCoveredDays - coveredCount);

  const captainStatsMap = getCaptainStats();
  const topCaptain = [...captains].sort((a, b) => (captainStatsMap[b.id] || 0) - (captainStatsMap[a.id] || 0))[0];
  const topCount   = captainStatsMap[topCaptain?.id] || 0;

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
      if (cancelled) return { dateStr, di, status: 'cancelled' };
      const count = captains.filter(c => attendance[dateStr]?.[c.id] === true).length;
      if (count >= settings.minCaptainsPerDay) return { dateStr, di, status: 'covered', count };
      if (count > 0) return { dateStr, di, status: 'partial', count };
      return { dateStr, di, status: 'uncovered', count };
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

  return (
    <div className="px-4 space-y-3">

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
    </div>
  );
}
