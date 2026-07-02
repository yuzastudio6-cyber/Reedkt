import type {
  ProviderConfigStatus,
  ProviderRuntimeReadiness,
  ProviderSecretName,
  ReeditProProviderId,
} from '../../types'
import { fail, ok, type ServiceResult } from '../service-result'
import {
  getProviderRuntimeDefinition,
  listProviderRuntimeDefinitions,
} from './provider-secret-registry'

export interface ProviderRuntimeReadinessInput {
  providerId: ReeditProProviderId
  mode?: 'mock' | 'production'
  presentSecrets?: ProviderSecretName[]
  providerEnabled?: boolean
}

function createStatus(input: ProviderRuntimeReadinessInput): ProviderConfigStatus {
  const runtime = getProviderRuntimeDefinition(input.providerId)
  if (!runtime) return 'unknown'
  if (runtime.mockOnly || input.mode === 'mock') return 'mock_only'
  if (!input.providerEnabled) return 'disabled'
  const present = new Set(input.presentSecrets ?? [])
  const missingRequired = runtime.requiredSecrets.filter((secretName) => !present.has(secretName))
  if (missingRequired.length > 0) return 'missing_required_secret'
  const missingOptional = runtime.optionalSecrets.filter((secretName) => !present.has(secretName))
  if (missingOptional.length > 0) return 'missing_optional_secret'
  return 'configured'
}

export function checkProviderRuntimeReadiness(
  input: ProviderRuntimeReadinessInput,
): ServiceResult<ProviderRuntimeReadiness> {
  const runtime = getProviderRuntimeDefinition(input.providerId)
  if (!runtime) {
    return fail('PROVIDER_CONFIG_VALIDATION_FAILED', `Provider runtime ${input.providerId} is not registered.`, input)
  }

  const present = new Set(input.presentSecrets ?? [])
  const missingRequiredSecrets = runtime.requiredSecrets.filter((secretName) => !present.has(secretName))
  const missingOptionalSecrets = runtime.optionalSecrets.filter((secretName) => !present.has(secretName))
  const status = createStatus(input)
  const realProvider = !runtime.mockOnly && input.mode === 'production'

  return ok({
    providerId: runtime.providerId,
    status,
    readyForMock: true,
    readyForProduction: realProvider
      && status === 'configured'
      && Boolean(input.providerEnabled),
    missingRequiredSecrets,
    missingOptionalSecrets,
    blockedReasons: [
      ...(!input.providerEnabled && !runtime.mockOnly && input.mode === 'production'
        ? ['Provider runtime is disabled until explicitly enabled.']
        : []),
      ...missingRequiredSecrets.map((secretName) => `Missing required secret: ${secretName}.`),
      ...(runtime.workerOnly && input.mode === 'production' ? ['Worker runtime and job lease gates remain future work.'] : []),
      ...(runtime.backendOnly && input.mode === 'production' ? ['Backend runtime and secure secret access remain future work.'] : []),
    ],
    warnings: [
      ...missingOptionalSecrets.map((secretName) => `Optional secret not present: ${secretName}.`),
      'RP-MODEL-02 readiness does not call providers or inspect secret values.',
    ],
  })
}

export function checkAllProviderRuntimeReadiness(input: {
  mode?: 'mock' | 'production'
  presentSecrets?: ProviderSecretName[]
  providerEnabled?: Partial<Record<ReeditProProviderId, boolean>>
} = {}): ProviderRuntimeReadiness[] {
  return listProviderRuntimeDefinitions().map((runtime) => checkProviderRuntimeReadiness({
    providerId: runtime.providerId,
    mode: input.mode ?? 'mock',
    presentSecrets: input.presentSecrets,
    providerEnabled: input.providerEnabled?.[runtime.providerId] ?? runtime.enabledByDefault,
  })).map((result) => result.ok ? result.data : {
    providerId: 'internal_mock',
    status: 'unknown',
    readyForMock: false,
    readyForProduction: false,
    missingRequiredSecrets: [],
    missingOptionalSecrets: [],
    blockedReasons: [result.error.message],
    warnings: [],
  })
}

export function checkMockRuntimeReadiness(): ProviderRuntimeReadiness[] {
  return checkAllProviderRuntimeReadiness({ mode: 'mock' })
}

export function checkProductionRuntimeReadiness(input: {
  presentSecrets?: ProviderSecretName[]
  providerEnabled?: Partial<Record<ReeditProProviderId, boolean>>
} = {}): ProviderRuntimeReadiness[] {
  return checkAllProviderRuntimeReadiness({
    mode: 'production',
    presentSecrets: input.presentSecrets,
    providerEnabled: input.providerEnabled,
  })
}

export function createProviderRuntimeReadinessSummary(readiness: ProviderRuntimeReadiness[]): string {
  const readyMock = readiness.filter((item) => item.readyForMock).length
  const readyProduction = readiness.filter((item) => item.readyForProduction).length
  const blocked = readiness.filter((item) => item.blockedReasons.length > 0).length
  return `Provider readiness: ${readyMock}/${readiness.length} mock-ready, ${readyProduction}/${readiness.length} production-ready, ${blocked} blocked for production. No provider calls were made.`
}
