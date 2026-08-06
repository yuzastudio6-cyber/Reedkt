import { z } from 'zod'

import {
  MOTION_STUDIO_GENERATED_MUSIC_REQUEST_SCHEMA_VERSION,
  MOTION_STUDIO_MUSIC_FOLEY_CAPABILITY_SCHEMA_VERSION,
  MOTION_STUDIO_MUSIC_FOLEY_PROTOCOL_ADAPTER_ID,
  MOTION_STUDIO_SYNCHRONIZED_FOLEY_REQUEST_SCHEMA_VERSION,
} from '../../../types/motion-studio'
import { motionStudioMusicCueV2Schema, motionStudioSoundEventV1Schema } from './audio'
import { motionStudioOwnershipSchema, motionStudioVersionReferenceSchema } from './schemas'

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const isoDate = z.string().datetime({ offset: true })
const safeText = (minimum: number, maximum: number) => z.string().trim().min(minimum).max(maximum)
  .refine((value) => !hasUnsafeText(value), {
    message: 'Music/Foley authority text cannot contain control characters, URLs, paths, or executable URI schemes.',
  })

export const motionStudioMusicFoleyIntentSchema = z.enum([
  'generated_music_candidate', 'synchronized_foley_candidate',
])
export const motionStudioMusicFoleyCapabilitySupportSchema = z.enum([
  'supported', 'unsupported', 'unknown',
])

export const motionStudioGeneratedMusicCapabilityFieldSchema = z.enum([
  'text_prompt', 'negative_instructions', 'instrumental_only', 'duration_control',
  'wav_output', 'response_usage', 'seed_control', 'reference_audio',
  'asynchronous_status', 'temporary_download', 'cancellation', 'retention_metadata',
])
export const motionStudioSynchronizedFoleyCapabilityFieldSchema = z.enum([
  'video_conditioning', 'text_prompt', 'visible_event_grounding',
  'dialogue_suppression', 'music_suppression', 'exact_sound_suppression',
  'duration_control', 'wav_output', 'response_usage', 'asynchronous_status',
  'temporary_download', 'cancellation', 'retention_metadata',
])

export const MOTION_STUDIO_GENERATED_MUSIC_CAPABILITY_FIELDS = [
  'text_prompt', 'negative_instructions', 'instrumental_only', 'duration_control',
  'wav_output', 'response_usage', 'seed_control', 'reference_audio',
  'asynchronous_status', 'temporary_download', 'cancellation', 'retention_metadata',
] as const
export const MOTION_STUDIO_SYNCHRONIZED_FOLEY_CAPABILITY_FIELDS = [
  'video_conditioning', 'text_prompt', 'visible_event_grounding',
  'dialogue_suppression', 'music_suppression', 'exact_sound_suppression',
  'duration_control', 'wav_output', 'response_usage', 'asynchronous_status',
  'temporary_download', 'cancellation', 'retention_metadata',
] as const

const capabilityBase = {
  schemaVersion: z.literal(MOTION_STUDIO_MUSIC_FOLEY_CAPABILITY_SCHEMA_VERSION),
  productionId: stableId,
  capabilitySnapshotId: stableId,
  discoveryKind: z.enum(['protocol_fixture', 'official_read_only_discovery']),
  providerIdentityStatus: z.enum(['unverified_protocol_fixture', 'officially_verified']),
  lifecycleStatus: z.enum(['protocol_fixture_only', 'available', 'unavailable', 'unknown']),
  discoveryAuthorityDigests: z.array(digest).max(16).readonly(),
  evidenceSourceCodes: z.array(stableId).min(1).max(32).readonly(),
  evidenceDigest: digest,
  capturedAt: isoDate,
  expiresAt: isoDate.optional(),
  externalDiscoveryPerformed: z.boolean(),
  externalTransportAllowed: z.literal(false),
  providerExecutionAllowed: z.literal(false),
  immutable: z.literal(true),
} as const

const musicFieldEvidenceSchema = z.object({
  field: motionStudioGeneratedMusicCapabilityFieldSchema,
  support: motionStudioMusicFoleyCapabilitySupportSchema,
  evidenceCode: stableId,
}).strict()
const foleyFieldEvidenceSchema = z.object({
  field: motionStudioSynchronizedFoleyCapabilityFieldSchema,
  support: motionStudioMusicFoleyCapabilitySupportSchema,
  evidenceCode: stableId,
}).strict()

