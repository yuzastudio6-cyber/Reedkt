import type { Readable } from 'node:stream'

import {
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_CLASS,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_OPEN_GATES,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_STATE,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_VERSION,
  type LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifactLease,
  type LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestExecution,
  type LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestReport,
  type LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestReportDraft,
} from '../../src/types/living-frame-selected-scene-environmental-particle-scene-qa-internal-test'
import type {
  LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistedArtifactLease,
  LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReport,
} from '../../src/types/living-frame-selected-scene-environmental-particle-private-persistence-internal-test'
import type {
  LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport,
} from '../../src/types/living-frame-selected-scene-environmental-particle-remotion-full-timeline-internal-test'
import { ApiError } from '../errors/api-error'
import {
  consumeLivingFrameSelectedSceneEnvironmentalParticlePrivatePersistedArtifactLease,
  type LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistedArtifact,
} from './living-frame-selected-scene-environmental-particle-private-persistence-internal-test'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  activatePrivateOfflineMediaBinaryRuntime,
  validateOfflineFfprobeStreamingExecutionRequest,
} from '../tool-execution/media-binary-execution'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

export interface ExecuteLivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestInput {
  readonly qualificationId: string
  readonly fullTimelineReport:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport
  readonly persistenceReport:
    LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReport
  readonly privatePersistedArtifactLease:
    LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistedArtifactLease
}

export interface LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifact {
  readonly sceneQaReportDigestSha256: string
  readonly persistenceReportDigestSha256: string
  readonly privateObjectIdentityHash: string
  readonly byteLength: number
  readonly sha256: string
  readonly contentType: 'video/mp4'
  readonly openStream: () => Promise<Readable>
}

interface PrivateReviewArtifactLeaseBinding {
  readonly sceneQaReportDigestSha256: string
  readonly persistenceReportDigestSha256: string
  readonly artifact:
    LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistedArtifact
}

const privateReviewArtifactByLease =
  new WeakMap<
    LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifactLease,
    PrivateReviewArtifactLeaseBinding
  >()

