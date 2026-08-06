import type { MotionStudioPersistenceRepository } from './repository'
import { createDisabledMotionStudioPersistenceRepository } from './supabase-repository'
import type {
  AppendMotionStudioArtifactInvalidationInput,
  AppendMotionStudioCostActualInput,
  AppendMotionStudioCostAdjustmentInput,
  AppendMotionStudioCostBudgetInput,
  AppendMotionStudioCostReconciliationInput,
  AppendMotionStudioPropertyLockEventInput,
  AppendMotionStudioUsageEventInput,
  CreateMotionStudioArtifactVersionInput,
  CreateMotionStudioCostEstimateInput,
  CreateMotionStudioProductionInput,
  RegisterMotionStudioProviderRateCardInput,
  RegisterMotionStudioRecipeInstantiationInput,
  RegisterMotionStudioSceneRecipeVersionInput,
  RegisterMotionStudioToolCostProfileInput,
} from './types'

/**
 * Server-only orchestration seam. It intentionally contains no auth route,
 * provider, job, render, billing, pricing, credit, or client construction.
 */
export class MotionStudioPersistenceService {
  private readonly repository: MotionStudioPersistenceRepository

  constructor(repository?: MotionStudioPersistenceRepository) {
    this.repository = repository ?? createDisabledMotionStudioPersistenceRepository()
  }

  createProduction(input: CreateMotionStudioProductionInput) {
    return this.repository.createProduction(input)
  }

  createArtifactVersion(input: CreateMotionStudioArtifactVersionInput) {
    return this.repository.createArtifactVersion(input)
  }

  appendArtifactInvalidation(input: AppendMotionStudioArtifactInvalidationInput) {
    return this.repository.appendArtifactInvalidation(input)
  }

  appendPropertyLockEvent(input: AppendMotionStudioPropertyLockEventInput) {
    return this.repository.appendPropertyLockEvent(input)
  }

  registerSceneRecipeVersion(input: RegisterMotionStudioSceneRecipeVersionInput) {
    return this.repository.registerSceneRecipeVersion(input)
  }

  registerRecipeInstantiation(input: RegisterMotionStudioRecipeInstantiationInput) {
    return this.repository.registerRecipeInstantiation(input)
  }

  registerProviderRateCard(input: RegisterMotionStudioProviderRateCardInput) {
    return this.repository.registerProviderRateCard(input)
  }

  registerToolCostProfile(input: RegisterMotionStudioToolCostProfileInput) {
    return this.repository.registerToolCostProfile(input)
  }

  createCostEstimate(input: CreateMotionStudioCostEstimateInput) {
    return this.repository.createCostEstimate(input)
  }

  appendCostBudget(input: AppendMotionStudioCostBudgetInput) {
    return this.repository.appendCostBudget(input)
  }

  appendUsageEvent(input: AppendMotionStudioUsageEventInput) {
    return this.repository.appendUsageEvent(input)
  }

  appendCostActual(input: AppendMotionStudioCostActualInput) {
    return this.repository.appendCostActual(input)
  }

  appendCostReconciliation(input: AppendMotionStudioCostReconciliationInput) {
    return this.repository.appendCostReconciliation(input)
  }

  appendCostAdjustment(input: AppendMotionStudioCostAdjustmentInput) {
    return this.repository.appendCostAdjustment(input)
  }
}
