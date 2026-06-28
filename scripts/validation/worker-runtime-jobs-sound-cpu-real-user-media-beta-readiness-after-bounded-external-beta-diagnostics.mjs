import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_real_user_media_beta_readiness_after_bounded_external_beta_completed_with_warnings_real_user_media_beta_still_blocked_ready_for_blocker_resolution_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_bounded_external_beta_state_change_execution_completed_with_warnings_bounded_external_beta_scorecard_enabled_no_runtime_no_production'
const SOURCE_COMMIT = '01dcac914d722f0fdd4d8a58d6be19c288a42ede'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-REAL-USER-MEDIA-BETA-BLOCKER-RESOLUTION-AFTER-BOUNDED-EXTERNAL-BETA: resolve live real-user-media beta blockers, no runtime/no production'

const FILES = {
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-readiness-after-bounded-external-beta.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-readiness-after-bounded-external-beta'
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-live-blocker-register-after-bounded-external-beta.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-live-blocker-register-after-bounded-external-beta'
  },
  scenarios: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-scenario-blocker-register-after-bounded-external-beta.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-scenario-blocker-register-after-bounded-external-beta'
  },
  owners: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-owner-readiness-map-after-bounded-external-beta.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-owner-readiness-map-after-bounded-external-beta'
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-claim-policy-after-bounded-external-beta.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-claim-policy-after-bounded-external-beta'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-real-user-media-beta-blocker-resolution-after-bounded-external-beta.md'

function jsonTrue(key) {
  return `"${key}": ` + 'true'
}

function jsonYes(key) {
  return `"${key}": ` + '"yes"'
}

