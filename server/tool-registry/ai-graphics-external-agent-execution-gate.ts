import {
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import { listAiGraphicsToolCallHandoffTools } from './ai-graphics-tool-call-handoff'
import {
  AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION,
  type AiGraphicsExternalBetaCallableRequestAdmission,
} from './ai-graphics-external-beta-callable-request-admission'
import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_READINESS_DECISION,
  type AiGraphicsExternalBetaApiRouteMountReadiness,
} from './ai-graphics-external-beta-api-route-mount-readiness'
import {
  AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_ON_DEMAND_STATUS_BRIDGE_DECISION,
  type AiGraphicsExternalBetaControlledOnDemandStatusBridge,
} from './ai-graphics-external-beta-controlled-on-demand-status-bridge'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_ENQUEUE_ADMISSION_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_TOOL_ADAPTER_AUTHORIZATION_DECISION,
  type AiGraphicsExternalAgentToolAdapterAuthorizationReport,
} from './ai-graphics-external-agent-tool-adapter-authorization'

export const AI_GRAPHICS_EXTERNAL_AGENT_EXECUTION_GATE_DECISION =
  'ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings'
export const AI_GRAPHICS_21_TOOL_PROPER_INSTALL_AUDIT_DECISION =
  'ai_graphics_21_tool_proper_install_audit_completed_with_runtime_blocks'
export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_EVIDENCE_SEQUENCE_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_non_production_evidence_sequence_prepared_with_runtime_blocks'
export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_READINESS_PROBE_SMOKE_DECISION =
  'ai_graphics_external_beta_tool_call_route_readiness_probe_smoke_passed'
export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_SMOKE_DECISION =
  'ai_graphics_external_beta_tool_call_route_cpu_static_controlled_execution_smoke_passed'
export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_SMOKE_DECISION =
  'ai_graphics_external_beta_tool_call_route_browser_runtime_controlled_execution_smoke_passed'
export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_SMOKE_DECISION =
  'ai_graphics_external_beta_tool_call_route_gpu_model_runtime_admission_smoke_passed'
export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_PROOF_REF_QUEUE_ADMISSION_SMOKE_DECISION =
  'ai_graphics_external_beta_tool_call_route_gpu_model_proof_ref_queue_admission_smoke_passed'
export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_WORKER_CLAIM_SMOKE_DECISION =
  'ai_graphics_external_beta_tool_call_route_mock_queue_worker_claim_smoke_passed'
export const AI_GRAPHICS_EXTERNAL_AGENT_CONTROLLED_WORKER_ROUTE_EXECUTION_SMOKE_DECISION =
  'ai_graphics_external_agent_controlled_worker_route_execution_smoke_passed_with_runtime_blocks'
export const AI_GRAPHICS_SATORI_FONT_RUNTIME_PROOF_DECISION =
  'ai_graphics_satori_font_runtime_proof_completed_with_warnings'

export type AiGraphicsExternalAgentExecutionGateStatus =
  | 'missing_21_tool_proper_install_audit'
  | '21_tool_proper_install_audit_rejected'
  | 'missing_external_beta_callable_request_admission'
  | 'external_beta_callable_request_admission_rejected'
  | 'missing_external_beta_api_route_mount_readiness'
  | 'external_beta_api_route_mount_readiness_rejected'
  | 'missing_external_beta_controlled_on_demand_status_bridge'
  | 'external_beta_controlled_on_demand_status_bridge_rejected'
  | 'missing_external_agent_cpu_static_private_worker_exact_execution_admission'
  | 'external_agent_cpu_static_private_worker_exact_execution_admission_rejected'
  | 'missing_external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission'
  | 'external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission_rejected'
  | 'missing_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof'
  | 'external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_rejected'
  | 'missing_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight'
  | 'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_rejected'
  | 'external_agent_cpu_static_private_worker_non_production_evidence_sequence_rejected'
  | 'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_proof_rejected'
  | 'external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_proof_rejected'
  | 'external_agent_cpu_static_private_worker_tool_execution_dry_run_proof_rejected'
  | 'external_agent_cpu_static_private_worker_controlled_tool_execution_proof_rejected'
  | 'external_agent_execution_gate_controlled_route_ready_direct_global_execution_blocked'
  | 'external_agent_execution_gate_fail_closed_runtime_blocked'

export interface AiGraphics21ToolProperInstallAudit {
  decision: typeof AI_GRAPHICS_21_TOOL_PROPER_INSTALL_AUDIT_DECISION
  status: 'completed_with_runtime_blocks'
  counts: {
    totalTools: 21
    properlyInstalledForPlannedSurface: 21
    runtimeProofPassedButToolCallBlocked: 13
    nativeGpuRuntimeProofPending: 8
    modelWeightManifestPending: 5
    externalBetaCallableInstallReadyNow: 0
    properlyInstalledForExternalBetaRuntimeNow: 0
    agentExecutableNow: 0
    runtimeReadyNow: 0
    betaTestingReadyNow: 0
    productionReadyNow: 0
  }
  booleans: {
    all21ToolsAudited: true
    all21ToolsInstalledForPlannedSurfaceOnly: true
    properInstallAuditSeparatesPlannedSurfaceFromRuntimeCallable: true
    gpuHeavyToolsTargetGpuRuntime: true
    gpuHeavyToolsTargetCpuRuntime: false
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    runtimeReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformedInThisAudit: false
    packageLockMutationPerformed: false
  }
  toolRows?: Array<{
    toolId: AiGraphicsCanonicalToolId
    installSurface: string
    properlyInstalledForPlannedSurface: true
    runtimeReadyNow: false
  }>
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionEvidenceSequencePacket {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_EVIDENCE_SEQUENCE_DECISION
  status:
    'external_agent_cpu_static_private_worker_non_production_evidence_sequence_prepared_not_executed'
  toolsCovered: 5
  toolsCoveredIds: AiGraphicsCanonicalToolId[]
  liveEvidenceSequenceExecutedNow: false
  liveSupabaseQueueWritesNow: 0
  liveWorkerClaimsNow: 0
  liveWorkerDispatchHandoffsNow: 0
  toolExecutionsPerformedNow: 0
  agentCanExecuteToolsNow: false
  gpuRuntimeShouldStartNow: false
  runtimeReadyNow: false
  externalBetaReadyNow: false
  productionReadyNow: false
  booleans?: {
    externalAgentCpuStaticPrivateWorkerNonProductionEvidenceSequencePrepared?: true
    exactFiveCpuStaticToolsOnly?: true
    serverOnlyServiceRoleCredentialsRequired?: true
    nonProductionEnvironmentRequired?: true
    explicitOperatorConfirmationRequired?: true
    queueWriteSmokeRunsFirst?: true
    queueWriteProofMustValidateBeforeClaimDispatch?: true
    claimDispatchSmokeRunsSecond?: true
    claimDispatchProofMustValidateBeforeExecutionGate?: true
    localArtifactsOnly?: true
    cleanupRequired?: true
    noToolExecutionBySequence?: true
    agentCanSelectForPlanning?: true
    agentCanExecuteToolsNow?: false
    liveQueueWriteApprovedNow?: false
    workerClaimApprovedNow?: false
    workerDispatchApprovedNow?: false
    workerExecutionApprovedNow?: false
    toolExecutionApprovedNow?: false
    gpuRuntimeShouldStartNow?: false
    runtimeReadyNow?: false
    externalBetaReadyNow?: false
    productionReadyNow?: false
    dependencyInstallPerformed?: false
    packageLockMutationPerformed?: false
    supabaseMutationPerformed?: false
    publicArtifactCreated?: false
    signedUrlCreated?: false
  }
}

export interface AiGraphicsExternalBetaToolCallRouteReadinessProbeSmokePacket {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_READINESS_PROBE_SMOKE_DECISION
  status:
    'canonical_tool_call_route_readiness_probe_reports_13_executable_and_8_blocked'
  counts: {
    totalAiGraphicsTools: 21
    productFacingCapabilities: 12
    externalAgentRouteExecutableNowTools: 13
    cpuStaticControlledExecutableNowTools: 6
    browserRuntimeControlledExecutableNowTools: 7
    gpuModelRuntimeAdmissionBlockedTools: 8
    gpuModelRuntimeAdmissionEvaluatedFailClosedTools: 8
    gpuModelRuntimeUnblockPlanExposedTools?: 8
    gpuModelNativeGpuProofRequiredTools?: 8
    gpuModelPrivateEvidenceAndNativeGpuProofRequiredTools?: 5
    gpuModelNativeGpuProofOnlyRequiredTools?: 3
    gpuModelToolsReadyForExecutionAfterCurrentEvidence?: 0
    modelWeightManifestRequiredTools: 5
    gpuRuntimeShouldStartNowTools: 0
    workerDispatchApprovedNowTools: 0
    workerDispatchPerformedTools: 0
    providerRuntimePerformedTools: 0
    publicArtifactCreatedTools: 0
    signedUrlCreatedTools: 0
  }
  booleans: {
    externalBetaToolCallRouteReadinessProbeSafe: true
    routeMountedByAppNow: true
    mockOnlyRuntimeModeEnforced: true
    agentCanSelectForPlanning: true
    externalAgentCanExecuteSomeToolsNow: true
    agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow: true
    gpuModelUnblockPlanExposed?: true
    allEightGpuModelToolsHaveActionableUnblockPlan?: true
    fiveModelWeightToolsRequirePrivateEvidenceBeforeGpuProof?: true
    threeFoundationGpuToolsRequireNativeGpuProofOnly?: true
    gpuModelToolsReadyForExecutionAfterCurrentEvidence?: false
    agentCanExecuteAll21ToolsNow: false
    agentCanExecuteGpuModelToolsNow: false
    routeExecutionPerformedByReadinessProbe: false
    workerExecutionApprovedNow: false
    workerDispatchApprovedNow: false
    workerDispatchPerformed: false
    toolExecutionApprovedNow: false
    toolExecutionPerformedByReadinessProbe: false
    providerRuntimeApprovedNow: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimeApprovedNow: false
    browserWebglCanvasRuntimePerformedByReadinessProbe: false
    gpuRuntimeApprovedNow: false
    gpuRuntimePerformed: false
    gpuRuntimeShouldStartNow: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    modelInferencePerformed: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
  }
  toolSummary: Array<{
    toolId: AiGraphicsCanonicalToolId
    canonicalRouteMode:
      | 'cpu_static_controlled_execution'
      | 'browser_runtime_controlled_execution'
      | 'gpu_model_runtime_admission_blocked'
    externalAgentCanExecuteThisToolNow: boolean
    routeCanEvaluateFailClosedGpuModelAdmissionNow: boolean
    gpuModelUnblockPlanStatus?: string | null
    nextExternalAgentAction?: string | null
    nativeGpuRuntimeProofRequired?: boolean
    nativeGpuRuntimeProofAccepted?: boolean
    modelWeightPrivateEvidenceRequired?: boolean
    modelWeightPrivateEvidenceAccepted?: boolean
    gpuRuntimeShouldStartNow: false
  }>
}

export interface AiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionSmokePacket {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_SMOKE_DECISION
  status:
    'canonical_tool_call_route_cpu_static_controlled_execution_passed_for_six_tools'
  counts: {
    totalAiGraphicsTools: 21
    cpuStaticControlledCanonicalRouteExecutedTools: 6
    localCpuStaticPackageExecutionPerformedTools: 6
    controlledAdapterExecutedTools: 6
    nonCpuStaticBlockedTools: 15
    all21ExecutableNowTools: 0
    workerDispatchPerformedTools: 0
    gpuRuntimeShouldStartNowTools: 0
    publicArtifactCreatedTools: 0
    signedUrlCreatedTools: 0
  }
  booleans: {
    canonicalToolCallRouteCpuStaticControlledExecutionSmokePassed: true
    canonicalToolCallRouteMountedWithCpuStaticExecutionFlag: true
    sixCpuStaticToolsExecutableViaCanonicalRouteNow: true
    sixCpuStaticToolsExecutedViaCanonicalRouteNow: true
    localCpuStaticPackageExecutionPerformed: true
    privateOutputMetadataReturned: true
    nonCpuStaticToolsRemainBlocked: true
    agentCanExecuteCpuStaticControlledToolsNow: true
    agentCanExecuteAll21ToolsNow: false
    workerExecutionApprovedNow: false
    workerDispatchPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    gpuRuntimeShouldStartNow: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
    runtimeReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
  }
}

export interface AiGraphicsExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokePacket {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_SMOKE_DECISION
  status:
    'canonical_tool_call_route_controlled_execution_passed_for_thirteen_cpu_static_and_browser_tools'
  counts: {
    totalAiGraphicsTools: 21
    controlledCanonicalRouteExecutedTools: 13
    cpuStaticControlledCanonicalRouteExecutedTools: 6
    browserRuntimeControlledCanonicalRouteExecutedTools: 7
    localPackageExecutionPerformedTools: 13
    controlledAdapterExecutedTools: 13
    gpuModelBlockedTools: 8
    all21ExecutableNowTools: 0
    workerDispatchPerformedTools: 0
    gpuRuntimeShouldStartNowTools: 0
    publicArtifactCreatedTools: 0
    signedUrlCreatedTools: 0
  }
  booleans: {
    canonicalToolCallRouteBrowserRuntimeControlledExecutionSmokePassed: true
    canonicalToolCallRouteMountedWithCpuStaticAndBrowserRuntimeExecutionFlags: true
    thirteenControlledToolsExecutableViaCanonicalRouteNow: true
    thirteenControlledToolsExecutedViaCanonicalRouteNow: true
    sevenBrowserRuntimeToolsExecutableViaCanonicalRouteNow: true
    sevenBrowserRuntimeToolsExecutedViaCanonicalRouteNow: true
    sixCpuStaticToolsStillExecutableViaCanonicalRouteNow: true
    localControlledPackageExecutionPerformed: true
    privateOutputMetadataReturned: true
    gpuModelToolsRemainBlocked: true
    agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow: true
    agentCanExecuteAll21ToolsNow: false
    workerExecutionApprovedNow: false
    workerDispatchPerformed: false
    providerRuntimePerformed: false
    controlledLocalBrowserRuntimePerformed: true
    browserRuntimeStartedByCanonicalRoute: true
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    gpuRuntimeShouldStartNow: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
    runtimeReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
  }
}

export interface AiGraphicsExternalAgentControlledWorkerRouteExecutionSmokePacket {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CONTROLLED_WORKER_ROUTE_EXECUTION_SMOKE_DECISION
  status:
    'controlled_worker_claim_route_execution_passed_for_thirteen_tools_gpu_model_still_blocked'
  counts: {
    totalAiGraphicsTools: 21
    totalProductFacingCapabilities: 12
    controlledWorkerRouteExecutionAttemptedTools: 13
    controlledWorkerRouteExecutionCompletedTools: 13
    mockQueueInsertedJobsWithProvidedEvidence: 13
    mockWorkerClaimsCreatedWithProvidedEvidence: 13
    mockWorkerEventsRecordedWithProvidedEvidence: 13
    controlledCanonicalRouteExecutedToolsWithProvidedEvidence: 13
    cpuStaticControlledCanonicalRouteExecutedToolsWithProvidedEvidence: 6
    browserRuntimeControlledCanonicalRouteExecutedToolsWithProvidedEvidence: 7
    localControlledPackageExecutionPerformedToolsWithProvidedEvidence: 13
    controlledAdapterExecutedToolsWithProvidedEvidence: 13
    gpuModelBlockedToolsWithProvidedEvidence: 8
    externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence: 13
    externalAgentBroadExecutableNowTools: 0
    workerDispatchPerformedTools: 0
    routeExecutionPerformedTools: 13
    toolExecutionPerformedTools: 0
    gpuRuntimeShouldStartNowTools: 0
    publicArtifactCreatedTools: 0
    signedUrlCreatedTools: 0
    externalBetaReadyNowTools: 0
    productionReadyNowTools: 0
  }
  booleans: {
    externalAgentControlledWorkerRouteExecutionSmokePassed: true
    sourceRouteControlledExecutionSmokeAccepted: true
    mockQueueServiceClaimAccepted: true
    mockQueueServiceWorkerEventAccepted: true
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    thirteenControlledToolsClaimedBeforeRouteExecution: true
    thirteenControlledToolsExecutedViaClaimedCanonicalRoute: true
    sixCpuStaticToolsExecutedViaClaimedCanonicalRoute: true
    sevenBrowserRuntimeToolsExecutedViaClaimedCanonicalRoute: true
    eightGpuModelToolsRemainBlocked: true
    localControlledPackageExecutionPerformed: true
    controlledAdapterExecutionPerformed: true
    privateOutputMetadataReturned: true
    agentCanSelectForPlanning: true
    externalAgentCanExecuteControlledWorkerRouteToolsNow: true
    agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow: true
    agentCanExecuteAll21ToolsNow: false
    agentCanExecuteGpuModelToolsNow: false
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: true
    routeExecutionPerformed: true
    mockWorkerClaimPerformed: true
    backendQueueSubmissionApprovedNow: false
    backendQueueSubmissionPerformed: false
    liveQueueWriteApprovedNow: false
    liveQueueWritePerformed: false
    workerExecutionApprovedNow: false
    workerExecutionPerformed: false
    workerEnqueueApprovedNow: false
    workerEnqueuePerformed: false
    workerDispatchApprovedNow: false
    workerDispatchPerformed: false
    toolExecutionApprovedNow: false
    toolExecutionPerformed: false
    providerRuntimeApprovedNow: false
    providerRuntimePerformed: false
    controlledLocalBrowserRuntimePerformed: true
    browserRuntimeStartedByCanonicalRoute: true
    browserWebglCanvasRuntimeApprovedNow: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimeApprovedNow: false
    gpuRuntimePerformed: false
    gpuRuntimeShouldStartNow: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    modelInferencePerformed: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
  }
}

export interface AiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokePacket {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_SMOKE_DECISION
  status:
    'canonical_tool_call_route_gpu_model_runtime_admission_fail_closed_for_eight_tools'
  counts: {
    totalAiGraphicsTools: 21
    controlledCanonicalRouteExecutedTools: 13
    gpuModelRuntimeAdmissionEvaluatedTools: 8
    gpuModelRuntimeAdmissionBlockedTools: 8
    modelWeightManifestRequiredTools: 5
    nativeGpuRuntimeProofRequiredTools: 8
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 0
    gpuRuntimeShouldStartNowTools: 0
    workerDispatchPerformedTools: 0
    toolExecutionPerformedTools: 0
    modelWeightsLoadedTools: 0
    publicArtifactCreatedTools: 0
    signedUrlCreatedTools: 0
  }
  booleans: {
    canonicalToolCallRouteGpuModelRuntimeAdmissionSmokePassed: true
    canonicalToolCallRouteGpuModelRuntimeAdmissionEvaluated: true
    eightGpuModelToolsEvaluatedByCanonicalRouteNow: true
    eightGpuModelToolsRemainFailClosed: true
    allGpuModelToolsReportNativeGpuProofMissing: true
    allModelWeightToolsReportManifestMissing: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow: true
    agentCanExecuteAll21ToolsNow: false
    agentCanExecuteGpuModelToolsNow: false
    routeExecutionPerformed: true
    workerExecutionApprovedNow: false
    workerDispatchPerformed: false
    toolExecutionApprovedNow: false
    toolExecutionPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    gpuRuntimeShouldStartNow: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    modelInferencePerformed: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
    runtimeReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
  }
}

export interface AiGraphicsExternalBetaToolCallRouteMockQueueWorkerClaimSmokePacket {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_WORKER_CLAIM_SMOKE_DECISION
  status: 'route_mock_queue_worker_claim_smoke_passed_for_all_21_tools'
  counts: {
    all21ToolsInLane: 21
    totalProductFacingCapabilities: 12
    routeAdmissionAcceptedTools: 21
    mockQueueInsertedJobs: 21
    mockWorkerClaimAttemptedTools: 21
    mockWorkerClaimsCreated: 21
    mockWorkerLeaseSeconds: 900
    gpuRuntimeTargetedTools: 8
    agentCanExecuteToolsNowTools: 0
    liveQueueWritePerformedTools: 0
    workerDispatchPerformedTools: 0
    toolExecutionPerformedTools: 0
    gpuRuntimeShouldStartNowTools: 0
    publicArtifactCreatedTools: 0
    signedUrlCreatedTools: 0
  }
  booleans: {
    externalBetaToolCallRouteMockQueueWorkerClaimSmokePassed: true
    sourceRouteMockQueueAdmissionAccepted: true
    all21RouteAdmittedMockJobsClaimed: true
    mockOnlyRuntimeModeEnforced: true
    privateWorkerClaimLeaseOnly: true
    agentCanSelectForPlanning: true
    agentCanSubmitToolCallToQueueAdmissionNow: true
    agentCanClaimMockWorkerLeaseNow: true
    agentCanExecuteToolsNow: false
    routeExecutionPerformed: true
    mockWorkerClaimPerformed: true
    backendQueueSubmissionPerformed: false
    liveQueueWritePerformed: false
    liveWorkerClaimPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    workerDispatchPerformed: false
    toolExecutionPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    gpuRuntimeShouldStartNow: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
  }
  tools?: AiGraphicsCanonicalToolId[]
}

export interface AiGraphicsExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokePacket {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_PROOF_REF_QUEUE_ADMISSION_SMOKE_DECISION
  status:
    'gpu_model_proof_ref_route_mock_queue_admission_and_claim_passed_for_eight_tools'
  counts: {
    totalAiGraphicsTools: 21
    gpuModelToolsCovered: 8
    gpuModelProofRefMockQueueAdmissionAcceptedTools: 8
    gpuModelRuntimeAdmissionReadyWithProvidedEvidenceTools: 8
    nativeGpuRuntimeProofRefAcceptedTools: 8
    modelWeightManifestRefAcceptedTools: 5
    modelWeightManifestRequiredTools: 5
    mockQueueInsertedJobs: 8
    mockWorkerClaimsCreated: 8
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8
    liveQueueWritePerformedTools: 0
    workerDispatchPerformedTools: 0
    toolExecutionPerformedTools: 0
    gpuRuntimeShouldStartNowTools: 0
    modelWeightsLoadedTools: 0
    publicArtifactCreatedTools: 0
    signedUrlCreatedTools: 0
    externalBetaReadyNowTools: 0
    productionReadyNowTools: 0
  }
  booleans: {
    externalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokePassed: true
    all8GpuModelToolsCovered: true
    all8GpuModelProofRefMockQueueAdmissionsAccepted: true
    all8GpuModelMockJobsClaimed: true
    mockOnlyRuntimeModeEnforced: true
    privateWorkerClaimLeaseOnly: true
    routeQueueAdmissionRequiresProofRefs: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanSubmitGpuModelToolCallToQueueAdmissionNow: true
    agentCanClaimMockGpuModelWorkerLeaseNow: true
    agentCanExecuteGpuModelToolsNow: false
    agentCanExecuteAll21ToolsNow: false
    agentCanExecuteToolsNow: false
    routeExecutionPerformed: true
    mockWorkerClaimPerformed: true
    backendQueueSubmissionPerformed: false
    liveQueueWritePerformed: false
    liveWorkerClaimPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    workerDispatchPerformed: false
    toolExecutionPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    gpuRuntimeShouldStartNow: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    modelInferencePerformed: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
  }
  gpuModelTools?: AiGraphicsCanonicalToolId[]
  routeQueuedJobs?: Array<{
    toolId: AiGraphicsCanonicalToolId
    runtimeJobAdmissionReadyWithProvidedEvidence?: boolean
    nativeGpuRuntimeProofRefAccepted?: boolean
    modelWeightManifestRequired?: boolean
    modelWeightManifestRefAccepted?: boolean
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob?: boolean
    gpuRuntimeShouldStartNow?: false
    toolExecutionPerformed?: false
    publicArtifactCreated?: false
    signedUrlCreated?: false
  }>
  workerClaims?: Array<{
    toolId: AiGraphicsCanonicalToolId
    mockWorkerClaimCreated?: boolean
    privateWorkerClaimLeaseOnly?: boolean
    gpuRuntimeShouldStartNow?: false
    toolExecutionPerformed?: false
    publicArtifactCreated?: false
    signedUrlCreated?: false
  }>
}

export interface AiGraphicsExternalAgentExecutionGateInput {
  source21ToolProperInstallAuditPacket?: Partial<AiGraphics21ToolProperInstallAudit>
  sourceExternalBetaCallableRequestAdmissionPacket?: Partial<AiGraphicsExternalBetaCallableRequestAdmission>
  sourceExternalBetaApiRouteMountReadinessPacket?: Partial<AiGraphicsExternalBetaApiRouteMountReadiness>
  sourceExternalBetaControlledOnDemandStatusBridgePacket?: Partial<AiGraphicsExternalBetaControlledOnDemandStatusBridge>
  sourceExternalAgentCpuStaticLiveAdapterQueueWriteProofPacket?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofReport>
  sourceExternalAgentCpuStaticExactExecutionAdmissionPacket?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport>
  sourceExternalAgentCpuStaticAdapterInvocationEnqueueAdmissionPacket?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionReport>
  sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightPacket?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport>
  sourceExternalAgentCpuStaticNonProductionEvidenceSequencePacket?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionEvidenceSequencePacket>
  sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokeProofPacket?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport>
  sourceExternalAgentCpuStaticWorkerClaimAndDispatchSmokeProofPacket?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofReport>
  sourceExternalAgentCpuStaticToolExecutionDryRunProofPacket?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofReport>
  sourceExternalAgentCpuStaticControlledToolExecutionProofPacket?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofReport>
  sourceExternalBetaToolCallRouteReadinessProbeSmokePacket?:
    Partial<AiGraphicsExternalBetaToolCallRouteReadinessProbeSmokePacket>
  sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmokePacket?:
    Partial<AiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionSmokePacket>
  sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokePacket?:
    Partial<AiGraphicsExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokePacket>
  sourceExternalAgentControlledWorkerRouteExecutionSmokePacket?:
    Partial<AiGraphicsExternalAgentControlledWorkerRouteExecutionSmokePacket>
  sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokePacket?:
    Partial<AiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokePacket>
  sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokePacket?:
    Partial<AiGraphicsExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokePacket>
  sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmokePacket?:
    Partial<AiGraphicsExternalBetaToolCallRouteMockQueueWorkerClaimSmokePacket>
  sourceExternalAgentToolAdapterAuthorizationPacket?:
    Partial<AiGraphicsExternalAgentToolAdapterAuthorizationReport>
  sourceSatoriFontRuntimeProofPacket?:
    Partial<AiGraphicsSatoriFontRuntimeProofReport>
}

export interface AiGraphicsSatoriFontRuntimeProofReport {
  decision: typeof AI_GRAPHICS_SATORI_FONT_RUNTIME_PROOF_DECISION
  status: 'completed_with_warnings'
  proofScope: 'satori_cpu_static_text_svg_layout_with_locked_package_font_fixture'
  tool?: {
    toolId?: 'satori'
    packageName?: 'satori'
    status?: 'satori_font_fixture_svg_layout_proof_passed'
    runtimeTarget?: 'node_cpu_static_svg_layout'
    fontFixture?: {
      packageName?: 'three'
      path?: string
      sha256?: string
      byteLength?: number
    }
    outputContract?: {
      hasSvgRoot?: boolean
      hasExpectedViewBox?: boolean
      pathCount?: number
      deterministic?: boolean
      svgArtifactCommitted?: boolean
      publicArtifactCreated?: boolean
    }
    agentExecutableNow?: false
    routeExecutionUsed?: false
    workerExecutionUsed?: false
    providerRuntimeUsed?: false
    publicArtifactCreated?: false
  }
  booleans?: {
    satoriFontRuntimeProofCompleted?: true
    lockedPackageFontFixtureUsed?: true
    satoriTextSvgLayoutProofPassed?: true
    dependencyInstallPerformed?: false
    packageLockMutationPerformed?: false
    generatedArtifactsCommitted?: false
    publicArtifactCreated?: false
    signedUrlCreated?: false
    providerRuntimePerformed?: false
    browserWebglCanvasRuntimePerformed?: false
    gpuRuntimePerformed?: false
    agentCanSelectForPlanning?: true
    agentCanExecuteToolsNow?: false
    toolRouteExecutionReadyNow?: false
    workerExecutionReadyNow?: false
    browserWebglCanvasRuntimeReadyNow?: false
    gpuModelRuntimeReadyNow?: false
    runtimeBetaReadyNow?: false
    internalBetaReadyNow?: false
    externalBetaReadyNow?: false
    productionReadyNow?: false
  }
}

export interface AiGraphicsExternalAgentExecutionGateToolRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: string
  workerType: string
  runtimeTarget: string
  installSurface: string | null
  properlyInstalledForPlannedSurface: boolean
  externalBetaCallableInstallReadyNow: false
  runtimeReadyNow: false
  gpuRequiredForRuntime: boolean
  externalBetaCallableCandidateWithProvidedEvidence: boolean
  requestAdmissionCandidateWithProvidedEvidence: boolean
  cpuStaticLiveAdapterQueueWriteProofStatus: string | null
  cpuStaticLiveAdapterQueueWriteProofPassedWithProvidedEvidence: boolean
  satoriFontRuntimeProofAcceptedWithProvidedEvidence: boolean
  cpuStaticLocalRuntimeProofAcceptedWithProvidedEvidence: boolean
  nonProductionServiceRoleQueueWriteSmokeRequired: boolean
  cpuStaticExactExecutionAdmissionStatus: string | null
  cpuStaticExactExecutionAdmissionReady: boolean
  externalAgentExactRequestAdmittedWithProvidedEvidence: boolean
  cpuStaticAdapterInvocationEnqueueAdmissionStatus: string | null
  cpuStaticAdapterInvocationEnqueueAdmissionReady: boolean
  externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence: boolean
  cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightStatus: string | null
  cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightReady: boolean
  externalAgentNonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidence: boolean
  cpuStaticNonProductionServiceRoleQueueWriteSmokeProofStatus: string | null
  cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence: boolean
  cpuStaticWorkerClaimAndDispatchSmokeProofStatus: string | null
  cpuStaticWorkerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence: boolean
  cpuStaticWorkerClaimsAcceptedWithProvidedEvidence: number
  cpuStaticWorkerDispatchHandoffsAcceptedWithProvidedEvidence: number
  cpuStaticWorkerDispatchLeasesReleasedWithProvidedEvidence: number
  cpuStaticToolExecutionDryRunProofStatus: string | null
  cpuStaticToolExecutionDryRunProofPreparedWithProvidedEvidence: boolean
  cpuStaticDryToolExecutionContractPrepared: boolean
  cpuStaticControlledToolExecutionProofStatus: string | null
  cpuStaticControlledToolExecutionProofAcceptedWithProvidedEvidence: boolean
  cpuStaticPhase0ExecutionEvidenceAccepted: boolean
  adapterInvocationAndWorkerEnqueueAdmissionRequired: boolean
  workerClaimAndDispatchSmokeProofRequired: boolean
  toolExecutionDryRunProofRequired: boolean
  controlledToolExecutionProofRequired: boolean
  executionAllowedNow: false
  gpuRuntimeShouldStartNow: false
  gpuModelUnblockPlanStatus: string | null
  gpuModelExternalBetaReadinessBlocker: string | null
  nextExternalAgentAction: string | null
  nativeGpuRuntimeProofRequired: boolean
  nativeGpuRuntimeProofAccepted: boolean
  modelWeightPrivateEvidenceRequired: boolean
  modelWeightPrivateEvidenceAccepted: boolean
  gpuModelProofRefQueueAdmissionStatus: string | null
  gpuModelProofRefQueueAdmissionAcceptedWithProvidedEvidence: boolean
  gpuModelRuntimeJobAdmissionReadyWithProvidedProofRefs: boolean
  gpuModelProofRefMockWorkerClaimedWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobWithProofRefs: boolean
  currentBlocker: string
  requiredBeforeExecution: string[]
  safeNextCommand: string
}

