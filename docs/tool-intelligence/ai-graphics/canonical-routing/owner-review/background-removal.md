# background_removal Owner Review

- capabilityId: `background_removal`
- sourceApprovalAccepted: true
- sourceQaAccepted: true
- preferredPlanningToolsOwnerAccepted: `sam2`, `birefnet`
- conditionalPlanningToolsOwnerAccepted: `rembg`, `transparent_background`
- fallbackPlanningToolsOwnerAccepted: `manual mask planning after model proof`
- eliminatedToolsOwnerAccepted: `vega_lite`, `d3`, `three_js`
- requiredProofLevelForExecutionOwnerAccepted: CPU import, model provenance, model-weight, and GPU policy proof before execution.
- currentExecutionAllowed: false
- blockedRuntimeReasonsOwnerAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneOwnerAccepted: CPU import, model provenance, model-weight, and GPU policy proof before execution.

Owner accepts this route for planning/study metadata only.
