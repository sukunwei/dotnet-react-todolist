import { useTodoStore } from '../stores/todoStore'
import type { TodoFilter, TodoItem } from '../types/todo'
import TodoItemRow from './TodoItemRow'

const EMPTY_MESSAGES: Record<TodoFilter, string> = {
  all: '還沒有任何任務，先新增一筆吧。',
  active: '目前沒有進行中的任務。',
  completed: '目前沒有已完成的任務。',
}

export default function TodoList({ items }: { items: TodoItem[] }) {
  const filter = useTodoStore((state) => state.filter)

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
        {EMPTY_MESSAGES[filter]}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <TodoItemRow key={item.id} item={item} />
      ))}
    </div>
  )
}
