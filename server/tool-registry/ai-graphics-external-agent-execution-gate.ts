import {
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import { listAiGraphicsToolCallHandoffTools } from './ai-graphics-tool-call-handoff'
import {
  AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION,
  type AiGraphicsExternalBetaCallableRequestAdmission,
} from './ai-graphics-external-beta-callable-request-admission'

export const AI_GRAPHICS_EXTERNAL_AGENT_EXECUTION_GATE_DECISION =
  'ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings'

export type AiGraphicsExternalAgentExecutionGateStatus =
  | 'missing_external_beta_callable_request_admission'
  | 'external_beta_callable_request_admission_rejected'
  | 'external_agent_execution_gate_fail_closed_runtime_blocked'

export interface AiGraphicsExternalAgentExecutionGateInput {
  sourceExternalBetaCallableRequestAdmissionPacket?: Partial<AiGraphicsExternalBetaCallableRequestAdmission>
}

export interface AiGraphicsExternalAgentExecutionGateToolRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: string
  workerType: string
  runtimeTarget: string
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
  sourceExternalBetaCallableRequestAdmissionDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION | null
  sourceExternalBetaCallableRequestAdmissionAccepted: boolean
  readyForAnyExternalAgentExecutionNow: false
  executionAllowedNow: false
  requireGoExitCodeWhenBlocked: 2
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  externalBetaCallableCandidateToolsWithProvidedEvidence: number
  externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence: number
  externalAgentExecutableNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  toolRows: AiGraphicsExternalAgentExecutionGateToolRow[]
  safeCommandsBeforeExecution: string[]
  allowedPreExecutionActions: string[]
  forbiddenRuntimeActions: string[]
  recommendedNextPrompt: string
  booleans: {
    externalAgentExecutionGatePrepared: true
    sourceExternalBetaCallableRequestAdmissionAccepted: boolean
    all21ToolsCovered: boolean
    all12CapabilitiesCovered: boolean
    all8GpuToolsTargetGpuRuntime: boolean
    externalBetaCallableCandidatesWithProvidedEvidence: boolean
    externalBetaCallableRequestAdmissionReadyWithProvidedEvidence: boolean
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

function statusFromInput(input: {
  hasSourceAdmission: boolean
  sourceAdmissionAccepted: boolean
}): AiGraphicsExternalAgentExecutionGateStatus {
  if (!input.hasSourceAdmission) {
    return 'missing_external_beta_callable_request_admission'
  }
  if (!input.sourceAdmissionAccepted) {
    return 'external_beta_callable_request_admission_rejected'
  }
  return 'external_agent_execution_gate_fail_closed_runtime_blocked'
}

function requiredBeforeExecution(gpuRequiredForRuntime: boolean): string[] {
  return [
    'explicit external-agent execution approval must pass this gate in require-go mode',
    'real external-beta API route handler must be mounted and accepted',
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
  const sourceAdmission = input.sourceExternalBetaCallableRequestAdmissionPacket
  const sourceAccepted = sourceAdmissionAccepted(sourceAdmission)
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
  const toolRows = tools.map((tool): AiGraphicsExternalAgentExecutionGateToolRow => ({
    toolId: tool.toolId,
    productionToolId: tool.productionToolId,
    workerType: tool.workerType,
    runtimeTarget: tool.runtimeTarget,
    gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
    externalBetaCallableCandidateWithProvidedEvidence: sourceAccepted,
    requestAdmissionCandidateWithProvidedEvidence:
      sourceAccepted && requestedToolId === tool.toolId,
    executionAllowedNow: false,
    gpuRuntimeShouldStartNow: false,
    currentBlocker: 'external_agent_execution_gate_fail_closed_runtime_blocked',
    requiredBeforeExecution: requiredBeforeExecution(tool.gpuRequiredForRuntime),
    safeNextCommand: 'npm run ai-graphics:external-agent-execution-gate',
  }))

  return {
    decision: AI_GRAPHICS_EXTERNAL_AGENT_EXECUTION_GATE_DECISION,
    status: statusFromInput({
      hasSourceAdmission: Boolean(sourceAdmission),
      sourceAdmissionAccepted: sourceAccepted,
    }),
    mode: 'fail_closed_ai_graphics_external_agent_execution_gate',
    sourceExternalBetaCallableRequestAdmissionDecision:
      sourceAdmission?.decision === AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION
        ? sourceAdmission.decision
        : null,
    sourceExternalBetaCallableRequestAdmissionAccepted: sourceAccepted,
    readyForAnyExternalAgentExecutionNow: false,
    executionAllowedNow: false,
    requireGoExitCodeWhenBlocked: 2,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: gpuRuntimeTargetedTools as 8,
    externalBetaCallableCandidateToolsWithProvidedEvidence:
      candidateTools,
    externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence:
      requestAdmissionReadyTools,
    externalAgentExecutableNowTools: 0,
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
      sourceExternalBetaCallableRequestAdmissionAccepted: sourceAccepted,
      all21ToolsCovered: toolRows.length === 21,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      externalBetaCallableCandidatesWithProvidedEvidence: candidateTools === 21,
      externalBetaCallableRequestAdmissionReadyWithProvidedEvidence:
        requestAdmissionReadyTools >= 1,
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
