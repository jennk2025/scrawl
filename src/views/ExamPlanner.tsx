import { useState } from 'react';
import { usePlanner } from '../store/plannerStore';
import type { Exam, ExamUnit } from '../types';
import { addDaysISO, fmt, todayISO } from '../lib/dates';
import { examProgress, examTaskTitle, planExam, rangeUnits } from '../lib/examPlanner';
import { DdayBadge, openExams } from '../components/DdayBadge';
import { CategorySelect } from '../components/TaskAdder';
import { HandInput } from '../components/HandInput';
import { ConfirmButton } from '../components/ConfirmButton';

const UNITS: ExamUnit[] = ['쪽', '강', '문제', '단원'];

/** 시험이나 중요한 일정을 적으면, 끝났다고 표시할 때까지 D-day를 보여 준다 */
export default function ExamPlanner() {
  const exams = usePlanner((s) => s.exams);
  const days = usePlanner((s) => s.days);
  const { addExam, replanExam, removeExam, setExamDone } = usePlanner.getState();
  const today = todayISO();

  const [form, setForm] = useState<Omit<Exam, 'id'>>({
    name: '',
    date: addDaysISO(today, 14),
    split: false,
    start: 1,
    end: 100,
    unit: '쪽',
    excludeDates: [],
    skipWeekends: false,
  });
  const [excl, setExcl] = useState('');
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const preview = form.split ? planExam({ ...form, id: 'preview' }, today, rangeUnits(form.start, form.end)) : [];
  const sizes = preview.map((p) => p.units.length);
  const error = !form.name.trim()
    ? '일정 이름을 적어 주세요.'
    : !form.split
      ? ''
      : form.end < form.start
        ? '범위 끝이 시작보다 작아요.'
        : !preview.length
          ? '오늘부터 일정 전날까지 공부할 날이 없어요. 날짜를 확인해 주세요.'
          : '';

  const open = openExams(exams);
  const finished = exams.filter((e) => e.done).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="exam-page">
      <h1 className="title">D-day</h1>
      <p className="muted">시험이나 중요한 일정을 적어 두면, 끝났다고 표시할 때까지 D-day가 보여요. 날짜가 지나면 D+로 이어져요.</p>

      <form
        className="paper-card exam-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (error) return;
          addExam({ ...form, name: form.name.trim() });
          setForm((f) => ({ ...f, name: '', split: false }));
        }}
      >
        <div className="row">
          <label>
            무슨 일정?
            <HandInput id="dday-name" value={form.name} onValue={(v) => set('name', v)} placeholder="예: 수학 중간고사" />
          </label>
          <label>
            날짜
            <input id="dday-date" type="date" value={form.date} onChange={(e) => e.target.value && set('date', e.target.value)} />
          </label>
        </div>

        <label className="check-line">
          <input id="dday-split" type="checkbox" checked={!!form.split} onChange={(e) => set('split', e.target.checked)} />
          시험 범위를 남은 날짜에 나눠서 할 일로 넣기 <span className="muted">(선택)</span>
        </label>

        {form.split && (
          <div className="split-box">
            <div className="row">
              <label>
                범위
                <span className="range-inputs">
                  <input id="dday-start" type="number" min={0} value={form.start} onChange={(e) => set('start', Number(e.target.value))} />
                  ~
                  <input id="dday-end" type="number" min={0} value={form.end} onChange={(e) => set('end', Number(e.target.value))} />
                  <select id="dday-unit" value={form.unit} onChange={(e) => set('unit', e.target.value as ExamUnit)}>
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </span>
              </label>
              <label>
                분류(형광펜 색)
                <CategorySelect value={form.categoryId} onChange={(id) => set('categoryId', id)} />
              </label>
            </div>
            <label className="check-line">
              <input id="dday-weekend" type="checkbox" checked={form.skipWeekends} onChange={(e) => set('skipWeekends', e.target.checked)} />
              주말에는 쉬기
            </label>
            <div className="row excl-row">
              <label>
                공부 못 하는 날
                <span className="range-inputs">
                  <input id="dday-excl" type="date" value={excl} onChange={(e) => setExcl(e.target.value)} />
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      if (excl && !form.excludeDates.includes(excl)) set('excludeDates', [...form.excludeDates, excl].sort());
                      setExcl('');
                    }}
                  >
                    추가
                  </button>
                </span>
              </label>
              <div className="chips">
                {form.excludeDates.map((d) => (
                  <button key={d} type="button" className="chip" onClick={() => set('excludeDates', form.excludeDates.filter((x) => x !== d))}>
                    {fmt(d, 'M/d')} ✕
                  </button>
                ))}
              </div>
            </div>
            {!error && preview.length > 0 && (
              <p className="exam-preview">
                오늘부터 <b>{preview.length}</b>일 동안 하루{' '}
                <b>{Math.min(...sizes) === Math.max(...sizes) ? sizes[0] : `${Math.min(...sizes)}~${Math.max(...sizes)}`}{form.unit}</b>씩{' '}
                <span className="muted">(첫날: {examTaskTitle(form, preview[0].units)})</span>
              </p>
            )}
          </div>
        )}

        {error && form.name && <span className="pen-red">{error}</span>}
        <button className="btn btn-ink" type="submit" disabled={!!error}>D-day 추가</button>
      </form>

      {!open.length && <p className="muted">진행 중인 D-day가 없어요.</p>}
      <ul className="exam-list">
        {open.map((ex) => {
          const split = ex.split !== false;
          const { total, done } = examProgress(days, ex);
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <li key={ex.id} className="paper-card exam-item">
              <DdayBadge exam={ex} from={today} />
              <div className="exam-info">
                <b>{ex.name}</b>
                <span className="muted">
                  {fmt(ex.date, 'M월 d일 (EEE)')}
                  {split && ` · ${ex.start}~${ex.end}${ex.unit}`}
                </span>
                {split && (
                  <>
                    <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                    <span className="muted">{done}/{total}{ex.unit} 완료 ({pct}%)</span>
                  </>
                )}
              </div>
              <div className="exam-actions">
                {split && ex.date > today && (
                  <button className="btn" type="button" onClick={() => replanExam(ex.id)} title="못 한 분량을 남은 날짜에 다시 나눠요">
                    다시 분배
                  </button>
                )}
                <button className="btn btn-ink" type="button" onClick={() => setExamDone(ex.id, true)}>끝났어요 ✓</button>
              </div>
            </li>
          );
        })}
      </ul>

      {finished.length > 0 && (
        <details className="done-list">
          <summary>끝난 일정 {finished.length}개</summary>
          <ul className="exam-list">
            {finished.map((ex) => (
              <li key={ex.id} className="exam-item is-finished">
                <span className="exam-info">
                  <s>{ex.name}</s>
                  <span className="muted">{fmt(ex.date, 'yyyy년 M월 d일')}</span>
                </span>
                <span className="exam-actions">
                  <button className="btn-text" type="button" onClick={() => setExamDone(ex.id, false)}>되돌리기</button>
                  <ConfirmButton className="btn-text pen-red" ask="완전히 삭제" onConfirm={() => removeExam(ex.id)}>삭제</ConfirmButton>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
