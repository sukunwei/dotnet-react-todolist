import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTodoStore } from '../stores/todoStore'
import type { CreateTodoInput, TodoPriority } from '../types/todo'
import { fromLocalInputValue, toLocalInputValue } from '../utils/datetime'

const MAX_TITLE = 100
const MAX_DESCRIPTION = 500

export default function TodoForm() {
  const editingId = useTodoStore((state) => state.editingId)
  const editingDraft = useTodoStore((state) => state.editingDraft)
  const submitting = useTodoStore((state) => state.submitting)
  const createTodo = useTodoStore((state) => state.createTodo)
  const updateTodo = useTodoStore((state) => state.updateTodo)
  const cancelEditing = useTodoStore((state) => state.cancelEditing)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TodoPriority>(2)
  const [error, setError] = useState<string | null>(null)

  const isEditing = editingId !== null

  // 進入／離開編輯模式時，把編輯草稿帶入表單（截止時間需轉成本地時間格式）
  useEffect(() => {
    if (editingId !== null && editingDraft) {
      setTitle(editingDraft.title)
      setDescription(editingDraft.description ?? '')
      setDueDate(toLocalInputValue(editingDraft.dueDate))
      setPriority(editingDraft.priority)
      setError(null)
    } else {
      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority(2)
      setError(null)
    }
  }, [editingId, editingDraft])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = title.trim()
    if (trimmedTitle.length === 0) {
      setError('請輸入任務標題')
      return
    }
    if (trimmedTitle.length > MAX_TITLE) {
      setError(`標題最長 ${MAX_TITLE} 個字`)
      return
    }
    setError(null)

    const payload: CreateTodoInput = {
      title: trimmedTitle,
      description: description.trim() || null,
      priority,
      // 送出前一定要轉成帶 Z 的 UTC ISO 字串，否則後端會套用伺服器時區偏移
      dueDate: fromLocalInputValue(dueDate),
    }

    const success =
      editingId === null ? await createTodo(payload) : await updateTodo(editingId, payload)

    if (!success) return

    setTitle('')
    setDescription('')
    setDueDate('')
    setPriority(2)
    if (editingId !== null) cancelEditing()
  }

  function handleCancel() {
    cancelEditing()
    setTitle('')
    setDescription('')
    setDueDate('')
    setPriority(2)
    setError(null)
  }

  const inputClass =
    'block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-base font-semibold text-slate-900">
        {isEditing ? '編輯任務' : '新增任務'}
      </h2>

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="todo-title" className="block text-sm font-medium text-slate-700">
            標題
          </label>
          <input
            id="todo-title"
            type="text"
            maxLength={MAX_TITLE}
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：完成季度報告"
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div>
          <label htmlFor="todo-description" className="block text-sm font-medium text-slate-700">
            備註
          </label>
          <textarea
            id="todo-description"
            maxLength={MAX_DESCRIPTION}
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="（選填）"
            className={`mt-1 ${inputClass}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="todo-due-date" className="block text-sm font-medium text-slate-700">
              截止時間
            </label>
            <input
              id="todo-due-date"
              type="datetime-local"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div>
            <label htmlFor="todo-priority" className="block text-sm font-medium text-slate-700">
              優先級
            </label>
            <select
              id="todo-priority"
              value={String(priority)}
              onChange={(event) => setPriority(Number(event.target.value) as TodoPriority)}
              className={`mt-1 ${inputClass}`}
            >
              <option value="3">高 (3)</option>
              <option value="2">中 (2)</option>
              <option value="1">低 (1)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '儲存中…' : isEditing ? '儲存變更' : '＋ 新增'}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
        )}
      </div>
    </form>
  )
}
