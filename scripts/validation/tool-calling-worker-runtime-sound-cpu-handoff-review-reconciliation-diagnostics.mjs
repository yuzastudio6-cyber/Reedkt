import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { tsImport } from 'tsx/esm/api'

const expectedMergeCommit = 'f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc'

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

function runCommand(command, args, options = {}) {
  const childEnv = { ...process.env }
  delete childEnv.DEVELOPER_DIR
  return execFileSync(command, args, {
    cwd: process.cwd(),
    env: childEnv,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: options.timeout ?? 300000,
  })
}

function tryRunCommand(command, args) {
  try {
    return {
      ok: true,
      output: runCommand(command, args, { timeout: 15000 }),
      error: null,
    }
  } catch (error) {
    return {
      ok: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
    }
  }
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
  return extractJsonObject(runCommand('npm', ['run', scriptName], { timeout: 300000 }), scriptName)
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
  if (!row) throw new Error(`Missing Worker Runtime Sound CPU handoff review row: ${itemId}`)
  if (!predicate(row)) throw new Error(message)
}

function inspectGithubEvidence() {
  const prView = tryRunCommand('gh', [
    'pr',
    'view',
    '670',
    '--repo',
    'yuzastudio6-cyber/Reedkt',
    '--json',
    'number,state,mergedAt,mergeCommit,headRefName,title',
  ])
  if (!prView.ok) {
    return {
      githubPrScanAvailable: false,
      githubPrScanError: prView.error,
      pr670LiveState: null,
      staticContractPlanPrState: 'not_checked',
    }
  }

  const parsed = JSON.parse(prView.output)
  const staticContractSearch = tryRunCommand('gh', [
    'pr',
    'list',
    '--repo',
    'yuzastudio6-cyber/Reedkt',
    '--state',
    'all',
    '--search',
    'WORKER_RUNTIME_JOBS-SOUND-CPU-STATIC-CONTRACT-PLAN',
    '--limit',
    '5',
    '--json',
    'number,state,isDraft,title,headRefName,mergedAt',
  ])

  return {
    githubPrScanAvailable: true,
    githubPrScanError: null,
    pr670LiveState: parsed,
    staticContractPlanPrState: staticContractSearch.ok ? JSON.parse(staticContractSearch.output) : 'unavailable',
  }
}

const refreshGate = runJsonNpmScript('tool-calling:refresh-gate')
if (refreshGate.continueAllowed === false) {
  throw new Error(`Refresh gate blocked Worker Runtime Sound CPU handoff review reconciliation: ${(refreshGate.blockingReasons ?? []).join(', ')}`)
}
const unmergedOwnerEvidence = runJsonNpmScript('tool-calling:unmerged-owner-evidence')
const allOwnerStackReconciliation = runJsonNpmScript('tool-calling:all-owner-stack-reconciliation')
const soundOwnerExpansion = runJsonNpmScript('tool-calling:sound-music-audio-owner-expansion')
const soundCandidateStudyCards = runJsonNpmScript('tool-calling:sound-candidate-study-cards')
const soundRuntimeGate1 = runJsonNpmScript('tool-calling:sound-runtime-gate-1-reconciliation')
const soundGate1AMerged = runJsonNpmScript('tool-calling:sound-gate-1a-merged-reconciliation')
const soundGate1BMerged = runJsonNpmScript('tool-calling:sound-gate-1b-merged-reconciliation')
const soundGate1CMerged = runJsonNpmScript('tool-calling:sound-gate-1c-merged-reconciliation')
const soundGate1DMerged = runJsonNpmScript('tool-calling:sound-gate-1d-merged-reconciliation')
const githubEvidence = inspectGithubEvidence()

if (githubEvidence.githubPrScanAvailable) {
  const mergeCommit = githubEvidence.pr670LiveState?.mergeCommit?.oid ?? githubEvidence.pr670LiveState?.mergeCommit?.abbreviatedOid
  if (githubEvidence.pr670LiveState?.state !== 'MERGED' || mergeCommit !== expectedMergeCommit) {
    throw new Error('Live GitHub PR #670 state does not match expected merged owner evidence.')
  }
}

