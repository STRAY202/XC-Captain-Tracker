/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
        'gradient-hero':  'linear-gradient(160deg, #0a1628 0%, #0f2d1a 60%, #064e3b 100%)',
      },
      boxShadow: {
        'brand':    '0 4px 14px 0 rgba(16,185,129,0.35)',
        'brand-lg': '0 8px 30px 0 rgba(16,185,129,0.30)',
        'card':     '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        'card-lg':  '0 4px 6px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.10)',
        'inner-sm': 'inset 0 1px 2px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
        'bounce-in':  'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        'sheet-up':   'sheetUp 0.35s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        bounceIn:  { '0%': { transform: 'scale(0.82)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        scaleIn:   { '0%': { transform: 'scale(0.94)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        sheetUp:   { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
