import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'

import {
  deriveCanonicalStorytellingSpeechSourceAuthorityDigest,
  validateCanonicalStorytellingSpeechNormalizationPayload,
} from '../../edit-architecture/canonical-storytelling-speech-normalization-authority'
import { ApiError } from '../../errors/api-error'
import {
  APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
  validateOfflineFfmpegStreamingExecutionRequest,
  type OfflineFfmpegStreamingExecutionRequest,
} from '../../tool-execution/media-binary-execution'
import type {
  OfflineMediaBinaryServerInjectedInput,
} from '../../tool-execution/media-binary-execution/offline-media-binary-runtime'
import { sha256CanonicalJson } from '../commands/canonical-json'

const SHA256 = /^[a-f0-9]{64}$/u
const MAXIMUM_SOURCE_AUDIO_BYTES = 16 * 1024 * 1024

export interface CanonicalMotionStudioSpeechNormalizationExecutionInput {
  productionId: string
  productionAuthorityDigest: string
  providerOutputAuthorityDigest: string
  preparedScriptSegmentId: string
  sceneId: string
  voiceBibleVersionId: string
  voiceBibleContentDigest: string
  spokenTextDigest: string
  timingAuthorityDigest: string
  startFrame: number
  endFrameExclusive: number
  frameRate: 24 | 30
  sourceAudio: {
    mimeType: 'audio/mpeg'
    bytes: Buffer
    byteLength: number
    sha256: string
  }
  alignmentBinding: {
    contentSha256: string
    sourceAudioSha256: string
    preparedScriptSegmentId: string
    voiceBibleContentDigest: string
    spokenTextDigest: string
    timingAuthorityDigest: string
  }
}

export interface CanonicalMotionStudioSpeechNormalizationExecution {
  request: OfflineFfmpegStreamingExecutionRequest
  source: OfflineMediaBinaryServerInjectedInput
  productionAuthorityHash: string
  sourceAuthorityDigest: string
  alignmentBindingDigest: string
}

/**
 * Compiles Motion-owned, source-verified Speech evidence into the one canonical
 * server-injected FFmpeg recipe. It creates no queue, lease, dispatch, storage,
 * cost, provider, or promotion authority.
 */
