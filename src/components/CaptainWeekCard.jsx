import { useRef, useEffect } from 'react';
import { useApp, LOCATIONS, getLocation } from '../context/AppContext';
import { fromDateStr, formatWeekRange, isToday, isPast } from '../utils/dates';
import { selectTopPractices } from '../utils/practiceSelector';

// ── Day row ────────────────────────────────────────────────────────────────────
function DayRow({ dateStr }) {
  const {
    captains, attendance, dayDetails,
    currentCaptainId, isCaptainAttending, toggleAttendance, setDayDetail,
    isAdmin,
  } = useApp();

  const myGoing     = isCaptainAttending(dateStr, currentCaptainId);
  const override    = dayDetails[dateStr] || {};
  const isCancelled = override.cancelled;
  const currentLoc  = getLocation(override.location);
  const today       = isToday(dateStr);
  const past        = isPast(dateStr);

  const d   = fromDateStr(dateStr);
  const dow = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Other captains attending (not self)
  const otherGoing = captains.filter(c =>
    c.id !== currentCaptainId && attendance[dateStr]?.[c.id] === true
  );

  const handleToggle = () => {
    if (isCancelled || (!myGoing && past)) return;
    toggleAttendance(dateStr, currentCaptainId);
  };

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 opacity-30">
        <div className="w-10 flex-shrink-0">
          <div className="text-[10px] font-black uppercase text-gray-600">{dow}</div>
          <div className="text-sm font-bold text-gray-600">{day}</div>
        </div>
        <div className="flex-1">
          <span className="text-xs text-gray-600 font-semibold line-through">Cancelled</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-4 py-3.5 transition-colors ${
      today ? 'bg-blue-950/20' : myGoing ? 'bg-emerald-950/20' : ''
    } ${past ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        {/* Date */}
        <div className="w-10 flex-shrink-0">
          <div className={`text-[10px] font-black uppercase tracking-wider ${
            today ? 'text-blue-400' : 'text-gray-600'
          }`}>{dow}</div>
          <div className={`text-sm font-bold leading-tight ${
            today ? 'text-blue-300' : 'text-gray-300'
          }`}>{day}</div>
        </div>

        {/* Other captains going */}
        <div className="flex -space-x-1 flex-shrink-0 min-w-[36px]">
          {otherGoing.slice(0, 4).map(c => (
            <div
              key={c.id}
              title={c.name}
              className="w-5 h-5 rounded-full border-2 border-gray-900 text-white text-[9px] font-black flex items-center justify-center"
              style={{ backgroundColor: c.color }}
            >
              {c.name.charAt(0)}
            </div>
          ))}
          {otherGoing.length === 0 && (
            <div className="w-5 h-5 rounded-full border border-gray-700 bg-gray-800" />
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* My availability toggle */}
        <button
          onClick={handleToggle}
          disabled={isCancelled}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 min-w-[100px] justify-center ${
            myGoing
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
          }`}
        >
          {myGoing ? (
            <><span className="text-[10px]">✓</span> Available</>
          ) : (
            <span>Not Available</span>
          )}
        </button>
      </div>

      {/* Location picker (only when available) */}
      {myGoing && (
        <div className="mt-2.5 flex gap-1.5 ml-13 pl-[52px] flex-wrap">
          {LOCATIONS.map(loc => (
            <button
              key={loc.id}
              onClick={() => setDayDetail(dateStr, { location: loc.id })}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                override.location === loc.id || (!override.location && loc.id === 'Memorial')
                  ? 'text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
              style={
                override.location === loc.id || (!override.location && loc.id === 'Memorial')
                  ? { backgroundColor: loc.color, boxShadow: `0 2px 8px ${loc.color}44` }
                  : {}
              }
            >
              {loc.short}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Week card ──────────────────────────────────────────────────────────────────
export default function CaptainWeekCard({ week, isCurrentWeek, weekIndex }) {
  const cardRef = useRef(null);
  const { captains, attendance, dayDetails, settings, isAdmin, setDayDetail } = useApp();

  const selectedDays = selectTopPractices(week.days, attendance, captains, dayDetails, 3);
  const selectedSet  = new Set(selectedDays);

  const range = formatWeekRange(week.days[0], week.days[week.days.length - 1]);

  useEffect(() => {
    if (isCurrentWeek && cardRef.current) {
      const t = setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 400);
      return () => clearTimeout(t);
    }
  }, [isCurrentWeek]);

  return (
    <div
      ref={cardRef}
      className={`bg-gray-900 rounded-3xl overflow-hidden border ${
        isCurrentWeek
          ? 'border-blue-500/30 shadow-lg'
          : 'border-gray-800'
      }`}
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-300">Week {weekIndex + 1}</span>
            {isCurrentWeek && (
              <span className="text-[9px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Now</span>
            )}
            <span className="text-[10px] text-gray-600 font-medium">{range}</span>
          </div>

          {/* Selected day indicators */}
          <div className="flex gap-1 items-center">
            <span className="text-[10px] text-gray-600 font-medium mr-1">Auto-picks:</span>
            {selectedDays.map(d => {
              const dow = fromDateStr(d).toLocaleDateString('en-US', { weekday: 'short' });
              const loc = getLocation(dayDetails[d]?.location);
              return (
                <div
                  key={d}
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-md text-white"
                  style={{ backgroundColor: loc.color + 'cc' }}
                  title={`${dow} — ${loc.short}`}
                >
                  {dow}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day rows */}
      <div className="divide-y divide-gray-800/60">
        {week.days.map(dateStr => (
          <DayRow key={dateStr} dateStr={dateStr} />
        ))}
      </div>

      {/* Admin cancel row */}
      {isAdmin && (
        <div className="border-t border-gray-800 px-4 py-3">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Admin Controls</p>
          <div className="flex gap-2 flex-wrap">
            {week.days.map(dateStr => {
              const ov = dayDetails[dateStr] || {};
              return (
                <button
                  key={dateStr}
                  onClick={() => setDayDetail(dateStr, { cancelled: !ov.cancelled })}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 ${
                    ov.cancelled
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-red-500/30'
                  }`}
                >
                  {fromDateStr(dateStr).toLocaleDateString('en-US', { weekday: 'short' })}
                  {ov.cancelled ? ' ✕' : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
