import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { tsImport } from 'tsx/esm/api'

const forbiddenKeys = new Set([
  'rawPrompt',
  'raw_prompt',
  'signedUrl',
  'signed_url',
  'serviceRole',
  'service_role',
  'arbitraryArgs',
  'arbitrary_args',
  'command',
  'args',
  'argv',
  'exec',
  'spawn',
  'localPath',
  'local_path',
  'outputPath',
  'output_path',
])

function runCommand(command, args) {
  const childEnv = { ...process.env }
  delete childEnv.DEVELOPER_DIR
  const stdout = execFileSync(command, args, {
    cwd: process.cwd(),
    env: childEnv,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  return stdout
}

function extractJsonObject(output, context) {
  const start = output.indexOf('{')
  const end = output.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${context} did not print a JSON object.`)
  }

  return JSON.parse(output.slice(start, end + 1))
}

function runJsonNpmScript(scriptName) {
  return extractJsonObject(runCommand('npm', ['run', scriptName]), scriptName)
}

function collectForbiddenFields(value, path = '$', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectForbiddenFields(entry, `${path}[${index}]`, findings))
    return findings
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string') {
      if (/https?:\/\//i.test(value)) findings.push(`${path}:url`)
      if (/\/Users\/|\/private\/|\/Volumes\//.test(value)) findings.push(`${path}:absolute_path`)
      if (/&&|\|\||`|\$\(|\n/.test(value)) findings.push(`${path}:shell_like_value`)
    }
    return findings
  }

  for (const [key, entry] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) findings.push(`${path}.${key}:forbidden_key`)
    collectForbiddenFields(entry, `${path}.${key}`, findings)
  }

  return findings
}

