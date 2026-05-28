import { useRef, useEffect, useState } from 'react';
import { MapPin, Check, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fromDateStr, formatShort, isToday, isPast } from '../utils/dates';

const PRESET_LOCATIONS = ['Memorial', 'Cutler Park'];

function LocationSelector({ dateStr }) {
  const { isAdmin, dayDetails, setDayDetail } = useApp();
  const override = dayDetails[dateStr] || {};
  const currentLoc = override.location || '';

  const selectedPreset = PRESET_LOCATIONS.includes(currentLoc) ? currentLoc : (currentLoc ? 'other' : '');
  const [otherText, setOtherText] = useState(selectedPreset === 'other' ? currentLoc : '');

  useEffect(() => {
    if (!PRESET_LOCATIONS.includes(currentLoc) && currentLoc) {
      setOtherText(currentLoc);
    }
  }, [currentLoc]);

  if (!isAdmin) {
    if (!currentLoc) return (
      <span className="text-xs text-gray-400 dark:text-gray-500 italic">Location TBD</span>
    );
    return (
      <div className="flex items-center gap-1.5">
        <MapPin size={12} className="text-emerald-500 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{currentLoc}</span>
      </div>
    );
  }

  const handlePreset = (loc) => {
    setDayDetail(dateStr, { location: loc });
  };

  const handleOtherSelect = () => {
    if (selectedPreset !== 'other') {
      setOtherText('');
      setDayDetail(dateStr, { location: '' });
    }
  };

  const commitOther = () => {
    const val = otherText.trim();
    if (val) setDayDetail(dateStr, { location: val });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <MapPin size={11} className="text-gray-400 flex-shrink-0" />
        {PRESET_LOCATIONS.map(loc => (
          <button
            key={loc}
            onClick={() => handlePreset(loc)}
            className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all active:scale-95 ${
              selectedPreset === loc
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {loc}
          </button>
        ))}
        <button
          onClick={handleOtherSelect}
          className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all active:scale-95 ${
            selectedPreset === 'other'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Other…
        </button>
      </div>
      {selectedPreset === 'other' && (
        <input
          type="text"
          value={otherText}
          onChange={e => setOtherText(e.target.value)}
          onBlur={commitOther}
          onKeyDown={e => e.key === 'Enter' && commitOther()}
          placeholder="Enter location…"
          className="text-xs w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
        />
      )}
    </div>
  );
}

function DayRow({ dateStr }) {
  const {
    captains, attendance, dayDetails, settings,
    currentCaptainId, isAdmin,
    setDayDetail, clearDayDetail,
    toggleAttendance, isCaptainAttending,
  } = useApp();

  const override    = dayDetails[dateStr] || {};
  const isCancelled = override.cancelled;
  const attending   = captains.filter(c => attendance[dateStr]?.[c.id] === true);
  const myAttending = isCaptainAttending(dateStr, currentCaptainId);
  const covered     = attending.length >= settings.minCaptainsPerDay;
  const todayDate   = isToday(dateStr);
  const past        = isPast(dateStr);

  const [showNotes, setShowNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(override.notes || '');

  useEffect(() => {
    if (!showNotes) setNotesDraft(override.notes || '');
  }, [override.notes, showNotes]);

  const d = fromDateStr(dateStr);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum  = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const handleCancelToggle = () => {
    if (!isCancelled) {
      setDayDetail(dateStr, { cancelled: true });
    } else {
      const { cancelled, ...rest } = override;
      if (Object.keys(rest).length === 0) clearDayDetail(dateStr);
      else setDayDetail(dateStr, { cancelled: false });
    }
  };

  const handleAttendance = () => {
    if (!currentCaptainId || currentCaptainId === 'admin' || isCancelled) return;
    toggleAttendance(dateStr, currentCaptainId);
  };

  const saveNotes = () => {
    setDayDetail(dateStr, { notes: notesDraft.trim() || null });
    setShowNotes(false);
  };

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-100/60 dark:bg-gray-800/30 opacity-50">
        <div className="w-14 flex-shrink-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{dayName}</div>
          <div className="text-xs font-bold text-gray-400">{dayNum}</div>
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 flex-shrink-0">
            Unavailable
          </span>
          <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
        </div>
        {isAdmin && (
          <button
            onClick={handleCancelToggle}
            className="flex-shrink-0 text-[11px] font-bold text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            Restore
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${
      todayDate
        ? 'border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20'
        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
    }`}>
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex-shrink-0">
              <div className={`text-[10px] font-black uppercase tracking-widest ${
                todayDate ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}>{dayName}</div>
              <div className={`text-sm font-extrabold leading-tight ${
                todayDate ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-100'
              }`}>{dayNum}</div>
            </div>
            {todayDate && (
              <span className="text-[9px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">
                Today
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {covered ? (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                ✓ Covered
              </span>
            ) : attending.length > 0 ? (
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                Partial
              </span>
            ) : !past ? (
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                Open
              </span>
            ) : null}

            {isAdmin && (
              <button
                onClick={handleCancelToggle}
                className="text-[11px] font-bold text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="mb-3">
          <LocationSelector dateStr={dateStr} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {attending.length === 0 ? (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">No one signed up yet</span>
            ) : (
              attending.map(c => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold text-white"
                  style={{ backgroundColor: c.color }}
                >
                  {c.name.split(' ')[0]}
                </span>
              ))
            )}
          </div>

          {currentCaptainId && currentCaptainId !== 'admin' && (
            <button
              onClick={handleAttendance}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 min-h-[32px] ${
                myAttending
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={myAttending ? { backgroundColor: '#10b981' } : {}}
            >
              {myAttending
                ? <><Check size={12} /> I'm in</>
                : <><Plus size={12} /> I'm in</>
              }
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="mt-2.5 border-t border-gray-100 dark:border-gray-800 pt-2.5">
            <button
              onClick={() => setShowNotes(s => !s)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showNotes ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {override.notes ? 'Edit notes' : 'Add notes'}
              {override.notes && (
                <span className="text-emerald-500">•</span>
              )}
            </button>
            {showNotes && (
              <div className="mt-2 space-y-2 animate-fade-in">
                <textarea
                  rows={2}
                  value={notesDraft}
                  onChange={e => setNotesDraft(e.target.value)}
                  placeholder="Practice notes, meeting instructions…"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none transition-all"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNotes(false)}
                    className="flex-1 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={saveNotes}
                    className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors active:scale-[0.98]"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
            {override.notes && !showNotes && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-3.5 border-l-2 border-gray-200 dark:border-gray-700">
                {override.notes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WeekCard({ week, isCurrentWeek, weekIndex }) {
  const cardRef = useRef(null);
  const { getWeekStats, dayDetails, settings } = useApp();

  const { coveredCount, totalActive, isCovered, isPartial } = getWeekStats(week.days);
  const isUncovered = coveredCount === 0 && totalActive > 0;

  useEffect(() => {
    if (isCurrentWeek && cardRef.current) {
      const timer = setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isCurrentWeek]);

  const firstDate = fromDateStr(week.days[0]);
  const lastDate  = fromDateStr(week.days[week.days.length - 1]);
  const range = `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${lastDate.toLocaleDateString('en-US', { day: 'numeric' })}`;

  const stripColor = isCovered ? '#10b981' : isPartial ? '#f59e0b' : isUncovered ? '#ef4444' : '#9ca3af';

  const activeDays    = week.days.filter(d => !dayDetails[d]?.cancelled);
  const cancelledDays = week.days.filter(d =>  dayDetails[d]?.cancelled);

  return (
    <div
      ref={cardRef}
      className={`relative bg-gray-50 dark:bg-gray-900/60 rounded-3xl overflow-hidden transition-all duration-300 shadow-card ${
        isCurrentWeek ? 'ring-2 ring-blue-400/30 dark:ring-blue-500/30 shadow-card-lg' : ''
      }`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl"
        style={{ backgroundColor: stripColor }}
      />

      <div className="pl-5 pr-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200 tracking-tight">
              Week {weekIndex + 1}
            </span>
            {isCurrentWeek && (
              <span className="text-[9px] font-extrabold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                NOW
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{range}</span>
          </div>

          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
            isCovered
              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
              : isPartial
              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
              : isUncovered
              ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}>
            {coveredCount}/{settings.minCoveredDays}
          </span>
        </div>

        <div className="space-y-2">
          {week.days.map((dateStr) => (
            <DayRow key={dateStr} dateStr={dateStr} />
          ))}
        </div>
      </div>
    </div>
  );
}
