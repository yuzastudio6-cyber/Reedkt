import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import type { RuntimeEnv } from '../config/env'

export const KIMI_K3_SOURCE_LED_CHAT_ROUTE_ID = 'kimi_k3_primary' as const
export const KIMI_K3_SOURCE_LED_CHAT_MODEL_ID = 'kimi-k3' as const
export const KIMI_K3_SOURCE_LED_CHAT_ENDPOINT =
  'https://api.moonshot.ai/v1/chat/completions' as const
export const KIMI_K3_SOURCE_LED_CHAT_MAXIMUM_COMPLETION_TOKENS = 1_024 as const

const execFileAsync = promisify(execFile)
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
}).strict()

const assistantPayloadSchema = z.object({
  assistant_reply: z.string().trim().min(1).max(1_000),
  direction_saved: z.literal(true),
  execution_started: z.literal(false),
  plan_created: z.literal(false),
  credits_changed: z.literal(false),
}).strict()

export type KimiK3SourceLedChatAssistantStatus =
  | 'completed'
  | 'credential_unavailable'
  | 'credential_rejected'
  | 'model_unavailable'
  | 'rate_limited'
  | 'invalid_response'
  | 'provider_failed'
  | 'outcome_unknown'

export interface KimiK3SourceLedChatAssistantResult {
  readonly status: KimiK3SourceLedChatAssistantStatus
  readonly routeId: typeof KIMI_K3_SOURCE_LED_CHAT_ROUTE_ID
  readonly providerModel: typeof KIMI_K3_SOURCE_LED_CHAT_MODEL_ID
  readonly credentialSource: 'google_secret_manager_pinned_version'
  readonly credentialVersion: number | null
  readonly providerCallMade: boolean
  readonly modelCallMade: boolean
  readonly assistantContent?: string
  readonly attemptDigestSha256: string
  readonly usage?: z.infer<typeof safeUsageSchema>
}

export interface KimiK3SourceLedChatAssistantPort {
  respond(input: {
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
  }): Promise<KimiK3SourceLedChatAssistantResult>
}

export interface KimiK3CredentialResolver {
  resolve(): Promise<{
    readonly value: string
    readonly version: number
  }>
}

