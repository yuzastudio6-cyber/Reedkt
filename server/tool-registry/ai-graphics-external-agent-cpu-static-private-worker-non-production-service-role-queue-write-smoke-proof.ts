import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
} from './ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_proof_validator_prepared_with_runtime_blocks'

const proofTools: AiGraphicsCanonicalToolId[] = [
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
]

const queueWriteSmokeRunnerRequiredFlags = [
  '--execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke',
  '--workspace-id',
  '--project-id',
  '--approved-plan-snapshot-id',
  '--credit-reservation-id',
  '--idempotency-prefix',
  '--source-non-production-service-role-queue-write-smoke-preflight-packet',
  '--service-role-boundary-ref',
  '--private-evidence-ref',
  '--telemetry-ref',
  '--cleanup-proof-ref',
  '--rollback-ref',
  '--output-result',
]

const productFacingCapabilities = AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter(
  (capabilityId) =>
    capabilityId !== 'planning_metadata_only' &&
    capabilityId !== 'blocked_or_deferred',
)

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofStatus =
  | 'blocked_pending_source_non_production_service_role_queue_write_smoke_preflight'
  | 'blocked_pending_saved_non_production_service_role_queue_write_smoke_result'
  | 'rejected_saved_non_production_service_role_queue_write_smoke_result'
  | 'accepted_saved_non_production_service_role_queue_write_smoke_result_execution_blocked'

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeResult {
  ok: true
  decision:
    'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_passed_with_cleanup'
  status:
    'non_production_service_role_queue_write_smoke_passed_with_cleanup_no_worker_dispatch_or_tool_execution'
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  toolsSubmitted: 5
  toolsSubmittedIds: AiGraphicsCanonicalToolId[]
  queueRowsWritten: 5
  queueRowsCleanedUp: 5
  queueRowsPersistedAfterCleanup: 0
  workerClaimsCreated: 0
  workerDispatchesPerformed: 0
  workerExecutionsPerformed: 0
  toolExecutionsPerformed: 0
  serviceRoleBoundaryRef: string
  privateEvidenceRef: string
  telemetryRef: string
  cleanupProofRef: string
  rollbackRef: string
  sourcePreflightDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION
  sourcePreflightAccepted: true
  liveServiceRoleQueueWriteSmokeExecutedNow: true
  liveSupabaseQueueWritesNow: 5
  publicArtifactCreated: false
  signedUrlCreated: false
  gpuRuntimeShouldStartNow: false
  externalAgentExecutableNowTools: 0
  runtimeReadyNow: false
  externalBetaReadyNow: false
  productionReadyNow: false
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofInput {
  sourcePreflightPacket?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport
  serviceRoleQueueWriteSmokeResult?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeResult
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeOperatorResultTemplate {
  schemaVersion:
    '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-operator-result-template'
  templateMode:
    'operator_must_execute_non_production_queue_write_then_fill_saved_result'
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  sourcePreflightDecision: string | null
  sourcePreflightAccepted: boolean
  toolsSubmitted: 5
  toolsSubmittedIds: AiGraphicsCanonicalToolId[]
  expectedQueueRowsWritten: 5
  expectedQueueRowsCleanedUp: 5
  expectedQueueRowsPersistedAfterCleanup: 0
  expectedWorkerClaimsCreated: 0
  expectedWorkerDispatchesPerformed: 0
  expectedWorkerExecutionsPerformed: 0
  expectedToolExecutionsPerformed: 0
  requiredEnvironment: string[]
  requiredFlags: string[]
  requiredResultFields: Array<
    keyof AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeResult
  >
  perToolQueueRows: Array<{
    toolId: AiGraphicsCanonicalToolId
    productionToolId: ProductionToolId
    workerType: ProductionRegistryWorkerType
    runtimeTarget: AiGraphicsRuntimeTarget | 'deferred'
    queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
    sourcePreflightStatus: string | null
    sourceWorkerEnqueuePayloadRef: string | null
    sourceBackendQueueAdapterRef: string | null
    privateArtifactManifestRef: string | null
    expectedOutputVisibility: 'private_artifact_only'
  }>
  evidenceRefTemplate: {
    serviceRoleBoundaryRef: string
    privateEvidenceRef: string
    telemetryRef: string
    cleanupProofRef: string
    rollbackRef: string
  }
  localOnlySuggestedResultPath: string
  operatorPreflightCommand: string
  runnerCommand: string
  validatorCommand: string
  canBeUsedAsAcceptedResultWithoutLiveSmoke: false
  agentCanExecuteToolsNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  gpuRuntimeShouldStartNow: false
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget | 'deferred'
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME | null
  sourcePreflightStatus: string | null
  sourcePreflightReady: boolean
  serviceRoleQueueWriteSmokeProofStatus:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofStatus
  serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence: boolean
  serviceRoleQueueWriteSmokeEvidenceRef: string | null
  serviceRoleQueueWriteSmokeTelemetryRef: string | null
  serviceRoleQueueWriteSmokeCleanupProofRef: string | null
  serviceRoleQueueWriteSmokeRollbackRef: string | null
  queueRowsWrittenWithProvidedEvidence: number
  queueRowsPersistedAfterCleanup: number
  serviceRoleQueueWriteSmokeApprovedNow: false
  liveQueueWriteApprovedNow: false
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport {
  schemaVersion:
    '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof'
  decision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION
  status:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofStatus
  sourcePreflightDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  validatorPolicy: {
    validatesSavedSmokeResultOnly: true
    noSupabaseMutationByValidator: true
    noLiveQueueWriteByValidator: true
    noWorkerClaimByValidator: true
    noWorkerDispatchByValidator: true
    noToolExecutionByValidator: true
    noGpuRuntimeStartByValidator: true
    exactFiveCpuStaticToolsOnly: true
    cleanupMustPersistZeroRows: true
    nextGateRequiresWorkerClaimAndDispatchSmoke: true
  }
  operatorResultTemplate:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeOperatorResultTemplate
  rejectionReasons: string[]
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofRow[]
  counts: {
    totalAiGraphicsTools: 21
    sourcePreflightReadyTools: number
    savedSmokeResultAcceptedToolsWithProvidedEvidence: number
    savedSmokeResultRejectedTools: number
    serviceRoleQueueWritesAcceptedWithProvidedEvidence: number
    queueRowsPersistedAfterCleanup: number
    workerClaimsCreatedNow: 0
    workerDispatchesPerformedNow: 0
    workerExecutionsPerformedNow: 0
    toolExecutionsPerformedNow: 0
    externalAgentExecutableNowTools: 0
    publicArtifactCreatedTools: 0
    signedUrlCreatedTools: 0
    gpuRuntimeShouldStartNowTools: 0
  }
  booleans: {
    externalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofValidatorPrepared:
      true
    sourceNonProductionServiceRoleQueueWriteSmokePreflightAccepted: boolean
    savedNonProductionServiceRoleQueueWriteSmokeResultProvided: boolean
    serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence: boolean
    allFiveCpuStaticSavedSmokeResultsAcceptedWithProvidedEvidence: boolean
    cleanupVerifiedWithProvidedEvidence: boolean
    serverOnlyServiceRoleCredentialsRequired: true
    nonProductionEnvironmentRequired: true
    noSupabaseMutationByValidator: true
    noLiveQueueWriteByValidator: true
    noWorkerClaimByValidator: true
    noWorkerDispatchByValidator: true
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
    serviceRoleQueueWriteSmokeApprovedNow: false
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
    serviceRoleQueueWriteSmokePerformedByValidator: false
    backendQueueSubmissionPerformed: false
    liveQueueWritePerformedByValidator: false
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

function preflightAccepted(
  packet?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport,
): boolean {
  return packet?.decision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION &&
    packet.status ===
      'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_prepared_five_execution_blocked' &&
    packet.counts?.nonProductionServiceRoleQueueWriteSmokePreflightReadyTools === 5 &&
    packet.counts?.nonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidenceTools === 5 &&
    packet.counts?.serviceRoleQueueWriteSmokeApprovedNowTools === 0 &&
    packet.counts?.liveQueueWritePerformedNowTools === 0 &&
    packet.counts?.workerDispatchPerformedNowTools === 0 &&
    packet.counts?.toolExecutionPerformedNowTools === 0 &&
    packet.booleans?.allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReadyWithProvidedEvidence === true &&
    packet.booleans?.savedSmokeResultRequiredBeforeExecutionGateCanAdvance === true &&
    packet.booleans?.noLiveQueueWriteByPreflight === true &&
    packet.booleans?.noWorkerDispatchByPreflight === true &&
    packet.booleans?.noToolExecutionByPreflight === true &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false
}

function sourcePreflightRow(
  packet:
    | AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport
    | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow | undefined {
  return packet?.rows?.find((row) => row.toolId === toolId)
}

function validateSmokeResult(
  result:
    | AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeResult
    | undefined,
): string[] {
  if (!result) {
    return ['saved non-production service-role queue-write smoke result is missing']
  }
  return [
    result.ok !== true ? 'smoke result ok flag is not true' : undefined,
    result.decision !==
      'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_passed_with_cleanup'
      ? 'smoke result decision is not accepted'
      : undefined,
    result.status !==
      'non_production_service_role_queue_write_smoke_passed_with_cleanup_no_worker_dispatch_or_tool_execution'
      ? 'smoke result status is not accepted'
      : undefined,
    result.queueName !== AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
      ? 'smoke result queue name is not accepted'
      : undefined,
    result.toolsSubmitted !== 5 ? 'smoke result must submit exactly five CPU/static tools' : undefined,
    !sameFiveToolSet(result.toolsSubmittedIds)
      ? 'smoke result tool ids must match the five CPU/static tools'
      : undefined,
    result.queueRowsWritten !== 5 ? 'smoke result must write five queue rows' : undefined,
    result.queueRowsCleanedUp !== 5 ? 'smoke result must clean up five queue rows' : undefined,
    result.queueRowsPersistedAfterCleanup !== 0
      ? 'smoke result must leave zero persisted queue rows after cleanup'
      : undefined,
    result.workerClaimsCreated !== 0 ? 'smoke result must not create worker claims' : undefined,
    result.workerDispatchesPerformed !== 0 ? 'smoke result must not dispatch workers' : undefined,
    result.workerExecutionsPerformed !== 0 ? 'smoke result must not execute workers' : undefined,
    result.toolExecutionsPerformed !== 0 ? 'smoke result must not execute tools' : undefined,
    !hasValue(result.serviceRoleBoundaryRef)
      ? 'smoke result must include service-role boundary ref'
      : undefined,
    !hasValue(result.privateEvidenceRef)
      ? 'smoke result must include private evidence ref'
      : undefined,
    !hasValue(result.telemetryRef)
      ? 'smoke result must include telemetry ref'
      : undefined,
    !hasValue(result.cleanupProofRef)
      ? 'smoke result must include cleanup proof ref'
      : undefined,
    !hasValue(result.rollbackRef)
      ? 'smoke result must include rollback ref'
      : undefined,
    result.sourcePreflightDecision !==
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION
      ? 'smoke result must preserve source preflight decision'
      : undefined,
    result.sourcePreflightAccepted !== true
      ? 'smoke result must preserve source preflight acceptance'
      : undefined,
    result.liveServiceRoleQueueWriteSmokeExecutedNow !== true
      ? 'smoke result must come from the explicit non-production live smoke'
      : undefined,
    result.liveSupabaseQueueWritesNow !== 5
      ? 'smoke result must report five live non-production queue writes'
      : undefined,
    result.publicArtifactCreated !== false
      ? 'smoke result must not create public artifacts'
      : undefined,
    result.signedUrlCreated !== false
      ? 'smoke result must not create signed URLs'
      : undefined,
    result.gpuRuntimeShouldStartNow !== false
      ? 'smoke result must not start GPU runtime'
      : undefined,
    result.externalAgentExecutableNowTools !== 0
      ? 'smoke result must not mark tools executable now'
      : undefined,
    result.runtimeReadyNow !== false
      ? 'smoke result must not mark runtime ready'
      : undefined,
    result.externalBetaReadyNow !== false
      ? 'smoke result must not mark external beta ready'
      : undefined,
    result.productionReadyNow !== false
      ? 'smoke result must not mark production ready'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function reportStatus(input: {
  sourceAccepted: boolean
  resultProvided: boolean
  resultAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofStatus {
  if (!input.sourceAccepted) {
    return 'blocked_pending_source_non_production_service_role_queue_write_smoke_preflight'
  }
  if (!input.resultProvided) {
    return 'blocked_pending_saved_non_production_service_role_queue_write_smoke_result'
  }
  return input.resultAccepted
    ? 'accepted_saved_non_production_service_role_queue_write_smoke_result_execution_blocked'
    : 'rejected_saved_non_production_service_role_queue_write_smoke_result'
}

function operatorResultTemplateFor(input: {
  sourcePreflightPacket:
    | AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport
    | undefined
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeOperatorResultTemplate {
  const readyRows =
    input.sourcePreflightPacket?.rows?.filter(
      (row) =>
        proofTools.includes(row.toolId) &&
        row.nonProductionServiceRoleQueueWriteSmokePreflightReady === true,
    ) ?? []
  const firstContract = readyRows.find((row) => row.preflightContract)?.preflightContract
  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-operator-result-template',
    templateMode:
      'operator_must_execute_non_production_queue_write_then_fill_saved_result',
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    sourcePreflightDecision: input.sourcePreflightPacket?.decision ?? null,
    sourcePreflightAccepted: input.sourceAccepted,
    toolsSubmitted: 5,
    toolsSubmittedIds: [...proofTools],
    expectedQueueRowsWritten: 5,
    expectedQueueRowsCleanedUp: 5,
    expectedQueueRowsPersistedAfterCleanup: 0,
    expectedWorkerClaimsCreated: 0,
    expectedWorkerDispatchesPerformed: 0,
    expectedWorkerExecutionsPerformed: 0,
    expectedToolExecutionsPerformed: 0,
    requiredEnvironment: [...(firstContract?.requiredEnvironment ?? [])],
    requiredFlags: [...queueWriteSmokeRunnerRequiredFlags],
    requiredResultFields: [
      'ok',
      'decision',
      'status',
      'queueName',
      'toolsSubmitted',
      'toolsSubmittedIds',
      'queueRowsWritten',
      'queueRowsCleanedUp',
      'queueRowsPersistedAfterCleanup',
      'workerClaimsCreated',
      'workerDispatchesPerformed',
      'workerExecutionsPerformed',
      'toolExecutionsPerformed',
      'serviceRoleBoundaryRef',
      'privateEvidenceRef',
      'telemetryRef',
      'cleanupProofRef',
      'rollbackRef',
      'sourcePreflightDecision',
      'sourcePreflightAccepted',
      'liveServiceRoleQueueWriteSmokeExecutedNow',
      'liveSupabaseQueueWritesNow',
      'publicArtifactCreated',
      'signedUrlCreated',
      'gpuRuntimeShouldStartNow',
      'externalAgentExecutableNowTools',
      'runtimeReadyNow',
      'externalBetaReadyNow',
      'productionReadyNow',
    ],
    perToolQueueRows: readyRows.map((row) => ({
      toolId: row.toolId,
      productionToolId: row.productionToolId,
      workerType: row.workerType,
      runtimeTarget: row.runtimeTarget,
      queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
      sourcePreflightStatus: row.nonProductionServiceRoleQueueWriteSmokePreflightStatus,
      sourceWorkerEnqueuePayloadRef:
        row.preflightEvidence?.sourceWorkerEnqueuePayloadRef ?? null,
      sourceBackendQueueAdapterRef:
        row.preflightEvidence?.sourceBackendQueueAdapterRef ?? null,
      privateArtifactManifestRef:
        row.preflightEvidence?.privateArtifactManifestRef ?? null,
      expectedOutputVisibility:
        row.preflightEvidence?.expectedOutputVisibility ?? 'private_artifact_only',
    })),
    evidenceRefTemplate: {
      serviceRoleBoundaryRef:
        'service-role-boundary://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/non-production',
      privateEvidenceRef:
        'private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/batch/evidence.json',
      telemetryRef:
        'private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/batch/telemetry.json',
      cleanupProofRef:
        'private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/batch/cleanup.json',
      rollbackRef:
        'private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/batch/rollback.json',
    },
    localOnlySuggestedResultPath:
      '.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-service-role-queue-write-smoke-result.json',
    operatorPreflightCommand:
      'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke -- --operator-preflight --execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke --source-non-production-service-role-queue-write-smoke-preflight-packet docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json --workspace-id <non-production-workspace-id> --project-id <non-production-project-id> --approved-plan-snapshot-id <approved-plan-snapshot-id> --credit-reservation-id <credit-reservation-id> --idempotency-prefix <unique-smoke-prefix> --service-role-boundary-ref <service-role-boundary-ref> --private-evidence-ref <private-evidence-ref> --telemetry-ref <telemetry-ref> --cleanup-proof-ref <cleanup-proof-ref> --rollback-ref <rollback-ref> --output-result .local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-service-role-queue-write-smoke-result.json',
    runnerCommand:
      'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke -- --execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke --source-non-production-service-role-queue-write-smoke-preflight-packet docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json --workspace-id <non-production-workspace-id> --project-id <non-production-project-id> --approved-plan-snapshot-id <approved-plan-snapshot-id> --credit-reservation-id <credit-reservation-id> --idempotency-prefix <unique-smoke-prefix> --service-role-boundary-ref <service-role-boundary-ref> --private-evidence-ref <private-evidence-ref> --telemetry-ref <telemetry-ref> --cleanup-proof-ref <cleanup-proof-ref> --rollback-ref <rollback-ref> --output-result .local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-service-role-queue-write-smoke-result.json',
    validatorCommand:
      'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof -- --external-agent-cpu-static-service-role-queue-write-smoke-result <local-result.json> --print-only',
    canBeUsedAsAcceptedResultWithoutLiveSmoke: false,
    agentCanExecuteToolsNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
  }
}

function buildRow(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow
  sourceAccepted: boolean
  result?: AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeResult
  resultAccepted: boolean
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofStatus
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofRow {
  const isProofTool = proofTools.includes(input.toolId)
  const accepted = isProofTool && input.resultAccepted
  return {
    toolId: input.toolId,
    productionToolId:
      input.source?.productionToolId ?? (`ai_graphics_${input.toolId}` as ProductionToolId),
    workerType: input.source?.workerType ?? 'tool_readiness_worker',
    runtimeTarget: input.source?.runtimeTarget ?? 'deferred',
    queueName: isProofTool ? AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME : null,
    sourcePreflightStatus:
      input.source?.nonProductionServiceRoleQueueWriteSmokePreflightStatus ?? null,
    sourcePreflightReady:
      input.source?.nonProductionServiceRoleQueueWriteSmokePreflightReady === true,
    serviceRoleQueueWriteSmokeProofStatus: isProofTool
      ? input.status
      : input.toolId === 'satori'
        ? 'blocked_pending_source_non_production_service_role_queue_write_smoke_preflight'
        : 'blocked_pending_source_non_production_service_role_queue_write_smoke_preflight',
    serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence: accepted,
    serviceRoleQueueWriteSmokeEvidenceRef: accepted ? input.result?.privateEvidenceRef ?? null : null,
    serviceRoleQueueWriteSmokeTelemetryRef: accepted ? input.result?.telemetryRef ?? null : null,
    serviceRoleQueueWriteSmokeCleanupProofRef: accepted ? input.result?.cleanupProofRef ?? null : null,
    serviceRoleQueueWriteSmokeRollbackRef: accepted ? input.result?.rollbackRef ?? null : null,
    queueRowsWrittenWithProvidedEvidence: accepted ? 1 : 0,
    queueRowsPersistedAfterCleanup: accepted ? input.result?.queueRowsPersistedAfterCleanup ?? 0 : 0,
    serviceRoleQueueWriteSmokeApprovedNow: false,
    liveQueueWriteApprovedNow: false,
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
      ? 'saved non-production service-role queue-write smoke result accepted; worker claim, dispatch, tool execution, runtime, external beta, and production remain blocked'
      : isProofTool
        ? 'waiting for saved non-production service-role queue-write smoke result with cleanup proof'
        : input.toolId === 'satori'
          ? 'blocked pending approved Satori font fixture proof before CPU/static service-role smoke proof'
          : 'deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes',
    nextProofMilestone: accepted
      ? 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF'
      : 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF',
  }
}

export function evaluateAiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProof(
  input:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofReport {
  const sourceAccepted = preflightAccepted(input.sourcePreflightPacket)
  const resultRejections = validateSmokeResult(input.serviceRoleQueueWriteSmokeResult)
  const resultProvided = Boolean(input.serviceRoleQueueWriteSmokeResult)
  const resultAccepted = sourceAccepted && resultProvided && resultRejections.length === 0
  const status = reportStatus({
    sourceAccepted,
    resultProvided,
    resultAccepted,
  })
  const rejectionReasons = [
    !sourceAccepted
      ? 'source non-production service-role queue-write smoke preflight is missing or not accepted'
      : undefined,
    ...resultRejections,
  ].filter((reason): reason is string => Boolean(reason))
  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) =>
    buildRow({
      toolId,
      source: sourcePreflightRow(input.sourcePreflightPacket, toolId),
      sourceAccepted,
      result: input.serviceRoleQueueWriteSmokeResult,
      resultAccepted,
      status,
    }),
  )
  const acceptedRows = rows.filter(
    (row) => row.serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence,
  )

  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof',
    decision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF_DECISION,
    status,
    sourcePreflightDecision: input.sourcePreflightPacket?.decision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...productFacingCapabilities],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    validatorPolicy: {
      validatesSavedSmokeResultOnly: true,
      noSupabaseMutationByValidator: true,
      noLiveQueueWriteByValidator: true,
      noWorkerClaimByValidator: true,
      noWorkerDispatchByValidator: true,
      noToolExecutionByValidator: true,
      noGpuRuntimeStartByValidator: true,
      exactFiveCpuStaticToolsOnly: true,
      cleanupMustPersistZeroRows: true,
      nextGateRequiresWorkerClaimAndDispatchSmoke: true,
    },
    operatorResultTemplate: operatorResultTemplateFor({
      sourcePreflightPacket: input.sourcePreflightPacket,
      sourceAccepted,
    }),
    rejectionReasons,
    rows,
    counts: {
      totalAiGraphicsTools: 21,
      sourcePreflightReadyTools:
        rows.filter((row) => row.sourcePreflightReady).length,
      savedSmokeResultAcceptedToolsWithProvidedEvidence: acceptedRows.length,
      savedSmokeResultRejectedTools:
        resultProvided && !resultAccepted ? proofTools.length : 0,
      serviceRoleQueueWritesAcceptedWithProvidedEvidence:
        resultAccepted ? input.serviceRoleQueueWriteSmokeResult?.queueRowsWritten ?? 0 : 0,
      queueRowsPersistedAfterCleanup:
        resultAccepted
          ? input.serviceRoleQueueWriteSmokeResult?.queueRowsPersistedAfterCleanup ?? 0
          : 0,
      workerClaimsCreatedNow: 0,
      workerDispatchesPerformedNow: 0,
      workerExecutionsPerformedNow: 0,
      toolExecutionsPerformedNow: 0,
      externalAgentExecutableNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    booleans: {
      externalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokeProofValidatorPrepared:
        true,
      sourceNonProductionServiceRoleQueueWriteSmokePreflightAccepted: sourceAccepted,
      savedNonProductionServiceRoleQueueWriteSmokeResultProvided: resultProvided,
      serviceRoleQueueWriteSmokeProofAcceptedWithProvidedEvidence: resultAccepted,
      allFiveCpuStaticSavedSmokeResultsAcceptedWithProvidedEvidence:
        acceptedRows.length === 5,
      cleanupVerifiedWithProvidedEvidence:
        resultAccepted &&
        input.serviceRoleQueueWriteSmokeResult?.queueRowsPersistedAfterCleanup === 0,
      serverOnlyServiceRoleCredentialsRequired: true,
      nonProductionEnvironmentRequired: true,
      noSupabaseMutationByValidator: true,
      noLiveQueueWriteByValidator: true,
      noWorkerClaimByValidator: true,
      noWorkerDispatchByValidator: true,
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
      serviceRoleQueueWriteSmokeApprovedNow: false,
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
      serviceRoleQueueWriteSmokePerformedByValidator: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWritePerformedByValidator: false,
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
    safeCommands: [
      'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight:diagnostics',
      'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof:diagnostics',
    ],
    nextMilestone: resultAccepted
      ? 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF'
      : 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF',
  }
}
