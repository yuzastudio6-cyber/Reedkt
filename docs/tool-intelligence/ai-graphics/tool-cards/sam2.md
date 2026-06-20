# SAM2 Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `sam2`
- `displayName`: SAM2
- `packageName`: `sam2`
- `capabilities`: `subject_segmentation`, `background_removal`, `planning_metadata_only`, `blocked_or_deferred`
- `bestFor`: future subject segmentation planning; mask candidate planning
- `notFor`: charts; SVG diagrams; current execution
- `inputTypes`: `image_or_video_segmentation_plan`
- `outputTypes`: `planning_metadata`
- `proofStatus`: `owner_assigned_no_model_proof`
- `runtimeStatus`: `blocked_pending_model_weight_provenance_and_gpu_policy`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `model_weight_review_later_then_gpu_proof`
- `costClass`: `high`
- `latencyClass`: `high`
- `qualityClass`: `very_high_after_proof`
- `integrationComplexity`: `high`
- `safetyLimitations`: model download blocked; segmentation inference blocked
- `fallbacks`: `birefnet`, `rembg`
- `tier`: `Blocked`
- `totalScore`: `50`
- `nextProofMilestone`: `model_weight_and_segmentation_boundary_review`

## Scoring

- `capabilityFit`: 22
- `outputQualityPotential`: 18
- `reliabilityProof`: 1
- `cloudReadiness`: 1
- `costEfficiency`: 2
- `integrationSimplicity`: 2
- `safetyAndControl`: 4
- `totalScore`: 50

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
