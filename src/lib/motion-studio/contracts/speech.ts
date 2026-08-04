import { z } from 'zod'

import type {
  MotionStudioSpeechCapabilitySnapshotV1,
  MotionStudioSpeechProtocolAlignmentV1,
  MotionStudioSpeechProtocolAttemptV1,
  MotionStudioSpeechProtocolBundleV1,
  MotionStudioSpeechProtocolCandidateV1,
  MotionStudioSpeechProtocolEnvelopeV1,
  MotionStudioSpeechProtocolSelectionStateV1,
  MotionStudioSpeechProtocolUsageV1,
  MotionStudioSpeechSegmentRequestV1,
  MotionStudioSpeechWorkspaceDto,
} from '../../../types/motion-studio'
import {
  MOTION_STUDIO_SPEECH_CAPABILITY_SCHEMA_VERSION,
  MOTION_STUDIO_SPEECH_PROTOCOL_ADAPTER_ID,
  MOTION_STUDIO_SPEECH_REQUEST_SCHEMA_VERSION,
} from '../../../types/motion-studio'
import { validateMotionStudioDeepValue } from './safe-values'
import { motionStudioOwnershipSchema, motionStudioVersionReferenceSchema } from './schemas'

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const isoDate = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const safeText = (minimum: number, maximum: number) => z.string().trim().min(minimum).max(maximum)
  .refine((value) => !hasUnsafeText(value), {
    message: 'Speech authority text cannot contain control characters, URLs, paths, or executable URI schemes.',
  })

export const motionStudioSpeechModelIdSchema = z.enum([
  'eleven_v3', 'eleven_multilingual_v2', 'eleven_flash_v2_5',
])
export const motionStudioSpeechModelRoleSchema = z.enum([
  'final_expressive', 'stability_fallback', 'audition_or_temporary',
])
export const motionStudioSpeechCapabilityFieldSchema = z.enum([
  'text_to_speech', 'context_before_after', 'pronunciation_dictionary',
  'audio_tags', 'character_alignment', 'word_alignment', 'streaming',
  'mp3_44100_128_output', 'pcm_48000_output', 'response_usage', 'speed',
  'stability', 'similarity_boost', 'speaker_boost', 'style', 'ssml_breaks',
])

const expectedModels = [
  'eleven_v3', 'eleven_multilingual_v2', 'eleven_flash_v2_5',
] as const
const expectedFields = [
  'text_to_speech', 'context_before_after', 'pronunciation_dictionary',
  'audio_tags', 'character_alignment', 'word_alignment', 'streaming',
  'mp3_44100_128_output', 'pcm_48000_output', 'response_usage', 'speed',
  'stability', 'similarity_boost', 'speaker_boost', 'style', 'ssml_breaks',
] as const
const expectedRoles = {
  eleven_v3: 'final_expressive',
  eleven_multilingual_v2: 'stability_fallback',
  eleven_flash_v2_5: 'audition_or_temporary',
} as const

const capabilityFieldSchema = z.object({
  field: motionStudioSpeechCapabilityFieldSchema,
  support: z.enum(['supported', 'unsupported', 'unknown']),
  evidenceCode: stableId,
}).strict()

const modelCapabilitySchema = z.object({
  modelId: motionStudioSpeechModelIdSchema,
  role: motionStudioSpeechModelRoleSchema,
  availability: z.enum(['protocol_fixture_only', 'available', 'unavailable', 'unknown']),
  maximumTextCharacters: z.number().int().min(1).max(100_000).optional(),
  fields: z.array(capabilityFieldSchema).length(expectedFields.length).readonly(),
}).strict().superRefine((value, context) => {
  if (!sameSet(value.fields.map((entry) => entry.field), expectedFields)) {
    context.addIssue({ code: 'custom', path: ['fields'], message: 'Each speech model must classify every exact compiler field once.' })
  }
  if (value.role !== expectedRoles[value.modelId]) {
    context.addIssue({ code: 'custom', path: ['role'], message: 'Speech model role does not match the approved model policy.' })
  }
  if (value.availability === 'available' && !value.maximumTextCharacters) {
    context.addIssue({ code: 'custom', path: ['maximumTextCharacters'], message: 'Available speech models require an exact discovered text limit.' })
  }
  if (value.availability !== 'available' && value.maximumTextCharacters !== undefined) {
    context.addIssue({ code: 'custom', path: ['maximumTextCharacters'], message: 'Non-available model evidence cannot claim an executable text limit.' })
  }
})

