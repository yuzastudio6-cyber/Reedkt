# ReeditPro Agent Instructions

These instructions are for Codex and any future agent working in this repository.

## Required Reading

- Read `design.md` before any UI, layout, component, visual, brand, or frontend design work.
- Read `product-plan.md` before product-scope decisions.
- Read `intent-led-edit-planning.md` before upload, planning, AI workflow, generation, or approval work.
- Read `pricing-and-credits.md` before billing, credits, subscription, usage, or estimate work.
- Read `signature-systems.md` and `real-motion-system.md` before visual AI system work.
- Read `edit-workflow-blueprints.md` before changing video type dropdowns, workflow profiles, edit setup, or planning prompts.

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
