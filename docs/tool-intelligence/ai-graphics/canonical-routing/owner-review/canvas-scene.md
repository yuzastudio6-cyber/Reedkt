# canvas_scene Owner Review

- capabilityId: `canvas_scene`
- sourceApprovalAccepted: true
- sourceQaAccepted: true
- preferredPlanningToolsOwnerAccepted: `pixi_js`, `konva`
- conditionalPlanningToolsOwnerAccepted: none
- fallbackPlanningToolsOwnerAccepted: `svgdotjs_svg_js for static 2D plan`
- eliminatedToolsOwnerAccepted: `sam2`, `real_esrgan`, `vega_lite unless the scene is a chart`
- requiredProofLevelForExecutionOwnerAccepted: Browser/canvas sandbox approval before any canvas runtime.
- currentExecutionAllowed: false
- blockedRuntimeReasonsOwnerAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneOwnerAccepted: Browser/canvas sandbox approval before any canvas runtime.

Owner accepts this route for planning/study metadata only.
