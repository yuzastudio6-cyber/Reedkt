import type { ISODateString } from '../../types/shared'
import {
  validateGpacMp4boxGuardedWorkerSkeletonMockInput,
  type GpacMp4boxGuardedWorkerSkeletonMockInput,
  type GpacMp4boxGuardedWorkerSkeletonMockResult,
} from './gpac-mp4box-guarded-worker-skeleton-mock-contracts'

export type GpacMp4boxPrivateArtifactPolicyLane =
  'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-POLICY-MOCK-IMPLEMENTATION-1'

export type GpacMp4boxPrivateArtifactPolicyId =
  'artifactPolicy.gpacMp4box.private.mock'

export type GpacMp4boxPrivateArtifactPolicyStatus =
  | 'policy_registered_metadata_only'
  | 'blocked_worker_skeleton_invalid'
  | 'blocked_storage_transfer_not_enabled'
  | 'blocked_public_or_signed_artifact_attempt'
  | 'blocked_tool_or_media_execution_not_enabled'
  | 'blocked_cleanup_policy_missing'

export interface GpacMp4boxPrivateArtifactPolicyMockInput {
  lane: GpacMp4boxPrivateArtifactPolicyLane
  policyId: GpacMp4boxPrivateArtifactPolicyId
  skeletonInput: GpacMp4boxGuardedWorkerSkeletonMockInput
  createdAt: ISODateString
  policyMode: 'private_artifact_metadata_policy_only'
  storageAccessMode: 'metadata_only_no_storage_transfer'
  artifactScope: 'worker_temp_private_only'
  checksumAlgorithm: 'sha256'
  cleanupRequired: true
  routeExecution: false
  workerDispatchAttempted: false
  workerExecution: false
  gpacMp4boxExecution: false
  mediaProcessing: false
  storageTransfer: false
  signedUrlCreation: false
  publicArtifactCreation: false
}

export interface GpacMp4boxPrivateArtifactPolicyMockResult {
  lane: GpacMp4boxPrivateArtifactPolicyLane
  policyId: GpacMp4boxPrivateArtifactPolicyId
  ok: boolean
  policyStatus: GpacMp4boxPrivateArtifactPolicyStatus
  blockers: GpacMp4boxPrivateArtifactPolicyStatus[]
  skeletonResult: GpacMp4boxGuardedWorkerSkeletonMockResult
  sanitizedPolicy: {
    policyId: GpacMp4boxPrivateArtifactPolicyId
    policyMode: 'private_artifact_metadata_policy_only'
    storageAccessMode: 'metadata_only_no_storage_transfer'
    artifactScope: 'worker_temp_private_only'
    checksumAlgorithm: 'sha256'
    cleanupRequired: true
    queueItemId: string
    jobId: string
    privateInputManifestId: string
    privateArtifactManifestId: string
    privateArtifactChecksumId: string
    qaPolicyId: string
    cleanupPolicyId: string
    auditRecordId: string
    routeExecution: false
    workerDispatchAttempted: false
    workerExecution: false
    gpacMp4boxExecution: false
    mediaProcessing: false
    storageTransfer: false
    signedUrlCreation: false
    publicArtifactCreation: false
  }
  sanitizedSummary: string
  nextRequiredGate: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-MANIFEST-MOCK-IMPLEMENTATION-1'
}

