# ReeditPro Migration Order

Run migrations in timestamp order. This repository targets the Supabase project named `reeditpro`; do not use the Yuza Studio Supabase project and do not commit credentials.

## 1. RP-DB-03 Core ReeditPro Tables

- File: `migrations/202605130001_core_reeditpro_tables.sql`
- Purpose: Creates account, workspace, subscription, project, chat, media, source sequence, and reference asset foundations.
- Depends on: Supabase Auth `auth.users` and `pgcrypto`.
- Creates: `plans`, `user_profiles`, `workspaces`, `workspace_members`, `subscriptions`, `projects`, `chat_sessions`, `chat_messages`, `chat_attachments`, `inline_chat_cards`, `chat_actions`, `media_assets`, `source_clip_sequences`, `source_clip_sequence_items`, `reference_assets`, RLS helper functions, comments, triggers, indexes, and initial plan seed rows.
- Does not create: planning, credits, jobs, generation, render, revision, QA, Stripe, AI APIs, uploads, or deployments.
- Next migration: RP-DB-04 Intent + Edit Planning Tables.

## 2. RP-DB-04 Intent + Edit Planning Tables

- File: `migrations/202605130002_intent_edit_planning_tables.sql`
- Purpose: Creates intent understanding, source sequence interpretation, recommended final edit structure, edit plans, story beats, segment instructions, signature routing, and chat-card links.
- Depends on: RP-DB-03 core project, chat, media, source sequence, and helper functions.
- Creates: `intent_analyses`, `source_sequence_maps`, `source_sequence_map_items`, `recommended_edit_structures`, `edit_plans`, `story_beat_maps`, `story_beats`, `edit_plan_segments`, `signature_routes`, `edit_instructions`, `planning_notes`, `edit_plan_chat_cards`, and `projects.current_edit_plan_id` FK.
- Does not create: edit quality, credits, jobs, Stroke Motion detail tables, providers, generation, rendering, exports, revisions, or QA.
- Next migration: RP-DB-05 Professional Edit Quality Engine.

## 3. RP-DB-05 Professional Edit Quality Engine

- File: `migrations/202605130003_professional_edit_quality_engine.sql`
- Purpose: Creates the professional quality planning layer. Basic Edit is lower-compute clean editing, not low-quality editing.
- Depends on: RP-DB-03 core records and RP-DB-04 edit plans/segments/story beats/signature routes.
- Creates: `edit_quality_profiles`, `pacing_analysis`, `cut_decisions`, `transition_plans`, `audio_environment_analysis`, `ambient_sound_plans`, `music_plans`, `sound_effect_plans`, `caption_plans`, and `edit_quality_checks`.
- Does not create: credit ledger, jobs, Stroke Motion animation, generation providers, renders, exports, revisions, or full QA reports.
- Next migration: RP-DB-06 Credit Ledger + Approval Gate.

## 4. RP-DB-06 Credit Ledger + Approval Gate

- File: `migrations/202605130004_credit_ledger_approval_gate.sql`
- Purpose: Models Reedit Credits, estimates, user approval, reservations, ledger movements, refunds, and the approval gate.
- Depends on: RP-DB-03 chat/workspace records and RP-DB-04 edit plans/signature routes.
- Creates: `credit_wallets`, `credit_grants`, `credit_ledger_entries`, `credit_estimates`, `credit_estimate_line_items`, `credit_approvals`, `credit_reservations`, `credit_reservation_line_items`, `credit_refunds`, `credit_wallet_balance_view`, and `can_start_generation(edit_plan_id)`.
- Does not create: Stripe, checkout, billing services, jobs, provider calls, rendering, or real credit spending logic.
- Next migration: RP-DB-07 Job Orchestration + Agent Runs.

## 5. RP-DB-07 Job Orchestration + Agent Runs

