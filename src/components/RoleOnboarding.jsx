import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

const ATHLETE_SLIDES = [
  {
    icon: '🏃',
    title: 'Welcome to XC Tracker',
    body: 'This is your personal hub for summer training. See exactly when and where practices happen — no guessing.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: '📅',
    title: 'Your Practice Schedule',
    body: 'Each week, the three best practice days are automatically selected based on captain availability. Your dashboard shows only your active week.',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    icon: '📍',
    title: 'Times & Locations',
    body: 'Every practice card shows the time, location (Memorial, Cutler, Charles River, or Charles Peninsula), and a live weather forecast.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: '🏋️',
    title: 'Workouts',
    body: 'If your coach has loaded a workout for the day, it appears right on the practice card — no searching for it.',
    gradient: 'from-orange-500 to-rose-500',
  },
];

const CAPTAIN_SLIDES = [
  {
    icon: '⚡',
    title: 'Captain Dashboard',
    body: 'As a captain you control the schedule. Your availability votes directly determine which practices athletes see each week.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: '✅',
    title: 'Mark Your Availability',
    body: 'For each week, tap the days you\'re available. Be honest — athletes are counting on accurate coverage.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '🤖',
    title: 'Auto-Selection',
    body: 'The app automatically picks the top 3 practices based on how many captains are available. Tie-breaker order: Mon → Wed → Fri → Tue → Thu → Sat.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: '📍',
    title: 'Set Location',
    body: 'When you mark a day as available, choose a location: Memorial, Cutler, Charles River, or Charles Peninsula. Athletes see the final synced location.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: '🎯',
    title: 'You\'re In Control',
    body: 'Athletes only see finalized schedules — they never see availability votes. Captains can also edit practice times and cancel days.',
    gradient: 'from-pink-500 to-rose-500',
  },
];

export default function RoleOnboarding({ role, onComplete }) {
  const slides = role === 'captain' ? CAPTAIN_SLIDES : ATHLETE_SLIDES;
  const [step, setStep]       = useState(0);
  const [checked, setChecked] = useState(false);

  const isLast = step === slides.length - 1;
  const slide  = slides[step];

  const handleNext = () => {
    if (isLast) {
      if (checked) onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col">
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

        {/* Checkbox on last slide */}
        {isLast && (
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
            disabled={isLast && !checked}
            className={`flex-1 h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
              isLast && !checked
                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                : isLast
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-white text-gray-900'
            }`}
            style={isLast && checked ? { boxShadow: '0 0 30px rgba(16,185,129,0.4)' } : {}}
          >
            {isLast ? (
              checked ? '🚀 Let\'s Go' : 'Check the box to continue'
            ) : (
              <>Next <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
