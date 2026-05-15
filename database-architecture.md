# ReeditPro Database Architecture

## Purpose

This document defines the future ReeditPro backend/database architecture. It is a schema plan only. It does not create Supabase migrations, production tables, API routes, credentials, Google Cloud resources, Stripe integration, AI calls, uploads, rendering, or mobile behavior.

Future database work must use the Supabase project named `reeditpro`. Do not use or reference the Yuza Studio Supabase project.

## Core Architecture Rule

ReeditPro is a chat-native AI video editor. The database must support this sequence:

1. User opens a project.
2. User sends clips, references, and instructions in chat.
3. ReeditPro records clip source order.
4. AI analyzes media, transcript, visuals, audio, and reference DNA.
5. AI creates intent analysis, edit quality decisions, signature routing, and segment-level edit plan.
6. AI creates a credit estimate.
7. User approves the edit plan and credit estimate in chat.
8. Only then can credits be reserved and generation jobs begin.
9. Workers generate assets, render preview, run QA, and return preview to chat.
10. User requests revisions or exports.

No expensive AI editing, animation generation, rendering, or credit spending may begin before plan and credit approval.

## Main Separation Of Concerns

The database must separate:

- Chat and user intent.
- Media and source clip order.
- Transcript, visual, and audio analysis.
- Planning and edit quality decisions.
- Signature system routing.
- Credit estimate and approval.
- Generation jobs.
- Rendering jobs.
- Preview.
- Revision loop.
- Final export.

Avoid a weak flow such as upload video, call AI, generate edit. ReeditPro must preserve intent, analysis, planning, credits, approval, execution, QA, preview, and revision as separate auditable records.

## Supabase Boundary

Supabase `reeditpro` should be the source of truth for:

- Users, workspaces, projects, chat sessions, and media records.
- Plans, estimates, approvals, jobs, revisions, QA, renders, and exports.
- Credit wallet and ledger state.
- Storage object references, not raw service credentials.

Supabase should not store:

- AI provider API keys.
- Google Cloud service account keys.
- Raw secrets.
- Long-lived signed URLs as canonical source of truth.

## Future Google Cloud Boundary

Google Cloud will later handle heavy work:

- Cloud Run API services for authenticated orchestration endpoints.
- Cloud Run Jobs or GPU workers for generation/rendering.
- Cloud Storage for media/assets/renders.
- Pub/Sub for async job events.
- Secret Manager for AI provider keys.
- Artifact Registry for worker containers.
- Optional Vertex AI or external model provider workers.

The database should store job intent, IDs, statuses, input payload summaries, output asset references, and audit events. Google Cloud workers should load trusted records from Supabase by ID, use secrets from Secret Manager, write results back to Supabase, and never receive raw frontend prompts as sole instructions.

## Table Groups

### 1. Account / Workspace

#### `users`
- Supabase-auth linked user profile.
- Fields: `id`, `email`, `display_name`, `avatar_url`, `default_workspace_id`, `created_at`, `updated_at`.

#### `workspaces`
- Personal or business workspace.
- Fields: `id`, `owner_user_id`, `name`, `workspace_type`, `default_plan_id`, `created_at`, `updated_at`.

#### `workspace_members`
- Membership and roles.
- Fields: `id`, `workspace_id`, `user_id`, `role`, `status`, `invited_by`, `created_at`, `updated_at`.

#### `subscriptions`
- Software access subscription, not AI usage.
- Fields: `id`, `workspace_id`, `plan_id`, `billing_provider`, `billing_customer_ref`, `status`, `current_period_start`, `current_period_end`.

#### `plans`
- Personal and Business plan definitions.
- Fields: `id`, `code`, `name`, `weekly_price_cents`, `weekly_bonus_credits`, `features_json`, `status`.

### 2. Credits

#### `credit_wallets`
- Current wallet container for a workspace or user.
- Fields: `id`, `workspace_id`, `user_id`, `wallet_type`, `status`, `created_at`, `updated_at`.

#### `credit_ledger_entries`
- Append-only credit movement.
- Fields: `id`, `wallet_id`, `entry_type`, `credit_state`, `amount`, `source_type`, `source_id`, `description`, `created_at`.

