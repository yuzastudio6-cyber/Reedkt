import { createHash } from 'node:crypto'

import { inspectForSecretLikeValues } from '../../src/backend/cloud/cloud-runtime-contracts'
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaPrivateArtifactManifestLocalRuntimeStatus =
  | 'local_private_artifact_manifest_validated_no_storage_access'
  | 'blocked_invalid_private_artifact_manifest_input'

export type InternalBetaPrivateArtifactKind = 'preview' | 'qa_report' | 'manifest' | 'worker_temp' | 'export_candidate'

export type InternalBetaPrivateArtifactQaStatus = 'not_run' | 'qa_pending' | 'qa_passed' | 'qa_failed'

export interface InternalBetaPrivateArtifactManifestItemInput {
  artifactKind?: InternalBetaPrivateArtifactKind
  artifactRole?: string
  fileName?: string
  byteCount?: number
  sha256?: string
  linkedJobId?: string
  linkedSegmentIds?: string[]
  linkedRendererLayerIds?: string[]
  qaStatus?: InternalBetaPrivateArtifactQaStatus
  cleanupPolicy?: 'worker_temp_delete_after_job' | 'retain_with_project_private' | 'qa_short_retention'
  metadata?: Record<string, unknown>
}

export interface InternalBetaPrivateArtifactManifestLocalRuntimeInput {
  workspaceId?: string
  projectId?: string
  approvedPlanSnapshotId?: string
  jobId?: string
  jobBatchId?: string
  creditReservationId?: string
  artifactManifestId?: string
  idempotencyKey?: string
  requestedByUserId?: string
  artifacts?: InternalBetaPrivateArtifactManifestItemInput[]
  metadata?: Record<string, unknown>
}

export interface InternalBetaPrivateArtifactManifestLocalItem {
  id: string
  artifactKind: InternalBetaPrivateArtifactKind
  artifactRole: string
  fileName: string
  byteCount: number
  sha256: string
  linkedJobId?: string
  linkedSegmentIds: string[]
  linkedRendererLayerIds: string[]
  qaStatus: InternalBetaPrivateArtifactQaStatus
  cleanupPolicy: NonNullable<InternalBetaPrivateArtifactManifestItemInput['cleanupPolicy']>
  storageProvider: 'local_metadata_only'
  storageObjectCreated: false
  storageObjectRead: false
  signedUrlCreated: false
  publicArtifactCreated: false
  localOnly: true
  metadata: Record<string, unknown>
}

export interface InternalBetaPrivateArtifactManifestLocalRecord {
  id: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  jobId: string
  jobBatchId?: string
  creditReservationId: string
  idempotencyKeyHash: string
  status: 'local_manifest_metadata_only'
  artifactCount: number
  createdAt: string
  localOnly: true
  persistedToSupabase: false
  storageWrite: false
  storageRead: false
  signedUrlCreation: false
  publicArtifactCreation: false
  artifacts: InternalBetaPrivateArtifactManifestLocalItem[]
  metadata: Record<string, unknown>
}

export interface InternalBetaPrivateArtifactManifestLocalQaSummary {
  qaReportId: string
  qaStatus: 'metadata_only_not_executed'
  qaReportLinked: true
  qaExecution: false
  artifactCount: number
  qaPendingCount: number
  qaPassedCount: number
  qaFailedCount: number
}

export interface InternalBetaPrivateArtifactManifestLocalCleanupSummary {
  cleanupPolicyRecorded: true
  cleanupJobCreated: false
  cleanupExecuted: false
  workerTempArtifacts: number
}

export interface InternalBetaPrivateArtifactManifestLocalRuntimeSafety {
  routeExecution: false
  remoteSupabaseMutation: false
  sqlExecution: false
  serviceRoleRouteExecution: false
  creditMutation: false
  realCreditMutation: false
  jobEnqueueExecution: false
  jobEventWriteExecution: false
  workerLeaseClaim: false
  workerHeartbeat: false
  workerExecution: false
  workerDispatch: false
  providerModelCall: false
  rawPromptExecution: false
  renderExportExecution: false
  previewArtifactCreation: false
  finalExportCreation: false
  storageObjectCreation: false
  storageObjectRead: false
  signedUrlCreation: false
  publicArtifactCreation: false
  privateMediaProcessing: false
  userMediaProcessing: false
  internalBetaUnlock: false
  externalBetaUnlock: false
  productionUnlock: false
}

