import type {
  MotionStudioSpeechCapabilityField,
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechProtocolEnvelopeV1,
  MotionStudioSpeechSegmentRequestV1,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_SPEECH_PROTOCOL_ADAPTER_ID,
} from '../../../src/types/motion-studio'
import {
  motionStudioSpeechCapabilitySnapshotV1Schema,
  motionStudioSpeechProtocolEnvelopeV1Schema,
  motionStudioSpeechSegmentRequestV1Schema,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  requireMotionStudioSpeechProtocolModelCapability,
  resolveMotionStudioSpeechProtocolRoute,
} from './model-router'

export function compileMotionStudioSpeechProtocolRequest(input: {
  request: MotionStudioSpeechSegmentRequestV1
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
}): MotionStudioSpeechProtocolEnvelopeV1 {
  const request = parse(input.request, motionStudioSpeechSegmentRequestV1Schema, 'Speech segment request')
  const capabilitySnapshot = parse(
    input.capabilitySnapshot,
    motionStudioSpeechCapabilitySnapshotV1Schema,
    'Speech capability snapshot',
  )
  assertScope(request, capabilitySnapshot)
  if (
    request.capabilitySnapshotId !== capabilitySnapshot.capabilitySnapshotId ||
    request.capabilitySnapshotDigest !== capabilitySnapshot.evidenceDigest
  ) throw blocked('Speech request does not bind the exact capability snapshot.')

  const route = resolveMotionStudioSpeechProtocolRoute({
    selection: request.modelSelection,
    capabilitySnapshot,
  })
  const model = requireMotionStudioSpeechProtocolModelCapability({ route, capabilitySnapshot })
  const emittedFields: MotionStudioSpeechCapabilityField[] = [
    'text_to_speech',
    ...(request.previousContext || request.followingContext ? ['context_before_after' as const] : []),
    ...(request.pronunciationEntries.length ? ['pronunciation_dictionary' as const] : []),
    ...(request.audioTagInstructions.length ? ['audio_tags' as const] : []),
    'pcm_48000_output',
  ]
  for (const field of emittedFields) {
    const evidence = model.fields.find((entry) => entry.field === field)
    if (!evidence || evidence.support !== 'supported') {
      throw blocked(`Speech compiler field ${field} is ${evidence?.support ?? 'unknown'} for the exact model capability snapshot.`)
    }
  }

  const requestDigest = sha256CanonicalJson(request)
  const candidate: MotionStudioSpeechProtocolEnvelopeV1 = {
    schemaVersion: 'motion-studio.speech-protocol-envelope.v1',
    adapterId: MOTION_STUDIO_SPEECH_PROTOCOL_ADAPTER_ID,
    executionClass: 'protocol_simulator',
    requestId: request.speechRequestId,
    requestDigest,
    route,
    voiceBindingId: request.voice.voiceBindingId,
    spokenText: request.spokenText,
    ...(request.previousContext ? { previousContext: request.previousContext } : {}),
    ...(request.followingContext ? { followingContext: request.followingContext } : {}),
    language: request.language,
    pronunciationEntries: request.pronunciationEntries,
    performance: request.performance,
    audioTagInstructions: request.audioTagInstructions,
    emittedFields,
    output: request.output,
    externalNetworkAllowed: false,
    outputIsProviderGenerated: false,
    automaticRetry: false,
    automaticFallback: false,
  }
  return parse(candidate, motionStudioSpeechProtocolEnvelopeV1Schema, 'Compiled speech protocol envelope')
}

function assertScope(
  request: MotionStudioSpeechSegmentRequestV1,
  snapshot: MotionStudioSpeechCapabilitySnapshotV1,
): void {
  if (
    request.workspaceId !== snapshot.workspaceId || request.projectId !== snapshot.projectId ||
    request.editSessionId !== snapshot.editSessionId || request.productionId !== snapshot.productionId
  ) throw blocked('Speech request and capability evidence must share exact tenant and production scope.')
}

function parse<T>(value: unknown, schema: { safeParse(input: unknown): { success: true; data: T } | { success: false; error: { flatten(): unknown } } }, label: string): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new ApiError('VALIDATION_FAILED', `${label} is invalid.`, 400, result.error.flatten())
  return result.data
}

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
