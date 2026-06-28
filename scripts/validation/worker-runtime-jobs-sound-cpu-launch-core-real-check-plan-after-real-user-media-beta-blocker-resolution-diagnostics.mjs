import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_real_check_plan_after_real_user_media_beta_blocker_resolution_completed_with_warnings_ready_for_controlled_real_check_proof_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_real_user_media_beta_blocker_resolution_after_bounded_external_beta_completed_with_warnings_ready_for_launch_core_real_check_plan_no_runtime_no_production'
const SOURCE_COMMIT = 'b1fb65a130dbbf352a15a16b7bf1e775fb0a8e3a'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-LAUNCH-CORE-REAL-CHECK-PROOF-AFTER-PLAN: run controlled launch-core command/import metadata proof, no runtime/no production'

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-real-check-plan-after-real-user-media-beta-blocker-resolution.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-real-check-plan-after-real-user-media-beta-blocker-resolution'
  },
  scope: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-real-check-scope-register-after-real-user-media-beta-blocker-resolution.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-real-check-scope-register-after-real-user-media-beta-blocker-resolution'
  },
  commands: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-real-check-command-register-after-real-user-media-beta-blocker-resolution.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-real-check-command-register-after-real-user-media-beta-blocker-resolution'
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-real-check-blocker-register-after-real-user-media-beta-blocker-resolution.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-real-check-blocker-register-after-real-user-media-beta-blocker-resolution'
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-real-check-claim-policy-after-real-user-media-beta-blocker-resolution.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-real-check-claim-policy-after-real-user-media-beta-blocker-resolution'
  }
}

const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-proof-after-plan.md'

function jsonTrue(key) {
  return `"${key}": ` + 'true'
}

function jsonYes(key) {
  return `"${key}": ` + '"yes"'
}