export interface InternalBetaPrivateArtifactManifestLocalRuntimeResult {
  ok: boolean
  status: InternalBetaPrivateArtifactManifestLocalRuntimeStatus
  createdAt: string
  manifest?: InternalBetaPrivateArtifactManifestLocalRecord
  manifestHash?: string
  qaSummary?: InternalBetaPrivateArtifactManifestLocalQaSummary
  cleanupSummary?: InternalBetaPrivateArtifactManifestLocalCleanupSummary
  validation: {
    ok: boolean
    errors: string[]
    warnings: string[]
  }
  localManifestRecordCreated: boolean
  localArtifactRecordsCreated: number
  localChecksumRecordsCreated: number
  localQaReportLinkCreated: boolean
  localCleanupPolicyRecorded: boolean
  localOnly: true
  persistedToSupabase: false
  requiredBeforeRemoteArtifactRuntime: string[]
  safety: InternalBetaPrivateArtifactManifestLocalRuntimeSafety
  inputSummary: Record<string, unknown>
}

export const INTERNAL_BETA_PRIVATE_ARTIFACT_MANIFEST_LOCAL_RUNTIME_RULE =
  'Private artifact manifest local runtime validates manifest, checksum, QA, and cleanup metadata without storage access or signed URL creation.'

export const INTERNAL_BETA_PRIVATE_ARTIFACT_FORBIDDEN_INPUT_KEYS = [
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
]

const REQUIRED_REMOTE_ARTIFACT_GATES = [
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'private_storage_bucket_policy_validated',
  'service_role_artifact_manifest_runtime_enablement',
  'workspace_project_membership_readback',
  'checksum_manifest_storage_transaction_contract',
  'negative_no_public_artifact_or_signed_url_without_policy_regression',
  'cleanup_retention_runtime_policy',
]

const SHA256_PATTERN = /^[a-f0-9]{64}$/i

const SAFETY_FALSE: InternalBetaPrivateArtifactManifestLocalRuntimeSafety = {
  routeExecution: false,
  remoteSupabaseMutation: false,
  sqlExecution: false,
  serviceRoleRouteExecution: false,
  creditMutation: false,
  realCreditMutation: false,
  jobEnqueueExecution: false,
  jobEventWriteExecution: false,
  workerLeaseClaim: false,
  workerHeartbeat: false,
  workerExecution: false,
  workerDispatch: false,
  providerModelCall: false,
  rawPromptExecution: false,
  renderExportExecution: false,
  previewArtifactCreation: false,
  finalExportCreation: false,
  storageObjectCreation: false,
  storageObjectRead: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  internalBetaUnlock: false,
  externalBetaUnlock: false,
  productionUnlock: false,
}

