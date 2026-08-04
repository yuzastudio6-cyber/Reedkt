# ReeditPro

ReeditPro is a web-first AI video editing platform. It is not a generic video editor. The product is built around an intent-led editing flow where the user uploads clips, explains the goal, optionally provides a reference video, receives an AI edit plan, reviews a credit estimate, approves the plan, and only then does generation or editing begin.

The desktop/web product comes first. A mobile app may exist later as a limited companion for upload, review, approval, comments, export monitoring, and lightweight status checks. Native mobile editing is not part of the current foundation.

## Core Product Rule

ReeditPro should never start expensive AI editing, rendering, or generation until it understands the user's goal and the user approves the edit plan and credit estimate.

This rule applies to all future AI, rendering, backend, billing, and UI work.

## Current Active Product Surface

The current branch uses a project-first desktop flow:

```text
Landing / Sign in
→ Home / Projects
→ Create or reopen a project
→ Create or reopen a named edit
→ Upload source video inside the edit
→ Prepare footage and guide ReeditPro through chat
→ Optionally complete the inline Edit Brief
→ Review the plan and credit estimate
→ Approve
→ Review the private result or request changes
```

The active app navigation is **Home**, **Projects**, and **Preferences**. Historical Wallet, Pricing, Brand Kit, Export Queue, Media Library, Templates, Team, and Analytics pages are not current standalone product surfaces. See `docs/current-product-scope.md`, `docs/current-route-navigation-map.md`, and `docs/ui-ux-active-product-redesign-plan.md` before changing whole-product UI/UX.

## Private Local Workspace

For a guarded one-command browser and API test workspace, run:

```bash
npm run dev:private-workspace
```

Open the printed sign-in URL and choose **Enter test workspace**. The launcher binds both services to loopback, uses isolated local private storage, and keeps Supabase, external providers, billing, and public delivery disabled. It is local/private evidence only, not staging or production. See `docs/private-workspace-manual-testing.md`.

## Visual Signature Systems

ReeditPro has three visual signature systems:

1. **Stroke Motion**: 2D overlay motion storytelling used for emotion, story, emphasis, transformation, and speaker-aligned visual motion.
2. **Graphic Design / VisualExplain**: clean graphic overlays used for education, concepts, diagrams, lists, frameworks, product features, and visual understanding.
3. **Real Motion**: realistic animated overlay objects or scenes inside the user's video, used for real objects, products, places, proof, demonstrations, or symbolic visual moments.

SoundSync is important, but it is not the third visual signature system. SoundSync is the audio and timing support engine for music, SFX, beat timing, mood, ducking, transition sounds, and emotional polish.

StoryTiming coordinates captions, cuts, Stroke Motion, Graphic Design / VisualExplain, Real Motion, SoundSync, and story beats.

## Launch Model And Frame Policy

ReeditPro's launch routing policy treats GPT-Image-2 as the primary image, still, keyframe, graphic, and frame model. Wan is the primary low-cost animation family, Hailuo is the normal fallback/alternate animation family, and Veo 3.1 Lite is Premium-only final fallback/rescue. Basic and Pro must never route to Veo, and Veo must never be the default primary model.

Generated AI video defaults to 720P-class output: Wan at 720P, Hailuo at 768P, and Veo at 720P when Premium final rescue is approved. ReeditPro should never default generated AI video to 1080P.

AI video generation should default to matching white, near-white, or custom frame panels inside the ReeditPro compositor. Transparent overlays remain a future/controlled renderer option for SVG, Lottie, Remotion, or other deterministic systems, not the default AI video route.

## Subscription And Credit Model

Subscriptions provide software access. Reedit Credits pay for AI generation, rendering, and editing usage.

- **Personal**: `$10/week` software access.
- Personal includes **100 weekly bonus Reedit Credits**.
- **1 credit = `$0.10`; 100 credits = `$10` retail credit value**.
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
- `visual-storytelling-architecture.md`
- `model-routing-policy.md`
- `frame-layout-system.md`
- `remotion-renderer-plan.md`
- `professional-editing-ontology.md`
- `edit-quality-standards.md`
- `intent-compiler-architecture.md`
- `intent-led-edit-planning.md`
- `docs/edit-level-product-contract-audit.md`
- `docs/edit-level-existing-surface-audit.md`
- `docs/edit-level-product-contract.md`
- `docs/edit-level-profile-architecture.md`
- `docs/edit-level-legacy-alias-compatibility.md`
- `docs/reeditpro-production-workflow/README.md`
- `edit-workflow-blueprints.md`
- `pricing-and-credits.md`
- `docs/credit-policy.md`
- `docs/edit-level-credit-policy.md`
- `docs/edit-credit-estimate-preview.md`
- `web-first-roadmap.md`
- `AGENTS.md`
- `design.md`

