import { useMemo } from 'react';
import { CalendarCheck, AlertTriangle, Trophy, TrendingUp, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { today, fromDateStr, formatShort } from '../utils/dates';
import { getWorkoutType } from '../utils/workoutTypes';

function StatCard({ icon: Icon, label, value, sub, color, bg, extra }) {
  return (
    <div className={`rounded-2xl p-3.5 ${bg}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} className={`${color} flex-shrink-0`} />
        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {extra}
        <span className={`text-2xl font-extrabold ${color} leading-none`}>{value}</span>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

export default function Dashboard({ weeks, currentWeekIndex }) {
  const { getWeekStats, getCaptainStats, captains, dayDetails, attendance } = useApp();
  const todayStr = today();

  const currentWeek = weeks[currentWeekIndex] ?? weeks[0];
  const { coveredCount, totalActive, uncoveredDates, isCovered } = getWeekStats(currentWeek?.days || []);
  const missingDays = Math.max(0, 3 - coveredCount);

  // Top captain
  const stats = getCaptainStats();
  const topCaptain = [...captains].sort((a, b) => (stats[b.id] || 0) - (stats[a.id] || 0))[0];
  const topCount   = stats[topCaptain?.id] || 0;

  // All-time covered count
  const totalCovered = useMemo(() => {
    return weeks.reduce((acc, w) => {
      const { coveredCount: c } = getWeekStats(w.days);
      return acc + c;
    }, 0);
  }, [weeks, getWeekStats]);

  // Upcoming uncovered days (next 14 days, not cancelled, no coverage yet)
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

  const cards = [
    {
      icon:  CalendarCheck,
      label: 'This Week',
      value: `${coveredCount}/${totalActive}`,
      sub:   'days covered',
      color: isCovered ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
      bg:    isCovered ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-red-50 dark:bg-red-950/40',
    },
    {
      icon:  AlertTriangle,
      label: 'Needs Help',
      value: missingDays,
      sub:   `day${missingDays !== 1 ? 's' : ''} uncovered`,
      color: missingDays === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
      bg:    missingDays === 0 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      icon:  Trophy,
      label: 'Most Active',
      value: topCaptain?.name?.split(' ')[0] || '—',
      sub:   topCount > 0 ? `${topCount} practices` : 'no data yet',
      color: 'text-violet-600 dark:text-violet-400',
      bg:    'bg-violet-50 dark:bg-violet-950/40',
      extra: topCaptain ? (
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: topCaptain.color }} />
      ) : null,
    },
    {
      icon:  TrendingUp,
      label: 'Total Covered',
      value: totalCovered,
      sub:   'all-time practices',
      color: 'text-blue-600 dark:text-blue-400',
      bg:    'bg-blue-50 dark:bg-blue-950/40',
    },
  ];

  return (
    <div className="px-4 space-y-3">
      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Uncovered days warning */}
      {upcomingUncovered.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3.5 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={13} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
              Needs Coverage Soon
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {upcomingUncovered.map(({ date, diff }) => {
              const wt = getWorkoutType(dayDetails[date]?.workoutType);
              return (
                <div key={date} className="flex items-center gap-1.5 bg-white dark:bg-gray-900 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span>{wt.emoji}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                    {formatShort(date)}
                  </span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                    {diff === 1 ? 'tomorrow' : `in ${diff}d`}
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
