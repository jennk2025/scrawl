import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useActiveBook } from '../store/plannerStore';
import { fmt } from '../lib/dates';
import { moodEmoji, type NoteEntry } from '../lib/notebook';

type Page = { kind: 'title' } | { kind: 'day'; entry: NoteEntry } | { kind: 'blank' };

const useWide = () => {
  const query = '(min-width: 760px)';
  const [wide, setWide] = useState(() => window.matchMedia?.(query).matches ?? true);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
};

function DayPage({ entry, no }: { entry: NoteEntry; no: number }) {
  return (
    <div className="bk-content">
      <header className="bk-head">
        <span className="bk-day">{fmt(entry.date, 'd')}</span>
        <span className="bk-dow">{fmt(entry.date, 'yyyy년 M월 EEEE')}</span>
        {entry.mood && <span className="bk-mood" title="오늘의 기분">{moodEmoji(entry.mood)}</span>}
      </header>
      {entry.main && <p className="bk-main"><span className="hl">{entry.main}</span></p>}
      {entry.diary && <p className="bk-diary">{entry.diary}</p>}
      {entry.memo && <p className="bk-memo">📌 {entry.memo}</p>}
      {entry.done.length > 0 && (
        <ul className="bk-done">
          {entry.done.map((t) => <li key={t.id}>{t.title}</li>)}
        </ul>
      )}
      {entry.habits.length > 0 && (
        <p className="bk-habits">
          {entry.habits.map((h) => <span key={h.id} className="hl" style={{ '--hl': h.color } as CSSProperties}>{h.name}</span>)}
        </p>
      )}
      <footer className="bk-foot">
        <Link to={`/day/${entry.date}`} className="btn-text">이 날 열기</Link>
        <span>{no}</span>
      </footer>
    </div>
  );
}

/** 기록이 있는 날들을 책장처럼 넘기며 읽는다. 넓은 화면은 두 쪽, 좁은 화면은 한 쪽. */
export function BookReader({ entries, startDate }: { entries: NoteEntry[]; startDate?: string }) {
  const { title, year } = useActiveBook();
  const wide = useWide();
  const per = wide ? 2 : 1;
  const pages: Page[] = [{ kind: 'title' }, ...entries.map((entry): Page => ({ kind: 'day', entry }))];

  const [pos, setPos] = useState(() => {
    const i = startDate ? entries.findIndex((e) => e.date >= startDate) : -1;
    return i < 0 ? 0 : i + 1;
  });
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [tick, setTick] = useState(0);

  // 두 쪽 보기에서는 왼쪽 쪽이 항상 짝수 번째
  const start = wide ? pos - (pos % 2) : pos;
  const last = Math.max(0, pages.length - 1);
  const go = useCallback(
    (delta: number) => {
      const max = wide ? last - (last % 2) : last;
      const n = Math.min(Math.max(0, start + delta * per), max);
      if (n === start) return;
      setDir(delta > 0 ? 'next' : 'prev');
      setTick((t) => t + 1);
      setPos(n);
    },
    [per, wide, last, start],
  );

  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input,textarea,select')) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  // 터치로 넘기기
  const touchX = useRef<number | null>(null);

  const render = (i: number, side: 'left' | 'right') => {
    const page = pages[i] ?? { kind: 'blank' as const };
    return (
      <section
        key={`${tick}-${side}`}
        className={`bk-page is-${side} turn-${dir}`}
        aria-label={page.kind === 'day' ? fmt(page.entry.date, 'M월 d일') : '쪽'}
      >
        {page.kind === 'title' && (
          <div className="bk-title">
            <span>{year}</span>
            <h2>{title}</h2>
            <p className="muted">{entries.length}일의 기록</p>
            <p className="bk-hint">{wide ? '‹ › 키나 아래 버튼으로 넘겨 보세요' : '옆으로 밀어서 넘겨 보세요'}</p>
          </div>
        )}
        {page.kind === 'day' && <DayPage entry={page.entry} no={i} />}
      </section>
    );
  };

  if (!entries.length)
    return <p className="paper-card muted empty-line">아직 책으로 엮을 기록이 없어요. 하루 노트에 일기나 메인을 적어 보세요.</p>;

  const atStart = start <= 0;
  const atEnd = start + per > last;

  return (
    <div
      className="bk-wrap"
      ref={root}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className={`bk-book${wide ? ' is-wide' : ''}`}>
        {render(start, wide ? 'left' : 'right')}
        {wide && render(start + 1, 'right')}
      </div>
      <div className="bk-controls">
        <button type="button" className="btn" disabled={atStart} onClick={() => go(-1)}>‹ 이전</button>
        <span className="muted">{Math.min(start + per, last)} / {last}쪽</span>
        <button type="button" className="btn btn-ink" disabled={atEnd} onClick={() => go(1)}>다음 ›</button>
      </div>
    </div>
  );
}
