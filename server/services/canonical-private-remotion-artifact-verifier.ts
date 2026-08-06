import { ApiError } from '../errors/api-error'
import { CANONICAL_PRIVATE_LONG_FORM_FINAL_ARTIFACT_TYPE } from '../../src/types/canonical-private-composition-capacity'
import type { PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { inspectCanonicalPrivateRemotionArtifact } from './canonical-private-remotion-artifact-storage'
import { sha256AuthorityValue } from './private-edit-authority-store'

export async function verifyCanonicalPrivateRemotionArtifact(input: {
  localStorageRoot: string
  artifact: PersistedArtifactResult
}) {
  const run = input.artifact.actualRunEvidence
  const exactPrivateCompositionChunk =
    input.artifact.lineage.assetRole === 'processed' &&
    input.artifact.lineage.artifactType === 'private_4k_composition_chunk_v1' &&
    input.artifact.lineage.required === true &&
    input.artifact.lineage.previewPlaceholderAllowed === false
  const exactPrivatePreview =
    input.artifact.lineage.assetRole !== 'final' && !exactPrivateCompositionChunk
  const exactPrivateFinalComposition =
    input.artifact.lineage.assetRole === 'final' &&
    [
      'private_source_caption_4k_delivery_master_v1',
      'private_source_sequence_caption_4k_delivery_master_v1',
      'private_source_caption_track_4k_delivery_master_v1',
      'private_source_sequence_caption_track_4k_delivery_master_v1',
    ].includes(input.artifact.lineage.artifactType) &&
    input.artifact.lineage.required === true &&
    input.artifact.lineage.previewPlaceholderAllowed === false
  const exactPrivateLongFormFinalComposition =
    input.artifact.lineage.assetRole === 'final' &&
    input.artifact.lineage.artifactType ===
      CANONICAL_PRIVATE_LONG_FORM_FINAL_ARTIFACT_TYPE &&
    input.artifact.lineage.required === true &&
    input.artifact.lineage.previewPlaceholderAllowed === false
  if (
    input.artifact.identity.expectedAssetId !== input.artifact.lineage.assetId ||
    input.artifact.lineage.contentType !== 'video/mp4' || input.artifact.content.contentType !== 'video/mp4' ||
    (!exactPrivatePreview && !exactPrivateCompositionChunk && !exactPrivateFinalComposition &&
      !exactPrivateLongFormFinalComposition) || input.artifact.placeholder.isPlaceholder ||
    input.artifact.storageIdentity.storageKind !== 'private_local_test' ||
    input.artifact.evidenceClass !== 'private_internal_test_attested' || input.artifact.liveRuntimeEligible !== false ||
    run.state !== 'actual_run_evidence_verified_v2' || run.runnerClass !== 'offline_remotion_render_execution_v1' ||
    !run.actualRunVerified || run.exitCode !== 0 || run.toolIds.length !== 1 || run.toolIds[0] !== 'remotion'
  ) throw invalid('Private MP4 is not an exact verified preview or final-composition Remotion artifact.')
  const stored = await inspectCanonicalPrivateRemotionArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
  })
  if (!stored || stored.sha256 !== input.artifact.content.sha256 || stored.byteLength !== input.artifact.content.byteLength) {
    throw invalid('Private Remotion MP4 bytes no longer match artifact authority.')
  }
  return {
    sha256: stored.sha256,
    byteLength: stored.byteLength,
    openStream: stored.openStream,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
    semanticReportHash: sha256AuthorityValue({
      domain: 'canonical_private_remotion_lease_verification_v2',
      artifactProfile: exactPrivateCompositionChunk
        ? 'private_4k_composition_chunk'
        : exactPrivateLongFormFinalComposition
        ? 'private_chunk_merged_4k_delivery_master'
        : exactPrivateFinalComposition
          ? 'private_4k_delivery_master'
          : 'private_preview',
      assetRole: input.artifact.lineage.assetRole,
      artifactType: input.artifact.lineage.artifactType,
      sha256: stored.sha256, byteLength: stored.byteLength,
      executionAttemptId: run.executionAttemptId, runnerEvidenceHash: run.runnerEvidenceHash,
      dispatchGrantId: run.dispatchGrantId, executionAttestationHash: run.executionAttestationHash,
    }),
    executionAttemptId: run.executionAttemptId,
    runnerClass: 'offline_remotion_render_execution_v1' as const,
  }
}
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_remotion_artifact_integrity',
  })
}
