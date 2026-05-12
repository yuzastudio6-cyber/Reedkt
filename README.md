# ReeditPro

ReeditPro is a web-first AI video editing platform. It is not a generic video editor. The product is built around an intent-led editing flow where the user uploads clips, explains the goal, optionally provides a reference video, receives an AI edit plan, reviews a credit estimate, approves the plan, and only then does generation or editing begin.

The desktop/web product comes first. A mobile app may exist later as a limited companion for upload, review, approval, comments, export monitoring, and lightweight status checks. Native mobile editing is not part of the current foundation.

## Core Product Rule

ReeditPro should never start expensive AI editing, rendering, or generation until it understands the user's goal and the user approves the edit plan and credit estimate.

This rule applies to all future AI, rendering, backend, billing, and UI work.

## Visual Signature Systems

ReeditPro has three visual signature systems:

1. **Stroke Motion**: 2D overlay motion storytelling used for emotion, story, emphasis, transformation, and speaker-aligned visual motion.
2. **Graphic Design / VisualExplain**: clean graphic overlays used for education, concepts, diagrams, lists, frameworks, product features, and visual understanding.
3. **Real Motion**: realistic animated overlay objects or scenes inside the user's video, used for real objects, products, places, proof, demonstrations, or symbolic visual moments.

SoundSync is important, but it is not the third visual signature system. SoundSync is the audio and timing support engine for music, SFX, beat timing, mood, ducking, transition sounds, and emotional polish.

StoryTiming coordinates captions, cuts, Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, and story beats.

## Subscription And Credit Model

Subscriptions provide software access. Reedit Credits pay for AI generation, rendering, and editing usage.

- **Personal**: `$10/week` software access.
- Personal includes **100 weekly bonus Reedit Credits**.
- **100 credits = `$5` retail credit value**.
- Personal users can buy more credits.
- **Business**: `$20/week` software access.
- Business includes stronger workflow, brand, team, and client tools.
- Business users can buy as many credits as needed.
- Business credits are treated as production/business usage.

The `$10/week` and `$20/week` subscriptions must never be described as unlimited AI editing.

## Planning Documents

Core product foundation docs live in the repo root:

- `product-plan.md`
- `signature-systems.md`
- `real-motion-system.md`
- `intent-led-edit-planning.md`
- `edit-workflow-blueprints.md`
- `pricing-and-credits.md`
- `web-first-roadmap.md`
- `AGENTS.md`
- `design.md`

Before UI work, read `design.md`. Before product, AI, billing, planning, or workflow work, read the relevant foundation docs above.

## Current Repo Status

This repo currently contains an early web prototype plus product foundation documentation. The documentation is intended to guide future implementation. The foundation docs do not implement backend logic, database migrations, Stripe, AI APIs, video rendering, or mobile app behavior.

Future implementation should stay modular so upload, intent analysis, reference DNA, edit planning, credit estimation, approval gates, rendering jobs, billing, and review workflows can be added safely.
