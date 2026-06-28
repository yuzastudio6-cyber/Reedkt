import { readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_bounded_external_beta_state_change_execution_completed_with_warnings_bounded_external_beta_scorecard_enabled_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_bounded_external_beta_consumer_scope_fix_completed_with_warnings_ready_for_bounded_external_beta_state_change_execution'
const SOURCE_COMMIT = '49a622fc03f7d1840ee3e6d49cb41fc867857992'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-REAL-USER-MEDIA-BETA-READINESS-AFTER-BOUNDED-EXTERNAL-BETA: plan real-user media beta readiness, no runtime/no production'

const FILES = {
  execution: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-beta-state-change-execution.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-beta-state-change-execution'
  },
  summary: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-beta-summary-evidence.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-beta-summary-evidence'
  },
  blocked: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-beta-blocked-scope-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-beta-blocked-scope-register'
  },
  rollback: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-beta-rollback-register.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-beta-rollback-register'
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-bounded-external-beta-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-bounded-external-beta-claim-policy'
  }
}

const REQUIRED_CODE_FILES = [
  'server/beta-readiness/beta-readiness-types.ts',
  'server/beta-readiness/beta-go-no-go-policy.ts',
  'server/beta-readiness/beta-readiness-report-builder.ts',
  'server/beta-readiness/beta-readiness-checklist.ts',
  'server/cli/beta-readiness-summary.ts',
  'server/smoke/beta-readiness-smoke.ts',
  'server/smoke/production-hardening-smoke.ts',
  'server/production-hardening/production-beta-readiness-report.ts'
]

const FORBIDDEN_STRINGS = [
  '"realUserMediaBetaAllowed": true',
  '"paidProductionAllowed": true',
  '"runtimeExecutionEnabled": true',
  '"workerExecutionEnabled": true',
  '"routeExecutionEnabled": true',
  '"mediaProcessingEnabled": true',
  '"supabaseMutationEnabled": true',
  '"sqlExecutionEnabled": true',
  '"realUserMediaBetaAllowedToday": true',
  '"paidProductionAllowedToday": true',
  '"productionAllowedToday": true',
  '"runtimeExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"modelDownloadApprovedToday": true',
  '"providerModelCallApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseMutationApprovedToday": true',
  '"sqlExecutionApprovedToday": true',
  '"generatedLocalFixturePassedClaimedToday": true',
  '"dryRunPassedClaimedToday": true',
  '"runtimeReadinessClaimedToday": true',
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
  assert(doc.sourcePr === 1415, `${label} source PR mismatch`)
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

const execution = parsed.execution
assert(execution.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(execution.executionResult.stateChangeExecutedToday === true, 'state change execution flag missing')
assert(execution.executionResult.boundedExternalBetaScorecardEnabled === true, 'bounded external beta scorecard missing')
assert(execution.executionResult.externalBetaAllowedInBetaSummary === true, 'external beta summary flag missing')
assert(execution.executionResult.realUserMediaBetaAllowed === false, 'real-user media beta must remain false')
assert(execution.executionResult.paidProductionAllowed === false, 'paid production must remain false')
assert(execution.executionResult.productionReady === false, 'production ready must remain false')
for (const file of REQUIRED_CODE_FILES) {
  assert(execution.changedCodeFiles.includes(file), `changed code file missing ${file}`)
}
assertSupabaseNoop(execution.supabaseClassification, 'execution')

const summary = parsed.summary
assert(summary.expectedBetaSummary.overallStatus === 'warning', 'expected beta status mismatch')
assert(summary.expectedBetaSummary.externalBetaAllowed === true, 'expected external beta summary missing')
assert(summary.expectedBetaSummary.realUserMediaBetaAllowed === false, 'real-user media summary must remain false')
assert(summary.expectedBetaSummary.paidProductionAllowed === false, 'paid production summary must remain false')
assert(summary.expectedProductionReadinessSummary.overallStatus === 'blocked', 'production readiness must remain blocked')
assert(summary.summaryEvidenceConclusion.boundedExternalBetaScorecardExpected === true, 'summary conclusion missing')

const blocked = parsed.blocked
for (const [key, value] of Object.entries(blocked.blockedScopes)) {
  assert(value === true, `blocked scope ${key} must stay true`)
}
assert(blocked.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const rollback = parsed.rollback
for (const file of REQUIRED_CODE_FILES) {
  assert(rollback.rollbackFiles.includes(file), `rollback file missing ${file}`)
}
assert(rollback.rollbackRequiredForSupabase === false, 'Supabase rollback must be false')
assert(rollback.rollbackRequiredForDeployment === false, 'deployment rollback must be false')
assert(rollback.rollbackRequiredForArtifacts === false, 'artifact rollback must be false')

const claim = parsed.claim
assert(claim.allowedClaimsToday.includes('bounded external beta scorecard enabled'), 'allowed bounded claim missing')
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `claim ${key} must be false`)
}
assertSupabaseNoop(claim.supabaseClassification, 'claim')

const types = read('server/beta-readiness/beta-readiness-types.ts')
assert(types.includes('externalBetaAllowed: boolean'), 'externalBetaAllowed type must be boolean')
assert(types.includes('realUserMediaBetaAllowed: false'), 'real-user media beta type must remain false')
assert(types.includes('paidProductionAllowed: false'), 'paid production type must remain false')

const policy = read('server/beta-readiness/beta-go-no-go-policy.ts')
assert(policy.includes('boundedExternalBetaScorecardApproved'), 'policy missing bounded option')
assert(policy.includes('externalBetaAllowed,'), 'policy must return externalBetaAllowed variable')
assert(policy.includes('Real user media beta and paid production remain blocked'), 'policy missing blocked warning')

const cli = read('server/cli/beta-readiness-summary.ts')
assert(cli.includes('Bounded external beta scorecard is allowed'), 'CLI missing bounded external beta wording')
assert(cli.includes('real user media beta and paid production remain blocked'), 'CLI missing blocked scope wording')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceCommit: SOURCE_COMMIT,
      boundedExternalBetaScorecardEnabled: true,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT
    },
    null,
    2
  )
)
