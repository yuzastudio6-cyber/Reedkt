import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  calculateReEditProFinalChargeCredits,
  calculateReEditProServiceFeeCredits,
  centsToCredits,
  CREDIT_RETAIL_VALUE_CENTS,
  CREDITS_PER_DOLLAR,
  EXPORT_CREDIT_ACTION_COPY,
  getServiceFeeLengthFloorCredits,
  getServiceFeePercentage,
  REEDITPRO_EDIT_LEVELS,
  REEDITPRO_EXPORT_LOCK_ACTION_REQUIRED_COPY,
  REEDITPRO_NO_SILENT_RECOVERY_BILLING_POLICY,
  REEDITPRO_PRODUCT_EDIT_LEVELS,
  REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY,
  REVISED_CREDIT_ACTION_COPY,
  requiresCustomCreditEstimate,
  safeCalculateReEditProServiceFeeCredits,
  safeCentsToCredits,
  safeGetServiceFeeLengthFloorCredits,
  safeRequiresCustomCreditEstimate,
  SERVICE_FEE_LENGTH_FLOORS,
  SERVICE_FEE_PERCENTAGES,
} from '../../src/types/credit-policy'
import { normalizeEditLevelInput } from '../../src/lib/edit-level-compatibility-mappers'
import {
  createEditLevelBoundarySummary,
  createEditLevelEstimateNoticeModel,
  createEditLevelSelectedSummaryModel,
} from '../../src/lib/edit-level-ui-adapter'
import {
  TOOL_COST_METERING_POLICY_NOTE,
  TOOL_COST_METERING_RATE_CARD,
  TOOL_OWNER_COST_EVENT_POLICY,
} from '../tool-cost-metering/rate-card'

function repoFile(path: string) {
  return new URL(`../../${path}`, import.meta.url)
}

function readRepoFile(path: string) {
  return readFileSync(repoFile(path), 'utf8')
}

assert.equal(CREDIT_RETAIL_VALUE_CENTS, 10)
assert.equal(CREDITS_PER_DOLLAR, 10)
assert.deepEqual(REEDITPRO_EDIT_LEVELS, ['normal', 'premium', 'ultra_premium'])
assert.equal(REEDITPRO_PRODUCT_EDIT_LEVELS, REEDITPRO_EDIT_LEVELS)
assert.equal(REVISED_CREDIT_ACTION_COPY, REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY)
assert.equal(EXPORT_CREDIT_ACTION_COPY, REEDITPRO_EXPORT_LOCK_ACTION_REQUIRED_COPY)

assert.equal(centsToCredits(10), 1)
assert.equal(centsToCredits(100), 10)
assert.equal(centsToCredits(999), 100)

assert.equal(getServiceFeeLengthFloorCredits(300, 'normal'), 30)
assert.equal(getServiceFeeLengthFloorCredits(600, 'normal'), 40)
assert.equal(getServiceFeeLengthFloorCredits(1200, 'premium'), 120)
assert.equal(getServiceFeeLengthFloorCredits(3599, 'ultra_premium'), 350)
assert.equal(getServiceFeeLengthFloorCredits(3600, 'normal'), null)

assert.equal(getServiceFeePercentage('normal'), 0.1)
assert.equal(getServiceFeePercentage('premium'), 0.2)
assert.equal(getServiceFeePercentage('ultra_premium'), 0.3)
assert.equal(SERVICE_FEE_LENGTH_FLOORS['5_10_min'].premium, 70)
assert.equal(SERVICE_FEE_PERCENTAGES.ultra_premium, 0.3)

const normalFee = calculateReEditProServiceFeeCredits({
  actualToolCostCredits: 500,
  durationSeconds: 600,
  editLevel: 'normal',
}).serviceFeeCredits
const premiumFee = calculateReEditProServiceFeeCredits({
  actualToolCostCredits: 500,
  durationSeconds: 600,
  editLevel: 'premium',
}).serviceFeeCredits
const ultraPremiumFee = calculateReEditProServiceFeeCredits({
  actualToolCostCredits: 500,
  durationSeconds: 600,
  editLevel: 'ultra_premium',
}).serviceFeeCredits

assert.ok(typeof normalFee === 'number')
assert.ok(typeof premiumFee === 'number')
assert.ok(typeof ultraPremiumFee === 'number')
if (normalFee === null || premiumFee === null || ultraPremiumFee === null) {
  throw new Error('Expected billable duration service fees.')
}
assert.ok(normalFee < premiumFee)
assert.ok(premiumFee < ultraPremiumFee)

assert.equal(
  calculateReEditProServiceFeeCredits({
    actualToolCostCredits: 120,
    durationSeconds: 600,
    editLevel: 'normal',
  }).serviceFeeCredits,
  40,
  'length floor should win when percentage fee is lower',
)

assert.equal(
  calculateReEditProServiceFeeCredits({
    actualToolCostCredits: 900,
    durationSeconds: 600,
    editLevel: 'ultra_premium',
  }).serviceFeeCredits,
  270,
  'percentage fee should win when tool cost is high',
)