Before UI work, read `design.md`. Before product, AI, billing, planning, or workflow work, read the relevant foundation docs above.

## Current Repo Status

RP-MERGE-AUDIT-00 adds a read-only repository merge integrity audit for the local path split between `/Volumes/backup/REeditpro` and `/Users/macuser/Developer/REeditpro`. Current status is `path_divergence_risk`: the paths are separate checkouts/copies with different branches, HEADs, migration counts, dirty counts, and milestone file presence. See `docs/repo-merge-integrity-audit.md`, `docs/repo-path-divergence-audit.md`, and `docs/repo-next-safe-staging-plan.md`; do not stage more implementation work until the owner confirms the source-of-truth path.

This repo currently contains an early web prototype plus product foundation documentation. The documentation is intended to guide future implementation. The foundation docs do not implement backend logic, database migrations, Stripe, AI APIs, video rendering, or mobile app behavior.

Future implementation should stay modular so upload, intent analysis, reference DNA, edit planning, credit estimation, approval gates, rendering jobs, billing, and review workflows can be added safely.

The connected planning foundation now includes chat-native planning, source sequence review, adaptive strategy, visual/story/tool/render planning, color/audio/map/dataviz/browser/depth/mask planning, launch tool stack alignment, worker-runtime architecture notes, production-readiness boundaries, validation, regression, and the planning system audit. See `connected-planning-system-overview.md` for the end-to-end map and `implementation-status-and-next-phase.md` for what remains frontend/mock versus future backend work.

The data preparation foundation now includes a Supabase schema planning bridge. It documents future tables, JSONB approved snapshot strategy, private storage buckets, and migration readiness checks without creating SQL migrations or connecting Supabase. See `supabase-schema-planning-bridge.md`, `supabase-table-specification.md`, and `database-migration-readiness-checklist.md`; the next data step is to convert the bridge into reviewed migrations in a dedicated migration milestone.

The backend readiness foundation now includes frontend-safe auth/bootstrap helpers, storage/upload planning helpers, an API boundary skeleton, credit gates, job runtime readiness, RP-FIX-11 local runtime transport plus worker leases, and an RP-FIX-12 Node backend scaffold for a Cloud Run API service. The default local path remains non-production, while backend deployment, service-role handlers, provider/payment routes, worker/render dispatch, signed storage, lease mutation, and admin routes can only graduate through approved backend evidence gates.

RP-DATA-02 adds review-only SQL migration drafts in `database/migration-drafts/`. These are not active Supabase migrations and should not be run or copied into `supabase/migrations/` until a future review/hardening step such as RP-DATA-03. See `sql-migration-draft-review.md`, `supabase-rls-policy-draft.md`, and `supabase-storage-bucket-draft.md`.

RP-DATA-03 adds a draft migration review and RLS hardening layer. Draft SQL remains `DO NOT RUN`; real migration execution, Supabase connection, and backend implementation are still future work. See `migration-review-and-rls-hardening.md`, `rls-hardening-matrix.md`, and `data-privacy-retention-plan.md`.

RP-DATA-04 adds active Supabase migration files in `supabase/migrations/` for manual local/staging testing only. Codex does not run them, connect Supabase, or implement backend behavior. Production remains blocked until manual tests, RLS/storage verification, Supabase advisor review, backups, and approval pass. See `supabase-production-test-readiness.md`, `supabase-local-staging-test-plan.md`, and `database/test-sql/`.

RP-TIMING-01 adds a mock Master Timing foundation for frame-accurate edit planning. Captions, visual cues, transitions, SFX, music ducking, provider clips, and Remotion layer timing now use a typed `MasterTimingPlan`; no real transcript alignment, beat detection, media processing, tools, provider calls, backend, or rendering are executed. See `master-timing-architecture.md`, `timing-settings-catalog.md`, and `timing-qa-policy.md`.

RP-TIMING-02 adds a mock Caption + Visual Cue Timing refinement layer. It plans readable caption chunks, caption animation policy, visual cue triggers, read-time holds, and caption/visual collision recommendations from the Master Timing Plan. It is still mock-only: no real transcript alignment, speech-to-text, beat detection, media processing, provider calls, backend, or rendering are executed. See `caption-visual-cue-timing.md`, `caption-readability-motion-policy.md`, and `visual-cue-synchronization-policy.md`.

