/**
 * 待辦事項應用的單一狀態容器（Zustand）。
 *
 * 這個 store 是前端唯一的 state 來源：列表、篩選、排序、載入／錯誤狀態、
 * 編輯中與刪除確認的暫存資料、以及 Toast 通知都在這裡。
 *
 * 規則：
 * - 所有會失敗的 action 都必須自行 `catch`，並以 `pushToast('error', message)` 呈現失敗；
 *   不得讓 rejected promise 逃逸，也不得靜默吞掉錯誤。
 * - `fetchTodos` 一律在呼叫當下透過 `get()` 讀取目前的 `filter`／`sort`，
 *   避免使用 store 定義時的 stale closure。
 */
import { create } from 'zustand'
import { ApiError } from '../api/client'
import { todosApi } from '../api/todos'
import type {
  CreateTodoInput,
  Toast,
  TodoCounts,
  TodoFilter,
  TodoItem,
  TodoSort,
  UpdateTodoInput,
} from '../types/todo'

/** Toast 自動消失的時間（毫秒） */
const TOAST_TIMEOUT = 4000

/** Toast id 遞增計數器（確保 id 單調遞增） */
let toastSeq = 0

/**
 * 列表請求序號：只有最新一次請求可以寫入 `items`／`counts`／`error`。
 *
 * 沒有這個保護時，先發出的慢請求可能比後發出的快請求更晚回應，
 * 讓畫面顯示舊篩選／舊排序的結果。
 */
let requestSeq = 0

/**
 * 將任意錯誤轉為可直接顯示的訊息。
 *
 * `ApiError` 帶有後端的中文訊息，為主要的訊息來源；
 * 其他錯誤（例如網路連線失敗時瀏覽器丟出的英文 "Failed to fetch"）
 * 一律改用中文通用訊息，避免介面上出現英文字串。
 */
function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return '網路連線失敗，請稍後再試'
}

/** `fetchTodos` 的選項 */
export interface FetchTodosOptions {
  /** 背景更新：不顯示 loading skeleton，也不清除既有的 loading 狀態 */
  silent?: boolean
}

export interface TodoState {
  // ---- 狀態 ----
  items: TodoItem[]
  counts: TodoCounts
  filter: TodoFilter
  sort: TodoSort
  loading: boolean
  error: string | null
  submitting: boolean
  editingId: number | null
  editingDraft: TodoItem | null
  deleteTarget: TodoItem | null
  clearConfirmOpen: boolean
  toasts: Toast[]

  // ---- Actions ----
  fetchTodos: (options?: FetchTodosOptions) => Promise<void>
  createTodo: (input: CreateTodoInput) => Promise<boolean>
  updateTodo: (id: number, input: UpdateTodoInput) => Promise<boolean>
  toggleTodo: (id: number) => Promise<void>
  deleteTodo: () => Promise<void>
  clearCompleted: () => Promise<void>
  setFilter: (filter: TodoFilter) => void
  setSort: (sort: TodoSort) => void
  startEditing: (item: TodoItem) => void
  cancelEditing: () => void
  openDeleteModal: (item: TodoItem) => void
  closeDeleteModal: () => void
  openClearConfirm: () => void
  closeClearConfirm: () => void
  pushToast: (type: Toast['type'], message: string) => void
  dismissToast: (id: number) => void
}

