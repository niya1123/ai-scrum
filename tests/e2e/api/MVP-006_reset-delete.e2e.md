[Suite] MVP-006 リセットと削除

- [AC: QGM-028] reset は 200 と初期化された gameState
  - Preconditions:
    - Existing game with non-initial state.
  - Steps:
    1) POST `/api/quantum-gomoku/games/:id/reset`.
  - Expected:
    - 200 with initial gameState (`turnCount=0`, `status='playing'`, board empty, observationsRemaining=5 each). `id` preserved.

- [AC: QGM-029] delete は 200 { success:true }、以降 GET は 404
  - Preconditions:
    - Existing game
  - Steps:
    1) DELETE `/api/quantum-gomoku/games/:id`.
    2) GET same id.
  - Expected:
    - 200 `{ success:true }` then 404 for subsequent GET.

- [AC: QGM-030] 終了済み/引き分けでも reset/delete 可
  - Preconditions:
    - Finished or draw game
  - Steps:
    1) POST reset and/or DELETE.
  - Expected:
    - Both operations allowed and behave as specified.

- [AC: QGM-031] 不在 ID の reset/delete は 404
  - Preconditions:
    - Unknown id
  - Steps:
    1) POST reset / DELETE unknown id.
  - Expected:
    - 404 `{ code:'NOT_FOUND' }`.
# MVP-006 リセットと削除 — E2Eシナリオ雛形

共通前提
- いずれの状態（playing/finished/draw）でも実行可能

## [AC: QGM-028] 正常: reset は 200 と初期化された gameState
- 前提: 任意の進行中または終了状態
- 操作: POST `/api/quantum-gomoku/games/:id/reset`
- 期待結果:
  - ステータス: 200
  - ボディ: 初期状態の `gameState`（`id` は維持）

## [AC: QGM-029] 正常: delete は 200 { success:true }、以降 GET は 404
- 前提: 存在するゲームID
- 操作: DELETE `/api/quantum-gomoku/games/:id`
- 期待結果:
  - ステータス: 200 `{ success:true }`
  - 後続 GET は `404 { code:'NOT_FOUND' }`

## [AC: QGM-030] 許可: 終了済み/引き分けでも reset/delete は許可
- 前提: `status in ('finished','draw')`
- 操作: reset / delete
- 期待結果: いずれも許可され、結果は上記と同等

## [AC: QGM-031] エラー: 不存在 ID の reset/delete は 404 NOT_FOUND
- 前提: 不存在 `:id`
- 操作: reset / delete を呼ぶ
- 期待結果: `404 { code:'NOT_FOUND' }`

