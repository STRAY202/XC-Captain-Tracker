import { useRef, useEffect, useState } from 'react';

import { Check, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fromDateStr, isToday } from '../utils/dates';

// ── Workout input ─────────────────────────────────────────────────────────────
function WorkoutInput({ dateStr, initialValue, onSave }) {
  const [value, setValue] = useState(initialValue || '');
  useEffect(() => { setValue(initialValue || ''); }, [initialValue]);
  return (
    <input
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={() => onSave(dateStr, value)}
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
      placeholder="Workout description…"
      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
    />
  );
}

// ── Location config ───────────────────────────────────────────────────────────
const LOC = {
  memorial:  { label: 'Memorial',               short: 'Memorial',  color: '#10b981' },
  cutler:    { label: 'Cutler Park',             short: 'Cutler',    color: '#3b82f6' },
  peninsula: { label: 'Charles River Peninsula', short: 'Peninsula', color: '#8b5cf6' },
  other:     { label: 'Other',                   short: '',          color: '#f97316' },
};

function locKey(loc) {
  if (!loc || loc === 'Memorial')  return 'memorial';
  if (loc === 'Cutler Park')       return 'cutler';
  if (loc === 'Peninsula' || loc === 'Charles River Peninsula') return 'peninsula';
  return 'other';
}
function locInfo(loc) {
  const k = locKey(loc);
  if (k === 'other') return { ...LOC.other, short: loc || '' };
  return LOC[k];
}

// ── Day card ──────────────────────────────────────────────────────────────────
function DayCard({ dateStr, editMode, onEditTap }) {
  const {
    captains, attendance, dayDetails, settings,
    currentCaptainId, isCaptainAttending, toggleAttendance,
  } = useApp();

  const override    = dayDetails[dateStr] || {};
  const isCancelled = override.cancelled;
  const currentLoc  = override.location || 'Memorial';
  const ld          = locInfo(currentLoc);
  const attending   = captains.filter(c => attendance[dateStr]?.[c.id] === true);
  const myAttending = isCaptainAttending(dateStr, currentCaptainId) && !isCancelled;
  const covered     = !isCancelled && attending.length >= settings.minCaptainsPerDay;
  const partial     = !isCancelled && !covered && attending.length > 0;
  const todayDate   = isToday(dateStr);
  const canToggle   = !isCancelled && !editMode && currentCaptainId && currentCaptainId !== 'admin';

  const d       = fromDateStr(dateStr);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateNum = d.getDate();

  const handleClick = () => {
    if (editMode) { onEditTap?.(); return; }
    if (canToggle) toggleAttendance(dateStr, currentCaptainId);
  };

  if (isCancelled) {
    return (
      <button
        onClick={handleClick}
        className={`h-full flex flex-col items-center pt-2.5 rounded-2xl overflow-hidden opacity-30 transition-all bg-gray-100 dark:bg-gray-800 ${
          editMode ? 'ring-2 ring-violet-400/60 opacity-50 active:opacity-70' : ''
        }`}
      >
        <span className="text-[8px] font-black uppercase tracking-wider text-gray-500 leading-none">{dayName}</span>
        <span className="text-[17px] font-black text-gray-500 leading-tight mt-0.5">{dateNum}</span>
        <div className="flex-1" />
        <div className="w-5 h-0.5 rounded-full bg-gray-400 mb-2" />
        <div className="w-full h-[3px] bg-gray-300 dark:bg-gray-600" />
      </button>
    );
  }

  const cardStyle = myAttending && !editMode
    ? { backgroundColor: '#10b981', boxShadow: '0 4px 16px #10b98145' }
    : {};

  const borderClass = editMode
    ? 'ring-2 ring-violet-400/60'
    : myAttending
    ? ''
    : covered
    ? 'border-2 border-emerald-400 dark:border-emerald-600'
    : partial
    ? 'border border-amber-300 dark:border-amber-700'
    : 'border border-gray-100 dark:border-gray-800';

  const todayRing = todayDate && !myAttending && !editMode
    ? 'ring-2 ring-blue-400/50 dark:ring-blue-500/40'
    : '';

  return (
    <button
      onClick={handleClick}
      className={`h-full flex flex-col items-center pt-2.5 rounded-2xl overflow-hidden select-none transition-all active:scale-95 bg-white dark:bg-gray-900 shadow-sm ${borderClass} ${todayRing}`}
      style={cardStyle}
    >
      <span className={`text-[8px] font-black uppercase tracking-wider leading-none ${
        myAttending && !editMode ? 'text-white/70'
        : todayDate ? 'text-blue-500 dark:text-blue-400'
        : 'text-gray-400 dark:text-gray-500'
      }`}>
        {dayName}
      </span>

      <span className={`text-[17px] font-black leading-tight mt-0.5 ${
        myAttending && !editMode ? 'text-white'
        : todayDate ? 'text-blue-600 dark:text-blue-300'
        : 'text-gray-800 dark:text-gray-100'
      }`}>
        {dateNum}
      </span>

      <span
        className="text-[8px] font-bold leading-none mt-1.5 truncate w-full text-center px-0.5"
        style={{ color: myAttending && !editMode ? 'rgba(255,255,255,0.75)' : ld.color }}
      >
        {ld.short}
      </span>

      <span className={`text-[11px] font-black leading-none mt-1 ${
        myAttending && !editMode ? 'text-white/90'
        : covered   ? 'text-emerald-500 dark:text-emerald-400'
        : partial   ? 'text-amber-500 dark:text-amber-400'
        : 'text-gray-300 dark:text-gray-600'
      }`}>
        {myAttending && !editMode
          ? <Check size={10} strokeWidth={3} className="inline" />
          : attending.length
        }
      </span>

      {!myAttending && attending.length > 0 && !editMode && (
        <div className="flex -space-x-0.5 mt-1">
          {attending.slice(0, 3).map(c => (
            <div
              key={c.id}
              className="w-[6px] h-[6px] rounded-full ring-[1px] ring-white dark:ring-gray-900"
              style={{ backgroundColor: c.color }}
            />
          ))}
        </div>
      )}

      <div className="flex-1 min-h-[4px]" />
      <div
        className="w-full h-[3px] flex-shrink-0"
        style={{
          backgroundColor: myAttending && !editMode ? 'rgba(255,255,255,0.3)' : ld.color,
        }}
      />
    </button>
  );
}

