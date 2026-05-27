import { useState } from 'react';
import {
  Plus, Trash2, X, Clock, Calendar, Ban, Star,
  Users, Settings2, ChevronDown, ChevronUp, CheckCircle
} from 'lucide-react';
import { formatFull, fromDateStr } from '../utils/dates';

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-gray-500 dark:text-gray-400" />
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{title}</span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-gray-400" />
        ) : (
          <ChevronDown size={14} className="text-gray-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel({
  captains,
  settings,
  weeks,
  dayOverrides,
  onAddCaptain,
  onRemoveCaptain,
  onUpdateCaptain,
  onUpdateSettings,
  onSetDayOverride,
  onClearDayOverride,
  onClose,
  CAPTAIN_COLORS,
}) {
  const [newCaptainName, setNewCaptainName] = useState('');
  const [newCaptainColor, setNewCaptainColor] = useState(CAPTAIN_COLORS[0]);
  const [selectedDate, setSelectedDate] = useState('');

  const handleAddCaptain = () => {
    const name = newCaptainName.trim();
    if (!name) return;
    onAddCaptain(name, newCaptainColor);
    setNewCaptainName('');
  };

  const allDates = weeks.flatMap(w => w.days);

  const handleToggleCancelled = (dateStr) => {
    const cur = dayOverrides[dateStr];
    if (cur?.cancelled) {
      onClearDayOverride(dateStr);
    } else {
      onSetDayOverride(dateStr, { cancelled: true, optional: false });
    }
  };

  const handleToggleOptional = (dateStr) => {
    const cur = dayOverrides[dateStr];
    if (cur?.cancelled) return; // can't mark optional if cancelled
    onSetDayOverride(dateStr, { optional: !cur?.optional });
  };

  const handleTimeOverride = (dateStr, time) => {
    onSetDayOverride(dateStr, { customTime: time });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-gray-50 dark:bg-gray-950 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-gray-600 dark:text-gray-300" />
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Admin Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3">

          {/* Team Settings */}
          <Section title="Team Settings" icon={Settings2}>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Team Name</label>
                <input
                  type="text"
                  value={settings.teamName}
                  onChange={e => onUpdateSettings({ teamName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Default Practice Time</label>
                <input
                  type="time"
                  value={settings.defaultTime.replace(' AM', '').replace(' PM', '')}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':');
                    const hour = parseInt(h);
                    const ampm = hour < 12 ? 'AM' : 'PM';
                    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                    onUpdateSettings({ defaultTime: `${h12}:${m} ${ampm}` });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Min Covered Days/Week</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={settings.minCoveredDays}
                    onChange={e => onUpdateSettings({ minCoveredDays: parseInt(e.target.value) || 3 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Captains/Day Minimum</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.minCaptainsPerDay}
                    onChange={e => onUpdateSettings({ minCaptainsPerDay: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={settings.startDate}
                    onChange={e => onUpdateSettings({ startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Number of Weeks</label>
                  <input
                    type="number"
                    min="4"
                    max="20"
                    value={settings.numWeeks}
                    onChange={e => onUpdateSettings({ numWeeks: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Captains */}
          <Section title="Captains" icon={Users}>
            <div className="space-y-2 mb-3">
              {captains.map(captain => (
                <div key={captain.id} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: captain.color }}
                  >
                    {captain.name.charAt(0)}
                  </div>
                  <input
                    type="text"
                    value={captain.name}
                    onChange={e => onUpdateCaptain(captain.id, { name: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <div className="flex gap-0.5">
                    {CAPTAIN_COLORS.slice(0, 5).map(color => (
                      <button
                        key={color}
                        onClick={() => onUpdateCaptain(captain.id, { color })}
                        className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                        style={{ backgroundColor: color, outline: captain.color === color ? '2px solid #fff' : 'none', outlineOffset: '1px' }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => onRemoveCaptain(captain.id)}
                    className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add captain */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCaptainName}
                onChange={e => setNewCaptainName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCaptain()}
                placeholder="New captain name…"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-gray-400"
              />
              <button
                onClick={handleAddCaptain}
                disabled={!newCaptainName.trim()}
                className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 active:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Plus size={16} />
              </button>
            </div>
          </Section>

          {/* Day Overrides */}
          <Section title="Practice Day Overrides" icon={Calendar} defaultOpen={false}>
            <div className="space-y-2">
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Select a date</label>
                <select
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">-- Pick a date --</option>
                  {allDates.map(d => {
                    const override = dayOverrides[d];
                    const label = formatFull(d);
                    const suffix = override?.cancelled ? ' [CANCELLED]' : override?.optional ? ' [optional]' : '';
                    return <option key={d} value={d}>{label}{suffix}</option>;
                  })}
                </select>
              </div>

              {selectedDate && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-3 animate-fade-in">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {formatFull(selectedDate)}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleCancelled(selectedDate)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        dayOverrides[selectedDate]?.cancelled
                          ? 'bg-red-500 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-300'
                      }`}
                    >
                      <Ban size={13} />
                      {dayOverrides[selectedDate]?.cancelled ? 'Uncancel' : 'Cancel Practice'}
                    </button>

                    <button
                      onClick={() => handleToggleOptional(selectedDate)}
                      disabled={!!dayOverrides[selectedDate]?.cancelled}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 ${
                        dayOverrides[selectedDate]?.optional
                          ? 'bg-amber-500 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-amber-300'
                      }`}
                    >
                      <Star size={13} />
                      {dayOverrides[selectedDate]?.optional ? 'Required' : 'Optional'}
                    </button>
                  </div>

                  {/* Custom time */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Custom Start Time</label>
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={dayOverrides[selectedDate]?.customTime
                          ? dayOverrides[selectedDate].customTime.replace(' AM','').replace(' PM','')
                          : '08:00'}
                        onChange={e => {
                          const [h, m] = e.target.value.split(':');
                          const hour = parseInt(h);
                          const ampm = hour < 12 ? 'AM' : 'PM';
                          const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                          handleTimeOverride(selectedDate, `${h12}:${m} ${ampm}`);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      {dayOverrides[selectedDate]?.customTime && (
                        <button
                          onClick={() => {
                            const override = { ...dayOverrides[selectedDate] };
                            delete override.customTime;
                            onSetDayOverride(selectedDate, override);
                          }}
                          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Clear override button */}
                  {dayOverrides[selectedDate] && (
                    <button
                      onClick={() => onClearDayOverride(selectedDate)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                      <CheckCircle size={12} />
                      Clear all overrides for this day
                    </button>
                  )}
                </div>
              )}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
