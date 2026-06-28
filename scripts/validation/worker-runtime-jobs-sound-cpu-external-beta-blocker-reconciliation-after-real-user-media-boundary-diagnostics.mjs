import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_external_beta_blocker_reconciliation_after_real_user_media_boundary_completed_with_warnings_external_beta_still_blocked_ready_for_next_blocker_closure'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_real_user_media_beta_boundary_closure_after_external_beta_reconciliation_completed_with_warnings_ready_for_external_beta_blocker_reconciliation_no_external_beta'
const SOURCE_COMMIT = 'a51629662b5715489279595bfc0c7bb45d0434a1'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-TOOL-READINESS-BLOCKER-CLOSURE-AFTER-EXTERNAL-BETA-RECONCILIATION: close launch-core tool readiness blocker for planning, no tool execution/no external beta'

const FILES = {
  reconciliation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-blocker-reconciliation-after-real-user-media-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-blocker-reconciliation-after-real-user-media-boundary'
  },
  sourceRegister: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-blocker-source-register-after-real-user-media-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-blocker-source-register-after-real-user-media-boundary'
  },
  liveReadiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-blocker-live-readiness-after-real-user-media-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-blocker-live-readiness-after-real-user-media-boundary'
  },
  classification: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-blocker-classification-after-real-user-media-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-blocker-classification-after-real-user-media-boundary'
  },
  launchCoreScope: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-launch-core-tool-blocker-scope-after-real-user-media-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-launch-core-tool-blocker-scope-after-real-user-media-boundary'
  },
  claimPolicy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-external-beta-blocker-claim-policy-after-real-user-media-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-external-beta-blocker-claim-policy-after-real-user-media-boundary'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-tool-readiness-blocker-closure-after-external-beta-reconciliation.md'