const musicCapabilitySnapshotSchema = motionStudioOwnershipSchema.extend({
  ...capabilityBase,
  intent: z.literal('generated_music_candidate'),
  configuredRouteId: z.literal('lyria_3_pro'),
  fields: z.array(musicFieldEvidenceSchema).length(MOTION_STUDIO_GENERATED_MUSIC_CAPABILITY_FIELDS.length).readonly(),
}).strict().superRefine((value, context) => {
  refineCapabilitySnapshot(value, MOTION_STUDIO_GENERATED_MUSIC_CAPABILITY_FIELDS, context)
})

const foleyCapabilitySnapshotSchema = motionStudioOwnershipSchema.extend({
  ...capabilityBase,
  intent: z.literal('synchronized_foley_candidate'),
  configuredRouteId: z.literal('mmaudio'),
  fields: z.array(foleyFieldEvidenceSchema).length(MOTION_STUDIO_SYNCHRONIZED_FOLEY_CAPABILITY_FIELDS.length).readonly(),
}).strict().superRefine((value, context) => {
  refineCapabilitySnapshot(value, MOTION_STUDIO_SYNCHRONIZED_FOLEY_CAPABILITY_FIELDS, context)
})

export const motionStudioMusicFoleyCapabilitySnapshotV1Schema = z.discriminatedUnion('intent', [
  musicCapabilitySnapshotSchema,
  foleyCapabilitySnapshotSchema,
])
export { musicCapabilitySnapshotSchema as motionStudioGeneratedMusicCapabilitySnapshotV1Schema }
export { foleyCapabilitySnapshotSchema as motionStudioSynchronizedFoleyCapabilitySnapshotV1Schema }

const approvalAuthoritySchema = z.object({
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  approvedPlanReviewId: stableId,
  approvedCreditEstimateId: stableId,
  activeNoncommercialTestReservationId: stableId,
  approvalLocked: z.literal(true),
  commercialMutationAllowed: z.literal(false),
}).strict()

const workAuthoritySchema = z.object({
  approvedWorkItemId: stableId,
  jobId: stableId,
  attemptId: stableId,
  leaseId: stableId,
  idempotencyKeyHash: digest,
}).strict()

const costAuthoritySchema = z.object({
  costBudgetId: stableId,
  rateCardVersionId: stableId,
  rateCardDigest: digest,
  maximumAuthorizedProviderCostMicros: z.literal(0),
  maximumAuthorizedLocalComputeCostMicros: z.literal(0),
  maximumAuthorizedTotalInternalCostMicros: z.literal(0),
  currency: z.literal('USD'),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  customerBillingAllowed: z.literal(false),
}).strict()

const attemptPolicySchema = z.object({
  maximumSubmissions: z.literal(1),
  maximumCandidates: z.literal(1),
  automaticRetry: z.literal(false),
  automaticFallback: z.literal(false),
  automaticVariantGeneration: z.literal(false),
}).strict()

const protocolExecutionBoundarySchema = z.object({
  protocolSimulatorOnly: z.literal(true),
  externalTransportAllowed: z.literal(false),
  providerExecutionAllowed: z.literal(false),
  providerSubmissionMaximum: z.literal(0),
  statusRequestMaximum: z.literal(0),
  downloadRequestMaximum: z.literal(0),
  mediaExecutionAllowed: z.literal(false),
  privateIngestExecutionAllowed: z.literal(false),
  humanReviewPerformed: z.literal(false),
  selectionAllowed: z.literal(false),
  finalMixAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
  renderAllowed: z.literal(false),
  exportAllowed: z.literal(false),
  productReady: z.literal(false),
}).strict()

