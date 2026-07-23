import type { ISODateString } from '../shared'
import type {
  MotionStudioAudioAssetVersionRef,
  MotionStudioAudioFrameRange,
  MotionStudioPronunciationEntryV1,
  MotionStudioVoicePerformancePlanV1,
} from './audio'
import type { MotionStudioOwnership, MotionStudioVersionReference } from './shared'

export const MOTION_STUDIO_SPEECH_CAPABILITY_SCHEMA_VERSION =
  'motion-studio.speech-capability-snapshot.v1' as const
export const MOTION_STUDIO_SPEECH_REQUEST_SCHEMA_VERSION =
  'motion-studio.speech-segment-request.v1' as const
export const MOTION_STUDIO_SPEECH_PROTOCOL_ADAPTER_ID =
  'motion_studio_speech_protocol_simulator_v1' as const

export type MotionStudioSpeechModelId =
  | 'eleven_v3'
  | 'eleven_multilingual_v2'
  | 'eleven_flash_v2_5'

export type MotionStudioSpeechModelRole =
  | 'final_expressive'
  | 'stability_fallback'
  | 'audition_or_temporary'

export type MotionStudioSpeechModelSetting = 'auto' | 'explicit'

export type MotionStudioSpeechCapabilityField =
  | 'text_to_speech'
  | 'context_before_after'
  | 'pronunciation_dictionary'
  | 'audio_tags'
  | 'character_alignment'
  | 'word_alignment'
  | 'streaming'
  | 'mp3_44100_128_output'
  | 'pcm_48000_output'
  | 'response_usage'
  | 'speed'
  | 'stability'
  | 'similarity_boost'
  | 'speaker_boost'
  | 'style'
  | 'ssml_breaks'

export type MotionStudioSpeechCapabilitySupport =
  | 'supported'
  | 'unsupported'
  | 'unknown'

export interface MotionStudioSpeechCapabilityFieldEvidenceV1 {
  field: MotionStudioSpeechCapabilityField
  support: MotionStudioSpeechCapabilitySupport
  evidenceCode: string
}

export interface MotionStudioSpeechModelCapabilityV1 {
  modelId: MotionStudioSpeechModelId
  role: MotionStudioSpeechModelRole
  availability: 'protocol_fixture_only' | 'available' | 'unavailable' | 'unknown'
  maximumTextCharacters?: number
  fields: readonly MotionStudioSpeechCapabilityFieldEvidenceV1[]
}

export interface MotionStudioSpeechCapabilitySnapshotV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_SPEECH_CAPABILITY_SCHEMA_VERSION
  productionId: string
  capabilitySnapshotId: string
  provider: 'elevenlabs'
  discoveryKind: 'protocol_fixture' | 'official_read_only_discovery'
  discoveryAuthorityDigests: readonly string[]
  evidenceSourceCodes: readonly string[]
  evidenceDigest: string
  models: readonly MotionStudioSpeechModelCapabilityV1[]
  capturedAt: ISODateString
  expiresAt?: ISODateString
  externalDiscoveryPerformed: boolean
  externalTransportAllowed: false
  providerExecutionAllowed: false
  immutable: true
}

interface MotionStudioSpeechVoiceBindingBaseV1 {
  voiceBindingId: string
  provider: 'elevenlabs'
  voiceIdentityHash: string
  bindingEvidenceId: string
  voiceProfileReference: string
  customVoice: false
  voiceSampleAccepted: false
  cloningAuthorized: false
  dubbingAuthorized: false
  rightsEvidenceId: string
  retentionPolicyId: string
}

export type MotionStudioSpeechVoiceBindingV1 = MotionStudioSpeechVoiceBindingBaseV1 & (
  | {
      catalogBindingStatus: 'protocol_fixture_only'
      verifiedProviderCatalogVoice: false
    }
  | {
      catalogBindingStatus: 'verified_provider_catalog'
      verifiedProviderCatalogVoice: true
      catalogVerifiedAt: ISODateString
    }
)

