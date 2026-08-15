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
  createCanonicalSourceLedSourceFrameAuthority,
  createCanonicalSourceLedContentAnalysisEvidence,
  digestCanonicalSourceLedStructuredSelection,
  type CanonicalSourceLedContentAnalysisEvidence,
  type CanonicalSourceLedContentAnalysisSourceInput,
} from './canonical-source-led-content-analysis-evidence'
import {
  mapCanonicalSourceFrameRangeToMasterTiming,
} from './canonical-rational-source-frame-mapping'

const MAXIMUM_REASONING_OUTPUT_TOKENS = 16_384
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
  decisionBasis: z.enum([
    'content_understanding',
    'resolved_embedded_instruction',
  ]),
  instructionIds: z.array(safeIdSchema).max(32),
  timeOnlyDecision: z.literal(false),
}).strict()

const removedRangeSchema = z.object({
  rangeId: safeIdSchema,
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
  reason: safeReasonSchema,
  confidenceBasisPoints: z.number().int().min(6_000).max(10_000),
  phraseBoundaryAligned: z.literal(true),
  preservesSourceMeaning: z.literal(true),
  userReviewRequired: z.literal(false),
  evidenceIds: z.array(safeIdSchema).min(1).max(128),
  reasonCodes: z.array(z.enum([
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
    'resolved_embedded_instruction',
  ])).min(1).max(16),
  decisionBasis: z.enum([
    'content_understanding',
    'resolved_embedded_instruction',
  ]),
  instructionIds: z.array(safeIdSchema).max(32),
  timeOnlyDecision: z.literal(false),
}).strict()

const embeddedInstructionSchema = z.object({
  instructionId: safeIdSchema,
  instructionType: z.enum([
    'delete_previous_part',
    'delete_current_take',
    'restart_from_here',
    'use_later_take',
    'keep_part',
    'remove_part',
    'custom_edit_direction',
    'uncertain',
  ]),
  targetRelation: z.enum([
    'previous_context',
    'current_take',
    'following_take',
    'whole_source',
    'custom',
    'uncertain',
  ]),
  transcriptSegmentId: safeIdSchema,
  spokenStartFrame: z.number().int().nonnegative(),
  spokenEndFrameExclusive: z.number().int().positive(),
  targetStartFrame: z.number().int().nonnegative().nullable(),
  targetEndFrameExclusive: z.number().int().positive().nullable(),
  reason: safeReasonSchema,
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  evidenceIds: z.array(safeIdSchema).min(1).max(128),
  appliedDecisionIds: z.array(safeIdSchema).max(128),
  spokenRemarkRemovalDecisionId: safeIdSchema.nullable(),
  classifiedAsEditorDirected: z.literal(true),
  interpretationStatus: z.enum(['resolved', 'user_review_required']),
  userReviewRequired: z.boolean(),
}).strict().superRefine((instruction, context) => {
  const resolved = instruction.interpretationStatus === 'resolved'
  if (
    instruction.spokenEndFrameExclusive <= instruction.spokenStartFrame
    || !instruction.evidenceIds.includes(instruction.transcriptSegmentId)
    || (resolved !== !instruction.userReviewRequired)
    || (resolved && (
      instruction.instructionType === 'uncertain'
      || instruction.targetRelation === 'uncertain'
      || instruction.targetStartFrame === null
      || instruction.targetEndFrameExclusive === null
      || instruction.targetEndFrameExclusive <= instruction.targetStartFrame
      || instruction.confidenceBasisPoints < 7_000
      || instruction.appliedDecisionIds.length < 1
      || instruction.spokenRemarkRemovalDecisionId === null
    ))
    || (!resolved && (
      instruction.appliedDecisionIds.length !== 0
      || instruction.spokenRemarkRemovalDecisionId !== null
    ))
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Embedded edit-instruction interpretation is internally inconsistent.',
    })
  }
})

