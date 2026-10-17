import { addWeeks } from 'date-fns';
import { Link, Navigate, useParams } from 'react-router-dom';
import { usePlanner } from '../store/plannerStore';
import { fmt, parseWeekParam, todayISO, toISO, weekDays, weekParam } from '../lib/dates';
import { activeTasks } from '../lib/day';
import { HandCheckbox, Highlight, Strike } from '../components/Hand';

export default function WeekView() {
  const { w } = useParams();
  const days = usePlanner((s) => s.days);
  const toggleTask = usePlanner((s) => s.toggleTask);
  const monday = parseWeekParam(w);
  if (!monday) return <Navigate to={`/week/${weekParam(new Date())}`} replace />;

  const today = todayISO();
  const dates = weekDays(monday).map(toISO);
  const all = dates.flatMap((d) => activeTasks(days[d]));
  const done = all.filter((t) => t.done).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;

  return (
    <div>
      <div className="view-nav">
        <Link className="nav-arrow" to={`/week/${weekParam(addWeeks(monday, -1))}`} aria-label="지난주">‹</Link>
        <h1 className="title">
          {fmt(dates[0], 'M월 d일')} – {fmt(dates[6], 'M월 d일')}
        </h1>
        <Link className="nav-arrow" to={`/week/${weekParam(addWeeks(monday, 1))}`} aria-label="다음 주">›</Link>
        <Link className="btn-text" to={`/review/${w}`}>이번 주 정리 →</Link>
      </div>

      <div className="week-progress paper-card">
        <span>이번 주 달성률</span>
        <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        <b>{pct}%</b>
        <span className="muted">({done}/{all.length})</span>
      </div>

      <div className="week-grid">
        {dates.map((d) => {
          const entry = days[d];
          const tasks = activeTasks(entry);
          return (
            <section key={d} className={`week-day paper-card lined${d === today ? ' is-today' : ''}`}>
              <Link to={`/day/${d}`} className="wd-head">
                <span className="wd-dow">{fmt(d, 'EEE')}</span>
                <span className="wd-date">{fmt(d, 'd')}</span>
              </Link>
              {entry?.main && <Highlight className="wd-main">{entry.main}</Highlight>}
              <ul className="wd-tasks">
                {tasks.map((t) => (
                  <li key={t.id}>
                    <HandCheckbox small checked={t.done} label={t.title} onChange={() => toggleTask(d, t.id)} />
                    <Strike on={t.done}>{t.title}</Strike>
                  </li>
                ))}
              </ul>
              {!tasks.length && <Link to={`/day/${d}`} className="muted wd-empty">+ 적기</Link>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
