import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
  LivingFrameSelectedSceneEnvironmentalParticleInternalTestReport,
} from '../../src/types/living-frame-selected-scene-environmental-particle-internal-test'
import {
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_CLASS,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_OPEN_GATES,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_STATE,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_VERSION,
  type LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineChunk,
  type LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestExecution,
  type LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport,
  type LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReportDraft,
  type LivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease,
} from '../../src/types/living-frame-selected-scene-environmental-particle-remotion-full-timeline-internal-test'
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
const FULL_TIMELINE_MAXIMUM_FRAMES = 600
const FULL_TIMELINE_CHUNK_RENDER_FRAMES = 24 as const
const MAXIMUM_RENDERED_BYTES = 256 * 1024 * 1024
const MINIMUM_REVIEW_ALPHA_WEIGHTED_PIXEL_COUNT = 8
const MINIMUM_SOURCE_MAXIMUM_ALPHA_FOR_REVIEW_VISIBILITY = 64
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

export interface ExecuteLivingFrameEnvironmentalParticleRemotionInternalCompositeInput {
  readonly qualificationId: string
  readonly pixiJsRuntimeReport:
    LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReport
  readonly privateSequenceOutputLease:
    LivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease
}

export interface ExecuteLivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestInput {
  readonly qualificationId: string
  readonly selectedSceneInternalTestReport:
    LivingFrameSelectedSceneEnvironmentalParticleInternalTestReport
  readonly pixiJsRuntimeReport:
    LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReport
  readonly privateSequenceOutputLease:
    LivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease
}

export interface LivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutput {
  readonly reportDigestSha256: string
  readonly finalPackagedReviewDigestSha256: string
  readonly expectedByteLength: number
  readonly contentType: 'video/mp4'
  readonly bytes: Buffer
}

const privateReviewOutputByLease =
  new WeakMap<
    LivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease,
    LivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutput
  >()

export async function executeLivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTest(
  input:
    ExecuteLivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestInput,
): Promise<LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport> {
  const execution =
    await executeFullTimelineInternalTest(
      input,
    )
  return execution.report
}

export async function executeLivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestWithPrivateReviewOutput(
  input:
    ExecuteLivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestInput,
): Promise<LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestExecution> {
  const execution =
    await executeFullTimelineInternalTest(
      input,
    )
  const lease =
    createPrivateReviewOutputLease(
      execution.report,
      execution.packagedBytes,
    )
  return {
    report: execution.report,
    privateReviewOutputLease: lease,
  }
}

export function consumeLivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease(
  lease:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease,
): LivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutput {
  if (
    !isRecord(lease)
    || lease.leaseClass !==
      'process_bound_single_use_selected_scene_particle_remotion_private_review_output_lease_v1'
    || lease.callerSerializable !== false
    || lease.artifactAuthority !== false
    || lease.assetManifestAuthority !== false
    || lease.qaApprovalAuthority !== false
    || lease.privateReviewAuthority !== false
    || lease.billingAuthority !== false
    || lease.productionAuthority !== false
  ) throw validationFailure('Living Frame private review output lease is invalid.')
  const output =
    privateReviewOutputByLease.get(lease)
  if (output == null) {
    throw validationFailure('Living Frame private review output lease is unknown or already consumed.')
  }
  privateReviewOutputByLease.delete(lease)
  if (
    lease.reportDigestSha256 !==
      output.reportDigestSha256
    || lease.finalPackagedReviewDigestSha256 !==
      output.finalPackagedReviewDigestSha256
    || lease.expectedByteLength !==
      output.expectedByteLength
    || lease.contentType !==
      output.contentType
    || digestBytes(output.bytes) !==
      output.finalPackagedReviewDigestSha256
    || output.bytes.byteLength !==
      output.expectedByteLength
  ) throw validationFailure('Living Frame private review output lease lineage is invalid.')
  return output
}

