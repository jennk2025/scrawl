/** 손으로 꾹 찍은 듯한 빨간 도장 */
export function Stamp({ small, label = '참 잘했어요' }: { small?: boolean; label?: string }) {
  if (small) {
    return (
      <svg className="stamp-mini" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M7 12.5l3.2 3.2L17 8.6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <span className="done-stamp" role="img" aria-label={label}>
      <span className="stamp-ring">
        <b>{label}</b>
      </span>
    </span>
  );
}
