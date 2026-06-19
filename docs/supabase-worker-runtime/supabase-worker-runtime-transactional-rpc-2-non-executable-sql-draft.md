# Supabase Worker Runtime Transactional RPC 2 Non-Executable SQL Draft

NON-EXECUTABLE DRAFT - DO NOT RUN

This document is not a migration file. It is not under `supabase/migrations/`. It exists only to make the future static migration implementation packet reviewable before any SQL is created or executed.

## Draft Intent

The future migration may create private worker runtime schema objects for the `tracka_private_e2e_revalidation` operation family, including `worker_jobs`, `worker_job_events`, `worker_job_artifacts`, and RPC functions for claim, heartbeat, complete, fail, cancel, stale lease release, and event append.

## Draft Shape

```sql
-- NON-EXECUTABLE DRAFT - DO NOT RUN
-- Future static packet only; no SQL was executed in RPC-2.

-- create private worker runtime schema outside exposed/public paths.
-- create worker_jobs with approved snapshot, restricted scope, idempotency, lease, retry, cancel, manifest, and QA fields.
-- create worker_job_events with sanitized append-only event payloads.
-- create worker_job_artifacts with private artifact refs and sha256 checksums.
-- enable RLS where applicable and deny anon/auth worker mutation.
-- create operation-specific functions in a private schema with reviewed search_path.
-- implement claim_tracka_private_e2e_job with transactional single-claim behavior such as FOR UPDATE SKIP LOCKED.
-- implement heartbeat, complete, fail, cancel, release_expired_leases, and append_event with idempotency and event persistence.
```

## Required Future Review

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-3 must convert this draft into a static migration packet for review only. SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4 remains blocked until the static packet is complete, a staging target is confirmed, and explicit confirmation gates are set.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
