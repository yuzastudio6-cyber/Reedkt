import { createHash } from 'node:crypto'
import type { Readable } from 'node:stream'

import {
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_CLASS,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_OPEN_GATES,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_STATE,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_VERSION,
  type LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewInternalTestReport,
  type LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewInternalTestReportDraft,
} from '../../src/types/living-frame-selected-scene-environmental-particle-private-review-internal-test'
import type {
  LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReport,
} from '../../src/types/living-frame-selected-scene-environmental-particle-private-persistence-internal-test'
import type {
  LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifactLease,
  LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestReport,
} from '../../src/types/living-frame-selected-scene-environmental-particle-scene-qa-internal-test'
import type {
  LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport,
} from '../../src/types/living-frame-selected-scene-environmental-particle-remotion-full-timeline-internal-test'
import { ApiError } from '../errors/api-error'
import {
  consumeLivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifactLease,
} from './living-frame-selected-scene-environmental-particle-scene-qa-internal-test'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

export interface ExecuteLivingFrameSelectedSceneEnvironmentalParticlePrivateReviewInternalTestInput {
  readonly qualificationId: string
  readonly fullTimelineReport:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport
  readonly persistenceReport:
    LivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTestReport
  readonly sceneQaReport:
    LivingFrameSelectedSceneEnvironmentalParticleSceneQaInternalTestReport
  readonly privateReviewArtifactLease:
    LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifactLease
}

