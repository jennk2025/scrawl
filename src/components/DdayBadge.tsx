import type { Exam, ISODate } from '../types';
import { daysBetween, ddayLabel } from '../lib/dates';

/** 손글씨 도장 느낌의 D-day 스티커 */
export function DdayBadge({ exam, from, compact }: { exam: Exam; from: ISODate; compact?: boolean }) {
  const diff = daysBetween(from, exam.date);
  const urgent = diff <= 7;
  return (
    <span className={`stamp${urgent ? ' is-urgent' : ''}${compact ? ' is-compact' : ''}`} title={`${exam.name} ${exam.date}`}>
      {!compact && <small>{exam.name}</small>}
      <b>{ddayLabel(diff)}</b>
    </span>
  );
}

/** 아직 끝냈다고 표시하지 않은 일정 (날짜순, 지난 일정은 D+로 계속 보임) */
export const openExams = (exams: Exam[]) =>
  exams.filter((e) => !e.done).sort((a, b) => a.date.localeCompare(b.date));

/** 가장 급한 일정: 다가오는 것 중 가장 가까운 것, 없으면 가장 최근에 지난 것 */
export function nearestExam(exams: Exam[], from: ISODate): Exam | undefined {
  const open = openExams(exams);
  return open.find((e) => e.date >= from) ?? open[open.length - 1];
}
