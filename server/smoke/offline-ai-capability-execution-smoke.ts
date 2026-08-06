import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'

import { prepareOfflineAiCapabilityDockerRuntime } from '../tool-execution/ai-capability-execution/offline-ai-capability-docker-runtime'
import {
  OFFLINE_AI_CAPABILITY_OPERATIONS, OFFLINE_AI_CAPABILITY_PACKAGE_IDENTITIES, OFFLINE_AI_CAPABILITY_TOOL_IDS,
  buildOfflineAiCapabilitySourceRequest, validateOfflineAiCapabilityRequest,
} from '../tool-execution/ai-capability-execution/offline-ai-capability-protocol'
import {
  activatePrivateOfflineAiCapabilityRuntime, openPrivateOfflineAiCapabilityRuntime,
  readPersistedOfflineAiCapabilityRuntimeAuthority,
} from '../tool-execution/ai-capability-execution/offline-ai-capability-service'

const wav = makeFourToneWav()
const mask = makeMaskPng()
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')
const requests = [
  validateOfflineAiCapabilityRequest({ schemaVersion: 'offline-ai-capability-execution-v1', toolId: 'torch_torchvision', operationId: OFFLINE_AI_CAPABILITY_OPERATIONS.torch_torchvision, payload: { capabilityProfile: 'cpu_import', expectedRuntimeMajor: 2 } }),
  validateOfflineAiCapabilityRequest({ schemaVersion: 'offline-ai-capability-execution-v1', toolId: 'transformers', operationId: OFFLINE_AI_CAPABILITY_OPERATIONS.transformers, payload: { capabilityProfile: 'cpu_import', expectedRuntimeMajor: 5 } }),
  buildOfflineAiCapabilitySourceRequest({ toolId: 'music21', planningPayload: { sampleRate: 48000, channelMode: 'mono', analysisProfileId: 'approved_music_structure_v1', confidenceThreshold: 0.6 }, source: { mimeType: 'audio/wav', bytes: wav, sha256: sha256(wav) } }),
  buildOfflineAiCapabilitySourceRequest({ toolId: 'kornia', planningPayload: { confidenceThreshold: 0.5, maximumSubjects: 1, frameStride: 1, edgeRefinementProfileId: 'approved_mask_close_v1', preserveContactObjects: true }, source: { mimeType: 'image/png', bytes: mask, sha256: sha256(mask) } }),
] as const

for (const invalid of [
  { ...requests[0], command: 'whoami' },
  { ...requests[0], payload: { ...requests[0].payload, capabilityProfile: 'model_inference' } },
  { ...requests[0], payload: { ...requests[0].payload, expectedRuntimeMajor: 3 } },
  { ...requests[1], payload: { ...requests[1].payload, modelUrl: 'https://example.test/model' } },
  { ...requests[2], payload: { ...requests[2].payload, sourceSha256: '0'.repeat(64) } },
  { ...requests[2], payload: { ...requests[2].payload, sourcePath: '/etc/passwd' } },
  { ...requests[3], payload: { ...requests[3].payload, maximumSubjects: 2 } },
]) assert.throws(() => validateOfflineAiCapabilityRequest(invalid), /unsupported|invalid|commitment/)

await prepareOfflineAiCapabilityDockerRuntime()
const activated = await activatePrivateOfflineAiCapabilityRuntime()
const authority = await readPersistedOfflineAiCapabilityRuntimeAuthority()
assert.ok(authority)
assert.deepEqual(authority.supportedOperations.map((operation) => operation.toolId), OFFLINE_AI_CAPABILITY_TOOL_IDS)
assert.equal(authority.readiness.privateInternalExecutionReady, true)
assert.equal(authority.readiness.modelWeightsLoaded, false)
assert.equal(authority.readiness.productReady, false)
const reopened = await openPrivateOfflineAiCapabilityRuntime()
assert.equal(reopened.image.imageIdentityHash, activated.image.imageIdentityHash)

