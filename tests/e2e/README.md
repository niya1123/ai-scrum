E2E Spec Conventions (Tool-Agnostic)

- Base URL: `http://localhost:3000` (override via `BASE_URL`).
- Content type: All requests use `application/json` and expect JSON responses (AC: QGM-032).
- Randomness: Observations involve randomness (AC: QGM-015). For deterministic tests, a test-only hook such as `X-Test-Random-Seed` may be used if Architect/Dev-BE expose it (see tasks: BE-TEST-UTIL-001).
- IDs: Persist `gameId` between steps to assert state consistency (AC: QGM-005).
- Format: Each test includes Title with AC id, Preconditions, Steps, Expected.

Execution

- These are tool-agnostic specs. QA should translate them into the chosen runner (e.g., Playwright API testing, Jest+Supertest).
- Sample payloads and cURL/HTTP files live in `docs/samples/api/`.

