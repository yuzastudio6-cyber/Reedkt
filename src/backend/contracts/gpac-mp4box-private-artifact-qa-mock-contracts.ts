import type { ISODateString } from '../../types/shared'
import {
  validateGpacMp4boxPrivateArtifactManifestMockInput,
  type GpacMp4boxPrivateArtifactManifestMockInput,
  type GpacMp4boxPrivateArtifactManifestMockResult,
} from './gpac-mp4box-private-artifact-manifest-mock-contracts'

export type GpacMp4boxPrivateArtifactQaLane =
  'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-QA-MOCK-IMPLEMENTATION-1'

export type GpacMp4boxPrivateArtifactQaId =
  'qa.gpacMp4box.privateArtifact.mock'

export type GpacMp4boxPrivateArtifactQaStatus =
  | 'qa_passed_metadata_only'
  | 'blocked_private_artifact_manifest_invalid'
  | 'blocked_manifest_integrity_check_failed'
  | 'blocked_checksum_reference_check_failed'
  | 'blocked_private_artifact_boundary_check_failed'
  | 'blocked_cleanup_reference_check_failed'
  | 'blocked_audit_reference_check_failed'
  | 'blocked_storage_or_public_delivery_attempt'
  | 'blocked_tool_or_media_execution_not_enabled'

export type GpacMp4boxPrivateArtifactQaCheckId =
  | 'manifest_integrity'
  | 'checksum_references'
  | 'private_artifact_boundary'
  | 'cleanup_reference'
  | 'audit_reference'

export interface GpacMp4boxPrivateArtifactQaCheckResult {
  checkId: GpacMp4boxPrivateArtifactQaCheckId
  status: 'passed'
  evidence: string
}

export interface GpacMp4boxPrivateArtifactQaMockInput {
  lane: GpacMp4boxPrivateArtifactQaLane
  qaId: GpacMp4boxPrivateArtifactQaId
  manifestInput: GpacMp4boxPrivateArtifactManifestMockInput
  createdAt: ISODateString
  qaMode: 'private_artifact_qa_metadata_only'
  requiredChecks: GpacMp4boxPrivateArtifactQaCheckId[]
  storageTransfer: false
  signedUrlCreation: false
  publicArtifactCreation: false
  workerExecution: false
  gpacMp4boxExecution: false
  mediaProcessing: false
}

export interface GpacMp4boxPrivateArtifactQaMockResult {
  lane: GpacMp4boxPrivateArtifactQaLane
  qaId: GpacMp4boxPrivateArtifactQaId
  ok: boolean
  qaStatus: GpacMp4boxPrivateArtifactQaStatus
  blockers: GpacMp4boxPrivateArtifactQaStatus[]
  manifestResult: GpacMp4boxPrivateArtifactManifestMockResult
  sanitizedQaReport: {
    qaId: GpacMp4boxPrivateArtifactQaId
    qaMode: 'private_artifact_qa_metadata_only'
    manifestId: string
    entryCount: number
    totalByteCount: number
    requiredChecks: GpacMp4boxPrivateArtifactQaCheckResult[]
    storageTransfer: false
    signedUrlCreation: false
    publicArtifactCreation: false
    workerExecution: false
    gpacMp4boxExecution: false
    mediaProcessing: false
  }
  sanitizedSummary: string
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-CLEANUP-AUDIT-MOCK-IMPLEMENTATION-1'
}

