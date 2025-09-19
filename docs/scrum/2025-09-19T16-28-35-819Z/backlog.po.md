# Backlog (PO) — AI Scrum Tasks

## 共通原則
- 変更は「提案 → 実行」の2段階。提案は根拠/比較表つき。実行は差分（パッチ or コマンド）を出力。
- すべての自動変更は再実行に耐える（冪等）。既存物を壊さない。失敗時はロールバック指示を含める。
- 受け入れ基準（AC）に紐づく E2EがGreen になって初めてDone。

## ユーザーストーリー一覧
- ID: TDA-S-001
  - Title: API — List tasks (Task model)
  - 説明: クライアントが全タスクを取得できるAPIと整合したTask形状
  - AC:
    - TDA-001: GET `/api/tasks` は 200 と JSON配列
    - TDA-002: 各要素に `id`(string|number), `title`(string), `done`(boolean), `createdAt`(ISO8601)
    - TDA-003: `createdAt` 降順で返却
    - TDA-004: `Content-Type` は `application/json`
  - 優先度: Must
- ID: TDA-S-002
  - Title: UI — Render task list
  - 説明: タスク一覧をアクセシブルに表示（順序/空状態含む）
  - AC:
    - TDA-005: `[role="list"][aria-label="tasks"]` が存在
    - TDA-006: 取得タスクがlistitemとして `title` 表示
    - TDA-007: 新しい順（`createdAt`降順）で表示
    - TDA-008: 0件時 `data-testid="empty-tasks"` で “No tasks yet.” を表示
  - 優先度: Must
- ID: TDA-S-003
  - Title: Create task (UI + API)
  - 説明: 入力からタスク作成し即座に一覧へ反映
  - AC:
    - TDA-009: `#new_task` に非空文字列を入力しEnterでPOST（titleはtrim）
    - TDA-010: 201でTask返却し、一覧先頭に追加・入力クリア
    - TDA-011: 生成Taskは `done=false` で `createdAt` はサーバ側付与
  - 優先度: Must
- ID: TDA-S-004
  - Title: Toggle task done (UI + API)
  - 説明: 完了/未完了を切替しUIに反映
  - AC:
    - TDA-012: クリックで PATCH `/api/tasks/:id` `{done}` 送信、200で更新Task返却、UIは `aria-checked` 反映
    - TDA-013: 再クリックで元に戻せる（永続化）
  - 優先度: Must
- ID: TDA-S-005
  - Title: Delete task (UI + API)
  - 説明: タスクを削除でき、一覧から除去
  - AC:
    - TDA-014: 各項目に `data-testid="delete-task"` の削除ボタンを表示
    - TDA-015: クリックで DELETE `/api/tasks/:id`、200 `{ok:true}`、UIから該当項目削除、0件なら空状態表示
  - 優先度: Must
- ID: TDA-S-006
  - Title: Validation & errors (contract)
  - 説明: 入力不正や未存在IDの扱いを規定
  - AC:
    - TDA-016: 空/空白のみ `title` は 400 `{error:"TITLE_REQUIRED"}`、UIは `#new_task` 近傍に `role="alert"` 等で表示
    - TDA-017: 未存在 `:id` の PATCH/DELETE は 404 `{error:"TASK_NOT_FOUND"}`、UIはクラッシュせず不変
    - TDA-018: 非booleanの `done` は 400 `{error:"DONE_REQUIRED"}`
  - 優先度: Must
- ID: TDA-S-007
  - Title: In‑memory store & IDs
  - 説明: MVPはメモリ永続化・一意ID・サーバ時刻付与
  - AC:
    - TDA-019: プロセス生存中は保持、再起動で空に戻る（READMEに明記）
    - TDA-020: 連続1000件作成でも `id` 一意
  - 優先度: Should

## 依存関係メモ
- TDA-S-002 → TDA-S-001（一覧API/形状に依存）
- TDA-S-003 → TDA-S-001, TDA-S-002（形状/描画に依存）
- TDA-S-004, TDA-S-005 → TDA-S-001, TDA-S-002（API/描画に依存）
- TDA-S-006 → TDA-S-003..TDA-S-005（検証/エラー処理横断）
- TDA-S-007 → TDA-S-001..TDA-S-005（実装基盤）

## 提案（バックログの保存先）
- 採用: Option A — `docs/backlog.po.md` に保存（リポジトリでトレーサブル管理）
- 追加/更新: 本ファイルを冪等に上書き
- ロールバック: `rm docs/backlog.po.md`
- 参照: 本ファイルが唯一の正とする
