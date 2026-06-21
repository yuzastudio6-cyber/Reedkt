# SVG Graphics

- capabilityId: `svg_graphics`
- preferredPlanningTools: `svgdotjs_svg_js`, `satori`
- conditionalPlanningTools: `d3`
- fallbackPlanningTools: `viz_js for graph-shaped SVG`
- eliminatedTools: `sam2`, `real_esrgan`, `transformers`
- requiredProofLevelForExecution: Future SVG contract execution approval with private artifact policy.
- currentExecutionAllowed: false
- blockedRuntimeReasons: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- runtimeTarget: cpu_static_spec_validation_later
- nextProofMilestone: Future SVG contract execution approval with private artifact policy.

Agent routing may use this capability only for planning/study metadata now.
