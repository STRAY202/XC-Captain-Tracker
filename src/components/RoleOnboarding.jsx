import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ATHLETE_SLIDES = [
  {
    id: 'a1',
    icon: '🏃',
    title: 'Welcome to XC Tracker',
    body: 'Your personal hub for summer training. See exactly when and where practices happen.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'a2',
    icon: '📅',
    title: 'Your Practice Schedule',
    body: 'Three best practice days are auto-selected each week based on captain availability. Your dashboard shows only the active week.',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'a3',
    icon: '📍',
    title: 'Times & Locations',
    body: 'Every practice card shows the time, location (Memorial, Cutler, or Charles River Peninsula), and a live weather forecast.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'a4',
    icon: '🏋️',
    title: 'Workouts',
    body: "If your coach has loaded a workout for the day, it appears right on the practice card.",
    gradient: 'from-orange-500 to-rose-500',
  },
];

const CAPTAIN_SLIDES = [
  {
    id: 'c1',
    icon: '⚡',
    title: 'Captain Dashboard',
    body: 'As a captain, your availability votes determine which practices athletes see each week.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'c2',
    icon: '✅',
    title: 'Mark Your Availability',
    body: "For each week, tap the days you're available in the Hub tab. Athletes count on accurate coverage.",
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'c3',
    icon: '🤖',
    title: 'Auto-Selection',
    body: 'The app automatically picks the top 3 practices by captain count. Tie-breaker: Mon → Wed → Fri → Tue → Thu → Sat.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'c4',
    icon: '📍',
    title: 'Set Location',
    body: 'When you mark a day available, choose a location: Memorial, Cutler, or Charles River Peninsula. Athletes see the final synced location.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'c5',
    icon: '🎯',
    title: "You're In Control",
    body: "Athletes only see finalized schedules. Use the Hub tab to vote on availability and Settings to manage the season.",
    gradient: 'from-pink-500 to-rose-500',
  },
];

export default function RoleOnboarding({ role, onComplete, isReplay = false }) {
  const { settings } = useApp();

  // Use settings-based slides if available and non-empty, else fall back to defaults
  const defaultSlides = role === 'captain' ? CAPTAIN_SLIDES : ATHLETE_SLIDES;
  const settingsSlides = role === 'captain'
    ? settings?.onboarding?.captainSlides
    : settings?.onboarding?.athleteSlides;
  const slides = (Array.isArray(settingsSlides) && settingsSlides.length > 0)
    ? settingsSlides
    : defaultSlides;

  const [step, setStep]       = useState(0);
  const [checked, setChecked] = useState(false);

  const isLast = step === slides.length - 1;
  const slide  = slides[step];

  const handleNext = () => {
    if (isLast) {
      if (isReplay || checked) onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col">
      {/* Close button for replay mode */}
      {isReplay && (
        <div className="absolute top-4 right-4 pt-safe z-10">
          <button
            onClick={onComplete}
            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 border border-white/15"
          >
            <X size={18} className="text-white/70" />
          </button>
        </div>
      )}

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Icon */}
        <div
          className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-8 shadow-2xl`}
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        >
          <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{slide.icon}</span>
        </div>

        {/* Text */}
        <h1 className="text-2xl font-black text-white text-center leading-tight mb-4 max-w-xs">
          {slide.title}
        </h1>
        <p className="text-base text-white/55 text-center leading-relaxed max-w-xs">
          {slide.body}
        </p>

        {/* Checkbox on last slide (non-replay only) */}
        {isLast && !isReplay && (
          <button
            onClick={() => setChecked(c => !c)}
            className={`mt-8 flex items-center gap-3 px-5 py-4 rounded-2xl border-2 transition-all active:scale-[0.97] ${
              checked
                ? 'border-emerald-500 bg-emerald-500/15'
                : 'border-white/20 bg-white/5'
            }`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
              checked ? 'bg-emerald-500' : 'bg-white/10 border border-white/30'
            }`}>
              {checked && <Check size={14} className="text-white" strokeWidth={3} />}
            </div>
            <span className={`text-sm font-semibold transition-colors ${
              checked ? 'text-emerald-300' : 'text-white/60'
            }`}>
              I understand how to use XC Captain Tracker
            </span>
          </button>
        )}
      </div>

      {/* Bottom nav */}
      <div className="px-6 pb-12 pb-safe">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width:           i === step ? 24 : 7,
                height:          7,
                backgroundColor: i <= step ? '#10b981' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        {/* Nav buttons */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="w-12 h-14 rounded-2xl bg-white/8 flex items-center justify-center border border-white/10 active:scale-95 transition-all"
            >
              <ChevronLeft size={20} className="text-white/60" />
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isLast && !isReplay && !checked}
            className={`flex-1 h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
              isLast && !isReplay && !checked
                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                : isLast
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-white text-gray-900'
            }`}
            style={isLast && (isReplay || checked) ? { boxShadow: '0 0 30px rgba(16,185,129,0.4)' } : {}}
          >
            {isLast ? (
              isReplay
                ? 'Close'
                : checked
                ? '🚀 Let\'s Go'
                : 'Check the box to continue'
            ) : (
              <>Next <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
