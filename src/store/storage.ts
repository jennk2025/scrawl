import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { PlannerData } from '../types';

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
  return {
    days: data.days,
    exams: data.exams,
    categories: data.categories,
    habits: Array.isArray(data.habits) ? data.habits : [],
    inbox: Array.isArray(data.inbox) ? data.inbox : [],
    theme: data.theme === 'dark' || data.theme === 'light' ? data.theme : 'system',
    carryMode: data.carryMode === 'manual' ? 'manual' : 'auto',
    notebookCover: typeof data.notebookCover === 'string' ? data.notebookCover : 'navy',
    notebookTitle: typeof data.notebookTitle === 'string' && data.notebookTitle ? data.notebookTitle : 'my planner',
  };
}
