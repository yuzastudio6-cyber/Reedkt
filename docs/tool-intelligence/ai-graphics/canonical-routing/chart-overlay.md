# Chart Overlay

- capabilityId: `chart_overlay`
- preferredPlanningTools: `vega_lite`, `d3`
- conditionalPlanningTools: `echarts`
- fallbackPlanningTools: `vega`
- eliminatedTools: `sam2`, `real_esrgan`, `three_js unless 3D chart is explicitly requested`
- requiredProofLevelForExecution: Future chart overlay spec/runtime approval before execution.
- currentExecutionAllowed: false
- blockedRuntimeReasons: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- runtimeTarget: cpu_static_spec_validation_or_browser_chart_runtime_later
- nextProofMilestone: Future chart overlay spec/runtime approval before execution.

Agent routing may use this capability only for planning/study metadata now.
