import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import {
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type {
  CanonicalLivingFrameMotionSpec,
  CanonicalLivingFrameMotionSpecDraft,
} from '../../src/types/living-frame-canonical-motion'
import {
  inspectCanonicalPrivateRemotionArtifact,
  persistCanonicalPrivateRemotionArtifactStream,
} from '../services/canonical-private-remotion-artifact-storage'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  deriveCanonicalLivingFrameCompiledSampleDigestSha256,
} from '../living-frame/canonical-living-frame-motion'
import {
  OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
  activatePrivateOfflineRemotionRenderRuntime,
  buildOfflineRemotionFinalCompositionStreamingRequest,
  prepareOfflineRemotionDockerRuntime,
  type OfflineRemotionServerInjectedInput,
} from '../tool-execution/remotion-render-execution'

const width = 640
const height = 360
const fps = 30
const durationFrames = 60
const sceneStartFrame = 10
const sceneEndFrameExclusive = 50
const fixtureRoot = await mkdtemp(
  join(tmpdir(), 'reeditpro-living-frame-motion-fixture-'),
)
const storageRoot = await mkdtemp(
  join(tmpdir(), 'reeditpro-living-frame-motion-storage-'),
)
const sourcePath = join(fixtureRoot, 'source.mp4')
const overlayPath = join(fixtureRoot, 'overlay.png')
const captionPath = join(fixtureRoot, 'caption.png')
const renderedPath = join(fixtureRoot, 'rendered.mp4')

try {
  makeSource(sourcePath)
  makeOverlay(overlayPath)
  makeCaption(captionPath)
  const source = await fileCommitment(sourcePath)
  const overlay = await fileCommitment(overlayPath)
  const caption = await fileCommitment(captionPath)
  const motionSpec = createMotionSpec()

  await prepareOfflineRemotionDockerRuntime()
  const runtime =
    await activatePrivateOfflineRemotionRenderRuntime()
  const request =
    buildOfflineRemotionFinalCompositionStreamingRequest({
      planningPayload: {
        compositionProfileId:
          'approved_source_caption_final_v1',
        width,
        height,
        fps,
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
        livingFrameOverlayLayers: [{
          sceneId: motionSpec.sceneId,
          layerId:
            'living-frame-layer-subject-neutral',
          manifestOutputKey:
            'living-frame-manifest-subject-neutral',
          componentOutputKey:
            'living-frame-component-subject-neutral',
          startFrame: sceneStartFrame,
          endFrameExclusive:
            sceneEndFrameExclusive,
          fit: 'fill',
          opacity: 1,
          motionSpec,
        }],
      },
      source: {
        inputId: 'approved-source',
        mimeType: 'video/mp4',
        ...source,
      },
      captionOverlay: {
        inputId: 'approved-caption',
        mimeType: 'image/png',
        ...caption,
      },
      livingFrameOverlays: [{
        inputId:
          'approved-living-frame-component',
        outputKey:
          'living-frame-component-subject-neutral',
        mimeType: 'image/png',
        ...overlay,
      }],
    })
  const inputs: OfflineRemotionServerInjectedInput[] = [
    privateFileInput(
      'approved-source',
      'video/mp4',
      sourcePath,
      source,
    ),
    privateFileInput(
      'approved-living-frame-component',
      'image/png',
      overlayPath,
      overlay,
    ),
    privateFileInput(
      'approved-caption',
      'image/png',
      captionPath,
      caption,
    ),
  ]
  const result = await runtime.executeServerInjected(
    request,
    inputs,
    {
      maximumBytes:
        OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
      async persist(output) {
        const privateObjectIdentityHash =
          createHash('sha256')
            .update(
              `living-frame-motion-render\n${output.expectedSha256}`,
            )
            .digest('hex')
        const persisted =
          await persistCanonicalPrivateRemotionArtifactStream({
            localStorageRoot: storageRoot,
            privateObjectIdentityHash,
            stream: output.stream,
            expectedByteLength:
              output.expectedByteLength,
            expectedSha256:
              output.expectedSha256,
          })
        const reopened =
          await inspectCanonicalPrivateRemotionArtifact({
            localStorageRoot: storageRoot,
            privateObjectIdentityHash,
        })
        assert.ok(reopened)
        const chunks: Buffer[] = []
        const reopenedStream =
          await reopened.openStream()
        for await (const chunk of reopenedStream) {
          chunks.push(
            Buffer.isBuffer(chunk)
              ? chunk
              : Buffer.from(chunk),
          )
        }
        await writeFile(
          renderedPath,
          Buffer.concat(chunks),
        )
        return persisted
      },
    },
  )
  assert.equal(
    result.evidence.semanticEvidence
      .approvedLivingFrameDeterministicMotionApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .approvedLivingFrameAdaptiveDepthStyleApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .approvedLivingFrameCameraOrSourceAttentionApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .approvedLivingFrameOverlayBelowCaptionsApplied,
    true,
  )

  const frames = extractFrames(
    renderedPath,
    [sceneStartFrame, sceneEndFrameExclusive - 1],
  )
  const earlyCentroid =
    cyanCentroid(frames[0]!)
  const lateCentroid =
    cyanCentroid(frames[1]!)
  assert.ok(
    lateCentroid.x - earlyCentroid.x > width * 0.27,
    `Expected deterministic horizontal motion, received ${earlyCentroid.x} -> ${lateCentroid.x}.`,
  )
  assert.ok(
    Math.abs(lateCentroid.y - earlyCentroid.y) <
      height * 0.08,
  )
  assertCaptionAboveLivingFrame(frames[1]!)

  const rendered = await readFile(renderedPath)
  assert.equal(
    createHash('sha256').update(rendered).digest('hex'),
    result.artifact.sha256,
  )
  process.stdout.write(`${JSON.stringify({
    smoke:
      'offline_remotion_living_frame_motion',
    status: 'passed',
    motionSpecDigestSha256:
      motionSpec.motionSpecDigestSha256,
    depthStyle: motionSpec.depthStyle,
    earlyCyanCentroid: earlyCentroid,
    lateCyanCentroid: lateCentroid,
    deterministicMotionObserved: true,
    sourceAttentionAndCameraTracksApplied: true,
    captionPlaneObservedAboveLivingFrame: true,
    privateInternalOnly: true,
    productReady: false,
    productionReady: false,
  })}\n`)
} finally {
  await rm(fixtureRoot, {
    recursive: true,
    force: true,
  })
  await rm(storageRoot, {
    recursive: true,
    force: true,
  })
}

