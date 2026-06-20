# Konva Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `konva`
- `displayName`: Konva
- `packageName`: `konva`
- `capabilities`: `canvas_scene`, `planning_metadata_only`, `blocked_or_deferred`
- `bestFor`: 2D canvas drawing/annotation planning
- `notFor`: 3D scenes; current canvas runtime
- `inputTypes`: `konva_layer_manifest_plan`
- `outputTypes`: `canvas_planning_metadata`
- `proofStatus`: `canonical_package_import_manifest_proof_only`
- `runtimeStatus`: `blocked_pending_browser_canvas_sandbox`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `browser_webgl_canvas_sandbox_later`
- `costClass`: `low_medium`
- `latencyClass`: `medium`
- `qualityClass`: `medium_high_after_runtime_proof`
- `integrationComplexity`: `medium`
- `safetyLimitations`: canvas runtime not approved
- `fallbacks`: `pixi_js`, `svgdotjs_svg_js`
- `tier`: `Tier B`
- `totalScore`: `69`
- `nextProofMilestone`: `browser_webgl_canvas_sandbox_approval`

## Scoring

- `capabilityFit`: 20
- `outputQualityPotential`: 15
- `reliabilityProof`: 10
- `cloudReadiness`: 3
- `costEfficiency`: 7
- `integrationSimplicity`: 6
- `safetyAndControl`: 8
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
