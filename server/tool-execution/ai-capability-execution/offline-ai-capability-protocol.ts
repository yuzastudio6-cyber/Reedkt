import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'

import { ApiError } from '../../errors/api-error'

export const OFFLINE_AI_CAPABILITY_PROTOCOL = 'offline-ai-capability-execution-v1' as const
export const OFFLINE_AI_CAPABILITY_CONTAINER_PROTOCOL = 'offline-ai-capability-execution-container-v1' as const
export const OFFLINE_AI_CAPABILITY_TOOL_IDS = ['torch_torchvision', 'transformers', 'music21', 'kornia'] as const
export type OfflineAiCapabilityToolId = (typeof OFFLINE_AI_CAPABILITY_TOOL_IDS)[number]
export const OFFLINE_AI_CAPABILITY_OPERATIONS = Object.freeze({
  torch_torchvision: 'tool.torch_torchvision.verify_tensor_vision_runtime.v1',
  transformers: 'tool.transformers.verify_transformers_runtime.v1',
  music21: 'tool.music21.analyze_music_structure.v1',
  kornia: 'tool.kornia.refine_mask.v1',
} as const)
export const OFFLINE_AI_CAPABILITY_PACKAGE_IDENTITIES = Object.freeze({
  torch_torchvision: { packageName: 'torch+torchvision', version: '2.13.0+cpu+0.28.0+cpu' },
  transformers: { packageName: 'transformers', version: '5.13.0' },
  music21: { packageName: 'music21', version: '10.5.0' },
  kornia: { packageName: 'kornia', version: '0.8.3' },
} as const)

interface ContentCommitment { sourceMimeType: 'audio/wav' | 'image/png'; sourceByteLength: number; sourceSha256: string; sourceBytesBase64: string }
export type OfflineAiCapabilityRequest =
  | { schemaVersion: typeof OFFLINE_AI_CAPABILITY_PROTOCOL; toolId: 'torch_torchvision'; operationId: typeof OFFLINE_AI_CAPABILITY_OPERATIONS.torch_torchvision; payload: { capabilityProfile: 'cpu_import'; expectedRuntimeMajor: 2 } }
  | { schemaVersion: typeof OFFLINE_AI_CAPABILITY_PROTOCOL; toolId: 'transformers'; operationId: typeof OFFLINE_AI_CAPABILITY_OPERATIONS.transformers; payload: { capabilityProfile: 'cpu_import'; expectedRuntimeMajor: 5 } }
  | { schemaVersion: typeof OFFLINE_AI_CAPABILITY_PROTOCOL; toolId: 'music21'; operationId: typeof OFFLINE_AI_CAPABILITY_OPERATIONS.music21; payload: { sampleRate: 48000; channelMode: 'mono'; analysisProfileId: 'approved_music_structure_v1'; confidenceThreshold: 0.6 } & ContentCommitment }
  | { schemaVersion: typeof OFFLINE_AI_CAPABILITY_PROTOCOL; toolId: 'kornia'; operationId: typeof OFFLINE_AI_CAPABILITY_OPERATIONS.kornia; payload: { confidenceThreshold: 0.5; maximumSubjects: 1; frameStride: 1; edgeRefinementProfileId: 'approved_mask_close_v1'; preserveContactObjects: true } & ContentCommitment }

