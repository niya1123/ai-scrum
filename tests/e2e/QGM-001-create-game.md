# [AC: QGM-001] Create a new game — 正常系

Preconditions:
- API server is running at `${BASE_URL}`.

Steps:
1) POST `${BASE_URL}/games` with empty JSON body `{}`.

Expected:
- HTTP 201 Created
- Content-Type: `application/json`
- Body: `{ gameId: <uuid>, gameState: GameState }`
- `gameState` fields:
  - `status` = `playing`
  - `currentPlayer` = `BLACK`
  - `turnCount` = `0`
  - `blackObservationsRemaining` = `5`
  - `whiteObservationsRemaining` = `5`
  - `board` is 15×15 with all cells `null`
  - `lastMover` = `null`
- `gameId` is a valid UUID v1–v5
