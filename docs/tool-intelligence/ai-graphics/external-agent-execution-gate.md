# AI Graphics External Agent Execution Gate

Decision: `ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings`

Status: `external_agent_execution_gate_controlled_route_ready_direct_global_execution_blocked`

Controlled-route-ready external-agent execution gate for all 21 AI graphics tools. It now accepts claimed-worker controlled route execution for the 13 CPU/static and browser/runtime tools, plus GPU/model proof-ref queue admission for all eight GPU/model tools, while preserving direct/global execution, live worker dispatch, GPU/model runtime, public artifacts, beta, and production blocks.

This gate is fail-closed. It keeps GPU startup as on-demand only, consumes route-mount readiness evidence, and preserves the proper-install audit boundary.

## Key Counts

- requireGoExitCodeWhenBlocked: `2`
- totalAiGraphicsTools: `21`
- totalProductFacingCapabilities: `12`
- gpuRuntimeTargetedTools: `8`
- properlyInstalledForPlannedSurfaceTools: `21`
- runtimeProofPassedButToolCallBlockedTools: `13`
- nativeGpuRuntimeProofPendingTools: `8`
- modelWeightManifestPendingTools: `5`
- externalBetaCallableInstallReadyNowTools: `0`
- controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence: `21`
- controlledOnDemandExternalBetaCallableToolsWithProvidedEvidence: `21`
- controlledOnDemandRuntimeReadyForToolCallToolsWithProvidedEvidence: `21`
- cpuStaticLiveAdapterQueueWriteProofPassedWithProvidedEvidenceTools: `5`
- cpuStaticMockQueueServiceValidationPassedTools: `5`
- cpuStaticExactExecutionAdmissionReadyTools: `5`
- cpuStaticExactRequestEnvelopeAcceptedTools: `5`
- cpuStaticApprovedPlanSnapshotAcceptedTools: `5`
- cpuStaticPrivateArtifactManifestAcceptedTools: `5`
- cpuStaticWorkerAcceptedRequestSchemaAcceptedTools: `5`
- externalAgentExactRequestAdmittedWithProvidedEvidenceTools: `5`
- cpuStaticAdapterInvocationEnqueueAdmissionReadyTools: `5`
- cpuStaticAdapterInvocationEnvelopePreparedTools: `5`
- cpuStaticWorkerEnqueuePayloadPreparedTools: `5`
- cpuStaticProductionWorkerJobPayloadAcceptedTools: `5`
- externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidenceTools: `5`
- cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightReadyTools: `5`
- externalAgentNonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidenceTools: `5`
- cpuStaticNonProductionEvidenceSequencePreparedTools: `5`
- externalAgentCpuStaticNonProductionEvidenceSequencePreparedWithRuntimeBlocksTools: `5`
- cpuStaticNonProductionEvidenceSequenceExecutedNowTools: `0`
- cpuStaticNonProductionEvidenceSequenceLiveQueueWritesNow: `0`
- cpuStaticNonProductionEvidenceSequenceLiveWorkerClaimsNow: `0`
- cpuStaticNonProductionEvidenceSequenceLiveWorkerDispatchHandoffsNow: `0`
- cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidenceTools: `0`
- cpuStaticNonProductionServiceRoleQueueWritesAcceptedWithProvidedEvidenceTools: `0`
- nonProductionServiceRoleQueueRowsPersistedAfterCleanup: `0`
- cpuStaticWorkerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidenceTools: `0`
- cpuStaticWorkerClaimsAcceptedWithProvidedEvidenceTools: `0`
- cpuStaticWorkerDispatchHandoffsAcceptedWithProvidedEvidenceTools: `0`
- cpuStaticWorkerDispatchLeasesReleasedWithProvidedEvidenceTools: `0`
- cpuStaticToolExecutionDryRunProofPreparedWithProvidedEvidenceTools: `0`
- cpuStaticDryToolExecutionContractsPreparedTools: `0`
- cpuStaticControlledToolExecutionProofAcceptedWithProvidedEvidenceTools: `0`
- cpuStaticPhase0ExecutionEvidenceAcceptedTools: `0`
- cpuStaticSatoriBlockedPendingApprovedFontFixtureTools: `0`
- cpuStaticSatoriFontRuntimeProofAcceptedWithProvidedEvidenceTools: `1`
- cpuStaticLocalRuntimeProofsAcceptedWithProvidedEvidenceTools: `6`
- cpuStaticNonCpuStaticDeferredTools: `15`
- nonProductionServiceRoleQueueWriteSmokeRequiredTools: `5`
- nonProductionServiceRoleQueueWriteSmokeResultRequiredTools: `5`
- adapterInvocationAndWorkerEnqueueAdmissionRequiredTools: `0`
- workerClaimAndDispatchSmokeProofRequiredTools: `0`
- toolExecutionDryRunProofRequiredTools: `0`
- controlledToolExecutionProofRequiredTools: `0`
- externalBetaCallableCandidateToolsWithProvidedEvidence: `21`
- externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence: `1`
- externalAgentExecutableNowTools: `0`
- disabledRouteBlockedDetailCasesWithProvidedEvidence: `21`
- externalAgentRouteExecutableNowToolsWithReadinessProbeEvidence: `13`
- cpuStaticControlledRouteExecutableNowToolsWithReadinessProbeEvidence: `6`
- browserRuntimeControlledRouteExecutableNowToolsWithReadinessProbeEvidence: `7`
- controlledCanonicalRouteExecutedToolsWithProvidedEvidence: `13`
- cpuStaticControlledCanonicalRouteExecutedToolsWithProvidedEvidence: `6`
- browserRuntimeControlledCanonicalRouteExecutedToolsWithProvidedEvidence: `7`
- localControlledPackageExecutionPerformedToolsWithProvidedEvidence: `13`
- controlledAdapterExecutedToolsWithProvidedEvidence: `13`
- controlledWorkerRouteExecutionSmokeAcceptedToolsWithProvidedEvidence: `13`
- externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence: `13`
- controlledWorkerRouteMockQueueInsertedJobsWithProvidedEvidence: `13`
- controlledWorkerRouteMockWorkerClaimsCreatedWithProvidedEvidence: `13`
- controlledWorkerRouteMockWorkerEventsRecordedWithProvidedEvidence: `13`
- controlledWorkerRouteExecutionPerformedToolsWithProvidedEvidence: `13`
- gpuModelRuntimeAdmissionEvaluatedToolsWithProvidedEvidence: `8`
- gpuModelRuntimeAdmissionBlockedToolsWithProvidedEvidence: `8`
- gpuRuntimeStartAllowedForAcceptedExternalBetaJobToolsWithProvidedEvidence: `0`
- gpuModelProofRefQueueAdmissionAcceptedToolsWithProvidedEvidence: `8`
- gpuModelRuntimeAdmissionReadyWithProvidedProofRefsTools: `8`
- gpuModelProofRefNativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence: `8`
- gpuModelProofRefModelWeightManifestAcceptedToolsWithProvidedEvidence: `5`
- gpuModelProofRefMockQueueInsertedJobsWithProvidedEvidence: `8`
- gpuModelProofRefMockWorkerClaimsCreatedWithProvidedEvidence: `8`
- gpuRuntimeStartAllowedForAcceptedExternalBetaJobToolsWithProofRefEvidence: `8`
- gpuModelProofRefQueueAdmissionGpuRuntimeShouldStartNowToolsWithProvidedEvidence: `0`
- gpuModelProofRefQueueAdmissionToolExecutionPerformedToolsWithProvidedEvidence: `0`
- mockQueueWorkerClaimSmokeAcceptedToolsWithProvidedEvidence: `21`
- mockQueueInsertedJobsWithProvidedEvidence: `21`
- mockWorkerClaimsCreatedWithProvidedEvidence: `21`
- mockWorkerLeaseSecondsWithProvidedEvidence: `900`
- mockQueueWorkerClaimLiveQueueWritePerformedToolsWithProvidedEvidence: `0`
- mockQueueWorkerClaimWorkerDispatchPerformedToolsWithProvidedEvidence: `0`
- mockQueueWorkerClaimToolExecutionPerformedToolsWithProvidedEvidence: `0`
- mockQueueWorkerClaimGpuRuntimeShouldStartNowToolsWithProvidedEvidence: `0`
- externalAgentToolAdapterAuthorizationAcceptedToolsWithProvidedEvidence: `21`
- externalAgentAdapterContractsAuthorizedWithRuntimeBlocksTools: `21`
- externalAgentAdapterCpuStaticContractsWithProvidedEvidence: `6`
- externalAgentAdapterBrowserRuntimeContractsWithProvidedEvidence: `7`
- externalAgentAdapterGpuModelContractsWithProvidedEvidence: `8`
- externalAgentMappedProductionProfilesAcceptedWithProvidedEvidence: `21`
- externalAgentCanInvokeAdapterNowToolsWithProvidedEvidence: `0`
- externalAgentToolAdapterGpuRuntimeShouldStartNowToolsWithProvidedEvidence: `0`
- gpuModelRuntimeAdmissionBlockedToolsWithReadinessProbeEvidence: `8`
- gpuModelRuntimeAdmissionEvaluatedFailClosedToolsWithReadinessProbeEvidence: `8`
- gpuModelRuntimeUnblockPlanExposedToolsWithReadinessProbeEvidence: `8`
- gpuModelNativeGpuProofRequiredToolsWithReadinessProbeEvidence: `8`
- gpuModelPrivateEvidenceAndNativeGpuProofRequiredToolsWithReadinessProbeEvidence: `5`
- gpuModelNativeGpuProofOnlyRequiredToolsWithReadinessProbeEvidence: `3`
- gpuModelToolsReadyForExecutionAfterCurrentEvidenceWithReadinessProbeEvidence: `0`
- routeReadinessProbeGpuRuntimeShouldStartNowTools: `0`
- apiRouteMountReadyToolsWithProvidedEvidence: `21`
- apiRouteMountedNowTools: `0`
- externalBetaReadyNowTools: `0`
- productionReadyNowTools: `0`

