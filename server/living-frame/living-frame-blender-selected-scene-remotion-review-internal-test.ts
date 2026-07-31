import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  lstatSync,
  realpathSync,
} from 'node:fs'
import {
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import {
  basename,
  dirname,
  join,
  resolve,
} from 'node:path'
import { Readable } from 'node:stream'

import type {
  LivingFrameBlenderFixedAdapterOutputFileCommitment,
  LivingFrameBlenderFixedAdapterResult,
} from '../../src/types/living-frame-blender-fixed-adapter-internal-test'
import {
  LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_CLASS,
  LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_OPEN_GATES,
  LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_STATE,
  LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_VERSION,
  type LivingFrameArticulatedPuppetPrivatePlaybackLease,
  type LivingFrameArticulatedPuppetRemotionReviewInternalTestExecution,
  type LivingFrameArticulatedPuppetRemotionReviewInternalTestReport,
  type LivingFrameArticulatedPuppetRemotionReviewInternalTestReportDraft,
} from '../../src/types/living-frame-articulated-puppet-remotion-review-internal-test'
import type {
  LivingFrameArticulatedPuppetSheetReceipt,
} from '../../src/types/living-frame-articulated-puppet-sheet-internal-test'
import type {
  CanonicalLivingFrameMotionSpec,
  CanonicalLivingFrameMotionSpecDraft,
} from '../../src/types/living-frame-canonical-motion'
import type {
  LivingFrameBlenderRigComponentQaInternalTestReport,
  LivingFrameBlenderRigPrivateRemotionSequenceLease,
} from '../../src/types/living-frame-blender-rig-component-qa-internal-test'
import type {
  LivingFrameBlenderRigPrivatePersistenceReport,
} from '../../src/types/living-frame-blender-rig-private-persistence-internal-test'
import {
  LIVING_FRAME_BLENDER_SELECTED_SCENE_ILLUSTRATED_REMOTION_REVIEW_INTERNAL_TEST_CLASS,
  LIVING_FRAME_BLENDER_SELECTED_SCENE_ILLUSTRATED_REMOTION_REVIEW_INTERNAL_TEST_STATE,
  LIVING_FRAME_BLENDER_SELECTED_SCENE_ILLUSTRATED_REMOTION_REVIEW_INTERNAL_TEST_VERSION,
  type LivingFrameBlenderSelectedSceneIllustratedRemotionReviewInternalTestReport,
  type LivingFrameBlenderSelectedSceneIllustratedRemotionReviewInternalTestReportDraft,
} from '../../src/types/living-frame-blender-selected-scene-illustrated-remotion-review-internal-test'
import {
  LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_CLASS,
  LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_OPEN_GATES,
  LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_STATE,
  LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_VERSION,
  type LivingFrameBlenderSelectedSceneRemotionReviewChunkReceipt,
  type LivingFrameBlenderSelectedSceneRemotionReviewInternalTestReport,
  type LivingFrameBlenderSelectedSceneRemotionReviewInternalTestReportDraft,
} from '../../src/types/living-frame-blender-selected-scene-remotion-review-internal-test'
import type {
  LivingFrameBlenderSelectedSceneTextureBindingInternalTest,
} from '../../src/types/living-frame-blender-selected-scene-texture-binding-internal-test'
import {
  inspectCanonicalPrivateRemotionArtifact,
  persistCanonicalPrivateRemotionArtifactStream,
} from '../services/canonical-private-remotion-artifact-storage'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
  activatePrivateOfflineRemotionRenderRuntime,
  buildOfflineRemotionFinalCompositionStreamingRequest,
  prepareOfflineRemotionDockerRuntime,
  type OfflineRemotionServerInjectedInput,
} from '../tool-execution/remotion-render-execution'
import {
  deriveCanonicalLivingFrameCompiledSampleDigestSha256,
} from './canonical-living-frame-motion'
import type {
  CompiledLivingFrameBlenderFixedTexturedAdapterInternalRequest,
} from './living-frame-blender-fixed-adapter-internal-test'
import {
  consumeLivingFrameBlenderRigPrivateRemotionSequenceLease,
  type LivingFrameBlenderRigPrivateRemotionSequence,
} from './living-frame-blender-rig-component-qa-internal-test'
import {
  verifyLivingFrameArticulatedPuppetSheetReceipt,
} from './living-frame-airship-navigator-articulated-puppet-sheet-internal-test'
import type {
  LivingFrameAirshipNavigatorArticulatedBlenderPrivateFixture,
} from './living-frame-airship-navigator-articulated-blender-private-fixture'
import {
  verifyLivingFrameCharacterAnimationRouteDecision,
} from './living-frame-character-animation-route'
import {
  verifyLivingFrameRigActionPlan,
} from './living-frame-rig-action'
import {
  verifyLivingFrameRiggingAdapterCandidate,
} from './living-frame-rigging-adapter-candidate'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const SOURCE_WIDTH = 1_920 as const
const SOURCE_HEIGHT = 1_080 as const
const REVIEW_WIDTH = 640 as const
const REVIEW_HEIGHT = 360 as const
const FPS = 30 as const
const START_FRAME = 12 as const
const END_FRAME_EXCLUSIVE = 72 as const
const MAXIMUM_OVERLAYS_PER_CHUNK = 16 as const
const CHUNK_RENDER_FRAMES = 24 as const
const MAXIMUM_RENDERED_BYTES = 256 * 1024 * 1024
const SAMPLE_REVIEW_FRAMES = [0, 30, 59] as const

interface LivingFrameBlenderRemotionRenderableSequence {
  readonly selectedSceneBindingDigestSha256:
    string
  readonly currentMasterTimingDigestSha256:
    string
  readonly artifactSetDigestSha256: string
  readonly widthPixels: 1920
  readonly heightPixels: 1080
  readonly fps: 30
  readonly startFrame: 12
  readonly endFrameExclusive: 72
  readonly rgbaFrames: readonly {
    readonly commitment:
      LivingFrameBlenderFixedAdapterOutputFileCommitment
    readonly bytes: Buffer
  }[]
}

interface ArticulatedPuppetPrivatePlaybackBinding {
  readonly reportDigestSha256: string
  readonly privateObjectIdentityHash: string
  readonly byteLength: number
  readonly sha256: string
  readonly bytes: Buffer
}

const articulatedPuppetPrivatePlaybackByLease =
  new WeakMap<
    LivingFrameArticulatedPuppetPrivatePlaybackLease,
    ArticulatedPuppetPrivatePlaybackBinding
  >()

export interface ExecuteLivingFrameBlenderSelectedSceneRemotionReviewInternalTestInput {
  readonly qualificationId: string
  readonly localStorageRoot: string
  readonly componentQaReport:
    LivingFrameBlenderRigComponentQaInternalTestReport
  readonly persistenceReport:
    LivingFrameBlenderRigPrivatePersistenceReport
  readonly privateRemotionSequenceLease:
    LivingFrameBlenderRigPrivateRemotionSequenceLease
}

export async function executeLivingFrameBlenderSelectedSceneRemotionReviewInternalTest(
  input:
    ExecuteLivingFrameBlenderSelectedSceneRemotionReviewInternalTestInput,
): Promise<LivingFrameBlenderSelectedSceneRemotionReviewInternalTestReport> {
  return executeLivingFrameBlenderSelectedSceneRemotionReviewInternal({
    input,
  })
}

export interface ExecuteLivingFrameBlenderSelectedSceneIllustratedRemotionReviewInternalTestInput
  extends ExecuteLivingFrameBlenderSelectedSceneRemotionReviewInternalTestInput {
  readonly textureBinding:
    LivingFrameBlenderSelectedSceneTextureBindingInternalTest
  readonly basePlatePngBytes: Buffer
  readonly captionPngBytes: Buffer
}

