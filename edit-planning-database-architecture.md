# Edit Planning Database Architecture

## Purpose

ReeditPro cannot rely on raw chat text when executing edits. Chat is the editor, but workers need a structured, approved contract.

The future database architecture should preserve this chain:

1. Chat and uploads become structured intent.
2. Structured intent becomes an edit plan.
3. The edit plan becomes segment operations.
4. Segment operations become worker instructions.
5. User approval freezes the approved plan version.
6. Workers execute the approved plan version.
7. QA checks output against the approved plan, user intent, tier rules, frame rules, model routing, and credit approval.

This document is architecture only. It does not create migrations, connect Supabase, implement backend logic, reserve credits, call providers, render video, or export files.

## Main Lifecycle

1. Project is created.
2. User selects an editing category.
3. User uploads one video or multiple clips.
4. Uploaded order is stored as source order.
5. User confirms or reorders source sequence.
6. Chat captures user instructions.
7. Intent Compiler creates compiled intent.
8. AI asks clarifying questions only if needed.
9. Professional editing directive is created.
10. Visual asset plan is created.
11. Segment edit operations are created.
12. Renderer composition plan is created.
13. QA plan is created.
14. Credit estimate is created.
15. User approves plan and credit estimate.
16. Approved plan snapshot is frozen.
17. Credits are reserved later in backend.
18. Generation, editing, and rendering workers execute the approved plan.
19. QA runs.
20. Preview is delivered.
21. User requests revision or approves/export.
22. Revisions create new plan versions when needed.

## Database Group Overview

### Project / Session / Chat Group

- `projects`
- `edit_sessions`
- `chat_messages`
- `user_confirmations`

### Intent / Settings Group

- `edit_intent_snapshots`
- `compiled_intent_requirements`
- `custom_editing_directives`
- `clarifying_questions`
- `edit_settings_snapshots`

### Media / Source Group

- `media_assets`
- `uploaded_clips`
- `source_sequence_items`
- `clip_analysis`
- `transcript_segments`
- `transcript_words`
- `scene_detections`
- `speaker_zones`

### Edit Plan Group

- `edit_plan_versions`
- `edit_plan_segments`
- `edit_operations`
- `caption_plans`
- `b_roll_plans`
- `color_grade_plans`
- `sound_plans`
- `transition_plans`

### Visual System Group

- `signature_routes`
- `visual_asset_plan_items`
- `stroke_motion_plans`
- `graphic_design_plans`
- `real_motion_plans`
- `frame_layout_plans`
- `renderer_composition_plans`
- `renderer_layers`

### Generation / Assets Group

- `generation_requests`
- `generation_request_inputs`
- `generated_assets`
- `generated_asset_versions`
- `generated_asset_timing_maps`
- `generation_events`
- `generation_request_costs`

### Credits / Approval Group

- `credit_estimates`
- `credit_estimate_items`
- `credit_reservations`
- `approval_records`
- `credit_ledger_entries`
- `refund_records`

### Jobs / QA / Revision Group

- `editing_jobs`
- `job_steps`
- `worker_events`
- `qa_reports`
- `qa_check_results`
- `revision_requests`
- `final_exports`

## Table Shape Details

No SQL is defined here. These are future table shapes only.

### `projects`

| Field | Purpose |
| --- | --- |
| `id` | Project id. |
| `owner_id` | User or account owner. |
| `workspace_id` | Workspace/team id. |
| `title` | Project title. |
| `status` | Draft, active, archived, etc. |
| `created_at` | Creation timestamp. |
| `updated_at` | Last update timestamp. |

### `edit_sessions`

| Field | Purpose |
| --- | --- |
| `id` | Session id. |
| `project_id` | Parent project. |
| `status` | Active, awaiting approval, approved, etc. |
| `current_plan_version_id` | Current edit plan version. |
| `current_intent_snapshot_id` | Current compiled intent snapshot. |
| `created_at` | Creation timestamp. |
| `updated_at` | Last update timestamp. |

### `chat_messages`

| Field | Purpose |
| --- | --- |
| `id` | Message id. |
| `edit_session_id` | Parent edit session. |
| `role` | User, AI, system, or tool. |
| `content` | Message text. |
| `attachments_json` | Attached files, references, or metadata. |
| `related_clip_ids_json` | Clip ids referenced by the message. |
| `created_at` | Creation timestamp. |

