import { ApiError } from '../errors/api-error'
import { isOfflinePythonStructuredJsonToolId } from '../tool-execution/python-runner-execution'
import type { PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { readCanonicalStructuredJsonArtifact } from './canonical-structured-json-artifact-storage'
import { sha256AuthorityValue } from './private-edit-authority-store'

const SUPPORTED_RUNNER_CLASSES = [
  'offline_python_structured_execution_v1',
  'offline_media_binary_execution_v1',
  'offline_ai_capability_execution_v1',
  'offline_container_packaging_validation_execution_v1',
  'offline_vapoursynth_frame_pipeline_execution_v1',
  'offline_audioflux_analysis_execution_v1',
] as const

export async function verifyCanonicalStructuredJsonArtifact(input: {
  localStorageRoot: string
  artifact: PersistedArtifactResult
}): Promise<{
  sha256: string
  byteLength: number
  privateObjectIdentityHash: string
  semanticReportHash: string
  executionAttemptId: string
  runnerClass: (typeof SUPPORTED_RUNNER_CLASSES)[number]
}> {
  const run = input.artifact.actualRunEvidence
  if (
    input.artifact.identity.expectedAssetId !== input.artifact.lineage.assetId ||
    input.artifact.lineage.contentType !== 'application/json' ||
    input.artifact.content.contentType !== 'application/json' ||
    input.artifact.lineage.assetRole === 'final' || input.artifact.placeholder.isPlaceholder ||
    input.artifact.storageIdentity.storageKind !== 'private_local_test' ||
    input.artifact.evidenceClass !== 'private_internal_test_attested' ||
    input.artifact.liveRuntimeEligible !== false ||
    run.state !== 'actual_run_evidence_verified_v2' ||
    !SUPPORTED_RUNNER_CLASSES.includes(run.runnerClass as (typeof SUPPORTED_RUNNER_CLASSES)[number]) ||
    !run.actualRunVerified || run.exitCode !== 0 || run.toolIds.length !== 1 ||
    !isSupportedToolRunnerPair(run.runnerClass, run.toolIds[0] ?? '')
  ) throw invalidArtifact('Structured JSON record is not an exact verified structured runner result.')
  const stored = await readCanonicalStructuredJsonArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
  })
  if (
    !stored || stored.sha256 !== input.artifact.content.sha256 ||
    stored.byteLength !== input.artifact.content.byteLength
  ) throw invalidArtifact('Structured JSON bytes are missing or no longer match artifact authority.')
  return {
    sha256: stored.sha256,
    byteLength: stored.byteLength,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
    semanticReportHash: sha256AuthorityValue({
      domain: 'canonical_structured_json_lease_verification_v1',
      document: stored.document,
      executionAttemptId: run.executionAttemptId,
      runnerEvidenceHash: run.runnerEvidenceHash,
      dispatchGrantId: run.dispatchGrantId,
      runtimeAuthorityHash: run.runtimeAuthorityHash,
      runtimeImageIdentityHash: run.runtimeImageIdentityHash,
      executionAttestationHash: run.executionAttestationHash,
    }),
    executionAttemptId: run.executionAttemptId,
    runnerClass: run.runnerClass as (typeof SUPPORTED_RUNNER_CLASSES)[number],
  }
}

function isSupportedToolRunnerPair(runnerClass: string, toolId: string): boolean {
  return runnerClass === 'offline_python_structured_execution_v1'
    ? isOfflinePythonStructuredJsonToolId(toolId)
    : runnerClass === 'offline_media_binary_execution_v1'
      ? toolId === 'ffprobe'
      : runnerClass === 'offline_ai_capability_execution_v1'
        ? ['torch_torchvision', 'transformers', 'music21'].includes(toolId)
        : runnerClass === 'offline_container_packaging_validation_execution_v1'
          ? ['mkvtoolnix_container_validation', 'gpac_mp4box_packaging_validation'].includes(toolId)
          : runnerClass === 'offline_vapoursynth_frame_pipeline_execution_v1'
            ? toolId === 'vapoursynth'
            : toolId === 'audioflux'
}

function invalidArtifact(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_structured_json_artifact_integrity',
  })
}
