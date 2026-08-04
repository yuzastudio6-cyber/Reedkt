import type {
  ArtifactDependencyKind,
  ArtifactInvalidation,
  ArtifactInvalidationPolicy,
  MotionStudioArtifactKind,
  MotionStudioArtifactPayload,
  MotionStudioActiveModuleId,
  MotionStudioModuleCatalogVersion,
  MotionStudioStageProfileId,
  MotionStudioProvenance,
  ProductionCostActual,
  ProductionCostAdjustment,
  ProductionCostBudget,
  ProductionCostEstimate,
  ProductionCostEstimateItem,
  ProductionCostReconciliation,
  ProductionUsageEvent,
  PropertyLock,
  ProviderRateCard,
  SceneRecipeInstantiation,
  SceneRecipeVersion,
  ToolCostProfile,
} from '../../../src/types/motion-studio'

export type MotionStudioPersistenceRepositoryMode = 'disabled' | 'supabase_server'

export type MotionStudioPersistenceOperation =
  | 'create_production'
  | 'create_artifact_version'
  | 'append_artifact_invalidation'
  | 'append_property_lock_event'
  | 'register_scene_recipe_version'
  | 'register_recipe_instantiation'
  | 'register_provider_rate_card'
  | 'register_tool_cost_profile'
  | 'create_cost_estimate'
  | 'append_cost_budget'
  | 'append_usage_event'
  | 'append_cost_actual'
  | 'append_cost_reconciliation'
  | 'append_cost_adjustment'

export interface MotionStudioPersistenceError {
  code: 'PERSISTENCE_DISABLED' | 'INVALID_INPUT' | 'DATABASE_ERROR'
  message: string
  validationErrors?: readonly string[]
}

export interface MotionStudioPersistenceEvidence {
  repositoryMode: MotionStudioPersistenceRepositoryMode
  localCandidateOnly: true
  supabaseReadMade: boolean
  supabaseWriteMade: boolean
  supabaseWriteOutcome: 'not_attempted' | 'confirmed' | 'unknown'
  remoteDatabaseVerified: false
  providerCallMade: false
  workerJobCreated: false
  renderStarted: false
  billingActivated: false
  customerPricingCalculated: false
  customerCreditsMutated: false
}

export interface MotionStudioPersistenceResult<T> extends MotionStudioPersistenceEvidence {
  ok: boolean
  operation: MotionStudioPersistenceOperation
  data?: T
  error?: MotionStudioPersistenceError
}

export interface CreateMotionStudioProductionInput {
  editSessionId: string
  moduleId: MotionStudioActiveModuleId
  moduleCatalogVersion: MotionStudioModuleCatalogVersion
  actorUserId: string
  idempotencyKey: string
  requestHash: string
}

export interface MotionStudioProductionReceipt {
  productionId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  moduleId: MotionStudioActiveModuleId
  moduleCatalogVersion: MotionStudioModuleCatalogVersion
  stageProfileId: MotionStudioStageProfileId
  recordVersion: number
}

export interface CreateMotionStudioArtifactVersionDependencyInput {
  upstreamVersionId: string
  dependencyKind: ArtifactDependencyKind
  invalidationPolicy: ArtifactInvalidationPolicy
}

export interface CreateMotionStudioArtifactVersionInput {
  productionId: string
  artifactId?: string
  kind: MotionStudioArtifactKind
  expectedCurrentDraftVersionId?: string
  parentVersionId?: string
  state: 'draft' | 'in_review'
  payload: MotionStudioArtifactPayload
  provenance: MotionStudioProvenance
  dependencies: readonly CreateMotionStudioArtifactVersionDependencyInput[]
  actorUserId: string
  idempotencyKey: string
  requestHash: string
}

export interface MotionStudioArtifactVersionReceipt {
  productionId: string
  artifactId: string
  artifactVersionId: string
  versionNumber: number
  contentDigest: string
  state: 'draft' | 'in_review'
}

export interface AppendMotionStudioArtifactInvalidationInput {
  record: ArtifactInvalidation
  actorUserId: string
  sourceCommandId?: string
  priorInvalidationId?: string
}

export interface AppendMotionStudioPropertyLockEventInput {
  record: PropertyLock
  artifactId: string
  artifactContentDigest: string
  eventKind: 'acquired' | 'released' | 'superseded'
  priorLockEventId?: string
  actorUserId?: string
}

export interface RegisterMotionStudioSceneRecipeVersionInput {
  productionId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  artifactVersionId: string
  record: SceneRecipeVersion
  compilerId: string
  compilerFingerprint: string
  actorUserId: string
}

export interface RegisterMotionStudioRecipeInstantiationInput {
  record: SceneRecipeInstantiation
  sceneDocumentArtifactId: string
  sceneDocumentDigest: string
  recipeDefinitionDigest: string
  motionLanguageArtifactVersionId: string
  narrativeFunctionArtifactVersionId: string
  actorUserId: string
}

export interface RegisterMotionStudioProviderRateCardInput {
  record: ProviderRateCard
}

export interface RegisterMotionStudioToolCostProfileInput {
  record: ToolCostProfile
}

export interface CreateMotionStudioCostEstimateInput {
  estimate: ProductionCostEstimate
  items: readonly ProductionCostEstimateItem[]
  actorUserId: string
  idempotencyKey: string
  requestHash: string
}

export interface MotionStudioCostEstimateReceipt {
  productionId: string
  estimateId: string
  itemIds: string[]
  rateCardVersionIds: string[]
  maximumAuthorizedInternalCostMicros: number
  customerPricingIncluded: false
  customerCreditsIncluded: false
}

export interface AppendMotionStudioCostBudgetInput {
  record: ProductionCostBudget
  actorUserId: string
}

export interface AppendMotionStudioUsageEventInput {
  record: ProductionUsageEvent
  meterId: string
  actorUserId?: string
}

export interface AppendMotionStudioCostActualInput {
  record: ProductionCostActual
  actorUserId?: string
}

export interface AppendMotionStudioCostReconciliationInput {
  record: ProductionCostReconciliation
  actorUserId?: string
}

export interface AppendMotionStudioCostAdjustmentInput {
  record: ProductionCostAdjustment
  actorUserId?: string
}

export interface MotionStudioPersistedRecordReceipt {
  id: string
  table: string
}