- File: `migrations/202605130005_job_orchestration_agent_runs.sql`
- Purpose: Creates job batches, individual jobs, dependency graph, event logs, controlled agent runs, outputs, and worker runtime metadata.
- Depends on: RP-DB-03 core records, RP-DB-04 edit plans, RP-DB-06 credits and reservations.
- Creates: `job_batches`, `jobs`, `job_dependencies`, `job_events`, `agent_runs`, `agent_outputs`, `worker_runtime_configs`, `worker_heartbeats`, `event_log`, `job_progress_view`, and `can_run_job(job_id)`.
- Does not create: actual workers, Cloud Run, AI calls, provider requests, generated assets, renders, revisions, or QA.
- Next migration: RP-DB-08 Stroke Motion Data Model + Planning Tables.

## 6. RP-DB-08 Stroke Motion Data Model + Planning Tables

- File: `migrations/202605130006_stroke_motion_data_model.sql`
- Purpose: Creates deep planning records for Stroke Motion, including source reading mode and meaning expansion before animation planning.
- Depends on: RP-DB-03 core records, RP-DB-04 planning, RP-DB-06 credits, and RP-DB-07 jobs/agent runs.
- Creates: `stroke_motion_plans`, `stroke_motion_meaning_expansions`, `stroke_motion_beats`, `stroke_motion_characters`, `stroke_motion_symbols`, `stroke_motion_beat_characters`, `stroke_motion_beat_symbols`, `stroke_motion_transitions`, `stroke_motion_timing_anchors`, `stroke_motion_storyboard_frames`, `stroke_motion_generation_specs`, and `stroke_motion_plan_examples`.
- Does not create: generation providers, generation requests, generated assets, real animation rendering, render jobs, exports, revisions, or QA.
- Next migration: RP-DB-09 Generation Providers + Generated Assets.

## 7. RP-DB-09 Generation Providers + Generated Assets

- File: `migrations/202605130007_generation_providers_generated_assets.sql`
- Purpose: Creates provider/model/capability abstraction, generation requests, request inputs, generated assets, generated asset versions, timing maps, events, and provider cost records.
- Depends on: RP-DB-03 core, RP-DB-04 planning, RP-DB-06 credits, RP-DB-07 jobs, and RP-DB-08 Stroke Motion specs.
- Creates: `generation_providers`, `generation_provider_capabilities`, `generation_provider_models`, `generation_requests`, `generation_request_inputs`, `generated_assets`, `generated_asset_versions`, `generated_asset_timing_maps`, `generation_events`, `generation_request_costs`, and delayed FKs to Stroke Motion specs/signature routes.
- Does not create: real provider integrations, API keys, backend workers, render jobs, exports, revisions, QA reports, or Google Cloud deployments.
- Next migration: RP-DB-10 Render, Preview, Export, Revision + QA.

## 8. RP-DB-10 Render, Preview, Export, Revision + QA

- File: `migrations/202605130008_render_preview_export_revision_qa.sql`
- Purpose: Models render jobs, render inputs, preview/final render outputs, export records, review comments, revision requests, and QA reports.
- Depends on: RP-DB-03 core/chat/media, RP-DB-04 planning, RP-DB-05 quality, RP-DB-06 credits, RP-DB-07 jobs, RP-DB-08 Stroke Motion, and RP-DB-09 generated assets.
- Creates: `render_jobs`, `render_job_inputs`, `renders`, `render_events`, `exports`, `export_variants`, `preview_reviews`, `review_comments`, `revision_requests`, `revision_request_items`, `qa_reports`, `qa_report_items`, `project_latest_preview_view`, and `can_export_render(render_id)`.
- Does not create: real rendering, FFmpeg/Remotion execution, backend endpoints, cloud workers, AI APIs, Stripe, uploads, or mobile screens.
- Next migration: RP-DB-11 Database QA + Mock Scenario.

## 9. RP-DB-11 Database QA + Mock Scenario

- File: no new migration file.
- Purpose: Reviews the RP-DB-03 through RP-DB-10 schema chain and adds local validation/review artifacts plus an end-to-end mock scenario.
- Depends on: all prior migrations.
- Creates: `schema-review.md`, `migration-order.md`, `schema-health-checks.sql`, `e2e-mock-scenario.sql`, and `e2e-mock-scenario.md`.
- Does not create: new production schema, backend APIs, credentials, remote migrations, provider calls, rendering, Stripe, Google Cloud resources, uploads, or mobile screens.
- Next migration: backend API skeleton and local Supabase client wiring, after the schema is validated locally with Supabase tooling.

