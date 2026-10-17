import { useState } from 'react';
import type { ISODate } from '../types';
import { usePlanner } from '../store/plannerStore';
import { HandInput } from './HandInput';

export function CategorySelect({ value, onChange }: { value?: string; onChange: (id?: string) => void }) {
  const categories = usePlanner((s) => s.categories);
  const color = categories.find((c) => c.id === value)?.color;
  return (
    <select
      className="cat-select"
      style={{ background: color ?? 'transparent' }}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      aria-label="분류"
    >
      <option value="">분류 없음</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export function TaskAdder({ date }: { date: ISODate }) {
  const addTask = usePlanner((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState<string>();
  return (
    <form
      className="task-adder"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        addTask(date, title.trim(), cat);
        setTitle('');
      }}
    >
      <HandInput className="grow" value={title} onValue={setTitle} placeholder="+ 할 일 적기" aria-label="새 할 일" />
      <CategorySelect value={cat} onChange={setCat} />
      <button className="btn btn-ink" type="submit">추가</button>
    </form>
  );
}
