# E2E Skeleton — Test Scenarios (AC aligned)

各テストは Playwright で実装し、タイトルに「[AC: <ID>]」を含めています。ここでは「テスト名・前提・操作・期待結果」を整理します。
最初のAC（MVPの最小ハッピーシナリオ）は [AC: TDA-001]（`GET /api/tasks` が 200 で JSON配列）をGREENにすることとします。
ヘルスチェック: webServer 起動後に `/api/tasks` が 200/JSON で応答しない場合は環境不整合（PORT/BASE_URL/webServer）として Dev-BE に差し戻し。

TDA-S-001 API — List tasks (Task model)
- [AC: TDA-001] GET /api/tasks は 200 と JSON配列
  - 前提: なし（ストアは空/任意）
  - 操作: `GET /api/tasks`
  - 期待: ステータス200、配列(JSON)
- [AC: TDA-004] Content-Type は application/json
  - 前提: なし
  - 操作: `GET /api/tasks`
  - 期待: `content-type` に `application/json`
- [AC: TDA-003] createdAt 降順で返却
  - 前提: `older` 作成→少し待機→`newer` 作成
  - 操作: `GET /api/tasks`
  - 期待: 先頭が `newer`、`createdAt` 降順
- [AC: TDA-002] 各要素の形状: id,title,done,createdAt(ISO8601)
  - 前提: 1件以上作成済み
  - 操作: `GET /api/tasks`
  - 期待: 各要素に `id,title,done,createdAt`、`createdAt` が ISO8601 解析可能

TDA-S-002 UI — Render task list
- [AC: TDA-005] `[role="list"][aria-label="tasks"]` が存在
  - 前提: なし
  - 操作: `GET /` に遷移
  - 期待: ロケータが可視
- [AC: TDA-008] 0件時 `data-testid="empty-tasks"` で "No tasks yet." を表示
  - 前提: ストア空 (`resetTasks` 実施)
  - 操作: `/` 表示
  - 期待: `data-testid="empty-tasks"` が "No tasks yet." を表示
- [AC: TDA-006] listitem として title 表示
  - 前提: `task A`, `task B` をAPIで作成
  - 操作: `/` 表示
  - 期待: listitem が2件、先頭に `task B`
- [AC: TDA-007] 新しい順（createdAt 降順）で表示
  - 前提: `older`→待機→`newer`
  - 操作: `/` 表示
  - 期待: 先頭が `newer`

TDA-S-003 Create task (UI + API)
- [AC: TDA-009] `#new_task` に入力し Enter で POST（title は trim）
  - 前提: `/` 表示
  - 操作: `#new_task` に `"  Buy milk  "` 入力→Enter
  - 期待: 先頭アイテムに `Buy milk`
- [AC: TDA-010] 201返却→一覧先頭に追加・入力クリア
  - 前提: `/` 表示
  - 操作: `#new_task` に `Task X`→Enter
  - 期待: 先頭に `Task X`、`#new_task` は空
- [AC: TDA-011] 生成Taskは `done=false`、`createdAt` はサーバ側付与
  - 前提: 1件作成
  - 操作: APIで `/api/tasks` 取得
  - 期待: 先頭の `done=false`、`createdAt` は ISO8601

TDA-S-004 Toggle task done (UI + API)
- [AC: TDA-012] クリックで PATCH `/api/tasks/:id` → 200、UIは `aria-checked` 反映
  - 前提: `toggle me` 作成
  - 操作: 先頭アイテムのチェックボタンをクリック
  - 期待: `aria-checked=false→true`
- [AC: TDA-013] 再クリックで元に戻せる（永続化）
  - 前提: `toggle twice` 作成
  - 操作: チェック→アンチェック
  - 期待: `aria-checked=true→false`、API側でも `done=false`

TDA-S-005 Delete task (UI + API)
- [AC: TDA-014] `data-testid="delete-task"` の削除ボタンを表示
  - 前提: 1件作成
  - 操作: `/` 表示
  - 期待: `data-testid="delete-task"` が可視
- [AC: TDA-015] クリックで DELETE → 200 `{ok:true}`、UIから除去、0件で空状態
  - 前提: 1件作成
  - 操作: 削除ボタンをクリック
  - 期待: 該当 listitem が消える、0件で “No tasks yet.”

TDA-S-006 Validation & errors (contract)
- [AC: TDA-016] 空/空白のみ `title` は 400 `{error:"TITLE_REQUIRED"}`、UIで `role=alert` を `#new_task` 近傍に表示
  - 前提: `/` 表示
  - 操作: `#new_task` に `"   "` 入力→Enter（API実行）
  - 期待: 400ハンドリング、`role=alert` が入力近傍に表示（要Dev-FE対応）
- [AC: TDA-017] 未存在 `:id` の PATCH/DELETE は 404 `{error:"TASK_NOT_FOUND"}`
  - 前提: なし
  - 操作: API 直接呼び出し（`/api/tasks/does-not-exist`）
  - 期待: 404 と `{error:"TASK_NOT_FOUND"}`
- [AC: TDA-018] 非booleanの `done` は 400 `{error:"DONE_REQUIRED"}`
  - 前提: なし
  - 操作: `PATCH /api/tasks/:id` に `{done:"yes"}`
  - 期待: 400 と `{error:"DONE_REQUIRED"}`

TDA-S-007 In‑memory store & IDs
- [AC: TDA-019] プロセス生存中保持、再起動で空（READMEに明記）
  - 前提: 2件作成→サーバ継続→一覧確認→サーバ再起動
  - 操作: 再起動後 `/api/tasks`
  - 期待: 空配列（手動/別ジョブで確認・skipped）
- [AC: TDA-020] 連続1000件作成でも `id` 一意
  - 前提: なし
  - 操作: APIで1000件作成→id重複チェック
  - 期待: すべて一意（重いので nightly/skip）

メモ:
- すべてのシナリオは `tests/e2e/_helpers.ts` の `resetTasks` を活用して独立性を担保
- webServerは `PORT` を尊重し、`BASE_URL` に連動（`scripts/run-e2e-local.mjs` 参照）
