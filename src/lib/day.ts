import type { DayEntry, Task } from '../types';

export const emptyDay = (): DayEntry => ({ main: '', tasks: [], memo: '', habitChecks: {} });

/** 셀렉터에서 매번 새 객체를 만들지 않도록 쓰는 고정된 빈 날 */
export const EMPTY_DAY: DayEntry = Object.freeze(emptyDay()) as DayEntry;

/** 다른 날로 옮겨진(→) 할 일을 뺀, 그날 실제로 할 일 */
export const activeTasks = (e?: DayEntry): Task[] => (e?.tasks ?? []).filter((t) => !t.migratedTo);

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
