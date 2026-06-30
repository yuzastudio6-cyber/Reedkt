import {
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
} from '../tool-registry/ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_OPERATOR_PREFLIGHT_DECISION =
  'ai_graphics_external_beta_route_bound_service_role_queue_smoke_operator_preflight_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflightStatus =
  | 'missing_route_bound_service_role_queue_smoke_result_capture_contract_packet'
  | 'route_bound_service_role_queue_smoke_result_capture_contract_rejected'
  | 'missing_required_operator_environment'
  | 'missing_required_operator_flags'
  | 'route_bound_service_role_queue_smoke_operator_preflight_ready_execution_still_blocked'

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorEnvironmentInput {
  confirmExternalBetaServiceRoleQueueSmoke?: string
  smokeEnvironment?: string
  supabaseUrlPresent?: boolean
  supabaseServiceRoleKeyPresent?: boolean
  e2eRuntimeMode?: string
  workerRuntimeMode?: string
  nodeEnv?: string
  productionFlagPresent?: boolean
}

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflightInput {
  sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractPacket?: Record<string, unknown>
  environment?: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorEnvironmentInput
  workspaceId?: string
  projectId?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  idempotencyPrefix?: string
  routeBoundServiceRoleQueueSmokeResultCaptureRef?: string
  routeBoundServiceRoleQueueSmokeEvidenceCaptureRef?: string
  routeBoundServiceRoleQueueSmokeTelemetryCaptureRef?: string
  routeBoundServiceRoleQueueSmokeCleanupProofCaptureRef?: string
  routeBoundServiceRoleQueueSmokeProofValidatorRef?: string
  routeBoundServiceRoleQueueSmokePostRunReviewRef?: string
  serviceRoleQueueSmokeReadinessRef?: string
  runtimeQueueServiceProofBridgeRef?: string
  sourceRuntimeQueueServiceProofBridgeAccepted?: boolean
}

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflight {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_OPERATOR_PREFLIGHT_DECISION
  status: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflightStatus
  rejectionReasons: string[]
  sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractDecision: string | null
  sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractAccepted: boolean
  requiredOperatorEnvironment: Record<string, boolean>
  missingOperatorEnvironment: string[]
  requiredOperatorFlags: Record<string, boolean>
  missingOperatorFlags: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  routeBoundServiceRoleQueueSmokeOperatorPreflightReadyToolsWithProvidedEvidence: 0 | 21
  sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractReadyToolsWithProvidedEvidence: 0 | 21
  operatorEnvironmentAcceptedToolsWithProvidedEvidence: 0 | 21
  operatorFlagsAcceptedToolsWithProvidedEvidence: 0 | 21
  expectedLiveQueueRowsBeforeCleanup: 0 | 21
  expectedWorkerClaimRowsBeforeCleanup: 0 | 21
  expectedPersistedRowsAfterCleanup: 0
  routeBoundServiceRoleQueueSmokeRunApprovedNowTools: 0
  liveQueueWritesPerformedNowTools: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  gpuRuntimeShouldStartNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  maskedOperatorEnvironment: {
    confirmExternalBetaServiceRoleQueueSmoke: boolean
    nonProductionSmokeEnvironment: boolean
    supabaseUrlPresent: boolean
    supabaseServiceRoleKeyPresent: boolean
    e2eRuntimeModeLocal: boolean
    workerRuntimeModeMock: boolean
    nodeEnvNotProduction: boolean
    productionFlagAbsent: boolean
  }
  operatorPreflightPolicy: {
    sourceResultCaptureContractRequired: true
    explicitOperatorConfirmationRequired: true
    nonProductionEnvironmentRequired: true
    serverOnlyServiceRoleCredentialsRequired: true
    approvedPlanSnapshotRequired: true
    creditReservationRequired: true
    idempotencyPrefixRequired: true
    privateResultEvidenceTelemetryCleanupRefsRequired: true
    noSupabaseClientCreation: true
    noServiceRoleQueueSmoke: true
    noBackendQueueSubmission: true
    noLiveQueueWrite: true
    noWorkerDispatch: true
    noToolExecution: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  futureExecutionCommandTemplate: string
  allowedPreflightActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflightPrepared: true
    sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractAccepted: boolean
    routeBoundServiceRoleQueueSmokeOperatorPreflightReadyWithProvidedEvidence: boolean
    operatorEnvironmentAccepted: boolean
    operatorFlagsAccepted: boolean
    privateNonProductionOnly: true
    serviceRoleCredentialsServerOnly: true
    noServiceRoleCredentialValueReturned: true
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    apiRouteExecutionApprovedNow: false
    routeExecutionApprovedNow: false
    routeBoundServiceRoleQueueSmokeRunApprovedNow: false
    serviceRoleQueueSmokeApprovedNow: false
    liveServiceRoleQueueSmokeExecutedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
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

const operatorPreflightPolicy = {
  sourceResultCaptureContractRequired: true,
  explicitOperatorConfirmationRequired: true,
  nonProductionEnvironmentRequired: true,
  serverOnlyServiceRoleCredentialsRequired: true,
  approvedPlanSnapshotRequired: true,
  creditReservationRequired: true,
  idempotencyPrefixRequired: true,
  privateResultEvidenceTelemetryCleanupRefsRequired: true,
  noSupabaseClientCreation: true,
  noServiceRoleQueueSmoke: true,
  noBackendQueueSubmission: true,
  noLiveQueueWrite: true,
  noWorkerDispatch: true,
  noToolExecution: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

const allowedPreflightActions = [
  'read accepted route-bound service-role queue-smoke result capture contract metadata',
  'verify required non-production operator environment variable presence without returning secret values',
  'verify required private refs and ids are present before a later smoke run',
  'verify source runtime queue service proof bridge acceptance flag is present',
  'preserve GPU startup as on-demand only for a later accepted worker/tool job',
]

const blockedRuntimeActions = [
  'Supabase client creation',
  'app route mount',
  'API route execution',
  'route-bound service-role queue smoke run approval now',
  'service-role queue smoke execution now',
  'backend queue submission',
  'service-role transaction',
  'live queue write',
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
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'external beta traffic enablement',
  'production unlock',
]

const nextMilestones = [
  'QA the route-bound service-role queue-smoke operator preflight.',
  'Run the private non-production route-bound service-role queue smoke only after a human/operator intentionally executes the harness with server-only credentials.',
  'Validate the saved sanitized result with ai-graphics:external-beta-service-role-queue-smoke-proof before worker dispatch or tool execution is reconsidered.',
]

const requiredFlagKeys = [
  'workspaceId',
  'projectId',
  'approvedPlanSnapshotId',
  'creditReservationId',
  'idempotencyPrefix',
  'routeBoundServiceRoleQueueSmokeResultCaptureRef',
  'routeBoundServiceRoleQueueSmokeEvidenceCaptureRef',
  'routeBoundServiceRoleQueueSmokeTelemetryCaptureRef',
  'routeBoundServiceRoleQueueSmokeCleanupProofCaptureRef',
  'routeBoundServiceRoleQueueSmokeProofValidatorRef',
  'routeBoundServiceRoleQueueSmokePostRunReviewRef',
  'serviceRoleQueueSmokeReadinessRef',
  'runtimeQueueServiceProofBridgeRef',
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

function gpuRuntimeTargetedTools(): 8 {
  return listAiGraphicsToolCallReadiness()
    .filter((record) => record.gpuRequiredForRuntime)
    .length as 8
}

function resultCaptureContractAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      'ai_graphics_external_beta_route_bound_service_role_queue_smoke_result_capture_contract_prepared_with_runtime_blocks' &&
    packet.status ===
      'route_bound_service_role_queue_smoke_result_capture_contract_ready_execution_still_blocked' &&
    countFrom(packet, 'routeBoundServiceRoleQueueSmokeResultCaptureContractReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokeRunbookAuthorizationReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'sourceServiceRoleQueueSmokeProofValidatorReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'routeBoundServiceRoleQueueSmokeResultCaptureToolContractsPreparedWithProvidedEvidence') === 21 &&
    countFrom(packet, 'expectedLiveQueueRowsBeforeCleanup') === 21 &&
    countFrom(packet, 'expectedWorkerClaimRowsBeforeCleanup') === 21 &&
    countFrom(packet, 'expectedPersistedRowsAfterCleanup') === 0 &&
    countFrom(packet, 'workerDispatchesApprovedNow') === 0 &&
    countFrom(packet, 'toolExecutionsApprovedNow') === 0 &&
    booleanFrom(packet, 'routeBoundServiceRoleQueueSmokeResultCaptureContractReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'serviceRoleQueueSmokeApprovedNow') === false &&
    booleanFrom(packet, 'liveQueueWriteApprovedNow') === false &&
    booleanFrom(packet, 'workerDispatchApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function requiredOperatorEnvironment(
  environment: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorEnvironmentInput | undefined,
): Record<string, boolean> {
  return {
    confirmExternalBetaServiceRoleQueueSmoke:
      environment?.confirmExternalBetaServiceRoleQueueSmoke === 'true',
    smokeEnvironment:
      environment?.smokeEnvironment === 'non_production',
    supabaseUrlPresent:
      environment?.supabaseUrlPresent === true,
    supabaseServiceRoleKeyPresent:
      environment?.supabaseServiceRoleKeyPresent === true,
    e2eRuntimeMode:
      environment?.e2eRuntimeMode === 'local',
    workerRuntimeMode:
      environment?.workerRuntimeMode === 'mock',
    nodeEnvNotProduction:
      environment?.nodeEnv !== 'production',
    productionFlagAbsent:
      environment?.productionFlagPresent !== true,
  }
}

function missingKeys(record: Record<string, boolean>): string[] {
  return Object.entries(record)
    .filter(([, value]) => !value)
    .map(([key]) => key)
}

function requiredOperatorFlags(
  input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflightInput,
): Record<string, boolean> {
  const base = Object.fromEntries(
    requiredFlagKeys.map((key) => [key, hasValue(input[key])]),
  ) as Record<string, boolean>
  return {
    ...base,
    sourceRuntimeQueueServiceProofBridgeAccepted:
      input.sourceRuntimeQueueServiceProofBridgeAccepted === true,
  }
}

function statusFromInput(input: {
  hasResultCaptureContract: boolean
  resultCaptureContractAccepted: boolean
  missingEnvironment: string[]
  missingFlags: string[]
}): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflightStatus {
  if (!input.hasResultCaptureContract) {
    return 'missing_route_bound_service_role_queue_smoke_result_capture_contract_packet'
  }
  if (!input.resultCaptureContractAccepted) {
    return 'route_bound_service_role_queue_smoke_result_capture_contract_rejected'
  }
  if (input.missingEnvironment.length > 0) return 'missing_required_operator_environment'
  if (input.missingFlags.length > 0) return 'missing_required_operator_flags'
  return 'route_bound_service_role_queue_smoke_operator_preflight_ready_execution_still_blocked'
}

export function evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflight(
  input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflightInput = {},
): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflight {
  const sourceAccepted = resultCaptureContractAccepted(
    input.sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractPacket,
  )
  const requiredEnvironment = requiredOperatorEnvironment(input.environment)
  const requiredFlags = requiredOperatorFlags(input)
  const missingEnvironment = missingKeys(requiredEnvironment)
  const missingFlags = missingKeys(requiredFlags)
  const status = statusFromInput({
    hasResultCaptureContract: Boolean(input.sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractPacket),
    resultCaptureContractAccepted: sourceAccepted,
    missingEnvironment,
    missingFlags,
  })
  const ready =
    status === 'route_bound_service_role_queue_smoke_operator_preflight_ready_execution_still_blocked'

  const rejectionReasons = [
    !input.sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractPacket
      ? 'accepted route-bound service-role queue-smoke result capture contract packet is missing'
      : undefined,
    input.sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractPacket && !sourceAccepted
      ? 'route-bound service-role queue-smoke result capture contract packet is not accepted'
      : undefined,
    ...missingEnvironment.map((key) => `missing operator environment: ${key}`),
    ...missingFlags.map((key) => `missing operator flag: ${key}`),
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision:
      AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_OPERATOR_PREFLIGHT_DECISION,
    status,
    rejectionReasons,
    sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractDecision:
      typeof input.sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractPacket?.decision === 'string'
        ? input.sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractPacket.decision
        : null,
    sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractAccepted: sourceAccepted,
    requiredOperatorEnvironment: requiredEnvironment,
    missingOperatorEnvironment: missingEnvironment,
    requiredOperatorFlags: requiredFlags,
    missingOperatorFlags: missingFlags,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: productFacingCapabilityCount(),
    gpuRuntimeTargetedTools: gpuRuntimeTargetedTools(),
    routeBoundServiceRoleQueueSmokeOperatorPreflightReadyToolsWithProvidedEvidence:
      ready ? 21 : 0,
    sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractReadyToolsWithProvidedEvidence:
      sourceAccepted ? 21 : 0,
    operatorEnvironmentAcceptedToolsWithProvidedEvidence:
      missingEnvironment.length === 0 ? 21 : 0,
    operatorFlagsAcceptedToolsWithProvidedEvidence:
      missingFlags.length === 0 ? 21 : 0,
    expectedLiveQueueRowsBeforeCleanup:
      ready ? 21 : 0,
    expectedWorkerClaimRowsBeforeCleanup:
      ready ? 21 : 0,
    expectedPersistedRowsAfterCleanup: 0,
    routeBoundServiceRoleQueueSmokeRunApprovedNowTools: 0,
    liveQueueWritesPerformedNowTools: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    gpuRuntimeShouldStartNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    maskedOperatorEnvironment: {
      confirmExternalBetaServiceRoleQueueSmoke:
        requiredEnvironment.confirmExternalBetaServiceRoleQueueSmoke,
      nonProductionSmokeEnvironment:
        requiredEnvironment.smokeEnvironment,
      supabaseUrlPresent:
        requiredEnvironment.supabaseUrlPresent,
      supabaseServiceRoleKeyPresent:
        requiredEnvironment.supabaseServiceRoleKeyPresent,
      e2eRuntimeModeLocal:
        requiredEnvironment.e2eRuntimeMode,
      workerRuntimeModeMock:
        requiredEnvironment.workerRuntimeMode,
      nodeEnvNotProduction:
        requiredEnvironment.nodeEnvNotProduction,
      productionFlagAbsent:
        requiredEnvironment.productionFlagAbsent,
    },
    operatorPreflightPolicy,
    futureExecutionCommandTemplate:
      'future-only: npm run --silent ai-graphics:external-beta-service-role-queue-smoke -- --execute-external-beta-service-role-queue-smoke --workspace-id <workspace-id> --project-id <project-id> --approved-plan-snapshot-id <approved-plan-snapshot-id> --credit-reservation-id <credit-reservation-id> --idempotency-prefix <unique-route-bound-smoke-prefix> --external-beta-service-role-queue-smoke-authorization-packet <accepted-authorization-packet.json> --service-role-queue-smoke-readiness-ref <accepted-readiness-ref> --runtime-queue-service-proof-bridge-ref <accepted-runtime-queue-service-proof-bridge-ref> --source-runtime-queue-service-proof-bridge-accepted',
    allowedPreflightActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaRouteBoundServiceRoleQueueSmokeOperatorPreflightPrepared: true,
      sourceRouteBoundServiceRoleQueueSmokeResultCaptureContractAccepted: sourceAccepted,
      routeBoundServiceRoleQueueSmokeOperatorPreflightReadyWithProvidedEvidence:
        ready,
      operatorEnvironmentAccepted: missingEnvironment.length === 0,
      operatorFlagsAccepted: missingFlags.length === 0,
      privateNonProductionOnly: true,
      serviceRoleCredentialsServerOnly: true,
      noServiceRoleCredentialValueReturned: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      apiRouteExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      routeBoundServiceRoleQueueSmokeRunApprovedNow: false,
      serviceRoleQueueSmokeApprovedNow: false,
      liveServiceRoleQueueSmokeExecutedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
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
