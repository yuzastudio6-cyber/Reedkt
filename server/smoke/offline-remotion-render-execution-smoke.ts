import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { activatePrivateOfflineMediaBinaryRuntime } from '../tool-execution/media-binary-execution/offline-media-binary-runtime'
import { activatePrivateOfflineLibassCaptionRuntime } from '../tool-execution/libass-caption-execution'
import { prepareOfflineRemotionDockerRuntime } from '../tool-execution/remotion-render-execution/offline-remotion-render-docker-runtime'
import { activatePrivateOfflineRemotionRenderRuntime, openPrivateOfflineRemotionRenderRuntime, readPersistedOfflineRemotionRenderRuntimeAuthority } from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-service'
import { buildOfflineRemotionFinalCompositionRequest, validateOfflineRemotionRenderRequest } from '../tool-execution/remotion-render-execution/offline-remotion-render-execution-protocol'

const request = {
  schemaVersion: 'offline-remotion-render-execution-v1', toolId: 'remotion',
  operationId: 'tool.remotion.render_approved_composition.v1',
  payload: { width: 640, height: 360, fps: 24, durationFrames: 24, frameTemplateId: 'approved_full_panel_v1', panelBackground: '#F7F8FA', accentColor: '#4F46E5', title: 'Approved ReEditPro composition', subtitle: 'Deterministic private render evidence', caption: 'Frame-accurate composition proof' },
} as const

for (const invalid of [
  { ...request, command: 'whoami' },
  { ...request, payload: { ...request.payload, sourceUrl: 'https://example.test/source.mp4' } },
  { ...request, payload: { ...request.payload, title: '/etc/passwd' } },
  { ...request, payload: { ...request.payload, width: 1920, height: 1080 } },
  { ...request, payload: { ...request.payload, durationFrames: 9000 } },
]) assert.throws(() => validateOfflineRemotionRenderRequest(invalid), /unsupported|unsafe|approved|bounds/)

const prepared = await prepareOfflineRemotionDockerRuntime()
const activated = await activatePrivateOfflineRemotionRenderRuntime()
assert.equal(activated.image.imageId, prepared.imageId)
assert.equal(
  activated.image.labels['com.reeditpro.runner.source-tree.sha256'],
  activated.image.sourceTreeSha256,
)
const authority = await readPersistedOfflineRemotionRenderRuntimeAuthority()
assert.ok(authority)
assert.equal(authority.readiness.canonicalDispatchMayReference, true)
assert.equal(authority.readiness.finalExportReady, false)
const reopened = await openPrivateOfflineRemotionRenderRuntime()
assert.equal(reopened.image.imageIdentityHash, activated.image.imageIdentityHash)
const result = await reopened.execute(request)
assert.equal(result.artifact.bytes.subarray(4, 8).toString('ascii'), 'ftyp')
assert.equal(result.artifact.width, 640); assert.equal(result.artifact.height, 360)
assert.equal(result.artifact.fps, 24); assert.equal(result.artifact.durationFrames, 24)
assert.equal(result.evidence.packageVersion, '4.0.487')
assert.equal(result.evidence.confinement.networkMode, 'none')
assert.equal(result.evidence.confinement.readOnlyRootFilesystem, true)
assert.equal(result.evidence.confinement.capDropAll, true)
assert.equal(result.evidence.confinement.noNewPrivileges, true)
assert.equal(result.evidence.confinement.user, '10001:10001')
assert.equal(result.readiness.productReady, false)

const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
const probe = await mediaRuntime.execute({
  schemaVersion: 'offline-media-binary-execution-v1',
  toolId: 'ffprobe',
  operationId: 'tool.ffprobe.inspect_approved_media.v1',
  payload: {
    inspectionProfileId: 'final_export_v1', countFrames: true,
    verifyDurationAndSync: true, emitMachineJsonOnly: true,
    mimeType: 'video/mp4', sourceByteLength: result.artifact.byteLength,
    sourceSha256: result.artifact.sha256,
    sourceBytesBase64: result.artifact.bytes.toString('base64'),
  },
})
assert.ok('resultJson' in probe)
const probeDocument = probe.resultJson.document
const streams = probeDocument.streams as Array<Record<string, unknown>>
const video = streams.find((stream) => stream.codecType === 'video')
assert.ok(video)
assert.equal(video.codecName, 'h264')
assert.equal(video.width, 640); assert.equal(video.height, 360)
assert.equal(video.fps, 24); assert.equal(video.readFrameCount, 24)
assert.equal(video.pixelFormat, 'yuv420p'); assert.equal(video.colorSpace, 'bt709')
assert.equal(probeDocument.durationSeconds, 1)

