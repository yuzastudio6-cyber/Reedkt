import {
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import type {
  AiGraphicsExternalBetaWorkerDispatchReadiness,
} from './ai-graphics-external-beta-worker-dispatch-readiness'
import type { ProductionToolId } from './production-tool-types'
import {
  buildWorkerIdempotencyKey,
  createProductionWorkerRuntimeState,
  dispatchProductionWorkerJob,
  type ProductionWorkerEventType,
  type ProductionWorkerJobPayload,
  type ProductionWorkerRuntimeType,
} from '../workers/production'

export const AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_DECISION =
  'ai_graphics_external_beta_worker_dispatch_smoke_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaWorkerDispatchSmokeStatus =
  | 'missing_external_beta_worker_dispatch_readiness'
  | 'external_beta_worker_dispatch_readiness_rejected'
  | 'missing_external_beta_worker_dispatch_smoke_controls'
  | 'external_beta_worker_dispatch_smoke_completed_without_tool_execution'

export interface AiGraphicsExternalBetaWorkerDispatchSmokeInput {
  sourceExternalBetaWorkerDispatchReadinessPacket?:
    AiGraphicsExternalBetaWorkerDispatchReadiness
  externalBetaWorkerDispatchSmokeRef?: string
  externalBetaWorkerDispatchSmokeTelemetryRef?: string
  externalBetaWorkerDispatchSmokeLeaseAuditRef?: string
  externalBetaWorkerDispatchSmokeCleanupRef?: string
  externalBetaWorkerInstancePrefix?: string
}

export interface AiGraphicsExternalBetaWorkerDispatchSmokeRecord {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  capabilityIds: string[]
  payloadShapeValid: boolean
  productionWorkerJobStatus: 'completed' | 'skipped'
  futureHandler: string
  mockOnlyRoute: boolean
  aiGraphicsToolCallHandoffRoute: boolean
  gateChecksEvaluated: number
  hardGateBlockCount: number
  warningCount: number
  eventNames: ProductionWorkerEventType[]
  inMemoryLeaseCreated: boolean
  inMemoryLeaseReleased: boolean
  toolRunResultsCreated: 0
  artifactRecordsCreated: 0
  qualityGateResultsCreated: 0
  sourceRuntimeQueueServiceProofBridgeAccepted: boolean
  sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  workerDispatchSmokeCompletedWithProvidedEvidence: boolean
  liveWorkerLeaseCreatedNow: false
  liveWorkerDispatchPerformedNow: false
  toolExecutionPerformedNow: false
}

export interface AiGraphicsExternalBetaWorkerDispatchSmokeCapabilityScenario {
  capabilityId: string
  selectedTools: AiGraphicsCanonicalToolId[]
  completedSmokeToolsWithProvidedEvidence: AiGraphicsCanonicalToolId[]
  capabilitySmokeCompletedWithProvidedEvidence: boolean
  canCreateLiveWorkerLeaseNow: false
  canDispatchLiveWorkerNow: false
  canExecuteToolsNow: false
}

export interface AiGraphicsExternalBetaWorkerDispatchSmoke {
  decision: AiGraphicsExternalBetaWorkerDispatchSmokeStatus
  sourceDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_DECISION
  sourceExternalBetaWorkerDispatchReadinessAccepted: boolean
  sourceWorkerDispatchReadinessProofBridgeAccepted: boolean
  serviceRoleQueueSmokeAuthorizationRef: string | null
  missingSmokeControls: string[]
  mockDispatcherSmokeCompletedWithProvidedEvidence: boolean
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  smokeJobsPrepared: 21
  smokeJobsCompletedWithProvidedEvidence: number
  smokeCapabilityScenariosPrepared: 12
  smokeCapabilityScenariosCompletedWithProvidedEvidence: number
  gpuRuntimeTargetedTools: 8
  inMemoryLeaseRecordsCreated: number
  inMemoryLeaseRecordsReleased: number
  inMemoryWorkerEventsRecorded: number
  sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence: number
  sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence: number
  liveWorkerLeasesCreatedNow: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  smokePolicy: {
    controlledMockDispatcherSmokeOnly: true
    sourceDispatchReadinessRequired: true
    noLiveWorkerLeaseBySmoke: true
    noLiveProductionWorkerDispatchBySmoke: true
    noToolExecutionBySmoke: true
    noProviderRuntimeBySmoke: true
    noBrowserWebglCanvasRuntimeBySmoke: true
    noGpuRuntimeStartBySmoke: true
    gpuOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
  }
  records: AiGraphicsExternalBetaWorkerDispatchSmokeRecord[]
  capabilityScenarios: AiGraphicsExternalBetaWorkerDispatchSmokeCapabilityScenario[]
  nextMilestones: string[]
  booleans: {
    externalBetaWorkerDispatchSmokePrepared: true
    sourceExternalBetaWorkerDispatchReadinessAccepted: boolean
    sourceRuntimeQueueServiceProofBridgeAccepted: boolean
    sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
    externalBetaWorkerDispatchSmokeControlsAccepted: boolean
    mockDispatcherSmokeCompletedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all21SmokeJobsCompletedWithProvidedEvidence: boolean
    all12CapabilitySmokeScenariosCompletedWithProvidedEvidence: boolean
    allInMemoryLeasesCreated: boolean
    allInMemoryLeasesReleased: boolean
    allRoutesMockOnly: boolean
    allRoutesAiGraphicsToolCallHandoff: boolean
    allToolRunResultsEmpty: boolean
    allArtifactRecordsEmpty: boolean
    allQualityGateResultsEmpty: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
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
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleQueueSmokePerformed: false
    supabaseMutationPerformed: false
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

const productFacingCapabilities = AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter(
  (capability) => (
    capability !== 'planning_metadata_only' &&
    capability !== 'blocked_or_deferred'
  ),
)

const nextMilestones = [
  'Attach this mock dispatcher smoke to a saved non-production worker lease/dispatch smoke result once backend worker infrastructure exists.',
  'Keep tool execution blocked until Tool Route, Worker, private artifact, cost, runtime, QA, rollback, and per-tool proof gates pass.',
  'Require native GPU runtime proof before any accepted GPU-targeted worker job can start a GPU runtime.',
  'Promote external beta only after the smoke evidence is tied to real non-production queue rows and no leaked artifacts or public URLs.',
]

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function asWorkerRuntimeType(value: string): ProductionWorkerRuntimeType {
  if (
    value === 'cpu_analysis_worker' ||
    value === 'gpu_ai_worker' ||
    value === 'render_worker' ||
    value === 'qa_worker' ||
    value === 'tool_readiness_worker'
  ) {
    return value
  }
  throw new Error(`Unsupported external beta AI graphics worker type: ${value}`)
}

function productCapabilities(capabilityIds: readonly string[]): string[] {
  return capabilityIds.filter((capabilityId) => (
    capabilityId !== 'planning_metadata_only' &&
    capabilityId !== 'blocked_or_deferred'
  ))
}

function sourceReadinessAccepted(
  packet?: AiGraphicsExternalBetaWorkerDispatchReadiness,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      'external_beta_worker_dispatch_readiness_prepared_with_runtime_blocks' &&
    packet.workerDispatchReadinessPreparedWithProvidedEvidence === true &&
    packet.workerDispatchReadinessRecordsPreparedWithProvidedEvidence === 21 &&
    packet.workerDispatchCapabilityScenariosPreparedWithProvidedEvidence === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.sourceServiceRoleQueueSmokeProofBridgeAccepted === true &&
    packet.acceptedSourceEvidence
      ?.sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    packet.acceptedSourceEvidence
      ?.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21 &&
    hasValue(packet.acceptedSourceEvidence?.serviceRoleQueueSmokeAuthorizationRef ?? undefined) &&
    packet.records?.length === 21 &&
    packet.records.every((record) => (
      record.sourceRuntimeQueueServiceProofBridgeAccepted === true
    )) &&
    packet.booleans?.sourceServiceRoleQueueSmokeProofBridgeAccepted === true &&
    packet.liveWorkerLeasesCreatedNow === 0 &&
    packet.liveWorkerDispatchesNow === 0 &&
    packet.liveToolExecutionsNow === 0 &&
    packet.booleans?.agentCanExecuteToolsNow === false &&
    packet.booleans?.workerDispatchPerformed === false &&
    packet.booleans?.gpuRuntimeShouldStartNow === false
}

function missingSmokeControls(
  input: AiGraphicsExternalBetaWorkerDispatchSmokeInput,
): string[] {
  return [
    !hasValue(input.externalBetaWorkerDispatchSmokeRef)
      ? 'external beta worker dispatch smoke ref is missing'
      : undefined,
    !hasValue(input.externalBetaWorkerDispatchSmokeTelemetryRef)
      ? 'external beta worker dispatch smoke telemetry ref is missing'
      : undefined,
    !hasValue(input.externalBetaWorkerDispatchSmokeLeaseAuditRef)
      ? 'external beta worker dispatch smoke lease audit ref is missing'
      : undefined,
    !hasValue(input.externalBetaWorkerDispatchSmokeCleanupRef)
      ? 'external beta worker dispatch smoke cleanup ref is missing'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasReadinessPacket: boolean
  readinessAccepted: boolean
  controlsSatisfied: boolean
}): AiGraphicsExternalBetaWorkerDispatchSmokeStatus {
  if (!input.hasReadinessPacket) {
    return 'missing_external_beta_worker_dispatch_readiness'
  }
  if (!input.readinessAccepted) {
    return 'external_beta_worker_dispatch_readiness_rejected'
  }
  return input.controlsSatisfied
    ? 'external_beta_worker_dispatch_smoke_completed_without_tool_execution'
    : 'missing_external_beta_worker_dispatch_smoke_controls'
}

function recipeIdForRuntimeTarget(runtimeTarget: string): string {
  if (runtimeTarget === 'node_cpu_static') {
    return 'ai_graphics_external_beta_cpu_static_dispatch_smoke'
  }
  if (runtimeTarget.includes('nvidia_l4')) {
    return 'ai_graphics_external_beta_gpu_model_dispatch_smoke'
  }
  if (runtimeTarget.includes('browser')) {
    return 'ai_graphics_external_beta_browser_runtime_dispatch_smoke'
  }
  return 'ai_graphics_external_beta_metadata_dispatch_smoke'
}

function buildPayload(input: {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  capabilityIds: string[]
  sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
  serviceRoleQueueSmokeAuthorizationRef: string | null
}): ProductionWorkerJobPayload {
  const payloadWithoutIdempotency: ProductionWorkerJobPayload = {
    jobId: `external-beta-ai-graphics-dispatch-smoke-${input.toolId}`,
    workspaceId: 'external_beta_ai_graphics_dispatch_smoke_workspace',
    projectId: 'external_beta_ai_graphics_dispatch_smoke_project',
    approvedSnapshotId: 'approved_snapshot_ai_graphics_external_beta_dispatch_smoke',
    editPlanId: 'edit_plan_ai_graphics_external_beta_dispatch_smoke',
    toolExecutionPlanId: `tool_execution_plan_ai_graphics_dispatch_smoke_${input.toolId}`,
    workerType: input.workerType,
    executionMode: 'dry_run',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: [input.productionToolId],
    requestedRecipeIds: [recipeIdForRuntimeTarget(input.runtimeTarget)],
    storageReferenceIds: [`private_artifact_manifest_ai_graphics_${input.toolId}`],
    creditReservationId: 'credit_reservation_ai_graphics_external_beta_dispatch_smoke',
    requiredQualityGateTypes: ['render_asset_integrity'],
    createdAt: '2026-06-27T00:00:00.000Z',
    metadata: {
      aiGraphicsCanonicalToolId: input.toolId,
      aiGraphicsRuntimeTarget: input.runtimeTarget,
      aiGraphicsCapabilityIds: input.capabilityIds,
      aiGraphicsRuntimeActivationPolicy: {
        onDemandOnly: true,
        noIdleGpuRuntimeApproved: true,
        startsOnlyForApprovedWorkerOrToolCall: true,
        cpuFallbackAllowedForHeavyTools: false,
      },
      aiGraphicsToolCallHandoff: {
        mode: 'metadata_dry_run',
        canonicalToolId: input.toolId,
        productionToolId: input.productionToolId,
        runtimeTarget: input.runtimeTarget,
        capabilityIds: input.capabilityIds,
        planningOnly: true,
        agentCanExecuteToolsNow: false,
      },
      serviceRoleQueueSmokeAuthorizationRef:
        input.serviceRoleQueueSmokeAuthorizationRef,
      sourceServiceRoleQueueSmokeAuthorizationAccepted:
        input.sourceServiceRoleQueueSmokeAuthorizationAccepted,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      cpuFallbackAllowedForHeavyTools: false,
      gpuRuntimeShouldStartNow: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      externalBetaWorkerDispatchSmoke: true,
    },
  }
  return {
    ...payloadWithoutIdempotency,
    idempotencyKey: buildWorkerIdempotencyKey(payloadWithoutIdempotency),
  }
}

function skippedRecord(input: {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  capabilityIds: string[]
  sourceRuntimeQueueServiceProofBridgeAccepted: boolean
  sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
  gpuRuntimeStartAllowed: boolean
}): AiGraphicsExternalBetaWorkerDispatchSmokeRecord {
  return {
    toolId: input.toolId,
    productionToolId: input.productionToolId,
    workerType: input.workerType,
    runtimeTarget: input.runtimeTarget,
    capabilityIds: input.capabilityIds,
    payloadShapeValid: false,
    productionWorkerJobStatus: 'skipped',
    futureHandler: 'external_beta_worker_dispatch_smoke_controls_missing',
    mockOnlyRoute: false,
    aiGraphicsToolCallHandoffRoute: false,
    gateChecksEvaluated: 0,
    hardGateBlockCount: 0,
    warningCount: 0,
    eventNames: [],
    inMemoryLeaseCreated: false,
    inMemoryLeaseReleased: false,
    toolRunResultsCreated: 0,
    artifactRecordsCreated: 0,
    qualityGateResultsCreated: 0,
    sourceRuntimeQueueServiceProofBridgeAccepted:
      input.sourceRuntimeQueueServiceProofBridgeAccepted,
    sourceServiceRoleQueueSmokeAuthorizationAccepted:
      input.sourceServiceRoleQueueSmokeAuthorizationAccepted,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      input.gpuRuntimeStartAllowed,
    gpuRuntimeShouldStartNow: false,
    workerDispatchSmokeCompletedWithProvidedEvidence: false,
    liveWorkerLeaseCreatedNow: false,
    liveWorkerDispatchPerformedNow: false,
    toolExecutionPerformedNow: false,
  }
}

async function smokeRecord(input: {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  capabilityIds: string[]
  sourceRuntimeQueueServiceProofBridgeAccepted: boolean
  sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
  serviceRoleQueueSmokeAuthorizationRef: string | null
  gpuRuntimeStartAllowed: boolean
  workerInstancePrefix: string
  state: ReturnType<typeof createProductionWorkerRuntimeState>
}): Promise<AiGraphicsExternalBetaWorkerDispatchSmokeRecord> {
  const payload = buildPayload(input)
  const result = await dispatchProductionWorkerJob({
    payload,
    state: input.state,
    workerInstanceId: `${input.workerInstancePrefix}-${input.workerType}`,
  })
  const eventNames = result.events.map((event) => event.eventName)
  const hardGateBlockCount = result.gateChecks.filter((gate) => gate.hardBlock).length
  const mockOnlyRoute = result.output?.mockOnly === true
  const aiGraphicsToolCallHandoffRoute =
    result.output?.futureHandler?.startsWith('ai_graphics_') === true &&
    Boolean(result.output.aiGraphicsToolCallHandoffResult)
  const inMemoryLeaseCreated = eventNames.includes('job_claimed')
  const inMemoryLeaseReleased =
    eventNames.includes('job_completed') &&
    input.state.leases.some((lease) => (
      lease.jobId === result.jobId && lease.leaseStatus === 'released'
    ))
  const toolRunResultsCreated = result.toolRunResults.length as 0
  const artifactRecordsCreated = result.artifactRecords.length as 0
  const qualityGateResultsCreated = result.qualityGateResults.length as 0
  const completed =
    result.status === 'completed' &&
    hardGateBlockCount === 0 &&
    mockOnlyRoute &&
    aiGraphicsToolCallHandoffRoute &&
    inMemoryLeaseCreated &&
    inMemoryLeaseReleased &&
    result.toolRunResults.length === 0 &&
    result.artifactRecords.length === 0 &&
    result.qualityGateResults.length === 0

  return {
    toolId: input.toolId,
    productionToolId: input.productionToolId,
    workerType: input.workerType,
    runtimeTarget: input.runtimeTarget,
    capabilityIds: input.capabilityIds,
    payloadShapeValid: Boolean(
      payload.idempotencyKey &&
        payload.executionMode === 'dry_run' &&
        payload.metadata?.aiGraphicsCanonicalToolId === input.toolId &&
        payload.metadata?.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
        Boolean(payload.metadata?.serviceRoleQueueSmokeAuthorizationRef) &&
        payload.metadata?.gpuRuntimeShouldStartNow === false,
    ),
    productionWorkerJobStatus: result.status === 'completed' ? 'completed' : 'skipped',
    futureHandler: result.output?.futureHandler ?? 'missing_future_handler',
    mockOnlyRoute,
    aiGraphicsToolCallHandoffRoute,
    gateChecksEvaluated: result.gateChecks.length,
    hardGateBlockCount,
    warningCount: result.warnings.length,
    eventNames,
    inMemoryLeaseCreated,
    inMemoryLeaseReleased,
    toolRunResultsCreated,
    artifactRecordsCreated,
    qualityGateResultsCreated,
    sourceRuntimeQueueServiceProofBridgeAccepted:
      input.sourceRuntimeQueueServiceProofBridgeAccepted,
    sourceServiceRoleQueueSmokeAuthorizationAccepted:
      input.sourceServiceRoleQueueSmokeAuthorizationAccepted,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      input.gpuRuntimeStartAllowed,
    gpuRuntimeShouldStartNow: false,
    workerDispatchSmokeCompletedWithProvidedEvidence: completed,
    liveWorkerLeaseCreatedNow: false,
    liveWorkerDispatchPerformedNow: false,
    toolExecutionPerformedNow: false,
  }
}

function buildCapabilityScenarios(
  records: AiGraphicsExternalBetaWorkerDispatchSmokeRecord[],
): AiGraphicsExternalBetaWorkerDispatchSmokeCapabilityScenario[] {
  return productFacingCapabilities.map((capabilityId) => {
    const selectedTools = records
      .filter((record) => record.capabilityIds.includes(capabilityId))
      .map((record) => record.toolId)
    const completedTools = records
      .filter((record) => (
        record.capabilityIds.includes(capabilityId) &&
        record.workerDispatchSmokeCompletedWithProvidedEvidence
      ))
      .map((record) => record.toolId)
    return {
      capabilityId,
      selectedTools,
      completedSmokeToolsWithProvidedEvidence: completedTools,
      capabilitySmokeCompletedWithProvidedEvidence:
        selectedTools.length > 0 && completedTools.length === selectedTools.length,
      canCreateLiveWorkerLeaseNow: false,
      canDispatchLiveWorkerNow: false,
      canExecuteToolsNow: false,
    }
  })
}

export async function evaluateAiGraphicsExternalBetaWorkerDispatchSmoke(
  input: AiGraphicsExternalBetaWorkerDispatchSmokeInput = {},
): Promise<AiGraphicsExternalBetaWorkerDispatchSmoke> {
  const readinessAccepted = sourceReadinessAccepted(
    input.sourceExternalBetaWorkerDispatchReadinessPacket,
  )
  const serviceRoleQueueSmokeAuthorizationRef =
    readinessAccepted
      ? input.sourceExternalBetaWorkerDispatchReadinessPacket?.acceptedSourceEvidence
        ?.serviceRoleQueueSmokeAuthorizationRef ?? null
      : null
  const sourceServiceRoleQueueSmokeAuthorizationAccepted =
    readinessAccepted &&
    hasValue(serviceRoleQueueSmokeAuthorizationRef ?? undefined) &&
    input.sourceExternalBetaWorkerDispatchReadinessPacket?.acceptedSourceEvidence
      ?.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21
  const missingControls = readinessAccepted ? missingSmokeControls(input) : []
  const controlsSatisfied = readinessAccepted && missingControls.length === 0
  const state = createProductionWorkerRuntimeState()
  const readinessRecords = listAiGraphicsToolCallReadiness().map((record) => {
    if (!record.productionToolId) {
      throw new Error(`AI graphics tool ${record.toolId} is missing a productionToolId.`)
    }
    return {
      toolId: record.toolId,
      productionToolId: record.productionToolId,
      workerType: asWorkerRuntimeType(record.productionWorkerType),
      runtimeTarget: record.runtimeTarget,
      capabilityIds: productCapabilities(record.capabilities),
      sourceRuntimeQueueServiceProofBridgeAccepted: readinessAccepted,
      sourceServiceRoleQueueSmokeAuthorizationAccepted,
      serviceRoleQueueSmokeAuthorizationRef,
      gpuRuntimeStartAllowed: record.gpuRequiredForRuntime,
    }
  })
  const records = controlsSatisfied
    ? await Promise.all(readinessRecords.map((record) => (
      smokeRecord({
        ...record,
        workerInstancePrefix:
          input.externalBetaWorkerInstancePrefix ??
          'external-beta-ai-graphics-dispatch-smoke',
        state,
      })
    )))
    : readinessRecords.map(skippedRecord)
  const capabilityScenarios = buildCapabilityScenarios(records)
  const smokeJobsCompletedWithProvidedEvidence = records.filter((record) => (
    record.workerDispatchSmokeCompletedWithProvidedEvidence
  )).length
  const smokeCapabilityScenariosCompletedWithProvidedEvidence =
    capabilityScenarios.filter((scenario) => (
      scenario.capabilitySmokeCompletedWithProvidedEvidence
    )).length
  const inMemoryLeaseRecordsCreated =
    records.filter((record) => record.inMemoryLeaseCreated).length
  const inMemoryLeaseRecordsReleased =
    records.filter((record) => record.inMemoryLeaseReleased).length
  const allRoutesMockOnly = records.every((record) => record.mockOnlyRoute)
  const allRoutesAiGraphicsToolCallHandoff =
    records.every((record) => record.aiGraphicsToolCallHandoffRoute)
  const allToolRunResultsEmpty =
    records.every((record) => record.toolRunResultsCreated === 0)
  const allArtifactRecordsEmpty =
    records.every((record) => record.artifactRecordsCreated === 0)
  const allQualityGateResultsEmpty =
    records.every((record) => record.qualityGateResultsCreated === 0)
  const sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence =
    records.filter((record) => (
      record.sourceRuntimeQueueServiceProofBridgeAccepted
    )).length
  const sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence =
    records.filter((record) => (
      record.sourceServiceRoleQueueSmokeAuthorizationAccepted
    )).length
  const mockDispatcherSmokeCompletedWithProvidedEvidence =
    smokeJobsCompletedWithProvidedEvidence === 21 &&
    smokeCapabilityScenariosCompletedWithProvidedEvidence === 12 &&
    inMemoryLeaseRecordsCreated === 21 &&
    inMemoryLeaseRecordsReleased === 21 &&
    allRoutesMockOnly &&
    allRoutesAiGraphicsToolCallHandoff &&
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence === 21 &&
    sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21 &&
    allToolRunResultsEmpty &&
    allArtifactRecordsEmpty &&
    allQualityGateResultsEmpty

  return {
    decision: statusFromInput({
      hasReadinessPacket:
        Boolean(input.sourceExternalBetaWorkerDispatchReadinessPacket),
      readinessAccepted,
      controlsSatisfied,
    }),
    sourceDecision: AI_GRAPHICS_EXTERNAL_BETA_WORKER_DISPATCH_SMOKE_DECISION,
    sourceExternalBetaWorkerDispatchReadinessAccepted: readinessAccepted,
    sourceWorkerDispatchReadinessProofBridgeAccepted: readinessAccepted,
    serviceRoleQueueSmokeAuthorizationRef,
    missingSmokeControls: missingControls,
    mockDispatcherSmokeCompletedWithProvidedEvidence,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: productFacingCapabilities.length as 12,
    smokeJobsPrepared: records.length as 21,
    smokeJobsCompletedWithProvidedEvidence,
    smokeCapabilityScenariosPrepared: capabilityScenarios.length as 12,
    smokeCapabilityScenariosCompletedWithProvidedEvidence,
    gpuRuntimeTargetedTools:
      records.filter((record) => record.workerType === 'gpu_ai_worker').length as 8,
    inMemoryLeaseRecordsCreated,
    inMemoryLeaseRecordsReleased,
    inMemoryWorkerEventsRecorded: state.events.length,
    sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence,
    sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence,
    liveWorkerLeasesCreatedNow: 0,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    smokePolicy: {
      controlledMockDispatcherSmokeOnly: true,
      sourceDispatchReadinessRequired: true,
      noLiveWorkerLeaseBySmoke: true,
      noLiveProductionWorkerDispatchBySmoke: true,
      noToolExecutionBySmoke: true,
      noProviderRuntimeBySmoke: true,
      noBrowserWebglCanvasRuntimeBySmoke: true,
      noGpuRuntimeStartBySmoke: true,
      gpuOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
    },
    records,
    capabilityScenarios,
    nextMilestones,
    booleans: {
      externalBetaWorkerDispatchSmokePrepared: true,
      sourceExternalBetaWorkerDispatchReadinessAccepted: readinessAccepted,
      sourceRuntimeQueueServiceProofBridgeAccepted: readinessAccepted,
      sourceServiceRoleQueueSmokeAuthorizationAccepted,
      externalBetaWorkerDispatchSmokeControlsAccepted: controlsSatisfied,
      mockDispatcherSmokeCompletedWithProvidedEvidence,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all21SmokeJobsCompletedWithProvidedEvidence:
        smokeJobsCompletedWithProvidedEvidence === 21,
      all12CapabilitySmokeScenariosCompletedWithProvidedEvidence:
        smokeCapabilityScenariosCompletedWithProvidedEvidence === 12,
      allInMemoryLeasesCreated: inMemoryLeaseRecordsCreated === 21,
      allInMemoryLeasesReleased: inMemoryLeaseRecordsReleased === 21,
      allRoutesMockOnly,
      allRoutesAiGraphicsToolCallHandoff,
      allToolRunResultsEmpty,
      allArtifactRecordsEmpty,
      allQualityGateResultsEmpty,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
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
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
      supabaseMutationPerformed: false,
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
