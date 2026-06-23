import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { tsImport } from 'tsx/esm/api'

const expectedMergeCommit = 'b46509a54695dd049d044fd7135b37a8faaef18e'

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
  if (!row) throw new Error(`Missing Sound Gate 1C merged row: ${itemId}`)
  if (!predicate(row)) throw new Error(message)
}

const refreshGate = runJsonNpmScript('tool-calling:refresh-gate')
if (refreshGate.continueAllowed === false) {
  throw new Error(`Refresh gate blocked Sound Gate 1C merged reconciliation: ${(refreshGate.blockingReasons ?? []).join(', ')}`)
}
const unmergedOwnerEvidence = runJsonNpmScript('tool-calling:unmerged-owner-evidence')
const allOwnerStackReconciliation = runJsonNpmScript('tool-calling:all-owner-stack-reconciliation')
const soundOwnerExpansion = runJsonNpmScript('tool-calling:sound-music-audio-owner-expansion')
const soundCandidateStudyCards = runJsonNpmScript('tool-calling:sound-candidate-study-cards')
const soundRuntimeGate1 = runJsonNpmScript('tool-calling:sound-runtime-gate-1-reconciliation')
const soundGate1AMerged = runJsonNpmScript('tool-calling:sound-gate-1a-merged-reconciliation')
const soundGate1BMerged = runJsonNpmScript('tool-calling:sound-gate-1b-merged-reconciliation')

const registry = await tsImport('../../server/tool-registry/index.ts', import.meta.url)
const {
  analyzeSoundGate1CMergedReconciliation,
  loadSoundGate1CMergedSources,
  SOUND_GATE_1C_PLANNED_IMAGE_NAMES,
  SOUND_GATE_1C_PRESERVED_WORKER_NAMES,
  SOUND_GATE_1C_PRESERVED_JOB_TYPES,
  SOUND_GATE_1C_DOC_SURFACES,
  SOUND_GATE_1C_NEXT_PROMPTS,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)
const { PRODUCTION_TOOL_IDS } = registry

const sourceBundle = loadSoundGate1CMergedSources()
const analysis = analyzeSoundGate1CMergedReconciliation()
const rows = analysis.matrixRows

if (analysis.sourcePr !== 660) throw new Error('Sound Gate 1C merged analysis must reference PR #660.')
if (analysis.mergeCommit !== expectedMergeCommit) throw new Error('Sound Gate 1C merged analysis has the wrong merge commit.')
if (analysis.evidenceIsFinalSourceOfTruth !== true) throw new Error('PR #660 must be final owner source evidence.')
if (analysis.productionToolIdCount !== PRODUCTION_TOOL_IDS.length) throw new Error('ProductionToolId count changed during Gate 1C merged reconciliation.')
if (analysis.adaptersAdded !== 0 || analysis.commandIntentsAdded !== 0 || analysis.probesAdded !== 0) {
  throw new Error('Gate 1C merged reconciliation must not add adapters, command intents, or probes.')
}
if (
  analysis.workerRouteDryRunAdded ||
  analysis.workerExecutionPerformed ||
  analysis.imageBuildsPerformed ||
  analysis.dockerfilesAdded ||
  analysis.dockerActionPerformed ||
  analysis.gcpActionPerformed ||
  analysis.cloudRunActionPerformed ||
  analysis.importsRun
) {
  throw new Error('Gate 1C merged reconciliation must not build images, mutate Dockerfiles, deploy, execute workers, add worker-route dry-run, or run imports.')
}

assertIncludesAll(analysis.plannedImageNames, SOUND_GATE_1C_PLANNED_IMAGE_NAMES, 'planned image names')
assertIncludesAll(analysis.preservedWorkerNames, SOUND_GATE_1C_PRESERVED_WORKER_NAMES, 'preserved worker names')
assertIncludesAll(analysis.preservedJobTypes, SOUND_GATE_1C_PRESERVED_JOB_TYPES, 'preserved job types')
assertIncludesAll(analysis.docSurfaces, SOUND_GATE_1C_DOC_SURFACES, 'Gate 1C doc surfaces')
assertIncludesAll(analysis.nextPrompts, SOUND_GATE_1C_NEXT_PROMPTS, 'Gate 1C next prompts')