const FORBIDDEN_STRINGS = [
  '"externalBetaAllowed": true',
  '"realUserMediaBetaAllowed": true',
  '"launchCoreToolReadinessClosedToday": true',
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
assert(promptText.includes('no tool execution/no external beta'), 'next prompt missing no-tool/no-external-beta scope')

const reconciliation = parsed.reconciliation
assert(reconciliation.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(reconciliation.sourcePr === 1390, 'source PR mismatch')
assert(reconciliation.sourceMergeCommit === SOURCE_COMMIT, 'source merge commit mismatch')
assert(reconciliation.reconciliationResult.externalBetaBlockersReconciled === true, 'reconciliation flag missing')
assert(reconciliation.reconciliationResult.currentProdReadinessOverallStatus === 'blocked', 'prod readiness mismatch')
assert(reconciliation.reconciliationResult.currentHardBlockerCount === 101, 'hard blocker count mismatch')
assert(reconciliation.reconciliationResult.currentWarningCount === 26, 'warning count mismatch')
assert(reconciliation.reconciliationResult.currentBetaReadinessStatus === 'internal_testing_ready', 'beta status mismatch')
assert(reconciliation.reconciliationResult.internalDryRunAllowed === true, 'internal dry-run mismatch')
assert(reconciliation.reconciliationResult.externalBetaAllowed === false, 'external beta must remain false')
assert(reconciliation.reconciliationResult.realUserMediaBetaAllowed === false, 'real-user beta must remain false')
assert(reconciliation.reconciliationResult.selectedNextBlocker === 'launch_core_tool_readiness_missing', 'next blocker mismatch')
assert(reconciliation.reconciliationResult.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assertAllFalse(reconciliation.scopeResult, 'scopeResult')
assertSupabaseNoop(reconciliation.supabaseClassification, 'reconciliation')

const sources = parsed.sourceRegister.sources
assert(sources.length === 6, 'source register count mismatch')
for (const [source, decision] of [
  ['PR #1390', SOURCE_DECISION],
  [
    'PR #1389',
    'worker_runtime_jobs_sound_cpu_external_beta_readiness_reconciliation_after_beta_support_boundary_completed_with_warnings_external_beta_still_blocked_ready_for_specific_blocker_closure'
  ],
  [
    'PR #1381',
    'worker_runtime_jobs_sound_cpu_beta_support_boundary_closure_after_worker_route_boundary_completed_with_warnings_ready_for_external_beta_readiness_reconciliation_no_external_beta'
  ]
]) {
  assert(
    sources.some((entry) => entry.source === source && entry.decision === decision),
    `missing source register entry: ${source}`
  )
}
assert(parsed.sourceRegister.sourceConclusion.requiredPr1390Merged === true, 'PR #1390 source not marked merged')
assert(parsed.sourceRegister.sourceConclusion.externalBetaUnlockEvidencePresent === false, 'external beta unlock evidence must be absent')

const live = parsed.liveReadiness
assert(live.prodReadinessSummary.overallStatus === 'blocked', 'live prod status mismatch')
assert(live.prodReadinessSummary.hardBlockers === 101, 'live hard blockers mismatch')
assert(live.prodReadinessSummary.warnings === 26, 'live warnings mismatch')
assert(live.prodReadinessSummary.toolStatuses.missing === 10, 'missing count mismatch')
assert(live.prodReadinessSummary.toolStatuses.notInstalled === 17, 'not installed count mismatch')
for (const tool of ['FFmpeg', 'ffprobe', 'OpenTimelineIO', 'Hyperframe', 'Remotion', 'libass', 'Sharp + libvips', 'OpenCV']) {
  assert(live.prodReadinessSummary.topLaunchCoreBlockers.includes(tool), `missing launch-core blocker: ${tool}`)
}
assert(live.prodBetaSummary.status === 'internal_testing_ready', 'live beta mismatch')
assert(live.prodBetaSummary.externalBetaAllowed === false, 'live external beta must remain false')
assert(live.prodBetaSummary.realUserMediaBetaAllowed === false, 'live real-user media beta must remain false')
assert(live.crossChatOwnershipDiagnostics.ownershipConflicts === 0, 'ownership conflicts mismatch')
assert(live.liveConclusion.firstSelectedBlocker === 'launch_core_tool_readiness_missing', 'live conclusion blocker mismatch')
assert(live.liveConclusion.safeToUnlockExternalBetaInThisPrompt === false, 'must not unlock external beta')

const classification = parsed.classification
const selected = classification.remainingExternalBetaBlockers.find((item) => item.smallestNextBlocker === true)
assert(selected?.blockerId === 'launch_core_tool_readiness_missing', 'selected classification blocker mismatch')
assert(selected.nextPrompt === NEXT_PROMPT, 'selected classification prompt mismatch')
for (const blocker of [
  'model_weight_and_license_reviews_pending',
  'deployment_security_cost_approval_pending',
  'external_beta_unlock_owner_review_missing'
]) {
  assert(classification.remainingExternalBetaBlockers.some((item) => item.blockerId === blocker), `missing deferred blocker ${blocker}`)
}
assert(classification.classificationConclusion.externalBetaStillBlocked === true, 'classification must block external beta')
assert(classification.classificationConclusion.safeToForceExternalBeta === false, 'must not force external beta')

const launchCore = parsed.launchCoreScope
for (const tool of ['ffmpeg', 'ffprobe', 'opentimelineio', 'hyperframe', 'remotion', 'libass', 'sharp_libvips', 'opencv']) {
  assert(launchCore.selectedLaunchCoreTools.includes(tool), `missing selected launch-core tool ${tool}`)
}
assert(launchCore.scopeForNextPrompt.closeForPlanningOnly === true, 'launch-core next scope must be planning only')
assertAllFalse(launchCore.scopeForNextPrompt, 'launchCore.scopeForNextPrompt', ['closeForPlanningOnly'])

const claim = parsed.claimPolicy
assert(claim.closedFlags.externalBetaBlockersReconciledToday === true, 'reconciled flag missing')
assertAllFalse(claim.closedFlags, 'claim.closedFlags', ['externalBetaBlockersReconciledToday'])
for (const required of [
  'launch-core tool readiness passed',
  'tool execution ready',
  'external beta ready',
  'external beta unlocked',
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
      selectedNextBlocker: 'launch_core_tool_readiness_missing',
      nextPrompt: NEXT_PROMPT
    },
    null,
    2
  )
)