### `user_confirmations`

| Field | Purpose |
| --- | --- |
| `id` | Confirmation id. |
| `edit_session_id` | Parent session. |
| `confirmation_type` | Source order, format, level, plan approval, etc. |
| `confirmed_value_json` | Confirmed value. |
| `confirmed_at` | Confirmation timestamp. |
| `superseded_at` | Superseded timestamp if user changes direction. |

### `edit_intent_snapshots`

| Field | Purpose |
| --- | --- |
| `id` | Intent snapshot id. |
| `project_id` | Parent project. |
| `edit_session_id` | Parent session. |
| `version` | Intent version. |
| `source_chat_message_ids_json` | Chat messages used to compile intent. |
| `editing_category` | Launch category. |
| `edit_level` | Basic, Pro, or Premium. |
| `target_platform` | Target platform. |
| `aspect_ratio` | Output ratio. |
| `frame_template_type` | Frame template. |
| `goal_summary` | Compiled goal summary. |
| `style_direction` | Human-readable style direction. |
| `visual_preference` | Visual preference. |
| `credit_preference` | Credit preference. |
| `professional_edit_style` | Professional edit style. |
| `pacing_style` | Pacing style. |
| `cut_intensity` | Cut intensity. |
| `transition_families_json` | Transition families. |
| `color_grade_style` | Color grade style. |
| `caption_style` | Caption style. |
| `broll_policy` | B-roll policy. |
| `sound_style` | Sound style. |
| `must_follow_rules_json` | Must-follow rules. |
| `avoid_rules_json` | Avoid rules. |
| `custom_directives_json` | Custom style directives. |
| `unclear_items_json` | Unclear items. |
| `clarifying_questions_json` | Clarifying questions. |
| `confidence` | Intent confidence. |
| `status` | Draft, confirmed, superseded, etc. |
| `created_at` | Creation timestamp. |

### `edit_settings_snapshots`

| Field | Purpose |
| --- | --- |
| `id` | Settings snapshot id. |
| `project_id` | Parent project. |
| `edit_session_id` | Parent session. |
| `intent_snapshot_id` | Related intent snapshot. |
| `editing_category` | Editing category. |
| `edit_level` | Edit level. |
| `target_platform` | Target platform. |
| `aspect_ratio` | Aspect ratio. |
| `frame_template_type` | Frame template. |
| `visual_preference` | Visual preference. |
| `mood_style` | Mood/style. |
| `credit_preference` | Credit preference. |
| `source_order_confirmed` | Whether source order was confirmed. |
| `reference_video_url` | Reference video URL if any. |
| `status` | Draft, confirmed, superseded. |
| `created_at` | Creation timestamp. |

### `media_assets`

| Field | Purpose |
| --- | --- |
| `id` | Media asset id. |
| `project_id` | Parent project. |
| `asset_type` | Upload, generated asset, preview, export, etc. |
| `storage_url` | Storage URL. |
| `file_name` | Original or generated filename. |
| `mime_type` | MIME type. |
| `duration_seconds` | Duration. |
| `width` | Width. |
| `height` | Height. |
| `status` | Uploaded, processing, ready, failed. |
| `created_at` | Creation timestamp. |

### `uploaded_clips`

| Field | Purpose |
| --- | --- |
| `id` | Uploaded clip id. |
| `project_id` | Parent project. |
| `media_asset_id` | Backing media asset. |
| `uploaded_order` | User uploaded order. |
| `user_notes` | User notes. |
| `detected_type` | Detected content type. |
| `is_important` | User or AI importance flag. |
| `is_optional` | Optional clip flag. |
| `status` | Active, removed, superseded. |
| `created_at` | Creation timestamp. |

### `source_sequence_items`

| Field | Purpose |
| --- | --- |
| `id` | Sequence item id. |
| `project_id` | Parent project. |
| `edit_session_id` | Parent session. |
| `uploaded_clip_id` | Uploaded clip. |
| `source_order` | Original source order. |
| `confirmed_order` | Confirmed order. |
| `user_confirmed` | Whether user confirmed. |
| `notes` | Sequence notes. |
| `created_at` | Creation timestamp. |
| `updated_at` | Last update timestamp. |

### `clip_analysis`

