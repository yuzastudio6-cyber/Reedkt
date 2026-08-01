import { createHash } from 'node:crypto'
import { z } from 'zod'

import type { RuntimeEnv } from '../config/env'
import {
  KIMI_K3_SOURCE_LED_CHAT_ENDPOINT,
  KIMI_K3_SOURCE_LED_CHAT_MODEL_ID,
  createGoogleSecretManagerKimiK3CredentialResolver,
  type KimiK3CredentialResolver,
} from './kimi-k3-source-led-chat-assistant'
import {
  GPT_5_6_TERRA_SOURCE_LED_CHAT_ENDPOINT,
  GPT_5_6_TERRA_SOURCE_LED_CHAT_MODEL_ID,
  createGoogleSecretManagerGpt56TerraCredentialResolver,
  type Gpt56TerraCredentialResolver,
} from './gpt-5-6-terra-source-led-chat-assistant'
import {
  canonicalSourceLedContentAnalysisSourceInputSchema,
  createCanonicalSourceLedContentAnalysisEvidence,
  type CanonicalSourceLedContentAnalysisEvidence,
  type CanonicalSourceLedContentAnalysisSourceInput,
} from './canonical-source-led-content-analysis-evidence'

const MAXIMUM_REASONING_OUTPUT_TOKENS = 8_192
const SOURCE_SELECTION_PROVIDER_TIMEOUT_MS = 180_000
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const safeReasonSchema = z.string().trim().min(1).max(1_000)
  .refine((value) => !(
    /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\//iu
      .test(value)
    || /\b(?:api.?key|authorization|bearer|credential|secret manager)\b/iu
      .test(value)
    || /(?:\$\(|`|&&|\|\||#!|\.\.\/)/u.test(value)
  ), 'Reasoning text cannot contain operational or credential material.')

const selectedRangeSchema = z.object({
  rangeId: safeIdSchema,
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
  role: z.enum(['opening', 'action', 'main_story', 'closing']),
  reason: safeReasonSchema,
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
}).strict()

const structuredSelectionSchema = z.object({
  sources: z.array(z.object({
    sourceSequenceItemId: safeIdSchema,
    mediaAssetId: safeIdSchema,
    uploadedOrder: z.number().int().min(1).max(8),
    selectedRanges: z.array(selectedRangeSchema).min(1).max(128),
  }).strict()).min(1).max(8),
  sourceOrderPreserved: z.literal(true),
  meaningPreservationPassed: z.literal(true),
  userReviewRequired: z.literal(false),
}).strict()

const usageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
}).strict().superRefine((usage, context) => {
  if (usage.promptTokens + usage.completionTokens !== usage.totalTokens) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Reasoning usage totals must reconcile.',
    })
  }
})

export type CanonicalSourceLedContentReasoningStatus =
  | 'completed'
  | 'credential_unavailable'
  | 'credential_rejected'
  | 'model_unavailable'
  | 'rate_limited'
  | 'invalid_response'
  | 'provider_failed'
  | 'outcome_unknown'

export interface CanonicalSourceLedContentReasoningRequest {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly analysisRunId: string
  readonly planningDirection: string
  readonly userInstructionDigestSha256: string
  readonly fps: 30
  readonly sources: readonly CanonicalSourceLedContentAnalysisSourceInput[]
}

export interface CanonicalSourceLedContentReasoningAttempt {
  readonly status: CanonicalSourceLedContentReasoningStatus
  readonly routeId: 'kimi_k3_primary' | 'gpt_5_6_terra_fallback'
  readonly providerModel: 'kimi-k3' | 'gpt-5.6-terra'
  readonly credentialVersion: number | null
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly attemptDigestSha256: string
  readonly selection?: z.infer<typeof structuredSelectionSchema>
  readonly usage?: z.infer<typeof usageSchema>
}

export interface CanonicalSourceLedContentReasoningPort {
  select(
    input: CanonicalSourceLedContentReasoningRequest,
  ): Promise<CanonicalSourceLedContentReasoningAttempt>
}

export interface CanonicalSourceLedContentReasoningResult {
  readonly status: 'completed' | 'blocked'
  readonly evidence?: CanonicalSourceLedContentAnalysisEvidence
  readonly primaryAttempt: CanonicalSourceLedContentReasoningAttempt
  readonly finalAttempt: CanonicalSourceLedContentReasoningAttempt
  readonly fallbackUsed: boolean
  readonly blocker?: CanonicalSourceLedContentReasoningStatus
}

export function createCanonicalSourceLedContentAnalysisReasoner(input: {
  readonly kimi: CanonicalSourceLedContentReasoningPort
  readonly terra?: CanonicalSourceLedContentReasoningPort
}): {
  reason(
    request: CanonicalSourceLedContentReasoningRequest,
  ): Promise<CanonicalSourceLedContentReasoningResult>
} {
  return Object.freeze({
    async reason(request) {
      const verifiedRequest = verifyReasoningRequest(request)
      const primaryAttempt = classifySelectionAttempt(
        verifiedRequest,
        await input.kimi.select(verifiedRequest),
      )
      if (primaryAttempt.status === 'completed') {
        return completedResult(verifiedRequest, primaryAttempt, primaryAttempt)
      }
      if (!fallbackAllowed(primaryAttempt.status) || !input.terra) {
        return {
          status: 'blocked' as const,
          primaryAttempt,
          finalAttempt: primaryAttempt,
          fallbackUsed: false,
          blocker: primaryAttempt.status,
        }
      }
      const fallbackAttempt = classifySelectionAttempt(
        verifiedRequest,
        await input.terra.select(verifiedRequest),
      )
      if (fallbackAttempt.status !== 'completed') {
        return {
          status: 'blocked' as const,
          primaryAttempt,
          finalAttempt: fallbackAttempt,
          fallbackUsed: true,
          blocker: fallbackAttempt.status,
        }
      }
      return completedResult(verifiedRequest, primaryAttempt, fallbackAttempt)
    },
  })
}

function classifySelectionAttempt(
  request: CanonicalSourceLedContentReasoningRequest,
  attemptValue: CanonicalSourceLedContentReasoningAttempt,
): CanonicalSourceLedContentReasoningAttempt {
  if (attemptValue.status !== 'completed' || !attemptValue.selection) {
    return attemptValue
  }
  try {
    verifySelection(request, attemptValue.selection)
    return attemptValue
  } catch {
    return {
      ...attemptValue,
      status: 'invalid_response',
      selection: undefined,
    }
  }
}

export function createKimiK3SourceContentReasoningPort(input: {
  readonly env: RuntimeEnv
  readonly fetchImpl?: typeof fetch
  readonly credentialResolver?: KimiK3CredentialResolver
  readonly timeoutMs?: number
}): CanonicalSourceLedContentReasoningPort {
  return createProviderPort({
    routeId: 'kimi_k3_primary',
    providerModel: KIMI_K3_SOURCE_LED_CHAT_MODEL_ID,
    endpoint: KIMI_K3_SOURCE_LED_CHAT_ENDPOINT,
    fetchImpl: input.fetchImpl ?? fetch,
    credentialResolver: input.credentialResolver ??
      createGoogleSecretManagerKimiK3CredentialResolver(input.env),
    ...(input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {}),
    createBody: createKimiBody,
    parseResponse: parseKimiResponse,
  })
}

export function createGpt56TerraSourceContentReasoningPort(input: {
  readonly env: RuntimeEnv
  readonly fetchImpl?: typeof fetch
  readonly credentialResolver?: Gpt56TerraCredentialResolver
  readonly timeoutMs?: number
}): CanonicalSourceLedContentReasoningPort {
  return createProviderPort({
    routeId: 'gpt_5_6_terra_fallback',
    providerModel: GPT_5_6_TERRA_SOURCE_LED_CHAT_MODEL_ID,
    endpoint: GPT_5_6_TERRA_SOURCE_LED_CHAT_ENDPOINT,
    fetchImpl: input.fetchImpl ?? fetch,
    credentialResolver: input.credentialResolver ??
      createGoogleSecretManagerGpt56TerraCredentialResolver(input.env),
    ...(input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {}),
    createBody: createTerraBody,
    parseResponse: parseTerraResponse,
  })
}

function createProviderPort(input: {
  routeId: CanonicalSourceLedContentReasoningAttempt['routeId']
  providerModel: CanonicalSourceLedContentReasoningAttempt['providerModel']
  endpoint: string
  fetchImpl: typeof fetch
  credentialResolver: {
    resolve(): Promise<{ readonly value: string; readonly version: number }>
  }
  timeoutMs?: number
  createBody(request: CanonicalSourceLedContentReasoningRequest): unknown
  parseResponse(value: unknown): {
    selection: z.infer<typeof structuredSelectionSchema>
    usage: z.infer<typeof usageSchema>
  } | undefined
}): CanonicalSourceLedContentReasoningPort {
  let credentialPromise:
    | Promise<{ readonly value: string; readonly version: number }>
    | undefined
  return Object.freeze({
    async select(request: CanonicalSourceLedContentReasoningRequest) {
      const attemptDigestSha256 = sha256(stableStringify({
        routeId: input.routeId,
        providerModel: input.providerModel,
        workspaceId: request.workspaceId,
        projectId: request.projectId,
        editSessionId: request.editSessionId,
        analysisRunId: request.analysisRunId,
        userInstructionDigestSha256: request.userInstructionDigestSha256,
        specialistEvidenceDigestSha256: specialistEvidenceDigest(request),
      }))
      let credential: { readonly value: string; readonly version: number }
      try {
        credentialPromise ??= input.credentialResolver.resolve()
        credential = await credentialPromise
      } catch {
        credentialPromise = undefined
        return attempt(input, {
          status: 'credential_unavailable',
          credentialVersion: null,
          providerCallMade: false,
          modelCallMade: false,
          attemptDigestSha256,
        })
      }

      const controller = new AbortController()
      const timeoutMs = input.timeoutMs ?? SOURCE_SELECTION_PROVIDER_TIMEOUT_MS
      if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) {
        throw new Error('Source-selection provider timeout must be a positive integer.')
      }
      const timeout = setTimeout(
        () => controller.abort(),
        timeoutMs,
      )
      try {
        let response: Response
        try {
          response = await input.fetchImpl(input.endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${credential.value}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(input.createBody(request)),
            signal: controller.signal,
          })
        } catch {
          return attempt(input, {
            status: 'outcome_unknown',
            credentialVersion: credential.version,
            providerCallMade: true,
            modelCallMade: false,
            attemptDigestSha256,
          })
        }
        if (!response.ok) {
          await discardResponseBody(response)
          return attempt(input, {
            status: response.status === 401 || response.status === 403
              ? 'credential_rejected'
              : response.status === 404
                ? 'model_unavailable'
                : response.status === 429
                  ? 'rate_limited'
                  : 'provider_failed',
            credentialVersion: credential.version,
            providerCallMade: true,
            modelCallMade: false,
            attemptDigestSha256,
          })
        }
        let payload: unknown
        try {
          payload = await response.json()
        } catch {
          return attempt(input, {
            status: controller.signal.aborted ? 'outcome_unknown' : 'invalid_response',
            credentialVersion: credential.version,
            providerCallMade: true,
            modelCallMade: controller.signal.aborted ? false : true,
            attemptDigestSha256,
          })
        }
        const parsed = input.parseResponse(payload)
        if (!parsed) {
          return attempt(input, {
            status: 'invalid_response',
            credentialVersion: credential.version,
            providerCallMade: true,
            modelCallMade: true,
            attemptDigestSha256,
          })
        }
        return attempt(input, {
          status: 'completed',
          credentialVersion: credential.version,
          providerCallMade: true,
          modelCallMade: true,
          attemptDigestSha256,
          selection: parsed.selection,
          usage: parsed.usage,
        })
      } finally {
        clearTimeout(timeout)
      }
    },
  })
}

function completedResult(
  request: CanonicalSourceLedContentReasoningRequest,
  primaryAttempt: CanonicalSourceLedContentReasoningAttempt,
  finalAttempt: CanonicalSourceLedContentReasoningAttempt,
): CanonicalSourceLedContentReasoningResult {
  if (
    finalAttempt.status !== 'completed' ||
    !finalAttempt.selection ||
    finalAttempt.credentialVersion === null
  ) {
    throw new Error('Completed source reasoning lost its exact provider result.')
  }
  const selections = verifySelection(request, finalAttempt.selection)
  const selectedRangeCount = selections.reduce(
    (sum, source) => sum + source.selectedRanges.length,
    0,
  )
  const selectedTotalFrames = selections.reduce(
    (sum, source) => sum + source.selectedRanges.reduce(
      (sourceSum, range) =>
        sourceSum + range.endFrameExclusive - range.startFrame,
      0,
    ),
    0,
  )
  const originalTotalFrames = request.sources.reduce(
    (sum, source) => sum + source.durationFrames,
    0,
  )
  const evidence = createCanonicalSourceLedContentAnalysisEvidence({
    schemaVersion: 'canonical-source-led-content-analysis-evidence-v1',
    source: 'server_private_source_understanding_pipeline',
    identity: {
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      editSessionId: request.editSessionId,
      analysisRunId: request.analysisRunId,
      userInstructionDigestSha256: request.userInstructionDigestSha256,
      fps: request.fps,
    },
    sources: request.sources.map((source, index) => ({
      ...source,
      selectedRanges: selections[index]!.selectedRanges,
    })),
    reasoning: {
      status: 'completed',
      routeId: finalAttempt.routeId,
      providerModel: finalAttempt.providerModel,
      credentialSource: 'google_secret_manager_pinned_version',
      credentialVersion: finalAttempt.credentialVersion,
      providerCallMade: true,
      modelCallMade: true,
      attemptDigestSha256: finalAttempt.attemptDigestSha256,
      structuredResultDigestSha256: sha256(stableStringify(selections)),
      ...(finalAttempt.routeId === 'gpt_5_6_terra_fallback'
        ? {
            fallbackFromAttemptDigestSha256:
              primaryAttempt.attemptDigestSha256,
          }
        : {}),
      rawProviderResponsePersisted: false,
    },
    summary: {
      selectedSourceCount: selections.length,
      selectedRangeCount,
      selectedTotalFrames,
      originalTotalFrames,
      sourceOrderPreserved: true,
      everySelectionEvidenceBound: true,
      meaningPreservationPassed: true,
      userReviewRequired: false,
    },
    boundaries: {
      privateEvidence: true,
      sourceBytesSerialized: false,
      localPathsSerialized: false,
      rawModelOutputSerialized: false,
      rawChatUsedAsWorkerInstruction: false,
      planPublished: false,
      approvalGranted: false,
      executionStarted: false,
      customerChargeCreated: false,
      publicDeliveryCreated: false,
      productionAuthority: false,
    },
  })
  return {
    status: 'completed',
    evidence,
    primaryAttempt,
    finalAttempt,
    fallbackUsed: primaryAttempt !== finalAttempt,
  }
}

function verifyReasoningRequest(
  input: CanonicalSourceLedContentReasoningRequest,
): CanonicalSourceLedContentReasoningRequest {
  if (
    !safeIdSchema.safeParse(input.workspaceId).success ||
    !safeIdSchema.safeParse(input.projectId).success ||
    !safeIdSchema.safeParse(input.editSessionId).success ||
    !safeIdSchema.safeParse(input.analysisRunId).success ||
    !sha256Schema.safeParse(input.userInstructionDigestSha256).success ||
    input.fps !== 30 ||
    input.planningDirection !== input.planningDirection.trim() ||
    input.planningDirection.length < 1 ||
    input.planningDirection.length > 8_000 ||
    sha256(input.planningDirection) !== input.userInstructionDigestSha256 ||
    input.sources.length < 1 ||
    input.sources.length > 8
  ) {
    throw new Error('Source reasoning request lost exact private planning authority.')
  }
  const sourceIds = new Set<string>()
  const mediaIds = new Set<string>()
  input.sources.forEach((rawSource, index) => {
    const source = canonicalSourceLedContentAnalysisSourceInputSchema.parse(
      rawSource,
    )
    if (
      source.uploadedOrder !== index + 1 ||
      sourceIds.has(source.sourceSequenceItemId) ||
      mediaIds.has(source.mediaAssetId) ||
      source.transcript.transcriptDigestSha256 !==
        sha256(stableStringify(source.transcript.segments)) ||
      source.visual.observationDigestSha256 !==
        sha256(stableStringify(source.visual.observations))
    ) {
      throw new Error(`Source reasoning specialist evidence ${index + 1} is invalid.`)
    }
    assertEvidenceRanges(
      source.transcript.segments,
      source.durationFrames,
      `transcript ${index + 1}`,
    )
    assertEvidenceRanges(
      source.visual.observations,
      source.durationFrames,
      `visual evidence ${index + 1}`,
    )
    sourceIds.add(source.sourceSequenceItemId)
    mediaIds.add(source.mediaAssetId)
  })
  return input
}

function verifySelection(
  request: CanonicalSourceLedContentReasoningRequest,
  rawSelection: z.infer<typeof structuredSelectionSchema>,
): z.infer<typeof structuredSelectionSchema>['sources'] {
  const selection = structuredSelectionSchema.parse(rawSelection)
  if (selection.sources.length !== request.sources.length) {
    throw new Error('Source reasoning must return one exact selection per source.')
  }
  selection.sources.forEach((selected, index) => {
    const source = request.sources[index]!
    const evidenceIds = new Set([
      ...source.transcript.segments.map((segment) => segment.segmentId),
      ...source.visual.observations.map((item) => item.observationId),
    ])
    let previousEnd = -1
    const rangeIds = new Set<string>()
    if (
      selected.sourceSequenceItemId !== source.sourceSequenceItemId ||
      selected.mediaAssetId !== source.mediaAssetId ||
      selected.uploadedOrder !== source.uploadedOrder
    ) {
      throw new Error(`Source reasoning selection ${index + 1} crossed source authority.`)
    }
    selected.selectedRanges.forEach((range) => {
      if (
        rangeIds.has(range.rangeId) ||
        range.startFrame < previousEnd ||
        range.endFrameExclusive > source.durationFrames ||
        range.evidenceIds.some((evidenceId) => !evidenceIds.has(evidenceId))
      ) {
        throw new Error(`Source reasoning selection ${index + 1} is not evidence-bound and frame-safe.`)
      }
      rangeIds.add(range.rangeId)
      previousEnd = range.endFrameExclusive
    })
  })
  return selection.sources
}

function providerContext(
  request: CanonicalSourceLedContentReasoningRequest,
): string {
  return stableStringify({
    planning_direction: request.planningDirection,
    fps: request.fps,
    sources: request.sources.map((source) => ({
      source_sequence_item_id: source.sourceSequenceItemId,
      media_asset_id: source.mediaAssetId,
      uploaded_order: source.uploadedOrder,
      duration_frames: source.durationFrames,
      transcript_status: source.transcript.status,
      transcript_segments: source.transcript.segments.map((segment) => ({
        segment_id: segment.segmentId,
        start_frame: segment.startFrame,
        end_frame_exclusive: segment.endFrameExclusive,
        text: segment.text,
        confidence_basis_points: segment.confidenceBasisPoints,
        words_verified: segment.wordsVerified,
      })),
      visual_observations: source.visual.observations.map((observation) => ({
        observation_id: observation.observationId,
        start_frame: observation.startFrame,
        end_frame_exclusive: observation.endFrameExclusive,
        source_function: observation.sourceFunction,
        action_intensity: observation.actionIntensity,
        edit_usability: observation.editUsability,
        camera_stability: observation.cameraStability,
        continuity: observation.continuity,
        confidence_basis_points: observation.confidenceBasisPoints,
      })),
    })),
  })
}

function systemInstructions(): string {
  return [
    'You are ReeditPro Head Intelligence selecting source ranges for a professional edit plan.',
    'Use only the supplied verified transcript segments, visual observations, source order, and planning direction.',
    'Return one or more exact retained frame ranges for every source, in confirmed source order and non-overlapping within each source.',
    'Remove only evidence-supported dead setup, false starts, explicit delete/restart material, mistakes, duplicate takes, off-topic material, and pacing drag.',
    'Preserve narrative meaning, necessary context, successful action, the clearest delivery of each point, and a coherent opening-to-closing story.',
    'Never choose a range because of a file name, hidden path, or unstated assumption.',
    'Every retained range must cite exact transcript or visual evidence IDs. Every cut boundary must be phrase-safe; otherwise do not return a completed selection.',
    'Use the fewest coherent retained ranges that preserve the story. Merge adjacent compatible evidence, prefer no more than 12 ranges per source, and keep each reason to one concise sentence.',
    'Do not invent transcript, visuals, people, products, claims, ranges, provider execution, approval, credits, or completed editing.',
    'This output is a proposed plan input only. It cannot execute workers or edit video.',
    'Return exactly one JSON object matching the strict schema.',
  ].join('\n')
}

function createKimiBody(
  request: CanonicalSourceLedContentReasoningRequest,
): Record<string, unknown> {
  return {
    model: KIMI_K3_SOURCE_LED_CHAT_MODEL_ID,
    messages: [{ role: 'system', content: systemInstructions() }, {
      role: 'user', content: providerContext(request),
    }],
    reasoning_effort: 'medium',
    stream: false,
    max_completion_tokens: MAXIMUM_REASONING_OUTPUT_TOKENS,
    response_format: jsonSchemaEnvelope('reeditpro_source_range_selection'),
  }
}

function createTerraBody(
  request: CanonicalSourceLedContentReasoningRequest,
): Record<string, unknown> {
  return {
    model: GPT_5_6_TERRA_SOURCE_LED_CHAT_MODEL_ID,
    instructions: systemInstructions(),
    input: providerContext(request),
    reasoning: { effort: 'high', context: 'current_turn' },
    max_output_tokens: MAXIMUM_REASONING_OUTPUT_TOKENS,
    store: false,
    truncation: 'disabled',
    safety_identifier: sha256(request.workspaceId),
    prompt_cache_key: sha256([
      request.workspaceId,
      request.projectId,
      request.editSessionId,
      request.analysisRunId,
    ].join('\u0000')),
    text: {
      verbosity: 'low',
      format: {
        type: 'json_schema',
        ...jsonSchemaEnvelope('reeditpro_source_range_selection')
          .json_schema,
      },
    },
  }
}

function jsonSchemaEnvelope(name: string): {
  type: 'json_schema'
  json_schema: Record<string, unknown>
} {
  const range = {
    type: 'object',
    properties: {
      rangeId: { type: 'string', minLength: 1, maxLength: 240 },
      startFrame: { type: 'integer', minimum: 0 },
      endFrameExclusive: { type: 'integer', minimum: 1 },
      role: { type: 'string', enum: ['opening', 'action', 'main_story', 'closing'] },
      reason: { type: 'string', minLength: 1, maxLength: 1_000 },
      confidenceBasisPoints: { type: 'integer', minimum: 6_000, maximum: 10_000 },
      phraseBoundaryAligned: { type: 'boolean', enum: [true] },
      preservesSourceMeaning: { type: 'boolean', enum: [true] },
      userReviewRequired: { type: 'boolean', enum: [false] },
      evidenceIds: {
        type: 'array', minItems: 1, maxItems: 128,
        items: { type: 'string', minLength: 1, maxLength: 240 },
      },
      keepReasonCodes: {
        type: 'array', minItems: 1, maxItems: 16,
        items: { type: 'string', enum: [
          'strong_hook', 'clear_explanation', 'emotional_moment',
          'proof_or_evidence', 'source_context_required',
          'good_visual_moment', 'good_audio_moment', 'key_story_beat',
          'cta', 'transition_context',
        ] },
      },
      removedContextCodes: {
        type: 'array', maxItems: 16,
        items: { type: 'string', enum: [
          'dead_space', 'long_silence', 'filler_words', 'false_start',
          'repeated_take', 'duplicate_point', 'mistake', 'off_topic',
          'weak_explanation', 'bad_audio', 'bad_visual',
          'shaky_or_blurry', 'setup_cleanup', 'pacing_drag',
        ] },
      },
    },
    required: [
      'rangeId', 'startFrame', 'endFrameExclusive', 'role', 'reason',
      'confidenceBasisPoints', 'phraseBoundaryAligned',
      'preservesSourceMeaning', 'userReviewRequired', 'evidenceIds',
      'keepReasonCodes', 'removedContextCodes',
    ],
    additionalProperties: false,
  }
  return {
    type: 'json_schema',
    json_schema: {
      name,
      strict: true,
      schema: {
        type: 'object',
        properties: {
          sources: {
            type: 'array', minItems: 1, maxItems: 8,
            items: {
              type: 'object',
              properties: {
                sourceSequenceItemId: { type: 'string', minLength: 1, maxLength: 240 },
                mediaAssetId: { type: 'string', minLength: 1, maxLength: 240 },
                uploadedOrder: { type: 'integer', minimum: 1, maximum: 8 },
                selectedRanges: {
                  type: 'array', minItems: 1, maxItems: 128, items: range,
                },
              },
              required: [
                'sourceSequenceItemId', 'mediaAssetId', 'uploadedOrder',
                'selectedRanges',
              ],
              additionalProperties: false,
            },
          },
          sourceOrderPreserved: { type: 'boolean', enum: [true] },
          meaningPreservationPassed: { type: 'boolean', enum: [true] },
          userReviewRequired: { type: 'boolean', enum: [false] },
        },
        required: [
          'sources', 'sourceOrderPreserved', 'meaningPreservationPassed',
          'userReviewRequired',
        ],
        additionalProperties: false,
      },
    },
  }
}

function parseKimiResponse(value: unknown): {
  selection: z.infer<typeof structuredSelectionSchema>
  usage: z.infer<typeof usageSchema>
} | undefined {
  if (!isRecord(value) || value.object !== 'chat.completion' ||
    value.model !== KIMI_K3_SOURCE_LED_CHAT_MODEL_ID ||
    !Array.isArray(value.choices) || value.choices.length !== 1) return
  const choice = value.choices[0]
  if (!isRecord(choice) || choice.finish_reason !== 'stop' ||
    !isRecord(choice.message) || typeof choice.message.content !== 'string') return
  const selection = parseSelectionText(choice.message.content)
  const usage = parseUsage(value.usage, 'kimi')
  return selection && usage ? { selection, usage } : undefined
}

function parseTerraResponse(value: unknown): {
  selection: z.infer<typeof structuredSelectionSchema>
  usage: z.infer<typeof usageSchema>
} | undefined {
  if (!isRecord(value) || value.object !== 'response' ||
    value.status !== 'completed' ||
    value.model !== GPT_5_6_TERRA_SOURCE_LED_CHAT_MODEL_ID ||
    !Array.isArray(value.output)) return
  const outputTexts: string[] = []
  value.output.forEach((item) => {
    if (!isRecord(item) || item.type !== 'message' ||
      item.role !== 'assistant' || item.status !== 'completed' ||
      !Array.isArray(item.content)) return
    item.content.forEach((content) => {
      if (isRecord(content) && content.type === 'output_text' &&
        typeof content.text === 'string') outputTexts.push(content.text)
    })
  })
  if (outputTexts.length !== 1) return
  const selection = parseSelectionText(outputTexts[0]!)
  const usage = parseUsage(value.usage, 'terra')
  return selection && usage ? { selection, usage } : undefined
}

function parseSelectionText(
  text: string,
): z.infer<typeof structuredSelectionSchema> | undefined {
  try {
    const parsed = structuredSelectionSchema.safeParse(JSON.parse(text))
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

function parseUsage(
  raw: unknown,
  provider: 'kimi' | 'terra',
): z.infer<typeof usageSchema> | undefined {
  if (!isRecord(raw)) return
  const parsed = usageSchema.safeParse(provider === 'kimi' ? {
    promptTokens: raw.prompt_tokens,
    completionTokens: raw.completion_tokens,
    totalTokens: raw.total_tokens,
  } : {
    promptTokens: raw.input_tokens,
    completionTokens: raw.output_tokens,
    totalTokens: raw.total_tokens,
  })
  return parsed.success ? parsed.data : undefined
}

function attempt(
  provider: {
    routeId: CanonicalSourceLedContentReasoningAttempt['routeId']
    providerModel: CanonicalSourceLedContentReasoningAttempt['providerModel']
  },
  value: Omit<
    CanonicalSourceLedContentReasoningAttempt,
    'routeId' | 'providerModel'
  >,
): CanonicalSourceLedContentReasoningAttempt {
  return { ...value, routeId: provider.routeId, providerModel: provider.providerModel }
}

function fallbackAllowed(status: CanonicalSourceLedContentReasoningStatus): boolean {
  const eligible: readonly CanonicalSourceLedContentReasoningStatus[] = [
    'credential_unavailable',
    'credential_rejected',
    'model_unavailable',
    'rate_limited',
    'invalid_response',
    'provider_failed',
  ]
  return eligible.includes(status)
}

function specialistEvidenceDigest(
  request: CanonicalSourceLedContentReasoningRequest,
): string {
  return sha256(stableStringify(request.sources.map((source) => ({
    sourceSequenceItemId: source.sourceSequenceItemId,
    mediaAssetId: source.mediaAssetId,
    uploadedOrder: source.uploadedOrder,
    checksumSha256: source.checksumSha256,
    byteLength: source.byteLength,
    durationFrames: source.durationFrames,
    transcriptDigestSha256: source.transcript.transcriptDigestSha256,
    visualObservationDigestSha256: source.visual.observationDigestSha256,
  }))))
}

function assertEvidenceRanges(
  ranges: readonly { startFrame: number; endFrameExclusive: number }[],
  durationFrames: number,
  label: string,
): void {
  let previousStart = -1
  ranges.forEach((range) => {
    if (
      range.startFrame < previousStart ||
      range.endFrameExclusive <= range.startFrame ||
      range.endFrameExclusive > durationFrames
    ) throw new Error(`Source reasoning ${label} is unordered or out of range.`)
    previousStart = range.startFrame
  })
}

async function discardResponseBody(response: Response): Promise<void> {
  try {
    await response.arrayBuffer()
  } catch {
    // Provider error bodies are deliberately ignored and never logged.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, stableJsonValue(item)]),
  )
}
