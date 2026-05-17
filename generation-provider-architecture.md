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

## RP-DB-09 Migration Shape

`supabase/migrations/202605130007_generation_providers_generated_assets.sql` creates the first generation-provider database layer. It is local-only and does not call providers, add credentials, render video, deploy Google Cloud, or create render/export/revision/QA tables.

Provider abstraction tables:

- `generation_providers`: provider metadata, runtime type, support flags, cost multiplier, optional `worker_runtime_config_id`, and `secret_reference_name`.
- `generation_provider_capabilities`: capability rows such as `transparent_overlay`, `svg_generation`, `lottie_generation`, `remotion_render`, `text_to_video`, `music_generation`, and `json_spec`.
- `generation_provider_models`: model/config rows under providers, including default quality level, credit cost hints, duration/resolution limits, transparency support, word-level timing support, and seed support.

Generation workflow tables:

- `generation_requests`: approved-or-draft requests linked to project, edit plan, segment, signature route, Stroke Motion plan/beat/spec, job, agent run, credit estimate, credit reservation, provider, and model.
- `generation_request_inputs`: structured input records for media assets, source frames/audio, edit plan segments, signature routes, Stroke Motion plans/beats, and prompt context.
- `generated_assets`: intermediate or reusable outputs such as transparent overlays, SVG, Lottie JSON, Remotion scenes, audio, images, image sequences, videos, captions, and JSON specs.
- `generated_asset_versions`: version history for generated assets.
- `generated_asset_timing_maps`: timing and offset data for overlays, captions, Stroke Motion, SoundSync, and future timeline synchronization.
- `generation_events`: append-style progress and audit events.
- `generation_request_costs`: internal provider cost estimates/actuals and user-credit estimates/actuals, separate from the credit ledger.

RP-DB-09 also links `stroke_motion_generation_specs.generation_request_id` and `signature_routes.generation_request_id` to `generation_requests(id)` once the generation table exists.

## Request Gating

No `generation_request` should run unless:

- Edit plan is approved.
- Credit estimate is approved.
- Required credits are reserved.
- Required source media and analysis records are ready.
- Provider is active and suitable.
- No blocking approval/readiness check exists.

If any gate fails, request status should remain `draft`, `awaiting_approval`, `approved`, `failed`, or stay out of the generation request table until the missing dependency is satisfied. Future job orchestration can represent dependency waits through the job status tables.

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

## Lyria Pro Music Generation

Lyria Pro is the future primary custom music generation provider for ReeditPro SoundSync Music Intelligence. This document does not integrate Lyria Pro, add Google API keys, call Google APIs, or deploy workers.

Future generation requests should support project-specific music cues, Lyria Pro prompt plans, negative prompts, generated audio assets, music QA, and mix/ducking plans. Generated audio assets should link back to the music cue, edit plan, credit estimate, credit reservation, generation request, render inputs, and export usage records.

Lyria Pro provider secrets must stay in Secret Manager or secure runtime configuration. Database rows may store provider metadata and secret reference labels only; they must never store API keys, service role keys, provider credentials, signed URLs, or raw secrets.

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

`generation_providers.secret_reference_name` stores a reference label only. It must never contain an API key, service role key, provider credential, signed URL, or raw secret.
