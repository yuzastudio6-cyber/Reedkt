# AI Graphics External-Beta Route-Bound Service-Role Queue Smoke Authorization Bridge

Decision: `ai_graphics_external_beta_route_bound_service_role_queue_smoke_authorization_bridge_prepared_with_runtime_blocks`

Status: `route_bound_service_role_queue_smoke_authorization_bridge_ready_runtime_still_blocked`

## Summary

This packet bridges the accepted route-to-live-enqueue authorization evidence to the all-21 service-role queue-smoke authorization evidence. It proves that the private route-bound candidates for `d3` and `sam2` can be matched to service-role queue-smoke authorization scope before any live queue write is attempted.

The bridge is still planning/readiness metadata only. It does not mount or execute the API route, run a service-role smoke, submit a queue job, enqueue or dispatch a worker, execute a tool, start GPU runtime, create a signed URL, create a public artifact, unlock external beta traffic, or unlock production.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-route-to-live-enqueue-authorization-bridge.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json`
- `docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json`

## Scope

- Total AI graphics tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU-targeted tools tracked for later on-demand runtime: `8`
- Route-bound service-role queue-smoke authorization candidates: `2`
- CPU/static candidate: `d3`
- GPU/model candidate: `sam2`

All tools covered: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.

## Candidates

| Tool | Capability | Runtime target | Worker type | GPU allowed for later accepted job | GPU starts now |
| --- | --- | --- | --- | --- | --- |
| `d3` | `chart_overlay` | `node_cpu_static` | `render_worker` | `false` | `false` |
| `sam2` | `subject_segmentation` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `gpu_ai_worker` | `true` | `false` |

Both candidates remain `prepared_not_submitted`.

## Allowed Bridge Actions

- Read accepted route-to-live-enqueue authorization bridge metadata.
- Read accepted all-21 service-role queue-smoke authorization metadata.
- Match route-bound `d3` and `sam2` candidates to service-role smoke authorization scope.
- Keep queue jobs in `prepared_not_submitted` state with no live queue writes.
- Preserve GPU startup as on-demand only for a later accepted worker/tool job.

## Blocked Runtime Actions

- App route mount.
- API route execution.
- Route-bound service-role queue-smoke authorization approval now.
- Service-role queue-smoke execution now.
- Approved snapshot mutation.
- Credit reservation mutation.
- Private artifact write.
- Backend queue submission.
- Service-role transaction.
- Live queue write.
- Worker queue enqueue, lease creation, dispatch, or execution.
- Tool execution.
- Provider/model execution.
- Browser/WebGL/canvas runtime execution.
- GPU/model runtime execution now.
- Idle or always-on GPU runtime.
- Model weight download or load.
- Media processing.
- Supabase/GCS mutation.
- Signed URL creation.
- Public artifact creation.
- External beta traffic enablement.
- Production unlock.

## Readiness Counts

| Field | Value |
| --- | ---: |
| `routeBoundServiceRoleQueueSmokeAuthorizationBridgeReadyToolsWithProvidedEvidence` | `21` |
| `sourceRouteToLiveEnqueueAuthorizationBridgeReadyToolsWithProvidedEvidence` | `21` |
| `sourceServiceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence` | `21` |
| `routeBoundServiceRoleQueueSmokeAuthorizationCandidatesWithProvidedEvidence` | `2` |
| `cpuStaticRouteBoundServiceRoleQueueSmokeAuthorizationCandidatesWithProvidedEvidence` | `1` |
| `gpuModelRouteBoundServiceRoleQueueSmokeAuthorizationCandidatesWithProvidedEvidence` | `1` |
| `serviceRoleQueueSmokeApprovedNowTools` | `0` |
| `liveQueueWritesPerformedNowTools` | `0` |
| `workerDispatchesApprovedNow` | `0` |
| `toolExecutionsApprovedNow` | `0` |
| `gpuRuntimeShouldStartNowTools` | `0` |
| `externalBetaReadyNowTools` | `0` |
| `productionReadyNowTools` | `0` |

## Required Booleans

- `externalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridgePrepared`: `true`
- `sourceRouteToLiveEnqueueAuthorizationBridgeAccepted`: `true`
- `sourceServiceRoleQueueSmokeAuthorizationAccepted`: `true`
- `routeBoundServiceRoleQueueSmokeAuthorizationCandidatesAccepted`: `true`
- `routeBoundServiceRoleQueueSmokeAuthorizationBridgeReadyWithProvidedEvidence`: `true`
- `cpuStaticRouteBoundServiceRoleQueueSmokeAuthorizationAccepted`: `true`
- `gpuModelRouteBoundServiceRoleQueueSmokeAuthorizationAccepted`: `true`
- `serviceRoleQueueSmokeAuthorizationRecordAcceptedFromSource`: `true`
- `all21ToolsCovered`: `true`
- `all12CapabilitiesCovered`: `true`
- `all8GpuToolsTargetGpuRuntime`: `true`
- `gpuRuntimeOnDemandOnly`: `true`
- `noIdleGpuRuntimeApproved`: `true`
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: `true`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteToolsNow`: `false`
- `apiRouteExecutionApprovedNow`: `false`
- `routeBoundServiceRoleQueueSmokeAuthorizationApprovedNow`: `false`
- `serviceRoleQueueSmokeApprovedNow`: `false`
- `liveServiceRoleQueueSmokeExecutedNow`: `false`
- `backendQueueSubmissionApprovedNow`: `false`
- `serviceRoleQueueTransactionApprovedNow`: `false`
- `liveQueueWriteApprovedNow`: `false`
- `workerEnqueueApprovedNow`: `false`
- `workerDispatchApprovedNow`: `false`
- `toolExecutionApprovedNow`: `false`
- `providerRuntimeApprovedNow`: `false`
- `browserWebglCanvasRuntimeApprovedNow`: `false`
- `gpuRuntimeApprovedNow`: `false`
- `gpuRuntimeShouldStartNow`: `false`
- `runtimeReadyNow`: `false`
- `externalBetaReadyNow`: `false`
- `productionReadyNow`: `false`
- `dependencyInstallPerformed`: `false`
- `packageLockMutationPerformed`: `false`
- `toolExecutionPerformed`: `false`
- `serviceRoleQueueSmokePerformed`: `false`
- `serviceRoleTransactionPerformed`: `false`
- `supabaseMutationPerformed`: `false`
- `liveQueueWritePerformed`: `false`
- `workerDispatchPerformed`: `false`
- `gpuRuntimePerformed`: `false`
- `publicArtifactCreated`: `false`
- `signedUrlCreated`: `false`

## Next Milestones

1. QA the private route-bound service-role queue-smoke authorization bridge while queue writes remain blocked.
2. Add a route-bound service-role queue-smoke preflight/run gate before any live queue write is attempted.
3. Run one private non-production route-bound service-role queue smoke only after explicit operator authorization.
