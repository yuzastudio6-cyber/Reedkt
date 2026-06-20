# Kornia Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `kornia`
- `displayName`: Kornia
- `packageName`: `kornia`
- `capabilities`: `tensor_image_ops`, `model_runtime_foundation`, `planning_metadata_only`, `blocked_or_deferred`
- `bestFor`: future tensor/image ops planning; CPU import foundation
- `notFor`: charts; browser scene rendering; current execution
- `inputTypes`: `tensor_image_ops_plan`
- `outputTypes`: `planning_metadata`
- `proofStatus`: `owner_assigned_no_import_proof`
- `runtimeStatus`: `blocked_pending_cpu_import_proof`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `cloud_run_cpu_job_then_gpu_review_later`
- `costClass`: `medium`
- `latencyClass`: `medium`
- `qualityClass`: `medium_high_after_proof`
- `integrationComplexity`: `medium`
- `safetyLimitations`: tensor execution blocked; GPU runtime blocked
- `fallbacks`: `torch_torchvision`
- `tier`: `Blocked`
- `totalScore`: `52`
- `nextProofMilestone`: `cpu_import_foundation_review`

## Scoring

- `capabilityFit`: 18
- `outputQualityPotential`: 15
- `reliabilityProof`: 2
- `cloudReadiness`: 3
- `costEfficiency`: 5
- `integrationSimplicity`: 4
- `safetyAndControl`: 5
- `totalScore`: 52

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
