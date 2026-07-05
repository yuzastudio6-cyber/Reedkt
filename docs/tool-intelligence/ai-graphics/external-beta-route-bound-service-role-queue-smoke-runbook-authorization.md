# AI Graphics External-Beta Route-Bound Service-Role Queue Smoke Runbook Authorization

Decision: `ai_graphics_external_beta_route_bound_service_role_queue_smoke_runbook_authorization_prepared_with_runtime_blocks`

Status: `route_bound_service_role_queue_smoke_runbook_authorization_ready_execution_still_blocked`

## Summary

This packet adds the private non-production runbook authorization layer after the accepted route-bound service-role queue-smoke preflight/run gate. It accepts the all-21 service-role queue smoke harness, prepares the all-21 runbook payload shape, and records the operator, environment, credential handling, idempotency, result, evidence, telemetry, cleanup, rollback, cost ceiling, and post-run review references required before any later route-bound smoke attempt.

The packet is still readiness metadata only. It does not mount or execute the API route, run a service-role smoke, submit queue rows, enqueue or dispatch workers, execute tools, call providers/models, start browser/WebGL/canvas runtime, start GPU/model runtime, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-preflight-run-gate.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke.json`
- `docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-authorization-bridge.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-preflight.json`
- `docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-proof-bridge.json`

## Scope

- Total AI graphics tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU-targeted tools tracked for later on-demand runtime: `8`
- Route-bound service-role queue-smoke runbook items prepared: `21`
- Representative CPU/static path: `d3`
- Representative GPU/model path: `sam2`

All tools covered: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.

## Required Runbook Refs

- `routeBoundServiceRoleQueueSmokeRunbookRef`: `route-bound-smoke://runbook/private-non-production-v1`
- `routeBoundServiceRoleQueueSmokeOperatorApprovalRef`: `route-bound-smoke://operator/approval-required-v1`
- `routeBoundServiceRoleQueueSmokeEnvironmentRef`: `route-bound-smoke://environment/non-production-only-v1`
- `routeBoundServiceRoleQueueSmokeCredentialHandlingRef`: `route-bound-smoke://credentials/server-only-service-role-v1`
- `routeBoundServiceRoleQueueSmokeIdempotencyPlanRef`: `route-bound-smoke://idempotency/unique-run-prefix-v1`
- `routeBoundServiceRoleQueueSmokeResultStorageRef`: `private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/result.json`
- `routeBoundServiceRoleQueueSmokeEvidenceStorageRef`: `private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/evidence.json`
- `routeBoundServiceRoleQueueSmokeTelemetryRef`: `private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/telemetry.json`
- `routeBoundServiceRoleQueueSmokeCleanupProofRef`: `private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/cleanup-proof.json`
- `routeBoundServiceRoleQueueSmokeRollbackRef`: `route-bound-smoke://rollback/no-persisted-rows-v1`
- `routeBoundServiceRoleQueueSmokeCostCeilingRef`: `route-bound-smoke://cost-ceiling/non-production-minimum-v1`
- `routeBoundServiceRoleQueueSmokePostRunReviewRef`: `route-bound-smoke://post-run-review/required-v1`

## Runbook Policy

- Private non-production runbook only.
- Accepted route-bound preflight/run gate required.
- Prepared all-21 service-role queue smoke harness required.
- Explicit operator approval required.
- Server-only service-role credentials required.
- Result and evidence refs must stay private.
- Cleanup proof, telemetry, rollback, cost ceiling, and post-run review are required.
- Queue jobs remain `prepared_not_submitted`.
- GPU runtime is on-demand only for a later accepted worker/tool job; no idle GPU runtime is approved.

## Allowed Runbook Actions

- Read accepted route-bound service-role queue-smoke preflight/run gate metadata.
- Read prepared all-21 service-role queue smoke harness metadata.
- Prepare all-21 queue-smoke payload runbook items without submitting queue jobs.
- Record private result, evidence, telemetry, cleanup, rollback, and cost refs for a later operator run.
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
| `routeBoundServiceRoleQueueSmokeRunbookAuthorizationReadyToolsWithProvidedEvidence` | `21` |
| `sourceRouteBoundServiceRoleQueueSmokePreflightRunGateReadyToolsWithProvidedEvidence` | `21` |
| `sourceServiceRoleQueueSmokeHarnessPreparedToolsWithProvidedEvidence` | `21` |
| `routeBoundServiceRoleQueueSmokeRunbookToolItemsPreparedWithProvidedEvidence` | `21` |
| `routeBoundRepresentativeCandidatesWithProvidedEvidence` | `2` |
| `cpuStaticRouteBoundRepresentativeCandidatesWithProvidedEvidence` | `1` |
| `gpuModelRouteBoundRepresentativeCandidatesWithProvidedEvidence` | `1` |
| `serviceRoleQueueSmokeApprovedNowTools` | `0` |
| `liveQueueWritesPerformedNowTools` | `0` |
| `workerDispatchesApprovedNow` | `0` |
| `toolExecutionsApprovedNow` | `0` |
| `gpuRuntimeShouldStartNowTools` | `0` |
| `externalBetaReadyNowTools` | `0` |
| `productionReadyNowTools` | `0` |

## Required Booleans

- `externalBetaRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPrepared`: `true`
- `sourceRouteBoundServiceRoleQueueSmokePreflightRunGateAccepted`: `true`
- `sourceServiceRoleQueueSmokeHarnessAccepted`: `true`
- `routeBoundServiceRoleQueueSmokeRunbookAuthorizationReadyWithProvidedEvidence`: `true`
- `routeBoundServiceRoleQueueSmokeRunbookToolItemsAccepted`: `true`
- `routeBoundRunbookRefsAccepted`: `true`
- `privateNonProductionRunbookOnly`: `true`
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
- `all21RouteBoundSmokeRunbookItemsPrepared`: `true`
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

1. QA the route-bound service-role queue-smoke runbook authorization while execution remains blocked.
2. Prepare private non-production smoke result capture paths and cleanup proof storage.
3. Run one route-bound non-production service-role queue smoke only after explicit operator authorization and server-only credentials are present.