// ── Week card ─────────────────────────────────────────────────────────────────
export default function WeekCard({ week, isCurrentWeek, weekIndex }) {
  const cardRef = useRef(null);
  const {
    getWeekStats, captains, attendance, dayDetails, settings,
    currentCaptainId, isAdmin, userMode, setDayDetail, clearDayDetail,
    workouts, setWorkout,
  } = useApp();

  const canEdit = userMode === 'captain' || currentCaptainId === 'admin';

  const [editMode,  setEditMode]  = useState(false);
  const [brush,     setBrush]     = useState('memorial');
  const [otherName, setOtherName] = useState('');

  const { coveredCount, totalActive, isCovered, isPartial } = getWeekStats(week.days);
  const isUncovered = coveredCount === 0 && totalActive > 0;
  const stripColor  = isCovered ? '#10b981' : isPartial ? '#f59e0b' : isUncovered ? '#ef4444' : '#9ca3af';

  useEffect(() => {
    if (isCurrentWeek && cardRef.current) {
      const t = setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 500);
      return () => clearTimeout(t);
    }
  }, [isCurrentWeek]);

  const firstDate = fromDateStr(week.days[0]);
  const lastDate  = fromDateStr(week.days[week.days.length - 1]);
  const range = `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${lastDate.toLocaleDateString('en-US', { day: 'numeric' })}`;
  const myDays = week.days.filter(d => attendance[d]?.[currentCaptainId] === true).length;

  const numDays  = week.days.length;
  const gridCols = numDays <= 3 ? 'grid-cols-3'
                 : numDays <= 4 ? 'grid-cols-4'
                 : numDays <= 5 ? 'grid-cols-5'
                 : 'grid-cols-6';

  // Brushes — Cancel Day is admin-only
  const brushes = [
    { id: 'memorial',  label: 'Memorial',  color: '#10b981' },
    { id: 'cutler',    label: 'Cutler',    color: '#3b82f6' },
    { id: 'peninsula', label: 'Peninsula', color: '#8b5cf6' },
    { id: 'other',     label: 'Other…',    color: '#f97316' },
    ...(isAdmin ? [{ id: 'cancel', label: 'Cancel Day', color: '#ef4444' }] : []),
  ];

  const applyBrush = (dateStr) => {
    const override = dayDetails[dateStr] || {};
    if (brush === 'cancel' && isAdmin) {
      if (!override.cancelled) {
        setDayDetail(dateStr, { cancelled: true });
      } else {
        const { cancelled: _, ...rest } = override;
        Object.keys(rest).length === 0
          ? clearDayDetail(dateStr)
          : setDayDetail(dateStr, { cancelled: false });
      }
    } else if (brush === 'memorial') {
      setDayDetail(dateStr, { location: 'Memorial', cancelled: false });
    } else if (brush === 'cutler') {
      setDayDetail(dateStr, { location: 'Cutler Park', cancelled: false });
    } else if (brush === 'peninsula') {
      setDayDetail(dateStr, { location: 'Peninsula', cancelled: false });
    } else if (brush === 'other' && otherName.trim()) {
      setDayDetail(dateStr, { location: otherName.trim(), cancelled: false });
    }
  };

  // Tour IDs — only attach to the first week card so onboarding can spotlight them
  const tourId = (name) => weekIndex === 0 ? name : undefined;

  return (
    <div
      ref={cardRef}
      className={`relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-card transition-all duration-300 ${
        isCurrentWeek ? 'ring-2 ring-blue-400/30 dark:ring-blue-500/30 shadow-card-lg' : ''
      }`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl" style={{ backgroundColor: stripColor }} />

      <div className="pl-5 pr-4 pt-4 pb-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">Wk {weekIndex + 1}</span>
            {isCurrentWeek && (
              <span className="text-[9px] font-extrabold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">NOW</span>
            )}
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{range}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              id={tourId('tour-coverage')}
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                isCovered     ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : isPartial   ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                : isUncovered ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                :               'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}
            >
              {coveredCount}/{settings.minCoveredDays}
            </span>

            {canEdit && (
              <button
                id={tourId('tour-edit-btn')}
                onClick={() => { setEditMode(s => !s); setBrush('memorial'); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 ${
                  editMode
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {editMode ? '✓ Done' : <><Pencil size={10} /> Edit</>}
              </button>
            )}
          </div>
        </div>

        {/* Day grid */}
        <div id={tourId('tour-day-grid')} className={`grid ${gridCols} gap-1`}>
          {week.days.map(dateStr => (
            <DayCard
              key={dateStr}
              dateStr={dateStr}
              editMode={editMode}
              onEditTap={() => applyBrush(dateStr)}
            />
          ))}
        </div>

        {/* Edit panel */}
        {editMode && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl animate-fade-in space-y-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                Location · tap a day above
              </p>
              <div className="flex gap-2 flex-wrap">
                {brushes.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setBrush(b.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      brush === b.id
                        ? 'text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm'
                    }`}
                    style={brush === b.id ? { backgroundColor: b.color } : {}}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {brush === 'other' && (
                <input
                  type="text"
                  value={otherName}
                  onChange={e => setOtherName(e.target.value)}
                  placeholder="Type location name, then tap days…"
                  className="mt-2 w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                />
              )}
            </div>

            {/* Workout per day */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                Workouts
              </p>
              <div className="space-y-1.5">
                {week.days.filter(d => !dayDetails[d]?.cancelled).map(d => {
                  const dd = fromDateStr(d);
                  const label = dd.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  return (
                    <div key={d} className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 w-16 flex-shrink-0 leading-tight">{label}</span>
                      <WorkoutInput dateStr={d} initialValue={workouts[d]} onSave={setWorkout} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Captain summary */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          {myDays > 0 && currentCaptainId && currentCaptainId !== 'admin' && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                You're in {myDays} day{myDays !== 1 ? 's' : ''}
              </span>
            </div>
          )}
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
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={isMe
                    ? { backgroundColor: captain.color, color: '#fff' }
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
  );
}
