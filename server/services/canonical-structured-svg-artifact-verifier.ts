import { ApiError } from '../errors/api-error'
import { isOfflineNodeSvgRunnerToolId } from '../tool-execution/node-runners/offline-node-runner-tool-ids'
import type { PersistedArtifactResult } from '../validation/private-artifact-qa-authority-schemas'
import { readCanonicalStructuredSvgArtifact } from './canonical-structured-svg-artifact-storage'
import { isCanonicalStructuredSvgSafe } from './canonical-structured-svg-safety-policy'
import { sha256AuthorityValue } from './private-edit-authority-store'

const RUNNER_CLASS = 'offline_node_structured_execution_v1' as const

export interface VerifiedCanonicalStructuredSvgArtifact {
  sha256: string
  byteLength: number
  privateObjectIdentityHash: string
  semanticReportHash: string
  executionAttemptId: string
  runnerClass: typeof RUNNER_CLASS
}

export async function verifyCanonicalStructuredSvgArtifact(input: {
  localStorageRoot: string
  artifact: PersistedArtifactResult
}): Promise<VerifiedCanonicalStructuredSvgArtifact> {
  const run = input.artifact.actualRunEvidence
  if (
    input.artifact.identity.expectedAssetId !== input.artifact.lineage.assetId ||
    input.artifact.lineage.contentType !== 'image/svg+xml' ||
    input.artifact.content.contentType !== 'image/svg+xml' ||
    input.artifact.lineage.assetRole === 'final' ||
    input.artifact.placeholder.isPlaceholder ||
    input.artifact.storageIdentity.storageKind !== 'private_local_test' ||
    input.artifact.evidenceClass !== 'private_internal_test_attested' ||
    input.artifact.liveRuntimeEligible !== false ||
    run.state !== 'actual_run_evidence_verified_v2' ||
    run.runnerClass !== RUNNER_CLASS ||
    !run.actualRunVerified ||
    run.exitCode !== 0 ||
    run.toolIds.length !== 1 ||
    !isOfflineNodeSvgRunnerToolId(run.toolIds[0] ?? '')
  ) {
    throw invalidArtifact('Private structured SVG record is not an exact verified runner result.')
  }
  const stored = await readCanonicalStructuredSvgArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
  })
  if (
    !stored ||
    stored.sha256 !== input.artifact.content.sha256 ||
    stored.byteLength !== input.artifact.content.byteLength
  ) {
    throw invalidArtifact('Private structured SVG bytes are missing or no longer match artifact authority.')
  }
  const svg = stored.bytes.toString('utf8')
  if (!isCanonicalStructuredSvgSafe(svg)) {
    throw invalidArtifact('Private structured SVG failed lease-time active-content verification.')
  }
  return {
    sha256: stored.sha256,
    byteLength: stored.byteLength,
    privateObjectIdentityHash: input.artifact.storageIdentity.opaqueObjectIdentityHash,
    semanticReportHash: sha256AuthorityValue({
      domain: 'canonical_structured_svg_lease_verification_v1',
      artifactId: input.artifact.artifactId,
      contentSha256: stored.sha256,
      executionAttemptId: run.executionAttemptId,
      runnerEvidenceHash: run.runnerEvidenceHash,
      dispatchGrantId: run.dispatchGrantId,
      runtimeAuthorityHash: run.runtimeAuthorityHash,
      runtimeImageIdentityHash: run.runtimeImageIdentityHash,
      executionAttestationHash: run.executionAttestationHash,
    }),
    executionAttemptId: run.executionAttemptId,
    runnerClass: RUNNER_CLASS,
  }
}

function invalidArtifact(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_structured_svg_artifact_integrity',
  })
}
