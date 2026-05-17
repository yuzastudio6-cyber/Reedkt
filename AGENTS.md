# ReeditPro Agent Instructions

These instructions are for Codex and any future agent working in this repository.

## Required Reading

- Read `design.md` before any UI, layout, component, visual, brand, or frontend design work.
- Read `product-plan.md` before product-scope decisions.
- Read `intent-led-edit-planning.md` before upload, planning, AI workflow, generation, or approval work.
- Read `reference-video-dna-ux.md` before reference video, style matching, Reference DNA, or reference-analysis UX work.
- Read `pricing-and-credits.md` before billing, credits, subscription, usage, or estimate work.
- Read `signature-systems.md` and `real-motion-system.md` before visual AI system work.
- Read `edit-workflow-blueprints.md` before changing video type dropdowns, workflow profiles, edit setup, or planning prompts.
- Read `soundsync-music-intelligence.md`, `music-reference-dna.md`, `lyria-music-generation-plan.md`, and `audio-library-and-licensing.md` before SoundSync music, generated music, reference audio, SFX, audio library, or Lyria Pro planning work.

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

## SoundSync Music Intelligence

- SoundSync Music Intelligence plans music before generation. ReeditPro must not generate or pick random background music.
- Lyria Pro is the future primary custom music generator, but do not add API keys, Google calls, real workers, or integration unless explicitly requested.
- Music may be generated on the fly per edit, but only after context analysis, cue planning, credit estimate, approval, and future credit reservation.
- Lifestyle, vacation, travel, vlog, documentary, and long-form videos may need multiple music cues instead of one track.
- Language/culture-aware music is allowed when supported by footage, transcript, audience, user request, or reference DNA. Avoid stereotypes and never copy reference tracks, melodies, or lyrics.
- Lyrics are not allowed under important speech by default. Use instrumental-only music for dialogue, teaching, narration, podcast, or speech-heavy sections unless the user explicitly approves otherwise.
- Generated music should be stored as project assets first. Promote tracks to a future ReeditPro library only after QA, provenance, provider-terms, and reuse review.
- Music generation remains approval-gated and credit-gated like other expensive generation.

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

Reference video analysis must create Reference DNA, not shot-for-shot copying. Reference DNA guides planning but does not override explicit user instructions, source order confirmation, platform/frame constraints, tier/model rules, safety rules, QA rules, credit estimates, or approval gates.

Do not copy exact music, exact visual sequence, copyrighted assets, brand assets, or a creator's exact identity or protected distinctive style. Store adaptation rules and do-not-copy rules whenever Reference DNA is created.

Reference video must not bypass approval or credit estimate. Current frontend tasks must not implement real reference downloading, real reference analysis, external fetching, backend work, provider calls, render jobs, or copyright-detection systems unless explicitly requested.

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
