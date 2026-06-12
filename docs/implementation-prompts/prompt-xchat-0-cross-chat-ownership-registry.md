# PROMPT XCHAT-0 - ReEditPro Cross-Chat Ownership and Integration Registry

Repository: `yuzastudio6-cyber/Reedkt`

Branch: `codex/rp-foundation-xchat-0-cross-chat-ownership-registry`

PR title: `[foundation] XCHAT-0 cross-chat ownership registry`

Status: `implemented_in_pr`.

Production capability enabled: none; cross-chat coordination registry only.

Supabase update required: docs/status only.

Supabase update status: `docs_only`.

## Goal

Create the ReEditPro Cross-Chat Ownership and Integration Registry.

ReEditPro is being built across multiple ChatGPT/Codex workstreams. Different chats own different parts of the system. To avoid duplicate work, overlapping ownership, incompatible contracts, and disconnected implementation, the repo needs a shared source-of-truth system that every chat and every Codex prompt can read before doing work.

This prompt creates the cross-chat coordination layer only. It must not implement runtime features, change production behavior, run Supabase, run SQL, deploy, execute tools, execute workers, call providers, render media, mutate credits, use Stripe, or unlock beta/production.

## Current Known Workstreams

1. AI Tools / Creative Graphics / Motion Design.
2. Map / Geospatial / Location Animation.
3. Track A Render / Preview / Export / Final Composition.
4. Track B Media / Image / Audio / Video Processing.
5. Supabase / RLS / Storage / Database / Staging Validation.
6. Provider Gateway / Model Routing / Secret Boundary.
7. Worker Runtime / Jobs / Claims / Leases.
8. Compliance / Security / License / Dependency Review.
9. Observability / Audit / Abuse Prevention / Cost Controls.
10. Product / UX / Frontend / User Flows.
11. Billing / Stripe / Credit Purchase Flow.
12. E2E Beta Readiness / Deployment.

## This Chat Owns

AI Tools / Creative Graphics / Motion Design.

Owned tools:

- Remotion
- D3.js
- Three.js
- PixiJS
- Anime.js
- Lottie-web
- SVG.js
- Apache ECharts
- Vega / Vega-Lite
- Viz.js / Graphviz
- Satori
- `@resvg/resvg-js`

Owned design capabilities:

- motion graphics
- animated overlays
- title cards
- lower thirds
- infographics
- charts
- diagrams
- SVG graphics
- brand-style visual cards
- animated callouts
- timeline graphics
- data visualization
- UI-style animations
- 3D visual elements
- canvas effects
- Lottie overlays
- graph/network diagrams
- render-ready graphic assets
- transparent overlays
- social video graphics

## Explicit Boundaries

- Map/geospatial tools are owned by another chat.
- Track A owns final render/export validation.
- Track B owns general image/audio/video processing and Sharp/libvips-style processing.
- Supabase workstream owns database/RLS/storage policy/staging validation.
- Provider workstream owns provider execution/fallback/model routing.
- Worker runtime workstream owns real worker execution.
- This prompt must not move ownership from one workstream to another.

## Required Files

Create:

- `docs/cross-chat/README.md`
- `docs/cross-chat/chat-ownership-registry.md`
- `docs/cross-chat/workstream-status-ledger.md`
- `docs/cross-chat/integration-boundary-map.md`
- `docs/cross-chat/capability-handoff-contract.md`
- `docs/cross-chat/duplicate-work-prevention-policy.md`
- `docs/cross-chat/prompt-start-checklist.md`
- `docs/cross-chat/prompt-final-response-standard.md`
- `docs/cross-chat/open-dependencies-and-blockers.md`
- `docs/cross-chat/reeditpro-end-to-end-system-map.md`
- `docs/cross-chat/ai-tools-creative-graphics-ownership.md`
- `docs/cross-chat/map-stack-boundary-note.md`
- `scripts/validation/cross-chat-coordination-diagnostics.mjs`

Update:

- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/implementation-prompts/README.md`
- `docs/beta-readiness-scorecard.md`
- `docs/production-beta-blocker-inventory.md`
- `package.json`

## Diagnostics Contract

`scripts/validation/cross-chat-coordination-diagnostics.mjs` must use Node built-ins only and must not connect to Supabase, run SQL, call Google Cloud, call providers, render, execute tools, execute workers, deploy, or mutate dependencies.

It scans for required cross-chat docs, required workstream IDs, AI Tools ownership, map boundary, missing package script, ownership conflicts, production/beta unlock claims, and forbidden runtime scope.

Package script:

```json
"cross-chat:diagnostics": "node scripts/validation/cross-chat-coordination-diagnostics.mjs"
```

## Validation Commands

```sh
git diff --check
npm ci
npm run lint
npm run typecheck:server
npm run foundation:validate
npm run --silent cross-chat:diagnostics
npm run build
npm run build:server
npm run foundation:validate:with-build
```

If local build remains blocked by a known Darwin Rolldown issue, classify it accurately and rely on GitHub CI.

## Final Response Requirements

The final response must include branch name, PR link, files changed, ownership registry created, AI Tools ownership recorded, map boundary recorded, prompt start checklist created, final response standard created, diagnostics added/run, validation run, production capability enabled, Supabase update required/status, cross-chat impact, affected workstreams, handoff needed, exact no-scope statement, blockers, and recommended next prompt.

Recommended next prompt: Prompt GD-0 - AI Tools / Graphic Design Stack Repo Audit, or the next Supabase hardening prompt if Supabase evidence remains the priority.

## Exact No-Scope Statement

No runtime implementation, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, render/export execution, tool execution, worker execution, media processing, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, production/beta unlock, dependency mutation, human approval grant, staging execution approval, or broad service-role handler was enabled.
