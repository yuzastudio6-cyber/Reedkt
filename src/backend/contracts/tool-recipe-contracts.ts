import type { ID, ISODateString } from '../../types/shared'
import type {
  EstimatedCostTier,
  ProductionRecipeFamily,
  ProductionWorkerType,
  RecipeAnalysisRequirement,
  RecipeApprovalPolicy,
  RecipeArtifactPolicy,
  RecipeConfidencePolicy,
  RecipeExecutionStep,
  RecipeFallbackPolicy,
  RecipeInputRequirement,
  RecipeLicensePolicy,
  RecipeQualityCheck,
  RecipeRenderIntegration,
  RecipeTimelineIntegration,
  ToolRecipeStatus,
} from './production-tool-runtime-contracts'

export interface ToolRecipe {
  recipeId: ID
  version: string
  capability: ProductionRecipeFamily
  displayName: string
  description: string
  status: ToolRecipeStatus
  supportedIntentTypes: string[]
  requiredInputs: RecipeInputRequirement[]
  optionalInputs: RecipeInputRequirement[]
  requiredAnalysis: RecipeAnalysisRequirement[]
  primaryToolIds: string[]
  fallbackToolIds: string[]
  workerType: ProductionWorkerType
  gpuRequired: boolean
  estimatedCostTier: EstimatedCostTier
  executionSteps: RecipeExecutionStep[]
  qaChecks: RecipeQualityCheck[]
  fallbackPolicy: RecipeFallbackPolicy
  confidencePolicy: RecipeConfidencePolicy
  artifactPolicy: RecipeArtifactPolicy
  timelineIntegration: RecipeTimelineIntegration
  renderIntegration: RecipeRenderIntegration
  approvalPolicy: RecipeApprovalPolicy
  licensePolicy: RecipeLicensePolicy
  createdAt: ISODateString
  updatedAt: ISODateString
}
