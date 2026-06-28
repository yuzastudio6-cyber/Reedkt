import { expect, test } from '@playwright/test'

import { createEditLevelEstimatePackage } from '../../src/lib/edit-level-estimates-rules'

const sideEffectFalseKeys = [
  'providerCallMade',
  'plannerRunCreated',
  'creditEstimateCreated',
  'creditReservedOrSpent',
  'walletMutated',
  'ledgerWritten',
  'workerJobCreated',
  'renderStarted',
] as const

test.describe('RP-EDITLEVEL-09 estimates', () => {
  test('keeps estimate packages estimate-only with no credit mutation', () => {
    const estimates = createEditLevelEstimatePackage('premium')

    expect(estimates.sideEffectFlags.mockOnly).toBe(true)
    for (const key of sideEffectFalseKeys) {
      expect(estimates.sideEffectFlags[key]).toBe(false)
      expect(estimates[key]).toBe(false)
    }

    expect(estimates.estimateOnly).toBe(true)
    expect(estimates.creditsReservedOrSpent).toBe(false)
    expect(estimates.estimateItems.length).toBeGreaterThan(0)
  })
})
