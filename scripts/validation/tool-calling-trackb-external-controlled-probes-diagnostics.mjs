import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tsImport } from 'tsx/esm/api'

const TRACKB_PROBE_IDS = [
  'mediainfo_version_probe',
  'exiftool_version_probe',
  'tesseract_version_probe',
  'imagemagick_magick_version_probe',
  'imagemagick_convert_version_probe',
]
const TRACKB_TOOL_IDS = ['mediainfo', 'exiftool', 'tesseract', 'imagemagick']
const EXPECTED_EXEC_POLICIES = new Map([
  ['mediainfo_version_probe', { toolId: 'mediainfo', executableName: 'mediainfo', exactArgs: ['--Version'] }],
  ['exiftool_version_probe', { toolId: 'exiftool', executableName: 'exiftool', exactArgs: ['-ver'] }],
  ['tesseract_version_probe', { toolId: 'tesseract', executableName: 'tesseract', exactArgs: ['--version'] }],
  ['imagemagick_magick_version_probe', { toolId: 'imagemagick', executableName: 'magick', exactArgs: ['-version'] }],
  ['imagemagick_convert_version_probe', { toolId: 'imagemagick', executableName: 'convert', exactArgs: ['-version'] }],
])

function readCommittedPackageLockSha256() {
  const env = { ...process.env }
  delete env.DEVELOPER_DIR

  return createHash('sha256')
    .update(execFileSync('git', ['show', 'HEAD:package-lock.json'], {
      cwd: process.cwd(),
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }))
    .digest('hex')
}

const EXPECTED_PACKAGE_LOCK_SHA256 = readCommittedPackageLockSha256()

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
  if (jsonStart < 0) {
    throw new Error('Expected JSON object output.')
  }

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
    'server/tool-calling/controlled-low-risk-worker-router.ts',
    'server/tool-calling/controlled-low-risk-supabase-tables.ts',
    'server/tool-calling/trackb-external-worker-router.ts',
    'server/tool-calling/trackb-external-supabase-tables.ts',
    'server/tool-calling/tool-execution-plan-table.ts',
    'server/tool-calling/tool-execution-tables.ts',
    'server/tool-calling/worker-job-tables.ts',
  ]

  return forbiddenPaths.filter((filePath) => existsSync(filePath))
}

function controlledLayerForbiddenImports() {
  const files = [
    'server/tool-calling/controlled-low-risk-execution-types.ts',
    'server/tool-calling/controlled-low-risk-execution-policy.ts',
    'server/tool-calling/controlled-low-risk-execution-runner.ts',
    'server/tool-calling/controlled-low-risk-execution-validator.ts',
  ]
  const forbiddenPatterns = [
    /server\/workers/,
    /server\/media/,
    /server\/e2e/,
    /server\/routes/,
    /supabase/i,
    /production-readiness/,
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

function statusCounts(results) {
  return {
    passedCount: results.filter((result) => result.status === 'passed').length,
    unavailableCount: results.filter((result) => result.status === 'unavailable').length,
    skippedByPolicyCount: results.filter((result) => result.status === 'skipped_by_policy').length,
    failedClosedCount: results.filter((result) => result.status === 'failed_closed').length,
  }
}

function sameStringArray(left, right) {
  return Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index])
}

function imagemagickReadiness(results) {
  const magick = results.find((result) => result.probeId === 'imagemagick_magick_version_probe')
  const convert = results.find((result) => result.probeId === 'imagemagick_convert_version_probe')

  if (magick?.status === 'passed') {
    return { status: 'passed', warnings: [] }
  }
  if (magick?.status === 'unavailable' && convert?.status === 'passed') {
    return { status: 'passed_with_warning', warnings: ['imagemagick_legacy_convert_binary_used'] }
  }
  if (magick?.status === 'failed_closed' || convert?.status === 'failed_closed') {
    return { status: 'failed_closed', warnings: [] }
  }
  if (magick?.status === 'unavailable' && convert?.status === 'unavailable') {
    return { status: 'unavailable', warnings: [] }
  }

  return { status: 'failed_closed', warnings: ['imagemagick_probe_status_unexpected'] }
}

