import {
  isProductionToolId,
} from '../tool-registry'
import {
  listRuntimeIdReconciliationResults,
} from './tool-runtime-id-aliases'
import type {
  SafeCommandParameterDefinition,
  SafeCommandParameterValue,
  SafeCommandPlan,
  SafeCommandPlanValidationSummary,
} from './safe-command-plan-types'

export const FORBIDDEN_SAFE_COMMAND_PLAN_KEYS = [
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
  'localPath',
] as const

const forbiddenKeySet = new Set<string>(FORBIDDEN_SAFE_COMMAND_PLAN_KEYS)

const shellMetacharacterPattern = /&&|\|\||[|;`<>]|\$\(|\r|\n/

function collectObjectKeyMatches(value: unknown, path = '$', matches: string[] = []): string[] {
  if (!value || typeof value !== 'object') return matches
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectObjectKeyMatches(item, `${path}[${index}]`, matches))
    return matches
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (forbiddenKeySet.has(key)) {
      matches.push(`${path}.${key}`)
    }
    collectObjectKeyMatches(nestedValue, `${path}.${key}`, matches)
  }

  return matches
}

function collectStringValues(value: unknown, path = '$', matches: Array<{ path: string, value: string }> = []): Array<{ path: string, value: string }> {
  if (typeof value === 'string') {
    matches.push({ path, value })
    return matches
  }
  if (!value || typeof value !== 'object') return matches
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStringValues(item, `${path}[${index}]`, matches))
    return matches
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    collectStringValues(nestedValue, `${path}.${key}`, matches)
  }

  return matches
}

function looksLikeAbsoluteLocalPath(value: string): boolean {
  return value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value)
}

function looksLikeHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function hasShellMetacharacters(value: string): boolean {
  return shellMetacharacterPattern.test(value)
}

function parameterNameInvalid(parameterName: string): boolean {
  return forbiddenKeySet.has(parameterName)
}

function parameterValueInvalid(value: SafeCommandParameterValue): boolean {
  return typeof value === 'string' && (
    looksLikeAbsoluteLocalPath(value) ||
    looksLikeHttpUrl(value) ||
    hasShellMetacharacters(value)
  )
}

function parameterDefinitionInvalid(definition: SafeCommandParameterDefinition): boolean {
  if (parameterNameInvalid(definition.parameterName)) return true
  return definition.enumValues?.some((enumValue) =>
    looksLikeAbsoluteLocalPath(enumValue) ||
    looksLikeHttpUrl(enumValue) ||
    hasShellMetacharacters(enumValue),
  ) ?? false
}

function pendingExternalToolIds(): Set<string> {
  return new Set(
    listRuntimeIdReconciliationResults()
      .filter((result) => result.status === 'pending_production_tool_registry_expansion')
      .map((result) => result.externalToolId ?? result.inputToolId),
  )
}

function validateSinglePlan(plan: SafeCommandPlan): SafeCommandPlanValidationSummary {
  const forbiddenFieldsFound = collectObjectKeyMatches(plan)
  const stringValues = collectStringValues(plan)
  const unsafeStringValues = stringValues
    .filter(({ value }) =>
      looksLikeAbsoluteLocalPath(value) ||
      looksLikeHttpUrl(value) ||
      hasShellMetacharacters(value),
    )
    .map(({ path }) => path)

  const unsafeParameterKeys = [
    ...plan.allowedParameterSchema.parameters
      .filter(parameterDefinitionInvalid)
      .map((definition) => definition.parameterName),
    ...Object.keys(plan.parameterDefaults).filter(parameterNameInvalid),
  ]

  const unsafeParameterValues = Object.entries(plan.parameterDefaults)
    .filter(([, value]) => parameterValueInvalid(value))
    .map(([parameterName]) => parameterName)

  const unsafeOutputExpectations = plan.outputArtifactExpectations
    .filter((expectation) => Object.keys(expectation).some((key) => key.toLowerCase().includes('path')))
    .map((expectation) => String(expectation.artifactType))

  const pendingExternalTools = pendingExternalToolIds()
  const pendingExternalToolsUsed = pendingExternalTools.has(plan.toolId)
  const allCommandPlansPlanningOnly = plan.executionMode === 'planning_only' &&
    plan.approvedSnapshotRequired === true &&
    plan.privateArtifactRefsOnly === true &&
    plan.rawPromptAllowed === false &&
    plan.signedUrlAllowed === false &&
    plan.arbitraryArgsAllowed === false &&
    plan.commandExecutionAllowed === false &&
    plan.mediaProcessingAllowed === false &&
    plan.executesTools === false &&
    plan.sandboxProfile.networkAllowed === false &&
    plan.sandboxProfile.signedUrlsAllowed === false &&
    plan.sandboxProfile.rawPromptAllowed === false &&
    plan.sandboxProfile.arbitraryArgsAllowed === false &&
    plan.sandboxProfile.privateArtifactRefsOnly === true &&
    plan.resourceLimits.networkAllowed === false &&
    plan.resourceLimits.privateStorageOnly === true &&
    isProductionToolId(plan.toolId) &&
    !pendingExternalToolsUsed &&
    plan.inputArtifactRequirements.every((requirement) =>
      requirement.storageReferenceRequired === true &&
      requirement.privateArtifactRefsOnly === true,
    ) &&
    plan.outputArtifactExpectations.every((expectation) =>
      expectation.storageReferenceRequired === true &&
      Boolean(expectation.storageBucketPurpose),
    )

  const ok = allCommandPlansPlanningOnly &&
    forbiddenFieldsFound.length === 0 &&
    unsafeParameterKeys.length === 0 &&
    unsafeParameterValues.length === 0 &&
    unsafeStringValues.length === 0 &&
    unsafeOutputExpectations.length === 0 &&
    !pendingExternalToolsUsed

  return {
    ok,
    commandPlanCount: 1,
    forbiddenFieldsFound,
    unsafeParameterKeys,
    unsafeParameterValues: [...unsafeParameterValues, ...unsafeStringValues],
    unsafeOutputExpectations,
    pendingExternalToolsUsed,
    allCommandPlansPlanningOnly,
    executesTools: false,
    commandExecutionAllowed: false,
    mediaProcessingAllowed: false,
  }
}

export function validateSafeCommandPlan(plan: SafeCommandPlan): SafeCommandPlanValidationSummary {
  const summary = validateSinglePlan(plan)
  if (!summary.ok) {
    throw new Error(`Unsafe command plan ${plan.commandPlanId}: ${JSON.stringify(summary)}`)
  }
  return summary
}

export function validateSafeCommandPlans(plans: readonly SafeCommandPlan[]): SafeCommandPlanValidationSummary {
  const summaries = plans.map(validateSinglePlan)
  const summary: SafeCommandPlanValidationSummary = {
    ok: summaries.every((item) => item.ok),
    commandPlanCount: plans.length,
    forbiddenFieldsFound: summaries.flatMap((item) => item.forbiddenFieldsFound),
    unsafeParameterKeys: summaries.flatMap((item) => item.unsafeParameterKeys),
    unsafeParameterValues: summaries.flatMap((item) => item.unsafeParameterValues),
    unsafeOutputExpectations: summaries.flatMap((item) => item.unsafeOutputExpectations),
    pendingExternalToolsUsed: summaries.some((item) => item.pendingExternalToolsUsed),
    allCommandPlansPlanningOnly: summaries.every((item) => item.allCommandPlansPlanningOnly),
    executesTools: false,
    commandExecutionAllowed: false,
    mediaProcessingAllowed: false,
  }

  if (!summary.ok) {
    throw new Error(`Unsafe command plans: ${JSON.stringify(summary)}`)
  }

  return summary
}
