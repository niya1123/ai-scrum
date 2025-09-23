# E2E API Skeleton — Trip Planner

Environment
- BASE_URL: Base host for API (default http://localhost:3000)
- Endpoint: POST ${BASE_URL}/api/plan
- Headers: Content-Type: application/json

Notes
- Use docs/samples/api/* payloads for requests and contract examples.
- Validate Content-Type and JSON schema by observable fields, not implementation details.

---

## [AC: TPA-001] Accept JSON body for /api/plan
- Test Name: "[AC: TPA-001] POST accepts JSON payload"
- Preconditions: Server running; BASE_URL reachable.
- Operation: POST valid JSON body (destination, start_date, end_date).
- Expected Results:
  - Endpoint does not return 404/415.
  - Request with `Content-Type: application/json` is accepted for processing.

## [AC: TPA-002] Return 200 application/json with Trip shape
- Test Name: "[AC: TPA-002] Happy path response"
- Preconditions: Valid request (see plan.request.valid.json).
- Operation: POST to /api/plan.
- Expected Results:
  - Status 200.
  - Header `Content-Type` includes `application/json`.
  - Body has keys: destination (string), startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), days (array).

## [AC: TPA-003] Inclusive day count and per-day structure
- Test Name: "[AC: TPA-003] Days cover inclusive range"
- Preconditions: start_date=2025-09-20, end_date=2025-09-22.
- Operation: POST valid request.
- Expected Results:
  - `days.length === 3` (inclusive range).
  - Each `day.date` is within [startDate, endDate] in YYYY-MM-DD.
  - Each `day.items` is string[] with length >= 1.

## [AC: TPA-004] Invalid input returns 400 with errors[]
- Test Name: "[AC: TPA-004] Base error contract"
- Preconditions: Invalid request (e.g., missing destination).
- Operation: POST invalid JSON.
- Expected Results:
  - Status 400.
  - Body matches `{ errors: [{ field?, code, message? }] }` with ≥1 item.

## [AC: TPA-005] destination required
- Test Name: "[AC: TPA-005] Destination missing"
- Preconditions: destination missing or empty.
- Operation: POST docs/samples/api/plan.request.missing-destination.json.
- Expected Results:
  - Status 400.
  - `errors[0].field == "destination"`.
  - `errors[0].code == "required"`.

## [AC: TPA-006] start_date / end_date required
- Test Name: "[AC: TPA-006] Missing date fields"
- Preconditions: start_date missing OR end_date missing.
- Operation: POST with single missing field variant.
- Expected Results:
  - Status 400.
  - Each missing field reported with `code == "required"`.

## [AC: TPA-007] Date format must be YYYY-MM-DD
- Test Name: "[AC: TPA-007] Date format validation"
- Preconditions: Invalid date string format payload.
- Operation: POST docs/samples/api/plan.request.invalid-date-format.json.
- Expected Results:
  - Status 400.
  - `errors[].code == "format"` for offending field(s).

## [AC: TPA-008] Date order start_date <= end_date
- Test Name: "[AC: TPA-008] Date order validation"
- Preconditions: start_date > end_date payload.
- Operation: POST docs/samples/api/plan.request.date-range-order-invalid.json.
- Expected Results:
  - Status 400.
  - `errors[].field == "date_range"`.
  - `errors[].code == "order"`.

## [AC: TPA-013] API responds within 3 seconds
- Test Name: "[AC: TPA-013] API latency budget"
- Preconditions: Valid request body.
- Operation: Measure start→response duration of POST.
- Expected Results:
  - Elapsed time < 3000 ms in local/CI runs.

## [AC: TPA-017] 400 error contract consistency
- Test Name: "[AC: TPA-017] Error array contract"
- Preconditions: Any invalid request variant.
- Operation: POST invalid JSON.
- Expected Results:
  - Status 400.
  - Body is `{ errors: [...] }` array with at least one item.
  - No additional envelope fields.

## [AC: TPA-018] 500 internal error contract (unexpected)
- Test Name: "[AC: TPA-018] Internal error masking"
- Preconditions: Force unexpected error (fault injection or stub).
- Operation: Trigger server error scenario.
- Expected Results:
  - Status 500.
  - Body is `{ errors: [{ code: "internal_error" }] }`.
  - No sensitive information leaked in message fields.

