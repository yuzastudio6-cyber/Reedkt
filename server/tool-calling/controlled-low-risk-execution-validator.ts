import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import type {
  ControlledLowRiskProbePolicy,
  ControlledLowRiskProbeResult,
  ControlledLowRiskProbeValidationSummary,
} from './controlled-low-risk-execution-types'
import {
  listRuntimeIdReconciliationResults,
} from './tool-runtime-id-aliases'

export const FORBIDDEN_CONTROLLED_LOW_RISK_EXECUTION_KEYS = [
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
const forbiddenKeySet = new Set<string>(FORBIDDEN_CONTROLLED_LOW_RISK_EXECUTION_KEYS)
const allowedExecPolicy = new Map([
  ['ffmpeg_version_probe', { executableName: 'ffmpeg', exactArgs: ['-version'], maxBufferBytes: 262144 }],
  ['ffprobe_version_probe', { executableName: 'ffprobe', exactArgs: ['-version'], maxBufferBytes: 262144 }],
  ['mediainfo_version_probe', { executableName: 'mediainfo', exactArgs: ['--Version'], maxBufferBytes: 262144 }],
  ['exiftool_version_probe', { executableName: 'exiftool', exactArgs: ['-ver'], maxBufferBytes: 262144 }],
  ['tesseract_version_probe', { executableName: 'tesseract', exactArgs: ['--version'], maxBufferBytes: 262144 }],
  ['imagemagick_magick_version_probe', { executableName: 'magick', exactArgs: ['-version'], maxBufferBytes: 262144 }],
  ['imagemagick_convert_version_probe', { executableName: 'convert', exactArgs: ['-version'], maxBufferBytes: 262144 }],
])
const allowedPackagePolicy = new Map([
  ['remotion_package_resolution_probe', { packageName: 'remotion' }],
  ['sharp_package_resolution_probe', { packageName: 'sharp' }],
])

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
    if (forbiddenKeySet.has(keyName(path))) {
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
  policies: readonly ControlledLowRiskProbePolicy[]
  results: readonly ControlledLowRiskProbeResult[]
  forbiddenFieldsFound: string[]
  unsafeStringValues: string[]
  invalidPolicyFindings: string[]
  invalidResultFindings: string[]
  nonFirstClassToolIds: string[]
  pendingExternalToolsUsed: boolean
}): ControlledLowRiskProbeValidationSummary {
  return {
    ok: input.ok,
    probePolicyCount: input.policies.length,
    probeResultCount: input.results.length,
    passedCount: input.results.filter((result) => result.status === 'passed').length,
    unavailableCount: input.results.filter((result) => result.status === 'unavailable').length,
    skippedByPolicyCount: input.results.filter((result) => result.status === 'skipped_by_policy').length,
    failedClosedCount: input.results.filter((result) => result.status === 'failed_closed').length,
    forbiddenFieldsFound: input.forbiddenFieldsFound,
    unsafeStringValues: input.unsafeStringValues,
    invalidPolicyFindings: input.invalidPolicyFindings,
    invalidResultFindings: input.invalidResultFindings,
    nonFirstClassToolIds: [...new Set(input.nonFirstClassToolIds)].sort(),
    pendingExternalToolsUsed: input.pendingExternalToolsUsed,
    shellUsed: false,
    arbitraryArgsUsed: false,
    mediaInputUsed: false,
    realUserMediaUsed: false,
    fixtureInputUsed: false,
    mediaProcessingPerformed: false,
    workerExecutionPerformed: false,
    providerCallsPerformed: false,
    supabaseMutationPerformed: false,
    sqlExecuted: false,
    signedUrlsUsed: false,
    publicArtifactsCreated: false,
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
  if (pendingExternalIds.has(toolId)) {
    return false
  }

  return true
}

function validatePolicyInternal(
  policy: ControlledLowRiskProbePolicy,
  pendingExternalIds: Set<string>,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  invalidPolicyFindings: string[],
  nonFirstClassToolIds: string[],
): boolean {
  let ok = scanObjectSafety(policy, forbiddenFieldsFound, unsafeStringValues)
  if (!validateToolId(policy.toolId, pendingExternalIds, nonFirstClassToolIds)) ok = false

  if (policy.executionMethod === 'exec_file_no_shell') {
    const expected = allowedExecPolicy.get(policy.probeId)
    if (!expected) {
      invalidPolicyFindings.push(`${policy.probeId}.unexpectedExecPolicy`)
      ok = false
    } else {
      if (policy.executableName !== expected.executableName) {
        invalidPolicyFindings.push(`${policy.probeId}.executableName`)
        ok = false
      }
      if (!sameStringArray(policy.exactArgs, expected.exactArgs)) {
        invalidPolicyFindings.push(`${policy.probeId}.exactArgs`)
        ok = false
      }
      if (policy.maxBufferBytes !== expected.maxBufferBytes) {
        invalidPolicyFindings.push(`${policy.probeId}.maxBufferBytes`)
        ok = false
      }
    }
  } else {
    const expected = allowedPackagePolicy.get(policy.probeId)
    if (!expected || policy.packageName !== expected.packageName) {
      invalidPolicyFindings.push(`${policy.probeId}.packageName`)
      ok = false
    }
  }

  if (String(policy.toolId) === 'graphicsmagick') {
    invalidPolicyFindings.push(`${policy.probeId}.graphicsmagickNotFirstClass`)
    ok = false
  }

  if (
    policy.timeoutMs <= 0 ||
    policy.timeoutMs > 3000 ||
    policy.allowedExitCodes.length !== 1 ||
    policy.allowedExitCodes[0] !== 0 ||
    policy.networkAllowed !== false ||
    policy.stdinAllowed !== false ||
    policy.shellAllowed !== false ||
    policy.arbitraryArgsAllowed !== false ||
    policy.mediaInputAllowed !== false ||
    policy.realUserMediaAllowed !== false ||
    policy.fixtureInputAllowed !== false ||
    policy.workerExecutionAllowed !== false ||
    policy.providerCallsAllowed !== false ||
    policy.supabaseMutationAllowed !== false ||
    policy.sqlAllowed !== false ||
    policy.signedUrlsAllowed !== false ||
    policy.publicArtifactsAllowed !== false ||
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
  result: ControlledLowRiskProbeResult,
  pendingExternalIds: Set<string>,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  invalidResultFindings: string[],
  nonFirstClassToolIds: string[],
): boolean {
  let ok = scanObjectSafety(result, forbiddenFieldsFound, unsafeStringValues)
  if (!validateToolId(result.toolId, pendingExternalIds, nonFirstClassToolIds)) ok = false

  if (!['passed', 'unavailable', 'skipped_by_policy', 'failed_closed'].includes(result.status)) {
    invalidResultFindings.push(`${result.probeRunId}.status`)
    ok = false
  }
  if (!Number.isFinite(result.durationMs) || result.durationMs < 0) {
    invalidResultFindings.push(`${result.probeRunId}.durationMs`)
    ok = false
  }
  if (result.status === 'passed' && !result.versionSummary) {
    invalidResultFindings.push(`${result.probeRunId}.versionSummary`)
    ok = false
  }
  if (
    result.networkUsed !== false ||
    result.stdinUsed !== false ||
    result.shellUsed !== false ||
    result.arbitraryArgsUsed !== false ||
    result.mediaInputUsed !== false ||
    result.realUserMediaUsed !== false ||
    result.fixtureInputUsed !== false ||
    result.workerExecutionPerformed !== false ||
    result.providerCallsPerformed !== false ||
    result.supabaseMutationPerformed !== false ||
    result.sqlExecuted !== false ||
    result.signedUrlsUsed !== false ||
    result.publicArtifactsCreated !== false ||
    result.packageLockMutated !== false ||
    result.betaProductionUnlocked !== false ||
    result.executesTools !== true ||
    result.mediaProcessingPerformed !== false
  ) {
    invalidResultFindings.push(`${result.probeRunId}.safetyFlags`)
    ok = false
  }

  return ok
}

export function validateControlledLowRiskProbePolicy(
  policy: ControlledLowRiskProbePolicy,
): ControlledLowRiskProbeValidationSummary {
  return validateControlledLowRiskProbeResults([], [policy])
}

export function validateControlledLowRiskProbeResult(
  result: ControlledLowRiskProbeResult,
): ControlledLowRiskProbeValidationSummary {
  return validateControlledLowRiskProbeResults([result], [])
}

export function validateControlledLowRiskProbeResults(
  results: readonly ControlledLowRiskProbeResult[],
  policies: readonly ControlledLowRiskProbePolicy[] = [],
): ControlledLowRiskProbeValidationSummary {
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
