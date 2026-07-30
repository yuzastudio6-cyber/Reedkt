import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { GoogleAuth } from 'google-auth-library'
import { z } from 'zod'

import type { RuntimeEnv } from '../config/env'
import type {
  SourceLedChatAssistantPort,
  SourceLedChatAssistantRequest,
  SourceLedChatAssistantResult,
} from './source-led-chat-assistant'

export const GPT_5_6_TERRA_SOURCE_LED_CHAT_ROUTE_ID =
  'gpt_5_6_terra_fallback' as const
export const GPT_5_6_TERRA_SOURCE_LED_CHAT_MODEL_ID =
  'gpt-5.6-terra' as const
export const GPT_5_6_TERRA_SOURCE_LED_CHAT_ENDPOINT =
  'https://api.openai.com/v1/responses' as const
export const GPT_5_6_TERRA_SOURCE_LED_CHAT_MAX_OUTPUT_TOKENS = 1_024 as const

const execFileAsync = promisify(execFile)
const assistantPayloadSchema = z.object({
  assistant_reply: z.string().trim().min(1).max(1_000),
  direction_saved: z.literal(true),
  execution_started: z.literal(false),
  plan_created: z.literal(false),
  credits_changed: z.literal(false),
}).strict()
const safeUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
}).strict()

export interface Gpt56TerraCredentialResolver {
  resolve(): Promise<{
    readonly value: string
    readonly version: number
  }>
}

