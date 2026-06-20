import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import type {
  FixtureBoundExportValidationPolicy,
  FixtureBoundExportValidationResult,
  FixtureBoundExportValidationValidationSummary,
} from './fixture-bound-export-validation-types'
import {
  listRuntimeIdReconciliationResults,
} from './tool-runtime-id-aliases'

export const FORBIDDEN_FIXTURE_BOUND_EXPORT_VALIDATION_KEYS = [
  'rawPrompt',
  'raw_prompt',
  'rawUserChat',
  'signedUrl',
  'signed_url',
  'serviceRole',
  'service_role',
  'serviceRoleKey',
  'providerApiKey',
  'secretValue',
  'arbitraryArgs',
  'arbitrary_args',
  'shellCommand',
  'shell_command',
  'command',
  'args',
  'argv',
  'exec',
  'spawn',
  'outputPath',
  'output_path',
  'localPath',
  'local_path',
  'absolutePath',
  'absolute_path',
  'httpUrl',
  'httpsUrl',
] as const

const productionToolIds = new Set<string>(PRODUCTION_TOOL_IDS)
const forbiddenKeySet = new Set<string>(FORBIDDEN_FIXTURE_BOUND_EXPORT_VALIDATION_KEYS)
const expectedPolicyId = 'fixture_bound_synthetic_audio_export_validation'
const expectedRequiredGates = ['export_codec_format', 'export_duration_sync', 'render_asset_integrity']

function pendingExternalToolIds(): Set<string> {
  return new Set(
    listRuntimeIdReconciliationResults()
      .filter((result) => result.status === 'pending_production_tool_registry_expansion')
      .map((result) => result.externalToolId ?? result.inputToolId),
  )
}

function collectKeysDeep(value: unknown, path = '$', keys: string[] = []): string[] {
  if (!value || typeof value !== 'object') return keys
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectKeysDeep(item, `${path}[${index}]`, keys))
    return keys
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    keys.push(`${path}.${key}`)
    collectKeysDeep(nestedValue, `${path}.${key}`, keys)
  }

  return keys
}

function collectStringsDeep(value: unknown, path = '$', values: string[] = []): string[] {
  if (typeof value === 'string') {
    values.push(`${path}=${value}`)
    return values
  }
  if (!value || typeof value !== 'object') return values
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStringsDeep(item, `${path}[${index}]`, values))
    return values
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    collectStringsDeep(nestedValue, `${path}.${key}`, values)
  }

  return values
}

function keyName(path: string): string {
  const parts = path.split('.')
  return parts[parts.length - 1] ?? path
}

