import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  activatePrivateOfflineLibassCaptionRuntime,
  prepareOfflineLibassDockerRuntime,
} from '../tool-execution/libass-caption-execution'
import {
  activatePrivateOfflineMediaBinaryRuntime,
} from '../tool-execution/media-binary-execution/offline-media-binary-runtime'
import {
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-docker-runtime'
import {
  activatePrivateOfflineRemotionRenderRuntime,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-service'
import {
  buildOfflineRemotionFinalCompositionRequest,
} from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'

const fixtures = [
  { id: 'fr-combining', language: 'fr', caption: 'L’e\u0301lan cre\u0301e de\u0301ja\u0300' },
  { id: 'ja', language: 'ja', caption: '考えが動きを導く' },
  { id: 'ar', language: 'ar', caption: 'الفكرة تقود الحركة' },
  { id: 'hi', language: 'hi', caption: 'विचार गति को दिशा देते हैं' },
] as const

const outputRoot = await mkdtemp(join(tmpdir(),
  'reeditpro-caption-cap18-multilingual-private-'))
const fps = 24
const durationFrames = 48
const sourcePath = join(outputRoot, 'controlled-source.mp4')
const generated = spawnSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=24',
  '-f', 'lavfi', '-i', 'sine=frequency=520:sample_rate=48000:duration=2',
  '-frames:v', String(durationFrames),
  '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-colorspace', 'bt709', '-color_range', 'tv',
  '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart',
  sourcePath,
], { encoding: 'utf8' })
assert.equal(generated.status, 0, generated.stderr)
const sourceBytes = await readFile(sourcePath)
const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')

const built = await prepareOfflineLibassDockerRuntime()
assert.equal(built.fontPackProfileId, 'reeditpro_reviewed_fonts_v2')
assert.equal(built.fontPackReleaseId,
  'reeditpro-reviewed-noto-caption-fonts-2026-08-04-v1')
assert.equal(built.fontToolsVersion, '4.38.0')
assert.equal(built.openTypeSanitizerVersion, '8.2.1')
assert.equal(built.fontToolsSubsetRoundTripPassed, true)
assert.equal(built.malformedFontRejectedByOpenTypeSanitizer, true)
assert.equal(built.colorEmojiIncluded, false)
assert.equal(built.runtimeFontDownloadAllowed, false)
assert.equal(built.callerFontPathAllowed, false)
assert.match(built.sourceTreeSha256, /^[a-f0-9]{64}$/)

const runtime = await activatePrivateOfflineLibassCaptionRuntime()
assert.equal(runtime.image.imageIdentityHash, built.imageIdentityHash)
const preparedRemotion = await prepareOfflineRemotionDockerRuntime()
const remotion = await activatePrivateOfflineRemotionRenderRuntime()
assert.equal(remotion.image.imageIdentityHash,
  preparedRemotion.imageIdentityHash)
const mediaBinary = await activatePrivateOfflineMediaBinaryRuntime()

