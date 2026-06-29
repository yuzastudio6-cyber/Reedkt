import type { JobEventRecord, JobRecord } from '../../types/jobs'
import { createBackendRuntimeEnvelope } from '../runtime/backend-runtime-envelope-service'
import { sendMockRuntimeEnvelope } from '../runtime/backend-runtime-transport-service'
import { checkIdempotencyConflictMock, recordIdempotencyResultMock } from '../runtime/idempotency-service'
import { claimWorkerLeaseMock } from '../runtime/worker-lease-service'
import { createMockDatabase, insertMockRecord, nowIso } from './mock-database'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT, validateQwen25VlLocalQueueFixture } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_PLAN } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan'
import { QWEN2_5_VL_RUNTIME_PERSISTENCE_TO_WORKER_DISPATCH_READINESS_REVIEW } from './mock-qwen2-5-vl-runtime-persistence-to-worker-dispatch-readiness-review'
import { runQwen25VlFailClosedBackendRuntimeDispatchCoordinator } from '../workers/qwen2-5-vl-backend-runtime-dispatch-coordinator'

type JsonRecord = Record<string, unknown>

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_smoke_executed_mock_only_result_review_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BM-CONTROLLED-PERSISTED-WORKER-DISPATCH-SMOKE-RESULT-REVIEW: review controlled persisted Qwen worker dispatch smoke result, no Cloud Run invocation/no inference/no assets/no beta' as const

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

function createMockJobRecord(input: {
  jobId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  idempotencyKey: string
  payload: JsonRecord
}): JobRecord {
  return {
    id: input.jobId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    creditReservationId: input.creditReservationId,
    jobType: 'media_analysis',
    status: 'queued',
    priority: 'normal',
    workerTarget: 'media_analysis_agent',
    runtimeType: 'gpu_worker',
    jobName: 'Mock Qwen2.5-VL persisted dispatch smoke job',
    jobDescription: 'Mock-only persisted dispatch smoke job shape; no worker dispatch occurs.',
    dependsOnAll: true,
    inputPayload: {
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      idempotencyKey: input.idempotencyKey,
      sourceOfTruthRefsPresent: Boolean(input.payload.sourceOfTruthRefs),
      runtimeGatesPresent: Boolean(input.payload.runtimeGates),
    },
    outputPayload: {},
    errorPayload: {},
    failureCategory: 'unknown',
    attemptCount: 0,
    maxAttempts: 1,
    idempotencyKey: input.idempotencyKey,
    progressPercent: 0,
    progressMessage: 'Mock persisted dispatch smoke queued shape only.',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      toolId: 'qwen2_5_vl_7b_instruct',
      registryToolId: 'qwen_vl',
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      mockOnly: true,
      realWorkerDispatchAllowed: false,
      cloudRunInvocationAllowed: false,
      inferenceAllowed: false,
    },
  }
}

function createMockJobEvent(input: {
  jobId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
}): JobEventRecord {
  return {
    id: 'job_event_mock_qwen_persisted_dispatch_001',
    jobId: input.jobId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    eventType: 'blocked',
    message: 'Mock persisted dispatch smoke stopped before real worker dispatch.',
    progressPercent: 0,
    actorType: 'system',
    payload: {
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      sanitizedSummaryOnly: true,
      cloudRunInvocationAttempted: false,
      inferenceRun: false,
      generatedAssetsCreated: false,
    },
    createdAt: nowIso(),
    metadata: {
      mockOnly: true,
      rawPromptStored: false,
      secretStored: false,
    },
  }
}