const frameRangeSchema = z.object({
  startTimingAnchorId: stableId,
  endTimingAnchorId: stableId,
  startFrame: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  endFrame: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).strict().superRefine((value, context) => {
  if (value.startFrame >= value.endFrame || value.startTimingAnchorId === value.endTimingAnchorId) {
    context.addIssue({ code: 'custom', message: 'Audio candidate frame range must advance between distinct timing anchors.' })
  }
})

const outputSchema = z.object({
  container: z.literal('wav'),
  codec: z.literal('pcm_s16le'),
  sampleRateHertz: z.literal(48_000),
  channelCount: z.literal(2),
}).strict()

const musicDirectionSchema = z.object({
  narrativePurpose: safeText(1, 1_000),
  emotionalDirection: safeText(1, 500),
  mood: z.array(safeText(1, 160)).min(1).max(16).readonly(),
  instrumentation: z.array(safeText(1, 160)).min(1).max(32).readonly(),
  energyArc: z.array(safeText(1, 240)).min(1).max(16).readonly(),
  endingBehavior: z.enum(['clean_resolve', 'loop_safe', 'soft_transition']),
  speechSafety: z.enum(['duck_below_narration', 'no_speech_overlap']),
  doNotCopy: z.array(safeText(1, 240)).min(4).max(32).readonly(),
  instrumentalOnly: z.literal(true),
  vocalsAllowed: z.literal(false),
  lyricsAllowed: z.literal(false),
  artistImitationAllowed: z.literal(false),
  songImitationAllowed: z.literal(false),
  melodyCopyingAllowed: z.literal(false),
  referenceAudioContinuationAllowed: z.literal(false),
}).strict()

export const motionStudioGeneratedMusicCandidateRequestV1Schema = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_GENERATED_MUSIC_REQUEST_SCHEMA_VERSION),
  intent: z.literal('generated_music_candidate'),
  productionId: stableId,
  musicRequestId: stableId,
  approval: approvalAuthoritySchema,
  work: workAuthoritySchema,
  cost: costAuthoritySchema,
  musicBibleArtifactVersion: motionStudioVersionReferenceSchema,
  musicBibleContentDigest: digest,
  cue: motionStudioMusicCueV2Schema,
  pictureLockArtifactVersion: motionStudioVersionReferenceSchema,
  pictureLockContentDigest: digest,
  timingAuthorityDigest: digest,
  range: frameRangeSchema,
  direction: musicDirectionSchema,
  rightsEvidenceIds: z.array(stableId).min(1).max(32).readonly(),
  capabilitySnapshotId: stableId,
  capabilitySnapshotDigest: digest,
  configuredRouteId: z.literal('lyria_3_pro'),
  output: outputSchema,
  attemptPolicy: attemptPolicySchema,
  executionBoundary: protocolExecutionBoundarySchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (!sameScope(value, value.cue) || value.productionId !== value.cue.productionId) {
    context.addIssue({ code: 'custom', path: ['cue'], message: 'Music cue must share exact request scope and production.' })
  }
  if (!sameVersion(value.musicBibleArtifactVersion, value.cue.musicBibleArtifactVersion)) {
    context.addIssue({ code: 'custom', path: ['cue', 'musicBibleArtifactVersion'], message: 'Music cue must bind the exact Music Bible artifact version.' })
  }
  if (value.musicBibleContentDigest !== value.musicBibleArtifactVersion.contentDigest ||
      value.pictureLockContentDigest !== value.pictureLockArtifactVersion.contentDigest) {
    context.addIssue({ code: 'custom', message: 'Music request content digests must bind the exact Music Bible and picture-lock versions.' })
  }
  if (value.timingAuthorityDigest !== value.cue.timingAuthorityDigest || !sameRange(value.range, value.cue.range)) {
    context.addIssue({ code: 'custom', path: ['range'], message: 'Music request must preserve the exact approved cue timing authority and frame range.' })
  }
  if (value.direction.narrativePurpose !== value.cue.narrativePurpose ||
      value.direction.emotionalDirection !== value.cue.emotionalDirection ||
      value.direction.speechSafety !== value.cue.speechOverlapPolicy) {
    context.addIssue({ code: 'custom', path: ['direction'], message: 'Music direction cannot drift from the approved cue.' })
  }
})

const privateVideoAssetVersionSchema = z.object({
  assetId: stableId,
  assetVersionId: stableId,
  contentDigest: digest,
  provenanceRecordId: stableId,
  rightsEvidenceIds: z.array(stableId).min(1).max(32).readonly(),
  mimeType: z.literal('video/mp4'),
  privateAsset: z.literal(true),
  browserDirectProviderAccessAllowed: z.literal(false),
}).strict()

const foleyDirectionSchema = z.object({
  expectedAudibleEvents: z.array(safeText(1, 240)).min(1).max(16).readonly(),
  environment: safeText(1, 240),
  texture: safeText(1, 240),
  intensity: z.enum(['restrained', 'balanced']),
  speechSafety: z.enum(['duck_below_narration', 'avoid_speech_overlap']),
  doNotInvent: z.array(safeText(1, 240)).min(3).max(24).readonly(),
  dialogueAllowed: z.literal(false),
  narrationAllowed: z.literal(false),
  musicAllowed: z.literal(false),
  exactNamedSoundAllowed: z.literal(false),
  unseenActionAllowed: z.literal(false),
  factualAdditionAllowed: z.literal(false),
}).strict()

