import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlanner } from '../store/plannerStore';
import { COVERS, coverById } from '../lib/covers';
import { DEFAULT_TITLE, recordedDays } from '../lib/books';
import { ScrawlBrand } from '../components/ScrawlLogo';
import { ConfirmButton } from '../components/ConfirmButton';

const coverVars = (id: string) => {
  const c = coverById(id);
  return { '--cover': c.bg, '--cover-ink': c.ink, '--cover-accent': c.accent } as CSSProperties;
};

/** 첫 화면: 연도별 일기장이 꽂힌 책장. 책을 누르면 그 일기장으로 들어가고, 새 해 일기장을 만들 수 있다. */
export default function Library() {
  const navigate = useNavigate();
  const books = usePlanner((s) => s.books);
  const days = usePlanner((s) => s.days);
  const { addBook, removeBook, setActiveBook } = usePlanner.getState();

  const thisYear = new Date().getFullYear();
  const taken = new Set(books.map((b) => b.year));
  // 아직 책이 없는 해만 고를 수 있게: 작년부터 3년 뒤까지
  const free = Array.from({ length: 5 }, (_, i) => thisYear - 1 + i).filter((y) => !taken.has(y));

  const [making, setMaking] = useState(false);
  const [year, setYear] = useState<number>(free.find((y) => y >= thisYear) ?? free[0] ?? thisYear + 1);
  const [title, setTitle] = useState('');
  const [cover, setCover] = useState<string>(COVERS[0].id);

  const open = (id: string) => {
    setActiveBook(id);
    navigate('/month');
  };

  const make = () => {
    if (!free.includes(year)) return;
    open(addBook(year, title.trim() || DEFAULT_TITLE, cover));
  };

  return (
    <div className="lib">
      <header className="lib-top">
        <ScrawlBrand />
      </header>

      <section className="lib-hero">
        <h1>하루를 손글씨처럼,<br />한 해를 한 권으로.</h1>
        <p>할 일과 일기를 한 공책에 적고, 해마다 새 일기장을 꽂아 두세요.</p>
      </section>

      <section className="lib-shelf" aria-labelledby="lib-shelf-title">
        <h2 id="lib-shelf-title">내 일기장</h2>
        <div className="lib-grid">
          {[...books].sort((a, b) => b.year - a.year).map((b) => (
            <div key={b.id} className="lib-item">
              <button type="button" className="shelf-book" style={coverVars(b.cover)} onClick={() => open(b.id)} aria-label={`${b.year} ${b.title} 열기`}>
                <span className="nb-pages" aria-hidden="true" />
                <span className="nb-cover">
                  <span className="nb-spine" aria-hidden="true" />
                  <span className="nb-elastic" aria-hidden="true" />
                  <span className="nb-label">
                    <span>{b.year}</span>
                    <b className="shelf-title">{b.title}</b>
                  </span>
                </span>
              </button>
              <p className="lib-meta">{recordedDays(days, b.year)}일 기록</p>
              {books.length > 1 && (
                <ConfirmButton className="btn-text lib-remove" ask="빼기" title="책장에서만 빼요. 기록은 지워지지 않아요" onConfirm={() => removeBook(b.id)}>
                  책장에서 빼기
                </ConfirmButton>
              )}
            </div>
          ))}

          {!making && (
            <div className="lib-item">
              <button type="button" className="shelf-new" onClick={() => setMaking(true)} disabled={free.length === 0}>
                <span aria-hidden="true">＋</span>
                {free.length === 0 ? '만들 수 있는 해가 없어요' : '새 일기장 만들기'}
              </button>
            </div>
          )}
        </div>

        {making && (
          <form className="paper-card lib-form" onSubmit={(e) => { e.preventDefault(); make(); }}>
            <h3>새 일기장</h3>
            <label className="lib-field">
              <span>어느 해?</span>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {free.map((y) => <option key={y} value={y}>{y}년</option>)}
              </select>
            </label>
            <label className="lib-field">
              <span>제목</span>
              <input value={title} maxLength={24} placeholder={DEFAULT_TITLE} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <div className="lib-field">
              <span>표지 색</span>
              <div className="cover-swatches" role="radiogroup" aria-label="표지 색">
                {COVERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={c.id === cover}
                    aria-label={c.name}
                    title={c.name}
                    className={`cover-swatch${c.id === cover ? ' is-on' : ''}`}
                    style={{ background: c.bg }}
                    onClick={() => setCover(c.id)}
                  />
                ))}
              </div>
            </div>
            <div className="lib-actions">
              <button type="submit" className="btn btn-ink">만들고 열기</button>
              <button type="button" className="btn-text" onClick={() => setMaking(false)}>취소</button>
            </div>
          </form>
        )}
      </section>

      <footer className="lib-foot">Scrawl Daily Planner · 기록은 이 기기의 브라우저에 저장돼요</footer>
    </div>
  );
}
