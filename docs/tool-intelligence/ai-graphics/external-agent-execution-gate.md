# AI Graphics External Agent Execution Gate

Decision: `ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings`

Status: `external_agent_execution_gate_fail_closed_runtime_blocked`

This packet gives an external agent a deterministic fail-closed gate for the 21 AI graphics tools. It consumes the 21-tool proper-install audit, sanitized external-beta callable request-admission evidence, route-mount readiness evidence, and controlled on-demand status bridge evidence, then returns a clear no-go for direct execution until a later route, worker, and private runtime proof explicitly opens execution.

The current block is intentional and temporary. It does not mean the 21 tools are rejected. It means the agent may plan with the tools, but actual execution stays blocked until the next required private queue, worker, and tool-specific proofs pass.

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
- controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence: `21`
- controlledOnDemandExternalBetaCallableToolsWithProvidedEvidence: `21`
- controlledOnDemandRuntimeReadyForToolCallToolsWithProvidedEvidence: `21`
- CPU/static live-adapter queue-service proof accepted: `true`
- cpuStaticLiveAdapterQueueWriteProofPassedWithProvidedEvidenceTools: `5`
- cpuStaticMockQueueServiceValidationPassedTools: `5`
- CPU/static exact execution admission accepted: `true`
- cpuStaticExactExecutionAdmissionReadyTools: `5`
- cpuStaticExactRequestEnvelopeAcceptedTools: `5`
- cpuStaticApprovedPlanSnapshotAcceptedTools: `5`
- cpuStaticPrivateArtifactManifestAcceptedTools: `5`
- cpuStaticWorkerAcceptedRequestSchemaAcceptedTools: `5`
- externalAgentExactRequestAdmittedWithProvidedEvidenceTools: `5`
- CPU/static adapter/enqueue admission accepted: `true`
- cpuStaticAdapterInvocationEnqueueAdmissionReadyTools: `5`
- cpuStaticAdapterInvocationEnvelopePreparedTools: `5`
- cpuStaticWorkerEnqueuePayloadPreparedTools: `5`
- cpuStaticProductionWorkerJobPayloadAcceptedTools: `5`
- externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidenceTools: `5`
- CPU/static service-role queue-write smoke preflight accepted: `true`
- cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightReadyTools: `5`
- externalAgentNonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidenceTools: `5`
- cpuStaticSatoriBlockedPendingApprovedFontFixtureTools: `1`
- cpuStaticNonCpuStaticDeferredTools: `15`
- nonProductionServiceRoleQueueWriteSmokeRequiredTools: `5`
- adapterInvocationAndWorkerEnqueueAdmissionRequiredTools: `0`
- Representative disabled route blocked-detail cases covered: `21`
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
- Read controlled on-demand external-beta status while preserving that direct agent execution remains blocked.
- Read the CPU/static live-adapter queue-service proof for `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, and `viz_js`; these five are closest to direct agent execution, but actual execution still blocked.
- Read the CPU/static exact execution-admission proof for `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, and `viz_js`; exact request envelopes, approved plan snapshots, private artifact manifests, worker-accepted request schemas, and tool QA gates are accepted.
- Read the CPU/static adapter-invocation and worker-enqueue admission proof for `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, and `viz_js`; adapter envelopes and worker enqueue payloads are accepted, but live queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the next gate passes.
- Read the CPU/static non-production service-role queue-write smoke preflight for `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, and `viz_js`; the exact environment, server-only credential boundary, telemetry, cleanup, rollback, and saved-result requirements are prepared, but the smoke itself remains unrun and unapproved.
- Return per-request disabled route details for all 21 tools that include the requested tool, capability, planning acceptance, selected planning tools, missing proof, missing execution gates, and GPU on-demand status.
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
9. `npm run ai-graphics:external-beta-controlled-on-demand-status-bridge:diagnostics`
10. `npm run ai-graphics:external-agent-cpu-static-private-worker-exact-execution-admission:diagnostics`
11. `npm run ai-graphics:external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission:diagnostics`
12. `npm run ai-graphics:external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof:diagnostics`
13. `npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight:diagnostics`
14. `npm run ai-graphics:external-beta-service-role-queue-smoke-preflight:diagnostics`

The gate supports `--require-go`. While blocked, require-go mode exits with exit code `2`, so automation cannot accidentally treat the current state as executable.

## Required Booleans

