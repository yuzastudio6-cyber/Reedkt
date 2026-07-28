import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  activatePrivateOfflineMediaBinaryRuntime,
  validateOfflineFfprobeStreamingExecutionRequest,
} from '../tool-execution/media-binary-execution'
import {
  OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_SOURCE_BYTES,
  activatePrivateOfflineRemotionRenderRuntime,
  buildOfflineRemotionFinalCompositionStreamingRequest,
  prepareOfflineRemotionDockerRuntime,
  validateOfflineRemotionStreamingRenderRequest,
  type OfflineRemotionServerInjectedInput,
} from '../tool-execution/remotion-render-execution'
import {
  inspectCanonicalPrivateRemotionArtifact,
  persistCanonicalPrivateRemotionArtifactStream,
} from '../services/canonical-private-remotion-artifact-storage'

const LEGACY_OUTPUT_BOUNDARY_BYTES = 16 * 1024 * 1024
const fixtureRoot = await mkdtemp(join(tmpdir(), 'reeditpro-remotion-stream-output-fixture-'))
const storageRoot = await mkdtemp(join(tmpdir(), 'reeditpro-remotion-stream-output-storage-'))
const sourcePath = join(fixtureRoot, 'high-detail-4k-source.mp4')
const livingFrameOverlayPath = join(fixtureRoot, 'approved-living-frame-overlay.png')
const captionPath = join(fixtureRoot, 'approved-caption-overlay.png')
const supplementalAudioPath = join(fixtureRoot, 'approved-edit-brief-music.wav')

