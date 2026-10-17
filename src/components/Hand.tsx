import type { CSSProperties, ReactNode } from 'react';

/** 손으로 그린 듯한 체크박스 */
export function HandCheckbox({
  checked,
  onChange,
  migrated,
  label,
  small,
}: {
  checked: boolean;
  onChange?: () => void;
  migrated?: boolean;
  label: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      className={`hcheck${checked ? ' is-on' : ''}${migrated ? ' is-migrated' : ''}${small ? ' is-small' : ''}`}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={migrated || !onChange}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.();
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          className="hcheck-box"
          d="M4 5 C 9 4.2, 15 4.6, 20 4 C 20.5 9, 19.6 15, 20.2 20 C 14 20.4, 9 19.6, 4.2 20.1 C 3.8 15, 4.4 9, 4 5 Z"
        />
        {migrated ? (
          <path className="hcheck-mark" d="M6 12 L18 12 M13 7 L18 12 L13 17" />
        ) : (
          checked && <path className="hcheck-mark" pathLength={1} d="M7 12.5 L10.5 16 L18.5 6" />
        )}
      </svg>
    </button>
  );
}

/** 체크하면 손으로 쓱 긋는 취소선 */
export function Strike({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span className={`strike${on ? ' on' : ''}`}>
      {children}
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength={1} d="M1 6 C 20 3, 35 8, 55 5 S 85 4, 99 6" />
      </svg>
    </span>
  );
}

/** 오늘 날짜에 그리는 동그라미 */
export function TodayCircle() {
  return (
    <svg className="today-circle" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M22 4 C 10 3, 3 12, 4 21 C 5 31, 15 37, 24 35 C 33 33, 38 24, 36 15 C 34 7, 25 3, 15 6" />
    </svg>
  );
}

/** 형광펜 칠한 글자 */
export function Highlight({ color, children, className = '' }: { color?: string; children: ReactNode; className?: string }) {
  return (
    <span className={`hl ${className}`} style={color ? ({ '--hl': color } as CSSProperties) : undefined}>
      {children}
    </span>
  );
}
