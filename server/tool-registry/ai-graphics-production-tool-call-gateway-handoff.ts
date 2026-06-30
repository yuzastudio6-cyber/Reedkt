import {
  AI_GRAPHICS_PRODUCTION_TRAFFIC_CUTOVER_DECISION,
  acceptedAiGraphicsProductionTrafficCutover,
  type AiGraphicsProductionTrafficCutover,
} from './ai-graphics-production-traffic-cutover'
import {
  AI_GRAPHICS_TOOL_CALL_HANDOFF_DECISION,
  listAiGraphicsToolCallHandoffTools,
  selectAiGraphicsToolCallHandoffForCapability,
  type AiGraphicsToolCallHandoffTool,
} from './ai-graphics-tool-call-handoff'
import type { AiGraphicsCapabilityId, AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'
import type { ProductionToolId } from './production-tool-types'
import {
  buildWorkerIdempotencyKey,
  type ProductionWorkerJobPayload,
  type ProductionWorkerRuntimeType,
} from '../workers/production'

export const AI_GRAPHICS_PRODUCTION_TOOL_CALL_GATEWAY_HANDOFF_DECISION =
  'ai_graphics_production_tool_call_gateway_handoff_ready_with_runtime_blocks'

export type AiGraphicsProductionToolCallGatewayHandoffStatus =
  | 'planning_metadata_selected'
  | 'missing_production_traffic_cutover'
  | 'production_traffic_cutover_rejected'
  | 'invalid_capability_blocked'
  | 'requested_tool_eliminated'
  | 'missing_production_tool_call_gateway_controls'
  | 'production_tool_call_gateway_handoff_ready'

export interface AiGraphicsProductionToolCallGatewayHandoffInput {
  sourceProductionTrafficCutoverPacket?: AiGraphicsProductionTrafficCutover
  capabilityId?: string
  requestedToolId?: string
  executionRequested?: boolean
  productionWorkspaceId?: string
  productionProjectId?: string
  productionRequestId?: string
  productionEditPlanId?: string
  productionToolExecutionPlanId?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  productionRoutePath?: string
  productionQueueName?: string
  productionGatewayHandoffRef?: string
  productionWorkerHandoffCandidateRef?: string
  productionToolRouteApprovalRef?: string
  productionWorkerApprovalRef?: string
  productionRuntimeAdmissionRef?: string
  productionServiceRoleBoundaryRef?: string
  productionPrivateArtifactManifestRef?: string
  productionAssetManifestRef?: string
  productionDependencyGraphRef?: string
  productionCostGuardrailDecisionRef?: string
  productionQaPolicyRef?: string
  productionFallbackPolicyRef?: string
  productionCheckbackPolicyRef?: string
  productionTraceId?: string
}

export interface AiGraphicsProductionToolCallGatewayWorkerCandidate {
  candidateRef: string
  requestId: string
  workspaceId: string
  projectId: string
  routePath: string
  queueName: string
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  capabilityId: AiGraphicsCapabilityId
  runtimeTarget: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  assetManifestRef: string
  dependencyGraphRef: string
  toolRouteApprovalRef: string
  workerApprovalRef: string
  runtimeAdmissionRef: string
  serviceRoleBoundaryRef: string
  costGuardrailDecisionRef: string
  qaPolicyRef: string
  fallbackPolicyRef: string
  checkbackPolicyRef: string
  gpuRequiredForRuntime: boolean
  gpuRuntimeStartAllowedForAcceptedProductionJob: boolean
  gpuRuntimeShouldStartNow: false
  traceId: string
  productionWorkerJobPayload: ProductionWorkerJobPayload
  productionWorkerJobPayloadShapeValid: boolean
  routeHandoffPreparedWithProvidedEvidence: boolean
  workerHandoffPreparedWithProvidedEvidence: boolean
  workerQueueApprovedNow: false
  workerEnqueuePerformed: false
  workerDispatchPerformed: false
  toolExecutionPerformed: false
}

export interface AiGraphicsProductionToolCallGatewayHandoff {
  decision: typeof AI_GRAPHICS_PRODUCTION_TOOL_CALL_GATEWAY_HANDOFF_DECISION
  sourceProductionTrafficCutoverDecision:
    | typeof AI_GRAPHICS_PRODUCTION_TRAFFIC_CUTOVER_DECISION
    | null
  sourceToolCallHandoffDecision: typeof AI_GRAPHICS_TOOL_CALL_HANDOFF_DECISION
  status: AiGraphicsProductionToolCallGatewayHandoffStatus
  capabilityId: string
  requestedToolId: string | null
  executionRequested: boolean
  sourceProductionTrafficCutoverAccepted: boolean
  selectedTool: AiGraphicsToolCallHandoffTool | null
  missingGatewayControls: string[]
  rejectionReasons: string[]
  productionToolCallGatewayControlsAccepted: boolean
  productionToolCallGatewayHandoffReadyWithProvidedEvidence: boolean
  productionWorkerCandidate: AiGraphicsProductionToolCallGatewayWorkerCandidate | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  productionControlledToolCallReadyNowTools: 0 | 21
  runtimeReadyForOnDemandProductionToolCallTools: 0 | 21
  productionReadyNowTools: 0 | 21
  gpuRuntimeShouldStartNow: false
  policy: {
    sideEffectFreeGatewayCheck: true
    approvedPlanSnapshotRequired: true
    creditReservationRequired: true
    privateArtifactManifestRequired: true
    assetManifestAndDependencyGraphRequired: true
    idempotentWorkerPayloadRequired: true
    checkbackQaAndFallbackRequired: true
    routeHandoffCandidateOnly: true
    workerHandoffCandidateOnly: true
    directAgentExecutionStillBlocked: true
    queueSubmissionPerformedByThisGate: false
    workerDispatchPerformedByThisGate: false
    toolExecutionPerformedByThisGate: false
    runtimeStartsOnlyForAcceptedProductionWorkerJob: true
    gpuRuntimeApprovedForAcceptedProductionJobs: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    privateArtifactsOnly: true
    noPublicArtifactsByGate: true
    noSignedUrlsByGate: true
  }
  booleans: {
    productionToolCallGatewayHandoffPrepared: true
    sourceProductionTrafficCutoverAccepted: boolean
    productionToolCallGatewayControlsAccepted: boolean
    productionToolCallGatewayHandoffReadyWithProvidedEvidence: boolean
    routeHandoffPreparedWithProvidedEvidence: boolean
    workerHandoffPreparedWithProvidedEvidence: boolean
    productionWorkerJobPayloadPrepared: boolean
    productionWorkerJobPayloadShapeValid: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    approvedPlanSnapshotAccepted: boolean
    creditReservationAccepted: boolean
    privateArtifactManifestAccepted: boolean
    assetManifestAccepted: boolean
    dependencyGraphAccepted: boolean
    idempotencyKeyAccepted: boolean
    qaPolicyAccepted: boolean
    fallbackPolicyAccepted: boolean
    checkbackPolicyAccepted: boolean
    productionControlledToolCallReadyNow: boolean
    runtimeReadyForOnDemandProductionToolCall: boolean
    productionRouteReadyNow: boolean
    productionWorkerPathReadyNow: boolean
    productionPrivateArtifactStoreReadyNow: boolean
    gpuRuntimeApprovedForAcceptedProductionJobs: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    routeExecutionApprovedNow: false
    routeHandoffApprovedNow: boolean
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    workerHandoffApprovedNow: boolean
    productionWorkerDispatchApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: boolean
    internalBetaReadyNow: false
    externalBetaReadyNow: true
    productionReadyNow: boolean
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    workerDispatchPerformed: false
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

const requiredPrivateRefFields = [
  'productionGatewayHandoffRef',
  'productionWorkerHandoffCandidateRef',
  'productionToolRouteApprovalRef',
  'productionWorkerApprovalRef',
  'productionRuntimeAdmissionRef',
  'productionServiceRoleBoundaryRef',
  'productionPrivateArtifactManifestRef',
  'productionAssetManifestRef',
  'productionDependencyGraphRef',
  'productionCostGuardrailDecisionRef',
  'productionQaPolicyRef',
  'productionFallbackPolicyRef',
  'productionCheckbackPolicyRef',
] as const

const policyBase = {
  sideEffectFreeGatewayCheck: true,
  approvedPlanSnapshotRequired: true,
  creditReservationRequired: true,
  privateArtifactManifestRequired: true,
  assetManifestAndDependencyGraphRequired: true,
  idempotentWorkerPayloadRequired: true,
  checkbackQaAndFallbackRequired: true,
  routeHandoffCandidateOnly: true,
  workerHandoffCandidateOnly: true,
  directAgentExecutionStillBlocked: true,
  queueSubmissionPerformedByThisGate: false,
  workerDispatchPerformedByThisGate: false,
  toolExecutionPerformedByThisGate: false,
  runtimeStartsOnlyForAcceptedProductionWorkerJob: true,
  gpuRuntimeOnDemandOnly: true,
  noIdleGpuRuntimeApproved: true,
  privateArtifactsOnly: true,
  noPublicArtifactsByGate: true,
  noSignedUrlsByGate: true,
} as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function trim(value: string | undefined): string {
  return value?.trim() ?? ''
}

function isPrivateEvidenceRef(value: string | undefined): boolean {
  if (!hasValue(value)) return false
  const normalized = value.trim().toLowerCase()
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('gs://') ||
    normalized.startsWith('s3://') ||
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('production-evidence://')
}

function asWorkerType(value: string): ProductionWorkerRuntimeType {
  if (
    value === 'cpu_analysis_worker' ||
    value === 'gpu_ai_worker' ||
    value === 'render_worker' ||
    value === 'qa_worker' ||
    value === 'tool_readiness_worker'
  ) {
    return value
  }
  throw new Error(`Unsupported production AI graphics worker type: ${value}`)
}

function missingGatewayControls(input: AiGraphicsProductionToolCallGatewayHandoffInput): string[] {
  return [
    !hasValue(input.productionWorkspaceId) ? 'production workspace id is missing' : undefined,
    !hasValue(input.productionProjectId) ? 'production project id is missing' : undefined,
    !hasValue(input.productionRequestId) ? 'production request id is missing' : undefined,
    !hasValue(input.productionToolExecutionPlanId)
      ? 'production tool execution plan id is missing'
      : undefined,
    !hasValue(input.approvedPlanSnapshotId)
      ? 'approved plan snapshot id is missing'
      : undefined,
    !hasValue(input.creditReservationId) ? 'credit reservation id is missing' : undefined,
    !hasValue(input.productionTraceId) ? 'production trace id is missing' : undefined,
    !hasValue(input.productionRoutePath) ? 'production route path is missing' : undefined,
    !hasValue(input.productionQueueName) ? 'production queue name is missing' : undefined,
    ...requiredPrivateRefFields
      .filter((field) => !isPrivateEvidenceRef(input[field]))
      .map((field) => `${field}: private/backend production evidence ref is required`),
  ].filter((entry): entry is string => Boolean(entry))
}

function selectRequestedTool(input: {
  capabilityId: string
  requestedToolId?: string
}): {
  selectedTool: AiGraphicsToolCallHandoffTool | null
  invalidCapability: boolean
  requestedToolEliminated: boolean
} {
  const capability = selectAiGraphicsToolCallHandoffForCapability(input.capabilityId)
  if (!capability) {
    return {
      selectedTool: null,
      invalidCapability: true,
      requestedToolEliminated: false,
    }
  }
  if (!hasValue(input.requestedToolId)) {
    return {
      selectedTool: null,
      invalidCapability: false,
      requestedToolEliminated: true,
    }
  }
  const requestedTool = listAiGraphicsToolCallHandoffTools().find(
    (tool) => tool.toolId === input.requestedToolId,
  )
  const requestedToolInCapability =
    requestedTool &&
    capability.selectedPlanningTools.some((tool) => tool.toolId === requestedTool.toolId)
  return {
    selectedTool: requestedToolInCapability ? requestedTool : null,
    invalidCapability: false,
    requestedToolEliminated: !requestedToolInCapability,
  }
}

function recipeIdForTool(tool: AiGraphicsToolCallHandoffTool): string {
  if (tool.runtimeTarget === 'node_cpu_static') return 'ai_graphics_production_cpu_static_tool_call'
  if (tool.workerType === 'gpu_ai_worker') return 'ai_graphics_production_gpu_model_tool_call'
  if (tool.workerType === 'render_worker') return 'ai_graphics_production_browser_graphics_tool_call'
  if (tool.workerType === 'cpu_analysis_worker') return 'ai_graphics_production_cpu_static_tool_call'
  return 'ai_graphics_production_metadata_tool_call'
}

function buildWorkerPayload(input: {
  source: AiGraphicsProductionToolCallGatewayHandoffInput
  tool: AiGraphicsToolCallHandoffTool
  capabilityId: string
}): ProductionWorkerJobPayload {
  const payloadWithoutIdempotency: ProductionWorkerJobPayload = {
    jobId: `production-ai-graphics-${trim(input.source.productionRequestId)}-${input.tool.toolId}`,
    workspaceId: trim(input.source.productionWorkspaceId),
    projectId: trim(input.source.productionProjectId),
    approvedSnapshotId: trim(input.source.approvedPlanSnapshotId),
    editPlanId: trim(input.source.productionEditPlanId) || undefined,
    toolExecutionPlanId: trim(input.source.productionToolExecutionPlanId),
    workerType: asWorkerType(input.tool.workerType),
    executionMode: 'production_blocked',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: [input.tool.productionToolId],
    requestedRecipeIds: [recipeIdForTool(input.tool)],
    storageReferenceIds: [trim(input.source.productionPrivateArtifactManifestRef)],
    creditReservationId: trim(input.source.creditReservationId),
    requiredQualityGateTypes: ['render_asset_integrity'],
    createdAt: '2026-06-29T00:00:00.000Z',
    metadata: {
      aiGraphicsCanonicalToolId: input.tool.toolId,
      aiGraphicsCapabilityId: input.capabilityId,
      aiGraphicsCapabilityIds: [input.capabilityId],
      aiGraphicsRuntimeTarget: input.tool.runtimeTarget,
      aiGraphicsRuntimeActivationPolicy: {
        onDemandOnly: true,
        noIdleGpuRuntimeApproved: true,
        startsOnlyForApprovedWorkerOrToolCall: true,
        cpuFallbackAllowedForHeavyTools: false,
      },
      sourceProductionTrafficCutoverDecision:
        AI_GRAPHICS_PRODUCTION_TRAFFIC_CUTOVER_DECISION,
      sourceToolCallHandoffDecision: AI_GRAPHICS_TOOL_CALL_HANDOFF_DECISION,
      productionGatewayHandoffRef: input.source.productionGatewayHandoffRef,
      productionWorkerHandoffCandidateRef:
        input.source.productionWorkerHandoffCandidateRef,
      productionRoutePath: input.source.productionRoutePath,
      productionQueueName: input.source.productionQueueName,
      productionToolRouteApprovalRef: input.source.productionToolRouteApprovalRef,
      productionWorkerApprovalRef: input.source.productionWorkerApprovalRef,
      productionRuntimeAdmissionRef: input.source.productionRuntimeAdmissionRef,
      productionServiceRoleBoundaryRef: input.source.productionServiceRoleBoundaryRef,
      productionAssetManifestRef: input.source.productionAssetManifestRef,
      productionDependencyGraphRef: input.source.productionDependencyGraphRef,
      productionCostGuardrailDecisionRef:
        input.source.productionCostGuardrailDecisionRef,
      productionQaPolicyRef: input.source.productionQaPolicyRef,
      productionFallbackPolicyRef: input.source.productionFallbackPolicyRef,
      productionCheckbackPolicyRef: input.source.productionCheckbackPolicyRef,
      productionTraceId: input.source.productionTraceId,
      approvedPlanSnapshotRequired: true,
      assetManifestRequired: true,
      dependencyGraphRequired: true,
      checkbackPolicyRequired: true,
      gpuRequiredForRuntime: input.tool.gpuRequiredForRuntime,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      startsOnlyForApprovedProductionWorkerJob: true,
      cpuFallbackAllowedForHeavyTools: false,
      gpuRuntimeStartAllowedForAcceptedProductionJob: true,
      gpuRuntimeShouldStartNow: false,
      routeExecutionPerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      agentCanExecuteToolsNow: false,
    },
  }
  return {
    ...payloadWithoutIdempotency,
    idempotencyKey: buildWorkerIdempotencyKey(payloadWithoutIdempotency),
  }
}

function payloadShapeValid(
  payload: ProductionWorkerJobPayload,
  tool: AiGraphicsToolCallHandoffTool,
  input: AiGraphicsProductionToolCallGatewayHandoffInput,
): boolean {
  return Boolean(
    payload.jobId &&
      payload.workspaceId === trim(input.productionWorkspaceId) &&
      payload.projectId === trim(input.productionProjectId) &&
      payload.approvedSnapshotId === trim(input.approvedPlanSnapshotId) &&
      payload.toolExecutionPlanId === trim(input.productionToolExecutionPlanId) &&
      payload.workerType === asWorkerType(tool.workerType) &&
      payload.executionMode === 'production_blocked' &&
      payload.idempotencyKey.startsWith('prod-worker:') &&
      payload.requestedToolIds.length === 1 &&
      payload.requestedToolIds[0] === tool.productionToolId &&
      payload.storageReferenceIds.length === 1 &&
      payload.storageReferenceIds[0] === trim(input.productionPrivateArtifactManifestRef) &&
      payload.creditReservationId === trim(input.creditReservationId) &&
      payload.metadata?.aiGraphicsCanonicalToolId === tool.toolId &&
      payload.metadata?.gpuRuntimeShouldStartNow === false &&
      payload.metadata?.routeExecutionPerformed === false &&
      payload.metadata?.workerEnqueuePerformed === false &&
      payload.metadata?.workerDispatchPerformed === false &&
      payload.metadata?.toolExecutionPerformed === false,
  )
}

function buildWorkerCandidate(input: {
  source: AiGraphicsProductionToolCallGatewayHandoffInput
  tool: AiGraphicsToolCallHandoffTool
  capabilityId: string
  ready: boolean
}): AiGraphicsProductionToolCallGatewayWorkerCandidate | null {
  if (!input.ready) return null
  const payload = buildWorkerPayload({
    source: input.source,
    tool: input.tool,
    capabilityId: input.capabilityId,
  })
  const shapeValid = payloadShapeValid(payload, input.tool, input.source)
  return {
    candidateRef: trim(input.source.productionWorkerHandoffCandidateRef),
    requestId: trim(input.source.productionRequestId),
    workspaceId: trim(input.source.productionWorkspaceId),
    projectId: trim(input.source.productionProjectId),
    routePath: trim(input.source.productionRoutePath),
    queueName: trim(input.source.productionQueueName),
    toolId: input.tool.toolId,
    productionToolId: input.tool.productionToolId,
    workerType: asWorkerType(input.tool.workerType),
    capabilityId: input.capabilityId as AiGraphicsCapabilityId,
    runtimeTarget: input.tool.runtimeTarget,
    approvedPlanSnapshotId: trim(input.source.approvedPlanSnapshotId),
    creditReservationId: trim(input.source.creditReservationId),
    privateArtifactManifestRef: trim(input.source.productionPrivateArtifactManifestRef),
    assetManifestRef: trim(input.source.productionAssetManifestRef),
    dependencyGraphRef: trim(input.source.productionDependencyGraphRef),
    toolRouteApprovalRef: trim(input.source.productionToolRouteApprovalRef),
    workerApprovalRef: trim(input.source.productionWorkerApprovalRef),
    runtimeAdmissionRef: trim(input.source.productionRuntimeAdmissionRef),
    serviceRoleBoundaryRef: trim(input.source.productionServiceRoleBoundaryRef),
    costGuardrailDecisionRef: trim(input.source.productionCostGuardrailDecisionRef),
    qaPolicyRef: trim(input.source.productionQaPolicyRef),
    fallbackPolicyRef: trim(input.source.productionFallbackPolicyRef),
    checkbackPolicyRef: trim(input.source.productionCheckbackPolicyRef),
    gpuRequiredForRuntime: input.tool.gpuRequiredForRuntime,
    gpuRuntimeStartAllowedForAcceptedProductionJob: true,
    gpuRuntimeShouldStartNow: false,
    traceId: trim(input.source.productionTraceId),
    productionWorkerJobPayload: payload,
    productionWorkerJobPayloadShapeValid: shapeValid,
    routeHandoffPreparedWithProvidedEvidence: shapeValid,
    workerHandoffPreparedWithProvidedEvidence: shapeValid,
    workerQueueApprovedNow: false,
    workerEnqueuePerformed: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
  }
}

function statusFromInput(input: {
  hasSourceCutover: boolean
  sourceAccepted: boolean
  executionRequested: boolean
  invalidCapability: boolean
  requestedToolEliminated: boolean
  controlsAccepted: boolean
}): AiGraphicsProductionToolCallGatewayHandoffStatus {
  if (!input.executionRequested) return 'planning_metadata_selected'
  if (!input.hasSourceCutover) return 'missing_production_traffic_cutover'
  if (!input.sourceAccepted) return 'production_traffic_cutover_rejected'
  if (input.invalidCapability) return 'invalid_capability_blocked'
  if (input.requestedToolEliminated) return 'requested_tool_eliminated'
  return input.controlsAccepted
    ? 'production_tool_call_gateway_handoff_ready'
    : 'missing_production_tool_call_gateway_controls'
}

export function acceptedAiGraphicsProductionToolCallGatewayHandoff(
  packet: AiGraphicsProductionToolCallGatewayHandoff | undefined,
): packet is AiGraphicsProductionToolCallGatewayHandoff {
  return Boolean(
    packet &&
      packet.decision === AI_GRAPHICS_PRODUCTION_TOOL_CALL_GATEWAY_HANDOFF_DECISION &&
      packet.status === 'production_tool_call_gateway_handoff_ready' &&
      packet.sourceProductionTrafficCutoverAccepted === true &&
      packet.productionToolCallGatewayControlsAccepted === true &&
      packet.productionToolCallGatewayHandoffReadyWithProvidedEvidence === true &&
      packet.productionWorkerCandidate !== null &&
      packet.productionWorkerCandidate.productionWorkerJobPayloadShapeValid === true &&
      packet.totalAiGraphicsTools === 21 &&
      packet.totalProductFacingCapabilities === 12 &&
      packet.gpuRuntimeTargetedTools === 8 &&
      packet.productionControlledToolCallReadyNowTools === 21 &&
      packet.runtimeReadyForOnDemandProductionToolCallTools === 21 &&
      packet.productionReadyNowTools === 21 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.routeExecutionApprovedNow === false &&
      packet.booleans.workerExecutionApprovedNow === false &&
      packet.booleans.workerQueueApprovedNow === false &&
      packet.booleans.toolExecutionPerformed === false &&
      packet.booleans.workerEnqueuePerformed === false &&
      packet.booleans.workerDispatchPerformed === false &&
      packet.booleans.gpuRuntimeShouldStartNow === false,
  )
}

export function evaluateAiGraphicsProductionToolCallGatewayHandoff(
  input: AiGraphicsProductionToolCallGatewayHandoffInput = {},
): AiGraphicsProductionToolCallGatewayHandoff {
  const capabilityId = input.capabilityId ?? 'background_removal'
  const executionRequested = input.executionRequested === true
  const sourceAccepted =
    acceptedAiGraphicsProductionTrafficCutover(input.sourceProductionTrafficCutoverPacket)
  const selection = selectRequestedTool({
    capabilityId,
    requestedToolId: input.requestedToolId,
  })
  const missingControls =
    executionRequested && sourceAccepted && selection.selectedTool
      ? missingGatewayControls(input)
      : []
  const controlsAccepted =
    executionRequested &&
    sourceAccepted &&
    Boolean(selection.selectedTool) &&
    missingControls.length === 0
  const workerCandidate = selection.selectedTool
    ? buildWorkerCandidate({
        source: input,
        tool: selection.selectedTool,
        capabilityId,
        ready: controlsAccepted,
      })
    : null
  const payloadReady = workerCandidate?.productionWorkerJobPayloadShapeValid === true
  const accepted = controlsAccepted && payloadReady
  const rejectionReasons = [
    executionRequested && !input.sourceProductionTrafficCutoverPacket
      ? 'source production traffic cutover packet is missing'
      : undefined,
    executionRequested && input.sourceProductionTrafficCutoverPacket && !sourceAccepted
      ? 'source production traffic cutover packet is not accepted'
      : undefined,
    executionRequested && selection.invalidCapability
      ? 'capability is not product-facing or is not covered by the handoff contract'
      : undefined,
    executionRequested && selection.requestedToolEliminated
      ? 'requested tool is missing or eliminated for this capability'
      : undefined,
    ...missingControls,
    controlsAccepted && !payloadReady ? 'production worker job payload shape is invalid' : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_PRODUCTION_TOOL_CALL_GATEWAY_HANDOFF_DECISION,
    sourceProductionTrafficCutoverDecision:
      input.sourceProductionTrafficCutoverPacket?.decision ?? null,
    sourceToolCallHandoffDecision: AI_GRAPHICS_TOOL_CALL_HANDOFF_DECISION,
    status: statusFromInput({
      hasSourceCutover: Boolean(input.sourceProductionTrafficCutoverPacket),
      sourceAccepted,
      executionRequested,
      invalidCapability: selection.invalidCapability,
      requestedToolEliminated: selection.requestedToolEliminated,
      controlsAccepted: accepted,
    }),
    capabilityId,
    requestedToolId: input.requestedToolId ?? null,
    executionRequested,
    sourceProductionTrafficCutoverAccepted: sourceAccepted,
    selectedTool: selection.selectedTool,
    missingGatewayControls: missingControls,
    rejectionReasons,
    productionToolCallGatewayControlsAccepted: accepted,
    productionToolCallGatewayHandoffReadyWithProvidedEvidence: accepted,
    productionWorkerCandidate: workerCandidate,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionControlledToolCallReadyNowTools: accepted ? 21 : 0,
    runtimeReadyForOnDemandProductionToolCallTools: accepted ? 21 : 0,
    productionReadyNowTools: accepted ? 21 : 0,
    gpuRuntimeShouldStartNow: false,
    policy: {
      ...policyBase,
      gpuRuntimeApprovedForAcceptedProductionJobs: accepted,
    },
    booleans: {
      productionToolCallGatewayHandoffPrepared: true,
      sourceProductionTrafficCutoverAccepted: sourceAccepted,
      productionToolCallGatewayControlsAccepted: accepted,
      productionToolCallGatewayHandoffReadyWithProvidedEvidence: accepted,
      routeHandoffPreparedWithProvidedEvidence: accepted,
      workerHandoffPreparedWithProvidedEvidence: accepted,
      productionWorkerJobPayloadPrepared: Boolean(workerCandidate),
      productionWorkerJobPayloadShapeValid: payloadReady,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      approvedPlanSnapshotAccepted: accepted,
      creditReservationAccepted: accepted,
      privateArtifactManifestAccepted: accepted,
      assetManifestAccepted: accepted,
      dependencyGraphAccepted: accepted,
      idempotencyKeyAccepted: accepted,
      qaPolicyAccepted: accepted,
      fallbackPolicyAccepted: accepted,
      checkbackPolicyAccepted: accepted,
      productionControlledToolCallReadyNow: accepted,
      runtimeReadyForOnDemandProductionToolCall: accepted,
      productionRouteReadyNow: accepted,
      productionWorkerPathReadyNow: accepted,
      productionPrivateArtifactStoreReadyNow: accepted,
      gpuRuntimeApprovedForAcceptedProductionJobs: accepted,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      routeHandoffApprovedNow: accepted,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      workerHandoffApprovedNow: accepted,
      productionWorkerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: accepted,
      internalBetaReadyNow: false,
      externalBetaReadyNow: true,
      productionReadyNow: accepted,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
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
