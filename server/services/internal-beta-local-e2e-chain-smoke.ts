import { createHash } from 'node:crypto'

import type { ApprovedPlanSnapshotPayload } from '../../src/backend/cloud/approved-plan-snapshot-contracts'
import { inspectForSecretLikeValues } from '../../src/backend/cloud/cloud-runtime-contracts'
import {
  createInternalBetaApprovedSnapshotLocalRuntime,
  type InternalBetaApprovedSnapshotPersistenceResult,
} from './internal-beta-approved-snapshot-persistence-local-runtime'
import {
  createInternalBetaCreditReservationLocalRuntime,
  type InternalBetaCreditReservationLocalRuntimeResult,
} from './internal-beta-credit-reservation-local-runtime'
import {
  createInternalBetaJobQueueLocalRuntime,
  type InternalBetaJobQueueLocalRuntimeResult,
} from './internal-beta-job-queue-local-runtime'
import {
  createInternalBetaPrivateArtifactAccessPolicyLocalRuntime,
  type InternalBetaPrivateArtifactAccessPolicyLocalRuntimeResult,
} from './internal-beta-private-artifact-access-policy-local-runtime'
import {
  createInternalBetaPrivateArtifactManifestLocalRuntime,
  type InternalBetaPrivateArtifactManifestLocalRuntimeResult,
} from './internal-beta-private-artifact-manifest-local-runtime'
import {
  createInternalBetaQaCleanupObservabilityLocalRuntime,
  type InternalBetaQaCleanupObservabilityLocalRuntimeResult,
} from './internal-beta-qa-cleanup-observability-local-runtime'
import {
  createInternalBetaRemotionPrivatePreviewExportLocalRuntime,
  type InternalBetaRemotionPrivatePreviewExportLocalRuntimeResult,
} from './internal-beta-remotion-private-preview-export-local-runtime'
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaLocalE2EChainSmokeStatus =
  | 'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime'
  | 'blocked_invalid_local_e2e_chain_input'
  | 'blocked_local_e2e_chain_step_failed'

export interface InternalBetaLocalE2EChainSmokeInput {
  workspaceId?: string
  projectId?: string
  userId?: string
  chatSessionId?: string
  editPlanId?: string
  editPlanVersionId?: string
  creditEstimateId?: string
  creditApprovalId?: string
  idempotencyKey?: string
  estimatedCredits?: number
  approvedAt?: string
  metadata?: Record<string, unknown>
}

export interface InternalBetaLocalE2EChainSmokeSafety {
  routeExecution: false
  remoteSupabaseMutation: false
  sqlExecution: false
  migrationApply: false
  serviceRoleRouteExecution: false
  serviceRoleSecretPayloadAccess: false
  frontendServiceRoleCredentialExposure: false
  realCreditMutation: false
  stripePaymentProcessing: false
  jobEnqueueExecution: false
  jobEventWriteExecution: false
  workerLeaseClaim: false
  workerHeartbeat: false
  workerExecution: false
  workerDispatch: false
  providerModelCall: false
  rawPromptExecution: false
  remotionExecution: false
  ffmpegExecution: false
  ffprobeExecution: false
  mediaProcessing: false
  renderExportExecution: false
  previewArtifactCreation: false
  finalExportCreation: false
  storageObjectCreation: false
  storageObjectRead: false
  storageObjectDelete: false
  signedUrlCreation: false
  publicArtifactCreation: false
  privateMediaProcessing: false
  userMediaProcessing: false
  cleanupExecution: false
  rollbackExecution: false
  remoteObservabilitySinkWrite: false
  internalBetaUnlock: false
  externalBetaUnlock: false
  productionUnlock: false
}

export interface InternalBetaLocalE2EChainSmokeStepSummary {
  approvedSnapshot: boolean
  creditReservation: boolean
  jobQueue: boolean
  privateArtifactManifest: boolean
  privateArtifactAccessPolicy: boolean
  remotionPrivatePreviewExportMetadata: boolean
  qaCleanupObservability: boolean
}

