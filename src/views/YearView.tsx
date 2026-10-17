import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { usePlanner } from '../store/plannerStore';
import { WEEKDAYS, monthGrid, monthParam, todayISO, toISO } from '../lib/dates';
import { dayStats, heatLevel } from '../lib/heat';

export default function YearView() {
  const { year } = useParams();
  const navigate = useNavigate();
  const days = usePlanner((s) => s.days);
  const y = Number(year);
  if (!Number.isInteger(y) || y < 1900 || y > 2999) return <Navigate to={`/year/${new Date().getFullYear()}`} replace />;

  const today = todayISO();
  const yearDays = Object.entries(days).filter(([d]) => d.startsWith(`${y}-`));
  const doneTasks = yearDays.reduce((n, [, e]) => n + dayStats(e).done, 0);
  const greenDays = yearDays.filter(([, e]) => heatLevel(e) > 0).length;

  return (
    <div>
      <div className="view-nav">
        <Link className="nav-arrow" to={`/year/${y - 1}`} aria-label="작년">‹</Link>
        <h1 className="title">{y}년</h1>
        <Link className="nav-arrow" to={`/year/${y + 1}`} aria-label="내년">›</Link>
      </div>
      <p className="year-summary">
        올해 끝낸 할 일 <b>{doneTasks}</b>개 · 잔디 심은 날 <b>{greenDays}</b>일
      </p>
      <div className="heat-legend" aria-hidden="true">
        덜 함 {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`heat heat-${l}`} />)} 다 함
      </div>

      <div className="year-grid">
        {Array.from({ length: 12 }, (_, m) => (
          <section key={m} className="year-month paper-card">
            <Link to={`/month/${monthParam(new Date(y, m, 1))}`} className="title ym-title">{m + 1}월</Link>
            <div className="ym-grid">
              {WEEKDAYS.map((w) => <span key={w} className="ym-head">{w}</span>)}
              {monthGrid(y, m).flat().map((d) => {
                const iso = toISO(d);
                if (d.getMonth() !== m) return <span key={iso} />;
                const { total, done } = dayStats(days[iso]);
                return (
                  <button
                    type="button"
                    key={iso}
                    className={`heat heat-${heatLevel(days[iso])}${iso === today ? ' is-today' : ''}`}
                    title={`${m + 1}/${d.getDate()} · ${done}/${total}`}
                    aria-label={`${m + 1}월 ${d.getDate()}일 ${done}/${total}`}
                    onClick={() => navigate(`/day/${iso}`)}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
