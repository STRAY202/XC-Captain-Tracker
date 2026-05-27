import { useMemo, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Ban, Star } from 'lucide-react';
import { DAYS_SHORT, formatShort, isToday, isPast, fromDateStr, today } from '../utils/dates';

function DayButton({
  dateStr,
  dayIndex,
  currentCaptainId,
  captains,
  attendingIds,
  override,
  onToggle,
  minCaptainsPerDay,
  defaultTime,
  isCurrentUser,
}) {
  const attending = attendingIds || [];
  const isCancelled = override?.cancelled;
  const isOptional = override?.optional;
  const dayTime = override?.customTime || defaultTime;
  const attendingCaptains = captains.filter(c => attending.includes(c.id));
  const myAttending = attending.includes(currentCaptainId);
  const covered = attending.length >= minCaptainsPerDay;
  const todayDate = isToday(dateStr);
  const past = isPast(dateStr);

  const handleClick = () => {
    if (!isCancelled && currentCaptainId && currentCaptainId !== 'admin') {
      onToggle(dateStr, currentCaptainId);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Day label */}
      <span className={`text-xs font-semibold uppercase tracking-wide ${
        todayDate
          ? 'text-blue-500 dark:text-blue-400'
          : 'text-gray-400 dark:text-gray-500'
      }`}>
        {DAYS_SHORT[dayIndex]}
      </span>

      {/* Date */}
      <span className={`text-xs ${
        todayDate
          ? 'text-blue-500 dark:text-blue-400 font-bold'
          : 'text-gray-400 dark:text-gray-500'
      }`}>
        {formatShort(dateStr).split(' ')[1]}
      </span>

      {/* Button */}
      <button
        onClick={handleClick}
        disabled={!!isCancelled || currentCaptainId === 'admin'}
        className={`
          w-full aspect-square min-h-[52px] max-h-[64px] rounded-xl flex flex-col items-center justify-center gap-0.5
          transition-all duration-200 active:scale-95 select-none
          ${isCancelled
            ? 'bg-gray-100 dark:bg-gray-800 opacity-40 cursor-not-allowed'
            : currentCaptainId === 'admin'
            ? 'cursor-default'
            : 'cursor-pointer'
          }
          ${!isCancelled && myAttending
            ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400 dark:ring-emerald-600'
            : !isCancelled
            ? `bg-white dark:bg-gray-800 border ${
                covered
                  ? 'border-emerald-300 dark:border-emerald-700'
                  : past
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500'
              }`
            : ''
          }
          ${todayDate && !isCancelled ? 'ring-2 ring-blue-400/50 dark:ring-blue-500/40' : ''}
        `}
      >
        {isCancelled ? (
          <Ban size={16} className="text-gray-400" />
        ) : (
          <>
            {/* Count bubble */}
            <span className={`text-lg font-bold leading-none ${
              myAttending ? 'text-white' : covered ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {attending.length}
            </span>

            {/* Mini avatar strip */}
            {attendingCaptains.length > 0 && (
              <div className="flex -space-x-1">
                {attendingCaptains.slice(0, 3).map(c => (
                  <div
                    key={c.id}
                    className="w-2.5 h-2.5 rounded-full border border-white dark:border-gray-800 flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </button>

      {/* Optional tag */}
      {isOptional && !isCancelled && (
        <span className="text-[9px] text-amber-500 font-medium uppercase tracking-wide">opt</span>
      )}
      {/* Cancelled tag */}
      {isCancelled && (
        <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">off</span>
      )}
    </div>
  );
}

export default function WeekCard({
  week,
  captains,
  currentCaptainId,
  attendance,
  dayOverrides,
  settings,
  isCurrentWeek,
  getWeekCoverage,
  onToggle,
  weekIndex,
}) {
  const cardRef = useRef(null);

  const { coveredCount, totalActive } = getWeekCoverage(week.days);
  const isCovered = coveredCount >= settings.minCoveredDays;
  const todayStr = today();

  // Scroll into view if current week
  useEffect(() => {
    if (isCurrentWeek && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, [isCurrentWeek]);

  // Format week range header
  const firstDay = week.days[0];
  const lastDay = week.days[week.days.length - 1];
  const firstDate = fromDateStr(firstDay);
  const lastDate = fromDateStr(lastDay);
  const weekRangeStr = `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${lastDate.toLocaleDateString('en-US', { day: 'numeric' })}`;

  // My days this week
  const myDaysCount = week.days.filter(d => (attendance[d] || []).includes(currentCaptainId)).length;

  const statusColor = isCovered
    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
    : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';

  const statusRing = isCurrentWeek ? 'ring-4 ring-blue-400/30 dark:ring-blue-500/30' : '';

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl border-2 p-4 transition-all duration-300 ${statusColor} ${statusRing}`}
      style={{ animationDelay: `${weekIndex * 40}ms` }}
    >
      {/* Week header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Week {weekIndex + 1}
          </span>
          {isCurrentWeek && (
            <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
              Now
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Time */}
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Clock size={10} />
            {settings.defaultTime}
          </span>

          {/* Coverage badge */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            isCovered
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
          }`}>
            {isCovered
              ? <CheckCircle2 size={10} />
              : <XCircle size={10} />
            }
            {coveredCount}/{settings.minCoveredDays}
          </div>
        </div>
      </div>

      {/* Date range */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{weekRangeStr}</p>

      {/* Day buttons grid */}
      <div className={`grid gap-2 ${
        week.days.length <= 5 ? 'grid-cols-5' : 'grid-cols-6'
      }`}>
        {week.days.map((dateStr, di) => {
          const override = dayOverrides[dateStr];
          return (
            <DayButton
              key={dateStr}
              dateStr={dateStr}
              dayIndex={di}
              currentCaptainId={currentCaptainId}
              captains={captains}
              attendingIds={attendance[dateStr] || []}
              override={override}
              onToggle={onToggle}
              minCaptainsPerDay={settings.minCaptainsPerDay}
              defaultTime={settings.defaultTime}
            />
          );
        })}
      </div>

      {/* My attendance hint */}
      {currentCaptainId && currentCaptainId !== 'admin' && myDaysCount > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Star size={10} className="text-emerald-500" />
          <span>You're attending {myDaysCount} day{myDaysCount !== 1 ? 's' : ''} this week</span>
        </div>
      )}

      {/* Attending captains summary */}
      {captains.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {captains.map(captain => {
            const count = week.days.filter(d =>
              (attendance[d] || []).includes(captain.id) && !dayOverrides[d]?.cancelled
            ).length;
            if (count === 0) return null;
            const isMe = captain.id === currentCaptainId;
            return (
              <span
                key={captain.id}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  isMe
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60'
                }`}
                style={isMe ? { backgroundColor: captain.color } : {}}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: captain.color }}
                />
                {captain.name.split(' ')[0]}
                <span className="opacity-70">×{count}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
