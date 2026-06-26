import {
  INTERNAL_BETA_CREDIT_LEDGER_RUNTIME_SCAFFOLDS,
  createDisabledInternalBetaCreditLedgerRuntimeScaffoldResult,
  type InternalBetaCreditLedgerRuntimeInput,
  type InternalBetaCreditLedgerRuntimeScaffoldResult,
} from './internal-beta-credit-ledger-runtime-scaffold'
import {
  createInternalBetaApiRouteRuntimeFacadeReport,
  type InternalBetaApiRouteRuntimeFacadeInput,
  type InternalBetaApiRouteRuntimeFacadeResponse,
} from './internal-beta-api-route-runtime-facade'
import {
  evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard,
  type InternalBetaApprovedSnapshotServiceRolePersistenceGuardResult,
} from './internal-beta-approved-snapshot-service-role-persistence-guard'
import {
  INTERNAL_BETA_PROVIDER_ADAPTER_SCAFFOLDS,
  createDisabledInternalBetaProviderAdapterScaffoldResult,
  type InternalBetaProviderAdapterInput,
  type InternalBetaProviderAdapterScaffoldResult,
} from './internal-beta-disabled-provider-adapter-scaffold'
import {
  INTERNAL_BETA_JOB_QUEUE_RUNTIME_SCAFFOLDS,
  createDisabledInternalBetaJobQueueRuntimeScaffoldResult,
  type InternalBetaJobQueueRuntimeInput,
  type InternalBetaJobQueueRuntimeScaffoldResult,
} from './internal-beta-job-queue-runtime-scaffold'
import {
  createInternalBetaLocalE2EChainSmoke,
  type InternalBetaLocalE2EChainSmokeResult,
} from './internal-beta-local-e2e-chain-smoke'
import {
  INTERNAL_BETA_PRIVATE_ARTIFACT_MANIFEST_SCAFFOLDS,
  createDisabledInternalBetaPrivateArtifactManifestScaffoldResult,
  type InternalBetaPrivateArtifactManifestInput,
  type InternalBetaPrivateArtifactManifestScaffoldResult,
} from './internal-beta-private-artifact-manifest-scaffold'
import {
  INTERNAL_BETA_REMOTION_RENDER_WORKER_SCAFFOLDS,
  createDisabledInternalBetaRemotionRenderWorkerScaffoldResult,
  type InternalBetaRemotionRenderWorkerInput,
  type InternalBetaRemotionRenderWorkerScaffoldResult,
} from './internal-beta-remotion-render-worker-scaffold'
import {
  INTERNAL_BETA_SERVICE_ROLE_RUNTIME_SCAFFOLDS,
  createDisabledInternalBetaRuntimeScaffoldResult,
  type InternalBetaRuntimeScaffoldInput,
  type InternalBetaRuntimeScaffoldResult,
} from './internal-beta-service-role-runtime-scaffold'
import {
  assertInternalBetaSupabaseCredentialContextFailClosed,
  createInternalBetaSupabaseCredentialContextContract,
  type InternalBetaSupabaseCredentialContextContract,
} from '../config/internal-beta-supabase-credential-context-contract'
import type { ApprovedPlanSnapshotPayload } from '../../src/backend/cloud/approved-plan-snapshot-contracts'
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaRuntimeReadinessOrchestratorStatus =
  'blocked_pending_supabase_target_validation_and_runtime_enablement'

export type InternalBetaRuntimeReadinessComponent =
  | 'api_route_runtime_facade'
  | 'service_role_runtime'
  | 'credit_ledger_runtime'
  | 'job_queue_runtime'
  | 'private_artifact_manifest'
  | 'remotion_render_worker'
  | 'provider_adapter'

