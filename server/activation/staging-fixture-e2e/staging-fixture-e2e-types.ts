export type StagingFixtureE2EMode = 'plan' | 'report' | 'execute'

export type StagingFixtureE2EStatus = 'planned' | 'passed' | 'warning' | 'blocked' | 'failed' | 'skipped'

export interface StagingFixtureE2EConfig {
  projectId: string
  region: string
  environment: 'staging'
  imageTag: string
  confirmE2E: boolean
  mode: StagingFixtureE2EMode
  runId: string
  logDir: string
}

export interface StagingFixtureBucketMap {
  source: string
  proxy: string
  analysis: string
  transcripts: string
  previews: string
  finalExports: string
  temp: string
  qa: string
}

export interface StagingFixtureArtifact {
  kind: string
  bucket: string
  object: string
  exists: boolean
  private: true
  sourceOfTruth: boolean
}

export interface StagingFixtureJobResult {
  jobName: string
  stage: 'tool-readiness' | 'cpu' | 'render' | 'qa'
  executionId?: string
  status: StagingFixtureE2EStatus
  logPath?: string
  blockers: string[]
  warnings: string[]
}

export interface StagingFixtureQASummary {
  status: StagingFixtureE2EStatus
  finalDeliveryAllowed: boolean
  blockingGateFailures: string[]
  warnings: string[]
}

export interface StagingFixtureE2EReport {
  reportId: string
  createdAt: string
  mode: StagingFixtureE2EMode
  config: StagingFixtureE2EConfig
  buckets: StagingFixtureBucketMap
  apiHealthStatus: StagingFixtureE2EStatus
  fixtureLocalPath?: string
  fixtureGcsObject?: string
  jobs: StagingFixtureJobResult[]
  artifacts: StagingFixtureArtifact[]
  qaSummary: StagingFixtureQASummary
  cleanupStatus: StagingFixtureE2EStatus
  blockers: string[]
  warnings: string[]
  phase26Readiness: {
    ready: boolean
    reason: string
  }
  phase28Readiness: {
    ready: false
    reason: string
  }
  providerExecuted: false
  modelDownloadExecuted: false
  gpuExecuted: false
  realUserMediaUsed: false
  publicAccessGranted: false
  secretValuesCreated: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}
