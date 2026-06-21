# model_runtime_foundation QA

- capabilityId: `model_runtime_foundation`
- preferredPlanningToolsAccepted: `torch_torchvision`, `transformers`
- conditionalPlanningToolsAccepted: `kornia`
- fallbackPlanningToolsAccepted: `defer until model-boundary proof`
- eliminatedToolsAccepted: `d3`, `vega_lite`, `svgdotjs_svg_js`
- requiredProofLevelForExecutionAccepted: CPU/GPU model-runtime foundation proof, model-weight provenance, and boundary review before execution.
- currentExecutionAllowed: false
- blockedRuntimeReasonsAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneAccepted: CPU/GPU model-runtime foundation proof, model-weight provenance, and boundary review before execution.

QA accepts this route for planning/study metadata only.
