import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_bounded_external_beta_consumer_scope_fix_completed_with_warnings_ready_for_bounded_external_beta_state_change_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_bounded_external_beta_state_change_scope_fix_completed_with_warnings_ready_for_bounded_external_beta_state_change_execution'
const SOURCE_COMMIT = 'b056f143b3958e2af74db2dede0bae75830ea354'
const PROMPT =
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-external-beta-state-change-execution-after-plan.md'
const REQUIRED_FILES = [
  'server/cli/beta-readiness-summary.ts',
  'server/smoke/production-hardening-smoke.ts',
  'server/production-hardening/production-beta-readiness-report.ts'
]

const FILES = {
  scopeFix: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-beta-consumer-scope-fix.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-beta-consumer-scope-fix'
  },
  register: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-beta-consumer-scope-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-beta-consumer-scope-register'
  },
  claimPolicy: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-beta-consumer-scope-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-beta-consumer-scope-claim-policy'
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
  assert(doc.sourcePr === 1413, `${label} source PR mismatch`)
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
assert(scopeFix.consumerScopeFix.scopeFixCreated === true, 'scope fix flag missing')
assert(scopeFix.consumerScopeFix.futureExecutionMayProceedWithConsumerScope === true, 'future execution handoff missing')
assert(scopeFix.consumerScopeFix.stateChangeExecutedToday === false, 'state change must not execute today')
assert(scopeFix.consumerScopeFix.externalBetaUnlockApprovedToday === false, 'external beta unlock must remain false today')
assertSupabaseNoop(scopeFix.supabaseClassification, 'scopeFix')

const register = parsed.register
for (const file of REQUIRED_FILES) {
  assert(register.additionalAllowedFutureExecutionFiles.includes(file), `additional future file missing ${file}`)
  assert(register.allAllowedFutureExecutionFiles.includes(file), `all future file missing ${file}`)
}
assert(register.consumerBoundaries.cliMaySayBoundedExternalBetaAllowed === true, 'CLI bounded external beta boundary missing')
assert(register.consumerBoundaries.cliMustSayRealUserMediaBetaBlocked === true, 'CLI real-user beta boundary missing')
assert(register.consumerBoundaries.cliMustSayPaidProductionBlocked === true, 'CLI paid production boundary missing')
assert(register.consumerBoundaries.productionHardeningMustRemainBlocked === true, 'production hardening blocked boundary missing')
assert(register.consumerBoundaries.runtimeExecutionMustRemainBlocked === true, 'runtime boundary missing')
assert(register.consumerBoundaries.supabaseSqlMustRemainNoop === true, 'Supabase boundary missing')
assert(register.consumerScopeConclusion.consumerScopeCorrected === true, 'consumer scope corrected flag missing')
assert(register.consumerScopeConclusion.stateChangeExecutedToday === false, 'consumer state change must be false')

const claim = parsed.claimPolicy
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `claim ${key} must be false`)
}
assertSupabaseNoop(claim.supabaseClassification, 'claimPolicy')

const prompt = read(PROMPT)
assert(prompt.includes(DECISION), 'execution prompt must require consumer scope-fix decision')
for (const file of REQUIRED_FILES) {
  assert(prompt.includes(file), `execution prompt missing ${file}`)
}
assert(prompt.includes('no runtime/no production'), 'execution prompt missing no runtime/no production scope')
assert(prompt.includes('No runtime execution'), 'execution prompt missing forbidden runtime statement')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceCommit: SOURCE_COMMIT,
      consumerScopeIncluded: true,
      stateChangeExecutedToday: false,
      futureExecutionMayProceed: true
    },
    null,
    2
  )
)
