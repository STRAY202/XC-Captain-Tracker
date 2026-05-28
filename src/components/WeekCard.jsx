import { useRef, useEffect, useState, useCallback } from 'react';
import { Check, X, MapPin, Users, Ban } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fromDateStr, isToday } from '../utils/dates';

// ── Location config ───────────────────────────────────────────────────────────
const LOCATIONS = {
  memorial:  { label: 'Memorial',    short: 'Memorial', color: '#10b981', bg: '#10b98112' },
  cutler:    { label: 'Cutler Park', short: 'Cutler',   color: '#3b82f6', bg: '#3b82f612' },
  other:     { label: 'Other',       short: '',         color: '#8b5cf6', bg: '#8b5cf612' },
};

function locKey(loc) {
  if (!loc || loc === 'Memorial')  return 'memorial';
  if (loc === 'Cutler Park')       return 'cutler';
  return 'other';
}
function locData(loc) {
  const k = locKey(loc);
  if (k === 'other') return { ...LOCATIONS.other, short: loc?.slice(0, 7) || '' };
  return LOCATIONS[k];
}

// ── Reliable long-press via Pointer Events ────────────────────────────────────
function useLongPress(onLongPress, ms = 500) {
  const timer   = useRef(null);
  const fired   = useRef(false);
  const pointerId = useRef(null);

  const start = useCallback((e) => {
    pointerId.current = e.pointerId;
    fired.current = false;
    timer.current = setTimeout(() => {
      fired.current = true;
      onLongPress();
    }, ms);
  }, [onLongPress, ms]);

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
  }, []);

  return {
    onPointerDown:   start,
    onPointerUp:     cancel,
    onPointerLeave:  cancel,
    onPointerCancel: cancel,
    onContextMenu:   (e) => e.preventDefault(),
    wasFired:        () => fired.current,
  };
}

