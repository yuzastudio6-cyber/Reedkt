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

function hasKeyDeep(value, keyName) {
  if (!value || typeof value !== 'object') return false
  if (Object.prototype.hasOwnProperty.call(value, keyName)) return true
  if (Array.isArray(value)) return value.some((item) => hasKeyDeep(item, keyName))
  return Object.values(value).some((item) => hasKeyDeep(item, keyName))
}

const {
  DEFAULT_RANKING_WEIGHTS,
  INITIAL_PIPELINE_PATTERN_IDS,
  buildToolCallingPlan,
  listToolCapabilityCards,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const {
  PRODUCTION_TOOL_IDS,
} = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
const cards = listToolCapabilityCards()

check(cards.length === productionToolIds.size, 'Capability cards must map the existing production registry one-to-one.')

const duplicateSystemPaths = [
  'server/tool-calling/production-tool-registry.ts',
  'server/tool-calling/tool-registry.ts',
  'server/tool-calling/tool-qa-policy.ts',
  'server/tool-calling/tool-fallback-policy.ts',
  'server/tool-calling/production-worker-router.ts',
]

for (const filePath of duplicateSystemPaths) {
  check(!existsSync(filePath), `Duplicate production system file must not exist: ${filePath}`)
}

const rankingDimensionNames = Object.keys(DEFAULT_RANKING_WEIGHTS)
const coordinationLabelPattern = /track\s+[ab]/i
check(
  rankingDimensionNames.every((dimensionName) => !coordinationLabelPattern.test(dimensionName)),
  'Ranking dimensions must not use coordination labels.',
)

const plans = INITIAL_PIPELINE_PATTERN_IDS.map((patternId) => buildToolCallingPlan({
  projectId: `diagnostics_${patternId}`,
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

for (const plan of plans) {
  check(plan.executesTools === false, `${plan.planId} must be planning-only.`)
  check(plan.diagnostics.executesTools === false, `${plan.planId} diagnostics must be planning-only.`)
  check(plan.pipeline.steps.length > 0, `${plan.planId} must include pipeline steps.`)
  check(!hasKeyDeep(plan, 'rawPrompt'), `${plan.planId} must not contain rawPrompt.`)
  check(!JSON.stringify(plan).includes('rawPrompt'), `${plan.planId} must not serialize rawPrompt.`)

  for (const step of plan.pipeline.steps) {
    check(Boolean(step.operationId), `${step.stepId} must include an operationId.`)
    check(Boolean(step.selectedToolId), `${step.stepId} must include a selectedToolId.`)
    check(Array.isArray(step.fallbackToolIds), `${step.stepId} must include fallbackToolIds.`)
    check(step.expectedInputArtifacts.length > 0, `${step.stepId} must include expected input artifacts.`)
    check(step.expectedOutputArtifacts.length > 0, `${step.stepId} must include expected output artifacts.`)
    check(step.requiredQualityGates.length > 0, `${step.stepId} must include quality gates.`)
    check(step.executionMode === 'planning_only', `${step.stepId} must be planning_only.`)
    check(productionToolIds.has(step.selectedToolId), `${step.stepId} selected tool must exist in production registry.`)
  }
}

const stagedFiles = runGit(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
const packageLockStaged = stagedFiles.includes('package-lock.json')
check(!packageLockStaged, 'package-lock.json must not be staged by this milestone.')

const packageLock = await readFile('package-lock.json', 'utf8')
const packageLockSha256 = hashContent(packageLock)
const expectedPackageLockSha256 = process.env.EXPECTED_PACKAGE_LOCK_SHA256
if (expectedPackageLockSha256) {
  check(
    packageLockSha256 === expectedPackageLockSha256,
    `package-lock.json hash changed: expected ${expectedPackageLockSha256}, got ${packageLockSha256}`,
  )
}

console.log(JSON.stringify({
  ok: true,
  patternCount: plans.length,
  patterns: plans.map((plan) => ({
    patternId: plan.pipeline.patternId,
    planId: plan.planId,
    operationCount: plan.operations.length,
    stepCount: plan.pipeline.steps.length,
    selectedTools: plan.selectedTools,
    qualityGateCount: plan.qualityGatePlan.gateTypes.length,
    executesTools: plan.executesTools,
  })),
  capabilityCardCount: cards.length,
  productionRegistryToolCount: productionToolIds.size,
  milestone1CapabilityCardSource: 'generated_from_existing_production_tool_profiles',
  explicitStudyCardsDeferredToMilestone2: true,
  runtimeIdReconciliationDeferredToMilestone2: true,
  duplicateSystemsCreated: false,
  rankingDimensions: rankingDimensionNames,
  coordinationLabelsUsedForRanking: false,
  packageLock: {
    sha256: packageLockSha256,
    matchesExpected: expectedPackageLockSha256 ? packageLockSha256 === expectedPackageLockSha256 : null,
    staged: packageLockStaged,
  },
}, null, 2))