export interface InternalBetaLocalE2EChainSmokeRecord {
  id: string
  workspaceId: string
  projectId: string
  userId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  jobBatchId: string
  primaryJobId: string
  artifactManifestId: string
  primaryArtifactId: string
  privateArtifactAccessPolicyId: string
  remotionRenderRequestId: string
  qaCleanupRecordId: string
  status: 'local_chain_metadata_only'
  createdAt: string
  localOnly: true
  persistedToSupabase: false
  internalBetaEndToEndReady: false
  metadata: Record<string, unknown>
}

export interface InternalBetaLocalE2EChainSmokeResult {
  ok: boolean
  status: InternalBetaLocalE2EChainSmokeStatus
  createdAt: string
  chainHash?: string
  record?: InternalBetaLocalE2EChainSmokeRecord
  steps: InternalBetaLocalE2EChainSmokeStepSummary
  validation: {
    ok: boolean
    errors: string[]
    warnings: string[]
  }
  localOnly: true
  persistedToSupabase: false
  requiredBeforeInternalBeta: string[]
  safety: InternalBetaLocalE2EChainSmokeSafety
  inputs: {
    workspaceId?: string
    projectId?: string
    userId?: string
  }
  stepResults?: {
    approvedSnapshot: InternalBetaApprovedSnapshotPersistenceResult
    creditReservation: InternalBetaCreditReservationLocalRuntimeResult
    jobQueue: InternalBetaJobQueueLocalRuntimeResult
    privateArtifactManifest: InternalBetaPrivateArtifactManifestLocalRuntimeResult
    privateArtifactAccessPolicy: InternalBetaPrivateArtifactAccessPolicyLocalRuntimeResult
    remotionPrivatePreviewExportMetadata: InternalBetaRemotionPrivatePreviewExportLocalRuntimeResult
    qaCleanupObservability: InternalBetaQaCleanupObservabilityLocalRuntimeResult
  }
}

export const INTERNAL_BETA_LOCAL_E2E_CHAIN_SMOKE_RULE =
  'Internal beta local E2E chain smoke composes approved snapshot, credit, job, artifact, access, render metadata, QA, cleanup, and negative gates without remote runtime.'

export const INTERNAL_BETA_LOCAL_E2E_CHAIN_FORBIDDEN_INPUT_KEYS = [
  'rawChat',
  'rawUserMessage',
  'rawUserMessages',
  'rawPrompt',
  'promptText',
  'providerPrompt',
  'directPrompt',
  'signedUrl',
  'signedURL',
  'publicUrl',
  'publicURL',
  'serviceRoleKey',
  'providerApiKey',
  'storageObjectBody',
  'mediaBytes',
  'fileBuffer',
  'renderedBytes',
  'videoBuffer',
  'secret',
  'token',
]

const REQUIRED_BEFORE_INTERNAL_BETA = [
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'guarded_worker_runtime_rpc_staging_sql_execution',
  'service_role_runtime_enablement',
  'approved_snapshot_persistence_runtime',
  'credit_ledger_transaction_runtime',
  'job_queue_lease_event_runtime',
  'private_artifact_manifest_storage_runtime',
  'private_artifact_access_runtime',
  'remotion_private_preview_export_runtime',
  'qa_cleanup_observability_rollback_runtime',
  'negative_e2e_runtime_gate_regression',
]

const SAFETY_FALSE: InternalBetaLocalE2EChainSmokeSafety = {
  routeExecution: false,
  remoteSupabaseMutation: false,
  sqlExecution: false,
  migrationApply: false,
  serviceRoleRouteExecution: false,
  serviceRoleSecretPayloadAccess: false,
  frontendServiceRoleCredentialExposure: false,
  realCreditMutation: false,
  stripePaymentProcessing: false,
  jobEnqueueExecution: false,
  jobEventWriteExecution: false,
  workerLeaseClaim: false,
  workerHeartbeat: false,
  workerExecution: false,
  workerDispatch: false,
  providerModelCall: false,
  rawPromptExecution: false,
  remotionExecution: false,
  ffmpegExecution: false,
  ffprobeExecution: false,
  mediaProcessing: false,
  renderExportExecution: false,
  previewArtifactCreation: false,
  finalExportCreation: false,
  storageObjectCreation: false,
  storageObjectRead: false,
  storageObjectDelete: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  cleanupExecution: false,
  rollbackExecution: false,
  remoteObservabilitySinkWrite: false,
  internalBetaUnlock: false,
  externalBetaUnlock: false,
  productionUnlock: false,
}