| Field | Purpose |
| --- | --- |
| `id` | Clip analysis id. |
| `uploaded_clip_id` | Uploaded clip. |
| `visual_summary` | Visual summary. |
| `audio_summary` | Audio summary. |
| `detected_faces_json` | Detected faces. |
| `detected_objects_json` | Detected objects. |
| `quality_issues_json` | Footage issues. |
| `strong_moments_json` | Strong moments. |
| `dead_space_ranges_json` | Dead space ranges. |
| `speaker_zone_json` | Speaker zone. |
| `created_at` | Creation timestamp. |

### `transcript_segments`

| Field | Purpose |
| --- | --- |
| `id` | Transcript segment id. |
| `uploaded_clip_id` | Uploaded clip. |
| `start_time` | Segment start. |
| `end_time` | Segment end. |
| `text` | Transcript text. |
| `speaker_label` | Speaker label. |
| `confidence` | Transcription confidence. |

### `transcript_words`

| Field | Purpose |
| --- | --- |
| `id` | Transcript word id. |
| `transcript_segment_id` | Parent transcript segment. |
| `word` | Word text. |
| `start_time` | Word start. |
| `end_time` | Word end. |
| `confidence` | Word confidence. |

### `edit_plan_versions`

| Field | Purpose |
| --- | --- |
| `id` | Edit plan version id. |
| `project_id` | Parent project. |
| `edit_session_id` | Parent session. |
| `intent_snapshot_id` | Intent snapshot used for plan. |
| `version` | Version number. |
| `status` | `draft`, `awaiting_approval`, `approved`, `superseded`, or `rejected`. |
| `goal_summary` | Plan goal. |
| `recommended_structure_json` | Recommended structure. |
| `source_sequence_summary_json` | Source sequence summary. |
| `hook_decision_json` | Hook decision. |
| `professional_editing_directive_json` | Professional editing directive. |
| `visual_asset_plan_summary_json` | Visual asset summary. |
| `renderer_plan_summary_json` | Renderer plan summary. |
| `qa_plan_summary_json` | QA summary. |
| `credit_estimate_id` | Related credit estimate. |
| `approval_required` | Approval requirement flag. |
| `approved_at` | Approval timestamp. |
| `approved_by` | Approver id. |
| `superseded_by_plan_version_id` | Superseding plan version id. |
| `created_at` | Creation timestamp. |
| `updated_at` | Last update timestamp. |

### `edit_plan_segments`

| Field | Purpose |
| --- | --- |
| `id` | Plan segment id. |
| `edit_plan_version_id` | Parent plan version. |
| `segment_order` | Segment order. |
| `role` | Segment role. |
| `label` | Segment label. |
| `story_purpose` | Segment purpose. |
| `source_clip_ids_json` | Source clip ids. |
| `source_time_range_json` | Source time range. |
| `final_time_range_json` | Final time range. |
| `spoken_text_summary` | Spoken text summary. |
| `pacing_style` | Pacing style. |
| `cut_intensity` | Cut intensity. |
| `must_follow_rules_json` | Must-follow rules. |
| `avoid_rules_json` | Avoid rules. |
| `worker_notes_json` | Worker notes. |
| `created_at` | Creation timestamp. |

### `edit_operations`

| Field | Purpose |
| --- | --- |
| `id` | Operation id. |
| `edit_plan_segment_id` | Parent segment. |
| `operation_type` | Operation type. |
| `operation_order` | Operation order. |
| `label` | Operation label. |
| `instruction` | Worker instruction. |
| `parameters_json` | Operation parameters. |
| `reason` | Reason for operation. |
| `status` | Planned, approved, running, complete, etc. |
| `qa_checks_json` | QA checks. |
| `created_at` | Creation timestamp. |

### `caption_plans`

| Field | Purpose |
| --- | --- |
| `id` | Caption plan id. |
| `edit_plan_segment_id` | Parent segment. |
| `caption_style` | Caption style. |
| `placement` | Placement rule. |
| `max_lines` | Maximum lines. |
| `keyword_emphasis` | Keyword emphasis flag. |
| `face_safe` | Face-safe flag. |
| `animation_style` | Animation style. |
| `notes_json` | Notes. |

### `b_roll_plans`

