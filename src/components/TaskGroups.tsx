import type { CSSProperties } from 'react';
import type { ISODate, Task } from '../types';
import { usePlanner } from '../store/plannerStore';
import { TaskRow } from './TaskRow';

/** 할 일을 분류별로 묶고, 각 묶음 맨 위에 형광펜 칠한 분류 이름을 붙인다 */
export function TaskGroups({
  tasks,
  date,
  onDragStart,
  onDrop,
}: {
  tasks: Task[];
  date: ISODate;
  /** 넘기면 드래그로 순서를 바꿀 수 있다 (인덱스는 tasks 기준) */
  onDragStart?: (index: number) => void;
  onDrop?: (index: number) => void;
}) {
  const categories = usePlanner((s) => s.categories);

  const groups = categories
    .map((c) => ({ key: c.id, name: c.name as string | null, color: c.color as string | undefined, items: [] as { t: Task; i: number }[] }))
    .concat([{ key: '', name: null, color: undefined, items: [] }]);
  const byKey = new Map(groups.map((g) => [g.key, g]));
  tasks.forEach((t, i) => (byKey.get(t.categoryId ?? '') ?? groups[groups.length - 1]).items.push({ t, i }));
  const shown = groups.filter((g) => g.items.length);
  // 분류가 하나도 안 쓰였으면 머리글 없이 그대로 보여 준다
  const plain = shown.length === 1 && shown[0].name === null;

  return (
    <>
      {shown.map((g) => (
        <li key={g.key || 'none'} className="task-group">
          {!plain && (
            <div className="cat-head">
              <span className="hl" style={{ '--hl': g.color ?? 'var(--paper-2)' } as CSSProperties}>
                {g.name ?? '분류 없음'}
              </span>
              <small className="muted">{g.items.length}</small>
            </div>
          )}
          <ul className="task-list">
            {g.items.map(({ t, i }) => (
              <TaskRow
                key={t.id}
                task={t}
                date={date}
                drag={onDragStart && onDrop ? { onDragStart: () => onDragStart(i), onDrop: () => onDrop(i) } : undefined}
              />
            ))}
          </ul>
        </li>
      ))}
    </>
  );
}
