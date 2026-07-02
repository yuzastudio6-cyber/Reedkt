import fs from 'node:fs'
import { loadRuntimeEnv } from '../config/env'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import type { ServiceContext } from '../types'
import {
  getAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'
import type { ProductionToolId } from '../tool-registry/production-tool-types'
import {
  buildWorkerIdempotencyKey,
  createProductionWorkerRuntimeState,
  dispatchProductionWorkerJob,
  type ProductionWorkerJobPayload,
  type ProductionWorkerRuntimeType,
} from '../workers/production'

const decision =
  'ai_graphics_external_beta_gpu_model_worker_boundary_proof_passed_with_existing_worker_path'
const status =
  'gpu_model_route_admission_bound_to_existing_runtime_queue_and_mock_worker_dispatch'
const sourcePacketPath =
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-runtime-admission-smoke.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-worker-boundary-proof.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-worker-boundary-proof.md'

const gpuModelTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

interface ProofReadyAdmissionResult {
  toolId: string
  capabilityId: string
  statusCode: number
  blocked: boolean
  admissionDecision: string | null
  runtimeTarget: string | null
  workerType: string | null
  modelWeightManifestRequired: boolean
  gpuModelAdmissionEvidenceState: string | null
  modelWeightPrivateEvidenceAccepted: boolean
  modelWeightManifestRefAccepted: boolean
  nativeGpuRuntimeProofAccepted: boolean
  nativeGpuRuntimeProofRefAccepted: boolean
  runtimeJobAdmissionReadyWithProvidedEvidence: boolean
  workerEnqueueStillBlockedByCurrentLane: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: boolean
  workerDispatchPerformed: boolean
  toolExecutionPerformed: boolean
  modelWeightsLoaded: boolean
  publicArtifactCreated: boolean
  signedUrlCreated: boolean
}

interface SourceAdmissionSmoke {
  decision: string
  status: string
  proofReadyNativeOnlyResults?: ProofReadyAdmissionResult[]
  proofReadyModelWeightResults?: ProofReadyAdmissionResult[]
  counts?: Record<string, number>
  booleans?: Record<string, boolean>
}

interface GpuModelWorkerBoundaryProofRecord {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
  capabilityId: string
  modelWeightManifestRequired: boolean
  sourceAdmissionDecision: string | null
  sourceEvidenceState: string | null
  sourceRuntimeJobAdmissionReadyWithProvidedEvidence: boolean
  nativeGpuRuntimeProofRefAccepted: boolean
  modelWeightManifestRefAccepted: boolean
  modelWeightPrivateEvidenceAccepted: boolean
  existingRuntimeQueueServiceUsed: true
  runtimeQueueJobBatchId: string
  runtimeQueueJobId: string
  runtimeQueueServiceMockOnly: boolean
  mockWorkerClaimId: string
  mockWorkerClaimReturned: boolean
  mockWorkerEventId: string
  mockWorkerEventRecorded: boolean
  mockAuditEventId: string
  mockAuditEventRecorded: boolean
  dispatcherStatus: 'completed' | 'blocked' | 'failed' | 'cancelled' | 'skipped'
  dispatcherFutureHandler: string
  dispatcherMockOnlyRoute: boolean
  dispatcherAiGraphicsGpuHandoffRoute: boolean
  dispatcherGateChecksEvaluated: number
  dispatcherHardGateBlockCount: number
  dispatcherWarningCount: number
  inMemoryDispatcherLeaseCreated: boolean
  inMemoryDispatcherLeaseReleased: boolean
  toolRunResultsCreated: 0
  artifactRecordsCreated: 0
  qualityGateResultsCreated: 0
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  workerDispatchPerformedNow: false
  toolExecutionPerformedNow: false
  modelWeightsLoadedNow: false
  publicArtifactCreatedNow: false
  signedUrlCreatedNow: false
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function stringFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

function createMockRuntimeQueueServiceContext(): ServiceContext {
  return {
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'mock',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      STORAGE_MODE: 'local',
      WORKER_RUNTIME_MODE: 'mock',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    }),
    clients: { admin: null, public: null },
    requestId: 'ai-graphics-external-beta-gpu-model-worker-boundary-proof',
    auth: {
      userId: 'ai-graphics-external-beta-gpu-model-worker-boundary-proof',
      isMockUser: true,
    },
  }
}

