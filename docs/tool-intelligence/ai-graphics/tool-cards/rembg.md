# rembg Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `rembg`
- `displayName`: rembg
- `packageName`: `rembg`
- `capabilities`: `background_removal`, `planning_metadata_only`, `blocked_or_deferred`
- `bestFor`: backlog background removal planning
- `notFor`: default segmentation until redundancy review; current execution
- `inputTypes`: `image_background_removal_plan`
- `outputTypes`: `planning_metadata`
- `proofStatus`: `owner_assigned_backlog_decision_pending`
- `runtimeStatus`: `blocked_pending_backlog_redundancy_review`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `defer_or_drop_after_backlog_review`
- `costClass`: `medium`
- `latencyClass`: `medium`
- `qualityClass`: `conditional`
- `integrationComplexity`: `medium`
- `safetyLimitations`: possible redundancy; model/runtime proof missing
- `fallbacks`: `sam2`, `birefnet`, `transparent_background`
- `tier`: `Tier D`
- `totalScore`: `42`
- `nextProofMilestone`: `background_removal_backlog_review`

## Scoring

- `capabilityFit`: 16
- `outputQualityPotential`: 12
- `reliabilityProof`: 1
- `cloudReadiness`: 1
- `costEfficiency`: 4
- `integrationSimplicity`: 4
- `safetyAndControl`: 4
- `totalScore`: 42

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
