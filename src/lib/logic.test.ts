import { describe, expect, it } from 'vitest';
import { carryOver } from './carryOver';
import { formatUnits, planExam, rangeUnits, splitEvenly, studyDays } from './examPlanner';
import { parseWeekParam, toISO, weekParam } from './dates';
import { heatLevel } from './heat';
import type { DayEntry, Exam, Task } from '../types';

const task = (id: string, done = false, extra: Partial<Task> = {}): Task => ({ id, title: id, done, carryCount: 0, ...extra });
const day = (tasks: Task[]): DayEntry => ({ main: '', tasks, memo: '', habitChecks: {} });

describe('시험 역산 분배', () => {
  const exam: Exam = {
    id: 'e', name: '수학', date: '2026-10-20', startDate: '2026-10-16',
    start: 1, end: 10, unit: '쪽', excludeDates: [], skipWeekends: false,
  };

  it('시험 당일은 빼고 공부일을 센다', () => {
    expect(studyDays('2026-10-16', exam)).toEqual(['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19']);
  });

  it('제외일과 주말을 뺀다', () => {
    expect(studyDays('2026-10-16', { ...exam, excludeDates: ['2026-10-19'], skipWeekends: true })).toEqual(['2026-10-16']);
  });

  it('나머지는 앞쪽 날에 하나씩 더 얹는다', () => {
    const plan = planExam(exam, '2026-10-16', rangeUnits(1, 10));
    expect(plan.map((p) => p.units.length)).toEqual([3, 3, 2, 2]);
    expect(plan.flatMap((p) => p.units)).toEqual(rangeUnits(1, 10));
  });

  it('분량이 날짜보다 적으면 앞날부터 하루 하나씩', () => {
    expect(splitEvenly([1, 2], ['a', 'b', 'c'])).toEqual([{ date: 'a', items: [1] }, { date: 'b', items: [2] }]);
  });

  it('오늘이 시작일보다 늦으면 오늘부터 다시 나눈다', () => {
    const plan = planExam(exam, '2026-10-18', [5, 6, 7]);
    expect(plan).toEqual([{ date: '2026-10-18', units: [5, 6] }, { date: '2026-10-19', units: [7] }]);
  });

  it('시험이 지났으면 분배하지 않는다', () => {
    expect(planExam(exam, '2026-10-21', [1, 2])).toEqual([]);
  });

  it('범위를 짧게 표시한다', () => {
    expect(formatUnits([50, 45, 46, 47, 60, 61])).toBe('45~47, 50, 60~61');
  });
});

describe('할 일 이월', () => {
  let n = 0;
  const id = () => `new${++n}`;

  it('지난 날의 미완료만 오늘로 옮기고 원래 자리엔 → 표시', () => {
    const days = {
      '2026-10-14': day([task('a'), task('b', true)]),
      '2026-10-15': day([task('c', false, { carriedFrom: '2026-10-13', carryCount: 2 })]),
      '2026-10-16': day([task('d')]),
      '2026-10-17': day([task('e')]),
    };
    const { days: out, moved } = carryOver(days, '2026-10-16', id);
    expect(moved).toBe(2);
    expect(out['2026-10-14'].tasks[0].migratedTo).toBe('2026-10-16');
    expect(out['2026-10-14'].tasks[1].migratedTo).toBeUndefined();
    const today = out['2026-10-16'].tasks;
    expect(today.map((t) => t.title)).toEqual(['a', 'c', 'd']);
    expect(today[0]).toMatchObject({ carriedFrom: '2026-10-14', carryCount: 1 });
    expect(today[1]).toMatchObject({ carriedFrom: '2026-10-13', carryCount: 3 });
    expect(out['2026-10-17']).toBe(days['2026-10-17']);
  });

  it('두 번 실행해도 중복으로 옮기지 않는다', () => {
    const first = carryOver({ '2026-10-10': day([task('a')]) }, '2026-10-16', id).days;
    const second = carryOver(first, '2026-10-16', id);
    expect(second.moved).toBe(0);
    expect(second.days['2026-10-16'].tasks).toHaveLength(1);
  });

  it('오늘 날짜가 비어 있어도 새로 만든다', () => {
    const { days } = carryOver({ '2026-10-01': day([task('a')]) }, '2026-10-16', id);
    expect(days['2026-10-16'].tasks[0].title).toBe('a');
  });
});

describe('날짜', () => {
  it('주 번호를 왕복 변환한다', () => {
    const d = new Date(2026, 9, 16);
    expect(weekParam(d)).toBe('2026-W42');
    expect(toISO(parseWeekParam('2026-W42')!)).toBe('2026-10-12');
    expect(toISO(parseWeekParam('2026-W01')!)).toBe('2025-12-29');
  });
});

describe('잔디', () => {
  it('완료 비율로 진하기를 정한다', () => {
    expect(heatLevel(undefined)).toBe(0);
    expect(heatLevel(day([task('a'), task('b')]))).toBe(0);
    expect(heatLevel(day([task('a', true), task('b')]))).toBe(2);
    expect(heatLevel(day([task('a', true)]))).toBe(4);
  });
});
