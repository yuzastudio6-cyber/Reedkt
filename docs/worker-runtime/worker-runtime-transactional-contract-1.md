# WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1

Status: `completed_contract_completion_plan_blocked_pending_rpc_schema_implementation`

Patch type: Worker Runtime transactional claim/lease/RPC contract completion plan for restricted Track A private E2E revalidation.

Workstream owner: `WORKER_RUNTIME_JOBS`

Related workstreams: `TRACK_A_RENDER_EXPORT`, `TOOL_ROUTE_COORDINATION`, `SUPABASE_RLS_STORAGE_DATABASE`, `INTERNAL_BETA_READINESS`, `OBSERVABILITY_AUDIT_COST`, `COMPLIANCE_SECURITY`, `BILLING_STRIPE_CREDITS`.

Explicitly not owned: worker execution, job claim execution, lease acquisition, heartbeat execution, service-role handler execution, route/tool/provider/model execution, Track A runtime/media execution, FFmpeg/FFprobe/libass/Remotion execution, private artifact or GCS access, signed URL creation, public artifact creation, Supabase mutation, SQL execution, migration/schema/RLS deployment, dependency mutation, final delivery/export, internal beta unlock, external beta unlock, paid production unlock, production unlock, or broad media unlock.

## Source-Of-Truth Decision

WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1 decision: completed_contract_completion_plan_blocked_pending_rpc_schema_implementation

Worker runtime transactional contract readiness: blocked_pending_supabase_worker_rpc_schema_readiness

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 readiness: ready_for_migration_readiness_planning

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: blocked_pending_transactional_contract_implementation

TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_transactional_contract

INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_transactional_contract

Internal beta unlocked: false

trackAInternalBetaUnlocked: false

## Decision Reason

The current source does not yet provide a complete Track A private E2E transactional worker runtime contract. The blocker from #516 remains source-of-truth at contract/planning level:

Explicit blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.

Current source has generic worker claim helpers and review-only Supabase readiness migrations. It does not have a Track A-specific atomic RPC/backend operation family, a proved narrow service-role runtime boundary, or persistent Track A event/lease enforcement sufficient to rerun Worker Gate 2 as ready.

## Contract Completion Scope

This packet completes the planning contract for the blocked path. It defines the future transactional RPC/backend operation family, schema requirements, claim/lease state machine, idempotency/retry/cancel rules, event log persistence contract, service-role boundary, security/RLS readiness, Supabase handoff, and Track A handoff.

It does not create the RPCs, tables, policies, migrations, worker handlers, route handlers, service-role handlers, signed URLs, artifacts, provider calls, media processing, or beta/production unlocks.

## Supabase Classification

Supabase update required: docs/status only

Supabase update status: docs_only

Supabase environment touched: none

SQL executed: none

Migration deployed: no

Next Supabase action: SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 migration readiness planning

## Human Action Required

none

## Known Limitations

This packet is intentionally blocked pending future Supabase/RPC/schema implementation. Worker Gate 2R cannot proceed until the future transactional backend/RPC contract is implemented and validated by a separate milestone.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
