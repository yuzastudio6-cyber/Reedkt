# Torch / Torchvision Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `torch_torchvision`
- `displayName`: Torch / Torchvision
- `packageName`: `torch / torchvision`
- `capabilities`: `model_runtime_foundation`, `tensor_image_ops`, `planning_metadata_only`, `blocked_or_deferred`
- `bestFor`: future tensor/model runtime foundation planning; image tensor preprocessing planning
- `notFor`: current execution; browser overlays; charts
- `inputTypes`: `model_runtime_plan`, `tensor_image_plan`
- `outputTypes`: `planning_metadata`
- `proofStatus`: `owner_assigned_no_import_or_model_proof`
- `runtimeStatus`: `blocked_pending_cpu_import_model_boundary_and_gpu_policy`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `cloud_run_cpu_job_then_gpu_review_later`
- `costClass`: `high`
- `latencyClass`: `high`
- `qualityClass`: `high_after_proof`
- `integrationComplexity`: `high`
- `safetyLimitations`: model downloads and inference blocked; GPU runtime blocked
- `fallbacks`: `kornia`, `transformers`
- `tier`: `Blocked`
- `totalScore`: `45`
- `nextProofMilestone`: `cpu_import_foundation_review`

## Scoring

- `capabilityFit`: 16
- `outputQualityPotential`: 15
- `reliabilityProof`: 2
- `cloudReadiness`: 2
- `costEfficiency`: 3
- `integrationSimplicity`: 2
- `safetyAndControl`: 5
- `totalScore`: 45

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
