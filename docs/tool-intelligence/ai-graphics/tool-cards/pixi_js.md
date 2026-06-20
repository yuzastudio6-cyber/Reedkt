# PixiJS Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `pixi_js`
- `displayName`: PixiJS
- `packageName`: `pixi.js`
- `capabilities`: `canvas_scene`, `planning_metadata_only`, `blocked_or_deferred`
- `bestFor`: 2D WebGL/canvas sprite and scene planning
- `notFor`: 3D scenes; current canvas runtime
- `inputTypes`: `pixi_scene_manifest_plan`
- `outputTypes`: `scene_planning_metadata`
- `proofStatus`: `canonical_package_import_manifest_proof_only`
- `runtimeStatus`: `blocked_pending_browser_webgl_canvas_sandbox`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `browser_webgl_canvas_sandbox_later`
- `costClass`: `medium`
- `latencyClass`: `medium`
- `qualityClass`: `high_after_runtime_proof`
- `integrationComplexity`: `medium_high`
- `safetyLimitations`: canvas/WebGL runtime not approved
- `fallbacks`: `konva`, `animejs for simple motion planning`
- `tier`: `Tier B`
- `totalScore`: `69`
- `nextProofMilestone`: `browser_webgl_canvas_sandbox_approval`

## Scoring

- `capabilityFit`: 21
- `outputQualityPotential`: 17
- `reliabilityProof`: 10
- `cloudReadiness`: 3
- `costEfficiency`: 6
- `integrationSimplicity`: 5
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
