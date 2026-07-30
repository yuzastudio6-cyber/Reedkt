import { Readable } from 'node:stream'

import {
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_CLASS,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_OPEN_GATES,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_STATE,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_VERSION,
  type LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReport,
  type LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReportDraft,
} from '../../src/types/living-frame-selected-scene-environmental-particle-private-persistence-internal-test'
import type {
  LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport,
  LivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease,
} from '../../src/types/living-frame-selected-scene-environmental-particle-remotion-full-timeline-internal-test'
import { ApiError } from '../errors/api-error'
import {
  inspectCanonicalPrivateRemotionArtifact,
  persistCanonicalPrivateRemotionArtifactStream,
} from '../services/canonical-private-remotion-artifact-storage'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  consumeLivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease,
} from './living-frame-environmental-particle-remotion-internal-composite'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

export interface ExecuteLivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestInput {
  readonly qualificationId: string
  readonly localStorageRoot: string
  readonly fullTimelineReport:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport
  readonly privateReviewOutputLease:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease
}

export async function executeLivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTest(
  input:
    ExecuteLivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestInput,
): Promise<LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReport> {
  assertInput(input)
  assertFullTimelineReport(
    input.fullTimelineReport,
  )
  const output =
    consumeLivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease(
      input.privateReviewOutputLease,
    )
  if (
    output.reportDigestSha256 !==
      input.fullTimelineReport
        .reportDigestSha256
    || output.finalPackagedReviewDigestSha256 !==
      input.fullTimelineReport.sourceBindings
        .finalPackagedReviewDigestSha256
    || output.expectedByteLength !==
      input.fullTimelineReport
        .compositionIdentity
        .finalPackagedReviewByteLength
    || output.contentType !== 'video/mp4'
  ) throw invalid('Living Frame particle persistence output lineage is invalid.')

  const privateObjectIdentityHash =
    sha256AuthorityValue({
      contractVersion:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_VERSION,
      canonicalScope:
        input.fullTimelineReport
          .canonicalScope,
      fullTimelineReportDigestSha256:
        input.fullTimelineReport
          .reportDigestSha256,
      finalPackagedReviewDigestSha256:
        output
          .finalPackagedReviewDigestSha256,
      expectedByteLength:
        output.expectedByteLength,
    })
  const persisted =
    await persistCanonicalPrivateRemotionArtifactStream({
      localStorageRoot:
        input.localStorageRoot,
      privateObjectIdentityHash,
      stream:
        Readable.from([output.bytes]),
      expectedByteLength:
        output.expectedByteLength,
      expectedSha256:
        output
          .finalPackagedReviewDigestSha256,
    })
  const inspected =
    await inspectCanonicalPrivateRemotionArtifact({
      localStorageRoot:
        input.localStorageRoot,
      privateObjectIdentityHash,
    })
  if (
    persisted.replayed
    || inspected == null
    || inspected.byteLength !==
      output.expectedByteLength
    || inspected.sha256 !==
      output
        .finalPackagedReviewDigestSha256
  ) throw invalid('Living Frame particle persistence readback is invalid.')

  const full =
    input.fullTimelineReport
  const draft:
    LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReportDraft = {
      contractVersion:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_VERSION,
      resultClass:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_CLASS,
      runtimeState:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_STATE,
      qualificationId:
        input.qualificationId,
      canonicalScope: {
        ...full.canonicalScope,
      },
      sourceBindings: {
        fullTimelineReportDigestSha256:
          full.reportDigestSha256,
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
      },
      persistedArtifact: {
        storageOwner:
          'persistCanonicalPrivateRemotionArtifactStream',
        inspectionOwner:
          'inspectCanonicalPrivateRemotionArtifact',
        contentType: 'video/mp4',
        privateObjectIdentityHash,
        byteLength:
          inspected.byteLength,
        sha256:
          inspected.sha256,
        createOnlyPersistenceUsed: true,
        exactStreamCommitmentVerified: true,
        exactReadbackVerified: true,
        replayedExistingArtifact: false,
        storagePathIncluded: false,
        rawBytesIncluded: false,
      },
      authorityBoundary: {
        privateInternalPersistenceIntegrationAuthority:
          true,
        selectedSceneAuthority: false,
        timingAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        artifactPersistenceAuthority: false,
        assetManifestAuthority: false,
        qaApprovalAuthority: false,
        privateReviewAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        externalBetaAuthority: false,
        productionAuthority: false,
      },
      openGateCodes:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_OPEN_GATES,
      fullTimelineReportRevalidated: true,
      privateOutputLeaseConsumedExactlyOnce:
        true,
      artifactPersisted: true,
      assetManifestMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      containsRenderedVideoBytes: false,
      containsStoragePathUrlCredentialCommandOrEnvironment:
        false,
      internalTestReadyForSceneEvidenceAndPrivateReview:
        true,
      externalBetaReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    reportDigestSha256:
      sha256AuthorityValue(draft),
  })
}

function assertInput(
  input:
    ExecuteLivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestInput,
): void {
  if (
    !isRecord(input)
    || Object.keys(input).sort().join('|') !== [
      'fullTimelineReport',
      'localStorageRoot',
      'privateReviewOutputLease',
      'qualificationId',
    ].sort().join('|')
    || typeof input.qualificationId !==
      'string'
    || !SAFE_ID.test(input.qualificationId)
    || typeof input.localStorageRoot !==
      'string'
    || input.localStorageRoot.length < 1
    || !isRecord(input.fullTimelineReport)
    || !isRecord(
      input.privateReviewOutputLease,
    )
  ) throw invalid('Living Frame particle persistence input is invalid.')
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
    || !report
      .internalTestReadyForPersistenceAndReview
    || report.artifactPersisted
    || report.assetManifestMutated
    || report.qaApproved
    || report.privateReviewApproved
    || report.actualCostCreated
    || report.customerCharged
    || report.externalBetaReady
    || report.productionReady
    || report.containsRenderedVideoBytes
    || report
      .containsPathUrlCredentialCommandOrEnvironment
  ) throw invalid('Living Frame full-timeline report is invalid for private persistence.')
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
        'living_frame_selected_scene_particle_private_persistence_internal_test',
    },
  )
}
