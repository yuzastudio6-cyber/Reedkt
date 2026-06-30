import { runWorkerJobSchema } from '../../../server/validation/worker-schemas'
import {
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT,
  validateQwen25VlLocalQueueFixture,
  type Qwen25VlLocalQueueValidationIssue,
} from '../mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { createMockDatabase, nowIso } from '../mock/mock-database'
import { checkIdempotencyConflictMock, recordIdempotencyResultMock } from '../runtime/idempotency-service'
import { buildQwen25VlPrivateInvokeEnvelope } from './qwen2-5-vl-cloud-run-gpu-private-invoke-envelope'
import {
  createQwen25VlPrivateInvokeRuntimeApproval,
  previewQwen25VlPrivateInvokeTransportAdapter,
} from './qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter'

type JsonRecord = Record<string, unknown>

export type Qwen25VlControlledPersistedJobLeaseBridgeStatus =
  | 'blocked_invalid_worker_job_schema'
  | 'blocked_missing_approved_snapshot'
  | 'blocked_missing_credit_reservation'
  | 'blocked_missing_source_of_truth_refs'
  | 'blocked_idempotency_conflict'
  | 'blocked_private_invoke_envelope'
  | 'blocked_private_invoke_transport_preview_only'

export type Qwen25VlControlledPersistedJobLeaseBridgeStepStatus =
  | 'passed'
  | 'blocked'
  | 'preview_only'
  | 'not_reached'

export interface Qwen25VlControlledPersistedJobLeaseBridgeStep {
  id:
    | 'approved_job_intake'
    | 'persisted_idempotency_guard'
    | 'persisted_job_reference'
    | 'persisted_lease_reference'
    | 'sanitized_job_event_reference'
    | 'backend_runtime_message_reference'
    | 'worker_claim_reference'
    | 'private_invoke_envelope'
    | 'private_invoke_transport_preview'
    | 'qa_audit_cost_credit_boundary'
  status: Qwen25VlControlledPersistedJobLeaseBridgeStepStatus
  summary: string
}

export interface Qwen25VlControlledPersistedJobLeaseBridgeInput {
  queueFixture?: JsonRecord
  forceIdempotencyConflict?: boolean
}

export interface Qwen25VlControlledPersistedBridgeRefs {
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  jobId: string
  jobType: string
  workerType: string
  workerInstanceId: string
  idempotencyKey: string
  leaseId: string
  leaseExpiresAt: string
  workerClaimId: string
  backendRuntimeMessageId: string
  jobEventId: string
  privateManifestRefs: string[]
  checksumRefs: string[]
  structuredFindingIds: string[]
  editIntentIds: string[]
  privateInvokeEnvelopeAcceptedForFutureTransport: boolean
  persistedReferenceOnly: true
  mockOnly: true
}

export interface Qwen25VlControlledPersistedJobLeaseBridgeResult {
  ok: false
  status: Qwen25VlControlledPersistedJobLeaseBridgeStatus
  decision: typeof DECISION
  selectedRuntime: typeof SELECTED_RUNTIME
  queueValidationIssues: Qwen25VlLocalQueueValidationIssue[]
  workerJobSchemaValidated: boolean
  localQueueValidated: boolean
  approvedSnapshotPresent: boolean
  creditReservationPresent: boolean
  sourceOfTruthRefsPresent: boolean
  idempotencyChecked: boolean
  idempotencyConflict: boolean
  bridgeRefs?: Qwen25VlControlledPersistedBridgeRefs
  runtimeSteps: Qwen25VlControlledPersistedJobLeaseBridgeStep[]
  runtimeFlags: Qwen25VlControlledPersistedJobLeaseBridgeRuntimeFlags
  message: string
  warnings: string[]
}

export type Qwen25VlControlledPersistedJobLeaseBridgeRuntimeFlags = {
  [Key in keyof typeof BASE_RUNTIME_FLAGS]: boolean
}

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_persisted_job_lease_bridge_implemented_fail_closed_result_review_required' as const

