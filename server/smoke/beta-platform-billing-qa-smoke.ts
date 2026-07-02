import assert from 'node:assert/strict'
import { loadRuntimeEnv } from '../config/env'
import { resetMockToolCostStore } from '../tool-cost-metering/mock-tool-cost-store'
import { runBetaPlatformBillingQa } from '../beta-readiness/platform-billing-qa'

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

resetMockToolCostStore()

const report = await runBetaPlatformBillingQa({
  env,
  clients: { admin: null, public: null },
  requestId: 'beta-platform-billing-qa-smoke',
  auth: {
    userId: 'mock-user-runtime',
    email: 'mock-user@reeditpro.local',
    isMockUser: true,
  },
}, {
  workspaceId: 'beta-platform-billing-qa-smoke-workspace',
  projectId: 'beta-platform-billing-qa-smoke-project',
  sourceId: 'beta-platform-billing-qa-smoke',
  sourceSha: '7777777777777777777777777777777777777777',
  environment: 'local_mock',
  notes: ['Smoke validates platform billing QA without Supabase, Stripe, wallet settlement, media, or beta enablement.'],
}, 'beta-platform-billing-qa-smoke-idempotency')

assert.equal(report.persistenceMode, 'mock_memory', 'Smoke must use mock memory persistence.')
assert.equal(report.wouldClearPlatformBlocker, false, 'Platform billing QA must not clear the shared platform blocker.')
assert.ok(report.toolEventId, 'Platform billing QA should create a controlled tool-cost event.')
assert.ok(report.toolEventCredits > 0, 'Tool-cost event should have non-zero credits.')
assert.ok(report.walletSettlementId, 'Platform billing QA should create an explicit mock wallet settlement.')
assert.equal(report.walletSettlementCreditsDelta, -report.toolEventCredits, 'Explicit mock wallet settlement should spend the event credits.')
assert.ok(report.billableEventCount >= 1, 'Summary should include a billable event.')
assert.ok(report.summaryCredits >= report.toolEventCredits, 'Summary credits should include the QA event credits.')
assert.ok(report.checks.every((check) => check.status === 'passed'), 'All local QA checks should pass.')
assert.ok(report.missingPlatformEvidence.some((item) => item.includes('wallet settlement')), 'Wallet settlement should remain named missing evidence.')
assert.ok(report.notes.some((note) => note.includes('does not process media')), 'Report should preserve no-runtime/no-media boundary notes.')

console.log(JSON.stringify({
  ok: true,
  reportId: report.reportId,
  persistenceMode: report.persistenceMode,
  checkIds: report.checks.map((check) => check.id),
  walletSettlementCreditsDelta: report.walletSettlementCreditsDelta,
  missingPlatformEvidence: report.missingPlatformEvidence,
}, null, 2))
