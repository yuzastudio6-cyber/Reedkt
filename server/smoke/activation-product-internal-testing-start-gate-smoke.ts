import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  PRODUCT_INTERNAL_TESTING_START_GATE_EXPECTED_REPORTS,
  PRODUCT_INTERNAL_TESTING_START_GATE_REPORT_DIR,
  buildProductInternalTestingStartGateReports,
} from '../activation/product-internal-testing-start-gate'

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
  'activation:product-internal-testing-start-gate:plan',
  'activation:product-internal-testing-start-gate',
  'activation:product-internal-testing-start-gate:report',
  'activation:product-internal-testing-start-gate:summary',
  'smoke:activation-product-internal-testing-start-gate',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/product-internal-testing-start-gate/index.ts'), 'Start gate module missing.')
assert(!existsSync('server/workers/product-internal-testing-start-gate'), 'Start gate phase must not add a worker.')
assert(existsSync(PRODUCT_INTERNAL_TESTING_START_GATE_REPORT_DIR), 'Start gate report dir missing.')
for (const report of PRODUCT_INTERNAL_TESTING_START_GATE_EXPECTED_REPORTS) {
  assert(existsSync(path.join(PRODUCT_INTERNAL_TESTING_START_GATE_REPORT_DIR, report)), `Missing report: ${report}`)
}