export function buildGpacMp4boxPrivateArtifactPolicyMockInput(input: {
  skeletonInput: GpacMp4boxGuardedWorkerSkeletonMockInput
  createdAt: ISODateString
}): GpacMp4boxPrivateArtifactPolicyMockInput {
  return {
    lane: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-POLICY-MOCK-IMPLEMENTATION-1',
    policyId: 'artifactPolicy.gpacMp4box.private.mock',
    skeletonInput: input.skeletonInput,
    createdAt: input.createdAt,
    policyMode: 'private_artifact_metadata_policy_only',
    storageAccessMode: 'metadata_only_no_storage_transfer',
    artifactScope: 'worker_temp_private_only',
    checksumAlgorithm: 'sha256',
    cleanupRequired: true,
    routeExecution: false,
    workerDispatchAttempted: false,
    workerExecution: false,
    gpacMp4boxExecution: false,
    mediaProcessing: false,
    storageTransfer: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
  }
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function createSanitizedPolicy(
  input: GpacMp4boxPrivateArtifactPolicyMockInput,
  skeletonResult: GpacMp4boxGuardedWorkerSkeletonMockResult,
): GpacMp4boxPrivateArtifactPolicyMockResult['sanitizedPolicy'] {
  return {
    policyId: input.policyId,
    policyMode: input.policyMode,
    storageAccessMode: input.storageAccessMode,
    artifactScope: input.artifactScope,
    checksumAlgorithm: input.checksumAlgorithm,
    cleanupRequired: true,
    queueItemId: skeletonResult.sanitizedPayload.queueItemId,
    jobId: skeletonResult.sanitizedPayload.jobId,
    privateInputManifestId: skeletonResult.sanitizedPayload.privateInputManifestId,
    privateArtifactManifestId: skeletonResult.sanitizedPayload.privateArtifactManifestId,
    privateArtifactChecksumId: skeletonResult.sanitizedPayload.privateArtifactChecksumId,
    qaPolicyId: skeletonResult.sanitizedPayload.qaPolicyId,
    cleanupPolicyId: skeletonResult.sanitizedPayload.cleanupPolicyId,
    auditRecordId: skeletonResult.sanitizedPayload.auditRecordId,
    routeExecution: false,
    workerDispatchAttempted: false,
    workerExecution: false,
    gpacMp4boxExecution: false,
    mediaProcessing: false,
    storageTransfer: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
  }
}

export function validateGpacMp4boxPrivateArtifactPolicyMockInput(
  input: GpacMp4boxPrivateArtifactPolicyMockInput,
): GpacMp4boxPrivateArtifactPolicyMockResult {
  const blockers: GpacMp4boxPrivateArtifactPolicyStatus[] = []
  const skeletonResult = validateGpacMp4boxGuardedWorkerSkeletonMockInput(input.skeletonInput)

  if (!skeletonResult.ok) pushOnce(blockers, 'blocked_worker_skeleton_invalid')
  if (input.storageTransfer || input.storageAccessMode !== 'metadata_only_no_storage_transfer') {
    pushOnce(blockers, 'blocked_storage_transfer_not_enabled')
  }
  if (input.signedUrlCreation || input.publicArtifactCreation) {
    pushOnce(blockers, 'blocked_public_or_signed_artifact_attempt')
  }
  if (
    input.routeExecution ||
    input.workerDispatchAttempted ||
    input.workerExecution ||
    input.gpacMp4boxExecution ||
    input.mediaProcessing
  ) {
    pushOnce(blockers, 'blocked_tool_or_media_execution_not_enabled')
  }
  if (!input.cleanupRequired || input.artifactScope !== 'worker_temp_private_only') {
    pushOnce(blockers, 'blocked_cleanup_policy_missing')
  }

  const ok = blockers.length === 0
  const sanitizedPolicy = createSanitizedPolicy(input, skeletonResult)

  return {
    lane: input.lane,
    policyId: input.policyId,
    ok,
    policyStatus: ok ? 'policy_registered_metadata_only' : blockers[0],
    blockers,
    skeletonResult,
    sanitizedPolicy,
    sanitizedSummary: ok
      ? 'GPAC/MP4Box private artifact policy mock is registered as metadata only; storage transfer and public delivery remain blocked.'
      : `GPAC/MP4Box private artifact policy mock blocked by ${blockers.join(', ')}.`,
    nextRequiredGate: 'TRACKA-GPAC-MP4BOX-PRIVATE-ARTIFACT-MANIFEST-MOCK-IMPLEMENTATION-1',
  }
}

export function summarizeGpacMp4boxPrivateArtifactPolicyBoundary(): string[] {
  return [
    'Private artifact policy is metadata-only and consumes the disabled worker skeleton result.',
    'Artifacts remain worker-temp private only; no storage write, signed URL, public artifact, route execution, worker execution, GPAC/MP4Box execution, or media processing is enabled.',
    'The policy requires SHA-256 checksum references, QA policy references, cleanup policy references, and audit references before a later manifest mock can be considered.',
    'The next gate must model the private artifact manifest without storage transfer or public delivery.',
  ]
}
