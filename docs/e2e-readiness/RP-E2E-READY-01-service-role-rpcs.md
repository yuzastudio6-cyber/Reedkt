# RP-E2E-READY-01 Service-Role RPCs

Prompt 8 adds local/review-ready Supabase RPCs for the no-AI persisted render pipeline. These RPCs are intended to replace loose smoke inserts for the runtime-critical path: credit reservation, approved snapshot creation, job creation, worker claim ownership, render metadata, QA metadata, and preview-ready completion.

This milestone does not apply the migration remotely. It does not call providers, Stripe, Remotion, Google Cloud, GCS, or production storage, and it does not add secrets.

## Migration

Local SQL file:

```text
supabase/migrations/202605210002_e2e_service_role_runtime_rpcs.sql
```

The migration creates `security definer` functions and grants execution to `service_role` only. Authenticated browser users should not call these functions directly.

Required RPCs:

- `e2e_create_approved_plan_snapshot`
- `e2e_reserve_credits_for_smoke`
- `e2e_create_job_batch_and_render_job`
- `e2e_claim_worker_job`
- `e2e_release_worker_job_claim`
- `e2e_record_job_event`
- `e2e_record_preview_storage_object`
- `e2e_record_preview_render_result`
- `e2e_record_preview_qa_result`
- `e2e_complete_render_job_preview_ready`

`e2e_record_preview_storage_object` is a supporting RPC because the persisted preview needs a canonical `storage_object_records` row before render metadata can link to it.

## Safety Behavior

The SQL raises clear `E2E_*` exceptions for missing edit plans, credit estimates, credit approvals, credit reservations, approved snapshots, storage objects, claim conflicts, idempotency conflicts, schema dependencies, and unsafe JSON payloads.

Snapshot, event, render, and QA JSON payloads are checked for obvious secret-like or signed-URL content. Canonical storage rows store bucket and object path only.

## Server Wrapper

Server-only wrapper:

```text
server/services/e2e-service-role-runtime-service.ts
```

It uses the Supabase admin client only in backend code. It never exposes service-role values, never imports into frontend code, and returns typed disabled/missing-RPC failures when live mode is not configured or the migration has not been applied.

## Commands

Disabled-mode checks:

```bash
npm run smoke:supabase:rpcs
npm run smoke:supabase:rpcs:test
npm run smoke:e2e:rpc-persisted-render:test
```

Live readiness, after manually applying the migration and setting safe server env:

```bash
SUPABASE_E2E_SMOKE_MODE=live npm run smoke:supabase:rpcs
```

Live persisted no-AI render through RPCs:

```bash
SUPABASE_E2E_SMOKE_MODE=live SUPABASE_E2E_ALLOW_WRITES=true npm run smoke:e2e:rpc-persisted-render
```

Live writes require an existing safe test auth user through `SUPABASE_E2E_USER_ID`. The smoke does not create Supabase Auth users.

## Prompt 9 Handoff

Prompt 9 adds the next review-ready SQL layer:

```text
supabase/migrations/202605210003_e2e_production_service_path_hardening.sql
```

That migration adds service-role helpers for idempotency request-hash checks, finalized media/source sequence setup, smoke plan/credit approval bundles, strict job transitions, and refund placeholders for ReeditPro-caused render failures. These functions are still local/review-ready only and are not applied by Codex.

Prompt 9 also route-integrates the no-AI flow through:

```bash
npm run smoke:e2e:local-full
npm run smoke:e2e:supabase-full
npm run e2e:readiness
```

The local path can return `preview_ready` with FFmpeg/FFprobe. The Supabase path remains disabled unless live env, write permission, runtime tables, and Prompt 8/9 RPCs are explicitly configured.

Prompt 10 should apply and validate migrations in a safe Supabase environment, tighten authorization/RLS checks, and prepare non-smoke production transaction rollout. Provider calls remain disabled.

## Prompt 10 Update

Prompt 10 does not apply the RPC migrations remotely. It adds:

- `smoke:supabase:migration-manifest` to verify review-ready SQL files and order,
- `smoke:supabase:live-env` to validate live staging env without printing secrets,
- `smoke:supabase:rls-auth` to audit runtime RLS/policy readiness,
- live write guard metadata requiring `e2eSmoke=true`, `smokeRunId`, and `createdBy="rp-e2e-smoke"`,
- same-run-only cleanup for smoke records,
- `GET /health/e2e/live-supabase-dry-run` for no-write readiness.

Manual staging apply should follow `docs/deployment/supabase-staging-apply-checklist.md`. Writes stay off until `SUPABASE_E2E_ALLOW_WRITES=true` is set explicitly.
