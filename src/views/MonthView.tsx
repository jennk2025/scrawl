import { useMemo, type CSSProperties } from 'react';
import { addMonths } from 'date-fns';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useActiveBook, usePlanner } from '../store/plannerStore';
import { defaultMonth } from '../lib/books';
import { WEEKDAYS, fmt, monthGrid, monthParam, parseMonthParam, toISO, todayISO } from '../lib/dates';
import { activeTasks } from '../lib/day';
import type { Exam } from '../types';
import { TodayCircle } from '../components/Hand';
import { TodayPlan } from '../components/TodayPlan';

const MAX_TASKS = 3;

export default function MonthView() {
  const { ym } = useParams();
  const navigate = useNavigate();
  const days = usePlanner((s) => s.days);
  const exams = usePlanner((s) => s.exams);
  const book = useActiveBook();
  const base = ym === undefined ? defaultMonth(book.year) : parseMonthParam(ym);

  const examsOn = useMemo(() => {
    const m = new Map<string, Exam[]>();
    exams.forEach((e) => m.set(e.date, [...(m.get(e.date) ?? []), e]));
    return m;
  }, [exams]);

  if (!base) return <Navigate to="/month" replace />;
  const today = todayISO();

  return (
    <div className="home">
      <TodayPlan />

      <section className="month-main">
        <div className="view-nav">
          <Link className="nav-arrow" to={`/month/${monthParam(addMonths(base, -1))}`} aria-label="지난달">‹</Link>
          <h2 className="title">{fmt(base, 'yyyy년 M월')}</h2>
          <Link className="nav-arrow" to={`/month/${monthParam(addMonths(base, 1))}`} aria-label="다음 달">›</Link>
          <Link className="btn-text" to="/month">{book.year === new Date().getFullYear() ? '이번 달' : '처음으로'}</Link>
        </div>

        <div className="month-grid paper-card">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`mg-head${i === 5 ? ' sat' : i === 6 ? ' sun' : ''}`}>{w}</div>
          ))}
          {monthGrid(base.getFullYear(), base.getMonth()).flat().map((d) => {
            const iso = toISO(d);
            const entry = days[iso];
            const tasks = activeTasks(entry);
            const done = tasks.filter((t) => t.done).length;
            const dow = d.getDay();
            return (
              <div
                key={iso}
                role="button"
                tabIndex={0}
                className={[
                  'mg-cell',
                  d.getMonth() !== base.getMonth() && 'is-other',
                  iso === today && 'is-today',
                  dow === 6 && 'sat',
                  dow === 0 && 'sun',
                ].filter(Boolean).join(' ')}
                onClick={() => navigate(`/day/${iso}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/day/${iso}`)}
                aria-label={`${fmt(iso, 'M월 d일')} 열기`}
              >
                <span className="mg-date">
                  {d.getDate()}
                  {iso === today && <TodayCircle />}
                </span>
                {examsOn.get(iso)?.filter((ex) => !ex.done).map((ex) => (
                  <span key={ex.id} className="mg-exam">{ex.name}</span>
                ))}
                {entry?.main && <span className="mg-main">{entry.main}</span>}
                <ul className="mg-tasks">
                  {tasks.slice(0, MAX_TASKS).map((t) => (
                    <li
                      key={t.id}
                      className={[t.done && 'done', t.examId && 'is-plan'].filter(Boolean).join(' ')}
                    >
                      <span className="mg-text">{t.title}</span>
                    </li>
                  ))}
                </ul>
                {tasks.length > MAX_TASKS && <span className="mg-more">+{tasks.length - MAX_TASKS}</span>}
                {tasks.length > 0 && <span className={`mg-count${done === tasks.length ? ' is-all' : ''}`}>{done}/{tasks.length}</span>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
