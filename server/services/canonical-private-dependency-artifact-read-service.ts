import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type { CanonicalWorkerLeaseDependencyAuthority } from '../validation/canonical-worker-lease-authority-schemas'
import { verifyCanonicalStructuredJsonArtifact } from './canonical-structured-json-artifact-verifier'
import { readCanonicalStructuredJsonArtifact } from './canonical-structured-json-artifact-storage'
import { verifyCanonicalStructuredSvgArtifact } from './canonical-structured-svg-artifact-verifier'
import { readCanonicalStructuredSvgArtifact } from './canonical-structured-svg-artifact-storage'
import { verifyCanonicalPrivateImageArtifact } from './canonical-private-image-artifact-verifier'
import { readCanonicalPrivateImageArtifact } from './canonical-private-image-artifact-storage'
import { createCanonicalWorkerLeaseAuthorityService } from './canonical-worker-lease-authority-service'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import { createPrivateArtifactQaAuthorityService } from './private-artifact-qa-authority-service'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export interface CanonicalPrivateDependencyArtifactReadResult {
  bytes: Buffer
  contentType: 'image/svg+xml' | 'application/json' | 'image/png' | 'image/jpeg' | 'image/webp'
  sha256: string
  byteLength: number
  dependencyJobId: string
  expectedAssetId: string
  artifactId: string
  artifactVersion: number
  sourceExecutionAttemptId: string
  sourceLeaseImmutableHash: string
  dependencyReadEvidenceHash: string
}

/**
 * Reads one exact QA-passed dependency selected by worker-lease v2. A tool
 * caller cannot supply an artifact ID, storage identity, path, URL, or bytes.
 */
