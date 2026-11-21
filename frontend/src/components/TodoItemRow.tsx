import { ExclamationTriangleIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useTodoStore } from '../stores/todoStore'
import type { TodoItem } from '../types/todo'
import { formatDateTime, isOverdue } from '../utils/datetime'
import PriorityBadge from './PriorityBadge'

export default function TodoItemRow({ item }: { item: TodoItem }) {
  const toggleTodo = useTodoStore((state) => state.toggleTodo)
  const startEditing = useTodoStore((state) => state.startEditing)
  const openDeleteModal = useTodoStore((state) => state.openDeleteModal)

  const overdue = isOverdue(item)

  return (
    <article
      className={`flex items-start gap-3 rounded-lg border border-slate-200 p-4 shadow-sm ${
        item.isCompleted ? 'bg-gray-50' : 'bg-white'
      }`}
    >
      <input
        type="checkbox"
        checked={item.isCompleted}
        onChange={() => void toggleTodo(item.id)}
        aria-label={`將「${item.title}」標記為${item.isCompleted ? '未完成' : '已完成'}`}
        className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />

      <div className="min-w-0 flex-1">
        <h3
          className={`text-sm font-medium ${
            item.isCompleted ? 'line-through text-gray-400' : 'text-slate-800'
          }`}
        >
          {item.title}
        </h3>

        {item.description && (
          <p className="mt-1 text-sm text-slate-500">{item.description}</p>
        )}

        <p className="mt-1 text-xs text-gray-400">建立於 {formatDateTime(item.createdAt)}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <PriorityBadge priority={item.priority} />

        {item.dueDate && (
          <p
            className={`flex items-center gap-1 text-xs ${
              overdue ? 'text-red-600 font-semibold' : 'text-slate-500'
            }`}
          >
            {overdue && (
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600" aria-label="已逾期" />
            )}
            截止 {formatDateTime(item.dueDate)}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startEditing(item)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
            編輯
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(item)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
            刪除
          </button>
        </div>
      </div>
    </article>
  )
}
