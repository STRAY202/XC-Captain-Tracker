import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Each slide can reference a DOM element by ID — the tour will scroll to it
// and cut a spotlight hole through the dim overlay so the real UI is visible.
const BUILT_IN_SLIDES = [
  {
    id: 'attendance',
    icon: '✅',
    gradient: 'from-blue-500 to-indigo-600',
    title: 'Mark Your Attendance',
    body: 'Tap any day card once to toggle yourself in or out of practice. It saves instantly.',
    spotlightId: 'tour-day-grid',
  },
  {
    id: 'coverage',
    icon: '🟢',
    gradient: 'from-green-500 to-emerald-600',
    title: 'Coverage Counter',
    body: 'This badge tracks how many days are covered this week. You need 3 to go green.',
    spotlightId: 'tour-coverage',
  },
  {
    id: 'location',
    icon: '📍',
    gradient: 'from-orange-500 to-amber-500',
    title: 'Change Practice Location',
    body: 'Tap Edit on any week, pick a location (Memorial, Cutler Park, or custom), then tap the days to set it.',
    spotlightId: 'tour-edit-btn',
  },
  {
    id: 'colors',
    icon: '🎨',
    gradient: 'from-violet-500 to-purple-600',
    title: 'Location Colors',
    body: 'Green strip = Memorial · Blue = Cutler Park. See where practice is at a glance.',
    spotlightId: 'tour-day-grid',
  },
  {
    id: 'mobile',
    icon: '📱',
    gradient: 'from-pink-500 to-rose-500',
    title: 'Works Everywhere',
    body: 'Add this page to your home screen for one-tap access. Changes sync in real time.',
    spotlightId: null,
  },
];

// ── Spotlight SVG overlay — dims everything except the target element ─────────
function SpotlightOverlay({ spotlightId }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    setRect(null); // clear immediately on slide change

    if (!spotlightId) return;

    const el = document.getElementById(spotlightId);
    if (!el) return;

    // Scroll element into the visible area, then read its position
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const t = setTimeout(() => {
      const r = el.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    }, 420);

    return () => clearTimeout(t);
  }, [spotlightId]);

  const pad = 12;

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
              x={rect.x - pad}
              y={rect.y - pad}
              width={rect.w + pad * 2}
              height={rect.h + pad * 2}
              rx={16}
              fill="black"
            />
          )}
        </mask>
      </defs>

      {/* Dark overlay with the hole cut out */}
      <rect
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.80)"
        mask="url(#onb-mask)"
      />

      {/* Emerald highlight ring around the spotlighted element */}
      {rect && (
        <rect
          x={rect.x - pad}
          y={rect.y - pad}
          width={rect.w + pad * 2}
          height={rect.h + pad * 2}
          rx={16}
          fill="none"
          stroke="#10b981"
          strokeWidth={2.5}
          opacity={0.9}
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
      <SpotlightOverlay spotlightId={current.spotlightId} />

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
