export type StagingDeployTargetId =
  | 'api'
  | 'tool-readiness-job'
  | 'cpu-analysis-job'
  | 'qa-job'
  | 'render-job'
  | 'gpu-ai-job'

export type StagingDeployMode =
  | 'static_plan'
  | 'report_from_logs'
  | 'architecture_blocked'

export type StagingDeployStatus =
  | 'planned'
  | 'deployed'
  | 'ready'
  | 'failed'
  | 'blocked'
  | 'deferred'
  | 'not_run'

export interface StagingDeployConfig {
  projectId: string
  region: string
  environment: 'staging'
  imageTag: string
  confirmDeploy: boolean
}

export interface StagingDeployImageRef {
  targetId: StagingDeployTargetId
  image: string
  digest: string
  fullImageRef: string
}

export interface StagingImageArchitectureResult {
  targetId: StagingDeployTargetId
  imageRef: string
  platforms: string[]
  hasLinuxAmd64: boolean
  hasLinuxArm64: boolean
  compatibleWithCloudRun: boolean
  rawEvidencePath?: string
  warnings: string[]
  blockers: string[]
}

export interface StagingCloudRunServicePlan {
  serviceName: string
  imageRef: string
  region: string
  serviceAccountEmail: string
  allowUnauthenticated: false
  minInstances: 0
  cpu: string
  memory: string
  concurrency: number
  envVars: Record<string, string>
  secretsMounted: false
  notes: string[]
}

export interface StagingCloudRunJobPlan {
  jobName: string
  targetId: StagingDeployTargetId
  imageRef: string
  region: string
  serviceAccountEmail: string
  cpu: string
  memory: string
  tasks: 1
  parallelism: 1
  maxRetries: number
  envVars: Record<string, string>
  command: string[]
  secretsMounted: false
  executionAllowedInPhase24B: boolean
  notes: string[]
}

export interface StagingDeployCommandPlan {
  commandId: string
  targetId: StagingDeployTargetId
  commandString: string
  safeToRunManually: boolean
  requiresHumanConfirmation: true
  confirmationEnvVar: 'REEDITPRO_CONFIRM_STAGING_DEPLOY'
  doesNotDo: string[]
  warnings: string[]
}

export interface ParsedStagingDeployLog {
  targetId?: StagingDeployTargetId
  parsedStatus: StagingDeployStatus
  serviceUrl?: string
  errors: string[]
  warnings: string[]
  forbiddenFindings: string[]
  nextActions: string[]
}

export interface StagingDeployResult {
  targetId: StagingDeployTargetId
  status: StagingDeployStatus
  serviceName?: string
  jobName?: string
  imageRef?: string
  serviceUrl?: string
  logPath?: string
  parsedLog?: ParsedStagingDeployLog
  warnings: string[]
  blockers: string[]
}

export interface StagingHealthcheckSummary {
  reportId: string
  createdAt: string
  projectId?: string
  region?: string
  apiServiceReady: boolean
  jobsReady: boolean
  toolReadinessExecutionStatus: 'not_run' | 'skipped' | 'passed' | 'failed' | 'blocked'
  blockers: string[]
  warnings: string[]
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}

export interface StagingDeployBlocker {
  id: string
  targetId?: StagingDeployTargetId
  summary: string
}

export interface StagingDeployWarning {
  id: string
  targetId?: StagingDeployTargetId
  summary: string
}

export interface StagingPhase25Readiness {
  readyForGeneratedFixtureE2E: boolean
  blockers: string[]
  warnings: string[]
}

export interface StagingDeployReport {
  reportId: string
  createdAt: string
  mode: StagingDeployMode
  config: StagingDeployConfig
  imageRefs: StagingDeployImageRef[]
  imageArchitectureResults: StagingImageArchitectureResult[]
  servicePlan: StagingCloudRunServicePlan
  jobPlans: StagingCloudRunJobPlan[]
  commandPlans: StagingDeployCommandPlan[]
  deployResults: StagingDeployResult[]
  healthcheckSummary: StagingHealthcheckSummary
  blockers: StagingDeployBlocker[]
  warnings: StagingDeployWarning[]
  phase25Readiness: StagingPhase25Readiness
  deploymentExecuted: boolean
  cloudRunJobsExecuted: boolean
  gpuDeployed: false
  providerExecuted: false
  modelDownloadExecuted: false
  mediaProcessingExecuted: false
  secretValuesCreated: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}

export interface BuildStagingDeployReportInput {
  projectId?: string
  region?: string
  imageTag?: string
  confirmDeploy?: boolean
  architectureResults?: StagingImageArchitectureResult[]
  deployLogs?: Array<{ logPath: string; parsedLog: ParsedStagingDeployLog }>
  createdAt?: string
}