export interface InternalBetaRuntimeReadinessOrchestratorInput
  extends InternalBetaApiRouteRuntimeFacadeInput,
    InternalBetaRuntimeScaffoldInput,
    InternalBetaCreditLedgerRuntimeInput,
    InternalBetaJobQueueRuntimeInput,
    InternalBetaPrivateArtifactManifestInput,
    InternalBetaRemotionRenderWorkerInput,
    InternalBetaProviderAdapterInput {
  editPlanId?: string
  creditEstimateId?: string
  creditApprovalId?: string
  jobBatchId?: string
  workerType?: string
  workerInstanceId?: string
  leaseId?: string
  artifactId?: string
  checksumSha256?: string
  storageBucket?: string
  storagePath?: string
  retentionPolicyId?: string
  cleanupPolicyId?: string
  rendererPlanId?: string
  providerRouteId?: string
  promptPlanId?: string
  modelPolicyId?: string
  costCapId?: string
  fallbackPolicyId?: string
  reason?: string
  chatSessionId?: string
  editPlanVersionId?: string
  approvedByUserId?: string
  approvedAt?: string
  confirmedSupabaseTargetValidation?: boolean
  serviceRolePersistenceRuntimeApproved?: boolean
  remotePersistenceConfirmation?: boolean
  supabaseCredentialContext?: InternalBetaSupabaseCredentialContextContract
}

type InternalBetaRuntimeReadinessScaffoldResult =
  | InternalBetaApiRouteRuntimeFacadeResponse
  | InternalBetaRuntimeScaffoldResult
  | InternalBetaCreditLedgerRuntimeScaffoldResult
  | InternalBetaJobQueueRuntimeScaffoldResult
  | InternalBetaPrivateArtifactManifestScaffoldResult
  | InternalBetaRemotionRenderWorkerScaffoldResult
  | InternalBetaProviderAdapterScaffoldResult

export interface InternalBetaRuntimeReadinessComponentSummary {
  component: InternalBetaRuntimeReadinessComponent
  id: string
  ok: false
  status: string
  requiredBeforeEnablement: string[]
}

export interface InternalBetaRuntimeReadinessSafetySummary {
  remoteSupabaseMutation: false
  sqlExecution: false
  migrationApply: false
  serviceRoleRouteExecution: false
  routeExecution: false
  workerExecution: false
  workerDispatch: false
  providerModelCall: false
  modelCall: false
  secretPayloadAccess: false
  rawPromptExecution: false
  remotionExecution: false
  ffmpegExecution: false
  ffprobeExecution: false
  mediaProcessing: false
  renderExportExecution: false
  previewArtifactCreation: false
  finalExportCreation: false
  storageWrite: false
  storageRead: false
  signedUrlCreation: false
  publicArtifactCreation: false
  creditMutation: false
  stripePaymentProcessing: false
  internalBetaUnlock: false
  externalBetaUnlock: false
  productionUnlock: false
}

export interface InternalBetaRuntimeReadinessComponentCounts {
  apiRouteRuntimeFacade: number
  serviceRoleRuntime: number
  creditLedgerRuntime: number
  jobQueueRuntime: number
  privateArtifactManifest: number
  remotionRenderWorker: number
  providerAdapter: number
  total: number
}

export interface InternalBetaRuntimeReadinessLocalEvidenceCounts {
  approvedSnapshotServiceRolePersistenceGuard: 1
  localE2EChainSmoke: 1
  total: 2
}

export interface InternalBetaRuntimeReadinessServiceRolePersistenceGuardSummary {
  ok: boolean
  status: InternalBetaApprovedSnapshotServiceRolePersistenceGuardResult['status']
  localSnapshotRuntimeStatus: InternalBetaApprovedSnapshotServiceRolePersistenceGuardResult['localSnapshotRuntime']['status']
  localSnapshotRuntimeOk: boolean
  persistedToSupabase: false
  routeExecution: false
  serviceRoleRouteExecution: false
  remoteSupabaseMutation: false
  sqlExecution: false
  migrationApply: false
  creditMutation: false
  jobEnqueue: false
  workerExecution: false
  workerDispatch: false
  signedUrlCreation: false
  publicArtifactCreation: false
  internalBetaUnlock: false
  requiredBeforePersistence: string[]
}

export interface InternalBetaRuntimeReadinessLocalE2EChainSummary {
  ok: true
  status: 'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime'
  localOnly: true
  persistedToSupabase: false
  internalBetaEndToEndReady: false
  stepSummary: InternalBetaLocalE2EChainSmokeResult['steps']
  requiredBeforeInternalBeta: string[]
}