const outputs = []
for (const fixture of fixtures) {
  const result = await runtime.execute({
    schemaVersion: 'offline-libass-caption-execution-v1',
    toolId: 'libass',
    operationId: 'tool.libass.render_approved_caption_track.v1',
    payload: {
      captionProfileId: 'approved_ass_track_render_v1',
      fontPackProfileId: 'reeditpro_reviewed_fonts_v2',
      collisionPolicy: 'fail_on_reserved_zone_collision',
      preserveSpeechTiming: true,
      width: 640,
      height: 360,
      timestampMs: 1_000,
      fontSize: 42,
      marginV: 48,
      alignment: 2,
      caption: fixture.caption,
    },
  })
  assert.equal(result.request.payload.caption, fixture.caption)
  assert.equal(result.request.payload.fontPackProfileId,
    'reeditpro_reviewed_fonts_v2')
  assert.equal(result.imageArtifact.width, 640)
  assert.equal(result.imageArtifact.height, 360)
  assert.ok(result.imageArtifact.nonTransparentPixelCount > 100)
  assert.ok(result.imageArtifact.alphaBoundingBox.top >= 180)
  assert.equal(result.evidence.semanticEvidence.multilingualReviewedFontPackUsed,
    true)
  assert.equal(result.evidence.semanticEvidence.colorEmojiIncluded, false)
  assert.equal(result.evidence.semanticEvidence.runtimeFontDownloadMade, false)
  assert.equal(result.evidence.semanticEvidence.callerFontPathAccepted, false)
  assert.equal(result.evidence.confinement.networkMode, 'none')
  assert.equal(result.evidence.confinement.readOnlyRootFilesystem, true)
  const overlayFileName = `${fixture.id}-overlay.png`
  await writeFile(join(outputRoot, overlayFileName), result.imageArtifact.bytes,
    { flag: 'wx', mode: 0o600 })
  const composite = await remotion.execute(
    buildOfflineRemotionFinalCompositionRequest({
      planningPayload: {
        compositionProfileId: 'approved_source_caption_final_v1',
        width: 640,
        height: 360,
        fps,
        durationFrames,
        sourceStartFrame: 0,
        sourceEndFrameExclusive: durationFrames,
        sourceFit: 'contain',
        panelBackground: '#000000',
        audioPolicy: 'preserve_source',
        captionOverlayPolicy: 'approved_full_frame_rgba',
      },
      source: {
        mimeType: 'video/mp4',
        bytes: sourceBytes,
        sha256: sourceSha256,
      },
      captionOverlay: {
        mimeType: 'image/png',
        bytes: result.imageArtifact.bytes,
        sha256: result.imageArtifact.sha256,
      },
    }),
  )
  assert.equal(composite.artifact.width, 640)
  assert.equal(composite.artifact.height, 360)
  assert.equal(composite.artifact.fps, fps)
  assert.equal(composite.artifact.durationFrames, durationFrames)
  assert.equal(composite.evidence.semanticEvidence.approvedSourceBytesVerified,
    true)
  assert.equal(composite.evidence.semanticEvidence
    .approvedCaptionOverlayBytesVerified, true)
  const probe = await mediaBinary.execute({
    schemaVersion: 'offline-media-binary-execution-v1',
    toolId: 'ffprobe',
    operationId: 'tool.ffprobe.inspect_approved_media.v1',
    payload: {
      inspectionProfileId: 'final_export_v1',
      countFrames: true,
      verifyDurationAndSync: true,
      emitMachineJsonOnly: true,
      mimeType: 'video/mp4',
      sourceByteLength: composite.artifact.byteLength,
      sourceSha256: composite.artifact.sha256,
      sourceBytesBase64: composite.artifact.bytes.toString('base64'),
    },
  })
  assert('resultJson' in probe)
  const streams = probe.resultJson.document.streams as
    Array<Record<string, unknown>>
  const video = streams.find((stream) => stream.codecType === 'video')
  const audio = streams.find((stream) => stream.codecType === 'audio')
  assert.equal(video?.width, 640)
  assert.equal(video?.height, 360)
  assert.equal(video?.readFrameCount, durationFrames)
  assert.equal(video?.codecName, 'h264')
  assert.equal(video?.pixelFormat, 'yuv420p')
  assert.equal(video?.colorSpace, 'bt709')
  assert.equal(audio?.codecName, 'aac')
  const videoFileName = `${fixture.id}-composite.mp4`
  const videoPath = join(outputRoot, videoFileName)
  await writeFile(videoPath, composite.artifact.bytes,
    { flag: 'wx', mode: 0o600 })
  const inspectedFrameNumber = 24
  const inspectedFrameFileName = `${fixture.id}-frame-024.png`
  const inspectedFramePath = join(outputRoot, inspectedFrameFileName)
  const extracted = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', videoPath,
    '-vf', `select=eq(n\\,${inspectedFrameNumber})`,
    '-fps_mode', 'passthrough', '-frames:v', '1', inspectedFramePath,
  ], { encoding: 'utf8' })
  assert.equal(extracted.status, 0, extracted.stderr)
  const inspectedFrameBytes = await readFile(inspectedFramePath)
  outputs.push({
    id: fixture.id,
    language: fixture.language,
    captionSha256: createHash('sha256').update(fixture.caption).digest('hex'),
    overlayFileName,
    overlaySha256: result.imageArtifact.sha256,
    overlayByteLength: result.imageArtifact.byteLength,
    nonTransparentPixelCount: result.imageArtifact.nonTransparentPixelCount,
    alphaBoundingBox: result.imageArtifact.alphaBoundingBox,
    videoFileName,
    artifactSha256: composite.artifact.sha256,
    byteLength: composite.artifact.byteLength,
    width: composite.artifact.width,
    height: composite.artifact.height,
    fps: composite.artifact.fps,
    durationFrames: composite.artifact.durationFrames,
    inspectedFrameNumber,
    inspectedFrameFileName,
    inspectedFrameSha256: createHash('sha256')
      .update(inspectedFrameBytes).digest('hex'),
  })
}

