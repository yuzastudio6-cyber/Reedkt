import { z } from 'zod'

import type {
  MotionStudioAudioAuthorityBundleV2,
  MotionStudioAudioCapabilityPolicySnapshotV1,
  MotionStudioAudioStemV1,
  MotionStudioAudioWorkspaceDto,
  MotionStudioMixPlanV1,
  MotionStudioMusicBibleV2,
  MotionStudioMusicCueV2,
  MotionStudioSoundEventV1,
  MotionStudioVoiceAlignmentV1,
  MotionStudioVoiceBibleV2,
  MotionStudioVoiceQualityReportV1,
  MotionStudioVoiceSegmentPlanV2,
  MotionStudioVoiceTakeCandidateV2,
  MotionStudioVoiceTakeSelectionV1,
  MotionStudioVersionReference,
} from '../../../types/motion-studio'
import {
  MOTION_STUDIO_AUDIO_AUTHORITY_SCHEMA_VERSION,
  MOTION_STUDIO_AUDIO_CAPABILITY_POLICY_VERSION,
} from '../../../types/motion-studio'
import { validateMotionStudioDeepValue } from './safe-values'
import {
  motionStudioOwnershipSchema,
  motionStudioTimingAuthoritySchema,
  motionStudioVersionReferenceSchema,
} from './schemas'

const stableId = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const isoDate = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().refine(Number.isSafeInteger)
const positiveSafeInteger = z.number().int().positive().refine(Number.isSafeInteger)
const safeText = (maximum: number) => z.string().trim().min(1).max(maximum)
  .refine((value) => !/(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\)/i.test(value), {
    message: 'URLs, URI payloads, and relative paths are forbidden in audio authority text.',
  })

const audioAssetVersionRefSchema = z.object({
  assetId: stableId,
  assetVersionId: stableId,
  contentDigest: digest,
  provenanceRecordId: stableId,
  rightsEvidenceIds: z.array(stableId).min(1).max(32).readonly(),
}).strict()

const audioFrameRangeSchema = z.object({
  startTimingAnchorId: stableId,
  endTimingAnchorId: stableId,
  startFrame: safeInteger,
  endFrame: positiveSafeInteger,
}).strict().superRefine((value, context) => {
  if (value.startFrame >= value.endFrame) {
    context.addIssue({ code: 'custom', path: ['endFrame'], message: 'Audio frame range must advance.' })
  }
  if (value.startTimingAnchorId === value.endTimingAnchorId) {
    context.addIssue({ code: 'custom', path: ['endTimingAnchorId'], message: 'Audio frame range requires distinct timing anchors.' })
  }
})

const pronunciationEntrySchema = z.object({
  pronunciationId: stableId,
  writtenForm: safeText(240),
  spokenForm: safeText(240),
  language: safeText(80),
  reason: z.enum(['proper_name', 'place_name', 'foreign_term', 'number', 'date', 'abbreviation']),
  evidenceId: stableId,
}).strict().superRefine((value, context) => {
  if (value.writtenForm === value.spokenForm) {
    context.addIssue({ code: 'custom', path: ['spokenForm'], message: 'Pronunciation entry must describe an actual spoken-form change.' })
  }
})

const performancePlanSchema = z.object({
  pace: z.enum(['measured', 'natural', 'urgent']),
  energy: z.enum(['restrained', 'balanced', 'intense']),
  emotionalDirection: z.array(safeText(160)).min(1).max(12).readonly(),
  emphasisTerms: z.array(safeText(120)).max(24).readonly(),
  pauseBeforeFrames: safeInteger,
  pauseAfterFrames: safeInteger,
  performanceTagIds: z.array(safeText(120)).max(16).readonly(),
}).strict()

