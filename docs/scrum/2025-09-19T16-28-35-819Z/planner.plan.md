# Planner Plan — AI Scrum Tasks

This plan decomposes the PO backlog into actionable tasks by role with estimates and dependencies, provides the E2E-first skeletons, and defines the critical path and handback rules. It reflects the current stack and the red-state remediation from the last QA run.

## Stack & Test Harness (from Architect)
- App: Next.js 14 (App Router, Node runtime)
- Language: TypeScript
- E2E: Playwright (`config/playwright.config.ts`)
- In-memory store adapter: `src/adapters/memoryTaskStore.ts`

How to run E2E locally:
- Install browsers once: `npx playwright install --with-deps`
- Stable CI-like run: `npm run test:e2e:ci`
- Fast dev run: `npm run test:e2e:local:dev`

Web server strategy (for Playwright):
- Option A (fixed port 4000): simple, but conflicts if busy.
- Option B (ephemeral port via `scripts/run-e2e-local.mjs`): avoids conflicts; BASE_URL/PORT exported; aligns with CI. ← Adopted
- Option C (no webServer; manual start): non-idempotent, brittle; not adopted.

## Tasks by Story (role, estimate, dependencies)
Legend: S ≈ small, M ≈ medium, L ≈ large

TDA-S-001 API — List tasks (Task model)
- QA: API list E2E (TDA-001..004) — S — deps: none
- Dev-BE: GET `/api/tasks` returns JSON array, desc by `createdAt`, `content-type: application/json` — S — deps: none
- Docs: API samples for list — S — deps: none

TDA-S-002 UI — Render task list
- QA: UI list E2E (TDA-005..008) — S — deps: TDA-S-001
- Dev-FE: Accessible list `[role=list][aria-label=tasks]`, `role=listitem`, empty state, desc order — S — deps: TDA-S-001

TDA-S-003 Create task (UI + API)
- QA: Create E2E (TDA-009..011) — M — deps: TDA-S-001, TDA-S-002
- Dev-BE: POST `/api/tasks` (trim, 201 returns Task, server `createdAt`, `done=false`) — S — deps: TDA-S-001
- Dev-FE: Submit `#new_task` on Enter, prepend, clear input — S — deps: TDA-S-002

TDA-S-004 Toggle task done (UI + API)
- QA: Toggle E2E (TDA-012..013) — S — deps: TDA-S-001..003
- Dev-BE: PATCH `/api/tasks/:id {done}` (200 returns updated) — S — deps: TDA-S-001
- Dev-FE: Reflect `aria-checked`, re-toggle persists — S — deps: TDA-S-002, TDA-S-003

TDA-S-005 Delete task (UI + API)
- QA: Delete E2E (TDA-014..015) — S — deps: TDA-S-001..003
- Dev-BE: DELETE `/api/tasks/:id` (200 `{ok:true}`) — S — deps: TDA-S-001
- Dev-FE: Delete button per item, remove; empty state — S — deps: TDA-S-002

TDA-S-006 Validation & errors (contract)
- QA: Validation E2E (TDA-016..018) — M — deps: TDA-S-003..005
- Dev-BE: 400 `{error:"TITLE_REQUIRED"}`; 404 `{error:"TASK_NOT_FOUND"}`; 400 `{error:"DONE_REQUIRED"}` — S — deps: TDA-S-003..005
- Dev-FE: Surface API errors near `#new_task` via `role=alert` — S — deps: TDA-S-003

TDA-S-007 In‑memory store & IDs
- QA: Optional heavy test (1000 uniques) and manual restart note — S — deps: TDA-S-001..005
- Dev-BE: UUID ids; README note on process-lifetime persistence — S — deps: none
- Docs: Document behavior in README and samples — S — deps: none

Cross-cutting / Infra
- QA: Playwright webServer uses `PORT` env; baseURL bound; reset helpers — S — deps: none
- Dev-BE: Maintain adapter DI (`src/lib/container.ts`) — S — deps: none
- Docs: Keep `docs/samples/api/` updated — S — deps: features

## E2E Skeletons (tests/e2e)
Implemented as Playwright specs with AC-tagged titles. See also `tests/e2e/_plan.md` for stepwise scenarios.
- ac_api_list.spec.ts — TDA-001..004
- ac_ui_list.spec.ts — TDA-005..008
- ac_create.spec.ts — TDA-009..011
- ac_toggle.spec.ts — TDA-012..013
- ac_delete.spec.ts — TDA-014..015
- ac_validation.spec.ts — TDA-016..018
- ac_store.spec.ts — TDA-019..020 (heavy/manual; skipped)

## Critical Path (E2E-first)
1) QA: Seed E2E skeletons for TDA-S-001, TDA-S-002 (done)
2) Dev-BE: Implement TDA-S-001 API list (done)
3) Dev-FE: Implement TDA-S-002 UI list (done)
4) QA: Create E2E for TDA-S-003 (done)
5) Dev-BE/Dev-FE: Implement create (done)
6) QA: Toggle/Delete E2E (done)
7) Dev-BE/Dev-FE: Toggle/Delete (done)
8) QA/Dev-BE/Dev-FE: Validation & errors — confirm UI alert (done)
9) Docs: In-memory and API docs (done)

## Iteration-1 Remediation (status: red → addressed)
- Symptom: Wrong app served on port 3000; `/api/tasks` 404; UI selectors missing, blocking T1–T3.
- Root cause: Port conflict and mismatched webServer target.
- Actions taken:
  - Adopted ephemeral port runner (`scripts/run-e2e-local.mjs`) and BASE_URL binding.
  - Verified `config/playwright.config.ts` honors `PORT` and `reuseExistingServer`.
  - Ensured UI exposes required selectors and API routes present.
- Follow-ups:
  - QA: Keep a health check at test start in ac_api_list.spec to fail fast when `/api/tasks` not 200.

## Handback Rules (on failure)
- Server not reachable or port issues: Dev-BE fixes `package.json` scripts and Playwright webServer command/env; QA re-run.
- Contract mismatch (status codes/body): Dev-BE with failing AC IDs and request/response sample; QA re-run.
- UI selector/a11y mismatch: Dev-FE with failing AC IDs and locator details; QA re-run.
- Flaky timing/navigation: QA stabilizes waits; if API latency, Dev-BE adjusts; if UI render timing, Dev-FE adjusts.
- Spec/backlog ambiguity: escalate to PO to clarify AC; Planner updates tasks; QA rebase tests.

## Storage & Idempotency
- This plan is stored at `docs/planner.plan.md` (idempotent overwrite).
- Rollback: `rm docs/planner.plan.md`
