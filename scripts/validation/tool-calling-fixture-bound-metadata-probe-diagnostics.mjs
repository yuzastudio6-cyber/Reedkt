import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tsImport } from 'tsx/esm/api'

const EXPECTED_PACKAGE_LOCK_SHA256 = 'c2c47ecc381a022921b76ab499cf70ba260466ef283046e2d53ac2f2bd255973'
const EXPECTED_PROBE_ID = 'ffprobe_fixture_bound_synthetic_audio_metadata_probe'

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

function parseJsonOutput(output) {
  const jsonStart = output.indexOf('{')
  if (jsonStart < 0) throw new Error('Expected JSON object output.')

  return JSON.parse(output.slice(jsonStart))
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

function runGit(args) {
  return runCommand('git', args)
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function hashFile(filePath) {
  return sha256(readFileSync(filePath))
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort()
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

function duplicateSystemPaths() {
  const forbiddenPaths = [
    'server/tool-calling/production-tool-registry.ts',
    'server/tool-calling/tool-registry.ts',
    'server/tool-calling/tool-qa-policy.ts',
    'server/tool-calling/tool-fallback-policy.ts',
    'server/tool-calling/production-worker-router.ts',
    'server/tool-calling/fixture-bound-worker-router.ts',
    'server/tool-calling/fixture-bound-supabase-tables.ts',
    'server/tool-calling/ffprobe-media-adapter.ts',
    'server/tool-calling/media-probe-worker.ts',
    'server/tool-calling/tool-execution-plan-table.ts',
    'server/tool-calling/tool-execution-tables.ts',
    'server/tool-calling/worker-job-tables.ts',
  ]

  return forbiddenPaths.filter((filePath) => existsSync(filePath))
}

function fixtureBoundLayerForbiddenImports() {
  const files = [
    'server/tool-calling/fixture-bound-metadata-probe-types.ts',
    'server/tool-calling/fixture-bound-metadata-probe-policy.ts',
    'server/tool-calling/fixture-bound-metadata-probe-runner.ts',
    'server/tool-calling/fixture-bound-metadata-probe-validator.ts',
  ]
  const forbiddenPatterns = [
    /server\/workers/,
    /server\/media/,
    /server\/e2e/,
    /server\/routes/,
    /server\/cli/,
    /production-readiness/,
    /supabase/i,
    /probe-media/,
    /ffprobe-media-adapter/,
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
  FORBIDDEN_FIXTURE_BOUND_METADATA_PROBE_KEYS,
  listFixtureBoundMetadataProbePolicies,
  validateFixtureBoundMetadataProbePolicy,
  validateFixtureBoundMetadataProbeResults,
  runToolCallingFixtureBoundMetadataProbe,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const {
  PRODUCTION_TOOL_IDS,
} = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const {
  listRuntimeIdReconciliationResults,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

check(existsSync('docs/tool-calling/repo-refresh-gate-policy.v1.md'), 'Refresh gate policy doc must exist.')
check(existsSync('docs/tool-calling/fixture-bound-metadata-probe.v1.md'), 'Fixture-bound metadata probe doc must exist.')
check(
  existsSync('docs/tool-calling/fixture-bound-metadata-probe.schema.v1.json'),
  'Fixture-bound metadata probe schema must exist.',
)
check(
  existsSync('docs/tool-calling/fixture-bound-metadata-probe-report.md'),
  'Fixture-bound metadata probe report must exist.',
)

const refresh = refreshGateSummary()
check(refresh.ok === true, 'Refresh gate invocation must succeed.')
check(
  refresh.continueAllowed === true,
  `Refresh gate blocked fixture-bound metadata diagnostics: ${refresh.blockingReasons.join(', ')}`,
)

const packageLockHash = hashFile('package-lock.json')
check(packageLockHash === EXPECTED_PACKAGE_LOCK_SHA256, 'package-lock.json hash changed.')

const stagedFiles = runGit(['diff', '--cached', '--name-only']).output.split('\n').filter(Boolean)
const packageLockStaged = stagedFiles.includes('package-lock.json')
check(packageLockStaged === false, 'package-lock.json must not be staged.')

const policies = listFixtureBoundMetadataProbePolicies()
check(policies.length === 1, 'Exactly one fixture-bound metadata probe policy is allowed.')
check(policies[0]?.probeId === EXPECTED_PROBE_ID, 'Only the expected fixture-bound metadata probe is allowed.')
for (const policy of policies) {
  const policyValidation = validateFixtureBoundMetadataProbePolicy(policy)
  check(policyValidation.ok === true, `Policy validation failed: ${policyValidation.invalidPolicyFindings.join(', ')}`)
}

const run = await runToolCallingFixtureBoundMetadataProbe()
const validationSummary = validateFixtureBoundMetadataProbeResults(run.probeResults, run.probePolicies)
check(validationSummary.ok === true, 'Fixture-bound metadata probe validation must pass.')
check(run.probeResults.length === run.probePolicies.length, 'Every policy must produce one probe result.')
check(run.executesTools === true, 'Fixture-bound metadata probe wrapper must execute tools.')
check(run.executionBoundary.executesTools === true, 'Execution boundary must report tool execution.')
check(run.executionBoundary.mediaProcessingPerformed === false, 'Execution boundary must not report media processing.')

const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
const pendingExternalToolIds = new Set(
  listRuntimeIdReconciliationResults()
    .filter((result) => result.status === 'pending_production_tool_registry_expansion')
    .map((result) => result.externalToolId ?? result.inputToolId),
)
const forbiddenKeySet = new Set(FORBIDDEN_FIXTURE_BOUND_METADATA_PROBE_KEYS)
const forbiddenFieldsFound = []
const unsafeStringValues = []
const commandFieldFindings = []
const nonFirstClassToolIds = []
const pendingExternalFindings = []
const rawJsonExposureFindings = []

for (const result of run.probeResults) {
  check(result.probeId === EXPECTED_PROBE_ID, `${result.probeId} is not allowlisted.`)
  check(result.toolId === 'ffprobe', `${result.probeRunId} must use ffprobe.`)
  check(result.fixtureKind === 'synthetic_audio', `${result.probeRunId} must use synthetic_audio.`)
  check(result.fixtureContentType === 'audio/wav', `${result.probeRunId} must use audio/wav.`)
  if (!productionToolIds.has(result.toolId)) nonFirstClassToolIds.push(result.toolId)
  if (pendingExternalToolIds.has(result.toolId)) pendingExternalFindings.push(result.toolId)

  check(result.fixtureInputUsed === true, `${result.probeRunId} must use fixture input.`)
  check(result.realUserMediaUsed === false, `${result.probeRunId} must not use real user media.`)
  check(result.signedUrlsUsed === false, `${result.probeRunId} must not use signed URLs.`)
  check(result.shellUsed === false, `${result.probeRunId} must not use shell.`)
  check(result.arbitraryArgsUsed === false, `${result.probeRunId} must not use arbitrary args.`)
  check(result.mediaProcessingPerformed === false, `${result.probeRunId} must not process media.`)
  check(result.workerExecutionPerformed === false, `${result.probeRunId} must not dispatch workers.`)
  check(result.providerCallsPerformed === false, `${result.probeRunId} must not call providers.`)
  check(result.supabaseMutationPerformed === false, `${result.probeRunId} must not mutate Supabase.`)
  check(result.sqlExecuted === false, `${result.probeRunId} must not run SQL.`)
  check(result.packageLockMutated === false, `${result.probeRunId} must not mutate package-lock.`)
  check(result.betaProductionUnlocked === false, `${result.probeRunId} must not unlock beta/prod.`)
  check(result.tempWorkspaceCleanedUp === true, `${result.probeRunId} must clean temp workspace.`)
  check(result.executesTools === true, `${result.probeRunId} must execute ffprobe.`)

  if (result.status === 'passed') {
    check(result.metadataProbePerformed === true, `${result.probeRunId} passed result must perform metadata probe.`)
    check(result.sanitizedMetadataSummary, `${result.probeRunId} passed result must include metadata summary.`)
    check(result.sanitizedMetadataSummary.videoStreamCount === 0, `${result.probeRunId} must not detect video streams.`)
    check(result.sanitizedMetadataSummary.audioStreamCount >= 1, `${result.probeRunId} must detect audio stream.`)
    check(result.sanitizedMetadataSummary.metadataShapeValid === true, `${result.probeRunId} metadata shape must be valid.`)
  } else if (result.status === 'unavailable') {
    check(result.metadataProbePerformed === false, `${result.probeRunId} unavailable result must not perform probe.`)
  }

  for (const entry of collectKeysDeep(result)) {
    if (forbiddenKeySet.has(entry.key)) forbiddenFieldsFound.push(entry.path)
    if (['command', 'args', 'argv', 'exec', 'spawn'].includes(entry.key)) commandFieldFindings.push(entry.path)
  }

  for (const entry of collectStringValues(result)) {
    if (looksLikeUnsafeString(entry.value)) unsafeStringValues.push(`${entry.path}=${entry.value}`)
    if (/^\s*\{/.test(entry.value) && /"streams"|"format"|"filename"/.test(entry.value)) {
      rawJsonExposureFindings.push(entry.path)
    }
  }
}

for (const policy of run.probePolicies) {
  for (const entry of collectKeysDeep(policy)) {
    if (entry.key !== 'exactArgPrefix' && forbiddenKeySet.has(entry.key)) forbiddenFieldsFound.push(entry.path)
  }
}

const duplicateSystems = duplicateSystemPaths()
const forbiddenImportFindings = fixtureBoundLayerForbiddenImports()

check(forbiddenFieldsFound.length === 0, `Forbidden fields found: ${forbiddenFieldsFound.join(', ')}`)
check(commandFieldFindings.length === 0, `Command-like fields found: ${commandFieldFindings.join(', ')}`)
check(unsafeStringValues.length === 0, `Unsafe string values found: ${unsafeStringValues.join(', ')}`)
check(rawJsonExposureFindings.length === 0, `Raw ffprobe JSON exposure found: ${rawJsonExposureFindings.join(', ')}`)
check(nonFirstClassToolIds.length === 0, `Non-first-class tool IDs used: ${nonFirstClassToolIds.join(', ')}`)
check(pendingExternalFindings.length === 0, `Pending external tools used: ${pendingExternalFindings.join(', ')}`)
check(duplicateSystems.length === 0, `Duplicate tool-calling systems found: ${duplicateSystems.join(', ')}`)
check(forbiddenImportFindings.length === 0, `Fixture-bound metadata layer imports forbidden surfaces: ${forbiddenImportFindings.join(', ')}`)

const statusCounts = {
  passedCount: run.probeResults.filter((result) => result.status === 'passed').length,
  unavailableCount: run.probeResults.filter((result) => result.status === 'unavailable').length,
  failedClosedCount: run.probeResults.filter((result) => result.status === 'failed_closed').length,
}

const output = {
  ok: true,
  refreshGate: refresh,
  probePolicyCount: run.probePolicies.length,
  probeResultCount: run.probeResults.length,
  ...statusCounts,
  toolsProbed: uniqueSorted(run.probeResults.map((result) => result.toolId)),
  fixtureKinds: uniqueSorted(run.probeResults.map((result) => result.fixtureKind)),
  contentTypes: uniqueSorted(run.probeResults.map((result) => result.fixtureContentType)),
  metadataProbePerformed: run.probeResults.some((result) => result.metadataProbePerformed),
  probeStatuses: run.probeResults.map((result) => ({
    probeId: result.probeId,
    toolId: result.toolId,
    fixtureId: result.fixtureId,
    status: result.status,
    executableFound: result.executableFound,
    metadataProbePerformed: result.metadataProbePerformed,
    sanitizedMetadataSummary: result.sanitizedMetadataSummary,
    issues: result.issues,
    warnings: result.warnings,
  })),
  binaryFixtureGenerationResultCount: run.binaryFixtureGenerationResults.length,
  audioFixtureArtifactCount: run.binaryFixtureGenerationResults
    .flatMap((result) => result.artifactSummaries)
    .filter((artifact) => artifact.fixtureKind === 'synthetic_audio' && artifact.contentType === 'audio/wav')
    .length,
  executesTools: true,
  fixtureInputUsed: true,
  mediaProcessingPerformed: false,
  realUserMediaUsed: false,
  signedUrlsUsed: false,
  shellUsed: false,
  arbitraryArgsUsed: false,
  workerExecutionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  packageLockMutated: false,
  betaProductionUnlocked: false,
  pendingExternalToolsUsed: false,
  forbiddenFieldsFound: [],
  unsafeStringValues: [],
  rawJsonExposureFindings: [],
  duplicateSystemsCreated: false,
  duplicateSystems,
  forbiddenImportFindings,
  packageLockHash,
  packageLockStaged,
  decisionTarget: 'reeditpro_tool_calling_fixture_bound_metadata_probe_1_ready_for_next_fixture_bound_probe_expansion',
}

console.log(JSON.stringify(output, null, 2))
