# diagram_graphics Owner Approval

- capabilityId: `diagram_graphics`
- sourceApprovalAccepted: true
- sourceQaAccepted: true
- sourceOwnerReviewAccepted: true
- preferredPlanningToolsOwnerApproved: `viz_js`
- conditionalPlanningToolsOwnerApproved: `svgdotjs_svg_js`
- fallbackPlanningToolsOwnerApproved: `d3`
- eliminatedToolsOwnerApproved: `vega_lite unless the request is a chart`, `sam2`, `real_esrgan`
- requiredProofLevelForExecutionOwnerApproved: Future diagram metadata execution approval before DOT/SVG artifact creation.
- currentExecutionAllowed: false
- blockedRuntimeReasonsOwnerApproved: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneOwnerApproved: Future diagram metadata execution approval before DOT/SVG artifact creation.

Owner approves this route for planning/study metadata only.
