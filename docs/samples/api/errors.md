# Error Response Model (QGM-S06 applies across endpoints)

Shape:
```json
{ "code": "STRING", "message": "Human-readable", "details": { /* optional */ } }
```

Examples:
- 400 INVALID_ID
```json
{ "code": "INVALID_ID", "message": "id must be UUID" }
```
- 400 INVALID_POSITION
```json
{ "code": "INVALID_POSITION", "message": "row/col must be 0..14", "details": { "row": -1, "col": 0 } }
```
- 400 CELL_OCCUPIED
```json
{ "code": "CELL_OCCUPIED", "message": "cell already occupied", "details": { "row": 5, "col": 5 } }
```
- 404 NOT_FOUND
```json
{ "code": "NOT_FOUND", "message": "game not found" }
```
- 409 OUT_OF_TURN
```json
{ "code": "OUT_OF_TURN", "message": "expected BLACK, received WHITE", "details": { "expected": "BLACK", "received": "WHITE" } }
```
