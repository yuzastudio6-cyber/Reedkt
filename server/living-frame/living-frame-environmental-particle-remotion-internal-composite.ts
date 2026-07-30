import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { Readable } from 'node:stream'

import {
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_CLASS,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_OPEN_GATES,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_STATE,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_VERSION,
  type LivingFrameEnvironmentalParticleRemotionInternalCompositeFrameMeasurement,
  type LivingFrameEnvironmentalParticleRemotionInternalCompositeReport,
  type LivingFrameEnvironmentalParticleRemotionInternalCompositeReportDraft,
} from '../../src/types/living-frame-environmental-particle-remotion-internal-composite'
import type {
  LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReport,
  LivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease,
} from '../../src/types/living-frame-environmental-particle-pixijs-internal-runtime'
import type {
  CanonicalLivingFrameMotionSpec,
  CanonicalLivingFrameMotionSpecDraft,
} from '../../src/types/living-frame-canonical-motion'
import { ApiError } from '../errors/api-error'
import {
  deriveCanonicalLivingFrameCompiledSampleDigestSha256,
} from './canonical-living-frame-motion'
import {
  consumeLivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease,
} from './living-frame-environmental-particle-pixijs-internal-runtime'
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

const REVIEW_WIDTH = 640 as const
const REVIEW_HEIGHT = 360 as const
const REVIEW_FPS = 30 as const
const MAXIMUM_SEQUENCE_FRAMES = 16
const MAXIMUM_RENDERED_BYTES = 256 * 1024 * 1024
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

export interface ExecuteLivingFrameEnvironmentalParticleRemotionInternalCompositeInput {
  readonly qualificationId: string
  readonly pixiJsRuntimeReport:
    LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReport
  readonly privateSequenceOutputLease:
    LivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease
}

