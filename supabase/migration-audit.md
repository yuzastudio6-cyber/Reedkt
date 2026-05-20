# ReeditPro Migration Audit

RP-FIX-02 audit status: local documentation aligned with the actual migration folder. Remote deployment was not attempted.

Actual migration count: **18**.

## Static Scan Summary

- Wrong project reference: no Yuza Studio project reference found in migration SQL.
- Raw secrets: no raw provider keys, Supabase service-role keys, JWT secrets, Stripe secrets, or webhook secrets found in migration SQL.
- Expected secret-like words: comments and columns reference secret manager labels and service-role grants. These are not secret values.
- Destructive table/data SQL: no `drop table`, `truncate`, or `delete from` found.
- Table overlap: duplicate table names exist between the `20260513` and `20260518` chains and must be validated before deployment.

## Overlap Risk

The following tables are created by more than one migration:

| Table | Migrations |
| --- | --- |
| `workspaces` | `202605130001_core_reeditpro_tables.sql`, `202605180001_reeditpro_core_workspace_projects.sql` |
| `workspace_members` | `202605130001_core_reeditpro_tables.sql`, `202605180001_reeditpro_core_workspace_projects.sql` |
| `projects` | `202605130001_core_reeditpro_tables.sql`, `202605180001_reeditpro_core_workspace_projects.sql` |
| `chat_messages` | `202605130001_core_reeditpro_tables.sql`, `202605180001_reeditpro_core_workspace_projects.sql` |
| `media_assets` | `202605130001_core_reeditpro_tables.sql`, `202605180002_reeditpro_media_source_sequence.sql` |
| `edit_plan_segments` | `202605130002_intent_edit_planning_tables.sql`, `202605180003_reeditpro_intent_plan_versions.sql` |
| `credit_estimates` | `202605130004_credit_ledger_approval_gate.sql`, `202605180004_reeditpro_credits_approval_snapshots.sql` |
| `credit_reservations` | `202605130004_credit_ledger_approval_gate.sql`, `202605180004_reeditpro_credits_approval_snapshots.sql` |
| `credit_ledger_entries` | `202605130004_credit_ledger_approval_gate.sql`, `202605180004_reeditpro_credits_approval_snapshots.sql` |
| `generation_requests` | `202605130007_generation_providers_generated_assets.sql`, `202605180005_reeditpro_generation_assets_jobs.sql` |
| `generation_events` | `202605130007_generation_providers_generated_assets.sql`, `202605180005_reeditpro_generation_assets_jobs.sql` |
| `generated_assets` | `202605130007_generation_providers_generated_assets.sql`, `202605180005_reeditpro_generation_assets_jobs.sql` |
| `generated_asset_versions` | `202605130007_generation_providers_generated_assets.sql`, `202605180005_reeditpro_generation_assets_jobs.sql` |
| `qa_reports` | `202605130008_render_preview_export_revision_qa.sql`, `202605180006_reeditpro_qa_exports_audit.sql` |
| `revision_requests` | `202605130008_render_preview_export_revision_qa.sql`, `202605180006_reeditpro_qa_exports_audit.sql` |

Most serious known risk: `202605180001_reeditpro_core_workspace_projects.sql` expects `projects.current_edit_session_id`, but the earlier `projects` table can already exist without that column. Because the later migration uses `create table if not exists`, the later column may not be added before the FK constraint is attempted.

## Per-Migration Audit

