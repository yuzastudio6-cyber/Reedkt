# AI Graphics External-Beta Operator Traffic Switch Runtime Soak Authorization

Decision: `ai_graphics_external_beta_operator_traffic_switch_runtime_soak_authorization_prepared_with_runtime_blocks`

This packet prepares one per-tool operator traffic-switch/runtime-soak authorization candidate after the per-tool traffic-enablement gate is accepted. It requires private operator switch approval, runtime soak plan and window, canary cohort, monitoring, alert, rollback, support, cost, kill-switch drill, and post-soak review refs.

The gate does not enable traffic. It does not start runtime soak, execute API routes, dispatch workers, execute tools, write private artifacts, call providers/models, start browser/WebGL/canvas runtime, start GPU runtime, mutate Supabase/GCS, create signed URLs, create public artifacts, mark external beta ready now, or unlock production.

## Accepted Prepared Evidence

- Accepted per-tool traffic-enablement gate.
- Accepted route-bound service-role queue smoke operator preflight, preserved through the traffic-enablement gate.
- Private operator traffic switch approval ref.
- Private runtime soak plan and window refs.
- Private canary cohort ref.
- Private monitoring dashboard and alert policy refs.
- Private rollback playbook and support pager refs.
- Private cost budget, kill-switch drill, and post-soak review refs.
- GPU remains on-demand only for a later accepted worker/tool job.

## Runtime Blocks By Gate

- External beta traffic switch enablement
- External beta runtime soak start
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
- `operatorTrafficSwitchRuntimeSoakAuthorizationPreparedWithProvidedEvidence=true`
- `sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted=true`
- `externalBetaTrafficEnabledNow=false`
- `externalBetaTrafficSwitchEnabledNow=false`
- `externalBetaRuntimeSoakStartedNow=false`
- `routeExecutionPerformed=false`
- `workerDispatchPerformedByAuthorizationGate=false`
- `toolExecutionPerformed=false`
- `gpuRuntimePerformedByAuthorizationGate=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

Next gap: add the controlled traffic execution and observed runtime-soak result packet for a tiny rollout cohort after final operator approval. This gate only proves the authorization controls exist.
