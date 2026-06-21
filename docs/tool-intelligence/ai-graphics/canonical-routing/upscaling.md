# Upscaling

- capabilityId: `upscaling`
- preferredPlanningTools: `real_esrgan`
- conditionalPlanningTools: `none`
- fallbackPlanningTools: `source replacement or lower-resolution layout plan`
- eliminatedTools: `vega_lite`, `d3`, `sam2 unless segmentation is also requested`
- requiredProofLevelForExecution: Model/GPU/provenance proof before upscaling execution.
- currentExecutionAllowed: false
- blockedRuntimeReasons: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- runtimeTarget: model_weight_review_later
- nextProofMilestone: Model/GPU/provenance proof before upscaling execution.

Agent routing may use this capability only for planning/study metadata now.