export const motionStudioSpeechCapabilitySnapshotV1Schema:
z.ZodType<MotionStudioSpeechCapabilitySnapshotV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_SPEECH_CAPABILITY_SCHEMA_VERSION),
  productionId: stableId,
  capabilitySnapshotId: stableId,
  provider: z.literal('elevenlabs'),
  discoveryKind: z.enum(['protocol_fixture', 'official_read_only_discovery']),
  discoveryAuthorityDigests: z.array(digest).max(16).readonly(),
  evidenceSourceCodes: z.array(stableId).min(1).max(32).readonly(),
  evidenceDigest: digest,
  models: z.array(modelCapabilitySchema).length(expectedModels.length).readonly(),
  capturedAt: isoDate,
  expiresAt: isoDate.optional(),
  externalDiscoveryPerformed: z.boolean(),
  externalTransportAllowed: z.literal(false),
  providerExecutionAllowed: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (!sameSet(value.models.map((entry) => entry.modelId), expectedModels)) {
    context.addIssue({ code: 'custom', path: ['models'], message: 'Capability snapshot must contain the three approved speech model routes exactly once.' })
  }
  if (new Set(value.discoveryAuthorityDigests).size !== value.discoveryAuthorityDigests.length) {
    context.addIssue({ code: 'custom', path: ['discoveryAuthorityDigests'], message: 'Speech discovery authority digests must be unique.' })
  }
  if (new Set(value.evidenceSourceCodes).size !== value.evidenceSourceCodes.length) {
    context.addIssue({ code: 'custom', path: ['evidenceSourceCodes'], message: 'Speech discovery source codes must be unique.' })
  }
  const protocol = value.discoveryKind === 'protocol_fixture'
  if (protocol !== !value.externalDiscoveryPerformed) {
    context.addIssue({ code: 'custom', path: ['externalDiscoveryPerformed'], message: 'Speech capability discovery kind and execution evidence disagree.' })
  }
  if (protocol && value.models.some((entry) => entry.availability !== 'protocol_fixture_only')) {
    context.addIssue({ code: 'custom', path: ['models'], message: 'Protocol capability evidence cannot claim live model availability.' })
  }
  if (protocol && value.expiresAt !== undefined) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Protocol fixture evidence is non-live and cannot claim a provider capability expiry.' })
  }
  if (protocol && value.discoveryAuthorityDigests.length !== 0) {
    context.addIssue({ code: 'custom', path: ['discoveryAuthorityDigests'], message: 'Protocol fixture evidence cannot bind external discovery authorities.' })
  }
  if (!protocol && value.expiresAt === undefined) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'External capability evidence requires an exact expiry.' })
  }
  if (!protocol && value.discoveryAuthorityDigests.length === 0) {
    context.addIssue({ code: 'custom', path: ['discoveryAuthorityDigests'], message: 'Official capability evidence must bind at least one exact discovery authority digest.' })
  }
  if (!protocol && value.models.some((entry) => entry.availability === 'protocol_fixture_only')) {
    context.addIssue({ code: 'custom', path: ['models'], message: 'External discovery cannot preserve protocol-only model availability.' })
  }
  if (value.expiresAt && Date.parse(value.expiresAt) <= Date.parse(value.capturedAt)) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'External capability evidence must expire after it was captured.' })
  }
})

const pronunciationEntrySchema = z.object({
  pronunciationId: stableId,
  writtenForm: safeText(1, 240),
  spokenForm: safeText(1, 240),
  language: safeText(1, 80),
  reason: z.enum(['proper_name', 'place_name', 'foreign_term', 'number', 'date', 'abbreviation']),
  evidenceId: stableId,
}).strict().superRefine((value, context) => {
  if (value.writtenForm === value.spokenForm) {
    context.addIssue({ code: 'custom', path: ['spokenForm'], message: 'Pronunciation authority must describe an actual reviewed normalization.' })
  }
})

const performanceSchema = z.object({
  pace: z.enum(['measured', 'natural', 'urgent']),
  energy: z.enum(['restrained', 'balanced', 'intense']),
  emotionalDirection: z.array(safeText(1, 160)).min(1).max(12).readonly(),
  emphasisTerms: z.array(safeText(1, 120)).max(24).readonly(),
  pauseBeforeFrames: safeInteger.max(240),
  pauseAfterFrames: safeInteger.max(240),
  performanceTagIds: z.array(stableId).max(16).readonly(),
}).strict()

const rangeSchema = z.object({
  startTimingAnchorId: stableId,
  endTimingAnchorId: stableId,
  startFrame: safeInteger,
  endFrame: safeInteger.positive().max(60 * 60 * 60),
}).strict().superRefine((value, context) => {
  if (value.startFrame >= value.endFrame || value.startTimingAnchorId === value.endTimingAnchorId) {
    context.addIssue({ code: 'custom', message: 'Speech segment range must advance between distinct timing anchors.' })
  }
})

const voiceBindingBase = {
  voiceBindingId: stableId,
  provider: z.literal('elevenlabs'),
  voiceIdentityHash: digest,
  bindingEvidenceId: stableId,
  voiceProfileReference: safeText(1, 240),
  customVoice: z.literal(false),
  voiceSampleAccepted: z.literal(false),
  cloningAuthorized: z.literal(false),
  dubbingAuthorized: z.literal(false),
  rightsEvidenceId: stableId,
  retentionPolicyId: stableId,
} as const

