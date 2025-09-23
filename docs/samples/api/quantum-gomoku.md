# Quantum Gomoku API Samples (MVP)

Base URL: `http://localhost:3000`

Content-Type: `application/json`

## Create Game (QGM-001)

curl -i \
  -X POST "http://localhost:3000/api/quantum-gomoku/games" \
  -H 'content-type: application/json' \
  -d '{}'

Expected: `201` and body

{
  "gameId": "<string>",
  "gameState": {
    "id": "<string>",
    "status": "playing",
    "currentPlayer": "BLACK",
    "winner": null,
    "turnCount": 0,
    "blackObservationsRemaining": 5,
    "whiteObservationsRemaining": 5,
    "board": [[null, ... x15], ... x15],
    "createdAt": "<iso>",
    "lastMover": null
  }
}

## Get Game (QGM-003)

curl -i \
  "http://localhost:3000/api/quantum-gomoku/games/<gameId>"

Expected: `200` and `gameState` JSON. `id === <gameId>`.

## Board Shape Check (QGM-002)

`gameState.board` is a 15x15 array grid. Each row has length 15.

## Get Non-existent Game (QGM-004)

curl -i \
  "http://localhost:3000/api/quantum-gomoku/games/nonexistent-123"

Expected: `404` and body

{
  "code": "NOT_FOUND",
  "message": "...",
  "details": { }
}

