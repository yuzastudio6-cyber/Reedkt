# AI Graphics External-Beta Route-Bound Service-Role Queue Smoke Preflight Run Gate

Decision: `ai_graphics_external_beta_route_bound_service_role_queue_smoke_preflight_run_gate_prepared_with_runtime_blocks`

Status: `route_bound_service_role_queue_smoke_preflight_run_gate_ready_execution_still_blocked`

## Summary

This packet adds the route-bound preflight/run gate between the accepted service-role queue-smoke authorization bridge and any later private non-production smoke attempt. It accepts the route-bound `d3` and `sam2` candidates from the authorization bridge, verifies the all-21 service-role queue-smoke preflight contract, and records the operator, environment, run-window, queue-write-window, cleanup, rollback, telemetry, and cost-ceiling references that must exist before a later smoke can be attempted.

The packet is still readiness metadata only. It does not mount or execute the API route, run a service-role smoke, submit queue rows, enqueue or dispatch workers, execute tools, start GPU runtime, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-authorization-bridge.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json`
- `docs/tool-intelligence/ai-graphics/external-beta-route-to-live-enqueue-authorization-bridge.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.json`
- `docs/tool-intelligence/ai-graphics/external-beta-live-enqueue-authorization.json`

## Scope

- Total AI graphics tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU-targeted tools tracked for later on-demand runtime: `8`
- Route-bound preflight/run gate candidates: `2`
- CPU/static candidate: `d3`
- GPU/model candidate: `sam2`

All tools covered: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.

## Required Run Gate Refs

- `routeBoundServiceRoleQueueSmokeRunGateRef`: `route-bound-smoke://run-gate/2026-06-30/private-non-production`
- `routeBoundServiceRoleQueueSmokeOperatorRef`: `route-bound-smoke://operator/explicit-approval-required`
- `routeBoundServiceRoleQueueSmokeReadinessRef`: `route-bound-smoke://readiness/pr-862`
- `routeBoundServiceRoleQueueSmokePreflightRef`: `route-bound-smoke://preflight/service-role-queue-smoke`
- `routeBoundServiceRoleQueueSmokeEnvironmentRef`: `route-bound-smoke://environment/non-production-only`
- `routeBoundServiceRoleQueueSmokeRouteExecutionWindowRef`: `route-bound-smoke://window/route-execution-controlled`
- `routeBoundServiceRoleQueueSmokeQueueWriteWindowRef`: `route-bound-smoke://window/queue-write-controlled`
- `routeBoundServiceRoleQueueSmokeCleanupPlanRef`: `route-bound-smoke://cleanup/required`
- `routeBoundServiceRoleQueueSmokeRollbackPlanRef`: `route-bound-smoke://rollback/required`
- `routeBoundServiceRoleQueueSmokeTelemetryRef`: `route-bound-smoke://telemetry/required`
- `routeBoundServiceRoleQueueSmokeCostCeilingRef`: `route-bound-smoke://cost-ceiling/required`

## Candidates

| Tool | Capability | Runtime target | Worker type | GPU allowed for later accepted job | GPU starts now |
| --- | --- | --- | --- | --- | --- |
| `d3` | `chart_overlay` | `node_cpu_static` | `render_worker` | `false` | `false` |
| `sam2` | `subject_segmentation` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `gpu_ai_worker` | `true` | `false` |

Both candidates remain `prepared_not_submitted`.

## Allowed Gate Actions

- Read accepted route-bound service-role queue-smoke authorization bridge metadata.
- Read accepted all-21 service-role queue smoke preflight metadata.
- Verify private operator, run-window, rollback, telemetry, and cost refs exist.
- Prepare route-bound `d3` and `sam2` smoke candidates without submitting queue jobs.
- Preserve GPU startup as on-demand only for a later accepted worker/tool job.

## Blocked Runtime Actions

- App route mount.
- API route execution.
- Route-bound service-role queue smoke run approval now.
- Service-role queue smoke execution now.
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
| `routeBoundServiceRoleQueueSmokePreflightRunGateReadyToolsWithProvidedEvidence` | `21` |
| `sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeReadyToolsWithProvidedEvidence` | `21` |
| `sourceServiceRoleQueueSmokePreflightReadyToolsWithProvidedEvidence` | `21` |
| `routeBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence` | `2` |
| `cpuStaticRouteBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence` | `1` |
| `gpuModelRouteBoundServiceRoleQueueSmokePreflightRunGateCandidatesWithProvidedEvidence` | `1` |
| `serviceRoleQueueSmokeApprovedNowTools` | `0` |
| `liveQueueWritesPerformedNowTools` | `0` |
| `workerDispatchesApprovedNow` | `0` |
| `toolExecutionsApprovedNow` | `0` |
| `gpuRuntimeShouldStartNowTools` | `0` |
| `externalBetaReadyNowTools` | `0` |
| `productionReadyNowTools` | `0` |

## Required Booleans

- `externalBetaRouteBoundServiceRoleQueueSmokePreflightRunGatePrepared`: `true`
- `sourceRouteBoundServiceRoleQueueSmokeAuthorizationBridgeAccepted`: `true`
- `sourceServiceRoleQueueSmokePreflightAccepted`: `true`
- `routeBoundServiceRoleQueueSmokePreflightRunGateReadyWithProvidedEvidence`: `true`
- `routeBoundServiceRoleQueueSmokePreflightRunGateCandidatesAccepted`: `true`
- `routeBoundOperatorRefsAccepted`: `true`
- `cpuStaticRouteBoundServiceRoleQueueSmokeRunGateAccepted`: `true`
- `gpuModelRouteBoundServiceRoleQueueSmokeRunGateAccepted`: `true`
- `privateRouteBoundServiceRoleQueueSmokeRunGateOnly`: `true`
- `queueJobPreparedNotSubmittedOnly`: `true`
- `serviceRoleCredentialsServerOnly`: `true`
- `nonProductionEnvironmentRequired`: `true`
- `explicitSmokeConfirmationRequired`: `true`
- `cleanupRequired`: `true`
- `rollbackRequired`: `true`
- `telemetryRequired`: `true`
- `costCeilingRequired`: `true`
- `all21ToolsCovered`: `true`
- `all12CapabilitiesCovered`: `true`
- `all8GpuToolsTargetGpuRuntime`: `true`
- `gpuRuntimeOnDemandOnly`: `true`
- `noIdleGpuRuntimeApproved`: `true`
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: `true`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteToolsNow`: `false`
- `apiRouteExecutionApprovedNow`: `false`
- `routeBoundServiceRoleQueueSmokeRunApprovedNow`: `false`
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

1. QA the route-bound service-role queue-smoke preflight/run gate while queue writes remain blocked.
2. Prepare a private non-production route-bound queue-smoke runbook with explicit operator approval.
3. Attempt one non-production route-bound service-role queue smoke only after operator, environment, cleanup, rollback, telemetry, and cost ceiling refs are accepted.
