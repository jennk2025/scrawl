import type { DayEntry, Exam, ISODate } from '../types';
import { addDaysISO, isWeekendISO } from './dates';

/** from(포함) ~ 시험 전날(포함) 중 공부할 수 있는 날짜 */
export function studyDays(
  from: ISODate,
  exam: Pick<Exam, 'date' | 'excludeDates' | 'skipWeekends'>,
): ISODate[] {
  const out: ISODate[] = [];
  const excluded = new Set(exam.excludeDates);
  for (let d = from, guard = 0; d < exam.date && guard < 3700; d = addDaysISO(d, 1), guard++) {
    if (excluded.has(d) || (exam.skipWeekends && isWeekendISO(d))) continue;
    out.push(d);
  }
  return out;
}

export const rangeUnits = (start: number, end: number): number[] =>
  end < start ? [] : Array.from({ length: end - start + 1 }, (_, i) => start + i);

/** 남는 분량은 앞쪽 날짜부터 하나씩 더 얹는다 */
export function splitEvenly<T>(items: T[], days: ISODate[]): { date: ISODate; items: T[] }[] {
  if (!items.length || !days.length) return [];
  const n = Math.min(items.length, days.length);
  const base = Math.floor(items.length / n);
  const extra = items.length % n;
  const out: { date: ISODate; items: T[] }[] = [];
  let i = 0;
  for (let k = 0; k < n; k++) {
    const size = base + (k < extra ? 1 : 0);
    out.push({ date: days[k], items: items.slice(i, i + size) });
    i += size;
  }
  return out;
}

/** [45,46,47,50] → '45~47, 50' */
export function formatUnits(units: number[]): string {
  const sorted = [...units].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(i === j ? `${sorted[i]}` : `${sorted[i]}~${sorted[j]}`);
    i = j + 1;
  }
  return parts.join(', ');
}

export const examTaskTitle = (exam: Pick<Exam, 'name' | 'unit'>, units: number[]) =>
  `${exam.name} ${formatUnits(units)}${exam.unit}`;

export function planExam(exam: Exam, from: ISODate, units: number[]) {
  const begin = exam.startDate && exam.startDate > from ? exam.startDate : from;
  return splitEvenly(units, studyDays(begin, exam)).map((c) => ({ date: c.date, units: c.items }));
}

export function doneUnits(days: Record<ISODate, DayEntry>, examId: string): Set<number> {
  const done = new Set<number>();
  for (const e of Object.values(days))
    for (const t of e.tasks) if (t.examId === examId && t.done) t.examUnits?.forEach((u) => done.add(u));
  return done;
}

export function examProgress(days: Record<ISODate, DayEntry>, exam: Exam) {
  const all = rangeUnits(exam.start, exam.end);
  const done = doneUnits(days, exam.id);
  return { total: all.length, done: all.filter((u) => done.has(u)).length };
}
