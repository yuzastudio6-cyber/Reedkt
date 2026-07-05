import { createHash } from 'node:crypto'
import type {
  ProjectEditBriefMarkerConfirmationRecord,
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  ProjectEditBriefMarkerRecord,
  QwenMarkerChatBridgeResult,
  QwenRuntimeSafetyFlags,
} from '../../types'
import { createMockDatabase, type MockDatabase } from '../mock/mock-database'
import { createMockProjectEditBriefRepository } from '../repositories/mock-project-edit-brief-repository'
import type { ProjectEditBriefRepository } from '../repositories/project-edit-brief-repository'
import { createQwenRuntimeSafetyFlags, loadQwenRuntimeConfig } from './qwen-runtime-config-service'
import { runQwenMarkerChatBridge } from './qwen-marker-chat-bridge-service'
import { createQwenSecretResolutionPublicDiagnostic, resolveQwenDirectEnvSecretValue, resolveQwenSecretManagerValue } from './qwen-secret-manager-resolver'
import { redactQwenRuntimeLogPayload } from './qwen-secret-redaction-service'

export const QWEN_LIVE_BETA_MARKER_CHAT_ROUTE_PATH = '/v1/project-edit-brief/marker-messages'
export const QWEN_LIVE_BETA_READINESS_ROUTE_PATH = '/v1/qwen-beta/readiness'

export type QwenLiveBetaDoctorStatus =
  | 'ready_live_beta'
  | 'blocked_missing_project_config'
  | 'blocked_missing_secret_reference'
  | 'blocked_secret_access_denied'
  | 'blocked_missing_endpoint'
  | 'blocked_missing_model_id'
  | 'blocked_runtime_disabled'
  | 'blocked_frontend_boundary'
  | 'failed_redaction_check'

export type QwenLiveMarkerChatRuntimeSource = 'qwen_live' | 'deterministic_fallback'

export interface QwenLiveMarkerChatRequest {
  workspaceId?: string
  userId?: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  messageText: string
  aiMode?: string
  requestId?: string
  idempotencyKey?: string
}

export interface QwenLiveMarkerChatRouteResponse {
  routeId: 'project.editBrief.markerMessages.append'
  requestId: string
  ok: boolean
  message?: ProjectEditBriefMarkerMessageRecord
  assistantMessage?: ProjectEditBriefMarkerMessageRecord
  intent?: ProjectEditBriefMarkerIntentRecord
  confirmation?: ProjectEditBriefMarkerConfirmationRecord
  marker?: ProjectEditBriefMarkerRecord
  runtimeSource: QwenLiveMarkerChatRuntimeSource
  fallbackUsed: boolean
  fallbackReason?: string
  idempotency: {
    key: string
    replayed: boolean
    pendingDuplicate: boolean
    staleResponseDiscarded: boolean
  }
  qwenRuntime: {
    ok: boolean
    status: QwenMarkerChatBridgeResult['status']
    runtimeStatus: QwenMarkerChatBridgeResult['runtimeStatus']
    fallbackStatus: QwenMarkerChatBridgeResult['fallbackStatus']
    runtimeSource: QwenLiveMarkerChatRuntimeSource
    providerCallMade: boolean
    modelCallMade: boolean
    qwenCallMade: boolean
    secretValuePrinted: false
    secretSentToFrontend: false
    authorizationHeaderLogged: false
    plannerExecuted: false
    editPlanCreated: false
    creditReservedOrSpent: false
    usage: QwenMarkerChatBridgeResult['usage']
    publicSummary: string
    warnings: string[]
  }
  safety: QwenRuntimeSafetyFlags
  warnings: string[]
  mockOnly: boolean
  providerCallMade: false
  supabaseWriteMade: boolean
  generationRequestCreated: false
  renderJobCreated: false
  workerJobCreated: false
  creditReservedOrSpent: false
}

type IdempotencyRecord =
  | { state: 'pending'; startedAt: number }
  | { state: 'completed'; response: QwenLiveMarkerChatRouteResponse }

const databases = new Map<string, MockDatabase>()
const idempotency = new Map<string, IdempotencyRecord>()
const latestRequestByMarker = new Map<string, string>()
const rateLimitHits = new Map<string, number[]>()

