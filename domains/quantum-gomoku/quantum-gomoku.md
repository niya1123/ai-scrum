# Quantum Gomoku (量子五目並べ) — Domain Spec

This domain spec is the source of truth for the primary domain folder name `quantum-gomoku`.

Primary endpoints (MVP scope):
- POST `/api/quantum-gomoku/games` → 201 and `{ gameId, gameState }`
- GET `/api/quantum-gomoku/games/:id` → 200 and `{ gameState }` or 404 `{ code: 'NOT_FOUND' }`

GameState contract (MVP-007):
- `id` string
- `status`: `playing | finished | draw`
- `currentPlayer`: `BLACK | WHITE`
- `winner`: `BLACK | WHITE | null`
- `board`: 15x15 grid, empty cells initially
- `blackObservationsRemaining`: number (initially 5)
- `whiteObservationsRemaining`: number (initially 5)
- `turnCount`: number (initially 0)
- `createdAt`: ISO8601 string
- `lastMover`: `BLACK | WHITE | null`

Notes:
- This document is intended to be referenced by `DOMAIN_SPEC=domains/quantum-gomoku/quantum-gomoku.md`.
- The implementation root for this domain is `domains/quantum-gomoku/src/`.

