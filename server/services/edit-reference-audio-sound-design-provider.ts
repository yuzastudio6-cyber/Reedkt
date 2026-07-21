import { z } from 'zod'

export const EDIT_REFERENCE_AUDIO_SOUND_DESIGN_PROVIDER_INPUT_VERSION =
  'edit-reference-audio-sound-design-provider-input-v1' as const
export const EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STRUCTURED_CONTEXT_VERSION =
  'edit-reference-audio-sound-design-structured-context-v1' as const
export const EDIT_REFERENCE_AUDIO_SOUND_DESIGN_MODEL_ROUTING_POLICY_VERSION =
  'model-routing-policy-v1' as const

const idSchema = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/)
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const evidenceKindSchema = z.enum([
  'media_structure',
  'private_audio',
  'technical_loudness',
  'technical_low_level_interval',
  'transcript_timing',
  'beat_grid',
  'visual_cue_timing',
  'study_goal',
  'rights_and_asset',
])
const categorySchema = z.enum([
  'music_mood',
  'music_energy',
  'tempo_character',
  'voice_music_balance',
  'ducking_behavior',
  'sfx_density',
  'sfx_timing',
  'ambience',
  'silence_breathing_room',
  'beat_alignment',
  'speech_protection',
])
const evidenceItemSchema = z.object({
  evidenceId: idSchema,
  kind: evidenceKindSchema,
  summary: z.string().trim().min(1).max(800),
}).strict()
const technicalLowLevelIntervalSchema = z.object({
  startSeconds: z.number().finite().nonnegative(),
  endSeconds: z.number().finite().positive(),
  durationSeconds: z.number().finite().positive(),
}).strict()

export const editReferenceAudioSoundDesignStructuredContextSchema = z.object({
  schemaVersion: z.literal(EDIT_REFERENCE_AUDIO_SOUND_DESIGN_STRUCTURED_CONTEXT_VERSION),
  evidenceManifestDigestSha256: sha256Schema,
  audioManifestDigestSha256: sha256Schema,
  technicalLoudnessResultDigestSha256: sha256Schema,
  technicalLowLevelResultDigestSha256: sha256Schema,
  sourceDurationSeconds: z.number().finite().positive(),
  analysisWindowStartSeconds: z.literal(0),
  analysisWindowEndSeconds: z.number().finite().positive().max(120),
  sourceAudioRightsBasis: z.enum([
    'user_owned', 'licensed_or_authorized', 'reference_only', 'unknown',
  ]),
  verifiedSpeechTimingAvailable: z.boolean(),
  verifiedBeatGridAvailable: z.boolean(),
  verifiedVisualCueTimingAvailable: z.boolean(),
  evidenceItems: z.array(evidenceItemSchema).min(5).max(64),
  technicalLoudness: z.object({
    evidenceId: idSchema,
    integratedLufs: z.number().finite().min(-100).max(20),
    truePeakDb: z.number().finite().min(-100).max(20),
    scannedDurationSeconds: z.number().finite().positive().max(120),
    semanticAudioAnalysisRan: z.literal(false),
  }).strict(),
  technicalLowLevel: z.object({
    evidenceId: idSchema,
    thresholdDb: z.number().finite().min(-90).max(-20),
    minimumDurationSeconds: z.number().finite().min(0.25).max(10),
    detectedIntervalCount: z.number().int().nonnegative().max(50),
    intervals: z.array(technicalLowLevelIntervalSchema).max(24),
    intervalsTruncated: z.boolean(),
    scannedDurationSeconds: z.number().finite().positive().max(120),
    coverage: z.enum(['full', 'partial']),
    semanticAudioAnalysisRan: z.literal(false),
    speechPauseClassificationRan: z.literal(false),
    musicOrSfxAnalysisRan: z.literal(false),
  }).strict(),
  boundaries: z.object({
    sourceAudioIsUntrustedReferenceData: z.literal(true),
    technicalSignalsAreNonSemantic: z.literal(true),
    lowLevelIntervalsAreNotSpeechPauses: z.literal(true),
    exactMusicOrSfxAssetTransferAllowed: z.literal(false),
    exactMelodyLyricsOrHarmonyRetentionAllowed: z.literal(false),
    exactAudioFingerprintRetentionAllowed: z.literal(false),
    exactBpmOrBeatGridRetentionAllowed: z.literal(false),
    exactCueMapRetentionAllowed: z.literal(false),
    exactMixAutomationRetentionAllowed: z.literal(false),
    referenceDerivedAudioGenerationAllowed: z.literal(false),
    executableTargetOperationAllowed: z.literal(false),
    targetAdaptationRequired: z.literal(true),
    targetEvidenceRequired: z.literal(true),
    speechFirstPriorityRequired: z.literal(true),
    userApprovalRequired: z.literal(true),
  }).strict(),
}).strict()

