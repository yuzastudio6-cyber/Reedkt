import { ApiError } from '../errors/api-error'
import type { PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { inspectCanonicalPrivateMediaArtifact } from './canonical-private-media-artifact-storage'
import { sha256AuthorityValue } from './private-edit-authority-store'

export async function verifyCanonicalPrivateMediaArtifact(input: {
  localStorageRoot: string
  artifact: PersistedArtifactResult
}) {
  const run = input.artifact.actualRunEvidence
  const contentType = input.artifact.lineage.contentType
  if (
    input.artifact.identity.expectedAssetId !== input.artifact.lineage.assetId ||
    (contentType !== 'video/x-nut' && contentType !== 'video/x-matroska') ||
    input.artifact.content.contentType !== contentType ||
    input.artifact.lineage.assetRole === 'final' || input.artifact.placeholder.isPlaceholder ||
    input.artifact.storageIdentity.storageKind !== 'private_local_test' ||
    input.artifact.evidenceClass !== 'private_internal_test_attested' ||
    input.artifact.liveRuntimeEligible !== false ||
    run.state !== 'actual_run_evidence_verified_v2' ||
    run.runnerClass !== 'offline_media_binary_execution_v1' ||
    !run.actualRunVerified || run.exitCode !== 0 ||
    run.toolIds.length !== 1 || run.toolIds[0] !== 'ffmpeg'
  ) throw invalid('Private media artifact is not an exact verified FFmpeg result.')
  const stored = await inspectCanonicalPrivateMediaArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
  })
  if (
    !stored || stored.sha256 !== input.artifact.content.sha256 ||
    stored.byteLength !== input.artifact.content.byteLength ||
    stored.mediaFormat !== (contentType === 'video/x-nut' ? 'nut' : 'mkv')
  ) throw invalid('Private media artifact bytes no longer match artifact authority.')
  return {
    sha256: stored.sha256, byteLength: stored.byteLength,
    openStream: stored.openStream,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
    semanticReportHash: sha256AuthorityValue({
      domain: 'canonical_private_media_lease_verification_v1',
      sha256: stored.sha256, byteLength: stored.byteLength,
      executionAttemptId: run.executionAttemptId, runnerEvidenceHash: run.runnerEvidenceHash,
      dispatchGrantId: run.dispatchGrantId, executionAttestationHash: run.executionAttestationHash,
    }),
    executionAttemptId: run.executionAttemptId,
    runnerClass: 'offline_media_binary_execution_v1' as const,
  }
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_media_artifact_integrity',
  })
}
