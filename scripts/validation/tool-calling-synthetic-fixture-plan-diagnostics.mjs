import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tsImport } from 'tsx/esm/api'

function check(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function runGit(args) {
  const env = { ...process.env }
  delete env.DEVELOPER_DIR

  return execFileSync('git', args, {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex')
}

function collectKeysDeep(value, path = '$', keys = []) {
  if (!value || typeof value !== 'object') return keys
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectKeysDeep(item, `${path}[${index}]`, keys))
    return keys
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    keys.push({ key, path: `${path}.${key}` })
    collectKeysDeep(nestedValue, `${path}.${key}`, keys)
  }

  return keys
}

function collectStringValues(value, path = '$', values = []) {
  if (typeof value === 'string') {
    values.push({ path, value })
    return values
  }
  if (!value || typeof value !== 'object') return values
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStringValues(item, `${path}[${index}]`, values))
    return values
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    collectStringValues(nestedValue, `${path}.${key}`, values)
  }

  return values
}

function looksLikeAbsoluteLocalPath(value) {
  return value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value)
}

function looksLikeHttpUrl(value) {
  return /^https?:\/\//i.test(value)
}

function hasShellMetacharacters(value) {
  return /&&|\|\||[|;`<>]|\$\(|\r|\n/.test(value)
}

const {
  FORBIDDEN_SYNTHETIC_FIXTURE_PLAN_KEYS,
  INITIAL_PIPELINE_PATTERN_IDS,
  buildSyntheticFixturePlansForCommandPlans,
  buildToolCallingPlanWithAdaptersAndCommandPlans,
  buildToolCallingPlanWithAdaptersCommandPlansAndFixtures,
  listCommandIntentPolicies,
  listRuntimeIdReconciliationResults,
  listSyntheticFixtureDefinitions,
  validateSyntheticFixturePlans,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const {
  PRODUCTION_TOOL_IDS,
} = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

check(existsSync('docs/tool-calling/repo-refresh-gate-policy.v1.md'), 'Refresh gate policy doc must exist.')
check(existsSync('docs/tool-calling/repo-refresh-gate-report.md'), 'Refresh gate report doc must exist.')
check(existsSync('docs/tool-calling/synthetic-fixture-plan.v1.md'), 'Synthetic fixture plan doc must exist.')
check(existsSync('docs/tool-calling/synthetic-fixture-plan.schema.v1.json'), 'Synthetic fixture plan schema must exist.')
check(existsSync('docs/tool-calling/synthetic-fixture-catalog.v1.json'), 'Synthetic fixture catalog JSON must exist.')

const catalogJson = JSON.parse(await readFile('docs/tool-calling/synthetic-fixture-catalog.v1.json', 'utf8'))
check(catalogJson.schema === 'reeditpro.synthetic-fixture-catalog.v1', 'Synthetic fixture catalog schema marker must match.')
check(Array.isArray(catalogJson.fixtureDefinitions), 'Synthetic fixture catalog must expose fixtureDefinitions.')

const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
const commandIntentPolicies = listCommandIntentPolicies()
const commandIntentPolicyIds = new Set(commandIntentPolicies.map((policy) => policy.commandIntentId))
const fixtureDefinitions = listSyntheticFixtureDefinitions()
const fixtureDefinitionIds = new Set(fixtureDefinitions.map((definition) => definition.fixtureId))
const catalogFixtureDefinitionIds = new Set(catalogJson.fixtureDefinitions.map((definition) => definition.fixtureId))
const pendingExternalToolIds = new Set(
  listRuntimeIdReconciliationResults()
    .filter((result) => result.status === 'pending_production_tool_registry_expansion')
    .map((result) => result.externalToolId ?? result.inputToolId),
)

check(fixtureDefinitions.length === 12, 'Synthetic fixture catalog must expose 12 fixture definitions.')
check(fixtureDefinitionIds.size === fixtureDefinitions.length, 'Synthetic fixture IDs must be unique.')
check(catalogFixtureDefinitionIds.size === fixtureDefinitionIds.size, 'JSON fixture catalog IDs must be unique.')
for (const fixtureId of fixtureDefinitionIds) {
  check(catalogFixtureDefinitionIds.has(fixtureId), `${fixtureId} must be present in the JSON fixture catalog.`)
}

const forbiddenKeySet = new Set(FORBIDDEN_SYNTHETIC_FIXTURE_PLAN_KEYS)
const forbiddenFieldsFound = []
const unsafeValueFindings = []

for (const definition of fixtureDefinitions) {
  check(definition.generatedInFutureOnly === true, `${definition.fixtureId} must be future-only.`)
  check(definition.fixtureGenerationAllowedNow === false, `${definition.fixtureId} must forbid fixture generation now.`)
  check(definition.toolExecutionAllowedNow === false, `${definition.fixtureId} must forbid tool execution now.`)
  check(definition.mediaProcessingAllowedNow === false, `${definition.fixtureId} must forbid media processing now.`)
  check(definition.workerExecutionAllowedNow === false, `${definition.fixtureId} must forbid worker execution now.`)
  check(definition.privateArtifactRefsOnly === true, `${definition.fixtureId} must require private artifact refs.`)
  check(definition.signedUrlsAllowed === false, `${definition.fixtureId} must forbid signed URLs.`)
  check(definition.rawPromptAllowed === false, `${definition.fixtureId} must forbid raw prompts.`)
  check(definition.expectedArtifactTypes.length > 0, `${definition.fixtureId} must define expected artifact types.`)
  check(definition.expectedStorageBucketPurposes.length > 0, `${definition.fixtureId} must define expected storage bucket purposes.`)
  check(definition.requiredQualityGates.length > 0, `${definition.fixtureId} must define required quality gates.`)
  check(definition.applicableCommandIntentIds.length > 0, `${definition.fixtureId} must map command intents.`)
  check(definition.applicableToolIds.every((toolId) => productionToolIds.has(toolId)), `${definition.fixtureId} must use first-class tools only.`)
  check(!definition.applicableToolIds.some((toolId) => pendingExternalToolIds.has(toolId)), `${definition.fixtureId} must not use pending external tools.`)
}

for (const policy of commandIntentPolicies) {
  const matchingDefinitions = fixtureDefinitions
    .filter((definition) => definition.applicableCommandIntentIds.includes(policy.commandIntentId))
  check(matchingDefinitions.length > 0, `${policy.commandIntentId} must have at least one synthetic fixture definition.`)
}
check(commandIntentPolicyIds.size === commandIntentPolicies.length, 'Command intent policy IDs must remain unique.')

const patternSummaries = []
const allCommandPlans = []
const allFixturePlans = []

for (const patternId of INITIAL_PIPELINE_PATTERN_IDS) {
  const request = {
    projectId: `synthetic_fixture_plan_${patternId}`,
    mode: patternId === 'final_export_validation' ? 'final_export' : 'preview',
    qualityTarget: 'balanced',
    requestedPatternId: patternId,
    userPreferenceTags: ['professional', 'synthetic_fixture_safe'],
    mediaContext: {
      mediaTypes: ['video', 'audio'],
      hasAudio: true,
      hasSpeech: true,
      hasMotion: true,
    },
  }

  const withCommandPlans = buildToolCallingPlanWithAdaptersAndCommandPlans(request)
  const directFixturePlans = buildSyntheticFixturePlansForCommandPlans(withCommandPlans.safeCommandPlans)
  const withFixtures = buildToolCallingPlanWithAdaptersCommandPlansAndFixtures({
    ...request,
    projectId: `synthetic_fixture_plan_wrapper_${patternId}`,
  })

  check(
    directFixturePlans.length === withCommandPlans.safeCommandPlans.length,
    `${patternId} must produce one synthetic fixture plan per safe command plan.`,
  )
  check(
    withFixtures.syntheticFixturePlans.length === directFixturePlans.length,
    `${patternId} wrapper fixture plan count must match direct builder count.`,
  )
  check(withFixtures.fixtureValidationSummary.ok === true, `${patternId} fixture validation must pass.`)
  check(withFixtures.executesTools === false, `${patternId} wrapper must not execute tools.`)

  const directIds = directFixturePlans.map((plan) => plan.fixturePlanId).sort()
  const wrapperIds = withFixtures.syntheticFixturePlans.map((plan) => plan.fixturePlanId).sort()
  check(JSON.stringify(directIds) === JSON.stringify(wrapperIds), `${patternId} wrapper fixture plan IDs must match direct builder.`)

  validateSyntheticFixturePlans(directFixturePlans)

  allCommandPlans.push(...withCommandPlans.safeCommandPlans)
  allFixturePlans.push(...directFixturePlans)
  patternSummaries.push({
    patternId,
    commandPlanCount: withCommandPlans.safeCommandPlans.length,
    fixturePlanCount: directFixturePlans.length,
    selectedTools: [...new Set(directFixturePlans.map((plan) => plan.toolId))].sort(),
  })
}

for (const plan of allFixturePlans) {
  check(plan.fixtureDefinitions.length > 0, `${plan.fixturePlanId} must include fixture definitions.`)
  check(plan.fixtureIds.length > 0, `${plan.fixturePlanId} must include fixture IDs.`)
  check(productionToolIds.has(plan.toolId), `${plan.fixturePlanId} must use a first-class ProductionToolId.`)
  check(!pendingExternalToolIds.has(plan.toolId), `${plan.fixturePlanId} must not use pending external tools.`)
  check(plan.generatedInFutureOnly === true, `${plan.fixturePlanId} must be future-only.`)
  check(plan.fixtureGenerationAllowedNow === false, `${plan.fixturePlanId} must forbid fixture generation now.`)
  check(plan.toolExecutionAllowedNow === false, `${plan.fixturePlanId} must forbid tool execution now.`)
  check(plan.mediaProcessingAllowedNow === false, `${plan.fixturePlanId} must forbid media processing now.`)
  check(plan.workerExecutionAllowedNow === false, `${plan.fixturePlanId} must forbid worker execution now.`)
  check(plan.privateArtifactRefsOnly === true, `${plan.fixturePlanId} must require private artifact refs.`)
  check(plan.signedUrlsAllowed === false, `${plan.fixturePlanId} must forbid signed URLs.`)
  check(plan.rawPromptAllowed === false, `${plan.fixturePlanId} must forbid raw prompts.`)
  check(plan.executesTools === false, `${plan.fixturePlanId} must not execute tools.`)
  check(plan.expectedOutputArtifacts.length > 0, `${plan.fixturePlanId} must expect output artifacts.`)
  check(plan.requiredQualityGates.length > 0, `${plan.fixturePlanId} must require quality gates.`)

  for (const entry of collectKeysDeep(plan)) {
    if (forbiddenKeySet.has(entry.key)) {
      forbiddenFieldsFound.push(entry.path)
    }
  }

  for (const entry of collectStringValues(plan)) {
    if (
      looksLikeAbsoluteLocalPath(entry.value) ||
      looksLikeHttpUrl(entry.value) ||
      hasShellMetacharacters(entry.value)
    ) {
      unsafeValueFindings.push(entry.path)
    }
  }
}

check(forbiddenFieldsFound.length === 0, `Synthetic fixture plans contain forbidden fields: ${forbiddenFieldsFound.join(', ')}`)
check(unsafeValueFindings.length === 0, `Synthetic fixture plans contain unsafe values: ${unsafeValueFindings.join(', ')}`)

const validationSummary = validateSyntheticFixturePlans(allFixturePlans)
check(validationSummary.ok === true, 'Synthetic fixture plan validation summary must pass.')
check(validationSummary.forbiddenFieldsFound.length === 0, 'Synthetic fixture validation must find no forbidden fields.')
check(validationSummary.pendingExternalToolsUsed === false, 'Synthetic fixture validation must not use pending external tools.')
check(validationSummary.allFixturesFutureOnly === true, 'Synthetic fixture validation must be future-only.')

const duplicateSystemPaths = [
  'server/tool-calling/production-tool-registry.ts',
  'server/tool-calling/tool-registry.ts',
  'server/tool-calling/tool-qa-policy.ts',
  'server/tool-calling/tool-fallback-policy.ts',
  'server/tool-calling/production-worker-router.ts',
  'server/tool-calling/adapter-registry-copy.ts',
  'server/tool-calling/safe-command-plan-policy-copy.ts',
  'server/tool-calling/runtime-contract-tables.ts',
  'server/tool-calling/tool-execution-plan-table.ts',
  'server/tool-calling/tool-execution-tables.ts',
  'server/tool-calling/worker-job-tables.ts',
  'server/tool-calling/supabase-tool-execution-tables.ts',
]
const duplicateSystemFiles = duplicateSystemPaths.filter((filePath) => existsSync(filePath))
check(duplicateSystemFiles.length === 0, `Duplicate production systems must not exist: ${duplicateSystemFiles.join(', ')}`)

const stagedFiles = runGit(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
const packageLockStaged = stagedFiles.includes('package-lock.json')
check(!packageLockStaged, 'package-lock.json must not be staged.')

const packageLock = await readFile('package-lock.json', 'utf8')
const packageLockSha256 = hashContent(packageLock)

const coveredCommandIntentIds = [...new Set(allFixturePlans.map((plan) => plan.commandIntentId))].sort()
const coveredOperations = [...new Set(allFixturePlans.map((plan) => plan.operationId))].sort()
const coveredTools = [...new Set(allFixturePlans.map((plan) => plan.toolId))].sort()
const pendingExternalToolsUsed = allFixturePlans.some((plan) => pendingExternalToolIds.has(plan.toolId))

console.log(JSON.stringify({
  ok: true,
  patternSummaries,
  fixtureDefinitionCount: fixtureDefinitions.length,
  fixturePlanCount: allFixturePlans.length,
  commandPlanCount: allCommandPlans.length,
  coveredCommandIntentIds,
  coveredOperations,
  coveredTools,
  allFixturesFutureOnly: true,
  fixtureGenerationAllowedNow: false,
  toolExecutionAllowedNow: false,
  mediaProcessingAllowedNow: false,
  workerExecutionAllowedNow: false,
  executesTools: false,
  pendingExternalToolsUsed,
  forbiddenFieldsFound,
  unsafeValueFindings,
  duplicateSystemsCreated: duplicateSystemFiles.length > 0,
  duplicateSystemFiles,
  packageLock: {
    sha256: packageLockSha256,
    staged: packageLockStaged,
  },
}, null, 2))