export const motionStudioVoiceSegmentPlanV2Schema: z.ZodType<MotionStudioVoiceSegmentPlanV2> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.voice-segment-plan.v2'),
    productionId: stableId,
    voiceSegmentId: stableId,
    preparedScriptArtifactVersion: motionStudioVersionReferenceSchema,
    preparedScriptSegmentId: stableId,
    chapterId: stableId,
    sceneId: stableId,
    order: safeInteger,
    timingAuthorityDigest: digest,
    range: audioFrameRangeSchema,
    displayText: safeText(8_000),
    spokenText: safeText(8_000),
    spokenTextChangeReason: z.enum([
      'none', 'pronunciation_normalization', 'number_reading_normalization',
      'date_reading_normalization', 'abbreviation_expansion',
    ]),
    spokenTextChangeExplanation: safeText(1_000).optional(),
    preparedMeaningDigest: digest,
    meaningPreserved: z.literal(true),
    language: safeText(80),
    pronunciationEntries: z.array(pronunciationEntrySchema).max(64).readonly(),
    performance: performancePlanSchema,
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    const changed = value.displayText !== value.spokenText
    if (!changed && value.spokenTextChangeReason !== 'none') {
      context.addIssue({ code: 'custom', path: ['spokenTextChangeReason'], message: 'Unchanged spoken text must use reason none.' })
    }
    if (!changed && value.spokenTextChangeExplanation) {
      context.addIssue({ code: 'custom', path: ['spokenTextChangeExplanation'], message: 'Unchanged spoken text cannot carry a change explanation.' })
    }
    if (changed && value.spokenTextChangeReason === 'none') {
      context.addIssue({ code: 'custom', path: ['spokenTextChangeReason'], message: 'Changed spoken text requires an explicit normalization reason.' })
    }
    if (changed && !value.spokenTextChangeExplanation) {
      context.addIssue({ code: 'custom', path: ['spokenTextChangeExplanation'], message: 'Changed spoken text requires a bounded explanation.' })
    }
    if (changed && value.pronunciationEntries.length === 0) {
      context.addIssue({ code: 'custom', path: ['pronunciationEntries'], message: 'Changed spoken text requires exact reviewed normalization entries.' })
    }
    value.pronunciationEntries.forEach((entry, index) => {
      if (!value.displayText.includes(entry.writtenForm) || !value.spokenText.includes(entry.spokenForm)) {
        context.addIssue({ code: 'custom', path: ['pronunciationEntries', index], message: 'Pronunciation entry must bind text present in both display and spoken forms.' })
      }
    })
    const normalizedText = value.pronunciationEntries.reduce(
      (text, entry) => text.replaceAll(entry.writtenForm, entry.spokenForm),
      value.displayText,
    )
    if (normalizedText !== value.spokenText) {
      context.addIssue({ code: 'custom', path: ['spokenText'], message: 'Spoken text may differ only by the exact reviewed normalization entries.' })
    }
    const allowedEntryReasons = value.spokenTextChangeReason === 'pronunciation_normalization'
      ? new Set(['proper_name', 'place_name', 'foreign_term'])
      : value.spokenTextChangeReason === 'number_reading_normalization'
        ? new Set(['number'])
        : value.spokenTextChangeReason === 'date_reading_normalization'
          ? new Set(['date'])
          : value.spokenTextChangeReason === 'abbreviation_expansion'
            ? new Set(['abbreviation'])
            : new Set<string>()
    if (changed && value.pronunciationEntries.some((entry) => !allowedEntryReasons.has(entry.reason))) {
      context.addIssue({ code: 'custom', path: ['pronunciationEntries'], message: 'Normalization-entry reasons must match the spoken-text change reason.' })
    }
  })

const consentAuthoritySchema = z.object({
  status: z.enum(['not_required_user_upload', 'verified_provider_voice_catalog']),
  evidenceId: stableId,
  cloningAuthorized: z.literal(false),
  dubbingAuthorized: z.literal(false),
}).strict()

const disclosureAuthoritySchema = z.object({
  aiGenerated: z.boolean(),
  disclosureRequired: z.boolean(),
  disclosureCode: z.literal('ai_generated_voice').optional(),
  disclosureReviewed: z.boolean(),
}).strict()

export const motionStudioVoiceTakeCandidateV2Schema: z.ZodType<MotionStudioVoiceTakeCandidateV2> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.voice-take-candidate.v2'),
    productionId: stableId,
    takeId: stableId,
    voiceSegmentId: stableId,
    origin: z.enum(['uploaded_narration', 'generated_speech_protocol_fixture']),
    audioAssetVersion: audioAssetVersionRefSchema,
    voiceProfileReference: safeText(240),
    capabilityPolicyEntryId: stableId,
    consent: consentAuthoritySchema,
    disclosure: disclosureAuthoritySchema,
    cloningEnabled: z.literal(false),
    dubbingEnabled: z.literal(false),
    providerExecutionPerformed: z.literal(false),
    mediaExecutionPerformed: z.literal(false),
    reviewStatus: z.enum(['candidate', 'selected', 'rejected']),
    finalAssetEligible: z.literal(false),
    createdAt: isoDate,
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    if (value.origin === 'uploaded_narration') {
      if (value.disclosure.aiGenerated || value.disclosure.disclosureRequired || value.disclosure.disclosureCode) {
        context.addIssue({ code: 'custom', path: ['disclosure'], message: 'Uploaded narration cannot be represented as AI-generated speech.' })
      }
      if (value.consent.status !== 'not_required_user_upload') {
        context.addIssue({ code: 'custom', path: ['consent', 'status'], message: 'Uploaded narration requires upload-specific consent authority.' })
      }
    } else {
      if (!value.disclosure.aiGenerated || !value.disclosure.disclosureRequired || value.disclosure.disclosureCode !== 'ai_generated_voice' || !value.disclosure.disclosureReviewed) {
        context.addIssue({ code: 'custom', path: ['disclosure'], message: 'Generated speech protocol candidates require reviewed AI-voice disclosure.' })
      }
      if (value.consent.status !== 'verified_provider_voice_catalog') {
        context.addIssue({ code: 'custom', path: ['consent', 'status'], message: 'Generated speech protocol candidates require catalog-voice authority.' })
      }
    }
  })

