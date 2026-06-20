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
  FORBIDDEN_SAFE_COMMAND_PLAN_KEYS,
  INITIAL_PIPELINE_PATTERN_IDS,
  buildSafeCommandPlansForAdapterPlans,
  buildToolCallingPlanWithAdapters,
  buildToolCallingPlanWithAdaptersAndCommandPlans,
  listCommandIntentPolicies,
  listRuntimeIdReconciliationResults,
  validateSafeCommandPlans,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const {
  PRODUCTION_TOOL_IDS,
} = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

check(existsSync('docs/tool-calling/repo-refresh-gate-policy.v1.md'), 'Refresh gate policy doc must exist.')
check(existsSync('docs/tool-calling/repo-refresh-gate-report.md'), 'Refresh gate report doc must exist.')
check(existsSync('docs/tool-calling/safe-command-plan.v1.md'), 'Safe command-plan doc must exist.')
check(existsSync('docs/tool-calling/safe-command-plan.schema.v1.json'), 'Safe command-plan schema must exist.')

const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
const commandIntentPolicies = listCommandIntentPolicies()
const commandIntentPolicyIds = new Set(commandIntentPolicies.map((policy) => policy.commandIntentId))
const pendingExternalToolIds = new Set(
  listRuntimeIdReconciliationResults()
    .filter((result) => result.status === 'pending_production_tool_registry_expansion')
    .map((result) => result.externalToolId ?? result.inputToolId),
)

check(commandIntentPolicies.length === 31, 'Safe command-plan milestone must expose 31 command intent policies.')
check(commandIntentPolicyIds.size === commandIntentPolicies.length, 'Command intent policy IDs must be unique.')

for (const policy of commandIntentPolicies) {
  check(productionToolIds.has(policy.toolId), `${policy.commandIntentId} must target a first-class ProductionToolId.`)
  check(policy.supportedOperationIds.length > 0, `${policy.commandIntentId} must support operations.`)
  check(policy.allowedParameterSchema.additionalParametersAllowed === false, `${policy.commandIntentId} must reject additional parameters.`)
  check(policy.resourceLimits.networkAllowed === false, `${policy.commandIntentId} must forbid network access.`)
  check(policy.resourceLimits.privateStorageOnly === true, `${policy.commandIntentId} must require private storage.`)
  check(policy.sandboxProfile.networkAllowed === false, `${policy.commandIntentId} sandbox must forbid network access.`)
  check(policy.sandboxProfile.signedUrlsAllowed === false, `${policy.commandIntentId} sandbox must forbid signed URLs.`)
  check(policy.sandboxProfile.rawPromptAllowed === false, `${policy.commandIntentId} sandbox must forbid raw prompts.`)
  check(policy.sandboxProfile.arbitraryArgsAllowed === false, `${policy.commandIntentId} sandbox must forbid arbitrary args.`)
}

const forbiddenKeySet = new Set(FORBIDDEN_SAFE_COMMAND_PLAN_KEYS)
const forbiddenFieldsFound = []
const unsafeValueFindings = []
const unsafeOutputExpectations = []

const patternSummaries = []
const allSafeCommandPlans = []
let adapterPlanCount = 0

for (const patternId of INITIAL_PIPELINE_PATTERN_IDS) {
  const withAdapters = buildToolCallingPlanWithAdapters({
    projectId: `safe_command_plan_${patternId}`,
    mode: patternId === 'final_export_validation' ? 'final_export' : 'preview',
    qualityTarget: 'balanced',
    requestedPatternId: patternId,
    userPreferenceTags: ['professional', 'safe'],
    mediaContext: {
      mediaTypes: ['video', 'audio'],
      hasAudio: true,
      hasSpeech: true,
      hasMotion: true,
    },
  })

  const directCommandPlans = buildSafeCommandPlansForAdapterPlans(withAdapters.adapterPlan.adapterPlans)
  const withCommandPlans = buildToolCallingPlanWithAdaptersAndCommandPlans({
    projectId: `safe_command_plan_wrapper_${patternId}`,
    mode: patternId === 'final_export_validation' ? 'final_export' : 'preview',
    qualityTarget: 'balanced',
    requestedPatternId: patternId,
    userPreferenceTags: ['professional', 'safe'],
    mediaContext: {
      mediaTypes: ['video', 'audio'],
      hasAudio: true,
      hasSpeech: true,
      hasMotion: true,
    },
  })

  check(
    directCommandPlans.length === withAdapters.adapterPlan.adapterPlans.length,
    `${patternId} must produce one safe command plan per adapter plan.`,
  )
  check(
    withCommandPlans.safeCommandPlans.length === directCommandPlans.length,
    `${patternId} wrapper command plans must match direct builder count.`,
  )
  check(
    withCommandPlans.commandPlanValidationSummary.ok === true,
    `${patternId} wrapper command plan validation must pass.`,
  )

  const directIds = directCommandPlans.map((plan) => plan.commandPlanId).sort()
  const wrapperIds = withCommandPlans.safeCommandPlans.map((plan) => plan.commandPlanId).sort()
  check(JSON.stringify(directIds) === JSON.stringify(wrapperIds), `${patternId} wrapper command plan IDs must match direct builder.`)

  validateSafeCommandPlans(directCommandPlans)

  adapterPlanCount += withAdapters.adapterPlan.adapterPlans.length
  allSafeCommandPlans.push(...directCommandPlans)
  patternSummaries.push({
    patternId,
    adapterPlanCount: withAdapters.adapterPlan.adapterPlans.length,
    commandPlanCount: directCommandPlans.length,
    selectedTools: [...new Set(directCommandPlans.map((plan) => plan.toolId))].sort(),
  })
}

