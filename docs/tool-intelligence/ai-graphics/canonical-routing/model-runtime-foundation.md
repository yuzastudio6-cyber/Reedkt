# Model Runtime Foundation

- capabilityId: `model_runtime_foundation`
- preferredPlanningTools: `torch_torchvision`, `transformers`
- conditionalPlanningTools: `kornia`
- fallbackPlanningTools: `defer until model-boundary proof`
- eliminatedTools: `d3`, `vega_lite`, `svgdotjs_svg_js`
- requiredProofLevelForExecution: CPU/GPU model-runtime foundation proof, model-weight provenance, and boundary review before execution.
- currentExecutionAllowed: false
- blockedRuntimeReasons: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- runtimeTarget: cloud_run_cpu_or_gpu_review_later
- nextProofMilestone: CPU/GPU model-runtime foundation proof, model-weight provenance, and boundary review before execution.

Agent routing may use this capability only for planning/study metadata now.
