import type {
  EditLevelQwenPlanningProfilePackage,
  EditLevelQwenPlanningValidationResult,
  EditLevelQwenPromptPolicy,
  ReEditProCanonicalEditLevel,
} from '../../types'
import {
  createMockEditLevelQwenPlanningProfile,
  createMockEditLevelQwenPlanningProfiles,
} from '../edit-level-qwen-planning/edit-level-qwen-planning-profile-service'
import {
  createAllMockEditLevelQwenPromptPolicies,
  createMockEditLevelQwenPromptPolicy,
} from '../edit-level-qwen-planning/edit-level-qwen-prompt-policy-service'
import {
  createAllMockEditLevelQwenStructuredOutputPolicies,
  createMockEditLevelQwenStructuredOutputPolicy,
  type EditLevelQwenStructuredOutputPolicyResult,
} from '../edit-level-qwen-planning/edit-level-qwen-structured-output-policy-service'
import {
  createEditLevelQwenFallbackReport,
  type EditLevelQwenFallbackReport,
} from '../edit-level-qwen-planning/edit-level-qwen-fallback-policy-service'
import { createEditLevelQwenUsageEstimatePolicy } from '../edit-level-qwen-planning/edit-level-qwen-usage-estimate-policy-service'
import { validateEditLevelQwenPlanningProfile } from '../edit-level-qwen-planning/edit-level-qwen-planning-validation-service'
import { createEditLevelQwenPlanningSummary } from '../edit-level-qwen-planning/edit-level-qwen-planning-summary-service'
import {
  createEditLevelQwenPlanningDimensionRegistrySummary,
  listEditLevelQwenPlanningDimensions,
} from '../edit-level-qwen-planning/edit-level-qwen-planning-dimension-registry'
import {
  listMockEditLevelQwenPlanningScenarios,
  type MockEditLevelQwenPlanningScenario,
} from '../edit-level-qwen-planning/mock-edit-level-qwen-planning-scenarios'

export interface MockEditLevelQwenPlanningFlowResult {
  normalPackage: EditLevelQwenPlanningProfilePackage
  premiumPackage: EditLevelQwenPlanningProfilePackage
  ultraPackage: EditLevelQwenPlanningProfilePackage
  selectedPackage: EditLevelQwenPlanningProfilePackage
  promptPolicy: EditLevelQwenPromptPolicy
  structuredOutputPolicy: EditLevelQwenStructuredOutputPolicyResult
  validation: EditLevelQwenPlanningValidationResult
  fallback: EditLevelQwenFallbackReport
  usageEstimate: ReturnType<typeof createEditLevelQwenUsageEstimatePolicy>
  summary: ReturnType<typeof createEditLevelQwenPlanningSummary>
  warnings: string[]
  scenarios: MockEditLevelQwenPlanningScenario[]
  nextStep: 'RP-EDITLEVEL-08 - Level-Aware QA Gates'
  mockOnly: true
}

const nextStep: MockEditLevelQwenPlanningFlowResult['nextStep'] =
  'RP-EDITLEVEL-08 - Level-Aware QA Gates'

export function runMockEditLevelQwenPlanningFlow(
  selectedLevel: ReEditProCanonicalEditLevel = 'premium',
): MockEditLevelQwenPlanningFlowResult {
  const normalPackage = createMockEditLevelQwenPlanningProfile({ level: 'normal' })
  const premiumPackage = createMockEditLevelQwenPlanningProfile({ level: 'premium' })
  const ultraPackage = createMockEditLevelQwenPlanningProfile({ level: 'ultra_premium' })
  const selectedPackage = createMockEditLevelQwenPlanningProfile({ level: selectedLevel })

  return {
    normalPackage,
    premiumPackage,
    ultraPackage,
    selectedPackage,
    promptPolicy: createMockEditLevelQwenPromptPolicy({ level: selectedLevel }),
    structuredOutputPolicy: createMockEditLevelQwenStructuredOutputPolicy({ level: selectedLevel }),
    validation: validateEditLevelQwenPlanningProfile({ qwenPackage: selectedPackage }),
    fallback: createEditLevelQwenFallbackReport({ level: selectedLevel }),
    usageEstimate: createEditLevelQwenUsageEstimatePolicy({ level: selectedLevel }),
    summary: {
      ...createEditLevelQwenPlanningDimensionRegistrySummary(),
      ...createEditLevelQwenPlanningSummary({ level: selectedLevel, qwenPackage: selectedPackage }),
    },
    warnings: selectedPackage.warnings,
    scenarios: listMockEditLevelQwenPlanningScenarios(),
    nextStep,
    mockOnly: true,
  }
}

export function runMockNormalQwenPlanningFlow(): EditLevelQwenPlanningProfilePackage {
  return createMockEditLevelQwenPlanningProfile({ level: 'normal' })
}

export function runMockPremiumQwenPlanningFlow(): EditLevelQwenPlanningProfilePackage {
  return createMockEditLevelQwenPlanningProfile({ level: 'premium' })
}

export function runMockUltraQwenPlanningFlow(): EditLevelQwenPlanningProfilePackage {
  return createMockEditLevelQwenPlanningProfile({ level: 'ultra_premium' })
}

export function runMockQwenPromptPolicyFlow(): EditLevelQwenPromptPolicy[] {
  return createAllMockEditLevelQwenPromptPolicies()
}

export function runMockQwenStructuredOutputPolicyFlow(): EditLevelQwenStructuredOutputPolicyResult[] {
  return createAllMockEditLevelQwenStructuredOutputPolicies()
}

export function runMockQwenFallbackFlow(level: ReEditProCanonicalEditLevel = 'premium'): EditLevelQwenFallbackReport {
  return createEditLevelQwenFallbackReport({ level })
}

export function runMockQwenPlanningValidationFlow(): EditLevelQwenPlanningValidationResult[] {
  return createMockEditLevelQwenPlanningProfiles().map((qwenPackage) =>
    validateEditLevelQwenPlanningProfile({ qwenPackage }),
  )
}

export function runMockQwenPlanningReadinessFlow() {
  const registry = listEditLevelQwenPlanningDimensions()
  const packages = createMockEditLevelQwenPlanningProfiles()

  return {
    registry,
    packages,
    allMockOnly: packages.every((qwenPackage) => qwenPackage.mockOnly),
    allSideEffectsFalse: packages.every((qwenPackage) =>
      !qwenPackage.providerCallMade &&
      !qwenPackage.qwenCallMade &&
      !qwenPackage.qwen25vlCallMade &&
      !qwenPackage.deepseekCallMade &&
      !qwenPackage.plannerExecuted &&
      !qwenPackage.editPlanCreated &&
      !qwenPackage.workerJobCreated &&
      !qwenPackage.renderJobCreated &&
      !qwenPackage.creditReservedOrSpent &&
      !qwenPackage.fileBytesRead &&
      !qwenPackage.externalUrlFetched,
    ),
    nextStep,
    mockOnly: true,
  }
}
