import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'

import type {
  MotionStudioSpeechCapabilityField,
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechSegmentRequestV1,
} from '../../../src/types/motion-studio'
import { motionStudioSpeechSegmentRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSpeechC2ExecutionAuthority,
  assertMotionStudioSpeechC2LiveExecutionAuthorityInstance,
  MOTION_STUDIO_ELEVENLABS_TIMING_ADAPTER_ID,
  MOTION_STUDIO_ELEVENLABS_TIMING_ENDPOINT,
  type MotionStudioSpeechC2ExecutionAuthorityV1,
} from './live-authority'
import { assertMotionStudioOfficialSpeechCapabilitySnapshotIntegrity } from './official-capability'

const VOICE_ID = /^[A-Za-z0-9_-]{8,128}$/
const compiledIntegrity = new WeakMap<object, string>()

export interface MotionStudioElevenLabsTimingBody {
  text: string
  model_id: 'eleven_v3'
  previous_text?: string
  next_text?: string
}

export interface MotionStudioCompiledElevenLabsTimingRequest {
  adapterId: typeof MOTION_STUDIO_ELEVENLABS_TIMING_ADAPTER_ID
  method: 'POST'
  endpoint: string
  query: Readonly<{
    output_format: 'mp3_44100_128'
    enable_logging: 'false'
  }>
  fixedHeaders: Readonly<{ 'Content-Type': 'application/json' }>
  credentialReferenceId: string
  credentialBindingDigest: string
  executionAuthorityId: string
  executionAuthorityDigest: string
  normalizedRequestDigest: string
  compiledRequestDigest: string
  voiceIdentityHash: string
  body: MotionStudioElevenLabsTimingBody
  emittedFields: readonly MotionStudioSpeechCapabilityField[]
  providerOutput: 'audio/mpeg'
  canonicalNormalizationTarget: Readonly<{
    container: 'wav'
    codec: 'pcm_s16le'
    sampleRateHertz: 48_000
    channelCount: 1
  }>
  containsPrivateText: true
  safeToLogBody: false
  maximumProviderCallCount: 1
  automaticRetryAllowed: false
  automaticFallbackAllowed: false
}

export interface ParsedMotionStudioElevenLabsTimingResponse {
  audioBytes: Buffer
  audioSha256: string
  audioByteLength: number
  mimeType: 'audio/mpeg'
  alignment: MotionStudioElevenLabsCharacterAlignment
  normalizedAlignment: MotionStudioElevenLabsCharacterAlignment
  responseDigest: string
  providerResponseUsagePresent: false
  providerCostReconciliationRequired: true
}

export interface MotionStudioElevenLabsCharacterAlignment {
  characters: readonly string[]
  characterStartTimesSeconds: readonly number[]
  characterEndTimesSeconds: readonly number[]
}

