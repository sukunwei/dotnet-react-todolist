# Web TodoList

ASP.NET Core Web API + React 18 單頁應用程式的 Web 待辦清單。

## 技術棧

| | |
|---|---|
| 後端 | .NET 10（`net10.0`）、ASP.NET Core Web API、EF Core 9.0.23 + Pomelo（MySQL）、Swagger |
| 前端 | Vite 8、React 18.3.1、TypeScript 5.9.3、Zustand 5.1.0、Tailwind CSS v4（`@tailwindcss/forms`）、Heroicons |

## 架構

後端採四層分層，依賴方向單向內指：

```
Api ──► Application ──► Domain
 │                        ▲
 └────► Infrastructure ──┘
```

`Domain` 不參照任何專案；Repository **介面**置於 `Domain`、**實作**置於 `Infrastructure`；實體不外洩至 API 層，由 `TodoItemMapping` 轉為 DTO。

前端資料流單向：`components → zustand store → api/*`，元件不直接呼叫 API。

## 執行

前置條件：.NET SDK 10、Node ≥ 22.12、MySQL 8+（`localhost:3306`、`root`、空密碼）。

```bash
# 後端 → http://localhost:5080 （Swagger UI：/swagger）
cd backend
dotnet run --project src/TodoList.Api

# 前端 → http://localhost:5173
cd frontend
npm install
npm run dev
```

EF Core Migration 於啟動時自動套用，會建立 `todo_list` 資料庫與 `todo_items` 表。前端開發伺服器將 `/api` 代理至 `http://localhost:5080`。

## API

Base path `/api/todos`，共 7 個端點。

| Method | Route | 說明 |
|---|---|---|
| GET | `/api/todos?filter={all\|active\|completed}&sort={createdAt\|dueDate}` | 取得任務清單與各狀態數量 |
| GET | `/api/todos/{id}` | 取得單筆任務 |
| POST | `/api/todos` | 新增任務 |
| PUT | `/api/todos/{id}` | 更新任務 |
| PATCH | `/api/todos/{id}/status` | 切換完成狀態 |
| DELETE | `/api/todos/{id}` | 刪除單筆 |
| DELETE | `/api/todos/completed` | 清除所有已完成任務 |

錯誤回應統一為 `ProblemDetails`。所有時間以 UTC 儲存與傳輸，JSON 一律帶 `Z` 後綴。

## 文件

| 文件 | 內容 |
|---|---|
| [`docs/prd.md`](docs/prd.md) | 產品需求 |
| [`docs/技術文檔.md`](docs/技術文檔.md) | 架構、資料模型、API 合約、視覺規格 |
| [`docs/plan.md`](docs/plan.md) | 實作計劃 |
| [`docs/驗收報告.md`](docs/驗收報告.md) | 端對端驗收結果（截圖見 `docs/screenshots/`） |
