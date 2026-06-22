# canvas_scene Owner Approval

- capabilityId: `canvas_scene`
- sourceApprovalAccepted: true
- sourceQaAccepted: true
- sourceOwnerReviewAccepted: true
- preferredPlanningToolsOwnerApproved: `pixi_js`, `konva`
- conditionalPlanningToolsOwnerApproved: none
- fallbackPlanningToolsOwnerApproved: `svgdotjs_svg_js for static 2D plan`
- eliminatedToolsOwnerApproved: `sam2`, `real_esrgan`, `vega_lite unless the scene is a chart`
- requiredProofLevelForExecutionOwnerApproved: Browser/canvas sandbox approval before any canvas runtime.
- currentExecutionAllowed: false
- blockedRuntimeReasonsOwnerApproved: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneOwnerApproved: Browser/canvas sandbox approval before any canvas runtime.

Owner approves this route for planning/study metadata only.
