# Worker Runtime Track A Private E2E Gate 2 Next Phase Plan

Next phase status: `blocked_pending_transactional_runtime_contract_completion`

This plan records the next work needed after Gate 2 found insufficient transactional backend/RPC coverage.

## Next Prompts

Primary next prompt: `SUPABASE-TRACKA-WORKER-RUNTIME-MILESTONE-SYNC-IF-NEEDED -- Transactional backend/RPC contract planning`

Prompt file: `docs/implementation-prompts/prompt-supabase-tracka-worker-runtime-milestone-sync-if-needed.md`

Follow-up prompt if the contract gap is resolved: `WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-3-IF-NEEDED -- Post-contract readiness review`

Prompt file: `docs/implementation-prompts/prompt-worker-runtime-tracka-private-e2e-execution-gate-3-if-needed.md`

## Required Future Work

- Decide whether the transactional claim path is a Supabase RPC, backend claim service, or another approved service-role backend path.
- Define idempotency enforcement.
- Define lease timeout and heartbeat enforcement.
- Define retry/backoff and cancellation.
- Define append-only event log persistence.
- Define the narrow service-role boundary.
- Prove no broad service-role handler.
- Preserve approved plan snapshot enforcement.
- Preserve private manifest, checksum, and QA report requirements.
- Keep public artifacts, signed URL source-of-truth, final delivery, external beta, paid production, production, and internal beta unlock blocked.

## Current Readiness Values

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 decision: blocked_pending_transactional_runtime_contract_completion

Worker runtime execution readiness: blocked_pending_transactional_backend_or_rpc_contract

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: blocked_pending_transactional_runtime_contract_completion

TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_runtime_gate_2_completion

INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_runtime_gate_2

Internal beta unlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
