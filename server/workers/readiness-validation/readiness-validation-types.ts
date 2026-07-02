import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
} from '../../tool-registry'
import type { ProductionContainerImageRole } from '../production-readiness'

export type ReadinessValidationMode =
  | 'static_only'
  | 'dry_run'
  | 'host_optional'
  | 'container_command_plan'
  | 'container_runtime'
  | 'production_blocked'

export type ReadinessValidationStatus =
  | 'passed'
  | 'warning'
  | 'missing'
  | 'blocked'
  | 'not_checked'
  | 'not_installed'
  | 'future_only'
  | 'evaluation_only'
  | 'needs_license_review'
  | 'needs_model_weight_review'
  | 'model_weight_missing'
  | 'model_weight_blocked'
  | 'pending_manual_review'
  | 'source_install_review_required'

export type ProductionReadinessOverallStatus =
  | 'passed'
  | 'warning'
  | 'blocked'
  | 'not_checked'

export type ProductionReadinessBlockerSeverity = 'hard_blocker' | 'warning'

export interface ProductionReadinessBlockerSummary {
  id: string
  severity: ProductionReadinessBlockerSeverity
  status: ReadinessValidationStatus
  workerType?: ProductionRegistryWorkerType
  imageRole?: ProductionContainerImageRole
  toolId?: ProductionToolId | 'revideo' | string
  message: string
  remediation: string
}

export interface ReadinessToolSummary {
  toolId: ProductionToolId
  displayName: string
  status: ReadinessValidationStatus
  expectedWorkerTypes: ProductionRegistryWorkerType[]
  imageRoles: ProductionContainerImageRole[]
  requiredForProduction: boolean
  gpuRequired: boolean
  modelWeightsRequired: boolean
  evaluationOnly: boolean
  warnings: string[]
  blockers: ProductionReadinessBlockerSummary[]
}

export interface ReadinessImageSummary {
  imageRole: ProductionContainerImageRole
  imageName: string
  dockerfilePath: string
  expectedTools: ProductionToolId[]
  requiredTools: ProductionToolId[]
  optionalTools: ProductionToolId[]
  forbiddenTools: ProductionToolId[]
  missingTools: ProductionToolId[]
  blockedTools: ProductionToolId[]
  modelWeightBlockedTools: ProductionToolId[]
  evaluationOnlyTools: ProductionToolId[]
  readinessScore: number
  productionAllowed: boolean
  blockers: ProductionReadinessBlockerSummary[]
  warnings: string[]
}

export interface ReadinessWorkerSummary {
  workerType: ProductionRegistryWorkerType
  imageRole?: ProductionContainerImageRole
  expectedTools: ProductionToolId[]
  requiredTools: ProductionToolId[]
  optionalTools: ProductionToolId[]
  missingTools: ProductionToolId[]
  blockedTools: ProductionToolId[]
  modelWeightBlockedTools: ProductionToolId[]
  evaluationOnlyTools: ProductionToolId[]
  readinessScore: number
  productionAllowed: boolean
  blockers: ProductionReadinessBlockerSummary[]
  warnings: string[]
}

export interface ReadinessModelWeightSummary {
  manifestId: string
  toolId: ProductionToolId
  modelName: string
  expectedPath: string
  status: ReadinessValidationStatus
  reviewStatus: string
  commercialUseAllowed: boolean
  blocksProduction: boolean
  warnings: string[]
  blockers: string[]
}

export interface ReadinessLicenseSummary {
  id: string
  toolId?: ProductionToolId
  status: ReadinessValidationStatus
  message: string
  manualReviewRequired: boolean
}

export interface ReadinessCommandPlan {
  id: string
  label: string
  mode: ReadinessValidationMode
  command: string
  requiredEnvVars: string[]
  safetyNotes: string[]
  expectedOutputSummary: string
  doesNotRun: string[]
}

export interface ProductionReadinessReport {
  id: string
  createdAt: string
  mode: ReadinessValidationMode
  overallStatus: ProductionReadinessOverallStatus
  workerSummaries: ReadinessWorkerSummary[]
  toolSummaries: ReadinessToolSummary[]
  imageSummaries: ReadinessImageSummary[]
  modelWeightSummaries: ReadinessModelWeightSummary[]
  licenseSummaries: ReadinessLicenseSummary[]
  blockerSummaries: ProductionReadinessBlockerSummary[]
  commandPlans: ReadinessCommandPlan[]
  warnings: string[]
  nextActions: string[]
}

export interface BuildProductionReadinessReportOptions {
  mode?: ReadinessValidationMode
  includeCommandPlans?: boolean
  includeHostOptionalResults?: boolean
}