const SELECTED_RUNTIME = {
  platform: 'google_cloud_run_gpu',
  gpu: 'nvidia_l4',
  region: 'us-central1',
  service: 'reeditpro-qwen2-5-vl-l4-worker',
  costPosture: 'scale_to_zero_required',
  minInstances: 0,
  maxInstancesForInitialRuntime: 1,
  cpuFallbackAllowed: false,
} as const

const BASE_RUNTIME_FLAGS = {
  persistedJobLeaseBridgeImplementedFailClosed: true,
  approvedJobIntakeChecked: false,
  persistedIdempotencyGuardChecked: false,
  persistedJobReferenceCreated: false,
  persistedLeaseReferenceCreated: false,
  sanitizedJobEventReferenceCreated: false,
  backendRuntimeMessageReferenceCreated: false,
  workerClaimReferenceCreated: false,
  privateSourceOfTruthRefsChecked: false,
  privateInvokeEnvelopeChecked: false,
  privateInvokeTransportPreviewChecked: false,
  qaAuditCostCreditBoundaryChecked: false,
  bridgeResultReviewRequired: false,
  mockRecordsStoredInMemoryOnly: false,
  readyForRealWorkerDispatch: false,
  privateInvokeHandoffAllowedNow: false,
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
  supabaseTouched: false,
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
} as const

const INITIAL_STEPS: Qwen25VlControlledPersistedJobLeaseBridgeStep[] = [
  step('approved_job_intake', 'not_reached', 'Approved Qwen worker job intake has not been checked.'),
  step('persisted_idempotency_guard', 'not_reached', 'Persisted idempotency guard has not been checked.'),
  step('persisted_job_reference', 'not_reached', 'Persisted job reference has not been created.'),
  step('persisted_lease_reference', 'not_reached', 'Persisted lease reference has not been created.'),
  step('sanitized_job_event_reference', 'not_reached', 'Sanitized job event reference has not been created.'),
  step('backend_runtime_message_reference', 'not_reached', 'Backend runtime message reference has not been created.'),
  step('worker_claim_reference', 'not_reached', 'Worker claim reference has not been created.'),
  step('private_invoke_envelope', 'not_reached', 'Private invoke envelope has not been checked.'),
  step('private_invoke_transport_preview', 'not_reached', 'Private invoke transport preview has not been checked.'),
  step('qa_audit_cost_credit_boundary', 'not_reached', 'QA, audit, cost, and credit boundary has not been checked.'),
]

