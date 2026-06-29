import type { ISODateString } from '../../types/shared'
import {
  validateGpacMp4boxPrivateArtifactPolicyMockInput,
  type GpacMp4boxPrivateArtifactPolicyMockInput,
  type GpacMp4boxPrivateArtifactPolicyMockResult,
} from './gpac-mp4box-private-artifact-policy-mock-contracts'

export type GpacMp4boxPrivateArtifactManifestLane =
  'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-MANIFEST-MOCK-IMPLEMENTATION-1'

export type GpacMp4boxPrivateArtifactManifestId =
  'artifactManifest.gpacMp4box.private.mock'

export type GpacMp4boxPrivateArtifactManifestStatus =
  | 'manifest_registered_metadata_only'
  | 'blocked_private_artifact_policy_invalid'
  | 'blocked_manifest_entry_missing'
  | 'blocked_manifest_entry_checksum_invalid'
  | 'blocked_manifest_entry_not_private'
  | 'blocked_storage_or_public_delivery_attempt'
  | 'blocked_tool_or_media_execution_not_enabled'
  | 'blocked_qa_cleanup_audit_reference_missing'

export type GpacMp4boxPrivateArtifactKind =
  | 'validation_report_json'
  | 'artifact_manifest_json'
  | 'bounded_stdout_log'
  | 'qa_report_json'

export interface GpacMp4boxPrivateArtifactManifestEntry {
  entryId: string
  fileName: string
  artifactKind: GpacMp4boxPrivateArtifactKind
  byteCount: number
  checksumSha256: string
  storageDisposition: 'worker_temp_private_only'
  sourceClass: 'generated_private_fixture_output_metadata'
  publicArtifact: false
  signedUrl: false
  committedToRepo: false
  mediaArtifact: false
}

export interface GpacMp4boxPrivateArtifactManifestMockInput {
  lane: GpacMp4boxPrivateArtifactManifestLane
  manifestId: GpacMp4boxPrivateArtifactManifestId
  policyInput: GpacMp4boxPrivateArtifactPolicyMockInput
  createdAt: ISODateString
  manifestMode: 'private_artifact_manifest_metadata_only'
  manifestEntries: GpacMp4boxPrivateArtifactManifestEntry[]
  qaReportRef: { id: string; status: 'planned'; required: true }
  cleanupPolicyRef: { id: string; status: 'approved'; cleanupRequired: true }
  auditRecordRef: { id: string; status: 'planned'; required: true }
  storageTransfer: false
  signedUrlCreation: false
  publicArtifactCreation: false
  workerExecution: false
  gpacMp4boxExecution: false
  mediaProcessing: false
}

export interface GpacMp4boxPrivateArtifactManifestMockResult {
  lane: GpacMp4boxPrivateArtifactManifestLane
  manifestId: GpacMp4boxPrivateArtifactManifestId
  ok: boolean
  manifestStatus: GpacMp4boxPrivateArtifactManifestStatus
  blockers: GpacMp4boxPrivateArtifactManifestStatus[]
  policyResult: GpacMp4boxPrivateArtifactPolicyMockResult
  sanitizedManifest: {
    manifestId: GpacMp4boxPrivateArtifactManifestId
    manifestMode: 'private_artifact_manifest_metadata_only'
    policyId: string
    storageAccessMode: 'metadata_only_no_storage_transfer'
    artifactScope: 'worker_temp_private_only'
    checksumAlgorithm: 'sha256'
    entryCount: number
    totalByteCount: number
    entries: GpacMp4boxPrivateArtifactManifestEntry[]
    qaReportRef: { id: string; status: 'planned'; required: true }
    cleanupPolicyRef: { id: string; status: 'approved'; cleanupRequired: true }
    auditRecordRef: { id: string; status: 'planned'; required: true }
    storageTransfer: false
    signedUrlCreation: false
    publicArtifactCreation: false
    workerExecution: false
    gpacMp4boxExecution: false
    mediaProcessing: false
  }
  sanitizedSummary: string
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-QA-MOCK-IMPLEMENTATION-1'
}

export function buildGpacMp4boxPrivateArtifactManifestEntry(input: {
  entryId: string
  fileName: string
  artifactKind: GpacMp4boxPrivateArtifactKind
  byteCount: number
  checksumSha256: string
}): GpacMp4boxPrivateArtifactManifestEntry {
  return {
    entryId: input.entryId,
    fileName: input.fileName,
    artifactKind: input.artifactKind,
    byteCount: input.byteCount,
    checksumSha256: input.checksumSha256,
    storageDisposition: 'worker_temp_private_only',
    sourceClass: 'generated_private_fixture_output_metadata',
    publicArtifact: false,
    signedUrl: false,
    committedToRepo: false,
    mediaArtifact: false,
  }
}