for (const plan of allSafeCommandPlans) {
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

  for (const expectation of plan.outputArtifactExpectations) {
    const keys = Object.keys(expectation)
    if (
      !keys.includes('artifactType') ||
      !keys.includes('storageBucketPurpose') ||
      !keys.includes('storageReferenceRequired') ||
      keys.some((key) => key.toLowerCase().includes('path'))
    ) {
      unsafeOutputExpectations.push(`${plan.commandPlanId}:${expectation.artifactType}`)
    }
  }

  check(productionToolIds.has(plan.toolId), `${plan.commandPlanId} must use first-class ProductionToolId.`)
  check(!pendingExternalToolIds.has(plan.toolId), `${plan.commandPlanId} must not use pending external tools.`)
  check(plan.approvedSnapshotRequired === true, `${plan.commandPlanId} must require approved snapshots.`)
  check(plan.privateArtifactRefsOnly === true, `${plan.commandPlanId} must use private artifact refs only.`)
  check(plan.rawPromptAllowed === false, `${plan.commandPlanId} must reject raw prompts.`)
  check(plan.signedUrlAllowed === false, `${plan.commandPlanId} must reject signed URLs.`)
  check(plan.arbitraryArgsAllowed === false, `${plan.commandPlanId} must reject arbitrary args.`)
  check(plan.commandExecutionAllowed === false, `${plan.commandPlanId} must reject command execution.`)
  check(plan.mediaProcessingAllowed === false, `${plan.commandPlanId} must reject media processing.`)
  check(plan.executesTools === false, `${plan.commandPlanId} must not execute tools.`)
  check(plan.executionMode === 'planning_only', `${plan.commandPlanId} must be planning_only.`)
}

check(forbiddenFieldsFound.length === 0, `Safe command plans contain forbidden fields: ${forbiddenFieldsFound.join(', ')}`)
check(unsafeValueFindings.length === 0, `Safe command plans contain unsafe values: ${unsafeValueFindings.join(', ')}`)
check(unsafeOutputExpectations.length === 0, `Safe command plans contain unsafe output expectations: ${unsafeOutputExpectations.join(', ')}`)

const duplicateSystemPaths = [
  'server/tool-calling/production-tool-registry.ts',
  'server/tool-calling/tool-registry.ts',
  'server/tool-calling/tool-qa-policy.ts',
  'server/tool-calling/tool-fallback-policy.ts',
  'server/tool-calling/production-worker-router.ts',
  'server/tool-calling/adapter-registry-copy.ts',
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

const coveredTools = [...new Set(allSafeCommandPlans.map((plan) => plan.toolId))].sort()
const coveredOperations = [...new Set(allSafeCommandPlans.map((plan) => plan.operationId))].sort()
const pendingExternalToolsUsed = allSafeCommandPlans.some((plan) => pendingExternalToolIds.has(plan.toolId))
const validationSummary = validateSafeCommandPlans(allSafeCommandPlans)

console.log(JSON.stringify({
  ok: true,
  patternSummaries,
  commandIntentPolicyCount: commandIntentPolicies.length,
  commandPlanCount: allSafeCommandPlans.length,
  adapterPlanCount,
  coveredTools,
  coveredOperations,
  allCommandPlansPlanningOnly: validationSummary.allCommandPlansPlanningOnly,
  executesTools: false,
  commandExecutionAllowed: false,
  mediaProcessingAllowed: false,
  pendingExternalToolsUsed,
  forbiddenFieldsFound,
  unsafeValueFindings,
  unsafeOutputExpectations,
  duplicateSystemsCreated: false,
  duplicateSystemFiles,
  packageLock: {
    sha256: packageLockSha256,
    staged: packageLockStaged,
  },
}, null, 2))