const voiceBindingSchema = z.discriminatedUnion('catalogBindingStatus', [
  z.object({
    ...voiceBindingBase,
    catalogBindingStatus: z.literal('protocol_fixture_only'),
    verifiedProviderCatalogVoice: z.literal(false),
  }).strict(),
  z.object({
    ...voiceBindingBase,
    catalogBindingStatus: z.literal('verified_provider_catalog'),
    verifiedProviderCatalogVoice: z.literal(true),
    catalogVerifiedAt: isoDate,
  }).strict(),
])

const audioTagInstructionSchema = z.object({
  instructionId: stableId,
  kind: z.enum(['calm', 'serious', 'soft_emphasis', 'restrained_urgency', 'measured_pause']),
  appliesToText: safeText(1, 240),
  meaningPreserved: z.literal(true),
  approvedEvidenceId: stableId,
}).strict()

const modelSelectionSchema = z.object({
  setting: z.enum(['auto', 'explicit']),
  intendedRole: motionStudioSpeechModelRoleSchema,
  requestedModelId: motionStudioSpeechModelIdSchema.optional(),
  fallbackAllowed: z.literal(false),
  automaticFallback: z.literal(false),
}).strict().superRefine((value, context) => {
  if ((value.setting === 'explicit') !== (value.requestedModelId !== undefined)) {
    context.addIssue({ code: 'custom', path: ['requestedModelId'], message: 'Only an explicit speech model setting may identify a requested model.' })
  }
  if (value.requestedModelId && expectedRoles[value.requestedModelId] !== value.intendedRole) {
    context.addIssue({ code: 'custom', path: ['requestedModelId'], message: 'Explicit speech model must match its approved production role.' })
  }
})

