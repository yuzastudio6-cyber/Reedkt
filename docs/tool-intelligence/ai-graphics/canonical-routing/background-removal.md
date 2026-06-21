# Background Removal

- capabilityId: `background_removal`
- preferredPlanningTools: `sam2`, `birefnet`
- conditionalPlanningTools: `rembg`, `transparent_background`
- fallbackPlanningTools: `manual mask planning after model proof`
- eliminatedTools: `vega_lite`, `d3`, `three_js`
- requiredProofLevelForExecution: CPU import, model provenance, model-weight, and GPU policy proof before execution.
- currentExecutionAllowed: false
- blockedRuntimeReasons: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- runtimeTarget: model_weight_review_later
- nextProofMilestone: CPU import, model provenance, model-weight, and GPU policy proof before execution.

Agent routing may use this capability only for planning/study metadata now.
