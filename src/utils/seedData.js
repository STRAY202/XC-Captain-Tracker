import { addDays } from './dates';

const CAPTAIN_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899',
];

const DEFAULT_CAPTAINS = [
  { id: 'cap_austin',   name: 'Austin',   color: CAPTAIN_COLORS[0] },
  { id: 'cap_cash',     name: 'Cash',     color: CAPTAIN_COLORS[1] },
  { id: 'cap_duncan',   name: 'Duncan',   color: CAPTAIN_COLORS[2] },
  { id: 'cap_harrison', name: 'Harrison', color: CAPTAIN_COLORS[3] },
];

export function generateSeedData(startDate = '2026-06-15') {
  const captains = DEFAULT_CAPTAINS;
  const dayDetails = {};
  const attendance = {};

  const WEEK1_LOCATIONS = ['Memorial', 'Cutler Park', 'Memorial', 'Cutler Park', 'Memorial'];
  const WEEK2_LOCATIONS = ['Cutler Park', 'Memorial', 'Cutler Park', 'Memorial', 'Cutler Park'];

  for (let w = 0; w < 2; w++) {
    for (let d = 0; d < 5; d++) {
      const offset = w * 7 + d;
      const dateStr = addDays(startDate, offset);
      const locations = w === 0 ? WEEK1_LOCATIONS : WEEK2_LOCATIONS;
      dayDetails[dateStr] = { location: locations[d] };
    }
  }

  const cancelledDay = addDays(startDate, 10);
  dayDetails[cancelledDay] = { cancelled: true };

  return { captains, dayDetails, attendance };
}

export { DEFAULT_CAPTAINS, CAPTAIN_COLORS };