| Order | Filename | Purpose | Systems affected | Tables / views | Enums | Functions / triggers | RLS / policies | Dependencies | Risk | Notes |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `202605130001_core_reeditpro_tables.sql` | Core workspace/project/chat/media foundation | Core | Tables: `plans`, `user_profiles`, `workspaces`, `workspace_members`, `subscriptions`, `projects`, `chat_sessions`, `chat_messages`, `chat_attachments`, `inline_chat_cards`, `chat_actions`, `media_assets`, `source_clip_sequences`, `source_clip_sequence_items`, `reference_assets` | 15 core enums including plan, workspace, project, chat, media, source clip, reference asset statuses | `set_updated_at`, membership/role helpers, many updated-at triggers | About 50 policies | Supabase Auth, `pgcrypto` | Medium | Broad base schema; includes service-safe storage path comments only |
| 2 | `202605130002_intent_edit_planning_tables.sql` | Intent and edit-planning schema | Planning | Tables: `intent_analyses`, source maps/items, recommended structures, `edit_plans`, story beat maps/beats, `edit_plan_segments`, `signature_routes`, instructions, notes, chat card links | Planning enums including complexity, plan status, hook, beat, signature, worker, confidence | `set_updated_at` plus planning triggers | About 36 policies | Core workspace/project/chat/media records | Medium | Adds `projects.current_edit_plan_id` |
| 3 | `202605130003_professional_edit_quality_engine.sql` | Professional edit quality, audio, captions, transitions | Edit Quality, SoundSync Music planning | Tables: quality profiles, pacing, cuts, transitions, audio environment, ambience, `music_plans`, `sound_effect_plans`, `caption_plans`, checks | Quality, pacing, transition, music, SFX, caption, QA enums | `set_updated_at` plus quality triggers | About 30 policies | Core and planning tables | Medium | Current home for music planning; no dedicated music migration exists |
| 4 | `202605130004_credit_ledger_approval_gate.sql` | Credits, approval, reservations, refunds | Credits | Tables: wallets, grants, ledger, estimates, line items, approvals, reservations, refunds; view `credit_wallet_balance_view` | Credit wallet/grant/ledger/estimate/approval/refund enums | `set_updated_at`, `can_start_generation`, credit triggers | About 26 policies | Core, planning, chat/actions | Medium | First approval/credit gate schema |
| 5 | `202605130005_job_orchestration_agent_runs.sql` | Job orchestration and agent audit | Jobs | Tables: batches, jobs, dependencies, events, agent runs/outputs, runtime configs, heartbeats, event log; view `job_progress_view` | Job, worker, agent, event, failure enums | `set_updated_at`, `can_run_job`, job triggers | About 24 policies | Core, planning, credits | Medium | Secret references are labels only |
| 6 | `202605130006_stroke_motion_data_model.sql` | Stroke Motion planning model | Stroke Motion | Tables: plans, meaning expansions, beats, characters, symbols, joins, transitions, timing anchors, storyboard frames, generation specs, examples | Stroke Motion mode/status/style/role/symbol/timing/generation enums | `set_updated_at` plus Stroke Motion triggers | About 34 policies | Core, planning, credits, jobs | Medium | No real animation or provider calls |
| 7 | `202605130007_generation_providers_generated_assets.sql` | Provider metadata and generated asset records | Generation Providers | Tables: providers, capabilities, models, requests, inputs, assets, versions, timing maps, events, costs | Provider/runtime/capability/request/asset/quality/failure/input enums | `set_updated_at` plus generation triggers | About 21 policies | Core, planning, jobs, credits, Stroke Motion | Medium | Provider rows store secret reference names only |
| 8 | `202605130008_render_preview_export_revision_qa.sql` | Render, preview, export, revision, QA foundation | Render / Preview / Export / QA | Tables: render jobs/inputs/events, renders, exports, variants, reviews, comments, revisions, QA reports/items; view `project_latest_preview_view` | Render/export/review/revision/QA enums | `set_updated_at`, `can_export_render`, render/review/QA triggers | About 39 policies | Core, planning, quality, credits, jobs, generation | Medium | No FFmpeg, Remotion, or rendering |
| 9 | `202605180001_reeditpro_core_workspace_projects.sql` | Newer active core overlay | Core overlay | Tables: `profiles`, `workspaces`, `workspace_members`, `projects`, `edit_sessions`, `chat_messages`, `user_confirmations` | None | `set_updated_at` and core overlay triggers | None here | Supabase Auth; earlier core names overlap | High | Can collide with earlier `workspaces`, `projects`, `chat_messages`; FK to `projects.current_edit_session_id` is the sharpest risk |
| 10 | `202605180002_reeditpro_media_source_sequence.sql` | Newer media/source sequence overlay | Media / Source sequence | Tables: `media_assets`, `uploaded_clips`, `source_sequence_items`, `clip_analysis_snapshots` | None | Updated-at triggers | None here | Overlay `projects`, `edit_sessions`, `media_assets` | High | Collides with earlier `media_assets` |
| 11 | `202605180003_reeditpro_intent_plan_versions.sql` | Newer intent and immutable plan version overlay | Planning overlay | Tables: intent snapshots, settings snapshots, plan versions, component snapshots, `edit_plan_segments`, operations | None | Plan version updated-at trigger | None here | Overlay project/session/auth tables | High | Collides with earlier `edit_plan_segments` |
| 12 | `202605180004_reeditpro_credits_approval_snapshots.sql` | Newer credit/approval/snapshot overlay | Credits overlay | Tables: `credit_estimates`, items, `credit_reservations`, `credit_ledger_entries`, refunds, approvals, approved snapshots | None | Immutable snapshot/ledger guards, updated-at trigger | None here | Overlay projects, workspaces, plan versions | High | Collides with earlier credit tables |
| 13 | `202605180005_reeditpro_generation_assets_jobs.sql` | Newer generation/assets/jobs overlay | Generation / Jobs overlay | Tables: `generation_requests`, `generation_events`, `generated_assets`, `generated_asset_versions`, editing jobs, job steps, worker events | None | Updated-at triggers | None here | Overlay projects, plan versions, snapshots, credit reservations | High | Collides with earlier generation tables |
| 14 | `202605180006_reeditpro_qa_exports_audit.sql` | Newer QA/export/audit overlay | QA / Exports / Audit | Tables: `qa_reports`, QA check results, `revision_requests`, final exports, audit events, readiness snapshots, license reviews | None | Audit immutability triggers | None here | Overlay projects, plan versions, jobs, snapshots | High | Collides with earlier QA/revision tables |
| 15 | `202605180007_reeditpro_rls_policies.sql` | RLS helpers and policies for overlay schema | RLS | No new tables | None | `safe_uuid`, membership/project helpers | About 63 policies | Overlay tables from orders 9-14 | High | Policies assume overlay table shapes |
| 16 | `202605180008_reeditpro_storage_buckets_policies.sql` | Supabase storage buckets and policies | Storage | Storage bucket rows/policies | None | None | 3 storage policies | Supabase Storage schema | Medium | Must validate with Supabase local/remote storage schema |
| 17 | `202605190001_sfx_director_tables.sql` | SoundSync SFX Director schema | SoundSync SFX Director | Tables: SFX event/provider/prompt/generated asset/trim/timing/mix/QA/library/usage/adapter tests; view `sfx_event_summary_view` | 20 SFX/audio enums | `set_updated_at` plus SFX triggers | About 36 policies | Core, planning, quality, Stroke Motion, generation, render/export | High | Depends on broad prior schema; no provider calls |
| 18 | `202605190002_storytiming_master_tables.sql` | StoryTiming master timing coordination | StoryTiming | Tables: maps, segments, anchors, events, dependencies, conflicts, resolutions, QA checks, render timing manifests/tracks/events; 3 views | 15 StoryTiming/render manifest enums | `set_updated_at` plus timing triggers | 3 direct policies plus service grants | Core, planning, StoryTiming-related systems, render jobs, SFX | High | Depends on previous foundations and distributed timing references |

## Deployment Recommendation

Do not run `supabase db push` until one of these is true:

1. The `20260513` and `20260518` chains are reconciled into a single coherent remote schema plan.
2. A local Supabase reset/dry-run proves the complete 18-file chain applies cleanly.
3. A disposable staging Supabase project proves the chain applies cleanly and table shapes are acceptable.

RP-FIX-02 does not make deployment safe by itself. It makes the order and risk visible.
