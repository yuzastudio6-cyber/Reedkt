import { createHash } from 'node:crypto'

import { inspectForSecretLikeValues } from '../../src/backend/cloud/cloud-runtime-contracts'
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaRemotionPrivatePreviewExportLocalRuntimeStatus =
  | 'local_remotion_private_preview_export_metadata_validated_no_render_execution'
  | 'blocked_invalid_remotion_private_preview_export_input'

export type InternalBetaRemotionPrivateOutputKind = 'private_preview' | 'private_export_candidate' | 'render_manifest' | 'qa_report'

export type InternalBetaRemotionPrivateRenderMode =
  | 'preview_only'
  | 'export_candidate_only'
  | 'preview_and_export_candidate'

export interface InternalBetaRemotionPrivateOutputExpectationInput {
  outputKind?: InternalBetaRemotionPrivateOutputKind
  fileName?: string
  byteCount?: number
  sha256?: string
  linkedArtifactId?: string
  linkedRendererLayerIds?: string[]
  qaStatus?: 'not_run' | 'qa_pending' | 'qa_passed' | 'qa_failed'
  cleanupPolicy?: 'worker_temp_delete_after_job' | 'retain_with_project_private' | 'qa_short_retention'
  metadata?: Record<string, unknown>
}

export interface InternalBetaRemotionPrivatePreviewExportLocalRuntimeInput {
  workspaceId?: string
  projectId?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  jobId?: string
  artifactManifestId?: string
  rendererPlanId?: string
  idempotencyKey?: string
  renderMode?: InternalBetaRemotionPrivateRenderMode
  outputFrame?: {
    width?: number
    height?: number
    fps?: number
    durationFrames?: number
  }
  expectedOutputs?: InternalBetaRemotionPrivateOutputExpectationInput[]
  metadata?: Record<string, unknown>
}

export interface InternalBetaRemotionPrivateOutputExpectationRecord {
  id: string
  outputKind: InternalBetaRemotionPrivateOutputKind
  fileName: string
  byteCount: number
  sha256: string
  linkedArtifactId?: string
  linkedRendererLayerIds: string[]
  qaStatus: 'not_run' | 'qa_pending' | 'qa_passed' | 'qa_failed'
  cleanupPolicy: NonNullable<InternalBetaRemotionPrivateOutputExpectationInput['cleanupPolicy']>
  storageProvider: 'local_metadata_only'
  previewArtifactCreated: false
  finalExportCreated: false
  storageObjectCreated: false
  storageObjectRead: false
  signedUrlCreated: false
  publicArtifactCreated: false
  localOnly: true
  metadata: Record<string, unknown>
}

export interface InternalBetaRemotionPrivatePreviewExportLocalRecord {
  id: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  jobId: string
  artifactManifestId: string
  rendererPlanId: string
  idempotencyKeyHash: string
  renderMode: InternalBetaRemotionPrivateRenderMode
  outputFrame: {
    width: number
    height: number
    fps: number
    durationFrames: number
  }
  status: 'local_remotion_render_metadata_only'
  createdAt: string
  localOnly: true
  persistedToSupabase: false
  workerDispatch: false
  workerExecution: false
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
  outputExpectations: InternalBetaRemotionPrivateOutputExpectationRecord[]
  metadata: Record<string, unknown>
}

export interface InternalBetaRemotionPrivatePreviewExportLocalQaSummary {
  qaGateId: string
  qaStatus: 'metadata_only_not_executed'
  qaGateRecorded: true
  qaExecution: false
  outputCount: number
  qaPendingCount: number
  qaPassedCount: number
  qaFailedCount: number
}

export interface InternalBetaRemotionPrivatePreviewExportLocalCleanupSummary {
  cleanupPolicyRecorded: true
  cleanupJobCreated: false
  cleanupExecuted: false
  workerTempOutputExpectations: number
}