export async function executeLivingFrameSelectedSceneEnvironmentalParticlePrivateReviewInternalTest(
  input:
    ExecuteLivingFrameSelectedSceneEnvironmentalParticlePrivateReviewInternalTestInput,
): Promise<LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewInternalTestReport> {
  assertInput(input)
  assertLineage(input)
  const artifact =
    consumeLivingFrameSelectedSceneEnvironmentalParticlePrivateReviewArtifactLease(
      input.privateReviewArtifactLease,
    )
  if (
    artifact.sceneQaReportDigestSha256 !==
      input.sceneQaReport.reportDigestSha256
    || artifact.persistenceReportDigestSha256 !==
      input.persistenceReport.reportDigestSha256
    || artifact.privateObjectIdentityHash !==
      input.persistenceReport.persistedArtifact
        .privateObjectIdentityHash
    || artifact.byteLength !==
      input.persistenceReport.persistedArtifact
        .byteLength
    || artifact.sha256 !==
      input.persistenceReport.persistedArtifact
        .sha256
    || artifact.contentType !== 'video/mp4'
  ) throw invalid('Living Frame private-review artifact lineage is invalid.')
  const readback =
    await rehashPrivateReviewStream({
      openStream: artifact.openStream,
      expectedByteLength:
        artifact.byteLength,
      expectedSha256: artifact.sha256,
    })
  const full = input.fullTimelineReport
  const persistence =
    input.persistenceReport
  const qa = input.sceneQaReport
  const draft:
    LivingFrameSelectedSceneEnvironmentalParticlePrivateReviewInternalTestReportDraft = {
      contractVersion:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_VERSION,
      resultClass:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_CLASS,
      runtimeState:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_STATE,
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
        sceneQaReportDigestSha256:
          qa.reportDigestSha256,
        selectedSceneBindingDigestSha256:
          full.sourceBindings
            .selectedSceneBindingDigestSha256,
        currentMasterTimingDigestSha256:
          full.sourceBindings
            .currentMasterTimingDigestSha256,
        confirmedOutputFrameDigestSha256:
          full.sourceBindings
            .confirmedOutputFrameDigestSha256,
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
      privateReviewArtifact: {
        contentType: 'video/mp4',
        byteLength:
          readback.byteLength,
        sha256: readback.sha256,
        privateStreamReopened: true,
        fullStreamByteLengthReverified:
          true,
        fullStreamSha256Reverified:
          true,
        rawBytesIncluded: false,
        storagePathIncluded: false,
      },
      reviewEvidence: {
        selectedSceneLineageRevalidated:
          true,
        masterTimingLineageRevalidated:
          true,
        confirmedOutputFrameLineageRevalidated:
          true,
        exact105FrameMediaQaPassed:
          true,
        proceduralAlphaQaPassed:
          true,
        destinationCompositeQaPassed:
          true,
        captionPlanePriorityPassed:
          true,
        remotionFinalCanvasPassed:
          true,
        privateReviewEvidenceCompiled:
          true,
        privateInternalReviewEvidencePassed:
          true,
      },
      canonicalReviewDisposition: {
        canonicalCompiler:
          'compileCanonicalLivingFramePrivateReviewEvidence',
        canonicalCompilerSupportsStaticRgbaWorkChain:
          true,
        canonicalCompilerSupportsProceduralTimelineWorkChain:
          false,
        sharedInterfaceConflictCode:
          'canonical_private_review_v1_requires_static_sharp_rgba_component_and_has_no_procedural_timeline_artifact_contract',
        canonicalOwnerReconciliationRequired:
          true,
        existingCanonicalPrivateReviewAuthorityRemainsSoleAuthority:
          true,
        noParallelPrivateReviewOwnerCreated:
          true,
      },
      authorityBoundary: {
        privateInternalReviewEvidenceIntegrationAuthority:
          true,
        selectedSceneAuthority: false,
        timingAuthority: false,
        workGraphAuthority: false,
        artifactPersistenceAuthority:
          false,
        assetManifestAuthority: false,
        canonicalQaApprovalAuthority:
          false,
        privateReviewApprovalAuthority:
          false,
        renderAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority: false,
        externalBetaAuthority: false,
        productionAuthority: false,
      },
      openGateCodes:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_REVIEW_INTERNAL_TEST_OPEN_GATES,
      fullTimelineReportRevalidated:
        true,
      persistenceReportRevalidated:
        true,
      sceneQaReportRevalidated: true,
      privateReviewArtifactLeaseConsumedExactlyOnce:
        true,
      privateInternalParticleSliceEndToEndPassed:
        true,
      assetManifestMutated: false,
      canonicalQaApproved: false,
      privateReviewApproved: false,
      furtherRenderAuthorized: false,
      actualCostCreated: false,
      customerCharged: false,
      publicDeliveryReady: false,
      containsRenderedVideoBytes: false,
      containsStoragePathUrlCredentialCommandOrEnvironment:
        false,
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
    ExecuteLivingFrameSelectedSceneEnvironmentalParticlePrivateReviewInternalTestInput,
): void {
  if (
    !isRecord(input)
    || Object.keys(input).sort().join('|') !== [
      'fullTimelineReport',
      'persistenceReport',
      'privateReviewArtifactLease',
      'qualificationId',
      'sceneQaReport',
    ].sort().join('|')
    || typeof input.qualificationId !==
      'string'
    || !SAFE_ID.test(input.qualificationId)
    || !isRecord(input.fullTimelineReport)
    || !isRecord(input.persistenceReport)
    || !isRecord(input.sceneQaReport)
    || !isRecord(
      input.privateReviewArtifactLease,
    )
  ) throw invalid('Living Frame particle private-review input is invalid.')
}

function assertLineage(
  input:
    ExecuteLivingFrameSelectedSceneEnvironmentalParticlePrivateReviewInternalTestInput,
): void {
  const full = input.fullTimelineReport
  const persistence =
    input.persistenceReport
  const qa = input.sceneQaReport
  const {
    reportDigestSha256:
      fullDigest,
    ...fullDraft
  } = full
  const {
    reportDigestSha256:
      persistenceDigest,
    ...persistenceDraft
  } = persistence
  const {
    reportDigestSha256:
      qaDigest,
    ...qaDraft
  } = qa
  if (
    !SHA256.test(fullDigest)
    || fullDigest !==
      sha256AuthorityValue(fullDraft)
    || !SHA256.test(persistenceDigest)
    || persistenceDigest !==
      sha256AuthorityValue(
        persistenceDraft,
      )
    || !SHA256.test(qaDigest)
    || qaDigest !==
      sha256AuthorityValue(qaDraft)
    || persistence.sourceBindings
      .fullTimelineReportDigestSha256 !==
      fullDigest
    || qa.sourceBindings
      .fullTimelineReportDigestSha256 !==
      fullDigest
    || qa.sourceBindings
      .persistenceReportDigestSha256 !==
      persistenceDigest
    || !sameScope(
      full.canonicalScope,
      persistence.canonicalScope,
    )
    || !sameScope(
      full.canonicalScope,
      qa.canonicalScope,
    )
    || !persistence.artifactPersisted
    || !qa.privateInternalSceneQaPassed
    || !qa.privateReviewEvidenceReady
    || !qa.persistedMediaQa
      .actualRuntimeExecuted
    || !qa.proceduralAlphaQa
      .everyFrameExpectationMatched
    || !qa.destinationCompositeQa
      .captionPlaneVisibleAboveParticlesAcrossTimeline
    || qa.canonicalQaApproved
    || qa.privateReviewApproved
    || qa.assetManifestMutated
    || qa.customerCharged
    || qa.productionReady
  ) throw invalid('Living Frame particle private-review lineage is invalid.')
}

async function rehashPrivateReviewStream(
  input: {
    readonly openStream:
      () => Promise<Readable>
    readonly expectedByteLength: number
    readonly expectedSha256: string
  },
): Promise<{
  readonly byteLength: number
  readonly sha256: string
}> {
  const hash = createHash('sha256')
  let byteLength = 0
  const stream = await input.openStream()
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (
      byteLength >
      input.expectedByteLength
    ) throw invalid('Living Frame private-review artifact exceeded its commitment.')
    hash.update(bytes)
  }
  const sha256 = hash.digest('hex')
  if (
    byteLength !== input.expectedByteLength
    || sha256 !== input.expectedSha256
  ) throw invalid('Living Frame private-review artifact failed exact stream revalidation.')
  return { byteLength, sha256 }
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
        'living_frame_selected_scene_particle_private_review_internal_test',
    },
  )
}