const PREVIEW_SHA = '0'.repeat(64)
const MANIFEST_SHA = '1'.repeat(64)
const QA_SHA = '2'.repeat(64)
const EXPORT_SHA = '3'.repeat(64)

export function createInternalBetaLocalE2EChainSmoke(
  input: InternalBetaLocalE2EChainSmokeInput,
): InternalBetaLocalE2EChainSmokeResult {
  const createdAt = nowIso()
  const errors: string[] = []
  const warnings: string[] = []

  requireNonEmpty(input.workspaceId, 'workspaceId', errors)
  requireNonEmpty(input.projectId, 'projectId', errors)
  requireNonEmpty(input.userId, 'userId', errors)
  requireNonEmpty(input.chatSessionId, 'chatSessionId', errors)
  requireNonEmpty(input.editPlanId, 'editPlanId', errors)
  requireNonEmpty(input.creditEstimateId, 'creditEstimateId', errors)
  requireNonEmpty(input.creditApprovalId, 'creditApprovalId', errors)
  requireNonEmpty(input.idempotencyKey, 'idempotencyKey', errors)

  if (typeof input.estimatedCredits !== 'number' || !Number.isFinite(input.estimatedCredits) || input.estimatedCredits <= 0) {
    errors.push('estimatedCredits must be a positive finite number.')
  }

  const forbiddenInputKeys = findForbiddenInputKeys(input)
  forbiddenInputKeys.forEach((path) => {
    errors.push(`Local E2E chain input must not contain raw prompt, signed/public URL, media bytes, provider secret, service-role, token, or secret fields: ${path}.`)
  })

  const metadataSecretCheck = inspectForSecretLikeValues(input.metadata ?? {})
  errors.push(...metadataSecretCheck.errors)
  warnings.push(...metadataSecretCheck.warnings)

  if (errors.length > 0) {
    return createResult({
      createdAt,
      status: 'blocked_invalid_local_e2e_chain_input',
      errors,
      warnings,
      input,
    })
  }

  const workspaceId = input.workspaceId ?? ''
  const projectId = input.projectId ?? ''
  const userId = input.userId ?? ''
  const approvedAt = input.approvedAt ?? '2026-06-26T00:00:00.000Z'
  const idempotencyRoot = input.idempotencyKey ?? ''

  const approvedSnapshot = createInternalBetaApprovedSnapshotLocalRuntime({
    workspaceId,
    projectId,
    chatSessionId: input.chatSessionId,
    editPlanId: input.editPlanId,
    editPlanVersionId: input.editPlanVersionId,
    creditEstimateId: input.creditEstimateId,
    creditApprovalId: input.creditApprovalId,
    creditReservationId: 'credit_reservation_pending_local_e2e_chain_bootstrap',
    approvedByUserId: userId,
    approvedAt,
    idempotencyKey: `${idempotencyRoot}:approved-snapshot`,
    snapshotPayload: buildApprovedSnapshotPayload(input),
    metadata: {
      source: 'internal_beta_local_e2e_chain_smoke',
      reservationBootstrap: 'pending_local_credit_reservation_runtime',
    },
  })

  if (!approvedSnapshot.ok || !approvedSnapshot.snapshot) {
    return createStepFailureResult({ createdAt, input, warnings, approvedSnapshot })
  }

  const creditReservation = createInternalBetaCreditReservationLocalRuntime({
    workspaceId,
    projectId,
    userId,
    editPlanId: input.editPlanId,
    editPlanVersionId: input.editPlanVersionId,
    approvedPlanSnapshotId: approvedSnapshot.snapshot.id,
    creditEstimateId: input.creditEstimateId,
    creditApprovalId: input.creditApprovalId,
    creditEstimateStatus: 'approved',
    estimatedCredits: input.estimatedCredits,
    reservationPurpose: 'internal_beta_preview',
    idempotencyKey: `${idempotencyRoot}:credit-reservation`,
    approvedByUserId: userId,
    approvedAt,
    metadata: { source: 'internal_beta_local_e2e_chain_smoke' },
  })

  if (!creditReservation.ok || !creditReservation.reservation) {
    return createStepFailureResult({ createdAt, input, warnings, approvedSnapshot, creditReservation })
  }

  const jobQueue = createInternalBetaJobQueueLocalRuntime({
    workspaceId,
    projectId,
    userId,
    approvedPlanSnapshotId: approvedSnapshot.snapshot.id,
    creditReservationId: creditReservation.reservation.id,
    idempotencyKey: `${idempotencyRoot}:job-queue`,
    requestedByUserId: userId,
    jobs: [
      {
        jobType: 'prepare_private_artifact_manifest_metadata',
        workerType: 'backend_metadata_local',
        priority: 'normal',
        payload: { approvedPlanSnapshotId: approvedSnapshot.snapshot.id },
      },
      {
        jobType: 'prepare_remotion_private_preview_export_metadata',
        workerType: 'remotion_render_worker_future',
        priority: 'normal',
        dependsOnLocalJobIndexes: [0],
        payload: { rendererPlanId: 'renderer_plan_local_e2e_chain_001' },
      },
    ],
    metadata: { source: 'internal_beta_local_e2e_chain_smoke' },
  })

  if (!jobQueue.ok || !jobQueue.batch || jobQueue.jobs.length < 2) {
    return createStepFailureResult({ createdAt, input, warnings, approvedSnapshot, creditReservation, jobQueue })
  }

  const primaryJob = jobQueue.jobs[1]
  const privateArtifactManifest = createInternalBetaPrivateArtifactManifestLocalRuntime({
    workspaceId,
    projectId,
    approvedPlanSnapshotId: approvedSnapshot.snapshot.id,
    jobId: primaryJob.id,
    jobBatchId: jobQueue.batch.id,
    creditReservationId: creditReservation.reservation.id,
    artifactManifestId: 'artifact_manifest_local_e2e_chain_001',
    idempotencyKey: `${idempotencyRoot}:artifact-manifest`,
    requestedByUserId: userId,
    artifacts: [
      {
        artifactKind: 'preview',
        artifactRole: 'private_preview_metadata_expectation',
        fileName: 'internal-beta-local-preview.mp4',
        byteCount: 1024,
        sha256: PREVIEW_SHA,
        linkedJobId: primaryJob.id,
        linkedSegmentIds: ['segment_local_e2e_001'],
        linkedRendererLayerIds: ['renderer_layer_local_e2e_001'],
        qaStatus: 'qa_pending',
        cleanupPolicy: 'retain_with_project_private',
      },
      {
        artifactKind: 'manifest',
        artifactRole: 'private_artifact_manifest_metadata',
        fileName: 'internal-beta-local-artifact-manifest.json',
        byteCount: 512,
        sha256: MANIFEST_SHA,
        linkedJobId: jobQueue.jobs[0].id,
        qaStatus: 'not_run',
        cleanupPolicy: 'retain_with_project_private',
      },
      {
        artifactKind: 'qa_report',
        artifactRole: 'qa_report_metadata_expectation',
        fileName: 'internal-beta-local-qa-report.json',
        byteCount: 256,
        sha256: QA_SHA,
        linkedJobId: primaryJob.id,
        qaStatus: 'not_run',
        cleanupPolicy: 'qa_short_retention',
      },
    ],
    metadata: { source: 'internal_beta_local_e2e_chain_smoke' },
  })

  if (!privateArtifactManifest.ok || !privateArtifactManifest.manifest) {
    return createStepFailureResult({
      createdAt,
      input,
      warnings,
      approvedSnapshot,
      creditReservation,
      jobQueue,
      privateArtifactManifest,
    })
  }

  const primaryArtifact = privateArtifactManifest.manifest.artifacts[0]
  const privateArtifactAccessPolicy = createInternalBetaPrivateArtifactAccessPolicyLocalRuntime({
    workspaceId,
    projectId,
    userId,
    approvedPlanSnapshotId: approvedSnapshot.snapshot.id,
    artifactManifestId: privateArtifactManifest.manifest.id,
    artifactId: primaryArtifact.id,
    fileName: primaryArtifact.fileName,
    sha256: primaryArtifact.sha256,
    accessMode: 'private_preview_view',
    idempotencyKey: `${idempotencyRoot}:artifact-access-policy`,
    authorizationContext: {
      workspaceMember: true,
      projectMember: true,
      serviceRoleRuntimeApproved: false,
      supabaseRlsStorageValidated: false,
    },
    metadata: { source: 'internal_beta_local_e2e_chain_smoke' },
  })

  if (!privateArtifactAccessPolicy.ok || !privateArtifactAccessPolicy.record) {
    return createStepFailureResult({
      createdAt,
      input,
      warnings,
      approvedSnapshot,
      creditReservation,
      jobQueue,
      privateArtifactManifest,
      privateArtifactAccessPolicy,
    })
  }

  const remotionPrivatePreviewExportMetadata = createInternalBetaRemotionPrivatePreviewExportLocalRuntime({
    workspaceId,
    projectId,
    approvedPlanSnapshotId: approvedSnapshot.snapshot.id,
    creditReservationId: creditReservation.reservation.id,
    jobId: primaryJob.id,
    artifactManifestId: privateArtifactManifest.manifest.id,
    rendererPlanId: 'renderer_plan_local_e2e_chain_001',
    idempotencyKey: `${idempotencyRoot}:remotion-metadata`,
    renderMode: 'preview_and_export_candidate',
    outputFrame: { width: 1280, height: 720, fps: 30, durationFrames: 90 },
    expectedOutputs: [
      {
        outputKind: 'private_preview',
        fileName: primaryArtifact.fileName,
        byteCount: primaryArtifact.byteCount,
        sha256: primaryArtifact.sha256,
        linkedArtifactId: primaryArtifact.id,
        linkedRendererLayerIds: ['renderer_layer_local_e2e_001'],
        qaStatus: 'qa_pending',
        cleanupPolicy: 'retain_with_project_private',
      },
      {
        outputKind: 'private_export_candidate',
        fileName: 'internal-beta-local-export-candidate.mp4',
        byteCount: 2048,
        sha256: EXPORT_SHA,
        linkedRendererLayerIds: ['renderer_layer_local_e2e_001'],
        qaStatus: 'not_run',
        cleanupPolicy: 'retain_with_project_private',
      },
    ],
    metadata: { source: 'internal_beta_local_e2e_chain_smoke' },
  })

  if (!remotionPrivatePreviewExportMetadata.ok || !remotionPrivatePreviewExportMetadata.renderRequest) {
    return createStepFailureResult({
      createdAt,
      input,
      warnings,
      approvedSnapshot,
      creditReservation,
      jobQueue,
      privateArtifactManifest,
      privateArtifactAccessPolicy,
      remotionPrivatePreviewExportMetadata,
    })
  }

  const qaCleanupObservability = createInternalBetaQaCleanupObservabilityLocalRuntime({
    workspaceId,
    projectId,
    approvedPlanSnapshotId: approvedSnapshot.snapshot.id,
    creditReservationId: creditReservation.reservation.id,
    jobId: primaryJob.id,
    artifactManifestId: privateArtifactManifest.manifest.id,
    renderRequestId: remotionPrivatePreviewExportMetadata.renderRequest.id,
    idempotencyKey: `${idempotencyRoot}:qa-cleanup-observability`,
    qaChecks: [
      {
        category: 'approved_snapshot',
        outcome: 'passed',
        summary: 'Approved snapshot metadata is linked to downstream local-only records.',
        linkedJobIds: [primaryJob.id],
      },
      {
        category: 'private_preview_export',
        outcome: 'blocked',
        summary: 'Preview/export execution remains blocked pending remote runtime gates.',
        linkedArtifactIds: [primaryArtifact.id],
        linkedJobIds: [primaryJob.id],
      },
      {
        category: 'safety_boundary',
        outcome: 'passed',
        summary: 'No public artifact, signed URL, storage read, worker dispatch, or beta unlock occurred.',
      },
    ],
    cleanupPolicies: [
      {
        artifactId: primaryArtifact.id,
        fileName: primaryArtifact.fileName,
        cleanupPolicy: 'retain_with_project_private',
        cleanupStatus: 'blocked_pending_storage_runtime',
      },
    ],
    observabilityEvents: [
      {
        eventType: 'qa_gate_recorded',
        severity: 'info',
        message: 'Local E2E chain QA gate recorded without remote sink write.',
      },
    ],
    rollbackPlan: {
      rollbackAllowed: false,
      rollbackScope: 'blocked_pending_remote_runtime',
      reason: 'No remote runtime was executed in the local E2E chain smoke.',
    },
    metadata: { source: 'internal_beta_local_e2e_chain_smoke' },
  })

  if (!qaCleanupObservability.ok || !qaCleanupObservability.record) {
    return createStepFailureResult({
      createdAt,
      input,
      warnings,
      approvedSnapshot,
      creditReservation,
      jobQueue,
      privateArtifactManifest,
      privateArtifactAccessPolicy,
      remotionPrivatePreviewExportMetadata,
      qaCleanupObservability,
    })
  }

  const chainBasis = {
    approvedPlanSnapshotId: approvedSnapshot.snapshot.id,
    creditReservationId: creditReservation.reservation.id,
    jobBatchId: jobQueue.batch.id,
    primaryJobId: primaryJob.id,
    artifactManifestId: privateArtifactManifest.manifest.id,
    primaryArtifactId: primaryArtifact.id,
    privateArtifactAccessPolicyId: privateArtifactAccessPolicy.record.id,
    remotionRenderRequestId: remotionPrivatePreviewExportMetadata.renderRequest.id,
    qaCleanupRecordId: qaCleanupObservability.record.id,
  }
  const chainHash = sha256Hex(stableStringify(chainBasis))
  const record: InternalBetaLocalE2EChainSmokeRecord = {
    id: `internal_beta_local_e2e_chain_${chainHash.slice(0, 24)}`,
    workspaceId,
    projectId,
    userId,
    ...chainBasis,
    status: 'local_chain_metadata_only',
    createdAt,
    localOnly: true,
    persistedToSupabase: false,
    internalBetaEndToEndReady: false,
    metadata: {
      ...sanitizeJson(input.metadata ?? {}),
      source: 'internal_beta_local_e2e_chain_smoke',
      supabaseCredentialContext: 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
      supabaseRlsStorageValidation: 'not_run_aliases_absent',
      betaUnlock: false,
    },
  }

  const stepResults = {
    approvedSnapshot,
    creditReservation,
    jobQueue,
    privateArtifactManifest,
    privateArtifactAccessPolicy,
    remotionPrivatePreviewExportMetadata,
    qaCleanupObservability,
  }

  return {
    ok: true,
    status: 'local_internal_beta_e2e_chain_metadata_validated_no_remote_runtime',
    createdAt,
    chainHash,
    record,
    steps: {
      approvedSnapshot: true,
      creditReservation: true,
      jobQueue: true,
      privateArtifactManifest: true,
      privateArtifactAccessPolicy: true,
      remotionPrivatePreviewExportMetadata: true,
      qaCleanupObservability: true,
    },
    validation: { ok: true, errors: [], warnings },
    localOnly: true,
    persistedToSupabase: false,
    requiredBeforeInternalBeta: REQUIRED_BEFORE_INTERNAL_BETA,
    safety: SAFETY_FALSE,
    inputs: { workspaceId, projectId, userId },
    stepResults,
  }
}

