import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_EXPECTED_REPORTS,
  PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REPORT_DIR,
  buildProductInternalTestingScopeFreezeReports,
} from '../activation/product-internal-testing-scope-freeze'

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
  'activation:product-internal-testing-scope-freeze:plan',
  'activation:product-internal-testing-scope-freeze',
  'activation:product-internal-testing-scope-freeze:report',
  'activation:product-internal-testing-scope-freeze:summary',
  'smoke:activation-product-internal-testing-scope-freeze',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/product-internal-testing-scope-freeze/index.ts'), 'Scope-freeze module missing.')
assert(!existsSync('server/workers/product-internal-testing-scope-freeze'), 'Scope-freeze phase must not add a worker.')
assert(existsSync(PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REPORT_DIR), 'Scope-freeze report dir missing.')
for (const report of PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_EXPECTED_REPORTS) {
  assert(existsSync(path.join(PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/product-internal-testing-scope-freeze.md',
  'docs/internal-testing-allowed-scope-freeze.md',
  'docs/internal-testing-blocked-scope-freeze.md',
  'docs/internal-testing-operator-signoff-packet.md',
  'docs/internal-testing-operator-acceptance.md',
  'docs/internal-testing-runbook-checklist.md',
  'docs/internal-testing-scope-freeze-decision.md',
  'docs/implementation-prompts/prompt-product-restricted-internal-testing-launch-rehearsal.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildProductInternalTestingScopeFreezeReports()
const allowed = reports.allowedScopeFreeze as {
  status?: string
  allowedScope?: unknown[]
  runtimeExecutionAllowed?: boolean
  providerCallsAllowed?: boolean
  publicArtifactsAllowed?: boolean
  productionAllowed?: boolean
  supabaseWritesAllowed?: boolean
}
assert(allowed.status === 'frozen', 'Allowed scope must be frozen.')
assert(Array.isArray(allowed.allowedScope) && allowed.allowedScope.length >= 9, 'Allowed scope must include the expected restricted evidence-review entries.')
assert(allowed.runtimeExecutionAllowed === false, 'Runtime execution must stay blocked.')
assert(allowed.providerCallsAllowed === false, 'Provider calls must stay blocked.')
assert(allowed.publicArtifactsAllowed === false, 'Public artifacts must stay blocked.')
assert(allowed.productionAllowed === false, 'Production must stay blocked.')
assert(allowed.supabaseWritesAllowed === false, 'Supabase writes must stay blocked.')

const blocked = reports.blockedScopeFreeze as {
  status?: string
  blockedScope?: unknown[]
  productionBlocked?: boolean
  externalBetaBlocked?: boolean
  paidProductionBlocked?: boolean
  runtimeExecutionBlocked?: boolean
  providerCallsBlocked?: boolean
  publicArtifactsBlocked?: boolean
  supabaseProductionWritesBlocked?: boolean
}
assert(blocked.status === 'frozen', 'Blocked scope must be frozen.')
for (const required of ['production', 'external_beta', 'paid_production', 'public_artifacts', 'provider_calls', 'direct_supabase_production_writes']) {
  assert(Array.isArray(blocked.blockedScope) && blocked.blockedScope.includes(required), `Blocked scope missing ${required}.`)
}
assert(blocked.productionBlocked === true, 'Production must remain blocked.')
assert(blocked.externalBetaBlocked === true, 'External beta must remain blocked.')
assert(blocked.paidProductionBlocked === true, 'Paid production must remain blocked.')
assert(blocked.runtimeExecutionBlocked === true, 'Runtime execution must remain blocked.')
assert(blocked.providerCallsBlocked === true, 'Provider calls must remain blocked.')
assert(blocked.publicArtifactsBlocked === true, 'Public artifacts must remain blocked.')
assert(blocked.supabaseProductionWritesBlocked === true, 'Supabase production writes must remain blocked.')

const signoff = reports.operatorSignoffPacket as {
  decisionCandidateFromPr299?: string
  trackBCleanStagingSyncStatus?: string
  signoffPresent?: boolean
  signoffSource?: string
  internalTestingExecutionStarted?: boolean
  productionAffected?: boolean
  supabaseWrites?: boolean
  secretsPrintedOrCommitted?: boolean
}
assert(signoff.decisionCandidateFromPr299 === 'restricted_internal_testing_candidate', 'PR #299 decision candidate must be loaded.')
assert(signoff.trackBCleanStagingSyncStatus === 'completed', 'Track B clean-staging sync must be completed.')
assert(signoff.internalTestingExecutionStarted === false, 'Internal testing execution must not start.')
assert(signoff.productionAffected === false, 'Production must not be affected.')
assert(signoff.supabaseWrites === false, 'Supabase writes must not run.')
assert(signoff.secretsPrintedOrCommitted === false, 'Secrets must not be printed or committed.')

const acceptanceArtifact = reports.operatorAcceptanceArtifact as {
  status?: string
  acceptedByRole?: string
  acceptedScope?: string
  productionExcluded?: boolean
  externalBetaExcluded?: boolean
  paidProductionExcluded?: boolean
  publicArtifactsExcluded?: boolean
  rawPromptExecutionExcluded?: boolean
  signedUrlsAsSourceOfTruthExcluded?: boolean
  runtimeToolWorkerProviderExecutionExcluded?: boolean
  supabaseWritesExcludedInThisPhase?: boolean
  internalTestingExecutionStarted?: boolean
  productionAffected?: boolean
  supabaseWrites?: boolean
  secretValuesIncluded?: boolean
  secretsPrintedOrCommitted?: boolean
}
const acceptanceValidation = reports.operatorAcceptanceScopeValidation as {
  status?: string
  acceptanceArtifactPresent?: boolean
  acceptedScopeMatchesFrozenScope?: boolean
  blockedScopeUnchanged?: boolean
  noUnlockIntroduced?: boolean
  internalTestingExecutionStarted?: boolean
  productionAffected?: boolean
  supabaseWrites?: boolean
  secretsPrintedOrCommitted?: boolean
}
assert(['approved', 'missing_operator_acceptance'].includes(String(acceptanceArtifact.status)), 'Acceptance artifact status must be explicit.')
assert(acceptanceArtifact.productionExcluded === true, 'Operator acceptance must exclude production.')
assert(acceptanceArtifact.externalBetaExcluded === true, 'Operator acceptance must exclude external beta.')
assert(acceptanceArtifact.paidProductionExcluded === true, 'Operator acceptance must exclude paid production.')
assert(acceptanceArtifact.publicArtifactsExcluded === true, 'Operator acceptance must exclude public artifacts.')
assert(acceptanceArtifact.rawPromptExecutionExcluded === true, 'Operator acceptance must exclude raw prompt execution.')
assert(acceptanceArtifact.signedUrlsAsSourceOfTruthExcluded === true, 'Operator acceptance must exclude signed URL source of truth.')
assert(acceptanceArtifact.runtimeToolWorkerProviderExecutionExcluded === true, 'Operator acceptance must exclude runtime/tool/worker/provider execution.')
assert(acceptanceArtifact.supabaseWritesExcludedInThisPhase === true, 'Operator acceptance must exclude Supabase writes in this phase.')
assert(acceptanceArtifact.internalTestingExecutionStarted === false, 'Acceptance artifact must not start internal testing.')
assert(acceptanceArtifact.productionAffected === false, 'Acceptance artifact must not affect production.')
assert(acceptanceArtifact.supabaseWrites === false, 'Acceptance artifact must not run Supabase writes.')
assert(acceptanceArtifact.secretValuesIncluded === false, 'Acceptance artifact must not include secret values.')
assert(acceptanceArtifact.secretsPrintedOrCommitted === false, 'Acceptance artifact must not print or commit secrets.')
assert(acceptanceValidation.internalTestingExecutionStarted === false, 'Acceptance validation must not start internal testing.')
assert(acceptanceValidation.productionAffected === false, 'Acceptance validation must not affect production.')
assert(acceptanceValidation.supabaseWrites === false, 'Acceptance validation must not run Supabase writes.')
assert(acceptanceValidation.secretsPrintedOrCommitted === false, 'Acceptance validation must not print or commit secrets.')

const decision = reports.decision as {
  decision?: string
  status?: string
  approvedForFutureRestrictedInternalTestingLaunchRehearsal?: boolean
  operatorSignoffPresent?: boolean
  externalBetaAllowed?: boolean
  paidProductionAllowed?: boolean
  productionAllowed?: boolean
  publicArtifactsAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  providerCallsAllowed?: boolean
  supabaseWritesAllowedInThisPhase?: boolean
}
if (decision.decision === 'approved_for_future_restricted_internal_testing_launch_rehearsal') {
  assert(decision.status === 'passed', 'Approved decision must have passed status.')
  assert(decision.approvedForFutureRestrictedInternalTestingLaunchRehearsal === true, 'Approved decision must set future rehearsal approval.')
  assert(decision.operatorSignoffPresent === true, 'Approved decision requires operator signoff.')
  assert(signoff.signoffPresent === true, 'Approved decision requires signoff packet to record signoff.')
  assert(signoff.signoffSource === 'pasted_prompt_operator_acceptance', 'Approved signoff must come from the repo-safe prompt acceptance artifact.')
  assert(acceptanceArtifact.status === 'approved', 'Approved decision requires approved acceptance artifact.')
  assert(acceptanceArtifact.acceptedByRole === 'operator/product_owner', 'Approved acceptance must record operator/product owner role.')
  assert(acceptanceArtifact.acceptedScope === 'restricted_internal_testing_metadata_readiness_review', 'Approved acceptance must record restricted metadata/readiness scope.')
  assert(acceptanceValidation.status === 'passed', 'Approved decision requires passed acceptance validation.')
  assert(acceptanceValidation.acceptanceArtifactPresent === true, 'Approved decision requires acceptance artifact.')
  assert(acceptanceValidation.acceptedScopeMatchesFrozenScope === true, 'Approved decision requires accepted scope to match frozen scope.')
  assert(acceptanceValidation.blockedScopeUnchanged === true, 'Approved decision requires blocked scope to remain unchanged.')
  assert(acceptanceValidation.noUnlockIntroduced === true, 'Approved decision must not introduce an unlock.')
} else {
  assert(decision.decision === 'blocked_pending_operator_signoff', 'Decision must block pending operator signoff until acceptance is recorded.')
  assert(decision.operatorSignoffPresent === false, 'Blocked decision must not record operator signoff.')
  assert(signoff.signoffPresent === false, 'Blocked decision must not record signoff in packet.')
}
assert(decision.externalBetaAllowed === false, 'External beta must stay blocked.')
assert(decision.paidProductionAllowed === false, 'Paid production must stay blocked.')
assert(decision.productionAllowed === false, 'Production must stay blocked.')
assert(decision.publicArtifactsAllowed === false, 'Public artifacts must stay blocked.')
assert(decision.runtimeExecutionAllowed === false, 'Runtime execution must stay blocked.')
assert(decision.providerCallsAllowed === false, 'Provider calls must stay blocked.')
assert(decision.supabaseWritesAllowedInThisPhase === false, 'Supabase writes must stay blocked.')

const corpus = [
  ...readAllFiles('server/activation/product-internal-testing-scope-freeze'),
  ...readAllFiles(PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REPORT_DIR),
  ...[
    'docs/product-internal-testing-scope-freeze.md',
    'docs/internal-testing-allowed-scope-freeze.md',
    'docs/internal-testing-blocked-scope-freeze.md',
    'docs/internal-testing-operator-signoff-packet.md',
    'docs/internal-testing-operator-acceptance.md',
    'docs/internal-testing-runbook-checklist.md',
    'docs/internal-testing-scope-freeze-decision.md',
    'docs/implementation-prompts/prompt-product-restricted-internal-testing-launch-rehearsal.md',
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

const reportDocText = [
  ...readAllFiles(PRODUCT_INTERNAL_TESTING_SCOPE_FREEZE_REPORT_DIR),
  ...[
    'docs/product-internal-testing-scope-freeze.md',
    'docs/internal-testing-allowed-scope-freeze.md',
    'docs/internal-testing-blocked-scope-freeze.md',
    'docs/internal-testing-operator-signoff-packet.md',
    'docs/internal-testing-operator-acceptance.md',
    'docs/internal-testing-runbook-checklist.md',
    'docs/internal-testing-scope-freeze-decision.md',
    'docs/implementation-prompts/prompt-product-restricted-internal-testing-launch-rehearsal.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
].map(({ text }) => text).join('\n')

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
  phase: 'product-internal-testing-scope-freeze',
  decision: decision.decision,
  allowedScopeFrozen: true,
  blockedScopeFrozen: true,
  signoffPresent: signoff.signoffPresent,
  productionAffected: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  runtimeExecution: false,
  secretsPrintedOrCommitted: false,
}, null, 2))
