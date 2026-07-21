import { createHash } from 'node:crypto'
import { z } from 'zod'
import type { QwenProviderTransportRequest } from '../../src/types'
import {
  isQwenRuntimeConfigReadyForProvider,
  loadQwenRuntimeConfig,
} from '../../src/backend/qwen-runtime/qwen-runtime-config-service'
import { sendQwenProviderTransportRequest } from '../../src/backend/qwen-runtime/qwen-provider-transport'
import {
  resolveQwenDirectEnvSecretValue,
  resolveQwenSecretManagerValue,
} from '../../src/backend/qwen-runtime/qwen-secret-manager-resolver'

export const QWEN_STORY_EDITORIAL_PROVIDER_ID = 'qwen_reasoning_backend' as const
export const QWEN_STORY_EDITORIAL_PROVIDER_ADAPTER_ID = 'qwen_story_editorial_reasoning_provider' as const
export const QWEN_STORY_EDITORIAL_PROVIDER_ADAPTER_VERSION = 'v1' as const
export const QWEN_STORY_EDITORIAL_MODEL_ROUTING_POLICY_VERSION = 'model-routing-policy-v1' as const
export const QWEN_STORY_EDITORIAL_STRUCTURED_CONTEXT_VERSION = 'edit-reference-story-editorial-structured-context-v1' as const

const evidenceKindSchema = z.enum([
  'media_structure',
  'technical_change_point',
  'visual_language',
  'transcript_semantic_summary',
  'speech_timing_summary',
  'study_goal',
  'fact_safety',
])

const evidenceItemSchema = z.object({
  evidenceId: z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/),
  kind: evidenceKindSchema,
  summary: z.string().trim().min(1).max(900),
  confidence: z.number().min(Number.EPSILON).max(1),
  requiresUserReview: z.boolean(),
}).strict()

export const qwenStoryEditorialStructuredContextSchema = z.object({
  schemaVersion: z.literal(QWEN_STORY_EDITORIAL_STRUCTURED_CONTEXT_VERSION),
  evidenceManifestDigestSha256: z.string().regex(/^[a-f0-9]{64}$/),
  audioPresence: z.enum(['present', 'absent']),
  sourceClaimsPresent: z.boolean(),
  evidenceItems: z.array(evidenceItemSchema).min(4).max(64),
  boundaries: z.object({
    technicalChangePointsAreNonSemantic: z.literal(true),
    exactReferenceWordingTransferAllowed: z.literal(false),
    exactReferenceSequenceTransferAllowed: z.literal(false),
    exactReferenceTimingTransferAllowed: z.literal(false),
    referenceIdentityTransferAllowed: z.literal(false),
    targetAdaptationRequired: z.literal(true),
    targetEvidenceRequired: z.literal(true),
    userApprovalRequired: z.literal(true),
  }).strict(),
}).strict()

const observationSchema = z.object({
  category: z.enum([
    'hook_function',
    'narrative_arc',
    'topic_transition',
    'emotional_progression',
    'problem_solution_structure',
    'education_demo_structure',
    'information_density',
    'broll_meaning_support',
    'pacing_section',
  ]),
  summary: z.string().trim().min(1).max(1_000),
  evidenceIds: z.array(z.string().trim().min(1).max(200)).min(1).max(64),
  confidence: z.number().min(Number.EPSILON).max(1),
  transferability: z.enum(['transferable_principle', 'context_only', 'non_transferable']),
  requiresUserReview: z.boolean(),
  claimRelated: z.boolean(),
  factSafetyStatus: z.enum(['not_applicable', 'bounded_by_evidence', 'requires_review']),
}).strict()