for (const doc of [
  'docs/product-restricted-internal-testing-start-gate.md',
  'docs/restricted-internal-testing-start-packet.md',
  'docs/restricted-internal-testing-start-gate-decision.md',
  'docs/restricted-internal-testing-session-0.md',
  'docs/implementation-prompts/prompt-product-restricted-internal-testing-session-0.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildProductInternalTestingStartGateReports()
const validation = reports.evidenceValidation as {
  status?: string
  rehearsalPassed?: boolean
  scopeSignoffValid?: boolean
  testerFlowReady?: boolean
  issueIntakeReady?: boolean
  stopConditionsReady?: boolean
  checklistPassed?: boolean
  signoffApproved?: boolean
  betaCandidate?: boolean
  trackBCleanStagingSyncCompleted?: boolean
  trackBRowsVerified?: number
  canonicalTrackBToolsVerified?: number
  noScopeDrift?: boolean
  blockedScopesRemainBlocked?: boolean
  internalTestingExecutionStarted?: boolean
  session0Started?: boolean
  runtimeExecution?: boolean
  providerCalls?: boolean
  publicArtifacts?: boolean
  production?: boolean
  externalBeta?: boolean
  paidProduction?: boolean
  supabaseWrites?: boolean
  secretsPrintedOrCommitted?: boolean
}
assert(validation.status === 'passed', 'Evidence validation must pass.')
assert(validation.rehearsalPassed === true, 'PR #306 launch rehearsal must pass.')
assert(validation.scopeSignoffValid === true, 'Scope/signoff validation must pass.')
assert(validation.testerFlowReady === true, 'Tester flow must be ready.')
assert(validation.issueIntakeReady === true, 'Issue intake must be ready.')
assert(validation.stopConditionsReady === true, 'Stop conditions must be ready.')
assert(validation.checklistPassed === true, 'Launch rehearsal checklist must pass.')
assert(validation.signoffApproved === true, 'PR #302 signoff must be approved.')
assert(validation.betaCandidate === true, 'PR #299 candidate status must be present.')
assert(validation.trackBCleanStagingSyncCompleted === true, 'Track B clean-staging sync must be completed.')
assert(validation.trackBRowsVerified === 259, 'Expected 259 clean-staging registry rows.')
assert(validation.canonicalTrackBToolsVerified === 18, 'Expected 18 canonical Track B tools.')
assert(validation.noScopeDrift === true, 'Scope drift must not be present.')
assert(validation.blockedScopesRemainBlocked === true, 'Blocked scopes must remain blocked.')
assert(validation.internalTestingExecutionStarted === false, 'Internal testing execution must not start.')
assert(validation.session0Started === false, 'Session 0 must not start.')
assert(validation.runtimeExecution === false, 'Runtime execution must stay blocked.')
assert(validation.providerCalls === false, 'Provider calls must stay blocked.')
assert(validation.publicArtifacts === false, 'Public artifacts must stay blocked.')
assert(validation.production === false, 'Production must stay blocked.')
assert(validation.externalBeta === false, 'External beta must stay blocked.')
assert(validation.paidProduction === false, 'Paid production must stay blocked.')
assert(validation.supabaseWrites === false, 'Supabase writes must stay blocked.')
assert(validation.secretsPrintedOrCommitted === false, 'Secrets must not be printed or committed.')

const startPacket = reports.startPacket as {
  status?: string
  testerMayDo?: unknown[]
  testerMustNotDo?: unknown[]
  session0Started?: boolean
  internalTestingExecutionStarted?: boolean
  supabaseWrites?: boolean
  runtimeExecution?: boolean
  providerCalls?: boolean
  publicArtifacts?: boolean
  production?: boolean
}
assert(startPacket.status === 'ready', 'Start packet must be ready.')
assert(Array.isArray(startPacket.testerMayDo) && startPacket.testerMayDo.length >= 5, 'Tester may-do actions missing.')
assert(Array.isArray(startPacket.testerMustNotDo) && startPacket.testerMustNotDo.length >= 8, 'Tester must-not actions missing.')
assert(startPacket.session0Started === false, 'Start packet must not start session 0.')
assert(startPacket.internalTestingExecutionStarted === false, 'Start packet must not start testing execution.')
assert(startPacket.supabaseWrites === false, 'Start packet must not allow Supabase writes.')
assert(startPacket.runtimeExecution === false, 'Start packet must not allow runtime execution.')
assert(startPacket.providerCalls === false, 'Start packet must not allow provider calls.')
assert(startPacket.publicArtifacts === false, 'Start packet must not allow public artifacts.')
assert(startPacket.production === false, 'Start packet must not allow production.')

const blockedScope = reports.blockedScopeAssertion as {
  status?: string
  allBlockedScopesPreserved?: boolean
  blockedScopeAssertions?: Record<string, boolean>
  session0Started?: boolean
  runtimeExecution?: boolean
  providerCalls?: boolean
  publicArtifacts?: boolean
  production?: boolean
  supabaseWrites?: boolean
}
assert(blockedScope.status === 'passed', 'Blocked-scope assertion must pass.')
assert(blockedScope.allBlockedScopesPreserved === true, 'All blocked scopes must be preserved.')
for (const [name, value] of Object.entries(blockedScope.blockedScopeAssertions ?? {})) {
  assert(value === true, `Blocked-scope assertion must be true: ${name}`)
}
assert(blockedScope.session0Started === false, 'Blocked-scope assertion must not start session 0.')
assert(blockedScope.runtimeExecution === false, 'Blocked-scope assertion must not allow runtime execution.')
assert(blockedScope.providerCalls === false, 'Blocked-scope assertion must not allow provider calls.')
assert(blockedScope.publicArtifacts === false, 'Blocked-scope assertion must not allow public artifacts.')
assert(blockedScope.production === false, 'Blocked-scope assertion must not allow production.')
assert(blockedScope.supabaseWrites === false, 'Blocked-scope assertion must not allow Supabase writes.')

const decision = reports.decision as {
  decision?: string
  status?: string
  approvedForRestrictedInternalTestingStart?: boolean
  session0Started?: boolean
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
assert(decision.decision === 'approved_for_restricted_internal_testing_start', 'Expected restricted internal testing start approval.')
assert(decision.status === 'passed', 'Start-gate decision must pass.')
assert(decision.approvedForRestrictedInternalTestingStart === true, 'Start gate must be approved.')
assert(decision.session0Started === false, 'Start gate must not start session 0.')
assert(decision.internalTestingExecutionStarted === false, 'Start gate must not start testing execution.')
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
  ...readAllFiles('server/activation/product-internal-testing-start-gate'),
  ...readAllFiles(PRODUCT_INTERNAL_TESTING_START_GATE_REPORT_DIR),
  ...[
    'docs/product-restricted-internal-testing-start-gate.md',
    'docs/restricted-internal-testing-start-packet.md',
    'docs/restricted-internal-testing-start-gate-decision.md',
    'docs/restricted-internal-testing-session-0.md',
    'docs/implementation-prompts/prompt-product-restricted-internal-testing-session-0.md',
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
  phase: 'product-internal-testing-start-gate',
  decision: decision.decision,
  evidenceValidation: validation.status,
  startPacket: startPacket.status,
  blockedScopeAssertion: blockedScope.status,
  session0Started: false,
  internalTestingExecutionStarted: false,
  productionAffected: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  runtimeExecution: false,
  supabaseWrites: false,
  secretsPrintedOrCommitted: false,
}, null, 2))
