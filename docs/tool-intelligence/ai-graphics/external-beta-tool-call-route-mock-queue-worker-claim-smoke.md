# AI Graphics External Beta Tool Call Route Mock Queue Worker Claim Smoke

Decision: `ai_graphics_external_beta_tool_call_route_mock_queue_worker_claim_smoke_passed`

The broad AI graphics external-beta tool-call route now proves the next backend boundary after route admission. With `AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_ENABLED=true` and explicit mock runtime mode, all 21 canonical AI graphics tool requests return `202`, produce one mock runtime queue job id, and that exact job id can be claimed through `createAiGraphicsToolRuntimeQueueService().claimToolRuntimeJob()`.

This is a private mock worker lease proof only. It does not approve live queue writes, live worker claims, worker dispatch, tool execution, GPU startup, model loading, signed URLs, public artifacts, external beta traffic, or production.

## Coverage

- Tools covered: 21
- Product-facing capabilities: 12
- GPU-targeted tools: 8
- Route admission accepted tools: 21
- Mock queue jobs validated: 21
- Mock worker lease claims created: 21
- Lease seconds: 900
- Live queue writes: 0
- Worker dispatches: 0
- Tool executions: 0
- GPU runtime starts now: 0

## Tool Set

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

## Runtime Boundary

The route can admit a tool-call request into the mock queue contract and the mock worker lease boundary can claim that route-created job id. Actual worker dispatch and tool execution remain blocked. GPU remains on demand only and stays cold during the route and mock claim smoke; it may only start in a later accepted worker/tool job and must be released afterward.

## Current Booleans

- `agentCanSubmitToolCallToQueueAdmissionNow`: `true`
- `agentCanClaimMockWorkerLeaseNow`: `true`
- `agentCanExecuteToolsNow`: `false`
- `mockWorkerClaimPerformed`: `true`
- `liveWorkerClaimPerformed`: `false`
- `liveQueueWritePerformed`: `false`
- `workerDispatchPerformed`: `false`
- `toolExecutionPerformed`: `false`
- `gpuRuntimeShouldStartNow`: `false`
- `runtimeReadyNow`: `false`
- `externalBetaReadyNow`: `false`
- `productionReadyNow`: `false`

Next milestone: bind the route-created mock worker claims to controlled dispatch handoff envelopes, then run private non-production live route-to-queue admission behind service-role authorization before enabling real tool execution.