export type MotionStudioSpeechConsentV1 =
  | {
      status: 'protocol_fixture_only'
      evidenceId: string
      cloningAuthorized: false
      dubbingAuthorized: false
    }
  | {
      status: 'provider_catalog_rights_verified'
      evidenceId: string
      cloningAuthorized: false
      dubbingAuthorized: false
    }

export type MotionStudioSpeechExecutionBoundaryV1 =
  | {
      protocolSimulatorOnly: true
      externalTransportAllowed: false
      providerExecutionAllowed: false
      providerCallMaximum: 0
      maximumAuthorizedProviderCostMicros: 0
      maximumAuthorizedLocalComputeCostMicros: 0
      maximumAuthorizedTotalInternalCostMicros: 0
      timelineMutationAllowed: false
      finalSelectionAllowed: false
      customerPricingIncluded: false
      customerCreditsIncluded: false
    }
  | {
      protocolSimulatorOnly: false
      externalTransportAllowed: true
      providerExecutionAllowed: true
      providerCallMaximum: 1
      maximumAuthorizedProviderCostMicros: number
      maximumAuthorizedLocalComputeCostMicros: number
      maximumAuthorizedTotalInternalCostMicros: number
      timelineMutationAllowed: false
      finalSelectionAllowed: false
      customerPricingIncluded: false
      customerCreditsIncluded: false
    }

export type MotionStudioSpeechAudioTagKind =
  | 'calm'
  | 'serious'
  | 'soft_emphasis'
  | 'restrained_urgency'
  | 'measured_pause'

export interface MotionStudioSpeechAudioTagInstructionV1 {
  instructionId: string
  kind: MotionStudioSpeechAudioTagKind
  appliesToText: string
  meaningPreserved: true
  approvedEvidenceId: string
}

export interface MotionStudioSpeechModelSelectionV1 {
  setting: MotionStudioSpeechModelSetting
  intendedRole: MotionStudioSpeechModelRole
  requestedModelId?: MotionStudioSpeechModelId
  fallbackAllowed: false
  automaticFallback: false
}

export interface MotionStudioSpeechSegmentRequestV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_SPEECH_REQUEST_SCHEMA_VERSION
  productionId: string
  speechRequestId: string
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  approvedWorkItemId: string
  jobId: string
  attemptId: string
  leaseId: string
  costBudgetId: string
  idempotencyKeyHash: string
  preparedScriptArtifactVersion: MotionStudioVersionReference
  voiceBibleArtifactVersion: MotionStudioVersionReference
  voiceBibleContentDigest: string
  voiceSegmentId: string
  preparedScriptSegmentId: string
  chapterId: string
  sceneId: string
  timingAuthorityDigest: string
  range: MotionStudioAudioFrameRange
  displayText: string
  spokenText: string
  preparedMeaningDigest: string
  spokenMeaningDigest: string
  meaningPreserved: true
  language: string
  previousContext?: string
  followingContext?: string
  pronunciationEntries: readonly MotionStudioPronunciationEntryV1[]
  performance: MotionStudioVoicePerformancePlanV1
  audioTagInstructions: readonly MotionStudioSpeechAudioTagInstructionV1[]
  voice: MotionStudioSpeechVoiceBindingV1
  modelSelection: MotionStudioSpeechModelSelectionV1
  capabilitySnapshotId: string
  capabilitySnapshotDigest: string
  output: {
    container: 'wav'
    codec: 'pcm_s16le'
    sampleRateHertz: 48_000
    channelCount: 1
  }
  attemptPolicy: {
    maximumAttempts: 1
    automaticRetry: false
    automaticFallback: false
  }
  consent: MotionStudioSpeechConsentV1
  disclosure: {
    aiGenerated: true
    disclosureRequired: true
    disclosureCode: 'ai_generated_voice'
    disclosureReviewed: true
  }
  executionBoundary: MotionStudioSpeechExecutionBoundaryV1
  immutable: true
}

