import { runWorkerJobSchema } from '../../../server/validation/worker-schemas'
import {
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT,
  validateQwen25VlLocalQueueFixture,
  type Qwen25VlLocalQueueValidationIssue,
} from '../mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { createMockDatabase } from '../mock/mock-database'
import { checkIdempotencyConflictMock, recordIdempotencyResultMock } from '../runtime/idempotency-service'
import { claimWorkerLease } from '../runtime/worker-lease-service'
import { runQwen25VlCloudRunGpuFailClosedDispatchAdapter } from './qwen2-5-vl-cloud-run-gpu-dispatch-adapter'
import { buildQwen25VlPrivateInvokeEnvelope } from './qwen2-5-vl-cloud-run-gpu-private-invoke-envelope'
import {
  createQwen25VlPrivateInvokeRuntimeApproval,
  previewQwen25VlPrivateInvokeTransportAdapter,
} from './qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter'

type JsonRecord = Record<string, unknown>

export type Qwen25VlFailClosedBackendRuntimeDispatchCoordinatorStatus =
  | 'blocked_invalid_worker_job_schema'
  | 'blocked_missing_approved_snapshot'
  | 'blocked_missing_credit_reservation'
  | 'blocked_missing_source_of_truth_refs'
  | 'blocked_idempotency_conflict'
  | 'blocked_real_lease_backend_required'
  | 'blocked_qwen_dispatch_adapter_fail_closed'
  | 'blocked_private_invoke_transport_preview_only'

export interface Qwen25VlFailClosedBackendRuntimeDispatchCoordinatorInput {
  queueFixture?: JsonRecord
  forceIdempotencyConflict?: boolean
  continueAfterLeaseBackendRequirementForPreview?: boolean
  continueAfterDispatchAdapterForPreview?: boolean
}

export interface Qwen25VlFailClosedBackendRuntimeDispatchCoordinatorResult {
  ok: false
  status: Qwen25VlFailClosedBackendRuntimeDispatchCoordinatorStatus
  decision: 'qwen2_5_vl_fail_closed_backend_runtime_dispatch_coordinator_blocked_no_runtime_side_effect'
  workerJobSchemaValidated: boolean
  localQueueValidated: boolean
  queueValidationIssues: Qwen25VlLocalQueueValidationIssue[]
  approvedSnapshotPresent: boolean
  creditReservationPresent: boolean
  sourceOfTruthRefsPresent: boolean
  idempotencyChecked: boolean
  idempotencyConflict: boolean
  backendLeaseChecked: boolean
  qwenDispatchAdapterChecked: boolean
  privateInvokeEnvelopeChecked: boolean
  privateInvokeTransportPreviewChecked: boolean
  message: string
  runtimeFlags: Qwen25VlFailClosedBackendRuntimeDispatchCoordinatorRuntimeFlags
  warnings: string[]
}

export type Qwen25VlFailClosedBackendRuntimeDispatchCoordinatorRuntimeFlags = {
  [Key in keyof typeof BASE_RUNTIME_FLAGS]: boolean
}

const DECISION =
  'qwen2_5_vl_fail_closed_backend_runtime_dispatch_coordinator_blocked_no_runtime_side_effect' as const

const BASE_RUNTIME_FLAGS = {
  coordinatorImplemented: true,
  coordinatorInvokedLocally: true,
  workerJobSchemaValidated: false,
  localQueueValidated: false,
  approvedSnapshotChecked: false,
  creditReservationChecked: false,
  sourceOfTruthRefsChecked: false,
  idempotencyChecked: false,
  backendLeasePreconditionChecked: false,
  qwenDispatchAdapterChecked: false,
  privateInvokeEnvelopeChecked: false,
  privateInvokeTransportPreviewChecked: false,
  realJobCreated: false,
  realLeaseClaimed: false,
  idempotencyRowCreated: false,
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
  supabaseTouched: false,
  sqlExecuted: false,
  generatedAssetsCreated: false,
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  mediaProcessingRun: false,
  renderExportRun: false,
  creditMutationCreated: false,
  betaReady: false,
  productionReady: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
} as const