export function validateOfflineAiCapabilityRequest(value: unknown): OfflineAiCapabilityRequest {
  const request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== OFFLINE_AI_CAPABILITY_PROTOCOL || !isToolId(request.toolId) || request.operationId !== OFFLINE_AI_CAPABILITY_OPERATIONS[request.toolId]) throw invalid('AI capability request identity is unsupported.')
  if (request.toolId === 'torch_torchvision' || request.toolId === 'transformers') {
    const payload = exact(request.payload, ['capabilityProfile', 'expectedRuntimeMajor'], 'capability payload')
    const expected = request.toolId === 'torch_torchvision' ? 2 : 5
    if (payload.capabilityProfile !== 'cpu_import' || payload.expectedRuntimeMajor !== expected) throw invalid('AI capability profile is unsupported.')
    return { schemaVersion: OFFLINE_AI_CAPABILITY_PROTOCOL, toolId: request.toolId, operationId: OFFLINE_AI_CAPABILITY_OPERATIONS[request.toolId], payload: { capabilityProfile: 'cpu_import', expectedRuntimeMajor: expected } } as OfflineAiCapabilityRequest
  }
  if (request.toolId === 'music21') {
    const payload = exact(request.payload, ['sampleRate', 'channelMode', 'analysisProfileId', 'confidenceThreshold', 'sourceMimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64'], 'Music21 payload')
    if (payload.sampleRate !== 48000 || payload.channelMode !== 'mono' || payload.analysisProfileId !== 'approved_music_structure_v1' || payload.confidenceThreshold !== 0.6) throw invalid('Music21 policy is unsupported.')
    return { schemaVersion: OFFLINE_AI_CAPABILITY_PROTOCOL, toolId: 'music21', operationId: OFFLINE_AI_CAPABILITY_OPERATIONS.music21, payload: { sampleRate: 48000, channelMode: 'mono', analysisProfileId: 'approved_music_structure_v1', confidenceThreshold: 0.6, ...commitment(payload, 'audio/wav', 1024, 4 * 1024 * 1024) } }
  }
  const payload = exact(request.payload, ['confidenceThreshold', 'maximumSubjects', 'frameStride', 'edgeRefinementProfileId', 'preserveContactObjects', 'sourceMimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64'], 'Kornia payload')
  if (payload.confidenceThreshold !== 0.5 || payload.maximumSubjects !== 1 || payload.frameStride !== 1 || payload.edgeRefinementProfileId !== 'approved_mask_close_v1' || payload.preserveContactObjects !== true) throw invalid('Kornia policy is unsupported.')
  return { schemaVersion: OFFLINE_AI_CAPABILITY_PROTOCOL, toolId: 'kornia', operationId: OFFLINE_AI_CAPABILITY_OPERATIONS.kornia, payload: { confidenceThreshold: 0.5, maximumSubjects: 1, frameStride: 1, edgeRefinementProfileId: 'approved_mask_close_v1', preserveContactObjects: true, ...commitment(payload, 'image/png', 64, 1024 * 1024) } }
}

export function buildOfflineAiCapabilitySourceRequest(input: { toolId: 'music21' | 'kornia'; planningPayload: unknown; source: { mimeType: 'audio/wav' | 'image/png'; bytes: Buffer; sha256: string } }): OfflineAiCapabilityRequest {
  const source = committedInput(input.source)
  return validateOfflineAiCapabilityRequest({
    schemaVersion: OFFLINE_AI_CAPABILITY_PROTOCOL, toolId: input.toolId,
    operationId: OFFLINE_AI_CAPABILITY_OPERATIONS[input.toolId],
    payload: { ...(input.planningPayload as Record<string, unknown>), sourceMimeType: source.mimeType, sourceByteLength: source.bytes.length, sourceSha256: source.sha256, sourceBytesBase64: source.bytes.toString('base64') },
  })
}

export function buildOfflineAiCapabilityApprovedRequest(input: { toolId: OfflineAiCapabilityToolId; operationId: string; planningPayload: unknown }): OfflineAiCapabilityRequest {
  if (input.operationId !== OFFLINE_AI_CAPABILITY_OPERATIONS[input.toolId]) throw invalid('AI capability approved operation is unsupported.')
  if (input.toolId === 'torch_torchvision' || input.toolId === 'transformers') {
    return validateOfflineAiCapabilityRequest({ schemaVersion: OFFLINE_AI_CAPABILITY_PROTOCOL, toolId: input.toolId, operationId: input.operationId, payload: input.planningPayload })
  }
  const payload = exact(input.planningPayload, input.toolId === 'music21'
    ? ['sampleRate', 'channelMode', 'analysisProfileId', 'confidenceThreshold', 'fixtureProfileId']
    : ['confidenceThreshold', 'maximumSubjects', 'frameStride', 'edgeRefinementProfileId', 'preserveContactObjects', 'fixtureProfileId'], 'approved AI capability payload')
  if (input.toolId === 'music21') {
    if (payload.fixtureProfileId !== 'approved_four_tone_fixture_v1') throw invalid('Music21 approved fixture profile is unsupported.')
    const source = approvedFourToneWav()
    return buildOfflineAiCapabilitySourceRequest({ toolId: 'music21', planningPayload: Object.fromEntries(Object.entries(payload).filter(([key]) => key !== 'fixtureProfileId')), source: { mimeType: 'audio/wav', bytes: source, sha256: createHash('sha256').update(source).digest('hex') } })
  }
  if (payload.fixtureProfileId !== 'approved_mask_fixture_v1') throw invalid('Kornia approved fixture profile is unsupported.')
  const source = approvedMaskPng()
  return buildOfflineAiCapabilitySourceRequest({ toolId: 'kornia', planningPayload: Object.fromEntries(Object.entries(payload).filter(([key]) => key !== 'fixtureProfileId')), source: { mimeType: 'image/png', bytes: source, sha256: createHash('sha256').update(source).digest('hex') } })
}

