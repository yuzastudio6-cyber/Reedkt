# AI Editor Data Model

## Purpose

This document defines the future data model for ReeditPro's chat-native AI editor. Editing happens in chat. UI cards appear only when the AI needs user input, confirmation, approval, or preview.

This is a planning document only. It does not create tables, migrations, APIs, storage, AI calls, or render workers.

## Chat-Native Editor Flow

1. User opens a project and chat session.
2. User sends clips, reference links, and editing instructions in chat.
3. ReeditPro stores attachments and source order.
4. AI asks only missing questions inside chat.
5. AI creates intent analysis and edit plan.
6. AI shows plan and credit estimate as inline chat cards.
7. User approves or requests changes in chat.
8. Jobs run in background after approval.
9. AI posts progress, preview, QA notes, and revision options in chat.

The chat is not a side panel. It is the editor.

## Core Records

### `projects`
- Owns the editing work.
- Important fields: `id`, `workspace_id`, `owner_user_id`, `title`, `project_type`, `status`, `active_chat_session_id`, `active_edit_plan_id`, `active_render_id`.

### `chat_sessions`
- One or more editing conversations for a project.
- Important fields: `id`, `project_id`, `user_id`, `status`, `session_mode`, `current_step`, `current_edit_plan_id`, `current_credit_estimate_id`, `current_preview_render_id`.
- Statuses: `draft`, `active`, `waiting_user_input`, `planning`, `awaiting_approval`, `generating`, `preview_ready`, `completed`, `cancelled`.

### `chat_messages`
- Append-only message history.
- Important fields: `id`, `chat_session_id`, `sender_type`, `message_type`, `body_text`, `inline_card_type`, `inline_card_payload_json`, `related_record_table`, `related_record_id`, `created_at`.
- `sender_type`: `user`, `ai`, `system`, `worker`.
- `message_type`: `text`, `attachment`, `question`, `plan`, `credit_estimate`, `approval`, `progress`, `preview`, `revision`, `error`.

### `chat_attachments`
- Media, reference, or generated output attached to a chat message.
- Important fields: `id`, `chat_message_id`, `project_id`, `attachment_type`, `media_asset_id`, `url`, `source_order`, `status`, `metadata_json`.
- `source_order` captures the order clips were sent in chat.

## Inline Chat Card Types

Inline cards should be rendered from structured records, not freeform UI-only state.

Recommended `inline_card_type` values:

- `source_sequence`
- `ai_question`
- `workflow_choice`
- `reference_dna`
- `edit_plan`
- `credit_estimate`
- `approval_gate`
- `editing_progress`
- `preview_ready`
- `revision_request`
- `qa_report`
- `export_options`

Each inline card should link to one or more authoritative records through `related_record_table` and `related_record_id`.

## Source Clip Ordering

### `source_clip_sequences`
- Stores the raw user-sent order.
- Fields: `id`, `project_id`, `chat_session_id`, `media_asset_id`, `source_order`, `file_name`, `duration_seconds`, `detected_type`, `user_notes`, `is_important`, `is_optional`, `status`.

Rule: source order is context, not final edit order. The edit plan must separately show recommended final structure before any reorder is applied.

## User Intent And AI Questions

### `intent_analyses`
- Stores what the AI understood from chat.
- Fields: `id`, `project_id`, `chat_session_id`, `source_chat_message_id`, `goal_summary`, `target_platform`, `mood_style`, `constraints_json`, `missing_questions_json`, `confidence`, `status`.

### `chat_messages` with `inline_card_type = ai_question`
- Used only when information is missing.
- The user can answer with a button choice or plain text.
- Questions should not force dropdowns when the user already provided enough detail.

## Edit Plan In Chat

### `edit_plans`
- Main plan shown inside chat.
- Fields: `id`, `project_id`, `chat_session_id`, `intent_analysis_id`, `edit_level`, `goal_summary`, `structure_summary`, `hook_policy`, `status`, `approval_status`, `credit_estimate_id`.

### `edit_plan_segments`
- Segment-level planned edit.
- Fields: `id`, `edit_plan_id`, `segment_order`, `source_clip_sequence_ids_json`, `start_time`, `end_time`, `segment_goal`, `planned_cut_behavior`, `planned_caption_behavior`, `planned_audio_behavior`.

### `signature_routes`
- Segment-level visual/audio route.
- Fields: `id`, `edit_plan_segment_id`, `signature_system`, `recommended`, `reason`, `requires_generation`, `credit_impact`, `approval_status`.

Rules:

- Dropdown/workflow context never forces a signature system.
- All video types can use Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, or none.
- Real Motion should be explicit, optional where possible, overlay-first, face-safe, and credit-heavy.

## Credit Estimate In Chat

### `credit_estimates`
- Shown as an inline card before generation.
- Fields: `id`, `project_id`, `chat_session_id`, `edit_plan_id`, `estimated_total`, `weekly_bonus_credits_available`, `purchased_credits_available`, `breakdown_json`, `status`, `approved_by`, `approved_at`.

### Estimate Breakdown JSON

Breakdown items should include:

- `label`
- `credits`
- `reason`
- `system`
- `segment_id`
- `required`
- `can_remove_to_lower_cost`

Credits are not deducted when estimate is created. Credits are reserved only after approval.

## Approval In Chat

### `approval_records`
- Captures user approval of plan and credits.
- Fields: `id`, `project_id`, `chat_session_id`, `record_type`, `target_table`, `target_id`, `approved_by`, `approval_message_id`, `approved_at`, `status`.

The approval card should create or update approval records for:

- Edit plan approval.
- Credit estimate approval.
- Optional premium system approval, such as Real Motion.

## Background Progress

### `jobs`
- Represents background work after approval.
- Chat can show progress by reading job events.

### `job_events`
- Emits user-visible progress messages such as:
  - Reading source sequence.
  - Analyzing transcript.
  - Mapping story beats.
  - Applying clean cuts.
  - Creating captions.
  - Planning Stroke Motion.
  - Checking Real Motion face-safe placement.
  - Matching SoundSync mood.
  - Preparing preview.

Progress messages can be mirrored into `chat_messages` with `message_type = progress`.

## Preview And Revision In Chat

### `renders`
- Preview or final render record.
- The first preview should appear in chat as `inline_card_type = preview_ready`.

### `preview_reviews`
- User review of preview.

### `revision_requests`
- User asks for a change in chat.
- Fields: `id`, `project_id`, `chat_session_id`, `source_chat_message_id`, `requested_change`, `affected_segment_ids_json`, `requires_generation`, `estimated_extra_credits`, `status`.

Revision flow:

1. User requests revision in chat.
2. AI maps request to affected records.
3. AI estimates extra credits if needed.
4. User approves if new generation or credits are required.
5. Jobs run only after approval.

## Chat Safety Rules

- Never start generation from a message alone.
- Never deduct credits from a message alone.
- Message text must become structured intent, plan, estimate, and approval records first.
- AI questions should be asked only when information is missing.
- All important actions should be auditable through chat message and record links.

