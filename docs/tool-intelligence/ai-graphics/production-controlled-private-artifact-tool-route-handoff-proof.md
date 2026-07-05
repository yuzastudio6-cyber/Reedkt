# AI Graphics Production Controlled Private Artifact Tool Route Handoff Proof

Decision: `ai_graphics_production_controlled_private_artifact_tool_route_handoff_proof_prepared_with_runtime_blocks`

Status: `production_controlled_private_artifact_tool_route_handoff_ready_no_execution`

## Scope

This packet consumes the accepted `production-controlled-worker-runtime-smoke-proof.json` lane and prepares the next private artifact plus future Tool Route handoff shape. It does not write private artifacts, execute a Tool Route, dispatch a worker, execute a tool, call a provider/model, start browser/WebGL/canvas runtime, start GPU/model runtime, create signed URLs, create public artifacts, or unlock external beta/production.

The source evidence includes:

- `docs/tool-intelligence/ai-graphics/production-controlled-worker-runtime-smoke-proof.json`
- `docs/tool-intelligence/ai-graphics/production-controlled-worker-runtime-smoke-authorization.json`
- `docs/tool-intelligence/ai-graphics/production-controlled-worker-dispatch-smoke-proof.json`
- `server/workers/production/production-worker-router.ts`
- `server/workers/production/production-worker-dispatcher.ts`
- `server/workers/production/production-worker-gates.ts`
- `server/workers/production/production-worker-lease-manager.ts`

## Result

The proof validates that the previous private non-production dry-run worker output can be bound to private/backend evidence refs for:

- private input manifest
- private output manifest
- private telemetry
- private lease audit
- private route handoff
- private artifact policy
- private artifact retention
- Tool Route policy/schema/admission/authz/execution block/audit/rollback
- GPU on-demand policy
- model weight or cache manifest for GPU/model tools

The diagnostic accepts two representative paths:

| Tool | Capability | Runtime target | Future handler | Result |
| --- | --- | --- | --- | --- |
| `sam2` | `subject_segmentation` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `ai_graphics_gpu_model_tool_call_handoff` | prepared, no execution |
| `vega_lite` | `chart_overlay` | `node_cpu_static` | `ai_graphics_cpu_static_tool_call_handoff` | prepared, no execution |

## Coverage

- AI graphics tools covered: 21
- Product-facing capabilities covered: 12
- GPU/model tools targeted for GPU runtime: 8
- Production controlled tool-call ready metadata: 21
- Runtime-ready tools now: 0
- External-beta-ready tools now: 0
- Production-ready tools now: 0

## Runtime Boundary

The packet preserves planning/study metadata selection only:

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `privateArtifactWriteApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

GPU remains on-demand only. The GPU path may be admitted only for a later accepted worker/tool job, and the runtime must not start while no accepted job is using it.

## Evidence Rules

Accepted refs must be private/backend evidence refs such as `private://`, `backend://`, `production-evidence://`, or `reeditpro-private://`.

The proof rejects public or externally addressable refs including `http://`, `https://`, `gs://`, `gcs://`, `s3://`, `signed-url`, `public-artifact`, and `/public/`.

## No-Scope Statement

No dependencies were installed, `package-lock.json` was not changed, CPU/static validation was not rerun, tools were not executed, workers were not dispatched, routes were not executed, providers/models were not called, model weights were not downloaded or loaded, browser/WebGL/canvas runtime was not started, GPU runtime was not started, media was not processed, Supabase/GCS was not mutated, signed URLs were not created, public artifacts were not created, and beta/production was not unlocked.

## Next Gate

`AI_GRAPHICS_PRODUCTION_CONTROLLED_PER_TOOL_CALLABLE_RESULT_PROOF`
