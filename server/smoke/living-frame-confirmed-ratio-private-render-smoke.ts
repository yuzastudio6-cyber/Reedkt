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
  type PrivateOfflineRemotionRenderRuntime,
  type OfflineRemotionServerInjectedInput,
} from '../tool-execution/remotion-render-execution'

const fps = 30
const durationFrames = 30

const scenarios = [
  {
    scenarioId: 'confirmed-portrait-9-16',
    aspectRatio: '9:16',
    width: 360,
    height: 640,
    frameClass: 'portrait_9_16',
  },
  {
    scenarioId: 'confirmed-custom-4-5',
    aspectRatio: 'custom',
    width: 480,
    height: 600,
    frameClass: 'custom_or_other_confirmed_ratio',
  },
] as const

await prepareOfflineRemotionDockerRuntime()
const runtime =
  await activatePrivateOfflineRemotionRenderRuntime()

const results = []
for (const scenario of scenarios) {
  results.push(await runScenario(runtime, scenario))
}

assert.equal(results.length, 2)
assert.equal(results[0]!.width, 360)
assert.equal(results[0]!.height, 640)
assert.equal(results[1]!.width, 480)
assert.equal(results[1]!.height, 600)
assert.ok(results.every(
  (result) => result.width !== result.height,
))
assert.ok(results.every(
  (result) => result.squareSubstitutionApplied === false,
))

process.stdout.write(`${JSON.stringify({
  smoke:
    'living_frame_confirmed_ratio_private_render',
  status: 'passed',
  privateInternalOnly: true,
  confirmedFrameScenarios: results,
  exactConfirmedRatioPreserved: true,
  squareSubstitutionApplied: false,
  remotionFinalCanvasOwnerPreserved: true,
  actualRemotionRuntimeExecuted: true,
  actualFfprobeRuntimeExecuted: true,
  customerBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
})}\n`)

async function runScenario(
  runtime: PrivateOfflineRemotionRenderRuntime,
  scenario: (typeof scenarios)[number],
): Promise<{
  scenarioId: string
  aspectRatio: string
  frameClass: string
  width: number
  height: number
  frameCount: number
  frameRate: string
  expansionAndReturnMeasured: true
  captionPlanePreserved: true
  privateArtifactPersistedAndReopened: true
  squareSubstitutionApplied: false
  confirmedFrameDigestSha256: string
}> {
  const fixtureRoot = await mkdtemp(
    join(
      tmpdir(),
      `reeditpro-living-frame-${scenario.scenarioId}-`,
    ),
  )
  const storageRoot = await mkdtemp(
    join(
      tmpdir(),
      `reeditpro-living-frame-${scenario.scenarioId}-storage-`,
    ),
  )
  const sourcePath = join(fixtureRoot, 'source.mp4')
  const overlayPath = join(fixtureRoot, 'hybrid-overlay.png')
  const captionPath = join(fixtureRoot, 'caption.png')
  const renderedPath = join(fixtureRoot, 'rendered.mp4')

  try {
    makeSource(sourcePath, scenario.width, scenario.height)
    makeHybridOverlay(
      overlayPath,
      scenario.width,
      scenario.height,
    )
    makeCaption(
      captionPath,
      scenario.width,
      scenario.height,
    )
    const source = await fileCommitment(sourcePath)
    const overlay = await fileCommitment(overlayPath)
    const caption = await fileCommitment(captionPath)
    const frameDigest = sha256AuthorityValue({
      frameConfirmationStatus: 'confirmed',
      aspectRatio: scenario.aspectRatio,
      widthPixels: scenario.width,
      heightPixels: scenario.height,
      fps,
    })
    const motion = createMotionSpec({
      sceneId:
        `living-frame-ratio-${scenario.scenarioId}`,
      componentId:
        `living-frame-ratio-overlay-${scenario.scenarioId}`,
      frameDigest,
    })
    const request =
      buildOfflineRemotionFinalCompositionStreamingRequest({
        planningPayload: {
          compositionProfileId:
            'approved_source_caption_final_v1',
          width: scenario.width,
          height: scenario.height,
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
            sceneId: motion.sceneId,
            layerId:
              `lf-ratio-layer-${scenario.scenarioId}`,
            manifestOutputKey:
              `lf-ratio-manifest-${scenario.scenarioId}`,
            componentOutputKey:
              `lf-ratio-component-${scenario.scenarioId}`,
            startFrame: 0,
            endFrameExclusive: durationFrames,
            fit: 'fill',
            opacity: 1,
            motionSpec: motion,
          }],
        },
        source: {
          inputId:
            `approved-source-${scenario.scenarioId}`,
          mimeType: 'video/mp4',
          ...source,
        },
        captionOverlay: {
          inputId:
            `approved-caption-${scenario.scenarioId}`,
          mimeType: 'image/png',
          ...caption,
        },
        livingFrameOverlays: [{
          inputId:
            `approved-overlay-${scenario.scenarioId}`,
          outputKey:
            `lf-ratio-component-${scenario.scenarioId}`,
          mimeType: 'image/png',
          ...overlay,
        }],
      })
    const inputs: OfflineRemotionServerInjectedInput[] = [
      privateInput(
        `approved-source-${scenario.scenarioId}`,
        'video/mp4',
        sourcePath,
        source,
      ),
      privateInput(
        `approved-overlay-${scenario.scenarioId}`,
        'image/png',
        overlayPath,
        overlay,
      ),
      privateInput(
        `approved-caption-${scenario.scenarioId}`,
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
                [
                  'living-frame-confirmed-ratio',
                  scenario.scenarioId,
                  output.expectedSha256,
                ].join('\n'),
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
        .approvedLivingFrameOverlayBelowCaptionsApplied,
      true,
    )
    const frames = extractFrames({
      path: renderedPath,
      width: scenario.width,
      height: scenario.height,
      frameNumbers: [0, 14, 29],
    })
    const earlyPurple = countPurple(frames[0]!)
    const expandedPurple = countPurple(frames[1]!)
    const returnedPurple = countPurple(frames[2]!)
    assert.ok(expandedPurple > earlyPurple * 4)
    assert.ok(returnedPurple < expandedPurple * 0.35)
    assert.ok(
      Math.abs(returnedPurple - earlyPurple) <
        earlyPurple * 0.2,
    )
    for (const frame of frames) {
      assertCaptionVisible({
        frame,
        width: scenario.width,
        height: scenario.height,
      })
    }
    const probe = probeRenderedVideo(renderedPath)
    assert.equal(probe.width, scenario.width)
    assert.equal(probe.height, scenario.height)
    assert.equal(probe.frameRate, `${fps}/1`)
    assert.equal(probe.frameCount, durationFrames)
    const rendered = await readFile(renderedPath)
    assert.equal(
      createHash('sha256')
        .update(rendered)
        .digest('hex'),
      result.artifact.sha256,
    )
    return {
      scenarioId: scenario.scenarioId,
      aspectRatio: scenario.aspectRatio,
      frameClass: scenario.frameClass,
      width: probe.width,
      height: probe.height,
      frameCount: probe.frameCount,
      frameRate: probe.frameRate,
      expansionAndReturnMeasured: true,
      captionPlanePreserved: true,
      privateArtifactPersistedAndReopened: true,
      squareSubstitutionApplied: false,
      confirmedFrameDigestSha256: frameDigest,
    }
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
}

