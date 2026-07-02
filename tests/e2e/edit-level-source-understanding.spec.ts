import { expect, test } from '@playwright/test'

import { createEditLevelSourceUnderstandingPolicyPackage } from '../../src/lib/edit-level-source-understanding-rules'

const sideEffectFalseKeys = [
  'providerCallMade',
  'qwen3CallMade',
  'qwen25vlCallMade',
  'transcriptWorkerStarted',
  'mediaWorkerStarted',
  'audioWorkerStarted',
  'graphicWorkerStarted',
  'workerJobCreated',
  'renderStarted',
  'creditReservedOrSpent',
] as const

test.describe('RP-EDITLEVEL-06 source understanding routing', () => {
  test('keeps source understanding policy mock-local with future worker gates', () => {
    const policy = createEditLevelSourceUnderstandingPolicyPackage('ultra_premium')

    expect(policy.sideEffectFlags.mockOnly).toBe(true)
    for (const key of sideEffectFalseKeys) {
      expect(policy.sideEffectFlags[key]).toBe(false)
      expect(policy[key]).toBe(false)
    }

    expect(policy.layers.length).toBeGreaterThan(0)
    expect(policy.layers.some((layer) => layer.status === 'future_gated' || layer.status === 'provider_required')).toBe(true)
  })
})
