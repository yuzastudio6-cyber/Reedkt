# AI Graphics External-Beta Route-Bound Service-Role Queue Smoke Result Capture Contract

Decision: `ai_graphics_external_beta_route_bound_service_role_queue_smoke_result_capture_contract_prepared_with_runtime_blocks`

Status: `route_bound_service_role_queue_smoke_result_capture_contract_ready_execution_still_blocked`

## Summary

This packet binds the route-bound service-role queue-smoke runbook authorization to the existing saved-result-only service-role queue smoke proof validator. It prepares the private result, evidence, telemetry, cleanup-proof, proof-validator, and post-run review contract that a later explicitly authorized non-production route-bound smoke must satisfy.

The contract is readiness metadata only. It does not run the route, run a service-role smoke, submit queue rows, enqueue or dispatch workers, execute tools, call providers/models, start browser/WebGL/canvas runtime, start GPU/model runtime, mutate Supabase/GCS, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-runbook-authorization.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-proof.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-readiness.json`

## Scope

- Total AI graphics tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU-targeted tools tracked for later on-demand runtime: `8`
- Result capture tool contracts prepared: `21`
- Expected future queue rows before cleanup: `21`
- Expected future worker claim rows before cleanup: `21`
- Expected rows after cleanup: `0`

All tools covered: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.

## Required Private Refs

- `routeBoundServiceRoleQueueSmokeResultCaptureRef`: `private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/result.json`
- `routeBoundServiceRoleQueueSmokeEvidenceCaptureRef`: `private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/evidence.json`
- `routeBoundServiceRoleQueueSmokeTelemetryCaptureRef`: `private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/telemetry.json`
- `routeBoundServiceRoleQueueSmokeCleanupProofCaptureRef`: `private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/cleanup-proof.json`
- `routeBoundServiceRoleQueueSmokeProofValidatorRef`: `ai-graphics:external-beta-service-role-queue-smoke-proof`
- `routeBoundServiceRoleQueueSmokePostRunReviewRef`: `route-bound-smoke://post-run-review/required-v1`

## Saved Result Acceptance Contract

| Field | Required value |
| --- | --- |
| `decision` | `ai_graphics_external_beta_service_role_queue_smoke_passed_with_cleanup` |
| `status` | `external_beta_service_role_queue_smoke_passed_with_cleanup_no_tool_execution` |
| `toolsSubmitted` | `21` |
| `jobIdsReturned` | `21` |
| `workerClaimsReturned` | `21` |
| `liveSupabaseQueueWritesNow` | `21` |
| `liveWorkerClaimRowsNow` | `21` |
| `liveWorkerDispatchesNow` | `0` |
| `liveToolExecutionsNow` | `0` |
| `fixtureRowsPersistedAfterCleanup` | `0` |
| `gpuRuntimeShouldStartNow` | `false` |
| `externalBetaReadyNowTools` | `0` |
| `productionReadyNowTools` | `0` |

## Proof Validator Command

```bash
npm run --silent ai-graphics:external-beta-service-role-queue-smoke-proof -- \
  --external-beta-service-role-queue-smoke-readiness-packet <readiness-packet.json> \
  --external-beta-service-role-queue-smoke-result <saved-sanitized-route-bound-smoke-result.json> \
  --external-beta-service-role-queue-smoke-evidence-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/evidence.json \
  --external-beta-service-role-queue-smoke-telemetry-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/telemetry.json \
  --external-beta-service-role-queue-smoke-cleanup-proof-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/cleanup-proof.json
```

This command validates a saved sanitized result only. It does not run the smoke.

## Allowed Result Capture Actions

- Read accepted route-bound service-role queue-smoke runbook authorization metadata.
- Read the saved-result-only service-role queue smoke proof validator metadata.
- Prepare all-21 private result/evidence/telemetry/cleanup capture contracts.
- Bind the later sanitized saved smoke result to private evidence refs.
- Preserve GPU startup as on-demand only for a later accepted worker/tool job.

## Blocked Runtime Actions

- App route mount.
- API route execution.
- Route-bound service-role queue smoke run approval now.
- Service-role queue smoke execution by this contract.
- Backend queue submission.
- Service-role transaction.
- Live queue write by this contract.
- Worker queue enqueue, lease creation, dispatch, or execution.
- Tool execution.
- Provider/model execution.
- Browser/WebGL/canvas runtime execution.
- GPU/model runtime execution now.
- Idle or always-on GPU runtime.
- Model weight download or load.
- Media processing.
- Supabase/GCS mutation by this contract.
- Signed URL creation.
- Public artifact creation.
- External beta traffic enablement.
- Production unlock.

## Required Booleans

- `externalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContractPrepared`: `true`
- `sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationAccepted`: `true`
- `sourceServiceRoleQueueSmokeProofValidatorAccepted`: `true`
- `routeBoundServiceRoleQueueSmokeResultCaptureContractReadyWithProvidedEvidence`: `true`
- `routeBoundServiceRoleQueueSmokeResultCaptureToolContractsAccepted`: `true`
- `routeBoundResultCaptureRefsAccepted`: `true`
- `privateResultCaptureOnly`: `true`
- `sanitizedSavedResultRequired`: `true`
- `cleanupProofRequired`: `true`
- `telemetryRequired`: `true`
- `postRunReviewRequired`: `true`
- `all21ToolsCovered`: `true`
- `all12CapabilitiesCovered`: `true`
- `all8GpuToolsTargetGpuRuntime`: `true`
- `all21RouteBoundResultCaptureContractsPrepared`: `true`
- `gpuRuntimeOnDemandOnly`: `true`
- `noIdleGpuRuntimeApproved`: `true`
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: `true`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteToolsNow`: `false`
- `routeBoundServiceRoleQueueSmokeRunApprovedNow`: `false`
- `serviceRoleQueueSmokeApprovedNow`: `false`
- `serviceRoleQueueSmokePerformedByThisContract`: `false`
- `liveServiceRoleQueueSmokeExecutedNow`: `false`
- `liveQueueWriteApprovedNow`: `false`
- `liveQueueWritePerformedByThisContract`: `false`
- `workerDispatchApprovedNow`: `false`
- `toolExecutionApprovedNow`: `false`
- `gpuRuntimeShouldStartNow`: `false`
- `runtimeReadyNow`: `false`
- `externalBetaReadyNow`: `false`
- `productionReadyNow`: `false`
- `dependencyInstallPerformed`: `false`
- `packageLockMutationPerformed`: `false`
- `toolExecutionPerformed`: `false`
- `serviceRoleQueueSmokePerformed`: `false`
- `supabaseMutationPerformed`: `false`
- `liveQueueWritePerformed`: `false`
- `workerDispatchPerformed`: `false`
- `gpuRuntimePerformed`: `false`
- `publicArtifactCreated`: `false`
- `signedUrlCreated`: `false`

## Next Milestones

1. QA the route-bound service-role queue-smoke result capture contract.
2. Run the private non-production route-bound service-role queue smoke only after explicit operator authorization and server-only credentials are present.
3. Validate the saved sanitized result with `ai-graphics:external-beta-service-role-queue-smoke-proof` before worker dispatch or tool execution is reconsidered.
