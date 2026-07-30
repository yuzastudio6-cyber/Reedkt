import {
  callReeditProApi,
  getFrontendApiClientStatus,
} from '../backend/api/frontend-api-client'
import {
  CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION,
  type CanonicalSourceLedChatExchange,
  type CanonicalSourceLedChatThread,
} from '../types/canonical-source-led-chat-direction'
import type { ProjectPersistenceScope } from './project-persistence-scope'
import {
  apiResponseInvalidatesProjectPersistenceScope,
  invalidateProjectPersistenceScope,
} from './project-persistence-scope'

export type CanonicalSourceLedChatClientResult =
  | {
      readonly ok: true
      readonly thread: CanonicalSourceLedChatThread
      readonly exchange?: CanonicalSourceLedChatExchange
      readonly replayed?: boolean
      readonly warnings: readonly string[]
    }
  | {
      readonly ok: false
      readonly status:
        | 'not_configured'
        | 'access_denied'
        | 'blocked'
        | 'unavailable'
        | 'invalid_response'
      readonly retryable: boolean
      readonly message: string
      readonly warnings: readonly string[]
    }

export async function readCanonicalSourceLedChat(input: {
  readonly scope: ProjectPersistenceScope
  readonly projectId: string
  readonly editSessionId: string
}): Promise<CanonicalSourceLedChatClientResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return failure(
      'not_configured',
      'Named-edit Chat requires the reviewed private backend.',
      false,
      runtime.warnings,
    )
  }
  const response = await callReeditProApi<
    undefined,
    { canonicalSourceLedChat?: unknown }
  >(
    'planning.sourceLedChat.get',
    undefined,
    {
      params: {
        projectId: input.projectId,
        editSessionId: input.editSessionId,
      },
      query: { workspaceId: input.scope.workspaceId },
      context: apiContext(input),
    },
  )
  invalidateScopeIfRequired(input.scope, response)
  if (!response.ok) return classifyFailure(response)
  const thread = parseCanonicalSourceLedChatThread(
    response.data?.canonicalSourceLedChat,
    input,
  )
  if (!thread) {
    return failure(
      'invalid_response',
      'The saved Chat response did not match this exact named edit.',
      false,
      response.warnings,
    )
  }
  return { ok: true, thread, warnings: response.warnings }
}

export async function appendCanonicalSourceLedChatDirection(input: {
  readonly scope: ProjectPersistenceScope
  readonly projectId: string
  readonly editSessionId: string
  readonly clientMessageId: string
  readonly message: string
  readonly idempotencyKey: string
}): Promise<CanonicalSourceLedChatClientResult> {
  const runtime = getFrontendApiClientStatus()
  if (runtime.mockOnly || !runtime.apiBaseUrl) {
    return failure(
      'not_configured',
      'This message was not sent because the reviewed private backend is unavailable.',
      true,
      runtime.warnings,
    )
  }
  const response = await callReeditProApi<
    {
      workspaceId: string
      purpose: 'append_named_edit_planning_direction'
      clientMessageId: string
      message: string
    },
    {
      canonicalSourceLedChat?: unknown
      exchange?: unknown
      replayed?: unknown
    }
  >(
    'planning.sourceLedChat.append',
    {
      workspaceId: input.scope.workspaceId,
      purpose: 'append_named_edit_planning_direction',
      clientMessageId: input.clientMessageId,
      message: input.message,
    },
    {
      params: {
        projectId: input.projectId,
        editSessionId: input.editSessionId,
      },
      context: apiContext(input),
      idempotencyKey: input.idempotencyKey,
    },
  )
  invalidateScopeIfRequired(input.scope, response)
  if (!response.ok) return classifyFailure(response)
  const thread = parseCanonicalSourceLedChatThread(
    response.data?.canonicalSourceLedChat,
    input,
  )
  const exchange = parseCanonicalSourceLedChatExchange(response.data?.exchange)
  if (
    !thread
    || !exchange
    || !thread.exchanges.some((item) => item.exchangeId === exchange.exchangeId)
    || typeof response.data?.replayed !== 'boolean'
  ) {
    return failure(
      'invalid_response',
      'The server saved an unverifiable Chat response. Refresh before sending another message.',
      true,
      response.warnings,
    )
  }
  return {
    ok: true,
    thread,
    exchange,
    replayed: response.data.replayed,
    warnings: response.warnings,
  }
}

export function createCanonicalSourceLedChatClientMessageId(): string {
  return `source-led-chat-client-${crypto.randomUUID()}`
}

export function createCanonicalSourceLedChatIdempotencyKey(): string {
  return `source-led-chat-append-${crypto.randomUUID()}`
}

