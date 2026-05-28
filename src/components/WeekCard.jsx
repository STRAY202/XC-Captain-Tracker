import { useRef, useEffect, useState, useCallback } from 'react';
import { Check, ChevronDown, ChevronUp, Ban, Pencil, X, MapPin, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fromDateStr, isToday } from '../utils/dates';

// ── Location helpers ──────────────────────────────────────────────────────────
const LOC_PRESETS = [
  { id: 'memorial', label: 'Memorial',    short: 'Memorial', color: '#10b981' },
  { id: 'cutler',   label: 'Cutler Park', short: 'Cutler',   color: '#3b82f6' },
];

function locInfo(loc) {
  if (!loc || loc === 'Memorial')  return LOC_PRESETS[0];
  if (loc === 'Cutler Park')       return LOC_PRESETS[1];
  return { id: 'other', label: loc, short: loc.slice(0, 7), color: '#8b5cf6' };
}

function presetId(loc) {
  if (!loc || loc === 'Memorial')  return 'memorial';
  if (loc === 'Cutler Park')       return 'cutler';
  return 'other';
}

// ── Long-press hook ───────────────────────────────────────────────────────────
function useLongPress(onLongPress, ms = 480) {
  const timerRef    = useRef(null);
  const firedRef    = useRef(false);

  const start = useCallback(() => {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, ms);
  }, [onLongPress, ms]);

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  return {
    onTouchStart:  start,
    onTouchEnd:    cancel,
    onTouchMove:   cancel,
    onMouseDown:   start,
    onMouseUp:     cancel,
    onMouseLeave:  cancel,
    onContextMenu: (e) => e.preventDefault(),
    wasFired:      () => firedRef.current,
  };
}