export async function executeLivingFrameBlenderSelectedSceneIllustratedRemotionReviewInternalTest(
  input:
    ExecuteLivingFrameBlenderSelectedSceneIllustratedRemotionReviewInternalTestInput,
):
Promise<LivingFrameBlenderSelectedSceneIllustratedRemotionReviewInternalTestReport> {
  assertIllustratedInput(input)
  const baseReview =
    await executeLivingFrameBlenderSelectedSceneRemotionReviewInternal({
      input: {
        qualificationId:
          input.qualificationId,
        localStorageRoot:
          input.localStorageRoot,
        componentQaReport:
          input.componentQaReport,
        persistenceReport:
          input.persistenceReport,
        privateRemotionSequenceLease:
          input.privateRemotionSequenceLease,
      },
      illustratedAssets: {
        basePlatePngBytes:
          Buffer.from(
            input.basePlatePngBytes,
          ),
        captionPngBytes:
          Buffer.from(
            input.captionPngBytes,
          ),
      },
    })
  const binding =
    input.textureBinding
  const draft:
    LivingFrameBlenderSelectedSceneIllustratedRemotionReviewInternalTestReportDraft = {
      contractVersion:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_ILLUSTRATED_REMOTION_REVIEW_INTERNAL_TEST_VERSION,
      resultClass:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_ILLUSTRATED_REMOTION_REVIEW_INTERNAL_TEST_CLASS,
      runtimeState:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_ILLUSTRATED_REMOTION_REVIEW_INTERNAL_TEST_STATE,
      qualificationId:
        input.qualificationId,
      canonicalScope: {
        ...input.componentQaReport
          .canonicalScope,
      },
      sourceBindings: {
        selectedSceneTextureBindingDigestSha256:
          binding.bindingDigestSha256,
        selectedSceneAdmissionDigestSha256:
          input.componentQaReport
            .sourceBindings
            .admissionDigestSha256,
        componentQaReportDigestSha256:
          input.componentQaReport
            .reportDigestSha256,
        persistenceReportDigestSha256:
          input.persistenceReport
            .reportDigestSha256,
        baseReviewReportDigestSha256:
          baseReview.reportDigestSha256,
        basePlateArtifactId:
          binding
            .finalCompositionArtifacts
            .basePlate.artifactId,
        basePlateSha256:
          binding
            .finalCompositionArtifacts
            .basePlate.sha256,
        captionArtifactId:
          binding
            .finalCompositionArtifacts
            .captionOverlay.artifactId,
        captionSha256:
          binding
            .finalCompositionArtifacts
            .captionOverlay.sha256,
        texturedBlenderPayloadDigestSha256:
          input.persistenceReport
            .sourceBindings
            .adapterPayloadDigestSha256,
      },
      compositionIdentity: {
        styleProfile:
          'illustrated_musashi_deep_2_5d_v1',
        basePlateContainsReconstructedCharacterAndStaticSecondaryParts:
          true,
        blenderSequenceContainsApprovedTexturedSwordArmComponent:
          true,
        captionPlaneAboveLivingFrame:
          true,
        exactConfirmedAspectRatioPreserved:
          true,
        everyFinalReviewFrameCompositedByRemotion:
          true,
        remotionRemainsFinalCanvas: true,
      },
      baseReview,
      qaEvidence: {
        exactBasePlateBytesRevalidated:
          true,
        exactCaptionBytesRevalidated:
          true,
        selectedSceneTextureBindingRevalidated:
          true,
        texturedBlenderComponentQaPassed:
          true,
        illustratedSourcePlateVisible:
          true,
        texturedSwordArmMotionVisible:
          true,
        initialPoseRestored: true,
        privateReviewArtifactPersistedAndReread:
          true,
      },
      authorityBoundary: {
        privateInternalIllustratedReviewEvidenceAuthority:
          true,
        selectedSceneAuthority: false,
        approvedSnapshotAuthority: false,
        masterTimingAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        runtimeAuthority: false,
        canonicalArtifactAuthority:
          false,
        assetManifestAuthority: false,
        canonicalQaApprovalAuthority:
          false,
        privateReviewApprovalAuthority:
          false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority: false,
        productionAuthority: false,
      },
      canonicalAssetManifestMutated: false,
      canonicalQaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    reportDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export interface ExecuteLivingFrameAirshipNavigatorArticulatedRemotionReviewInternalTestInput {
  readonly qualificationId: string
  readonly localStorageRoot: string
  readonly sheetReceipt:
    LivingFrameArticulatedPuppetSheetReceipt
  readonly preparedAlphaAtlas: {
    readonly artifactId: string
    readonly contentType: 'image/png'
    readonly widthPixels: 1536
    readonly heightPixels: 1024
    readonly byteLength: number
    readonly sha256: string
  }
  readonly fixture:
    LivingFrameAirshipNavigatorArticulatedBlenderPrivateFixture
  readonly compiledRequest:
    CompiledLivingFrameBlenderFixedTexturedAdapterInternalRequest
  readonly blenderResult:
    LivingFrameBlenderFixedAdapterResult
  readonly rgbaFrames: readonly {
    readonly commitment:
      LivingFrameBlenderFixedAdapterOutputFileCommitment
    readonly bytes: Buffer
  }[]
}

export async function executeLivingFrameAirshipNavigatorArticulatedRemotionReviewInternalTest(
  input:
    ExecuteLivingFrameAirshipNavigatorArticulatedRemotionReviewInternalTestInput,
):
Promise<LivingFrameArticulatedPuppetRemotionReviewInternalTestExecution> {
  assertAirshipNavigatorArticulatedReviewInput(
    input,
  )
  const rgbaSequenceDigestSha256 =
    sha256AuthorityValue(
      input.rgbaFrames.map((frame) =>
        frame.commitment),
    )
  const sequence:
    LivingFrameBlenderRemotionRenderableSequence = {
      selectedSceneBindingDigestSha256:
        input.fixture.candidateRequest
          .sourceBindings.selectedSceneRef
          .digestSha256,
      currentMasterTimingDigestSha256:
        input.fixture.candidateRequest
          .sourceBindings
          .masterTimingPlanDigestSha256,
      artifactSetDigestSha256:
        rgbaSequenceDigestSha256,
      widthPixels: SOURCE_WIDTH,
      heightPixels: SOURCE_HEIGHT,
      fps: FPS,
      startFrame: START_FRAME,
      endFrameExclusive:
        END_FRAME_EXCLUSIVE,
      rgbaFrames:
        input.rgbaFrames.map(
          (frame) => ({
            commitment:
              structuredClone(
                frame.commitment,
              ),
            bytes:
              Buffer.from(frame.bytes),
          }),
        ),
    }
  const sourceBytes =
    createSourceVideo(
      CHUNK_RENDER_FRAMES,
    )
  const captionBytes =
    createCaptionOverlay()
  const runtime =
    await activateOrPrepareRemotionRuntime()
  const chunks =
    chunkFrames(
      sequence.rgbaFrames,
      MAXIMUM_OVERLAYS_PER_CHUNK,
    )
  if (chunks.length !== 4) {
    throw new Error(
      'Airship navigator articulated Remotion review chunk count changed.',
    )
  }
  const renderedChunks: Buffer[] = []
  const chunkReceipts:
    Array<
      LivingFrameArticulatedPuppetRemotionReviewInternalTestReportDraft['chunkReceipts'][number]
    > =
      []
  for (
    const [order, frames] of
      chunks.entries()
  ) {
    const rendered =
      await renderChunk({
        order,
        frames,
        sourceBytes,
        captionBytes,
        runtime,
        sequence,
        sceneId:
          input.fixture.sceneId,
      })
    renderedChunks.push(
      rendered.bytes,
    )
    chunkReceipts.push(
      rendered.receipt,
    )
  }
  const packagedBytes =
    await packageChunks({
      chunks: renderedChunks,
      frameCounts:
        chunks.map(
          (chunk) =>
            chunk.length,
        ),
    })
  const finalPackagedReviewDigestSha256 =
    digestBytes(packagedBytes)
  const blenderResultDigestSha256 =
    sha256AuthorityValue(
      input.blenderResult,
    )
  const privateObjectIdentityHash =
    sha256AuthorityValue({
      contractVersion:
        LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_VERSION,
      sceneId:
        input.fixture.sceneId,
      componentId:
        input.fixture.componentId,
      puppetSheetReceiptDigestSha256:
        input.sheetReceipt
          .receiptDigestSha256,
      blenderResultDigestSha256,
      rgbaSequenceDigestSha256,
      finalPackagedReviewDigestSha256,
    })
  const persisted =
    await persistCanonicalPrivateRemotionArtifactStream({
      localStorageRoot:
        input.localStorageRoot,
      privateObjectIdentityHash,
      stream:
        Readable.from([
          packagedBytes,
        ]),
      expectedByteLength:
        packagedBytes.byteLength,
      expectedSha256:
        finalPackagedReviewDigestSha256,
    })
  if (persisted.replayed) {
    throw new Error(
      'Airship navigator articulated private Remotion review replayed unexpectedly.',
    )
  }
  const reopened =
    await inspectCanonicalPrivateRemotionArtifact({
      localStorageRoot:
        input.localStorageRoot,
      privateObjectIdentityHash,
    })
  if (
    reopened == null
    || reopened.byteLength !==
      packagedBytes.byteLength
    || reopened.sha256 !==
      finalPackagedReviewDigestSha256
  ) {
    throw new Error(
      'Airship navigator articulated private Remotion review changed after create-only persistence.',
    )
  }
  const reread =
    await readExactStream({
      stream:
        await reopened.openStream(),
      expectedByteLength:
        packagedBytes.byteLength,
      expectedSha256:
        finalPackagedReviewDigestSha256,
    })
  if (
    !reread.equals(
      packagedBytes,
    )
  ) {
    throw new Error(
      'Airship navigator articulated private Remotion review failed exact reread.',
    )
  }
  const mediaQa =
    inspectRenderedMedia(
      packagedBytes,
      60,
    )
  const visualQa =
    measureRenderedVisuals(
      extractRenderedFrames(
        packagedBytes,
        SAMPLE_REVIEW_FRAMES,
      ),
      'grid',
    )
  const fixture = input.fixture
  const candidate =
    fixture.candidateRequest
  const draft:
    LivingFrameArticulatedPuppetRemotionReviewInternalTestReportDraft = {
      contractVersion:
        LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_VERSION,
      resultClass:
        LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_CLASS,
      runtimeState:
        LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_STATE,
      qualificationId:
        input.qualificationId,
      fixtureIdentity: {
        sceneId: fixture.sceneId,
        componentId:
          fixture.componentId,
        sourceSheetSha256:
          input.sheetReceipt
            .sourceArtifact.sha256,
        preparedAlphaAtlasSha256:
          input.preparedAlphaAtlas
            .sha256,
        reviewedPartCount:
          fixture.reviewedTopology
            .atlasPartCount,
        disconnectedMeshIslandCount:
          fixture.reviewedTopology
            .disconnectedMeshIslandCount,
        rigidWeightedVertexCount:
          fixture.reviewedTopology
            .rigidWeightedVertexCount,
        articulatedBoneCount:
          8,
        armIkChainLength:
          3,
        genericWholeImageDeformationUsed:
          false,
        controlledGenerationUsedForIntermediateFrames:
          false,
      },
      sourceBindings: {
        puppetSheetReceiptDigestSha256:
          input.sheetReceipt
            .receiptDigestSha256,
        characterAnimationRouteDecisionDigestSha256:
          fixture
            .characterAnimationRouteDecision
            .decisionDigestSha256,
        riggingAdapterCandidateRequestDigestSha256:
          candidate
            .requestDigestSha256,
        rigActionPlanDigestSha256:
          fixture.actionPlan
            .actionDigestSha256,
        blenderPayloadDigestSha256:
          input.compiledRequest
            .envelope.payloadDigestSha256,
        blenderResultDigestSha256,
        rgbaSequenceDigestSha256,
        selectedSceneBindingDigestSha256:
          sequence
            .selectedSceneBindingDigestSha256,
        currentMasterTimingDigestSha256:
          sequence
            .currentMasterTimingDigestSha256,
        confirmedOutputFrameDigestSha256:
          candidate.sourceBindings
            .outputFrameDigestSha256,
        finalPackagedReviewDigestSha256,
      },
      compositionIdentity: {
        styleProfile:
          'cinematic_airship_navigation_2_5d_internal_review_v1',
        sourceComponentWidthPixels:
          SOURCE_WIDTH,
        sourceComponentHeightPixels:
          SOURCE_HEIGHT,
        sourceComponentAspectRatio:
          '16:9',
        internalReviewWidthPixels:
          REVIEW_WIDTH,
        internalReviewHeightPixels:
          REVIEW_HEIGHT,
        internalReviewIsBoundedProxy:
          true,
        exactConfirmedAspectRatioPreserved:
          true,
        internalReviewIsFinalCustomerCanvas:
          false,
        fps: FPS,
        selectedStartFrame:
          START_FRAME,
        selectedEndFrameExclusive:
          END_FRAME_EXCLUSIVE,
        selectedDurationFrames: 60,
        finalReviewDurationFrames:
          60,
        frameImageCount: 60,
        remotionChunkCount: 4,
        maximumOverlaysPerChunk:
          MAXIMUM_OVERLAYS_PER_CHUNK,
        localMinimumRenderDurationFrames:
          CHUNK_RENDER_FRAMES,
        overlayAdapter:
          'bounded_remotion_chunks_with_exact_frame_packaging_v1',
        packagingTool: 'ffmpeg',
        packagingOnly: true,
        sourcePlateRole:
          'internal_navigation_grid_context',
        captionPlaneRole:
          'internal_review_title_bar',
        everyFinalReviewFrameCompositedByRemotion:
          true,
        captionsRemainAboveLivingFrame:
          true,
        remotionRemainsFinalCanvas:
          true,
      },
      chunkReceipts,
      persistedPrivateReviewArtifact: {
        persistenceOwner:
          'canonical_private_remotion_artifact_storage',
        contentType: 'video/mp4',
        privateObjectIdentityHash,
        byteLength:
          packagedBytes.byteLength,
        sha256:
          finalPackagedReviewDigestSha256,
        createOnlyPersistenceUsed:
          true,
        replayed: false,
        exactPrivateReadbackVerified:
          true,
        privatePlaybackLeaseIssued:
          true,
        rawBytesIncluded: false,
        storagePathIncluded: false,
      },
      persistedMediaQa: {
        probeToolId: 'ffprobe',
        probeOperation:
          'tool.ffprobe.inspect_approved_media.v1',
        actualRuntimeExecuted: true,
        codecName: 'h264',
        widthPixels: REVIEW_WIDTH,
        heightPixels:
          REVIEW_HEIGHT,
        fps: FPS,
        readFrameCount: 60,
        pixelFormat:
          mediaQa.pixelFormat,
        probeEvidenceDigestSha256:
          mediaQa
            .probeEvidenceDigestSha256,
      },
      renderedVisualQa: {
        sampleFrames:
          SAMPLE_REVIEW_FRAMES,
        firstPoseSubjectPixelCount:
          visualQa
            .subjectPixelCounts[0]!,
        middlePoseSubjectPixelCount:
          visualQa
            .subjectPixelCounts[1]!,
        finalPoseSubjectPixelCount:
          visualQa
            .subjectPixelCounts[2]!,
        middlePoseDifferentPixelCount:
          visualQa
            .middlePoseDifferentPixelCount,
        firstFinalMeanAbsoluteDifference:
          visualQa
            .firstFinalMeanAbsoluteDifference,
        primaryMotionVisible: true,
        requiredReturnToInitialPoseVisible:
          true,
        sourcePlateVisibleAcrossSamples:
          true,
        captionPlaneVisibleAcrossSamples:
          true,
        livingFrameRemainsBelowCaptionPlane:
          true,
        exactSelectedFrameOrderPreserved:
          true,
        automatedCompositionMetricsPassed:
          true,
        headVisualReviewPerformed:
          true,
        professionalVisualAcceptancePassed:
          false,
        visualReviewDisposition:
          'rejected',
        rejectionReasonCodes: [
          'visible_joint_socket_artwork',
          'articulated_limb_reads_as_disconnected_segments',
          'limb_extension_exceeds_believable_anatomy',
          'hand_prop_attachment_is_unclear',
          'detached_coat_flap_reads_as_floating',
        ],
      },
      runtimeIdentity: {
        blenderToolId: 'blender',
        blenderOperationId:
          'tool.blender.render_living_frame_component_rig.v1',
        remotionToolId: 'remotion',
        remotionOperationId:
          'tool.remotion.render_approved_composition.v1',
        remotionPackageName:
          'remotion+@remotion/renderer',
        remotionPackageVersion:
          '4.0.487',
        actualRemotionRenderCount:
          4,
        ffmpegPackagingExecuted:
          true,
        sharedRuntimeSourceMutated:
          false,
        existingCanonicalRemotionRuntimeReused:
          true,
      },
      authorityBoundary: {
        privateInternalRemotionReviewEvidenceAuthority:
          true,
        fixturePlaybackLeaseAuthority:
          true,
        selectedSceneAuthority: false,
        approvedSnapshotAuthority:
          false,
        masterTimingAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        canonicalArtifactAuthority:
          false,
        assetManifestAuthority:
          false,
        finalRendererAuthority: false,
        canonicalQaApprovalAuthority:
          false,
        privateReviewApprovalAuthority:
          false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority:
          false,
        productionAuthority: false,
      },
      openGateCodes:
        LIVING_FRAME_ARTICULATED_PUPPET_REMOTION_REVIEW_INTERNAL_TEST_OPEN_GATES,
      exactEightPartBlenderSequenceRevalidated:
        true,
      exactSelectedSceneSequenceComposited:
        true,
      privateInternalTechnicalExecutionPassed:
        true,
      privateInternalReviewEvidencePassed:
        false,
      canonicalAssetManifestMutated:
        false,
      canonicalQaApproved: false,
      privateReviewApproved: false,
      furtherRenderAuthorized: false,
      actualCostCreated: false,
      customerCharged: false,
      containsSourceSequenceOrRenderedVideoBytes:
        false,
      containsStoragePathUrlCredentialCommandOrEnvironment:
        false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  const report:
    LivingFrameArticulatedPuppetRemotionReviewInternalTestReport =
      deepFreeze({
        ...draft,
        reportDigestSha256:
          sha256AuthorityValue(
            draft,
          ),
      })
  const privatePlaybackLease =
    createArticulatedPuppetPrivatePlaybackLease({
      report,
      privateObjectIdentityHash,
      bytes: packagedBytes,
    })
  return {
    report,
    privatePlaybackLease,
  }
}

export function consumeLivingFrameArticulatedPuppetPrivatePlaybackLease(
  lease:
    LivingFrameArticulatedPuppetPrivatePlaybackLease,
): {
  readonly contentType: 'video/mp4'
  readonly byteLength: number
  readonly sha256: string
  readonly bytes: Buffer
} {
  const binding =
    articulatedPuppetPrivatePlaybackByLease.get(
      lease,
    )
  if (
    binding == null
    || lease.leaseClass !==
      'process_bound_single_use_living_frame_articulated_puppet_private_playback_lease_v1'
    || lease.callerSerializable !==
      false
    || lease.reportDigestSha256 !==
      binding.reportDigestSha256
    || lease.privateObjectIdentityHash !==
      binding.privateObjectIdentityHash
    || lease.byteLength !==
      binding.byteLength
    || lease.sha256 !==
      binding.sha256
    || lease.canonicalArtifactAuthority
      !== false
    || lease.assetManifestAuthority
      !== false
    || lease.canonicalQaApprovalAuthority
      !== false
    || lease.privateReviewApprovalAuthority
      !== false
    || lease.billingAuthority !== false
    || lease.publicDeliveryAuthority
      !== false
    || lease.productionAuthority !==
      false
  ) {
    throw new Error(
      'Articulated-puppet private playback lease is invalid, unknown, or already consumed.',
    )
  }
  articulatedPuppetPrivatePlaybackByLease.delete(
    lease,
  )
  if (
    binding.bytes.byteLength !==
      binding.byteLength
    || digestBytes(binding.bytes) !==
      binding.sha256
  ) {
    throw new Error(
      'Articulated-puppet private playback bytes changed before lease consumption.',
    )
  }
  return {
    contentType: 'video/mp4',
    byteLength:
      binding.byteLength,
    sha256: binding.sha256,
    bytes:
      Buffer.from(binding.bytes),
  }
}

async function executeLivingFrameBlenderSelectedSceneRemotionReviewInternal(
  options: {
    readonly input:
      ExecuteLivingFrameBlenderSelectedSceneRemotionReviewInternalTestInput
    readonly illustratedAssets?: {
      readonly basePlatePngBytes: Buffer
      readonly captionPngBytes: Buffer
    }
  },
): Promise<LivingFrameBlenderSelectedSceneRemotionReviewInternalTestReport> {
  const input = options.input
  assertInput(input)
  assertLineage(
    input.componentQaReport,
    input.persistenceReport,
  )
  const sequence =
    consumeLivingFrameBlenderRigPrivateRemotionSequenceLease(
      input.privateRemotionSequenceLease,
    )
  assertSequenceLineage(
    sequence,
    input.componentQaReport,
    input.persistenceReport,
  )

  const sourceBytes =
    options.illustratedAssets == null
      ? createSourceVideo(
        CHUNK_RENDER_FRAMES,
      )
      : createIllustratedSourceVideo(
        CHUNK_RENDER_FRAMES,
        options.illustratedAssets
          .basePlatePngBytes,
      )
  const captionBytes =
    options.illustratedAssets == null
      ? createCaptionOverlay()
      : options.illustratedAssets
        .captionPngBytes
  const runtime =
    await activateOrPrepareRemotionRuntime()
  const chunks =
    chunkFrames(
      sequence.rgbaFrames,
      MAXIMUM_OVERLAYS_PER_CHUNK,
    )
  if (chunks.length !== 4) {
    throw new Error(
      'Living Frame Blender Remotion review chunk count changed.',
    )
  }
  const renderedChunks: Buffer[] = []
  const chunkReceipts:
    LivingFrameBlenderSelectedSceneRemotionReviewChunkReceipt[] =
      []
  for (
    const [order, frames] of
      chunks.entries()
  ) {
    const rendered =
      await renderChunk({
        order,
        frames,
        sourceBytes,
        captionBytes,
        runtime,
        sequence,
        componentOffset:
          options.illustratedAssets == null
            ? undefined
            : {
              xNormalized:
                0.109375,
              yNormalized:
                -0.211111,
            },
        sceneId:
          input.componentQaReport
            .canonicalScope.sceneId,
      })
    renderedChunks.push(rendered.bytes)
    chunkReceipts.push(rendered.receipt)
  }

  const packagedBytes =
    await packageChunks({
      chunks: renderedChunks,
      frameCounts: chunks.map(
        (chunk) => chunk.length,
      ),
    })
  const finalPackagedReviewDigestSha256 =
    digestBytes(packagedBytes)
  const privateObjectIdentityHash =
    sha256AuthorityValue({
      contractVersion:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_VERSION,
      canonicalScope:
        input.componentQaReport
          .canonicalScope,
      componentQaReportDigestSha256:
        input.componentQaReport
          .reportDigestSha256,
      finalPackagedReviewDigestSha256,
    })
  const persisted =
    await persistCanonicalPrivateRemotionArtifactStream({
      localStorageRoot:
        input.localStorageRoot,
      privateObjectIdentityHash,
      stream:
        Readable.from([packagedBytes]),
      expectedByteLength:
        packagedBytes.byteLength,
      expectedSha256:
        finalPackagedReviewDigestSha256,
    })
  if (persisted.replayed) {
    throw new Error(
      'Living Frame Blender private Remotion review artifact replayed unexpectedly.',
    )
  }
  const reopened =
    await inspectCanonicalPrivateRemotionArtifact({
      localStorageRoot:
        input.localStorageRoot,
      privateObjectIdentityHash,
    })
  if (
    reopened == null
    || reopened.byteLength !==
      packagedBytes.byteLength
    || reopened.sha256 !==
      finalPackagedReviewDigestSha256
  ) {
    throw new Error(
      'Living Frame Blender private Remotion review artifact changed after create-only persistence.',
    )
  }
  const reread =
    await readExactStream({
      stream: await reopened.openStream(),
      expectedByteLength:
        packagedBytes.byteLength,
      expectedSha256:
        finalPackagedReviewDigestSha256,
    })
  if (!reread.equals(packagedBytes)) {
    throw new Error(
      'Living Frame Blender private Remotion review artifact failed exact reread.',
    )
  }

  const mediaQa =
    inspectRenderedMedia(
      packagedBytes,
      60,
    )
  const sampledFrames =
    extractRenderedFrames(
      packagedBytes,
      SAMPLE_REVIEW_FRAMES,
    )
  const visualQa =
    measureRenderedVisuals(
      sampledFrames,
      options.illustratedAssets == null
        ? 'grid'
        : 'illustrated_musashi',
    )

  const qa = input.componentQaReport
  const persistence =
    input.persistenceReport
  const draft:
    LivingFrameBlenderSelectedSceneRemotionReviewInternalTestReportDraft = {
      contractVersion:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_VERSION,
      resultClass:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_CLASS,
      runtimeState:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_STATE,
      qualificationId:
        input.qualificationId,
      canonicalScope: {
        ...qa.canonicalScope,
      },
      sourceBindings: {
        componentQaReportDigestSha256:
          qa.reportDigestSha256,
        persistenceReportDigestSha256:
          persistence.reportDigestSha256,
        admissionDigestSha256:
          qa.sourceBindings
            .admissionDigestSha256,
        selectedSceneBindingDigestSha256:
          qa.sourceBindings
            .selectedSceneBindingDigestSha256,
        currentMasterTimingDigestSha256:
          qa.sourceBindings
            .currentMasterTimingDigestSha256,
        confirmedOutputFrameDigestSha256:
          qa.sourceBindings
            .confirmedOutputFrameDigestSha256,
        artifactSetDigestSha256:
          qa.sourceBindings
            .artifactSetDigestSha256,
        finalPackagedReviewDigestSha256,
      },
      compositionIdentity: {
        sourceComponentWidthPixels:
          SOURCE_WIDTH,
        sourceComponentHeightPixels:
          SOURCE_HEIGHT,
        sourceComponentAspectRatio: '16:9',
        internalReviewWidthPixels:
          REVIEW_WIDTH,
        internalReviewHeightPixels:
          REVIEW_HEIGHT,
        internalReviewIsBoundedProxy:
          true,
        exactConfirmedAspectRatioPreserved:
          true,
        internalReviewIsFinalCustomerCanvas:
          false,
        fps: FPS,
        selectedStartFrame: START_FRAME,
        selectedEndFrameExclusive:
          END_FRAME_EXCLUSIVE,
        selectedDurationFrames: 60,
        finalReviewDurationFrames: 60,
        frameImageCount: 60,
        remotionChunkCount: 4,
        maximumOverlaysPerChunk:
          MAXIMUM_OVERLAYS_PER_CHUNK,
        localMinimumRenderDurationFrames:
          CHUNK_RENDER_FRAMES,
        overlayAdapter:
          'bounded_remotion_chunks_with_exact_frame_packaging_v1',
        packagingTool: 'ffmpeg',
        packagingOnly: true,
        everyFinalReviewFrameCompositedByRemotion:
          true,
        captionsRemainAboveLivingFrame:
          true,
        remotionRemainsFinalCanvas: true,
      },
      chunkReceipts,
      persistedPrivateReviewArtifact: {
        persistenceOwner:
          'canonical_private_remotion_artifact_storage',
        contentType: 'video/mp4',
        privateObjectIdentityHash,
        byteLength:
          packagedBytes.byteLength,
        sha256:
          finalPackagedReviewDigestSha256,
        createOnlyPersistenceUsed: true,
        replayed: false,
        exactPrivateReadbackVerified:
          true,
        rawBytesIncluded: false,
        storagePathIncluded: false,
      },
      persistedMediaQa: {
        probeToolId: 'ffprobe',
        probeOperation:
          'tool.ffprobe.inspect_approved_media.v1',
        actualRuntimeExecuted: true,
        codecName: 'h264',
        widthPixels: REVIEW_WIDTH,
        heightPixels: REVIEW_HEIGHT,
        fps: FPS,
        readFrameCount: 60,
        pixelFormat: mediaQa.pixelFormat,
        probeEvidenceDigestSha256:
          mediaQa.probeEvidenceDigestSha256,
      },
      renderedVisualQa: {
        sampleFrames:
          SAMPLE_REVIEW_FRAMES,
        firstPoseSubjectPixelCount:
          visualQa.subjectPixelCounts[0]!,
        middlePoseSubjectPixelCount:
          visualQa.subjectPixelCounts[1]!,
        finalPoseSubjectPixelCount:
          visualQa.subjectPixelCounts[2]!,
        middlePoseDifferentPixelCount:
          visualQa.middlePoseDifferentPixelCount,
        firstFinalMeanAbsoluteDifference:
          visualQa.firstFinalMeanAbsoluteDifference,
        primaryMotionVisible: true,
        requiredReturnToInitialPoseVisible:
          true,
        sourcePlateVisibleAcrossSamples:
          true,
        captionPlaneVisibleAcrossSamples:
          true,
        livingFrameRemainsBelowCaptionPlane:
          true,
        exactSelectedFrameOrderPreserved:
          true,
      },
      runtimeIdentity: {
        toolId: 'remotion',
        operationId:
          'tool.remotion.render_approved_composition.v1',
        packageName:
          'remotion+@remotion/renderer',
        packageVersion: '4.0.487',
        actualRemotionRenderCount: 4,
        ffmpegPackagingExecuted: true,
        sharedRuntimeSourceMutated: false,
        existingCanonicalRuntimeReused:
          true,
      },
      authorityBoundary: {
        privateInternalRemotionReviewEvidenceAuthority:
          true,
        selectedSceneAuthority: false,
        approvedSnapshotAuthority: false,
        timingAuthority: false,
        operationRegistryAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        canonicalArtifactAuthority: false,
        assetManifestAuthority: false,
        finalRendererAuthority: false,
        canonicalQaApprovalAuthority:
          false,
        privateReviewApprovalAuthority:
          false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority: false,
        productionAuthority: false,
      },
      openGateCodes:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_REMOTION_REVIEW_INTERNAL_TEST_OPEN_GATES,
      componentQaReportRevalidated: true,
      privateRemotionSequenceLeaseConsumedExactlyOnce:
        true,
      exactSelectedSceneSequenceComposited:
        true,
      privateInternalReviewEvidencePassed:
        true,
      canonicalAssetManifestMutated: false,
      canonicalQaApproved: false,
      privateReviewApproved: false,
      furtherRenderAuthorized: false,
      actualCostCreated: false,
      customerCharged: false,
      containsSourceSequenceOrRenderedVideoBytes:
        false,
      containsStoragePathUrlCredentialCommandOrEnvironment:
        false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    reportDigestSha256:
      sha256AuthorityValue(draft),
  })
}

async function renderChunk(input: {
  readonly order: number
  readonly frames:
    LivingFrameBlenderRemotionRenderableSequence['rgbaFrames']
  readonly sourceBytes: Buffer
  readonly captionBytes: Buffer
  readonly runtime: Awaited<
    ReturnType<
      typeof activateOrPrepareRemotionRuntime
    >
  >
  readonly sequence:
    LivingFrameBlenderRemotionRenderableSequence
  readonly componentOffset?: {
    readonly xNormalized: number
    readonly yNormalized: number
  }
  readonly sceneId: string
}): Promise<{
  readonly bytes: Buffer
  readonly receipt:
    LivingFrameBlenderSelectedSceneRemotionReviewChunkReceipt
}> {
  if (
    input.frames.length < 1
    || input.frames.length >
      MAXIMUM_OVERLAYS_PER_CHUNK
  ) {
    throw new Error(
      'Living Frame Blender Remotion review chunk size is invalid.',
    )
  }
  const chunkLabel =
    String(input.order).padStart(2, '0')
  const sourceCommitment =
    commitment(input.sourceBytes)
  const captionCommitment =
    commitment(input.captionBytes)
  const overlays =
    input.frames.map(
      (frame, localFrame) => {
        const label =
          String(localFrame).padStart(2, '0')
        const componentOutputKey =
          `lf-blender-c${chunkLabel}-f${label}`
        return {
          frame,
          localFrame,
          componentOutputKey,
          commitment:
            commitment(frame.bytes),
          motionSpec:
            createFrameGateMotionSpec({
              sceneId:
                input.sceneId,
              componentId:
                componentOutputKey,
              startFrame: localFrame,
              selectedSceneBindingDigestSha256:
                input.sequence
                  .selectedSceneBindingDigestSha256,
              timingBindingDigestSha256:
                input.sequence
                  .currentMasterTimingDigestSha256,
              deterministicMotionBundleDigestSha256:
                input.sequence
                  .artifactSetDigestSha256,
              componentOffset:
                input.componentOffset,
            }),
        }
      },
    )
  const request =
    buildOfflineRemotionFinalCompositionStreamingRequest({
      planningPayload: {
        compositionProfileId:
          'approved_source_caption_final_v1',
        width: REVIEW_WIDTH,
        height: REVIEW_HEIGHT,
        fps: FPS,
        durationFrames:
          CHUNK_RENDER_FRAMES,
        sourceStartFrame: 0,
        sourceEndFrameExclusive:
          CHUNK_RENDER_FRAMES,
        sourceFit: 'contain',
        panelBackground: '#E8DFC8',
        audioPolicy: 'preserve_source',
        captionOverlayPolicy:
          'approved_full_frame_rgba',
        livingFrameOverlayPolicy:
          'approved_rgba_over_source_below_captions_v1',
        livingFrameOverlayLayers:
          overlays.map((overlay) => ({
            sceneId:
              overlay.motionSpec.sceneId,
            layerId:
              `lf-blender-layer-c${chunkLabel}-f${String(overlay.localFrame).padStart(2, '0')}`,
            manifestOutputKey:
              `lf-blender-manifest-c${chunkLabel}-f${String(overlay.localFrame).padStart(2, '0')}`,
            componentOutputKey:
              overlay.componentOutputKey,
            startFrame:
              overlay.localFrame,
            endFrameExclusive:
              overlay.localFrame + 2,
            fit: 'fill',
            opacity: 1,
            motionSpec:
              overlay.motionSpec,
          })),
      },
      source: {
        inputId:
          `lf-blender-source-c${chunkLabel}`,
        mimeType: 'video/mp4',
        ...sourceCommitment,
      },
      captionOverlay: {
        inputId:
          `lf-blender-caption-c${chunkLabel}`,
        mimeType: 'image/png',
        ...captionCommitment,
      },
      livingFrameOverlays:
        overlays.map((overlay) => ({
          inputId:
            `lf-blender-frame-c${chunkLabel}-f${String(overlay.localFrame).padStart(2, '0')}`,
          outputKey:
            overlay.componentOutputKey,
          mimeType: 'image/png',
          ...overlay.commitment,
        })),
    })
  const inputs:
    OfflineRemotionServerInjectedInput[] = [
      privateBufferInput(
        `lf-blender-source-c${chunkLabel}`,
        'video/mp4',
        input.sourceBytes,
        sourceCommitment,
      ),
      ...overlays.map((overlay) =>
        privateBufferInput(
          `lf-blender-frame-c${chunkLabel}-f${String(overlay.localFrame).padStart(2, '0')}`,
          'image/png',
          overlay.frame.bytes,
          overlay.commitment,
        )),
      privateBufferInput(
        `lf-blender-caption-c${chunkLabel}`,
        'image/png',
        input.captionBytes,
        captionCommitment,
      ),
    ]
  let renderedBytes: Buffer | undefined
  const result =
    await input.runtime.executeServerInjected(
      request,
      inputs,
      {
        maximumBytes:
          OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
        async persist(output) {
          renderedBytes =
            await readExactStream({
              stream: output.stream,
              expectedByteLength:
                output.expectedByteLength,
              expectedSha256:
                output.expectedSha256,
            })
          return {
            byteLength:
              output.expectedByteLength,
            sha256:
              output.expectedSha256,
          }
        },
      },
    )
  if (renderedBytes == null) {
    throw new Error(
      'Living Frame Blender Remotion review chunk emitted no private bytes.',
    )
  }
  const media =
    inspectRenderedMedia(
      renderedBytes,
      CHUNK_RENDER_FRAMES,
    )
  const semantic =
    result.evidence.semanticEvidence
  if (
    media.width !== REVIEW_WIDTH
    || media.height !== REVIEW_HEIGHT
    || media.fps !== FPS
    || media.frameCount !==
      CHUNK_RENDER_FRAMES
    || semantic
      .approvedLivingFrameOverlayInputServerInjectedWithoutBase64 !==
        true
    || semantic
      .approvedLivingFrameDeterministicMotionApplied !==
        true
    || semantic
      .approvedLivingFrameOverlayBelowCaptionsApplied !==
        true
    || semantic
      .serverInjectedInputStreamsMaterializedAndReverified !==
        true
    || semantic
      .serverInjectedOutputStreamEmitted !==
        true
  ) {
    throw new Error(
      'Living Frame Blender Remotion review chunk evidence is incomplete.',
    )
  }
  return {
    bytes: renderedBytes,
    receipt: {
      order: input.order,
      sourceStartFrame:
        input.frames[0]!.commitment.frame,
      sourceEndFrameExclusive:
        input.frames.at(-1)!.commitment
          .frame + 1,
      sourceFrameCount:
        input.frames.length,
      localRenderedDurationFrames:
        CHUNK_RENDER_FRAMES,
      localOverlayCount:
        input.frames.length,
      maximumCanonicalOverlayCount:
        MAXIMUM_OVERLAYS_PER_CHUNK,
      remotionRequestDigestSha256:
        result.evidence
          .requestEnvelopeSha256,
      remotionArtifactDigestSha256:
        result.artifact.sha256,
      exactSourceFramesRetainedDuringPackaging:
        true,
      fillerFramesDiscardedDuringPackaging:
        CHUNK_RENDER_FRAMES -
        input.frames.length,
    },
  }
}

async function packageChunks(input: {
  readonly chunks: readonly Buffer[]
  readonly frameCounts: readonly number[]
}): Promise<Buffer> {
  if (
    input.chunks.length !== 4
    || input.frameCounts.length !== 4
    || input.frameCounts.reduce(
      (sum, count) => sum + count,
      0,
    ) !== 60
    || input.frameCounts.some(
      (count) =>
        !Number.isInteger(count)
        || count < 1
        || count >
          MAXIMUM_OVERLAYS_PER_CHUNK,
    )
  ) {
    throw new Error(
      'Living Frame Blender Remotion review packaging input is invalid.',
    )
  }
  const directory =
    await mkdtemp(
      join(
        tmpdir(),
        'reeditpro-lf-blender-remotion-package-',
      ),
    )
  try {
    const paths = input.chunks.map(
      (_, order) =>
        join(
          directory,
          `chunk-${String(order).padStart(2, '0')}.mp4`,
        ),
    )
    await Promise.all(
      paths.map((path, order) =>
        writeFile(
          path,
          input.chunks[order]!,
          {
            flag: 'wx',
            mode: 0o600,
          },
        )),
    )
    const filters: string[] = []
    const concat: string[] = []
    for (
      let order = 0;
      order < paths.length;
      order += 1
    ) {
      const count =
        input.frameCounts[order]!
      filters.push(
        `[${order}:v]trim=start_frame=0:end_frame=${count},setpts=PTS-STARTPTS[v${order}]`,
        `[${order}:a]atrim=start=0:end=${(count / FPS).toFixed(9)},asetpts=PTS-STARTPTS[a${order}]`,
      )
      concat.push(
        `[v${order}][a${order}]`,
      )
    }
    filters.push(
      `${concat.join('')}concat=n=${paths.length}:v=1:a=1[vout][aout]`,
    )
    const result = spawnSync(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        ...paths.flatMap((path) => [
          '-i',
          path,
        ]),
        '-filter_complex',
        filters.join(';'),
        '-map',
        '[vout]',
        '-map',
        '[aout]',
        '-frames:v',
        '60',
        '-r',
        String(FPS),
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '18',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '96k',
        '-movflags',
        'frag_keyframe+empty_moov',
        '-f',
        'mp4',
        '-threads',
        '1',
        'pipe:1',
      ],
      {
        encoding: null,
        maxBuffer:
          MAXIMUM_RENDERED_BYTES,
      },
    )
    if (
      result.status !== 0
      || result.stdout.byteLength <
        1_024
      || result.stdout.subarray(
        4,
        8,
      ).toString('ascii') !== 'ftyp'
    ) {
      throw new Error(
        'Living Frame Blender Remotion review packaging failed.',
      )
    }
    return Buffer.from(result.stdout)
  } finally {
    await rm(directory, {
      recursive: true,
      force: true,
    }).catch(() => undefined)
  }
}

function createFrameGateMotionSpec(input: {
  readonly sceneId: string
  readonly componentId: string
  readonly startFrame: number
  readonly selectedSceneBindingDigestSha256: string
  readonly timingBindingDigestSha256: string
  readonly deterministicMotionBundleDigestSha256: string
  readonly componentOffset?: {
    readonly xNormalized: number
    readonly yNormalized: number
  }
}): CanonicalLivingFrameMotionSpec {
  const keyframes = [{
    frameOffset: 0,
    value: 1,
    easingToNext: 'hold' as const,
  }, {
    frameOffset: 1,
    value: 0,
    easingToNext: 'hold' as const,
  }]
  const opacityTrack = {
    trackId:
      `lf-blender-frame-gate-${String(input.startFrame).padStart(4, '0')}`,
    order: 0,
    target: 'layer' as const,
    property: 'opacity' as const,
    role: 'primary' as const,
    keyframes,
    compiledSampleCount: 2,
    compiledSampleDigestSha256:
      deriveCanonicalLivingFrameCompiledSampleDigestSha256({
        keyframes,
        sceneFrameCount: 2,
      }),
  }
  const positionTracks:
    CanonicalLivingFrameMotionSpecDraft['tracks'] =
      input.componentOffset == null
        ? []
        : [
          constantTrack({
            trackId:
              `lf-blender-frame-position-x-${String(input.startFrame).padStart(4, '0')}`,
            order: 1,
            property:
              'position_x_normalized',
            value:
              input.componentOffset
                .xNormalized,
          }),
          constantTrack({
            trackId:
              `lf-blender-frame-position-y-${String(input.startFrame).padStart(4, '0')}`,
            order: 2,
            property:
              'position_y_normalized',
            value:
              input.componentOffset
                .yNormalized,
          }),
        ]
  const tracks = [
    opacityTrack,
    ...positionTracks,
  ]
  const draft:
    CanonicalLivingFrameMotionSpecDraft = {
      schemaVersion:
        'canonical-living-frame-motion-spec-v3',
      motionProfileId:
        'component_role_activation_selective_visual_interval_choreography_v3',
      sceneId: input.sceneId,
      componentId: input.componentId,
      sceneStartFrame: input.startFrame,
      sceneEndFrameExclusive:
        input.startFrame + 2,
      visualVerb: 'hold',
      importance: 'support',
      depthStyle: 'shallow_2_5d',
      depthBand: 'subject_plane',
      parallaxFactor: 0,
      sourceBindings: {
        selectedSceneBindingDigestSha256:
          input
            .selectedSceneBindingDigestSha256,
        timingBindingDigestSha256:
          input.timingBindingDigestSha256,
        deterministicMotionBundleDigestSha256:
          input
            .deterministicMotionBundleDigestSha256,
      },
      attentionEventIds: [],
      semanticScaleRequestIds: [],
      tracks,
      metrics: {
        layerTrackCount:
          tracks.length,
        cameraTrackCount: 0,
        sourceTrackCount: 0,
        keyframeCount:
          tracks.length * 2,
        compiledSampleCount:
          tracks.length * 2,
      },
      authorityBoundary: {
        serverDerivedFromSelectedSceneAndMasterTiming:
          true,
        exactFrameAuthority: false,
        masterTimingMutationAuthority:
          false,
        soundSyncAuthority: false,
        approvalAuthority: false,
        workGraphAuthority: false,
        rendererCodeAuthority: false,
        providerAuthority: false,
        queueAuthority: false,
        productionAuthority: false,
      },
      exactFramesRemainOwnedByMasterTiming:
        true,
      captionsRemainAboveLivingFrame:
        true,
      containsExecutableOrOperationalPayload:
        false,
      subjectSpecificRouting: false,
    }
  return {
    ...draft,
    motionSpecDigestSha256:
      sha256AuthorityValue(draft),
  }
}

function constantTrack(input: {
  readonly trackId: string
  readonly order: number
  readonly property:
    'position_x_normalized'
    | 'position_y_normalized'
  readonly value: number
}): CanonicalLivingFrameMotionSpecDraft['tracks'][number] {
  const keyframes = [{
    frameOffset: 0,
    value: input.value,
    easingToNext: 'hold' as const,
  }, {
    frameOffset: 1,
    value: input.value,
    easingToNext: 'hold' as const,
  }]
  return {
    trackId: input.trackId,
    order: input.order,
    target: 'layer',
    property: input.property,
    role: 'secondary',
    keyframes,
    compiledSampleCount: 2,
    compiledSampleDigestSha256:
      deriveCanonicalLivingFrameCompiledSampleDigestSha256({
        keyframes,
        sceneFrameCount: 2,
      }),
  }
}

async function activateOrPrepareRemotionRuntime() {
  try {
    return await activatePrivateOfflineRemotionRenderRuntime()
  } catch {
    await prepareOfflineRemotionDockerRuntime()
    return activatePrivateOfflineRemotionRenderRuntime()
  }
}

function createSourceVideo(
  durationFrames: number,
): Buffer {
  const durationSeconds =
    durationFrames / FPS
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'lavfi',
      '-i',
      `color=c=0xE8DFC8:size=${REVIEW_WIDTH}x${REVIEW_HEIGHT}:rate=${FPS}:duration=${durationSeconds}`,
      '-f',
      'lavfi',
      '-i',
      `anullsrc=channel_layout=stereo:sample_rate=48000:d=${durationSeconds}`,
      '-vf',
      'drawgrid=width=80:height=80:thickness=1:color=0xC9BFA5@0.45',
      '-frames:v',
      String(durationFrames),
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '18',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '96k',
      '-shortest',
      '-movflags',
      'frag_keyframe+empty_moov',
      '-f',
      'mp4',
      '-threads',
      '1',
      'pipe:1',
    ],
    {
      encoding: null,
      maxBuffer: 32 * 1024 * 1024,
    },
  )
  if (
    result.status !== 0
    || result.stdout.byteLength <
      1_024
    || result.stdout.subarray(
      4,
      8,
    ).toString('ascii') !== 'ftyp'
  ) {
    throw new Error(
      'Living Frame Blender private source review fixture generation failed.',
    )
  }
  return Buffer.from(result.stdout)
}

