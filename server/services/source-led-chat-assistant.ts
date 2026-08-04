import { z } from 'zod'

import type {
  KimiK3SourceLedChatAssistantPort,
  KimiK3SourceLedChatAssistantResult,
} from './kimi-k3-source-led-chat-assistant'

export type SourceLedChatAssistantStatus =
  | 'completed'
  | 'credential_unavailable'
  | 'credential_rejected'
  | 'model_unavailable'
  | 'rate_limited'
  | 'invalid_response'
  | 'provider_failed'
  | 'outcome_unknown'

export type SourceLedChatAssistantFallbackTrigger =
  | 'provider_unavailable'
  | 'provider_rate_limited'
  | 'provider_timeout'
  | 'transient_provider_error'
  | 'malformed_structured_output'

export interface SourceLedChatAssistantRequest {
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly clientMessageId: string
  readonly message: string
  readonly priorExchanges: readonly {
    readonly userContent: string
    readonly assistantContent: string
  }[]
  readonly serverDisposition:
    | 'applied_to_next_plan'
    | 'waiting_for_setup_confirmation'
    | 'not_applied'
  readonly requiredSetupConfirmations: readonly string[]
  readonly requestedSettings: Readonly<Record<string, string>>
}

export interface SourceLedChatAssistantAttemptEvidence {
  readonly source: 'kimi_k3'
  readonly routeId: 'kimi_k3_primary'
  readonly providerModel: 'kimi-k3'
  readonly status: SourceLedChatAssistantStatus
  readonly credentialVersion: number | null
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly attemptDigestSha256: string
}

export interface SourceLedChatAssistantResult {
  readonly source: 'kimi_k3' | 'gpt_5_6_terra'
  readonly status: SourceLedChatAssistantStatus
  readonly routeId: 'kimi_k3_primary' | 'gpt_5_6_terra_fallback'
  readonly providerModel: 'kimi-k3' | 'gpt-5.6-terra'
  readonly credentialSource: 'google_secret_manager_pinned_version'
  readonly credentialVersion: number | null
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly assistantContent?: string
  readonly attemptDigestSha256: string
  readonly usage?: {
    readonly promptTokens: number
    readonly completionTokens: number
    readonly totalTokens: number
  }
  readonly fallbackFrom?: SourceLedChatAssistantAttemptEvidence
  readonly fallbackTrigger?: SourceLedChatAssistantFallbackTrigger
}

export interface SourceLedChatAssistantPort {
  respond(
    input: SourceLedChatAssistantRequest,
  ): Promise<SourceLedChatAssistantResult>
}

export function createKimiTerraSourceLedChatAssistantPort(input: {
  readonly kimi: KimiK3SourceLedChatAssistantPort
  readonly terra?: SourceLedChatAssistantPort
}): SourceLedChatAssistantPort {
  return Object.freeze({
    async respond(
      request: SourceLedChatAssistantRequest,
    ): Promise<SourceLedChatAssistantResult> {
      const kimi = await input.kimi.respond(request)
      const primary = projectKimiResult(kimi)
      const fallbackTrigger = fallbackTriggerFor(primary.status)
      if (!input.terra || !fallbackTrigger) return primary
      const terra = await input.terra.respond(request)
      return {
        ...terra,
        fallbackFrom: attemptEvidence(primary),
        fallbackTrigger,
      }
    },
  })
}

export function projectKimiResult(
  result: KimiK3SourceLedChatAssistantResult,
): SourceLedChatAssistantResult {
  return {
    source: 'kimi_k3',
    status: result.status,
    routeId: result.routeId,
    providerModel: result.providerModel,
    credentialSource: result.credentialSource,
    credentialVersion: result.credentialVersion,
    providerCallMade: result.providerCallMade,
    modelCallMade: result.modelCallMade,
    ...(result.assistantContent
      ? { assistantContent: result.assistantContent }
      : {}),
    attemptDigestSha256: result.attemptDigestSha256,
    ...(result.usage ? { usage: result.usage } : {}),
  }
}