export const motionStudioSpeechSegmentRequestV1Schema:
z.ZodType<MotionStudioSpeechSegmentRequestV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_SPEECH_REQUEST_SCHEMA_VERSION),
  productionId: stableId,
  speechRequestId: stableId,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  approvedWorkItemId: stableId,
  jobId: stableId,
  attemptId: stableId,
  leaseId: stableId,
  costBudgetId: stableId,
  idempotencyKeyHash: digest,
  preparedScriptArtifactVersion: motionStudioVersionReferenceSchema,
  voiceBibleArtifactVersion: motionStudioVersionReferenceSchema,
  voiceBibleContentDigest: digest,
  voiceSegmentId: stableId,
  preparedScriptSegmentId: stableId,
  chapterId: stableId,
  sceneId: stableId,
  timingAuthorityDigest: digest,
  range: rangeSchema,
  displayText: safeText(1, 8_000),
  spokenText: safeText(1, 8_000),
  preparedMeaningDigest: digest,
  spokenMeaningDigest: digest,
  meaningPreserved: z.literal(true),
  language: safeText(1, 80),
  previousContext: safeText(1, 2_000).optional(),
  followingContext: safeText(1, 2_000).optional(),
  pronunciationEntries: z.array(pronunciationEntrySchema).max(64).readonly(),
  performance: performanceSchema,
  audioTagInstructions: z.array(audioTagInstructionSchema).max(16).readonly(),
  voice: voiceBindingSchema,
  modelSelection: modelSelectionSchema,
  capabilitySnapshotId: stableId,
  capabilitySnapshotDigest: digest,
  output: z.object({
    container: z.literal('wav'),
    codec: z.literal('pcm_s16le'),
    sampleRateHertz: z.literal(48_000),
    channelCount: z.literal(1),
  }).strict(),
  attemptPolicy: z.object({
    maximumAttempts: z.literal(1),
    automaticRetry: z.literal(false),
    automaticFallback: z.literal(false),
  }).strict(),
  consent: z.discriminatedUnion('status', [
    z.object({
      status: z.literal('protocol_fixture_only'), evidenceId: stableId,
      cloningAuthorized: z.literal(false), dubbingAuthorized: z.literal(false),
    }).strict(),
    z.object({
      status: z.literal('provider_catalog_rights_verified'), evidenceId: stableId,
      cloningAuthorized: z.literal(false), dubbingAuthorized: z.literal(false),
    }).strict(),
  ]),
  disclosure: z.object({
    aiGenerated: z.literal(true),
    disclosureRequired: z.literal(true),
    disclosureCode: z.literal('ai_generated_voice'),
    disclosureReviewed: z.literal(true),
  }).strict(),
  executionBoundary: z.discriminatedUnion('protocolSimulatorOnly', [
    z.object({
      protocolSimulatorOnly: z.literal(true), externalTransportAllowed: z.literal(false),
      providerExecutionAllowed: z.literal(false), providerCallMaximum: z.literal(0),
      maximumAuthorizedProviderCostMicros: z.literal(0),
      maximumAuthorizedLocalComputeCostMicros: z.literal(0),
      maximumAuthorizedTotalInternalCostMicros: z.literal(0), timelineMutationAllowed: z.literal(false),
      finalSelectionAllowed: z.literal(false), customerPricingIncluded: z.literal(false),
      customerCreditsIncluded: z.literal(false),
    }).strict(),
    z.object({
      protocolSimulatorOnly: z.literal(false), externalTransportAllowed: z.literal(true),
      providerExecutionAllowed: z.literal(true), providerCallMaximum: z.literal(1),
      maximumAuthorizedProviderCostMicros: safeInteger.positive().max(250_000),
      maximumAuthorizedLocalComputeCostMicros: safeInteger.positive().max(250_000),
      maximumAuthorizedTotalInternalCostMicros: safeInteger.positive().max(250_000),
      timelineMutationAllowed: z.literal(false), finalSelectionAllowed: z.literal(false),
      customerPricingIncluded: z.literal(false), customerCreditsIncluded: z.literal(false),
    }).strict(),
  ]),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (value.preparedMeaningDigest !== value.spokenMeaningDigest) {
    context.addIssue({ code: 'custom', path: ['spokenMeaningDigest'], message: 'Spoken text must preserve the exact prepared meaning digest.' })
  }
  if (
    !value.executionBoundary.protocolSimulatorOnly &&
    value.executionBoundary.maximumAuthorizedTotalInternalCostMicros !==
      value.executionBoundary.maximumAuthorizedProviderCostMicros +
      value.executionBoundary.maximumAuthorizedLocalComputeCostMicros
  ) {
    context.addIssue({
      code: 'custom',
      path: ['executionBoundary', 'maximumAuthorizedTotalInternalCostMicros'],
      message: 'Total speech internal-cost authority must exactly equal provider plus local-compute ceilings.',
    })
  }
  const normalized = value.pronunciationEntries.reduce(
    (text, entry) => text.replaceAll(entry.writtenForm, entry.spokenForm),
    value.displayText,
  )
  if (normalized !== value.spokenText) {
    context.addIssue({ code: 'custom', path: ['spokenText'], message: 'Spoken text may differ only through exact reviewed pronunciation entries.' })
  }
  value.pronunciationEntries.forEach((entry, index) => {
    if (!value.displayText.includes(entry.writtenForm) || !value.spokenText.includes(entry.spokenForm)) {
      context.addIssue({ code: 'custom', path: ['pronunciationEntries', index], message: 'Pronunciation entry must bind the exact display and spoken text.' })
    }
  })
  if (new Set(value.pronunciationEntries.map((entry) => entry.pronunciationId)).size !== value.pronunciationEntries.length) {
    context.addIssue({ code: 'custom', path: ['pronunciationEntries'], message: 'Pronunciation authority identities must be unique.' })
  }
  if (new Set(value.pronunciationEntries.map((entry) => entry.writtenForm)).size !== value.pronunciationEntries.length) {
    context.addIssue({ code: 'custom', path: ['pronunciationEntries'], message: 'Each written form may have only one reviewed pronunciation authority.' })
  }
  const tagIds = value.audioTagInstructions.map((entry) => entry.instructionId)
  if (!sameSet(tagIds, value.performance.performanceTagIds)) {
    context.addIssue({ code: 'custom', path: ['audioTagInstructions'], message: 'Audio Tag instructions and performance-tag authority must match exactly.' })
  }
  value.audioTagInstructions.forEach((instruction, index) => {
    if (!value.spokenText.includes(instruction.appliesToText)) {
      context.addIssue({ code: 'custom', path: ['audioTagInstructions', index, 'appliesToText'], message: 'Audio Tag instruction must bind exact approved spoken text.' })
    }
  })
  if (new Set(tagIds).size !== tagIds.length) {
    context.addIssue({ code: 'custom', path: ['audioTagInstructions'], message: 'Audio Tag instruction identities must be unique.' })
  }
  const protocol = value.executionBoundary.protocolSimulatorOnly
  if (protocol !== (value.voice.catalogBindingStatus === 'protocol_fixture_only')) {
    context.addIssue({ code: 'custom', path: ['voice'], message: 'Speech voice binding must match the protocol or bounded-provider execution class.' })
  }
  if (protocol !== (value.consent.status === 'protocol_fixture_only')) {
    context.addIssue({ code: 'custom', path: ['consent'], message: 'Speech consent authority must match the protocol or bounded-provider execution class.' })
  }
})

const resolvedRouteSchema = z.object({
  setting: z.enum(['auto', 'explicit']),
  intendedRole: motionStudioSpeechModelRoleSchema,
  selectedModelId: motionStudioSpeechModelIdSchema,
  capabilitySnapshotId: stableId,
  capabilitySnapshotDigest: digest,
  resolutionReason: safeText(8, 480),
  protocolFixtureOnly: z.literal(true),
  externalExecutionEligible: z.literal(false),
  fallbackPerformed: z.literal(false),
}).strict().superRefine((value, context) => {
  if (expectedRoles[value.selectedModelId] !== value.intendedRole) {
    context.addIssue({ code: 'custom', path: ['selectedModelId'], message: 'Resolved speech model does not match the approved role.' })
  }
})

