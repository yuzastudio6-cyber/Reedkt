import {
  createHash,
  randomUUID,
} from 'node:crypto'
import {
  spawnSync,
} from 'node:child_process'
import {
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises'
import {
  tmpdir,
} from 'node:os'
import {
  join,
} from 'node:path'
import {
  Readable,
} from 'node:stream'

import type {
  CanonicalLivingFrameMotionSpec,
  CanonicalLivingFrameMotionSpecDraft,
} from '../../src/types/living-frame-canonical-motion'
import {
  LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_CLASS,
  LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_STATE,
  LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_VERSION,
  LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_VIDEO_LEASE_VERSION,
  type LivingFrameCharacterPixiJsRemotionCompositeInternalTestExecution,
  type LivingFrameCharacterPixiJsRemotionCompositeInternalTestReport,
  type LivingFrameCharacterPixiJsRemotionCompositeInternalTestReportDraft,
  type LivingFrameCharacterPixiJsRemotionPrivateVideoOutput,
  type LivingFrameCharacterPixiJsRemotionVideoLease,
} from '../../src/types/living-frame-character-pixijs-remotion-composite-internal-test'
import {
  inspectCanonicalPrivateRemotionArtifact,
  persistCanonicalPrivateRemotionArtifactStream,
} from '../services/canonical-private-remotion-artifact-storage'
import {
  sha256AuthorityValue,
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
import {
  consumeLivingFrameCharacterPixiJsPrivateSequenceOutputLease,
  executeLivingFrameCharacterPixiJsInternalRuntime,
} from './living-frame-character-pixijs-internal-runtime'
import {
  materializeLivingFrameMusashiBlenderTexturePrivateFixture,
} from './living-frame-musashi-blender-texture-private-fixture'

const QUALIFICATION_ID =
  'lf-character-pixijs-remotion-musashi-private-v1' as const
const WIDTH = 640 as const
const HEIGHT = 360 as const
const FPS = 30 as const
const FRAME_COUNT = 120 as const
const MAXIMUM_OVERLAYS_PER_CHUNK = 15 as const
const CHUNK_RENDER_FRAMES = 24 as const
const CHUNK_COUNT = 8 as const
const REVIEW_FRAMES = [0, 52, 119] as const
const CAPTION_PROTECTED_REGION = {
  x: 0,
  y: 280,
  width: 340,
  height: 80,
} as const
const MAXIMUM_RENDERED_BYTES =
  256 * 1024 * 1024

const videoLeases = new WeakSet<object>()
const consumedVideoLeases =
  new WeakSet<object>()
const privateVideoOutputs = new WeakMap<
  object,
  LivingFrameCharacterPixiJsRemotionPrivateVideoOutput
>()

export async function executeLivingFrameCharacterPixiJsRemotionCompositeInternalTest():
Promise<LivingFrameCharacterPixiJsRemotionCompositeInternalTestExecution> {
  if (arguments.length !== 0) {
    throw new Error(
      'Living Frame character PixiJS Remotion composite accepts no caller input.',
    )
  }
  const pixiExecution =
    await executeLivingFrameCharacterPixiJsInternalRuntime()
  const sequence =
    consumeLivingFrameCharacterPixiJsPrivateSequenceOutputLease(
      pixiExecution.privateSequenceOutputLease,
    )
  assertSequence(sequence)
  const fixture =
    await materializeLivingFrameMusashiBlenderTexturePrivateFixture()
  const storageRoot =
    await mkdtemp(join(
      tmpdir(),
      'reeditpro-lf-character-pixijs-remotion-storage-',
    ))
  try {
    const sourceBytes =
      createSourceVideo(
        CHUNK_RENDER_FRAMES,
      )
    const captionBytes =
      Buffer.from(
        fixture.captionComponent.pngBytes,
      )
    const runtime =
      await activateOrPrepareRemotionRuntime()
    const chunks =
      chunkFrames(
        sequence.frames,
        MAXIMUM_OVERLAYS_PER_CHUNK,
      )
    if (
      chunks.length !== CHUNK_COUNT
      || chunks.some(
        (chunk) =>
          chunk.length !==
            MAXIMUM_OVERLAYS_PER_CHUNK,
      )
    ) {
      throw new Error(
        'Living Frame character PixiJS Remotion chunk partition is invalid.',
      )
    }
    const renderedChunks: Buffer[] = []
    for (
      const [order, frames] of
        chunks.entries()
    ) {
      renderedChunks.push(
        await renderChunk({
          order,
          frames,
          sourceBytes,
          captionBytes,
          runtime,
          selectedSceneBindingDigestSha256:
            pixiExecution.report
              .sourceBindings
              .characterAnimationRouteDecisionDigestSha256,
          timingBindingDigestSha256:
            sha256AuthorityValue({
              fps: FPS,
              startFrame: 0,
              endFrameExclusive:
                FRAME_COUNT,
              source:
                'private_internal_pixi_sequence_only',
            }),
          sequenceDigestSha256:
            sequence.sequenceDigestSha256,
        }),
      )
    }
    const packagedBytes =
      await packageChunks(
        renderedChunks,
      )
    const outputSha256 =
      digestBytes(packagedBytes)
    const privateObjectIdentityHash =
      sha256AuthorityValue({
        contractVersion:
          LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_VERSION,
        qualificationId:
          QUALIFICATION_ID,
        pixiJsRuntimeReportDigestSha256:
          pixiExecution.report
            .reportDigestSha256,
        sequenceDigestSha256:
          sequence.sequenceDigestSha256,
        outputSha256,
      })
    const persisted =
      await persistCanonicalPrivateRemotionArtifactStream({
        localStorageRoot: storageRoot,
        privateObjectIdentityHash,
        stream:
          Readable.from([
            packagedBytes,
          ]),
        expectedByteLength:
          packagedBytes.byteLength,
        expectedSha256:
          outputSha256,
      })
    if (persisted.replayed) {
      throw new Error(
        'Living Frame character PixiJS Remotion artifact unexpectedly replayed.',
      )
    }
    const reopened =
      await inspectCanonicalPrivateRemotionArtifact({
        localStorageRoot: storageRoot,
        privateObjectIdentityHash,
      })
    if (
      reopened == null
      || reopened.byteLength !==
        packagedBytes.byteLength
      || reopened.sha256 !== outputSha256
    ) {
      throw new Error(
        'Living Frame character PixiJS Remotion private artifact changed after persistence.',
      )
    }
    const reread =
      await readExactStream({
        stream:
          await reopened.openStream(),
        expectedByteLength:
          packagedBytes.byteLength,
        expectedSha256: outputSha256,
      })
    if (!reread.equals(packagedBytes)) {
      throw new Error(
        'Living Frame character PixiJS Remotion private artifact failed exact reread.',
      )
    }
    const media =
      inspectRenderedMedia(
        packagedBytes,
      )
    const reviewPngs =
      REVIEW_FRAMES.map((frame) =>
        extractRenderedFramePng(
          packagedBytes,
          frame,
        ))
    const reviewRgb =
      REVIEW_FRAMES.map((frame) =>
        extractRenderedFrameRgb(
          packagedBytes,
          frame,
        ))
    const captionProtectedRegionSequence =
      extractRenderedCaptionProtectedRegionRgbSequence(
        packagedBytes,
      )
    const maximumCaptionProtectedRegionMeanAbsoluteDifference =
      roundMeasurement(
        maximumFrameMeanAbsoluteDifferenceFromFirst({
          frames:
            captionProtectedRegionSequence,
          frameByteLength:
            CAPTION_PROTECTED_REGION.width
            * CAPTION_PROTECTED_REGION.height
            * 3,
          frameCount: FRAME_COUNT,
        }),
      )
    const firstMiddleDifferentPixelCount =
      differentRgbPixelCount(
        reviewRgb[0]!,
        reviewRgb[1]!,
        10,
      )
    const firstFinalMeanAbsoluteDifference =
      roundMeasurement(
        meanAbsoluteDifference(
          reviewRgb[0]!,
          reviewRgb[2]!,
        ),
      )
    assertRenderedVisuals({
      reviewRgb,
      firstMiddleDifferentPixelCount,
      firstFinalMeanAbsoluteDifference,
      maximumCaptionProtectedRegionMeanAbsoluteDifference,
    })
    const reportDraft:
      LivingFrameCharacterPixiJsRemotionCompositeInternalTestReportDraft = {
        contractVersion:
          LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_VERSION,
        resultClass:
          LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_CLASS,
        runtimeState:
          LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_COMPOSITE_INTERNAL_TEST_STATE,
        qualificationId:
          QUALIFICATION_ID,
        sourceBindings: {
          pixiJsRuntimeReportDigestSha256:
            pixiExecution.report
              .reportDigestSha256,
          pixiJsSequenceDigestSha256:
            sequence.sequenceDigestSha256,
          characterAnimationRouteDecisionDigestSha256:
            pixiExecution.report
              .sourceBindings
              .characterAnimationRouteDecisionDigestSha256,
          rejectedSwordArmRouteDecisionDigestSha256:
            pixiExecution.report
              .sourceBindings
              .rejectedSwordArmRouteDecisionDigestSha256,
        },
        compositionIdentity: {
          widthPixels: WIDTH,
          heightPixels: HEIGHT,
          fps: FPS,
          startFrame: 0,
          endFrameExclusive:
            FRAME_COUNT,
          finalFrameCount:
            FRAME_COUNT,
          pixiJsFrameCount:
            FRAME_COUNT,
          remotionChunkCount:
            CHUNK_COUNT,
          maximumOverlaysPerChunk:
            MAXIMUM_OVERLAYS_PER_CHUNK,
          everyFinalFrameUsesExactPixiJsPngBytes:
            true,
          captionPlaneAboveLivingFrame:
            true,
          remotionRemainsFinalCanvas:
            true,
        },
        runtimeIdentity: {
          pixiJsToolId: 'pixijs',
          pixiJsOperationId:
            'tool.pixijs.render_pixi_scene.v1',
          remotionToolId: 'remotion',
          remotionOperationId:
            'tool.remotion.render_approved_composition.v1',
          remotionPackageVersion:
            '4.0.487',
          actualPixiJsApplicationInitExecuted:
            true,
          actualRemotionRenderCount:
            CHUNK_COUNT,
          actualFfmpegPackagingExecuted:
            true,
          actualFfprobeQaExecuted:
            true,
        },
        renderedQa: {
          codecName: 'h264',
          pixelFormat:
            media.pixelFormat,
          exactDimensionsPassed: true,
          exactFrameRatePassed: true,
          exactFrameCountPassed: true,
          sourcePoseRestoredAtFinalFrame:
            true,
          wholeCharacterMotionVisible:
            true,
          noArticulatedBodyPartCutOrWarpRouteUsed:
            true,
          captionVisibleAboveCharacter:
            true,
          captionProtectedRegionStable:
            true,
          maximumCaptionProtectedRegionMeanAbsoluteDifference,
          reviewFrameIndexes:
            REVIEW_FRAMES,
          reviewFramePngDigestsSha256:
            [
              digestBytes(
                reviewPngs[0]!,
              ),
              digestBytes(
                reviewPngs[1]!,
              ),
              digestBytes(
                reviewPngs[2]!,
              ),
            ],
          firstMiddleDifferentPixelCount,
          firstFinalMeanAbsoluteDifference,
        },
        persistedPrivateArtifact: {
          persistenceOwner:
            'canonical_private_remotion_artifact_storage',
          contentType: 'video/mp4',
          privateObjectIdentityHash,
          byteLength:
            packagedBytes.byteLength,
          sha256: outputSha256,
          createOnlyPersistenceUsed:
            true,
          replayed: false,
          exactPrivateReadbackVerified:
            true,
          rawBytesIncluded: false,
          storagePathIncluded: false,
        },
        swordActionBoundary: {
          currentSwordArmCompositeRejected:
            true,
          requiredRoute:
            'comfyui_controlled_component_preparation',
          downstreamRouteAfterPreparation:
            'pixijs_rigid_cutout',
          independentPerFrameGenerationAllowed:
            false,
        },
        authorityBoundary: {
          privateInternalCompositeEvidenceAuthority:
            true,
          selectedSceneAuthority: false,
          approvedSnapshotAuthority:
            false,
          masterTimingAuthority: false,
          operationRegistryAuthority:
            false,
          workGraphAuthority: false,
          dispatchAuthority: false,
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
        operationRegistered: false,
        canonicalDispatchIntegrated:
          false,
        canonicalAssetManifestMutated:
          false,
        canonicalQaApproved: false,
        privateReviewApproved: false,
        actualCostCreated: false,
        customerCharged: false,
        publicDeliveryReady: false,
        productionReady: false,
      }
    const report:
      LivingFrameCharacterPixiJsRemotionCompositeInternalTestReport =
        Object.freeze({
          ...reportDraft,
          reportDigestSha256:
            sha256AuthorityValue(
              reportDraft,
            ),
        })
    const privateOutput:
      LivingFrameCharacterPixiJsRemotionPrivateVideoOutput =
        Object.freeze({
          qualificationId:
            QUALIFICATION_ID,
          reportDigestSha256:
            report.reportDigestSha256,
          outputSha256,
          outputByteLength:
            packagedBytes.byteLength,
          widthPixels: WIDTH,
          heightPixels: HEIGHT,
          fps: FPS,
          frameCount:
            FRAME_COUNT,
          mp4Bytes:
            new Uint8Array(
              packagedBytes,
            ),
        })
    const lease =
      Object.freeze({
        contractVersion:
          LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_VIDEO_LEASE_VERSION,
        leaseId:
          `lf-character-pixijs-remotion.${randomUUID()}`,
        qualificationId:
          QUALIFICATION_ID,
        reportDigestSha256:
          report.reportDigestSha256,
        outputSha256,
        outputByteLength:
          packagedBytes.byteLength,
        processBound: true,
        singleUse: true,
        containsRawVideoBytes: false,
        containsStoragePathUrlCredentialCommandOrEnvironment:
          false,
        dispatchAuthority: false,
        artifactAuthority: false,
        assetManifestAuthority: false,
        qaApprovalAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        productionAuthority: false,
      } satisfies LivingFrameCharacterPixiJsRemotionVideoLease)
    videoLeases.add(lease)
    privateVideoOutputs.set(
      lease,
      privateOutput,
    )
    return Object.freeze({
      report,
      privateVideoLease: lease,
    })
  } finally {
    await fixture.cleanup()
    await rm(storageRoot, {
      recursive: true,
      force: true,
    }).catch(() => undefined)
  }
}

export function consumeLivingFrameCharacterPixiJsRemotionPrivateVideoLease(
  lease:
    LivingFrameCharacterPixiJsRemotionVideoLease,
): LivingFrameCharacterPixiJsRemotionPrivateVideoOutput {
  if (
    !videoLeases.has(lease)
    || consumedVideoLeases.has(lease)
  ) {
    throw new Error(
      'Living Frame character PixiJS Remotion video lease is invalid or consumed.',
    )
  }
  const output =
    privateVideoOutputs.get(lease)
  if (
    output == null
    || lease.contractVersion !==
      LIVING_FRAME_CHARACTER_PIXIJS_REMOTION_VIDEO_LEASE_VERSION
    || lease.qualificationId !==
      output.qualificationId
    || lease.reportDigestSha256 !==
      output.reportDigestSha256
    || lease.outputSha256 !==
      output.outputSha256
    || lease.outputByteLength !==
      output.outputByteLength
    || lease.processBound !== true
    || lease.singleUse !== true
    || lease.containsRawVideoBytes
    || lease
      .containsStoragePathUrlCredentialCommandOrEnvironment
    || lease.dispatchAuthority
    || lease.artifactAuthority
    || lease.assetManifestAuthority
    || lease.qaApprovalAuthority
    || lease.costAuthority
    || lease.billingAuthority
    || lease.productionAuthority
  ) {
    throw new Error(
      'Living Frame character PixiJS Remotion video lease lineage is invalid.',
    )
  }
  consumedVideoLeases.add(lease)
  privateVideoOutputs.delete(lease)
  return Object.freeze({
    ...output,
    mp4Bytes:
      new Uint8Array(
        output.mp4Bytes,
      ),
  })
}

async function renderChunk(input: {
  readonly order: number
  readonly frames:
    readonly {
      readonly order: number
      readonly absoluteFrame: number
      readonly pngBytes:
        Uint8Array
    }[]
  readonly sourceBytes: Buffer
  readonly captionBytes: Buffer
  readonly runtime:
    Awaited<
      ReturnType<
        typeof activateOrPrepareRemotionRuntime
      >
    >
  readonly selectedSceneBindingDigestSha256:
    string
  readonly timingBindingDigestSha256:
    string
  readonly sequenceDigestSha256:
    string
}): Promise<Buffer> {
  const chunkLabel =
    String(input.order).padStart(
      2,
      '0',
    )
  const sourceCommitment =
    commitment(input.sourceBytes)
  const captionCommitment =
    commitment(input.captionBytes)
  const overlays =
    input.frames.map(
      (frame, localFrame) => {
        const localLabel =
          String(localFrame).padStart(
            2,
            '0',
          )
        const componentOutputKey =
          `lf-character-pixijs-c${chunkLabel}-f${localLabel}`
        const motionSpec =
          createFrameGateMotionSpec({
            sceneId:
              'scene.musashi-strike',
            componentId:
              componentOutputKey,
            startFrame: localFrame,
            selectedSceneBindingDigestSha256:
              input
                .selectedSceneBindingDigestSha256,
            timingBindingDigestSha256:
              input
                .timingBindingDigestSha256,
            deterministicMotionBundleDigestSha256:
              input
                .sequenceDigestSha256,
          })
        return {
          frame,
          localFrame,
          localLabel,
          componentOutputKey,
          motionSpec,
          commitment:
            commitment(
              frame.pngBytes,
            ),
        }
      },
    )
  const request =
    buildOfflineRemotionFinalCompositionStreamingRequest({
      planningPayload: {
        compositionProfileId:
          'approved_source_caption_final_v1',
        width: WIDTH,
        height: HEIGHT,
        fps: FPS,
        durationFrames:
          CHUNK_RENDER_FRAMES,
        sourceStartFrame: 0,
        sourceEndFrameExclusive:
          CHUNK_RENDER_FRAMES,
        sourceFit: 'contain',
        panelBackground: '#11131A',
        audioPolicy:
          'preserve_source',
        captionOverlayPolicy:
          'approved_full_frame_rgba',
        livingFrameOverlayPolicy:
          'approved_rgba_over_source_below_captions_v1',
        livingFrameOverlayLayers:
          overlays.map((overlay) => ({
            sceneId:
              overlay.motionSpec.sceneId,
            layerId:
              `lf-character-pixijs-layer-c${chunkLabel}-f${overlay.localLabel}`,
            manifestOutputKey:
              `lf-character-pixijs-manifest-c${chunkLabel}-f${overlay.localLabel}`,
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
          `lf-character-pixijs-source-c${chunkLabel}`,
        mimeType: 'video/mp4',
        ...sourceCommitment,
      },
      captionOverlay: {
        inputId:
          `lf-character-pixijs-caption-c${chunkLabel}`,
        mimeType: 'image/png',
        ...captionCommitment,
      },
      livingFrameOverlays:
        overlays.map((overlay) => ({
          inputId:
            `lf-character-pixijs-frame-c${chunkLabel}-f${overlay.localLabel}`,
          outputKey:
            overlay.componentOutputKey,
          mimeType: 'image/png',
          ...overlay.commitment,
        })),
    })
  const inputs:
    OfflineRemotionServerInjectedInput[] = [
      privateBufferInput(
        `lf-character-pixijs-source-c${chunkLabel}`,
        'video/mp4',
        input.sourceBytes,
        sourceCommitment,
      ),
      ...overlays.map((overlay) =>
        privateBufferInput(
          `lf-character-pixijs-frame-c${chunkLabel}-f${overlay.localLabel}`,
          'image/png',
          overlay.frame.pngBytes,
          overlay.commitment,
        )),
      privateBufferInput(
        `lf-character-pixijs-caption-c${chunkLabel}`,
        'image/png',
        input.captionBytes,
        captionCommitment,
      ),
    ]
  let renderedBytes: Buffer | undefined
  const result =
    await input.runtime
      .executeServerInjected(
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
      'Living Frame character PixiJS Remotion chunk emitted no bytes.',
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
    media.frameCount !==
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
      'Living Frame character PixiJS Remotion chunk evidence is incomplete.',
    )
  }
  return renderedBytes
}

function createFrameGateMotionSpec(input: {
  readonly sceneId: string
  readonly componentId: string
  readonly startFrame: number
  readonly selectedSceneBindingDigestSha256:
    string
  readonly timingBindingDigestSha256:
    string
  readonly deterministicMotionBundleDigestSha256:
    string
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
  const track:
    CanonicalLivingFrameMotionSpecDraft['tracks'][number] = {
      trackId:
        `lf-character-pixijs-frame-gate-${String(input.startFrame).padStart(4, '0')}`,
      order: 0,
      target: 'layer',
      property: 'opacity',
      role: 'primary',
      keyframes,
      compiledSampleCount: 2,
      compiledSampleDigestSha256:
        deriveCanonicalLivingFrameCompiledSampleDigestSha256({
          keyframes,
          sceneFrameCount: 2,
        }),
    }
  const draft:
    CanonicalLivingFrameMotionSpecDraft = {
      schemaVersion:
        'canonical-living-frame-motion-spec-v3',
      motionProfileId:
        'component_role_activation_selective_visual_interval_choreography_v3',
      sceneId: input.sceneId,
      componentId:
        input.componentId,
      sceneStartFrame:
        input.startFrame,
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
          input
            .timingBindingDigestSha256,
        deterministicMotionBundleDigestSha256:
          input
            .deterministicMotionBundleDigestSha256,
      },
      attentionEventIds: [],
      semanticScaleRequestIds: [],
      tracks: [track],
      metrics: {
        layerTrackCount: 1,
        cameraTrackCount: 0,
        sourceTrackCount: 0,
        keyframeCount: 2,
        compiledSampleCount: 2,
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
      `color=c=0x11131A:size=${WIDTH}x${HEIGHT}:rate=${FPS}:duration=${durationSeconds}`,
      '-f',
      'lavfi',
      '-i',
      `anullsrc=channel_layout=stereo:sample_rate=48000:d=${durationSeconds}`,
      '-vf',
      [
        'drawgrid=width=32:height=32:thickness=1:color=0x30333C@0.38',
        'drawbox=x=350:y=0:w=290:h=280:color=0x4A1F1D@0.48:t=fill',
        'drawbox=x=0:y=280:w=640:h=80:color=0x080A0F@0.90:t=fill',
      ].join(','),
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
      maxBuffer:
        32 * 1024 * 1024,
    },
  )
  if (
    result.status !== 0
    || result.stdout.byteLength < 1_024
    || result.stdout.subarray(
      4,
      8,
    ).toString('ascii') !== 'ftyp'
  ) {
    throw new Error(
      `Living Frame character PixiJS source fixture failed: ${String(result.stderr).slice(-300)}`,
    )
  }
  return Buffer.from(result.stdout)
}

async function activateOrPrepareRemotionRuntime() {
  try {
    return await activatePrivateOfflineRemotionRenderRuntime()
  } catch {
    await prepareOfflineRemotionDockerRuntime()
    return activatePrivateOfflineRemotionRenderRuntime()
  }
}

async function packageChunks(
  chunks: readonly Buffer[],
): Promise<Buffer> {
  if (chunks.length !== CHUNK_COUNT) {
    throw new Error(
      'Living Frame character PixiJS Remotion package count is invalid.',
    )
  }
  const directory =
    await mkdtemp(join(
      tmpdir(),
      'reeditpro-lf-character-pixijs-remotion-package-',
    ))
  try {
    const paths = chunks.map(
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
          chunks[order]!,
          {
            flag: 'wx',
            mode: 0o600,
          },
        )),
    )
    const filters: string[] = []
    const inputs: string[] = []
    for (
      let order = 0;
      order < paths.length;
      order += 1
    ) {
      filters.push(
        `[${order}:v]trim=start_frame=0:end_frame=${MAXIMUM_OVERLAYS_PER_CHUNK},setpts=PTS-STARTPTS[v${order}]`,
        `[${order}:a]atrim=start=0:end=${(MAXIMUM_OVERLAYS_PER_CHUNK / FPS).toFixed(9)},asetpts=PTS-STARTPTS[a${order}]`,
      )
      inputs.push(
        `[v${order}][a${order}]`,
      )
    }
    filters.push(
      `${inputs.join('')}concat=n=${CHUNK_COUNT}:v=1:a=1[vout][aout]`,
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
        String(FRAME_COUNT),
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
      || result.stdout.byteLength < 1_024
      || result.stdout.subarray(
        4,
        8,
      ).toString('ascii') !==
        'ftyp'
    ) {
      throw new Error(
        `Living Frame character PixiJS Remotion packaging failed: ${String(result.stderr).slice(-500)}`,
      )
    }
    return Buffer.from(
      result.stdout,
    )
  } finally {
    await rm(directory, {
      recursive: true,
      force: true,
    }).catch(() => undefined)
  }
}

function inspectRenderedMedia(
  bytes: Buffer,
  expectedFrameCount:
    number = FRAME_COUNT,
): {
  readonly pixelFormat: string
  readonly frameCount: number
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
      maxBuffer:
        1024 * 1024,
    },
  )
  if (result.status !== 0) {
    throw new Error(
      'Living Frame character PixiJS Remotion FFprobe failed.',
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
  const stream =
    parsed.streams?.[0]
  const [numerator, denominator] =
    String(
      stream?.avg_frame_rate ?? '',
    ).split('/').map(Number)
  const frameCount = Number(
    stream?.nb_read_frames
    ?? stream?.nb_frames,
  )
  if (
    stream?.codec_name !== 'h264'
    || Number(stream?.width) !== WIDTH
    || Number(stream?.height) !== HEIGHT
    || numerator / denominator !== FPS
    || frameCount !==
      expectedFrameCount
    || typeof stream?.pix_fmt !==
      'string'
    || stream.pix_fmt.length < 1
  ) {
    throw new Error(
      'Living Frame character PixiJS Remotion media identity is invalid.',
    )
  }
  return {
    pixelFormat: stream.pix_fmt,
    frameCount,
  }
}

function extractRenderedFramePng(
  bytes: Buffer,
  frame: number,
): Buffer {
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-vf',
      `select=eq(n\\,${frame})`,
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
      input: bytes,
      encoding: null,
      maxBuffer:
        16 * 1024 * 1024,
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
      `Living Frame character PixiJS Remotion review PNG ${frame} failed.`,
    )
  }
  return Buffer.from(result.stdout)
}

function extractRenderedFrameRgb(
  bytes: Buffer,
  frame: number,
): Buffer {
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-vf',
      `select=eq(n\\,${frame})`,
      '-frames:v',
      '1',
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
        WIDTH * HEIGHT * 3 + 1024,
    },
  )
  if (
    result.status !== 0
    || result.stdout.byteLength !==
      WIDTH * HEIGHT * 3
  ) {
    throw new Error(
      `Living Frame character PixiJS Remotion review RGB ${frame} failed.`,
    )
  }
  return Buffer.from(result.stdout)
}

