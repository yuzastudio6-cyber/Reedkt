# Approved Plan Snapshot Policy

## Purpose

Raw chat is not enough for workers. ReeditPro is chat-native, but execution must use a structured, approved snapshot.

The approved snapshot is the frozen contract between the user, the planner, credit estimate, future workers, and QA.

## Approval Freezes The Plan

When a user approves the edit plan and credit estimate, ReeditPro should freeze an approved plan snapshot. Future workers execute that snapshot only.

The snapshot must include:

- compiled intent
- confirmed settings
- source order
- professional editing directive
- segment operations
- visual asset plan
- renderer plan
- QA plan
- provider routing
- editing agent async work graph
- asset manifest and dependency graph
- credit estimate
- approval record

Workers should not reinterpret raw chat messages. Workers should not change approved plan behavior unless the approved fallback policy allows it.

## Revision Policy

If the user changes important instructions after approval, ReeditPro should create a new plan version. The previous approved plan remains immutable except for status and audit fields.

Examples that should create a new version:

- changed edit level
- changed output ratio or frame template
- changed source order
- changed custom instructions
- changed reference video
- changed visual preference
- changed credit preference
- request to add/remove major visuals or Real Motion

## Credits And Approval

Credits are reserved or deducted only after approval according to future credit ledger policy. Subscription is software access; Reedit Credits pay for generation, rendering, and editing usage.

Failed ReeditPro generation should be refunded or restored according to future billing policy.

The approved snapshot must point to the exact credit estimate the user approved. If a revision changes estimated usage, ReeditPro must create a new estimate and ask for approval again.

## Tier And Model Policy In Snapshot

The approved snapshot must freeze model constraints:

- Basic cannot use Veo.
- Pro cannot use Veo.
- Premium may use Veo 3.1 Lite only as final fallback/rescue.
- Veo is never primary or default.
- Generated video routes must not default to 1080P.
- Wan remains primary animation generation.
- Hailuo remains normal fallback/alternate.

Workers cannot bypass these constraints during QA fallback.

## Frame Background Policy In Snapshot

The approved snapshot must freeze the frame/background policy:

- AI-video assets use matching white/near-white/custom panel backgrounds by default.
- Transparent AI-video backgrounds are not the default.
- The final canvas belongs to ReeditPro and the planned Remotion compositor.
- AI-generated clips live inside controlled frame/panel zones.

## Worker Rule

Workers execute approved snapshots, not raw chat. If the plan cannot be completed inside the approved route, fallback allowance, credit estimate, or tier policy, the system should request a revision or new approval.

This document does not create a database table, migration, backend route, credit ledger, provider integration, renderer job, or export flow.

## Timing Validation Snapshot Rule

Approved snapshots freeze `MasterTimingPlan`, `CaptionVisualCueTimingPlan`, `SoundSyncTransitionTimingPlan`, and `TimingValidationPlan`. A snapshot must not be created when timing validation is blocking or failed.

Future workers execute approved timing plans and do not reinterpret raw chat timing. Material timing changes require a revised plan and new approval.

## Source Cleanup Snapshot Rule

Approved snapshots freeze `SourceCleanupPlan`, including selected cleanup preference, confirmation status, trim decisions, retake groups, preserved/cut ranges, user-review items, and QA checks.

A snapshot must not be created while cleanup preference is unconfirmed. Future FFmpeg/VapourSynth/transcript/media workers may execute trim decisions only from an approved snapshot; they must not reinterpret raw chat cleanup instructions.

## Trim Review Snapshot Rule

Approved snapshots must include `trimReviewPlan`. The snapshot freezes retake selections, alternate candidates, selected-take reasons/confidence, meaning preservation validation status, user-review decisions, and resolved approval gate status. If trim review is blocking, snapshot creation must be blocked.

## Editing Agent Execution Snapshot Rule

Approved snapshots should include `editingAgentExecutionPlan`. The snapshot freezes the future execution work graph, dependency graph, asset manifest, checkpoints, fallback policy, and checkback policy.

The execution graph prevents context loss by ensuring provider/tool/render assets and pending jobs are represented as structured work items and manifest entries. Future workers execute the approved snapshot and work graph, not raw chat or model memory.

This policy does not create queues, jobs, provider calls, tool execution, backend storage, Remotion rendering, or media processing.
## Async Asset Reconciliation Snapshot Rule

Approved snapshots should include `asyncAssetReconciliationPlan` when present. The snapshot freezes:
- checkback policy,
- dependency readiness,
- asset merge/reconciliation policy,
- version and fallback relationships,
- preview placeholder policy,
- final render readiness rules.

A snapshot can exist while final render readiness is false, because future execution may still be waiting for provider/tool assets. That does not mean export is complete. Final export remains waiting until required assets are merged, QA is clear, timing and trim gates are resolved, and workers execute the approved snapshot.

This policy does not implement real checkbacks, queues, provider calls, storage, workers, rendering, or credit deduction.

## Agent QA + Fallback Snapshot Rule

Approved snapshots should include `agentQAFallbackPlan` when present. The snapshot freezes:
- QA gates,
- likely failure scenarios,
- fallback actions,
- fallback decisions,
- user review requirements,
- final render block logic,
- credit impact notes.

If `finalRenderBlocked` is true, approved execution may proceed only to allowed preparation, independent work, fallback planning, or user-review steps. Final export remains blocked until required failures are resolved.

This policy does not implement real QA, retries, fallback execution, provider calls, workers, rendering, storage, or billing.
