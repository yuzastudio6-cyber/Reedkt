# AI Graphics External Agent Mock Worker Claim Proof

Decision: `ai_graphics_external_agent_mock_worker_claim_proof_passed_with_runtime_blocks`

Status: `mock_worker_claim_validated_all_21_dispatch_still_blocked`

This packet is the next execution-readiness step after `external-agent-mock-queue-insertion-proof`. It validates that all 21 AI graphics external-agent mock queue job candidates can be accepted by the backend queue service and then claimed through `createAiGraphicsToolRuntimeQueueService().claimToolRuntimeJob()` in explicit mock mode.

It does not submit a live queue row. It does not dispatch a worker. It does not execute a tool. It does not start GPU runtime.

Runtime boundary shorthand: private worker claim lease only; no live queue write, no worker dispatch, no tool execution, and no GPU startup.

## Counts

- `totalAiGraphicsTools`: 21
- `totalProductFacingCapabilities`: 12
- `sourceMockQueueInsertedJobCount`: 21
- `mockQueuePreludeInsertedJobCount`: 21
- `mockWorkerClaimAttemptedTools`: 21
- `mockWorkerClaimsCreated`: 21
- `mockWorkerLeaseSeconds`: 900
- `queueValidationAcceptedTools`: 21
- `gpuRuntimeTargetedTools`: 8
- `gpuRuntimeShouldStartNowTools`: 0
- `liveQueueWritePerformedTools`: 0
- `workerEnqueuePerformedTools`: 0
- `workerDispatchPerformedTools`: 0
- `toolExecutionPerformedTools`: 0
- `externalAgentExecutableNowTools`: 0
- `externalBetaReadyNowTools`: 0
- `productionReadyNowTools`: 0

## Tool Coverage

All 21 tools are validated through mock worker claim leasing:

`torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

The 8 GPU/model tools keep GPU startup on demand only for a later accepted worker/tool job. `gpuRuntimeShouldStartNow=false`.

## Worker Claim Boundary

Allowed now:

- read `external-agent-mock-queue-insertion-proof.json`
- create a fresh mock queue batch from the accepted 21 job envelopes
- claim each mock queue job with matching worker type
- verify claim lease metadata, worker type, runtime target, production tool id, and lease duration
- keep private artifact manifest references only

Blocked now:

- live queue write
- service-role transaction
- real worker enqueue or dispatch
- tool execution
- route execution approval
- provider/model runtime
- browser/WebGL/canvas runtime
- GPU/model runtime startup
- model weight download or load
- media processing
- Supabase/GCS mutation
- signed URLs
- public artifacts
- external beta runtime unlock
- production unlock

## Validation

Run:

1. `npm run --silent ai-graphics:external-agent-mock-worker-claim-proof`
2. `npm run --silent ai-graphics:external-agent-mock-worker-claim-proof:diagnostics`
3. `npm run --silent ai-graphics:external-agent-mock-queue-insertion-proof:diagnostics`
