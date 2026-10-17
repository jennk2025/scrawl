import { describe, expect, it } from 'vitest';
import type { DayEntry, Habit } from '../types';
import { bestStreak, currentStreak, isScheduled, isStamped } from './habits';
import { emptyDay } from './day';

const habit = (weekdays?: number[]): Habit => ({ id: 'h', name: '운동', color: '#fff', weekdays });
const mark = (...dates: string[]) =>
  Object.fromEntries(dates.map((d) => [d, { ...emptyDay(), habitChecks: { h: true } } as DayEntry]));

describe('habits', () => {
  it('요일을 안 정하면 매일, 정하면 그 요일만', () => {
    expect(isScheduled(habit(), '2026-10-17')).toBe(true);
    expect(isScheduled(habit([1, 3, 5]), '2026-10-17')).toBe(false); // 토요일
    expect(isScheduled(habit([1, 3, 5]), '2026-10-16')).toBe(true); // 금요일
  });

  it('오늘을 아직 안 했어도 어제까지의 연속은 유지된다', () => {
    const days = mark('2026-10-15', '2026-10-16');
    expect(currentStreak(habit(), days, '2026-10-17')).toBe(2);
  });

  it('하루를 거르면 끊긴다', () => {
    const days = mark('2026-10-14', '2026-10-16', '2026-10-17');
    expect(currentStreak(habit(), days, '2026-10-17')).toBe(2);
  });

  it('쉬는 요일은 연속을 끊지 않는다 (월수금)', () => {
    // 10/12 월, 10/14 수, 10/16 금 → 사이의 화·목은 쉬는 날
    const days = mark('2026-10-12', '2026-10-14', '2026-10-16');
    expect(currentStreak(habit([1, 3, 5]), days, '2026-10-17')).toBe(3);
  });

  it('최고 기록', () => {
    const days = mark('2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10', '2026-10-11');
    expect(bestStreak(habit(), days, '2026-10-17')).toBe(3);
  });

  it('도장: 그날 할 습관을 모두 했을 때만', () => {
    const a = habit();
    const b: Habit = { id: 'k', name: '독서', color: '#fff' };
    const day: DayEntry = { ...emptyDay(), habitChecks: { h: true } };
    expect(isStamped([a, b], { '2026-10-17': day }, '2026-10-17')).toBe(false);
    expect(isStamped([a], { '2026-10-17': day }, '2026-10-17')).toBe(true);
    expect(isStamped([], {}, '2026-10-17')).toBe(false);
  });
});
