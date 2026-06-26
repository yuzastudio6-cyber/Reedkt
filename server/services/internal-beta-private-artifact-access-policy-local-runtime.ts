import { createHash } from 'node:crypto'

import { inspectForSecretLikeValues } from '../../src/backend/cloud/cloud-runtime-contracts'
import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaPrivateArtifactAccessPolicyLocalRuntimeStatus =
  | 'local_private_artifact_access_policy_validated_no_storage_read'
  | 'blocked_invalid_private_artifact_access_policy_input'

export type InternalBetaPrivateArtifactAccessMode = 'private_preview_view' | 'private_export_download' | 'qa_report_readback'

export interface InternalBetaPrivateArtifactAccessPolicyLocalRuntimeInput {
  workspaceId?: string
  projectId?: string
  userId?: string
  approvedPlanSnapshotId?: string
  artifactManifestId?: string
  artifactId?: string
  fileName?: string
  sha256?: string
  accessMode?: InternalBetaPrivateArtifactAccessMode
  idempotencyKey?: string
  authorizationContext?: {
    workspaceMember?: boolean
    projectMember?: boolean
    serviceRoleRuntimeApproved?: boolean
    supabaseRlsStorageValidated?: boolean
  }
  metadata?: Record<string, unknown>
}

export interface InternalBetaPrivateArtifactAccessPolicyLocalRecord {
  id: string
  workspaceId: string
  projectId: string
  userId: string
  approvedPlanSnapshotId: string
  artifactManifestId: string
  artifactId: string
  fileName: string
  sha256: string
  accessMode: InternalBetaPrivateArtifactAccessMode
  idempotencyKeyHash: string
  status: 'local_private_artifact_access_policy_metadata_only'
  createdAt: string
  localOnly: true
  persistedToSupabase: false
  membershipPolicySatisfied: boolean
  serviceRoleRuntimeApproved: boolean
  supabaseRlsStorageValidated: boolean
  accessGrantedNow: false
  storageObjectRead: false
  storageObjectCreated: false
  signedUrlCreated: false
  publicArtifactCreated: false
  routeExecution: false
  metadata: Record<string, unknown>
}

export interface InternalBetaPrivateArtifactAccessPolicyLocalSummary {
  accessPolicyId: string
  policyRecorded: true
  policyStatus: 'local_metadata_only_review_recorded'
  membershipPolicySatisfied: boolean
  accessGrantedNow: false
  futureRuntimeBlockedBy: string[]
}

export interface InternalBetaPrivateArtifactAccessPolicyLocalSafety {
  routeExecution: false
  remoteSupabaseMutation: false
  sqlExecution: false
  migrationApply: false
  serviceRoleRouteExecution: false
  serviceRoleSecretPayloadAccess: false
  frontendServiceRoleCredentialExposure: false
  storageObjectCreation: false
  storageObjectRead: false
  storageObjectDelete: false
  signedUrlCreation: false
  publicArtifactCreation: false
  workerExecution: false
  workerDispatch: false
  providerModelCall: false
  rawPromptExecution: false
  remotionExecution: false
  ffmpegExecution: false
  ffprobeExecution: false
  mediaProcessing: false
  privateMediaProcessing: false
  userMediaProcessing: false
  internalBetaUnlock: false
  externalBetaUnlock: false
  productionUnlock: false
}

export interface InternalBetaPrivateArtifactAccessPolicyLocalRuntimeResult {
  ok: boolean
  status: InternalBetaPrivateArtifactAccessPolicyLocalRuntimeStatus
  createdAt: string
  record?: InternalBetaPrivateArtifactAccessPolicyLocalRecord
  recordHash?: string
  summary?: InternalBetaPrivateArtifactAccessPolicyLocalSummary
  validation: {
    ok: boolean
    errors: string[]
    warnings: string[]
  }
  localAccessPolicyRecorded: boolean
  accessGrantedNow: false
  localOnly: true
  persistedToSupabase: false
  requiredBeforePrivateArtifactAccessRuntime: string[]
  safety: InternalBetaPrivateArtifactAccessPolicyLocalSafety
  inputSummary: Record<string, unknown>
}

export const INTERNAL_BETA_PRIVATE_ARTIFACT_ACCESS_POLICY_LOCAL_RUNTIME_RULE =
  'Private artifact access policy local runtime validates membership and artifact metadata without storage read, signed URL creation, route execution, or public artifact creation.'