function createStepFailureResult(args: {
  createdAt: string
  input: InternalBetaLocalE2EChainSmokeInput
  warnings: string[]
  approvedSnapshot?: InternalBetaApprovedSnapshotPersistenceResult
  creditReservation?: InternalBetaCreditReservationLocalRuntimeResult
  jobQueue?: InternalBetaJobQueueLocalRuntimeResult
  privateArtifactManifest?: InternalBetaPrivateArtifactManifestLocalRuntimeResult
  privateArtifactAccessPolicy?: InternalBetaPrivateArtifactAccessPolicyLocalRuntimeResult
  remotionPrivatePreviewExportMetadata?: InternalBetaRemotionPrivatePreviewExportLocalRuntimeResult
  qaCleanupObservability?: InternalBetaQaCleanupObservabilityLocalRuntimeResult
}): InternalBetaLocalE2EChainSmokeResult {
  const errors = [
    ...(args.approvedSnapshot?.validation.errors ?? []),
    ...(args.creditReservation?.validation.errors ?? []),
    ...(args.jobQueue?.validation.errors ?? []),
    ...(args.privateArtifactManifest?.validation.errors ?? []),
    ...(args.privateArtifactAccessPolicy?.validation.errors ?? []),
    ...(args.remotionPrivatePreviewExportMetadata?.validation.errors ?? []),
    ...(args.qaCleanupObservability?.validation.errors ?? []),
  ]
  return createResult({
    createdAt: args.createdAt,
    status: 'blocked_local_e2e_chain_step_failed',
    errors: errors.length > 0 ? errors : ['A local E2E chain step failed without a specific validation error.'],
    warnings: args.warnings,
    input: args.input,
    stepResults: args,
  })
}

