# ReeditPro Migration Order

> **Blocked baseline:** Do not run this directory in timestamp order. The `20260513` and `20260518` foundations redefine incompatible tables, and later migrations depend on both. This file is a historical catalog until the canonical-chain work in `docs/supabase-migration-baseline-reconciliation.md` is complete.

This repository targets the Supabase project named `reeditpro`; do not use the Yuza Studio Supabase project and do not commit credentials.

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
- Next migration: RP-SFX-03 SoundSync SFX Director Tables.

## 10. RP-SFX-03 SoundSync SFX Director Tables

- File: `migrations/202605190001_sfx_director_tables.sql`
- Purpose: Creates the structured database layer for professional SoundSync SFX planning, provider routing, prompt planning, generated SFX metadata, trim/hit alignment, mix/ducking, QA, usage records, prompt-adapter tests, and generated SFX library candidates.
- Depends on: RP-DB-03 through RP-DB-10 foundations for workspaces, projects, chat, edit plans, edit quality, Stroke Motion, generation requests/assets, renders, exports, QA, and RLS helpers.
- Creates: SFX enum types, `sfx_event_plans`, `sfx_provider_routes`, `sfx_prompt_plans`, `sfx_generated_assets`, `sfx_trim_plans`, `sfx_timing_alignments`, `sfx_mix_plans`, `sfx_qa_reports`, `sfx_qa_issues`, `sfx_library_candidates`, `sfx_usage_records`, `sfx_prompt_adapter_tests`, and `sfx_event_summary_view`.
- Does not create: real SFX generation, provider calls, Mirelo/MMAudio integrations, API keys, provider secrets, Google Cloud resources, rendering, uploads, Stripe, or mobile screens.
- Notes: SFX is planned before generation. Default SFX supports ReeditPro-created edit layers, not every source-footage action. Mirelo SFX V1.5 and MMAudio V2 are modeled as future provider routes only. Prompt plans are stored but not executed. Generated SFX should be longer than needed, then trimmed, hit-aligned, voice-first mixed, QA-checked, and kept project-only unless QA/provenance/privacy/licensing review allows library promotion.
- Next migration: RP-TIMING-03 StoryTiming Master Tables.

## 11. RP-TIMING-03 StoryTiming Master Tables

- File: `migrations/202605190002_storytiming_master_tables.sql`
- Purpose: Creates the StoryTiming master coordination schema that consolidates distributed timing records without replacing their native timing fields.
- Depends on: RP-DB-03 through RP-DB-10 foundations plus RP-SFX-03 for SoundSync SFX timing records and shared RLS helpers.
- Creates: StoryTiming enum types, `master_timing_maps`, `story_timing_segments`, `timing_anchors`, `timing_events`, `timing_dependencies`, `timing_conflicts`, `timing_conflict_resolutions`, `story_timing_qa_checks`, `render_timing_manifests`, `render_timing_manifest_tracks`, `render_timing_manifest_events`, `project_latest_timing_map_view`, `timing_conflicts_open_view`, and `render_ready_timing_maps_view`.
- Does not create: remote Supabase execution, backend services, UI, real transcript alignment, beat detection, provider calls, Lyria/Mirelo/MMAudio integrations, API keys, provider secrets, Google Cloud resources, rendering, uploads, Stripe, or mobile screens.
- Notes: Timing already exists across edit plan segments, story beats, pacing, cuts, transitions, captions, Stroke Motion, music, SFX, generation, render, review, and QA. StoryTiming references those systems with direct core FKs where safe and `source_system` / `source_record_id` / `source_table_name` for distributed timing records.
- Next migration: RP-TIMING-04 mock StoryTiming planner.

## 12. RP-FIX-07 Storage Upload Pipeline Readiness

