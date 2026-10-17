import type { DayEntry, Habit, ISODate } from '../types';
import { addDaysISO, fromISO } from './dates';

/** 월~일 순서로 보여 주는 요일 (값은 Date.getDay(): 일=0) */
export const WEEKDAY_CHIPS: { day: number; label: string }[] = [
  { day: 1, label: '월' },
  { day: 2, label: '화' },
  { day: 3, label: '수' },
  { day: 4, label: '목' },
  { day: 5, label: '금' },
  { day: 6, label: '토' },
  { day: 0, label: '일' },
];

/** 그날 해야 하는 습관인가 (요일을 안 정했으면 매일) */
export const isScheduled = (h: Habit, date: ISODate): boolean =>
  !h.weekdays || h.weekdays.length === 0 || h.weekdays.includes(fromISO(date).getDay());

const checked = (days: Record<ISODate, DayEntry>, h: Habit, d: ISODate) => !!days[d]?.habitChecks[h.id];

/**
 * 오늘까지 이어진 연속 일수. 쉬는 요일은 건너뛰고,
 * 오늘이 아직 안 끝났으면 체크 전이어도 끊기지 않는다.
 */
export function currentStreak(h: Habit, days: Record<ISODate, DayEntry>, today: ISODate): number {
  let n = 0;
  for (let i = 0; i < 800; i++) {
    const d = addDaysISO(today, -i);
    if (checked(days, h, d)) n++;
    else if (isScheduled(h, d) && i > 0) break;
  }
  return n;
}

/** 지금까지 가장 길었던 연속 일수 */
export function bestStreak(h: Habit, days: Record<ISODate, DayEntry>, today: ISODate): number {
  const first = Object.keys(days).sort()[0];
  if (!first) return 0;
  let best = 0;
  let run = 0;
  for (let d = first; d <= today; d = addDaysISO(d, 1)) {
    if (checked(days, h, d)) best = Math.max(best, ++run);
    else if (isScheduled(h, d) && d !== today) run = 0;
  }
  return best;
}

/** 그날 해야 할 습관을 모두 체크했는가 (해야 할 습관이 하나도 없으면 false) */
export function isStamped(habits: Habit[], days: Record<ISODate, DayEntry>, d: ISODate): boolean {
  const todo = habits.filter((h) => isScheduled(h, d));
  return todo.length > 0 && todo.every((h) => checked(days, h, d));
}
