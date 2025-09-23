# GET /games/:id — Retrieve Game (QGM-002)

Success 200:
```bash
curl -sS "${BASE_URL}/games/${GAME_ID}"
```
```json
{ "gameState": { /* see GameState */ } }
```

Invalid ID 400:
```bash
curl -sS "${BASE_URL}/games/not-a-uuid"
```
```json
{ "code": "INVALID_ID", "message": "id must be a UUID" }
```

Not Found 404:
```bash
curl -sS "${BASE_URL}/games/00000000-0000-4000-8000-000000000000"
```
```json
{ "code": "NOT_FOUND", "message": "game not found" }
```
