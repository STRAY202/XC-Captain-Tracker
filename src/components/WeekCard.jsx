import { useRef, useEffect, useState } from 'react';
import { Check, Pencil, X, Clock, MapPin, CloudSun, Dumbbell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fromDateStr, isToday } from '../utils/dates';

// ── Location config ───────────────────────────────────────────────────────────
const KNOWN_LOCS = [
  { id: 'Memorial',  label: 'Memorial',               short: 'Memorial',  color: '#10b981' },
  { id: 'Cutler',    label: 'Cutler Park',             short: 'Cutler',    color: '#3b82f6' },
  { id: 'Peninsula', label: 'Charles River Peninsula', short: 'Peninsula', color: '#8b5cf6' },
];

function locInfo(loc) {
  const found = KNOWN_LOCS.find(l => l.id === loc || l.label === loc);
  if (found) return found;
  return { id: 'other', label: loc || 'Other', short: loc || 'Other', color: '#f97316' };
}

// ── Controlled text field that syncs when context changes ────────────────────
function SyncedInput({ value: ctxValue, onCommit, placeholder, className, rows }) {
  const [draft, setDraft] = useState(ctxValue || '');
  const prevCtx = useRef(ctxValue || '');

  useEffect(() => {
    const v = ctxValue || '';
    if (v !== prevCtx.current) { prevCtx.current = v; setDraft(v); }
  }, [ctxValue]);

  const commit = () => onCommit(draft);

  if (rows) {
    return (
      <textarea
        rows={rows}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Escape') commit(); e.stopPropagation(); }}
        enterKeyHint="enter"
        placeholder={placeholder}
        className={className}
      />
    );
  }
  return (
    <input
      type="text"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commit(); }}
      placeholder={placeholder}
      className={className}
    />
  );
}