export const motionStudioSpeechProtocolEnvelopeV1Schema:
z.ZodType<MotionStudioSpeechProtocolEnvelopeV1> = z.object({
  schemaVersion: z.literal('motion-studio.speech-protocol-envelope.v1'),
  adapterId: z.literal(MOTION_STUDIO_SPEECH_PROTOCOL_ADAPTER_ID),
  executionClass: z.literal('protocol_simulator'),
  requestId: stableId,
  requestDigest: digest,
  route: resolvedRouteSchema,
  voiceBindingId: stableId,
  spokenText: safeText(1, 8_000),
  previousContext: safeText(1, 2_000).optional(),
  followingContext: safeText(1, 2_000).optional(),
  language: safeText(1, 80),
  pronunciationEntries: z.array(pronunciationEntrySchema).max(64).readonly(),
  performance: performanceSchema,
  audioTagInstructions: z.array(audioTagInstructionSchema).max(16).readonly(),
  emittedFields: z.array(motionStudioSpeechCapabilityFieldSchema).min(2).max(expectedFields.length).readonly(),
  output: z.object({
    container: z.literal('wav'), codec: z.literal('pcm_s16le'),
    sampleRateHertz: z.literal(48_000), channelCount: z.literal(1),
  }).strict(),
  externalNetworkAllowed: z.literal(false),
  outputIsProviderGenerated: z.literal(false),
  automaticRetry: z.literal(false),
  automaticFallback: z.literal(false),
}).strict().superRefine((value, context) => {
  if (new Set(value.emittedFields).size !== value.emittedFields.length) {
    context.addIssue({ code: 'custom', path: ['emittedFields'], message: 'Compiled speech fields must be unique.' })
  }
  for (const field of ['text_to_speech', 'pcm_48000_output'] as const) {
    if (!value.emittedFields.includes(field)) {
      context.addIssue({ code: 'custom', path: ['emittedFields'], message: `Compiled speech protocol requires ${field}.` })
    }
  }
})

export const motionStudioSpeechProtocolAttemptV1Schema:
z.ZodType<MotionStudioSpeechProtocolAttemptV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.speech-protocol-attempt.v1'),
  productionId: stableId,
  speechRequestId: stableId,
  requestDigest: digest,
  approvedSnapshotId: stableId,
  approvedWorkItemId: stableId,
  jobId: stableId,
  attemptId: stableId,
  leaseId: stableId,
  costBudgetId: stableId,
  idempotencyKeyHash: digest,
  attemptNumber: z.literal(1),
  state: z.literal('protocol_completed'),
  executionClass: z.literal('protocol_simulator'),
  outcome: z.literal('protocol_fixture_created'),
  providerSubmissionPerformed: z.literal(false),
  providerOperationIdentityPresent: z.literal(false),
  externalRequestCount: z.literal(0),
  automaticRetry: z.literal(false),
  fallbackPerformed: z.literal(false),
  outcomeUnknown: z.literal(false),
  startedAt: isoDate,
  completedAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (Date.parse(value.completedAt) < Date.parse(value.startedAt)) {
    context.addIssue({ code: 'custom', path: ['completedAt'], message: 'Speech protocol attempt cannot complete before it started.' })
  }
})

const qaGateSchema = z.enum([
  'request_integrity', 'file_integrity', 'format', 'non_silent',
  'meaning_fidelity', 'consent_rights', 'disclosure', 'no_auto_selection',
])
const expectedQaGates = qaGateSchema.options
const protocolPassedQaGates = [
  'request_integrity', 'file_integrity', 'format', 'non_silent',
  'disclosure', 'no_auto_selection',
] as const
const protocolNotEvaluatedQaGates = ['meaning_fidelity', 'consent_rights'] as const
const audioAssetVersionRefSchema = z.object({
  assetId: stableId,
  assetVersionId: stableId,
  contentDigest: digest,
  provenanceRecordId: stableId,
  rightsEvidenceIds: z.array(stableId).min(1).max(32).readonly(),
}).strict()

