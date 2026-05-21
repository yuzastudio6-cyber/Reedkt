# Supabase

This repository targets the Supabase project named `reeditpro`.

Do not use or reference the Yuza Studio Supabase project for this repo. Do not commit Supabase credentials, service role keys, API keys, `.env` secrets, provider credentials, or signed URLs.

## Migration Order

### RP-DB-03: Core ReeditPro Tables

`migrations/202605130001_core_reeditpro_tables.sql` creates the first local database foundation:

- software access plans
- app user profiles
- workspaces and workspace members
- subscription placeholder records
- projects
- chat sessions
- chat messages
- chat attachments
- inline chat cards
- chat actions
- media assets
- source clip sequences
- source clip sequence items
- reference assets

### RP-DB-04: Intent + Edit Planning Tables

`migrations/202605130002_intent_edit_planning_tables.sql` creates the planning layer between chat/media context and future generation:

- intent analyses
- source sequence maps
- source sequence map items
- recommended edit structures
- edit plans
- story beat maps
- story beats
- edit plan segments
- signature routes
- edit instructions
- planning notes
- edit plan chat card links

This migration supports:

`chat request -> source clip sequence -> intent analysis -> source sequence map -> recommended edit structure -> edit plan -> story beats -> segments -> signature routes -> worker notes -> awaiting approval`

It creates planning records only. It does not create credit wallets, credit estimates, job orchestration, edit quality engine tables, Stroke Motion animation tables, generation providers, renders, exports, revisions, or QA reports.

Edit plans are approval-ready in RP-DB-04, but credit estimates and credit approval tables arrive later. Recommended edit structure is stored separately from source sequence, and it is not applied until the user approves the edit plan. Signature systems are routed per segment; video type gives workflow context but does not force Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, or any visual effect.

Basic edits can use no signature systems. Basic still means professional clean editing, not low-quality editing.

### RP-DB-05: Professional Edit Quality Engine

`migrations/202605130003_professional_edit_quality_engine.sql` creates the edit quality layer that makes every ReeditPro edit professional before future preview/render work:

- edit quality profiles
- pacing analysis
- cut decisions
- transition plans
- audio environment analysis
- ambient sound plans
- music plans
- sound effect plans
- caption plans
- edit quality checks

Every ReeditPro edit, including Basic, must meet a professional editing standard. Basic means lower-compute clean editing, not low-quality editing. Edit level controls complexity, generation depth, credit cost, signature usage, and pipeline depth. It does not control quality.

RP-DB-05 models:

- whether pauses should be removed or preserved
- clean cuts, soft cuts, jump cuts, J-cuts, L-cuts, match cuts, cutaways, or no cut
- contextual transition decisions instead of random effects
- room tone, ambience, noise, voice clarity, and cleanup needs
- ambient sound preservation or smoothing
- music mood, role, energy, reference influence, and ducking
- subtle SFX planning and avoiding overpowering voice
- caption readability, density, placement, and overlay collision avoidance
- lightweight edit-quality checks before future preview

This migration does not create credit ledgers, jobs, Stroke Motion animation tables, generation providers, render/export/revision tables, or full QA reports. Those remain future migrations.

This migration is designed for ReeditPro's chat-native editor model:

`project -> chat session -> chat messages/attachments -> media assets -> source clip sequence -> reference assets`

The chat is the editor. Users send clips, reference links, instructions, approvals, revision requests, and export requests through chat. Inline chat cards appear only when ReeditPro needs user input, confirmation, approval, progress, or preview.

### RP-DB-06: Credit Ledger + Approval Gate

`migrations/202605130004_credit_ledger_approval_gate.sql` creates the credit and approval boundary that protects users and ReeditPro before future generation work:

- credit wallets
- credit grants / buckets
- credit ledger entries
- credit estimates
- credit estimate line items
- credit approvals
- credit reservations
- credit reservation line items
- credit refunds
- a simple credit wallet balance view
- a `can_start_generation(edit_plan_id)` helper for future server-side generation gates

