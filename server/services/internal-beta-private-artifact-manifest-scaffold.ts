import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaPrivateArtifactManifestOperation =
  | 'artifact_manifest_write'
  | 'artifact_manifest_read'
  | 'artifact_checksum_record'
  | 'artifact_qa_report_link'
  | 'artifact_cleanup_policy_record'
  | 'private_artifact_access_prepare'
  | 'private_artifact_access_readback'
  | 'artifact_retention_mark'

export type InternalBetaPrivateArtifactManifestStatus = 'disabled_pending_private_artifact_manifest_runtime_gate'

export interface InternalBetaPrivateArtifactManifestScaffoldDefinition {
  operation: InternalBetaPrivateArtifactManifestOperation
  scaffoldFunctionName: string
  approvedPlanRequired: boolean
  jobIdRequired: boolean
  artifactManifestRequired: boolean
  qaReportRequired: boolean
  checksumRequired: boolean
  membershipCheckRequired: boolean
  idempotencyKeyRequired: boolean
  routeExecutionEnabled: false
  workerExecutionEnabled: false
  storageWriteEnabled: false
  signedUrlCreationEnabled: false
  publicArtifactCreationEnabled: false
  supabaseMutationEnabled: false
}

export interface InternalBetaPrivateArtifactManifestInput {
  workspaceId?: string
  projectId?: string
  userId?: string
  requestId?: string
  approvedPlanSnapshotId?: string
  jobId?: string
  artifactManifestId?: string
  artifactId?: string
  qaReportId?: string
  checksumSha256?: string
  storageBucket?: string
  storagePath?: string
  retentionPolicyId?: string
  idempotencyKey?: string
  reason?: string
  payload?: Record<string, unknown>
}

export interface InternalBetaPrivateArtifactManifestScaffoldResult {
  ok: false
  status: InternalBetaPrivateArtifactManifestStatus
  operation: InternalBetaPrivateArtifactManifestOperation
  scaffoldFunctionName: string
  createdAt: string
  httpStatusCode: 202
  approvedPlanRequired: boolean
  jobIdRequired: boolean
  artifactManifestRequired: boolean
  qaReportRequired: boolean
  checksumRequired: boolean
  membershipCheckRequired: boolean
  idempotencyKeyRequired: boolean
  routeExecution: false
  workerExecution: false
  storageWrite: false
  storageRead: false
  signedUrlCreation: false
  publicArtifactCreation: false
  supabaseMutation: false
  providerModelCalls: false
  renderExportExecution: false
  internalBetaUnlock: false
  requiredBeforeEnablement: string[]
  inputSummary: Record<string, unknown>
  warnings: string[]
}