function changedFiles() {
  return runCommand('git', ['status', '--short'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(3))
}

function stagedFiles() {
  return runCommand('git', ['diff', '--cached', '--name-only'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function packageLockHash() {
  return createHash('sha256')
    .update(readFileSync('package-lock.json'))
    .digest('hex')
}

function assertIncludesAll(actual, expected, context) {
  const missing = expected.filter((item) => !actual.includes(item))
  if (missing.length > 0) {
    throw new Error(`${context} missing: ${missing.join(', ')}`)
  }
}

function assertRow(rows, toolId, predicate, message) {
  const row = rows.find((candidate) => candidate.normalizedToolId === toolId)
  if (!row) throw new Error(`Missing Sound Runtime Gate 1 row: ${toolId}`)
  if (!predicate(row)) throw new Error(message)
}

const refreshGate = runJsonNpmScript('tool-calling:refresh-gate')
if (refreshGate.continueAllowed === false) {
  throw new Error(`Refresh gate blocked Sound Runtime Gate 1 reconciliation: ${(refreshGate.blockingReasons ?? []).join(', ')}`)
}
const unmergedOwnerEvidence = runJsonNpmScript('tool-calling:unmerged-owner-evidence')
const soundCandidateStudyCards = runJsonNpmScript('tool-calling:sound-candidate-study-cards')

const registry = await tsImport('../../server/tool-registry/index.ts', import.meta.url)
const {
  analyzeSoundRuntimeGate1Coverage,
  loadSoundRuntimeGate1Sources,
  SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES,
  SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS,
  SOUND_RUNTIME_GATE_1_PLANNING_ONLY_WORKERS,
  SOUND_RUNTIME_GATE_1_PLANNING_ONLY_JOB_TYPES,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)
const { PRODUCTION_TOOL_IDS } = registry

const sourceBundle = loadSoundRuntimeGate1Sources()
const analysis = analyzeSoundRuntimeGate1Coverage()
const rows = analysis.matrixRows

assertIncludesAll(analysis.directPinnedPackages, SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES, 'direct pinned package rows')
assertIncludesAll(analysis.aliasCoveredTools, SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS, 'alias-covered rows')
assertIncludesAll(rows.map((row) => row.normalizedToolId), SOUND_RUNTIME_GATE_1_PLANNING_ONLY_WORKERS, 'planning-only worker rows')
assertIncludesAll(rows.map((row) => row.normalizedToolId), SOUND_RUNTIME_GATE_1_PLANNING_ONLY_JOB_TYPES, 'planning-only job type rows')

if (analysis.directPinnedPackageCount !== 13) throw new Error('Expected 13 direct pinned packages.')
if (analysis.aliasCoveredToolCount !== 2) throw new Error('Expected 2 alias-covered tools.')
if (analysis.cpuInstallCandidateCount !== 15) throw new Error('Expected 15 CPU install candidates.')
if (analysis.productionToolIdCount !== PRODUCTION_TOOL_IDS.length) throw new Error('ProductionToolId count changed during Gate 1 reconciliation.')
if (analysis.adaptersAdded !== 0 || analysis.commandIntentsAdded !== 0 || analysis.probesAdded !== 0) {
  throw new Error('Gate 1 reconciliation must not add adapters, command intents, or probes.')
}

assertRow(rows, 'signalsmith_stretch', (row) => (
  row.gate1EvidenceStatus.includes('approved_plan_covered_planning_only') &&
  row.executionGate === 'planning_only'
), 'signalsmith_stretch must remain approved-plan-covered and planning-only for Gate 1.')
for (const toolId of ['audioread', 'pydub', 'pydub_effects']) {
  assertRow(rows, toolId, (row) => row.executionGate === 'blocked_pending_media_policy', `${toolId} must remain blocked pending media policy.`)
}
for (const toolId of ['deepfilternet', 'demucs', 'whisper_cpp']) {
  assertRow(rows, toolId, (row) => row.executionGate === 'blocked_pending_model_review', `${toolId} must remain blocked pending model review.`)
}
for (const toolId of SOUND_RUNTIME_GATE_1_PLANNING_ONLY_WORKERS) {
  assertRow(rows, toolId, (row) => row.executionGate === 'blocked_pending_gate_1b_worker_contract_review', `${toolId} must wait for Gate 1B.`)
}
if (rows.some((row) => row.normalizedToolId === 'ffmpeg' || row.normalizedToolId === 'ffprobe')) {
  throw new Error('Gate 1 reconciliation must not add FFmpeg/ffprobe expansion under SOUND.')
}

const filesChanged = changedFiles()
const filesStaged = stagedFiles()
const forbiddenChangedFiles = filesChanged.filter((filePath) => (
  filePath === 'package-lock.json' ||
  filePath.startsWith('docker/') ||
  filePath.startsWith('supabase/') ||
  filePath.startsWith('migrations/') ||
  filePath.startsWith('database/') ||
  filePath.endsWith('.sql') ||
  /^requirements.*\.txt$/.test(filePath)
))
if (forbiddenChangedFiles.length > 0) {
  throw new Error(`Forbidden files changed by Gate 1 reconciliation: ${forbiddenChangedFiles.join(', ')}`)
}
if (filesStaged.includes('package-lock.json')) {
  throw new Error('package-lock.json must not be staged.')
}

const forbiddenFieldsFound = collectForbiddenFields({
  sourceBundle,
  analysis,
})
if (forbiddenFieldsFound.length > 0) {
  throw new Error(`Forbidden fields or unsafe strings found: ${forbiddenFieldsFound.join(', ')}`)
}

const duplicateSystems = filesChanged.filter((filePath) => (
  filePath.includes('production-worker-router') ||
  filePath.startsWith('server/tool-registry/') ||
  filePath.includes('qa-policy') ||
  filePath.includes('fallback-policy') ||
  filePath.includes('adapter-registry') ||
  filePath.includes('safe-command-plan-policy') ||
  filePath.includes('fixture-bound-metadata-probe-policy') ||
  filePath.includes('fixture-bound-export-validation-policy')
))
if (duplicateSystems.length > 0) {
  throw new Error(`Duplicate system files changed: ${duplicateSystems.join(', ')}`)
}

const summary = {
  ok: true,
  refreshGateContinueAllowed: refreshGate.continueAllowed,
  refreshGateWarnings: refreshGate.warnings ?? [],
  githubPrScanAvailable: refreshGate.githubPrScanAvailable === true || unmergedOwnerEvidence.githubPrScanAvailable === true,
  sourcePr: sourceBundle.matrixDocument.evidenceSummary.sourcePr,
  sourceMilestone: sourceBundle.matrixDocument.evidenceSummary.sourceMilestone,
  gate1MatrixRows: analysis.gate1MatrixRows,
  directPinnedPackageCount: analysis.directPinnedPackageCount,
  aliasCoveredToolCount: analysis.aliasCoveredToolCount,
  cpuInstallCandidateCount: analysis.cpuInstallCandidateCount,
  planningOnlyWorkerCount: analysis.planningOnlyWorkerCount,
  planningOnlyJobTypeCount: analysis.planningOnlyJobTypeCount,
  firstClassCoveredCount: analysis.firstClassCoveredCount,
  candidateOnlyCount: analysis.candidateOnlyCount,
  blockedCount: analysis.blockedCount,
  productionToolIdCount: analysis.productionToolIdCount,
  productionToolIdCountChanged: analysis.productionToolIdCountChanged,
  adaptersAdded: analysis.adaptersAdded,
  commandIntentsAdded: analysis.commandIntentsAdded,
  probesAdded: analysis.probesAdded,
  soundCandidateStudyCardCount: soundCandidateStudyCards.candidateStudyCardCount,
  directPinnedPackages: analysis.directPinnedPackages,
  aliasCoveredTools: analysis.aliasCoveredTools,
  futureOwnerPrompts: analysis.futureOwnerPrompts,
  recommendedNextMilestones: analysis.recommendedNextMilestones,
  packageLockHash: packageLockHash(),
  packageLockStaged: filesStaged.includes('package-lock.json'),
  forbiddenChangedFiles,
  forbiddenFieldsFound,
  duplicateSystemsCreated: false,
  duplicateSystems: [],
  executesTools: false,
  audioProcessingPerformed: false,
  mediaProcessingPerformed: false,
  workerExecutionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  migrationsCreated: false,
  signedUrlsCreated: false,
  packageLockMutated: false,
  betaProductionUnlocked: false,
  decisionTarget: 'reeditpro_tool_calling_sound_runtime_gate_1_reconciliation_1_ready_after_owner_gate_1a_or_gate_1b',
}

console.log(JSON.stringify(summary, null, 2))
