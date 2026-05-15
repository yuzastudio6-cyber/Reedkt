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

## Source Clip Order

Uploaded or sent clip order is stored as a source sequence. This is the order the user filmed the clips or believes they belong.

Source sequence order is important planning context, but it is not automatically the final edit order. A future edit plan must show the recommended final structure before generation begins.

## Approval Boundary

RP-DB-03 stores approval-ready chat cards/actions, but it does not implement full edit-plan approval, credit approval, credit reservations, generation jobs, or rendering.

ReeditPro must never start expensive AI editing, animation generation, rendering, or credit spending until:

1. AI understands the user's goal.
2. AI creates an edit plan.
3. AI creates a credit estimate.
4. The user approves the plan and credits.

## Future Migrations

Later migrations should add, in order:

- edit quality engine tables
- credit wallets, estimates, ledger entries, and reservations
- approval records
- job orchestration and agent run tables
- Stroke Motion planning tables
- Graphic Design / VisualExplain, Real Motion, and SoundSync planning tables
- generation provider records
- render jobs and renders
- preview reviews, revisions, QA reports, and exports

## Local-Only Reminder

These migrations are local repo artifacts until a later deployment task. RP-DB-03, RP-DB-04, and RP-DB-05 do not connect to Supabase, run remote migrations, configure storage, add real uploads, call AI providers, integrate Stripe, deploy Google Cloud workers, render video, or build mobile app screens.