const {
  FORBIDDEN_CONTROLLED_LOW_RISK_EXECUTION_KEYS,
  listControlledLowRiskProbePolicies,
  runControlledLowRiskProbes,
  validateControlledLowRiskProbeResults,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const {
  PRODUCTION_TOOL_IDS,
} = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const {
  listRuntimeIdReconciliationResults,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

check(existsSync('docs/tool-calling/repo-refresh-gate-policy.v1.md'), 'Refresh gate policy doc must exist.')
check(
  existsSync('docs/tool-calling/trackb-external-controlled-probes.v1.md'),
  'Track B external controlled probes doc must exist.',
)
check(
  existsSync('docs/tool-calling/trackb-external-controlled-probes-report.md'),
  'Track B external controlled probes report must exist.',
)

const refresh = refreshGateSummary()
check(refresh.ok === true, 'Refresh gate invocation must succeed.')
check(
  refresh.continueAllowed === true,
  `Refresh gate blocked Track B external controlled probes diagnostics: ${refresh.blockingReasons.join(', ')}`,
)

const packageLockHash = hashFile('package-lock.json')
check(packageLockHash === EXPECTED_PACKAGE_LOCK_SHA256, 'package-lock.json hash changed.')

const stagedFiles = runGit(['diff', '--cached', '--name-only']).output.split('\n').filter(Boolean)
const packageLockStaged = stagedFiles.includes('package-lock.json')
check(packageLockStaged === false, 'package-lock.json must not be staged.')

const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
for (const toolId of TRACKB_TOOL_IDS) {
  check(productionToolIds.has(toolId), `${toolId} must be a first-class ProductionToolId.`)
}
check(!productionToolIds.has('graphicsmagick'), 'graphicsmagick must remain non-first-class.')

const pendingExternalToolIds = new Set(
  listRuntimeIdReconciliationResults()
    .filter((result) => result.status === 'pending_production_tool_registry_expansion')
    .map((result) => result.externalToolId ?? result.inputToolId),
)
check(pendingExternalToolIds.has('graphicsmagick'), 'graphicsmagick should remain pending external evidence.')

const allPolicies = listControlledLowRiskProbePolicies()
const trackBPolicies = allPolicies.filter((policy) => TRACKB_PROBE_IDS.includes(policy.probeId))
check(trackBPolicies.length === TRACKB_PROBE_IDS.length, 'Every Track B probe policy must exist.')
check(
  JSON.stringify(trackBPolicies.map((policy) => policy.probeId).sort()) === JSON.stringify([...TRACKB_PROBE_IDS].sort()),
  'Track B probe policy IDs must exactly match the allowlist.',
)

for (const policy of trackBPolicies) {
  const expected = EXPECTED_EXEC_POLICIES.get(policy.probeId)
  check(Boolean(expected), `${policy.probeId} must be an expected exec policy.`)
  check(policy.toolId === expected.toolId, `${policy.probeId} has unexpected toolId.`)
  check(policy.executableName === expected.executableName, `${policy.probeId} has unexpected executableName.`)
  check(sameStringArray(policy.exactArgs, expected.exactArgs), `${policy.probeId} has unexpected exactArgs.`)
  check(policy.maxBufferBytes === 262144, `${policy.probeId} must use maxBufferBytes 262144.`)
  check(policy.timeoutMs === 3000, `${policy.probeId} must use timeout 3000.`)
  check(policy.executionMethod === 'exec_file_no_shell', `${policy.probeId} must use execFile no shell.`)
  check(policy.toolId !== 'graphicsmagick', `${policy.probeId} must not probe graphicsmagick.`)
  check(policy.executableName !== 'graphicsmagick', `${policy.probeId} must not execute graphicsmagick.`)
}

const results = await runControlledLowRiskProbes(trackBPolicies)
const validationSummary = validateControlledLowRiskProbeResults(results, trackBPolicies)
check(validationSummary.ok === true, 'Track B controlled probe validation must pass.')
check(results.length === trackBPolicies.length, 'Every Track B policy must produce one result.')

const forbiddenKeySet = new Set(FORBIDDEN_CONTROLLED_LOW_RISK_EXECUTION_KEYS)
const forbiddenFieldsFound = []
const unsafeStringValues = []
const commandFieldFindings = []
const nonFirstClassToolIds = []
const pendingExternalFindings = []
const graphicsmagickFindings = []

for (const result of results) {
  check(TRACKB_PROBE_IDS.includes(result.probeId), `${result.probeId} is not Track B allowlisted.`)
  if (!productionToolIds.has(result.toolId)) nonFirstClassToolIds.push(result.toolId)
  if (pendingExternalToolIds.has(result.toolId)) pendingExternalFindings.push(result.toolId)
  if (result.toolId === 'graphicsmagick') graphicsmagickFindings.push(result.probeId)

  check(result.networkUsed === false, `${result.probeRunId} must not use network.`)
  check(result.stdinUsed === false, `${result.probeRunId} must not use stdin.`)
  check(result.shellUsed === false, `${result.probeRunId} must not use shell.`)
  check(result.arbitraryArgsUsed === false, `${result.probeRunId} must not use arbitrary args.`)
  check(result.mediaInputUsed === false, `${result.probeRunId} must not use media input.`)
  check(result.realUserMediaUsed === false, `${result.probeRunId} must not use real user media.`)
  check(result.fixtureInputUsed === false, `${result.probeRunId} must not use fixture input.`)
  check(result.mediaProcessingPerformed === false, `${result.probeRunId} must not process media.`)
  check(result.workerExecutionPerformed === false, `${result.probeRunId} must not dispatch workers.`)
  check(result.providerCallsPerformed === false, `${result.probeRunId} must not call providers.`)
  check(result.supabaseMutationPerformed === false, `${result.probeRunId} must not mutate Supabase.`)
  check(result.sqlExecuted === false, `${result.probeRunId} must not run SQL.`)
  check(result.signedUrlsUsed === false, `${result.probeRunId} must not use signed URLs.`)
  check(result.publicArtifactsCreated === false, `${result.probeRunId} must not create public artifacts.`)
  check(result.packageLockMutated === false, `${result.probeRunId} must not mutate package-lock.`)
  check(result.betaProductionUnlocked === false, `${result.probeRunId} must not unlock beta/prod.`)
  check(result.executesTools === true, `${result.probeRunId} must be tool execution.`)

  for (const entry of collectKeysDeep(result)) {
    if (forbiddenKeySet.has(entry.key)) {
      forbiddenFieldsFound.push(entry.path)
    }
    if (['command', 'args', 'argv', 'exec', 'spawn'].includes(entry.key)) {
      commandFieldFindings.push(entry.path)
    }
  }

  for (const entry of collectStringValues(result)) {
    if (looksLikeUnsafeString(entry.value)) {
      unsafeStringValues.push(`${entry.path}=${entry.value}`)
    }
  }
}

for (const policy of trackBPolicies) {
  for (const entry of collectKeysDeep(policy)) {
    if (entry.key !== 'exactArgs' && forbiddenKeySet.has(entry.key)) {
      forbiddenFieldsFound.push(entry.path)
    }
  }
}

check(forbiddenFieldsFound.length === 0, `Forbidden fields found: ${forbiddenFieldsFound.join(', ')}`)
check(commandFieldFindings.length === 0, `Command-like fields found: ${commandFieldFindings.join(', ')}`)
check(unsafeStringValues.length === 0, `Unsafe string values found: ${unsafeStringValues.join(', ')}`)
check(nonFirstClassToolIds.length === 0, `Non-first-class tool IDs used: ${nonFirstClassToolIds.join(', ')}`)
check(pendingExternalFindings.length === 0, `Pending external tools used: ${pendingExternalFindings.join(', ')}`)
check(graphicsmagickFindings.length === 0, `graphicsmagick probes found: ${graphicsmagickFindings.join(', ')}`)

const duplicateSystems = duplicateSystemPaths()
const forbiddenImportFindings = controlledLayerForbiddenImports()
check(duplicateSystems.length === 0, `Duplicate tool-calling systems found: ${duplicateSystems.join(', ')}`)
check(forbiddenImportFindings.length === 0, `Controlled execution layer imports forbidden surfaces: ${forbiddenImportFindings.join(', ')}`)

const imageMagickReadiness = imagemagickReadiness(results)
const counts = statusCounts(results)

const output = {
  ok: true,
  refreshGate: refresh,
  trackBProbePolicyCount: trackBPolicies.length,
  trackBProbeResultCount: results.length,
  ...counts,
  toolsProbed: uniqueSorted(results.map((result) => result.toolId)),
  probeIds: trackBPolicies.map((policy) => policy.probeId),
  probeStatuses: results.map((result) => ({
    probeId: result.probeId,
    toolId: result.toolId,
    status: result.status,
    executableFound: result.executableFound,
    versionSummary: result.versionSummary,
    issues: result.issues,
    warnings: result.warnings,
  })),
  imagemagickReadinessStatus: imageMagickReadiness.status,
  imagemagickReadinessWarnings: imageMagickReadiness.warnings,
  graphicsmagickProbed: false,
  graphicsMagickCounted: false,
  graphicsmagickPendingExternal: pendingExternalToolIds.has('graphicsmagick'),
  executesTools: true,
  networkUsed: false,
  stdinUsed: false,
  mediaInputUsed: false,
  mediaProcessingPerformed: false,
  realUserMediaUsed: false,
  fixtureInputUsed: false,
  shellUsed: false,
  arbitraryArgsUsed: false,
  workerExecutionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  signedUrlsUsed: false,
  publicArtifactsCreated: false,
  packageLockMutated: false,
  betaProductionUnlocked: false,
  pendingExternalToolsUsed: false,
  forbiddenFieldsFound: [],
  unsafeStringValues: [],
  duplicateSystemsCreated: false,
  duplicateSystems,
  forbiddenImportFindings,
  packageLockHash,
  packageLockStaged,
  decisionTarget: 'reeditpro_tool_calling_trackb_external_controlled_probes_1_ready_for_trackb_external_fixture_bound_probes',
}

console.log(JSON.stringify(output, null, 2))
