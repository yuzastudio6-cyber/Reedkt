# ReeditPro Product Plan

## Product Vision

ReeditPro is a web-first AI video editing platform that turns user intent into an approved edit plan before generation begins. The user uploads clips, explains the goal, optionally shares a reference video, reviews the AI's recommended edit plan and credit estimate, then approves generation.

ReeditPro is not a generic video editor. It is an AI-first editing system built around story understanding, visual routing, credit-aware generation, and approval-before-editing.

## Core Rule

ReeditPro should never start expensive AI editing, rendering, or generation until it understands the user's goal and the user approves the edit plan and credit estimate.

## Product Direction

- Web and desktop come first.
- Mobile is future only and should be treated as a companion app later.
- The speaker or user footage remains the base layer unless the edit plan explicitly proposes otherwise.
- AI plans first, estimates credits second, and generates only after approval.
- Uploaded clip order is source-sequence context, not guaranteed final edit order.
- Reference videos provide Reference DNA, not shot-for-shot copy instructions.

## Subscription Plans

### Personal

- `$10/week` software access.
- Includes 100 weekly bonus Reedit Credits.
- 100 credits = `$5` retail credit value.
- User can buy more credits.
- Intended for solo creators and personal content workflows.

### Business

- `$20/week` software access.
- Stronger workflow, brand, team, and client tools.
- Can buy as many credits as needed.
- Business credits are treated as production/business usage.
- Intended for brands, agencies, teams, client work, and recurring production.

## Credit Model

Subscription is software access. Edit Credits pay for AI generation, rendering, and editing usage.

Credits should be estimated before generation and deducted only after approval. The UI must not imply unlimited AI editing for either subscription plan.

Real Motion is premium and credit-heavy because it requires stronger visual analysis, object planning, overlay placement, animation generation, and review safety.

## MVP Scope

The first meaningful product version should prove:

- Upload clips in source order.
- Capture video type, edit level, mood/style, optional reference video, and custom instructions.
- Analyze transcript, speech, visuals, and reference DNA.
- Create a Source Sequence Map.
- Create a Recommended Edit Structure.
- Route Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, or none per segment.
- Show edit plan and credit estimate.
- Let the user approve or request changes before generation.

## Not Being Built Yet

- Native mobile app.
- Mobile companion screens.
- Backend/database implementation.
- Stripe integration.
- AI API integration.
- Video rendering pipeline.
- Database migrations.
- Production credit ledger.
- Real generation or export processing.

## Future Phases

1. Product foundation docs.
2. Marketing website.
3. Desktop web app shell.
4. Upload and edit setup flow.
5. Intent-led AI planning.
6. Credit estimate and approval gate.
7. Backend/database.
8. AI/video generation integration.
9. Mobile companion later.