function createMotionSpec():
CanonicalLivingFrameMotionSpec {
  const duration =
    sceneEndFrameExclusive - sceneStartFrame
  const tracks:
    CanonicalLivingFrameMotionSpecDraft['tracks'] = [
      track(
        'layer-x',
        0,
        'layer',
        'position_x_normalized',
        'primary',
        [
          [0, -0.3, 'ease_in_out_cubic'],
          [duration - 1, 0, 'hold'],
        ],
      ),
      track(
        'camera-scale',
        1,
        'virtual_camera',
        'scale_uniform',
        'camera',
        [
          [0, 1, 'ease_in_out_cubic'],
          [Math.floor(duration / 2), 1.025, 'settle_out'],
          [duration - 1, 1, 'hold'],
        ],
      ),
      track(
        'source-blur',
        2,
        'source',
        'blur_pixels',
        'secondary',
        [
          [0, 0, 'ease_in_out_cubic'],
          [Math.floor(duration / 2), 3.5, 'settle_out'],
          [duration - 1, 0, 'hold'],
        ],
      ),
      track(
        'layer-shadow',
        3,
        'layer',
        'shadow_opacity',
        'secondary',
        [
          [0, 0.05, 'ease_in_out_cubic'],
          [Math.floor(duration / 2), 0.28, 'settle_out'],
          [duration - 1, 0.12, 'hold'],
        ],
      ),
    ]
  const draft:
    CanonicalLivingFrameMotionSpecDraft = {
      schemaVersion:
        'canonical-living-frame-motion-spec-v1',
      motionProfileId:
        'approved_scalar_keyframe_choreography_v1',
      sceneId:
        'living-frame-scene-subject-neutral',
      componentId:
        'living-frame-component-subject-neutral',
      sceneStartFrame,
      sceneEndFrameExclusive,
      visualVerb: 'approach',
      importance: 'hero',
      depthStyle: 'shallow_2_5d',
      depthBand: 'in_front_of_subject',
      parallaxFactor: 0.18,
      sourceBindings: {
        selectedSceneBindingDigestSha256:
          'a'.repeat(64),
        timingBindingDigestSha256:
          'b'.repeat(64),
        deterministicMotionBundleDigestSha256:
          'c'.repeat(64),
      },
      attentionEventIds: [
        'attention-subject-neutral-handoff',
      ],
      semanticScaleRequestIds: [
        'scale-subject-neutral-perspective',
      ],
      tracks,
      metrics: {
        layerTrackCount: 2,
        cameraTrackCount: 1,
        sourceTrackCount: 1,
        keyframeCount: tracks.reduce(
          (total, candidate) =>
            total + candidate.keyframes.length,
          0,
        ),
        compiledSampleCount:
          tracks.length * duration,
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

function track(
  suffix: string,
  order: number,
  target:
    CanonicalLivingFrameMotionSpecDraft[
      'tracks'
    ][number]['target'],
  property:
    CanonicalLivingFrameMotionSpecDraft[
      'tracks'
    ][number]['property'],
  role:
    CanonicalLivingFrameMotionSpecDraft[
      'tracks'
    ][number]['role'],
  keyframes: ReadonlyArray<readonly [
    number,
    number,
    CanonicalLivingFrameMotionSpecDraft[
      'tracks'
    ][number]['keyframes'][number]['easingToNext'],
  ]>,
): CanonicalLivingFrameMotionSpecDraft[
  'tracks'
][number] {
  const duration =
    sceneEndFrameExclusive - sceneStartFrame
  const resolvedKeyframes = keyframes.map(([
    frameOffset,
    value,
    easingToNext,
  ]) => ({
    frameOffset,
    value,
    easingToNext,
  }))
  return {
    trackId: `lf.track.subject-neutral-${suffix}`,
    order,
    target,
    property,
    role,
    keyframes: resolvedKeyframes,
    compiledSampleCount: duration,
    compiledSampleDigestSha256:
      deriveCanonicalLivingFrameCompiledSampleDigestSha256({
        keyframes: resolvedKeyframes,
        sceneFrameCount: duration,
      }),
  }
}

function makeSource(path: string): void {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    `color=c=0x202938:size=${width}x${height}:rate=${fps}:duration=2`,
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=440:sample_rate=48000:duration=2',
    '-vf',
    'drawgrid=width=40:height=40:thickness=2:color=0x536179@0.75',
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
    '128k',
    '-shortest',
    '-threads',
    '1',
    '-y',
    path,
  ], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  assert.equal(result.status, 0, result.stderr)
}

function makeOverlay(path: string): void {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    `color=c=black@0:size=${width}x${height}:duration=1`,
    '-vf',
    [
      'format=rgba',
      'colorchannelmixer=aa=0',
      'drawbox=x=280:y=245:w=110:h=100:color=0x00E5FF@1:t=fill:replace=1',
    ].join(','),
    '-frames:v',
    '1',
    '-threads',
    '1',
    '-y',
    path,
  ], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  assert.equal(result.status, 0, result.stderr)
}

function makeCaption(path: string): void {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    `color=c=black@0:size=${width}x${height}:duration=1`,
    '-vf',
    [
      'format=rgba',
      'colorchannelmixer=aa=0',
      'drawbox=x=280:y=275:w=110:h=34:color=0xFF00D4@1:t=fill:replace=1',
    ].join(','),
    '-frames:v',
    '1',
    '-threads',
    '1',
    '-y',
    path,
  ], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  assert.equal(result.status, 0, result.stderr)
}

