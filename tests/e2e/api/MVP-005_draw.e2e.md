[Suite] MVP-005 引き分け判定

- [AC: QGM-026] 双方の観測残 0 & 盤面埋まり & 前回観測で勝敗不成立 -> draw
  - Preconditions:
    - Game where all cells are filled and both `observationsRemaining=0`.
    - Last observation did not produce a win.
  - Steps:
    1) Trigger the draw evaluation condition (via moves and observations as needed).
  - Expected:
    - `gameState.status='draw'` and `winner=null`.

- [AC: QGM-027] 引き分け後の moves/observations は 409 GAME_FINISHED 相当
  - Preconditions:
    - Draw game
  - Steps:
    1) POST move/observation after draw.
  - Expected:
    - 409 `{ code:'GAME_FINISHED' }`.
# MVP-005 引き分け判定 — E2Eシナリオ雛形

共通前提
- 観測残回数: 双方 `observationsRemaining=0`
- 盤面: 空きセルなし
- 直前観測: 勝敗不成立

## [AC: QGM-026] 正常: 条件成立で `status='draw'`, `winner=null`
- 前提: 上記共通前提が満たされる状態に遷移
- 操作: 状態評価（必要なら最終観測を実行）
- 期待結果: `gameState.status='draw'`, `gameState.winner=null`

## [AC: QGM-027] 制約: 引き分け後は GAME_FINISHED と同等扱い
- 前提: `status='draw'`
- 操作: 任意の move / observation
- 期待結果: `409 { code:'GAME_FINISHED' }`

