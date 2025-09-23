# POST /games/:id/moves — Place Move (QGM-010/011/012)

Request:
```bash
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  "${BASE_URL}/games/${GAME_ID}/moves" \
  -d '{
    "playerId": "BLACK",
    "position": { "row": 7, "col": 7 }
  }'
```

Success 200:
```json
{
  "gameState": {
    "currentPlayer": "WHITE",
    "turnCount": 1,
    "board": [
      /* stone at (7,7) with probabilityType for BLACK first turn = P90 */
    ],
    /* ... other fields ... */
  }
}
```
