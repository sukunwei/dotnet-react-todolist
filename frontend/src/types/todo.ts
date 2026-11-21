/**
 * 待辦事項的共用型別定義。
 *
 * 對應後端 `TodoItemDto` 與查詢參數合約：
 * - `priority` 為數字 1（低）／2（中）／3（高），後端未註冊 `JsonStringEnumConverter`。
 * - `description` 無值時為 `null`（不是空字串）。
 * - `dueDate` 為 `null` 或帶 `Z` 的 UTC ISO-8601 字串；`createdAt` 為 UTC ISO-8601 字串。
 */

/** 優先級：1 = 低，2 = 中，3 = 高 */
export type TodoPriority = 1 | 2 | 3

/** 列表篩選條件 */
export type TodoFilter = 'all' | 'active' | 'completed'

/** 列表排序依據 */
export type TodoSort = 'createdAt' | 'dueDate'

/** 單筆待辦事項 */
export interface TodoItem {
  id: number
  title: string
  description: string | null
  isCompleted: boolean
  priority: TodoPriority
  /** UTC ISO-8601（含 `Z`）；無截止時間時為 `null` */
  dueDate: string | null
  /** UTC ISO-8601（含 `Z`） */
  createdAt: string
}

/** 各狀態的任務數量（後端永遠回傳全量計數，不隨篩選縮小） */
export interface TodoCounts {
  all: number
  active: number
  completed: number
}

/** `GET /api/todos` 的回應 */
export interface TodoListResponse {
  items: TodoItem[]
  counts: TodoCounts
}

/** 新增任務的請求內容 */
export interface CreateTodoInput {
  title: string
  description: string | null
  priority: TodoPriority
  /** UTC ISO-8601（含 `Z`）；無截止時間時為 `null` */
  dueDate: string | null
}

/** 更新任務的請求內容（與新增相同） */
export type UpdateTodoInput = CreateTodoInput

/** 通知（Toast）訊息 */
export interface Toast {
  id: number
  type: 'success' | 'error'
  message: string
}