function parseCanonicalSourceLedChatThread(
  value: unknown,
  expected: {
    readonly scope: ProjectPersistenceScope
    readonly projectId: string
    readonly editSessionId: string
  },
): CanonicalSourceLedChatThread | undefined {
  if (!exactObject(value, [
    'schemaVersion',
    'source',
    'workspaceId',
    'projectId',
    'editSessionId',
    'revision',
    'exchanges',
    'activeInstructionHistory',
    'updatedAt',
    'privateInternalOnly',
    'providerModelCalled',
    'planCreated',
    'executionStarted',
    'creditsReservedOrSpent',
  ])) return undefined
  if (
    value.schemaVersion !== CANONICAL_SOURCE_LED_CHAT_THREAD_VERSION
    || value.source !== 'private_canonical_source_led_chat_store'
    || value.workspaceId !== expected.scope.workspaceId
    || value.projectId !== expected.projectId
    || value.editSessionId !== expected.editSessionId
    || !Number.isInteger(value.revision)
    || Number(value.revision) < 0
    || !Array.isArray(value.exchanges)
    || !Array.isArray(value.activeInstructionHistory)
    || value.activeInstructionHistory.some((item) => typeof item !== 'string')
    || !(value.updatedAt === null || validIso(value.updatedAt))
    || value.privateInternalOnly !== true
    || typeof value.providerModelCalled !== 'boolean'
    || value.planCreated !== false
    || value.executionStarted !== false
    || value.creditsReservedOrSpent !== false
  ) return undefined
  const exchanges = value.exchanges.map(parseCanonicalSourceLedChatExchange)
  if (
    exchanges.some((exchange) => !exchange)
    || exchanges.length !== value.revision
  ) return undefined
  const verifiedExchanges = exchanges as CanonicalSourceLedChatExchange[]
  const activeInstructionHistory = verifiedExchanges
    .filter((exchange) => exchange.effect.activeForPlanning)
    .map((exchange) => exchange.userMessage.content)
  if (
    verifiedExchanges.some(
      (exchange, index) => exchange.revision !== index + 1,
    )
    || new Set(verifiedExchanges.map((exchange) => exchange.exchangeId)).size
      !== verifiedExchanges.length
    || new Set(verifiedExchanges.map((exchange) => exchange.clientMessageId)).size
      !== verifiedExchanges.length
    || JSON.stringify(value.activeInstructionHistory)
      !== JSON.stringify(activeInstructionHistory)
    || value.providerModelCalled !== verifiedExchanges.some(
      (exchange) => exchange.assistantRuntime?.modelCallMade === true,
    )
  ) return undefined
  return structuredClone(value) as unknown as CanonicalSourceLedChatThread
}

function parseCanonicalSourceLedChatExchange(
  value: unknown,
): CanonicalSourceLedChatExchange | undefined {
  if (!exactObjectSubset(value, [
    'exchangeId',
    'clientMessageId',
    'revision',
    'userMessage',
    'assistantMessage',
    'assistantRuntime',
    'effect',
  ])) return undefined
  if (
    !safeId(value.exchangeId)
    || !safeId(value.clientMessageId)
    || !Number.isInteger(value.revision)
    || Number(value.revision) < 1
    || !exactObject(value.userMessage, [
      'id', 'content', 'contentDigestSha256', 'createdAt',
    ])
    || !safeId(value.userMessage.id)
    || typeof value.userMessage.content !== 'string'
    || value.userMessage.content.length < 1
    || value.userMessage.content.length > 4_000
    || !sha256(value.userMessage.contentDigestSha256)
    || !validIso(value.userMessage.createdAt)
    || !exactObject(value.assistantMessage, ['id', 'content', 'createdAt'])
    || !safeId(value.assistantMessage.id)
    || typeof value.assistantMessage.content !== 'string'
    || value.assistantMessage.content.length < 1
    || value.assistantMessage.content.length > 4_000
    || !validIso(value.assistantMessage.createdAt)
    || (
      value.assistantRuntime !== undefined
      && !validAssistantRuntime(value.assistantRuntime)
    )
    || !validEffect(value.effect)
    || !validAssistantRuntimeEffect(
      value.assistantRuntime,
      value.effect,
    )
  ) return undefined
  return structuredClone(value) as unknown as CanonicalSourceLedChatExchange
}