export interface InternalBetaRuntimeReadinessOrchestratorReport {
  ok: false
  status: InternalBetaRuntimeReadinessOrchestratorStatus
  createdAt: string
  internalBetaEndToEndReady: false
  productReadyEndToEndLocalOssTools: 0
  componentCounts: InternalBetaRuntimeReadinessComponentCounts
  localEvidenceCounts: InternalBetaRuntimeReadinessLocalEvidenceCounts
  componentStatuses: Record<InternalBetaRuntimeReadinessComponent, string[]>
  componentSummaries: InternalBetaRuntimeReadinessComponentSummary[]
  serviceRolePersistenceGuard: InternalBetaRuntimeReadinessServiceRolePersistenceGuardSummary
  localE2EChainSmoke: InternalBetaRuntimeReadinessLocalE2EChainSummary
  supabaseCredentialContext: InternalBetaSupabaseCredentialContextContract
  safety: InternalBetaRuntimeReadinessSafetySummary
  unsafeExecutionDetected: false
  requiredBeforeEnablement: string[]
  nextMilestone: 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R'
  inputSummary: Record<string, unknown>
  warnings: string[]
}

export const INTERNAL_BETA_RUNTIME_READINESS_ORCHESTRATOR_COMPONENTS: InternalBetaRuntimeReadinessComponent[] = [
  'api_route_runtime_facade',
  'service_role_runtime',
  'credit_ledger_runtime',
  'job_queue_runtime',
  'private_artifact_manifest',
  'remotion_render_worker',
  'provider_adapter',
]

export const INTERNAL_BETA_RUNTIME_READINESS_ORCHESTRATOR_REQUIRED_BEFORE_ENABLEMENT = [
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'guarded_worker_runtime_rpc_staging_sql_execution',
  'api_route_runtime_facade_validation',
  'approved_snapshot_service_role_persistence_guard',
  'service_role_runtime_enablement',
  'approved_snapshot_persistence_runtime',
  'credit_ledger_transaction_runtime',
  'job_queue_lease_event_runtime',
  'private_artifact_manifest_storage_runtime',
  'private_artifact_access_runtime',
  'remotion_private_preview_export_runtime',
  'provider_runtime_owner_approval_if_needed',
  'qa_cleanup_observability_rollback_gates',
  'negative_e2e_runtime_gate_regression',
]

const UNSAFE_BOOLEAN_KEYS = [
  'routeExecution',
  'routeHandlerRegistered',
  'mockHandlerRegistered',
  'workerExecution',
  'workerDispatch',
  'providerModelCalls',
  'providerModelCall',
  'modelCall',
  'remoteSupabaseMutation',
  'sqlExecution',
  'migrationApply',
  'secretPayloadAccess',
  'rawPromptExecution',
  'remotionExecution',
  'ffmpegExecution',
  'ffprobeExecution',
  'mediaProcessing',
  'renderExportExecution',
  'previewArtifactCreation',
  'finalExportCreation',
  'storageWrite',
  'storageRead',
  'signedUrlCreation',
  'publicArtifactCreation',
  'creditMutation',
  'stripePaymentProcessing',
  'externalBetaUnlock',
  'productionUnlock',
  'supabaseMutation',
  'internalBetaUnlock',
] as const