Subscription remains software access. Reedit Credits pay for AI generation, rendering, editing usage, premium signature systems, Real Motion, SoundSync, revisions, and future exports.

RP-DB-06 models this flow:

`estimate credits -> show estimate in chat -> user approves estimate -> reserve credits -> future generation may start -> successful generation turns reserved credits into spent credits -> ReeditPro-caused failures can be refunded`

Weekly bonus, purchased, promotional, admin, and refund credits are modeled as separate grant buckets. Cached wallet balances exist for fast UI reads, but grants and append-style ledger entries are the source of truth for future backend reconciliation.

This migration links `edit_plans.credit_estimate_id` to credit estimates and lets ledger entries reference estimates and reservations. It enables RLS for all new credit tables, gives workspace members read access, keeps ledger mutation restricted, and expects future backend/service code to perform reservation, spend, reconciliation, and refund operations after approval.

This migration does not add Stripe, billing checkout, a backend credit service, job orchestration, Stroke Motion animation tables, generation providers, render/export/revision tables, QA reports, AI APIs, uploads, Google Cloud workers, mobile screens, or remote Supabase deployment.

### RP-DB-07: Job Orchestration + Agent Runs

`migrations/202605130005_job_orchestration_agent_runs.sql` creates the orchestration layer for coordinated AI editor work:

- job batches
- jobs
- job dependencies
- job events
- agent runs
- agent outputs
- worker runtime configs
- worker heartbeats
- a global event log
- a simple job progress view
- a `can_run_job(job_id)` helper for future backend orchestration gates

Jobs model the chat-native editor pipeline from media and intent analysis through planning, credit estimation, approval waits, credit reservation waits, future generation, preview delivery, quality checks, exports, and revision planning. Waiting states are first-class: `waiting_dependency`, `waiting_user_input`, `waiting_user_approval`, and `waiting_credit_reservation`.

Generation, render preview, preview delivery, and export-like jobs must not run until dependencies are satisfied, the edit plan is approved, the credit estimate is approved, and a non-expired credit reservation exists. The helper delegates the approval/credit boundary to RP-DB-06 `can_start_generation(edit_plan_id)` and also checks the job's reservation.

Worker runtime config records store non-secret configuration only. `secret_reference_name` is a reference label for a future secret manager, never an API key, service role key, provider credential, signed URL, or raw secret.

This migration enables RLS for all new orchestration tables, gives workspace members read access through policies, keeps job/agent/event mutation restricted to owner/admin policies for authenticated users, and grants explicit future service-role access without adding credentials.

This migration does not implement actual workers, job execution, backend APIs, AI APIs, Stripe, Google Cloud deployment, real uploads, rendering, mobile screens, Stroke Motion detail tables, generation provider tables, generated asset tables, render/export/revision tables, or QA reports.

### RP-DB-08: Stroke Motion Data Model + Planning Tables

`migrations/202605130006_stroke_motion_data_model.sql` creates the deep planning model for the first structured ReeditPro signature system:

- Stroke Motion plans
- meaning expansions
- visual story beats
- stroke characters
- stroke symbols
- beat-character and beat-symbol joins
- connected transitions
- timing anchors
- storyboard frames
- future generation specs
- reusable plan examples

Stroke Motion supports `spoken_story_mode` when the user already explains the story clearly, and `source_reading_mode` when the user reads from a source such as scripture, a book passage, a quote, a script, historical text, a document, a lesson, or an article.

In `source_reading_mode`, the AI must create meaning expansion before animation planning. Meaning expansion turns compact source text into plain-language story beats, then beats store both `meaning` and `visual_action` so the planned animation can be understood visually without audio or captions.

Transitions connect beats into one fast animated story instead of random arrows, circles, or decorative icons. Timing anchors sync motion to words, phrases, sentences, pauses, emotional shifts, scene cuts, music beats, SFX hits, or manual marks.

Generation specs prepare future animation workers with transparent overlay, word-level timing, output format, deterministic renderer preference, style constraints, timing constraints, prompt, negative prompt, and worker notes. They are not generation requests and do not call Wan, Veo, Kling, Remotion, Lottie, SVG renderers, or any provider.