| Field | Purpose |
| --- | --- |
| `id` | B-roll plan id. |
| `edit_plan_segment_id` | Parent segment. |
| `broll_policy` | B-roll policy. |
| `source_priority_json` | Source priority. |
| `timing_rule` | Timing rule. |
| `meaning_rule` | Meaning rule. |
| `avoid_rules_json` | Avoid rules. |
| `notes_json` | Notes. |

### `color_grade_plans`

| Field | Purpose |
| --- | --- |
| `id` | Color plan id. |
| `edit_plan_segment_id` | Parent segment. |
| `color_grade_style` | Grade style. |
| `intensity` | Light, medium, strong. |
| `operations_json` | Color operations. |
| `skin_tone_protection` | Skin tone protection. |
| `shot_matching` | Shot matching. |
| `avoid_rules_json` | Avoid rules. |
| `notes_json` | Notes. |

### `sound_plans`

| Field | Purpose |
| --- | --- |
| `id` | Sound plan id. |
| `edit_plan_segment_id` | Parent segment. |
| `sound_style` | Sound style. |
| `voice_cleanup` | Voice cleanup flag. |
| `music_bed` | Music bed flag. |
| `ducking` | Ducking flag. |
| `sfx_json` | SFX list. |
| `avoid_rules_json` | Avoid rules. |
| `notes_json` | Notes. |

### `transition_plans`

| Field | Purpose |
| --- | --- |
| `id` | Transition plan id. |
| `edit_plan_segment_id` | Parent segment. |
| `transition_families_json` | Transition families. |
| `preferred_transitions_json` | Preferred transitions. |
| `intensity` | Transition intensity. |
| `timing_rule` | Timing rule. |
| `avoid_rules_json` | Avoid rules. |
| `notes_json` | Notes. |

### `visual_asset_plan_items`

| Field | Purpose |
| --- | --- |
| `id` | Visual asset plan item id. |
| `edit_plan_version_id` | Parent plan version. |
| `edit_plan_segment_id` | Optional parent segment. |
| `asset_type` | Visual asset type. |
| `signature_system` | Signature system. |
| `style_mode_id` | Style mode id. |
| `frame_template_type` | Frame template. |
| `needs_character_consistency` | Character consistency flag. |
| `needs_start_frame` | Start frame flag. |
| `needs_end_frame` | End frame flag. |
| `recommended_duration_seconds` | Recommended duration. |
| `provider_route_json` | Provider route and fallbacks. |
| `prompt_plan_json` | Prompt planning metadata. |
| `qa_checks_json` | QA checks. |
| `credit_impact` | Credit impact. |
| `status` | Planned, approved, generated, failed, etc. |
| `created_at` | Creation timestamp. |

### `frame_layout_plans`

| Field | Purpose |
| --- | --- |
| `id` | Frame layout plan id. |
| `edit_plan_version_id` | Parent plan version. |
| `frame_template_type` | Frame template. |
| `aspect_ratio` | Aspect ratio. |
| `canvas_width` | Canvas width. |
| `canvas_height` | Canvas height. |
| `speaker_zone_json` | Speaker zone. |
| `animation_zone_json` | Animation zone. |
| `caption_safe_zone_json` | Caption safe zone. |
| `safe_margin` | Safe margin. |
| `panel_background_color` | Panel background. |
| `notes_json` | Notes. |

### `renderer_composition_plans`

| Field | Purpose |
| --- | --- |
| `id` | Renderer composition plan id. |
| `edit_plan_version_id` | Parent plan version. |
| `renderer_engine` | Renderer engine. |
| `aspect_ratio` | Aspect ratio. |
| `canvas_width` | Canvas width. |
| `canvas_height` | Canvas height. |
| `fps` | FPS. |
| `duration_seconds` | Duration. |
| `frame_template_json` | Frame template snapshot. |
| `caption_safe_zone_json` | Caption safe zone. |
| `speaker_zone_json` | Speaker zone. |
| `animation_zone_json` | Animation zone. |
| `panel_background_color` | Panel background. |
| `approval_required` | Approval requirement. |
| `render_ready` | Render readiness flag. |
| `status` | Planned, approved, rendered, failed, etc. |
| `created_at` | Creation timestamp. |

### `renderer_layers`

