import type {
  AiGraphicsCapabilityId,
  AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_SCOPE_DECISION,
  type AiGraphicsExternalBetaCallableScope,
  type AiGraphicsExternalBetaCallableToolScope,
} from './ai-graphics-external-beta-callable-scope'
import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION,
  type AiGraphicsExternalBetaToolCallGateway,
} from './ai-graphics-external-beta-tool-call-gateway'

export const AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION =
  'ai_graphics_external_beta_callable_request_admission_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaCallableRequestAdmissionStatus =
  | 'missing_external_beta_callable_scope'
  | 'external_beta_callable_scope_rejected'
  | 'missing_external_beta_tool_call_gateway'
  | 'external_beta_tool_call_gateway_rejected'
  | 'requested_tool_not_in_callable_scope'
  | 'external_beta_callable_request_admission_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaCallableRequestAdmissionInput {
  sourceExternalBetaCallableScopePacket?: AiGraphicsExternalBetaCallableScope
  sourceExternalBetaToolCallGatewayPacket?: AiGraphicsExternalBetaToolCallGateway
}

export interface AiGraphicsExternalBetaCallableRequestCandidate {
  toolId: AiGraphicsCanonicalToolId
  capabilityId: string
  productionToolId: string | null
  workerType: string
  runtimeTarget: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  gatewayCandidateRef: string
  requestId: string
  workspaceId: string
  traceId: string
  idempotencyKey: string
  gpuRequiredForRuntime: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  workerQueueApprovedNow: false
  workerEnqueuePerformed: false
  toolExecutionPerformed: false
}