export function createQwen25VlControlledPersistedWorkerDispatchSmokeExecutionResult() {
  const db = createMockDatabase()
  const queueFixture = QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture
  const payload = asRecord(queueFixture.payloadJson)
  const jobId = String(payload.jobId)
  const workspaceId = String(queueFixture.workspaceId)
  const projectId = String(queueFixture.projectId)
  const approvedPlanSnapshotId = String(queueFixture.approvedPlanSnapshotId)
  const creditReservationId = String(queueFixture.creditReservationId)
  const idempotencyKey = String(queueFixture.idempotencyKey)

  const queueValidation = validateQwen25VlLocalQueueFixture(queueFixture)
  const coordinatorDefaultPath = runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({ queueFixture })
  const coordinatorAdapterPreviewPath = runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
    queueFixture,
    continueAfterLeaseBackendRequirementForPreview: true,
  })
  const coordinatorTransportPreviewPath = runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
    queueFixture,
    continueAfterLeaseBackendRequirementForPreview: true,
    continueAfterDispatchAdapterForPreview: true,
  })

  insertMockRecord(db, 'jobs', createMockJobRecord({
    jobId,
    workspaceId,
    projectId,
    approvedPlanSnapshotId,
    creditReservationId,
    idempotencyKey,
    payload,
  }))

  const idempotencyRecord = recordIdempotencyResultMock(db, {
    idempotencyKey,
    scope: 'job',
    sourceId: jobId,
    result: {
      status: 'mock_controlled_persisted_dispatch_shape_recorded',
      approvedPlanSnapshotId,
      cloudRunInvocationAttempted: false,
      inferenceRun: false,
    },
  })
  const idempotencyCheck = checkIdempotencyConflictMock(db, idempotencyKey, jobId)

  const leaseResult = claimWorkerLeaseMock(db, {
    jobId,
    workspaceId,
    projectId,
    workerId: 'qwen_worker_mock_persisted_dispatch_smoke',
    workerKind: 'qa_worker',
    leaseDurationMinutes: 5,
  })

  insertMockRecord(db, 'jobEvents', createMockJobEvent({
    jobId,
    workspaceId,
    projectId,
    approvedPlanSnapshotId,
  }))

  const runtimeEnvelope = createBackendRuntimeEnvelope({
    requestId: 'runtime_request_mock_qwen_persisted_dispatch_001',
    jobId,
    workspaceId,
    projectId,
    target: 'qa_worker',
    transportMode: 'mock',
    safetyLevel: 'backend_required',
    idempotencyKey: `runtime:${idempotencyKey}`,
    mockOnly: true,
    payload: {
      approvedPlanSnapshotId,
      queueFixtureAccepted: queueValidation.ok,
      coordinatorStatus: coordinatorTransportPreviewPath.status,
      cloudRunInvocationAttempted: false,
      inferenceRun: false,
      generatedAssetsCreated: false,
    },
  })
  const runtimeTransportResult = sendMockRuntimeEnvelope(runtimeEnvelope, db)

  const smokePassed =
    queueValidation.ok &&
    coordinatorDefaultPath.status === 'blocked_real_lease_backend_required' &&
    coordinatorAdapterPreviewPath.status === 'blocked_qwen_dispatch_adapter_fail_closed' &&
    coordinatorTransportPreviewPath.status === 'blocked_private_invoke_transport_preview_only' &&
    idempotencyCheck.ok &&
    idempotencyCheck.conflict === false &&
    leaseResult.ok &&
    runtimeTransportResult.ok &&
    db.jobs.length === 1 &&
    db.runtimeIdempotencyRecords.length === 1 &&
    db.workerLeases.length === 1 &&
    db.workerLeaseClaimAttempts.length === 1 &&
    db.jobEvents.length === 1 &&
    db.backendRuntimeMessages.length === 1

  return {
    workstream: 'AI_VIDEO_BROLL_GENERATION',
    toolId: 'qwen2_5_vl_7b_instruct',
    registryToolId: 'qwen_vl',
    mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_smoke_execution_result',
    decision: DECISION,
    upstreamControlledPersistedWorkerDispatchSmokePlanDecision:
      QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_PLAN.decision,
    upstreamRuntimePersistenceToWorkerDispatchReadinessReviewDecision:
      QWEN2_5_VL_RUNTIME_PERSISTENCE_TO_WORKER_DISPATCH_READINESS_REVIEW.decision,
    executionSummary: {
      controlledPersistedWorkerDispatchSmokeExecuted: true,
      controlledPersistedWorkerDispatchSmokePassed: smokePassed,
      resultReviewRequired: true,
      mockOnly: true,
      recordsStoredInMemoryOnly: true,
      generatedLocalFixturePassedClaimed: false,
    },
    executedChecks: [
      {
        id: 'queue_fixture_validation',
        status: queueValidation.ok ? 'passed' : 'failed',
        issues: queueValidation.issues,
      },
      {
        id: 'coordinator_default_path',
        status: coordinatorDefaultPath.status,
      },
      {
        id: 'coordinator_adapter_preview_path',
        status: coordinatorAdapterPreviewPath.status,
      },
      {
        id: 'coordinator_transport_preview_path',
        status: coordinatorTransportPreviewPath.status,
      },
      {
        id: 'mock_idempotency_shape',
        status: idempotencyCheck.ok && !idempotencyCheck.conflict ? 'passed' : 'failed',
        recordStatus: idempotencyRecord.status,
      },
      {
        id: 'mock_worker_lease_shape',
        status: leaseResult.ok ? 'passed' : 'failed',
        claimResult: leaseResult.claimResult,
      },
      {
        id: 'mock_backend_runtime_message_shape',
        status: runtimeTransportResult.ok ? 'passed' : 'failed',
        transportStatus: runtimeTransportResult.status,
      },
    ],
    mockRecordCounts: {
      jobs: db.jobs.length,
      runtimeIdempotencyRecords: db.runtimeIdempotencyRecords.length,
      workerLeases: db.workerLeases.length,
      workerLeaseClaimAttempts: db.workerLeaseClaimAttempts.length,
      jobEvents: db.jobEvents.length,
      backendRuntimeMessages: db.backendRuntimeMessages.length,
      generatedAssets: db.generatedAssets.length,
      creditReservations: db.creditReservations.length,
      qaReports: db.qaReports.length,
    },
    sourceOfTruthExpectation: {
      approvedPlanSnapshotId,
      creditReservationId,
      sourceOfTruthRefsPresent: true,
      privateManifestRefsOnly: true,
      checksumRefsOnly: true,
      signedUrlsAreSourceOfTruth: false,
      publicUrlsAreSourceOfTruth: false,
      storageObjectsCreated: false,
      signedUrlsCreated: false,
    },
    runtimeFlags: {
      controlledPersistedWorkerDispatchSmokePlanRecorded: true,
      controlledPersistedWorkerDispatchSmokeExecutionRequired: false,
      controlledPersistedWorkerDispatchSmokeExecuted: true,
      controlledPersistedWorkerDispatchSmokePassed: smokePassed,
      controlledPersistedWorkerDispatchSmokeResultReviewRequired: true,
      mockQueueFixtureValidated: queueValidation.ok,
      mockCoordinatorDefaultPathExecuted: true,
      mockCoordinatorAdapterPreviewPathExecuted: true,
      mockCoordinatorTransportPreviewPathExecuted: true,
      mockJobRecordCreated: db.jobs.length === 1,
      mockIdempotencyRecordCreated: db.runtimeIdempotencyRecords.length === 1,
      mockWorkerLeaseClaimed: db.workerLeases.length === 1,
      mockWorkerClaimAttemptCreated: db.workerLeaseClaimAttempts.length === 1,
      mockJobEventCreated: db.jobEvents.length === 1,
      mockBackendRuntimeMessageCreated: db.backendRuntimeMessages.length === 1,
      mockRecordsStoredInMemoryOnly: true,
      readyForRealWorkerDispatch: false,
      privateInvokeReady: false,
      realJobCreated: false,
      realLeaseClaimed: false,
      idempotencyRowCreated: false,
      jobEventCreated: false,
      backendRuntimeMessageCreated: false,
      workerClaimCreated: false,
      storageObjectRecordCreated: false,
      signedUrlEventCreated: false,
      qaReportCreated: false,
      auditEventCreated: false,
      creditMutationCreated: false,
      cloudRunInvocationAttempted: false,
      serviceRuntimeRequestSent: false,
      serviceUrlResolvedNow: false,
      audienceResolvedNow: false,
      identityTokenFetched: false,
      authHeaderCreated: false,
      modelImportRun: false,
      modelLoadRun: false,
      vllmEngineInitialized: false,
      promptProcessed: false,
      forwardPassRun: false,
      inferenceRun: false,
      providerCallsMade: false,
      workersDispatched: false,
      supabaseCloudTouched: false,
      stagingTouched: false,
      productionTouched: false,
      sqlExecuted: false,
      generatedAssetsCreated: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      mediaProcessingRun: false,
      renderExportRun: false,
      betaReady: false,
      productionReady: false,
      dryRunPassedClaimed: false,
      generatedLocalFixturePassedClaimed: false,
    },
    nextPrompt: NEXT_PROMPT,
  } as const
}

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_EXECUTION_RESULT =
  createQwen25VlControlledPersistedWorkerDispatchSmokeExecutionResult()

export type Qwen25VlControlledPersistedWorkerDispatchSmokeExecutionResult =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_EXECUTION_RESULT