function createIllustratedSourceVideo(
  durationFrames: number,
  basePlatePngBytes: Buffer,
): Buffer {
  const durationSeconds =
    durationFrames / FPS
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-loop',
      '1',
      '-framerate',
      String(FPS),
      '-i',
      'pipe:0',
      '-f',
      'lavfi',
      '-i',
      `anullsrc=channel_layout=stereo:sample_rate=48000:d=${durationSeconds}`,
      '-frames:v',
      String(durationFrames),
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '18',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '96k',
      '-shortest',
      '-movflags',
      'frag_keyframe+empty_moov',
      '-f',
      'mp4',
      '-threads',
      '1',
      'pipe:1',
    ],
    {
      input: basePlatePngBytes,
      encoding: null,
      maxBuffer: 32 * 1024 * 1024,
    },
  )
  if (
    result.status !== 0
    || result.stdout.byteLength <
      1_024
    || result.stdout.subarray(
      4,
      8,
    ).toString('ascii') !== 'ftyp'
  ) {
    throw new Error(
      'Living Frame Blender illustrated source review fixture generation failed.',
    )
  }
  return Buffer.from(result.stdout)
}

function createCaptionOverlay(): Buffer {
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-f',
      'lavfi',
      '-i',
      `color=c=black@0:size=${REVIEW_WIDTH}x${REVIEW_HEIGHT}:duration=1`,
      '-vf',
      [
        'format=rgba',
        'colorchannelmixer=aa=0',
        'drawbox=x=120:y=304:w=400:h=34:color=0xD81B78@1:t=fill:replace=1',
        'drawbox=x=144:y=315:w=352:h=3:color=0xFFF5E6@1:t=fill:replace=1',
      ].join(','),
      '-frames:v',
      '1',
      '-c:v',
      'png',
      '-f',
      'image2pipe',
      '-threads',
      '1',
      'pipe:1',
    ],
    {
      encoding: null,
      maxBuffer: 16 * 1024 * 1024,
    },
  )
  if (
    result.status !== 0
    || result.stdout.byteLength < 67
    || result.stdout.subarray(
      0,
      8,
    ).toString('hex') !==
      '89504e470d0a1a0a'
  ) {
    throw new Error(
      'Living Frame Blender private caption review fixture generation failed.',
    )
  }
  return Buffer.from(result.stdout)
}

