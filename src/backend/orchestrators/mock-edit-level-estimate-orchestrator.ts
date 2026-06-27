import type {
  EditLevelEstimatePackage,
  EditLevelEstimateValidationResult,
  ReEditProCanonicalEditLevel,
} from '../../types'
import {
  createMockEditLevelEstimatePackage,
  createMockEditLevelEstimatePackages,
} from '../edit-level-estimates/edit-level-estimate-package-service'
import { createEditLevelTimeEstimate } from '../edit-level-estimates/edit-level-time-estimate-service'
import { createEditLevelCreditEstimate } from '../edit-level-estimates/edit-level-credit-estimate-service'
import { createEditLevelRenderBudget } from '../edit-level-estimates/edit-level-render-budget-service'
import { createEditLevelRevisionBudget } from '../edit-level-estimates/edit-level-revision-budget-service'
import {
  createEditLevelEstimateFallbackReport,
  type EditLevelEstimateFallbackReport,
} from '../edit-level-estimates/edit-level-estimate-fallback-service'
import { validateEditLevelEstimatePackage } from '../edit-level-estimates/edit-level-estimate-validation-service'
import { createEditLevelEstimateSummary } from '../edit-level-estimates/edit-level-estimate-summary-service'
import {
  createEditLevelEstimateItemRegistrySummary,
  listEditLevelEstimateItems,
} from '../edit-level-estimates/edit-level-estimate-item-registry'
import {
  listMockEditLevelEstimateScenarios,
  type MockEditLevelEstimateScenario,
} from '../edit-level-estimates/mock-edit-level-estimate-scenarios'

export interface MockEditLevelEstimateFlowResult {
  normalPackage: EditLevelEstimatePackage
  premiumPackage: EditLevelEstimatePackage
  ultraPackage: EditLevelEstimatePackage
  selectedPackage: EditLevelEstimatePackage
  validation: EditLevelEstimateValidationResult
  summary: ReturnType<typeof createEditLevelEstimateSummary> & ReturnType<typeof createEditLevelEstimateItemRegistrySummary>
  warnings: string[]
  fallback: EditLevelEstimateFallbackReport
  timeEstimate: ReturnType<typeof createEditLevelTimeEstimate>
  creditEstimate: ReturnType<typeof createEditLevelCreditEstimate>
  renderBudget: ReturnType<typeof createEditLevelRenderBudget>
  revisionBudget: ReturnType<typeof createEditLevelRevisionBudget>
  scenarios: MockEditLevelEstimateScenario[]
  nextStep: 'RP-EDITLEVEL-10 — End-to-End Internal Testing + Playwright Coverage'
  mockOnly: true
}

const nextStep: MockEditLevelEstimateFlowResult['nextStep'] =
  'RP-EDITLEVEL-10 — End-to-End Internal Testing + Playwright Coverage'

export function runMockEditLevelEstimateFlow(
  selectedLevel: ReEditProCanonicalEditLevel = 'premium',
): MockEditLevelEstimateFlowResult {
  const normalPackage = createMockEditLevelEstimatePackage({ level: 'normal' })
  const premiumPackage = createMockEditLevelEstimatePackage({ level: 'premium' })
  const ultraPackage = createMockEditLevelEstimatePackage({ level: 'ultra_premium' })
  const selectedPackage = createMockEditLevelEstimatePackage({ level: selectedLevel })

  return {
    normalPackage,
    premiumPackage,
    ultraPackage,
    selectedPackage,
    validation: validateEditLevelEstimatePackage({ estimatePackage: selectedPackage }),
    summary: {
      ...createEditLevelEstimateItemRegistrySummary(),
      ...createEditLevelEstimateSummary({ level: selectedLevel, estimatePackage: selectedPackage }),
    },
    warnings: selectedPackage.warnings,
    fallback: createEditLevelEstimateFallbackReport({ level: selectedLevel }),
    timeEstimate: createEditLevelTimeEstimate({ level: selectedLevel }),
    creditEstimate: createEditLevelCreditEstimate({ level: selectedLevel }),
    renderBudget: createEditLevelRenderBudget({ level: selectedLevel }),
    revisionBudget: createEditLevelRevisionBudget({ level: selectedLevel }),
    scenarios: listMockEditLevelEstimateScenarios(),
    nextStep,
    mockOnly: true,
  }
}

export function runMockNormalEstimateFlow(): EditLevelEstimatePackage {
  return createMockEditLevelEstimatePackage({ level: 'normal' })
}

export function runMockPremiumEstimateFlow(): EditLevelEstimatePackage {
  return createMockEditLevelEstimatePackage({ level: 'premium' })
}

export function runMockUltraEstimateFlow(): EditLevelEstimatePackage {
  return createMockEditLevelEstimatePackage({ level: 'ultra_premium' })
}

export function runMockTimeEstimateFlow(level: ReEditProCanonicalEditLevel = 'premium') {
  return createEditLevelTimeEstimate({ level })
}

export function runMockCreditEstimateFlow(level: ReEditProCanonicalEditLevel = 'premium') {
  return createEditLevelCreditEstimate({ level })
}

export function runMockRenderRevisionBudgetFlow(level: ReEditProCanonicalEditLevel = 'premium') {
  return {
    renderBudget: createEditLevelRenderBudget({ level }),
    revisionBudget: createEditLevelRevisionBudget({ level }),
    mockOnly: true,
  }
}

export function runMockEstimateFallbackFlow(level: ReEditProCanonicalEditLevel = 'premium'): EditLevelEstimateFallbackReport {
  return createEditLevelEstimateFallbackReport({ level })
}

export function runMockEstimateValidationFlow(): EditLevelEstimateValidationResult[] {
  return createMockEditLevelEstimatePackages().map((estimatePackage) =>
    validateEditLevelEstimatePackage({ estimatePackage }),
  )
}

export function runMockEstimateReadinessFlow() {
  const registry = listEditLevelEstimateItems()
  const packages = createMockEditLevelEstimatePackages()

  return {
    registry,
    packages,
    allEstimateOnly: packages.every((estimatePackage) => estimatePackage.estimateOnly),
    allSideEffectsFalse: packages.every((estimatePackage) =>
      !estimatePackage.providerCallMade &&
      !estimatePackage.qwenCallMade &&
      !estimatePackage.qwen25vlCallMade &&
      !estimatePackage.deepseekCallMade &&
      !estimatePackage.plannerExecuted &&
      !estimatePackage.editPlanCreated &&
      !estimatePackage.mediaProcessingStarted &&
      !estimatePackage.workerJobCreated &&
      !estimatePackage.renderJobCreated &&
      !estimatePackage.progressStarted &&
      !estimatePackage.creditRecordCreated &&
      !estimatePackage.creditReservedOrSpent &&
      !estimatePackage.fileBytesRead &&
      !estimatePackage.externalUrlFetched,
    ),
    nextStep,
    mockOnly: true,
  }
}
