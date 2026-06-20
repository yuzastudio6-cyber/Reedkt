# Transformers Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `transformers`
- `displayName`: Transformers
- `packageName`: `transformers`
- `capabilities`: `model_runtime_foundation`, `planning_metadata_only`, `blocked_or_deferred`
- `bestFor`: future model orchestration planning; model boundary policy planning
- `notFor`: current provider calls; current inference; chart overlays
- `inputTypes`: `model_selection_plan`
- `outputTypes`: `planning_metadata`
- `proofStatus`: `owner_assigned_no_import_or_model_proof`
- `runtimeStatus`: `blocked_pending_cpu_import_model_boundary_and_model_weight_policy`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `cloud_run_cpu_job_then_model_weight_review_later`
- `costClass`: `high`
- `latencyClass`: `high`
- `qualityClass`: `high_after_proof`
- `integrationComplexity`: `high`
- `safetyLimitations`: model weights blocked; provider/model runtime blocked
- `fallbacks`: `torch_torchvision`
- `tier`: `Blocked`
- `totalScore`: `44`
- `nextProofMilestone`: `cpu_import_model_path_policy_review`

## Scoring

- `capabilityFit`: 15
- `outputQualityPotential`: 15
- `reliabilityProof`: 2
- `cloudReadiness`: 2
- `costEfficiency`: 3
- `integrationSimplicity`: 2
- `safetyAndControl`: 5
- `totalScore`: 44

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