export const motionStudioSpeechProtocolCandidateV1Schema:
z.ZodType<MotionStudioSpeechProtocolCandidateV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.speech-protocol-candidate.v1'),
  productionId: stableId,
  candidateTakeId: stableId,
  speechRequestId: stableId,
  requestDigest: digest,
  voiceSegmentId: stableId,
  approvedSnapshotId: stableId,
  approvedWorkItemId: stableId,
  jobId: stableId,
  attemptId: stableId,
  leaseId: stableId,
  costBudgetId: stableId,
  idempotencyKeyHash: digest,
  attemptNumber: z.literal(1),
  modelId: motionStudioSpeechModelIdSchema,
  voiceBindingId: stableId,
  source: z.literal('protocol_simulator_fixture'),
  audioAssetVersion: audioAssetVersionRefSchema,
  byteLength: safeInteger.min(44).max(8 * 1024 * 1024),
  audioSha256: digest,
  mimeType: z.literal('audio/wav'),
  codec: z.literal('pcm_s16le'),
  sampleRateHertz: z.literal(48_000),
  channelCount: z.literal(1),
  sampleCountPerChannel: safeInteger.min(4_800).max(48_000 * 30),
  durationMilliseconds: safeInteger.min(100).max(30_000),
  qaGateResults: z.array(z.object({
    gate: qaGateSchema,
    result: z.enum(['passed', 'not_evaluated']),
    blocking: z.literal(true),
    evidenceId: stableId,
  }).strict()).length(expectedQaGates.length).readonly(),
  qaEvidenceDigest: digest,
  reviewStatus: z.literal('not_reviewable_protocol'),
  selected: z.literal(false),
  firstTakeAutoAccepted: z.literal(false),
  finalAssetEligible: z.literal(false),
  privateEvidenceOnly: z.literal(true),
  providerExecutionPerformed: z.literal(false),
  providerCallCount: z.literal(0),
  providerCostMicros: z.literal(0),
  internalProductionCostMicros: z.literal(0),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  createdAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (!sameSet(value.qaGateResults.map((entry) => entry.gate), expectedQaGates)) {
    context.addIssue({ code: 'custom', path: ['qaGateResults'], message: 'Protocol candidate requires every exact distinct blocking QA gate.' })
  }
  const passed = value.qaGateResults.filter((entry) => entry.result === 'passed').map((entry) => entry.gate)
  const notEvaluated = value.qaGateResults.filter((entry) => entry.result === 'not_evaluated').map((entry) => entry.gate)
  if (!sameSet(passed, protocolPassedQaGates)) {
    context.addIssue({ code: 'custom', path: ['qaGateResults'], message: 'Protocol evidence may pass only exact structural QA gates.' })
  }
  if (!sameSet(notEvaluated, protocolNotEvaluatedQaGates)) {
    context.addIssue({ code: 'custom', path: ['qaGateResults'], message: 'Protocol evidence must leave meaning and catalog-voice rights unevaluated.' })
  }
  if (value.audioAssetVersion.contentDigest !== value.audioSha256) {
    context.addIssue({ code: 'custom', path: ['audioAssetVersion', 'contentDigest'], message: 'Protocol candidate asset digest must match its exact audio digest.' })
  }
})

export const motionStudioSpeechProtocolUsageV1Schema:
z.ZodType<MotionStudioSpeechProtocolUsageV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.speech-protocol-usage.v1'),
  productionId: stableId,
  usageRecordId: stableId,
  speechRequestId: stableId,
  requestDigest: digest,
  attemptId: stableId,
  candidateTakeId: stableId,
  costBudgetId: stableId,
  rateCardSnapshotId: stableId,
  meteringClass: z.literal('protocol_zero_cost'),
  outputByteLength: safeInteger.min(44).max(8 * 1024 * 1024),
  outputDurationMilliseconds: safeInteger.min(100).max(30_000),
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

export const motionStudioSpeechProtocolAlignmentV1Schema:
z.ZodType<MotionStudioSpeechProtocolAlignmentV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.speech-protocol-alignment.v1'),
  productionId: stableId,
  alignmentRecordId: stableId,
  speechRequestId: stableId,
  requestDigest: digest,
  candidateTakeId: stableId,
  audioSha256: digest,
  timingAuthorityDigest: digest,
  state: z.literal('not_evaluated_protocol'),
  source: z.literal('none'),
  wordTimings: z.array(z.never()).length(0).readonly(),
  blockingForSelection: z.literal(true),
  captionMutationPerformed: z.literal(false),
  masterTimingMutationPerformed: z.literal(false),
  createdAt: isoDate,
  immutable: z.literal(true),
}).strict()

const protocolSelectionBlockerSchema = z.enum([
  'protocol_fixture', 'meaning_not_evaluated',
  'rights_not_evaluated', 'alignment_not_evaluated',
])
const expectedProtocolSelectionBlockers = protocolSelectionBlockerSchema.options

export const motionStudioSpeechProtocolSelectionStateV1Schema:
z.ZodType<MotionStudioSpeechProtocolSelectionStateV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.speech-protocol-selection-state.v1'),
  productionId: stableId,
  selectionStateId: stableId,
  speechRequestId: stableId,
  candidateTakeId: stableId,
  qaEvidenceDigest: digest,
  alignmentRecordId: stableId,
  state: z.literal('ineligible_protocol'),
  blockers: z.array(protocolSelectionBlockerSchema).length(expectedProtocolSelectionBlockers.length).readonly(),
  ownerReviewRecorded: z.literal(false),
  selectionDecisionCreated: z.literal(false),
  selected: z.literal(false),
  finalNarrationMutationPerformed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  createdAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (!sameSet(value.blockers, expectedProtocolSelectionBlockers)) {
    context.addIssue({ code: 'custom', path: ['blockers'], message: 'Protocol selection state requires every exact distinct ineligibility reason.' })
  }
})