export async function executeLivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTest(
  input:
    ExecuteLivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestInput,
): Promise<LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestExecution> {
  assertInput(input)
  assertFullTimelineReport(
    input.fullTimelineReport,
  )
  assertPersistenceReport(
    input.persistenceReport,
    input.fullTimelineReport,
  )
  const artifact =
    await consumeLivingFrameSelectedSceneEnvironmentalParticlePrivatePersistedArtifactLease(
      input.privatePersistedArtifactLease,
    )
  if (
    artifact.persistenceReportDigestSha256 !==
      input.persistenceReport
        .reportDigestSha256
    || artifact.privateObjectIdentityHash !==
      input.persistenceReport
        .persistedArtifact
        .privateObjectIdentityHash
    || artifact.byteLength !==
      input.persistenceReport
        .persistedArtifact.byteLength
    || artifact.sha256 !==
      input.persistenceReport
        .persistedArtifact.sha256
    || artifact.contentType !==
      input.persistenceReport
        .persistedArtifact.contentType
  ) throw invalid('Living Frame persisted particle artifact lineage is invalid for scene QA.')

  const mediaQa =
    await inspectPersistedMedia(artifact)
  const full = input.fullTimelineReport
  const persistence =
    input.persistenceReport
  const draft:
    LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestReportDraft = {
      contractVersion:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_VERSION,
      resultClass:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_CLASS,
      runtimeState:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_STATE,
      qualificationId:
        input.qualificationId,
      canonicalScope: {
        ...full.canonicalScope,
      },
      sourceBindings: {
        fullTimelineReportDigestSha256:
          full.reportDigestSha256,
        persistenceReportDigestSha256:
          persistence.reportDigestSha256,
        selectedSceneInternalTestReportDigestSha256:
          full.sourceBindings
            .selectedSceneInternalTestReportDigestSha256,
        selectedSceneBindingDigestSha256:
          full.sourceBindings
            .selectedSceneBindingDigestSha256,
        currentMasterTimingDigestSha256:
          full.sourceBindings
            .currentMasterTimingDigestSha256,
        confirmedOutputFrameDigestSha256:
          full.sourceBindings
            .confirmedOutputFrameDigestSha256,
        pixiJsRuntimeReportDigestSha256:
          full.sourceBindings
            .pixiJsRuntimeReportDigestSha256,
        pixiJsSequenceDigestSha256:
          full.sourceBindings
            .pixiJsSequenceDigestSha256,
        finalPackagedReviewDigestSha256:
          full.sourceBindings
            .finalPackagedReviewDigestSha256,
        privateObjectIdentityHash:
          persistence.persistedArtifact
            .privateObjectIdentityHash,
      },
      artifactIntegrityQa: {
        canonicalPrivateStorageReRead:
          true,
        exactByteLengthVerified: true,
        exactSha256Verified: true,
        serverInjectedPrivateStreamUsed:
          true,
        rawBytesExcludedFromReport: true,
        storagePathExcludedFromReport:
          true,
      },
      persistedMediaQa: mediaQa,
      proceduralAlphaQa: {
        exactSelectedFrameRangePreserved:
          full.aggregateMeasurement
            .exactSelectedSceneFrameRangePreserved,
        everyParticleFrameTimeSampled:
          full.aggregateMeasurement
            .everyParticleFrameTimeSampled,
        everyFrameExpectationMatched:
          full.aggregateMeasurement
            .everyFrameExpectationMatched,
        transparentEndpointsVerified:
          full.aggregateMeasurement
            .firstParticleFrameTransparentInComposite
          && full.aggregateMeasurement
            .lastParticleFrameTransparentInComposite,
        activeParticleFramesVisible:
          full.aggregateMeasurement
            .activeParticleFramesVisible,
        subPerceptualTransitionFramesPreserved:
          full.aggregateMeasurement
            .subPerceptualTransitionFramesPreserved,
        temporalVariationVerified:
          full.aggregateMeasurement
            .temporalParticleVariationVisible,
        alphaCentroidMotionVerified:
          full.aggregateMeasurement
            .alphaCentroidMotionPreserved,
        perceptibleParticleFrameCount:
          full.aggregateMeasurement
            .perceptibleParticleFrameCount,
        subPerceptualTransitionFrameCount:
          full.aggregateMeasurement
            .subPerceptualTransitionFrameCount,
      },
      destinationCompositeQa: {
        everyFinalFrameCompositedByRemotion:
          full.compositionIdentity
            .everyFinalFrameCompositedByRemotion,
        sourcePlateVisibleAcrossTimeline:
          full.aggregateMeasurement
            .sourcePlateVisibleAcrossTimeline,
        captionPlaneVisibleAboveParticlesAcrossTimeline:
          full.aggregateMeasurement
            .captionPlaneVisibleAboveParticlesAcrossTimeline,
        remotionRemainsFinalCanvas:
          full.compositionIdentity
            .remotionRemainsFinalCanvas,
        confirmedOutputRatioPreserved:
          full.compositionIdentity
            .confirmedOutputRatioPreserved,
      },
      timingQa: {
        startFrame: 30,
        endFrameExclusive: 135,
        durationFrames: 105,
        fps: 30,
        masterTimingLineageRevalidated:
          true,
      },
      sceneEvidenceDisposition: {
        genericSceneEvidencePackageContractVersion:
          'living-frame-scene-evidence-package-v1',
        genericPackageStillMarksProceduralPrimitivePending:
          true,
        actualNamespacedProceduralQaCompleted:
          true,
        sharedInterfaceConflictCode:
          'scene_evidence_v1_has_primitive_expectation_only_no_actual_procedural_qa_discharge',
        canonicalOwnerReconciliationRequired:
          true,
        noParallelSceneEvidenceOwnerCreated:
          true,
      },
      authorityBoundary: {
        privateInternalSceneQaIntegrationAuthority:
          true,
        selectedSceneAuthority: false,
        timingAuthority: false,
        workGraphAuthority: false,
        artifactPersistenceAuthority:
          false,
        assetManifestAuthority: false,
        canonicalQaApprovalAuthority:
          false,
        privateReviewAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        externalBetaAuthority: false,
        productionAuthority: false,
      },
      openGateCodes:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_SCENE_QA_INTERNAL_TEST_OPEN_GATES,
      fullTimelineReportRevalidated:
        true,
      persistenceReportRevalidated:
        true,
      privatePersistedArtifactLeaseConsumedExactlyOnce:
        true,
      privateInternalSceneQaPassed:
        true,
      canonicalQaApproved: false,
      assetManifestMutated: false,
      privateReviewEvidenceReady: true,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      containsRenderedVideoBytes: false,
      containsStoragePathUrlCredentialCommandOrEnvironment:
        false,
      externalBetaReady: false,
      productionReady: false,
    }
  const report = deepFreeze({
    ...draft,
    reportDigestSha256:
      sha256AuthorityValue(draft),
  })
  return {
    report,
    privateReviewArtifactLease:
      createPrivateReviewArtifactLease(
        report,
        artifact,
      ),
  }
}

