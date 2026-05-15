# ReeditPro Schema Review

RP-DB-11 reviewed the local Supabase/Postgres migration sequence for the `reeditpro` project. This review is local-only: no remote Supabase project was connected, no credentials were added, and no migrations were deployed.

## Migration Files Reviewed

1. `202605130001_core_reeditpro_tables.sql`
2. `202605130002_intent_edit_planning_tables.sql`
3. `202605130003_professional_edit_quality_engine.sql`
4. `202605130004_credit_ledger_approval_gate.sql`
5. `202605130005_job_orchestration_agent_runs.sql`
6. `202605130006_stroke_motion_data_model.sql`
7. `202605130007_generation_providers_generated_assets.sql`
8. `202605130008_render_preview_export_revision_qa.sql`

## Run Order

Run the migrations in timestamp order. The chain is intentionally layered:

1. Core account, workspace, project, chat, media, source sequence, and reference records.
2. Intent understanding, source sequence maps, edit plans, story beats, segments, signature routes, and worker notes.
3. Professional edit quality records for pacing, cuts, transitions, audio, ambience, music, SFX, captions, and checks.
4. Credit wallets, estimates, approvals, reservations, ledger entries, refunds, and generation gate helpers.
5. Job batches, jobs, dependencies, events, agent runs, outputs, runtime configs, and orchestration helpers.
6. Stroke Motion planning, source reading meaning expansion, beats, characters, symbols, transitions, timing, storyboard frames, and generation specs.
7. Generation providers, capabilities, models, requests, inputs, generated assets, timing maps, events, and cost records.
8. Render jobs, render inputs, renders, render events, exports, preview reviews, comments, revisions, QA reports, and QA items.

## Tables By Migration

### RP-DB-03 Core Tables

- `plans`
- `user_profiles`
- `workspaces`
- `workspace_members`
- `subscriptions`
- `projects`
- `chat_sessions`
- `chat_messages`
- `chat_attachments`
- `inline_chat_cards`
- `chat_actions`
- `media_assets`
- `source_clip_sequences`
- `source_clip_sequence_items`
- `reference_assets`

### RP-DB-04 Intent + Edit Planning

- `intent_analyses`
- `source_sequence_maps`
- `source_sequence_map_items`
- `recommended_edit_structures`
- `edit_plans`
- `story_beat_maps`
- `story_beats`
- `edit_plan_segments`
- `signature_routes`
- `edit_instructions`
- `planning_notes`
- `edit_plan_chat_cards`

### RP-DB-05 Professional Edit Quality Engine

- `edit_quality_profiles`
- `pacing_analysis`
- `cut_decisions`
- `transition_plans`
- `audio_environment_analysis`
- `ambient_sound_plans`
- `music_plans`
- `sound_effect_plans`
- `caption_plans`
- `edit_quality_checks`

### RP-DB-06 Credit Ledger + Approval Gate

- `credit_wallets`
- `credit_grants`
- `credit_ledger_entries`
- `credit_estimates`
- `credit_estimate_line_items`
- `credit_approvals`
- `credit_reservations`
- `credit_reservation_line_items`
- `credit_refunds`
- `credit_wallet_balance_view`

### RP-DB-07 Job Orchestration + Agent Runs

- `job_batches`
- `jobs`
- `job_dependencies`
- `job_events`
- `agent_runs`
- `agent_outputs`
- `worker_runtime_configs`
- `worker_heartbeats`
- `event_log`
- `job_progress_view`

### RP-DB-08 Stroke Motion Data Model

- `stroke_motion_plans`
- `stroke_motion_meaning_expansions`
- `stroke_motion_beats`
- `stroke_motion_characters`
- `stroke_motion_symbols`
- `stroke_motion_beat_characters`
- `stroke_motion_beat_symbols`
- `stroke_motion_transitions`
- `stroke_motion_timing_anchors`
- `stroke_motion_storyboard_frames`
- `stroke_motion_generation_specs`
- `stroke_motion_plan_examples`

### RP-DB-09 Generation Providers + Generated Assets

- `generation_providers`
- `generation_provider_capabilities`
- `generation_provider_models`
- `generation_requests`
- `generation_request_inputs`
- `generated_assets`
- `generated_asset_versions`
- `generated_asset_timing_maps`
- `generation_events`
- `generation_request_costs`

