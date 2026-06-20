# Viz.js Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `viz_js`
- `displayName`: Viz.js
- `packageName`: `@viz-js/viz`
- `capabilities`: `diagram_graphics`, `svg_graphics`, `planning_metadata_only`
- `bestFor`: DOT/Graphviz diagram planning; graph shape metadata
- `notFor`: general charts unless graph diagram; public SVG artifact now
- `inputTypes`: `tiny_dot_graph_fixture`
- `outputTypes`: `dot_metadata_shape_json`
- `proofStatus`: `canonical_package_proof_and_cpu_static_validation_passed`
- `runtimeStatus`: `planning_metadata_only_runtime_blocked`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `cloud_run_cpu_job_for_static_contract_then_diagram_artifact_review_later`
- `costClass`: `low_medium`
- `latencyClass`: `medium`
- `qualityClass`: `high_for_graphs`
- `integrationComplexity`: `medium`
- `safetyLimitations`: artifact output blocked; public artifact blocked
- `fallbacks`: `svgdotjs_svg_js`, `d3`
- `tier`: `Tier A`
- `totalScore`: `89`
- `nextProofMilestone`: `cpu_static_owner_qa_then_diagram_output_boundary_review`

## Scoring

- `capabilityFit`: 25
- `outputQualityPotential`: 18
- `reliabilityProof`: 15
- `cloudReadiness`: 7
- `costEfficiency`: 8
- `integrationSimplicity`: 7
- `safetyAndControl`: 9
- `totalScore`: 89

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