const registry = await tsImport('../../server/tool-registry/index.ts', import.meta.url)
const {
  analyzeWorkerRuntimeSoundCpuHandoffReview,
  loadWorkerRuntimeSoundCpuHandoffReviewSources,
  WORKER_RUNTIME_SOUND_CPU_REVIEW_ROWS,
  WORKER_RUNTIME_SOUND_CPU_ACCEPTED_WORKER_NAMES,
  WORKER_RUNTIME_SOUND_CPU_PLANNED_IMAGE_NAMES,
  WORKER_RUNTIME_SOUND_CPU_ACCEPTED_JOB_TYPES,
  WORKER_RUNTIME_SOUND_CPU_BLOCKED_GATES,
  WORKER_RUNTIME_SOUND_CPU_NEXT_PROMPTS,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)
const { PRODUCTION_TOOL_IDS } = registry

const sourceBundle = loadWorkerRuntimeSoundCpuHandoffReviewSources()
const analysis = analyzeWorkerRuntimeSoundCpuHandoffReview()
const rows = analysis.matrixRows

if (analysis.sourcePr !== 670) throw new Error('Worker Runtime Sound CPU analysis must reference PR #670.')
if (analysis.mergeCommit !== expectedMergeCommit) throw new Error('Worker Runtime Sound CPU analysis has the wrong merge commit.')
if (analysis.evidenceIsFinalSourceOfTruth !== true) throw new Error('PR #670 must be final owner source evidence.')
if (analysis.productionToolIdCount !== PRODUCTION_TOOL_IDS.length) throw new Error('ProductionToolId count changed during Worker Runtime Sound CPU handoff review reconciliation.')
if (analysis.adaptersAdded !== 0 || analysis.commandIntentsAdded !== 0 || analysis.probesAdded !== 0) {
  throw new Error('Worker Runtime Sound CPU handoff review reconciliation must not add adapters, command intents, or probes.')
}
if (
  analysis.workerRouteDryRunAdded ||
  analysis.workerExecutionPerformed ||
  analysis.workerClaimPerformed ||
  analysis.workerLeasePerformed ||
  analysis.workerJobsCreated ||
  analysis.staticContractPlanAdded ||
  analysis.dockerActionPerformed ||
  analysis.gcpActionPerformed ||
  analysis.cloudRunActionPerformed ||
  analysis.secretManagerActionPerformed ||
  analysis.observabilityPolicyEnabled ||
  analysis.retryPolicyEnabled ||
  analysis.artifactPolicyEnabled ||
  analysis.importsRun
) {
  throw new Error('Worker Runtime Sound CPU handoff review reconciliation enabled a forbidden runtime, static contract, policy, build, deploy, or import surface.')
}

assertIncludesAll(rows.map((row) => row.normalizedItemId), WORKER_RUNTIME_SOUND_CPU_REVIEW_ROWS, 'Worker Runtime review rows')
assertIncludesAll(analysis.acceptedWorkerNames, WORKER_RUNTIME_SOUND_CPU_ACCEPTED_WORKER_NAMES, 'accepted worker names')
assertIncludesAll(analysis.acceptedJobTypes, WORKER_RUNTIME_SOUND_CPU_ACCEPTED_JOB_TYPES, 'accepted job types')
assertIncludesAll(rows.filter((row) => row.itemType === 'planned_image_name').map((row) => row.normalizedItemId), WORKER_RUNTIME_SOUND_CPU_PLANNED_IMAGE_NAMES, 'planned image names')
assertIncludesAll(rows.filter((row) => row.itemType === 'blocked_execution_gate' || row.itemType === 'blocked_policy_surface').map((row) => row.normalizedItemId), WORKER_RUNTIME_SOUND_CPU_BLOCKED_GATES, 'blocked gates')
assertIncludesAll(analysis.nextPrompts, WORKER_RUNTIME_SOUND_CPU_NEXT_PROMPTS, 'static contract next prompt')