function inspectRenderedMedia(
  bytes: Buffer,
  expectedFrameCount: 24 | 60,
): {
  readonly width: number
  readonly height: number
  readonly fps: number
  readonly frameCount: number
  readonly pixelFormat: string
  readonly probeEvidenceDigestSha256:
    string
} {
  const result = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-count_frames',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=codec_name,width,height,avg_frame_rate,nb_frames,nb_read_frames,pix_fmt',
      '-of',
      'json',
      'pipe:0',
    ],
    {
      input: bytes,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    },
  )
  if (result.status !== 0) {
    throw new Error(
      'Living Frame Blender private Remotion review probe failed.',
    )
  }
  const parsed = JSON.parse(
    result.stdout,
  ) as {
    streams?: Array<{
      codec_name?: string
      width?: number
      height?: number
      avg_frame_rate?: string
      nb_frames?: string
      nb_read_frames?: string
      pix_fmt?: string
    }>
  }
  const stream = parsed.streams?.[0]
  const [numerator, denominator] =
    String(
      stream?.avg_frame_rate ?? '',
    ).split('/').map(Number)
  const summary = {
    codecName: stream?.codec_name,
    width: Number(stream?.width),
    height: Number(stream?.height),
    fps:
      denominator === 0
        ? Number.NaN
        : numerator / denominator,
    frameCount: Number(
      stream?.nb_read_frames
      ?? stream?.nb_frames,
    ),
    pixelFormat:
      String(stream?.pix_fmt ?? ''),
  }
  if (
    summary.codecName !== 'h264'
    || summary.width !== REVIEW_WIDTH
    || summary.height !== REVIEW_HEIGHT
    || summary.fps !== FPS
    || summary.frameCount !==
      expectedFrameCount
    || summary.pixelFormat.length < 1
    || summary.pixelFormat.length > 64
  ) {
    throw new Error(
      'Living Frame Blender private Remotion review media identity is invalid.',
    )
  }
  return {
    width: summary.width,
    height: summary.height,
    fps: summary.fps,
    frameCount: summary.frameCount,
    pixelFormat: summary.pixelFormat,
    probeEvidenceDigestSha256:
      sha256AuthorityValue(summary),
  }
}

