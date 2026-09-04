# 公務車使用紀錄管理系統｜多人線上版

## 技術
Next.js + Supabase PostgreSQL + Supabase Auth + XLSX。

## 正式部署
1. 建立 Supabase project。
2. SQL Editor 執行 `supabase/schema.sql`。
3. 在 Authentication > Users 建立管理員/使用者帳號。
4. 建立 `.env.local`：NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_ANON_KEY、SUPABASE_SERVICE_ROLE_KEY。
5. `npm install`、`npm run build`。
6. 推送 GitHub 後在 Vercel 匯入，設定同樣環境變數。

## 目前已實作
- 多車牌首頁
- Supabase PostgreSQL 長期保存
- Email/密碼登入
- 使用者/地點/車輛資料表
- 使用者與地點下拉＋其他自行輸入
- 暫停點、時間排序
- 多用途
- 同車同日自動彙整
- 最早出發/最後結束時間與里程
- 加油費加總、加油里程保留各筆
- Excel 多工作表匯出

## 注意
目前 API 為「可部署的第一個正式架構版本」。上線前建議再補：管理員後台 CRUD、Supabase RLS、操作稽核紀錄、Excel 完整套用原始範本樣式、車輛基本資料與平均油耗欄位。