- `externalAgentExecutionGatePrepared=true`
- `source21ToolProperInstallAuditAccepted=true`
- `sourceExternalBetaCallableRequestAdmissionAccepted=true`
- `sourceExternalBetaApiRouteMountReadinessAccepted=true`
- `sourceExternalBetaControlledOnDemandStatusBridgeAccepted=true`
- `sourceExternalAgentCpuStaticLiveAdapterQueueWriteProofAccepted=true`
- `sourceExternalAgentCpuStaticExactExecutionAdmissionAccepted=true`
- `sourceExternalAgentCpuStaticAdapterInvocationEnqueueAdmissionAccepted=true`
- `properInstallAuditAccepted=true`
- `all21ToolsProperlyInstalledForPlannedSurface=true`
- `installAuditSeparatesPlannedSurfaceFromRuntimeCallable=true`
- `externalBetaCallableInstallReadyNow=false`
- `controlledOnDemandExternalBetaReadyWithProvidedEvidence=true`
- `controlledOnDemandWorkerPathReadyButDirectAgentExecutionBlocked=true`
- `all21ToolsCovered=true`
- `all12CapabilitiesCovered=true`
- `all8GpuToolsTargetGpuRuntime=true`
- `externalBetaCallableCandidatesWithProvidedEvidence=true`
- `externalBetaCallableRequestAdmissionReadyWithProvidedEvidence=true`
- `routeMountReadyWithProvidedEvidence=true`
- `routeMountPreparedButNotMounted=true`
- `cpuStaticLiveAdapterQueueServiceProofAccepted=true`
- `allFiveCpuStaticLiveAdapterQueueWriteProofsPassedWithProvidedEvidence=true`
- `allFiveCpuStaticMockQueueServiceValidationsPassed=true`
- `cpuStaticExactExecutionAdmissionAccepted=true`
- `allFiveCpuStaticExactExecutionAdmissionsReady=true`
- `allFiveCpuStaticExactRequestEnvelopesAccepted=true`
- `allFiveCpuStaticApprovedPlanSnapshotsAccepted=true`
- `allFiveCpuStaticPrivateArtifactManifestsAccepted=true`
- `allFiveCpuStaticWorkerAcceptedRequestSchemasAccepted=true`
- `allFiveCpuStaticExternalAgentExactRequestsAdmittedWithProvidedEvidence=true`
- `cpuStaticAdapterInvocationEnqueueAdmissionAccepted=true`
- `allFiveCpuStaticAdapterInvocationEnqueueAdmissionsReady=true`
- `allFiveCpuStaticAdapterInvocationEnvelopesPrepared=true`
- `allFiveCpuStaticWorkerEnqueuePayloadsPrepared=true`
- `allFiveCpuStaticProductionWorkerJobPayloadsAccepted=true`
- `allFiveCpuStaticExternalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence=true`
- `sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted=true`
- `cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted=true`
- `allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReady=true`
- `allFiveCpuStaticExternalAgentNonProductionServiceRoleQueueWriteSmokePreflightsReadyWithProvidedEvidence=true`
- `satoriRemainsBlockedPendingApprovedFontFixture=true`
- `fifteenNonCpuStaticToolsRemainDeferredToRuntimeLanes=true`
- `nonProductionServiceRoleQueueWriteSmokeRequiredBeforeExecution=true`
- `adapterInvocationAndWorkerEnqueueAdmissionRequiredBeforeExecution=false`
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

The 21 tools are organized for external-agent planning, the proper-install audit confirms all tools are installed for their planned surfaces, request-admission evidence has reached the fail-closed gate, route-mount readiness evidence is accepted, controlled on-demand worker-path readiness is recorded with provided evidence for all 21 tools, and five CPU/static tools have exact execution-admission evidence, adapter/enqueue admission evidence, mock-only live-adapter queue-service validation, and non-production service-role queue-write smoke preflight evidence. The disabled route now returns tool/capability-specific blocked details from the plan evaluator, so an external agent can see exactly why a request is not executable yet. Actual direct execution is still blocked because install readiness is not direct agent execution, the default route-mount flag is off, the five CPU/static tools still need a saved non-production service-role queue-write smoke result, worker claim, worker dispatch, and tool-specific result proof, `satori` still needs the approved font fixture, and no direct route/worker/tool runtime execution is approved. The next aligned step is saved non-production service-role queue-write smoke proof for the five CPU/static tools, while keeping private queue/worker/tool execution blocked until each following proof passes.
