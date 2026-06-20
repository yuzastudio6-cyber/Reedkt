import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import type {
  FixtureBoundMetadataProbePolicy,
  FixtureBoundMetadataProbeResult,
  FixtureBoundMetadataProbeValidationSummary,
} from './fixture-bound-metadata-probe-types'
import {
  listRuntimeIdReconciliationResults,
} from './tool-runtime-id-aliases'

export const FORBIDDEN_FIXTURE_BOUND_METADATA_PROBE_KEYS = [
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
const forbiddenKeySet = new Set<string>(FORBIDDEN_FIXTURE_BOUND_METADATA_PROBE_KEYS)
const expectedProbeId = 'ffprobe_fixture_bound_synthetic_audio_metadata_probe'
const expectedArgPrefix = ['-v', 'error', '-show_format', '-show_streams', '-of', 'json']

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
  options: { allowExactArgPrefix?: boolean } = {},
): boolean {
  let ok = true

  for (const path of collectKeysDeep(value)) {
    const key = keyName(path)
    if (options.allowExactArgPrefix === true && key === 'exactArgPrefix') continue
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

function summary(input: {
  ok: boolean
  policies: readonly FixtureBoundMetadataProbePolicy[]
  results: readonly FixtureBoundMetadataProbeResult[]
  forbiddenFieldsFound: string[]
  unsafeStringValues: string[]
  invalidPolicyFindings: string[]
  invalidResultFindings: string[]
  nonFirstClassToolIds: string[]
  pendingExternalToolsUsed: boolean
}): FixtureBoundMetadataProbeValidationSummary {
  return {
    ok: input.ok,
    probePolicyCount: input.policies.length,
    probeResultCount: input.results.length,
    passedCount: input.results.filter((result) => result.status === 'passed').length,
    unavailableCount: input.results.filter((result) => result.status === 'unavailable').length,
    failedClosedCount: input.results.filter((result) => result.status === 'failed_closed').length,
    forbiddenFieldsFound: input.forbiddenFieldsFound,
    unsafeStringValues: input.unsafeStringValues,
    invalidPolicyFindings: input.invalidPolicyFindings,
    invalidResultFindings: input.invalidResultFindings,
    nonFirstClassToolIds: [...new Set(input.nonFirstClassToolIds)].sort(),
    pendingExternalToolsUsed: input.pendingExternalToolsUsed,
    tempWorkspacesCleanedUp: input.results.every((result) => result.tempWorkspaceCleanedUp === true),
    metadataProbePerformed: input.results.some((result) => result.metadataProbePerformed),
    fixtureInputUsed: true,
    realUserMediaUsed: false,
    signedUrlsUsed: false,
    shellUsed: false,
    arbitraryArgsUsed: false,
    mediaProcessingPerformed: false,
    workerExecutionPerformed: false,
    providerCallsPerformed: false,
    supabaseMutationPerformed: false,
    sqlExecuted: false,
    packageLockMutated: false,
    betaProductionUnlocked: false,
    executesTools: true,
  }
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

function validatePolicyInternal(
  policy: FixtureBoundMetadataProbePolicy,
  pendingExternalIds: Set<string>,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  invalidPolicyFindings: string[],
  nonFirstClassToolIds: string[],
): boolean {
  let ok = scanObjectSafety(policy, forbiddenFieldsFound, unsafeStringValues, { allowExactArgPrefix: true })
  if (!validateToolId(policy.toolId, pendingExternalIds, nonFirstClassToolIds)) ok = false

  if (
    policy.probeId !== expectedProbeId ||
    policy.probeKind !== 'fixture_bound_metadata_probe' ||
    policy.fixtureKind !== 'synthetic_audio' ||
    policy.allowedFixtureContentTypes.length !== 1 ||
    policy.allowedFixtureContentTypes[0] !== 'audio/wav' ||
    policy.executionMethod !== 'exec_file_no_shell' ||
    policy.executableName !== 'ffprobe' ||
    !sameStringArray(policy.exactArgPrefix, expectedArgPrefix) ||
    policy.inputPathPlaceholder !== 'GENERATED_SYNTHETIC_FIXTURE_INTERNAL_PATH' ||
    policy.timeoutMs !== 3000 ||
    policy.maxBufferBytes !== 262144 ||
    policy.allowedExitCodes.length !== 1 ||
    policy.allowedExitCodes[0] !== 0
  ) {
    invalidPolicyFindings.push(`${policy.probeId}.allowlist`)
    ok = false
  }

  if (
    policy.networkAllowed !== false ||
    policy.stdinAllowed !== false ||
    policy.shellAllowed !== false ||
    policy.arbitraryArgsAllowed !== false ||
    policy.realUserMediaAllowed !== false ||
    policy.signedUrlsAllowed !== false ||
    policy.publicArtifactsAllowed !== false ||
    policy.workerExecutionAllowed !== false ||
    policy.providerCallsAllowed !== false ||
    policy.supabaseMutationAllowed !== false ||
    policy.sqlAllowed !== false ||
    policy.packageLockMutationAllowed !== false ||
    policy.betaProductionAllowed !== false ||
    policy.outputSanitizationRequired !== true ||
    policy.failClosed !== true
  ) {
    invalidPolicyFindings.push(`${policy.probeId}.safetyFlags`)
    ok = false
  }

  return ok
}

function validateResultInternal(
  result: FixtureBoundMetadataProbeResult,
  pendingExternalIds: Set<string>,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  invalidResultFindings: string[],
  nonFirstClassToolIds: string[],
): boolean {
  let ok = scanObjectSafety(result, forbiddenFieldsFound, unsafeStringValues)
  if (!validateToolId(result.toolId, pendingExternalIds, nonFirstClassToolIds)) ok = false

  if (!['passed', 'unavailable', 'failed_closed'].includes(result.status)) {
    invalidResultFindings.push(`${result.probeRunId}.status`)
    ok = false
  }
  if (result.probeId !== expectedProbeId) {
    invalidResultFindings.push(`${result.probeRunId}.probeId`)
    ok = false
  }
  if (result.fixtureKind !== 'synthetic_audio' || result.fixtureContentType !== 'audio/wav') {
    invalidResultFindings.push(`${result.probeRunId}.fixture`)
    ok = false
  }
  if (!Number.isFinite(result.durationMs) || result.durationMs < 0) {
    invalidResultFindings.push(`${result.probeRunId}.durationMs`)
    ok = false
  }
  if (
    result.fixtureInputUsed !== true ||
    result.realUserMediaUsed !== false ||
    result.signedUrlsUsed !== false ||
    result.shellUsed !== false ||
    result.arbitraryArgsUsed !== false ||
    result.workerExecutionPerformed !== false ||
    result.providerCallsPerformed !== false ||
    result.supabaseMutationPerformed !== false ||
    result.sqlExecuted !== false ||
    result.packageLockMutated !== false ||
    result.betaProductionUnlocked !== false ||
    result.mediaProcessingPerformed !== false ||
    result.tempWorkspaceCreated !== true ||
    result.tempWorkspaceCleanedUp !== true ||
    result.executesTools !== true
  ) {
    invalidResultFindings.push(`${result.probeRunId}.safetyFlags`)
    ok = false
  }
  if (result.status === 'passed') {
    if (result.metadataProbePerformed !== true || !result.sanitizedMetadataSummary) {
      invalidResultFindings.push(`${result.probeRunId}.passedMetadataSummary`)
      ok = false
    } else if (
      result.sanitizedMetadataSummary.metadataShapeValid !== true ||
      result.sanitizedMetadataSummary.audioStreamCount < 1 ||
      result.sanitizedMetadataSummary.videoStreamCount !== 0 ||
      result.sanitizedMetadataSummary.streamCount < 1
    ) {
      invalidResultFindings.push(`${result.probeRunId}.metadataShape`)
      ok = false
    }
  }
  if (result.status !== 'passed' && result.metadataProbePerformed !== false) {
    invalidResultFindings.push(`${result.probeRunId}.metadataProbePerformed`)
    ok = false
  }

  return ok
}

export function validateFixtureBoundMetadataProbePolicy(
  policy: FixtureBoundMetadataProbePolicy,
): FixtureBoundMetadataProbeValidationSummary {
  return validateFixtureBoundMetadataProbeResults([], [policy])
}

export function validateFixtureBoundMetadataProbeResult(
  result: FixtureBoundMetadataProbeResult,
): FixtureBoundMetadataProbeValidationSummary {
  return validateFixtureBoundMetadataProbeResults([result], [])
}

export function validateFixtureBoundMetadataProbeResults(
  results: readonly FixtureBoundMetadataProbeResult[],
  policies: readonly FixtureBoundMetadataProbePolicy[] = [],
): FixtureBoundMetadataProbeValidationSummary {
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

  const pendingExternalToolsUsed = policies.some((policy) => pendingExternalIds.has(policy.toolId)) ||
    results.some((result) => pendingExternalIds.has(result.toolId))
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
