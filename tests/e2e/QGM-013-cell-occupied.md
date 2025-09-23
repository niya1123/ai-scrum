# [AC: QGM-013] CELL_OCCUPIED (400)

Preconditions:
- Game exists with at least one stone placed at `(5,5)`.

Steps:
1) Attempt to place another stone at the same `(5,5)` via `POST ${BASE_URL}/games/{gameId}/moves` (or via UI click on the same cell).

Expected:
- HTTP 400 Bad Request
- Body: `{ code: 'CELL_OCCUPIED', message: string, details?: { row, col } }`
- State remains unchanged (same `turnCount`, `currentPlayer`, and board cell content).
- UI does not add a second stone in the cell.
