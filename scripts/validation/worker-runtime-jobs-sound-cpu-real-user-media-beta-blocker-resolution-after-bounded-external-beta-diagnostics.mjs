import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_real_user_media_beta_blocker_resolution_after_bounded_external_beta_completed_with_warnings_ready_for_launch_core_real_check_plan_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_real_user_media_beta_readiness_after_bounded_external_beta_completed_with_warnings_real_user_media_beta_still_blocked_ready_for_blocker_resolution_no_runtime_no_production'
const SOURCE_COMMIT = 'a2a238cbdbf83b7c24377dfdc418b0262da46b60'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-REAL-CHECK-PLAN-AFTER-REAL-USER-MEDIA-BETA-BLOCKER-RESOLUTION: plan launch-core readiness real checks, no runtime/no production'

const FILES = {
  resolution: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-blocker-resolution-after-bounded-external-beta.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-blocker-resolution-after-bounded-external-beta'
  },
  classification: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-blocker-classification-after-bounded-external-beta.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-blocker-classification-after-bounded-external-beta'
  },
  launchCore: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-next-closure-register-after-real-user-media-beta-blocker-resolution.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-next-closure-register-after-real-user-media-beta-blocker-resolution'
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-real-user-media-beta-blocker-resolution-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-real-user-media-beta-blocker-resolution-claim-policy'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-real-check-plan-after-real-user-media-beta-blocker-resolution.md'

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
  assert(doc.sourcePr === 1422, `${label} source PR mismatch`)
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
assert(promptText.includes('no runtime/no production'), 'next prompt missing no-runtime/no-production scope')
assert(promptText.includes('Check for duplicate same-purpose PRs'), 'next prompt missing duplicate guard')

const resolution = parsed.resolution
assert(resolution.resolutionResult.boundedExternalBetaScorecardAllowed === true, 'bounded external beta scorecard should be true')
assert(resolution.resolutionResult.blockersClosedForExecutionToday === 0, 'no blocker should be closed for execution')
assert(resolution.resolutionResult.blockersClassifiedToday === 9, 'classified blocker count mismatch')
assert(resolution.resolutionResult.selectedNextSmallestSafeClosure === 'launch_core_tool_readiness_real_check_plan', 'selected next closure mismatch')
assert(resolution.resolutionResult.ownerResponseWaitRequired === false, 'owner wait should be false')
assert(resolution.resolutionResult.repoEvidenceReviewRequiredBeforeClosure === true, 'repo evidence requirement missing')
assertAllFalse(resolution.resolutionResult, 'resolutionResult', [
  'boundedExternalBetaScorecardAllowed',
  'blockersClosedForExecutionToday',
  'blockersClassifiedToday',
  'selectedNextSmallestSafeClosure',
  'selectionReason',
  'ownerResponseWaitRequired',
  'repoEvidenceReviewRequiredBeforeClosure'
])
assert(resolution.liveReadinessEvidence.prodBetaSummary.externalBetaAllowed === true, 'external beta scorecard mismatch')
assert(resolution.liveReadinessEvidence.prodBetaSummary.realUserMediaBetaAllowed === false, 'real-user beta mismatch')
assert(resolution.liveReadinessEvidence.prodReadinessSummary.overallStatus === 'blocked', 'prod readiness status mismatch')
assert(resolution.liveReadinessEvidence.crossChatOwnershipDiagnostics.ownershipConflicts === 0, 'ownership conflict mismatch')
assert(resolution.nextPrompt === NEXT_PROMPT, 'resolution next prompt mismatch')
assertSupabaseNoop(resolution.supabaseClassification, 'resolution')

const classifications = parsed.classification.blockerClassifications
assert(classifications.length === 9, 'classification count mismatch')
const selected = classifications.filter((entry) => entry.closureStatus === 'selected_next')
assert(selected.length === 1, 'exactly one selected-next blocker expected')
assert(selected[0].blockerId === 'launch_core_tool_readiness_missing', 'launch-core must be selected')
for (const entry of classifications) {
  assert(entry.classification, `${entry.blockerId} missing classification`)
  assert(entry.closureStatus === 'not_closed' || entry.closureStatus === 'selected_next', `${entry.blockerId} closure status invalid`)
}
assert(parsed.classification.classificationConclusion.totalBlockers === 9, 'total blocker mismatch')
assert(parsed.classification.classificationConclusion.closedForExecutionToday === 0, 'closed blocker count mismatch')
assert(parsed.classification.classificationConclusion.classifiedToday === 9, 'classified count mismatch')
assert(parsed.classification.classificationConclusion.realUserMediaBetaAllowed === false, 'classification real-user mismatch')
assert(parsed.classification.classificationConclusion.paidProductionAllowed === false, 'classification production mismatch')

const launchCore = parsed.launchCore
assert(launchCore.launchCoreStatusSnapshot.toolsTotal === 49, 'tool total mismatch')
assert(launchCore.launchCoreStatusSnapshot.missing === 10, 'missing count mismatch')
assert(launchCore.launchCoreStatusSnapshot.notInstalled === 17, 'not-installed count mismatch')
assert(launchCore.launchCoreStatusSnapshot.properlyReadyForProductionExecution === 0, 'production-ready count must be zero')
for (const toolId of ['ffmpeg', 'ffprobe', 'opentimelineio', 'hyperframe', 'remotion', 'libass', 'sharp_libvips', 'opencv']) {
  assert(launchCore.topLaunchCoreBlockers.includes(toolId), `missing launch-core blocker ${toolId}`)
}
for (const [key, value] of Object.entries(launchCore.currentCommandPlanEvidence)) {
  assert(value === true, `command plan evidence ${key} must be true`)
}
assert(launchCore.nextClosurePlan.id === 'launch_core_real_check_plan', 'next closure id mismatch')
assert(launchCore.nextClosurePlan.mustStartWithPlanOnly === true, 'plan-only guard missing')
assert(launchCore.nextClosurePlan.mustAvoidDuplicatePr === true, 'duplicate guard missing')
assert(launchCore.nextClosurePlan.mustSeparateSafeCommandImportChecksFromRuntimeExecution === true, 'safe check separation missing')
assert(launchCore.nextClosurePlan.mustKeepRealUserMediaBetaBlockedUntilChecksAndApprovalsPass === true, 'real-user beta blocker guard missing')
assert(launchCore.nextClosurePlan.nextPrompt === NEXT_PROMPT, 'launch-core next prompt mismatch')

const claim = parsed.claim
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `claim ${key} must be false`)
}
assert(claim.allowedClaimsToday.includes('launch-core tool readiness selected as next smallest safe closure'), 'allowed launch-core claim missing')
assertSupabaseNoop(claim.supabaseClassification, 'claim')

const readinessPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-real-user-media-beta-blocker-resolution-after-bounded-external-beta.md')
assert(readinessPrompt.includes('Do not duplicate same-purpose PRs'), 'source prompt duplicate guard missing')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourcePr: 1422,
      sourceCommit: SOURCE_COMMIT,
      blockersClassified: 9,
      blockersClosedForExecutionToday: 0,
      selectedNextSmallestSafeClosure: 'launch_core_tool_readiness_real_check_plan',
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT
    },
    null,
    2
  )
)
