/**
 * 日期／時間的純函式工具（不依賴 API 與 React）。
 */
import type { TodoItem } from '../types/todo'

/** UTC ISO 字串 → `datetime-local` 所需的本地格式 YYYY-MM-DDTHH:mm */
export function toLocalInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * `datetime-local` 本地字串 → UTC ISO 字串（含 `Z`）；空字串回傳 null。
 *
 * 一定要送出帶明確 offset 的 ISO-8601：後端會以 `ToUniversalTime()` 正規化 `dueDate`，
 * 若送出不帶 offset 的字串會被視為 `DateTimeKind.Unspecified` 而被伺服器時區偏移。
 */
export function fromLocalInputValue(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

/** UTC ISO 字串 → 本地時間顯示字串 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** 未完成且截止時間已過 → 逾期 */
export function isOverdue(item: TodoItem): boolean {
  if (item.isCompleted || !item.dueDate) return false
  return new Date(item.dueDate).getTime() < Date.now()
}
