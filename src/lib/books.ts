import { startOfMonth } from 'date-fns';
import type { Book, BookData, DayEntry, ISODate, PlannerData } from '../types';

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

/** 처음 만든 책 id (연도 기준). 새로 만드는 책은 겹치지 않게 임의 id를 쓴다 */
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

export const bookDataOf = (s: BookData): BookData => ({
  days: s.days,
  exams: s.exams,
  categories: s.categories,
  habits: s.habits,
  inbox: s.inbox,
});

/**
 * 책마다 기록이 따로 없던 예전 데이터를 책별로 나눈다.
 * 펼친 책은 지금 기록을 통째로 그대로 두고(data 없음), 다른 책은 자기 연도의 날짜 기록과 시험만 가져간다.
 * 분류·습관은 복사본을 갖고, 메모함은 펼친 책이 가진다.
 */
export function splitLegacyBooks(d: BookData & Pick<PlannerData, 'books' | 'activeBookId'>): Book[] {
  return d.books.map((b) => {
    if (b.id === d.activeBookId) return { ...b, data: undefined };
    const mine = (date: string) => date.startsWith(`${b.year}-`);
    const data: BookData = {
      days: Object.fromEntries(Object.entries(d.days).filter(([date]) => mine(date))),
      exams: d.exams.filter((x) => mine(x.date)),
      categories: d.categories.map((c) => ({ ...c })),
      habits: d.habits.map((h) => ({ ...h })),
      inbox: [],
    };
    return { ...b, data };
  });
}
