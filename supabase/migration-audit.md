# Supabase Migration Audit

## RP-FIX-07 Local Audit

Date: 2026-05-20

No remote migration was run. No production Supabase project was contacted.

## Storage Migrations

Existing active storage migration:

- `migrations/202605180008_reeditpro_storage_buckets_policies.sql`

It creates private active buckets and project-scoped storage policies for the older `<project_id>/...` path convention.

RP-FIX-07 adds:

- `migrations/202605200001_storage_upload_pipeline_readiness.sql`

This local-only migration keeps the same bucket ids, keeps buckets private, and adds conservative policies for:

```text
workspace/{workspace_id}/project/{project_id}/...
```

The new policies:

- allow authenticated project members to read project objects in private buckets;
- allow project editors to insert/update only `source-media` and `thumbnails`;
- do not create anonymous access;
- do not add direct user write policies for generated assets, previews, exports, QA artifacts, or worker temp files;
- do not add workspace-only profile/brand asset policies.

## Not Run

- No local Supabase migration command was executed.
- No staging or production migration was executed.
- No Supabase advisor review was run.
- No buckets or policies were created remotely.

## Follow-Up

Before deployment, run local/staging storage policy smoke tests and verify that old `<project_id>/...` paths and new workspace/project paths do not produce unintended access.

## RP-FIX-11 Local Audit

Date: 2026-05-20

No remote migration was run. No production Supabase project was contacted.

RP-FIX-11 adds:

- `migrations/202605200002_worker_leases_runtime_transport.sql`

This local-only migration creates `worker_leases`, `backend_runtime_messages`, and `job_claim_attempts` for future backend/worker ownership and runtime message tracking. It keeps mutation grants service-role only, exposes only conservative authenticated select policies, and does not create broad frontend write access.

Before deployment, validate transaction-safe lease claiming, idempotency behavior, stale lease recovery, and RLS membership filters in local/staging Supabase.
