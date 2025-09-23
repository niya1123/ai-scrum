# [AC: QGM-011] 正常系: 合法手で配置 → 手番交代 & ターン加算

Preconditions
- Server running at `<BASE_URL>`.
- Create a new game and capture `gameId`.
- Choose an empty cell within bounds, e.g., `(row=7, col=7)`.

Operations
- POST `/api/quantum-gomoku/games/:id/moves` with `{ row, col }` as BLACK's first move.

Expected Results
- Status 200 with `{ gameState }`.
- `turnCount` increments by 1 (0 → 1).
- `currentPlayer` swaps from `BLACK` to `WHITE`.
- Board at `(row, col)` contains an unobserved stone for BLACK.

Notes
- Runner-neutral skeleton; implement with Architect-chosen E2E tool.

