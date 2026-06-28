import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_launch_core_dependency_install_proof_after_plan_passed_required_checks_with_warnings_ready_for_dependency_install_proof_owner_review_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_dependency_install_plan_after_controlled_proof_completed_with_warnings_ready_for_controlled_dependency_install_proof_no_runtime_no_production'
const SOURCE_COMMIT = '70c37bbee038b46bb67785e16d489a506ec4b1df'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-DEPENDENCY-INSTALL-PROOF-OWNER-REVIEW-AFTER-PROOF: review controlled launch-core dependency install proof, no runtime/no production'

const FILES = {
  proof: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-install-proof-after-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-install-proof-after-plan',
  },
  python: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-python-proof-register-after-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-launch-core-python-proof-register-after-plan',
  },
  node: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-node-proof-register-after-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-launch-core-node-proof-register-after-plan',
  },
  warnings: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-warning-register-after-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-warning-register-after-plan',
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-install-claim-policy-after-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-install-claim-policy-after-plan',
  },
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-dependency-install-proof-owner-review-after-proof.md'

function jsonTrue(key) {
  return `"${key}": ` + 'true'
}

function jsonYes(key) {
  return `"${key}": ` + '"yes"'
}

const FORBIDDEN_STRINGS = [
  jsonTrue('persistentDependencyManifestsReady'),
  jsonTrue('packageLockChangedToday'),
  jsonTrue('nodeModulesStaged'),
  jsonTrue('requiredLaunchCoreRuntimeReady'),
  jsonTrue('launchCoreToolReadinessClosedForProduction'),
  jsonTrue('externalProductBetaReady'),
  jsonTrue('realUserMediaBetaAllowed'),
  jsonTrue('paidProductionAllowed'),
  jsonTrue('productionReady'),
  jsonTrue('runtimeExecutionApprovedToday'),
  jsonTrue('workerExecutionApprovedToday'),
  jsonTrue('routeExecutionApprovedToday'),
  jsonTrue('productToolCallExecutionApprovedToday'),
  jsonTrue('mediaProcessingApprovedToday'),
  jsonTrue('realUserMediaReadApprovedToday'),
  jsonTrue('artifactDeliveryApprovedToday'),
  jsonTrue('modelDownloadApprovedToday'),
  jsonTrue('providerModelCallApprovedToday'),
  jsonTrue('deploymentApprovedToday'),
  jsonTrue('cloudRunApprovedToday'),
  jsonTrue('dockerBuildRunPushApprovedToday'),
  jsonTrue('supabaseMutationApprovedToday'),
  jsonTrue('sqlExecutionApprovedToday'),
  jsonTrue('generatedLocalFixturePassedClaimedToday'),
  jsonTrue('dryRunPassedClaimedToday'),
  jsonTrue('runtimeReadinessClaimedToday'),
  jsonTrue('mediaReadinessClaimedToday'),
  jsonYes('environmentTouched'),
  jsonYes('sqlExecuted'),
  jsonYes('migrationDeployed'),
  ['SUPABASE', 'SERVICE'].join('_'),
  ['STRIPE', 'SECRET'].join('_'),
  ['GOOGLE', 'APPLICATION', 'CREDENTIALS'].join('_'),
  ['BEGIN', 'PRIVATE', 'KEY'].join(' '),
  ['postgres', '://'].join(''),
  ['postgresql', '://'].join(''),
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  return readFileSync(path, 'utf8')
}

function parseBlock({ path, label }) {
  const text = read(path)
  for (const forbidden of FORBIDDEN_STRINGS) {
    assert(!text.includes(forbidden), `${path} contains forbidden string: ${forbidden}`)
  }
  const marker = '```json ' + label
  const start = text.indexOf(marker)
  assert(start >= 0, `${path} missing fenced JSON label ${label}`)
  const jsonStart = text.indexOf('\n', start)
  const end = text.indexOf('```', jsonStart + 1)
  assert(jsonStart >= 0 && end >= 0, `${path} missing JSON fence close`)
  return JSON.parse(text.slice(jsonStart + 1, end).trim())
}