RP-TIMING-03 adds a mock SoundSync + Transition Timing refinement layer. It plans beat grids, music phrase sections, speech-safe beat snap decisions, refined transitions, cue-linked SFX, and voice-first ducking from the Master Timing and Caption + Visual Cue Timing plans. AudioFlux is represented as a future analysis worker only; no real audio/media analysis, SFX generation, provider calls, backend, Supabase, or rendering are executed. See `soundsync-beat-grid-transition-timing.md`, `transition-timing-policy.md`, and `sfx-ducking-timing-policy.md`.

RP-TIMING-04 adds mock Timing Validation + Credit Impact. It validates Master Timing, Caption + Visual Cue Timing, and SoundSync + Transition Timing before approval, blocks approval for failed/blocking timing, and explains timing complexity in Reedit Credits with lower-cost alternatives. No real timing/audio/transcript/media analysis, tool execution, backend, provider calls, rendering, billing, or credit deduction is executed. See `timing-validation-policy.md`, `timing-complexity-credit-policy.md`, and `timing-approval-gate-policy.md`.

RP-EDITLEVEL-00 adds a report-only Edit Level surface audit. It documents the current `basic | pro | premium` runtime surface, the future Normal/Premium/Ultra Premium beta product contract, tool routing, Qwen 3.7 and Qwen2.5-VL planning roles, Edit Brief and Edit Preference/DNA integration gaps, QA, credit estimate, render budget, reuse vs new build decisions, blockers, and the RP-EDITLEVEL roadmap. It does not change runtime behavior, call models/providers, process media, render/export, run migrations, or reserve/spend credits.

RP-EDITLEVEL-01 adds the architecture source of truth for the future Normal/Premium/Ultra Premium Edit Level system. It documents the product contract, future `EditLevelProfile`, legacy basic/pro/premium compatibility, level-aware tool and Qwen routing, source understanding, Edit Brief, Edit Preference/DNA, QA profile, credit estimate only and render budget future metadata, fallback policy, UI recommendation architecture, backend service architecture, integration map, and RP-EDITLEVEL-02 next types/fixtures plan. It remains docs/status/smoke only.

RP-EDITLEVEL-02 adds a mock-safe typed foundation for the future Edit Level system. It defines canonical Normal/Premium/Ultra Premium profile types, legacy basic/pro/premium compatibility mappers, deterministic mock profiles, summary/recommendation fixtures, request/response-only backend contracts, mock scenarios, an orchestrator, and `smoke:edit-level-types`. It does not wire the profiles into runtime planners, UI, routes, repositories, migrations, providers, media workers, render/export, progress, or credit spend.

RP-EDITLEVEL-03 adds the mock-only Edit Level repository plus API/client boundary. It extends MockDatabase with local edit-level profile, selection, recommendation, readiness, and application-log collections; adds a disabled Supabase repository skeleton; registers mock local planning-domain API route metadata/handlers; adds a browser-safe client wrapper; and exposes `smoke:edit-level-repository`, `smoke:edit-level-api-routes`, and `smoke:edit-level-api-client`. It still does not change runtime `basic | pro | premium` behavior, visible UI, planners, production routes, migrations, Supabase, providers, media workers, render/export, progress, or credit spend. RP-EDITLEVEL-04 UI Cards + Recommendation is the next edit-level prompt.

RP-EDITLEVEL-04 adds visible mock/local Edit Level UI cards and recommendation behavior. `/projects/new`, the existing editor setup card, and planning context can show Normal/Premium/Ultra Premium cards, recommendation reasons, selected state, estimate-only copy, and boundary notices. Edit Brief surfaces stay focused on optional user direction. It preserves the current runtime `basic | pro | premium` values, does not modify `ChatNativeEditor` runtime behavior, and does not change live planner/tool routing, providers, workers, render/export, progress, migrations, Supabase, or credit spend.

RP-EDITLEVEL-05 adds a mock/local Level-Aware Tool Capability Router. It resolves required, recommended, optional, future-gated, degraded, and fallback capability packages for Normal, Premium, and Ultra Premium, and shows capability summaries in available Edit Level UI surfaces. It does not execute tools, call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers, media workers, render/export, Supabase, progress, or credits. RP-EDITLEVEL-06 Level-Aware Source Video Understanding Routing is the next edit-level prompt.

