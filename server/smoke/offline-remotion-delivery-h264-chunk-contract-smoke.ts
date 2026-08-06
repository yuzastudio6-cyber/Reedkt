import assert from 'node:assert/strict'

import {
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RECIPE,
  buildOfflineRemotionDeliveryH264ChunkRequest,
  offlineRemotionDeliveryH264ChunkInputCommitments,
  offlineRemotionDeliveryH264ChunkRequestSha256,
  validateOfflineRemotionDeliveryH264ChunkRequest,
} from '../tool-execution/remotion-render-execution'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const sourceSha256 = sha256AuthorityValue('delivery-h264-source-vp9')
const request = requestFor({
  chunkIndex: 124,
  chunkCount: 124,
  durationFrames: 5_400,
  globalStartFrame: 642_600,
})

assert.equal(request.payload.recipeProfileId,
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RECIPE)
assert.equal(request.payload.chunkIndex, 124)
assert.equal(request.payload.globalEndFrameExclusive, 648_000)
assert.equal(request.payload.outputVideoCodec, 'h264')
assert.equal(request.payload.outputVideoProfile, 'high')
assert.equal(request.payload.outputCrf, 18)
assert.equal(request.payload.outputPreset, 'medium')
assert.equal(request.payload.outputPixelFormat, 'yuv420p')
assert.equal(request.payload.outputColorRange, 'tv')
assert.equal(request.payload.outputAudioPolicy, 'video_only_no_audio')
assert.equal(request.payload.usesApprovedEditReservation, true)
assert.equal(request.payload.requiresSeparateExportEstimate, false)
assert.equal(request.payload.allowsAdditionalExportCharge, false)
assert.equal(offlineRemotionDeliveryH264ChunkInputCommitments(request).length, 1)
assert.match(offlineRemotionDeliveryH264ChunkRequestSha256(request),
  /^[a-f0-9]{64}$/u)
assert.equal(OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES,
  3 * 1024 * 1024 * 1024)

const minimum = requestFor({
  chunkIndex: 1,
  chunkCount: 2,
  durationFrames: 1_350,
  globalStartFrame: 0,
})
assert.equal(minimum.payload.globalEndFrameExclusive, 1_350)

for (const invalid of [
  { ...request, command: 'ffmpeg -i caller-input' },
  {
    ...request,
    payload: { ...request.payload, outputCrf: 23 },
  },
  {
    ...request,
    payload: { ...request.payload, outputAudioPolicy: 'preserve_source' },
  },
  {
    ...request,
    payload: { ...request.payload, allowsAdditionalExportCharge: true },
  },
  {
    ...request,
    payload: { ...request.payload, globalEndFrameExclusive: 647_999 },
  },
  {
    ...request,
    payload: { ...request.payload, width: 3840, height: 3840 },
  },
  {
    ...request,
    inputs: {
      source: { ...request.inputs.source, mimeType: 'video/mp4' },
    },
  },
  {
    ...request,
    inputs: {
      source: {
        ...request.inputs.source,
        byteLength: 512 * 1024 * 1024 + 1,
      },
    },
  },
]) assert.throws(
  () => validateOfflineRemotionDeliveryH264ChunkRequest(invalid),
  /unsupported|policy|object|bounds|Matroska|ceiling/u,
)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: 'offline-remotion-delivery-h264-chunk-contract-smoke-v1',
  minimumDurationFrames: minimum.payload.durationFrames,
  maximumDurationFrames: request.payload.durationFrames,
  maximumChunkCount: request.payload.chunkCount,
  maximumOutputBytes:
    OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES,
  videoOnly: true,
  h264HighCrf18Medium: true,
  approvedFourKEstimateAndReservationReused: true,
  secondExportEstimateCreated: false,
  secondExportChargeCreated: false,
  mediaExecutionVerified: false,
  independentChunkQaVerified: false,
  productReady: false,
  productionReady: false,
}, null, 2))

function requestFor(input: {
  chunkIndex: number
  chunkCount: number
  durationFrames: number
  globalStartFrame: number
}) {
  return buildOfflineRemotionDeliveryH264ChunkRequest({
    planningPayload: {
      recipeProfileId: OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RECIPE,
      compositionProfileId:
        'approved_long_form_delivery_h264_video_chunk_v1',
      longFormCapacityProfileId:
        'canonical_professional_4k_object_chunk_graph_6h_v1',
      chunkId: `delivery-h264-chunk-${input.chunkIndex}`,
      chunkAuthorityHash: sha256AuthorityValue({
        domain: 'delivery-h264-chunk-authority-smoke',
        chunkIndex: input.chunkIndex,
      }),
      sourceVp9ObjectIdentity: sha256AuthorityValue({
        domain: 'delivery-h264-source-object-smoke',
        chunkIndex: input.chunkIndex,
      }),
      expectedOutputIdentity: sha256AuthorityValue({
        domain: 'delivery-h264-output-object-smoke',
        chunkIndex: input.chunkIndex,
      }),
      chunkIndex: input.chunkIndex,
      chunkCount: input.chunkCount,
      width: 3840,
      height: 2160,
      fps: 30,
      durationFrames: input.durationFrames,
      globalStartFrame: input.globalStartFrame,
      globalEndFrameExclusive:
        input.globalStartFrame + input.durationFrames,
      sourceVideoPolicy: 'exact_passed_vp9_object_chunk_v2',
      transcodePolicy: 'h264_high_crf18_medium_frame_preserving_v1',
      outputContainer: 'mp4',
      outputVideoCodec: 'h264',
      outputVideoProfile: 'high',
      outputCrf: 18,
      outputPreset: 'medium',
      outputPixelFormat: 'yuv420p',
      outputColorRange: 'tv',
      outputColorSpace: 'bt709',
      outputColorTransfer: 'bt709',
      outputColorPrimaries: 'bt709',
      outputAudioPolicy: 'video_only_no_audio',
      renderPurpose: 'private_4k_customer_delivery_video_chunk_v1',
      deliveryProfileId: 'uhd_2160',
      estimateCostBasisProfileId: 'uhd_2160',
      sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
      usesApprovedEditReservation: true,
      requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false,
    },
    source: {
      inputId: 'passed-private-vp9-object-chunk',
      mimeType: 'video/x-matroska',
      byteLength: 64,
      sha256: sourceSha256,
    },
  })
}
