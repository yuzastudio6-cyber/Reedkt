import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const livePath =
  'server/cli/run-visual-intelligence-model-billing-sku-live-qualification.ts'
const reconcilePath =
  'server/cli/reconcile-visual-intelligence-model-billing-sku-live-qualification.ts'
const live = readFileSync(join(root, livePath), 'utf8')
const reconcile = readFileSync(join(root, reconcilePath), 'utf8')
const packageJson = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
) as { scripts?: Record<string, string> }

assert.equal(
  packageJson.scripts?.[
    'private:visual-intelligence-model-billing-sku-live-qualification'
  ], `tsx ${livePath} --execute`,
)
assert.equal(
  packageJson.scripts?.[
    'private:visual-intelligence-model-billing-sku-reconciliation'
  ], `tsx ${reconcilePath} --execute`,
)
assert.equal(
  packageJson.scripts?.[
    'smoke:visual-intelligence-model-billing-sku-operator-entrypoints'
  ], 'tsx server/smoke/visual-intelligence-model-billing-sku-operator-entrypoints-smoke.ts',
)

for (const phrase of [
  'I_APPROVE_EXACTLY_FOUR_INTERNAL_GEMINI_REQUESTS_NO_RETRY',
  "process.argv[2] !== '--execute'",
  'createVisualIntelligenceModelBillingSkuLiveGcsStore',
  'createVisualIntelligenceGcsProviderTrafficGuard',
  'createGoogleVertexModelBillingSkuQualificationGeneratePort',
  'createVisualIntelligenceModelBillingSkuLiveExecutor',
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com',
  'getCredentials()',
  'providerCredentials.client_email !== EXACT_PROVIDER_PRINCIPAL',
] as const) assert.equal(live.includes(phrase), true,
  `Live operator should contain ${phrase}`)

for (const phrase of [
  'I_APPROVE_READ_ONLY_AUDIT_AND_BILLING_RECONCILIATION_NO_PROVIDER_CALL',
  "process.argv[2] !== '--execute'",
  'createVisualIntelligenceModelBillingSkuReconciliationService',
  'createVisualIntelligenceProviderAuditWindowReadPort',
  'createVisualIntelligenceDetailedBillingExportReadPort',
  'createVisualIntelligenceProviderTrafficIsolationAuthorityRepository',
  'createVisualIntelligenceModelBillingSkuQualificationRepository',
  'reeditpro-api-sa@reeditpro.iam.gserviceaccount.com',
] as const) assert.equal(reconcile.includes(phrase), true,
  `Reconciliation operator should contain ${phrase}`)

assert.doesNotMatch(reconcile,
  /createGoogleVertexModelBillingSkuQualificationGeneratePort|GoogleGenAI|generateContent/u)
assert.doesNotMatch(live + reconcile,
  /customerCredits?\.(?:reserve|spend|release|refund)|wallet\.(?:debit|credit)|productionReady\s*:\s*true/u)
assert.doesNotMatch(live + reconcile,
  /console\.(?:log|error)|dotenv|process\.env\s*\)|JSON\.stringify\(process\.env/u)

const tsxExecutable = join(root, 'node_modules', '.bin', 'tsx')
const cleanEnv = { ...process.env }
for (const key of [
  'REEDITPRO_CONFIRM_VI_MODEL_SKU_LIVE_QUALIFICATION',
  'REEDITPRO_CONFIRM_VI_MODEL_SKU_RECONCILIATION',
]) delete cleanEnv[key]
const liveBlocked = spawnSync(tsxExecutable, [livePath], {
  cwd: root,
  env: cleanEnv,
  encoding: 'utf8',
})
assert.equal(liveBlocked.status, 1)
assert.match(liveBlocked.stderr, /requires exact internal paid-provider confirmation/u)
assert.equal(liveBlocked.stdout, '')

const reconcileBlocked = spawnSync(tsxExecutable, [reconcilePath], {
  cwd: root,
  env: cleanEnv,
  encoding: 'utf8',
})
assert.equal(reconcileBlocked.status, 1)
assert.match(reconcileBlocked.stderr,
  /requires exact read-only external-evidence confirmation/u)
assert.equal(reconcileBlocked.stdout, '')

console.log(JSON.stringify({
  smoke: 'visual-intelligence-model-billing-sku-operator-entrypoints',
  checks: 32,
  status: 'passed',
  missingConfirmationFailsBeforeGoogleAuth: true,
  liveProviderCallMade: false,
  auditOrBillingQueryMade: false,
  customerCreditsMutated: false,
  productionReady: false,
}))
