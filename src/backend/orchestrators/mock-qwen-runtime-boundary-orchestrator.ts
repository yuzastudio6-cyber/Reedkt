import type { QwenRuntimeBoundaryOrchestratorResult, QwenRuntimeReadiness } from '../../types'
import { createQwenProviderReadiness } from '../qwen-runtime/qwen-provider-readiness-service'
import { createQwenRuntimeBoundaryContext } from '../qwen-runtime/qwen-runtime-gate-service'
import { listQwenRequiredSecretReferences } from '../qwen-runtime/qwen-secret-reference-service'
import { redactQwenSecretLikeValue } from '../qwen-runtime/qwen-secret-redaction-service'
import { resolveQwenSecretValueDisabled } from '../qwen-runtime/qwen-secret-resolver-skeleton'
import { createQwenRuntimeBoundarySummary } from '../qwen-runtime/qwen-runtime-boundary-summary-service'
import { validateQwenRuntimeReadiness } from '../qwen-runtime/qwen-runtime-boundary-validation-service'

export function createMockQwenRuntimeReadiness(): QwenRuntimeReadiness {
  const context = createQwenRuntimeBoundaryContext()
  return {
    context,
    secretReferences: listQwenRequiredSecretReferences(),
    providerCallStatus: 'blocked_by_gate',
    canResolveSecretValue: false,
    canCreateProviderClient: false,
    canCallProvider: false,
    canWireMarkerChat: false,
    canUseFallback: true,
    requiredNextGates: [
      'owner_approval',
      'secret_manager_runtime_resolver',
      'provider_config_enablement',
      'structured_response_validation',
      'rate_limit_policy',
      'usage_policy',
      'security_review',
    ],
    mockOnly: true,
  }
}

export function runMockQwenRuntimeBoundaryFlow(): QwenRuntimeBoundaryOrchestratorResult {
  const readiness = createMockQwenRuntimeReadiness()
  const validation = validateQwenRuntimeReadiness(readiness)
  return {
    context: readiness.context,
    secretReferences: readiness.secretReferences,
    readiness,
    validation,
    summary: createQwenRuntimeBoundarySummary(readiness),
    warnings: [
      ...validation.warnings,
      'RP-QWEN-02 should use fake transport first unless owner explicitly approves real provider call gates.',
    ],
    nextStep: 'RP-QWEN-02 - Backend Qwen 3.7 Max Adapter',
  }
}

export function runMockQwenSecretReferenceFlow() {
  return listQwenRequiredSecretReferences()
}

export function runMockQwenSecretRedactionFlow() {
  return redactQwenSecretLikeValue(['Bearer', 'qwen-boundary', 'x'.repeat(32)].join(' '))
}

export function runDisabledQwenSecretResolverFlow() {
  return resolveQwenSecretValueDisabled('QWEN_REASONING_API_KEY_SECRET')
}

export function runMockQwenProviderReadinessFlow() {
  return createQwenProviderReadiness(createQwenRuntimeBoundaryContext())
}

export function runMockQwenRuntimeBoundaryValidationFlow() {
  return validateQwenRuntimeReadiness(createMockQwenRuntimeReadiness())
}

export function runMockQwenRuntimeReadinessFlow() {
  return createMockQwenRuntimeReadiness()
}