export const motionStudioSynchronizedFoleyCandidateRequestV1Schema = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_SYNCHRONIZED_FOLEY_REQUEST_SCHEMA_VERSION),
  intent: z.literal('synchronized_foley_candidate'),
  productionId: stableId,
  foleyRequestId: stableId,
  approval: approvalAuthoritySchema,
  work: workAuthoritySchema,
  cost: costAuthoritySchema,
  soundEvent: motionStudioSoundEventV1Schema,
  sourceVideoAssetVersion: privateVideoAssetVersionSchema,
  sourceFrameRange: frameRangeSchema,
  pictureLockArtifactVersion: motionStudioVersionReferenceSchema,
  pictureLockContentDigest: digest,
  timingAuthorityDigest: digest,
  range: frameRangeSchema,
  direction: foleyDirectionSchema,
  capabilitySnapshotId: stableId,
  capabilitySnapshotDigest: digest,
  configuredRouteId: z.literal('mmaudio'),
  output: outputSchema,
  attemptPolicy: attemptPolicySchema,
  executionBoundary: protocolExecutionBoundarySchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (!sameScope(value, value.soundEvent) || value.productionId !== value.soundEvent.productionId) {
    context.addIssue({ code: 'custom', path: ['soundEvent'], message: 'Sound event must share exact request scope and production.' })
  }
  if (value.soundEvent.role === 'exact_sfx' || value.soundEvent.reasonKind === 'exact_named_sound') {
    context.addIssue({ code: 'custom', path: ['soundEvent'], message: 'Synchronized Foley cannot generate an exact named sound.' })
  }
  if (value.pictureLockContentDigest !== value.pictureLockArtifactVersion.contentDigest) {
    context.addIssue({ code: 'custom', path: ['pictureLockContentDigest'], message: 'Foley request must bind the exact picture-lock content digest.' })
  }
  if (value.timingAuthorityDigest !== value.soundEvent.timingAuthorityDigest || !sameRange(value.range, value.soundEvent.range)) {
    context.addIssue({ code: 'custom', path: ['range'], message: 'Foley request must preserve the exact approved event timing authority and frame range.' })
  }
  if (value.direction.speechSafety !== value.soundEvent.speechOverlapPolicy) {
    context.addIssue({ code: 'custom', path: ['direction', 'speechSafety'], message: 'Foley speech policy cannot drift from the approved sound event.' })
  }
})

export const motionStudioMusicFoleyCandidateRequestV1Schema = z.discriminatedUnion('intent', [
  motionStudioGeneratedMusicCandidateRequestV1Schema,
  motionStudioSynchronizedFoleyCandidateRequestV1Schema,
])

const envelopeBase = {
  schemaVersion: z.literal('motion-studio.music-foley-protocol-envelope.v1'),
  adapterId: z.literal(MOTION_STUDIO_MUSIC_FOLEY_PROTOCOL_ADAPTER_ID),
  executionClass: z.literal('protocol_simulator'),
  requestId: stableId,
  requestDigest: digest,
  capabilitySnapshotId: stableId,
  capabilitySnapshotDigest: digest,
  providerIdentityStatus: z.literal('unverified_protocol_fixture'),
  emittedFields: z.array(stableId).min(1).max(32).readonly(),
  externalNetworkAllowed: z.literal(false),
  providerSubmissionAllowed: z.literal(false),
  mediaOutputAllowed: z.literal(false),
  automaticRetry: z.literal(false),
  automaticFallback: z.literal(false),
  automaticSelection: z.literal(false),
} as const

export const motionStudioMusicFoleyProtocolEnvelopeV1Schema = z.discriminatedUnion('intent', [
  z.object({
    ...envelopeBase,
    intent: z.literal('generated_music_candidate'),
    configuredRouteId: z.literal('lyria_3_pro'),
    musicCueId: stableId,
    direction: musicDirectionSchema,
  }).strict(),
  z.object({
    ...envelopeBase,
    intent: z.literal('synchronized_foley_candidate'),
    configuredRouteId: z.literal('mmaudio'),
    soundEventId: stableId,
    sourceVideoAssetVersionId: stableId,
    direction: foleyDirectionSchema,
  }).strict(),
])

