import type {
  ProjectEditBriefMarkerIntentRecord,
  ProjectEditBriefMarkerMessageRecord,
  QwenMarkerChatBridgeResult,
  QwenMarkerChatRuntimeRequest,
  QwenProviderTransportRequest,
  QwenRuntimeConfig,
} from '../../types'
import type { ProjectEditBriefRepository } from '../repositories/project-edit-brief-repository'
import { createQwenProviderClient, type QwenProviderClient } from './qwen-provider-client'
import { createQwenMarkerChatPromptPackage } from './qwen-marker-chat-prompt-service'
import { createQwenMarkerChatIntentDraft, markerStatusFromQwenResponse } from './qwen-marker-chat-response-service'
import { createQwenRuntimeSafetyFlags, loadQwenRuntimeConfig } from './qwen-runtime-config-service'
import { applyQwenMarkerChatDeterministicFallback } from './qwen-runtime-fallback-service'
import { createQwenMarkerChatBridgeSummary } from './qwen-runtime-summary-service'
import { createQwenRuntimeUsageRecord } from './qwen-runtime-usage-service'
import { validateQwenMarkerChatRuntimeRequest } from './qwen-runtime-validation-service'
import { createQwenSecretResolutionPublicDiagnostic, resolveQwenDirectEnvSecretValue, resolveQwenSecretManagerValue } from './qwen-secret-manager-resolver'
import { validateQwenMarkerChatStructuredResponse } from './qwen-structured-response-service'

