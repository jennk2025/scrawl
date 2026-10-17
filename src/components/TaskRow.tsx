import { useState, type DragEvent } from 'react';
import type { ISODate, Task } from '../types';
import { usePlanner } from '../store/plannerStore';
import { addDaysISO, fmt } from '../lib/dates';
import { HandCheckbox, Strike } from './Hand';
import { CategorySelect } from './TaskAdder';

export function TaskRow({
  task,
  date,
  drag,
}: {
  task: Task;
  date: ISODate;
  drag?: { onDragStart: () => void; onDrop: () => void };
}) {
  const { toggleTask, updateTask, removeTask, migrateTask } = usePlanner.getState();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const migrated = !!task.migratedTo;

  const commit = () => {
    if (draft.trim()) updateTask(date, task.id, { title: draft.trim() });
    setEditing(false);
  };

  return (
    <li
      className={`task-row${task.done ? ' is-done' : ''}${migrated ? ' is-migrated' : ''}`}
      draggable={!!drag && !editing}
      onDragStart={drag?.onDragStart}
      onDragOver={(e: DragEvent) => e.preventDefault()}
      onDrop={drag?.onDrop}
    >
      {drag && <span className="drag-handle" aria-hidden="true">⋮⋮</span>}
      <HandCheckbox checked={task.done} migrated={migrated} label={task.title} onChange={() => toggleTask(date, task.id)} />
      <div className="task-body">
        {editing ? (
          <input
            className="task-edit"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
        ) : (
          <span className="task-title" onDoubleClick={() => !migrated && setEditing(true)}>
            <Strike on={task.done}>{task.title}</Strike>
          </span>
        )}
        <span className="task-meta">
          {migrated && <span className="muted">→ {fmt(task.migratedTo!, 'M/d')}로 옮김</span>}
          {!migrated && task.carriedFrom && <span className="muted">↪ {fmt(task.carriedFrom, 'M/d')}부터</span>}
          {!migrated && !task.done && task.carryCount >= 3 && (
            <span className="pen-red nag">또 미룸 ×{task.carryCount}! 쪼개거나 지워 볼까요?</span>
          )}
        </span>
      </div>
      {!migrated && (
        <div className="task-tools">
          <CategorySelect value={task.categoryId} onChange={(id) => updateTask(date, task.id, { categoryId: id })} />
          {!task.done && (
            <button type="button" className="icon-btn" title="내일로 미루기" onClick={() => migrateTask(date, task.id, addDaysISO(date, 1))}>
              →
            </button>
          )}
          <button type="button" className="icon-btn" title="수정" onClick={() => setEditing(true)}>✎</button>
          <button type="button" className="icon-btn" title="지우기" onClick={() => removeTask(date, task.id)}>✕</button>
        </div>
      )}
    </li>
  );
}