function clean(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function nowIso() {
  return new Date().toISOString()
}

function hashBody(input: unknown): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 16)
}

function contextKey(input: Pick<QwenLiveMarkerChatRequest, 'workspaceId' | 'projectId' | 'userId'>): string {
  return [
    input.workspaceId ?? 'local-beta-workspace',
    input.projectId,
    input.userId ?? 'local-beta-user',
  ].join(':')
}

function markerKey(input: Pick<QwenLiveMarkerChatRequest, 'workspaceId' | 'userId' | 'projectId' | 'editSessionId' | 'markerId'>): string {
  return [
    input.workspaceId ?? 'local-beta-workspace',
    input.userId ?? 'local-beta-user',
    input.projectId,
    input.editSessionId,
    input.markerId,
  ].join(':')
}

function idempotencyKey(input: QwenLiveMarkerChatRequest): string {
  return [
    markerKey(input),
    input.idempotencyKey ?? hashBody({
      messageText: input.messageText,
      markerId: input.markerId,
      requestId: input.requestId,
    }),
  ].join(':')
}

function repositoryFor(input: QwenLiveMarkerChatRequest) {
  const key = contextKey(input)
  let db = databases.get(key)
  if (!db) {
    db = createMockDatabase()
    databases.set(key, db)
  }
  return createMockProjectEditBriefRepository({
    db,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
  })
}

function rateLimit(input: QwenLiveMarkerChatRequest, env: Record<string, string | undefined>) {
  const max = Number.parseInt(env.QWEN_BETA_MARKER_CHAT_RATE_LIMIT_MAX ?? '5', 10)
  const windowMs = Number.parseInt(env.QWEN_BETA_MARKER_CHAT_RATE_LIMIT_WINDOW_MS ?? '600000', 10)
  const key = markerKey(input)
  const now = Date.now()
  const active = (rateLimitHits.get(key) ?? []).filter((hit) => now - hit < windowMs)
  if (active.length >= Math.max(1, max)) {
    rateLimitHits.set(key, active)
    return { allowed: false, count: active.length, max: Math.max(1, max), windowMs }
  }
  active.push(now)
  rateLimitHits.set(key, active)
  return { allowed: true, count: active.length, max: Math.max(1, max), windowMs }
}

function routeRuntimeSource(bridge: QwenMarkerChatBridgeResult): QwenLiveMarkerChatRuntimeSource {
  return bridge.status === 'qwen_beta_completed' && bridge.qwenCallMade && bridge.fallbackStatus === 'not_needed'
    ? 'qwen_live'
    : 'deterministic_fallback'
}

function shapeResponse(input: {
  request: QwenLiveMarkerChatRequest
  requestId: string
  bridge: QwenMarkerChatBridgeResult
  idempotencyKey: string
  mockOnly?: boolean
  supabaseWriteMade?: boolean
  replayed?: boolean
  pendingDuplicate?: boolean
  staleResponseDiscarded?: boolean
  fallbackReason?: string
  extraWarnings?: string[]
}): QwenLiveMarkerChatRouteResponse {
  const runtimeSource = routeRuntimeSource(input.bridge)
  const fallbackUsed = runtimeSource !== 'qwen_live'
  return {
    routeId: 'project.editBrief.markerMessages.append',
    requestId: input.requestId,
    ok: input.bridge.ok,
    message: input.bridge.userMessage,
    assistantMessage: input.bridge.assistantMessage,
    intent: input.bridge.intent,
    confirmation: input.bridge.confirmation,
    marker: input.bridge.updatedMarker,
    runtimeSource,
    fallbackUsed,
    fallbackReason: fallbackUsed ? input.fallbackReason ?? input.bridge.status : undefined,
    idempotency: {
      key: input.idempotencyKey,
      replayed: input.replayed ?? false,
      pendingDuplicate: input.pendingDuplicate ?? false,
      staleResponseDiscarded: input.staleResponseDiscarded ?? input.bridge.status === 'failed_safe',
    },
    qwenRuntime: {
      ok: input.bridge.ok,
      status: input.bridge.status,
      runtimeStatus: input.bridge.runtimeStatus,
      fallbackStatus: input.bridge.fallbackStatus,
      runtimeSource,
      providerCallMade: input.bridge.providerCallMade,
      modelCallMade: input.bridge.modelCallMade,
      qwenCallMade: input.bridge.qwenCallMade,
      secretValuePrinted: false,
      secretSentToFrontend: false,
      authorizationHeaderLogged: false,
      plannerExecuted: false,
      editPlanCreated: false,
      creditReservedOrSpent: false,
      usage: input.bridge.usage,
      publicSummary: input.bridge.publicSummary,
      warnings: input.bridge.warnings,
    },
    safety: createQwenRuntimeSafetyFlags(),
    warnings: [
      ...input.bridge.warnings,
      ...(input.extraWarnings ?? []),
      'Browser response is sanitized: no provider key, Secret Manager value, Authorization header, raw credential, service account, raw provider payload, or hidden reasoning is returned.',
    ],
    mockOnly: input.mockOnly ?? true,
    providerCallMade: false,
    supabaseWriteMade: input.supabaseWriteMade ?? false,
    generationRequestCreated: false,
    renderJobCreated: false,
    workerJobCreated: false,
    creditReservedOrSpent: false,
  }
}

