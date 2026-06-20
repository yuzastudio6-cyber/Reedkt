import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import type {
  BinaryFixtureArtifactSummary,
  BinaryFixtureGenerationPlan,
  BinaryFixtureGenerationResult,
  BinaryFixtureGenerationValidationSummary,
} from './binary-fixture-generation-types'
import {
  listRuntimeIdReconciliationResults,
} from './tool-runtime-id-aliases'

export const FORBIDDEN_BINARY_FIXTURE_GENERATION_KEYS = [
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

const forbiddenKeySet = new Set<string>(FORBIDDEN_BINARY_FIXTURE_GENERATION_KEYS)
const productionToolIds = new Set<string>(PRODUCTION_TOOL_IDS)
const validContentTypes = new Set(['application/json', 'audio/wav', 'image/png'])

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
  generationPlanCount: number
  generationResultCount: number
  artifactSummaryCount: number
  generatedFileCount: number
  generatedBinaryCount: number
  generatedJsonCount: number
  descriptorOnlyCount: number
  videoBinaryDeferredCount: number
  forbiddenFieldsFound: string[]
  unsafeStringValues: string[]
  missingArtifactFields: string[]
  invalidArtifactFindings: string[]
  nonFirstClassToolIds: string[]
  pendingExternalToolsUsed: boolean
  uncleanedTempWorkspaces: string[]
  packageLockStaged: boolean
  packageLockMutated: boolean
  videoBinaryOutputGenerated: boolean
}): BinaryFixtureGenerationValidationSummary {
  return {
    ...input,
    allTempWorkspacesCleanedUp: input.uncleanedTempWorkspaces.length === 0,
    externalToolExecutionPerformed: false,
    shellExecutionPerformed: false,
    workerExecutionPerformed: false,
    mediaProcessingPerformed: false,
    providerCallsPerformed: false,
    supabaseMutationPerformed: false,
    sqlExecuted: false,
    signedUrlsCreated: false,
    executesTools: false,
  }
}

function validateToolId(
  toolId: string,
  nonFirstClassToolIds: string[],
): boolean {
  if (!productionToolIds.has(toolId)) {
    nonFirstClassToolIds.push(toolId)
    return false
  }

  return true
}

function validateArtifactSummaryInternal(
  artifact: BinaryFixtureArtifactSummary,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  missingArtifactFields: string[],
  invalidArtifactFindings: string[],
  nonFirstClassToolIds: string[],
): boolean {
  let ok = scanObjectSafety(artifact, forbiddenFieldsFound, unsafeStringValues)

  if (!validateToolId(artifact.toolId, nonFirstClassToolIds)) ok = false
  if (!artifact.artifactType) {
    missingArtifactFields.push(`${artifact.artifactSummaryId}.artifactType`)
    ok = false
  }
  if (!artifact.storageBucketPurpose) {
    missingArtifactFields.push(`${artifact.artifactSummaryId}.storageBucketPurpose`)
    ok = false
  }
  if (!artifact.checksum || !/^[a-f0-9]{64}$/.test(artifact.checksum)) {
    missingArtifactFields.push(`${artifact.artifactSummaryId}.checksum`)
    ok = false
  }
  if (!Number.isFinite(artifact.sizeBytes) || artifact.sizeBytes <= 0) {
    missingArtifactFields.push(`${artifact.artifactSummaryId}.sizeBytes`)
    ok = false
  }
  if (!validContentTypes.has(artifact.contentType)) {
    invalidArtifactFindings.push(`${artifact.artifactSummaryId}.contentType`)
    ok = false
  }
  if (artifact.fixtureKind === 'synthetic_video') {
    if (
      artifact.contentType !== 'application/json' ||
      artifact.generatedBinary !== false ||
      artifact.descriptorOnly !== true ||
      artifact.videoBinaryDeferred !== true ||
      artifact.binaryMediaGenerated !== false
    ) {
      invalidArtifactFindings.push(`${artifact.artifactSummaryId}.videoBinaryBoundary`)
      ok = false
    }
  }
  if (artifact.generatedBinary && artifact.contentType === 'application/json') {
    invalidArtifactFindings.push(`${artifact.artifactSummaryId}.jsonMarkedBinary`)
    ok = false
  }
  if (artifact.generatedBinary && !['audio/wav', 'image/png'].includes(artifact.contentType)) {
    invalidArtifactFindings.push(`${artifact.artifactSummaryId}.unsupportedBinaryContentType`)
    ok = false
  }
  if (
    artifact.privateByDefault !== true ||
    artifact.sourceOfTruth !== true ||
    artifact.signedUrlAllowed !== false ||
    artifact.tempPathExposed !== false ||
    artifact.committedToRepo !== false ||
    artifact.externalToolExecutionPerformed !== false ||
    artifact.shellExecutionPerformed !== false ||
    artifact.workerExecutionPerformed !== false ||
    artifact.mediaProcessingPerformed !== false
  ) {
    invalidArtifactFindings.push(`${artifact.artifactSummaryId}.safetyFlags`)
    ok = false
  }

  return ok
}