function extractRenderedCaptionProtectedRegionRgbSequence(
  bytes: Buffer,
): Buffer {
  const {
    x,
    y,
    width,
    height,
  } = CAPTION_PROTECTED_REGION
  const expectedByteLength =
    width * height * 3 * FRAME_COUNT
  const result = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-map',
      '0:v:0',
      '-vf',
      `crop=${width}:${height}:${x}:${y}`,
      '-frames:v',
      String(FRAME_COUNT),
      '-vsync',
      '0',
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
        expectedByteLength + 1024,
    },
  )
  if (
    result.status !== 0
    || result.stdout.byteLength !==
      expectedByteLength
  ) {
    throw new Error(
      'Living Frame character PixiJS Remotion caption-protected region extraction failed.',
    )
  }
  return Buffer.from(result.stdout)
}

function assertRenderedVisuals(input: {
  readonly reviewRgb:
    readonly Buffer[]
  readonly firstMiddleDifferentPixelCount:
    number
  readonly firstFinalMeanAbsoluteDifference:
    number
  readonly maximumCaptionProtectedRegionMeanAbsoluteDifference:
    number
}): void {
  if (
    input.reviewRgb.length !== 3
    || input
      .firstMiddleDifferentPixelCount <
        1_000
    || input
      .firstFinalMeanAbsoluteDifference >
        3
    || input
      .maximumCaptionProtectedRegionMeanAbsoluteDifference >
        1.5
    || input.reviewRgb.some(
      (frame) =>
        captionAccentPixelCount(
          frame,
        ) < 150,
    )
  ) {
    throw new Error(
      `Living Frame character PixiJS Remotion visual QA failed: motion=${input.firstMiddleDifferentPixelCount}, restoration=${input.firstFinalMeanAbsoluteDifference}.`,
    )
  }
}

