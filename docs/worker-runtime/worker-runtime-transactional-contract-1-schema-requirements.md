# Worker Runtime Transactional Contract 1 Schema Requirements

Schema readiness: `blocked_pending_supabase_worker_rpc_schema_readiness`

This document records future schema requirements only. It does not create migrations, SQL, RLS policies, storage buckets, database functions, or live Supabase changes.

## Required Future Schema Concepts

| Concept | Purpose | Requirement |
| --- | --- | --- |
| Track A worker jobs | Restrict job records to `tracka_private_e2e_revalidation`. | Must point to approved snapshot, project, workspace, route gate, worker gate, and blocked-scope register. |
| Track A worker claims | Record claim ownership. | Must enforce one active claim per job and atomic claim creation. |
| Track A worker leases | Enforce lease ownership and expiry. | Must require lease token, worker instance, heartbeat time, expiry time, and released/completed/failed/cancelled terminal status. |
| Track A worker events | Append-only event log. | Must persist claim, heartbeat, retry, cancellation, artifact evidence, QA, completion, and failure events. |
| Track A idempotency keys | Prevent duplicate claim/transition side effects. | Must bind request hash to job id, worker job family, operation, and approved snapshot. |
| Artifact evidence refs | Preserve private manifest/checksum/QA evidence. | Must reference private manifest, checksums, FFprobe metadata, and QA report without storing public artifacts or signed URL source-of-truth. |
| Audit refs | Support security and compliance review. | Must record actor, operation, service boundary, redaction status, and no secret payloads. |

## Existing Source Is Not Enough

The current readiness migration includes generic `worker_job_claims` and helper functions, but the claim helper still performs `can_claim_worker_job` followed by an insert. That leaves the atomic claim/RPC requirement unresolved for this Track A gate.

The current `worker_leases`, `backend_runtime_messages`, and `job_claim_attempts` tables are review/local-only readiness evidence. They are not a deployed Track A transactional schema and do not unlock Worker Gate 2R.

## Future Schema Review Requirements

- RLS must deny normal user mutation for worker claims, worker leases, worker events, artifact evidence, and audit events.
- Service-role writes must be narrow and operation-specific.
- Append-only event behavior must be enforced.
- Approved plan snapshots must remain immutable.
- Worker jobs must execute approved snapshots, not raw chat.
- Public artifacts and signed URL source-of-truth must remain blocked.
- Private artifact references must avoid payload leakage.
- Migration rollout must be separately planned and validated before any SQL is run.

## Supabase Classification

Supabase update required: docs/status only

Supabase update status: docs_only

Supabase environment touched: none

SQL executed: none

Migration deployed: no

Next Supabase action: SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 migration readiness planning

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