const structuredSelectionSchema = z.object({
  sources: z.array(z.object({
    sourceSequenceItemId: safeIdSchema,
    mediaAssetId: safeIdSchema,
    uploadedOrder: z.number().int().min(1).max(8),
    selectedRanges: z.array(selectedRangeSchema).min(1).max(128),
    removedRanges: z.array(removedRangeSchema).max(129),
    embeddedEditInstructions: z.array(embeddedInstructionSchema).max(128),
  }).strict()).min(1).max(8),
  sourceOrderPreserved: z.literal(true),
  completeSourceCoverageVerified: z.literal(true),
  allTimelineIntervalsReviewed: z.literal(true),
  embeddedInstructionsEvaluated: z.literal(true),
  timeOnlyCutDecisionCount: z.literal(0),
  meaningPreservationPassed: z.literal(true),
  userReviewRequired: z.boolean(),
  reviewReasons: z.array(safeReasonSchema).max(32),
}).strict().superRefine((selection, context) => {
  const instructionReviewRequired = selection.sources.some((source) =>
    source.embeddedEditInstructions.some((instruction) =>
      instruction.userReviewRequired))
  if (
    selection.userReviewRequired !== instructionReviewRequired
    || (selection.userReviewRequired
      ? selection.reviewReasons.length < 1
      : selection.reviewReasons.length !== 0)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Source selection review status must match unresolved embedded instructions.',
    })
  }
})

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
  | 'user_review_required'
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
  /** SHA-256 of the exact bounded direction text supplied to Head Intelligence. */
  readonly planningDirectionDigestSha256: string
  /**
   * Separate authenticated authority over the saved named-edit chat revision
   * and active instruction set. It is deliberately not a hash alias for the
   * model-facing planningDirection string.
   */
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

export type CanonicalSourceLedContentReasoningSelection = z.infer<
  typeof structuredSelectionSchema
