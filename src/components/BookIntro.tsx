import { useEffect, useState, type CSSProperties } from 'react';
import { usePlanner } from '../store/plannerStore';
import { COVERS, SHOW_COVER, coverById } from '../lib/covers';
import { ScrawlBrand } from './ScrawlLogo';

const KEY = 'hand-planner:opened';

function alreadyOpened() {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** 앱을 켜면 노트 표지가 나온다. 제목을 고칠 수 있고, 노트를 누르면 표지가 넘어가며 안으로 들어간다. */
export function BookIntro() {
  const [phase, setPhase] = useState<'closed' | 'opening' | 'gone'>(() => (alreadyOpened() ? 'gone' : 'closed'));
  const title = usePlanner((s) => s.notebookTitle);
  const setTitle = usePlanner((s) => s.setNotebookTitle);
  const coverId = usePlanner((s) => s.notebookCover);
  const setCover = usePlanner((s) => s.setNotebookCover);
  const cover = coverById(coverId);

  // 맨 위 제목을 누르면 표지로 돌아온다
  useEffect(() => {
    const show = () => setPhase('closed');
    window.addEventListener(SHOW_COVER, show);
    return () => window.removeEventListener(SHOW_COVER, show);
  }, []);

  useEffect(() => {
    if (phase === 'closed') {
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* 저장이 막혀도 표지만 다시 보일 뿐 */
      }
    }
    if (phase !== 'opening') return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => setPhase('gone'), reduce ? 0 : 1500);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === 'gone') return null;
  const open = () => setPhase((p) => (p === 'closed' ? 'opening' : p));
  const year = new Date().getFullYear();

  return (
    <div
      className={`intro${phase === 'opening' ? ' is-opening' : ''}`}
      role="dialog"
      aria-label="노트 표지"
      style={{ '--cover': cover.bg, '--cover-ink': cover.ink, '--cover-accent': cover.accent } as CSSProperties}
    >
      <ScrawlBrand />
      <div
        className="intro-book"
        onClick={open}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) open();
        }}
        aria-label="노트 열기"
      >
        <div className="intro-pages" aria-hidden="true">
          <span />
        </div>
        <div className="intro-cover">
          <div className="intro-stitch" aria-hidden="true" />
          <div className="intro-band" aria-hidden="true" />
          <div className="intro-label">
            <span>{year}</span>
            <input
              className="intro-title"
              value={title}
              maxLength={24}
              placeholder="나의 노트"
              aria-label="노트 제목"
              onChange={(e) => setTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') open();
              }}
            />
          </div>
          <div className="intro-deco" aria-hidden="true">✦ ✦ ✦</div>
        </div>
      </div>
      <div className="cover-swatches" role="radiogroup" aria-label="표지 색">
        {COVERS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={c.id === cover.id}
            aria-label={c.name}
            title={c.name}
            className={`cover-swatch${c.id === cover.id ? ' is-on' : ''}`}
            style={{ background: c.bg }}
            onClick={() => setCover(c.id)}
          />
        ))}
      </div>
      <p className="intro-skip">제목을 눌러 바꾸고, 노트를 눌러 열어요</p>
      <button type="button" className="btn btn-ink intro-open" onClick={open}>노트 열기</button>
    </div>
  );
}
