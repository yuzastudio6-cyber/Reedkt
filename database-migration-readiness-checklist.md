# Database Migration Readiness Checklist

This checklist defines what must be true before ReeditPro creates real Supabase migrations. It is not a migration and does not run SQL.

## Required Before First Migration

- Supabase project chosen and verified as `reeditpro`.
- Environment strategy defined for local, dev, staging, and production.
- Local/dev/staging/prod separation documented.
- RLS policy design reviewed.
- Storage bucket design reviewed.
- Approved snapshot shape finalized enough for v1.
- Credit ledger architecture decided.
- Worker job architecture decided.
- Provider secrets storage strategy decided.
- Audit logging policy decided.
- Privacy and data retention policy drafted.

## Migration Safety Rules

- Never write migrations that assume old plan versions can be overwritten.
- Approved snapshots are immutable.
- Credit ledger records are append-only.
- Audit events are append-only.
- Worker writes use service role.
- User writes are scoped through RLS.
- No provider secrets in frontend.
- No public source media bucket.
- Workers execute approved snapshots, not raw chat.

## Table Readiness Checklist

For every MVP table, confirm:

- Fields reviewed.
- Indexes reviewed.
- RLS policy reviewed.
- JSONB fields reviewed.
- Status lifecycle reviewed.
- Foreign keys reviewed.
- Cascade behavior reviewed.

MVP tables:

- `profiles`
- `workspaces`
- `workspace_members`
- `projects`
- `edit_sessions`
- `chat_messages`
- `media_assets`
- `uploaded_clips`
- `source_sequence_items`
- `edit_intent_snapshots`
- `edit_plan_versions`
- `credit_estimates`
- `credit_estimate_items`
- `approval_records`
- `approved_plan_snapshots`
- `generation_requests`
- `generated_assets`
- `editing_jobs`
- `job_steps`
- `qa_reports`
- `final_exports`
- `audit_events`

## Migration Naming Conventions

Future migration names should follow a small staged sequence:

- `001_core_workspace_projects.sql`
- `002_media_and_source_sequence.sql`
- `003_intent_and_plan_versions.sql`
- `004_credits_approval_snapshots.sql`
- `005_generation_assets_jobs.sql`
- `006_qa_exports_audit.sql`

Do not create these migrations in RP-DATA-01.

## Rollback And Audit Policy

- Migrations must be reviewed before apply.
- Production migrations require a backup plan.
- Approved snapshots must never be lost.
- Audit events remain append-only.
- Any rollback must preserve approved plan snapshot history, credit/audit records, and project ownership boundaries.
