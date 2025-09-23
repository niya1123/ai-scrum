[Suite] MVP-004 勝利時のゲーム終了処理

- [AC: QGM-024] 勝利成立時は status='finished' と winner 設定
  - Preconditions:
    - Board where observation leads to a win.
  - Steps:
    1) Execute observation by `lastMover`.
  - Expected:
    - Response 200.
    - `gameState.status='finished'`.
    - `gameState.winner in ['BLACK','WHITE']` (the winner).

- [AC: QGM-025] 終了後の moves/observations は 409、GET は終了状態
  - Preconditions:
    - Finished game
  - Steps:
    1) POST a move -> expect 409 `GAME_FINISHED`.
    2) POST an observation -> expect 409 `GAME_FINISHED`.
    3) GET game -> returns finished state unchanged.
  - Expected:
    - Correct gating and retrieval.
# MVP-004 勝利時のゲーム終了処理 — E2Eシナリオ雛形

共通前提
- 直前の観測で勝利成立（`isWinning=true`）

## [AC: QGM-024] 正常: 勝利成立時にゲーム終了
- 前提: 観測により勝敗確定
- 操作: 観測レスポンス後の `gameState` を取得
- 期待結果:
  - `gameState.status='finished'`
  - `gameState.winner` が勝者（`BLACK` or `WHITE`）

## [AC: QGM-025] 制約: 終了後の moves/observations は 409、GET は終了状態
- 前提: `status='finished'`
- 操作: 任意の move / observation を呼ぶ
- 期待結果: `409 { code:'GAME_FINISHED' }`
- 追加検証: GET `/api/quantum-gomoku/games/:id` は終了状態を返す

