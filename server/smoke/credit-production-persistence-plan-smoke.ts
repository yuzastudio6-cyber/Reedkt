import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const docPath = repoPath('docs/credit-production-persistence-plan.md')
assert.equal(existsSync(docPath), true, 'Missing credit production persistence plan doc.')

const doc = readText('docs/credit-production-persistence-plan.md')
const packageJson = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> }
const creditMigration = readText('supabase/migrations/202605130004_credit_ledger_approval_gate.sql')
const runtimeMigration = readText('supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql')
const generationMigration = readText('supabase/migrations/202605130007_generation_providers_generated_assets.sql')
const toolCostMigration = readText('supabase/migrations/202606270001_tool_cost_metering_events.sql')
const toolCostSettlementMigration = readText('supabase/migrations/202606270003_tool_cost_wallet_settlement_rpc.sql')
const allMigrationFiles = readdirSync(repoPath('supabase/migrations')).filter((file) => file.endsWith('.sql'))

assert.equal(packageJson.scripts?.['smoke:credit-production-persistence-plan'], 'tsx server/smoke/credit-production-persistence-plan-smoke.ts')
assert.equal(packageJson.scripts?.['smoke:credit-persistence-plan'], 'npm run smoke:credit-production-persistence-plan')
assert.equal(allMigrationFiles.length, 24, 'RP-PERSISTENCE-PLAN-01 should not add or remove migration files.')

for (const phrase of [
  'RP-PERSISTENCE-PLAN-01',
  'planning artifact only',
  'no migration was created',
  'no SQL was applied',
  'no Supabase CLI command was run',
  'no database was contacted',
  'no Stripe webhook was processed',
  'no production credits were granted',
  'no mock store was removed',
  'proposed, not applied',
  'service-role backend',
  'User-facing RLS is read-only',
  'No client writes to balances',
  'Stripe Test/Live Separation',
  'No normal production flow should create a negative wallet balance',
  'Grant Allocation Order',
  'Ledger Semantics And Double-Counting Risk',
  'Index And Constraint Plan',
  'no silent next-edit recovery',
]) {
  assertIncludes(doc, phrase)
}

for (const tableName of [
  'credit_wallets',
  'credit_grants',
  'credit_ledger_entries',
  'credit_estimates',
  'credit_estimate_line_items',
  'credit_approvals',
  'credit_reservations',
  'credit_reservation_line_items',
  'credit_refunds',
  'credit_wallet_balance_view',
  'api_idempotency_keys',
  'generation_request_costs',
  'tool_cost_events',
  'tool_cost_wallet_settlements',
]) {
  assertIncludes(doc, tableName)
}

for (const tableName of [
  'credit_settlements',
  'credit_revision_actions',
  'credit_export_locks',
  'credit_top_up_intents',
  'stripe_customer_links',
  'stripe_payment_method_links',
  'stripe_checkout_sessions',
  'stripe_webhook_events',
  'credit_audit_events',
]) {
  assertIncludes(doc, tableName)
}

assertIncludes(creditMigration, 'create table public.credit_wallets')
assertIncludes(creditMigration, 'create table public.credit_grants')
assertIncludes(creditMigration, 'create table public.credit_ledger_entries')
assertIncludes(creditMigration, 'create table public.credit_estimates')
assertIncludes(creditMigration, 'create table public.credit_reservations')
assertIncludes(creditMigration, 'create or replace view public.credit_wallet_balance_view')
assertIncludes(runtimeMigration, 'create table if not exists public.api_idempotency_keys')
assertIncludes(generationMigration, 'create table public.generation_request_costs')
assertIncludes(toolCostMigration, 'create table if not exists public.tool_cost_events')
assertIncludes(toolCostMigration, 'service-role/backend only')
assertIncludes(toolCostSettlementMigration, 'create table if not exists public.tool_cost_wallet_settlements')

for (const boundary of [
  'no Supabase migration file',
  'no Supabase CLI command',
  'no SQL execution',
  'no generated database types',
  'no persistence repository implementation',
  'no route behavior changes',
  'no live Stripe call',
  'no production wallet mutation',
  'no production ledger write',
  'no provider call',
  'no worker, render, or export execution',
  'no `package-lock.json` change',
]) {
  assertIncludes(doc, boundary)
}

for (const file of [
  'README.md',
  'implementation-status.md',
  'mock-vs-real-status.md',
  'credit-ledger-architecture.md',
  'supabase/README.md',
  'supabase/schema-review.md',
]) {
  assertIncludes(readText(file), 'RP-PERSISTENCE-PLAN-01')
}

for (const forbidden of [
  'supabase migration new',
  'supabase db push',
  'supabase db reset',
  'stripe.webhooks.constructEvent(',
  'grantProductionCredits(',
  'processLiveStripeWebhook(',
]) {
  assert.equal(doc.includes(forbidden), false, `Plan doc must not instruct running ${forbidden}`)
}

console.log(JSON.stringify({
  smoke: 'credit-production-persistence-plan',
  status: 'passed',
  migrationFiles: allMigrationFiles.length,
  existingTablesDocumented: 14,
  proposedTablesDocumented: 9,
}, null, 2))

function readText(relativePath: string): string {
  return readFileSync(repoPath(relativePath), 'utf8')
}

function repoPath(relativePath: string): string {
  return path.join(root, relativePath)
}

function assertIncludes(source: string, phrase: string): void {
  assert.equal(source.includes(phrase), true, `Missing required phrase: ${phrase}`)
}
