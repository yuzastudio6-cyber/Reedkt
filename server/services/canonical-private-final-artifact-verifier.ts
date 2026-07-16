import { ApiError } from '../errors/api-error'
import { CANONICAL_PRIVATE_LONG_FORM_FINAL_ARTIFACT_TYPE } from '../../src/types/canonical-private-composition-capacity'
import type { PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { inspectCanonicalPrivateRemotionArtifact } from './canonical-private-remotion-artifact-storage'
import { sha256AuthorityValue } from './private-edit-authority-store'

export async function verifyCanonicalPrivateFinalCompositionArtifact(input: {
  localStorageRoot: string
  artifact: PersistedArtifactResult
}) {
  const run = input.artifact.actualRunEvidence
  const approvedMasterTypes = new Set([
    'private_source_caption_4k_delivery_master_v1',
    'private_source_sequence_caption_4k_delivery_master_v1',
    'private_source_caption_track_4k_delivery_master_v1',
    'private_source_sequence_caption_track_4k_delivery_master_v1',
    CANONICAL_PRIVATE_LONG_FORM_FINAL_ARTIFACT_TYPE,
  ])
  const remotionDeliveryMaster =
    run.state === 'actual_run_evidence_verified_v2' &&
    run.runnerClass === 'offline_remotion_render_execution_v1' &&
    run.toolIds.length === 1 && run.toolIds[0] === 'remotion'
  const ffmpegMezzanineDeliveryMaster =
    input.artifact.lineage.artifactType ===
      CANONICAL_PRIVATE_LONG_FORM_FINAL_ARTIFACT_TYPE &&
    run.state === 'actual_run_evidence_verified_v2' &&
    run.runnerClass === 'offline_media_binary_execution_v1' &&
    run.toolIds.length === 1 && run.toolIds[0] === 'ffmpeg'
  if (
    input.artifact.identity.expectedAssetId !== input.artifact.lineage.assetId ||
    input.artifact.lineage.contentType !== 'video/mp4' ||
    input.artifact.content.contentType !== 'video/mp4' ||
    !approvedMasterTypes.has(input.artifact.lineage.artifactType) ||
    input.artifact.lineage.assetRole !== 'final' || !input.artifact.lineage.required ||
    input.artifact.lineage.previewPlaceholderAllowed || input.artifact.placeholder.isPlaceholder ||
    input.artifact.storageIdentity.storageKind !== 'private_local_test' ||
    input.artifact.evidenceClass !== 'private_internal_test_attested' ||
    input.artifact.liveRuntimeEligible !== false ||
    run.state !== 'actual_run_evidence_verified_v2' ||
    (!remotionDeliveryMaster && !ffmpegMezzanineDeliveryMaster) ||
    !run.actualRunVerified || run.exitCode !== 0 ||
    run.toolIds.length !== 1
  ) throw invalid(
    'Private final MP4 is not an exact verified 4K delivery-master artifact.',
  )
  const stored = await inspectCanonicalPrivateRemotionArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
  })
  if (
    !stored || stored.sha256 !== input.artifact.content.sha256 ||
    stored.byteLength !== input.artifact.content.byteLength
  ) throw invalid('Private final MP4 bytes no longer match artifact authority.')
  return {
    sha256: stored.sha256,
    byteLength: stored.byteLength,
    openStream: stored.openStream,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
    semanticReportHash: sha256AuthorityValue({
      domain: 'canonical_private_4k_delivery_master_download_verification_v2',
      artifactId: input.artifact.artifactId,
      sha256: stored.sha256,
      byteLength: stored.byteLength,
      executionAttemptId: run.executionAttemptId,
      runnerEvidenceHash: run.runnerEvidenceHash,
      dispatchGrantId: run.dispatchGrantId,
      executionAttestationHash: run.executionAttestationHash,
      runnerClass: run.runnerClass,
      toolId: run.toolIds[0],
    }),
    executionAttemptId: run.executionAttemptId,
    runnerClass: ffmpegMezzanineDeliveryMaster
      ? 'offline_media_binary_execution_v1' as const
      : 'offline_remotion_render_execution_v1' as const,
  }
}

function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_final_composition_artifact_integrity',
  })
}
