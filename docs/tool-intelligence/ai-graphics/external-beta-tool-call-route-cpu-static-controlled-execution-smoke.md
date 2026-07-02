# AI Graphics External Beta Canonical Tool-Call CPU Static Controlled Execution Smoke

Decision: `ai_graphics_external_beta_tool_call_route_cpu_static_controlled_execution_smoke_passed`

Status: `canonical_tool_call_route_cpu_static_controlled_execution_passed_for_six_tools`

This smoke proves the canonical external-beta tool-call route can execute the six proven CPU/static tools when `AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_ENABLED` is explicitly enabled. It keeps the other fifteen AI graphics tools blocked on this canonical route unless their own runtime proof gates are enabled later.

## CPU/Static Executed Tools

| Tool | Capability | HTTP status | Adapter executed | Output kind | Private output SHA-256 |
| --- | --- | --- | --- | --- | --- |
| `d3` | `chart_overlay` | `200` | `true` | `svg_private_artifact_candidate` | `b47b8e006d730f9e7494f854f9ffac9963fa4a4be11acc9ad067bb6d2a53b7ef` |
| `vega_lite` | `chart_overlay` | `200` | `true` | `vega_lite_compiled_spec_metadata` | `69d2d01ec40c6a1baf26dee726788787a7eca0c15cd724ce5f600a197921ad70` |
| `vega` | `chart_overlay` | `200` | `true` | `vega_parsed_spec_metadata` | `0467d176faa6481480d43e978759a947b4ca11fe05a655ffbbfb4bc9b4ca5273` |
| `satori` | `svg_graphics` | `200` | `true` | `svg_private_artifact_candidate` | `5373ceb763423c434287d19f3ca4eddfa4faafb9c973d73b8cb333daf14edf9b` |
| `svgdotjs_svg_js` | `svg_graphics` | `200` | `true` | `svg_private_artifact_candidate` | `1b4371b87611e269cdad42d3e1d4e12c4d4ac74dac14dc1175f6e464c10c3880` |
| `viz_js` | `diagram_graphics` | `200` | `true` | `svg_private_artifact_candidate` | `41df4bbd201b472bed7df9e34788c12e842f9b646fc1d462b6d45dc18ccbe2ab` |

## Counts

- `totalAiGraphicsTools`: 21
- `cpuStaticControlledCanonicalRouteExecutedTools`: 6
- `localCpuStaticPackageExecutionPerformedTools`: 6
- `controlledAdapterExecutedTools`: 6
- `nonCpuStaticBlockedTools`: 15
- `all21ExecutableNowTools`: 0
- `workerDispatchPerformedTools`: 0
- `gpuRuntimeShouldStartNowTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0

## Booleans

- `canonicalToolCallRouteCpuStaticControlledExecutionSmokePassed`: true
- `canonicalToolCallRouteMountedWithCpuStaticExecutionFlag`: true
- `sixCpuStaticToolsExecutableViaCanonicalRouteNow`: true
- `sixCpuStaticToolsExecutedViaCanonicalRouteNow`: true
- `localCpuStaticPackageExecutionPerformed`: true
- `privateOutputMetadataReturned`: true
- `nonCpuStaticToolsRemainBlocked`: true
- `agentCanExecuteCpuStaticControlledToolsNow`: true
- `agentCanExecuteAll21ToolsNow`: false
- `workerExecutionApprovedNow`: false
- `workerDispatchPerformed`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimePerformed`: false
- `gpuRuntimePerformed`: false
- `gpuRuntimeShouldStartNow`: false
- `supabaseMutationPerformed`: false
- `gcsUploadPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false
- `runtimeReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false

## Boundary

No Worker dispatch, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is performed by this smoke. The adapter returns private artifact metadata and SHA-256 hashes only.