// ── Per-day edit card ─────────────────────────────────────────────────────────
function DayEditRow({ dateStr, isAdmin, defaultTime }) {
  const {
    dayDetails, setDayDetail,
    workouts, setWorkout,
    weatherOverrides, setWeatherOverride,
    timeOverrides, setTimeOverride,
  } = useApp();

  const override  = dayDetails[dateStr] || {};
  const loc       = override.location || 'Memorial';
  const cancelled = !!override.cancelled;
  const ld        = locInfo(loc);
  const isOther   = !KNOWN_LOCS.some(l => l.id === loc || l.label === loc);
  const [showOther, setShowOther] = useState(isOther);
  const [customLoc, setCustomLoc] = useState(isOther ? loc : '');

  // Keep "Other" input synced when Supabase pushes a new location
  const prevLoc = useRef(loc);
  useEffect(() => {
    if (loc !== prevLoc.current) {
      prevLoc.current = loc;
      const other = !KNOWN_LOCS.some(l => l.id === loc || l.label === loc);
      setShowOther(other);
      if (other) setCustomLoc(loc);
    }
  }, [loc]);

  const d        = fromDateStr(dateStr);
  const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const textCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent resize-none';

  return (
    <div className={`rounded-2xl border transition-all ${
      cancelled
        ? 'bg-gray-50 dark:bg-gray-800/30 border-red-200 dark:border-red-900/50'
        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <span className={`text-[11px] font-extrabold uppercase tracking-wide ${cancelled ? 'text-red-400 line-through' : 'text-gray-600 dark:text-gray-300'}`}>
          {dayLabel}
        </span>
        {isAdmin && (
          <button
            onClick={() => setDayDetail(dateStr, { cancelled: !cancelled })}
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all active:scale-95 ${
              cancelled
                ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
            }`}
          >
            {cancelled ? <><X size={8} /> Cancelled</> : 'Cancel day'}
          </button>
        )}
      </div>

      {!cancelled && (
        <div className="px-3.5 pb-3.5 space-y-3">

          {/* Location */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <MapPin size={10} className="text-gray-400" />
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">Location</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {KNOWN_LOCS.map(l => {
                const active = loc === l.id || loc === l.label;
                return (
                  <button
                    key={l.id}
                    onClick={() => { setShowOther(false); setDayDetail(dateStr, { location: l.id, cancelled: false }); }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
                      active ? 'text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                    }`}
                    style={active ? { backgroundColor: l.color } : {}}
                  >
                    {l.label}
                  </button>
                );
              })}
              <button
                onClick={() => { setShowOther(true); if (!isOther) setCustomLoc(''); }}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
                  showOther ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                }`}
              >
                Other
              </button>
            </div>
            {showOther && (
              <input
                type="text"
                value={customLoc}
                onChange={e => setCustomLoc(e.target.value)}
                onBlur={() => { if (customLoc.trim()) setDayDetail(dateStr, { location: customLoc.trim(), cancelled: false }); }}
                onKeyDown={e => { if (e.key === 'Enter' && customLoc.trim()) setDayDetail(dateStr, { location: customLoc.trim(), cancelled: false }); }}
                placeholder="Enter location name…"
                autoFocus={!isOther}
                className={`mt-1.5 ${textCls} focus:ring-orange-400/50`}
              />
            )}
          </div>

          {/* Time */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <Clock size={10} className="text-gray-400" />
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">Time</span>
            </div>
            <SyncedInput
              value={timeOverrides[dateStr] || ''}
              onCommit={v => setTimeOverride(dateStr, v)}
              placeholder={defaultTime || '8:00 AM'}
              className={`${textCls} focus:ring-violet-400/50`}
            />
          </div>

          {/* Workout */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <Dumbbell size={10} className="text-gray-400" />
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">Workout / What We're Doing</span>
            </div>
            <SyncedInput
              rows={2}
              value={workouts[dateStr] || ''}
              onCommit={v => setWorkout(dateStr, v)}
              placeholder="e.g. Easy 6mi, Tempo 5×1mi, Hill repeats…"
              className={`${textCls} focus:ring-emerald-400/50`}
            />
          </div>

          {/* Weather */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <CloudSun size={10} className="text-gray-400" />
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">Weather</span>
              <span className="text-[9px] text-gray-400 dark:text-gray-600 ml-1">(leave blank for auto)</span>
            </div>
            <SyncedInput
              value={weatherOverrides[dateStr] || ''}
              onCommit={v => setWeatherOverride(dateStr, v)}
              placeholder="e.g. ☀️ 72° Clear · or leave blank for auto"
              className={`${textCls} focus:ring-sky-400/50`}
            />
          </div>

        </div>
      )}
    </div>
  );
}

// ── Day display card ──────────────────────────────────────────────────────────
function DayCard({ dateStr }) {
  const {
    captains, attendance, dayDetails, settings,
    currentCaptainId, isCaptainAttending, toggleAttendance,
    workouts, timeOverrides,
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
  const canToggle   = !isCancelled && currentCaptainId && currentCaptainId !== 'admin' && !currentCaptainId.startsWith('athlete_');

  const d       = fromDateStr(dateStr);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateNum = d.getDate();
  const hasWorkout = !!workouts[dateStr];
  const timeStr = timeOverrides[dateStr] || settings.defaultTime || '';

  if (isCancelled) {
    return (
      <div className="h-full flex flex-col items-center pt-2.5 rounded-2xl overflow-hidden opacity-30 bg-gray-100 dark:bg-gray-800">
        <span className="text-[8px] font-black uppercase tracking-wider text-gray-500 leading-none">{dayName}</span>
        <span className="text-[17px] font-black text-gray-500 leading-tight mt-0.5">{dateNum}</span>
        <div className="flex-1" />
        <div className="w-5 h-0.5 rounded-full bg-gray-400 mb-2" />
        <div className="w-full h-[3px] bg-gray-300 dark:bg-gray-600" />
      </div>
    );
  }

  const cardStyle = myAttending
    ? { backgroundColor: '#10b981', boxShadow: '0 4px 16px #10b98145' }
    : {};

  const borderClass = myAttending
    ? ''
    : covered
    ? 'border-2 border-emerald-400 dark:border-emerald-600'
    : partial
    ? 'border border-amber-300 dark:border-amber-700'
    : 'border border-gray-100 dark:border-gray-800';

  const todayRing = todayDate && !myAttending
    ? 'ring-2 ring-blue-400/50 dark:ring-blue-500/40'
    : '';

  return (
    <button
      onClick={() => { if (canToggle) toggleAttendance(dateStr, currentCaptainId); }}
      className={`h-full flex flex-col items-center pt-2.5 rounded-2xl overflow-hidden select-none transition-all active:scale-95 bg-white dark:bg-gray-900 shadow-sm ${borderClass} ${todayRing}`}
      style={cardStyle}
    >
      <span className={`text-[8px] font-black uppercase tracking-wider leading-none ${
        myAttending ? 'text-white/70'
        : todayDate ? 'text-blue-500 dark:text-blue-400'
        : 'text-gray-400 dark:text-gray-500'
      }`}>
        {dayName}
      </span>

      <span className={`text-[17px] font-black leading-tight mt-0.5 ${
        myAttending ? 'text-white'
        : todayDate ? 'text-blue-600 dark:text-blue-300'
        : 'text-gray-800 dark:text-gray-100'
      }`}>
        {dateNum}
      </span>

      <span
        className="text-[8px] font-bold leading-none mt-1 truncate w-full text-center px-0.5"
        style={{ color: myAttending ? 'rgba(255,255,255,0.75)' : ld.color }}
      >
        {ld.short}
      </span>

      {timeStr && (
        <span className={`text-[7px] font-semibold leading-none mt-0.5 truncate w-full text-center px-0.5 ${
          myAttending ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {timeStr}
        </span>
      )}

      {hasWorkout && (
        <span className="text-[9px] leading-none mt-0.5">💪</span>
      )}

      <span className={`text-[11px] font-black leading-none mt-1 ${
        myAttending ? 'text-white/90'
        : covered   ? 'text-emerald-500 dark:text-emerald-400'
        : partial   ? 'text-amber-500 dark:text-amber-400'
        : 'text-gray-300 dark:text-gray-600'
      }`}>
        {myAttending
          ? <Check size={10} strokeWidth={3} className="inline" />
          : attending.length
        }
      </span>

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

      <div className="flex-1 min-h-[4px]" />
      <div
        className="w-full h-[3px] flex-shrink-0"
        style={{ backgroundColor: myAttending ? 'rgba(255,255,255,0.3)' : ld.color }}
      />
    </button>
  );
}

