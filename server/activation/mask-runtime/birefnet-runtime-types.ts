export type BiRefNetRuntimeStatus = 'planned' | 'ready' | 'blocked' | 'failed'

export type BiRefNetRuntimeQaGateStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface BiRefNetRuntimeConfig {
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  imageTag: 'staging-birefnet-runtime-001'
  jobName: 'reeditpro-staging-birefnet-runtime-job'
  serviceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  modelManifestId: 'birefnet_main_staging_v1'
  modelName: 'ZhengPeng7/BiRefNet'
  modelRevision: 'e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4'
  modelAggregateSha256: '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7'
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/'
  modelRuntimePath: '/tmp/reeditpro-model-weights/birefnet/main'
  targetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-birefnet-runtime:staging-birefnet-runtime-001'
  reportObjectPrefix: 'activation-mask-runtime/phase33c'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  gpuType: 'nvidia-l4'
  gpuCount: 1
  cpu: 4
  memory: '16Gi'
}

export interface BiRefNetRuntimeCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface BiRefNetCustomCodeScanSummary {
  customCodeFiles: string[]
  executedAllowlist: string[]
  neverImportedFiles: string[]
  blockedPatterns: string[]
  warnings: string[]
  blockers: string[]
}

export interface BiRefNetRuntimeModelSyncSummary {
  modelManifestId: string
  modelGcsPath: string
  runtimePath: string
  expectedRevision: string
  expectedAggregateSha256: string
  expectedFileCount: number
  blockers: string[]
  warnings: string[]
}

export interface BiRefNetRuntimeFixturePlan {
  generatedOnly: true
  width: 512
  height: 512
  format: 'png'
  description: string
  blockers: string[]
  warnings: string[]
}

export interface BiRefNetRuntimeArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface BiRefNetMaskQaGate {
  gateId:
    | 'mask_edge_quality'
    | 'mask_subject_coverage'
    | 'render_asset_integrity'
    | 'mask_temporal_stability'
  status: BiRefNetRuntimeQaGateStatus
  summary: string
}

export interface BiRefNetRuntimeExecutionReport {
  ok: boolean
  runId: string
  projectId: 'reeditpro'
  jobName: string
  image?: {
    image: string
    digest?: string
  }
  gpu: {
    requested: true
    type: 'nvidia-l4'
    count: 1
    cudaAvailable: boolean
    deviceName?: string
  }
  model: {
    manifestId: 'birefnet_main_staging_v1'
    name: 'ZhengPeng7/BiRefNet'
    revision: string
    gcsPath: string
    runtimePath: string
    aggregateSha256: string
    copiedFiles: string[]
  }
  customCodeScan: BiRefNetCustomCodeScanSummary
  fixture: {
    generated: true
    width: number
    height: number
    gcsUri?: string
  }
  mask: {
    status: 'completed' | 'failed'
    width?: number
    height?: number
    nonZeroRatio?: number
    meanAlpha?: number
    maskUri?: string
    cutoutUri?: string
    metadataUri?: string
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: BiRefNetMaskQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: BiRefNetRuntimeArtifact[]
  safety: {
    providerExecuted: boolean
    modelDownloadedExternally: boolean
    realMediaUsed: boolean
    realVideoFrameUsed: boolean
    sam2Used: boolean
    textBehindSubjectExecuted: boolean
    secretValuesUsed: boolean
    publicAccessEnabled: boolean
    rtxPro6000Used: boolean
    revideoUsed: boolean
  }
  uploadedReport: {
    bucket: string
    object: string
    gcsUri: string
  }
  warnings: string[]
}

export interface BiRefNetRuntimeReport {
  reportId: string
  createdAt: string
  config: BiRefNetRuntimeConfig
  commandPlans: BiRefNetRuntimeCommandPlan[]
  executionReport?: BiRefNetRuntimeExecutionReport
  status: BiRefNetRuntimeStatus
  blockers: string[]
  warnings: string[]
  runtimeImageBuilt: boolean
  runtimeImagePushed: boolean
  jobDeployed: boolean
  jobExecuted: boolean
  phase33DReadiness: {
    readyForControlledMaskTest: boolean
    reason: string
  }
  providerExecuted: false
  modelDownloadedExternally: false
  realMediaProcessed: false
  sam2Used: false
  textBehindSubjectAllowed: false
  secretValuesCreated: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
}
