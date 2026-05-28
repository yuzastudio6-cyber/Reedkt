export type GcpStagingMode = 'static_plan' | 'report' | 'phase23_preparation' | 'phase24_blocked'

export type GcpStagingCommandPhase =
  | 'print_config'
  | 'enable_apis'
  | 'artifact_registry'
  | 'gcs_buckets'
  | 'service_accounts'
  | 'secret_placeholders'
  | 'iam'
  | 'image_names'
  | 'later_runtime'

export type GcpStagingBucketPurpose =
  | 'source-media'
  | 'proxy-media'
  | 'analysis-artifacts'
  | 'transcripts'
  | 'masks'
  | 'generated-assets'
  | 'previews'
  | 'final-exports'
  | 'worker-temp'
  | 'qa-artifacts'

export type GcpStagingServiceAccountKey =
  | 'api'
  | 'cpu-worker'
  | 'gpu-worker'
  | 'render-worker'
  | 'qa-worker'
  | 'tool-readiness-worker'

export interface GcpStagingConfigInput {
  projectId?: string
  region?: string
  artifactRegion?: string
  bucketLocation?: string
  environment?: string
  confirmSetup?: string | boolean
  artifactRepository?: string
  imageTag?: string
  serviceAccounts?: Partial<Record<GcpStagingServiceAccountKey, string>>
}

export interface GcpStagingConfig {
  projectId: string
  region: string
  artifactRegion: string
  bucketLocation: string
  environment: 'staging'
  confirmSetup: boolean
  artifactRepository: string
  imageTag: string
  serviceAccounts: Record<GcpStagingServiceAccountKey, string>
}

export interface GcpStagingConfigSummary {
  projectId: string
  region: string
  artifactRegion: string
  bucketLocation: string
  environment: 'staging'
  confirmSetup: boolean
  artifactRepository: string
  imageTag: string
  serviceAccountCount: number
}

export interface GcpStagingPolicyCheck {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface GcpStagingArtifactRegistryPlan {
  repository: string
  format: 'Docker'
  location: string
  description: string
}

export interface GcpStagingBucketPlan {
  purpose: GcpStagingBucketPurpose
  bucketName: string
  location: string
  privateByDefault: true
  uniformBucketLevelAccess: true
  publicAccessPrevention: true
  labels: Record<string, string>
  lifecycleNote: string
  signedUrlPersistenceAllowed: false
  notes: string[]
}

export interface GcpStagingServiceAccountPlan {
  key: GcpStagingServiceAccountKey
  accountId: string
  emailTemplate: string
  displayName: string
  notes: string[]
}

export interface GcpStagingSecretPlan {
  name: string
  placeholderOnly: true
  requiredBeforeDeploy: boolean
  requiredLater: boolean
  payloadCreated: false
  notes: string[]
}

export interface GcpStagingIamBindingPlan {
  serviceAccountKey: GcpStagingServiceAccountKey
  scope: 'project' | 'bucket' | 'secret'
  resource: string
  role: string
  justification: string
  broadAccess: false
  publicPrincipal: false
}

export interface GcpStagingCloudRunNamePlan {
  name: string
  kind: 'service' | 'job'
  serviceAccountKey: GcpStagingServiceAccountKey
  deployedInPhase22: false
  notes: string[]
}

export interface GcpStagingResourceMap {
  artifactRegistry: GcpStagingArtifactRegistryPlan
  buckets: GcpStagingBucketPlan[]
  serviceAccounts: GcpStagingServiceAccountPlan[]
  secretPlaceholders: GcpStagingSecretPlan[]
  cloudRunNames: GcpStagingCloudRunNamePlan[]
}

export interface GcpStagingCommandPlan {
  commandId: string
  phase: GcpStagingCommandPhase
  commandString: string
  requiredEnvVars: string[]
  requiresConfirmation: boolean
  confirmationEnvVar: 'REEDITPRO_CONFIRM_STAGING_GCP_SETUP'
  safeToRunManually: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface GcpStagingBlocker {
  id: string
  summary: string
}

export interface GcpStagingWarning {
  id: string
  summary: string
}

export interface GcpStagingReadinessDecision {
  ready: boolean
  blockers: string[]
  warnings: string[]
}

export interface GcpStagingFoundationReport {
  reportId: string
  createdAt: string
  mode: GcpStagingMode
  configSummary: GcpStagingConfigSummary
  resourceMap: GcpStagingResourceMap
  artifactRegistryPlan: GcpStagingArtifactRegistryPlan
  bucketPlan: GcpStagingBucketPlan[]
  serviceAccountPlan: GcpStagingServiceAccountPlan[]
  iamPlan: GcpStagingIamBindingPlan[]
  secretPlan: GcpStagingSecretPlan[]
  commandPlans: GcpStagingCommandPlan[]
  blockers: GcpStagingBlocker[]
  warnings: GcpStagingWarning[]
  phase23Readiness: GcpStagingReadinessDecision
  phase24Readiness: GcpStagingReadinessDecision
  gcloudExecuted: false
  resourcesCreated: false
  secretValuesCreated: false
  deploymentExecuted: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}

export interface BuildGcpStagingFoundationReportInput {
  mode?: GcpStagingMode
  configInput?: GcpStagingConfigInput
  createdAt?: string
}
