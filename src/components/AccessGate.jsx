import { useState } from 'react';
import { ArrowRight, Lock, ChevronRight, UserCheck, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

// ── Team code entry ────────────────────────────────────────────────────────────
function TeamCodeScreen({ onSuccess }) {
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyTeamCode, settings } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    const ok = await verifyTeamCode(code);
    if (ok) {
      onSuccess();
    } else {
      setError('Wrong code — ask your coach or captain.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-950 dark:to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs animate-bounce-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 mb-4">
            <span className="text-3xl">🏃</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{settings.teamName}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Enter your team access code</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value); setError(''); }}
              placeholder="Team access code"
              autoCapitalize="none"
              autoCorrect="off"
              className={`w-full pl-10 pr-4 py-3.5 rounded-2xl border text-base font-medium focus:outline-none transition-all
                ${error
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-emerald-400 dark:focus:border-emerald-500'}
                text-gray-800 dark:text-gray-100 placeholder-gray-400`}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 text-center animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold text-base shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse">Checking…</span>
            ) : (
              <>Join Team <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Get the code from your coach
        </p>
      </div>
    </div>
  );
}

// ── Captain selection ──────────────────────────────────────────────────────────
function CaptainSelectScreen() {
  const { captains, selectCaptain, settings } = useApp();
  const [hovered, setHovered] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-950 dark:to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 mb-4">
            <span className="text-3xl">🏃</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{settings.teamName}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Who are you?</p>
        </div>

        {/* Captain list */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-3">
          {[...captains].sort((a, b) => a.name.localeCompare(b.name)).map((captain, idx) => (
            <button
              key={captain.id}
              onClick={() => selectCaptain(captain.id)}
              onMouseEnter={() => setHovered(captain.id)}
              onMouseLeave={() => setHovered(null)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors
                ${idx > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}
                ${hovered === captain.id ? 'bg-gray-50 dark:bg-gray-800/60' : 'bg-transparent'}
                active:bg-gray-100 dark:active:bg-gray-800`}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                style={{ backgroundColor: captain.color }}
              >
                {captain.name.charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 text-left font-semibold text-gray-800 dark:text-gray-100">{captain.name}</span>
              <div className="flex items-center gap-1 text-gray-300 dark:text-gray-600">
                <UserCheck size={14} />
                <ChevronRight size={13} />
              </div>
            </button>
          ))}

          {captains.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              <div className="animate-pulse">Loading team…</div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
          Your name is remembered for next time
        </p>
      </div>
    </div>
  );
}

// ── Combined gate ──────────────────────────────────────────────────────────────
export default function AccessGate() {
  const { teamVerified } = useApp();
  const [localVerified, setLocalVerified] = useState(teamVerified);

  if (!localVerified) {
    return <TeamCodeScreen onSuccess={() => setLocalVerified(true)} />;
  }

  return <CaptainSelectScreen />;
}
