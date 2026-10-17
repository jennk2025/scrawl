import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { usePlanner } from '../store/plannerStore';
import { addDaysISO, fmt, fromISO, isValidISO, monthParam, todayISO } from '../lib/dates';
import { EMPTY_DAY } from '../lib/day';
import { HandCheckbox } from '../components/Hand';
import { HandInput } from '../components/HandInput';
import { TaskAdder } from '../components/TaskAdder';
import { TaskGroups } from '../components/TaskGroups';
import { DdayBadge } from '../components/DdayBadge';
import { Stamp } from '../components/Stamp';
import { currentStreak, isScheduled, isStamped } from '../lib/habits';
import { MOODS } from '../lib/notebook';

export default function DayNote() {
  const { date } = useParams();
  if (!isValidISO(date)) return <Navigate to={`/day/${todayISO()}`} replace />;
  // 날짜가 바뀌면 입력 상태를 새로 시작
  return <DayPage key={date} date={date} />;
}

function DayPage({ date }: { date: string }) {
  const entry = usePlanner((s) => s.days[date]) ?? EMPTY_DAY;
  const habits = usePlanner((s) => s.habits);
  const exams = usePlanner((s) => s.exams);
  const days = usePlanner((s) => s.days);
  const { setMain, setMemo, setDiary, setMood, toggleHabit, moveTask } = usePlanner.getState();
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const today = todayISO();
  const upcoming = exams.filter((e) => !e.done && e.date >= date).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
  const open = entry.tasks.filter((t) => !t.migratedTo);
  const doneCount = open.filter((t) => t.done).length;
  // 쉬는 요일의 습관은 숨기되, 이미 체크했다면 보여 준다
  const todayHabits = habits.filter((h) => isScheduled(h, date) || entry.habitChecks[h.id]);
  const stamped = isStamped(habits, days, date);

  return (
    <div className="day-wrap">
      <nav className="day-nav">
        <Link className="btn-text" to={`/day/${addDaysISO(date, -1)}`}>‹ 어제</Link>
        <Link className="btn btn-ink" to={`/month/${monthParam(fromISO(date))}`}>달력으로 돌아가기</Link>
        <Link className="btn-text" to={`/day/${addDaysISO(date, 1)}`}>내일 ›</Link>
      </nav>

      <article className="notebook paper-card">
        <header className="note-head">
          <h1 className="note-date">
            {fmt(date, 'M월 d일')} <small>{fmt(date, 'EEEE')}</small>
          </h1>
          {date === today && <span className="today-flag">오늘</span>}
          <div className="note-ddays">
            {upcoming.map((e) => <DdayBadge key={e.id} exam={e} from={date} />)}
          </div>
        </header>

        <section className="note-section">
          <h2 className="note-label">오늘의 메인</h2>
          <HandInput
            className="main-input"
            value={entry.main}
            onValue={(v) => setMain(date, v)}
            placeholder="오늘 꼭 해낼 한 가지"
            aria-label="오늘의 메인"
          />
        </section>

        <section className="note-section">
          <h2 className="note-label">
            할 일 <span className="muted">{doneCount}/{open.length}</span>
          </h2>
          <ul className="task-list">
            <TaskGroups
              tasks={entry.tasks}
              date={date}
              onDragStart={setDragIdx}
              onDrop={(i) => {
                if (dragIdx !== null && dragIdx !== i) moveTask(date, dragIdx, i);
                setDragIdx(null);
              }}
            />
            {!entry.tasks.length && <li className="muted empty-line">아직 할 일이 없어요. 아래에 적어 보세요.</li>}
          </ul>
          <TaskAdder date={date} />
        </section>

        {todayHabits.length > 0 && (
          <section className="note-section habit-section">
            <h2 className="note-label">습관</h2>
            {stamped && <Stamp />}
            <ul className="habit-checks">
              {todayHabits.map((h) => (
                <li key={h.id}>
                  <HandCheckbox
                    checked={!!entry.habitChecks[h.id]}
                    label={h.name}
                    onChange={() => toggleHabit(date, h.id)}
                  />
                  <span className="hl" style={{ ['--hl' as string]: h.color }}>{h.name}</span>
                  {currentStreak(h, days, date) > 0 && <small className="streak">🔥{currentStreak(h, days, date)}</small>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="note-section diary-section">
          <h2 className="note-label">오늘의 일기</h2>
          <div className="mood-row" role="radiogroup" aria-label="오늘의 기분">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={entry.mood === m.id}
                title={m.label}
                className={`mood${entry.mood === m.id ? ' is-on' : ''}`}
                onClick={() => setMood(date, entry.mood === m.id ? undefined : m.id)}
              >
                {m.emoji}
              </button>
            ))}
          </div>
          <textarea
            className="memo lined diary"
            rows={9}
            value={entry.diary ?? ''}
            onChange={(e) => setDiary(date, e.target.value)}
            placeholder="오늘은 어땠나요? 있었던 일, 느낀 점을 편하게 적어 보세요."
          />
        </section>

        <section className="note-section">
          <h2 className="note-label">메모</h2>
          <textarea
            className="memo lined"
            rows={3}
            value={entry.memo}
            onChange={(e) => setMemo(date, e.target.value)}
            placeholder="짧은 메모, 기억할 것"
          />
        </section>
      </article>
    </div>
  );
}
