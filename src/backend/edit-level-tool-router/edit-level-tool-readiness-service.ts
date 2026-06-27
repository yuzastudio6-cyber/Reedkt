import type {
  EditLevelToolCapabilityId,
  EditLevelToolRouterSideEffectFlags,
  ReEditProCanonicalEditLevel,
} from '../../types'
import { createEditLevelToolRouterSideEffectFlags } from '../../lib/edit-level-tool-router-rules'
import { createMockEditLevelToolRoutingPackage } from './edit-level-tool-routing-service'

export interface EditLevelToolRouterReadinessResult {
  level: ReEditProCanonicalEditLevel
  capabilityCount: number
  requiredCapabilities: EditLevelToolCapabilityId[]
  futureOnlyCapabilities: EditLevelToolCapabilityId[]
  mockRouterReady: true
  productionRouterReady: false
  providerExecutionReady: false
  workerExecutionReady: false
  renderExecutionReady: false
  creditExecutionReady: false
  warnings: string[]
  sideEffectFlags: EditLevelToolRouterSideEffectFlags
  mockOnly: true
}

export function createEditLevelToolReadiness(input: {
  level: ReEditProCanonicalEditLevel
}): EditLevelToolRouterReadinessResult {
  const routingPackage = createMockEditLevelToolRoutingPackage({ level: input.level })

  return {
    level: input.level,
    capabilityCount: routingPackage.routes.length,
    requiredCapabilities: routingPackage.requiredCapabilities,
    futureOnlyCapabilities: routingPackage.futureOnlyCapabilities,
    mockRouterReady: true,
    productionRouterReady: false,
    providerExecutionReady: false,
    workerExecutionReady: false,
    renderExecutionReady: false,
    creditExecutionReady: false,
    warnings: routingPackage.warnings,
    sideEffectFlags: createEditLevelToolRouterSideEffectFlags(),
    mockOnly: true,
  }
}

export function createAllEditLevelToolReadiness(): EditLevelToolRouterReadinessResult[] {
  return [
    createEditLevelToolReadiness({ level: 'normal' }),
    createEditLevelToolReadiness({ level: 'premium' }),
    createEditLevelToolReadiness({ level: 'ultra_premium' }),
  ]
}
