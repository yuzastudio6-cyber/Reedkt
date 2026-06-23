# Chart Overlay Canonicalization Review

Decision: `ai_graphics_canonical_agent_selection_canonicalization_review_passed_with_warnings`

## Required Fields
- `capabilityId`: `chart_overlay`
- `canonicalStatus`: `canonical_planning_study_metadata_selection_only`
- `sourceSelectionReviewAccepted`: true
- `sourceSelectionQaAccepted`: true
- `sourceSelectionOwnerReviewAccepted`: true
- `sourceSelectionOwnerApprovalAccepted`: true
- `sourceSelectionOwnerApprovalQaAccepted`: true
- `preferredPlanningToolsCanonicalized`: `vega_lite`, `d3`
- `conditionalPlanningToolsCanonicalized`: `echarts`
- `fallbackPlanningToolsCanonicalized`: `vega`
- `eliminatedToolsCanonicalized`: `three_js`, `sam2`, `real_esrgan`
- `missingProofRulesCanonicalized`: true
- `currentExecutionAllowed`: false
- `blockedRuntimeReasonsCanonicalized`: browser chart runtime not approved; model/GPU proof not approved for eliminated ML tools; 3D chart request required before three_js planning
- `nextProofMilestoneCanonicalized`: future chart/browser runtime or CPU/static chart metadata proof before execution

## Canonicalization Result
PR #683 owner-approval QA is canonicalized for this capability with warnings. Agent planning/study metadata selection is allowed; execution remains false.

## Evidence Context
PR #683, PR #681, PR #677, PR #674, PR #671, PR #668, PR #623, PR #376, and PR #361 are accepted as source evidence. Track B remains under `TRACK_B_MEDIA_OSS_STEWARD`; Track A render/export exclusion via PR #544 remains evidence-only context.

## No-Scope
No agent execution, tool execution, route execution, worker execution, provider/model execution, browser/WebGL/canvas runtime, GPU/model runtime, Supabase/SQL/GCS, signed URL, public artifact, E2E proof, runtime readiness, internal beta, external beta, production, dependency install, npm ci, package-lock mutation, CPU/static execution, import smoke, synthetic fixtures, PR merge, PR close, or PR retarget is approved.