function pendingResponse(requestId: string, key: string): QwenLiveMarkerChatRouteResponse {
  const usage = {
    providerUsageReturned: false,
    usageEstimated: false,
    creditReservedOrSpent: false as const,
    notes: ['Duplicate request is already pending; no second Qwen provider call was started.'],
  }
  return {
    routeId: 'project.editBrief.markerMessages.append',
    requestId,
    ok: false,
    runtimeSource: 'deterministic_fallback',
    fallbackUsed: true,
    fallbackReason: 'duplicate_request_pending',
    idempotency: {
      key,
      replayed: false,
      pendingDuplicate: true,
      staleResponseDiscarded: false,
    },
    qwenRuntime: {
      ok: false,
      status: 'failed_safe',
      runtimeStatus: 'not_attempted',
      fallbackStatus: 'deterministic_fallback_used',
      runtimeSource: 'deterministic_fallback',
      providerCallMade: false,
      modelCallMade: false,
      qwenCallMade: false,
      secretValuePrinted: false,
      secretSentToFrontend: false,
      authorizationHeaderLogged: false,
      plannerExecuted: false,
      editPlanCreated: false,
      creditReservedOrSpent: false,
      usage,
      publicSummary: 'Duplicate Qwen beta Marker Chat request is pending.',
      warnings: ['No duplicate provider call was started.'],
    },
    safety: createQwenRuntimeSafetyFlags(),
    warnings: ['Duplicate request is pending; no provider call or persistence occurred for this duplicate.'],
    mockOnly: true,
    providerCallMade: false,
    supabaseWriteMade: false,
    generationRequestCreated: false,
    renderJobCreated: false,
    workerJobCreated: false,
    creditReservedOrSpent: false,
  }
}

