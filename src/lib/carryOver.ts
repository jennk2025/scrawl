import type { DayEntry, ISODate, Task } from '../types';
import { emptyDay } from './day';

/**
 * 불렛저널식 이월: 오늘 이전 날짜의 미완료 할 일을 오늘로 옮긴다.
 * 원래 날짜의 할 일은 남겨 두고 migratedTo(→)만 표시한다.
 */
export function carryOver(
  days: Record<ISODate, DayEntry>,
  today: ISODate,
  makeId: () => string,
): { days: Record<ISODate, DayEntry>; moved: number } {
  const next = { ...days };
  const carried: Task[] = [];

  for (const date of Object.keys(days).filter((d) => d < today).sort()) {
    const entry = days[date];
    if (!entry.tasks.some((t) => !t.done && !t.migratedTo)) continue;
    next[date] = {
      ...entry,
      tasks: entry.tasks.map((t) => {
        if (t.done || t.migratedTo) return t;
        carried.push({
          ...t,
          id: makeId(),
          carriedFrom: t.carriedFrom ?? date,
          carryCount: t.carryCount + 1,
          migratedTo: undefined,
        });
        return { ...t, migratedTo: today };
      }),
    };
  }

  if (!carried.length) return { days, moved: 0 };
  const todayEntry = next[today] ?? emptyDay();
  next[today] = { ...todayEntry, tasks: [...carried, ...todayEntry.tasks] };
  return { days: next, moved: carried.length };
}

/** 오늘 이전 날짜에 남아 있는 미완료 할 일 개수 */
export function countOverdue(days: Record<ISODate, DayEntry>, today: ISODate): number {
  let n = 0;
  for (const [date, e] of Object.entries(days))
    if (date < today) n += e.tasks.filter((t) => !t.done && !t.migratedTo).length;
  return n;
}