export interface MotionStudioSpeechResolvedRouteV1 {
  setting: MotionStudioSpeechModelSetting
  intendedRole: MotionStudioSpeechModelRole
  selectedModelId: MotionStudioSpeechModelId
  capabilitySnapshotId: string
  capabilitySnapshotDigest: string
  resolutionReason: string
  protocolFixtureOnly: true
  externalExecutionEligible: false
  fallbackPerformed: false
}

export interface MotionStudioSpeechProtocolEnvelopeV1 {
  schemaVersion: 'motion-studio.speech-protocol-envelope.v1'
  adapterId: typeof MOTION_STUDIO_SPEECH_PROTOCOL_ADAPTER_ID
  executionClass: 'protocol_simulator'
  requestId: string
  requestDigest: string
  route: MotionStudioSpeechResolvedRouteV1
  voiceBindingId: string
  spokenText: string
  previousContext?: string
  followingContext?: string
  language: string
  pronunciationEntries: readonly MotionStudioPronunciationEntryV1[]
  performance: MotionStudioVoicePerformancePlanV1
  audioTagInstructions: readonly MotionStudioSpeechAudioTagInstructionV1[]
  emittedFields: readonly MotionStudioSpeechCapabilityField[]
  output: MotionStudioSpeechSegmentRequestV1['output']
  externalNetworkAllowed: false
  outputIsProviderGenerated: false
  automaticRetry: false
  automaticFallback: false
}

export interface MotionStudioSpeechProtocolAttemptV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.speech-protocol-attempt.v1'
  productionId: string
  speechRequestId: string
  requestDigest: string
  approvedSnapshotId: string
  approvedWorkItemId: string
  jobId: string
  attemptId: string
  leaseId: string
  costBudgetId: string
  idempotencyKeyHash: string
  attemptNumber: 1
  state: 'protocol_completed'
  executionClass: 'protocol_simulator'
  outcome: 'protocol_fixture_created'
  providerSubmissionPerformed: false
  providerOperationIdentityPresent: false
  externalRequestCount: 0
  automaticRetry: false
  fallbackPerformed: false
  outcomeUnknown: false
  startedAt: ISODateString
  completedAt: ISODateString
  immutable: true
}

export type MotionStudioSpeechQaGate =
  | 'request_integrity'
  | 'file_integrity'
  | 'format'
  | 'non_silent'
  | 'meaning_fidelity'
  | 'consent_rights'
  | 'disclosure'
  | 'no_auto_selection'

export interface MotionStudioSpeechQaGateResultV1 {
  gate: MotionStudioSpeechQaGate
  result: 'passed' | 'not_evaluated'
  blocking: true
  evidenceId: string
}

export interface MotionStudioSpeechProtocolCandidateV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.speech-protocol-candidate.v1'
  productionId: string
  candidateTakeId: string
  speechRequestId: string
  requestDigest: string
  voiceSegmentId: string
  approvedSnapshotId: string
  approvedWorkItemId: string
  jobId: string
  attemptId: string
  leaseId: string
  costBudgetId: string
  idempotencyKeyHash: string
  attemptNumber: 1
  modelId: MotionStudioSpeechModelId
  voiceBindingId: string
  source: 'protocol_simulator_fixture'
  audioAssetVersion: MotionStudioAudioAssetVersionRef
  byteLength: number
  audioSha256: string
  mimeType: 'audio/wav'
  codec: 'pcm_s16le'
  sampleRateHertz: 48_000
  channelCount: 1
  sampleCountPerChannel: number
  durationMilliseconds: number
  qaGateResults: readonly MotionStudioSpeechQaGateResultV1[]
  qaEvidenceDigest: string
  reviewStatus: 'not_reviewable_protocol'
  selected: false
  firstTakeAutoAccepted: false
  finalAssetEligible: false
  privateEvidenceOnly: true
  providerExecutionPerformed: false
  providerCallCount: 0
  providerCostMicros: 0
  internalProductionCostMicros: 0
  customerPricingIncluded: false
  customerCreditsIncluded: false
  timelineMutationPerformed: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioSpeechProtocolUsageV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.speech-protocol-usage.v1'
  productionId: string
  usageRecordId: string
  speechRequestId: string
  requestDigest: string
  attemptId: string
  candidateTakeId: string
  costBudgetId: string
  rateCardSnapshotId: string
  meteringClass: 'protocol_zero_cost'
  outputByteLength: number
  outputDurationMilliseconds: number
  providerUsageUnits: 0
  providerCostMicros: 0
  localComputeCostMicros: 0
  internalProductionCostMicros: 0
  customerPricingIncluded: false
  customerCreditsIncluded: false
  billingMutationPerformed: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioSpeechProtocolAlignmentV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.speech-protocol-alignment.v1'
  productionId: string
  alignmentRecordId: string
  speechRequestId: string
  requestDigest: string
  candidateTakeId: string
  audioSha256: string
  timingAuthorityDigest: string
  state: 'not_evaluated_protocol'
  source: 'none'
  wordTimings: readonly never[]
  blockingForSelection: true
  captionMutationPerformed: false
  masterTimingMutationPerformed: false
  createdAt: ISODateString
  immutable: true
}