function fallbackTriggerFor(
  status: SourceLedChatAssistantStatus,
): SourceLedChatAssistantFallbackTrigger | undefined {
  if (status === 'credential_unavailable' || status === 'model_unavailable') {
    return 'provider_unavailable'
  }
  if (status === 'rate_limited') return 'provider_rate_limited'
  if (status === 'outcome_unknown') return 'provider_timeout'
  if (status === 'provider_failed') return 'transient_provider_error'
  if (status === 'invalid_response') return 'malformed_structured_output'
  return undefined
}

function attemptEvidence(
  result: SourceLedChatAssistantResult,
): SourceLedChatAssistantAttemptEvidence {
  if (
    result.source !== 'kimi_k3'
    || result.routeId !== 'kimi_k3_primary'
    || result.providerModel !== 'kimi-k3'
  ) {
    throw new Error('Only the exact Kimi primary attempt may precede Terra.')
  }
  return {
    source: result.source,
    routeId: result.routeId,
    providerModel: result.providerModel,
    status: result.status,
    credentialVersion: result.credentialVersion,
    providerCallMade: result.providerCallMade,
    modelCallMade: result.modelCallMade,
    attemptDigestSha256: result.attemptDigestSha256,
  }
}

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)
const statusSchema = z.enum([
  'completed',
  'credential_unavailable',
  'credential_rejected',
  'model_unavailable',
  'rate_limited',
  'invalid_response',
  'provider_failed',
  'outcome_unknown',
])
const usageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
}).strict()
const fallbackFromSchema = z.object({
  source: z.literal('kimi_k3'),
  routeId: z.literal('kimi_k3_primary'),
  providerModel: z.literal('kimi-k3'),
  status: statusSchema,
  credentialVersion: z.number().int().positive().nullable(),
  providerCallMade: z.boolean(),
  modelCallMade: z.boolean(),
  attemptDigestSha256: sha256Schema,
}).strict()

export const sourceLedChatAssistantRuntimeSchema = z.object({
  source: z.enum(['kimi_k3', 'gpt_5_6_terra']),
  status: statusSchema,
  routeId: z.enum(['kimi_k3_primary', 'gpt_5_6_terra_fallback']),
  providerModel: z.enum(['kimi-k3', 'gpt-5.6-terra']),
  credentialSource:
    z.literal('google_secret_manager_pinned_version'),
  credentialVersion: z.number().int().positive().nullable(),
  providerCallMade: z.boolean(),
  modelCallMade: z.boolean(),
  attemptDigestSha256: sha256Schema,
  usage: usageSchema.optional(),
  fallbackFrom: fallbackFromSchema.optional(),
  fallbackTrigger: z.enum([
    'provider_unavailable',
    'provider_rate_limited',
    'provider_timeout',
    'transient_provider_error',
    'malformed_structured_output',
  ]).optional(),
}).strict().superRefine((value, context) => {
  const routeMatches =
    (
      value.source === 'kimi_k3'
      && value.routeId === 'kimi_k3_primary'
      && value.providerModel === 'kimi-k3'
    )
    || (
      value.source === 'gpt_5_6_terra'
      && value.routeId === 'gpt_5_6_terra_fallback'
      && value.providerModel === 'gpt-5.6-terra'
    )
  if (!routeMatches) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Assistant source, route, and provider model must match.',
    })
  }
  if (value.modelCallMade && !value.providerCallMade) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A model call requires a provider call.',
    })
  }
  if (
    value.status === 'completed'
    && (
      !value.providerCallMade
      || !value.modelCallMade
      || value.credentialVersion === null
      || !value.usage
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Completed assistant evidence requires call and usage proof.',
    })
  }
  if (value.status !== 'completed' && value.usage !== undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Unverified assistant outcomes cannot report usage.',
    })
  }
  if (
    (value.fallbackFrom === undefined)
      !== (value.fallbackTrigger === undefined)
    || (
      value.source === 'gpt_5_6_terra'
        ? !value.fallbackFrom
          || value.fallbackFrom.status === 'completed'
          || value.fallbackFrom.status === 'credential_rejected'
          || value.fallbackTrigger
            !== fallbackTriggerFor(value.fallbackFrom.status)
        : value.fallbackFrom !== undefined
          || value.fallbackTrigger !== undefined
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Terra fallback requires one eligible terminal Kimi attempt.',
    })
  }
  if (
    value.usage
    && value.usage.promptTokens + value.usage.completionTokens
      !== value.usage.totalTokens
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Assistant usage totals must reconcile.',
    })
  }
})