The seeded `joseph_mary_source_reading_example` is example-only reference data. It demonstrates source reading mode, symbolic treatment, respectful worker notes, and the transition chain `relationship line -> holy glow -> tension/crack -> separation path -> divine message line -> repaired connection -> protective circle -> fade/underline transition out`. It does not make Stroke Motion Bible-only.

This migration enables RLS for every new table, gives workspace members read access, allows owner/admin/editor planning writes through policies, keeps examples read-only for authenticated users, and grants future service-role access without adding credentials.

This migration does not generate animations, create generation provider/request tables, create generated assets, create render/export/revision/QA tables, integrate AI APIs, integrate Stripe, deploy Google Cloud, build backend endpoints, add uploads, render video, or build mobile screens.

### RP-DB-09: Generation Providers + Generated Assets

`migrations/202605130007_generation_providers_generated_assets.sql` creates the generation provider and generated asset foundation:

- generation providers
- provider capabilities
- provider models
- generation requests
- generation request inputs
- generated assets
- generated asset versions
- generated asset timing maps
- generation events
- generation request cost records

This migration does not integrate real AI providers. Wan, Veo, Kling, Remotion, SVG, Lottie, Google Cloud workers, and custom deterministic renderers are modeled as provider options or placeholders only.

Provider records store metadata and secret reference names only. Actual provider keys, service role keys, signed URLs, and credentials must live in Secret Manager or secure runtime configuration, never in database rows.

Generation requests link to edit plans, edit plan segments, signature routes, Stroke Motion plans/beats/specs, jobs, agent runs, credit estimates, and credit reservations. These links prepare future backend orchestration to enforce the approval boundary: approved edit plan, approved credit estimate, reserved credits, and correct generation job before queueing or running expensive generation.

Stroke Motion should prefer deterministic renderers such as SVG, Lottie, Remotion, or custom animation renderers when transparent overlays, word-level timing, precise story beat sync, and editable timing are required. Wan, Veo, Kling, and other AI video providers can be future options for concept generation, style reference, or advanced animation support, but ReeditPro should not depend only on full AI video generation for Stroke Motion.

Generated assets are intermediate or reusable assets for future render jobs. They are not final renders, exports, preview review records, revision records, or QA reports.

### RP-DB-10: Render, Preview, Export, Revision + QA

`migrations/202605130008_render_preview_export_revision_qa.sql` creates the render, preview, export, revision, and QA foundation:

- render jobs
- render job inputs
- render outputs
- render events
- exports
- export variants
- preview reviews
- review comments
- revision requests
- revision request items
- QA reports
- QA report items
- a latest preview view
- a read-only `can_export_render(render_id)` helper

Render jobs describe how future workers will combine source clips, edit plans, cuts, transitions, captions, audio plans, generated overlays, timing maps, and export settings into preview or final outputs. This migration stores the records only. It does not run FFmpeg, Remotion, Cloud Run, GPU workers, provider calls, uploads, or rendering.

Renders are full preview/final outputs and remain separate from generated intermediate assets. A preview render can link to chat messages and inline cards so results appear inside the chat-native editor.

Preview reviews and review comments let users approve, reject, or request changes from chat. Revision requests can point to affected segments, signature routes, generated assets, Stroke Motion plans, render inputs, and timecodes. Revisions may require new generation, a new render, and new credit estimates/reservations.

QA reports and QA items decide whether a preview/export is good enough to show or deliver. QA covers speech clarity, cut smoothness, captions, caption collisions, music/SFX balance, transitions, ambience, story flow, signature timing, Real Motion face safety, render integrity, credit compliance, user instructions, and professional standard.

Final exports should happen only after render readiness, non-blocking QA, preview approval when required, and any required credit approval.

### RP-DB-11: Database QA + End-to-End Mock Scenario

RP-DB-11 does not add a new migration file. It adds local validation and review artifacts for the existing RP-DB-03 through RP-DB-10 migration chain:

