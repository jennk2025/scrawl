/** 'yyyy-MM-dd' 형식의 날짜 문자열 */
export type ISODate = string;

export interface Task {
  id: string;
  title: string;
  done: boolean;
  categoryId?: string;
  /** 시험 역산 플래너가 만든 할 일이면 그 시험 id */
  examId?: string;
  /** 이 할 일이 맡은 시험 범위 번호들 (예: 45~62쪽) */
  examUnits?: number[];
  /** 처음 계획했던 날짜 (이월된 할 일에만 있음) */
  carriedFrom?: ISODate;
  /** 몇 번 미뤄졌는지 */
  carryCount: number;
  /** 이 날짜에서 다른 날로 옮겨졌으면 옮겨간 날짜 (→ 표시) */
  migratedTo?: ISODate;
}

export interface DayEntry {
  main: string;
  tasks: Task[];
  memo: string;
  habitChecks: Record<string, boolean>;
  /** 오늘의 일기 (메모와 따로) */
  diary?: string;
  /** 오늘의 기분 (lib/notebook.ts MOODS의 id) */
  mood?: string;
}

export type ExamUnit = '쪽' | '강' | '문제' | '단원';

export interface Exam {
  id: string;
  name: string;
  /** 시험 날짜 (이 날은 공부 분량을 배정하지 않음) */
  date: ISODate;
  /** 예전 버전 데이터 호환용 */
  startDate?: ISODate;
  /** 범위를 나눠서 날짜별 할 일로 넣었는지 (예전 데이터는 undefined = 넣음) */
  split?: boolean;
  /** 끝났다고 표시하면 D-day를 그만 보여 준다 */
  done?: boolean;
  start: number;
  end: number;
  unit: ExamUnit;
  categoryId?: string;
  excludeDates: ISODate[];
  skipWeekends: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  /** 하는 요일 (일=0 … 토=6). 비어 있거나 없으면 매일 */
  weekdays?: number[];
}

export interface InboxItem {
  id: string;
  text: string;
  createdAt: string;
}

export type Theme = 'system' | 'light' | 'dark';

/** 미완료 할 일을 다음 날로: 앱이 알아서(auto) / 내가 직접(manual) */
export type CarryMode = 'auto' | 'manual';

export interface PlannerData {
  days: Record<ISODate, DayEntry>;
  exams: Exam[];
  categories: Category[];
  habits: Habit[];
  inbox: InboxItem[];
  theme: Theme;
  carryMode: CarryMode;
  /** 책장에 꽂힌 일기장들 (연도마다 한 권) */
  books: Book[];
  /** 지금 펼쳐 둔 책 */
  activeBookId: string;
}

/** 한 해 치 일기장. 기록은 날짜로 저장되어 있어서 연도가 곧 책을 정한다. */
export interface Book {
  id: string;
  year: number;
  title: string;
  /** 표지 색 id (lib/covers.ts) */
  cover: string;
}
