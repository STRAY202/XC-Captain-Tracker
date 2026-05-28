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

export function generateSeedData() {
  return {
    captains:   DEFAULT_CAPTAINS,
    dayDetails: {},
    attendance: {},
  };
}

export { DEFAULT_CAPTAINS, CAPTAIN_COLORS };