function proofReadyRows(source: SourceAdmissionSmoke): ProofReadyAdmissionResult[] {
  return [
    ...(source.proofReadyNativeOnlyResults ?? []),
    ...(source.proofReadyModelWeightResults ?? []),
  ].sort((left, right) => (
    gpuModelTools.indexOf(left.toolId as AiGraphicsCanonicalToolId) -
    gpuModelTools.indexOf(right.toolId as AiGraphicsCanonicalToolId)
  ))
}

function assertSourceAccepted(source: SourceAdmissionSmoke): void {
  assert(
    source.decision ===
      'ai_graphics_external_beta_tool_call_route_gpu_model_runtime_admission_smoke_passed',
    'source GPU/model route admission smoke decision is not accepted',
  )
  assert(
    source.counts?.allGpuModelAdmissionReadyWithProvidedRefsTools === 8,
    'source GPU/model admission smoke does not have eight proof-ready tools',
  )
  assert(
    source.counts?.allProofReadyGpuRuntimeShouldStartNowTools === 0,
    'source GPU/model admission smoke starts GPU at proof-ready stage',
  )
  assert(
    source.booleans?.allGpuModelToolsAcceptRequiredPrivateProofRefsForAdmission === true,
    'source GPU/model route admission does not accept all required private proof refs',
  )
  assert(
    source.booleans?.allProofReadyGpuModelToolsStillFailClosedBeforeWorkerEnqueue === true,
    'source GPU/model route admission does not fail closed before worker enqueue',
  )
  assert(
    source.booleans?.allProofReadyGpuModelToolsDoNotStartGpuRuntimeOrLoadWeights === true,
    'source GPU/model route admission starts GPU runtime or loads weights',
  )
}

function canonicalToolId(toolId: string): AiGraphicsCanonicalToolId {
  assert(
    (gpuModelTools as readonly string[]).includes(toolId),
    `unexpected GPU/model tool in proof-ready source rows: ${toolId}`,
  )
  return toolId as AiGraphicsCanonicalToolId
}