## Required Evidence Notes

- CPU/static adapter/enqueue admission accepted: `true`
- CPU/static service-role queue-write smoke preflight accepted: `true`
- guarded CPU/static non-production evidence sequence
- `npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence`
- CPU/static saved service-role queue-write smoke proof accepted: `false`
- CPU/static worker claim/dispatch smoke proof accepted: `false`
- Satori font runtime proof accepted: `true`
- CPU/static tool execution dry-run proof accepted: `false`
- CPU/static controlled tool execution proof accepted: `false`
- `npm run ai-graphics:external-agent-cpu-static-private-worker-controlled-tool-execution-proof:diagnostics`
- native GPU proof collection
- `npm run ai-graphics:external-beta-native-gpu-proof-collection:diagnostics`
- Satori font runtime proof diagnostics
- `npm run ai-graphics:satori-font-runtime-proof:diagnostics`
- browser runtime proof diagnostics
- `npm run ai-graphics:browser-runtime-proof:diagnostics`
- Representative disabled route blocked-detail cases covered: `21`
- Controlled route-executable tools with readiness-probe evidence: `13`
- CPU/static controlled route-executable tools with readiness-probe evidence: `6`
- Browser runtime controlled route-executable tools with readiness-probe evidence: `7`
- GPU/model route-admission blocked tools with readiness-probe evidence: `8`
- GPU/model unblock plans exposed with readiness-probe evidence: `8`
- GPU/model native GPU proof required with readiness-probe evidence: `8`
- GPU/model private evidence plus native GPU proof required with readiness-probe evidence: `5`
- GPU/model native GPU proof-only required with readiness-probe evidence: `3`
- GPU/model tools ready for execution after current evidence: `0`
- Native GPU proof only: `torch_torchvision`, `transformers`, and `kornia`
- Private model-weight evidence plus native GPU proof: `sam2`, `birefnet`, `real_esrgan`, `rembg`, and `transparent_background`
- gpuModelExternalBetaReadinessBlocker
- modelWeightPrivateEvidenceRequired
- Route readiness probe evidence is accepted
- `npm run ai-graphics:external-beta-tool-call-route-readiness-probe-smoke:diagnostics`
- Controlled canonical route execution smoke accepted: `true`
- controlledCanonicalRouteExecutedToolsWithProvidedEvidence: `13`
- cpuStaticControlledCanonicalRouteExecutedToolsWithProvidedEvidence: `6`
- browserRuntimeControlledCanonicalRouteExecutedToolsWithProvidedEvidence: `7`
- localControlledPackageExecutionPerformedToolsWithProvidedEvidence: `13`
- controlledAdapterExecutedToolsWithProvidedEvidence: `13`
- Controlled worker-route execution smoke accepted: `true`
- controlledWorkerRouteExecutionSmokeAcceptedToolsWithProvidedEvidence: `13`
- externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence: `13`
- controlledWorkerRouteMockQueueInsertedJobsWithProvidedEvidence: `13`
- controlledWorkerRouteMockWorkerClaimsCreatedWithProvidedEvidence: `13`
- controlledWorkerRouteMockWorkerEventsRecordedWithProvidedEvidence: `13`
- controlledWorkerRouteExecutionPerformedToolsWithProvidedEvidence: `13`
- `npm run ai-graphics:external-agent-controlled-worker-route-execution-smoke:diagnostics`
- gpuModelRuntimeAdmissionEvaluatedToolsWithProvidedEvidence: `8`
- gpuModelRuntimeAdmissionBlockedToolsWithProvidedEvidence: `8`
- gpuRuntimeStartAllowedForAcceptedExternalBetaJobToolsWithProvidedEvidence: `0`
- GPU/model proof-ref queue admission accepted: `true`
- gpuModelProofRefQueueAdmissionAcceptedToolsWithProvidedEvidence: `8`
- gpuModelRuntimeAdmissionReadyWithProvidedProofRefsTools: `8`
- gpuModelProofRefNativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence: `8`
- gpuModelProofRefModelWeightManifestAcceptedToolsWithProvidedEvidence: `5`
- gpuModelProofRefMockQueueInsertedJobsWithProvidedEvidence: `8`
- gpuModelProofRefMockWorkerClaimsCreatedWithProvidedEvidence: `8`
- gpuRuntimeStartAllowedForAcceptedExternalBetaJobToolsWithProofRefEvidence: `8`
- gpuModelProofRefQueueAdmissionGpuRuntimeShouldStartNowToolsWithProvidedEvidence: `0`
- gpuModelProofRefQueueAdmissionToolExecutionPerformedToolsWithProvidedEvidence: `0`
- `npm run ai-graphics:external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke:diagnostics`
- Mock queue worker-claim smoke accepted: `true`