export interface AiGraphicsExternalBetaCallableRequestAdmission {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION
  sourceExternalBetaCallableScopeDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_SCOPE_DECISION | null
  sourceExternalBetaToolCallGatewayDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION | null
  status: AiGraphicsExternalBetaCallableRequestAdmissionStatus
  requestedToolId: AiGraphicsCanonicalToolId | string | null
  capabilityId: string | null
  sourceCallableScopeAccepted: boolean
  sourceToolCallGatewayAccepted: boolean
  requestedToolPresentInCallableScope: boolean
  requestedCapabilityPresentInCallableScope: boolean
  externalBetaCallableRequestAdmissionReadyWithProvidedEvidence: boolean
  externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence: 0 | 1
  externalBetaCallableCandidateToolsWithProvidedEvidence: number
  externalBetaCallableNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  gpuRuntimeTargetedTools: number
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  sourceExternalBetaCallableScope: AiGraphicsExternalBetaCallableScope | null
  sourceExternalBetaToolCallGateway: AiGraphicsExternalBetaToolCallGateway | null
  sourceCallableScopeTool: AiGraphicsExternalBetaCallableToolScope | null
  callableRequestCandidate: AiGraphicsExternalBetaCallableRequestCandidate | null
  allowedAdmissionActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaCallableRequestAdmissionPrepared: true
    sourceExternalBetaCallableScopeAccepted: boolean
    sourceExternalBetaToolCallGatewayAccepted: boolean
    requestedToolPresentInCallableScope: boolean
    requestedCapabilityPresentInCallableScope: boolean
    approvedPlanSnapshotAccepted: boolean
    creditReservationAccepted: boolean
    privateArtifactManifestAccepted: boolean
    gatewayControlsAccepted: boolean
    all21ToolsCovered: boolean
    all12CapabilitiesCovered: boolean
    all8GpuToolsTargetGpuRuntime: boolean
    externalBetaCallableRequestAdmissionReadyWithProvidedEvidence: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    externalBetaCallableNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerLeaseCreationApprovedNow: false
    workerDispatchApprovedNow: false
    productionWorkerDispatchApprovedNow: false
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
    backendQueueSubmissionPerformed: false
    serviceRoleQueueSmokePerformed: false
    serviceRoleTransactionPerformed: false
    supabaseMutationPerformed: false
    liveQueueWritePerformed: false
    workerLeaseCreated: false
    workerDispatchPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const allowedAdmissionActions = [
  'read accepted external-beta callable scope metadata for all 21 tools',
  'read accepted request-level external-beta tool-call gateway metadata',
  'verify approved plan snapshot and credit reservation evidence through the gateway candidate',
  'verify requested tool and capability are present in the callable scope',
  'record one external-beta callable request-admission candidate with provided evidence',
  'preserve GPU startup as on-demand only for a future accepted worker/tool job',
]

const blockedRuntimeActions = [
  'agent/tool execution',
  'Tool Route execution',
  'live queue write',
  'Worker queue enqueue',
  'Worker execution',
  'production worker dispatch',
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

const nextMilestones = [
  'Bind this request-admission candidate to the real external-beta API route handler after approved snapshot and credit reservation services are live.',
  'Run private non-production end-to-end queue insertion, worker claim, and worker dispatch proof from the request-admission candidate.',
  'Keep GPU workers cold until an accepted GPU/model job is claimed, then release GPU resources after completion.',
  'Require separate external-beta and production launch approvals before user traffic or production execution.',
]

function hasValue(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function callableScopeAccepted(packet?: AiGraphicsExternalBetaCallableScope): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_SCOPE_DECISION &&
    packet.status === 'external_beta_callable_scope_candidate_recorded_runtime_still_blocked' &&
    packet.externalBetaCallableCandidateToolsWithProvidedEvidence === 21 &&
    packet.externalBetaCallableCandidateCapabilitiesWithProvidedEvidence === 12 &&
    packet.externalBetaCallableNowTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.booleans.sourceExternalBetaLaunchGoNoGoAccepted === true &&
    packet.booleans.sourceExternalBetaLiveEnqueueAuthorizationAccepted === true &&
    packet.booleans.sourceExternalBetaWorkerDispatchSmokeProofAccepted === true &&
    packet.booleans.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
    packet.booleans.all21ToolsCovered === true &&
    packet.booleans.all12CapabilitiesCovered === true &&
    packet.booleans.all8GpuToolsTargetGpuRuntime === true &&
    packet.booleans.all21ExternalBetaCallableCandidatesWithProvidedEvidence === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.noIdleGpuRuntimeApproved === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function gatewayAccepted(packet?: AiGraphicsExternalBetaToolCallGateway): boolean {
  const candidate = packet?.externalBetaWorkerEnqueueCandidate
  return Boolean(packet) &&
    packet?.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_GATEWAY_DECISION &&
    packet.decision === 'external_beta_worker_enqueue_candidate_ready' &&
    packet.sourceExternalBetaRuntimeAdmissionAccepted === true &&
    packet.sourceExternalBetaRuntimeAdmissionProofBridgeAccepted === true &&
    packet.externalBetaGatewayControlsSatisfied === true &&
    packet.externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence === true &&
    Boolean(candidate) &&
    hasValue(candidate?.approvedPlanSnapshotId) &&
    hasValue(candidate?.creditReservationId) &&
    hasValue(candidate?.privateArtifactManifestRef) &&
    hasValue(candidate?.candidateRef) &&
    hasValue(candidate?.requestId) &&
    hasValue(candidate?.workspaceId) &&
    hasValue(candidate?.traceId) &&
    hasValue(candidate?.idempotencyKey) &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.externalBetaGatewayControlsSatisfied === true &&
    packet.booleans.externalBetaWorkerEnqueueCandidateReadyWithProvidedEvidence === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.noIdleGpuRuntimeApproved === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerQueueApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function requestedToolFromGateway(
  packet?: AiGraphicsExternalBetaToolCallGateway,
): AiGraphicsCanonicalToolId | string | null {
  return packet?.externalBetaWorkerEnqueueCandidate?.toolId ??
    packet?.requestedToolId ??
    null
}

function callableScopeTool(input: {
  scope?: AiGraphicsExternalBetaCallableScope
  gateway?: AiGraphicsExternalBetaToolCallGateway
}): AiGraphicsExternalBetaCallableToolScope | null {
  const requestedToolId = requestedToolFromGateway(input.gateway)
  if (!requestedToolId) return null
  return input.scope?.callableScopes.find((scope) => (
    scope.toolId === requestedToolId &&
    scope.externalBetaCallableCandidateWithProvidedEvidence === true
  )) ?? null
}

function statusFromInput(input: {
  hasScope: boolean
  scopeAccepted: boolean
  hasGateway: boolean
  gatewayAccepted: boolean
  requestedToolPresentInCallableScope: boolean
}): AiGraphicsExternalBetaCallableRequestAdmissionStatus {
  if (!input.hasScope) return 'missing_external_beta_callable_scope'
  if (!input.scopeAccepted) return 'external_beta_callable_scope_rejected'
  if (!input.hasGateway) return 'missing_external_beta_tool_call_gateway'
  if (!input.gatewayAccepted) return 'external_beta_tool_call_gateway_rejected'
  if (!input.requestedToolPresentInCallableScope) return 'requested_tool_not_in_callable_scope'
  return 'external_beta_callable_request_admission_ready_runtime_still_blocked'
}

function buildRequestCandidate(input: {
  ready: boolean
  gateway?: AiGraphicsExternalBetaToolCallGateway
  scopeTool: AiGraphicsExternalBetaCallableToolScope | null
}): AiGraphicsExternalBetaCallableRequestCandidate | null {
  const candidate = input.gateway?.externalBetaWorkerEnqueueCandidate
  if (!input.ready || !candidate || !input.scopeTool) return null
  return {
    toolId: input.scopeTool.toolId,
    capabilityId: input.gateway?.capabilityId ?? candidate.capabilityId,
    productionToolId: candidate.productionToolId,
    workerType: candidate.workerType,
    runtimeTarget: candidate.runtimeTarget,
    approvedPlanSnapshotId: candidate.approvedPlanSnapshotId,
    creditReservationId: candidate.creditReservationId,
    privateArtifactManifestRef: candidate.privateArtifactManifestRef,
    gatewayCandidateRef: candidate.candidateRef,
    requestId: candidate.requestId,
    workspaceId: candidate.workspaceId,
    traceId: candidate.traceId,
    idempotencyKey: candidate.idempotencyKey,
    gpuRequiredForRuntime: candidate.gpuRequiredForRuntime,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      candidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    workerQueueApprovedNow: false,
    workerEnqueuePerformed: false,
    toolExecutionPerformed: false,
  }
}

export function buildAiGraphicsExternalBetaCallableRequestAdmission(
  input: AiGraphicsExternalBetaCallableRequestAdmissionInput = {},
): AiGraphicsExternalBetaCallableRequestAdmission {
  const scope = input.sourceExternalBetaCallableScopePacket ?? null
  const gateway = input.sourceExternalBetaToolCallGatewayPacket ?? null
  const requestedToolId = requestedToolFromGateway(gateway ?? undefined)
  const scopeAccepted = callableScopeAccepted(input.sourceExternalBetaCallableScopePacket)
  const gatewayReady = gatewayAccepted(input.sourceExternalBetaToolCallGatewayPacket)
  const scopeTool = callableScopeTool({
    scope: input.sourceExternalBetaCallableScopePacket,
    gateway: input.sourceExternalBetaToolCallGatewayPacket,
  })
  const requestedToolPresentInCallableScope = Boolean(scopeTool)
  const requestedCapabilityPresentInCallableScope = Boolean(
    scopeTool?.capabilityIds.includes(gateway?.capabilityId as AiGraphicsCapabilityId),
  )
  const ready =
    scopeAccepted &&
    gatewayReady &&
    requestedToolPresentInCallableScope &&
    requestedCapabilityPresentInCallableScope
  const candidate = buildRequestCandidate({
    ready,
    gateway: input.sourceExternalBetaToolCallGatewayPacket,
    scopeTool,
  })
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    ready &&
    candidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION,
    sourceExternalBetaCallableScopeDecision: scope?.decision ?? null,
    sourceExternalBetaToolCallGatewayDecision: gateway?.sourceDecision ?? null,
    status: statusFromInput({
      hasScope: Boolean(scope),
      scopeAccepted,
      hasGateway: Boolean(gateway),
      gatewayAccepted: gatewayReady,
      requestedToolPresentInCallableScope:
        requestedToolPresentInCallableScope &&
        requestedCapabilityPresentInCallableScope,
    }),
    requestedToolId,
    capabilityId: gateway?.capabilityId ?? null,
    sourceCallableScopeAccepted: scopeAccepted,
    sourceToolCallGatewayAccepted: gatewayReady,
    requestedToolPresentInCallableScope,
    requestedCapabilityPresentInCallableScope,
    externalBetaCallableRequestAdmissionReadyWithProvidedEvidence: ready,
    externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence: ready ? 1 : 0,
    externalBetaCallableCandidateToolsWithProvidedEvidence:
      scope?.externalBetaCallableCandidateToolsWithProvidedEvidence ?? 0,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeTargetedTools: scope?.gpuRuntimeTargetedTools ?? 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    sourceExternalBetaCallableScope: scope,
    sourceExternalBetaToolCallGateway: gateway,
    sourceCallableScopeTool: scopeTool,
    callableRequestCandidate: candidate,
    allowedAdmissionActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaCallableRequestAdmissionPrepared: true,
      sourceExternalBetaCallableScopeAccepted: scopeAccepted,
      sourceExternalBetaToolCallGatewayAccepted: gatewayReady,
      requestedToolPresentInCallableScope,
      requestedCapabilityPresentInCallableScope,
      approvedPlanSnapshotAccepted: ready && hasValue(candidate?.approvedPlanSnapshotId),
      creditReservationAccepted: ready && hasValue(candidate?.creditReservationId),
      privateArtifactManifestAccepted: ready && hasValue(candidate?.privateArtifactManifestRef),
      gatewayControlsAccepted: ready,
      all21ToolsCovered: scope?.booleans.all21ToolsCovered === true,
      all12CapabilitiesCovered: scope?.booleans.all12CapabilitiesCovered === true,
      all8GpuToolsTargetGpuRuntime: scope?.booleans.all8GpuToolsTargetGpuRuntime === true,
      externalBetaCallableRequestAdmissionReadyWithProvidedEvidence: ready,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
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
      backendQueueSubmissionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      liveQueueWritePerformed: false,
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
