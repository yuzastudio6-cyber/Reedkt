import type {
  EditLevelToolRouterValidationResult,
  EditLevelToolRoutingPackage,
  ReEditProCanonicalEditLevel,
} from '../../types'
import {
  createEditLevelToolCapabilityRegistrySummary,
  listEditLevelToolCapabilities,
  type EditLevelToolCapabilityRegistryResult,
} from '../edit-level-tool-router/edit-level-tool-capability-registry'
import {
  createAllEditLevelToolReadiness,
  createEditLevelToolReadiness,
  type EditLevelToolRouterReadinessResult,
} from '../edit-level-tool-router/edit-level-tool-readiness-service'
import {
  createMockEditLevelToolRoutingPackage,
  createMockEditLevelToolRoutingPackages,
} from '../edit-level-tool-router/edit-level-tool-routing-service'
import {
  createEditLevelToolFallbackReport,
  type EditLevelToolFallbackReport,
} from '../edit-level-tool-router/edit-level-tool-fallback-service'
import { validateEditLevelToolRoutingPackage } from '../edit-level-tool-router/edit-level-tool-router-validation-service'
import { createEditLevelToolRouterSummary } from '../edit-level-tool-router/edit-level-tool-router-summary-service'
import {
  listMockEditLevelToolRouterScenarios,
  type MockEditLevelToolRouterScenario,
} from '../edit-level-tool-router/mock-edit-level-tool-router-scenarios'

export interface MockEditLevelToolRouterFlowResult {
  capabilityRegistry: EditLevelToolCapabilityRegistryResult
  normalPackage: EditLevelToolRoutingPackage
  premiumPackage: EditLevelToolRoutingPackage
  ultraPackage: EditLevelToolRoutingPackage
  selectedPackage: EditLevelToolRoutingPackage
  validation: EditLevelToolRouterValidationResult
  readiness: EditLevelToolRouterReadinessResult
  fallback: EditLevelToolFallbackReport
  summary: string[]
  warnings: string[]
  scenarios: MockEditLevelToolRouterScenario[]
  nextStep: 'RP-EDITLEVEL-06 - Level-Aware Source Video Understanding Routing'
}

const nextStep: MockEditLevelToolRouterFlowResult['nextStep'] =
  'RP-EDITLEVEL-06 - Level-Aware Source Video Understanding Routing'

export function runMockEditLevelToolRouterFlow(
  selectedLevel: ReEditProCanonicalEditLevel = 'premium',
): MockEditLevelToolRouterFlowResult {
  const normalPackage = createMockEditLevelToolRoutingPackage({ level: 'normal' })
  const premiumPackage = createMockEditLevelToolRoutingPackage({ level: 'premium' })
  const ultraPackage = createMockEditLevelToolRoutingPackage({ level: 'ultra_premium' })
  const selectedPackage = createMockEditLevelToolRoutingPackage({ level: selectedLevel })

  return {
    capabilityRegistry: listEditLevelToolCapabilities(),
    normalPackage,
    premiumPackage,
    ultraPackage,
    selectedPackage,
    validation: validateEditLevelToolRoutingPackage({ routingPackage: selectedPackage }),
    readiness: createEditLevelToolReadiness({ level: selectedLevel }),
    fallback: createEditLevelToolFallbackReport({ level: selectedLevel }),
    summary: [
      ...createEditLevelToolCapabilityRegistrySummary(),
      ...createEditLevelToolRouterSummary({ level: selectedLevel }),
    ],
    warnings: [
      'Mock/local router only; no tool execution occurs.',
      'No Qwen 3.7, Qwen2.5-VL, DeepSeek, media, worker, render, Supabase, or credit operation occurs.',
    ],
    scenarios: listMockEditLevelToolRouterScenarios(),
    nextStep,
  }
}

export function runMockNormalToolRoutingFlow(): EditLevelToolRoutingPackage {
  return createMockEditLevelToolRoutingPackage({ level: 'normal' })
}

export function runMockPremiumToolRoutingFlow(): EditLevelToolRoutingPackage {
  return createMockEditLevelToolRoutingPackage({ level: 'premium' })
}

export function runMockUltraToolRoutingFlow(): EditLevelToolRoutingPackage {
  return createMockEditLevelToolRoutingPackage({ level: 'ultra_premium' })
}

export function runMockToolCapabilityRegistryFlow(): EditLevelToolCapabilityRegistryResult {
  return listEditLevelToolCapabilities()
}

export function runMockToolFallbackFlow(level: ReEditProCanonicalEditLevel = 'premium'): EditLevelToolFallbackReport {
  return createEditLevelToolFallbackReport({ level })
}

export function runMockToolRouterValidationFlow(): EditLevelToolRouterValidationResult[] {
  return createMockEditLevelToolRoutingPackages().map((routingPackage) =>
    validateEditLevelToolRoutingPackage({ routingPackage }),
  )
}

export function runMockToolRouterReadinessFlow(): EditLevelToolRouterReadinessResult[] {
  return createAllEditLevelToolReadiness()
}
