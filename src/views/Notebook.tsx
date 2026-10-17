import { useState } from 'react';
import { addMonths } from 'date-fns';
import { Link, Navigate, useParams } from 'react-router-dom';
import { usePlanner } from '../store/plannerStore';
import { fmt, monthParam, parseMonthParam } from '../lib/dates';
import { buildEntries, moodEmoji } from '../lib/notebook';
import { Highlight } from '../components/Hand';
import { BookReader } from '../components/BookReader';

/** 노트 보기: 기록을 책처럼 넘겨 보거나(책), 한 달씩 카드로 모아 본다(목록) */
export default function Notebook() {
  const { ym } = useParams();
  const days = usePlanner((s) => s.days);
  const habits = usePlanner((s) => s.habits);
  const title = usePlanner((s) => s.notebookTitle);
  const [mode, setMode] = useState<'book' | 'list'>('book');
  const month = parseMonthParam(ym);
  if (!month) return <Navigate to={`/notebook/${monthParam(new Date())}`} replace />;

  const prefix = monthParam(month);
  const all = buildEntries(days, habits);
  const entries = buildEntries(days, habits, prefix).reverse();
  const doneTotal = entries.reduce((n, x) => n + x.done.length, 0);
  const diaryTotal = entries.filter((x) => x.diary || x.memo).length;

  return (
    <div className="notebook-page">
      <div className="view-nav">
        <Link className="nav-arrow" to={`/notebook/${monthParam(addMonths(month, -1))}`} aria-label="지난달">‹</Link>
        <h1 className="title">{title} · {fmt(month, 'yyyy년 M월')}</h1>
        <Link className="nav-arrow" to={`/notebook/${monthParam(addMonths(month, 1))}`} aria-label="다음 달">›</Link>
        <div className="seg nb-mode" role="group" aria-label="보기 방식">
          <button type="button" className={`btn${mode === 'book' ? ' btn-ink' : ''}`} onClick={() => setMode('book')}>📖 책</button>
          <button type="button" className={`btn${mode === 'list' ? ' btn-ink' : ''}`} onClick={() => setMode('list')}>목록</button>
        </div>
      </div>

      {mode === 'book' ? (
        <BookReader key={prefix} entries={all} startDate={`${prefix}-01`} />
      ) : (
        <>
          <p className="nb-summary">
            <span><b>{entries.length}</b>일 기록</span>
            <span><b>{doneTotal}</b>개 해냄</span>
            <span><b>{diaryTotal}</b>편 일기·메모</span>
          </p>

          {entries.length === 0 ? (
            <p className="paper-card muted empty-line">이 달에는 아직 기록이 없어요. 하루 노트에 일기나 메인을 적어 보세요.</p>
          ) : (
            <div className="nb-list">
              {entries.map(({ date, main, diary, memo, mood, done, habits: hs }) => (
                <article key={date} className="paper-card nb-entry">
                  <header className="nb-head">
                    <span className="nb-day">{fmt(date, 'd')}</span>
                    <span className="nb-dow">{fmt(date, 'M월 EEEE')}</span>
                    {mood && <span title="오늘의 기분">{moodEmoji(mood)}</span>}
                    <Link className="btn-text nb-open" to={`/day/${date}`}>열기</Link>
                  </header>
                  {main && <Highlight className="nb-main">{main}</Highlight>}
                  {diary && <p className="nb-memo">{diary}</p>}
                  {memo && <p className="nb-memo">{memo}</p>}
                  {done.length > 0 && (
                    <ul className="nb-done">
                      {done.map((t) => <li key={t.id}>{t.title}</li>)}
                    </ul>
                  )}
                  {hs.length > 0 && (
                    <div className="nb-habits">
                      {hs.map((h) => <span key={h.id} className="hl" style={{ ['--hl' as string]: h.color }}>{h.name}</span>)}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
