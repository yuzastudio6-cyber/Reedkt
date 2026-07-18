import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import {
  activatePrivateOfflineMediaBinaryRuntime,
  buildOfflineMediaBinaryObjectMezzanineChunkRequest,
  OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_RECIPE,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
} from '../tool-execution/media-binary-execution'

const width = 2160 as const
const height = 2160 as const
const fps = 30 as const
const sliceFrames = 675
const durationFrames = sliceFrames * 2
const sourcePaths = [
  join('/tmp', `reeditpro-object-chunk-source-1-${process.pid}.mp4`),
  join('/tmp', `reeditpro-object-chunk-source-2-${process.pid}.mp4`),
]
const colors = ['0x174EA6', '0xB3261E']

try {
  for (const [index, path] of sourcePaths.entries()) {
    const generated = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error',
      '-f', 'lavfi', '-i',
      `color=c=${colors[index]}:s=${width}x${height}:r=${fps}`,
      '-frames:v', String(sliceFrames),
      '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
      '-x264-params',
      `keyint=${sliceFrames}:min-keyint=${sliceFrames}:scenecut=0:open-gop=0:colorprim=bt709:transfer=bt709:colormatrix=bt709`,
      '-bf', '0', '-pix_fmt', 'yuv420p', '-color_range', 'tv',
      '-colorspace', 'bt709', '-color_primaries', 'bt709',
      '-color_trc', 'bt709', '-an', '-movflags', '+faststart',
      '-threads', '1', '-y', path,
    ], { encoding: 'utf8' })
    assert.equal(generated.status, 0, generated.stderr)
  }
  const sourceBytes = await Promise.all(sourcePaths.map((path) => readFile(path)))
  const sha256 = (bytes: Buffer) =>
    createHash('sha256').update(bytes).digest('hex')
  assert.notEqual(sha256(sourceBytes[0]!), sha256(sourceBytes[1]!))
  const sourceCommitments = sourceBytes.map((bytes, index) => ({
    inputId: `approved-source-${index + 1}`,
    sourceSequenceItemId: `object-source-${index + 1}`,
    mediaAssetId: `object-media-${index + 1}`,
    sourceObjectGeneration: String(index + 1),
    mimeType: 'video/mp4' as const,
    byteLength: bytes.byteLength,
    sha256: sha256(bytes),
  }))
  const chunkAuthorityHash = sha256(Buffer.from('object-chunk-authority'))
  const expectedObjectIdentity = sha256(Buffer.from('object-chunk-object'))
  const request = buildOfflineMediaBinaryObjectMezzanineChunkRequest({
    planningPayload: {
      recipeProfileId: OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_RECIPE,
      chunkId: 'long-form-object-chunk-fixture',
      chunkAuthorityHash,
      expectedObjectIdentity,
      chunkIndex: 1,
      chunkCount: 2,
      width,
      height,
      fps,
      durationFrames,
      globalStartFrame: 0,
      globalEndFrameExclusive: durationFrames,
      sourceSlices: sourceCommitments.map((source, index) => ({
        sliceIndex: index + 1,
        segmentId: `object-segment-${index + 1}`,
        sourceSequenceItemId: source.sourceSequenceItemId,
        mediaAssetId: source.mediaAssetId,
        sourceObjectGeneration: source.sourceObjectGeneration,
        sourceSha256: source.sha256,
        sourceCleanupDecisionId: `cleanup-object-source-${index + 1}`,
        sourceStartFrame: 0,
        sourceEndFrameExclusive: sliceFrames,
        globalTimelineStartFrame: index * sliceFrames,
        globalTimelineEndFrameExclusive: (index + 1) * sliceFrames,
        chunkLocalStartFrame: index * sliceFrames,
        chunkLocalEndFrameExclusive: (index + 1) * sliceFrames,
        boundaryBefore: index === 0
          ? 'timeline_start' as const
          : 'approved_hard_cut' as const,
      })),
      videoAssemblyPolicy: 'compatible_h264_mp4_slice_concat_stream_copy_v1',
      audioPolicy: 'separate_continuous_program_audio_v1',
      codecCompatibilityPolicy: 'exact_h264_extradata_frame_color_v1',
      timestampPolicy: 'normalize_from_zero',
      outputContainer: 'matroska',
      outputVideoCodec: 'copy_h264',
      outputPixelFormat: 'yuv420p',
      outputColorSpace: 'bt709',
      renderPurpose: 'private_4k_object_mezzanine_chunk_v1',
      sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
      usesApprovedEditReservation: true,
      requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false,
    },
    sources: sourceCommitments,
  })
  const privateInputs = sourceBytes.map((bytes) => Object.freeze({
    inputMode: 'private_verified_stream_v1' as const,
    byteLength: bytes.byteLength,
    sha256: sha256(bytes),
    async openStream() { return Readable.from([bytes]) },
  }))
  let outputBytes = Buffer.alloc(0)
  const runtime = await activatePrivateOfflineMediaBinaryRuntime()
  const result = await runtime.executeObjectMezzanineChunkServerInjected(
    request,
    privateInputs,
    {
      maximumBytes:
        OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES,
      async persist(input) {
        assert.equal(input.mimeType, 'video/x-matroska')
        const chunks: Buffer[] = []
        for await (const chunk of input.stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        }
        outputBytes = Buffer.concat(chunks)
        assert.equal(outputBytes.byteLength, input.expectedByteLength)
        assert.equal(sha256(outputBytes), input.expectedSha256)
        return {
          byteLength: outputBytes.byteLength,
          sha256: sha256(outputBytes),
        }
      },
    },
  )
  assert.deepEqual([...outputBytes.subarray(0, 4)], [0x1a, 0x45, 0xdf, 0xa3])
  assert.equal(result.resultArtifact.sha256, sha256(outputBytes))
  assert.equal(result.resultArtifact.byteLength, outputBytes.byteLength)
  assert.equal(result.evidence.sourceSha256s.length, 2)
  assert.equal(result.evidence.confinement.networkMode, 'none')
  assert.equal(
    result.evidence.confinement.serverOwnedEntrypoint,
    '/usr/local/bin/reeditpro-ffmpeg-object-mezzanine-chunk',
  )
  assert.equal(
    result.evidence.semanticEvidence
      .h264VideoStreamCopiedWithoutDecodeOrReencode,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence
      .h264Mp4SliceConcatCompatibilityVerified,
    true,
  )
  assert.equal(result.evidence.semanticEvidence.outputAudioStreams, 0)
  assert.equal(result.readiness.productReady, false)
  assert.equal(
    result.image.objectMezzanineChunk,
    'private_first_chunk_stream_copy_only',
  )

  let repeatedOutputBytes = Buffer.alloc(0)
  const repeated = await runtime.executeObjectMezzanineChunkServerInjected(
    request,
    privateInputs,
    {
      maximumBytes:
        OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES,
      async persist(input) {
        const chunks: Buffer[] = []
        for await (const chunk of input.stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        }
        repeatedOutputBytes = Buffer.concat(chunks)
        return {
          byteLength: repeatedOutputBytes.byteLength,
          sha256: sha256(repeatedOutputBytes),
        }
      },
    },
  )
  assert.equal(repeated.resultArtifact.sha256, result.resultArtifact.sha256)
  assert.equal(repeated.resultArtifact.byteLength, result.resultArtifact.byteLength)
  assert.deepEqual(repeatedOutputBytes, outputBytes)

  const independentQa = await runtime.executeServerInjected({
    schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
    toolId: 'ffprobe',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
    payload: {
      inspectionProfileId: 'object_mezzanine_chunk_qa_v1',
      countFrames: true,
      verifyDurationAndSync: true,
      emitMachineJsonOnly: true,
      mimeType: 'video/x-matroska',
      sourceByteLength: outputBytes.byteLength,
      sourceSha256: sha256(outputBytes),
      sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
    },
  }, {
    inputMode: 'private_verified_stream_v1',
    byteLength: outputBytes.byteLength,
    sha256: sha256(outputBytes),
    async openStream() { return Readable.from([outputBytes]) },
  })
  const streams = independentQa.resultJson.document.streams as
    Array<Record<string, unknown>>
  const video = streams.find((stream) => stream.codecType === 'video')
  assert.equal(streams.length, 1)
  assert.equal(video?.codecName, 'h264')
  assert.equal(video?.width, width)
  assert.equal(video?.height, height)
  assert.equal(video?.fps, fps)
  assert.equal(video?.readFrameCount, durationFrames)
  assert.equal(video?.colorSpace, 'bt709')

  assert.throws(() => buildOfflineMediaBinaryObjectMezzanineChunkRequest({
    planningPayload: {
      ...request.payload,
      command: 'ffmpeg -i caller.mp4',
    },
    sources: request.inputs.sources,
  }))
  await assert.rejects(() =>
    runtime.executeObjectMezzanineChunkServerInjected(
      request,
      [{ ...privateInputs[0]!, sha256: 'f'.repeat(64) }, privateInputs[1]!],
      {
        maximumBytes:
          OFFLINE_MEDIA_BINARY_OBJECT_MEZZANINE_CHUNK_MAXIMUM_OUTPUT_BYTES,
        async persist() { throw new Error('tampered input must not persist') },
      },
    ))

  console.log(JSON.stringify({
    ok: true,
    schemaVersion: 'offline-media-binary-object-mezzanine-chunk-smoke-v1',
    sourceCount: sourceBytes.length,
    sourceSliceCount: request.payload.sourceSlices.length,
    durationFrames,
    outputByteLength: outputBytes.byteLength,
    outputSha256: sha256(outputBytes),
    independentQaSha256: independentQa.resultJson.sha256,
    deterministicByteReexecutionVerified: true,
    productReady: false,
    productionReady: false,
  }, null, 2))
} finally {
  await Promise.all(sourcePaths.map((path) => rm(path, { force: true })))
}
