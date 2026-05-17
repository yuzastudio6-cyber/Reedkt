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
- Read `chat-planning-ux-architecture.md` before chat flow organization, planning card priority, collapse behavior, guided/detailed/developer modes, or approval-path UX work.
- Read `source-sequence-review-ux.md` before source order review, clip reorder UX, uploaded-order semantics, or source-sequence confirmation work.

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
- Do not imply subscription includes unlimited AI editing.
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
