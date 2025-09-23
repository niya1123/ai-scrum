# [AC: QGM-015] INVALID_POSITION (400), NOT_FOUND (404)

## Case 1: INVALID_POSITION (400)
Preconditions:
- Fresh game exists.

Steps:
1) POST move with `position.row=-1, col=0` (or `row=15` or `col=15`).

Expected:
- HTTP 400 Bad Request
- Body: `{ code: 'INVALID_POSITION', message: string, details?: { row, col } }`

## Case 2: NOT_FOUND (404)
Preconditions:
- Use a valid-but-unknown UUID.

Steps:
1) POST `${BASE_URL}/games/{unknownValidUuid}/moves` with any valid payload.

Expected:
- HTTP 404 Not Found
- Body: `{ code: 'NOT_FOUND', message: string }`
