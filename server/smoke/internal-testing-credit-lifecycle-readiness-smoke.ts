import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  getMockCreditRuntimeScenarioById,
  prepareMockCreditRuntimeScenario,
} from '../../src/backend/mock/mock-credit-runtime-scenarios'
import { unwrapServiceResult } from '../../src/backend/service-result'
import { checkCreditApprovalGate } from '../../src/backend/services/credit-approval-gate-service'
import {
  refundCreditsForFailedJobMock,
  releaseReservedCreditsMock,
  spendReservedCreditsMock,
} from '../../src/backend/services/credit-ledger-runtime-service'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string) {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

function assertText(path: string, phrases: string[]) {
  const text = read(path)
  for (const phrase of phrases) {
    assert.match(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${path} should mention ${phrase}`)
  }
}

const requiredFiles = [
  'docs/internal-testing-credit-lifecycle-readiness.md',
  'docs/internal-testing-credit-lifecycle-readiness.json',
  'server/smoke/internal-testing-credit-lifecycle-readiness-smoke.ts',
  'src/pages/InternalTestingPage.tsx',
  'src/lib/internal-testing-scenarios.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:internal-testing-credit-lifecycle-readiness'],
  'tsx server/smoke/internal-testing-credit-lifecycle-readiness-smoke.ts',
)

assertText('src/pages/InternalTestingPage.tsx', [
  'internal-testing-credit-lifecycle-readiness',
  'Reserved credits have explicit success, release, and refund paths',
  'Spend reserved credits',
  'Release reservation',
  'Refund credits',
  'No silent billing',
])

assertText('src/lib/internal-testing-scenarios.ts', [
  'credit-lifecycle-readiness',
  'success spends',
  'releases it',
  'refunds it',
])

assertText('docs/internal-testing-credit-lifecycle-readiness.md', [
  'internal_testing_credit_lifecycle_readiness_passed_ready_for_repeated_local_internal_testing',
  'successful work spends',
  'releases the unused reservation',
  'creates a credit refund record',
  'No real credit spend',
  'No Supabase',
  'product-ready',
])

const docJson = JSON.parse(read('docs/internal-testing-credit-lifecycle-readiness.json')) as {
  decision?: string
  lifecycle?: Record<string, string>
  blockedScope?: Record<string, boolean>
}
assert.equal(docJson.decision, 'internal_testing_credit_lifecycle_readiness_passed_ready_for_repeated_local_internal_testing')
assert.equal(docJson.lifecycle?.success, 'spend_reserved_credits')
assert.equal(docJson.lifecycle?.cancelledOrBlocked, 'release_reservation')
assert.equal(docJson.lifecycle?.reeditproFailure, 'refund_credits')
assert.equal(docJson.blockedScope?.realCreditSpend, false)
assert.equal(docJson.blockedScope?.ledgerWrites, false)
assert.equal(docJson.blockedScope?.stripe, false)
assert.equal(docJson.blockedScope?.supabaseReadWrite, false)
assert.equal(docJson.blockedScope?.productReady, false)

const spendScenario = getMockCreditRuntimeScenarioById('successful-job-spends-reservation')
assert.ok(spendScenario, 'Spend scenario should exist.')
const spendPrepared = prepareMockCreditRuntimeScenario(spendScenario)
const spendGate = checkCreditApprovalGate(spendPrepared.db, spendPrepared.gateInput)
assert.equal(spendGate.ok, true, 'Spend flow should start from an allowed credit gate.')
assert.ok(spendPrepared.reservation?.id, 'Spend flow needs a reserved credit record.')
const spend = unwrapServiceResult(spendReservedCreditsMock(spendPrepared.db, spendPrepared.reservation.id))
assert.equal(spend.reservation?.status, 'spent', 'Successful mock job should spend the reservation.')
assert.equal(spend.ledgerEntry?.entryType, 'spend', 'Successful mock job should create a spend ledger entry.')
assert.ok((spend.ledgerEntry?.amount ?? 0) < 0, 'Spend ledger entry should debit credits.')

const releaseScenario = getMockCreditRuntimeScenarioById('approved-plan-approved-estimate-reservation-allowed')
assert.ok(releaseScenario, 'Approved reservation scenario should exist.')
const releasePrepared = prepareMockCreditRuntimeScenario(releaseScenario)
assert.ok(releasePrepared.reservation?.id, 'Release flow needs a reserved credit record.')
const release = unwrapServiceResult(releaseReservedCreditsMock(releasePrepared.db, releasePrepared.reservation.id))
assert.equal(release.reservation?.status, 'released', 'Cancelled/blocked mock work should release reserved credits.')
assert.equal(release.ledgerEntry?.entryType, 'reservation_release', 'Release should create a reservation_release ledger entry.')
assert.ok((release.ledgerEntry?.amount ?? 0) > 0, 'Release ledger entry should return credits.')

const refundScenario = getMockCreditRuntimeScenarioById('failed-job-releases-reservation')
assert.ok(refundScenario, 'Refund scenario should exist.')
const refundPrepared = prepareMockCreditRuntimeScenario(refundScenario)
const refundGate = checkCreditApprovalGate(refundPrepared.db, refundPrepared.gateInput)
assert.equal(refundGate.ok, true, 'Refund flow should start from an allowed credit gate.')
assert.ok(refundPrepared.reservation?.id, 'Refund flow needs a reserved credit record.')
const refund = unwrapServiceResult(refundCreditsForFailedJobMock(refundPrepared.db, refundPrepared.reservation.id))
assert.equal(refund.reservation?.status, 'refunded', 'ReEditPro-side failed mock job should refund the reservation.')
assert.equal(refund.ledgerEntry?.entryType, 'failed_generation_refund', 'Refund should create failed_generation_refund ledger entry.')
assert.equal(refund.ledgerEntry?.amount, refund.reservation?.refundedCredits, 'Refund ledger amount should match refunded credits.')

console.log(JSON.stringify({
  ok: true,
  smoke: 'internal-testing-credit-lifecycle-readiness',
  decision: docJson.decision,
  checks: [
    'mock_success_spends_reserved_credits',
    'mock_cancel_or_block_releases_reserved_credits',
    'mock_reeditpro_failure_refunds_credits',
    'mock_ledger_entries_are_created',
    'no_real_billing_or_supabase_mutation',
  ],
  lifecycle: docJson.lifecycle,
  blockedScope: docJson.blockedScope,
}, null, 2))