export function offlineAiCapabilityRequestSha256(request: OfflineAiCapabilityRequest): string { return createHash('sha256').update(JSON.stringify(request)).digest('hex') }

function commitment(payload: Record<string, unknown>, mimeType: 'audio/wav' | 'image/png', minimum: number, maximum: number): ContentCommitment {
  if (payload.sourceMimeType !== mimeType || !Number.isSafeInteger(payload.sourceByteLength) || typeof payload.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(payload.sourceSha256) || typeof payload.sourceBytesBase64 !== 'string') throw invalid('AI capability content commitment is invalid.')
  const bytes = Buffer.from(payload.sourceBytesBase64, 'base64')
  if (bytes.toString('base64') !== payload.sourceBytesBase64 || bytes.length !== payload.sourceByteLength || bytes.length < minimum || bytes.length > maximum || createHash('sha256').update(bytes).digest('hex') !== payload.sourceSha256) throw invalid('AI capability bytes do not match their commitment.')
  if (mimeType === 'audio/wav' && bytes.subarray(0, 4).toString('ascii') !== 'RIFF') throw invalid('Music21 source is not a WAV.')
  if (mimeType === 'image/png' && bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw invalid('Kornia source is not a PNG.')
  return { sourceMimeType: mimeType, sourceByteLength: bytes.length, sourceSha256: String(payload.sourceSha256), sourceBytesBase64: bytes.toString('base64') }
}
function committedInput(source: { mimeType: 'audio/wav' | 'image/png'; bytes: Buffer; sha256: string }) { if (!Buffer.isBuffer(source.bytes) || createHash('sha256').update(source.bytes).digest('hex') !== source.sha256) throw invalid('Source bytes do not match their hash.'); return source }
function isToolId(value: unknown): value is OfflineAiCapabilityToolId { return (OFFLINE_AI_CAPABILITY_TOOL_IDS as readonly unknown[]).includes(value) }
function exact(value: unknown, keys: readonly string[], label: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} must be an object.`); const record = value as Record<string, unknown>; if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) throw invalid(`${label} contains unsupported fields.`); return record }
function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }

function approvedFourToneWav(): Buffer {
  const sampleRate = 48_000; const durationSamples = sampleRate / 4; const frequencies = [261.625565, 329.627557, 391.995436, 523.251131]
  const data = Buffer.alloc(durationSamples * frequencies.length * 2); let offset = 0
  for (const frequency of frequencies) for (let sample = 0; sample < durationSamples; sample += 1) { data.writeInt16LE(Math.round(Math.sin(2 * Math.PI * frequency * sample / sampleRate) * 12_000), offset); offset += 2 }
  const wav = Buffer.alloc(44 + data.length); wav.write('RIFF', 0); wav.writeUInt32LE(36 + data.length, 4); wav.write('WAVE', 8); wav.write('fmt ', 12)
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(data.length, 40); data.copy(wav, 44)
  return wav
}
function approvedMaskPng(): Buffer {
  const width = 64; const height = 64; const scanlines = Buffer.alloc((width + 1) * height)
  for (let y = 0; y < height; y += 1) { const row = y * (width + 1); for (let x = 0; x < width; x += 1) scanlines[row + x + 1] = x >= 18 && x <= 45 && y >= 14 && y <= 49 && !(x >= 30 && x <= 32 && y >= 30 && y <= 32) ? 255 : 0 }
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), pngChunk('IHDR', header), pngChunk('IDAT', deflateSync(scanlines, { level: 9 })), pngChunk('IEND', Buffer.alloc(0))])
}
function pngChunk(type: string, data: Buffer): Buffer { const typeBytes = Buffer.from(type); const chunk = Buffer.alloc(12 + data.length); chunk.writeUInt32BE(data.length, 0); typeBytes.copy(chunk, 4); data.copy(chunk, 8); chunk.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length); return chunk }
function crc32(data: Buffer): number { let crc = 0xffffffff; for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)) } return (crc ^ 0xffffffff) >>> 0 }
