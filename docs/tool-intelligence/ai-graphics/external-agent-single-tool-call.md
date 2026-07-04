# AI Graphics External Agent Single Tool Call

Decision: `ai_graphics_external_agent_single_tool_call_ready`

Status: `external_agent_single_tool_call_executed`

Route: `/api/ai-graphics/external-agent/tool-call`

## Request

- `toolId`: `d3`
- `capabilityId`: `chart_overlay`
- `group`: `cpu_static`
- `requestId`: `external-agent-single-tool-call-d3`
- `privateArtifactManifestRef`: `private://ai-graphics/external-agent/single-tool-call/d3/artifact-manifest`

## Response

- `statusCode`: `200`
- `ok`: `true`
- `routeStatus`: `external_beta_tool_call_route_cpu_static_controlled_execution_private_output_ready`
- `externalAgentExecutionState`: `executable`
- `blockingReasonCode`: `null`
- `failureDiagnostics`: `null`
- `outputKind`: `svg_private_artifact_candidate`
- `outputSha256`: `b47b8e006d730f9e7494f854f9ffac9963fa4a4be11acc9ad067bb6d2a53b7ef`

## Booleans

- `externalAgentSingleToolCallPerformed`: true
- `routeMountedForCall`: true
- `routeReturnedHttp200`: true
- `normalizedExternalAgentResultReturned`: true
- `callable`: true
- `executable`: true
- `blockedWithReason`: false
- `failedWithDiagnostics`: false
- `controlledAdapterInvokedNow`: true
- `controlledAdapterExecutedNow`: true
- `localPackageExecutionPerformed`: true
- `localGpuModelRuntimeExecutionPerformed`: false
- `gpuRuntimeShouldStartNow`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false
- `runtimeReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false

## Boundary

This caller starts the local API with only the scoped external-agent controlled route enabled. It does not install packages, run providers, create public artifacts, create signed URLs, mutate Supabase/GCS, unlock beta, or unlock production. GPU/model execution remains on-demand and starts only when the selected tool call supplies explicit local-dev runtime prerequisites.
