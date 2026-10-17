import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Book, CarryMode, Category, DayEntry, Exam, Habit, ISODate, PlannerData, Task, Theme } from '../types';
import { carryOver } from '../lib/carryOver';
import { emptyDay, newId } from '../lib/day';
import { todayISO } from '../lib/dates';
import { bookId, booksFromLegacy } from '../lib/books';
import { doneUnits, examTaskTitle, planExam, rangeUnits } from '../lib/examPlanner';
import { STORAGE_KEY, plannerStorage } from './storage';

export const HIGHLIGHTS = [
  '#ffd6e0', '#fff1a8', '#c8f0c8', '#cfe3ff', '#e5d4ff', '#ffd9b3',
  '#bdeee9', '#f7c6ec', '#e3eaa0', '#ffbfae', '#cdd8ea', '#ecd9b0',
];

/** 이미 쓴 색을 피해서 다음 형광펜 색을 고른다 (다 썼으면 새 색을 만든다) */
export function nextFreeColor(used: string[]): string {
  const taken = new Set(used.map((c) => c.toLowerCase()));
  const free = HIGHLIGHTS.find((c) => !taken.has(c));
  if (free) return free;
  for (let i = 0; ; i++) {
    const c = `hsl(${(i * 47) % 360} 70% ${82 - (Math.floor(i / 8) % 3) * 4}%)`;
    if (!taken.has(c)) return c;
  }
}

/** 국어·수학·영어 분류는 '공부'로 합치고(기록은 그대로 옮김), 빠진 기본 분류를 채운다 */
function mergeSubjects(data: PlannerData) {
  const SUBJECTS = ['국어', '수학', '영어'];
  const defaults = initialData().categories;
  const study = data.categories.find((c) => c.name === '공부') ?? defaults[0];
  const removed = new Set(data.categories.filter((c) => SUBJECTS.includes(c.name)).map((c) => c.id));
  const kept = data.categories.filter((c) => !removed.has(c.id));
  const missing = defaults.filter((d) => !kept.some((c) => c.name === d.name));
  data.categories = [...kept, ...missing];
  const remap = (id?: string) => (id && removed.has(id) ? study.id : id);
  for (const e of Object.values(data.days ?? {})) for (const t of e.tasks) t.categoryId = remap(t.categoryId);
  for (const x of data.exams ?? []) x.categoryId = remap(x.categoryId);
}

const initialData = (): PlannerData => ({
  days: {},
  exams: [],
  categories: [
    { id: 'study', name: '공부', color: HIGHLIGHTS[3] },
    { id: 'work', name: '일', color: HIGHLIGHTS[5] },
    { id: 'life', name: '일상', color: HIGHLIGHTS[1] },
    { id: 'health', name: '운동', color: HIGHLIGHTS[2] },
    { id: 'plan', name: '약속', color: HIGHLIGHTS[0] },
    { id: 'etc', name: '기타', color: HIGHLIGHTS[4] },
  ],
  habits: [
    { id: 'h-read', name: '독서 30분', color: HIGHLIGHTS[4] },
    { id: 'h-move', name: '운동', color: HIGHLIGHTS[2] },
  ],
  inbox: [],
  theme: 'system',
  carryMode: 'auto',
  books: [{ id: bookId(new Date().getFullYear()), year: new Date().getFullYear(), title: 'my planner', cover: 'navy' }],
  activeBookId: bookId(new Date().getFullYear()),
});

