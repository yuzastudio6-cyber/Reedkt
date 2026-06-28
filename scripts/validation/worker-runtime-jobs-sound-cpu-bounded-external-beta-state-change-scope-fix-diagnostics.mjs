import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_bounded_external_beta_state_change_scope_fix_completed_with_warnings_ready_for_bounded_external_beta_state_change_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_external_beta_state_change_plan_after_owner_review_completed_with_warnings_ready_for_bounded_external_beta_state_change_execution'
const SOURCE_COMMIT = 'eb1d00386e74b2eb88e86616129633a499a8c3ab'
const TYPE_FILE = 'server/beta-readiness/beta-readiness-types.ts'
const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-beta-state-change-execution-after-plan.md'
const CONSUMER_SCOPE_DECISION =
  'worker_runtime_jobs_sound_cpu_bounded_external_beta_consumer_scope_fix_completed_with_warnings_ready_for_bounded_external_beta_state_change_execution'

const FILES = {
  scopeFix: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-beta-state-change-scope-fix.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-beta-state-change-scope-fix'
  },
  typeBoundary: {
    path: 'docs/worker-runtime-jobs-sound-cpu-beta-readiness-type-boundary-register-after-state-change-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-beta-readiness-type-boundary-register-after-state-change-plan'
  },
  exactScope: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-beta-state-change-exact-scope-after-type-boundary.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-beta-state-change-exact-scope-after-type-boundary'
  },
  claimPolicy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-beta-state-change-scope-fix-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-beta-state-change-scope-fix-claim-policy'
  }
}

const FORBIDDEN_STRINGS = [
  '"externalBetaAllowed": true',
  '"realUserMediaBetaAllowed": true',
  '"paidProductionAllowed": true',
  '"externalBetaUnlockApprovedToday": true',
  '"externalBetaLiveToday": true',
  '"stateChangeExecutedToday": true',
  '"runtimeExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"modelDownloadApprovedToday": true',
  '"providerModelCallApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseMutationApprovedToday": true',
  '"sqlExecutionApprovedToday": true',
  '"runtimeReadinessClaimedToday": true',
  '"generatedLocalFixturePassedClaimedToday": true',
  '"dryRunPassedClaimedToday": true',
  '"environmentTouched": "yes"',
  '"sqlExecuted": "yes"',
  '"migrationDeployed": "yes"',
  'SUPABASE_SERVICE',
  'STRIPE_SECRET',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'BEGIN PRIVATE KEY',
  'postgres://',
  'postgresql://'
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
  assert(doc.sourcePr === 1411, `${label} source PR mismatch`)
  assert(doc.sourceMergeCommit === SOURCE_COMMIT, `${label} source merge commit mismatch`)
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

const scopeFix = parsed.scopeFix
assert(scopeFix.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(scopeFix.scopeFix.scopeFixCreated === true, 'scope fix flag missing')
assert(scopeFix.scopeFix.futureExecutionMayProceedWithTypeBoundary === true, 'future execution handoff missing')
assert(scopeFix.scopeFix.stateChangeExecutedToday === false, 'scope fix must not execute state change')
assert(scopeFix.scopeFix.externalBetaUnlockApprovedToday === false, 'scope fix must not approve unlock today')
assertSupabaseNoop(scopeFix.supabaseClassification, 'scopeFix')

const typeBoundary = parsed.typeBoundary.typeBoundary
assert(typeBoundary.path === TYPE_FILE, 'type boundary path mismatch')
assert(typeBoundary.currentConstraint.includes('literal false'), 'literal false constraint missing')
assert(typeBoundary.runtimeReadinessFieldChangeAllowed === false, 'runtime type widening must be false')
assert(typeBoundary.realUserMediaBetaTypeChangeAllowed === false, 'real-user beta type widening must be false')
assert(typeBoundary.paidProductionTypeChangeAllowed === false, 'paid production type widening must be false')
assert(parsed.typeBoundary.typeBoundaryConclusion.typeBoundaryRequired === true, 'type boundary requirement missing')
assert(parsed.typeBoundary.typeBoundaryConclusion.typeBoundaryAddedToFutureScope === true, 'type boundary scope missing')

const exactScope = parsed.exactScope
assert(exactScope.allowedFutureExecutionFiles.includes(TYPE_FILE), 'future execution scope missing type file')
for (const required of [
  'server/beta-readiness/beta-go-no-go-policy.ts',
  'server/beta-readiness/beta-readiness-report-builder.ts',
  'server/beta-readiness/beta-readiness-checklist.ts',
  'server/smoke/beta-readiness-smoke.ts'
]) {
  assert(exactScope.allowedFutureExecutionFiles.includes(required), `future execution scope missing ${required}`)
}
assert(exactScope.futureBoundaryRequirements.externalBetaScorecardMayChange === true, 'external beta scorecard boundary missing')
assert(exactScope.futureBoundaryRequirements.realUserMediaBetaMustRemainFalse === true, 'real-user beta boundary missing')
assert(exactScope.futureBoundaryRequirements.paidProductionMustRemainFalse === true, 'paid production boundary missing')
assert(exactScope.futureBoundaryRequirements.productionReadyMustRemainFalse === true, 'production boundary missing')
assert(exactScope.futureBoundaryRequirements.runtimeExecutionMustRemainBlocked === true, 'runtime boundary missing')
assert(exactScope.futureBoundaryRequirements.supabaseSqlMustRemainNoop === true, 'Supabase boundary missing')
assert(exactScope.exactScopeConclusion.scopeCorrected === true, 'scope corrected flag missing')
assert(exactScope.exactScopeConclusion.stateChangeExecutedToday === false, 'exact scope must not execute state change')

const claim = parsed.claimPolicy
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `claim ${key} must be false`)
}
assertSupabaseNoop(claim.supabaseClassification, 'claimPolicy')

const prompt = read(PROMPT)
assert(
  prompt.includes(DECISION) || prompt.includes(CONSUMER_SCOPE_DECISION),
  'execution prompt must require scope-fix or consumer-scope decision'
)
assert(prompt.includes(TYPE_FILE), 'execution prompt missing type file')
assert(prompt.includes('no runtime/no production'), 'execution prompt missing no runtime/no production scope')
assert(prompt.includes('No runtime execution'), 'execution prompt missing forbidden runtime statement')

const typeText = read(TYPE_FILE)
assert(typeText.includes('externalBetaAllowed: false'), 'current type boundary no longer matches expected pre-execution constraint')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceCommit: SOURCE_COMMIT,
      typeBoundaryIncluded: true,
      stateChangeExecutedToday: false,
      futureExecutionMayProceed: true
    },
    null,
    2
  )
)
