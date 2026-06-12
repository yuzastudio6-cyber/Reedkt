import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  PRODUCT_INTERNAL_BETA_READINESS_EXPECTED_REPORTS,
  PRODUCT_INTERNAL_BETA_READINESS_REPORT_DIR,
  buildProductInternalBetaReadinessReports,
} from '../activation/product-internal-beta-readiness'

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
  'activation:product-internal-beta-readiness:plan',
  'activation:product-internal-beta-readiness',
  'activation:product-internal-beta-readiness:report',
  'activation:product-internal-beta-readiness:summary',
  'smoke:activation-product-internal-beta-readiness',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(existsSync('server/activation/product-internal-beta-readiness/index.ts'), 'Product internal beta readiness module missing.')
assert(!existsSync('server/workers/product-internal-beta-readiness'), 'Product internal beta readiness must not add a worker.')
assert(existsSync(PRODUCT_INTERNAL_BETA_READINESS_REPORT_DIR), 'Product internal beta readiness report dir missing.')
for (const report of PRODUCT_INTERNAL_BETA_READINESS_EXPECTED_REPORTS) {
  assert(existsSync(path.join(PRODUCT_INTERNAL_BETA_READINESS_REPORT_DIR, report)), `Missing report: ${report}`)
}
for (const doc of [
  'docs/product-internal-beta-readiness-aggregation.md',
  'docs/restricted-internal-testing-scope.md',
  'docs/internal-beta-owner-map.md',
  'docs/internal-beta-readiness-decision.md',
  'docs/implementation-prompts/prompt-product-internal-testing-scope-freeze.md',
]) {
  assert(existsSync(doc), `Missing doc: ${doc}`)
}

const reports = buildProductInternalBetaReadinessReports()
const sync = reports.trackBCleanStagingSyncVerification as {
  syncStatus?: string
  targetProjectRef?: string
  recordCount?: number
  rowsVerifiedTotal?: number
  canonicalToolCount?: number
  canonicalToolIdsCovered?: boolean
  productionAffected?: boolean
  brokenOriginalStagingAffected?: boolean
  trackBRuntimeExecution?: boolean
}
assert(sync.syncStatus === 'completed', 'Track B clean staging sync must be completed.')
assert(sync.targetProjectRef === 'fnjiylwirntrqdcwpbho', 'Clean staging target ref must match PR #298 evidence.')
assert(sync.recordCount === 30, 'Track B export record count must be 30.')
assert(sync.rowsVerifiedTotal === 259, 'Track B clean staging rows verified must be 259.')
assert(sync.canonicalToolCount === 18, 'Track B canonical tool count must be 18.')
assert(sync.canonicalToolIdsCovered === true, 'Canonical Track B tools must be covered.')
assert(sync.productionAffected === false, 'Production must remain untouched.')
assert(sync.brokenOriginalStagingAffected === false, 'Broken staging must remain untouched.')
assert(sync.trackBRuntimeExecution === false, 'Track B runtime must not execute.')

const scope = reports.restrictedInternalTestingScope as {
  allowedScope?: unknown[]
  blockedScope?: unknown[]
  externalBetaUnlocked?: boolean
  paidProductionUnlocked?: boolean
  productionAllowed?: boolean
  publicArtifactsAllowed?: boolean
  providerCallsAllowed?: boolean
  workerExecutionAllowed?: boolean
  toolExecutionAllowed?: boolean
  routeExecutionAllowed?: boolean
}
assert(Array.isArray(scope.allowedScope) && scope.allowedScope.length > 0, 'Allowed restricted internal testing scope missing.')
assert(Array.isArray(scope.blockedScope) && scope.blockedScope.includes('production'), 'Blocked scope inventory missing production.')
assert(scope.externalBetaUnlocked === false, 'External beta must stay blocked.')
assert(scope.paidProductionUnlocked === false, 'Paid production must stay blocked.')
assert(scope.productionAllowed === false, 'Production must stay blocked.')
assert(scope.publicArtifactsAllowed === false, 'Public artifacts must stay blocked.')
assert(scope.providerCallsAllowed === false, 'Provider calls must stay blocked.')
assert(scope.workerExecutionAllowed === false, 'Worker execution must stay blocked.')
assert(scope.toolExecutionAllowed === false, 'Tool execution must stay blocked.')
assert(scope.routeExecutionAllowed === false, 'Route execution must stay blocked.')

const decision = reports.goNoGoDecision as {
  decision?: string
  externalBetaAllowed?: boolean
  paidProductionAllowed?: boolean
  productionAllowed?: boolean
  runtimeExecutionAllowed?: boolean
  providerCallsAllowed?: boolean
  supabaseWritesAllowedInThisPhase?: boolean
}
assert(decision.decision === 'restricted_internal_testing_candidate', 'Expected restricted internal testing candidate decision.')
assert(decision.externalBetaAllowed === false, 'Decision must not allow external beta.')
assert(decision.paidProductionAllowed === false, 'Decision must not allow paid production.')
assert(decision.productionAllowed === false, 'Decision must not allow production.')
assert(decision.runtimeExecutionAllowed === false, 'Decision must not allow runtime execution.')
assert(decision.providerCallsAllowed === false, 'Decision must not allow provider calls.')
assert(decision.supabaseWritesAllowedInThisPhase === false, 'Decision must not allow Supabase writes.')

const corpus = [
  ...readAllFiles('server/activation/product-internal-beta-readiness'),
  ...readAllFiles(PRODUCT_INTERNAL_BETA_READINESS_REPORT_DIR),
  ...[
    'docs/product-internal-beta-readiness-aggregation.md',
    'docs/restricted-internal-testing-scope.md',
    'docs/internal-beta-owner-map.md',
    'docs/internal-beta-readiness-decision.md',
    'docs/implementation-prompts/prompt-product-internal-testing-scope-freeze.md',
  ].map((file) => ({ file, text: readFileSync(file, 'utf8') })),
]

for (const { file, text } of corpus) {
  for (const forbidden of [
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
  ...readAllFiles(PRODUCT_INTERNAL_BETA_READINESS_REPORT_DIR),
  ...[
    'docs/product-internal-beta-readiness-aggregation.md',
    'docs/restricted-internal-testing-scope.md',
    'docs/internal-beta-owner-map.md',
    'docs/internal-beta-readiness-decision.md',
    'docs/implementation-prompts/prompt-product-internal-testing-scope-freeze.md',
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
  phase: 'product-internal-beta-readiness-aggregation',
  decision: decision.decision,
  trackBCleanStagingSync: sync.syncStatus,
  productionAffected: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  runtimeExecution: false,
  secretsPrintedOrCommitted: false,
}, null, 2))