export async function executeLivingFrameEnvironmentalParticleRemotionInternalComposite(
  input:
    ExecuteLivingFrameEnvironmentalParticleRemotionInternalCompositeInput,
): Promise<LivingFrameEnvironmentalParticleRemotionInternalCompositeReport> {
  assertInput(input)
  assertPixiJsReport(input.pixiJsRuntimeReport)
  const sequence =
    consumeLivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease(
      input.privateSequenceOutputLease,
    )
  assertSequenceLineage(input.pixiJsRuntimeReport, sequence)

  const durationFrames = Math.max(
    24,
    sequence.endFrameExclusive + 2,
  )
  if (
    durationFrames > 240
    || sequence.frames.length > MAXIMUM_SEQUENCE_FRAMES
    || sequence.fps !== REVIEW_FPS
    || sequence.widthPixels / sequence.heightPixels !==
      REVIEW_WIDTH / REVIEW_HEIGHT
  ) throw validationFailure('Living Frame particle sequence exceeds the bounded Remotion review adapter.')

  const sourceBytes = createSourceVideo(durationFrames)
  const captionBytes = createCaptionOverlay()
  const sourceCommitment = commitment(sourceBytes)
  const captionCommitment = commitment(captionBytes)
  const overlayBindings = sequence.frames.map((frame) => {
    const componentOutputKey =
      `lf-pixijs-sequence-frame-${String(frame.order).padStart(2, '0')}`
    return {
      frame,
      componentOutputKey,
      motionSpec: createFrameGateMotionSpec({
        sceneId: 'lf-pixijs-particle-sequence-review',
        componentId: componentOutputKey,
        startFrame: frame.absoluteFrame,
        selectedSceneBindingDigestSha256:
          input.pixiJsRuntimeReport.sourceBindings
            .materializationDigestSha256,
        timingBindingDigestSha256:
          input.pixiJsRuntimeReport.sourceBindings
            .masterTimingDigestSha256,
        deterministicMotionBundleDigestSha256:
          sequence.sequenceDigestSha256,
      }),
      commitment: commitment(frame.pngBytes),
    }
  })
  const request =
    buildOfflineRemotionFinalCompositionStreamingRequest({
      planningPayload: {
        compositionProfileId:
          'approved_source_caption_final_v1',
        width: REVIEW_WIDTH,
        height: REVIEW_HEIGHT,
        fps: REVIEW_FPS,
        durationFrames,
        sourceStartFrame: 0,
        sourceEndFrameExclusive: durationFrames,
        sourceFit: 'contain',
        panelBackground: '#111827',
        audioPolicy: 'preserve_source',
        captionOverlayPolicy:
          'approved_full_frame_rgba',
        livingFrameOverlayPolicy:
          'approved_rgba_over_source_below_captions_v1',
        livingFrameOverlayLayers:
          overlayBindings.map((binding) => ({
            sceneId: binding.motionSpec.sceneId,
            layerId:
              `lf-pixijs-sequence-layer-${String(binding.frame.order).padStart(2, '0')}`,
            manifestOutputKey:
              `lf-pixijs-sequence-manifest-${String(binding.frame.order).padStart(2, '0')}`,
            componentOutputKey:
              binding.componentOutputKey,
            startFrame:
              binding.frame.absoluteFrame,
            endFrameExclusive:
              binding.frame.absoluteFrame + 2,
            fit: 'fill',
            opacity: 1,
            motionSpec: binding.motionSpec,
          })),
      },
      source: {
        inputId: 'lf-pixijs-review-source',
        mimeType: 'video/mp4',
        ...sourceCommitment,
      },
      captionOverlay: {
        inputId: 'lf-pixijs-review-caption',
        mimeType: 'image/png',
        ...captionCommitment,
      },
      livingFrameOverlays:
        overlayBindings.map((binding) => ({
          inputId:
            `lf-pixijs-review-frame-${String(binding.frame.order).padStart(2, '0')}`,
          outputKey: binding.componentOutputKey,
          mimeType: 'image/png',
          ...binding.commitment,
        })),
    })
  const inputs: OfflineRemotionServerInjectedInput[] = [
    privateBufferInput(
      'lf-pixijs-review-source',
      'video/mp4',
      sourceBytes,
      sourceCommitment,
    ),
    ...overlayBindings.map((binding) =>
      privateBufferInput(
        `lf-pixijs-review-frame-${String(binding.frame.order).padStart(2, '0')}`,
        'image/png',
        binding.frame.pngBytes,
        binding.commitment,
      )),
    privateBufferInput(
      'lf-pixijs-review-caption',
      'image/png',
      captionBytes,
      captionCommitment,
    ),
  ]

  const runtime = await activateOrPrepareRemotionRuntime()
  let renderedBytes: Buffer | undefined
  const result = await runtime.executeServerInjected(
    request,
    inputs,
    {
      maximumBytes:
        OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
      async persist(output) {
        if (
          output.expectedByteLength < 1_024
          || output.expectedByteLength >
            MAXIMUM_RENDERED_BYTES
          || !SHA256.test(output.expectedSha256)
        ) throw runtimeFailure('Living Frame Remotion output commitment is invalid.')
        const chunks: Buffer[] = []
        let byteLength = 0
        const digest = createHash('sha256')
        for await (const chunk of output.stream) {
          const bytes = Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk)
          byteLength += bytes.byteLength
          if (byteLength > MAXIMUM_RENDERED_BYTES) {
            throw runtimeFailure('Living Frame Remotion output exceeded its private ceiling.')
          }
          digest.update(bytes)
          chunks.push(Buffer.from(bytes))
        }
        const sha256 = digest.digest('hex')
        if (
          byteLength !== output.expectedByteLength
          || sha256 !== output.expectedSha256
        ) throw runtimeFailure('Living Frame Remotion output stream diverged from its commitment.')
        renderedBytes = Buffer.concat(chunks)
        return { byteLength, sha256 }
      },
    },
  )
  if (renderedBytes == null) {
    throw runtimeFailure('Living Frame Remotion output bytes were not retained for private QA.')
  }
  const mediaIdentity = inspectRenderedMedia(renderedBytes)
  if (
    mediaIdentity.width !== REVIEW_WIDTH
    || mediaIdentity.height !== REVIEW_HEIGHT
    || mediaIdentity.fps !== REVIEW_FPS
    || mediaIdentity.durationFrames !== durationFrames
  ) throw runtimeFailure('Living Frame Remotion output media identity is invalid.')
  const sampledFrames = extractRenderedFrames(
    renderedBytes,
    sequence.frames.map((frame) =>
      frame.absoluteFrame),
  )
  const frameMeasurements = measureRenderedFrames({
    sampledFrames,
    report: input.pixiJsRuntimeReport,
  })
  compileAggregate(frameMeasurements)
  const semantic = result.evidence.semanticEvidence
  if (
    semantic
      .approvedLivingFrameOverlayInputServerInjectedWithoutBase64 !== true
    || semantic
      .approvedLivingFrameDeterministicMotionApplied !== true
    || semantic
      .approvedLivingFrameOverlayBelowCaptionsApplied !== true
    || semantic
      .serverInjectedInputStreamsMaterializedAndReverified !== true
    || semantic
      .serverInjectedOutputStreamEmitted !== true
  ) throw runtimeFailure('Living Frame Remotion semantic evidence is incomplete.')

  const draft:
    LivingFrameEnvironmentalParticleRemotionInternalCompositeReportDraft = {
      contractVersion:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_VERSION,
      resultClass:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_CLASS,
      runtimeState:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_STATE,
      qualificationId: input.qualificationId,
      sourceBindings: {
        pixiJsRuntimeReportDigestSha256:
          input.pixiJsRuntimeReport.reportDigestSha256,
        pixiJsSequenceDigestSha256:
          sequence.sequenceDigestSha256,
        confirmedOutputFrameDigestSha256:
          input.pixiJsRuntimeReport.sourceBindings
            .confirmedOutputFrameDigestSha256,
        masterTimingDigestSha256:
          input.pixiJsRuntimeReport.sourceBindings
            .masterTimingDigestSha256,
        remotionRequestDigestSha256:
          result.evidence.requestEnvelopeSha256,
        remotionArtifactDigestSha256:
          result.artifact.sha256,
      },
      runtimeIdentity: {
        toolId: 'remotion',
        operationId:
          'tool.remotion.render_approved_composition.v1',
        packageName: 'remotion+@remotion/renderer',
        packageVersion: '4.0.487',
        existingCanonicalRuntimeReused: true,
        sharedRuntimeSourceMutated: false,
        privateServerInjectedStreamingUsed: true,
        actualRemotionMediaRenderExecuted: true,
      },
      imageEvidence: {
        imageTag: result.evidence.image.imageTag,
        imageId: result.evidence.image.imageId,
        imageIdentityHash:
          result.evidence.image.imageIdentityHash,
        sourceTreeSha256:
          result.evidence.image.sourceTreeSha256,
        imageUser: '10001:10001',
      },
      confinementEvidence: {
        networkMode:
          result.evidence.confinement.networkMode,
        readOnlyRootFilesystem:
          result.evidence.confinement
            .readOnlyRootFilesystem,
        capDropAll:
          result.evidence.confinement.capDropAll,
        noNewPrivileges:
          result.evidence.confinement
            .noNewPrivileges,
        privileged:
          result.evidence.confinement.privileged,
        callerCommandPresent:
          result.evidence.confinement
            .callerCommandPresent,
        callerBindsPresent:
          result.evidence.confinement
            .callerBindsPresent,
        callerMountsPresent:
          result.evidence.confinement
            .callerMountsPresent,
        callerEnvironmentPresent:
          result.evidence.confinement
            .callerEnvironmentPresent,
      },
      compositionIdentity: {
        generatedParticleWidthPixels:
          sequence.widthPixels,
        generatedParticleHeightPixels:
          sequence.heightPixels,
        internalReviewWidthPixels: REVIEW_WIDTH,
        internalReviewHeightPixels: REVIEW_HEIGHT,
        confirmedOutputRatioPreservedInInternalReview:
          true,
        fps: sequence.fps,
        durationFrames,
        particleStartFrame: sequence.startFrame,
        particleEndFrameExclusive:
          sequence.endFrameExclusive,
        frameImageCount: sequence.frames.length,
        overlayAdapter:
          'bounded_two_frame_alpha_gate_overlays_v1',
        sourcePolicy:
          'server_derived_static_private_qualification_plate_v1',
        captionPolicy:
          'server_derived_full_frame_rgba_qualification_caption_v1',
        livingFramePolicy:
          'approved_rgba_over_source_below_captions_v1',
        finalCustomerCanvas: false,
      },
      frameMeasurements,
      aggregateMeasurement: {
        exactConfirmedOutputParticleFramesConsumed: true,
        confirmedOutputRatioPreservedInInternalReview:
          true,
        exactFpsAndDurationRendered: true,
        everyParticleFrameTimeSampled: true,
        everyFrameExpectationMatched: true,
        firstParticleFrameTransparentInComposite: true,
        lastParticleFrameTransparentInComposite: true,
        activeParticleFramesVisible: true,
        temporalParticleVariationVisible: true,
        alphaCentroidMotionPreserved: true,
        sourcePlateVisibleAcrossSequence: true,
        captionPlaneVisibleAboveParticlesAcrossSequence:
          true,
        remotionSemanticEvidencePassed: true,
      },
      authorityBoundary: {
        privateInternalCompositeQualificationAuthority:
          true,
        selectedSceneAuthority: false,
        timingAuthority: false,
        operationRegistryAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        artifactAuthority: false,
        assetManifestAuthority: false,
        finalRendererAuthority: false,
        qaApprovalAuthority: false,
        privateReviewAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        externalBetaAuthority: false,
        productionAuthority: false,
      },
      openGateCodes:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_OPEN_GATES,
      containsRawSourceVideoBytes: false,
      containsRawPngBytes: false,
      containsRenderedVideoBytes: false,
      containsPathUrlCredentialCommandOrEnvironment:
        false,
      selectedSceneBound: false,
      canonicalTimingBound: false,
      operationRegistered: false,
      canonicalDispatchIntegrated: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      internalTestReady: true,
      externalBetaReady: false,
      productionReady: false,
    }
  return Object.freeze({
    ...draft,
    reportDigestSha256: sha256AuthorityValue(draft),
  })
}

