# Supabase Worker Runtime Transactional RPC 3 Static Migration Summary

Static migration: `supabase/migrations/202606180001_worker_runtime_transactional_rpc.sql`

SQL executed: none

Migration deployed: no

Supabase environment touched: none

## Schema Objects

- `public.worker_jobs`: Track A private E2E job records with `tracka_private_e2e_revalidation`, approved snapshot refs, restricted scope refs, idempotency, lease owner/expiry, heartbeat, retry/cancel fields, private manifest refs, checksum/QA refs, and blocker flags.
- `public.worker_job_events`: sanitized append-only event records for claim, heartbeat, complete, fail, cancel, lease expiry, and artifact/event tracking.
- `public.worker_job_artifacts`: private artifact refs, `sha256` checksums, artifact manifest refs, QA report refs, FFprobe metadata refs, and explicit public/signed URL blockers.
- `worker_runtime`: private RPC schema for service-role-only functions.

## Static Safety Properties

- Tables are additive and RLS-enabled.
- Direct public, anon, and authenticated table access is revoked.
- Service-role table access is scoped to the three new Worker Runtime tables.
- RPC functions live in the private `worker_runtime` schema, use `security definer`, set an explicit `search_path`, and revoke public/anon/authenticated execution.
- `public_artifact_allowed`, `signed_url_source_of_truth_allowed`, `final_delivery_allowed`, and `internal_beta_unlock_allowed` remain false in the schema constraints.

## Scope

This is a static implementation packet only. It creates a reviewable migration file in the repository and does not apply it to local, staging, or production Supabase.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
