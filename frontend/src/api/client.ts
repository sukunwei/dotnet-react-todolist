/**
 * 共用的 `fetch` wrapper。
 *
 * 職責：統一 base URL 與 `Content-Type`、解析 JSON、將非 2xx 回應正規化為 `ApiError`。
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

/** API 呼叫失敗時拋出的錯誤，帶有 HTTP 狀態碼與可供顯示的訊息 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 將錯誤回應轉為 `ApiError`。
 *
 * 訊息解析順序固定為 `errors` → `detail` → `title`：
 * ASP.NET Core 的 ModelState 驗證錯誤會把真正的中文訊息放在 `errors` 字典內
 * （此時 `title` 只是英文樣板 "One or more validation errors occurred."），
 * 其他錯誤（404、查詢參數錯誤等）則把中文訊息放在 `detail`。
 *
 * 例外：5xx 伺服器錯誤一律改用中文通用訊息，因為後端只會回傳英文的 `title`。
 */
async function parseError(res: Response): Promise<ApiError> {
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // 回應不是 JSON，維持 body 為 null
  }

  const problem = body as
    | { title?: string; detail?: string; errors?: Record<string, string[]> }
    | null

  const fieldError: string | undefined = problem?.errors
    ? Object.values(problem.errors).flat()[0]
    : undefined

  // 伺服器端未預期的例外（5xx）只會回傳英文的 "Internal Server Error" 樣板，
  // 直接顯示會讓全中文介面出現英文字串，因此改用中文通用訊息。
  const message =
    res.status >= 500
      ? '伺服器發生錯誤，請稍後再試'
      : (fieldError ?? problem?.detail ?? problem?.title ?? `操作失敗（HTTP ${res.status}）`)

  return new ApiError(res.status, message)
}

/**
 * 發出 API 請求並回傳解析後的 JSON。
 *
 * @param path 相對於 API base URL 的路徑，例如 `/todos?filter=all&sort=createdAt`
 */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    throw await parseError(res)
  }

  // 204 No Content 沒有回應主體，不能嘗試解析 JSON
  if (res.status === 204) {
    return undefined as T
  }

  return (await res.json()) as T
}