export function createCanonicalPrivateDependencyArtifactReadService(context: ServiceContext) {
  return {
    async readSingleSelectedArtifact(input: {
      workspaceId: string
      projectId: string
      editSessionId: string
      snapshotId: string
      currentJobId: string
      currentApprovedWorkItemId: string
      leaseId: string
      leaseCredential: string
      executionAttemptId: string
      dispatchGrantId: string
      dependencyAuthority: CanonicalWorkerLeaseDependencyAuthority
      allowedContentTypes: readonly ('image/svg+xml' | 'application/json' | 'image/png' | 'image/jpeg' | 'image/webp')[]
      maximumBytes: number
    }): Promise<CanonicalPrivateDependencyArtifactReadResult> {
      assertPrivateRuntime(context)
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      if (access.userId !== actorUserId) throw invalid('Dependency reader is outside this workspace.')
      if (
        input.dependencyAuthority.state !== 'private_test_dependencies_verified' ||
        input.dependencyAuthority.liveRuntimeEligible !== false ||
        input.dependencyAuthority.selectedArtifacts.length !== 1 ||
        input.maximumBytes < 1 || input.maximumBytes > 16 * 1024 * 1024
      ) throw invalid('Bounded dependency execution requires exactly one selected private artifact.')
      const verifiedLease = (await createCanonicalWorkerLeaseAuthorityService(context).verifyActive({
        workspaceId: access.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        jobId: input.currentJobId,
        purpose: 'private_internal_canonical_lease_verification',
        leaseId: input.leaseId,
        leaseCredential: input.leaseCredential,
      })).workerLeaseVerification.lease
      const currentReadiness = (await createCanonicalExecutionReadinessService(context).inspectJob({
        workspaceId: access.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        jobId: input.currentJobId,
        purpose: 'private_internal_dry_run_readiness',
      })).executionReadinessEnvelope
      if (
        verifiedLease.leaseId !== input.leaseId ||
        verifiedLease.approvedPlanSnapshotId !== input.snapshotId ||
        currentReadiness.job.approvedWorkItemId !== input.currentApprovedWorkItemId ||
        !['started', 'completed'].includes(verifiedLease.executionFence.state) ||
        verifiedLease.executionFence.executionAttemptId !== input.executionAttemptId ||
        sha256AuthorityValue(verifiedLease.dependencyAuthority) !==
          sha256AuthorityValue(input.dependencyAuthority)
      ) throw invalid('Dependency read is not bound to the active started lease execution attempt.')
      const selected = input.dependencyAuthority.selectedArtifacts[0]!
      const authority = await createPrivateArtifactQaAuthorityService(context).readArtifactAuthority({
        workspaceId: access.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        snapshotId: input.snapshotId,
        jobId: selected.dependencyJobId,
        expectedAssetId: selected.expectedAssetId,
        artifactId: selected.artifactId,
        purpose: 'read_private_artifact_qa_authority',
      })
      if (
        authority.artifact.artifactId !== selected.artifactId ||
        authority.artifact.artifactVersion !== selected.artifactVersion ||
        authority.artifact.content.sha256 !== selected.contentSha256 ||
        authority.qaEvaluation?.qaEvaluationId !== selected.qaEvaluationId ||
        authority.qaEvaluation.outcome !== 'passed' ||
        authority.reconciliation?.reconciliationId !== selected.reconciliationId ||
        authority.reconciliation.decision !== 'test_merged_not_live_authorized' ||
        !authority.reconciliation.privateTestDependencySatisfied ||
        authority.artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2' ||
        authority.artifact.actualRunEvidence.executionAttemptId !== selected.executionAttemptId ||
        authority.liveRuntimeEligible !== false ||
        !input.allowedContentTypes.includes(authority.artifact.content.contentType as CanonicalPrivateDependencyArtifactReadResult['contentType'])
      ) throw invalid('Selected dependency no longer matches immutable artifact, QA, or reconciliation authority.')

      const contentType = authority.artifact.content.contentType as CanonicalPrivateDependencyArtifactReadResult['contentType']
      const verified = contentType === 'image/svg+xml'
        ? await verifyCanonicalStructuredSvgArtifact({
            localStorageRoot: context.env.localStorageRoot,
            artifact: authority.artifact,
          })
        : contentType === 'application/json'
          ? await verifyCanonicalStructuredJsonArtifact({
              localStorageRoot: context.env.localStorageRoot,
              artifact: authority.artifact,
            })
          : await verifyCanonicalPrivateImageArtifact({
              localStorageRoot: context.env.localStorageRoot,
              artifact: authority.artifact,
            })
      if (
        verified.executionAttemptId !== selected.executionAttemptId ||
        verified.sha256 !== selected.contentSha256 ||
        verified.byteLength > input.maximumBytes
      ) throw invalid('Selected dependency failed exact private object verification.')
      const stored = contentType === 'image/svg+xml'
        ? await readCanonicalStructuredSvgArtifact({
            localStorageRoot: context.env.localStorageRoot,
            privateObjectIdentityHash: verified.privateObjectIdentityHash,
          })
        : contentType === 'application/json'
          ? await readCanonicalStructuredJsonArtifact({
              localStorageRoot: context.env.localStorageRoot,
              privateObjectIdentityHash: verified.privateObjectIdentityHash,
            })
          : await readCanonicalPrivateImageArtifact({
              localStorageRoot: context.env.localStorageRoot,
              privateObjectIdentityHash: verified.privateObjectIdentityHash,
              contentType,
            })
      if (
        !stored || stored.sha256 !== selected.contentSha256 ||
        stored.byteLength !== authority.artifact.content.byteLength ||
        stored.byteLength > input.maximumBytes
      ) throw invalid('Selected dependency bytes changed after lease verification.')
      const evidence = {
        domain: 'canonical_private_dependency_artifact_read_v1',
        workspaceId: access.workspaceId, projectId: input.projectId,
        editSessionId: input.editSessionId, snapshotId: input.snapshotId,
        currentJobId: input.currentJobId,
        currentApprovedWorkItemId: input.currentApprovedWorkItemId,
        leaseId: input.leaseId, executionAttemptId: input.executionAttemptId,
        dispatchGrantId: input.dispatchGrantId,
        dependencyAuthorityHash: input.dependencyAuthority.authorityHash,
        selection: selected,
        contentType, sha256: stored.sha256, byteLength: stored.byteLength,
        sourceLeaseImmutableHash: selected.sourceLeaseImmutableHash,
      }
      return {
        bytes: stored.bytes, contentType, sha256: stored.sha256, byteLength: stored.byteLength,
        dependencyJobId: selected.dependencyJobId,
        expectedAssetId: selected.expectedAssetId,
        artifactId: selected.artifactId,
        artifactVersion: selected.artifactVersion,
        sourceExecutionAttemptId: selected.executionAttemptId,
        sourceLeaseImmutableHash: selected.sourceLeaseImmutableHash,
        dependencyReadEvidenceHash: sha256AuthorityValue(evidence),
      }
    },
  }
}

function assertPrivateRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (!context.env.mockOnly && !context.env.allowInternalTestExecutionWithSupabase)
  ) throw new ApiError('TOOL_NOT_READY', 'Private dependency reads are internal-test only.', 503)
}
function invalid(message: string): ApiError {
  return new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'canonical_private_dependency_artifact_read',
  })
}