const protocolRecordBase = {
  productionId: stableId,
  intent: motionStudioMusicFoleyIntentSchema,
  requestId: stableId,
  requestDigest: digest,
} as const

export const motionStudioMusicFoleyProtocolResponseV1Schema = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.music-foley-protocol-response.v1'),
  ...protocolRecordBase,
  responseDigest: digest,
  state: z.literal('protocol_fixture_created'),
  providerResponseReceived: z.literal(false),
  providerRequestIdPersisted: z.literal(false),
  outputBytesCreated: z.literal(false),
  temporaryProviderUrlPersisted: z.literal(false),
  rawProviderPayloadPersisted: z.literal(false),
  immutable: z.literal(true),
}).strict()

export const motionStudioMusicFoleyProtocolAttemptV1Schema = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.music-foley-protocol-attempt.v1'),
  ...protocolRecordBase,
  approvedSnapshotId: stableId,
  approvedWorkItemId: stableId,
  jobId: stableId,
  attemptId: stableId,
  leaseId: stableId,
  idempotencyKeyHash: digest,
  attemptNumber: z.literal(1),
  state: z.literal('protocol_completed'),
  providerSubmissionPerformed: z.literal(false),
  providerOperationIdentityPresent: z.literal(false),
  externalRequestCount: z.literal(0),
  automaticRetry: z.literal(false),
  fallbackPerformed: z.literal(false),
  variantGenerated: z.literal(false),
  outcomeUnknown: z.literal(false),
  startedAt: isoDate,
  completedAt: isoDate,
  immutable: z.literal(true),
}).strict()

export const motionStudioMusicFoleyProtocolPrivateIngestV1Schema = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.music-foley-protocol-private-ingest.v1'),
  ...protocolRecordBase,
  state: z.literal('not_performed_protocol_fixture'),
  privateArtifactCreated: z.literal(false),
  assetVersionCreated: z.literal(false),
  mediaBytesPersisted: z.literal(false),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
  contentDigest: digest,
  immutable: z.literal(true),
}).strict()

export const motionStudioMusicFoleyProtocolCostV1Schema = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.music-foley-protocol-cost.v1'),
  ...protocolRecordBase,
  costRecordId: stableId,
  attemptId: stableId,
  costBudgetId: stableId,
  rateCardVersionId: stableId,
  meteringClass: z.literal('protocol_zero_cost'),
  providerUsageUnits: z.literal(0),
  providerCostMicros: z.literal(0),
  localComputeCostMicros: z.literal(0),
  internalProductionCostMicros: z.literal(0),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  billingMutationPerformed: z.literal(false),
  createdAt: isoDate,
  immutable: z.literal(true),
}).strict()

export const motionStudioMusicFoleyQaGateSchema = z.enum([
  'request_integrity', 'approved_authority', 'provider_capability',
  'cue_or_event_grounding', 'instrumental_and_no_copy', 'source_video_binding',
  'forbidden_content', 'timing', 'private_ingest', 'media_integrity',
  'speech_safety', 'human_review', 'no_auto_selection',
])
const qaGateResultSchema = z.object({
  gate: motionStudioMusicFoleyQaGateSchema,
  result: z.enum(['passed', 'not_evaluated']),
  blocking: z.literal(true),
  evidenceId: stableId,
  note: safeText(1, 500),
}).strict()

export const motionStudioMusicFoleyProtocolQaReportV1Schema = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.music-foley-protocol-qa-report.v1'),
  productionId: stableId,
  intent: motionStudioMusicFoleyIntentSchema,
  qaReportId: stableId,
  requestId: stableId,
  requestDigest: digest,
  candidateId: stableId,
  gateResults: z.array(qaGateResultSchema).min(1).max(13).readonly(),
  automatedChecksComplete: z.literal(true),
  humanReviewComplete: z.literal(false),
  reviewEligible: z.literal(false),
  selectionEligible: z.literal(false),
  finalMixEligible: z.literal(false),
  createdAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const gates = value.gateResults.map((entry) => entry.gate)
  if (new Set(gates).size !== gates.length) {
    context.addIssue({ code: 'custom', path: ['gateResults'], message: 'Protocol QA gates must be unique.' })
  }
  if (!gates.includes('human_review') || !gates.includes('no_auto_selection')) {
    context.addIssue({ code: 'custom', path: ['gateResults'], message: 'Protocol QA must preserve human review and no-auto-selection gates.' })
  }
})

