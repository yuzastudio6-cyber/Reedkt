# Subject Segmentation

- capabilityId: `subject_segmentation`
- preferredPlanningTools: `sam2`, `birefnet`
- conditionalPlanningTools: `kornia`
- fallbackPlanningTools: `manual review path`
- eliminatedTools: `vega_lite`, `viz_js`, `lottie_web`
- requiredProofLevelForExecution: Model provenance and segmentation boundary proof before execution.
- currentExecutionAllowed: false
- blockedRuntimeReasons: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- runtimeTarget: model_weight_review_later
- nextProofMilestone: Model provenance and segmentation boundary proof before execution.

Agent routing may use this capability only for planning/study metadata now.