export const INTERNAL_BETA_PRIVATE_ARTIFACT_MANIFEST_SCAFFOLDS: InternalBetaPrivateArtifactManifestScaffoldDefinition[] = [
  {
    operation: 'artifact_manifest_write',
    scaffoldFunctionName: 'writeInternalBetaPrivateArtifactManifestScaffold',
    approvedPlanRequired: true,
    jobIdRequired: true,
    artifactManifestRequired: false,
    qaReportRequired: false,
    checksumRequired: true,
    membershipCheckRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'artifact_manifest_read',
    scaffoldFunctionName: 'readInternalBetaPrivateArtifactManifestScaffold',
    approvedPlanRequired: false,
    jobIdRequired: false,
    artifactManifestRequired: true,
    qaReportRequired: false,
    checksumRequired: false,
    membershipCheckRequired: true,
    idempotencyKeyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'artifact_checksum_record',
    scaffoldFunctionName: 'recordInternalBetaPrivateArtifactChecksumScaffold',
    approvedPlanRequired: true,
    jobIdRequired: true,
    artifactManifestRequired: true,
    qaReportRequired: false,
    checksumRequired: true,
    membershipCheckRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'artifact_qa_report_link',
    scaffoldFunctionName: 'linkInternalBetaPrivateArtifactQaReportScaffold',
    approvedPlanRequired: true,
    jobIdRequired: true,
    artifactManifestRequired: true,
    qaReportRequired: true,
    checksumRequired: false,
    membershipCheckRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'artifact_cleanup_policy_record',
    scaffoldFunctionName: 'recordInternalBetaPrivateArtifactCleanupPolicyScaffold',
    approvedPlanRequired: true,
    jobIdRequired: true,
    artifactManifestRequired: true,
    qaReportRequired: false,
    checksumRequired: false,
    membershipCheckRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'private_artifact_access_prepare',
    scaffoldFunctionName: 'prepareInternalBetaPrivateArtifactAccessScaffold',
    approvedPlanRequired: false,
    jobIdRequired: false,
    artifactManifestRequired: true,
    qaReportRequired: false,
    checksumRequired: true,
    membershipCheckRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'private_artifact_access_readback',
    scaffoldFunctionName: 'readInternalBetaPrivateArtifactAccessScaffold',
    approvedPlanRequired: false,
    jobIdRequired: false,
    artifactManifestRequired: true,
    qaReportRequired: false,
    checksumRequired: false,
    membershipCheckRequired: true,
    idempotencyKeyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'artifact_retention_mark',
    scaffoldFunctionName: 'markInternalBetaPrivateArtifactRetentionScaffold',
    approvedPlanRequired: true,
    jobIdRequired: true,
    artifactManifestRequired: true,
    qaReportRequired: false,
    checksumRequired: false,
    membershipCheckRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
]

export function getInternalBetaPrivateArtifactManifestScaffold(
  operation: InternalBetaPrivateArtifactManifestOperation,
): InternalBetaPrivateArtifactManifestScaffoldDefinition {
  const definition = INTERNAL_BETA_PRIVATE_ARTIFACT_MANIFEST_SCAFFOLDS.find((item) => item.operation === operation)
  if (!definition) {
    throw new Error(`Unknown internal beta private artifact manifest operation: ${operation}`)
  }

  return definition
}

export function createDisabledInternalBetaPrivateArtifactManifestScaffoldResult(
  operation: InternalBetaPrivateArtifactManifestOperation,
  input: InternalBetaPrivateArtifactManifestInput = {},
): InternalBetaPrivateArtifactManifestScaffoldResult {
  const definition = getInternalBetaPrivateArtifactManifestScaffold(operation)

  return {
    ok: false,
    status: 'disabled_pending_private_artifact_manifest_runtime_gate',
    operation,
    scaffoldFunctionName: definition.scaffoldFunctionName,
    createdAt: nowIso(),
    httpStatusCode: 202,
    approvedPlanRequired: definition.approvedPlanRequired,
    jobIdRequired: definition.jobIdRequired,
    artifactManifestRequired: definition.artifactManifestRequired,
    qaReportRequired: definition.qaReportRequired,
    checksumRequired: definition.checksumRequired,
    membershipCheckRequired: definition.membershipCheckRequired,
    idempotencyKeyRequired: definition.idempotencyKeyRequired,
    routeExecution: false,
    workerExecution: false,
    storageWrite: false,
    storageRead: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    supabaseMutation: false,
    providerModelCalls: false,
    renderExportExecution: false,
    internalBetaUnlock: false,
    requiredBeforeEnablement: buildPrivateArtifactGateRequirements(definition),
    inputSummary: summarizePrivateArtifactInput(input),
    warnings: [
      'Internal beta private artifact manifest scaffold is fail-closed.',
      'No storage write, storage read, signed URL creation, public artifact creation, route execution, worker execution, Supabase write, provider/model call, render/export, beta unlock, or production unlock occurred.',
    ],
  }
}

export function writeInternalBetaPrivateArtifactManifestScaffold(input: InternalBetaPrivateArtifactManifestInput = {}) {
  return createDisabledInternalBetaPrivateArtifactManifestScaffoldResult('artifact_manifest_write', input)
}

export function readInternalBetaPrivateArtifactManifestScaffold(input: InternalBetaPrivateArtifactManifestInput = {}) {
  return createDisabledInternalBetaPrivateArtifactManifestScaffoldResult('artifact_manifest_read', input)
}

export function recordInternalBetaPrivateArtifactChecksumScaffold(input: InternalBetaPrivateArtifactManifestInput = {}) {
  return createDisabledInternalBetaPrivateArtifactManifestScaffoldResult('artifact_checksum_record', input)
}

export function linkInternalBetaPrivateArtifactQaReportScaffold(input: InternalBetaPrivateArtifactManifestInput = {}) {
  return createDisabledInternalBetaPrivateArtifactManifestScaffoldResult('artifact_qa_report_link', input)
}

export function recordInternalBetaPrivateArtifactCleanupPolicyScaffold(
  input: InternalBetaPrivateArtifactManifestInput = {},
) {
  return createDisabledInternalBetaPrivateArtifactManifestScaffoldResult('artifact_cleanup_policy_record', input)
}

export function prepareInternalBetaPrivateArtifactAccessScaffold(input: InternalBetaPrivateArtifactManifestInput = {}) {
  return createDisabledInternalBetaPrivateArtifactManifestScaffoldResult('private_artifact_access_prepare', input)
}

export function readInternalBetaPrivateArtifactAccessScaffold(input: InternalBetaPrivateArtifactManifestInput = {}) {
  return createDisabledInternalBetaPrivateArtifactManifestScaffoldResult('private_artifact_access_readback', input)
}

export function markInternalBetaPrivateArtifactRetentionScaffold(input: InternalBetaPrivateArtifactManifestInput = {}) {
  return createDisabledInternalBetaPrivateArtifactManifestScaffoldResult('artifact_retention_mark', input)
}

function buildPrivateArtifactGateRequirements(
  definition: InternalBetaPrivateArtifactManifestScaffoldDefinition,
): string[] {
  const requirements = [
    'explicit_private_artifact_manifest_runtime_enablement_milestone',
    'private_storage_bucket_policy_validated',
    'least_privilege_membership_read_test',
    'service_role_only_artifact_manifest_mutation_test',
    'negative_no_public_artifact_or_signed_url_without_policy_test',
  ]

  if (definition.approvedPlanRequired) requirements.push('approved_plan_snapshot_required')
  if (definition.jobIdRequired) requirements.push('job_id_required')
  if (definition.artifactManifestRequired) requirements.push('artifact_manifest_required')
  if (definition.qaReportRequired) requirements.push('qa_report_required')
  if (definition.checksumRequired) requirements.push('sha256_checksum_required')
  if (definition.membershipCheckRequired) requirements.push('workspace_project_membership_required')
  if (definition.idempotencyKeyRequired) requirements.push('idempotency_key_enforcement')

  return requirements
}

function summarizePrivateArtifactInput(input: InternalBetaPrivateArtifactManifestInput): Record<string, unknown> {
  return sanitizeJson({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    requestId: input.requestId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    jobId: input.jobId,
    artifactManifestId: input.artifactManifestId,
    artifactId: input.artifactId,
    qaReportId: input.qaReportId,
    checksumSha256Present: Boolean(input.checksumSha256),
    storageBucketPresent: Boolean(input.storageBucket),
    storagePathPresent: Boolean(input.storagePath),
    retentionPolicyId: input.retentionPolicyId,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    reason: input.reason,
    payloadKeys: input.payload ? Object.keys(sanitizeJson(input.payload)).sort() : [],
  })
}
