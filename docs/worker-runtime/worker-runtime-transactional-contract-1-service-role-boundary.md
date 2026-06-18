# Worker Runtime Transactional Contract 1 Service Role Boundary

Boundary status: `blocked_pending_supabase_worker_rpc_schema_readiness`

This document records the future narrow service-role boundary for Track A private E2E worker claim/lease/RPC operations. It does not create, run, or deploy a service-role handler.

## Boundary Requirements

- Service-role access must be backend-only.
- Credentials must be resolved through approved backend-only Google Secret Manager credential resolution in a future milestone.
- Secret Manager payloads must not be read, printed, logged, written to docs, written to PR bodies, or stored in artifacts.
- The future handler must only expose operation-specific behavior for the planned Track A worker RPC/backend operation family.
- The future handler must not be a broad service-role handler.
- The future handler must not accept raw prompt execution.
- The future handler must not create public artifacts or signed URL source-of-truth.
- The future handler must not unlock internal beta, external beta, paid production, production, final delivery, or broad media.

## Allowed Future Service-Role Responsibilities

- Validate approved snapshot reference.
- Validate `workerJobFamily: tracka_private_e2e_revalidation`.
- Validate Worker Gate 2R and Tool Route Gate status.
- Perform atomic claim/lease state transitions.
- Enforce idempotency, heartbeat, retry/backoff, cancellation, and stale lease release.
- Persist append-only worker events.
- Persist private artifact manifest/checksum/QA references after separate execution authorization.
- Preserve audit records without secret payloads.

## Blocked Until Future Milestone

The current repo has no approved service-role runtime boundary implementation for Track A private E2E worker claims. Therefore:

Worker runtime transactional contract readiness: blocked_pending_supabase_worker_rpc_schema_readiness

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: blocked_pending_transactional_contract_implementation

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