#### `credit_estimates`
- Estimate shown before generation.
- Fields: `id`, `project_id`, `edit_plan_id`, `chat_message_id`, `estimated_total`, `breakdown_json`, `status`, `expires_at`, `approved_at`.

#### `credit_reservations`
- Credits reserved after approval and before work completes.
- Fields: `id`, `wallet_id`, `credit_estimate_id`, `job_id`, `amount`, `status`, `reserved_at`, `spent_at`, `refunded_at`.

### 3. Projects / Chat

#### `projects`
- User-facing editing project.
- Fields: `id`, `workspace_id`, `owner_user_id`, `title`, `project_type`, `status`, `created_from_chat_session_id`, `created_at`, `updated_at`.

#### `chat_sessions`
- Chat-native editor session for a project.
- Fields: `id`, `project_id`, `user_id`, `status`, `current_edit_plan_id`, `current_preview_render_id`, `created_at`, `updated_at`.

#### `chat_messages`
- User, AI, and system messages.
- Fields: `id`, `chat_session_id`, `sender_type`, `message_type`, `body_text`, `inline_card_type`, `metadata_json`, `created_at`.

#### `chat_attachments`
- Clips, reference URLs, files, and generated previews attached to chat.
- Fields: `id`, `chat_message_id`, `project_id`, `media_asset_id`, `attachment_type`, `source_order`, `status`, `metadata_json`.

### 4. Media

#### `media_assets`
- Canonical media asset record.
- Fields: `id`, `workspace_id`, `project_id`, `asset_type`, `storage_bucket`, `storage_path`, `duration_seconds`, `width`, `height`, `mime_type`, `status`, `metadata_json`.

#### `source_clip_sequences`
- Uploaded/sent clip order as source sequence.
- Fields: `id`, `project_id`, `chat_session_id`, `media_asset_id`, `source_order`, `user_notes`, `is_important`, `is_optional`, `status`.

#### `transcripts`
- Transcript for a media asset or project sequence.
- Fields: `id`, `project_id`, `media_asset_id`, `language`, `status`, `full_text`, `confidence`, `created_at`.

#### `transcript_segments`
- Word/phrase timing and speaker data.
- Fields: `id`, `transcript_id`, `segment_order`, `start_time`, `end_time`, `text`, `speaker_label`, `confidence`.

#### `scene_boundaries`
- Detected scene or shot boundaries.
- Fields: `id`, `media_asset_id`, `start_time`, `end_time`, `boundary_type`, `confidence`, `metadata_json`.

#### `visual_observations`
- Visual analysis of clips and scenes.
- Fields: `id`, `media_asset_id`, `scene_boundary_id`, `observation_type`, `description`, `objects_json`, `face_safe_regions_json`, `confidence`.

#### `audio_observations`
- Audio environment and voice clarity analysis.
- Fields: `id`, `media_asset_id`, `start_time`, `end_time`, `room_tone`, `noise_type`, `voice_clarity_score`, `music_presence`, `metadata_json`.

#### `reference_assets`
- User-provided reference media or URL.
- Fields: `id`, `project_id`, `chat_message_id`, `reference_type`, `url`, `media_asset_id`, `status`, `created_at`.

#### `reference_dna`
- Style analysis of reference media.
- Fields: `id`, `reference_asset_id`, `pacing`, `music_intro`, `caption_style`, `transition_style`, `visual_style`, `mood_tone`, `adaptation_rule`.

### 5. Intent / Planning

#### `intent_analyses`
- AI understanding of the user's chat request.
- Fields: `id`, `project_id`, `chat_session_id`, `goal_summary`, `constraints_json`, `missing_questions_json`, `status`.

#### `edit_plans`
- Main approved/unapproved edit plan.
- Fields: `id`, `project_id`, `intent_analysis_id`, `edit_level`, `status`, `goal_summary`, `approval_status`, `approved_at`, `credit_estimate_id`.

#### `edit_plan_segments`
- Segment-level plan.
- Fields: `id`, `edit_plan_id`, `segment_order`, `start_time`, `end_time`, `purpose`, `planned_action`, `source_clip_ids_json`.

#### `edit_instructions`
- Structured instructions from user or AI.
- Fields: `id`, `edit_plan_id`, `instruction_type`, `instruction_text`, `priority`, `source_chat_message_id`, `status`.

