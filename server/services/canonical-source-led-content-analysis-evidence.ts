import { createHash } from 'node:crypto'
import { z } from 'zod'

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdSchema = z.string().trim()
  .min(1)
  .max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const frameSchema = z.number().int().nonnegative()

const transcriptSegmentSchema = z.object({
  segmentId: safeIdSchema,
  startFrame: frameSchema,
  endFrameExclusive: z.number().int().positive(),
  text: z.string().trim().min(1).max(2_000),
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  wordsVerified: z.boolean(),
}).strict().superRefine((segment, context) => {
  if (segment.endFrameExclusive <= segment.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Transcript segments require a positive frame range.',
    })
  }
})

const visualObservationSchema = z.object({
  observationId: safeIdSchema,
  startFrame: frameSchema,
  endFrameExclusive: z.number().int().positive(),
  sourceFunction: z.enum([
    'hook',
    'active_action',
    'setup',
    'dialogue',
    'reaction',
    'detail',
    'transition',
    'idle',
    'unusable',
    'uncertain',
  ]),
  actionIntensity: z.enum(['none', 'low', 'medium', 'high']),
  editUsability: z.enum(['strong', 'usable', 'weak', 'reject']),
  cameraStability: z.enum(['stable', 'usable_motion', 'unstable', 'uncertain']),
  continuity: z.enum(['continuous', 'discontinuous', 'uncertain']),
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
}).strict().superRefine((observation, context) => {
  if (observation.endFrameExclusive <= observation.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Visual observations require a positive frame range.',
    })
  }
})

const selectedRangeSchema = z.object({
  rangeId: safeIdSchema,
  startFrame: frameSchema,
  endFrameExclusive: z.number().int().positive(),
  role: z.enum(['opening', 'action', 'main_story', 'closing']),
  reason: z.string().trim().min(1).max(1_000),
  confidenceBasisPoints: z.number().int().min(6_000).max(10_000),
  phraseBoundaryAligned: z.literal(true),
  preservesSourceMeaning: z.literal(true),
  userReviewRequired: z.literal(false),
  evidenceIds: z.array(safeIdSchema).min(1).max(128),
  keepReasonCodes: z.array(z.enum([
    'strong_hook',
    'clear_explanation',
    'emotional_moment',
    'proof_or_evidence',
    'source_context_required',
    'good_visual_moment',
    'good_audio_moment',
    'key_story_beat',
    'cta',
    'transition_context',
  ])).min(1).max(16),
  removedContextCodes: z.array(z.enum([
    'dead_space',
    'long_silence',
    'filler_words',
    'false_start',
    'repeated_take',
    'duplicate_point',
    'mistake',
    'off_topic',
    'weak_explanation',
    'bad_audio',
    'bad_visual',
    'shaky_or_blurry',
    'setup_cleanup',
    'pacing_drag',
  ])).max(16),
}).strict().superRefine((selection, context) => {
  if (selection.endFrameExclusive <= selection.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selected source ranges require a positive frame range.',
    })
  }
  if (new Set(selection.evidenceIds).size !== selection.evidenceIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selected source evidence identities must be unique.',
    })
  }
})

const sourceAnalysisSchema = z.object({
  sourceSequenceItemId: safeIdSchema,
  mediaAssetId: safeIdSchema,
  uploadedOrder: z.number().int().min(1).max(8),
  checksumSha256: sha256Schema,
  byteLength: z.number().int().positive(),
  durationFrames: z.number().int().positive(),
  transcript: z.object({
    status: z.enum(['completed', 'no_speech']),
    modelId: z.literal('faster-whisper-small'),
    modelDigestSha256: sha256Schema,
    runtimeVersion: z.literal('faster-whisper-1.2.1'),
    transcriptDigestSha256: sha256Schema,
    segments: z.array(transcriptSegmentSchema).max(20_000),
    rawAudioPersisted: z.literal(false),
    modelDownloadPerformed: z.literal(false),
    networkAttempted: z.literal(false),
  }).strict(),
  visual: z.object({
    status: z.literal('completed'),
    modelId: z.literal('qwen2.5-vl-7b-instruct-4bit'),
    modelDigestSha256: sha256Schema,
    runtimeVersion: z.literal('mlx-vlm-0.6.5'),
    observationDigestSha256: sha256Schema,
    observations: z.array(visualObservationSchema).min(2).max(10_000),
    rawFramesPersisted: z.literal(false),
    rawModelOutputPersisted: z.literal(false),
    modelDownloadPerformed: z.literal(false),
    networkAttempted: z.literal(false),
  }).strict(),
  selectedRanges: z.array(selectedRangeSchema).min(1).max(128),
}).strict()

