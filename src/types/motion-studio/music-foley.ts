import type { ISODateString } from '../shared'
import type {
  MotionStudioAudioFrameRange,
  MotionStudioMusicCueV2,
  MotionStudioSoundEventV1,
} from './audio'
import type { MotionStudioOwnership, MotionStudioVersionReference } from './shared'

export const MOTION_STUDIO_MUSIC_FOLEY_CAPABILITY_SCHEMA_VERSION =
  'motion-studio.music-foley-capability-snapshot.v1' as const
export const MOTION_STUDIO_GENERATED_MUSIC_REQUEST_SCHEMA_VERSION =
  'motion-studio.generated-music-candidate-request.v1' as const
export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_REQUEST_SCHEMA_VERSION =
  'motion-studio.synchronized-foley-candidate-request.v1' as const
export const MOTION_STUDIO_MUSIC_FOLEY_PROTOCOL_ADAPTER_ID =
  'motion_studio_music_foley_protocol_simulator_v1' as const

export type MotionStudioMusicFoleyIntent =
  | 'generated_music_candidate'
  | 'synchronized_foley_candidate'

export type MotionStudioMusicFoleyConfiguredRouteId = 'lyria_3_pro' | 'mmaudio'
export type MotionStudioMusicFoleyCapabilitySupport = 'supported' | 'unsupported' | 'unknown'

export type MotionStudioGeneratedMusicCapabilityField =
  | 'text_prompt'
  | 'negative_instructions'
  | 'instrumental_only'
  | 'duration_control'
  | 'wav_output'
  | 'response_usage'
  | 'seed_control'
  | 'reference_audio'
  | 'asynchronous_status'
  | 'temporary_download'
  | 'cancellation'
  | 'retention_metadata'

export type MotionStudioSynchronizedFoleyCapabilityField =
  | 'video_conditioning'
  | 'text_prompt'
  | 'visible_event_grounding'
  | 'dialogue_suppression'
  | 'music_suppression'
  | 'exact_sound_suppression'
  | 'duration_control'
  | 'wav_output'
  | 'response_usage'
  | 'asynchronous_status'
  | 'temporary_download'
  | 'cancellation'
  | 'retention_metadata'

export interface MotionStudioMusicFoleyCapabilityFieldEvidenceV1<TField extends string> {
  field: TField
  support: MotionStudioMusicFoleyCapabilitySupport
  evidenceCode: string
}

interface MotionStudioMusicFoleyCapabilitySnapshotBaseV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_MUSIC_FOLEY_CAPABILITY_SCHEMA_VERSION
  productionId: string
  capabilitySnapshotId: string
  discoveryKind: 'protocol_fixture' | 'official_read_only_discovery'
  providerIdentityStatus: 'unverified_protocol_fixture' | 'officially_verified'
  lifecycleStatus: 'protocol_fixture_only' | 'available' | 'unavailable' | 'unknown'
  discoveryAuthorityDigests: readonly string[]
  evidenceSourceCodes: readonly string[]
  evidenceDigest: string
  capturedAt: ISODateString
  expiresAt?: ISODateString
  externalDiscoveryPerformed: boolean
  externalTransportAllowed: false
  providerExecutionAllowed: false
  immutable: true
}

export interface MotionStudioGeneratedMusicCapabilitySnapshotV1
  extends MotionStudioMusicFoleyCapabilitySnapshotBaseV1 {
  intent: 'generated_music_candidate'
  configuredRouteId: 'lyria_3_pro'
  fields: readonly MotionStudioMusicFoleyCapabilityFieldEvidenceV1<MotionStudioGeneratedMusicCapabilityField>[]
}

export interface MotionStudioSynchronizedFoleyCapabilitySnapshotV1
  extends MotionStudioMusicFoleyCapabilitySnapshotBaseV1 {
  intent: 'synchronized_foley_candidate'
  configuredRouteId: 'mmaudio'
  fields: readonly MotionStudioMusicFoleyCapabilityFieldEvidenceV1<MotionStudioSynchronizedFoleyCapabilityField>[]
}

export type MotionStudioMusicFoleyCapabilitySnapshotV1 =
  | MotionStudioGeneratedMusicCapabilitySnapshotV1
  | MotionStudioSynchronizedFoleyCapabilitySnapshotV1

export interface MotionStudioMusicFoleyApprovalAuthorityV1 {
  approvedSnapshotId: string
  approvedSnapshotDigest: string
  approvedPlanReviewId: string
  approvedCreditEstimateId: string
  activeNoncommercialTestReservationId: string
  approvalLocked: true
  commercialMutationAllowed: false
}

