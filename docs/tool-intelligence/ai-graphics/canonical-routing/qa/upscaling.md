# upscaling QA

- capabilityId: `upscaling`
- preferredPlanningToolsAccepted: `real_esrgan`
- conditionalPlanningToolsAccepted: `none`
- fallbackPlanningToolsAccepted: `source replacement or lower-resolution layout plan`
- eliminatedToolsAccepted: `vega_lite`, `d3`, `sam2 unless segmentation is also requested`
- requiredProofLevelForExecutionAccepted: Model/GPU/provenance proof before upscaling execution.
- currentExecutionAllowed: false
- blockedRuntimeReasonsAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneAccepted: Model/GPU/provenance proof before upscaling execution.

QA accepts this route for planning/study metadata only.
