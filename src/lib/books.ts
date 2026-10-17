import { startOfMonth } from 'date-fns';
import type { Book, DayEntry, ISODate } from '../types';

export const DEFAULT_TITLE = 'my planner';

/** 책(연도 일기)의 기본 날짜: 올해 책이면 오늘, 다른 해 책이면 그 해 1월 1일 */
export function defaultFocus(year: number, now = new Date()): Date {
  return now.getFullYear() === year ? now : new Date(year, 0, 1);
}

export const defaultMonth = (year: number) => startOfMonth(defaultFocus(year));

/** 그 해에 기록이 있는 날 수 */
export function recordedDays(days: Record<ISODate, DayEntry>, year: number): number {
  return Object.entries(days).filter(([d, e]) => d.startsWith(`${year}-`) && hasRecord(e)).length;
}

const hasRecord = (e: DayEntry) =>
  !!(e.main.trim() || (e.diary ?? '').trim() || e.memo.trim() || e.mood || e.tasks.length);

/** 새 책 id: 같은 연도는 한 권만 만든다 */
export const bookId = (year: number) => `book-${year}`;

/**
 * 예전 데이터(책 목록이 없던 때)나 백업에서 책장을 만든다.
 * 기록이 있는 모든 해와 올해에 책을 한 권씩 두고, 제목·표지는 예전 값을 이어 쓴다.
 */
export function booksFromLegacy(days: Record<ISODate, DayEntry>, title?: string, cover?: string): Book[] {
  const years = new Set<number>([new Date().getFullYear()]);
  for (const d of Object.keys(days ?? {})) {
    const y = Number(d.slice(0, 4));
    if (Number.isInteger(y) && y > 1900 && y < 3000) years.add(y);
  }
  return [...years]
    .sort((a, b) => a - b)
    .map((year) => ({ id: bookId(year), year, title: title || DEFAULT_TITLE, cover: cover || 'navy' }));
}