function createRequest(input: Omit<QwenMarkerChatRuntimeRequest, 'id' | 'createdAt' | 'runtimeMode'> & Partial<Pick<QwenMarkerChatRuntimeRequest, 'id' | 'createdAt' | 'runtimeMode'>>): QwenMarkerChatRuntimeRequest {
  return {
    id: input.id ?? `qwen-marker-chat-runtime-${Date.now().toString(36)}`,
    source: input.source,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    briefId: input.briefId,
    markerId: input.markerId,
    messageText: input.messageText,
    preferenceApplicationContext: input.preferenceApplicationContext,
    runtimeMode: 'qwen_beta',
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
}

function blockedValidation(request: QwenMarkerChatRuntimeRequest, config: QwenRuntimeConfig, errors: string[]): QwenMarkerChatBridgeResult {
  const validation = validateQwenMarkerChatStructuredResponse(undefined)
  const promptPackage = {
    ...createQwenRuntimeSafetyFlags(),
    id: `qwen-marker-chat-prompt-blocked-${request.id}`,
    markerId: request.markerId,
    systemPrompt: '',
    userPrompt: '',
    schemaName: 'QwenMarkerChatStructuredResponse' as const,
    includedContext: [],
    excludedContext: ['secret values', 'provider headers', 'raw media'],
  }
  const usage = createQwenRuntimeUsageRecord({ promptText: request.messageText })
  return {
    ...createQwenRuntimeSafetyFlags(),
    ok: false,
    status: 'blocked_validation',
    runtimeStatus: 'deterministic_fallback_used',
    fallbackStatus: 'deterministic_fallback_used',
    config,
    request,
    promptPackage,
    validation: { ...validation, errors },
    usage,
    warnings: errors,
    publicSummary: 'Qwen Marker Chat beta request failed validation before provider call.',
  }
}

async function saveQwenResponse(input: {
  repository: ProjectEditBriefRepository
  request: QwenMarkerChatRuntimeRequest
  userMessage: ProjectEditBriefMarkerMessageRecord
  response: NonNullable<ReturnType<typeof validateQwenMarkerChatStructuredResponse>['response']>
}): Promise<{
  assistantMessage?: ProjectEditBriefMarkerMessageRecord
  intent?: ProjectEditBriefMarkerIntentRecord
  updatedMarker?: QwenMarkerChatBridgeResult['updatedMarker']
  confirmation?: QwenMarkerChatBridgeResult['confirmation']
}> {
  const marker = (await input.repository.getMarker(input.request.markerId)).data
  if (!marker) return {}
  const intent = (await input.repository.saveMarkerIntent({
    projectId: marker.projectId,
    editSessionId: marker.editSessionId,
    briefId: marker.briefId,
    markerId: marker.id,
    intent: createQwenMarkerChatIntentDraft({
      marker,
      response: input.response,
      userMessageId: input.userMessage.id,
    }),
  })).data
  const assistantMessage = (await input.repository.appendMarkerMessage({
    projectId: marker.projectId,
    editSessionId: marker.editSessionId,
    briefId: marker.briefId,
    markerId: marker.id,
    message: {
      role: 'assistant',
      kind: input.response.status === 'needs_clarification' ? 'clarification_question' : input.response.status === 'confirmed' ? 'confirmation' : 'intent_update',
      text: input.response.clarificationQuestion ?? input.response.assistantMessage,
      relatedIntentId: intent?.id,
      metadata: {
        source: 'rp_qwen_beta_01_marker_chat',
        qwenStructuredResponseValidated: true,
        suggestions: input.response.suggestions ?? [],
        safetyWarnings: input.response.safetyWarnings,
        scopedToMarkerOnly: true,
        ...createQwenRuntimeSafetyFlags({ providerCallMade: true, modelCallMade: true, qwenCallMade: true }),
      },
    },
  })).data
  const confirmation = intent && input.response.status === 'confirmed'
    ? (await input.repository.saveMarkerConfirmation({
        projectId: marker.projectId,
        editSessionId: marker.editSessionId,
        briefId: marker.briefId,
        markerId: marker.id,
        intentId: intent.id,
        summary: input.response.assistantMessage,
        confirmedByUser: false,
        aiMode: marker.aiMode,
        metadata: {
          source: 'rp_qwen_beta_01_marker_chat',
          qwenStructuredResponseValidated: true,
        },
      })).data
    : undefined
  const updatedMarker = (await input.repository.updateMarker({
    markerId: marker.id,
    patch: {
      status: markerStatusFromQwenResponse(input.response),
      intentId: intent?.id ?? marker.intentId,
      metadata: {
        ...(marker.metadata ?? {}),
        qwenBetaMarkerChat: true,
        noPlannerExecution: true,
        noRenderWorkerCredit: true,
      },
    },
  })).data
  return { assistantMessage, intent, confirmation, updatedMarker }
}

export async function runQwenMarkerChatBridge(input: {
  repository: ProjectEditBriefRepository
  request: Omit<QwenMarkerChatRuntimeRequest, 'id' | 'createdAt' | 'runtimeMode'> & Partial<Pick<QwenMarkerChatRuntimeRequest, 'id' | 'createdAt'>>
  env?: Record<string, string | undefined>
  providerClient?: QwenProviderClient
  secretClient?: Parameters<typeof resolveQwenSecretManagerValue>[0]['client']
  beforePersistProviderResponse?: (request: QwenMarkerChatRuntimeRequest) => boolean
}): Promise<QwenMarkerChatBridgeResult> {
  const request = createRequest(input.request)
  const env = input.env ?? process.env
  const config = loadQwenRuntimeConfig(env)
  const requestValidation = validateQwenMarkerChatRuntimeRequest(request)
  if (!requestValidation.ok) return blockedValidation(request, config, requestValidation.errors)

  const drawer = (await input.repository.createMarkerDrawerModel(request.markerId)).data
  if (!drawer) return blockedValidation(request, config, ['Marker drawer was not found.'])
  const markerDrawer = drawer
  const userMessage = (await input.repository.appendMarkerMessage({
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    briefId: request.briefId,
    markerId: request.markerId,
    message: {
      role: 'user',
      kind: 'note',
      text: request.messageText.trim(),
      metadata: {
        source: 'rp_qwen_beta_01_marker_chat',
        runtimeMode: 'qwen_beta',
        scopedToMarkerOnly: true,
        ...(request.preferenceApplicationContext ? {
          preferenceApplicationContext: request.preferenceApplicationContext,
          preferenceApplicationId: request.preferenceApplicationContext.applicationId,
          preferenceApplicationContextHash: request.preferenceApplicationContext.packageHash,
        } : {}),
      },
    },
  })).data
  if (!userMessage) return blockedValidation(request, config, ['User marker message could not be saved.'])
  const savedUserMessage = userMessage

  const exportSettings = (await input.repository.getExportSettings(request.editSessionId)).data
  const promptPackage = createQwenMarkerChatPromptPackage({ request, drawer: markerDrawer, exportSettings })
  const providerClient = input.providerClient ?? createQwenProviderClient()

  async function fallback(reason: string, qwenFlags = createQwenRuntimeSafetyFlags()): Promise<QwenMarkerChatBridgeResult> {
    const fallbackResult = await applyQwenMarkerChatDeterministicFallback({
      repository: input.repository,
      marker: markerDrawer.marker,
      userMessage: savedUserMessage,
      reason,
    })
    const validation = validateQwenMarkerChatStructuredResponse(undefined)
    const usage = createQwenRuntimeUsageRecord({
      promptText: `${promptPackage.systemPrompt}\n${promptPackage.userPrompt}`,
      responseText: fallbackResult.assistantMessage?.text,
    })
    const result: QwenMarkerChatBridgeResult = {
      ...qwenFlags,
      ok: true,
      status: 'fallback_completed',
      runtimeStatus: 'deterministic_fallback_used',
      fallbackStatus: 'deterministic_fallback_used',
      config,
      request,
      promptPackage,
      drawer: markerDrawer,
      userMessage: savedUserMessage,
      assistantMessage: fallbackResult.assistantMessage,
      validation,
      intent: fallbackResult.intent,
      updatedMarker: fallbackResult.updatedMarker,
      usage,
      warnings: fallbackResult.warnings,
      publicSummary: 'Qwen Marker Chat used deterministic fallback safely.',
    }
    result.publicSummary = createQwenMarkerChatBridgeSummary(result)
    return result
  }

  if (config.status !== 'ready_for_secret_resolution' || config.runtimeMode !== 'beta_enabled') {
    return fallback(config.status)
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
        client: input.secretClient,
      })
  const publicSecretDiagnostic = createQwenSecretResolutionPublicDiagnostic(apiKey)
  if (!apiKey.value) return fallback(publicSecretDiagnostic.status)

  const baseUrl = env.QWEN_REASONING_BASE_URL
    ?? (config.baseUrlSecretReferenceName
      ? (await resolveQwenSecretManagerValue({
          symbolicName: 'QWEN_REASONING_BASE_URL_SECRET',
          referenceName: config.baseUrlSecretReferenceName,
          env,
          client: input.secretClient,
        })).value
      : undefined)
  const modelId = env.QWEN_REASONING_MODEL_ID
    ?? (config.modelIdSecretReferenceName
      ? (await resolveQwenSecretManagerValue({
          symbolicName: 'QWEN_REASONING_MODEL_ID_SECRET',
          referenceName: config.modelIdSecretReferenceName,
          env,
          client: input.secretClient,
        })).value
      : undefined)
  if (!baseUrl || !modelId) return fallback('blocked_missing_base_url_or_model_id')

  const transportRequest: QwenProviderTransportRequest = {
    profile: config.transportProfile,
    baseUrl,
    requestPath: config.requestPath,
    modelId,
    systemPrompt: promptPackage.systemPrompt,
    userPrompt: promptPackage.userPrompt,
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
  }
  const transport = await providerClient.sendStructuredMarkerChatRequest({
    request: transportRequest,
    apiKey: apiKey.value,
  })
  if (transport.status !== 'completed') {
    return fallback(transport.status, createQwenRuntimeSafetyFlags({
      providerCallMade: transport.providerCallMade,
      modelCallMade: transport.modelCallMade,
      qwenCallMade: transport.qwenCallMade,
    }))
  }
  const validation = validateQwenMarkerChatStructuredResponse(transport.parsedJson)
  if (!validation.ok || !validation.response) {
    return fallback(validation.status, createQwenRuntimeSafetyFlags({ providerCallMade: true, modelCallMade: true, qwenCallMade: true }))
  }
  if (input.beforePersistProviderResponse?.(request)) {
    const usage = createQwenRuntimeUsageRecord({
      providerUsage: transport.parsedJson && typeof transport.parsedJson === 'object' ? (transport.parsedJson as Record<string, unknown>).usage : undefined,
      promptText: `${promptPackage.systemPrompt}\n${promptPackage.userPrompt}`,
      responseText: validation.response.assistantMessage,
    })
    const result: QwenMarkerChatBridgeResult = {
      ...createQwenRuntimeSafetyFlags({ providerCallMade: true, modelCallMade: true, qwenCallMade: true }),
      ok: false,
      status: 'failed_safe',
      runtimeStatus: 'provider_response_valid',
      fallbackStatus: 'not_needed',
      config: { ...config, status: 'ready_for_provider_call' },
      request,
      promptPackage,
      drawer: markerDrawer,
      userMessage: savedUserMessage,
      validation,
      usage,
      warnings: [
        'Qwen beta response was valid but discarded because a newer marker request superseded it.',
        'No assistant message, marker intent, confirmation, or marker status update was persisted for the stale response.',
      ],
      publicSummary: 'Qwen Marker Chat beta response was discarded as stale before persistence.',
    }
    result.publicSummary = createQwenMarkerChatBridgeSummary(result)
    return result
  }
  const saved = await saveQwenResponse({
    repository: input.repository,
    request,
    userMessage: savedUserMessage,
    response: validation.response,
  })
  const usage = createQwenRuntimeUsageRecord({
    providerUsage: transport.parsedJson && typeof transport.parsedJson === 'object' ? (transport.parsedJson as Record<string, unknown>).usage : undefined,
    promptText: `${promptPackage.systemPrompt}\n${promptPackage.userPrompt}`,
    responseText: validation.response.assistantMessage,
  })
  const result: QwenMarkerChatBridgeResult = {
    ...createQwenRuntimeSafetyFlags({ providerCallMade: true, modelCallMade: true, qwenCallMade: true }),
    ok: true,
    status: 'qwen_beta_completed',
    runtimeStatus: 'provider_response_valid',
    fallbackStatus: 'not_needed',
    config: { ...config, status: 'ready_for_provider_call' },
    request,
    promptPackage,
    drawer: markerDrawer,
    userMessage: savedUserMessage,
    assistantMessage: saved.assistantMessage,
    structuredResponse: validation.response,
    validation,
    intent: saved.intent,
    confirmation: saved.confirmation,
    updatedMarker: saved.updatedMarker,
    usage,
    warnings: ['Qwen beta response validated and saved as marker-scoped metadata only.'],
    publicSummary: 'Qwen Marker Chat beta completed.',
  }
  result.publicSummary = createQwenMarkerChatBridgeSummary(result)
  return result
}