const FORBIDDEN_STRINGS = [
  jsonTrue('realUserMediaBetaAllowed'),
  jsonTrue('paidProductionAllowed'),
  jsonTrue('productionReady'),
  jsonTrue('realUserMediaBetaReadinessUnlockedToday'),
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
  ['postgresql', '://'].join('')
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
  assert(doc.sourcePr === 1418, `${label} source PR mismatch`)
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

function assertAllFalse(value, label, exceptions = []) {
  for (const [key, actual] of Object.entries(value)) {
    if (exceptions.includes(key)) continue
    assert(actual === false, `${label}.${key} must be false`)
  }
}

const parsed = {}
for (const [name, info] of Object.entries(FILES)) {
  parsed[name] = parseBlock(info)
  assertDecision(parsed[name], name)
}

const promptText = read(PROMPT)
assert(promptText.includes(DECISION), 'next prompt missing source decision')
assert(promptText.includes('no runtime/no production'), 'next prompt missing no runtime/no production scope')
assert(promptText.includes('Do not duplicate same-purpose PRs'), 'next prompt missing duplicate guard')

const readiness = parsed.readiness
assert(readiness.readinessResult.boundedExternalBetaScorecardAllowed === true, 'bounded scorecard should be true')
assert(readiness.readinessResult.boundedExternalBetaScope === 'no_runtime_no_real_user_media_scorecard_only', 'bounded scope mismatch')
assertAllFalse(readiness.readinessResult, 'readiness.readinessResult', ['boundedExternalBetaScorecardAllowed', 'boundedExternalBetaScope'])
assert(readiness.liveCommandEvidence.prodBetaSummary.status === 'warning', 'beta summary status mismatch')
assert(readiness.liveCommandEvidence.prodBetaSummary.externalBetaAllowed === true, 'external beta scorecard should be true')
assert(readiness.liveCommandEvidence.prodBetaSummary.realUserMediaBetaAllowed === false, 'real-user media beta should be false')
assert(readiness.liveCommandEvidence.prodReadinessSummary.overallStatus === 'blocked', 'production readiness should be blocked')
assert(readiness.liveCommandEvidence.prodReadinessSummary.hardBlockers === 101, 'hard blocker count mismatch')
assert(readiness.liveCommandEvidence.crossChatOwnershipDiagnostics.ownershipConflicts === 0, 'ownership conflict mismatch')
assert(readiness.liveCommandEvidence.packageLockHash === 'bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3', 'package-lock hash mismatch')
assert(readiness.nextPrompt === NEXT_PROMPT, 'readiness next prompt mismatch')
assertSupabaseNoop(readiness.supabaseClassification, 'readiness')

const blockers = parsed.blockers
const requiredBlockers = [
  'production_readiness_summary_blocked',
  'human_run_deployment_approval_required',
  'security_approval_required',
  'storage_privacy_approval_required',
  'model_weight_license_approval_required',
  'launch_core_tool_readiness_missing',
  'provider_integration_not_done',
  'final_export_missing',
  'mask_confidence_low'
]
for (const blockerId of requiredBlockers) {
  const blocker = blockers.liveBlockers.find((entry) => entry.blockerId === blockerId)
  assert(blocker, `missing blocker ${blockerId}`)
  assert(blocker.blocksRealUserMediaBeta === true, `${blockerId} must block real-user beta`)
  assert(blocker.closedToday === false, `${blockerId} must remain open`)
}
assert(blockers.toolReadinessSnapshot.toolsTotal === 49, 'tool total mismatch')
assert(blockers.toolReadinessSnapshot.missing === 10, 'missing tools mismatch')
assert(blockers.toolReadinessSnapshot.notInstalled === 17, 'not-installed tools mismatch')
assert(blockers.toolReadinessSnapshot.futureOnly === 7, 'future-only tools mismatch')
assert(blockers.toolReadinessSnapshot.evaluationOnly === 3, 'evaluation-only tools mismatch')
assert(blockers.toolReadinessSnapshot.needsLicenseReview === 2, 'license review tools mismatch')
assert(blockers.toolReadinessSnapshot.needsModelWeightReview === 10, 'model weight tools mismatch')
assert(blockers.toolReadinessSnapshot.properlyReadyForProductionExecution === 0, 'production-ready tool count must be zero')
assert(blockers.registerConclusion.boundedExternalBetaScorecardAllowed === true, 'blocker conclusion bounded mismatch')
assert(blockers.registerConclusion.realUserMediaBetaAllowed === false, 'blocker conclusion real-user mismatch')
assert(blockers.registerConclusion.blockersIdentifiedBeforeFutureExecution === true, 'blockers not identified')
assert(blockers.registerConclusion.safeToReadRealUserMediaToday === false, 'real media read must be unsafe')
assert(blockers.registerConclusion.safeToExecuteRuntimeToday === false, 'runtime must be unsafe')
assert(blockers.registerConclusion.safeToUnlockProductionToday === false, 'production must be unsafe')

const scenarios = parsed.scenarios
assert(scenarios.scenarioMatrix.length === 9, 'scenario count mismatch')
assert(scenarios.scenarioConclusion.scenarioCount === 9, 'scenario conclusion count mismatch')
assert(scenarios.scenarioConclusion.dryRunReadyCount === 9, 'dry-run ready count mismatch')
assert(scenarios.scenarioConclusion.localDevFixtureReadyCount === 8, 'local fixture ready count mismatch')
assert(scenarios.scenarioConclusion.realUserMediaBetaReadyCount === 0, 'real-user ready count must be zero')
assert(scenarios.scenarioConclusion.productionReadyCount === 0, 'production ready count must be zero')
assert(scenarios.scenarioConclusion.allScenariosStillBlockRealUserMediaBeta === true, 'scenario real-user blocking mismatch')
for (const scenario of scenarios.scenarioMatrix) {
  assert(scenario.realUserMediaBetaReady === false, `${scenario.scenarioId} real-user beta must be false`)
  assert(scenario.productionReady === false, `${scenario.scenarioId} production ready must be false`)
  assert(scenario.blockers.length > 0, `${scenario.scenarioId} must retain blockers`)
}

const owners = parsed.owners
const ownerLanes = owners.ownerReadinessMap.map((entry) => entry.ownerLane)
for (const owner of [
  'WORKER_RUNTIME_JOBS',
  'TRACK_B_MEDIA_PROCESSING',
  'SUPABASE_RLS_STORAGE_DATABASE',
  'COMPLIANCE_SECURITY',
  'PROVIDER_GATEWAY_MODELS',
  'BILLING_STRIPE_CREDITS',
  'PRODUCT_BETA_READINESS'
]) {
  assert(ownerLanes.includes(owner), `missing owner lane ${owner}`)
}
for (const entry of owners.ownerReadinessMap) {
  assert(entry.readyToday === false, `${entry.ownerLane} must not be ready today`)
  assert(entry.remainingEvidenceNeeded.length > 0, `${entry.ownerLane} missing evidence needs`)
}
assert(owners.mapConclusion.noOwnerConflictDetected === true, 'owner conflict conclusion mismatch')
assert(owners.mapConclusion.crossChatOwnershipDiagnosticsPassed === true, 'ownership diagnostics conclusion mismatch')
assert(owners.mapConclusion.ownerResponseWaitRequired === false, 'owner response wait should be false')
assert(owners.mapConclusion.repoEvidenceReviewRequiredBeforeEachClosure === true, 'repo evidence review requirement missing')
assert(owners.mapConclusion.realUserMediaBetaReadyToday === false, 'owner map real-user readiness must be false')

const claim = parsed.claim
assert(claim.allowedClaimsToday.includes('bounded external beta scorecard allowed'), 'bounded claim missing')
assert(claim.allowedClaimsToday.includes('real-user media beta remains blocked'), 'blocked claim missing')
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `closed claim ${key} must be false`)
}
for (const required of [
  'real user media beta is live',
  'paid production is live',
  'runtime execution is ready',
  'worker execution is ready',
  'route execution is ready',
  'media processing is ready',
  'generated_local_fixture_passed',
  'dry_run_passed'
]) {
  assert(claim.forbiddenClaims.includes(required), `forbidden claim missing ${required}`)
}
assertSupabaseNoop(claim.supabaseClassification, 'claim')

const betaPolicy = read('server/beta-readiness/beta-go-no-go-policy.ts')
assert(betaPolicy.includes('externalBetaAllowed'), 'beta policy missing bounded external beta field')
assert(betaPolicy.includes('realUserMediaBetaAllowed: false'), 'real-user media beta must remain false in policy')
assert(betaPolicy.includes('paidProductionAllowed: false'), 'paid production must remain false in policy')

const types = read('server/beta-readiness/beta-readiness-types.ts')
assert(types.includes('externalBetaAllowed: boolean'), 'external beta type should be boolean')
assert(types.includes('realUserMediaBetaAllowed: false'), 'real-user media beta type should remain false')
assert(types.includes('paidProductionAllowed: false'), 'paid production type should remain false')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourcePr: 1418,
      sourceCommit: SOURCE_COMMIT,
      boundedExternalBetaScorecardAllowed: true,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      remainingBlockers: requiredBlockers.length,
      nextPrompt: NEXT_PROMPT
    },
    null,
    2
  )
)
