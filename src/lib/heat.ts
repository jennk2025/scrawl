import type { DayEntry } from '../types';

export function dayStats(e?: DayEntry) {
  const tasks = e?.tasks ?? [];
  return { total: tasks.length, done: tasks.filter((t) => t.done).length };
}

/** 잔디 진하기 0~4: 완료한 비율 기준 (옮겨진 할 일은 못 한 것으로 침) */
export function heatLevel(e?: DayEntry): 0 | 1 | 2 | 3 | 4 {
  const { total, done } = dayStats(e);
  if (!total || !done) return 0;
  const r = done / total;
  return r >= 1 ? 4 : r >= 0.67 ? 3 : r >= 0.34 ? 2 : 1;
}
