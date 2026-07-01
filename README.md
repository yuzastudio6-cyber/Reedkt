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

## Launch Model And Frame Policy

ReeditPro's launch routing policy treats GPT-Image-2 as the primary image, still, keyframe, graphic, and frame model. Wan is the primary low-cost animation family, Hailuo is the normal fallback/alternate animation family, and Veo 3.1 Lite is Premium-only final fallback/rescue. Basic and Pro must never route to Veo, and Veo must never be the default primary model.

Generated AI video defaults to 720P-class output: Wan at 720P, Hailuo at 768P, and Veo at 720P when Premium final rescue is approved. ReeditPro should never default generated AI video to 1080P.

AI video generation should default to matching white, near-white, or custom frame panels inside the ReeditPro compositor. Transparent overlays remain a future/controlled renderer option for SVG, Lottie, Remotion, or other deterministic systems, not the default AI video route.

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
- `visual-storytelling-architecture.md`
- `model-routing-policy.md`
- `frame-layout-system.md`
- `remotion-renderer-plan.md`
- `professional-editing-ontology.md`
- `edit-quality-standards.md`
- `intent-compiler-architecture.md`
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

The connected planning foundation now includes chat-native planning, source sequence review, adaptive strategy, visual/story/tool/render planning, color/audio/map/dataviz/browser/depth/mask planning, launch tool stack alignment, worker-runtime architecture notes, production-readiness boundaries, validation, regression, and the planning system audit. See `connected-planning-system-overview.md` for the end-to-end map and `implementation-status-and-next-phase.md` for what remains frontend/mock versus future backend work.

The data preparation foundation now includes a Supabase schema planning bridge. It documents future tables, JSONB approved snapshot strategy, private storage buckets, and migration readiness checks without creating SQL migrations or connecting Supabase. See `supabase-schema-planning-bridge.md`, `supabase-table-specification.md`, and `database-migration-readiness-checklist.md`; the next data step is to convert the bridge into reviewed migrations in a dedicated migration milestone.

The backend readiness foundation now includes frontend-safe auth/bootstrap helpers, storage/upload planning helpers, an API boundary skeleton, credit gates, job runtime readiness, RP-FIX-11 mock runtime transport plus worker leases, and an RP-FIX-12 mock-only Node backend scaffold for a future Cloud Run API service. It remains mock/local only: no backend is deployed, no service-role handler exists, and provider, payment, worker, render, signed storage, lease mutation, and admin routes remain backend-required or disabled.

RP-DATA-02 adds review-only SQL migration drafts in `database/migration-drafts/`. These are not active Supabase migrations and should not be run or copied into `supabase/migrations/` until a future review/hardening step such as RP-DATA-03. See `sql-migration-draft-review.md`, `supabase-rls-policy-draft.md`, and `supabase-storage-bucket-draft.md`.

RP-DATA-03 adds a draft migration review and RLS hardening layer. Draft SQL remains `DO NOT RUN`; real migration execution, Supabase connection, and backend implementation are still future work. See `migration-review-and-rls-hardening.md`, `rls-hardening-matrix.md`, and `data-privacy-retention-plan.md`.

RP-DATA-04 adds active Supabase migration files in `supabase/migrations/` for manual local/staging testing only. Codex does not run them, connect Supabase, or implement backend behavior. Production remains blocked until manual tests, RLS/storage verification, Supabase advisor review, backups, and approval pass. See `supabase-production-test-readiness.md`, `supabase-local-staging-test-plan.md`, and `database/test-sql/`.

RP-TIMING-01 adds a mock Master Timing foundation for frame-accurate edit planning. Captions, visual cues, transitions, SFX, music ducking, provider clips, and Remotion layer timing now use a typed `MasterTimingPlan`; no real transcript alignment, beat detection, media processing, tools, provider calls, backend, or rendering are executed. See `master-timing-architecture.md`, `timing-settings-catalog.md`, and `timing-qa-policy.md`.

