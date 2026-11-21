/**
 * 待辦事項 API 的端點封裝。
 *
 * 這一層只描述「哪個端點、怎麼組參數」，實際的請求與錯誤處理交給 `client.ts` 的 `request`。
 *
 * 注意：`client.ts` 的 base URL（`VITE_API_BASE_URL`，預設 `/api`）已經包含 `/api` 前綴，
 * 因此下列路徑都寫成相對於 API root 的形式，實際請求網址為 `/api/todos...`。
 */
import { request } from './client'
import type {
  CreateTodoInput,
  TodoFilter,
  TodoItem,
  TodoListResponse,
  TodoSort,
  UpdateTodoInput,
} from '../types/todo'

export const todosApi = {
  /** 取得任務清單與各狀態數量（`counts` 為全量計數，不隨篩選縮小） */
  list(filter: TodoFilter, sort: TodoSort): Promise<TodoListResponse> {
    return request<TodoListResponse>(`/todos?filter=${filter}&sort=${sort}`)
  },

  /** 新增任務 */
  create(input: CreateTodoInput): Promise<TodoItem> {
    return request<TodoItem>('/todos', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  /** 更新任務 */
  update(id: number, input: UpdateTodoInput): Promise<TodoItem> {
    return request<TodoItem>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },

  /** 切換完成狀態 */
  setCompletion(id: number, isCompleted: boolean): Promise<TodoItem> {
    return request<TodoItem>(`/todos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted }),
    })
  },

  /** 刪除單筆任務 */
  remove(id: number): Promise<void> {
    return request<void>(`/todos/${id}`, { method: 'DELETE' })
  },

  /** 清除所有已完成任務 */
  clearCompleted(): Promise<void> {
    return request<void>('/todos/completed', { method: 'DELETE' })
  },
}
