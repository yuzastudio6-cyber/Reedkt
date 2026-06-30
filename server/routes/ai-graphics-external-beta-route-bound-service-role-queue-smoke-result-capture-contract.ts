import {
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_RESULT_CAPTURE_CONTRACT_DECISION =
  'ai_graphics_external_beta_route_bound_service_role_queue_smoke_result_capture_contract_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContractStatus =
  | 'missing_route_bound_service_role_queue_smoke_runbook_authorization_packet'
  | 'route_bound_service_role_queue_smoke_runbook_authorization_rejected'
  | 'missing_service_role_queue_smoke_proof_validator_packet'
  | 'service_role_queue_smoke_proof_validator_rejected'
  | 'missing_required_result_capture_refs'
  | 'route_bound_service_role_queue_smoke_result_capture_payload_rejected'
  | 'route_bound_service_role_queue_smoke_result_capture_contract_ready_execution_still_blocked'

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContractInput {
  sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPacket?: Record<string, unknown>
  sourceServiceRoleQueueSmokeProofValidatorPacket?: Record<string, unknown>
  routeBoundServiceRoleQueueSmokeResultCaptureRef?: string
  routeBoundServiceRoleQueueSmokeEvidenceCaptureRef?: string
  routeBoundServiceRoleQueueSmokeTelemetryCaptureRef?: string
  routeBoundServiceRoleQueueSmokeCleanupProofCaptureRef?: string
  routeBoundServiceRoleQueueSmokeProofValidatorRef?: string
  routeBoundServiceRoleQueueSmokePostRunReviewRef?: string
}

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureToolContract {
  captureContractId: string
  toolId: AiGraphicsCanonicalToolId
  productionToolId: string
  runtimeTarget: string
  workerType: string
  expectedQueueJobType: 'ai_graphics_tool_runtime'
  expectedQueueJobStatusBeforeCleanup: 'submitted_then_cleaned'
  expectedJobRowsBeforeCleanup: 1
  expectedWorkerClaimRowsBeforeCleanup: 1
  expectedPersistedRowsAfterCleanup: 0
  sanitizedResultRequired: true
  privateEvidenceRefRequired: true
  telemetryRefRequired: true
  cleanupProofRefRequired: true
  routeBoundRunbookAuthorizationRequired: true
  serviceRoleQueueSmokeProofValidatorRequired: true
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  routeExecutionApprovedNow: false
  serviceRoleQueueSmokeApprovedNow: false
  serviceRoleQueueSmokePerformedByThisContract: false
  liveQueueWriteApprovedNow: false
  liveQueueWritePerformedByThisContract: false
  workerDispatchApprovedNow: false
  workerDispatchPerformed: false
  toolExecutionApprovedNow: false
  toolExecutionPerformed: false
  providerRuntimePerformed: false
  privateArtifactWritePerformed: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContract {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_RESULT_CAPTURE_CONTRACT_DECISION
  status: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContractStatus
  rejectionReasons: string[]
  sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationDecision: string | null
  sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationAccepted: boolean
  sourceServiceRoleQueueSmokeProofValidatorDecision: string | null
  sourceServiceRoleQueueSmokeProofValidatorAccepted: boolean
  requiredResultCaptureRefs: Record<string, boolean>
  missingResultCaptureRefs: string[]
  routeBoundServiceRoleQueueSmokeResultCaptureToolContracts:
    AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureToolContract[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  routeBoundServiceRoleQueueSmokeResultCaptureContractReadyToolsWithProvidedEvidence: 0 | 21
  sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationReadyToolsWithProvidedEvidence: 0 | 21
  sourceServiceRoleQueueSmokeProofValidatorReadyToolsWithProvidedEvidence: 0 | 21
  routeBoundServiceRoleQueueSmokeResultCaptureToolContractsPreparedWithProvidedEvidence: 0 | 21
  expectedLiveQueueRowsBeforeCleanup: 0 | 21
  expectedWorkerClaimRowsBeforeCleanup: 0 | 21
  expectedPersistedRowsAfterCleanup: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  gpuRuntimeShouldStartNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  savedResultAcceptanceContract: {
    acceptedDecision: 'ai_graphics_external_beta_service_role_queue_smoke_passed_with_cleanup'
    acceptedStatus: 'external_beta_service_role_queue_smoke_passed_with_cleanup_no_tool_execution'
    toolsSubmitted: 21
    jobIdsReturned: 21
    workerClaimsReturned: 21
    liveSupabaseQueueWritesNow: 21
    liveWorkerClaimRowsNow: 21
    liveWorkerDispatchesNow: 0
    liveToolExecutionsNow: 0
    fixtureRowsPersistedAfterCleanup: 0
    gpuRuntimeShouldStartNow: false
    externalBetaReadyNowTools: 0
    productionReadyNowTools: 0
  }
  routeBoundResultCapturePolicy: {
    privateResultCaptureOnly: true
    sourceRunbookAuthorizationRequired: true
    sourceSavedResultProofValidatorRequired: true
    sanitizedSavedResultRequired: true
    privateEvidenceRefRequired: true
    privateTelemetryRefRequired: true
    privateCleanupProofRefRequired: true
    postRunReviewRequired: true
    noLiveSmokeByThisContract: true
    noApiRouteExecution: true
    noBackendQueueSubmission: true
    noWorkerDispatch: true
    noToolExecution: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  proofValidatorCommandTemplate: string
  allowedResultCaptureActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContractPrepared: true
    sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationAccepted: boolean
    sourceServiceRoleQueueSmokeProofValidatorAccepted: boolean
    routeBoundServiceRoleQueueSmokeResultCaptureContractReadyWithProvidedEvidence: boolean
    routeBoundServiceRoleQueueSmokeResultCaptureToolContractsAccepted: boolean
    routeBoundResultCaptureRefsAccepted: boolean
    privateResultCaptureOnly: true
    sanitizedSavedResultRequired: true
    cleanupProofRequired: true
    telemetryRequired: true
    postRunReviewRequired: true
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all21RouteBoundResultCaptureContractsPrepared: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    apiRouteExecutionApprovedNow: false
    routeExecutionApprovedNow: false
    routeBoundServiceRoleQueueSmokeRunApprovedNow: false
    serviceRoleQueueSmokeApprovedNow: false
    serviceRoleQueueSmokePerformedByThisContract: false
    liveServiceRoleQueueSmokeExecutedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    liveQueueWritePerformedByThisContract: false
    workerDispatchApprovedNow: false
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
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleQueueSmokePerformed: false
    serviceRoleTransactionPerformed: false
    supabaseMutationPerformed: false
    liveQueueWritePerformed: false
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

const routeBoundResultCapturePolicy = {
  privateResultCaptureOnly: true,
  sourceRunbookAuthorizationRequired: true,
  sourceSavedResultProofValidatorRequired: true,
  sanitizedSavedResultRequired: true,
  privateEvidenceRefRequired: true,
  privateTelemetryRefRequired: true,
  privateCleanupProofRefRequired: true,
  postRunReviewRequired: true,
  noLiveSmokeByThisContract: true,
  noApiRouteExecution: true,
  noBackendQueueSubmission: true,
  noWorkerDispatch: true,
  noToolExecution: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

const savedResultAcceptanceContract = {
  acceptedDecision: 'ai_graphics_external_beta_service_role_queue_smoke_passed_with_cleanup',
  acceptedStatus: 'external_beta_service_role_queue_smoke_passed_with_cleanup_no_tool_execution',
  toolsSubmitted: 21,
  jobIdsReturned: 21,
  workerClaimsReturned: 21,
  liveSupabaseQueueWritesNow: 21,
  liveWorkerClaimRowsNow: 21,
  liveWorkerDispatchesNow: 0,
  liveToolExecutionsNow: 0,
  fixtureRowsPersistedAfterCleanup: 0,
  gpuRuntimeShouldStartNow: false,
  externalBetaReadyNowTools: 0,
  productionReadyNowTools: 0,
} as const

const allowedResultCaptureActions = [
  'read accepted route-bound service-role queue-smoke runbook authorization metadata',
  'read the saved-result-only service-role queue smoke proof validator metadata',
  'prepare all-21 private result/evidence/telemetry/cleanup capture contracts',
  'bind the later sanitized saved smoke result to private evidence refs',
  'preserve GPU startup as on-demand only for a later accepted worker/tool job',
]

const blockedRuntimeActions = [
  'app route mount',
  'API route execution',
  'route-bound service-role queue smoke run approval now',
  'service-role queue smoke execution by this contract',
  'backend queue submission',
  'service-role transaction',
  'live queue write by this contract',
  'Worker queue enqueue',
  'Worker lease creation',
  'Worker execution',
  'tool execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation by this contract',
  'signed URL creation',
  'public artifact creation',
  'external beta traffic enablement',
  'production unlock',
]

const nextMilestones = [
  'QA the route-bound service-role queue-smoke result capture contract.',
  'Run the private non-production route-bound service-role queue smoke only after explicit operator authorization and server-only credentials are present.',
  'Validate the saved sanitized result with ai-graphics:external-beta-service-role-queue-smoke-proof before worker dispatch or tool execution is reconsidered.',
]

const requiredResultCaptureInputKeys = [
  'routeBoundServiceRoleQueueSmokeResultCaptureRef',
  'routeBoundServiceRoleQueueSmokeEvidenceCaptureRef',
  'routeBoundServiceRoleQueueSmokeTelemetryCaptureRef',
  'routeBoundServiceRoleQueueSmokeCleanupProofCaptureRef',
  'routeBoundServiceRoleQueueSmokeProofValidatorRef',
  'routeBoundServiceRoleQueueSmokePostRunReviewRef',
] as const

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function countFrom(packet: Record<string, unknown> | undefined, key: string): number | undefined {
  const counts = (packet?.counts ?? {}) as Record<string, unknown>
  const value = packet?.[key]
  return typeof value === 'number' ? value :
    typeof counts[key] === 'number' ? counts[key] as number :
    undefined
}

function booleanFrom(packet: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const booleans = (packet?.booleans ?? {}) as Record<string, unknown>
  const value = booleans[key]
  return typeof value === 'boolean' ? value : undefined
}

function productFacingCapabilityCount(): 12 {
  return AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS
    .filter((capability) => capability !== 'planning_metadata_only' && capability !== 'blocked_or_deferred')
    .length as 12
}

function runbookAuthorizationAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      'ai_graphics_external_beta_route_bound_service_role_queue_smoke_runbook_authorization_prepared_with_runtime_blocks' &&
    packet.status ===
      'route_bound_service_role_queue_smoke_runbook_authorization_ready_execution_still_blocked' &&
    countFrom(packet, 'routeBoundServiceRoleQueueSmokeRunbookAuthorizationReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokePreflightRunGateReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'sourceServiceRoleQueueSmokeHarnessPreparedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'routeBoundServiceRoleQueueSmokeRunbookToolItemsPreparedWithProvidedEvidence') === 21 &&
    countFrom(packet, 'serviceRoleQueueSmokesPerformedNowTools') === 0 &&
    countFrom(packet, 'liveQueueWritesPerformedNowTools') === 0 &&
    countFrom(packet, 'workerDispatchesApprovedNow') === 0 &&
    countFrom(packet, 'toolExecutionsApprovedNow') === 0 &&
    booleanFrom(packet, 'routeBoundServiceRoleQueueSmokeRunbookAuthorizationReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'routeBoundServiceRoleQueueSmokeRunbookToolItemsAccepted') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'serviceRoleQueueSmokeApprovedNow') === false &&
    booleanFrom(packet, 'liveQueueWriteApprovedNow') === false &&
    booleanFrom(packet, 'workerDispatchApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function proofValidatorAccepted(packet?: Record<string, unknown>): boolean {
  const proofValidator = (packet?.proofValidator ?? {}) as Record<string, unknown>
  const acceptanceCriteria = (packet?.acceptanceCriteria ?? {}) as Record<string, unknown>
  return Boolean(packet) &&
    packet?.decision ===
      'ai_graphics_external_beta_service_role_queue_smoke_proof_prepared_with_runtime_blocks' &&
    proofValidator.script === 'ai-graphics:external-beta-service-role-queue-smoke-proof' &&
    proofValidator.savedResultOnly === true &&
    proofValidator.liveSupabaseWriteByValidator === false &&
    proofValidator.workerDispatchByValidator === false &&
    proofValidator.toolExecutionByValidator === false &&
    proofValidator.gpuRuntimeStartByValidator === false &&
    acceptanceCriteria.toolsSubmitted === 21 &&
    acceptanceCriteria.jobIdsReturned === 21 &&
    acceptanceCriteria.workerClaimsReturned === 21 &&
    acceptanceCriteria.sourceLiveSupabaseQueueWritesAcceptedWithProvidedEvidence === 21 &&
    acceptanceCriteria.sourceWorkerClaimRowsAcceptedWithProvidedEvidence === 21 &&
    acceptanceCriteria.sourceWorkerDispatchesAcceptedWithProvidedEvidence === 0 &&
    acceptanceCriteria.sourceToolExecutionsAcceptedWithProvidedEvidence === 0 &&
    acceptanceCriteria.fixtureRowsPersistedAfterCleanup === 0 &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function resultCaptureRefPresence(
  input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContractInput,
): Record<string, boolean> {
  return Object.fromEntries(
    requiredResultCaptureInputKeys.map((key) => [key, hasValue(input[key])]),
  )
}

function missingResultCaptureRefs(
  input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContractInput,
): string[] {
  return requiredResultCaptureInputKeys.filter((key) => !hasValue(input[key]))
}

function buildResultCaptureToolContracts():
  AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureToolContract[] {
  return listAiGraphicsToolCallReadiness()
    .filter((record) => Boolean(record.productionToolId))
    .map((record) => {
      const workerType = record.productionWorkerType === 'none'
        ? 'ai_graphics_planning_worker'
        : record.productionWorkerType
      return {
        captureContractId: `route-bound-service-role-queue-smoke-result-capture-${record.toolId}`,
        toolId: record.toolId,
        productionToolId: record.productionToolId as string,
        runtimeTarget: record.runtimeTarget,
        workerType,
        expectedQueueJobType: 'ai_graphics_tool_runtime',
        expectedQueueJobStatusBeforeCleanup: 'submitted_then_cleaned',
        expectedJobRowsBeforeCleanup: 1,
        expectedWorkerClaimRowsBeforeCleanup: 1,
        expectedPersistedRowsAfterCleanup: 0,
        sanitizedResultRequired: true,
        privateEvidenceRefRequired: true,
        telemetryRefRequired: true,
        cleanupProofRefRequired: true,
        routeBoundRunbookAuthorizationRequired: true,
        serviceRoleQueueSmokeProofValidatorRequired: true,
        gpuRuntimeStartAllowedForAcceptedExternalBetaJob: record.gpuRequiredForRuntime,
        gpuRuntimeShouldStartNow: false,
        routeExecutionApprovedNow: false,
        serviceRoleQueueSmokeApprovedNow: false,
        serviceRoleQueueSmokePerformedByThisContract: false,
        liveQueueWriteApprovedNow: false,
        liveQueueWritePerformedByThisContract: false,
        workerDispatchApprovedNow: false,
        workerDispatchPerformed: false,
        toolExecutionApprovedNow: false,
        toolExecutionPerformed: false,
        providerRuntimePerformed: false,
        privateArtifactWritePerformed: false,
        publicArtifactCreated: false,
        signedUrlCreated: false,
      }
    })
}

function statusFromInput(input: {
  hasRunbookAuthorization: boolean
  runbookAuthorizationAccepted: boolean
  hasProofValidator: boolean
  proofValidatorAccepted: boolean
  missingRefs: string[]
  payloadAccepted: boolean
}): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContractStatus {
  if (!input.hasRunbookAuthorization) {
    return 'missing_route_bound_service_role_queue_smoke_runbook_authorization_packet'
  }
  if (!input.runbookAuthorizationAccepted) {
    return 'route_bound_service_role_queue_smoke_runbook_authorization_rejected'
  }
  if (!input.hasProofValidator) return 'missing_service_role_queue_smoke_proof_validator_packet'
  if (!input.proofValidatorAccepted) return 'service_role_queue_smoke_proof_validator_rejected'
  if (input.missingRefs.length > 0) return 'missing_required_result_capture_refs'
  if (!input.payloadAccepted) {
    return 'route_bound_service_role_queue_smoke_result_capture_payload_rejected'
  }
  return 'route_bound_service_role_queue_smoke_result_capture_contract_ready_execution_still_blocked'
}

export function evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContract(
  input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContractInput = {},
): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContract {
  const runbookAccepted = runbookAuthorizationAccepted(
    input.sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPacket,
  )
  const validatorAccepted = proofValidatorAccepted(
    input.sourceServiceRoleQueueSmokeProofValidatorPacket,
  )
  const missingRefs = missingResultCaptureRefs(input)
  const resultCaptureToolContracts = buildResultCaptureToolContracts()
  const payloadAccepted =
    resultCaptureToolContracts.length === 21 &&
    resultCaptureToolContracts.every((contract) => (
      contract.productionToolId.length > 0 &&
      contract.runtimeTarget.length > 0 &&
      contract.expectedJobRowsBeforeCleanup === 1 &&
      contract.expectedWorkerClaimRowsBeforeCleanup === 1 &&
      contract.expectedPersistedRowsAfterCleanup === 0 &&
      contract.gpuRuntimeShouldStartNow === false &&
      contract.toolExecutionApprovedNow === false
    ))
  const status = statusFromInput({
    hasRunbookAuthorization: Boolean(input.sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPacket),
    runbookAuthorizationAccepted: runbookAccepted,
    hasProofValidator: Boolean(input.sourceServiceRoleQueueSmokeProofValidatorPacket),
    proofValidatorAccepted: validatorAccepted,
    missingRefs,
    payloadAccepted,
  })
  const ready =
    status ===
      'route_bound_service_role_queue_smoke_result_capture_contract_ready_execution_still_blocked'
  const gpuRuntimeTargetedTools = resultCaptureToolContracts
    .filter((contract) => contract.gpuRuntimeStartAllowedForAcceptedExternalBetaJob)
    .length as 8

  const rejectionReasons = [
    !input.sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPacket
      ? 'accepted route-bound service-role queue-smoke runbook authorization packet is missing'
      : undefined,
    input.sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPacket && !runbookAccepted
      ? 'route-bound service-role queue-smoke runbook authorization packet is not accepted'
      : undefined,
    !input.sourceServiceRoleQueueSmokeProofValidatorPacket
      ? 'saved-result service-role queue-smoke proof validator packet is missing'
      : undefined,
    input.sourceServiceRoleQueueSmokeProofValidatorPacket && !validatorAccepted
      ? 'service-role queue-smoke proof validator packet is not accepted'
      : undefined,
    ...missingRefs.map((key) => `missing route-bound result capture ref: ${key}`),
    !payloadAccepted
      ? 'all 21 route-bound service-role queue-smoke result capture contracts were not prepared'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision:
      AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_RESULT_CAPTURE_CONTRACT_DECISION,
    status,
    rejectionReasons,
    sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationDecision:
      typeof input.sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPacket?.decision ===
        'string'
        ? input.sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationPacket.decision
        : null,
    sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationAccepted: runbookAccepted,
    sourceServiceRoleQueueSmokeProofValidatorDecision:
      typeof input.sourceServiceRoleQueueSmokeProofValidatorPacket?.decision === 'string'
        ? input.sourceServiceRoleQueueSmokeProofValidatorPacket.decision
        : null,
    sourceServiceRoleQueueSmokeProofValidatorAccepted: validatorAccepted,
    requiredResultCaptureRefs: resultCaptureRefPresence(input),
    missingResultCaptureRefs: missingRefs,
    routeBoundServiceRoleQueueSmokeResultCaptureToolContracts:
      ready ? resultCaptureToolContracts : [],
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: productFacingCapabilityCount(),
    gpuRuntimeTargetedTools,
    routeBoundServiceRoleQueueSmokeResultCaptureContractReadyToolsWithProvidedEvidence:
      ready ? 21 : 0,
    sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationReadyToolsWithProvidedEvidence:
      runbookAccepted ? 21 : 0,
    sourceServiceRoleQueueSmokeProofValidatorReadyToolsWithProvidedEvidence:
      validatorAccepted ? 21 : 0,
    routeBoundServiceRoleQueueSmokeResultCaptureToolContractsPreparedWithProvidedEvidence:
      ready ? 21 : 0,
    expectedLiveQueueRowsBeforeCleanup: ready ? 21 : 0,
    expectedWorkerClaimRowsBeforeCleanup: ready ? 21 : 0,
    expectedPersistedRowsAfterCleanup: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    gpuRuntimeShouldStartNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    savedResultAcceptanceContract,
    routeBoundResultCapturePolicy,
    proofValidatorCommandTemplate:
      'future-only: npm run --silent ai-graphics:external-beta-service-role-queue-smoke-proof -- --external-beta-service-role-queue-smoke-readiness-packet <readiness-packet.json> --external-beta-service-role-queue-smoke-result <saved-sanitized-route-bound-smoke-result.json> --external-beta-service-role-queue-smoke-evidence-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/evidence.json --external-beta-service-role-queue-smoke-telemetry-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/telemetry.json --external-beta-service-role-queue-smoke-cleanup-proof-ref private://ai-graphics/external-beta/route-bound-service-role-queue-smoke/cleanup-proof.json',
    allowedResultCaptureActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaRouteBoundServiceRoleQueueSmokeResultCaptureContractPrepared: true,
      sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationAccepted: runbookAccepted,
      sourceServiceRoleQueueSmokeProofValidatorAccepted: validatorAccepted,
      routeBoundServiceRoleQueueSmokeResultCaptureContractReadyWithProvidedEvidence:
        ready,
      routeBoundServiceRoleQueueSmokeResultCaptureToolContractsAccepted:
        ready,
      routeBoundResultCaptureRefsAccepted: missingRefs.length === 0,
      privateResultCaptureOnly: true,
      sanitizedSavedResultRequired: true,
      cleanupProofRequired: true,
      telemetryRequired: true,
      postRunReviewRequired: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all21RouteBoundResultCaptureContractsPrepared: ready,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      apiRouteExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      routeBoundServiceRoleQueueSmokeRunApprovedNow: false,
      serviceRoleQueueSmokeApprovedNow: false,
      serviceRoleQueueSmokePerformedByThisContract: false,
      liveServiceRoleQueueSmokeExecutedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      liveQueueWritePerformedByThisContract: false,
      workerDispatchApprovedNow: false,
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
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      liveQueueWritePerformed: false,
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
