# 🏃 XC Captain Tracker

A clean, mobile-first summer attendance/scheduling tracker for high school cross country & track captains.

## Features

- **One-tap sign-in** — tap your name once, it's remembered for next visit
- **Weekly schedule view** — starting June 15, 2026 (Mon–Fri)
- **Coverage indicators** — 🟢 green = week covered, 🔴 red = needs more captains
- **Dashboard summary** — this week's covered days, missing days, top captain
- **Attendance bar chart** — see everyone's commitment at a glance
- **Admin panel** — add/remove captains, change practice times, cancel/optional days
- **Dark mode** toggle
- **Auto-save** via localStorage — no backend needed
- **Mobile-first** — large tap targets, thumb-friendly layout

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deploy

### Netlify (recommended — free)
1. `npm run build`
2. Drag & drop the `dist/` folder to [netlify.com/drop](https://app.netlify.com/drop)

### Vercel
```bash
npm i -g vercel && vercel
```

### GitHub Pages
Set `base: '/your-repo-name/'` in `vite.config.js`, then `npm run build` and push `dist/` to the `gh-pages` branch.

## How to Use

1. Open the app → tap your name from the list
2. Tap any day button to toggle your attendance (emerald = you're going)
3. The number on each day shows how many captains are committed
4. Weeks turn **green** when ≥3 days are covered, **red** when not
5. Tap ⚙️ gear icon to open the Admin panel

## Admin Features

- Add/remove captains and change their display color
- Change the default practice time
- Set per-day overrides: cancel a practice or mark it optional
- Adjust minimum coverage thresholds

## Tech Stack

- React 18 + Vite
- Tailwind CSS 3
- Lucide React icons
- localStorage (no backend required)

## Customization

Edit defaults in `src/hooks/useStore.js`:

```js
const DEFAULT_STATE = {
  captains: [...],       // Add your real captain names here
  settings: {
    teamName: 'XC Summer Training',
    startDate: '2026-06-15',
    numWeeks: 11,
    defaultTime: '8:00 AM',
    practiceDays: [0,1,2,3,4],  // 0=Mon through 4=Fri
    minCoveredDays: 3,
    minCaptainsPerDay: 1,
  }
}
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