function validatePlanInternal(
  plan: BinaryFixtureGenerationPlan,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  missingArtifactFields: string[],
  invalidArtifactFindings: string[],
  nonFirstClassToolIds: string[],
): boolean {
  let ok = scanObjectSafety(plan, forbiddenFieldsFound, unsafeStringValues)

  if (!validateToolId(plan.toolId, nonFirstClassToolIds)) ok = false
  if (plan.sourceDryRunArtifacts.length === 0) {
    missingArtifactFields.push(`${plan.generationPlanId}.sourceDryRunArtifacts`)
    ok = false
  }
  if (plan.allowedGenerators.length === 0) {
    missingArtifactFields.push(`${plan.generationPlanId}.allowedGenerators`)
    ok = false
  }
  if (plan.expectedArtifactTypes.length === 0) {
    missingArtifactFields.push(`${plan.generationPlanId}.expectedArtifactTypes`)
    ok = false
  }
  if (plan.expectedStorageBucketPurposes.length === 0) {
    missingArtifactFields.push(`${plan.generationPlanId}.expectedStorageBucketPurposes`)
    ok = false
  }
  if (
    plan.tempWorkspaceRequired !== true ||
    plan.cleanupRequired !== true ||
    plan.committedArtifactsAllowed !== false ||
    plan.externalToolExecutionAllowed !== false ||
    plan.shellExecutionAllowed !== false ||
    plan.workerExecutionAllowed !== false ||
    plan.mediaProcessingAllowed !== false ||
    plan.providerCallsAllowed !== false ||
    plan.supabaseMutationAllowed !== false ||
    plan.sqlAllowed !== false ||
    plan.signedUrlsAllowed !== false ||
    plan.packageLockMutationAllowed !== false ||
    plan.executesTools !== false
  ) {
    invalidArtifactFindings.push(`${plan.generationPlanId}.safetyFlags`)
    ok = false
  }

  return ok
}

function validateResultInternal(
  result: BinaryFixtureGenerationResult,
  forbiddenFieldsFound: string[],
  unsafeStringValues: string[],
  missingArtifactFields: string[],
  invalidArtifactFindings: string[],
  nonFirstClassToolIds: string[],
  uncleanedTempWorkspaces: string[],
): boolean {
  let ok = scanObjectSafety(result, forbiddenFieldsFound, unsafeStringValues)

  if (!validateToolId(result.toolId, nonFirstClassToolIds)) ok = false
  if (result.artifactSummaries.length === 0) {
    missingArtifactFields.push(`${result.generationResultId}.artifactSummaries`)
    ok = false
  }
  if (result.tempWorkspaceCleanedUp !== true) {
    uncleanedTempWorkspaces.push(result.generationResultId)
    ok = false
  }
  if (result.generatedFileCount !== result.artifactSummaries.length) {
    invalidArtifactFindings.push(`${result.generationResultId}.generatedFileCount`)
    ok = false
  }
  if (
    result.tempWorkspaceCreated !== true ||
    result.tempPathExposed !== false ||
    result.writesCommittedArtifacts !== false ||
    result.externalToolExecutionPerformed !== false ||
    result.shellExecutionPerformed !== false ||
    result.workerExecutionPerformed !== false ||
    result.mediaProcessingPerformed !== false ||
    result.providerCallsPerformed !== false ||
    result.supabaseMutationPerformed !== false ||
    result.sqlExecuted !== false ||
    result.signedUrlsCreated !== false ||
    result.packageLockMutated !== false ||
    result.executesTools !== false
  ) {
    invalidArtifactFindings.push(`${result.generationResultId}.safetyFlags`)
    ok = false
  }

  for (const artifact of result.artifactSummaries) {
    if (!validateArtifactSummaryInternal(
      artifact,
      forbiddenFieldsFound,
      unsafeStringValues,
      missingArtifactFields,
      invalidArtifactFindings,
      nonFirstClassToolIds,
    )) {
      ok = false
    }
  }

  return ok
}