function extractFrames(
  path: string,
  frameNumbers: readonly number[],
): Buffer[] {
  const selector = frameNumbers
    .map((frame) => `eq(n\\,${frame})`)
    .join('+')
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    path,
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
    encoding: null,
    maxBuffer: width * height * 3 *
      (frameNumbers.length + 1),
  })
  assert.equal(
    result.status,
    0,
    result.stderr?.toString('utf8'),
  )
  const bytes = Buffer.from(result.stdout)
  const frameBytes = width * height * 3
  assert.equal(
    bytes.byteLength,
    frameBytes * frameNumbers.length,
  )
  return frameNumbers.map((_, index) =>
    bytes.subarray(
      index * frameBytes,
      (index + 1) * frameBytes,
    ))
}

function cyanCentroid(frame: Buffer): {
  x: number
  y: number
  count: number
} {
  let count = 0
  let xTotal = 0
  let yTotal = 0
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3
      const red = frame[offset]!
      const green = frame[offset + 1]!
      const blue = frame[offset + 2]!
      if (
        red < 90 &&
        green > 140 &&
        blue > 150
      ) {
        count += 1
        xTotal += x
        yTotal += y
      }
    }
  }
  assert.ok(
    count > 1_000,
    `Expected a visible cyan component, found ${count} pixels.`,
  )
  return {
    x: xTotal / count,
    y: yTotal / count,
    count,
  }
}

function assertCaptionAboveLivingFrame(
  frame: Buffer,
): void {
  let magentaPixels = 0
  for (let y = 275; y < 309; y += 1) {
    for (let x = 280; x < 390; x += 1) {
      const offset = (y * width + x) * 3
      const red = frame[offset]!
      const green = frame[offset + 1]!
      const blue = frame[offset + 2]!
      if (
        red > 150 &&
        green < 100 &&
        blue > 120
      ) magentaPixels += 1
    }
  }
  assert.ok(
    magentaPixels > 2_000,
    `Expected caption-plane magenta above Living Frame, found ${magentaPixels} pixels.`,
  )
}

async function fileCommitment(path: string): Promise<{
  byteLength: number
  sha256: string
}> {
  const fileStat = await stat(path)
  const checksum = createHash('sha256')
  let byteLength = 0
  for await (const chunk of createReadStream(path)) {
    const bytes = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk)
    byteLength += bytes.byteLength
    checksum.update(bytes)
  }
  assert.equal(byteLength, fileStat.size)
  return {
    byteLength,
    sha256: checksum.digest('hex'),
  }
}

function privateFileInput(
  inputId: string,
  mimeType: 'video/mp4' | 'image/png',
  path: string,
  commitment: {
    byteLength: number
    sha256: string
  },
): OfflineRemotionServerInjectedInput {
  return {
    inputMode: 'private_verified_stream_v1',
    inputId,
    mimeType,
    ...commitment,
    async openStream() {
      return createReadStream(path)
    },
  }
}