export const canonicalSourceLedContentAnalysisSourceInputSchema =
  sourceAnalysisSchema.omit({ selectedRanges: true }).strict()

const reasoningSchema = z.object({
  status: z.literal('completed'),
  routeId: z.enum(['kimi_k3_primary', 'gpt_5_6_terra_fallback']),
  providerModel: z.enum(['kimi-k3', 'gpt-5.6-terra']),
  credentialSource: z.literal('google_secret_manager_pinned_version'),
  credentialVersion: z.number().int().positive(),
  providerCallMade: z.literal(true),
  modelCallMade: z.literal(true),
  attemptDigestSha256: sha256Schema,
  structuredResultDigestSha256: sha256Schema,
  fallbackFromAttemptDigestSha256: sha256Schema.optional(),
  rawProviderResponsePersisted: z.literal(false),
}).strict().superRefine((reasoning, context) => {
  if (
    reasoning.routeId === 'kimi_k3_primary'
      ? reasoning.providerModel !== 'kimi-k3'
        || reasoning.fallbackFromAttemptDigestSha256 !== undefined
      : reasoning.providerModel !== 'gpt-5.6-terra'
        || reasoning.fallbackFromAttemptDigestSha256 === undefined
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Source-edit reasoning route and provider lineage must match.',
    })
  }
})

