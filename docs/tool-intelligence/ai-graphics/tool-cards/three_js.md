# Three.js Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `three_js`
- `displayName`: Three.js
- `packageName`: `three`
- `capabilities`: `webgl_3d_scene`, `planning_metadata_only`, `blocked_or_deferred`
- `bestFor`: general 3D/WebGL scene planning; 3D product/mockup/explainer planning
- `notFor`: flat charts unless explicit 3D chart; current WebGL runtime
- `inputTypes`: `three_scene_manifest_plan`
- `outputTypes`: `scene_planning_metadata`
- `proofStatus`: `canonical_package_import_manifest_proof_only`
- `runtimeStatus`: `blocked_pending_browser_webgl_canvas_sandbox`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `browser_webgl_sandbox_later`
- `costClass`: `medium_high`
- `latencyClass`: `medium_high`
- `qualityClass`: `high_after_runtime_proof`
- `integrationComplexity`: `high`
- `safetyLimitations`: WebGL runtime not approved
- `fallbacks`: `babylonjs`, `d3 for flat charts`
- `tier`: `Tier B`
- `totalScore`: `69`
- `nextProofMilestone`: `browser_webgl_canvas_sandbox_approval`

## Scoring

- `capabilityFit`: 22
- `outputQualityPotential`: 18
- `reliabilityProof`: 10
- `cloudReadiness`: 3
- `costEfficiency`: 5
- `integrationSimplicity`: 4
- `safetyAndControl`: 7
- `totalScore`: 69

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
