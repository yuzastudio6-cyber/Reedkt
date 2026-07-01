import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
} from './ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'
import {
  buildWorkerIdempotencyKey,
  type ProductionWorkerJobPayload,
  type ProductionWorkerRuntimeType,
} from '../workers/production'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_ENQUEUE_ADMISSION_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission_prepared_with_runtime_blocks'

const adapterInvocationEnqueueAdmissionTools: AiGraphicsCanonicalToolId[] = [
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
]

const productFacingCapabilities = AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter(
  (capabilityId) =>
    capabilityId !== 'planning_metadata_only' &&
    capabilityId !== 'blocked_or_deferred',
)

const capabilityByTool: Record<string, string> = {
  d3: 'chart_overlay',
  vega_lite: 'data_visualization',
  vega: 'data_visualization',
  svgdotjs_svg_js: 'svg_graphics',
  viz_js: 'diagram_graphics',
}

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionStatus =
  | 'adapter_invocation_enqueue_admission_ready_execution_still_blocked'
  | 'adapter_invocation_enqueue_admission_blocked_pending_satori_font_fixture'
  | 'adapter_invocation_enqueue_admission_deferred_non_cpu_static_runtime_boundary'
  | 'adapter_invocation_enqueue_admission_blocked_missing_exact_execution_admission'

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueEvidence {
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  admissionMode: 'prepare_adapter_invocation_and_worker_enqueue_payload_without_calling_adapter_or_queue'
  sourceExactRequestEnvelopeRef: string
  sourceExactAdmissionDecisionRef: string
  sourceWorkerAcceptedRequestSchemaRef: string
  sourcePrivateOutputManifestRef: string
  sourceToolResultSchemaRef: string
  sourceToolSpecificQaGateRef: string
  approvedPlanSnapshotRef: string
  creditReservationRef: string
  privateArtifactManifestRef: string
  adapterInvocationEnvelopeRef: string
  adapterInvocationAuthorizationRef: string
  adapterInvocationIdempotencyKey: string
  workerEnqueuePayloadRef: string
  workerEnqueueAdmissionRef: string
  workerPayloadSchemaRef: string
  backendQueueAdapterRef: string
  serviceRoleBoundaryRef: string
  privateStoragePolicyRef: string
  retryPolicyRef: string
  deadLetterPolicyRef: string
  checkbackPolicyRef: string
  fallbackPolicyRef: string
  expectedOutputVisibility: 'private_artifact_only'
  productionWorkerJobPayload: ProductionWorkerJobPayload
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget | 'deferred'
  capabilityId: string | null
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME | null
  sourceExactExecutionAdmissionStatus: string | null
  sourceExactExecutionAdmissionAccepted: boolean
  adapterInvocationEnqueueAdmissionStatus:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionStatus
  adapterInvocationEnqueueAdmissionReady: boolean
  exactRequestEnvelopeAccepted: boolean
  adapterInvocationEnvelopePrepared: boolean
  adapterInvocationContractAccepted: boolean
  workerEnqueuePayloadPrepared: boolean
  workerEnqueueAdmissionContractAccepted: boolean
  productionWorkerJobPayloadAccepted: boolean
  backendQueueAdapterRefAccepted: boolean
  serviceRoleBoundaryAccepted: boolean
  workerPayloadSchemaAccepted: boolean
  privateStoragePolicyAccepted: boolean
  retryPolicyAccepted: boolean
  deadLetterPolicyAccepted: boolean
  checkbackPolicyAccepted: boolean
  fallbackPolicyAccepted: boolean
  idempotencyAccepted: boolean
  privateArtifactOnly: true
  publicArtifactAllowed: false
  signedUrlAllowed: false
  adapterInvocationEnqueueEvidence:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueEvidence | null
  sourceExactExecutionAdmissionRequired: true
  approvedPlanSnapshotRequired: true
  creditReservationRequired: true
  privateArtifactManifestRequired: true
  adapterInvocationProofRequired: true
  backendQueueTransportProofRequired: true
  liveQueueWriteProofRequired: true
  workerEnqueueProofRequired: true
  workerClaimLeaseRequired: true
  workerDispatchProofRequired: true
  toolSpecificQaGateRequired: true
  externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence: boolean
  externalAgentCanInvokeAdapterNow: false
  externalAgentCanSubmitPrivateWorkerQueueNow: false
  backendQueueSubmissionApprovedNow: false
  liveQueueWriteApprovedNow: false
  workerEnqueueApprovedNow: false
  workerClaimApprovedNow: false
  workerDispatchApprovedNow: false
  workerExecutionApprovedNow: false
  toolExecutionApprovedNow: false
  agentCanExecuteToolsNow: false
  routeExecutionApprovedNow: false
  providerRuntimeApprovedNow: false
  browserWebglCanvasRuntimeApprovedNow: false
  gpuRuntimeApprovedNow: false
  gpuRuntimeShouldStartNow: false
  runtimeReadyNow: false
  externalBetaReadyNow: false
  productionReadyNow: false
  blocker: string
  nextProofMilestone: string
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionReport {
  schemaVersion: '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission'
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_ENQUEUE_ADMISSION_DECISION
  status: 'external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission_prepared_five_with_runtime_blocks'
  sourceExactExecutionAdmissionDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  adapterInvocationEnqueueAdmissionPolicy: {
    mode: 'prepare_adapter_invocation_and_worker_enqueue_payloads_without_live_adapter_queue_or_tool_execution'
    sourceExactExecutionAdmissionRequired: true
    approvedPlanSnapshotRequired: true
    creditReservationRequired: true
    privateArtifactManifestRequired: true
    adapterInvocationEnvelopeRequired: true
    workerEnqueuePayloadRequired: true
    productionWorkerJobPayloadRequired: true
    backendQueueAdapterRefRequired: true
    serviceRoleBoundaryRequired: true
    workerPayloadSchemaRequired: true
    privateStoragePolicyRequired: true
    retryAndDeadLetterPolicyRequired: true
    noAdapterInvocationByAdmission: true
    noBackendQueueSubmissionByAdmission: true
    noLiveQueueWriteByAdmission: true
    noWorkerEnqueueByAdmission: true
    noWorkerDispatchByAdmission: true
    noToolExecutionByAdmission: true
    privateArtifactOnly: true
    gpuRuntimeOnDemandOnly: true
    nextGateRequiresLiveAdapterInvocationAndQueueWriteProof: true
  }
  counts: {
    totalAiGraphicsTools: 21
    adapterInvocationEnqueueAdmissionReadyTools: number
    sourceExactExecutionAdmissionAcceptedTools: number
    exactRequestEnvelopeAcceptedTools: number
    adapterInvocationEnvelopePreparedTools: number
    adapterInvocationContractAcceptedTools: number
    workerEnqueuePayloadPreparedTools: number
    workerEnqueueAdmissionContractAcceptedTools: number
    productionWorkerJobPayloadAcceptedTools: number
    backendQueueAdapterRefAcceptedTools: number
    serviceRoleBoundaryAcceptedTools: number
    workerPayloadSchemaAcceptedTools: number
    privateStoragePolicyAcceptedTools: number
    retryPolicyAcceptedTools: number
    deadLetterPolicyAcceptedTools: number
    checkbackPolicyAcceptedTools: number
    fallbackPolicyAcceptedTools: number
    idempotencyAcceptedTools: number
    satoriBlockedPendingApprovedFontFixtureTools: number
    nonCpuStaticDeferredTools: number
    externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidenceTools: number
    externalAgentCanInvokeAdapterNowTools: 0
    externalAgentCanSubmitPrivateWorkerQueueNowTools: 0
    backendQueueSubmissionApprovedNowTools: 0
    liveQueueWriteApprovedNowTools: 0
    workerEnqueueApprovedNowTools: 0
    workerClaimApprovedNowTools: 0
    workerDispatchApprovedNowTools: 0
    workerExecutionApprovedNowTools: 0
    toolExecutionApprovedNowTools: 0
    externalAgentExecutableNowTools: 0
    publicArtifactAllowedTools: 0
    signedUrlAllowedTools: 0
    gpuRuntimeShouldStartNowTools: 0
  }
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionRow[]
  booleans: {
    externalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionCompleted: true
    sourceExactExecutionAdmissionAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    allFiveAdapterInvocationEnqueueAdmissionsReady: boolean
    allFiveSourceExactAdmissionsAccepted: boolean
    allFiveAdapterInvocationEnvelopesPrepared: boolean
    allFiveWorkerEnqueuePayloadsPrepared: boolean
    allFiveProductionWorkerJobPayloadsAccepted: boolean
    allFiveBackendQueueAdapterRefsAccepted: boolean
    allFiveServiceRoleBoundariesAccepted: boolean
    allFiveWorkerPayloadSchemasAccepted: boolean
    allFivePrivateStoragePoliciesAccepted: boolean
    allFiveRetryPoliciesAccepted: boolean
    allFiveDeadLetterPoliciesAccepted: boolean
    allFiveCheckbackPoliciesAccepted: boolean
    allFiveFallbackPoliciesAccepted: boolean
    allFiveIdempotencyContractsAccepted: boolean
    satoriBlockedPendingApprovedFontFixture: boolean
    fifteenRuntimeDeferredToolsPreserved: boolean
    privateArtifactOnlyPolicyAccepted: true
    adapterInvocationEnqueueRefsPreserved: boolean
    noAdapterInvocationByAdmission: true
    noBackendQueueSubmissionByAdmission: true
    noLiveQueueWriteByAdmission: true
    noWorkerEnqueueByAdmission: true
    noWorkerDispatchByAdmission: true
    noToolExecutionByAdmission: true
    nextGateRequiresLiveAdapterInvocationAndQueueWriteProof: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    externalAgentCanInvokeAdapterNow: false
    externalAgentCanSubmitPrivateWorkerQueueNow: false
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerEnqueueApprovedNow: false
    workerClaimApprovedNow: false
    workerDispatchApprovedNow: false
    workerExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    adapterInvocationPerformed: false
    backendQueueSubmissionPerformed: false
    liveQueueWritePerformed: false
    workerEnqueuePerformed: false
    workerClaimPerformed: false
    workerDispatchPerformed: false
    toolExecutionPerformed: false
    routeExecutionPerformed: false
    workerExecutionPerformed: false
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
  nextMilestone: string
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionInput {
  sourceExactExecutionAdmissionReport?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport
}

function sourceRow(
  report: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow | undefined {
  return report?.rows?.find((row) => row.toolId === toolId)
}

function sourceExactAdmissionAccepted(
  report?: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport,
): boolean {
  const rows = report?.rows ?? []
  return report?.decision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION &&
    report.status ===
      'external_agent_cpu_static_private_worker_exact_execution_admission_prepared_five_with_runtime_blocks' &&
    report.counts.exactExecutionAdmissionReadyTools === 5 &&
    report.counts.externalAgentCanInvokeAdapterNowTools === 0 &&
    report.counts.workerEnqueueApprovedNowTools === 0 &&
    report.counts.toolExecutionApprovedNowTools === 0 &&
    report.counts.gpuRuntimeShouldStartNowTools === 0 &&
    report.booleans.allFiveExactExecutionAdmissionsReady === true &&
    report.booleans.noLiveQueueWriteByAdmission === true &&
    report.booleans.noAdapterInvocationByAdmission === true &&
    report.booleans.noToolExecutionByAdmission === true &&
    report.booleans.agentCanExecuteToolsNow === false &&
    report.booleans.gpuRuntimeShouldStartNow === false &&
    rows.length === 21 &&
    adapterInvocationEnqueueAdmissionTools.every((toolId) => {
      const row = rows.find((source) => source.toolId === toolId)
      return row?.exactExecutionAdmissionStatus ===
        'exact_external_agent_execution_admission_ready_for_private_worker_request_execution_still_blocked' &&
        row.exactExecutionAdmissionReady === true &&
        row.exactRequestEnvelopeAccepted === true &&
        row.approvedPlanSnapshotAccepted === true &&
        row.creditReservationAccepted === true &&
        row.privateArtifactManifestAccepted === true &&
        row.workerAcceptedRequestSchemaAccepted === true &&
        row.toolSpecificQaGateAccepted === true &&
        row.exactExecutionAdmissionEvidence?.queueName ===
          AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME &&
        row.exactExecutionAdmissionEvidence.expectedOutputVisibility ===
          'private_artifact_only' &&
        row.externalAgentCanInvokeAdapterNow === false &&
        row.workerEnqueueApprovedNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function asWorkerRuntimeType(workerType: ProductionRegistryWorkerType): ProductionWorkerRuntimeType {
  if (
    workerType === 'cpu_analysis_worker' ||
    workerType === 'gpu_ai_worker' ||
    workerType === 'render_worker' ||
    workerType === 'qa_worker' ||
    workerType === 'tool_readiness_worker'
  ) {
    return workerType
  }
  return 'tool_readiness_worker'
}

function recipeIdFor(toolId: AiGraphicsCanonicalToolId): string {
  if (toolId === 'd3') return 'ai_graphics_external_agent_cpu_static_d3_chart_overlay'
  if (toolId === 'vega_lite') return 'ai_graphics_external_agent_cpu_static_vega_lite_compile'
  if (toolId === 'vega') return 'ai_graphics_external_agent_cpu_static_vega_parse'
  if (toolId === 'svgdotjs_svg_js') {
    return 'ai_graphics_external_agent_cpu_static_svg_construction'
  }
  if (toolId === 'viz_js') return 'ai_graphics_external_agent_cpu_static_dot_diagram'
  return 'ai_graphics_external_agent_cpu_static_tool_call'
}

function buildPayload(input: {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget
  evidence: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueEvidence
}): ProductionWorkerJobPayload {
  const payloadWithoutIdempotency: ProductionWorkerJobPayload = {
    jobId: `external-agent-cpu-static-private-worker-${input.toolId}-adapter-enqueue-admission`,
    workspaceId: 'external-agent-ai-graphics-workspace',
    projectId: 'external-agent-ai-graphics-project',
    approvedSnapshotId: input.evidence.approvedPlanSnapshotRef,
    editPlanId: 'external-agent-ai-graphics-edit-plan',
    toolExecutionPlanId: `external-agent-cpu-static-private-worker-${input.toolId}`,
    workerType: asWorkerRuntimeType(input.workerType),
    executionMode: 'production_blocked',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: [input.productionToolId],
    requestedRecipeIds: [recipeIdFor(input.toolId)],
    storageReferenceIds: [input.evidence.privateArtifactManifestRef],
    creditReservationId: input.evidence.creditReservationRef,
    requiredQualityGateTypes: ['render_asset_integrity'],
    createdAt: '2026-07-01T00:00:00.000Z',
    metadata: {
      aiGraphicsCanonicalToolId: input.toolId,
      aiGraphicsCapabilityId: capabilityByTool[input.toolId] ?? null,
      aiGraphicsRuntimeTarget: input.runtimeTarget,
      sourceExactRequestEnvelopeRef: input.evidence.sourceExactRequestEnvelopeRef,
      sourceExactAdmissionDecisionRef: input.evidence.sourceExactAdmissionDecisionRef,
      adapterInvocationEnvelopeRef: input.evidence.adapterInvocationEnvelopeRef,
      workerEnqueuePayloadRef: input.evidence.workerEnqueuePayloadRef,
      backendQueueAdapterRef: input.evidence.backendQueueAdapterRef,
      serviceRoleBoundaryRef: input.evidence.serviceRoleBoundaryRef,
      privateArtifactOnly: true,
      adapterInvocationPerformed: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWritePerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      gpuRuntimeShouldStartNow: false,
      agentCanExecuteToolsNow: false,
    },
  }
  return {
    ...payloadWithoutIdempotency,
    idempotencyKey: buildWorkerIdempotencyKey(payloadWithoutIdempotency),
  }
}

function statusFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionStatus {
  if (adapterInvocationEnqueueAdmissionTools.includes(input.toolId)) {
    if (!input.sourceAccepted || input.source?.exactExecutionAdmissionEvidence == null) {
      return 'adapter_invocation_enqueue_admission_blocked_missing_exact_execution_admission'
    }
    return 'adapter_invocation_enqueue_admission_ready_execution_still_blocked'
  }
  if (input.toolId === 'satori') {
    return 'adapter_invocation_enqueue_admission_blocked_pending_satori_font_fixture'
  }
  return 'adapter_invocation_enqueue_admission_deferred_non_cpu_static_runtime_boundary'
}

function blockerFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionStatus,
): string {
  switch (status) {
    case 'adapter_invocation_enqueue_admission_ready_execution_still_blocked':
      return 'adapter invocation and worker enqueue contracts prepared; adapter calls, backend queue submission, live queue writes, worker enqueue, worker dispatch, and tool execution remain blocked until live proof'
    case 'adapter_invocation_enqueue_admission_blocked_pending_satori_font_fixture':
      return 'blocked pending approved Satori font fixture evidence bridge'
    case 'adapter_invocation_enqueue_admission_deferred_non_cpu_static_runtime_boundary':
      return 'deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes'
    case 'adapter_invocation_enqueue_admission_blocked_missing_exact_execution_admission':
      return 'missing accepted exact execution admission'
  }
}

function evidenceFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionStatus
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueEvidence | null {
  const sourceEvidence = input.source?.exactExecutionAdmissionEvidence
  if (
    input.status !==
      'adapter_invocation_enqueue_admission_ready_execution_still_blocked' ||
    !input.source ||
    !sourceEvidence
  ) {
    return null
  }
  const base =
    `ai-graphics/external-agent/cpu-static-private-worker-adapter-invocation-enqueue-admission/${input.toolId}`
  const evidenceWithoutPayload: Omit<
    AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueEvidence,
    'productionWorkerJobPayload'
  > = {
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    admissionMode:
      'prepare_adapter_invocation_and_worker_enqueue_payload_without_calling_adapter_or_queue',
    sourceExactRequestEnvelopeRef: sourceEvidence.externalAgentExactRequestEnvelopeRef,
    sourceExactAdmissionDecisionRef: sourceEvidence.externalAgentAdmissionDecisionRef,
    sourceWorkerAcceptedRequestSchemaRef: sourceEvidence.workerAcceptedRequestSchemaRef,
    sourcePrivateOutputManifestRef: sourceEvidence.privateOutputManifestRef,
    sourceToolResultSchemaRef: sourceEvidence.toolResultSchemaRef,
    sourceToolSpecificQaGateRef: sourceEvidence.toolSpecificQaGateRef,
    approvedPlanSnapshotRef: sourceEvidence.approvedPlanSnapshotRef,
    creditReservationRef: sourceEvidence.creditReservationRef,
    privateArtifactManifestRef: sourceEvidence.privateArtifactManifestRef,
    adapterInvocationEnvelopeRef: `adapter-invocation-envelope://${base}/adapter-request`,
    adapterInvocationAuthorizationRef: `adapter-invocation-authorization://${base}/authorization`,
    adapterInvocationIdempotencyKey: `adapter-invocation://${base}/idempotency`,
    workerEnqueuePayloadRef: `worker-enqueue-payload://${base}/payload`,
    workerEnqueueAdmissionRef: `worker-enqueue-admission://${base}/admission`,
    workerPayloadSchemaRef: `worker-payload-schema://${base}/schema`,
    backendQueueAdapterRef: `backend-queue-adapter://${base}/adapter`,
    serviceRoleBoundaryRef: `service-role-boundary://${base}/boundary`,
    privateStoragePolicyRef: `private-storage-policy://${base}/policy`,
    retryPolicyRef: `worker-retry-policy://${base}/retry`,
    deadLetterPolicyRef: `worker-dead-letter-policy://${base}/dead-letter`,
    checkbackPolicyRef: `worker-checkback-policy://${base}/checkback`,
    fallbackPolicyRef: `worker-fallback-policy://${base}/fallback`,
    expectedOutputVisibility: 'private_artifact_only',
  }
  const payload = buildPayload({
    toolId: input.toolId,
    productionToolId: input.source.productionToolId,
    workerType: input.source.workerType,
    runtimeTarget: input.source.runtimeTarget,
    evidence: evidenceWithoutPayload as AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueEvidence,
  })
  return {
    ...evidenceWithoutPayload,
    productionWorkerJobPayload: payload,
  }
}

function payloadAccepted(
  evidence: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueEvidence | null,
  row: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow | undefined,
): boolean {
  const payload = evidence?.productionWorkerJobPayload
  return Boolean(
    payload &&
      row &&
      payload.executionMode === 'production_blocked' &&
      payload.idempotencyKey.startsWith('prod-worker:') &&
      payload.requestedToolIds.length === 1 &&
      payload.requestedToolIds[0] === row.productionToolId &&
      payload.storageReferenceIds.length === 1 &&
      payload.storageReferenceIds[0] === evidence.privateArtifactManifestRef &&
      payload.metadata?.adapterInvocationPerformed === false &&
      payload.metadata?.workerEnqueuePerformed === false &&
      payload.metadata?.toolExecutionPerformed === false &&
      payload.metadata?.gpuRuntimeShouldStartNow === false,
  )
}

function buildRow(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionRow {
  const status = statusFor(input)
  const evidence = evidenceFor({ toolId: input.toolId, source: input.source, status })
  const ready = Boolean(evidence)
  const payloadIsAccepted = payloadAccepted(evidence, input.source)
  return {
    toolId: input.toolId,
    productionToolId: input.source?.productionToolId ?? (`ai_graphics_${input.toolId}` as ProductionToolId),
    workerType: input.source?.workerType ?? 'tool_readiness_worker',
    runtimeTarget: input.source?.runtimeTarget ?? 'deferred',
    capabilityId: capabilityByTool[input.toolId] ?? null,
    queueName: ready ? AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME : null,
    sourceExactExecutionAdmissionStatus:
      input.source?.exactExecutionAdmissionStatus ?? null,
    sourceExactExecutionAdmissionAccepted:
      input.source?.exactExecutionAdmissionReady === true &&
      input.source.exactExecutionAdmissionEvidence != null,
    adapterInvocationEnqueueAdmissionStatus: status,
    adapterInvocationEnqueueAdmissionReady: ready,
    exactRequestEnvelopeAccepted: ready,
    adapterInvocationEnvelopePrepared: ready,
    adapterInvocationContractAccepted: ready,
    workerEnqueuePayloadPrepared: ready,
    workerEnqueueAdmissionContractAccepted: ready,
    productionWorkerJobPayloadAccepted: payloadIsAccepted,
    backendQueueAdapterRefAccepted: ready,
    serviceRoleBoundaryAccepted: ready,
    workerPayloadSchemaAccepted: ready,
    privateStoragePolicyAccepted: ready,
    retryPolicyAccepted: ready,
    deadLetterPolicyAccepted: ready,
    checkbackPolicyAccepted: ready,
    fallbackPolicyAccepted: ready,
    idempotencyAccepted: payloadIsAccepted,
    privateArtifactOnly: true,
    publicArtifactAllowed: false,
    signedUrlAllowed: false,
    adapterInvocationEnqueueEvidence: evidence,
    sourceExactExecutionAdmissionRequired: true,
    approvedPlanSnapshotRequired: true,
    creditReservationRequired: true,
    privateArtifactManifestRequired: true,
    adapterInvocationProofRequired: true,
    backendQueueTransportProofRequired: true,
    liveQueueWriteProofRequired: true,
    workerEnqueueProofRequired: true,
    workerClaimLeaseRequired: true,
    workerDispatchProofRequired: true,
    toolSpecificQaGateRequired: true,
    externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence:
      ready && payloadIsAccepted,
    externalAgentCanInvokeAdapterNow: false,
    externalAgentCanSubmitPrivateWorkerQueueNow: false,
    backendQueueSubmissionApprovedNow: false,
    liveQueueWriteApprovedNow: false,
    workerEnqueueApprovedNow: false,
    workerClaimApprovedNow: false,
    workerDispatchApprovedNow: false,
    workerExecutionApprovedNow: false,
    toolExecutionApprovedNow: false,
    agentCanExecuteToolsNow: false,
    routeExecutionApprovedNow: false,
    providerRuntimeApprovedNow: false,
    browserWebglCanvasRuntimeApprovedNow: false,
    gpuRuntimeApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    blocker: blockerFor(status),
    nextProofMilestone: ready
      ? 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_AND_QUEUE_WRITE_PROOF'
      : input.toolId === 'satori'
        ? 'AI_GRAPHICS_SATORI_FONT_FIXTURE_EVIDENCE_BRIDGE'
        : 'AI_GRAPHICS_BROWSER_GPU_MODEL_RUNTIME_EXECUTION_ADMISSION',
  }
}

export function buildAiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmission(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionReport {
  const sourceAccepted = sourceExactAdmissionAccepted(input.sourceExactExecutionAdmissionReport)
  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) =>
    buildRow({
      toolId,
      source: sourceRow(input.sourceExactExecutionAdmissionReport, toolId),
      sourceAccepted,
    }),
  )
  const count = (
    predicate: (row: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionRow) => boolean,
  ) => rows.filter(predicate).length
  const readyTools = count((row) => row.adapterInvocationEnqueueAdmissionReady)
  const satoriBlockedPendingApprovedFontFixtureTools = count(
    (row) =>
      row.adapterInvocationEnqueueAdmissionStatus ===
      'adapter_invocation_enqueue_admission_blocked_pending_satori_font_fixture',
  )
  const nonCpuStaticDeferredTools = count(
    (row) =>
      row.adapterInvocationEnqueueAdmissionStatus ===
      'adapter_invocation_enqueue_admission_deferred_non_cpu_static_runtime_boundary',
  )
  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission',
    decision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_ENQUEUE_ADMISSION_DECISION,
    status:
      'external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission_prepared_five_with_runtime_blocks',
    sourceExactExecutionAdmissionDecision:
      input.sourceExactExecutionAdmissionReport?.decision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...productFacingCapabilities],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    adapterInvocationEnqueueAdmissionPolicy: {
      mode:
        'prepare_adapter_invocation_and_worker_enqueue_payloads_without_live_adapter_queue_or_tool_execution',
      sourceExactExecutionAdmissionRequired: true,
      approvedPlanSnapshotRequired: true,
      creditReservationRequired: true,
      privateArtifactManifestRequired: true,
      adapterInvocationEnvelopeRequired: true,
      workerEnqueuePayloadRequired: true,
      productionWorkerJobPayloadRequired: true,
      backendQueueAdapterRefRequired: true,
      serviceRoleBoundaryRequired: true,
      workerPayloadSchemaRequired: true,
      privateStoragePolicyRequired: true,
      retryAndDeadLetterPolicyRequired: true,
      noAdapterInvocationByAdmission: true,
      noBackendQueueSubmissionByAdmission: true,
      noLiveQueueWriteByAdmission: true,
      noWorkerEnqueueByAdmission: true,
      noWorkerDispatchByAdmission: true,
      noToolExecutionByAdmission: true,
      privateArtifactOnly: true,
      gpuRuntimeOnDemandOnly: true,
      nextGateRequiresLiveAdapterInvocationAndQueueWriteProof: true,
    },
    counts: {
      totalAiGraphicsTools: 21,
      adapterInvocationEnqueueAdmissionReadyTools: readyTools,
      sourceExactExecutionAdmissionAcceptedTools:
        count((row) => row.sourceExactExecutionAdmissionAccepted),
      exactRequestEnvelopeAcceptedTools: count((row) => row.exactRequestEnvelopeAccepted),
      adapterInvocationEnvelopePreparedTools:
        count((row) => row.adapterInvocationEnvelopePrepared),
      adapterInvocationContractAcceptedTools:
        count((row) => row.adapterInvocationContractAccepted),
      workerEnqueuePayloadPreparedTools:
        count((row) => row.workerEnqueuePayloadPrepared),
      workerEnqueueAdmissionContractAcceptedTools:
        count((row) => row.workerEnqueueAdmissionContractAccepted),
      productionWorkerJobPayloadAcceptedTools:
        count((row) => row.productionWorkerJobPayloadAccepted),
      backendQueueAdapterRefAcceptedTools:
        count((row) => row.backendQueueAdapterRefAccepted),
      serviceRoleBoundaryAcceptedTools:
        count((row) => row.serviceRoleBoundaryAccepted),
      workerPayloadSchemaAcceptedTools:
        count((row) => row.workerPayloadSchemaAccepted),
      privateStoragePolicyAcceptedTools:
        count((row) => row.privateStoragePolicyAccepted),
      retryPolicyAcceptedTools: count((row) => row.retryPolicyAccepted),
      deadLetterPolicyAcceptedTools: count((row) => row.deadLetterPolicyAccepted),
      checkbackPolicyAcceptedTools: count((row) => row.checkbackPolicyAccepted),
      fallbackPolicyAcceptedTools: count((row) => row.fallbackPolicyAccepted),
      idempotencyAcceptedTools: count((row) => row.idempotencyAccepted),
      satoriBlockedPendingApprovedFontFixtureTools,
      nonCpuStaticDeferredTools,
      externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidenceTools:
        count((row) => row.externalAgentAdapterInvocationEnqueueAdmittedWithProvidedEvidence),
      externalAgentCanInvokeAdapterNowTools: 0,
      externalAgentCanSubmitPrivateWorkerQueueNowTools: 0,
      backendQueueSubmissionApprovedNowTools: 0,
      liveQueueWriteApprovedNowTools: 0,
      workerEnqueueApprovedNowTools: 0,
      workerClaimApprovedNowTools: 0,
      workerDispatchApprovedNowTools: 0,
      workerExecutionApprovedNowTools: 0,
      toolExecutionApprovedNowTools: 0,
      externalAgentExecutableNowTools: 0,
      publicArtifactAllowedTools: 0,
      signedUrlAllowedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    rows,
    booleans: {
      externalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionCompleted:
        true,
      sourceExactExecutionAdmissionAccepted: sourceAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      allFiveAdapterInvocationEnqueueAdmissionsReady: readyTools === 5,
      allFiveSourceExactAdmissionsAccepted:
        count((row) => row.sourceExactExecutionAdmissionAccepted) === 5,
      allFiveAdapterInvocationEnvelopesPrepared:
        count((row) => row.adapterInvocationEnvelopePrepared) === 5,
      allFiveWorkerEnqueuePayloadsPrepared:
        count((row) => row.workerEnqueuePayloadPrepared) === 5,
      allFiveProductionWorkerJobPayloadsAccepted:
        count((row) => row.productionWorkerJobPayloadAccepted) === 5,
      allFiveBackendQueueAdapterRefsAccepted:
        count((row) => row.backendQueueAdapterRefAccepted) === 5,
      allFiveServiceRoleBoundariesAccepted:
        count((row) => row.serviceRoleBoundaryAccepted) === 5,
      allFiveWorkerPayloadSchemasAccepted:
        count((row) => row.workerPayloadSchemaAccepted) === 5,
      allFivePrivateStoragePoliciesAccepted:
        count((row) => row.privateStoragePolicyAccepted) === 5,
      allFiveRetryPoliciesAccepted: count((row) => row.retryPolicyAccepted) === 5,
      allFiveDeadLetterPoliciesAccepted:
        count((row) => row.deadLetterPolicyAccepted) === 5,
      allFiveCheckbackPoliciesAccepted:
        count((row) => row.checkbackPolicyAccepted) === 5,
      allFiveFallbackPoliciesAccepted:
        count((row) => row.fallbackPolicyAccepted) === 5,
      allFiveIdempotencyContractsAccepted:
        count((row) => row.idempotencyAccepted) === 5,
      satoriBlockedPendingApprovedFontFixture:
        satoriBlockedPendingApprovedFontFixtureTools === 1,
      fifteenRuntimeDeferredToolsPreserved: nonCpuStaticDeferredTools === 15,
      privateArtifactOnlyPolicyAccepted: true,
      adapterInvocationEnqueueRefsPreserved: rows
        .filter((row) => row.adapterInvocationEnqueueAdmissionReady)
        .every((row) => row.adapterInvocationEnqueueEvidence !== null),
      noAdapterInvocationByAdmission: true,
      noBackendQueueSubmissionByAdmission: true,
      noLiveQueueWriteByAdmission: true,
      noWorkerEnqueueByAdmission: true,
      noWorkerDispatchByAdmission: true,
      noToolExecutionByAdmission: true,
      nextGateRequiresLiveAdapterInvocationAndQueueWriteProof: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      externalAgentCanInvokeAdapterNow: false,
      externalAgentCanSubmitPrivateWorkerQueueNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerEnqueueApprovedNow: false,
      workerClaimApprovedNow: false,
      workerDispatchApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      adapterInvocationPerformed: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWritePerformed: false,
      workerEnqueuePerformed: false,
      workerClaimPerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      routeExecutionPerformed: false,
      workerExecutionPerformed: false,
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
    nextMilestone:
      'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_AND_QUEUE_WRITE_PROOF',
  }
}
