import { expect, test } from '@playwright/test'

import { createEditLevelQwenPlanningProfilePackage } from '../../src/lib/edit-level-qwen-planning-rules'

const sideEffectFalseKeys = [
  'providerCallMade',
  'qwen3CallMade',
  'qwen25vlCallMade',
  'deepseekCallMade',
  'plannerRunCreated',
  'editPlanCreated',
  'workerJobCreated',
  'renderStarted',
  'creditReservedOrSpent',
] as const

test.describe('RP-EDITLEVEL-07 Qwen planning profile', () => {
  test('keeps Qwen planning profile policy-only with provider calls disabled', () => {
    const qwen = createEditLevelQwenPlanningProfilePackage('premium')

    expect(qwen.sideEffectFlags.mockOnly).toBe(true)
    for (const key of sideEffectFalseKeys) {
      expect(qwen.sideEffectFlags[key]).toBe(false)
      expect(qwen[key]).toBe(false)
    }

    expect(qwen.dimensions.length).toBeGreaterThan(0)
    expect(qwen.creditBehavior).toBe('estimate_only_no_spend')
    expect(qwen.dimensions.some((dimension) => dimension.dimensionId === 'qwen_reasoning_depth')).toBe(true)
  })
})