export const motionStudioVoiceTakeSelectionV1Schema: z.ZodType<MotionStudioVoiceTakeSelectionV1> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.voice-take-selection.v1'),
    productionId: stableId,
    voiceSegmentId: stableId,
    candidateTakeIds: z.array(stableId).min(2).max(12).readonly(),
    selectedTakeId: stableId,
    selectionMethod: z.literal('explicit_fixture_review'),
    firstTakeAutoAccepted: z.literal(false),
    selectedByActorId: stableId,
    selectedAt: isoDate,
    decisionReason: safeText(1_000),
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    if (new Set(value.candidateTakeIds).size !== value.candidateTakeIds.length) {
      context.addIssue({ code: 'custom', path: ['candidateTakeIds'], message: 'Take selection candidates must be unique.' })
    }
    if (!value.candidateTakeIds.includes(value.selectedTakeId)) {
      context.addIssue({ code: 'custom', path: ['selectedTakeId'], message: 'Selected take must be an explicit candidate.' })
    }
  })

const alignmentTokenSchema = z.object({
  tokenId: stableId,
  text: safeText(500),
  range: audioFrameRangeSchema,
}).strict()

export const motionStudioVoiceAlignmentV1Schema: z.ZodType<MotionStudioVoiceAlignmentV1> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.voice-alignment.v1'),
    productionId: stableId,
    alignmentId: stableId,
    voiceSegmentId: stableId,
    takeId: stableId,
    method: z.literal('declared_fixture_alignment'),
    timingAuthorityDigest: digest,
    tokens: z.array(alignmentTokenSchema).min(1).max(512).readonly(),
    executionPerformed: z.literal(false),
    reviewed: z.literal(true),
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    value.tokens.forEach((token, index) => {
      const previous = value.tokens[index - 1]
      if (previous && token.range.startFrame < previous.range.endFrame) {
        context.addIssue({ code: 'custom', path: ['tokens', index, 'range'], message: 'Alignment tokens must be ordered and non-overlapping.' })
      }
    })
  })

const voiceQaGate = z.enum([
  'file_integrity', 'alignment', 'pronunciation', 'voice_continuity',
  'clipping', 'loudness', 'timing', 'disclosure', 'rights',
])

export const motionStudioVoiceQualityReportV1Schema: z.ZodType<MotionStudioVoiceQualityReportV1> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.voice-quality-report.v1'),
    productionId: stableId,
    qualityReportId: stableId,
    voiceSegmentId: stableId,
    takeId: stableId,
    gateResults: z.array(z.object({
      gate: voiceQaGate,
      result: z.enum(['passed', 'failed', 'not_run']),
      blocking: z.literal(true),
      evidenceId: stableId.optional(),
      note: safeText(1_000),
    }).strict()).length(9).readonly(),
    selectionEligible: z.boolean(),
    finalMixEligible: z.literal(false),
    reviewedAt: isoDate,
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    const gates = value.gateResults.map((result) => result.gate)
    if (new Set(gates).size !== gates.length) {
      context.addIssue({ code: 'custom', path: ['gateResults'], message: 'Every voice QA gate must appear exactly once.' })
    }
    const allPassed = value.gateResults.every((result) => result.result === 'passed' && result.evidenceId)
    if (value.selectionEligible !== allPassed) {
      context.addIssue({ code: 'custom', path: ['selectionEligible'], message: 'Voice selection eligibility requires evidence-backed success at every blocking gate.' })
    }
  })

export const motionStudioVoiceBibleV2Schema: z.ZodType<MotionStudioVoiceBibleV2> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.voice-bible.v2'),
    productionId: stableId,
    voiceBibleId: stableId,
    voiceBibleArtifactVersion: motionStudioVersionReferenceSchema,
    preparedScriptArtifactVersion: motionStudioVersionReferenceSchema,
    language: safeText(80),
    voiceSegmentIds: z.array(stableId).min(1).max(512).readonly(),
    selectedTakeIds: z.array(stableId).min(1).max(512).readonly(),
    performanceDirection: z.array(safeText(500)).min(1).max(32).readonly(),
    cloningEnabled: z.literal(false),
    dubbingEnabled: z.literal(false),
    providerExecutionAllowed: z.literal(false),
    immutable: z.literal(true),
  }).strict()

const stemRole = z.enum(['narration', 'music', 'foley', 'ambience', 'exact_sfx'])