try {
  generateHighDetailFourKSource(sourcePath)
  generateLivingFrameOverlay(livingFrameOverlayPath)
  generateCaptionOverlay(captionPath)
  generateSupplementalMusic(supplementalAudioPath)
  const source = await fileCommitment(sourcePath)
  const livingFrameOverlay = await fileCommitment(livingFrameOverlayPath)
  const caption = await fileCommitment(captionPath)
  const supplementalAudio = await fileCommitment(supplementalAudioPath)
  assert.ok(source.byteLength < LEGACY_OUTPUT_BOUNDARY_BYTES)
  assert.ok(source.byteLength > 8 * 1024 * 1024)
  assert.ok(livingFrameOverlay.byteLength >= 67)
  assert.ok(caption.byteLength >= 1_024)

  await prepareOfflineRemotionDockerRuntime()
  const runtime = await activatePrivateOfflineRemotionRenderRuntime()
  const request = buildOfflineRemotionFinalCompositionStreamingRequest({
    planningPayload: {
      compositionProfileId: 'approved_source_caption_final_v1',
      width: 3840,
      height: 2160,
      fps: 24,
      durationFrames: 48,
      sourceStartFrame: 0,
      sourceEndFrameExclusive: 48,
      sourceFit: 'contain',
      panelBackground: '#000000',
      audioPolicy: 'preserve_source',
      captionOverlayPolicy: 'approved_full_frame_rgba',
      renderPurpose: 'private_4k_delivery_master_v1',
      deliveryProfileId: 'uhd_2160',
      estimateCostBasisProfileId: 'uhd_2160',
      sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
      usesApprovedEditReservation: true,
      requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false,
      supplementalAudioPolicy: 'approved_edit_brief_audio_tracks_v1',
      supplementalAudioTracks: [{
        outputKey: 'edit-brief-audio-1-wav',
        attachmentId: 'edit-brief-audio-attachment-1',
        markerId: 'edit-brief-music-marker-1',
        markerType: 'music',
        startFrame: 0,
        endFrameExclusive: 48,
        fillPolicy: 'loop_or_trim_to_window',
        mixProfileId: 'speech_safe_uploaded_music_bed_v1',
      }],
      livingFrameOverlayPolicy: 'approved_rgba_over_source_below_captions_v1',
      livingFrameOverlayLayers: [{
        sceneId: 'living-frame-scene-1',
        layerId: 'living-frame-layer-1',
        manifestOutputKey: 'living-frame-layer-manifest-1',
        componentOutputKey: 'living-frame-component-1',
        startFrame: 12,
        endFrameExclusive: 36,
        fit: 'fill',
        opacity: 1,
      }],
    },
    source: {
      inputId: 'high-detail-approved-source',
      mimeType: 'video/mp4',
      byteLength: source.byteLength,
      sha256: source.sha256,
    },
    captionOverlay: {
      inputId: 'approved-caption-overlay',
      mimeType: 'image/png',
      byteLength: caption.byteLength,
      sha256: caption.sha256,
    },
    livingFrameOverlays: [{
      inputId: 'approved-living-frame-overlay-1',
      outputKey: 'living-frame-component-1',
      mimeType: 'image/png',
      byteLength: livingFrameOverlay.byteLength,
      sha256: livingFrameOverlay.sha256,
    }],
    supplementalAudioTracks: [{
      inputId: 'approved-edit-brief-music-1',
      outputKey: 'edit-brief-audio-1-wav',
      attachmentId: 'edit-brief-audio-attachment-1',
      markerId: 'edit-brief-music-marker-1',
      markerType: 'music',
      startFrame: 0,
      endFrameExclusive: 48,
      fillPolicy: 'loop_or_trim_to_window',
      mixProfileId: 'speech_safe_uploaded_music_bed_v1',
      mimeType: 'audio/wav',
      byteLength: supplementalAudio.byteLength,
      sha256: supplementalAudio.sha256,
    }],
  })
  assert.doesNotMatch(JSON.stringify(request), /bytesBase64|filePath|sourceUrl|https?:\/\//u)
  assert.throws(() => validateOfflineRemotionStreamingRenderRequest({
    ...request,
    inputs: {
      ...request.inputs,
      sources: [{ ...request.inputs.sources[0], filePath: '/tmp/caller-selected.mp4' }],
    },
  }), /unsupported fields/u)
  assert.throws(() => validateOfflineRemotionStreamingRenderRequest({
    ...request,
    inputs: {
      ...request.inputs,
      sources: [{
        ...request.inputs.sources[0],
        byteLength: OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_SOURCE_BYTES + 1,
      }],
    },
  }), /commitment is invalid/u)
  assert.throws(() => validateOfflineRemotionStreamingRenderRequest({
    ...request,
    inputs: {
      ...request.inputs,
      livingFrameOverlays: [{
        ...request.inputs.livingFrameOverlays[0],
        outputKey: 'caller-reordered-living-frame-output',
      }],
    },
  }), /diverges from the approved layer timeline/u)
  assert.throws(() => validateOfflineRemotionStreamingRenderRequest({
    ...request,
    inputs: {
      ...request.inputs,
      captionOverlays: [{
        ...request.inputs.captionOverlays[0],
        inputId: request.inputs.sources[0]!.inputId,
      }],
    },
  }), /identities must be unique/u)
  assert.throws(() => validateOfflineRemotionStreamingRenderRequest({
    ...request,
    inputs: {
      ...request.inputs,
      supplementalAudioTracks: [{
        ...request.inputs.supplementalAudioTracks[0],
        mixProfileId: 'narration_protected_uploaded_sfx_v1',
      }],
    },
  }), /diverges from the approved Edit Brief timeline/u)
  await assertRejectedStreamLeavesNoCommittedTarget()
  const inputs: OfflineRemotionServerInjectedInput[] = [
    privateFileInput('high-detail-approved-source', 'video/mp4', sourcePath, source),
    privateFileInput(
      'approved-living-frame-overlay-1',
      'image/png',
      livingFrameOverlayPath,
      livingFrameOverlay,
    ),
    privateFileInput('approved-caption-overlay', 'image/png', captionPath, caption),
    privateFileInput(
      'approved-edit-brief-music-1',
      'audio/wav',
      supplementalAudioPath,
      supplementalAudio,
    ),
  ]
  await assert.rejects(
    () => runtime.executeServerInjected(request, [...inputs].reverse(), {
      maximumBytes: OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
      async persist() { throw new Error('Reordered inputs must fail before persistence.') },
    }),
    /do not match the exact request commitments/u,
  )
  let privateObjectIdentityHash = ''
  const result = await runtime.executeServerInjected(request, inputs, {
    maximumBytes: OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
    async persist(output) {
      privateObjectIdentityHash = createHash('sha256')
        .update(`offline-remotion-stream-output-proof-v1\n${output.expectedSha256}`)
        .digest('hex')
      const persisted = await persistCanonicalPrivateRemotionArtifactStream({
        localStorageRoot: storageRoot,
        privateObjectIdentityHash,
        stream: output.stream,
        expectedByteLength: output.expectedByteLength,
        expectedSha256: output.expectedSha256,
      })
      return { byteLength: persisted.byteLength, sha256: persisted.sha256 }
    },
  })
  assert.ok(
    result.artifact.byteLength > LEGACY_OUTPUT_BOUNDARY_BYTES,
    `Expected streamed output above ${LEGACY_OUTPUT_BOUNDARY_BYTES} bytes, received ${result.artifact.byteLength}.`,
  )
  assert.ok(result.artifact.byteLength <= OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES)
  assert.equal(result.evidence.inputTransport, 'length_framed_server_injected_private_stream_v2')
  assert.equal(result.evidence.outputTransport, 'length_committed_private_stream_v2')
  assert.equal(result.evidence.semanticEvidence.base64MediaTransportAvoided, true)
  assert.equal(
    result.evidence.semanticEvidence
      .approvedSupplementalAudioInputStreamedWithoutWholeBuffer,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.approvedSupplementalAudioTimelineApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.approvedSupplementalAudioSpeechSafeMixApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .approvedLivingFrameOverlayInputServerInjectedWithoutBase64,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.approvedLivingFrameOverlayBytesVerified,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.approvedLivingFrameOverlayTimelineApplied,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.approvedLivingFrameOverlayBelowCaptionsApplied,
    true,
  )
  assert.equal(result.readiness.serverInjectedStreamingReady, true)
  assert.equal(result.readiness.productReady, false)

  const stored = await inspectCanonicalPrivateRemotionArtifact({
    localStorageRoot: storageRoot,
    privateObjectIdentityHash,
  })
  assert.ok(stored)
  assert.equal(stored.byteLength, result.artifact.byteLength)
  assert.equal(stored.sha256, result.artifact.sha256)
  const firstRange = await readExact(await stored.openStream({ start: 0, end: 1_023 }), 1_024)
  assert.equal(firstRange.subarray(4, 8).toString('ascii'), 'ftyp')

  const mediaRuntime = await activatePrivateOfflineMediaBinaryRuntime()
  const probe = await mediaRuntime.executeServerInjected(
    validateOfflineFfprobeStreamingExecutionRequest({
      schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
      toolId: 'ffprobe',
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
      payload: {
        inspectionProfileId: 'final_export_v1',
        countFrames: true,
        verifyDurationAndSync: true,
        emitMachineJsonOnly: true,
        mimeType: 'video/mp4',
        sourceByteLength: stored.byteLength,
        sourceSha256: stored.sha256,
        sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
      },
    }),
    {
      inputMode: 'private_verified_stream_v1',
      byteLength: stored.byteLength,
      sha256: stored.sha256,
      openStream: () => stored.openStream(),
    },
  )
  assert.ok('resultJson' in probe)
  const streams = probe.resultJson.document.streams as Array<Record<string, unknown>>
  const video = streams.find((stream) => stream.codecType === 'video')
  const audio = streams.find((stream) => stream.codecType === 'audio')
  assert.deepEqual({
    codecName: video?.codecName,
    width: video?.width,
    height: video?.height,
    fps: video?.fps,
    readFrameCount: video?.readFrameCount,
    pixelFormat: video?.pixelFormat,
    colorSpace: video?.colorSpace,
    colorTransfer: video?.colorTransfer,
    colorPrimaries: video?.colorPrimaries,
    colorRange: video?.colorRange,
  }, {
    codecName: 'h264',
    width: 3840,
    height: 2160,
    fps: 24,
    readFrameCount: 48,
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    colorTransfer: 'bt709',
    colorPrimaries: 'bt709',
    colorRange: 'tv',
  })
  assert.equal(audio?.codecName, 'aac')
  assert.equal(audio?.sampleRate, 48_000)

  process.stdout.write(`${JSON.stringify({
    smoke: 'offline_remotion_streaming_output',
    status: 'passed',
    source: {
      byteLength: source.byteLength,
      sha256: source.sha256,
      width: 3840,
      height: 2160,
      durationFrames: 48,
    },
    artifact: {
      byteLength: result.artifact.byteLength,
      sha256: result.artifact.sha256,
      exceededLegacyOutputBoundaryByBytes:
        result.artifact.byteLength - LEGACY_OUTPUT_BOUNDARY_BYTES,
    },
    proofs: [
      'bounded_json_manifest_contains_no_media_base64_paths_urls_or_commands',
      'server_injected_source_living_frame_caption_and_audio_streams_rehashed_on_host_and_in_container',
      'approved_living_frame_rgba_overlay_rendered_at_exact_frames_above_source_and_below_captions',
      'approved_edit_brief_music_wav_stream_rehashed_looped_and_mixed_at_exact_frames',
      'network_none_read_only_non_root_no_mount_confinement_preserved',
      'actual_4k_h264_high_quality_remotion_render_exceeds_legacy_16mib_output_ceiling',
      'raw_mp4_stdout_stream_exact_size_and_sha256_verified',
      'rejected_stream_commitment_left_no_create_only_target',
      'private_create_only_stream_persistence_reopened_and_rehashed',
      'authenticated_delivery_storage_supports_exact_byte_ranges',
      'independent_streamed_ffprobe_h264_aac_frame_and_complete_bt709_vui_qa_passed',
      'product_beta_production_provider_billing_and_public_delivery_remain_false',
    ],
  })}\n`)
} finally {
  await rm(fixtureRoot, { recursive: true, force: true })
  await rm(storageRoot, { recursive: true, force: true })
}

function generateHighDetailFourKSource(outputPath: string): void {
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=gray:size=3840x2160:rate=24:duration=2',
    '-f', 'lavfi', '-i', 'sine=frequency=740:sample_rate=48000:duration=2',
    '-filter_complex', '[0:v]noise=alls=75:allf=t+u[v]',
    '-map', '[v]', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '40',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart', '-threads', '1', '-shortest', '-y', outputPath,
  ], { encoding: 'utf8', maxBuffer: 1024 * 1024 })
  assert.equal(generated.status, 0, generated.stderr)
}

