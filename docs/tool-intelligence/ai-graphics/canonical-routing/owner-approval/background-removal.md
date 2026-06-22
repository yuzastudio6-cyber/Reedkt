# background_removal Owner Approval

- capabilityId: `background_removal`
- sourceApprovalAccepted: true
- sourceQaAccepted: true
- sourceOwnerReviewAccepted: true
- preferredPlanningToolsOwnerApproved: `sam2`, `birefnet`
- conditionalPlanningToolsOwnerApproved: `rembg`, `transparent_background`
- fallbackPlanningToolsOwnerApproved: `manual mask planning after model proof`
- eliminatedToolsOwnerApproved: `vega_lite`, `d3`, `three_js`
- requiredProofLevelForExecutionOwnerApproved: CPU import, model provenance, model-weight, and GPU policy proof before execution.
- currentExecutionAllowed: false
- blockedRuntimeReasonsOwnerApproved: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneOwnerApproved: CPU import, model provenance, model-weight, and GPU policy proof before execution.

Owner approves this route for planning/study metadata only.
