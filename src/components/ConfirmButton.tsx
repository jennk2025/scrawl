import { useEffect, useState, type ReactNode } from 'react';

/**
 * 한 번 누르면 "정말?" 버튼으로 바뀌고, 한 번 더 눌러야 실행된다.
 * 브라우저 confirm 창이 막힌 곳(예: claude.ai 아티팩트)에서도 동작한다.
 */
export function ConfirmButton({
  children,
  ask,
  onConfirm,
  className = 'icon-btn',
  title,
}: {
  children: ReactNode;
  ask: string;
  onConfirm: () => void;
  className?: string;
  title?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 5000);
    return () => window.clearTimeout(t);
  }, [armed]);

  if (!armed)
    return (
      <button type="button" className={className} title={title} onClick={() => setArmed(true)}>
        {children}
      </button>
    );
  return (
    <span className="confirm-inline" role="group">
      <button
        type="button"
        className="btn btn-danger"
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
      >
        {ask}
      </button>
      <button type="button" className="btn-text" onClick={() => setArmed(false)}>
        취소
      </button>
    </span>
  );
}