export interface MotionStudioMusicFoleyWorkAuthorityV1 {
  approvedWorkItemId: string
  jobId: string
  attemptId: string
  leaseId: string
  idempotencyKeyHash: string
}

export interface MotionStudioMusicFoleyCostAuthorityV1 {
  costBudgetId: string
  rateCardVersionId: string
  rateCardDigest: string
  maximumAuthorizedProviderCostMicros: 0
  maximumAuthorizedLocalComputeCostMicros: 0
  maximumAuthorizedTotalInternalCostMicros: 0
  currency: 'USD'
  customerPricingIncluded: false
  customerCreditsIncluded: false
  customerBillingAllowed: false
}

export interface MotionStudioMusicFoleyAttemptPolicyV1 {
  maximumSubmissions: 1
  maximumCandidates: 1
  automaticRetry: false
  automaticFallback: false
  automaticVariantGeneration: false
}

export interface MotionStudioMusicFoleyProtocolExecutionBoundaryV1 {
  protocolSimulatorOnly: true
  externalTransportAllowed: false
  providerExecutionAllowed: false
  providerSubmissionMaximum: 0
  statusRequestMaximum: 0
  downloadRequestMaximum: 0
  mediaExecutionAllowed: false
  privateIngestExecutionAllowed: false
  humanReviewPerformed: false
  selectionAllowed: false
  finalMixAllowed: false
  timelineMutationAllowed: false
  renderAllowed: false
  exportAllowed: false
  productReady: false
}

export interface MotionStudioGeneratedMusicDirectionV1 {
  narrativePurpose: string
  emotionalDirection: string
  mood: readonly string[]
  instrumentation: readonly string[]
  energyArc: readonly string[]
  endingBehavior: 'clean_resolve' | 'loop_safe' | 'soft_transition'
  speechSafety: 'duck_below_narration' | 'no_speech_overlap'
  doNotCopy: readonly string[]
  instrumentalOnly: true
  vocalsAllowed: false
  lyricsAllowed: false
  artistImitationAllowed: false
  songImitationAllowed: false
  melodyCopyingAllowed: false
  referenceAudioContinuationAllowed: false
}

export interface MotionStudioGeneratedMusicCandidateRequestV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_GENERATED_MUSIC_REQUEST_SCHEMA_VERSION
  intent: 'generated_music_candidate'
  productionId: string
  musicRequestId: string
  approval: MotionStudioMusicFoleyApprovalAuthorityV1
  work: MotionStudioMusicFoleyWorkAuthorityV1
  cost: MotionStudioMusicFoleyCostAuthorityV1
  musicBibleArtifactVersion: MotionStudioVersionReference
  musicBibleContentDigest: string
  cue: MotionStudioMusicCueV2
  pictureLockArtifactVersion: MotionStudioVersionReference
  pictureLockContentDigest: string
  timingAuthorityDigest: string
  range: MotionStudioAudioFrameRange
  direction: MotionStudioGeneratedMusicDirectionV1
  rightsEvidenceIds: readonly string[]
  capabilitySnapshotId: string
  capabilitySnapshotDigest: string
  configuredRouteId: 'lyria_3_pro'
  output: {
    container: 'wav'
    codec: 'pcm_s16le'
    sampleRateHertz: 48_000
    channelCount: 2
  }
  attemptPolicy: MotionStudioMusicFoleyAttemptPolicyV1
  executionBoundary: MotionStudioMusicFoleyProtocolExecutionBoundaryV1
  immutable: true
}

export interface MotionStudioPrivateVideoAssetVersionRefV1 {
  assetId: string
  assetVersionId: string
  contentDigest: string
  provenanceRecordId: string
  rightsEvidenceIds: readonly string[]
  mimeType: 'video/mp4'
  privateAsset: true
  browserDirectProviderAccessAllowed: false
}

export interface MotionStudioSynchronizedFoleyDirectionV1 {
  expectedAudibleEvents: readonly string[]
  environment: string
  texture: string
  intensity: 'restrained' | 'balanced'
  speechSafety: 'duck_below_narration' | 'avoid_speech_overlap'
  doNotInvent: readonly string[]
  dialogueAllowed: false
  narrationAllowed: false
  musicAllowed: false
  exactNamedSoundAllowed: false
  unseenActionAllowed: false
  factualAdditionAllowed: false
}

