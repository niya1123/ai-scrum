# [AC: QGM-011] 正常系: 配置直後のUI更新（手番交代/ターン数 +1）

Preconditions
- App served with UI connected to API at `<BASE_URL>`.
- New game created; initial `currentPlayer = BLACK`, `turnCount = 0`.

Operations
- Click an empty cell once to place a legal move.

Expected Results
- Immediately after response:
  - `currentPlayer` shows WHITE
  - `turnCount` shows 1

Notes
- Runner-neutral skeleton; implement with Architect-chosen E2E tool.