>

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
  readonly reviewRequiredInstructions?: readonly {
    readonly sourceSequenceItemId: string
    readonly instructionId: string
    readonly instructionType: z.infer<
      typeof embeddedInstructionSchema
    >['instructionType']
    readonly targetRelation: z.infer<
      typeof embeddedInstructionSchema
    >['targetRelation']
    readonly spokenStartFrame: number
    readonly spokenEndFrameExclusive: number
    readonly reason: string
  }[]
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
        planningDirectionDigestSha256:
          request.planningDirectionDigestSha256,
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
  const selection = verifySelection(request, finalAttempt.selection)
  if (selection.userReviewRequired) {
    return {
      status: 'blocked',
      primaryAttempt,
      finalAttempt,
      fallbackUsed: primaryAttempt !== finalAttempt,
      blocker: 'user_review_required',
      reviewRequiredInstructions: selection.sources.flatMap((source) =>
        source.embeddedEditInstructions
          .filter((instruction) => instruction.userReviewRequired)
          .map((instruction) => ({
            sourceSequenceItemId: source.sourceSequenceItemId,
            instructionId: instruction.instructionId,
            instructionType: instruction.instructionType,
            targetRelation: instruction.targetRelation,
            spokenStartFrame: instruction.spokenStartFrame,
            spokenEndFrameExclusive: instruction.spokenEndFrameExclusive,
            reason: instruction.reason,
          }))),
    }
  }
  const selections = selection.sources
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
  const visualIntelligenceV1 = request.sources.every((source) =>
    'evidenceMode' in source.visual
    && source.visual.evidenceMode ===
      'visual_intelligence_gemini_pro_high_v1')
  if (!visualIntelligenceV1) {
    throw new Error(
      'Fresh source reasoning requires WeEditPro Visual Intelligence evidence.',
    )
  }
  const originalTotalTimelineFrames = request.sources.reduce(
    (sum, source) => sum +
      mapSourceRangeToMasterFrames(source, 0, source.durationFrames),
    0,
  )
  const selectedTotalTimelineFrames = request.sources.reduce(
    (sum, source, sourceIndex) => sum +
      selections[sourceIndex]!.selectedRanges.reduce(
        (sourceSum, range) => sourceSum + mapSourceRangeToMasterFrames(
          source,
          range.startFrame,
          range.endFrameExclusive,
        ),
        0,
      ),
    0,
  )
  const evidence = createCanonicalSourceLedContentAnalysisEvidence({
    schemaVersion: 'canonical-source-led-content-analysis-evidence-v5',
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
      removedRanges: selections[index]!.removedRanges,
      embeddedEditInstructions:
        selections[index]!.embeddedEditInstructions.map((instruction) => {
          if (
            instruction.interpretationStatus !== 'resolved'
            || instruction.userReviewRequired
            || instruction.instructionType === 'uncertain'
            || instruction.targetRelation === 'uncertain'
            || instruction.targetStartFrame === null
            || instruction.targetEndFrameExclusive === null
            || instruction.spokenRemarkRemovalDecisionId === null
          ) {
            throw new Error(
              'Completed source understanding retained an unresolved embedded instruction.',
            )
          }
          return {
            ...instruction,
            instructionType: instruction.instructionType,
            targetRelation: instruction.targetRelation,
            targetStartFrame: instruction.targetStartFrame,
            targetEndFrameExclusive: instruction.targetEndFrameExclusive,
            spokenRemarkRemovalDecisionId:
              instruction.spokenRemarkRemovalDecisionId,
            interpretationStatus: 'resolved' as const,
            userReviewRequired: false as const,
          }
        }),
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
      structuredResultDigestSha256:
        digestCanonicalSourceLedStructuredSelection(selection),
      completeSourceCoverageConfirmed: true,
      allTimelineIntervalsReviewed: true,
      embeddedInstructionsEvaluated: true,
      timeOnlyCutDecisionsAllowed: false,
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
      originalTotalTimelineFrames,
      selectedTotalTimelineFrames,
      rationalSourceFrameMappingVerified: true,
      sourceOrderPreserved: true,
      everySelectionEvidenceBound: true,
      everyRemovalEvidenceBound: true,
      completeSourceCoverageVerified: true,
      allTimelineIntervalsReviewed: true,
      embeddedInstructionsEvaluated: true,
      embeddedInstructionCount: selections.reduce(
        (sum, source) => sum + source.embeddedEditInstructions.length,
        0,
      ),
      unresolvedEmbeddedInstructionCount: 0,
      timeOnlyCutDecisionCount: 0,
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
    !sha256Schema.safeParse(input.planningDirectionDigestSha256).success ||
    !sha256Schema.safeParse(input.userInstructionDigestSha256).success ||
    input.fps !== 30 ||
    input.planningDirection !== input.planningDirection.trim() ||
    input.planningDirection.length < 1 ||
    input.planningDirection.length > 8_000 ||
    sha256(input.planningDirection) !==
      input.planningDirectionDigestSha256 ||
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
    const transcriptCoverage = { ...source.transcript.coverage }
    Reflect.deleteProperty(transcriptCoverage, 'coverageDigestSha256')
    const visualCoverage = { ...source.visual.coverage }
    Reflect.deleteProperty(visualCoverage, 'coverageDigestSha256')
    const evidenceMode = 'evidenceMode' in source.visual
      ? source.visual.evidenceMode
      : undefined
    if (evidenceMode !== 'visual_intelligence_gemini_pro_high_v1') {
      throw new Error(
        'Fresh source reasoning requires WeEditPro Visual Intelligence evidence before any reasoning provider call.',
      )
    }
    if (
      source.uploadedOrder !== index + 1 ||
      sourceIds.has(source.sourceSequenceItemId) ||
      mediaIds.has(source.mediaAssetId) ||
      source.transcript.transcriptDigestSha256 !==
        sha256(stableStringify(source.transcript.segments)) ||
      source.visual.observationDigestSha256 !==
        sha256(stableStringify(source.visual.observations))
      || source.transcript.coverage.coverageDigestSha256 !==
        sha256(stableStringify(transcriptCoverage))
      || source.visual.coverage.coverageDigestSha256 !==
        sha256(stableStringify(visualCoverage))
      || source.transcript.coverage.coveredEndFrameExclusive !==
        source.durationFrames
      || source.visual.coverage.coveredEndFrameExclusive !==
        source.durationFrames
      || source.visual.coverage.windowCount !==
        source.visual.observations.length
      || (
        'sampledFrameCount' in source.visual.coverage
        && source.visual.coverage.sampledFrameCount !==
          source.visual.observations.reduce(
            (sum, observation) =>
              sum + ('sampledFrameNumbers' in observation
                ? observation.sampledFrameNumbers.length
                : 0),
            0,
          )
      )
      || (
        'evidenceMode' in source.visual
        && source.visual.observations.some(
          (observation, observationIndex) =>
            observation.windowIndex !== observationIndex + 1,
        )
      )
      || !exactSourceFrameAuthority(source)
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
    assertCompleteVisualCoverage(
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
): z.infer<typeof structuredSelectionSchema> {
  const selection = structuredSelectionSchema.parse(rawSelection)
  if (selection.sources.length !== request.sources.length) {
    throw new Error('Source reasoning must return one exact selection per source.')
  }
  selection.sources.forEach((selected, index) => {
    const source = request.sources[index]!
    const evidenceRanges = new Map<string, {
      startFrame: number
      endFrameExclusive: number
    }>([
      ...source.transcript.segments.map((segment) => [
        segment.segmentId,
        {
          startFrame: segment.startFrame,
          endFrameExclusive: segment.endFrameExclusive,
        },
      ] as const),
      ...source.visual.observations.map((item) => [
        item.observationId,
        {
          startFrame: item.startFrame,
          endFrameExclusive: item.endFrameExclusive,
        },
      ] as const),
    ])
    if (
      selected.sourceSequenceItemId !== source.sourceSequenceItemId ||
      selected.mediaAssetId !== source.mediaAssetId ||
      selected.uploadedOrder !== source.uploadedOrder
    ) {
      throw new Error(`Source reasoning selection ${index + 1} crossed source authority.`)
    }
    const decisions = [
      ...selected.selectedRanges.map((range) => ({
        ...range,
        action: 'keep' as const,
      })),
      ...selected.removedRanges.map((range) => ({
        ...range,
        action: 'remove' as const,
      })),
    ]
    const decisionsById = new Map(decisions.map((decision) => [
      decision.rangeId,
      decision,
    ]))
    const instructionsById = new Map(
      selected.embeddedEditInstructions.map((instruction) => [
        instruction.instructionId,
        instruction,
      ]),
    )
    if (
      decisionsById.size !== decisions.length
      || instructionsById.size !== selected.embeddedEditInstructions.length
    ) {
      throw new Error(`Source reasoning selection ${index + 1} has duplicate decision or instruction IDs.`)
    }
    let cursor = 0
    for (const range of [...decisions].sort(
      (left, right) => left.startFrame - right.startFrame,
    )) {
      const evidence = range.evidenceIds.map((evidenceId) =>
        evidenceRanges.get(evidenceId))
      if (
        range.startFrame !== cursor
        || range.endFrameExclusive <= range.startFrame
        || range.endFrameExclusive > source.durationFrames
        || evidence.some((item) => !item)
        || new Set(range.evidenceIds).size !== range.evidenceIds.length
        || new Set(range.instructionIds).size !== range.instructionIds.length
        || (range.decisionBasis === 'content_understanding'
          ? range.instructionIds.length !== 0
            || !evidence.some((item) => item && rangesOverlap(
              range.startFrame,
              range.endFrameExclusive,
              item.startFrame,
              item.endFrameExclusive,
            ))
          : range.instructionIds.length === 0)
      ) {
        throw new Error(`Source reasoning selection ${index + 1} is not evidence-bound and frame-safe.`)
      }
      cursor = range.endFrameExclusive
    }
    if (cursor !== source.durationFrames) {
      throw new Error(`Source reasoning selection ${index + 1} does not partition the complete source timeline.`)
    }
    const hasUnresolvedInstruction = selected.embeddedEditInstructions.some(
      (instruction) => instruction.userReviewRequired,
    )
    if (
      hasUnresolvedInstruction
      && (
        selected.selectedRanges.length !== 1
        || selected.selectedRanges[0]!.startFrame !== 0
        || selected.selectedRanges[0]!.endFrameExclusive !==
          source.durationFrames
        || selected.removedRanges.length !== 0
        || selected.selectedRanges[0]!.decisionBasis !==
          'content_understanding'
      )
    ) {
      throw new Error(
        `Source reasoning selection ${index + 1} must conservatively preserve the complete source while an embedded instruction requires review.`,
      )
    }
    for (const instruction of selected.embeddedEditInstructions) {
      const transcript = source.transcript.segments.find(
        (segment) => segment.segmentId === instruction.transcriptSegmentId,
      )
      if (
        !transcript
        || transcript.startFrame !== instruction.spokenStartFrame
        || transcript.endFrameExclusive !== instruction.spokenEndFrameExclusive
        || instruction.evidenceIds.some((evidenceId) =>
          !evidenceRanges.has(evidenceId))
      ) {
        throw new Error(`Source reasoning instruction ${instruction.instructionId} is not transcript-bound.`)
      }
      if (instruction.interpretationStatus !== 'resolved') continue
      const targetStart = instruction.targetStartFrame!
      const targetEnd = instruction.targetEndFrameExclusive!
      const spokenRemoval = decisionsById.get(
        instruction.spokenRemarkRemovalDecisionId!,
      )
      if (
        targetEnd > source.durationFrames
        || instruction.appliedDecisionIds.some((decisionId) => {
          const decision = decisionsById.get(decisionId)
          return !decision
            || !decision.instructionIds.includes(instruction.instructionId)
            || !(
              rangesOverlap(
                decision.startFrame,
                decision.endFrameExclusive,
                targetStart,
                targetEnd,
              )
              || (
                instruction.spokenRemarkRemovalDecisionId === decisionId
                && decision.startFrame <= instruction.spokenStartFrame
                && decision.endFrameExclusive >=
                  instruction.spokenEndFrameExclusive
              )
            )
        })
        || !spokenRemoval
        || spokenRemoval.action !== 'remove'
        || spokenRemoval.startFrame > instruction.spokenStartFrame
        || spokenRemoval.endFrameExclusive < instruction.spokenEndFrameExclusive
        || !spokenRemoval.instructionIds.includes(instruction.instructionId)
      ) {
        throw new Error(`Source reasoning instruction ${instruction.instructionId} lost target or spoken-remark removal lineage.`)
      }
    }
  })
  return selection
}

function providerContext(
  request: CanonicalSourceLedContentReasoningRequest,
): string {
  return stableStringify({
    planning_direction: request.planningDirection,
    planning_direction_digest_sha256:
      request.planningDirectionDigestSha256,
    authenticated_saved_instruction_authority_digest_sha256:
      request.userInstructionDigestSha256,
    fps: request.fps,
    sources: request.sources.map((source) => ({
      source_sequence_item_id: source.sourceSequenceItemId,
      media_asset_id: source.mediaAssetId,
      uploaded_order: source.uploadedOrder,
      duration_frames: source.durationFrames,
      source_frame_domain: source.sourceFrameAuthority
        ? {
            frame_domain: source.sourceFrameAuthority.frameDomain,
            fps_numerator: source.sourceFrameAuthority.fpsNumerator,
            fps_denominator: source.sourceFrameAuthority.fpsDenominator,
            frame_count: source.sourceFrameAuthority.frameCount,
            time_base_numerator: source.sourceFrameAuthority.timeBaseNumerator,
            time_base_denominator: source.sourceFrameAuthority.timeBaseDenominator,
            master_timing_mapping:
              source.sourceFrameAuthority.masterTimingMapping,
          }
        : {
            frame_domain: 'historical_30fps_source_frame_compatibility',
            fps_numerator: request.fps,
            fps_denominator: 1,
          },
      transcript_status: source.transcript.status,
      transcript_complete_timeline_coverage: source.transcript.coverage,
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
        ...('sampledFrameNumbers' in observation
          ? { sampled_frame_numbers: observation.sampledFrameNumbers }
          : {
              provider_observation_scope:
                observation.providerObservationScope,
              exact_provider_sample_frames_known:
                observation.exactProviderSampleFramesKnown,
            }),
      })),
      visual_complete_timeline_window_coverage: source.visual.coverage,
    })),
  })
}