// ── Day edit sheet (long-press) ───────────────────────────────────────────────
function DayEditSheet({ dateStr, onClose }) {
  const {
    captains, attendance, dayDetails, settings, isAdmin,
    setDayDetail, clearDayDetail,
  } = useApp();

  const override    = dayDetails[dateStr] || {};
  const isCancelled = override.cancelled;
  const currentLoc  = override.location || 'Memorial';
  const info        = locInfo(currentLoc);
  const selId       = presetId(currentLoc);
  const attending   = captains.filter(c => attendance[dateStr]?.[c.id] === true);

  const [otherText, setOtherText] = useState(selId === 'other' ? currentLoc : '');

  useEffect(() => {
    if (selId === 'other') setOtherText(currentLoc);
  }, [currentLoc, selId]);

  const d       = fromDateStr(dateStr);
  const dayFull = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const todayDate = isToday(dateStr);

  const handleLocSelect = (id) => {
    if (id === 'memorial')      setDayDetail(dateStr, { location: 'Memorial' });
    else if (id === 'cutler')   setDayDetail(dateStr, { location: 'Cutler Park' });
    else if (selId !== 'other') setOtherText('');
  };

  const commitOther = () => {
    if (otherText.trim()) setDayDetail(dateStr, { location: otherText.trim() });
  };

  const handleCancelToggle = () => {
    if (!isCancelled) {
      setDayDetail(dateStr, { cancelled: true });
    } else {
      const { cancelled: _, ...rest } = override;
      Object.keys(rest).length === 0
        ? clearDayDetail(dateStr)
        : setDayDetail(dateStr, { cancelled: false });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto shadow-2xl animate-sheet-up">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {todayDate && (
                <span className="text-[9px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Today</span>
              )}
              {isCancelled && (
                <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Cancelled</span>
              )}
            </div>
            <h2 className={`text-lg font-black text-gray-900 dark:text-white leading-tight ${isCancelled ? 'line-through opacity-40' : ''}`}>
              {dayFull}
            </h2>
            {!isCancelled && (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={12} style={{ color: info.color }} />
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{currentLoc}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-90 transition-all flex-shrink-0"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 pt-4 pb-8 space-y-5">

          {/* ── Location (admin) ── */}
          {isAdmin && !isCancelled && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Location</p>
              <div className="flex gap-2 flex-wrap">
                {[...LOC_PRESETS, { id: 'other', label: 'Other…', color: '#8b5cf6' }].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleLocSelect(opt.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                      selId === opt.id
                        ? 'text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={selId === opt.id ? { backgroundColor: opt.color } : {}}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {selId === 'other' && (
                <input
                  type="text"
                  value={otherText}
                  onChange={e => setOtherText(e.target.value)}
                  onBlur={commitOther}
                  onKeyDown={e => e.key === 'Enter' && commitOther()}
                  placeholder="Enter location…"
                  autoFocus
                  className="mt-2.5 w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                />
              )}
            </div>
          )}

          {/* ── Who's attending ── */}
          {!isCancelled && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Users size={11} className="text-gray-400" />
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Attending ({attending.length})
                </span>
                {attending.length >= settings.minCaptainsPerDay && (
                  <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    ✓ Covered
                  </span>
                )}
              </div>
              {attending.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No captains signed up yet</p>
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

          {/* ── Cancel / Restore (admin) ── */}
          {isAdmin && (
            <button
              onClick={handleCancelToggle}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] ${
                isCancelled
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50'
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

// ── Compact horizontal day card ───────────────────────────────────────────────
function DayCard({ dateStr }) {
  const {
    captains, attendance, dayDetails, settings,
    currentCaptainId, isCaptainAttending, toggleAttendance,
  } = useApp();

  const [editOpen, setEditOpen] = useState(false);

  const override    = dayDetails[dateStr] || {};
  const isCancelled = override.cancelled;
  const currentLoc  = override.location || 'Memorial';
  const info        = locInfo(currentLoc);
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

  if (isCancelled) {
    return (
      <>
        <button
          {...lp}
          onClick={handleClick}
          className="flex flex-col items-center justify-start pt-2.5 pb-2 rounded-2xl bg-gray-100/40 dark:bg-gray-800/20 opacity-35 active:opacity-60 transition-all select-none"
        >
          <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 leading-none">{dayName}</span>
          <span className="text-[15px] font-black text-gray-400 leading-tight mt-0.5">{dateNum}</span>
          <div className="mt-2 w-4 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
        </button>
        {editOpen && <DayEditSheet dateStr={dateStr} onClose={() => setEditOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        {...lp}
        onClick={handleClick}
        className={`flex flex-col items-center justify-start pt-2 pb-2 rounded-2xl transition-all active:scale-95 select-none ${
          myAttending
            ? 'shadow-lg'
            : covered
            ? 'bg-white dark:bg-gray-900 border-2 border-emerald-300 dark:border-emerald-700'
            : partial
            ? 'bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800'
            : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800'
        } ${todayDate && !myAttending ? 'ring-2 ring-blue-400/40 dark:ring-blue-500/40' : ''}`}
        style={myAttending ? {
          backgroundColor: '#10b981',
          border: '2px solid transparent',
          boxShadow: '0 4px 14px #10b98140',
        } : {}}
      >
        <span className={`text-[8px] font-black uppercase tracking-wider leading-none ${
          myAttending ? 'text-emerald-100'
          : todayDate ? 'text-blue-500 dark:text-blue-400'
          :             'text-gray-400 dark:text-gray-500'
        }`}>
          {dayName}
        </span>

        <span className={`text-[16px] font-black leading-tight mt-0.5 ${
          myAttending ? 'text-white'
          : todayDate ? 'text-blue-600 dark:text-blue-400'
          :             'text-gray-800 dark:text-gray-100'
        }`}>
          {dateNum}
        </span>

        <span
          className="text-[7.5px] font-bold leading-none mt-1 px-0.5 w-full text-center truncate"
          style={{ color: myAttending ? 'rgba(255,255,255,0.8)' : info.color }}
        >
          {info.short}
        </span>

        <span className={`text-[11px] font-black leading-none mt-1 ${
          myAttending ? 'text-white/90'
          : covered   ? 'text-emerald-500 dark:text-emerald-400'
          : partial   ? 'text-amber-500 dark:text-amber-400'
          :             'text-gray-300 dark:text-gray-600'
        }`}>
          {attending.length}
        </span>

        {myAttending ? (
          <div className="mt-1 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
            <Check size={9} className="text-white" />
          </div>
        ) : attending.length > 0 ? (
          <div className="flex -space-x-0.5 mt-1">
            {attending.slice(0, 3).map(c => (
              <div
                key={c.id}
                className="w-[6px] h-[6px] rounded-full ring-[1px] ring-white dark:ring-gray-900"
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        ) : null}
      </button>

      {editOpen && <DayEditSheet dateStr={dateStr} onClose={() => setEditOpen(false)} />}
    </>
  );
}

// ── Week card ─────────────────────────────────────────────────────────────────
export default function WeekCard({ week, isCurrentWeek, weekIndex }) {
  const cardRef  = useRef(null);
  const [editOpen, setEditOpen] = useState(false);
  const { getWeekStats, captains, attendance, dayDetails, settings, currentCaptainId, isAdmin } = useApp();

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
      className={`relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden transition-all duration-300 shadow-card ${
        isCurrentWeek ? 'ring-2 ring-blue-400/30 dark:ring-blue-500/30 shadow-card-lg' : ''
      }`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl" style={{ backgroundColor: stripColor }} />

      <div className="pl-5 pr-4 pt-4 pb-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 tracking-tight">
              Wk {weekIndex + 1}
            </span>
            {isCurrentWeek && (
              <span className="text-[9px] font-extrabold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">NOW</span>
            )}
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{range}</span>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            isCovered     ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
            : isPartial   ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
            : isUncovered ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
            :               'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}>
            {coveredCount}/{settings.minCoveredDays}
          </span>
        </div>

        {/* ── Day grid ── */}
        <div className="grid grid-cols-6 gap-1">
          {week.days.map(dateStr => (
            <DayCard key={dateStr} dateStr={dateStr} />
          ))}
        </div>

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

        {/* Admin: bulk edit shortcut */}
        {isAdmin && (
          <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <button
              onClick={() => setEditOpen(s => !s)}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {editOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <Pencil size={11} />
              Edit all days
            </button>
            {editOpen && (
              <div className="mt-2 animate-fade-in">
                {week.days.map(dateStr => (
                  <BulkDayRow key={dateStr} dateStr={dateStr} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Bulk edit row (inside "Edit all days" panel) ──────────────────────────────
function BulkDayRow({ dateStr }) {
  const { dayDetails, setDayDetail, clearDayDetail } = useApp();
  const override    = dayDetails[dateStr] || {};
  const isCancelled = override.cancelled;
  const currentLoc  = override.location || 'Memorial';
  const selId       = presetId(currentLoc);
  const [otherText, setOtherText] = useState(selId === 'other' ? currentLoc : '');

  useEffect(() => {
    if (selId === 'other') setOtherText(currentLoc);
  }, [currentLoc, selId]);

  const d       = fromDateStr(dateStr);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateNum = d.getDate();

  const handleLocSelect = (id) => {
    if (id === 'memorial')      setDayDetail(dateStr, { location: 'Memorial' });
    else if (id === 'cutler')   setDayDetail(dateStr, { location: 'Cutler Park' });
    else if (selId !== 'other') setOtherText('');
  };

  const commitOther = () => {
    if (otherText.trim()) setDayDetail(dateStr, { location: otherText.trim() });
  };

  const handleCancelToggle = () => {
    if (!isCancelled) {
      setDayDetail(dateStr, { cancelled: true });
    } else {
      const { cancelled: _, ...rest } = override;
      Object.keys(rest).length === 0
        ? clearDayDetail(dateStr)
        : setDayDetail(dateStr, { cancelled: false });
    }
  };

  return (
    <div className={`py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 ${isCancelled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-gray-700 dark:text-gray-200 w-8">{dayName}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{dateNum}</span>
        </div>
        <button
          onClick={handleCancelToggle}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
            isCancelled
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-100'
          }`}
        >
          <Ban size={9} />
          {isCancelled ? 'Restore' : 'Cancel'}
        </button>
      </div>
      {!isCancelled && (
        <>
          <div className="flex gap-1.5 flex-wrap">
            {[...LOC_PRESETS, { id: 'other', label: 'Other…', color: '#8b5cf6' }].map(opt => (
              <button
                key={opt.id}
                onClick={() => handleLocSelect(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
                  selId === opt.id
                    ? 'text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={selId === opt.id ? { backgroundColor: opt.color } : {}}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {selId === 'other' && (
            <input
              type="text"
              value={otherText}
              onChange={e => setOtherText(e.target.value)}
              onBlur={commitOther}
              onKeyDown={e => e.key === 'Enter' && commitOther()}
              placeholder="Enter location…"
              className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            />
          )}
        </>
      )}
    </div>
  );
}