function createFrameGateMotionSpec(input: {
  readonly sceneId: string
  readonly componentId: string
  readonly startFrame: number
  readonly selectedSceneBindingDigestSha256: string
  readonly timingBindingDigestSha256: string
  readonly deterministicMotionBundleDigestSha256: string
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
  const track = {
    trackId:
      `lf-pixijs-frame-gate-${String(input.startFrame).padStart(4, '0')}`,
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
  const draft: CanonicalLivingFrameMotionSpecDraft = {
    schemaVersion:
      'canonical-living-frame-motion-spec-v1',
    motionProfileId:
      'approved_scalar_keyframe_choreography_v1',
    sceneId: input.sceneId,
    componentId: input.componentId,
    sceneStartFrame: input.startFrame,
    sceneEndFrameExclusive:
      input.startFrame + 2,
    visualVerb: 'hold',
    importance: 'support',
    depthStyle: 'flat',
    depthBand: 'in_front_of_subject',
    parallaxFactor: 0,
    sourceBindings: {
      selectedSceneBindingDigestSha256:
        input.selectedSceneBindingDigestSha256,
      timingBindingDigestSha256:
        input.timingBindingDigestSha256,
      deterministicMotionBundleDigestSha256:
        input.deterministicMotionBundleDigestSha256,
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
      masterTimingMutationAuthority: false,
      soundSyncAuthority: false,
      approvalAuthority: false,
      workGraphAuthority: false,
      rendererCodeAuthority: false,
      providerAuthority: false,
      queueAuthority: false,
      productionAuthority: false,
    },
    exactFramesRemainOwnedByMasterTiming: true,
    captionsRemainAboveLivingFrame: true,
    containsExecutableCodeCommandsPathsUrlsOrCredentials:
      false,
    subjectSpecificRouting: false,
  }
  return {
    ...draft,
    motionSpecDigestSha256:
      sha256AuthorityValue(draft),
  }
}

async function activateOrPrepareRemotionRuntime() {
  try {
    return await activatePrivateOfflineRemotionRenderRuntime()
  } catch {
    await prepareOfflineRemotionDockerRuntime()
    return await activatePrivateOfflineRemotionRenderRuntime()
  }
}

function createSourceVideo(
  durationFrames: number,
): Buffer {
  const durationSeconds =
    durationFrames / REVIEW_FPS
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    `color=c=0x202938:size=${REVIEW_WIDTH}x${REVIEW_HEIGHT}:rate=${REVIEW_FPS}:duration=${durationSeconds}`,
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=440:sample_rate=48000:duration=${durationSeconds}`,
    '-vf',
    'drawgrid=width=40:height=40:thickness=2:color=0x536179@0.75',
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
  ], {
    encoding: null,
    maxBuffer: 32 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw runtimeFailure(
      'Living Frame private source fixture generation failed.',
      result.stderr?.toString('utf8'),
    )
  }
  const bytes = Buffer.from(result.stdout)
  if (
    bytes.byteLength < 1_024
    || bytes.subarray(4, 8).toString('ascii') !==
      'ftyp'
  ) throw runtimeFailure('Living Frame private source fixture is invalid.')
  return bytes
}

function createCaptionOverlay(): Buffer {
  const result = spawnSync('ffmpeg', [
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
      'drawbox=x=240:y=232:w=160:h=58:color=0xFF00D4@1:t=fill:replace=1',
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
  ], {
    encoding: null,
    maxBuffer: 16 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw runtimeFailure(
      'Living Frame private caption fixture generation failed.',
      result.stderr?.toString('utf8'),
    )
  }
  const bytes = Buffer.from(result.stdout)
  if (
    bytes.byteLength < 67
    || bytes.subarray(0, 8).toString('hex') !==
      '89504e470d0a1a0a'
  ) throw runtimeFailure('Living Frame private caption fixture is invalid.')
  return bytes
}

function inspectRenderedMedia(
  bytes: Buffer,
): {
  readonly width: number
  readonly height: number
  readonly fps: number
  readonly durationFrames: number
} {
  const result = spawnSync('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height,avg_frame_rate,nb_frames',
    '-of',
    'json',
    'pipe:0',
  ], {
    input: bytes,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  if (result.status !== 0) {
    throw runtimeFailure(
      'Living Frame private Remotion media probe failed.',
      result.stderr,
    )
  }
  const parsed = JSON.parse(result.stdout) as {
    streams?: Array<{
      width?: number
      height?: number
      avg_frame_rate?: string
      nb_frames?: string
    }>
  }
  const stream = parsed.streams?.[0]
  const [numerator, denominator] =
    String(stream?.avg_frame_rate ?? '').split('/')
      .map(Number)
  return {
    width: Number(stream?.width),
    height: Number(stream?.height),
    fps: denominator === 0
      ? Number.NaN
      : numerator / denominator,
    durationFrames: Number(stream?.nb_frames),
  }
}

function extractRenderedFrames(
  bytes: Buffer,
  frameNumbers: readonly number[],
): readonly Buffer[] {
  const selector = frameNumbers
    .map((frame) => `eq(n\\,${frame})`)
    .join('+')
  const result = spawnSync('ffmpeg', [
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
  ], {
    input: bytes,
    encoding: null,
    maxBuffer:
      REVIEW_WIDTH * REVIEW_HEIGHT * 3 *
      (frameNumbers.length + 1),
  })
  if (result.status !== 0) {
    throw runtimeFailure(
      'Living Frame private Remotion frame extraction failed.',
      result.stderr?.toString('utf8'),
    )
  }
  const output = Buffer.from(result.stdout)
  const frameByteLength =
    REVIEW_WIDTH * REVIEW_HEIGHT * 3
  if (
    output.byteLength !==
      frameByteLength * frameNumbers.length
  ) throw runtimeFailure('Living Frame private Remotion frame count is invalid.')
  return frameNumbers.map((_, index) =>
    output.subarray(
      index * frameByteLength,
      (index + 1) * frameByteLength,
    ))
}

function measureRenderedFrames(input: {
  readonly sampledFrames: readonly Buffer[]
  readonly report:
    LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReport
}): readonly LivingFrameEnvironmentalParticleRemotionInternalCompositeFrameMeasurement[] {
  const baseline = input.sampledFrames[0]
  if (baseline == null) {
    throw runtimeFailure('Living Frame Remotion baseline frame is missing.')
  }
  return input.sampledFrames.map((frame, order) => {
    const source = input.report.frameMeasurements[order]
    if (source == null) {
      throw runtimeFailure('Living Frame Remotion source measurement is missing.')
    }
    const sourcePlateVisible = sourcePlatePixelCount(frame) > 5_000
    const captionVisible = captionPixelCount(frame) > 7_000
    const difference = differenceCentroid(
      frame,
      baseline,
    )
    const expectedActive =
      source.expectedActiveParticleCount > 0
    const particleVisible =
      difference.count > 5
    const expectedCentroid =
      source.alphaWeightedCentroid
    const centroidErrorNormalized =
      particleVisible
      && difference.xNormalized != null
      && difference.yNormalized != null
      && expectedCentroid.xNormalized != null
      && expectedCentroid.yNormalized != null
        ? Math.hypot(
            difference.xNormalized -
              expectedCentroid.xNormalized,
            difference.yNormalized -
              expectedCentroid.yNormalized,
          )
        : null
    const matched =
      sourcePlateVisible
      && captionVisible
      && (
        expectedActive
          ? particleVisible
            && centroidErrorNormalized != null
            && centroidErrorNormalized < 0.16
          : !particleVisible
      )
    if (!matched) {
      throw runtimeFailure(
        [
          `Living Frame Remotion frame ${source.absoluteFrame}`,
          'failed pixel-level expectation:',
          `expectedActive=${expectedActive},`,
          `particleVisible=${particleVisible},`,
          `differencePixels=${difference.count},`,
          `centroidError=${String(centroidErrorNormalized)},`,
          `sourcePlateVisible=${sourcePlateVisible},`,
          `captionVisible=${captionVisible}.`,
        ].join(' '),
      )
    }
    return {
      order,
      absoluteFrame: source.absoluteFrame,
      expectedActiveParticleCount:
        source.expectedActiveParticleCount,
      sourcePlateVisible: true,
      captionPlaneVisibleAboveParticleLayer: true,
      particleVisible,
      sampledRgbDigestSha256:
        digestBytes(frame),
      renderedParticleCentroid: {
        xNormalized: difference.xNormalized,
        yNormalized: difference.yNormalized,
      },
      expectedAlphaCentroid: expectedCentroid,
      centroidErrorNormalized,
      expectationMatched: true,
    }
  })
}

function compileAggregate(
  frames:
    readonly LivingFrameEnvironmentalParticleRemotionInternalCompositeFrameMeasurement[],
): void {
  const active = frames.filter((frame) =>
    frame.expectedActiveParticleCount > 0)
  const visible = active.filter((frame) =>
    frame.particleVisible)
  const first = frames[0]
  const last = frames.at(-1)
  const movement = visible.some((frame, index) => {
    const previous = visible[index - 1]
    if (
      previous?.renderedParticleCentroid
        .xNormalized == null
      || previous.renderedParticleCentroid
        .yNormalized == null
      || frame.renderedParticleCentroid
        .xNormalized == null
      || frame.renderedParticleCentroid
        .yNormalized == null
    ) return false
    return Math.hypot(
      frame.renderedParticleCentroid.xNormalized -
        previous.renderedParticleCentroid.xNormalized,
      frame.renderedParticleCentroid.yNormalized -
        previous.renderedParticleCentroid.yNormalized,
    ) > 0.000_5
  })
  if (
    first?.particleVisible !== false
    || last?.particleVisible !== false
    || active.length < 2
    || visible.length !== active.length
    || new Set(visible.map((frame) =>
      frame.sampledRgbDigestSha256)).size < 2
    || !movement
    || frames.some((frame) =>
      !frame.sourcePlateVisible
      || !frame.captionPlaneVisibleAboveParticleLayer
      || !frame.expectationMatched)
  ) throw runtimeFailure('Living Frame Remotion aggregate pixel evidence is insufficient.')
}

function differenceCentroid(
  frame: Buffer,
  baseline: Buffer,
): {
  readonly count: number
  readonly xNormalized: number | null
  readonly yNormalized: number | null
} {
  let count = 0
  let xTotal = 0
  let yTotal = 0
  for (let y = 0; y < REVIEW_HEIGHT; y += 1) {
    for (let x = 0; x < REVIEW_WIDTH; x += 1) {
      if (
        x >= 236 && x < 404
        && y >= 228 && y < 294
      ) continue
      const offset =
        (y * REVIEW_WIDTH + x) * 3
      const difference =
        Math.abs(frame[offset]! - baseline[offset]!)
        + Math.abs(
          frame[offset + 1]! -
            baseline[offset + 1]!,
        )
        + Math.abs(
          frame[offset + 2]! -
            baseline[offset + 2]!,
        )
      if (difference <= 48) continue
      count += 1
      xTotal += x
      yTotal += y
    }
  }
  return {
    count,
    xNormalized:
      count === 0 ? null : xTotal / count / REVIEW_WIDTH,
    yNormalized:
      count === 0 ? null : yTotal / count / REVIEW_HEIGHT,
  }
}

function sourcePlatePixelCount(frame: Buffer): number {
  let count = 0
  for (let y = 0; y < 100; y += 1) {
    for (let x = 0; x < REVIEW_WIDTH; x += 1) {
      const offset =
        (y * REVIEW_WIDTH + x) * 3
      const red = frame[offset]!
      const green = frame[offset + 1]!
      const blue = frame[offset + 2]!
      if (
        red >= 20 && red <= 105
        && green >= 25 && green <= 120
        && blue >= 35 && blue <= 145
      ) count += 1
    }
  }
  return count
}

function captionPixelCount(frame: Buffer): number {
  let count = 0
  for (let y = 232; y < 290; y += 1) {
    for (let x = 240; x < 400; x += 1) {
      const offset =
        (y * REVIEW_WIDTH + x) * 3
      if (
        frame[offset]! > 150
        && frame[offset + 1]! < 105
        && frame[offset + 2]! > 115
      ) count += 1
    }
  }
  return count
}

function privateBufferInput(
  inputId: string,
  mimeType: 'video/mp4' | 'image/png',
  bytes: Uint8Array,
  expected: {
    readonly byteLength: number
    readonly sha256: string
  },
): OfflineRemotionServerInjectedInput {
  const privateBytes = Buffer.from(bytes)
  return {
    inputMode: 'private_verified_stream_v1',
    inputId,
    mimeType,
    ...expected,
    async openStream() {
      return Readable.from([privateBytes])
    },
  }
}

function commitment(bytes: Uint8Array): {
  readonly byteLength: number
  readonly sha256: string
} {
  return {
    byteLength: bytes.byteLength,
    sha256: digestBytes(bytes),
  }
}

function assertInput(
  input:
    ExecuteLivingFrameEnvironmentalParticleRemotionInternalCompositeInput,
): void {
  if (
    !isRecord(input)
    || Object.keys(input).sort().join('|') !== [
      'pixiJsRuntimeReport',
      'privateSequenceOutputLease',
      'qualificationId',
    ].sort().join('|')
    || typeof input.qualificationId !== 'string'
    || !SAFE_ID.test(input.qualificationId)
    || !isRecord(input.pixiJsRuntimeReport)
    || !isRecord(input.privateSequenceOutputLease)
  ) throw validationFailure('Living Frame Remotion internal composite input is invalid.')
}

function assertPixiJsReport(
  report:
    LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReport,
): void {
  const { reportDigestSha256, ...draft } = report
  if (
    !SHA256.test(reportDigestSha256)
    || reportDigestSha256 !==
      sha256AuthorityValue(draft)
    || report.runtimeIdentity.toolId !== 'pixijs'
    || report.runtimeIdentity
      .actualPackageEntrypointExecuted !== true
    || report.aggregateMeasurement
      .everyFrameExpectationMatched !== true
    || report.sequenceIdentity.finalVideoCanvas !== false
    || report.containsRawPngBytes !== false
    || report.internalTestReady !== true
    || report.externalBetaReady !== false
    || report.productionReady !== false
  ) throw validationFailure('Living Frame PixiJS report is invalid for Remotion qualification.')
}

function assertSequenceLineage(
  report:
    LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReport,
  sequence: ReturnType<
    typeof consumeLivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease
  >,
): void {
  if (
    sequence.qualificationId !==
      report.qualificationId
    || sequence.reportDigestSha256 !==
      report.reportDigestSha256
    || sequence.widthPixels !==
      report.sequenceIdentity.widthPixels
    || sequence.heightPixels !==
      report.sequenceIdentity.heightPixels
    || sequence.fps !== report.sequenceIdentity.fps
    || sequence.startFrame !==
      report.sequenceIdentity.startFrame
    || sequence.endFrameExclusive !==
      report.sequenceIdentity.endFrameExclusive
    || sequence.frames.length !==
      report.sequenceIdentity.frameImageCount
    || sequence.frames.some((frame, order) => {
      const expected =
        report.frameMeasurements[order]
      return expected == null
        || frame.order !== order
        || frame.absoluteFrame !==
          expected.absoluteFrame
        || frame.pngByteLength !==
          expected.pngByteLength
        || frame.pngDigestSha256 !==
          expected.pngDigestSha256
        || frame.pngBytes.byteLength !==
          expected.pngByteLength
        || digestBytes(frame.pngBytes) !==
          expected.pngDigestSha256
    })
  ) throw validationFailure('Living Frame PixiJS private sequence lineage is invalid.')
}

function digestBytes(bytes: Uint8Array): string {
  return createHash('sha256')
    .update(bytes)
    .digest('hex')
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function runtimeFailure(
  message: string,
  cause?: unknown,
): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    message,
    503,
    undefined,
    { cause },
  )
}

function validationFailure(message: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    message,
    400,
  )
}