function maximumFrameMeanAbsoluteDifferenceFromFirst(input: {
  readonly frames: Buffer
  readonly frameByteLength: number
  readonly frameCount: number
}): number {
  if (
    input.frameByteLength < 1
    || input.frameCount < 1
    || input.frames.byteLength !==
      input.frameByteLength
      * input.frameCount
  ) {
    throw new Error(
      'Living Frame character PixiJS Remotion caption-protected sequence dimensions are invalid.',
    )
  }
  const first =
    input.frames.subarray(
      0,
      input.frameByteLength,
    )
  let maximum = 0
  for (
    let frame = 1;
    frame < input.frameCount;
    frame += 1
  ) {
    maximum = Math.max(
      maximum,
      meanAbsoluteDifference(
        first,
        input.frames.subarray(
          frame
            * input.frameByteLength,
          (frame + 1)
            * input.frameByteLength,
        ),
      ),
    )
  }
  return maximum
}

function captionAccentPixelCount(
  frame: Buffer,
): number {
  let count = 0
  for (
    let y = 275;
    y < 350;
    y += 1
  ) {
    for (
      let x = 15;
      x < 45;
      x += 1
    ) {
      const offset =
        (y * WIDTH + x) * 3
      const red = frame[offset]!
      const green =
        frame[offset + 1]!
      const blue =
        frame[offset + 2]!
      if (
        red > 180
        && green > 50
        && green < 170
        && blue < 110
      ) count += 1
    }
  }
  return count
}

