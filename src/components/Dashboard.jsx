import { useMemo } from 'react';
import { CalendarCheck, AlertCircle, Trophy, TrendingUp } from 'lucide-react';
import { today, fromDateStr, toDateStr } from '../utils/dates';

export default function Dashboard({ weeks, attendance, dayOverrides, captains, settings, getWeekCoverage, getCaptainStats }) {
  const todayStr = today();

  // Find current week
  const currentWeek = useMemo(() => {
    return weeks.find(w => {
      const first = fromDateStr(w.days[0]);
      const last = fromDateStr(w.days[w.days.length - 1]);
      const now = fromDateStr(todayStr);
      return now >= first && now <= last;
    }) || weeks[0];
  }, [weeks, todayStr]);

  // Current week stats
  const { coveredCount: thisWeekCovered, totalActive } = getWeekCoverage(currentWeek?.days || []);
  const missingDays = Math.max(0, settings.minCoveredDays - thisWeekCovered);

  // Captain stats
  const captainStats = getCaptainStats();
  const sortedCaptains = [...captains].sort((a, b) => (captainStats[b.id] || 0) - (captainStats[a.id] || 0));
  const topCaptain = sortedCaptains[0];
  const topCount = captainStats[topCaptain?.id] || 0;

  // Total covered practices all-time
  const totalCovered = useMemo(() => {
    return weeks.reduce((acc, w) => {
      const { coveredCount } = getWeekCoverage(w.days);
      return acc + coveredCount;
    }, 0);
  }, [weeks, getWeekCoverage]);

  const stats = [
    {
      icon: CalendarCheck,
      label: 'This Week',
      value: `${thisWeekCovered}/${totalActive}`,
      sub: 'days covered',
      color: thisWeekCovered >= settings.minCoveredDays
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-500 dark:text-red-400',
      bg: thisWeekCovered >= settings.minCoveredDays
        ? 'bg-emerald-50 dark:bg-emerald-950/40'
        : 'bg-red-50 dark:bg-red-950/40',
    },
    {
      icon: AlertCircle,
      label: 'Needs Coverage',
      value: missingDays,
      sub: `day${missingDays !== 1 ? 's' : ''} missing`,
      color: missingDays === 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-amber-600 dark:text-amber-400',
      bg: missingDays === 0
        ? 'bg-emerald-50 dark:bg-emerald-950/40'
        : 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      icon: Trophy,
      label: 'Most Active',
      value: topCaptain?.name?.split(' ')[0] || '—',
      sub: topCount > 0 ? `${topCount} practices` : 'no data yet',
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      dotColor: topCaptain?.color,
    },
    {
      icon: TrendingUp,
      label: 'Total Covered',
      value: totalCovered,
      sub: 'all time',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-4 mb-4 animate-fade-in">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className={`rounded-2xl p-3.5 ${s.bg}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon size={13} className={`${s.color} flex-shrink-0`} />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                {s.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {s.dotColor && (
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.dotColor }}
                />
              )}
              <span className={`text-2xl font-bold ${s.color} leading-none`}>
                {s.value}
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