export function consumeLivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifactLease(
  lease:
    LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifactLease,
): LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifact {
  if (
    !isRecord(lease)
    || lease.leaseClass !==
      'process_bound_single_use_selected_scene_particle_private_review_artifact_lease_v1'
    || lease.callerSerializable !== false
    || lease.assetManifestAuthority !== false
    || lease.canonicalQaApprovalAuthority !==
      false
    || lease.privateReviewApprovalAuthority !==
      false
    || lease.billingAuthority !== false
    || lease.productionAuthority !== false
  ) throw invalid('Living Frame private-review artifact lease is invalid.')
  const binding =
    privateReviewArtifactByLease.get(lease)
  if (binding == null) {
    throw invalid('Living Frame private-review artifact lease is unknown or already consumed.')
  }
  privateReviewArtifactByLease.delete(lease)
  if (
    lease.sceneQaReportDigestSha256 !==
      binding.sceneQaReportDigestSha256
    || lease.persistenceReportDigestSha256 !==
      binding.persistenceReportDigestSha256
    || lease.privateObjectIdentityHash !==
      binding.artifact
        .privateObjectIdentityHash
    || lease.expectedByteLength !==
      binding.artifact.byteLength
    || lease.sha256 !==
      binding.artifact.sha256
    || lease.contentType !==
      binding.artifact.contentType
  ) throw invalid('Living Frame private-review artifact lease lineage is invalid.')
  return Object.freeze({
    sceneQaReportDigestSha256:
      binding.sceneQaReportDigestSha256,
    persistenceReportDigestSha256:
      binding.persistenceReportDigestSha256,
    privateObjectIdentityHash:
      binding.artifact
        .privateObjectIdentityHash,
    byteLength:
      binding.artifact.byteLength,
    sha256: binding.artifact.sha256,
    contentType:
      binding.artifact.contentType,
    openStream:
      binding.artifact.openStream,
  })
}

async function inspectPersistedMedia(
  artifact:
    LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistedArtifact,
): Promise<
  LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestReportDraft['persistedMediaQa']
> {
  const runtime =
    await activatePrivateOfflineMediaBinaryRuntime()
  const request =
    validateOfflineFfprobeStreamingExecutionRequest({
      schemaVersion:
        OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
      toolId: 'ffprobe',
      operationId:
        OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
      payload: {
        inspectionProfileId:
          'final_export_v1',
        countFrames: true,
        verifyDurationAndSync: true,
        emitMachineJsonOnly: true,
        mimeType: 'video/mp4',
        sourceByteLength:
          artifact.byteLength,
        sourceSha256: artifact.sha256,
        sourceInputMode:
          OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
      },
    })
  const result =
    await runtime.executeServerInjected(
      request,
      {
        inputMode:
          'private_verified_stream_v1',
        byteLength:
          artifact.byteLength,
        sha256: artifact.sha256,
        openStream:
          artifact.openStream,
      },
    )
  if (!('resultJson' in result)) {
    throw invalid('Living Frame persisted media QA did not return machine evidence.')
  }
  const document =
    result.resultJson.document
  if (
    !isRecord(document)
    || !Array.isArray(document.streams)
  ) throw invalid('Living Frame persisted media QA evidence is invalid.')
  const video = document.streams.find(
    (stream) =>
      isRecord(stream)
      && stream.codecType === 'video',
  )
  if (
    !isRecord(video)
    || video.codecName !== 'h264'
    || video.width !== 640
    || video.height !== 360
    || video.fps !== 30
    || video.readFrameCount !== 105
    || typeof video.pixelFormat !==
      'string'
    || video.pixelFormat.length < 1
    || video.pixelFormat.length > 64
  ) throw invalid('Living Frame persisted media identity failed scene QA.')
  return {
    toolId: 'ffprobe',
    operationId:
      'tool.ffprobe.inspect_approved_media.v1',
    inspectionProfileId:
      'final_export_v1',
    actualRuntimeExecuted: true,
    codecName: 'h264',
    widthPixels: 640,
    heightPixels: 360,
    fps: 30,
    readFrameCount: 105,
    pixelFormat: video.pixelFormat,
    probeEvidenceDigestSha256:
      sha256AuthorityValue(document),
  }
}