export const motionStudioAudioStemV1Schema: z.ZodType<MotionStudioAudioStemV1> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.audio-stem.v1'),
    productionId: stableId,
    stemId: stableId,
    role: stemRole,
    origin: z.enum([
      'uploaded_narration', 'uploaded_music', 'uploaded_stem', 'licensed_sfx',
      'generated_speech_protocol_fixture', 'generated_music_protocol_fixture',
      'synchronized_foley_protocol_fixture',
    ]),
    audioAssetVersion: audioAssetVersionRefSchema,
    capabilityPolicyEntryId: stableId,
    speechBearing: z.boolean(),
    rightsReviewed: z.literal(true),
    providerExecutionPerformed: z.literal(false),
    mediaExecutionPerformed: z.literal(false),
    finalAssetEligible: z.literal(false),
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    if (value.speechBearing !== (value.role === 'narration')) {
      context.addIssue({ code: 'custom', path: ['speechBearing'], message: 'Only narration stems may be speech-bearing.' })
    }
  })

export const motionStudioMusicBibleV2Schema: z.ZodType<MotionStudioMusicBibleV2> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.music-bible.v2'),
    productionId: stableId,
    musicBibleId: stableId,
    musicBibleArtifactVersion: motionStudioVersionReferenceSchema,
    scoreMode: z.enum(['uploaded_music', 'uploaded_stems', 'hybrid']),
    mood: z.array(safeText(160)).min(1).max(16).readonly(),
    instrumentation: z.array(safeText(160)).min(1).max(32).readonly(),
    vocalPolicy: z.literal('instrumental_only'),
    speechSafetyRules: z.array(safeText(500)).min(1).max(16).readonly(),
    rightsEvidenceIds: z.array(stableId).min(1).max(32).readonly(),
    stemIds: z.array(stableId).min(1).max(32).readonly(),
    providerExecutionAllowed: z.literal(false),
    immutable: z.literal(true),
  }).strict()

export const motionStudioMusicCueV2Schema: z.ZodType<MotionStudioMusicCueV2> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.music-cue.v2'),
    productionId: stableId,
    cueId: stableId,
    musicBibleArtifactVersion: motionStudioVersionReferenceSchema,
    stemId: stableId,
    sceneIds: z.array(stableId).min(1).max(64).readonly(),
    timingAuthorityDigest: digest,
    range: audioFrameRangeSchema,
    narrativePurpose: safeText(1_000),
    emotionalDirection: safeText(500),
    speechOverlapPolicy: z.enum(['duck_below_narration', 'no_speech_overlap']),
    immutable: z.literal(true),
  }).strict()

export const motionStudioSoundEventV1Schema: z.ZodType<MotionStudioSoundEventV1> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.sound-event.v1'),
    productionId: stableId,
    soundEventId: stableId,
    role: z.enum(['foley', 'ambience', 'exact_sfx']),
    stemId: stableId,
    sceneId: stableId,
    timingAuthorityDigest: digest,
    range: audioFrameRangeSchema,
    reasonKind: z.enum(['visible_action', 'story_environment', 'exact_named_sound']),
    reason: safeText(1_000),
    sourceEventId: stableId,
    speechOverlapPolicy: z.enum(['duck_below_narration', 'avoid_speech_overlap']),
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    const expectedReason = value.role === 'foley'
      ? 'visible_action'
      : value.role === 'ambience'
        ? 'story_environment'
        : 'exact_named_sound'
    if (value.reasonKind !== expectedReason) {
      context.addIssue({ code: 'custom', path: ['reasonKind'], message: 'Sound-event role and reason kind must match.' })
    }
  })

const mixQaGate = z.enum([
  'stem_integrity', 'narration_intelligibility', 'speech_priority',
  'integrated_loudness', 'true_peak', 'clipping', 'cue_timing', 'rights',
])

export const motionStudioMixPlanV1Schema: z.ZodType<MotionStudioMixPlanV1> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal('motion-studio.mix-plan.v1'),
    productionId: stableId,
    mixPlanId: stableId,
    mixPlanArtifactVersion: motionStudioVersionReferenceSchema,
    timingAuthorityDigest: digest,
    stemIds: z.array(stableId).min(2).max(64).readonly(),
    narrationStemIds: z.array(stableId).min(1).max(16).readonly(),
    musicStemIds: z.array(stableId).max(16).readonly(),
    foleyStemIds: z.array(stableId).max(16).readonly(),
    ambienceStemIds: z.array(stableId).max(16).readonly(),
    exactSfxStemIds: z.array(stableId).max(16).readonly(),
    speechPriority: z.literal(true),
    narrationDucking: z.object({
      enabled: z.literal(true),
      musicGainReductionDb: z.number().finite().min(-30).max(-3),
      effectsGainReductionDb: z.number().finite().min(-30).max(-1),
      attackFrames: positiveSafeInteger,
      releaseFrames: positiveSafeInteger,
    }).strict(),
    targetIntegratedLufs: z.number().finite().min(-24).max(-12),
    targetTruePeakDbtp: z.number().finite().min(-6).max(-0.1),
    requiredQaGates: z.array(mixQaGate).length(8).readonly(),
    finalMixExecutionAllowed: z.literal(false),
    timelineMutationAllowed: z.literal(false),
    renderAllowed: z.literal(false),
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    const partitions = [
      ...value.narrationStemIds, ...value.musicStemIds, ...value.foleyStemIds,
      ...value.ambienceStemIds, ...value.exactSfxStemIds,
    ]
    if (new Set(value.stemIds).size !== value.stemIds.length || new Set(partitions).size !== partitions.length) {
      context.addIssue({ code: 'custom', path: ['stemIds'], message: 'Mix-plan stem identities and role partitions must be unique.' })
    }
    if (!sameSet(value.stemIds, partitions)) {
      context.addIssue({ code: 'custom', path: ['stemIds'], message: 'Mix-plan role partitions must cover every stem exactly once.' })
    }
    if (new Set(value.requiredQaGates).size !== value.requiredQaGates.length) {
      context.addIssue({ code: 'custom', path: ['requiredQaGates'], message: 'Every required mix QA gate must appear exactly once.' })
    }
  })