- `schema-review.md`
- `migration-order.md`
- `schema-health-checks.sql`
- `e2e-mock-scenario.sql`
- `e2e-mock-scenario.md`

The review confirms the current schema sequence supports the chat-native path from project and source clips through planning, professional edit quality, Stroke Motion, credit estimate/approval/reservation, jobs, generation requests, generated assets, render jobs, preview review, QA, revisions, and export placeholders.

The mock scenario is local-only. It uses placeholder UUIDs and requires a matching local `auth.users` row before inserting `user_profiles`, because Supabase Auth owns profile identity. It does not deploy migrations, connect to remote Supabase, add credentials, call providers, integrate Stripe, upload files, render video, or create mobile screens.

### RP-SFX-03: SoundSync SFX Director Tables

`migrations/202605190001_sfx_director_tables.sql` creates the SoundSync SFX Director database layer:

- SFX event plans
- SFX provider routes
- SFX prompt plans
- generated SFX asset metadata
- SFX trim plans
- SFX timing alignments
- SFX mix plans
- SFX QA reports and issues
- SFX library candidates
- SFX usage records
- SFX prompt adapter tests
- a simple SFX event summary view

SFX is planned before generation. By default, ReeditPro SFX supports ReeditPro-created edit layers such as transitions, title/chapter cards, Graphic Design / VisualExplain reveals, Stroke Motion moments, Real Motion object movement, CTA reveals, montage hits, and ambient bridges. It does not add fake SFX for every source-footage action.

Mirelo SFX V1.5 is modeled as the future production SFX provider. MMAudio V2 is modeled as the future draft, Basic/Pro fallback, and video-synced helper. ReeditPro internal library and no-SFX routes are also modeled. Provider prompts are stored as planning records only and do not execute provider calls.

Generated SFX should be longer than the final needed sound, then trimmed, hit-aligned, faded, normalized, voice-first mixed, and QA-checked before preview/export use. Generated SFX starts project-only; library promotion requires QA, provenance, privacy, and licensing review.

This migration includes RLS, indexes, updated-at triggers, comments, and safe generic prompt-adapter seed rows. It does not integrate Mirelo or MMAudio, add API keys or provider secrets, connect to Supabase remotely, deploy Google Cloud, generate sound, render media, upload files, integrate Stripe, or build mobile screens.

### RP-TIMING-03: StoryTiming Master Tables

`migrations/202605190002_storytiming_master_tables.sql` creates the StoryTiming master coordination database layer:

- master timing maps
- story timing segments
- timing anchors
- timing events
- timing dependencies
- timing conflicts
- timing conflict resolutions
- StoryTiming QA checks
- render timing manifests
- structured render manifest tracks and events
- simple latest/open-conflict/render-ready views

Timing already exists across edit plan segments, story beats, pacing, cuts, transitions, captions, Stroke Motion, music plans, SFX timing, render inputs, QA, and review comments. StoryTiming does not replace those records. It coordinates them through master maps, source references, anchors, events, dependencies, conflicts, QA checks, and render-ready manifests.

The migration uses safe direct foreign keys for core workspace/project/chat/edit-plan/render relationships and uses `source_system`, `source_record_id`, and `source_table_name` for distributed timing systems whose native tables may evolve independently.

This migration includes enum types, structured tables, indexes, updated-at triggers, RLS policies, comments, and local views. It does not connect to Supabase remotely, run remote migrations, call AI/provider APIs, integrate Lyria/Mirelo/MMAudio, render media, deploy Google Cloud, add secrets, integrate Stripe, or build frontend/mobile UI.

## Source Clip Order

Uploaded or sent clip order is stored as a source sequence. This is the order the user filmed the clips or believes they belong.

Source sequence order is important planning context, but it is not automatically the final edit order. A future edit plan must show the recommended final structure before generation begins.

## Approval Boundary

RP-DB-03 stores approval-ready chat cards/actions, but it does not implement full edit-plan approval, credit approval, credit reservations, generation jobs, or rendering.

