# AI Graphics External Agent Controlled Worker Route Execution Smoke

Decision: `ai_graphics_external_agent_controlled_worker_route_execution_smoke_passed_with_runtime_blocks`

Status: `controlled_worker_claim_route_execution_passed_for_thirteen_tools_gpu_model_still_blocked`

This smoke proves the external-agent path can create mock worker queue jobs, claim those jobs, execute the canonical controlled route for the 13 currently proven CPU/static and browser/runtime tools, and record worker events against the claimed jobs. It preserves live service-role queue writes, worker dispatch, broad all-tool execution, GPU/model runtime, public artifacts, signed URLs, external beta unlock, and production unlock as blocked.

## Controlled Worker Route Executed Tools

| Tool | Group | Capability | HTTP status | Adapter executed | Local package execution | Output kind | Private output SHA-256 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `d3` | `cpu_static` | `chart_overlay` | `200` | `true` | `true` | `svg_private_artifact_candidate` | `b47b8e006d730f9e7494f854f9ffac9963fa4a4be11acc9ad067bb6d2a53b7ef` |
| `vega_lite` | `cpu_static` | `chart_overlay` | `200` | `true` | `true` | `vega_lite_compiled_spec_metadata` | `69d2d01ec40c6a1baf26dee726788787a7eca0c15cd724ce5f600a197921ad70` |
| `vega` | `cpu_static` | `chart_overlay` | `200` | `true` | `true` | `vega_parsed_spec_metadata` | `0467d176faa6481480d43e978759a947b4ca11fe05a655ffbbfb4bc9b4ca5273` |
| `satori` | `cpu_static` | `svg_graphics` | `200` | `true` | `true` | `svg_private_artifact_candidate` | `5373ceb763423c434287d19f3ca4eddfa4faafb9c973d73b8cb333daf14edf9b` |
| `svgdotjs_svg_js` | `cpu_static` | `svg_graphics` | `200` | `true` | `true` | `svg_private_artifact_candidate` | `1b4371b87611e269cdad42d3e1d4e12c4d4ac74dac14dc1175f6e464c10c3880` |
| `viz_js` | `cpu_static` | `diagram_graphics` | `200` | `true` | `true` | `svg_private_artifact_candidate` | `41df4bbd201b472bed7df9e34788c12e842f9b646fc1d462b6d45dc18ccbe2ab` |
| `echarts` | `browser_runtime` | `chart_overlay` | `200` | `true` | `true` | `browser_runtime_private_metadata` | `a28fe3b0c9d89ca9dcc91709d99272f8201df46916b31f63eb94b1288c92c40e` |
| `lottie_web` | `browser_runtime` | `animation_overlay` | `200` | `true` | `true` | `browser_runtime_private_metadata` | `33cb7aca04016b94b7378e946ed3f71186b2fcd1fe3844331c0e1ae716f55145` |
| `animejs` | `browser_runtime` | `animation_overlay` | `200` | `true` | `true` | `browser_runtime_private_metadata` | `d381074c0c0a05dba85ea9bd0bbee5f1ec26ae04ca4b005a6af432cec4683ec1` |
| `three_js` | `browser_runtime` | `webgl_3d_scene` | `200` | `true` | `true` | `browser_runtime_private_metadata` | `2772043539899ab4b9bb15ba71845323d90d99516de30e405dfb1ea814f63e9c` |
| `pixi_js` | `browser_runtime` | `canvas_scene` | `200` | `true` | `true` | `browser_runtime_private_metadata` | `3fe621f89fac91a591eba230ca2b24df6d4fafa7d172f9e425313e9f806f0651` |
| `konva` | `browser_runtime` | `canvas_scene` | `200` | `true` | `true` | `browser_runtime_private_metadata` | `b8f793930c556ca1abfbf85f3e50a0d959b681b9e32564c3f7995bf8710d1f02` |
| `babylonjs` | `browser_runtime` | `webgl_3d_scene` | `200` | `true` | `true` | `browser_runtime_private_metadata` | `c2da8372b5c891497d77b9af67a9ee36b008d5fa92668242054598f8bc60bee8` |

