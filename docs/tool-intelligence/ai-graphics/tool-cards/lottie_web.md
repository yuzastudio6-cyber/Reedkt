# Lottie Web Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `lottie_web`
- `displayName`: Lottie Web
- `packageName`: `lottie-web`
- `capabilities`: `animation_overlay`, `planning_metadata_only`, `blocked_or_deferred`
- `bestFor`: reusable vector animation manifest planning
- `notFor`: realistic video generation; runtime playback now
- `inputTypes`: `lottie_manifest_plan`
- `outputTypes`: `animation_manifest_metadata`
- `proofStatus`: `canonical_package_import_static_fixture_proof_only`
- `runtimeStatus`: `blocked_pending_animation_runtime_approval`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `animation_manifest_runtime_later`
- `costClass`: `low`
- `latencyClass`: `low_after_runtime_proof`
- `qualityClass`: `high_for_vector_animation`
- `integrationComplexity`: `medium`
- `safetyLimitations`: runtime playback not approved
- `fallbacks`: `animejs`, `Remotion planning`
- `tier`: `Tier B`
- `totalScore`: `75`
- `nextProofMilestone`: `animation_manifest_runtime_approval`

## Scoring

- `capabilityFit`: 21
- `outputQualityPotential`: 17
- `reliabilityProof`: 10
- `cloudReadiness`: 4
- `costEfficiency`: 8
- `integrationSimplicity`: 7
- `safetyAndControl`: 8
- `totalScore`: 75

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
