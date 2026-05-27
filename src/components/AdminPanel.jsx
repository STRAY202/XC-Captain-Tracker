import { useState } from 'react';
import {
  X, Plus, Trash2, Users, Settings2, Calendar,
  Lock, ChevronDown, ChevronUp, Check, AlertTriangle,
  Shield, Clock, Eye, EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatShort } from '../utils/dates';
import { WORKOUT_TYPES, getWorkoutType } from '../utils/workoutTypes';

// ── Collapsible section ────────────────────────────────────────────────────────
function Section({ title, icon: Icon, iconColor = 'text-gray-500', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={15} className={iconColor} />
          <span className="font-bold text-sm text-gray-700 dark:text-gray-100">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3 space-y-3 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass = `w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
  bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm
  focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-gray-400 transition-shadow`;

// ── Admin login gate ────────────────────────────────────────────────────────────
function AdminLoginGate({ onClose }) {
  const { verifyAdminCode } = useApp();
  const [code, setCode]   = useState('');
  const [error, setError] = useState('');
  const [show, setShow]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const ok = verifyAdminCode(code);
    if (!ok) {
      setError('Wrong code.');
      setCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-sm rounded-3xl p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center justify-center mb-3">
            <Shield size={22} className="text-gray-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Admin Access</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Enter admin code to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              autoFocus
              type={show ? 'text' : 'password'}
              value={code}
              onChange={e => { setCode(e.target.value); setError(''); }}
              placeholder="Admin code"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
            <button type="submit" disabled={!code}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 disabled:opacity-40"
            >
              Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export default function AdminPanel({ onClose }) {
  const {
    settings, captains, dayDetails,
    updateSettings, addCaptain, removeCaptain, updateCaptain,
    setDayDetail, clearDayDetail,
    isAdmin, logoutAdmin, CAPTAIN_COLORS,
  } = useApp();

  const [newName, setNewName]   = useState('');
  const [newColor, setNewColor] = useState(CAPTAIN_COLORS[0]);
  const [selDate, setSelDate]   = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);

  // Generate schedule days for the selector
  const scheduleDays = [];
  const start = new Date(settings.startDate + 'T00:00:00');
  for (let w = 0; w < settings.numWeeks; w++) {
    for (let d = 0; d < settings.practiceDays.length; d++) {
      const day = new Date(start);
      day.setDate(day.getDate() + w * 7 + settings.practiceDays[d]);
      const ds = day.toISOString().split('T')[0];
      scheduleDays.push(ds);
    }
  }

  const handleAddCaptain = async () => {
    if (!newName.trim()) return;
    await addCaptain(newName.trim(), newColor);
    setNewName('');
  };

  // If not admin, show login gate
  if (!isAdmin) {
    return <AdminLoginGate onClose={onClose} />;
  }

  const selOverride = dayDetails[selDate] || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-gray-50 dark:bg-gray-950 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-gray-600 dark:text-gray-300" />
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Admin Panel</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { logoutAdmin(); onClose(); }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Log out
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3">

          {/* ── Team Settings ─────────────────────────────────────────── */}
          <Section title="Team Settings" icon={Settings2} iconColor="text-emerald-500">
            <Field label="Team Name">
              <input type="text" value={settings.teamName}
                onChange={e => updateSettings({ teamName: e.target.value })}
                className={inputClass} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date">
                <input type="date" value={settings.startDate}
                  onChange={e => updateSettings({ startDate: e.target.value })}
                  className={inputClass} />
              </Field>
              <Field label="# of Weeks">
                <input type="number" min="4" max="20" value={settings.numWeeks}
                  onChange={e => updateSettings({ numWeeks: parseInt(e.target.value) || 10 })}
                  className={inputClass} />
              </Field>
            </div>

            <Field label="Default Practice Time">
              <input type="text" value={settings.defaultTime}
                onChange={e => updateSettings({ defaultTime: e.target.value })}
                placeholder="e.g. 8:00 AM"
                className={inputClass} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Min Covered Days/Week">
                <input type="number" min="1" max="7" value={settings.minCoveredDays}
                  onChange={e => updateSettings({ minCoveredDays: parseInt(e.target.value) || 3 })}
                  className={inputClass} />
              </Field>
              <Field label="Min Captains/Day">
                <input type="number" min="1" max="10" value={settings.minCaptainsPerDay}
                  onChange={e => updateSettings({ minCaptainsPerDay: parseInt(e.target.value) || 1 })}
                  className={inputClass} />
              </Field>
            </div>

            {/* Practice days toggle */}
            <Field label="Practice Days">
              <div className="flex gap-1.5">
                {['Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => {
                  const active = settings.practiceDays.includes(i);
                  return (
                    <button key={d}
                      onClick={() => {
                        const days = active
                          ? settings.practiceDays.filter(x => x !== i)
                          : [...settings.practiceDays, i].sort();
                        if (days.length > 0) updateSettings({ practiceDays: days });
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        active ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </Field>
          </Section>

          {/* ── Access Codes ──────────────────────────────────────────── */}
          <Section title="Access Codes" icon={Lock} iconColor="text-amber-500" defaultOpen={false}>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 mb-2">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Team code</strong> is what captains enter to access the app.
                <strong> Admin code</strong> unlocks this panel. Change them here.
              </p>
            </div>
            <Field label="Team Access Code">
              <input type="text" value={settings.teamCode || ''}
                onChange={e => updateSettings({ teamCode: e.target.value })}
                placeholder="e.g. xc2026"
                className={inputClass} autoComplete="off" />
            </Field>
            <Field label="Admin Code">
              <input type="text" value={settings.adminCode || ''}
                onChange={e => updateSettings({ adminCode: e.target.value })}
                placeholder="e.g. admin2026"
                className={inputClass} autoComplete="off" />
            </Field>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Changes save instantly. Share new codes with your team.
            </p>
          </Section>

          {/* ── Captains ──────────────────────────────────────────────── */}
          <Section title="Captains" icon={Users} iconColor="text-blue-500">
            <div className="space-y-2">
              {captains.map(captain => (
                <div key={captain.id} className="flex items-center gap-2">
                  {/* Color dot */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: captain.color }}
                  >
                    {captain.name.charAt(0)}
                  </div>
                  {/* Name input */}
                  <input
                    type="text"
                    value={captain.name}
                    onChange={e => updateCaptain(captain.id, { name: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  {/* Color swatches */}
                  <div className="flex gap-0.5">
                    {CAPTAIN_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => updateCaptain(captain.id, { color })}
                        className="w-5 h-5 rounded-full transition-transform hover:scale-110 active:scale-90"
                        style={{
                          backgroundColor: color,
                          outline: captain.color === color ? `2px solid white` : 'none',
                          outlineOffset: '1px',
                        }}
                      />
                    ))}
                  </div>
                  {/* Remove */}
                  {confirmRemove === captain.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={async () => { await removeCaptain(captain.id); setConfirmRemove(null); }}
                        className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center text-xs font-bold"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemove(captain.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={12} className="text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCaptain()}
                placeholder="Add captain name…"
                className={`${inputClass} flex-1`}
              />
              <div className="flex gap-1 items-center">
                {CAPTAIN_COLORS.slice(0, 4).map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      outline: newColor === c ? '2px solid white' : 'none',
                      outlineOffset: '1px',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={handleAddCaptain}
                disabled={!newName.trim()}
                className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Plus size={18} />
              </button>
            </div>
          </Section>

          {/* ── Practice Day Editor ────────────────────────────────────── */}
          <Section title="Edit Practice Day" icon={Calendar} iconColor="text-violet-500" defaultOpen={false}>
            <Field label="Select a day">
              <select
                value={selDate}
                onChange={e => setSelDate(e.target.value)}
                className={inputClass}
              >
                <option value="">— Pick a date —</option>
                {scheduleDays.map(d => {
                  const ov = dayDetails[d];
                  const wt = ov?.workoutType ? ` ${getWorkoutType(ov.workoutType).emoji}` : '';
                  const tag = ov?.cancelled ? ' [cancelled]' : ov?.optional ? ' [optional]' : '';
                  const date = new Date(d + 'T00:00:00');
                  const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  return <option key={d} value={d}>{label}{wt}{tag}</option>;
                })}
              </select>
            </Field>

            {selDate && (
              <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 animate-fade-in">
                {/* Workout type */}
                <Field label="Workout Type">
                  <div className="grid grid-cols-3 gap-1.5">
                    {WORKOUT_TYPES.map(w => {
                      const active = selOverride.workoutType === w.id;
                      return (
                        <button
                          key={w.id}
                          onClick={() => setDayDetail(selDate, { workoutType: active ? null : w.id })}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                            active ? 'text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                          }`}
                          style={active ? { backgroundColor: w.color } : {}}
                        >
                          <span>{w.emoji}</span>
                          <span className="truncate">{w.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Location */}
                <Field label="Location">
                  <input
                    type="text"
                    value={selOverride.location || ''}
                    onChange={e => setDayDetail(selDate, { location: e.target.value })}
                    placeholder="Meeting location…"
                    className={inputClass}
                  />
                </Field>

                {/* Custom time */}
                <Field label="Custom Time (leave blank to use default)">
                  <input
                    type="text"
                    value={selOverride.customTime || ''}
                    onChange={e => setDayDetail(selDate, { customTime: e.target.value })}
                    placeholder={`Default: ${settings.defaultTime}`}
                    className={inputClass}
                  />
                </Field>

                {/* Notes */}
                <Field label="Notes / Details">
                  <textarea
                    rows={3}
                    value={selOverride.notes || ''}
                    onChange={e => setDayDetail(selDate, { notes: e.target.value })}
                    placeholder="Workout description, meeting instructions…"
                    className={`${inputClass} resize-none`}
                  />
                </Field>

                {/* Toggles */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setDayDetail(selDate, { cancelled: !selOverride.cancelled, optional: false })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      selOverride.cancelled ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <AlertTriangle size={12} />
                    {selOverride.cancelled ? 'Cancelled' : 'Cancel Practice'}
                  </button>
                  <button
                    disabled={!!selOverride.cancelled}
                    onClick={() => setDayDetail(selDate, { optional: !selOverride.optional })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
                      selOverride.optional ? 'bg-amber-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Clock size={12} />
                    {selOverride.optional ? 'Optional' : 'Make Optional'}
                  </button>
                </div>

                {Object.keys(selOverride).length > 0 && (
                  <button
                    onClick={() => { clearDayDetail(selDate); }}
                    className="w-full text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 py-1.5 transition-colors"
                  >
                    Clear all details for this day
                  </button>
                )}
              </div>
            )}
          </Section>

        </div>
      </div>
    </div>
  );
}
