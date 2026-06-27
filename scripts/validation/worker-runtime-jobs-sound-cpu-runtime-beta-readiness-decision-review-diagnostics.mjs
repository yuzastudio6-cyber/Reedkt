import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_runtime_beta_readiness_decision_review_completed_with_warnings_ready_for_controlled_no_media_no_artifact_execution_proof_retry'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_current_lane_status_review_completed_with_warnings_ready_for_runtime_beta_readiness_decision_review'
const sourceHead = 'c8b5035749dd49ba2d5035293b44ebd5f20cb8a7'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-NO-MEDIA-NO-ARTIFACT-EXECUTION-PROOF-RETRY: retry limited SOUND CPU package proof after music21 fix, no media/artifacts'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-decision-review.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-evidence-map.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-count-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-next-gate-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-blocker-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-claim-policy.md',
]

const requiredFiles = [
  ...docs,
  'docs/worker-runtime-jobs-sound-cpu-current-lane-status-review.md',
  'docs/worker-runtime-jobs-sound-cpu-current-tool-readiness-count-register.md',
  'docs/worker-runtime-jobs-sound-cpu-current-lane-context-register.md',
  'docs/worker-runtime-jobs-sound-cpu-current-next-step-decision-register.md',
  'docs/worker-runtime-jobs-sound-cpu-current-blocked-gates-register.md',
  'docs/worker-runtime-jobs-sound-cpu-current-lane-status-claim-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-package-proof-lane-reconciliation.md',
  'docs/worker-runtime-jobs-sound-cpu-package-proof-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-result.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-result.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix-result.md',
  'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-execution-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry.md',
  'package.json',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(file) {
  assert(fs.existsSync(file), `Missing file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function parseJsonBlock(file) {
  const text = read(file)
  const match = text.match(/```json [^\n]+\n([\s\S]*?)\n```/)
  assert(match, `${file} missing fenced json block`)
  return JSON.parse(match[1])
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label}.updateRequired must be no`)
  assert(value?.environmentTouched === 'no', `${label}.environmentTouched must be no`)
  assert(value?.sqlExecuted === 'no', `${label}.sqlExecuted must be no`)
  assert(value?.migrationDeployed === 'no', `${label}.migrationDeployed must be no`)
  assert(value?.nextAction === 'none', `${label}.nextAction must be none`)
}

for (const file of requiredFiles) read(file)

const parsed = Object.fromEntries(docs.map((file) => [file, parseJsonBlock(file)]))
for (const [file, json] of Object.entries(parsed)) {
  assert(json.owner === 'WORKER_RUNTIME_JOBS', `${file} owner mismatch`)
  assert(json.decision === decision, `${file} decision mismatch`)
}

const review = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-decision-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr1115.mergeCommit === sourceHead, 'PR #1115 merge commit mismatch')
assert(review.sourceVerification.pr1115.decision === sourceDecision, 'PR #1115 decision mismatch')
assert(review.decisionReviewResult.repoEvidenceInspected === true, 'repo evidence inspection missing')
assert(review.decisionReviewResult.ownerChatWaitRequired === false, 'owner chat wait must be false')
assert(review.decisionReviewResult.openDuplicatePrFound === false, 'open duplicate flag must be false')
assert(review.decisionReviewResult.samePurposeRemoteBranchFound === false, 'remote duplicate flag must be false')
assert(review.decisionReviewResult.olderDownstreamLaneArtifactsInspected === true, 'downstream inspection missing')
assert(review.decisionReviewResult.olderDownstreamLaneArtifactsShouldNotBeRecreated === true, 'downstream no-recreate guard missing')
assert(review.decisionReviewResult.packageProofReadyForPlanningCount === 15, 'package proof count mismatch')
assert(review.decisionReviewResult.persistentRuntimeInstallReadyCount === 0, 'runtime install count must be zero')
assert(review.decisionReviewResult.toolCallExecutionReadyCount === 0, 'tool-call count must be zero')
assert(review.decisionReviewResult.notYetRuntimeInstalledOrCallableCount === 15, 'not callable count mismatch')
assert(review.decisionReviewResult.music21ImportTimeoutFixAccepted === true, 'music21 fix acceptance missing')
assert(review.decisionReviewResult.priorNoMediaNoArtifactProofBlockedByMusic21ImportTimeout === true, 'prior blocker missing')
assert(review.decisionReviewResult.nextSafeGate === 'controlled_no_media_no_artifact_execution_proof_retry_after_music21_fix', 'next safe gate mismatch')
assert(review.decisionReviewResult.nextGateRequiresSeparatePrompt === true, 'separate prompt guard missing')
for (const key of [
  'currentPromptExecutionPerformed',
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactCreationApprovedToday',
  'supabaseSqlApprovedToday',
  'dockerGcpApprovedToday',
  'internalBetaAllowedToday',
  'externalBetaAllowedToday',
  'productionAllowedToday',
]) {
  assert(review.decisionReviewResult[key] === false, `${key} must remain false`)
}
assert(review.nextPrompt === nextPrompt, 'next prompt mismatch')

