# TodoList Frontend

Vite + React 18 + TypeScript + Tailwind CSS v4 前端專案。

## 指令

```bash
npm install       # 安裝相依套件
npm run dev       # 啟動開發伺服器（http://localhost:5173）
npm run build     # 型別檢查 + 生產建置至 dist/
npm run preview   # 預覽建置結果
npm run lint      # Oxlint 靜態檢查
```

## 架構

- `vite.config.ts` — Vite 設定；`@vitejs/plugin-react` + `@tailwindcss/vite`，開發伺服器 port `5173`，`/api` 反向代理至 `http://localhost:5080`
- `src/index.css` — Tailwind CSS v4 進入點（`@import "tailwindcss"` + `@plugin "@tailwindcss/forms"`）；v4 不需要 `tailwind.config.js`
- `src/main.tsx` — React 進入點
- `src/App.tsx` — 根元件

## 環境變數

`.env.development` 定義 `VITE_API_BASE_URL=/api`，前端一律透過開發代理存取後端，不使用絕對 URL。
