# upscaling Owner Review

- capabilityId: `upscaling`
- sourceApprovalAccepted: true
- sourceQaAccepted: true
- preferredPlanningToolsOwnerAccepted: `real_esrgan`
- conditionalPlanningToolsOwnerAccepted: none
- fallbackPlanningToolsOwnerAccepted: `source replacement or lower-resolution layout plan`
- eliminatedToolsOwnerAccepted: `vega_lite`, `d3`, `sam2 unless segmentation is also requested`
- requiredProofLevelForExecutionOwnerAccepted: Model/GPU/provenance proof before upscaling execution.
- currentExecutionAllowed: false
- blockedRuntimeReasonsOwnerAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneOwnerAccepted: Model/GPU/provenance proof before upscaling execution.

Owner accepts this route for planning/study metadata only.
