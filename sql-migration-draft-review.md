# SQL Migration Draft Review

## Purpose

The SQL files in this milestone are review drafts only. They are not active Supabase migrations and should not be applied to any database until reviewed, hardened, and copied into a real migration folder in a future milestone.

These drafts translate the RP-DATA-01 schema bridge into reviewable Postgres/Supabase-style SQL. They are intended to make table shape, relationships, JSONB strategy, RLS direction, and storage assumptions visible before real migration work begins.

## Draft-Only Folder

Draft SQL lives in:

- `database/migration-drafts/`

Do not use:

- `supabase/migrations/`

The Supabase CLI migration folder can be treated as executable migration history. RP-DATA-02 files are not approved migration history; they are draft review artifacts.

## Review Order

Review the draft files in this order:

1. `001_core_workspace_projects.draft.sql`
2. `002_media_and_source_sequence.draft.sql`
3. `003_intent_and_plan_versions.draft.sql`
4. `004_credits_approval_snapshots.draft.sql`
5. `005_generation_assets_jobs.draft.sql`
6. `006_qa_exports_audit.draft.sql`
7. `007_rls_policy_drafts.draft.sql`
8. `008_storage_bucket_policy_drafts.draft.sql`

## Reviewer Checklist

Reviewers must check:

- table fields and defaults
- foreign keys and cascade behavior
- indexes and query paths
- JSONB snapshot strategy
- RLS policy direction
- approved snapshot immutability
- credit estimate and approval linkage
- job and worker linkage to approved snapshots
- private storage assumptions
- audit event append-only behavior
- future credit ledger compatibility
- future worker/service-role assumptions
- no provider secrets in schema
- no public source media access

## Non-Goals

This task does not:

- run migrations
- apply SQL
- connect Supabase
- create real storage buckets
- implement RLS in a live project
- implement backend workers
- implement billing, credit reservation, or credit deduction

