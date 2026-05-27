import { useRef, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, Ban, Star, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DAYS_SHORT, formatShort, isToday, isPast, fromDateStr } from '../utils/dates';
import { getWorkoutType } from '../utils/workoutTypes';
import DayModal from './DayModal';

// ── Individual day button ──────────────────────────────────────────────────────
function DayButton({ dateStr, dayIndex, onOpenModal }) {
  const {
    captains, currentCaptainId, attendance, dayDetails,
    settings, toggleAttendance, isCaptainAttending,
  } = useApp();

  const override   = dayDetails[dateStr] || {};
  const isCancelled = override.cancelled;
  const isOptional  = override.optional;
  const wt          = getWorkoutType(override.workoutType);
  const todayDate   = isToday(dateStr);
  const past        = isPast(dateStr);

  const attendingCaptains = captains.filter(c => attendance[dateStr]?.[c.id] === true);
  const count       = attendingCaptains.length;
  const myAttending = isCaptainAttending(dateStr, currentCaptainId);
  const covered     = count >= settings.minCaptainsPerDay;
  const isAdmin     = currentCaptainId === 'admin';

  const handleTap = (e) => {
    e.stopPropagation();
    if (isCancelled) return;
    if (!isAdmin && currentCaptainId) {
      toggleAttendance(dateStr, currentCaptainId);
    }
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Day label */}
      <span className={`text-[10px] font-bold uppercase tracking-widest ${
        todayDate ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
      }`}>
        {DAYS_SHORT[dayIndex]}
      </span>
      {/* Date number */}
      <span className={`text-[11px] font-semibold ${
        todayDate ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
      }`}>
        {formatShort(dateStr).split(' ')[1]}
      </span>

      {/* Main button */}
      <button
        onClick={handleTap}
        disabled={!!isCancelled || !currentCaptainId}
        className={`
          relative w-full aspect-square min-h-[54px] max-h-[66px] rounded-xl flex flex-col items-center justify-center gap-0.5
          transition-all duration-200 active:scale-90 select-none
          ${isCancelled
            ? 'bg-gray-100 dark:bg-gray-800/60 cursor-not-allowed opacity-40'
            : myAttending
            ? 'cursor-pointer shadow-lg'
            : `bg-white dark:bg-gray-800 ${
                covered
                  ? 'border-2 border-emerald-300 dark:border-emerald-700'
                  : past
                  ? 'border border-gray-200 dark:border-gray-700'
                  : 'border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'
              } cursor-pointer`
          }
          ${myAttending && !isCancelled ? 'ring-2 ring-white dark:ring-gray-950' : ''}
          ${todayDate && !isCancelled ? 'ring-2 ring-blue-400/50 dark:ring-blue-500/40' : ''}
        `}
        style={myAttending && !isCancelled ? { backgroundColor: wt.color, boxShadow: `0 4px 14px ${wt.color}44` } : {}}
      >
        {/* Workout emoji badge (top-right) */}
        {!isCancelled && override.workoutType && (
          <span className="absolute -top-1 -right-1 text-[11px] leading-none z-10">{wt.emoji}</span>
        )}

        {isCancelled ? (
          <Ban size={15} className="text-gray-400" />
        ) : (
          <>
            <span className={`text-lg font-extrabold leading-none ${
              myAttending ? 'text-white' : covered ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {count}
            </span>
            {attendingCaptains.length > 0 && (
              <div className="flex -space-x-0.5">
                {attendingCaptains.slice(0, 3).map(c => (
                  <div
                    key={c.id}
                    className="w-2.5 h-2.5 rounded-full border border-white dark:border-gray-800"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </button>

      {/* Info button (opens modal) */}
      <button
        onClick={() => onOpenModal(dateStr)}
        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mt-0.5"
        title="Day details"
      >
        <Info size={11} className={override.workoutType ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-600'} />
      </button>

      {/* Tags */}
      {isOptional && !isCancelled && (
        <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wide -mt-0.5">opt</span>
      )}
      {isCancelled && (
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide -mt-0.5">off</span>
      )}
    </div>
  );
}

// ── Week card ──────────────────────────────────────────────────────────────────
export default function WeekCard({ week, isCurrentWeek, weekIndex }) {
  const cardRef = useRef(null);
  const [modalDate, setModalDate] = useState(null);
  const { getWeekStats, captains, attendance, dayDetails, settings, currentCaptainId } = useApp();

  const { coveredCount, totalActive, isCovered, isPartial } = getWeekStats(week.days);

  // Scroll current week into view
  useEffect(() => {
    if (isCurrentWeek && cardRef.current) {
      const timer = setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isCurrentWeek]);

  const firstDate = fromDateStr(week.days[0]);
  const lastDate  = fromDateStr(week.days[week.days.length - 1]);
  const range = `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${lastDate.toLocaleDateString('en-US', { day: 'numeric' })}`;

  // My days count this week
  const myDays = week.days.filter(d => attendance[d]?.[currentCaptainId] === true).length;

  // Card border/bg
  let cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800';
  let badgeClass = 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400';
  if (isCovered) {
    cardClass = 'bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800';
    badgeClass = 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300';
  } else if (isPartial) {
    cardClass = 'bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800';
    badgeClass = 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300';
  } else if (coveredCount === 0 && totalActive > 0) {
    cardClass = 'bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800';
    badgeClass = 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400';
  }

  const ringClass = isCurrentWeek ? 'ring-4 ring-blue-400/30 dark:ring-blue-500/30' : '';

  return (
    <>
      <div
        ref={cardRef}
        className={`rounded-2xl p-4 transition-all duration-300 ${cardClass} ${ringClass}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Wk {weekIndex + 1}
            </span>
            {isCurrentWeek && (
              <span className="text-[10px] font-extrabold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                Now
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
              <Clock size={9} />
              {settings.defaultTime}
            </span>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${badgeClass}`}>
              {isCovered ? <CheckCircle2 size={10} /> : isPartial ? <Star size={10} /> : <XCircle size={10} />}
              {coveredCount}/{settings.minCoveredDays}
            </div>
          </div>
        </div>

        {/* Date range */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">{range}</p>

        {/* Day buttons */}
        <div className={`grid gap-1.5 ${week.days.length <= 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
          {week.days.map((dateStr, di) => (
            <DayButton
              key={dateStr}
              dateStr={dateStr}
              dayIndex={di}
              onOpenModal={setModalDate}
            />
          ))}
        </div>

        {/* My attendance hint */}
        {myDays > 0 && currentCaptainId && currentCaptainId !== 'admin' && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Star size={10} className="text-emerald-500" />
            <span>You're attending {myDays} day{myDays !== 1 ? 's' : ''} this week</span>
          </div>
        )}

        {/* Attending captain chips */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {captains.map(captain => {
            const count = week.days.filter(d =>
              attendance[d]?.[captain.id] === true && !dayDetails[d]?.cancelled
            ).length;
            if (count === 0) return null;
            const isMe = captain.id === currentCaptainId;
            return (
              <span
                key={captain.id}
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  isMe ? 'text-white shadow-sm' : 'bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300'
                }`}
                style={isMe ? { backgroundColor: captain.color } : {}}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: captain.color }} />
                {captain.name.split(' ')[0]}
                <span className="opacity-60">×{count}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Day detail modal */}
      {modalDate && (
        <DayModal dateStr={modalDate} onClose={() => setModalDate(null)} />
      )}
    </>
  );
}
