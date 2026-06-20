import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tsImport } from 'tsx/esm/api'

const EXPECTED_PACKAGE_LOCK_SHA256 = 'c2c47ecc381a022921b76ab499cf70ba260466ef283046e2d53ac2f2bd255973'

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
  FORBIDDEN_SYNTHETIC_FIXTURE_DRY_RUN_KEYS,
  INITIAL_PIPELINE_PATTERN_IDS,
  buildToolCallingPlanWithAdaptersCommandPlansAndFixtures,
  buildToolCallingPlanWithAdaptersCommandPlansFixturesAndDryRun,
  materializeSyntheticFixtureDryRuns,
  stableSyntheticFixtureDryRunJsonStringify,
  validateSyntheticFixtureDryRunResults,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const {
  PRODUCTION_TOOL_IDS,
} = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const {
  listRuntimeIdReconciliationResults,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

check(existsSync('docs/tool-calling/repo-refresh-gate-policy.v1.md'), 'Refresh gate policy doc must exist.')
check(existsSync('docs/tool-calling/repo-refresh-gate-report.md'), 'Refresh gate report doc must exist.')
check(existsSync('docs/tool-calling/synthetic-fixture-plan.v1.md'), 'Synthetic fixture plan doc must exist.')
check(existsSync('docs/tool-calling/synthetic-fixture-dry-run.v1.md'), 'Synthetic fixture dry-run doc must exist.')
check(existsSync('docs/tool-calling/synthetic-fixture-dry-run.schema.v1.json'), 'Synthetic fixture dry-run schema must exist.')
check(existsSync('docs/tool-calling/synthetic-fixture-dry-run-report.md'), 'Synthetic fixture dry-run report must exist.')

const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
const pendingExternalToolIds = new Set(
  listRuntimeIdReconciliationResults()
    .filter((result) => result.status === 'pending_production_tool_registry_expansion')
    .map((result) => result.externalToolId ?? result.inputToolId),
)
const forbiddenKeySet = new Set(FORBIDDEN_SYNTHETIC_FIXTURE_DRY_RUN_KEYS)
const forbiddenFieldsFound = []
const unsafeValueFindings = []
const checksumFindings = []
const missingArtifactFields = []

const patternSummaries = []
const allFixturePlans = []
const allDryRunResults = []
const allCommandPlans = []

for (const patternId of INITIAL_PIPELINE_PATTERN_IDS) {
  const request = {
    projectId: `synthetic_fixture_dry_run_${patternId}`,
    mode: patternId === 'final_export_validation' ? 'final_export' : 'preview',
    qualityTarget: 'balanced',
    requestedPatternId: patternId,
    userPreferenceTags: ['professional', 'synthetic_fixture_dry_run_safe'],
    mediaContext: {
      mediaTypes: ['video', 'audio'],
      hasAudio: true,
      hasSpeech: true,
      hasMotion: true,
    },
  }

  const withFixtures = buildToolCallingPlanWithAdaptersCommandPlansAndFixtures(request)
  const directDryRunResults = materializeSyntheticFixtureDryRuns(withFixtures.syntheticFixturePlans)
  const withDryRun = buildToolCallingPlanWithAdaptersCommandPlansFixturesAndDryRun(request)

  check(withFixtures.executesTools === false, `${patternId} fixture wrapper must not execute tools.`)
  check(withDryRun.executesTools === false, `${patternId} dry-run wrapper must not execute tools.`)
  check(
    directDryRunResults.length === withFixtures.syntheticFixturePlans.length,
    `${patternId} must produce one dry-run result per fixture plan.`,
  )
  check(
    withDryRun.syntheticFixtureDryRunResults.length === directDryRunResults.length,
    `${patternId} wrapper dry-run count must match direct materializer count.`,
  )
  check(withDryRun.dryRunValidationSummary.ok === true, `${patternId} dry-run validation must pass.`)

  const directIds = directDryRunResults.map((result) => result.dryRunId).sort()
  const wrapperIds = withDryRun.syntheticFixtureDryRunResults.map((result) => result.dryRunId).sort()
  check(JSON.stringify(directIds) === JSON.stringify(wrapperIds), `${patternId} dry-run IDs must match direct materializer.`)

  allCommandPlans.push(...withFixtures.safeCommandPlans)
  allFixturePlans.push(...withFixtures.syntheticFixturePlans)
  allDryRunResults.push(...directDryRunResults)
  patternSummaries.push({
    patternId,
    fixturePlanCount: withFixtures.syntheticFixturePlans.length,
    dryRunResultCount: directDryRunResults.length,
    dryRunArtifactCount: directDryRunResults.reduce((count, result) => count + result.artifacts.length, 0),
    selectedTools: [...new Set(directDryRunResults.map((result) => result.toolId))].sort(),
  })
}

for (const result of allDryRunResults) {
  check(result.generatedJsonOnly === true, `${result.dryRunId} must be JSON-only.`)
  check(result.binaryMediaGenerated === false, `${result.dryRunId} must not generate binary media.`)
  check(result.fixtureGenerationPerformed === true, `${result.dryRunId} must record in-memory descriptor materialization.`)
  check(result.toolExecutionPerformed === false, `${result.dryRunId} must not execute tools.`)
  check(result.shellExecutionPerformed === false, `${result.dryRunId} must not execute shell commands.`)
  check(result.mediaProcessingPerformed === false, `${result.dryRunId} must not process media.`)
  check(result.workerExecutionPerformed === false, `${result.dryRunId} must not dispatch workers.`)
  check(result.providerCallsPerformed === false, `${result.dryRunId} must not call providers.`)
  check(result.supabaseMutationPerformed === false, `${result.dryRunId} must not mutate Supabase.`)
  check(result.sqlExecuted === false, `${result.dryRunId} must not run SQL.`)
  check(result.executesTools === false, `${result.dryRunId} must not execute tools.`)
  check(productionToolIds.has(result.toolId), `${result.dryRunId} must use a first-class ProductionToolId.`)
  check(!pendingExternalToolIds.has(result.toolId), `${result.dryRunId} must not use pending external tools.`)
  check(result.artifacts.length > 0, `${result.dryRunId} must include artifacts.`)

  for (const entry of collectKeysDeep(result)) {
    if (forbiddenKeySet.has(entry.key)) {
      forbiddenFieldsFound.push(entry.path)
    }
  }

  for (const entry of collectStringValues(result)) {
    if (
      looksLikeAbsoluteLocalPath(entry.value) ||
      looksLikeHttpUrl(entry.value) ||
      hasShellMetacharacters(entry.value)
    ) {
      unsafeValueFindings.push(entry.path)
    }
  }

  for (const artifact of result.artifacts) {
    check(artifact.privateByDefault === true, `${artifact.dryRunArtifactId} must be private by default.`)
    check(artifact.sourceOfTruth === true, `${artifact.dryRunArtifactId} must be source of truth.`)
    check(artifact.signedUrlAllowed === false, `${artifact.dryRunArtifactId} must forbid signed URLs.`)
    check(artifact.localPathAllowed === false, `${artifact.dryRunArtifactId} must forbid local paths.`)
    check(artifact.binaryMediaGenerated === false, `${artifact.dryRunArtifactId} must not generate binary media.`)
    check(artifact.toolExecutionPerformed === false, `${artifact.dryRunArtifactId} must not execute tools.`)
    check(artifact.mediaProcessingPerformed === false, `${artifact.dryRunArtifactId} must not process media.`)
    check(artifact.workerExecutionPerformed === false, `${artifact.dryRunArtifactId} must not dispatch workers.`)
    check(productionToolIds.has(artifact.sourceToolId), `${artifact.dryRunArtifactId} must use a first-class tool.`)
    check(!pendingExternalToolIds.has(artifact.sourceToolId), `${artifact.dryRunArtifactId} must not use pending external tools.`)

    if (!artifact.artifactType) missingArtifactFields.push(`${artifact.dryRunArtifactId}.artifactType`)
    if (!artifact.storageBucketPurpose) missingArtifactFields.push(`${artifact.dryRunArtifactId}.storageBucketPurpose`)
    if (!artifact.checksum) missingArtifactFields.push(`${artifact.dryRunArtifactId}.checksum`)
    if (!artifact.sizeBytes || artifact.sizeBytes <= 0) missingArtifactFields.push(`${artifact.dryRunArtifactId}.sizeBytes`)

    const stablePayload = stableSyntheticFixtureDryRunJsonStringify(artifact.payloadJson)
    const expectedChecksum = hashContent(stablePayload)
    const expectedSizeBytes = Buffer.byteLength(stablePayload, 'utf8')
    if (artifact.checksum !== expectedChecksum) {
      checksumFindings.push(`${artifact.dryRunArtifactId}.checksum`)
    }
    if (artifact.sizeBytes !== expectedSizeBytes) {
      checksumFindings.push(`${artifact.dryRunArtifactId}.sizeBytes`)
    }

    if (['synthetic_video', 'synthetic_audio', 'synthetic_image'].includes(artifact.fixtureKind)) {
      check(artifact.payloadKind === 'descriptor_json', `${artifact.dryRunArtifactId} must use descriptor JSON only.`)
    }
    if (artifact.fixtureKind === 'synthetic_mask') {
      check(artifact.payloadKind === 'mask_descriptor_json', `${artifact.dryRunArtifactId} must use a mask descriptor.`)
    }
  }
}

check(forbiddenFieldsFound.length === 0, `Dry-run results contain forbidden fields: ${forbiddenFieldsFound.join(', ')}`)
check(unsafeValueFindings.length === 0, `Dry-run results contain unsafe values: ${unsafeValueFindings.join(', ')}`)
check(missingArtifactFields.length === 0, `Dry-run artifacts are missing fields: ${missingArtifactFields.join(', ')}`)
check(checksumFindings.length === 0, `Dry-run artifact stable checksum checks failed: ${checksumFindings.join(', ')}`)

const validationSummary = validateSyntheticFixtureDryRunResults(allDryRunResults)
check(validationSummary.ok === true, 'Dry-run validation summary must pass.')
check(validationSummary.forbiddenFieldsFound.length === 0, 'Dry-run validation must find no forbidden fields.')
check(validationSummary.unsafeStringValues.length === 0, 'Dry-run validation must find no unsafe string values.')
check(validationSummary.missingArtifactFields.length === 0, 'Dry-run validation must find no missing artifact fields.')
check(validationSummary.pendingExternalToolsUsed === false, 'Dry-run validation must not use pending external tools.')

const duplicateSystemPaths = [
  'server/tool-calling/production-tool-registry.ts',
  'server/tool-calling/tool-registry.ts',
  'server/tool-calling/tool-qa-policy.ts',
  'server/tool-calling/tool-fallback-policy.ts',
  'server/tool-calling/production-worker-router.ts',
  'server/tool-calling/adapter-registry-copy.ts',
  'server/tool-calling/adapter-planner-copy.ts',
  'server/tool-calling/safe-command-plan-policy-copy.ts',
  'server/tool-calling/safe-command-plan-builder-copy.ts',
  'server/tool-calling/synthetic-fixture-catalog-copy.ts',
  'server/tool-calling/synthetic-fixture-planner-copy.ts',
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
check(packageLockSha256 === EXPECTED_PACKAGE_LOCK_SHA256, 'package-lock.json hash must remain unchanged.')

const coveredCommandIntentIds = [...new Set(allDryRunResults.map((result) => result.commandIntentId))].sort()
const coveredOperations = [...new Set(allDryRunResults.map((result) => result.operationId))].sort()
const coveredTools = [...new Set(allDryRunResults.map((result) => result.toolId))].sort()
const coveredFixtureKinds = [...new Set(allDryRunResults.flatMap((result) => result.artifacts.map((artifact) => artifact.fixtureKind)))].sort()
const coveredPayloadKinds = [...new Set(allDryRunResults.flatMap((result) => result.artifacts.map((artifact) => artifact.payloadKind)))].sort()
const pendingExternalToolsUsed = allDryRunResults.some((result) => pendingExternalToolIds.has(result.toolId))

console.log(JSON.stringify({
  ok: true,
  patternSummaries,
  fixturePlanCount: allFixturePlans.length,
  commandPlanCount: allCommandPlans.length,
  dryRunResultCount: allDryRunResults.length,
  dryRunArtifactCount: allDryRunResults.reduce((count, result) => count + result.artifacts.length, 0),
  coveredCommandIntentIds,
  coveredOperations,
  coveredTools,
  coveredFixtureKinds,
  coveredPayloadKinds,
  generatedJsonOnly: true,
  allArtifactsJsonOrDescriptorOnly: true,
  binaryMediaGenerated: false,
  fixtureGenerationPerformed: true,
  toolExecutionPerformed: false,
  shellExecutionPerformed: false,
  mediaProcessingPerformed: false,
  workerExecutionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  executesTools: false,
  pendingExternalToolsUsed,
  forbiddenFieldsFound,
  unsafeValueFindings,
  missingArtifactFields,
  duplicateSystemsCreated: duplicateSystemFiles.length > 0,
  duplicateSystemFiles,
  packageLock: {
    sha256: packageLockSha256,
    staged: packageLockStaged,
  },
}, null, 2))
