import type { ProductionRegistryWorkerType, ProductionToolId } from '../../tool-registry'

export type ContainerBuildImageId =
  | 'api'
  | 'tool-readiness-worker'
  | 'cpu-worker'
  | 'qa-worker'
  | 'render-worker'
  | 'gpu-worker'

export type ContainerBuildMode =
  | 'static_plan'
  | 'report_from_logs'
  | 'phase21_blocked'

export type ContainerBuildResultStatus =
  | 'not_run'
  | 'planned'
  | 'passed'
  | 'failed'
  | 'warning'
  | 'skipped'
  | 'blocked'

export type ParsedContainerBuildStatus =
  | 'passed'
  | 'failed'
  | 'warning'
  | 'blocked'
  | 'unknown'

export interface ContainerImageBuildPlan {
  imageId: ContainerBuildImageId
  displayName: string
  workerType: ProductionRegistryWorkerType
  dockerfilePath: string
  contextPath: string
  requiredBuildArgs: string[]
  requiredEnvVars: string[]
  expectedImageNameTemplate: string
  expectedArtifactRegistryPathTemplate: string
  buildOrder: number
  buildRequiredForPhase21: boolean
  buildRequiredForPhase24: boolean
  buildRequiredForGpuPhase: boolean
  optionalForNonGpuStaging: boolean
  requiredForGpuPhase: boolean
  heavyBuild: boolean
  expectedTools: ProductionToolId[]
  forbiddenTools: ProductionToolId[]
  forbiddenBehaviors: string[]
  modelDownloadsAllowed: false
  secretsAllowed: false
  revideoAllowed: false
  notes: string[]
}

export interface ContainerBuildCommandPlan {
  commandId: string
  imageId: ContainerBuildImageId
  imageTag: string
  dockerfilePath: string
  contextPath: string
  fullImageName: string
  commandString: string
  safeToRunManually: boolean
  requiresHumanConfirmation: true
  doesNotDo: string[]
  warnings: string[]
}

export interface ParsedContainerBuildLog {
  parsedStatus: ParsedContainerBuildStatus
  imageId?: ContainerBuildImageId
  detectedImageId?: string
  detectedDigest?: string
  errors: string[]
  warnings: string[]
  forbiddenFindings: string[]
  nextActions: string[]
}

export interface ContainerBuildResult {
  imageId: ContainerBuildImageId | 'unknown'
  status: ContainerBuildResultStatus
  imageTag?: string
  fullImageName?: string
  logPath?: string
  parsedLog?: ParsedContainerBuildLog
  detectedImageId?: string
  detectedDigest?: string
  warnings: string[]
  errors: string[]
}

export interface ContainerBuildBlocker {
  id: string
  imageId?: ContainerBuildImageId | 'unknown'
  summary: string
}

export interface ContainerBuildWarning {
  id: string
  imageId?: ContainerBuildImageId | 'unknown'
  summary: string
}

export interface ContainerBuildNextAction {
  id: string
  title: string
  summary: string
}

export interface ContainerBuildPhase21Readiness {
  readyForContainerReadinessValidation: boolean
  readyForNonGpuContainerReadinessValidation: boolean
  requiredImagesBuilt: ContainerBuildImageId[]
  optionalImagesDeferred: ContainerBuildImageId[]
  blockers: string[]
  warnings: string[]
}

export interface ContainerBuildReport {
  reportId: string
  createdAt: string
  mode: ContainerBuildMode
  imageTag?: string
  imagePlans: ContainerImageBuildPlan[]
  commandPlans: ContainerBuildCommandPlan[]
  buildResults: ContainerBuildResult[]
  blockers: ContainerBuildBlocker[]
  warnings: ContainerBuildWarning[]
  phase21Readiness: ContainerBuildPhase21Readiness
  nextActions: ContainerBuildNextAction[]
  dockerBuildExecuted: false
  dockerPushExecuted: false
  gcloudExecuted: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}

export interface BuildContainerBuildReportInput {
  mode?: ContainerBuildMode
  imageTag?: string
  buildResults?: ContainerBuildResult[]
  createdAt?: string
  packageLockChanged?: boolean
}
