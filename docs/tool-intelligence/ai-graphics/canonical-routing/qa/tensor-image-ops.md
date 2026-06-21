# tensor_image_ops QA

- capabilityId: `tensor_image_ops`
- preferredPlanningToolsAccepted: `kornia`
- conditionalPlanningToolsAccepted: `torch_torchvision`
- fallbackPlanningToolsAccepted: `blocked manual planning until import proof`
- eliminatedToolsAccepted: `vega_lite`, `lottie_web`, `viz_js`
- requiredProofLevelForExecutionAccepted: CPU import and tensor/image operation contract proof before execution.
- currentExecutionAllowed: false
- blockedRuntimeReasonsAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneAccepted: CPU import and tensor/image operation contract proof before execution.

QA accepts this route for planning/study metadata only.