export function createInternalBetaPrivateArtifactManifestLocalRuntime(
  input: InternalBetaPrivateArtifactManifestLocalRuntimeInput,
): InternalBetaPrivateArtifactManifestLocalRuntimeResult {
  const createdAt = nowIso()
  const errors: string[] = []
  const warnings: string[] = []

  requireNonEmpty(input.workspaceId, 'workspaceId', errors)
  requireNonEmpty(input.projectId, 'projectId', errors)
  requireNonEmpty(input.approvedPlanSnapshotId, 'approvedPlanSnapshotId', errors)
  requireNonEmpty(input.jobId, 'jobId', errors)
  requireNonEmpty(input.creditReservationId, 'creditReservationId', errors)
  requireNonEmpty(input.idempotencyKey, 'idempotencyKey', errors)

  if (!Array.isArray(input.artifacts) || input.artifacts.length === 0) {
    errors.push('artifacts must include at least one local private artifact metadata item.')
  } else if (input.artifacts.length > 50) {
    errors.push('artifacts must not exceed 50 local metadata records in one manifest.')
  }

  for (const [index, artifact] of (input.artifacts ?? []).entries()) {
    requireNonEmpty(artifact.artifactKind, `artifacts[${index}].artifactKind`, errors)
    requireNonEmpty(artifact.artifactRole, `artifacts[${index}].artifactRole`, errors)
    requireNonEmpty(artifact.fileName, `artifacts[${index}].fileName`, errors)
    requireNonEmpty(artifact.sha256, `artifacts[${index}].sha256`, errors)
    if (artifact.sha256 && !SHA256_PATTERN.test(artifact.sha256)) {
      errors.push(`artifacts[${index}].sha256 must be a SHA-256 hex checksum.`)
    }
    if (typeof artifact.byteCount !== 'number' || !Number.isInteger(artifact.byteCount) || artifact.byteCount < 0) {
      errors.push(`artifacts[${index}].byteCount must be a non-negative integer.`)
    }
    if (artifact.fileName && /[/\\]/.test(artifact.fileName)) {
      errors.push(`artifacts[${index}].fileName must be a file name only, not a path.`)
    }
  }

  const forbiddenInputKeys = findForbiddenInputKeys({
    metadata: input.metadata ?? {},
    artifacts: input.artifacts ?? [],
  })
  forbiddenInputKeys.forEach((path) => {
    errors.push(`Private artifact manifest input must not contain raw prompt, signed/public URL, media bytes, provider secret, or service-role fields: ${path}.`)
  })

  const metadataSecretCheck = inspectForSecretLikeValues(input.metadata ?? {})
  errors.push(...metadataSecretCheck.errors)
  warnings.push(...metadataSecretCheck.warnings)

  if (errors.length > 0 || !input.artifacts) {
    return createResult({
      createdAt,
      status: 'blocked_invalid_private_artifact_manifest_input',
      errors,
      warnings,
      input,
    })
  }

  const idempotencyKeyHash = sha256Hex(input.idempotencyKey ?? '')
  const manifestBasis = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    jobId: input.jobId,
    jobBatchId: input.jobBatchId,
    creditReservationId: input.creditReservationId,
    idempotencyKeyHash,
    artifacts: input.artifacts.map((artifact) => ({
      artifactKind: artifact.artifactKind,
      artifactRole: artifact.artifactRole,
      fileName: artifact.fileName,
      byteCount: artifact.byteCount,
      sha256: artifact.sha256?.toLowerCase(),
      linkedJobId: artifact.linkedJobId,
      linkedSegmentIds: artifact.linkedSegmentIds ?? [],
      linkedRendererLayerIds: artifact.linkedRendererLayerIds ?? [],
      qaStatus: artifact.qaStatus ?? 'qa_pending',
      cleanupPolicy: artifact.cleanupPolicy ?? 'retain_with_project_private',
    })),
  }
  const manifestHash = sha256Hex(stableStringify(manifestBasis))
  const manifestId = input.artifactManifestId ?? `artifact_manifest_${manifestHash.slice(0, 24)}`
  const artifacts = input.artifacts.map((artifact, index): InternalBetaPrivateArtifactManifestLocalItem => ({
    id: `artifact_${manifestHash.slice(0, 18)}_${String(index + 1).padStart(2, '0')}`,
    artifactKind: artifact.artifactKind ?? 'manifest',
    artifactRole: artifact.artifactRole ?? '',
    fileName: artifact.fileName ?? '',
    byteCount: artifact.byteCount ?? 0,
    sha256: artifact.sha256?.toLowerCase() ?? '',
    linkedJobId: artifact.linkedJobId,
    linkedSegmentIds: artifact.linkedSegmentIds ?? [],
    linkedRendererLayerIds: artifact.linkedRendererLayerIds ?? [],
    qaStatus: artifact.qaStatus ?? 'qa_pending',
    cleanupPolicy: artifact.cleanupPolicy ?? 'retain_with_project_private',
    storageProvider: 'local_metadata_only',
    storageObjectCreated: false,
    storageObjectRead: false,
    signedUrlCreated: false,
    publicArtifactCreated: false,
    localOnly: true,
    metadata: {
      ...sanitizeJson(artifact.metadata ?? {}),
      localRuntime: true,
      privateArtifactMetadataOnly: true,
    },
  }))

  const manifest: InternalBetaPrivateArtifactManifestLocalRecord = {
    id: manifestId,
    workspaceId: input.workspaceId ?? '',
    projectId: input.projectId ?? '',
    approvedPlanSnapshotId: input.approvedPlanSnapshotId ?? '',
    jobId: input.jobId ?? '',
    jobBatchId: input.jobBatchId,
    creditReservationId: input.creditReservationId ?? '',
    idempotencyKeyHash,
    status: 'local_manifest_metadata_only',
    artifactCount: artifacts.length,
    createdAt,
    localOnly: true,
    persistedToSupabase: false,
    storageWrite: false,
    storageRead: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    artifacts,
    metadata: {
      ...sanitizeJson(input.metadata ?? {}),
      localRuntime: true,
      persistenceMode: 'local_validation_only_no_storage_or_supabase_write',
      privateArtifactAccessEnabled: false,
    },
  }

  const qaSummary = buildQaSummary(manifest)
  const cleanupSummary = buildCleanupSummary(manifest)

  return createResult({
    createdAt,
    status: 'local_private_artifact_manifest_validated_no_storage_access',
    errors,
    warnings,
    input,
    manifest,
    manifestHash,
    qaSummary,
    cleanupSummary,
  })
}

