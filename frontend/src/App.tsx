import { useEffect } from 'react'
import ConfirmModal from './components/ConfirmModal'
import FilterTabs from './components/FilterTabs'
import ToastContainer from './components/ToastContainer'
import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'
import { useTodoStore } from './stores/todoStore'
import type { TodoSort } from './types/todo'

export default function App() {
  const items = useTodoStore((state) => state.items)
  const counts = useTodoStore((state) => state.counts)
  const filter = useTodoStore((state) => state.filter)
  const sort = useTodoStore((state) => state.sort)
  const loading = useTodoStore((state) => state.loading)
  const error = useTodoStore((state) => state.error)
  const deleteTarget = useTodoStore((state) => state.deleteTarget)
  const clearConfirmOpen = useTodoStore((state) => state.clearConfirmOpen)
  const toasts = useTodoStore((state) => state.toasts)

  const fetchTodos = useTodoStore((state) => state.fetchTodos)
  const setFilter = useTodoStore((state) => state.setFilter)
  const setSort = useTodoStore((state) => state.setSort)
  const deleteTodo = useTodoStore((state) => state.deleteTodo)
  const closeDeleteModal = useTodoStore((state) => state.closeDeleteModal)
  const clearCompleted = useTodoStore((state) => state.clearCompleted)
  const closeClearConfirm = useTodoStore((state) => state.closeClearConfirm)
  const openClearConfirm = useTodoStore((state) => state.openClearConfirm)
  const dismissToast = useTodoStore((state) => state.dismissToast)

  // 掛載時載入一次列表
  useEffect(() => {
    void fetchTodos()
  }, [fetchTodos])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">TodoList</h1>
        <p className="mt-1 text-sm text-slate-500">管理你的待辦事項</p>
      </header>

      <div className="mt-6">
        <TodoForm />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <FilterTabs counts={counts} active={filter} onChange={setFilter} />

        <div className="flex items-center gap-3">
          <select
            aria-label="排序方式"
            value={sort}
            onChange={(event) => setSort(event.target.value as TodoSort)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="createdAt">建立時間</option>
            <option value="dueDate">截止日期</option>
          </select>

          <button
            type="button"
            onClick={openClearConfirm}
            disabled={counts.completed === 0}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            清除所有已完成
          </button>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-lg border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void fetchTodos()}
              className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              重試
            </button>
          </div>
        ) : (
          <TodoList items={items} />
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="確定刪除這項任務？"
        description={deleteTarget ? `「${deleteTarget.title}」刪除後無法復原。` : ''}
        confirmText="刪除"
        onConfirm={() => void deleteTodo()}
        onCancel={closeDeleteModal}
      />

      <ConfirmModal
        open={clearConfirmOpen}
        title="確定清除所有已完成任務？"
        description={`目前共有 ${counts.completed} 項已完成的任務，將一併刪除且無法復原。`}
        confirmText="全部清除"
        onConfirm={() => void clearCompleted()}
        onCancel={closeClearConfirm}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