const responseSchema = z.object({
  schemaVersion: z.literal('reeditpro-story-editorial-reasoning-v1'),
  observations: z.array(observationSchema).min(1).max(64),
  coverage: z.object({
    partial: z.boolean(),
    missingEvidenceKinds: z.array(z.string().trim().min(1).max(120)).max(16),
  }).strict(),
  transferSafety: z.object({
    observationMode: z.literal('generalized_story_editorial_principles_only'),
    exactHookWordingRetained: z.literal(false),
    exactSceneSequenceInstructionCreated: z.literal(false),
    exactTimingInstructionCreated: z.literal(false),
    creatorIdentityTransferInstructionCreated: z.literal(false),
    copyrightedAssetTransferInstructionCreated: z.literal(false),
    referenceGraphicLayoutTransferInstructionCreated: z.literal(false),
    executableTargetOperationCreated: z.literal(false),
  }).strict(),
  factSafety: z.object({
    unverifiedClaimPresentedAsFact: z.literal(false),
    sourceAttributionRemoved: z.literal(false),
    guiltImplyingVisualInstructionCreated: z.literal(false),
  }).strict(),
  model: z.object({
    modelId: z.string().trim().min(1).max(200),
    modelRevision: z.string().trim().min(1).max(200),
    modelAggregateSha256: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict(),
  generatedAssetsCreated: z.literal(false),
  targetOperationsCreated: z.literal(false),
  publicArtifactsCreated: z.literal(false),
  signedUrlsCreated: z.literal(false),
}).strict()

export type QwenStoryEditorialEvidenceKind = z.infer<typeof evidenceKindSchema>
export type QwenStoryEditorialEvidenceItem = z.infer<typeof evidenceItemSchema>
export type QwenStoryEditorialStructuredContext = z.infer<typeof qwenStoryEditorialStructuredContextSchema>
export type QwenStoryEditorialObservation = z.infer<typeof observationSchema>

export interface QwenStoryEditorialProviderResult {
  readonly status: 'completed' | 'blocked'
  readonly observations: readonly QwenStoryEditorialObservation[]
  readonly coverage?: {
    readonly partial: boolean
    readonly missingEvidenceKinds: readonly string[]
  }
  readonly execution: {
    readonly structuredEvidenceRead: boolean
    readonly providerCallMade: boolean
    readonly modelCallMade: boolean
    readonly workerJobCreated: false
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
    readonly reasoningInstructionDigestSha256: string
  }
  readonly blockers: readonly string[]
}

export interface QwenStoryEditorialReasoningProvider {
  readonly executionMode: 'controlled_local' | 'live_provider'
  analyze(input: QwenStoryEditorialStructuredContext): Promise<QwenStoryEditorialProviderResult>
}

export type EditReferenceStoryEditorialProviderResult = QwenStoryEditorialProviderResult
export type EditReferenceStoryEditorialReasoningProvider = QwenStoryEditorialReasoningProvider

export interface QwenStoryEditorialReasoningProviderOptions {
  readonly env?: Record<string, string | undefined>
  readonly fetchImpl?: typeof fetch
  readonly secretClient?: Parameters<typeof resolveQwenSecretManagerValue>[0]['client']
}

const SECRET_OR_PATH_PATTERN = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|service.?role|api.?key|authorization|bearer\s+|signed.?url|sk-[a-z0-9_-]+/i

export function createQwenStoryEditorialReasoningProvider(
  options: QwenStoryEditorialReasoningProviderOptions = {},
): QwenStoryEditorialReasoningProvider {
  const env = options.env ?? process.env
  return {
    executionMode: 'live_provider',
    async analyze(input): Promise<QwenStoryEditorialProviderResult> {
      const parsedInput = qwenStoryEditorialStructuredContextSchema.safeParse(input)
      if (!parsedInput.success || !isSafeStructuredContext(parsedInput.success ? parsedInput.data : input)) {
        return blocked(false, false, false, ['story_editorial_structured_evidence_invalid'])
      }
      const context = parsedInput.data
      const serializedContext = JSON.stringify(context)
      if (serializedContext.length > 32_000 || new Set(context.evidenceItems.map((item) => item.evidenceId)).size !== context.evidenceItems.length) {
        return blocked(true, false, false, ['story_editorial_structured_evidence_outside_bound'])
      }

      const config = loadQwenRuntimeConfig(env)
      if (!isQwenRuntimeConfigReadyForProvider(config)) {
        return blocked(true, false, false, [`story_editorial_${config.status}`])
      }
      const apiKey = config.apiKeyDirectEnvConfigured
        ? resolveQwenDirectEnvSecretValue({
            symbolicName: 'QWEN_REASONING_API_KEY',
            value: env.QWEN_REASONING_API_KEY,
          })
        : await resolveQwenSecretManagerValue({
            symbolicName: 'QWEN_REASONING_API_KEY_SECRET',
            referenceName: config.apiKeySecretReferenceName,
            env,
            client: options.secretClient,
          })
      if (!apiKey.value) return blocked(true, false, false, ['story_editorial_secret_unavailable'])

      const baseUrl = clean(env.QWEN_REASONING_BASE_URL) ?? await resolveOptionalSecret({
        symbolicName: 'QWEN_REASONING_BASE_URL_SECRET',
        referenceName: config.baseUrlSecretReferenceName,
        env,
        client: options.secretClient,
      })
      const modelId = clean(env.QWEN_REASONING_MODEL_ID) ?? await resolveOptionalSecret({
        symbolicName: 'QWEN_REASONING_MODEL_ID_SECRET',
        referenceName: config.modelIdSecretReferenceName,
        env,
        client: options.secretClient,
      })
      const modelRevision = clean(env.QWEN_REASONING_MODEL_REVISION)
      const modelAggregateSha256 = clean(env.QWEN_REASONING_MODEL_AGGREGATE_SHA256)?.toLowerCase()
      if (
        !baseUrl
        || !/^https:\/\//i.test(baseUrl)
        || !modelId
        || !modelRevision
        || !modelAggregateSha256
        || !/^[a-f0-9]{64}$/.test(modelAggregateSha256)
      ) {
        return blocked(true, false, false, ['story_editorial_model_provenance_unavailable'])
      }

      const prompt = createQwenStoryEditorialPrompt(context)
      const transportRequest: QwenProviderTransportRequest = {
        profile: config.transportProfile,
        baseUrl,
        requestPath: config.requestPath,
        modelId,
        outputSchemaName: 'ReeditproStoryEditorialReasoningV1',
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        timeoutMs: Math.max(config.timeoutMs, 30_000),
        maxRetries: config.maxRetries,
      }
      const transport = await sendQwenProviderTransportRequest({
        request: transportRequest,
        apiKey: apiKey.value,
        fetchImpl: options.fetchImpl,
      })
      if (transport.status !== 'completed') {
        return blocked(
          true,
          transport.providerCallMade,
          transport.modelCallMade,
          [`story_editorial_transport_${transport.status}`],
        )
      }
      const parsedResponse = responseSchema.safeParse(transport.parsedJson)
      if (!parsedResponse.success) {
        return blocked(true, true, true, ['story_editorial_response_schema_invalid'])
      }
      const response = parsedResponse.data
      if (
        response.model.modelId !== modelId
        || response.model.modelRevision !== modelRevision
        || response.model.modelAggregateSha256 !== modelAggregateSha256
        || !responseMatchesEvidence(context, response.observations)
        || response.coverage.partial !== (response.coverage.missingEvidenceKinds.length > 0)
        || !isSafeStructuredContext(response)
      ) {
        return blocked(true, true, true, ['story_editorial_response_evidence_invalid'])
      }
      return {
        status: 'completed',
        observations: response.observations,
        coverage: response.coverage,
        execution: {
          structuredEvidenceRead: true,
          providerCallMade: true,
          modelCallMade: true,
          workerJobCreated: false,
          remoteMutationMade: false,
        },
        runtimeProvenance: {
          runtimeSource: 'verified_live',
          adapterId: QWEN_STORY_EDITORIAL_PROVIDER_ADAPTER_ID,
          adapterVersion: QWEN_STORY_EDITORIAL_PROVIDER_ADAPTER_VERSION,
          providerId: QWEN_STORY_EDITORIAL_PROVIDER_ID,
          modelId,
          modelRevision,
          modelAggregateSha256,
          modelRoutingPolicyVersion: QWEN_STORY_EDITORIAL_MODEL_ROUTING_POLICY_VERSION,
          reasoningInstructionDigestSha256: createHash('sha256').update(prompt.systemPrompt).digest('hex'),
        },
        blockers: [],
      }
    },
  }
}

export function createQwenStoryEditorialPrompt(
  context: QwenStoryEditorialStructuredContext,
): { readonly systemPrompt: string; readonly userPrompt: string } {
  const systemPrompt = [
    'You are ReeditPro Story/Editorial evidence analyst.',
    'Return exactly one JSON object matching ReeditproStoryEditorialReasoningV1. Do not return markdown, commentary, or hidden reasoning.',
    'Use only the bounded structured evidence supplied. Never request or infer raw media, raw transcript wording, external URLs, creator identity, or copyrighted assets.',
    'Extract generalized story, editorial, pacing, and meaning-support principles only. Do not create an edit plan, target operation, generated asset, provider prompt, render instruction, or final timing.',
    'Never retain exact hook wording, exact scene order, exact event order, exact timing, or creator identity. Technical change points are nonsemantic context and cannot establish scenes, story beats, transitions, or meaning by themselves.',
    'Every observation must cite only supplied evidence IDs and must include at least one semantic evidence item: visual-language, transcript-semantic-summary, study-goal, or fact-safety evidence.',
    'Claim-related observations require fact-safety evidence, preserved attribution, and review when evidence is uncertain. Do not present unverified allegations as facts or create guilt-implying visuals.',
    'All findings require target-specific adaptation, target evidence, user review when marked, and later explicit approval before any application.',
  ].join('\n')
  return {
    systemPrompt,
    userPrompt: JSON.stringify(context),
  }
}

function responseMatchesEvidence(
  context: QwenStoryEditorialStructuredContext,
  observations: readonly QwenStoryEditorialObservation[],
): boolean {
  const evidenceById = new Map(context.evidenceItems.map((item) => [item.evidenceId, item]))
  const factSafetyIds = new Set(context.evidenceItems
    .filter((item) => item.kind === 'fact_safety')
    .map((item) => item.evidenceId))
  const semanticKinds = new Set<QwenStoryEditorialEvidenceKind>([
    'visual_language',
    'transcript_semantic_summary',
    'study_goal',
    'fact_safety',
  ])
  return observations.every((observation) => {
    if (new Set(observation.evidenceIds).size !== observation.evidenceIds.length) return false
    const items = observation.evidenceIds.map((id) => evidenceById.get(id))
    if (items.some((item) => !item) || !items.some((item) => item && semanticKinds.has(item.kind))) return false
    if (observation.claimRelated) {
      return context.sourceClaimsPresent
        && observation.factSafetyStatus !== 'not_applicable'
        && observation.evidenceIds.some((id) => factSafetyIds.has(id))
    }
    return observation.factSafetyStatus === 'not_applicable'
  })
}

function blocked(
  structuredEvidenceRead: boolean,
  providerCallMade: boolean,
  modelCallMade: boolean,
  blockers: readonly string[],
): QwenStoryEditorialProviderResult {
  return {
    status: 'blocked',
    observations: [],
    execution: {
      structuredEvidenceRead,
      providerCallMade,
      modelCallMade,
      workerJobCreated: false,
      remoteMutationMade: false,
    },
    blockers,
  }
}

function isSafeStructuredContext(value: unknown): boolean {
  if (typeof value === 'string') return !SECRET_OR_PATH_PATTERN.test(value)
  if (Array.isArray(value)) return value.every(isSafeStructuredContext)
  if (typeof value === 'object' && value !== null) {
    return Object.values(value as Record<string, unknown>).every(isSafeStructuredContext)
  }
  return true
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

async function resolveOptionalSecret(input: {
  readonly symbolicName: string
  readonly referenceName?: string
  readonly env: Record<string, string | undefined>
  readonly client?: Parameters<typeof resolveQwenSecretManagerValue>[0]['client']
}): Promise<string | undefined> {
  return (await resolveQwenSecretManagerValue(input)).value
}
