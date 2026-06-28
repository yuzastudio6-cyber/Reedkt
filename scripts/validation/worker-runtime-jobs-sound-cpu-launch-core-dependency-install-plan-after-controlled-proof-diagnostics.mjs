import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_dependency_install_plan_after_controlled_proof_completed_with_warnings_ready_for_controlled_dependency_install_proof_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_launch_core_real_check_proof_after_plan_blocked_missing_required_launch_core_dependencies_ready_for_dependency_install_plan_no_runtime_no_production'
const SOURCE_COMMIT = 'd1dfda8e6f416d26c2195be08e422d9178322063'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-LAUNCH-CORE-DEPENDENCY-INSTALL-PROOF-AFTER-PLAN: run controlled launch-core dependency install proof, no runtime/no production'

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-dependency-install-plan-after-controlled-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-dependency-install-plan-after-controlled-proof',
  },
  python: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-python-dependency-plan-after-controlled-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-python-dependency-plan-after-controlled-proof',
  },
  node: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-node-dependency-plan-after-controlled-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-node-dependency-plan-after-controlled-proof',
  },
  proof: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-dependency-proof-plan-after-controlled-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-dependency-proof-plan-after-controlled-proof',
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-dependency-install-claim-policy-after-controlled-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-dependency-install-claim-policy-after-controlled-proof',
  },
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-install-proof-after-plan.md'

function jsonTrue(key) {
  return `"${key}": ` + 'true'
}

function jsonYes(key) {
  return `"${key}": ` + '"yes"'
}

