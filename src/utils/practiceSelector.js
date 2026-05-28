import { fromDateStr } from './dates';

// Tie-break: Mon > Wed > Fri > Tue > Thu > Sat > Sun
// getDay(): 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
const DOW_PRIORITY = { 1: 0, 3: 1, 5: 2, 2: 3, 4: 4, 6: 5, 0: 6 };

export function selectTopPractices(days, attendance, captains, dayDetails, count = 3) {
  const active = days.filter(d => !dayDetails[d]?.cancelled);
  return active
    .map(d => ({
      date: d,
      captainCount: captains.filter(c => attendance[d]?.[c.id] === true).length,
      priority: DOW_PRIORITY[fromDateStr(d).getDay()] ?? 6,
    }))
    .sort((a, b) => b.captainCount - a.captainCount || a.priority - b.priority)
    .slice(0, count)
    .map(x => x.date)
    .sort();
}
