# Domain: Travel Planner MVP

## Overview
- Users enter destination and date range, get a simple daily itinerary.
- Return within 3 seconds (mock/dummy allowed initially).
- Validate input (required, date order).

## Primary Entities
- Trip: { destination, startDate, endDate, days: Day[] }
- Day: { date, items: string[] }

## API (suggested)
- POST /api/plan -> Trip

## UI (suggested)
- Form fields: destination, start_date, end_date
- Result region: role=region name=result

## Acceptance Style
- Use AC IDs with prefix TPA-, e.g. TPA-001.

