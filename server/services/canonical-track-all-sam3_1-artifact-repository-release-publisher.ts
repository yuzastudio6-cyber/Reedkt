import { z } from 'zod'

import type {
  SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
import {
  parseCanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
  parseCanonicalTrackAllSam31CaptionSceneEvidence,
  type CanonicalCaptionTrackAllEvidenceRepository,
  type CanonicalTrackAllSam31CaptionSceneEvidenceRepository,
} from './canonical-caption-track-all-support-service'
import type {
  CanonicalSam31GpuTaskContextRepository,
} from './canonical-sam3_1-gpu-task-context-owner'
import {
  createCanonicalTrackAllSam31ArtifactRepositoryRelease,
  canonicalTrackAllSam31ArtifactRepositoryReleaseRef,
  type CanonicalTrackAllSam31ArtifactRepositoryRelease,
  type CanonicalTrackAllSam31ArtifactRepositoryReleaseRef,
  type CanonicalTrackAllSam31ArtifactRepositoryReleaseRepository,
} from './canonical-track-all-sam3_1-artifact-repository-release'
import {
  assertCanonicalTrackAllSam31StorageQualification,
  type CanonicalTrackAllSam31StorageQualificationReadPort,
  type CanonicalTrackAllSam31StorageQualificationRef,
} from './canonical-track-all-sam3_1-storage-qualification-owner'
import {
  parseCanonicalTrackAllSam31CaptionSceneQaAuthority,
  parseCanonicalTrackAllSam31L4MaskQaMeasurement,
  parseCanonicalTrackAllSam31PrivateSceneReview,
  type CanonicalTrackAllSam31TaskQaRepository,
} from './canonical-track-all-sam3_1-task-qa-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31GpuRuntimeResultAdmission,
  type CanonicalSam31GpuRuntimeResultStore,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuTaskContext,
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_TRACK_ALL_SAM3_1_ARTIFACT_REPOSITORY_RELEASE_PUBLISHER_VERSION =
  'canonical-track-all-sam3_1-artifact-repository-release-publisher-v1' as const

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const backendRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const skillRefSchema: z.ZodType<SkillContractRef> = z.object({
  id: safeId,
  version: safeId,
  contentHash: rawSha256,
}).strict()
const requestSchema = z.object({
  releaseId: safeId,
  supportRequestRef: skillRefSchema,
  controlPlaneStateStorageQualificationRef: backendRefSchema,
  privateMaskArtifactStorageQualificationRef: backendRefSchema,
  qualifiedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((request, context) => {
  if (Date.parse(request.expiresAt) <= Date.parse(request.qualifiedAt)
    || sameBackendRef(
      request.controlPlaneStateStorageQualificationRef,
      request.privateMaskArtifactStorageQualificationRef,
    )) context.addIssue({
    code: 'custom',
    message: 'Track All artifact-repository release request is invalid.',
  })
})

export type CanonicalTrackAllSam31ArtifactRepositoryReleasePublisherRequest =
  z.infer<typeof requestSchema>

export async function publishCanonicalTrackAllSam31ArtifactRepositoryRelease(
  input: CanonicalTrackAllSam31ArtifactRepositoryReleasePublisherRequest,
  dependencies: {
    readonly taskContextRepository: CanonicalSam31GpuTaskContextRepository
    readonly taskStore: CanonicalSam31GpuTaskStore
    readonly runtimeResultStore: CanonicalSam31GpuRuntimeResultStore
    readonly taskQaRepository: CanonicalTrackAllSam31TaskQaRepository
    readonly captionSceneEvidenceRepository:
      CanonicalTrackAllSam31CaptionSceneEvidenceRepository
    readonly captionTrackAllEvidenceRepository:
      CanonicalCaptionTrackAllEvidenceRepository
    readonly storageQualificationReadPort:
      CanonicalTrackAllSam31StorageQualificationReadPort
    readonly releaseRepository:
      CanonicalTrackAllSam31ArtifactRepositoryReleaseRepository
  },
): Promise<Readonly<{
  schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_ARTIFACT_REPOSITORY_RELEASE_PUBLISHER_VERSION
  disposition: 'created' | 'identical_replay'
  release: CanonicalTrackAllSam31ArtifactRepositoryRelease
  releaseRef: CanonicalTrackAllSam31ArtifactRepositoryReleaseRef
  exactSixRepositoryChainRereadAndReplayVerified: true
  exactStorageQualificationsReread: true
  gpuJobStarted: false
  providerOrModelExecuted: false
  customerCreditsMutated: false
  qaApprovalGranted: false
  publicDeliveryAuthorized: false
  productionAuthorityGranted: false
}>> {
  assertPlainSerializedData(input, 'artifact_repository_release_request')
  const request = requestSchema.parse(input)
  assertDependencies(dependencies)

  const rawRecord = await dependencies.captionTrackAllEvidenceRepository
    .rereadBySupportRequestRef({
      supportRequestRef: request.supportRequestRef,
    })
  if (!rawRecord) throw blocked('caption_track_all_evidence_missing')
  const record = parseCanonicalCaptionTrackAllAuthenticatedEvidenceRecord(
    rawRecord,
  )
  if (!sameSkillRef(record.supportRequestRef, request.supportRequestRef)) {
    throw blocked('caption_track_all_support_request_mismatch')
  }

  const rawSceneEvidence =
    await dependencies.captionSceneEvidenceRepository.rereadByRef({
      evidenceRef: record.trackAllSceneEvidenceRef,
    })
  const rawAuthority = await dependencies.taskQaRepository.rereadAuthority({
    authorityRef: record.trackAllSceneQaAuthorityRef,
  })
  if (!rawSceneEvidence || !rawAuthority) {
    throw blocked('track_all_scene_evidence_or_qa_authority_missing')
  }
  const sceneEvidence = parseCanonicalTrackAllSam31CaptionSceneEvidence(
    rawSceneEvidence,
  )
  const authority = parseCanonicalTrackAllSam31CaptionSceneQaAuthority(
    rawAuthority,
  )
  const rawMeasurement = await dependencies.taskQaRepository
    .rereadMeasurement({ measurementRef: authority.measurementRef })
  const rawReview = await dependencies.taskQaRepository.rereadReview({
    reviewRef: authority.privateSceneReviewRef,
  })
  if (!rawMeasurement || !rawReview) {
    throw blocked('track_all_measurement_or_private_review_missing')
  }
  const measurement = parseCanonicalTrackAllSam31L4MaskQaMeasurement(
    rawMeasurement,
  )
  const review = parseCanonicalTrackAllSam31PrivateSceneReview(rawReview)

  const rawTask = await dependencies.taskStore.rereadTask(
    sceneEvidence.invocationId,
  )
  const rawResult = await dependencies.runtimeResultStore
    .rereadResultAdmission(sceneEvidence.invocationId)
  if (!rawTask || !rawResult) {
    throw blocked('sam3_1_task_or_runtime_result_missing')
  }
  const task = assertCanonicalSam31GpuTaskRecord(rawTask)
  const result = assertCanonicalSam31GpuRuntimeResultAdmission(rawResult)
  const rawContext = await dependencies.taskContextRepository
    .rereadTaskContext({ taskContextRef: task.taskContextRef })
  if (!rawContext) throw blocked('sam3_1_task_context_missing')
  const context = assertCanonicalSam31GpuTaskContext(rawContext)

  assertCanonicalChain({
    record,
    sceneEvidence,
    authority,
    measurement,
    review,
    task,
    result,
    context,
  })

  const [controlStorage, maskStorage] = await Promise.all([
    rereadStorageQualification(
      dependencies.storageQualificationReadPort,
      request.controlPlaneStateStorageQualificationRef,
      request.qualifiedAt,
      'control_plane_state',
    ),
    rereadStorageQualification(
      dependencies.storageQualificationReadPort,
      request.privateMaskArtifactStorageQualificationRef,
      request.qualifiedAt,
      'private_mask_artifacts',
    ),
  ])
  if (Date.parse(request.expiresAt) > Math.min(
    Date.parse(controlStorage.expiresAt),
    Date.parse(maskStorage.expiresAt),
  )) throw blocked('artifact_repository_release_outlives_storage_evidence')

  const persistedContextRef = await dependencies.taskContextRepository
    .persistTaskContextCreateOnly({ context })
  if (!sameBackendRef(persistedContextRef, task.taskContextRef)
    || await dependencies.taskStore.persistTaskCreateOnly(task)
      !== 'already_exists'
    || await dependencies.runtimeResultStore
      .persistResultAdmissionCreateOnly(result) !== 'already_exists'
    || await dependencies.taskQaRepository.persistMeasurementCreateOnly({
      measurement,
    }) !== 'identical_replay'
    || await dependencies.taskQaRepository.persistReviewCreateOnly({
      review,
    }) !== 'identical_replay'
    || await dependencies.taskQaRepository.persistAuthorityCreateOnly({
      authority,
    }) !== 'identical_replay'
    || await dependencies.captionSceneEvidenceRepository.persistCreateOnly({
      evidence: sceneEvidence,
    }) !== 'identical_replay'
    || await dependencies.captionTrackAllEvidenceRepository.persistCreateOnly({
      record,
    }) !== 'identical_replay') {
    throw blocked('artifact_repository_identical_replay_failed')
  }

  const release = createCanonicalTrackAllSam31ArtifactRepositoryRelease({
    schemaVersion: 'canonical-track-all-sam3_1-artifact-repository-release-v1',
    source:
      'canonical_server_track_all_sam3_1_artifact_repository_release_owner',
    evidenceClass: 'canonical_private_create_only_exact_reread',
    status: 'private_internal_qualified',
    releaseId: request.releaseId,
    releaseVersion: 1,
    componentRepositoryVersions: {
      taskContextRepository:
        'canonical-sam3_1-gpu-task-context-repository-v1',
      taskStore: 'canonical-sam3_1-gpu-task-store-v1',
      runtimeResultStore: 'canonical-sam3_1-gpu-runtime-result-store-v1',
      taskQaRepository:
        'canonical-track-all-sam3_1-task-qa-repository-v1',
      captionSceneEvidenceRepository:
        'canonical-track-all-sam3_1-caption-scene-evidence-repository-v1',
      captionTrackAllEvidenceRepository:
        'canonical-caption-track-all-evidence-repository-v2',
    },
    componentQualificationRefs: {
      taskContextRepository: task.taskContextRef,
      taskStore: backendRef(task.taskId, task.taskRecordHash),
      runtimeResultStore:
        backendRef(result.resultAdmissionId, result.resultAdmissionHash),
      taskQaRepository:
        backendRef(authority.authorityId, authority.authorityDigestSha256),
      captionSceneEvidenceRepository:
        backendRef(sceneEvidence.evidenceId,
          sceneEvidence.evidenceDigestSha256),
      captionTrackAllEvidenceRepository:
        backendRef(record.recordId, record.recordDigestSha256),
    },
    controlPlaneStateStorageRef:
      request.controlPlaneStateStorageQualificationRef,
    privateMaskArtifactStorageRef:
      request.privateMaskArtifactStorageQualificationRef,
    exactCreateOnlyConflictAndIdenticalReplayObserved: true,
    exactReadAfterWriteAndDetachedRereadObserved: true,
    exactWorkspaceSnapshotSceneOutputAndAttemptIsolationObserved: true,
    exactArtifactHashFrameRangeResultAndQaLineageRereadObserved: true,
    browserOrCallerStorageLocationAccepted: false,
    callerRepositoryVersionOrQualificationAccepted: false,
    gpuJobStarted: false,
    providerOrModelExecuted: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    qualifiedAt: request.qualifiedAt,
    expiresAt: request.expiresAt,
  })
  const disposition = await dependencies.releaseRepository.persistCreateOnly({
    release,
  })
  const releaseRef = canonicalTrackAllSam31ArtifactRepositoryReleaseRef(
    release,
  )
  const reread = await dependencies.releaseRepository.readExact({ releaseRef })
  if (!reread || stableAuthorityStringify(reread)
    !== stableAuthorityStringify(release)) {
    throw blocked('artifact_repository_release_exact_reread_failed')
  }
  if (controlStorage.qualificationHash
      === maskStorage.qualificationHash) {
    throw blocked('artifact_storage_qualification_isolation_lost')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_ARTIFACT_REPOSITORY_RELEASE_PUBLISHER_VERSION,
    disposition,
    release,
    releaseRef,
    exactSixRepositoryChainRereadAndReplayVerified: true,
    exactStorageQualificationsReread: true,
    gpuJobStarted: false,
    providerOrModelExecuted: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  })
}

function assertCanonicalChain(input: {
  readonly record: ReturnType<
    typeof parseCanonicalCaptionTrackAllAuthenticatedEvidenceRecord
  >
  readonly sceneEvidence: ReturnType<
    typeof parseCanonicalTrackAllSam31CaptionSceneEvidence
  >
  readonly authority: ReturnType<
    typeof parseCanonicalTrackAllSam31CaptionSceneQaAuthority
  >
  readonly measurement: ReturnType<
    typeof parseCanonicalTrackAllSam31L4MaskQaMeasurement
  >
  readonly review: ReturnType<
    typeof parseCanonicalTrackAllSam31PrivateSceneReview
  >
  readonly task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  readonly result: ReturnType<
    typeof assertCanonicalSam31GpuRuntimeResultAdmission
  >
  readonly context: ReturnType<typeof assertCanonicalSam31GpuTaskContext>
}): void {
  const { record, sceneEvidence, authority, measurement, review, task,
    result, context } = input
  if (task.invocationId !== sceneEvidence.invocationId
    || result.executionEnvelopeRef.id !== task.invocationId
    || authority.invocationId !== task.invocationId
    || !sameBackendRef(task.taskContextRef, context.taskContextRef)
    || !sameNativeRef(record.sam31TaskRef, task.taskId, task.taskRecordHash)
    || !sameNativeRef(sceneEvidence.taskRef,
      task.taskId, task.taskRecordHash)
    || !sameNativeRef(record.sam31RuntimeResultAdmissionRef,
      result.resultAdmissionId, result.resultAdmissionHash)
    || !sameNativeRef(sceneEvidence.runtimeResultAdmissionRef,
      result.resultAdmissionId, result.resultAdmissionHash)
    || !sameNativeRef(record.trackAllSceneQaAuthorityRef,
      authority.authorityId, authority.authorityDigestSha256)
    || !sameNativeRef(record.trackAllSceneEvidenceRef,
      sceneEvidence.evidenceId, sceneEvidence.evidenceDigestSha256)
    || !sameNativeRef(authority.measurementRef,
      measurement.measurementId, measurement.measurementDigestSha256)
    || !sameNativeRef(authority.privateSceneReviewRef,
      review.reviewId, review.reviewDigestSha256)
    || !sameNativeRef(authority.captionSceneEvidenceRef,
      sceneEvidence.evidenceId, sceneEvidence.evidenceDigestSha256)
    || !sameNativeRef(result.taskRef, task.taskId, task.taskRecordHash)
    || context.outputId !== sceneEvidence.canonicalScope.outputId
    || context.sceneId !== sceneEvidence.canonicalScope.sceneId
    || context.trackAllOrchestraBinding.supportRequestRef === null
    || !sameLooseRef(context.trackAllOrchestraBinding.supportRequestRef,
      record.backendTrackAllSupportRequestRef)) {
    throw blocked('artifact_repository_canonical_chain_mismatch')
  }
}

async function rereadStorageQualification(
  port: CanonicalTrackAllSam31StorageQualificationReadPort,
  qualificationRef: CanonicalTrackAllSam31StorageQualificationRef,
  at: string,
  role: 'control_plane_state' | 'private_mask_artifacts',
) {
  const record = await port.readExact({ qualificationRef })
  if (!record) throw blocked(`storage_qualification_missing:${role}`)
  const qualification = assertCanonicalTrackAllSam31StorageQualification(
    record,
    at,
  )
  if (qualification.role !== role) {
    throw blocked(`storage_qualification_role_mismatch:${role}`)
  }
  return qualification
}

function assertDependencies(dependencies: Parameters<
  typeof publishCanonicalTrackAllSam31ArtifactRepositoryRelease
>[1]): void {
  const required = [
    [dependencies.taskContextRepository, 'persistTaskContextCreateOnly'],
    [dependencies.taskContextRepository, 'rereadTaskContext'],
    [dependencies.taskStore, 'persistTaskCreateOnly'],
    [dependencies.taskStore, 'rereadTask'],
    [dependencies.runtimeResultStore, 'persistResultAdmissionCreateOnly'],
    [dependencies.runtimeResultStore, 'rereadResultAdmission'],
    [dependencies.taskQaRepository, 'persistMeasurementCreateOnly'],
    [dependencies.taskQaRepository, 'rereadMeasurement'],
    [dependencies.captionSceneEvidenceRepository, 'persistCreateOnly'],
    [dependencies.captionSceneEvidenceRepository, 'rereadByRef'],
    [dependencies.captionTrackAllEvidenceRepository, 'persistCreateOnly'],
    [dependencies.captionTrackAllEvidenceRepository,
      'rereadBySupportRequestRef'],
    [dependencies.storageQualificationReadPort, 'readExact'],
    [dependencies.releaseRepository, 'persistCreateOnly'],
    [dependencies.releaseRepository, 'readExact'],
  ] as const
  if (required.some(([owner, method]) => !owner
    || typeof Reflect.get(owner, method) !== 'function')) {
    throw blocked('artifact_repository_release_dependency_missing')
  }
}

function backendRef(id: string, hash: string) {
  return backendRefSchema.parse({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameBackendRef(
  left: CanonicalTrackAllSam31StorageQualificationRef,
  right: CanonicalTrackAllSam31StorageQualificationRef,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function sameSkillRef(left: SkillContractRef, right: SkillContractRef): boolean {
  return sameLooseRef(left, right)
}

function sameLooseRef(
  left: { readonly id: string; readonly version: string | number;
    readonly contentHash: string },
  right: { readonly id: string; readonly version: string | number;
    readonly contentHash: string },
): boolean {
  return left.id === right.id && String(left.version) === String(right.version)
    && stripSha(left.contentHash) === stripSha(right.contentHash)
}

function sameNativeRef(
  ref: { readonly id: string; readonly contentHash: string },
  id: string,
  hash: string,
): boolean {
  return ref.id === id && stripSha(ref.contentHash) === stripSha(hash)
}

function stripSha(value: string): string {
  return value.startsWith('sha256:') ? value.slice(7) : value
}

function blocked(code: string): Error {
  return new Error(`Track All artifact-repository release blocked: ${code}.`)
}