export function runQwen25VlControlledPersistedJobLeaseBridge(
  input: Qwen25VlControlledPersistedJobLeaseBridgeInput = {},
): Qwen25VlControlledPersistedJobLeaseBridgeResult {
  const queueFixture = input.queueFixture ??
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture
  const workerSchema = runWorkerJobSchema.safeParse(queueFixture)

  if (!workerSchema.success) {
    return buildResult({
      status: 'blocked_invalid_worker_job_schema',
      queueValidationIssues: [],
      workerJobSchemaValidated: false,
      localQueueValidated: false,
      approvedSnapshotPresent: false,
      creditReservationPresent: false,
      sourceOfTruthRefsPresent: false,
      idempotencyChecked: false,
      idempotencyConflict: false,
      runtimeFlags: BASE_RUNTIME_FLAGS,
      runtimeSteps: markSteps([
        step('approved_job_intake', 'blocked', 'runWorkerJobSchema rejected the Qwen bridge envelope.'),
      ]),
      message: 'Qwen persisted job/lease bridge refused the request before creating bridge refs because runWorkerJobSchema validation failed.',
      warnings: ['No bridge refs, private invoke envelope, Cloud Run request, or generated asset were created.'],
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
  const intakeFlags = {
    ...BASE_RUNTIME_FLAGS,
    approvedJobIntakeChecked: true,
    privateSourceOfTruthRefsChecked: true,
  } as const

  if (queueValidation.issues.includes('missing_approved_snapshot')) {
    return buildResult({
      status: 'blocked_missing_approved_snapshot',
      queueValidationIssues: queueValidation.issues,
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: false,
      idempotencyConflict: false,
      runtimeFlags: intakeFlags,
      runtimeSteps: markSteps([
        step('approved_job_intake', 'blocked', 'Approved plan snapshot reference is required before bridge refs.'),
      ]),
      message: 'Qwen persisted job/lease bridge blocked the request because approved plan snapshot refs are missing.',
      warnings: ['Workers execute approved snapshots, not raw chat or ad hoc payloads.'],
    })
  }

  if (queueValidation.issues.includes('missing_credit_reservation')) {
    return buildResult({
      status: 'blocked_missing_credit_reservation',
      queueValidationIssues: queueValidation.issues,
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: false,
      idempotencyConflict: false,
      runtimeFlags: intakeFlags,
      runtimeSteps: markSteps([
        step('approved_job_intake', 'blocked', 'Credit reservation reference is required before bridge refs.'),
      ]),
      message: 'Qwen persisted job/lease bridge blocked the request because credit reservation refs are missing.',
      warnings: ['No credit spend, release, refund, or reservation mutation was attempted.'],
    })
  }

  if (
    queueValidation.issues.includes('missing_source_of_truth_refs') ||
    queueValidation.issues.includes('signed_url_source_of_truth')
  ) {
    return buildResult({
      status: 'blocked_missing_source_of_truth_refs',
      queueValidationIssues: queueValidation.issues,
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: false,
      idempotencyConflict: false,
      runtimeFlags: intakeFlags,
      runtimeSteps: markSteps([
        step('approved_job_intake', 'passed', 'Approved job envelope passed schema validation.'),
        step('persisted_idempotency_guard', 'blocked', 'Private source-of-truth refs must be complete before idempotency and lease refs.'),
      ]),
      message: 'Qwen persisted job/lease bridge blocked the request because private source-of-truth refs are missing or unsafe.',
      warnings: [
        'Source of truth requires Supabase row refs, private manifests, checksums, and approved snapshot refs.',
        `Signed/public URL source flags are ${String(sourceRefs.signedUrlsAreSourceOfTruth)} and ${String(sourceRefs.publicUrlsAreSourceOfTruth)}.`,
      ],
    })
  }

  if (!queueValidation.ok) {
    return buildResult({
      status: 'blocked_invalid_worker_job_schema',
      queueValidationIssues: queueValidation.issues,
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: false,
      idempotencyConflict: false,
      runtimeFlags: intakeFlags,
      runtimeSteps: markSteps([
        step('approved_job_intake', 'blocked', 'Qwen local queue contract rejected the bridge request.'),
      ]),
      message: 'Qwen persisted job/lease bridge blocked the request because local queue validation failed.',
      warnings: ['Only approved Qwen queue contract fixtures can create bridge refs.'],
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
  const idempotencyFlags = {
    ...intakeFlags,
    persistedIdempotencyGuardChecked: true,
  } as const

  if (!idempotencyCheck.ok || idempotencyCheck.conflict) {
    return buildResult({
      status: 'blocked_idempotency_conflict',
      queueValidationIssues: queueValidation.issues,
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: true,
      idempotencyConflict: true,
      runtimeFlags: idempotencyFlags,
      runtimeSteps: markSteps([
        step('approved_job_intake', 'passed', 'Approved Qwen worker job intake passed.'),
        step('persisted_idempotency_guard', 'blocked', idempotencyCheck.message),
      ]),
      message: 'Qwen persisted job/lease bridge blocked the request because idempotency detected a duplicate source mismatch.',
      warnings: ['Duplicate source mismatch must stop before lease, worker claim, and private invoke handoff refs.'],
    })
  }

  const envelopeResult = buildQwen25VlPrivateInvokeEnvelope({ queueFixture })
  if (!envelopeResult.envelopeAcceptedForFutureTransport) {
    return buildResult({
      status: 'blocked_private_invoke_envelope',
      queueValidationIssues: queueValidation.issues,
      workerJobSchemaValidated: true,
      localQueueValidated: true,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyChecked: true,
      idempotencyConflict: false,
      runtimeFlags: idempotencyFlags,
      runtimeSteps: markSteps([
        step('approved_job_intake', 'passed', 'Approved Qwen worker job intake passed.'),
        step('persisted_idempotency_guard', 'passed', idempotencyCheck.message),
        step('private_invoke_envelope', 'blocked', envelopeResult.message),
      ]),
      message: 'Qwen persisted job/lease bridge blocked before transport preview because the private invoke envelope was not accepted.',
      warnings: envelopeResult.warnings,
    })
  }

  const bridgeRefs = createBridgeRefs(queueFixture, payload, sourceRefs, envelopeResult.envelopeAcceptedForFutureTransport)
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
    queueValidationIssues: queueValidation.issues,
    workerJobSchemaValidated: true,
    localQueueValidated: true,
    approvedSnapshotPresent,
    creditReservationPresent,
    sourceOfTruthRefsPresent,
    idempotencyChecked: true,
    idempotencyConflict: false,
    bridgeRefs,
    runtimeFlags: {
      ...idempotencyFlags,
      persistedJobReferenceCreated: true,
      persistedLeaseReferenceCreated: true,
      sanitizedJobEventReferenceCreated: true,
      backendRuntimeMessageReferenceCreated: true,
      workerClaimReferenceCreated: true,
      privateInvokeEnvelopeChecked: true,
      privateInvokeTransportPreviewChecked: true,
      qaAuditCostCreditBoundaryChecked: true,
      bridgeResultReviewRequired: true,
      mockRecordsStoredInMemoryOnly: true,
    },
    runtimeSteps: markSteps([
      step('approved_job_intake', 'passed', 'Approved Qwen worker job intake passed.'),
      step('persisted_idempotency_guard', 'passed', idempotencyCheck.message),
      step('persisted_job_reference', 'passed', 'Controlled persisted job ref is represented for the approved fixture.'),
      step('persisted_lease_reference', 'passed', 'Controlled lease ref is represented without exposing a secret token.'),
      step('sanitized_job_event_reference', 'passed', 'Sanitized job event ref is represented without raw model output.'),
      step('backend_runtime_message_reference', 'passed', 'Backend runtime message ref is represented for private invoke handoff.'),
      step('worker_claim_reference', 'passed', 'Worker claim ref is represented for the approved job and lease.'),
      step('private_invoke_envelope', 'passed', envelopeResult.message),
      step('private_invoke_transport_preview', 'blocked', transportPreview.message),
      step('qa_audit_cost_credit_boundary', 'blocked', 'QA, audit, cost, and credit rows remain future review work; no spend or asset side effect occurred.'),
    ]),
    message: 'Qwen persisted job/lease bridge created controlled bridge refs and stopped at private invoke transport preview.',
    warnings: [
      ...transportPreview.warnings,
      'Bridge refs are deterministic local runtime metadata only; no Supabase row was mutated.',
      'No Cloud Run request, model import, model load, forward pass, inference, generated asset, signed URL, public artifact, or credit mutation occurred.',
    ],
  })
}

function createBridgeRefs(
  queueFixture: JsonRecord,
  payload: JsonRecord,
  sourceRefs: JsonRecord,
  envelopeAcceptedForFutureTransport: boolean,
): Qwen25VlControlledPersistedBridgeRefs {
  const queueLease = asRecord(payload.queueLease)
  const task = asRecord(payload.task)

  return {
    workspaceId: String(queueFixture.workspaceId),
    projectId: String(queueFixture.projectId),
    approvedPlanSnapshotId: String(queueFixture.approvedPlanSnapshotId),
    creditReservationId: String(queueFixture.creditReservationId),
    jobId: String(payload.jobId),
    jobType: String(queueFixture.jobType),
    workerType: String(queueFixture.workerType),
    workerInstanceId: String(queueFixture.workerInstanceId),
    idempotencyKey: String(queueFixture.idempotencyKey),
    leaseId: String(queueLease.leaseId),
    leaseExpiresAt: String(queueLease.expiresAt),
    workerClaimId: `worker_claim_ref_${String(payload.jobId)}`,
    backendRuntimeMessageId: `backend_runtime_message_ref_${String(payload.jobId)}`,
    jobEventId: `job_event_ref_${String(payload.jobId)}`,
    privateManifestRefs: toStringArray(sourceRefs.privateManifestRefs),
    checksumRefs: toStringArray(sourceRefs.checksumRefs),
    structuredFindingIds: toStringArray(task.structuredFindingIds),
    editIntentIds: toStringArray(task.editIntentIds),
    privateInvokeEnvelopeAcceptedForFutureTransport: envelopeAcceptedForFutureTransport,
    persistedReferenceOnly: true,
    mockOnly: true,
  }
}

function buildResult(input: {
  status: Qwen25VlControlledPersistedJobLeaseBridgeStatus
  queueValidationIssues: Qwen25VlLocalQueueValidationIssue[]
  workerJobSchemaValidated: boolean
  localQueueValidated: boolean
  approvedSnapshotPresent: boolean
  creditReservationPresent: boolean
  sourceOfTruthRefsPresent: boolean
  idempotencyChecked: boolean
  idempotencyConflict: boolean
  bridgeRefs?: Qwen25VlControlledPersistedBridgeRefs
  runtimeFlags: Qwen25VlControlledPersistedJobLeaseBridgeRuntimeFlags
  runtimeSteps: Qwen25VlControlledPersistedJobLeaseBridgeStep[]
  message: string
  warnings: string[]
}): Qwen25VlControlledPersistedJobLeaseBridgeResult {
  return {
    ok: false,
    status: input.status,
    decision: DECISION,
    selectedRuntime: SELECTED_RUNTIME,
    queueValidationIssues: input.queueValidationIssues,
    workerJobSchemaValidated: input.workerJobSchemaValidated,
    localQueueValidated: input.localQueueValidated,
    approvedSnapshotPresent: input.approvedSnapshotPresent,
    creditReservationPresent: input.creditReservationPresent,
    sourceOfTruthRefsPresent: input.sourceOfTruthRefsPresent,
    idempotencyChecked: input.idempotencyChecked,
    idempotencyConflict: input.idempotencyConflict,
    bridgeRefs: input.bridgeRefs,
    runtimeSteps: input.runtimeSteps,
    runtimeFlags: input.runtimeFlags,
    message: input.message,
    warnings: input.warnings,
  }
}

function step(
  id: Qwen25VlControlledPersistedJobLeaseBridgeStep['id'],
  status: Qwen25VlControlledPersistedJobLeaseBridgeStepStatus,
  summary: string,
): Qwen25VlControlledPersistedJobLeaseBridgeStep {
  return { id, status, summary }
}

function markSteps(
  overrides: Qwen25VlControlledPersistedJobLeaseBridgeStep[],
): Qwen25VlControlledPersistedJobLeaseBridgeStep[] {
  return INITIAL_STEPS.map((initialStep) => {
    return overrides.find((override) => override.id === initialStep.id) ?? initialStep
  })
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : []
}

function createNeverCalledTransportDependencies() {
  const fail = async (): Promise<string> => {
    throw new Error('Qwen persisted job/lease bridge preview dependencies must not be called.')
  }

  return {
    resolveServiceUrl: fail,
    resolveAudience: fail,
    fetchIdentityToken: fail,
    sendRequest: async () => {
      throw new Error('Qwen persisted job/lease bridge preview sendRequest must not be called.')
    },
  }
}

export const QWEN2_5_VL_CONTROLLED_PERSISTED_JOB_LEASE_BRIDGE_CONTRACT = {
  bridgeId: 'qwen2_5_vl_controlled_persisted_job_lease_bridge',
  decision: DECISION,
  selectedRuntime: SELECTED_RUNTIME,
  implementedFailClosed: true,
  acceptsApprovedSnapshotQueueFixture: true,
  createsPersistedReferenceEnvelope: true,
  storesRecordsInMemoryOnlyNow: true,
  createsRealJob: false,
  claimsRealLease: false,
  mutatesSupabase: false,
  executesSql: false,
  invokesCloudRun: false,
  resolvesServiceUrl: false,
  fetchesIdentityToken: false,
  runsInference: false,
  createsGeneratedAsset: false,
  createsPublicArtifact: false,
  createsSignedUrl: false,
  mutatesCredits: false,
  unlocksBeta: false,
  unlocksProduction: false,
  createdAt: nowIso(),
  requiredOutcomes: [
    'blocked_invalid_worker_job_schema',
    'blocked_missing_approved_snapshot',
    'blocked_missing_credit_reservation',
    'blocked_missing_source_of_truth_refs',
    'blocked_idempotency_conflict',
    'blocked_private_invoke_transport_preview_only',
  ],
} as const