### RP-DB-10 Render, Preview, Export, Revision + QA

- `render_jobs`
- `render_job_inputs`
- `renders`
- `render_events`
- `exports`
- `export_variants`
- `preview_reviews`
- `review_comments`
- `revision_requests`
- `revision_request_items`
- `qa_reports`
- `qa_report_items`
- `project_latest_preview_view`

## Enum Types By Migration

### RP-DB-03

- `plan_slug`
- `workspace_role`
- `subscription_status`
- `project_status`
- `target_platform`
- `aspect_ratio`
- `chat_session_status`
- `chat_message_role`
- `chat_attachment_type`
- `inline_chat_card_type`
- `chat_action_type`
- `media_asset_type`
- `media_processing_status`
- `source_clip_item_status`
- `reference_asset_status`

### RP-DB-04

- `edit_complexity`
- `edit_plan_status`
- `hook_policy`
- `story_beat_type`
- `story_beat_status`
- `signature_system`
- `signature_route_requirement`
- `edit_instruction_type`
- `worker_target`
- `planning_confidence`
- `user_instruction_priority`

### RP-DB-05

- `edit_quality_level`
- `professional_standard`
- `generation_budget_level`
- `transition_policy`
- `music_policy`
- `sfx_policy`
- `audio_cleanup_policy`
- `caption_policy`
- `signature_policy`
- `pacing_style`
- `speaker_energy`
- `pause_quality`
- `cut_type`
- `transition_type`
- `audio_environment_type`
- `noise_severity`
- `ambient_sound_type`
- `music_role`
- `music_energy`
- `ducking_strategy`
- `sound_effect_type`
- `caption_density`
- `caption_style_intent`
- `edit_quality_check_type`
- `edit_quality_check_status`

### RP-DB-06

- `credit_wallet_type`
- `credit_source_type`
- `credit_grant_status`
- `credit_ledger_entry_type`
- `credit_reservation_status`
- `credit_estimate_status`
- `credit_estimate_line_item_type`
- `credit_approval_status`
- `credit_refund_status`
- `credit_usage_category`

### RP-DB-07

- `job_batch_status`
- `job_status`
- `job_type`
- `agent_type`
- `worker_runtime_type`
- `job_priority`
- `job_event_type`
- `agent_run_status`
- `agent_output_type`
- `event_actor_type`
- `event_type`
- `job_failure_category`

### RP-DB-08

- `stroke_motion_understanding_mode`
- `stroke_motion_source_text_type`
- `stroke_motion_plan_status`
- `stroke_motion_style_level`
- `stroke_motion_character_role`
- `stroke_motion_symbol_type`
- `stroke_motion_transition_type`
- `stroke_motion_timing_anchor_type`
- `stroke_motion_generation_status`
- `stroke_motion_output_format`
- `stroke_motion_sfx_hint`

### RP-DB-09

- `generation_provider_type`
- `generation_runtime_type`
- `generation_capability`
- `generation_request_type`
- `generation_request_status`
- `generated_asset_type`
- `generated_asset_status`
- `generated_asset_format`
- `generation_quality_level`
- `generation_failure_category`
- `generation_input_role`

### RP-DB-10

- `render_job_status`
- `render_type`
- `render_quality_level`
- `render_output_format`
- `render_failure_category`
- `render_input_type`
- `render_status`
- `export_status`
- `export_format`
- `export_platform`
- `preview_review_status`
- `review_comment_status`
- `revision_request_status`
- `revision_scope`
- `revision_cost_level`
- `qa_report_status`
- `qa_report_item_status`
- `qa_report_item_type`

## Dependency Notes

- RP-DB-03 depends on Supabase Auth for `auth.users` and creates the reusable workspace RLS helper functions.
- RP-DB-04 depends on core project, chat, media, and source sequence tables.
- RP-DB-05 depends on planning tables.
- RP-DB-06 depends on edit plans and chat action/card records.
- RP-DB-07 depends on credit estimates and reservations.
- RP-DB-08 depends on planning, credit, and job tables.
- RP-DB-09 depends on generation-adjacent records from credits, jobs, and Stroke Motion.
- RP-DB-10 depends on generation records, generated assets, jobs, credits, chat, planning, and quality records.

## Static Validation Result

Static review was run against all migration SQL files. The pre-validation check found:

