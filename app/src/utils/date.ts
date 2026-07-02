import {
  formatDistanceToNow,
  format,
  isToday,
  isYesterday,
  differenceInMinutes,
  parseISO,
} from 'date-fns';

export function formatRelativeTime(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (isToday(date)) {
    const mins = differenceInMinutes(new Date(), date);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return formatDistanceToNow(date, { addSuffix: true });
  }
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

export function formatPostDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD
  const date = new Date(dateStr + 'T12:00:00Z');
  return format(date, 'EEEE, MMMM d, yyyy');
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z');
  return format(date, 'MMM d');
}

export function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCountdown(targetDateStr: string): { hours: number; minutes: number; seconds: number; isExpired: boolean } {
  const now = new Date();
  const target = new Date(targetDateStr);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, isExpired: false };
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0 = Sunday
}

export function formatMonthYear(year: number, month: number): string {
  return format(new Date(year, month, 1), 'MMMM yyyy');
}