function systemInstructions(): string {
  return [
    'You are WeEditPro Head Intelligence selecting source ranges for a professional edit plan.',
    'Before making any keep or remove decision, review every supplied transcript segment and every ordered visual complete-timeline window for every source from frame zero through duration.',
    'The transcript comes from complete audio-timeline processing. Visual evidence either lists exact sampled frames for historical evidence or records complete requested-range semantic coverage from the provider-neutral Visual Intelligence capability. Never claim every raw frame, unsampled pixels, provider-internal exact pixels, or provider audio understanding.',
    'Use only the supplied verified transcript segments, visual observations, coverage records, source order, and planning direction.',
    'Return explicit selectedRanges and removedRanges that together partition every source frame exactly once, in confirmed source order and with no gap or overlap.',
    'Treat every range boundary as an exact source-frame index in that source’s declared rational frame-rate domain. Never relabel 30000/1001 source frames as 30/1 MasterTiming frames or derive a cut by multiplying seconds by 30.',
    'Never keep or remove material merely because of elapsed time, duration, silence length, or a pacing formula. Every decision must cite overlapping transcript or visual evidence, or one exact resolved embedded edit instruction.',
    'Detect speech addressed to the editor, including phrases such as delete that part, cut this, start over, use the next take, keep that, or remove that. Distinguish it from viewer-facing program speech using surrounding transcript and visual context.',
    'For each editor-directed remark, emit one embeddedEditInstruction. Resolve its exact target only when the evidence is clear, bind every applied decision, and remove the editor-directed spoken remark itself from the viewer-facing program.',
    'If an instruction target, reference, intent, or phrase-safe boundary is ambiguous, set that instruction and the whole result to user_review_required, conservatively preserve the full source, and do not guess or claim completed selection.',
    'Remove only evidence-supported dead setup, false starts, resolved explicit delete/restart material, mistakes, duplicate takes, off-topic material, and pacing drag.',
    'Preserve narrative meaning, necessary context, successful action, the clearest delivery of each point, and a coherent opening-to-closing story.',
    'Never choose a range because of a file name, hidden path, or unstated assumption.',
    'Every retained and removed range must cite exact transcript or visual evidence IDs. Every cut boundary must be phrase-safe; otherwise require user review.',
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
      decisionBasis: {
        type: 'string',
        enum: ['content_understanding', 'resolved_embedded_instruction'],
      },
      instructionIds: {
        type: 'array', maxItems: 32,
        items: { type: 'string', minLength: 1, maxLength: 240 },
      },
      timeOnlyDecision: { type: 'boolean', enum: [false] },
    },
    required: [
      'rangeId', 'startFrame', 'endFrameExclusive', 'role', 'reason',
      'confidenceBasisPoints', 'phraseBoundaryAligned',
      'preservesSourceMeaning', 'userReviewRequired', 'evidenceIds',
      'keepReasonCodes', 'removedContextCodes',
      'decisionBasis', 'instructionIds', 'timeOnlyDecision',
    ],
    additionalProperties: false,
  }
  const removedRange = {
    type: 'object',
    properties: {
      rangeId: { type: 'string', minLength: 1, maxLength: 240 },
      startFrame: { type: 'integer', minimum: 0 },
      endFrameExclusive: { type: 'integer', minimum: 1 },
      reason: { type: 'string', minLength: 1, maxLength: 1_000 },
      confidenceBasisPoints: { type: 'integer', minimum: 6_000, maximum: 10_000 },
      phraseBoundaryAligned: { type: 'boolean', enum: [true] },
      preservesSourceMeaning: { type: 'boolean', enum: [true] },
      userReviewRequired: { type: 'boolean', enum: [false] },
      evidenceIds: {
        type: 'array', minItems: 1, maxItems: 128,
        items: { type: 'string', minLength: 1, maxLength: 240 },
      },
      reasonCodes: {
        type: 'array', minItems: 1, maxItems: 16,
        items: { type: 'string', enum: [
          'dead_space', 'long_silence', 'filler_words', 'false_start',
          'repeated_take', 'duplicate_point', 'mistake', 'off_topic',
          'weak_explanation', 'bad_audio', 'bad_visual',
          'shaky_or_blurry', 'setup_cleanup', 'pacing_drag',
          'resolved_embedded_instruction',
        ] },
      },
      decisionBasis: {
        type: 'string',
        enum: ['content_understanding', 'resolved_embedded_instruction'],
      },
      instructionIds: {
        type: 'array', maxItems: 32,
        items: { type: 'string', minLength: 1, maxLength: 240 },
      },
      timeOnlyDecision: { type: 'boolean', enum: [false] },
    },
    required: [
      'rangeId', 'startFrame', 'endFrameExclusive', 'reason',
      'confidenceBasisPoints', 'phraseBoundaryAligned',
      'preservesSourceMeaning', 'userReviewRequired', 'evidenceIds',
      'reasonCodes', 'decisionBasis', 'instructionIds', 'timeOnlyDecision',
    ],
    additionalProperties: false,
  }
  const embeddedInstruction = {
    type: 'object',
    properties: {
      instructionId: { type: 'string', minLength: 1, maxLength: 240 },
      instructionType: { type: 'string', enum: [
        'delete_previous_part', 'delete_current_take', 'restart_from_here',
        'use_later_take', 'keep_part', 'remove_part',
        'custom_edit_direction', 'uncertain',
      ] },
      targetRelation: { type: 'string', enum: [
        'previous_context', 'current_take', 'following_take',
        'whole_source', 'custom', 'uncertain',
      ] },
      transcriptSegmentId: { type: 'string', minLength: 1, maxLength: 240 },
      spokenStartFrame: { type: 'integer', minimum: 0 },
      spokenEndFrameExclusive: { type: 'integer', minimum: 1 },
      targetStartFrame: { type: ['integer', 'null'], minimum: 0 },
      targetEndFrameExclusive: { type: ['integer', 'null'], minimum: 1 },
      reason: { type: 'string', minLength: 1, maxLength: 1_000 },
      confidenceBasisPoints: { type: 'integer', minimum: 0, maximum: 10_000 },
      evidenceIds: {
        type: 'array', minItems: 1, maxItems: 128,
        items: { type: 'string', minLength: 1, maxLength: 240 },
      },
      appliedDecisionIds: {
        type: 'array', maxItems: 128,
        items: { type: 'string', minLength: 1, maxLength: 240 },
      },
      spokenRemarkRemovalDecisionId: {
        type: ['string', 'null'], minLength: 1, maxLength: 240,
      },
      classifiedAsEditorDirected: { type: 'boolean', enum: [true] },
      interpretationStatus: {
        type: 'string', enum: ['resolved', 'user_review_required'],
      },
      userReviewRequired: { type: 'boolean' },
    },
    required: [
      'instructionId', 'instructionType', 'targetRelation',
      'transcriptSegmentId', 'spokenStartFrame', 'spokenEndFrameExclusive',
      'targetStartFrame', 'targetEndFrameExclusive', 'reason',
      'confidenceBasisPoints', 'evidenceIds', 'appliedDecisionIds',
      'spokenRemarkRemovalDecisionId', 'classifiedAsEditorDirected',
      'interpretationStatus', 'userReviewRequired',
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
                removedRanges: {
                  type: 'array', maxItems: 129, items: removedRange,
                },
                embeddedEditInstructions: {
                  type: 'array', maxItems: 128, items: embeddedInstruction,
                },
              },
              required: [
                'sourceSequenceItemId', 'mediaAssetId', 'uploadedOrder',
                'selectedRanges', 'removedRanges',
                'embeddedEditInstructions',
              ],
              additionalProperties: false,
            },
          },
          sourceOrderPreserved: { type: 'boolean', enum: [true] },
          completeSourceCoverageVerified: { type: 'boolean', enum: [true] },
          allTimelineIntervalsReviewed: { type: 'boolean', enum: [true] },
          embeddedInstructionsEvaluated: { type: 'boolean', enum: [true] },
          timeOnlyCutDecisionCount: { type: 'integer', enum: [0] },
          meaningPreservationPassed: { type: 'boolean', enum: [true] },
          userReviewRequired: { type: 'boolean' },
          reviewReasons: {
            type: 'array', maxItems: 32,
            items: { type: 'string', minLength: 1, maxLength: 1_000 },
          },
        },
        required: [
          'sources', 'sourceOrderPreserved', 'meaningPreservationPassed',
          'completeSourceCoverageVerified', 'allTimelineIntervalsReviewed',
          'embeddedInstructionsEvaluated', 'timeOnlyCutDecisionCount',
          'userReviewRequired', 'reviewReasons',
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
    sourceFrameAuthorityDigestSha256:
      source.sourceFrameAuthority?.sourceFrameAuthorityDigestSha256,
    transcriptDigestSha256: source.transcript.transcriptDigestSha256,
    transcriptCoverageDigestSha256:
      source.transcript.coverage.coverageDigestSha256,
    visualObservationDigestSha256: source.visual.observationDigestSha256,
    visualCoverageDigestSha256: source.visual.coverage.coverageDigestSha256,
  }))))
}

