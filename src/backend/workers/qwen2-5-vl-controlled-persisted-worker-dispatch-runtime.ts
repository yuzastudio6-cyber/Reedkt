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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeStatus =
  | 'blocked_invalid_worker_job_schema'
  | 'blocked_missing_approved_snapshot'
  | 'blocked_missing_credit_reservation'
  | 'blocked_missing_source_of_truth_refs'
  | 'blocked_idempotency_conflict'
  | 'blocked_real_lease_backend_required'
  | 'blocked_qwen_dispatch_adapter_fail_closed'
  | 'blocked_private_invoke_transport_preview_only'

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeStepStatus =
  | 'passed'
  | 'blocked'
  | 'preview_only'
  | 'not_reached'

export interface Qwen25VlControlledPersistedWorkerDispatchRuntimeStep {
  id:
    | 'worker_job_schema_validation'
    | 'local_queue_contract_validation'
    | 'approved_snapshot_credit_source_refs'
    | 'idempotency_check'
    | 'backend_lease_boundary'
    | 'qwen_dispatch_adapter'
    | 'private_invoke_envelope'
    | 'private_invoke_transport_preview'
    | 'qa_audit_cost_credit_boundary'
    | 'cleanup_boundary'
  status: Qwen25VlControlledPersistedWorkerDispatchRuntimeStepStatus
  summary: string
}

export interface Qwen25VlControlledPersistedWorkerDispatchRuntimeInput {
  queueFixture?: JsonRecord
  forceIdempotencyConflict?: boolean
  continueAfterLeaseBoundaryForPreview?: boolean
  continueAfterAdapterBoundaryForPreview?: boolean
}

export interface Qwen25VlControlledPersistedWorkerDispatchRuntimeResult {
  ok: false
  status: Qwen25VlControlledPersistedWorkerDispatchRuntimeStatus
  decision: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_implemented_fail_closed_private_invoke_execution_required'
  selectedRuntime: typeof SELECTED_RUNTIME
  workerJobSchemaValidated: boolean
  localQueueValidated: boolean
  queueValidationIssues: Qwen25VlLocalQueueValidationIssue[]
  approvedSnapshotPresent: boolean
  creditReservationPresent: boolean
  sourceOfTruthRefsPresent: boolean
  idempotencyChecked: boolean
  idempotencyConflict: boolean
  backendLeaseBoundaryChecked: boolean
  qwenDispatchAdapterChecked: boolean
  privateInvokeEnvelopeChecked: boolean
  privateInvokeTransportPreviewChecked: boolean
  runtimeSteps: Qwen25VlControlledPersistedWorkerDispatchRuntimeStep[]
  sourceOfTruthExpectation: {
    approvedPlanSnapshotRequired: true
    creditReservationRequired: true
    privateStoragePathRequired: true
    manifestRequired: true
    checksumRequired: true
    signedUrlsAreSourceOfTruth: false
    publicUrlsAreSourceOfTruth: false
  }
  runtimeFlags: Qwen25VlControlledPersistedWorkerDispatchRuntimeFlags
  message: string
  warnings: string[]
}

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeFlags = {
  [Key in keyof typeof BASE_RUNTIME_FLAGS]: boolean
}

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_implemented_fail_closed_private_invoke_execution_required' as const

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

const SOURCE_OF_TRUTH_EXPECTATION = {
  approvedPlanSnapshotRequired: true,
  creditReservationRequired: true,
  privateStoragePathRequired: true,
  manifestRequired: true,
  checksumRequired: true,
  signedUrlsAreSourceOfTruth: false,
  publicUrlsAreSourceOfTruth: false,
} as const

