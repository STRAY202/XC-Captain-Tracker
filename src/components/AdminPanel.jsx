import { useState } from 'react';
import {
  X, Plus, Trash2, Users, Settings2, Calendar,
  Lock, ChevronDown, ChevronUp, Check, AlertTriangle,
  Shield, Clock, Eye, EyeOff, Zap, Bell, Link, BookOpen,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useApp, LOCATIONS } from '../context/AppContext';
import { formatShort } from '../utils/dates';

// ── Collapsible section ────────────────────────────────────────────────────────
function Section({ title, icon: Icon, iconBg = 'bg-gray-100 dark:bg-gray-800', iconColor = 'text-gray-500', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors active:bg-gray-100 dark:active:bg-gray-800/80 min-h-[56px]"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={15} className={iconColor} />
          </div>
          <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{title}</span>
        </div>
        {open
          ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" />
          : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-5 pt-4 space-y-3.5 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function LocationPicker({ value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {LOCATIONS.map(loc => {
        const isSelected = value === loc.id || value === loc.label;
        return (
          <button key={loc.id} type="button"
            onClick={() => onChange(loc.id)}
            className={`text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95 text-white ${
              isSelected ? 'shadow-sm' : 'opacity-40 hover:opacity-70'
            }`}
            style={{ backgroundColor: isSelected ? loc.color : loc.color + '66' }}
          >
            {loc.short}
          </button>
        );
      })}
    </div>
  );
}

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
      setError('Wrong code. Try again.');
      setCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-sm rounded-3xl p-6 shadow-2xl animate-slide-up">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gray-900 dark:bg-gray-100 items-center justify-center mb-4 shadow-sm">
            <Shield size={24} className="text-white dark:text-gray-900" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Admin Access</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Enter your admin code to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              autoFocus
              type={show ? 'text' : 'password'}
              value={code}
              onChange={e => { setCode(e.target.value); setError(''); }}
              placeholder="Admin code"
              className="field-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 animate-fade-in">
              <p className="text-sm text-red-500 dark:text-red-400 font-medium text-center">{error}</p>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!code}
              className="flex-1 py-3.5 rounded-xl font-black text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 disabled:opacity-40 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors min-h-[48px]"
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
    updateSettings, updateOnboarding, addCaptain, removeCaptain, updateCaptain,
    setDayDetail, clearDayDetail,
    isAdmin, logoutAdmin, CAPTAIN_COLORS,
  } = useApp();

  const activeWeekIndex = settings.onboarding?.activeWeekIndex ?? 0;
  const sheetsUrl       = settings.onboarding?.sheetsUrl ?? '';
  const captainCode     = settings.onboarding?.captainCode ?? 'captain2026';

  const [newName, setNewName]   = useState('');
  const [newColor, setNewColor] = useState(CAPTAIN_COLORS[0]);
  const [selDate, setSelDate]   = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);

  // Announcements state
  const [newAnnouncement, setNewAnnouncement] = useState('');

  // Onboarding slides state
  const [newSlideIcon,  setNewSlideIcon]  = useState('⭐');
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideBody,  setNewSlideBody]  = useState('');

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

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.trim()) return;
    const ann = { id: `ann_${Date.now()}`, text: newAnnouncement.trim(), active: true };
    updateSettings({ announcements: [...(settings.announcements || []), ann] });
    setNewAnnouncement('');
  };

  const handleAddSlide = () => {
    if (!newSlideTitle.trim()) return;
    const slide = {
      id: `slide_${Date.now()}`,
      icon: newSlideIcon,
      gradient: 'from-emerald-500 to-teal-600',
      title: newSlideTitle.trim(),
      body: newSlideBody.trim(),
    };
    updateSettings({
      onboarding: {
        ...(settings.onboarding || {}),
        slides: [...(settings.onboarding?.slides || []), slide],
      },
    });
    setNewSlideTitle('');
    setNewSlideBody('');
  };

  // If not admin, show login gate
  if (!isAdmin) {
    return <AdminLoginGate onClose={onClose} />;
  }

  const selOverride = dayDetails[selDate] || {};

  const SLIDE_EMOJI_OPTIONS = ['⚡','✅','🟢','🏃','⚙️','📱','🏆','🌟','💪','🎯','📋','🗓️'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-gray-50 dark:bg-gray-950 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl animate-sheet-up sm:animate-scale-in">

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-brand">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <div>
              <h2 className="font-black text-base text-gray-900 dark:text-white leading-tight">Admin Panel</h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Team management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { logoutAdmin(); onClose(); }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold"
            >
              Log out
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors active:scale-90"
            >
              <X size={15} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3 no-scrollbar">

          {/* ── Schedule Control ───────────────────────────────────────────── */}
          <Section
            title="Schedule Control"
            icon={Calendar}
            iconBg="bg-emerald-100 dark:bg-emerald-900/40"
            iconColor="text-emerald-600 dark:text-emerald-400"
            defaultOpen={true}
          >
            <Field label="Active Week for Athletes">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateOnboarding({ activeWeekIndex: Math.max(0, activeWeekIndex - 1) })}
                  disabled={activeWeekIndex === 0}
                  className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
                >
                  <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex-1 text-center">
                  <div className="text-lg font-black text-gray-900 dark:text-white">Week {activeWeekIndex + 1}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">currently shown to athletes</div>
                </div>
                <button
                  onClick={() => updateOnboarding({ activeWeekIndex: Math.min(settings.numWeeks - 1, activeWeekIndex + 1) })}
                  disabled={activeWeekIndex >= settings.numWeeks - 1}
                  className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
                >
                  <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </Field>

            <Field label="Workout Sheet (Google Sheets URL)">
              <div className="relative">
                <Link size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="url"
                  value={sheetsUrl}
                  onChange={e => updateOnboarding({ sheetsUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/…"
                  className="field-input pl-9"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Share the sheet publicly → "Anyone with link can view". Format: Date (YYYY-MM-DD) in column A, workout in column B.
              </p>
            </Field>
          </Section>

          {/* ── Announcements ──────────────────────────────────────────────── */}
          <Section
            title="Announcements"
            icon={Bell}
            iconBg="bg-amber-100 dark:bg-amber-900/40"
            iconColor="text-amber-600 dark:text-amber-400"
            defaultOpen={true}
          >
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              Post notices that appear at the top of the app for all members.
            </p>

            {/* Existing announcements */}
            <div className="space-y-2">
              {(settings.announcements || []).length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2 italic">No announcements yet</p>
              )}
              {(settings.announcements || []).map(ann => (
                <div key={ann.id} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-base flex-shrink-0">📢</span>
                  <span className="flex-1 text-xs text-gray-700 dark:text-gray-200 font-medium leading-snug min-w-0">{ann.text}</span>
                  <button
                    onClick={() => updateSettings({
                      announcements: (settings.announcements || []).map(a =>
                        a.id === ann.id ? { ...a, active: !(a.active !== false) } : a
                      ),
                    })}
                    className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                      ann.active !== false
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {ann.active !== false ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => updateSettings({
                      announcements: (settings.announcements || []).filter(a => a.id !== ann.id),
                    })}
                    className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex-shrink-0 active:scale-90"
                  >
                    <Trash2 size={12} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newAnnouncement}
                onChange={e => setNewAnnouncement(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddAnnouncement()}
                placeholder="E.g. Workout moved to 7:30 AM"
                className="field-input flex-1"
              />
              <button
                onClick={handleAddAnnouncement}
                disabled={!newAnnouncement.trim()}
                className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm active:scale-90 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </Section>

          {/* ── Team Settings ─────────────────────────────────────────────── */}
          <Section
            title="Team Settings"
            icon={Settings2}
            iconBg="bg-emerald-100 dark:bg-emerald-900/40"
            iconColor="text-emerald-600 dark:text-emerald-400"
            defaultOpen={true}
          >
            <Field label="Team Name">
              <input
                type="text"
                value={settings.teamName}
                onChange={e => updateSettings({ teamName: e.target.value })}
                className="field-input"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date">
                <input
                  type="date"
                  value={settings.startDate}
                  onChange={e => updateSettings({ startDate: e.target.value })}
                  className="field-input"
                />
              </Field>
              <Field label="# of Weeks">
                <input
                  type="number"
                  min="4"
                  max="20"
                  value={settings.numWeeks}
                  onChange={e => updateSettings({ numWeeks: parseInt(e.target.value) || 10 })}
                  className="field-input"
                />
              </Field>
            </div>

            <Field label="Default Practice Time">
              <div className="relative">
                <Clock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={settings.defaultTime}
                  onChange={e => updateSettings({ defaultTime: e.target.value })}
                  placeholder="e.g. 8:00 AM"
                  className="field-input pl-9"
                />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Min Covered Days/Wk">
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={settings.minCoveredDays}
                  onChange={e => updateSettings({ minCoveredDays: parseInt(e.target.value) || 3 })}
                  className="field-input"
                />
              </Field>
              <Field label="Min Captains/Day">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.minCaptainsPerDay}
                  onChange={e => updateSettings({ minCaptainsPerDay: parseInt(e.target.value) || 1 })}
                  className="field-input"
                />
              </Field>
            </div>

            {/* Practice days pill toggles */}
            <Field label="Practice Days">
              <div className="flex gap-1.5">
                {['Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => {
                  const active = settings.practiceDays.includes(i);
                  return (
                    <button
                      key={d}
                      onClick={() => {
                        const days = active
                          ? settings.practiceDays.filter(x => x !== i)
                          : [...settings.practiceDays, i].sort();
                        if (days.length > 0) updateSettings({ practiceDays: days });
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 min-h-[40px] ${
                        active
                          ? 'bg-emerald-500 text-white shadow-brand'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </Field>
          </Section>

          {/* ── Access Codes ──────────────────────────────────────────────── */}
          <Section
            title="Access Codes"
            icon={Lock}
            iconBg="bg-amber-100 dark:bg-amber-900/40"
            iconColor="text-amber-600 dark:text-amber-400"
            defaultOpen={false}
          >
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5">
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                <strong>Team code</strong> — captains enter this to access the app.{' '}
                <strong>Admin code</strong> — unlocks this settings panel.
              </p>
            </div>
            <Field label="Athlete Code (xc2026)">
              <input
                type="text"
                value={settings.teamCode || ''}
                onChange={e => updateSettings({ teamCode: e.target.value })}
                placeholder="e.g. xc2026"
                className="field-input"
                autoComplete="off"
              />
            </Field>
            <Field label="Captain Code (captain2026)">
              <input
                type="text"
                value={captainCode}
                onChange={e => updateOnboarding({ captainCode: e.target.value })}
                placeholder="e.g. captain2026"
                className="field-input"
                autoComplete="off"
              />
            </Field>
            <Field label="Admin Code">
              <input
                type="text"
                value={settings.adminCode || ''}
                onChange={e => updateSettings({ adminCode: e.target.value })}
                placeholder="e.g. admin2026"
                className="field-input"
                autoComplete="off"
              />
            </Field>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Athletes use the Athlete Code · Captains use the Captain Code · Admins use the Admin Code.
            </p>
          </Section>

          {/* ── Captains ──────────────────────────────────────────────────── */}
          <Section
            title="Captains"
            icon={Users}
            iconBg="bg-blue-100 dark:bg-blue-900/40"
            iconColor="text-blue-600 dark:text-blue-400"
            defaultOpen={true}
          >
            <div className="space-y-2.5">
              {captains.map(captain => (
                <div key={captain.id} className="flex items-center gap-2.5 p-2 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: captain.color }}
                  >
                    {captain.name.charAt(0)}
                  </div>

                  {/* Name input */}
                  <input
                    type="text"
                    value={captain.name}
                    onChange={e => updateCaptain(captain.id, { name: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 transition-all"
                  />

                  {/* Color swatches */}
                  <div className="flex gap-0.5 flex-shrink-0">
                    {CAPTAIN_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => updateCaptain(captain.id, { color })}
                        className="w-5 h-5 rounded-full transition-all hover:scale-110 active:scale-90 flex-shrink-0"
                        style={{
                          backgroundColor: color,
                          outline: captain.color === color ? `2px solid white` : 'none',
                          outlineOffset: '1px',
                          boxShadow: captain.color === color ? `0 0 0 3px ${color}44` : 'none',
                        }}
                      />
                    ))}
                  </div>

                  {/* Remove / confirm */}
                  {confirmRemove === captain.id ? (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={async () => { await removeCaptain(captain.id); setConfirmRemove(null); }}
                        className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center active:scale-90"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center active:scale-90"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemove(captain.id)}
                      className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex-shrink-0 active:scale-90"
                    >
                      <Trash2 size={13} className="text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add new captain */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCaptain()}
                placeholder="Add captain name…"
                className="field-input flex-1"
              />
              <div className="flex gap-1 items-center flex-shrink-0">
                {CAPTAIN_COLORS.slice(0, 4).map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-6 h-6 rounded-full transition-all hover:scale-110 active:scale-90"
                    style={{
                      backgroundColor: c,
                      outline: newColor === c ? '2px solid white' : 'none',
                      outlineOffset: '1px',
                      boxShadow: newColor === c ? `0 0 0 3px ${c}44` : 'none',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={handleAddCaptain}
                disabled={!newName.trim()}
                className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-brand active:scale-90"
              >
                <Plus size={18} />
              </button>
            </div>
          </Section>

          {/* ── Practice Day Editor ────────────────────────────────────────── */}
          <Section
            title="Edit Practice Day"
            icon={Calendar}
            iconBg="bg-violet-100 dark:bg-violet-900/40"
            iconColor="text-violet-600 dark:text-violet-400"
            defaultOpen={false}
          >
            <Field label="Select a Day">
              <select
                value={selDate}
                onChange={e => setSelDate(e.target.value)}
                className="field-input"
              >
                <option value="">— Pick a date —</option>
                {scheduleDays.map(d => {
                  const ov = dayDetails[d];
                  const tag = ov?.cancelled ? ' [cancelled]' : ov?.optional ? ' [optional]' : '';
                  const date = new Date(d + 'T00:00:00');
                  const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  return <option key={d} value={d}>{label}{tag}</option>;
                })}
              </select>
            </Field>

            {selDate && (
              <div className="space-y-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 animate-fade-in">

                {/* Location */}
                <Field label="Location">
                  <LocationPicker
                    dateStr={selDate}
                    value={selOverride.location || ''}
                    onChange={loc => setDayDetail(selDate, { location: loc })}
                  />
                </Field>

                {/* Custom time */}
                <Field label="Custom Time">
                  <input
                    type="text"
                    value={selOverride.customTime || ''}
                    onChange={e => setDayDetail(selDate, { customTime: e.target.value })}
                    placeholder={`Default: ${settings.defaultTime}`}
                    className="field-input"
                  />
                </Field>

                {/* Notes */}
                <Field label="Notes / Details">
                  <textarea
                    rows={3}
                    value={selOverride.notes || ''}
                    onChange={e => setDayDetail(selDate, { notes: e.target.value })}
                    placeholder="Workout description, meeting instructions…"
                    className="field-input resize-none"
                  />
                </Field>

                {/* Toggles */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setDayDetail(selDate, { cancelled: !selOverride.cancelled, optional: false })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 min-h-[48px] ${
                      selOverride.cancelled
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <AlertTriangle size={13} />
                    {selOverride.cancelled ? 'Cancelled' : 'Cancel Practice'}
                  </button>
                  <button
                    disabled={!!selOverride.cancelled}
                    onClick={() => setDayDetail(selDate, { optional: !selOverride.optional })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 min-h-[48px] disabled:opacity-40 ${
                      selOverride.optional
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Clock size={13} />
                    {selOverride.optional ? 'Optional' : 'Make Optional'}
                  </button>
                </div>

                {Object.keys(selOverride).length > 0 && (
                  <button
                    onClick={() => clearDayDetail(selDate)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors py-2 font-semibold"
                  >
                    <Trash2 size={12} /> Clear all details for this day
                  </button>
                )}
              </div>
            )}
          </Section>

          {/* ── Onboarding & Help Content ──────────────────────────────────── */}
          <Section
            title="Onboarding & Help"
            icon={BookOpen}
            iconBg="bg-pink-100 dark:bg-pink-900/40"
            iconColor="text-pink-600 dark:text-pink-400"
            defaultOpen={false}
          >
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              Customize the welcome screen new users see on their first visit. Leave empty to use the built-in slides.
            </p>

            <Field label="Welcome Title">
              <input
                type="text"
                value={settings.onboarding?.welcomeTitle || ''}
                onChange={e => updateSettings({
                  onboarding: { ...(settings.onboarding || {}), welcomeTitle: e.target.value },
                })}
                placeholder="Welcome to the Team!"
                className="field-input"
              />
            </Field>

            <Field label="Welcome Subtitle">
              <input
                type="text"
                value={settings.onboarding?.welcomeSubtitle || ''}
                onChange={e => updateSettings({
                  onboarding: { ...(settings.onboarding || {}), welcomeSubtitle: e.target.value },
                })}
                placeholder="Your captain scheduling hub"
                className="field-input"
              />
            </Field>

            {/* Custom slides list */}
            {(settings.onboarding?.slides || []).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Custom Slides</p>
                {(settings.onboarding.slides).map((slide, idx) => (
                  <div key={slide.id || idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-xl flex-shrink-0">{slide.icon || '⭐'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{slide.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{slide.body}</p>
                    </div>
                    <button
                      onClick={() => updateSettings({
                        onboarding: {
                          ...(settings.onboarding || {}),
                          slides: (settings.onboarding?.slides || []).filter((_, i) => i !== idx),
                        },
                      })}
                      className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 flex-shrink-0 transition-colors active:scale-90"
                    >
                      <Trash2 size={12} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new slide */}
            <div className="space-y-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Add Custom Slide</p>
              <div className="grid grid-cols-6 gap-1.5">
                {SLIDE_EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    onClick={() => setNewSlideIcon(e)}
                    className={`text-xl py-2 rounded-xl transition-all active:scale-90 ${
                      newSlideIcon === e
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-400'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={newSlideTitle}
                onChange={e => setNewSlideTitle(e.target.value)}
                placeholder="Slide title…"
                className="field-input"
              />
              <textarea
                rows={2}
                value={newSlideBody}
                onChange={e => setNewSlideBody(e.target.value)}
                placeholder="Short description…"
                className="field-input resize-none"
              />
              <button
                onClick={handleAddSlide}
                disabled={!newSlideTitle.trim()}
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-40 hover:bg-emerald-600 transition-colors active:scale-[0.98]"
              >
                <Plus size={14} /> Add Slide
              </button>
            </div>
          </Section>

          {/* Bottom padding for safe area */}
          <div className="h-2 pb-safe" />
        </div>
      </div>
    </div>
  );
}
