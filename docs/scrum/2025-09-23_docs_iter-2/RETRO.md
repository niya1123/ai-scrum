# Sprint Retro — 2025-09-23_docs_iter-2

## Continue
- Domain-specific API samples under `docs/domains/tasks/samples/api/` with `requests.http` kept in sync.
- Code-synced docs: reflect Next.js routes and error codes exactly.
- UI guide anchored on accessible selectors (`role`, `aria-*`, `data-testid`).

## Stop
- Duplicating samples across global `docs/samples/api/` and domain folders; keep the tasks samples only in the domain path to avoid drift.
- Implicit assumptions about error codes; always document exact payload shape and status.

## Try
- Add a lightweight contract check in CI: fetch `GET /api/tasks`, `POST /api/tasks`, `PATCH/DELETE /api/tasks/:id` using `requests.http` or Playwright API mode.
- Consider generating an OpenAPI stub for the tasks API to back contract tests and docs.
- Add a pre-commit that validates `requests.http` examples (curl smoke) in local dev.

## Notes
- Current API and USER_GUIDE align with code (GET/POST/PATCH/DELETE, `TITLE_REQUIRED`, `DONE_REQUIRED`, `TASK_NOT_FOUND`).
- Samples already cover success and validation failures; no spec gaps found this iteration.

