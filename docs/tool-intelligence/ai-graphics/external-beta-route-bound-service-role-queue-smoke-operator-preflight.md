# AI Graphics External-Beta Route-Bound Service-Role Queue Smoke Operator Preflight

Decision: `ai_graphics_external_beta_route_bound_service_role_queue_smoke_operator_preflight_prepared_with_runtime_blocks`

Status: `route_bound_service_role_queue_smoke_operator_preflight_ready_execution_still_blocked`

## Summary

This packet adds the side-effect-free operator preflight for a later private non-production route-bound service-role queue smoke. It verifies the accepted result-capture contract, required non-production operator environment, required IDs, private refs, and source proof-bridge flag before any Supabase client, queue write, worker dispatch, tool execution, GPU startup, beta traffic, or production path can happen.

The preflight does not return service-role credential values. It only reports masked presence booleans.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-result-capture-contract.json`
- `docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-runbook-authorization.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-proof.json`
- `docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke.json`

## Scope

- Total AI graphics tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU-targeted tools tracked for later on-demand runtime: `8`
- Operator environment accepted tools with provided evidence: `21`
- Operator flags accepted tools with provided evidence: `21`
- Expected future queue rows before cleanup: `21`
- Expected future worker claim rows before cleanup: `21`
- Expected rows after cleanup: `0`

All tools covered: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.

## Required Operator Environment

- Explicit queue-smoke confirmation is required.
- Smoke environment must be `non_production`.
- Supabase URL presence is required but value is never returned.
- Supabase service-role key presence is required but value is never returned.
- E2E runtime mode must be `local`.
- Worker runtime mode must be `mock`.
- Node environment must not be production.
- Production flag must be absent.

## Required Flags And Refs

- `workspaceId`
- `projectId`
- `approvedPlanSnapshotId`
- `creditReservationId`
- `idempotencyPrefix`
- `routeBoundServiceRoleQueueSmokeResultCaptureRef`
- `routeBoundServiceRoleQueueSmokeEvidenceCaptureRef`
- `routeBoundServiceRoleQueueSmokeTelemetryCaptureRef`
- `routeBoundServiceRoleQueueSmokeCleanupProofCaptureRef`
- `routeBoundServiceRoleQueueSmokeProofValidatorRef`
- `routeBoundServiceRoleQueueSmokePostRunReviewRef`
- `serviceRoleQueueSmokeReadinessRef`
- `runtimeQueueServiceProofBridgeRef`
- `sourceRuntimeQueueServiceProofBridgeAccepted`

## Operator Preflight Policy

- Accepted route-bound result-capture contract required.
- Explicit operator confirmation required.
- Non-production environment required.
- Server-only service-role credentials required.
- Approved plan snapshot, credit reservation, and idempotency prefix required.
- Private result, evidence, telemetry, and cleanup refs required.
- No Supabase client creation.
- No service-role queue smoke.
- No backend queue submission.
- No live queue write.
- No worker dispatch.
- No tool execution.
- GPU runtime is on-demand only.
- Idle GPU runtime is not approved.

## Allowed Preflight Actions

- Read accepted route-bound service-role queue-smoke result capture contract metadata.
- Verify required non-production operator environment variable presence without returning secret values.
- Verify required private refs and IDs are present before a later smoke run.
- Verify source runtime queue service proof bridge acceptance flag is present.
- Preserve GPU startup as on-demand only for a later accepted worker/tool job.

## Blocked Runtime Actions

- Supabase client creation.
- API route execution.
- Route-bound service-role queue smoke run approval now.
- Service-role queue smoke execution now.
- Backend queue submission.
- Service-role transaction.
- Live queue write.
- Worker execution.
- Tool execution.
- Provider/model execution.
- Browser/WebGL/canvas runtime execution.
- GPU/model runtime execution now.
- Idle or always-on GPU runtime.
- Signed URL creation.
- Public artifact creation.
- External beta traffic enablement.
- Production unlock.

## Required Booleans

- `externalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflightPrepared`: `true`
- `sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractAccepted`: `true`
- `routeBoundServiceRoleQueueSmokeOperatorPreflightReadyWithProvidedEvidence`: `true`
- `operatorEnvironmentAccepted`: `true`
- `operatorFlagsAccepted`: `true`
- `privateNonProductionOnly`: `true`
- `serviceRoleCredentialsServerOnly`: `true`
- `noServiceRoleCredentialValueReturned`: `true`
- `all21ToolsCovered`: `true`
- `all12CapabilitiesCovered`: `true`
- `all8GpuToolsTargetGpuRuntime`: `true`
- `gpuRuntimeOnDemandOnly`: `true`
- `noIdleGpuRuntimeApproved`: `true`
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: `true`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteToolsNow`: `false`
- `routeBoundServiceRoleQueueSmokeRunApprovedNow`: `false`
- `serviceRoleQueueSmokeApprovedNow`: `false`
- `liveServiceRoleQueueSmokeExecutedNow`: `false`
- `backendQueueSubmissionApprovedNow`: `false`
- `liveQueueWriteApprovedNow`: `false`
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

1. QA the route-bound service-role queue-smoke operator preflight.
2. Run the private non-production route-bound service-role queue smoke only after a human/operator intentionally executes the harness with server-only credentials.
3. Validate the saved sanitized result with `ai-graphics:external-beta-service-role-queue-smoke-proof` before worker dispatch or tool execution is reconsidered.
