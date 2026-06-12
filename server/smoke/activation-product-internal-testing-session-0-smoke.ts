import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  PRODUCT_INTERNAL_TESTING_SESSION_0_EXPECTED_REPORTS,
  PRODUCT_INTERNAL_TESTING_SESSION_0_REPORT_DIR,
  buildProductInternalTestingSession0Reports,
} from '../activation/product-internal-testing-session-0'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readAllFiles(dir: string): Array<{ file: string; text: string }> {
  const files: Array<{ file: string; text: string }> = []
  if (!existsSync(dir)) return files
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (statSync(fullPath).isDirectory()) files.push(...readAllFiles(fullPath))
    else files.push({ file: fullPath, text: readFileSync(fullPath, 'utf8') })
  }
  return files
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of [
  'activation:product-internal-testing-session-0:plan',
  'activation:product-internal-testing-session-0',
  'activation:product-internal-testing-session-0:report',
  'activation:product-internal-testing-session-0:summary',
  'smoke:activation-product-internal-testing-session-0',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/product-internal-testing-session-0/index.ts'), 'Session 0 module missing.')
assert(!existsSync('server/workers/product-internal-testing-session-0'), 'Session 0 phase must not add a worker.')
assert(existsSync(PRODUCT_INTERNAL_TESTING_SESSION_0_REPORT_DIR), 'Session 0 report dir missing.')
for (const report of PRODUCT_INTERNAL_TESTING_SESSION_0_EXPECTED_REPORTS) {
  assert(existsSync(path.join(PRODUCT_INTERNAL_TESTING_SESSION_0_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/product-restricted-internal-testing-session-0.md',
  'docs/restricted-internal-testing-session-0-checklist.md',
  'docs/restricted-internal-testing-session-0-issue-intake.md',
  'docs/restricted-internal-testing-session-0-decision.md',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/implementation-prompts/prompt-product-restricted-internal-testing-session-1.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildProductInternalTestingSession0Reports()
const scope = reports.scopeValidation as {
  status?: string
  startGateApproved?: boolean
  priorStartGateSession0Started?: boolean
  launchRehearsalPassed?: boolean
  scopeFreezeAccepted?: boolean
  betaCandidate?: boolean
  trackBCleanStagingSyncCompleted?: boolean
  trackBRowsVerified?: number
  canonicalTrackBToolsVerified?: number
  noScopeDrift?: boolean
  noUnlockIntroduced?: boolean
  noSecretsIntroduced?: boolean
  runtimeExecution?: boolean
  providerCalls?: boolean
  publicArtifacts?: boolean
  production?: boolean
  externalBeta?: boolean
  paidProduction?: boolean
  supabaseWrites?: boolean
}
assert(scope.status === 'passed', 'Scope validation must pass.')
assert(scope.startGateApproved === true, 'PR #309 start gate must be approved.')
assert(scope.priorStartGateSession0Started === false, 'PR #309 must show Session 0 was not previously started.')
assert(scope.launchRehearsalPassed === true, 'PR #306 launch rehearsal must pass.')
assert(scope.scopeFreezeAccepted === true, 'PR #302 scope freeze must be accepted.')
assert(scope.betaCandidate === true, 'PR #299 candidate status must pass.')
assert(scope.trackBCleanStagingSyncCompleted === true, 'Track B clean-staging sync must be completed.')
assert(scope.trackBRowsVerified === 259, 'Expected 259 clean-staging registry rows.')
assert(scope.canonicalTrackBToolsVerified === 18, 'Expected 18 canonical Track B tools.')
assert(scope.noScopeDrift === true, 'Scope drift must be absent.')
assert(scope.noUnlockIntroduced === true, 'Blocked scopes must remain blocked.')
assert(scope.noSecretsIntroduced === true, 'Secret policy evidence must pass.')
assert(scope.runtimeExecution === false, 'Runtime execution must stay blocked.')
assert(scope.providerCalls === false, 'Provider calls must stay blocked.')
assert(scope.publicArtifacts === false, 'Public artifacts must stay blocked.')
assert(scope.production === false, 'Production must stay blocked.')
assert(scope.externalBeta === false, 'External beta must stay blocked.')
assert(scope.paidProduction === false, 'Paid production must stay blocked.')
assert(scope.supabaseWrites === false, 'Supabase writes must stay blocked.')

const checklist = reports.reviewChecklist as { status?: string; checks?: Array<{ id?: string; passed?: boolean }> }
assert(checklist.status === 'passed', 'Session 0 checklist must pass.')
assert(Array.isArray(checklist.checks) && checklist.checks.length >= 14, 'Session 0 checklist is incomplete.')
assert(checklist.checks.every((entry) => entry.passed === true), 'Every Session 0 checklist item must pass.')

const trackB = reports.trackBReadinessReview as {
  status?: string
  canonicalToolCount?: number
  restrictedInternalReadyToolCount?: number
  blockedExcludedRuntimeLanes?: unknown[]
  demucsRuntimeBlocked?: boolean
  qwenVlmRuntimeBlocked?: boolean
  vllmRuntimeBlocked?: boolean
  noRuntimeExecution?: boolean
  noWorkerExecution?: boolean
  noProviderCalls?: boolean
}
assert(trackB.status === 'passed', 'Track B readiness review must pass.')
assert(trackB.canonicalToolCount === 18, 'Track B readiness review must cover 18 canonical tools.')
assert((trackB.restrictedInternalReadyToolCount ?? 0) >= 15, 'Track B restricted-internal-ready tool count is too low.')
assert(Array.isArray(trackB.blockedExcludedRuntimeLanes) && trackB.blockedExcludedRuntimeLanes.length === 3, 'Blocked runtime lanes must include Demucs, Qwen/VLM, and vLLM.')
assert(trackB.demucsRuntimeBlocked === true, 'Demucs runtime must stay blocked.')
assert(trackB.qwenVlmRuntimeBlocked === true, 'Qwen/VLM runtime must stay blocked.')
assert(trackB.vllmRuntimeBlocked === true, 'vLLM runtime must stay blocked.')
assert(trackB.noRuntimeExecution === true, 'Track B review must not execute runtime.')
assert(trackB.noWorkerExecution === true, 'Track B review must not execute workers.')
assert(trackB.noProviderCalls === true, 'Track B review must not call providers.')

const issues = reports.issueIntakeReport as {
  status?: string
  activeIssueCount?: number
  issueCategories?: unknown[]
  runtimeExecutionAllowed?: boolean
  providerCallsAllowed?: boolean
  publicArtifactsAllowed?: boolean
  productionAllowed?: boolean
}
assert(issues.status === 'no_session_0_issues_found', 'Expected no Session 0 issues.')
assert(issues.activeIssueCount === 0, 'Session 0 issue count must be zero.')
assert(Array.isArray(issues.issueCategories) && issues.issueCategories.length === 8, 'Issue categories missing.')
assert(issues.runtimeExecutionAllowed === false, 'Issue intake must not allow runtime execution.')
assert(issues.providerCallsAllowed === false, 'Issue intake must not allow provider calls.')
assert(issues.publicArtifactsAllowed === false, 'Issue intake must not allow public artifacts.')
assert(issues.productionAllowed === false, 'Issue intake must not allow production.')

const stops = reports.stopConditionCheck as {
  status?: string
  noStopConditionsOccurred?: boolean
  stopConditions?: Array<{ id?: string; occurred?: boolean }>
  runtimeExecution?: boolean
  providerCalls?: boolean
  publicArtifacts?: boolean
  production?: boolean
  supabaseWrites?: boolean
}
assert(stops.status === 'passed', 'Stop-condition check must pass.')
assert(stops.noStopConditionsOccurred === true, 'No stop condition may occur.')
assert(Array.isArray(stops.stopConditions) && stops.stopConditions.length === 10, 'Stop-condition list is incomplete.')
assert(stops.stopConditions.every((entry) => entry.occurred === false), 'Every stop condition must be false.')
assert(stops.runtimeExecution === false, 'Stop check must not allow runtime execution.')
assert(stops.providerCalls === false, 'Stop check must not allow provider calls.')
assert(stops.publicArtifacts === false, 'Stop check must not allow public artifacts.')
assert(stops.production === false, 'Stop check must not allow production.')
assert(stops.supabaseWrites === false, 'Stop check must not allow Supabase writes.')

const decision = reports.decision as {
  decision?: string
  status?: string
  session0Started?: boolean
  session0Passed?: boolean
  internalTestingExecutionStarted?: boolean
  externalBetaAllowed?: boolean
  paidProductionAllowed?: boolean
  productionAllowed?: boolean
  publicArtifactsAllowed?: boolean
  signedUrlSourceOfTruthAllowed?: boolean
  rawPromptExecutionAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  providerCallsAllowed?: boolean
  supabaseWritesAllowedInThisPhase?: boolean
}
if (decision.session0Started === true) {
  assert(decision.decision === 'restricted_internal_testing_session_0_passed', 'Started Session 0 must pass.')
  assert(decision.status === 'passed', 'Started Session 0 decision status must pass.')
  assert(decision.session0Passed === true, 'Started Session 0 must be marked passed.')
} else {
  assert(decision.decision === 'blocked_pending_session_0_issue_review', 'Pre-execution Session 0 must remain safely blocked.')
  assert(decision.status === 'blocked', 'Pre-execution Session 0 status must be blocked.')
}
assert(decision.internalTestingExecutionStarted === false, 'Session 0 must not start runtime internal testing.')
assert(decision.externalBetaAllowed === false, 'External beta must stay blocked.')
assert(decision.paidProductionAllowed === false, 'Paid production must stay blocked.')
assert(decision.productionAllowed === false, 'Production must stay blocked.')
assert(decision.publicArtifactsAllowed === false, 'Public artifacts must stay blocked.')
assert(decision.signedUrlSourceOfTruthAllowed === false, 'Signed URL source-of-truth must stay blocked.')
assert(decision.rawPromptExecutionAllowed === false, 'Raw prompt execution must stay blocked.')
assert(decision.runtimeExecutionAllowed === false, 'Runtime execution must stay blocked.')
assert(decision.providerCallsAllowed === false, 'Provider calls must stay blocked.')
assert(decision.supabaseWritesAllowedInThisPhase === false, 'Supabase writes must stay blocked.')

const corpus = [
  ...readAllFiles('server/activation/product-internal-testing-session-0'),
  ...readAllFiles(PRODUCT_INTERNAL_TESTING_SESSION_0_REPORT_DIR),
  ...[
    'docs/product-restricted-internal-testing-session-0.md',
    'docs/restricted-internal-testing-session-0-checklist.md',
    'docs/restricted-internal-testing-session-0-issue-intake.md',
    'docs/restricted-internal-testing-session-0-decision.md',
    'docs/beta-readiness-scorecard.md',
    'docs/production-beta-blocker-inventory.md',
    'docs/implementation-prompts/prompt-product-restricted-internal-testing-session-1.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
    'REEDITPRO_CONFIRM_INTERNAL_TESTING_RUNTIME_EXECUTION=true',
    'REEDITPRO_CONFIRM_PRODUCT_INTERNAL_BETA_UNLOCK=true',
    'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK=true',
    'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK=true',
    'REEDITPRO_CONFIRM_PRODUCTION_WRITE=true',
    'REEDITPRO_CONFIRM_PROVIDER_CALLS=true',
    'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION=true',
    'REEDITPRO_CONFIRM_WORKER_EXECUTION=true',
    'REEDITPRO_CONFIRM_TRACK_A_RUNTIME=true',
    'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS=true',
    'REEDITPRO_CONFIRM_SUPABASE_METADATA_WRITE=true',
    'supabase db push --db-url',
    'supabase db reset',
    'supabase migration repair',
    'from "../track-a',
    "from '../track-a",
  ]) {
    assert(!text.includes(forbidden), `Forbidden path found in ${file}: ${forbidden}`)
  }
}

const reportDocText = corpus.map(({ text }) => text).join('\n')
for (const forbidden of [
  ['postgres', '://'].join(''),
  ['postgresql', '://'].join(''),
  ['BEGIN', 'PRIVATE KEY'].join(' '),
  ['x-goog-signature', '='].join(''),
  ['service_role_key', '='].join(''),
  ['anon_key', '='].join(''),
  ['access_token', '='].join(''),
  ['jwt_secret', '='].join(''),
  'sbp_',
  ['"secret', 'Value"'].join(''),
  ['"private', 'Payload"'].join(''),
  ['"signed', 'Url"'].join(''),
]) {
  assert(!reportDocText.includes(forbidden), `Reports/docs contain forbidden payload pattern: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'product-internal-testing-session-0',
  decision: decision.decision,
  session0Started: decision.session0Started === true,
  scopeValidation: scope.status,
  reviewChecklist: checklist.status,
  trackBReadinessReview: trackB.status,
  issueIntake: issues.status,
  stopConditionCheck: stops.status,
  runtimeExecution: false,
  providerCalls: false,
  publicArtifacts: false,
  productionAffected: false,
  supabaseWrites: false,
  secretsPrintedOrCommitted: false,
}, null, 2))
