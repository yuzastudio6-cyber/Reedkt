# RP-E2E-READY-01 Production-Shaped No-AI Service Paths

Prompt 9 turns the earlier smoke pieces into a backend-shaped no-AI editing path. It still is not production launch authorization: no providers, Stripe, Cloud Run deployment, Remotion render, production migration execution, or committed secrets are added.

## What Prompt 9 Adds

- `server/services/e2e-editing-flow-service.ts` orchestrates the full no-AI local flow through server service boundaries.
- `server/routes/e2e-routes.ts` adds route integration for local full flow, Supabase full flow, and E2E readiness.
- `supabase/migrations/202605210003_e2e_production_service_path_hardening.sql` adds local/review-ready service-role RPC hardening for idempotency, source setup, plan approval bundle creation, strict job transitions, and refund placeholders.
- CLI and smoke scripts run local full flow, Supabase disabled-mode flow, and readiness summaries.

## Local Full Flow

Command:

```bash
npm run smoke:e2e:local-full
```

The local flow generates a synthetic MP4, creates an upload intent, uploads bytes through the local adapter, finalizes media, attaches finalized media in source order, creates mock approval/credit/job records, claims the render worker job, runs FFprobe/FFmpeg, writes the preview under canonical local storage, records QA/render metadata, and returns `preview_ready`.

Required tools:

- FFmpeg
- FFprobe

The flow rejects missing tools instead of pretending they are installed.

## Supabase Full Flow

Command:

```bash
npm run smoke:e2e:supabase-full
```

By default this skips clearly because live writes are disabled. Live mode requires:

- `SUPABASE_E2E_SMOKE_MODE=live`
- `SUPABASE_E2E_ALLOW_WRITES=true`
- server-only Supabase URL and service-role key in local env
- `SUPABASE_E2E_USER_ID` for an existing safe test user/profile
- required runtime tables
- Prompt 8 and Prompt 9 RPC migrations applied manually in a safe Supabase environment
- local storage mode and FFmpeg/FFprobe

If any requirement is missing, the command returns a structured skipped or failed result. It does not fake live Supabase success.

## Routes

- `POST /v1/e2e/local/full-editing-flow`
- `POST /v1/e2e/supabase/full-editing-flow`
- `GET /health/e2e/readiness`

Write routes require auth and `Idempotency-Key`. Local/mock mode may use explicit mock auth when `API_ALLOW_MOCK_WITHOUT_SUPABASE=true`.

## Idempotency

Every write boundary carries an idempotency key. Prompt 9 adds the review-ready RPC `e2e_assert_idempotent_request` so future production routes can replay same-key/same-hash requests and reject same-key/different-hash requests with `IDEMPOTENCY_CONFLICT`.

## Credit Behavior

Credit reservation remains idempotent and gated by approved estimates/reservations. Prompt 9 adds a refund placeholder RPC for ReeditPro-caused render failures. Stripe and final billing reconciliation are still TODO and intentionally not implemented.

## Worker And Job Behavior

Workers execute approved snapshots, not raw chat. Render work requires approved snapshot ID, credit reservation ID, job ID, worker type, idempotency key, and a worker claim. Prompt 9 adds a strict job transition RPC for service-role paths so completed jobs do not rerun unless an explicit retry policy later allows it.

## Render And QA Behavior

Preview-ready requires:

- a ready preview storage object,
- checksum,
- media probe summary,
- completed worker/job path,
- QA pass or non-blocking warning.

Blocking QA must return `QA_BLOCKED_PREVIEW` and must not mark a preview ready.

## What Remains For Prompt 10

- Apply Prompt 8/9 migrations in a safe Supabase environment.
- Validate RLS and service-role-only RPC permissions.
- Replace remaining smoke-only helpers with production transaction wrappers.
- Tighten route authorization and workspace membership checks.
- Add real non-smoke upload/source setup RPC coverage.
- Keep provider gateway real calls disabled until approval, credit, storage, retry/refund, QA, and logging safety are proven.

## Prompt 10 Handoff

Prompt 10 adds the live staging validation layer around this route-integrated flow:

- migration manifest and manual staging checklist,
- live environment validation without printing secrets,
- RLS/auth audit checks for runtime tables,
- live write guard metadata and same-run cleanup rules,
- `GET /health/e2e/live-supabase-dry-run`,
- manual-only GitHub Actions for staging Supabase validation.

The local full flow remains the fast no-AI `preview_ready` smoke. The Supabase full flow remains disabled unless live env, write permission, runtime tables, service-role RPCs, RLS/auth readiness, local storage mode, and FFmpeg/FFprobe are all explicit.
