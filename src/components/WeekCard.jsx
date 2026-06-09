import { useRef, useEffect, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fromDateStr, isToday } from '../utils/dates';
import { WORKOUT_TYPES } from '../utils/workoutTypes';

// ── Location config ───────────────────────────────────────────────────────────
const LOC = {
  memorial: { label: 'Memorial',    color: '#10b981' },
  cutler:   { label: 'Cutler Park', color: '#3b82f6' },
  other:    { label: 'Other',       color: '#8b5cf6' },
};

function locKey(loc) {
  if (!loc || loc === 'Memorial')  return 'memorial';
  if (loc === 'Cutler Park')       return 'cutler';
  return 'other';
}
function locInfo(loc) {
  const k = locKey(loc);
  if (k === 'other') return { ...LOC.other, label: loc || 'Other' };
  return LOC[k];
}

// ── Day display card ──────────────────────────────────────────────────────────
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
        {ld.label === 'Other' ? (currentLoc || 'Other') : ld.label}
      </span>

      {override.activity && (
        <span className="text-[10px] leading-none mt-0.5">
          {WORKOUT_TYPES.find(w => w.id === override.activity)?.emoji || ''}
        </span>
      )}

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

// ── Per-day edit row ──────────────────────────────────────────────────────────
function DayEditRow({ dateStr, isAdmin }) {
  const { dayDetails, setDayDetail } = useApp();
  const override = dayDetails[dateStr] || {};

  const loc        = override.location || 'Memorial';
  const isOtherLoc = loc !== 'Memorial' && loc !== 'Cutler Park';

  // Local controlled state for text inputs — avoids spamming DB on every keystroke
  const [weatherDraft, setWeatherDraft] = useState(override.weather || '');
  const [customLoc,    setCustomLoc]    = useState(isOtherLoc ? loc : '');
  const [showOther,    setShowOther]    = useState(isOtherLoc);

  // Sync text drafts when Supabase pushes an update (another device edited)
  const prevWeather = useRef(override.weather || '');
  useEffect(() => {
    const w = override.weather || '';
    if (w !== prevWeather.current) {
      prevWeather.current = w;
      setWeatherDraft(w);
    }
  }, [override.weather]);

  const prevLoc = useRef(loc);
  useEffect(() => {
    if (loc !== prevLoc.current) {
      prevLoc.current = loc;
      const other = loc !== 'Memorial' && loc !== 'Cutler Park';
      setShowOther(other);
      if (other) setCustomLoc(loc);
    }
  }, [loc]);

  const d        = fromDateStr(dateStr);
  const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const setLoc = (newLoc) => setDayDetail(dateStr, { location: newLoc, cancelled: false });

  const handleOtherClick = () => {
    setShowOther(true);
    if (!isOtherLoc) setCustomLoc('');
  };

  const commitCustomLoc = () => {
    const v = customLoc.trim();
    if (v) setDayDetail(dateStr, { location: v, cancelled: false });
  };

  const commitWeather = () => {
    setDayDetail(dateStr, { weather: weatherDraft.trim() });
  };

  const toggleCancel = () => {
    setDayDetail(dateStr, { cancelled: !override.cancelled });
  };

  const locBtn = (key, label, color) => {
    const active = key === 'other' ? (isOtherLoc || showOther) : loc === (key === 'memorial' ? 'Memorial' : 'Cutler Park');
    return (
      <button
        key={key}
        onClick={key === 'other' ? handleOtherClick : () => { setShowOther(false); setLoc(key === 'memorial' ? 'Memorial' : 'Cutler Park'); }}
        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
          active ? 'text-white shadow-sm' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 shadow-sm'
        }`}
        style={active ? { backgroundColor: color } : {}}
      >
        {label}
      </button>
    );
  };

  return (
    <div className={`rounded-2xl border transition-all ${
      override.cancelled
        ? 'bg-gray-50 dark:bg-gray-800/40 border-red-200 dark:border-red-900/50 opacity-60'
        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
    }`}>
      {/* Row header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="text-xs font-extrabold text-gray-700 dark:text-gray-200">{dayLabel}</span>
        {isAdmin && (
          <button
            onClick={toggleCancel}
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all active:scale-95 ${
              override.cancelled
                ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            {override.cancelled ? <><X size={9} /> Cancelled</> : 'Cancel day'}
          </button>
        )}
      </div>

      {!override.cancelled && (
        <div className="px-3 pb-3 space-y-2.5">

          {/* Location */}
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">Location</p>
            <div className="flex gap-1.5 flex-wrap">
              {locBtn('memorial', 'Memorial',    '#10b981')}
              {locBtn('cutler',   'Cutler Park', '#3b82f6')}
              {locBtn('other',    'Other…',      '#8b5cf6')}
            </div>
            {showOther && (
              <input
                type="text"
                value={customLoc}
                onChange={e => setCustomLoc(e.target.value)}
                onBlur={commitCustomLoc}
                onKeyDown={e => e.key === 'Enter' && commitCustomLoc()}
                placeholder="Type location name…"
                className="mt-1.5 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                autoFocus
              />
            )}
          </div>

          {/* Weather */}
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">Weather</p>
            <div className="flex gap-1.5 flex-wrap mb-1.5">
              {['☀️ Sunny', '🌤️ Partly Cloudy', '☁️ Cloudy', '🌧️ Rainy', '⛈️ Storms', '🌫️ Foggy', '🌬️ Windy', '🥵 Hot', '🥶 Cold'].map(w => (
                <button
                  key={w}
                  onClick={() => { setWeatherDraft(w); setDayDetail(dateStr, { weather: w }); }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95 ${
                    weatherDraft === w
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={weatherDraft}
              onChange={e => setWeatherDraft(e.target.value)}
              onBlur={commitWeather}
              onKeyDown={e => e.key === 'Enter' && commitWeather()}
              placeholder="Or type custom weather…"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>

          {/* Activity / Workout */}
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">Activity</p>
            <div className="flex gap-1.5 flex-wrap">
              {WORKOUT_TYPES.map(w => {
                const active = override.activity === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => setDayDetail(dateStr, { activity: active ? null : w.id })}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95 ${
                      active ? 'text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                    style={active ? { backgroundColor: w.color } : {}}
                  >
                    <span>{w.emoji}</span>
                    <span>{w.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Week card ─────────────────────────────────────────────────────────────────
export default function WeekCard({ week, isCurrentWeek, weekIndex }) {
  const cardRef = useRef(null);
  const {
    getWeekStats, captains, attendance, dayDetails, settings,
    currentCaptainId, isAdmin,
  } = useApp();

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
          </div>
        </div>

        {/* Day grid */}
        <div id={tourId('tour-day-grid')} className={`grid ${gridCols} gap-1`}>
          {week.days.map(dateStr => (
            <DayCard
              key={dateStr}
              dateStr={dateStr}
              editMode={false}
            />
          ))}
        </div>

        {/* Edit panel — one row per practice day */}
        {editMode && (
          <div className="mt-3 space-y-2 animate-fade-in">
            <p className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-0.5">
              Edit practice days
            </p>
            {week.days.map(dateStr => (
              <DayEditRow
                key={dateStr}
                dateStr={dateStr}
                isAdmin={isAdmin}
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