- File: `migrations/202605200001_storage_upload_pipeline_readiness.sql`
- Purpose: Adds local-only storage policy readiness for `workspaces/{workspace_id}/projects/{project_id}/...` paths while keeping active RP-DATA-04 bucket ids.
- Depends on: `202605180007_reeditpro_rls_policies.sql` helper functions and `202605180008_reeditpro_storage_buckets_policies.sql` bucket definitions.
- Creates: bounded storage object policies for project member reads and project editor writes to `source-media` and `thumbnails`, removes permissive legacy flat-path policies, verifies the path workspace matches the project's workspace, and applies bucket MIME/size limits.
- Does not create: public buckets, anonymous access, profile/brand workspace-only policies, generated asset writes, preview/export writes, worker-temp writes, remote deployment, real uploads, provider calls, rendering, Stripe, Google Cloud resources, or mobile screens.
- Notes: Profile/brand assets, generated outputs, previews, exports, QA artifacts, and worker-temp objects remain backend signed-upload or worker-runtime concerns until production policies are validated.

## 13. RP-FIX-11 Worker Leases Runtime Transport

- File: `migrations/202605200002_worker_leases_runtime_transport.sql`
- Purpose: Adds local-only readiness tables for worker leases, backend runtime messages, and job claim attempts.
- Depends on: RP-DB-03 core workspaces/projects, RP-DB-07 jobs/job batches, and workspace RLS helpers.
- Creates: service-only `worker_leases`, `backend_runtime_messages`, and `job_claim_attempts`, forced RLS, indexes, and a partial unique active-lease index for one active lease per job.
- Does not create: deployed backend runtime, service-role handlers, Cloud Run, Pub/Sub, Supabase Edge Functions, provider calls, render workers, Stripe, real uploads, or remote migration execution.
- Notes: Authenticated browser roles receive no base-table access because row-level membership cannot hide secret/internal columns such as lease tokens and runtime payloads. Future user-facing progress must use sanitized backend DTOs or a dedicated safe status view.

## 14. RP-E2E-READY-01 Runtime Database Foundation

- File: `migrations/202605210001_e2e_runtime_readiness_tables.sql`
- Purpose: Adds local/review-ready runtime tables for approved execution snapshots, API idempotency, upload intents, canonical storage records, signed URL audits, worker job claims, tool readiness checks, provider attempt tracking, and sanitized provider webhook summaries.
- Depends on: RP-DB-03 core workspaces/projects/chat/media, RP-DB-04 edit plans, RP-DB-06 credits and reservations, RP-DB-07 jobs, RP-DB-09 generation requests/assets, RP-DB-10 render/QA records, RP-FIX-07 storage readiness policies, and RP-FIX-11 worker lease/runtime readiness.
- Creates: extensions to `approved_plan_snapshots`, service-only `api_idempotency_keys`, `upload_intents`, `storage_object_records`, `signed_url_events`, `worker_job_claims`, `tool_runtime_checks`, `provider_request_attempts`, `provider_webhook_events`, service-only helper functions `can_create_approved_plan_snapshot`, `active_worker_claim_exists`, and `can_claim_worker_job`, plus forced RLS, indexes, uniqueness constraints, and updated-at triggers.
- Does not create: remote Supabase execution, deployed backend handlers, signed URL generation, Cloud Run workers, provider calls, render execution, Stripe, secret reads, real uploads, or production migration execution.
- Notes: Workers must execute approved snapshots, not raw chat. Expensive work remains blocked until approved edit plan, approved credit estimate, credit reservation, idempotency, worker claim, storage, timing, and QA gates are implemented by future backend/service-role code.

## 15. RP-FIX-12 Approved Snapshot Transaction + Immutability Hardening

- File: `migrations/202605270001_approved_snapshot_transaction_and_immutability.sql`
- Purpose: Hardens approved snapshot transaction creation, immutable snapshot fields, and backend readiness checks for approved plan snapshots.
- Depends on: RP-DB-03 core workspaces/projects/chat/media, RP-DB-04 edit plans, RP-DB-06 credit estimates/approvals/reservations, and RP-E2E-READY-01 approved snapshot/idempotency readiness.
- Creates: additional approved snapshot compatibility columns, immutability enforcement helpers/triggers, atomic approved snapshot creation RPC, and supporting indexes/checks.
- Does not create: provider execution, workers, frontend Supabase wiring, render jobs, billing, storage credentials, or production deployment.

