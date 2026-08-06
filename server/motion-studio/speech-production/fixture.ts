import type {
  MotionStudioSpeechCapabilityField,
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechSegmentRequestV1,
  MotionStudioVersionReference,
} from '../../../src/types/motion-studio'
import { motionStudioSpeechCapabilitySnapshotV1Schema, motionStudioSpeechSegmentRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import { sha256CanonicalJson } from '../commands/canonical-json'

const fields: readonly MotionStudioSpeechCapabilityField[] = [
  'text_to_speech', 'context_before_after', 'pronunciation_dictionary',
  'audio_tags', 'character_alignment', 'word_alignment', 'streaming',
  'mp3_44100_128_output', 'pcm_48000_output', 'response_usage', 'speed',
  'stability', 'similarity_boost', 'speaker_boost', 'style', 'ssml_breaks',
]

export function createMotionStudioSpeechProtocolFixture(input: {
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  preparedScriptArtifactVersion: MotionStudioVersionReference
  voiceBibleArtifactVersion: MotionStudioVersionReference
  voiceBibleContentDigest: string
  voiceSegmentId: string
  preparedScriptSegmentId: string
  chapterId: string
  sceneId: string
  timingAuthorityDigest: string
  startTimingAnchorId: string
  endTimingAnchorId: string
  startFrame: number
  endFrame: number
  createdAt: string
}): {
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  request: MotionStudioSpeechSegmentRequestV1
} {
  const scope = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    productionId: input.productionId,
  }
  const id = (label: string) => deterministicUuid(input.approvedSnapshotDigest, label)
  const model = (
    modelId: 'eleven_v3' | 'eleven_multilingual_v2' | 'eleven_flash_v2_5',
    role: 'final_expressive' | 'stability_fallback' | 'audition_or_temporary',
  ) => ({
    modelId,
    role,
    availability: 'protocol_fixture_only' as const,
    fields: fields.map((field) => ({
      field,
      support: protocolSupport(modelId, field),
      evidenceCode: `protocol_${modelId}_${field}_${protocolSupport(modelId, field)}`,
    })),
  })
  const capabilityBase = {
    ...scope,
    schemaVersion: 'motion-studio.speech-capability-snapshot.v1' as const,
    capabilitySnapshotId: id('speech-capability-snapshot'),
    provider: 'elevenlabs' as const,
    discoveryKind: 'protocol_fixture' as const,
    discoveryAuthorityDigests: [],
    evidenceSourceCodes: ['protocol_fixture_c0'],
    models: [
      model('eleven_v3', 'final_expressive'),
      model('eleven_multilingual_v2', 'stability_fallback'),
      model('eleven_flash_v2_5', 'audition_or_temporary'),
    ],
    capturedAt: new Date(input.createdAt).toISOString(),
    externalDiscoveryPerformed: false,
    externalTransportAllowed: false as const,
    providerExecutionAllowed: false as const,
    immutable: true as const,
  }
  const capabilitySnapshot = motionStudioSpeechCapabilitySnapshotV1Schema.parse({
    ...capabilityBase,
    evidenceDigest: sha256CanonicalJson(capabilityBase),
  })
  const displayText = 'At 5:30, the team reached Abbottabad and reviewed the final route.'
  const spokenText = 'At five thirty, the team reached Ab-bott-a-bad and reviewed the final route.'
  const preparedMeaningDigest = sha256CanonicalJson({ meaning: 'The team arrived at the stated time and reviewed its route.' })
  const tagId = id('performance-tag:serious')
  const request = motionStudioSpeechSegmentRequestV1Schema.parse({
    ...scope,
    schemaVersion: 'motion-studio.speech-segment-request.v1',
    speechRequestId: id('speech-request'),
    approvedSnapshotId: input.approvedSnapshotId,
    approvedSnapshotDigest: input.approvedSnapshotDigest,
    approvedWorkItemId: id('approved-work-item'),
    jobId: id('job'),
    attemptId: id('attempt'),
    leaseId: id('lease'),
    costBudgetId: id('cost-budget'),
    idempotencyKeyHash: sha256CanonicalJson({ scope, operation: 'speech-protocol-fixture' }),
    preparedScriptArtifactVersion: input.preparedScriptArtifactVersion,
    voiceBibleArtifactVersion: input.voiceBibleArtifactVersion,
    voiceBibleContentDigest: input.voiceBibleContentDigest,
    voiceSegmentId: input.voiceSegmentId,
    preparedScriptSegmentId: input.preparedScriptSegmentId,
    chapterId: input.chapterId,
    sceneId: input.sceneId,
    timingAuthorityDigest: input.timingAuthorityDigest,
    range: {
      startTimingAnchorId: input.startTimingAnchorId,
      endTimingAnchorId: input.endTimingAnchorId,
      startFrame: input.startFrame,
      endFrame: input.endFrame,
    },
    displayText,
    spokenText,
    preparedMeaningDigest,
    spokenMeaningDigest: preparedMeaningDigest,
    meaningPreserved: true,
    language: 'en-US',
    previousContext: 'The preceding scene establishes the mission timeline.',
    followingContext: 'The next scene explains the route on a restrained tactical map.',
    pronunciationEntries: [{
      pronunciationId: id('pronunciation:time'),
      writtenForm: '5:30', spokenForm: 'five thirty', language: 'en-US',
      reason: 'number', evidenceId: id('pronunciation-evidence:time'),
    }, {
      pronunciationId: id('pronunciation:abbottabad'),
      writtenForm: 'Abbottabad', spokenForm: 'Ab-bott-a-bad', language: 'en-US',
      reason: 'place_name', evidenceId: id('pronunciation-evidence:abbottabad'),
    }],
    performance: {
      pace: 'measured', energy: 'restrained',
      emotionalDirection: ['Serious documentary restraint'],
      emphasisTerms: ['final route'], pauseBeforeFrames: 0, pauseAfterFrames: 8,
      performanceTagIds: [tagId],
    },
    audioTagInstructions: [{
      instructionId: tagId, kind: 'serious', appliesToText: 'final route',
      meaningPreserved: true, approvedEvidenceId: id('performance-evidence:serious'),
    }],
    voice: {
      voiceBindingId: id('voice-binding'), provider: 'elevenlabs',
      voiceIdentityHash: sha256CanonicalJson({ protocolVoice: 'protocol-fixture-voice' }),
      bindingEvidenceId: id('voice-binding-evidence'),
      voiceProfileReference: 'protocol-fixture-voice',
      catalogBindingStatus: 'protocol_fixture_only',
      verifiedProviderCatalogVoice: false, customVoice: false, voiceSampleAccepted: false,
      cloningAuthorized: false, dubbingAuthorized: false,
      rightsEvidenceId: id('voice-rights-evidence'), retentionPolicyId: id('retention-policy'),
    },
    modelSelection: {
      setting: 'auto', intendedRole: 'final_expressive', fallbackAllowed: false,
      automaticFallback: false,
    },
    capabilitySnapshotId: capabilitySnapshot.capabilitySnapshotId,
    capabilitySnapshotDigest: capabilitySnapshot.evidenceDigest,
    output: { container: 'wav', codec: 'pcm_s16le', sampleRateHertz: 48_000, channelCount: 1 },
    attemptPolicy: { maximumAttempts: 1, automaticRetry: false, automaticFallback: false },
    consent: {
      status: 'protocol_fixture_only', evidenceId: id('voice-consent-evidence'),
      cloningAuthorized: false, dubbingAuthorized: false,
    },
    disclosure: {
      aiGenerated: true, disclosureRequired: true,
      disclosureCode: 'ai_generated_voice', disclosureReviewed: true,
    },
    executionBoundary: {
      protocolSimulatorOnly: true, externalTransportAllowed: false,
      providerExecutionAllowed: false, providerCallMaximum: 0,
      maximumAuthorizedProviderCostMicros: 0, maximumAuthorizedLocalComputeCostMicros: 0,
      maximumAuthorizedTotalInternalCostMicros: 0, timelineMutationAllowed: false,
      finalSelectionAllowed: false, customerPricingIncluded: false,
      customerCreditsIncluded: false,
    },
    immutable: true,
  })
  return { capabilitySnapshot, request }
}

function protocolSupport(
  modelId: 'eleven_v3' | 'eleven_multilingual_v2' | 'eleven_flash_v2_5',
  field: MotionStudioSpeechCapabilityField,
): 'supported' | 'unsupported' | 'unknown' {
  if (['text_to_speech', 'context_before_after', 'pronunciation_dictionary', 'pcm_48000_output'].includes(field)) {
    return 'supported'
  }
  if (field === 'audio_tags') return modelId === 'eleven_v3' ? 'supported' : 'unsupported'
  if (['character_alignment', 'word_alignment', 'streaming', 'mp3_44100_128_output', 'response_usage'].includes(field)) {
    return 'unsupported'
  }
  return 'unknown'
}

function deterministicUuid(inputDigest: string, label: string): string {
  const hex = sha256CanonicalJson({ inputDigest, label }).slice(0, 32).split('')
  hex[12] = '5'
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)
  const value = hex.join('')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}