export function createInternalBetaRuntimeReadinessOrchestratorReport(
  input: InternalBetaRuntimeReadinessOrchestratorInput = {},
): InternalBetaRuntimeReadinessOrchestratorReport {
  const supabaseCredentialContext =
    input.supabaseCredentialContext ?? createInternalBetaSupabaseCredentialContextContract()
  const normalizedInput: InternalBetaRuntimeReadinessOrchestratorInput = {
    workspaceId: input.workspaceId ?? 'internal_beta_runtime_readiness_workspace',
    projectId: input.projectId ?? 'internal_beta_runtime_readiness_project',
    userId: input.userId ?? 'internal_beta_runtime_readiness_user',
    requestId: input.requestId ?? 'internal_beta_runtime_readiness_request',
    approvedPlanSnapshotId: input.approvedPlanSnapshotId ?? 'approved_plan_snapshot_pending_runtime_validation',
    creditReservationId: input.creditReservationId ?? 'credit_reservation_pending_runtime_validation',
    jobBatchId: input.jobBatchId ?? 'job_batch_pending_runtime_validation',
    jobId: input.jobId ?? 'job_pending_runtime_validation',
    workerType: input.workerType ?? 'remotion_render_worker',
    workerInstanceId: input.workerInstanceId ?? 'worker_instance_pending_runtime_validation',
    leaseId: input.leaseId ?? 'worker_lease_pending_runtime_validation',
    artifactManifestId: input.artifactManifestId ?? 'artifact_manifest_pending_runtime_validation',
    artifactId: input.artifactId ?? 'artifact_pending_runtime_validation',
    qaReportId: input.qaReportId ?? 'qa_report_pending_runtime_validation',
    checksumSha256: input.checksumSha256 ?? 'sha256_pending_runtime_validation',
    storageBucket: input.storageBucket ?? 'private_storage_bucket_pending_runtime_validation',
    storagePath: input.storagePath ?? 'private/storage/path/pending-runtime-validation',
    retentionPolicyId: input.retentionPolicyId ?? 'retention_policy_pending_runtime_validation',
    cleanupPolicyId: input.cleanupPolicyId ?? 'cleanup_policy_pending_runtime_validation',
    rendererPlanId: input.rendererPlanId ?? 'renderer_plan_pending_runtime_validation',
    providerRouteId: input.providerRouteId ?? 'provider_route_pending_runtime_validation',
    promptPlanId: input.promptPlanId ?? 'prompt_plan_pending_runtime_validation',
    modelPolicyId: input.modelPolicyId ?? 'model_policy_pending_runtime_validation',
    costCapId: input.costCapId ?? 'cost_cap_pending_runtime_validation',
    fallbackPolicyId: input.fallbackPolicyId ?? 'fallback_policy_pending_runtime_validation',
    editPlanId: input.editPlanId ?? 'edit_plan_pending_runtime_validation',
    chatSessionId: input.chatSessionId ?? 'chat_session_pending_runtime_validation',
    editPlanVersionId: input.editPlanVersionId ?? 'edit_plan_version_pending_runtime_validation',
    creditEstimateId: input.creditEstimateId ?? 'credit_estimate_pending_runtime_validation',
    creditApprovalId: input.creditApprovalId ?? 'credit_approval_pending_runtime_validation',
    approvedByUserId: input.approvedByUserId ?? input.userId ?? 'approved_by_user_pending_runtime_validation',
    approvedAt: input.approvedAt ?? '2026-06-26T00:00:00.000Z',
    confirmedSupabaseTargetValidation: input.confirmedSupabaseTargetValidation === true,
    serviceRolePersistenceRuntimeApproved: input.serviceRolePersistenceRuntimeApproved === true,
    remotePersistenceConfirmation: input.remotePersistenceConfirmation === true,
    idempotencyKey: input.idempotencyKey ?? 'idempotency_key_pending_runtime_validation',
    reason: input.reason ?? 'internal_beta_runtime_readiness_orchestrator_fail_closed_check',
    payload: sanitizeJson(input.payload ?? {}),
  }

  const serviceRoleRuntime = INTERNAL_BETA_SERVICE_ROLE_RUNTIME_SCAFFOLDS.map((definition) =>
    createDisabledInternalBetaRuntimeScaffoldResult(definition.routeId, normalizedInput),
  )
  const creditLedgerRuntime = INTERNAL_BETA_CREDIT_LEDGER_RUNTIME_SCAFFOLDS.map((definition) =>
    createDisabledInternalBetaCreditLedgerRuntimeScaffoldResult(definition.operation, normalizedInput),
  )
  const jobQueueRuntime = INTERNAL_BETA_JOB_QUEUE_RUNTIME_SCAFFOLDS.map((definition) =>
    createDisabledInternalBetaJobQueueRuntimeScaffoldResult(definition.operation, normalizedInput),
  )
  const privateArtifactManifest = INTERNAL_BETA_PRIVATE_ARTIFACT_MANIFEST_SCAFFOLDS.map((definition) =>
    createDisabledInternalBetaPrivateArtifactManifestScaffoldResult(definition.operation, normalizedInput),
  )
  const remotionRenderWorker = INTERNAL_BETA_REMOTION_RENDER_WORKER_SCAFFOLDS.map((definition) =>
    createDisabledInternalBetaRemotionRenderWorkerScaffoldResult(definition.operation, normalizedInput),
  )
  const providerAdapter = INTERNAL_BETA_PROVIDER_ADAPTER_SCAFFOLDS.map((definition) =>
    createDisabledInternalBetaProviderAdapterScaffoldResult(definition.operation, normalizedInput),
  )
  const apiRouteRuntimeFacade = createInternalBetaApiRouteRuntimeFacadeReport(normalizedInput)
  const serviceRolePersistenceGuard = evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard({
    workspaceId: normalizedInput.workspaceId,
    projectId: normalizedInput.projectId,
    chatSessionId: normalizedInput.chatSessionId,
    editPlanId: normalizedInput.editPlanId,
    editPlanVersionId: normalizedInput.editPlanVersionId,
    creditEstimateId: normalizedInput.creditEstimateId,
    creditApprovalId: normalizedInput.creditApprovalId,
    creditReservationId: normalizedInput.creditReservationId,
    approvedByUserId: normalizedInput.approvedByUserId,
    approvedAt: normalizedInput.approvedAt,
    idempotencyKey: `${normalizedInput.idempotencyKey}:approved-snapshot-service-role-persistence-guard`,
    snapshotPayload: buildRuntimeReadinessSnapshotPayload(normalizedInput),
    metadata: {
      source: 'internal_beta_runtime_readiness_orchestrator_4_persistence_guard_integration',
      localEvidenceOnly: true,
    },
    supabaseCredentialContext,
    confirmedSupabaseTargetValidation: normalizedInput.confirmedSupabaseTargetValidation,
    serviceRolePersistenceRuntimeApproved: normalizedInput.serviceRolePersistenceRuntimeApproved,
    remotePersistenceConfirmation: normalizedInput.remotePersistenceConfirmation,
  })
  const localE2EChainSmoke = createInternalBetaLocalE2EChainSmoke({
    workspaceId: normalizedInput.workspaceId,
    projectId: normalizedInput.projectId,
    userId: normalizedInput.userId,
    chatSessionId: normalizedInput.requestId,
    editPlanId: normalizedInput.editPlanId,
    editPlanVersionId: normalizedInput.approvedPlanSnapshotId,
    creditEstimateId: normalizedInput.creditEstimateId,
    creditApprovalId: normalizedInput.creditApprovalId,
    idempotencyKey: `${normalizedInput.idempotencyKey}:runtime-readiness-local-e2e-chain`,
    estimatedCredits: 1,
    approvedAt: '2026-06-26T00:00:00.000Z',
    metadata: {
      source: 'internal_beta_runtime_readiness_orchestrator_2_local_e2e_chain_integration',
      localEvidenceOnly: true,
    },
  })

  const allResults: InternalBetaRuntimeReadinessScaffoldResult[] = [
    ...apiRouteRuntimeFacade.facadeResponses,
    ...serviceRoleRuntime,
    ...creditLedgerRuntime,
    ...jobQueueRuntime,
    ...privateArtifactManifest,
    ...remotionRenderWorker,
    ...providerAdapter,
  ]

  const componentCounts: InternalBetaRuntimeReadinessComponentCounts = {
    apiRouteRuntimeFacade: apiRouteRuntimeFacade.facadeResponses.length,
    serviceRoleRuntime: serviceRoleRuntime.length,
    creditLedgerRuntime: creditLedgerRuntime.length,
    jobQueueRuntime: jobQueueRuntime.length,
    privateArtifactManifest: privateArtifactManifest.length,
    remotionRenderWorker: remotionRenderWorker.length,
    providerAdapter: providerAdapter.length,
    total: allResults.length,
  }

  if (apiRouteRuntimeFacade.status !== 'blocked_pending_supabase_target_validation_and_runtime_enablement') {
    throw new Error('Internal beta runtime readiness orchestrator API route facade status mismatch.')
  }
  if (
    apiRouteRuntimeFacade.internalBetaEndToEndReady !== false ||
    apiRouteRuntimeFacade.productReadyEndToEndLocalOssTools !== 0
  ) {
    throw new Error('Internal beta runtime readiness orchestrator API route facade must remain fail-closed.')
  }
  if (serviceRolePersistenceGuard.localSnapshotRuntime.ok !== true) {
    throw new Error(`Internal beta runtime readiness orchestrator approved snapshot local runtime failed: ${serviceRolePersistenceGuard.localSnapshotRuntime.status}.`)
  }
  if (
    serviceRolePersistenceGuard.persistedToSupabase !== false ||
    serviceRolePersistenceGuard.remoteSupabaseMutation !== false ||
    serviceRolePersistenceGuard.sqlExecution !== false ||
    serviceRolePersistenceGuard.serviceRoleRouteExecution !== false
  ) {
    throw new Error('Internal beta runtime readiness orchestrator service-role persistence guard executed a forbidden remote path.')
  }

  if (!localE2EChainSmoke.ok) {
    throw new Error(`Internal beta runtime readiness orchestrator local E2E chain evidence failed: ${localE2EChainSmoke.status}.`)
  }
  if (localE2EChainSmoke.status !== 'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime') {
    throw new Error('Internal beta runtime readiness orchestrator local E2E chain evidence status mismatch.')
  }
  if (localE2EChainSmoke.localOnly !== true || localE2EChainSmoke.persistedToSupabase !== false) {
    throw new Error('Internal beta runtime readiness orchestrator local E2E chain evidence must remain local-only.')
  }

  const unsafeExecutionDetected =
    allResults.some(hasUnsafeBoolean) ||
    Object.values(apiRouteRuntimeFacade.safety).some(Boolean) ||
    hasUnsafeServiceRolePersistenceGuardBoolean(serviceRolePersistenceGuard) ||
    Object.values(localE2EChainSmoke.safety).some(Boolean)
  if (unsafeExecutionDetected) {
    throw new Error('Internal beta runtime readiness orchestrator detected an enabled runtime execution flag.')
  }

  return {
    ok: false,
    status: 'blocked_pending_supabase_target_validation_and_runtime_enablement',
    createdAt: nowIso(),
    internalBetaEndToEndReady: false,
    productReadyEndToEndLocalOssTools: 0,
    componentCounts,
    localEvidenceCounts: {
      approvedSnapshotServiceRolePersistenceGuard: 1,
      localE2EChainSmoke: 1,
      total: 2,
    },
    componentStatuses: {
      api_route_runtime_facade: uniqueStatuses(apiRouteRuntimeFacade.facadeResponses),
      service_role_runtime: uniqueStatuses(serviceRoleRuntime),
      credit_ledger_runtime: uniqueStatuses(creditLedgerRuntime),
      job_queue_runtime: uniqueStatuses(jobQueueRuntime),
      private_artifact_manifest: uniqueStatuses(privateArtifactManifest),
      remotion_render_worker: uniqueStatuses(remotionRenderWorker),
      provider_adapter: uniqueStatuses(providerAdapter),
    },
    componentSummaries: [
      ...summarizeResults('api_route_runtime_facade', apiRouteRuntimeFacade.facadeResponses),
      ...summarizeResults('service_role_runtime', serviceRoleRuntime),
      ...summarizeResults('credit_ledger_runtime', creditLedgerRuntime),
      ...summarizeResults('job_queue_runtime', jobQueueRuntime),
      ...summarizeResults('private_artifact_manifest', privateArtifactManifest),
      ...summarizeResults('remotion_render_worker', remotionRenderWorker),
      ...summarizeResults('provider_adapter', providerAdapter),
    ],
    serviceRolePersistenceGuard: {
      ok: serviceRolePersistenceGuard.ok,
      status: serviceRolePersistenceGuard.status,
      localSnapshotRuntimeStatus: serviceRolePersistenceGuard.localSnapshotRuntime.status,
      localSnapshotRuntimeOk: serviceRolePersistenceGuard.localSnapshotRuntime.ok,
      persistedToSupabase: false,
      routeExecution: false,
      serviceRoleRouteExecution: false,
      remoteSupabaseMutation: false,
      sqlExecution: false,
      migrationApply: false,
      creditMutation: false,
      jobEnqueue: false,
      workerExecution: false,
      workerDispatch: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      internalBetaUnlock: false,
      requiredBeforePersistence: serviceRolePersistenceGuard.requiredBeforePersistence,
    },
    localE2EChainSmoke: {
      ok: true,
      status: 'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime',
      localOnly: true,
      persistedToSupabase: false,
      internalBetaEndToEndReady: false,
      stepSummary: localE2EChainSmoke.steps,
      requiredBeforeInternalBeta: localE2EChainSmoke.requiredBeforeInternalBeta,
    },
    supabaseCredentialContext,
    safety: {
      remoteSupabaseMutation: false,
      sqlExecution: false,
      migrationApply: false,
      serviceRoleRouteExecution: false,
      routeExecution: false,
      workerExecution: false,
      workerDispatch: false,
      providerModelCall: false,
      modelCall: false,
      secretPayloadAccess: false,
      rawPromptExecution: false,
      remotionExecution: false,
      ffmpegExecution: false,
      ffprobeExecution: false,
      mediaProcessing: false,
      renderExportExecution: false,
      previewArtifactCreation: false,
      finalExportCreation: false,
      storageWrite: false,
      storageRead: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      creditMutation: false,
      stripePaymentProcessing: false,
      internalBetaUnlock: false,
      externalBetaUnlock: false,
      productionUnlock: false,
    },
    unsafeExecutionDetected: false,
    requiredBeforeEnablement: INTERNAL_BETA_RUNTIME_READINESS_ORCHESTRATOR_REQUIRED_BEFORE_ENABLEMENT,
    nextMilestone: 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R',
    inputSummary: sanitizeJson(normalizedInput),
    warnings: [
      'Internal beta runtime readiness orchestrator is fail-closed.',
      `Supabase credential context decision: ${supabaseCredentialContext.decision}.`,
      'All composed API-route facade, service-role, credit-ledger, job-queue, private-artifact, Remotion render-worker, and provider-adapter scaffolds returned disabled runtime results.',
      'Approved snapshot service-role persistence guard is evaluated as local metadata only; it does not write Supabase.',
      'Local E2E chain smoke evidence is composed and validated as local metadata only; it does not unlock internal beta.',
      'No Supabase mutation, SQL execution, worker execution, provider/model call, Remotion execution, media processing, artifact creation, credit mutation, signed URL creation, public artifact creation, internal beta unlock, external beta unlock, or production unlock occurred.',
    ],
  }
}

