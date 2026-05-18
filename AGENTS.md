# ReeditPro Agent Instructions

These instructions are for Codex and any future agent working in this repository.

## Required Reading

- Read `design.md` before any UI, layout, component, visual, brand, or frontend design work.
- Read `product-plan.md` before product-scope decisions.
- Read `intent-led-edit-planning.md` before upload, planning, AI workflow, generation, or approval work.
- Read `pricing-and-credits.md` before billing, credits, subscription, usage, or estimate work.
- Read `signature-systems.md` and `real-motion-system.md` before visual AI system work.
- Read `edit-workflow-blueprints.md` before changing video type dropdowns, workflow profiles, edit setup, or planning prompts.
- Read `visual-storytelling-architecture.md` before visual storytelling, beat planning, visual asset type, or character consistency work.
- Read `model-routing-policy.md` before provider model routing, fallback, resolution, or generation-policy work.
- Read `frame-layout-system.md` before frame template, layout panel, compositor, safe-zone, or AI animation background work.
- Read `speaker-visual-layout-strategy.md` before speaker presence, visual takeover, picture-in-picture, side-by-side, lower panel, map, chart, evidence board, screen capture, b-roll cutaway, or adaptive layout strategy work.
- Read `depth-aware-overlay-composition.md` before depth-aware overlays, foreground masks, contact object preservation, object anchoring, mask risk, or layered compositing strategy work.
- Read `video-understanding-report.md` before video understanding, clip analysis, transcript meaning, visual/audio issue planning, opportunity detection, or source-content analysis work.
- Read `adaptive-planning-layer.md` before adaptive edit strategy, per-segment visual/tool decisions, or anti-template planning work.
- Read `adaptive-edit-strategy-planner.md` before adaptive segment strategy, generation restraint, visual/tool selection, or reasoned per-beat creative decisions.
- Read `open-source-tool-registry.md` before open-source tool strategy, deterministic tool planning, tool/provider separation, license review, or controlled-tool decisions.
- Read `tool-settings-catalog.md` before tool setting, preset, registry profile, map/chart/browser/color/audio/QA tool planning, or tool catalog work.
- Read `launch-tool-stack-update.md` before launch tool stack, AudioFlux, Signalsmith Stretch, FFmpeg LGPL configuration, VapourSynth, Sharp + libvips, Essentia replacement, or Rubber Band replacement work.
- Read `remotion-capability-matrix.md` before deciding what Remotion can build directly versus what needs GPT-Image-2, open-source tools, AI video assets, workers, or QA-only tools.
- Read `render-strategy-planner.md` before render strategy planning, Remotion-only decisions, GPT-image-to-Remotion flows, tool-to-Remotion flows, AI-video-to-Remotion flows, or worker pre/postprocess strategy work.
- Read `tool-strategy-planner.md` before segment/asset-specific tool chain planning, controlled-tool settings, tool fallbacks, or tool-vs-AI decisions.
- Read `tool-usage-planning-ui.md` before changing the chat UI that displays planned tool chains, tool settings, execution modes, or planning-only tool status.
- Read `color-pipeline-planning.md` before color correction, grading, shot matching, generated asset matching, AI-video panel color consistency, or color QA planning work.
- Read `color-grading-settings-catalog.md` before color settings, grade presets, LUT/look settings, shot matching settings, generated asset matching settings, or color QA thresholds.
- Read `soundsync-audio-pipeline-planning.md` before SoundSync, audio cleanup, loudness, music bed, ducking, SFX, beat timing, emotional pacing, or audio QA planning work.
- Read `audio-settings-catalog.md` before audio cleanup settings, loudness settings, music/SFX settings, SoundSync cue settings, beat sync settings, or audio QA thresholds.
- Read `map-location-animation-planning.md` before map, route, neighborhood, geography, location card, map-behind-subject, or map evidence planning work.
- Read `map-animation-settings-catalog.md` before map settings, location confidence, map style, route/camera animation, map safe zones, or map QA threshold work.
- Read `chart-diagram-planning.md` before chart, diagram, money-flow, metric, timeline, evidence-flow, or VisualExplain data graphic planning work.
- Read `chart-diagram-settings-catalog.md` before chart/data/diagram settings, source confidence, label density, animation settings, layout settings, or dataviz QA threshold work.
- Read `remotion-renderer-plan.md` before rendering, compositing, frame layout, motion design, or visual asset assembly work.
- Read `professional-editing-ontology.md` before professional editing style, pacing, cut, transition, color, caption, b-roll, sound, or custom directive work.
- Read `edit-quality-standards.md` before changing tier quality, edit QA, professional baseline, or quality-gate behavior.
- Read `intent-compiler-architecture.md` before natural-language request parsing, compiled intent, clarifying questions, or user instruction mapping work.
- Read `segment-edit-operations-architecture.md` before segment planning, worker instructions, edit operations, cut lists, caption operation plans, b-roll operation plans, or per-segment editing work.
- Read `edit-qa-architecture.md` before QA planning, fallback QA, model-policy QA, approval QA, frame-layout QA, or professional delivery checks.
- Read `edit-planning-database-architecture.md` before future edit-planning persistence, database architecture, approved plan versioning, job tables, QA tables, revision tables, or credit approval schema work.
- Read `approved-plan-snapshot-policy.md` before approval, approved snapshot, worker execution, credit reservation, revision versioning, or immutable plan version work.
- Read `provider-prompt-architecture.md` before provider prompt planning, prompt previews, image prompt briefs, AI-video prompt briefs, Remotion motion briefs, or approved prompt snapshot work.
- Read `character-consistency-system.md` before character pack, recurring character, keyframe identity, start/end frame consistency, or likeness-safety work.
- Read `documentary-fact-safety-system.md` before documentary claims, real named people, allegations, evidence cards, fact-safety planning, or case-study visual treatment work.
- Read `planner-regression-validation.md` before planner validation, regression checks, demo scenario QA, model-routing tests, prompt-builder tests, or hard product rule validation work.
- Read `connected-planning-system-overview.md`, `planning-layer-inventory.md`, and `implementation-status-and-next-phase.md` before connected planning-system audits, planning-layer inventory work, next-phase recommendations, or documentation cleanup.
- Read `supabase-schema-planning-bridge.md`, `database-migration-readiness-checklist.md`, and `supabase-table-specification.md` before Supabase schema planning, table planning, migration bridge work, RLS planning, storage bucket planning, or database readiness work.
- Read `sql-migration-draft-review.md`, `supabase-rls-policy-draft.md`, and `supabase-storage-bucket-draft.md` before SQL migration draft review, RLS draft policy work, storage bucket draft policy work, or migration readiness follow-up.
- Read `migration-review-and-rls-hardening.md`, `rls-hardening-matrix.md`, and `data-privacy-retention-plan.md` before migration review, RLS hardening, service-role boundary, access-control matrix, private artifact, browser-capture privacy, or retention planning work.
- Read `chat-planning-ux-architecture.md` before chat flow organization, planning card priority, collapse behavior, guided/detailed/developer modes, or approval-path UX work.
- Read `source-sequence-review-ux.md` before source order review, clip reorder UX, uploaded-order semantics, or source-sequence confirmation work.
- Read `docs/lyria-worker-plan.md` and `docs/google-cloud-audio-worker-plan.md` before Lyria worker, Google Cloud audio worker, music generation job, worker secret, or generated music asset work.
- Read `docs/lyria-integration-adapter.md` before Lyria provider adapter, Lyria request building, Lyria response parsing, integration mode, or disabled real API path work.
- Read `supabase-production-test-readiness.md` and `supabase-local-staging-test-plan.md` before active Supabase migration testing, production-test readiness, local/staging database validation, or Supabase advisor review work.

