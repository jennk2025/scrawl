import { Link, NavLink, useLocation } from 'react-router-dom';
import { useActiveBook, usePlanner } from '../store/plannerStore';
import { defaultFocus } from '../lib/books';
import { fromISO, isValidISO, monthParam, parseMonthParam, parseWeekParam, todayISO, toISO, weekParam } from '../lib/dates';
import { DdayBadge, nearestExam } from './DdayBadge';

/** 지금 보고 있는 화면의 기준 날짜. 연/월/주/일 탭을 바꿔도 같은 날 근처를 보여 준다. */
function useFocusDate(def: Date): Date {
  const [, kind, param] = useLocation().pathname.split('/');
  // 보고 있는 범위(월/주/연)에 기본 날짜(오늘)가 들어 있으면 그걸 기준으로 삼아, 탭을 바꿔도 지금 있는 날짜의 주/일로 간다
  if (kind === 'day' && isValidISO(param)) return fromISO(param);
  if (kind === 'month' || kind === 'notebook') {
    const m = parseMonthParam(param);
    if (!m) return def;
    return m.getFullYear() === def.getFullYear() && m.getMonth() === def.getMonth() ? def : m;
  }
  if (kind === 'week' || kind === 'review') {
    const monday = parseWeekParam(param);
    if (!monday) return def;
    return weekParam(monday) === weekParam(def) ? def : monday;
  }
  if (kind === 'year') {
    const y = Number(param);
    if (!param || !Number.isInteger(y)) return def;
    return y === def.getFullYear() ? def : new Date(y, 0, 1);
  }
  return def;
}

export function Header() {
  const book = useActiveBook();
  const def = defaultFocus(book.year);
  const focus = useFocusDate(def);
  const exams = usePlanner((s) => s.exams);
  const today = todayISO();
  const title = book.title;
  const exam = nearestExam(exams, today);
  // 기본 날짜(오늘)를 보고 있으면 주소에 날짜를 붙이지 않는다 (/month, /week …)
  const to = (kind: string, param: (d: Date) => string) =>
    param(focus) === param(def) ? `/${kind}` : `/${kind}/${param(focus)}`;
  const cls = ({ isActive }: { isActive: boolean }) => `tab${isActive ? ' is-active' : ''}`;

  return (
    <header className="app-header">
      <Link className="brand" to="/" title="내 책장으로">
        {title}<span className="brand-dot">.</span>
      </Link>
      <nav className="tabs" aria-label="보기">
        <NavLink className={cls} to={to('year', (d) => String(d.getFullYear()))}>연</NavLink>
        <NavLink className={cls} to={to('month', monthParam)}>월</NavLink>
        <NavLink className={cls} to={to('week', weekParam)}>주</NavLink>
        <NavLink className={cls} to={to('day', toISO)}>일</NavLink>
      </nav>
      <nav className="tabs tabs-tools" aria-label="도구">
        <NavLink className={cls} to="/exams">D-day</NavLink>
        <NavLink className={cls} to="/habits">습관</NavLink>
        <NavLink className={cls} to={to('notebook', monthParam)}>노트</NavLink>
        <NavLink className={cls} to={to('review', weekParam)}>정리</NavLink>
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