export function compileCanonicalMotionStudioSpeechNormalizationExecution(
  input: CanonicalMotionStudioSpeechNormalizationExecutionInput,
): CanonicalMotionStudioSpeechNormalizationExecution {
  assertDigest(input.productionAuthorityDigest, 'production authority')
  assertDigest(input.providerOutputAuthorityDigest, 'provider output authority')
  assertDigest(input.voiceBibleContentDigest, 'Voice Bible content')
  assertDigest(input.spokenTextDigest, 'spoken text')
  assertDigest(input.timingAuthorityDigest, 'timing authority')
  assertDigest(input.alignmentBinding.contentSha256, 'alignment content')
  assertDigest(input.sourceAudio.sha256, 'source audio')

  const sourceBytes = Buffer.from(input.sourceAudio.bytes)
  const actualSourceSha256 = createHash('sha256').update(sourceBytes).digest('hex')
  if (
    input.sourceAudio.mimeType !== 'audio/mpeg' ||
    sourceBytes.byteLength !== input.sourceAudio.byteLength ||
    sourceBytes.byteLength < 64 ||
    sourceBytes.byteLength > MAXIMUM_SOURCE_AUDIO_BYTES ||
    actualSourceSha256 !== input.sourceAudio.sha256
  ) {
    invalid('Storytelling Speech source audio failed its exact private-byte commitment.')
  }
  if (
    input.alignmentBinding.sourceAudioSha256 !== input.sourceAudio.sha256 ||
    input.alignmentBinding.preparedScriptSegmentId !== input.preparedScriptSegmentId ||
    input.alignmentBinding.voiceBibleContentDigest !== input.voiceBibleContentDigest ||
    input.alignmentBinding.spokenTextDigest !== input.spokenTextDigest ||
    input.alignmentBinding.timingAuthorityDigest !== input.timingAuthorityDigest
  ) {
    invalid('Storytelling Speech alignment is not bound to the exact audio, segment, Voice Bible, text, and timing authority.')
  }

  const alignmentBindingDigest = sha256CanonicalJson({
    domain: 'motion-studio:storytelling-speech-alignment-binding:v1',
    sourceAudioSha256: input.sourceAudio.sha256,
    alignmentContentSha256: input.alignmentBinding.contentSha256,
    preparedScriptSegmentId: input.preparedScriptSegmentId,
    voiceBibleContentDigest: input.voiceBibleContentDigest,
    spokenTextDigest: input.spokenTextDigest,
    timingAuthorityDigest: input.timingAuthorityDigest,
  })
  const productionAuthorityHash = sha256CanonicalJson({
    domain:
      'motion-studio:canonical-storytelling-speech-normalization-production-authority:v1',
    productionId: input.productionId,
    productionAuthorityDigest: input.productionAuthorityDigest,
    providerOutputAuthorityDigest: input.providerOutputAuthorityDigest,
    preparedScriptSegmentId: input.preparedScriptSegmentId,
    sceneId: input.sceneId,
    voiceBibleVersionId: input.voiceBibleVersionId,
    voiceBibleContentDigest: input.voiceBibleContentDigest,
    spokenTextDigest: input.spokenTextDigest,
    timingAuthorityDigest: input.timingAuthorityDigest,
    startFrame: input.startFrame,
    endFrameExclusive: input.endFrameExclusive,
    frameRate: input.frameRate,
    sourceAudioSha256: input.sourceAudio.sha256,
    alignmentBindingDigest,
  })
  const payloadWithoutSourceAuthority = {
    recipeProfileId:
      APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID,
    timestampPolicy: 'normalize_from_zero' as const,
    overwriteExistingArtifact: false as const,
    allowUnreviewedCodec: false as const,
    sampleRate: 48_000 as const,
    channelMode: 'mono' as const,
    sampleFormat: 'pcm_s16le' as const,
    metadataPolicy: 'strip_all' as const,
    maximumDurationSeconds: 30 as const,
    productionId: input.productionId,
    productionAuthorityHash,
    preparedScriptSegmentId: input.preparedScriptSegmentId,
    sceneId: input.sceneId,
    voiceBibleVersionId: input.voiceBibleVersionId,
    voiceBibleContentDigest: input.voiceBibleContentDigest,
    spokenTextDigest: input.spokenTextDigest,
    timingAuthorityDigest: input.timingAuthorityDigest,
    startFrame: input.startFrame,
    endFrameExclusive: input.endFrameExclusive,
    frameRate: input.frameRate,
    sourceProviderOperationId:
      'provider.elevenlabs.generate_storytelling_speech_candidate.v1' as const,
    sourceAudioRole: 'provider_storytelling_speech_audio_mp3' as const,
    sourceAlignmentRole:
      'provider_storytelling_speech_alignment_json' as const,
    alignmentBoundToExactSourceAudio: true as const,
  }
  const sourceAuthorityDigest =
    deriveCanonicalStorytellingSpeechSourceAuthorityDigest(
      payloadWithoutSourceAuthority,
    )
  const planningPayload = validateCanonicalStorytellingSpeechNormalizationPayload({
    ...payloadWithoutSourceAuthority,
    sourceAuthorityDigest,
  })
  const request = validateOfflineFfmpegStreamingExecutionRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    payload: {
      ...planningPayload,
      mimeType: 'audio/mpeg',
      sourceByteLength: sourceBytes.byteLength,
      sourceSha256: input.sourceAudio.sha256,
      sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
    },
  })
  const source: OfflineMediaBinaryServerInjectedInput = Object.freeze({
    inputMode: 'private_verified_stream_v1' as const,
    byteLength: sourceBytes.byteLength,
    sha256: input.sourceAudio.sha256,
    openStream: async () => Readable.from([Buffer.from(sourceBytes)]),
  })
  return Object.freeze({
    request,
    source,
    productionAuthorityHash,
    sourceAuthorityDigest,
    alignmentBindingDigest,
  })
}

function assertDigest(value: string, field: string): void {
  if (!SHA256.test(value)) invalid(`Storytelling Speech ${field} digest is malformed.`)
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 409, {
    requiredGate: 'canonical_storytelling_speech_normalization_authority',
  })
}
