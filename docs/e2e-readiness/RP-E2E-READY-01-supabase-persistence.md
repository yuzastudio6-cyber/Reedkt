# RP-E2E-READY-01 Supabase Persistence

Prompt 6 proved the no-AI local render smoke path with FFmpeg and FFprobe. Prompt 7 adds the next boundary: the backend can optionally connect to Supabase, verify runtime tables, and run write/read smoke checks only when live smoke mode is explicitly enabled.

This remains provider-disabled. It does not call OpenAI, Wan, Hailuo, Veo, Lyria, Mirelo, MMAudio, Stripe, Remotion, Google Cloud, or production storage.

## Default Behavior

Supabase E2E persistence smoke is disabled by default:

```bash
npm run smoke:supabase:tables
npm run smoke:supabase:write
npm run smoke:e2e:persisted-render
```

Without live smoke env, these commands return structured skip or missing-env results and do not mutate Supabase.

## Environment

Safe placeholders live in `.env.example`:

```bash
SUPABASE_E2E_SMOKE_MODE=disabled
SUPABASE_E2E_ALLOW_WRITES=false
SUPABASE_E2E_CLEANUP=true
SUPABASE_E2E_WORKSPACE_ID=
SUPABASE_E2E_USER_ID=
SUPABASE_E2E_PROJECT_ID=
SUPABASE_E2E_REGION=local
```

Live table readiness also needs the normal server-side Supabase backend configuration. The service-role value must stay in local or CI secrets only; it must never be committed, logged, returned from the API, pasted into docs, or exposed to Vite/browser code.

## Table Readiness

`npm run smoke:supabase:tables` checks required table groups:

- Core workspace/project/chat/media/source-sequence tables.
- Planning tables.
- Credit and approval tables.
- Job and agent output tables.
- Generation, render, preview review, and QA tables.
- RP-E2E runtime tables.
- SFX and timing tables when those migrations are expected.

The checker tries `information_schema` first and falls back to harmless per-table `select ... limit 1` checks. It never mutates data.

## Write/Read Smoke

`npm run smoke:supabase:write` requires:

```bash
SUPABASE_E2E_SMOKE_MODE=live
SUPABASE_E2E_ALLOW_WRITES=true
SUPABASE_E2E_USER_ID=<existing safe test auth user id>
```

The smoke creates a temporary connected record chain when the schema permits it:

workspace -> workspace member -> project -> chat session -> chat message -> upload intent -> media asset -> storage object -> edit plan -> credit estimate -> credit approval -> credit reservation -> approved snapshot -> job batch -> job -> render job -> render metadata -> QA metadata.

If foreign keys or required existing auth/profile rows block the insert, the smoke returns `missing_dependency` or `constraint_blocked` instead of fabricating success.

When `SUPABASE_E2E_CLEANUP=true`, smoke-owned rows are deleted in reverse dependency order. Existing env-provided workspace, project, and user rows are not deleted.

## Persisted Render Smoke

`npm run smoke:e2e:persisted-render` also requires live write mode, local storage mode, FFmpeg, and FFprobe. It:

1. Generates a tiny local MP4 fixture.
2. Writes source media and canonical storage metadata.
3. Writes approved snapshot, approved/reserved credit records, render job, and worker job records.
4. Runs the existing basic render smoke worker.
5. Probes with FFprobe and creates a short MP4 preview with FFmpeg.
6. Writes preview storage metadata, render metadata, QA metadata, and job events.
7. Releases the worker claim and cleans up smoke-owned rows when cleanup is enabled.

The output is `preview_ready` only if the persisted write/read path and local FFmpeg/FFprobe path both succeed.

## Routes

- `GET /health/supabase/tables`
- `POST /v1/e2e/supabase/write-smoke`
- `POST /v1/e2e/supabase/persisted-render-smoke`

The write routes require auth or explicit local mock mode and are blocked unless write smoke is enabled.

## GitHub Actions

`.github/workflows/e2e-supabase-readiness.yml` runs build, lint, API typecheck, and disabled-mode table smoke on pull requests. Manual `workflow_dispatch` can run live table readiness when repository secrets are configured. It does not run live write smoke automatically.

## Prompt 8 Handoff

Prompt 8 adds local/review-ready service-role RPCs for the runtime-critical persisted render path. Live persisted render smoke now uses RPC wrappers for approved snapshot creation, smoke credit reservation, job batch/render job creation, worker claim/release, job events, preview storage records, render metadata, QA metadata, and preview-ready completion.

If live mode is enabled but the RPC migration has not been manually applied, the persisted render path fails clearly with:

```text
E2E service-role RPCs are not applied to Supabase.
```

The schema-adaptive write/read smoke remains useful as a diagnostic for table shape and prerequisite records, but it is not the primary live persisted render write path.

## Prompt 9 Update

Prompt 9 adds a route-integrated no-AI full editing flow and a second review-ready migration:

```text
supabase/migrations/202605210003_e2e_production_service_path_hardening.sql
```

The local full flow can be run with:

```bash
npm run smoke:e2e:local-full
```

The Supabase full flow can be checked with:

```bash
npm run smoke:e2e:supabase-full
```

It remains disabled unless live mode, write permission, required tables, Prompt 8/9 RPCs, FFmpeg/FFprobe, and local storage are all explicitly configured. Missing live dependencies are reported honestly.

## Still Not Implemented

- Production migration execution.
- Supabase Auth user creation for smoke tests.
- Provider calls, Stripe, Remotion rendering, Cloud Run deployment, or GCS production storage.
- Production launch authorization, provider/job dispatch, Stripe billing reconciliation, and Cloud Run deployment.

Prompt 10 should apply/validate migrations in a safe Supabase environment, tighten route authorization/RLS checks, and prepare non-smoke transaction rollout.
## Prompt 10 Update

Prompt 10 adds live staging validation guardrails around the Prompt 7 persistence smoke:

- live env validation remains disabled by default,
- migration manifest checks do not connect to Supabase,
- table/RPC/RLS checks are read-only,
- live writes require `SUPABASE_E2E_SMOKE_MODE=live` and `SUPABASE_E2E_ALLOW_WRITES=true`,
- every live write must carry smoke metadata,
- cleanup only deletes records from the same `smokeRunId`.

Use `docs/deployment/local-live-supabase-test-runbook.md` for local PowerShell commands and `docs/deployment/supabase-staging-apply-checklist.md` for manual staging migration order.
