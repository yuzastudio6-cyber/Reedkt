import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'

import { ApiError } from '../errors/api-error'
import { readPrivateFileIfExistsWithinRoot } from '../security/private-local-persistence'
import type { ServiceContext } from '../types'
import type { CanonicalWorkerLeaseDependencyAuthority } from '../validation/canonical-worker-lease-authority-schemas'
import { verifyCanonicalStructuredJsonArtifact } from './canonical-structured-json-artifact-verifier'
import { readCanonicalStructuredJsonArtifact } from './canonical-structured-json-artifact-storage'
import { verifyCanonicalStructuredSvgArtifact } from './canonical-structured-svg-artifact-verifier'
import { readCanonicalStructuredSvgArtifact } from './canonical-structured-svg-artifact-storage'
import { verifyCanonicalPrivateImageArtifact } from './canonical-private-image-artifact-verifier'
import { readCanonicalPrivateImageArtifact } from './canonical-private-image-artifact-storage'
import { verifyCanonicalPrivateAudioArtifact } from './canonical-private-audio-artifact-verifier'
import {
  CANONICAL_PRIVATE_AUDIO_STREAMING_MAXIMUM_BYTES,
  readCanonicalPrivateAudioArtifact,
} from './canonical-private-audio-artifact-storage'
import { verifyCanonicalPrivateRemotionArtifact } from './canonical-private-remotion-artifact-verifier'
import { verifyCanonicalPrivateFinalCompositionArtifact } from './canonical-private-final-artifact-verifier'
import { CANONICAL_PRIVATE_REMOTION_STREAMING_MAXIMUM_BYTES } from './canonical-private-remotion-artifact-storage'
import { readCanonicalPrivateRemotionArtifact } from './canonical-private-remotion-artifact-storage'
import { verifyCanonicalPrivateMediaArtifact } from './canonical-private-media-artifact-verifier'
import { CANONICAL_PRIVATE_MEDIA_STREAMING_MAXIMUM_BYTES } from './canonical-private-media-artifact-storage'
import { readCanonicalPrivateMediaArtifact } from './canonical-private-media-artifact-storage'
import { createCanonicalWorkerLeaseAuthorityService } from './canonical-worker-lease-authority-service'
import { createCanonicalExecutionReadinessService } from './canonical-execution-readiness-service'
import { createPrivateArtifactQaAuthorityService } from './private-artifact-qa-authority-service'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'
import {
  canonicalInternalAuthorityArtifactRelativePath,
  verifyCanonicalInternalAuthorityArtifact,
} from './canonical-internal-authority-artifact-verifier'
import {
  verifyCanonicalPrivateProviderOutputArtifact,
  type VerifiedCanonicalPrivateProviderOutputArtifact,
} from './canonical-private-provider-output-artifact-verifier'

type WithoutProviderBytes<T> = T extends unknown ? Omit<T, 'bytes'> : never
export type CanonicalPrivateDependencyProviderOutputEvidence =
  WithoutProviderBytes<VerifiedCanonicalPrivateProviderOutputArtifact>

export interface CanonicalPrivateDependencyArtifactReadResult {
  bytes: Buffer
  contentType:
    | 'image/svg+xml'
    | 'application/json'
    | 'image/png'
    | 'image/jpeg'
    | 'image/webp'
    | 'video/mp4'
    | 'video/x-nut'
    | 'video/x-matroska'
    | 'audio/mpeg'
    | 'audio/wav'
  sha256: string
  byteLength: number
  dependencyJobId: string
  expectedAssetId: string
  artifactId: string
  artifactVersion: number
  sourceExecutionAttemptId: string
  sourceLeaseImmutableHash: string
  dependencyReadEvidenceHash: string
  providerOutputEvidence?: CanonicalPrivateDependencyProviderOutputEvidence
}

export interface CanonicalPrivateDependencyArtifactStreamReadResult {
  inputMode: 'private_verified_stream_v1'
  contentType: 'video/mp4' | 'video/x-nut' | 'video/x-matroska' | 'audio/mpeg' | 'audio/wav'
  sha256: string
  byteLength: number
  dependencyJobId: string
  expectedAssetId: string
  artifactId: string
  artifactVersion: number
  sourceExecutionAttemptId: string
  sourceLeaseImmutableHash: string
  dependencyReadEvidenceHash: string
  providerOutputEvidence?: CanonicalPrivateDependencyProviderOutputEvidence
  openStream(): Promise<Readable>
}