for (const itemId of WORKER_RUNTIME_SOUND_CPU_REVIEW_ROWS) {
  assertRow(rows, itemId, (row) => (
    row.itemType === 'worker_runtime_owner_review' &&
    row.acceptedForFutureStaticPlanning &&
    row.workerRuntimeOwnerReviewAccepted &&
    !row.acceptedForExecution &&
    row.executionGate === 'blocked_pending_static_contract_plan'
  ), `${itemId} must be merged owner review evidence for future static planning only.`)
}
for (const itemId of WORKER_RUNTIME_SOUND_CPU_ACCEPTED_WORKER_NAMES) {
  assertRow(rows, itemId, (row) => (
    row.itemType === 'accepted_worker_name' &&
    row.acceptedForFutureStaticPlanning &&
    row.workerRuntimeOwnerReviewAccepted &&
    !row.workerDispatchAllowedNow &&
    !row.workerClaimAllowedNow &&
    !row.workerLeaseAllowedNow
  ), `${itemId} must be an accepted worker name without runtime authority.`)
}
for (const itemId of WORKER_RUNTIME_SOUND_CPU_ACCEPTED_JOB_TYPES) {
  assertRow(rows, itemId, (row) => (
    row.itemType === 'accepted_job_type' &&
    row.acceptedForFutureStaticPlanning &&
    !row.workerJobsCreatedNow &&
    !row.workerExecutionAllowedNow
  ), `${itemId} must be an accepted job type without job creation.`)
}

for (const row of rows) {
  if (!row.workerReviewEvidenceStatus.includes('merged_owner_source_evidence')) {
    throw new Error(`${row.normalizedItemId} must include merged_owner_source_evidence.`)
  }
  if (!row.prMerged || row.mergeCommit !== expectedMergeCommit || row.evidenceIsFinalSourceOfTruth !== true) {
    throw new Error(`${row.normalizedItemId} must represent merged PR #670 final owner evidence.`)
  }
  if (
    row.acceptedForExecution ||
    row.workerDispatchAllowedNow ||
    row.workerClaimAllowedNow ||
    row.workerLeaseAllowedNow ||
    row.workerExecutionAllowedNow ||
    row.workerJobsCreatedNow ||
    row.routeExecutionAllowedNow ||
    row.toolExecutionAllowedNow ||
    row.dockerfileMutationAllowedNow ||
    row.imageBuildAllowedNow ||
    row.gcpCallAllowedNow ||
    row.cloudRunAllowedNow ||
    row.serviceAccountAllowedNow ||
    row.secretManagerAllowedNow ||
    row.observabilityPolicyAllowedNow ||
    row.retryPolicyAllowedNow ||
    row.artifactPolicyAllowedNow ||
    row.mediaProcessingAllowedNow ||
    row.supabaseMutationAllowedNow ||
    row.sqlAllowedNow ||
    row.publicArtifactsAllowedNow ||
    row.betaProductionAllowedNow ||
    row.currentToolCallingCoverage.hasWorkerRouteDryRun
  ) {
    throw new Error(`${row.normalizedItemId} enables a forbidden Worker Runtime review runtime, policy, or mutation surface.`)
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
  /^requirements.*\\.txt$/.test(filePath)
))
if (forbiddenChangedFiles.length > 0) {
  throw new Error(`Forbidden files changed by Worker Runtime Sound CPU handoff review reconciliation: ${forbiddenChangedFiles.join(', ')}`)
}
if (filesStaged.includes('package-lock.json')) {
  throw new Error('package-lock.json must not be staged.')
}

const forbiddenFieldsFound = collectForbiddenFields({
  sourceBundle,
  analysis,
  githubEvidence: {
    githubPrScanAvailable: githubEvidence.githubPrScanAvailable,
    staticContractPlanPrState: githubEvidence.staticContractPlanPrState,
  },
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
  filePath.includes('worker-route-dry-run') ||
  filePath.includes('static-contract-plan')
))
if (duplicateSystems.length > 0) {
  throw new Error(`Duplicate system files changed: ${duplicateSystems.join(', ')}`)
}

