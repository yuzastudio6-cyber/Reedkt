import type { ID, ISODateString } from '../../types/shared'

export type GpacMp4boxMockWorkerLane = 'TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1'

export type GpacMp4boxCommandTemplateId =
  | 'mp4box_add_generated_subtitle_only_v1'
  | 'mp4box_info_generated_subtitle_only_v1'
  | 'mp4box_package_validation_metadata_v1'

export type GpacMp4boxMockWorkerStatus =
  | 'blocked_missing_approved_snapshot'
  | 'blocked_missing_approval_record'
  | 'blocked_missing_private_input_manifest'
  | 'blocked_input_checksum_mismatch'
  | 'blocked_unapproved_command_template'
  | 'blocked_idempotency_conflict'
  | 'blocked_worker_lease_unavailable'
  | 'blocked_public_or_signed_artifact_attempt'
  | 'blocked_cleanup_policy_missing'
  | 'blocked_runtime_execution_not_enabled'

export type GpacMp4boxCleanupStatus =
  | 'cleanup_not_started'
  | 'cleanup_required'
  | 'cleanup_verified'
  | 'cleanup_failed'

export interface GpacMp4boxReference {
  id: ID
  status: 'approved' | 'active' | 'ready' | 'planned'
}

export interface GpacMp4boxWorkerLeaseReference extends GpacMp4boxReference {
  leaseStatus: 'active' | 'planned'
}

export interface GpacMp4boxPrivateInputManifestReference {
  id: ID
  sourceClass: 'generated_fixture' | 'approved_private_fixture'
  storageObjectPath: string
  checksumSha256: string
  byteCount: number
  sourceOfTruth: true
  privateArtifact: true
}

export interface GpacMp4boxPrivateArtifactManifestReference {
  id: ID
  storageObjectPrefix: string
  expectedOutputFileNames: string[]
  expectedChecksumAlgorithm: 'sha256'
  publicArtifactsAllowed: false
  signedUrlsAllowed: false
}

export interface GpacMp4boxQaReportReference {
  id: ID
  requiredChecks: Array<'manifest_integrity' | 'checksum_match' | 'mp4box_stdout_bounded' | 'cleanup_verified'>
  blocksPreview: true
  blocksFinalExport: true
}

export interface GpacMp4boxCleanupPolicyReference {
  id: ID
  status: 'planned' | 'approved'
  cleanupStatus: GpacMp4boxCleanupStatus
  tempArtifactScope: 'worker_temp_only'
}

export interface GpacMp4boxMockWorkerJobEnvelope {
  lane: GpacMp4boxMockWorkerLane
  approvedSnapshotRef: GpacMp4boxReference
  approvalRecordRef: GpacMp4boxReference
  jobRef: GpacMp4boxReference
  workerLeaseRef: GpacMp4boxWorkerLeaseReference
  routeIdempotencyKey: string
  sourceSequenceMapRef: GpacMp4boxReference
  compiledIntentRef: GpacMp4boxReference
  modelRoutingPolicyRef: GpacMp4boxReference
  qaPolicyRef: GpacMp4boxQaReportReference
  privateInputManifestRef: GpacMp4boxPrivateInputManifestReference
  privateArtifactManifestRef: GpacMp4boxPrivateArtifactManifestReference
  privateArtifactChecksumRef: GpacMp4boxReference
  toolRuntimePolicyRef: GpacMp4boxReference
  gpacMp4boxWorkerContractRef: GpacMp4boxReference
  gpacMp4boxRouteContractRef: GpacMp4boxReference
  cleanupPolicyRef: GpacMp4boxCleanupPolicyReference
  auditRecordRef: GpacMp4boxReference
  commandTemplateId: GpacMp4boxCommandTemplateId
  createdAt: ISODateString
  executionMode: 'mock_contract_only'
  runtimeExecution: false
  workerExecution: false
  routeExecution: false
}

export interface GpacMp4boxMockWorkerValidationResult {
  ok: boolean
  blockers: GpacMp4boxMockWorkerStatus[]
  sanitizedSummary: string
}

