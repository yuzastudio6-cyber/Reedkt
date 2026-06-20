# AI Graphics CPU Static Spec Validation Refreshed Result

Decision: `ai_graphics_cpu_static_spec_validation_refreshed_execution_passed_with_warnings`

## Result Summary

The refreshed CPU/static validation execution completed against the dependency-bearing Batch 3 base. `npm ci` was performed from the existing lockfile only. No dependency install outside `npm ci`, package-lock mutation, dependency mutation, browser/WebGL/canvas runtime, Tool Route execution, Worker execution, provider/model runtime, Supabase/GCS, signed URL, public artifact, beta, or production unlock was performed.

| Tool | Result |
| --- | --- |
| `d3` | `cpu_static_metadata_validation_passed` |
| `vega_lite` | `cpu_static_spec_compile_or_validation_passed` |
| `vega` | `cpu_static_spec_parse_or_validation_passed` |
| `satori` | `cpu_static_manifest_contract_validation_passed_with_no_render` |
| `svgdotjs_svg_js` | `cpu_static_manifest_contract_validation_passed_with_no_dom_runtime` |
| `viz_js` | `cpu_static_dot_metadata_validation_passed` |

## Required Booleans

| Field | Value |
| --- | --- |
| cpuStaticSpecValidationRefreshedExecutionCompleted | `true` |
| sourceReconciliationAccepted | `true` |
| refreshedBaseUsed | `true` |
| dependenciesPresentFromFreshBase | `true` |
| all6CpuStaticToolsExecutedOrContractValidated | `true` |
| d3StaticValidationPassed | `true` |
| vegaLiteStaticValidationPassed | `true` |
| vegaStaticValidationPassed | `true` |
| satoriStaticContractValidationPassed | `true` |
| svgdotjsStaticContractValidationPassed | `true` |
| vizJsStaticValidationPassed | `true` |
| npmCiPerformed | `true` |
| dependencyInstallPerformed | `false` |
| packageLockMutationPerformed | `false` |
| importSmokeExecutedNow | `false` |
| syntheticFixtureExecutedNow | `false` |
| browserRuntimePerformed | `false` |
| webglCanvasRuntimePerformed | `false` |
| gpuRuntimePerformed | `false` |
| toolRouteExecutionPerformed | `false` |
| workerExecutionPerformed | `false` |
| providerRuntimePerformed | `false` |
| supabaseMutationPerformed | `false` |
| gcsUploadPerformed | `false` |
| publicArtifactCreated | `false` |
| signedUrlCreated | `false` |
| runtimeReadyNow | `false` |
| internalBetaReadyNow | `false` |
| productionReadyNow | `false` |

## Local Evidence

Detailed local evidence was written only under `.local-artifacts/open-source-tool-stack/ai-graphics/cpu-static-spec-validation/ai-graphics-cpu-static-spec-validation-refreshed-local-static/` and is intentionally ignored.

## Validation Status

- `npm ci`: passed from the existing lockfile.
- Refreshed executor: passed.
- Refreshed diagnostic: passed.
- Central open-source audit diagnostic: passed.
- Present Batch 1/2/3 AI graphics package-proof diagnostics: passed.
- Production readiness summary: ran and remained blocked.
- Beta summary: ran; external beta and paid production remained blocked.
- Lint, server typecheck, `npx tsc -b`, build, and server build: passed.
- Changed-file secret scan: passed.
- Package-lock unchanged check: passed.
- `.local-artifacts/` ignored and not staged.

The later stacked `ai-graphics:*` diagnostics from PR #614/#607/#604 are unavailable on the fresh dependency-bearing Batch 3 base and are represented by source-lockfile citations instead.
