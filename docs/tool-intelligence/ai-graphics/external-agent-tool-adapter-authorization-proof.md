# AI Graphics External Agent Tool Adapter Authorization Proof

Decision: `ai_graphics_external_agent_tool_adapter_authorization_prepared_with_runtime_blocks`

Status: `external_agent_tool_adapter_authorization_prepared_all_21_execution_blocked`

This packet is the next step after the external-agent controlled dispatcher dry-run proof. The source proof showed that all 21 AI graphics tools can pass through `dispatchProductionWorkerJob` in `dry_run` plus `metadata_dry_run` mode and produce AI graphics handoff route output without tool execution, artifacts, QA results, live queue writes, or GPU startup.

This proof binds that accepted source evidence to per-tool adapter authorization contracts. It prepares the contract shape the external agent will eventually use, but it does not make any adapter invokable now.

## Source Evidence

- Source proof: `docs/tool-intelligence/ai-graphics/external-agent-controlled-dispatcher-dry-run-proof.json`
- Source decision: `ai_graphics_external_agent_controlled_dispatcher_dry_run_proof_passed_with_runtime_blocks`
- Source status: `controlled_dispatcher_dry_run_completed_all_21_no_tool_execution`
- Tool readiness registry: `server/tool-registry/ai-graphics-tool-call-readiness.ts`
- Tool handoff registry: `server/tool-registry/ai-graphics-tool-call-handoff.ts`
- Adapter authorization module: `server/tool-registry/ai-graphics-external-agent-tool-adapter-authorization.ts`

## Adapter Boundaries

- CPU/static adapter contracts: `6` tools: `d3`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`
- Browser/runtime adapter contracts: `7` tools: `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`
- GPU/model adapter contracts: `8` tools: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`

## Result

- Total tools covered: `21`
- Product-facing capabilities covered: `12`
- Source controlled dispatcher dry-run completed tools: `21`
- Source AI graphics handoff route tools: `21`
- Adapter authorization rows: `21`
- Adapter contracts authorized with runtime blocks: `21`
- Mapped production profiles accepted: `21`
- External-agent invokable adapter tools now: `0`
- External-agent executable tools now: `0`
- Tool execution approved tools now: `0`
- GPU runtime starts now: `0`

The GPU policy remains on-demand only: `gpuRuntimeOnDemandOnly=true`, `noIdleGpuRuntimeApproved=true`, `gpuStartsOnlyForApprovedWorkerOrToolCall=true`, and `gpuRuntimeShouldStartNow=false`.

## Runtime Boundary

- `agentCanSelectForPlanning=true`
- `externalAgentCanInvokeAdapterNow=false`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `providerRuntimeApprovedNow=false`
- `browserWebglCanvasRuntimeApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

No dependency install, package-lock mutation, backend queue submission, live queue write, worker enqueue, worker dispatch, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved by this packet.

## Next Milestone

External-agent per-tool adapter execution smoke for the CPU/static cohort first, with private artifact output contracts and execution still limited to approved worker handoff paths.