export function runQwen25VlFailClosedBackendRuntimeDispatchCoordinator(
  input: Qwen25VlFailClosedBackendRuntimeDispatchCoordinatorInput = {},
): Qwen25VlFailClosedBackendRuntimeDispatchCoordinatorResult {
  const queueFixture = input.queueFixture ??
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture
  const workerSchema = runWorkerJobSchema.safeParse(queueFixture)

  if (!workerSchema.success) {
    return buildResult({
      status: 'blocked_invalid_worker_job_schema',
      workerJobSchemaValidated: false,
      localQueueValidated: false,
      queueValidationIssues: [],
      approvedSnapshotPresent: false,
      creditReservationPresent: false,
      sourceOfTruthRefsPresent: false,
      idempotencyChecked: false,
      idempotencyConflict: false,
      backendLeaseChecked: false,
      qwenDispatchAdapterChecked: false,
      privateInvokeEnvelopeChecked: false,
      privateInvokeTransportPreviewChecked: false,
      message: 'Qwen backend dispatch coordinator refused the request before runtime checks because runWorkerJobSchema validation failed.',
      runtimeFlags: BASE_RUNTIME_FLAGS,
      warnings: [
        'Invalid worker job envelopes cannot reach approved snapshot, lease, adapter, or transport checks.',
        'No job row, lease row, Cloud Run request, Supabase mutation, or generated asset was created.',
      ],
    })
  }

  const queueValidation = validateQwen25VlLocalQueueFixture(queueFixture)
  const payload = asRecord(queueFixture.payloadJson)
  const sourceRefs = asRecord(payload.sourceOfTruthRefs)
  const approvedSnapshotPresent = Boolean(queueFixture.approvedPlanSnapshotId && payload.approvedPlanSnapshotId)
  const creditReservationPresent = Boolean(queueFixture.creditReservationId && payload.creditReservationId)
  const sourceOfTruthRefsPresent = queueValidation.issues.every((issue) =>
    issue !== 'missing_source_of_truth_refs' && issue !== 'signed_url_source_of_truth',
  )
  const checkedFlags = {
    ...BASE_RUNTIME_FLAGS,
    workerJobSchemaValidated: true,
    localQueueValidated: true,
    approvedSnapshotChecked: true,
    creditReservationChecked: true,
    sourceOfTruthRefsChecked: true,
  } as const

  if (queueValidation.issues.includes('missing_approved_snapshot')) {
    return buildResult({
      status: 'blocked_missing_approved_snapshot',
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: false,
      idempotencyConflict: false,
      backendLeaseChecked: false,
      qwenDispatchAdapterChecked: false,
      privateInvokeEnvelopeChecked: false,
      privateInvokeTransportPreviewChecked: false,
      message: 'Qwen backend dispatch coordinator blocked the request because an approved plan snapshot reference is required.',
      runtimeFlags: checkedFlags,
      warnings: ['Workers execute approved snapshots, not raw chat or ad hoc payloads.'],
    })
  }

  if (queueValidation.issues.includes('missing_credit_reservation')) {
    return buildResult({
      status: 'blocked_missing_credit_reservation',
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: false,
      idempotencyConflict: false,
      backendLeaseChecked: false,
      qwenDispatchAdapterChecked: false,
      privateInvokeEnvelopeChecked: false,
      privateInvokeTransportPreviewChecked: false,
      message: 'Qwen backend dispatch coordinator blocked the request because a credit reservation reference is required.',
      runtimeFlags: checkedFlags,
      warnings: ['Future Qwen worker runtime must verify approved credit reservation before dispatch.'],
    })
  }

  if (
    queueValidation.issues.includes('missing_source_of_truth_refs') ||
    queueValidation.issues.includes('signed_url_source_of_truth')
  ) {
    return buildResult({
      status: 'blocked_missing_source_of_truth_refs',
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: false,
      idempotencyConflict: false,
      backendLeaseChecked: false,
      qwenDispatchAdapterChecked: false,
      privateInvokeEnvelopeChecked: false,
      privateInvokeTransportPreviewChecked: false,
      message: 'Qwen backend dispatch coordinator blocked the request because private source-of-truth refs are incomplete or unsafe.',
      runtimeFlags: checkedFlags,
      warnings: [
        'Source of truth requires Supabase row refs, private manifests, checksums, and approved snapshot refs.',
        `Signed/public URL source flags are ${String(sourceRefs.signedUrlsAreSourceOfTruth)} and ${String(sourceRefs.publicUrlsAreSourceOfTruth)}.`,
      ],
    })
  }

  if (!queueValidation.ok) {
    return buildResult({
      status: 'blocked_invalid_worker_job_schema',
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: false,
      idempotencyConflict: false,
      backendLeaseChecked: false,
      qwenDispatchAdapterChecked: false,
      privateInvokeEnvelopeChecked: false,
      privateInvokeTransportPreviewChecked: false,
      message: 'Qwen backend dispatch coordinator blocked the request because the local queue contract is invalid.',
      runtimeFlags: checkedFlags,
      warnings: ['Only approved Qwen queue contract fixtures can reach idempotency and lease preconditions.'],
    })
  }

  const idempotencyKey = String(queueFixture.idempotencyKey)
  const jobId = String(payload.jobId)
  const idempotencyDb = createMockDatabase()
  if (input.forceIdempotencyConflict) {
    recordIdempotencyResultMock(idempotencyDb, {
      idempotencyKey,
      scope: 'job',
      sourceId: 'mock-different-qwen-job',
      result: { status: 'mock_conflict_existing_result' },
    })
  }
  const idempotencyCheck = checkIdempotencyConflictMock(idempotencyDb, idempotencyKey, jobId)

  if (!idempotencyCheck.ok || idempotencyCheck.conflict) {
    return buildResult({
      status: 'blocked_idempotency_conflict',
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: true,
      idempotencyConflict: true,
      backendLeaseChecked: false,
      qwenDispatchAdapterChecked: false,
      privateInvokeEnvelopeChecked: false,
      privateInvokeTransportPreviewChecked: false,
      message: 'Qwen backend dispatch coordinator blocked the request because mock idempotency conflict detection found a different source for the same key.',
      runtimeFlags: {
        ...checkedFlags,
        idempotencyChecked: true,
      },
      warnings: ['Real idempotency enforcement must be persisted by backend runtime before dispatch.'],
    })
  }

  const realLeasePrecondition = claimWorkerLease()
  if (!input.continueAfterLeaseBackendRequirementForPreview) {
    return buildResult({
      status: 'blocked_real_lease_backend_required',
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: true,
      idempotencyConflict: false,
      backendLeaseChecked: true,
      qwenDispatchAdapterChecked: false,
      privateInvokeEnvelopeChecked: false,
      privateInvokeTransportPreviewChecked: false,
      message: realLeasePrecondition.message,
      runtimeFlags: {
        ...checkedFlags,
        idempotencyChecked: true,
        backendLeasePreconditionChecked: true,
      },
      warnings: [
        'Coordinator stopped at the real lease boundary by default.',
        ...realLeasePrecondition.warnings,
      ],
    })
  }

  const adapterResult = runQwen25VlCloudRunGpuFailClosedDispatchAdapter({ queueFixture })
  if (!input.continueAfterDispatchAdapterForPreview) {
    return buildResult({
      status: 'blocked_qwen_dispatch_adapter_fail_closed',
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: true,
      idempotencyConflict: false,
      backendLeaseChecked: true,
      qwenDispatchAdapterChecked: true,
      privateInvokeEnvelopeChecked: false,
      privateInvokeTransportPreviewChecked: false,
      message: adapterResult.message,
      runtimeFlags: {
        ...checkedFlags,
        idempotencyChecked: true,
        backendLeasePreconditionChecked: true,
        qwenDispatchAdapterChecked: true,
      },
      warnings: adapterResult.warnings,
    })
  }

  const envelopeResult = buildQwen25VlPrivateInvokeEnvelope({ queueFixture })
  const transportPreview = previewQwen25VlPrivateInvokeTransportAdapter({
    queueFixture,
    runtimeApproval: createQwen25VlPrivateInvokeRuntimeApproval({
      invocationEnabledNow: true,
      authReverifyPassed: true,
      cloudRunServiceDescribeVerified: true,
      cloudRunIamPolicyVerified: true,
      runtimeServiceAccountVerified: true,
      projectInvokerPolicyVerified: true,
    }),
    dependencies: createNeverCalledTransportDependencies(),
  })

  return buildResult({
    status: 'blocked_private_invoke_transport_preview_only',
    workerJobSchemaValidated: true,
    localQueueValidated: true,
    queueValidationIssues: queueValidation.issues,
    approvedSnapshotPresent,
    creditReservationPresent,
    sourceOfTruthRefsPresent,
    idempotencyChecked: true,
    idempotencyConflict: false,
    backendLeaseChecked: true,
    qwenDispatchAdapterChecked: true,
    privateInvokeEnvelopeChecked: true,
    privateInvokeTransportPreviewChecked: true,
    message: transportPreview.message,
    runtimeFlags: {
      ...checkedFlags,
      idempotencyChecked: true,
      backendLeasePreconditionChecked: true,
      qwenDispatchAdapterChecked: true,
      privateInvokeEnvelopeChecked: envelopeResult.envelopeAcceptedForFutureTransport,
      privateInvokeTransportPreviewChecked: true,
    },
    warnings: [
      ...transportPreview.warnings,
      'Private invoke transport preview does not resolve URLs, fetch identity tokens, or call injected dependencies.',
    ],
  })
}

