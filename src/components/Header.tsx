import { NavLink, useLocation } from 'react-router-dom';
import { usePlanner } from '../store/plannerStore';
import { fromISO, isValidISO, monthParam, parseMonthParam, parseWeekParam, todayISO, toISO, weekParam } from '../lib/dates';
import { SHOW_COVER } from '../lib/covers';
import { DdayBadge, nearestExam } from './DdayBadge';

/** 지금 보고 있는 화면의 기준 날짜. 연/월/주/일 탭을 바꿔도 같은 날 근처를 보여 준다. */
function useFocusDate(): Date {
  const [, kind, param] = useLocation().pathname.split('/');
  const now = new Date();
  // 보고 있는 범위(월/주/연)에 오늘이 들어 있으면 오늘을 기준으로 삼아, 탭을 바꿔도 지금 있는 날짜의 주/일로 간다
  if (kind === 'day' && isValidISO(param)) return fromISO(param);
  if (kind === 'month' || kind === 'notebook') {
    const m = parseMonthParam(param);
    if (!m) return now;
    return m.getFullYear() === now.getFullYear() && m.getMonth() === now.getMonth() ? now : m;
  }
  if (kind === 'week' || kind === 'review') {
    const monday = parseWeekParam(param);
    if (!monday) return now;
    return weekParam(monday) === weekParam(now) ? now : monday;
  }
  if (kind === 'year') {
    const y = Number(param);
    if (!Number.isInteger(y)) return now;
    return y === now.getFullYear() ? now : new Date(y, 0, 1);
  }
  return now;
}

export function Header() {
  const focus = useFocusDate();
  const exams = usePlanner((s) => s.exams);
  const today = todayISO();
  const title = usePlanner((s) => s.notebookTitle);
  const exam = nearestExam(exams, today);
  const cls = ({ isActive }: { isActive: boolean }) => `tab${isActive ? ' is-active' : ''}`;

  return (
    <header className="app-header">
      <button type="button" className="brand" title="표지로 돌아가기" onClick={() => window.dispatchEvent(new Event(SHOW_COVER))}>
        {title}<span className="brand-dot">.</span>
      </button>
      <nav className="tabs" aria-label="보기">
        <NavLink className={cls} to={`/year/${focus.getFullYear()}`}>연</NavLink>
        <NavLink className={cls} to={`/month/${monthParam(focus)}`}>월</NavLink>
        <NavLink className={cls} to={`/week/${weekParam(focus)}`}>주</NavLink>
        <NavLink className={cls} to={`/day/${toISO(focus)}`}>일</NavLink>
      </nav>
      <nav className="tabs tabs-tools" aria-label="도구">
        <NavLink className={cls} to="/exams">D-day</NavLink>
        <NavLink className={cls} to="/habits">습관</NavLink>
        <NavLink className={cls} to={`/notebook/${monthParam(focus)}`}>노트</NavLink>
        <NavLink className={cls} to={`/review/${weekParam(focus)}`}>정리</NavLink>
        <NavLink className={cls} to="/settings" aria-label="설정">⚙</NavLink>
      </nav>
      {exam && (
        <NavLink to="/exams" className="header-dday">
          <DdayBadge exam={exam} from={today} />
        </NavLink>
      )}
    </header>
  );
}
