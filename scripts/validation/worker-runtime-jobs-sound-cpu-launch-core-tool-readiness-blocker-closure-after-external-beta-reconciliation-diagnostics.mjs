import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_tool_readiness_blocker_closure_after_external_beta_reconciliation_completed_with_warnings_ready_for_model_license_blocker_reconciliation_no_external_beta'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_external_beta_blocker_reconciliation_after_real_user_media_boundary_completed_with_warnings_external_beta_still_blocked_ready_for_next_blocker_closure'
const SOURCE_COMMIT = '16a53f7a8a6197baf2dfd5bbcbd8c93b286dd626'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-MODEL-LICENSE-BLOCKER-RECONCILIATION-AFTER-LAUNCH-CORE-TOOL-READINESS-CLOSURE: reconcile model/license blockers after launch-core planning closure, no model download/no external beta'

const FILES = {
  closure: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-blocker-closure-after-external-beta-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-blocker-closure-after-external-beta-reconciliation'
  },
  sourceRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-source-register-after-external-beta-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-source-register-after-external-beta-reconciliation'
  },
  liveReadiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-live-readiness-after-external-beta-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-live-readiness-after-external-beta-reconciliation'
  },
  toolRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-register-after-external-beta-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-register-after-external-beta-reconciliation'
  },
  deferredRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-deferred-model-license-register-after-external-beta-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-deferred-model-license-register-after-external-beta-reconciliation'
  },
  claimPolicy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-claim-policy-after-external-beta-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-claim-policy-after-external-beta-reconciliation'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-model-license-blocker-reconciliation-after-launch-core-tool-readiness-closure.md'

const FORBIDDEN_STRINGS = [
  '"externalBetaAllowed": true',
  '"realUserMediaBetaAllowed": true',
  '"launchCoreToolReadinessPassedToday": true',
  '"toolExecutionApprovedToday": true',
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"realUserMediaAcceptedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseMutationApprovedToday": true',
  '"sqlExecutionApprovedToday": true',
  '"providerModelCallApprovedToday": true',
  '"deploymentApprovedToday": true',
  '"externalBetaUnlockApprovedToday": true',
  '"productionUnlockApprovedToday": true',
  '"runtimeReadinessClaimedToday": true',
  '"workerReadinessClaimedToday": true',
  '"mediaReadinessClaimedToday": true',
  '"generatedLocalFixturePassedClaimedToday": true',
  '"dryRunPassedClaimedToday": true',
  '"environmentTouched": "yes"',
  '"sqlExecuted": "yes"',
  '"migrationDeployed": "yes"',
  'SUPABASE_SERVICE',
  'STRIPE_SECRET',
  'GOOGLE_APPLICATION_CREDENTIALS'
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
  assert(doc.decision === DECISION, `${label} decision mismatch`)
}