const capabilityEntrySchema = z.object({
  entryId: stableId,
  capability: z.enum([
    'speech_generation', 'uploaded_narration', 'music_generation',
    'uploaded_music', 'synchronized_foley', 'exact_sfx', 'deterministic_mix',
  ]),
  routeId: z.enum([
    'eleven_v3', 'eleven_multilingual_v2', 'eleven_flash_v2_5',
    'verified_private_narration_upload', 'verified_private_music_upload',
    'lyria_3_pro', 'mmaudio',
    'licensed_or_uploaded_sfx', 'reeditpro_deterministic_mix',
  ]),
  use: z.enum(['final_candidate', 'stability_fallback', 'audition_or_temporary', 'user_asset', 'planned_only']),
  runtimeEnabled: z.literal(false),
  externalTransportEnabled: z.literal(false),
  runtimeAccessAvailable: z.literal(false),
  productReady: z.literal(false),
  capabilityDiscoveryMethod: z.literal('owner_policy_snapshot'),
}).strict()

const expectedCapabilityRoutes = [
  'eleven_v3', 'eleven_multilingual_v2', 'eleven_flash_v2_5',
  'verified_private_narration_upload', 'verified_private_music_upload',
  'lyria_3_pro', 'mmaudio',
  'licensed_or_uploaded_sfx', 'reeditpro_deterministic_mix',
] as const

export const motionStudioAudioCapabilityPolicySnapshotV1Schema:
z.ZodType<MotionStudioAudioCapabilityPolicySnapshotV1> = motionStudioOwnershipSchema.extend({
  schemaVersion: z.literal(MOTION_STUDIO_AUDIO_CAPABILITY_POLICY_VERSION),
  productionId: stableId,
  policySnapshotId: stableId,
  entries: z.array(capabilityEntrySchema).length(expectedCapabilityRoutes.length).readonly(),
  capturedAt: isoDate,
  providerExecutionAllowed: z.literal(false),
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const routes = value.entries.map((entry) => entry.routeId)
  if (!sameSet(routes, expectedCapabilityRoutes)) {
    context.addIssue({ code: 'custom', path: ['entries'], message: 'Capability policy must contain every closed registered audio route exactly once.' })
  }
  if (new Set(value.entries.map((entry) => entry.entryId)).size !== value.entries.length) {
    context.addIssue({ code: 'custom', path: ['entries'], message: 'Capability policy entry identities must be unique.' })
  }
})

const executionBoundarySchema = z.object({
  localFixtureOnly: z.literal(true),
  providerCallMade: z.literal(false),
  mediaExecutionPerformed: z.literal(false),
  alignmentExecutionPerformed: z.literal(false),
  mixExecutionPerformed: z.literal(false),
  timelineMutationPerformed: z.literal(false),
  renderPerformed: z.literal(false),
  providerCostMicros: z.literal(0),
  maximumAuthorizedProviderCostMicros: z.literal(0),
  customerPricingIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
}).strict()

export const motionStudioAudioAuthorityBundleV2Schema: z.ZodType<MotionStudioAudioAuthorityBundleV2> =
  motionStudioOwnershipSchema.extend({
    schemaVersion: z.literal(MOTION_STUDIO_AUDIO_AUTHORITY_SCHEMA_VERSION),
    productionId: stableId,
    approvedSnapshotId: stableId,
    approvedSnapshotDigest: digest,
    preparedScriptArtifactVersion: motionStudioVersionReferenceSchema,
    timingAuthority: motionStudioTimingAuthoritySchema,
    voiceBible: motionStudioVoiceBibleV2Schema,
    voiceSegments: z.array(motionStudioVoiceSegmentPlanV2Schema).min(1).max(512).readonly(),
    takeCandidates: z.array(motionStudioVoiceTakeCandidateV2Schema).min(2).max(2_048).readonly(),
    takeSelections: z.array(motionStudioVoiceTakeSelectionV1Schema).min(1).max(512).readonly(),
    alignments: z.array(motionStudioVoiceAlignmentV1Schema).min(1).max(2_048).readonly(),
    voiceQualityReports: z.array(motionStudioVoiceQualityReportV1Schema).min(2).max(2_048).readonly(),
    musicBible: motionStudioMusicBibleV2Schema,
    stems: z.array(motionStudioAudioStemV1Schema).min(2).max(64).readonly(),
    musicCues: z.array(motionStudioMusicCueV2Schema).min(1).max(128).readonly(),
    soundEvents: z.array(motionStudioSoundEventV1Schema).min(1).max(256).readonly(),
    mixPlan: motionStudioMixPlanV1Schema,
    capabilityPolicy: motionStudioAudioCapabilityPolicySnapshotV1Schema,
    executionBoundary: executionBoundarySchema,
    createdAt: isoDate,
    immutable: z.literal(true),
  }).strict().superRefine((value, context) => {
    refineAudioAuthorityBundle(value, context)
    for (const error of validateMotionStudioDeepValue(value).errors) {
      context.addIssue({ code: 'custom', message: error })
    }
  })

