import type { CSSProperties } from 'react';
import { addWeeks } from 'date-fns';
import { Link, Navigate, useParams } from 'react-router-dom';
import { usePlanner } from '../store/plannerStore';
import { fmt, parseWeekParam, todayISO, toISO, weekDays, weekParam } from '../lib/dates';
import { activeTasks } from '../lib/day';
import { Highlight } from '../components/Hand';

/** 주간 정리: 한 일 / 미룬 일 / 다음 주로 넘길 일 */
export default function Review() {
  const { w } = useParams();
  const days = usePlanner((s) => s.days);
  const categories = usePlanner((s) => s.categories);
  const migrateTask = usePlanner((s) => s.migrateTask);
  const monday = parseWeekParam(w);
  if (!monday) return <Navigate to={`/review/${weekParam(new Date())}`} replace />;

  const dates = weekDays(monday).map(toISO);
  const nextMonday = toISO(addWeeks(monday, 1));
  const today = todayISO();
  // 지난 날짜로 보내면 바로 다시 이월되니, 다음 주 월요일이 이미 지났으면 오늘로 보낸다
  const target = nextMonday > today ? nextMonday : today;

  const rows = dates.flatMap((d) => (days[d]?.tasks ?? []).map((t) => ({ d, t })));
  const done = rows.filter(({ t }) => t.done);
  const pushed = rows.filter(({ t }) => t.migratedTo);
  const open = rows.filter(({ t }) => !t.done && !t.migratedTo);
  const active = dates.flatMap((d) => activeTasks(days[d]));
  const pct = active.length ? Math.round((done.length / active.length) * 100) : 0;
  const mains = dates.filter((d) => days[d]?.main).map((d) => ({ d, main: days[d].main }));
  const worst = [...rows].filter(({ t }) => !t.done).sort((a, b) => b.t.carryCount - a.t.carryCount)[0];

  const byCat = categories
    .map((c) => ({ c, n: done.filter(({ t }) => t.categoryId === c.id).length }))
    .filter((x) => x.n > 0);
  const maxCat = Math.max(1, ...byCat.map((x) => x.n));

  return (
    <div className="review-page">
      <div className="view-nav">
        <Link className="nav-arrow" to={`/review/${weekParam(addWeeks(monday, -1))}`} aria-label="지난주">‹</Link>
        <h1 className="title">주간 정리 · {fmt(dates[0], 'M/d')}–{fmt(dates[6], 'M/d')}</h1>
        <Link className="nav-arrow" to={`/review/${weekParam(addWeeks(monday, 1))}`} aria-label="다음 주">›</Link>
        <Link className="btn-text" to={`/week/${w}`}>주 보기</Link>
      </div>

      <div className="review-stats">
        <div className="paper-card stat"><span>달성률</span><b>{pct}%</b></div>
        <div className="paper-card stat"><span>한 일</span><b>{done.length}</b></div>
        <div className="paper-card stat"><span>미룬 일</span><b className="pen-red">{pushed.length}</b></div>
        <div className="paper-card stat"><span>남은 일</span><b>{open.length}</b></div>
      </div>

      <div className="review-grid">
        <section className="paper-card lined review-col">
          <h2 className="note-label">이번 주 메인들</h2>
          {mains.length ? (
            <ul>{mains.map(({ d, main }) => <li key={d}><span className="muted">{fmt(d, 'EEE')}</span> <Highlight>{main}</Highlight></li>)}</ul>
          ) : <p className="muted">메인을 적은 날이 없어요.</p>}
        </section>

        <section className="paper-card lined review-col">
          <h2 className="note-label">✓ 한 일</h2>
          <ul>{done.map(({ d, t }) => <li key={t.id}><span className="muted">{fmt(d, 'EEE')}</span> {t.title}</li>)}</ul>
          {byCat.length > 0 && (
            <div className="cat-bars">
              {byCat.map(({ c, n }) => (
                <div key={c.id} className="cat-bar">
                  <span>{c.name}</span>
                  <div className="bar"><div className="bar-fill" style={{ width: `${(n / maxCat) * 100}%`, '--fill': c.color } as CSSProperties} /></div>
                  <b>{n}</b>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="paper-card lined review-col">
          <h2 className="note-label">→ 다음 주로 넘길 일</h2>
          {open.length ? (
            <>
              <ul>
                {open.map(({ d, t }) => (
                  <li key={t.id} className="review-open">
                    <span><span className="muted">{fmt(d, 'EEE')}</span> {t.title}</span>
                    <button className="btn" type="button" onClick={() => migrateTask(d, t.id, target)}>{fmt(target, 'M/d')}로 →</button>
                  </li>
                ))}
              </ul>
              <button className="btn btn-ink" type="button" onClick={() => open.forEach(({ d, t }) => migrateTask(d, t.id, target))}>
                전부 {fmt(target, 'M/d')}로 넘기기
              </button>
            </>
          ) : <p className="muted">남은 일이 없어요. 깔끔! ✨</p>}
          {worst && worst.t.carryCount >= 2 && (
            <p className="pen-red nag">가장 많이 미룬 일: “{worst.t.title}” ({worst.t.carryCount}번). 작게 쪼개 보는 건 어때요?</p>
          )}
        </section>
      </div>
    </div>
  );
}
