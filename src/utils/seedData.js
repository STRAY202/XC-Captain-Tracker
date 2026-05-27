import { addDays } from './dates';

const CAPTAIN_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899',
];

// Alphabetical: Austin, Cash, Duncan, Harrison
const DEFAULT_CAPTAINS = [
  { id: 'cap_austin',   name: 'Austin',   color: CAPTAIN_COLORS[0] },
  { id: 'cap_cash',     name: 'Cash',     color: CAPTAIN_COLORS[1] },
  { id: 'cap_duncan',   name: 'Duncan',   color: CAPTAIN_COLORS[2] },
  { id: 'cap_harrison', name: 'Harrison', color: CAPTAIN_COLORS[3] },
];

// Workout rotation for Mon–Fri
const WEEK_WORKOUTS = [
  { workoutType: 'long_run',  location: 'Riverside Park',    notes: 'Meet at the main trailhead. 8–10 miles steady.' },
  { workoutType: 'easy',      location: 'School Track',      notes: 'Easy effort, focus on form. ~5 miles.' },
  { workoutType: 'workout',   location: 'School Track',      notes: '4×1200m @ 5k pace w/ 3 min rest.' },
  { workoutType: 'recovery',  location: 'Neighborhood Loop', notes: 'Very easy effort. 4–5 miles max.' },
  { workoutType: 'tempo',     location: 'Park Loop',         notes: '20 min tempo. Warm-up + cool-down included.' },
];

// Alternate workouts for variety in week 2
const WEEK2_WORKOUTS = [
  { workoutType: 'hills',         location: 'Memorial Hill',     notes: '8× hill repeats, jog back down.' },
  { workoutType: 'easy',          location: 'Neighborhood Loop', notes: 'Easy shakeout. 4–6 miles.' },
  { workoutType: 'track',         location: 'School Track',      notes: '400m repeats: 10–12× @ mile pace.' },
  { workoutType: 'cross_training',location: 'Pool / Gym',        notes: 'Pool running or bike for 45 min. Optional.' },
  { workoutType: 'fartlek',       location: 'Park',              notes: '30 min fartlek — 1 min hard / 2 min easy.' },
];

/**
 * Generates seed data relative to startDate (schedule start).
 * Adds two full weeks of day details and realistic attendance spread.
 */
export function generateSeedData(startDate = '2026-06-15') {
  const captains = DEFAULT_CAPTAINS;
  const dayDetails = {};
  const attendance = {};

  // Build day list for first 2 weeks (10 days)
  const allDays = [];
  for (let w = 0; w < 2; w++) {
    for (let d = 0; d < 5; d++) {
      allDays.push({ offset: w * 7 + d, weekIdx: w, dayIdx: d });
    }
  }

  // Week 3: add a team event on Monday
  allDays.push({ offset: 14, weekIdx: 2, dayIdx: 0, override: {
    workoutType: 'team_event', location: "Coach's House", notes: 'Summer kickoff BBQ! Attendance mandatory for all captains 🎉'
  }});

  // Attendance patterns — who shows up on which days
  // Each day: pick 1–4 captains from the roster
  const patterns = [
    ['cap_austin', 'cap_cash'],
    ['cap_cash', 'cap_duncan', 'cap_harrison'],
    ['cap_austin', 'cap_duncan'],
    ['cap_harrison'],
    ['cap_austin', 'cap_cash', 'cap_harrison'],
    ['cap_duncan', 'cap_harrison', 'cap_cash'],
    ['cap_austin', 'cap_cash'],
    ['cap_harrison', 'cap_duncan'],
    ['cap_austin', 'cap_cash', 'cap_duncan', 'cap_harrison'],
    ['cap_cash', 'cap_harrison', 'cap_austin'],
  ];

  for (const { offset, weekIdx, dayIdx, override } of allDays) {
    const dateStr = addDays(startDate, offset);
    const workouts = weekIdx === 0 ? WEEK_WORKOUTS : WEEK2_WORKOUTS;
    const workout = override || workouts[dayIdx % workouts.length];

    dayDetails[dateStr] = {
      workoutType: workout.workoutType,
      location:    workout.location,
      notes:       workout.notes,
      cancelled:   false,
      optional:    false,
    };

    const pattern = patterns[offset % patterns.length];
    const attendanceDoc = {};
    for (const cid of pattern) {
      attendanceDoc[cid] = true;
    }
    attendance[dateStr] = attendanceDoc;
  }

  // Add a cancelled day in week 2 (Thursday)
  const cancelledDay = addDays(startDate, 10);
  dayDetails[cancelledDay] = {
    workoutType: 'recovery',
    location:    '',
    notes:       'Practice cancelled — field maintenance.',
    cancelled:   true,
    optional:    false,
  };

  // Add an optional day
  const optionalDay = addDays(startDate, 11);
  if (dayDetails[optionalDay]) {
    dayDetails[optionalDay].optional = true;
    dayDetails[optionalDay].notes = 'Optional shakeout run. No pressure!';
  }

  return { captains, dayDetails, attendance };
}

export { DEFAULT_CAPTAINS, CAPTAIN_COLORS };
