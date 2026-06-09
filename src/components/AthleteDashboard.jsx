import { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Clock, CloudSun, ExternalLink, Pencil, X, Check } from 'lucide-react';
import { useApp, getLocation, LOCATIONS } from '../context/AppContext';
import { fromDateStr, formatWeekRange } from '../utils/dates';
import { selectTopPractices } from '../utils/practiceSelector';
import { fetchWeather } from '../utils/weather';

// ── Synced text input (avoids stale draft when Supabase pushes an update) ────
function SyncedField({ value: ctxVal, onCommit, placeholder, className, rows }) {
  const [draft, setDraft] = useState(ctxVal || '');
  const prev = useRef(ctxVal || '');
  useEffect(() => {
    const v = ctxVal || '';
    if (v !== prev.current) { prev.current = v; setDraft(v); }
  }, [ctxVal]);
  const commit = () => onCommit(draft);
  if (rows) {
    return (
      <textarea
        rows={rows}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') commit(); }}
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

// ── Per-day edit form inside the captain sheet ────────────────────────────────
function DayEditForm({ dateStr, isAdmin, defaultTime }) {
  const {
    dayDetails, setDayDetail,
    workouts, setWorkout,
    weatherOverrides, setWeatherOverride,
    timeOverrides, setTimeOverride,
  } = useApp();

  const override  = dayDetails[dateStr] || {};
  const loc       = override.location || 'Memorial';
  const cancelled = !!override.cancelled;

  const isKnown  = LOCATIONS.some(l => l.id === loc || l.label === loc);
  const [showOther, setShowOther] = useState(!isKnown);
  const [customLoc, setCustomLoc] = useState(!isKnown ? loc : '');

  const prevLoc = useRef(loc);
  useEffect(() => {
    if (loc !== prevLoc.current) {
      prevLoc.current = loc;
      const other = !LOCATIONS.some(l => l.id === loc || l.label === loc);
      setShowOther(other);
      if (other) setCustomLoc(loc);
    }
  }, [loc]);

  const d        = fromDateStr(dateStr);
  const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const fieldCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent resize-none';

  return (
    <div className={`rounded-2xl border ${cancelled ? 'border-red-800/50 opacity-60' : 'border-gray-700/60'} bg-gray-800/60`}>
      {/* Day header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-3">
        <span className={`text-xs font-extrabold uppercase tracking-widest ${cancelled ? 'text-red-400 line-through' : 'text-gray-300'}`}>
          {dayLabel}
        </span>
        {isAdmin && (
          <button
            onClick={() => setDayDetail(dateStr, { cancelled: !cancelled })}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
              cancelled
                ? 'bg-red-900/50 text-red-400 border border-red-700/50'
                : 'bg-gray-700 text-gray-400 hover:bg-red-900/30 hover:text-red-400'
            }`}
          >
            {cancelled ? 'Cancelled — tap to restore' : 'Cancel day'}
          </button>
        )}
      </div>

      {!cancelled && (
        <div className="px-4 pb-4 space-y-3.5">

          {/* Location */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-2">Location</p>
            <div className="flex gap-2 flex-wrap">
              {LOCATIONS.map(l => {
                const active = loc === l.id || loc === l.label;
                return (
                  <button
                    key={l.id}
                    onClick={() => { setShowOther(false); setDayDetail(dateStr, { location: l.id, cancelled: false }); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      active ? 'text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                    style={active ? { backgroundColor: l.color } : {}}
                  >
                    {l.label}
                  </button>
                );
              })}
              <button
                onClick={() => { setShowOther(true); if (isKnown) setCustomLoc(''); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  showOther ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                Other
              </button>
            </div>
            {showOther && (
              <input
                type="text"
                value={customLoc}
                autoFocus={isKnown}
                onChange={e => setCustomLoc(e.target.value)}
                onBlur={() => { if (customLoc.trim()) setDayDetail(dateStr, { location: customLoc.trim() }); }}
                onKeyDown={e => { if (e.key === 'Enter' && customLoc.trim()) setDayDetail(dateStr, { location: customLoc.trim() }); }}
                placeholder="Enter location name…"
                className={`mt-2 ${fieldCls} focus:ring-orange-500/50`}
              />
            )}
          </div>

          {/* Time */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-2">Time</p>
            <SyncedField
              value={timeOverrides[dateStr] || ''}
              onCommit={v => setTimeOverride(dateStr, v)}
              placeholder={defaultTime || '8:00 AM'}
              className={`${fieldCls} focus:ring-violet-500/50`}
            />
          </div>

          {/* What we're doing */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-2">What We're Doing</p>
            <SyncedField
              rows={2}
              value={workouts[dateStr] || ''}
              onCommit={v => setWorkout(dateStr, v)}
              placeholder="e.g. Easy 6 miles, Tempo 5×1 mile, Hill repeats…"
              className={`${fieldCls} focus:ring-emerald-500/50`}
            />
          </div>

          {/* Weather */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mb-1">Weather Override</p>
            <p className="text-[10px] text-gray-600 mb-2">Leave blank to use auto weather</p>
            <SyncedField
              value={weatherOverrides[dateStr] || ''}
              onCommit={v => setWeatherOverride(dateStr, v)}
              placeholder="e.g. ☀️ 72° Clear"
              className={`${fieldCls} focus:ring-sky-500/50`}
            />
          </div>

        </div>
      )}
    </div>
  );
}

// ── Practice card (unchanged) ──────────────────────────────────────────────────
function PracticeCard({ dateStr, weather, weatherLoading }) {
  const { settings, dayDetails, workouts, weatherOverrides, timeOverrides } = useApp();

  const override        = dayDetails[dateStr] || {};
  const loc             = getLocation(override.location);
  // timeOverrides takes priority over the legacy [TIME:...] notes encoding
  const time            = timeOverrides[dateStr]
                        || override.notes?.match(/^\[TIME:(.*?)\]/)?.[1]?.trim()
                        || settings.defaultTime || '8:00 AM';
  const workout         = workouts[dateStr] || '';
  const weatherOverride = weatherOverrides[dateStr] || '';
  const w               = weather[dateStr];

  const d           = fromDateStr(dateStr);
  const dow         = d.toLocaleDateString('en-US', { weekday: 'long' });
  const dateLabel   = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const isToday     = dateStr === new Date().toISOString().split('T')[0];

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      style={{ boxShadow: `0 4px 32px rgba(0,0,0,0.4), 0 0 0 1px ${loc.color}22` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: loc.color }} />

      <div className="pl-5 pr-5 pt-5 pb-5 ml-1">
        {/* Day + date */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{dow}</span>
              {isToday && (
                <span className="text-[9px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Today</span>
              )}
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{dateLabel}</h2>
          </div>

          {/* Weather */}
          {weatherOverride ? (
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-4 max-w-[100px]">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 text-right leading-snug">{weatherOverride}</span>
            </div>
          ) : w ? (
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-4">
              <span className="text-3xl leading-none">{w.emoji}</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{w.temp}°</span>
              <span className="text-[10px] text-gray-500">at 8:30am</span>
              {w.precip > 10 && (
                <span className="text-[10px] text-blue-400 font-bold">{w.precip}% rain</span>
              )}
            </div>
          ) : weatherLoading ? (
            <div className="w-10 h-10 flex-shrink-0 ml-4 flex flex-col items-end gap-1 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="w-6 h-2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ) : null}
        </div>

        <div className="h-px bg-gray-200 dark:bg-gray-800 mb-4" />

        {/* Time + Location */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-gray-500 flex-shrink-0" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">{time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={13} style={{ color: loc.color }} className="flex-shrink-0" />
            <span className="text-sm font-bold" style={{ color: loc.color }}>{loc.short}</span>
          </div>
        </div>

        {/* Weather label */}
        {!weatherOverride && w && (
          <div className="flex items-center gap-1.5 mb-4 text-xs text-gray-500">
            <CloudSun size={11} />
            <span>{w.label}</span>
            {w.precip > 0 && <span>· {w.precip}% rain chance</span>}
          </div>
        )}

        {/* Workout */}
        {workout && (
          <>
            <div className="h-px bg-gray-200 dark:bg-gray-800 mb-4" />
            <div>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1.5">
                Today's Workout
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{workout}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Locked week placeholder (unchanged) ────────────────────────────────────────
function LockedCard({ weekNum }) {
  return (
    <div className="rounded-3xl bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800/50 border-dashed px-5 py-8 flex flex-col items-center gap-3">
      <span className="text-3xl">🔒</span>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-600">Week {weekNum} not released yet</p>
        <p className="text-xs text-gray-700 mt-1">Check back soon</p>
      </div>
    </div>
  );
}

// ── Captain edit sheet ────────────────────────────────────────────────────────
function EditSheet({ selectedDays, defaultTime, isAdmin, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-h-[88vh] flex flex-col rounded-t-3xl bg-gray-950 border-t border-gray-800 shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-white">Edit Practice Week</h2>
            <p className="text-xs text-gray-500 mt-0.5">Only visible to captains</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center active:scale-90 transition-all"
          >
            <X size={15} className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3 pb-8">
          {selectedDays.map(dateStr => (
            <DayEditForm
              key={dateStr}
              dateStr={dateStr}
              isAdmin={isAdmin}
              defaultTime={defaultTime}
            />
          ))}
        </div>

        {/* Done button */}
        <div className="px-4 pb-6 pt-2 flex-shrink-0 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500 text-white font-bold text-sm active:scale-[0.98] transition-all"
          >
            <Check size={16} strokeWidth={2.5} /> Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function AthleteDashboard({ weeks }) {
  const {
    settings, captains, attendance, dayDetails, workouts,
    activeWeekIndex, userMode, isAdmin, currentCaptainId,
  } = useApp();

  const [weather, setWeather]         = useState({});
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [editOpen, setEditOpen]       = useState(false);

  const canEdit = userMode === 'captain' || currentCaptainId === 'admin';

  const lat = settings.onboarding?.weatherLat ?? 42.28;
  const lon = settings.onboarding?.weatherLon ?? -71.06;

  useEffect(() => {
    fetchWeather(lat, lon)
      .then(data => { setWeather(data); setWeatherLoading(false); })
      .catch(() => setWeatherLoading(false));
  }, [lat, lon]);

  const activeWeek = weeks[activeWeekIndex];

  const selectedDays = useMemo(() => {
    if (!activeWeek) return [];
    return selectTopPractices(
      activeWeek.days, attendance, captains, dayDetails, 3
    );
  }, [activeWeek, attendance, captains, dayDetails]);

  if (!activeWeek) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <span className="text-4xl mb-4">📅</span>
        <h3 className="text-base font-bold text-gray-400">No schedule yet</h3>
        <p className="text-sm text-gray-600 mt-1">Check back soon</p>
      </div>
    );
  }

  const range = formatWeekRange(activeWeek.days[0], activeWeek.days[activeWeek.days.length - 1]);

  return (
    <div className="px-4 pt-4 pb-6">
      {/* Week header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
            Week {activeWeekIndex + 1}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{range}</p>
        </div>

        {/* Captain-only edit button */}
        {canEdit && (
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold active:scale-95 transition-all hover:bg-gray-200 dark:hover:bg-gray-700 mt-1"
          >
            <Pencil size={12} />
            Edit
          </button>
        )}
      </div>

      {/* Announcements strip */}
      {(settings.announcements || []).filter(a => a.active !== false).map(ann => (
        <div key={ann.id} className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-950/40 border border-amber-800/40 mb-3">
          <span className="text-base flex-shrink-0">📢</span>
          <p className="text-xs font-semibold text-amber-300 leading-snug">{ann.text}</p>
        </div>
      ))}

      {/* Section label */}
      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">
        Practice Days This Week
      </p>

      {/* Practice cards */}
      {selectedDays.length === 0 ? (
        <div className="rounded-3xl bg-gray-900 border border-gray-800 px-5 py-10 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">⏳</span>
          <div>
            <p className="text-sm font-bold text-gray-400">Schedule being finalized</p>
            <p className="text-xs text-gray-600 mt-1">Captains haven't set availability yet</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedDays.map((dateStr, i) => (
            <PracticeCard
              key={dateStr}
              dateStr={dateStr}
              weather={weather}
              weatherLoading={weatherLoading}
              isFirst={i === 0}
            />
          ))}
        </div>
      )}

      {/* Training info link */}
      {settings.onboarding?.sheetsUrl && (
        <a
          href={settings.onboarding.sheetsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg flex-shrink-0">📋</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Click for more training information</span>
          </div>
          <ExternalLink size={14} className="text-emerald-500 flex-shrink-0" />
        </a>
      )}

      {/* Future weeks teaser */}
      {activeWeekIndex < weeks.length - 1 && (
        <div className="mt-6">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">
            Coming Up
          </p>
          <LockedCard weekNum={activeWeekIndex + 2} />
        </div>
      )}

      {/* Captain edit sheet */}
      {editOpen && (
        <EditSheet
          selectedDays={selectedDays}
          defaultTime={settings.defaultTime}
          isAdmin={isAdmin}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
