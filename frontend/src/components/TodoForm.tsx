import { useState } from 'react'
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

  // 初始值直接由 editingDraft 推導，不在 effect 中 setState：
  // App.tsx 以 `key={editingId ?? 'new'}` 掛載本元件，編輯對象一變化就會重新掛載，
  // 因此這些初始值必定對應當下的編輯草稿，不會出現舊資料殘留的一幀。
  const [title, setTitle] = useState(() => editingDraft?.title ?? '')
  const [description, setDescription] = useState(() => editingDraft?.description ?? '')
  const [dueDate, setDueDate] = useState(() => toLocalInputValue(editingDraft?.dueDate ?? null))
  const [priority, setPriority] = useState<TodoPriority>(() => editingDraft?.priority ?? 2)
  const [error, setError] = useState<string | null>(null)

  const isEditing = editingId !== null

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

    if (editingId === null) {
      // 新增模式：key 維持 'new'，表單不會重新掛載，必須自行清空欄位
      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority(2)
      setError(null)
    } else {
      // 編輯模式：store 已把 editingId 清為 null，key 改變會重新掛載成空白的新增表單
      cancelEditing()
    }
  }

  function handleCancel() {
    // editingId 歸 null 後 key 改變，表單重新掛載並回到空白的新增模式
    cancelEditing()
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
