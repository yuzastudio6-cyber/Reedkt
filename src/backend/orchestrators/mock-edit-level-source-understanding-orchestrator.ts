import type {
  EditLevelMarkerContextPolicy,
  EditLevelQwenContextPolicy,
  EditLevelSourceUnderstandingPolicyPackage,
  EditLevelSourceUnderstandingValidationResult,
  ReEditProCanonicalEditLevel,
} from '../../types'
import {
  createAllMockEditLevelMarkerContextPolicies,
  createMockEditLevelMarkerContextPolicy,
} from '../edit-level-source-understanding/edit-level-marker-context-policy-service'
import {
  createAllMockEditLevelQwenContextPolicies,
  createMockEditLevelQwenContextPolicy,
} from '../edit-level-source-understanding/edit-level-qwen-context-policy-service'
import {
  createMockEditLevelSourceUnderstandingPackage,
  createMockEditLevelSourceUnderstandingPackages,
} from '../edit-level-source-understanding/edit-level-source-understanding-routing-service'
import {
  createEditLevelSourceUnderstandingFallbackReport,
  type EditLevelSourceUnderstandingFallbackReport,
} from '../edit-level-source-understanding/edit-level-source-understanding-fallback-service'
import { validateEditLevelSourceUnderstandingPackage } from '../edit-level-source-understanding/edit-level-source-understanding-validation-service'
import { createEditLevelSourceUnderstandingSummary } from '../edit-level-source-understanding/edit-level-source-understanding-summary-service'
import {
  createEditLevelSourceUnderstandingLayerRegistrySummary,
  listEditLevelSourceUnderstandingLayers,
} from '../edit-level-source-understanding/edit-level-source-understanding-layer-registry'
import {
  listMockEditLevelSourceUnderstandingScenarios,
  type MockEditLevelSourceUnderstandingScenario,
} from '../edit-level-source-understanding/mock-edit-level-source-understanding-scenarios'

export interface MockEditLevelSourceUnderstandingFlowResult {
  normalPackage: EditLevelSourceUnderstandingPolicyPackage
  premiumPackage: EditLevelSourceUnderstandingPolicyPackage
  ultraPackage: EditLevelSourceUnderstandingPolicyPackage
  selectedPackage: EditLevelSourceUnderstandingPolicyPackage
  markerContextPolicy: EditLevelMarkerContextPolicy
  qwenContextPolicy: EditLevelQwenContextPolicy
  validation: EditLevelSourceUnderstandingValidationResult
  fallback: EditLevelSourceUnderstandingFallbackReport
  summary: ReturnType<typeof createEditLevelSourceUnderstandingSummary>
  warnings: string[]
  scenarios: MockEditLevelSourceUnderstandingScenario[]
  nextStep: 'RP-EDITLEVEL-07 - Level-Aware Qwen Planning Profile'
  mockOnly: true
}

const nextStep: MockEditLevelSourceUnderstandingFlowResult['nextStep'] =
  'RP-EDITLEVEL-07 - Level-Aware Qwen Planning Profile'

export function runMockEditLevelSourceUnderstandingFlow(
  selectedLevel: ReEditProCanonicalEditLevel = 'premium',
): MockEditLevelSourceUnderstandingFlowResult {
  const normalPackage = createMockEditLevelSourceUnderstandingPackage({ level: 'normal' })
  const premiumPackage = createMockEditLevelSourceUnderstandingPackage({ level: 'premium' })
  const ultraPackage = createMockEditLevelSourceUnderstandingPackage({ level: 'ultra_premium' })
  const selectedPackage = createMockEditLevelSourceUnderstandingPackage({ level: selectedLevel })

  return {
    normalPackage,
    premiumPackage,
    ultraPackage,
    selectedPackage,
    markerContextPolicy: createMockEditLevelMarkerContextPolicy({ level: selectedLevel }),
    qwenContextPolicy: createMockEditLevelQwenContextPolicy({ level: selectedLevel }),
    validation: validateEditLevelSourceUnderstandingPackage({ routingPackage: selectedPackage }),
    fallback: createEditLevelSourceUnderstandingFallbackReport({ level: selectedLevel }),
    summary: {
      ...createEditLevelSourceUnderstandingLayerRegistrySummary(),
      ...createEditLevelSourceUnderstandingSummary({ level: selectedLevel, routingPackage: selectedPackage }),
    },
    warnings: selectedPackage.warnings,
    scenarios: listMockEditLevelSourceUnderstandingScenarios(),
    nextStep,
    mockOnly: true,
  }
}

export function runMockNormalSourceUnderstandingFlow(): EditLevelSourceUnderstandingPolicyPackage {
  return createMockEditLevelSourceUnderstandingPackage({ level: 'normal' })
}

export function runMockPremiumSourceUnderstandingFlow(): EditLevelSourceUnderstandingPolicyPackage {
  return createMockEditLevelSourceUnderstandingPackage({ level: 'premium' })
}

export function runMockUltraSourceUnderstandingFlow(): EditLevelSourceUnderstandingPolicyPackage {
  return createMockEditLevelSourceUnderstandingPackage({ level: 'ultra_premium' })
}

export function runMockMarkerContextPolicyFlow(): EditLevelMarkerContextPolicy[] {
  return createAllMockEditLevelMarkerContextPolicies()
}

export function runMockQwenContextPolicyFlow(): EditLevelQwenContextPolicy[] {
  return createAllMockEditLevelQwenContextPolicies()
}

export function runMockSourceUnderstandingFallbackFlow(
  level: ReEditProCanonicalEditLevel = 'premium',
): EditLevelSourceUnderstandingFallbackReport {
  return createEditLevelSourceUnderstandingFallbackReport({ level })
}

export function runMockSourceUnderstandingValidationFlow(): EditLevelSourceUnderstandingValidationResult[] {
  return createMockEditLevelSourceUnderstandingPackages().map((routingPackage) =>
    validateEditLevelSourceUnderstandingPackage({ routingPackage }),
  )
}

export function runMockSourceUnderstandingReadinessFlow() {
  const registry = listEditLevelSourceUnderstandingLayers()
  const packages = createMockEditLevelSourceUnderstandingPackages()

  return {
    registry,
    packages,
    allMockOnly: packages.every((routingPackage) => routingPackage.mockOnly),
    allSideEffectsFalse: packages.every((routingPackage) =>
      !routingPackage.providerCallMade &&
      !routingPackage.qwen3CallMade &&
      !routingPackage.qwen25vlCallMade &&
      !routingPackage.mediaProcessingStarted &&
      !routingPackage.workerJobCreated &&
      !routingPackage.renderJobCreated &&
      !routingPackage.creditReservedOrSpent &&
      !routingPackage.fileBytesRead &&
      !routingPackage.externalUrlFetched,
    ),
    nextStep,
    mockOnly: true,
  }
}
