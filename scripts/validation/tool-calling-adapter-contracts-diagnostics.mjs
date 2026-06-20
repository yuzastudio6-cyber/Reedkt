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

function checkNoForbiddenKeys(value, forbiddenKeys, label) {
  const matches = collectKeysDeep(value)
    .filter((entry) => forbiddenKeys.has(entry.key))

  check(
    matches.length === 0,
    `${label} contains forbidden execution-shaped keys: ${matches.map((entry) => entry.path).join(', ')}`,
  )
}

const {
  INITIAL_PIPELINE_PATTERN_IDS,
  buildAdapterPlanForPipeline,
  buildToolCallingPlan,
  buildToolCallingPlanWithAdapters,
  getToolAdapterContract,
  listPendingAdapterContractTools,
  listRuntimeIdReconciliationResults,
  listToolAdapterContracts,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const {
  PRODUCTION_TOOL_IDS,
} = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const refreshGatePolicyExists = existsSync('docs/tool-calling/repo-refresh-gate-policy.v1.md')
const refreshGateReportExists = existsSync('docs/tool-calling/repo-refresh-gate-report.md')
check(refreshGatePolicyExists, 'Refresh gate policy doc must exist.')
check(refreshGateReportExists, 'Refresh gate report doc must exist.')

const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
const contracts = listToolAdapterContracts()
const adapterContractToolIds = new Set(contracts.map((contract) => contract.toolId))
const runtimeReconciliationResults = listRuntimeIdReconciliationResults()
const pendingAdapterContractTools = listPendingAdapterContractTools()
const pendingExternalToolIds = new Set(
  runtimeReconciliationResults
    .filter((result) => result.status === 'pending_production_tool_registry_expansion')
    .map((result) => result.externalToolId ?? result.inputToolId),
)

check(contracts.length === 18, 'Adapter contract milestone must expose 18 first-class contracts.')

for (const contract of contracts) {
  check(productionToolIds.has(contract.toolId), `${contract.adapterId} toolId must be a first-class ProductionToolId.`)
  check(contract.adapterId === `tool_adapter_${contract.toolId}_v1`, `${contract.toolId} adapterId must be stable.`)
  check(contract.supportedOperationIds.length > 0, `${contract.adapterId} must support at least one operation.`)
  check(contract.acceptedInputArtifacts.length > 0, `${contract.adapterId} must accept input artifacts.`)
  check(contract.producedOutputArtifacts.length > 0, `${contract.adapterId} must produce output artifacts.`)
  check(contract.executionMode === 'planning_only', `${contract.adapterId} must be planning_only.`)
  check(contract.planningOnly === true, `${contract.adapterId} must set planningOnly true.`)
  check(contract.commandExecutionAllowed === false, `${contract.adapterId} must forbid command execution.`)
  check(contract.mediaProcessingAllowed === false, `${contract.adapterId} must forbid media processing.`)
  check(contract.requiresFirstClassProductionToolId === true, `${contract.adapterId} must require ProductionToolId.`)
}

const pendingExternalToolsHaveAdapters = [...pendingExternalToolIds]
  .some((externalToolId) => adapterContractToolIds.has(externalToolId))
check(!pendingExternalToolsHaveAdapters, 'Pending external tools must not have adapter contracts.')

const duplicateSystemPaths = [
  'server/tool-calling/production-tool-registry.ts',
  'server/tool-calling/tool-registry.ts',
  'server/tool-calling/tool-qa-policy.ts',
  'server/tool-calling/tool-fallback-policy.ts',
  'server/tool-calling/production-worker-router.ts',
  'server/tool-calling/tool-execution-plan-table.ts',
  'server/tool-calling/tool-execution-tables.ts',
  'server/tool-calling/runtime-contract-tables.ts',
  'server/tool-calling/supabase-tool-execution-tables.ts',
]
const duplicateSystemFiles = duplicateSystemPaths.filter((filePath) => existsSync(filePath))
check(duplicateSystemFiles.length === 0, `Duplicate production systems must not exist: ${duplicateSystemFiles.join(', ')}`)

const forbiddenExactKeys = new Set([
  'rawPrompt',
  'signedUrl',
  'signed_url',
  'serviceRole',
  'service_role',
  'arbitraryArgs',
  'arbitrary_args',
  'command',
  'cmd',
  'args',
  'argv',
  'binary',
  'executable',
  'shell',
  'shellCommand',
  'shell_command',
  'rawCommand',
  'raw_command',
  'outputPath',
  'output_path',
  'outputLocalPath',
  'localOutputPath',
  'writePath',
  'write_path',
])

const plans = INITIAL_PIPELINE_PATTERN_IDS.map((patternId) => buildToolCallingPlan({
  projectId: `adapter_contracts_${patternId}`,
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
}))

const adapterPipelinePlans = plans.map((plan) => buildAdapterPlanForPipeline(plan.pipeline))
const augmentedPlans = INITIAL_PIPELINE_PATTERN_IDS.map((patternId) => buildToolCallingPlanWithAdapters({
  projectId: `adapter_contracts_augmented_${patternId}`,
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
}))

const selectedToolIds = new Set(plans.flatMap((plan) => plan.pipeline.steps.map((step) => step.selectedToolId)))
const selectedToolsMissingAdapters = [...selectedToolIds]
  .filter((toolId) => !getToolAdapterContract(toolId))
  .sort()
const allSelectedToolsHaveAdapters = selectedToolsMissingAdapters.length === 0
check(allSelectedToolsHaveAdapters, `Selected tools missing adapter contracts: ${selectedToolsMissingAdapters.join(', ')}`)

let adapterPlanCount = 0
let workerRouteBridgePlanCount = 0
let selectedToolsAreFirstClassProductionToolIds = true
let pendingExternalToolsSelected = false

for (const [index, plan] of plans.entries()) {
  const adapterPipelinePlan = adapterPipelinePlans[index]
  const augmentedPlan = augmentedPlans[index]

  check(plan.executesTools === false, `${plan.planId} must remain planning-only.`)
  check(adapterPipelinePlan.planningOnly === true, `${adapterPipelinePlan.adapterPipelinePlanId} must be planning-only.`)
  check(adapterPipelinePlan.executesTools === false, `${adapterPipelinePlan.adapterPipelinePlanId} must not execute tools.`)
  check(adapterPipelinePlan.mediaProcessingAllowed === false, `${adapterPipelinePlan.adapterPipelinePlanId} must not process media.`)
  check(
    augmentedPlan.adapterPlan.adapterPlans.length === adapterPipelinePlan.adapterPlans.length,
    `${augmentedPlan.planId} adapter plan count must match direct adapter planner output.`,
  )

  checkNoForbiddenKeys(adapterPipelinePlan, forbiddenExactKeys, adapterPipelinePlan.adapterPipelinePlanId)

  adapterPlanCount += adapterPipelinePlan.adapterPlans.length
  workerRouteBridgePlanCount += adapterPipelinePlan.workerRouteBridgePlans.length

  for (const step of plan.pipeline.steps) {
    selectedToolsAreFirstClassProductionToolIds = selectedToolsAreFirstClassProductionToolIds &&
      productionToolIds.has(step.selectedToolId)
    pendingExternalToolsSelected = pendingExternalToolsSelected || pendingExternalToolIds.has(step.selectedToolId)
  }

  for (const adapterPlan of adapterPipelinePlan.adapterPlans) {
    check(adapterPlan.executionMode === 'planning_only', `${adapterPlan.adapterPlanId} must be planning_only.`)
    check(adapterPlan.executesTools === false, `${adapterPlan.adapterPlanId} must not execute tools.`)
    check(adapterPlan.mediaProcessingAllowed === false, `${adapterPlan.adapterPlanId} must not process media.`)
    check(productionToolIds.has(adapterPlan.toolId), `${adapterPlan.adapterPlanId} must target ProductionToolId.`)
    check(!pendingExternalToolIds.has(adapterPlan.toolId), `${adapterPlan.adapterPlanId} must not target pending external tool.`)
    check(adapterPlan.inputArtifactRefs.every((ref) => ref.source === 'pipeline_expected_input'), `${adapterPlan.adapterPlanId} must use structured input artifact refs.`)
    check(adapterPlan.commandPlanPreview?.shellCommandStringsAllowed === false, `${adapterPlan.adapterPlanId} must forbid shell command strings.`)
    check(adapterPlan.commandPlanPreview?.arbitraryArgsAllowed === false, `${adapterPlan.adapterPlanId} must forbid arbitrary args.`)
    check(adapterPlan.commandPlanPreview?.directOutputPathWritesAllowed === false, `${adapterPlan.adapterPlanId} must forbid direct output path writes.`)
  }

  for (const bridgePlan of adapterPipelinePlan.workerRouteBridgePlans) {
    check(bridgePlan.approvedSnapshotRequired === true, `${bridgePlan.sourcePipelineStepId} bridge must require approved snapshot.`)
    check(bridgePlan.rawPromptAllowed === false, `${bridgePlan.sourcePipelineStepId} bridge must disallow raw prompt payloads.`)
    check(bridgePlan.signedUrlAllowed === false, `${bridgePlan.sourcePipelineStepId} bridge must disallow signed URL payloads.`)
    check(bridgePlan.serviceRoleAllowed === false, `${bridgePlan.sourcePipelineStepId} bridge must disallow service-role payloads.`)
    check(bridgePlan.executesTools === false, `${bridgePlan.sourcePipelineStepId} bridge must not execute tools.`)
  }
}

check(selectedToolsAreFirstClassProductionToolIds, 'Selected tools must all be first-class ProductionToolId values.')
check(!pendingExternalToolsSelected, 'Pending external tools must never be selected.')

const stagedFiles = runGit(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
const packageLockStaged = stagedFiles.includes('package-lock.json')
check(!packageLockStaged, 'package-lock.json must not be staged.')

const packageLock = await readFile('package-lock.json', 'utf8')
const packageLockSha256 = hashContent(packageLock)

const coveredOperations = [...new Set(contracts.flatMap((contract) => contract.supportedOperationIds))].sort()

console.log(JSON.stringify({
  ok: true,
  adapterContractCount: contracts.length,
  adapterPlanCount,
  workerRouteBridgePlanCount,
  coveredOperations,
  pendingAdapterContractTools,
  selectedToolsMissingAdapters,
  allSelectedToolsHaveAdapters,
  selectedToolsAreFirstClassProductionToolIds,
  pendingExternalToolsSelected,
  pendingExternalToolsHaveAdapters,
  planningOnly: true,
  executesTools: false,
  duplicateSystemsCreated: false,
  duplicateSystemFiles,
  refreshGatePolicyExists,
  refreshGateReportExists,
  packageLock: {
    sha256: packageLockSha256,
    staged: packageLockStaged,
  },
}, null, 2))
