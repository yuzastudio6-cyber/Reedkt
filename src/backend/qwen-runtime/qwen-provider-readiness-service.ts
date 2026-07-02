import type { QwenProviderReadiness, QwenRuntimeBoundaryContext } from '../../types'
import { checkProviderRuntimeReadiness } from '../provider-config/provider-runtime-readiness-service'
import { ok, type ServiceResult } from '../service-result'

export function createQwenProviderReadiness(context?: QwenRuntimeBoundaryContext): QwenProviderReadiness {
  const upstream = checkProviderRuntimeReadiness({
    providerId: 'qwen',
    mode: 'production',
    presentSecrets: [],
    providerEnabled: false,
  })

  return {
    providerName: 'qwen_3_7',
    gateStatus: context?.gateStatus ?? 'blocked_owner_approval',
    providerCallStatus: 'blocked_by_gate',
    canCreateProviderClient: false,
    canCallProvider: false,
    providerClientCreated: false,
    qwenCallMade: false,
    deepSeekCallMade: false,
    providerCallMade: false,
    mockFallbackAvailable: true,
    structuredValidationRequired: true,
    warnings: [
      'Qwen provider client creation is blocked in RP-QWEN-01.',
      upstream.ok ? upstream.data.blockedReasons.join(' ') : upstream.error.message,
    ].filter(Boolean),
    mockOnly: true,
  }
}

export function createQwenProviderReadinessSummary(readiness: QwenProviderReadiness): string {
  return `Qwen provider readiness: ${readiness.gateStatus}; providerClientCreated false, providerCallMade false, fallback available true.`
}

export function assertQwenProviderClientCreationBlocked(): ServiceResult<{
  canCreateProviderClient: false
  providerClientCreated: false
}> {
  return ok({
    canCreateProviderClient: false,
    providerClientCreated: false,
  })
}

export function assertQwenProviderCallBlocked(): ServiceResult<{
  canCallProvider: false
  qwenCallMade: false
  providerCallMade: false
}> {
  return ok({
    canCallProvider: false,
    qwenCallMade: false,
    providerCallMade: false,
  })
}