export async function runQwenLiveMarkerChatRoute(input: {
  request: QwenLiveMarkerChatRequest
  env?: Record<string, string | undefined>
  repository?: ProjectEditBriefRepository
  rateLimitAlreadyChecked?: boolean
}): Promise<QwenLiveMarkerChatRouteResponse> {
  const env = input.env ?? process.env
  const requestId = clean(input.request.requestId) ?? `qwen-live-beta-${Date.now().toString(36)}`
  const request: QwenLiveMarkerChatRequest = {
    ...input.request,
    requestId,
    workspaceId: clean(input.request.workspaceId) ?? 'local-beta-workspace',
    userId: clean(input.request.userId) ?? 'local-beta-user',
  }
  const key = idempotencyKey(request)
  const existing = idempotency.get(key)
  if (existing?.state === 'completed') {
    return {
      ...existing.response,
      idempotency: {
        ...existing.response.idempotency,
        replayed: true,
      },
      warnings: [
        ...existing.response.warnings,
        'Idempotency replay returned the first completed sanitized response without a second provider call.',
      ],
    }
  }
  if (existing?.state === 'pending') return pendingResponse(requestId, key)

  idempotency.set(key, { state: 'pending', startedAt: Date.now() })
  const latestKey = markerKey(request)
  latestRequestByMarker.set(latestKey, requestId)
  const repository = input.repository ?? repositoryFor(request)
  const forceFallback = clean(env.REEDITPRO_FORCE_QWEN_MARKER_CHAT_FALLBACK) === 'true' || clean(env.REEDITPRO_FORCE_QWEN_MARKER_CHAT_FALLBACK) === '1'
  const limit = input.rateLimitAlreadyChecked
    ? { allowed: true, count: 1, max: 1, windowMs: 0 }
    : rateLimit(request, env)
  const bridge = await runQwenMarkerChatBridge({
    repository,
    request: {
      id: requestId,
      source: 'backend_route',
      projectId: request.projectId,
      editSessionId: request.editSessionId,
      briefId: request.briefId,
      markerId: request.markerId,
      messageText: request.messageText,
    },
    env: limit.allowed && !forceFallback ? env : {},
    beforePersistProviderResponse: (runtimeRequest) => latestRequestByMarker.get(latestKey) !== runtimeRequest.id,
  })
  const response = shapeResponse({
    request,
    requestId,
    bridge,
    idempotencyKey: key,
    mockOnly: repository.context.mockOnly,
    supabaseWriteMade: !repository.context.mockOnly && Boolean(bridge.userMessage),
    fallbackReason: forceFallback ? 'forced_deterministic_fallback' : limit.allowed ? undefined : 'beta_rate_limited',
    staleResponseDiscarded: bridge.status === 'failed_safe',
    extraWarnings: [
      ...(forceFallback ? ['Qwen Marker Chat live provider is disabled by rollback policy; deterministic fallback was used.'] : []),
      ...(limit.allowed ? [] : [`Qwen beta rate limit reached for marker scope (${limit.count}/${limit.max} in ${limit.windowMs}ms).`]),
    ],
  })
  idempotency.set(key, { state: 'completed', response })
  return response
}

export async function createQwenLiveBetaDoctorReport(input: {
  env?: Record<string, string | undefined>
  checkFrontendBoundary?: () => Promise<boolean> | boolean
} = {}) {
  const env = input.env ?? process.env
  const config = loadQwenRuntimeConfig(env)
  const syntheticToken = ['sk', 'live', 'beta', 'doctor', 'redacted'].join('-')
  const redaction = redactQwenRuntimeLogPayload(`Authorization: Bearer ${syntheticToken}`)
  let status: QwenLiveBetaDoctorStatus = 'ready_live_beta'
  const checks: Record<string, boolean> = {
    runtimeEnabled: config.runtimeMode === 'beta_enabled',
    googleProjectConfigured: config.projectIdConfigured,
    apiKeyDirectEnvConfigured: config.apiKeyDirectEnvConfigured,
    apiKeyConfigured: config.apiKeyConfigured,
    apiKeySecretReferenceConfigured: Boolean(config.apiKeySecretReferenceName),
    endpointConfigured: config.baseUrlConfigured,
    modelConfigured: config.modelIdConfigured,
    redactionActive: redaction.inputContainedSecretLikeValue && !redaction.redactedText.includes(syntheticToken),
    frontendBoundaryIntact: input.checkFrontendBoundary ? Boolean(await input.checkFrontendBoundary()) : true,
  }

  let apiKeyDiagnostic
  if (checks.runtimeEnabled && config.apiKeyDirectEnvConfigured) {
    apiKeyDiagnostic = createQwenSecretResolutionPublicDiagnostic(resolveQwenDirectEnvSecretValue({
      symbolicName: 'QWEN_REASONING_API_KEY',
      value: env.QWEN_REASONING_API_KEY,
    }))
    checks.apiKeySecretResolvable = apiKeyDiagnostic.status === 'resolved_no_print'
  } else if (checks.runtimeEnabled && checks.googleProjectConfigured && checks.apiKeySecretReferenceConfigured) {
    apiKeyDiagnostic = createQwenSecretResolutionPublicDiagnostic(await resolveQwenSecretManagerValue({
      symbolicName: 'QWEN_REASONING_API_KEY_SECRET',
      referenceName: config.apiKeySecretReferenceName,
      env,
    }))
    checks.apiKeySecretResolvable = apiKeyDiagnostic.status === 'resolved_no_print'
  } else {
    checks.apiKeySecretResolvable = false
  }

  if (!checks.runtimeEnabled) status = 'blocked_runtime_disabled'
  else if (!checks.googleProjectConfigured && !config.apiKeyDirectEnvConfigured) status = 'blocked_missing_project_config'
  else if (!checks.apiKeyConfigured) status = 'blocked_missing_secret_reference'
  else if (!checks.apiKeySecretResolvable) status = 'blocked_secret_access_denied'
  else if (!checks.endpointConfigured) status = 'blocked_missing_endpoint'
  else if (!checks.modelConfigured) status = 'blocked_missing_model_id'
  else if (!checks.redactionActive) status = 'failed_redaction_check'
  else if (!checks.frontendBoundaryIntact) status = 'blocked_frontend_boundary'

  return {
    status,
    ready: status === 'ready_live_beta',
    config: {
      providerName: config.providerName,
      runtimeMode: config.runtimeMode,
      configStatus: config.status,
      transportProfile: config.transportProfile,
      requestPath: config.requestPath,
      timeoutMs: config.timeoutMs,
      maxRetries: config.maxRetries,
      projectIdConfigured: config.projectIdConfigured,
      apiKeyConfigured: config.apiKeyConfigured,
      apiKeyDirectEnvConfigured: config.apiKeyDirectEnvConfigured,
      apiKeySecretReferenceConfigured: Boolean(config.apiKeySecretReferenceName),
      baseUrlConfigured: config.baseUrlConfigured,
      modelIdConfigured: config.modelIdConfigured,
    },
    checks,
    secretDiagnostics: apiKeyDiagnostic ? [apiKeyDiagnostic] : [],
    flags: {
      providerCallMade: false,
      qwenCallMade: false,
      secretValuePrinted: false,
      secretSentToFrontend: false,
      gcloudCommandRun: false,
      supabaseCommandRun: false,
      rawOutputStored: false,
      renderWorkerCreditEffects: false,
    },
    nextStep: status === 'ready_live_beta'
      ? 'Run smoke:qwen-live-provider and smoke:qwen-marker-chat-live.'
      : 'Fix the blocked Qwen beta runtime configuration before live provider verification.',
    generatedAt: nowIso(),
  }
}