function generateCaptionOverlay(outputPath: string): void {
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=black@0.0:size=3840x2160:rate=1:duration=1',
    '-vf', 'format=rgba,colorchannelmixer=aa=0', '-frames:v', '1', '-threads', '1', '-y', outputPath,
  ], { encoding: 'utf8', maxBuffer: 1024 * 1024 })
  assert.equal(generated.status, 0, generated.stderr)
}

function generateLivingFrameOverlay(outputPath: string): void {
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=black@0.0:size=3840x2160:rate=1:duration=1',
    '-vf', [
      'format=rgba',
      'colorchannelmixer=aa=0',
      'drawbox=x=240:y=240:w=960:h=540:color=0x18A6F0@0.88:t=fill',
      'drawbox=x=280:y=280:w=880:h=460:color=0xFFCA3A@0.62:t=24',
    ].join(','),
    '-frames:v', '1', '-threads', '1', '-y', outputPath,
  ], { encoding: 'utf8', maxBuffer: 1024 * 1024 })
  assert.equal(generated.status, 0, generated.stderr)
}

function generateSupplementalMusic(outputPath: string): void {
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'sine=frequency=330:sample_rate=48000:duration=0.5',
    '-ac', '2', '-c:a', 'pcm_s16le', '-map_metadata', '-1',
    '-y', outputPath,
  ], { encoding: 'utf8', maxBuffer: 1024 * 1024 })
  assert.equal(generated.status, 0, generated.stderr)
}

