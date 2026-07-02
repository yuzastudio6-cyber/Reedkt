import { expect, test } from '@playwright/test'

import { createEditLevelQAGatePackage } from '../../src/lib/edit-level-qa-gates-rules'

const sideEffectFalseKeys = [
  'providerCallMade',
  'qwen3CallMade',
  'qwen25vlCallMade',
  'deepseekCallMade',
  'plannerRunCreated',
  'mediaWorkerStarted',
  'workerJobCreated',
  'renderStarted',
  'creditReservedOrSpent',
] as const

test.describe('RP-EDITLEVEL-08 QA gates', () => {
  test('keeps QA gate package mock-local with runtime QA disabled', () => {
    const qa = createEditLevelQAGatePackage('ultra_premium')

    expect(qa.sideEffectFlags.mockOnly).toBe(true)
    for (const key of sideEffectFalseKeys) {
      expect(qa.sideEffectFlags[key]).toBe(false)
      expect(qa[key]).toBe(false)
    }

    expect(qa.gates.length).toBeGreaterThan(0)
    expect(qa.gates.some((gate) => gate.status === 'future_gated' || gate.status === 'provider_required')).toBe(true)
  })
})
