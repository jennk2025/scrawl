import type { CSSProperties } from 'react';
import { eachDayOfInterval, endOfMonth, startOfMonth } from 'date-fns';
import { usePlanner } from '../store/plannerStore';
import { todayISO, toISO } from '../lib/dates';
import { isScheduled, isStamped } from '../lib/habits';
import { Stamp } from './Stamp';

/** 습관 × 날짜 도트 표. 칸을 누르면 체크된다. 맨 아래 줄에는 도장이 찍힌다. */
export function HabitGrid({ month }: { month: Date }) {
  const habits = usePlanner((s) => s.habits);
  const days = usePlanner((s) => s.days);
  const toggleHabit = usePlanner((s) => s.toggleHabit);
  const dates = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map(toISO);
  const today = todayISO();

  if (!habits.length) return <p className="muted">아래에서 습관을 추가해 보세요.</p>;

  return (
    <div className="habit-grid-wrap">
      <table className="habit-grid">
        <thead>
          <tr>
            <th />
            {dates.map((d) => (
              <th key={d} className={d === today ? 'is-today' : ''}>{+d.slice(8)}</th>
            ))}
            <th>합</th>
          </tr>
        </thead>
        <tbody>
          {habits.map((h) => {
            const count = dates.filter((d) => days[d]?.habitChecks[h.id]).length;
            return (
              <tr key={h.id} style={{ '--dot': h.color } as CSSProperties}>
                <th scope="row">{h.name}</th>
                {dates.map((d) => {
                  const on = !!days[d]?.habitChecks[h.id];
                  const off = !isScheduled(h, d);
                  return (
                    <td key={d}>
                      <button
                        type="button"
                        className={`dot${on ? ' is-on' : ''}${off ? ' is-off' : ''}`}
                        aria-pressed={on}
                        aria-label={`${h.name} ${d}${off ? ' (쉬는 날)' : ''}`}
                        onClick={() => toggleHabit(d, h.id)}
                      />
                    </td>
                  );
                })}
                <td className="habit-sum">{count}</td>
              </tr>
            );
          })}
          <tr className="stamp-row">
            <th scope="row">도장</th>
            {dates.map((d) => (
              <td key={d}>{d <= today && isStamped(habits, days, d) ? <Stamp small /> : null}</td>
            ))}
            <td className="habit-sum">{dates.filter((d) => d <= today && isStamped(habits, days, d)).length}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