function validEffect(value: unknown): boolean {
  if (!exactObject(value, [
    'status',
    'activeForPlanning',
    'requestedSettings',
    'requiredSetupConfirmations',
    'unsupportedRequests',
    'draftPlanInvalidated',
    'executionStarted',
    'creditsReservedOrSpent',
  ])) return false
  const statusValid = [
    'applied_to_next_plan',
    'waiting_for_setup_confirmation',
    'waiting_for_ai_response',
    'not_applied',
  ].includes(String(value.status))
  const settingsValid = validRequestedSettings(value.requestedSettings)
  const requiredConfirmationsValid =
    Array.isArray(value.requiredSetupConfirmations)
    && value.requiredSetupConfirmations.length <= 7
    && new Set(value.requiredSetupConfirmations).size
      === value.requiredSetupConfirmations.length
    && value.requiredSetupConfirmations.every((item) => [
      'output_frame',
      'cleanup_preference',
      'visual_direction',
      'workflow_context',
      'mood',
      'cost_posture',
      'destination',
    ].includes(String(item)))
  const unsupportedValid =
    Array.isArray(value.unsupportedRequests)
    && value.unsupportedRequests.length <= 1
    && value.unsupportedRequests.every(
      (item) => item === 'edit_level_not_exposed_in_internal_testing',
    )
  const requiredConfirmationCount = Array.isArray(
    value.requiredSetupConfirmations,
  )
    ? value.requiredSetupConfirmations.length
    : -1
  const unsupportedRequestCount = Array.isArray(value.unsupportedRequests)
    ? value.unsupportedRequests.length
    : -1
  const requestedSettingCount =
    value.requestedSettings
    && typeof value.requestedSettings === 'object'
    && !Array.isArray(value.requestedSettings)
      ? Object.keys(value.requestedSettings).length
      : -1
  const statusConsistent =
    value.activeForPlanning === (value.status === 'applied_to_next_plan')
    && value.draftPlanInvalidated === (value.status !== 'not_applied')
    && (
      value.status !== 'waiting_for_setup_confirmation'
      || requiredConfirmationCount > 0
    )
    && (
      value.status !== 'not_applied'
      || (
        unsupportedRequestCount === 1
        && requestedSettingCount === 0
      )
    )
  return statusValid
    && typeof value.activeForPlanning === 'boolean'
    && settingsValid
    && requiredConfirmationsValid
    && unsupportedValid
    && statusConsistent
    && typeof value.draftPlanInvalidated === 'boolean'
    && value.executionStarted === false
    && value.creditsReservedOrSpent === false
}

function validAssistantRuntime(value: unknown): boolean {
  if (!exactObjectSubset(value, [
    'source',
    'status',
    'routeId',
    'providerModel',
    'credentialSource',
    'credentialVersion',
    'providerCallMade',
    'modelCallMade',
    'attemptDigestSha256',
    'usage',
  ])) return false
  if (
    value.source !== 'kimi_k3'
    || ![
      'completed',
      'credential_unavailable',
      'credential_rejected',
      'model_unavailable',
      'rate_limited',
      'invalid_response',
      'provider_failed',
      'outcome_unknown',
    ].includes(String(value.status))
    || value.routeId !== 'kimi_k3_primary'
    || value.providerModel !== 'kimi-k3'
    || value.credentialSource !== 'google_secret_manager_pinned_version'
    || !(
      value.credentialVersion === null
      || (
        Number.isInteger(value.credentialVersion)
        && Number(value.credentialVersion) > 0
      )
    )
    || typeof value.providerCallMade !== 'boolean'
    || typeof value.modelCallMade !== 'boolean'
    || !sha256(value.attemptDigestSha256)
    || (value.modelCallMade && !value.providerCallMade)
  ) return false
  const usageValid = value.usage === undefined || (
    exactObject(value.usage, [
      'promptTokens',
      'completionTokens',
      'totalTokens',
    ])
    && Number.isInteger(value.usage.promptTokens)
    && Number(value.usage.promptTokens) >= 0
    && Number.isInteger(value.usage.completionTokens)
    && Number(value.usage.completionTokens) >= 0
    && Number.isInteger(value.usage.totalTokens)
    && Number(value.usage.totalTokens) >= 0
    && Number(value.usage.promptTokens)
      + Number(value.usage.completionTokens)
      === Number(value.usage.totalTokens)
  )
  if (!usageValid) return false
  return value.status === 'completed'
    ? value.providerCallMade
      && value.modelCallMade
      && value.credentialVersion !== null
      && value.usage !== undefined
    : value.usage === undefined
}

function validAssistantRuntimeEffect(
  runtime: unknown,
  effect: unknown,
): boolean {
  if (!effect || typeof effect !== 'object' || Array.isArray(effect)) {
    return false
  }
  const status = (effect as Record<string, unknown>).status
  if (runtime === undefined) {
    return status !== 'waiting_for_ai_response'
  }
  if (!validAssistantRuntime(runtime)) return false
  const runtimeStatus = (runtime as { readonly status: string }).status
  return runtimeStatus === 'completed'
    ? status !== 'waiting_for_ai_response'
    : status === 'waiting_for_ai_response'
}

