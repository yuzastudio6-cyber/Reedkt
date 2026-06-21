# Diagram Graphics

- capabilityId: `diagram_graphics`
- preferredPlanningTools: `viz_js`
- conditionalPlanningTools: `svgdotjs_svg_js`
- fallbackPlanningTools: `d3`
- eliminatedTools: `vega_lite unless the request is a chart`, `sam2`, `real_esrgan`
- requiredProofLevelForExecution: Future diagram metadata execution approval before DOT/SVG artifact creation.
- currentExecutionAllowed: false
- blockedRuntimeReasons: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- runtimeTarget: cpu_static_spec_validation_later
- nextProofMilestone: Future diagram metadata execution approval before DOT/SVG artifact creation.

Agent routing may use this capability only for planning/study metadata now.
