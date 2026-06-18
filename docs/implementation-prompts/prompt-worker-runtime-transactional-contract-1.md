# WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1

Track A private E2E worker claim/lease/RPC contract completion plan.

## Goal

Create the Worker Runtime transactional contract completion plan required after WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2. This prompt is planning-only until a later implementation prompt explicitly authorizes code, Supabase, SQL, RPC, service-role, worker, route, provider, media, artifact, or deployment changes.

## Current Blocker

Explicit blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.

## Required Source Evidence

- WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 decision: `blocked_pending_transactional_runtime_contract_completion`.
- Worker runtime execution readiness: `blocked_pending_transactional_backend_or_rpc_contract`.
- WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: `blocked_pending_transactional_runtime_contract_completion`.
- TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: `blocked_pending_worker_runtime_gate_2_completion`.
- INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_worker_runtime_gate_2`.
- Internal beta unlocked: false.
- #343 simulated claim evidence and `blocked_until_future_transactional_backend_runtime`.
- #502 Track A private E2E planning source-of-truth.
- #513 Tool Route Track A private E2E route-contract dry-run gate source-of-truth.

## Required Planning Outputs

- Decide the future transactional claim surface: backend claim service, Supabase RPC, or another approved narrow backend path.
- Define the claim/lease transaction contract, including idempotency key, approved plan snapshot reference, job family, lease timeout, heartbeat, stale lease behavior, retry/backoff, cancellation, event log persistence, artifact manifest, checksums, and QA report.
- Define the narrow service-role boundary and prove no broad service-role handler.
- Define how supporting Supabase planning will be requested through `prompt-supabase-tracka-worker-runtime-milestone-sync-if-needed.md` if schema/RPC work becomes necessary.
- Preserve public artifact, signed URL source-of-truth, final delivery/export, external beta, paid production, production, broad media, and internal beta blockers.

## Readiness To Preserve

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: `blocked_pending_transactional_runtime_contract_completion`

TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: `blocked_pending_worker_runtime_gate_2_completion`

INTERNAL-BETA-READINESS-ROLLUP readiness: `blocked_pending_worker_runtime_gate_2`

Internal beta unlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