const fixtureRoot = await mkdtemp(join(tmpdir(), 'reeditpro-remotion-final-composition-'))
try {
  const sourcePath = join(fixtureRoot, 'source-with-audio.mp4')
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=24',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000',
    '-t', '1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart', sourcePath,
  ], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
  const sourceBytes = await readFile(sourcePath)
  const libassRuntime = await activatePrivateOfflineLibassCaptionRuntime()
  const overlay = await libassRuntime.execute({
    schemaVersion: 'offline-libass-caption-execution-v1', toolId: 'libass',
    operationId: 'tool.libass.render_approved_caption_track.v1',
    payload: {
      captionProfileId: 'approved_ass_track_render_v1',
      fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
      collisionPolicy: 'fail_on_reserved_zone_collision', preserveSpeechTiming: true,
      width: 640, height: 360, timestampMs: 1000, fontSize: 42, marginV: 48,
      alignment: 2, caption: 'Approved source caption final',
    },
  })
  const finalRequest = buildOfflineRemotionFinalCompositionRequest({
    planningPayload: {
      compositionProfileId: 'approved_source_caption_final_v1', width: 640, height: 360,
      fps: 24, durationFrames: 24, sourceStartFrame: 12, sourceEndFrameExclusive: 36,
      sourceFit: 'contain', panelBackground: '#000000',
      audioPolicy: 'preserve_source', captionOverlayPolicy: 'approved_full_frame_rgba',
    },
    source: {
      mimeType: 'video/mp4', bytes: sourceBytes,
      sha256: createHash('sha256').update(sourceBytes).digest('hex'),
    },
    captionOverlay: {
      mimeType: 'image/png', bytes: overlay.imageArtifact.bytes,
      sha256: overlay.imageArtifact.sha256,
    },
  })
  assert.ok('sourceBytesBase64' in finalRequest.payload)
  for (const invalidFinal of [
    { ...finalRequest, sourceUrl: 'https://example.test/source.mp4' },
    { ...finalRequest, payload: { ...finalRequest.payload, sourceBytesBase64: `${finalRequest.payload.sourceBytesBase64}A` } },
    { ...finalRequest, payload: { ...finalRequest.payload, captionOverlaySha256: 'f'.repeat(64) } },
    { ...finalRequest, payload: { ...finalRequest.payload, sourceFit: 'cover' } },
    { ...finalRequest, payload: { ...finalRequest.payload, sourceStartFrame: 11 } },
  ]) assert.throws(() => validateOfflineRemotionRenderRequest(invalidFinal), /unsupported|commitment|policy|bytes/)
  const finalResult = await reopened.execute(finalRequest)
  assert.equal(finalResult.artifact.bytes.subarray(4, 8).toString('ascii'), 'ftyp')
  assert.equal(finalResult.artifact.width, 640); assert.equal(finalResult.artifact.height, 360)
  assert.equal(finalResult.artifact.fps, 24); assert.equal(finalResult.artifact.durationFrames, 24)
  assert.equal(finalResult.evidence.semanticEvidence.approvedSourceBytesVerified, true)
  assert.equal(finalResult.evidence.semanticEvidence.approvedCaptionOverlayBytesVerified, true)
  assert.equal(finalResult.evidence.semanticEvidence.approvedSourceTrimFramesApplied, true)
  assert.equal(finalResult.evidence.semanticEvidence.sourceAudioPreservationRequested, true)
  assert.equal(finalResult.evidence.semanticEvidence.finalCompositionProfileExecuted, true)
  const finalProbe = await mediaRuntime.execute({
    schemaVersion: 'offline-media-binary-execution-v1', toolId: 'ffprobe',
    operationId: 'tool.ffprobe.inspect_approved_media.v1',
    payload: {
      inspectionProfileId: 'final_export_v1', countFrames: true,
      verifyDurationAndSync: true, emitMachineJsonOnly: true,
      mimeType: 'video/mp4', sourceByteLength: finalResult.artifact.byteLength,
      sourceSha256: finalResult.artifact.sha256,
      sourceBytesBase64: finalResult.artifact.bytes.toString('base64'),
    },
  })
  assert.ok('resultJson' in finalProbe)
  const finalStreams = finalProbe.resultJson.document.streams as Array<Record<string, unknown>>
  const finalVideo = finalStreams.find((stream) => stream.codecType === 'video')
  const finalAudio = finalStreams.find((stream) => stream.codecType === 'audio')
  assert.equal(finalVideo?.codecName, 'h264')
  assert.equal(finalVideo?.pixelFormat, 'yuv420p')
  assert.equal(finalVideo?.colorSpace, 'bt709')
  assert.equal(finalVideo?.readFrameCount, 24)
  assert.equal(finalAudio?.codecName, 'aac')
  const finalDurationSeconds = Number(finalProbe.resultJson.document.durationSeconds)
  assert.ok(finalDurationSeconds >= 1 && finalDurationSeconds <= 1 + (2 / 24))

  const sourceSequenceRequest = buildOfflineRemotionFinalCompositionRequest({
    planningPayload: {
      compositionProfileId: 'approved_source_sequence_caption_final_v1',
      width: 640, height: 360, fps: 24, durationFrames: 48,
      sourceSegments: [{
        sourceSequenceItemId: 'approved-source-a',
        sourceStartFrame: 0, sourceEndFrameExclusive: 24,
        timelineStartFrame: 0, timelineEndFrameExclusive: 24,
      }, {
        sourceSequenceItemId: 'approved-source-b',
        sourceStartFrame: 0, sourceEndFrameExclusive: 24,
        timelineStartFrame: 24, timelineEndFrameExclusive: 48,
      }],
      sourceFit: 'contain', panelBackground: '#000000',
      audioPolicy: 'preserve_source_sequence',
      captionOverlayPolicy: 'approved_full_frame_rgba',
    },
    sources: [{
      sourceSequenceItemId: 'approved-source-a', mimeType: 'video/mp4', bytes: sourceBytes,
      sha256: createHash('sha256').update(sourceBytes).digest('hex'),
    }, {
      sourceSequenceItemId: 'approved-source-b', mimeType: 'video/mp4', bytes: sourceBytes,
      sha256: createHash('sha256').update(sourceBytes).digest('hex'),
    }],
    captionOverlay: {
      mimeType: 'image/png', bytes: overlay.imageArtifact.bytes,
      sha256: overlay.imageArtifact.sha256,
    },
  })
  const sourceSequencePayload = sourceSequenceRequest.payload
  if (
    !('compositionProfileId' in sourceSequencePayload) ||
    sourceSequencePayload.compositionProfileId !== 'approved_source_sequence_caption_final_v1'
  ) throw new Error('Source-sequence smoke request compiled to the wrong profile.')
  assert.throws(() => validateOfflineRemotionRenderRequest({
    ...sourceSequenceRequest,
    payload: {
      ...sourceSequencePayload,
      sourceSegments: sourceSequencePayload.sourceSegments.map((segment, index) =>
        index === 1 ? { ...segment, timelineStartFrame: 23 } : segment),
    },
  }), /contiguous|duration|sequence/)
  const sourceSequenceResult = await reopened.execute(sourceSequenceRequest)
  assert.equal(sourceSequenceResult.artifact.bytes.subarray(4, 8).toString('ascii'), 'ftyp')
  assert.equal(sourceSequenceResult.artifact.durationFrames, 48)
  assert.equal(sourceSequenceResult.evidence.semanticEvidence.approvedSourceSequenceBytesVerified, true)
  assert.equal(sourceSequenceResult.evidence.semanticEvidence.approvedSourceSequenceTimelineApplied, true)
  assert.equal(sourceSequenceResult.evidence.semanticEvidence.sourceAudioPreservationRequested, true)
  const sourceSequenceProbe = await mediaRuntime.execute({
    schemaVersion: 'offline-media-binary-execution-v1', toolId: 'ffprobe',
    operationId: 'tool.ffprobe.inspect_approved_media.v1',
    payload: {
      inspectionProfileId: 'final_export_v1', countFrames: true,
      verifyDurationAndSync: true, emitMachineJsonOnly: true,
      mimeType: 'video/mp4', sourceByteLength: sourceSequenceResult.artifact.byteLength,
      sourceSha256: sourceSequenceResult.artifact.sha256,
      sourceBytesBase64: sourceSequenceResult.artifact.bytes.toString('base64'),
    },
  })
  assert.ok('resultJson' in sourceSequenceProbe)
  const sourceSequenceStreams = sourceSequenceProbe.resultJson.document.streams as Array<Record<string, unknown>>
  assert.equal(sourceSequenceStreams.find((stream) => stream.codecType === 'video')?.readFrameCount, 48)
  assert.equal(sourceSequenceStreams.find((stream) => stream.codecType === 'audio')?.codecName, 'aac')
} finally {
  await rm(fixtureRoot, { recursive: true, force: true })
}

