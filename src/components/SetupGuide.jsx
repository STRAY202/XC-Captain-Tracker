import { useState } from 'react';
import { Copy, CheckCircle, ExternalLink, Terminal, Database, Key, Rocket } from 'lucide-react';

const ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const ENV_TEMPLATE = ENV_VARS.map(k => `${k}=your-value-here`).join('\n');

const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
    >
      {copied ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {copied ? 'Copied!' : label || 'Copy'}
    </button>
  );
}

const steps = [
  {
    icon: Database,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    title: 'Create a Firebase project',
    content: (
      <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
        <li>
          Go to{' '}
          <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer"
            className="text-blue-600 dark:text-blue-400 underline inline-flex items-center gap-0.5">
            console.firebase.google.com <ExternalLink size={11} />
          </a>
        </li>
        <li>Click <strong>"Add project"</strong> → name it (e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">xc-tracker</code>)</li>
        <li>Disable Google Analytics (optional) → Create project</li>
      </ol>
    ),
  },
  {
    icon: Key,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    title: 'Enable Anonymous Authentication',
    content: (
      <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
        <li>In your project sidebar → <strong>Authentication</strong></li>
        <li>Click <strong>"Get started"</strong></li>
        <li>Under Sign-in providers → click <strong>Anonymous</strong></li>
        <li>Toggle <strong>Enable</strong> → Save</li>
      </ol>
    ),
  },
  {
    icon: Database,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    title: 'Create Firestore Database',
    content: (
      <div className="space-y-3">
        <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
          <li>Sidebar → <strong>Firestore Database</strong> → Create database</li>
          <li>Choose <strong>"Start in production mode"</strong> → select your region → Done</li>
          <li>Go to <strong>Rules</strong> tab and paste these rules:</li>
        </ol>
        <div className="bg-gray-900 rounded-xl p-3 relative">
          <pre className="text-xs text-emerald-400 overflow-x-auto">{FIRESTORE_RULES}</pre>
          <div className="absolute top-2 right-2">
            <CopyButton text={FIRESTORE_RULES} label="Copy rules" />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Click <strong>Publish</strong> after pasting.
        </p>
      </div>
    ),
  },
  {
    icon: Terminal,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    title: 'Get your config keys',
    content: (
      <div className="space-y-3">
        <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
          <li>Sidebar → <strong>Project Settings</strong> (gear icon)</li>
          <li>Scroll to <strong>"Your apps"</strong> → click the Web icon <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">&lt;/&gt;</code></li>
          <li>Register app → copy the <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">firebaseConfig</code> values</li>
        </ol>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Create a <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">.env.local</code> file in your project root:</p>
        <div className="bg-gray-900 rounded-xl p-3 relative">
          <pre className="text-xs text-emerald-400 overflow-x-auto">{ENV_TEMPLATE}</pre>
          <div className="absolute top-2 right-2">
            <CopyButton text={ENV_TEMPLATE} label="Copy template" />
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Rocket,
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    title: 'Deploy to Vercel (optional)',
    content: (
      <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
        <li>Push this repo to GitHub</li>
        <li>Go to{' '}
          <a href="https://vercel.com/new" target="_blank" rel="noreferrer"
            className="text-blue-600 dark:text-blue-400 underline inline-flex items-center gap-0.5">
            vercel.com/new <ExternalLink size={11} />
          </a>{' '}→ import your repo
        </li>
        <li>Add all <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">VITE_FIREBASE_*</code> environment variables in Vercel's settings</li>
        <li>Deploy — done! Share the URL with your team ✅</li>
      </ol>
    ),
  },
];

export default function SetupGuide() {
  const [openStep, setOpenStep] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-950 dark:to-slate-900 p-4 flex flex-col items-center justify-start">
      <div className="w-full max-w-lg animate-fade-in pt-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 mb-4">
            <span className="text-3xl">🏃</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">XC Captain Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-xs mx-auto">
            Firebase isn't configured yet. Follow these steps to get your team tracker live.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
            <Terminal size={12} />
            One-time setup · ~10 minutes
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isOpen = openStep === i;
            return (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
              >
                <button
                  onClick={() => setOpenStep(isOpen ? -1 : i)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${step.bg} flex-shrink-0`}>
                    <Icon size={16} className={step.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Step {i + 1}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{step.title}</p>
                  </div>
                  <span className={`text-xs font-bold transition-transform ${isOpen ? 'rotate-90' : ''} text-gray-400`}>›</span>
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3 animate-fade-in">
                    {step.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
          <strong>After setup:</strong> The app auto-initializes with demo captains and sample data on first load. Team code: <strong>xc2026</strong> · Admin code: <strong>admin2026</strong> (change these in Admin → Settings).
        </div>

      </div>
    </div>
  );
}
