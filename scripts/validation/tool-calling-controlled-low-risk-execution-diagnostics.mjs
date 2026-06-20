import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tsImport } from 'tsx/esm/api'

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
const EXPECTED_PROBE_IDS = [
  'ffmpeg_version_probe',
  'ffprobe_version_probe',
  'remotion_package_resolution_probe',
  'sharp_package_resolution_probe',
]

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
    /ffmpeg-audio/i,
    /ffprobe-media/i,
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

const {
  FORBIDDEN_CONTROLLED_LOW_RISK_EXECUTION_KEYS,
  listControlledLowRiskProbePolicies,
  validateControlledLowRiskProbeResults,
  runToolCallingControlledLowRiskReadinessProbes,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const {
  PRODUCTION_TOOL_IDS,
} = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const {
  listRuntimeIdReconciliationResults,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

check(existsSync('docs/tool-calling/repo-refresh-gate-policy.v1.md'), 'Refresh gate policy doc must exist.')
check(
  existsSync('docs/tool-calling/controlled-low-risk-tool-execution.v1.md'),
  'Controlled low-risk execution doc must exist.',
)
check(
  existsSync('docs/tool-calling/controlled-low-risk-tool-execution.schema.v1.json'),
  'Controlled low-risk execution schema must exist.',
)
check(
  existsSync('docs/tool-calling/controlled-low-risk-tool-execution-report.md'),
  'Controlled low-risk execution report must exist.',
)

const refresh = refreshGateSummary()
check(refresh.ok === true, 'Refresh gate invocation must succeed.')
check(
  refresh.continueAllowed === true,
  `Refresh gate blocked controlled low-risk execution diagnostics: ${refresh.blockingReasons.join(', ')}`,
)

const packageLockHash = hashFile('package-lock.json')
check(packageLockHash === EXPECTED_PACKAGE_LOCK_SHA256, 'package-lock.json hash changed.')

const stagedFiles = runGit(['diff', '--cached', '--name-only']).output.split('\n').filter(Boolean)
const packageLockStaged = stagedFiles.includes('package-lock.json')
check(packageLockStaged === false, 'package-lock.json must not be staged.')

const policies = listControlledLowRiskProbePolicies()
const policyIds = policies.map((policy) => policy.probeId).sort()
check(JSON.stringify(policyIds) === JSON.stringify([...EXPECTED_PROBE_IDS].sort()), 'Only expected probe policies are allowed.')

const run = await runToolCallingControlledLowRiskReadinessProbes()
const validationSummary = validateControlledLowRiskProbeResults(run.probeResults, run.probePolicies)
check(validationSummary.ok === true, 'Controlled low-risk probe validation must pass.')
check(run.probeResults.length === run.probePolicies.length, 'Every policy must produce one probe result.')

const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
const pendingExternalToolIds = new Set(
  listRuntimeIdReconciliationResults()
    .filter((result) => result.status === 'pending_production_tool_registry_expansion')
    .map((result) => result.externalToolId ?? result.inputToolId),
)
const forbiddenKeySet = new Set(FORBIDDEN_CONTROLLED_LOW_RISK_EXECUTION_KEYS)
const forbiddenFieldsFound = []
const unsafeStringValues = []
const commandFieldFindings = []
const nonFirstClassToolIds = []
const pendingExternalFindings = []

for (const result of run.probeResults) {
  check(EXPECTED_PROBE_IDS.includes(result.probeId), `${result.probeId} is not allowlisted.`)
  if (!productionToolIds.has(result.toolId)) nonFirstClassToolIds.push(result.toolId)
  if (pendingExternalToolIds.has(result.toolId)) pendingExternalFindings.push(result.toolId)

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

for (const policy of run.probePolicies) {
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

const duplicateSystems = duplicateSystemPaths()
const forbiddenImportFindings = controlledLayerForbiddenImports()
check(duplicateSystems.length === 0, `Duplicate tool-calling systems found: ${duplicateSystems.join(', ')}`)
check(forbiddenImportFindings.length === 0, `Controlled execution layer imports forbidden surfaces: ${forbiddenImportFindings.join(', ')}`)

const statusCounts = {
  passedCount: run.probeResults.filter((result) => result.status === 'passed').length,
  unavailableCount: run.probeResults.filter((result) => result.status === 'unavailable').length,
  skippedByPolicyCount: run.probeResults.filter((result) => result.status === 'skipped_by_policy').length,
  failedClosedCount: run.probeResults.filter((result) => result.status === 'failed_closed').length,
}

const output = {
  ok: true,
  refreshGate: refresh,
  probePolicyCount: run.probePolicies.length,
  probeResultCount: run.probeResults.length,
  ...statusCounts,
  toolsProbed: uniqueSorted(run.probeResults.map((result) => result.toolId)),
  probeStatuses: run.probeResults.map((result) => ({
    probeId: result.probeId,
    toolId: result.toolId,
    status: result.status,
    executableFound: result.executableFound,
    packageResolved: result.packageResolved,
    versionSummary: result.versionSummary,
    issues: result.issues,
    warnings: result.warnings,
  })),
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
  decisionTarget: 'reeditpro_tool_calling_controlled_low_risk_execution_1_ready_for_fixture_bound_metadata_probe',
}

console.log(JSON.stringify(output, null, 2))
