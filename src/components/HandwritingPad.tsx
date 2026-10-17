import { useCallback, useEffect, useRef, useState } from 'react';
import { googleRecognizer, type Stroke } from '../lib/handwriting';

const HEIGHT = 200;

/**
 * 손가락이나 펜으로 쓰면 글자로 바꿔 주는 패드.
 * 쓰기를 멈추면 잠시 뒤 자동으로 인식하고, 후보를 누르면 그 글자가 들어간다.
 */
export function HandwritingPad({ onPick, onClose }: { onPick: (text: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const timer = useRef<number>(undefined);
  const [width, setWidth] = useState(320);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle');
  const [error, setError] = useState('');
  const [hasInk, setHasInk] = useState(false);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = getComputedStyle(c).getPropertyValue('--ink').trim() || '#2b2a33';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of [...strokes.current, ...(current.current ? [current.current] : [])]) {
      ctx.beginPath();
      s.xs.forEach((x, i) => (i ? ctx.lineTo(x, s.ys[i]) : ctx.moveTo(x, s.ys[i])));
      if (s.xs.length === 1) ctx.lineTo(s.xs[0] + 0.1, s.ys[0]);
      ctx.stroke();
    }
  }, []);

  // 화면 폭에 맞추고 고해상도 화면에서도 선명하게
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const fit = () => {
      const w = c.parentElement?.clientWidth ?? 320;
      const dpr = window.devicePixelRatio || 1;
      c.width = w * dpr;
      c.height = HEIGHT * dpr;
      setWidth(w);
      redraw();
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [redraw]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(timer.current);
    };
  }, [onClose]);

  const recognize = async () => {
    if (!strokes.current.length) return;
    setStatus('busy');
    try {
      const result = await googleRecognizer.recognize(strokes.current, { width, height: HEIGHT }, 'ko');
      setCandidates(result.slice(0, 6));
      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error && e.message.startsWith('인식') ? e.message : '인터넷 연결을 확인해 주세요.');
      setStatus('error');
    }
  };

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)] as const;
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    window.clearTimeout(timer.current);
    const [x, y] = point(e);
    current.current = { xs: [x], ys: [y], ts: [Date.now()] };
    setHasInk(true);
    redraw();
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!current.current) return;
    const [x, y] = point(e);
    current.current.xs.push(x);
    current.current.ys.push(y);
    current.current.ts.push(Date.now());
    redraw();
  };
  const up = () => {
    if (!current.current) return;
    strokes.current.push(current.current);
    current.current = null;
    timer.current = window.setTimeout(recognize, 700);
  };

  const clear = () => {
    strokes.current = [];
    setCandidates([]);
    setStatus('idle');
    setHasInk(false);
    redraw();
  };
  const undo = () => {
    strokes.current.pop();
    setHasInk(strokes.current.length > 0);
    redraw();
    if (strokes.current.length) recognize();
    else setCandidates([]);
  };

  return (
    <div className="pad-backdrop" onClick={onClose}>
      <div className="pad paper-card" role="dialog" aria-label="손글씨 입력" onClick={(e) => e.stopPropagation()}>
        <div className="pad-head">
          <h3 className="title">✍ 손으로 쓰기</h3>
          <button type="button" className="btn-text" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className="pad-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="pad-canvas"
            style={{ height: HEIGHT }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          />
          {!hasInk && <span className="pad-hint">여기에 손가락이나 펜으로 써 보세요</span>}
        </div>
        <div className="pad-candidates" aria-live="polite">
          {status === 'busy' && <span className="muted">읽는 중…</span>}
          {status === 'error' && <span className="pen-red">{error}</span>}
          {status === 'idle' &&
            candidates.map((c, i) => (
              <button type="button" key={c + i} className={`chip${i === 0 ? ' is-best' : ''}`} onClick={() => onPick(c)}>
                {c}
              </button>
            ))}
        </div>
        <div className="pad-actions">
          <button type="button" className="btn" onClick={undo}>↶ 한 획 지우기</button>
          <button type="button" className="btn" onClick={clear}>전부 지우기</button>
          <button type="button" className="btn btn-ink" disabled={!candidates.length} onClick={() => onPick(candidates[0])}>
            넣기
          </button>
        </div>
        <p className="pad-note muted">글씨 획 모양만 Google 손글씨 인식 서버로 보내서 글자로 바꿔요.</p>
      </div>
    </div>
  );
}
