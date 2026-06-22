# Canvas Scene Owner Approval QA

- `capabilityId`: `canvas_scene`
- `sourceApprovalAccepted`: true
- `sourceQaAccepted`: true
- `sourceOwnerReviewAccepted`: true
- `sourceOwnerApprovalAccepted`: true
- `preferredPlanningToolsOwnerApprovalQaAccepted`: pixi_js, konva
- `conditionalPlanningToolsOwnerApprovalQaAccepted`: none
- `fallbackPlanningToolsOwnerApprovalQaAccepted`: svgdotjs_svg_js for static 2D plan
- `eliminatedToolsOwnerApprovalQaAccepted`: sam2, real_esrgan, vega_lite unless the scene is a chart
- `requiredProofLevelForExecutionOwnerApprovalQaAccepted`: Browser/canvas sandbox approval before any canvas runtime.
- `currentExecutionAllowed`: false
- `blockedRuntimeReasonsOwnerApprovalQaAccepted`: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- `nextProofMilestoneOwnerApprovalQaAccepted`: Browser/canvas sandbox approval before any canvas runtime.

QA status: `accepted_with_warnings`.