const sourceRangeSchema = z.object({
  startSeconds: z.number().finite().nonnegative(),
  endSeconds: z.number().finite().positive(),
  evidenceIds: z.array(idSchema).min(1).max(64),
}).strict()

export const editReferenceAudioSoundDesignObservationSchema = z.object({
  category: categorySchema,
  summary: z.string().trim().min(1).max(1_000),
  evidenceIds: z.array(idSchema).min(1).max(64),
  sourceRanges: z.array(sourceRangeSchema).min(1).max(8),
  confidence: z.number().finite().min(Number.EPSILON).max(1),
  transferability: z.enum(['transferable_principle', 'context_only', 'non_transferable']),
  requiresUserReview: z.boolean(),
  nonTransferableAssetWarning: z.boolean(),
}).strict()

export type EditReferenceAudioSoundDesignEvidenceKind = z.infer<typeof evidenceKindSchema>
export type EditReferenceAudioSoundDesignStructuredContext = z.infer<
  typeof editReferenceAudioSoundDesignStructuredContextSchema
>
export type EditReferenceAudioSoundDesignProviderObservation = z.infer<
  typeof editReferenceAudioSoundDesignObservationSchema
>

export interface EditReferenceAudioSoundDesignProviderInput {
  readonly schemaVersion: typeof EDIT_REFERENCE_AUDIO_SOUND_DESIGN_PROVIDER_INPUT_VERSION
  readonly structuredContext: EditReferenceAudioSoundDesignStructuredContext
  readonly boundedAudio: {
    readonly privateAudioArtifactId: string
    readonly audioChecksumSha256: string
    readonly contentType: 'audio/wav'
    readonly sampleRate: number
    readonly channels: number
    readonly startSeconds: number
    readonly endSeconds: number
    readonly bytes: Uint8Array
  }
}

export interface EditReferenceAudioSoundDesignProviderResult {
  readonly status: 'completed' | 'blocked'
  readonly observations: readonly EditReferenceAudioSoundDesignProviderObservation[]
  readonly execution: {
    readonly boundedPrivateAudioRead: boolean
    readonly structuredEvidenceRead: boolean
    readonly providerCallMade: boolean
    readonly modelCallMade: boolean
    readonly workerJobCreated: boolean
    readonly remoteMutationMade: false
  }
  readonly runtimeProvenance?: {
    readonly runtimeSource: 'verified_local' | 'verified_live'
    readonly adapterId: string
    readonly adapterVersion: string
    readonly providerId: string | null
    readonly modelId: string
    readonly modelRevision: string
    readonly modelAggregateSha256: string
    readonly modelRoutingPolicyVersion: string
    readonly analysisInstructionDigestSha256: string
  }
  readonly blockers: readonly string[]
}

export interface EditReferenceAudioSoundDesignProvider {
  readonly executionMode: 'unavailable' | 'controlled_local' | 'live_provider'
  analyze(
    input: EditReferenceAudioSoundDesignProviderInput,
  ): Promise<EditReferenceAudioSoundDesignProviderResult>
}

export function createUnavailableEditReferenceAudioSoundDesignProvider(): EditReferenceAudioSoundDesignProvider {
  return {
    executionMode: 'unavailable',
    async analyze(): Promise<EditReferenceAudioSoundDesignProviderResult> {
      return {
        status: 'blocked',
        observations: [],
        execution: {
          boundedPrivateAudioRead: false,
          structuredEvidenceRead: false,
          providerCallMade: false,
          modelCallMade: false,
          workerJobCreated: false,
          remoteMutationMade: false,
        },
        blockers: ['semantic_audio_runtime_unavailable'],
      }
    },
  }
}

