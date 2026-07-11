import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

export const OFFLINE_NATIVE_AUDIO_PROCESSING_PROTOCOL = 'offline-native-audio-processing-execution-v1' as const
export const OFFLINE_NATIVE_AUDIO_PROCESSING_CONTAINER_PROTOCOL = 'offline-native-audio-processing-execution-container-v1' as const
export const OFFLINE_NATIVE_AUDIO_PROCESSING_TOOL_IDS = ['rnnoise', 'signalsmith_stretch'] as const
export type OfflineNativeAudioProcessingToolId = (typeof OFFLINE_NATIVE_AUDIO_PROCESSING_TOOL_IDS)[number]
export const OFFLINE_NATIVE_AUDIO_PROCESSING_OPERATIONS = Object.freeze({
  rnnoise: 'tool.rnnoise.denoise_voice.v1',
  signalsmith_stretch: 'tool.signalsmith_stretch.stretch_approved_music_asset.v1',
} as const)
export const OFFLINE_NATIVE_AUDIO_PROCESSING_PACKAGE_IDENTITIES = Object.freeze({
  rnnoise: { packageName: 'rnnoise+embedded-model', version: 'v0.2+0b50c45' },
  signalsmith_stretch: { packageName: 'signalsmith-stretch', version: '1.1.0' },
} as const)

export type OfflineNativeAudioProcessingRequest =
  | { schemaVersion: typeof OFFLINE_NATIVE_AUDIO_PROCESSING_PROTOCOL; toolId: 'rnnoise'; operationId: typeof OFFLINE_NATIVE_AUDIO_PROCESSING_OPERATIONS.rnnoise; payload: { sampleRate: 48000; channelMode: 'mono'; processingProfileId: 'approved_voice_denoise_v1'; strength: 1; preserveVoice: true; fixtureProfileId: 'approved_noisy_voice_fixture_v1' } }
  | { schemaVersion: typeof OFFLINE_NATIVE_AUDIO_PROCESSING_PROTOCOL; toolId: 'signalsmith_stretch'; operationId: typeof OFFLINE_NATIVE_AUDIO_PROCESSING_OPERATIONS.signalsmith_stretch; payload: { stretchProfileId: 'approved_music_bed_fit_v1'; speedRatio: 1.25; pitchSemitones: 0; preserveVoice: false; fixtureProfileId: 'approved_music_tone_fixture_v1' } }

export function validateOfflineNativeAudioProcessingRequest(value: unknown): OfflineNativeAudioProcessingRequest {
  const request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== OFFLINE_NATIVE_AUDIO_PROCESSING_PROTOCOL || !isToolId(request.toolId) || request.operationId !== OFFLINE_NATIVE_AUDIO_PROCESSING_OPERATIONS[request.toolId]) throw invalid('Native audio processing request identity is unsupported.')
  if (request.toolId === 'rnnoise') {
    const payload = exact(request.payload, ['sampleRate', 'channelMode', 'processingProfileId', 'strength', 'preserveVoice', 'fixtureProfileId'], 'RNNoise payload')
    if (payload.sampleRate !== 48000 || payload.channelMode !== 'mono' || payload.processingProfileId !== 'approved_voice_denoise_v1' || payload.strength !== 1 || payload.preserveVoice !== true || payload.fixtureProfileId !== 'approved_noisy_voice_fixture_v1') throw invalid('RNNoise policy is unsupported.')
    return { schemaVersion: OFFLINE_NATIVE_AUDIO_PROCESSING_PROTOCOL, toolId: 'rnnoise', operationId: OFFLINE_NATIVE_AUDIO_PROCESSING_OPERATIONS.rnnoise, payload: { sampleRate: 48000, channelMode: 'mono', processingProfileId: 'approved_voice_denoise_v1', strength: 1, preserveVoice: true, fixtureProfileId: 'approved_noisy_voice_fixture_v1' } }
  }
  const payload = exact(request.payload, ['stretchProfileId', 'speedRatio', 'pitchSemitones', 'preserveVoice', 'fixtureProfileId'], 'Signalsmith Stretch payload')
  if (payload.stretchProfileId !== 'approved_music_bed_fit_v1' || payload.speedRatio !== 1.25 || payload.pitchSemitones !== 0 || payload.preserveVoice !== false || payload.fixtureProfileId !== 'approved_music_tone_fixture_v1') throw invalid('Signalsmith Stretch policy is unsupported.')
  return { schemaVersion: OFFLINE_NATIVE_AUDIO_PROCESSING_PROTOCOL, toolId: 'signalsmith_stretch', operationId: OFFLINE_NATIVE_AUDIO_PROCESSING_OPERATIONS.signalsmith_stretch, payload: { stretchProfileId: 'approved_music_bed_fit_v1', speedRatio: 1.25, pitchSemitones: 0, preserveVoice: false, fixtureProfileId: 'approved_music_tone_fixture_v1' } }
}

export function buildOfflineNativeAudioProcessingApprovedRequest(input: { toolId: OfflineNativeAudioProcessingToolId; operationId: string; planningPayload: unknown }): OfflineNativeAudioProcessingRequest { return validateOfflineNativeAudioProcessingRequest({ schemaVersion: OFFLINE_NATIVE_AUDIO_PROCESSING_PROTOCOL, toolId: input.toolId, operationId: input.operationId, payload: input.planningPayload }) }
export function offlineNativeAudioProcessingRequestSha256(request: OfflineNativeAudioProcessingRequest): string { return createHash('sha256').update(JSON.stringify(request)).digest('hex') }
function isToolId(value: unknown): value is OfflineNativeAudioProcessingToolId { return (OFFLINE_NATIVE_AUDIO_PROCESSING_TOOL_IDS as readonly unknown[]).includes(value) }
function exact(value: unknown, keys: readonly string[], label: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} must be an object.`); const record = value as Record<string, unknown>; if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) throw invalid(`${label} contains unsupported fields.`); return record }
function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
