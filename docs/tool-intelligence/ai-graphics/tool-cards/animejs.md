# Anime.js Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `animejs`
- `displayName`: Anime.js
- `packageName`: `animejs`
- `capabilities`: `animation_overlay`, `planning_metadata_only`, `blocked_or_deferred`
- `bestFor`: timeline/motion metadata planning
- `notFor`: current runtime animation; data visualization
- `inputTypes`: `animation_timeline_plan`
- `outputTypes`: `timeline_metadata`
- `proofStatus`: `canonical_package_import_manifest_proof_only`
- `runtimeStatus`: `blocked_pending_animation_runtime_approval`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `animation_manifest_runtime_later`
- `costClass`: `low`
- `latencyClass`: `low_after_runtime_proof`
- `qualityClass`: `medium_high`
- `integrationComplexity`: `medium`
- `safetyLimitations`: runtime not approved
- `fallbacks`: `lottie_web`, `Remotion planning`
- `tier`: `Tier B`
- `totalScore`: `73`
- `nextProofMilestone`: `animation_manifest_runtime_approval`

## Scoring

- `capabilityFit`: 20
- `outputQualityPotential`: 16
- `reliabilityProof`: 10
- `cloudReadiness`: 4
- `costEfficiency`: 8
- `integrationSimplicity`: 7
- `safetyAndControl`: 8
- `totalScore`: 73

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