function validRequestedSettings(value: unknown): boolean {
  if (!exactObjectSubset(value, [
      'aspectRatio',
      'cleanupPreference',
      'visualPreference',
      'workflowType',
      'moodStyle',
      'creditPreference',
      'targetPlatform',
  ])) return false
  return optionalEnum(value, 'aspectRatio', [
    '9:16', '16:9', '1:1', '4:5', '4:3',
  ])
    && optionalEnum(value, 'cleanupPreference', [
      'preserve_natural',
      'light_cleanup',
      'balanced_cleanup',
      'tight_retention_cleanup',
      'aggressive_cleanup',
      'documentary_faithful',
      'tutorial_complete',
      'custom',
    ])
    && optionalEnum(value, 'visualPreference', [
      'let_ai_decide',
      'keep_visuals_minimal',
      'balanced_visual_mix',
      'more_stroke_motion',
      'more_graphic_design',
      'real_motion_if_useful',
      'no_extra_visuals',
    ])
    && optionalEnum(value, 'workflowType', [
      'simple_clean_edit',
      'social_short_viral_clip',
      'talking_head_personal_brand',
      'podcast_clip',
      'vlog_lifestyle',
      'product_demo',
      'real_estate_property_tour',
      'education_explainer',
      'marketing_ad',
      'testimonial_case_study',
      'custom_let_ai_decide',
    ])
    && optionalEnum(value, 'moodStyle', [
      'clean',
      'premium',
      'cinematic',
      'energetic',
      'emotional',
      'educational',
      'luxury',
      'funny_playful',
      'corporate',
      'viral_fast_paced',
      'let_ai_decide',
    ])
    && optionalEnum(value, 'creditPreference', [
      'low_credit_cost',
      'balanced',
      'premium_best_result',
      'let_ai_estimate',
    ])
    && optionalEnum(value, 'targetPlatform', [
      'tiktok_reels_shorts',
      'youtube',
      'website',
      'course_training',
      'client_review',
      'custom',
    ])
}

function optionalEnum(
  value: Record<string, unknown>,
  key: string,
  options: readonly string[],
): boolean {
  return value[key] === undefined || options.includes(String(value[key]))
}

function classifyFailure(response: {
  readonly statusCode: number
  readonly error?: { readonly code: string; readonly message: string }
  readonly warnings: readonly string[]
}): CanonicalSourceLedChatClientResult {
  const code = response.error?.code
  if (
    response.statusCode === 401
    || response.statusCode === 403
    || code === 'AUTH_REQUIRED'
    || code === 'AUTH_INVALID'
    || code === 'WORKSPACE_ACCESS_DENIED'
  ) {
    return failure(
      'access_denied',
      'This signed-in workspace cannot use Chat for this edit.',
      false,
      response.warnings,
    )
  }
  if (
    response.statusCode === 400
    || response.statusCode === 409
    || response.statusCode === 422
  ) {
    return failure(
      'blocked',
      response.error?.message ?? 'This message cannot change the current edit safely.',
      false,
      response.warnings,
    )
  }
  return failure(
    'unavailable',
    response.error?.message
      ?? 'The message was not saved. Retry when the private backend is available.',
    true,
    response.warnings,
  )
}

function failure(
  status: Exclude<CanonicalSourceLedChatClientResult, { ok: true }>['status'],
  message: string,
  retryable: boolean,
  warnings: readonly string[] = [],
): CanonicalSourceLedChatClientResult {
  return { ok: false, status, retryable, message, warnings }
}

function apiContext(input: {
  readonly scope: ProjectPersistenceScope
  readonly projectId: string
}) {
  return {
    workspaceId: input.scope.workspaceId,
    projectId: input.projectId,
    userId: input.scope.backendUserId ?? input.scope.userId,
  }
}

function invalidateScopeIfRequired(
  scope: ProjectPersistenceScope,
  response: Parameters<typeof apiResponseInvalidatesProjectPersistenceScope>[0],
): void {
  if (apiResponseInvalidatesProjectPersistenceScope(response)) {
    invalidateProjectPersistenceScope(scope)
  }
}

function exactObject(
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function exactObjectSubset(
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.keys(value).every((key) => keys.includes(key))
}

function safeId(value: unknown): value is string {
  return typeof value === 'string'
    && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(value)
    && !value.includes('..')
}

function sha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function validIso(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}