export function validateBinaryFixtureGenerationPlan(
  plan: BinaryFixtureGenerationPlan,
): BinaryFixtureGenerationValidationSummary {
  const forbiddenFieldsFound: string[] = []
  const unsafeStringValues: string[] = []
  const missingArtifactFields: string[] = []
  const invalidArtifactFindings: string[] = []
  const nonFirstClassToolIds: string[] = []
  const ok = validatePlanInternal(
    plan,
    forbiddenFieldsFound,
    unsafeStringValues,
    missingArtifactFields,
    invalidArtifactFindings,
    nonFirstClassToolIds,
  )

  return summary({
    ok,
    generationPlanCount: 1,
    generationResultCount: 0,
    artifactSummaryCount: 0,
    generatedFileCount: 0,
    generatedBinaryCount: 0,
    generatedJsonCount: 0,
    descriptorOnlyCount: 0,
    videoBinaryDeferredCount: 0,
    forbiddenFieldsFound,
    unsafeStringValues,
    missingArtifactFields,
    invalidArtifactFindings,
    nonFirstClassToolIds,
    pendingExternalToolsUsed: pendingExternalToolIds().has(plan.toolId),
    uncleanedTempWorkspaces: [],
    packageLockStaged: false,
    packageLockMutated: false,
    videoBinaryOutputGenerated: false,
  })
}

export function validateBinaryFixtureGenerationResult(
  result: BinaryFixtureGenerationResult,
): BinaryFixtureGenerationValidationSummary {
  return validateBinaryFixtureGenerationResults([result])
}

export function validateBinaryFixtureGenerationResults(
  results: readonly BinaryFixtureGenerationResult[],
  plans: readonly BinaryFixtureGenerationPlan[] = [],
  options: { packageLockStaged?: boolean, packageLockMutated?: boolean } = {},
): BinaryFixtureGenerationValidationSummary {
  const forbiddenFieldsFound: string[] = []
  const unsafeStringValues: string[] = []
  const missingArtifactFields: string[] = []
  const invalidArtifactFindings: string[] = []
  const nonFirstClassToolIds: string[] = []
  const uncleanedTempWorkspaces: string[] = []
  const pendingExternalIds = pendingExternalToolIds()
  let ok = true

  for (const plan of plans) {
    if (!validatePlanInternal(
      plan,
      forbiddenFieldsFound,
      unsafeStringValues,
      missingArtifactFields,
      invalidArtifactFindings,
      nonFirstClassToolIds,
    )) {
      ok = false
    }
  }

  for (const result of results) {
    if (!validateResultInternal(
      result,
      forbiddenFieldsFound,
      unsafeStringValues,
      missingArtifactFields,
      invalidArtifactFindings,
      nonFirstClassToolIds,
      uncleanedTempWorkspaces,
    )) {
      ok = false
    }
  }

  const artifactSummaries = results.flatMap((result) => result.artifactSummaries)
  const pendingExternalToolsUsed = results.some((result) => pendingExternalIds.has(result.toolId)) ||
    artifactSummaries.some((artifact) => pendingExternalIds.has(artifact.toolId)) ||
    plans.some((plan) => pendingExternalIds.has(plan.toolId))
  const videoBinaryOutputGenerated = artifactSummaries.some((artifact) => (
    artifact.fixtureKind === 'synthetic_video' &&
    (artifact.generatedBinary || artifact.binaryMediaGenerated || artifact.contentType !== 'application/json')
  ))

  if (pendingExternalToolsUsed || nonFirstClassToolIds.length > 0 || videoBinaryOutputGenerated) ok = false
  if (options.packageLockStaged || options.packageLockMutated) ok = false
  if (forbiddenFieldsFound.length > 0 || unsafeStringValues.length > 0) ok = false
  if (missingArtifactFields.length > 0 || invalidArtifactFindings.length > 0) ok = false
  if (uncleanedTempWorkspaces.length > 0) ok = false

  return summary({
    ok,
    generationPlanCount: plans.length,
    generationResultCount: results.length,
    artifactSummaryCount: artifactSummaries.length,
    generatedFileCount: results.reduce((count, result) => count + result.generatedFileCount, 0),
    generatedBinaryCount: artifactSummaries.filter((artifact) => artifact.generatedBinary).length,
    generatedJsonCount: artifactSummaries.filter((artifact) => artifact.contentType === 'application/json').length,
    descriptorOnlyCount: artifactSummaries.filter((artifact) => artifact.descriptorOnly).length,
    videoBinaryDeferredCount: artifactSummaries.filter((artifact) => artifact.videoBinaryDeferred).length,
    forbiddenFieldsFound,
    unsafeStringValues,
    missingArtifactFields,
    invalidArtifactFindings,
    nonFirstClassToolIds: [...new Set(nonFirstClassToolIds)].sort(),
    pendingExternalToolsUsed,
    uncleanedTempWorkspaces,
    packageLockStaged: options.packageLockStaged === true,
    packageLockMutated: options.packageLockMutated === true,
    videoBinaryOutputGenerated,
  })
}