const evidence = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-evidence-map.md']
assert(evidence.evidenceRows.length === 5, 'evidence row count mismatch')
for (const row of evidence.evidenceRows) {
  assert(Array.isArray(row.evidenceFiles) && row.evidenceFiles.length > 0, `${row.lane} evidence file list missing`)
  for (const file of row.evidenceFiles) read(file)
}
for (const lane of [
  'current_lane_status_review',
  'package_proof_lane_reconciliation',
  'package_proof_owner_review',
  'prior_limited_no_media_no_artifact_proof',
  'older_runtime_beta_preflight_context',
]) {
  assert(evidence.evidenceRows.some((row) => row.lane === lane), `missing evidence lane ${lane}`)
}

const counts = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-count-register.md']
assert(counts.toolCounts.candidateToolCount === 15, 'candidate tool count mismatch')
assert(counts.toolCounts.directPinnedPackageCount === 13, 'direct package count mismatch')
assert(counts.toolCounts.aliasCoveredToolCount === 2, 'alias count mismatch')
assert(counts.toolCounts.packageProofReadyForPlanningTools.length === 15, 'package proof tool list count mismatch')
assert(counts.toolCounts.persistentRuntimeInstallReadyCount === 0, 'persistent runtime install count must be zero')
assert(counts.toolCounts.toolCallExecutionReadyCount === 0, 'tool-call count must be zero')
assert(counts.betaReadinessCounts.externalBetaReadyToolCount === 0, 'external beta count must be zero')
assert(counts.betaReadinessCounts.productionReadyToolCount === 0, 'production count must be zero')
assert(counts.interpretation.doNotCallTheseToolsYet === true, 'do-not-call guard missing')
assert(counts.interpretation.doNotExposeToExternalBetaYet === true, 'external beta guard missing')

