import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { tsImport } from 'tsx/esm/api'

const expectedMergeCommit = '0126327c19f1af18bb1ca040c31d06736693d1b6'

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
  return execFileSync(command, args, {
    cwd: process.cwd(),
    env: childEnv,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
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
  if (!row) throw new Error(`Missing Sound Gate 1A merged row: ${toolId}`)
  if (!predicate(row)) throw new Error(message)
}

const refreshGate = runJsonNpmScript('tool-calling:refresh-gate')
if (refreshGate.continueAllowed === false) {
  throw new Error(`Refresh gate blocked Sound Gate 1A merged reconciliation: ${(refreshGate.blockingReasons ?? []).join(', ')}`)
}
const unmergedOwnerEvidence = runJsonNpmScript('tool-calling:unmerged-owner-evidence')
const allOwnerStackReconciliation = runJsonNpmScript('tool-calling:all-owner-stack-reconciliation')
const soundOwnerExpansion = runJsonNpmScript('tool-calling:sound-music-audio-owner-expansion')
const soundCandidateStudyCards = runJsonNpmScript('tool-calling:sound-candidate-study-cards')
const soundRuntimeGate1 = runJsonNpmScript('tool-calling:sound-runtime-gate-1-reconciliation')

const registry = await tsImport('../../server/tool-registry/index.ts', import.meta.url)
const {
  analyzeSoundGate1AMergedReconciliation,
  loadSoundGate1AMergedSources,
  SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES,
  SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)
const { PRODUCTION_TOOL_IDS } = registry

const sourceBundle = loadSoundGate1AMergedSources()
const analysis = analyzeSoundGate1AMergedReconciliation()
const rows = analysis.matrixRows

if (analysis.sourcePr !== 647) throw new Error('Sound Gate 1A merged analysis must reference PR #647.')
if (analysis.mergeCommit !== expectedMergeCommit) throw new Error('Sound Gate 1A merged analysis has the wrong merge commit.')
if (analysis.evidenceIsFinalSourceOfTruth !== true) throw new Error('PR #647 must be final owner source evidence.')
if (analysis.gate1aMatrixRows !== 29) throw new Error('Expected 29 Sound Gate 1A merged rows.')
if (analysis.productionToolIdCount !== PRODUCTION_TOOL_IDS.length) throw new Error('ProductionToolId count changed during Gate 1A merged reconciliation.')
if (analysis.adaptersAdded !== 0 || analysis.commandIntentsAdded !== 0 || analysis.probesAdded !== 0) {
  throw new Error('Gate 1A merged reconciliation must not add adapters, command intents, or probes.')
}
if (analysis.importsRun !== false) {
  throw new Error('Gate 1A merged reconciliation must not run package imports.')
}

assertIncludesAll(analysis.directPinnedPackages, SOUND_RUNTIME_GATE_1_DIRECT_PINNED_PACKAGES, 'direct pinned package rows')
assertIncludesAll(analysis.aliasCoveredTools, SOUND_RUNTIME_GATE_1_ALIAS_COVERED_TOOLS, 'alias-covered rows')

for (const row of rows) {
  if (!row.gate1aEvidenceStatus.includes('merged_owner_source_evidence')) {
    throw new Error(`${row.normalizedToolId} must include merged_owner_source_evidence.`)
  }
  if (!row.prMerged || row.mergeCommit !== expectedMergeCommit || row.evidenceIsFinalSourceOfTruth !== true) {
    throw new Error(`${row.normalizedToolId} must represent merged PR #647 final owner evidence.`)
  }
  if (!row.productionToolId && row.selectableAsRuntimeTool) {
    throw new Error(`${row.normalizedToolId} is candidate-only but selectable.`)
  }
  if (!row.productionToolId && (
    row.currentToolCallingCoverage.hasAdapterContract ||
    row.currentToolCallingCoverage.hasSafeCommandIntent ||
    row.currentToolCallingCoverage.hasFixturePlan ||
    row.currentToolCallingCoverage.hasControlledProbe
  )) {
    throw new Error(`${row.normalizedToolId} is candidate-only but gained runtime coverage.`)
  }
}

for (const toolId of ['audioread', 'pydub', 'pydub_effects']) {
  assertRow(rows, toolId, (row) => (
    row.executionGate === 'blocked_pending_media_policy' &&
    row.gate1aEvidenceStatus.includes('blocked_by_owner_gate')
  ), `${toolId} must remain blocked pending media policy.`)
}
for (const toolId of ['deepfilternet', 'demucs', 'whisper_cpp']) {
  assertRow(rows, toolId, (row) => (
    row.executionGate === 'blocked_pending_model_review' &&
    row.gate1aEvidenceStatus.includes('blocked_by_owner_gate')
  ), `${toolId} must remain blocked pending model review.`)
}
for (const toolId of ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker', 'package_import_smoke_job_type', 'numeric_array_analysis_job_type', 'symbolic_midi_analysis_job_type', 'loudness_synthetic_analysis_job_type']) {
  assertRow(rows, toolId, (row) => (
    row.executionGate === 'blocked_pending_gate_1b_worker_contract_review' &&
    row.gate1aEvidenceStatus.includes('blocked_by_owner_gate')
  ), `${toolId} must remain blocked pending Gate 1B.`)
}
if (rows.some((row) => row.normalizedToolId === 'ffmpeg' || row.normalizedToolId === 'ffprobe')) {
  throw new Error('Sound Gate 1A merged reconciliation must not add FFmpeg/ffprobe expansion under SOUND.')
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
  throw new Error(`Forbidden files changed by Gate 1A merged reconciliation: ${forbiddenChangedFiles.join(', ')}`)
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
  filePath.includes('fixture-bound-export-validation-policy') ||
  filePath.includes('runtime-table')
))
if (duplicateSystems.length > 0) {
  throw new Error(`Duplicate system files changed: ${duplicateSystems.join(', ')}`)
}