export const motionStudioAudioWorkspaceDtoSchema: z.ZodType<MotionStudioAudioWorkspaceDto> =
  motionStudioOwnershipSchema.extend({
    productionId: stableId,
    audioAuthority: motionStudioAudioAuthorityBundleV2Schema,
    state: z.literal('review_only'),
    warning: safeText(1_000),
  }).strict().superRefine((value, context) => {
    if (
      value.audioAuthority.workspaceId !== value.workspaceId ||
      value.audioAuthority.projectId !== value.projectId ||
      value.audioAuthority.editSessionId !== value.editSessionId ||
      value.audioAuthority.productionId !== value.productionId
    ) {
      context.addIssue({ code: 'custom', path: ['audioAuthority'], message: 'Audio workspace DTO and authority scope must match exactly.' })
    }
  })

function refineAudioAuthorityBundle(
  value: MotionStudioAudioAuthorityBundleV2,
  context: z.RefinementCtx,
): void {
  const nestedScope = [
    value.voiceBible, ...value.voiceSegments, ...value.takeCandidates,
    ...value.takeSelections, ...value.alignments, ...value.voiceQualityReports,
    value.musicBible, ...value.stems, ...value.musicCues, ...value.soundEvents,
    value.mixPlan, value.capabilityPolicy,
  ]
  nestedScope.forEach((record, index) => {
    if (
      record.workspaceId !== value.workspaceId ||
      record.projectId !== value.projectId ||
      record.editSessionId !== value.editSessionId ||
      record.productionId !== value.productionId
    ) {
      context.addIssue({ code: 'custom', path: ['scope', index], message: 'Every audio authority record must use the exact bundle tenant and production scope.' })
    }
  })

  if (!sameVersion(value.preparedScriptArtifactVersion, value.voiceBible.preparedScriptArtifactVersion)) {
    context.addIssue({ code: 'custom', path: ['voiceBible', 'preparedScriptArtifactVersion'], message: 'Voice Bible must bind the exact prepared-script artifact version.' })
  }

  const segmentIds = value.voiceSegments.map((segment) => segment.voiceSegmentId)
  if (!allUnique(segmentIds) || !sameSet(segmentIds, value.voiceBible.voiceSegmentIds)) {
    context.addIssue({ code: 'custom', path: ['voiceSegments'], message: 'Voice Bible and segment identities must be unique and exact.' })
  }
  const orders = value.voiceSegments.map((segment) => segment.order)
  if (!allUnique(orders) || orders.some((order, index) => index > 0 && order <= orders[index - 1]!)) {
    context.addIssue({ code: 'custom', path: ['voiceSegments'], message: 'Voice segments must have strictly increasing unique order.' })
  }
  value.voiceSegments.forEach((segment, index) => {
    if (!sameVersion(segment.preparedScriptArtifactVersion, value.preparedScriptArtifactVersion)) {
      context.addIssue({ code: 'custom', path: ['voiceSegments', index, 'preparedScriptArtifactVersion'], message: 'Voice segment must bind the exact prepared-script version.' })
    }
    refineRange(segment.range, value.timingAuthority.durationFrames, value.timingAuthority.timingAuthorityDigest, segment.timingAuthorityDigest, context, ['voiceSegments', index, 'range'])
  })

  const segments = new Map(value.voiceSegments.map((segment) => [segment.voiceSegmentId, segment]))
  const candidates = new Map(value.takeCandidates.map((take) => [take.takeId, take]))
  if (candidates.size !== value.takeCandidates.length) {
    context.addIssue({ code: 'custom', path: ['takeCandidates'], message: 'Voice take identities must be unique.' })
  }
  const policyEntries = new Map(value.capabilityPolicy.entries.map((entry) => [entry.entryId, entry]))
  value.takeCandidates.forEach((take, index) => {
    if (!segments.has(take.voiceSegmentId)) {
      context.addIssue({ code: 'custom', path: ['takeCandidates', index, 'voiceSegmentId'], message: 'Voice take must bind a known voice segment.' })
    }
    const policy = policyEntries.get(take.capabilityPolicyEntryId)
    const expectedCapability = take.origin === 'uploaded_narration' ? 'uploaded_narration' : 'speech_generation'
    if (!policy || policy.capability !== expectedCapability) {
      context.addIssue({ code: 'custom', path: ['takeCandidates', index, 'capabilityPolicyEntryId'], message: 'Voice take must bind an exact compatible closed capability entry.' })
    }
  })

  const selectedTakeIds: string[] = []
  value.takeSelections.forEach((selection, index) => {
    const segment = segments.get(selection.voiceSegmentId)
    if (!segment) {
      context.addIssue({ code: 'custom', path: ['takeSelections', index, 'voiceSegmentId'], message: 'Take selection must bind a known voice segment.' })
      return
    }
    const scopedCandidates = selection.candidateTakeIds.map((takeId) => candidates.get(takeId))
    if (scopedCandidates.some((candidate) => !candidate || candidate.voiceSegmentId !== selection.voiceSegmentId)) {
      context.addIssue({ code: 'custom', path: ['takeSelections', index, 'candidateTakeIds'], message: 'Selection candidates must all belong to the exact voice segment.' })
    }
    const selected = candidates.get(selection.selectedTakeId)
    if (!selected || selected.reviewStatus !== 'selected') {
      context.addIssue({ code: 'custom', path: ['takeSelections', index, 'selectedTakeId'], message: 'Explicitly selected take must carry selected review status.' })
    }
    scopedCandidates.forEach((candidate) => {
      if (candidate && candidate.takeId !== selection.selectedTakeId && candidate.reviewStatus === 'selected') {
        context.addIssue({ code: 'custom', path: ['takeSelections', index, 'candidateTakeIds'], message: 'A voice segment may have only one selected take.' })
      }
    })
    selectedTakeIds.push(selection.selectedTakeId)
  })
  if (value.takeSelections.length !== value.voiceSegments.length || !sameSet(selectedTakeIds, value.voiceBible.selectedTakeIds)) {
    context.addIssue({ code: 'custom', path: ['takeSelections'], message: 'Every voice segment requires exactly one explicit selected take reflected by the Voice Bible.' })
  }

  const qaByTake = new Map(value.voiceQualityReports.map((report) => [report.takeId, report]))
  value.takeCandidates.forEach((take, index) => {
    const report = qaByTake.get(take.takeId)
    if (!report || report.voiceSegmentId !== take.voiceSegmentId) {
      context.addIssue({ code: 'custom', path: ['voiceQualityReports'], message: `Take ${index} requires one matching QA report.` })
    } else if (take.reviewStatus === 'selected' && !report.selectionEligible) {
      context.addIssue({ code: 'custom', path: ['voiceQualityReports'], message: 'Selected voice take must pass every blocking QA gate.' })
    } else if (take.reviewStatus !== 'selected' && report.selectionEligible) {
      context.addIssue({ code: 'custom', path: ['voiceQualityReports'], message: 'Unselected protocol candidate cannot be marked selection eligible.' })
    }
  })
  if (qaByTake.size !== value.voiceQualityReports.length || qaByTake.size !== value.takeCandidates.length) {
    context.addIssue({ code: 'custom', path: ['voiceQualityReports'], message: 'Every take requires exactly one quality report.' })
  }

  const alignmentIds = new Set<string>()
  value.alignments.forEach((alignment, index) => {
    const segment = segments.get(alignment.voiceSegmentId)
    const take = candidates.get(alignment.takeId)
    if (!segment || !take || take.voiceSegmentId !== alignment.voiceSegmentId) {
      context.addIssue({ code: 'custom', path: ['alignments', index], message: 'Alignment must bind a matching known segment and take.' })
      return
    }
    if (alignmentIds.has(alignment.alignmentId)) {
      context.addIssue({ code: 'custom', path: ['alignments', index, 'alignmentId'], message: 'Alignment identities must be unique.' })
    }
    alignmentIds.add(alignment.alignmentId)
    if (alignment.timingAuthorityDigest !== value.timingAuthority.timingAuthorityDigest) {
      context.addIssue({ code: 'custom', path: ['alignments', index, 'timingAuthorityDigest'], message: 'Alignment must bind exact timing authority.' })
    }
    alignment.tokens.forEach((token, tokenIndex) => {
      if (token.range.startFrame < segment.range.startFrame || token.range.endFrame > segment.range.endFrame) {
        context.addIssue({ code: 'custom', path: ['alignments', index, 'tokens', tokenIndex, 'range'], message: 'Alignment token must stay inside its voice-segment range.' })
      }
    })
  })

  const stemById = new Map(value.stems.map((stem) => [stem.stemId, stem]))
  if (stemById.size !== value.stems.length) {
    context.addIssue({ code: 'custom', path: ['stems'], message: 'Stem identities must be unique.' })
  }
  value.stems.forEach((stem, index) => {
    const policy = policyEntries.get(stem.capabilityPolicyEntryId)
    if (!policy || !stemCapabilityMatches(stem, policy.capability)) {
      context.addIssue({ code: 'custom', path: ['stems', index, 'capabilityPolicyEntryId'], message: 'Stem must bind an exact compatible closed capability entry.' })
    }
  })
  const musicStems = value.stems.filter((stem) => stem.role === 'music').map((stem) => stem.stemId)
  if (!sameSet(musicStems, value.musicBible.stemIds)) {
    context.addIssue({ code: 'custom', path: ['musicBible', 'stemIds'], message: 'Music Bible must bind every and only music stem.' })
  }
  value.musicCues.forEach((cue, index) => {
    const stem = stemById.get(cue.stemId)
    if (!stem || stem.role !== 'music') {
      context.addIssue({ code: 'custom', path: ['musicCues', index, 'stemId'], message: 'Music cue requires a known music stem.' })
    }
    if (!sameVersion(cue.musicBibleArtifactVersion, value.musicBible.musicBibleArtifactVersion)) {
      context.addIssue({ code: 'custom', path: ['musicCues', index, 'musicBibleArtifactVersion'], message: 'Music cue must bind the exact Music Bible version.' })
    }
    refineRange(cue.range, value.timingAuthority.durationFrames, value.timingAuthority.timingAuthorityDigest, cue.timingAuthorityDigest, context, ['musicCues', index, 'range'])
  })
  value.soundEvents.forEach((event, index) => {
    const stem = stemById.get(event.stemId)
    if (!stem || stem.role !== event.role) {
      context.addIssue({ code: 'custom', path: ['soundEvents', index, 'stemId'], message: 'Sound event role must match its exact stem role.' })
    }
    refineRange(event.range, value.timingAuthority.durationFrames, value.timingAuthority.timingAuthorityDigest, event.timingAuthorityDigest, context, ['soundEvents', index, 'range'])
  })

  if (!sameSet(value.mixPlan.stemIds, value.stems.map((stem) => stem.stemId))) {
    context.addIssue({ code: 'custom', path: ['mixPlan', 'stemIds'], message: 'Mix plan must bind every and only declared stem.' })
  }
  const roleLists: Array<[readonly string[], MotionStudioAudioStemV1['role']]> = [
    [value.mixPlan.narrationStemIds, 'narration'],
    [value.mixPlan.musicStemIds, 'music'],
    [value.mixPlan.foleyStemIds, 'foley'],
    [value.mixPlan.ambienceStemIds, 'ambience'],
    [value.mixPlan.exactSfxStemIds, 'exact_sfx'],
  ]
  roleLists.forEach(([ids, role]) => {
    if (!ids.every((id) => stemById.get(id)?.role === role)) {
      context.addIssue({ code: 'custom', path: ['mixPlan'], message: `Mix-plan ${role} partition must bind only ${role} stems.` })
    }
  })
  if (value.mixPlan.timingAuthorityDigest !== value.timingAuthority.timingAuthorityDigest) {
    context.addIssue({ code: 'custom', path: ['mixPlan', 'timingAuthorityDigest'], message: 'Mix plan must bind exact timing authority.' })
  }
}

