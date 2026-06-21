# background_removal QA

- capabilityId: `background_removal`
- preferredPlanningToolsAccepted: `sam2`, `birefnet`
- conditionalPlanningToolsAccepted: `rembg`, `transparent_background`
- fallbackPlanningToolsAccepted: `manual mask planning after model proof`
- eliminatedToolsAccepted: `vega_lite`, `d3`, `three_js`
- requiredProofLevelForExecutionAccepted: CPU import, model provenance, model-weight, and GPU policy proof before execution.
- currentExecutionAllowed: false
- blockedRuntimeReasonsAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneAccepted: CPU import, model provenance, model-weight, and GPU policy proof before execution.

QA accepts this route for planning/study metadata only.
