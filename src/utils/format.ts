import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('America/Santiago');

export function formatDuration(durationStr: string): string {
  if (!durationStr) return '';
  const match = durationStr.match(/(\d+)\s*h\s*(\d+)\s*m/i);
  if (match) {
    return `${match[1]}小时${match[2]}分钟`;
  }
  return durationStr;
}

export function calculateAge(purchaseDate: string): number {
  if (!purchaseDate) return 0;
  const purchase = new Date(purchaseDate);
  if (isNaN(purchase.getTime())) return 0;
  return Math.max(0, Math.round(((Date.now() - purchase.getTime()) / (365.25 * 86400000)) * 10) / 10);
}

export function formatTime(date: string | Date | number): string {
  return dayjs(date).tz().format('YYYY-MM-DD HH:mm:ss');
}