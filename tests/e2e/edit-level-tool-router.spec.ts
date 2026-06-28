import { expect, test } from '@playwright/test'

import { createEditLevelToolRoutingPackage } from '../../src/lib/edit-level-tool-router-rules'

const sideEffectFalseKeys = [
  'providerCallMade',
  'qwen3CallMade',
  'qwen25vlCallMade',
  'deepseekCallMade',
  'workerJobCreated',
  'renderStarted',
  'creditReservedOrSpent',
] as const

test.describe('RP-EDITLEVEL-05 tool capability router', () => {
  test('keeps tool routing mock-local with no execution side effects', () => {
    const routing = createEditLevelToolRoutingPackage('premium')

    expect(routing.sideEffectFlags.mockOnly).toBe(true)
    for (const key of sideEffectFalseKeys) {
      expect(routing.sideEffectFlags[key]).toBe(false)
      expect(routing[key]).toBe(false)
    }

    expect(routing.routes.length).toBeGreaterThan(0)
    expect(routing.routes.some((route) => route.capabilityId === 'qwen_3_reasoning')).toBe(true)
    expect(routing.routes.some((route) => route.status === 'future_gated' || route.status === 'runtime_disabled')).toBe(true)
  })
})
