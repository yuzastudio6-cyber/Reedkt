import {
  INTERNAL_BETA_CREDIT_LEDGER_RUNTIME_SCAFFOLDS,
  createDisabledInternalBetaCreditLedgerRuntimeScaffoldResult,
  type InternalBetaCreditLedgerRuntimeInput,
  type InternalBetaCreditLedgerRuntimeScaffoldResult,
} from './internal-beta-credit-ledger-runtime-scaffold'
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
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaRuntimeReadinessOrchestratorStatus =
  'blocked_pending_supabase_target_validation_and_runtime_enablement'

export type InternalBetaRuntimeReadinessComponent =
  | 'service_role_runtime'
  | 'credit_ledger_runtime'
  | 'job_queue_runtime'
  | 'private_artifact_manifest'
  | 'remotion_render_worker'
  | 'provider_adapter'

export interface InternalBetaRuntimeReadinessOrchestratorInput
  extends InternalBetaRuntimeScaffoldInput,
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
}

type InternalBetaRuntimeReadinessScaffoldResult =
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
  serviceRoleRuntime: number
  creditLedgerRuntime: number
  jobQueueRuntime: number
  privateArtifactManifest: number
  remotionRenderWorker: number
  providerAdapter: number
  total: number
}

export interface InternalBetaRuntimeReadinessOrchestratorReport {
  ok: false
  status: InternalBetaRuntimeReadinessOrchestratorStatus
  createdAt: string
  internalBetaEndToEndReady: false
  productReadyEndToEndLocalOssTools: 0
  componentCounts: InternalBetaRuntimeReadinessComponentCounts
  componentStatuses: Record<InternalBetaRuntimeReadinessComponent, string[]>
  componentSummaries: InternalBetaRuntimeReadinessComponentSummary[]
  safety: InternalBetaRuntimeReadinessSafetySummary
  unsafeExecutionDetected: false
  requiredBeforeEnablement: string[]
  nextMilestone: 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R'
  inputSummary: Record<string, unknown>
  warnings: string[]
}

export const INTERNAL_BETA_RUNTIME_READINESS_ORCHESTRATOR_COMPONENTS: InternalBetaRuntimeReadinessComponent[] = [
  'service_role_runtime',
  'credit_ledger_runtime',
  'job_queue_runtime',
  'private_artifact_manifest',
  'remotion_render_worker',
  'provider_adapter',
]

export const INTERNAL_BETA_RUNTIME_READINESS_ORCHESTRATOR_REQUIRED_BEFORE_ENABLEMENT = [
  'confirmed_supabase_target_rls_storage_validation',
  'guarded_worker_runtime_rpc_staging_sql_execution',
  'service_role_runtime_enablement',
  'approved_snapshot_persistence_runtime',
  'credit_ledger_transaction_runtime',
  'job_queue_lease_event_runtime',
  'private_artifact_manifest_storage_runtime',
  'remotion_private_preview_export_runtime',
  'provider_runtime_owner_approval_if_needed',
  'qa_cleanup_observability_rollback_gates',
  'negative_e2e_runtime_gate_regression',
]

const UNSAFE_BOOLEAN_KEYS = [
  'routeExecution',
  'workerExecution',
  'workerDispatch',
  'providerModelCalls',
  'modelCall',
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
  'supabaseMutation',
  'internalBetaUnlock',
] as const

export function createInternalBetaRuntimeReadinessOrchestratorReport(
  input: InternalBetaRuntimeReadinessOrchestratorInput = {},
): InternalBetaRuntimeReadinessOrchestratorReport {
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
    creditEstimateId: input.creditEstimateId ?? 'credit_estimate_pending_runtime_validation',
    creditApprovalId: input.creditApprovalId ?? 'credit_approval_pending_runtime_validation',
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

  const allResults: InternalBetaRuntimeReadinessScaffoldResult[] = [
    ...serviceRoleRuntime,
    ...creditLedgerRuntime,
    ...jobQueueRuntime,
    ...privateArtifactManifest,
    ...remotionRenderWorker,
    ...providerAdapter,
  ]

  const componentCounts: InternalBetaRuntimeReadinessComponentCounts = {
    serviceRoleRuntime: serviceRoleRuntime.length,
    creditLedgerRuntime: creditLedgerRuntime.length,
    jobQueueRuntime: jobQueueRuntime.length,
    privateArtifactManifest: privateArtifactManifest.length,
    remotionRenderWorker: remotionRenderWorker.length,
    providerAdapter: providerAdapter.length,
    total: allResults.length,
  }

  const unsafeExecutionDetected = allResults.some(hasUnsafeBoolean)
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
    componentStatuses: {
      service_role_runtime: uniqueStatuses(serviceRoleRuntime),
      credit_ledger_runtime: uniqueStatuses(creditLedgerRuntime),
      job_queue_runtime: uniqueStatuses(jobQueueRuntime),
      private_artifact_manifest: uniqueStatuses(privateArtifactManifest),
      remotion_render_worker: uniqueStatuses(remotionRenderWorker),
      provider_adapter: uniqueStatuses(providerAdapter),
    },
    componentSummaries: [
      ...summarizeResults('service_role_runtime', serviceRoleRuntime),
      ...summarizeResults('credit_ledger_runtime', creditLedgerRuntime),
      ...summarizeResults('job_queue_runtime', jobQueueRuntime),
      ...summarizeResults('private_artifact_manifest', privateArtifactManifest),
      ...summarizeResults('remotion_render_worker', remotionRenderWorker),
      ...summarizeResults('provider_adapter', providerAdapter),
    ],
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
      'All composed service-role, credit-ledger, job-queue, private-artifact, Remotion render-worker, and provider-adapter scaffolds returned disabled runtime results.',
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
  for (const component of report.componentSummaries) {
    if (component.ok !== false) throw new Error(`Component ${component.component}:${component.id} must remain disabled.`)
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