RP-DB-06 adds credit estimates, credit approvals, and credit reservations as database records, but it still does not implement backend services, generation jobs, rendering, billing, or remote deployment.

RP-DB-07 adds job orchestration records and worker/agent audit trails, but it still does not execute jobs, call providers, render previews, deploy workers, or spend credits from backend services.

RP-DB-08 adds Stroke Motion planning records and future generation specs, but it still does not generate animations, call providers, render overlays, or spend credits from backend services.

RP-DB-09 adds provider metadata, generation requests, generated assets, and timing/cost records, but it still does not call providers, deploy workers, render previews, create exports, process revisions, or spend credits from backend services.

RP-DB-10 adds render, preview, export, revision, and QA records, but it still does not implement rendering, backend APIs, cloud workers, uploads, provider calls, exports, or credit spending from backend services.

ReeditPro must never start expensive AI editing, animation generation, rendering, or credit spending until:

1. AI understands the user's goal.
2. AI creates an edit plan.
3. AI creates a credit estimate.
4. The user approves the plan and credits.
5. Credits are reserved.

### RP-FIX-07: Storage Upload Pipeline Readiness

`migrations/202605200001_storage_upload_pipeline_readiness.sql` is a local-only readiness migration for the RP-FIX-07 upload path convention.

It keeps the active bucket ids from RP-DATA-04:

- `source-media`
- `generated-assets`
- `processed-media`
- `previews`
- `exports`
- `thumbnails`
- `qa-artifacts`
- `worker-temp`

It adds conservative storage object policies for `workspace/{workspace_id}/project/{project_id}/...` paths. Direct browser writes remain limited to source media and thumbnails for project editors. Generated assets, previews, exports, QA artifacts, worker temp files, profile assets, and brand assets should use backend workers or signed upload routes until production policies are validated.

This migration has not been run locally, in staging, or in production.

### RP-FIX-11: Worker Leases Runtime Transport

`migrations/202605200002_worker_leases_runtime_transport.sql` is a local-only readiness migration for backend runtime transport and worker lease ownership.

It creates:

- `worker_leases`
- `backend_runtime_messages`
- `job_claim_attempts`

The migration is conservative: authenticated users can read records for workspaces/projects they belong to, while insert/update/delete are reserved for future service-role backend workers. It has not been run locally, in staging, or in production.

### RP-E2E-READY-01: Runtime Database Foundation

`migrations/202605210001_e2e_runtime_readiness_tables.sql` is a local/review-ready runtime foundation for real end-to-end editing tests after staging validation.

It extends the existing `approved_plan_snapshots` table and adds:

- `api_idempotency_keys`
- `upload_intents`
- `storage_object_records`
- `signed_url_events`
- `worker_job_claims`
- `tool_runtime_checks`
- `provider_request_attempts`
- `provider_webhook_events`

The migration adds helper functions for approved snapshot readiness and worker claim safety, enables RLS on the new tables, and keeps privileged writes reserved for future service-role backend/worker paths. Canonical storage records store bucket and object path only; signed URL audit events do not store the signed URL.

This migration has not been run locally, in staging, or in production. It does not connect to Supabase remotely, generate signed URLs, deploy workers, call providers, install tools, render media, add secrets, add Stripe, or spend credits.

## Future Migrations

Later migrations should add, in order:

- local/staging application and verification of RP-E2E-READY-01 runtime readiness tables
- backend API service-role handlers for approved snapshots, idempotency, upload intents, storage records, signed URL events, worker claims, tool checks, provider attempts, and webhooks
- signed storage route wiring
- Cloud Run worker scaffolding for generation, media tools, QA, and rendering
- Stripe and billing integration after the credit service boundary is implemented

## Local-Only Reminder

These migrations are local repo artifacts until a later deployment task. RP-DB-03 through RP-TIMING-03, RP-FIX-07, RP-FIX-11, and RP-E2E-READY-01 do not connect to Supabase, run remote migrations, configure remote storage, add real uploads, call AI providers, integrate Stripe, deploy Google Cloud workers, render video, or build mobile app screens.
