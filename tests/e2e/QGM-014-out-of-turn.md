# [AC: QGM-014] OUT_OF_TURN (409)

Preconditions:
- Fresh game; `currentPlayer` is `BLACK`.

Steps:
1) Attempt to place a move with `playerId='WHITE'` despite it being BLACK's turn via `POST ${BASE_URL}/games/{gameId}/moves`.

Expected:
- HTTP 409 Conflict
- Body: `{ code: 'OUT_OF_TURN', message: string, details?: { expected: 'BLACK', received: 'WHITE' } }`
- No state change.