## 16. Milestone 17 / RP-DB-11 Footage Prep + Source Understanding

- File: `migrations/202605280001_rp_db_11_footage_prep_source_understanding.sql`
- Purpose: Adds the production schema foundation for Footage Prep and Source Understanding before creative planning.
- Depends on: RP-DB-03 core workspaces, projects, media assets, user profiles, workspace RLS helpers, and `public.set_updated_at()`.
- Creates: `footage_prep_sessions`, `asset_analysis_reports`, `transcript_segments`, `transcript_words`, `scene_segments`, `silence_regions`, `retake_groups`, `retake_group_candidates`, `source_quality_flags`, `source_understanding_maps`, RLS policies, indexes, constraints, comments, and validation coverage.
- Does not create: frontend Supabase wiring, API routes, workers, real transcription, real media analysis, real provider calls, Clean Assembly tables, Edit Brief/Edit Cue tables, Professional Integration tables, Edit Map tables, Revision/Export tables, render jobs, backend adapters, storage credentials, or secrets.
- Notes: The earlier "RP-DB-11 Database QA + Mock Scenario" entry is a historical local QA artifact with no production migration file. This Milestone 17 entry is the additive production schema migration for Footage Prep and Source Understanding.

## 17. Milestone 18 / RP-DB-12 Cleanup Plan + Clean Assembly

- File: `migrations/202605280002_rp_db_12_cleanup_plan_clean_assembly.sql`
- Purpose: Adds the production schema foundation for non-destructive Cleanup Plan, Clean Assembly, source time mapping, and cleanup review decisions before creative planning.
- Depends on: RP-DB-03 core workspaces/projects/media, RP-DB-11 Footage Prep + Source Understanding tables, workspace RLS helpers, and `public.set_updated_at()`.
- Creates: `cleanup_plans`, `cleanup_plan_items`, `clean_assemblies`, `source_time_mappings`, `clean_assembly_segments`, `cleanup_review_cards`, `cleanup_review_item_states`, `cleanup_review_operations`, RLS policies, indexes, constraints, comments, and validation coverage.
- Does not create: frontend Supabase wiring, API routes, workers, real media cleanup, real transcription, real media analysis, real provider calls, Edit Brief/Edit Cue tables, Professional Integration tables, Edit Map tables, Revision/Export tables, render jobs, backend adapters, storage credentials, or secrets.
- Notes: Raw uploaded media remains immutable. Source time mappings preserve relationships between raw source time, clean assembly time, and future final edit time.

## 18. Milestone 19 / RP-DB-13 Edit Brief + Edit Cues

- File: `migrations/202605280003_rp_db_13_edit_brief_edit_cues.sql`
- Purpose: Adds the production schema foundation for optional Edit Brief direction and precise Edit Cues before AI planning.
- Depends on: RP-DB-03 core chat/media/source sequence tables, RP-DB-04 edit plans/segments, RP-DB-12 Cleanup Plan + Clean Assembly tables, workspace RLS helpers, and `public.set_updated_at()`.
- Creates: `edit_briefs`, `edit_brief_operations`, `edit_cues`, `edit_cue_operations`, `edit_cue_anchors`, `edit_cue_assets`, `edit_cue_remap_results`, `edit_cue_conflicts`, `edit_cue_conflict_operations`, `edit_cue_plan_mappings`, `edit_cue_chat_cards`, RLS policies, indexes, constraints, comments, and validation coverage.
- Does not create: frontend Supabase wiring, API routes, workers, real planning, provider calls, media processing, Professional Integration tables, Edit Map tables, Revision/Export tables, render jobs, backend adapters, storage credentials, or secrets.
- Notes: Edit Brief and Edit Cues are optional planning inputs. Cue records never go directly to render.
