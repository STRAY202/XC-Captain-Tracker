# Supabase Setup Guide

## Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New project**, choose an organisation, give it a name (e.g. `xc-captain-tracker`), set a strong database password, and pick a region close to your users.
3. Wait ~2 minutes for the project to provision.

## Step 2 — Get Your API Keys

1. In your project dashboard, go to **Project Settings → API**.
2. Copy:
   - **Project URL** → this is your `VITE_SUPABASE_URL`
   - **anon / public** key → this is your `VITE_SUPABASE_ANON_KEY`

## Step 3 — Run the SQL Schema

1. In your project dashboard, go to **SQL Editor**.
2. Paste the entire SQL block below and click **Run**.

```sql
-- Run this entire block in Supabase SQL Editor

-- Settings (one row for the whole team)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  team_name TEXT NOT NULL DEFAULT 'XC Summer Training',
  start_date TEXT NOT NULL DEFAULT '2026-06-15',
  num_weeks INTEGER NOT NULL DEFAULT 11,
  default_time TEXT DEFAULT '8:00 AM',
  practice_days INTEGER[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5],
  min_covered_days INTEGER NOT NULL DEFAULT 3,
  min_captains_per_day INTEGER NOT NULL DEFAULT 1,
  team_code TEXT NOT NULL DEFAULT 'xc2026',
  admin_code TEXT NOT NULL DEFAULT 'admin2026',
  announcements JSONB NOT NULL DEFAULT '[]'::jsonb,
  onboarding JSONB NOT NULL DEFAULT '{"welcomeTitle":"","welcomeSubtitle":"","slides":[]}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- Captains
CREATE TABLE IF NOT EXISTS captains (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance (one row per captain per practice day)
CREATE TABLE IF NOT EXISTS attendance (
  date TEXT NOT NULL,
  captain_id TEXT NOT NULL,
  attending BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (date, captain_id)
);

-- Day details (location, cancellation, notes per day)
CREATE TABLE IF NOT EXISTS day_details (
  date TEXT PRIMARY KEY,
  location TEXT,
  cancelled BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE captains ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_details ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (app enforces its own team/admin codes)
CREATE POLICY "anon_all" ON settings    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON captains    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON attendance  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON day_details FOR ALL TO anon USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
ALTER PUBLICATION supabase_realtime ADD TABLE captains;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE day_details;
```

## Step 4 — Set Environment Variables

### Local development

Copy `.env.example` to `.env.local` and fill in your values:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Vercel deployment

1. Go to your Vercel project → **Settings → Environment Variables**.
2. Add two variables:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key
3. Redeploy the project for the variables to take effect.

## Notes

- The app seeds default settings and captains automatically the first time it connects to an empty database.
- Row Level Security is enabled but uses permissive anonymous policies — the app enforces access control via team code and admin code stored in the `settings` table.
- Realtime is enabled for all four tables so changes made by any user are reflected live across all connected devices.
- The `firebase.js` file can be deleted once you have confirmed the migration is complete — nothing imports it any more.