export interface AiGraphicsExternalAgentExecutionGate {
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_EXECUTION_GATE_DECISION
  status: AiGraphicsExternalAgentExecutionGateStatus
  mode: 'fail_closed_ai_graphics_external_agent_execution_gate'
  source21ToolProperInstallAuditDecision:
    typeof AI_GRAPHICS_21_TOOL_PROPER_INSTALL_AUDIT_DECISION | null
  sourceExternalBetaCallableRequestAdmissionDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION | null
  sourceExternalBetaApiRouteMountReadinessDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_READINESS_DECISION | null
  sourceExternalBetaControlledOnDemandStatusBridgeDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_ON_DEMAND_STATUS_BRIDGE_DECISION | null
  sourceExternalAgentCpuStaticLiveAdapterQueueWriteProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION | null
  sourceExternalAgentCpuStaticExactExecutionAdmissionDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION | null
  sourceExternalAgentCpuStaticAdapterInvocationEnqueueAdmissionDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_ENQUEUE_ADMISSION_DECISION | null
  sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION | null
  sourceExternalAgentCpuStaticNonProductionEvidenceSequenceDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_EVIDENCE_SEQUENCE_DECISION | null
  sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokeProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION | null
  sourceExternalAgentCpuStaticWorkerClaimAndDispatchSmokeProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF_DECISION | null
  sourceExternalAgentCpuStaticToolExecutionDryRunProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF_DECISION | null
  sourceExternalAgentCpuStaticControlledToolExecutionProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF_DECISION | null
  sourceExternalBetaToolCallRouteReadinessProbeSmokeDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_READINESS_PROBE_SMOKE_DECISION | null
  sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmokeDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_SMOKE_DECISION | null
  sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokeDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_SMOKE_DECISION | null
  sourceExternalAgentControlledWorkerRouteExecutionSmokeDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CONTROLLED_WORKER_ROUTE_EXECUTION_SMOKE_DECISION | null
  sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokeDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_SMOKE_DECISION | null
  sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokeDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_PROOF_REF_QUEUE_ADMISSION_SMOKE_DECISION | null
  sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmokeDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_WORKER_CLAIM_SMOKE_DECISION | null
  sourceExternalAgentToolAdapterAuthorizationDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_TOOL_ADAPTER_AUTHORIZATION_DECISION | null
  sourceSatoriFontRuntimeProofDecision:
    typeof AI_GRAPHICS_SATORI_FONT_RUNTIME_PROOF_DECISION | null
  source21ToolProperInstallAuditAccepted: boolean
  sourceExternalBetaCallableRequestAdmissionAccepted: boolean
  sourceExternalBetaApiRouteMountReadinessAccepted: boolean
  sourceExternalBetaControlledOnDemandStatusBridgeAccepted: boolean
  sourceExternalAgentCpuStaticLiveAdapterQueueWriteProofAccepted: boolean
  sourceExternalAgentCpuStaticExactExecutionAdmissionAccepted: boolean
  sourceExternalAgentCpuStaticAdapterInvocationEnqueueAdmissionAccepted: boolean
  sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted: boolean
  sourceExternalAgentCpuStaticNonProductionEvidenceSequencePrepared: boolean
  sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted: boolean
  sourceExternalAgentCpuStaticWorkerClaimAndDispatchSmokeProofAccepted: boolean
  sourceExternalAgentCpuStaticToolExecutionDryRunProofAccepted: boolean
  sourceExternalAgentCpuStaticControlledToolExecutionProofAccepted: boolean
  sourceExternalBetaToolCallRouteReadinessProbeSmokeAccepted: boolean
  sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmokeAccepted: boolean
  sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokeAccepted: boolean
  sourceExternalAgentControlledWorkerRouteExecutionSmokeAccepted: boolean
  sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokeAccepted: boolean
  sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokeAccepted: boolean
  sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmokeAccepted: boolean
  sourceExternalAgentToolAdapterAuthorizationAccepted: boolean
  sourceSatoriFontRuntimeProofAccepted: boolean
  readyForAnyExternalAgentExecutionNow: false
  executionAllowedNow: false
  requireGoExitCodeWhenBlocked: 2
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  properlyInstalledForPlannedSurfaceTools: 0 | 21
  runtimeProofPassedButToolCallBlockedTools: 0 | 13
  nativeGpuRuntimeProofPendingTools: 0 | 8
  modelWeightManifestPendingTools: 0 | 5
  externalBetaCallableInstallReadyNowTools: 0
  controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence: 0 | 21
  controlledOnDemandExternalBetaCallableToolsWithProvidedEvidence: 0 | 21
  controlledOnDemandRuntimeReadyForToolCallToolsWithProvidedEvidence: 0 | 21
  cpuStaticLiveAdapterQueueWriteProofPassedWithProvidedEvidenceTools: 0 | 5
  cpuStaticMockQueueServiceValidationPassedTools: 0 | 5
  cpuStaticExactExecutionAdmissionReadyTools: 0 | 5
  cpuStaticExactRequestEnvelopeAcceptedTools: 0 | 5
  cpuStaticApprovedPlanSnapshotAcceptedTools: 0 | 5
  cpuStaticPrivateArtifactManifestAcceptedTools: 0 | 5
  cpuStaticWorkerAcceptedRequestSchemaAcceptedTools: 0 | 5
  externalAgentExactRequestAdmittedWithProvidedEvidenceTools: 0 | 5
  cpuStaticAdapterInvocationEnqueueAdmissionReadyTools: 0 | 5
  cpuStaticAdapterInvocationEnvelopePreparedTools: 0 | 5
  cpuStaticWorkerEnqueuePayloadPreparedTools: 0 | 5
  cpuStaticProductionWorkerJobPayloadAcceptedTools: 0 | 5
  externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidenceTools: 0 | 5
  cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightReadyTools: 0 | 5
  externalAgentNonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidenceTools: 0 | 5
  cpuStaticNonProductionEvidenceSequencePreparedTools: 0 | 5
  externalAgentCpuStaticNonProductionEvidenceSequencePreparedWithRuntimeBlocksTools: 0 | 5
  cpuStaticNonProductionEvidenceSequenceExecutedNowTools: 0
  cpuStaticNonProductionEvidenceSequenceLiveQueueWritesNow: 0
  cpuStaticNonProductionEvidenceSequenceLiveWorkerClaimsNow: 0
  cpuStaticNonProductionEvidenceSequenceLiveWorkerDispatchHandoffsNow: 0
  cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidenceTools: 0 | 5
  cpuStaticNonProductionServiceRoleQueueWritesAcceptedWithProvidedEvidenceTools: 0 | 5
  nonProductionServiceRoleQueueRowsPersistedAfterCleanup: 0
  cpuStaticWorkerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidenceTools: 0 | 5
  cpuStaticWorkerClaimsAcceptedWithProvidedEvidenceTools: 0 | 5
  cpuStaticWorkerDispatchHandoffsAcceptedWithProvidedEvidenceTools: 0 | 5
  cpuStaticWorkerDispatchLeasesReleasedWithProvidedEvidenceTools: 0 | 5
  cpuStaticToolExecutionDryRunProofPreparedWithProvidedEvidenceTools: 0 | 5
  cpuStaticDryToolExecutionContractsPreparedTools: 0 | 5
  cpuStaticControlledToolExecutionProofAcceptedWithProvidedEvidenceTools: 0 | 5
  cpuStaticPhase0ExecutionEvidenceAcceptedTools: 0 | 5
  cpuStaticSatoriBlockedPendingApprovedFontFixtureTools: 0 | 1
  cpuStaticSatoriFontRuntimeProofAcceptedWithProvidedEvidenceTools: 0 | 1
  cpuStaticLocalRuntimeProofsAcceptedWithProvidedEvidenceTools: 0 | 6
  cpuStaticNonCpuStaticDeferredTools: 0 | 15
  nonProductionServiceRoleQueueWriteSmokeRequiredTools: 0 | 5
  nonProductionServiceRoleQueueWriteSmokeResultRequiredTools: 0 | 5
  adapterInvocationAndWorkerEnqueueAdmissionRequiredTools: 0 | 5
  workerClaimAndDispatchSmokeProofRequiredTools: 0 | 5
  toolExecutionDryRunProofRequiredTools: 0 | 5
  controlledToolExecutionProofRequiredTools: 0 | 5
  externalBetaCallableCandidateToolsWithProvidedEvidence: number
  externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence: number
  externalAgentExecutableNowTools: 0
  disabledRouteBlockedDetailCasesWithProvidedEvidence: 0 | 21
  externalAgentRouteExecutableNowToolsWithReadinessProbeEvidence: 0 | 13
  cpuStaticControlledRouteExecutableNowToolsWithReadinessProbeEvidence: 0 | 6
  browserRuntimeControlledRouteExecutableNowToolsWithReadinessProbeEvidence: 0 | 7
  controlledCanonicalRouteExecutedToolsWithProvidedEvidence: 0 | 13
  cpuStaticControlledCanonicalRouteExecutedToolsWithProvidedEvidence: 0 | 6
  browserRuntimeControlledCanonicalRouteExecutedToolsWithProvidedEvidence: 0 | 7
  localControlledPackageExecutionPerformedToolsWithProvidedEvidence: 0 | 13
  controlledAdapterExecutedToolsWithProvidedEvidence: 0 | 13
  controlledWorkerRouteExecutionSmokeAcceptedToolsWithProvidedEvidence: 0 | 13
  externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence: 0 | 13
  controlledWorkerRouteMockQueueInsertedJobsWithProvidedEvidence: 0 | 13
  controlledWorkerRouteMockWorkerClaimsCreatedWithProvidedEvidence: 0 | 13
  controlledWorkerRouteMockWorkerEventsRecordedWithProvidedEvidence: 0 | 13
  controlledWorkerRouteExecutionPerformedToolsWithProvidedEvidence: 0 | 13
  gpuModelRuntimeAdmissionEvaluatedToolsWithProvidedEvidence: 0 | 8
  gpuModelRuntimeAdmissionBlockedToolsWithProvidedEvidence: 0 | 8
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobToolsWithProvidedEvidence: 0
  gpuModelProofRefQueueAdmissionAcceptedToolsWithProvidedEvidence: 0 | 8
  gpuModelRuntimeAdmissionReadyWithProvidedProofRefsTools: 0 | 8
  gpuModelProofRefNativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence: 0 | 8
  gpuModelProofRefModelWeightManifestAcceptedToolsWithProvidedEvidence: 0 | 5
  gpuModelProofRefMockQueueInsertedJobsWithProvidedEvidence: 0 | 8
  gpuModelProofRefMockWorkerClaimsCreatedWithProvidedEvidence: 0 | 8
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobToolsWithProofRefEvidence: 0 | 8
  gpuModelProofRefQueueAdmissionGpuRuntimeShouldStartNowToolsWithProvidedEvidence: 0
  gpuModelProofRefQueueAdmissionToolExecutionPerformedToolsWithProvidedEvidence: 0
  mockQueueWorkerClaimSmokeAcceptedToolsWithProvidedEvidence: 0 | 21
  mockQueueInsertedJobsWithProvidedEvidence: 0 | 21
  mockWorkerClaimsCreatedWithProvidedEvidence: 0 | 21
  mockWorkerLeaseSecondsWithProvidedEvidence: 0 | 900
  mockQueueWorkerClaimLiveQueueWritePerformedToolsWithProvidedEvidence: 0
  mockQueueWorkerClaimWorkerDispatchPerformedToolsWithProvidedEvidence: 0
  mockQueueWorkerClaimToolExecutionPerformedToolsWithProvidedEvidence: 0
  mockQueueWorkerClaimGpuRuntimeShouldStartNowToolsWithProvidedEvidence: 0
  externalAgentToolAdapterAuthorizationAcceptedToolsWithProvidedEvidence: 0 | 21
  externalAgentAdapterContractsAuthorizedWithRuntimeBlocksTools: 0 | 21
  externalAgentAdapterCpuStaticContractsWithProvidedEvidence: 0 | 6
  externalAgentAdapterBrowserRuntimeContractsWithProvidedEvidence: 0 | 7
  externalAgentAdapterGpuModelContractsWithProvidedEvidence: 0 | 8
  externalAgentMappedProductionProfilesAcceptedWithProvidedEvidence: 0 | 21
  externalAgentCanInvokeAdapterNowToolsWithProvidedEvidence: 0
  externalAgentToolAdapterGpuRuntimeShouldStartNowToolsWithProvidedEvidence: 0
  gpuModelRuntimeAdmissionBlockedToolsWithReadinessProbeEvidence: 0 | 8
  gpuModelRuntimeAdmissionEvaluatedFailClosedToolsWithReadinessProbeEvidence: 0 | 8
  gpuModelRuntimeUnblockPlanExposedToolsWithReadinessProbeEvidence: 0 | 8
  gpuModelNativeGpuProofRequiredToolsWithReadinessProbeEvidence: 0 | 8
  gpuModelPrivateEvidenceAndNativeGpuProofRequiredToolsWithReadinessProbeEvidence: 0 | 5
  gpuModelNativeGpuProofOnlyRequiredToolsWithReadinessProbeEvidence: 0 | 3
  gpuModelToolsReadyForExecutionAfterCurrentEvidenceWithReadinessProbeEvidence: 0
  routeReadinessProbeGpuRuntimeShouldStartNowTools: 0
  apiRouteMountReadyToolsWithProvidedEvidence: 0 | 21
  apiRouteMountedNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  toolRows: AiGraphicsExternalAgentExecutionGateToolRow[]
  safeCommandsBeforeExecution: string[]
  allowedPreExecutionActions: string[]
  forbiddenRuntimeActions: string[]
  recommendedNextPrompt: string
  booleans: {
    externalAgentExecutionGatePrepared: true
    source21ToolProperInstallAuditAccepted: boolean
    sourceExternalBetaCallableRequestAdmissionAccepted: boolean
    sourceExternalBetaApiRouteMountReadinessAccepted: boolean
    sourceExternalBetaControlledOnDemandStatusBridgeAccepted: boolean
    sourceExternalAgentCpuStaticLiveAdapterQueueWriteProofAccepted: boolean
    sourceExternalAgentCpuStaticExactExecutionAdmissionAccepted: boolean
    sourceExternalAgentCpuStaticAdapterInvocationEnqueueAdmissionAccepted: boolean
    sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted: boolean
    sourceExternalAgentCpuStaticNonProductionEvidenceSequencePrepared: boolean
    sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted: boolean
    sourceExternalAgentCpuStaticWorkerClaimAndDispatchSmokeProofAccepted: boolean
    sourceExternalAgentCpuStaticToolExecutionDryRunProofAccepted: boolean
    sourceExternalAgentCpuStaticControlledToolExecutionProofAccepted: boolean
    sourceExternalBetaToolCallRouteReadinessProbeSmokeAccepted: boolean
    sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmokeAccepted: boolean
    sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokeAccepted: boolean
    sourceExternalAgentControlledWorkerRouteExecutionSmokeAccepted: boolean
    sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokeAccepted: boolean
    sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokeAccepted: boolean
    sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmokeAccepted: boolean
    sourceExternalAgentToolAdapterAuthorizationAccepted: boolean
    sourceSatoriFontRuntimeProofAccepted: boolean
    properInstallAuditAccepted: boolean
    all21ToolsProperlyInstalledForPlannedSurface: boolean
    installAuditSeparatesPlannedSurfaceFromRuntimeCallable: boolean
    externalBetaCallableInstallReadyNow: false
    controlledOnDemandExternalBetaReadyWithProvidedEvidence: boolean
    controlledOnDemandWorkerPathReadyButDirectAgentExecutionBlocked: boolean
    all21ToolsCovered: boolean
    all12CapabilitiesCovered: boolean
    all8GpuToolsTargetGpuRuntime: boolean
    externalBetaCallableCandidatesWithProvidedEvidence: boolean
    externalBetaCallableRequestAdmissionReadyWithProvidedEvidence: boolean
    routeMountReadyWithProvidedEvidence: boolean
    routeMountPreparedButNotMounted: boolean
    cpuStaticLiveAdapterQueueServiceProofAccepted: boolean
    allFiveCpuStaticLiveAdapterQueueWriteProofsPassedWithProvidedEvidence: boolean
    allFiveCpuStaticMockQueueServiceValidationsPassed: boolean
    cpuStaticExactExecutionAdmissionAccepted: boolean
    allFiveCpuStaticExactExecutionAdmissionsReady: boolean
    allFiveCpuStaticExactRequestEnvelopesAccepted: boolean
    allFiveCpuStaticApprovedPlanSnapshotsAccepted: boolean
    allFiveCpuStaticPrivateArtifactManifestsAccepted: boolean
    allFiveCpuStaticWorkerAcceptedRequestSchemasAccepted: boolean
    allFiveCpuStaticExternalAgentExactRequestsAdmittedWithProvidedEvidence: boolean
    cpuStaticAdapterInvocationEnqueueAdmissionAccepted: boolean
    allFiveCpuStaticAdapterInvocationEnqueueAdmissionsReady: boolean
    allFiveCpuStaticAdapterInvocationEnvelopesPrepared: boolean
    allFiveCpuStaticWorkerEnqueuePayloadsPrepared: boolean
    allFiveCpuStaticProductionWorkerJobPayloadsAccepted: boolean
    allFiveCpuStaticExternalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence: boolean
    cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted: boolean
    allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReady: boolean
    allFiveCpuStaticExternalAgentNonProductionServiceRoleQueueWriteSmokePreflightsReadyWithProvidedEvidence: boolean
    allFiveCpuStaticNonProductionEvidenceSequencePreparedWithRuntimeBlocks: boolean
    nonProductionEvidenceSequenceKeepsRuntimeBlocks: boolean
    liveEvidenceSequenceExecutedNow: false
    allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokeProofsAcceptedWithProvidedEvidence: boolean
    allFiveCpuStaticNonProductionServiceRoleQueueWritesAcceptedWithProvidedEvidence: boolean
    nonProductionServiceRoleQueueWriteSmokeCleanupVerifiedWithProvidedEvidence: boolean
    allFiveCpuStaticWorkerClaimAndDispatchSmokeProofsAcceptedWithProvidedEvidence: boolean
    allFiveCpuStaticWorkerClaimsAcceptedWithProvidedEvidence: boolean
    allFiveCpuStaticWorkerDispatchHandoffsAcceptedWithProvidedEvidence: boolean
    allFiveCpuStaticWorkerDispatchLeasesReleasedWithProvidedEvidence: boolean
    allFiveCpuStaticToolExecutionDryRunProofsPreparedWithProvidedEvidence: boolean
    allFiveCpuStaticDryToolExecutionContractsPrepared: boolean
    allFiveCpuStaticControlledToolExecutionProofsAcceptedWithProvidedEvidence: boolean
    allFiveCpuStaticPhase0ExecutionEvidenceAccepted: boolean
    satoriRemainsBlockedPendingApprovedFontFixture: boolean
    satoriFontRuntimeProofAcceptedWithProvidedEvidence: boolean
    satoriFontBlockResolvedForLocalRuntimeProof: boolean
    allSixCpuStaticLocalRuntimeProofsAcceptedWithProvidedEvidence: boolean
    fifteenNonCpuStaticToolsRemainDeferredToRuntimeLanes: boolean
    nonProductionServiceRoleQueueWriteSmokeRequiredBeforeExecution: boolean
    nonProductionServiceRoleQueueWriteSmokeResultRequiredBeforeExecution: boolean
    workerClaimAndDispatchSmokeProofRequiredBeforeExecution: boolean
    toolExecutionDryRunProofRequiredBeforeExecution: boolean
    controlledToolExecutionProofRequiredBeforeExecution: boolean
    adapterInvocationAndWorkerEnqueueAdmissionRequiredBeforeExecution: boolean
    approvedPlanSnapshotRequired: true
    creditReservationRequired: true
    privateArtifactManifestRequired: true
    structuredToolEnvelopeRequired: true
    rawChatExecutionAllowed: false
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    externalAgentCanExecuteControlledRouteToolsNow: boolean
    routeReadinessProbeAcceptedWithProvidedEvidence: boolean
    agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow: boolean
    controlledCanonicalRouteExecutionSmokeAcceptedWithProvidedEvidence: boolean
    thirteenControlledToolsExecutedViaCanonicalRouteWithProvidedEvidence: boolean
    sixCpuStaticControlledToolsExecutedViaCanonicalRouteWithProvidedEvidence: boolean
    sevenBrowserRuntimeControlledToolsExecutedViaCanonicalRouteWithProvidedEvidence: boolean
    externalAgentControlledWorkerRouteExecutionSmokeAcceptedWithProvidedEvidence: boolean
    thirteenControlledToolsExecutedViaClaimedWorkerRouteWithProvidedEvidence: boolean
    externalAgentCanExecuteControlledWorkerRouteToolsNow: boolean
    eightGpuModelToolsAdmissionFailClosedViaCanonicalRouteWithProvidedEvidence: boolean
    allEightGpuModelProofRefQueueAdmissionsAcceptedWithProvidedEvidence: boolean
    allEightGpuModelProofRefMockWorkerClaimsAcceptedWithProvidedEvidence: boolean
    gpuModelProofRefQueueAdmissionKeepsGpuRuntimeIdle: boolean
    gpuModelProofRefQueueAdmissionKeepsBroadExecutionBlocked: boolean
    all21MockQueueWorkerClaimSmokeAcceptedWithProvidedEvidence: boolean
    all21RouteAdmittedMockJobsClaimedWithProvidedEvidence: boolean
    mockQueueWorkerClaimSmokeKeepsLiveRuntimeBlocked: boolean
    externalAgentToolAdapterAuthorizationAcceptedWithProvidedEvidence: boolean
    all21ExternalAgentAdapterContractsAuthorizedWithRuntimeBlocks: boolean
    all21ExternalAgentMappedProductionProfilesAccepted: boolean
    externalAgentAdapterAuthorizationKeepsInvocationBlocked: boolean
    controlledRouteExecutionSmokeKeepsBroadExecutionBlocked: boolean
    gpuModelUnblockPlanAcceptedWithProvidedEvidence: boolean
    allEightGpuModelToolsHaveActionableUnblockPlan: boolean
    fiveModelWeightToolsRequirePrivateEvidenceBeforeGpuProof: boolean
    threeFoundationGpuToolsRequireNativeGpuProofOnly: boolean
    gpuModelToolsReadyForExecutionAfterCurrentEvidence: false
    agentCanExecuteAll21ToolsNow: false
    agentCanExecuteGpuModelToolsNow: false
    externalAgentCanInvokeAdapterNow: false
    agentCanExecuteToolsNow: false
    externalAgentExecutionAllowedNow: false
    apiRouteMountedNow: false
    apiRouteExecutionApprovedNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    routeExecutionPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const safeCommandsBeforeExecution = [
  'npm run ai-graphics:21-tool-proper-install-audit:diagnostics',
  'npm run ai-graphics:external-agent-execution-gate',
  'npm run ai-graphics:external-beta-callable-request-admission',
  'npm run ai-graphics:external-beta-callable-scope',
  'npm run ai-graphics:external-beta-tool-call-gateway',
  'npm run ai-graphics:external-beta-runtime-admission',
  'npm run ai-graphics:external-beta-worker-enqueue-adapter',
  'npm run ai-graphics:external-beta-end-to-end-readiness:diagnostics',
  'npm run ai-graphics:external-beta-controlled-on-demand-status-bridge:diagnostics',
  'npm run ai-graphics:external-agent-cpu-static-private-worker-exact-execution-admission:diagnostics',
  'npm run ai-graphics:external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission:diagnostics',
  'npm run ai-graphics:external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof:diagnostics',
  'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight:diagnostics',
  'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof:diagnostics',
  'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence',
  'npm run ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof:diagnostics',
  'npm run ai-graphics:external-agent-cpu-static-private-worker-tool-execution-dry-run-proof:diagnostics',
  'npm run ai-graphics:external-agent-cpu-static-private-worker-controlled-tool-execution-proof:diagnostics',
  'npm run ai-graphics:external-beta-native-gpu-proof-collection:diagnostics',
  'npm run ai-graphics:external-beta-native-gpu-proof-operator-scaffold:diagnostics',
  'npm run ai-graphics:external-beta-native-gpu-proof-cloud-run-job-scaffold:diagnostics',
  'npm run ai-graphics:satori-font-runtime-proof:diagnostics',
  'npm run ai-graphics:browser-runtime-proof:diagnostics',
  'npm run ai-graphics:external-beta-service-role-queue-smoke-preflight:diagnostics',
]

const allowedPreExecutionActions = [
  'read sanitized callable-scope and request-admission evidence',
  'select, rank, and eliminate planning tools from the 21-tool AI graphics set',
  'explain missing proof before execution',
  'verify approved plan snapshot, credit reservation, private manifest, trace, and idempotency metadata',
  'return a fail-closed go/no-go decision for an external agent before any route, worker, provider, or tool call',
  'distinguish controlled on-demand worker-path readiness from direct agent execution',
  'read CPU/static live-adapter queue-service proof for the five closest tools while preserving execution blocks',
  'read CPU/static exact execution-admission evidence for the same five tools while preserving adapter, queue, worker, and tool execution blocks',
  'read CPU/static adapter-invocation and worker-enqueue admission evidence for the same five tools while preserving live queue, worker, and tool execution blocks',
  'read CPU/static non-production service-role queue-write smoke preflight evidence for the same five tools while preserving actual queue write, worker, and tool execution blocks',
  'prepare or explicitly run the guarded CPU/static non-production evidence sequence so queue-write proof is validated before worker claim and dispatch proof',
  'read saved CPU/static non-production service-role queue-write smoke proof when provided, then keep worker claim, dispatch, and tool execution blocked until the next proof gate passes',
  'read saved CPU/static worker claim and dispatch smoke proof when provided, then keep worker execution and tool execution blocked until the tool execution dry-run proof passes',
  'read CPU/static tool execution dry-run proof when provided, then keep adapter invocation, worker execution, and tool execution blocked until controlled private tool execution proof passes',
  'read CPU/static controlled tool execution proof when provided, then keep direct external-agent execution blocked until exact execution admission and require-go authorization are explicitly revalidated',
  'read native GPU proof collection, operator scaffold, and Cloud Run Job scaffold diagnostics for the eight GPU/model tools while preserving GPU runtime as on-demand only',
  'read Satori font runtime proof diagnostics for text-to-SVG layout readiness while preserving artifact and route execution blocks',
  'read browser runtime proof diagnostics for ECharts, Lottie, Anime.js, Three.js, PixiJS, Konva, and Babylon.js while preserving browser/WebGL/canvas runtime execution blocks',
  'preserve GPU startup as on-demand only for a later accepted worker/tool job',
]

const browserRuntimeProofTools = new Set<AiGraphicsCanonicalToolId>([
  'echarts',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
])

function safeNextCommand(input: {
  toolId: AiGraphicsCanonicalToolId
  gpuRequiredForRuntime: boolean
  satoriFontRuntimeProofAccepted?: boolean
  cpuStaticProofRow?: AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofRow
  cpuStaticExactAdmissionRow?: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow
  cpuStaticAdapterInvocationEnqueueAdmissionRow?: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionRow
  cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightRow?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow
  cpuStaticNonProductionServiceRoleQueueWriteSmokeProofRow?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofRow
  cpuStaticWorkerClaimAndDispatchSmokeProofRow?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofRow
  cpuStaticToolExecutionDryRunProofRow?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofRow
  cpuStaticControlledToolExecutionProofRow?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofRow
  gpuModelProofRefQueueAdmissionAccepted?: boolean
}): string {
  const adapterInvocationEnqueueAdmissionReady =
    input.cpuStaticAdapterInvocationEnqueueAdmissionRow
      ?.externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence === true
  const exactAdmissionReady =
    input.cpuStaticExactAdmissionRow?.externalAgentExactRequestAdmittedWithProvidedEvidence ===
    true
  const cpuStaticProofPassed =
    input.cpuStaticProofRow?.externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidence ===
    true
  const serviceRoleQueueWriteSmokePreflightReady =
    input.cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightRow
      ?.nonProductionServiceRoleQueueWriteSmokePreflightReady === true
  const serviceRoleQueueWriteSmokeProofAccepted =
    input.cpuStaticNonProductionServiceRoleQueueWriteSmokeProofRow
      ?.serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence === true
  const workerClaimAndDispatchSmokeProofAccepted =
    input.cpuStaticWorkerClaimAndDispatchSmokeProofRow
      ?.workerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence === true
  const toolExecutionDryRunProofAccepted =
    input.cpuStaticToolExecutionDryRunProofRow
      ?.dryToolExecutionProofPrepared === true
  const controlledToolExecutionProofAccepted =
    input.cpuStaticControlledToolExecutionProofRow
      ?.controlledToolExecutionProofAccepted === true

  if (controlledToolExecutionProofAccepted) {
    return 'npm run ai-graphics:external-agent-cpu-static-private-worker-exact-execution-admission:diagnostics'
  }
  if (toolExecutionDryRunProofAccepted) {
    return 'npm run ai-graphics:external-agent-cpu-static-private-worker-controlled-tool-execution-proof:diagnostics'
  }
  if (workerClaimAndDispatchSmokeProofAccepted) {
    return 'npm run ai-graphics:external-agent-cpu-static-private-worker-tool-execution-dry-run-proof:diagnostics'
  }
  if (serviceRoleQueueWriteSmokeProofAccepted) {
    return 'npm run ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof:diagnostics'
  }
  if (serviceRoleQueueWriteSmokePreflightReady) {
    return 'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-evidence-sequence'
  }
  if (cpuStaticProofPassed) {
    return 'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight:diagnostics'
  }
  if (adapterInvocationEnqueueAdmissionReady) {
    return 'npm run ai-graphics:external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof:diagnostics'
  }
  if (exactAdmissionReady) {
    return 'npm run ai-graphics:external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission:diagnostics'
  }
  if (input.gpuRequiredForRuntime) {
    return 'npm run ai-graphics:external-beta-native-gpu-proof-collection:diagnostics'
  }
  if (input.toolId === 'satori' && input.satoriFontRuntimeProofAccepted === true) {
    return 'npm run ai-graphics:external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof:diagnostics'
  }
  if (input.toolId === 'satori') {
    return 'npm run ai-graphics:satori-font-runtime-proof:diagnostics'
  }
  if (browserRuntimeProofTools.has(input.toolId)) {
    return 'npm run ai-graphics:browser-runtime-proof:diagnostics'
  }
  return 'npm run ai-graphics:external-agent-execution-gate'
}

const forbiddenRuntimeActions = [
  'agent/tool execution',
  'Tool Route execution',
  'API route execution',
  'live queue write',
  'Worker queue enqueue',
  'Worker execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'external beta traffic enablement',
  'production unlock',
]

const cpuStaticExactAdmissionTools = new Set<AiGraphicsCanonicalToolId>([
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
])

function exactCpuStaticToolSet(toolIds?: AiGraphicsCanonicalToolId[]): boolean {
  return Array.isArray(toolIds) &&
    toolIds.length === cpuStaticExactAdmissionTools.size &&
    toolIds.every((toolId) => cpuStaticExactAdmissionTools.has(toolId))
}

function sourceAdmissionAccepted(
  packet?: Partial<AiGraphicsExternalBetaCallableRequestAdmission>,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION &&
    packet.status === 'external_beta_callable_request_admission_ready_runtime_still_blocked' &&
    packet.booleans?.sourceExternalBetaCallableScopeAccepted === true &&
    packet.booleans?.sourceExternalBetaToolCallGatewayAccepted === true &&
    packet.booleans?.approvedPlanSnapshotAccepted === true &&
    packet.booleans?.creditReservationAccepted === true &&
    packet.booleans?.privateArtifactManifestAccepted === true &&
    packet.booleans?.gatewayControlsAccepted === true &&
    packet.booleans?.all21ToolsCovered === true &&
    packet.booleans?.all12CapabilitiesCovered === true &&
    packet.booleans?.all8GpuToolsTargetGpuRuntime === true &&
    packet.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet.booleans?.noIdleGpuRuntimeApproved === true &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false
}

function sourceProperInstallAuditAccepted(
  packet?: Partial<AiGraphics21ToolProperInstallAudit>,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_21_TOOL_PROPER_INSTALL_AUDIT_DECISION &&
    packet.status === 'completed_with_runtime_blocks' &&
    packet.counts?.totalTools === 21 &&
    packet.counts?.properlyInstalledForPlannedSurface === 21 &&
    packet.counts?.runtimeProofPassedButToolCallBlocked === 13 &&
    packet.counts?.nativeGpuRuntimeProofPending === 8 &&
    packet.counts?.modelWeightManifestPending === 5 &&
    packet.counts?.externalBetaCallableInstallReadyNow === 0 &&
    packet.counts?.properlyInstalledForExternalBetaRuntimeNow === 0 &&
    packet.counts?.agentExecutableNow === 0 &&
    packet.counts?.runtimeReadyNow === 0 &&
    packet.counts?.betaTestingReadyNow === 0 &&
    packet.counts?.productionReadyNow === 0 &&
    packet.booleans?.all21ToolsAudited === true &&
    packet.booleans?.all21ToolsInstalledForPlannedSurfaceOnly === true &&
    packet.booleans?.properInstallAuditSeparatesPlannedSurfaceFromRuntimeCallable === true &&
    packet.booleans?.gpuHeavyToolsTargetGpuRuntime === true &&
    packet.booleans?.gpuHeavyToolsTargetCpuRuntime === false &&
    packet.booleans?.agentCanSelectForPlanning === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.routeExecutionApprovedNow === false &&
    packet.booleans?.workerExecutionApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.browserWebglCanvasRuntimeApprovedNow === false &&
    packet.booleans?.gpuRuntimeApprovedNow === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    packet.booleans?.dependencyInstallPerformedInThisAudit === false &&
    packet.booleans?.packageLockMutationPerformed === false
}

function sourceRouteMountReadinessAccepted(
  packet?: Partial<AiGraphicsExternalBetaApiRouteMountReadiness>,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_READINESS_DECISION &&
    packet.status === 'api_route_mount_ready_with_provided_evidence_runtime_still_blocked' &&
    packet.booleans?.apiRouteMountReadyWithProvidedEvidence === true &&
    packet.booleans?.routeMountControlsSatisfied === true &&
    packet.booleans?.all21ToolsCovered === true &&
    packet.booleans?.all12CapabilitiesCovered === true &&
    packet.booleans?.all8GpuToolsTargetGpuRuntime === true &&
    packet.booleans?.apiRouteMountedNow === false &&
    packet.booleans?.routeExecutionApprovedNow === false &&
    packet.booleans?.workerExecutionApprovedNow === false &&
    packet.booleans?.workerEnqueueApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false
}

function packetNumber(packet: unknown, key: string): number | undefined {
  if (!packet || typeof packet !== 'object') return undefined
  const record = packet as Record<string, unknown>
  const direct = record[key]
  if (typeof direct === 'number') return direct
  const coverage = record.coverage
  if (coverage && typeof coverage === 'object') {
    const nested = (coverage as Record<string, unknown>)[key]
    if (typeof nested === 'number') return nested
  }
  return undefined
}

function packetBoolean(packet: unknown, key: string): boolean | undefined {
  if (!packet || typeof packet !== 'object') return undefined
  const record = packet as Record<string, unknown>
  const direct = record[key]
  if (typeof direct === 'boolean') return direct
  const booleans = record.booleans
  if (booleans && typeof booleans === 'object') {
    const nested = (booleans as Record<string, unknown>)[key]
    if (typeof nested === 'boolean') return nested
  }
  return undefined
}

function sourceControlledOnDemandStatusBridgeAccepted(
  packet?: Partial<AiGraphicsExternalBetaControlledOnDemandStatusBridge>,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_ON_DEMAND_STATUS_BRIDGE_DECISION &&
    packet.status === 'external_beta_controlled_on_demand_status_bridge_ready_with_warnings' &&
    packetNumber(packet, 'totalAiGraphicsTools') === 21 &&
    packetNumber(packet, 'totalProductFacingCapabilities') === 12 &&
    packetNumber(packet, 'gpuRuntimeTargetedTools') === 8 &&
    packetNumber(packet, 'externalBetaControlledOnDemandReadyTools') === 21 &&
    packetNumber(packet, 'externalBetaCallableNowTools') === 21 &&
    packetNumber(packet, 'externalBetaReadyNowTools') === 21 &&
    packetNumber(packet, 'runtimeReadyForOnDemandExternalBetaToolCallTools') === 21 &&
    packetNumber(packet, 'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence') === 21 &&
    packetNumber(packet, 'productionReadyNowTools') === 0 &&
    packet.readinessInterpretation ===
      'external_beta_ready_means_controlled_on_demand_worker_path_not_direct_agent_execution' &&
    packet.gpuPolicy?.gpuRuntimeOnDemandOnly === true &&
    packet.gpuPolicy?.noIdleGpuRuntimeApproved === true &&
    packet.gpuPolicy?.gpuStartsOnlyForApprovedWorkerOrToolCall === true &&
    packet.gpuPolicy?.gpuRuntimeShouldStartNow === false &&
    packetBoolean(packet, 'all21ToolsReadyForControlledOnDemandExternalBetaToolCalls') === true &&
    packetBoolean(packet, 'controlledExternalBetaToolCallReadinessClarified') === true &&
    packetBoolean(packet, 'externalBetaReadyNow') === true &&
    packetBoolean(packet, 'externalBetaCallableNow') === true &&
    packetBoolean(packet, 'agentCanExecuteToolsNow') === false &&
    packetBoolean(packet, 'directAgentToolExecutionApprovedNow') === false &&
    packetBoolean(packet, 'routeExecutionApprovedNow') === false &&
    packetBoolean(packet, 'workerExecutionApprovedNow') === false &&
    packetBoolean(packet, 'toolExecutionApprovedNow') === false &&
    packetBoolean(packet, 'gpuRuntimeApprovedNow') === false &&
    packetBoolean(packet, 'gpuRuntimeShouldStartNow') === false &&
    packetBoolean(packet, 'productionReadyNow') === false
}

function sourceExternalBetaToolCallRouteReadinessProbeSmokeAccepted(
  packet?: Partial<AiGraphicsExternalBetaToolCallRouteReadinessProbeSmokePacket>,
): boolean {
  const toolSummary = packet?.toolSummary ?? []
  const executableToolRows = toolSummary.filter(
    (row) => row.externalAgentCanExecuteThisToolNow === true,
  )
  const gpuBlockedRows = toolSummary.filter(
    (row) => row.canonicalRouteMode === 'gpu_model_runtime_admission_blocked' &&
      row.routeCanEvaluateFailClosedGpuModelAdmissionNow === true &&
      row.externalAgentCanExecuteThisToolNow === false &&
      typeof row.gpuModelUnblockPlanStatus === 'string' &&
      typeof row.nextExternalAgentAction === 'string' &&
      row.nativeGpuRuntimeProofRequired === true &&
      row.nativeGpuRuntimeProofAccepted === false,
  )
  const gpuModelWeightRows = gpuBlockedRows.filter(
    (row) => row.modelWeightPrivateEvidenceRequired === true &&
      row.modelWeightPrivateEvidenceAccepted === false,
  )
  const gpuNativeOnlyRows = gpuBlockedRows.filter(
    (row) => row.modelWeightPrivateEvidenceRequired === false &&
      row.nativeGpuRuntimeProofRequired === true,
  )
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_READINESS_PROBE_SMOKE_DECISION &&
    packet.status ===
      'canonical_tool_call_route_readiness_probe_reports_13_executable_and_8_blocked' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.productFacingCapabilities === 12 &&
    packet.counts?.externalAgentRouteExecutableNowTools === 13 &&
    packet.counts?.cpuStaticControlledExecutableNowTools === 6 &&
    packet.counts?.browserRuntimeControlledExecutableNowTools === 7 &&
    packet.counts?.gpuModelRuntimeAdmissionBlockedTools === 8 &&
    packet.counts?.gpuModelRuntimeAdmissionEvaluatedFailClosedTools === 8 &&
    packet.counts?.gpuModelRuntimeUnblockPlanExposedTools === 8 &&
    packet.counts?.gpuModelNativeGpuProofRequiredTools === 8 &&
    packet.counts?.gpuModelPrivateEvidenceAndNativeGpuProofRequiredTools === 5 &&
    packet.counts?.gpuModelNativeGpuProofOnlyRequiredTools === 3 &&
    packet.counts?.gpuModelToolsReadyForExecutionAfterCurrentEvidence === 0 &&
    packet.counts?.modelWeightManifestRequiredTools === 5 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.counts?.workerDispatchApprovedNowTools === 0 &&
    packet.counts?.workerDispatchPerformedTools === 0 &&
    packet.counts?.providerRuntimePerformedTools === 0 &&
    packet.counts?.publicArtifactCreatedTools === 0 &&
    packet.counts?.signedUrlCreatedTools === 0 &&
    packet.booleans?.externalBetaToolCallRouteReadinessProbeSafe === true &&
    packet.booleans?.routeMountedByAppNow === true &&
    packet.booleans?.mockOnlyRuntimeModeEnforced === true &&
    packet.booleans?.externalAgentCanExecuteSomeToolsNow === true &&
    packet.booleans?.agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow ===
      true &&
    packet.booleans?.gpuModelUnblockPlanExposed === true &&
    packet.booleans?.allEightGpuModelToolsHaveActionableUnblockPlan === true &&
    packet.booleans?.fiveModelWeightToolsRequirePrivateEvidenceBeforeGpuProof === true &&
    packet.booleans?.threeFoundationGpuToolsRequireNativeGpuProofOnly === true &&
    packet.booleans?.gpuModelToolsReadyForExecutionAfterCurrentEvidence === false &&
    packet.booleans?.agentCanExecuteAll21ToolsNow === false &&
    packet.booleans?.agentCanExecuteGpuModelToolsNow === false &&
    packet.booleans?.routeExecutionPerformedByReadinessProbe === false &&
    packet.booleans?.toolExecutionPerformedByReadinessProbe === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    Array.isArray(toolSummary) &&
    toolSummary.length === 21 &&
    executableToolRows.length === 13 &&
    gpuBlockedRows.length === 8 &&
    gpuModelWeightRows.length === 5 &&
    gpuNativeOnlyRows.length === 3 &&
    toolSummary.every((row) => row.gpuRuntimeShouldStartNow === false)
}

function sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmokeAccepted(
  packet?: Partial<AiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionSmokePacket>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_SMOKE_DECISION &&
    packet.status ===
      'canonical_tool_call_route_cpu_static_controlled_execution_passed_for_six_tools' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.cpuStaticControlledCanonicalRouteExecutedTools === 6 &&
    packet.counts?.localCpuStaticPackageExecutionPerformedTools === 6 &&
    packet.counts?.controlledAdapterExecutedTools === 6 &&
    packet.counts?.nonCpuStaticBlockedTools === 15 &&
    packet.counts?.all21ExecutableNowTools === 0 &&
    packet.counts?.workerDispatchPerformedTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.counts?.publicArtifactCreatedTools === 0 &&
    packet.counts?.signedUrlCreatedTools === 0 &&
    packet.booleans?.canonicalToolCallRouteCpuStaticControlledExecutionSmokePassed ===
      true &&
    packet.booleans?.canonicalToolCallRouteMountedWithCpuStaticExecutionFlag ===
      true &&
    packet.booleans?.sixCpuStaticToolsExecutableViaCanonicalRouteNow === true &&
    packet.booleans?.sixCpuStaticToolsExecutedViaCanonicalRouteNow === true &&
    packet.booleans?.localCpuStaticPackageExecutionPerformed === true &&
    packet.booleans?.privateOutputMetadataReturned === true &&
    packet.booleans?.nonCpuStaticToolsRemainBlocked === true &&
    packet.booleans?.agentCanExecuteCpuStaticControlledToolsNow === true &&
    packet.booleans?.agentCanExecuteAll21ToolsNow === false &&
    packet.booleans?.workerExecutionApprovedNow === false &&
    packet.booleans?.workerDispatchPerformed === false &&
    packet.booleans?.providerRuntimePerformed === false &&
    packet.booleans?.browserWebglCanvasRuntimePerformed === false &&
    packet.booleans?.gpuRuntimePerformed === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.supabaseMutationPerformed === false &&
    packet.booleans?.gcsUploadPerformed === false &&
    packet.booleans?.publicArtifactCreated === false &&
    packet.booleans?.signedUrlCreated === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    packet.booleans?.dependencyInstallPerformed === false &&
    packet.booleans?.packageLockMutationPerformed === false
}

function sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokeAccepted(
  packet?: Partial<AiGraphicsExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokePacket>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_SMOKE_DECISION &&
    packet.status ===
      'canonical_tool_call_route_controlled_execution_passed_for_thirteen_cpu_static_and_browser_tools' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.controlledCanonicalRouteExecutedTools === 13 &&
    packet.counts?.cpuStaticControlledCanonicalRouteExecutedTools === 6 &&
    packet.counts?.browserRuntimeControlledCanonicalRouteExecutedTools === 7 &&
    packet.counts?.localPackageExecutionPerformedTools === 13 &&
    packet.counts?.controlledAdapterExecutedTools === 13 &&
    packet.counts?.gpuModelBlockedTools === 8 &&
    packet.counts?.all21ExecutableNowTools === 0 &&
    packet.counts?.workerDispatchPerformedTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.counts?.publicArtifactCreatedTools === 0 &&
    packet.counts?.signedUrlCreatedTools === 0 &&
    packet.booleans?.canonicalToolCallRouteBrowserRuntimeControlledExecutionSmokePassed ===
      true &&
    packet.booleans
      ?.canonicalToolCallRouteMountedWithCpuStaticAndBrowserRuntimeExecutionFlags === true &&
    packet.booleans?.thirteenControlledToolsExecutableViaCanonicalRouteNow === true &&
    packet.booleans?.thirteenControlledToolsExecutedViaCanonicalRouteNow === true &&
    packet.booleans?.sevenBrowserRuntimeToolsExecutableViaCanonicalRouteNow === true &&
    packet.booleans?.sevenBrowserRuntimeToolsExecutedViaCanonicalRouteNow === true &&
    packet.booleans?.sixCpuStaticToolsStillExecutableViaCanonicalRouteNow === true &&
    packet.booleans?.localControlledPackageExecutionPerformed === true &&
    packet.booleans?.privateOutputMetadataReturned === true &&
    packet.booleans?.gpuModelToolsRemainBlocked === true &&
    packet.booleans?.agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow ===
      true &&
    packet.booleans?.agentCanExecuteAll21ToolsNow === false &&
    packet.booleans?.workerExecutionApprovedNow === false &&
    packet.booleans?.workerDispatchPerformed === false &&
    packet.booleans?.providerRuntimePerformed === false &&
    packet.booleans?.controlledLocalBrowserRuntimePerformed === true &&
    packet.booleans?.browserRuntimeStartedByCanonicalRoute === true &&
    packet.booleans?.browserWebglCanvasRuntimePerformed === false &&
    packet.booleans?.gpuRuntimePerformed === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.supabaseMutationPerformed === false &&
    packet.booleans?.gcsUploadPerformed === false &&
    packet.booleans?.publicArtifactCreated === false &&
    packet.booleans?.signedUrlCreated === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    packet.booleans?.dependencyInstallPerformed === false &&
    packet.booleans?.packageLockMutationPerformed === false
}

function sourceExternalAgentControlledWorkerRouteExecutionSmokeAccepted(
  packet?: Partial<AiGraphicsExternalAgentControlledWorkerRouteExecutionSmokePacket>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CONTROLLED_WORKER_ROUTE_EXECUTION_SMOKE_DECISION &&
    packet.status ===
      'controlled_worker_claim_route_execution_passed_for_thirteen_tools_gpu_model_still_blocked' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.totalProductFacingCapabilities === 12 &&
    packet.counts?.controlledWorkerRouteExecutionAttemptedTools === 13 &&
    packet.counts?.controlledWorkerRouteExecutionCompletedTools === 13 &&
    packet.counts?.mockQueueInsertedJobsWithProvidedEvidence === 13 &&
    packet.counts?.mockWorkerClaimsCreatedWithProvidedEvidence === 13 &&
    packet.counts?.mockWorkerEventsRecordedWithProvidedEvidence === 13 &&
    packet.counts?.controlledCanonicalRouteExecutedToolsWithProvidedEvidence ===
      13 &&
    packet.counts?.cpuStaticControlledCanonicalRouteExecutedToolsWithProvidedEvidence ===
      6 &&
    packet.counts?.browserRuntimeControlledCanonicalRouteExecutedToolsWithProvidedEvidence ===
      7 &&
    packet.counts?.localControlledPackageExecutionPerformedToolsWithProvidedEvidence ===
      13 &&
    packet.counts?.controlledAdapterExecutedToolsWithProvidedEvidence === 13 &&
    packet.counts?.gpuModelBlockedToolsWithProvidedEvidence === 8 &&
    packet.counts?.externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence ===
      13 &&
    packet.counts?.externalAgentBroadExecutableNowTools === 0 &&
    packet.counts?.workerDispatchPerformedTools === 0 &&
    packet.counts?.routeExecutionPerformedTools === 13 &&
    packet.counts?.toolExecutionPerformedTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.counts?.publicArtifactCreatedTools === 0 &&
    packet.counts?.signedUrlCreatedTools === 0 &&
    packet.counts?.externalBetaReadyNowTools === 0 &&
    packet.counts?.productionReadyNowTools === 0 &&
    packet.booleans?.externalAgentControlledWorkerRouteExecutionSmokePassed ===
      true &&
    packet.booleans?.sourceRouteControlledExecutionSmokeAccepted === true &&
    packet.booleans?.mockQueueServiceClaimAccepted === true &&
    packet.booleans?.mockQueueServiceWorkerEventAccepted === true &&
    packet.booleans?.all21ToolsCovered === true &&
    packet.booleans?.all12CapabilitiesCovered === true &&
    packet.booleans?.thirteenControlledToolsClaimedBeforeRouteExecution === true &&
    packet.booleans?.thirteenControlledToolsExecutedViaClaimedCanonicalRoute ===
      true &&
    packet.booleans?.sixCpuStaticToolsExecutedViaClaimedCanonicalRoute === true &&
    packet.booleans?.sevenBrowserRuntimeToolsExecutedViaClaimedCanonicalRoute ===
      true &&
    packet.booleans?.eightGpuModelToolsRemainBlocked === true &&
    packet.booleans?.localControlledPackageExecutionPerformed === true &&
    packet.booleans?.controlledAdapterExecutionPerformed === true &&
    packet.booleans?.privateOutputMetadataReturned === true &&
    packet.booleans?.agentCanSelectForPlanning === true &&
    packet.booleans?.externalAgentCanExecuteControlledWorkerRouteToolsNow ===
      true &&
    packet.booleans?.agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow ===
      true &&
    packet.booleans?.agentCanExecuteAll21ToolsNow === false &&
    packet.booleans?.agentCanExecuteGpuModelToolsNow === false &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.routeExecutionApprovedNow === true &&
    packet.booleans?.routeExecutionPerformed === true &&
    packet.booleans?.mockWorkerClaimPerformed === true &&
    packet.booleans?.backendQueueSubmissionPerformed === false &&
    packet.booleans?.liveQueueWritePerformed === false &&
    packet.booleans?.workerExecutionApprovedNow === false &&
    packet.booleans?.workerExecutionPerformed === false &&
    packet.booleans?.workerEnqueuePerformed === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.workerDispatchPerformed === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.toolExecutionPerformed === false &&
    packet.booleans?.providerRuntimePerformed === false &&
    packet.booleans?.controlledLocalBrowserRuntimePerformed === true &&
    packet.booleans?.browserRuntimeStartedByCanonicalRoute === true &&
    packet.booleans?.browserWebglCanvasRuntimePerformed === false &&
    packet.booleans?.gpuRuntimePerformed === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.modelWeightsDownloaded === false &&
    packet.booleans?.modelWeightsLoaded === false &&
    packet.booleans?.modelInferencePerformed === false &&
    packet.booleans?.mediaProcessingPerformed === false &&
    packet.booleans?.supabaseMutationPerformed === false &&
    packet.booleans?.gcsUploadPerformed === false &&
    packet.booleans?.publicArtifactCreated === false &&
    packet.booleans?.signedUrlCreated === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.internalBetaReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    packet.booleans?.dependencyInstallPerformed === false &&
    packet.booleans?.packageLockMutationPerformed === false
}

function sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokeAccepted(
  packet?: Partial<AiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokePacket>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_SMOKE_DECISION &&
    packet.status ===
      'canonical_tool_call_route_gpu_model_runtime_admission_fail_closed_for_eight_tools' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.controlledCanonicalRouteExecutedTools === 13 &&
    packet.counts?.gpuModelRuntimeAdmissionEvaluatedTools === 8 &&
    packet.counts?.gpuModelRuntimeAdmissionBlockedTools === 8 &&
    packet.counts?.modelWeightManifestRequiredTools === 5 &&
    packet.counts?.nativeGpuRuntimeProofRequiredTools === 8 &&
    packet.counts?.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.counts?.workerDispatchPerformedTools === 0 &&
    packet.counts?.toolExecutionPerformedTools === 0 &&
    packet.counts?.modelWeightsLoadedTools === 0 &&
    packet.counts?.publicArtifactCreatedTools === 0 &&
    packet.counts?.signedUrlCreatedTools === 0 &&
    packet.booleans?.canonicalToolCallRouteGpuModelRuntimeAdmissionSmokePassed ===
      true &&
    packet.booleans?.canonicalToolCallRouteGpuModelRuntimeAdmissionEvaluated ===
      true &&
    packet.booleans?.eightGpuModelToolsEvaluatedByCanonicalRouteNow === true &&
    packet.booleans?.eightGpuModelToolsRemainFailClosed === true &&
    packet.booleans?.allGpuModelToolsReportNativeGpuProofMissing === true &&
    packet.booleans?.allModelWeightToolsReportManifestMissing === true &&
    packet.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet.booleans?.noIdleGpuRuntimeApproved === true &&
    packet.booleans?.gpuStartsOnlyForApprovedWorkerOrToolCall === true &&
    packet.booleans?.agentCanSelectForPlanning === true &&
    packet.booleans?.agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow ===
      true &&
    packet.booleans?.agentCanExecuteAll21ToolsNow === false &&
    packet.booleans?.agentCanExecuteGpuModelToolsNow === false &&
    packet.booleans?.routeExecutionPerformed === true &&
    packet.booleans?.workerExecutionApprovedNow === false &&
    packet.booleans?.workerDispatchPerformed === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.toolExecutionPerformed === false &&
    packet.booleans?.providerRuntimePerformed === false &&
    packet.booleans?.browserWebglCanvasRuntimePerformed === false &&
    packet.booleans?.gpuRuntimePerformed === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.modelWeightsDownloaded === false &&
    packet.booleans?.modelWeightsLoaded === false &&
    packet.booleans?.modelInferencePerformed === false &&
    packet.booleans?.mediaProcessingPerformed === false &&
    packet.booleans?.supabaseMutationPerformed === false &&
    packet.booleans?.gcsUploadPerformed === false &&
    packet.booleans?.publicArtifactCreated === false &&
    packet.booleans?.signedUrlCreated === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    packet.booleans?.dependencyInstallPerformed === false &&
    packet.booleans?.packageLockMutationPerformed === false
}

function sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmokeAccepted(
  packet?: Partial<AiGraphicsExternalBetaToolCallRouteMockQueueWorkerClaimSmokePacket>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_WORKER_CLAIM_SMOKE_DECISION &&
    packet.status === 'route_mock_queue_worker_claim_smoke_passed_for_all_21_tools' &&
    packet.counts?.all21ToolsInLane === 21 &&
    packet.counts?.totalProductFacingCapabilities === 12 &&
    packet.counts?.routeAdmissionAcceptedTools === 21 &&
    packet.counts?.mockQueueInsertedJobs === 21 &&
    packet.counts?.mockWorkerClaimAttemptedTools === 21 &&
    packet.counts?.mockWorkerClaimsCreated === 21 &&
    packet.counts?.mockWorkerLeaseSeconds === 900 &&
    packet.counts?.gpuRuntimeTargetedTools === 8 &&
    packet.counts?.agentCanExecuteToolsNowTools === 0 &&
    packet.counts?.liveQueueWritePerformedTools === 0 &&
    packet.counts?.workerDispatchPerformedTools === 0 &&
    packet.counts?.toolExecutionPerformedTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.counts?.publicArtifactCreatedTools === 0 &&
    packet.counts?.signedUrlCreatedTools === 0 &&
    packet.booleans?.externalBetaToolCallRouteMockQueueWorkerClaimSmokePassed ===
      true &&
    packet.booleans?.sourceRouteMockQueueAdmissionAccepted === true &&
    packet.booleans?.all21RouteAdmittedMockJobsClaimed === true &&
    packet.booleans?.mockOnlyRuntimeModeEnforced === true &&
    packet.booleans?.privateWorkerClaimLeaseOnly === true &&
    packet.booleans?.agentCanSelectForPlanning === true &&
    packet.booleans?.agentCanSubmitToolCallToQueueAdmissionNow === true &&
    packet.booleans?.agentCanClaimMockWorkerLeaseNow === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.backendQueueSubmissionPerformed === false &&
    packet.booleans?.liveQueueWritePerformed === false &&
    packet.booleans?.liveWorkerClaimPerformed === false &&
    packet.booleans?.workerExecutionPerformed === false &&
    packet.booleans?.workerEnqueuePerformed === false &&
    packet.booleans?.workerDispatchPerformed === false &&
    packet.booleans?.toolExecutionPerformed === false &&
    packet.booleans?.providerRuntimePerformed === false &&
    packet.booleans?.browserWebglCanvasRuntimePerformed === false &&
    packet.booleans?.gpuRuntimePerformed === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.modelWeightsDownloaded === false &&
    packet.booleans?.modelWeightsLoaded === false &&
    packet.booleans?.mediaProcessingPerformed === false &&
    packet.booleans?.supabaseMutationPerformed === false &&
    packet.booleans?.gcsUploadPerformed === false &&
    packet.booleans?.publicArtifactCreated === false &&
    packet.booleans?.signedUrlCreated === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.internalBetaReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    packet.booleans?.dependencyInstallPerformed === false &&
    packet.booleans?.packageLockMutationPerformed === false
}

const gpuModelTools = new Set<AiGraphicsCanonicalToolId>([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

const gpuModelWeightManifestTools = new Set<AiGraphicsCanonicalToolId>([
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
])

function sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokeAccepted(
  packet?: Partial<AiGraphicsExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokePacket>,
): boolean {
  const routeQueuedJobs = packet?.routeQueuedJobs ?? []
  const workerClaims = packet?.workerClaims ?? []
  const routeJobTools = new Set(routeQueuedJobs.map((job) => job.toolId))
  const workerClaimTools = new Set(workerClaims.map((claim) => claim.toolId))

  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_PROOF_REF_QUEUE_ADMISSION_SMOKE_DECISION &&
    packet.status ===
      'gpu_model_proof_ref_route_mock_queue_admission_and_claim_passed_for_eight_tools' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.gpuModelToolsCovered === 8 &&
    packet.counts?.gpuModelProofRefMockQueueAdmissionAcceptedTools === 8 &&
    packet.counts?.gpuModelRuntimeAdmissionReadyWithProvidedEvidenceTools === 8 &&
    packet.counts?.nativeGpuRuntimeProofRefAcceptedTools === 8 &&
    packet.counts?.modelWeightManifestRefAcceptedTools === 5 &&
    packet.counts?.modelWeightManifestRequiredTools === 5 &&
    packet.counts?.mockQueueInsertedJobs === 8 &&
    packet.counts?.mockWorkerClaimsCreated === 8 &&
    packet.counts?.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools === 8 &&
    packet.counts?.liveQueueWritePerformedTools === 0 &&
    packet.counts?.workerDispatchPerformedTools === 0 &&
    packet.counts?.toolExecutionPerformedTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.counts?.modelWeightsLoadedTools === 0 &&
    packet.counts?.publicArtifactCreatedTools === 0 &&
    packet.counts?.signedUrlCreatedTools === 0 &&
    packet.counts?.externalBetaReadyNowTools === 0 &&
    packet.counts?.productionReadyNowTools === 0 &&
    packet.booleans?.externalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokePassed ===
      true &&
    packet.booleans?.all8GpuModelToolsCovered === true &&
    packet.booleans?.all8GpuModelProofRefMockQueueAdmissionsAccepted === true &&
    packet.booleans?.all8GpuModelMockJobsClaimed === true &&
    packet.booleans?.mockOnlyRuntimeModeEnforced === true &&
    packet.booleans?.privateWorkerClaimLeaseOnly === true &&
    packet.booleans?.routeQueueAdmissionRequiresProofRefs === true &&
    packet.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet.booleans?.noIdleGpuRuntimeApproved === true &&
    packet.booleans?.gpuStartsOnlyForApprovedWorkerOrToolCall === true &&
    packet.booleans?.agentCanSelectForPlanning === true &&
    packet.booleans?.agentCanSubmitGpuModelToolCallToQueueAdmissionNow === true &&
    packet.booleans?.agentCanClaimMockGpuModelWorkerLeaseNow === true &&
    packet.booleans?.agentCanExecuteGpuModelToolsNow === false &&
    packet.booleans?.agentCanExecuteAll21ToolsNow === false &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.routeExecutionPerformed === true &&
    packet.booleans?.mockWorkerClaimPerformed === true &&
    packet.booleans?.backendQueueSubmissionPerformed === false &&
    packet.booleans?.liveQueueWritePerformed === false &&
    packet.booleans?.liveWorkerClaimPerformed === false &&
    packet.booleans?.workerExecutionPerformed === false &&
    packet.booleans?.workerEnqueuePerformed === false &&
    packet.booleans?.workerDispatchPerformed === false &&
    packet.booleans?.toolExecutionPerformed === false &&
    packet.booleans?.providerRuntimePerformed === false &&
    packet.booleans?.browserWebglCanvasRuntimePerformed === false &&
    packet.booleans?.gpuRuntimePerformed === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.modelWeightsDownloaded === false &&
    packet.booleans?.modelWeightsLoaded === false &&
    packet.booleans?.modelInferencePerformed === false &&
    packet.booleans?.mediaProcessingPerformed === false &&
    packet.booleans?.supabaseMutationPerformed === false &&
    packet.booleans?.gcsUploadPerformed === false &&
    packet.booleans?.publicArtifactCreated === false &&
    packet.booleans?.signedUrlCreated === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.internalBetaReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    packet.booleans?.dependencyInstallPerformed === false &&
    packet.booleans?.packageLockMutationPerformed === false &&
    Array.isArray(packet.gpuModelTools) &&
    packet.gpuModelTools.length === 8 &&
    packet.gpuModelTools.every((toolId) => gpuModelTools.has(toolId)) &&
    routeQueuedJobs.length === 8 &&
    workerClaims.length === 8 &&
    [...gpuModelTools].every((toolId) => {
      const job = routeQueuedJobs.find((candidate) => candidate.toolId === toolId)
      const claim = workerClaims.find((candidate) => candidate.toolId === toolId)
      const manifestRequired = gpuModelWeightManifestTools.has(toolId)
      return routeJobTools.has(toolId) &&
        workerClaimTools.has(toolId) &&
        job?.runtimeJobAdmissionReadyWithProvidedEvidence === true &&
        job.nativeGpuRuntimeProofRefAccepted === true &&
        job.modelWeightManifestRequired === manifestRequired &&
        job.modelWeightManifestRefAccepted === manifestRequired &&
        job.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true &&
        job.gpuRuntimeShouldStartNow === false &&
        job.toolExecutionPerformed === false &&
        job.publicArtifactCreated === false &&
        job.signedUrlCreated === false &&
        claim?.mockWorkerClaimCreated === true &&
        claim.privateWorkerClaimLeaseOnly === true &&
        claim.gpuRuntimeShouldStartNow === false &&
        claim.toolExecutionPerformed === false &&
        claim.publicArtifactCreated === false &&
        claim.signedUrlCreated === false
    })
}

function sourceExternalAgentToolAdapterAuthorizationAccepted(
  packet?: Partial<AiGraphicsExternalAgentToolAdapterAuthorizationReport>,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_AGENT_TOOL_ADAPTER_AUTHORIZATION_DECISION &&
    packet.status ===
      'external_agent_tool_adapter_authorization_prepared_all_21_execution_blocked' &&
    packet.counts?.sourceControlledDispatcherDryRunCompletedTools === 21 &&
    packet.counts?.sourceAiGraphicsHandoffRouteTools === 21 &&
    packet.counts?.adapterAuthorizationRows === 21 &&
    packet.counts?.adapterContractsAuthorizedWithRuntimeBlocks === 21 &&
    packet.counts?.cpuStaticToolAdapterContracts === 6 &&
    packet.counts?.browserRuntimeToolAdapterContracts === 7 &&
    packet.counts?.gpuModelToolAdapterContracts === 8 &&
    packet.counts?.mappedProductionProfilesAccepted === 21 &&
    packet.counts?.externalAgentCanInvokeAdapterNowTools === 0 &&
    packet.counts?.externalAgentExecutableNowTools === 0 &&
    packet.counts?.toolExecutionApprovedNowTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.booleans?.externalAgentToolAdapterAuthorizationPrepared === true &&
    packet.booleans?.sourceControlledDispatcherDryRunAccepted === true &&
    packet.booleans?.sourceAiGraphicsHandoffRoutesAccepted === true &&
    packet.booleans?.all21ToolsCovered === true &&
    packet.booleans?.all12CapabilitiesCovered === true &&
    packet.booleans?.all21AdapterContractsAuthorizedWithRuntimeBlocks === true &&
    packet.booleans?.all21MappedProductionProfilesAccepted === true &&
    packet.booleans?.all8GpuToolsTargetOnDemandGpuRuntime === true &&
    packet.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet.booleans?.noIdleGpuRuntimeApproved === true &&
    packet.booleans?.gpuStartsOnlyForApprovedWorkerOrToolCall === true &&
    packet.booleans?.adapterAuthorizationIsContractOnly === true &&
    packet.booleans?.agentCanSelectForPlanning === true &&
    packet.booleans?.externalAgentCanInvokeAdapterNow === false &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.routeExecutionApprovedNow === false &&
    packet.booleans?.workerExecutionApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.providerRuntimeApprovedNow === false &&
    packet.booleans?.browserWebglCanvasRuntimeApprovedNow === false &&
    packet.booleans?.gpuRuntimeApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    packet.booleans?.dependencyInstallPerformed === false &&
    packet.booleans?.packageLockMutationPerformed === false &&
    packet.booleans?.backendQueueSubmissionPerformed === false &&
    packet.booleans?.liveQueueWritePerformed === false &&
    packet.booleans?.workerEnqueuePerformed === false &&
    packet.booleans?.workerDispatchPerformed === false &&
    packet.booleans?.toolExecutionPerformed === false &&
    packet.booleans?.routeExecutionPerformed === false &&
    packet.booleans?.providerRuntimePerformed === false &&
    packet.booleans?.browserWebglCanvasRuntimePerformed === false &&
    packet.booleans?.gpuRuntimePerformed === false &&
    packet.booleans?.modelWeightsDownloaded === false &&
    packet.booleans?.modelWeightsLoaded === false &&
    packet.booleans?.mediaProcessingPerformed === false &&
    packet.booleans?.supabaseMutationPerformed === false &&
    packet.booleans?.gcsUploadPerformed === false &&
    packet.booleans?.publicArtifactCreated === false &&
    packet.booleans?.signedUrlCreated === false
}

function sourceSatoriFontRuntimeProofAccepted(
  packet?: Partial<AiGraphicsSatoriFontRuntimeProofReport>,
): boolean {
  const outputContract = packet?.tool?.outputContract
  const fontFixture = packet?.tool?.fontFixture
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_SATORI_FONT_RUNTIME_PROOF_DECISION &&
    packet.status === 'completed_with_warnings' &&
    packet.proofScope === 'satori_cpu_static_text_svg_layout_with_locked_package_font_fixture' &&
    packet.tool?.toolId === 'satori' &&
    packet.tool.packageName === 'satori' &&
    packet.tool.status === 'satori_font_fixture_svg_layout_proof_passed' &&
    packet.tool.runtimeTarget === 'node_cpu_static_svg_layout' &&
    fontFixture?.packageName === 'three' &&
    typeof fontFixture.path === 'string' &&
    fontFixture.path === 'node_modules/three/examples/fonts/ttf/kenpixel.ttf' &&
    /^[a-f0-9]{64}$/.test(fontFixture.sha256 ?? '') &&
    typeof fontFixture.byteLength === 'number' &&
    fontFixture.byteLength > 0 &&
    outputContract?.hasSvgRoot === true &&
    outputContract?.hasExpectedViewBox === true &&
    typeof outputContract.pathCount === 'number' &&
    outputContract.pathCount > 0 &&
    outputContract.deterministic === true &&
    outputContract.svgArtifactCommitted === false &&
    outputContract.publicArtifactCreated === false &&
    packet.tool.agentExecutableNow === false &&
    packet.tool.routeExecutionUsed === false &&
    packet.tool.workerExecutionUsed === false &&
    packet.tool.providerRuntimeUsed === false &&
    packet.tool.publicArtifactCreated === false &&
    packet.booleans?.satoriFontRuntimeProofCompleted === true &&
    packet.booleans?.lockedPackageFontFixtureUsed === true &&
    packet.booleans?.satoriTextSvgLayoutProofPassed === true &&
    packet.booleans?.dependencyInstallPerformed === false &&
    packet.booleans?.packageLockMutationPerformed === false &&
    packet.booleans?.generatedArtifactsCommitted === false &&
    packet.booleans?.publicArtifactCreated === false &&
    packet.booleans?.signedUrlCreated === false &&
    packet.booleans?.providerRuntimePerformed === false &&
    packet.booleans?.browserWebglCanvasRuntimePerformed === false &&
    packet.booleans?.gpuRuntimePerformed === false &&
    packet.booleans?.agentCanSelectForPlanning === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.toolRouteExecutionReadyNow === false &&
    packet.booleans?.workerExecutionReadyNow === false &&
    packet.booleans?.browserWebglCanvasRuntimeReadyNow === false &&
    packet.booleans?.gpuModelRuntimeReadyNow === false &&
    packet.booleans?.runtimeBetaReadyNow === false &&
    packet.booleans?.internalBetaReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false
}

function sourceCpuStaticLiveAdapterQueueWriteProofAccepted(
  packet?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofReport>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION &&
    packet.status ===
      'external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_passed_five_mock_queue_validated_execution_blocked' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.localAdapterInvocationProofPassedTools === 5 &&
    packet.counts?.queueServiceAdapterValidationPassedTools === 5 &&
    packet.counts?.mockQueueWriteValidationPassedTools === 5 &&
    packet.counts?.externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidenceTools === 5 &&
    packet.counts?.satoriBlockedPendingApprovedFontFixtureTools === 1 &&
    packet.counts?.nonCpuStaticDeferredTools === 15 &&
    packet.counts?.externalAgentCanInvokeAdapterNowTools === 0 &&
    packet.counts?.externalAgentCanSubmitPrivateWorkerQueueNowTools === 0 &&
    packet.counts?.backendQueueSubmissionApprovedNowTools === 0 &&
    packet.counts?.liveQueueWriteApprovedNowTools === 0 &&
    packet.counts?.workerEnqueueApprovedNowTools === 0 &&
    packet.counts?.workerDispatchApprovedNowTools === 0 &&
    packet.counts?.workerExecutionApprovedNowTools === 0 &&
    packet.counts?.toolExecutionApprovedNowTools === 0 &&
    packet.counts?.externalAgentExecutableNowTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.booleans?.allFiveLocalAdapterInvocationProofsPassed === true &&
    packet.booleans?.allFiveQueueServiceAdapterValidationsPassed === true &&
    packet.booleans?.allFiveMockQueueWriteValidationsPassed === true &&
    packet.booleans?.queueServiceMockOnlyRuntimeAccepted === true &&
    packet.booleans?.satoriBlockedPendingApprovedFontFixture === true &&
    packet.booleans?.fifteenRuntimeDeferredToolsPreserved === true &&
    packet.booleans?.runtimeQueueServiceValidationAccepted === true &&
    packet.booleans?.nextGateRequiresNonProductionServiceRoleQueueWriteSmoke === true &&
    packet.booleans?.noSupabaseQueueWriteByProof === true &&
    packet.booleans?.noLiveQueueWriteByProof === true &&
    packet.booleans?.noWorkerEnqueueByProof === true &&
    packet.booleans?.noWorkerDispatchByProof === true &&
    packet.booleans?.noToolExecutionByProof === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.externalAgentCanInvokeAdapterNow === false &&
    packet.booleans?.externalAgentCanSubmitPrivateWorkerQueueNow === false &&
    packet.booleans?.backendQueueSubmissionApprovedNow === false &&
    packet.booleans?.liveQueueWriteApprovedNow === false &&
    packet.booleans?.workerEnqueueApprovedNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.workerExecutionApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    Array.isArray(packet.rows) &&
    packet.rows.length === 21
}

function sourceCpuStaticExactExecutionAdmissionAccepted(
  packet?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION &&
    packet.status ===
      'external_agent_cpu_static_private_worker_exact_execution_admission_prepared_five_with_runtime_blocks' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.exactExecutionAdmissionReadyTools === 5 &&
    packet.counts?.exactRequestEnvelopeAcceptedTools === 5 &&
    packet.counts?.approvedPlanSnapshotAcceptedTools === 5 &&
    packet.counts?.creditReservationAcceptedTools === 5 &&
    packet.counts?.privateArtifactManifestAcceptedTools === 5 &&
    packet.counts?.workerAcceptedRequestSchemaAcceptedTools === 5 &&
    packet.counts?.toolSpecificQaGateAcceptedTools === 5 &&
    packet.counts?.satoriBlockedPendingApprovedFontFixtureTools === 1 &&
    packet.counts?.nonCpuStaticDeferredTools === 15 &&
    packet.counts?.externalAgentExactRequestAdmittedWithProvidedEvidenceTools === 5 &&
    packet.counts?.externalAgentCanDispatchPrivateWorkerJobNowTools === 0 &&
    packet.counts?.externalAgentCanSubmitPrivateWorkerQueueNowTools === 0 &&
    packet.counts?.externalAgentCanRequestPrivateWorkerHandoffNowTools === 0 &&
    packet.counts?.externalAgentCanInvokeAdapterNowTools === 0 &&
    packet.counts?.externalAgentExecutableNowTools === 0 &&
    packet.counts?.backendQueueSubmissionApprovedNowTools === 0 &&
    packet.counts?.liveQueueWriteApprovedNowTools === 0 &&
    packet.counts?.workerClaimApprovedNowTools === 0 &&
    packet.counts?.workerDispatchApprovedNowTools === 0 &&
    packet.counts?.workerEnqueueApprovedNowTools === 0 &&
    packet.counts?.toolExecutionApprovedNowTools === 0 &&
    packet.counts?.publicArtifactAllowedTools === 0 &&
    packet.counts?.signedUrlAllowedTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.booleans?.allFiveExactExecutionAdmissionsReady === true &&
    packet.booleans?.allFiveExactRequestEnvelopesAccepted === true &&
    packet.booleans?.allFiveApprovedPlanSnapshotsAccepted === true &&
    packet.booleans?.allFiveCreditReservationsAccepted === true &&
    packet.booleans?.allFivePrivateArtifactManifestsAccepted === true &&
    packet.booleans?.allFiveWorkerAcceptedRequestSchemasAccepted === true &&
    packet.booleans?.allFiveToolSpecificQaGatesAccepted === true &&
    packet.booleans?.exactExecutionAdmissionRefsPreserved === true &&
    packet.booleans?.privateArtifactOnlyPolicyAccepted === true &&
    packet.booleans?.noLiveQueueWriteByAdmission === true &&
    packet.booleans?.noAdapterInvocationByAdmission === true &&
    packet.booleans?.noToolExecutionByAdmission === true &&
    packet.booleans?.nextGateRequiresAdapterInvocationAndWorkerEnqueueAdmission === true &&
    packet.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet.booleans?.noIdleGpuRuntimeApproved === true &&
    packet.booleans?.gpuStartsOnlyForApprovedWorkerOrToolCall === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.externalAgentCanDispatchPrivateWorkerJobNow === false &&
    packet.booleans?.externalAgentCanSubmitPrivateWorkerQueueNow === false &&
    packet.booleans?.externalAgentCanRequestPrivateWorkerHandoffNow === false &&
    packet.booleans?.externalAgentCanInvokeAdapterNow === false &&
    packet.booleans?.backendQueueSubmissionApprovedNow === false &&
    packet.booleans?.liveQueueWriteApprovedNow === false &&
    packet.booleans?.workerClaimApprovedNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.workerEnqueueApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    Array.isArray(packet.rows) &&
    packet.rows.length === 21 &&
    [...cpuStaticExactAdmissionTools].every((toolId) => {
      const row = packet.rows?.find((candidate) => candidate.toolId === toolId)
      return row?.exactExecutionAdmissionStatus ===
        'exact_external_agent_execution_admission_ready_for_private_worker_request_execution_still_blocked' &&
        row.exactExecutionAdmissionReady === true &&
        row.externalAgentExactRequestAdmittedWithProvidedEvidence === true &&
        row.exactRequestEnvelopeAccepted === true &&
        row.approvedPlanSnapshotAccepted === true &&
        row.creditReservationAccepted === true &&
        row.privateArtifactManifestAccepted === true &&
        row.workerAcceptedRequestSchemaAccepted === true &&
        row.toolSpecificQaGateAccepted === true &&
        row.externalAgentCanInvokeAdapterNow === false &&
        row.externalAgentCanSubmitPrivateWorkerQueueNow === false &&
        row.externalAgentCanDispatchPrivateWorkerJobNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function sourceCpuStaticAdapterInvocationEnqueueAdmissionAccepted(
  packet?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionReport>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_ENQUEUE_ADMISSION_DECISION &&
    packet.status ===
      'external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission_prepared_five_with_runtime_blocks' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.adapterInvocationEnqueueAdmissionReadyTools === 5 &&
    packet.counts?.sourceExactExecutionAdmissionAcceptedTools === 5 &&
    packet.counts?.exactRequestEnvelopeAcceptedTools === 5 &&
    packet.counts?.adapterInvocationEnvelopePreparedTools === 5 &&
    packet.counts?.adapterInvocationContractAcceptedTools === 5 &&
    packet.counts?.workerEnqueuePayloadPreparedTools === 5 &&
    packet.counts?.workerEnqueueAdmissionContractAcceptedTools === 5 &&
    packet.counts?.productionWorkerJobPayloadAcceptedTools === 5 &&
    packet.counts?.backendQueueAdapterRefAcceptedTools === 5 &&
    packet.counts?.serviceRoleBoundaryAcceptedTools === 5 &&
    packet.counts?.workerPayloadSchemaAcceptedTools === 5 &&
    packet.counts?.privateStoragePolicyAcceptedTools === 5 &&
    packet.counts?.retryPolicyAcceptedTools === 5 &&
    packet.counts?.deadLetterPolicyAcceptedTools === 5 &&
    packet.counts?.checkbackPolicyAcceptedTools === 5 &&
    packet.counts?.fallbackPolicyAcceptedTools === 5 &&
    packet.counts?.idempotencyAcceptedTools === 5 &&
    packet.counts?.satoriBlockedPendingApprovedFontFixtureTools === 1 &&
    packet.counts?.nonCpuStaticDeferredTools === 15 &&
    packet.counts?.externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidenceTools === 5 &&
    packet.counts?.externalAgentCanInvokeAdapterNowTools === 0 &&
    packet.counts?.externalAgentCanSubmitPrivateWorkerQueueNowTools === 0 &&
    packet.counts?.backendQueueSubmissionApprovedNowTools === 0 &&
    packet.counts?.liveQueueWriteApprovedNowTools === 0 &&
    packet.counts?.workerEnqueueApprovedNowTools === 0 &&
    packet.counts?.workerClaimApprovedNowTools === 0 &&
    packet.counts?.workerDispatchApprovedNowTools === 0 &&
    packet.counts?.workerExecutionApprovedNowTools === 0 &&
    packet.counts?.toolExecutionApprovedNowTools === 0 &&
    packet.counts?.externalAgentExecutableNowTools === 0 &&
    packet.counts?.publicArtifactAllowedTools === 0 &&
    packet.counts?.signedUrlAllowedTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.booleans?.sourceExactExecutionAdmissionAccepted === true &&
    packet.booleans?.allFiveAdapterInvocationEnqueueAdmissionsReady === true &&
    packet.booleans?.allFiveSourceExactAdmissionsAccepted === true &&
    packet.booleans?.allFiveAdapterInvocationEnvelopesPrepared === true &&
    packet.booleans?.allFiveWorkerEnqueuePayloadsPrepared === true &&
    packet.booleans?.allFiveProductionWorkerJobPayloadsAccepted === true &&
    packet.booleans?.allFiveBackendQueueAdapterRefsAccepted === true &&
    packet.booleans?.allFiveServiceRoleBoundariesAccepted === true &&
    packet.booleans?.allFiveWorkerPayloadSchemasAccepted === true &&
    packet.booleans?.allFivePrivateStoragePoliciesAccepted === true &&
    packet.booleans?.allFiveRetryPoliciesAccepted === true &&
    packet.booleans?.allFiveDeadLetterPoliciesAccepted === true &&
    packet.booleans?.allFiveCheckbackPoliciesAccepted === true &&
    packet.booleans?.allFiveFallbackPoliciesAccepted === true &&
    packet.booleans?.allFiveIdempotencyContractsAccepted === true &&
    packet.booleans?.satoriBlockedPendingApprovedFontFixture === true &&
    packet.booleans?.fifteenRuntimeDeferredToolsPreserved === true &&
    packet.booleans?.privateArtifactOnlyPolicyAccepted === true &&
    packet.booleans?.adapterInvocationEnqueueRefsPreserved === true &&
    packet.booleans?.noAdapterInvocationByAdmission === true &&
    packet.booleans?.noBackendQueueSubmissionByAdmission === true &&
    packet.booleans?.noLiveQueueWriteByAdmission === true &&
    packet.booleans?.noWorkerEnqueueByAdmission === true &&
    packet.booleans?.noWorkerDispatchByAdmission === true &&
    packet.booleans?.noToolExecutionByAdmission === true &&
    packet.booleans?.nextGateRequiresLiveAdapterInvocationAndQueueWriteProof === true &&
    packet.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet.booleans?.noIdleGpuRuntimeApproved === true &&
    packet.booleans?.gpuStartsOnlyForApprovedWorkerOrToolCall === true &&
    packet.booleans?.externalAgentCanInvokeAdapterNow === false &&
    packet.booleans?.externalAgentCanSubmitPrivateWorkerQueueNow === false &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.backendQueueSubmissionApprovedNow === false &&
    packet.booleans?.liveQueueWriteApprovedNow === false &&
    packet.booleans?.workerEnqueueApprovedNow === false &&
    packet.booleans?.workerClaimApprovedNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.workerExecutionApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    Array.isArray(packet.rows) &&
    packet.rows.length === 21 &&
    [...cpuStaticExactAdmissionTools].every((toolId) => {
      const row = packet.rows?.find((candidate) => candidate.toolId === toolId)
      return row?.adapterInvocationEnqueueAdmissionStatus ===
        'adapter_invocation_enqueue_admission_ready_execution_still_blocked' &&
        row.adapterInvocationEnqueueAdmissionReady === true &&
        row.externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence === true &&
        row.exactRequestEnvelopeAccepted === true &&
        row.adapterInvocationEnvelopePrepared === true &&
        row.workerEnqueuePayloadPrepared === true &&
        row.productionWorkerJobPayloadAccepted === true &&
        row.backendQueueAdapterRefAccepted === true &&
        row.serviceRoleBoundaryAccepted === true &&
        row.workerPayloadSchemaAccepted === true &&
        row.privateStoragePolicyAccepted === true &&
        row.idempotencyAccepted === true &&
        row.externalAgentCanInvokeAdapterNow === false &&
        row.externalAgentCanSubmitPrivateWorkerQueueNow === false &&
        row.liveQueueWriteApprovedNow === false &&
        row.workerEnqueueApprovedNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false &&
        row.adapterInvocationEnqueueEvidence != null
    })
}

function sourceCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted(
  packet?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION &&
    packet.status ===
      'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_prepared_five_execution_blocked' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.sourceLiveAdapterQueueWriteProofAcceptedTools === 5 &&
    packet.counts?.nonProductionServiceRoleQueueWriteSmokePreflightReadyTools === 5 &&
    packet.counts?.nonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidenceTools === 5 &&
    packet.counts?.satoriBlockedPendingApprovedFontFixtureTools === 1 &&
    packet.counts?.nonCpuStaticDeferredTools === 15 &&
    packet.counts?.serviceRoleQueueWriteSmokeApprovedNowTools === 0 &&
    packet.counts?.liveQueueWriteApprovedNowTools === 0 &&
    packet.counts?.liveQueueWritePerformedNowTools === 0 &&
    packet.counts?.workerClaimApprovedNowTools === 0 &&
    packet.counts?.workerClaimPerformedNowTools === 0 &&
    packet.counts?.workerDispatchApprovedNowTools === 0 &&
    packet.counts?.workerDispatchPerformedNowTools === 0 &&
    packet.counts?.toolExecutionApprovedNowTools === 0 &&
    packet.counts?.toolExecutionPerformedNowTools === 0 &&
    packet.counts?.externalAgentExecutableNowTools === 0 &&
    packet.counts?.publicArtifactAllowedTools === 0 &&
    packet.counts?.signedUrlAllowedTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.booleans?.sourceLiveAdapterQueueWriteProofAccepted === true &&
    packet.booleans?.allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReady === true &&
    packet.booleans?.allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReadyWithProvidedEvidence === true &&
    packet.booleans?.satoriBlockedPendingApprovedFontFixture === true &&
    packet.booleans?.fifteenRuntimeDeferredToolsPreserved === true &&
    packet.booleans?.serverOnlyServiceRoleCredentialsRequired === true &&
    packet.booleans?.nonProductionEnvironmentRequired === true &&
    packet.booleans?.explicitOperatorConfirmationRequired === true &&
    packet.booleans?.savedSmokeResultRequiredBeforeExecutionGateCanAdvance === true &&
    packet.booleans?.cleanupRequired === true &&
    packet.booleans?.rollbackRequired === true &&
    packet.booleans?.telemetryRequired === true &&
    packet.booleans?.privateArtifactOnlyPolicyAccepted === true &&
    packet.booleans?.noSupabaseQueueWriteByPreflight === true &&
    packet.booleans?.noLiveQueueWriteByPreflight === true &&
    packet.booleans?.noWorkerClaimByPreflight === true &&
    packet.booleans?.noWorkerDispatchByPreflight === true &&
    packet.booleans?.noToolExecutionByPreflight === true &&
    packet.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet.booleans?.noIdleGpuRuntimeApproved === true &&
    packet.booleans?.gpuStartsOnlyForApprovedWorkerOrToolCall === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.serviceRoleQueueWriteSmokeApprovedNow === false &&
    packet.booleans?.liveQueueWriteApprovedNow === false &&
    packet.booleans?.workerClaimApprovedNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    Array.isArray(packet.rows) &&
    packet.rows.length === 21 &&
    [...cpuStaticExactAdmissionTools].every((toolId) => {
      const row = packet.rows?.find((candidate) => candidate.toolId === toolId)
      return row?.nonProductionServiceRoleQueueWriteSmokePreflightStatus ===
        'non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked' &&
        row.nonProductionServiceRoleQueueWriteSmokePreflightReady === true &&
        row.preflightContract != null &&
        row.preflightEvidence != null &&
        row.serviceRoleQueueWriteSmokeApprovedNow === false &&
        row.liveQueueWriteApprovedNow === false &&
        row.workerClaimApprovedNow === false &&
        row.workerDispatchApprovedNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function sourceCpuStaticNonProductionEvidenceSequencePrepared(
  packet?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionEvidenceSequencePacket>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_EVIDENCE_SEQUENCE_DECISION &&
    packet.status ===
      'external_agent_cpu_static_private_worker_non_production_evidence_sequence_prepared_not_executed' &&
    packet.toolsCovered === 5 &&
    exactCpuStaticToolSet(packet.toolsCoveredIds) &&
    packet.liveEvidenceSequenceExecutedNow === false &&
    packet.liveSupabaseQueueWritesNow === 0 &&
    packet.liveWorkerClaimsNow === 0 &&
    packet.liveWorkerDispatchHandoffsNow === 0 &&
    packet.toolExecutionsPerformedNow === 0 &&
    packet.agentCanExecuteToolsNow === false &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.runtimeReadyNow === false &&
    packet.externalBetaReadyNow === false &&
    packet.productionReadyNow === false &&
    packet.booleans?.externalAgentCpuStaticPrivateWorkerNonProductionEvidenceSequencePrepared ===
      true &&
    packet.booleans?.exactFiveCpuStaticToolsOnly === true &&
    packet.booleans?.serverOnlyServiceRoleCredentialsRequired === true &&
    packet.booleans?.nonProductionEnvironmentRequired === true &&
    packet.booleans?.explicitOperatorConfirmationRequired === true &&
    packet.booleans?.queueWriteSmokeRunsFirst === true &&
    packet.booleans?.queueWriteProofMustValidateBeforeClaimDispatch === true &&
    packet.booleans?.claimDispatchSmokeRunsSecond === true &&
    packet.booleans?.claimDispatchProofMustValidateBeforeExecutionGate === true &&
    packet.booleans?.localArtifactsOnly === true &&
    packet.booleans?.cleanupRequired === true &&
    packet.booleans?.noToolExecutionBySequence === true &&
    packet.booleans?.agentCanSelectForPlanning === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.liveQueueWriteApprovedNow === false &&
    packet.booleans?.workerClaimApprovedNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.workerExecutionApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    packet.booleans?.dependencyInstallPerformed === false &&
    packet.booleans?.packageLockMutationPerformed === false &&
    packet.booleans?.supabaseMutationPerformed === false &&
    packet.booleans?.publicArtifactCreated === false &&
    packet.booleans?.signedUrlCreated === false
}

function sourceCpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted(
  packet?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION &&
    packet.status ===
      'accepted_saved_non_production_service_role_queue_write_smoke_result_execution_blocked' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.sourcePreflightReadyTools === 5 &&
    packet.counts?.savedSmokeResultAcceptedToolsWithProvidedEvidence === 5 &&
    packet.counts?.savedSmokeResultRejectedTools === 0 &&
    packet.counts?.serviceRoleQueueWritesAcceptedWithProvidedEvidence === 5 &&
    packet.counts?.queueRowsPersistedAfterCleanup === 0 &&
    packet.counts?.workerClaimsCreatedNow === 0 &&
    packet.counts?.workerDispatchesPerformedNow === 0 &&
    packet.counts?.workerExecutionsPerformedNow === 0 &&
    packet.counts?.toolExecutionsPerformedNow === 0 &&
    packet.counts?.externalAgentExecutableNowTools === 0 &&
    packet.counts?.publicArtifactCreatedTools === 0 &&
    packet.counts?.signedUrlCreatedTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.booleans?.sourceNonProductionServiceRoleQueueWriteSmokePreflightAccepted === true &&
    packet.booleans?.savedNonProductionServiceRoleQueueWriteSmokeResultProvided === true &&
    packet.booleans?.serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence === true &&
    packet.booleans?.allFiveCpuStaticSavedSmokeResultsAcceptedWithProvidedEvidence === true &&
    packet.booleans?.cleanupVerifiedWithProvidedEvidence === true &&
    packet.booleans?.serverOnlyServiceRoleCredentialsRequired === true &&
    packet.booleans?.nonProductionEnvironmentRequired === true &&
    packet.booleans?.noSupabaseMutationByValidator === true &&
    packet.booleans?.noLiveQueueWriteByValidator === true &&
    packet.booleans?.noWorkerClaimByValidator === true &&
    packet.booleans?.noWorkerDispatchByValidator === true &&
    packet.booleans?.noToolExecutionByValidator === true &&
    packet.booleans?.noGpuRuntimeStartByValidator === true &&
    packet.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet.booleans?.noIdleGpuRuntimeApproved === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.externalAgentCanInvokeAdapterNow === false &&
    packet.booleans?.externalAgentCanSubmitPrivateWorkerQueueNow === false &&
    packet.booleans?.serviceRoleQueueWriteSmokeApprovedNow === false &&
    packet.booleans?.liveQueueWriteApprovedNow === false &&
    packet.booleans?.workerEnqueueApprovedNow === false &&
    packet.booleans?.workerClaimApprovedNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.workerExecutionApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    Array.isArray(packet.rows) &&
    packet.rows.length === 21 &&
    [...cpuStaticExactAdmissionTools].every((toolId) => {
      const row = packet.rows?.find((candidate) => candidate.toolId === toolId)
      return row?.serviceRoleQueueWriteSmokeProofStatus ===
        'accepted_saved_non_production_service_role_queue_write_smoke_result_execution_blocked' &&
        row.serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence === true &&
        row.queueRowsWrittenWithProvidedEvidence === 1 &&
        row.queueRowsPersistedAfterCleanup === 0 &&
        row.serviceRoleQueueWriteSmokeEvidenceRef != null &&
        row.serviceRoleQueueWriteSmokeTelemetryRef != null &&
        row.serviceRoleQueueWriteSmokeCleanupProofRef != null &&
        row.serviceRoleQueueWriteSmokeRollbackRef != null &&
        row.workerClaimApprovedNow === false &&
        row.workerDispatchApprovedNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function sourceCpuStaticWorkerClaimAndDispatchSmokeProofAccepted(
  packet?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofReport>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF_DECISION &&
    packet.status ===
      'accepted_saved_worker_claim_and_dispatch_smoke_result_execution_blocked' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.sourceQueueWriteSmokeProofAcceptedTools === 5 &&
    packet.counts?.savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence === 5 &&
    packet.counts?.savedWorkerClaimAndDispatchSmokeRejectedTools === 0 &&
    packet.counts?.queueRowsReadAcceptedWithProvidedEvidence === 5 &&
    packet.counts?.workerClaimsAcceptedWithProvidedEvidence === 5 &&
    packet.counts?.workerDispatchHandoffsAcceptedWithProvidedEvidence === 5 &&
    packet.counts?.workerDispatchLeasesReleasedWithProvidedEvidence === 5 &&
    packet.counts?.queueRowsPersistedAfterCleanup === 0 &&
    packet.counts?.workerExecutionsPerformedNow === 0 &&
    packet.counts?.toolExecutionsPerformedNow === 0 &&
    packet.counts?.externalAgentExecutableNowTools === 0 &&
    packet.counts?.publicArtifactCreatedTools === 0 &&
    packet.counts?.signedUrlCreatedTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.booleans?.sourceNonProductionServiceRoleQueueWriteSmokeProofAccepted === true &&
    packet.booleans?.workerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence === true &&
    packet.booleans?.allFiveCpuStaticWorkerClaimAndDispatchSmokeResultsAcceptedWithProvidedEvidence === true &&
    packet.booleans?.cleanupVerifiedWithProvidedEvidence === true &&
    packet.booleans?.workerDispatchLeasesReleasedWithProvidedEvidence === true &&
    packet.booleans?.serverOnlyServiceRoleCredentialsRequired === true &&
    packet.booleans?.nonProductionEnvironmentRequired === true &&
    packet.booleans?.noSupabaseMutationByValidator === true &&
    packet.booleans?.noLiveWorkerClaimByValidator === true &&
    packet.booleans?.noLiveWorkerDispatchByValidator === true &&
    packet.booleans?.noWorkerExecutionByValidator === true &&
    packet.booleans?.noToolExecutionByValidator === true &&
    packet.booleans?.noGpuRuntimeStartByValidator === true &&
    packet.booleans?.gpuRuntimeOnDemandOnly === true &&
    packet.booleans?.noIdleGpuRuntimeApproved === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.workerClaimApprovedNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.workerExecutionApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    packet.booleans?.runtimeReadyNow === false &&
    packet.booleans?.externalBetaReadyNow === false &&
    packet.booleans?.productionReadyNow === false &&
    Array.isArray(packet.rows) &&
    packet.rows.length === 21 &&
    [...cpuStaticExactAdmissionTools].every((toolId) => {
      const row = packet.rows?.find((candidate) => candidate.toolId === toolId)
      return row?.workerClaimAndDispatchSmokeProofStatus ===
        'accepted_saved_worker_claim_and_dispatch_smoke_result_execution_blocked' &&
        row.workerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence === true &&
        row.queueRowsReadWithProvidedEvidence === 1 &&
        row.workerClaimsAcceptedWithProvidedEvidence === 1 &&
        row.workerDispatchHandoffsAcceptedWithProvidedEvidence === 1 &&
        row.workerDispatchLeasesReleasedWithProvidedEvidence === 1 &&
        row.queueRowsPersistedAfterCleanup === 0 &&
        row.workerClaimEvidenceRef != null &&
        row.workerDispatchEvidenceRef != null &&
        row.workerDispatchTelemetryRef != null &&
        row.workerLeaseAuditRef != null &&
        row.workerDispatchCleanupProofRef != null &&
        row.workerDispatchRollbackRef != null &&
        row.workerExecutionApprovedNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function sourceCpuStaticToolExecutionDryRunProofAccepted(
  packet?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofReport>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF_DECISION &&
    packet.status ===
      'external_agent_cpu_static_private_worker_tool_execution_dry_run_proof_prepared_five_with_runtime_blocks' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.toolExecutionDryRunProofPreparedTools === 5 &&
    packet.counts?.dryToolExecutionContractsPreparedTools === 5 &&
    packet.counts?.adapterPayloadShapeValidatedTools === 5 &&
    packet.counts?.privateOutputManifestContractValidatedTools === 5 &&
    packet.counts?.toolResultSchemaValidatedTools === 5 &&
    packet.counts?.sourceWorkerClaimAndDispatchSmokeProofAcceptedTools === 5 &&
    packet.counts?.satoriBlockedPendingApprovedFontFixtureTools === 1 &&
    packet.counts?.nonCpuStaticDeferredTools === 15 &&
    packet.counts?.externalAgentExecutableNowTools === 0 &&
    packet.counts?.externalAgentCanInvokeAdapterNowTools === 0 &&
    packet.counts?.workerDispatchApprovedNowTools === 0 &&
    packet.counts?.toolExecutionApprovedNowTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.booleans?.sourceWorkerClaimAndDispatchSmokeProofAccepted === true &&
    packet.booleans?.allFiveCpuStaticToolExecutionDryRunProofsPrepared === true &&
    packet.booleans?.allFiveDryToolExecutionContractsPrepared === true &&
    packet.booleans?.allFiveAdapterPayloadShapesValidated === true &&
    packet.booleans?.allFivePrivateOutputManifestContractsValidated === true &&
    packet.booleans?.allFiveToolResultSchemasValidated === true &&
    packet.booleans?.sourceWorkerClaimAndDispatchEvidenceRefsPreserved === true &&
    packet.booleans?.privateArtifactOnlyPolicyAccepted === true &&
    packet.booleans?.noAdapterInvocationByDryRun === true &&
    packet.booleans?.noToolExecutionByDryRun === true &&
    packet.booleans?.nextGateRequiresControlledPrivateToolExecutionProof === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.externalAgentCanInvokeAdapterNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    Array.isArray(packet.rows) &&
    packet.rows.length === 21 &&
    [...cpuStaticExactAdmissionTools].every((toolId) => {
      const row = packet.rows?.find((candidate) => candidate.toolId === toolId)
      return row?.toolExecutionDryRunStatus ===
        'private_worker_tool_execution_dry_run_proof_prepared_execution_blocked' &&
        row.sourceWorkerClaimAndDispatchSmokeProofAccepted === true &&
        row.sourceWorkerClaimAndDispatchEvidenceAccepted === true &&
        row.dryToolExecutionProofPrepared === true &&
        row.dryToolExecutionContractPrepared === true &&
        row.adapterPayloadShapeValidated === true &&
        row.privateOutputManifestContractValidated === true &&
        row.toolResultSchemaValidated === true &&
        row.dryRunContract?.expectedOutputVisibility === 'private_artifact_only' &&
        row.externalAgentCanInvokeAdapterNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function sourceCpuStaticControlledToolExecutionProofAccepted(
  packet?:
    Partial<AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofReport>,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF_DECISION &&
    packet.status ===
      'external_agent_cpu_static_private_worker_controlled_tool_execution_proof_prepared_five_with_runtime_blocks' &&
    packet.counts?.totalAiGraphicsTools === 21 &&
    packet.counts?.controlledToolExecutionProofAcceptedTools === 5 &&
    packet.counts?.sourceToolExecutionDryRunProofPreparedTools === 5 &&
    packet.counts?.sourceWorkerClaimAndDispatchSmokeProofAcceptedTools === 5 &&
    packet.counts?.sourcePhase0ProofPassedTools === 5 &&
    packet.counts?.exactRequestContractsAcceptedTools === 5 &&
    packet.counts?.privateOutputManifestAcceptedTools === 5 &&
    packet.counts?.toolResultSchemaAcceptedTools === 5 &&
    packet.counts?.toolSpecificQaGateAcceptedTools === 5 &&
    packet.counts?.phase0LocalArtifactEvidenceAcceptedTools === 5 &&
    packet.counts?.satoriBlockedPendingApprovedFontFixtureTools === 1 &&
    packet.counts?.nonCpuStaticDeferredTools === 15 &&
    packet.counts?.externalAgentExecutableNowTools === 0 &&
    packet.counts?.externalAgentCanInvokeAdapterNowTools === 0 &&
    packet.counts?.workerDispatchApprovedNowTools === 0 &&
    packet.counts?.toolExecutionApprovedNowTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.booleans?.sourceToolExecutionDryRunProofAccepted === true &&
    packet.booleans?.sourceWorkerClaimAndDispatchSmokeProofAccepted === true &&
    packet.booleans?.sourcePhase0ExecutionProofAccepted === true &&
    packet.booleans?.allFiveControlledToolExecutionProofsAccepted === true &&
    packet.booleans?.allFiveSourceDryRunContractsAccepted === true &&
    packet.booleans?.allFivePhase0ExecutionEvidenceAccepted === true &&
    packet.booleans?.allFivePrivateOutputManifestsAccepted === true &&
    packet.booleans?.allFiveToolResultSchemasAccepted === true &&
    packet.booleans?.allFiveToolSpecificQaGatesAccepted === true &&
    packet.booleans?.sourceWorkerClaimAndDispatchEvidenceRefsPreserved === true &&
    packet.booleans?.phase0LocalArtifactPolicyAccepted === true &&
    packet.booleans?.privateArtifactOnlyPolicyAccepted === true &&
    packet.booleans?.noNewToolExecutionByControlledProof === true &&
    packet.booleans?.noAdapterInvocationByControlledProof === true &&
    packet.booleans?.nextGateRequiresExactExternalAgentExecutionAdmission === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.externalAgentCanInvokeAdapterNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false &&
    Array.isArray(packet.rows) &&
    packet.rows.length === 21 &&
    [...cpuStaticExactAdmissionTools].every((toolId) => {
      const row = packet.rows?.find((candidate) => candidate.toolId === toolId)
      return row?.controlledToolExecutionProofStatus ===
        'controlled_private_tool_execution_proof_accepted_with_phase0_evidence_execution_blocked' &&
        row.sourceWorkerClaimAndDispatchSmokeProofAccepted === true &&
        row.sourceWorkerClaimAndDispatchEvidenceAccepted === true &&
        row.controlledToolExecutionProofAccepted === true &&
        row.phase0ExecutionEvidenceAccepted === true &&
        row.exactRequestContractAccepted === true &&
        row.privateOutputManifestAccepted === true &&
        row.toolResultSchemaAccepted === true &&
        row.toolSpecificQaGateAccepted === true &&
        row.controlledToolExecutionEvidence?.expectedOutputVisibility ===
          'private_artifact_only' &&
        row.externalAgentCanInvokeAdapterNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function statusFromInput(input: {
  hasProperInstallAudit: boolean
  properInstallAuditAccepted: boolean
  hasSourceAdmission: boolean
  sourceAdmissionAccepted: boolean
  hasSourceRouteMountReadiness: boolean
  sourceRouteMountReadinessAccepted: boolean
  hasControlledOnDemandStatusBridge: boolean
  controlledOnDemandStatusBridgeAccepted: boolean
  hasCpuStaticExactExecutionAdmission: boolean
  cpuStaticExactExecutionAdmissionAccepted: boolean
  hasCpuStaticAdapterInvocationEnqueueAdmission: boolean
  cpuStaticAdapterInvocationEnqueueAdmissionAccepted: boolean
  hasCpuStaticLiveAdapterQueueWriteProof: boolean
  cpuStaticLiveAdapterQueueWriteProofAccepted: boolean
  hasCpuStaticNonProductionServiceRoleQueueWriteSmokePreflight: boolean
  cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted: boolean
  hasCpuStaticNonProductionEvidenceSequence: boolean
  cpuStaticNonProductionEvidenceSequencePrepared: boolean
  hasCpuStaticNonProductionServiceRoleQueueWriteSmokeProof: boolean
  cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted: boolean
  hasCpuStaticWorkerClaimAndDispatchSmokeProof: boolean
  cpuStaticWorkerClaimAndDispatchSmokeProofAccepted: boolean
  hasCpuStaticToolExecutionDryRunProof: boolean
  cpuStaticToolExecutionDryRunProofAccepted: boolean
  hasCpuStaticControlledToolExecutionProof: boolean
  cpuStaticControlledToolExecutionProofAccepted: boolean
}): AiGraphicsExternalAgentExecutionGateStatus {
  if (!input.hasProperInstallAudit) {
    return 'missing_21_tool_proper_install_audit'
  }
  if (!input.properInstallAuditAccepted) {
    return '21_tool_proper_install_audit_rejected'
  }
  if (!input.hasSourceAdmission) {
    return 'missing_external_beta_callable_request_admission'
  }
  if (!input.sourceAdmissionAccepted) {
    return 'external_beta_callable_request_admission_rejected'
  }
  if (!input.hasSourceRouteMountReadiness) {
    return 'missing_external_beta_api_route_mount_readiness'
  }
  if (!input.sourceRouteMountReadinessAccepted) {
    return 'external_beta_api_route_mount_readiness_rejected'
  }
  if (!input.hasControlledOnDemandStatusBridge) {
    return 'missing_external_beta_controlled_on_demand_status_bridge'
  }
  if (!input.controlledOnDemandStatusBridgeAccepted) {
    return 'external_beta_controlled_on_demand_status_bridge_rejected'
  }
  if (!input.hasCpuStaticExactExecutionAdmission) {
    return 'missing_external_agent_cpu_static_private_worker_exact_execution_admission'
  }
  if (!input.cpuStaticExactExecutionAdmissionAccepted) {
    return 'external_agent_cpu_static_private_worker_exact_execution_admission_rejected'
  }
  if (!input.hasCpuStaticAdapterInvocationEnqueueAdmission) {
    return 'missing_external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission'
  }
  if (!input.cpuStaticAdapterInvocationEnqueueAdmissionAccepted) {
    return 'external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission_rejected'
  }
  if (!input.hasCpuStaticLiveAdapterQueueWriteProof) {
    return 'missing_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof'
  }
  if (!input.cpuStaticLiveAdapterQueueWriteProofAccepted) {
    return 'external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_rejected'
  }
  if (!input.hasCpuStaticNonProductionServiceRoleQueueWriteSmokePreflight) {
    return 'missing_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight'
  }
  if (!input.cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted) {
    return 'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_rejected'
  }
  if (
    input.hasCpuStaticNonProductionEvidenceSequence &&
    !input.cpuStaticNonProductionEvidenceSequencePrepared
  ) {
    return 'external_agent_cpu_static_private_worker_non_production_evidence_sequence_rejected'
  }
  if (
    input.hasCpuStaticNonProductionServiceRoleQueueWriteSmokeProof &&
    !input.cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted
  ) {
    return 'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_proof_rejected'
  }
  if (
    input.hasCpuStaticWorkerClaimAndDispatchSmokeProof &&
    !input.cpuStaticWorkerClaimAndDispatchSmokeProofAccepted
  ) {
    return 'external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_proof_rejected'
  }
  if (
    input.hasCpuStaticToolExecutionDryRunProof &&
    !input.cpuStaticToolExecutionDryRunProofAccepted
  ) {
    return 'external_agent_cpu_static_private_worker_tool_execution_dry_run_proof_rejected'
  }
  if (
    input.hasCpuStaticControlledToolExecutionProof &&
    !input.cpuStaticControlledToolExecutionProofAccepted
  ) {
    return 'external_agent_cpu_static_private_worker_controlled_tool_execution_proof_rejected'
  }
  return 'external_agent_execution_gate_controlled_route_ready_direct_global_execution_blocked'
}

function requiredBeforeExecution(input: {
  gpuRequiredForRuntime: boolean
  nativeGpuRuntimeProofRequired?: boolean
  nativeGpuRuntimeProofAccepted?: boolean
  modelWeightPrivateEvidenceRequired?: boolean
  modelWeightPrivateEvidenceAccepted?: boolean
  cpuStaticProofRow?: AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofRow
  cpuStaticExactAdmissionRow?: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow
  cpuStaticAdapterInvocationEnqueueAdmissionRow?: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionRow
  cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightRow?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow
  cpuStaticNonProductionServiceRoleQueueWriteSmokeProofRow?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofRow
  cpuStaticWorkerClaimAndDispatchSmokeProofRow?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofRow
  cpuStaticToolExecutionDryRunProofRow?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofRow
  cpuStaticControlledToolExecutionProofRow?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofRow
}): string[] {
  const adapterInvocationEnqueueAdmissionReady =
    input.cpuStaticAdapterInvocationEnqueueAdmissionRow
      ?.externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence === true
  const exactAdmissionReady =
    input.cpuStaticExactAdmissionRow?.externalAgentExactRequestAdmittedWithProvidedEvidence ===
    true
  const cpuStaticProofPassed =
    input.cpuStaticProofRow?.externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidence ===
    true
  const serviceRoleQueueWriteSmokePreflightReady =
    input.cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightRow
      ?.nonProductionServiceRoleQueueWriteSmokePreflightReady === true
  const serviceRoleQueueWriteSmokeProofAccepted =
    input.cpuStaticNonProductionServiceRoleQueueWriteSmokeProofRow
      ?.serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence === true
  const workerClaimAndDispatchSmokeProofAccepted =
    input.cpuStaticWorkerClaimAndDispatchSmokeProofRow
      ?.workerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence === true
  const toolExecutionDryRunProofAccepted =
    input.cpuStaticToolExecutionDryRunProofRow?.dryToolExecutionProofPrepared === true
  const controlledToolExecutionProofAccepted =
    input.cpuStaticControlledToolExecutionProofRow?.controlledToolExecutionProofAccepted ===
    true
  return [
    'explicit external-agent execution approval must pass this gate in require-go mode',
    'real external-beta API route handler mount must be approved; current route-mount readiness evidence is accepted but still unmounted',
    'approved plan snapshot, credit reservation, private artifact manifest, trace, and idempotency evidence must be present',
    input.gpuModelProofRefQueueAdmissionAccepted
      ? 'GPU/model proof-ref route queue admission and mock worker lease have passed; real private queue write, worker dispatch, tool execution, model load/inference, result capture, cleanup, and require-go authorization still must pass before GPU/model execution'
      :
    controlledToolExecutionProofAccepted
      ? 'exact external-agent execution admission and require-go authorization must be revalidated against controlled proof; current controlled proof accepts Phase 0 local evidence but still performs no adapter invocation, worker execution, or tool execution'
      : toolExecutionDryRunProofAccepted
      ? 'controlled private tool execution proof must pass next; current dry-run proof prepares contracts only and still performs no adapter invocation, worker execution, or tool execution'
      : workerClaimAndDispatchSmokeProofAccepted
      ? 'tool execution dry-run proof must pass next; current worker claim and dispatch smoke proof accepts five claims, dispatch handoffs, lease releases, and cleanup with no worker or tool execution'
      : serviceRoleQueueWriteSmokeProofAccepted
      ? 'worker claim and dispatch smoke proof must pass next; current saved non-production service-role queue-write smoke proof accepts five queue writes with cleanup but still performs no worker claim, dispatch, or tool execution'
      : serviceRoleQueueWriteSmokePreflightReady
      ? 'saved non-production service-role queue write smoke result must pass next; current preflight prepares exact environment, cleanup, rollback, telemetry, and evidence requirements without running the smoke'
      : cpuStaticProofPassed
      ? 'non-production service-role queue write smoke preflight must pass next; current proof only validates the runtime queue service adapter in mock-only mode'
      : adapterInvocationEnqueueAdmissionReady
      ? 'live adapter invocation and queue-service validation must pass next; current adapter/enqueue admission only prepares envelopes and payloads without invoking the adapter, queue, worker, or tool'
      : exactAdmissionReady
      ? 'adapter invocation and worker enqueue admission must pass next; current exact request admission still performs no live queue write, adapter invocation, worker enqueue, dispatch, or tool execution'
      : 'private non-production queue insertion, worker claim, worker dispatch, and result capture proof must pass',
    'Tool Route and Worker execution must remain private and explicitly approved before any tool call',
    input.gpuRequiredForRuntime && input.modelWeightPrivateEvidenceRequired
      ? 'private model-weight checksum evidence, manifest supplement, reviewed private manifest, and native L4 GPU runtime proof must pass before this GPU/model tool can execute; GPU remains off until an accepted job is claimed'
      : input.gpuRequiredForRuntime && input.nativeGpuRuntimeProofRequired
      ? 'native L4 GPU runtime proof must pass before this foundation GPU tool can execute; GPU worker must start only after an accepted GPU job is claimed, then scale back down after completion'
      : 'CPU/static worker proof must pass without browser, GPU, provider, public artifact, or signed URL side effects',
  ]
}

export function buildAiGraphicsExternalAgentExecutionGate(
  input: AiGraphicsExternalAgentExecutionGateInput = {},
): AiGraphicsExternalAgentExecutionGate {
  const sourceProperInstallAudit = input.source21ToolProperInstallAuditPacket
  const sourceAdmission = input.sourceExternalBetaCallableRequestAdmissionPacket
  const sourceRouteMountReadiness =
    input.sourceExternalBetaApiRouteMountReadinessPacket
  const sourceControlledOnDemandStatusBridge =
    input.sourceExternalBetaControlledOnDemandStatusBridgePacket
  const sourceCpuStaticLiveAdapterQueueWriteProof =
    input.sourceExternalAgentCpuStaticLiveAdapterQueueWriteProofPacket
  const sourceCpuStaticExactExecutionAdmission =
    input.sourceExternalAgentCpuStaticExactExecutionAdmissionPacket
  const sourceCpuStaticAdapterInvocationEnqueueAdmission =
    input.sourceExternalAgentCpuStaticAdapterInvocationEnqueueAdmissionPacket
  const sourceCpuStaticNonProductionServiceRoleQueueWriteSmokePreflight =
    input.sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightPacket
  const sourceCpuStaticNonProductionEvidenceSequence =
    input.sourceExternalAgentCpuStaticNonProductionEvidenceSequencePacket
  const sourceCpuStaticNonProductionServiceRoleQueueWriteSmokeProof =
    input.sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokeProofPacket
  const sourceCpuStaticWorkerClaimAndDispatchSmokeProof =
    input.sourceExternalAgentCpuStaticWorkerClaimAndDispatchSmokeProofPacket
  const sourceCpuStaticToolExecutionDryRunProof =
    input.sourceExternalAgentCpuStaticToolExecutionDryRunProofPacket
  const sourceCpuStaticControlledToolExecutionProof =
    input.sourceExternalAgentCpuStaticControlledToolExecutionProofPacket
  const sourceExternalBetaToolCallRouteReadinessProbeSmoke =
    input.sourceExternalBetaToolCallRouteReadinessProbeSmokePacket
  const sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmoke =
    input.sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmokePacket
  const sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmoke =
    input.sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokePacket
  const sourceExternalAgentControlledWorkerRouteExecutionSmoke =
    input.sourceExternalAgentControlledWorkerRouteExecutionSmokePacket
  const sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmoke =
    input.sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokePacket
  const sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmoke =
    input.sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokePacket
  const sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmoke =
    input.sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmokePacket
  const sourceExternalAgentToolAdapterAuthorization =
    input.sourceExternalAgentToolAdapterAuthorizationPacket
  const sourceSatoriFontRuntimeProof =
    input.sourceSatoriFontRuntimeProofPacket
  const installAccepted = sourceProperInstallAuditAccepted(sourceProperInstallAudit)
  const sourceAccepted = sourceAdmissionAccepted(sourceAdmission)
  const routeMountAccepted =
    sourceRouteMountReadinessAccepted(sourceRouteMountReadiness)
  const controlledOnDemandAccepted =
    sourceControlledOnDemandStatusBridgeAccepted(sourceControlledOnDemandStatusBridge)
  const cpuStaticLiveAdapterQueueWriteProofAccepted =
    sourceCpuStaticLiveAdapterQueueWriteProofAccepted(
      sourceCpuStaticLiveAdapterQueueWriteProof,
    )
  const cpuStaticExactExecutionAdmissionAccepted =
    sourceCpuStaticExactExecutionAdmissionAccepted(
      sourceCpuStaticExactExecutionAdmission,
    )
  const cpuStaticAdapterInvocationEnqueueAdmissionAccepted =
    sourceCpuStaticAdapterInvocationEnqueueAdmissionAccepted(
      sourceCpuStaticAdapterInvocationEnqueueAdmission,
    )
  const cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted =
    sourceCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted(
      sourceCpuStaticNonProductionServiceRoleQueueWriteSmokePreflight,
    )
  const cpuStaticNonProductionEvidenceSequencePrepared =
    sourceCpuStaticNonProductionEvidenceSequencePrepared(
      sourceCpuStaticNonProductionEvidenceSequence,
    )
  const cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted =
    sourceCpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted(
      sourceCpuStaticNonProductionServiceRoleQueueWriteSmokeProof,
    )
  const cpuStaticWorkerClaimAndDispatchSmokeProofAccepted =
    sourceCpuStaticWorkerClaimAndDispatchSmokeProofAccepted(
      sourceCpuStaticWorkerClaimAndDispatchSmokeProof,
    )
  const cpuStaticToolExecutionDryRunProofAccepted =
    sourceCpuStaticToolExecutionDryRunProofAccepted(
      sourceCpuStaticToolExecutionDryRunProof,
    )
  const cpuStaticControlledToolExecutionProofAccepted =
    sourceCpuStaticControlledToolExecutionProofAccepted(
      sourceCpuStaticControlledToolExecutionProof,
    )
  const routeReadinessProbeAccepted =
    sourceExternalBetaToolCallRouteReadinessProbeSmokeAccepted(
      sourceExternalBetaToolCallRouteReadinessProbeSmoke,
    )
  const routeCpuStaticControlledExecutionSmokeAccepted =
    sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmokeAccepted(
      sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmoke,
    )
  const routeBrowserRuntimeControlledExecutionSmokeAccepted =
    sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokeAccepted(
      sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmoke,
    )
  const controlledWorkerRouteExecutionSmokeAccepted =
    sourceExternalAgentControlledWorkerRouteExecutionSmokeAccepted(
      sourceExternalAgentControlledWorkerRouteExecutionSmoke,
    )
  const routeGpuModelRuntimeAdmissionSmokeAccepted =
    sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokeAccepted(
      sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmoke,
    )
  const routeGpuModelProofRefQueueAdmissionSmokeAccepted =
    sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokeAccepted(
      sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmoke,
    )
  const routeMockQueueWorkerClaimSmokeAccepted =
    sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmokeAccepted(
      sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmoke,
    )
  const externalAgentToolAdapterAuthorizationAccepted =
    sourceExternalAgentToolAdapterAuthorizationAccepted(
      sourceExternalAgentToolAdapterAuthorization,
    )
  const satoriFontRuntimeProofAccepted =
    sourceSatoriFontRuntimeProofAccepted(sourceSatoriFontRuntimeProof)
  const controlledRouteExecutionSmokeAccepted =
    routeCpuStaticControlledExecutionSmokeAccepted &&
    routeBrowserRuntimeControlledExecutionSmokeAccepted &&
    routeGpuModelRuntimeAdmissionSmokeAccepted
  const tools = listAiGraphicsToolCallHandoffTools()
  const gpuRuntimeTargetedTools =
    tools.filter((tool) => tool.gpuRequiredForRuntime).length
  const candidateTools =
    sourceAccepted
      ? sourceAdmission?.externalBetaCallableCandidateToolsWithProvidedEvidence ?? 21
      : 0
  const requestAdmissionReadyTools =
    sourceAccepted
      ? sourceAdmission?.externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence ?? 1
      : 0
  const requestedToolId = sourceAdmission?.requestedToolId
  const installRows = new Map(
    (sourceProperInstallAudit?.toolRows ?? []).map((row) => [row.toolId, row]),
  )
  const cpuStaticProofRows = new Map(
    (sourceCpuStaticLiveAdapterQueueWriteProof?.rows ?? []).map((row) => [
      row.toolId,
      row,
    ]),
  )
  const cpuStaticExactAdmissionRows = new Map(
    (sourceCpuStaticExactExecutionAdmission?.rows ?? []).map((row) => [
      row.toolId,
      row,
    ]),
  )
  const cpuStaticAdapterInvocationEnqueueAdmissionRows = new Map(
    (sourceCpuStaticAdapterInvocationEnqueueAdmission?.rows ?? []).map((row) => [
      row.toolId,
      row,
    ]),
  )
  const cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightRows = new Map(
    (sourceCpuStaticNonProductionServiceRoleQueueWriteSmokePreflight?.rows ?? [])
      .map((row) => [row.toolId, row]),
  )
  const cpuStaticNonProductionServiceRoleQueueWriteSmokeProofRows = new Map(
    (sourceCpuStaticNonProductionServiceRoleQueueWriteSmokeProof?.rows ?? [])
      .map((row) => [row.toolId, row]),
  )
  const cpuStaticWorkerClaimAndDispatchSmokeProofRows = new Map(
    (sourceCpuStaticWorkerClaimAndDispatchSmokeProof?.rows ?? [])
      .map((row) => [row.toolId, row]),
  )
  const cpuStaticToolExecutionDryRunProofRows = new Map(
    (sourceCpuStaticToolExecutionDryRunProof?.rows ?? [])
      .map((row) => [row.toolId, row]),
  )
  const cpuStaticControlledToolExecutionProofRows = new Map(
    (sourceCpuStaticControlledToolExecutionProof?.rows ?? [])
      .map((row) => [row.toolId, row]),
  )
  const routeReadinessProbeToolSummaryRows = new Map(
    (sourceExternalBetaToolCallRouteReadinessProbeSmoke?.toolSummary ?? [])
      .map((row) => [row.toolId, row]),
  )
  const gpuModelProofRefQueueAdmissionRows = new Map(
    (sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmoke?.routeQueuedJobs ?? [])
      .map((row) => [row.toolId, row]),
  )
  const gpuModelProofRefWorkerClaimRows = new Map(
    (sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmoke?.workerClaims ?? [])
      .map((row) => [row.toolId, row]),
  )
  const toolRows = tools.map((tool): AiGraphicsExternalAgentExecutionGateToolRow => {
    const installRow = installRows.get(tool.toolId)
    const routeReadinessProbeToolSummaryRow =
      routeReadinessProbeToolSummaryRows.get(tool.toolId)
    const gpuModelProofRefQueueAdmissionRow =
      gpuModelProofRefQueueAdmissionRows.get(tool.toolId)
    const gpuModelProofRefWorkerClaimRow =
      gpuModelProofRefWorkerClaimRows.get(tool.toolId)
    const cpuStaticProofRow = cpuStaticProofRows.get(tool.toolId)
    const cpuStaticExactAdmissionRow = cpuStaticExactAdmissionRows.get(tool.toolId)
    const cpuStaticAdapterInvocationEnqueueAdmissionRow =
      cpuStaticAdapterInvocationEnqueueAdmissionRows.get(tool.toolId)
    const cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightRow =
      cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightRows.get(tool.toolId)
    const cpuStaticNonProductionServiceRoleQueueWriteSmokeProofRow =
      cpuStaticNonProductionServiceRoleQueueWriteSmokeProofRows.get(tool.toolId)
    const cpuStaticWorkerClaimAndDispatchSmokeProofRow =
      cpuStaticWorkerClaimAndDispatchSmokeProofRows.get(tool.toolId)
    const cpuStaticToolExecutionDryRunProofRow =
      cpuStaticToolExecutionDryRunProofRows.get(tool.toolId)
    const cpuStaticControlledToolExecutionProofRow =
      cpuStaticControlledToolExecutionProofRows.get(tool.toolId)
    const cpuStaticProofPassed =
      cpuStaticLiveAdapterQueueWriteProofAccepted &&
      cpuStaticProofRow?.externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidence ===
        true
    const satoriFontRuntimeProofReady =
      tool.toolId === 'satori' && satoriFontRuntimeProofAccepted
    const cpuStaticLocalRuntimeProofAccepted =
      cpuStaticProofPassed || satoriFontRuntimeProofReady
    const satoriLiveAdapterQueueProofPending =
      satoriFontRuntimeProofReady && !cpuStaticProofPassed
    const cpuStaticExactAdmissionReady =
      cpuStaticExactExecutionAdmissionAccepted &&
      cpuStaticExactAdmissionRow?.externalAgentExactRequestAdmittedWithProvidedEvidence ===
        true
    const cpuStaticAdapterInvocationEnqueueAdmissionReady =
      cpuStaticAdapterInvocationEnqueueAdmissionAccepted &&
      cpuStaticAdapterInvocationEnqueueAdmissionRow
        ?.externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence === true
    const cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightReady =
      cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted &&
      cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightRow
        ?.nonProductionServiceRoleQueueWriteSmokePreflightReady === true
    const cpuStaticNonProductionServiceRoleQueueWriteSmokeProofReady =
      cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted &&
      cpuStaticNonProductionServiceRoleQueueWriteSmokeProofRow
        ?.serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence === true
    const cpuStaticWorkerClaimAndDispatchSmokeProofReady =
      cpuStaticWorkerClaimAndDispatchSmokeProofAccepted &&
      cpuStaticWorkerClaimAndDispatchSmokeProofRow
        ?.workerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence === true
    const cpuStaticToolExecutionDryRunProofReady =
      cpuStaticToolExecutionDryRunProofAccepted &&
      cpuStaticToolExecutionDryRunProofRow?.dryToolExecutionProofPrepared === true
    const cpuStaticControlledToolExecutionProofReady =
      cpuStaticControlledToolExecutionProofAccepted &&
      cpuStaticControlledToolExecutionProofRow?.controlledToolExecutionProofAccepted ===
        true
    const nativeGpuRuntimeProofRequired =
      routeReadinessProbeAccepted &&
      routeReadinessProbeToolSummaryRow?.nativeGpuRuntimeProofRequired === true
    const nativeGpuRuntimeProofAccepted =
      routeReadinessProbeAccepted &&
      routeReadinessProbeToolSummaryRow?.nativeGpuRuntimeProofAccepted === true
    const modelWeightPrivateEvidenceRequired =
      routeReadinessProbeAccepted &&
      routeReadinessProbeToolSummaryRow?.modelWeightPrivateEvidenceRequired === true
    const modelWeightPrivateEvidenceAccepted =
      routeReadinessProbeAccepted &&
      routeReadinessProbeToolSummaryRow?.modelWeightPrivateEvidenceAccepted === true
    const gpuModelProofRefQueueAdmissionAccepted =
      routeGpuModelProofRefQueueAdmissionSmokeAccepted &&
      gpuModelProofRefQueueAdmissionRow?.runtimeJobAdmissionReadyWithProvidedEvidence ===
        true
    const gpuModelProofRefMockWorkerClaimed =
      routeGpuModelProofRefQueueAdmissionSmokeAccepted &&
      gpuModelProofRefWorkerClaimRow?.mockWorkerClaimCreated === true
    const gpuModelExternalBetaReadinessBlocker =
      tool.gpuRequiredForRuntime
        ? gpuModelProofRefQueueAdmissionAccepted
          ? 'gpu_model_proof_ref_queue_admission_accepted_worker_dispatch_and_tool_execution_proof_pending'
          : modelWeightPrivateEvidenceRequired
          ? 'private_model_weight_evidence_and_native_gpu_runtime_proof_pending'
          : nativeGpuRuntimeProofRequired
          ? 'native_gpu_runtime_proof_pending'
          : 'gpu_runtime_admission_metadata_missing'
        : null
    return {
      toolId: tool.toolId,
      productionToolId: tool.productionToolId,
      workerType: tool.workerType,
      runtimeTarget: tool.runtimeTarget,
      installSurface: installRow?.installSurface ?? null,
      properlyInstalledForPlannedSurface:
        installAccepted && installRow?.properlyInstalledForPlannedSurface === true,
      externalBetaCallableInstallReadyNow: false,
      runtimeReadyNow: false,
      gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
      externalBetaCallableCandidateWithProvidedEvidence: sourceAccepted,
      requestAdmissionCandidateWithProvidedEvidence:
        sourceAccepted && requestedToolId === tool.toolId,
      cpuStaticLiveAdapterQueueWriteProofStatus:
        satoriLiveAdapterQueueProofPending
          ? 'live_adapter_invocation_queue_write_proof_pending_satori_live_adapter_queue_extension'
          : cpuStaticProofRow?.liveAdapterInvocationQueueWriteProofStatus ?? null,
      cpuStaticLiveAdapterQueueWriteProofPassedWithProvidedEvidence:
        cpuStaticProofPassed,
      satoriFontRuntimeProofAcceptedWithProvidedEvidence:
        satoriFontRuntimeProofReady,
      cpuStaticLocalRuntimeProofAcceptedWithProvidedEvidence:
        cpuStaticLocalRuntimeProofAccepted,
      nonProductionServiceRoleQueueWriteSmokeRequired:
        cpuStaticProofPassed &&
        cpuStaticProofRow?.serviceRoleQueueWriteSmokeRequired === true,
      cpuStaticExactExecutionAdmissionStatus:
        satoriLiveAdapterQueueProofPending
          ? 'exact_external_agent_execution_admission_pending_satori_live_adapter_queue_extension'
          : cpuStaticExactAdmissionRow?.exactExecutionAdmissionStatus ?? null,
      cpuStaticExactExecutionAdmissionReady: cpuStaticExactAdmissionReady,
      externalAgentExactRequestAdmittedWithProvidedEvidence:
        cpuStaticExactAdmissionReady,
      cpuStaticAdapterInvocationEnqueueAdmissionStatus:
        satoriLiveAdapterQueueProofPending
          ? 'adapter_invocation_enqueue_admission_pending_satori_live_adapter_queue_extension'
          : cpuStaticAdapterInvocationEnqueueAdmissionRow
            ?.adapterInvocationEnqueueAdmissionStatus ?? null,
      cpuStaticAdapterInvocationEnqueueAdmissionReady:
        cpuStaticAdapterInvocationEnqueueAdmissionReady,
      externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence:
        cpuStaticAdapterInvocationEnqueueAdmissionReady,
      cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightStatus:
        satoriLiveAdapterQueueProofPending
          ? 'non_production_service_role_queue_write_smoke_preflight_pending_satori_live_adapter_queue_extension'
          : cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightRow
            ?.nonProductionServiceRoleQueueWriteSmokePreflightStatus ?? null,
      cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightReady:
        cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightReady,
      externalAgentNonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidence:
        cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightReady &&
        cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightRow
          ?.preflightEvidence != null,
      cpuStaticNonProductionServiceRoleQueueWriteSmokeProofStatus:
        cpuStaticNonProductionServiceRoleQueueWriteSmokeProofRow
          ?.serviceRoleQueueWriteSmokeProofStatus ?? null,
      cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence:
        cpuStaticNonProductionServiceRoleQueueWriteSmokeProofReady,
      cpuStaticWorkerClaimAndDispatchSmokeProofStatus:
        cpuStaticWorkerClaimAndDispatchSmokeProofRow
          ?.workerClaimAndDispatchSmokeProofStatus ?? null,
      cpuStaticWorkerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence:
        cpuStaticWorkerClaimAndDispatchSmokeProofReady,
      cpuStaticWorkerClaimsAcceptedWithProvidedEvidence:
        cpuStaticWorkerClaimAndDispatchSmokeProofReady
          ? cpuStaticWorkerClaimAndDispatchSmokeProofRow
              ?.workerClaimsAcceptedWithProvidedEvidence ?? 0
          : 0,
      cpuStaticWorkerDispatchHandoffsAcceptedWithProvidedEvidence:
        cpuStaticWorkerClaimAndDispatchSmokeProofReady
          ? cpuStaticWorkerClaimAndDispatchSmokeProofRow
              ?.workerDispatchHandoffsAcceptedWithProvidedEvidence ?? 0
          : 0,
      cpuStaticWorkerDispatchLeasesReleasedWithProvidedEvidence:
        cpuStaticWorkerClaimAndDispatchSmokeProofReady
          ? cpuStaticWorkerClaimAndDispatchSmokeProofRow
              ?.workerDispatchLeasesReleasedWithProvidedEvidence ?? 0
          : 0,
      cpuStaticToolExecutionDryRunProofStatus:
        cpuStaticToolExecutionDryRunProofRow?.toolExecutionDryRunStatus ?? null,
      cpuStaticToolExecutionDryRunProofPreparedWithProvidedEvidence:
        cpuStaticToolExecutionDryRunProofReady,
      cpuStaticDryToolExecutionContractPrepared:
        cpuStaticToolExecutionDryRunProofReady &&
        cpuStaticToolExecutionDryRunProofRow?.dryToolExecutionContractPrepared ===
          true,
      cpuStaticControlledToolExecutionProofStatus:
        cpuStaticControlledToolExecutionProofRow?.controlledToolExecutionProofStatus ??
        null,
      cpuStaticControlledToolExecutionProofAcceptedWithProvidedEvidence:
        cpuStaticControlledToolExecutionProofReady,
      cpuStaticPhase0ExecutionEvidenceAccepted:
        cpuStaticControlledToolExecutionProofReady &&
        cpuStaticControlledToolExecutionProofRow?.phase0ExecutionEvidenceAccepted ===
          true,
      adapterInvocationAndWorkerEnqueueAdmissionRequired:
        cpuStaticExactAdmissionReady &&
        !cpuStaticAdapterInvocationEnqueueAdmissionReady &&
        cpuStaticExactAdmissionRow?.externalAgentCanInvokeAdapterNow === false &&
        cpuStaticExactAdmissionRow?.externalAgentCanSubmitPrivateWorkerQueueNow ===
          false,
      workerClaimAndDispatchSmokeProofRequired:
        cpuStaticNonProductionServiceRoleQueueWriteSmokeProofReady &&
        !cpuStaticWorkerClaimAndDispatchSmokeProofReady,
      toolExecutionDryRunProofRequired:
        cpuStaticWorkerClaimAndDispatchSmokeProofReady &&
        !cpuStaticToolExecutionDryRunProofReady,
      controlledToolExecutionProofRequired:
        cpuStaticToolExecutionDryRunProofReady &&
        !cpuStaticControlledToolExecutionProofReady,
      executionAllowedNow: false,
      gpuRuntimeShouldStartNow: false,
      gpuModelUnblockPlanStatus:
        routeReadinessProbeToolSummaryRow?.gpuModelUnblockPlanStatus ?? null,
      gpuModelExternalBetaReadinessBlocker,
      nextExternalAgentAction:
        routeReadinessProbeToolSummaryRow?.nextExternalAgentAction ?? null,
      nativeGpuRuntimeProofRequired,
      nativeGpuRuntimeProofAccepted,
      modelWeightPrivateEvidenceRequired,
      modelWeightPrivateEvidenceAccepted,
      gpuModelProofRefQueueAdmissionStatus:
        gpuModelProofRefQueueAdmissionAccepted
          ? 'gpu_model_proof_ref_queue_admission_accepted_runtime_still_blocked'
          : gpuModelProofRefQueueAdmissionRow?.runtimeJobAdmissionReadyWithProvidedEvidence === false
          ? 'gpu_model_proof_ref_queue_admission_rejected'
          : null,
      gpuModelProofRefQueueAdmissionAcceptedWithProvidedEvidence:
        gpuModelProofRefQueueAdmissionAccepted,
      gpuModelRuntimeJobAdmissionReadyWithProvidedProofRefs:
        gpuModelProofRefQueueAdmissionAccepted,
      gpuModelProofRefMockWorkerClaimedWithProvidedEvidence:
        gpuModelProofRefMockWorkerClaimed,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJobWithProofRefs:
        routeGpuModelProofRefQueueAdmissionSmokeAccepted &&
        gpuModelProofRefQueueAdmissionRow?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob ===
          true,
      currentBlocker: 'external_agent_execution_gate_fail_closed_runtime_blocked',
      requiredBeforeExecution: requiredBeforeExecution({
        gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
        nativeGpuRuntimeProofRequired,
        nativeGpuRuntimeProofAccepted,
        modelWeightPrivateEvidenceRequired,
        modelWeightPrivateEvidenceAccepted,
        cpuStaticProofRow,
        cpuStaticExactAdmissionRow,
        cpuStaticAdapterInvocationEnqueueAdmissionRow,
        cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightRow,
        cpuStaticNonProductionServiceRoleQueueWriteSmokeProofRow,
        cpuStaticWorkerClaimAndDispatchSmokeProofRow,
        cpuStaticToolExecutionDryRunProofRow,
        cpuStaticControlledToolExecutionProofRow,
        gpuModelProofRefQueueAdmissionAccepted,
      }),
      safeNextCommand: safeNextCommand({
        toolId: tool.toolId,
        gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
        satoriFontRuntimeProofAccepted,
        cpuStaticProofRow,
        cpuStaticExactAdmissionRow,
        cpuStaticAdapterInvocationEnqueueAdmissionRow,
        cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightRow,
        cpuStaticNonProductionServiceRoleQueueWriteSmokeProofRow,
        cpuStaticWorkerClaimAndDispatchSmokeProofRow,
        cpuStaticToolExecutionDryRunProofRow,
        cpuStaticControlledToolExecutionProofRow,
      }),
    }
  })

  return {
    decision: AI_GRAPHICS_EXTERNAL_AGENT_EXECUTION_GATE_DECISION,
    status: statusFromInput({
      hasProperInstallAudit: Boolean(sourceProperInstallAudit),
      properInstallAuditAccepted: installAccepted,
      hasSourceAdmission: Boolean(sourceAdmission),
      sourceAdmissionAccepted: sourceAccepted,
      hasSourceRouteMountReadiness: Boolean(sourceRouteMountReadiness),
      sourceRouteMountReadinessAccepted: routeMountAccepted,
      hasControlledOnDemandStatusBridge: Boolean(sourceControlledOnDemandStatusBridge),
      controlledOnDemandStatusBridgeAccepted: controlledOnDemandAccepted,
      hasCpuStaticExactExecutionAdmission:
        Boolean(sourceCpuStaticExactExecutionAdmission),
      cpuStaticExactExecutionAdmissionAccepted:
        cpuStaticExactExecutionAdmissionAccepted,
      hasCpuStaticAdapterInvocationEnqueueAdmission:
        Boolean(sourceCpuStaticAdapterInvocationEnqueueAdmission),
      cpuStaticAdapterInvocationEnqueueAdmissionAccepted:
        cpuStaticAdapterInvocationEnqueueAdmissionAccepted,
      hasCpuStaticLiveAdapterQueueWriteProof:
        Boolean(sourceCpuStaticLiveAdapterQueueWriteProof),
      cpuStaticLiveAdapterQueueWriteProofAccepted:
        cpuStaticLiveAdapterQueueWriteProofAccepted,
      hasCpuStaticNonProductionServiceRoleQueueWriteSmokePreflight:
        Boolean(sourceCpuStaticNonProductionServiceRoleQueueWriteSmokePreflight),
      cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted:
        cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted,
      hasCpuStaticNonProductionEvidenceSequence:
        Boolean(sourceCpuStaticNonProductionEvidenceSequence),
      cpuStaticNonProductionEvidenceSequencePrepared:
        cpuStaticNonProductionEvidenceSequencePrepared,
      hasCpuStaticNonProductionServiceRoleQueueWriteSmokeProof:
        Boolean(sourceCpuStaticNonProductionServiceRoleQueueWriteSmokeProof),
      cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted:
        cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted,
      hasCpuStaticWorkerClaimAndDispatchSmokeProof:
        Boolean(sourceCpuStaticWorkerClaimAndDispatchSmokeProof),
      cpuStaticWorkerClaimAndDispatchSmokeProofAccepted:
        cpuStaticWorkerClaimAndDispatchSmokeProofAccepted,
      hasCpuStaticToolExecutionDryRunProof:
        Boolean(sourceCpuStaticToolExecutionDryRunProof),
      cpuStaticToolExecutionDryRunProofAccepted:
        cpuStaticToolExecutionDryRunProofAccepted,
      hasCpuStaticControlledToolExecutionProof:
        Boolean(sourceCpuStaticControlledToolExecutionProof),
      cpuStaticControlledToolExecutionProofAccepted:
        cpuStaticControlledToolExecutionProofAccepted,
    }),
    mode: 'fail_closed_ai_graphics_external_agent_execution_gate',
    source21ToolProperInstallAuditDecision:
      sourceProperInstallAudit?.decision === AI_GRAPHICS_21_TOOL_PROPER_INSTALL_AUDIT_DECISION
        ? sourceProperInstallAudit.decision
        : null,
    sourceExternalBetaCallableRequestAdmissionDecision:
      sourceAdmission?.decision === AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION
        ? sourceAdmission.decision
        : null,
    sourceExternalBetaApiRouteMountReadinessDecision:
      sourceRouteMountReadiness?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_READINESS_DECISION
        ? sourceRouteMountReadiness.decision
        : null,
    sourceExternalBetaControlledOnDemandStatusBridgeDecision:
      sourceControlledOnDemandStatusBridge?.decision === AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_ON_DEMAND_STATUS_BRIDGE_DECISION
        ? sourceControlledOnDemandStatusBridge.decision
        : null,
    sourceExternalAgentCpuStaticLiveAdapterQueueWriteProofDecision:
      sourceCpuStaticLiveAdapterQueueWriteProof?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION
        ? sourceCpuStaticLiveAdapterQueueWriteProof.decision
        : null,
    sourceExternalAgentCpuStaticExactExecutionAdmissionDecision:
      sourceCpuStaticExactExecutionAdmission?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION
        ? sourceCpuStaticExactExecutionAdmission.decision
        : null,
    sourceExternalAgentCpuStaticAdapterInvocationEnqueueAdmissionDecision:
      sourceCpuStaticAdapterInvocationEnqueueAdmission?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_ENQUEUE_ADMISSION_DECISION
        ? sourceCpuStaticAdapterInvocationEnqueueAdmission.decision
        : null,
    sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightDecision:
      sourceCpuStaticNonProductionServiceRoleQueueWriteSmokePreflight?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION
        ? sourceCpuStaticNonProductionServiceRoleQueueWriteSmokePreflight.decision
        : null,
    sourceExternalAgentCpuStaticNonProductionEvidenceSequenceDecision:
      sourceCpuStaticNonProductionEvidenceSequence?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_EVIDENCE_SEQUENCE_DECISION
        ? sourceCpuStaticNonProductionEvidenceSequence.decision
        : null,
    sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokeProofDecision:
      sourceCpuStaticNonProductionServiceRoleQueueWriteSmokeProof?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION
        ? sourceCpuStaticNonProductionServiceRoleQueueWriteSmokeProof.decision
        : null,
    sourceExternalAgentCpuStaticWorkerClaimAndDispatchSmokeProofDecision:
      sourceCpuStaticWorkerClaimAndDispatchSmokeProof?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF_DECISION
        ? sourceCpuStaticWorkerClaimAndDispatchSmokeProof.decision
        : null,
    sourceExternalAgentCpuStaticToolExecutionDryRunProofDecision:
      sourceCpuStaticToolExecutionDryRunProof?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF_DECISION
        ? sourceCpuStaticToolExecutionDryRunProof.decision
        : null,
    sourceExternalAgentCpuStaticControlledToolExecutionProofDecision:
      sourceCpuStaticControlledToolExecutionProof?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF_DECISION
        ? sourceCpuStaticControlledToolExecutionProof.decision
        : null,
    sourceExternalBetaToolCallRouteReadinessProbeSmokeDecision:
      sourceExternalBetaToolCallRouteReadinessProbeSmoke?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_READINESS_PROBE_SMOKE_DECISION
        ? sourceExternalBetaToolCallRouteReadinessProbeSmoke.decision
        : null,
    sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmokeDecision:
      sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmoke?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_SMOKE_DECISION
        ? sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmoke.decision
        : null,
    sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokeDecision:
      sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmoke
        ?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_SMOKE_DECISION
        ? sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmoke.decision
        : null,
    sourceExternalAgentControlledWorkerRouteExecutionSmokeDecision:
      sourceExternalAgentControlledWorkerRouteExecutionSmoke?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_CONTROLLED_WORKER_ROUTE_EXECUTION_SMOKE_DECISION
        ? sourceExternalAgentControlledWorkerRouteExecutionSmoke.decision
        : null,
    sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokeDecision:
      sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmoke?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_SMOKE_DECISION
        ? sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmoke.decision
        : null,
    sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokeDecision:
      sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmoke?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_PROOF_REF_QUEUE_ADMISSION_SMOKE_DECISION
        ? sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmoke.decision
        : null,
    sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmokeDecision:
      sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmoke?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_WORKER_CLAIM_SMOKE_DECISION
        ? sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmoke.decision
        : null,
    sourceExternalAgentToolAdapterAuthorizationDecision:
      sourceExternalAgentToolAdapterAuthorization?.decision ===
      AI_GRAPHICS_EXTERNAL_AGENT_TOOL_ADAPTER_AUTHORIZATION_DECISION
        ? sourceExternalAgentToolAdapterAuthorization.decision
        : null,
    sourceSatoriFontRuntimeProofDecision:
      sourceSatoriFontRuntimeProof?.decision ===
      AI_GRAPHICS_SATORI_FONT_RUNTIME_PROOF_DECISION
        ? sourceSatoriFontRuntimeProof.decision
        : null,
    source21ToolProperInstallAuditAccepted: installAccepted,
    sourceExternalBetaCallableRequestAdmissionAccepted: sourceAccepted,
    sourceExternalBetaApiRouteMountReadinessAccepted: routeMountAccepted,
    sourceExternalBetaControlledOnDemandStatusBridgeAccepted:
      controlledOnDemandAccepted,
    sourceExternalAgentCpuStaticLiveAdapterQueueWriteProofAccepted:
      cpuStaticLiveAdapterQueueWriteProofAccepted,
    sourceExternalAgentCpuStaticExactExecutionAdmissionAccepted:
      cpuStaticExactExecutionAdmissionAccepted,
    sourceExternalAgentCpuStaticAdapterInvocationEnqueueAdmissionAccepted:
      cpuStaticAdapterInvocationEnqueueAdmissionAccepted,
    sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted:
      cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted,
    sourceExternalAgentCpuStaticNonProductionEvidenceSequencePrepared:
      cpuStaticNonProductionEvidenceSequencePrepared,
    sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted:
      cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted,
    sourceExternalAgentCpuStaticWorkerClaimAndDispatchSmokeProofAccepted:
      cpuStaticWorkerClaimAndDispatchSmokeProofAccepted,
    sourceExternalAgentCpuStaticToolExecutionDryRunProofAccepted:
      cpuStaticToolExecutionDryRunProofAccepted,
    sourceExternalAgentCpuStaticControlledToolExecutionProofAccepted:
      cpuStaticControlledToolExecutionProofAccepted,
    sourceExternalBetaToolCallRouteReadinessProbeSmokeAccepted:
      routeReadinessProbeAccepted,
    sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmokeAccepted:
      routeCpuStaticControlledExecutionSmokeAccepted,
    sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokeAccepted:
      routeBrowserRuntimeControlledExecutionSmokeAccepted,
    sourceExternalAgentControlledWorkerRouteExecutionSmokeAccepted:
      controlledWorkerRouteExecutionSmokeAccepted,
    sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokeAccepted:
      routeGpuModelRuntimeAdmissionSmokeAccepted,
    sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokeAccepted:
      routeGpuModelProofRefQueueAdmissionSmokeAccepted,
    sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmokeAccepted:
      routeMockQueueWorkerClaimSmokeAccepted,
    sourceExternalAgentToolAdapterAuthorizationAccepted:
      externalAgentToolAdapterAuthorizationAccepted,
    sourceSatoriFontRuntimeProofAccepted:
      satoriFontRuntimeProofAccepted,
    readyForAnyExternalAgentExecutionNow: false,
    executionAllowedNow: false,
    requireGoExitCodeWhenBlocked: 2,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: gpuRuntimeTargetedTools as 8,
    properlyInstalledForPlannedSurfaceTools: installAccepted ? 21 : 0,
    runtimeProofPassedButToolCallBlockedTools: installAccepted ? 13 : 0,
    nativeGpuRuntimeProofPendingTools: installAccepted ? 8 : 0,
    modelWeightManifestPendingTools: installAccepted ? 5 : 0,
    externalBetaCallableInstallReadyNowTools: 0,
    controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence:
      controlledOnDemandAccepted ? 21 : 0,
    controlledOnDemandExternalBetaCallableToolsWithProvidedEvidence:
      controlledOnDemandAccepted ? 21 : 0,
    controlledOnDemandRuntimeReadyForToolCallToolsWithProvidedEvidence:
      controlledOnDemandAccepted ? 21 : 0,
    cpuStaticLiveAdapterQueueWriteProofPassedWithProvidedEvidenceTools:
      cpuStaticLiveAdapterQueueWriteProofAccepted ? 5 : 0,
    cpuStaticMockQueueServiceValidationPassedTools:
      cpuStaticLiveAdapterQueueWriteProofAccepted ? 5 : 0,
    cpuStaticExactExecutionAdmissionReadyTools:
      cpuStaticExactExecutionAdmissionAccepted ? 5 : 0,
    cpuStaticExactRequestEnvelopeAcceptedTools:
      cpuStaticExactExecutionAdmissionAccepted ? 5 : 0,
    cpuStaticApprovedPlanSnapshotAcceptedTools:
      cpuStaticExactExecutionAdmissionAccepted ? 5 : 0,
    cpuStaticPrivateArtifactManifestAcceptedTools:
      cpuStaticExactExecutionAdmissionAccepted ? 5 : 0,
    cpuStaticWorkerAcceptedRequestSchemaAcceptedTools:
      cpuStaticExactExecutionAdmissionAccepted ? 5 : 0,
    externalAgentExactRequestAdmittedWithProvidedEvidenceTools:
      cpuStaticExactExecutionAdmissionAccepted ? 5 : 0,
    cpuStaticAdapterInvocationEnqueueAdmissionReadyTools:
      cpuStaticAdapterInvocationEnqueueAdmissionAccepted ? 5 : 0,
    cpuStaticAdapterInvocationEnvelopePreparedTools:
      cpuStaticAdapterInvocationEnqueueAdmissionAccepted ? 5 : 0,
    cpuStaticWorkerEnqueuePayloadPreparedTools:
      cpuStaticAdapterInvocationEnqueueAdmissionAccepted ? 5 : 0,
    cpuStaticProductionWorkerJobPayloadAcceptedTools:
      cpuStaticAdapterInvocationEnqueueAdmissionAccepted ? 5 : 0,
    externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidenceTools:
      cpuStaticAdapterInvocationEnqueueAdmissionAccepted ? 5 : 0,
    cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightReadyTools:
      cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted ? 5 : 0,
    externalAgentNonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidenceTools:
      cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted ? 5 : 0,
    cpuStaticNonProductionEvidenceSequencePreparedTools:
      cpuStaticNonProductionEvidenceSequencePrepared ? 5 : 0,
    externalAgentCpuStaticNonProductionEvidenceSequencePreparedWithRuntimeBlocksTools:
      cpuStaticNonProductionEvidenceSequencePrepared ? 5 : 0,
    cpuStaticNonProductionEvidenceSequenceExecutedNowTools: 0,
    cpuStaticNonProductionEvidenceSequenceLiveQueueWritesNow: 0,
    cpuStaticNonProductionEvidenceSequenceLiveWorkerClaimsNow: 0,
    cpuStaticNonProductionEvidenceSequenceLiveWorkerDispatchHandoffsNow: 0,
    cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidenceTools:
      cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted ? 5 : 0,
    cpuStaticNonProductionServiceRoleQueueWritesAcceptedWithProvidedEvidenceTools:
      cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted ? 5 : 0,
    nonProductionServiceRoleQueueRowsPersistedAfterCleanup: 0,
    cpuStaticWorkerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidenceTools:
      cpuStaticWorkerClaimAndDispatchSmokeProofAccepted ? 5 : 0,
    cpuStaticWorkerClaimsAcceptedWithProvidedEvidenceTools:
      cpuStaticWorkerClaimAndDispatchSmokeProofAccepted ? 5 : 0,
    cpuStaticWorkerDispatchHandoffsAcceptedWithProvidedEvidenceTools:
      cpuStaticWorkerClaimAndDispatchSmokeProofAccepted ? 5 : 0,
    cpuStaticWorkerDispatchLeasesReleasedWithProvidedEvidenceTools:
      cpuStaticWorkerClaimAndDispatchSmokeProofAccepted ? 5 : 0,
    cpuStaticToolExecutionDryRunProofPreparedWithProvidedEvidenceTools:
      cpuStaticToolExecutionDryRunProofAccepted ? 5 : 0,
    cpuStaticDryToolExecutionContractsPreparedTools:
      cpuStaticToolExecutionDryRunProofAccepted ? 5 : 0,
    cpuStaticControlledToolExecutionProofAcceptedWithProvidedEvidenceTools:
      cpuStaticControlledToolExecutionProofAccepted ? 5 : 0,
    cpuStaticPhase0ExecutionEvidenceAcceptedTools:
      cpuStaticControlledToolExecutionProofAccepted ? 5 : 0,
    cpuStaticSatoriBlockedPendingApprovedFontFixtureTools:
      cpuStaticLiveAdapterQueueWriteProofAccepted && !satoriFontRuntimeProofAccepted ? 1 : 0,
    cpuStaticSatoriFontRuntimeProofAcceptedWithProvidedEvidenceTools:
      satoriFontRuntimeProofAccepted ? 1 : 0,
    cpuStaticLocalRuntimeProofsAcceptedWithProvidedEvidenceTools:
      cpuStaticLiveAdapterQueueWriteProofAccepted && satoriFontRuntimeProofAccepted ? 6 : 0,
    cpuStaticNonCpuStaticDeferredTools:
      cpuStaticLiveAdapterQueueWriteProofAccepted ? 15 : 0,
    nonProductionServiceRoleQueueWriteSmokeRequiredTools:
      cpuStaticLiveAdapterQueueWriteProofAccepted ? 5 : 0,
    nonProductionServiceRoleQueueWriteSmokeResultRequiredTools:
      cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted &&
      !cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted ? 5 : 0,
    adapterInvocationAndWorkerEnqueueAdmissionRequiredTools:
      cpuStaticExactExecutionAdmissionAccepted &&
      !cpuStaticAdapterInvocationEnqueueAdmissionAccepted ? 5 : 0,
    workerClaimAndDispatchSmokeProofRequiredTools:
      cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted &&
      !cpuStaticWorkerClaimAndDispatchSmokeProofAccepted ? 5 : 0,
    toolExecutionDryRunProofRequiredTools:
      cpuStaticWorkerClaimAndDispatchSmokeProofAccepted &&
      !cpuStaticToolExecutionDryRunProofAccepted ? 5 : 0,
    controlledToolExecutionProofRequiredTools:
      cpuStaticToolExecutionDryRunProofAccepted &&
      !cpuStaticControlledToolExecutionProofAccepted ? 5 : 0,
    externalBetaCallableCandidateToolsWithProvidedEvidence:
      candidateTools,
    externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence:
      requestAdmissionReadyTools,
    externalAgentExecutableNowTools: 0,
    disabledRouteBlockedDetailCasesWithProvidedEvidence:
      routeReadinessProbeAccepted ? 21 : 0,
    externalAgentRouteExecutableNowToolsWithReadinessProbeEvidence:
      routeReadinessProbeAccepted ? 13 : 0,
    cpuStaticControlledRouteExecutableNowToolsWithReadinessProbeEvidence:
      routeReadinessProbeAccepted ? 6 : 0,
    browserRuntimeControlledRouteExecutableNowToolsWithReadinessProbeEvidence:
      routeReadinessProbeAccepted ? 7 : 0,
    controlledCanonicalRouteExecutedToolsWithProvidedEvidence:
      controlledRouteExecutionSmokeAccepted ? 13 : 0,
    cpuStaticControlledCanonicalRouteExecutedToolsWithProvidedEvidence:
      routeCpuStaticControlledExecutionSmokeAccepted ? 6 : 0,
    browserRuntimeControlledCanonicalRouteExecutedToolsWithProvidedEvidence:
      routeBrowserRuntimeControlledExecutionSmokeAccepted ? 7 : 0,
    localControlledPackageExecutionPerformedToolsWithProvidedEvidence:
      routeBrowserRuntimeControlledExecutionSmokeAccepted ? 13 : 0,
    controlledAdapterExecutedToolsWithProvidedEvidence:
      routeBrowserRuntimeControlledExecutionSmokeAccepted ? 13 : 0,
    controlledWorkerRouteExecutionSmokeAcceptedToolsWithProvidedEvidence:
      controlledWorkerRouteExecutionSmokeAccepted ? 13 : 0,
    externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence:
      controlledWorkerRouteExecutionSmokeAccepted ? 13 : 0,
    controlledWorkerRouteMockQueueInsertedJobsWithProvidedEvidence:
      controlledWorkerRouteExecutionSmokeAccepted ? 13 : 0,
    controlledWorkerRouteMockWorkerClaimsCreatedWithProvidedEvidence:
      controlledWorkerRouteExecutionSmokeAccepted ? 13 : 0,
    controlledWorkerRouteMockWorkerEventsRecordedWithProvidedEvidence:
      controlledWorkerRouteExecutionSmokeAccepted ? 13 : 0,
    controlledWorkerRouteExecutionPerformedToolsWithProvidedEvidence:
      controlledWorkerRouteExecutionSmokeAccepted ? 13 : 0,
    gpuModelRuntimeAdmissionEvaluatedToolsWithProvidedEvidence:
      routeGpuModelRuntimeAdmissionSmokeAccepted ? 8 : 0,
    gpuModelRuntimeAdmissionBlockedToolsWithProvidedEvidence:
      routeGpuModelRuntimeAdmissionSmokeAccepted ? 8 : 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobToolsWithProvidedEvidence: 0,
    gpuModelProofRefQueueAdmissionAcceptedToolsWithProvidedEvidence:
      routeGpuModelProofRefQueueAdmissionSmokeAccepted ? 8 : 0,
    gpuModelRuntimeAdmissionReadyWithProvidedProofRefsTools:
      routeGpuModelProofRefQueueAdmissionSmokeAccepted ? 8 : 0,
    gpuModelProofRefNativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence:
      routeGpuModelProofRefQueueAdmissionSmokeAccepted ? 8 : 0,
    gpuModelProofRefModelWeightManifestAcceptedToolsWithProvidedEvidence:
      routeGpuModelProofRefQueueAdmissionSmokeAccepted ? 5 : 0,
    gpuModelProofRefMockQueueInsertedJobsWithProvidedEvidence:
      routeGpuModelProofRefQueueAdmissionSmokeAccepted ? 8 : 0,
    gpuModelProofRefMockWorkerClaimsCreatedWithProvidedEvidence:
      routeGpuModelProofRefQueueAdmissionSmokeAccepted ? 8 : 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobToolsWithProofRefEvidence:
      routeGpuModelProofRefQueueAdmissionSmokeAccepted ? 8 : 0,
    gpuModelProofRefQueueAdmissionGpuRuntimeShouldStartNowToolsWithProvidedEvidence:
      0,
    gpuModelProofRefQueueAdmissionToolExecutionPerformedToolsWithProvidedEvidence:
      0,
    mockQueueWorkerClaimSmokeAcceptedToolsWithProvidedEvidence:
      routeMockQueueWorkerClaimSmokeAccepted ? 21 : 0,
    mockQueueInsertedJobsWithProvidedEvidence:
      routeMockQueueWorkerClaimSmokeAccepted ? 21 : 0,
    mockWorkerClaimsCreatedWithProvidedEvidence:
      routeMockQueueWorkerClaimSmokeAccepted ? 21 : 0,
    mockWorkerLeaseSecondsWithProvidedEvidence:
      routeMockQueueWorkerClaimSmokeAccepted ? 900 : 0,
    mockQueueWorkerClaimLiveQueueWritePerformedToolsWithProvidedEvidence: 0,
    mockQueueWorkerClaimWorkerDispatchPerformedToolsWithProvidedEvidence: 0,
    mockQueueWorkerClaimToolExecutionPerformedToolsWithProvidedEvidence: 0,
    mockQueueWorkerClaimGpuRuntimeShouldStartNowToolsWithProvidedEvidence: 0,
    externalAgentToolAdapterAuthorizationAcceptedToolsWithProvidedEvidence:
      externalAgentToolAdapterAuthorizationAccepted ? 21 : 0,
    externalAgentAdapterContractsAuthorizedWithRuntimeBlocksTools:
      externalAgentToolAdapterAuthorizationAccepted ? 21 : 0,
    externalAgentAdapterCpuStaticContractsWithProvidedEvidence:
      externalAgentToolAdapterAuthorizationAccepted ? 6 : 0,
    externalAgentAdapterBrowserRuntimeContractsWithProvidedEvidence:
      externalAgentToolAdapterAuthorizationAccepted ? 7 : 0,
    externalAgentAdapterGpuModelContractsWithProvidedEvidence:
      externalAgentToolAdapterAuthorizationAccepted ? 8 : 0,
    externalAgentMappedProductionProfilesAcceptedWithProvidedEvidence:
      externalAgentToolAdapterAuthorizationAccepted ? 21 : 0,
    externalAgentCanInvokeAdapterNowToolsWithProvidedEvidence: 0,
    externalAgentToolAdapterGpuRuntimeShouldStartNowToolsWithProvidedEvidence: 0,
    gpuModelRuntimeAdmissionBlockedToolsWithReadinessProbeEvidence:
      routeReadinessProbeAccepted ? 8 : 0,
    gpuModelRuntimeAdmissionEvaluatedFailClosedToolsWithReadinessProbeEvidence:
      routeReadinessProbeAccepted ? 8 : 0,
    gpuModelRuntimeUnblockPlanExposedToolsWithReadinessProbeEvidence:
      routeReadinessProbeAccepted ? 8 : 0,
    gpuModelNativeGpuProofRequiredToolsWithReadinessProbeEvidence:
      routeReadinessProbeAccepted ? 8 : 0,
    gpuModelPrivateEvidenceAndNativeGpuProofRequiredToolsWithReadinessProbeEvidence:
      routeReadinessProbeAccepted ? 5 : 0,
    gpuModelNativeGpuProofOnlyRequiredToolsWithReadinessProbeEvidence:
      routeReadinessProbeAccepted ? 3 : 0,
    gpuModelToolsReadyForExecutionAfterCurrentEvidenceWithReadinessProbeEvidence: 0,
    routeReadinessProbeGpuRuntimeShouldStartNowTools: 0,
    apiRouteMountReadyToolsWithProvidedEvidence:
      routeMountAccepted ? 21 : 0,
    apiRouteMountedNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    toolRows,
    safeCommandsBeforeExecution,
    allowedPreExecutionActions,
    forbiddenRuntimeActions,
    recommendedNextPrompt:
      cpuStaticControlledToolExecutionProofAccepted
        ? 'AI_GRAPHICS_EXTERNAL_AGENT_EXECUTION_GATE_REQUIRE_GO_REVIEW'
        : cpuStaticToolExecutionDryRunProofAccepted
        ? 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF'
        : cpuStaticWorkerClaimAndDispatchSmokeProofAccepted
        ? 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF'
        : cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted
        ? 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF'
        : cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted
        ? 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF'
        : 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT',
    booleans: {
      externalAgentExecutionGatePrepared: true,
      source21ToolProperInstallAuditAccepted: installAccepted,
      sourceExternalBetaCallableRequestAdmissionAccepted: sourceAccepted,
      sourceExternalBetaApiRouteMountReadinessAccepted: routeMountAccepted,
      sourceExternalBetaControlledOnDemandStatusBridgeAccepted:
        controlledOnDemandAccepted,
      sourceExternalAgentCpuStaticLiveAdapterQueueWriteProofAccepted:
        cpuStaticLiveAdapterQueueWriteProofAccepted,
      sourceExternalAgentCpuStaticExactExecutionAdmissionAccepted:
        cpuStaticExactExecutionAdmissionAccepted,
      sourceExternalAgentCpuStaticAdapterInvocationEnqueueAdmissionAccepted:
        cpuStaticAdapterInvocationEnqueueAdmissionAccepted,
      sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted:
        cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted,
      sourceExternalAgentCpuStaticNonProductionEvidenceSequencePrepared:
        cpuStaticNonProductionEvidenceSequencePrepared,
      sourceExternalAgentCpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted:
        cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted,
      sourceExternalAgentCpuStaticWorkerClaimAndDispatchSmokeProofAccepted:
        cpuStaticWorkerClaimAndDispatchSmokeProofAccepted,
      sourceExternalAgentCpuStaticToolExecutionDryRunProofAccepted:
        cpuStaticToolExecutionDryRunProofAccepted,
      sourceExternalAgentCpuStaticControlledToolExecutionProofAccepted:
        cpuStaticControlledToolExecutionProofAccepted,
      sourceExternalBetaToolCallRouteReadinessProbeSmokeAccepted:
        routeReadinessProbeAccepted,
      sourceExternalBetaToolCallRouteCpuStaticControlledExecutionSmokeAccepted:
        routeCpuStaticControlledExecutionSmokeAccepted,
      sourceExternalBetaToolCallRouteBrowserRuntimeControlledExecutionSmokeAccepted:
        routeBrowserRuntimeControlledExecutionSmokeAccepted,
      sourceExternalBetaToolCallRouteGpuModelRuntimeAdmissionSmokeAccepted:
        routeGpuModelRuntimeAdmissionSmokeAccepted,
      sourceExternalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokeAccepted:
        routeGpuModelProofRefQueueAdmissionSmokeAccepted,
      sourceExternalBetaToolCallRouteMockQueueWorkerClaimSmokeAccepted:
        routeMockQueueWorkerClaimSmokeAccepted,
      sourceExternalAgentToolAdapterAuthorizationAccepted:
        externalAgentToolAdapterAuthorizationAccepted,
      sourceSatoriFontRuntimeProofAccepted:
        satoriFontRuntimeProofAccepted,
      properInstallAuditAccepted: installAccepted,
      all21ToolsProperlyInstalledForPlannedSurface: installAccepted,
      installAuditSeparatesPlannedSurfaceFromRuntimeCallable: installAccepted,
      externalBetaCallableInstallReadyNow: false,
      controlledOnDemandExternalBetaReadyWithProvidedEvidence:
        controlledOnDemandAccepted,
      controlledOnDemandWorkerPathReadyButDirectAgentExecutionBlocked:
        controlledOnDemandAccepted,
      all21ToolsCovered: toolRows.length === 21,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      externalBetaCallableCandidatesWithProvidedEvidence: candidateTools === 21,
      externalBetaCallableRequestAdmissionReadyWithProvidedEvidence:
        requestAdmissionReadyTools >= 1,
      routeMountReadyWithProvidedEvidence: routeMountAccepted,
      routeMountPreparedButNotMounted: routeMountAccepted,
      cpuStaticLiveAdapterQueueServiceProofAccepted:
        cpuStaticLiveAdapterQueueWriteProofAccepted,
      allFiveCpuStaticLiveAdapterQueueWriteProofsPassedWithProvidedEvidence:
        cpuStaticLiveAdapterQueueWriteProofAccepted,
      allFiveCpuStaticMockQueueServiceValidationsPassed:
        cpuStaticLiveAdapterQueueWriteProofAccepted,
      cpuStaticExactExecutionAdmissionAccepted:
        cpuStaticExactExecutionAdmissionAccepted,
      allFiveCpuStaticExactExecutionAdmissionsReady:
        cpuStaticExactExecutionAdmissionAccepted,
      allFiveCpuStaticExactRequestEnvelopesAccepted:
        cpuStaticExactExecutionAdmissionAccepted,
      allFiveCpuStaticApprovedPlanSnapshotsAccepted:
        cpuStaticExactExecutionAdmissionAccepted,
      allFiveCpuStaticPrivateArtifactManifestsAccepted:
        cpuStaticExactExecutionAdmissionAccepted,
      allFiveCpuStaticWorkerAcceptedRequestSchemasAccepted:
        cpuStaticExactExecutionAdmissionAccepted,
      allFiveCpuStaticExternalAgentExactRequestsAdmittedWithProvidedEvidence:
        cpuStaticExactExecutionAdmissionAccepted,
      cpuStaticAdapterInvocationEnqueueAdmissionAccepted:
        cpuStaticAdapterInvocationEnqueueAdmissionAccepted,
      allFiveCpuStaticAdapterInvocationEnqueueAdmissionsReady:
        cpuStaticAdapterInvocationEnqueueAdmissionAccepted,
      allFiveCpuStaticAdapterInvocationEnvelopesPrepared:
        cpuStaticAdapterInvocationEnqueueAdmissionAccepted,
      allFiveCpuStaticWorkerEnqueuePayloadsPrepared:
        cpuStaticAdapterInvocationEnqueueAdmissionAccepted,
      allFiveCpuStaticProductionWorkerJobPayloadsAccepted:
        cpuStaticAdapterInvocationEnqueueAdmissionAccepted,
      allFiveCpuStaticExternalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence:
        cpuStaticAdapterInvocationEnqueueAdmissionAccepted,
      cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted:
        cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted,
      allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReady:
        cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted,
      allFiveCpuStaticExternalAgentNonProductionServiceRoleQueueWriteSmokePreflightsReadyWithProvidedEvidence:
        cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted,
      allFiveCpuStaticNonProductionEvidenceSequencePreparedWithRuntimeBlocks:
        cpuStaticNonProductionEvidenceSequencePrepared,
      nonProductionEvidenceSequenceKeepsRuntimeBlocks:
        cpuStaticNonProductionEvidenceSequencePrepared,
      liveEvidenceSequenceExecutedNow: false,
      allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokeProofsAcceptedWithProvidedEvidence:
        cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted,
      allFiveCpuStaticNonProductionServiceRoleQueueWritesAcceptedWithProvidedEvidence:
        cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted,
      nonProductionServiceRoleQueueWriteSmokeCleanupVerifiedWithProvidedEvidence:
        cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted,
      allFiveCpuStaticWorkerClaimAndDispatchSmokeProofsAcceptedWithProvidedEvidence:
        cpuStaticWorkerClaimAndDispatchSmokeProofAccepted,
      allFiveCpuStaticWorkerClaimsAcceptedWithProvidedEvidence:
        cpuStaticWorkerClaimAndDispatchSmokeProofAccepted,
      allFiveCpuStaticWorkerDispatchHandoffsAcceptedWithProvidedEvidence:
        cpuStaticWorkerClaimAndDispatchSmokeProofAccepted,
      allFiveCpuStaticWorkerDispatchLeasesReleasedWithProvidedEvidence:
        cpuStaticWorkerClaimAndDispatchSmokeProofAccepted,
      allFiveCpuStaticToolExecutionDryRunProofsPreparedWithProvidedEvidence:
        cpuStaticToolExecutionDryRunProofAccepted,
      allFiveCpuStaticDryToolExecutionContractsPrepared:
        cpuStaticToolExecutionDryRunProofAccepted,
      allFiveCpuStaticControlledToolExecutionProofsAcceptedWithProvidedEvidence:
        cpuStaticControlledToolExecutionProofAccepted,
      allFiveCpuStaticPhase0ExecutionEvidenceAccepted:
        cpuStaticControlledToolExecutionProofAccepted,
      satoriRemainsBlockedPendingApprovedFontFixture:
        cpuStaticLiveAdapterQueueWriteProofAccepted && !satoriFontRuntimeProofAccepted,
      satoriFontRuntimeProofAcceptedWithProvidedEvidence:
        satoriFontRuntimeProofAccepted,
      satoriFontBlockResolvedForLocalRuntimeProof:
        satoriFontRuntimeProofAccepted,
      allSixCpuStaticLocalRuntimeProofsAcceptedWithProvidedEvidence:
        cpuStaticLiveAdapterQueueWriteProofAccepted && satoriFontRuntimeProofAccepted,
      fifteenNonCpuStaticToolsRemainDeferredToRuntimeLanes:
        cpuStaticLiveAdapterQueueWriteProofAccepted,
      nonProductionServiceRoleQueueWriteSmokeRequiredBeforeExecution:
        cpuStaticLiveAdapterQueueWriteProofAccepted,
      nonProductionServiceRoleQueueWriteSmokeResultRequiredBeforeExecution:
        cpuStaticNonProductionServiceRoleQueueWriteSmokePreflightAccepted &&
        !cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted,
      workerClaimAndDispatchSmokeProofRequiredBeforeExecution:
        cpuStaticNonProductionServiceRoleQueueWriteSmokeProofAccepted &&
        !cpuStaticWorkerClaimAndDispatchSmokeProofAccepted,
      toolExecutionDryRunProofRequiredBeforeExecution:
        cpuStaticWorkerClaimAndDispatchSmokeProofAccepted &&
        !cpuStaticToolExecutionDryRunProofAccepted,
      controlledToolExecutionProofRequiredBeforeExecution:
        cpuStaticToolExecutionDryRunProofAccepted &&
        !cpuStaticControlledToolExecutionProofAccepted,
      adapterInvocationAndWorkerEnqueueAdmissionRequiredBeforeExecution:
        cpuStaticExactExecutionAdmissionAccepted &&
        !cpuStaticAdapterInvocationEnqueueAdmissionAccepted,
      approvedPlanSnapshotRequired: true,
      creditReservationRequired: true,
      privateArtifactManifestRequired: true,
      structuredToolEnvelopeRequired: true,
      rawChatExecutionAllowed: false,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      externalAgentCanExecuteControlledRouteToolsNow: routeReadinessProbeAccepted,
      routeReadinessProbeAcceptedWithProvidedEvidence: routeReadinessProbeAccepted,
      agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow:
        routeReadinessProbeAccepted,
      controlledCanonicalRouteExecutionSmokeAcceptedWithProvidedEvidence:
        controlledRouteExecutionSmokeAccepted,
      thirteenControlledToolsExecutedViaCanonicalRouteWithProvidedEvidence:
        controlledRouteExecutionSmokeAccepted,
      sixCpuStaticControlledToolsExecutedViaCanonicalRouteWithProvidedEvidence:
        routeCpuStaticControlledExecutionSmokeAccepted,
      sevenBrowserRuntimeControlledToolsExecutedViaCanonicalRouteWithProvidedEvidence:
        routeBrowserRuntimeControlledExecutionSmokeAccepted,
      sourceExternalAgentControlledWorkerRouteExecutionSmokeAccepted:
        controlledWorkerRouteExecutionSmokeAccepted,
      externalAgentControlledWorkerRouteExecutionSmokeAcceptedWithProvidedEvidence:
        controlledWorkerRouteExecutionSmokeAccepted,
      thirteenControlledToolsExecutedViaClaimedWorkerRouteWithProvidedEvidence:
        controlledWorkerRouteExecutionSmokeAccepted,
      externalAgentCanExecuteControlledWorkerRouteToolsNow:
        controlledWorkerRouteExecutionSmokeAccepted,
      eightGpuModelToolsAdmissionFailClosedViaCanonicalRouteWithProvidedEvidence:
        routeGpuModelRuntimeAdmissionSmokeAccepted,
      allEightGpuModelProofRefQueueAdmissionsAcceptedWithProvidedEvidence:
        routeGpuModelProofRefQueueAdmissionSmokeAccepted,
      allEightGpuModelProofRefMockWorkerClaimsAcceptedWithProvidedEvidence:
        routeGpuModelProofRefQueueAdmissionSmokeAccepted,
      gpuModelProofRefQueueAdmissionKeepsGpuRuntimeIdle:
        routeGpuModelProofRefQueueAdmissionSmokeAccepted,
      gpuModelProofRefQueueAdmissionKeepsBroadExecutionBlocked:
        routeGpuModelProofRefQueueAdmissionSmokeAccepted,
      all21MockQueueWorkerClaimSmokeAcceptedWithProvidedEvidence:
        routeMockQueueWorkerClaimSmokeAccepted,
      all21RouteAdmittedMockJobsClaimedWithProvidedEvidence:
        routeMockQueueWorkerClaimSmokeAccepted,
      mockQueueWorkerClaimSmokeKeepsLiveRuntimeBlocked:
        routeMockQueueWorkerClaimSmokeAccepted,
      externalAgentToolAdapterAuthorizationAcceptedWithProvidedEvidence:
        externalAgentToolAdapterAuthorizationAccepted,
      all21ExternalAgentAdapterContractsAuthorizedWithRuntimeBlocks:
        externalAgentToolAdapterAuthorizationAccepted,
      all21ExternalAgentMappedProductionProfilesAccepted:
        externalAgentToolAdapterAuthorizationAccepted,
      externalAgentAdapterAuthorizationKeepsInvocationBlocked:
        externalAgentToolAdapterAuthorizationAccepted,
      controlledRouteExecutionSmokeKeepsBroadExecutionBlocked:
        controlledRouteExecutionSmokeAccepted,
      gpuModelUnblockPlanAcceptedWithProvidedEvidence:
        routeReadinessProbeAccepted,
      allEightGpuModelToolsHaveActionableUnblockPlan:
        routeReadinessProbeAccepted,
      fiveModelWeightToolsRequirePrivateEvidenceBeforeGpuProof:
        routeReadinessProbeAccepted,
      threeFoundationGpuToolsRequireNativeGpuProofOnly:
        routeReadinessProbeAccepted,
      gpuModelToolsReadyForExecutionAfterCurrentEvidence: false,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteGpuModelToolsNow: false,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      externalAgentExecutionAllowedNow: false,
      apiRouteMountedNow: false,
      apiRouteExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
