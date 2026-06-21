# Canvas Scene

- capabilityId: `canvas_scene`
- preferredPlanningTools: `pixi_js`, `konva`
- conditionalPlanningTools: `none`
- fallbackPlanningTools: `svgdotjs_svg_js for static 2D plan`
- eliminatedTools: `sam2`, `real_esrgan`, `vega_lite unless the scene is a chart`
- requiredProofLevelForExecution: Browser/canvas sandbox approval before any canvas runtime.
- currentExecutionAllowed: false
- blockedRuntimeReasons: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- runtimeTarget: browser_canvas_sandbox_later
- nextProofMilestone: Browser/canvas sandbox approval before any canvas runtime.

Agent routing may use this capability only for planning/study metadata now.