## Product Identity

ReeditPro is a web-first AI video editing platform. It is not a generic video editor, timeline clone, or template-only dashboard.

The primary product flow is:

1. User uploads clips in source order.
2. User chooses workflow context from a video type dropdown.
3. User chooses edit level and mood/style if needed.
4. User optionally provides a reference video.
5. User writes custom instructions.
6. AI analyzes clips, transcript, visual footage, and reference DNA.
7. AI creates a Source Sequence Map and edit strategy.
8. AI routes visual and audio systems per segment.
9. AI shows an edit plan and credit estimate.
10. User approves or requests changes.
11. Only after approval does generation/editing begin.

## Approval And Credit Gate

ReeditPro should never start expensive AI editing, rendering, or generation until it understands the user's goal and the user approves the edit plan and credit estimate.

- Always estimate credits before generation.
- Deduct credits only after user approval.
- Do not imply subscriptions provide open-ended AI editing.
- Failed ReeditPro generation should be refunded according to `pricing-and-credits.md`.
- Real Motion is premium and credit-heavy.

## Backend And Database Architecture

- RP-DB-01 architecture docs are the source of truth for future backend/database implementation.
- ReeditPro editing is chat-native. The chat is the editor, and UI appears inside chat only when the AI needs user input, confirmation, approval, progress, or preview.
- Every ReeditPro edit, including Basic, must meet a professional editing standard. Basic means lower-compute clean editing, not low-quality editing.
- Edit level controls complexity, generation depth, credit cost, signature usage, and worker pipeline depth. Edit level does not control quality.
- Heavy AI, generation, rendering, and background work should be designed for future Google Cloud workers, but no Google Cloud resources, credentials, or deployments should be added unless explicitly requested.
- Never begin generation before edit plan and credit approval.
- Stroke Motion supports `spoken_story_mode` and `source_reading_mode`.
- Stroke Motion source reading requires `meaning_expansion` before animation planning.
- Veo 3.1 Lite is Premium-only and fallback-only. Basic and Pro must never route to Veo.
- AI video generation should default to matching white/near-white/custom panel backgrounds, not transparent backgrounds.
- Basic must still be professional. Basic means lower-compute clean editing, not low-quality editing.
- Edit level controls complexity, fallback depth, asset count, and credit estimate. Edit level does not control quality.
- The professional editing ontology guides the AI but must not limit custom user requests.
- If a user asks for a style not in the ontology, store it as a custom directive and map it to known professional presets.
- No random b-roll, random transitions, random captions, random color grading, or random visuals.
- Every edit plan should include structured settings for pacing, color, captions, transitions, b-roll, sound, and visual systems when applicable.
- User chat must be compiled into structured editing intent before plan generation.
- Do not rely on raw chat text alone for edit planning.
- Ask clarifying questions only when missing information changes the edit.
- Explicit user instructions have priority over defaults unless constrained by safety, tier, model policy, frame rules, or platform rules.
- Basic and Pro cannot use Veo even if the user asks; explain the tier constraint and offer Wan/Hailuo or Premium final-fallback alternatives.
- Every approved edit plan should eventually resolve into segment edit operations with enough detail for workers to execute.
- QA must check the result against user intent, tier rules, source order, frame rules, model routing, and professional standards.
- Workers must not improvise outside approved plan and fallback rules.
- Basic and Pro cannot use Veo during QA fallback.
- Premium can use Veo only as final fallback/rescue.
- Future backend/database work must use approved plan snapshots.
- Workers must execute approved plan versions, not raw chat text.
- Do not overwrite approved plan versions; approved versions are immutable except for status and audit fields.
- User revisions create new plan versions.
- Credit estimates and approval records must point to exact plan versions.
- Basic/Pro no-Veo policy and Premium fallback-only Veo policy must be preserved in approved snapshots.
- Matching panel background and frame layout rules must be preserved in approved snapshots.
- Provider prompts must be built from compiled intent, professional editing direction, visual asset plan, style mode, frame layout, provider route, and QA checks.
- Do not hand-write random prompts disconnected from the approved plan.
- GPT-Image-2 prompts create images, cards, keyframes, start frames, and end frames.
- Wan, Hailuo, and Veo prompts create AI video clips/assets only, not the final canvas.
- Remotion owns final layout/composition and receives renderer or motion briefs.
- ReeditPro must plan speaker/visual layout per segment.
- Do not use the same layout for every video.
- Layout should depend on user request, segment meaning, source footage, platform, edit level, and visual need.
- Speaker should stay visible when trust, emotion, authenticity, or personal story matters.
- Visuals should take over when explanation, evidence, map, chart, timeline, diagram, or screen capture needs space.
- Remotion owns final layout/composition; AI models generate assets and clips only.
- Future depth-aware overlays and contact-object preservation are advanced layout/compositing tasks, not default flat overlays.
- Depth-aware overlays must be planned, not randomly applied.
- Preserve contact objects when they affect the depth composition.
- Person plus contact object can become one foreground depth group.
- Captions must stay above graphics and masks.
- Use safer layouts when mask risk is high.
- Basic should avoid complex depth masks.
- Pro can plan low/medium risk foreground-aware overlays.
- Premium can plan advanced depth overlays with stronger QA.
- Depth-aware composition is a compositing/masking task, not a reason to use Veo.
- Workers must not execute mask/depth plans before approval.
- ReeditPro must use video understanding before choosing visual or tool strategy.
- Do not edit every video with the same template.
- User intent and video content both shape the plan.
- Video understanding guides planning but does not override explicit user instructions.
- The planner should explain why each segment needs speaker, visual, both, b-roll, card, chart, map, Stroke Motion, Real Motion, or no extra visual.
- Current frontend tasks must not implement real video analysis unless explicitly requested.
- Every visual/edit decision should have a reason.
- Do not apply visual systems by category alone.
- Adaptive strategy must use both user intent and video understanding.
- Exact charts, maps, labels, screen captures, and data visuals should prefer controlled tools/Remotion instead of AI video.
- AI video should be reserved for organic or generative motion that actually improves the segment.
- The planner should explain why a segment uses still/card, b-roll, map, chart, screen capture, Stroke Motion, Real Motion, captions only, or no visual.
- ReeditPro should prefer controlled tools over AI generation when exact text, charts, maps, captions, layouts, screenshots, color/audio processing, or QA matters.
- Do not install tools unless the milestone explicitly asks for installation.
- Tool registry guides the AI but does not limit custom requests.
- Tool strategy must explain why a tool is chosen.
- License notes must be tracked before production use.
- Worker tools should not be bundled into frontend code without a specific milestone.
- Remotion is the compositor; tools can provide assets, data, screenshots, maps, charts, processing, or QA.
- Every visual asset should have a render strategy explaining whether Remotion alone is enough or whether GPT-Image-2, open-source tools, AI video assets, or future workers are needed.
- Do not use AI video for exact charts, captions, maps, cards, labels, screen captures, or diagrams when controlled tools or Remotion can do the job.
- Basic should prefer simpler Remotion-only, still/card, and controlled tool render strategies.
- Pro can use richer tool-based and AI-assisted render strategies, but still cannot use Veo.
- Premium can use advanced hybrid render strategies, but Veo remains final fallback only.
- Do not install render/tool packages unless the milestone explicitly asks for installation.
- Tool strategy must be segment- or asset-specific and explain why the selected tool chain is better than AI generation when exact output matters.
- Tool strategy settings should come from the settings catalog, not raw chat text alone.
- Provider models are not open-source tools.
- Tool usage UI must not imply that tools have been installed, executed, rendered, or run before approval.
- Basic/Pro no-Veo policy and Premium final-fallback-only Veo policy remain unchanged by tool strategy.
- Basic edits must include professional color correction; never describe Basic as ungraded or low quality.
- Color grading should be planned deterministically, not randomly generated.
- Remotion is not the full color grading engine; future FFmpeg/OpenColorIO/OpenImageIO/OpenCV/Sharp workers may execute color and color-QA tasks only after approval.
- Generated GPT-Image-2, Wan, Hailuo, and Veo assets should be planned to match the chosen color look and panel background.
- Color plans must preserve skin tones when people are visible.
- Documentary / Case Study color should avoid sensational overprocessing unless the user requests stylization.
- No real color processing unless a milestone explicitly requests it.
- Basic edits must include professional audio cleanup and loudness planning; never describe Basic audio as low quality.
- SoundSync is the audio/timing support engine, not a visual signature system.
- Do not add random SFX; SFX and music must support story, pacing, transition, reveal, or emotion.
- Music must not overpower voice, and ducking should be planned when music is present under speech.
- Audio planning should be deterministic and structured, not random.
- Future FFmpeg LGPL Configuration, AudioFlux, Signalsmith Stretch, librosa, whisper.cpp, and any future/evaluation Essentia or Rubber Band workers may execute audio analysis or processing only after approval.
- Launch audio analysis candidate is AudioFlux, not Essentia.
- Launch music stretch/pitch candidate is Signalsmith Stretch, not Rubber Band.
- Essentia and Rubber Band are not selected for launch unless a future legal/product review re-enables them.
- FFmpeg must be treated as LGPL-configuration-only until reviewed.
- VapourSynth is worker-only and plugins require separate review.
- Sharp + libvips needs dependency/security/LGPL review before production execution.
- AudioFlux and Signalsmith Stretch are worker-only candidates and must not be installed or executed in frontend milestones.
- No worker tool executes before approval, credit reservation, and future backend worker implementation.
- No real audio processing unless a milestone explicitly requests it.
- Audio plans must not enable Veo or change AI-video tier rules.
- Use controlled map tools for geographic/location visuals instead of AI video.
- Map visuals must be planned with layout, safe zones, label readability, and source certainty.
- Do not use AI video to invent exact maps, roads, labels, pins, or geography.
- Documentary/case-study location claims must be treated carefully; unverified locations should use safe wording and approximate visuals.
- Map behind subject/contact object is a depth-aware composition plan, not a map-generation task.
- Do not install or execute map tools unless the milestone explicitly asks for installation.
- Use controlled chart/diagram tools for exact data, labels, arrows, names, money amounts, dates, timelines, and process diagrams.
- Do not use AI video to invent exact charts, data, labels, numbers, accounts, arrows, timelines, or diagrams.
- Data/source certainty must be represented in chart and diagram plans; mock data must be clearly marked.
- Documentary/case-study data and claims must use safe wording when unverified.
- Chart/diagram visuals must preserve safe zones, label readability, and caption readability.
- Do not install or execute chart/dataviz tools unless the milestone explicitly asks for installation.
- Basic and Pro must never create allowed Veo prompts.
- Premium may create Veo prompts only as final fallback/rescue.
- Prompts must preserve matching panel background, safe-margin, and frame-panel instructions.
- Recurring characters must use a character reference pack when stills, keyframes, cards, or animation clips depend on consistent identity.
- GPT-Image-2 should create character anchors, cards, keyframes, start frames, and end frames from the approved character pack.
- Animation prompts should reference the character pack to preserve outfit, silhouette, expression range, style mode, and identity.
- Mention-only people should usually use neutral name cards, lineup cards, or character cards, not full animation.
- Real named people in Documentary / Case Study edits should default to neutral visual treatment unless verified and approved.
- Allegations must not be visually presented as proven facts.
- If claim status is unclear, ask a clarifying question when it changes the edit, or use neutral visuals.
- Workers should preserve character packs and fact-safety plans in approved snapshots.
- Any future planner, model-routing, prompt-builder, QA, or demo scenario changes must preserve the hard validation rules in `planner-regression-validation.md`.
- Basic/Pro no Veo is a blocking validation rule.
- Premium fallback-only Veo is a blocking validation rule.
- No primary/default Veo is a blocking validation rule.
- No default `1080P` generated route is a blocking validation rule.
- Matching panel background policy is a blocking validation rule for AI-video prompt planning.
- Approval before generation is a blocking validation rule.
- Validation utilities should be updated whenever new planner fields are added.
- Chat remains the primary editor; do not turn planning into a giant pre-chat form.
- Required user actions should be obvious and expanded until resolved.
- Advanced technical details should be collapsible and summarized before showing full detail.
- The plan and credit approval path must stay clear even when advanced planning cards are available.
- Developer-heavy cards should not overwhelm users in the guided chat flow.
- Any new planning card must define its priority: required_user_action, user_summary, advanced_plan_detail, safety_detail, or developer_detail.
- Uploaded order is source/story order context, not final edit order.
- Final edit order may differ only after ReeditPro shows the recommended edit structure in the plan.
- Source sequence confirmation must happen before approval in chat.
- Changing source order, clip role, clip notes, important/optional state, or clip list must reset plan approval and mock progress.
- Do not treat uploaded order as final edit order without showing the recommended edit structure first.
- Do not implement real upload, playback, thumbnails, transcoding, or media analysis in frontend mock tasks.
- Lyria Pro integration must remain behind backend/worker boundaries.
- Lyria adapter defaults to mock mode.
- Real Lyria calls must never run in the frontend.
- Never expose Lyria, Google, or service-role secrets to frontend code.
- Never expose Google/Lyria API keys to Vite/browser code.
- Lyria workers must enforce plan approval and credit reservation before generation.
- Worker skeletons are mock-only until explicit real integration is requested.
- Generated music starts as a project asset and must pass Music QA before preview/export use.
- Real generation requires edit plan approval and credit reservation.
- Lyria response parsing must handle text and audio parts in any order.
- Generated music must pass Music QA before use in render/export.
- Do not create real Supabase migrations until an explicit migration milestone.
- Draft SQL files must live in `database/migration-drafts/`.
- Do not create active Supabase migrations in `supabase/migrations/` for draft-review tasks.
- Do not run SQL.
- Do not connect Supabase.
- Approved snapshots are immutable.
- Normal users must not update or delete approved snapshots.
- Worker jobs must reference `approved_plan_snapshot_id`.
- Generation requests must reference `approved_plan_snapshot_id` when approved execution starts.
- Storage buckets are private by default.
- RLS must scope access by workspace/project membership.
- Service role is required for worker writes in future backend work.
- Worker/service writes must be backend/service-role only and audited in future.
- Normal users must not directly mutate worker/job/generation event tables.
- Source media, browser captures, QA artifacts, and generated assets are private by default.
- Browser capture artifacts require privacy and source authorization planning.
- Audit events should be append-only.
- Future credit ledger and reservation tables should be service-controlled and append-only.
- Do not store provider secrets in schema.
- Draft SQL is for review only.
- Future credit ledger and reservation records must be append-only.
- Users must not directly mutate approved snapshots, credit ledger records, or credit reservations.
- Source media and generated assets should be private by default.
- Future RLS must scope access to workspace/project membership.
- Schema planning must preserve Basic/Pro no-Veo and Premium fallback-only Veo through approved snapshot and tier constraints.
- Any future planning layer must connect to the approved snapshot policy.
- Any future execution layer must execute approved snapshots, not raw chat.
- Any future provider or tool execution must respect planner validation rules.
- Do not introduce new one-off planner fields without documenting which layer consumes them.
- Do not add UI cards that overwhelm Guided mode.
- Do not treat frontend mock previews as production rendering.
- Maintain separation between provider models, open-source tools, Remotion renderer, and worker runtime.