async function executeFullTimelineInternalTest(
  input:
    ExecuteLivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestInput,
): Promise<{
  readonly report:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport
  readonly packagedBytes: Buffer
}> {
  assertFullTimelineInput(input)
  assertPixiJsReport(input.pixiJsRuntimeReport)
  assertSelectedSceneInternalTestReport(
    input.selectedSceneInternalTestReport,
    input.pixiJsRuntimeReport,
    input.privateSequenceOutputLease,
  )
  const sequence =
    consumeLivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease(
      input.privateSequenceOutputLease,
    )
  assertSequenceLineage(
    input.pixiJsRuntimeReport,
    sequence,
  )
  const selected =
    input.selectedSceneInternalTestReport
  if (
    sequence.frames.length < 2
    || sequence.frames.length >
      FULL_TIMELINE_MAXIMUM_FRAMES
    || sequence.fps !== REVIEW_FPS
    || sequence.widthPixels /
      sequence.heightPixels !==
      REVIEW_WIDTH / REVIEW_HEIGHT
    || sequence.startFrame !==
      selected.exactExecutionRange.startFrame
    || sequence.endFrameExclusive !==
      selected.exactExecutionRange
        .endFrameExclusive
    || sequence.frames.length !==
      selected.exactExecutionRange.durationFrames
  ) {
    throw validationFailure(
      'Living Frame selected-scene particle sequence exceeds the bounded full-timeline adapter.',
    )
  }

  const sourceBytes =
    createSourceVideo(
      FULL_TIMELINE_CHUNK_RENDER_FRAMES,
    )
  const captionBytes = createCaptionOverlay()
  const runtime =
    await activateOrPrepareRemotionRuntime()
  const frameChunks = chunkFrames(
    sequence.frames,
    MAXIMUM_SEQUENCE_FRAMES,
  )
  const renderedChunks: Buffer[] = []
  const chunkReceipts:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineChunk[] = []

  for (
    const [chunkOrder, frames] of
      frameChunks.entries()
  ) {
    const rendered =
      await renderFullTimelineChunk({
        chunkOrder,
        frames,
        sourceBytes,
        captionBytes,
        runtime,
        selectedSceneId:
          selected.canonicalScope.sceneId,
        selectedSceneBindingDigestSha256:
          selected.sourceBindings
            .selectedSceneBindingDigestSha256,
        timingBindingDigestSha256:
          selected.sourceBindings
            .timingBindingDigestSha256,
        deterministicMotionBundleDigestSha256:
          sequence.sequenceDigestSha256,
      })
    renderedChunks.push(rendered.bytes)
    chunkReceipts.push(rendered.receipt)
  }

  const packagedBytes =
    await packageFullTimelineChunks({
      chunks: renderedChunks,
      frameCounts:
        frameChunks.map((frames) =>
          frames.length),
    })
  if (
    packagedBytes.byteLength < 1_024
    || packagedBytes.byteLength >
      MAXIMUM_RENDERED_BYTES
  ) throw runtimeFailure('Living Frame full-timeline packaged review bytes are invalid.')
  const mediaIdentity =
    inspectRenderedMedia(packagedBytes)
  if (
    mediaIdentity.width !== REVIEW_WIDTH
    || mediaIdentity.height !== REVIEW_HEIGHT
    || mediaIdentity.fps !== REVIEW_FPS
    || mediaIdentity.durationFrames !==
      sequence.frames.length
  ) {
    throw runtimeFailure(
      'Living Frame full-timeline packaged review identity is invalid.',
      new Error(JSON.stringify({
        mediaIdentity,
        expected: {
          width: REVIEW_WIDTH,
          height: REVIEW_HEIGHT,
          fps: REVIEW_FPS,
          durationFrames:
            sequence.frames.length,
        },
      })),
    )
  }
  const sampledFrames =
    extractRenderedFrames(
      packagedBytes,
      sequence.frames.map((_, order) =>
        order),
    )
  const frameMeasurements =
    measureRenderedFrames({
      sampledFrames,
      report: input.pixiJsRuntimeReport,
    })
  compileAggregate(frameMeasurements)
  const perceptibleParticleFrameCount =
    frameMeasurements.filter((frame) =>
      frame.expectedPerceptiblyVisible)
      .length
  const subPerceptualTransitionFrameCount =
    frameMeasurements.filter((frame) =>
      frame.expectedActiveParticleCount > 0
      && !frame.expectedPerceptiblyVisible)
      .length
  const finalPackagedReviewDigestSha256 =
    digestBytes(packagedBytes)

  const draft:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReportDraft = {
      contractVersion:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_VERSION,
      resultClass:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_CLASS,
      runtimeState:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_STATE,
      qualificationId: input.qualificationId,
      canonicalScope: {
        ...selected.canonicalScope,
      },
      sourceBindings: {
        selectedSceneInternalTestReportDigestSha256:
          selected.reportDigestSha256,
        environmentalAdmissionDigestSha256:
          selected.sourceBindings
            .environmentalAdmissionDigestSha256,
        selectedSceneBindingDigestSha256:
          selected.sourceBindings
            .selectedSceneBindingDigestSha256,
        livingFrameComponentDigestSha256:
          selected.sourceBindings
            .livingFrameComponentDigestSha256,
        visualContinuityPackDigestSha256:
          selected.sourceBindings
            .visualContinuityPackDigestSha256,
        currentMasterTimingDigestSha256:
          selected.sourceBindings
            .currentMasterTimingDigestSha256,
        timingBindingDigestSha256:
          selected.sourceBindings
            .timingBindingDigestSha256,
        confirmedOutputFrameDigestSha256:
          selected.sourceBindings
            .confirmedOutputFrameDigestSha256,
        pixiJsRuntimeReportDigestSha256:
          input.pixiJsRuntimeReport
            .reportDigestSha256,
        pixiJsSequenceDigestSha256:
          sequence.sequenceDigestSha256,
        finalPackagedReviewDigestSha256,
      },
      compositionIdentity: {
        sourceParticleWidthPixels:
          sequence.widthPixels,
        sourceParticleHeightPixels:
          sequence.heightPixels,
        internalReviewWidthPixels:
          REVIEW_WIDTH,
        internalReviewHeightPixels:
          REVIEW_HEIGHT,
        confirmedOutputRatioPreserved: true,
        fps: REVIEW_FPS,
        selectedStartFrame:
          sequence.startFrame,
        selectedEndFrameExclusive:
          sequence.endFrameExclusive,
        selectedDurationFrames:
          sequence.frames.length,
        finalReviewDurationFrames:
          mediaIdentity.durationFrames,
        finalPackagedReviewByteLength:
          packagedBytes.byteLength,
        frameImageCount:
          sequence.frames.length,
        remotionChunkCount:
          chunkReceipts.length,
        maximumOverlaysPerChunk:
          MAXIMUM_SEQUENCE_FRAMES,
        localMinimumRenderDurationFrames:
          FULL_TIMELINE_CHUNK_RENDER_FRAMES,
        overlayAdapter:
          'bounded_remotion_chunks_with_exact_frame_packaging_v1',
        packagingTool: 'ffmpeg',
        packagingOnly: true,
        everyFinalFrameCompositedByRemotion:
          true,
        remotionRemainsFinalCanvas: true,
        finalCustomerCanvas: false,
      },
      chunkReceipts,
      frameMeasurements,
      aggregateMeasurement: {
        exactSelectedSceneParticleFramesConsumed:
          true,
        exactSelectedSceneFrameRangePreserved:
          true,
        exactFpsAndDurationRendered: true,
        everyParticleFrameTimeSampled: true,
        everyFrameExpectationMatched: true,
        firstParticleFrameTransparentInComposite:
          true,
        lastParticleFrameTransparentInComposite:
          true,
        activeParticleFramesVisible: true,
        perceptibleParticleFrameCount,
        subPerceptualTransitionFrameCount,
        subPerceptualTransitionFramesPreserved:
          true,
        temporalParticleVariationVisible:
          true,
        alphaCentroidMotionPreserved: true,
        sourcePlateVisibleAcrossTimeline: true,
        captionPlaneVisibleAboveParticlesAcrossTimeline:
          true,
        allChunkSemanticEvidencePassed: true,
        finalPackagedReviewIndependentlyProbed:
          true,
      },
      runtimeIdentity: {
        toolId: 'remotion',
        operationId:
          'tool.remotion.render_approved_composition.v1',
        packageName:
          'remotion+@remotion/renderer',
        packageVersion: '4.0.487',
        actualRemotionRenderCount:
          chunkReceipts.length,
        sharedRuntimeSourceMutated: false,
        existingCanonicalRuntimeReused: true,
      },
      authorityBoundary: {
        privateInternalFullTimelineQualificationAuthority:
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
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_OPEN_GATES,
      selectedSceneBound: true,
      canonicalTimingBound: true,
      fullSelectedEnvironmentalRangeComposited:
        true,
      artifactPersisted: false,
      assetManifestMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      containsRawSourceVideoBytes: false,
      containsRawPngBytes: false,
      containsRenderedVideoBytes: false,
      containsPathUrlCredentialCommandOrEnvironment:
        false,
      internalTestReadyForPersistenceAndReview:
        true,
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
    packagedBytes,
  }
}

function createPrivateReviewOutputLease(
  report:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestReport,
  packagedBytes: Buffer,
): LivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease {
  if (
    packagedBytes.byteLength !==
      report.compositionIdentity
        .finalPackagedReviewByteLength
    || digestBytes(packagedBytes) !==
      report.sourceBindings
        .finalPackagedReviewDigestSha256
  ) throw runtimeFailure('Living Frame private review output changed before lease creation.')
  const lease =
    Object.freeze({
      leaseClass:
        'process_bound_single_use_selected_scene_particle_remotion_private_review_output_lease_v1' as const,
      leaseId:
        `lf-particle-remotion-review-output.${sha256AuthorityValue({
          reportDigestSha256:
            report.reportDigestSha256,
          finalPackagedReviewDigestSha256:
            report.sourceBindings
              .finalPackagedReviewDigestSha256,
          expectedByteLength:
            packagedBytes.byteLength,
        }).slice(0, 40)}`,
      reportDigestSha256:
        report.reportDigestSha256,
      finalPackagedReviewDigestSha256:
        report.sourceBindings
          .finalPackagedReviewDigestSha256,
      expectedByteLength:
        packagedBytes.byteLength,
      contentType: 'video/mp4' as const,
      callerSerializable: false as const,
      artifactAuthority: false as const,
      assetManifestAuthority: false as const,
      qaApprovalAuthority: false as const,
      privateReviewAuthority: false as const,
      billingAuthority: false as const,
      productionAuthority: false as const,
    })
  privateReviewOutputByLease.set(
    lease,
    Object.freeze({
      reportDigestSha256:
        report.reportDigestSha256,
      finalPackagedReviewDigestSha256:
        report.sourceBindings
          .finalPackagedReviewDigestSha256,
      expectedByteLength:
        packagedBytes.byteLength,
      contentType: 'video/mp4' as const,
      bytes: Buffer.from(packagedBytes),
    }),
  )
  return lease
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

async function renderFullTimelineChunk(input: {
  readonly chunkOrder: number
  readonly frames: ReturnType<
    typeof consumeLivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease
  >['frames']
  readonly sourceBytes: Buffer
  readonly captionBytes: Buffer
  readonly runtime: Awaited<
    ReturnType<
      typeof activateOrPrepareRemotionRuntime
    >
  >
  readonly selectedSceneId: string
  readonly selectedSceneBindingDigestSha256: string
  readonly timingBindingDigestSha256: string
  readonly deterministicMotionBundleDigestSha256: string
}): Promise<{
  readonly bytes: Buffer
  readonly receipt:
    LivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineChunk
}> {
  if (
    input.frames.length < 1
    || input.frames.length >
      MAXIMUM_SEQUENCE_FRAMES
  ) throw validationFailure('Living Frame full-timeline chunk size is invalid.')
  const chunkLabel =
    String(input.chunkOrder).padStart(2, '0')
  const sourceCommitment =
    commitment(input.sourceBytes)
  const captionCommitment =
    commitment(input.captionBytes)
  const overlayBindings =
    input.frames.map((frame, localFrame) => {
      const localLabel =
        String(localFrame).padStart(2, '0')
      const componentOutputKey =
        `lf-full-c${chunkLabel}-f${localLabel}`
      return {
        frame,
        localFrame,
        componentOutputKey,
        commitment:
          commitment(frame.pngBytes),
        motionSpec:
          createFrameGateMotionSpec({
            sceneId:
              input.selectedSceneId,
            componentId:
              componentOutputKey,
            startFrame: localFrame,
            selectedSceneBindingDigestSha256:
              input
                .selectedSceneBindingDigestSha256,
            timingBindingDigestSha256:
              input.timingBindingDigestSha256,
            deterministicMotionBundleDigestSha256:
              input
                .deterministicMotionBundleDigestSha256,
          }),
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
        durationFrames:
          FULL_TIMELINE_CHUNK_RENDER_FRAMES,
        sourceStartFrame: 0,
        sourceEndFrameExclusive:
          FULL_TIMELINE_CHUNK_RENDER_FRAMES,
        sourceFit: 'contain',
        panelBackground: '#111827',
        audioPolicy: 'preserve_source',
        captionOverlayPolicy:
          'approved_full_frame_rgba',
        livingFrameOverlayPolicy:
          'approved_rgba_over_source_below_captions_v1',
        livingFrameOverlayLayers:
          overlayBindings.map((binding) => ({
            sceneId:
              binding.motionSpec.sceneId,
            layerId:
              `lf-full-layer-c${chunkLabel}-f${String(binding.localFrame).padStart(2, '0')}`,
            manifestOutputKey:
              `lf-full-manifest-c${chunkLabel}-f${String(binding.localFrame).padStart(2, '0')}`,
            componentOutputKey:
              binding.componentOutputKey,
            startFrame:
              binding.localFrame,
            endFrameExclusive:
              binding.localFrame + 2,
            fit: 'fill',
            opacity: 1,
            motionSpec:
              binding.motionSpec,
          })),
      },
      source: {
        inputId:
          `lf-full-source-c${chunkLabel}`,
        mimeType: 'video/mp4',
        ...sourceCommitment,
      },
      captionOverlay: {
        inputId:
          `lf-full-caption-c${chunkLabel}`,
        mimeType: 'image/png',
        ...captionCommitment,
      },
      livingFrameOverlays:
        overlayBindings.map((binding) => ({
          inputId:
            `lf-full-frame-c${chunkLabel}-f${String(binding.localFrame).padStart(2, '0')}`,
          outputKey:
            binding.componentOutputKey,
          mimeType: 'image/png',
          ...binding.commitment,
        })),
    })
  const serverInputs:
    OfflineRemotionServerInjectedInput[] = [
      privateBufferInput(
        `lf-full-source-c${chunkLabel}`,
        'video/mp4',
        input.sourceBytes,
        sourceCommitment,
      ),
      ...overlayBindings.map((binding) =>
        privateBufferInput(
          `lf-full-frame-c${chunkLabel}-f${String(binding.localFrame).padStart(2, '0')}`,
          'image/png',
          binding.frame.pngBytes,
          binding.commitment,
        )),
      privateBufferInput(
        `lf-full-caption-c${chunkLabel}`,
        'image/png',
        input.captionBytes,
        captionCommitment,
      ),
    ]
  let renderedBytes: Buffer | undefined
  const result =
    await input.runtime.executeServerInjected(
      request,
      serverInputs,
      {
        maximumBytes:
          OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
        async persist(output) {
          if (
            output.expectedByteLength < 1_024
            || output.expectedByteLength >
              MAXIMUM_RENDERED_BYTES
            || !SHA256.test(
              output.expectedSha256,
            )
          ) throw runtimeFailure('Living Frame full-timeline chunk output commitment is invalid.')
          const chunks: Buffer[] = []
          let byteLength = 0
          const digest =
            createHash('sha256')
          for await (
            const chunk of output.stream
          ) {
            const bytes =
              Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk)
            byteLength += bytes.byteLength
            if (
              byteLength >
                MAXIMUM_RENDERED_BYTES
            ) throw runtimeFailure('Living Frame full-timeline chunk exceeded its private ceiling.')
            digest.update(bytes)
            chunks.push(Buffer.from(bytes))
          }
          const sha256 =
            digest.digest('hex')
          if (
            byteLength !==
              output.expectedByteLength
            || sha256 !==
              output.expectedSha256
          ) throw runtimeFailure('Living Frame full-timeline chunk stream diverged from its commitment.')
          renderedBytes =
            Buffer.concat(chunks)
          return { byteLength, sha256 }
        },
      },
    )
  if (renderedBytes == null) {
    throw runtimeFailure('Living Frame full-timeline chunk bytes were not retained.')
  }
  const mediaIdentity =
    inspectRenderedMedia(renderedBytes)
  const semantic =
    result.evidence.semanticEvidence
  if (
    mediaIdentity.width !== REVIEW_WIDTH
    || mediaIdentity.height !== REVIEW_HEIGHT
    || mediaIdentity.fps !== REVIEW_FPS
    || mediaIdentity.durationFrames !==
      FULL_TIMELINE_CHUNK_RENDER_FRAMES
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
  ) throw runtimeFailure('Living Frame full-timeline chunk evidence is incomplete.')
  const sourceStartFrame =
    input.frames[0]!.absoluteFrame
  const sourceEndFrameExclusive =
    input.frames.at(-1)!.absoluteFrame + 1
  return {
    bytes: renderedBytes,
    receipt: {
      order: input.chunkOrder,
      sourceStartFrame,
      sourceEndFrameExclusive,
      sourceFrameCount:
        input.frames.length,
      localRenderedDurationFrames:
        FULL_TIMELINE_CHUNK_RENDER_FRAMES,
      localOverlayCount:
        input.frames.length,
      maximumCanonicalOverlayCount:
        MAXIMUM_SEQUENCE_FRAMES,
      remotionRequestDigestSha256:
        result.evidence
          .requestEnvelopeSha256,
      remotionArtifactDigestSha256:
        result.artifact.sha256,
      exactSourceFramesRetainedDuringPackaging:
        true,
      fillerFramesDiscardedDuringPackaging:
        FULL_TIMELINE_CHUNK_RENDER_FRAMES -
          input.frames.length,
    },
  }
}

async function packageFullTimelineChunks(input: {
  readonly chunks: readonly Buffer[]
  readonly frameCounts: readonly number[]
}): Promise<Buffer> {
  if (
    input.chunks.length < 1
    || input.chunks.length !==
      input.frameCounts.length
    || input.frameCounts.some((count) =>
      !Number.isInteger(count)
      || count < 1
      || count > MAXIMUM_SEQUENCE_FRAMES)
  ) throw validationFailure('Living Frame full-timeline package input is invalid.')
  const directory =
    await mkdtemp(
      join(
        tmpdir(),
        'reeditpro-lf-full-timeline-',
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
        writeFile(path, input.chunks[order]!)),
    )
    const filterParts: string[] = []
    const concatInputs: string[] = []
    for (
      let order = 0;
      order < paths.length;
      order += 1
    ) {
      const count =
        input.frameCounts[order]!
      const durationSeconds =
        count / REVIEW_FPS
      filterParts.push(
        `[${order}:v]trim=start_frame=0:end_frame=${count},setpts=PTS-STARTPTS[v${order}]`,
        `[${order}:a]atrim=start=0:end=${durationSeconds.toFixed(9)},asetpts=PTS-STARTPTS[a${order}]`,
      )
      concatInputs.push(
        `[v${order}][a${order}]`,
      )
    }
    filterParts.push(
      `${concatInputs.join('')}concat=n=${paths.length}:v=1:a=1[vout][aout]`,
    )
    const totalFrames =
      input.frameCounts.reduce(
        (total, count) =>
          total + count,
        0,
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
        filterParts.join(';'),
        '-map',
        '[vout]',
        '-map',
        '[aout]',
        '-frames:v',
        String(totalFrames),
        '-r',
        String(REVIEW_FPS),
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
    if (result.status !== 0) {
      throw runtimeFailure(
        'Living Frame full-timeline packaging failed.',
        result.stderr?.toString('utf8'),
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
      'canonical-living-frame-motion-spec-v2',
    motionProfileId:
      'approved_visual_interval_scalar_keyframe_choreography_v2',
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
    containsExecutableOrOperationalPayload: false,
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
    '-count_frames',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height,avg_frame_rate,nb_frames,nb_read_frames',
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
      nb_read_frames?: string
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
    durationFrames: Number(
      stream?.nb_frames ??
        stream?.nb_read_frames,
    ),
  }
}

function extractRenderedFrames(
  bytes: Buffer,
  frameNumbers: readonly number[],
): readonly Buffer[] {
  const consecutiveFromZero =
    frameNumbers.every(
      (frame, order) => frame === order,
    )
  const selector =
    consecutiveFromZero
      ? null
      : frameNumbers
        .map((frame) => `eq(n\\,${frame})`)
        .join('+')
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    'pipe:0',
    ...(selector == null
      ? []
      : [
          '-vf',
          `select=${selector}`,
        ]),
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
      (frameNumbers.length + 16),
  })
  if (result.status !== 0) {
    throw runtimeFailure(
      'Living Frame private Remotion frame extraction failed.',
      result.error ??
        result.stderr?.toString('utf8'),
    )
  }
  const output = Buffer.from(result.stdout)
  const frameByteLength =
    REVIEW_WIDTH * REVIEW_HEIGHT * 3
  if (
    output.byteLength !==
      frameByteLength * frameNumbers.length
  ) {
    throw runtimeFailure(
      'Living Frame private Remotion frame count is invalid.',
      new Error(JSON.stringify({
        expectedFrameCount:
          frameNumbers.length,
        actualFrameCount:
          output.byteLength /
            frameByteLength,
        outputByteLength:
          output.byteLength,
        frameByteLength,
      })),
    )
  }
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
    const projectedAlphaWeightedPixelCount =
      source.alphaWeightedPixelCount
      * (
        REVIEW_WIDTH * REVIEW_HEIGHT
        / (
          input.report.sequenceIdentity.widthPixels
          * input.report.sequenceIdentity.heightPixels
        )
      )
    const expectedPerceptiblyVisible =
      expectedActive
      && source.maximumAlpha >=
        MINIMUM_SOURCE_MAXIMUM_ALPHA_FOR_REVIEW_VISIBILITY
      && projectedAlphaWeightedPixelCount >=
        MINIMUM_REVIEW_ALPHA_WEIGHTED_PIXEL_COUNT
    const particleVisible =
      expectedPerceptiblyVisible
        ? difference.count > 0
        : difference.count > 5
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
        expectedPerceptiblyVisible
          ? particleVisible
            && centroidErrorNormalized != null
            && centroidErrorNormalized < 0.16
          : expectedActive && particleVisible
            ? centroidErrorNormalized != null
              && centroidErrorNormalized < 0.16
            : !particleVisible
      )
    if (!matched) {
      throw runtimeFailure(
        [
          `Living Frame Remotion frame ${source.absoluteFrame}`,
          'failed pixel-level expectation:',
          `expectedActive=${expectedActive},`,
          `expectedPerceptiblyVisible=${expectedPerceptiblyVisible},`,
          `particleVisible=${particleVisible},`,
          `differencePixels=${difference.count},`,
          `centroidError=${String(centroidErrorNormalized)},`,
          `sourceAlphaCoverage=${source.alphaCoverageRatio},`,
          `sourceNonTransparentPixels=${source.nonTransparentPixelCount},`,
          `sourceAlphaWeightedPixels=${source.alphaWeightedPixelCount},`,
          `sourceMaximumAlpha=${source.maximumAlpha},`,
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
      expectedPerceptiblyVisible,
      projectedAlphaWeightedPixelCount:
        Number(projectedAlphaWeightedPixelCount.toFixed(6)),
      sourceMaximumAlpha:
        source.maximumAlpha,
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
    frame.expectedPerceptiblyVisible)
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

function assertFullTimelineInput(
  input:
    ExecuteLivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestInput,
): void {
  if (
    !isRecord(input)
    || Object.keys(input).sort().join('|') !== [
      'pixiJsRuntimeReport',
      'privateSequenceOutputLease',
      'qualificationId',
      'selectedSceneInternalTestReport',
    ].sort().join('|')
    || typeof input.qualificationId !==
      'string'
    || !SAFE_ID.test(input.qualificationId)
    || !isRecord(
      input.selectedSceneInternalTestReport,
    )
    || !isRecord(
      input.pixiJsRuntimeReport,
    )
    || !isRecord(
      input.privateSequenceOutputLease,
    )
  ) throw validationFailure('Living Frame full-timeline Remotion input is invalid.')
}

function assertSelectedSceneInternalTestReport(
  report:
    LivingFrameSelectedSceneEnvironmentalParticleInternalTestReport,
  pixiReport:
    LivingFrameEnvironmentalParticlePixiJsInternalRuntimeReport,
  lease:
    LivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease,
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
      .fullSelectedEnvironmentalRangeExecuted
    || report.remotionCompositeExecuted
    || !report.internalTestReadyForRemotion
    || report.artifactPersisted
    || report.assetManifestMutated
    || report.qaApproved
    || report.privateReviewApproved
    || report.actualCostCreated
    || report.customerCharged
    || report.externalBetaReady
    || report.productionReady
    || report.sourceBindings
      .pixiJsRuntimeReportDigestSha256 !==
        pixiReport.reportDigestSha256
    || report.sourceBindings
      .pixiJsSequenceDigestSha256 !==
        lease.sequenceDigestSha256
    || report.sourceBindings
      .confirmedOutputFrameDigestSha256 !==
        pixiReport.sourceBindings
          .confirmedOutputFrameDigestSha256
    || report.sourceBindings
      .currentMasterTimingDigestSha256 !==
        pixiReport.sourceBindings
          .masterTimingDigestSha256
    || report.exactExecutionRange.widthPixels !==
      pixiReport.sequenceIdentity.widthPixels
    || report.exactExecutionRange.heightPixels !==
      pixiReport.sequenceIdentity.heightPixels
    || report.exactExecutionRange.fps !==
      pixiReport.sequenceIdentity.fps
    || report.exactExecutionRange.startFrame !==
      pixiReport.sequenceIdentity.startFrame
    || report.exactExecutionRange
      .endFrameExclusive !==
        pixiReport.sequenceIdentity
          .endFrameExclusive
    || report.exactExecutionRange.durationFrames !==
      pixiReport.sequenceIdentity.frameImageCount
    || lease.reportDigestSha256 !==
      pixiReport.reportDigestSha256
    || lease.frameImageCount !==
      pixiReport.sequenceIdentity.frameImageCount
    || report.containsRawPngBytes
    || report
      .containsRawChatTranscriptMediaPathsUrlsCredentialsCommandsOrEnvironment
  ) throw validationFailure('Living Frame selected-scene internal report is invalid for full-timeline Remotion.')
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

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const nested of Object.values(value)) {
      deepFreeze(nested)
    }
  }
  return value
}