export function assertEditReferenceAudioSoundDesignProviderInput(
  input: EditReferenceAudioSoundDesignProviderInput,
): void {
  const context = editReferenceAudioSoundDesignStructuredContextSchema.parse(input.structuredContext)
  if (
    input.schemaVersion !== EDIT_REFERENCE_AUDIO_SOUND_DESIGN_PROVIDER_INPUT_VERSION
    || !ID_PATTERN.test(input.boundedAudio.privateAudioArtifactId)
    || !SHA256_PATTERN.test(input.boundedAudio.audioChecksumSha256)
    || input.boundedAudio.contentType !== 'audio/wav'
    || !Number.isSafeInteger(input.boundedAudio.sampleRate)
    || input.boundedAudio.sampleRate < 8_000
    || input.boundedAudio.sampleRate > 192_000
    || !Number.isSafeInteger(input.boundedAudio.channels)
    || input.boundedAudio.channels < 1
    || input.boundedAudio.channels > 8
    || input.boundedAudio.startSeconds !== context.analysisWindowStartSeconds
    || input.boundedAudio.endSeconds !== context.analysisWindowEndSeconds
    || !(input.boundedAudio.bytes instanceof Uint8Array)
    || input.boundedAudio.bytes.byteLength < 44
    || input.boundedAudio.bytes.byteLength > MAX_AUDIO_BYTES
  ) throw new Error('Audio/Sound Design provider input is outside the bounded private-audio contract.')
  const evidenceIds = context.evidenceItems.map((item) => item.evidenceId)
  if (new Set(evidenceIds).size !== evidenceIds.length) {
    throw new Error('Audio/Sound Design provider evidence identities must be unique.')
  }
}

export function assertEditReferenceAudioSoundDesignProviderResult(
  input: EditReferenceAudioSoundDesignProviderInput,
  result: EditReferenceAudioSoundDesignProviderResult,
): void {
  assertEditReferenceAudioSoundDesignProviderInput(input)
  if (!['completed', 'blocked'].includes(result.status)) throw new Error('Audio/Sound Design provider status is invalid.')
  if (!Array.isArray(result.observations) || !Array.isArray(result.blockers)) {
    throw new Error('Audio/Sound Design provider result is invalid.')
  }
  for (const observation of result.observations) editReferenceAudioSoundDesignObservationSchema.parse(observation)
  for (const blocker of result.blockers) {
    if (!ID_PATTERN.test(blocker)) throw new Error('Audio/Sound Design provider blocker is invalid.')
  }
  const execution = result.execution
  if (
    typeof execution.boundedPrivateAudioRead !== 'boolean'
    || typeof execution.structuredEvidenceRead !== 'boolean'
    || typeof execution.providerCallMade !== 'boolean'
    || typeof execution.modelCallMade !== 'boolean'
    || typeof execution.workerJobCreated !== 'boolean'
    || execution.remoteMutationMade !== false
  ) throw new Error('Audio/Sound Design provider execution provenance is invalid.')
  if (result.status === 'completed') {
    if (result.observations.length < 1 || result.blockers.length > 0 || !result.runtimeProvenance) {
      throw new Error('Completed Audio/Sound Design provider result lacks observations or provenance.')
    }
    assertRuntimeProvenance(result.runtimeProvenance)
  } else if (result.observations.length > 0 || result.blockers.length < 1) {
    throw new Error('Blocked Audio/Sound Design provider result cannot contain observations.')
  }
}

function assertRuntimeProvenance(
  value: NonNullable<EditReferenceAudioSoundDesignProviderResult['runtimeProvenance']>,
): void {
  for (const candidate of [
    value.adapterId,
    value.adapterVersion,
    value.modelId,
    value.modelRevision,
    value.modelRoutingPolicyVersion,
  ]) if (!ID_PATTERN.test(candidate)) throw new Error('Audio/Sound Design runtime provenance is invalid.')
  if (!SHA256_PATTERN.test(value.modelAggregateSha256)
    || !SHA256_PATTERN.test(value.analysisInstructionDigestSha256)) {
    throw new Error('Audio/Sound Design runtime checksums are invalid.')
  }
  if (value.runtimeSource === 'verified_local' && value.providerId !== null) {
    throw new Error('Local Audio/Sound Design runtime cannot claim an external provider.')
  }
  if (value.runtimeSource === 'verified_live' && (!value.providerId || !ID_PATTERN.test(value.providerId))) {
    throw new Error('Live Audio/Sound Design runtime requires provider identity.')
  }
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MAX_AUDIO_BYTES = 64 * 1024 * 1024
