# upscaling Owner Approval

- capabilityId: `upscaling`
- sourceApprovalAccepted: true
- sourceQaAccepted: true
- sourceOwnerReviewAccepted: true
- preferredPlanningToolsOwnerApproved: `real_esrgan`
- conditionalPlanningToolsOwnerApproved: none
- fallbackPlanningToolsOwnerApproved: `source replacement or lower-resolution layout plan`
- eliminatedToolsOwnerApproved: `vega_lite`, `d3`, `sam2 unless segmentation is also requested`
- requiredProofLevelForExecutionOwnerApproved: Model/GPU/provenance proof before upscaling execution.
- currentExecutionAllowed: false
- blockedRuntimeReasonsOwnerApproved: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneOwnerApproved: Model/GPU/provenance proof before upscaling execution.

Owner approves this route for planning/study metadata only.