function differentRgbPixelCount(
  left: Buffer,
  right: Buffer,
  threshold: number,
): number {
  if (
    left.byteLength !==
      right.byteLength
  ) {
    throw new Error(
      'Living Frame character PixiJS Remotion comparison dimensions differ.',
    )
  }
  let count = 0
  for (
    let offset = 0;
    offset < left.byteLength;
    offset += 3
  ) {
    if (
      Math.max(
        Math.abs(
          left[offset]!
          - right[offset]!,
        ),
        Math.abs(
          left[offset + 1]!
          - right[offset + 1]!,
        ),
        Math.abs(
          left[offset + 2]!
          - right[offset + 2]!,
        ),
      ) > threshold
    ) count += 1
  }
  return count
}

function meanAbsoluteDifference(
  left: Buffer,
  right: Buffer,
): number {
  if (
    left.byteLength !==
      right.byteLength
  ) {
    throw new Error(
      'Living Frame character PixiJS Remotion restoration dimensions differ.',
    )
  }
  let total = 0
  for (
    let offset = 0;
    offset < left.byteLength;
    offset += 1
  ) {
    total += Math.abs(
      left[offset]!
      - right[offset]!,
    )
  }
  return total / left.byteLength
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

async function readExactStream(input: {
  readonly stream:
    NodeJS.ReadableStream
  readonly expectedByteLength:
    number
  readonly expectedSha256: string
}): Promise<Buffer> {
  const chunks: Buffer[] = []
  const digest =
    createHash('sha256')
  let byteLength = 0
  for await (
    const chunk of input.stream
  ) {
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
        'Living Frame character PixiJS Remotion stream exceeded its commitment.',
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
      'Living Frame character PixiJS Remotion stream failed exact revalidation.',
    )
  }
  return Buffer.concat(
    chunks,
    byteLength,
  )
}