export type MotionStudioSpeechProtocolSelectionBlocker =
  | 'protocol_fixture'
  | 'meaning_not_evaluated'
  | 'rights_not_evaluated'
  | 'alignment_not_evaluated'

export interface MotionStudioSpeechProtocolSelectionStateV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.speech-protocol-selection-state.v1'
  productionId: string
  selectionStateId: string
  speechRequestId: string
  candidateTakeId: string
  qaEvidenceDigest: string
  alignmentRecordId: string
  state: 'ineligible_protocol'
  blockers: readonly MotionStudioSpeechProtocolSelectionBlocker[]
  ownerReviewRecorded: false
  selectionDecisionCreated: false
  selected: false
  finalNarrationMutationPerformed: false
  timelineMutationPerformed: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioSpeechProtocolBundleV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.speech-protocol-bundle.v1'
  productionId: string
  capabilitySnapshot: MotionStudioSpeechCapabilitySnapshotV1
  request: MotionStudioSpeechSegmentRequestV1
  envelope: MotionStudioSpeechProtocolEnvelopeV1
  attempt: MotionStudioSpeechProtocolAttemptV1
  candidate: MotionStudioSpeechProtocolCandidateV1
  usage: MotionStudioSpeechProtocolUsageV1
  alignment: MotionStudioSpeechProtocolAlignmentV1
  selectionState: MotionStudioSpeechProtocolSelectionStateV1
  outputBytes: Uint8Array
  protocolOnly: true
  externalRequestCount: 0
  providerCostMicros: 0
  timelineMutationPerformed: false
}

export interface MotionStudioSpeechCandidateSummaryDto {
  candidateTakeId: string
  voiceSegmentId: string
  intendedModelRole: MotionStudioSpeechModelRole
  source: 'protocol_simulator_fixture'
  state: 'protocol_fixture_only'
  attemptState: 'protocol_completed'
  usageState: 'protocol_zero_cost'
  alignmentState: 'not_evaluated_protocol'
  selectionState: 'ineligible_protocol'
  durationMilliseconds: number
  reviewStatus: 'not_reviewable_protocol'
  selected: false
  firstTakeAutoAccepted: false
  qaGatesPassed: readonly MotionStudioSpeechQaGate[]
  qaGatesNotEvaluated: readonly MotionStudioSpeechQaGate[]
  providerExecutionPerformed: false
  privateEvidenceOnly: true
}

export interface MotionStudioSpeechWorkspaceDto {
  productionId: string
  state: 'protocol_evidence_ready'
  currentModelSetting: 'auto'
  capabilityState: 'external_discovery_required'
  candidates: readonly MotionStudioSpeechCandidateSummaryDto[]
  cloningEnabled: false
  dubbingEnabled: false
  providerExecutionEnabled: false
  warning: string
}
