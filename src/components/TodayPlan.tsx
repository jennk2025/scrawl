import { Link } from 'react-router-dom';
import { usePlanner } from '../store/plannerStore';
import { fmt, fromISO, todayISO, weekParam } from '../lib/dates';
import { EMPTY_DAY } from '../lib/day';
import { countOverdue } from '../lib/carryOver';
import { HandInput } from './HandInput';
import { TaskAdder } from './TaskAdder';
import { TaskGroups } from './TaskGroups';

/** 첫 화면의 주인공: 오늘 계획을 바로 적고 체크하는 칸 */
export function TodayPlan() {
  const today = todayISO();
  const entry = usePlanner((s) => s.days[today]) ?? EMPTY_DAY;
  const setMain = usePlanner((s) => s.setMain);
  const manual = usePlanner((s) => s.carryMode === 'manual');
  const overdue = usePlanner((s) => (s.carryMode === 'manual' ? countOverdue(s.days, today) : 0));
  const runCarryOver = usePlanner((s) => s.runCarryOver);
  const tasks = entry.tasks.filter((t) => !t.migratedTo);
  const left = tasks.filter((t) => !t.done).length;
  const carried = tasks.filter((t) => t.carriedFrom && !t.done).length;
  const isSunday = fromISO(today).getDay() === 0;

  return (
    <section className="today-plan paper-card" aria-label="오늘 계획">
      <header className="tp-head">
        <div>
          <span className="eyebrow">TODAY</span>
          <h1 className="tp-date">
            {fmt(today, 'M월 d일')} <small>{fmt(today, 'EEEE')}</small>
          </h1>
        </div>
        <Link className="btn-text" to={`/day/${today}`}>노트 열기 →</Link>
      </header>

      <label className="tp-label" htmlFor="today-main">오늘의 메인</label>
      <HandInput
        id="today-main"
        className="main-input"
        value={entry.main}
        onValue={(v) => setMain(today, v)}
        placeholder="오늘 꼭 해낼 한 가지"
      />

      <div className="tp-label tp-row">
        <span>할 일</span>
        <span className="muted">{tasks.length ? `${left}개 남음` : ''}</span>
      </div>
      <ul className="task-list">
        <TaskGroups tasks={tasks} date={today} />
        {!tasks.length && <li className="muted empty-line">아직 없어요. 아래에 첫 할 일을 적어 보세요.</li>}
      </ul>
      <TaskAdder date={today} />

      {manual && overdue > 0 && (
        <p className="tp-foot">
          <button type="button" className="btn" onClick={() => runCarryOver()}>
            지난 날 못 한 일 {overdue}개 오늘로 가져오기
          </button>
        </p>
      )}

      {(carried > 0 || isSunday) && (
        <p className="tp-foot">
          {carried > 0 && <span className="pen-red">어제에서 넘어온 일 {carried}개</span>}
          {isSunday && <Link to={`/review/${weekParam(fromISO(today))}`}>이번 주 정리하기 →</Link>}
        </p>
      )}
    </section>
  );
}
