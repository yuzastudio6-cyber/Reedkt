# Upscaling Owner Approval QA

- `capabilityId`: `upscaling`
- `sourceApprovalAccepted`: true
- `sourceQaAccepted`: true
- `sourceOwnerReviewAccepted`: true
- `sourceOwnerApprovalAccepted`: true
- `preferredPlanningToolsOwnerApprovalQaAccepted`: real_esrgan
- `conditionalPlanningToolsOwnerApprovalQaAccepted`: none
- `fallbackPlanningToolsOwnerApprovalQaAccepted`: source replacement or lower-resolution layout plan
- `eliminatedToolsOwnerApprovalQaAccepted`: vega_lite, d3, sam2 unless segmentation is also requested
- `requiredProofLevelForExecutionOwnerApprovalQaAccepted`: Model/GPU/provenance proof before upscaling execution.
- `currentExecutionAllowed`: false
- `blockedRuntimeReasonsOwnerApprovalQaAccepted`: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- `nextProofMilestoneOwnerApprovalQaAccepted`: Model/GPU/provenance proof before upscaling execution.

QA status: `accepted_with_warnings`.
