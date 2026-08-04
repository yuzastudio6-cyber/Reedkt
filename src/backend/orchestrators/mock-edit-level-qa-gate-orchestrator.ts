import type {
  EditLevelQAGatePackage,
  EditLevelQAGateValidationResult,
  ReEditProCanonicalEditLevel,
} from '../../types'
import {
  createMockEditLevelQAGatePackage,
  createMockEditLevelQAGatePackages,
} from '../edit-level-qa-gates/edit-level-qa-gate-routing-service'
import {
  createEditLevelQAFallbackReport,
  type EditLevelQAFallbackReport,
} from '../edit-level-qa-gates/edit-level-qa-fallback-service'
import { createEditLevelQAReadinessReport } from '../edit-level-qa-gates/edit-level-qa-readiness-service'
import { validateEditLevelQAGatePackage } from '../edit-level-qa-gates/edit-level-qa-validation-service'
import { createEditLevelQAGateSummary } from '../edit-level-qa-gates/edit-level-qa-summary-service'
import {
  createEditLevelQAGateRegistrySummary,
  listEditLevelQAGates,
} from '../edit-level-qa-gates/edit-level-qa-gate-registry'
import {
  listMockEditLevelQAGateScenarios,
  type MockEditLevelQAGateScenario,
} from '../edit-level-qa-gates/mock-edit-level-qa-gate-scenarios'

export interface MockEditLevelQAGateFlowResult {
  normalPackage: EditLevelQAGatePackage
  premiumPackage: EditLevelQAGatePackage
  ultraPackage: EditLevelQAGatePackage
  selectedPackage: EditLevelQAGatePackage
  validation: EditLevelQAGateValidationResult
  fallback: EditLevelQAFallbackReport
  readiness: ReturnType<typeof createEditLevelQAReadinessReport>
  summary: ReturnType<typeof createEditLevelQAGateSummary> & ReturnType<typeof createEditLevelQAGateRegistrySummary>
  warnings: string[]
  scenarios: MockEditLevelQAGateScenario[]
  nextStep: 'RP-EDITLEVEL-09 - Level-Aware Estimates: Time, Credits, Render Budget'
  mockOnly: true
}

const nextStep: MockEditLevelQAGateFlowResult['nextStep'] =
  'RP-EDITLEVEL-09 - Level-Aware Estimates: Time, Credits, Render Budget'

export function runMockEditLevelQAGateFlow(
  selectedLevel: ReEditProCanonicalEditLevel = 'premium',
): MockEditLevelQAGateFlowResult {
  const normalPackage = createMockEditLevelQAGatePackage({ level: 'normal' })
  const premiumPackage = createMockEditLevelQAGatePackage({ level: 'premium' })
  const ultraPackage = createMockEditLevelQAGatePackage({ level: 'ultra_premium' })
  const selectedPackage = createMockEditLevelQAGatePackage({ level: selectedLevel })

  return {
    normalPackage,
    premiumPackage,
    ultraPackage,
    selectedPackage,
    validation: validateEditLevelQAGatePackage({ qaPackage: selectedPackage }),
    fallback: createEditLevelQAFallbackReport({ level: selectedLevel }),
    readiness: createEditLevelQAReadinessReport({ level: selectedLevel, qaPackage: selectedPackage }),
    summary: {
      ...createEditLevelQAGateRegistrySummary(),
      ...createEditLevelQAGateSummary({ level: selectedLevel, qaPackage: selectedPackage }),
    },
    warnings: selectedPackage.warnings,
    scenarios: listMockEditLevelQAGateScenarios(),
    nextStep,
    mockOnly: true,
  }
}

export function runMockNormalQAGateFlow(): EditLevelQAGatePackage {
  return createMockEditLevelQAGatePackage({ level: 'normal' })
}

export function runMockPremiumQAGateFlow(): EditLevelQAGatePackage {
  return createMockEditLevelQAGatePackage({ level: 'premium' })
}

export function runMockUltraQAGateFlow(): EditLevelQAGatePackage {
  return createMockEditLevelQAGatePackage({ level: 'ultra_premium' })
}

export function runMockQAGateFallbackFlow(level: ReEditProCanonicalEditLevel = 'premium'): EditLevelQAFallbackReport {
  return createEditLevelQAFallbackReport({ level })
}

export function runMockQAGateValidationFlow(): EditLevelQAGateValidationResult[] {
  return createMockEditLevelQAGatePackages().map((qaPackage) =>
    validateEditLevelQAGatePackage({ qaPackage }),
  )
}

export function runMockQAGateReadinessFlow() {
  const registry = listEditLevelQAGates()
  const packages = createMockEditLevelQAGatePackages()

  return {
    registry,
    packages,
    allMockOnly: packages.every((qaPackage) => qaPackage.mockOnly),
    allSideEffectsFalse: packages.every((qaPackage) =>
      !qaPackage.providerCallMade &&
      !qaPackage.qwenCallMade &&
      !qaPackage.qwen25vlCallMade &&
      !qaPackage.deepseekCallMade &&
      !qaPackage.plannerExecuted &&
      !qaPackage.editPlanCreated &&
      !qaPackage.mediaProcessingStarted &&
      !qaPackage.workerJobCreated &&
      !qaPackage.renderJobCreated &&
      !qaPackage.creditReservedOrSpent &&
      !qaPackage.fileBytesRead &&
      !qaPackage.externalUrlFetched,
    ),
    nextStep,
    mockOnly: true,
  }
}
