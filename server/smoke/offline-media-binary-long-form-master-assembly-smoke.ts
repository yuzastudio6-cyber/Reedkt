import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import {
  OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_OUTPUT_BYTES,
  activatePrivateOfflineMediaBinaryRuntime,
  buildOfflineMediaBinaryLongFormMasterAssemblyRequest,
} from '../tool-execution/media-binary-execution'

const root = await mkdtemp(join(tmpdir(), 'reeditpro-long-form-master-runtime-'))
try {
  const chunkPath = join(root, 'chunk.mkv')
  const audioPath = join(root, 'program.flac')
  const chunkFrames = 1_350
  const totalFrames = chunkFrames * 2
  const chunkBuild = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i', 'color=c=0x174EA6:s=3840x2160:r=30',
    '-frames:v', String(chunkFrames), '-an', '-c:v', 'libvpx-vp9',
    '-b:v', '0', '-crf', '32', '-deadline', 'realtime', '-cpu-used', '8',
    '-row-mt', '1', '-threads', '2', '-g', '240', '-lag-in-frames', '0',
    '-auto-alt-ref', '0', '-pix_fmt', 'yuv420p', '-color_range', 'tv',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-fflags', '+bitexact', '-map_metadata', '-1', '-f', 'matroska',
    '-y', chunkPath,
  ], { encoding: 'utf8' })
  assert.equal(chunkBuild.status, 0, chunkBuild.stderr)
  const audioBuild = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 'lavfi',
    '-i', `sine=frequency=440:sample_rate=48000:duration=${totalFrames / 30}`,
    '-af', 'aformat=sample_fmts=s32:sample_rates=48000:channel_layouts=stereo',
    '-c:a', 'flac', '-sample_fmt', 's32', '-bits_per_raw_sample', '24',
    '-map_metadata', '-1', '-f', 'flac', '-y', audioPath,
  ], { encoding: 'utf8' })
  assert.equal(audioBuild.status, 0, audioBuild.stderr)
  const chunkBytes = await readFile(chunkPath)
  const audioBytes = await readFile(audioPath)
  const chunkSha256 = sha256(chunkBytes)
  const audioSha256 = sha256(audioBytes)
  const request = buildOfflineMediaBinaryLongFormMasterAssemblyRequest({
    planningPayload: {
      recipeProfileId: 'approved_long_form_vp9_flac_matroska_master_v1',
      assemblyAuthorityHash: 'a'.repeat(64),
      expectedObjectIdentity: 'bounded-private-long-form-master',
      width: 3_840, height: 2_160, fps: 30, totalFrames,
      chunks: [1, 2].map((chunkIndex) => ({
        chunkId: `bounded-chunk-${chunkIndex}`,
        chunkIndex, chunkCount: 2,
        globalStartFrame: (chunkIndex - 1) * chunkFrames,
        globalEndFrameExclusive: chunkIndex * chunkFrames,
        durationFrames: chunkFrames,
        objectIdentity: `bounded-object-${chunkIndex}`,
        boundaryBefore: chunkIndex === 1
          ? 'timeline_start' as const
          : 'approved_hard_cut' as const,
      })),
      crossChunkColorValidationHash: 'b'.repeat(64),
      continuousProgramAudioQaHash: 'c'.repeat(64),
      videoAssemblyPolicy: 'ordered_vp9_object_chunk_stream_copy_v1',
      audioAssemblyPolicy: 'continuous_flac_program_audio_stream_copy_v1',
      timestampPolicy: 'normalize_from_zero_preserve_frame_and_sample_time_v1',
      compatibilityPolicy: 'exact_vp9_bt709_4k_30fps_and_flac_48k_stereo_v1',
      outputContainer: 'matroska', outputVideoCodec: 'copy_vp9',
      outputAudioCodec: 'copy_flac',
      renderPurpose: 'private_4k_long_form_review_master_v1',
      usesApprovedEditReservation: true, requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false, mediaReencodingAllowed: false,
    },
    chunks: [1, 2].map((chunkIndex) => ({
      inputId: `bounded-chunk-input-${chunkIndex}`,
      chunkId: `bounded-chunk-${chunkIndex}`, chunkIndex,
      objectIdentity: `bounded-object-${chunkIndex}`,
      mimeType: 'video/x-matroska', byteLength: chunkBytes.byteLength,
      sha256: chunkSha256,
    })),
    programAudio: {
      inputId: 'bounded-program-audio-input',
      objectIdentity: 'bounded-program-audio-object', mimeType: 'audio/flac',
      byteLength: audioBytes.byteLength, sha256: audioSha256,
    },
  })
  const runtime = await activatePrivateOfflineMediaBinaryRuntime()
  let persistedBytes: Buffer | undefined
  const result = await runtime.executeLongFormMasterAssemblyServerInjected(
    request,
    {
      chunks: [chunkBytes, chunkBytes].map((bytes) => ({
        inputMode: 'private_verified_stream_v1' as const,
        byteLength: bytes.byteLength, sha256: sha256(bytes),
        async openStream() { return Readable.from(bytes) },
      })),
      programAudio: {
        inputMode: 'private_verified_stream_v1',
        byteLength: audioBytes.byteLength, sha256: audioSha256,
        async openStream() { return Readable.from(audioBytes) },
      },
    },
    {
      maximumBytes: OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_OUTPUT_BYTES,
      async persist(input) {
        const chunks: Buffer[] = []
        for await (const chunk of input.stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        }
        persistedBytes = Buffer.concat(chunks)
        assert.equal(persistedBytes.byteLength, input.expectedByteLength)
        assert.equal(sha256(persistedBytes), input.expectedSha256)
        assert.equal(input.mimeType, 'video/x-matroska')
        return { byteLength: persistedBytes.byteLength, sha256: sha256(persistedBytes) }
      },
    },
  )
  assert.ok(persistedBytes && persistedBytes.byteLength > 1_024)
  assert.equal(result.resultArtifact.sha256, sha256(persistedBytes))
  assert.equal(result.evidence.semanticEvidence.videoOrAudioReencoded, false)
  assert.equal(result.evidence.semanticEvidence.chunkCount, 2)
  assert.equal(result.image.longFormMasterAssembly,
    'private_vp9_flac_matroska_stream_copy_only')
  assert.equal(result.readiness.productReady, false)
  assert.equal(result.readiness.productionReady, false)
  console.log(JSON.stringify({
    ok: true, totalFrames, chunkCount: 2,
    chunkByteLength: chunkBytes.byteLength,
    programAudioByteLength: audioBytes.byteLength,
    masterByteLength: result.resultArtifact.byteLength,
    masterSha256: result.resultArtifact.sha256,
    imageIdentityHash: result.image.imageIdentityHash,
    videoReencoded: false, audioReencoded: false,
    productReady: false, productionReady: false,
  }, null, 2))
} finally {
  await rm(root, { recursive: true, force: true })
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
