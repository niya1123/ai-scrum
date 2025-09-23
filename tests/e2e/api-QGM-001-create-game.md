# [AC: QGM-001] 正常系: 新規ゲーム作成（201）

Preconditions
- Server running at `<BASE_URL>`.
- No specific data setup required; in-memory store ok.

Operations
- POST `/api/quantum-gomoku/games` with empty body.

Expected Results
- Status 201.
- Response JSON contains `{ gameId: <uuid>, gameState: { ... } }`.
- `gameState` fields:
  - `status = 'playing'`
  - `currentPlayer = 'BLACK'`
  - `winner = null`
  - `turnCount = 0`
  - `blackObservationsRemaining = 5`
  - `whiteObservationsRemaining = 5`
  - `board` is 15x15 all `null`
  - `lastMover = null`
  - `createdAt` is ISO-8601 string

Notes
- Runner-neutral skeleton; implement with Architect-chosen E2E tool.

