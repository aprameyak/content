/**
 * Timezone utilities for Chronicle.
 * All "dates" in Chronicle are calendar dates in the user's local timezone.
 */

export function getUserCurrentDate(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    // fallback to UTC if timezone is invalid
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }
}

export function isToday(dateStr: string, timezone: string): boolean {
  return dateStr === getUserCurrentDate(timezone);
}

export function isYesterday(dateStr: string, timezone: string): boolean {
  const today = getUserCurrentDate(timezone);
  const todayDate = new Date(today + 'T00:00:00Z');
  todayDate.setUTCDate(todayDate.getUTCDate() - 1);
  const yesterday = todayDate.toISOString().slice(0, 10);
  return dateStr === yesterday;
}

export function daysDiff(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00Z');
  const d2 = new Date(date2 + 'T00:00:00Z');
  return Math.round(Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