assert.equal(new Set(outputs.map((output) => output.artifactSha256)).size,
  fixtures.length)
const contactSheetFileName = 'multilingual-contact-sheet.png'
const contactSheet = spawnSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  ...outputs.flatMap((output) =>
    ['-i', join(outputRoot, output.inspectedFrameFileName)]),
  '-filter_complex', `hstack=inputs=${outputs.length}`,
  '-frames:v', '1', join(outputRoot, contactSheetFileName),
], { encoding: 'utf8' })
assert.equal(contactSheet.status, 0, contactSheet.stderr)
const contactSheetRasterSha256 = createHash('sha256')
  .update(await readFile(join(outputRoot, contactSheetFileName))).digest('hex')
const inspectionIndex = {
  schemaVersion: 'caption-cap18-multilingual-runtime-inspection-index-v1',
  privateTemporaryOutputRoot: outputRoot,
  image: {
    imageTag: built.imageTag,
    imageId: built.imageId,
    imageIdentityHash: built.imageIdentityHash,
    sourceTreeSha256: built.sourceTreeSha256,
    fontPackProfileId: built.fontPackProfileId,
    fontPackReleaseId: built.fontPackReleaseId,
    fontToolsVersion: built.fontToolsVersion,
    openTypeSanitizerVersion: built.openTypeSanitizerVersion,
    fontToolsSubsetRoundTripPassed: built.fontToolsSubsetRoundTripPassed,
    malformedFontRejectedByOpenTypeSanitizer:
      built.malformedFontRejectedByOpenTypeSanitizer,
    fontSha256: built.fontSha256,
  },
  remotion: {
    imageId: preparedRemotion.imageId,
    imageIdentityHash: preparedRemotion.imageIdentityHash,
    sourceTreeSha256: preparedRemotion.sourceTreeSha256,
  },
  source: {
    sourceSha256,
    width: 640,
    height: 360,
    fps,
    durationFrames,
  },
  outputs,
  contactSheetFileName,
  contactSheetRasterSha256,
  authority: {
    runtimeChildrenStoppedBeforeDirectInspection: true,
    providerCallMade: false,
    modelCallMade: false,
    libassOperationId: 'tool.libass.render_approved_caption_track.v1',
    remotionOperationId: 'tool.remotion.render_approved_composition.v1',
    ffprobeOperationId: 'tool.ffprobe.inspect_approved_media.v1',
    fullTrackOrVideoBurnInReady: false,
    finalQaApprovalGranted: false,
    publicDeliveryCreated: false,
    productionReady: false,
  },
}
await writeFile(join(outputRoot, 'inspection-index.json'),
  `${JSON.stringify(inspectionIndex, null, 2)}\n`,
  { flag: 'wx', mode: 0o600 })

console.log(JSON.stringify({
  smoke: 'captions_specialist_cap_18_multilingual_runtime',
  status: 'passed_awaiting_direct_raster_inspection',
  outputRoot,
  imageIdentityHash: built.imageIdentityHash,
  sourceTreeSha256: built.sourceTreeSha256,
  outputs,
  contactSheetFileName,
  contactSheetRasterSha256,
  actualLibassExecutionCompleted: true,
  actualRemotionFinalCompositionCompleted: true,
  actualPinnedFfprobeQaCompleted: true,
  runtimeChildrenStoppedBeforeDirectInspection: true,
  providerCallMade: false,
  productionReady: false,
}, null, 2))
