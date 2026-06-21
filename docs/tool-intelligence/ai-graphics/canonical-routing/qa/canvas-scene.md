# canvas_scene QA

- capabilityId: `canvas_scene`
- preferredPlanningToolsAccepted: `pixi_js`, `konva`
- conditionalPlanningToolsAccepted: `none`
- fallbackPlanningToolsAccepted: `svgdotjs_svg_js for static 2D plan`
- eliminatedToolsAccepted: `sam2`, `real_esrgan`, `vega_lite unless the scene is a chart`
- requiredProofLevelForExecutionAccepted: Browser/canvas sandbox approval before any canvas runtime.
- currentExecutionAllowed: false
- blockedRuntimeReasonsAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneAccepted: Browser/canvas sandbox approval before any canvas runtime.

QA accepts this route for planning/study metadata only.
