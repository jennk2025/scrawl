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

/** 제목이 길어도 다 보이게 글자 수만큼 칸을 늘린다 */
const fit = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

/** 첫 화면: 연도별 일기장이 꽂힌 책장. 책을 누르면 그 일기장으로 들어가고, 새 해 일기장을 만들 수 있다. */
export default function Library() {
  const navigate = useNavigate();
  const books = usePlanner((s) => s.books);
  const days = usePlanner((s) => s.days);
  const activeBookId = usePlanner((s) => s.activeBookId);
  const { addBook, removeBook, setActiveBook, updateBook } = usePlanner.getState();

  const thisYear = new Date().getFullYear();
  // 작년부터 3년 뒤까지
  const years = Array.from({ length: 5 }, (_, i) => thisYear - 1 + i);

  const [making, setMaking] = useState(false);
  const [year, setYear] = useState<number>(thisYear);
  const [title, setTitle] = useState('');
  const [cover, setCover] = useState<string>(COVERS[0].id);

  const open = (id: string) => {
    setActiveBook(id);
    navigate('/month');
  };

  const make = () => {
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
              <div className="shelf-book" style={coverVars(b.cover)}>
                <span className="nb-pages" aria-hidden="true" />
                <span className="nb-cover">
                  <span className="nb-spine" aria-hidden="true" />
                  <span className="nb-elastic" aria-hidden="true" />
                  <button type="button" className="shelf-open" onClick={() => open(b.id)} aria-label={`${b.year} ${b.title} 열기`} />
                  <label className="nb-label">
                    <span>{b.year}</span>
                    <textarea
                      className="shelf-title"
                      rows={1}
                      ref={fit}
                      value={b.title}
                      maxLength={24}
                      placeholder={DEFAULT_TITLE}
                      aria-label="일기장 제목 고치기"
                      onChange={(e) => updateBook(b.id, { title: e.target.value.replace(/\n/g, ' ') })}
                      onBlur={(e) => !e.target.value.trim() && updateBook(b.id, { title: DEFAULT_TITLE })}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
                    />
                  </label>
                </span>
              </div>
              <p className="lib-meta">{recordedDays(b.id === activeBookId ? days : b.data?.days ?? {}, b.year)}일 기록</p>
              {books.length > 1 && (
                <ConfirmButton className="btn-text lib-remove" ask="지우기" title="이 일기장과 안의 기록이 모두 지워져요" onConfirm={() => removeBook(b.id)}>
                  일기장 지우기
                </ConfirmButton>
              )}
            </div>
          ))}

          {!making && (
            <div className="lib-item">
              <button type="button" className="shelf-new" onClick={() => setMaking(true)} >
                <span aria-hidden="true">＋</span>
                새 일기장 만들기
              </button>
            </div>
          )}
        </div>

        {making && (
          <form className="paper-card lib-form" onSubmit={(e) => { e.preventDefault(); make(); }}>
            <h3>새 일기장</h3>
            <label className="lib-field">
              <span>연도</span>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => <option key={y} value={y}>{y}년</option>)}
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
