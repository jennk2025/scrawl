/** Scrawl 로고: 휘갈겨 쓴 S 한 획과 빨간 점 */
export function ScrawlMark({ size = 44 }: { size?: number }) {
  return (
    <svg className="scrawl-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="12" fill="var(--ink)" />
      <path
        d="M33 14C26 8 14 11 16 19C18 27 33 22 32 31C31 40 18 39 13 33"
        fill="none"
        stroke="var(--paper-card)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="36" r="3.2" fill="var(--pen-red)" />
    </svg>
  );
}

export function ScrawlBrand() {
  return (
    <div className="scrawl-brand">
      <ScrawlMark />
      <div className="scrawl-text">
        <b>Scrawl</b>
        <span>Daily Planner</span>
      </div>
    </div>
  );
}
