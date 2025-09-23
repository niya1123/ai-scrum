[Suite] MVP-008 最小UI（任意）

- [AC: QGM-039] 初回表示で新規ゲーム作成または既存ID復元
  - Preconditions:
    - UI served at `/`.
  - Steps:
    1) Load the page; intercept/create game via API.
  - Expected:
    - Board 15x15 rendered; state reflects server gameState.

- [AC: QGM-040] 空セルクリックで moves 実行、占有セルは無効
  - Preconditions:
    - Board rendered
  - Steps:
    1) Click an empty cell; expect a move.
    2) Click the same cell again; should be prevented.
  - Expected:
    - Board and status update accordingly; occupied cell click is ignored/blocked.

- [AC: QGM-041] 直後のみ観測ボタン有効化→観測→反映
  - Preconditions:
    - A move just placed
  - Steps:
    1) Observe; then verify result and any rollback.
  - Expected:
    - Button enabled only immediately after a move; win/rollback reflected in UI.

- [AC: QGM-042] 状態表示（現在プレイヤー、各観測残、終了/勝者）
  - Preconditions:
    - UI bound to gameState
  - Steps:
    1) Inspect labels/counters.
  - Expected:
    - Correct values shown and updated.

- [AC: QGM-043] winningLine があれば盤上で強調
  - Preconditions:
    - Win scenario available
  - Steps:
    1) Observe a winning state.
  - Expected:
    - Winning coordinates visually highlighted.