export function buildGpacMp4boxPrivateArtifactManifestMockInput(input: {
  policyInput: GpacMp4boxPrivateArtifactPolicyMockInput
  createdAt: ISODateString
  manifestEntries: GpacMp4boxPrivateArtifactManifestEntry[]
}): GpacMp4boxPrivateArtifactManifestMockInput {
  return {
    lane: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-MANIFEST-MOCK-IMPLEMENTATION-1',
    manifestId: 'artifactManifest.gpacMp4box.private.mock',
    policyInput: input.policyInput,
    createdAt: input.createdAt,
    manifestMode: 'private_artifact_manifest_metadata_only',
    manifestEntries: input.manifestEntries,
    qaReportRef: { id: 'qa-report.gpac-mp4box.private.mock.planned', status: 'planned', required: true },
    cleanupPolicyRef: { id: 'cleanup.gpac-mp4box.private.mock.approved', status: 'approved', cleanupRequired: true },
    auditRecordRef: { id: 'audit.gpac-mp4box.private.mock.planned', status: 'planned', required: true },
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

function hasValidChecksum(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value)
}

function isSafePrivateFileName(value: string): boolean {
  return Boolean(value) && !value.includes('/') && !value.includes('\\') && !value.startsWith('.')
}

function validateEntry(
  entry: GpacMp4boxPrivateArtifactManifestEntry,
  blockers: GpacMp4boxPrivateArtifactManifestStatus[],
): void {
  if (!isSafePrivateFileName(entry.fileName) || entry.byteCount < 0 || !Number.isFinite(entry.byteCount)) {
    pushOnce(blockers, 'blocked_manifest_entry_missing')
  }
  if (!hasValidChecksum(entry.checksumSha256)) {
    pushOnce(blockers, 'blocked_manifest_entry_checksum_invalid')
  }
  if (
    entry.storageDisposition !== 'worker_temp_private_only' ||
    entry.publicArtifact ||
    entry.signedUrl ||
    entry.committedToRepo ||
    entry.mediaArtifact
  ) {
    pushOnce(blockers, 'blocked_manifest_entry_not_private')
  }
}

function createSanitizedManifest(
  input: GpacMp4boxPrivateArtifactManifestMockInput,
  policyResult: GpacMp4boxPrivateArtifactPolicyMockResult,
): GpacMp4boxPrivateArtifactManifestMockResult['sanitizedManifest'] {
  const totalByteCount = input.manifestEntries.reduce((total, entry) => total + entry.byteCount, 0)

  return {
    manifestId: input.manifestId,
    manifestMode: input.manifestMode,
    policyId: policyResult.sanitizedPolicy.policyId,
    storageAccessMode: policyResult.sanitizedPolicy.storageAccessMode,
    artifactScope: policyResult.sanitizedPolicy.artifactScope,
    checksumAlgorithm: policyResult.sanitizedPolicy.checksumAlgorithm,
    entryCount: input.manifestEntries.length,
    totalByteCount,
    entries: input.manifestEntries,
    qaReportRef: input.qaReportRef,
    cleanupPolicyRef: input.cleanupPolicyRef,
    auditRecordRef: input.auditRecordRef,
    storageTransfer: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    workerExecution: false,
    gpacMp4boxExecution: false,
    mediaProcessing: false,
  }
}

export function validateGpacMp4boxPrivateArtifactManifestMockInput(
  input: GpacMp4boxPrivateArtifactManifestMockInput,
): GpacMp4boxPrivateArtifactManifestMockResult {
  const blockers: GpacMp4boxPrivateArtifactManifestStatus[] = []
  const policyResult = validateGpacMp4boxPrivateArtifactPolicyMockInput(input.policyInput)

  if (!policyResult.ok) pushOnce(blockers, 'blocked_private_artifact_policy_invalid')
  if (!input.manifestEntries.length) pushOnce(blockers, 'blocked_manifest_entry_missing')
  for (const entry of input.manifestEntries) validateEntry(entry, blockers)

  if (input.storageTransfer || input.signedUrlCreation || input.publicArtifactCreation) {
    pushOnce(blockers, 'blocked_storage_or_public_delivery_attempt')
  }
  if (input.workerExecution || input.gpacMp4boxExecution || input.mediaProcessing) {
    pushOnce(blockers, 'blocked_tool_or_media_execution_not_enabled')
  }
  if (
    !input.qaReportRef.required ||
    input.qaReportRef.status !== 'planned' ||
    !input.cleanupPolicyRef.cleanupRequired ||
    input.cleanupPolicyRef.status !== 'approved' ||
    !input.auditRecordRef.required ||
    input.auditRecordRef.status !== 'planned'
  ) {
    pushOnce(blockers, 'blocked_qa_cleanup_audit_reference_missing')
  }

  const ok = blockers.length === 0
  const sanitizedManifest = createSanitizedManifest(input, policyResult)

  return {
    lane: input.lane,
    manifestId: input.manifestId,
    ok,
    manifestStatus: ok ? 'manifest_registered_metadata_only' : blockers[0],
    blockers,
    policyResult,
    sanitizedManifest,
    sanitizedSummary: ok
      ? 'GPAC/MP4Box private artifact manifest mock is metadata-only and keeps storage transfer, public delivery, tool execution, and media processing blocked.'
      : `GPAC/MP4Box private artifact manifest mock blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-QA-MOCK-IMPLEMENTATION-1',
  }
}

export function summarizeGpacMp4boxPrivateArtifactManifestBoundary(): string[] {
  return [
    'Private artifact manifest entries are metadata-only and worker-temp private only.',
    'Each manifest entry must have a SHA-256 checksum, byte count, safe file name, QA reference, cleanup reference, and audit reference.',
    'No storage transfer, signed URL creation, public artifact creation, worker execution, GPAC/MP4Box execution, or media processing is enabled.',
    'The next gate may review QA metadata, but it must still avoid storage transfer and tool/media execution unless a later guarded execution packet explicitly authorizes it.',
  ]
}