function assertDecision(doc, label) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${label} owner mismatch`)
  assert(doc.sourceDecision === SOURCE_DECISION, `${label} source decision mismatch`)
  assert(doc.sourcePr === 1435, `${label} source PR mismatch`)
  assert(doc.sourceMergeCommit === SOURCE_COMMIT, `${label} source merge commit mismatch`)
  assert(doc.decision === DECISION, `${label} decision mismatch`)
}

function assertSupabaseNoop(value, label) {
  assert(value.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value.sqlExecuted === 'no', `${label} SQL mismatch`)
  assert(value.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value.nextAction === 'none', `${label} Supabase next action mismatch`)
}

const parsed = {}
for (const [name, info] of Object.entries(FILES)) {
  parsed[name] = parseBlock(info)
  assertDecision(parsed[name], name)
}

const promptText = read(PROMPT)
assert(promptText.includes(DECISION), 'next prompt missing source decision')
assert(promptText.includes('no runtime/no production'), 'next prompt missing no-runtime/no-production scope')
assert(promptText.includes('Do not run runtime execution'), 'next prompt missing runtime prohibition')

const proof = parsed.proof
assert(proof.proofResult.controlledDependencyInstallProofExecuted === true, 'proof execution flag missing')
assert(proof.proofResult.metadataResolverFixApplied === true, 'metadata resolver fix missing')
assert(proof.proofResult.pythonDisposableVenvUsed === true, 'Python venv proof missing')
assert(proof.proofResult.tempVenvRemoved === true, 'temp venv removal missing')
assert(proof.proofResult.packageJsonChanged === false, 'package.json must not change')
assert(proof.proofResult.packageLockChanged === false, 'package-lock must not change')
assert(proof.proofResult.passed === 10, 'passed count mismatch')
assert(proof.proofResult.warning === 1, 'warning count mismatch')
assert(proof.proofResult.missingRequired === 0, 'required missing count mismatch')
assert(proof.proofResult.notInstalledOptional === 3, 'optional missing count mismatch')
assert(proof.proofResult.pendingManualReview === 1, 'manual review count mismatch')
assert(proof.proofResult.evaluationOnly === 1, 'evaluation-only count mismatch')
assert(proof.proofResult.requiredLaunchCoreChecksPassed === true, 'required checks pass flag missing')
assert(proof.proofResult.realUserMediaBetaAllowed === false, 'real-user beta must remain false')
assert(proof.proofResult.paidProductionAllowed === false, 'paid production must remain false')
assert(proof.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assertSupabaseNoop(proof.supabaseClassification, 'proof')

const python = parsed.python
assert(python.pythonProof.pythonVersion === '3.13.13', 'Python version mismatch')
assert(python.pythonProof.venvInsideRepo === false, 'venv must not be inside repo')
assert(python.pythonProof.tempVenvRemoved === true, 'venv must be removed')
assert(python.pythonProof.mediaOpened === false, 'media must not be opened')
assert(python.pythonProof.installedPackages.length === 6, 'Python package proof count mismatch')
for (const module of ['av', 'scenedetect', 'cv2', 'duckdb', 'polars', 'opentimelineio']) {
  const item = python.pythonProof.installedPackages.find((entry) => entry.module === module)
  assert(item?.status === 'passed', `${module} must pass`)
}
assert(python.pythonProof.nativeWarning.observed === true, 'native warning must be preserved')
assert(python.pythonProof.nativeWarning.blocksRuntimeReadiness === true, 'native warning must block runtime readiness')
assert(python.pythonProofConclusion.requiredPythonImportsPassed === true, 'Python import conclusion mismatch')
assert(python.pythonProofConclusion.productionReady === false, 'production must remain false')
assertSupabaseNoop(python.supabaseClassification, 'python')

const node = parsed.node
assert(node.nodeProof.packageJsonChanged === false, 'Node package.json must not change')
assert(node.nodeProof.packageLockChanged === false, 'Node package-lock must not change')
assert(node.nodeProof.nodeModulesStaged === false, 'node_modules must not be staged')
assert(node.nodeProof.metadataOnly === true, 'Node proof must be metadata only')
assert(node.nodeProof.runtimeImported === false, 'Node runtime import must remain false')
assert(node.nodeProof.metadataResolverFixApplied === true, 'Node resolver fix missing')
assert(node.nodeProof.requiredNodePackages.length === 2, 'Node package proof count mismatch')
for (const packageName of ['sharp', 'remotion']) {
  const item = node.nodeProof.requiredNodePackages.find((entry) => entry.packageName === packageName)
  assert(item?.metadataStatus === 'passed', `${packageName} metadata must pass`)
}
assert(node.nodeProofConclusion.requiredNodeMetadataPassed === true, 'Node metadata conclusion mismatch')
assert(node.nodeProofConclusion.manifestPersistenceStillRequired === true, 'persistent manifest follow-up missing')
assert(node.nodeProofConclusion.renderExecutionApproved === false, 'render execution must remain false')
assertSupabaseNoop(node.supabaseClassification, 'node')

const warnings = parsed.warnings
assert(warnings.remainingWarningsAndBlockers.length === 7, 'warning/blocker count mismatch')
for (const id of ['libass_filter_inspection_warning', 'pyav_opencv_bundled_ffmpeg_dylib_overlap', 'ffmpeg_lgpl_safe_build_manual_review', 'persistent_manifest_absent']) {
  assert(warnings.remainingWarningsAndBlockers.some((entry) => entry.id === id), `missing warning ${id}`)
}
assert(warnings.warningConclusion.requiredChecksPassed === true, 'required check warning conclusion mismatch')
assert(warnings.warningConclusion.runtimeReadinessStillBlocked === true, 'runtime blocked warning missing')
assert(warnings.warningConclusion.nextOwnerReviewRequired === true, 'owner review flag missing')
assertSupabaseNoop(warnings.supabaseClassification, 'warnings')

const claim = parsed.claim
assert(claim.allowedClaimsToday.includes('controlled launch-core dependency install proof executed'), 'allowed proof claim missing')
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `claim ${key} must be false`)
}
assert(claim.claimConclusion.proofCanFeedOwnerReview === true, 'owner review handoff missing')
assert(claim.claimConclusion.proofCanUnlockRuntime === false, 'runtime unlock must be false')
assert(claim.claimConclusion.proofCanUnlockRealUserMediaBeta === false, 'real-user beta unlock must be false')
assertSupabaseNoop(claim.supabaseClassification, 'claim')

const checker = read('server/workers/production-readiness/core-cpu-render-readiness-checks.ts')
assert(checker.includes('resolveNodePackageMetadataPath'), 'metadata resolver helper missing')
assert(checker.includes('definition.packageJsonPath'), 'metadata resolver must try packageJsonPath')
assert(checker.includes('definition.packageName'), 'metadata resolver must fallback to package name')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourcePr: 1435,
      sourceCommit: SOURCE_COMMIT,
      requiredLaunchCoreChecksPassed: true,
      passed: 10,
      warning: 1,
      missingRequired: 0,
      notInstalledOptional: 3,
      pendingManualReview: 1,
      evaluationOnly: 1,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