assert.equal(
  calculateReEditProFinalChargeCredits({
    actualToolCostCredits: 120,
    durationSeconds: 600,
    editLevel: 'normal',
  }).finalChargeCredits,
  160,
)
assert.equal(
  calculateReEditProFinalChargeCredits({
    actualToolCostCredits: 260,
    durationSeconds: 600,
    editLevel: 'premium',
  }).finalChargeCredits,
  330,
)
assert.equal(
  calculateReEditProFinalChargeCredits({
    actualToolCostCredits: 900,
    durationSeconds: 600,
    editLevel: 'ultra_premium',
  }).finalChargeCredits,
  1170,
)

assert.equal(requiresCustomCreditEstimate(3600, 'normal'), true)
assert.equal(safeRequiresCustomCreditEstimate(3600, 'normal').ok, true)
assert.equal(
  calculateReEditProFinalChargeCredits({
    actualToolCostCredits: 1000,
    durationSeconds: 3600,
    editLevel: 'premium',
  }).finalChargeCredits,
  null,
)

const invalidCents = safeCentsToCredits(-1)
assert.equal(invalidCents.ok, false)
if (invalidCents.ok) throw new Error('negative cents should fail safely')
assert.equal(invalidCents.error.code, 'invalid_cents')

const invalidDuration = safeRequiresCustomCreditEstimate(-1, 'normal')
assert.equal(invalidDuration.ok, false)
if (invalidDuration.ok) throw new Error('negative duration should fail safely')
assert.equal(invalidDuration.error.code, 'invalid_duration_seconds')

const invalidFloor = safeGetServiceFeeLengthFloorCredits(-1, 'normal')
assert.equal(invalidFloor.ok, false)
if (invalidFloor.ok) throw new Error('negative floor duration should fail safely')
assert.equal(invalidFloor.error.code, 'invalid_duration_seconds')

const invalidServiceFee = safeCalculateReEditProServiceFeeCredits({
  actualToolCostCredits: 100,
  durationSeconds: -1,
  editLevel: 'normal',
})
assert.equal(invalidServiceFee.ok, false)
if (invalidServiceFee.ok) throw new Error('negative service-fee duration should fail safely')
assert.equal(invalidServiceFee.error.code, 'invalid_duration_seconds')

assert.equal(TOOL_COST_METERING_RATE_CARD.length, 3)
for (const entry of TOOL_COST_METERING_RATE_CARD) {
  assert.equal(entry.creditValueCents, 10)
  assert.equal(entry.serviceFeeIncluded, false)
  assert.equal(entry.productEditLevelsAreSeparate, true)
  assert.ok(entry.notes.join('\n').includes('no wallet mutation'))
}
assert.equal(TOOL_OWNER_COST_EVENT_POLICY.ownerReportsActualInternalToolCostOnly, true)
assert.equal(TOOL_OWNER_COST_EVENT_POLICY.serviceFeeIncluded, false)
assert.ok(TOOL_COST_METERING_POLICY_NOTE.includes('normal/premium/ultra_premium'))

assert.equal(normalizeEditLevelInput({ value: 'basic', inputSource: 'legacy_runtime' }).canonicalLevel, 'normal')
assert.equal(normalizeEditLevelInput({ value: 'pro', inputSource: 'legacy_runtime' }).canonicalLevel, 'premium')
assert.equal(normalizeEditLevelInput({ value: 'premium', inputSource: 'legacy_runtime' }).canonicalLevel, 'ultra_premium')
assert.equal(normalizeEditLevelInput({ value: 'premium', inputSource: 'explicit_canonical' }).canonicalLevel, 'premium')

const uiPolicyCopy = [
  createEditLevelBoundarySummary().join('\n'),
  createEditLevelEstimateNoticeModel('premium').notice,
  createEditLevelSelectedSummaryModel('premium').boundarySummary,
].join('\n')
assert.ok(
  uiPolicyCopy.includes('actual billable tool cost + ReEditPro service/edit fee'),
  'UI copy must say final charge policy adds actual billable tool cost and ReEditPro service/edit fee.',
)
assert.ok(!uiPolicyCopy.toLowerCase().includes('service fee replaces'))

const docsText = [
  'README.md',
  'pricing-and-credits.md',
  'product-plan.md',
  'credit-ledger-architecture.md',
  'docs/credit-policy.md',
  'docs/edit-level-credit-policy.md',
  'package.json',
].map(readRepoFile).join('\n')

for (const term of [
  '1 credit = $0.10',
  '100 credits = $10',
  'Action required: revised credit estimate needed',
  'Action required: add credits to export',
  'final charge = actual tool cost + ReEditPro service fee',
  'no live billing',
  'no Stripe',
  'no Supabase migration',
  'serviceFeeIncluded',
]) {
  assert.ok(docsText.includes(term), `Docs/package metadata must include: ${term}`)
}

assert.equal(REEDITPRO_REVISED_ESTIMATE_ACTION_REQUIRED_COPY.title, 'Action required: revised credit estimate needed')
assert.equal(REEDITPRO_EXPORT_LOCK_ACTION_REQUIRED_COPY.title, 'Action required: add credits to export')
assert.ok(REEDITPRO_NO_SILENT_RECOVERY_BILLING_POLICY.includes('absorbs the overage'))

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:credit-policy'],
  'tsx server/smoke/credit-policy-smoke.ts',
)

console.log('credit-policy-smoke passed')
