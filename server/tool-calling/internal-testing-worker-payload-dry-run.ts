import type {
  CloudWorkerExecutionMode,
  CloudWorkerType,
  WorkerJobPayload,
} from '../../src/backend/cloud/worker-job-contracts'
import {
  validateWorkerJobPayload,
} from '../../src/backend/cloud/worker-job-contracts'
import type {
  ProductionWorkerRuntimeType,
} from '../workers/production/production-worker-types'
import {
  reviewInternalTestingApprovedSnapshotAdapterRoutes,
  type InternalTestingApprovedSnapshotRouteReviewInput,
} from './internal-testing-approved-snapshot-route-review'

export const INTERNAL_TESTING_WORKER_PAYLOAD_DRY_RUN_DECISION =
  'internal_testing_worker_payload_dry_run_passed_ready_for_mock_worker_queue_review'

export type InternalTestingWorkerPayloadDryRunStatus =
  | 'passed_ready_for_mock_worker_queue_review'
  | 'blocked_by_route_review_or_payload_validation'

export interface InternalTestingWorkerPayloadDryRunInput extends InternalTestingApprovedSnapshotRouteReviewInput {
  editPlanId?: string
}

export interface InternalTestingWorkerPayloadDryRunResult {
  decision: typeof INTERNAL_TESTING_WORKER_PAYLOAD_DRY_RUN_DECISION
  status: InternalTestingWorkerPayloadDryRunStatus
  source: 'approved_snapshot_route_review_and_cloud_worker_payload_contracts'
  workspaceId: string
  projectId: string
  editSessionId: string
  routeCount: number
  payloadCount: number
  validPayloadCount: number
  blockedPayloadCount: number
  blockers: readonly string[]
  payloads: readonly WorkerJobPayload[]
  validationSummaries: readonly {
    jobId: string
    workerType: CloudWorkerType
    executionMode: CloudWorkerExecutionMode
    valid: boolean
    errorCount: number
    warningCount: number
  }[]
  productReady: false
  blockedScope: {
    frontendToolExecution: false
    rawPromptExecution: false
    publicOrSignedUrlArtifacts: false
    serviceRoleBrowserAccess: false
    providerOrModelCalls: false
    workerDispatch: false
    mediaProcessing: false
    renderOrExport: false
    creditSpend: false
    ledgerWrites: false
    supabaseWrites: false
    externalBeta: false
    paidProduction: false
    productReady: false
  }
}

const deterministicRequestedAt = '2026-07-09T00:00:00.000Z'

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 96)
}

function mapCloudWorkerType(workerType: ProductionWorkerRuntimeType): CloudWorkerType {
  switch (workerType) {
    case 'cpu_analysis_worker':
    case 'tool_readiness_worker':
      return 'media_analysis_worker'
    case 'gpu_ai_worker':
      return 'image_asset_worker'
    case 'render_worker':
      return 'remotion_render_worker'
    case 'qa_worker':
      return 'qa_worker'
  }
}

function mapCloudExecutionMode(workerType: ProductionWorkerRuntimeType): CloudWorkerExecutionMode {
  switch (workerType) {
    case 'cpu_analysis_worker':
    case 'tool_readiness_worker':
      return 'analysis_worker'
    case 'gpu_ai_worker':
      return 'generation_worker'
    case 'render_worker':
      return 'render_worker'
    case 'qa_worker':
      return 'qa_worker'
  }
}

