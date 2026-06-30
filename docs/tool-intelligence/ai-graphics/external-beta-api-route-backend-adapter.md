# AI Graphics External Beta API Route Backend Adapter

Decision: `ai_graphics_external_beta_api_route_backend_adapter_preflight_ready_with_runtime_blocks`

Status: `backend_adapter_preflight_ready_runtime_still_blocked`

This packet adds the no-write backend adapter preflight surface for the future AI graphics external-beta tool-call route. It consumes the accepted backend adapter contract and accepted API route handler contract, creates backend-private adapter stubs, and keeps the route unmounted.

## Scope

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU/model runtime targeted tools: `8`
- Backend adapter preflight ready tools with provided evidence: `21`
- API route mounted now: `0`
- Route executions approved now: `0`
- Live queue writes approved now: `0`
- Worker enqueue approved now: `0`
- Tool executions approved now: `0`
- GPU runtime should start now: `0`
- External beta ready now: `0`
- Production ready now: `0`

Covered tools:

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/external-beta-api-route-backend-adapter-contract.json`
- `docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-contract.json`
- `docs/tool-intelligence/ai-graphics/external-beta-api-route-mount-implementation-qa.json`
- `docs/tool-intelligence/ai-graphics/external-beta-api-route-handler-gateway-full-proof.json`
- `docs/tool-intelligence/ai-graphics/external-beta-tool-call-gateway.json`
- `docs/tool-intelligence/ai-graphics/external-beta-runtime-admission.json`
- `approved-plan-snapshot-policy.md`
- `pricing-and-credits.md`
- `dependency-readiness-policy.md`
- `async-checkback-policy.md`
- `editing-asset-manifest.md`

## Adapter Stubs

All stubs are backend-private, read-only preflight stubs. They do not mutate approved snapshots, credit reservations, queues, workers, storage, or artifacts.

- `approved_snapshot_lookup`: existing approved snapshot ref required, no mutation.
- `credit_reservation_lookup`: existing credit reservation ref required, no mutation.
- `private_artifact_policy`: private manifest ref required, no signed URL.
- `asset_manifest_binding`: future asset manifest binding check only.
- `dependency_readiness`: future dependency readiness check only.
- `async_checkback`: future async checkback policy check only.
- `queue_submission_authorization`: future queue authorization check only, no live queue write.
- `worker_enqueue_authorization`: future worker enqueue authorization check only, no enqueue.
- `service_role_boundary`: backend/service-role boundary check only.
- `idempotency`: idempotency key check only.
- `rate_limit`: rate-limit check only.
- `cost_guardrail`: estimate and cost guardrail check only.
- `audit_telemetry`: audit envelope check only.
- `kill_switch`: kill-switch check only.
- `rollback`: rollback plan check only.

## Runtime Boundary

The adapter prepares the backend handoff shape needed before the route can be mounted, but it does not mount or execute the route. GPU remains on-demand only: it should start only later when an accepted worker/tool job is actually claimed.

Blocked now:

- app route mount
- API route execution
- approved snapshot mutation
- credit reservation mutation
- private artifact write
- live queue write
- Worker queue enqueue
- Worker execution
- tool execution
- provider/model execution
- browser/WebGL/canvas runtime execution
- GPU/model runtime execution now
- idle or always-on GPU runtime
- model weight download or load
- media processing
- Supabase/GCS mutation
- signed URL creation
- public artifact creation
- external beta traffic enablement
- production unlock

## Booleans

- `externalBetaApiRouteBackendAdapterPreflightPrepared`: `true`
- `sourceBackendAdapterContractAccepted`: `true`
- `sourceApiRouteHandlerContractAccepted`: `true`
- `backendAdapterPreflightRefsAccepted`: `true`
- `backendAdapterPreflightReadyWithProvidedEvidence`: `true`
- `all21ToolsCovered`: `true`
- `all12CapabilitiesCovered`: `true`
- `all8GpuToolsTargetGpuRuntime`: `true`
- `gpuRuntimeOnDemandOnly`: `true`
- `noIdleGpuRuntimeApproved`: `true`
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: `true`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteToolsNow`: `false`
- `apiRouteMountedNow`: `false`
- `apiRouteExecutionApprovedNow`: `false`
- `routeExecutionApprovedNow`: `false`
- `workerEnqueueApprovedNow`: `false`
- `backendQueueSubmissionApprovedNow`: `false`
- `liveQueueWriteApprovedNow`: `false`
- `workerDispatchApprovedNow`: `false`
- `toolExecutionApprovedNow`: `false`
- `providerRuntimeApprovedNow`: `false`
- `browserWebglCanvasRuntimeApprovedNow`: `false`
- `gpuRuntimeApprovedNow`: `false`
- `gpuRuntimeShouldStartNow`: `false`
- `runtimeReadyNow`: `false`
- `internalBetaReadyNow`: `false`
- `externalBetaReadyNow`: `false`
- `productionReadyNow`: `false`
- `dependencyInstallPerformed`: `false`
- `packageLockMutationPerformed`: `false`
- `toolExecutionPerformed`: `false`
- `workerExecutionPerformed`: `false`
- `workerEnqueuePerformed`: `false`
- `routeExecutionPerformed`: `false`
- `backendQueueSubmissionPerformed`: `false`
- `serviceRoleTransactionPerformed`: `false`
- `supabaseMutationPerformed`: `false`
- `gcsUploadPerformed`: `false`
- `publicArtifactCreated`: `false`
- `signedUrlCreated`: `false`

## Interfaces

- Server module: `server/tool-registry/ai-graphics-external-beta-api-route-backend-adapter.ts`
- CLI: `server/cli/ai-graphics-external-beta-api-route-backend-adapter.ts`
- Package script: `ai-graphics:external-beta-api-route-backend-adapter`
- Diagnostic: `ai-graphics:external-beta-api-route-backend-adapter:diagnostics`

## Next Milestones

1. QA the no-write backend adapter preflight while the route remains unmounted.
2. Bind the future mounted route to these backend adapter stubs before any queue write or worker enqueue is allowed.
3. Run a private route-to-backend-adapter smoke before approving live queue submission.
