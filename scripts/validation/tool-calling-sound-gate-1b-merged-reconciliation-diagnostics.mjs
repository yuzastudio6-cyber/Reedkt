import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { tsImport } from 'tsx/esm/api'

const expectedMergeCommit = '5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91'

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

function assertRow(rows, itemId, predicate, message) {
  const row = rows.find((candidate) => candidate.normalizedItemId === itemId)
  if (!row) throw new Error(`Missing Sound Gate 1B merged row: ${itemId}`)
  if (!predicate(row)) throw new Error(message)
}

const refreshGate = runJsonNpmScript('tool-calling:refresh-gate')
if (refreshGate.continueAllowed === false) {
  throw new Error(`Refresh gate blocked Sound Gate 1B merged reconciliation: ${(refreshGate.blockingReasons ?? []).join(', ')}`)
}
const unmergedOwnerEvidence = runJsonNpmScript('tool-calling:unmerged-owner-evidence')
const allOwnerStackReconciliation = runJsonNpmScript('tool-calling:all-owner-stack-reconciliation')
const soundOwnerExpansion = runJsonNpmScript('tool-calling:sound-music-audio-owner-expansion')
const soundCandidateStudyCards = runJsonNpmScript('tool-calling:sound-candidate-study-cards')
const soundRuntimeGate1 = runJsonNpmScript('tool-calling:sound-runtime-gate-1-reconciliation')
const soundGate1AMerged = runJsonNpmScript('tool-calling:sound-gate-1a-merged-reconciliation')

const registry = await tsImport('../../server/tool-registry/index.ts', import.meta.url)
const {
  analyzeSoundGate1BMergedReconciliation,
  loadSoundGate1BMergedSources,
  SOUND_GATE_1B_ACCEPTED_WORKER_NAMES,
  SOUND_GATE_1B_ACCEPTED_JOB_TYPES,
  SOUND_GATE_1B_NOT_ACCEPTED_JOB_TYPES,
  SOUND_GATE_1B_OWNER_HANDOFF_SURFACES,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)
const { PRODUCTION_TOOL_IDS } = registry

const sourceBundle = loadSoundGate1BMergedSources()
const analysis = analyzeSoundGate1BMergedReconciliation()
const rows = analysis.matrixRows

if (analysis.sourcePr !== 653) throw new Error('Sound Gate 1B merged analysis must reference PR #653.')
if (analysis.mergeCommit !== expectedMergeCommit) throw new Error('Sound Gate 1B merged analysis has the wrong merge commit.')
if (analysis.evidenceIsFinalSourceOfTruth !== true) throw new Error('PR #653 must be final owner source evidence.')
if (analysis.productionToolIdCount !== PRODUCTION_TOOL_IDS.length) throw new Error('ProductionToolId count changed during Gate 1B merged reconciliation.')
if (analysis.adaptersAdded !== 0 || analysis.commandIntentsAdded !== 0 || analysis.probesAdded !== 0) {
  throw new Error('Gate 1B merged reconciliation must not add adapters, command intents, or probes.')
}
if (analysis.workerRouteDryRunAdded || analysis.workerExecutionPerformed || analysis.importsRun) {
  throw new Error('Gate 1B merged reconciliation must not add worker-route dry-run, execute workers, or run imports.')
}

assertIncludesAll(analysis.acceptedWorkerNames, SOUND_GATE_1B_ACCEPTED_WORKER_NAMES, 'accepted worker names')
assertIncludesAll(analysis.acceptedJobTypes, SOUND_GATE_1B_ACCEPTED_JOB_TYPES, 'accepted job types')
assertIncludesAll(analysis.notAcceptedJobTypes, SOUND_GATE_1B_NOT_ACCEPTED_JOB_TYPES, 'not-accepted job types')
assertIncludesAll(analysis.ownerHandoffSurfaces, SOUND_GATE_1B_OWNER_HANDOFF_SURFACES, 'owner handoff surfaces')

for (const itemId of SOUND_GATE_1B_ACCEPTED_WORKER_NAMES) {
  assertRow(rows, itemId, (row) => (
    row.itemType === 'accepted_worker_name' &&
    row.acceptedByGate1B &&
    !row.acceptedForExecution &&
    row.executionGate === 'blocked_pending_gate_1c_cpu_worker_image_plan'
  ), `${itemId} must be accepted by Gate 1B as planning metadata only.`)
}
for (const itemId of SOUND_GATE_1B_ACCEPTED_JOB_TYPES) {
  assertRow(rows, itemId, (row) => (
    row.itemType === 'accepted_job_type' &&
    row.acceptedByGate1B &&
    !row.acceptedForExecution &&
    row.executionGate === 'blocked_pending_gate_1c_cpu_worker_image_plan'
  ), `${itemId} must be accepted by Gate 1B as planning metadata only.`)
}
assertRow(rows, 'sound.synthetic_fixture_validate', (row) => (
  row.itemType === 'rejected_job_type' &&
  row.gate1bEvidenceStatus.includes('not_accepted_for_worker_contract') &&
  !row.acceptedByGate1B
), 'sound.synthetic_fixture_validate must be represented as not accepted for the Gate 1B worker contract.')

