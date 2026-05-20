# Supabase

This repository targets the Supabase project named exactly `reeditpro`.

Do not use the Yuza Studio Supabase project. Do not commit Supabase credentials, service-role keys, provider API keys, webhook secrets, signed URLs, or real `.env` values.

## Current Status

- Migration files in repo: 18.
- Migration documentation: aligned by RP-FIX-02.
- Remote deployment: not verified here.
- Remote table verification: not verified here.
- Generated database types: not generated here.
- Deployment readiness: blocked until Supabase CLI, project confirmation, local validation, remote dry-run, schema backup, and the explicit deploy gate all pass.

These migrations are local repo artifacts until applied to the confirmed remote `reeditpro` Supabase project.

## Current Migration Chain

Run these files in timestamp order:

| Order | Migration | System |
| ---: | --- | --- |
| 1 | `202605130001_core_reeditpro_tables.sql` | Core account, workspace, project, chat, media, source sequence, reference assets |
| 2 | `202605130002_intent_edit_planning_tables.sql` | Intent, edit planning, story beats, segments, signature routes |
| 3 | `202605130003_professional_edit_quality_engine.sql` | Edit quality, pacing, cuts, transitions, audio environment, music plans, SFX plans, captions |
| 4 | `202605130004_credit_ledger_approval_gate.sql` | Credits, estimates, approvals, reservations, refunds, generation gate |
| 5 | `202605130005_job_orchestration_agent_runs.sql` | Jobs, dependencies, events, agent runs, worker runtime config |
| 6 | `202605130006_stroke_motion_data_model.sql` | Stroke Motion plans, meaning expansion, beats, characters, symbols, timing anchors, generation specs |
| 7 | `202605130007_generation_providers_generated_assets.sql` | Provider metadata, generation requests, generated assets, timing maps, cost records |
| 8 | `202605130008_render_preview_export_revision_qa.sql` | Render jobs, renders, exports, preview reviews, revisions, QA reports |
| 9 | `202605180001_reeditpro_core_workspace_projects.sql` | Newer core overlay for profiles, workspaces, projects, edit sessions, chat messages, confirmations |
| 10 | `202605180002_reeditpro_media_source_sequence.sql` | Newer media/source sequence overlay |
| 11 | `202605180003_reeditpro_intent_plan_versions.sql` | Newer intent snapshots, plan versions, component snapshots, operations |
| 12 | `202605180004_reeditpro_credits_approval_snapshots.sql` | Newer credit, approval, approved snapshot overlay |
| 13 | `202605180005_reeditpro_generation_assets_jobs.sql` | Newer generation, asset, editing job, worker event overlay |
| 14 | `202605180006_reeditpro_qa_exports_audit.sql` | Newer QA, final export, audit, readiness/license overlay |
| 15 | `202605180007_reeditpro_rls_policies.sql` | RLS helpers and policies for the newer overlay schema |
| 16 | `202605180008_reeditpro_storage_buckets_policies.sql` | Supabase storage buckets and policies |
| 17 | `202605190001_sfx_director_tables.sql` | SoundSync SFX Director tables, enums, QA, library, prompt adapter test records |
| 18 | `202605190002_storytiming_master_tables.sql` | StoryTiming master timing maps, anchors, events, conflicts, QA checks, render timing manifests |

See `migration-order.md` for the canonical order table and `migration-audit.md` for per-file schema details.

## SoundSync Music

There is no dedicated SoundSync Music intelligence migration in the current folder.

Music planning is represented locally through:

- `202605130003_professional_edit_quality_engine.sql`, especially `music_plans`, audio environment, ambience, caption, SFX, and quality enums/tables.
- `202605190002_storytiming_master_tables.sql`, which coordinates music timing through StoryTiming events, anchors, dependencies, and render timing manifests.

If a future dedicated music schema is required, it should be added as a new migration and documented separately. Do not invent that migration in deployment docs.

## SoundSync SFX Director

`202605190001_sfx_director_tables.sql` creates the SFX Director database layer for:

- SFX event plans
- provider routing
- prompt plans
- generated SFX metadata
- trim and timing alignment
- mix and ducking plans
- QA reports/issues
- library candidates and usage records
- provider prompt adapter tests

It does not call Mirelo, MMAudio, Lyria, or any provider.

## StoryTiming

`202605190002_storytiming_master_tables.sql` creates the StoryTiming master coordination layer for:

- master timing maps
- story timing segments
- timing anchors and events
- dependencies and conflicts
- conflict resolutions
- QA checks
- render timing manifest placeholders, tracks, and events

StoryTiming coordinates existing timing records. It does not replace edit plans, music plans, SFX plans, captions, Stroke Motion, Graphic Design, Real Motion, render records, or QA records.

## Deployment Risk Warning

The current migration folder contains two overlapping schema chains:

- `20260513*` creates the original broad backend schema.
- `20260518*` creates a newer overlay schema that reuses several table names with `create table if not exists`.

Before any remote deployment, local validation or a disposable test database must prove the chain applies cleanly. The highest known risk is `202605180001_reeditpro_core_workspace_projects.sql`, where the later `projects.current_edit_session_id` constraint may fail if the earlier `projects` table already exists without that column.

## Safety Boundaries

- No secrets are stored in migrations.
- No provider APIs are called by migrations.
- No AI APIs are called by migrations.
- No Stripe calls happen in migrations.
- No rendering, FFmpeg, Remotion, upload processing, Google Cloud deployment, or mobile work happens in migrations.

## Before Remote Deployment

1. Confirm the Supabase CLI is installed.
2. Confirm the target project is exactly `reeditpro`.
3. Confirm the repo is not linked to the wrong project.
4. Validate migrations locally or on a disposable Supabase project.
5. Resolve or explicitly approve the overlapping schema-chain risk.
6. Run `supabase migration list --linked` only after correct project confirmation.
7. Run a remote dry-run.
8. Attempt a schema-only backup.
9. Deploy only with `DEPLOY_TO_REEDITPRO_SUPABASE=true`.
10. Verify remote tables and generate database types after deployment.
