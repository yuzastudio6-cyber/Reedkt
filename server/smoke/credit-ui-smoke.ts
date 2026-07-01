import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import {
  CREDIT_UI_COPY,
  createCreditEstimateCardViewModel,
  createCreditLifecycleViewModel,
  formatCreditAmount,
  formatCreditDollarEquivalent,
} from '../../src/lib/credit-ui-adapter'
import { createMockCreditLifecycleScenario } from '../../src/lib/credit-ui-fixtures'

const root = process.cwd()
const forbiddenStripeSecretPattern = new RegExp([
  'sk' + '_test',
  'sk' + '_live',
  'rk' + '_test',
  'rk' + '_live',
  'pk' + '_live',
  'wh' + 'sec',
].join('|'), 'i')
const forbiddenClientImports = [
  '../server',
  '../../server',
  '../../../server',
  'server/',
  'node:',
  "from 'fs'",
  'from "fs"',
  "from 'path'",
  'from "path"',
  "from 'crypto'",
  'from "crypto"',
]

const requiredFiles = [
  'src/lib/credit-ui-adapter.ts',
  'src/lib/credit-ui-fixtures.ts',
  'src/components/credit/CreditLifecycleDemo.tsx',
  'src/components/credit/CreditWalletBalanceCard.tsx',
  'src/components/credit/CreditEstimateCard.tsx',
  'src/components/credit/CreditReservationCard.tsx',
  'src/components/credit/CreditRuntimeGuardCard.tsx',
  'src/components/credit/CreditRevisionActionCard.tsx',
  'src/components/credit/CreditSettlementReceiptCard.tsx',
  'src/components/credit/CreditExportLockCard.tsx',
  'src/components/credit/CreditTopUpCard.tsx',
  'src/components/credit/StripeBillingStatusCard.tsx',
  'src/styles/credit-ui.css',
  'docs/credit-ui-lifecycle-cards.md',
]

for (const file of requiredFiles) {
  assert.equal(existsSync(repoPath(file)), true, `Missing RP-CREDITUI-01 file: ${file}`)
}

assert.equal(formatCreditDollarEquivalent(1), '$0.10')
assert.equal(formatCreditDollarEquivalent(10), '$1.00')
assert.equal(formatCreditDollarEquivalent(100), '$10.00')
assert.equal(formatCreditAmount(1000), '1,000 credits')

const scenario = createMockCreditLifecycleScenario()
const lifecycle = createCreditLifecycleViewModel(scenario)
const text = JSON.stringify(lifecycle)

assert.match(lifecycle.estimate.estimateRange, /120 credits - 200 credits/)
assert.equal(lifecycle.estimate.requiredHold, '200 credits')
assert.equal(scenario.estimatePreview.summary.requiredHoldCredits, scenario.estimatePreview.summary.maximumEstimatedCredits)
assert.ok(lifecycle.estimate.copy.includes(CREDIT_UI_COPY.estimateNotCharge))
assert.ok(lifecycle.estimate.copy.includes(CREDIT_UI_COPY.reserveMaximum))
assert.ok(lifecycle.estimate.copy.includes(CREDIT_UI_COPY.finalCharge))
assert.ok(lifecycle.estimate.copy.includes(CREDIT_UI_COPY.unusedReturns))
assert.ok(lifecycle.estimate.copy.includes(CREDIT_UI_COPY.formula))
assert.equal(lifecycle.estimate.lineItems.some((line) => /service\/edit fee/i.test(line.label) && /Separate from tool costs/i.test(line.detail ?? '')), true)

assert.equal(lifecycle.wallet.metrics.some((metric) => metric.label === 'Available credits' && metric.value.includes('$12.00')), true)
assert.equal(lifecycle.wallet.metrics.some((metric) => metric.label === 'Reserved credits' && metric.value === '200 credits'), true)
assert.equal(lifecycle.wallet.metrics.some((metric) => metric.label === 'Spent credits' && metric.value === '160 credits'), true)
assert.equal(lifecycle.wallet.metrics.some((metric) => metric.label === 'Refunded credits' && metric.value === '0 credits'), true)
assert.equal(lifecycle.wallet.outstandingCreditsLabel, 'Outstanding credits required before export: 30 credits')
assert.equal(text.includes('negative balance'), false)

assert.equal(lifecycle.reservation.title, 'Action required: add credits to continue')
assert.match(lifecycle.reservation.message, /This edit requires a 200-credit hold before generation/)
assert.match(lifecycle.reservation.message, /No credits have been spent yet/)
assert.equal(lifecycle.reservation.metrics.some((metric) => metric.label === 'Required hold' && /maximum estimate/.test(metric.detail ?? '')), true)
assert.equal(lifecycle.reservation.metrics.some((metric) => metric.label === 'Available after' && metric.value === '0 credits'), true)

assert.equal(lifecycle.runtimeGuard.title, 'Action required: revised credit estimate needed')
assert.match(lifecycle.runtimeGuard.message, /No extra paid work will continue/)
assert.equal(lifecycle.runtimeGuard.metrics.some((metric) => metric.label === 'Projected service fee credits' && /separate/.test(metric.detail ?? '')), true)

assert.equal(lifecycle.revisionAction.options.some((option) => option.label === 'Approve & Continue'), true)
assert.equal(lifecycle.revisionAction.options.some((option) => option.label === 'Choose Lower-Cost Option'), true)
assert.equal(lifecycle.revisionAction.options.some((option) => option.label === 'Cancel Extra Work'), true)
assert.equal(lifecycle.revisionAction.options.some((option) => /does not auto-resume work/.test(option.helper)), true)

