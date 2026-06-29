import type { ISODateString } from '../../types/shared'
import {
  validateGpacMp4boxPrivateArtifactQaMockInput,
  type GpacMp4boxPrivateArtifactQaMockInput,
  type GpacMp4boxPrivateArtifactQaMockResult,
} from './gpac-mp4box-private-artifact-qa-mock-contracts'

export type GpacMp4boxPrivateArtifactCleanupAuditLane =
  'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-CLEANUP-AUDIT-MOCK-IMPLEMENTATION-1'

export type GpacMp4boxPrivateArtifactCleanupAuditId =
  'cleanupAudit.gpacMp4box.privateArtifact.mock'

export type GpacMp4boxPrivateArtifactCleanupAuditStatus =
  | 'cleanup_audit_passed_metadata_only'
  | 'blocked_private_artifact_qa_invalid'
  | 'blocked_cleanup_reference_missing'
  | 'blocked_cleanup_policy_not_private_temp_only'
  | 'blocked_audit_reference_missing'
  | 'blocked_retention_or_residue_policy_missing'
  | 'blocked_storage_or_public_delivery_attempt'
  | 'blocked_tool_or_media_execution_not_enabled'

export interface GpacMp4boxPrivateArtifactCleanupAuditMockInput {
  lane: GpacMp4boxPrivateArtifactCleanupAuditLane
  cleanupAuditId: GpacMp4boxPrivateArtifactCleanupAuditId
  qaInput: GpacMp4boxPrivateArtifactQaMockInput
  createdAt: ISODateString
  cleanupAuditMode: 'private_artifact_cleanup_audit_metadata_only'
  cleanupPolicyRef: {
    id: string
    status: 'approved'
    cleanupRequired: true
    tempArtifactScope: 'worker_temp_private_only'
  }
  auditRecordRef: {
    id: string
    status: 'planned'
    required: true
    auditMode: 'metadata_only'
  }
  retentionPolicyRef: {
    id: string
    status: 'approved'
    retentionClass: 'ephemeral_worker_temp_only'
    persistentStorageAllowed: false
  }
  residuePolicyRef: {
    id: string
    status: 'planned'
    residueCheckRequired: true
    storageResidueAllowed: false
  }
  storageTransfer: false
  signedUrlCreation: false
  publicArtifactCreation: false
  workerExecution: false
  gpacMp4boxExecution: false
  mediaProcessing: false
}

export interface GpacMp4boxPrivateArtifactCleanupAuditMockResult {
  lane: GpacMp4boxPrivateArtifactCleanupAuditLane
  cleanupAuditId: GpacMp4boxPrivateArtifactCleanupAuditId
  ok: boolean
  cleanupAuditStatus: GpacMp4boxPrivateArtifactCleanupAuditStatus
  blockers: GpacMp4boxPrivateArtifactCleanupAuditStatus[]
  qaResult: GpacMp4boxPrivateArtifactQaMockResult
  sanitizedCleanupAudit: {
    cleanupAuditId: GpacMp4boxPrivateArtifactCleanupAuditId
    cleanupAuditMode: 'private_artifact_cleanup_audit_metadata_only'
    qaId: string
    manifestId: string
    cleanupPolicyId: string
    cleanupRequired: true
    tempArtifactScope: 'worker_temp_private_only'
    auditRecordId: string
    auditRequired: true
    auditMode: 'metadata_only'
    retentionPolicyId: string
    retentionClass: 'ephemeral_worker_temp_only'
    residuePolicyId: string
    residueCheckRequired: true
    storageResidueAllowed: false
    storageTransfer: false
    signedUrlCreation: false
    publicArtifactCreation: false
    workerExecution: false
    gpacMp4boxExecution: false
    mediaProcessing: false
  }
  sanitizedSummary: string
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-FINAL-RUNTIME-READINESS-REVIEW-1'
}