export interface InternalBetaRemotionPrivatePreviewExportLocalSafety {
  routeExecution: false
  remoteSupabaseMutation: false
  sqlExecution: false
  migrationApply: false
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
  remotionExecution: false
  ffmpegExecution: false
  ffprobeExecution: false
  mediaProcessing: false
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

export interface InternalBetaRemotionPrivatePreviewExportLocalRuntimeResult {
  ok: boolean
  status: InternalBetaRemotionPrivatePreviewExportLocalRuntimeStatus
  createdAt: string
  renderRequest?: InternalBetaRemotionPrivatePreviewExportLocalRecord
  renderRequestHash?: string
  qaSummary?: InternalBetaRemotionPrivatePreviewExportLocalQaSummary
  cleanupSummary?: InternalBetaRemotionPrivatePreviewExportLocalCleanupSummary
  validation: {
    ok: boolean
    errors: string[]
    warnings: string[]
  }
  localRenderRequestRecordCreated: boolean
  localPreviewExpectationRecordsCreated: number
  localExportExpectationRecordsCreated: number
  localOutputChecksumRecordsValidated: number
  localQaGateRecorded: boolean
  localCleanupPolicyRecorded: boolean
  localOnly: true
  persistedToSupabase: false
  requiredBeforeRenderExecution: string[]
  safety: InternalBetaRemotionPrivatePreviewExportLocalSafety
  inputSummary: Record<string, unknown>
}

export const INTERNAL_BETA_REMOTION_PRIVATE_PREVIEW_EXPORT_LOCAL_RUNTIME_RULE =
  'Remotion private preview/export local runtime validates render metadata and private output expectations without executing Remotion or creating artifacts.'

export const INTERNAL_BETA_REMOTION_PRIVATE_PREVIEW_EXPORT_FORBIDDEN_INPUT_KEYS = [
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
]

const REQUIRED_RENDER_EXECUTION_GATES = [
  'explicit_remotion_private_preview_export_execution_confirmation',
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'private_storage_bucket_policy_validated',
  'service_role_render_worker_runtime_enablement',
  'transactional_job_lease_event_runtime',
  'private_artifact_storage_runtime',
  'negative_no_render_from_raw_chat_regression',
  'negative_no_public_artifact_or_signed_url_without_policy_regression',
  'qa_cleanup_observability_rollback_gates',
]

const SHA256_PATTERN = /^[a-f0-9]{64}$/i

const SAFETY_FALSE: InternalBetaRemotionPrivatePreviewExportLocalSafety = {
  routeExecution: false,
  remoteSupabaseMutation: false,
  sqlExecution: false,
  migrationApply: false,
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
  remotionExecution: false,
  ffmpegExecution: false,
  ffprobeExecution: false,
  mediaProcessing: false,
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

export function createInternalBetaRemotionPrivatePreviewExportLocalRuntime(
  input: InternalBetaRemotionPrivatePreviewExportLocalRuntimeInput,
): InternalBetaRemotionPrivatePreviewExportLocalRuntimeResult {
  const createdAt = nowIso()
  const errors: string[] = []
  const warnings: string[] = []

  requireNonEmpty(input.workspaceId, 'workspaceId', errors)
  requireNonEmpty(input.projectId, 'projectId', errors)
  requireNonEmpty(input.approvedPlanSnapshotId, 'approvedPlanSnapshotId', errors)
  requireNonEmpty(input.creditReservationId, 'creditReservationId', errors)
  requireNonEmpty(input.jobId, 'jobId', errors)
  requireNonEmpty(input.artifactManifestId, 'artifactManifestId', errors)
  requireNonEmpty(input.rendererPlanId, 'rendererPlanId', errors)
  requireNonEmpty(input.idempotencyKey, 'idempotencyKey', errors)

  const renderMode = input.renderMode ?? 'preview_and_export_candidate'
  if (!['preview_only', 'export_candidate_only', 'preview_and_export_candidate'].includes(renderMode)) {
    errors.push('renderMode must be preview_only, export_candidate_only, or preview_and_export_candidate.')
  }

  validatePositiveInteger(input.outputFrame?.width, 'outputFrame.width', errors)
  validatePositiveInteger(input.outputFrame?.height, 'outputFrame.height', errors)
  validatePositiveInteger(input.outputFrame?.fps, 'outputFrame.fps', errors)
  validatePositiveInteger(input.outputFrame?.durationFrames, 'outputFrame.durationFrames', errors)

  if (!Array.isArray(input.expectedOutputs) || input.expectedOutputs.length === 0) {
    errors.push('expectedOutputs must include at least one private preview/export output expectation.')
  } else if (input.expectedOutputs.length > 20) {
    errors.push('expectedOutputs must not exceed 20 local metadata records in one render request.')
  }

  for (const [index, output] of (input.expectedOutputs ?? []).entries()) {
    requireNonEmpty(output.outputKind, `expectedOutputs[${index}].outputKind`, errors)
    requireNonEmpty(output.fileName, `expectedOutputs[${index}].fileName`, errors)
    requireNonEmpty(output.sha256, `expectedOutputs[${index}].sha256`, errors)
    if (output.sha256 && !SHA256_PATTERN.test(output.sha256)) {
      errors.push(`expectedOutputs[${index}].sha256 must be a SHA-256 hex checksum.`)
    }
    if (typeof output.byteCount !== 'number' || !Number.isInteger(output.byteCount) || output.byteCount < 0) {
      errors.push(`expectedOutputs[${index}].byteCount must be a non-negative integer.`)
    }
    if (output.fileName && /[/\\]/.test(output.fileName)) {
      errors.push(`expectedOutputs[${index}].fileName must be a file name only, not a path.`)
    }
  }

  const forbiddenInputKeys = findForbiddenInputKeys({
    metadata: input.metadata ?? {},
    expectedOutputs: input.expectedOutputs ?? [],
  })
  forbiddenInputKeys.forEach((path) => {
    errors.push(`Remotion private preview/export input must not contain raw prompt, signed/public URL, media bytes, rendered bytes, provider secret, or service-role fields: ${path}.`)
  })

  const metadataSecretCheck = inspectForSecretLikeValues(input.metadata ?? {})
  errors.push(...metadataSecretCheck.errors)
  warnings.push(...metadataSecretCheck.warnings)

  if (errors.length > 0 || !input.expectedOutputs) {
    return createResult({
      createdAt,
      status: 'blocked_invalid_remotion_private_preview_export_input',
      errors,
      warnings,
      input,
    })
  }

  const idempotencyKeyHash = sha256Hex(input.idempotencyKey ?? '')
  const renderRequestBasis = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    jobId: input.jobId,
    artifactManifestId: input.artifactManifestId,
    rendererPlanId: input.rendererPlanId,
    idempotencyKeyHash,
    renderMode,
    outputFrame: input.outputFrame,
    expectedOutputs: input.expectedOutputs.map((output) => ({
      outputKind: output.outputKind,
      fileName: output.fileName,
      byteCount: output.byteCount,
      sha256: output.sha256?.toLowerCase(),
      linkedArtifactId: output.linkedArtifactId,
      linkedRendererLayerIds: output.linkedRendererLayerIds ?? [],
      qaStatus: output.qaStatus ?? 'qa_pending',
      cleanupPolicy: output.cleanupPolicy ?? 'retain_with_project_private',
    })),
  }
  const renderRequestHash = sha256Hex(stableStringify(renderRequestBasis))
  const renderRequestId = `remotion_private_render_request_${renderRequestHash.slice(0, 24)}`
  const outputExpectations = input.expectedOutputs.map(
    (output, index): InternalBetaRemotionPrivateOutputExpectationRecord => ({
      id: `remotion_private_output_${renderRequestHash.slice(0, 18)}_${String(index + 1).padStart(2, '0')}`,
      outputKind: output.outputKind ?? 'render_manifest',
      fileName: output.fileName ?? '',
      byteCount: output.byteCount ?? 0,
      sha256: output.sha256?.toLowerCase() ?? '',
      linkedArtifactId: output.linkedArtifactId,
      linkedRendererLayerIds: output.linkedRendererLayerIds ?? [],
      qaStatus: output.qaStatus ?? 'qa_pending',
      cleanupPolicy: output.cleanupPolicy ?? 'retain_with_project_private',
      storageProvider: 'local_metadata_only',
      previewArtifactCreated: false,
      finalExportCreated: false,
      storageObjectCreated: false,
      storageObjectRead: false,
      signedUrlCreated: false,
      publicArtifactCreated: false,
      localOnly: true,
      metadata: {
        ...sanitizeJson(output.metadata ?? {}),
        localRuntime: true,
        remotionExecution: false,
        privateOutputExpectationOnly: true,
      },
    }),
  )

  const renderRequest: InternalBetaRemotionPrivatePreviewExportLocalRecord = {
    id: renderRequestId,
    workspaceId: input.workspaceId ?? '',
    projectId: input.projectId ?? '',
    approvedPlanSnapshotId: input.approvedPlanSnapshotId ?? '',
    creditReservationId: input.creditReservationId ?? '',
    jobId: input.jobId ?? '',
    artifactManifestId: input.artifactManifestId ?? '',
    rendererPlanId: input.rendererPlanId ?? '',
    idempotencyKeyHash,
    renderMode,
    outputFrame: {
      width: input.outputFrame?.width ?? 0,
      height: input.outputFrame?.height ?? 0,
      fps: input.outputFrame?.fps ?? 0,
      durationFrames: input.outputFrame?.durationFrames ?? 0,
    },
    status: 'local_remotion_render_metadata_only',
    createdAt,
    localOnly: true,
    persistedToSupabase: false,
    workerDispatch: false,
    workerExecution: false,
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
    outputExpectations,
    metadata: {
      ...sanitizeJson(input.metadata ?? {}),
      localRuntime: true,
      persistenceMode: 'local_validation_only_no_render_or_storage_write',
      privatePreviewExportEnabled: false,
    },
  }

  const qaSummary = buildQaSummary(renderRequest)
  const cleanupSummary = buildCleanupSummary(renderRequest)

  return createResult({
    createdAt,
    status: 'local_remotion_private_preview_export_metadata_validated_no_render_execution',
    errors,
    warnings,
    input,
    renderRequest,
    renderRequestHash,
    qaSummary,
    cleanupSummary,
  })
}

function createResult(input: {
  createdAt: string
  status: InternalBetaRemotionPrivatePreviewExportLocalRuntimeStatus
  errors: string[]
  warnings: string[]
  input: InternalBetaRemotionPrivatePreviewExportLocalRuntimeInput
  renderRequest?: InternalBetaRemotionPrivatePreviewExportLocalRecord
  renderRequestHash?: string
  qaSummary?: InternalBetaRemotionPrivatePreviewExportLocalQaSummary
  cleanupSummary?: InternalBetaRemotionPrivatePreviewExportLocalCleanupSummary
}): InternalBetaRemotionPrivatePreviewExportLocalRuntimeResult {
  const ok = input.status === 'local_remotion_private_preview_export_metadata_validated_no_render_execution'
  const expectations = ok ? input.renderRequest?.outputExpectations ?? [] : []

  return {
    ok,
    status: input.status,
    createdAt: input.createdAt,
    renderRequest: ok ? input.renderRequest : undefined,
    renderRequestHash: ok ? input.renderRequestHash : undefined,
    qaSummary: ok ? input.qaSummary : undefined,
    cleanupSummary: ok ? input.cleanupSummary : undefined,
    validation: { ok, errors: input.errors, warnings: input.warnings },
    localRenderRequestRecordCreated: ok,
    localPreviewExpectationRecordsCreated: expectations.filter((item) => item.outputKind === 'private_preview').length,
    localExportExpectationRecordsCreated: expectations.filter((item) => item.outputKind === 'private_export_candidate').length,
    localOutputChecksumRecordsValidated: expectations.length,
    localQaGateRecorded: ok,
    localCleanupPolicyRecorded: ok,
    localOnly: true,
    persistedToSupabase: false,
    requiredBeforeRenderExecution: [...REQUIRED_RENDER_EXECUTION_GATES],
    safety: { ...SAFETY_FALSE },
    inputSummary: summarizeInput(input.input),
  }
}

function buildQaSummary(
  renderRequest: InternalBetaRemotionPrivatePreviewExportLocalRecord,
): InternalBetaRemotionPrivatePreviewExportLocalQaSummary {
  return {
    qaGateId: `remotion_qa_gate_${renderRequest.id.replace(/^remotion_private_render_request_/, '')}`,
    qaStatus: 'metadata_only_not_executed',
    qaGateRecorded: true,
    qaExecution: false,
    outputCount: renderRequest.outputExpectations.length,
    qaPendingCount: renderRequest.outputExpectations.filter((output) => output.qaStatus === 'qa_pending').length,
    qaPassedCount: renderRequest.outputExpectations.filter((output) => output.qaStatus === 'qa_passed').length,
    qaFailedCount: renderRequest.outputExpectations.filter((output) => output.qaStatus === 'qa_failed').length,
  }
}

function buildCleanupSummary(
  renderRequest: InternalBetaRemotionPrivatePreviewExportLocalRecord,
): InternalBetaRemotionPrivatePreviewExportLocalCleanupSummary {
  return {
    cleanupPolicyRecorded: true,
    cleanupJobCreated: false,
    cleanupExecuted: false,
    workerTempOutputExpectations: renderRequest.outputExpectations.filter(
      (output) => output.cleanupPolicy === 'worker_temp_delete_after_job',
    ).length,
  }
}

function summarizeInput(input: InternalBetaRemotionPrivatePreviewExportLocalRuntimeInput): Record<string, unknown> {
  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    jobId: input.jobId,
    artifactManifestId: input.artifactManifestId,
    rendererPlanId: input.rendererPlanId,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    renderMode: input.renderMode,
    outputFrame: sanitizeJson(input.outputFrame ?? {}),
    expectedOutputCount: input.expectedOutputs?.length ?? 0,
    metadataKeys: input.metadata ? Object.keys(sanitizeJson(input.metadata)).sort() : [],
  }
}

function requireNonEmpty(value: unknown, label: string, errors: string[]) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${label} is required.`)
  }
}

function validatePositiveInteger(value: unknown, label: string, errors: string[]) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    errors.push(`${label} must be a positive integer.`)
  }
}

function findForbiddenInputKeys(value: unknown, path = 'input'): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap((item, index) => findForbiddenInputKeys(item, `${path}[${index}]`))

  const result: string[] = []
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = `${path}.${key}`
    if (
      INTERNAL_BETA_REMOTION_PRIVATE_PREVIEW_EXPORT_FORBIDDEN_INPUT_KEYS.some(
        (forbidden) => forbidden.toLowerCase() === key.toLowerCase(),
      )
    ) {
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