type CanonicalPrivateDependencyContentType = CanonicalPrivateDependencyArtifactReadResult['contentType']

interface CanonicalPrivateDependencyArtifactReadInput {
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
  allowedContentTypes: readonly CanonicalPrivateDependencyContentType[]
  maximumBytes: number
  selectedArtifactIndex?: number
}

/**
 * Reads one exact QA-passed dependency selected by worker-lease v2. A tool
 * caller cannot supply an artifact ID, storage identity, path, URL, or bytes.
 */
export function createCanonicalPrivateDependencyArtifactReadService(context: ServiceContext) {
  return {
    async readSingleSelectedArtifact(
      input: CanonicalPrivateDependencyArtifactReadInput,
    ): Promise<CanonicalPrivateDependencyArtifactReadResult> {
      const {
        selectedArtifactIndex,
        selected,
        authority,
        internalAuthorityArtifact,
        providerOutputArtifact,
        contentType,
      } =
        await authorizeSingleSelectedArtifact(context, input, 16 * 1024 * 1024)
      if (providerOutputArtifact) {
        const verified = await verifyCanonicalPrivateProviderOutputArtifact({
          localStorageRoot: context.env.localStorageRoot,
          ownerUserId: getRequiredAuthUserId(context),
          artifact: authority.artifact,
        })
        if (
          verified.executionAttemptId !== selected.executionAttemptId ||
          verified.sha256 !== selected.contentSha256 ||
          verified.byteLength !== authority.artifact.content.byteLength ||
          verified.byteLength > input.maximumBytes ||
          verified.contentType !== contentType
        ) throw invalid('Selected provider dependency failed exact private object verification.')
        const providerOutputEvidence = withoutProviderBytes(verified)
        const evidence = {
          domain: 'canonical_private_provider_dependency_artifact_read_v1',
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          snapshotId: input.snapshotId,
          currentJobId: input.currentJobId,
          currentApprovedWorkItemId: input.currentApprovedWorkItemId,
          leaseId: input.leaseId,
          executionAttemptId: input.executionAttemptId,
          dispatchGrantId: input.dispatchGrantId,
          dependencyAuthorityHash: input.dependencyAuthority.authorityHash,
          selectedArtifactIndex,
          selectedArtifactCount: input.dependencyAuthority.selectedArtifacts.length,
          selection: selected,
          contentType,
          sha256: verified.sha256,
          byteLength: verified.byteLength,
          sourceLeaseImmutableHash: selected.sourceLeaseImmutableHash,
          providerOutputEvidence,
        }
        return {
          bytes: verified.bytes,
          contentType,
          sha256: verified.sha256,
          byteLength: verified.byteLength,
          dependencyJobId: selected.dependencyJobId,
          expectedAssetId: selected.expectedAssetId,
          artifactId: selected.artifactId,
          artifactVersion: selected.artifactVersion,
          sourceExecutionAttemptId: selected.executionAttemptId,
          sourceLeaseImmutableHash: selected.sourceLeaseImmutableHash,
          dependencyReadEvidenceHash: sha256AuthorityValue(evidence),
          providerOutputEvidence,
        }
      }
      if (contentType === 'audio/mpeg') {
        throw invalid('MPEG audio is admitted only as an exact provider-output dependency.')
      }
      const verified = contentType === 'image/svg+xml'
        ? await verifyCanonicalStructuredSvgArtifact({
            localStorageRoot: context.env.localStorageRoot,
            artifact: authority.artifact,
          })
        : contentType === 'video/mp4'
          ? await verifyCanonicalPrivateMp4DependencyArtifact({
              localStorageRoot: context.env.localStorageRoot,
              artifact: authority.artifact,
            })
          : contentType === 'video/x-nut' || contentType === 'video/x-matroska'
          ? await verifyCanonicalPrivateMediaArtifact({
              localStorageRoot: context.env.localStorageRoot,
              artifact: authority.artifact,
            })
          : contentType === 'audio/wav'
          ? await verifyCanonicalPrivateAudioArtifact({
              localStorageRoot: context.env.localStorageRoot,
              artifact: authority.artifact,
            })
          : contentType === 'application/json' && internalAuthorityArtifact
          ? await verifyCanonicalInternalAuthorityArtifact({
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
        : contentType === 'video/mp4'
          ? await readCanonicalPrivateRemotionArtifact({
              localStorageRoot: context.env.localStorageRoot,
              privateObjectIdentityHash: verified.privateObjectIdentityHash,
            })
          : contentType === 'video/x-nut' || contentType === 'video/x-matroska'
          ? await readCanonicalPrivateMediaArtifact({
              localStorageRoot: context.env.localStorageRoot,
              privateObjectIdentityHash: verified.privateObjectIdentityHash,
            })
          : contentType === 'audio/wav'
          ? await readCanonicalPrivateAudioArtifact({
              localStorageRoot: context.env.localStorageRoot,
              privateObjectIdentityHash: verified.privateObjectIdentityHash,
            })
          : contentType === 'application/json' && internalAuthorityArtifact
          ? await readInternalAuthorityArtifact({
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
        workspaceId: input.workspaceId, projectId: input.projectId,
        editSessionId: input.editSessionId, snapshotId: input.snapshotId,
        currentJobId: input.currentJobId,
        currentApprovedWorkItemId: input.currentApprovedWorkItemId,
        leaseId: input.leaseId, executionAttemptId: input.executionAttemptId,
        dispatchGrantId: input.dispatchGrantId,
        dependencyAuthorityHash: input.dependencyAuthority.authorityHash,
        selectedArtifactIndex,
        selectedArtifactCount: input.dependencyAuthority.selectedArtifacts.length,
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
    async readSingleSelectedArtifactStream(
      input: CanonicalPrivateDependencyArtifactReadInput,
    ): Promise<CanonicalPrivateDependencyArtifactStreamReadResult> {
      const {
        selectedArtifactIndex,
        selected,
        authority,
        providerOutputArtifact,
        contentType,
      } =
        await authorizeSingleSelectedArtifact(
          context,
          input,
          CANONICAL_PRIVATE_REMOTION_STREAMING_MAXIMUM_BYTES,
        )
      if (!['video/mp4', 'video/x-nut', 'video/x-matroska', 'audio/mpeg', 'audio/wav'].includes(contentType)) {
        throw invalid('Streaming dependency reads are restricted to exact private media or audio artifacts.')
      }
      if (providerOutputArtifact) {
        const verified = await verifyCanonicalPrivateProviderOutputArtifact({
          localStorageRoot: context.env.localStorageRoot,
          ownerUserId: getRequiredAuthUserId(context),
          artifact: authority.artifact,
        })
        if (
          (verified.contentType !== 'audio/mpeg' &&
            verified.contentType !== 'video/mp4') ||
          verified.executionAttemptId !== selected.executionAttemptId ||
          verified.sha256 !== selected.contentSha256 ||
          verified.byteLength !== authority.artifact.content.byteLength ||
          verified.byteLength > input.maximumBytes ||
          verified.byteLength > (verified.contentType === 'video/mp4'
            ? 67_108_864
            : 16 * 1024 * 1024)
        ) throw invalid('Selected provider media dependency failed exact private object verification.')
        const providerOutputEvidence = withoutProviderBytes(verified)
        const evidence = {
          domain: 'canonical_private_provider_dependency_artifact_stream_read_v1',
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          snapshotId: input.snapshotId,
          currentJobId: input.currentJobId,
          currentApprovedWorkItemId: input.currentApprovedWorkItemId,
          leaseId: input.leaseId,
          executionAttemptId: input.executionAttemptId,
          dispatchGrantId: input.dispatchGrantId,
          dependencyAuthorityHash: input.dependencyAuthority.authorityHash,
          selectedArtifactIndex,
          selectedArtifactCount: input.dependencyAuthority.selectedArtifacts.length,
          selection: selected,
          contentType,
          sha256: verified.sha256,
          byteLength: verified.byteLength,
          sourceLeaseImmutableHash: selected.sourceLeaseImmutableHash,
          inputMode: 'private_verified_stream_v1' as const,
          maximumBytes: input.maximumBytes,
          providerOutputEvidence,
        }
        return {
          inputMode: 'private_verified_stream_v1',
          contentType: verified.contentType,
          sha256: verified.sha256,
          byteLength: verified.byteLength,
          dependencyJobId: selected.dependencyJobId,
          expectedAssetId: selected.expectedAssetId,
          artifactId: selected.artifactId,
          artifactVersion: selected.artifactVersion,
          sourceExecutionAttemptId: selected.executionAttemptId,
          sourceLeaseImmutableHash: selected.sourceLeaseImmutableHash,
          dependencyReadEvidenceHash: sha256AuthorityValue(evidence),
          providerOutputEvidence,
          openStream: async () => Readable.from(verified.bytes),
        }
      }
      const verified = contentType === 'video/mp4'
        ? await verifyCanonicalPrivateMp4DependencyArtifact({
            localStorageRoot: context.env.localStorageRoot,
            artifact: authority.artifact,
          })
        : contentType === 'audio/wav'
          ? await verifyCanonicalPrivateAudioArtifact({
              localStorageRoot: context.env.localStorageRoot,
              artifact: authority.artifact,
            })
          : await verifyCanonicalPrivateMediaArtifact({
              localStorageRoot: context.env.localStorageRoot,
              artifact: authority.artifact,
            })
      const formatMaximum = contentType === 'video/mp4'
        ? CANONICAL_PRIVATE_REMOTION_STREAMING_MAXIMUM_BYTES
        : contentType === 'audio/wav'
          ? CANONICAL_PRIVATE_AUDIO_STREAMING_MAXIMUM_BYTES
          : CANONICAL_PRIVATE_MEDIA_STREAMING_MAXIMUM_BYTES
      if (
        verified.executionAttemptId !== selected.executionAttemptId ||
        verified.sha256 !== selected.contentSha256 ||
        verified.byteLength !== authority.artifact.content.byteLength ||
        verified.byteLength > input.maximumBytes ||
        verified.byteLength > formatMaximum
      ) throw invalid('Selected streaming dependency failed exact private object verification.')
      const evidence = {
        domain: 'canonical_private_dependency_artifact_stream_read_v1',
        workspaceId: input.workspaceId, projectId: input.projectId,
        editSessionId: input.editSessionId, snapshotId: input.snapshotId,
        currentJobId: input.currentJobId,
        currentApprovedWorkItemId: input.currentApprovedWorkItemId,
        leaseId: input.leaseId, executionAttemptId: input.executionAttemptId,
        dispatchGrantId: input.dispatchGrantId,
        dependencyAuthorityHash: input.dependencyAuthority.authorityHash,
        selectedArtifactIndex,
        selectedArtifactCount: input.dependencyAuthority.selectedArtifacts.length,
        selection: selected,
        contentType, sha256: verified.sha256, byteLength: verified.byteLength,
        sourceLeaseImmutableHash: selected.sourceLeaseImmutableHash,
        inputMode: 'private_verified_stream_v1' as const,
        maximumBytes: input.maximumBytes,
      }
      return {
        inputMode: 'private_verified_stream_v1',
        contentType: contentType as CanonicalPrivateDependencyArtifactStreamReadResult['contentType'],
        sha256: verified.sha256,
        byteLength: verified.byteLength,
        dependencyJobId: selected.dependencyJobId,
        expectedAssetId: selected.expectedAssetId,
        artifactId: selected.artifactId,
        artifactVersion: selected.artifactVersion,
        sourceExecutionAttemptId: selected.executionAttemptId,
        sourceLeaseImmutableHash: selected.sourceLeaseImmutableHash,
        dependencyReadEvidenceHash: sha256AuthorityValue(evidence),
        openStream: verified.openStream,
      }
    },
  }
}

async function authorizeSingleSelectedArtifact(
  context: ServiceContext,
  input: CanonicalPrivateDependencyArtifactReadInput,
  maximumAllowedBytes: number,
) {
  assertPrivateRuntime(context)
  const actorUserId = getRequiredAuthUserId(context)
  const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
  if (access.userId !== actorUserId) throw invalid('Dependency reader is outside this workspace.')
  const selectedArtifactIndex = input.selectedArtifactIndex ?? 0
  if (
    input.dependencyAuthority.state !== 'private_test_dependencies_verified' ||
    input.dependencyAuthority.liveRuntimeEligible !== false ||
    input.dependencyAuthority.selectedArtifacts.length < 1 ||
    input.dependencyAuthority.selectedArtifacts.length > 24 ||
    (input.selectedArtifactIndex === undefined &&
      input.dependencyAuthority.selectedArtifacts.length !== 1) ||
    !Number.isSafeInteger(selectedArtifactIndex) || selectedArtifactIndex < 0 ||
    selectedArtifactIndex >= input.dependencyAuthority.selectedArtifacts.length ||
    !Number.isSafeInteger(input.maximumBytes) || input.maximumBytes < 1 ||
    input.maximumBytes > maximumAllowedBytes ||
    input.allowedContentTypes.length < 1 || input.allowedContentTypes.length > 10 ||
    new Set(input.allowedContentTypes).size !== input.allowedContentTypes.length
  ) throw invalid('Bounded dependency execution requires an exact server-selected private artifact.')
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
  const selected = input.dependencyAuthority.selectedArtifacts[selectedArtifactIndex]!
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
  const internalAuthorityArtifact = [
    'authority_validation_evidence',
    'source_trim_validation_evidence',
    'living_frame_remotion_layer_manifest',
  ].includes(authority.artifact.lineage.artifactType)
  const contentType = authority.artifact.content.contentType as CanonicalPrivateDependencyContentType
  const providerOutputArtifact =
    authority.artifact.actualRunEvidence.state ===
      'actual_provider_attempt_receipt_verified_v1'
  if (
    authority.artifact.artifactId !== selected.artifactId ||
    authority.artifact.artifactVersion !== selected.artifactVersion ||
    authority.artifact.content.sha256 !== selected.contentSha256 ||
    authority.qaEvaluation?.qaEvaluationId !== selected.qaEvaluationId ||
    authority.qaEvaluation.outcome !== 'passed' ||
    authority.reconciliation?.reconciliationId !== selected.reconciliationId ||
    authority.reconciliation.decision !== 'test_merged_not_live_authorized' ||
    !authority.reconciliation.privateTestDependencySatisfied ||
    (!internalAuthorityArtifact &&
      !providerOutputArtifact &&
      authority.artifact.actualRunEvidence.state !== 'actual_run_evidence_verified_v2') ||
    (internalAuthorityArtifact &&
      authority.artifact.actualRunEvidence.state !== 'actual_run_evidence_placeholder') ||
    (providerOutputArtifact &&
      !['audio/mpeg', 'application/json', 'video/mp4'].includes(contentType)) ||
    authority.artifact.actualRunEvidence.executionAttemptId !== selected.executionAttemptId ||
    authority.liveRuntimeEligible !== false ||
    !input.allowedContentTypes.includes(contentType)
  ) throw invalid('Selected dependency no longer matches immutable artifact, QA, or reconciliation authority.')
  return {
    selectedArtifactIndex,
    selected,
    authority,
    internalAuthorityArtifact,
    providerOutputArtifact,
    contentType,
  }
}

function withoutProviderBytes(
  verified: VerifiedCanonicalPrivateProviderOutputArtifact,
): CanonicalPrivateDependencyProviderOutputEvidence {
  const { bytes, ...evidence } = verified
  void bytes
  return evidence as CanonicalPrivateDependencyProviderOutputEvidence
}

async function readInternalAuthorityArtifact(input: {
  localStorageRoot: string
  privateObjectIdentityHash: string
}): Promise<{ bytes: Buffer; sha256: string; byteLength: number } | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: canonicalInternalAuthorityArtifactRelativePath(input.privateObjectIdentityHash),
  })
  if (!bytes) return undefined
  return {
    bytes,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    byteLength: bytes.byteLength,
  }
}

async function verifyCanonicalPrivateMp4DependencyArtifact(
  input: Parameters<typeof verifyCanonicalPrivateRemotionArtifact>[0],
) {
  return input.artifact.lineage.assetRole === 'final'
    ? verifyCanonicalPrivateFinalCompositionArtifact(input)
    : verifyCanonicalPrivateRemotionArtifact(input)
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