export function buildGpacMp4boxPrivateArtifactQaMockInput(input: {
  manifestInput: GpacMp4boxPrivateArtifactManifestMockInput
  createdAt: ISODateString
}): GpacMp4boxPrivateArtifactQaMockInput {
  return {
    lane: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-QA-MOCK-IMPLEMENTATION-1',
    qaId: 'qa.gpacMp4box.privateArtifact.mock',
    manifestInput: input.manifestInput,
    createdAt: input.createdAt,
    qaMode: 'private_artifact_qa_metadata_only',
    requiredChecks: [
      'manifest_integrity',
      'checksum_references',
      'private_artifact_boundary',
      'cleanup_reference',
      'audit_reference',
    ],
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

function hasCheck(input: GpacMp4boxPrivateArtifactQaMockInput, check: GpacMp4boxPrivateArtifactQaCheckId): boolean {
  return input.requiredChecks.includes(check)
}

function buildPassedChecks(
  input: GpacMp4boxPrivateArtifactQaMockInput,
  manifestResult: GpacMp4boxPrivateArtifactManifestMockResult,
): GpacMp4boxPrivateArtifactQaCheckResult[] {
  return input.requiredChecks.map((checkId) => ({
    checkId,
    status: 'passed',
    evidence: `${checkId} passed for ${manifestResult.sanitizedManifest.entryCount} private manifest entries.`,
  }))
}

export function validateGpacMp4boxPrivateArtifactQaMockInput(
  input: GpacMp4boxPrivateArtifactQaMockInput,
): GpacMp4boxPrivateArtifactQaMockResult {
  const blockers: GpacMp4boxPrivateArtifactQaStatus[] = []
  const manifestResult = validateGpacMp4boxPrivateArtifactManifestMockInput(input.manifestInput)

  if (!manifestResult.ok) pushOnce(blockers, 'blocked_private_artifact_manifest_invalid')
  if (!hasCheck(input, 'manifest_integrity') || manifestResult.sanitizedManifest.entryCount < 1) {
    pushOnce(blockers, 'blocked_manifest_integrity_check_failed')
  }
  if (
    !hasCheck(input, 'checksum_references') ||
    manifestResult.sanitizedManifest.checksumAlgorithm !== 'sha256' ||
    manifestResult.sanitizedManifest.entries.some((entry) => !/^[a-f0-9]{64}$/i.test(entry.checksumSha256))
  ) {
    pushOnce(blockers, 'blocked_checksum_reference_check_failed')
  }
  if (
    !hasCheck(input, 'private_artifact_boundary') ||
    manifestResult.sanitizedManifest.entries.some((entry) => (
      entry.storageDisposition !== 'worker_temp_private_only' ||
      entry.publicArtifact ||
      entry.signedUrl ||
      entry.committedToRepo ||
      entry.mediaArtifact
    ))
  ) {
    pushOnce(blockers, 'blocked_private_artifact_boundary_check_failed')
  }
  if (!hasCheck(input, 'cleanup_reference') || !manifestResult.sanitizedManifest.cleanupPolicyRef.cleanupRequired) {
    pushOnce(blockers, 'blocked_cleanup_reference_check_failed')
  }
  if (!hasCheck(input, 'audit_reference') || !manifestResult.sanitizedManifest.auditRecordRef.required) {
    pushOnce(blockers, 'blocked_audit_reference_check_failed')
  }
  if (input.storageTransfer || input.signedUrlCreation || input.publicArtifactCreation) {
    pushOnce(blockers, 'blocked_storage_or_public_delivery_attempt')
  }
  if (input.workerExecution || input.gpacMp4boxExecution || input.mediaProcessing) {
    pushOnce(blockers, 'blocked_tool_or_media_execution_not_enabled')
  }

  const ok = blockers.length === 0
  const sanitizedQaReport = {
    qaId: input.qaId,
    qaMode: input.qaMode,
    manifestId: manifestResult.sanitizedManifest.manifestId,
    entryCount: manifestResult.sanitizedManifest.entryCount,
    totalByteCount: manifestResult.sanitizedManifest.totalByteCount,
    requiredChecks: ok ? buildPassedChecks(input, manifestResult) : [],
    storageTransfer: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    workerExecution: false,
    gpacMp4boxExecution: false,
    mediaProcessing: false,
  } satisfies GpacMp4boxPrivateArtifactQaMockResult['sanitizedQaReport']

  return {
    lane: input.lane,
    qaId: input.qaId,
    ok,
    qaStatus: ok ? 'qa_passed_metadata_only' : blockers[0],
    blockers,
    manifestResult,
    sanitizedQaReport,
    sanitizedSummary: ok
      ? 'GPAC/MP4Box private artifact QA mock passed metadata-only checks; storage transfer, public delivery, tool execution, and media processing remain blocked.'
      : `GPAC/MP4Box private artifact QA mock blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-CLEANUP-AUDIT-MOCK-IMPLEMENTATION-1',
  }
}

export function summarizeGpacMp4boxPrivateArtifactQaBoundary(): string[] {
  return [
    'Private artifact QA is metadata-only and reviews the private artifact manifest result.',
    'QA checks cover manifest integrity, checksum references, private artifact boundaries, cleanup references, and audit references.',
    'No storage transfer, signed URL creation, public artifact creation, worker execution, GPAC/MP4Box execution, or media processing is enabled.',
    'The next gate must reconcile cleanup and audit metadata before any product runtime or private E2E lane can be considered.',
  ]
}