function extractRenderedFrames(
  bytes: Buffer,
  frameNumbers: readonly number[],
): readonly Buffer[] {
  const selector =
    frameNumbers.map(
      (frame) => `eq(n\\,${frame})`,
    ).join('+')
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-vf',
      `select=${selector}`,
      '-fps_mode',
      'vfr',
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      'pipe:1',
    ],
    {
      input: bytes,
      encoding: null,
      maxBuffer:
        REVIEW_WIDTH * REVIEW_HEIGHT
        * 3 * (frameNumbers.length + 2),
    },
  )
  const frameBytes =
    REVIEW_WIDTH * REVIEW_HEIGHT * 3
  if (
    result.status !== 0
    || result.stdout.byteLength !==
      frameBytes * frameNumbers.length
  ) {
    throw new Error(
      'Living Frame Blender private Remotion review frame extraction failed.',
    )
  }
  return frameNumbers.map(
    (_, index) =>
      Buffer.from(
        result.stdout.subarray(
          index * frameBytes,
          (index + 1) * frameBytes,
        ),
      ),
  )
}

function measureRenderedVisuals(
  frames: readonly Buffer[],
  profile: 'grid' | 'illustrated_musashi',
): {
  readonly subjectPixelCounts:
    readonly number[]
  readonly middlePoseDifferentPixelCount:
    number
  readonly firstFinalMeanAbsoluteDifference:
    number
} {
  if (frames.length !== 3) {
    throw new Error(
      'Living Frame Blender private Remotion review sample count is invalid.',
    )
  }
  const subjectPixelCounts =
    frames.map(subjectPixelCount)
  const captionCounts =
    frames.map((frame) =>
      captionPixelCount(frame, profile))
  const sourceCounts =
    frames.map((frame) =>
      sourcePlatePixelCount(
        frame,
        profile,
      ))
  const middlePoseDifferentPixelCount =
    differentRgbPixelCount(
      frames[0]!,
      frames[1]!,
      12,
    )
  const firstFinalMeanAbsoluteDifference =
    meanAbsoluteDifference(
      frames[0]!,
      frames[2]!,
    )
  if (
    subjectPixelCounts.some(
      (count) => count < 1_000,
    )
    || captionCounts.some(
      (count) =>
        count < (
          profile === 'grid'
            ? 8_000
            : 500
        ),
    )
    || sourceCounts.some(
      (count) => count < 5_000,
    )
    || middlePoseDifferentPixelCount <
      250
    || firstFinalMeanAbsoluteDifference >
      3
  ) {
    throw new Error(
      `Living Frame Blender rendered motion, restoration, source plate, or caption-plane QA failed: profile=${profile}, subject=${subjectPixelCounts.join(',')}, caption=${captionCounts.join(',')}, source=${sourceCounts.join(',')}, motion=${middlePoseDifferentPixelCount}, restore=${firstFinalMeanAbsoluteDifference}.`,
    )
  }
  return {
    subjectPixelCounts,
    middlePoseDifferentPixelCount,
    firstFinalMeanAbsoluteDifference:
      roundMeasurement(
        firstFinalMeanAbsoluteDifference,
      ),
  }
}