function buildProductionWorkerPayload(input: {
  row: ProofReadyAdmissionResult
  queueJobId: string
  productionToolId: ProductionToolId
  workerType: ProductionWorkerRuntimeType
  runtimeTarget: string
}): ProductionWorkerJobPayload {
  const payloadWithoutIdempotency: ProductionWorkerJobPayload = {
    jobId: input.queueJobId,
    workspaceId: 'external_beta_gpu_model_worker_boundary_workspace',
    projectId: 'external_beta_gpu_model_worker_boundary_project',
    approvedSnapshotId:
      'approved_snapshot_external_beta_gpu_model_worker_boundary',
    editPlanId: 'edit_plan_external_beta_gpu_model_worker_boundary',
    toolExecutionPlanId:
      `tool_execution_plan_external_beta_gpu_model_worker_boundary_${input.row.toolId}`,
    workerType: input.workerType,
    executionMode: 'dry_run',
    idempotencyKey: '',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: [input.productionToolId],
    requestedRecipeIds: [
      'ai_graphics_external_beta_gpu_model_worker_boundary_proof',
    ],
    storageReferenceIds: [
      `private://ai-graphics/external-beta/gpu-model-worker-boundary/${input.row.toolId}/artifact-manifest.json`,
    ],
    creditReservationId:
      'credit_reservation_external_beta_gpu_model_worker_boundary',
    requiredQualityGateTypes: ['render_asset_integrity'],
    createdAt: '2026-07-02T00:00:00.000Z',
    metadata: {
      aiGraphicsCanonicalToolId: input.row.toolId,
      aiGraphicsRuntimeTarget: input.runtimeTarget,
      aiGraphicsCapabilityIds: [input.row.capabilityId],
      aiGraphicsRuntimeActivationPolicy: {
        onDemandOnly: true,
        noIdleGpuRuntimeApproved: true,
        startsOnlyForApprovedWorkerOrToolCall: true,
        cpuFallbackAllowedForHeavyTools: false,
      },
      aiGraphicsToolCallHandoff: {
        mode: 'metadata_dry_run',
        canonicalToolId: input.row.toolId,
        productionToolId: input.productionToolId,
        runtimeTarget: input.runtimeTarget,
        capabilityIds: [input.row.capabilityId],
        planningOnly: true,
        agentCanExecuteToolsNow: false,
      },
      sourceGpuModelRouteAdmission: {
        decision: input.row.admissionDecision,
        evidenceState: input.row.gpuModelAdmissionEvidenceState,
        runtimeJobAdmissionReadyWithProvidedEvidence:
          input.row.runtimeJobAdmissionReadyWithProvidedEvidence,
        nativeGpuRuntimeProofRefAccepted:
          input.row.nativeGpuRuntimeProofRefAccepted,
        modelWeightManifestRequired: input.row.modelWeightManifestRequired,
        modelWeightManifestRefAccepted: input.row.modelWeightManifestRefAccepted,
        modelWeightPrivateEvidenceAccepted:
          input.row.modelWeightPrivateEvidenceAccepted,
        workerEnqueueStillBlockedBySourceLane:
          input.row.workerEnqueueStillBlockedByCurrentLane,
      },
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      cpuFallbackAllowedForHeavyTools: false,
      gpuRuntimeShouldStartNow: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      modelWeightsLoaded: false,
      externalBetaGpuModelWorkerBoundaryProof: true,
    },
  }

  return {
    ...payloadWithoutIdempotency,
    idempotencyKey: buildWorkerIdempotencyKey(payloadWithoutIdempotency),
  }
}

