# Data Visualization Canonicalization Owner Approval

Decision: `ai_graphics_canonical_agent_selection_canonicalization_owner_approved_with_warnings`

## Required Fields
- `capabilityId`: `data_visualization`
- `canonicalStatusOwnerApproved`: `owner_approved_canonical_planning_study_metadata_selection_only`
- `sourceSelectionReviewAccepted`: true
- `sourceSelectionQaAccepted`: true
- `sourceSelectionOwnerReviewAccepted`: true
- `sourceSelectionOwnerApprovalAccepted`: true
- `sourceSelectionOwnerApprovalQaAccepted`: true
- `sourceSelectionCanonicalizationReviewAccepted`: true
- `sourceSelectionCanonicalizationQaAccepted`: true
- `sourceSelectionCanonicalizationOwnerReviewAccepted`: true
- `preferredPlanningToolsOwnerApproved`: `vega_lite`, `vega`, `d3`
- `conditionalPlanningToolsOwnerApproved`: `echarts`
- `fallbackPlanningToolsOwnerApproved`: `svgdotjs_svg_js`
- `eliminatedToolsOwnerApproved`: `sam2`, `real_esrgan`, `lottie_web`
- `missingProofRulesOwnerApproved`: true
- `currentExecutionAllowed`: false
- `blockedRuntimeReasonsOwnerApproved`: browser chart runtime not approved for echarts, model/GPU tools are capability mismatches
- `nextProofMilestoneOwnerApproved`: future data visualization execution proof after runtime approval

## Owner Approval Result
PR #688 canonicalization owner review is owner-approved for this capability with warnings. Agent planning/study metadata selection is allowed; execution remains false.

## Evidence Context
PR #688, PR #686, PR #685, PR #683, PR #681, PR #677, PR #674, PR #671, PR #668, PR #623, PR #376, and PR #361 are accepted as source evidence. Track B remains under `TRACK_B_MEDIA_OSS_STEWARD`; Track A render/export exclusion via PR #544 remains evidence-only context.

## No-Scope
No agent execution, tool execution, route execution, worker execution, provider/model execution, browser/WebGL/canvas runtime, GPU/model runtime, Supabase/SQL/GCS, signed URL, public artifact, E2E proof, runtime readiness, internal beta, external beta, production, dependency install, npm ci, package-lock mutation, CPU/static execution, import smoke, synthetic fixtures, PR merge, PR close, PR retarget is approved.