function looksLikeUnsafeString(valueWithPath: string): boolean {
  const value = valueWithPath.slice(valueWithPath.indexOf('=') + 1)
  return (
    value.startsWith('/') ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    /^https?:\/\//i.test(value) ||
    /&&|\|\||[|;`<>]|\$\(|\r|\n/.test(value)
  )
}

function sameStringArray(left: readonly string[] | undefined, right: readonly string[]): boolean {
  if (!left || left.length !== right.length) return false

  return left.every((value, index) => value === right[index])
}

function scanObjectSafety(
  value: unknown,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
): boolean {
  let ok = true

  for (const path of collectKeysDeep(value)) {
    const key = keyName(path)
    if (forbiddenKeySet.has(key)) {
      forbiddenFieldsFound.push(path)
      ok = false
    }
  }

  for (const valueWithPath of collectStringsDeep(value)) {
    if (looksLikeUnsafeString(valueWithPath)) {
      unsafeStringValues.push(valueWithPath)
      ok = false
    }
  }

  return ok
}

function validateToolId(
  toolId: string,
  pendingExternalIds: Set<string>,
  nonFirstClassToolIds: string[],
): boolean {
  if (!productionToolIds.has(toolId)) {
    nonFirstClassToolIds.push(toolId)
    return false
  }
  if (pendingExternalIds.has(toolId)) return false

  return toolId === 'ffprobe'
}

function summary(input: {
  ok: boolean
  policies: readonly FixtureBoundExportValidationPolicy[]
  results: readonly FixtureBoundExportValidationResult[]
  forbiddenFieldsFound: string[]
  unsafeStringValues: string[]
  invalidPolicyFindings: string[]
  invalidResultFindings: string[]
  nonFirstClassToolIds: string[]
  pendingExternalToolsUsed: boolean
}): FixtureBoundExportValidationValidationSummary {
  const coveredQualityGates = [...new Set(input.results
    .flatMap((result) => result.qualityGateResults.map((gate) => gate.gateType)))]
    .sort()
  const finalDeliveryPassed = input.results.some((result) => (
    result.qualityGateResults.some((gate) => gate.gateType === 'final_delivery' && gate.status === 'passed')
  ))
  const requiredQualityGatesPassed = input.results.length > 0 &&
    input.results.every((result) => (
      result.status !== 'passed' ||
      result.qualityGateResults
        .filter((gate) => gate.required)
        .every((gate) => gate.status === 'passed')
    ))

  return {
    ok: input.ok && finalDeliveryPassed === false,
    validationPolicyCount: input.policies.length,
    validationResultCount: input.results.length,
    passedCount: input.results.filter((result) => result.status === 'passed').length,
    blockedCount: input.results.filter((result) => result.status === 'blocked').length,
    unavailableCount: input.results.filter((result) => result.status === 'unavailable').length,
    failedClosedCount: input.results.filter((result) => result.status === 'failed_closed').length,
    coveredQualityGates,
    requiredQualityGatesPassed,
    finalDeliveryPassed: false,
    forbiddenFieldsFound: input.forbiddenFieldsFound,
    unsafeStringValues: input.unsafeStringValues,
    invalidPolicyFindings: input.invalidPolicyFindings,
    invalidResultFindings: input.invalidResultFindings,
    nonFirstClassToolIds: [...new Set(input.nonFirstClassToolIds)].sort(),
    pendingExternalToolsUsed: input.pendingExternalToolsUsed,
    exportValidationPerformed: input.results.some((result) => result.exportValidationPerformed),
    executesTools: false,
    sourceProbeExecutesTools: true,
    mediaProcessingPerformed: false,
    realUserMediaUsed: false,
    videoValidationPerformed: false,
    transcodingPerformed: false,
    muxingPerformed: false,
    filteringPerformed: false,
    renderingPerformed: false,
    workerExecutionPerformed: false,
    providerCallsPerformed: false,
    supabaseMutationPerformed: false,
    sqlExecuted: false,
    signedUrlsUsed: false,
    rawProbeJsonExposed: false,
    packageLockMutated: false,
    betaProductionUnlocked: false,
  }
}

function validatePolicyInternal(
  policy: FixtureBoundExportValidationPolicy,
  pendingExternalIds: Set<string>,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  invalidPolicyFindings: string[],
  nonFirstClassToolIds: string[],
): boolean {
  let ok = scanObjectSafety(policy, forbiddenFieldsFound, unsafeStringValues)
  if (!validateToolId(policy.sourceProbeToolId, pendingExternalIds, nonFirstClassToolIds)) ok = false

  if (
    policy.policyId !== expectedPolicyId ||
    policy.validationKind !== 'fixture_bound_export_validation' ||
    policy.fixtureKind !== 'synthetic_audio' ||
    policy.acceptedContentTypes.length !== 1 ||
    policy.acceptedContentTypes[0] !== 'audio/wav' ||
    !sameStringArray(policy.requiredQualityGates, expectedRequiredGates) ||
    policy.optionalQualityGates.length !== 1 ||
    policy.optionalQualityGates[0]?.gateType !== 'final_delivery' ||
    policy.optionalQualityGates[0]?.status !== 'skipped' ||
    policy.optionalQualityGates[0]?.required !== false ||
    policy.optionalQualityGates[0]?.blocksFinalExport !== true ||
    policy.optionalQualityGates[0]?.reason !== 'final_delivery_requires_real_export_validation_future_milestone' ||
    policy.expectedMaxDurationSeconds !== 3.1 ||
    !policy.acceptedFormatNames.includes('wav') ||
    !sameStringArray(policy.allowedCodecTypes, ['audio'])
  ) {
    invalidPolicyFindings.push(`${policy.policyId}.allowlist`)
    ok = false
  }

  if (
    policy.sourceProbeExecutesTools !== true ||
    policy.executesTools !== false ||
    policy.mediaProcessingAllowed !== false ||
    policy.realUserMediaAllowed !== false ||
    policy.videoValidationAllowed !== false ||
    policy.transcodingAllowed !== false ||
    policy.muxingAllowed !== false ||
    policy.filteringAllowed !== false ||
    policy.renderingAllowed !== false ||
    policy.workerExecutionAllowed !== false ||
    policy.providerCallsAllowed !== false ||
    policy.supabaseMutationAllowed !== false ||
    policy.sqlAllowed !== false ||
    policy.signedUrlsAllowed !== false ||
    policy.packageLockMutationAllowed !== false ||
    policy.betaProductionAllowed !== false ||
    policy.finalDeliveryAllowed !== false ||
    policy.failClosed !== true
  ) {
    invalidPolicyFindings.push(`${policy.policyId}.safetyFlags`)
    ok = false
  }

  return ok
}

function validateResultInternal(
  result: FixtureBoundExportValidationResult,
  pendingExternalIds: Set<string>,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  invalidResultFindings: string[],
  nonFirstClassToolIds: string[],
): boolean {
  let ok = scanObjectSafety(result, forbiddenFieldsFound, unsafeStringValues)
  if (!validateToolId(result.sourceProbeToolId, pendingExternalIds, nonFirstClassToolIds)) ok = false

  if (!['passed', 'blocked', 'unavailable', 'failed_closed'].includes(result.status)) {
    invalidResultFindings.push(`${result.validationRunId}.status`)
    ok = false
  }
  if (
    result.policyId !== expectedPolicyId ||
    result.validationKind !== 'fixture_bound_export_validation' ||
    result.fixtureKind !== 'synthetic_audio' ||
    result.contentType !== 'audio/wav'
  ) {
    invalidResultFindings.push(`${result.validationRunId}.identity`)
    ok = false
  }
  if (
    result.sourceProbeStatus === 'unavailable' &&
    result.status !== 'unavailable'
  ) {
    invalidResultFindings.push(`${result.validationRunId}.unavailableMapping`)
    ok = false
  }
  if (
    result.sourceProbeStatus === 'failed_closed' &&
    result.status !== 'failed_closed'
  ) {
    invalidResultFindings.push(`${result.validationRunId}.failedClosedMapping`)
    ok = false
  }
  if (
    result.sourceProbeExecutesTools !== true ||
    result.executesTools !== false ||
    result.mediaProcessingPerformed !== false ||
    result.realUserMediaUsed !== false ||
    result.videoValidationPerformed !== false ||
    result.transcodingPerformed !== false ||
    result.muxingPerformed !== false ||
    result.filteringPerformed !== false ||
    result.renderingPerformed !== false ||
    result.workerExecutionPerformed !== false ||
    result.providerCallsPerformed !== false ||
    result.supabaseMutationPerformed !== false ||
    result.sqlExecuted !== false ||
    result.signedUrlsUsed !== false ||
    result.rawProbeJsonExposed !== false ||
    result.packageLockMutated !== false ||
    result.betaProductionUnlocked !== false
  ) {
    invalidResultFindings.push(`${result.validationRunId}.safetyFlags`)
    ok = false
  }
  if (result.qualityGateResults.length !== 4) {
    invalidResultFindings.push(`${result.validationRunId}.qualityGateCount`)
    ok = false
  }
  for (const requiredGate of expectedRequiredGates) {
    const gate = result.qualityGateResults.find((candidate) => candidate.gateType === requiredGate)
    if (!gate || gate.required !== true) {
      invalidResultFindings.push(`${result.validationRunId}.${requiredGate}`)
      ok = false
    }
  }
  const finalDelivery = result.qualityGateResults.find((gate) => gate.gateType === 'final_delivery')
  if (
    !finalDelivery ||
    finalDelivery.required !== false ||
    finalDelivery.status !== 'skipped' ||
    finalDelivery.blocksFinalExport !== true ||
    finalDelivery.reason !== 'final_delivery_requires_real_export_validation_future_milestone'
  ) {
    invalidResultFindings.push(`${result.validationRunId}.finalDelivery`)
    ok = false
  }
  if (result.qualityGateResults.some((gate) => gate.gateType === 'final_delivery' && gate.status === 'passed')) {
    invalidResultFindings.push(`${result.validationRunId}.finalDeliveryPassed`)
    ok = false
  }
  if (result.status === 'passed') {
    const requiredPassed = result.qualityGateResults
      .filter((gate) => gate.required)
      .every((gate) => gate.status === 'passed')
    if (
      result.exportValidationPerformed !== true ||
      !result.sanitizedInputSummary ||
      !result.exportSummary ||
      result.exportSummary.exportValidationShapeValid !== true ||
      result.exportSummary.audioStreamCount < 1 ||
      result.exportSummary.videoStreamCount !== 0 ||
      result.exportSummary.metadataShapeValid !== true ||
      !requiredPassed
    ) {
      invalidResultFindings.push(`${result.validationRunId}.passedSummary`)
      ok = false
    }
  }

  return ok
}

export function validateFixtureBoundExportValidationPolicy(
  policy: FixtureBoundExportValidationPolicy,
): FixtureBoundExportValidationValidationSummary {
  return validateFixtureBoundExportValidationResults([], [policy])
}

export function validateFixtureBoundExportValidationResult(
  result: FixtureBoundExportValidationResult,
): FixtureBoundExportValidationValidationSummary {
  return validateFixtureBoundExportValidationResults([result], [])
}

export function validateFixtureBoundExportValidationResults(
  results: readonly FixtureBoundExportValidationResult[],
  policies: readonly FixtureBoundExportValidationPolicy[] = [],
): FixtureBoundExportValidationValidationSummary {
  const pendingExternalIds = pendingExternalToolIds()
  const forbiddenFieldsFound: string[] = []
  const unsafeStringValues: string[] = []
  const invalidPolicyFindings: string[] = []
  const invalidResultFindings: string[] = []
  const nonFirstClassToolIds: string[] = []
  let ok = true

  for (const policy of policies) {
    if (!validatePolicyInternal(
      policy,
      pendingExternalIds,
      forbiddenFieldsFound,
      unsafeStringValues,
      invalidPolicyFindings,
      nonFirstClassToolIds,
    )) {
      ok = false
    }
  }

  for (const result of results) {
    if (!validateResultInternal(
      result,
      pendingExternalIds,
      forbiddenFieldsFound,
      unsafeStringValues,
      invalidResultFindings,
      nonFirstClassToolIds,
    )) {
      ok = false
    }
  }

  const pendingExternalToolsUsed = policies.some((policy) => pendingExternalIds.has(policy.sourceProbeToolId)) ||
    results.some((result) => pendingExternalIds.has(result.sourceProbeToolId))
  if (
    pendingExternalToolsUsed ||
    forbiddenFieldsFound.length > 0 ||
    unsafeStringValues.length > 0 ||
    invalidPolicyFindings.length > 0 ||
    invalidResultFindings.length > 0 ||
    nonFirstClassToolIds.length > 0
  ) {
    ok = false
  }

  return summary({
    ok,
    policies,
    results,
    forbiddenFieldsFound,
    unsafeStringValues,
    invalidPolicyFindings,
    invalidResultFindings,
    nonFirstClassToolIds,
    pendingExternalToolsUsed,
  })
}
