# AI Graphics External Beta API Route Handler Contract

Decision:
`ai_graphics_external_beta_api_route_handler_contract_prepared_with_runtime_blocks`

Status:
`external_beta_api_route_handler_contract_ready_runtime_still_blocked`

This record adds the source-controlled handler contract for the future external-beta AI graphics tool-call route:
`POST /api/ai-graphics/external-beta/tool-call`.

The contract validates a canonical 21-tool request shape, approved plan snapshot evidence, credit reservation evidence, private artifact manifest references, idempotency, audit, rate-limit, cost guardrail, and kill-switch refs. It is not a mounted Express route and it does not create a public route surface.

## Source Evidence

- `external-beta-controlled-on-demand-status-bridge.json`
- `external-beta-api-route-worker-dispatch-handoff-proof.json`
- `external-beta-api-route-queue-smoke-proof.json`
- `external-beta-worker-dispatch-smoke-proof.json`
- `tool-call-readiness-contract.json`
- `21-tool-proper-install-audit.json`

## Covered Tools

All 21 AI graphics tools are covered:
`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

The 8 GPU/model tools remain targeted to native NVIDIA L4 worker runtimes and stay on-demand only. GPU runtime is start-allowed only for a later accepted worker/tool job; `gpuRuntimeShouldStartNow` remains false.

## Handler Contract

- Route id: `ai_graphics_external_beta_tool_call`
- Method: `POST`
- Path: `/api/ai-graphics/external-beta/tool-call`
- Handler id: `ai_graphics_external_beta_tool_call_handler_contract`
- If mounted later, the accepted contract response shape would use status `202`.
- Current state: source-controlled contract only.
- Express mount: deferred.
- API registry state: metadata only.

## Ready Counts

- `externalBetaControlledOnDemandReadyTools`: 21
- `externalBetaCallableNowTools`: 21
- `apiRouteHandlerContractReadyToolsWithProvidedEvidence`: 21
- `apiRouteMountedNowTools`: 0
- `routeExecutionsApprovedNow`: 0
- `workerDispatchesApprovedNow`: 0
- `toolExecutionsApprovedNow`: 0
- `productionReadyNowTools`: 0

## Allowed Contract Actions

- Read accepted controlled on-demand external-beta status bridge metadata.
- Read accepted API-route-to-worker-dispatch handoff proof metadata.
- Validate one canonical 21-tool external-beta route request shape.
- Validate approved snapshot, credit reservation, idempotency, audit, cost, and private-artifact refs.
- Return a source-controlled route-handler contract response shape for later mounting.
- Preserve GPU startup as on-demand only for a later accepted worker/tool job.

## Blocked Actions

- Mounted API route creation.
- API route execution.
- Direct agent/tool execution.
- Tool Route execution.
- Live queue writes.
- Worker queue enqueue.
- Worker execution or production dispatch.
- Provider/model execution.
- Browser/WebGL/canvas runtime.
- GPU/model runtime now.
- Idle or always-on GPU runtime.
- Model weight download or load.
- Media processing.
- Supabase/GCS mutation.
- Signed URL creation.
- Public artifact creation.
- Production unlock.

## Gate Booleans

- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: false
- `directAgentToolExecutionApprovedNow`: false
- `apiRouteMountedNow`: false
- `apiRouteExecutionApprovedNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerQueueApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `providerRuntimeApprovedNow`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `gpuRuntimeShouldStartNow`: false
- `runtimeReadyNow`: false
- `internalBetaReadyNow`: false
- `productionReadyNow`: false
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false
- `supabaseMutationPerformed`: false
- `gcsUploadPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

## Next Gap

Mount the external-beta route only after backend route ownership, approved snapshot lookup, credit reservation lookup, private artifact policy, and operational kill-switch controls are wired without bypassing callable request admission.