export function createKimiK3SourceLedChatAssistantPort(input: {
  readonly env: RuntimeEnv
  readonly fetchImpl?: typeof fetch
  readonly credentialResolver?: KimiK3CredentialResolver
}): KimiK3SourceLedChatAssistantPort {
  const fetchImpl = input.fetchImpl ?? fetch
  const credentialResolver =
    input.credentialResolver ??
    createGoogleSecretManagerKimiK3CredentialResolver(input.env)
  let credentialPromise:
    | Promise<{ readonly value: string; readonly version: number }>
    | undefined

  return Object.freeze({
    async respond(
      request: Parameters<KimiK3SourceLedChatAssistantPort['respond']>[0],
    ): Promise<KimiK3SourceLedChatAssistantResult> {
      const attemptDigestSha256 = sha256(stableStringify({
        routeId: KIMI_K3_SOURCE_LED_CHAT_ROUTE_ID,
        providerModel: KIMI_K3_SOURCE_LED_CHAT_MODEL_ID,
        workspaceId: request.workspaceId,
        projectId: request.projectId,
        editSessionId: request.editSessionId,
        clientMessageId: request.clientMessageId,
        messageDigestSha256: sha256(request.message),
      }))

      let credential: {
        readonly value: string
        readonly version: number
      }
      try {
        credentialPromise ??= credentialResolver.resolve()
        credential = await credentialPromise
      } catch {
        credentialPromise = undefined
        return safeResult({
          status: 'credential_unavailable',
          credentialVersion: null,
          providerCallMade: false,
          modelCallMade: false,
          attemptDigestSha256,
        })
      }

      const body = createProviderBody(request)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60_000)
      let response: Response
      try {
        response = await fetchImpl(KIMI_K3_SOURCE_LED_CHAT_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${credential.value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        })
      } catch {
        clearTimeout(timeout)
        return safeResult({
          status: 'outcome_unknown',
          credentialVersion: credential.version,
          providerCallMade: true,
          modelCallMade: false,
          attemptDigestSha256,
        })
      }
      clearTimeout(timeout)

      if (!response.ok) {
        await discardResponseBody(response)
        return safeResult({
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

      let providerPayload: unknown
      try {
        providerPayload = await response.json()
      } catch {
        return safeResult({
          status: 'invalid_response',
          credentialVersion: credential.version,
          providerCallMade: true,
          modelCallMade: true,
          attemptDigestSha256,
        })
      }
      const parsed = parseProviderResponse(providerPayload)
      if (!parsed) {
        return safeResult({
          status: 'invalid_response',
          credentialVersion: credential.version,
          providerCallMade: true,
          modelCallMade: true,
          attemptDigestSha256,
        })
      }
      return safeResult({
        status: 'completed',
        credentialVersion: credential.version,
        providerCallMade: true,
        modelCallMade: true,
        assistantContent: parsed.assistantContent,
        attemptDigestSha256,
        usage: parsed.usage,
      })
    },
  })
}

export function createGoogleSecretManagerKimiK3CredentialResolver(
  env: RuntimeEnv,
): KimiK3CredentialResolver {
  const reference = parsePinnedSecretReference(
    env.providerSecretReferenceNames.kimi,
  )
  if (!reference) {
    return Object.freeze({
      async resolve(): Promise<never> {
        throw new Error('Pinned Kimi Secret Manager reference is unavailable.')
      },
    })
  }

  return Object.freeze({
    async resolve() {
      const value = env.mode === 'local' && env.nodeEnv !== 'production'
        ? await resolveWithLocalGcloud(reference)
        : await resolveWithWorkloadIdentity(reference)
      if (!value) {
        throw new Error('Kimi Secret Manager payload is empty.')
      }
      return {
        value,
        version: reference.version,
      }
    },
  })
}

function createProviderBody(
  input: Parameters<KimiK3SourceLedChatAssistantPort['respond']>[0],
): Record<string, unknown> {
  const currentContext = stableStringify({
    prior_exchanges: input.priorExchanges.slice(-6).map((exchange) => ({
      user_content: exchange.userContent,
      assistant_content: exchange.assistantContent,
    })),
    user_direction: input.message,
    server_disposition: input.serverDisposition,
    required_setup_confirmations: input.requiredSetupConfirmations,
    requested_settings: input.requestedSettings,
  })
  return {
    model: KIMI_K3_SOURCE_LED_CHAT_MODEL_ID,
    messages: [
      {
        role: 'system',
        content: [
          'You are the private ReeditPro edit-intent chat assistant.',
          'Acknowledge the user’s concrete creative direction and explain how it will affect the next edit plan.',
          'Use only the supplied conversation and server disposition. Do not claim that you inspected media.',
          'Treat captions, transcript-aware cuts, b-roll, music, sound effects, generated visuals, and provider effects as requested directions only unless the supplied server context explicitly proves them available.',
          'When a requested capability is unproven, say that the next plan must validate it; never promise that it will be included or executed.',
          'Do not claim that a plan was created, editing or generation started, credits changed, tools ran, or output exists.',
          'A chat reply confirms only that the direction was saved; it is never evidence that video processing completed.',
          'If setup confirmation is required, ask only for the listed confirmation. Keep the reply calm, specific, and professional.',
          'Do not mention Kimi, Moonshot, providers, schemas, credentials, hidden reasoning, or internal architecture.',
          'Return exactly one JSON object matching the supplied strict schema.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: currentContext,
      },
    ],
    reasoning_effort: 'low',
    stream: false,
    max_completion_tokens:
      KIMI_K3_SOURCE_LED_CHAT_MAXIMUM_COMPLETION_TOKENS,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'reeditpro_source_led_chat_acknowledgement',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            assistant_reply: {
              type: 'string',
              minLength: 1,
              maxLength: 1_000,
            },
            direction_saved: {
              type: 'boolean',
              enum: [true],
            },
            execution_started: {
              type: 'boolean',
              enum: [false],
            },
            plan_created: {
              type: 'boolean',
              enum: [false],
            },
            credits_changed: {
              type: 'boolean',
              enum: [false],
            },
          },
          required: [
            'assistant_reply',
            'direction_saved',
            'execution_started',
            'plan_created',
            'credits_changed',
          ],
          additionalProperties: false,
        },
      },
    },
  }
}

function parseProviderResponse(value: unknown): {
  readonly assistantContent: string
  readonly usage: z.infer<typeof safeUsageSchema>
} | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  const payload = value as Record<string, unknown>
  if (
    payload.object !== 'chat.completion'
    || payload.model !== KIMI_K3_SOURCE_LED_CHAT_MODEL_ID
    || !Array.isArray(payload.choices)
    || payload.choices.length !== 1
  ) return
  const choice = payload.choices[0]
  if (!choice || typeof choice !== 'object' || Array.isArray(choice)) return
  const choiceRecord = choice as Record<string, unknown>
  if (
    choiceRecord.finish_reason !== 'stop'
    || !choiceRecord.message
    || typeof choiceRecord.message !== 'object'
    || Array.isArray(choiceRecord.message)
  ) return
  const content = (choiceRecord.message as Record<string, unknown>).content
  if (typeof content !== 'string') return
  let assistantPayload: unknown
  try {
    assistantPayload = JSON.parse(content)
  } catch {
    return
  }
  const parsedAssistant = assistantPayloadSchema.safeParse(assistantPayload)
  if (
    !parsedAssistant.success
    || !safeAssistantText(parsedAssistant.data.assistant_reply)
  ) return
  const usage = parseUsage(payload.usage)
  if (!usage) return
  return {
    assistantContent: parsedAssistant.data.assistant_reply,
    usage,
  }
}