export const motionStudioMusicFoleyProtocolCandidateV1Schema = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.music-foley-protocol-candidate.v1'),
  productionId: stableId,
  intent: motionStudioMusicFoleyIntentSchema,
  candidateId: stableId,
  requestId: stableId,
  requestDigest: digest,
  attemptId: stableId,
  privateIngestRecordId: stableId,
  source: z.literal('protocol_simulator_fixture'),
  state: z.literal('protocol_fixture_only'),
  mediaAssetVersionCreated: z.literal(false),
  providerExecutionPerformed: z.literal(false),
  providerSubmissionCount: z.literal(0),
  reviewStatus: z.literal('not_reviewable_protocol'),
  selected: z.literal(false),
  firstCandidateAutoAccepted: z.literal(false),
  finalMixEligible: z.literal(false),
  timelineEligible: z.literal(false),
  renderEligible: z.literal(false),
  productReady: z.literal(false),
  createdAt: isoDate,
  immutable: z.literal(true),
}).strict()

const reviewBlockerSchema = z.enum([
  'protocol_fixture', 'official_capability_not_verified', 'provider_output_absent',
  'private_ingest_not_performed', 'human_review_not_performed',
])
export const motionStudioMusicFoleyProtocolReviewStateV1Schema = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.music-foley-protocol-review-state.v1'),
  productionId: stableId,
  intent: motionStudioMusicFoleyIntentSchema,
  reviewStateId: stableId,
  requestId: stableId,
  candidateId: stableId,
  qaReportId: stableId,
  state: z.literal('ineligible_protocol'),
  blockers: z.array(reviewBlockerSchema).length(5).readonly(),
  humanReviewRecorded: z.literal(false),
  selectionDecisionCreated: z.literal(false),
  selected: z.literal(false),
  finalMixMutationPerformed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  createdAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (new Set(value.blockers).size !== value.blockers.length) {
    context.addIssue({ code: 'custom', path: ['blockers'], message: 'Protocol review blockers must be unique.' })
  }
})

export const motionStudioMusicFoleyProtocolBundleV1Schema = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.music-foley-protocol-bundle.v1'),
  productionId: stableId,
  capabilitySnapshot: motionStudioMusicFoleyCapabilitySnapshotV1Schema,
  request: motionStudioMusicFoleyCandidateRequestV1Schema,
  envelope: motionStudioMusicFoleyProtocolEnvelopeV1Schema,
  response: motionStudioMusicFoleyProtocolResponseV1Schema,
  attempt: motionStudioMusicFoleyProtocolAttemptV1Schema,
  privateIngest: motionStudioMusicFoleyProtocolPrivateIngestV1Schema,
  cost: motionStudioMusicFoleyProtocolCostV1Schema,
  candidate: motionStudioMusicFoleyProtocolCandidateV1Schema,
  qa: motionStudioMusicFoleyProtocolQaReportV1Schema,
  review: motionStudioMusicFoleyProtocolReviewStateV1Schema,
  protocolOnly: z.literal(true),
  externalRequestCount: z.literal(0),
  providerCostMicros: z.literal(0),
  mediaBytesCreated: z.literal(false),
  selectionPerformed: z.literal(false),
  finalMixMutationPerformed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  bundleDigest: digest,
}).strict().superRefine((value, context) => {
  const records = [
    value.capabilitySnapshot, value.request, value.response, value.attempt,
    value.privateIngest, value.cost, value.candidate, value.qa, value.review,
  ]
  if (records.some((record) => !sameScope(value, record) || record.productionId !== value.productionId)) {
    context.addIssue({ code: 'custom', message: 'Every Music/Foley protocol record must share exact tenant and production scope.' })
  }
  if (records.some((record) => 'intent' in record && record.intent !== value.request.intent)) {
    context.addIssue({ code: 'custom', message: 'Every Music/Foley protocol record must share one exact intent.' })
  }
  if (value.envelope.requestDigest !== value.response.requestDigest ||
      value.envelope.requestDigest !== value.attempt.requestDigest ||
      value.envelope.requestDigest !== value.candidate.requestDigest ||
      value.envelope.requestDigest !== value.qa.requestDigest) {
    context.addIssue({ code: 'custom', path: ['envelope', 'requestDigest'], message: 'Protocol lineage must preserve one exact request digest.' })
  }
})