export function assertInternalBetaRuntimeReadinessOrchestratorFailClosed(
  report: InternalBetaRuntimeReadinessOrchestratorReport,
): true {
  if (report.ok !== false) throw new Error('Internal beta runtime readiness report must remain blocked.')
  if (report.internalBetaEndToEndReady !== false) throw new Error('Internal beta end-to-end readiness must remain false.')
  if (report.productReadyEndToEndLocalOssTools !== 0) {
    throw new Error('Product-ready end-to-end local OSS tools must remain 0.')
  }
  if (report.unsafeExecutionDetected !== false) throw new Error('Unsafe execution detection must remain false.')
  for (const [key, value] of Object.entries(report.safety)) {
    if (value !== false) throw new Error(`Safety flag ${key} must remain false.`)
  }
  assertInternalBetaSupabaseCredentialContextFailClosed(report.supabaseCredentialContext)
  for (const component of report.componentSummaries) {
    if (component.ok !== false) throw new Error(`Component ${component.component}:${component.id} must remain disabled.`)
  }
  if (
    report.localEvidenceCounts.approvedSnapshotServiceRolePersistenceGuard !== 1 ||
    report.localEvidenceCounts.localE2EChainSmoke !== 1 ||
    report.localEvidenceCounts.total !== 2
  ) {
    throw new Error('Local evidence counts must include service-role persistence guard and local E2E chain evidence.')
  }
  if (report.serviceRolePersistenceGuard.localSnapshotRuntimeOk !== true) {
    throw new Error('Approved snapshot service-role persistence guard local snapshot runtime must pass.')
  }
  for (const [key, value] of Object.entries(report.serviceRolePersistenceGuard)) {
    if (key.endsWith('Execution') && value === true) throw new Error(`Service-role persistence guard flag ${key} must remain false.`)
  }
  if (report.localE2EChainSmoke.ok !== true) throw new Error('Local E2E chain evidence must pass locally.')
  if (report.localE2EChainSmoke.localOnly !== true) throw new Error('Local E2E chain evidence must remain local-only.')
  if (report.localE2EChainSmoke.persistedToSupabase !== false) {
    throw new Error('Local E2E chain evidence must not persist to Supabase.')
  }
  if (report.localE2EChainSmoke.internalBetaEndToEndReady !== false) {
    throw new Error('Local E2E chain evidence must not mark internal beta ready.')
  }

  return true
}

