import assert from 'node:assert/strict'

import { ApiError } from '../errors/api-error'
import {
  OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_CHUNKS,
  OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_OUTPUT_BYTES,
  buildOfflineMediaBinaryLongFormMasterAssemblyRequest,
  offlineMediaBinaryLongFormMasterAssemblyRequestSha256,
} from '../tool-execution/media-binary-execution'

const hash = (character: string) => character.repeat(64)

const two = build(2, [2_000, 1_870])
assert.equal(two.payload.totalFrames, 3_870)
assert.equal(two.payload.chunks.length, 2)
assert.equal(two.inputs.chunks.length, 2)
assert.equal(two.inputs.programAudio.mimeType, 'audio/flac')
assert.match(offlineMediaBinaryLongFormMasterAssemblyRequestSha256(two), /^[a-f0-9]{64}$/u)

const maximumDurations = Array.from(
  { length: OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_CHUNKS },
  (_, index) => index < 32 ? 5_300 : 5_200,
)
const maximum = build(OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_CHUNKS,
  maximumDurations)
assert.equal(maximum.payload.totalFrames, 648_000)
assert.equal(maximum.payload.chunks.length, 124)
assert.equal(OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_OUTPUT_BYTES,
  70 * 1024 * 1024 * 1024)

await rejects(() => build(2, [2_000, 1_870], {
  callerCommand: ['ffmpeg', '-i', '/tmp/untrusted'],
}), 'VALIDATION_FAILED')
await rejects(() => build(2, [2_000, 1_870], undefined, {
  chunkIndex: 2,
}), 'VALIDATION_FAILED')
await rejects(() => build(2, [2_000, 1_870], undefined, undefined, {
  requiresSeparateExportEstimate: true,
}), 'VALIDATION_FAILED')

console.log(JSON.stringify({
  ok: true,
  schemaVersion: two.schemaVersion,
  boundedChunkCount: two.payload.chunks.length,
  capacityChunkCount: maximum.payload.chunks.length,
  capacityFrames: maximum.payload.totalFrames,
  maximumOutputBytes: OFFLINE_MEDIA_BINARY_LONG_FORM_MASTER_MAXIMUM_OUTPUT_BYTES,
  checks: [
    'two_chunk_exact_contiguous_plan',
    '124_chunk_648000_frame_capacity',
    'vp9_flac_stream_copy_only',
    'caller_command_rejected',
    'chunk_order_tamper_rejected',
    'second_export_estimate_rejected',
  ],
}))

function build(
  chunkCount: number,
  durations: number[],
  extra?: Record<string, unknown>,
  commitmentPatch?: Record<string, unknown>,
  planningPatch?: Record<string, unknown>,
) {
  let start = 0
  const chunks = durations.map((duration, index) => {
    const value = {
      chunkId: `long-form-object-chunk-${index + 1}`,
      chunkIndex: index + 1,
      chunkCount,
      globalStartFrame: start,
      globalEndFrameExclusive: start + duration,
      durationFrames: duration,
      objectIdentity: `object-${index + 1}`,
      boundaryBefore: index === 0
        ? 'timeline_start' as const
        : 'approved_hard_cut' as const,
    }
    start += duration
    return value
  })
  return buildOfflineMediaBinaryLongFormMasterAssemblyRequest({
    planningPayload: {
      recipeProfileId: 'approved_long_form_vp9_flac_matroska_master_v1',
      assemblyAuthorityHash: hash('a'),
      expectedObjectIdentity: 'private-long-form-master',
      width: 3_840, height: 2_160, fps: 30, totalFrames: start, chunks,
      crossChunkColorValidationHash: hash('b'),
      continuousProgramAudioQaHash: hash('c'),
      videoAssemblyPolicy: 'ordered_vp9_object_chunk_stream_copy_v1',
      audioAssemblyPolicy: 'continuous_flac_program_audio_stream_copy_v1',
      timestampPolicy: 'normalize_from_zero_preserve_frame_and_sample_time_v1',
      compatibilityPolicy: 'exact_vp9_bt709_4k_30fps_and_flac_48k_stereo_v1',
      outputContainer: 'matroska', outputVideoCodec: 'copy_vp9',
      outputAudioCodec: 'copy_flac',
      renderPurpose: 'private_4k_long_form_review_master_v1',
      usesApprovedEditReservation: true, requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false, mediaReencodingAllowed: false,
      ...planningPatch,
      ...extra,
    },
    chunks: chunks.map((chunk, index) => ({
      inputId: `chunk-input-${index + 1}`,
      chunkId: chunk.chunkId,
      chunkIndex: chunk.chunkIndex,
      objectIdentity: chunk.objectIdentity,
      mimeType: 'video/x-matroska' as const,
      byteLength: 1_024 + index,
      sha256: hash((index % 10).toString()),
      ...(index === 0 ? commitmentPatch : undefined),
    })),
    programAudio: {
      inputId: 'program-audio-input', objectIdentity: 'program-audio-object',
      mimeType: 'audio/flac', byteLength: 8_192, sha256: hash('f'),
    },
  })
}

async function rejects(action: () => unknown, code: string) {
  await assert.rejects(async () => action(), (error: unknown) => {
    assert(error instanceof ApiError)
    assert.equal(error.code, code)
    return true
  })
}