function subjectPixelCount(
  frame: Buffer,
): number {
  let count = 0
  for (
    let y = 30;
    y < 285;
    y += 1
  ) {
    for (
      let x = 60;
      x < 580;
      x += 1
    ) {
      const offset =
        (y * REVIEW_WIDTH + x) * 3
      if (
        frame[offset]! < 105
        && frame[offset + 1]! < 100
        && frame[offset + 2]! < 90
      ) count += 1
    }
  }
  return count
}

function captionPixelCount(
  frame: Buffer,
  profile: 'grid' | 'illustrated_musashi',
): number {
  let count = 0
  for (
    let y = 300;
    y < 342;
    y += 1
  ) {
    for (
      let x = 110;
      x < 530;
      x += 1
    ) {
      const offset =
        (y * REVIEW_WIDTH + x) * 3
      const red = frame[offset]!
      const green =
        frame[offset + 1]!
      const blue =
        frame[offset + 2]!
      if (profile === 'grid') {
        if (
          red > 150
          && green < 100
          && blue > 70
        ) count += 1
      } else if (
        (
          red > 180
          && green > 55
          && green < 180
          && blue < 120
        )
        || (
          red > 180
          && green > 170
          && blue > 145
        )
      ) count += 1
    }
  }
  return count
}

function sourcePlatePixelCount(
  frame: Buffer,
  profile: 'grid' | 'illustrated_musashi',
): number {
  let count = 0
  if (
    profile ===
      'illustrated_musashi'
  ) {
    for (
      let y = 18;
      y < 286;
      y += 1
    ) {
      for (
        let x = 180;
        x < 632;
        x += 1
      ) {
        const offset =
          (y * REVIEW_WIDTH + x) * 3
        const red = frame[offset]!
        const green =
          frame[offset + 1]!
        const blue =
          frame[offset + 2]!
        if (
          red > 55
          && green > 35
          && red > blue * 1.15
        ) count += 1
      }
    }
    return count
  }
  for (
    let y = 8;
    y < 90;
    y += 1
  ) {
    for (
      let x = 8;
      x < 180;
      x += 1
    ) {
      const offset =
        (y * REVIEW_WIDTH + x) * 3
      if (
        frame[offset]! > 170
        && frame[offset + 1]! > 160
        && frame[offset + 2]! > 130
      ) count += 1
    }
  }
  return count
}

