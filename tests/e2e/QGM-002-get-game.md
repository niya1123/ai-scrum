# [AC: QGM-002] Retrieve an existing game

## Case 1: 正常系 200
Preconditions:
- A game exists (create via POST /games and capture `gameId`).

Steps:
1) GET `${BASE_URL}/games/{gameId}`

Expected:
- HTTP 200 OK
- `Content-Type: application/json`
- Body: `{ gameState: GameState }` matching the created game

## Case 2: 400 INVALID_ID
Preconditions:
- None

Steps:
1) GET `${BASE_URL}/games/not-a-uuid`

Expected:
- HTTP 400 Bad Request
- Body: `{ code: 'INVALID_ID', message: string, details?: object }`
- `Content-Type: application/json`

## Case 3: 404 NOT_FOUND
Preconditions:
- Use a syntactically valid UUID that does not exist in memory (e.g., `00000000-0000-4000-8000-000000000000`).

Steps:
1) GET `${BASE_URL}/games/{unknownValidUuid}`

Expected:
- HTTP 404 Not Found
- Body: `{ code: 'NOT_FOUND', message: string, details?: object }`
- `Content-Type: application/json`
