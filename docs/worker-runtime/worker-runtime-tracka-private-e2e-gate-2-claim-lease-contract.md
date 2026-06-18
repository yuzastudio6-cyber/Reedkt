# Worker Runtime Track A Private E2E Gate 2 Claim Lease Contract

Contract status: `blocked_pending_transactional_backend_or_rpc_contract`

This contract records the minimum future claim/lease requirements for Track A private E2E revalidation. It does not execute claims, acquire leases, heartbeat workers, mutate Supabase, or create a service-role runtime.

## Future Claim Lease Contract

workerJobFamily: `tracka_private_e2e_revalidation`

claimMode: `future_transactional_backend_or_rpc_only`

executionAllowedInThisPhase: false

approvedPlanSnapshotRequired: true

toolRouteGateRequired: true

workerGateRequired: true

idempotencyRequired: true

leaseTimeoutRequired: true

heartbeatRequired: true

cancellationRequired: true

retryBackoffRequired: true

eventLogRequired: true

artifactManifestRequired: true

checksumRequired: true

QAReportRequired: true

signedUrlSourceOfTruthAllowed: false

publicArtifactAllowed: false

finalDeliveryAllowed: false

internalBetaUnlockAllowed: false

## Current Evidence

#343 claim attempted: false

#343 simulated claim: true

#343 approved for runtime: false

#343 real runtime blocker: `blocked_until_future_transactional_backend_runtime`

plannedLeaseTimeout: `15 minutes`

plannedHeartbeatInterval: `60 seconds`

Transactional RPC required: true

## Contract Blocker

The repo has a planning contract and dry-run simulator, but it does not have a source-of-truth transactional backend/RPC claim implementation or approved service-role execution boundary. This Gate 2 therefore remains blocked.

## Required Future Completion Criteria

- Atomic job claim path that prevents double claims.
- Idempotency key enforcement tied to approved snapshot and job family.
- Lease timeout enforcement.
- Heartbeat extension or stale-lease marking policy.
- Retry/backoff budget and terminal failure policy.
- Cancellation checks before claim, during lease, and before artifact finalization.
- Append-only event log persistence contract.
- Narrow service-role handler boundary with no broad service-role handler.

## Gate Decision

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 decision: blocked_pending_transactional_runtime_contract_completion

Worker runtime execution readiness: blocked_pending_transactional_backend_or_rpc_contract

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2 readiness: blocked_pending_transactional_runtime_contract_completion

Internal beta unlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
