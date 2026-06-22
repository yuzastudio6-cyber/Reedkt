# Diagram Graphics Owner Approval QA

- `capabilityId`: `diagram_graphics`
- `sourceApprovalAccepted`: true
- `sourceQaAccepted`: true
- `sourceOwnerReviewAccepted`: true
- `sourceOwnerApprovalAccepted`: true
- `preferredPlanningToolsOwnerApprovalQaAccepted`: viz_js
- `conditionalPlanningToolsOwnerApprovalQaAccepted`: svgdotjs_svg_js
- `fallbackPlanningToolsOwnerApprovalQaAccepted`: d3
- `eliminatedToolsOwnerApprovalQaAccepted`: vega_lite unless the request is a chart, sam2, real_esrgan
- `requiredProofLevelForExecutionOwnerApprovalQaAccepted`: Future diagram metadata execution approval before DOT/SVG artifact creation.
- `currentExecutionAllowed`: false
- `blockedRuntimeReasonsOwnerApprovalQaAccepted`: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- `nextProofMilestoneOwnerApprovalQaAccepted`: Future diagram metadata execution approval before DOT/SVG artifact creation.

QA status: `accepted_with_warnings`.
