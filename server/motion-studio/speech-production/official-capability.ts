import type {
  MotionStudioSpeechCapabilityField,
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechCapabilitySupport,
  MotionStudioSpeechModelId,
  MotionStudioSpeechModelRole,
} from '../../../src/types/motion-studio'
import { motionStudioSpeechCapabilitySnapshotV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

export const MOTION_STUDIO_OFFICIAL_SPEECH_DISCOVERY_DATE = '2026-07-17' as const

export const MOTION_STUDIO_OFFICIAL_SPEECH_DISCOVERY_SOURCES = Object.freeze({
  models: 'https://elevenlabs.io/docs/overview/models',
  createSpeech: 'https://elevenlabs.io/docs/api-reference/text-to-speech/convert',
  createSpeechWithTiming: 'https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps',
  streamSpeechWithTiming: 'https://elevenlabs.io/docs/api-reference/text-to-speech/stream-with-timestamps',
  pronunciation: 'https://elevenlabs.io/docs/eleven-api/guides/how-to/text-to-speech/pronunciation-dictionaries',
  prompting: 'https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices',
})

const fields: readonly MotionStudioSpeechCapabilityField[] = [
  'text_to_speech', 'context_before_after', 'pronunciation_dictionary',
  'audio_tags', 'character_alignment', 'word_alignment', 'streaming',
  'mp3_44100_128_output', 'pcm_48000_output', 'response_usage', 'speed',
  'stability', 'similarity_boost', 'speaker_boost', 'style', 'ssml_breaks',
]

const roles: Record<MotionStudioSpeechModelId, MotionStudioSpeechModelRole> = {
  eleven_v3: 'final_expressive',
  eleven_multilingual_v2: 'stability_fallback',
  eleven_flash_v2_5: 'audition_or_temporary',
}

const textLimits: Record<MotionStudioSpeechModelId, number> = {
  eleven_v3: 5_000,
  eleven_multilingual_v2: 10_000,
  eleven_flash_v2_5: 40_000,
}

export function createMotionStudioOfficialSpeechCapabilitySnapshot(input: {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  capabilitySnapshotId: string
  capturedAt: string
  expiresAt: string
}): MotionStudioSpeechCapabilitySnapshotV1 {
  const modelIds: readonly MotionStudioSpeechModelId[] = [
    'eleven_v3', 'eleven_multilingual_v2', 'eleven_flash_v2_5',
  ]
  const base = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    productionId: input.productionId,
    schemaVersion: 'motion-studio.speech-capability-snapshot.v1' as const,
    capabilitySnapshotId: input.capabilitySnapshotId,
    provider: 'elevenlabs' as const,
    discoveryKind: 'official_read_only_discovery' as const,
    discoveryAuthorityDigests: [
      '7bef3a36f0576ae5c22ab0d0ec3299f88591300a2c81db0a2b625e4ea134375b',
      '1e7b57a7ffa7311cb43608d3bb0df500d4751e917ae5e920ed6f02ad189eeb33',
      '6a2e45168f13cf6649fcc417b468b4f027bf0860ec021f5a6196a340500c3b39',
    ],
    evidenceSourceCodes: [
      'official_models_catalog_2026_07_17',
      'official_create_speech_2026_07_17',
      'official_create_speech_timing_2026_07_17',
      'official_stream_speech_timing_2026_07_17',
      'official_pronunciation_guide_2026_07_17',
      'official_tts_best_practices_2026_07_17',
    ],
    models: modelIds.map((modelId) => ({
      modelId,
      role: roles[modelId],
      availability: 'available' as const,
      maximumTextCharacters: textLimits[modelId],
      fields: fields.map((field) => {
        const support = officialSupport(modelId, field)
        return { field, support, evidenceCode: evidenceCode(modelId, field, support) }
      }),
    })),
    capturedAt: new Date(input.capturedAt).toISOString(),
    expiresAt: new Date(input.expiresAt).toISOString(),
    externalDiscoveryPerformed: true,
    externalTransportAllowed: false as const,
    providerExecutionAllowed: false as const,
    immutable: true as const,
  }
  return motionStudioSpeechCapabilitySnapshotV1Schema.parse({
    ...base,
    evidenceDigest: sha256CanonicalJson(base),
  })
}

export function assertMotionStudioOfficialSpeechCapabilitySnapshotIntegrity(
  input: MotionStudioSpeechCapabilitySnapshotV1,
): MotionStudioSpeechCapabilitySnapshotV1 {
  const snapshot = motionStudioSpeechCapabilitySnapshotV1Schema.parse(input)
  if (snapshot.discoveryKind !== 'official_read_only_discovery') {
    throw new ApiError('VALIDATION_FAILED', 'Official speech discovery integrity requires an official read-only snapshot.', 400)
  }
  const { evidenceDigest, ...digestAuthority } = snapshot
  if (sha256CanonicalJson(digestAuthority) !== evidenceDigest) {
    throw new ApiError('MOTION_STUDIO_CONFLICT', 'Official speech capability evidence digest does not match.', 409)
  }
  return snapshot
}

function officialSupport(
  modelId: MotionStudioSpeechModelId,
  field: MotionStudioSpeechCapabilityField,
): MotionStudioSpeechCapabilitySupport {
  if ([
    'text_to_speech', 'context_before_after', 'pronunciation_dictionary',
    'character_alignment', 'streaming', 'mp3_44100_128_output', 'stability',
  ].includes(field)) return 'supported'
  if (field === 'audio_tags') return modelId === 'eleven_v3' ? 'supported' : 'unsupported'
  if (['word_alignment', 'pcm_48000_output', 'response_usage', 'style'].includes(field)) return 'unknown'
  if (['speed', 'similarity_boost', 'speaker_boost'].includes(field)) {
    return modelId === 'eleven_v3' ? 'unsupported' : 'supported'
  }
  if (field === 'ssml_breaks') return modelId === 'eleven_v3' ? 'unsupported' : 'supported'
  return 'unknown'
}

function evidenceCode(
  modelId: MotionStudioSpeechModelId,
  field: MotionStudioSpeechCapabilityField,
  support: MotionStudioSpeechCapabilitySupport,
): string {
  if (field === 'mp3_44100_128_output') return 'official_default_mp3_44100_128_2026_07_17'
  if (field === 'pcm_48000_output') return 'official_output_enum_pcm48_not_exposed_2026_07_17'
  if (field === 'response_usage') return 'official_timing_response_usage_not_documented_2026_07_17'
  if (field === 'style') return `official_${modelId}_style_not_exact_2026_07_17`
  if (field === 'audio_tags') return `official_v3_audio_tags_${support}_2026_07_17`
  if (field === 'ssml_breaks') return `official_v3_ssml_exception_${support}_2026_07_17`
  if (['speed', 'similarity_boost', 'speaker_boost'].includes(field)) {
    return `official_v3_setting_exception_${field}_${support}_2026_07_17`
  }
  if (field === 'character_alignment') return 'official_timing_character_alignment_response_2026_07_17'
  if (field === 'word_alignment') return 'official_word_alignment_not_documented_2026_07_17'
  if (field === 'streaming') return 'official_timed_stream_endpoint_2026_07_17'
  if (field === 'context_before_after') return 'official_request_context_fields_2026_07_17'
  if (field === 'pronunciation_dictionary') return 'official_pronunciation_locators_2026_07_17'
  if (field === 'stability') return 'official_voice_stability_control_2026_07_17'
  return 'official_current_tts_model_catalog_2026_07_17'
}