export const useTodoStore = create<TodoState>((set, get) => ({
  // ---- 初始狀態 ----
  items: [],
  counts: { all: 0, active: 0, completed: 0 },
  filter: 'all',
  sort: 'createdAt',
  loading: false,
  error: null,
  submitting: false,
  editingId: null,
  editingDraft: null,
  deleteTarget: null,
  clearConfirmOpen: false,
  toasts: [],

  /**
   * 取得任務列表。
   *
   * `silent: true` 時不將 `loading` 設為 true（背景更新不閃 skeleton），
   * 其餘行為與一般載入相同。篩選與排序在呼叫當下讀取，確保使用最新值。
   */
  fetchTodos: async (options) => {
    const silent = options?.silent ?? false
    const requestId = ++requestSeq
    // 在呼叫當下讀取目前的篩選／排序（不可使用定義時的 closure）
    const { filter, sort } = get()

    if (!silent) {
      set({ loading: true })
    }
    set({ error: null })

    try {
      const data = await todosApi.list(filter, sort)
      if (requestId !== requestSeq) return
      set({ items: data.items, counts: data.counts })
    } catch (error) {
      if (requestId !== requestSeq) return
      set({ error: toErrorMessage(error) })
    } finally {
      // 背景更新（silent）不設定也不清除 loading：
      // 只有會把 loading 設為 true 的前景請求才負責將它复位。
      // 已被更新的請求（requestId !== requestSeq）不得碰 loading，
      // 否則它晚到的 finally 會在 items 還是空的情況下清掉 loading，
      // 讓畫面誤顯示「沒有任何任務」而不是 loading skeleton。
      if (!silent && requestId === requestSeq) set({ loading: false })
    }
  },

  /** 新增任務；成功回傳 true（表單據此清空），失敗回傳 false */
  createTodo: async (input) => {
    set({ submitting: true })
    try {
      await todosApi.create(input)
      get().pushToast('success', '已新增任務')
      await get().fetchTodos()
      return true
    } catch (error) {
      get().pushToast('error', toErrorMessage(error))
      return false
    } finally {
      set({ submitting: false })
    }
  },

  /** 更新任務；成功回傳 true，並結束編輯狀態 */
  updateTodo: async (id, input) => {
    set({ submitting: true })
    try {
      await todosApi.update(id, input)
      get().pushToast('success', '已更新任務')
      set({ editingId: null, editingDraft: null })
      await get().fetchTodos()
      return true
    } catch (error) {
      get().pushToast('error', toErrorMessage(error))
      return false
    } finally {
      set({ submitting: false })
    }
  },

  /**
   * 切換完成狀態（樂觀更新）。
   *
   * 先在本地翻轉 `isCompleted` 並同步 `counts`，再呼叫 API：
   * 失敗時完整還原該筆任務與原本的 `counts`，並以 Toast 呈現錯誤。
   */
  toggleTodo: async (id) => {
    const { items, counts } = get()
    const target = items.find((item) => item.id === id)
    if (!target) return

    const originalCompleted = target.isCompleted
    const nextCompleted = !originalCompleted
    const previousCounts = counts

    set({
      items: items.map((item) =>
        item.id === id ? { ...item, isCompleted: nextCompleted } : item,
      ),
      counts: nextCompleted
        ? { ...counts, active: counts.active - 1, completed: counts.completed + 1 }
        : { ...counts, active: counts.active + 1, completed: counts.completed - 1 },
    })

    try {
      await todosApi.setCompletion(id, nextCompleted)
      // 樂觀更新已顯示新狀態，改用背景更新避免清單閃爍
      await get().fetchTodos({ silent: true })
    } catch (error) {
      set({
        items: get().items.map((item) =>
          item.id === id ? { ...item, isCompleted: originalCompleted } : item,
        ),
        counts: previousCounts,
      })
      get().pushToast('error', toErrorMessage(error))
    }
  },

  /** 刪除 `deleteTarget` 指向的任務 */
  deleteTodo: async () => {
    const target = get().deleteTarget
    if (!target) return

    try {
      await todosApi.remove(target.id)
      get().pushToast('success', '已刪除任務')
      set({ deleteTarget: null })
      await get().fetchTodos()
    } catch (error) {
      // 保留 deleteTarget，讓確認視窗維持開啟、使用者可以重試
      get().pushToast('error', toErrorMessage(error))
    }
  },

  /** 清除所有已完成任務 */
  clearCompleted: async () => {
    try {
      await todosApi.clearCompleted()
      get().pushToast('success', '已清除所有已完成任務')
      set({ clearConfirmOpen: false })
      await get().fetchTodos()
    } catch (error) {
      get().pushToast('error', toErrorMessage(error))
    }
  },

  /**
   * 切換篩選條件並重新載入。
   *
   * 不會清掉 `editingId`／`editingDraft`：表單的欄位狀態是元件內的 local state，
   * 只要 `editingId` 不變，`App.tsx` 的 `key={editingId ?? 'new'}` 就不變，
   * 表單不會重新掛載，使用者已輸入的內容在重新載入後仍然保留。
   */
  setFilter: (filter) => {
    set({ filter })
    void get().fetchTodos()
  },

  /**
   * 切換排序並重新載入。
   *
   * 與 `setFilter` 相同：不會放棄進行中的編輯，理由見該方法的說明。
   */
  setSort: (sort) => {
    set({ sort })
    void get().fetchTodos()
  },

  /** 進入編輯模式 */
  startEditing: (item) => {
    set({ editingId: item.id, editingDraft: item })
  },

  /** 取消編輯模式 */
  cancelEditing: () => {
    set({ editingId: null, editingDraft: null })
  },

  /** 開啟刪除確認視窗 */
  openDeleteModal: (item) => {
    set({ deleteTarget: item })
  },

  /** 關閉刪除確認視窗 */
  closeDeleteModal: () => {
    set({ deleteTarget: null })
  },

  /** 開啟「清除已完成」確認視窗 */
  openClearConfirm: () => {
    set({ clearConfirmOpen: true })
  },

  /** 關閉「清除已完成」確認視窗 */
  closeClearConfirm: () => {
    set({ clearConfirmOpen: false })
  },

  /** 加入一則 Toast，並於 4 秒後自動移除 */
  pushToast: (type, message) => {
    const id = ++toastSeq
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))

    setTimeout(() => {
      // 只移除自己那筆；若使用者已手動關閉，filter 不會產生變更
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
    }, TOAST_TIMEOUT)
  },

  /** 立即移除指定 Toast */
  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
  },
}))