- 8 migration files.
- 89 created public tables.
- 113 created enum types.
- No public foreign key references to tables missing from the migration chain.
- No tables with `updated_at` missing an updated-at trigger.
- No created tables missing Row Level Security enablement.
- No created tables missing policies.
- No views missing `security_invoker`.
- No real provider calls, Stripe code, backend routes, cloud deploy commands, Supabase remote commands, real upload implementation, rendering execution, or mobile screens in `supabase/` or `src/`.

Local Supabase execution was not run because the Supabase CLI is not installed and this repository does not currently include `supabase/config.toml`. No remote Supabase project was connected.

Frontend validation after adding RP-DB-11 artifacts:

- `npm.cmd run build`: passed.
- `npm.cmd run lint`: passed.
- `git diff --check`: passed.

## Issues Found

- Local migration execution could not be performed in this environment because Supabase CLI/config are absent.
- The end-to-end mock scenario requires a matching local `auth.users` row before inserting `user_profiles`, because `user_profiles.id` references `auth.users(id)`.

## Fixes Made

- No migration SQL fixes were required by the static checks.
- Added RP-DB-11 review, migration order, health-check, and mock scenario documents/scripts.
- Updated `supabase/README.md` to document the RP-DB-11 local QA layer.

## Deferred To Backend Work

- Backend services must enforce approval and credit reservation before generation/render jobs actually run.
- Backend services must reconcile credit wallet cached balances against grants, reservations, ledger entries, and refunds.
- Worker orchestration must implement idempotent job claiming, locking, retry, and failure handling.
- Provider workers must load secrets from secure runtime configuration or Secret Manager, not database rows.
- Render/export workers must implement actual media composition, storage writes, QA gating, and delivery.
- Client-review permissions can be widened later when product flows require reviewer comment creation.

## Critical Flow Coverage

| Flow Area | Covered | Schema Support |
| --- | --- | --- |
| Chat-native editing | Yes | Projects link to chat sessions, chat messages, attachments, cards, and actions. |
| Source clip order | Yes | `source_clip_sequences` and `source_clip_sequence_items.uploaded_order` preserve uploaded source order separately from final edit order. |
| Intent planning | Yes | `intent_analyses`, source sequence maps, recommended edit structures, edit plans, and story beats model AI planning before generation. |
| Edit plan approval | Yes | `edit_plans.status`, `approval_required`, `approved_at`, `approved_by`, and approval chat actions model plan approval state. |
| Professional edit quality | Yes | Edit quality profiles, pacing, cut, transition, audio, ambience, music, SFX, caption, and quality check records model professional standards. |
| Basic edit quality | Yes | `edit_quality_profiles` comments and enums make Basic lower-compute clean editing, not low-quality editing. |
| Signature routing | Yes | `edit_plan_segments.signature_system` and `signature_routes` route signature systems per segment. |
| Video type does not force signature systems | Yes | Signature routes are optional/recommended/required per segment and separate from target platform/workflow context. |
| Stroke Motion planning | Yes | Stroke Motion plans, meaning expansions, beats, characters, symbols, transitions, timing anchors, storyboards, and generation specs exist. |
| Stroke Motion source reading | Yes | `stroke_motion_understanding_mode = 'source_reading_mode'` plus meaning expansion records support source readings. |
| Credits and approval | Yes | Credit estimates, line items, approvals, reservations, reservation items, ledger entries, and refunds exist. |
| Job orchestration | Yes | Job batches, jobs, dependencies, events, agent runs, outputs, runtime configs, heartbeats, and event logs exist. |
| Generation providers | Yes | Provider, capability, model, request, input, event, and cost records support multiple future providers. |
| Generated assets | Yes | Generated assets, versions, and timing maps model intermediate/reusable outputs. |
| Render and preview | Yes | Render jobs, inputs, renders, events, preview chat links, and latest preview view exist. |
| Revision | Yes | Preview reviews, review comments, revision requests, and affected revision items exist. |
| QA | Yes | QA reports and QA report items model preview/export readiness and retry decisions. |
| Export | Yes | Exports and export variants model final delivery placeholders after render/QA/approval. |
| Google Cloud worker readiness | Yes | Jobs, runtime configs, provider runtime types, generation requests, render jobs, and event records provide future integration points. |
