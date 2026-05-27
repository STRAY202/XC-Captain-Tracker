# 🏃 XC Captain Tracker

A **real-time, mobile-first** summer attendance/scheduling tracker for high school cross country & track captains — powered by Firebase for live sync across all devices.

## Features

- 🔴 **Live sync via Firebase Firestore** — all devices update instantly
- 🔐 **Team access code** — prevents outsiders from editing your schedule
- 👆 **One-tap attendance** — tap your name once, then tap days to commit
- 📅 **Weekly schedule cards** starting June 15, 2026 (Mon–Fri, 11 weeks)
- 🟢🟡🔴 **Coverage indicators** — green/yellow/red by week coverage status
- 🏃 **Workout types** — Long Run, Tempo, Hill Workout, Track, Team Event & more
- 📍 **Day details** — notes, meeting location, custom time per practice
- 📊 **Dashboard** — covered days, missing coverage, top captain, upcoming gaps
- ⚙️ **Full admin panel** — manage everything from the UI, no code edits needed
- 🌙 **Dark mode** toggle
- 📱 **PWA-ready** — add to Home Screen on iOS/Android

---

## 🚀 Setup Guide (~10 minutes)

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → name it (e.g. `xc-tracker`) → Create
3. Enable **Google Analytics** is optional

### 2. Enable Anonymous Authentication

1. Sidebar → **Authentication** → Get started
2. Sign-in providers → **Anonymous** → Enable → Save

### 3. Create Firestore Database

1. Sidebar → **Firestore Database** → Create database
2. Choose **"Start in production mode"** → pick a region → Done
3. Go to **Rules** tab → paste these rules → **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Get your config & create `.env.local`

1. Sidebar → **Project Settings** (gear) → Your apps → Web app `</>`
2. Register app → copy the `firebaseConfig` values
3. Create `.env.local` in your project root:

```bash
cp .env.example .env.local
# Then fill in your Firebase values
```

### 5. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Default credentials (change these in Admin → Access Codes):**
- Team code: `xc2026`
- Admin code: `admin2026`

---

## 🌐 Deploy to Vercel (Recommended)

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → import the repo
3. Add all `VITE_FIREBASE_*` environment variables in Vercel's dashboard:
   - Project → Settings → Environment Variables
4. Deploy → share the URL with your team ✅

The app auto-detects if Firebase isn't configured and shows a step-by-step setup guide.

---

## 📱 How to Use

1. Open the app → enter team access code
2. Tap your name from the captain list (remembered for future visits)
3. **Tap any day button** to toggle your attendance
   - Number shows captain count for that day
   - Workout emoji shows the planned practice type
4. Tap the **ℹ️ info button** on any day to see full details (workout, location, notes)
5. Weeks turn **green** ≥3 covered / **yellow** partially covered / **red** uncovered
6. Tap ⚙️ gear to open Admin panel (requires admin code)

---

## ⚙️ Admin Panel Features

Everything is manageable from the UI — no code edits needed:

| Section | What you can do |
|---|---|
| **Team Settings** | Team name, start date, week count, practice days, default time |
| **Coverage Rules** | Min covered days/week, min captains/day |
| **Access Codes** | Change team code and admin code |
| **Captains** | Add/remove captains, rename, change colors |
| **Edit Practice Day** | Set workout type, location, notes, custom time per day |
| **Day Status** | Cancel a practice, mark optional |

---

## 🏋️ Workout Types

Long Run · Easy Run · Workout · Recovery Run · Hill Workout · Tempo Run · Track Workout · Fartlek · Cross Training · Time Trial · Team Event

---

## 🔴 Real-Time Sync

All attendance changes sync **live across all devices** via Firestore:
- Captain A marks Monday on their phone → Captain B sees it update within ~1 second
- Works offline too — changes queue locally and sync when reconnected

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Database | Firebase Firestore (real-time) |
| Auth | Firebase Anonymous Auth |
| Deploy | Vercel (recommended) |

---

## Default Configuration

All defaults live in `src/context/AppContext.jsx`:

```js
const DEFAULT_SETTINGS = {
  teamName:          'XC Summer Training',
  startDate:         '2026-06-15',
  numWeeks:          11,
  defaultTime:       '8:00 AM',
  practiceDays:      [0, 1, 2, 3, 4],  // 0=Mon … 4=Fri
  minCoveredDays:    3,
  minCaptainsPerDay: 1,
  teamCode:          'xc2026',     // change in Admin UI after setup
  adminCode:         'admin2026',  // change in Admin UI after setup
};
```

Demo captains and realistic attendance data are seeded automatically on first run.