for (const itemId of SOUND_GATE_1C_PLANNED_IMAGE_NAMES) {
  assertRow(rows, itemId, (row) => (
    row.itemType === 'planned_image_name' &&
    row.acceptedByGate1C &&
    !row.imageBuildAllowedNow &&
    !row.dockerfileMutationAllowedNow &&
    row.executionGate === 'blocked_pending_gate_1e_dockerfile_static_plan'
  ), `${itemId} must be accepted by Gate 1C as image-name planning metadata only.`)
}
for (const itemId of SOUND_GATE_1C_PRESERVED_WORKER_NAMES) {
  assertRow(rows, itemId, (row) => (
    row.itemType === 'preserved_worker_name' &&
    row.acceptedByGate1C &&
    !row.workerDispatchAllowedNow &&
    row.executionGate === 'blocked_pending_gate_1d_worker_runtime_owner_handoff'
  ), `${itemId} must remain blocked pending Gate 1D worker runtime owner handoff.`)
}
for (const itemId of SOUND_GATE_1C_PRESERVED_JOB_TYPES) {
  assertRow(rows, itemId, (row) => (
    row.itemType === 'preserved_job_type' &&
    row.acceptedByGate1C &&
    !row.workerDispatchAllowedNow &&
    row.executionGate === 'blocked_pending_gate_1d_worker_runtime_owner_handoff'
  ), `${itemId} must remain a planning-only job type.`)
}

for (const row of rows) {
  if (!row.gate1cEvidenceStatus.includes('merged_owner_source_evidence')) {
    throw new Error(`${row.normalizedItemId} must include merged_owner_source_evidence.`)
  }
  if (!row.prMerged || row.mergeCommit !== expectedMergeCommit || row.evidenceIsFinalSourceOfTruth !== true) {
    throw new Error(`${row.normalizedItemId} must represent merged PR #660 final owner evidence.`)
  }
  if (
    row.acceptedForExecution ||
    row.imageBuildAllowedNow ||
    row.dockerfileMutationAllowedNow ||
    row.gcpCallAllowedNow ||
    row.cloudRunAllowedNow ||
    row.serviceAccountAllowedNow ||
    row.secretManagerAllowedNow ||
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
    throw new Error(`${row.normalizedItemId} enables a forbidden Gate 1C build, deploy, execution, route, or mutation surface.`)
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
  filePath.includes('Dockerfile') ||
  /^requirements.*\.txt$/.test(filePath)
))
if (forbiddenChangedFiles.length > 0) {
  throw new Error(`Forbidden files changed by Gate 1C merged reconciliation: ${forbiddenChangedFiles.join(', ')}`)
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
  pr660Found: true,
  pr660Merged: true,
  evidenceIsFinalSourceOfTruth: analysis.evidenceIsFinalSourceOfTruth,
  gate1cMatrixRows: analysis.gate1cMatrixRows,
  plannedImageNameCount: analysis.plannedImageNameCount,
  preservedWorkerNameCount: analysis.preservedWorkerNameCount,
  preservedJobTypeCount: analysis.preservedJobTypeCount,
  docSurfaceCount: analysis.docSurfaceCount,
  blockedRowCount: analysis.blockedRowCount,
  relatedSoundToolCount: analysis.relatedSoundToolCount,
  nextPromptCount: analysis.nextPromptCount,
  plannedImageNames: analysis.plannedImageNames,
  preservedWorkerNames: analysis.preservedWorkerNames,
  preservedJobTypes: analysis.preservedJobTypes,
  docSurfaces: analysis.docSurfaces,
  nextPrompts: analysis.nextPrompts,
  productionToolIdCount: analysis.productionToolIdCount,
  productionToolIdCountChanged: analysis.productionToolIdCountChanged,
  adaptersAdded: analysis.adaptersAdded,
  commandIntentsAdded: analysis.commandIntentsAdded,
  probesAdded: analysis.probesAdded,
  workerRouteDryRunAdded: analysis.workerRouteDryRunAdded,
  workerExecutionPerformed: analysis.workerExecutionPerformed,
  imageBuildsPerformed: analysis.imageBuildsPerformed,
  dockerfilesAdded: analysis.dockerfilesAdded,
  dockerActionPerformed: analysis.dockerActionPerformed,
  gcpActionPerformed: analysis.gcpActionPerformed,
  cloudRunActionPerformed: analysis.cloudRunActionPerformed,
  importsRun: analysis.importsRun,
  prerequisiteDiagnostics: {
    allOwnerStackRows: allOwnerStackReconciliation.totalMatrixRows,
    soundOwnerExpansionRows: soundOwnerExpansion.soundMatrixRows,
    soundCandidateStudyCardCount: soundCandidateStudyCards.candidateStudyCardCount,
    soundRuntimeGate1Rows: soundRuntimeGate1.gate1MatrixRows,
    soundGate1AMergedRows: soundGate1AMerged.gate1aMatrixRows,
    soundGate1BMergedRows: soundGate1BMerged.gate1bMatrixRows,
  },
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
  workerRouteDryRunAdded: false,
  imageBuildsPerformed: false,
  dockerActionPerformed: false,
  gcpActionPerformed: false,
  cloudRunActionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  migrationsCreated: false,
  signedUrlsCreated: false,
  packageLockMutated: false,
  betaProductionUnlocked: false,
  decisionTarget: 'reeditpro_tool_calling_sound_gate_1c_merged_reconciliation_1_ready_for_gate_1d_or_generic_worker_route_dry_run',
}

console.log(JSON.stringify(summary, null, 2))