function summarizeResults(
  component: InternalBetaRuntimeReadinessComponent,
  results: InternalBetaRuntimeReadinessScaffoldResult[],
): InternalBetaRuntimeReadinessComponentSummary[] {
  return results.map((result) => ({
    component,
    id: 'routeId' in result ? result.routeId : result.operation,
    ok: result.ok,
    status: result.status,
    requiredBeforeEnablement: result.requiredBeforeEnablement,
  }))
}

function uniqueStatuses(results: InternalBetaRuntimeReadinessScaffoldResult[]): string[] {
  return [...new Set(results.map((result) => result.status))]
}

function hasUnsafeBoolean(result: InternalBetaRuntimeReadinessScaffoldResult): boolean {
  const record = result as unknown as Record<string, unknown>
  return UNSAFE_BOOLEAN_KEYS.some((key) => record[key] === true)
}

function hasUnsafeServiceRolePersistenceGuardBoolean(
  result: InternalBetaApprovedSnapshotServiceRolePersistenceGuardResult,
): boolean {
  return [
    result.persistedToSupabase,
    result.routeExecution,
    result.serviceRoleRouteExecution,
    result.remoteSupabaseMutation,
    result.sqlExecution,
    result.migrationApply,
    result.creditMutation,
    result.jobEnqueue,
    result.workerExecution,
    result.workerDispatch,
    result.signedUrlCreation,
    result.publicArtifactCreation,
    result.internalBetaUnlock,
  ].some(Boolean)
}

