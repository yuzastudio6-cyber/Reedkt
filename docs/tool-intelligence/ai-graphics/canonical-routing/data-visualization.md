# Data Visualization

- capabilityId: `data_visualization`
- preferredPlanningTools: `vega_lite`, `vega`, `d3`
- conditionalPlanningTools: `echarts`
- fallbackPlanningTools: `svgdotjs_svg_js`
- eliminatedTools: `sam2`, `real_esrgan`, `lottie_web unless animation is explicitly requested`
- requiredProofLevelForExecution: Future structured data visualization execution approval after source data and runtime review.
- currentExecutionAllowed: false
- blockedRuntimeReasons: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- runtimeTarget: cpu_static_spec_validation_later
- nextProofMilestone: Future structured data visualization execution approval after source data and runtime review.

Agent routing may use this capability only for planning/study metadata now.
