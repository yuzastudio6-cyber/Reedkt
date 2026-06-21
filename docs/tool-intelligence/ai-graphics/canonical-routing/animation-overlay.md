# Animation Overlay

- capabilityId: `animation_overlay`
- preferredPlanningTools: `lottie_web`, `animejs`
- conditionalPlanningTools: `none`
- fallbackPlanningTools: `satori for static fallback planning`
- eliminatedTools: `sam2`, `real_esrgan`, `vega_lite unless the request is chart animation`
- requiredProofLevelForExecution: Animation manifest/runtime approval before player or timeline execution.
- currentExecutionAllowed: false
- blockedRuntimeReasons: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- runtimeTarget: animation_manifest_runtime_later
- nextProofMilestone: Animation manifest/runtime approval before player or timeline execution.

Agent routing may use this capability only for planning/study metadata now.
