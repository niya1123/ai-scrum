# Trip Planner API — /api/plan

POST application/json to generate a simple daily itinerary.

Request body:
```
{
  "destination": "Tokyo",
  "start_date": "2024-01-01",
  "end_date": "2024-01-03"
}
```

Successful response (200):
```
{
  "destination": "Tokyo",
  "startDate": "2024-01-01",
  "endDate": "2024-01-03",
  "days": [
    { "date": "2024-01-01", "items": ["..."] },
    { "date": "2024-01-02", "items": ["..."] },
    { "date": "2024-01-03", "items": ["..."] }
  ]
}
```

Validation errors (400):
```
{ "errors": [ { "field": "destination", "code": "required" } ] }
```

Internal error (500):
```
{ "errors": [ { "code": "internal_error" } ] }
```