export function buildGpacMp4boxPrivateArtifactCleanupAuditMockInput(input: {
  qaInput: GpacMp4boxPrivateArtifactQaMockInput
  createdAt: ISODateString
}): GpacMp4boxPrivateArtifactCleanupAuditMockInput {
  return {
    lane: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-CLEANUP-AUDIT-MOCK-IMPLEMENTATION-1',
    cleanupAuditId: 'cleanupAudit.gpacMp4box.privateArtifact.mock',
    qaInput: input.qaInput,
    createdAt: input.createdAt,
    cleanupAuditMode: 'private_artifact_cleanup_audit_metadata_only',
    cleanupPolicyRef: {
      id: 'cleanup.gpac-mp4box.private.mock.approved',
      status: 'approved',
      cleanupRequired: true,
      tempArtifactScope: 'worker_temp_private_only',
    },
    auditRecordRef: {
      id: 'audit.gpac-mp4box.private.mock.planned',
      status: 'planned',
      required: true,
      auditMode: 'metadata_only',
    },
    retentionPolicyRef: {
      id: 'retention.gpac-mp4box.private.mock.ephemeral',
      status: 'approved',
      retentionClass: 'ephemeral_worker_temp_only',
      persistentStorageAllowed: false,
    },
    residuePolicyRef: {
      id: 'residue.gpac-mp4box.private.mock.planned',
      status: 'planned',
      residueCheckRequired: true,
      storageResidueAllowed: false,
    },
    storageTransfer: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    workerExecution: false,
    gpacMp4boxExecution: false,
    mediaProcessing: false,
  }
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function hasText(value: string): boolean {
  return value.trim().length > 0
}

function buildSanitizedCleanupAudit(
  input: GpacMp4boxPrivateArtifactCleanupAuditMockInput,
  qaResult: GpacMp4boxPrivateArtifactQaMockResult,
): GpacMp4boxPrivateArtifactCleanupAuditMockResult['sanitizedCleanupAudit'] {
  return {
    cleanupAuditId: input.cleanupAuditId,
    cleanupAuditMode: input.cleanupAuditMode,
    qaId: qaResult.qaId,
    manifestId: qaResult.sanitizedQaReport.manifestId,
    cleanupPolicyId: input.cleanupPolicyRef.id,
    cleanupRequired: true,
    tempArtifactScope: 'worker_temp_private_only',
    auditRecordId: input.auditRecordRef.id,
    auditRequired: true,
    auditMode: 'metadata_only',
    retentionPolicyId: input.retentionPolicyRef.id,
    retentionClass: 'ephemeral_worker_temp_only',
    residuePolicyId: input.residuePolicyRef.id,
    residueCheckRequired: true,
    storageResidueAllowed: false,
    storageTransfer: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    workerExecution: false,
    gpacMp4boxExecution: false,
    mediaProcessing: false,
  }
}

export function validateGpacMp4boxPrivateArtifactCleanupAuditMockInput(
  input: GpacMp4boxPrivateArtifactCleanupAuditMockInput,
): GpacMp4boxPrivateArtifactCleanupAuditMockResult {
  const blockers: GpacMp4boxPrivateArtifactCleanupAuditStatus[] = []
  const qaResult = validateGpacMp4boxPrivateArtifactQaMockInput(input.qaInput)

  if (!qaResult.ok) pushOnce(blockers, 'blocked_private_artifact_qa_invalid')
  if (
    !hasText(input.cleanupPolicyRef.id) ||
    input.cleanupPolicyRef.status !== 'approved' ||
    !input.cleanupPolicyRef.cleanupRequired
  ) {
    pushOnce(blockers, 'blocked_cleanup_reference_missing')
  }
  if (input.cleanupPolicyRef.tempArtifactScope !== 'worker_temp_private_only') {
    pushOnce(blockers, 'blocked_cleanup_policy_not_private_temp_only')
  }
  if (
    !hasText(input.auditRecordRef.id) ||
    input.auditRecordRef.status !== 'planned' ||
    !input.auditRecordRef.required ||
    input.auditRecordRef.auditMode !== 'metadata_only'
  ) {
    pushOnce(blockers, 'blocked_audit_reference_missing')
  }
  if (
    !hasText(input.retentionPolicyRef.id) ||
    input.retentionPolicyRef.status !== 'approved' ||
    input.retentionPolicyRef.retentionClass !== 'ephemeral_worker_temp_only' ||
    input.retentionPolicyRef.persistentStorageAllowed ||
    !hasText(input.residuePolicyRef.id) ||
    input.residuePolicyRef.status !== 'planned' ||
    !input.residuePolicyRef.residueCheckRequired ||
    input.residuePolicyRef.storageResidueAllowed
  ) {
    pushOnce(blockers, 'blocked_retention_or_residue_policy_missing')
  }
  if (input.storageTransfer || input.signedUrlCreation || input.publicArtifactCreation) {
    pushOnce(blockers, 'blocked_storage_or_public_delivery_attempt')
  }
  if (input.workerExecution || input.gpacMp4boxExecution || input.mediaProcessing) {
    pushOnce(blockers, 'blocked_tool_or_media_execution_not_enabled')
  }

  const ok = blockers.length === 0
  const sanitizedCleanupAudit = buildSanitizedCleanupAudit(input, qaResult)

  return {
    lane: input.lane,
    cleanupAuditId: input.cleanupAuditId,
    ok,
    cleanupAuditStatus: ok ? 'cleanup_audit_passed_metadata_only' : blockers[0],
    blockers,
    qaResult,
    sanitizedCleanupAudit,
    sanitizedSummary: ok
      ? 'GPAC/MP4Box private artifact cleanup/audit mock passed metadata-only checks; storage transfer, public delivery, tool execution, and media processing remain blocked.'
      : `GPAC/MP4Box private artifact cleanup/audit mock blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-FINAL-RUNTIME-READINESS-REVIEW-1',
  }
}

export function summarizeGpacMp4boxPrivateArtifactCleanupAuditBoundary(): string[] {
  return [
    'Private artifact cleanup/audit is metadata-only and consumes the QA mock result.',
    'Cleanup policy must remain worker-temp private only, with ephemeral retention and planned residue checks.',
    'No storage transfer, signed URL creation, public artifact creation, worker execution, GPAC/MP4Box execution, or media processing is enabled.',
    'The next gate may review final runtime readiness, but product runtime remains blocked until backend, storage, QA, and runtime approvals are explicitly completed.',
  ]
}