function exactSourceFrameAuthority(
  source: CanonicalSourceLedContentAnalysisSourceInput,
): boolean {
  const authority = source.sourceFrameAuthority
  if (!authority || authority.frameCount !== source.durationFrames) return false
  try {
    const expected = createCanonicalSourceLedSourceFrameAuthority({
      fpsNumerator: authority.fpsNumerator,
      fpsDenominator: authority.fpsDenominator,
      frameCount: authority.frameCount,
      timeBaseNumerator: authority.timeBaseNumerator,
      timeBaseDenominator: authority.timeBaseDenominator,
    })
    return stableStringify(expected) === stableStringify(authority)
  } catch {
    return false
  }
}

function mapSourceRangeToMasterFrames(
  source: CanonicalSourceLedContentAnalysisSourceInput,
  startFrame: number,
  endFrameExclusive: number,
): number {
  if (!source.sourceFrameAuthority) {
    throw new Error(
      'Managed v2 source reasoning cannot map frames without exact rational source authority.',
    )
  }
  return mapCanonicalSourceFrameRangeToMasterTiming({
    sourceStartFrame: startFrame,
    sourceEndFrameExclusive: endFrameExclusive,
    source: {
      fpsNumerator: source.sourceFrameAuthority.fpsNumerator,
      fpsDenominator: source.sourceFrameAuthority.fpsDenominator,
      frameCount: source.sourceFrameAuthority.frameCount,
      timeBaseNumerator: source.sourceFrameAuthority.timeBaseNumerator,
      timeBaseDenominator: source.sourceFrameAuthority.timeBaseDenominator,
      constantFrameRate: true,
    },
    master: { fpsNumerator: 30, fpsDenominator: 1 },
  }).masterDurationFrames
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

function assertCompleteVisualCoverage(
  ranges: readonly {
    startFrame: number
    endFrameExclusive: number
    sampledFrameNumbers?: readonly number[]
    windowIndex?: number
    exactProviderSampleFramesKnown?: false
  }[],
  durationFrames: number,
  label: string,
): void {
  let cursor = 0
  for (const range of ranges) {
    if (
      range.startFrame !== cursor
      || range.endFrameExclusive - range.startFrame > 240
      || (range.sampledFrameNumbers
        ? range.sampledFrameNumbers.length < 1
          || range.sampledFrameNumbers.length > 4
          || range.sampledFrameNumbers.some((frame, index) =>
            frame < range.startFrame
            || frame >= range.endFrameExclusive
            || (index > 0 && frame <= range.sampledFrameNumbers![index - 1]!))
        : range.windowIndex === undefined
          || range.exactProviderSampleFramesKnown !== false)
    ) {
      throw new Error(`Source reasoning ${label} is not exact complete-time window coverage.`)
    }
    cursor = range.endFrameExclusive
  }
  if (cursor !== durationFrames) {
    throw new Error(`Source reasoning ${label} does not reach the source end.`)
  }
}

function rangesOverlap(
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number,
): boolean {
  return leftStart < rightEnd && rightStart < leftEnd
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
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) => [key, stableJsonValue(item)]),
  )
}
