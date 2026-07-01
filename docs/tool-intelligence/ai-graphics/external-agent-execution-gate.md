# AI Graphics External Agent Execution Gate

Decision: `ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings`

Status: `external_agent_execution_gate_fail_closed_runtime_blocked`

This packet gives an external agent a deterministic fail-closed gate for the 21 AI graphics tools. It consumes the 21-tool proper-install audit, sanitized external-beta callable request-admission evidence, and route-mount readiness evidence, then returns a clear no-go until a later route, worker, and private runtime proof explicitly opens execution.

## Scope

- AI graphics tools covered: `21`
- Product-facing capabilities covered: `12`
- GPU/runtime-targeted tools: `8`
- Proper-install audit accepted: `true`
- properlyInstalledForPlannedSurfaceTools: `21`
- runtimeProofPassedButToolCallBlockedTools: `13`
- nativeGpuRuntimeProofPendingTools: `8`
- modelWeightManifestPendingTools: `5`
- externalBetaCallableInstallReadyNowTools: `0`
- External-beta callable candidates with provided evidence: `21`
- Request-admission candidates with provided evidence: `1`
- Route-mount-ready tools with provided evidence: `21`
- API-route-mounted-now tools: `0`
- External-agent executable now tools: `0`
- External-beta-ready-now tools: `0`
- Production-ready-now tools: `0`

## Allowed Before Execution

- Read the proper-install audit and confirm each tool is installed only for its planned ReeditPro surface.
- Read sanitized callable-scope and request-admission evidence.
- Select, rank, and eliminate planning tools from the 21-tool AI graphics set.
- Explain missing proof before execution.
- Verify approved plan snapshot, credit reservation, private manifest, trace, and idempotency metadata.
- Read route-mount readiness evidence while preserving `apiRouteMountedNow=false`.
- Return a fail-closed go/no-go decision for an external agent before any route, worker, provider, or tool call.
- Preserve GPU startup as on-demand only for a later accepted worker/tool job.

## Fail-Closed Runtime Boundary

Blocked now:

- Agent/tool execution
- Tool Route execution
- API route execution
- Live queue write
- Worker queue enqueue
- Worker execution
- Provider/model execution
- Browser/WebGL/canvas runtime execution
- GPU/model runtime execution now
- Idle or always-on GPU runtime
- Model weight download or load
- Media processing
- Supabase/GCS mutation
- Signed URL creation
- Public artifact creation
- External beta traffic enablement
- Production unlock

## Safe Commands

1. `npm run ai-graphics:21-tool-proper-install-audit:diagnostics`
2. `npm run ai-graphics:external-agent-execution-gate`
3. `npm run ai-graphics:external-beta-callable-request-admission`
4. `npm run ai-graphics:external-beta-callable-scope`
5. `npm run ai-graphics:external-beta-tool-call-gateway`
6. `npm run ai-graphics:external-beta-runtime-admission`
7. `npm run ai-graphics:external-beta-worker-enqueue-adapter`
8. `npm run ai-graphics:external-beta-end-to-end-readiness:diagnostics`

The gate supports `--require-go`. While blocked, require-go mode exits with exit code `2`, so automation cannot accidentally treat the current state as executable.

## Required Booleans

- `externalAgentExecutionGatePrepared=true`
- `source21ToolProperInstallAuditAccepted=true`
- `sourceExternalBetaCallableRequestAdmissionAccepted=true`
- `sourceExternalBetaApiRouteMountReadinessAccepted=true`
- `properInstallAuditAccepted=true`
- `all21ToolsProperlyInstalledForPlannedSurface=true`
- `installAuditSeparatesPlannedSurfaceFromRuntimeCallable=true`
- `externalBetaCallableInstallReadyNow=false`
- `all21ToolsCovered=true`
- `all12CapabilitiesCovered=true`
- `all8GpuToolsTargetGpuRuntime=true`
- `externalBetaCallableCandidatesWithProvidedEvidence=true`
- `externalBetaCallableRequestAdmissionReadyWithProvidedEvidence=true`
- `routeMountReadyWithProvidedEvidence=true`
- `routeMountPreparedButNotMounted=true`
- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `externalAgentExecutionAllowedNow=false`
- `apiRouteMountedNow=false`
- `apiRouteExecutionApprovedNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `workerQueueApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `browserWebglCanvasRuntimeApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## Result

The 21 tools are organized for external-agent planning, the proper-install audit confirms all tools are installed for their planned surfaces, request-admission evidence has reached the fail-closed gate, and route-mount readiness evidence is accepted. Actual execution is still blocked because install readiness is not external-beta callability, the default route-mount flag is off, and no worker/tool runtime is approved. The next aligned step is a deliberate route-mount approval that keeps private queue/worker execution blocked until its own proof passes.
