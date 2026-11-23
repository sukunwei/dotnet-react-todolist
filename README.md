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

## 資料庫

### 連線設定

連線字串位於 `backend/src/TodoList.Api/appsettings.json`：

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Port=3306;Database=todo_list;User=root;Password=;"
}
```

此為**僅供本機開發**的設定。要改用其他資料庫，可用環境變數覆寫（.NET Core 的 `ConnectionStrings__<名稱>` 慣例），無需修改檔案：

```bash
export ConnectionStrings__DefaultConnection="Server=localhost;Port=3306;Database=my_db;User=root;Password=secret;"
```

### 建立資料表

**正常情況不需要手動操作** —— 後端啟動時會自動執行 `db.Database.MigrateAsync()`，套用所有尚未套用的 Migration，資料庫與資料表都會一併建立（若 MySQL 連不上，應用會啟動失敗而非靜默忽略）。

若要手動操作，先安裝 EF Core CLI（版本需與 EF Core 9.0.23 一致）：

```bash
dotnet tool install --global dotnet-ef --version 9.0.23
```

接著（皆在 `backend/` 目錄執行）：

```bash
# 列出所有 Migration 與已套用狀態
dotnet ef migrations list --project src/TodoList.Infrastructure --startup-project src/TodoList.Api

# 手動套用 Migration（建立資料庫 + 資料表）
dotnet ef database update --project src/TodoList.Infrastructure --startup-project src/TodoList.Api

# 清空資料（保留結構）
mysql -u root -e "TRUNCATE TABLE todo_list.todo_items;"
```

### Schema

`todo_items`（InnoDB / utf8mb4）：

| 欄位 | 型別 | 限制 | 說明 |
|---|---|---|---|
| `id` | `int` | PK, AUTO_INCREMENT | 主鍵 |
| `title` | `varchar(100)` | NOT NULL | 任務標題，上限 100 字元 |
| `description` | `varchar(500)` | NULL | 詳細備註，上限 500 字元 |
| `is_completed` | `tinyint(1)` | NOT NULL, default 0 | 是否已完成 |
| `priority` | `int` | NOT NULL, default 2 | 1 = 低、2 = 中、3 = 高 |
| `due_date` | `datetime(6)` | NULL | 截止時間（UTC） |
| `created_at` | `datetime(6)` | NOT NULL | 建立時間（UTC） |

索引：`PRIMARY (id)`、`IX_todo_items_is_completed (is_completed)`、`IX_todo_items_created_at (created_at)`、`IX_todo_items_due_date (due_date)`。

> **時間一律以 UTC 儲存。** `due_date` 與 `created_at` 為 `datetime`（MySQL 不帶時區），應用層以 `ValueConverter` 讀回時標記為 UTC，JSON 輸出因此帶 `Z` 後綴。寫入 `due_date` 時**必須**是帶時區位移或以 `Z` 結尾的 ISO-8601 時間，否則會被拒絕（HTTP 400），以免時間點被平移到錯誤的瞬間。


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