## Subscription And Credits

- Personal: `$10/week` software access.
- Personal includes 100 weekly bonus Reedit Credits.
- 100 credits = `$5` retail value.
- Business: `$20/week` software access.
- Business can buy as many credits as needed.
- Subscription is software access.
- Edit Credits pay for AI generation, rendering, and editing usage.

## Design Rules

- Follow the ReeditPro dark premium design system in `design.md`.
- Do not invent random styles, unrelated colors, generic SaaS layouts, or generic dashboard patterns.
- Use design tokens for colors, spacing, typography, radius, borders, shadows, and states.
- Keep the UI modular and ready for future backend/database integration.
- Preserve the official ReeditPro logo assets and brand direction.
- AI chat is the primary editor. The timeline is secondary. Advanced panels should be hidden by default unless the user explicitly opens them.
- The chat is the editor. The AI edits in the background. Inline cards appear only when the AI needs user input, confirmation, approval, or preview.

## Web First, Mobile Later

- Desktop/web product comes first.
- Do not build native mobile unless explicitly asked.
- Do not build mobile companion screens unless explicitly asked.
- Treat mobile as a future companion app, not the main product.

## Signature Systems

The three visual signature systems are:

1. Stroke Motion
2. Graphic Design / VisualExplain
3. Real Motion