const FORBIDDEN_STRINGS = [
  jsonTrue('installExecutionApprovedToday'),
  jsonTrue('dependencyManifestsChangedToday'),
  jsonTrue('packageLockChangedToday'),
  jsonTrue('requiredLaunchCoreDependenciesReady'),
  jsonTrue('launchCoreToolReadinessClosed'),
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
  assert(doc.sourcePr === 1433, `${label} source PR mismatch`)
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
assert(promptText.includes('If modifying dependency manifests'), 'next prompt missing manifest guard')
assert(promptText.includes('Do not run runtime execution'), 'next prompt missing runtime prohibition')

const plan = parsed.plan
assert(plan.planResult.dependencyInstallPlanCreated === true, 'plan created flag missing')
assert(plan.planResult.controlledRealCheckProofConsumed === true, 'source proof consumed flag missing')
assert(plan.planResult.installExecutionApprovedToday === false, 'install execution must remain false')
assert(plan.planResult.dependencyManifestsChangedToday === false, 'manifest changes must remain false')
assert(plan.planResult.packageLockChangedToday === false, 'lockfile changes must remain false')
assert(plan.sourceProofSummary.missingRequired === 8, 'source missing required count mismatch')
assert(plan.installPlanSummary.pythonRequiredPackages === 6, 'python package count mismatch')
assert(plan.installPlanSummary.nodeRequiredPackages === 2, 'node package count mismatch')
assert(plan.installPlanSummary.optionalDeferredPackages === 3, 'optional package count mismatch')
assert(plan.installPlanSummary.manualPolicyReviews === 2, 'manual policy count mismatch')
assert(plan.installPlanSummary.nextProofMustRerunBoundedChecks === true, 'bounded rerun flag missing')
assert(plan.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assertSupabaseNoop(plan.supabaseClassification, 'plan')

const python = parsed.python
assert(python.existingRequirementSources.length === 2, 'existing Python requirement source count mismatch')
for (const source of python.existingRequirementSources) {
  assert(source.status === 'declares_required_python_packages_unpinned', `${source.path} status mismatch`)
  assert(source.hostInstallApprovedToday === false, `${source.path} must not approve host install`)
}
assert(python.requiredPythonPackages.length === 6, 'required Python package count mismatch')
for (const requirement of ['av', 'scenedetect', 'opencv-python-headless', 'duckdb', 'polars', 'opentimelineio']) {
  assert(python.requiredPythonPackages.some((entry) => entry.requirementName === requirement), `missing Python requirement ${requirement}`)
}
assert(python.deferredPythonPackages.length === 2, 'deferred Python package count mismatch')
assert(python.pythonPlanConclusion.currentRequirementFilesAreUnpinned === true, 'unpinned requirement warning missing')
assert(python.pythonPlanConclusion.nextGateMayPinOrInstallInControlledProof === true, 'next Python proof flag missing')
assert(python.pythonPlanConclusion.mediaReadApprovedToday === false, 'media read must remain false')
assertSupabaseNoop(python.supabaseClassification, 'python')

const node = parsed.node
assert(node.currentRootPackageManifest.sharp === 'absent', 'sharp should be absent in current manifest')
assert(node.currentRootPackageManifest.remotion === 'absent', 'remotion should be absent in current manifest')
assert(node.currentRootPackageManifest.hyperframe === 'absent', 'hyperframe should be absent in current manifest')
assert(node.currentRootPackageManifest.packageLockContainsSharp === false, 'lockfile sharp status mismatch')
assert(node.currentRootPackageManifest.packageLockContainsRemotion === false, 'lockfile remotion status mismatch')
assert(node.requiredNodePackages.length === 2, 'required Node package count mismatch')
for (const packageName of ['sharp', 'remotion']) {
  assert(node.requiredNodePackages.some((entry) => entry.packageName === packageName), `missing Node package ${packageName}`)
}
assert(node.deferredNodePackages.length === 1, 'deferred Node package count mismatch')
assert(node.nodePlanConclusion.packageManifestChangeApprovedToday === false, 'manifest changes must remain false')
assert(node.nodePlanConclusion.packageLockChangeApprovedToday === false, 'lock changes must remain false')
assert(node.nodePlanConclusion.nextGateMayPerformControlledPackageInstall === true, 'next Node proof flag missing')
assert(node.nodePlanConclusion.renderExecutionApprovedToday === false, 'render execution must remain false')
assertSupabaseNoop(node.supabaseClassification, 'node')

const proof = parsed.proof
assert(proof.nextControlledProofPlan.proofName === 'controlled_launch_core_dependency_install_proof', 'proof plan name mismatch')
for (const check of ['python_import_av', 'python_import_scenedetect', 'python_import_cv2', 'python_import_duckdb', 'python_import_polars', 'python_import_opentimelineio', 'node_package_metadata_sharp', 'node_package_metadata_remotion']) {
  assert(proof.nextControlledProofPlan.requiredRerunChecks.includes(check), `missing rerun check ${check}`)
}
for (const forbidden of ['media file open', 'real-user media read', 'Docker build/run/push', 'Supabase mutation']) {
  assert(proof.nextControlledProofPlan.forbiddenActions.includes(forbidden), `missing forbidden action ${forbidden}`)
}
assert(proof.proofPlanConclusion.nextProofShouldUseSameBoundedRunner === true, 'bounded runner proof flag missing')
assert(proof.proofPlanConclusion.realUserMediaBetaAllowedAfterThisPlan === false, 'real-user beta must remain closed')
assertSupabaseNoop(proof.supabaseClassification, 'proof')

const claim = parsed.claim
assert(claim.allowedClaimsToday.includes('launch-core dependency install/remediation plan created'), 'allowed claim missing')
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `claim ${key} must be false`)
}
assert(claim.claimConclusion.planCanFeedControlledInstallProof === true, 'next proof handoff missing')
assert(claim.claimConclusion.planCanUnlockRuntime === false, 'runtime unlock must be false')
assert(claim.claimConclusion.planCanUnlockRealUserMediaBeta === false, 'real-user beta unlock must be false')
assertSupabaseNoop(claim.supabaseClassification, 'claim')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourcePr: 1433,
      sourceCommit: SOURCE_COMMIT,
      installExecutionApprovedToday: false,
      pythonRequiredPackages: 6,
      nodeRequiredPackages: 2,
      optionalDeferredPackages: 3,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
