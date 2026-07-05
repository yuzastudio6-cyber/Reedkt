# AI Graphics External-Beta Per-Tool Traffic Enablement Gate

Decision: `ai_graphics_external_beta_per_tool_traffic_enablement_gate_prepared_with_runtime_blocks`

This packet prepares one per-tool external-beta traffic candidate after the per-tool callable-result gate and external-beta launch go/no-go are accepted. It requires the callable-result gate to preserve the route-bound service-role queue smoke operator preflight, plus private owner approval, feature flag, rollout cohort, kill switch, rate limit, cost ceiling, support, telemetry, and rollback refs.

The gate does not enable traffic. It does not execute API routes, dispatch workers, execute tools, write private artifacts, call providers/models, start browser/WebGL/canvas runtime, start GPU runtime, mutate Supabase/GCS, create signed URLs, create public artifacts, mark external beta ready now, or unlock production.

## Accepted Prepared Evidence

- Accepted per-tool callable-result gate.
- Route-bound service-role queue smoke operator preflight preserved by the callable-result gate.
- Accepted external-beta launch go/no-go.
- Private owner approval ref.
- Private feature flag and rollout cohort refs.
- Private kill switch, rate limit, and cost ceiling refs.
- Private support runbook, telemetry, and rollback refs.
- GPU remains on-demand only for a later accepted worker/tool job.

## Runtime Blocks By Gate

- External beta traffic enablement
- API Route execution
- Worker dispatch
- Tool execution
- Provider/model execution
- Browser/WebGL/canvas runtime
- GPU runtime by this gate
- Model weight download or load
- Media processing
- Supabase/GCS mutation
- Signed URL creation
- Public artifact creation
- Production unlock

## Booleans

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted=true`
- `perToolTrafficEnablementPreparedWithProvidedEvidence=true`
- `externalBetaTrafficEnabledNow=false`
- `externalBetaTrafficSwitchApprovedNow=false`
- `routeExecutionPerformed=false`
- `workerDispatchPerformedByTrafficGate=false`
- `toolExecutionPerformed=false`
- `gpuRuntimePerformedByTrafficGate=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

Next gap: add the explicit operator traffic-switch/runtime-soak packet for a tiny rollout cohort after final approval. This gate only proves the controls exist.
