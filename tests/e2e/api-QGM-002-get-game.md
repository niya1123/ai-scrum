# [AC: QGM-002] 正常系/異常系: 既存ゲーム取得（200/404/400）

Preconditions
- Server running at `<BASE_URL>`.
- Create a game first to obtain a valid `gameId`.

Operations
1) GET `/api/quantum-gomoku/games/:id` with existing `gameId`.
2) GET with nonexistent but valid UUID.
3) GET with invalid ID format (e.g., `"not-a-uuid"`).

Expected Results
- Case 1: 200 with `{ gameState }` (matches created game initial state).
- Case 2: 404 with `{ code: 'NOT_FOUND' }`.
- Case 3: 400 with `{ code: 'INVALID_ID' }`.

Notes
- Runner-neutral skeleton; implement with Architect-chosen E2E tool.