export interface MotionStudioSynchronizedFoleyCandidateRequestV1 extends MotionStudioOwnership {
  schemaVersion: typeof MOTION_STUDIO_SYNCHRONIZED_FOLEY_REQUEST_SCHEMA_VERSION
  intent: 'synchronized_foley_candidate'
  productionId: string
  foleyRequestId: string
  approval: MotionStudioMusicFoleyApprovalAuthorityV1
  work: MotionStudioMusicFoleyWorkAuthorityV1
  cost: MotionStudioMusicFoleyCostAuthorityV1
  soundEvent: MotionStudioSoundEventV1
  sourceVideoAssetVersion: MotionStudioPrivateVideoAssetVersionRefV1
  sourceFrameRange: MotionStudioAudioFrameRange
  pictureLockArtifactVersion: MotionStudioVersionReference
  pictureLockContentDigest: string
  timingAuthorityDigest: string
  range: MotionStudioAudioFrameRange
  direction: MotionStudioSynchronizedFoleyDirectionV1
  capabilitySnapshotId: string
  capabilitySnapshotDigest: string
  configuredRouteId: 'mmaudio'
  output: {
    container: 'wav'
    codec: 'pcm_s16le'
    sampleRateHertz: 48_000
    channelCount: 2
  }
  attemptPolicy: MotionStudioMusicFoleyAttemptPolicyV1
  executionBoundary: MotionStudioMusicFoleyProtocolExecutionBoundaryV1
  immutable: true
}

export type MotionStudioMusicFoleyCandidateRequestV1 =
  | MotionStudioGeneratedMusicCandidateRequestV1
  | MotionStudioSynchronizedFoleyCandidateRequestV1

interface MotionStudioMusicFoleyProtocolEnvelopeBaseV1 {
  schemaVersion: 'motion-studio.music-foley-protocol-envelope.v1'
  adapterId: typeof MOTION_STUDIO_MUSIC_FOLEY_PROTOCOL_ADAPTER_ID
  executionClass: 'protocol_simulator'
  requestId: string
  requestDigest: string
  capabilitySnapshotId: string
  capabilitySnapshotDigest: string
  providerIdentityStatus: 'unverified_protocol_fixture'
  emittedFields: readonly string[]
  externalNetworkAllowed: false
  providerSubmissionAllowed: false
  mediaOutputAllowed: false
  automaticRetry: false
  automaticFallback: false
  automaticSelection: false
}

export interface MotionStudioGeneratedMusicProtocolEnvelopeV1
  extends MotionStudioMusicFoleyProtocolEnvelopeBaseV1 {
  intent: 'generated_music_candidate'
  configuredRouteId: 'lyria_3_pro'
  musicCueId: string
  direction: MotionStudioGeneratedMusicDirectionV1
}

export interface MotionStudioSynchronizedFoleyProtocolEnvelopeV1
  extends MotionStudioMusicFoleyProtocolEnvelopeBaseV1 {
  intent: 'synchronized_foley_candidate'
  configuredRouteId: 'mmaudio'
  soundEventId: string
  sourceVideoAssetVersionId: string
  direction: MotionStudioSynchronizedFoleyDirectionV1
}

export type MotionStudioMusicFoleyProtocolEnvelopeV1 =
  | MotionStudioGeneratedMusicProtocolEnvelopeV1
  | MotionStudioSynchronizedFoleyProtocolEnvelopeV1

export interface MotionStudioMusicFoleyProtocolResponseV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.music-foley-protocol-response.v1'
  productionId: string
  intent: MotionStudioMusicFoleyIntent
  requestId: string
  requestDigest: string
  responseDigest: string
  state: 'protocol_fixture_created'
  providerResponseReceived: false
  providerRequestIdPersisted: false
  outputBytesCreated: false
  temporaryProviderUrlPersisted: false
  rawProviderPayloadPersisted: false
  immutable: true
}

export interface MotionStudioMusicFoleyProtocolAttemptV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.music-foley-protocol-attempt.v1'
  productionId: string
  intent: MotionStudioMusicFoleyIntent
  requestId: string
  requestDigest: string
  approvedSnapshotId: string
  approvedWorkItemId: string
  jobId: string
  attemptId: string
  leaseId: string
  idempotencyKeyHash: string
  attemptNumber: 1
  state: 'protocol_completed'
  providerSubmissionPerformed: false
  providerOperationIdentityPresent: false
  externalRequestCount: 0
  automaticRetry: false
  fallbackPerformed: false
  variantGenerated: false
  outcomeUnknown: false
  startedAt: ISODateString
  completedAt: ISODateString
  immutable: true
}

export interface MotionStudioMusicFoleyProtocolPrivateIngestV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.music-foley-protocol-private-ingest.v1'
  productionId: string
  intent: MotionStudioMusicFoleyIntent
  requestId: string
  requestDigest: string
  state: 'not_performed_protocol_fixture'
  privateArtifactCreated: false
  assetVersionCreated: false
  mediaBytesPersisted: false
  providerUrlPersisted: false
  localPathProjected: false
  contentDigest: string
  immutable: true
}