function buildPayloads(input: InternalTestingWorkerPayloadDryRunInput): WorkerJobPayload[] {
  const routeReview = reviewInternalTestingApprovedSnapshotAdapterRoutes(input)
  if (routeReview.status !== 'passed_ready_for_worker_payload_dry_run') {
    return []
  }

  const sourceAssetIds = (input.privateArtifactReferences ?? [])
    .filter((ref) => ref.artifactType === 'source_media')
    .map((ref) => ref.storageReferenceId)

  return routeReview.routeSummaries.map((route, index) => {
    const cloudWorkerType = mapCloudWorkerType(route.workerType as ProductionWorkerRuntimeType)

    return {
      jobId: `worker-payload-dry-run-${String(index + 1).padStart(2, '0')}-${safeSegment(route.operationId)}`,
      jobBatchId: `worker-payload-dry-run-batch-${safeSegment(input.toolExecutionPlanId ?? 'missing')}`,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId ?? '',
      editPlanId: input.editPlanId ?? input.toolExecutionPlanId ?? '',
      creditReservationId: input.creditReservationId,
      workerType: cloudWorkerType,
      executionMode: mapCloudExecutionMode(route.workerType as ProductionWorkerRuntimeType),
      sourceAssetIds,
      segmentIds: [],
      operationIds: [route.operationId],
      visualAssetPlanItemIds: [],
      rendererLayerIds: cloudWorkerType === 'remotion_render_worker' ? [`renderer-layer-${safeSegment(route.adapterPlanId)}`] : [],
      toolStrategyItemIds: [route.adapterPlanId],
      idempotencyKey: `${input.idempotencyKey ?? 'missing'}:${safeSegment(route.adapterPlanId)}`,
      attempt: 1,
      maxAttempts: 1,
      requestedAt: deterministicRequestedAt,
      metadata: {
        dryRunOnly: true,
        editSessionId: input.editSessionId,
        toolExecutionPlanId: input.toolExecutionPlanId ?? '',
        adapterPlanId: route.adapterPlanId,
        sourceOperationId: route.operationId,
        futureHandler: route.futureHandler,
        storageReferenceMode: route.storageReferenceMode,
        noWorkerDispatch: true,
        noMediaProcessing: true,
        noCreditSpend: true,
      },
    } satisfies WorkerJobPayload
  })
}

function collectRouteReviewBlockers(input: InternalTestingWorkerPayloadDryRunInput): string[] {
  const routeReview = reviewInternalTestingApprovedSnapshotAdapterRoutes(input)
  const blockers = [...routeReview.blockers]
  if (!input.editPlanId?.trim() && !input.toolExecutionPlanId?.trim()) {
    blockers.push('editPlanId_or_toolExecutionPlanId_missing')
  }
  return [...new Set(blockers)]
}

export function runInternalTestingWorkerPayloadDryRun(
  input: InternalTestingWorkerPayloadDryRunInput,
): InternalTestingWorkerPayloadDryRunResult {
  const routeReviewBlockers = collectRouteReviewBlockers(input)
  const payloads = routeReviewBlockers.length === 0 ? buildPayloads(input) : []
  const validationResults = payloads.map((payload) => ({
    payload,
    validation: validateWorkerJobPayload(payload),
  }))
  const validationBlockers = validationResults.flatMap(({ payload, validation }) =>
    validation.ok ? [] : validation.errors.map((error) => `${payload.jobId}:${error}`),
  )
  const blockers = [...routeReviewBlockers, ...validationBlockers]
  const validPayloadCount = validationResults.filter(({ validation }) => validation.ok).length

  return {
    decision: INTERNAL_TESTING_WORKER_PAYLOAD_DRY_RUN_DECISION,
    status: blockers.length === 0 && payloads.length > 0
      ? 'passed_ready_for_mock_worker_queue_review'
      : 'blocked_by_route_review_or_payload_validation',
    source: 'approved_snapshot_route_review_and_cloud_worker_payload_contracts',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    routeCount: reviewInternalTestingApprovedSnapshotAdapterRoutes(input).routeCount,
    payloadCount: payloads.length,
    validPayloadCount,
    blockedPayloadCount: payloads.length - validPayloadCount,
    blockers,
    payloads,
    validationSummaries: validationResults.map(({ payload, validation }) => ({
      jobId: payload.jobId,
      workerType: payload.workerType,
      executionMode: payload.executionMode,
      valid: validation.ok,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
    })),
    productReady: false,
    blockedScope: {
      frontendToolExecution: false,
      rawPromptExecution: false,
      publicOrSignedUrlArtifacts: false,
      serviceRoleBrowserAccess: false,
      providerOrModelCalls: false,
      workerDispatch: false,
      mediaProcessing: false,
      renderOrExport: false,
      creditSpend: false,
      ledgerWrites: false,
      supabaseWrites: false,
      externalBeta: false,
      paidProduction: false,
      productReady: false,
    },
  }
}
