import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Each slide can reference a DOM element by ID — the tour will scroll to it
// and cut a spotlight hole through the dim overlay so the real UI is visible.
const BUILT_IN_SLIDES = [
  {
    id: 'hero',
    icon: '📊',
    gradient: 'from-emerald-500 to-teal-600',
    title: 'Week Overview',
    body: 'Shows days covered this week. You need 3 of 6 — anything more is a bonus. Red bars = uncovered, green = covered.',
    spotlightId: 'tour-dashboard-hero',
    spotlightPad: 5,
    spotlightRx: 26,
  },
  {
    id: 'stats',
    icon: '🏆',
    gradient: 'from-violet-500 to-purple-600',
    title: 'Season Stats',
    body: 'Missing = days still needed this week. Top = most active captain. Season = total days covered all summer.',
    spotlightId: 'tour-stats',
    spotlightPad: 6,
    spotlightRx: 20,
  },
  {
    id: 'legend',
    icon: '🔑',
    gradient: 'from-slate-500 to-gray-600',
    title: 'Card Key',
    body: 'Solid green = you\'re attending · Emerald border = day is covered · Plain border = still open.',
    spotlightId: 'tour-legend',
  },
  {
    id: 'attendance',
    icon: '✅',
    gradient: 'from-blue-500 to-indigo-600',
    title: 'Mark Attendance',
    body: 'Tap any day card to toggle yourself in or out. Saves instantly — no confirm needed.',
    spotlightId: 'tour-day-grid',
  },
  {
    id: 'coverage',
    icon: '🟢',
    gradient: 'from-green-500 to-emerald-600',
    title: 'Coverage Badge',
    body: 'The X/3 badge turns green once 3 days are covered. Going above 3 is encouraged.',
    spotlightId: 'tour-coverage',
  },
  {
    id: 'location',
    icon: '📍',
    gradient: 'from-orange-500 to-amber-500',
    title: 'Set Practice Location',
    body: 'Tap Edit, choose Memorial (green), Cutler Park (blue), or type a custom spot — then tap the days to apply.',
    spotlightId: 'tour-edit-btn',
  },
  {
    id: 'mobile',
    icon: '📱',
    gradient: 'from-pink-500 to-rose-500',
    title: 'Works Everywhere',
    body: 'Add this to your home screen for one-tap access. All changes sync in real time.',
    spotlightId: null,
  },
];

// ── Spotlight SVG overlay — dims everything except the target element ─────────
function SpotlightOverlay({ spotlightId, pad = 12, rx = 18 }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    setRect(null);
    if (!spotlightId) return;

    const el = document.getElementById(spotlightId);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const t = setTimeout(() => {
      const r = el.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    }, 420);

    return () => clearTimeout(t);
  }, [spotlightId]);

  return (
    <svg
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 58, width: '100vw', height: '100vh' }}
    >
      <defs>
        <mask id="onb-mask">
          <rect width="100%" height="100%" fill="white" />
          {rect && (
            <rect
              x={rect.x - pad} y={rect.y - pad}
              width={rect.w + pad * 2} height={rect.h + pad * 2}
              rx={rx} fill="black"
            />
          )}
        </mask>
      </defs>

      <rect width="100%" height="100%" fill="rgba(0,0,0,0.82)" mask="url(#onb-mask)" />

      {rect && (
        <rect
          x={rect.x - pad} y={rect.y - pad}
          width={rect.w + pad * 2} height={rect.h + pad * 2}
          rx={rx} fill="none"
          stroke="#10b981" strokeWidth={2.5} opacity={0.9}
        />
      )}
    </svg>
  );
}

// ── Main onboarding component ─────────────────────────────────────────────────
export default function OnboardingFlow({ onComplete, isHelp = false }) {
  const { settings, markOnboardingDone } = useApp();

  const customSlides = settings?.onboarding?.slides;
  const slides = customSlides?.length ? customSlides : BUILT_IN_SLIDES;

  const [step, setStep] = useState(0);
  const current = slides[step];
  const isLast  = step === slides.length - 1;

  function goTo(i) { setStep(i); }
  function handleNext() { isLast ? handleComplete() : goTo(step + 1); }
  function handleBack() { if (step > 0) goTo(step - 1); }
  function handleComplete() {
    if (!isHelp) markOnboardingDone();
    onComplete?.();
  }

  const slideTitle = step === 0 && settings?.onboarding?.welcomeTitle
    ? settings.onboarding.welcomeTitle : current.title;
  const slideBody  = step === 0 && settings?.onboarding?.welcomeSubtitle
    ? settings.onboarding.welcomeSubtitle : current.body;

  return (
    <div className="fixed inset-0" style={{ zIndex: 57 }}>

      {/* SVG spotlight overlay (pointer-events: none — purely visual) */}
      <SpotlightOverlay
        spotlightId={current.spotlightId}
        pad={current.spotlightPad ?? 12}
        rx={current.spotlightRx ?? 18}
      />

      {/* Tap-anywhere-to-advance layer (covers full screen, below the card) */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 59 }}
        onClick={handleNext}
      />

      {/* Bottom slide card */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-gray-950"
        style={{ zIndex: 60, boxShadow: '0 -8px 48px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pt-4 pb-10">

          {/* Icon + title row */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${current.gradient || 'from-emerald-500 to-teal-600'} flex items-center justify-center flex-shrink-0`}
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.45)' }}
            >
              <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{current.icon || '⭐'}</span>
            </div>
            <h2 className="flex-1 text-lg font-black text-white leading-tight">{slideTitle}</h2>
            <button
              onClick={handleComplete}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 active:bg-white/20 transition-colors"
            >
              <X size={14} className="text-white/50" />
            </button>
          </div>

          <p className="text-sm text-white/55 leading-relaxed mb-5">{slideBody}</p>

          {/* Progress bar + nav */}
          <div className="flex items-center gap-3">

            <button
              onClick={handleBack}
              className={`w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center active:scale-90 transition-all border border-white/10 ${
                step === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-white/15'
              }`}
            >
              <ChevronLeft size={18} className="text-white/70" />
            </button>

            {/* Progress dots */}
            <div className="flex-1 flex gap-1.5 justify-center">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="rounded-full transition-all duration-300 active:scale-90"
                  style={{
                    width:           i === step ? '24px' : '7px',
                    height:          '7px',
                    backgroundColor: i <= step
                      ? '#10b981'
                      : 'rgba(255,255,255,0.18)',
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className={`px-5 h-10 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all active:scale-95 ${
                isLast
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
              style={isLast ? { boxShadow: '0 4px 20px rgba(16,185,129,0.45)' } : { boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
            >
              {isLast
                ? (isHelp ? '✓ Got it' : '🚀 Start')
                : <>Next <ChevronRight size={15} /></>
              }
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
