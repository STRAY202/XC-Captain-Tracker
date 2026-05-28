import { fromDateStr } from './dates';

// Tie-break order: Mon > Wed > Tue > Thu > Fri > Sat > Sun
// getDay(): 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
const DOW_PRIORITY = { 1: 0, 3: 1, 2: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

function scoreDays(days, attendance, captains, dayDetails) {
  const duncan = captains.find(c => c.name.toLowerCase() === 'duncan');
  const active = days.filter(d => !dayDetails[d]?.cancelled);
  return active.map(d => ({
    date: d,
    captainCount: captains.filter(c => attendance[d]?.[c.id] === true).length,
    votingCaptains: captains.filter(c => attendance[d]?.[c.id] === true),
    duncanVoted: duncan ? attendance[d]?.[duncan.id] === true : false,
    priority: DOW_PRIORITY[fromDateStr(d).getDay()] ?? 6,
  }));
}

function sortScored(scored) {
  return [...scored].sort((a, b) =>
    b.captainCount - a.captainCount ||
    (b.duncanVoted ? 1 : 0) - (a.duncanVoted ? 1 : 0) ||
    a.priority - b.priority
  );
}

export function selectTopPractices(days, attendance, captains, dayDetails, count = 3) {
  const scored = scoreDays(days, attendance, captains, dayDetails);
  return sortScored(scored)
    .slice(0, count)
    .map(x => x.date)
    .sort();
}

// Returns full per-day detail including selection reason — used for transparency UI
export function getSelectionDetails(days, attendance, captains, dayDetails, count = 3) {
  const scored = scoreDays(days, attendance, captains, dayDetails);
  const sorted = sortScored(scored);
  const selectedDates = new Set(sorted.slice(0, count).map(x => x.date));

  return scored.map(item => {
    const rank = sorted.findIndex(s => s.date === item.date);
    const isSelected = selectedDates.has(item.date);

    // Duncan tiebreaker flag: selected because Duncan voted, when a same-count day is not selected
    let duncanTiebreaker = false;
    if (isSelected && item.duncanVoted) {
      const tiedLosers = scored.filter(s =>
        s.date !== item.date &&
        s.captainCount === item.captainCount &&
        !selectedDates.has(s.date)
      );
      if (tiedLosers.some(t => !t.duncanVoted)) duncanTiebreaker = true;
    }

    return { ...item, rank, isSelected, duncanTiebreaker };
  });
}