export function compileMotionStudioElevenLabsTimingRequest(input: {
  request: MotionStudioSpeechSegmentRequestV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  executionAuthority: MotionStudioSpeechC2ExecutionAuthorityV1
  executionTime: string
  providerVoiceId: string
}): MotionStudioCompiledElevenLabsTimingRequest {
  const request = motionStudioSpeechSegmentRequestV1Schema.parse(input.request)
  const capability = assertMotionStudioOfficialSpeechCapabilitySnapshotIntegrity(input.capabilitySnapshot)
  const authority = assertMotionStudioSpeechC2ExecutionAuthority(input.executionAuthority, request, capability)
  assertMotionStudioSpeechC2LiveExecutionAuthorityInstance(authority)
  const executionTime = Date.parse(input.executionTime)
  if (!Number.isFinite(executionTime) || executionTime < Date.parse(authority.issuedAt) || executionTime >= Date.parse(authority.expiresAt)) {
    blocked('C2 speech execution authority is not current.')
  }
  if (!capability.expiresAt || executionTime >= Date.parse(capability.expiresAt)) {
    blocked('Official speech capability evidence has expired or has no bounded expiry.')
  }
  if (!VOICE_ID.test(input.providerVoiceId)) invalid('Provider catalog voice identity is malformed.')
  if (sha256Text(input.providerVoiceId) !== request.voice.voiceIdentityHash) {
    blocked('Provider catalog voice identity does not match the approved voice binding hash.')
  }
  if (request.pronunciationEntries.length || request.audioTagInstructions.length || request.performance.performanceTagIds.length) {
    blocked('The first bounded take excludes pronunciation-dictionary creation and Audio Tag compilation.')
  }
  if (request.modelSelection.intendedRole !== 'final_expressive' || request.modelSelection.requestedModelId && request.modelSelection.requestedModelId !== 'eleven_v3') {
    blocked('The first bounded take is fixed to the approved Eleven v3 final-expressive role.')
  }
  const model = capability.models.find((entry) => entry.modelId === 'eleven_v3')
  if (!model || model.availability !== 'available' || request.spokenText.length > (model.maximumTextCharacters ?? 0)) {
    blocked('Eleven v3 is unavailable or the exact spoken segment exceeds its current limit.')
  }
  const emittedFields: MotionStudioSpeechCapabilityField[] = [
    'text_to_speech',
    ...(request.previousContext || request.followingContext ? ['context_before_after' as const] : []),
    'character_alignment',
    'mp3_44100_128_output',
  ]
  for (const field of emittedFields) {
    const evidence = model.fields.find((entry) => entry.field === field)
    if (!evidence || evidence.support !== 'supported') {
      blocked(`C2 speech compiler field ${field} is ${evidence?.support ?? 'unknown'} for the exact capability snapshot.`)
    }
  }
  const body: MotionStudioElevenLabsTimingBody = {
    text: request.spokenText,
    model_id: 'eleven_v3',
    ...(request.previousContext ? { previous_text: request.previousContext } : {}),
    ...(request.followingContext ? { next_text: request.followingContext } : {}),
  }
  const compiledBase = {
    adapterId: MOTION_STUDIO_ELEVENLABS_TIMING_ADAPTER_ID,
    method: 'POST' as const,
    endpoint: `${MOTION_STUDIO_ELEVENLABS_TIMING_ENDPOINT}/${encodeURIComponent(input.providerVoiceId)}/with-timestamps`,
    query: { output_format: 'mp3_44100_128' as const, enable_logging: 'false' as const },
    fixedHeaders: { 'Content-Type': 'application/json' as const },
    credentialReferenceId: authority.credentialReferenceId,
    credentialBindingDigest: authority.credentialBindingDigest,
    executionAuthorityId: authority.authorityId,
    executionAuthorityDigest: authority.authorityDigest,
    normalizedRequestDigest: authority.speechRequestDigest,
    voiceIdentityHash: request.voice.voiceIdentityHash,
    body,
    emittedFields,
    providerOutput: 'audio/mpeg' as const,
    canonicalNormalizationTarget: request.output,
    containsPrivateText: true as const,
    safeToLogBody: false as const,
    maximumProviderCallCount: 1 as const,
    automaticRetryAllowed: false as const,
    automaticFallbackAllowed: false as const,
  }
  const compiled = deepFreeze<MotionStudioCompiledElevenLabsTimingRequest>({
    ...compiledBase,
    compiledRequestDigest: sha256CanonicalJson({
      ...compiledBase,
      endpoint: `${MOTION_STUDIO_ELEVENLABS_TIMING_ENDPOINT}/{voice_identity_hash}/with-timestamps`,
    }),
  })
  compiledIntegrity.set(compiled, integrityDigest(compiled))
  return compiled
}

export function assertMotionStudioCompiledElevenLabsTimingRequestIntegrity(
  request: MotionStudioCompiledElevenLabsTimingRequest,
): void {
  const expected = compiledIntegrity.get(request)
  if (!expected) blocked('C2 speech request was not produced by the frozen in-process compiler.')
  if (integrityDigest(request) !== expected) blocked('C2 speech request changed after compilation.')
}