RP-EDITLEVEL-06 adds mock/local Level-Aware Source Video Understanding Routing. It resolves metadata/targeted, key-moment/marker-window, and scene-level source context packages for Normal, Premium, and Ultra Premium, plus marker context windows, future Qwen context policy, fallbacks, visible source-depth summaries, docs, smoke coverage, and focused Playwright coverage. It does not run Qwen 3.7, Qwen2.5-VL, DeepSeek, providers, transcript/media/audio/graphic workers, ffmpeg/ffprobe, render/export, Supabase, progress, uploads, external fetches, file-byte reads, or credits.

RP-EDITLEVEL-07 adds mock/local Level-Aware Qwen Planning Profile policy. It maps Normal, Premium, and Ultra Premium to future Qwen 3.7 reasoning depth, planning pass policy, prompt context policy, structured output hints, Marker Chat behavior, Preference DNA usage, QA explanation depth, fallback policy, visible Qwen planning summaries, docs, smoke coverage, and focused Playwright coverage. It does not call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers, planners, media tools, workers, render/export, Supabase, uploads, external fetches, file-byte reads, or credits.

RP-EDITLEVEL-08 adds mock/local Level-Aware QA Gates. It maps Normal, Premium, and Ultra Premium to deterministic baseline, stronger creative, and studio-level strict QA packages, readiness states, gate groups, fallback notices, visible QA summaries, docs, smoke coverage, and focused Playwright coverage. It does not execute QA tools, call Qwen 3.7, Qwen2.5-VL, DeepSeek, providers, planners, media workers, render/export, Supabase, uploads, external fetches, file-byte reads, or credits. RP-EDITLEVEL-09 completed the estimate-policy follow-up.

RP-EDITLEVEL-09 adds mock/local Level-Aware Estimates. It maps Normal, Premium, and Ultra Premium to deterministic time ranges, multiplier-only credit estimates, analysis depth, future render/revision/variant budgets, degraded capability notices, visible estimate UI, docs, smoke coverage, and focused Playwright coverage. It does not reserve credits, spend credits, create credit records, start progress, run planners, call providers/models, process media, create workers, render/export, run Supabase, add migrations, read uploaded file bytes, or fetch external URLs. RP-EDITLEVEL-10 End-to-End Internal Testing + Playwright Coverage is the next edit-level prompt.

RP-CREDITPOLICY-01 locks the external-beta credit policy as policy/types/docs/constants only: 1 credit = $0.10, 100 credits = $10, product edit-level service fees are added on top of actual billable tool cost, tool-owner cost events keep `serviceFeeIncluded = false`, and no-silent-recovery billing rules require a revised estimate before extra paid work. It adds no live billing, no Stripe, no Supabase migration, no wallet mutation, no provider/model calls, no render/export charging, and no production settlement.

RP-CREDITDATA-01 adds the mock-safe credit settlement data foundation: `CreditSettlementRecord`, `CreditRevisionActionRecord`, `EditCreditCostSummary`, read-only settlement preview contracts, mock in-memory idempotency, validation, mock-only routes, and `smoke:credit-data`. It has no live billing, no Stripe, no Supabase migration, no wallet mutation, no reservation spend/release/refund, no ledger write, no provider call, no render/export execution, and no export unlock.

RP-RATECARD-01 hardens the mock-safe rate card and cost math layer: integer micros/cents/credits, explicit placeholder provider/runtime/deterministic rates, pricing snapshots with `serviceFeeIncluded = false`, actual internal tool cost events, non-billable absorbed-cost summaries, and `smoke:rate-card` plus the `smoke:tool-cost-metering` alias. It keeps ReEditPro service fee in settlement preview only and adds no live billing, Stripe, provider calls, Supabase migration, wallet mutation, reservation spend/release/refund, ledger write, render/export execution, or export unlock.

RP-TOOLCOST-01 wires the 49-tool production registry to the mock-safe rate card through derived owner coverage, estimate/event adapters, and mock boundary metadata for provider/render/worker placeholders. It adds `smoke:production-tool-cost` and still adds no live billing, provider call, Supabase migration, wallet mutation, reservation spend/release/refund, ledger write, settlement execution, render/export execution, staging, or package-lock change.

RP-ESTIMATE-01 adds the mock-safe edit credit estimate preview layer: it aggregates RP-TOOLCOST-01 production tool estimates, applies Normal/Premium/Ultra Premium service-fee policy separately, emits user-facing estimate records/line items, supports idempotent mock preview routes, and adds `smoke:credit-estimate`. It still adds no reservation, wallet mutation, ledger write, provider call, worker, render/export, Stripe checkout, Supabase migration, staging, or package-lock change.