#### `signature_routes`
- Segment-level signature usage decision.
- Fields: `id`, `edit_plan_segment_id`, `signature_system`, `recommendation`, `reason`, `credit_impact`, `requires_generation`, `approval_status`.

#### `story_beat_maps`
- Hook/setup/proof/result/CTA or custom beat map.
- Fields: `id`, `edit_plan_id`, `beat_order`, `beat_label`, `start_time`, `end_time`, `narrative_purpose`, `active`.

### 6. Edit Quality

Tables are defined in `edit-quality-engine.md`:

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

### 7. Stroke Motion

Tables are defined in `stroke-motion-data-model.md`:

- `stroke_motion_plans`
- `stroke_motion_beats`
- `stroke_motion_characters`
- `stroke_motion_symbols`
- `stroke_motion_transitions`
- `stroke_motion_timing_anchors`
- `stroke_motion_generation_specs`

### 8. Future Signature Systems

#### `graphic_design_plans`
- VisualExplain/Graphic Design overlay planning.
- Fields: `id`, `edit_plan_segment_id`, `layout_type`, `content_json`, `style_constraints_json`, `approval_status`, `credit_estimate_id`.

#### `real_motion_plans`
- Real Motion overlay plan.
- Fields: `id`, `edit_plan_segment_id`, `object_blueprint_family`, `overlay_goal`, `face_safe_region_json`, `scale_strategy`, `credit_estimate_id`, `approval_status`.

#### `soundsync_plans`
- Audio/timing support plan.
- Fields: `id`, `edit_plan_id`, `music_strategy`, `sfx_strategy`, `ducking_strategy`, `beat_timing_json`, `approval_status`.

### 9. Jobs / Workers

Tables are defined in `job-orchestration-architecture.md`:

- `jobs`
- `job_dependencies`
- `job_events`
- `agent_runs`
- `agent_outputs`
- `event_log`

### 10. Generation / Rendering

#### `generation_providers`
- Provider capability registry.
- Fields: `id`, `provider_code`, `provider_type`, `model_name`, `capabilities_json`, `status`.

#### `generation_requests`
- Request to generate an asset after approval.
- Fields: `id`, `project_id`, `edit_plan_id`, `job_id`, `provider_id`, `signature_system`, `generation_type`, `status`, `credit_estimate_id`, `metadata_json`.

#### `generated_assets`
- Generated output linked to media assets.
- Fields: `id`, `generation_request_id`, `media_asset_id`, `asset_role`, `status`, `quality_status`, `metadata_json`.

#### `render_jobs`
- Preview or final render job.
- Fields: `id`, `project_id`, `edit_plan_id`, `job_id`, `render_type`, `status`, `input_manifest_json`, `output_media_asset_id`.

#### `renders`
- Rendered preview/final output record.
- Fields: `id`, `project_id`, `render_job_id`, `media_asset_id`, `render_type`, `status`, `duration_seconds`, `qa_report_id`.

#### `exports`
- Export package for platform delivery.
- Fields: `id`, `project_id`, `render_id`, `platform`, `format`, `status`, `export_metadata_json`.

### 11. Review / Revisions

Tables are defined in `preview-revision-qa-architecture.md`:

- `preview_reviews`
- `review_comments`
- `revision_requests`
- `approval_records`
- `qa_reports`

## Relationship Flow

`project` -> `chat_session` -> `chat_messages` and `chat_attachments` -> `media_assets` and `source_clip_sequences` -> media analysis tables -> `intent_analyses` -> `edit_plans` and `edit_plan_segments` -> edit quality and signature tables -> `credit_estimates` -> `approval_records` -> `credit_reservations` -> `jobs` -> `generation_requests` -> `generated_assets` -> `render_jobs` -> `renders` -> `qa_reports` -> `preview_reviews` -> `revision_requests` or `exports`.

## Approval Gate

Generation and rendering jobs must check:

- `edit_plans.approval_status = approved`.
- Active `credit_estimates.status = approved`.
- Required `credit_reservations.status = reserved`.
- Required media and analysis records are ready.
- No blocking QA/readiness check exists.

If any condition fails, the job status should be `waiting_user_approval`, `waiting_dependency`, or `failed` with a clear blocker. It must not run generation.