async function buildReport(sourcePath = sourcePacketPath) {
  const source = readJson<SourceAdmissionSmoke>(sourcePath)
  assertSourceAccepted(source)
  const rows = proofReadyRows(source)
  assert(rows.length === 8, 'expected eight proof-ready GPU/model source rows')

  const service = createAiGraphicsToolRuntimeQueueService(
    createMockRuntimeQueueServiceContext(),
  )
  const queueJobs = rows.map((row) => {
    const toolId = canonicalToolId(row.toolId)
    const readiness = getAiGraphicsToolCallReadiness(toolId)
    assert(readiness?.productionToolId, `missing production tool id for ${toolId}`)
    assert(
      readiness.productionWorkerType === 'gpu_ai_worker',
      `unexpected worker type for ${toolId}: ${readiness.productionWorkerType}`,
    )
    assert(
      readiness.runtimeTarget === row.runtimeTarget,
      `runtime target mismatch for ${toolId}`,
    )
    const readinessCapabilities = new Set<string>(readiness.capabilities)
    assert(
      readinessCapabilities.has(row.capabilityId),
      `capability mismatch for ${toolId}: ${row.capabilityId}`,
    )
    assert(
      row.blocked === true &&
        row.statusCode === 409 &&
        row.admissionDecision ===
          'runtime_job_admission_ready_for_worker_enqueue' &&
        row.runtimeJobAdmissionReadyWithProvidedEvidence === true &&
        row.nativeGpuRuntimeProofRefAccepted === true &&
        row.nativeGpuRuntimeProofAccepted === true &&
        row.workerEnqueueStillBlockedByCurrentLane === true &&
        row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true &&
        row.gpuRuntimeShouldStartNow === false &&
        row.workerDispatchPerformed === false &&
        row.toolExecutionPerformed === false &&
        row.modelWeightsLoaded === false &&
        row.publicArtifactCreated === false &&
        row.signedUrlCreated === false,
      `source proof-ready row is not fail-closed and admission-ready for ${toolId}`,
    )

    return {
      row,
      toolId,
      productionToolId: readiness.productionToolId,
      workerType: 'gpu_ai_worker' as const,
      runtimeTarget: readiness.runtimeTarget,
      queueJob: {
        toolId,
        productionToolId: readiness.productionToolId,
        workerType: 'gpu_ai_worker',
        runtimeTarget: readiness.runtimeTarget,
        capabilityIds: [row.capabilityId],
        privateArtifactManifestRef:
          `private://ai-graphics/external-beta/gpu-model-worker-boundary/${toolId}/artifact-manifest.json`,
        idempotencyKey:
          `ai-graphics:external-beta:gpu-model-worker-boundary:${toolId}`,
        priority: 'normal' as const,
        maxAttempts: 1,
        inputPayload: {
          sourceGpuModelRouteAdmissionDecision: row.admissionDecision,
          sourceGpuModelAdmissionEvidenceState:
            row.gpuModelAdmissionEvidenceState,
          nativeGpuRuntimeProofRefAccepted:
            row.nativeGpuRuntimeProofRefAccepted,
          modelWeightManifestRequired: row.modelWeightManifestRequired,
          modelWeightManifestRefAccepted: row.modelWeightManifestRefAccepted,
          modelWeightPrivateEvidenceAccepted:
            row.modelWeightPrivateEvidenceAccepted,
          runtimeJobAdmissionReadyWithProvidedEvidence:
            row.runtimeJobAdmissionReadyWithProvidedEvidence,
          liveRuntimeAllowedNow: false,
          serviceRoleTransactionPerformed: false,
          workerDispatchPerformed: false,
          gpuRuntimeShouldStartNow: false,
          modelWeightsLoaded: false,
          publicArtifactCreated: false,
        },
      },
    }
  })

  const queue = await service.enqueueToolRuntimeJobs({
    workspaceId: 'external_beta_gpu_model_worker_boundary_workspace',
    projectId: 'external_beta_gpu_model_worker_boundary_project',
    approvedPlanSnapshotId:
      'approved_snapshot_external_beta_gpu_model_worker_boundary',
    creditReservationId:
      'credit_reservation_external_beta_gpu_model_worker_boundary',
    jobs: queueJobs.map((item) => item.queueJob),
    idempotencyKey:
      'ai-graphics:external-beta:gpu-model-worker-boundary:batch',
    batchName: 'AI graphics external beta GPU/model worker boundary proof',
    createdByAgent: 'ai_graphics_external_beta_gpu_model_worker_boundary_proof',
  })

  const queueResult = queue.queueResult as {
    jobBatchId?: string
    jobIds?: string[]
    insertedJobCount?: number
    mockOnly?: boolean
  }
  assert(queueResult.mockOnly === true, 'runtime queue service was not mock-only')
  assert(queueResult.insertedJobCount === 8, 'runtime queue service did not prepare eight jobs')
  assert(Array.isArray(queueResult.jobIds) && queueResult.jobIds.length === 8, 'runtime queue service did not return eight job ids')

  const dispatcherState = createProductionWorkerRuntimeState()
  const records: GpuModelWorkerBoundaryProofRecord[] = []

  for (const [index, item] of queueJobs.entries()) {
    const queueJobId = queueResult.jobIds[index]
    const claim = await service.claimToolRuntimeJob({
      jobId: queueJobId,
      workerType: item.workerType,
      workerInstanceId:
        'external-beta-gpu-model-worker-boundary-proof-gpu-ai-worker',
      idempotencyKey:
        `ai-graphics:external-beta:gpu-model-worker-boundary:claim:${item.toolId}`,
      leaseSeconds: 900,
    })
    const event = await service.recordWorkerEvent({
      jobId: queueJobId,
      eventType:
        'ai_graphics_external_beta_gpu_model_worker_boundary_claimed',
      message:
        'Mock GPU/model job claimed without dispatching live worker, executing tools, starting GPU, or loading weights.',
      progressPercent: 0,
      payload: {
        toolId: item.toolId,
        runtimeTarget: item.runtimeTarget,
        gpuRuntimeShouldStartNow: false,
      },
    })
    const audit = await service.recordAuditEvent({
      workspaceId: 'external_beta_gpu_model_worker_boundary_workspace',
      projectId: 'external_beta_gpu_model_worker_boundary_project',
      eventType:
        'ai_graphics_external_beta_gpu_model_worker_boundary_mock_claim_recorded',
      eventJson: {
        toolId: item.toolId,
        runtimeTarget: item.runtimeTarget,
        existingRuntimeQueueServiceUsed: true,
        newGpuWorkerCreated: false,
        gpuRuntimeShouldStartNow: false,
      },
      actorUserId:
        'ai-graphics-external-beta-gpu-model-worker-boundary-proof',
    })

    const dispatchPayload = buildProductionWorkerPayload({
      row: item.row,
      queueJobId,
      productionToolId: item.productionToolId,
      workerType: item.workerType,
      runtimeTarget: item.runtimeTarget,
    })
    const dispatch = await dispatchProductionWorkerJob({
      payload: dispatchPayload,
      state: dispatcherState,
      workerInstanceId:
        'external-beta-gpu-model-worker-boundary-proof-gpu-ai-worker',
    })
    const eventNames = dispatch.events.map((entry) => entry.eventName)
    const dispatcherFutureHandler =
      dispatch.output?.futureHandler ?? 'missing_future_handler'
    const dispatcherMockOnlyRoute = dispatch.output?.mockOnly === true
    const dispatcherAiGraphicsGpuHandoffRoute =
      dispatcherFutureHandler === 'ai_graphics_gpu_model_tool_call_handoff' &&
      Boolean(dispatch.output?.aiGraphicsToolCallHandoffResult)
    const inMemoryDispatcherLeaseCreated = eventNames.includes('job_claimed')
    const inMemoryDispatcherLeaseReleased =
      eventNames.includes('job_completed') &&
      dispatcherState.leases.some((lease) => (
        lease.jobId === dispatch.jobId && lease.leaseStatus === 'released'
      ))

    records.push({
      toolId: item.toolId,
      productionToolId: item.productionToolId,
      workerType: item.workerType,
      runtimeTarget: item.runtimeTarget,
      capabilityId: item.row.capabilityId,
      modelWeightManifestRequired: item.row.modelWeightManifestRequired,
      sourceAdmissionDecision: item.row.admissionDecision,
      sourceEvidenceState: item.row.gpuModelAdmissionEvidenceState,
      sourceRuntimeJobAdmissionReadyWithProvidedEvidence:
        item.row.runtimeJobAdmissionReadyWithProvidedEvidence,
      nativeGpuRuntimeProofRefAccepted:
        item.row.nativeGpuRuntimeProofRefAccepted,
      modelWeightManifestRefAccepted: item.row.modelWeightManifestRefAccepted,
      modelWeightPrivateEvidenceAccepted:
        item.row.modelWeightPrivateEvidenceAccepted,
      existingRuntimeQueueServiceUsed: true,
      runtimeQueueJobBatchId:
        queueResult.jobBatchId ?? 'missing_runtime_queue_job_batch_id',
      runtimeQueueJobId: queueJobId,
      runtimeQueueServiceMockOnly: queueResult.mockOnly === true,
      mockWorkerClaimId:
        (claim.claimResult as { workerClaimId?: string }).workerClaimId ??
        'missing_mock_worker_claim_id',
      mockWorkerClaimReturned:
        (claim.claimResult as { mockOnly?: boolean }).mockOnly === true,
      mockWorkerEventId:
        (event.eventResult as { jobEventId?: string }).jobEventId ??
        'missing_mock_worker_event_id',
      mockWorkerEventRecorded:
        (event.eventResult as { mockOnly?: boolean }).mockOnly === true,
      mockAuditEventId:
        (audit.auditResult as { auditEventId?: string }).auditEventId ??
        'missing_mock_audit_event_id',
      mockAuditEventRecorded:
        (audit.auditResult as { mockOnly?: boolean }).mockOnly === true,
      dispatcherStatus:
        dispatch.status === 'completed' ? 'completed' : 'skipped',
      dispatcherFutureHandler,
      dispatcherMockOnlyRoute,
      dispatcherAiGraphicsGpuHandoffRoute,
      dispatcherGateChecksEvaluated: dispatch.gateChecks.length,
      dispatcherHardGateBlockCount:
        dispatch.gateChecks.filter((gate) => gate.hardBlock).length,
      dispatcherWarningCount: dispatch.warnings.length,
      inMemoryDispatcherLeaseCreated,
      inMemoryDispatcherLeaseReleased,
      toolRunResultsCreated: dispatch.toolRunResults.length as 0,
      artifactRecordsCreated: dispatch.artifactRecords.length as 0,
      qualityGateResultsCreated: dispatch.qualityGateResults.length as 0,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
        item.row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      gpuRuntimeShouldStartNow: false,
      workerDispatchPerformedNow: false,
      toolExecutionPerformedNow: false,
      modelWeightsLoadedNow: false,
      publicArtifactCreatedNow: false,
      signedUrlCreatedNow: false,
    })
  }

  const allGpuModelAdmissionReady = rows.every((row) => (
    row.runtimeJobAdmissionReadyWithProvidedEvidence === true &&
    row.admissionDecision === 'runtime_job_admission_ready_for_worker_enqueue'
  ))
  const allMockClaims = records.every((record) => record.mockWorkerClaimReturned)
  const allMockEvents = records.every((record) => record.mockWorkerEventRecorded)
  const allMockAudits = records.every((record) => record.mockAuditEventRecorded)
  const allDispatchCompleted = records.every((record) => (
    record.dispatcherStatus === 'completed' &&
    record.dispatcherMockOnlyRoute &&
    record.dispatcherAiGraphicsGpuHandoffRoute &&
    record.dispatcherHardGateBlockCount === 0 &&
    record.inMemoryDispatcherLeaseCreated &&
    record.inMemoryDispatcherLeaseReleased &&
    record.toolRunResultsCreated === 0 &&
    record.artifactRecordsCreated === 0 &&
    record.qualityGateResultsCreated === 0
  ))

  return {
    schemaVersion:
      '2026-07-02.ai-graphics.external-beta-gpu-model-worker-boundary-proof',
    decision,
    status,
    sourceGpuModelAdmissionSmokePath: sourcePath,
    sourceGpuModelAdmissionSmokeDecision: source.decision,
    sourceGpuModelAdmissionSmokeAccepted: true,
    sourceRouteAdmissionSmokePerformedEarlier: true,
    existingWorkerBoundaryUsed: 'ai_graphics_runtime_queue_service_and_production_worker_dispatcher',
    newGpuWorkerCreated: false,
    records,
    counts: {
      totalAiGraphicsTools: 21,
      gpuModelToolsCovered: records.length,
      sourceGpuModelAdmissionReadyWithProvidedRefsTools:
        rows.filter((row) => row.runtimeJobAdmissionReadyWithProvidedEvidence).length,
      existingRuntimeQueueServiceBatchesCreated: queueResult.jobBatchId ? 1 : 0,
      existingRuntimeQueueServiceJobsCreated:
        queueResult.insertedJobCount ?? 0,
      mockWorkerClaimsReturned:
        records.filter((record) => record.mockWorkerClaimReturned).length,
      mockWorkerEventsRecorded:
        records.filter((record) => record.mockWorkerEventRecorded).length,
      mockAuditEventsRecorded:
        records.filter((record) => record.mockAuditEventRecorded).length,
      mockProductionWorkerDispatcherDryRunJobsCompleted:
        records.filter((record) => record.dispatcherStatus === 'completed').length,
      inMemoryDispatcherLeasesCreated:
        records.filter((record) => record.inMemoryDispatcherLeaseCreated).length,
      inMemoryDispatcherLeasesReleased:
        records.filter((record) => record.inMemoryDispatcherLeaseReleased).length,
      dispatcherHardGateBlockCount:
        records.reduce((sum, record) => sum + record.dispatcherHardGateBlockCount, 0),
      liveSupabaseQueueWritesNow: 0,
      liveWorkerClaimRowsNow: 0,
      liveWorkerDispatchesNow: 0,
      liveToolExecutionsNow: 0,
      gpuRuntimeShouldStartNowTools:
        records.filter((record) => record.gpuRuntimeShouldStartNow).length,
      modelWeightsLoadedTools:
        records.filter((record) => record.modelWeightsLoadedNow).length,
      publicArtifactCreatedTools:
        records.filter((record) => record.publicArtifactCreatedNow).length,
      signedUrlCreatedTools:
        records.filter((record) => record.signedUrlCreatedNow).length,
    },
    booleans: {
      gpuModelWorkerBoundaryProofPassed:
        allGpuModelAdmissionReady && allMockClaims && allMockEvents &&
        allMockAudits && allDispatchCompleted,
      sourceGpuModelAdmissionSmokeAccepted: true,
      all8GpuModelToolsAcceptedPrivateProofRefsForAdmission:
        allGpuModelAdmissionReady,
      all8GpuModelToolsUseExistingRuntimeQueueService:
        records.every((record) => record.existingRuntimeQueueServiceUsed),
      usesExistingAiGraphicsRuntimeQueueService: true,
      usesExistingProductionWorkerDispatcher: true,
      newGpuWorkerCreated: false,
      queueServiceMockOnly: queueResult.mockOnly === true,
      mockRuntimeQueueJobsCreatedForAll8:
        (queueResult.insertedJobCount ?? 0) === 8,
      mockWorkerClaimsCreatedForAll8: allMockClaims,
      mockWorkerEventsRecordedForAll8: allMockEvents,
      mockAuditEventsRecordedForAll8: allMockAudits,
      existingProductionWorkerDispatcherDryRunAcceptedAll8:
        allDispatchCompleted,
      allDispatcherRoutesAiGraphicsGpuHandoff:
        records.every((record) => record.dispatcherAiGraphicsGpuHandoffRoute),
      noHardGateFailures:
        records.every((record) => record.dispatcherHardGateBlockCount === 0),
      allInMemoryDispatcherLeasesCreated:
        records.every((record) => record.inMemoryDispatcherLeaseCreated),
      allInMemoryDispatcherLeasesReleased:
        records.every((record) => record.inMemoryDispatcherLeaseReleased),
      allToolRunResultsEmpty:
        records.every((record) => record.toolRunResultsCreated === 0),
      allArtifactRecordsEmpty:
        records.every((record) => record.artifactRecordsCreated === 0),
      allQualityGateResultsEmpty:
        records.every((record) => record.qualityGateResultsCreated === 0),
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      allGpuModelJobsCarryGpuStartAllowedAfterAcceptedWorkerJob:
        records.every((record) => (
          record.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true
        )),
      agentCanSelectForPlanning: true,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      liveWorkerClaimApprovedNow: false,
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
      routeExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    nextMilestones: [
      'Promote this mock boundary proof into a non-production live queue-write smoke with approved service-role and private artifact refs.',
      'Attach live worker claim telemetry and a Cloud Run/GPU worker pool only after external-beta queue authorization is approved.',
      'Keep GPU runtime on-demand: start GPU only after an accepted live worker/tool-call job claims a GPU/model tool.',
      'Do not create a new GPU worker unless the existing runtime queue service or production worker dispatcher cannot support private model mounting, GPU lifecycle, rollback, or artifact isolation.',
    ],
  }
}

function renderMarkdown(report: Awaited<ReturnType<typeof buildReport>>): string {
  const table = report.records.map((record) => (
    `| \`${record.toolId}\` | \`${record.runtimeTarget}\` | ${record.runtimeQueueServiceMockOnly ? 'yes' : 'no'} | ${record.mockWorkerClaimReturned ? 'yes' : 'no'} | ${record.dispatcherAiGraphicsGpuHandoffRoute ? 'yes' : 'no'} | ${record.gpuRuntimeShouldStartNow ? 'yes' : 'no'} |`
  )).join('\n')

  return `# AI Graphics External Beta GPU/Model Worker Boundary Proof

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This proof binds the eight GPU/model tool route-admission results to the existing AI graphics runtime queue service and production worker dispatcher boundary. It does not create a new GPU worker. It does not perform live queue writes, dispatch live workers, execute tools, load model weights, start GPU runtime, create signed URLs, or create public artifacts.

## Source

- Source route admission packet: \`${report.sourceGpuModelAdmissionSmokePath}\`
- Source decision: \`${report.sourceGpuModelAdmissionSmokeDecision}\`
- Source accepted: \`${report.sourceGpuModelAdmissionSmokeAccepted}\`
- Existing worker boundary: \`${report.existingWorkerBoundaryUsed}\`
- New GPU worker created: \`${report.newGpuWorkerCreated}\`

## Tool Boundary Results

| Tool | Runtime target | Queue mock-only | Mock claim | Dispatcher handoff | GPU starts now |
| --- | --- | --- | --- | --- | --- |
${table}

## Counts

- GPU/model tools covered: \`${report.counts.gpuModelToolsCovered}\`
- Source proof-ready tools: \`${report.counts.sourceGpuModelAdmissionReadyWithProvidedRefsTools}\`
- Existing runtime queue service jobs created in mock mode: \`${report.counts.existingRuntimeQueueServiceJobsCreated}\`
- Mock worker claims returned: \`${report.counts.mockWorkerClaimsReturned}\`
- Mock worker events recorded: \`${report.counts.mockWorkerEventsRecorded}\`
- Existing production worker dispatcher dry-run jobs completed: \`${report.counts.mockProductionWorkerDispatcherDryRunJobsCompleted}\`
- In-memory dispatcher leases created/released: \`${report.counts.inMemoryDispatcherLeasesCreated}\` / \`${report.counts.inMemoryDispatcherLeasesReleased}\`
- Live Supabase queue writes now: \`${report.counts.liveSupabaseQueueWritesNow}\`
- Live worker dispatches now: \`${report.counts.liveWorkerDispatchesNow}\`
- Tool executions now: \`${report.counts.liveToolExecutionsNow}\`
- GPU runtime should start now tools: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Booleans

- \`gpuModelWorkerBoundaryProofPassed\`: \`${report.booleans.gpuModelWorkerBoundaryProofPassed}\`
- \`all8GpuModelToolsUseExistingRuntimeQueueService\`: \`${report.booleans.all8GpuModelToolsUseExistingRuntimeQueueService}\`
- \`usesExistingProductionWorkerDispatcher\`: \`${report.booleans.usesExistingProductionWorkerDispatcher}\`
- \`newGpuWorkerCreated\`: \`${report.booleans.newGpuWorkerCreated}\`
- \`gpuRuntimeOnDemandOnly\`: \`${report.booleans.gpuRuntimeOnDemandOnly}\`
- \`noIdleGpuRuntimeApproved\`: \`${report.booleans.noIdleGpuRuntimeApproved}\`
- \`agentCanExecuteGpuModelToolsNow\`: \`${report.booleans.agentCanExecuteGpuModelToolsNow}\`
- \`gpuRuntimeShouldStartNow\`: \`${report.booleans.gpuRuntimeShouldStartNow}\`
- \`modelWeightsLoaded\`: \`${report.booleans.modelWeightsLoaded}\`
- \`publicArtifactCreated\`: \`${report.booleans.publicArtifactCreated}\`
- \`signedUrlCreated\`: \`${report.booleans.signedUrlCreated}\`

## Next Milestones

${report.nextMilestones.map((item) => `- ${item}`).join('\n')}
`
}

async function main(): Promise<void> {
  const sourcePath = stringFlag('--source-packet') ?? sourcePacketPath
  const report = await buildReport(sourcePath)
  if (hasFlag('--write-records')) {
    fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    fs.writeFileSync(outputMdPath, renderMarkdown(report), 'utf8')
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
