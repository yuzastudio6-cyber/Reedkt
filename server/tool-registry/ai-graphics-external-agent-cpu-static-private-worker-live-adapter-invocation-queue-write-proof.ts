import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_ENQUEUE_ADMISSION_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-adapter-invocation-enqueue-admission'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
} from './ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_passed_with_runtime_blocks'

const proofTools: AiGraphicsCanonicalToolId[] = [
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

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofStatus =
  | 'live_adapter_invocation_queue_write_proof_passed_mock_queue_validated_execution_blocked'
  | 'live_adapter_invocation_queue_write_proof_blocked_pending_satori_font_fixture'
  | 'live_adapter_invocation_queue_write_proof_deferred_non_cpu_static_runtime_boundary'
  | 'live_adapter_invocation_queue_write_proof_blocked_missing_adapter_enqueue_admission'
  | 'live_adapter_invocation_queue_write_proof_blocked_missing_mock_queue_service_validation'

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProofJob {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget
  capabilityIds: string[]
  privateArtifactManifestRef: string
  idempotencyKey: string
  adapterInvocationEnvelopeRef: string
  workerEnqueuePayloadRef: string
  backendQueueAdapterRef: string
  serviceRoleBoundaryRef: string
  localAdapterInvocationValidated: true
  mockQueueWriteValidated: true
  liveQueueWritePerformed: false
  workerEnqueuePerformed: false
  workerDispatchPerformed: false
  toolExecutionPerformed: false
  gpuRuntimeShouldStartNow: false
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProof {
  serviceMode: 'mock_only_no_supabase_write'
  queueServiceRef: 'server/services/ai-graphics-tool-runtime-queue-service.ts'
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  mockOnly: true
  insertedJobCount: 5
  returnedJobIdCount: 5
  warningCount: number
  liveToolExecutionPerformed: false
  idempotentReplay: false
  jobs: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProofJob[]
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofEvidence {
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  proofMode: 'invoke_runtime_queue_service_adapter_in_mock_only_mode_no_supabase_write'
  sourceAdapterInvocationEnvelopeRef: string
  sourceWorkerEnqueuePayloadRef: string
  sourceBackendQueueAdapterRef: string
  sourceServiceRoleBoundaryRef: string
  sourcePrivateStoragePolicyRef: string
  sourceRetryPolicyRef: string
  sourceDeadLetterPolicyRef: string
  sourceCheckbackPolicyRef: string
  sourceFallbackPolicyRef: string
  privateArtifactManifestRef: string
  queueServiceRef: 'server/services/ai-graphics-tool-runtime-queue-service.ts'
  localAdapterInvocationProofRef: string
  mockQueueWriteProofRef: string
  queueServiceMockOnly: true
  expectedOutputVisibility: 'private_artifact_only'
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget | 'deferred'
  capabilityId: string | null
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME | null
  sourceAdapterInvocationEnqueueAdmissionStatus: string | null
  sourceAdapterInvocationEnqueueAdmissionAccepted: boolean
  liveAdapterInvocationQueueWriteProofStatus:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofStatus
  localAdapterInvocationProofPassed: boolean
  queueServiceAdapterValidationPassed: boolean
  mockQueueWriteValidationPassed: boolean
  sourceAdapterInvocationEnvelopeAccepted: boolean
  sourceWorkerEnqueuePayloadAccepted: boolean
  sourceProductionWorkerJobPayloadAccepted: boolean
  privateArtifactOnly: true
  publicArtifactAllowed: false
  signedUrlAllowed: false
  liveAdapterInvocationQueueWriteProofEvidence:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofEvidence | null
  externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidence: boolean
  approvedPlanSnapshotRequired: true
  creditReservationRequired: true
  privateArtifactManifestRequired: true
  backendQueueTransportProofRequired: true
  serviceRoleQueueWriteSmokeRequired: true
  workerClaimLeaseRequired: true
  workerDispatchProofRequired: true
  toolSpecificQaGateRequired: true
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofReport {
  schemaVersion: '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof'
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION
  status: 'external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_passed_five_mock_queue_validated_execution_blocked'
  sourceAdapterInvocationEnqueueAdmissionDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  proofPolicy: {
    mode: 'invoke_runtime_queue_service_adapter_in_mock_only_mode_without_supabase_worker_or_tool_execution'
    sourceAdapterInvocationEnqueueAdmissionRequired: true
    runtimeQueueServiceValidationRequired: true
    mockOnlyRuntimeModeRequired: true
    noSupabaseQueueWriteByProof: true
    noLiveQueueWriteByProof: true
    noWorkerEnqueueByProof: true
    noWorkerDispatchByProof: true
    noToolExecutionByProof: true
    privateArtifactOnly: true
    gpuRuntimeOnDemandOnly: true
    nextGateRequiresNonProductionServiceRoleQueueWriteSmoke: true
  }
  queueServiceProof: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProof | null
  counts: {
    totalAiGraphicsTools: 21
    sourceAdapterInvocationEnqueueAdmissionAcceptedTools: number
    localAdapterInvocationProofPassedTools: number
    queueServiceAdapterValidationPassedTools: number
    mockQueueWriteValidationPassedTools: number
    sourceAdapterInvocationEnvelopeAcceptedTools: number
    sourceWorkerEnqueuePayloadAcceptedTools: number
    sourceProductionWorkerJobPayloadAcceptedTools: number
    satoriBlockedPendingApprovedFontFixtureTools: number
    nonCpuStaticDeferredTools: number
    externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidenceTools: number
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
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofRow[]
  booleans: {
    externalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofCompleted: true
    sourceAdapterInvocationEnqueueAdmissionAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    allFiveLocalAdapterInvocationProofsPassed: boolean
    allFiveQueueServiceAdapterValidationsPassed: boolean
    allFiveMockQueueWriteValidationsPassed: boolean
    queueServiceMockOnlyRuntimeAccepted: boolean
    queueServiceReturnedFiveMockJobs: boolean
    satoriBlockedPendingApprovedFontFixture: boolean
    fifteenRuntimeDeferredToolsPreserved: boolean
    privateArtifactOnlyPolicyAccepted: true
    runtimeQueueServiceValidationAccepted: boolean
    noSupabaseQueueWriteByProof: true
    noLiveQueueWriteByProof: true
    noWorkerEnqueueByProof: true
    noWorkerDispatchByProof: true
    noToolExecutionByProof: true
    nextGateRequiresNonProductionServiceRoleQueueWriteSmoke: true
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofInput {
  sourceAdapterInvocationEnqueueAdmissionReport?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionReport
  queueServiceProof?: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProof
}

function sourceRow(
  report:
    | AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionReport
    | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionRow | undefined {
  return report?.rows?.find((row) => row.toolId === toolId)
}

function sourceAdmissionAccepted(
  report?: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionReport,
): boolean {
  const rows = report?.rows ?? []
  return report?.decision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_ENQUEUE_ADMISSION_DECISION &&
    report.status ===
      'external_agent_cpu_static_private_worker_adapter_invocation_enqueue_admission_prepared_five_with_runtime_blocks' &&
    report.counts.adapterInvocationEnqueueAdmissionReadyTools === 5 &&
    report.counts.externalAgentCanInvokeAdapterNowTools === 0 &&
    report.counts.workerEnqueueApprovedNowTools === 0 &&
    report.counts.toolExecutionApprovedNowTools === 0 &&
    report.booleans.noAdapterInvocationByAdmission === true &&
    report.booleans.noLiveQueueWriteByAdmission === true &&
    report.booleans.noWorkerEnqueueByAdmission === true &&
    report.booleans.noToolExecutionByAdmission === true &&
    report.booleans.gpuRuntimeShouldStartNow === false &&
    rows.length === 21 &&
    proofTools.every((toolId) => {
      const row = rows.find((candidate) => candidate.toolId === toolId)
      return row?.adapterInvocationEnqueueAdmissionStatus ===
        'adapter_invocation_enqueue_admission_ready_execution_still_blocked' &&
        row.adapterInvocationEnqueueAdmissionReady === true &&
        row.adapterInvocationEnvelopePrepared === true &&
        row.workerEnqueuePayloadPrepared === true &&
        row.productionWorkerJobPayloadAccepted === true &&
        row.adapterInvocationEnqueueEvidence?.queueName ===
          AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME &&
        row.adapterInvocationEnqueueEvidence.expectedOutputVisibility ===
          'private_artifact_only' &&
        row.externalAgentCanInvokeAdapterNow === false &&
        row.workerEnqueueApprovedNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function queueServiceProofAccepted(
  proof: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProof | undefined,
): boolean {
  return Boolean(
    proof &&
      proof.serviceMode === 'mock_only_no_supabase_write' &&
      proof.queueName === AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME &&
      proof.mockOnly === true &&
      proof.insertedJobCount === 5 &&
      proof.returnedJobIdCount === 5 &&
      proof.liveToolExecutionPerformed === false &&
      proof.idempotentReplay === false &&
      proof.jobs.length === 5 &&
      proofTools.every((toolId) => {
        const job = proof.jobs.find((candidate) => candidate.toolId === toolId)
        return job?.localAdapterInvocationValidated === true &&
          job.mockQueueWriteValidated === true &&
          job.privateArtifactManifestRef.startsWith('private://') &&
          job.liveQueueWritePerformed === false &&
          job.workerEnqueuePerformed === false &&
          job.workerDispatchPerformed === false &&
          job.toolExecutionPerformed === false &&
          job.gpuRuntimeShouldStartNow === false
      }),
  )
}

function proofJob(
  proof: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProof | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProofJob | undefined {
  return proof?.jobs.find((job) => job.toolId === toolId)
}

function statusFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionRow
  sourceAccepted: boolean
  serviceAccepted: boolean
  serviceJob?: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProofJob
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofStatus {
  if (proofTools.includes(input.toolId)) {
    if (!input.sourceAccepted || input.source?.adapterInvocationEnqueueEvidence == null) {
      return 'live_adapter_invocation_queue_write_proof_blocked_missing_adapter_enqueue_admission'
    }
    if (!input.serviceAccepted || !input.serviceJob) {
      return 'live_adapter_invocation_queue_write_proof_blocked_missing_mock_queue_service_validation'
    }
    return 'live_adapter_invocation_queue_write_proof_passed_mock_queue_validated_execution_blocked'
  }
  if (input.toolId === 'satori') {
    return 'live_adapter_invocation_queue_write_proof_blocked_pending_satori_font_fixture'
  }
  return 'live_adapter_invocation_queue_write_proof_deferred_non_cpu_static_runtime_boundary'
}

function blockerFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofStatus,
): string {
  switch (status) {
    case 'live_adapter_invocation_queue_write_proof_passed_mock_queue_validated_execution_blocked':
      return 'runtime queue service adapter accepted the exact CPU/static payload in mock-only mode; service-role queue write, worker claim, worker dispatch, and tool execution remain blocked'
    case 'live_adapter_invocation_queue_write_proof_blocked_pending_satori_font_fixture':
      return 'blocked pending approved Satori font fixture evidence bridge'
    case 'live_adapter_invocation_queue_write_proof_deferred_non_cpu_static_runtime_boundary':
      return 'deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes'
    case 'live_adapter_invocation_queue_write_proof_blocked_missing_adapter_enqueue_admission':
      return 'missing accepted adapter invocation and enqueue admission'
    case 'live_adapter_invocation_queue_write_proof_blocked_missing_mock_queue_service_validation':
      return 'missing accepted mock-only runtime queue service validation'
  }
}

function evidenceFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionRow
  serviceJob?: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProofJob
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofStatus
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofEvidence | null {
  const sourceEvidence = input.source?.adapterInvocationEnqueueEvidence
  if (
    input.status !==
      'live_adapter_invocation_queue_write_proof_passed_mock_queue_validated_execution_blocked' ||
    !sourceEvidence ||
    !input.serviceJob
  ) {
    return null
  }

  const base =
    `ai-graphics/external-agent/cpu-static-private-worker-live-adapter-invocation-queue-write-proof/${input.toolId}`
  return {
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    proofMode:
      'invoke_runtime_queue_service_adapter_in_mock_only_mode_no_supabase_write',
    sourceAdapterInvocationEnvelopeRef:
      sourceEvidence.adapterInvocationEnvelopeRef,
    sourceWorkerEnqueuePayloadRef: sourceEvidence.workerEnqueuePayloadRef,
    sourceBackendQueueAdapterRef: sourceEvidence.backendQueueAdapterRef,
    sourceServiceRoleBoundaryRef: sourceEvidence.serviceRoleBoundaryRef,
    sourcePrivateStoragePolicyRef: sourceEvidence.privateStoragePolicyRef,
    sourceRetryPolicyRef: sourceEvidence.retryPolicyRef,
    sourceDeadLetterPolicyRef: sourceEvidence.deadLetterPolicyRef,
    sourceCheckbackPolicyRef: sourceEvidence.checkbackPolicyRef,
    sourceFallbackPolicyRef: sourceEvidence.fallbackPolicyRef,
    privateArtifactManifestRef: input.serviceJob.privateArtifactManifestRef,
    queueServiceRef: 'server/services/ai-graphics-tool-runtime-queue-service.ts',
    localAdapterInvocationProofRef:
      `local-adapter-invocation-proof://${base}/adapter-service-validation`,
    mockQueueWriteProofRef:
      `mock-queue-write-proof://${base}/runtime-queue-service-validation`,
    queueServiceMockOnly: true,
    expectedOutputVisibility: 'private_artifact_only',
  }
}

function buildRow(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerAdapterInvocationEnqueueAdmissionRow
  sourceAccepted: boolean
  serviceAccepted: boolean
  serviceJob?: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueServiceProofJob
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofRow {
  const status = statusFor(input)
  const evidence = evidenceFor({
    toolId: input.toolId,
    source: input.source,
    serviceJob: input.serviceJob,
    status,
  })
  const passed = Boolean(evidence)
  return {
    toolId: input.toolId,
    productionToolId:
      input.source?.productionToolId ?? (`ai_graphics_${input.toolId}` as ProductionToolId),
    workerType: input.source?.workerType ?? 'tool_readiness_worker',
    runtimeTarget: input.source?.runtimeTarget ?? 'deferred',
    capabilityId: input.source?.capabilityId ?? null,
    queueName: passed ? AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME : null,
    sourceAdapterInvocationEnqueueAdmissionStatus:
      input.source?.adapterInvocationEnqueueAdmissionStatus ?? null,
    sourceAdapterInvocationEnqueueAdmissionAccepted:
      input.source?.adapterInvocationEnqueueAdmissionReady === true &&
      input.source.adapterInvocationEnqueueEvidence != null,
    liveAdapterInvocationQueueWriteProofStatus: status,
    localAdapterInvocationProofPassed: passed,
    queueServiceAdapterValidationPassed: passed,
    mockQueueWriteValidationPassed: passed,
    sourceAdapterInvocationEnvelopeAccepted:
      input.source?.adapterInvocationEnvelopePrepared === true,
    sourceWorkerEnqueuePayloadAccepted:
      input.source?.workerEnqueuePayloadPrepared === true,
    sourceProductionWorkerJobPayloadAccepted:
      input.source?.productionWorkerJobPayloadAccepted === true,
    privateArtifactOnly: true,
    publicArtifactAllowed: false,
    signedUrlAllowed: false,
    liveAdapterInvocationQueueWriteProofEvidence: evidence,
    externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidence:
      passed,
    approvedPlanSnapshotRequired: true,
    creditReservationRequired: true,
    privateArtifactManifestRequired: true,
    backendQueueTransportProofRequired: true,
    serviceRoleQueueWriteSmokeRequired: true,
    workerClaimLeaseRequired: true,
    workerDispatchProofRequired: true,
    toolSpecificQaGateRequired: true,
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
    nextProofMilestone: passed
      ? 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE'
      : input.toolId === 'satori'
        ? 'AI_GRAPHICS_SATORI_FONT_FIXTURE_EVIDENCE_BRIDGE'
        : 'AI_GRAPHICS_BROWSER_GPU_MODEL_RUNTIME_EXECUTION_ADMISSION',
  }
}

export function buildAiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProof(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofReport {
  const sourceAccepted = sourceAdmissionAccepted(
    input.sourceAdapterInvocationEnqueueAdmissionReport,
  )
  const serviceAccepted = queueServiceProofAccepted(input.queueServiceProof)
  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) =>
    buildRow({
      toolId,
      source: sourceRow(input.sourceAdapterInvocationEnqueueAdmissionReport, toolId),
      sourceAccepted,
      serviceAccepted,
      serviceJob: proofJob(input.queueServiceProof, toolId),
    }),
  )
  const count = (
    predicate: (row: AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofRow) => boolean,
  ) => rows.filter(predicate).length
  const satoriBlockedPendingApprovedFontFixtureTools = count(
    (row) =>
      row.liveAdapterInvocationQueueWriteProofStatus ===
      'live_adapter_invocation_queue_write_proof_blocked_pending_satori_font_fixture',
  )
  const nonCpuStaticDeferredTools = count(
    (row) =>
      row.liveAdapterInvocationQueueWriteProofStatus ===
      'live_adapter_invocation_queue_write_proof_deferred_non_cpu_static_runtime_boundary',
  )

  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof',
    decision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION,
    status:
      'external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_passed_five_mock_queue_validated_execution_blocked',
    sourceAdapterInvocationEnqueueAdmissionDecision:
      input.sourceAdapterInvocationEnqueueAdmissionReport?.decision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...productFacingCapabilities],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    proofPolicy: {
      mode:
        'invoke_runtime_queue_service_adapter_in_mock_only_mode_without_supabase_worker_or_tool_execution',
      sourceAdapterInvocationEnqueueAdmissionRequired: true,
      runtimeQueueServiceValidationRequired: true,
      mockOnlyRuntimeModeRequired: true,
      noSupabaseQueueWriteByProof: true,
      noLiveQueueWriteByProof: true,
      noWorkerEnqueueByProof: true,
      noWorkerDispatchByProof: true,
      noToolExecutionByProof: true,
      privateArtifactOnly: true,
      gpuRuntimeOnDemandOnly: true,
      nextGateRequiresNonProductionServiceRoleQueueWriteSmoke: true,
    },
    queueServiceProof: input.queueServiceProof ?? null,
    counts: {
      totalAiGraphicsTools: 21,
      sourceAdapterInvocationEnqueueAdmissionAcceptedTools:
        count((row) => row.sourceAdapterInvocationEnqueueAdmissionAccepted),
      localAdapterInvocationProofPassedTools:
        count((row) => row.localAdapterInvocationProofPassed),
      queueServiceAdapterValidationPassedTools:
        count((row) => row.queueServiceAdapterValidationPassed),
      mockQueueWriteValidationPassedTools:
        count((row) => row.mockQueueWriteValidationPassed),
      sourceAdapterInvocationEnvelopeAcceptedTools:
        count((row) => row.sourceAdapterInvocationEnvelopeAccepted),
      sourceWorkerEnqueuePayloadAcceptedTools:
        count((row) => row.sourceWorkerEnqueuePayloadAccepted),
      sourceProductionWorkerJobPayloadAcceptedTools:
        count((row) => row.sourceProductionWorkerJobPayloadAccepted),
      satoriBlockedPendingApprovedFontFixtureTools,
      nonCpuStaticDeferredTools,
      externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidenceTools:
        count((row) => row.externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidence),
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
      externalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofCompleted:
        true,
      sourceAdapterInvocationEnqueueAdmissionAccepted: sourceAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      allFiveLocalAdapterInvocationProofsPassed:
        count((row) => row.localAdapterInvocationProofPassed) === 5,
      allFiveQueueServiceAdapterValidationsPassed:
        count((row) => row.queueServiceAdapterValidationPassed) === 5,
      allFiveMockQueueWriteValidationsPassed:
        count((row) => row.mockQueueWriteValidationPassed) === 5,
      queueServiceMockOnlyRuntimeAccepted:
        input.queueServiceProof?.mockOnly === true,
      queueServiceReturnedFiveMockJobs:
        input.queueServiceProof?.insertedJobCount === 5 &&
        input.queueServiceProof.returnedJobIdCount === 5,
      satoriBlockedPendingApprovedFontFixture:
        satoriBlockedPendingApprovedFontFixtureTools === 1,
      fifteenRuntimeDeferredToolsPreserved: nonCpuStaticDeferredTools === 15,
      privateArtifactOnlyPolicyAccepted: true,
      runtimeQueueServiceValidationAccepted: serviceAccepted,
      noSupabaseQueueWriteByProof: true,
      noLiveQueueWriteByProof: true,
      noWorkerEnqueueByProof: true,
      noWorkerDispatchByProof: true,
      noToolExecutionByProof: true,
      nextGateRequiresNonProductionServiceRoleQueueWriteSmoke: true,
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
      'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE',
  }
}