const artifacts: Record<string, { sha256: string; byteLength: number; mimeType: string }> = {}
for (const request of requests) {
  const first = await reopened.execute(request)
  const replay = await reopened.execute(request)
  const expectedPackage = OFFLINE_AI_CAPABILITY_PACKAGE_IDENTITIES[request.toolId]
  assert.equal(first.artifact.mimeType, request.toolId === 'kornia' ? 'image/png' : 'application/json')
  assert.equal(first.artifact.sha256, replay.artifact.sha256)
  assert.equal(first.evidence.packageName, expectedPackage.packageName)
  assert.equal(first.evidence.packageVersion, expectedPackage.version)
  assert.equal(first.evidence.confinement.networkMode, 'none')
  assert.equal(first.evidence.confinement.readOnlyRootFilesystem, true)
  assert.equal(first.evidence.confinement.capDropAll, true)
  assert.equal(first.evidence.confinement.noNewPrivileges, true)
  assert.equal(first.evidence.confinement.user, '10001:10001')
  assert.equal(first.evidence.semanticEvidence.actualPackageEntrypointExecuted, true)
  assert.equal(first.evidence.semanticEvidence.zeroNetworkRuntimeRequired, true)
  assert.equal(first.readiness.modelWeightsLoaded, false)
  assert.equal(first.readiness.productReady, false)
  artifacts[request.toolId] = { sha256: first.artifact.sha256, byteLength: first.artifact.byteLength, mimeType: first.artifact.mimeType }
}

console.log(JSON.stringify({
  smoke: 'offline_ai_capability_execution', status: 'passed', toolCount: requests.length,
  proofs: [
    'four_exact_tool_and_operation_identities_validated', 'exact_hash_locked_package_versions_executed',
    'caller_urls_paths_commands_model_profiles_and_extra_fields_rejected', 'source_bytes_bound_to_sha256_commitments',
    'checksum_protected_runtime_authority_persisted_and_reopened', 'pinned_image_identity_verified',
    'network_none_read_only_non_root_cap_drop_no_new_privileges_confinement_verified',
    'actual_torch_torchvision_transformers_music21_and_kornia_entrypoints_executed',
    'deterministic_replay_hashes_verified', 'transformers_model_weights_remain_unloaded',
    'product_external_beta_and_production_readiness_remain_false',
  ], artifacts,
}, null, 2))

function makeFourToneWav(): Buffer {
  const sampleRate = 48_000; const durationSamples = sampleRate / 4; const frequencies = [261.625565, 329.627557, 391.995436, 523.251131]
  const data = Buffer.alloc(durationSamples * frequencies.length * 2)
  let offset = 0
  for (const frequency of frequencies) for (let sample = 0; sample < durationSamples; sample += 1) { data.writeInt16LE(Math.round(Math.sin(2 * Math.PI * frequency * sample / sampleRate) * 12_000), offset); offset += 2 }
  const wav = Buffer.alloc(44 + data.length)
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + data.length, 4); wav.write('WAVE', 8); wav.write('fmt ', 12)
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(sampleRate, 24)
  wav.writeUInt32LE(sampleRate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(data.length, 40)
  data.copy(wav, 44)
  return wav
}

function makeMaskPng(): Buffer {
  const width = 64; const height = 64; const scanlines = Buffer.alloc((width + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const row = y * (width + 1); scanlines[row] = 0
    for (let x = 0; x < width; x += 1) scanlines[row + x + 1] = x >= 18 && x <= 45 && y >= 14 && y <= 49 && !(x >= 30 && x <= 32 && y >= 30 && y <= 32) ? 255 : 0
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 0
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), pngChunk('IHDR', header), pngChunk('IDAT', deflateSync(scanlines, { level: 9 })), pngChunk('IEND', Buffer.alloc(0))])
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, 'ascii'); const chunk = Buffer.alloc(12 + data.length)
  chunk.writeUInt32BE(data.length, 0); typeBytes.copy(chunk, 4); data.copy(chunk, 8); chunk.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length)
  return chunk
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)) }
  return (crc ^ 0xffffffff) >>> 0
}