| Field | Purpose |
| --- | --- |
| `id` | Renderer layer id. |
| `renderer_composition_plan_id` | Parent renderer plan. |
| `visual_asset_plan_item_id` | Linked visual asset plan item. |
| `layer_order` | Layer order. |
| `layer_type` | Layer type. |
| `label` | Layer label. |
| `start_time` | Layer start. |
| `end_time` | Layer end. |
| `zone_json` | Layer zone. |
| `fit_mode` | Fit mode. |
| `background_color` | Background color. |
| `opacity` | Opacity. |
| `motion_preset` | Motion preset. |
| `z_index` | Z index. |
| `notes_json` | Notes. |

### `credit_estimates`

| Field | Purpose |
| --- | --- |
| `id` | Credit estimate id. |
| `project_id` | Parent project. |
| `edit_plan_version_id` | Exact plan version. |
| `estimate_version` | Estimate version. |
| `edit_level` | Edit level. |
| `editing_category` | Editing category. |
| `total_credits` | Total Reedit Credits. |
| `fallback_allowance_credits` | Fallback allowance. |
| `risk_level` | Estimate risk level. |
| `approval_copy` | Approval copy. |
| `status` | Draft, awaiting approval, approved, superseded. |
| `created_at` | Creation timestamp. |

### `credit_estimate_items`

| Field | Purpose |
| --- | --- |
| `id` | Estimate item id. |
| `credit_estimate_id` | Parent estimate. |
| `label` | Item label. |
| `credits` | Credits. |
| `reason` | Reason. |
| `category` | Planning, visual, fallback, etc. |
| `metadata_json` | Metadata. |

### `approval_records`

| Field | Purpose |
| --- | --- |
| `id` | Approval id. |
| `project_id` | Parent project. |
| `edit_session_id` | Parent session. |
| `edit_plan_version_id` | Approved plan version. |
| `credit_estimate_id` | Approved credit estimate. |
| `approval_type` | Plan, credit, revision, export. |
| `approved_by` | Approver id. |
| `approved_at` | Approval timestamp. |
| `approved_snapshot_json` | Frozen approved plan snapshot. |
| `ip_or_audit_metadata_json` | Audit metadata. |

### `generation_requests`

| Field | Purpose |
| --- | --- |
| `id` | Generation request id. |
| `project_id` | Parent project. |
| `edit_plan_version_id` | Approved plan version. |
| `edit_plan_segment_id` | Related segment. |
| `visual_asset_plan_item_id` | Related visual asset plan item. |
| `provider_model` | Provider model. |
| `provider_route_json` | Provider route. |
| `prompt_json` | Prompt payload. |
| `status` | Planned, queued, running, complete, failed. |
| `approved` | Approval flag. |
| `credit_reservation_id` | Credit reservation id. |
| `created_at` | Creation timestamp. |

### `generated_assets`

| Field | Purpose |
| --- | --- |
| `id` | Generated asset id. |
| `project_id` | Parent project. |
| `generation_request_id` | Parent generation request. |
| `asset_type` | Generated asset type. |
| `storage_url` | Storage URL. |
| `width` | Width. |
| `height` | Height. |
| `duration_seconds` | Duration. |
| `background_color` | Background color. |
| `status` | Generated, approved, rejected, failed. |
| `created_at` | Creation timestamp. |

### `editing_jobs`

| Field | Purpose |
| --- | --- |
| `id` | Editing job id. |
| `project_id` | Parent project. |
| `edit_plan_version_id` | Approved plan version. |
| `job_type` | Editing, generation, render, QA, export. |
| `status` | Queued, running, complete, failed. |
| `approved_plan_snapshot_id` | Snapshot id. |
| `created_at` | Creation timestamp. |
| `started_at` | Start timestamp. |
| `completed_at` | Completion timestamp. |

### `job_steps`

| Field | Purpose |
| --- | --- |
| `id` | Job step id. |
| `editing_job_id` | Parent editing job. |
| `step_order` | Step order. |
| `step_type` | Step type. |
| `status` | Queued, running, complete, failed. |
| `input_json` | Step input. |
| `output_json` | Step output. |
| `error_json` | Step error. |
| `started_at` | Start timestamp. |
| `completed_at` | Completion timestamp. |

### `qa_reports`

| Field | Purpose |
| --- | --- |
| `id` | QA report id. |
| `project_id` | Parent project. |
| `edit_plan_version_id` | Plan version checked. |
| `editing_job_id` | Related job. |
| `status` | QA status. |
| `summary` | QA summary. |
| `created_at` | Creation timestamp. |

