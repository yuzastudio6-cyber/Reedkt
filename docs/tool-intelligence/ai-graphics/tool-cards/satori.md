# Satori Tool Capability Card

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings`

- `toolId`: `satori`
- `displayName`: Satori
- `packageName`: `satori`
- `capabilities`: `svg_graphics`, `planning_metadata_only`
- `bestFor`: JSX/HTML-style graphic manifest planning; card-like static graphic contract metadata
- `notFor`: font/SVG artifact rendering now; chart specs
- `inputTypes`: `static_jsx_like_manifest_fixture`
- `outputTypes`: `manifest_contract_metadata_json`
- `proofStatus`: `canonical_package_proof_and_cpu_static_validation_passed`
- `runtimeStatus`: `planning_metadata_only_runtime_blocked`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteNow`: `false`
- `cpuGpuBrowserTarget`: `cloud_run_cpu_job_for_static_contract_then_svg_artifact_review_later`
- `costClass`: `low`
- `latencyClass`: `low`
- `qualityClass`: `high_after_render_proof`
- `integrationComplexity`: `medium`
- `safetyLimitations`: font render/artifact creation not approved
- `fallbacks`: `svgdotjs_svg_js`, `d3`
- `tier`: `Tier A`
- `totalScore`: `84`
- `nextProofMilestone`: `cpu_static_owner_qa_then_output_artifact_boundary_review`

## Scoring

- `capabilityFit`: 22
- `outputQualityPotential`: 17
- `reliabilityProof`: 15
- `cloudReadiness`: 7
- `costEfficiency`: 8
- `integrationSimplicity`: 7
- `safetyAndControl`: 8
- `totalScore`: 84

## Elimination Rules

- Eliminate if capability mismatch.
- Eliminate if proof status is below required proof.
- Eliminate if browser/WebGL/canvas is required but not approved.
- Eliminate if GPU/model weights are required but not approved.
- Eliminate if public artifact/signed URL is required but not approved.
- Eliminate if Tool Route/Worker execution is required but not approved.
- Eliminate if another simpler tool covers the same purpose with lower cost.
- Eliminate if tool is marked deferred/backlog.
