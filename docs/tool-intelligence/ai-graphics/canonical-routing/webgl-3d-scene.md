# WebGL 3D Scene

- capabilityId: `webgl_3d_scene`
- preferredPlanningTools: `three_js`, `babylonjs`
- conditionalPlanningTools: `none`
- fallbackPlanningTools: `pixi_js for 2D fallback`, `d3 for non-3D chart fallback`
- eliminatedTools: `vega_lite unless 3D chart is explicitly requested`, `sam2`, `real_esrgan`
- requiredProofLevelForExecution: Browser/WebGL sandbox approval before any scene runtime.
- currentExecutionAllowed: false
- blockedRuntimeReasons: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- runtimeTarget: browser_webgl_sandbox_later
- nextProofMilestone: Browser/WebGL sandbox approval before any scene runtime.

Agent routing may use this capability only for planning/study metadata now.
