import type {
  QwenMarkerChatRuntimeRequest,
  QwenMarkerChatRuntimeValidationResult,
  QwenRuntimeConfig,
} from '../../types'
import { createQwenRuntimeSafetyFlags } from './qwen-runtime-config-service'
import { isPreferenceApplicationDownstreamContextValid } from '../../lib/edit-reference-downstream-context'

export function validateQwenMarkerChatRuntimeRequest(request: QwenMarkerChatRuntimeRequest): QwenMarkerChatRuntimeValidationResult {
  const errors: string[] = []
  if (!request.projectId) errors.push('projectId is required.')
  if (!request.editSessionId) errors.push('editSessionId is required.')
  if (!request.briefId) errors.push('briefId is required.')
  if (!request.markerId) errors.push('markerId is required.')
  if (!request.messageText.trim()) errors.push('messageText is required.')
  if (request.runtimeMode !== 'qwen_beta') errors.push('runtimeMode must be qwen_beta.')
  if (request.preferenceApplicationContext && !isPreferenceApplicationDownstreamContextValid(
    request.preferenceApplicationContext,
    { projectId: request.projectId, editSessionId: request.editSessionId },
  )) errors.push('preferenceApplicationContext is invalid or does not match this edit session.')
  return {
    ...createQwenRuntimeSafetyFlags(),
    ok: errors.length === 0,
    errors,
    warnings: ['Qwen Marker Chat runtime validation is backend-only.'],
  }
}

export function validateQwenRuntimeConfigForBeta(config: QwenRuntimeConfig): QwenMarkerChatRuntimeValidationResult {
  const errors = config.status === 'ready_for_secret_resolution' && config.runtimeMode === 'beta_enabled'
    ? []
    : [`Qwen beta runtime config is not ready: ${config.status}.`]
  return {
    ...createQwenRuntimeSafetyFlags(),
    ok: errors.length === 0,
    errors,
    warnings: config.warnings,
  }
}

export function assertQwenRuntimeNoProductionEffects(flags: Partial<{
  supabaseCommandRun: boolean
  renderJobCreated: boolean
  workerJobCreated: boolean
  mediaProcessingStarted: boolean
  fileBytesRead: boolean
  externalUrlFetched: boolean
  creditReservedOrSpent: boolean
}>): QwenMarkerChatRuntimeValidationResult {
  const errors = Object.entries(flags)
    .filter(([, value]) => value === true)
    .map(([key]) => `${key} must remain false.`)
  return {
    ...createQwenRuntimeSafetyFlags(),
    ok: errors.length === 0,
    errors,
    warnings: ['Qwen beta runtime may call Qwen only; production execution side effects remain blocked.'],
  }
}