export const gpacMp4boxApprovedCommandTemplateIds: readonly GpacMp4boxCommandTemplateId[] = [
  'mp4box_add_generated_subtitle_only_v1',
  'mp4box_info_generated_subtitle_only_v1',
  'mp4box_package_validation_metadata_v1',
] as const

function isUrlLikeOrSigned(value: string): boolean {
  const normalized = value.toLowerCase()
  return normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('signed://') ||
    normalized.includes('x-goog-signature=') ||
    normalized.includes('x-amz-signature=') ||
    normalized.includes('signature=')
}

function isPresent(reference?: { id?: string } | null): boolean {
  return Boolean(reference?.id?.trim())
}

export function buildGpacMp4boxMockWorkerRouteIdempotencyKey(input: {
  workspaceId: ID
  projectId: ID
  approvedSnapshotId: ID
  jobId: ID
  commandTemplateId: GpacMp4boxCommandTemplateId
}): string {
  return [
    'tracka-gpac-mp4box-mock-worker',
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.jobId,
    input.commandTemplateId,
  ].join(':')
}

export function validateGpacMp4boxMockWorkerEnvelope(
  envelope: GpacMp4boxMockWorkerJobEnvelope,
): GpacMp4boxMockWorkerValidationResult {
  const blockers: GpacMp4boxMockWorkerStatus[] = []

  if (!isPresent(envelope.approvedSnapshotRef)) blockers.push('blocked_missing_approved_snapshot')
  if (!isPresent(envelope.approvalRecordRef)) blockers.push('blocked_missing_approval_record')
  if (!isPresent(envelope.privateInputManifestRef)) blockers.push('blocked_missing_private_input_manifest')
  if (!envelope.privateInputManifestRef.checksumSha256?.trim()) blockers.push('blocked_input_checksum_mismatch')
  if (!gpacMp4boxApprovedCommandTemplateIds.includes(envelope.commandTemplateId)) {
    blockers.push('blocked_unapproved_command_template')
  }
  if (!envelope.routeIdempotencyKey?.trim()) blockers.push('blocked_idempotency_conflict')
  if (!isPresent(envelope.workerLeaseRef) || envelope.workerLeaseRef.leaseStatus !== 'active') {
    blockers.push('blocked_worker_lease_unavailable')
  }
  if (
    isUrlLikeOrSigned(envelope.privateInputManifestRef.storageObjectPath) ||
    isUrlLikeOrSigned(envelope.privateArtifactManifestRef.storageObjectPrefix) ||
    envelope.privateArtifactManifestRef.publicArtifactsAllowed !== false ||
    envelope.privateArtifactManifestRef.signedUrlsAllowed !== false
  ) {
    blockers.push('blocked_public_or_signed_artifact_attempt')
  }
  if (!isPresent(envelope.cleanupPolicyRef) || envelope.cleanupPolicyRef.status !== 'approved') {
    blockers.push('blocked_cleanup_policy_missing')
  }
  if (envelope.runtimeExecution || envelope.workerExecution || envelope.routeExecution) {
    blockers.push('blocked_runtime_execution_not_enabled')
  }

  return {
    ok: blockers.length === 0,
    blockers,
    sanitizedSummary: blockers.length === 0
      ? 'GPAC/MP4Box mock worker envelope is structurally ready for a future guarded route implementation packet.'
      : `GPAC/MP4Box mock worker envelope blocked by ${blockers.join(', ')}.`,
  }
}

export function summarizeGpacMp4boxMockWorkerBoundary(): string[] {
  return [
    'TypeScript-only mock worker interface contracts.',
    'Approved snapshot, approval record, worker lease, idempotency key, private manifest, QA report, cleanup, and audit refs are required.',
    'Raw chat, raw command strings, public URLs, signed URLs as source-of-truth, arbitrary private media, and frontend file paths are not accepted worker inputs.',
    'No route execution, worker execution, GPAC/MP4Box execution, media processing, storage transfer, database mutation, public artifact creation, or production unlock is enabled.',
  ]
}