for (const row of rows) {
  if (!row.gate1bEvidenceStatus.includes('merged_owner_source_evidence')) {
    throw new Error(`${row.normalizedItemId} must include merged_owner_source_evidence.`)
  }
  if (!row.prMerged || row.mergeCommit !== expectedMergeCommit || row.evidenceIsFinalSourceOfTruth !== true) {
    throw new Error(`${row.normalizedItemId} must represent merged PR #653 final owner evidence.`)
  }
  if (
    row.acceptedForExecution ||
    row.workerDispatchAllowedNow ||
    row.routeExecutionAllowedNow ||
    row.toolExecutionAllowedNow ||
    row.mediaProcessingAllowedNow ||
    row.supabaseMutationAllowedNow ||
    row.sqlAllowedNow ||
    row.publicArtifactsAllowedNow ||
    row.betaProductionAllowedNow ||
    row.currentToolCallingCoverage.hasWorkerRouteDryRun
  ) {
    throw new Error(`${row.normalizedItemId} enables a forbidden Gate 1B execution or mutation surface.`)
  }
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
  throw new Error(`Forbidden files changed by Gate 1B merged reconciliation: ${forbiddenChangedFiles.join(', ')}`)
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
  filePath.includes('runtime-table') ||
  filePath.includes('worker-route-dry-run')
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
  pr653Found: true,
  pr653Merged: true,
  evidenceIsFinalSourceOfTruth: analysis.evidenceIsFinalSourceOfTruth,
  gate1bMatrixRows: analysis.gate1bMatrixRows,
  acceptedWorkerNameCount: analysis.acceptedWorkerNameCount,
  acceptedJobTypeCount: analysis.acceptedJobTypeCount,
  notAcceptedJobTypeCount: analysis.notAcceptedJobTypeCount,
  blockedRowCount: analysis.blockedRowCount,
  ownerHandoffSurfaceCount: analysis.ownerHandoffSurfaceCount,
  relatedSoundToolCount: analysis.relatedSoundToolCount,
  acceptedWorkerNames: analysis.acceptedWorkerNames,
  acceptedJobTypes: analysis.acceptedJobTypes,
  notAcceptedJobTypes: analysis.notAcceptedJobTypes,
  ownerHandoffSurfaces: analysis.ownerHandoffSurfaces,
  productionToolIdCount: analysis.productionToolIdCount,
  productionToolIdCountChanged: analysis.productionToolIdCountChanged,
  adaptersAdded: analysis.adaptersAdded,
  commandIntentsAdded: analysis.commandIntentsAdded,
  probesAdded: analysis.probesAdded,
  workerRouteDryRunAdded: analysis.workerRouteDryRunAdded,
  workerExecutionPerformed: analysis.workerExecutionPerformed,
  importsRun: analysis.importsRun,
  recommendedNextMilestones: analysis.recommendedNextMilestones,
  prerequisiteDiagnostics: {
    allOwnerStackRows: allOwnerStackReconciliation.totalMatrixRows,
    soundOwnerExpansionRows: soundOwnerExpansion.soundMatrixRows,
    soundCandidateStudyCardCount: soundCandidateStudyCards.candidateStudyCardCount,
    soundRuntimeGate1Rows: soundRuntimeGate1.gate1MatrixRows,
    soundGate1AMergedRows: soundGate1AMerged.gate1aMatrixRows,
  },
  packageLockHash: packageLockHash(),
  packageLockStaged: filesStaged.includes('package-lock.json'),
  forbiddenChangedFiles,
  forbiddenFieldsFound,
  duplicateSystemsCreated: false,
  duplicateSystems: [],
  executesTools: false,
  audioProcessingPerformed: false,
  mediaProcessingPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  migrationsCreated: false,
  signedUrlsCreated: false,
  packageLockMutated: false,
  betaProductionUnlocked: false,
  decisionTarget: 'reeditpro_tool_calling_sound_gate_1b_merged_reconciliation_1_ready_for_gate_1c_or_generic_worker_route_dry_run',
}

console.log(JSON.stringify(summary, null, 2))
