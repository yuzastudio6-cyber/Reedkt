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

export const AI_GRAPHICS_EXTERNAL_AGENT_EXECUTION_GATE_DECISION =
  'ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings'
export const AI_GRAPHICS_21_TOOL_PROPER_INSTALL_AUDIT_DECISION =
  'ai_graphics_21_tool_proper_install_audit_completed_with_runtime_blocks'

export type AiGraphicsExternalAgentExecutionGateStatus =
  | 'missing_21_tool_proper_install_audit'
  | '21_tool_proper_install_audit_rejected'
  | 'missing_external_beta_callable_request_admission'
  | 'external_beta_callable_request_admission_rejected'
  | 'missing_external_beta_api_route_mount_readiness'
  | 'external_beta_api_route_mount_readiness_rejected'
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

export interface AiGraphicsExternalAgentExecutionGateInput {
  source21ToolProperInstallAuditPacket?: Partial<AiGraphics21ToolProperInstallAudit>
  sourceExternalBetaCallableRequestAdmissionPacket?: Partial<AiGraphicsExternalBetaCallableRequestAdmission>
  sourceExternalBetaApiRouteMountReadinessPacket?: Partial<AiGraphicsExternalBetaApiRouteMountReadiness>
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
  executionAllowedNow: false
  gpuRuntimeShouldStartNow: false
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
  source21ToolProperInstallAuditAccepted: boolean
  sourceExternalBetaCallableRequestAdmissionAccepted: boolean
  sourceExternalBetaApiRouteMountReadinessAccepted: boolean
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
  externalBetaCallableCandidateToolsWithProvidedEvidence: number
  externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence: number
  externalAgentExecutableNowTools: 0
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
    properInstallAuditAccepted: boolean
    all21ToolsProperlyInstalledForPlannedSurface: boolean
    installAuditSeparatesPlannedSurfaceFromRuntimeCallable: boolean
    externalBetaCallableInstallReadyNow: false
    all21ToolsCovered: boolean
    all12CapabilitiesCovered: boolean
    all8GpuToolsTargetGpuRuntime: boolean
    externalBetaCallableCandidatesWithProvidedEvidence: boolean
    externalBetaCallableRequestAdmissionReadyWithProvidedEvidence: boolean
    routeMountReadyWithProvidedEvidence: boolean
    routeMountPreparedButNotMounted: boolean
    approvedPlanSnapshotRequired: true
    creditReservationRequired: true
    privateArtifactManifestRequired: true
    structuredToolEnvelopeRequired: true
    rawChatExecutionAllowed: false
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
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
]

const allowedPreExecutionActions = [
  'read sanitized callable-scope and request-admission evidence',
  'select, rank, and eliminate planning tools from the 21-tool AI graphics set',
  'explain missing proof before execution',
  'verify approved plan snapshot, credit reservation, private manifest, trace, and idempotency metadata',
  'return a fail-closed go/no-go decision for an external agent before any route, worker, provider, or tool call',
  'preserve GPU startup as on-demand only for a later accepted worker/tool job',
]

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

function statusFromInput(input: {
  hasProperInstallAudit: boolean
  properInstallAuditAccepted: boolean
  hasSourceAdmission: boolean
  sourceAdmissionAccepted: boolean
  hasSourceRouteMountReadiness: boolean
  sourceRouteMountReadinessAccepted: boolean
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
  return 'external_agent_execution_gate_fail_closed_runtime_blocked'
}

function requiredBeforeExecution(gpuRequiredForRuntime: boolean): string[] {
  return [
    'explicit external-agent execution approval must pass this gate in require-go mode',
    'real external-beta API route handler mount must be approved; current route-mount readiness evidence is accepted but still unmounted',
    'approved plan snapshot, credit reservation, private artifact manifest, trace, and idempotency evidence must be present',
    'private non-production queue insertion, worker claim, worker dispatch, and result capture proof must pass',
    'Tool Route and Worker execution must remain private and explicitly approved before any tool call',
    gpuRequiredForRuntime
      ? 'GPU worker must start only after an accepted GPU job is claimed, then scale back down after completion'
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
  const installAccepted = sourceProperInstallAuditAccepted(sourceProperInstallAudit)
  const sourceAccepted = sourceAdmissionAccepted(sourceAdmission)
  const routeMountAccepted =
    sourceRouteMountReadinessAccepted(sourceRouteMountReadiness)
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
  const toolRows = tools.map((tool): AiGraphicsExternalAgentExecutionGateToolRow => {
    const installRow = installRows.get(tool.toolId)
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
      executionAllowedNow: false,
      gpuRuntimeShouldStartNow: false,
      currentBlocker: 'external_agent_execution_gate_fail_closed_runtime_blocked',
      requiredBeforeExecution: requiredBeforeExecution(tool.gpuRequiredForRuntime),
      safeNextCommand: 'npm run ai-graphics:external-agent-execution-gate',
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
    source21ToolProperInstallAuditAccepted: installAccepted,
    sourceExternalBetaCallableRequestAdmissionAccepted: sourceAccepted,
    sourceExternalBetaApiRouteMountReadinessAccepted: routeMountAccepted,
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
    externalBetaCallableCandidateToolsWithProvidedEvidence:
      candidateTools,
    externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence:
      requestAdmissionReadyTools,
    externalAgentExecutableNowTools: 0,
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
      'AI_GRAPHICS_EXTERNAL_AGENT_EXECUTION_GATE_QA_REVIEW_OR_ROUTE_MOUNT_PROOF',
    booleans: {
      externalAgentExecutionGatePrepared: true,
      source21ToolProperInstallAuditAccepted: installAccepted,
      sourceExternalBetaCallableRequestAdmissionAccepted: sourceAccepted,
      sourceExternalBetaApiRouteMountReadinessAccepted: routeMountAccepted,
      properInstallAuditAccepted: installAccepted,
      all21ToolsProperlyInstalledForPlannedSurface: installAccepted,
      installAuditSeparatesPlannedSurfaceFromRuntimeCallable: installAccepted,
      externalBetaCallableInstallReadyNow: false,
      all21ToolsCovered: toolRows.length === 21,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      externalBetaCallableCandidatesWithProvidedEvidence: candidateTools === 21,
      externalBetaCallableRequestAdmissionReadyWithProvidedEvidence:
        requestAdmissionReadyTools >= 1,
      routeMountReadyWithProvidedEvidence: routeMountAccepted,
      routeMountPreparedButNotMounted: routeMountAccepted,
      approvedPlanSnapshotRequired: true,
      creditReservationRequired: true,
      privateArtifactManifestRequired: true,
      structuredToolEnvelopeRequired: true,
      rawChatExecutionAllowed: false,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
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