export function createGpt56TerraSourceLedChatAssistantPort(input: {
  readonly env: RuntimeEnv
  readonly fetchImpl?: typeof fetch
  readonly credentialResolver?: Gpt56TerraCredentialResolver
}): SourceLedChatAssistantPort {
  const fetchImpl = input.fetchImpl ?? fetch
  const credentialResolver =
    input.credentialResolver ??
    createGoogleSecretManagerGpt56TerraCredentialResolver(input.env)
  let credentialPromise:
    | Promise<{ readonly value: string; readonly version: number }>
    | undefined

  return Object.freeze({
    async respond(
      request: SourceLedChatAssistantRequest,
    ): Promise<SourceLedChatAssistantResult> {
      const attemptDigestSha256 = sha256(stableStringify({
        routeId: GPT_5_6_TERRA_SOURCE_LED_CHAT_ROUTE_ID,
        providerModel: GPT_5_6_TERRA_SOURCE_LED_CHAT_MODEL_ID,
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
        return result({
          status: 'credential_unavailable',
          credentialVersion: null,
          providerCallMade: false,
          modelCallMade: false,
          attemptDigestSha256,
        })
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60_000)
      let response: Response
      try {
        response = await fetchImpl(
          GPT_5_6_TERRA_SOURCE_LED_CHAT_ENDPOINT,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${credential.value}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(createProviderBody(request)),
            signal: controller.signal,
          },
        )
      } catch {
        clearTimeout(timeout)
        return result({
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
        return result({
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
        return result({
          status: 'invalid_response',
          credentialVersion: credential.version,
          providerCallMade: true,
          modelCallMade: true,
          attemptDigestSha256,
        })
      }
      const parsed = parseProviderResponse(payload)
      if (!parsed) {
        return result({
          status: 'invalid_response',
          credentialVersion: credential.version,
          providerCallMade: true,
          modelCallMade: true,
          attemptDigestSha256,
        })
      }
      return result({
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

export function createGoogleSecretManagerGpt56TerraCredentialResolver(
  env: RuntimeEnv,
): Gpt56TerraCredentialResolver {
  const reference = parsePinnedSecretReference(
    env.providerSecretReferenceNames.openai,
  )
  if (!reference) {
    return Object.freeze({
      async resolve(): Promise<never> {
        throw new Error(
          'Pinned OpenAI Secret Manager reference is unavailable.',
        )
      },
    })
  }

  return Object.freeze({
    async resolve() {
      const value = env.mode === 'local' && env.nodeEnv !== 'production'
        ? await resolveWithLocalGcloud(reference)
        : await resolveWithWorkloadIdentity(reference)
      if (!value) {
        throw new Error('OpenAI Secret Manager payload is empty.')
      }
      return {
        value,
        version: reference.version,
      }
    },
  })
}

function createProviderBody(
  input: SourceLedChatAssistantRequest,
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
    model: GPT_5_6_TERRA_SOURCE_LED_CHAT_MODEL_ID,
    instructions: [
      'You are the private ReeditPro edit-intent chat assistant.',
      'Acknowledge the user’s concrete creative direction and explain how it will affect the next edit plan.',
      'Use only the supplied conversation and server disposition. Do not claim that you inspected media.',
      'Treat captions, transcript-aware cuts, b-roll, music, sound effects, generated visuals, and provider effects as requested directions only unless the supplied server context explicitly proves them available.',
      'When a requested capability is unproven, say that the next plan must validate it; never promise that it will be included or executed.',
      'Do not claim that a plan was created, editing or generation started, credits changed, tools ran, or output exists.',
      'A chat reply confirms only that the direction was saved; it is never evidence that video processing completed.',
      'If setup confirmation is required, ask only for the listed confirmation. Keep the reply calm, specific, and professional.',
      'Do not mention OpenAI, GPT, providers, schemas, credentials, hidden reasoning, or internal architecture.',
      'Return exactly one JSON object matching the supplied strict schema.',
    ].join('\n'),
    input: currentContext,
    reasoning: {
      effort: 'low',
      context: 'current_turn',
    },
    max_output_tokens: GPT_5_6_TERRA_SOURCE_LED_CHAT_MAX_OUTPUT_TOKENS,
    store: false,
    truncation: 'disabled',
    safety_identifier: sha256(input.workspaceId),
    prompt_cache_key: sha256([
      input.workspaceId,
      input.projectId,
      input.editSessionId,
    ].join('\u0000')),
    text: {
      verbosity: 'low',
      format: {
        type: 'json_schema',
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
    payload.object !== 'response'
    || payload.status !== 'completed'
    || payload.model !== GPT_5_6_TERRA_SOURCE_LED_CHAT_MODEL_ID
    || !Array.isArray(payload.output)
  ) return
  const outputTexts: string[] = []
  for (const item of payload.output) {
    if (
      !item
      || typeof item !== 'object'
      || Array.isArray(item)
    ) continue
    const record = item as Record<string, unknown>
    if (
      record.type !== 'message'
      || record.role !== 'assistant'
      || record.status !== 'completed'
      || !Array.isArray(record.content)
    ) continue
    for (const content of record.content) {
      if (
        content
        && typeof content === 'object'
        && !Array.isArray(content)
        && (content as Record<string, unknown>).type === 'output_text'
        && typeof (content as Record<string, unknown>).text === 'string'
      ) {
        outputTexts.push(
          (content as Record<string, unknown>).text as string,
        )
      }
    }
  }
  if (outputTexts.length !== 1) return
  let assistantPayload: unknown
  try {
    assistantPayload = JSON.parse(outputTexts[0]!)
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
    promptTokens: usage.input_tokens,
    completionTokens: usage.output_tokens,
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
    // Provider error content is intentionally discarded without logging.
  }
}

function result(
  input: Omit<
    SourceLedChatAssistantResult,
    | 'source'
    | 'routeId'
    | 'providerModel'
    | 'credentialSource'
    | 'fallbackFrom'
    | 'fallbackTrigger'
  >,
): SourceLedChatAssistantResult {
  return {
    source: 'gpt_5_6_terra',
    routeId: GPT_5_6_TERRA_SOURCE_LED_CHAT_ROUTE_ID,
    providerModel: GPT_5_6_TERRA_SOURCE_LED_CHAT_MODEL_ID,
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
  const response = await execFileAsync('gcloud', [
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
  return response.stdout.trim()
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
