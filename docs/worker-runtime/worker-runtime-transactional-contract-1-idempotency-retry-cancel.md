# Worker Runtime Transactional Contract 1 Idempotency Retry Cancel

Plan status: `blocked_pending_supabase_worker_rpc_schema_readiness`

This document defines planned-only idempotency, retry, and cancellation rules for future Track A private E2E worker runtime execution.

## Idempotency Contract

- Idempotency keys must bind to `workerJobFamily: tracka_private_e2e_revalidation`.
- Idempotency keys must bind to the approved plan snapshot reference.
- Idempotency keys must bind to job id, operation name, worker instance id, request hash, and attempt number where applicable.
- Replayed identical requests must return the previous safe decision.
- Conflicting replays must fail with `TRACKA_WORKER_IDEMPOTENCY_CONFLICT`.
- Idempotency records must not store secrets, signed URL values, raw prompt text, provider credentials, private artifact payloads, or Secret Manager payloads.

## Retry Contract

- Retry/backoff must be policy-controlled and tied to the approved snapshot.
- Retry must never bypass the worker gate, tool route gate, artifact policy, QA requirements, or blocked scope register.
- Lease expiry can make a job retry-eligible only through `release_expired_tracka_private_e2e_leases`.
- Retry attempts must append events and preserve attempt history.
- Retry exhaustion must end in `failed` or `cancelled`, not public artifact creation or final delivery.

## Cancellation Contract

- Cancellation must be explicit, auditable, and persistent.
- Cancellation must prevent new claims and terminate or release active leases through the approved backend/RPC boundary.
- Cancellation must preserve event logs and audit refs.
- Cancellation must not delete approved snapshots, private evidence manifests, or audit events.

## Required Future Proof

Worker Gate 2R must see implementation evidence for idempotency, retry/backoff, cancellation, stale lease release, and append-only events before it can move from blocked to ready.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