function createMotionSpec(input: {
  sceneId: string
  componentId: string
  frameDigest: string
}): CanonicalLivingFrameMotionSpec {
  const rawTracks:
    CanonicalLivingFrameMotionSpecDraft['tracks'] = [
      rawTrack(
        'ratio-expand-return',
        0,
        'layer',
        'scale_uniform',
        'primary',
        [
          [0, 0.42, 'ease_in_out_cubic'],
          [14, 1.6, 'settle_out'],
          [29, 0.42, 'hold'],
        ],
      ),
      rawTrack(
        'ratio-source-focus',
        1,
        'source',
        'blur_pixels',
        'secondary',
        [
          [0, 0, 'ease_in_out_cubic'],
          [14, 5, 'settle_out'],
          [29, 0, 'hold'],
        ],
      ),
    ]
  const tracks = rawTracks.map((track) => ({
    ...track,
    compiledSampleDigestSha256:
      deriveCanonicalLivingFrameCompiledSampleDigestSha256({
        keyframes: track.keyframes,
        sceneFrameCount: durationFrames,
      }),
  }))
  const draft:
    CanonicalLivingFrameMotionSpecDraft = {
      schemaVersion:
        'canonical-living-frame-motion-spec-v3',
      motionProfileId:
        'component_role_activation_selective_visual_interval_choreography_v3',
      sceneId: input.sceneId,
      componentId: input.componentId,
      sceneStartFrame: 0,
      sceneEndFrameExclusive: durationFrames,
      visualVerb: 'expand',
      importance: 'hero',
      depthStyle: 'shallow_2_5d',
      depthBand: 'foreground',
      parallaxFactor: 0.15,
      sourceBindings: {
        selectedSceneBindingDigestSha256:
          createHash('sha256')
            .update(`selected\n${input.sceneId}`)
            .digest('hex'),
        timingBindingDigestSha256:
          createHash('sha256')
            .update(`timing\n${fps}\n${durationFrames}`)
            .digest('hex'),
        deterministicMotionBundleDigestSha256:
          input.frameDigest,
      },
      attentionEventIds: [
        `attention-expand-${input.sceneId}`,
        `attention-restore-${input.sceneId}`,
      ],
      semanticScaleRequestIds: [
        `semantic-scale-${input.sceneId}`,
      ],
      tracks,
      metrics: {
        layerTrackCount: 1,
        cameraTrackCount: 0,
        sourceTrackCount: 1,
        keyframeCount: tracks.reduce(
          (total, track) =>
            total + track.keyframes.length,
          0,
        ),
        compiledSampleCount:
          tracks.length * durationFrames,
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

function rawTrack(
  trackId: string,
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
  return {
    trackId: `lf.ratio.${trackId}`,
    order,
    target,
    property,
    role,
    keyframes: keyframes.map(([
      frameOffset,
      value,
      easingToNext,
    ]) => ({
      frameOffset,
      value,
      easingToNext,
    })),
    compiledSampleCount: durationFrames,
    compiledSampleDigestSha256: '0'.repeat(64),
  }
}

function makeSource(
  path: string,
  width: number,
  height: number,
): void {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    `color=c=0x202938:size=${width}x${height}:rate=${fps}:duration=1`,
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=280:sample_rate=48000:duration=1',
    '-vf',
    [
      `drawgrid=width=${Math.max(12, Math.round(width / 24))}:height=${Math.max(12, Math.round(height / 24))}:thickness=2:color=0x64748B@0.8`,
      `drawbox=x=${Math.round(width * 0.08)}:y=${Math.round(height * 0.12)}:w=${Math.round(width * 0.32)}:h=${Math.round(height * 0.64)}:color=0xF59E0B@1:t=fill`,
    ].join(','),
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

function makeHybridOverlay(
  path: string,
  width: number,
  height: number,
): void {
  makeTransparentOverlay({
    path,
    width,
    height,
    filters: [
      `drawbox=x=0:y=0:w=${width}:h=${height}:color=0x8B5CF6@0.94:t=fill:replace=1`,
      `drawbox=x=${Math.round(width * 0.1)}:y=${Math.round(height * 0.16)}:w=${Math.round(width * 0.8)}:h=${Math.max(8, Math.round(height * 0.04))}:color=0xF5F3FF@0.9:t=fill:replace=1`,
    ],
  })
}

function makeCaption(
  path: string,
  width: number,
  height: number,
): void {
  makeTransparentOverlay({
    path,
    width,
    height,
    filters: [
      `drawbox=x=${Math.round(width * 0.2)}:y=${Math.round(height * 0.85)}:w=${Math.round(width * 0.6)}:h=${Math.max(18, Math.round(height * 0.06))}:color=0xFF00D4@1:t=fill:replace=1`,
    ],
  })
}

function makeTransparentOverlay(input: {
  path: string
  width: number
  height: number
  filters: readonly string[]
}): void {
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    `color=c=black@0:size=${input.width}x${input.height}:duration=1`,
    '-vf',
    [
      'format=rgba',
      'colorchannelmixer=aa=0',
      ...input.filters,
    ].join(','),
    '-frames:v',
    '1',
    '-threads',
    '1',
    '-y',
    input.path,
  ], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  assert.equal(result.status, 0, result.stderr)
}

function extractFrames(input: {
  path: string
  width: number
  height: number
  frameNumbers: readonly number[]
}): Buffer[] {
  const selector = input.frameNumbers
    .map((frame) => `eq(n\\,${frame})`)
    .join('+')
  const result = spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    input.path,
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
    maxBuffer:
      input.width * input.height * 3 *
      (input.frameNumbers.length + 1),
  })
  assert.equal(
    result.status,
    0,
    result.stderr?.toString('utf8'),
  )
  const bytes = Buffer.from(result.stdout)
  const frameBytes =
    input.width * input.height * 3
  assert.equal(
    bytes.byteLength,
    frameBytes * input.frameNumbers.length,
  )
  return input.frameNumbers.map((_, index) =>
    bytes.subarray(
      index * frameBytes,
      (index + 1) * frameBytes,
    ))
}

function countPurple(frame: Buffer): number {
  let count = 0
  for (let offset = 0; offset < frame.length; offset += 3) {
    const red = frame[offset]!
    const green = frame[offset + 1]!
    const blue = frame[offset + 2]!
    if (
      red > 90 && red < 190 &&
      green > 55 && green < 150 &&
      blue > 160
    ) count += 1
  }
  return count
}

function assertCaptionVisible(input: {
  frame: Buffer
  width: number
  height: number
}): void {
  let count = 0
  const xStart = Math.round(input.width * 0.2)
  const xEnd = Math.round(input.width * 0.8)
  const yStart = Math.round(input.height * 0.85)
  const yEnd = Math.min(
    input.height,
    yStart + Math.max(
      18,
      Math.round(input.height * 0.06),
    ),
  )
  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const offset = (y * input.width + x) * 3
      if (
        input.frame[offset]! > 160 &&
        input.frame[offset + 1]! < 110 &&
        input.frame[offset + 2]! > 130
      ) count += 1
    }
  }
  assert.ok(
    count > (xEnd - xStart) * (yEnd - yStart) * 0.7,
  )
}

function probeRenderedVideo(path: string): {
  width: number
  height: number
  frameRate: string
  frameCount: number
} {
  const result = spawnSync('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height,r_frame_rate,nb_frames',
    '-of',
    'json',
    path,
  ], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })
  assert.equal(result.status, 0, result.stderr)
  const parsed = JSON.parse(result.stdout) as {
    streams?: Array<{
      width?: number
      height?: number
      r_frame_rate?: string
      nb_frames?: string
    }>
  }
  const stream = parsed.streams?.[0]
  assert.ok(stream)
  return {
    width: stream.width!,
    height: stream.height!,
    frameRate: stream.r_frame_rate!,
    frameCount: Number(stream.nb_frames),
  }
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

function privateInput(
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