const FORBIDDEN_STRINGS = [
  jsonTrue('realChecksExecutedToday'),
  jsonTrue('launchCoreRealChecksExecuted'),
  jsonTrue('launchCoreToolReadinessClosed'),
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
  assert(doc.sourcePr === 1425, `${label} source PR mismatch`)
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
assert(promptText.includes('must not process media'), 'next prompt missing media prohibition')

const plan = parsed.plan
assert(plan.planResult.launchCoreRealCheckPlanCreated === true, 'plan created flag missing')
assert(plan.planResult.realChecksExecutedToday === false, 'real checks must not run today')
assert(plan.planResult.boundedExternalBetaScorecardAllowed === true, 'bounded scorecard mismatch')
assertAllFalse(plan.planResult, 'planResult', [
  'launchCoreRealCheckPlanCreated',
  'realChecksExecutedToday',
  'boundedExternalBetaScorecardAllowed'
])
assert(plan.checkPlanSummary.coreToolIds === 14, 'core tool count mismatch')
assert(plan.checkPlanSummary.commandVersionChecks === 3, 'command check count mismatch')
assert(plan.checkPlanSummary.pythonImportChecks === 8, 'python import count mismatch')
assert(plan.checkPlanSummary.nodePackageMetadataChecks === 3, 'node metadata count mismatch')
assert(plan.checkPlanSummary.policyChecks === 2, 'policy check count mismatch')
assert(plan.checkPlanSummary.excludedGpuModelTools === 13, 'excluded GPU/model count mismatch')
assert(plan.liveReadinessEvidence.prodBetaSummary.externalBetaAllowed === true, 'external beta scorecard mismatch')
assert(plan.liveReadinessEvidence.prodBetaSummary.realUserMediaBetaAllowed === false, 'real-user beta mismatch')
assert(plan.liveReadinessEvidence.prodReadinessSummary.overallStatus === 'blocked', 'production readiness mismatch')
for (const [key, value] of Object.entries(plan.liveReadinessEvidence.commandPlanEvidence)) {
  assert(value === true, `command plan evidence ${key} must be true`)
}
assert(plan.nextPrompt === NEXT_PROMPT, 'plan next prompt mismatch')
assertSupabaseNoop(plan.supabaseClassification, 'plan')

const scope = parsed.scope
for (const kind of ['command_version', 'python_import', 'node_package_metadata', 'manual_review_policy_read', 'registry_policy_read']) {
  assert(scope.allowedFutureCheckKinds.includes(kind), `missing allowed check kind ${kind}`)
}
assert(scope.allowedFutureChecks.length === 14, 'allowed future check count mismatch')
for (const excluded of ['media file open', 'real user media read', 'Docker build/run/push', 'Supabase mutation']) {
  assert(scope.explicitlyExcludedFutureChecks.includes(excluded), `missing excluded scope ${excluded}`)
}
assert(scope.scopeConclusion.safeCheckBoundaryPlanned === true, 'safe boundary missing')
assert(scope.scopeConclusion.futureProofMustRemainNoRuntimeNoProduction === true, 'future proof guard missing')
assert(scope.scopeConclusion.realUserMediaBetaAllowed === false, 'scope real-user beta mismatch')

const commands = parsed.commands
assert(commands.plannedRunner.sourceFunction === 'runProductionToolReadiness', 'planned runner mismatch')
assert(commands.plannedRunner.mode === 'realCheckMode', 'runner mode mismatch')
assert(commands.plannedRunner.actualExecutionInThisPacket === false, 'runner must not execute')
assert(commands.commandChecks.length === 3, 'command checks mismatch')
assert(commands.pythonImportChecks.length === 8, 'python checks mismatch')
assert(commands.nodePackageMetadataChecks.length === 3, 'node metadata checks mismatch')
assert(commands.policyChecks.length === 2, 'policy checks mismatch')
assert(commands.commandRegisterConclusion.plannedChecksTotal === 16, 'planned total mismatch')
assert(commands.commandRegisterConclusion.realChecksExecutedToday === false, 'command register execution flag mismatch')
assert(commands.commandRegisterConclusion.futureProofMustCaptureSanitizedOutputOnly === true, 'sanitized output guard missing')

const blockers = parsed.blockers
const selected = blockers.remainingBlockers.find((entry) => entry.blockerId === 'launch_core_real_checks_not_executed')
assert(selected?.status === 'selected_next', 'launch-core blocker must be selected next')
assert(selected.blocksRealUserMediaBeta === true, 'selected blocker must block real-user beta')
assert(blockers.blockerConclusion.launchCorePlanCreated === true, 'blocker conclusion plan missing')
assert(blockers.blockerConclusion.launchCoreReadinessClosedToday === false, 'launch-core readiness must remain open')
assert(blockers.blockerConclusion.nextProofMayProceedOnlyIfDuplicateCheckPasses === true, 'duplicate guard missing')

const claim = parsed.claim
assert(claim.allowedClaimsToday.includes('launch-core real-check plan created'), 'allowed plan claim missing')
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `claim ${key} must be false`)
}
assertSupabaseNoop(claim.supabaseClassification, 'claim')

const runner = read('server/workers/production-readiness/production-tool-readiness-runner.ts')
assert(runner.includes('realCheckMode'), 'runner missing realCheckMode')
assert(runner.includes('runCoreCpuRenderReadinessChecks'), 'runner missing core readiness function')
assert(runner.includes('M10 realCheckMode runs safe command/import/package-metadata checks only.'), 'runner missing safe check wording')

const core = read('server/workers/production-readiness/core-cpu-render-readiness-checks.ts')
assert(core.includes('execFileSync'), 'core check file should use execFileSync for future command checks')
assert(core.includes('Dry-run readiness records expected checks without executing commands or imports.'), 'core check file missing dry-run guard')
assert(core.includes('assertM10CoreResultsExcludeGpuModelTools'), 'core check file missing GPU/model exclusion guard')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourcePr: 1425,
      sourceCommit: SOURCE_COMMIT,
      launchCoreRealCheckPlanCreated: true,
      realChecksExecutedToday: false,
      plannedChecksTotal: 16,
      allowedCoreTools: 14,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT
    },
    null,
    2
  )
)
