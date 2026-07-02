import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import type {
  SyntheticFixtureDefinition,
  SyntheticFixturePlan,
  SyntheticFixturePlanValidationSummary,
} from './synthetic-fixture-plan-types'
import {
  listRuntimeIdReconciliationResults,
} from './tool-runtime-id-aliases'

export const FORBIDDEN_SYNTHETIC_FIXTURE_PLAN_KEYS = [
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
  'absolutePath',
  'httpUrl',
  'httpsUrl',
] as const

const forbiddenKeySet = new Set<string>(FORBIDDEN_SYNTHETIC_FIXTURE_PLAN_KEYS)
const productionToolIds = new Set<string>(PRODUCTION_TOOL_IDS)

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

function validateDefinition(
  definition: SyntheticFixtureDefinition,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  missingFixtureMappings: string[],
): boolean {
  let ok = true
  for (const path of collectKeysDeep(definition)) {
    if (forbiddenKeySet.has(keyName(path))) {
      forbiddenFieldsFound.push(path)
      ok = false
    }
  }
  for (const value of collectStringsDeep(definition)) {
    if (looksLikeUnsafeString(value)) {
      unsafeStringValues.push(value)
      ok = false
    }
  }

  const requiredBooleansOk = (
    definition.generatedInFutureOnly === true &&
    definition.fixtureGenerationAllowedNow === false &&
    definition.toolExecutionAllowedNow === false &&
    definition.mediaProcessingAllowedNow === false &&
    definition.workerExecutionAllowedNow === false &&
    definition.privateArtifactRefsOnly === true &&
    definition.signedUrlsAllowed === false &&
    definition.rawPromptAllowed === false
  )
  if (!requiredBooleansOk) ok = false
  if (definition.expectedArtifactTypes.length === 0) ok = false
  if (definition.expectedStorageBucketPurposes.length === 0) ok = false
  if (definition.requiredQualityGates.length === 0) ok = false
  if (definition.applicableCommandIntentIds.length === 0) {
    missingFixtureMappings.push(definition.fixtureId)
    ok = false
  }
  if (definition.applicableToolIds.some((toolId) => !productionToolIds.has(toolId))) ok = false

  return ok
}

function validatePlanInternal(
  plan: SyntheticFixturePlan,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  missingFixtureMappings: string[],
): boolean {
  let ok = true
  const pendingToolIds = pendingExternalToolIds()

  for (const path of collectKeysDeep(plan)) {
    if (forbiddenKeySet.has(keyName(path))) {
      forbiddenFieldsFound.push(path)
      ok = false
    }
  }
  for (const value of collectStringsDeep(plan)) {
    if (looksLikeUnsafeString(value)) {
      unsafeStringValues.push(value)
      ok = false
    }
  }

  if (!productionToolIds.has(plan.toolId)) ok = false
  if (pendingToolIds.has(plan.toolId)) ok = false
  if (plan.fixtureDefinitions.length === 0 || plan.fixtureIds.length === 0) {
    missingFixtureMappings.push(plan.commandIntentId)
    ok = false
  }
  if (plan.fixtureDefinitions.some((definition) => !definition.applicableCommandIntentIds.includes(plan.commandIntentId))) {
    missingFixtureMappings.push(plan.commandIntentId)
    ok = false
  }
  if (plan.fixtureDefinitions.some((definition) => !definition.applicableOperationIds.includes(plan.operationId))) {
    missingFixtureMappings.push(plan.operationId)
    ok = false
  }

  const requiredBooleansOk = (
    plan.generatedInFutureOnly === true &&
    plan.fixtureGenerationAllowedNow === false &&
    plan.toolExecutionAllowedNow === false &&
    plan.mediaProcessingAllowedNow === false &&
    plan.workerExecutionAllowedNow === false &&
    plan.privateArtifactRefsOnly === true &&
    plan.signedUrlsAllowed === false &&
    plan.rawPromptAllowed === false &&
    plan.executesTools === false
  )
  if (!requiredBooleansOk) ok = false
  if (plan.expectedOutputArtifacts.length === 0) ok = false
  if (plan.expectedOutputArtifacts.some((artifact) => !artifact.storageBucketPurpose)) ok = false
  if (plan.requiredQualityGates.length === 0) ok = false

  for (const definition of plan.fixtureDefinitions) {
    if (!validateDefinition(definition, forbiddenFieldsFound, unsafeStringValues, missingFixtureMappings)) ok = false
  }

  return ok
}

