# ReeditPro Migration Order

This file is the canonical local migration order for ReeditPro as of RP-FIX-02.

Run migrations in filename timestamp order. The migration folder currently contains **18 migration files**.

These migrations are local repo artifacts until they are validated and deployed to the confirmed Supabase project named `reeditpro`. Do not use the Yuza Studio Supabase project. Do not commit credentials.

## Deployment Status

- Local migration docs: aligned with the actual migration folder.
- Remote deployment: not verified in this task.
- Remote table status: not verified in this task.
- Generated database types: not generated in this task.
- Deployment readiness: blocked until local validation and remote dry-run prove the overlapping schema chains are safe.

## Canonical Order

| Order | Filename | Milestone | System | Creates / Updates | Depends on | Deployment risk | Status |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `202605130001_core_reeditpro_tables.sql` | RP-DB-03 | Core | Plans, profiles, workspaces, members, subscriptions, projects, chat, media, source sequence, reference assets, RLS helpers | Supabase Auth, `pgcrypto` | Medium | Local only |
| 2 | `202605130002_intent_edit_planning_tables.sql` | RP-DB-04 | Planning | Intent analyses, source maps, recommended structures, edit plans, story beats, segments, signature routes, instructions, planning notes | Core tables and helper functions | Medium | Local only |
| 3 | `202605130003_professional_edit_quality_engine.sql` | RP-DB-05 | Edit Quality / SoundSync Music planning | Quality profiles, pacing, cuts, transitions, audio environment, ambience, music plans, SFX plans, captions, quality checks | Core and planning tables | Medium | Local only |
| 4 | `202605130004_credit_ledger_approval_gate.sql` | RP-DB-06 | Credits | Wallets, grants, ledger, estimates, approvals, reservations, refunds, balance view, generation gate helper | Core, planning, chat/actions | Medium | Local only |
| 5 | `202605130005_job_orchestration_agent_runs.sql` | RP-DB-07 | Jobs | Job batches, jobs, dependencies, events, agent runs/outputs, runtime configs, heartbeats, event log, progress view | Core, planning, credits | Medium | Local only |
| 6 | `202605130006_stroke_motion_data_model.sql` | RP-DB-08 | Stroke Motion | Stroke Motion plans, meaning expansions, beats, characters, symbols, transitions, timing anchors, storyboard frames, generation specs, examples | Core, planning, credits, jobs | Medium | Local only |
| 7 | `202605130007_generation_providers_generated_assets.sql` | RP-DB-09 | Generation Providers | Provider metadata, capabilities, models, generation requests/inputs/events/costs, generated assets/versions/timing maps | Core, planning, jobs, credits, Stroke Motion | Medium | Local only |
| 8 | `202605130008_render_preview_export_revision_qa.sql` | RP-DB-10 | Render / Preview / Export / QA | Render jobs/inputs/events, renders, exports, preview reviews, comments, revisions, QA reports/items, preview view | Core, planning, quality, credits, jobs, generation | Medium | Local only |
| 9 | `202605180001_reeditpro_core_workspace_projects.sql` | RP-DATA-04 | Core overlay | `profiles`, `workspaces`, `workspace_members`, `projects`, `edit_sessions`, `chat_messages`, `user_confirmations` | Supabase Auth; collides with earlier core names | High | Local only; must validate |
| 10 | `202605180002_reeditpro_media_source_sequence.sql` | RP-DATA-04 | Media / Source sequence overlay | `media_assets`, `uploaded_clips`, `source_sequence_items`, `clip_analysis_snapshots` | `projects`, `edit_sessions`; collides with earlier `media_assets` | High | Local only; must validate |
| 11 | `202605180003_reeditpro_intent_plan_versions.sql` | RP-DATA-04 | Planning overlay | `edit_intent_snapshots`, `edit_settings_snapshots`, `edit_plan_versions`, `plan_component_snapshots`, `edit_plan_segments`, `edit_operations` | Core overlay tables; collides with earlier `edit_plan_segments` | High | Local only; must validate |
| 12 | `202605180004_reeditpro_credits_approval_snapshots.sql` | RP-DATA-04 | Credits overlay | `credit_estimates`, `credit_estimate_items`, `credit_reservations`, `credit_ledger_entries`, refunds, approvals, approved snapshots, immutability triggers | Core/planning overlay tables; collides with earlier credit tables | High | Local only; must validate |
| 13 | `202605180005_reeditpro_generation_assets_jobs.sql` | RP-DATA-04 | Generation / Jobs overlay | `generation_requests`, `generation_events`, `generated_assets`, `generated_asset_versions`, `editing_jobs`, `job_steps`, `worker_events` | Approved snapshots, credits; collides with earlier generation tables | High | Local only; must validate |
| 14 | `202605180006_reeditpro_qa_exports_audit.sql` | RP-DATA-04 | QA / Exports / Audit overlay | `qa_reports`, `qa_check_results`, `revision_requests`, `final_exports`, `audit_events`, readiness/license snapshots | Overlay project/plan/job tables; collides with earlier QA/revision tables | High | Local only; must validate |
| 15 | `202605180007_reeditpro_rls_policies.sql` | RP-DATA-04 | RLS policies | RLS helper functions and policies for the `20260518` overlay schema | Overlay tables from orders 9-14 | High | Local only; must validate |
| 16 | `202605180008_reeditpro_storage_buckets_policies.sql` | RP-DATA-04 | Storage policies | Supabase storage buckets/policies for source, generated, renders, exports, worker temp | Supabase Storage schema and project auth context | Medium | Local only; must validate |
| 17 | `202605190001_sfx_director_tables.sql` | RP-SFX-03 | SoundSync SFX Director | SFX event, provider, prompt, generated asset, trim, timing, mix, QA, library, usage, adapter test tables and summary view | Core, planning, quality, generation, render/export tables, RLS helpers | High | Local only; must validate |
| 18 | `202605190002_storytiming_master_tables.sql` | RP-TIMING-03 | StoryTiming | Master maps, segments, anchors, events, dependencies, conflicts, resolutions, QA checks, render timing manifests/tracks/events, timing views | Core, planning, render jobs, SFX, RLS helpers | High | Local only; must validate |

