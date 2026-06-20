import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tsImport } from 'tsx/esm/api'

const EXPECTED_PACKAGE_LOCK_SHA256 = 'c2c47ecc381a022921b76ab499cf70ba260466ef283046e2d53ac2f2bd255973'
const EXPECTED_POLICY_ID = 'fixture_bound_synthetic_audio_export_validation'
const EXPECTED_SOURCE_PROBE_ID = 'ffprobe_fixture_bound_synthetic_audio_metadata_probe'
const EXPECTED_REQUIRED_GATES = ['export_codec_format', 'export_duration_sync', 'render_asset_integrity']

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
        maxBuffer: 80 * 1024 * 1024,
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
    'server/tool-calling/fixture-bound-export-supabase-tables.ts',
    'server/tool-calling/ffprobe-media-adapter.ts',
    'server/tool-calling/media-probe-worker.ts',
    'server/tool-calling/export-worker.ts',
    'server/tool-calling/final-render-worker.ts',
    'server/tool-calling/export-qa-policy.ts',
    'server/tool-calling/tool-execution-plan-table.ts',
    'server/tool-calling/tool-execution-tables.ts',
    'server/tool-calling/worker-job-tables.ts',
  ]

  return forbiddenPaths.filter((filePath) => existsSync(filePath))
}

