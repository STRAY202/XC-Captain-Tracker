import { useState, useEffect } from 'react';
import {
  X, MapPin, Clock, Edit3, Check, Ban, Star,
  Trash2, Plus, Users
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

  // Sync form when dayDetails changes (e.g., real-time update from another device)
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
    // Remove null fields
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="px-5 pt-5 pb-4 flex items-start justify-between"
          style={{ borderBottom: '1px solid', borderColor: 'rgb(229 231 235 / 0.5)' }}
        >
          <div className="flex-1">
            {/* Workout type badge */}
            {override.workoutType && !editing && (
              <div
                className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full text-white mb-2"
                style={{ backgroundColor: wt.color }}
              >
                <span>{wt.emoji}</span>
                {wt.label}
              </div>
            )}
            <h2 className={`font-bold text-gray-900 dark:text-white text-lg leading-tight ${
              override.cancelled ? 'line-through opacity-60' : ''
            }`}>
              {formatFull(dateStr)}
              {todayDate && <span className="ml-2 text-xs font-bold text-blue-500">Today</span>}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={11} /> {timeDisplay}
              </span>
              {override.location && (
                <span className="flex items-center gap-1 text-xs text-gray-400 truncate max-w-[160px]">
                  <MapPin size={11} /> {override.location}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {isAdmin && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit3 size={14} className="text-gray-500" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4 space-y-4">

          {/* ── Status tags ────────────────────────────────────────────── */}
          {(override.cancelled || override.optional) && !editing && (
            <div className="flex gap-2">
              {override.cancelled && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full">
                  <Ban size={11} /> Cancelled
                </span>
              )}
              {override.optional && !override.cancelled && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full">
                  <Star size={11} /> Optional
                </span>
              )}
            </div>
          )}

          {/* ── Notes ──────────────────────────────────────────────────── */}
          {override.notes && !editing && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <p className="text-sm text-gray-700 dark:text-gray-200">{override.notes}</p>
            </div>
          )}

          {/* ── Attendance (my toggle) ──────────────────────────────────── */}
          {!override.cancelled && currentCaptainId && currentCaptainId !== 'admin' && (
            <button
              onClick={() => toggleAttendance(dateStr, currentCaptainId)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 ${
                myAttending
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {myAttending ? (
                <><Check size={16} /> I'm attending this practice</>
              ) : (
                <><Plus size={16} /> Mark me as attending</>
              )}
            </button>
          )}

          {/* ── Attendance list ─────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users size={13} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Attending ({attending.length})
              </span>
            </div>
            {attending.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No captains yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {attending.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white text-xs font-semibold"
                    style={{ backgroundColor: c.color }}
                  >
                    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                      {c.name.charAt(0)}
                    </div>
                    {c.name}
                  </div>
                ))}
              </div>
            )}

            {/* Not attending */}
            {notAttending.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {notAttending.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800"
                  >
                    <div className="w-3 h-3 rounded-full opacity-40" style={{ backgroundColor: c.color }} />
                    {c.name.split(' ')[0]}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Admin edit form ─────────────────────────────────────────── */}
          {isAdmin && editing && (
            <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4 animate-fade-in">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <Edit3 size={13} /> Edit Practice Details
              </h3>

              {/* Workout type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Workout Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {WORKOUT_TYPES.map(w => (
                    <button
                      key={w.id}
                      onClick={() => setEditForm(f => ({ ...f, workoutType: f.workoutType === w.id ? '' : w.id }))}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
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
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <MapPin size={11} className="inline mr-1" />Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Riverside Park"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-gray-400"
                />
              </div>

              {/* Custom time */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Clock size={11} className="inline mr-1" />Custom Time (leave blank for default)
                </label>
                <input
                  type="text"
                  value={editForm.customTime}
                  onChange={e => setEditForm(f => ({ ...f, customTime: e.target.value }))}
                  placeholder={`Default: ${settings.defaultTime}`}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-gray-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes / Details</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Workout details, meeting instructions…"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-gray-400 resize-none"
                />
              </div>

              {/* Toggles */}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditForm(f => ({ ...f, cancelled: !f.cancelled, optional: false }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    editForm.cancelled
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Ban size={13} />
                  {editForm.cancelled ? 'Cancelled' : 'Cancel Practice'}
                </button>
                <button
                  disabled={editForm.cancelled}
                  onClick={() => setEditForm(f => ({ ...f, optional: !f.optional }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
                    editForm.optional
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Star size={13} />
                  {editForm.optional ? 'Optional' : 'Mark Optional'}
                </button>
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>

              {/* Clear all */}
              {Object.keys(override).length > 0 && (
                <button
                  onClick={async () => { await clearDayDetail(dateStr); setEditing(false); }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors py-1.5"
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