const summary = {
  ok: true,
  refreshGateContinueAllowed: refreshGate.continueAllowed,
  refreshGateWarnings: refreshGate.warnings ?? [],
  githubPrScanAvailable: refreshGate.githubPrScanAvailable === true || unmergedOwnerEvidence.githubPrScanAvailable === true,
  sourcePr: analysis.sourcePr,
  sourceMilestone: sourceBundle.matrixDocument.evidenceSummary.sourceMilestone,
  mergeCommit: analysis.mergeCommit,
  pr647Merged: true,
  evidenceIsFinalSourceOfTruth: analysis.evidenceIsFinalSourceOfTruth,
  gate1aMatrixRows: analysis.gate1aMatrixRows,
  directPinnedPackageCount: analysis.directPinnedPackageCount,
  aliasCoveredToolCount: analysis.aliasCoveredToolCount,
  mergedEvidenceRowCount: analysis.mergedEvidenceRowCount,
  blockedRowCount: analysis.blockedRowCount,
  firstClassCoveredCount: analysis.firstClassCoveredCount,
  candidateOnlyCount: analysis.candidateOnlyCount,
  productionToolIdCount: analysis.productionToolIdCount,
  productionToolIdCountChanged: analysis.productionToolIdCountChanged,
  adaptersAdded: analysis.adaptersAdded,
  commandIntentsAdded: analysis.commandIntentsAdded,
  probesAdded: analysis.probesAdded,
  importsRun: analysis.importsRun,
  metadataChecksPassed: sourceBundle.matrixDocument.evidenceSummary.metadataChecksPassed,
  metadataChecksFailed: sourceBundle.matrixDocument.evidenceSummary.metadataChecksFailed,
  importChecksPassed: sourceBundle.matrixDocument.evidenceSummary.importChecksPassed,
  importChecksFailed: sourceBundle.matrixDocument.evidenceSummary.importChecksFailed,
  importChecksInclude: sourceBundle.matrixDocument.evidenceSummary.importChecksInclude,
  failedImports: sourceBundle.matrixDocument.evidenceSummary.failedImports,
  python3Observed: sourceBundle.matrixDocument.evidenceSummary.python3Observed,
  pythonUnavailable: sourceBundle.matrixDocument.evidenceSummary.pythonUnavailable,
  tempVenvRemoved: sourceBundle.matrixDocument.evidenceSummary.tempVenvRemoved,
  directPinnedPackages: analysis.directPinnedPackages,
  aliasCoveredTools: analysis.aliasCoveredTools,
  blockedRows: analysis.blockedRows,
  recommendedNextMilestones: analysis.recommendedNextMilestones,
  prerequisiteDiagnostics: {
    allOwnerStackRows: allOwnerStackReconciliation.totalMatrixRows,
    soundOwnerExpansionRows: soundOwnerExpansion.soundMatrixRows,
    soundCandidateStudyCardCount: soundCandidateStudyCards.candidateStudyCardCount,
    soundRuntimeGate1Rows: soundRuntimeGate1.gate1MatrixRows,
  },
  packageLockHash: packageLockHash(),
  packageLockStaged: filesStaged.includes('package-lock.json'),
  forbiddenChangedFiles,
  forbiddenFieldsFound,
  duplicateSystemsCreated: false,
  duplicateSystems: [],
  executesTools: false,
  importsRunByToolCalling: false,
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
  decisionTarget: 'reeditpro_tool_calling_sound_gate_1a_merged_reconciliation_1_ready_for_gate_1b_reconciliation',
}

console.log(JSON.stringify(summary, null, 2))