interface Actions {
  setMain: (date: ISODate, main: string) => void;
  setMemo: (date: ISODate, memo: string) => void;
  setDiary: (date: ISODate, diary: string) => void;
  setMood: (date: ISODate, mood: string | undefined) => void;
  addTask: (date: ISODate, title: string, categoryId?: string) => void;
  updateTask: (date: ISODate, id: string, patch: Partial<Task>) => void;
  toggleTask: (date: ISODate, id: string) => void;
  removeTask: (date: ISODate, id: string) => void;
  moveTask: (date: ISODate, from: number, to: number) => void;
  /** 할 일을 다른 날로 보낸다 (원래 날짜엔 → 표시) */
  migrateTask: (date: ISODate, id: string, target: ISODate) => void;
  toggleHabit: (date: ISODate, habitId: string) => void;
  addExam: (exam: Omit<Exam, 'id'>) => void;
  replanExam: (id: string) => void;
  removeExam: (id: string) => void;
  /** 일정 이름·날짜 고치기. 이름을 바꾸면 분배된 할 일 제목도 같이 바뀐다 */
  updateExam: (id: string, patch: Partial<Pick<Exam, 'name' | 'date'>>) => void;
  /** 일정을 끝냄(또는 되돌림). 끝내면 남은 분배 할 일은 정리한다 */
  setExamDone: (id: string, done: boolean) => void;
  addCategory: (name: string, color: string) => void;
  removeCategory: (id: string) => void;
  addHabit: (name: string, color: string, weekdays?: number[]) => void;
  setHabitWeekdays: (id: string, weekdays: number[]) => void;
  removeHabit: (id: string) => void;
  addInbox: (text: string) => void;
  removeInbox: (id: string) => void;
  scheduleInbox: (id: string, date: ISODate, categoryId?: string) => void;
  runCarryOver: () => number;
  setTheme: (t: Theme) => void;
  setCarryMode: (m: CarryMode) => void;
  /** 새 책(연도 일기장)을 만들고 id를 돌려준다. 그 해 책이 이미 있으면 그 책을 돌려준다. */
  addBook: (year: number, title: string, cover: string) => string;
  updateBook: (id: string, patch: Partial<Pick<Book, 'title' | 'cover'>>) => void;
  /** 책장에서만 뺀다. 날짜별 기록은 지우지 않는다 (같은 해 책을 다시 만들면 돌아온다) */
  removeBook: (id: string) => void;
  setActiveBook: (id: string) => void;
  importData: (data: PlannerData) => void;
}

export type PlannerState = PlannerData & Actions;

const withDay = (s: PlannerData, date: ISODate, fn: (e: DayEntry) => DayEntry) => ({
  days: { ...s.days, [date]: fn(s.days[date] ?? emptyDay()) },
});

const mapTasks = (s: PlannerData, date: ISODate, fn: (tasks: Task[]) => Task[]) =>
  withDay(s, date, (e) => ({ ...e, tasks: fn(e.tasks) }));

/** 시험 분량을 날짜별 할 일로 넣는다 */
function addExamTasks(days: Record<ISODate, DayEntry>, exam: Exam, units: number[]) {
  const next = { ...days };
  for (const { date, units: u } of planExam(exam, todayISO(), units)) {
    const e = next[date] ?? emptyDay();
    const task: Task = {
      id: newId(),
      title: examTaskTitle(exam, u),
      done: false,
      categoryId: exam.categoryId,
      examId: exam.id,
      examUnits: u,
      carryCount: 0,
    };
    next[date] = { ...e, tasks: [...e.tasks, task] };
  }
  return next;
}

/** 시험에 딸린 미완료 할 일을 모두 지운다 */
function stripOpenExamTasks(days: Record<ISODate, DayEntry>, examId: string) {
  const next: Record<ISODate, DayEntry> = {};
  for (const [d, e] of Object.entries(days))
    next[d] = e.tasks.some((t) => t.examId === examId && !t.done)
      ? { ...e, tasks: e.tasks.filter((t) => t.examId !== examId || t.done) }
      : e;
  return next;
}

