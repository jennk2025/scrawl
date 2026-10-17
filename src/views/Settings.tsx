import { useRef, useState, type CSSProperties } from 'react';
import { nextFreeColor, pickData, useActiveBook, usePlanner } from '../store/plannerStore';
import { exportBackup, parseBackup } from '../store/storage';
import type { CarryMode, PlannerData, Theme } from '../types';
import { todayISO } from '../lib/dates';
import { ColorPicker } from './Habits';
import { HandInput } from '../components/HandInput';
import { ConfirmButton } from '../components/ConfirmButton';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: '기기 설정 따르기' },
  { value: 'light', label: '☀ 크림 종이' },
  { value: 'dark', label: '☾ 밤 노트' },
];

const CARRY: { value: CarryMode; label: string; hint: string }[] = [
  { value: 'auto', label: '자동으로 넘기기', hint: '앱을 열 때 지난 날 못 한 일이 오늘로 알아서 넘어와요.' },
  { value: 'manual', label: '내가 직접 넘기기', hint: '자동으로 옮기지 않아요. 할 일의 → 버튼이나 오늘 화면의 "가져오기" 버튼으로 직접 옮겨요.' },
];

export default function Settings() {
  const theme = usePlanner((s) => s.theme);
  const categories = usePlanner((s) => s.categories);
  const carryMode = usePlanner((s) => s.carryMode);
  const book = useActiveBook();
  const title = book.title;
  const setNotebookTitle = (t: string) => usePlanner.getState().updateBook(book.id, { title: t });
  const { setTheme, setCarryMode, addCategory, removeCategory, importData } = usePlanner.getState();
  const [name, setName] = useState('');
  const [chosen, setChosen] = useState<string>();
  const [msg, setMsg] = useState('');
  const [pending, setPending] = useState<PlannerData | null>(null);
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const usedColors = categories.map((c) => c.color);
  const color = chosen ?? nextFreeColor(usedColors);

  const backupText = () => exportBackup(pickData(usePlanner.getState()));

  const download = () => {
    const blob = new Blob([backupText()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `planner-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copy = () => {
    const t = backupText();
    setText(t);
    navigator.clipboard
      ?.writeText(t)
      .then(() => setMsg('백업 내용을 복사했어요. 메모장 같은 곳에 붙여넣어 보관하세요.'))
      .catch(() => {
        setMsg('자동 복사가 안 돼서 아래 칸에 넣어 뒀어요. 전체 선택해서 복사해 주세요.');
        requestAnimationFrame(() => textRef.current?.select());
      });
  };

  const load = (raw: string) => {
    try {
      setPending(parseBackup(raw));
      setMsg('');
    } catch (e) {
      setPending(null);
      setMsg(e instanceof Error && !(e instanceof SyntaxError) ? e.message : '백업 내용을 읽지 못했어요. 복사한 내용 전체를 붙여넣었는지 확인해 주세요.');
    }
  };

  return (
    <div className="settings-page">
      <h1 className="title">설정</h1>

      <section className="paper-card side-card">
        <h2 className="note-label">테마</h2>
        <div className="seg">
          {THEMES.map((t) => (
            <button key={t.value} type="button" className={`btn${theme === t.value ? ' btn-ink' : ''}`} onClick={() => setTheme(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="paper-card side-card">
        <h2 className="note-label">못 한 일 넘기기</h2>
        <div className="seg">
          {CARRY.map((c) => (
            <button key={c.value} type="button" className={`btn${carryMode === c.value ? ' btn-ink' : ''}`} onClick={() => setCarryMode(c.value)}>
              {c.label}
            </button>
          ))}
        </div>
        <p className="muted">{CARRY.find((c) => c.value === carryMode)?.hint}</p>
      </section>

      <section className="paper-card side-card">
        <h2 className="note-label">노트 제목</h2>
        <HandInput id="notebook-title" className="grow" value={title} onValue={setNotebookTitle} maxLength={24} placeholder="my planner" aria-label="노트 제목" />
        <p className="muted">표지와 맨 위 이름에 보여요.</p>
      </section>

      <section className="paper-card side-card">
        <h2 className="note-label">분류 (분류마다 다른 형광펜 색)</h2>
        <ul className="manage-list">
          {categories.map((c) => (
            <li key={c.id}>
              <span className="hl" style={{ '--hl': c.color } as CSSProperties}>{c.name}</span>
              <ConfirmButton title="지우기" ask="삭제" onConfirm={() => removeCategory(c.id)}>✕</ConfirmButton>
            </li>
          ))}
        </ul>
        <form
          className="inbox-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addCategory(name.trim(), color);
            setName('');
            setChosen(undefined);
          }}
        >
          <HandInput id="new-category" className="grow" value={name} onValue={setName} placeholder="새 분류 (예: 과학)" aria-label="새 분류" />
          <ColorPicker value={color} onChange={setChosen} taken={usedColors} />
          <button className="btn btn-ink" type="submit">추가</button>
        </form>
      </section>

      <section className="paper-card side-card">
        <h2 className="note-label">백업</h2>
        <p className="muted">데이터는 지금 쓰는 브라우저에만 저장돼요. 가끔 백업해 두세요.</p>
        <div className="seg">
          <button type="button" className="btn btn-ink" onClick={download}>백업 파일 내려받기</button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>백업 파일 불러오기</button>
          <button type="button" className="btn" onClick={copy}>백업 내용 복사</button>
          <input
            ref={fileRef}
            id="backup-file"
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) load(await f.text());
            }}
          />
        </div>
        <label className="backup-text">
          <span className="muted">복사해 둔 백업 내용을 여기에 붙여넣으면 불러올 수 있어요.</span>
          <textarea id="backup-text" ref={textRef} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder='{"app": "hand-planner", …}' />
        </label>
        <div className="seg">
          <button type="button" className="btn" disabled={!text.trim()} onClick={() => load(text)}>붙여넣은 내용 불러오기</button>
        </div>

        {pending && (
          <div className="confirm-box">
            <p>
              시험 {pending.exams.length}개, 기록한 날 {Object.keys(pending.days).length}일이 든 백업이에요.
              불러오면 지금 데이터는 이 내용으로 바뀌어요.
            </p>
            <div className="seg">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  importData(pending);
                  setPending(null);
                  setText('');
                  setMsg('백업을 불러왔어요.');
                }}
              >
                바꾸기
              </button>
              <button type="button" className="btn-text" onClick={() => setPending(null)}>취소</button>
            </div>
          </div>
        )}
        {msg && <p role="status">{msg}</p>}
      </section>
    </div>
  );
}