function refineRange(
  range: { startFrame: number; endFrame: number },
  durationFrames: number,
  expectedDigest: string,
  actualDigest: string,
  context: z.RefinementCtx,
  path: PropertyKey[],
): void {
  if (range.endFrame > durationFrames) {
    context.addIssue({ code: 'custom', path, message: 'Audio range exceeds exact timing authority.' })
  }
  if (actualDigest !== expectedDigest) {
    context.addIssue({ code: 'custom', path, message: 'Audio range must bind exact timing authority digest.' })
  }
}

function stemCapabilityMatches(
  stem: MotionStudioAudioStemV1,
  capability: MotionStudioAudioCapabilityPolicySnapshotV1['entries'][number]['capability'],
): boolean {
  if (stem.role === 'narration') {
    return capability === (stem.origin === 'uploaded_narration' ? 'uploaded_narration' : 'speech_generation')
  }
  if (stem.role === 'music') {
    return capability === (['uploaded_music', 'uploaded_stem'].includes(stem.origin) ? 'uploaded_music' : 'music_generation')
  }
  if (stem.role === 'foley' || stem.role === 'ambience') return capability === 'synchronized_foley'
  return capability === 'exact_sfx'
}

function sameVersion(left: MotionStudioVersionReference, right: MotionStudioVersionReference): boolean {
  return left.artifactId === right.artifactId &&
    left.versionId === right.versionId &&
    left.versionNumber === right.versionNumber &&
    left.contentDigest === right.contentDigest
}

function allUnique(values: readonly (string | number)[]): boolean {
  return new Set(values).size === values.length
}

function sameSet(left: readonly (string | number)[], right: readonly (string | number)[]): boolean {
  return left.length === right.length && allUnique(left) && allUnique(right) &&
    left.every((value) => right.includes(value))
}
