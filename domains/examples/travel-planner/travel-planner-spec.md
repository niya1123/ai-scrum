# Domain Spec: Travel Planner MVP

## Overview
- Users enter destination and date range, get a simple daily itinerary.
- Response SLA: 3 seconds or less (mock/dummy providers acceptable for MVP).
- Validate input (all fields required, start date must be ≤ end date).

## Primary Entities
- `Trip`: { destination, startDate, endDate, days: Day[] }
- `Day`: { date, items: string[] }

## API (Suggested)
- `POST /api/plan` → `Trip`
  - Request body: `{ destination: string, startDate: string (ISO), endDate: string (ISO) }`
  - Response body: `Trip`

## UI (Suggested)
- Form fields: `destination`, `start_date`, `end_date`
- Result region: `role=region` `name=result`

## Future Enhancements
- Support multiple travellers or shared itineraries.
- Integrate with real activity providers.
- Export to calendar or shareable links.
- Add budget and preference filters.