### `qa_check_results`

| Field | Purpose |
| --- | --- |
| `id` | QA check result id. |
| `qa_report_id` | Parent QA report. |
| `category` | QA category. |
| `label` | Check label. |
| `check` | Check text. |
| `status` | Check status. |
| `severity` | Severity. |
| `fallback_actions_json` | Allowed fallback actions. |
| `notes_json` | Notes. |

### `revision_requests`

| Field | Purpose |
| --- | --- |
| `id` | Revision request id. |
| `project_id` | Parent project. |
| `edit_session_id` | Parent session. |
| `previous_plan_version_id` | Previous plan version. |
| `requested_by` | Requesting user. |
| `request_text` | Revision request text. |
| `compiled_revision_intent_json` | Compiled revision intent. |
| `status` | Draft, planned, approved, rejected. |
| `created_at` | Creation timestamp. |

### `final_exports`

| Field | Purpose |
| --- | --- |
| `id` | Final export id. |
| `project_id` | Parent project. |
| `edit_plan_version_id` | Plan version exported. |
| `renderer_composition_plan_id` | Renderer plan used. |
| `export_format` | Export format. |
| `aspect_ratio` | Aspect ratio. |
| `storage_url` | Export URL. |
| `status` | Queued, exported, failed. |
| `created_at` | Creation timestamp. |

## Approved Plan Snapshot Policy

When the user approves, ReeditPro must freeze an approved snapshot that includes:

- compiled intent
- user settings
- source sequence confirmation
- edit plan version
- segment edit plans
- edit operations
- visual asset plan
- provider routes
- frame layout plan
- renderer composition plan
- credit estimate
- fallback allowance
- must-follow rules
- avoid rules
- QA plan
- tier constraints
- model routing constraints

Workers execute the approved snapshot. Workers should not re-interpret raw chat. Workers should not change the plan outside approved fallback rules.

If user changes instructions, source order, format, edit level, visual preference, reference, or any other important planning input, ReeditPro should create a new plan version.

## Versioning Policy

- Intent snapshots are versioned.
- Edit plans are versioned.
- Credit estimates are versioned.
- Approval records point to exact approved versions.
- Revisions create new versions.
- Old plan versions should not be overwritten.
- Approved versions should be immutable except for status and audit fields.

## Status Policy

### Intent Snapshot Statuses

- `draft`
- `needs_clarification`
- `confirmed`
- `superseded`
- `rejected`

### Edit Plan Version Statuses

- `draft`
- `awaiting_approval`
- `approved`
- `superseded`
- `rejected`

### Generation Request Statuses

- `planned`
- `queued`
- `running`
- `complete`
- `failed`
- `cancelled`
- `needs_review`

### Generated Asset Statuses

- `planned`
- `generating`
- `ready`
- `approved`
- `rejected`
- `failed`
- `superseded`

### Editing Job Statuses

- `queued`
- `running`
- `waiting_for_dependency`
- `complete`
- `failed`
- `cancelled`
- `needs_user_review`

### QA Report Statuses

- `not_checked`
- `passed`
- `warning`
- `failed`
- `needs_user_review`
- `blocked`

### Revision Request Statuses

- `draft`
- `compiled`
- `planned`
- `awaiting_approval`
- `approved`
- `rejected`
- `superseded`

## Worker Execution Policy

Future workers should follow this sequence:

1. Load approved plan snapshot.
2. Verify credit reservation.
3. Verify source media readiness.
4. Execute edit operations.
5. Generate still/keyframe assets.
6. Generate AI video assets if approved.
7. Create renderer composition.
8. Render preview.
9. Run QA.
10. Retry or fallback if allowed.
11. Ask user if fallback exceeds approved plan.
12. Deliver preview.

Workers must execute the approved plan version, not raw chat. Workers must preserve Basic/Pro no-Veo policy, Premium final-fallback-only Veo policy, and matching panel background rules.

## Non-Goals

This document does not:

- create migrations
- connect Supabase
- implement backend logic
- implement real persistence
- implement credit reservation or deduction
- implement Stripe
- call GPT-Image-2, Wan, Hailuo, Veo, or any provider
- render with Remotion or FFmpeg
- create export jobs
- create Google Cloud workers
- build mobile screens