const BASE_RUNTIME_FLAGS = {
  controlledPersistedWorkerDispatchRuntimeImplemented: true,
  controlledPersistedWorkerDispatchRuntimeInvokedLocally: true,
  workerJobSchemaValidated: false,
  localQueueValidated: false,
  approvedSnapshotChecked: false,
  creditReservationChecked: false,
  sourceOfTruthRefsChecked: false,
  idempotencyChecked: false,
  backendLeaseBoundaryChecked: false,
  qwenDispatchAdapterChecked: false,
  privateInvokeEnvelopeChecked: false,
  privateInvokeTransportPreviewChecked: false,
  qaAuditCostCreditBoundaryChecked: false,
  cleanupBoundaryChecked: false,
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

const INITIAL_STEPS: Qwen25VlControlledPersistedWorkerDispatchRuntimeStep[] = [
  step('worker_job_schema_validation', 'not_reached', 'Worker job schema has not been checked.'),
  step('local_queue_contract_validation', 'not_reached', 'Local queue contract has not been checked.'),
  step('approved_snapshot_credit_source_refs', 'not_reached', 'Approved snapshot, credit, and source refs have not been checked.'),
  step('idempotency_check', 'not_reached', 'Idempotency has not been checked.'),
  step('backend_lease_boundary', 'not_reached', 'Backend lease boundary has not been checked.'),
  step('qwen_dispatch_adapter', 'not_reached', 'Qwen dispatch adapter has not been checked.'),
  step('private_invoke_envelope', 'not_reached', 'Private invoke envelope has not been checked.'),
  step('private_invoke_transport_preview', 'not_reached', 'Private invoke transport preview has not been checked.'),
  step('qa_audit_cost_credit_boundary', 'not_reached', 'QA, audit, cost, and credit boundary has not been checked.'),
  step('cleanup_boundary', 'not_reached', 'Cleanup boundary has not been checked.'),
]

export function runQwen25VlControlledPersistedWorkerDispatchRuntime(
  input: Qwen25VlControlledPersistedWorkerDispatchRuntimeInput = {},
): Qwen25VlControlledPersistedWorkerDispatchRuntimeResult {
  const queueFixture = input.queueFixture ??
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture
  const workerSchema = runWorkerJobSchema.safeParse(queueFixture)

  if (!workerSchema.success) {
    return buildResult({
      status: 'blocked_invalid_worker_job_schema',
      queueValidationIssues: [],
      approvedSnapshotPresent: false,
      creditReservationPresent: false,
      sourceOfTruthRefsPresent: false,
      idempotencyConflict: false,
      runtimeFlags: BASE_RUNTIME_FLAGS,
      runtimeSteps: markSteps([
        step('worker_job_schema_validation', 'blocked', 'runWorkerJobSchema validation failed before any runtime boundary.'),
      ]),
      message: 'Controlled persisted Qwen worker dispatch runtime refused the request before runtime checks because runWorkerJobSchema validation failed.',
      warnings: [
        'Invalid worker job envelopes cannot reach approved snapshot, lease, adapter, transport, QA, or cleanup checks.',
        'No job row, worker lease, Cloud Run request, Supabase mutation, or generated asset was created.',
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

  const intakeSteps = [
    step('worker_job_schema_validation', 'passed', 'runWorkerJobSchema accepted the persisted worker job envelope.'),
    step('local_queue_contract_validation', queueValidation.ok ? 'passed' : 'blocked', 'Local Qwen queue contract was validated before any runtime boundary.'),
  ]

  if (queueValidation.issues.includes('missing_approved_snapshot')) {
    return buildResult({
      status: 'blocked_missing_approved_snapshot',
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyConflict: false,
      runtimeFlags: checkedFlags,
      runtimeSteps: markSteps([
        ...intakeSteps,
        step('approved_snapshot_credit_source_refs', 'blocked', 'Approved plan snapshot reference is required before worker runtime.'),
      ]),
      message: 'Controlled persisted Qwen worker dispatch runtime blocked the request because an approved plan snapshot reference is required.',
      warnings: ['Workers execute approved snapshots, not raw chat or ad hoc model prompts.'],
    })
  }

  if (queueValidation.issues.includes('missing_credit_reservation')) {
    return buildResult({
      status: 'blocked_missing_credit_reservation',
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyConflict: false,
      runtimeFlags: checkedFlags,
      runtimeSteps: markSteps([
        ...intakeSteps,
        step('approved_snapshot_credit_source_refs', 'blocked', 'Credit reservation reference is required before worker runtime.'),
      ]),
      message: 'Controlled persisted Qwen worker dispatch runtime blocked the request because a credit reservation reference is required.',
      warnings: ['Future Qwen worker runtime must verify approved credit reservation before dispatch.'],
    })
  }

  if (
    queueValidation.issues.includes('missing_source_of_truth_refs') ||
    queueValidation.issues.includes('signed_url_source_of_truth')
  ) {
    return buildResult({
      status: 'blocked_missing_source_of_truth_refs',
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyConflict: false,
      runtimeFlags: checkedFlags,
      runtimeSteps: markSteps([
        ...intakeSteps,
        step('approved_snapshot_credit_source_refs', 'blocked', 'Private source-of-truth refs must include rows, manifests, checksums, and approved snapshot refs.'),
      ]),
      message: 'Controlled persisted Qwen worker dispatch runtime blocked the request because private source-of-truth refs are incomplete or unsafe.',
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
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyConflict: false,
      runtimeFlags: checkedFlags,
      runtimeSteps: markSteps([
        ...intakeSteps,
        step('approved_snapshot_credit_source_refs', 'blocked', 'Queue validation failed before idempotency and lease checks.'),
      ]),
      message: 'Controlled persisted Qwen worker dispatch runtime blocked the request because the local queue contract is invalid.',
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
  const readySteps = [
    ...intakeSteps,
    step('approved_snapshot_credit_source_refs', 'passed', 'Approved snapshot, credit reservation, and private source-of-truth refs are present.'),
  ]

  if (!idempotencyCheck.ok || idempotencyCheck.conflict) {
    return buildResult({
      status: 'blocked_idempotency_conflict',
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyConflict: true,
      runtimeFlags: {
        ...checkedFlags,
        idempotencyChecked: true,
      },
      runtimeSteps: markSteps([
        ...readySteps,
        step('idempotency_check', 'blocked', idempotencyCheck.message),
      ]),
      message: 'Controlled persisted Qwen worker dispatch runtime blocked the request because mock idempotency conflict detection found a different source for the same key.',
      warnings: ['Real idempotency enforcement must be persisted by backend runtime before dispatch.'],
    })
  }

  const realLeasePrecondition = claimWorkerLease()
  const idempotencySteps = [
    ...readySteps,
    step('idempotency_check', 'passed', idempotencyCheck.message),
  ]

  if (!input.continueAfterLeaseBoundaryForPreview) {
    return buildResult({
      status: 'blocked_real_lease_backend_required',
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyConflict: false,
      runtimeFlags: {
        ...checkedFlags,
        idempotencyChecked: true,
        backendLeaseBoundaryChecked: true,
      },
      runtimeSteps: markSteps([
        ...idempotencySteps,
        step('backend_lease_boundary', 'blocked', realLeasePrecondition.message),
      ]),
      message: realLeasePrecondition.message,
      warnings: [
        'Runtime implementation stops at the real lease boundary by default.',
        ...realLeasePrecondition.warnings,
      ],
    })
  }

  const adapterResult = runQwen25VlCloudRunGpuFailClosedDispatchAdapter({ queueFixture })
  const leasePreviewSteps = [
    ...idempotencySteps,
    step('backend_lease_boundary', 'preview_only', realLeasePrecondition.message),
  ]

  if (!input.continueAfterAdapterBoundaryForPreview) {
    return buildResult({
      status: 'blocked_qwen_dispatch_adapter_fail_closed',
      queueValidationIssues: queueValidation.issues,
      approvedSnapshotPresent,
      creditReservationPresent,
      sourceOfTruthRefsPresent,
      idempotencyConflict: false,
      runtimeFlags: {
        ...checkedFlags,
        idempotencyChecked: true,
        backendLeaseBoundaryChecked: true,
        qwenDispatchAdapterChecked: true,
      },
      runtimeSteps: markSteps([
        ...leasePreviewSteps,
        step('qwen_dispatch_adapter', 'blocked', adapterResult.message),
      ]),
      message: adapterResult.message,
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
    queueValidationIssues: queueValidation.issues,
    approvedSnapshotPresent,
    creditReservationPresent,
    sourceOfTruthRefsPresent,
    idempotencyConflict: false,
    runtimeFlags: {
      ...checkedFlags,
      idempotencyChecked: true,
      backendLeaseBoundaryChecked: true,
      qwenDispatchAdapterChecked: true,
      privateInvokeEnvelopeChecked: envelopeResult.envelopeAcceptedForFutureTransport,
      privateInvokeTransportPreviewChecked: true,
      qaAuditCostCreditBoundaryChecked: true,
      cleanupBoundaryChecked: true,
    },
    runtimeSteps: markSteps([
      ...leasePreviewSteps,
      step('qwen_dispatch_adapter', 'preview_only', adapterResult.message),
      step('private_invoke_envelope', 'passed', envelopeResult.message),
      step('private_invoke_transport_preview', 'blocked', transportPreview.message),
      step('qa_audit_cost_credit_boundary', 'blocked', 'QA, audit, cost, and credit evidence are metadata-only and cannot approve dispatch.'),
      step('cleanup_boundary', 'blocked', 'Cleanup lifecycle remains future backend runtime work; no worker state was created now.'),
    ]),
    message: transportPreview.message,
    warnings: [
      ...transportPreview.warnings,
      'Private invoke transport preview does not resolve URLs, fetch identity tokens, or call injected dependencies.',
      'No QA report, audit event, credit mutation, generated asset, public artifact, or signed URL was created.',
    ],
  })
}

function buildResult(input: {
  status: Qwen25VlControlledPersistedWorkerDispatchRuntimeStatus
  queueValidationIssues: Qwen25VlLocalQueueValidationIssue[]
  approvedSnapshotPresent: boolean
  creditReservationPresent: boolean
  sourceOfTruthRefsPresent: boolean
  idempotencyConflict: boolean
  runtimeFlags: Qwen25VlControlledPersistedWorkerDispatchRuntimeFlags
  runtimeSteps: Qwen25VlControlledPersistedWorkerDispatchRuntimeStep[]
  message: string
  warnings: string[]
}): Qwen25VlControlledPersistedWorkerDispatchRuntimeResult {
  return {
    ok: false,
    status: input.status,
    decision: DECISION,
    selectedRuntime: SELECTED_RUNTIME,
    workerJobSchemaValidated: input.runtimeFlags.workerJobSchemaValidated,
    localQueueValidated: input.runtimeFlags.localQueueValidated,
    queueValidationIssues: input.queueValidationIssues,
    approvedSnapshotPresent: input.approvedSnapshotPresent,
    creditReservationPresent: input.creditReservationPresent,
    sourceOfTruthRefsPresent: input.sourceOfTruthRefsPresent,
    idempotencyChecked: input.runtimeFlags.idempotencyChecked,
    idempotencyConflict: input.idempotencyConflict,
    backendLeaseBoundaryChecked: input.runtimeFlags.backendLeaseBoundaryChecked,
    qwenDispatchAdapterChecked: input.runtimeFlags.qwenDispatchAdapterChecked,
    privateInvokeEnvelopeChecked: input.runtimeFlags.privateInvokeEnvelopeChecked,
    privateInvokeTransportPreviewChecked: input.runtimeFlags.privateInvokeTransportPreviewChecked,
    runtimeSteps: input.runtimeSteps,
    sourceOfTruthExpectation: SOURCE_OF_TRUTH_EXPECTATION,
    runtimeFlags: input.runtimeFlags,
    message: input.message,
    warnings: input.warnings,
  }
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

function step(
  id: Qwen25VlControlledPersistedWorkerDispatchRuntimeStep['id'],
  status: Qwen25VlControlledPersistedWorkerDispatchRuntimeStepStatus,
  summary: string,
): Qwen25VlControlledPersistedWorkerDispatchRuntimeStep {
  return { id, status, summary }
}

function markSteps(
  overrides: Qwen25VlControlledPersistedWorkerDispatchRuntimeStep[],
): Qwen25VlControlledPersistedWorkerDispatchRuntimeStep[] {
  return INITIAL_STEPS.map((initialStep) => {
    return overrides.find((override) => override.id === initialStep.id) ?? initialStep
  })
}

function createNeverCalledTransportDependencies() {
  const fail = async (): Promise<string> => {
    throw new Error('Qwen controlled persisted runtime preview dependencies must not be called.')
  }

  return {
    resolveServiceUrl: fail,
    resolveAudience: fail,
    fetchIdentityToken: fail,
    sendRequest: async () => {
      throw new Error('Qwen controlled persisted runtime preview sendRequest must not be called.')
    },
  }
}

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_CONTRACT = {
  runtimeId: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime',
  decision: DECISION,
  selectedRuntime: SELECTED_RUNTIME,
  implementsRuntimeBoundary: true,
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
