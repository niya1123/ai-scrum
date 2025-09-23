# [AC: QGM-015] 異常系: 範囲外/未存在/不正ID

Preconditions
- Server running at `<BASE_URL>`.
- New game created; `gameId` available.

Operations
1) POST move with out-of-bounds coordinates, e.g., `row=-1, col=0` or `row=15, col=14`.
2) POST move to a valid UUID that does not exist.
3) POST move to an invalid ID string (not UUID).

Expected Results
- Case 1: 400 `{ code: 'INVALID_POSITION' }`.
- Case 2: 404 `{ code: 'NOT_FOUND' }`.
- Case 3: 400 `{ code: 'INVALID_ID' }`.

Notes
- Ensure state remains unchanged after each error.
- Runner-neutral skeleton; implement with Architect-chosen E2E tool.

