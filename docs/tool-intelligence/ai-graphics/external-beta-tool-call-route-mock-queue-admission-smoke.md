# AI Graphics External Beta Tool Call Route Mock Queue Admission Smoke

Decision: `ai_graphics_external_beta_tool_call_route_mock_queue_admission_smoke_passed`

The broad AI graphics external-beta tool-call route now has an explicit mock-only queue-admission smoke path for all 21 AI graphics tools. The route still returns `409` when the admission flag is not enabled. With `AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_ENABLED=true` and mock runtime mode, it returns `202` and validates one backend runtime queue-service job per request.

This proves HTTP route request handling, canonical tool/capability validation, approved snapshot and credit reservation presence, private artifact manifest references, and backend queue-service payload validation. It does not approve live queue writes, worker dispatch, tool execution, GPU startup, signed URLs, public artifacts, external beta traffic, or production.

## Coverage

- Tools covered: 21
- Product-facing capabilities: 12
- GPU-targeted tools: 8
- Route admission accepted tools: 21
- Mock queue jobs validated: 21
- Live queue writes: 0
- Worker dispatches: 0
- Tool executions: 0
- GPU runtime starts now: 0

## Tool Set

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

## Runtime Boundary

The route can admit a tool-call request into the mock queue-admission contract. Actual worker/tool execution remains blocked. GPU remains on demand only and stays cold during admission; it may only start in a later accepted worker/tool job and must be released afterward.

## Current Booleans

- `broadAll21ToolCallRouteCanAdmitMockQueueNow`: `true`
- `agentCanSubmitToolCallToQueueAdmissionNow`: `true`
- `agentCanExecuteToolsNow`: `false`
- `liveQueueWritePerformed`: `false`
- `workerDispatchPerformed`: `false`
- `toolExecutionPerformed`: `false`
- `gpuRuntimeShouldStartNow`: `false`
- `runtimeReadyNow`: `false`
- `externalBetaReadyNow`: `false`
- `productionReadyNow`: `false`

Next milestone: run a private non-production live route-to-queue admission proof behind service-role authorization, then bind worker claim and dispatch proof before enabling real tool execution.