export const motionStudioSpeechProtocolBundleV1Schema:
z.ZodType<MotionStudioSpeechProtocolBundleV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal('motion-studio.speech-protocol-bundle.v1'),
  productionId: stableId,
  capabilitySnapshot: motionStudioSpeechCapabilitySnapshotV1Schema,
  request: motionStudioSpeechSegmentRequestV1Schema,
  envelope: motionStudioSpeechProtocolEnvelopeV1Schema,
  attempt: motionStudioSpeechProtocolAttemptV1Schema,
  candidate: motionStudioSpeechProtocolCandidateV1Schema,
  usage: motionStudioSpeechProtocolUsageV1Schema,
  alignment: motionStudioSpeechProtocolAlignmentV1Schema,
  selectionState: motionStudioSpeechProtocolSelectionStateV1Schema,
  outputBytes: z.instanceof(Uint8Array),
  protocolOnly: z.literal(true),
  externalRequestCount: z.literal(0),
  providerCostMicros: z.literal(0),
  timelineMutationPerformed: z.literal(false),
}).strict().superRefine((value, context) => {
  const scope = [
    value.capabilitySnapshot, value.request, value.attempt, value.candidate,
    value.usage, value.alignment, value.selectionState,
  ]
  scope.forEach((entry, index) => {
    if (
      entry.workspaceId !== value.workspaceId || entry.projectId !== value.projectId ||
      entry.editSessionId !== value.editSessionId || entry.productionId !== value.productionId
    ) context.addIssue({ code: 'custom', path: ['scope', index], message: 'Speech protocol records must share exact tenant and production scope.' })
  })
  if (
    value.request.capabilitySnapshotId !== value.capabilitySnapshot.capabilitySnapshotId ||
    value.request.capabilitySnapshotDigest !== value.capabilitySnapshot.evidenceDigest ||
    value.envelope.route.capabilitySnapshotId !== value.capabilitySnapshot.capabilitySnapshotId ||
    value.envelope.route.capabilitySnapshotDigest !== value.capabilitySnapshot.evidenceDigest
  ) context.addIssue({ code: 'custom', path: ['capabilitySnapshot'], message: 'Speech request and route must bind the exact capability snapshot.' })
  if (
    value.attempt.speechRequestId !== value.request.speechRequestId ||
    value.attempt.requestDigest !== value.envelope.requestDigest ||
    value.attempt.approvedSnapshotId !== value.request.approvedSnapshotId ||
    value.attempt.approvedWorkItemId !== value.request.approvedWorkItemId ||
    value.attempt.jobId !== value.request.jobId ||
    value.attempt.attemptId !== value.request.attemptId ||
    value.attempt.leaseId !== value.request.leaseId ||
    value.attempt.costBudgetId !== value.request.costBudgetId ||
    value.attempt.idempotencyKeyHash !== value.request.idempotencyKeyHash
  ) context.addIssue({ code: 'custom', path: ['attempt'], message: 'Speech attempt must bind the exact approved request, work, job, lease, and cost authority.' })
  if (
    value.envelope.requestId !== value.request.speechRequestId ||
    value.candidate.speechRequestId !== value.request.speechRequestId ||
    value.candidate.requestDigest !== value.envelope.requestDigest ||
    value.candidate.voiceSegmentId !== value.request.voiceSegmentId ||
    value.candidate.approvedSnapshotId !== value.request.approvedSnapshotId ||
    value.candidate.approvedWorkItemId !== value.request.approvedWorkItemId ||
    value.candidate.jobId !== value.request.jobId ||
    value.candidate.attemptId !== value.request.attemptId ||
    value.candidate.leaseId !== value.request.leaseId ||
    value.candidate.costBudgetId !== value.request.costBudgetId ||
    value.candidate.idempotencyKeyHash !== value.request.idempotencyKeyHash ||
    value.candidate.voiceBindingId !== value.request.voice.voiceBindingId ||
    value.candidate.modelId !== value.envelope.route.selectedModelId
  ) context.addIssue({ code: 'custom', path: ['candidate'], message: 'Speech candidate must bind the exact compiled request, route, segment, and voice.' })
  if (
    value.usage.speechRequestId !== value.request.speechRequestId ||
    value.usage.requestDigest !== value.envelope.requestDigest ||
    value.usage.attemptId !== value.attempt.attemptId ||
    value.usage.candidateTakeId !== value.candidate.candidateTakeId ||
    value.usage.costBudgetId !== value.request.costBudgetId ||
    value.usage.outputByteLength !== value.candidate.byteLength ||
    value.usage.outputDurationMilliseconds !== value.candidate.durationMilliseconds
  ) context.addIssue({ code: 'custom', path: ['usage'], message: 'Speech usage must bind the exact request, attempt, candidate, output, and cost budget.' })
  if (
    value.alignment.speechRequestId !== value.request.speechRequestId ||
    value.alignment.requestDigest !== value.envelope.requestDigest ||
    value.alignment.candidateTakeId !== value.candidate.candidateTakeId ||
    value.alignment.audioSha256 !== value.candidate.audioSha256 ||
    value.alignment.timingAuthorityDigest !== value.request.timingAuthorityDigest
  ) context.addIssue({ code: 'custom', path: ['alignment'], message: 'Speech alignment state must bind the exact request, candidate media, and timing authority.' })
  if (
    value.selectionState.speechRequestId !== value.request.speechRequestId ||
    value.selectionState.candidateTakeId !== value.candidate.candidateTakeId ||
    value.selectionState.qaEvidenceDigest !== value.candidate.qaEvidenceDigest ||
    value.selectionState.alignmentRecordId !== value.alignment.alignmentRecordId
  ) context.addIssue({ code: 'custom', path: ['selectionState'], message: 'Speech selection state must bind the exact candidate, QA, and alignment authority.' })
  if (value.outputBytes.byteLength !== value.candidate.byteLength) {
    context.addIssue({ code: 'custom', path: ['outputBytes'], message: 'Protocol output byte length must match candidate authority.' })
  }
  if (
    value.envelope.spokenText !== value.request.spokenText ||
    value.envelope.voiceBindingId !== value.request.voice.voiceBindingId ||
    value.envelope.language !== value.request.language
  ) context.addIssue({ code: 'custom', path: ['envelope'], message: 'Compiled speech envelope must preserve exact normalized request authority.' })
  for (const error of validateMotionStudioDeepValue(stripBytes(value)).errors) {
    context.addIssue({ code: 'custom', message: error })
  }
})

