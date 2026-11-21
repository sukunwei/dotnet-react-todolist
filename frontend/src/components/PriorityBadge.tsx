import type { TodoPriority } from '../types/todo'

const styles: Record<TodoPriority, string> = {
  3: 'bg-red-100 text-red-700',
  2: 'bg-amber-100 text-amber-800',
  1: 'bg-emerald-100 text-emerald-700',
}

const labels: Record<TodoPriority, string> = {
  3: '高',
  2: '中',
  1: '低',
}

export default function PriorityBadge({ priority }: { priority: TodoPriority }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[priority]}`}
    >
      {labels[priority]}
    </span>
  )
}