// ── Day edit sheet (long-press) ───────────────────────────────────────────────
function DayEditSheet({ dateStr, onClose }) {
  const { captains, attendance, dayDetails, settings, isAdmin, setDayDetail, clearDayDetail } = useApp();

  const override    = dayDetails[dateStr] || {};
  const isCancelled = override.cancelled;
  const currentLoc  = override.location || 'Memorial';
  const ld          = locData(currentLoc);
  const key         = locKey(currentLoc);
  const attending   = captains.filter(c => attendance[dateStr]?.[c.id] === true);
  const covered     = attending.length >= settings.minCaptainsPerDay;

  const [otherText, setOtherText] = useState(key === 'other' ? currentLoc : '');
  useEffect(() => { if (key === 'other') setOtherText(currentLoc); }, [currentLoc, key]);

  const d       = fromDateStr(dateStr);
  const dayFull = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const setLoc = (k) => {
    if (k === 'memorial')    setDayDetail(dateStr, { location: 'Memorial' });
    else if (k === 'cutler') setDayDetail(dateStr, { location: 'Cutler Park' });
    else                     setOtherText('');
  };

  const commitOther = () => {
    const v = otherText.trim();
    if (v) setDayDetail(dateStr, { location: v });
  };

  const toggleCancel = () => {
    if (!isCancelled) {
      setDayDetail(dateStr, { cancelled: true });
    } else {
      const { cancelled: _, ...rest } = override;
      Object.keys(rest).length === 0 ? clearDayDetail(dateStr) : setDayDetail(dateStr, { cancelled: false });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto shadow-2xl animate-sheet-up">

        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isCancelled && (
              <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest mb-1 inline-block">
                Cancelled
              </span>
            )}
            <h2 className={`text-lg font-black text-gray-900 dark:text-white leading-tight ${isCancelled ? 'line-through opacity-40' : ''}`}>
              {dayFull}
            </h2>
            {!isCancelled && (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={12} style={{ color: ld.color }} />
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{currentLoc}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-90 transition-all"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-8 space-y-5">

          {/* Location picker — admin only */}
          {isAdmin && !isCancelled && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Location</p>
              <div className="flex gap-2">
                {[
                  { k: 'memorial', label: 'Memorial',    color: LOCATIONS.memorial.color },
                  { k: 'cutler',   label: 'Cutler Park', color: LOCATIONS.cutler.color },
                  { k: 'other',    label: 'Other…',      color: LOCATIONS.other.color },
                ].map(opt => (
                  <button
                    key={opt.k}
                    onClick={() => setLoc(opt.k)}
                    className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                      key === opt.k ? 'text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                    style={key === opt.k ? { backgroundColor: opt.color } : {}}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {key === 'other' && (
                <input
                  type="text"
                  value={otherText}
                  onChange={e => setOtherText(e.target.value)}
                  onBlur={commitOther}
                  onKeyDown={e => e.key === 'Enter' && commitOther()}
                  placeholder="Type location name…"
                  autoFocus
                  className="mt-2.5 w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                />
              )}
            </div>
          )}

          {/* Attending captains */}
          {!isCancelled && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Users size={11} className="text-gray-400" />
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Attending ({attending.length})
                </span>
                {covered && (
                  <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    ✓ Covered
                  </span>
                )}
              </div>
              {attending.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No one signed up yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {attending.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: c.color }}
                    >
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                        {c.name.charAt(0)}
                      </div>
                      {c.name.split(' ')[0]}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cancel / Restore — admin only */}
          {isAdmin && (
            <button
              onClick={toggleCancel}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] ${
                isCancelled
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
              }`}
            >
              <Ban size={14} />
              {isCancelled ? 'Restore Practice' : 'Cancel Practice'}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Day card ──────────────────────────────────────────────────────────────────
function DayCard({ dateStr }) {
  const {
    captains, attendance, dayDetails, settings,
    currentCaptainId, isCaptainAttending, toggleAttendance,
  } = useApp();

  const [editOpen, setEditOpen] = useState(false);

  const override    = dayDetails[dateStr] || {};
  const isCancelled = override.cancelled;
  const currentLoc  = override.location || 'Memorial';
  const ld          = locData(currentLoc);
  const attending   = captains.filter(c => attendance[dateStr]?.[c.id] === true);
  const myAttending = isCaptainAttending(dateStr, currentCaptainId) && !isCancelled;
  const covered     = !isCancelled && attending.length >= settings.minCaptainsPerDay;
  const partial     = !isCancelled && !covered && attending.length > 0;
  const todayDate   = isToday(dateStr);
  const canToggle   = !isCancelled && currentCaptainId && currentCaptainId !== 'admin';

  const d       = fromDateStr(dateStr);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateNum = d.getDate();

  const lp = useLongPress(() => setEditOpen(true));

  const handleClick = () => {
    if (lp.wasFired()) return;
    if (canToggle) toggleAttendance(dateStr, currentCaptainId);
  };

  // ── Cancelled ──
  if (isCancelled) {
    return (
      <>
        <button
          {...lp}
          onClick={handleClick}
          className="h-full flex flex-col items-center pt-2.5 rounded-2xl overflow-hidden select-none opacity-30 active:opacity-50 transition-opacity bg-gray-100 dark:bg-gray-800"
        >
          <span className="text-[8px] font-black uppercase tracking-wider text-gray-500 leading-none">{dayName}</span>
          <span className="text-[17px] font-black text-gray-500 leading-tight mt-0.5">{dateNum}</span>
          <div className="flex-1" />
          <div className="w-6 h-0.5 rounded-full bg-gray-400 mb-2.5" />
          <div className="w-full h-[3px] bg-gray-300 dark:bg-gray-600" />
        </button>
        {editOpen && <DayEditSheet dateStr={dateStr} onClose={() => setEditOpen(false)} />}
      </>
    );
  }

  // ── Active ──
  const cardStyle = myAttending
    ? { backgroundColor: '#10b981', boxShadow: '0 4px 16px #10b98145' }
    : {};

  const borderClass = myAttending ? '' :
    covered  ? 'border-2 border-emerald-400 dark:border-emerald-600' :
    partial  ? 'border border-amber-300 dark:border-amber-700' :
    'border border-gray-100 dark:border-gray-800';

  const todayRing = todayDate && !myAttending
    ? 'ring-2 ring-blue-400/50 dark:ring-blue-500/40'
    : '';

  return (
    <>
      <button
        {...lp}
        onClick={handleClick}
        className={`h-full flex flex-col items-center pt-2.5 rounded-2xl overflow-hidden select-none transition-all active:scale-95 bg-white dark:bg-gray-900 shadow-sm ${borderClass} ${todayRing}`}
        style={cardStyle}
      >
        {/* Day name */}
        <span className={`text-[8px] font-black uppercase tracking-wider leading-none ${
          myAttending ? 'text-white/70'
          : todayDate ? 'text-blue-500 dark:text-blue-400'
          : 'text-gray-400 dark:text-gray-500'
        }`}>
          {dayName}
        </span>

        {/* Date */}
        <span className={`text-[17px] font-black leading-tight mt-0.5 ${
          myAttending ? 'text-white'
          : todayDate ? 'text-blue-600 dark:text-blue-300'
          : 'text-gray-800 dark:text-gray-100'
        }`}>
          {dateNum}
        </span>

        {/* Location label */}
        <span
          className="text-[8px] font-bold leading-none mt-1.5"
          style={{ color: myAttending ? 'rgba(255,255,255,0.75)' : ld.color }}
        >
          {ld.short}
        </span>

        {/* Captain count / check */}
        <span className={`text-[11px] font-black leading-none mt-1 ${
          myAttending ? 'text-white/90'
          : covered   ? 'text-emerald-500 dark:text-emerald-400'
          : partial   ? 'text-amber-500 dark:text-amber-400'
          : 'text-gray-300 dark:text-gray-600'
        }`}>
          {myAttending ? <Check size={10} strokeWidth={3} className="inline" /> : attending.length}
        </span>

        {/* Captain avatar dots */}
        {!myAttending && attending.length > 0 && (
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

        {/* Pushes strip to bottom */}
        <div className="flex-1 min-h-[4px]" />

        {/* Location color strip */}
        <div
          className="w-full h-[3px] flex-shrink-0"
          style={{
            backgroundColor: myAttending
              ? 'rgba(255,255,255,0.3)'
              : ld.color,
          }}
        />
      </button>

      {editOpen && <DayEditSheet dateStr={dateStr} onClose={() => setEditOpen(false)} />}
    </>
  );
}

// ── Week card ─────────────────────────────────────────────────────────────────
export default function WeekCard({ week, isCurrentWeek, weekIndex }) {
  const cardRef = useRef(null);
  const { getWeekStats, captains, attendance, dayDetails, settings, currentCaptainId } = useApp();

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

  return (
    <div
      ref={cardRef}
      className={`relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-card transition-all duration-300 ${
        isCurrentWeek ? 'ring-2 ring-blue-400/30 dark:ring-blue-500/30 shadow-card-lg' : ''
      }`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl" style={{ backgroundColor: stripColor }} />

      <div className="pl-5 pr-4 pt-4 pb-4">

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
              Wk {weekIndex + 1}
            </span>
            {isCurrentWeek && (
              <span className="text-[9px] font-extrabold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">NOW</span>
            )}
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{range}</span>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            isCovered   ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
            : isPartial ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
            : isUncovered ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}>
            {coveredCount}/{settings.minCoveredDays}
          </span>
        </div>

        {/* 6-day horizontal grid */}
        <div className="grid grid-cols-6 gap-1">
          {week.days.map(dateStr => (
            <DayCard key={dateStr} dateStr={dateStr} />
          ))}
        </div>

        {/* Captain summary footer */}
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
