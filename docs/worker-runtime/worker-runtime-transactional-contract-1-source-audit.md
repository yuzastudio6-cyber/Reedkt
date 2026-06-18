# Worker Runtime Transactional Contract 1 Source Audit

Audit status: `blocked_pending_supabase_worker_rpc_schema_readiness`

This audit records source evidence for the Track A private E2E worker claim/lease/RPC contract completion plan. It is docs/status only.

## Merged Source Evidence

| Source | Merge SHA | Contract relevance |
| --- | --- | --- |
| #334 | `e31c58b4063a2b924852f4fd89770c243079f3ad` | Candidate approved-plan snapshot contract; no runtime approval. |
| #340 | `f33b36e246268ce4231045ed6aab8de46ef1ac94` | Worker Runtime repo audit; claim execution remained blocked. |
| #343 | `82672f2cda8c4f84e970a6a2275a7802ed3954ea` | Approved-plan snapshot dry-run; simulated claim only. |
| #347 | `ff9b87d5128dc09f618e7f96c71a4d2b3ac82b49` | Tool Route execution unlock audit; route execution remained blocked. |
| #375 | `b1fc1d40c5a41c6e3874331d2ed84dc7072d7364` | Route dry-run planning source. |
| #380 | `809c4ec3d3c54c7629d90a35fcc89eeff527cf2b` | Generated local fixture planning source. |
| #497 | `59f82beb641fd772bfeddc8a244f148c3dbb267a` | Track A restricted scope approved only for private E2E revalidation planning. |
| #502 | `e23a56d3ff76122ff5dd5edaae59156e422ffe03` | Track A private E2E planning source-of-truth. |
| #505 | `7436ffd1de24d9666150aa552464997d3eedaddf` | Worker Runtime Track A Gate 1 source-of-truth. |
| #510 | `0c7eab149615b3700a0eea38a2d10c34420fe6da` | Tool Route Track A Gate 1 source-of-truth. |
| #513 | `eed130e64b680c30b26a020099f3b51f58e2b339` | Tool Route Track A Gate 2 source-of-truth. |
| #516 | `73eb9f808920d7c8acb8c9a7e390b5a0442a0f26` | Worker Runtime Gate 2 blocked pending transactional runtime contract completion. |

Confirmed base: `origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` at `73eb9f808920d7c8acb8c9a7e390b5a0442a0f26`.

## Present Source Evidence

- `server/services/worker-claim-service.ts` includes a generic worker claim helper, heartbeat helper, and release helper.
- `server/services/worker-claim-service.ts` first calls `can_claim_worker_job`, then inserts into `worker_job_claims`.
- `server/services/worker-claim-service.ts` includes the source TODO: `replace with transaction/RPC to avoid claim race windows`.
- `server/workers/worker-claim-runner.ts` has a dry-run path and a runtime path, but this phase did not execute it.
- `server/workers/worker-gates.ts` records approved snapshot, credit, raw-chat, job status, and tool readiness gates.
- `src/types/e2e-runtime.ts` has generic worker claim, heartbeat, release, event, artifact, and QA payload types.
- `src/types/worker-lease.ts` has generic lease status and claim result types.
- `supabase/migrations/202605200002_worker_leases_runtime_transport.sql` defines review/local-only worker lease and runtime transport tables.
- `supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql` defines review/local-only readiness tables including `api_idempotency_keys`, `signed_url_events`, and `worker_job_claims`.
- `supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql` defines generic `active_worker_claim_exists` and `can_claim_worker_job` helpers.

## Missing Source Evidence

- Missing Track A-specific transactional operation family.
- Missing atomic transactional claim RPC/backend path.
- Missing persistent Track A event/lease enforcement.
- Missing narrow service-role runtime boundary implementation.
- Missing production-ready migration/RLS implementation for the required Track A worker claim lifecycle.
- Missing Worker Gate 2R-ready proof that claim/lease/event persistence is enforced by a single authorized backend/RPC boundary.

## Decision

WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1 decision: completed_contract_completion_plan_blocked_pending_rpc_schema_implementation

Worker runtime transactional contract readiness: blocked_pending_supabase_worker_rpc_schema_readiness

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 readiness: ready_for_migration_readiness_planning

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: blocked_pending_transactional_contract_implementation

TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_transactional_contract

INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_transactional_contract

Internal beta unlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
