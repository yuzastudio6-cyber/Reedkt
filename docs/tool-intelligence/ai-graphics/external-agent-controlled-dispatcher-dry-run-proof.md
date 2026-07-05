# AI Graphics External Agent Controlled Dispatcher Dry-Run Proof

Decision: `ai_graphics_external_agent_controlled_dispatcher_dry_run_proof_passed_with_runtime_blocks`

Status: `controlled_dispatcher_dry_run_completed_all_21_no_tool_execution`

This packet is the next controlled step after the external-agent mock dispatcher gate proof. The prior proof verified that `production_blocked` payloads stop at `worker_mode` before leases or route output. This proof removes only that blocked worker mode, uses `dry_run` plus `metadata_dry_run`, and sends all 21 canonical AI graphics tool payloads through `dispatchProductionWorkerJob`.

The proof exercises `routeProductionWorkerJob` only through the AI graphics planning-only handoff branch. It creates and releases in-memory leases, records dispatcher events, and returns mock-only handoff route output. It does not execute any product tool, Tool Route, live queue write, worker dispatch, provider/model call, browser/WebGL/canvas runtime, GPU/model runtime, media processing, Supabase/GCS operation, signed URL, public artifact, beta unlock, or production unlock.

## Source Evidence

- Source gate proof: `docs/tool-intelligence/ai-graphics/external-agent-mock-dispatcher-gate-proof.json`
- Dispatcher: `server/workers/production/production-worker-dispatcher.ts`
- Router: `server/workers/production/production-worker-router.ts`
- Gates: `server/workers/production/production-worker-gates.ts`
- Lease manager: `server/workers/production/production-worker-lease-manager.ts`
- Canonical tool registry: `server/tool-registry/ai-graphics-tool-call-readiness.ts`

## Result

- Total tools covered: `21`
- Product-facing capabilities covered: `12`
- Source dispatcher gate blocked tools: `21`
- Controlled dispatcher dry-run attempted tools: `21`
- Controlled dispatcher dry-run completed tools: `21`
- Dispatcher gates passed tools: `21`
- Dispatcher hard gate blocks: `0`
- Dispatcher route output produced tools: `21`
- AI graphics handoff route tools: `21`
- In-memory leases created: `21`
- In-memory leases released: `21`
- Tool run results created: `0`
- Artifact records created: `0`
- Quality gate results created: `0`
- GPU-targeted tools: `8`
- GPU runtime starts now: `0`

The GPU policy remains on-demand only: `gpuRuntimeShouldStartNow=false`, `gpuRuntimeOnDemandOnly=true`, `noIdleGpuRuntimeApproved=true`, and GPU can start only for a later approved worker or tool call.

## Runtime Boundary

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `backendQueueSubmissionApprovedNow=false`
- `liveQueueWriteApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `workerEnqueueApprovedNow=false`
- `workerDispatchApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `providerRuntimeApprovedNow=false`
- `browserWebglCanvasRuntimeApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## Next Milestone

External-agent controlled worker tool-adapter proof: bind one approved dry-run handoff result to per-tool adapter authorization while preserving no provider/model/GPU/public-artifact execution.