console.log(JSON.stringify({
  smoke: 'offline_remotion_render_execution', status: 'passed',
  proofs: ['exact_operation_payload_validated', 'caller_paths_urls_commands_and_extra_fields_rejected', 'checksum_protected_runtime_authority_persisted_and_reopened', 'pinned_image_identity_verified', 'network_none_read_only_non_root_cap_drop_confinement_verified', 'actual_remotion_select_and_render_media_executed', 'mp4_hash_frame_timing_and_header_verified', 'independent_pinned_ffprobe_h264_frame_count_pixel_format_color_space_and_duration_qa_passed', 'server_injected_source_mp4_and_libass_png_hash_commitments_verified', 'approved_nonzero_source_trim_frames_applied', 'actual_source_plus_caption_final_composition_rendered', 'ordered_two_source_sequence_and_caption_final_composition_rendered', 'source_sequence_frame_ranges_and_audio_preserved', 'source_audio_preserved_as_aac', 'final_composition_paths_urls_commands_and_tampered_bytes_rejected', 'product_beta_production_readiness_remains_false'],
  artifact: { sha256: result.artifact.sha256, byteLength: result.artifact.byteLength, width: result.artifact.width, height: result.artifact.height, fps: result.artifact.fps, durationFrames: result.artifact.durationFrames },
}, null, 2))
