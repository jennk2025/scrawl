import { useState, type InputHTMLAttributes } from 'react';
import { HandwritingPad } from './HandwritingPad';
import { handwritingAvailable } from '../lib/handwriting';

/** 글자 입력칸 옆에 ✍ 버튼이 붙어서 손글씨로도 쓸 수 있는 입력칸 */
export function HandInput({
  value,
  onValue,
  className = '',
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onValue: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className={`hand-input ${className}`}>
      <input {...rest} value={value} onChange={(e) => onValue(e.target.value)} />
      {handwritingAvailable && <button type="button" className="pen-btn" title="손으로 쓰기" aria-label="손으로 쓰기" onClick={() => setOpen(true)}>
        ✍
      </button>}
      {open && (
        <HandwritingPad
          onClose={() => setOpen(false)}
          onPick={(t) => {
            onValue(value ? `${value} ${t}` : t);
            setOpen(false);
          }}
        />
      )}
    </span>
  );
}
