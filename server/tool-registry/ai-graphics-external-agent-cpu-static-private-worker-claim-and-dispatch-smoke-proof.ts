import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
} from './ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionEvidence,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_proof_validator_prepared_with_runtime_blocks'

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

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofStatus =
  | 'blocked_pending_source_non_production_service_role_queue_write_smoke_proof'
  | 'blocked_pending_source_exact_execution_admission'
  | 'blocked_pending_saved_worker_claim_and_dispatch_smoke_result'
  | 'rejected_saved_worker_claim_and_dispatch_smoke_result'
  | 'accepted_saved_worker_claim_and_dispatch_smoke_result_execution_blocked'

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchRequestLineage {
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
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
  workerClaimAndDispatchEvidenceRef: string
  workerClaimAndDispatchTelemetryRef: string
  workerClaimAndDispatchLeaseAuditRef: string
  workerClaimAndDispatchCleanupProofRef: string
  workerClaimAndDispatchRollbackRef: string
  workerClaimAndDispatchHandoffRef: string
  expectedOutputVisibility: 'private_artifact_only'
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeResult {
  ok: true
  decision:
    'ai_graphics_external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_passed_with_cleanup'
  status:
    'non_production_worker_claim_and_dispatch_smoke_passed_with_cleanup_no_tool_execution'
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  toolsClaimed: 5
  toolsClaimedIds: AiGraphicsCanonicalToolId[]
  queueRowsRead: 5
  workerClaimsCreated: 5
  workerDispatchHandoffsCreated: 5
  workerDispatchLeasesReleased: 5
  workerExecutionsPerformed: 0
  toolExecutionsPerformed: 0
  queueRowsCleanedUp: 5
  queueRowsPersistedAfterCleanup: 0
  serviceRoleBoundaryRef: string
  privateEvidenceRef: string
  telemetryRef: string
  leaseAuditRef: string
  cleanupProofRef: string
  rollbackRef: string
  sourceQueueWriteSmokeProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION
  sourceQueueWriteSmokeProofAccepted: true
  liveWorkerClaimAndDispatchSmokeExecutedNow: true
  publicArtifactCreated: false
  signedUrlCreated: false
  gpuRuntimeShouldStartNow: false
  externalAgentExecutableNowTools: 0
  runtimeReadyNow: false
  externalBetaReadyNow: false
  productionReadyNow: false
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofInput {
  sourceQueueWriteSmokeProofPacket?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport
  sourceExactExecutionAdmissionPacket?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport
  workerClaimAndDispatchSmokeResult?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeResult
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget | 'deferred'
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME | null
  sourceQueueWriteSmokeProofStatus: string | null
  sourceQueueWriteSmokeProofAccepted: boolean
  sourceExactExecutionAdmissionStatus: string | null
  sourceExactExecutionAdmissionAccepted: boolean
  workerClaimAndDispatchSmokeProofStatus:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofStatus
  workerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence: boolean
  exactRequestLineagePreserved: boolean
  exactRequestLineage: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchRequestLineage | null
  workerClaimEvidenceRef: string | null
  workerDispatchEvidenceRef: string | null
  workerDispatchTelemetryRef: string | null
  workerLeaseAuditRef: string | null
  workerDispatchCleanupProofRef: string | null
  workerDispatchRollbackRef: string | null
  queueRowsReadWithProvidedEvidence: number
  workerClaimsAcceptedWithProvidedEvidence: number
  workerDispatchHandoffsAcceptedWithProvidedEvidence: number
  workerDispatchLeasesReleasedWithProvidedEvidence: number
  queueRowsPersistedAfterCleanup: number
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofReport {
  schemaVersion:
    '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof'
  decision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF_DECISION
  status:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofStatus
  sourceQueueWriteSmokeProofDecision: string | null
  sourceExactExecutionAdmissionDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  validatorPolicy: {
    validatesSavedSmokeResultOnly: true
    noSupabaseMutationByValidator: true
    noLiveWorkerClaimByValidator: true
    noLiveWorkerDispatchByValidator: true
    noWorkerExecutionByValidator: true
    noToolExecutionByValidator: true
    noGpuRuntimeStartByValidator: true
    exactFiveCpuStaticToolsOnly: true
    cleanupMustPersistZeroRows: true
    nextGateRequiresToolExecutionDryRunProof: true
  }
  rejectionReasons: string[]
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofRow[]
  counts: {
    totalAiGraphicsTools: 21
    sourceQueueWriteSmokeProofAcceptedTools: number
    savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence: number
    savedWorkerClaimAndDispatchSmokeRejectedTools: number
    exactRequestLineagePreservedWithProvidedEvidenceTools: number
    queueRowsReadAcceptedWithProvidedEvidence: number
    workerClaimsAcceptedWithProvidedEvidence: number
    workerDispatchHandoffsAcceptedWithProvidedEvidence: number
    workerDispatchLeasesReleasedWithProvidedEvidence: number
    queueRowsPersistedAfterCleanup: number
    workerExecutionsPerformedNow: 0
    toolExecutionsPerformedNow: 0
    externalAgentExecutableNowTools: 0
    publicArtifactCreatedTools: 0
    signedUrlCreatedTools: 0
    gpuRuntimeShouldStartNowTools: 0
  }
  booleans: {
    externalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofValidatorPrepared:
      true
    sourceNonProductionServiceRoleQueueWriteSmokeProofAccepted: boolean
    sourceExactExecutionAdmissionAccepted: boolean
    savedWorkerClaimAndDispatchSmokeResultProvided: boolean
    workerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence: boolean
    allFiveCpuStaticWorkerClaimAndDispatchSmokeResultsAcceptedWithProvidedEvidence:
      boolean
    allFiveCpuStaticExactRequestLineagesPreservedWithProvidedEvidence: boolean
    cleanupVerifiedWithProvidedEvidence: boolean
    workerDispatchLeasesReleasedWithProvidedEvidence: boolean
    serverOnlyServiceRoleCredentialsRequired: true
    nonProductionEnvironmentRequired: true
    noSupabaseMutationByValidator: true
    noLiveWorkerClaimByValidator: true
    noLiveWorkerDispatchByValidator: true
    noWorkerExecutionByValidator: true
    noToolExecutionByValidator: true
    noGpuRuntimeStartByValidator: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
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
    workerClaimAndDispatchSmokePerformedByValidator: false
    backendQueueSubmissionPerformed: false
    liveQueueWritePerformedByValidator: false
    workerEnqueuePerformed: false
    workerClaimPerformedByValidator: false
    workerDispatchPerformedByValidator: false
    workerExecutionPerformed: false
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
  safeCommands: string[]
  nextMilestone: string
}

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function sameFiveToolSet(toolIds: readonly string[] | undefined): boolean {
  if (!toolIds) return false
  const expected = [...proofTools].sort()
  const actual = [...toolIds].sort()
  return expected.length === actual.length &&
    expected.every((toolId, index) => toolId === actual[index])
}

function sourceAccepted(
  packet?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport,
): boolean {
  return packet?.decision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION &&
    packet.status ===
      'accepted_saved_non_production_service_role_queue_write_smoke_result_execution_blocked' &&
    packet.counts?.savedSmokeResultAcceptedToolsWithProvidedEvidence === 5 &&
    packet.counts?.serviceRoleQueueWritesAcceptedWithProvidedEvidence === 5 &&
    packet.counts?.queueRowsPersistedAfterCleanup === 0 &&
    packet.counts?.workerClaimsCreatedNow === 0 &&
    packet.counts?.workerDispatchesPerformedNow === 0 &&
    packet.counts?.workerExecutionsPerformedNow === 0 &&
    packet.counts?.toolExecutionsPerformedNow === 0 &&
    packet.booleans?.serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence === true &&
    packet.booleans?.allFiveCpuStaticSavedSmokeResultsAcceptedWithProvidedEvidence === true &&
    packet.booleans?.cleanupVerifiedWithProvidedEvidence === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.workerClaimApprovedNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false
}

function sourceExactExecutionAdmissionAccepted(
  packet?: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport,
): boolean {
  return packet?.decision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION_DECISION &&
    packet.status ===
      'external_agent_cpu_static_private_worker_exact_execution_admission_prepared_five_with_runtime_blocks' &&
    packet.counts?.exactExecutionAdmissionReadyTools === 5 &&
    packet.counts?.exactRequestEnvelopeAcceptedTools === 5 &&
    packet.counts?.approvedPlanSnapshotAcceptedTools === 5 &&
    packet.counts?.creditReservationAcceptedTools === 5 &&
    packet.counts?.privateArtifactManifestAcceptedTools === 5 &&
    packet.counts?.workerAcceptedRequestSchemaAcceptedTools === 5 &&
    packet.counts?.toolSpecificQaGateAcceptedTools === 5 &&
    packet.counts?.externalAgentExecutableNowTools === 0 &&
    packet.counts?.workerClaimApprovedNowTools === 0 &&
    packet.counts?.workerDispatchApprovedNowTools === 0 &&
    packet.counts?.toolExecutionApprovedNowTools === 0 &&
    packet.counts?.gpuRuntimeShouldStartNowTools === 0 &&
    packet.booleans?.allFiveExactExecutionAdmissionsReady === true &&
    packet.booleans?.allFiveExactRequestEnvelopesAccepted === true &&
    packet.booleans?.allFiveApprovedPlanSnapshotsAccepted === true &&
    packet.booleans?.allFiveCreditReservationsAccepted === true &&
    packet.booleans?.allFivePrivateArtifactManifestsAccepted === true &&
    packet.booleans?.allFiveWorkerAcceptedRequestSchemasAccepted === true &&
    packet.booleans?.allFiveToolSpecificQaGatesAccepted === true &&
    packet.booleans?.exactExecutionAdmissionRefsPreserved === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.workerClaimApprovedNow === false &&
    packet.booleans?.workerDispatchApprovedNow === false &&
    packet.booleans?.toolExecutionApprovedNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false
}

function sourceRow(
  packet:
    | AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport
    | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofRow | undefined {
  return packet?.rows?.find((row) => row.toolId === toolId)
}

function exactAdmissionSourceRow(
  packet:
    | AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionReport
    | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow | undefined {
  return packet?.rows?.find((row) => row.toolId === toolId)
}

function exactLineageFor(input: {
  toolId: AiGraphicsCanonicalToolId
  exactSource?: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow
  exactSourceAccepted: boolean
  accepted: boolean
  result?: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeResult
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchRequestLineage | null {
  if (!input.accepted || !input.exactSourceAccepted || !input.result) return null
  const evidence: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionEvidence | null | undefined =
    input.exactSource?.exactExecutionAdmissionEvidence
  if (!evidence) return null
  const base =
    `worker-claim-dispatch://ai-graphics/external-agent/cpu-static-private-worker-claim-and-dispatch-smoke-proof/${input.toolId}`
  return {
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    approvedPlanSnapshotRef: evidence.approvedPlanSnapshotRef,
    creditReservationRef: evidence.creditReservationRef,
    privateArtifactManifestRef: evidence.privateArtifactManifestRef,
    queuePayloadIdempotencyKey: evidence.queuePayloadIdempotencyKey,
    controlledToolExecutionIdempotencyKey: evidence.controlledToolExecutionIdempotencyKey,
    exactExecutionAdmissionIdempotencyKey: evidence.exactExecutionAdmissionIdempotencyKey,
    sourceControlledToolExecutionEvidenceRef: evidence.sourceControlledToolExecutionEvidenceRef,
    sourcePhase0LocalArtifactEvidenceRef: evidence.sourcePhase0LocalArtifactEvidenceRef,
    sourceAdapterInvocationDryRunRef: evidence.sourceAdapterInvocationDryRunRef,
    externalAgentExactRequestEnvelopeRef: evidence.externalAgentExactRequestEnvelopeRef,
    externalAgentAdmissionDecisionRef: evidence.externalAgentAdmissionDecisionRef,
    workerAcceptedRequestSchemaRef: evidence.workerAcceptedRequestSchemaRef,
    privateOutputManifestRef: evidence.privateOutputManifestRef,
    toolResultSchemaRef: evidence.toolResultSchemaRef,
    toolSpecificQaGateRef: evidence.toolSpecificQaGateRef,
    executionUnlockConditionRef: evidence.executionUnlockConditionRef,
    workerClaimAndDispatchEvidenceRef:
      `${input.result.privateEvidenceRef}#${input.toolId}`,
    workerClaimAndDispatchTelemetryRef:
      `${input.result.telemetryRef}#${input.toolId}`,
    workerClaimAndDispatchLeaseAuditRef:
      `${input.result.leaseAuditRef}#${input.toolId}`,
    workerClaimAndDispatchCleanupProofRef:
      `${input.result.cleanupProofRef}#${input.toolId}`,
    workerClaimAndDispatchRollbackRef:
      `${input.result.rollbackRef}#${input.toolId}`,
    workerClaimAndDispatchHandoffRef: `${base}/handoff`,
    expectedOutputVisibility: evidence.expectedOutputVisibility,
  }
}

function validateSmokeResult(
  result:
    | AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeResult
    | undefined,
): string[] {
  if (!result) {
    return ['saved worker claim and dispatch smoke result is missing']
  }
  return [
    result.ok !== true ? 'worker claim/dispatch smoke result ok flag is not true' : undefined,
    result.decision !==
      'ai_graphics_external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_passed_with_cleanup'
      ? 'worker claim/dispatch smoke result decision is not accepted'
      : undefined,
    result.status !==
      'non_production_worker_claim_and_dispatch_smoke_passed_with_cleanup_no_tool_execution'
      ? 'worker claim/dispatch smoke result status is not accepted'
      : undefined,
    result.queueName !== AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
      ? 'worker claim/dispatch smoke result queue name is not accepted'
      : undefined,
    result.toolsClaimed !== 5 ? 'worker claim/dispatch smoke must claim five tools' : undefined,
    !sameFiveToolSet(result.toolsClaimedIds)
      ? 'worker claim/dispatch smoke tool ids must match the five CPU/static tools'
      : undefined,
    result.queueRowsRead !== 5 ? 'worker claim/dispatch smoke must read five queue rows' : undefined,
    result.workerClaimsCreated !== 5 ? 'worker claim/dispatch smoke must create five worker claims' : undefined,
    result.workerDispatchHandoffsCreated !== 5
      ? 'worker claim/dispatch smoke must create five dispatch handoffs'
      : undefined,
    result.workerDispatchLeasesReleased !== 5
      ? 'worker claim/dispatch smoke must release five worker dispatch leases'
      : undefined,
    result.workerExecutionsPerformed !== 0
      ? 'worker claim/dispatch smoke must not execute workers'
      : undefined,
    result.toolExecutionsPerformed !== 0
      ? 'worker claim/dispatch smoke must not execute tools'
      : undefined,
    result.queueRowsCleanedUp !== 5 ? 'worker claim/dispatch smoke must clean up five queue rows' : undefined,
    result.queueRowsPersistedAfterCleanup !== 0
      ? 'worker claim/dispatch smoke must leave zero persisted queue rows after cleanup'
      : undefined,
    !hasValue(result.serviceRoleBoundaryRef)
      ? 'worker claim/dispatch smoke must include service-role boundary ref'
      : undefined,
    !hasValue(result.privateEvidenceRef)
      ? 'worker claim/dispatch smoke must include private evidence ref'
      : undefined,
    !hasValue(result.telemetryRef)
      ? 'worker claim/dispatch smoke must include telemetry ref'
      : undefined,
    !hasValue(result.leaseAuditRef)
      ? 'worker claim/dispatch smoke must include lease audit ref'
      : undefined,
    !hasValue(result.cleanupProofRef)
      ? 'worker claim/dispatch smoke must include cleanup proof ref'
      : undefined,
    !hasValue(result.rollbackRef)
      ? 'worker claim/dispatch smoke must include rollback ref'
      : undefined,
    result.sourceQueueWriteSmokeProofDecision !==
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION
      ? 'worker claim/dispatch smoke must preserve source queue-write smoke proof decision'
      : undefined,
    result.sourceQueueWriteSmokeProofAccepted !== true
      ? 'worker claim/dispatch smoke must preserve source queue-write smoke proof acceptance'
      : undefined,
    result.liveWorkerClaimAndDispatchSmokeExecutedNow !== true
      ? 'worker claim/dispatch smoke result must come from the explicit non-production smoke'
      : undefined,
    result.publicArtifactCreated !== false
      ? 'worker claim/dispatch smoke must not create public artifacts'
      : undefined,
    result.signedUrlCreated !== false
      ? 'worker claim/dispatch smoke must not create signed URLs'
      : undefined,
    result.gpuRuntimeShouldStartNow !== false
      ? 'worker claim/dispatch smoke must not start GPU runtime'
      : undefined,
    result.externalAgentExecutableNowTools !== 0
      ? 'worker claim/dispatch smoke must not mark tools executable now'
      : undefined,
    result.runtimeReadyNow !== false
      ? 'worker claim/dispatch smoke must not mark runtime ready'
      : undefined,
    result.externalBetaReadyNow !== false
      ? 'worker claim/dispatch smoke must not mark external beta ready'
      : undefined,
    result.productionReadyNow !== false
      ? 'worker claim/dispatch smoke must not mark production ready'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function reportStatus(input: {
  sourceAccepted: boolean
  exactSourceAccepted: boolean
  resultProvided: boolean
  resultAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofStatus {
  if (!input.sourceAccepted) {
    return 'blocked_pending_source_non_production_service_role_queue_write_smoke_proof'
  }
  if (!input.exactSourceAccepted) {
    return 'blocked_pending_source_exact_execution_admission'
  }
  if (!input.resultProvided) {
    return 'blocked_pending_saved_worker_claim_and_dispatch_smoke_result'
  }
  return input.resultAccepted
    ? 'accepted_saved_worker_claim_and_dispatch_smoke_result_execution_blocked'
    : 'rejected_saved_worker_claim_and_dispatch_smoke_result'
}

function buildRow(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofRow
  exactSource?: AiGraphicsExternalAgentCpuStaticPrivateWorkerExactExecutionAdmissionRow
  sourceAccepted: boolean
  exactSourceAccepted: boolean
  result?: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeResult
  resultAccepted: boolean
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofStatus
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofRow {
  const isProofTool = proofTools.includes(input.toolId)
  const accepted = isProofTool && input.resultAccepted
  const exactRequestLineage = exactLineageFor({
    toolId: input.toolId,
    exactSource: input.exactSource,
    exactSourceAccepted: input.exactSourceAccepted,
    accepted,
    result: input.result,
  })
  return {
    toolId: input.toolId,
    productionToolId:
      input.source?.productionToolId ?? (`ai_graphics_${input.toolId}` as ProductionToolId),
    workerType: input.source?.workerType ?? 'tool_readiness_worker',
    runtimeTarget: input.source?.runtimeTarget ?? 'deferred',
    queueName: isProofTool ? AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME : null,
    sourceQueueWriteSmokeProofStatus:
      input.source?.serviceRoleQueueWriteSmokeProofStatus ?? null,
    sourceQueueWriteSmokeProofAccepted:
      input.source?.serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence === true,
    sourceExactExecutionAdmissionStatus:
      input.exactSource?.exactExecutionAdmissionStatus ?? null,
    sourceExactExecutionAdmissionAccepted:
      input.exactSource?.externalAgentExactRequestAdmittedWithProvidedEvidence === true,
    workerClaimAndDispatchSmokeProofStatus: isProofTool
      ? input.status
      : 'blocked_pending_source_non_production_service_role_queue_write_smoke_proof',
    workerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence: accepted,
    exactRequestLineagePreserved: exactRequestLineage !== null,
    exactRequestLineage,
    workerClaimEvidenceRef: accepted ? input.result?.privateEvidenceRef ?? null : null,
    workerDispatchEvidenceRef: accepted ? input.result?.privateEvidenceRef ?? null : null,
    workerDispatchTelemetryRef: accepted ? input.result?.telemetryRef ?? null : null,
    workerLeaseAuditRef: accepted ? input.result?.leaseAuditRef ?? null : null,
    workerDispatchCleanupProofRef: accepted ? input.result?.cleanupProofRef ?? null : null,
    workerDispatchRollbackRef: accepted ? input.result?.rollbackRef ?? null : null,
    queueRowsReadWithProvidedEvidence: accepted ? 1 : 0,
    workerClaimsAcceptedWithProvidedEvidence: accepted ? 1 : 0,
    workerDispatchHandoffsAcceptedWithProvidedEvidence: accepted ? 1 : 0,
    workerDispatchLeasesReleasedWithProvidedEvidence: accepted ? 1 : 0,
    queueRowsPersistedAfterCleanup: accepted
      ? input.result?.queueRowsPersistedAfterCleanup ?? 0
      : 0,
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
    blocker: accepted
      ? 'saved worker claim and dispatch smoke result accepted; worker execution, tool execution, runtime, external beta, and production remain blocked'
      : isProofTool
        ? 'waiting for saved worker claim and dispatch smoke result with lease release and cleanup proof'
        : input.toolId === 'satori'
          ? 'blocked pending approved Satori font fixture proof before worker claim and dispatch smoke proof'
          : 'deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes',
    nextProofMilestone: accepted
      ? 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF'
      : 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF',
  }
}

export function evaluateAiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProof(
  input:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofReport {
  const sourceIsAccepted = sourceAccepted(input.sourceQueueWriteSmokeProofPacket)
  const exactSourceIsAccepted = sourceExactExecutionAdmissionAccepted(
    input.sourceExactExecutionAdmissionPacket,
  )
  const resultRejections = validateSmokeResult(input.workerClaimAndDispatchSmokeResult)
  const resultProvided = Boolean(input.workerClaimAndDispatchSmokeResult)
  const resultAccepted =
    sourceIsAccepted &&
    exactSourceIsAccepted &&
    resultProvided &&
    resultRejections.length === 0
  const status = reportStatus({
    sourceAccepted: sourceIsAccepted,
    exactSourceAccepted: exactSourceIsAccepted,
    resultProvided,
    resultAccepted,
  })
  const rejectionReasons = [
    !sourceIsAccepted
      ? 'source non-production service-role queue-write smoke proof is missing or not accepted'
      : undefined,
    !exactSourceIsAccepted
      ? 'source exact execution admission is missing or not accepted'
      : undefined,
    ...resultRejections,
  ].filter((reason): reason is string => Boolean(reason))
  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) =>
    buildRow({
      toolId,
      source: sourceRow(input.sourceQueueWriteSmokeProofPacket, toolId),
      exactSource: exactAdmissionSourceRow(input.sourceExactExecutionAdmissionPacket, toolId),
      sourceAccepted: sourceIsAccepted,
      exactSourceAccepted: exactSourceIsAccepted,
      result: input.workerClaimAndDispatchSmokeResult,
      resultAccepted,
      status,
    }),
  )
  const acceptedRows = rows.filter(
    (row) => row.workerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence,
  )

  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof',
    decision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF_DECISION,
    status,
    sourceQueueWriteSmokeProofDecision:
      input.sourceQueueWriteSmokeProofPacket?.decision ?? null,
    sourceExactExecutionAdmissionDecision:
      input.sourceExactExecutionAdmissionPacket?.decision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...productFacingCapabilities],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    validatorPolicy: {
      validatesSavedSmokeResultOnly: true,
      noSupabaseMutationByValidator: true,
      noLiveWorkerClaimByValidator: true,
      noLiveWorkerDispatchByValidator: true,
      noWorkerExecutionByValidator: true,
      noToolExecutionByValidator: true,
      noGpuRuntimeStartByValidator: true,
      exactFiveCpuStaticToolsOnly: true,
      cleanupMustPersistZeroRows: true,
      nextGateRequiresToolExecutionDryRunProof: true,
    },
    rejectionReasons,
    rows,
    counts: {
      totalAiGraphicsTools: 21,
      sourceQueueWriteSmokeProofAcceptedTools:
        rows.filter((row) => row.sourceQueueWriteSmokeProofAccepted).length,
      savedWorkerClaimAndDispatchSmokeAcceptedToolsWithProvidedEvidence:
        acceptedRows.length,
      savedWorkerClaimAndDispatchSmokeRejectedTools:
        resultProvided && !resultAccepted ? proofTools.length : 0,
      exactRequestLineagePreservedWithProvidedEvidenceTools:
        rows.filter((row) => row.exactRequestLineagePreserved).length,
      queueRowsReadAcceptedWithProvidedEvidence:
        resultAccepted ? input.workerClaimAndDispatchSmokeResult?.queueRowsRead ?? 0 : 0,
      workerClaimsAcceptedWithProvidedEvidence:
        resultAccepted ? input.workerClaimAndDispatchSmokeResult?.workerClaimsCreated ?? 0 : 0,
      workerDispatchHandoffsAcceptedWithProvidedEvidence:
        resultAccepted
          ? input.workerClaimAndDispatchSmokeResult?.workerDispatchHandoffsCreated ?? 0
          : 0,
      workerDispatchLeasesReleasedWithProvidedEvidence:
        resultAccepted
          ? input.workerClaimAndDispatchSmokeResult?.workerDispatchLeasesReleased ?? 0
          : 0,
      queueRowsPersistedAfterCleanup:
        resultAccepted
          ? input.workerClaimAndDispatchSmokeResult?.queueRowsPersistedAfterCleanup ?? 0
          : 0,
      workerExecutionsPerformedNow: 0,
      toolExecutionsPerformedNow: 0,
      externalAgentExecutableNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    booleans: {
      externalAgentCpuStaticPrivateWorkerClaimAndDispatchSmokeProofValidatorPrepared:
        true,
      sourceNonProductionServiceRoleQueueWriteSmokeProofAccepted: sourceIsAccepted,
      sourceExactExecutionAdmissionAccepted: exactSourceIsAccepted,
      savedWorkerClaimAndDispatchSmokeResultProvided: resultProvided,
      workerClaimAndDispatchSmokeProofAcceptedWithProvidedEvidence: resultAccepted,
      allFiveCpuStaticWorkerClaimAndDispatchSmokeResultsAcceptedWithProvidedEvidence:
        acceptedRows.length === 5,
      allFiveCpuStaticExactRequestLineagesPreservedWithProvidedEvidence:
        acceptedRows.length === 5 &&
        acceptedRows.every((row) => {
          const lineage = row.exactRequestLineage
          if (!lineage) return false
          return (
            lineage.approvedPlanSnapshotRef.startsWith('approved-plan-snapshot://') &&
            lineage.creditReservationRef.startsWith('credit-reservation://') &&
            lineage.privateArtifactManifestRef.startsWith('private://') &&
            lineage.queuePayloadIdempotencyKey.includes(row.toolId) &&
            lineage.externalAgentExactRequestEnvelopeRef.includes(row.toolId) &&
            lineage.workerAcceptedRequestSchemaRef.includes(row.toolId) &&
            lineage.toolResultSchemaRef.includes(row.toolId) &&
            lineage.toolSpecificQaGateRef.includes(row.toolId) &&
            lineage.workerClaimAndDispatchEvidenceRef.startsWith('private://') &&
            lineage.workerClaimAndDispatchTelemetryRef.startsWith('private://') &&
            lineage.workerClaimAndDispatchLeaseAuditRef.startsWith('private://') &&
            lineage.workerClaimAndDispatchHandoffRef.includes(row.toolId) &&
            lineage.expectedOutputVisibility === 'private_artifact_only'
          )
        }),
      cleanupVerifiedWithProvidedEvidence:
        resultAccepted &&
        input.workerClaimAndDispatchSmokeResult?.queueRowsPersistedAfterCleanup === 0,
      workerDispatchLeasesReleasedWithProvidedEvidence:
        resultAccepted &&
        input.workerClaimAndDispatchSmokeResult?.workerDispatchLeasesReleased === 5,
      serverOnlyServiceRoleCredentialsRequired: true,
      nonProductionEnvironmentRequired: true,
      noSupabaseMutationByValidator: true,
      noLiveWorkerClaimByValidator: true,
      noLiveWorkerDispatchByValidator: true,
      noWorkerExecutionByValidator: true,
      noToolExecutionByValidator: true,
      noGpuRuntimeStartByValidator: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
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
      workerClaimAndDispatchSmokePerformedByValidator: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWritePerformedByValidator: false,
      workerEnqueuePerformed: false,
      workerClaimPerformedByValidator: false,
      workerDispatchPerformedByValidator: false,
      workerExecutionPerformed: false,
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
    safeCommands: [
      'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof:diagnostics',
      'npm run ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof:diagnostics',
    ],
    nextMilestone: resultAccepted
      ? 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF'
      : 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF',
  }
}
