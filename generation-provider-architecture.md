# Generation Provider Architecture

## Purpose

This document defines the future generation provider abstraction for ReeditPro. It is documentation only and does not call providers, create migrations, add credentials, or deploy workers.

## Provider Principle

ReeditPro must not hard-code one provider. Different systems may use different providers:

- Wan.
- Veo.
- Kling.
- Remotion/SVG/Lottie renderer.
- Google Cloud workers.
- Other AI animation, video, image, or audio providers.

Providers are tools. ReeditPro owns the edit plan, timing, exact text, captions, overlay placement, credits, approval, and QA.

## Required Tables

### `generation_providers`

Provider/model capability registry.

Fields:

- `id`
- `provider_code`
- `provider_type`: `video`, `image`, `audio`, `animation`, `renderer`, `worker`
- `model_name`
- `supported_signature_systems_json`
- `supports_transparency`
- `supports_timing_constraints`
- `supports_audio`
- `max_duration_seconds`
- `resolution_options_json`
- `status`
- `notes`

### `generation_requests`

Approved generation request.

Fields:

- `id`
- `workspace_id`
- `project_id`
- `edit_plan_id`
- `edit_plan_segment_id`
- `job_id`
- `provider_id`
- `signature_system`: `stroke_motion`, `graphic_design`, `real_motion`, `soundsync`, `render`, `none`
- `generation_type`
- `input_asset_ids_json`
- `output_asset_type`
- `transparent_background_required`
- `duration_seconds`
- `resolution`
- `prompt`
- `negative_prompt`
- `style_constraints_json`
- `timing_constraints_json`
- `worker_notes`
- `credit_estimate_id`
- `credit_reservation_id`
- `status`
- `created_at`

### `generated_assets`

Generated output and review status.

Fields:

- `id`
- `generation_request_id`
- `media_asset_id`
- `asset_role`
- `asset_type`
- `duration_seconds`
- `width`
- `height`
- `transparent_background`
- `quality_status`
- `qa_report_id`
- `status`
- `metadata_json`

## Request Gating

No `generation_request` should run unless:

- Edit plan is approved.
- Credit estimate is approved.
- Required credits are reserved.
- Required source media and analysis records are ready.
- Provider is active and suitable.
- No blocking approval/readiness check exists.

If any gate fails, request status should remain `blocked_waiting_approval`, `waiting_dependency`, or `failed`.

## Provider Selection

Provider selection should consider:

- Signature system.
- Edit level.
- Transparent overlay need.
- Timing precision need.
- Duration.
- Resolution.
- Credit budget.
- User instructions.
- QA risk.
- Provider availability.

## Stroke Motion Provider Strategy

Stroke Motion should prefer controlled animation systems:

- SVG.
- Lottie.
- Remotion.
- Other deterministic renderers.

Reasons:

- Word-level timing.
- Transparent overlays.
- Repeatable render output.
- Easier revision.
- Better alignment to transcript and StoryTiming.

AI video models such as Wan, Veo, or Kling may help with concept generation or advanced animation, but ReeditPro should not depend only on full AI video generation for Stroke Motion.

## Graphic Design / VisualExplain Strategy

Graphic Design should prefer deterministic layout and compositing where exact text, diagrams, labels, or frameworks are needed.

Potential provider roles:

- AI assists with layout ideas.
- ReeditPro renderer owns exact text and final composition.
- Generated assets should remain editable where possible.

## Real Motion Strategy

Real Motion may use more expensive image/video/object generation providers because it needs realistic overlay assets.

Rules:

- Overlay-first.
- Face-safe.
- Speaker/user footage remains the base layer.
- Object scale matches meaning.
- Same blueprint family can repeat, but exact animation should vary.
- Credit estimate must be explicit before approval.

## SoundSync Strategy

SoundSync provider work may include:

- Music selection or generation.
- SFX generation.
- Ducking and mix automation.
- Beat maps.
- Transition sound design.

Basic edits should avoid heavy SFX unless appropriate and approved.

## Prompt And Constraint Ownership

Generation requests should store:

- Prompt.
- Negative prompt.
- Style constraints.
- Timing constraints.
- Safety constraints.
- Worker notes.
- Must-follow rules.
- Avoid rules.

Provider outputs should never become the final truth without QA. Generated assets must be linked to edit plans, segments, credit estimates, and QA reports.

## Secrets

Provider keys must not be stored in database tables. Future workers should load secrets from Google Secret Manager or equivalent secure infrastructure.

