# Tensor Image Ops

- capabilityId: `tensor_image_ops`
- preferredPlanningTools: `kornia`
- conditionalPlanningTools: `torch_torchvision`
- fallbackPlanningTools: `blocked manual planning until import proof`
- eliminatedTools: `vega_lite`, `lottie_web`, `viz_js`
- requiredProofLevelForExecution: CPU import and tensor/image operation contract proof before execution.
- currentExecutionAllowed: false
- blockedRuntimeReasons: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- runtimeTarget: cloud_run_cpu_job_later
- nextProofMilestone: CPU import and tensor/image operation contract proof before execution.

Agent routing may use this capability only for planning/study metadata now.
