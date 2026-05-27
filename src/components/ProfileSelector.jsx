import { useState } from 'react';
import { UserCheck, Shield, ChevronRight } from 'lucide-react';

export default function ProfileSelector({ captains, onSelect, teamName }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 mb-4">
            <span className="text-3xl">🏃</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{teamName}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Who are you?</p>
        </div>

        {/* Captain chips */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-3">
          {captains.map((captain, idx) => (
            <button
              key={captain.id}
              onClick={() => onSelect(captain.id)}
              onMouseEnter={() => setHoveredId(captain.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-150
                ${idx > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}
                ${hoveredId === captain.id
                  ? 'bg-gray-50 dark:bg-gray-800/60'
                  : 'bg-white dark:bg-gray-900'}
                active:bg-gray-100 dark:active:bg-gray-800
              `}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm"
                style={{ backgroundColor: captain.color }}
              >
                {captain.name.charAt(0).toUpperCase()}
              </div>
              {/* Name */}
              <span className="flex-1 text-left font-medium text-gray-800 dark:text-gray-100">
                {captain.name}
              </span>
              {/* Dot + Arrow */}
              <div className="flex items-center gap-1">
                <UserCheck size={14} className="text-gray-400" />
                <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
              </div>
            </button>
          ))}
        </div>

        {/* Admin button */}
        <button
          onClick={() => onSelect('admin')}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-150 active:bg-gray-100 dark:active:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            <Shield size={16} className="text-gray-500 dark:text-gray-400" />
          </div>
          <span className="flex-1 text-left font-medium text-gray-500 dark:text-gray-400">
            Admin
          </span>
          <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
        </button>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Your name is remembered for next time
        </p>
      </div>
    </div>
  );
}