const summary = {
  ok: true,
  refreshGateContinueAllowed: refreshGate.continueAllowed,
  refreshGateWarnings: refreshGate.warnings ?? [],
  githubPrScanAvailable: githubEvidence.githubPrScanAvailable,
  githubPrScanError: githubEvidence.githubPrScanError,
  sourcePr: analysis.sourcePr,
  sourceMilestone: sourceBundle.matrixDocument.evidenceSummary.sourceMilestone,
  sourceHeadCommit: sourceBundle.matrixDocument.evidenceSummary.sourceHeadCommit,
  mergeCommit: analysis.mergeCommit,
  pr670Found: true,
  pr670Merged: true,
  evidenceIsFinalSourceOfTruth: analysis.evidenceIsFinalSourceOfTruth,
  staticContractPlanPrState: githubEvidence.staticContractPlanPrState,
  workerReviewMatrixRows: analysis.workerReviewMatrixRows,
  acceptedWorkerNameCount: analysis.acceptedWorkerNameCount,
  plannedImageNameCount: analysis.plannedImageNameCount,
  acceptedJobTypeCount: analysis.acceptedJobTypeCount,
  blockedRowCount: analysis.blockedRowCount,
  relatedSoundToolCount: analysis.relatedSoundToolCount,
  nextPromptCount: analysis.nextPromptCount,
  acceptedWorkerNames: analysis.acceptedWorkerNames,
  acceptedJobTypes: analysis.acceptedJobTypes,
  nextPrompts: analysis.nextPrompts,
  productionToolIdCount: analysis.productionToolIdCount,
  productionToolIdCountChanged: analysis.productionToolIdCountChanged,
  adaptersAdded: analysis.adaptersAdded,
  commandIntentsAdded: analysis.commandIntentsAdded,
  probesAdded: analysis.probesAdded,
  workerRouteDryRunAdded: analysis.workerRouteDryRunAdded,
  workerExecutionPerformed: analysis.workerExecutionPerformed,
  workerClaimPerformed: analysis.workerClaimPerformed,
  workerLeasePerformed: analysis.workerLeasePerformed,
  workerJobsCreated: analysis.workerJobsCreated,
  staticContractPlanAdded: analysis.staticContractPlanAdded,
  dockerActionPerformed: analysis.dockerActionPerformed,
  gcpActionPerformed: analysis.gcpActionPerformed,
  cloudRunActionPerformed: analysis.cloudRunActionPerformed,
  secretManagerActionPerformed: analysis.secretManagerActionPerformed,
  observabilityPolicyEnabled: analysis.observabilityPolicyEnabled,
  retryPolicyEnabled: analysis.retryPolicyEnabled,
  artifactPolicyEnabled: analysis.artifactPolicyEnabled,
  importsRun: analysis.importsRun,
  prerequisiteDiagnostics: {
    allOwnerStackRows: allOwnerStackReconciliation.totalMatrixRows,
    soundOwnerExpansionRows: soundOwnerExpansion.soundMatrixRows,
    soundCandidateStudyCardCount: soundCandidateStudyCards.candidateStudyCardCount,
    soundRuntimeGate1Rows: soundRuntimeGate1.gate1MatrixRows,
    soundGate1AMergedRows: soundGate1AMerged.gate1aMatrixRows,
    soundGate1BMergedRows: soundGate1BMerged.gate1bMatrixRows,
    soundGate1CMergedRows: soundGate1CMerged.gate1cMatrixRows,
    soundGate1DMergedRows: soundGate1DMerged.gate1dMatrixRows,
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
  workerClaimPerformed: false,
  workerLeasePerformed: false,
  workerJobsCreated: false,
  dockerActionPerformed: false,
  gcpActionPerformed: false,
  cloudRunActionPerformed: false,
  secretManagerActionPerformed: false,
  observabilityPolicyEnabled: false,
  retryPolicyEnabled: false,
  artifactPolicyEnabled: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  migrationsCreated: false,
  signedUrlsCreated: false,
  packageLockMutated: false,
  betaProductionUnlocked: false,
  decisionTarget: 'reeditpro_tool_calling_worker_runtime_sound_cpu_handoff_review_reconciliation_1_ready_for_static_contract_plan_or_generic_worker_route_decision',
}

console.log(JSON.stringify(summary, null, 2))