export const INTERNAL_BETA_PRIVATE_ARTIFACT_ACCESS_POLICY_FORBIDDEN_INPUT_KEYS = [
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
  'secret',
  'token',
]

const REQUIRED_BEFORE_ACCESS_RUNTIME = [
  'approved_supabase_credential_context_present',
  'confirmed_supabase_target_rls_storage_validation',
  'private_storage_bucket_policy_validated',
  'service_role_private_artifact_access_runtime_enablement',
  'workspace_project_membership_readback',
  'negative_no_public_artifact_or_signed_url_without_policy_regression',
]

const SHA256_PATTERN = /^[a-f0-9]{64}$/i

const SAFETY_FALSE: InternalBetaPrivateArtifactAccessPolicyLocalSafety = {
  routeExecution: false,
  remoteSupabaseMutation: false,
  sqlExecution: false,
  migrationApply: false,
  serviceRoleRouteExecution: false,
  serviceRoleSecretPayloadAccess: false,
  frontendServiceRoleCredentialExposure: false,
  storageObjectCreation: false,
  storageObjectRead: false,
  storageObjectDelete: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  workerExecution: false,
  workerDispatch: false,
  providerModelCall: false,
  rawPromptExecution: false,
  remotionExecution: false,
  ffmpegExecution: false,
  ffprobeExecution: false,
  mediaProcessing: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  internalBetaUnlock: false,
  externalBetaUnlock: false,
  productionUnlock: false,
}

export function createInternalBetaPrivateArtifactAccessPolicyLocalRuntime(
  input: InternalBetaPrivateArtifactAccessPolicyLocalRuntimeInput,
): InternalBetaPrivateArtifactAccessPolicyLocalRuntimeResult {
  const createdAt = nowIso()
  const errors: string[] = []
  const warnings: string[] = []

  requireNonEmpty(input.workspaceId, 'workspaceId', errors)
  requireNonEmpty(input.projectId, 'projectId', errors)
  requireNonEmpty(input.userId, 'userId', errors)
  requireNonEmpty(input.approvedPlanSnapshotId, 'approvedPlanSnapshotId', errors)
  requireNonEmpty(input.artifactManifestId, 'artifactManifestId', errors)
  requireNonEmpty(input.artifactId, 'artifactId', errors)
  requireNonEmpty(input.fileName, 'fileName', errors)
  requireNonEmpty(input.sha256, 'sha256', errors)
  requireNonEmpty(input.idempotencyKey, 'idempotencyKey', errors)

  if (input.sha256 && !SHA256_PATTERN.test(input.sha256)) errors.push('sha256 must be a SHA-256 hex checksum.')
  if (input.fileName && /[/\\]/.test(input.fileName)) errors.push('fileName must be a file name only, not a path.')
  if (!['private_preview_view', 'private_export_download', 'qa_report_readback'].includes(String(input.accessMode))) {
    errors.push('accessMode must be private_preview_view, private_export_download, or qa_report_readback.')
  }

  const auth = input.authorizationContext ?? {}
  if (auth.workspaceMember !== true) errors.push('authorizationContext.workspaceMember must be true for local policy validation.')
  if (auth.projectMember !== true) errors.push('authorizationContext.projectMember must be true for local policy validation.')
  if (auth.serviceRoleRuntimeApproved === true) warnings.push('serviceRoleRuntimeApproved is recorded as future runtime context only; no route executes here.')
  if (auth.supabaseRlsStorageValidated === true) warnings.push('supabaseRlsStorageValidated is recorded as future runtime context only; no storage read executes here.')

  const forbiddenInputKeys = findForbiddenInputKeys(input)
  forbiddenInputKeys.forEach((path) => {
    errors.push(`Private artifact access policy input must not contain raw prompt, signed/public URL, media bytes, provider secret, service-role, token, or secret fields: ${path}.`)
  })

  const metadataSecretCheck = inspectForSecretLikeValues(input.metadata ?? {})
  errors.push(...metadataSecretCheck.errors)
  warnings.push(...metadataSecretCheck.warnings)

  if (errors.length > 0) {
    return createResult({
      createdAt,
      status: 'blocked_invalid_private_artifact_access_policy_input',
      errors,
      warnings,
      input,
    })
  }

  const idempotencyKeyHash = sha256Hex(input.idempotencyKey ?? '')
  const basis = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    artifactManifestId: input.artifactManifestId,
    artifactId: input.artifactId,
    fileName: input.fileName,
    sha256: input.sha256?.toLowerCase(),
    accessMode: input.accessMode,
    idempotencyKeyHash,
  }
  const recordHash = sha256Hex(stableStringify(basis))
  const record: InternalBetaPrivateArtifactAccessPolicyLocalRecord = {
    id: `private_artifact_access_policy_${recordHash.slice(0, 24)}`,
    workspaceId: input.workspaceId ?? '',
    projectId: input.projectId ?? '',
    userId: input.userId ?? '',
    approvedPlanSnapshotId: input.approvedPlanSnapshotId ?? '',
    artifactManifestId: input.artifactManifestId ?? '',
    artifactId: input.artifactId ?? '',
    fileName: input.fileName ?? '',
    sha256: input.sha256?.toLowerCase() ?? '',
    accessMode: input.accessMode ?? 'private_preview_view',
    idempotencyKeyHash,
    status: 'local_private_artifact_access_policy_metadata_only',
    createdAt,
    localOnly: true,
    persistedToSupabase: false,
    membershipPolicySatisfied: true,
    serviceRoleRuntimeApproved: Boolean(auth.serviceRoleRuntimeApproved),
    supabaseRlsStorageValidated: Boolean(auth.supabaseRlsStorageValidated),
    accessGrantedNow: false,
    storageObjectRead: false,
    storageObjectCreated: false,
    signedUrlCreated: false,
    publicArtifactCreated: false,
    routeExecution: false,
    metadata: {
      ...sanitizeJson(input.metadata ?? {}),
      localRuntime: true,
      accessPolicyOnly: true,
      privateArtifactAccessEnabled: false,
    },
  }

  return createResult({
    createdAt,
    status: 'local_private_artifact_access_policy_validated_no_storage_read',
    errors,
    warnings,
    input,
    record,
    recordHash,
    summary: {
      accessPolicyId: `private_artifact_access_gate_${recordHash.slice(0, 24)}`,
      policyRecorded: true,
      policyStatus: 'local_metadata_only_review_recorded',
      membershipPolicySatisfied: true,
      accessGrantedNow: false,
      futureRuntimeBlockedBy: [...REQUIRED_BEFORE_ACCESS_RUNTIME],
    },
  })
}