const approvedRevision = createCreditLifecycleViewModel({
  ...scenario,
  revisionAction: {
    ...scenario.revisionAction,
    status: 'approved',
  },
})
assert.match(approvedRevision.revisionAction.message, /Extra credits reserved/)
assert.equal(/spent/i.test(approvedRevision.revisionAction.message), false)

const lowerCostRevision = createCreditLifecycleViewModel({
  ...scenario,
  revisionAction: {
    ...scenario.revisionAction,
    status: 'lower_cost_selected',
  },
})
assert.match(lowerCostRevision.revisionAction.message, /will rebuild the estimate/)
assert.equal(/auto-resum/i.test(lowerCostRevision.revisionAction.message), false)

assert.equal(lifecycle.settlement.title, 'Final credit charge settled')
assert.equal(lifecycle.settlement.metrics.some((metric) => metric.label === 'Actual tool cost'), true)
assert.equal(lifecycle.settlement.metrics.some((metric) => metric.label === 'ReEditPro service fee'), true)
assert.equal(lifecycle.settlement.metrics.some((metric) => metric.label === 'Final charge'), true)
assert.equal(lifecycle.settlement.metrics.some((metric) => metric.label === 'Returned credits'), true)
assert.match(lifecycle.settlement.message, /ReEditPro absorbed 30 credits/)

assert.equal(createCreditEstimateCardViewModel(scenario.estimatePreview).actions.some((action) => action.label === 'Reserve Credits'), true)
assert.equal(lifecycle.exportLock.title, 'Action required: add credits to export')
assert.match(lifecycle.exportLock.message, /before export can be rechecked/)
assert.match(lifecycle.exportLock.metrics.find((metric) => metric.label === 'Can export')?.detail ?? '', /does not change real export readiness/)
assert.equal(/checkout is complete/i.test(lifecycle.exportLock.message), false)
assert.equal(/unlock export/i.test(text), false)

assert.deepEqual(lifecycle.topUp.packs.map((pack) => pack.label), [
  '100 credits = $10',
  '250 credits = $25',
  '500 credits = $50',
  '1,000 credits = $100',
  '2,500 credits = $250',
])
assert.equal(lifecycle.topUp.copy.includes(CREDIT_UI_COPY.topUpMockOnly), true)
assert.equal(lifecycle.topUp.copy.includes(CREDIT_UI_COPY.topUpNotSpent), true)
assert.equal(lifecycle.topUp.copy.includes(CREDIT_UI_COPY.topUpRetry), true)
assert.equal(lifecycle.topUp.nextSuggestedAction, 'Retry export gate')

assert.equal(lifecycle.stripeBilling.metrics.some((metric) => metric.label === 'Billing mode' && metric.value === 'test'), true)
assert.equal(lifecycle.stripeBilling.metrics.some((metric) => metric.label === 'Live readiness' && metric.value === 'ready_no_charge'), true)
assert.equal(lifecycle.stripeBilling.copy.includes(CREDIT_UI_COPY.stripeNoPayment), true)
assert.equal(lifecycle.stripeBilling.copy.includes(CREDIT_UI_COPY.stripeLiveBlocked), true)
assert.equal(lifecycle.stripeBilling.copy.includes(CREDIT_UI_COPY.stripeNoSecrets), true)
assert.equal(lifecycle.stripeBilling.copy.includes(CREDIT_UI_COPY.secretReferenceSafety), true)

assert.equal(forbiddenStripeSecretPattern.test(text), false)

const clientFiles = [
  'src/lib/credit-ui-adapter.ts',
  'src/lib/credit-ui-fixtures.ts',
  'src/components/WalletCard.tsx',
  'src/main.tsx',
  ...collectFiles(repoPath('src/components/credit')),
]

for (const file of clientFiles) {
  const source = readFileSync(file, 'utf8')
  for (const forbidden of forbiddenClientImports) {
    assert.equal(source.includes(forbidden), false, `${file} must not include ${forbidden}`)
  }
  assert.equal(forbiddenStripeSecretPattern.test(source), false, `${file} must not include raw Stripe secret markers`)
}

const docs = readFileSync(repoPath('docs/credit-ui-lifecycle-cards.md'), 'utf8')
assert.match(docs, /display-only/i)
assert.match(docs, /does not call credit routes/i)
assert.match(docs, /does not enable payment processing/i)
assert.equal(forbiddenStripeSecretPattern.test(docs), false)

const packageJson = JSON.parse(readFileSync(repoPath('package.json'), 'utf8')) as { scripts?: Record<string, string> }
assert.equal(packageJson.scripts?.['smoke:credit-ui'], 'tsx server/smoke/credit-ui-smoke.ts')

console.log(JSON.stringify({
  smoke: 'credit-ui',
  status: 'passed',
  cards: Object.keys(lifecycle).length,
  requiredHoldCredits: scenario.estimatePreview.summary.requiredHoldCredits,
  maxEstimateCredits: scenario.estimatePreview.summary.maximumEstimatedCredits,
  stripeLiveReadiness: lifecycle.stripeBilling.metrics.find((metric) => metric.label === 'Live readiness')?.value,
}, null, 2))

function repoPath(filePath: string): string {
  return path.join(root, filePath)
}

function collectFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return collectFiles(entryPath)
    return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : []
  })
}
