# Worker Runtime Transactional Contract 1 Claim Lease State Machine

State machine readiness: `blocked_pending_supabase_worker_rpc_schema_readiness`

This state machine is a future contract only. No worker claimed a job, acquired a lease, sent a heartbeat, released a lease, or completed Track A runtime/media execution in this phase.

## Planned States

| State | Meaning | Entry operation | Exit operation |
| --- | --- | --- | --- |
| `planned` | Job exists as future approved-snapshot work. | future job creation | `claim_tracka_private_e2e_job` |
| `claimable` | Required gates are ready for future execution. | future gate readiness | `claim_tracka_private_e2e_job` or `cancel_tracka_private_e2e_job` |
| `claimed` | A worker owns the lease. | `claim_tracka_private_e2e_job` | `heartbeat_tracka_private_e2e_job`, `complete_tracka_private_e2e_job`, `fail_tracka_private_e2e_job`, `cancel_tracka_private_e2e_job`, or expiry |
| `active` | Worker is executing the approved snapshot under lease. | first valid heartbeat | heartbeat, completion, failure, cancellation, or expiry |
| `retry_wait` | Job may retry after controlled backoff. | failed attempt or released stale lease | future retry claim or cancellation |
| `cancelled` | Job must not execute. | `cancel_tracka_private_e2e_job` | terminal |
| `completed` | Private evidence was recorded and QA accepted. | `complete_tracka_private_e2e_job` | terminal |
| `failed` | Job exhausted allowed retry or failed globally. | `fail_tracka_private_e2e_job` | terminal |
| `lease_expired` | Lease expired before completion. | `release_expired_tracka_private_e2e_leases` | retry_wait or failed |

## Transition Guards

- `approvedPlanSnapshotRequired: true`
- `toolRouteGateRequired: true`
- `workerGateRequired: true`
- `idempotencyRequired: true`
- `leaseTimeoutRequired: true`
- `heartbeatRequired: true`
- `cancellationRequired: true`
- `retryBackoffRequired: true`
- `eventLogRequired: true`
- `artifactManifestRequired: true`
- `checksumRequired: true`
- `QAReportRequired: true`
- `signedUrlSourceOfTruthAllowed: false`
- `publicArtifactAllowed: false`
- `finalDeliveryAllowed: false`
- `internalBetaUnlockAllowed: false`

## Terminal Safeguards

Completion must not mean final delivery/export, public artifact creation, signed URL source-of-truth, internal beta unlock, external beta unlock, paid production, production, or broad media unlock. Completion can only mean the future worker job lifecycle reached a valid private-evidence terminal state after separate implementation and validation.

## Decision

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: blocked_pending_transactional_contract_implementation

TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_transactional_contract

INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_transactional_contract

Internal beta unlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
