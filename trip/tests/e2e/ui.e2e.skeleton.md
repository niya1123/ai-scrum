# E2E UI Skeleton — Trip Planner

Environment
- BASE_URL: Base host for UI (default http://localhost:3000)
- Abstract selectors: input[name="destination"], input[name="start_date"], input[name="end_date"], button[type="submit"], [role="region"][aria-label="result"]

Notes
- Keep result announcements and field errors separate regions.
- Use visible labels or aria-labelledby for inputs; required indicated via label/aria-required.

---

## [AC: TPA-009] Form has labeled inputs and submit
- Test Name: "[AC: TPA-009] Form scaffolding"
- Preconditions: Page loaded at BASE_URL/trip.
- Operation: Locate labeled inputs `destination`, `start_date`, `end_date`; locate submit button.
- Expected Results:
  - Each input associated with a visible label (label[for] or aria-labelledby).
  - Submit button present and enabled.

## [AC: TPA-010] Submit posts to /api/plan and updates result region
- Test Name: "[AC: TPA-010] Submit renders itinerary"
- Preconditions: API happy path available; page loaded.
- Operation: Fill inputs with valid values; click submit.
- Expected Results:
  - Network POST to /api/plan observed (optionally via route interception).
  - Result region `[role=region][aria-label="result"]` updates with Trip days.

## [AC: TPA-011] Result shows correct days and items
- Test Name: "[AC: TPA-011] Result matches Trip payload"
- Preconditions: API returns 3-day example.
- Operation: After submit, query result region entries (e.g., `[data-testid="day"]`).
- Expected Results:
  - Exactly N entries equal to Trip.days.length.
  - Each entry displays date and ≥1 itinerary item.

## [AC: TPA-012] Field-level validation errors near inputs
- Test Name: "[AC: TPA-012] Field errors separated from result"
- Preconditions: Trigger invalid inputs (e.g., leave required blank).
- Operation: Submit invalid form variants.
- Expected Results:
  - Field-specific error message rendered adjacent to the corresponding input.
  - Result region remains untouched by validation errors.

## [AC: TPA-015] Result container semantics
- Test Name: "[AC: TPA-015] Region semantics"
- Preconditions: Page loaded.
- Operation: Query DOM for result container.
- Expected Results:
  - Element exists with `role=region` and `aria-label="result"` (name="result").

## [AC: TPA-016] Label association and required indicators
- Test Name: "[AC: TPA-016] Required label semantics"
- Preconditions: Page loaded.
- Operation: Inspect labels/inputs.
- Expected Results:
  - Each input programmatically associated to its label.
  - Required fields indicated via label text and/or `aria-required=true`.

## [AC: TPA-014] UI end-to-end within 3 seconds
- Test Name: "[AC: TPA-014] UI latency budget"
- Preconditions: Valid inputs; API meets <3s budget.
- Operation: Measure time from submit click to result region content update.
- Expected Results:
  - Duration < 3000 ms including network + render.

