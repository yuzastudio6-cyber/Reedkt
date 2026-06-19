# Supabase Worker Runtime Transactional RPC 2 Proposed Schema Contract

Schema contract status: `planned_only_static_migration_ready`

This file documents proposed schema only. It does not create SQL, migrations, schema/RLS changes, triggers, grants, or database objects.

## Operation Family

Required job family: `tracka_private_e2e_revalidation`

Execution allowed in this phase: false

Persist to database: false in this phase

## Planned Entities

| Entity | Required Fields |
| --- | --- |
| `worker_jobs` | `id` uuid primary key, `job_family` text or enum, `status` text or enum, `approved_plan_snapshot_id` text or uuid, `restricted_scope_ref` text, `idempotency_key` text unique per job family where appropriate, `lease_owner` text nullable, `lease_expires_at` timestamptz nullable, `heartbeat_at` timestamptz nullable, `retry_count` integer, `retry_after` timestamptz nullable, `cancel_requested_at` timestamptz nullable, `canceled_at` timestamptz nullable, `error_summary` text nullable, `artifact_manifest_ref` text nullable, `qa_report_ref` text nullable, `created_at` timestamptz, `updated_at` timestamptz |
| `worker_job_events` | `id` uuid primary key, `worker_job_id` uuid foreign key, `event_type` text, `event_payload_sanitized` jsonb, `actor_type` text, `actor_ref` text nullable, `created_at` timestamptz |
| `worker_job_artifacts` | `id` uuid primary key, `worker_job_id` uuid foreign key, `artifact_type` text, `private_artifact_ref` text, `sha256` text, `size_bytes` bigint, `created_at` timestamptz |

## Planned Indexes

- `worker_jobs(job_family, status, created_at)`
- `worker_jobs(lease_expires_at)`
- `worker_jobs(job_family, idempotency_key)`
- `worker_job_events(worker_job_id, created_at)`
- `worker_job_artifacts(worker_job_id, artifact_type)`

## Required Constraints

- `job_family` must allow only the approved Track A private E2E family for this operation path.
- `approved_plan_snapshot_id` and `restricted_scope_ref` are required before future claim execution.
- `idempotency_key` must prevent duplicate claim, heartbeat, completion, failure, cancellation, stale lease release, and event append effects.
- `lease_owner`, `lease_expires_at`, and `heartbeat_at` must support owned lease enforcement.
- `artifact_manifest_ref`, `qa_report_ref`, `private_artifact_ref`, and `sha256` must stay metadata-only and private.
- Event payloads must be sanitized and must not store secrets, signed URL values, raw prompts, provider payloads, private artifact payloads, or public artifact refs.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
