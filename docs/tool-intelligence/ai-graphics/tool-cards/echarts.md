# ECharts Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `echarts`
- `displayName`: ECharts
- `packageName`: `echarts`
- `capabilities`: `chart_overlay`, `data_visualization`, `planning_metadata_only`, `blocked_or_deferred`
- `bestFor`: standard dashboard/business chart planning
- `notFor`: custom diagrams needing D3; current browser runtime
- `inputTypes`: `chart_option_plan`
- `outputTypes`: `planning_metadata`
- `proofStatus`: `canonical_package_import_static_fixture_proof_only`
- `runtimeStatus`: `blocked_pending_browser_chart_runtime`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `browser_chart_runtime_later`
- `costClass`: `low`
- `latencyClass`: `low_after_runtime_proof`
- `qualityClass`: `high_after_runtime_proof`
- `integrationComplexity`: `medium`
- `safetyLimitations`: browser runtime not approved
- `fallbacks`: `vega_lite`, `d3`
- `tier`: `Tier B`
- `totalScore`: `74`
- `nextProofMilestone`: `browser_chart_runtime_approval`

## Scoring

- `capabilityFit`: 20
- `outputQualityPotential`: 16
- `reliabilityProof`: 10
- `cloudReadiness`: 5
- `costEfficiency`: 8
- `integrationSimplicity`: 7
- `safetyAndControl`: 8
- `totalScore`: 74

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
