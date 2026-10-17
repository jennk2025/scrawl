import { useState, type CSSProperties } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, startOfMonth } from 'date-fns';
import { HIGHLIGHTS, nextFreeColor, usePlanner } from '../store/plannerStore';
import { fmt, todayISO, toISO } from '../lib/dates';
import { WEEKDAY_CHIPS, bestStreak, currentStreak, isStamped } from '../lib/habits';
import { HabitGrid } from '../components/HabitGrid';
import { HandInput } from '../components/HandInput';
import { ConfirmButton } from '../components/ConfirmButton';
import { Stamp } from '../components/Stamp';

export function ColorPicker({
  value,
  onChange,
  taken = [],
}: {
  value: string;
  onChange: (c: string) => void;
  /** 이미 다른 데서 쓰는 색 (고를 수 없게 흐리게 표시) */
  taken?: string[];
}) {
  return (
    <span className="color-picker" role="radiogroup" aria-label="색">
      {HIGHLIGHTS.map((c) => {
        const used = taken.includes(c) && c !== value;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === value}
            disabled={used}
            title={used ? '이미 쓰는 색' : undefined}
            className={`swatch${c === value ? ' is-on' : ''}${used ? ' is-taken' : ''}`}
            style={{ '--sw': c } as CSSProperties}
            onClick={() => onChange(c)}
          />
        );
      })}
    </span>
  );
}

/** 월~일 요일 고르기. 아무것도 안 고르면 매일. */
function WeekdayChips({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const every = value.length === 0 || value.length === 7;
  return (
    <span className="weekday-chips" role="group" aria-label="하는 요일">
      {WEEKDAY_CHIPS.map(({ day, label }) => {
        const on = every || value.includes(day);
        return (
          <button
            key={day}
            type="button"
            aria-pressed={on}
            className={`chip${on ? ' is-on' : ''}`}
            onClick={() => {
              const base = every ? WEEKDAY_CHIPS.map((c) => c.day) : value;
              const next = base.includes(day) ? base.filter((d) => d !== day) : [...base, day];
              onChange(next.length === 7 ? [] : next);
            }}
          >
            {label}
          </button>
        );
      })}
    </span>
  );
}

export default function Habits() {
  const habits = usePlanner((s) => s.habits);
  const days = usePlanner((s) => s.days);
  const { addHabit, removeHabit, setHabitWeekdays } = usePlanner.getState();
  const [month, setMonth] = useState(() => new Date());
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>();
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const today = todayISO();

  // 습관마다 다른 색을 기본으로 (직접 고를 수도 있다)
  const pickedColor = color ?? nextFreeColor(habits.map((h) => h.color));
  const stamps = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
    .map(toISO)
    .filter((d) => d <= today && isStamped(habits, days, d)).length;

  return (
    <div>
      <h1 className="title">습관 트래커</h1>
      <div className="view-nav">
        <button type="button" className="nav-arrow" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="지난달">‹</button>
        <h2 className="title">{fmt(month, 'yyyy년 M월')}</h2>
        <button type="button" className="nav-arrow" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="다음 달">›</button>
        <span className="stamp-count"><Stamp small /> 이달의 도장 <b>{stamps}</b>개</span>
      </div>
      <section className="paper-card side-card">
        <HabitGrid month={month} />
        <p className="muted">회색 칸은 쉬는 요일이에요. 그날 할 습관을 모두 체크하면 도장이 찍혀요.</p>
      </section>

      <h2 className="title">습관 관리</h2>
      <form
        className="paper-card inbox-form habit-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addHabit(name.trim(), pickedColor, weekdays);
          setName('');
          setColor(undefined);
          setWeekdays([]);
        }}
      >
        <HandInput className="grow" value={name} onValue={setName} placeholder="새 습관 (예: 물 2L)" aria-label="새 습관" />
        <ColorPicker value={pickedColor} onChange={setColor} />
        <WeekdayChips value={weekdays} onChange={setWeekdays} />
        <button className="btn btn-ink" type="submit">추가</button>
      </form>
      <ul className="manage-list habit-manage">
        {habits.map((h) => {
          const cur = currentStreak(h, days, today);
          const best = bestStreak(h, days, today);
          return (
            <li key={h.id}>
              <span className="hl" style={{ '--hl': h.color } as CSSProperties}>{h.name}</span>
              <span className="streak" title="오늘까지 이어진 날">
                🔥 {cur}일 연속<small className="muted"> · 최고 {best}일</small>
              </span>
              <WeekdayChips value={h.weekdays ?? []} onChange={(v) => setHabitWeekdays(h.id, v)} />
              <ConfirmButton title="지우기" ask="삭제" onConfirm={() => removeHabit(h.id)}>
                ✕
              </ConfirmButton>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