function createResult(args: {
  createdAt: string
  status: InternalBetaLocalE2EChainSmokeStatus
  errors: string[]
  warnings: string[]
  input: InternalBetaLocalE2EChainSmokeInput
  stepResults?: Partial<InternalBetaLocalE2EChainSmokeResult['stepResults']>
}): InternalBetaLocalE2EChainSmokeResult {
  return {
    ok: false,
    status: args.status,
    createdAt: args.createdAt,
    steps: {
      approvedSnapshot: args.stepResults?.approvedSnapshot?.ok === true,
      creditReservation: args.stepResults?.creditReservation?.ok === true,
      jobQueue: args.stepResults?.jobQueue?.ok === true,
      privateArtifactManifest: args.stepResults?.privateArtifactManifest?.ok === true,
      privateArtifactAccessPolicy: args.stepResults?.privateArtifactAccessPolicy?.ok === true,
      remotionPrivatePreviewExportMetadata: args.stepResults?.remotionPrivatePreviewExportMetadata?.ok === true,
      qaCleanupObservability: args.stepResults?.qaCleanupObservability?.ok === true,
    },
    validation: { ok: false, errors: args.errors, warnings: args.warnings },
    localOnly: true,
    persistedToSupabase: false,
    requiredBeforeInternalBeta: REQUIRED_BEFORE_INTERNAL_BETA,
    safety: SAFETY_FALSE,
    inputs: {
      workspaceId: args.input.workspaceId,
      projectId: args.input.projectId,
      userId: args.input.userId,
    },
  }
}