function parseUsage(value: unknown): z.infer<typeof safeUsageSchema> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  const usage = value as Record<string, unknown>
  const parsed = safeUsageSchema.safeParse({
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  })
  if (
    !parsed.success
    || parsed.data.promptTokens + parsed.data.completionTokens
      !== parsed.data.totalTokens
  ) return
  return parsed.data
}

function safeAssistantText(value: string): boolean {
  return !(
    /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\//iu.test(value)
    || /\b(?:api.?key|authorization|bearer|credential|secret manager)\b/iu.test(value)
    || /\b(?:I|we|ReeditPro)\s+(?:have|'ve)\s+(?:started|begun|edited|rendered|generated|approved|charged|reserved|spent)\b/iu.test(value)
    || /\bcredits?\s+(?:were|have been|are)\s+(?:charged|reserved|spent|deducted)\b/iu.test(value)
  )
}

async function discardResponseBody(response: Response): Promise<void> {
  try {
    await response.arrayBuffer()
  } catch {
    // The provider error body is intentionally ignored and never logged.
  }
}

function safeResult(
  input: Omit<
    KimiK3SourceLedChatAssistantResult,
    'routeId' | 'providerModel' | 'credentialSource'
  >,
): KimiK3SourceLedChatAssistantResult {
  return {
    routeId: KIMI_K3_SOURCE_LED_CHAT_ROUTE_ID,
    providerModel: KIMI_K3_SOURCE_LED_CHAT_MODEL_ID,
    credentialSource: 'google_secret_manager_pinned_version',
    ...input,
  }
}

function parsePinnedSecretReference(value: string | undefined): {
  readonly project: string
  readonly secretId: string
  readonly version: number
  readonly resourceName: string
} | undefined {
  const match = value?.trim().match(
    /^projects\/([a-z][a-z0-9-]{4,28}[a-z0-9]|[0-9]{6,20})\/secrets\/([A-Za-z0-9_-]{1,255})\/versions\/([1-9][0-9]*)$/u,
  )
  if (!match) return
  const version = Number.parseInt(match[3]!, 10)
  if (!Number.isSafeInteger(version) || version < 1) return
  return {
    project: match[1]!,
    secretId: match[2]!,
    version,
    resourceName: value!.trim(),
  }
}

async function resolveWithLocalGcloud(reference: {
  readonly project: string
  readonly secretId: string
  readonly version: number
}): Promise<string> {
  const result = await execFileAsync('gcloud', [
    'secrets',
    'versions',
    'access',
    String(reference.version),
    `--secret=${reference.secretId}`,
    `--project=${reference.project}`,
  ], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024,
    timeout: 15_000,
  })
  return result.stdout.trim()
}

async function resolveWithWorkloadIdentity(reference: {
  readonly resourceName: string
}): Promise<string> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const client = await auth.getClient()
  const response = await client.request<{
    readonly payload?: { readonly data?: string }
  }>({
    url:
      `https://secretmanager.googleapis.com/v1/${reference.resourceName}:access`,
    method: 'GET',
  })
  const encoded = response.data.payload?.data
  if (!encoded) return ''
  return Buffer.from(encoded, 'base64').toString('utf8').trim()
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
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableJsonValue(entry)]),
  )
}

export const kimiK3SourceLedChatAssistantRuntimeSchema = z.object({
  source: z.literal('kimi_k3'),
  status: z.enum([
    'completed',
    'credential_unavailable',
    'credential_rejected',
    'model_unavailable',
    'rate_limited',
    'invalid_response',
    'provider_failed',
    'outcome_unknown',
  ]),
  routeId: z.literal(KIMI_K3_SOURCE_LED_CHAT_ROUTE_ID).nullable(),
  providerModel: z.literal(KIMI_K3_SOURCE_LED_CHAT_MODEL_ID).nullable(),
  credentialSource:
    z.literal('google_secret_manager_pinned_version').nullable(),
  credentialVersion: z.number().int().positive().nullable(),
  providerCallMade: z.boolean(),
  modelCallMade: z.boolean(),
  attemptDigestSha256: sha256Schema,
  usage: safeUsageSchema.optional(),
}).strict().superRefine((value, context) => {
  if (
    value.modelCallMade
    && !value.providerCallMade
  ) {
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
      message: 'Completed Kimi evidence requires a verified call and usage.',
    })
  }
  if (
    value.status !== 'completed'
    && value.usage !== undefined
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Unverified Kimi outcomes cannot report billable usage.',
    })
  }
})