const next = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-next-gate-register.md']
assert(next.nextGateDecision.selectedNextPrompt === nextPrompt, 'selected next prompt mismatch')
assert(next.nextGateDecision.selectedNextPromptFile === 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry.md', 'selected prompt file mismatch')
assert(next.nextGateDecision.ownerChatWaitRequired === false, 'next gate owner wait must be false')
assert(next.nextGateDecision.repoEvidenceSufficientForDecision === true, 'repo evidence sufficiency missing')
assert(next.nextGateDecision.duplicateLaneCreationAllowed === false, 'duplicate lane creation must be false')
assert(next.nextGateDecision.nextGateRunsInSeparatePromptOnly === true, 'next gate separate prompt guard missing')
for (const key of [
  'nextGateMayOpenMedia',
  'nextGateMayCreateArtifacts',
  'nextGateMayRunWorkerRouteToolRuntime',
  'nextGateMayMutateSupabaseSql',
  'nextGateMayCallProvidersModels',
  'nextGateMayRunDockerGcp',
  'nextGateMayUnlockBetaOrProduction',
]) {
  assert(next.nextGateDecision[key] === false, `${key} must remain false`)
}
assert(next.explicitlyNotSelected.length >= 5, 'not-selected lane list incomplete')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-blocker-register.md']
assert(blockers.blockers.length === 5, 'blocker count mismatch')
assert(blockers.blockers.every((row) => row.status === 'blocked'), 'all blockers must stay blocked')
assert(blockers.formerBlockerNowResolvedForPlanning.blocker === 'music21_import_timeout', 'former blocker mismatch')
assert(blockers.formerBlockerNowResolvedForPlanning.resolvedForPackageProofPlanningOnly === true, 'music21 planning resolution missing')
assert(blockers.formerBlockerNowResolvedForPlanning.resolvedForToolCallExecution === false, 'music21 must not resolve tool execution')
assert(blockers.formerBlockerNowResolvedForPlanning.resolvedForBeta === false, 'music21 must not resolve beta')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-claim-policy.md']
for (const value of Object.values(policy.allowedClaims)) assert(value === true, 'allowed claims must be true')
for (const claim of ['15 tools are callable today', 'tool-call execution ready', 'runtime readiness', 'external beta ready', 'production ready']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim: ${claim}`)
}
assertNoop(policy.supabaseClassification, 'policy.supabaseClassification')
assert(policy.requiredNoScopeStatement.includes('No Docker build, Docker push, or Docker run'), 'no-scope Docker closure missing')

const current = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-current-lane-status-review.md')
assert(current.decision === sourceDecision, 'current status source decision mismatch')
assert(current.statusReviewResult.packageProofReadyForPlanningCount === 15, 'current package proof count mismatch')
assert(current.statusReviewResult.persistentRuntimeInstallReadyCount === 0, 'current runtime install count mismatch')
assert(current.statusReviewResult.toolCallExecutionReadyCount === 0, 'current tool-call count mismatch')
assert(current.statusReviewResult.externalBetaReadyToday === false, 'current external beta widened')
assert(current.statusReviewResult.productionReadyToday === false, 'current production widened')

const currentCounts = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-current-tool-readiness-count-register.md')
assert(currentCounts.toolCounts.packageProofReadyForPlanningCount === 15, 'current count register package proof mismatch')
assert(currentCounts.toolCounts.persistentRuntimeInstallReadyCount === 0, 'current count register runtime mismatch')
assert(currentCounts.toolCounts.toolCallExecutionReadyCount === 0, 'current count register tool-call mismatch')

const packageProof = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-package-proof-owner-review.md')
assert(packageProof.ownerReviewResult.allFifteenCandidateToolsCovered === true, 'package proof owner review missing 15 tools')
assert(packageProof.ownerReviewResult.acceptedForToolCallExecutionToday === false, 'package proof owner review widened tool execution')

const music21Fix = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-result.md')
assert(music21Fix.proofResult.metadataPassedCount === 13, 'music21 fix metadata count mismatch')
assert(music21Fix.proofResult.moduleImportsPassedCount === 14, 'music21 fix import count mismatch')
assert(music21Fix.proofResult.syntheticAssertionsPassedCount === 5, 'music21 fix synthetic count mismatch')

const oldProof = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix-result.md')
assert(oldProof.decision === 'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_import_timeout', 'old proof blocker mismatch')
assert(oldProof.fixResult.blockingModule === 'music21', 'old blocking module mismatch')
assert(oldProof.readinessOutcome.packageProofPassed === false, 'old blocked proof must not pass')

const limitedPlan = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-execution-plan.md')
assert(limitedPlan.planResult.futureControlledProofMayProceed === true, 'limited proof plan flag missing')
assert(limitedPlan.planResult.executionPerformedInThisPrompt === false, 'limited plan must be no-execution')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry.md')
assert(prompt.includes(decision), 'retry prompt must require this decision')
assert(prompt.includes('Stop rather than duplicate'), 'retry prompt must block duplicates')
assert(prompt.includes('disposable local venv outside tracked source'), 'retry prompt must use disposable venv')
assert(prompt.includes('Do not open media files'), 'retry prompt must block media')
assert(prompt.includes('do not claim external beta readiness or production readiness'), 'retry prompt must block beta/production claims')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-runtime-beta-readiness-decision-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-decision-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_beta_readiness_decision_review_diagnostics_passed',
  decision,
  sourceHead,
  packageProofReadyForPlanningCount: 15,
  persistentRuntimeInstallReadyCount: 0,
  toolCallExecutionReadyCount: 0,
  nextPrompt,
}, null, 2))