const evidenceWithoutDigestSchema = z.object({
  schemaVersion: z.literal('canonical-source-led-content-analysis-evidence-v1'),
  source: z.literal('server_private_source_understanding_pipeline'),
  identity: z.object({
    workspaceId: safeIdSchema,
    projectId: safeIdSchema,
    editSessionId: safeIdSchema,
    analysisRunId: safeIdSchema,
    userInstructionDigestSha256: sha256Schema,
    fps: z.literal(30),
  }).strict(),
  sources: z.array(sourceAnalysisSchema).min(1).max(8),
  reasoning: reasoningSchema,
  summary: z.object({
    selectedSourceCount: z.number().int().positive().max(8),
    selectedRangeCount: z.number().int().positive().max(512),
    selectedTotalFrames: z.number().int().positive(),
    originalTotalFrames: z.number().int().positive(),
    sourceOrderPreserved: z.literal(true),
    everySelectionEvidenceBound: z.literal(true),
    meaningPreservationPassed: z.literal(true),
    userReviewRequired: z.literal(false),
  }).strict(),
  boundaries: z.object({
    privateEvidence: z.literal(true),
    sourceBytesSerialized: z.literal(false),
    localPathsSerialized: z.literal(false),
    rawModelOutputSerialized: z.literal(false),
    rawChatUsedAsWorkerInstruction: z.literal(false),
    planPublished: z.literal(false),
    approvalGranted: z.literal(false),
    executionStarted: z.literal(false),
    customerChargeCreated: z.literal(false),
    publicDeliveryCreated: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
}).strict()

export const canonicalSourceLedContentAnalysisEvidenceSchema =
  evidenceWithoutDigestSchema.extend({
    evidenceDigestSha256: sha256Schema,
  }).strict()

export type CanonicalSourceLedContentAnalysisEvidence = z.infer<
  typeof canonicalSourceLedContentAnalysisEvidenceSchema
>

export type CanonicalSourceLedContentAnalysisEvidenceInput = z.input<
  typeof evidenceWithoutDigestSchema
>

export type CanonicalSourceLedContentAnalysisSourceInput =
  Omit<
    CanonicalSourceLedContentAnalysisEvidenceInput['sources'][number],
    'selectedRanges'
  >

export function createCanonicalSourceLedContentAnalysisEvidence(
  input: CanonicalSourceLedContentAnalysisEvidenceInput,
): CanonicalSourceLedContentAnalysisEvidence {
  const parsed = evidenceWithoutDigestSchema.parse(input)
  const evidence = canonicalSourceLedContentAnalysisEvidenceSchema.parse({
    ...parsed,
    evidenceDigestSha256: sha256(stableStringify(parsed)),
  })
  verifyCanonicalSourceLedContentAnalysisEvidence(evidence)
  return evidence
}

export function verifyCanonicalSourceLedContentAnalysisEvidence(
  input: unknown,
): CanonicalSourceLedContentAnalysisEvidence {
  const evidence = canonicalSourceLedContentAnalysisEvidenceSchema.parse(input)
  const withoutDigest = { ...evidence }
  Reflect.deleteProperty(withoutDigest, 'evidenceDigestSha256')
  if (
    evidence.evidenceDigestSha256 !==
      sha256(stableStringify(withoutDigest))
  ) {
    throw new Error(
      'Source-led content-analysis evidence failed immutable digest verification.',
    )
  }

  const sourceIds = new Set<string>()
  const mediaIds = new Set<string>()
  let originalTotalFrames = 0
  let selectedTotalFrames = 0
  let selectedRangeCount = 0
  evidence.sources.forEach((source, index) => {
    if (
      source.uploadedOrder !== index + 1
      || sourceIds.has(source.sourceSequenceItemId)
      || mediaIds.has(source.mediaAssetId)
    ) {
      throw new Error(
        'Source-led content-analysis evidence lost exact source order or identity uniqueness.',
      )
    }
    sourceIds.add(source.sourceSequenceItemId)
    mediaIds.add(source.mediaAssetId)
    originalTotalFrames += source.durationFrames
    selectedRangeCount += source.selectedRanges.length
    selectedTotalFrames += source.selectedRanges.reduce(
      (sum, selection) =>
        sum + selection.endFrameExclusive - selection.startFrame,
      0,
    )
    if (
      (
        source.transcript.status === 'no_speech'
          ? source.transcript.segments.length !== 0
          : source.transcript.segments.length === 0
      )
      || source.transcript.transcriptDigestSha256 !==
        sha256(stableStringify(source.transcript.segments))
      || source.visual.observationDigestSha256 !==
        sha256(stableStringify(source.visual.observations))
    ) {
      throw new Error(
        `Source ${index + 1} has an invalid selected range, transcript state, or evidence digest.`,
      )
    }
    assertOrderedRanges(
      source.transcript.segments,
      source.durationFrames,
      `Source ${index + 1} transcript`,
    )
    assertOrderedRanges(
      source.visual.observations,
      source.durationFrames,
      `Source ${index + 1} visual evidence`,
    )
    assertOrderedSelections(
      source.selectedRanges,
      source.durationFrames,
      `Source ${index + 1} selected ranges`,
    )
    const evidenceIds = new Set([
      ...source.transcript.segments.map((segment) => segment.segmentId),
      ...source.visual.observations.map(
        (observation) => observation.observationId,
      ),
    ])
    if (
      source.selectedRanges.some((selection) =>
        selection.evidenceIds.some(
          (evidenceId) => !evidenceIds.has(evidenceId),
        ))
    ) {
      throw new Error(
        `Source ${index + 1} selection references unverified evidence.`,
      )
    }
  })
  if (
    evidence.summary.selectedSourceCount !== evidence.sources.length
    || evidence.summary.selectedRangeCount !== selectedRangeCount
    || evidence.summary.originalTotalFrames !== originalTotalFrames
    || evidence.summary.selectedTotalFrames !== selectedTotalFrames
    || evidence.reasoning.structuredResultDigestSha256 !==
      sha256(stableStringify(evidence.sources.map((source) => ({
        sourceSequenceItemId: source.sourceSequenceItemId,
        mediaAssetId: source.mediaAssetId,
        uploadedOrder: source.uploadedOrder,
        selectedRanges: source.selectedRanges,
      }))))
  ) {
    throw new Error(
      'Source-led content-analysis summary does not match exact source selections.',
    )
  }
  return evidence
}

function assertOrderedSelections(
  values: Array<{
    rangeId: string
    startFrame: number
    endFrameExclusive: number
  }>,
  durationFrames: number,
  label: string,
): void {
  const rangeIds = new Set<string>()
  let previousEnd = -1
  for (const value of values) {
    if (
      rangeIds.has(value.rangeId)
      || value.startFrame < previousEnd
      || value.endFrameExclusive > durationFrames
    ) {
      throw new Error(
        `${label} contains a duplicate, overlapping, unordered, or out-of-range item.`,
      )
    }
    rangeIds.add(value.rangeId)
    previousEnd = value.endFrameExclusive
  }
}

function assertOrderedRanges(
  values: Array<{ startFrame: number; endFrameExclusive: number }>,
  durationFrames: number,
  label: string,
): void {
  let previousStart = -1
  for (const value of values) {
    if (
      value.startFrame < previousStart
      || value.endFrameExclusive > durationFrames
    ) {
      throw new Error(`${label} contains an unordered or out-of-range item.`)
    }
    previousStart = value.startFrame
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) =>
        `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