function assertIllustratedInput(
  input:
    ExecuteLivingFrameBlenderSelectedSceneIllustratedRemotionReviewInternalTestInput,
): void {
  if (
    !isRecord(input)
    || !isRecord(input.textureBinding)
    || !Buffer.isBuffer(
      input.basePlatePngBytes,
    )
    || !Buffer.isBuffer(
      input.captionPngBytes,
    )
  ) {
    throw new Error(
      'Living Frame Blender illustrated Remotion review input is invalid.',
    )
  }
  const binding =
    input.textureBinding
  const {
    bindingDigestSha256,
    ...bindingDraft
  } = binding
  const basePlate =
    binding.finalCompositionArtifacts
      .basePlate
  const caption =
    binding.finalCompositionArtifacts
      .captionOverlay
  if (
    !SHA256.test(
      bindingDigestSha256,
    )
    || bindingDigestSha256
      !== sha256AuthorityValue(
        bindingDraft,
      )
    || !sameScope(
      binding.canonicalScope,
      input.componentQaReport
        .canonicalScope,
    )
    || binding.sourceBindings
      .admissionDigestSha256 !==
      input.componentQaReport
        .sourceBindings
        .admissionDigestSha256
    || basePlate.byteLength
      !== input.basePlatePngBytes
        .byteLength
    || basePlate.sha256
      !== digestBytes(
        input.basePlatePngBytes,
      )
    || caption.byteLength
      !== input.captionPngBytes
        .byteLength
    || caption.sha256
      !== digestBytes(
        input.captionPngBytes,
      )
    || input.persistenceReport
      .sourceBindings
      .adapterPayloadDigestSha256
      .length !== 64
    || binding.authorityBoundary
      .privateInternalBindingEvidenceAuthority
      !== true
    || binding
      .finalCompositionArtifacts
      .remotionOwnsFinalCanvas !==
      true
    || binding.canonicalQaApproved
    || binding.privateReviewApproved
    || binding.productionReady
  ) {
    throw new Error(
      'Living Frame Blender illustrated Remotion review lineage is invalid.',
    )
  }
}

function differentRgbPixelCount(
  left: Buffer,
  right: Buffer,
  threshold: number,
): number {
  let count = 0
  for (
    let pixel = 0;
    pixel < REVIEW_WIDTH *
      REVIEW_HEIGHT;
    pixel += 1
  ) {
    const offset = pixel * 3
    if (
      Math.abs(
        left[offset]! -
        right[offset]!,
      ) > threshold
      || Math.abs(
        left[offset + 1]! -
        right[offset + 1]!,
      ) > threshold
      || Math.abs(
        left[offset + 2]! -
        right[offset + 2]!,
      ) > threshold
    ) count += 1
  }
  return count
}

function meanAbsoluteDifference(
  left: Buffer,
  right: Buffer,
): number {
  let total = 0
  for (
    let index = 0;
    index < left.byteLength;
    index += 1
  ) {
    total += Math.abs(
      left[index]! - right[index]!,
    )
  }
  return total / left.byteLength
}

async function readExactStream(input: {
  readonly stream: NodeJS.ReadableStream
  readonly expectedByteLength: number
  readonly expectedSha256: string
}): Promise<Buffer> {
  const chunks: Buffer[] = []
  let byteLength = 0
  const digest = createHash('sha256')
  for await (const chunk of input.stream) {
    const bytes =
      typeof chunk === 'string'
        ? Buffer.from(chunk)
        : Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (
      byteLength >
        input.expectedByteLength
      || byteLength >
        MAXIMUM_RENDERED_BYTES
    ) {
      throw new Error(
        'Living Frame Blender private Remotion stream exceeded its exact commitment.',
      )
    }
    digest.update(bytes)
    chunks.push(bytes)
  }
  if (
    byteLength !==
      input.expectedByteLength
    || digest.digest('hex') !==
      input.expectedSha256
  ) {
    throw new Error(
      'Living Frame Blender private Remotion stream failed exact revalidation.',
    )
  }
  return Buffer.concat(chunks, byteLength)
}

function assertInput(
  input:
    ExecuteLivingFrameBlenderSelectedSceneRemotionReviewInternalTestInput,
): void {
  if (
    !isRecord(input)
    || Object.keys(input).sort().join('|') !== [
      'qualificationId',
      'localStorageRoot',
      'componentQaReport',
      'persistenceReport',
      'privateRemotionSequenceLease',
    ].sort().join('|')
    || typeof input.qualificationId !==
      'string'
    || !SAFE_ID.test(input.qualificationId)
    || typeof input.localStorageRoot !==
      'string'
    || input.localStorageRoot.length < 1
    || !isRecord(input.componentQaReport)
    || !isRecord(input.persistenceReport)
    || !isRecord(
      input.privateRemotionSequenceLease,
    )
  ) {
    throw new Error(
      'Living Frame Blender private Remotion review input is invalid.',
    )
  }
  assertPrivateReviewStorageRoot(
    input.localStorageRoot,
  )
}

function assertPrivateReviewStorageRoot(
  storageRoot: string,
): void {
  const expectedParent =
    realpathSync(tmpdir())
  const resolved = resolve(storageRoot)
  const stat = lstatSync(resolved)
  const realStorageRoot =
    realpathSync(resolved)
  if (
    !stat.isDirectory()
    || stat.isSymbolicLink()
    || dirname(realStorageRoot) !==
      expectedParent
    || !basename(realStorageRoot)
      .startsWith(
        'reeditpro-lf-blender-remotion-review-',
      )
  ) {
    throw new Error(
      'Living Frame Blender private Remotion review root is not an owned bounded internal-test directory.',
    )
  }
}

function assertLineage(
  qa:
    LivingFrameBlenderRigComponentQaInternalTestReport,
  persistence:
    LivingFrameBlenderRigPrivatePersistenceReport,
): void {
  const {
    reportDigestSha256:
      qaDigest,
    ...qaDraft
  } = qa
  const {
    reportDigestSha256:
      persistenceDigest,
    ...persistenceDraft
  } = persistence
  if (
    !SHA256.test(qaDigest)
    || qaDigest !==
      sha256AuthorityValue(qaDraft)
    || !SHA256.test(persistenceDigest)
    || persistenceDigest !==
      sha256AuthorityValue(
        persistenceDraft,
      )
    || qa.sourceBindings
      .persistenceReportDigestSha256 !==
      persistenceDigest
    || qa.sourceBindings
      .privateArtifactSetIdentityHash !==
      persistence.persistedArtifactSet
        .privateArtifactSetIdentityHash
    || qa.sourceBindings
      .manifestDigestSha256 !==
      persistence.persistedArtifactSet
        .manifestDigestSha256
    || qa.sourceBindings
      .artifactSetDigestSha256 !==
      persistence.sourceBindings
        .artifactSetDigestSha256
    || !sameScope(
      qa.canonicalScope,
      persistence.canonicalScope,
    )
    || !qa.privateInternalComponentQaPassed
    || qa.canonicalQaApproved
    || qa.privateReviewApproved
    || qa.productionReady
  ) {
    throw new Error(
      'Living Frame Blender component QA lineage is invalid for private Remotion review.',
    )
  }
}

function assertSequenceLineage(
  sequence:
    LivingFrameBlenderRigPrivateRemotionSequence,
  qa:
    LivingFrameBlenderRigComponentQaInternalTestReport,
  persistence:
    LivingFrameBlenderRigPrivatePersistenceReport,
): void {
  if (
    sequence.componentQaReportDigestSha256 !==
      qa.reportDigestSha256
    || sequence.persistenceReportDigestSha256 !==
      persistence.reportDigestSha256
    || sequence.admissionDigestSha256 !==
      qa.sourceBindings
        .admissionDigestSha256
    || sequence.privateArtifactSetIdentityHash !==
      qa.sourceBindings
        .privateArtifactSetIdentityHash
    || sequence.selectedSceneBindingDigestSha256 !==
      qa.sourceBindings
        .selectedSceneBindingDigestSha256
    || sequence.currentMasterTimingDigestSha256 !==
      qa.sourceBindings
        .currentMasterTimingDigestSha256
    || sequence.confirmedOutputFrameDigestSha256 !==
      qa.sourceBindings
        .confirmedOutputFrameDigestSha256
    || sequence.artifactSetDigestSha256 !==
      qa.sourceBindings
        .artifactSetDigestSha256
    || sequence.widthPixels !==
      SOURCE_WIDTH
    || sequence.heightPixels !==
      SOURCE_HEIGHT
    || sequence.fps !== FPS
    || sequence.startFrame !==
      START_FRAME
    || sequence.endFrameExclusive !==
      END_FRAME_EXCLUSIVE
    || sequence.rgbaFrames.length !==
      60
    || sequence.rgbaFrames.some(
      (frame, order) =>
        frame.commitment.pass !== 'rgba'
        || frame.commitment.frame !==
          START_FRAME + order
        || frame.commitment.contentType !==
          'image/png'
        || frame.bytes.byteLength !==
          frame.commitment.byteLength
        || digestBytes(frame.bytes) !==
          frame.commitment.sha256,
    )
  ) {
    throw new Error(
      'Living Frame Blender private Remotion sequence lineage is invalid.',
    )
  }
}