// ── Week card ─────────────────────────────────────────────────────────────────
export default function WeekCard({ week, isCurrentWeek, weekIndex }) {
  const cardRef = useRef(null);
  const {
    getWeekStats, captains, attendance, dayDetails, settings,
    currentCaptainId, isAdmin, userMode,
  } = useApp();

  // Only captains and admin can edit practice details
  const canEdit = userMode === 'captain' || currentCaptainId === 'admin';

  const [editMode, setEditMode] = useState(false);

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
                onClick={() => setEditMode(s => !s)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 ${
                  editMode
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {editMode ? <><Check size={10} strokeWidth={3} /> Done</> : <><Pencil size={10} /> Edit</>}
              </button>
            )}
          </div>
        </div>

        {/* Day grid */}
        <div id={tourId('tour-day-grid')} className={`grid ${gridCols} gap-1`}>
          {week.days.map(dateStr => (
            <DayCard key={dateStr} dateStr={dateStr} />
          ))}
        </div>

        {/* Edit panel — per-day cards */}
        {editMode && (
          <div className="mt-3 space-y-2 animate-fade-in">
            <p className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-0.5 mb-2">
              Edit Practice Days
            </p>
            {week.days.map(dateStr => (
              <DayEditRow
                key={dateStr}
                dateStr={dateStr}
                isAdmin={isAdmin}
                defaultTime={settings.defaultTime}
              />
            ))}
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
