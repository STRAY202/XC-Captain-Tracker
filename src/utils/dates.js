// Date utilities for the schedule tracker

export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date object (local time)
 */
export function fromDateStr(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get today's date string
 */
export function today() {
  return toDateStr(new Date());
}

/**
 * Get the Monday of the week containing the given date
 */
export function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun,1=Mon,...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Format a date for display: "Jun 15"
 */
export function formatShort(dateStr) {
  const d = fromDateStr(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a date for display: "Monday, June 15"
 */
export function formatFull(dateStr) {
  const d = fromDateStr(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/**
 * Format a date range: "Jun 15 – 20"
 */
export function formatWeekRange(startStr, endStr) {
  const start = fromDateStr(startStr);
  const end = fromDateStr(endStr);
  const startFmt = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endFmt = end.toLocaleDateString('en-US', { day: 'numeric' });
  return `${startFmt} – ${endFmt}`;
}

/**
 * Add days to a date string and return new date string
 */
export function addDays(dateStr, days) {
  const d = fromDateStr(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/**
 * Check if a date string is today
 */
export function isToday(dateStr) {
  return dateStr === today();
}

/**
 * Check if a date is in the past
 */
export function isPast(dateStr) {
  return dateStr < today();
}

/**
 * Get week number label (Week 1, Week 2, ...)
 */
export function getWeekLabel(weekIndex) {
  return `Week ${weekIndex + 1}`;
}

/**
 * Generate all weeks from startDate for numWeeks weeks
 * Returns array of week objects with day date strings (Mon-Sat or Mon-Fri)
 */
export function generateSchedule(startDate, numWeeks, practiceDayIndices) {
  // practiceDayIndices: 0=Mon,1=Tue,...,5=Sat
  const weeks = [];
  let cursor = fromDateStr(startDate);

  // Make sure we start on Monday
  const monday = getMondayOf(cursor);

  for (let w = 0; w < numWeeks; w++) {
    const days = [];
    for (let di = 0; di < practiceDayIndices.length; di++) {
      const dayOffset = practiceDayIndices[di]; // 0=Mon offset from week start
      const d = new Date(monday);
      d.setDate(d.getDate() + w * 7 + dayOffset);
      days.push(toDateStr(d));
    }
    weeks.push({
      id: `week-${w}`,
      index: w,
      days,
    });
  }
  return weeks;
}
