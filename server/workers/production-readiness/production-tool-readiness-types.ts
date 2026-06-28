import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
} from '../../tool-registry'

export type ProductionReadinessCheckMode =
  | 'command_version'
  | 'python_import'
  | 'node_import'
  | 'model_weight_presence'
  | 'env_config'
  | 'dockerfile_declared'
  | 'registry_policy_only'
  | 'evaluation_blocked'
  | 'manual_review_required'

export type ProductionReadinessStatus =
  | 'passed'
  | 'warning'
  | 'missing'
  | 'blocked'
  | 'not_installed'
  | 'future_only'
  | 'evaluation_only'
  | 'needs_license_review'
  | 'pending_manual_review'
  | 'source_install_review_required'
  | 'not_checked'

export type ProductionContainerImageRole =
  | 'api'
  | 'cpu_worker'
  | 'gpu_worker'
  | 'render_worker'
  | 'qa_worker'
  | 'tool_readiness_worker'

export interface ProductionReadinessCommandCheck {
  command: string
  versionArgs: string[]
  expectedPattern?: string
}

export interface ProductionReadinessImportCheck {
  packageName: string
  importName: string
}

export interface ProductionModelWeightCheck {
  modelName: string
  requiredForProduction: boolean
  licenseReviewRequired: boolean
  pathHint: string
}

export interface ProductionEnvironmentCheck {
  variableName: string
  requiredForProduction: boolean
  secretPlaceholderOnly: boolean
}

export interface ProductionToolReadinessSpec {
  toolId: ProductionToolId
  displayName: string
  expectedWorkerTypes: ProductionRegistryWorkerType[]
  imageRoles: ProductionContainerImageRole[]
  checkMode: ProductionReadinessCheckMode[]
  requiredForMilestone: number
  productionRequired: boolean
  gpuRequired: boolean
  commandChecks: ProductionReadinessCommandCheck[]
  pythonImportChecks: ProductionReadinessImportCheck[]
  nodePackageChecks: ProductionReadinessImportCheck[]
  modelWeightChecks: ProductionModelWeightCheck[]
  environmentChecks: ProductionEnvironmentCheck[]
  expectedArtifacts: string[]
  blocksProductionIfMissing: boolean
  blocksWorkerTypes: ProductionRegistryWorkerType[]
  readinessStatusWhenMissing: ProductionReadinessStatus
  evaluationOnly: boolean
  notes: string[]
}

export interface ProductionToolReadinessResult {
  toolId: ProductionToolId
  displayName: string
  status: ProductionReadinessStatus
  dryRun: boolean
  commandChecks: ProductionReadinessCommandCheck[]
  pythonImportChecks: ProductionReadinessImportCheck[]
  nodePackageChecks: ProductionReadinessImportCheck[]
  modelWeightChecks: ProductionModelWeightCheck[]
  environmentChecks: ProductionEnvironmentCheck[]
  warnings: string[]
  blocksProduction: boolean
  checkedAt: string
}

export interface ProductionToolReadinessSummary {
  totalSpecs: number
  launchCoreTools: ProductionToolId[]
  missingTools: ProductionToolId[]
  futureOnlyTools: ProductionToolId[]
  evaluationOnlyTools: ProductionToolId[]
  modelWeightTools: ProductionToolId[]
  productionBlockedTools: ProductionToolId[]
  statuses: Record<ProductionReadinessStatus, number>
  notes: string[]
}
