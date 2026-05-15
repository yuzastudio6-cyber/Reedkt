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

## Source Clip Order

Uploaded or sent clip order is stored as a source sequence. This is the order the user filmed the clips or believes they belong.

Source sequence order is important planning context, but it is not automatically the final edit order. A future edit plan must show the recommended final structure before generation begins.

## Approval Boundary

RP-DB-03 stores approval-ready chat cards/actions, but it does not implement full edit-plan approval, credit approval, credit reservations, generation jobs, or rendering.

RP-DB-06 adds credit estimates, credit approvals, and credit reservations as database records, but it still does not implement backend services, generation jobs, rendering, billing, or remote deployment.

RP-DB-07 adds job orchestration records and worker/agent audit trails, but it still does not execute jobs, call providers, render previews, deploy workers, or spend credits from backend services.

RP-DB-08 adds Stroke Motion planning records and future generation specs, but it still does not generate animations, call providers, render overlays, or spend credits from backend services.

ReeditPro must never start expensive AI editing, animation generation, rendering, or credit spending until:

1. AI understands the user's goal.
2. AI creates an edit plan.
3. AI creates a credit estimate.
4. The user approves the plan and credits.
5. Credits are reserved.

## Future Migrations

Later migrations should add, in order:

- generation provider records
- render, export, and revision records
- preview delivery records and QA reports
- Stripe and billing integration after the credit service boundary is implemented

## Local-Only Reminder

These migrations are local repo artifacts until a later deployment task. RP-DB-03 through RP-DB-08 do not connect to Supabase, run remote migrations, configure storage, add real uploads, call AI providers, integrate Stripe, deploy Google Cloud workers, render video, or build mobile app screens.