RP-TIMING-02 adds a mock Caption + Visual Cue Timing refinement layer. It plans readable caption chunks, caption animation policy, visual cue triggers, read-time holds, and caption/visual collision recommendations from the Master Timing Plan. It is still mock-only: no real transcript alignment, speech-to-text, beat detection, media processing, provider calls, backend, or rendering are executed. See `caption-visual-cue-timing.md`, `caption-readability-motion-policy.md`, and `visual-cue-synchronization-policy.md`.

RP-TIMING-03 adds a mock SoundSync + Transition Timing refinement layer. It plans beat grids, music phrase sections, speech-safe beat snap decisions, refined transitions, cue-linked SFX, and voice-first ducking from the Master Timing and Caption + Visual Cue Timing plans. AudioFlux is represented as a future analysis worker only; no real audio/media analysis, SFX generation, provider calls, backend, Supabase, or rendering are executed. See `soundsync-beat-grid-transition-timing.md`, `transition-timing-policy.md`, and `sfx-ducking-timing-policy.md`.

RP-TIMING-04 adds mock Timing Validation + Credit Impact. It validates Master Timing, Caption + Visual Cue Timing, and SoundSync + Transition Timing before approval, blocks approval for failed/blocking timing, and explains timing complexity in Reedit Credits with lower-cost alternatives. No real timing/audio/transcript/media analysis, tool execution, backend, provider calls, rendering, billing, or credit deduction is executed. See `timing-validation-policy.md`, `timing-complexity-credit-policy.md`, and `timing-approval-gate-policy.md`.

RP-RESERVATION-01 adds the mock-safe max estimate credit reservation layer for the external-beta credit foundation. It reserves `maximumEstimatedCredits` / `requiredHoldCredits`, not `totalEstimatedCredits`, in local in-memory wallet/reservation state only. See `docs/credit-reservation-max-estimate.md` and `smoke:credit-reservation`; boundaries remain no live billing, no Stripe/payment, no Supabase write, no provider call, no production wallet or ledger mutation, no render/export, and no checkout/top-up.

RP-RUNTIME-GUARD-01 adds the mock-safe runtime credit guard before paid worker/provider/render starts. The guard requires approved plan, approved estimate, `reserved` max-hold reservation, idempotency, and projection fit; projected overage pauses with "Action required: revised credit estimate needed" and records only a mock revision action. See `docs/runtime-credit-guard.md` and `smoke:runtime-credit-guard`; boundaries remain no live billing, no provider call, no render/export execution, no settlement, no reservation spend/release/refund, and `serviceFeeIncluded = false` for tool-cost events.

RP-CREDITREVISION-01 adds mock-safe resolution for those projected-overage pauses. Approve & Continue reserves only the additional mock max hold as `revised_credit_additional_hold`, while Choose Lower-Cost Option and Cancel Extra Work do not reserve credits or resume paid work. See `docs/credit-revision-action-resolution.md` and `smoke:credit-revision-action`; boundaries remain no live billing, no Stripe/payment, no Supabase write, no provider call, no render/export, no settlement, no spend/release/refund, no checkout/top-up, and no export unlock.

RP-SETTLEMENT-01 adds mock-safe final credit settlement for completed edits. It charges actual billable tool cost plus the separate ReEditPro service/edit fee, releases unused mock hold, records absorbed overage, and keeps approved-but-unfunded export top-up informational. See `docs/credit-settlement-finalization.md` and `smoke:credit-settlement`; boundaries remain no live billing, no Stripe/payment, no Supabase write, no provider call, no production wallet or ledger mutation, no render/export, no checkout/top-up, and no export unlock.

RP-EXPORTLOCK-01 adds the mock-safe export credit gate for settled edits. Export is allowed for `settled` and `settled_with_absorbed_overage`, while `requires_top_up_before_export` returns "Action required: add credits to export" and creates only a local mock lock record. See `docs/credit-export-lock.md` and `smoke:credit-export-lock`; boundaries remain no live billing, no Stripe/payment, no checkout/top-up, no Supabase write, no provider call, no production wallet or ledger mutation, no render/export execution, and no export unlock.
