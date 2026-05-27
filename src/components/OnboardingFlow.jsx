import { useState } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const BUILT_IN_SLIDES = [
  {
    id: 'welcome',
    icon: '⚡',
    gradient: 'from-emerald-500 to-teal-600',
    title: 'Welcome to the Team!',
    body: 'Your captain scheduling hub — simple, fast, and built for your whole team.',
  },
  {
    id: 'attendance',
    icon: '✅',
    gradient: 'from-blue-500 to-indigo-600',
    title: 'Mark Your Attendance',
    body: 'Tap any day button on the schedule to toggle yourself in or out. Done in one tap.',
  },
  {
    id: 'coverage',
    icon: '🟢',
    gradient: 'from-green-500 to-emerald-600',
    title: 'Green = Covered',
    body: 'A green week means enough captains are attending. Red means the week needs more coverage.',
  },
  {
    id: 'workouts',
    icon: '🏃',
    gradient: 'from-orange-500 to-amber-500',
    title: 'View Workouts',
    body: 'Tap any day to see the workout type, meeting time, location, and notes from your coach.',
  },
  {
    id: 'edit',
    icon: '⚙️',
    gradient: 'from-violet-500 to-purple-600',
    title: 'Quick Admin Edits',
    body: 'Admins can update workout details, cancel practices, and manage the roster from Settings.',
  },
  {
    id: 'mobile',
    icon: '📱',
    gradient: 'from-pink-500 to-rose-500',
    title: 'Works on Any Device',
    body: 'Add this page to your home screen for instant one-tap access. Changes sync in real time.',
  },
];

export default function OnboardingFlow({ onComplete, isHelp = false }) {
  const { settings, markOnboardingDone } = useApp();

  const customSlides = settings?.onboarding?.slides;
  const slides = customSlides?.length ? customSlides : BUILT_IN_SLIDES;

  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  const total = slides.length;
  const current = slides[step];
  const isLast = step === total - 1;

  function goTo(nextStep) {
    if (nextStep === step) return;
    setVisible(false);
    setTimeout(() => {
      setStep(nextStep);
      setVisible(true);
    }, 170);
  }

  function handleNext() {
    if (isLast) handleComplete();
    else goTo(step + 1);
  }

  function handleBack() {
    if (step > 0) goTo(step - 1);
  }

  function handleComplete() {
    if (!isHelp) markOnboardingDone();
    onComplete?.();
  }

  // First slide uses admin-customized title/body if set
  const slideTitle = step === 0 && settings?.onboarding?.welcomeTitle
    ? settings.onboarding.welcomeTitle
    : current.title;
  const slideBody = step === 0 && settings?.onboarding?.welcomeSubtitle
    ? settings.onboarding.welcomeSubtitle
    : current.body;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-950 animate-fade-in">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-2 flex-shrink-0">
        <span className="text-xs font-bold text-white/25 tabular-nums">
          {step + 1} / {total}
        </span>
        <button
          onClick={handleComplete}
          className="flex items-center gap-1.5 text-xs font-semibold text-white/35 hover:text-white/60 transition-colors py-2 px-3 rounded-xl hover:bg-white/8 active:scale-95"
        >
          {isHelp
            ? <><X size={13} /> Close</>
            : 'Skip'
          }
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
        <div
          style={{
            transition: 'opacity 170ms ease, transform 170ms ease',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0px)' : 'translateY(14px)',
          }}
          className="w-full max-w-xs text-center"
        >
          {/* Icon card */}
          <div className="flex justify-center mb-8">
            <div
              className={`w-32 h-32 rounded-[2.5rem] bg-gradient-to-br ${current.gradient || 'from-emerald-500 to-teal-600'} flex items-center justify-center`}
              style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)' }}
            >
              <span style={{ fontSize: '3.8rem', lineHeight: 1 }}>{current.icon || '⭐'}</span>
            </div>
          </div>

          {/* Text */}
          <h2 className="text-[1.6rem] font-black text-white mb-3 leading-tight tracking-tight">
            {slideTitle}
          </h2>
          <p className="text-[1rem] text-white/50 leading-relaxed font-medium">
            {slideBody}
          </p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex-shrink-0 px-6 pb-safe pb-8 pt-5">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-7">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300 active:scale-90"
              style={{
                width: i === step ? '28px' : '8px',
                height: '8px',
                backgroundColor: i === step
                  ? '#10b981'
                  : i < step
                    ? 'rgba(16,185,129,0.35)'
                    : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="w-14 h-14 rounded-2xl bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors active:scale-95 flex-shrink-0 border border-white/10"
            >
              <ChevronLeft size={22} className="text-white/70" />
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 h-14 rounded-2xl font-black text-base transition-all active:scale-[0.97] flex items-center justify-center gap-2 ${
              isLast
                ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            }`}
            style={isLast ? { boxShadow: '0 8px 32px rgba(16,185,129,0.45)' } : { boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
          >
            {isLast
              ? (isHelp ? '✓ Got it!' : '🚀 Get Started')
              : <>Next <ChevronRight size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
