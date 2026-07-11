import { ApiError } from '../errors/api-error'
import type { PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { readCanonicalPrivateImageArtifact } from './canonical-private-image-artifact-storage'
import { sha256AuthorityValue } from './private-edit-authority-store'

export async function verifyCanonicalPrivateImageArtifact(input: {
  localStorageRoot: string
  artifact: PersistedArtifactResult
}) {
  const run = input.artifact.actualRunEvidence
  const contentType = input.artifact.content.contentType
  const isVerifiedSharpImage =
    run.runnerClass === 'offline_sharp_structured_execution_v1' &&
    run.toolIds.length === 1 &&
    run.toolIds[0] === 'sharp'
  const isVerifiedLibassOverlay =
    run.runnerClass === 'offline_libass_caption_execution_v1' &&
    run.toolIds.length === 1 &&
    run.toolIds[0] === 'libass' &&
    contentType === 'image/png'
  const isVerifiedBrowserGraphic =
    run.runnerClass === 'offline_browser_graphics_execution_v1' &&
    run.toolIds.length === 1 &&
    ['lottie', 'pixijs', 'konva', 'babylon_js', 'playwright'].includes(run.toolIds[0] ?? '') &&
    contentType === 'image/png'
  const isVerifiedAiCapabilityImage =
    run.runnerClass === 'offline_ai_capability_execution_v1' &&
    run.toolIds.length === 1 && run.toolIds[0] === 'kornia' && contentType === 'image/png'
  const isVerifiedNativeImagePipeline =
    run.runnerClass === 'offline_native_image_pipeline_execution_v1' &&
    run.toolIds.length === 1 && ['opencolorio', 'openimageio'].includes(run.toolIds[0] ?? '') && contentType === 'image/png'
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(contentType) ||
    input.artifact.lineage.contentType !== contentType || input.artifact.lineage.assetRole === 'final' ||
    input.artifact.placeholder.isPlaceholder || input.artifact.storageIdentity.storageKind !== 'private_local_test' ||
    input.artifact.evidenceClass !== 'private_internal_test_attested' || input.artifact.liveRuntimeEligible !== false ||
    run.state !== 'actual_run_evidence_verified_v2' || !run.actualRunVerified || run.exitCode !== 0 ||
    (!isVerifiedSharpImage && !isVerifiedLibassOverlay && !isVerifiedBrowserGraphic && !isVerifiedAiCapabilityImage && !isVerifiedNativeImagePipeline)
  ) throw invalid('Private image is not an exact verified Sharp, libass, browser graphics, or AI capability artifact.')
  const stored = await readCanonicalPrivateImageArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
    contentType: contentType as 'image/png' | 'image/jpeg' | 'image/webp',
  })
  if (!stored || stored.sha256 !== input.artifact.content.sha256 || stored.byteLength !== input.artifact.content.byteLength) {
    throw invalid('Private image bytes no longer match artifact authority.')
  }
  return {
    sha256: stored.sha256, byteLength: stored.byteLength,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
    semanticReportHash: sha256AuthorityValue({
      domain: 'canonical_private_image_lease_verification_v1',
      sha256: stored.sha256, byteLength: stored.byteLength, contentType,
      executionAttemptId: run.executionAttemptId, runnerEvidenceHash: run.runnerEvidenceHash,
      dispatchGrantId: run.dispatchGrantId, executionAttestationHash: run.executionAttestationHash,
    }),
    executionAttemptId: run.executionAttemptId,
    runnerClass: run.runnerClass,
  }
}
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_image_artifact_integrity',
  })
}