function summary(input: {
  ok: boolean
  fixtureDefinitionCount: number
  fixturePlanCount: number
  forbiddenFieldsFound: string[]
  unsafeStringValues: string[]
  missingFixtureMappings: string[]
  pendingExternalToolsUsed: boolean
  allFixturesFutureOnly: boolean
}): SyntheticFixturePlanValidationSummary {
  return {
    ...input,
    fixtureGenerationAllowedNow: false,
    toolExecutionAllowedNow: false,
    mediaProcessingAllowedNow: false,
    workerExecutionAllowedNow: false,
    executesTools: false,
  }
}

export function validateSyntheticFixtureDefinition(
  definition: SyntheticFixtureDefinition,
): SyntheticFixturePlanValidationSummary {
  const forbiddenFieldsFound: string[] = []
  const unsafeStringValues: string[] = []
  const missingFixtureMappings: string[] = []
  const ok = validateDefinition(definition, forbiddenFieldsFound, unsafeStringValues, missingFixtureMappings)

  return summary({
    ok,
    fixtureDefinitionCount: 1,
    fixturePlanCount: 0,
    forbiddenFieldsFound,
    unsafeStringValues,
    missingFixtureMappings,
    pendingExternalToolsUsed: definition.applicableToolIds.some((toolId) => pendingExternalToolIds().has(toolId)),
    allFixturesFutureOnly: definition.generatedInFutureOnly === true,
  })
}

export function validateSyntheticFixturePlan(plan: SyntheticFixturePlan): SyntheticFixturePlanValidationSummary {
  const forbiddenFieldsFound: string[] = []
  const unsafeStringValues: string[] = []
  const missingFixtureMappings: string[] = []
  const ok = validatePlanInternal(plan, forbiddenFieldsFound, unsafeStringValues, missingFixtureMappings)

  return summary({
    ok,
    fixtureDefinitionCount: plan.fixtureDefinitions.length,
    fixturePlanCount: 1,
    forbiddenFieldsFound,
    unsafeStringValues,
    missingFixtureMappings,
    pendingExternalToolsUsed: pendingExternalToolIds().has(plan.toolId),
    allFixturesFutureOnly: plan.generatedInFutureOnly === true &&
      plan.fixtureDefinitions.every((definition) => definition.generatedInFutureOnly === true),
  })
}

export function validateSyntheticFixturePlans(
  plans: readonly SyntheticFixturePlan[],
): SyntheticFixturePlanValidationSummary {
  const forbiddenFieldsFound: string[] = []
  const unsafeStringValues: string[] = []
  const missingFixtureMappings: string[] = []
  let ok = true

  for (const plan of plans) {
    if (!validatePlanInternal(plan, forbiddenFieldsFound, unsafeStringValues, missingFixtureMappings)) {
      ok = false
    }
  }

  const pendingToolIds = pendingExternalToolIds()
  const uniqueFixtureDefinitionCount = new Set(
    plans.flatMap((plan) => plan.fixtureDefinitions.map((definition) => definition.fixtureId)),
  ).size

  return summary({
    ok: ok && forbiddenFieldsFound.length === 0 && unsafeStringValues.length === 0 && missingFixtureMappings.length === 0,
    fixtureDefinitionCount: uniqueFixtureDefinitionCount,
    fixturePlanCount: plans.length,
    forbiddenFieldsFound,
    unsafeStringValues,
    missingFixtureMappings,
    pendingExternalToolsUsed: plans.some((plan) => pendingToolIds.has(plan.toolId)),
    allFixturesFutureOnly: plans.every((plan) => (
      plan.generatedInFutureOnly === true &&
      plan.fixtureDefinitions.every((definition) => definition.generatedInFutureOnly === true)
    )),
  })
}
