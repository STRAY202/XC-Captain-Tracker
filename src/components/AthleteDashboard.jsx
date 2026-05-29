import { useState, useEffect, useMemo } from 'react';
import { MapPin, Clock, CloudSun } from 'lucide-react';
import { useApp, getLocation } from '../context/AppContext';
import { fromDateStr, formatWeekRange } from '../utils/dates';
import { selectTopPractices } from '../utils/practiceSelector';
import { fetchWeather } from '../utils/weather';

// ── Practice card ──────────────────────────────────────────────────────────────
function PracticeCard({ dateStr, weather, weatherLoading, isFirst }) {
  const { settings, dayDetails, workouts, weatherOverrides } = useApp();

  const override        = dayDetails[dateStr] || {};
  const loc             = getLocation(override.location);
  const time            = override.notes?.match(/^\[TIME:(.*?)\]/)?.[1]?.trim()
                        || settings.defaultTime || '8:00 AM';
  const workout         = workouts[dateStr] || '';
  const weatherOverride = weatherOverrides[dateStr] || '';
  const w               = weather[dateStr];

  const d      = fromDateStr(dateStr);
  const dow    = d.toLocaleDateString('en-US', { weekday: 'long' });
  const dateLabel = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const isToday = dateStr === new Date().toISOString().split('T')[0];

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      style={{ boxShadow: `0 4px 32px rgba(0,0,0,0.4), 0 0 0 1px ${loc.color}22` }}
    >
      {/* Location color accent strip */}
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

        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-gray-800 mb-4" />

        {/* Time + Location row */}
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

        {/* Weather label line */}
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

// ── Locked week placeholder ─────────────────────────────────────────────────────
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

// ── Main ───────────────────────────────────────────────────────────────────────
export default function AthleteDashboard({ weeks }) {
  const {
    settings, captains, attendance, dayDetails, workouts,
    activeWeekIndex,
  } = useApp();

  const [weather, setWeather]   = useState({});
  const [weatherLoading, setWeatherLoading] = useState(true);

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
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
          Week {activeWeekIndex + 1}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{range}</p>
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

      {/* Future weeks teaser */}
      {activeWeekIndex < weeks.length - 1 && (
        <div className="mt-6">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">
            Coming Up
          </p>
          <LockedCard weekNum={activeWeekIndex + 2} />
        </div>
      )}
    </div>
  );
}
