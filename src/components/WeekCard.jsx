import { useRef, useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Ban, Pencil } from 'lucide-react';
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

// ── Per-day editor row (inside bottom panel) ──────────────────────────────────
function DayLocationEditor({ dateStr }) {
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
              : 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50'
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

// ── Compact horizontal day card ───────────────────────────────────────────────
function DayCard({ dateStr }) {
  const {
    captains, attendance, dayDetails, settings,
    currentCaptainId, isCaptainAttending, toggleAttendance,
  } = useApp();

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

  if (isCancelled) {
    return (
      <div className="flex flex-col items-center justify-start pt-2.5 pb-2 rounded-2xl bg-gray-100/40 dark:bg-gray-800/20 opacity-35">
        <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 leading-none">{dayName}</span>
        <span className="text-[15px] font-black text-gray-400 leading-tight mt-0.5">{dateNum}</span>
        <div className="mt-2 w-4 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
      </div>
    );
  }

  return (
    <button
      onClick={() => canToggle && toggleAttendance(dateStr, currentCaptainId)}
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
      {/* Day abbr */}
      <span className={`text-[8px] font-black uppercase tracking-wider leading-none ${
        myAttending ? 'text-emerald-100'
        : todayDate ? 'text-blue-500 dark:text-blue-400'
        :             'text-gray-400 dark:text-gray-500'
      }`}>
        {dayName}
      </span>

      {/* Date number */}
      <span className={`text-[16px] font-black leading-tight mt-0.5 ${
        myAttending ? 'text-white'
        : todayDate ? 'text-blue-600 dark:text-blue-400'
        :             'text-gray-800 dark:text-gray-100'
      }`}>
        {dateNum}
      </span>

      {/* Location name */}
      <span
        className="text-[7.5px] font-bold leading-none mt-1 px-0.5 w-full text-center truncate"
        style={{ color: myAttending ? 'rgba(255,255,255,0.8)' : info.color }}
      >
        {info.short}
      </span>

      {/* Attending count */}
      <span className={`text-[11px] font-black leading-none mt-1 ${
        myAttending ? 'text-white/90'
        : covered   ? 'text-emerald-500 dark:text-emerald-400'
        : partial   ? 'text-amber-500 dark:text-amber-400'
        :             'text-gray-300 dark:text-gray-600'
      }`}>
        {attending.length}
      </span>

      {/* Check mark if attending */}
      {myAttending && (
        <div className="mt-1 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
          <Check size={9} className="text-white" />
        </div>
      )}

      {/* Mini captain dots when not attending */}
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
    </button>
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
      {/* Status strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl" style={{ backgroundColor: stripColor }} />

      <div className="pl-5 pr-4 pt-4 pb-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
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
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            isCovered     ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
            : isPartial   ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
            : isUncovered ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
            :               'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}>
            {coveredCount}/{settings.minCoveredDays}
          </span>
        </div>

        {/* ── Horizontal day grid ── */}
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

        {/* ── Admin: edit locations & days ── */}
        {isAdmin && (
          <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <button
              onClick={() => setEditOpen(s => !s)}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {editOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <Pencil size={11} />
              Edit locations &amp; days
            </button>
            {editOpen && (
              <div className="mt-2 animate-fade-in">
                {week.days.map(dateStr => (
                  <DayLocationEditor key={dateStr} dateStr={dateStr} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
