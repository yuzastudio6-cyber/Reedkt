import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const sourceFiles = [
  'server/tool-cost-metering/tool-cost-metering-service.ts',
  'server/tool-cost-metering/tool-cost-wallet-settlement.ts',
  'server/tool-cost-metering/tool-cost-persistent-store.ts',
  'server/beta-readiness/platform-billing-qa.ts',
  'server/routes/tool-cost-routes.ts',
  'server/routes/beta-readiness-routes.ts',
  'server/smoke/tool-cost-wallet-settlement-smoke.ts',
  'server/smoke/tool-cost-wallet-settlement-rpc-sql-smoke.ts',
  'server/smoke/beta-platform-billing-qa-smoke.ts',
]

const forbiddenRuntimePatterns = [
  /\bimport\s+Stripe\b/,
  /\bfrom\s+['"]stripe['"]/,
  /\brequire\(['"]stripe['"]\)/,
  /\bnew\s+Stripe\s*\(/,
  /\bstripe\.checkout\b/i,
  /\bstripe\.webhooks\b/i,
  /\bstripe\.paymentIntents\b/i,
  /\bstripe\.charges\b/i,
  /https:\/\/api\.stripe\.com/i,
]

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

assert.equal(packageJson.dependencies?.stripe, undefined, 'runtime dependencies must not include Stripe')
assert.equal(packageJson.devDependencies?.stripe, undefined, 'dev dependencies must not include Stripe')

for (const path of sourceFiles) {
  const text = readFileSync(path, 'utf8')
  for (const pattern of forbiddenRuntimePatterns) {
    assert.equal(pattern.test(text), false, `${path} must not contain forbidden Stripe runtime pattern ${pattern}`)
  }
}

const walletSettlement = readFileSync('server/tool-cost-metering/tool-cost-wallet-settlement.ts', 'utf8')
assert.ok(walletSettlement.includes('stripeCallAttempted: false'), 'wallet settlement must preserve Stripe isolation marker')
assert.ok(walletSettlement.includes('serviceFeeIncluded: false'), 'wallet settlement must keep service fee excluded from tool events')
assert.ok(walletSettlement.includes('Stripe was not called'), 'wallet settlement warnings must state Stripe was not called')

const billingQa = readFileSync('server/beta-readiness/platform-billing-qa.ts', 'utf8')
assert.ok(billingQa.includes("'stripe_boundary'"), 'platform billing QA must include a Stripe boundary check')
assert.ok(billingQa.includes('Stripe is isolated from tool event recording'), 'platform billing QA should describe Stripe isolation')
assert.ok(billingQa.includes('first.event.metadata.stripeCallAttempted === false'), 'platform billing QA should assert no Stripe call marker')
assert.ok(billingQa.includes('Stripe boundary owner approval evidence'), 'platform billing QA should keep owner approval evidence as missing')

const rpcMigration = readFileSync('supabase/migrations/202606270003_tool_cost_wallet_settlement_rpc.sql', 'utf8')
assert.ok(rpcMigration.includes("'stripe_call_attempted', false"), 'wallet settlement RPC should write Stripe isolation metadata')
assert.ok(rpcMigration.includes("'service_fee_included', false"), 'wallet settlement RPC should exclude service fees')
assert.equal(/https:\/\/api\.stripe\.com/i.test(rpcMigration), false, 'wallet settlement RPC must not reference Stripe API')

const monitoringSmoke = readFileSync('server/smoke/beta-platform-monitoring-catalog-smoke.ts', 'utf8')
assert.ok(monitoringSmoke.includes('stripe_call_attempted_from_tool_cost_surface'), 'monitoring should alert on forbidden Stripe attempts')

console.log(JSON.stringify({
  ok: true,
  scannedFiles: sourceFiles.length,
  stripeDependencyPresent: false,
  forbiddenRuntimePatternsPresent: false,
  stripeBoundaryQaPresent: true,
  stripeCallAttemptedMarkerPreserved: true,
  serviceFeeIncluded: false,
  ownerApprovalStillRequired: true,
}, null, 2))