## Booleans

- `externalAgentExecutionGatePrepared`: true
- `source21ToolProperInstallAuditAccepted`: true
- `sourceExternalBetaCallableRequestAdmissionAccepted`: true
- `sourceExternalBetaApiRouteMountReadinessAccepted`: true
- `sourceExternalBetaControlledOnDemandStatusBridgeAccepted`: true
- `sourceExternalAgentCpuStaticLiveAdapterQueueWriteProofAccepted`: true
- `sourceExternalAgentCpuStaticExactExecutionAdmissionAccepted`: true
- `sourceExternalAgentCpuStaticAdapterInvocationEnqueueAdmissionAccepted`: true
- `sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted`: true
- `sourceExternalAgentCpuStaticNonProductionEvidenceSequencePrepared`: true
- `sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted`: false
- `sourceExternalAgentCpuStaticWorkerClaimAndDispatchSmokeProofAccepted`: false
- `sourceExternalAgentCpuStaticToolExecutionDryRunProofAccepted`: false
- `sourceExternalAgentCpuStaticControlledToolExecutionProofAccepted`: false
- `sourceExternalBetaToolCallRouteReadinessProbeSmokeAccepted`: true
- `sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmokeAccepted`: true
- `sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokeAccepted`: true
- `sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokeAccepted`: true
- `sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokeAccepted`: true
- `sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmokeAccepted`: true
- `sourceExternalAgentToolAdapterAuthorizationAccepted`: true
- `sourceSatoriFontRuntimeProofAccepted`: true
- `properInstallAuditAccepted`: true
- `all21ToolsProperlyInstalledForPlannedSurface`: true
- `installAuditSeparatesPlannedSurfaceFromRuntimeCallable`: true
- `externalBetaCallableInstallReadyNow`: false
- `controlledOnDemandExternalBetaReadyWithProvidedEvidence`: true
- `controlledOnDemandWorkerPathReadyButDirectAgentExecutionBlocked`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `all8GpuToolsTargetGpuRuntime`: true
- `externalBetaCallableCandidatesWithProvidedEvidence`: true
- `externalBetaCallableRequestAdmissionReadyWithProvidedEvidence`: true
- `routeMountReadyWithProvidedEvidence`: true
- `routeMountPreparedButNotMounted`: true
- `cpuStaticLiveAdapterQueueServiceProofAccepted`: true
- `allFiveCpuStaticLiveAdapterQueueWriteProofsPassedWithProvidedEvidence`: true
- `allFiveCpuStaticMockQueueServiceValidationsPassed`: true
- `cpuStaticExactExecutionAdmissionAccepted`: true
- `allFiveCpuStaticExactExecutionAdmissionsReady`: true
- `allFiveCpuStaticExactRequestEnvelopesAccepted`: true
- `allFiveCpuStaticApprovedPlanSnapshotsAccepted`: true
- `allFiveCpuStaticPrivateArtifactManifestsAccepted`: true
- `allFiveCpuStaticWorkerAcceptedRequestSchemasAccepted`: true
- `allFiveCpuStaticExternalAgentExactRequestsAdmittedWithProvidedEvidence`: true
- `cpuStaticAdapterInvocationEnqueueAdmissionAccepted`: true
- `allFiveCpuStaticAdapterInvocationEnqueueAdmissionsReady`: true
- `allFiveCpuStaticAdapterInvocationEnvelopesPrepared`: true
- `allFiveCpuStaticWorkerEnqueuePayloadsPrepared`: true
- `allFiveCpuStaticProductionWorkerJobPayloadsAccepted`: true
- `allFiveCpuStaticExternalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence`: true
- `cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted`: true
- `allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReady`: true
- `allFiveCpuStaticExternalAgentNonProductionServiceRoleQueueWriteSmokePreflightsReadyWithProvidedEvidence`: true
- `allFiveCpuStaticNonProductionEvidenceSequencePreparedWithRuntimeBlocks`: true
- `nonProductionEvidenceSequenceKeepsRuntimeBlocks`: true
- `liveEvidenceSequenceExecutedNow`: false
- `allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokeProofsAcceptedWithProvidedEvidence`: false
- `allFiveCpuStaticNonProductionServiceRoleQueueWritesAcceptedWithProvidedEvidence`: false
- `nonProductionServiceRoleQueueWriteSmokeCleanupVerifiedWithProvidedEvidence`: false
- `allFiveCpuStaticWorkerClaimAndDispatchSmokeProofsAcceptedWithProvidedEvidence`: false
- `allFiveCpuStaticWorkerClaimsAcceptedWithProvidedEvidence`: false
- `allFiveCpuStaticWorkerDispatchHandoffsAcceptedWithProvidedEvidence`: false
- `allFiveCpuStaticWorkerDispatchLeasesReleasedWithProvidedEvidence`: false
- `allFiveCpuStaticToolExecutionDryRunProofsPreparedWithProvidedEvidence`: false
- `allFiveCpuStaticDryToolExecutionContractsPrepared`: false
- `allFiveCpuStaticControlledToolExecutionProofsAcceptedWithProvidedEvidence`: false
- `allFiveCpuStaticPhase0ExecutionEvidenceAccepted`: false
- `satoriRemainsBlockedPendingApprovedFontFixture`: false
- `satoriFontRuntimeProofAcceptedWithProvidedEvidence`: true
- `satoriFontBlockResolvedForLocalRuntimeProof`: true
- `allSixCpuStaticLocalRuntimeProofsAcceptedWithProvidedEvidence`: true
- `fifteenNonCpuStaticToolsRemainDeferredToRuntimeLanes`: true
- `nonProductionServiceRoleQueueWriteSmokeRequiredBeforeExecution`: true
- `nonProductionServiceRoleQueueWriteSmokeResultRequiredBeforeExecution`: true
- `workerClaimAndDispatchSmokeProofRequiredBeforeExecution`: false
- `toolExecutionDryRunProofRequiredBeforeExecution`: false
- `controlledToolExecutionProofRequiredBeforeExecution`: false
- `adapterInvocationAndWorkerEnqueueAdmissionRequiredBeforeExecution`: false
- `approvedPlanSnapshotRequired`: true
- `creditReservationRequired`: true
- `privateArtifactManifestRequired`: true
- `structuredToolEnvelopeRequired`: true
- `rawChatExecutionAllowed`: false
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: true
- `agentCanSelectForPlanning`: true
- `externalAgentCanExecuteControlledRouteToolsNow`: true
- `routeReadinessProbeAcceptedWithProvidedEvidence`: true
- `agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow`: true
- `controlledCanonicalRouteExecutionSmokeAcceptedWithProvidedEvidence`: true
- `thirteenControlledToolsExecutedViaCanonicalRouteWithProvidedEvidence`: true
- `sixCpuStaticControlledToolsExecutedViaCanonicalRouteWithProvidedEvidence`: true
- `sevenBrowserRuntimeControlledToolsExecutedViaCanonicalRouteWithProvidedEvidence`: true
- `sourceExternalAgentControlledWorkerRouteExecutionSmokeAccepted`: true
- `externalAgentControlledWorkerRouteExecutionSmokeAcceptedWithProvidedEvidence`: true
- `thirteenControlledToolsExecutedViaClaimedWorkerRouteWithProvidedEvidence`: true
- `externalAgentCanExecuteControlledWorkerRouteToolsNow`: true
- `eightGpuModelToolsAdmissionFailClosedViaCanonicalRouteWithProvidedEvidence`: true
- `allEightGpuModelProofRefQueueAdmissionsAcceptedWithProvidedEvidence`: true
- `allEightGpuModelProofRefMockWorkerClaimsAcceptedWithProvidedEvidence`: true
- `gpuModelProofRefQueueAdmissionKeepsGpuRuntimeIdle`: true
- `gpuModelProofRefQueueAdmissionKeepsBroadExecutionBlocked`: true
- `all21MockQueueWorkerClaimSmokeAcceptedWithProvidedEvidence`: true
- `all21RouteAdmittedMockJobsClaimedWithProvidedEvidence`: true
- `mockQueueWorkerClaimSmokeKeepsLiveRuntimeBlocked`: true
- `externalAgentToolAdapterAuthorizationAcceptedWithProvidedEvidence`: true
- `all21ExternalAgentAdapterContractsAuthorizedWithRuntimeBlocks`: true
- `all21ExternalAgentMappedProductionProfilesAccepted`: true
- `externalAgentAdapterAuthorizationKeepsInvocationBlocked`: true
- `controlledRouteExecutionSmokeKeepsBroadExecutionBlocked`: true
- `gpuModelUnblockPlanAcceptedWithProvidedEvidence`: true
- `allEightGpuModelToolsHaveActionableUnblockPlan`: true
- `fiveModelWeightToolsRequirePrivateEvidenceBeforeGpuProof`: true
- `threeFoundationGpuToolsRequireNativeGpuProofOnly`: true
- `gpuModelToolsReadyForExecutionAfterCurrentEvidence`: false
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteGpuModelToolsNow`: false
- `externalAgentCanInvokeAdapterNow`: false
- `agentCanExecuteToolsNow`: false
- `externalAgentExecutionAllowedNow`: false
- `apiRouteMountedNow`: false
- `apiRouteExecutionApprovedNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerQueueApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `providerRuntimeApprovedNow`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `gpuRuntimeShouldStartNow`: false
- `runtimeReadyNow`: false
- `internalBetaReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false
- `toolExecutionPerformed`: false
- `workerExecutionPerformed`: false
- `workerEnqueuePerformed`: false
- `routeExecutionPerformed`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimePerformed`: false
- `gpuRuntimePerformed`: false
- `modelWeightsDownloaded`: false
- `modelWeightsLoaded`: false
- `mediaProcessingPerformed`: false
- `supabaseMutationPerformed`: false
- `gcsUploadPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

## Diagnostic Compatibility Evidence

- External-agent tool-adapter authorization accepted: `true`
- CPU/static live-adapter queue-service proof accepted: `true`
- CPU/static exact execution admission accepted: `true`
- checked-in packet has no saved smoke result yet
- direct agent execution remains blocked
- actual execution still blocked
- tool/capability-specific blocked details
- apiRouteMountedNow=false
- exit code `2`
- agentCanExecuteToolsNow=false
- satoriRemainsBlockedPendingApprovedFontFixture=false
- satoriFontRuntimeProofAcceptedWithProvidedEvidence=true
- satoriFontBlockResolvedForLocalRuntimeProof=true
- allSixCpuStaticLocalRuntimeProofsAcceptedWithProvidedEvidence=true
- gpuModelUnblockPlanAcceptedWithProvidedEvidence=true
- gpuModelToolsReadyForExecutionAfterCurrentEvidence=false
- npm run ai-graphics:external-agent-tool-adapter-authorization-proof:diagnostics
- npm run ai-graphics:external-beta-tool-call-route-mock-queue-worker-claim-smoke:diagnostics
- npm run ai-graphics:external-beta-tool-call-route-cpu-static-controlled-execution-smoke:diagnostics
- npm run ai-graphics:external-beta-tool-call-route-browser-runtime-controlled-execution-smoke:diagnostics
- npm run ai-graphics:external-beta-tool-call-route-gpu-model-runtime-admission-smoke:diagnostics

## Tool Rows

| Tool | Runtime target | Current blocker | Safe next command |
| --- | --- | --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-beta-native-gpu-proof-collection:diagnostics` |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-beta-native-gpu-proof-collection:diagnostics` |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-beta-native-gpu-proof-collection:diagnostics` |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-beta-native-gpu-proof-collection:diagnostics` |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-beta-native-gpu-proof-collection:diagnostics` |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-beta-native-gpu-proof-collection:diagnostics` |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-beta-native-gpu-proof-collection:diagnostics` |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-beta-native-gpu-proof-collection:diagnostics` |
| `d3` | `node_cpu_static` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence` |
| `echarts` | `browser_chart_runtime_later` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:browser-runtime-proof:diagnostics` |
| `vega_lite` | `node_cpu_static` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence` |
| `vega` | `node_cpu_static` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence` |
| `satori` | `node_cpu_static` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof:diagnostics` |
| `svgdotjs_svg_js` | `node_cpu_static` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence` |
| `viz_js` | `node_cpu_static` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence` |
| `lottie_web` | `browser_animation_runtime_later` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:browser-runtime-proof:diagnostics` |
| `animejs` | `browser_animation_runtime_later` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:browser-runtime-proof:diagnostics` |
| `three_js` | `browser_canvas_webgl_runtime_later` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:browser-runtime-proof:diagnostics` |
| `pixi_js` | `browser_canvas_webgl_runtime_later` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:browser-runtime-proof:diagnostics` |
| `konva` | `browser_canvas_webgl_runtime_later` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:browser-runtime-proof:diagnostics` |
| `babylonjs` | `browser_canvas_webgl_runtime_later` | `external_agent_execution_gate_fail_closed_runtime_blocked` | `npm run ai-graphics:browser-runtime-proof:diagnostics` |