function fixtureBoundExportLayerForbiddenImports() {
  const files = [
    'server/tool-calling/fixture-bound-export-validation-types.ts',
    'server/tool-calling/fixture-bound-export-validation-policy.ts',
    'server/tool-calling/fixture-bound-export-validation-runner.ts',
    'server/tool-calling/fixture-bound-export-validation-validator.ts',
  ]
  const forbiddenPatterns = [
    /node:child_process/,
    /child_process/,
    /server\/workers/,
    /server\/media/,
    /server\/e2e/,
    /server\/routes/,
    /server\/cli/,
    /production-readiness/,
    /final-render/i,
    /supabase/i,
    /probe-media/,
    /ffprobe-media-adapter/,
    /ffmpeg/i,
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
  FORBIDDEN_FIXTURE_BOUND_EXPORT_VALIDATION_KEYS,
  listFixtureBoundExportValidationPolicies,
  validateFixtureBoundExportValidationPolicy,
  validateFixtureBoundExportValidationResults,
  runFixtureBoundExportValidations,
  runToolCallingFixtureBoundMetadataProbe,
  runToolCallingFixtureBoundExportValidation,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

const {
  PRODUCTION_TOOL_IDS,
} = await tsImport('../../server/tool-registry/index.ts', import.meta.url)

const {
  listRuntimeIdReconciliationResults,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)

check(existsSync('docs/tool-calling/repo-refresh-gate-policy.v1.md'), 'Refresh gate policy doc must exist.')
check(
  existsSync('docs/tool-calling/fixture-bound-export-validation.v1.md'),
  'Fixture-bound export validation doc must exist.',
)
check(
  existsSync('docs/tool-calling/fixture-bound-export-validation.schema.v1.json'),
  'Fixture-bound export validation schema must exist.',
)
check(
  existsSync('docs/tool-calling/fixture-bound-export-validation-report.md'),
  'Fixture-bound export validation report must exist.',
)

const refresh = refreshGateSummary()
check(refresh.ok === true, 'Refresh gate invocation must succeed.')
check(
  refresh.continueAllowed === true,
  `Refresh gate blocked fixture-bound export validation diagnostics: ${refresh.blockingReasons.join(', ')}`,
)

const packageLockHash = hashFile('package-lock.json')
check(packageLockHash === EXPECTED_PACKAGE_LOCK_SHA256, 'package-lock.json hash changed.')

const stagedFiles = runGit(['diff', '--cached', '--name-only']).output.split('\n').filter(Boolean)
const packageLockStaged = stagedFiles.includes('package-lock.json')
check(packageLockStaged === false, 'package-lock.json must not be staged.')

const policies = listFixtureBoundExportValidationPolicies()
check(policies.length === 1, 'Exactly one fixture-bound export validation policy is allowed.')
check(policies[0]?.policyId === EXPECTED_POLICY_ID, 'Only the expected export validation policy is allowed.')
for (const policy of policies) {
  const policyValidation = validateFixtureBoundExportValidationPolicy(policy)
  check(policyValidation.ok === true, `Policy validation failed: ${policyValidation.invalidPolicyFindings.join(', ')}`)
}

const sourceRun = await runToolCallingFixtureBoundMetadataProbe()
check(sourceRun.probeResults.length === 1, 'Expected one source fixture-bound metadata probe result.')
check(sourceRun.executesTools === true, 'Source metadata probe wrapper must report tool execution.')

const directResults = runFixtureBoundExportValidations(sourceRun.probeResults, policies)
const directValidationSummary = validateFixtureBoundExportValidationResults(directResults, policies)
check(directValidationSummary.ok === true, 'Direct export validation results must validate.')
check(directResults.length === policies.length, 'Every policy must produce one direct export validation result.')

const run = await runToolCallingFixtureBoundExportValidation()
const validationSummary = validateFixtureBoundExportValidationResults(
  run.exportValidationResults,
  run.exportValidationPolicies,
)
check(validationSummary.ok === true, 'Fixture-bound export validation wrapper output must validate.')
check(run.exportValidationResults.length === run.exportValidationPolicies.length, 'Every policy must produce one wrapper result.')
check(run.executesTools === false, 'Export validation wrapper must not execute tools.')
check(run.sourceProbeExecutesTools === true, 'Export validation wrapper must preserve source probe execution evidence.')
check(run.executionBoundary.executesTools === false, 'Execution boundary must report no export validation tool execution.')
check(run.executionBoundary.sourceProbeExecutesTools === true, 'Execution boundary must report source probe tool execution.')
check(run.executionBoundary.mediaProcessingPerformed === false, 'Execution boundary must not report media processing.')
check(run.executionBoundary.workerExecutionPerformed === false, 'Execution boundary must not report worker execution.')
check(run.executionBoundary.supabaseMutationPerformed === false, 'Execution boundary must not report Supabase mutation.')
check(run.executionBoundary.sqlExecuted === false, 'Execution boundary must not report SQL execution.')

const productionToolIds = new Set(PRODUCTION_TOOL_IDS)
const pendingExternalToolIds = new Set(
  listRuntimeIdReconciliationResults()
    .filter((result) => result.status === 'pending_production_tool_registry_expansion')
    .map((result) => result.externalToolId ?? result.inputToolId),
)
const forbiddenKeySet = new Set(FORBIDDEN_FIXTURE_BOUND_EXPORT_VALIDATION_KEYS)
const forbiddenFieldsFound = []
const unsafeStringValues = []
const commandFieldFindings = []
const nonFirstClassToolIds = []
const pendingExternalFindings = []
const rawJsonExposureFindings = []
const finalDeliveryPassedFindings = []

for (const policy of run.exportValidationPolicies) {
  check(policy.policyId === EXPECTED_POLICY_ID, `${policy.policyId} is not allowlisted.`)
  check(policy.sourceProbeToolId === 'ffprobe', `${policy.policyId} must use ffprobe source probe.`)
  check(policy.fixtureKind === 'synthetic_audio', `${policy.policyId} must use synthetic_audio.`)
  check(policy.acceptedContentTypes.length === 1 && policy.acceptedContentTypes[0] === 'audio/wav', `${policy.policyId} must accept audio/wav only.`)
  check(JSON.stringify(policy.requiredQualityGates) === JSON.stringify(EXPECTED_REQUIRED_GATES), `${policy.policyId} required gates changed.`)
  check(policy.optionalQualityGates.length === 1, `${policy.policyId} must have one optional gate.`)
  check(policy.optionalQualityGates[0]?.gateType === 'final_delivery', `${policy.policyId} optional gate must be final_delivery.`)
  check(policy.optionalQualityGates[0]?.status === 'skipped', `${policy.policyId} final_delivery must be skipped.`)
  check(policy.executesTools === false, `${policy.policyId} must not execute tools.`)
  check(policy.sourceProbeExecutesTools === true, `${policy.policyId} must preserve source probe tool execution evidence.`)
  if (!productionToolIds.has(policy.sourceProbeToolId)) nonFirstClassToolIds.push(policy.sourceProbeToolId)
  if (pendingExternalToolIds.has(policy.sourceProbeToolId)) pendingExternalFindings.push(policy.sourceProbeToolId)

  for (const entry of collectKeysDeep(policy)) {
    if (forbiddenKeySet.has(entry.key)) forbiddenFieldsFound.push(entry.path)
    if (['command', 'args', 'argv', 'exec', 'spawn'].includes(entry.key)) commandFieldFindings.push(entry.path)
  }
  for (const entry of collectStringValues(policy)) {
    if (looksLikeUnsafeString(entry.value)) unsafeStringValues.push(`${entry.path}=${entry.value}`)
  }
}

for (const result of run.exportValidationResults) {
  check(result.policyId === EXPECTED_POLICY_ID, `${result.validationRunId} policy mismatch.`)
  check(result.sourceProbeId === EXPECTED_SOURCE_PROBE_ID, `${result.validationRunId} source probe mismatch.`)
  check(result.sourceProbeToolId === 'ffprobe', `${result.validationRunId} must use ffprobe source tool.`)
  check(result.fixtureKind === 'synthetic_audio', `${result.validationRunId} must use synthetic_audio.`)
  check(result.contentType === 'audio/wav', `${result.validationRunId} must use audio/wav.`)
  if (!productionToolIds.has(result.sourceProbeToolId)) nonFirstClassToolIds.push(result.sourceProbeToolId)
  if (pendingExternalToolIds.has(result.sourceProbeToolId)) pendingExternalFindings.push(result.sourceProbeToolId)

  check(result.sourceProbeExecutesTools === true, `${result.validationRunId} must preserve source probe execution evidence.`)
  check(result.exportValidationPerformed === true, `${result.validationRunId} must perform export validation mapping.`)
  check(result.executesTools === false, `${result.validationRunId} must not execute tools.`)
  check(result.mediaProcessingPerformed === false, `${result.validationRunId} must not process media.`)
  check(result.realUserMediaUsed === false, `${result.validationRunId} must not use real user media.`)
  check(result.videoValidationPerformed === false, `${result.validationRunId} must not validate video.`)
  check(result.transcodingPerformed === false, `${result.validationRunId} must not transcode.`)
  check(result.muxingPerformed === false, `${result.validationRunId} must not mux.`)
  check(result.filteringPerformed === false, `${result.validationRunId} must not filter.`)
  check(result.renderingPerformed === false, `${result.validationRunId} must not render.`)
  check(result.workerExecutionPerformed === false, `${result.validationRunId} must not dispatch workers.`)
  check(result.providerCallsPerformed === false, `${result.validationRunId} must not call providers.`)
  check(result.supabaseMutationPerformed === false, `${result.validationRunId} must not mutate Supabase.`)
  check(result.sqlExecuted === false, `${result.validationRunId} must not run SQL.`)
  check(result.signedUrlsUsed === false, `${result.validationRunId} must not use signed URLs.`)
  check(result.rawProbeJsonExposed === false, `${result.validationRunId} must not expose raw ffprobe JSON.`)
  check(result.packageLockMutated === false, `${result.validationRunId} must not mutate package-lock.`)
  check(result.betaProductionUnlocked === false, `${result.validationRunId} must not unlock beta/prod.`)

  const requiredGates = result.qualityGateResults.filter((gate) => gate.required)
  check(requiredGates.length === EXPECTED_REQUIRED_GATES.length, `${result.validationRunId} required gate count mismatch.`)
  for (const gateType of EXPECTED_REQUIRED_GATES) {
    check(requiredGates.some((gate) => gate.gateType === gateType), `${result.validationRunId} missing ${gateType}.`)
  }
  const finalDeliveryGate = result.qualityGateResults.find((gate) => gate.gateType === 'final_delivery')
  check(finalDeliveryGate, `${result.validationRunId} missing final_delivery gate.`)
  check(finalDeliveryGate.status === 'skipped', `${result.validationRunId} final_delivery must be skipped.`)
  check(finalDeliveryGate.required === false, `${result.validationRunId} final_delivery must be optional.`)
  check(finalDeliveryGate.blocksFinalExport === true, `${result.validationRunId} final_delivery must block final export.`)
  check(
    finalDeliveryGate.reason === 'final_delivery_requires_real_export_validation_future_milestone',
    `${result.validationRunId} final_delivery reason mismatch.`,
  )
  if (finalDeliveryGate.status === 'passed') finalDeliveryPassedFindings.push(result.validationRunId)

  if (result.sourceProbeStatus === 'unavailable') {
    check(result.status === 'unavailable', `${result.validationRunId} must map source unavailable to unavailable.`)
  }
  if (result.sourceProbeStatus === 'failed_closed') {
    check(result.status === 'failed_closed', `${result.validationRunId} must map source failed_closed to failed_closed.`)
  }
  if (result.sourceProbeStatus === 'passed' && result.status === 'passed') {
    check(result.sanitizedInputSummary, `${result.validationRunId} passed result must include sanitized input summary.`)
    check(result.exportSummary, `${result.validationRunId} passed result must include export summary.`)
    check(result.exportSummary.videoStreamCount === 0, `${result.validationRunId} must have zero video streams.`)
    check(result.exportSummary.audioStreamCount >= 1, `${result.validationRunId} must have audio stream.`)
    check(result.exportSummary.metadataShapeValid === true, `${result.validationRunId} metadata shape must be valid.`)
    check(result.exportSummary.durationWithinExpectedRange === true, `${result.validationRunId} duration must be in range.`)
    check(result.exportSummary.hasOnlyAudioStreams === true, `${result.validationRunId} must have only audio streams.`)
    check(result.exportSummary.exportValidationShapeValid === true, `${result.validationRunId} export shape must be valid.`)
    check(requiredGates.every((gate) => gate.status === 'passed'), `${result.validationRunId} required gates must pass.`)
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

const duplicateSystems = duplicateSystemPaths()
const forbiddenImportFindings = fixtureBoundExportLayerForbiddenImports()

check(forbiddenFieldsFound.length === 0, `Forbidden fields found: ${forbiddenFieldsFound.join(', ')}`)
check(commandFieldFindings.length === 0, `Command-like fields found: ${commandFieldFindings.join(', ')}`)
check(unsafeStringValues.length === 0, `Unsafe string values found: ${unsafeStringValues.join(', ')}`)
check(rawJsonExposureFindings.length === 0, `Raw ffprobe JSON exposure found: ${rawJsonExposureFindings.join(', ')}`)
check(finalDeliveryPassedFindings.length === 0, `final_delivery gate passed unexpectedly: ${finalDeliveryPassedFindings.join(', ')}`)
check(nonFirstClassToolIds.length === 0, `Non-first-class tool IDs used: ${nonFirstClassToolIds.join(', ')}`)
check(pendingExternalFindings.length === 0, `Pending external tools used: ${pendingExternalFindings.join(', ')}`)
check(duplicateSystems.length === 0, `Duplicate tool-calling systems found: ${duplicateSystems.join(', ')}`)
check(forbiddenImportFindings.length === 0, `Fixture-bound export layer imports forbidden surfaces: ${forbiddenImportFindings.join(', ')}`)

const statusCounts = {
  passedCount: run.exportValidationResults.filter((result) => result.status === 'passed').length,
  blockedCount: run.exportValidationResults.filter((result) => result.status === 'blocked').length,
  unavailableCount: run.exportValidationResults.filter((result) => result.status === 'unavailable').length,
  failedClosedCount: run.exportValidationResults.filter((result) => result.status === 'failed_closed').length,
}

const coveredGates = uniqueSorted(run.exportValidationResults
  .flatMap((result) => result.qualityGateResults.map((gate) => gate.gateType)))

const output = {
  ok: true,
  refreshGate: refresh,
  validationPolicyCount: run.exportValidationPolicies.length,
  validationResultCount: run.exportValidationResults.length,
  directValidationResultCount: directResults.length,
  ...statusCounts,
  coveredGates,
  sourceTools: uniqueSorted(run.exportValidationResults.map((result) => result.sourceProbeToolId)),
  fixtureKinds: uniqueSorted(run.exportValidationResults.map((result) => result.fixtureKind)),
  contentTypes: uniqueSorted(run.exportValidationResults.map((result) => result.contentType)),
  sourceProbeStatuses: run.sourceProbeResults.map((result) => ({
    probeId: result.probeId,
    toolId: result.toolId,
    status: result.status,
    metadataProbePerformed: result.metadataProbePerformed,
    issues: result.issues,
    warnings: result.warnings,
  })),
  exportValidationStatuses: run.exportValidationResults.map((result) => ({
    policyId: result.policyId,
    sourceProbeStatus: result.sourceProbeStatus,
    status: result.status,
    qualityGateResults: result.qualityGateResults,
    exportSummary: result.exportSummary,
    issues: result.issues,
    warnings: result.warnings,
  })),
  requiredGates: EXPECTED_REQUIRED_GATES,
  finalDeliveryPassed: false,
  exportValidationPerformed: true,
  executesTools: false,
  sourceProbeExecutesTools: true,
  mediaProcessingPerformed: false,
  realUserMediaUsed: false,
  videoValidationPerformed: false,
  transcodingPerformed: false,
  muxingPerformed: false,
  filteringPerformed: false,
  renderingPerformed: false,
  workerExecutionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  signedUrlsUsed: false,
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
  validationSummary,
  decisionTarget: 'reeditpro_tool_calling_fixture_bound_export_validation_1_ready_for_next_fixture_bound_probe_or_worker_route_dry_run',
}

console.log(JSON.stringify(output, null, 2))