function buildResult(input: {
  status: Qwen25VlFailClosedBackendRuntimeDispatchCoordinatorStatus
  workerJobSchemaValidated: boolean
  localQueueValidated: boolean
  queueValidationIssues: Qwen25VlLocalQueueValidationIssue[]
  approvedSnapshotPresent: boolean
  creditReservationPresent: boolean
  sourceOfTruthRefsPresent: boolean
  idempotencyChecked: boolean
  idempotencyConflict: boolean
  backendLeaseChecked: boolean
  qwenDispatchAdapterChecked: boolean
  privateInvokeEnvelopeChecked: boolean
  privateInvokeTransportPreviewChecked: boolean
  message: string
  runtimeFlags: Qwen25VlFailClosedBackendRuntimeDispatchCoordinatorRuntimeFlags
  warnings: string[]
}): Qwen25VlFailClosedBackendRuntimeDispatchCoordinatorResult {
  return {
    ok: false,
    status: input.status,
    decision: DECISION,
    workerJobSchemaValidated: input.workerJobSchemaValidated,
    localQueueValidated: input.localQueueValidated,
    queueValidationIssues: input.queueValidationIssues,
    approvedSnapshotPresent: input.approvedSnapshotPresent,
    creditReservationPresent: input.creditReservationPresent,
    sourceOfTruthRefsPresent: input.sourceOfTruthRefsPresent,
    idempotencyChecked: input.idempotencyChecked,
    idempotencyConflict: input.idempotencyConflict,
    backendLeaseChecked: input.backendLeaseChecked,
    qwenDispatchAdapterChecked: input.qwenDispatchAdapterChecked,
    privateInvokeEnvelopeChecked: input.privateInvokeEnvelopeChecked,
    privateInvokeTransportPreviewChecked: input.privateInvokeTransportPreviewChecked,
    message: input.message,
    runtimeFlags: input.runtimeFlags,
    warnings: input.warnings,
  }
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

function createNeverCalledTransportDependencies() {
  const fail = async (): Promise<string> => {
    throw new Error('Qwen transport preview dependencies must not be called by the fail-closed coordinator.')
  }

  return {
    resolveServiceUrl: fail,
    resolveAudience: fail,
    fetchIdentityToken: fail,
    sendRequest: async () => {
      throw new Error('Qwen transport preview sendRequest must not be called by the fail-closed coordinator.')
    },
  }
}

export const QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR_CONTRACT = {
  coordinatorId: 'qwen2_5_vl_fail_closed_backend_runtime_dispatch_coordinator',
  decision: DECISION,
  workerType:
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.queueEnvelope.workerType,
  jobType:
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.queueEnvelope.jobType,
  acceptsApprovedSnapshotQueueFixture: true,
  createsRealJob: false,
  claimsRealLease: false,
  invokesCloudRun: false,
  resolvesServiceUrl: false,
  fetchesIdentityToken: false,
  runsInference: false,
  mutatesSupabase: false,
  createsGeneratedAsset: false,
  createsPublicArtifact: false,
  createsSignedUrl: false,
  mutatesCredits: false,
  unlocksBeta: false,
  unlocksProduction: false,
  requiredOutcomes: [
    'blocked_invalid_worker_job_schema',
    'blocked_missing_approved_snapshot',
    'blocked_missing_credit_reservation',
    'blocked_missing_source_of_truth_refs',
    'blocked_idempotency_conflict',
    'blocked_real_lease_backend_required',
    'blocked_qwen_dispatch_adapter_fail_closed',
    'blocked_private_invoke_transport_preview_only',
  ],
} as const
