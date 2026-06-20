# Vega Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `vega`
- `displayName`: Vega
- `packageName`: `vega`
- `capabilities`: `chart_overlay`, `data_visualization`, `planning_metadata_only`
- `bestFor`: compiled/parsed Vega spec validation; lower-level chart spec metadata
- `notFor`: simple declarative chart when Vega-Lite suffices; browser View render now
- `inputTypes`: `minimal_vega_spec_fixture`, `compiled_chart_spec_plan`
- `outputTypes`: `parsed_spec_metadata_json`
- `proofStatus`: `canonical_package_proof_and_cpu_static_validation_passed`
- `runtimeStatus`: `planning_metadata_only_runtime_blocked`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `cloud_run_cpu_job_for_static_validation_then_overlay_later`
- `costClass`: `low`
- `latencyClass`: `low`
- `qualityClass`: `high`
- `integrationComplexity`: `medium`
- `safetyLimitations`: View rendering not approved
- `fallbacks`: `vega_lite`, `d3`
- `tier`: `Tier A`
- `totalScore`: `88`
- `nextProofMilestone`: `cpu_static_owner_qa_then_tool_route_metadata_handoff`

## Scoring

- `capabilityFit`: 23
- `outputQualityPotential`: 17
- `reliabilityProof`: 15
- `cloudReadiness`: 8
- `costEfficiency`: 8
- `integrationSimplicity`: 8
- `safetyAndControl`: 9
- `totalScore`: 88

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
