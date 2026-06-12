import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_EXPECTED_REPORTS,
  PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REPORT_DIR,
  buildProductInternalTestingLaunchRehearsalReports,
} from '../activation/product-internal-testing-launch-rehearsal'

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
  'activation:product-internal-testing-launch-rehearsal:plan',
  'activation:product-internal-testing-launch-rehearsal',
  'activation:product-internal-testing-launch-rehearsal:report',
  'activation:product-internal-testing-launch-rehearsal:summary',
  'smoke:activation-product-internal-testing-launch-rehearsal',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/product-internal-testing-launch-rehearsal/index.ts'), 'Launch rehearsal module missing.')
assert(!existsSync('server/workers/product-internal-testing-launch-rehearsal'), 'Launch rehearsal phase must not add a worker.')
assert(existsSync(PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REPORT_DIR), 'Launch rehearsal report dir missing.')
for (const report of PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_EXPECTED_REPORTS) {
  assert(existsSync(path.join(PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/product-restricted-internal-testing-launch-rehearsal.md',
  'docs/restricted-internal-testing-tester-flow.md',
  'docs/restricted-internal-testing-issue-intake.md',
  'docs/restricted-internal-testing-stop-conditions.md',
  'docs/restricted-internal-testing-launch-rehearsal-checklist.md',
  'docs/restricted-internal-testing-launch-rehearsal-decision.md',
  'docs/implementation-prompts/prompt-product-restricted-internal-testing-start-gate.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildProductInternalTestingLaunchRehearsalReports()
const validation = reports.scopeSignoffValidation as {
  status?: string
  operatorAcceptanceExists?: boolean
  signoffApproved?: boolean
  allowedScopeUnchanged?: boolean
  blockedScopeUnchanged?: boolean
  noUnlockIntroduced?: boolean
  trackBCleanStagingSyncCompleted?: boolean
  runtimeExecution?: boolean
  providerCalls?: boolean
  publicArtifacts?: boolean
  production?: boolean
  supabaseWrites?: boolean
  secretsPrintedOrCommitted?: boolean
}
assert(validation.status === 'passed', 'Scope/signoff validation must pass.')
assert(validation.operatorAcceptanceExists === true, 'Operator acceptance must exist.')
assert(validation.signoffApproved === true, 'PR #302 signoff must be approved.')
assert(validation.allowedScopeUnchanged === true, 'Allowed scope must remain unchanged.')
assert(validation.blockedScopeUnchanged === true, 'Blocked scope must remain unchanged.')
assert(validation.noUnlockIntroduced === true, 'No blocked scope may be unlocked.')
assert(validation.trackBCleanStagingSyncCompleted === true, 'Track B clean-staging sync must be completed.')
assert(validation.runtimeExecution === false, 'Runtime execution must stay blocked.')
assert(validation.providerCalls === false, 'Provider calls must stay blocked.')
assert(validation.publicArtifacts === false, 'Public artifacts must stay blocked.')
assert(validation.production === false, 'Production must stay blocked.')
assert(validation.supabaseWrites === false, 'Supabase writes must stay blocked.')
assert(validation.secretsPrintedOrCommitted === false, 'Secrets must not be printed or committed.')

const testerFlow = reports.testerFlow as {
  status?: string
  testerFlowSteps?: unknown[]
  runtimeExecution?: boolean
  providerCalls?: boolean
  publicArtifacts?: boolean
  production?: boolean
  supabaseWrites?: boolean
}
assert(testerFlow.status === 'rehearsed', 'Tester flow must be rehearsed.')
assert(Array.isArray(testerFlow.testerFlowSteps) && testerFlow.testerFlowSteps.length >= 6, 'Tester flow steps missing.')
assert(testerFlow.runtimeExecution === false, 'Tester flow must not execute runtime.')
assert(testerFlow.providerCalls === false, 'Tester flow must not call providers.')
assert(testerFlow.publicArtifacts === false, 'Tester flow must not create public artifacts.')
assert(testerFlow.production === false, 'Tester flow must not touch production.')
assert(testerFlow.supabaseWrites === false, 'Tester flow must not write Supabase.')

const issueIntake = reports.issueIntake as { status?: string; blockerCategories?: unknown[] }
assert(issueIntake.status === 'ready', 'Issue intake must be ready.')
for (const category of [
  'supabase_milestone_sync_issue',
  'track_b_readiness_issue',
  'security_or_secret_exposure_issue',
  'runtime_provider_tool_worker_route_execution_attempt',
]) {
  assert(Array.isArray(issueIntake.blockerCategories) && issueIntake.blockerCategories.includes(category), `Issue intake missing ${category}.`)
}

const stopConditions = reports.stopConditions as { status?: string; stopConditions?: unknown[] }
assert(stopConditions.status === 'ready', 'Stop conditions must be ready.')
for (const condition of [
  'any_secret_exposure',
  'any_production_write',
  'any_external_beta_exposure',
  'any_public_artifact',
  'any_signed_url_source_of_truth_use',
  'any_raw_prompt_execution_as_worker_input',
  'any_provider_call',
  'any_worker_tool_runtime_execution_outside_scope',
  'any_supabase_production_mutation',
  'any_broad_media_processing',
]) {
  assert(Array.isArray(stopConditions.stopConditions) && stopConditions.stopConditions.includes(condition), `Stop conditions missing ${condition}.`)
}

const checklist = reports.checklist as { status?: string; checks?: Array<{ id?: string; passed?: boolean }> }
assert(checklist.status === 'passed', 'Launch rehearsal checklist must pass.')
assert(Array.isArray(checklist.checks) && checklist.checks.every((entry) => entry.passed === true), 'Every checklist item must pass.')

const decision = reports.decision as {
  decision?: string
  status?: string
  internalTestingExecutionStarted?: boolean
  externalBetaAllowed?: boolean
  paidProductionAllowed?: boolean
  productionAllowed?: boolean
  publicArtifactsAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  providerCallsAllowed?: boolean
  supabaseWritesAllowedInThisPhase?: boolean
}
assert(decision.decision === 'restricted_internal_testing_launch_rehearsal_passed', 'Expected launch rehearsal passed decision.')
assert(decision.status === 'passed', 'Decision status must pass.')
assert(decision.internalTestingExecutionStarted === false, 'Launch rehearsal must not start internal testing.')
assert(decision.externalBetaAllowed === false, 'External beta must stay blocked.')
assert(decision.paidProductionAllowed === false, 'Paid production must stay blocked.')
assert(decision.productionAllowed === false, 'Production must stay blocked.')
assert(decision.publicArtifactsAllowed === false, 'Public artifacts must stay blocked.')
assert(decision.runtimeExecutionAllowed === false, 'Runtime execution must stay blocked.')
assert(decision.providerCallsAllowed === false, 'Provider calls must stay blocked.')
assert(decision.supabaseWritesAllowedInThisPhase === false, 'Supabase writes must stay blocked.')

const corpus = [
  ...readAllFiles('server/activation/product-internal-testing-launch-rehearsal'),
  ...readAllFiles(PRODUCT_INTERNAL_TESTING_LAUNCH_REHEARSAL_REPORT_DIR),
  ...[
    'docs/product-restricted-internal-testing-launch-rehearsal.md',
    'docs/restricted-internal-testing-tester-flow.md',
    'docs/restricted-internal-testing-issue-intake.md',
    'docs/restricted-internal-testing-stop-conditions.md',
    'docs/restricted-internal-testing-launch-rehearsal-checklist.md',
    'docs/restricted-internal-testing-launch-rehearsal-decision.md',
    'docs/implementation-prompts/prompt-product-restricted-internal-testing-start-gate.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
    'REEDITPRO_CONFIRM_INTERNAL_TESTING_EXECUTION=true',
    'REEDITPRO_CONFIRM_PRODUCT_INTERNAL_BETA_UNLOCK=true',
    'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK=true',
    'REEDITPRO_CONFIRM_PAID_PRODUCTION_UNLOCK=true',
    'REEDITPRO_CONFIRM_PRODUCTION_WRITE=true',
    'REEDITPRO_CONFIRM_PROVIDER_CALLS=true',
    'REEDITPRO_CONFIRM_TOOL_ROUTE_EXECUTION=true',
    'REEDITPRO_CONFIRM_WORKER_EXECUTION=true',
    'REEDITPRO_CONFIRM_TRACK_A_RUNTIME=true',
    'REEDITPRO_CONFIRM_PUBLIC_ARTIFACTS=true',
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
  phase: 'product-internal-testing-launch-rehearsal',
  decision: decision.decision,
  scopeValidation: validation.status,
  testerFlow: testerFlow.status,
  issueIntake: issueIntake.status,
  stopConditions: stopConditions.status,
  checklist: checklist.status,
  productionAffected: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  runtimeExecution: false,
  secretsPrintedOrCommitted: false,
}, null, 2))
