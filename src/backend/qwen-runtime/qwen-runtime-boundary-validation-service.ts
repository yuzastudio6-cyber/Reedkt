import type {
  QwenRuntimeBoundaryCheck,
  QwenRuntimeBoundaryContext,
  QwenRuntimeBoundaryValidationCheckResult,
  QwenRuntimeBoundaryValidationResult,
  QwenRuntimeReadiness,
  QwenSecretReference,
} from '../../types'

function check(
  checkName: QwenRuntimeBoundaryCheck,
  passed: boolean,
  summary: string,
): QwenRuntimeBoundaryValidationCheckResult {
  return { check: checkName, passed, summary }
}

function validationResult(checks: QwenRuntimeBoundaryValidationCheckResult[], warnings: string[] = []): QwenRuntimeBoundaryValidationResult {
  const blockedReasons = checks.filter((item) => !item.passed).map((item) => item.summary)
  return {
    ok: blockedReasons.length === 0,
    blocked: blockedReasons.length > 0,
    checks,
    blockedReasons,
    warnings,
    secretValueAccessed: false,
    secretValuePrinted: false,
    gcloudCommandRun: false,
    providerCallMade: false,
    markerChatRuntimeChanged: false,
    mockOnly: true,
  }
}

export function validateQwenRuntimeBoundaryContext(context: QwenRuntimeBoundaryContext): QwenRuntimeBoundaryValidationResult {
  return validationResult([
    check('server_only_import', context.providerName === 'qwen_3_7' && context.role === 'reasoning_brain', 'Qwen runtime context must remain server-only reasoning metadata.'),
    check('fallback_available', context.mockOnly, 'Qwen runtime boundary must preserve mock fallback.'),
    check('structured_validation_required', context.gateStatus !== 'ready_for_runtime_adapter_future', 'Structured validation remains required before future runtime calls.'),
  ], ['Context validation does not permit provider calls.'])
}

export function validateQwenSecretReferences(references: QwenSecretReference[]): QwenRuntimeBoundaryValidationResult {
  return validationResult([
    check('no_frontend_secret_access', references.every((reference) => reference.frontendVisible === false), 'Qwen secret references must not be frontend-visible.'),
    check('no_secret_value_logging', references.every((reference) => reference.valuePrinted === false), 'Qwen secret reference values must not be printed.'),
    check('no_gcloud_command', references.every((reference) => reference.valueAccessed === false), 'Qwen secret reference values must not be accessed.'),
  ], ['Secret references are symbolic only.'])
}

export function validateQwenRuntimeReadiness(readiness: QwenRuntimeReadiness): QwenRuntimeBoundaryValidationResult {
  return validationResult([
    check('no_provider_call', readiness.canCallProvider === false && readiness.providerCallStatus !== 'future_real_call_allowed', 'Qwen provider calls must be blocked in RP-QWEN-01.'),
    check('fallback_available', readiness.canUseFallback === true, 'Qwen deterministic fallback must remain available.'),
    check('structured_validation_required', readiness.requiredNextGates.includes('structured_response_validation'), 'Structured response validation must be a required next gate.'),
    check('no_marker_chat_runtime_change', readiness.canWireMarkerChat === false, 'Marker Chat runtime wiring must remain blocked.'),
  ], ['Readiness is boundary-only and mock/local.'])
}

export function validateNoQwenSecretValueAccess(input: {
  secretValueAccessed?: boolean
  secretValuePrinted?: boolean
  gcloudCommandRun?: boolean
}): QwenRuntimeBoundaryValidationResult {
  return validationResult([
    check('no_gcloud_command', input.gcloudCommandRun !== true, 'No gcloud command may run in RP-QWEN-01.'),
    check('no_secret_value_logging', input.secretValuePrinted !== true, 'No Qwen secret value may be printed.'),
    check('no_frontend_secret_access', input.secretValueAccessed !== true, 'No Qwen secret value may be accessed.'),
  ])
}

export function validateNoQwenProviderCall(input: {
  providerCallMade?: boolean
  qwenCallMade?: boolean
  deepSeekCallMade?: boolean
}): QwenRuntimeBoundaryValidationResult {
  return validationResult([
    check('no_provider_call', input.providerCallMade !== true && input.qwenCallMade !== true && input.deepSeekCallMade !== true, 'No Qwen, DeepSeek, or provider call may be made in RP-QWEN-01.'),
  ])
}

export function validateNoQwenFrontendSecretAccess(input: {
  fileReferences: Array<{ filePath: string; sourceText: string }>
}): QwenRuntimeBoundaryValidationResult {
  const unsafeRuntimeImportPattern = /(?:src\/backend\/qwen-runtime|(?:\.\.\/)+backend\/qwen-runtime)/
  const unsafe = input.fileReferences.filter((file) =>
    /QWEN_REASONING_(?:API_KEY|BASE_URL)_SECRET|QWEN_RUNTIME_CONFIG_SECRET/.test(file.sourceText) ||
    unsafeRuntimeImportPattern.test(file.sourceText),
  )
  return validationResult([
    check('no_frontend_secret_access', unsafe.length === 0, `Frontend Qwen secret/runtime references found: ${unsafe.map((item) => item.filePath).join(', ')}`),
  ])
}

export function validateNoQwenMarkerChatRuntimeChange(input: {
  markerChatRuntimeChanged?: boolean
  qwenWiredToMarkerChat?: boolean
}): QwenRuntimeBoundaryValidationResult {
  return validationResult([
    check('no_marker_chat_runtime_change', input.markerChatRuntimeChanged !== true && input.qwenWiredToMarkerChat !== true, 'Marker Chat runtime behavior must not change in RP-QWEN-01.'),
  ])
}

export function createQwenRuntimeBoundaryValidationSummary(result: QwenRuntimeBoundaryValidationResult): string {
  if (result.ok) return 'Qwen runtime boundary validation passed for mock/local server-only readiness.'
  return `Qwen runtime boundary validation blocked: ${result.blockedReasons.join(' ')}`
}