export const usePlanner = create<PlannerState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      setMain: (date, main) => set((s) => withDay(s, date, (e) => ({ ...e, main }))),
      setMemo: (date, memo) => set((s) => withDay(s, date, (e) => ({ ...e, memo }))),
      setDiary: (date, diary) => set((s) => withDay(s, date, (e) => ({ ...e, diary }))),
      setMood: (date, mood) => set((s) => withDay(s, date, (e) => ({ ...e, mood }))),

      addTask: (date, title, categoryId) =>
        set((s) =>
          mapTasks(s, date, (ts) => [...ts, { id: newId(), title, done: false, categoryId, carryCount: 0 }]),
        ),
      updateTask: (date, id, patch) =>
        set((s) => mapTasks(s, date, (ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))),
      toggleTask: (date, id) =>
        set((s) =>
          mapTasks(s, date, (ts) => ts.map((t) => (t.id === id && !t.migratedTo ? { ...t, done: !t.done } : t))),
        ),
      removeTask: (date, id) => set((s) => mapTasks(s, date, (ts) => ts.filter((t) => t.id !== id))),
      moveTask: (date, from, to) =>
        set((s) =>
          mapTasks(s, date, (ts) => {
            const copy = [...ts];
            const [item] = copy.splice(from, 1);
            if (item) copy.splice(to, 0, item);
            return copy;
          }),
        ),
      migrateTask: (date, id, target) =>
        set((s) => {
          const task = s.days[date]?.tasks.find((t) => t.id === id);
          if (!task || task.done || task.migratedTo || target === date) return {};
          const moved: Task = {
            ...task,
            id: newId(),
            carriedFrom: task.carriedFrom ?? date,
            carryCount: task.carryCount + 1,
          };
          const marked = mapTasks(s, date, (ts) => ts.map((t) => (t.id === id ? { ...t, migratedTo: target } : t)));
          const tgt = marked.days[target] ?? emptyDay();
          return { days: { ...marked.days, [target]: { ...tgt, tasks: [...tgt.tasks, moved] } } };
        }),

      toggleHabit: (date, habitId) =>
        set((s) =>
          withDay(s, date, (e) => ({ ...e, habitChecks: { ...e.habitChecks, [habitId]: !e.habitChecks[habitId] } })),
        ),

      addExam: (input) =>
        set((s) => {
          const exam: Exam = { ...input, id: newId() };
          const days = exam.split ? addExamTasks(s.days, exam, rangeUnits(exam.start, exam.end)) : s.days;
          return { exams: [...s.exams, exam], days };
        }),
      replanExam: (id) =>
        set((s) => {
          const exam = s.exams.find((x) => x.id === id);
          if (!exam) return {};
          const done = doneUnits(s.days, id);
          const left = rangeUnits(exam.start, exam.end).filter((u) => !done.has(u));
          return { days: addExamTasks(stripOpenExamTasks(s.days, id), exam, left) };
        }),
      setExamDone: (id, done) =>
        set((s) => ({
          exams: s.exams.map((x) => (x.id === id ? { ...x, done } : x)),
          days: done ? stripOpenExamTasks(s.days, id) : s.days,
        })),
      updateExam: (id, patch) =>
        set((s) => {
          const old = s.exams.find((x) => x.id === id);
          if (!old) return {};
          const exam = { ...old, ...patch };
          const exams = s.exams.map((x) => (x.id === id ? exam : x));
          if (exam.name === old.name) return { exams };
          const days: Record<ISODate, DayEntry> = {};
          for (const [d, e] of Object.entries(s.days))
            days[d] = e.tasks.some((t) => t.examId === id && t.examUnits)
              ? { ...e, tasks: e.tasks.map((t) => (t.examId === id && t.examUnits ? { ...t, title: examTaskTitle(exam, t.examUnits) } : t)) }
              : e;
          return { exams, days };
        }),
      removeExam: (id) =>
        set((s) => ({ exams: s.exams.filter((x) => x.id !== id), days: stripOpenExamTasks(s.days, id) })),

      addCategory: (name, color) =>
        set((s) => {
          // 분류마다 다른 색: 이미 쓰는 색이면 안 쓴 색으로 바꾼다
          const used = s.categories.map((c) => c.color);
          const picked = used.includes(color) ? nextFreeColor(used) : color;
          return { categories: [...s.categories, { id: newId(), name, color: picked } satisfies Category] };
        }),
      removeCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
      addHabit: (name, color, weekdays) =>
        set((s) => ({ habits: [...s.habits, { id: newId(), name, color, weekdays } satisfies Habit] })),
      setHabitWeekdays: (id, weekdays) =>
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, weekdays } : h)) })),
      removeHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

      addInbox: (text) =>
        set((s) => ({ inbox: [{ id: newId(), text, createdAt: new Date().toISOString() }, ...s.inbox] })),
      removeInbox: (id) => set((s) => ({ inbox: s.inbox.filter((i) => i.id !== id) })),
      scheduleInbox: (id, date, categoryId) => {
        const item = get().inbox.find((i) => i.id === id);
        if (!item) return;
        get().addTask(date, item.text, categoryId);
        get().removeInbox(id);
      },

      runCarryOver: () => {
        const { days, moved } = carryOver(get().days, todayISO(), newId);
        if (moved) set({ days });
        return moved;
      },
      setTheme: (theme) => set({ theme }),
      setCarryMode: (carryMode) => set({ carryMode }),
      addBook: (year, title, cover) => {
        const id = bookId(year);
        if (get().books.some((b) => b.id === id)) return id;
        set((s) => ({ books: [...s.books, { id, year, title, cover }].sort((a, b) => a.year - b.year) }));
        return id;
      },
      updateBook: (id, patch) => set((s) => ({ books: s.books.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      removeBook: (id) =>
        set((s) => {
          if (s.books.length <= 1) return {};
          const books = s.books.filter((b) => b.id !== id);
          return { books, activeBookId: s.activeBookId === id ? books[0].id : s.activeBookId };
        }),
      setActiveBook: (activeBookId) => set({ activeBookId }),
      importData: (data) => set(data),
    }),
    {
      name: STORAGE_KEY,
      storage: plannerStorage,
      version: 5,
      // 기록은 그대로 두고 분류만 정리한다 (v3: 과목 분류 합치기, v4: 분류마다 다른 색, v5: 연도별 책장)
      migrate: (persisted, version) => {
        const data = persisted as PlannerData & { notebookTitle?: string; notebookCover?: string };
        if (!Array.isArray(data?.categories)) return data as PlannerState;
        if (version < 5 || !Array.isArray(data.books) || !data.books.length) {
          data.books = booksFromLegacy(data.days ?? {}, data.notebookTitle, data.notebookCover);
          delete data.notebookTitle;
          delete data.notebookCover;
        }
        if (!data.books.some((b) => b.id === data.activeBookId)) {
          const y = new Date().getFullYear();
          data.activeBookId = (data.books.find((b) => b.year === y) ?? data.books[0]).id;
        }
        if (version < 3) mergeSubjects(data);
        const all = data.categories.map((c) => c.color);
        const used: string[] = [];
        data.categories = data.categories.map((c) => {
          const color = used.includes(c.color) ? nextFreeColor([...used, ...all]) : c.color;
          used.push(color);
          return color === c.color ? c : { ...c, color };
        });
        return data as PlannerState;
      },
      partialize: pickData,
    },
  ),
);

export function pickData(s: PlannerState): PlannerData {
  return {
    days: s.days,
    exams: s.exams,
    categories: s.categories,
    habits: s.habits,
    inbox: s.inbox,
    theme: s.theme,
    carryMode: s.carryMode,
    books: s.books,
    activeBookId: s.activeBookId,
  };
}

/** 지금 펼쳐 둔 책 (책장이 비는 일은 없지만 혹시 모르니 첫 권으로) */
export const useActiveBook = (): Book =>
  usePlanner((s) => s.books.find((b) => b.id === s.activeBookId) ?? s.books[0]);