function assertAirshipNavigatorArticulatedReviewInput(
  input:
    ExecuteLivingFrameAirshipNavigatorArticulatedRemotionReviewInternalTestInput,
): void {
  if (
    !isRecord(input)
    || Object.keys(input).sort().join('|') !== [
      'qualificationId',
      'localStorageRoot',
      'sheetReceipt',
      'preparedAlphaAtlas',
      'fixture',
      'compiledRequest',
      'blenderResult',
      'rgbaFrames',
    ].sort().join('|')
    || typeof input.qualificationId !==
      'string'
    || !SAFE_ID.test(
      input.qualificationId,
    )
    || typeof input.localStorageRoot !==
      'string'
    || !verifyLivingFrameArticulatedPuppetSheetReceipt(
      input.sheetReceipt,
    )
    || !verifyLivingFrameCharacterAnimationRouteDecision(
      input.fixture
        .characterAnimationRouteDecision,
    )
    || !verifyLivingFrameRiggingAdapterCandidate(
      input.fixture
        .candidateRequest,
    )
    || !verifyLivingFrameRigActionPlan(
      input.fixture.actionPlan,
      input.fixture
        .candidateRequest.riggingPlan,
    )
  ) {
    throw new Error(
      'Airship navigator articulated Remotion review input is invalid.',
    )
  }
  assertPrivateReviewStorageRoot(
    input.localStorageRoot,
  )
  const fixture = input.fixture
  const candidate =
    fixture.candidateRequest
  const compiled =
    input.compiledRequest
  const result =
    input.blenderResult
  const texture =
    compiled.payload.material.texture
  if (
    fixture.sceneId !==
      'scene.airship-navigator.spyglass-survey'
    || fixture.componentId !==
      'airship.navigator.character'
    || fixture
      .characterAnimationRouteDecision
      .decision.selectedRoute !==
        'blender_articulated_2_5d'
    || !fixture
      .characterAnimationRouteDecision
      .decision.blenderAdmissionAllowed
    || fixture.reviewedTopology
      .atlasPartCount !== 8
    || fixture.reviewedTopology
      .disconnectedMeshIslandCount !==
        8
    || fixture.reviewedTopology
      .rigidWeightedVertexCount !==
        32
    || fixture.reviewedTopology
      .triangleCount !== 16
    || fixture.reviewedTopology
      .genericWholeImageDeformationUsed
    || input.sheetReceipt
      .sourceArtifact.sha256 !==
        '0a6d52335e32614d57a79ea4f93da81a3a325363aea319d21895cfcddde90b37'
    || input.sheetReceipt
      .expectedPartCount !== 8
    || input.preparedAlphaAtlas
      .artifactId !==
        texture.artifactId
    || input.preparedAlphaAtlas
      .contentType !== 'image/png'
    || input.preparedAlphaAtlas
      .widthPixels !== 1536
    || input.preparedAlphaAtlas
      .heightPixels !== 1024
    || input.preparedAlphaAtlas
      .byteLength !==
        texture.byteLength
    || input.preparedAlphaAtlas
      .sha256 !== texture.sha256
    || compiled.payload
      .candidateRequestDigestSha256 !==
        candidate.requestDigestSha256
    || compiled.payload
      .riggingPlanDigestSha256 !==
        candidate.riggingPlan
          .planDigestSha256
    || compiled.payload
      .actionPlanDigestSha256 !==
        fixture.actionPlan
          .actionDigestSha256
    || compiled.payload.componentId !==
      fixture.componentId
    || compiled.payload.output
      .widthPixels !== SOURCE_WIDTH
    || compiled.payload.output
      .heightPixels !== SOURCE_HEIGHT
    || compiled.payload.output.fps !==
      FPS
    || compiled.payload.output
      .startFrame !== START_FRAME
    || compiled.payload.output
      .endFrameExclusive !==
        END_FRAME_EXCLUSIVE
    || compiled.payload.output
      .frameStep !== 1
    || compiled.payload.mesh
      .vertices.length !== 32
    || compiled.payload.mesh
      .triangles.length !== 16
    || compiled.payload.bones.length !==
      8
    || compiled.payload.ik
      .chainLength !== 3
    || compiled.payload.animation
      .secondaryMotionEnabled
    || stableAuthorityStringify(
      compiled.payload,
    ) !==
      compiled.envelope
        .payloadCanonicalJson
    || digestBytes(
      Buffer.from(
        compiled.envelope
          .payloadCanonicalJson,
        'utf8',
      ),
    ) !==
      compiled.envelope
        .payloadDigestSha256
    || result.componentId !==
      fixture.componentId
    || result
      .candidateRequestDigestSha256 !==
        candidate.requestDigestSha256
    || result.riggingPlanDigestSha256 !==
      candidate.riggingPlan
        .planDigestSha256
    || result.actionPlanDigestSha256 !==
      fixture.actionPlan
        .actionDigestSha256
    || result.payloadDigestSha256 !==
      compiled.payload
        .payloadDigestBindingSha256
    || result.frameCount !== 60
    || !result.transparentRgbaProduced
    || !result.maskPassProduced
    || !result.depthPassProduced
    || !result.remotionOwnsFinalCanvas
    || result.runtimeDispatchAuthority
    || result.assetPersistenceAuthority
    || result.qaApprovalAuthority
    || result.billingAuthority
    || result.publicDeliveryAuthority
    || result.productionAuthority
    || candidate.sourceBindings
      .outputFrameDigestSha256 !==
        fixture.actionPlan
          .sourceBindings
          .outputFrameDigestSha256
    || candidate.sourceBindings
      .masterTimingPlanDigestSha256 !==
        fixture.actionPlan
          .sourceBindings
          .masterTimingPlanDigestSha256
  ) {
    throw new Error(
      'Airship navigator articulated Remotion review lineage is invalid.',
    )
  }
  if (
    input.rgbaFrames.length !==
      60
    || input.rgbaFrames.some(
      (frame, order) => {
        const commitment =
          frame.commitment
        return commitment.pass !==
          'rgba'
          || commitment.frame !==
            START_FRAME + order
          || commitment.contentType !==
            'image/png'
          || !/^frame_\d+\.png$/u.test(
            commitment.fileName,
          )
          || frame.bytes.byteLength !==
            commitment.byteLength
          || digestBytes(
            frame.bytes,
          ) !== commitment.sha256
          || !isExactRgbaPng(
            frame.bytes,
            SOURCE_WIDTH,
            SOURCE_HEIGHT,
          )
      },
    )
    || input.rgbaFrames.reduce(
      (sum, frame) =>
        sum
        + frame.bytes.byteLength,
      0,
    ) !== result.rgbaBytes
    || aggregateFrameDigest(
      input.rgbaFrames,
    ) !==
      result.rgbaAggregateDigestSha256
  ) {
    throw new Error(
      'Airship navigator articulated RGBA sequence commitments are invalid.',
    )
  }
}

function aggregateFrameDigest(
  frames: readonly {
    readonly bytes: Buffer
  }[],
): string {
  const digest = createHash('sha256')
  for (
    const [index, frame] of
      frames.entries()
  ) {
    digest.update(
      String(index),
      'ascii',
    )
    digest.update(
      createHash('sha256')
        .update(frame.bytes)
        .digest(),
    )
  }
  return digest.digest('hex')
}

function isExactRgbaPng(
  bytes: Buffer,
  width: number,
  height: number,
): boolean {
  return bytes.byteLength >= 33
    && bytes.subarray(
      0,
      8,
    ).toString('hex') ===
      '89504e470d0a1a0a'
    && bytes.subarray(
      12,
      16,
    ).toString('ascii') ===
      'IHDR'
    && bytes.readUInt32BE(16) ===
      width
    && bytes.readUInt32BE(20) ===
      height
    && bytes[24] === 8
    && bytes[25] === 6
    && bytes[28] === 0
}

function createArticulatedPuppetPrivatePlaybackLease(
  input: {
    readonly report:
      LivingFrameArticulatedPuppetRemotionReviewInternalTestReport
    readonly privateObjectIdentityHash:
      string
    readonly bytes: Buffer
  },
): LivingFrameArticulatedPuppetPrivatePlaybackLease {
  const lease =
    deepFreeze({
      leaseClass:
        'process_bound_single_use_living_frame_articulated_puppet_private_playback_lease_v1' as const,
      leaseId:
        `lf-articulated-puppet-playback.${sha256AuthorityValue({
          reportDigestSha256:
            input.report
              .reportDigestSha256,
          privateObjectIdentityHash:
            input.privateObjectIdentityHash,
        }).slice(0, 40)}`,
      reportDigestSha256:
        input.report
          .reportDigestSha256,
      privateObjectIdentityHash:
        input.privateObjectIdentityHash,
      contentType:
        'video/mp4' as const,
      byteLength:
        input.bytes.byteLength,
      sha256:
        digestBytes(input.bytes),
      callerSerializable:
        false as const,
      canonicalArtifactAuthority:
        false as const,
      assetManifestAuthority:
        false as const,
      canonicalQaApprovalAuthority:
        false as const,
      privateReviewApprovalAuthority:
        false as const,
      billingAuthority:
        false as const,
      publicDeliveryAuthority:
        false as const,
      productionAuthority:
        false as const,
    })
  articulatedPuppetPrivatePlaybackByLease.set(
    lease,
    {
      reportDigestSha256:
        lease.reportDigestSha256,
      privateObjectIdentityHash:
        lease.privateObjectIdentityHash,
      byteLength:
        lease.byteLength,
      sha256: lease.sha256,
      bytes:
        Buffer.from(input.bytes),
    },
  )
  return lease
}

function chunkFrames<T>(
  frames: readonly T[],
  maximumItems: number,
): readonly (readonly T[])[] {
  const chunks: T[][] = []
  for (
    let offset = 0;
    offset < frames.length;
    offset += maximumItems
  ) {
    chunks.push(
      frames.slice(
        offset,
        offset + maximumItems,
      ),
    )
  }
  return chunks
}

function privateBufferInput(
  inputId: string,
  mimeType:
    'video/mp4' | 'image/png',
  bytes: Uint8Array,
  expected: {
    readonly byteLength: number
    readonly sha256: string
  },
): OfflineRemotionServerInjectedInput {
  const privateBytes =
    Buffer.from(bytes)
  return {
    inputMode:
      'private_verified_stream_v1',
    inputId,
    mimeType,
    ...expected,
    async openStream() {
      return Readable.from([
        privateBytes,
      ])
    },
  }
}

function commitment(
  bytes: Uint8Array,
): {
  readonly byteLength: number
  readonly sha256: string
} {
  return {
    byteLength: bytes.byteLength,
    sha256: digestBytes(bytes),
  }
}

function digestBytes(
  bytes: Uint8Array,
): string {
  return createHash('sha256')
    .update(bytes)
    .digest('hex')
}

function sameScope(
  left: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  },
  right: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  },
): boolean {
  return stableAuthorityStringify(left)
    === stableAuthorityStringify(right)
}

function roundMeasurement(
  value: number,
): number {
  return Number(value.toFixed(6))
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
  for (const nested of Object.values(
    value as Record<string, unknown>,
  )) deepFreeze(nested)
  return value
}
