# RP-DB-11 End-to-End Mock Scenario

`e2e-mock-scenario.sql` is a local-only seed example for validating the ReeditPro database shape after RP-DB-03 through RP-DB-10. It does not connect to remote Supabase, does not add credentials, does not call providers, and does not render video.

## What It Represents

The scenario models a luxury real estate reel created through chat:

1. A user starts a project and chat session.
2. The user sends four clips in source order.
3. The assistant maps source order, creates a recommended edit structure, prepares an edit plan, estimates credits, and waits for approval.
4. The user approves the plan and credit estimate in chat.
5. Credits are reserved.
6. Jobs coordinate analysis, planning, generation, rendering, and QA.
7. A deterministic Stroke Motion overlay is generated as an intermediate asset.
8. A preview render is created and shown in chat.
9. QA passes with a non-blocking caption warning.
10. A revision request and export placeholder are recorded.

The script uses deterministic UUIDs so records can be connected across the full pipeline.

## Auth Prerequisite

`public.user_profiles.id` references `auth.users(id)`. The SQL script checks for a local `auth.users` row with:

`00000000-0000-4000-8000-000000000001`

If that row is missing, the script stops before inserting public mock data. This keeps the example honest about Supabase Auth without trying to create production-like auth users in a schema-dependent way.

## Tables Touched

The scenario touches records across:

- account/workspace/subscription: `user_profiles`, `workspaces`, `workspace_members`, `subscriptions`
- project/chat: `projects`, `chat_sessions`, `chat_messages`, `inline_chat_cards`, `chat_actions`
- media/source order: `media_assets`, `source_clip_sequences`, `source_clip_sequence_items`
- planning: `intent_analyses`, `source_sequence_maps`, `source_sequence_map_items`, `recommended_edit_structures`, `edit_plans`, `story_beat_maps`, `story_beats`, `edit_plan_segments`, `signature_routes`, `edit_instructions`
- edit quality: `edit_quality_profiles`, `pacing_analysis`, `cut_decisions`, `transition_plans`, `audio_environment_analysis`, `ambient_sound_plans`, `music_plans`, `sound_effect_plans`, `caption_plans`, `edit_quality_checks`
- Stroke Motion: `stroke_motion_plans`, `stroke_motion_meaning_expansions`, `stroke_motion_beats`, `stroke_motion_characters`, `stroke_motion_symbols`, joins, transitions, timing anchors, storyboard frames, and generation specs
- credits: `credit_wallets`, `credit_grants`, `credit_ledger_entries`, `credit_estimates`, `credit_estimate_line_items`, `credit_approvals`, `credit_reservations`, `credit_reservation_line_items`
- jobs: `job_batches`, `jobs`, `job_dependencies`
- generation: `generation_providers`, `generation_provider_capabilities`, `generation_provider_models`, `generation_requests`, `generation_request_inputs`, `generated_assets`, `generated_asset_versions`, `generated_asset_timing_maps`, `generation_events`, `generation_request_costs`
- render/review/QA/export: `render_jobs`, `render_job_inputs`, `renders`, `render_events`, `preview_reviews`, `review_comments`, `qa_reports`, `qa_report_items`, `revision_requests`, `revision_request_items`, `exports`, `export_variants`

## Chat-Native Editing

The chat is the editor in the mock flow. The user request, assistant plan response, preview-ready message, and revision request are all `chat_messages`. Inline chat cards represent the source sequence, approval request, and preview-ready state. The approval action is a `chat_actions` record, and credit approval references that action.

## Source Sequence Order

The uploaded clips are stored in `source_clip_sequence_items.uploaded_order`:

1. `entry-living-room-walkthrough.mp4`
2. `kitchen-detail-shots.mov`
3. `speaker-investment-line.mp4`
4. `exterior-backyard.mp4`

The source sequence map documents that this order is planning context, not automatically the final edit order. The recommended edit structure preserves the order in this mock scenario, but still records that user approval is required.

## Planning And Approval

The mock creates an intent analysis, source sequence map, recommended edit structure, approved edit plan, story beats, segment instructions, signature route, and edit instructions. The edit plan is approved only after the inline approval card/action is recorded.

This preserves the rule that ReeditPro must understand the user goal and show a plan before generation.

## Professional Edit Quality

The edit quality profile uses `quality_level = 'signature'` and `edit_complexity = 'signature_edit'`, but it explicitly records that Basic Edit is still professional clean editing. Pacing, cut, transition, audio, ambience, music, SFX, captions, and edit-quality checks show that quality is modeled independently from generation depth.

Key examples:

- Preserve an emotional/natural pause instead of cutting it.
- Use context-based soft cuts, not random transitions.
- Preserve natural room tone.
- Keep music and SFX voice-first.
- Keep captions readable and clear of overlays.

## Stroke Motion Source Reading Mode

The mock includes a Stroke Motion source reading example using the Joseph/Mary sample from the architecture docs. It is marked as sample-only and not Bible-only.

It includes:

- `stroke_motion_plans.understanding_mode = 'source_reading_mode'`
- a meaning expansion record
- three visual beats
- Joseph and Mary character records
- relationship/message symbols
- beat-character and beat-symbol links
- connected transitions
- timing anchors
- storyboard frames
- a generation spec preferring deterministic SVG-style rendering

Worker notes preserve the product rules:

- Do not make Mary look guilty.
- Show Josephs misunderstanding respectfully.
- Keep divine presence symbolic, not literal.
- Use one continuous stroke line if possible.
- Make the animation understandable without words.

## Credits, Approval, And Reservation

The mock creates a Personal weekly bonus credit grant of 100 credits, a 92-credit estimate, line items, approval, reservation, reservation line items, and ledger entries.

The intended flow is:

`estimate -> approval -> reservation -> generation/render may be queued by future backend logic`

No final spend is recorded. This keeps the mock focused on approval and reservation before generation.

## Jobs And Dependencies

The job batch and jobs represent:

- transcription
- media analysis
- intent analysis
- edit quality planning
- Stroke Motion planning
- credit estimation
- generation request
- render preview
- quality check

Dependencies make later work wait on earlier planning and approval-adjacent stages. The generation and render jobs include the credit reservation ID.

## Generation And Generated Assets

The mock provider is a deterministic overlay renderer, not a real provider integration. It supports transparent overlays, SVG, Lottie, Remotion-style outputs, and word-level timing as metadata only.

The generation request links to:

- edit plan
- edit plan segment
- signature route
- Stroke Motion plan, beat, and generation spec
- job
- credit estimate
- credit reservation
- provider and model

The generated asset is a transparent Stroke Motion SVG overlay and is marked `usable_for_render = true`. It is still an intermediate generated asset, not a final render.

## Render, Preview, QA, Revision, Export

The render job combines source media and the generated Stroke Motion overlay into a preview render. The `renders` row links back to the preview chat message and inline card so the result can appear in chat.

QA passes overall, with one warning about caption wording. The preview review records `changes_requested`, a timestamped comment identifies the caption issue, and a revision request points to the affected segment, signature route, generated asset, Stroke Motion plan, and render input.

The export row is only a draft placeholder. It records that export should wait for revision resolution, preview approval, and any required credit approval.

## Mock-Only Limitations

- No real auth user is created by this script.
- No remote Supabase project is contacted.
- No AI APIs, provider APIs, Stripe APIs, uploads, Google Cloud jobs, or renderers are called.
- No files are written to storage.
- Cached credit wallet balances are illustrative and should be reconciled by future backend services.
- RLS behavior depends on the local SQL execution role; future app flows should use server-side privileged APIs for worker mutations.

