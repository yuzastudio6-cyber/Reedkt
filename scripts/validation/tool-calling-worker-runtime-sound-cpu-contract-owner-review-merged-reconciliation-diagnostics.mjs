import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { tsImport } from 'tsx/esm/api'

const expectedPr679MergeCommit = '1091f901729334389918f3b1ea28b584ebf7686b'
const packageScript = 'node scripts/validation/tool-calling-worker-runtime-sound-cpu-contract-owner-review-merged-reconciliation-diagnostics.mjs'

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

function assertIncludesAll(actual, expected, context) {
  const missing = expected.filter((item) => !actual.includes(item))
  if (missing.length > 0) throw new Error(`${context} missing: ${missing.join(', ')}`)
}

function inspectGithubEvidence() {
  const pr679 = tryRunCommand('gh', [
    'pr',
    'view',
    '679',
    '--repo',
    'yuzastudio6-cyber/Reedkt',
    '--json',
    'number,state,isDraft,mergedAt,mergeCommit,headRefName,title',
  ])
  const pr684 = tryRunCommand('gh', [
    'pr',
    'view',
    '684',
    '--repo',
    'yuzastudio6-cyber/Reedkt',
    '--json',
    'number,state,isDraft,mergedAt,mergeCommit,headRefName,title',
  ])
  if (!pr679.ok || !pr684.ok) {
    return {
      githubPrScanAvailable: false,
      githubPrScanError: pr679.error ?? pr684.error,
      pr679LiveState: null,
      pr684LiveState: null,
    }
  }

  return {
    githubPrScanAvailable: true,
    githubPrScanError: null,
    pr679LiveState: JSON.parse(pr679.output),
    pr684LiveState: JSON.parse(pr684.output),
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (packageJson.scripts?.['tool-calling:worker-runtime-sound-cpu-contract-owner-review-merged-reconciliation'] !== packageScript) {
  throw new Error('Package script missing for Worker Runtime Sound CPU contract owner review reconciliation.')
}

const startingPackageLockHash = packageLockHash()
const refreshGate = runJsonNpmScript('tool-calling:refresh-gate')
if (refreshGate.continueAllowed === false) {
  throw new Error(`Refresh gate blocked Worker Runtime Sound CPU contract owner review reconciliation: ${(refreshGate.blockingReasons ?? []).join(', ')}`)
}

runJsonNpmScript('tool-calling:unmerged-owner-evidence')

const githubEvidence = inspectGithubEvidence()

const registry = await tsImport('../../server/tool-registry/index.ts', import.meta.url)
const {
  analyzeToolCallingCoverageAgainstAllOwners,
  analyzeSoundMusicAudioToolCallingCoverage,
  analyzeSoundCandidateStudyCards,
  analyzeSoundRuntimeGate1Coverage,
  analyzeSoundGate1AMergedReconciliation,
  analyzeSoundGate1BMergedReconciliation,
  analyzeSoundGate1CMergedReconciliation,
  analyzeSoundGate1DMergedReconciliation,
  analyzeWorkerRuntimeSoundCpuHandoffReview,
  analyzeWorkerRuntimeSoundCpuContractOwnerReviewMerged,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_IMAGE_NAMES,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_JOB_TYPES,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_WORKER_NAMES,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_BLOCKED_GATES,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_RELATED_SOUND_TOOLS,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_MERGE_COMMIT,
  WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_ROWS,
  WORKER_RUNTIME_SOUND_CPU_DOCKERFILE_STATIC_REVIEW_NEXT_PROMPT,
} = await tsImport('../../server/tool-calling/index.ts', import.meta.url)
const { PRODUCTION_TOOL_IDS } = registry

const allOwnerStackReconciliation = analyzeToolCallingCoverageAgainstAllOwners()
const soundOwnerExpansion = analyzeSoundMusicAudioToolCallingCoverage()
const soundCandidateStudyCards = analyzeSoundCandidateStudyCards()
const soundRuntimeGate1 = analyzeSoundRuntimeGate1Coverage()
const soundGate1AMerged = analyzeSoundGate1AMergedReconciliation()
const soundGate1BMerged = analyzeSoundGate1BMergedReconciliation()
const soundGate1CMerged = analyzeSoundGate1CMergedReconciliation()
const soundGate1DMerged = analyzeSoundGate1DMergedReconciliation()
const handoffReview = analyzeWorkerRuntimeSoundCpuHandoffReview()
const analysis = analyzeWorkerRuntimeSoundCpuContractOwnerReviewMerged()
const rows = analysis.matrixRows

if (analysis.sourcePr !== 679) throw new Error('Analysis must reference PR #679.')
if (analysis.mergeCommit !== expectedPr679MergeCommit) throw new Error('Analysis has the wrong PR #679 merge commit.')
if (analysis.mergeCommit !== WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_MERGE_COMMIT) throw new Error('Loader merge commit constant mismatch.')
if (analysis.evidenceIsFinalSourceOfTruth !== true) throw new Error('PR #679 must be final source evidence.')
if (analysis.productionToolIdCount !== PRODUCTION_TOOL_IDS.length) throw new Error('ProductionToolId count changed.')
if (analysis.adaptersAdded !== 0 || analysis.commandIntentsAdded !== 0 || analysis.probesAdded !== 0) {
  throw new Error('Adapters, command intents, or probes were added.')
}
if (
  analysis.workerRouteDryRunAdded ||
  analysis.workerExecutionPerformed ||
  analysis.workerClaimPerformed ||
  analysis.workerLeasePerformed ||
  analysis.workerJobsCreated ||
  analysis.dockerfileStaticPlanAdded ||
  analysis.dockerActionPerformed ||
  analysis.gcpActionPerformed ||
  analysis.cloudRunActionPerformed ||
  analysis.secretManagerActionPerformed ||
  analysis.observabilityPolicyEnabled ||
  analysis.retryPolicyEnabled ||
  analysis.artifactPolicyEnabled ||
  analysis.importsRun
) {
  throw new Error('Forbidden Worker Runtime, Docker/GCP, policy, import, or route-dry-run surface was enabled.')
}

assertIncludesAll(rows.map((row) => row.normalizedItemId), WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_REVIEW_ROWS, 'PR #679 owner review rows')
assertIncludesAll(rows.filter((row) => row.itemType === 'accepted_worker_name').map((row) => row.normalizedItemId), WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_WORKER_NAMES, 'accepted worker names')
assertIncludesAll(rows.filter((row) => row.itemType === 'accepted_image_name').map((row) => row.normalizedItemId), WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_IMAGE_NAMES, 'accepted image names')
assertIncludesAll(rows.filter((row) => row.itemType === 'accepted_job_type').map((row) => row.normalizedItemId), WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_ACCEPTED_JOB_TYPES, 'accepted job types')
assertIncludesAll(rows.filter((row) => row.itemType === 'blocked_execution_gate').map((row) => row.normalizedItemId), WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_BLOCKED_GATES, 'blocked execution gates')
assertIncludesAll(rows.filter((row) => row.itemType === 'related_sound_tool').map((row) => row.normalizedItemId), WORKER_RUNTIME_SOUND_CPU_CONTRACT_OWNER_RELATED_SOUND_TOOLS, 'related Sound tools')
if (!rows.some((row) => row.normalizedItemId === WORKER_RUNTIME_SOUND_CPU_DOCKERFILE_STATIC_REVIEW_NEXT_PROMPT)) {
  throw new Error('Dockerfile static review next prompt row missing.')
}

const pr679Rows = rows.filter((row) => row.prNumber === 679)
if (pr679Rows.length === 0 || pr679Rows.some((row) => !row.prMerged || !row.evidenceIsFinalSourceOfTruth)) {
  throw new Error('PR #679 rows must be merged final owner evidence.')
}

const pr684Rows = rows.filter((row) => row.prNumber === 684)
if (pr684Rows.length === 0) throw new Error('PR #684 candidate evidence row missing.')
if (pr684Rows.some((row) => !row.prMerged && row.evidenceIsFinalSourceOfTruth)) {
  throw new Error('Open PR #684 candidate evidence must not be final source truth.')
}

if (githubEvidence.githubPrScanAvailable) {
  const pr679Commit = githubEvidence.pr679LiveState?.mergeCommit?.oid ?? githubEvidence.pr679LiveState?.mergeCommit?.abbreviatedOid
  if (githubEvidence.pr679LiveState?.state !== 'MERGED' || pr679Commit !== expectedPr679MergeCommit) {
    throw new Error('Live GitHub PR #679 state does not match expected merged owner evidence.')
  }
  if (githubEvidence.pr684LiveState?.state !== 'MERGED' && pr684Rows.some((row) => row.evidenceIsFinalSourceOfTruth)) {
    throw new Error('Live GitHub says PR #684 is not merged, but matrix treats it as final source truth.')
  }
}

const forbiddenFieldsFound = collectForbiddenFields({
  rows,
  recommendations: analysis.recommendedNextMilestones,
  safety: analysis.safety,
})
if (forbiddenFieldsFound.length > 0) {
  throw new Error(`Forbidden fields or strings found: ${forbiddenFieldsFound.join(', ')}`)
}

const changed = changedFiles()
const disallowedChanged = changed.filter((file) => (
  file === 'package-lock.json' ||
  file.startsWith('docker/') ||
  file.startsWith('supabase/') ||
  file.startsWith('database/') ||
  /requirements.*\\.txt$/i.test(file) ||
  /migration/i.test(file) ||
  /\\.sql$/i.test(file) ||
  (file === 'package.json' ? false : false)
))
if (disallowedChanged.length > 0) {
  throw new Error(`Disallowed files changed: ${disallowedChanged.join(', ')}`)
}
if (stagedFiles().includes('package-lock.json')) throw new Error('package-lock.json is staged.')
if (packageLockHash() !== startingPackageLockHash) throw new Error('package-lock.json hash changed during diagnostics.')

console.log(JSON.stringify({
  status: 'worker_runtime_sound_cpu_contract_owner_review_merged_reconciliation_diagnostics_passed',
  contractOwnerReviewMatrixRows: analysis.contractOwnerReviewMatrixRows,
  pr679Found: pr679Rows.length > 0,
  pr679Merged: true,
  pr679EvidenceIsFinalSourceOfTruth: true,
  pr684Found: analysis.pr684Found,
  pr684Merged: analysis.pr684Merged,
  pr684EvidenceIsFinalSourceOfTruth: analysis.pr684EvidenceIsFinalSourceOfTruth,
  githubPrScanAvailable: githubEvidence.githubPrScanAvailable,
  githubPrScanError: githubEvidence.githubPrScanError,
  acceptedWorkerNameCount: analysis.acceptedWorkerNameCount,
  acceptedImageNameCount: analysis.acceptedImageNameCount,
  acceptedJobTypeCount: analysis.acceptedJobTypeCount,
  blockedRowCount: analysis.blockedRowCount,
  productionToolIdCount: PRODUCTION_TOOL_IDS.length,
  productionToolIdCountChanged: false,
  adaptersAdded: 0,
  commandIntentsAdded: 0,
  probesAdded: 0,
  workerRouteDryRunAdded: false,
  workerExecutionPerformed: false,
  workerClaimPerformed: false,
  workerLeasePerformed: false,
  workerJobsCreated: false,
  dockerfileStaticPlanAdded: false,
  dockerActionPerformed: false,
  gcpActionPerformed: false,
  cloudRunActionPerformed: false,
  secretManagerActionPerformed: false,
  observabilityPolicyEnabled: false,
  retryPolicyEnabled: false,
  artifactPolicyEnabled: false,
  importsRun: false,
  recommendedNextMilestones: analysis.recommendedNextMilestones.map((recommendation) => recommendation.milestone),
  executesTools: false,
  audioProcessingPerformed: false,
  mediaProcessingPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  packageLockStaged: false,
  duplicateSystemsCreated: false,
  prerequisiteDiagnostics: {
    allOwnerStackRows: allOwnerStackReconciliation.matrixRows.length,
    soundOwnerExpansionRows: soundOwnerExpansion.matrixRows.length,
    soundCandidateStudyCardCount: soundCandidateStudyCards.candidateStudyCardCount,
    soundRuntimeGate1Rows: soundRuntimeGate1.matrixRows.length,
    soundGate1AMergedRows: soundGate1AMerged.matrixRows.length,
    soundGate1BMergedRows: soundGate1BMerged.matrixRows.length,
    soundGate1CMergedRows: soundGate1CMerged.matrixRows.length,
    soundGate1DMergedRows: soundGate1DMerged.matrixRows.length,
    handoffReviewRows: handoffReview.workerReviewMatrixRows,
  },
}, null, 2))
