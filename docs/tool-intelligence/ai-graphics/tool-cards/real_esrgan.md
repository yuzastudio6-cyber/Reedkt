# Real-ESRGAN Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `real_esrgan`
- `displayName`: Real-ESRGAN
- `packageName`: `real-esrgan`
- `capabilities`: `upscaling`, `planning_metadata_only`, `blocked_or_deferred`
- `bestFor`: future upscaling planning
- `notFor`: segmentation; charts; current execution
- `inputTypes`: `image_upscale_plan`
- `outputTypes`: `planning_metadata`
- `proofStatus`: `owner_assigned_no_model_proof`
- `runtimeStatus`: `blocked_pending_model_weight_provenance_and_gpu_policy`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `model_weight_review_later_then_gpu_proof`
- `costClass`: `high`
- `latencyClass`: `high`
- `qualityClass`: `high_after_proof`
- `integrationComplexity`: `high`
- `safetyLimitations`: model download blocked; GPU runtime blocked
- `fallbacks`: `basic resize planning`, `future Track A render/export tools only by reference, not ownership`
- `tier`: `Blocked`
- `totalScore`: `51`
- `nextProofMilestone`: `model_weight_and_upscaling_boundary_review`

## Scoring

- `capabilityFit`: 22
- `outputQualityPotential`: 18
- `reliabilityProof`: 1
- `cloudReadiness`: 1
- `costEfficiency`: 3
- `integrationSimplicity`: 2
- `safetyAndControl`: 4
- `totalScore`: 51

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