function buildRuntimeReadinessSnapshotPayload(
  input: InternalBetaRuntimeReadinessOrchestratorInput,
): ApprovedPlanSnapshotPayload {
  const editPlanId = input.editPlanId ?? 'edit_plan_pending_runtime_validation'
  const projectId = input.projectId ?? 'project_pending_runtime_validation'
  const creditEstimateId = input.creditEstimateId ?? 'credit_estimate_pending_runtime_validation'
  const approvedByUserId = input.approvedByUserId ?? input.userId ?? 'approved_by_user_pending_runtime_validation'
  const approvedAt = input.approvedAt ?? '2026-06-26T00:00:00.000Z'

  return {
    compiledIntent: { intentId: `${editPlanId}:compiled-intent`, source: 'structured_intent' },
    confirmedSettings: { aspectRatio: '16:9', aspectRatioConfirmed: true, editLevel: 'basic' },
    sourceOrder: [{ mediaAssetId: `${projectId}:media-asset-001`, order: 1 }],
    professionalEditingDirective: { pacing: 'clean', qualityFloor: 'professional_basic' },
    segmentOperations: [
      { segmentId: `${editPlanId}:segment-001`, operationId: `${editPlanId}:operation-001`, operation: 'trim_cleanly' },
    ],
    visualAssetPlan: { items: [], policy: 'no_generation_without_approval' },
    rendererPlan: { renderer: 'remotion_future_worker', execution: 'not_run' },
    qaPlan: { checks: ['intent_match', 'professional_quality', 'private_artifact_policy'], execution: 'future_worker' },
    providerRouting: { providers: [], realCalls: false },
    modelTierPolicy: { basicProVeoAllowed: false, premiumVeoFinalFallbackOnly: true },
    fallbackPolicy: { requiresUserReviewForMeaningChange: true },
    creditEstimate: { creditEstimateId, credits: 1 },
    approvalRecord: { approvedByUserId, approvedAt },
  }
}
