# Worker Runtime Unlock 0 Repo Audit

Decision: `worker_runtime_repo_audit_passed_with_warnings_ready_for_dry_run_plan`.

Status: `passed_with_warnings`.

This audit reviewed PR #335 plan snapshot handoff evidence and the existing worker runtime/job foundation. It is metadata/docs-only. It does not unlock worker execution.

## Source Verification

- PR #335 contract readiness is accepted: `ready_for_plan_snapshot_contract_handoff`.
- PR #327 plan snapshot contract packet is present.
- PR #329 Qwen/DashScope rerun evidence is accepted: four passed synthetic calls.
- PR #320 DeepSeek evidence is accepted: three passed synthetic calls.
- PR #318 dry-run approval packet remains the synthetic source.
- PR #315 registry restoration and PR #319 Supabase/SOUND blocker were not duplicated or continued.
- Source-of-truth conflicts found: `false`.

## Existing Implementation Inventory

- `server/workers` contains worker gates, claim runner, worker handler routing, and worker smokes. These are dry-run/mock-safe surfaces, not a production worker unlock.
- `src/backend/runtime` contains mock lease lifecycle, idempotency helpers, runtime envelopes, mock transport, stale recovery, and worker runtime registry metadata.
- `src/backend/cloud` contains worker payload and approved snapshot contracts that require approved snapshot IDs, idempotency keys, private references, and secret/signed URL rejection.
- `src/backend/api/routes/job-api-routes.ts` and the mock router expose route-shaped job/runtime/lease APIs for local mock behavior while backend-required routes remain blocked.
- Existing schema and draft SQL define job, lease, heartbeat, runtime config, and orchestration shapes as read-only audit inputs. No SQL was executed.

## Contract And Boundary Review

- Worker payloads must reference approved snapshots, IDs, private storage references, manifests, checksums, and idempotency keys.
- Raw chat and provider output cannot become direct worker instructions.
- Signed URLs are not source of truth. The future source path remains Supabase row plus private GCS path plus manifest plus checksum plus approved plan snapshot.
- Real claim, lease, heartbeat, completion, failure, retry, and idempotency enforcement require a backend/service-role transaction path and Supabase owner approval.

## Dependency Maps

- Supabase: job/lease/config/persistence dependencies exist in migrations and drafts, but mutation remains blocked. Approved snapshot persistence is not ready.
- Cloud Run/Docker: scripts and docs exist; no build, run, deploy, or API call occurred.
- Provider/tool/route: Qwen/DeepSeek synthetic evidence is accepted; provider gateway and tool-route execution remain separate owner gates.
- Observability/cost: static policy exists; production monitoring, budgets, kill switches, and cost enforcement remain future work.
- Billing/credits: mock credit gates exist; real reservation, spend, release, refund, Stripe, and ledger writes remain backend-only.

## Internal Testing Gaps

- Ready: source handoff, metadata audit, mock-only lease/idempotency/gate inventory.
- Ready with warnings: dry-run planning can proceed if it remains no-execution and no-mutation.
- Blocked: worker execution, job dispatch, job claim/lease mutation, Supabase writes, SQL/migrations, Cloud Run/Docker, providers, tools/routes, media processing, public artifacts, signed URLs, credit mutation, beta, and production.

## Runtime Gates

All runtime gates remain closed: worker execution, job dispatch, job claim/lease mutation, Supabase writes, SQL, migrations, providers, tools, routes, raw prompt execution, media processing, public artifacts, signed URLs, Google Cloud, Docker, credit mutation, Stripe, Demucs, Track A, Track B, internal beta unlock, external beta unlock, paid production, and production.

## Supabase Classification

- Supabase update required: `no`.
- Supabase update status: no mutation, no SQL, no migration.
- Supabase environment touched: `no`.
- SQL executed: `false`.
- Migration deployed: `false`.
- Evidence docs: PR #335 contract readiness plus this worker runtime repo audit.
- Blockers: Supabase worker/job persistence and runtime config mutation remain blocked until Supabase owner approval.
- Next Supabase action: none in this prompt.

## Next Prompt

`WORKER-RUNTIME-UNLOCK-1: worker runtime dry-run plan, no execution`

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