export async function createQwenLiveBetaPublicReadinessReport(input: {
  env?: Record<string, string | undefined>
  checkFrontendBoundary?: () => Promise<boolean> | boolean
} = {}) {
  const report = await createQwenLiveBetaDoctorReport(input)
  return {
    doctor: 'qwen-beta-public-readiness',
    status: report.status,
    ready: report.ready,
    checks: report.checks,
    config: {
      providerName: report.config.providerName,
      runtimeMode: report.config.runtimeMode,
      configStatus: report.config.configStatus,
      transportProfile: report.config.transportProfile,
      requestPathConfigured: Boolean(report.config.requestPath),
      timeoutMs: report.config.timeoutMs,
      maxRetries: report.config.maxRetries,
      projectIdConfigured: report.config.projectIdConfigured,
      apiKeyConfigured: report.config.apiKeyConfigured,
      apiKeyDirectEnvConfigured: report.config.apiKeyDirectEnvConfigured,
      apiKeySecretReferenceConfigured: report.config.apiKeySecretReferenceConfigured,
      baseUrlConfigured: report.config.baseUrlConfigured,
      modelIdConfigured: report.config.modelIdConfigured,
    },
    secretDiagnostics: report.secretDiagnostics.map((diagnostic) => ({
      symbolicName: diagnostic.symbolicName,
      status: diagnostic.status,
      referenceNameConfigured: diagnostic.referenceNameConfigured,
      valueAccessed: diagnostic.valueAccessed,
      valuePrinted: false,
      warning: diagnostic.warning,
    })),
    flags: report.flags,
    warnings: [
      'Public Qwen beta readiness is sanitized: no Secret Manager value, secret resource name, provider key, Authorization header, raw provider payload, or hidden reasoning is returned.',
      report.ready
        ? 'Qwen beta readiness gates are satisfied; live provider verification smokes are still required before claiming user-visible live Qwen success.'
        : 'Qwen beta is not ready; Marker Chat should use local deterministic fallback.',
    ],
    nextStep: report.nextStep,
    generatedAt: report.generatedAt,
  }
}

export function resetQwenLiveBetaStateForTests(): void {
  databases.clear()
  idempotency.clear()
  latestRequestByMarker.clear()
  rateLimitHits.clear()
}
