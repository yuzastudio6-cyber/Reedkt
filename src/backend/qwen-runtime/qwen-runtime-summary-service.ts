import type {
  QwenMarkerChatBridgeResult,
  QwenProviderTransportResult,
  QwenRuntimeConfig,
  QwenSecretResolutionDiagnostic,
  QwenStructuredResponseValidationResult,
} from '../../types'

export function createQwenRuntimeBetaSummary(config: QwenRuntimeConfig): string {
  return `Qwen beta runtime ${config.status}; explicit mode ${config.runtimeMode}; provider ${config.providerName}; fallback deterministic_marker_chat.`
}

export function createQwenSecretManagerRuntimeSummary(diagnostic: QwenSecretResolutionDiagnostic): string {
  return `Qwen Secret Manager ${diagnostic.status}; valueAccessed ${diagnostic.valueAccessed}; secretValuePrinted false; fingerprint ${diagnostic.redactedFingerprint ?? 'not available'}.`
}

export function createQwenProviderTransportSummary(result: QwenProviderTransportResult): string {
  return `Qwen transport ${result.status}; qwenCallMade ${result.qwenCallMade}; providerCallMade ${result.providerCallMade}; authorizationHeaderLogged false.`
}

export function createQwenStructuredValidationSummary(result: QwenStructuredResponseValidationResult): string {
  return result.ok
    ? 'Qwen structured Marker Chat response validated before persistence.'
    : `Qwen structured Marker Chat response blocked: ${result.status}.`
}

export function createQwenMarkerChatBridgeSummary(result: QwenMarkerChatBridgeResult): string {
  return `${result.status}; runtime ${result.runtimeStatus}; fallback ${result.fallbackStatus}; qwenCallMade ${result.qwenCallMade}; credits false; render false; workers false.`
}
