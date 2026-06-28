import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_launch_core_real_check_proof_after_plan_blocked_missing_required_launch_core_dependencies_ready_for_dependency_install_plan_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_real_check_plan_after_real_user_media_beta_blocker_resolution_completed_with_warnings_ready_for_controlled_real_check_proof_no_runtime_no_production'
const SOURCE_COMMIT = '04a1c39fc645c4711fab1f888f22efaeb8279651'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-DEPENDENCY-INSTALL-PLAN-AFTER-CONTROLLED-PROOF: plan required launch-core dependency installation, no runtime/no production'

const FILES = {
  proof: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-proof-after-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-proof-after-plan',
  },
  results: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-result-register-after-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-result-register-after-plan',
  },
  missing: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-missing-dependency-register-after-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-missing-dependency-register-after-plan',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-blocker-register-after-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-blocker-register-after-plan',
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-claim-policy-after-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-claim-policy-after-plan',
  },
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-dependency-install-plan-after-controlled-proof.md'

function jsonTrue(key) {
  return `"${key}": ` + 'true'
}

function jsonYes(key) {
  return `"${key}": ` + '"yes"'
}

const FORBIDDEN_STRINGS = [
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
  jsonTrue('dockerImageReadinessClaimedToday'),
  jsonTrue('workerReadinessClaimedToday'),
  jsonTrue('betaReadinessClaimedToday'),
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
  assert(doc.sourcePr === 1429, `${label} source PR mismatch`)
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

function countByStatus(results, status) {
  return results.filter((result) => result.status === status).length
}

const parsed = {}
for (const [name, info] of Object.entries(FILES)) {
  parsed[name] = parseBlock(info)
  assertDecision(parsed[name], name)
}

const promptText = read(PROMPT)
assert(promptText.includes(DECISION), 'next prompt missing source decision')
assert(promptText.includes('no runtime/no production'), 'next prompt missing no-runtime/no-production scope')
assert(promptText.includes('Do not install dependencies'), 'next prompt must keep install planning-only')
assert(promptText.includes('Do not run runtime execution'), 'next prompt missing runtime prohibition')

const proof = parsed.proof
assert(proof.proofResult.controlledRealCheckProofExecuted === true, 'proof execution flag missing')
assert(proof.proofResult.boundedRunner === 'runProductionToolReadiness({ realCheckMode: true, strict: false })', 'bounded runner mismatch')
assert(proof.proofResult.dryRun === false, 'proof must be real-check mode')
assert(proof.proofResult.realCheckMode === true, 'realCheckMode flag missing')
assert(proof.proofResult.strict === false, 'strict mode mismatch')
assert(proof.proofResult.coreToolIds === 14, 'core tool count mismatch')
assert(proof.proofResult.excludedGpuModelToolIds === 13, 'excluded GPU/model count mismatch')
assert(proof.proofResult.resultCount === 16, 'result count mismatch')
assert(proof.proofResult.commandVersionChecks === 3, 'command checks mismatch')
assert(proof.proofResult.pythonImportChecks === 8, 'python checks mismatch')
assert(proof.proofResult.nodePackageMetadataChecks === 3, 'node metadata checks mismatch')
assert(proof.proofResult.passed === 2, 'passed count mismatch')
assert(proof.proofResult.warning === 1, 'warning count mismatch')
assert(proof.proofResult.missingRequired === 8, 'missing required count mismatch')
assert(proof.proofResult.notInstalledOptional === 3, 'optional missing count mismatch')
assert(proof.proofResult.pendingManualReview === 1, 'manual review count mismatch')
assert(proof.proofResult.evaluationOnly === 1, 'evaluation-only count mismatch')
assert(proof.proofResult.launchCoreDependencyInstallPlanRequired === true, 'install plan flag missing')
assert(proof.proofResult.boundedExternalBetaScorecardAllowed === true, 'bounded external beta mismatch')
assert(proof.liveReadinessEvidenceAfterProof.prodReadinessSummary.overallStatus === 'blocked', 'prod readiness must remain blocked')
assert(proof.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assertSupabaseNoop(proof.supabaseClassification, 'proof')

const results = parsed.results
assert(results.checkResults.length === 16, 'check result register count mismatch')
assert(countByStatus(results.checkResults, 'passed') === 2, 'register passed count mismatch')
assert(countByStatus(results.checkResults, 'warning') === 1, 'register warning count mismatch')
assert(countByStatus(results.checkResults, 'missing') === 8, 'register missing count mismatch')
assert(countByStatus(results.checkResults, 'not_installed') === 3, 'register optional missing count mismatch')
assert(countByStatus(results.checkResults, 'pending_manual_review') === 1, 'register manual review count mismatch')
assert(countByStatus(results.checkResults, 'evaluation_only') === 1, 'register evaluation-only count mismatch')
for (const required of ['pyav', 'pyscenedetect', 'opencv', 'duckdb', 'polars', 'opentimelineio', 'sharp', 'remotion']) {
  const item = results.checkResults.find((result) => result.toolId === required)
  assert(item?.status === 'missing', `${required} must be recorded missing`)
  assert(item.optional === false, `${required} must be required`)
}
assert(results.resultRegisterConclusion.requiredLaunchCoreDependenciesReady === false, 'register must keep readiness closed')
assert(results.resultRegisterConclusion.safeToProceedToInstallPlan === true, 'install plan readiness missing')
assert(results.resultRegisterConclusion.safeToProceedToRuntimeBeta === false, 'runtime beta must remain closed')
assertSupabaseNoop(results.supabaseClassification, 'results')

const missing = parsed.missing
assert(missing.requiredMissingDependencies.length === 8, 'required missing dependency count mismatch')
assert(missing.optionalMissingOrWarningDependencies.length === 4, 'optional missing/warning count mismatch')
assert(missing.policyBlockers.length === 2, 'policy blocker count mismatch')
assert(missing.dependencyRegisterConclusion.installPlanRequired === true, 'install plan requirement missing')
assert(missing.dependencyRegisterConclusion.installExecutionApprovedToday === false, 'install execution must be closed')
assert(missing.dependencyRegisterConclusion.productionAllowed === false, 'production must remain closed')
assertSupabaseNoop(missing.supabaseClassification, 'missing')

const blockers = parsed.blockers
assert(blockers.blockers.length === 5, 'blocker count mismatch')
assert(blockers.blockers.some((blocker) => blocker.blockerId === 'required_python_imports_missing'), 'missing python blocker')
assert(blockers.blockers.some((blocker) => blocker.blockerId === 'required_node_package_metadata_missing'), 'missing node blocker')
assert(blockers.blockerConclusion.controlledProofCompleted === true, 'proof completion missing')
assert(blockers.blockerConclusion.readinessPassed === false, 'readiness must not pass')
assert(blockers.blockerConclusion.nextSmallestSafeClosure === 'launch_core_dependency_install_plan', 'next closure mismatch')
assert(blockers.blockerConclusion.realUserMediaBetaAllowed === false, 'real-user beta must remain closed')
assertSupabaseNoop(blockers.supabaseClassification, 'blockers')

const claim = parsed.claim
assert(claim.allowedClaimsToday.includes('controlled launch-core command/import metadata proof executed'), 'allowed proof claim missing')
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `claim ${key} must be false`)
}
assert(claim.claimConclusion.proofEvidenceCanFeedInstallPlanning === true, 'install planning handoff missing')
assert(claim.claimConclusion.proofEvidenceCanUnlockRuntime === false, 'runtime unlock must be false')
assert(claim.claimConclusion.proofEvidenceCanUnlockRealUserMediaBeta === false, 'real-user beta unlock must be false')
assertSupabaseNoop(claim.supabaseClassification, 'claim')

const runner = read('server/workers/production-readiness/production-tool-readiness-runner.ts')
assert(runner.includes('M10 realCheckMode runs safe command/import/package-metadata checks only.'), 'runner safe wording missing')
const core = read('server/workers/production-readiness/core-cpu-render-readiness-checks.ts')
assert(core.includes('assertM10CoreResultsExcludeGpuModelTools'), 'GPU/model exclusion guard missing')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourcePr: 1429,
      sourceCommit: SOURCE_COMMIT,
      controlledRealCheckProofExecuted: true,
      passed: 2,
      warning: 1,
      missingRequired: 8,
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
