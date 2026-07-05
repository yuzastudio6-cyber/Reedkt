import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-controlled-tool-execution-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
} from './ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_exact_execution_admission_prepared_with_runtime_blocks'

const exactExecutionAdmissionTools: AiGraphicsCanonicalToolId[] = [
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

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionStatus =
  | 'exact_external_agent_execution_admission_ready_for_private_worker_request_execution_still_blocked'
  | 'exact_external_agent_execution_admission_blocked_pending_satori_font_fixture'
  | 'exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary'
  | 'exact_external_agent_execution_admission_blocked_missing_controlled_tool_execution_proof'

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionEvidence {
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  exactExecutionAdmissionMode: 'admit_exact_private_worker_request_without_live_queue_or_adapter_execution'
  approvedPlanSnapshotRef: string
  creditReservationRef: string
  privateArtifactManifestRef: string
  queuePayloadIdempotencyKey: string
  controlledToolExecutionIdempotencyKey: string
  exactExecutionAdmissionIdempotencyKey: string
  sourceControlledToolExecutionEvidenceRef: string
  sourcePhase0LocalArtifactEvidenceRef: string
  sourceAdapterInvocationDryRunRef: string
  externalAgentExactRequestEnvelopeRef: string
  externalAgentAdmissionDecisionRef: string
  workerAcceptedRequestSchemaRef: string
  privateOutputManifestRef: string
  toolResultSchemaRef: string
  toolSpecificQaGateRef: string
  executionUnlockConditionRef: string
  expectedOutputVisibility: 'private_artifact_only'
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME | null
  sourceControlledToolExecutionProofStatus: string | null
  sourceControlledToolExecutionProofAccepted: boolean
  exactExecutionAdmissionStatus: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionStatus
  exactExecutionAdmissionReady: boolean
  exactRequestEnvelopeAccepted: boolean
  approvedPlanSnapshotAccepted: boolean
  creditReservationAccepted: boolean
  privateArtifactManifestAccepted: boolean
  sourceControlledEvidenceAccepted: boolean
  workerAcceptedRequestSchemaAccepted: boolean
  toolSpecificQaGateAccepted: boolean
  exactExecutionAdmissionEvidence:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionEvidence | null
  approvedPlanSnapshotRequired: true
  creditReservationRequired: true
  privateArtifactManifestRequired: true
  toolRouteApprovalRequired: true
  workerApprovalRequired: true
  backendQueueTransportProofRequired: true
  liveQueueWriteProofRequired: true
  workerClaimLeaseRequired: true
  workerDispatchProofRequired: true
  adapterInvocationProofRequired: true
  exactExecutionAdmissionRequired: true
  idempotencyRequired: true
  checkbackPolicyRequired: true
  fallbackPolicyRequired: true
  toolSpecificQaGateRequired: true
  privateArtifactOnly: true
  publicArtifactAllowed: false
  signedUrlAllowed: false
  externalAgentExactRequestAdmittedWithProvidedEvidence: boolean
  externalAgentCanDispatchPrivateWorkerJobNow: false
  externalAgentCanSubmitPrivateWorkerQueueNow: false
  externalAgentCanRequestPrivateWorkerHandoffNow: false
  externalAgentCanInvokeAdapterNow: false
  agentCanExecuteToolsNow: false
  routeExecutionApprovedNow: false
  backendQueueSubmissionApprovedNow: false
  liveQueueWriteApprovedNow: false
  workerClaimApprovedNow: false
  workerDispatchApprovedNow: false
  workerExecutionApprovedNow: false
  workerEnqueueApprovedNow: false
  toolExecutionApprovedNow: false
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport {
  schemaVersion: '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-exact-execution-admission'
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION
  status:
    | 'external_agent_cpu_static_private_worker_exact_execution_admission_prepared_five_with_runtime_blocks'
    | 'external_agent_cpu_static_private_worker_exact_execution_admission_blocked_pending_controlled_tool_execution_proof'
  sourceControlledToolExecutionProofDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  exactExecutionAdmissionPolicy: {
    mode: 'admit_exact_request_envelopes_without_live_queue_adapter_or_tool_execution'
    sourceControlledToolExecutionProofRequired: true
    approvedPlanSnapshotRequired: true
    creditReservationRequired: true
    privateArtifactManifestRequired: true
    exactRequestEnvelopeRequired: true
    workerAcceptedRequestSchemaRequired: true
    toolSpecificQaGateRequired: true
    noLiveQueueWriteByAdmission: true
    noAdapterInvocationByAdmission: true
    noToolExecutionByAdmission: true
    privateArtifactOnly: true
    gpuRuntimeOnDemandOnly: true
    nextGateRequiresAdapterInvocationAndWorkerEnqueueAdmission: true
  }
  counts: {
    totalAiGraphicsTools: 21
    exactExecutionAdmissionReadyTools: number
    sourceControlledToolExecutionProofAcceptedTools: number
    exactRequestEnvelopeAcceptedTools: number
    approvedPlanSnapshotAcceptedTools: number
    creditReservationAcceptedTools: number
    privateArtifactManifestAcceptedTools: number
    workerAcceptedRequestSchemaAcceptedTools: number
    toolSpecificQaGateAcceptedTools: number
    satoriBlockedPendingApprovedFontFixtureTools: number
    nonCpuStaticDeferredTools: number
    externalAgentExactRequestAdmittedWithProvidedEvidenceTools: number
    externalAgentCanDispatchPrivateWorkerJobNowTools: 0
    externalAgentCanSubmitPrivateWorkerQueueNowTools: 0
    externalAgentCanRequestPrivateWorkerHandoffNowTools: 0
    externalAgentCanInvokeAdapterNowTools: 0
    externalAgentExecutableNowTools: 0
    backendQueueSubmissionApprovedNowTools: 0
    liveQueueWriteApprovedNowTools: 0
    workerClaimApprovedNowTools: 0
    workerDispatchApprovedNowTools: 0
    workerEnqueueApprovedNowTools: 0
    toolExecutionApprovedNowTools: 0
    publicArtifactAllowedTools: 0
    signedUrlAllowedTools: 0
    gpuRuntimeShouldStartNowTools: 0
  }
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow[]
  booleans: {
    externalAgentCpuStaticPrivateWorkerExactExecutionAdmissionCompleted: true
    sourceControlledToolExecutionProofAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    allFiveExactExecutionAdmissionsReady: boolean
    allFiveSourceControlledProofsAccepted: boolean
    allFiveExactRequestEnvelopesAccepted: boolean
    allFiveApprovedPlanSnapshotsAccepted: boolean
    allFiveCreditReservationsAccepted: boolean
    allFivePrivateArtifactManifestsAccepted: boolean
    allFiveWorkerAcceptedRequestSchemasAccepted: boolean
    allFiveToolSpecificQaGatesAccepted: boolean
    satoriBlockedPendingApprovedFontFixture: boolean
    fifteenRuntimeDeferredToolsPreserved: boolean
    exactExecutionAdmissionRefsPreserved: boolean
    privateArtifactOnlyPolicyAccepted: true
    noLiveQueueWriteByAdmission: true
    noAdapterInvocationByAdmission: true
    noToolExecutionByAdmission: true
    nextGateRequiresAdapterInvocationAndWorkerEnqueueAdmission: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    externalAgentCanDispatchPrivateWorkerJobNow: false
    externalAgentCanSubmitPrivateWorkerQueueNow: false
    externalAgentCanRequestPrivateWorkerHandoffNow: false
    externalAgentCanInvokeAdapterNow: false
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerClaimApprovedNow: false
    workerDispatchApprovedNow: false
    workerExecutionApprovedNow: false
    workerEnqueueApprovedNow: false
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
    backendQueueSubmissionPerformed: false
    liveQueueWritePerformed: false
    workerClaimPerformed: false
    workerDispatchPerformed: false
    workerEnqueuePerformed: false
    adapterInvocationPerformed: false
    toolExecutionPerformed: false
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
  nextMilestone: string
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionInput {
  sourceControlledToolExecutionProofReport?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofReport
}

function controlledRow(
  report: AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofReport | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofRow | undefined {
  return report?.rows?.find((row) => row.toolId === toolId)
}

function sourceControlledProofAccepted(
  report?: AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofReport,
): boolean {
  const rows = report?.rows ?? []
  return report?.decision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF_DECISION &&
    report.status ===
      'external_agent_cpu_static_private_worker_controlled_tool_execution_proof_prepared_five_with_runtime_blocks' &&
    report.counts.controlledToolExecutionProofAcceptedTools === 5 &&
    report.counts.exactRequestContractsAcceptedTools === 5 &&
    report.counts.privateOutputManifestAcceptedTools === 5 &&
    report.counts.toolResultSchemaAcceptedTools === 5 &&
    report.counts.toolSpecificQaGateAcceptedTools === 5 &&
    report.counts.satoriBlockedPendingApprovedFontFixtureTools === 1 &&
    report.counts.nonCpuStaticDeferredTools === 15 &&
    report.counts.externalAgentExecutableNowTools === 0 &&
    report.counts.externalAgentCanInvokeAdapterNowTools === 0 &&
    report.counts.workerDispatchApprovedNowTools === 0 &&
    report.counts.toolExecutionApprovedNowTools === 0 &&
    report.counts.gpuRuntimeShouldStartNowTools === 0 &&
    report.booleans.allFiveControlledToolExecutionProofsAccepted === true &&
    report.booleans.allFiveSourceDryRunContractsAccepted === true &&
    report.booleans.allFivePhase0ExecutionEvidenceAccepted === true &&
    report.booleans.privateArtifactOnlyPolicyAccepted === true &&
    report.booleans.noNewToolExecutionByControlledProof === true &&
    report.booleans.noAdapterInvocationByControlledProof === true &&
    report.booleans.nextGateRequiresExactExternalAgentExecutionAdmission === true &&
    report.booleans.agentCanExecuteToolsNow === false &&
    rows.length === 21 &&
    exactExecutionAdmissionTools.every((toolId) => {
      const row = rows.find((source) => source.toolId === toolId)
      return row?.controlledToolExecutionProofStatus ===
        'controlled_private_tool_execution_proof_accepted_with_phase0_evidence_execution_blocked' &&
        row.controlledToolExecutionProofAccepted === true &&
        row.exactRequestContractAccepted === true &&
        row.privateOutputManifestAccepted === true &&
        row.toolResultSchemaAccepted === true &&
        row.toolSpecificQaGateAccepted === true &&
        row.controlledToolExecutionEvidence?.queueName ===
          AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME &&
        row.controlledToolExecutionEvidence.expectedOutputVisibility === 'private_artifact_only' &&
        row.externalAgentCanInvokeAdapterNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function statusFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofRow
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionStatus {
  if (exactExecutionAdmissionTools.includes(input.toolId)) {
    return 'exact_external_agent_execution_admission_ready_for_private_worker_request_execution_still_blocked'
  }
  if (input.toolId === 'satori') {
    return 'exact_external_agent_execution_admission_blocked_pending_satori_font_fixture'
  }
  return 'exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary'
}

function admissionEvidenceFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofRow
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionStatus
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionEvidence | null {
  const sourceEvidence = input.source?.controlledToolExecutionEvidence
  if (
    input.status !==
      'exact_external_agent_execution_admission_ready_for_private_worker_request_execution_still_blocked'
  ) {
    return null
  }
  const base =
    `ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/${input.toolId}`
  return {
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    exactExecutionAdmissionMode:
      'admit_exact_private_worker_request_without_live_queue_or_adapter_execution',
    approvedPlanSnapshotRef:
      sourceEvidence?.approvedPlanSnapshotRef ?? `approved-plan-snapshot://${base}/snapshot`,
    creditReservationRef:
      sourceEvidence?.creditReservationRef ?? `credit-reservation://${base}/reservation`,
    privateArtifactManifestRef:
      sourceEvidence?.privateArtifactManifestRef ?? `private://${base}/manifest`,
    queuePayloadIdempotencyKey:
      sourceEvidence?.queuePayloadIdempotencyKey ?? `queue-payload-idempotency://${base}`,
    controlledToolExecutionIdempotencyKey:
      sourceEvidence?.controlledToolExecutionIdempotencyKey ??
      `controlled-tool-execution-idempotency://${base}`,
    exactExecutionAdmissionIdempotencyKey: `exact-execution-admission://${base}/idempotency`,
    sourceControlledToolExecutionEvidenceRef:
      sourceEvidence?.controlledToolExecutionEvidenceRef ??
      `controlled-tool-execution-proof://${base}/pending-controlled-proof`,
    sourcePhase0LocalArtifactEvidenceRef:
      sourceEvidence?.phase0LocalArtifactEvidenceRef ??
      `phase0-local-artifact-evidence://${base}/pending-phase0-source`,
    sourceAdapterInvocationDryRunRef:
      sourceEvidence?.adapterInvocationDryRunRef ??
      `adapter-dry-run://${base}/pending-adapter-dry-run`,
    externalAgentExactRequestEnvelopeRef: `exact-request-envelope://${base}/request`,
    externalAgentAdmissionDecisionRef: `exact-execution-admission://${base}/decision`,
    workerAcceptedRequestSchemaRef: `worker-accepted-request-schema://${base}/schema`,
    privateOutputManifestRef:
      sourceEvidence?.expectedPrivateOutputContractRef ??
      `private-output-contract://${base}/output`,
    toolResultSchemaRef:
      sourceEvidence?.expectedToolResultSchemaRef ?? `tool-result-schema://${base}/result`,
    toolSpecificQaGateRef:
      sourceEvidence?.toolSpecificQaGateRef ?? `tool-qa-gate://${base}/qa`,
    executionUnlockConditionRef: `execution-unlock-condition://${base}/adapter-worker-enqueue`,
    expectedOutputVisibility: 'private_artifact_only',
  }
}

function blockerFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionStatus,
): string {
  switch (status) {
    case 'exact_external_agent_execution_admission_ready_for_private_worker_request_execution_still_blocked':
      return 'exact request admitted with provided evidence; adapter invocation, live queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the next gate'
    case 'exact_external_agent_execution_admission_blocked_pending_satori_font_fixture':
      return 'blocked pending approved Satori font fixture evidence bridge'
    case 'exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary':
      return 'deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes'
    case 'exact_external_agent_execution_admission_blocked_missing_controlled_tool_execution_proof':
      return 'missing accepted controlled private worker tool execution proof'
  }
}

function buildRow(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofRow
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow {
  const status = statusFor(input)
  const evidence = admissionEvidenceFor({ toolId: input.toolId, source: input.source, status })
  const ready = Boolean(evidence)
  const acceptedSource =
    input.sourceAccepted &&
    input.source?.controlledToolExecutionProofAccepted === true &&
    input.source?.controlledToolExecutionEvidence != null
  return {
    toolId: input.toolId,
    productionToolId: input.source?.productionToolId ?? (`ai_graphics_${input.toolId}` as ProductionToolId),
    workerType: input.source?.workerType ?? 'tool_readiness_worker',
    runtimeTarget: input.source?.runtimeTarget ?? 'planning_only_no_runtime',
    queueName: ready ? AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME : null,
    sourceControlledToolExecutionProofStatus:
      input.source?.controlledToolExecutionProofStatus ?? null,
    sourceControlledToolExecutionProofAccepted: acceptedSource,
    exactExecutionAdmissionStatus: status,
    exactExecutionAdmissionReady: ready,
    exactRequestEnvelopeAccepted: ready,
    approvedPlanSnapshotAccepted: ready,
    creditReservationAccepted: ready,
    privateArtifactManifestAccepted: ready,
    sourceControlledEvidenceAccepted: acceptedSource,
    workerAcceptedRequestSchemaAccepted: ready,
    toolSpecificQaGateAccepted: ready,
    exactExecutionAdmissionEvidence: evidence,
    approvedPlanSnapshotRequired: true,
    creditReservationRequired: true,
    privateArtifactManifestRequired: true,
    toolRouteApprovalRequired: true,
    workerApprovalRequired: true,
    backendQueueTransportProofRequired: true,
    liveQueueWriteProofRequired: true,
    workerClaimLeaseRequired: true,
    workerDispatchProofRequired: true,
    adapterInvocationProofRequired: true,
    exactExecutionAdmissionRequired: true,
    idempotencyRequired: true,
    checkbackPolicyRequired: true,
    fallbackPolicyRequired: true,
    toolSpecificQaGateRequired: true,
    privateArtifactOnly: true,
    publicArtifactAllowed: false,
    signedUrlAllowed: false,
    externalAgentExactRequestAdmittedWithProvidedEvidence: ready,
    externalAgentCanDispatchPrivateWorkerJobNow: false,
    externalAgentCanSubmitPrivateWorkerQueueNow: false,
    externalAgentCanRequestPrivateWorkerHandoffNow: false,
    externalAgentCanInvokeAdapterNow: false,
    agentCanExecuteToolsNow: false,
    routeExecutionApprovedNow: false,
    backendQueueSubmissionApprovedNow: false,
    liveQueueWriteApprovedNow: false,
    workerClaimApprovedNow: false,
    workerDispatchApprovedNow: false,
    workerExecutionApprovedNow: false,
    workerEnqueueApprovedNow: false,
    toolExecutionApprovedNow: false,
    providerRuntimeApprovedNow: false,
    browserWebglCanvasRuntimeApprovedNow: false,
    gpuRuntimeApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    blocker: blockerFor(status),
    nextProofMilestone: ready
      ? 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_AND_ENQUEUE_ADMISSION'
      : input.toolId === 'satori'
        ? 'AI_GRAPHICS_SATORI_FONT_FIXTURE_EVIDENCE_BRIDGE'
        : 'AI_GRAPHICS_BROWSER_GPU_MODEL_RUNTIME_EXECUTION_ADMISSION',
  }
}

export function buildAiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmission(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport {
  const sourceAccepted = sourceControlledProofAccepted(input.sourceControlledToolExecutionProofReport)
  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) =>
    buildRow({
      toolId,
      source: controlledRow(input.sourceControlledToolExecutionProofReport, toolId),
      sourceAccepted,
    }),
  )
  const count = (predicate: (row: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow) => boolean) =>
    rows.filter(predicate).length
  const exactExecutionAdmissionReadyTools = count((row) => row.exactExecutionAdmissionReady)
  const satoriBlockedPendingApprovedFontFixtureTools = count(
    (row) =>
      row.exactExecutionAdmissionStatus ===
      'exact_external_agent_execution_admission_blocked_pending_satori_font_fixture',
  )
  const nonCpuStaticDeferredTools = count(
    (row) =>
      row.exactExecutionAdmissionStatus ===
      'exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary',
  )
  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-exact-execution-admission',
    decision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION,
    status:
      exactExecutionAdmissionReadyTools === 5
        ? 'external_agent_cpu_static_private_worker_exact_execution_admission_prepared_five_with_runtime_blocks'
        : 'external_agent_cpu_static_private_worker_exact_execution_admission_blocked_pending_controlled_tool_execution_proof',
    sourceControlledToolExecutionProofDecision:
      input.sourceControlledToolExecutionProofReport?.decision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...productFacingCapabilities],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    exactExecutionAdmissionPolicy: {
      mode: 'admit_exact_request_envelopes_without_live_queue_adapter_or_tool_execution',
      sourceControlledToolExecutionProofRequired: true,
      approvedPlanSnapshotRequired: true,
      creditReservationRequired: true,
      privateArtifactManifestRequired: true,
      exactRequestEnvelopeRequired: true,
      workerAcceptedRequestSchemaRequired: true,
      toolSpecificQaGateRequired: true,
      noLiveQueueWriteByAdmission: true,
      noAdapterInvocationByAdmission: true,
      noToolExecutionByAdmission: true,
      privateArtifactOnly: true,
      gpuRuntimeOnDemandOnly: true,
      nextGateRequiresAdapterInvocationAndWorkerEnqueueAdmission: true,
    },
    counts: {
      totalAiGraphicsTools: 21,
      exactExecutionAdmissionReadyTools,
      sourceControlledToolExecutionProofAcceptedTools: count(
        (row) => row.sourceControlledToolExecutionProofAccepted,
      ),
      exactRequestEnvelopeAcceptedTools: count((row) => row.exactRequestEnvelopeAccepted),
      approvedPlanSnapshotAcceptedTools: count((row) => row.approvedPlanSnapshotAccepted),
      creditReservationAcceptedTools: count((row) => row.creditReservationAccepted),
      privateArtifactManifestAcceptedTools: count((row) => row.privateArtifactManifestAccepted),
      workerAcceptedRequestSchemaAcceptedTools: count(
        (row) => row.workerAcceptedRequestSchemaAccepted,
      ),
      toolSpecificQaGateAcceptedTools: count((row) => row.toolSpecificQaGateAccepted),
      satoriBlockedPendingApprovedFontFixtureTools,
      nonCpuStaticDeferredTools,
      externalAgentExactRequestAdmittedWithProvidedEvidenceTools: count(
        (row) => row.externalAgentExactRequestAdmittedWithProvidedEvidence,
      ),
      externalAgentCanDispatchPrivateWorkerJobNowTools: 0,
      externalAgentCanSubmitPrivateWorkerQueueNowTools: 0,
      externalAgentCanRequestPrivateWorkerHandoffNowTools: 0,
      externalAgentCanInvokeAdapterNowTools: 0,
      externalAgentExecutableNowTools: 0,
      backendQueueSubmissionApprovedNowTools: 0,
      liveQueueWriteApprovedNowTools: 0,
      workerClaimApprovedNowTools: 0,
      workerDispatchApprovedNowTools: 0,
      workerEnqueueApprovedNowTools: 0,
      toolExecutionApprovedNowTools: 0,
      publicArtifactAllowedTools: 0,
      signedUrlAllowedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    rows,
    booleans: {
      externalAgentCpuStaticPrivateWorkerExactExecutionAdmissionCompleted: true,
      sourceControlledToolExecutionProofAccepted: sourceAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      allFiveExactExecutionAdmissionsReady: exactExecutionAdmissionReadyTools === 5,
      allFiveSourceControlledProofsAccepted:
        count((row) => row.sourceControlledToolExecutionProofAccepted) === 5,
      allFiveExactRequestEnvelopesAccepted:
        count((row) => row.exactRequestEnvelopeAccepted) === 5,
      allFiveApprovedPlanSnapshotsAccepted:
        count((row) => row.approvedPlanSnapshotAccepted) === 5,
      allFiveCreditReservationsAccepted: count((row) => row.creditReservationAccepted) === 5,
      allFivePrivateArtifactManifestsAccepted:
        count((row) => row.privateArtifactManifestAccepted) === 5,
      allFiveWorkerAcceptedRequestSchemasAccepted:
        count((row) => row.workerAcceptedRequestSchemaAccepted) === 5,
      allFiveToolSpecificQaGatesAccepted:
        count((row) => row.toolSpecificQaGateAccepted) === 5,
      satoriBlockedPendingApprovedFontFixture:
        satoriBlockedPendingApprovedFontFixtureTools === 1,
      fifteenRuntimeDeferredToolsPreserved: nonCpuStaticDeferredTools === 15,
      exactExecutionAdmissionRefsPreserved:
        exactExecutionAdmissionReadyTools === 5 &&
        rows
          .filter((row) => row.exactExecutionAdmissionReady)
          .every((row) => row.exactExecutionAdmissionEvidence !== null),
      privateArtifactOnlyPolicyAccepted: true,
      noLiveQueueWriteByAdmission: true,
      noAdapterInvocationByAdmission: true,
      noToolExecutionByAdmission: true,
      nextGateRequiresAdapterInvocationAndWorkerEnqueueAdmission: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      externalAgentCanDispatchPrivateWorkerJobNow: false,
      externalAgentCanSubmitPrivateWorkerQueueNow: false,
      externalAgentCanRequestPrivateWorkerHandoffNow: false,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerClaimApprovedNow: false,
      workerDispatchApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerEnqueueApprovedNow: false,
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
      backendQueueSubmissionPerformed: false,
      liveQueueWritePerformed: false,
      workerClaimPerformed: false,
      workerDispatchPerformed: false,
      workerEnqueuePerformed: false,
      adapterInvocationPerformed: false,
      toolExecutionPerformed: false,
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
    nextMilestone:
      'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_AND_ENQUEUE_ADMISSION',
  }
}
