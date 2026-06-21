# webgl_3d_scene QA

- capabilityId: `webgl_3d_scene`
- preferredPlanningToolsAccepted: `three_js`, `babylonjs`
- conditionalPlanningToolsAccepted: `none`
- fallbackPlanningToolsAccepted: `pixi_js for 2D fallback`, `d3 for non-3D chart fallback`
- eliminatedToolsAccepted: `vega_lite unless 3D chart is explicitly requested`, `sam2`, `real_esrgan`
- requiredProofLevelForExecutionAccepted: Browser/WebGL sandbox approval before any scene runtime.
- currentExecutionAllowed: false
- blockedRuntimeReasonsAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneAccepted: Browser/WebGL sandbox approval before any scene runtime.

QA accepts this route for planning/study metadata only.
