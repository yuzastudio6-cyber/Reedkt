import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'

import {
  activatePrivateOfflineMediaBinaryRuntime,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
} from '../tool-execution/media-binary-execution'

const fixturePath = join('/tmp', `reeditpro-offline-ffprobe-${process.pid}.mp4`)
const generated = spawnSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error',
  '-f', 'lavfi', '-i', 'color=c=blue:s=320x180:r=24:d=2',
  '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=2',
  '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-shortest',
  '-threads', '1', '-y', fixturePath,
], { encoding: 'utf8' })
assert.equal(generated.status, 0, generated.stderr)
const sourceBytes = await readFile(fixturePath)
await rm(fixturePath, { force: true })
const sourceAuthority = {
  mimeType: 'video/mp4' as const,
  sourceByteLength: sourceBytes.byteLength,
  sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'),
  sourceBytesBase64: sourceBytes.toString('base64'),
}

const runtime = await activatePrivateOfflineMediaBinaryRuntime()
const request = {
  schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
  toolId: 'ffprobe' as const,
  operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
  payload: {
    inspectionProfileId: 'source_intake_v1' as const,
    countFrames: true,
    verifyDurationAndSync: true as const,
    emitMachineJsonOnly: true as const,
    ...sourceAuthority,
  },
}
const result = await runtime.execute(request)
assert.equal(result.evidence.toolId, 'ffprobe')
assert.equal(result.evidence.binaryVersion, '8.1.2')
assert.equal(result.evidence.sourceSha256, sourceAuthority.sourceSha256)
assert.equal(result.evidence.containerExitCode, 0)
assert.equal(result.evidence.oomKilled, false)
assert.equal(result.evidence.confinement.networkMode, 'none')
assert.equal(result.evidence.confinement.readOnlyRootFilesystem, true)
assert.equal(result.evidence.confinement.callerMountsPresent, false)
assert.equal(result.evidence.confinement.serverDerivedArgumentsOnly, true)
assert.equal(result.readiness.productReady, false)
assert.equal(result.image.productReady, false)
assert.equal(result.image.h264Encoding, 'blocked_not_compiled')
assert.equal(result.resultJson.document.streamCount, 2)
assert.equal(result.resultJson.document.durationSeconds, 2)
assert.equal(result.resultJson.sha256, createHash('sha256').update(result.resultJson.bytes).digest('hex'))

const ffmpegRequest = {
  schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
  toolId: 'ffmpeg' as const,
  operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
  payload: {
    recipeProfileId: 'approved_trim_transcode_v1' as const,
    timestampPolicy: 'normalize_from_zero' as const,
    overwriteExistingArtifact: false as const,
    allowUnreviewedCodec: false as const,
    trimStartFrame: 12,
    trimEndFrameExclusive: 36,
    frameRate: 24 as const,
    ...sourceAuthority,
  },
}
const ffmpegResult = await runtime.execute(ffmpegRequest)
assert.equal(ffmpegResult.evidence.toolId, 'ffmpeg')
assert.equal(ffmpegResult.evidence.binaryVersion, '8.1.2')
assert.equal(ffmpegResult.evidence.sourceSha256, sourceAuthority.sourceSha256)
assert.equal(ffmpegResult.resultArtifact.mimeType, 'video/x-nut')
assert.ok(ffmpegResult.resultArtifact.byteLength > 64)
assert.equal(ffmpegResult.resultArtifact.sha256,
  createHash('sha256').update(ffmpegResult.resultArtifact.bytes).digest('hex'))
assert.equal(ffmpegResult.evidence.semanticEvidence.outputFrameCount, 24)
assert.equal(ffmpegResult.evidence.semanticEvidence.outputContainer, 'nut')
assert.equal(ffmpegResult.evidence.semanticEvidence.outputVideoCodec, 'ffv1')
assert.equal(ffmpegResult.evidence.semanticEvidence.outputProbeVerified, true)
assert.equal(ffmpegResult.evidence.confinement.serverOwnedEntrypoint,
  '/opt/reeditpro-ffmpeg/bin/ffmpeg')
const ffmpegReplay = await runtime.execute(ffmpegRequest)
assert.equal(ffmpegReplay.resultArtifact.sha256, ffmpegResult.resultArtifact.sha256)

const authority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
assert(authority)
assert.equal(authority.readiness.privateInternalExecutionReady, true)
assert.equal(authority.readiness.finalExportReady, false)
assert.equal(authority.supportedOperations.length, 2)
assert.equal(authority.image.imageIdentityHash, runtime.image.imageIdentityHash)
const reopened = await openPrivateOfflineMediaBinaryRuntime()
assert.equal(reopened.image.imageIdentityHash, runtime.image.imageIdentityHash)
const replay = await reopened.execute(request)
assert.equal(replay.resultJson.sha256, result.resultJson.sha256)

await assertRejects(() => runtime.execute({
  ...request,
  payload: { ...request.payload, sourceSha256: 'f'.repeat(64) },
}))
await assertRejects(() => runtime.execute({
  ...ffmpegRequest,
  payload: { ...ffmpegRequest.payload, recipeProfileId: 'final_export_h264_aac_v1' },
}))
await assertRejects(() => runtime.execute({
  ...ffmpegRequest,
  payload: { ...ffmpegRequest.payload, trimEndFrameExclusive: 12 },
}))
await assertRejects(() => runtime.execute({
  ...request,
  payload: { ...request.payload, command: 'ffprobe -version' },
}))
await assertRejects(() => runtime.execute({
  ...request,
  payload: { ...request.payload, path: '/tmp/source.mp4' },
}))
await assertRejects(() => runtime.execute({
  ...request,
  operationId: 'tool.ffprobe.unapproved.v1',
}))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'pinned_ffmpeg_8_1_2_lgpl_image_identity',
    'actual_ffprobe_approved_source_inspection',
    'actual_ffmpeg_approved_frame_trim_to_ffv1_nut_intermediate',
    'ffmpeg_output_reprobed_for_codec_container_frame_count_and_rate',
    'ffmpeg_deterministic_reexecution_result',
    'server_injected_source_checksum_and_byte_length',
    'machine_json_duration_stream_and_frame_count_normalization',
    'networkless_readonly_nonroot_no_mount_confinement',
    'server_owned_entrypoint_and_fixed_argument_derivation',
    'checksum_protected_runtime_authority_and_restart_safe_open',
    'deterministic_reexecution_result',
    'caller_command_path_operation_and_source_tamper_rejected',
    'h264_encoding_and_final_export_remain_blocked',
    'private_internal_only_without_product_beta_or_production_promotion',
  ],
}))

async function assertRejects(action: () => Promise<unknown>): Promise<void> {
  let rejected = false
  try { await action() } catch { rejected = true }
  assert.equal(rejected, true)
}