export function parseMotionStudioElevenLabsTimingResponse(input: {
  value: unknown
  expectedSpokenText: string
}): ParsedMotionStudioElevenLabsTimingResponse {
  const value = input.value
  if (!input.expectedSpokenText || input.expectedSpokenText.length > 5_000) {
    invalid('Expected speech text is outside the bounded Eleven v3 contract.')
  }
  const record = exactRecord(value, ['audio_base64', 'alignment', 'normalized_alignment'])
  const audioBase64 = record.audio_base64
  if (typeof audioBase64 !== 'string' || audioBase64.length < 16 || audioBase64.length > 12 * 1024 * 1024) {
    invalid('ElevenLabs timing response contains invalid audio data.')
  }
  const audioBytes = Buffer.from(audioBase64, 'base64')
  if (audioBytes.toString('base64') !== audioBase64 || audioBytes.byteLength < 64 || audioBytes.byteLength > 8 * 1024 * 1024) {
    invalid('ElevenLabs timing audio is outside the bounded canonical base64 contract.')
  }
  if (!isMp3(audioBytes)) invalid('ElevenLabs timing audio is not an MP3 payload.')
  const alignment = parseAlignment(record.alignment, 'alignment')
  const normalizedAlignment = parseAlignment(record.normalized_alignment, 'normalized_alignment')
  if (alignment.characters.join('') !== input.expectedSpokenText) {
    blocked('ElevenLabs character alignment does not bind the exact approved spoken text.')
  }
  const audioSha256 = createHash('sha256').update(audioBytes).digest('hex')
  return {
    audioBytes,
    audioSha256,
    audioByteLength: audioBytes.byteLength,
    mimeType: 'audio/mpeg',
    alignment,
    normalizedAlignment,
    responseDigest: sha256CanonicalJson({ audioSha256, alignment, normalizedAlignment }),
    providerResponseUsagePresent: false,
    providerCostReconciliationRequired: true,
  }
}

function parseAlignment(value: unknown, label: string): MotionStudioElevenLabsCharacterAlignment {
  const record = exactRecord(value, [
    'characters', 'character_start_times_seconds', 'character_end_times_seconds',
  ])
  if (
    !Array.isArray(record.characters) || !Array.isArray(record.character_start_times_seconds) ||
    !Array.isArray(record.character_end_times_seconds) || record.characters.length < 1 ||
    record.characters.length > 8_000 || record.characters.length !== record.character_start_times_seconds.length ||
    record.characters.length !== record.character_end_times_seconds.length
  ) invalid(`ElevenLabs ${label} arrays do not share one bounded character count.`)
  const characters = record.characters.map((character) => {
    if (typeof character !== 'string' || character.length < 1 || character.length > 8) invalid(`ElevenLabs ${label} contains an invalid character.`)
    return character
  })
  const starts = record.character_start_times_seconds.map((entry) => exactTime(entry, label))
  const ends = record.character_end_times_seconds.map((entry) => exactTime(entry, label))
  for (let index = 0; index < characters.length; index += 1) {
    if (
      ends[index]! < starts[index]! ||
      (index > 0 && (starts[index]! < starts[index - 1]! || ends[index]! < ends[index - 1]!))
    ) {
      invalid(`ElevenLabs ${label} timing is not monotonic.`)
    }
  }
  return {
    characters,
    characterStartTimesSeconds: starts,
    characterEndTimesSeconds: ends,
  }
}

function exactTime(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 120) {
    invalid(`ElevenLabs ${label} contains an invalid time.`)
  }
  return value
}

function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('ElevenLabs response shape is invalid.')
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) invalid('ElevenLabs response contains unknown or missing fields.')
  return record
}

function isMp3(bytes: Buffer): boolean {
  return bytes.subarray(0, 3).toString('ascii') === 'ID3' ||
    (bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0)
}

function integrityDigest(request: MotionStudioCompiledElevenLabsTimingRequest): string {
  return sha256CanonicalJson(request)
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  if (Array.isArray(value)) value.forEach(deepFreeze)
  else Object.values(value as Record<string, unknown>).forEach(deepFreeze)
  return Object.freeze(value)
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