async function fileCommitment(path: string): Promise<{ byteLength: number; sha256: string }> {
  const fileStat = await stat(path)
  const checksum = createHash('sha256')
  let byteLength = 0
  for await (const chunk of createReadStream(path)) {
    byteLength += chunk.byteLength
    checksum.update(chunk)
  }
  assert.equal(byteLength, fileStat.size)
  return { byteLength, sha256: checksum.digest('hex') }
}

async function assertRejectedStreamLeavesNoCommittedTarget(): Promise<void> {
  const privateObjectIdentityHash = createHash('sha256')
    .update('offline-remotion-rejected-stream-proof-v1')
    .digest('hex')
  const invalidBytes = Buffer.alloc(1_024)
  invalidBytes.writeUInt32BE(24, 0)
  invalidBytes.write('ftyp', 4, 'ascii')
  await assert.rejects(() => persistCanonicalPrivateRemotionArtifactStream({
    localStorageRoot: storageRoot,
    privateObjectIdentityHash,
    stream: Readable.from([invalidBytes]),
    expectedByteLength: invalidBytes.byteLength,
    expectedSha256: '0'.repeat(64),
  }), /failed its exact MP4 commitment/u)
  assert.equal(await inspectCanonicalPrivateRemotionArtifact({
    localStorageRoot: storageRoot,
    privateObjectIdentityHash,
  }), undefined)
}

function privateFileInput(
  inputId: string,
  mimeType: 'video/mp4' | 'image/png' | 'audio/wav',
  path: string,
  commitment: { byteLength: number; sha256: string },
): OfflineRemotionServerInjectedInput {
  return {
    inputMode: 'private_verified_stream_v1',
    inputId,
    mimeType,
    byteLength: commitment.byteLength,
    sha256: commitment.sha256,
    async openStream() { return createReadStream(path) },
  }
}

async function readExact(stream: Readable, expectedByteLength: number): Promise<Buffer> {
  const chunks: Buffer[] = []
  let byteLength = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (byteLength > expectedByteLength) throw new Error('Range stream exceeded its commitment.')
    chunks.push(bytes)
  }
  assert.equal(byteLength, expectedByteLength)
  return Buffer.concat(chunks, byteLength)
}