## Important RP-FIX-02 Findings

The actual migration folder includes two overlapping schema chains:

- The `20260513` chain creates the original broad ReeditPro backend schema.
- The `20260518` chain creates a newer active-style schema with several table names that already exist in the earlier chain.

Duplicate table names found by static scan:

- `workspaces`, `workspace_members`, `projects`, `chat_messages`
- `media_assets`
- `edit_plan_segments`
- `credit_estimates`, `credit_reservations`, `credit_ledger_entries`
- `generation_requests`, `generation_events`, `generated_assets`, `generated_asset_versions`
- `qa_reports`, `revision_requests`

Most serious known collision risk:

- `202605180001_reeditpro_core_workspace_projects.sql` defines `projects.current_edit_session_id`, but `202605130001_core_reeditpro_tables.sql` creates `projects` earlier without that column and later planning adds `projects.current_edit_plan_id`.
- Because `202605180001` uses `create table if not exists public.projects`, the existing earlier table can remain unchanged. The later FK constraint on `projects.current_edit_session_id` can then fail if the column does not exist.

## Expected But Missing / Consolidated Migrations

- No dedicated SoundSync Music intelligence migration exists. Music planning currently appears in `202605130003_professional_edit_quality_engine.sql` through `music_plans` and related audio enums, with StoryTiming music coordination in `202605190002_storytiming_master_tables.sql`.
- No separate RP-DB-11 schema migration exists. The older RP-DB-11 work is documentation and local mock scenario artifacts, not a migration file.

## Before Any `supabase db push`

1. Install/verify Supabase CLI.
2. Confirm the target project is exactly `reeditpro`.
3. Keep `DEPLOY_TO_REEDITPRO_SUPABASE=true` as the explicit deploy gate.
4. Run local validation against a disposable local database.
5. Resolve or explicitly approve the overlapping `20260513` / `20260518` schema-chain risk.
6. Run remote dry-run only after the project is confirmed.
7. Attempt a schema-only backup before deployment.
8. Verify remote migration history and table list after deployment.
9. Generate remote database types only after deployment succeeds.

## Safety Notes

- These migrations do not store raw provider keys, Supabase service-role keys, JWT secrets, Stripe secrets, or webhook secrets.
- Provider and service-role references in SQL are comments, grants, or future secret reference labels, not actual secret values.
- The static scan found no `drop table`, `truncate`, or `delete from` statements in migration files.
- No provider APIs, AI APIs, Stripe calls, rendering, uploads, or mobile work happen in migrations.
