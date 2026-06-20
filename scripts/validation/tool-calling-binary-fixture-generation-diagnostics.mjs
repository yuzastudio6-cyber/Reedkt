import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tsImport } from 'tsx/esm/api'

const EXPECTED_PACKAGE_LOCK_SHA256 = 'c2c47ecc381a022921b76ab499cf70ba260466ef283046e2d53ac2f2bd255973'

function check(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function runCommand(command, args, options = {}) {
  const env = { ...process.env }
  delete env.DEVELOPER_DIR

  try {
    return {
      ok: true,
      output: execFileSync(command, args, {
        cwd: process.cwd(),
        env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 60 * 1024 * 1024,
        ...options,
      }),
      error: null,
    }
  } catch (error) {
    return {
      ok: false,
      output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function runGit(args) {
  return runCommand('git', args)
}

function parseJsonOutput(output) {
  const jsonStart = output.indexOf('{')
  if (jsonStart < 0) {
    throw new Error('Expected JSON object output.')
  }

  return JSON.parse(output.slice(jsonStart))
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort()
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function hashFile(filePath) {
  return sha256(readFileSync(filePath))
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

function looksLikeUnsafeString(value) {
  return (
    value.startsWith('/') ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    /^https?:\/\//i.test(value) ||
    /&&|\|\||[|;`<>]|\$\(|\r|\n/.test(value)
  )
}

function refreshGateSummary() {
  const result = runCommand('node', ['scripts/validation/tool-calling-refresh-gate.mjs'])
  const parsed = parseJsonOutput(result.output)

  return {
    ok: result.ok && parsed.ok === true,
    continueAllowed: parsed.continueAllowed === true,
    blockingReasons: parsed.blockingReasons ?? [],
    warnings: parsed.warnings ?? [],
    fetchSkipped: parsed.fetchSkipped === true,
    packageLockStaged: parsed.packageLockStaged === true,
  }
}

function duplicateSystemPaths() {
  const forbiddenPaths = [
    'server/tool-calling/production-tool-registry.ts',
    'server/tool-calling/tool-registry.ts',
    'server/tool-calling/tool-qa-policy.ts',
    'server/tool-calling/tool-fallback-policy.ts',
    'server/tool-calling/production-worker-router.ts',
    'server/tool-calling/adapter-registry-copy.ts',
    'server/tool-calling/adapter-execution-runner.ts',
    'server/tool-calling/safe-command-plan-policy-copy.ts',
    'server/tool-calling/safe-command-execution-runner.ts',
    'server/tool-calling/synthetic-fixture-catalog-copy.ts',
    'server/tool-calling/synthetic-fixture-planner-copy.ts',
    'server/tool-calling/binary-fixture-catalog.ts',
    'server/tool-calling/tool-execution-plan-table.ts',
    'server/tool-calling/tool-execution-tables.ts',
    'server/tool-calling/worker-job-tables.ts',
  ]

  return forbiddenPaths.filter((filePath) => existsSync(filePath))
}

function binaryLayerForbiddenImports() {
  const files = [
    'server/tool-calling/binary-fixture-generation-types.ts',
    'server/tool-calling/binary-fixture-generators.ts',
    'server/tool-calling/binary-fixture-generation-runner.ts',
    'server/tool-calling/binary-fixture-generation-validator.ts',
  ]
  const forbiddenPatterns = [
    /node:child_process/,
    /child_process/,
    /server\/workers/,
    /server\/routes/,
    /server\/media/,
    /server\/e2e/,
    /supabase/i,
    /ffmpeg/i,
    /imagemagick/i,
    /opencv/i,
    /pyscenedetect/i,
    /pyav/i,
  ]
  const findings = []

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf8')
    const importContent = content
      .split('\n')
      .filter((line) => /^\s*import\b/.test(line) || /^\s*from\b/.test(line))
      .join('\n')
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(importContent)) {
        findings.push(`${filePath}:${pattern}`)
      }
    }
  }

  return findings
}

const {
  FORBIDDEN_BINARY_FIXTURE_GENERATION_KEYS,
  INITIAL_PIPELINE_PATTERN_IDS,
  buildBinaryFixtureGenerationPlans,
  runBinaryFixtureGenerationPlans,
  validateBinaryFixtureGenerationResults,
  buildToolCallingPlanWithAdaptersCommandPlansFixturesAndDryRun,
  buildToolCallingPlanWithAdaptersCommandPlansFixturesDryRunAndBinaryFixtures,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const {
  PRODUCTION_TOOL_IDS,
} = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const {
  listRuntimeIdReconciliationResults,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

check(existsSync('docs/tool-calling/repo-refresh-gate-policy.v1.md'), 'Refresh gate policy doc must exist.')
check(existsSync('docs/tool-calling/binary-fixture-generation.v1.md'), 'Binary fixture generation doc must exist.')
check(existsSync('docs/tool-calling/binary-fixture-generation.schema.v1.json'), 'Binary fixture generation schema must exist.')
check(existsSync('docs/tool-calling/binary-fixture-generation-report.md'), 'Binary fixture generation report must exist.')

const refresh = refreshGateSummary()
check(refresh.ok === true, 'Refresh gate invocation must succeed.')
check(refresh.continueAllowed === true, `Refresh gate blocked binary fixture diagnostics: ${refresh.blockingReasons.join(', ')}`)

const packageLockHash = hashFile('package-lock.json')
check(packageLockHash === EXPECTED_PACKAGE_LOCK_SHA256, 'package-lock.json hash changed.')

const stagedFiles = runGit(['diff', '--cached', '--name-only']).output.split('\n').filter(Boolean)
const packageLockStaged = stagedFiles.includes('package-lock.json')
check(packageLockStaged === false, 'package-lock.json must not be staged.')

const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
const pendingExternalToolIds = new Set(
  listRuntimeIdReconciliationResults()
    .filter((result) => result.status === 'pending_production_tool_registry_expansion')
    .map((result) => result.externalToolId ?? result.inputToolId),
)
const forbiddenKeySet = new Set(FORBIDDEN_BINARY_FIXTURE_GENERATION_KEYS)
const forbiddenFieldsFound = []
const unsafeStringValues = []
const checksumFindings = []
const contentTypeFindings = []
const tempCleanupFindings = []
const dryRunMappingFindings = []
const patternSummaries = []
const allDirectPlans = []
const allDirectResults = []
const allWrapperResults = []
const allDryRunResults = []

for (const patternId of INITIAL_PIPELINE_PATTERN_IDS) {
  const request = {
    projectId: `binary_fixture_generation_${patternId}`,
    mode: patternId === 'final_export_validation' ? 'final_export' : 'preview',
    qualityTarget: 'balanced',
    requestedPatternId: patternId,
    userPreferenceTags: ['professional', 'binary_fixture_generation_safe'],
    mediaContext: {
      mediaTypes: ['video', 'audio'],
      hasAudio: true,
      hasSpeech: true,
      hasMotion: true,
    },
  }

  const withDryRun = buildToolCallingPlanWithAdaptersCommandPlansFixturesAndDryRun(request)
  const directPlans = buildBinaryFixtureGenerationPlans(withDryRun.syntheticFixtureDryRunResults)
  const directResults = await runBinaryFixtureGenerationPlans(directPlans, { cleanup: true })
  const wrapper = await buildToolCallingPlanWithAdaptersCommandPlansFixturesDryRunAndBinaryFixtures(request)

  check(withDryRun.executesTools === false, `${patternId} dry-run wrapper must not execute tools.`)
  check(wrapper.executesTools === false, `${patternId} binary wrapper must not execute tools.`)
  check(
    directPlans.length === withDryRun.syntheticFixtureDryRunResults.length,
    `${patternId} must create one generation plan per dry-run result.`,
  )
  check(
    directResults.length === withDryRun.syntheticFixtureDryRunResults.length,
    `${patternId} must create one generation result per dry-run result.`,
  )
  check(
    wrapper.binaryFixtureGenerationResults.length === directResults.length,
    `${patternId} wrapper result count must match direct runner count.`,
  )
  check(wrapper.binaryFixtureValidationSummary.ok === true, `${patternId} wrapper validation must pass.`)

  const directSourceIds = directResults.map((result) => result.sourceDryRunId).sort()
  const dryRunIds = withDryRun.syntheticFixtureDryRunResults.map((result) => result.dryRunId).sort()
  if (JSON.stringify(directSourceIds) !== JSON.stringify(dryRunIds)) {
    dryRunMappingFindings.push(patternId)
  }

  allDryRunResults.push(...withDryRun.syntheticFixtureDryRunResults)
  allDirectPlans.push(...directPlans)
  allDirectResults.push(...directResults)
  allWrapperResults.push(...wrapper.binaryFixtureGenerationResults)
  patternSummaries.push({
    patternId,
    dryRunResultCount: withDryRun.syntheticFixtureDryRunResults.length,
    generationPlanCount: directPlans.length,
    generationResultCount: directResults.length,
    artifactSummaryCount: directResults.reduce((count, result) => count + result.artifactSummaries.length, 0),
    videoBinaryDeferredCount: directResults.reduce((count, result) => count + result.videoBinaryDeferredCount, 0),
    selectedTools: uniqueSorted(directResults.map((result) => result.toolId)),
  })
}

for (const result of allDirectResults) {
  if (result.tempWorkspaceCleanedUp !== true) {
    tempCleanupFindings.push(result.generationResultId)
  }
  check(result.tempPathExposed === false, `${result.generationResultId} must not expose temp paths.`)
  check(result.writesCommittedArtifacts === false, `${result.generationResultId} must not commit artifacts.`)
  check(result.externalToolExecutionPerformed === false, `${result.generationResultId} must not execute external tools.`)
  check(result.shellExecutionPerformed === false, `${result.generationResultId} must not execute shell commands.`)
  check(result.workerExecutionPerformed === false, `${result.generationResultId} must not dispatch workers.`)
  check(result.mediaProcessingPerformed === false, `${result.generationResultId} must not process media.`)
  check(result.providerCallsPerformed === false, `${result.generationResultId} must not call providers.`)
  check(result.supabaseMutationPerformed === false, `${result.generationResultId} must not mutate Supabase.`)
  check(result.sqlExecuted === false, `${result.generationResultId} must not run SQL.`)
  check(result.signedUrlsCreated === false, `${result.generationResultId} must not create signed URLs.`)
  check(result.packageLockMutated === false, `${result.generationResultId} must not mutate package-lock.`)
  check(result.executesTools === false, `${result.generationResultId} must not execute tools.`)
  check(productionToolIds.has(result.toolId), `${result.generationResultId} must use a first-class ProductionToolId.`)
  check(!pendingExternalToolIds.has(result.toolId), `${result.generationResultId} must not use pending external tools.`)

  for (const entry of collectKeysDeep(result)) {
    if (forbiddenKeySet.has(entry.key)) {
      forbiddenFieldsFound.push(entry.path)
    }
  }

  for (const entry of collectStringValues(result)) {
    if (looksLikeUnsafeString(entry.value)) {
      unsafeStringValues.push(`${entry.path}=${entry.value}`)
    }
  }

  for (const artifact of result.artifactSummaries) {
    check(artifact.checksum && /^[a-f0-9]{64}$/.test(artifact.checksum), `${artifact.artifactSummaryId} needs checksum.`)
    check(artifact.sizeBytes > 0, `${artifact.artifactSummaryId} needs positive size.`)
    check(artifact.privateByDefault === true, `${artifact.artifactSummaryId} must be private.`)
    check(artifact.sourceOfTruth === true, `${artifact.artifactSummaryId} must be source of truth.`)
    check(artifact.signedUrlAllowed === false, `${artifact.artifactSummaryId} must forbid signed URLs.`)
    check(artifact.tempPathExposed === false, `${artifact.artifactSummaryId} must not expose temp paths.`)
    check(artifact.committedToRepo === false, `${artifact.artifactSummaryId} must not be committed.`)
    check(artifact.externalToolExecutionPerformed === false, `${artifact.artifactSummaryId} must not execute tools.`)
    check(artifact.shellExecutionPerformed === false, `${artifact.artifactSummaryId} must not execute shell commands.`)
    check(artifact.workerExecutionPerformed === false, `${artifact.artifactSummaryId} must not dispatch workers.`)
    check(artifact.mediaProcessingPerformed === false, `${artifact.artifactSummaryId} must not process media.`)
    check(productionToolIds.has(artifact.toolId), `${artifact.artifactSummaryId} must use a first-class tool.`)
    check(!pendingExternalToolIds.has(artifact.toolId), `${artifact.artifactSummaryId} must not use pending external tools.`)

    if (!['application/json', 'audio/wav', 'image/png'].includes(artifact.contentType)) {
      contentTypeFindings.push(`${artifact.artifactSummaryId}.contentType`)
    }
    if (artifact.fixtureKind === 'synthetic_audio' && artifact.contentType !== 'audio/wav') {
      contentTypeFindings.push(`${artifact.artifactSummaryId}.audioContentType`)
    }
    if (
      (artifact.fixtureKind === 'synthetic_image' || artifact.fixtureKind === 'synthetic_mask') &&
      artifact.contentType !== 'image/png'
    ) {
      contentTypeFindings.push(`${artifact.artifactSummaryId}.pngContentType`)
    }
    if (artifact.fixtureKind === 'synthetic_video') {
      if (
        artifact.contentType !== 'application/json' ||
        artifact.generatedBinary !== false ||
        artifact.descriptorOnly !== true ||
        artifact.videoBinaryDeferred !== true ||
        artifact.binaryMediaGenerated !== false
      ) {
        contentTypeFindings.push(`${artifact.artifactSummaryId}.videoDescriptorBoundary`)
      }
    }
    if (!artifact.artifactType || !artifact.storageBucketPurpose) {
      checksumFindings.push(`${artifact.artifactSummaryId}.artifactMetadata`)
    }
  }
}

check(dryRunMappingFindings.length === 0, `Dry-run to binary result mapping failed: ${dryRunMappingFindings.join(', ')}`)
check(tempCleanupFindings.length === 0, `Temp workspace cleanup failed: ${tempCleanupFindings.join(', ')}`)
check(forbiddenFieldsFound.length === 0, `Binary results contain forbidden fields: ${forbiddenFieldsFound.join(', ')}`)
check(unsafeStringValues.length === 0, `Binary results contain unsafe string values: ${unsafeStringValues.join(', ')}`)
check(checksumFindings.length === 0, `Binary artifact checksum/metadata checks failed: ${checksumFindings.join(', ')}`)
check(contentTypeFindings.length === 0, `Binary artifact content checks failed: ${contentTypeFindings.join(', ')}`)

const validationSummary = validateBinaryFixtureGenerationResults(allDirectResults, allDirectPlans, {
  packageLockStaged,
  packageLockMutated: packageLockHash !== EXPECTED_PACKAGE_LOCK_SHA256,
})
check(validationSummary.ok === true, 'Binary fixture validation summary must pass.')
check(validationSummary.packageLockMutated === false, 'Binary fixture validation must report unchanged package-lock.')
check(validationSummary.pendingExternalToolsUsed === false, 'Binary fixture validation must not use pending external tools.')
check(validationSummary.videoBinaryOutputGenerated === false, 'Binary fixture validation must not generate binary video.')

const wrapperValidationSummary = validateBinaryFixtureGenerationResults(allWrapperResults)
check(wrapperValidationSummary.ok === true, 'Wrapper binary fixture validation summary must pass.')

const duplicateSystems = duplicateSystemPaths()
const forbiddenImportFindings = binaryLayerForbiddenImports()
check(duplicateSystems.length === 0, `Duplicate tool-calling systems found: ${duplicateSystems.join(', ')}`)
check(forbiddenImportFindings.length === 0, `Binary fixture layer imports forbidden surfaces: ${forbiddenImportFindings.join(', ')}`)

const artifactSummaries = allDirectResults.flatMap((result) => result.artifactSummaries)
const dryRunIds = new Set(allDryRunResults.map((result) => result.dryRunId))
const mappedDryRunIds = new Set(allDirectResults.map((result) => result.sourceDryRunId))
check(dryRunIds.size === mappedDryRunIds.size, 'Every dry-run result must map to one binary fixture result.')

const output = {
  ok: true,
  refreshGate: refresh,
  patternSummaries,
  dryRunResultCount: allDryRunResults.length,
  generationPlanCount: allDirectPlans.length,
  generationResultCount: allDirectResults.length,
  artifactSummaryCount: artifactSummaries.length,
  wrapperGenerationResultCount: allWrapperResults.length,
  generatedFileCount: validationSummary.generatedFileCount,
  generatedBinaryCount: validationSummary.generatedBinaryCount,
  generatedJsonCount: validationSummary.generatedJsonCount,
  descriptorOnlyCount: validationSummary.descriptorOnlyCount,
  videoBinaryDeferredCount: validationSummary.videoBinaryDeferredCount,
  coveredContentTypes: uniqueSorted(artifactSummaries.map((artifact) => artifact.contentType)),
  coveredFixtureKinds: uniqueSorted(artifactSummaries.map((artifact) => artifact.fixtureKind)),
  coveredTools: uniqueSorted(allDirectResults.map((result) => result.toolId)),
  coveredOperations: uniqueSorted(allDirectResults.map((result) => result.operationId)),
  allDryRunResultsMappedToBinaryFixtureResults: true,
  tempWorkspaceCleanedUp: validationSummary.allTempWorkspacesCleanedUp,
  nodeStandardLibraryOnlyGeneration: true,
  videoBinaryOutputGenerated: validationSummary.videoBinaryOutputGenerated,
  pendingExternalToolsUsed: validationSummary.pendingExternalToolsUsed,
  forbiddenFieldsFound: validationSummary.forbiddenFieldsFound,
  unsafeStringValues: validationSummary.unsafeStringValues,
  duplicateSystemsCreated: false,
  duplicateSystems,
  forbiddenImportFindings,
  packageLockHash,
  packageLockStaged,
  packageLockMutated: false,
  externalToolExecutionPerformed: false,
  shellExecutionPerformed: false,
  workerExecutionPerformed: false,
  mediaProcessingPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  signedUrlsCreated: false,
  committedGeneratedArtifacts: false,
  executesTools: false,
  decisionTarget: 'reeditpro_tool_calling_binary_fixture_generation_1_ready_for_controlled_low_risk_tool_execution',
}

console.log(JSON.stringify(output, null, 2))
