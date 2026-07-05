import {
  REEDITPRO_QWEN_MAIN_BRAIN_LABEL,
  type QwenMarkerChatBridgeResult,
  type QwenProviderTransportResult,
  type QwenRuntimeConfig,
  type QwenSecretResolutionDiagnostic,
  type QwenStructuredResponseValidationResult,
} from '../../types'

export function createQwenRuntimeBetaSummary(config: QwenRuntimeConfig): string {
  return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta runtime ${config.status}; explicit mode ${config.runtimeMode}; provider ${config.providerName}; fallback deterministic_marker_chat.`
}

export function createQwenSecretManagerRuntimeSummary(diagnostic: QwenSecretResolutionDiagnostic): string {
  return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} Secret Manager ${diagnostic.status}; valueAccessed ${diagnostic.valueAccessed}; secretValuePrinted false; fingerprint ${diagnostic.redactedFingerprint ?? 'not available'}.`
}

export function createQwenProviderTransportSummary(result: QwenProviderTransportResult): string {
  return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} transport ${result.status}; qwenCallMade ${result.qwenCallMade}; providerCallMade ${result.providerCallMade}; authorizationHeaderLogged false.`
}

export function createQwenStructuredValidationSummary(result: QwenStructuredResponseValidationResult): string {
  return result.ok
    ? `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} structured Marker Chat response validated before persistence.`
    : `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} structured Marker Chat response blocked: ${result.status}.`
}

export function createQwenMarkerChatBridgeSummary(result: QwenMarkerChatBridgeResult): string {
  return `${result.status}; runtime ${result.runtimeStatus}; fallback ${result.fallbackStatus}; qwenCallMade ${result.qwenCallMade}; credits false; render false; workers false.`
}
