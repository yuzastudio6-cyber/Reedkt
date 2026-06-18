# Worker Runtime Track A Private E2E Gate 2 Idempotency Retry Cancel Plan

Plan status: `planned_blocked_pending_transactional_runtime_contract_completion`

This plan records future runtime requirements only. It does not implement idempotency, retries, cancellation, workers, claims, leases, Supabase writes, SQL, or service-role handlers.

## Idempotency Plan

- Future worker jobs must include an `idempotencyKey`.
- The idempotency key must bind to `approvedPlanSnapshotRef`, `workerJobFamily: tracka_private_e2e_revalidation`, and the restricted Track A scope from #497/#502.
- A duplicate claim must resolve through the future transactional backend/RPC path, not through client-side checks.
- Raw prompt text cannot be used as the idempotency source.

## Retry And Backoff Plan

- Retry/backoff policy must be explicit before worker runtime execution.
- Retries must preserve the same approved plan snapshot and idempotency key.
- Retry budget must prevent broad media or production scope escalation.
- Terminal failures must write append-only event records in the future runtime and keep final delivery/export blocked.

## Cancellation Plan

- Cancellation must be checked before claim, after lease acquisition, before provider/tool/media work, and before artifact finalization.
- Cancellation cannot delete audit evidence.
- Cancellation cannot create public artifacts, signed URLs, final delivery artifacts, or beta/production unlocks.
- Cancelled jobs must remain private and traceable to the approved snapshot and event log.

## Current Blocker

The future rules above are not yet backed by an approved transactional backend/RPC contract, service-role runtime boundary, or event-log persistence implementation. Worker runtime execution remains blocked.

## Gate Decision

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 decision: blocked_pending_transactional_runtime_contract_completion

Worker runtime execution readiness: blocked_pending_transactional_backend_or_rpc_contract

TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_runtime_gate_2_completion

Internal beta unlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
