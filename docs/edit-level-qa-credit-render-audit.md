# Edit Level QA Credit Render Audit

## Current Surfaces

- QA: `src/lib/edit-qa-planner.ts`, `src/lib/planner-validation.ts`, `src/lib/planner-regression.ts`, `src/types/professional-qa.ts`.
- Credit estimate: `src/lib/credit-estimator.ts`, `src/types/reeditpro.ts`, `docs/credit-runtime-approval-gate.md`.
- Render planning: `src/lib/render-strategy-planner.ts`, `src/lib/remotion-renderer-planner.ts`, `remotion-renderer-plan.md`.
- Approval snapshots: `approved-plan-snapshot-policy.md`, `src/lib/approved-plan-snapshot.ts`.

## Future Level Behavior

| Future level | QA | Credit estimate | Render budget | Revision budget |
| --- | --- | --- | --- | --- |
| Normal | Basic QA, professional baseline, no low-quality language. | Minimal tool budget and lower-cost defaults. | Basic future render budget metadata. | Low future revision budget metadata. |
| Premium | Premium QA with stronger source, style, caption, audio, and marker checks. | Medium tool budget and credit estimate multiplier. | Medium future render pass budget metadata. | Medium future revision budget metadata. |
| Ultra Premium | Strict QA with deeper visual/audio/design/fallback checks. | Highest tool budget, highest multiplier, lower-cost alternatives when complex. | Highest future render pass budget metadata. | Higher future revision budget metadata. |

## Required Rule

Credit estimates only for now. No spend until future credit gate approval/reservation. Render budget and revision budget are future planning metadata only.

## Gaps

- Current credit values are hardcoded by `basic | pro | premium`.
- No `EditLevelEstimateProfile` exists.
- No `renderPassBudgetFuture` or `revisionBudgetFuture` profile fields exist.
- Real render/export workers are not implemented.

## Recommendation

Use the existing QA/credit/render planners as downstream consumers of a future profile. Keep RP-EDITLEVEL-00 as no runtime implementation.