function createResult(input: {
  createdAt: string
  status: InternalBetaPrivateArtifactAccessPolicyLocalRuntimeStatus
  errors: string[]
  warnings: string[]
  input: InternalBetaPrivateArtifactAccessPolicyLocalRuntimeInput
  record?: InternalBetaPrivateArtifactAccessPolicyLocalRecord
  recordHash?: string
  summary?: InternalBetaPrivateArtifactAccessPolicyLocalSummary
}): InternalBetaPrivateArtifactAccessPolicyLocalRuntimeResult {
  const ok = input.status === 'local_private_artifact_access_policy_validated_no_storage_read'

  return {
    ok,
    status: input.status,
    createdAt: input.createdAt,
    record: ok ? input.record : undefined,
    recordHash: ok ? input.recordHash : undefined,
    summary: ok ? input.summary : undefined,
    validation: { ok, errors: input.errors, warnings: input.warnings },
    localAccessPolicyRecorded: ok,
    accessGrantedNow: false,
    localOnly: true,
    persistedToSupabase: false,
    requiredBeforePrivateArtifactAccessRuntime: [...REQUIRED_BEFORE_ACCESS_RUNTIME],
    safety: { ...SAFETY_FALSE },
    inputSummary: summarizeInput(input.input),
  }
}

function summarizeInput(input: InternalBetaPrivateArtifactAccessPolicyLocalRuntimeInput): Record<string, unknown> {
  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    artifactManifestId: input.artifactManifestId,
    artifactId: input.artifactId,
    fileName: input.fileName,
    accessMode: input.accessMode,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    authorizationContext: sanitizeJson(input.authorizationContext ?? {}),
    metadataKeys: input.metadata ? Object.keys(sanitizeJson(input.metadata)).sort() : [],
  }
}

function requireNonEmpty(value: unknown, label: string, errors: string[]) {
  if (typeof value !== 'string' || value.trim().length === 0) errors.push(`${label} is required.`)
}

function findForbiddenInputKeys(value: unknown, path = 'input'): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap((item, index) => findForbiddenInputKeys(item, `${path}[${index}]`))

  const result: string[] = []
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = `${path}.${key}`
    if (
      INTERNAL_BETA_PRIVATE_ARTIFACT_ACCESS_POLICY_FORBIDDEN_INPUT_KEYS.some(
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
