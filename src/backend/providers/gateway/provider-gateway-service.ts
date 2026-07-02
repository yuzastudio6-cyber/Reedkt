import { validateProviderGatewayRequest } from '../../cloud/provider-gateway-contracts'
import type { ProviderGatewayRequest } from '../../cloud/provider-gateway-contracts'
import { inspectForSecretLikeValues } from '../../cloud/cloud-runtime-contracts'
import { createMockProviderGatewayClient } from './mock-provider-clients'
import type { ProviderGatewayDispatchOptions, ProviderGatewayDispatchResult } from './provider-gateway-types'

export function dispatchProviderGatewayRequest(
  request: ProviderGatewayRequest,
  options: ProviderGatewayDispatchOptions = {},
): ProviderGatewayDispatchResult {
  const executionMode = options.executionMode ?? 'mock_only'
  const validation = validateProviderGatewayRequest(request)
  const secretInspection = inspectForSecretLikeValues(request)
  const errors = [...validation.errors, ...secretInspection.errors]
  const warnings = [...validation.warnings, ...secretInspection.warnings]

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
    }
  }

  if (executionMode !== 'mock_only' && options.allowRealProviderCalls !== false) {
    return {
      ok: false,
      errors: ['Real provider calls are blocked in RP-GCP-03. Use mock_only until the real provider milestone.'],
      warnings,
    }
  }

  const client = createMockProviderGatewayClient(request.providerRoute)
  const response = client.prepareRequest(request)

  return {
    ok: response.status === 'accepted_mock',
    response,
    errors: response.errorMessage ? [response.errorMessage] : [],
    warnings,
  }
}

export const PROVIDER_GATEWAY_SERVICE_RULES = [
  'dispatchProviderGatewayRequest is mock-only for RP-GCP-03.',
  'Future real dispatch must run only in secure backend/worker runtime.',
  'Validation must run before any future provider call.',
  'Provider calls must require approved snapshot and credit reservation.',
] as const