export const motionStudioMusicFoleyWorkspaceDtoSchema = motionStudioOwnershipSchema.extend({
  productionId: stableId,
  intent: motionStudioMusicFoleyIntentSchema,
  state: z.literal('protocol_evidence_ready'),
  capabilityState: z.literal('official_discovery_required'),
  candidate: z.object({
    state: z.literal('protocol_fixture_only'),
    reviewStatus: z.literal('not_reviewable_protocol'),
    selected: z.literal(false),
    finalMixEligible: z.literal(false),
  }).strict(),
  nextAction: z.literal('verify_current_provider_capability'),
  warning: safeText(1, 500),
}).strict()

function refineCapabilitySnapshot(
  value: {
    discoveryKind: 'protocol_fixture' | 'official_read_only_discovery'
    providerIdentityStatus: 'unverified_protocol_fixture' | 'officially_verified'
    lifecycleStatus: 'protocol_fixture_only' | 'available' | 'unavailable' | 'unknown'
    discoveryAuthorityDigests: readonly string[]
    evidenceSourceCodes: readonly string[]
    fields: readonly { field: string }[]
    externalDiscoveryPerformed: boolean
    capturedAt: string
    expiresAt?: string
  },
  expectedFields: readonly string[],
  context: z.RefinementCtx,
): void {
  if (!sameSet(value.fields.map((entry) => entry.field), expectedFields)) {
    context.addIssue({ code: 'custom', path: ['fields'], message: 'Capability snapshot must classify every intent field exactly once.' })
  }
  if (new Set(value.discoveryAuthorityDigests).size !== value.discoveryAuthorityDigests.length ||
      new Set(value.evidenceSourceCodes).size !== value.evidenceSourceCodes.length) {
    context.addIssue({ code: 'custom', message: 'Capability authority and source evidence identifiers must be unique.' })
  }
  const protocol = value.discoveryKind === 'protocol_fixture'
  if (protocol !== !value.externalDiscoveryPerformed ||
      protocol !== (value.providerIdentityStatus === 'unverified_protocol_fixture') ||
      protocol !== (value.lifecycleStatus === 'protocol_fixture_only')) {
    context.addIssue({ code: 'custom', message: 'Capability discovery kind, provider identity, lifecycle and execution evidence disagree.' })
  }
  if (protocol && (value.discoveryAuthorityDigests.length !== 0 || value.expiresAt !== undefined)) {
    context.addIssue({ code: 'custom', message: 'Protocol capability evidence cannot claim external authority or expiry.' })
  }
  if (!protocol && (value.discoveryAuthorityDigests.length === 0 || value.expiresAt === undefined)) {
    context.addIssue({ code: 'custom', message: 'Official capability evidence requires exact authority and expiry.' })
  }
  if (value.expiresAt && Date.parse(value.expiresAt) <= Date.parse(value.capturedAt)) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Official capability evidence must expire after capture.' })
  }
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value))
}

function sameScope(
  left: { workspaceId: string; projectId: string; editSessionId: string },
  right: { workspaceId: string; projectId: string; editSessionId: string },
): boolean {
  return left.workspaceId === right.workspaceId && left.projectId === right.projectId &&
    left.editSessionId === right.editSessionId
}

function sameVersion(
  left: { artifactId: string; versionId: string; versionNumber: number; contentDigest: string },
  right: { artifactId: string; versionId: string; versionNumber: number; contentDigest: string },
): boolean {
  return left.artifactId === right.artifactId && left.versionId === right.versionId &&
    left.versionNumber === right.versionNumber && left.contentDigest === right.contentDigest
}

function sameRange(
  left: { startTimingAnchorId: string; endTimingAnchorId: string; startFrame: number; endFrame: number },
  right: { startTimingAnchorId: string; endTimingAnchorId: string; startFrame: number; endFrame: number },
): boolean {
  return left.startTimingAnchorId === right.startTimingAnchorId &&
    left.endTimingAnchorId === right.endTimingAnchorId &&
    left.startFrame === right.startFrame && left.endFrame === right.endFrame
}

function hasUnsafeText(value: string): boolean {
  const hasControlCharacter = [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
  return hasControlCharacter ||
    /(?:https?:|file:|data:|javascript:|blob:|ftp:|ssh:|s3:|gs:|mock:|\/\/+|\\\\)/i.test(value) ||
    /(?:^|[\s"'])(?:\/|~\/|\.\.\/|[A-Za-z]:[\\/])/.test(value)
}
