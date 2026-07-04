# Project Edit Brief Supabase Persistence Plan

## Decision

`project_edit_brief_supabase_persistence_plan_passed_ready_for_production_readiness_gates`

## Scope

RP-EDITBRIEF-13 is a persistence plan and validation milestone only. It adds no Supabase migration, no SQL execution, no Supabase CLI command, no storage operation, no service-role secret read, no generated database type update, no live route enablement, no provider/model call, no upload, no media processing, no worker dispatch, no render/export job, and no credit reservation or spend.

The Project Edit Brief UI and repository seam remain mock/local on this PR branch. Production persistence still requires a later owner-approved readiness gate.

## Source Reconciliation

The current ProjectEditBrief Supabase repository skeleton maps the product-facing Project Edit Brief language onto existing durable roots:

- `edit_briefs`
- `edit_cues`
- `edit_cue_assets`
- `edit_cue_messages`
- `edit_cue_intents`
- `edit_cue_confirmations`
- `edit_cue_conflicts`
- `edit_cue_revisions`
- `edit_brief_application_logs`
- `edit_session_export_settings`

Earlier `project_edit_*` names are historical logical names from the architecture planning phase. They are not the default migration target. Do not create parallel `project_edit_briefs` or `project_edit_brief_*` tables unless an owner explicitly approves a table-family rename/migration.

## Supabase Policy Inputs

Current Supabase documentation inputs reviewed for this plan:

- Row Level Security must be enabled on exposed tables and policies should target `TO authenticated`.
- Authorization should use `auth.uid()` and not user-editable `raw_user_meta_data`.
- API exposure defaults can vary by project generation, so production migrations should pair RLS with explicit grants and schema exposure review.
- Storage access is controlled through `storage.objects` policies; upsert requires the required insert/select/update policy coverage.
- Service-role keys bypass RLS and must remain backend-only. Frontend/browser code must never receive service-role credentials.
- Signed URLs are delivery artifacts and must not become source truth for Edit Brief state.

## Required Production Readiness Gates

RP-EDITBRIEF-14 must verify these before any durable Project Edit Brief route can be considered production-ready:

- Owner approval for the durable root mapping and any missing columns.
- Authenticated project/session access policy through workspace membership and project ownership.
- RLS policy review for `edit_briefs`, `edit_cues`, all cue child tables, application logs, and export settings.
- Explicit Data API grants and exposed-schema review.
- Backend-only service-role repository boundary.
- Storage policy review for any future attachment artifact source, while keeping current attachments metadata-only.
- Migration review, generated type refresh, and local/remote Supabase validation.
- Route idempotency, audit logging, no raw prompts, no secrets, no signed URL source truth, and no private artifact leakage.
- Approved plan snapshot and credit estimate/reservation gates before any expensive planner, worker, provider, render, or tool execution.

## Boundary Confirmations

- No migration was added.
- No SQL was executed.
- No Supabase CLI command was run.
- No Supabase read or write was enabled.
- No Storage read, write, upload, bucket change, or signed URL creation was enabled.
- No API route changed from mock/local to production-ready.
- No media file bytes, external URL contents, provider payload, worker job, render/export job, or credit event was created.

## Next Milestone

`RP-EDITBRIEF-14 - Production Readiness Gates`
