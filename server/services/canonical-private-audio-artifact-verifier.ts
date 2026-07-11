import { ApiError } from '../errors/api-error'
import { isOfflinePythonAudioWavToolId } from '../tool-execution/python-runner-execution'
import type { PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { readCanonicalPrivateAudioArtifact } from './canonical-private-audio-artifact-storage'
import { sha256AuthorityValue } from './private-edit-authority-store'

export async function verifyCanonicalPrivateAudioArtifact(input: {
  localStorageRoot: string
  artifact: PersistedArtifactResult
}) {
  const run = input.artifact.actualRunEvidence
  const isVerifiedPythonAudio =
    run.runnerClass === 'offline_python_structured_execution_v1' &&
    run.toolIds.length === 1 && isOfflinePythonAudioWavToolId(run.toolIds[0] ?? '')
  const isVerifiedNativeAudio =
    run.runnerClass === 'offline_native_audio_processing_execution_v1' &&
    run.toolIds.length === 1 && ['rnnoise', 'signalsmith_stretch'].includes(run.toolIds[0] ?? '')
  const isVerifiedDeepFilterNet =
    run.runnerClass === 'offline_deepfilternet_voice_cleanup_execution_v1' &&
    run.toolIds.length === 1 && run.toolIds[0] === 'deepfilternet'
  if (
    input.artifact.identity.expectedAssetId !== input.artifact.lineage.assetId ||
    input.artifact.lineage.contentType !== 'audio/wav' || input.artifact.content.contentType !== 'audio/wav' ||
    input.artifact.lineage.assetRole === 'final' || input.artifact.placeholder.isPlaceholder ||
    input.artifact.storageIdentity.storageKind !== 'private_local_test' ||
    input.artifact.evidenceClass !== 'private_internal_test_attested' || input.artifact.liveRuntimeEligible !== false ||
    run.state !== 'actual_run_evidence_verified_v2' || !run.actualRunVerified || run.exitCode !== 0 ||
    (!isVerifiedPythonAudio && !isVerifiedNativeAudio && !isVerifiedDeepFilterNet)
  ) throw invalid('Private audio is not an exact verified bounded Python, native audio, or DeepFilterNet artifact.')
  const stored = await readCanonicalPrivateAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
  })
  if (!stored || stored.sha256 !== input.artifact.content.sha256 || stored.byteLength !== input.artifact.content.byteLength) {
    throw invalid('Private audio bytes no longer match artifact authority.')
  }
  return {
    sha256: stored.sha256, byteLength: stored.byteLength,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
    semanticReportHash: sha256AuthorityValue({
      domain: 'canonical_private_audio_lease_verification_v1',
      sha256: stored.sha256, byteLength: stored.byteLength, contentType: 'audio/wav',
      executionAttemptId: run.executionAttemptId, runnerEvidenceHash: run.runnerEvidenceHash,
      dispatchGrantId: run.dispatchGrantId, executionAttestationHash: run.executionAttestationHash,
    }),
    executionAttemptId: run.executionAttemptId,
    runnerClass: run.runnerClass as 'offline_python_structured_execution_v1' | 'offline_native_audio_processing_execution_v1' | 'offline_deepfilternet_voice_cleanup_execution_v1',
  }
}
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_audio_artifact_integrity',
  })
}
