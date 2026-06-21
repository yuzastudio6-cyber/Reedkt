# animation_overlay QA

- capabilityId: `animation_overlay`
- preferredPlanningToolsAccepted: `lottie_web`, `animejs`
- conditionalPlanningToolsAccepted: `none`
- fallbackPlanningToolsAccepted: `satori for static fallback planning`
- eliminatedToolsAccepted: `sam2`, `real_esrgan`, `vega_lite unless the request is chart animation`
- requiredProofLevelForExecutionAccepted: Animation manifest/runtime approval before player or timeline execution.
- currentExecutionAllowed: false
- blockedRuntimeReasonsAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneAccepted: Animation manifest/runtime approval before player or timeline execution.

QA accepts this route for planning/study metadata only.