export interface MotionStudioMusicFoleyProtocolCostV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.music-foley-protocol-cost.v1'
  productionId: string
  intent: MotionStudioMusicFoleyIntent
  costRecordId: string
  requestId: string
  requestDigest: string
  attemptId: string
  costBudgetId: string
  rateCardVersionId: string
  meteringClass: 'protocol_zero_cost'
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

export type MotionStudioMusicFoleyQaGate =
  | 'request_integrity'
  | 'approved_authority'
  | 'provider_capability'
  | 'cue_or_event_grounding'
  | 'instrumental_and_no_copy'
  | 'source_video_binding'
  | 'forbidden_content'
  | 'timing'
  | 'private_ingest'
  | 'media_integrity'
  | 'speech_safety'
  | 'human_review'
  | 'no_auto_selection'

export interface MotionStudioMusicFoleyQaGateResultV1 {
  gate: MotionStudioMusicFoleyQaGate
  result: 'passed' | 'not_evaluated'
  blocking: true
  evidenceId: string
  note: string
}

export interface MotionStudioMusicFoleyProtocolQaReportV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.music-foley-protocol-qa-report.v1'
  productionId: string
  intent: MotionStudioMusicFoleyIntent
  qaReportId: string
  requestId: string
  requestDigest: string
  candidateId: string
  gateResults: readonly MotionStudioMusicFoleyQaGateResultV1[]
  automatedChecksComplete: true
  humanReviewComplete: false
  reviewEligible: false
  selectionEligible: false
  finalMixEligible: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioMusicFoleyProtocolCandidateV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.music-foley-protocol-candidate.v1'
  productionId: string
  intent: MotionStudioMusicFoleyIntent
  candidateId: string
  requestId: string
  requestDigest: string
  attemptId: string
  privateIngestRecordId: string
  source: 'protocol_simulator_fixture'
  state: 'protocol_fixture_only'
  mediaAssetVersionCreated: false
  providerExecutionPerformed: false
  providerSubmissionCount: 0
  reviewStatus: 'not_reviewable_protocol'
  selected: false
  firstCandidateAutoAccepted: false
  finalMixEligible: false
  timelineEligible: false
  renderEligible: false
  productReady: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioMusicFoleyProtocolReviewStateV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.music-foley-protocol-review-state.v1'
  productionId: string
  intent: MotionStudioMusicFoleyIntent
  reviewStateId: string
  requestId: string
  candidateId: string
  qaReportId: string
  state: 'ineligible_protocol'
  blockers: readonly (
    | 'protocol_fixture'
    | 'official_capability_not_verified'
    | 'provider_output_absent'
    | 'private_ingest_not_performed'
    | 'human_review_not_performed'
  )[]
  humanReviewRecorded: false
  selectionDecisionCreated: false
  selected: false
  finalMixMutationPerformed: false
  timelineMutationPerformed: false
  createdAt: ISODateString
  immutable: true
}

export interface MotionStudioMusicFoleyProtocolBundleV1 extends MotionStudioOwnership {
  schemaVersion: 'motion-studio.music-foley-protocol-bundle.v1'
  productionId: string
  capabilitySnapshot: MotionStudioMusicFoleyCapabilitySnapshotV1
  request: MotionStudioMusicFoleyCandidateRequestV1
  envelope: MotionStudioMusicFoleyProtocolEnvelopeV1
  response: MotionStudioMusicFoleyProtocolResponseV1
  attempt: MotionStudioMusicFoleyProtocolAttemptV1
  privateIngest: MotionStudioMusicFoleyProtocolPrivateIngestV1
  cost: MotionStudioMusicFoleyProtocolCostV1
  candidate: MotionStudioMusicFoleyProtocolCandidateV1
  qa: MotionStudioMusicFoleyProtocolQaReportV1
  review: MotionStudioMusicFoleyProtocolReviewStateV1
  protocolOnly: true
  externalRequestCount: 0
  providerCostMicros: 0
  mediaBytesCreated: false
  selectionPerformed: false
  finalMixMutationPerformed: false
  timelineMutationPerformed: false
  bundleDigest: string
}

export interface MotionStudioMusicFoleyWorkspaceDto extends MotionStudioOwnership {
  productionId: string
  intent: MotionStudioMusicFoleyIntent
  state: 'protocol_evidence_ready'
  capabilityState: 'official_discovery_required'
  candidate: {
    state: 'protocol_fixture_only'
    reviewStatus: 'not_reviewable_protocol'
    selected: false
    finalMixEligible: false
  }
  nextAction: 'verify_current_provider_capability'
  warning: string
}