const candidateSummarySchema = z.object({
  candidateTakeId: stableId,
  voiceSegmentId: stableId,
  intendedModelRole: motionStudioSpeechModelRoleSchema,
  source: z.literal('protocol_simulator_fixture'),
  state: z.literal('protocol_fixture_only'),
  attemptState: z.literal('protocol_completed'),
  usageState: z.literal('protocol_zero_cost'),
  alignmentState: z.literal('not_evaluated_protocol'),
  selectionState: z.literal('ineligible_protocol'),
  durationMilliseconds: safeInteger.min(100).max(30_000),
  reviewStatus: z.literal('not_reviewable_protocol'),
  selected: z.literal(false),
  firstTakeAutoAccepted: z.literal(false),
  qaGatesPassed: z.array(qaGateSchema).length(protocolPassedQaGates.length).readonly(),
  qaGatesNotEvaluated: z.array(qaGateSchema).length(protocolNotEvaluatedQaGates.length).readonly(),
  providerExecutionPerformed: z.literal(false),
  privateEvidenceOnly: z.literal(true),
}).strict().superRefine((value, context) => {
  if (!sameSet(value.qaGatesPassed, protocolPassedQaGates)) {
    context.addIssue({ code: 'custom', path: ['qaGatesPassed'], message: 'Safe speech protocol summary may expose only passed structural QA gates.' })
  }
  if (!sameSet(value.qaGatesNotEvaluated, protocolNotEvaluatedQaGates)) {
    context.addIssue({ code: 'custom', path: ['qaGatesNotEvaluated'], message: 'Safe speech protocol summary must expose unevaluated meaning and rights gates.' })
  }
})

export const motionStudioSpeechWorkspaceDtoSchema:
z.ZodType<MotionStudioSpeechWorkspaceDto> = z.object({
  productionId: stableId,
  state: z.literal('protocol_evidence_ready'),
  currentModelSetting: z.literal('auto'),
  capabilityState: z.literal('external_discovery_required'),
  candidates: z.array(candidateSummarySchema).max(512).readonly(),
  cloningEnabled: z.literal(false),
  dubbingEnabled: z.literal(false),
  providerExecutionEnabled: z.literal(false),
  warning: safeText(8, 600),
}).strict()

function stripBytes(value: MotionStudioSpeechProtocolBundleV1): unknown {
  return {
    ...value,
    outputBytes: { byteLength: value.outputBytes.byteLength, redactedFromSharedValidation: true },
  }
}

function hasUnsafeText(value: string): boolean {
  const hasControlCharacter = [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
  return hasControlCharacter ||
    /(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\|\/[A-Za-z0-9._-]+\/)/i.test(value)
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && new Set(left).size === left.length &&
    new Set(right).size === right.length && left.every((value) => right.includes(value))
}