function commitment(
  bytes: Uint8Array,
): {
  readonly byteLength: number
  readonly sha256: string
} {
  return {
    byteLength:
      bytes.byteLength,
    sha256:
      digestBytes(bytes),
  }
}

function digestBytes(
  bytes: Uint8Array,
): string {
  return createHash('sha256')
    .update(bytes)
    .digest('hex')
}

function roundMeasurement(
  value: number,
): number {
  return Number(value.toFixed(6))
}

function assertSequence(input: {
  readonly qualificationId: string
  readonly widthPixels: number
  readonly heightPixels: number
  readonly fps: number
  readonly startFrame: number
  readonly endFrameExclusive: number
  readonly frames:
    readonly {
      readonly order: number
      readonly absoluteFrame: number
      readonly pngBytes: Uint8Array
      readonly pngByteLength: number
      readonly pngDigestSha256:
        string
    }[]
}): void {
  if (
    input.qualificationId !==
      'lf-character-pixijs-musashi-whole-character-private-v2'
    || input.widthPixels !== WIDTH
    || input.heightPixels !== HEIGHT
    || input.fps !== FPS
    || input.startFrame !== 0
    || input.endFrameExclusive !==
      FRAME_COUNT
    || input.frames.length !==
      FRAME_COUNT
    || input.frames.some(
      (frame, order) =>
        frame.order !== order
        || frame.absoluteFrame !==
          order
        || frame.pngByteLength !==
          frame.pngBytes.byteLength
        || frame.pngDigestSha256 !==
          digestBytes(
            frame.pngBytes,
          ),
    )
  ) {
    throw new Error(
      'Living Frame character PixiJS private sequence lineage is invalid.',
    )
  }
}