function createResult(input: {
  createdAt: string
  status: InternalBetaPrivateArtifactManifestLocalRuntimeStatus
  errors: string[]
  warnings: string[]
  input: InternalBetaPrivateArtifactManifestLocalRuntimeInput
  manifest?: InternalBetaPrivateArtifactManifestLocalRecord
  manifestHash?: string
  qaSummary?: InternalBetaPrivateArtifactManifestLocalQaSummary
  cleanupSummary?: InternalBetaPrivateArtifactManifestLocalCleanupSummary
}): InternalBetaPrivateArtifactManifestLocalRuntimeResult {
  const ok = input.status === 'local_private_artifact_manifest_validated_no_storage_access'

  return {
    ok,
    status: input.status,
    createdAt: input.createdAt,
    manifest: ok ? input.manifest : undefined,
    manifestHash: ok ? input.manifestHash : undefined,
    qaSummary: ok ? input.qaSummary : undefined,
    cleanupSummary: ok ? input.cleanupSummary : undefined,
    validation: { ok, errors: input.errors, warnings: input.warnings },
    localManifestRecordCreated: ok,
    localArtifactRecordsCreated: ok ? input.manifest?.artifactCount ?? 0 : 0,
    localChecksumRecordsCreated: ok ? input.manifest?.artifactCount ?? 0 : 0,
    localQaReportLinkCreated: ok,
    localCleanupPolicyRecorded: ok,
    localOnly: true,
    persistedToSupabase: false,
    requiredBeforeRemoteArtifactRuntime: [...REQUIRED_REMOTE_ARTIFACT_GATES],
    safety: { ...SAFETY_FALSE },
    inputSummary: summarizeInput(input.input),
  }
}

function buildQaSummary(manifest: InternalBetaPrivateArtifactManifestLocalRecord): InternalBetaPrivateArtifactManifestLocalQaSummary {
  return {
    qaReportId: `qa_report_${manifest.id.replace(/^artifact_manifest_/, '')}`,
    qaStatus: 'metadata_only_not_executed',
    qaReportLinked: true,
    qaExecution: false,
    artifactCount: manifest.artifactCount,
    qaPendingCount: manifest.artifacts.filter((artifact) => artifact.qaStatus === 'qa_pending').length,
    qaPassedCount: manifest.artifacts.filter((artifact) => artifact.qaStatus === 'qa_passed').length,
    qaFailedCount: manifest.artifacts.filter((artifact) => artifact.qaStatus === 'qa_failed').length,
  }
}

function buildCleanupSummary(
  manifest: InternalBetaPrivateArtifactManifestLocalRecord,
): InternalBetaPrivateArtifactManifestLocalCleanupSummary {
  return {
    cleanupPolicyRecorded: true,
    cleanupJobCreated: false,
    cleanupExecuted: false,
    workerTempArtifacts: manifest.artifacts.filter((artifact) => artifact.cleanupPolicy === 'worker_temp_delete_after_job').length,
  }
}

function summarizeInput(input: InternalBetaPrivateArtifactManifestLocalRuntimeInput): Record<string, unknown> {
  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    jobId: input.jobId,
    jobBatchId: input.jobBatchId,
    creditReservationId: input.creditReservationId,
    artifactManifestId: input.artifactManifestId,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    requestedByUserId: input.requestedByUserId,
    artifactCount: input.artifacts?.length ?? 0,
    metadataKeys: input.metadata ? Object.keys(sanitizeJson(input.metadata)).sort() : [],
  }
}

function requireNonEmpty(value: unknown, label: string, errors: string[]) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${label} is required.`)
  }
}

function findForbiddenInputKeys(value: unknown, path = 'input'): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap((item, index) => findForbiddenInputKeys(item, `${path}[${index}]`))

  const result: string[] = []
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = `${path}.${key}`
    if (INTERNAL_BETA_PRIVATE_ARTIFACT_FORBIDDEN_INPUT_KEYS.some((forbidden) => forbidden.toLowerCase() === key.toLowerCase())) {
      result.push(nextPath)
    }
    result.push(...findForbiddenInputKeys(nested, nextPath))
  }
  return result
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