function buildApprovedSnapshotPayload(input: InternalBetaLocalE2EChainSmokeInput): ApprovedPlanSnapshotPayload {
  return {
    compiledIntent: { intentId: 'compiled_intent_local_e2e_chain_001', source: 'structured_intent' },
    confirmedSettings: { aspectRatio: '16:9', aspectRatioConfirmed: true, editLevel: 'basic' },
    sourceOrder: [{ mediaAssetId: 'media_asset_local_e2e_chain_001', order: 1 }],
    professionalEditingDirective: { pacing: 'clean', qualityFloor: 'professional_basic' },
    segmentOperations: [{ segmentId: 'segment_local_e2e_001', operationId: 'operation_local_e2e_001', operation: 'trim_cleanly' }],
    visualAssetPlan: { items: [], policy: 'no_generation_without_approval' },
    rendererPlan: { renderer: 'remotion_future_worker', execution: 'not_run' },
    qaPlan: { checks: ['intent_match', 'professional_quality', 'private_artifact_policy'], execution: 'future_worker' },
    providerRouting: { providers: [], realCalls: false },
    modelTierPolicy: { basicProVeoAllowed: false, premiumVeoFinalFallbackOnly: true },
    fallbackPolicy: { requiresUserReviewForMeaningChange: true },
    creditEstimate: { creditEstimateId: input.creditEstimateId ?? '', credits: input.estimatedCredits ?? 0 },
    approvalRecord: { approvedByUserId: input.userId ?? '', approvedAt: input.approvedAt ?? '2026-06-26T00:00:00.000Z' },
  }
}

function findForbiddenInputKeys(value: unknown, path = 'input'): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenInputKeys(item, `${path}[${index}]`))
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nestedValue]) => {
    const nestedPath = `${path}.${key}`
    const current = INTERNAL_BETA_LOCAL_E2E_CHAIN_FORBIDDEN_INPUT_KEYS.some((forbiddenKey) => key.toLowerCase() === forbiddenKey.toLowerCase())
      ? [nestedPath]
      : []
    return [...current, ...findForbiddenInputKeys(nestedValue, nestedPath)]
  })
}

function requireNonEmpty(value: unknown, label: string, errors: string[]) {
  if (typeof value !== 'string' || value.trim().length === 0) errors.push(`${label} is required.`)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
    .join(',')}}`
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
