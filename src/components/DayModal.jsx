import { useState, useEffect } from 'react';
import {
  X, MapPin, Clock, Edit3, Check, Ban, Star,
  Trash2, Plus, Users, ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatFull, isToday, isPast } from '../utils/dates';
import { WORKOUT_TYPES, getWorkoutType } from '../utils/workoutTypes';

export default function DayModal({ dateStr, onClose }) {
  const {
    captains, attendance, dayDetails, settings, currentCaptainId,
    isAdmin, toggleAttendance, setDayDetail, clearDayDetail,
    isCaptainAttending,
  } = useApp();

  const override     = dayDetails[dateStr] || {};
  const wt           = getWorkoutType(override.workoutType);
  const attending    = captains.filter(c => attendance[dateStr]?.[c.id] === true);
  const notAttending = captains.filter(c => !attendance[dateStr]?.[c.id]);
  const todayDate    = isToday(dateStr);
  const past         = isPast(dateStr);
  const myAttending  = isCaptainAttending(dateStr, currentCaptainId);

  // Edit state (admin only)
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    workoutType: override.workoutType || '',
    notes:       override.notes       || '',
    location:    override.location    || '',
    customTime:  override.customTime  || '',
    cancelled:   override.cancelled   || false,
    optional:    override.optional    || false,
  });

  // Sync form when dayDetails changes
  useEffect(() => {
    if (!editing) {
      setEditForm({
        workoutType: override.workoutType || '',
        notes:       override.notes       || '',
        location:    override.location    || '',
        customTime:  override.customTime  || '',
        cancelled:   override.cancelled   || false,
        optional:    override.optional    || false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayDetails[dateStr], editing]);

  const handleSave = async () => {
    const payload = {
      workoutType: editForm.workoutType || null,
      notes:       editForm.notes.trim()      || null,
      location:    editForm.location.trim()   || null,
      customTime:  editForm.customTime.trim() || null,
      cancelled:   editForm.cancelled,
      optional:    editForm.optional,
    };
    Object.keys(payload).forEach(k => { if (payload[k] === null) delete payload[k]; });
    if (Object.keys(payload).length === 0) {
      await clearDayDetail(dateStr);
    } else {
      await setDayDetail(dateStr, payload);
    }
    setEditing(false);
  };

  const timeDisplay = override.customTime || settings.defaultTime;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl animate-sheet-up sm:animate-scale-in">

        {/* Drag handle pill */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* ── Workout type banner ──────────────────────────────────────────── */}
        {override.workoutType && !editing && (
          <div
            className="px-5 pt-3 pb-4 flex items-center gap-3"
            style={{ backgroundColor: wt.color + '18' }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
              style={{ backgroundColor: wt.color + '30' }}
            >
              {wt.emoji}
            </div>
            <div>
              <span
                className="text-xs font-black uppercase tracking-widest block"
                style={{ color: wt.color }}
              >
                {wt.label}
              </span>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: wt.color + 'aa' }}>
                {wt.category}
              </p>
            </div>
          </div>
        )}

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className={`font-black text-gray-900 dark:text-white text-xl leading-tight ${
              override.cancelled ? 'line-through opacity-50' : ''
            }`}>
              {formatFull(dateStr)}
            </h2>
            {todayDate && (
              <span className="inline-flex items-center mt-1 text-[10px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                Today
              </span>
            )}
            {/* Time + location info row */}
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <div className="w-5 h-5 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Clock size={11} className="text-gray-400" />
                </div>
                {timeDisplay}
              </span>
              {override.location && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                  <div className="w-5 h-5 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <MapPin size={11} className="text-gray-400" />
                  </div>
                  <span className="truncate max-w-[140px]">{override.location}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {isAdmin && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-90"
              >
                <Edit3 size={15} className="text-gray-500" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-90"
            >
              <X size={15} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 pt-4 space-y-4">

          {/* ── Status tags ───────────────────────────────────────────────── */}
          {(override.cancelled || override.optional) && !editing && (
            <div className="flex gap-2">
              {override.cancelled && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-xl">
                  <Ban size={12} /> Cancelled
                </span>
              )}
              {override.optional && !override.cancelled && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl">
                  <Star size={12} /> Optional
                </span>
              )}
            </div>
          )}

          {/* ── Notes ─────────────────────────────────────────────────────── */}
          {override.notes && !editing && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{override.notes}</p>
            </div>
          )}

          {/* ── My attendance toggle ─────────────────────────────────────── */}
          {!override.cancelled && currentCaptainId && currentCaptainId !== 'admin' && !editing && (
            <button
              onClick={() => toggleAttendance(dateStr, currentCaptainId)}
              className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97] min-h-[56px] ${
                myAttending
                  ? 'text-white shadow-brand'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={myAttending ? { backgroundColor: '#10b981' } : {}}
            >
              {myAttending ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                  I'm attending this practice
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

          {/* ── Attendance list ──────────────────────────────────────────── */}
          {!editing && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Users size={12} className="text-gray-400" />
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Attending ({attending.length})
                </span>
              </div>

              {attending.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic px-1">No captains signed up yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {attending.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: c.color }}
                    >
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                        {c.name.charAt(0)}
                      </div>
                      {c.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Not attending */}
              {notAttending.length > 0 && attending.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {notAttending.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800"
                    >
                      <div className="w-3 h-3 rounded-full opacity-40" style={{ backgroundColor: c.color }} />
                      {c.name.split(' ')[0]}
                    </div>
                  ))}
                </div>
              )}

              {notAttending.length > 0 && attending.length === 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {notAttending.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800"
                    >
                      <div className="w-3 h-3 rounded-full opacity-40" style={{ backgroundColor: c.color }} />
                      {c.name.split(' ')[0]}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Admin edit form ──────────────────────────────────────────── */}
          {isAdmin && editing && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <Edit3 size={13} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Edit Practice Details</h3>
              </div>

              {/* Workout type grid */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Workout Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {WORKOUT_TYPES.map(w => (
                    <button
                      key={w.id}
                      onClick={() => setEditForm(f => ({ ...f, workoutType: f.workoutType === w.id ? '' : w.id }))}
                      className={`flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                        editForm.workoutType === w.id
                          ? 'text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      style={editForm.workoutType === w.id ? { backgroundColor: w.color } : {}}
                    >
                      <span>{w.emoji}</span>
                      <span className="truncate">{w.label.replace(' Run', '').replace(' Workout', '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Riverside Park"
                    className="field-input pl-9"
                  />
                </div>
              </div>

              {/* Custom time */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Custom Time
                </label>
                <div className="relative">
                  <Clock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={editForm.customTime}
                    onChange={e => setEditForm(f => ({ ...f, customTime: e.target.value }))}
                    placeholder={`Default: ${settings.defaultTime}`}
                    className="field-input pl-9"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Notes / Details
                </label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Workout details, meeting instructions…"
                  className="field-input resize-none"
                />
              </div>

              {/* Cancelled / Optional toggles */}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditForm(f => ({ ...f, cancelled: !f.cancelled, optional: false }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 min-h-[48px] ${
                    editForm.cancelled
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Ban size={14} />
                  {editForm.cancelled ? 'Cancelled' : 'Cancel Day'}
                </button>
                <button
                  disabled={editForm.cancelled}
                  onClick={() => setEditForm(f => ({ ...f, optional: !f.optional }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 min-h-[48px] disabled:opacity-40 ${
                    editForm.optional
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Star size={14} />
                  {editForm.optional ? 'Optional' : 'Make Optional'}
                </button>
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-emerald-500 text-white shadow-brand hover:bg-emerald-600 active:bg-emerald-700 transition-colors min-h-[48px]"
                >
                  Save Changes
                </button>
              </div>

              {/* Clear all */}
              {Object.keys(override).length > 0 && (
                <button
                  onClick={async () => { await clearDayDetail(dateStr); setEditing(false); }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors py-2"
                >
                  <Trash2 size={12} /> Clear all details for this day
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
