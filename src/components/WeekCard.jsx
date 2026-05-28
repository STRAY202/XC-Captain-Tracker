import { useRef, useEffect, useState } from 'react';
import { Check, Plus, X, MapPin, ChevronDown, ChevronUp, Ban, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fromDateStr, isToday, isPast } from '../utils/dates';

// ── Location helpers ──────────────────────────────────────────────────────────
const LOC_PRESETS = [
  { id: 'memorial', label: 'Memorial',    color: '#10b981', dot: '#10b981' },
  { id: 'cutler',   label: 'Cutler Park', color: '#3b82f6', dot: '#3b82f6' },
];

function locInfo(loc) {
  if (!loc || loc === 'Memorial')    return LOC_PRESETS[0];
  if (loc === 'Cutler Park')         return LOC_PRESETS[1];
  return { id: 'other', label: loc,  color: '#8b5cf6', dot: '#8b5cf6' };
}

function presetId(loc) {
  if (!loc || loc === 'Memorial')    return 'memorial';
  if (loc === 'Cutler Park')         return 'cutler';
  return 'other';
}

// ── Day detail sheet (bottom sheet, opens on tap) ─────────────────────────────
function DayDetailSheet({ dateStr, onClose }) {
  const {
    captains, attendance, dayDetails, settings,
    currentCaptainId, isAdmin,
    setDayDetail, clearDayDetail,
    toggleAttendance, isCaptainAttending,
  } = useApp();

  const override    = dayDetails[dateStr] || {};
  const isCancelled = override.cancelled;
  const currentLoc  = override.location || 'Memorial';
  const info        = locInfo(currentLoc);
  const selId       = presetId(currentLoc);

  const attending   = captains.filter(c => attendance[dateStr]?.[c.id] === true);
  const myAttending = isCaptainAttending(dateStr, currentCaptainId) && !isCancelled;
  const covered     = attending.length >= settings.minCaptainsPerDay;
  const todayDate   = isToday(dateStr);

  const [otherText,  setOtherText]  = useState(selId === 'other' ? currentLoc : '');
  const [notesDraft, setNotesDraft] = useState(override.notes || '');
  const [showNotes,  setShowNotes]  = useState(false);

  useEffect(() => { setNotesDraft(override.notes || ''); }, [override.notes]);
  useEffect(() => { if (selId === 'other') setOtherText(currentLoc); }, [currentLoc, selId]);

  const d       = fromDateStr(dateStr);
  const dayFull = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const handleCancelToggle = () => {
    if (!isCancelled) {
      setDayDetail(dateStr, { cancelled: true });
    } else {
      const { cancelled: _, ...rest } = override;
      Object.keys(rest).length === 0 ? clearDayDetail(dateStr) : setDayDetail(dateStr, { cancelled: false });
    }
  };

  const handleLocSelect = (id) => {
    if (id === 'memorial') setDayDetail(dateStr, { location: 'Memorial' });
    else if (id === 'cutler') setDayDetail(dateStr, { location: 'Cutler Park' });
    else if (selId !== 'other') { setOtherText(''); setDayDetail(dateStr, { location: '' }); }
  };

  const commitOther = () => {
    if (otherText.trim()) setDayDetail(dateStr, { location: otherText.trim() });
  };

  const saveNotes = () => {
    setDayDetail(dateStr, { notes: notesDraft.trim() || null });
    setShowNotes(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-sheet-up sm:animate-scale-in">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {todayDate && (
                <span className="text-[9px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Today
                </span>
              )}
              {isCancelled && (
                <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Cancelled
                </span>
              )}
            </div>
            <h2 className={`text-xl font-black text-gray-900 dark:text-white leading-tight ${isCancelled ? 'line-through opacity-50' : ''}`}>
              {dayFull}
            </h2>
            {!isCancelled && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <MapPin size={13} style={{ color: info.color }} />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{currentLoc}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-90 flex-shrink-0"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 pt-5 pb-8 space-y-5">

          {/* ── Location selector (admin) ── */}
          {isAdmin && !isCancelled && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2.5">
                Location
              </p>
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
                  className="mt-2.5 w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
                />
              )}
            </div>
          )}

          {/* ── My attendance toggle ── */}
          {!isCancelled && currentCaptainId && currentCaptainId !== 'admin' && (
            <button
              onClick={() => toggleAttendance(dateStr, currentCaptainId)}
              className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97] min-h-[56px] ${
                myAttending
                  ? 'text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={myAttending ? { backgroundColor: '#10b981', boxShadow: '0 4px 20px #10b98155' } : {}}
            >
              {myAttending ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                  I'm attending
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Plus size={14} className="text-gray-500 dark:text-gray-300" />
                  </div>
                  Mark me as attending
                </>
              )}
            </button>
          )}

          {/* ── Attending captains ── */}
          {!isCancelled && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Users size={12} className="text-gray-400" />
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Attending ({attending.length})
                </span>
                {covered && (
                  <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
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

          {/* ── Admin controls ── */}
          {isAdmin && (
            <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">

              {/* Notes toggle */}
              <button
                onClick={() => setShowNotes(s => !s)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {override.notes ? 'Edit notes' : 'Add notes'}
                {override.notes && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </button>

              {override.notes && !showNotes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  {override.notes}
                </p>
              )}

              {showNotes && (
                <div className="space-y-2 animate-fade-in">
                  <textarea
                    rows={3}
                    value={notesDraft}
                    onChange={e => setNotesDraft(e.target.value)}
                    placeholder="Practice notes, instructions…"
                    className="w-full text-sm px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowNotes(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 transition-colors">
                      Dismiss
                    </button>
                    <button onClick={saveNotes} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors active:scale-[0.98]">
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* Cancel / Restore */}
              <button
                onClick={handleCancelToggle}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] ${
                  isCancelled
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
                    : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50'
                }`}
              >
                <Ban size={14} />
                {isCancelled ? 'Restore Practice' : 'Cancel Practice'}
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Compact horizontal day card ───────────────────────────────────────────────
function DayCard({ dateStr, onTap }) {
  const {
    captains, attendance, dayDetails, settings,
    currentCaptainId, isCaptainAttending,
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

  const d       = fromDateStr(dateStr);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateNum = d.getDate();

  // ── Cancelled state ──
  if (isCancelled) {
    return (
      <button
        onClick={onTap}
        className="flex flex-col items-center justify-start pt-2.5 pb-2.5 rounded-2xl bg-gray-100/40 dark:bg-gray-800/20 opacity-35 hover:opacity-50 active:scale-95 transition-all"
      >
        <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 leading-none">
          {dayName}
        </span>
        <span className="text-[15px] font-black text-gray-400 leading-tight mt-0.5">
          {dateNum}
        </span>
        <div className="mt-1.5 w-4 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
      </button>
    );
  }

  // ── Active state ──
  return (
    <button
      onClick={onTap}
      className={`flex flex-col items-center justify-start pt-2.5 pb-2.5 rounded-2xl transition-all active:scale-95 ${
        myAttending
          ? 'shadow-lg'
          : covered
          ? 'bg-white dark:bg-gray-900 border-2 border-emerald-300 dark:border-emerald-700 shadow-sm'
          : partial
          ? 'bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800'
          : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
      } ${todayDate && !myAttending ? 'ring-2 ring-blue-400/40 dark:ring-blue-500/40' : ''}`}
      style={myAttending ? {
        backgroundColor: '#10b981',
        borderColor: 'transparent',
        boxShadow: '0 4px 14px #10b98140',
      } : {}}
    >
      {/* Day abbr */}
      <span className={`text-[8px] font-black uppercase tracking-wider leading-none ${
        myAttending ? 'text-emerald-100' : todayDate ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
      }`}>
        {dayName}
      </span>

      {/* Date number */}
      <span className={`text-[17px] font-black leading-tight mt-0.5 ${
        myAttending ? 'text-white' : todayDate ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-100'
      }`}>
        {dateNum}
      </span>

      {/* Location dot */}
      <div
        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
        style={{ backgroundColor: myAttending ? 'rgba(255,255,255,0.55)' : info.dot }}
      />

      {/* Captain count */}
      <span className={`text-[12px] font-black leading-none mt-1 ${
        myAttending ? 'text-white'
        : covered   ? 'text-emerald-600 dark:text-emerald-400'
        : partial   ? 'text-amber-600 dark:text-amber-400'
        :             'text-gray-400 dark:text-gray-500'
      }`}>
        {attending.length}
      </span>

      {/* Mini captain dots */}
      {attending.length > 0 && (
        <div className="flex -space-x-0.5 mt-1">
          {attending.slice(0, 3).map(c => (
            <div
              key={c.id}
              className="w-[7px] h-[7px] rounded-full ring-[1px] ring-white dark:ring-gray-900"
              style={{ backgroundColor: myAttending ? 'rgba(255,255,255,0.65)' : c.color }}
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
  const [activeDay, setActiveDay] = useState(null);
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
    <>
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

          {/* ── Horizontal day cards ── */}
          <div className="grid grid-cols-6 gap-1">
            {week.days.map(dateStr => (
              <DayCard
                key={dateStr}
                dateStr={dateStr}
                onTap={() => setActiveDay(dateStr)}
              />
            ))}
          </div>

          {/* Footer */}
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

      {activeDay && (
        <DayDetailSheet dateStr={activeDay} onClose={() => setActiveDay(null)} />
      )}
    </>
  );
}
