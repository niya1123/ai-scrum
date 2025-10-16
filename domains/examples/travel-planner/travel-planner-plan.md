# Domain Plan: Travel Planner MVP

> Detailed spec: ./travel-planner-spec.md

## Vision
- Allow travellers to generate a lightweight itinerary in under 3 seconds.
- Make the MVP comfortable for later expansion (lodging, activities, collaboration).

## MVP Scope
- Collect destination plus travel window (start/end dates).
- Validate required fields and chronological order before orchestration.
- Produce a Day-by-day itinerary stub backed by mock data for now.

## Actors & Personas
- `Traveler`: plans a short personal or business trip.
- `System`: generates itineraries and validates form submissions.

## Constraints & Guardrails
- Response time target: ≤ 3s end-to-end (mock data allowed).
- Start date must be ≤ end date; both required.
- Keep UI accessible with labelled fields and result region.

## Acceptance Style
- Use AC IDs prefixed with TPA-, e.g. TPA-001.
- Document ACs in backlog outputs and mirror them in QA specifications.

## Open Questions
- How should we prioritise activity categories (food, sights, etc.)?
- What level of localization (time zones, languages) is required?

