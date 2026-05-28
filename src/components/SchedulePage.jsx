import { useState, useEffect, useMemo } from 'react';
import { MapPin, CloudSun, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fromDateStr, isToday, isPast } from '../utils/dates';
import { fetchWeather } from '../utils/weather';

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(dateStr) {
  const d = fromDateStr(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Single day row ─────────────────────────────────────────────────────────────
function DayRow({ dateStr, weather, isRecommended, rank }) {
  const {
    captains, attendance, dayDetails, settings,
    currentCaptainId, userMode, toggleAttendance, isCaptainAttending,
  } = useApp();

  const override    = dayDetails[dateStr] || {};
  const isCancelled = override.cancelled;
  const location    = override.location || 'Memorial';
  const notes       = override.notes || '';
  const w           = weather[dateStr];

  const attendingCaptains = captains.filter(c => attendance[dateStr]?.[c.id] === true);
  const myAttending = isCaptainAttending(dateStr, currentCaptainId) && !isCancelled;
  const covered     = !isCancelled && attendingCaptains.length >= settings.minCaptainsPerDay;

  const canToggle = !isCancelled && currentCaptainId;
  const past      = isPast(dateStr);
  const todayDate = isToday(dateStr);

  const handleTap = () => {
    if (canToggle) toggleAttendance(dateStr, currentCaptainId);
  };

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 opacity-40">
        <div className="w-10 text-center flex-shrink-0">
          <div className="text-[10px] font-black uppercase tracking-wide text-gray-400">
            {fromDateStr(dateStr).toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
          <div className="text-lg font-black text-gray-400">{fromDateStr(dateStr).getDate()}</div>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-gray-400 line-through">{fmt(dateStr)}</span>
          <p className="text-[11px] text-gray-400 mt-0.5">Cancelled</p>
        </div>
      </div>
    );
  }

  const recommendBadge = isRecommended && rank != null && (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full text-white flex-shrink-0 ${
      rank === 0 ? 'bg-emerald-500' : rank === 1 ? 'bg-teal-500' : 'bg-sky-500'
    }`}>
      #{rank + 1} Pick
    </span>
  );

  return (
    <button
      onClick={handleTap}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all active:scale-[0.98] text-left ${
        myAttending
          ? 'bg-emerald-50 dark:bg-emerald-950/30'
          : todayDate
          ? 'bg-blue-50 dark:bg-blue-950/20'
          : 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/30'
      } ${past ? 'opacity-60' : ''}`}
    >
      {/* Date column */}
      <div className="w-10 text-center flex-shrink-0">
        <div className={`text-[10px] font-black uppercase tracking-wide ${
          todayDate ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {fromDateStr(dateStr).toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div className={`text-lg font-black leading-tight ${
          myAttending ? 'text-emerald-600 dark:text-emerald-400'
          : todayDate ? 'text-blue-600 dark:text-blue-300'
          : 'text-gray-800 dark:text-gray-100'
        }`}>
          {fromDateStr(dateStr).getDate()}
        </div>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className={`text-xs font-bold truncate ${
            todayDate ? 'text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'
          }`}>
            {fromDateStr(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {todayDate && <span className="ml-1 text-[9px] font-extrabold text-blue-500 uppercase">Today</span>}
          </span>
          {recommendBadge}
          {myAttending && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500 text-white flex-shrink-0">Going ✓</span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Location */}
          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
            <MapPin size={10} className="flex-shrink-0" />
            {location}
          </span>

          {/* Captain attendance */}
          <span className="flex items-center gap-1 text-[11px] font-medium">
            <Users size={10} className={`flex-shrink-0 ${covered ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`} />
            <span className={covered ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}>
              {attendingCaptains.length} captain{attendingCaptains.length !== 1 ? 's' : ''}
            </span>
          </span>
        </div>

        {/* Captain name pills */}
        {attendingCaptains.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {attendingCaptains.map(c => (
              <span
                key={c.id}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: c.color + '20', color: c.color }}
              >
                {c.name.split(' ')[0]}
              </span>
            ))}
          </div>
        )}

        {/* Notes */}
        {notes && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 italic">{notes}</p>
        )}
      </div>

      {/* Weather column */}
      {w && (
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0 ml-1">
          <span className="text-xl leading-none">{w.emoji}</span>
          <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{w.high}°</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{w.low}°</span>
          {w.precip > 0 && (
            <span className="text-[9px] text-blue-400 font-semibold">{w.precip}%</span>
          )}
        </div>
      )}

      {/* My attendance toggle indicator */}
      <div className={`w-6 h-6 rounded-full flex-shrink-0 border-2 flex items-center justify-center transition-all ml-1 ${
        myAttending
          ? 'bg-emerald-500 border-emerald-500'
          : past
          ? 'border-gray-200 dark:border-gray-700 opacity-30'
          : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400'
      }`}>
        {myAttending && <span className="text-white text-[10px] font-black">✓</span>}
      </div>
    </button>
  );
}

// ── Week section ───────────────────────────────────────────────────────────────
function WeekSection({ week, weekIndex, isCurrentWeek, weather }) {
  const { dayDetails, captains, attendance, settings } = useApp();

  const activeDays = week.days.filter(d => !dayDetails[d]?.cancelled);

  // Score each day by captain attendance count (for recommendations)
  const dayScores = activeDays.map(d => {
    const count = captains.filter(c => attendance[d]?.[c.id] === true).length;
    return { date: d, count };
  });

  // Top 3 recommended = most captains attending (tie-break: earlier date)
  const sorted     = [...dayScores].sort((a, b) => b.count - a.count || a.date.localeCompare(b.date));
  const topDates   = new Set(sorted.slice(0, 3).map(x => x.date));
  const topOrdered = sorted.slice(0, 3).map(x => x.date);

  const firstDate = fromDateStr(week.days[0]);
  const lastDate  = fromDateStr(week.days[week.days.length - 1]);
  const range     = `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${lastDate.toLocaleDateString('en-US', { day: 'numeric' })}`;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-card mb-3 mx-4 ${
      isCurrentWeek ? 'ring-2 ring-blue-400/30 dark:ring-blue-500/30' : ''
    }`}>
      {/* Week header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">Week {weekIndex + 1}</span>
          {isCurrentWeek && (
            <span className="text-[9px] font-extrabold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">NOW</span>
          )}
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{range}</span>
        </div>
        {topDates.size > 0 && (
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CloudSun size={11} /> {topDates.size} rec.
          </span>
        )}
      </div>

      {/* Day rows */}
      <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
        {week.days.map(dateStr => (
          <DayRow
            key={dateStr}
            dateStr={dateStr}
            weather={weather}
            isRecommended={topDates.has(dateStr)}
            rank={topOrdered.indexOf(dateStr)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function SchedulePage({ weeks, currentWeekIndex }) {
  const { settings } = useApp();
  const [weather, setWeather]         = useState({});
  const [showAll, setShowAll]         = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  const lat = settings.onboarding?.weatherLat ?? 42.28;
  const lon = settings.onboarding?.weatherLon ?? -71.06;

  useEffect(() => {
    fetchWeather(lat, lon)
      .then(data => {
        if (Object.keys(data).length === 0) setWeatherError(true);
        else setWeather(data);
      })
      .catch(() => setWeatherError(true));
  }, [lat, lon]);

  const visibleWeeks = useMemo(() => {
    if (showAll) return weeks;
    const s = Math.max(0, currentWeekIndex - 1);
    const e = Math.min(weeks.length - 1, currentWeekIndex + 3);
    return weeks.slice(s, e + 1);
  }, [weeks, currentWeekIndex, showAll]);

  return (
    <div className="mt-4 pb-4">
      {/* Header */}
      <div className="px-4 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white">Practice Schedule</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            Tap a day to mark your attendance · top picks highlighted
          </p>
        </div>
        {!weatherError && Object.keys(weather).length === 0 && (
          <span className="text-[10px] text-gray-400 animate-pulse flex items-center gap-1">
            <CloudSun size={11} /> Loading weather…
          </span>
        )}
      </div>

      {visibleWeeks.map(week => (
        <WeekSection
          key={week.id}
          week={week}
          weekIndex={week.index}
          isCurrentWeek={week.index === currentWeekIndex}
          weather={weather}
        />
      ))}

      <div className="px-4 mt-2">
        <button
          onClick={() => setShowAll(s => !s)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all active:scale-[0.98] shadow-sm"
        >
          {showAll ? '↑ Show fewer' : `↓ Show all ${weeks.length} weeks`}
        </button>
      </div>
    </div>
  );
}