## Counts

- `totalAiGraphicsTools`: 21
- `totalProductFacingCapabilities`: 12
- `controlledWorkerRouteExecutionAttemptedTools`: 13
- `controlledWorkerRouteExecutionCompletedTools`: 13
- `mockQueueInsertedJobsWithProvidedEvidence`: 13
- `mockWorkerClaimsCreatedWithProvidedEvidence`: 13
- `mockWorkerEventsRecordedWithProvidedEvidence`: 13
- `controlledCanonicalRouteExecutedToolsWithProvidedEvidence`: 13
- `cpuStaticControlledCanonicalRouteExecutedToolsWithProvidedEvidence`: 6
- `browserRuntimeControlledCanonicalRouteExecutedToolsWithProvidedEvidence`: 7
- `localControlledPackageExecutionPerformedToolsWithProvidedEvidence`: 13
- `controlledAdapterExecutedToolsWithProvidedEvidence`: 13
- `gpuModelBlockedToolsWithProvidedEvidence`: 8
- `externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence`: 13
- `externalAgentBroadExecutableNowTools`: 0
- `workerDispatchPerformedTools`: 0
- `routeExecutionPerformedTools`: 13
- `toolExecutionPerformedTools`: 0
- `gpuRuntimeShouldStartNowTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `externalBetaReadyNowTools`: 0
- `productionReadyNowTools`: 0

## Booleans

- `externalAgentControlledWorkerRouteExecutionSmokePassed`: true
- `sourceRouteControlledExecutionSmokeAccepted`: true
- `mockQueueServiceClaimAccepted`: true
- `mockQueueServiceWorkerEventAccepted`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `thirteenControlledToolsClaimedBeforeRouteExecution`: true
- `thirteenControlledToolsExecutedViaClaimedCanonicalRoute`: true
- `sixCpuStaticToolsExecutedViaClaimedCanonicalRoute`: true
- `sevenBrowserRuntimeToolsExecutedViaClaimedCanonicalRoute`: true
- `eightGpuModelToolsRemainBlocked`: true
- `localControlledPackageExecutionPerformed`: true
- `controlledAdapterExecutionPerformed`: true
- `privateOutputMetadataReturned`: true
- `agentCanSelectForPlanning`: true
- `externalAgentCanExecuteControlledWorkerRouteToolsNow`: true
- `agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow`: true
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteGpuModelToolsNow`: false
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: true
- `routeExecutionPerformed`: true
- `mockWorkerClaimPerformed`: true
- `backendQueueSubmissionApprovedNow`: false
- `backendQueueSubmissionPerformed`: false
- `liveQueueWriteApprovedNow`: false
- `liveQueueWritePerformed`: false
- `workerExecutionApprovedNow`: false
- `workerExecutionPerformed`: false
- `workerEnqueueApprovedNow`: false
- `workerEnqueuePerformed`: false
- `workerDispatchApprovedNow`: false
- `workerDispatchPerformed`: false
- `toolExecutionApprovedNow`: false
- `toolExecutionPerformed`: false
- `providerRuntimeApprovedNow`: false
- `providerRuntimePerformed`: false
- `controlledLocalBrowserRuntimePerformed`: true
- `browserRuntimeStartedByCanonicalRoute`: true
- `browserWebglCanvasRuntimeApprovedNow`: false
- `browserWebglCanvasRuntimePerformed`: false
- `gpuRuntimeApprovedNow`: false
- `gpuRuntimePerformed`: false
- `gpuRuntimeShouldStartNow`: false
- `modelWeightsDownloaded`: false
- `modelWeightsLoaded`: false
- `modelInferencePerformed`: false
- `mediaProcessingPerformed`: false
- `supabaseMutationPerformed`: false
- `gcsUploadPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false
- `runtimeReadyNow`: false
- `internalBetaReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false

## Boundary

The smoke runs in explicit local/mock mode. GPU/model tools remain fail-closed and GPU runtime stays idle. The worker claim is a mock lease, not a live production Worker dispatch. The controlled route returns private artifact metadata and hashes only; it does not create signed URLs or public artifacts.
