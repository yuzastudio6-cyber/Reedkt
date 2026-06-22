# Animation Overlay Owner Approval QA

- `capabilityId`: `animation_overlay`
- `sourceApprovalAccepted`: true
- `sourceQaAccepted`: true
- `sourceOwnerReviewAccepted`: true
- `sourceOwnerApprovalAccepted`: true
- `preferredPlanningToolsOwnerApprovalQaAccepted`: lottie_web, animejs
- `conditionalPlanningToolsOwnerApprovalQaAccepted`: none
- `fallbackPlanningToolsOwnerApprovalQaAccepted`: satori for static fallback planning
- `eliminatedToolsOwnerApprovalQaAccepted`: sam2, real_esrgan, vega_lite unless the request is chart animation
- `requiredProofLevelForExecutionOwnerApprovalQaAccepted`: Animation manifest/runtime approval before player or timeline execution.
- `currentExecutionAllowed`: false
- `blockedRuntimeReasonsOwnerApprovalQaAccepted`: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- `nextProofMilestoneOwnerApprovalQaAccepted`: Animation manifest/runtime approval before player or timeline execution.

QA status: `accepted_with_warnings`.
