import type { DayEntry, Habit, ISODate, Task } from '../types';

export const MOODS = [
  { id: 'happy', emoji: '😊', label: '좋아요' },
  { id: 'love', emoji: '🥰', label: '행복해요' },
  { id: 'proud', emoji: '😎', label: '뿌듯해요' },
  { id: 'calm', emoji: '😌', label: '평온해요' },
  { id: 'tired', emoji: '😴', label: '피곤해요' },
  { id: 'sad', emoji: '😢', label: '속상해요' },
  { id: 'angry', emoji: '😠', label: '화나요' },
] as const;

export const moodEmoji = (id?: string) => MOODS.find((m) => m.id === id)?.emoji;

export interface NoteEntry {
  date: ISODate;
  main: string;
  diary: string;
  memo: string;
  mood?: string;
  done: Task[];
  habits: Habit[];
}

/** 노트에 보여 줄 만한 기록이 있는 날들 (날짜 오름차순) */
export function buildEntries(days: Record<ISODate, DayEntry>, habits: Habit[], prefix = ''): NoteEntry[] {
  return Object.keys(days)
    .filter((d) => d.startsWith(prefix))
    .sort()
    .map((date) => {
      const e = days[date];
      return {
        date,
        main: e.main.trim(),
        diary: (e.diary ?? '').trim(),
        memo: e.memo.trim(),
        mood: e.mood,
        done: e.tasks.filter((t) => t.done),
        habits: habits.filter((h) => e.habitChecks[h.id]),
      };
    })
    .filter((x) => x.main || x.diary || x.memo || x.mood || x.done.length || x.habits.length);
}