function assertAllFalse(value, label, exceptions = []) {
  for (const [key, actual] of Object.entries(value)) {
    if (exceptions.includes(key)) continue
    assert(actual === false, `${label}.${key} must be false`)
  }
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
assert(promptText.includes('no model download/no external beta'), 'next prompt missing no-model/no-external-beta scope')
assert(promptText.includes('No model download'), 'next prompt missing forbidden model download statement')

const closure = parsed.closure
assert(closure.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(closure.sourcePr === 1396, 'source PR mismatch')
assert(closure.sourceMergeCommit === SOURCE_COMMIT, 'source merge commit mismatch')
assert(closure.closureResult.launchCoreBlockerClosedForPlanningOnly === true, 'planning closure flag missing')
assert(closure.closureResult.launchCoreToolReadinessPassedToday === false, 'launch-core readiness must not pass today')
assert(closure.closureResult.externalBetaAllowed === false, 'external beta must remain false')
assert(closure.closureResult.realUserMediaBetaAllowed === false, 'real-user beta must remain false')
assert(closure.closureResult.productionAllowed === false, 'production must remain false')
assert(closure.closureResult.selectedNextBlocker === 'model_weight_and_license_reviews_pending', 'next blocker mismatch')
assert(closure.closureResult.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assert(closure.liveReadinessAtClosure.overallStatus === 'blocked', 'closure readiness mismatch')
assert(closure.liveReadinessAtClosure.hardBlockers === 101, 'hard blocker count mismatch')
assert(closure.liveReadinessAtClosure.warnings === 26, 'warning count mismatch')
assertSupabaseNoop(closure.supabaseClassification, 'closure')

const expectedTools = ['ffmpeg', 'ffprobe', 'opentimelineio', 'hyperframe', 'remotion', 'libass', 'sharp_libvips', 'opencv']
for (const tool of expectedTools) {
  assert(closure.launchCoreToolsRepresented.includes(tool), `closure missing launch-core tool ${tool}`)
}
assert(closure.launchCoreToolsRepresented.length === expectedTools.length, 'closure tool count mismatch')

const sources = parsed.sourceRegister.sources
assert(sources.length === 5, 'source register count mismatch')
assert(sources.some((entry) => entry.source === 'PR #1396' && entry.mergeCommit === SOURCE_COMMIT), 'missing PR #1396 source')
assert(parsed.sourceRegister.sourceConclusion.requiredPr1396Merged === true, 'PR #1396 source not marked merged')
assert(parsed.sourceRegister.sourceConclusion.samePurposeDuplicateFound === false, 'same-purpose duplicate must be false')
assert(parsed.sourceRegister.sourceConclusion.externalBetaUnlockEvidencePresent === false, 'external beta unlock evidence must be absent')
assert(parsed.sourceRegister.sourceConclusion.safeToProceedToModelLicensePlanning === true, 'model/license planning handoff missing')

const live = parsed.liveReadiness
assert(live.prodReadinessSummary.overallStatus === 'blocked', 'live prod status mismatch')
assert(live.prodReadinessSummary.hardBlockers === 101, 'live hard blockers mismatch')
assert(live.prodReadinessSummary.warnings === 26, 'live warnings mismatch')
assert(live.prodReadinessSummary.toolStatuses.missing === 10, 'missing count mismatch')
assert(live.prodReadinessSummary.toolStatuses.notInstalled === 17, 'not installed count mismatch')
for (const tool of ['FFmpeg', 'ffprobe', 'OpenTimelineIO', 'Hyperframe', 'Remotion', 'libass', 'Sharp + libvips', 'OpenCV']) {
  assert(live.prodReadinessSummary.topLaunchCoreBlockers.includes(tool), `missing live launch-core blocker ${tool}`)
}
assert(live.prodBetaSummary.status === 'internal_testing_ready', 'live beta mismatch')
assert(live.prodBetaSummary.externalBetaAllowed === false, 'live external beta must remain false')
assert(live.prodBetaSummary.realUserMediaBetaAllowed === false, 'live real-user media beta must remain false')
assert(live.crossChatOwnershipDiagnostics.ownershipConflicts === 0, 'ownership conflicts mismatch')
assert(live.liveConclusion.launchCoreBlockerWasFirstSelectedBlocker === true, 'launch-core must be first selected blocker')
assert(live.liveConclusion.launchCoreClosedForPlanningOnly === true, 'planning closure missing')
assert(live.liveConclusion.toolReadinessStillRequiresFutureProof === true, 'future proof requirement missing')
assert(live.liveConclusion.safeToUnlockExternalBetaInThisPrompt === false, 'must not unlock external beta')

const toolRegister = parsed.toolRegister
assert(toolRegister.launchCoreToolSet.length === expectedTools.length, 'tool register count mismatch')
for (const tool of expectedTools) {
  const entry = toolRegister.launchCoreToolSet.find((item) => item.toolId === tool)
  assert(entry, `missing tool register item ${tool}`)
  assert(entry.readinessClosure === 'planning_only', `${tool} closure must be planning only`)
  assert(entry.futureProofRequired === true, `${tool} future proof must be required`)
  assert(entry.executionApprovedToday === false, `${tool} execution must be false`)
}
assertAllFalse(toolRegister.closureBoundaries, 'toolRegister.closureBoundaries')
assert(toolRegister.registerConclusion.representedToolCount === expectedTools.length, 'represented count mismatch')
assert(toolRegister.registerConclusion.launchCoreToolReadinessBlockerNoLongerNeedsSelection === true, 'selection closure missing')
assert(toolRegister.registerConclusion.launchCoreReadinessPassed === false, 'readiness must not pass')
assert(toolRegister.registerConclusion.nextBlockerClass === 'model_weight_and_license_reviews_pending', 'tool register next blocker mismatch')

const deferred = parsed.deferredRegister
const next = deferred.deferredBlockers.find((item) => item.selectedNext === true)
assert(next?.blockerId === 'model_weight_and_license_reviews_pending', 'deferred next blocker mismatch')
assert(next.nextPrompt === NEXT_PROMPT, 'deferred next prompt mismatch')
for (const blocker of ['deployment_security_cost_approval_pending', 'external_beta_unlock_owner_review_missing']) {
  assert(deferred.deferredBlockers.some((item) => item.blockerId === blocker), `missing deferred blocker ${blocker}`)
}
assertAllFalse(deferred.modelLicenseScope, 'deferred.modelLicenseScope')

const claim = parsed.claimPolicy
assert(claim.closedFlags.launchCoreBlockerClosedForPlanningOnly === true, 'planning-only closure flag missing')
assertAllFalse(claim.closedFlags, 'claim.closedFlags', ['launchCoreBlockerClosedForPlanningOnly'])
for (const required of [
  'launch-core tool readiness passed',
  'FFmpeg execution ready',
  'ffprobe execution ready',
  'OpenTimelineIO execution ready',
  'Hyperframe execution ready',
  'Remotion execution ready',
  'libass execution ready',
  'Sharp + libvips execution ready',
  'OpenCV execution ready',
  'external beta ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'production ready'
]) {
  assert(claim.forbiddenClaims.includes(required), `forbidden claim missing: ${required}`)
}
assertSupabaseNoop(claim.supabaseClassification, 'claimPolicy')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceCommit: SOURCE_COMMIT,
      externalBetaAllowed: false,
      launchCoreClosedForPlanningOnly: true,
      selectedNextBlocker: 'model_weight_and_license_reviews_pending',
      nextPrompt: NEXT_PROMPT
    },
    null,
    2
  )
)
