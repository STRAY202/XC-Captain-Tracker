import { useState } from 'react';
import { ArrowRight, Lock, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-teal-500/6 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-emerald-400/5 blur-2xl pointer-events-none" />

      <div className="w-full max-w-xs animate-bounce-in relative z-10">

        {/* Hero mark */}
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-brand shadow-brand-lg flex items-center justify-center">
              <Zap size={36} className="text-white" fill="white" />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-2">
            {settings.teamName}
          </h1>
          <p className="text-emerald-400/80 text-sm font-medium">
            Enter your team access code to continue
          </p>
        </div>

        {/* Glass card */}
        <div className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                autoFocus
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                placeholder="Team access code"
                autoCapitalize="none"
                autoCorrect="off"
                className={`w-full pl-10 pr-4 py-4 rounded-2xl text-base font-semibold focus:outline-none transition-all
                  bg-white/10 border placeholder-white/30 text-white
                  focus:ring-2 focus:ring-emerald-400/60 focus:bg-white/15
                  ${error
                    ? 'border-red-400/60 focus:ring-red-400/40'
                    : 'border-white/20 focus:border-emerald-400/60'
                  }`}
              />
            </div>

            {error && (
              <div className="animate-fade-in bg-red-500/20 border border-red-400/30 rounded-xl px-3.5 py-2.5">
                <p className="text-sm text-red-300 text-center font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!code.trim() || loading}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-brand text-white font-bold text-base shadow-brand-lg hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[56px]"
            >
              {loading ? (
                <span className="animate-pulse">Verifying…</span>
              ) : (
                <>Join Team <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6 font-medium">
          Get the code from your coach or captain
        </p>
      </div>
    </div>
  );
}

// ── Captain selection ──────────────────────────────────────────────────────────
function CaptainSelectScreen() {
  const { captains, dataLoading, syncError, selectCaptain, verifyAdminCode, settings } = useApp();

  const handleAdminLogin = () => {
    const code = window.prompt('Enter admin code:');
    if (!code) return;
    const ok = verifyAdminCode(code.trim());
    if (ok) selectCaptain('admin');
    else window.alert('Wrong admin code.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 pt-safe">
        <div className="max-w-sm mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand flex-shrink-0">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
              {settings.teamName}
            </h1>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
              Select your name to continue
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-6 max-w-sm mx-auto w-full">
        <div className="animate-slide-up">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 text-center">
            Who are you?
          </p>

          {captains.length === 0 ? (
            dataLoading ? (
              /* Still fetching from Supabase */
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-2xl animate-pulse">🏃</span>
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">Loading team…</p>
              </div>
            ) : (
              /* Loaded but empty — Supabase not set up or no captains added yet */
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">No captains found</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                    {syncError
                      ? 'Could not connect to the database. Make sure the Supabase env vars and SQL schema are set up, then reload.'
                      : 'An admin needs to add captains first. Log in as admin below.'}
                  </p>
                </div>
                <button
                  onClick={handleAdminLogin}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-2 active:opacity-70"
                >
                  Log in as admin
                </button>
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[...captains].sort((a, b) => a.name.localeCompare(b.name)).map((captain) => (
                <button
                  key={captain.id}
                  onClick={() => selectCaptain(captain.id)}
                  className="group relative flex flex-col items-center gap-3 p-5 bg-white dark:bg-gray-900 rounded-3xl shadow-card border border-gray-100 dark:border-gray-800 hover:border-transparent hover:shadow-card-lg active:scale-[0.95] transition-all duration-200 select-none min-h-[130px] justify-center"
                  style={{
                    '--cap-color': captain.color,
                  }}
                >
                  {/* Hover glow border */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{
                      boxShadow: `0 0 0 2px ${captain.color}55, 0 8px 30px ${captain.color}22`,
                    }}
                  />

                  {/* Avatar */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-sm transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: captain.color }}
                  >
                    {captain.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100 text-center leading-snug">
                    {captain.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6 font-medium">
            Your selection is remembered for next time
          </p>
        </div>
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
