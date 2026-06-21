# subject_segmentation QA

- capabilityId: `subject_segmentation`
- preferredPlanningToolsAccepted: `sam2`, `birefnet`
- conditionalPlanningToolsAccepted: `kornia`
- fallbackPlanningToolsAccepted: `manual review path`
- eliminatedToolsAccepted: `vega_lite`, `viz_js`, `lottie_web`
- requiredProofLevelForExecutionAccepted: Model provenance and segmentation boundary proof before execution.
- currentExecutionAllowed: false
- blockedRuntimeReasonsAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneAccepted: Model provenance and segmentation boundary proof before execution.

QA accepts this route for planning/study metadata only.