SoundSync is not the third visual signature system. SoundSync is the audio and timing support engine.

StoryTiming coordinates captions, cuts, Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, and story beats.

## Dropdown Workflow Rule

The video type dropdown gives workflow context only. It does not automatically decide which signature systems are used.

All video types can use:

- Stroke Motion
- Graphic Design / VisualExplain
- Real Motion
- SoundSync
- None

The AI planner decides signature usage per segment based on user instructions, video type, edit level, uploaded clip order, transcript, visual footage, reference video style, platform, credit budget, and whether the visual actually improves the video.

## Uploaded Clip Order

Uploaded order means source sequence: the order the user filmed the clips or believes they belong. The AI should respect uploaded order as important context, but it is not automatically the final edit order.

The AI must show:

- Source Sequence Map
- Recommended Edit Structure

The final edit order should not be changed without showing the plan first.

## Reference Video

If the user provides a reference video, AI should study it but not copy it shot-for-shot.

Extract Reference DNA:

- Topic
- Opening style
- Pacing
- Music intro
- Beat changes
- Transition style
- Caption style
- Visual effect style
- Use of Stroke Motion
- Use of Graphic Design / VisualExplain
- Use of Real Motion-style overlays
- Mood and tone
- Why the reference edit works

## Supabase

- Future backend/database work must use the Supabase project named `reeditpro`.
- Do not connect, configure, migrate, or reference the Yuza Studio Supabase project for this repo.
- If Supabase credentials or project refs are introduced later, verify they belong to `reeditpro` before use.
- RP-DATA-04 active migration files under `supabase/migrations/` are for manual local/staging testing only until explicitly approved.
- Do not run Supabase migrations, SQL, or Supabase CLI commands from Codex unless a later task explicitly authorizes execution.
- Approved snapshots, audit events, and credit ledger records must remain protected from normal user mutation.
- Worker/service writes must stay backend/service-role controlled and audited in future implementation.
- Source media, browser captures, generated assets, QA artifacts, previews, and exports are private by default unless a later reviewed policy changes that.

## Local Development

- This repo uses Vite, React, and TypeScript for the current web prototype.
- On this Windows machine, use `npm.cmd` instead of `npm` in PowerShell.
- If npm registry certificate verification fails, run commands with `NODE_OPTIONS=--use-system-ca`.

## Do Not Implement Unless Asked

Do not implement these without explicit user request:

- Backend logic
- Database migrations
- Stripe integration
- AI API integration
- Video rendering
- Native mobile app
- Mobile companion app
- Unlimited AI editing assumptions
- Generation before approval
