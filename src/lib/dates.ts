import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getISOWeek,
  getISOWeekYear,
  isValid,
  isWeekend,
  parseISO,
  startOfISOWeek,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ISODate } from '../types';

export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

export const toISO = (d: Date): ISODate => format(d, 'yyyy-MM-dd');
export const fromISO = (s: ISODate): Date => parseISO(s);
export const todayISO = (): ISODate => toISO(new Date());
export const addDaysISO = (s: ISODate, n: number): ISODate => toISO(addDays(fromISO(s), n));
export const fmt = (s: ISODate | Date, pattern: string): string =>
  format(typeof s === 'string' ? fromISO(s) : s, pattern, { locale: ko });

export const isValidISO = (s: string | undefined): s is ISODate =>
  !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && isValid(parseISO(s));

export const isWeekendISO = (s: ISODate) => isWeekend(fromISO(s));

/** b - a (일 단위) */
export const daysBetween = (a: ISODate, b: ISODate) =>
  differenceInCalendarDays(fromISO(b), fromISO(a));

export const ddayLabel = (diff: number) =>
  diff === 0 ? 'D-DAY' : diff > 0 ? `D-${diff}` : `D+${-diff}`;

/** 월요일 시작, 주 단위로 자른 한 달 달력 */
export function monthGrid(year: number, month0: number): Date[][] {
  const first = startOfMonth(new Date(year, month0, 1));
  const days = eachDayOfInterval({
    start: startOfWeek(first, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(first), { weekStartsOn: 1 }),
  });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

export function weekDays(anyDay: Date): Date[] {
  const monday = startOfISOWeek(anyDay);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export const monthParam = (d: Date) => format(d, 'yyyy-MM');
export function parseMonthParam(p: string | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})$/.exec(p ?? '');
  if (!m || +m[2] < 1 || +m[2] > 12) return null;
  return new Date(+m[1], +m[2] - 1, 1);
}

export const weekParam = (d: Date) =>
  `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`;
/** '2026-W42' → 그 주 월요일 */
export function parseWeekParam(p: string | undefined): Date | null {
  const m = /^(\d{4})-W(\d{1,2})$/.exec(p ?? '');
  if (!m || +m[2] < 1 || +m[2] > 53) return null;
  // 1월 4일은 항상 ISO 1주차에 들어간다
  return addDays(startOfISOWeek(new Date(+m[1], 0, 4)), (+m[2] - 1) * 7);
}
