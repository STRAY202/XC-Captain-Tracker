import { useRef, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, Ban, Star, Info, ChevronRight } from 'lucide-react';
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

  const override    = dayDetails[dateStr] || {};
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

  // Determine button background style
  let btnBg = {};
  let btnClass = '';

  if (isCancelled) {
    btnClass = 'bg-gray-100 dark:bg-gray-800/60 opacity-30 cursor-not-allowed';
  } else if (myAttending) {
    btnClass = 'cursor-pointer shadow-lg';
    btnBg = { backgroundColor: wt.color, boxShadow: `0 4px 16px ${wt.color}55` };
  } else if (covered) {
    btnClass = 'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-700 cursor-pointer';
  } else if (past) {
    btnClass = 'bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 cursor-pointer opacity-70';
  } else {
    btnClass = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 cursor-pointer';
  }

  const todayRing = todayDate && !isCancelled ? 'ring-2 ring-blue-400/60 dark:ring-blue-500/50' : '';

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Day label */}
      <span className={`text-[9px] font-black uppercase tracking-widest ${
        todayDate ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'
      }`}>
        {DAYS_SHORT[dayIndex]}
      </span>

      {/* Main button */}
      <button
        onClick={handleTap}
        disabled={!!isCancelled || !currentCaptainId}
        className={`
          relative w-full min-h-[62px] rounded-2xl flex flex-col items-center justify-center gap-0.5
          transition-all duration-200 active:scale-90 select-none
          ${btnClass} ${todayRing}
        `}
        style={btnBg}
      >
        {/* Workout emoji (top-right corner badge) */}
        {!isCancelled && override.workoutType && (
          <span className="absolute -top-1.5 -right-1 text-sm leading-none z-10 drop-shadow-sm">
            {wt.emoji}
          </span>
        )}

        {isCancelled ? (
          <Ban size={16} className="text-gray-400 dark:text-gray-600" />
        ) : (
          <>
            {/* Count number */}
            <span className={`text-2xl font-black leading-none ${
              myAttending
                ? 'text-white'
                : covered
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {count}
            </span>

            {/* Attending captain dots */}
            {attendingCaptains.length > 0 && (
              <div className="flex -space-x-0.5 mt-0.5">
                {attendingCaptains.slice(0, 3).map(c => (
                  <div
                    key={c.id}
                    className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white dark:border-gray-800"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
                {attendingCaptains.length > 3 && (
                  <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white dark:border-gray-800 bg-gray-400 flex items-center justify-center">
                    <span className="text-[5px] text-white font-black">+</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </button>

      {/* Date number + info trigger row */}
      <div className="flex items-center gap-0.5">
        <span className={`text-[10px] font-semibold leading-none ${
          todayDate ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'
        }`}>
          {formatShort(dateStr).split(' ')[1]}
        </span>
        <button
          onClick={() => onOpenModal(dateStr)}
          className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Day details"
        >
          <Info
            size={10}
            className={override.workoutType || override.notes
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-gray-300 dark:text-gray-700'
            }
          />
        </button>
      </div>

      {/* Status tags */}
      {isOptional && !isCancelled && (
        <span className="text-[8px] text-amber-500 font-black uppercase tracking-wide -mt-0.5">opt</span>
      )}
      {isCancelled && (
        <span className="text-[8px] text-gray-400 dark:text-gray-600 font-black uppercase tracking-wide -mt-0.5">off</span>
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
  const isUncovered = coveredCount === 0 && totalActive > 0;

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

  // Determine strip + badge colors based on status
  const stripColor = isCovered ? '#10b981' : isPartial ? '#f59e0b' : isUncovered ? '#ef4444' : '#9ca3af';

  const badgeConfig = isCovered
    ? { icon: CheckCircle2, text: `${coveredCount}/${settings.minCoveredDays}`, cls: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' }
    : isPartial
    ? { icon: Star,         text: `${coveredCount}/${settings.minCoveredDays}`, cls: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' }
    : isUncovered
    ? { icon: XCircle,      text: `0/${settings.minCoveredDays}`,               cls: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' }
    : { icon: Clock,        text: `—/${settings.minCoveredDays}`,                cls: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' };

  const BadgeIcon = badgeConfig.icon;

  return (
    <>
      <div
        ref={cardRef}
        className={`relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden transition-all duration-300 shadow-card ${
          isCurrentWeek ? 'ring-2 ring-blue-400/30 dark:ring-blue-500/30 shadow-card-lg' : ''
        }`}
      >
        {/* Left-edge status strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl"
          style={{ backgroundColor: stripColor }}
        />

        <div className="pl-5 pr-4 pt-4 pb-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 tracking-tight">
                Wk {weekIndex + 1}
              </span>
              {isCurrentWeek && (
                <span className="text-[9px] font-extrabold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                  NOW
                </span>
              )}
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{range}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                <Clock size={9} />
                {settings.defaultTime}
              </span>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${badgeConfig.cls}`}>
                <BadgeIcon size={9} />
                {badgeConfig.text}
              </div>
            </div>
          </div>

          {/* Day buttons grid */}
          <div className={`grid gap-2 mt-3 ${week.days.length <= 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
            {week.days.map((dateStr, di) => (
              <DayButton
                key={dateStr}
                dateStr={dateStr}
                dayIndex={di}
                onOpenModal={setModalDate}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            {/* My days note */}
            {myDays > 0 && currentCaptainId && currentCaptainId !== 'admin' && (
              <div className="flex items-center gap-1.5">
                <Star size={10} className="text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  You're in for {myDays} day{myDays !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Captain chips — only those attending */}
            <div className="flex flex-wrap gap-1.5 ml-auto">
              {captains.map(captain => {
                const count = week.days.filter(d =>
                  attendance[d]?.[captain.id] === true && !dayDetails[d]?.cancelled
                ).length;
                if (count === 0) return null;
                const isMe = captain.id === currentCaptainId;
                return (
                  <span
                    key={captain.id}
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isMe
                        ? 'text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                    style={
                      isMe
                        ? { backgroundColor: captain.color }
                        : { backgroundColor: captain.color + '18', color: captain.color }
                    }
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: captain.color }} />
                    {captain.name.split(' ')[0]}
                    <span className="opacity-60 font-normal">×{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Day detail modal */}
      {modalDate && (
        <DayModal dateStr={modalDate} onClose={() => setModalDate(null)} />
      )}
    </>
  );
}
