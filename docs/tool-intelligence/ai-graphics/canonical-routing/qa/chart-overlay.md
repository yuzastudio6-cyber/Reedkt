# chart_overlay QA

- capabilityId: `chart_overlay`
- preferredPlanningToolsAccepted: `vega_lite`, `d3`
- conditionalPlanningToolsAccepted: `echarts`
- fallbackPlanningToolsAccepted: `vega`
- eliminatedToolsAccepted: `sam2`, `real_esrgan`, `three_js unless 3D chart is explicitly requested`
- requiredProofLevelForExecutionAccepted: Future chart overlay spec/runtime approval before execution.
- currentExecutionAllowed: false
- blockedRuntimeReasonsAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneAccepted: Future chart overlay spec/runtime approval before execution.

QA accepts this route for planning/study metadata only.
