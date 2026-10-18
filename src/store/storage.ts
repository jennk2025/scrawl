import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { Book, PlannerData } from '../types';
import { booksFromLegacy, splitLegacyBooks } from '../lib/books';

/**
 * 저장소 레이어. 지금은 브라우저 localStorage에 저장한다.
 * 나중에 서버 DB(Supabase 등)로 옮길 때 이 파일만 바꾸면 된다.
 */
export const STORAGE_KEY = 'hand-planner';

const safeLocalStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* 저장 공간이 꽉 찼거나 막힌 경우: 앱은 계속 동작 */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* noop */
    }
  },
};

export const plannerStorage = createJSONStorage(() => safeLocalStorage);

export const exportBackup = (data: PlannerData) =>
  JSON.stringify({ app: 'hand-planner', version: 1, exportedAt: new Date().toISOString(), data }, null, 2);

export function parseBackup(text: string): PlannerData {
  const parsed = JSON.parse(text);
  const data = parsed?.data ?? parsed;
  if (!data || typeof data.days !== 'object' || !Array.isArray(data.exams) || !Array.isArray(data.categories))
    throw new Error('플래너 백업 파일이 아니에요.');
  const out: PlannerData = {
    days: data.days,
    exams: data.exams,
    categories: data.categories,
    habits: Array.isArray(data.habits) ? data.habits : [],
    inbox: Array.isArray(data.inbox) ? data.inbox : [],
    theme: data.theme === 'dark' || data.theme === 'light' ? data.theme : 'system',
    carryMode: data.carryMode === 'manual' ? 'manual' : 'auto',
    ...readBooks(data),
  };
  // 책마다 따로 기록하기 전의 백업이면 책별로 나눈다
  if (out.books.every((b) => !b.data)) out.books = splitLegacyBooks(out);
  return out;
}

/** 책장 읽기. 예전 백업(책장 없음)은 제목·표지를 이어받아 연도별로 책을 만든다. */
function readBooks(data: Record<string, unknown>): Pick<PlannerData, 'books' | 'activeBookId'> {
  const raw = data.books;
  const valid = (b: unknown): b is Book =>
    !!b && typeof b === 'object' && typeof (b as Book).id === 'string' && Number.isInteger((b as Book).year) &&
    typeof (b as Book).title === 'string' && typeof (b as Book).cover === 'string';
  const books = Array.isArray(raw) && raw.some(valid)
    ? raw.filter(valid)
    : booksFromLegacy(
        data.days as PlannerData['days'],
        typeof data.notebookTitle === 'string' ? data.notebookTitle : undefined,
        typeof data.notebookCover === 'string' ? data.notebookCover : undefined,
      );
  const year = new Date().getFullYear();
  const active = books.find((b) => b.id === data.activeBookId) ?? books.find((b) => b.year === year) ?? books[0];
  return { books, activeBookId: active.id };
}
