import { useState } from 'react';
import { ArrowRight, Lock, Zap, User, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

// ── Step 1: Password screen ────────────────────────────────────────────────────
function PasswordScreen({ onAthlete, onCaptain }) {
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyTeamCode, verifyCaptainCode, settings } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    // Check captain code first (more specific)
    if (verifyCaptainCode(code)) {
      setLoading(false);
      onCaptain();
      return;
    }

    // Then team code
    const ok = await verifyTeamCode(code);
    if (ok) {
      setLoading(false);
      onAthlete();
    } else {
      setError('Wrong code — ask your coach or captain.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-teal-500/6 blur-3xl pointer-events-none" />

      <div className="w-full max-w-xs animate-bounce-in relative z-10">
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
            Enter your access code to continue
          </p>
        </div>

        <div className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                autoFocus
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                placeholder="Access code"
                autoCapitalize="none"
                autoCorrect="off"
                className={`w-full pl-10 pr-4 py-4 rounded-2xl text-base font-semibold focus:outline-none transition-all bg-white/10 border placeholder-white/30 text-white focus:ring-2 focus:ring-emerald-400/60 focus:bg-white/15 ${
                  error ? 'border-red-400/60 focus:ring-red-400/40' : 'border-white/20 focus:border-emerald-400/60'
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
              {loading ? <span className="animate-pulse">Checking…</span> : <>Continue <ArrowRight size={18} /></>}
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

// ── Step 2a: Athlete name entry ────────────────────────────────────────────────
function AthleteNameScreen({ onBack }) {
  const [name, setName]   = useState('');
  const [error, setError] = useState('');
  const { selectAthleteMode, settings } = useApp();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    selectAthleteMode(name.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 pt-safe">
        <div className="max-w-sm mx-auto flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-90 transition-all flex-shrink-0">
            <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
              {settings.teamName}
            </h1>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Athlete mode</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-10 max-w-sm mx-auto w-full flex flex-col justify-center">
        <div className="animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
              <User size={28} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">What's your name?</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500">We'll track your attendance and show your schedule</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="Your first name"
              className={`w-full px-4 py-4 rounded-2xl text-base font-semibold focus:outline-none transition-all bg-white dark:bg-gray-900 border shadow-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:ring-2 focus:ring-emerald-400/60 ${
                error ? 'border-red-300 focus:ring-red-400/40' : 'border-gray-200 dark:border-gray-800 focus:border-emerald-400/60'
              }`}
            />

            {error && (
              <p className="text-sm text-red-500 text-center font-medium animate-fade-in">{error}</p>
            )}

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-brand text-white font-bold text-base shadow-brand-lg hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[56px]"
            >
              View My Schedule <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Step 2b: Captain selection ─────────────────────────────────────────────────
function CaptainSelectScreen({ onBack }) {
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
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 pt-safe">
        <div className="max-w-sm mx-auto flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-90 transition-all flex-shrink-0">
            <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
              {settings.teamName}
            </h1>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Captain mode — select your name</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-sm mx-auto w-full">
        <div className="animate-slide-up">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 text-center">
            Who are you?
          </p>

          {captains.length === 0 ? (
            dataLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-2xl animate-pulse">🏃</span>
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">Loading team…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">No captains found</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                    {syncError
                      ? 'Could not connect to the database. Check Supabase env vars and reload.'
                      : 'An admin needs to add captains first. Log in as admin below.'}
                  </p>
                </div>
                <button onClick={handleAdminLogin} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-2 active:opacity-70">
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
                >
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{ boxShadow: `0 0 0 2px ${captain.color}55, 0 8px 30px ${captain.color}22` }}
                  />
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-sm transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: captain.color }}
                  >
                    {captain.name.charAt(0).toUpperCase()}
                  </div>
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

          <button onClick={handleAdminLogin} className="w-full mt-2 text-xs font-semibold text-gray-300 dark:text-gray-600 underline underline-offset-2 active:opacity-70 text-center">
            Admin login
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Combined gate ──────────────────────────────────────────────────────────────
export default function AccessGate() {
  // 'password' | 'athlete' | 'captain'
  const [step, setStep] = useState('password');

  if (step === 'athlete') {
    return <AthleteNameScreen onBack={() => setStep('password')} />;
  }

  if (step === 'captain') {
    return <CaptainSelectScreen onBack={() => setStep('password')} />;
  }

  return (
    <PasswordScreen
      onAthlete={() => setStep('athlete')}
      onCaptain={() => setStep('captain')}
    />
  );
}