function createPrivateReviewArtifactLease(
  report:
    LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestReport,
  artifact:
    LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistedArtifact,
): LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifactLease {
  const lease = Object.freeze({
    leaseClass:
      'process_bound_single_use_selected_scene_particle_private_review_artifact_lease_v1' as const,
    leaseId:
      `lf-particle-private-review-artifact.${sha256AuthorityValue({
        sceneQaReportDigestSha256:
          report.reportDigestSha256,
        persistenceReportDigestSha256:
          artifact
            .persistenceReportDigestSha256,
        privateObjectIdentityHash:
          artifact
            .privateObjectIdentityHash,
        sha256: artifact.sha256,
      }).slice(0, 40)}`,
    sceneQaReportDigestSha256:
      report.reportDigestSha256,
    persistenceReportDigestSha256:
      artifact
        .persistenceReportDigestSha256,
    privateObjectIdentityHash:
      artifact.privateObjectIdentityHash,
    expectedByteLength:
      artifact.byteLength,
    sha256: artifact.sha256,
    contentType: 'video/mp4' as const,
    callerSerializable: false as const,
    assetManifestAuthority: false as const,
    canonicalQaApprovalAuthority:
      false as const,
    privateReviewApprovalAuthority:
      false as const,
    billingAuthority: false as const,
    productionAuthority: false as const,
  })
  privateReviewArtifactByLease.set(
    lease,
    Object.freeze({
      sceneQaReportDigestSha256:
        report.reportDigestSha256,
      persistenceReportDigestSha256:
        artifact
          .persistenceReportDigestSha256,
      artifact,
    }),
  )
  return lease
}

function assertInput(
  input:
    ExecuteLivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestInput,
): void {
  if (
    !isRecord(input)
    || Object.keys(input).sort().join('|') !== [
      'fullTimelineReport',
      'persistenceReport',
      'privatePersistedArtifactLease',
      'qualificationId',
    ].sort().join('|')
    || typeof input.qualificationId !==
      'string'
    || !SAFE_ID.test(input.qualificationId)
    || !isRecord(input.fullTimelineReport)
    || !isRecord(input.persistenceReport)
    || !isRecord(
      input.privatePersistedArtifactLease,
    )
  ) throw invalid('Living Frame particle scene-QA input is invalid.')
}

function assertFullTimelineReport(
  report:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport,
): void {
  const {
    reportDigestSha256,
    ...draft
  } = report
  if (
    !SHA256.test(reportDigestSha256)
    || reportDigestSha256 !==
      sha256AuthorityValue(draft)
    || !report.selectedSceneBound
    || !report.canonicalTimingBound
    || !report
      .fullSelectedEnvironmentalRangeComposited
    || !report.aggregateMeasurement
      .everyFrameExpectationMatched
    || !report.aggregateMeasurement
      .captionPlaneVisibleAboveParticlesAcrossTimeline
    || !report.compositionIdentity
      .remotionRemainsFinalCanvas
    || report.artifactPersisted
    || report.qaApproved
    || report.privateReviewApproved
    || report.customerCharged
    || report.externalBetaReady
    || report.productionReady
  ) throw invalid('Living Frame full-timeline report is invalid for scene QA.')
}

function assertPersistenceReport(
  report:
    LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReport,
  full:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport,
): void {
  const {
    reportDigestSha256,
    ...draft
  } = report
  if (
    !SHA256.test(reportDigestSha256)
    || reportDigestSha256 !==
      sha256AuthorityValue(draft)
    || report.sourceBindings
      .fullTimelineReportDigestSha256 !==
      full.reportDigestSha256
    || report.persistedArtifact.sha256 !==
      full.sourceBindings
        .finalPackagedReviewDigestSha256
    || report.persistedArtifact.byteLength !==
      full.compositionIdentity
        .finalPackagedReviewByteLength
    || !sameScope(
      report.canonicalScope,
      full.canonicalScope,
    )
    || !report.artifactPersisted
    || !report.persistedArtifact
      .exactReadbackVerified
    || report.assetManifestMutated
    || report.qaApproved
    || report.privateReviewApproved
    || report.customerCharged
    || report.externalBetaReady
    || report.productionReady
  ) throw invalid('Living Frame persistence report is invalid for scene QA.')
}

function sameScope(
  left: Record<string, string>,
  right: Record<string, string>,
): boolean {
  return JSON.stringify(left) ===
    JSON.stringify(right)
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const entry of Object.values(
    value as Record<string, unknown>,
  )) deepFreeze(entry)
  return value
}

function invalid(message: string): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    message,
    409,
    {
      requiredGate:
        'living_frame_selected_scene_particle_scene_qa_internal_test',
    },
  )
}
