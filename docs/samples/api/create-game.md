# POST /games — Create Game (QGM-001)

Request:
```bash
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  "${BASE_URL}/games" \
  -d '{}'
```

Response 201:
```json
{
  "gameId": "4c9a3d2e-8e20-4b9a-9a44-6d7b7b5b0a1a",
  "gameState": {
    "id": "4c9a3d2e-8e20-4b9a-9a44-6d7b7b5b0a1a",
    "status": "playing",
    "currentPlayer": "BLACK",
    "winner": null,
    "board": [[null, ... 15 cols], ... 15 rows],
    "blackObservationsRemaining": 5,
    "whiteObservationsRemaining": 5,
    "turnCount": 0,
    "createdAt": "2025-09-23T00:00:00.000Z",
    "lastMover": null
  }
}
```
