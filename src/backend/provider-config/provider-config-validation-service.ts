import type {
  FrontendSecretSafetyReport,
  ProviderRuntimeDefinition,
  ProviderRuntimeGate,
  ProviderSecretInventoryReport,
  ProviderSecretName,
  ReeditProProviderId,
} from '../../types'
import { fail, ok, type ServiceResult } from '../service-result'
import {
  getProviderRuntimeDefinition,
  getProviderSecretDefinition,
  listProviderSecretDefinitions,
} from './provider-secret-registry'

export interface ProviderConfigValidationResult {
  ok: boolean
  blockedReasons: string[]
  warnings: string[]
}

const secretValuePatterns = [
  /sk-[A-Za-z0-9_-]{8,}/,
  /AIza[A-Za-z0-9_-]{8,}/,
  /eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/,
  /-----BEGIN (?:PRIVATE|RSA|EC) KEY-----/,
  /service_role_[A-Za-z0-9_-]{8,}/i,
]

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

export function validateProviderSecretBoundary(secretName: ProviderSecretName): ServiceResult<ProviderConfigValidationResult> {
  const definition = getProviderSecretDefinition(secretName)
  if (!definition) {
    return fail('PROVIDER_CONFIG_VALIDATION_FAILED', `Provider secret ${secretName} is not registered.`)
  }

  const blockedReasons = definition.neverExposeToFrontend
    ? ['Provider secret is backend-only/worker-only and must not be exposed to frontend code.']
    : []

  return ok({
    ok: blockedReasons.length === 0,
    blockedReasons,
    warnings: definition.notes,
  })
}

export function validateFrontendDoesNotReferenceProviderSecrets(input: {
  fileReferences: Array<{ filePath: string; sourceText: string }>
}): FrontendSecretSafetyReport {
  const secretDefinitions = listProviderSecretDefinitions()
  const unsafeReferences = input.fileReferences.flatMap(({ filePath, sourceText }) =>
    secretDefinitions
      .filter((definition) => definition.neverExposeToFrontend && sourceText.includes(definition.name))
      .map((definition) => ({
        filePath,
        secretName: definition.name,
        reason: `${definition.name} is ${definition.boundary} and must not appear in frontend runtime code.`,
      })),
  )

  return {
    ok: unsafeReferences.length === 0,
    scannedFiles: input.fileReferences.length,
    unsafeReferences,
    warnings: unsafeReferences.length
      ? ['Unsafe provider secret references were found in frontend runtime code.']
      : ['No backend/provider secret names were found in frontend runtime references.'],
  }
}

export function validateProviderRuntimeGates(input: {
  providerId: ReeditProProviderId
  satisfiedGates?: ProviderRuntimeGate[]
}): ServiceResult<ProviderConfigValidationResult> {
  const runtime = getProviderRuntimeDefinition(input.providerId)
  if (!runtime) {
    return fail('PROVIDER_CONFIG_VALIDATION_FAILED', `Provider runtime ${input.providerId} is not registered.`)
  }

  const satisfied = new Set(input.satisfiedGates ?? [])
  const missing = runtime.runtimeGates.filter((gate) => !satisfied.has(gate))
  return ok({
    ok: missing.length === 0,
    blockedReasons: missing.map((gate) => `Missing runtime gate: ${gate}.`),
    warnings: runtime.notes,
  })
}

export function validateProviderConfigForMock(runtime: ProviderRuntimeDefinition): ProviderConfigValidationResult {
  return {
    ok: true,
    blockedReasons: [],
    warnings: runtime.mockOnly
      ? ['Internal mock provider requires no secrets.']
      : ['Mock mode does not require provider secrets and does not make provider calls.'],
  }
}

export function validateProviderConfigForProduction(input: {
  runtime: ProviderRuntimeDefinition
  presentSecrets?: ProviderSecretName[]
}): ProviderConfigValidationResult {
  const present = new Set(input.presentSecrets ?? [])
  const missingRequired = input.runtime.requiredSecrets.filter((secretName) => !present.has(secretName))
  const missingOptional = input.runtime.optionalSecrets.filter((secretName) => !present.has(secretName))
  return {
    ok: missingRequired.length === 0 && input.runtime.enabledByDefault,
    blockedReasons: [
      ...missingRequired.map((secretName) => `Missing required production secret: ${secretName}.`),
      ...(!input.runtime.enabledByDefault && !input.runtime.mockOnly ? ['Provider runtime is disabled until explicitly enabled.'] : []),
    ],
    warnings: missingOptional.map((secretName) => `Optional production secret not configured: ${secretName}.`),
  }
}

export function validateNoSecretValuesInReport(report: unknown): ServiceResult<ProviderConfigValidationResult> {
  const serialized = JSON.stringify(report)
  const matched = secretValuePatterns.some((pattern) => pattern.test(serialized))
  if (matched) {
    return fail('PROVIDER_CONFIG_SECRET_EXPOSURE', 'Potential secret-like value found in provider report; value redacted.')
  }

  if (typeof report === 'object' && report && 'secretValuesPrinted' in report) {
    const inventory = report as Partial<ProviderSecretInventoryReport>
    if (inventory.secretValuesPrinted !== false) {
      return fail('PROVIDER_CONFIG_SECRET_EXPOSURE', 'Provider inventory report must set secretValuesPrinted to false.')
    }
  }

  return ok({
    ok: true,
    blockedReasons: [],
    warnings: ['No secret-like values were detected in the report.'],
  })
}

export function createProviderConfigValidationSummary(result: ProviderConfigValidationResult): string {
  if (result.ok) return 'Provider config validation passed for mock/local readiness.'
  return `Provider config validation blocked: ${unique(result.blockedReasons).join(' ')}`
}
