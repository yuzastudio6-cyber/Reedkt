import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const reviewFiles = [
  'supabase/review/credit_persistence_migration_draft.sql',
  'supabase/review/credit_persistence_rls_draft.sql',
  'supabase/review/credit_persistence_rpc_draft.sql',
]
const forbiddenStripeMarkers = [
  ['sk', 'test'].join('_'),
  ['sk', 'live'].join('_'),
  ['rk', 'test'].join('_'),
  ['rk', 'live'].join('_'),
  ['pk', 'live'].join('_'),
  ['wh', 'sec'].join(''),
]

const doc = readText('docs/credit-supabase-migration-draft.md')
const packageJson = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> }
const productionPlan = readText('docs/credit-production-persistence-plan.md')
const migrationFiles = readdirSync(repoPath('supabase/migrations')).filter((file) => file.endsWith('.sql'))
const reviewSql = reviewFiles.map((file) => readText(file)).join('\n')

assert.equal(existsSync(repoPath('docs/credit-supabase-migration-draft.md')), true)
for (const file of reviewFiles) {
  assert.equal(existsSync(repoPath(file)), true, `Missing review SQL file ${file}`)
  assert.equal(file.startsWith('supabase/review/'), true, `${file} must live under supabase/review`)
  assert.equal(file.includes('supabase/migrations'), false, `${file} must not live under supabase/migrations`)
  const source = readText(file)
  assert.equal(source.startsWith('-- REVIEW DRAFT ONLY\n-- NOT APPLIED\n-- DO NOT RUN IN PRODUCTION'), true)
  assertIncludes(source, 'Generated for RP-SUPABASE-MIGRATION-01 planning review')
}

assert.equal(migrationFiles.length, 24, 'RP-SUPABASE-MIGRATION-01 must not add active migration files.')
assert.equal(packageJson.scripts?.['smoke:credit-supabase-migration-draft'], 'tsx server/smoke/credit-supabase-migration-draft-smoke.ts')

for (const phrase of [
  'RP-SUPABASE-MIGRATION-01',
  'review-only',
  'Review SQL lives only under `supabase/review/`',
  'no Supabase CLI command',
  'no SQL is applied',
  'no database is contacted',
  'no generated database types are changed',
  'no production wallet',
  'service-role',
  'explicit grants',
  'RLS',
  'one active `reserved` reservation per estimate',
  'Ledger Semantics',
  'test/live Stripe mode separation',
  'card verification code',
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
  'api_idempotency_keys',
  'generation_request_costs',
  'tool_cost_events',
  'tool_cost_wallet_settlements',
  'credit_settlements',
  'credit_revision_actions',
  'credit_export_locks',
  'credit_top_up_intents',
  'stripe_customer_links',
  'stripe_payment_method_links',
  'stripe_checkout_sessions',
  'stripe_webhook_events',
]) {
  assertIncludes(doc, tableName)
  assertIncludes(reviewSql, tableName)
}

for (const phrase of [
  'non-negative credits',
  'non-negative cents',
  'released_credits <= reserved_credits',
  'spent_credits <= reserved_credits',
  'outstanding_credits >= 0',
  'absorbed_overage_credits >= 0',
  'unique idempotency',
  'unique Stripe webhook event ID per Stripe mode',
  'unique Stripe checkout session ID per Stripe mode',
  'no negative wallet cached balances',
  'create unique index if not exists credit_reservations_active_estimate_uidx',
  'grant select on table public.credit_settlements to authenticated',
  'grant select, insert, update, delete on table public.credit_settlements to service_role',
  'No authenticated insert/update/delete policy',
]) {
  assertIncludes(reviewSql, phrase)
}

for (const functionName of [
  'reserve_max_estimate_credits',
  'reserve_additional_revised_credits',
  'settle_credit_reservation',
  'complete_stripe_credit_grant_from_webhook',
  'expire_bonus_credits',
]) {
  assertIncludes(reviewSql, functionName)
}

for (const phrase of [
  'Lock api_idempotency_keys',
  'idempotency replay',
  'row',
  'wallet cached_available_credits',
  'credit_ledger_entries',
  'service_role',
  'revoke all on function',
]) {
  assertIncludes(reviewSql, phrase)
}

for (const boundary of [
  'no active migrations',
  'no Supabase CLI',
  'no SQL execution',
  'no generated database types',
  'no runtime persistence files',
  'no live billing',
  'no Stripe charge',
  'no provider call',
  'no render/export',
]) {
  assertIncludes(doc, boundary)
}

assertIncludes(productionPlan, 'RP-PERSISTENCE-PLAN-01')
assertIncludes(productionPlan, 'credit_settlements')
assertIncludes(productionPlan, 'service-role backend')

const packageLock = maybeReadText('package-lock.json')
const protectedDiff = execFileSync('git', ['diff', '--name-only', '--', 'package-lock.json', 'supabase/migrations'], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
}).trim()
assert.equal(packageLock.length > 0, true, 'package-lock.json should exist for unchanged dependency verification.')
assert.equal(protectedDiff, '', 'RP-SUPABASE-MIGRATION-01 must not modify package-lock.json or supabase/migrations.')

for (const file of [
  'README.md',
  'implementation-status.md',
  'mock-vs-real-status.md',
  'credit-ledger-architecture.md',
  'supabase/README.md',
  'supabase/schema-review.md',
]) {
  assertIncludes(readText(file), 'RP-SUPABASE-MIGRATION-01')
}

const combined = [doc, reviewSql].join('\n')
for (const marker of forbiddenStripeMarkers) {
  assert.equal(combined.includes(marker), false, `Review docs/SQL must not contain raw Stripe marker ${marker}`)
}
for (const forbidden of [
  'supabase migration new',
  'supabase db push',
  'supabase db reset',
  'stripe.webhooks.constructEvent(',
  'processLiveStripeWebhook(',
  'grantProductionCredits(',
]) {
  assert.equal(combined.includes(forbidden), false, `Draft package must not instruct ${forbidden}`)
}

console.log(JSON.stringify({
  smoke: 'credit-supabase-migration-draft',
  status: 'passed',
  migrationFiles: migrationFiles.length,
  reviewFiles: reviewFiles.length,
  packageLockPresent: packageLock.length > 0,
}, null, 2))

function readText(relativePath: string): string {
  return readFileSync(repoPath(relativePath), 'utf8')
}

function maybeReadText(relativePath: string): string {
  const absolutePath = repoPath(relativePath)
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : ''
}

function repoPath(relativePath: string): string {
  return path.join(root, relativePath)
}

function assertIncludes(source: string, phrase: string): void {
  assert.equal(source.includes(phrase), true, `Missing required phrase: ${phrase}`)
}
