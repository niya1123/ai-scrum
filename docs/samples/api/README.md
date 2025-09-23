# Quantum Gomoku API Samples

- Use `quantum-gomoku.http` with REST clients that support `.http` files (VS Code REST Client, HTTPYac) or translate to `curl`.
- Ensure the server is running, then set `@baseUrl` at the top of the file.
- Follow the requests labeled with their Acceptance Criteria IDs (e.g., QGM-001).

## Minimal Happy Flow (MVP)
1) Create game [QGM-001]
2) Make one legal move [QGM-011]
3) Verify UI updates (if using UI) [QGM-010, QGM-011]

## Error Cases
- GET with missing/invalid id [QGM-002]
- Move: cell occupied, out of turn, invalid position/id [QGM-013, QGM-014, QGM-015]

## Notes
- Error payloads: `{ code: '<ERROR_CODE>' }` as per spec.
- Game state must remain unchanged on error responses.
