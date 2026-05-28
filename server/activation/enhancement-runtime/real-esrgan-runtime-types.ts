export type RealEsrganRuntimeStatus = 'planned' | 'ready' | 'blocked' | 'failed'

export type RealEsrganRuntimeQaGateStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface RealEsrganRuntimeConfig {
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  imageTag: 'staging-real-esrgan-runtime-001'
  jobName: 'reeditpro-staging-real-esrgan-runtime-job'
  serviceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  modelManifestId: 'real_esrgan_x4plus_staging_v1'
  modelName: 'RealESRGAN_x4plus'
  sourceUrl: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth'
  releaseVersion: 'v0.1.0'
  modelFileSha256: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1'
  modelAggregateSha256: '5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5'
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/'
  modelRuntimePath: '/tmp/reeditpro-model-weights/real-esrgan/x4plus'
  modelFileName: 'RealESRGAN_x4plus.pth'
  targetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-real-esrgan-runtime:staging-real-esrgan-runtime-001'
  reportObjectPrefix: 'activation-enhancement-runtime/phase34c'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  gpuType: 'nvidia-l4'
  gpuCount: 1
  cpu: 4
  memory: '16Gi'
}

export interface RealEsrganRuntimeCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface RealEsrganRuntimeModelSyncSummary {
  modelManifestId: string
  modelGcsPath: string
  runtimePath: string
  expectedReleaseVersion: string
  expectedFileSha256: string
  expectedAggregateSha256: string
  expectedFileCount: number
  blockers: string[]
  warnings: string[]
}

export interface RealEsrganRuntimeFixturePlan {
  generatedOnly: true
  width: 128
  height: 128
  expectedOutputWidth: 512
  expectedOutputHeight: 512
  scale: 4
  format: 'png'
  description: string
  blockers: string[]
  warnings: string[]
}

export interface RealEsrganRuntimeArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface RealEsrganEnhancementQaGate {
  gateId: 'enhancement_artifacts' | 'render_asset_integrity' | 'sample_first_policy' | 'runtime_safety'
  status: RealEsrganRuntimeQaGateStatus
  summary: string
}

export interface RealEsrganRuntimeExecutionReport {
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
    manifestId: 'real_esrgan_x4plus_staging_v1'
    name: 'RealESRGAN_x4plus'
    releaseVersion: string
    sourceUrl: string
    gcsPath: string
    runtimePath: string
    fileSha256: string
    aggregateSha256: string
    copiedFiles: string[]
  }
  fixture: {
    generated: true
    width: number
    height: number
    gcsUri?: string
  }
  enhanced: {
    status: 'completed' | 'failed'
    width?: number
    height?: number
    scale?: number
    gcsUri?: string
    metadataUri?: string
    sizeBytes?: number
    sha256?: string
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: RealEsrganEnhancementQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: RealEsrganRuntimeArtifact[]
  safety: {
    providerExecuted: boolean
    modelDownloadedExternally: boolean
    realMediaUsed: boolean
    realVideoFrameUsed: boolean
    filmUsed: boolean
    slowMotionExecuted: boolean
    fullVideoEnhancementExecuted: boolean
    faceEnhanceRan: boolean
    gfpganWeightsPresent: boolean
    facexlibWeightsPresent: boolean
    alternateRealEsrganWeightsPresent: boolean
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

export interface RealEsrganRuntimeReport {
  reportId: string
  createdAt: string
  config: RealEsrganRuntimeConfig
  commandPlans: RealEsrganRuntimeCommandPlan[]
  executionReport?: RealEsrganRuntimeExecutionReport
  status: RealEsrganRuntimeStatus
  blockers: string[]
  warnings: string[]
  runtimeImageBuilt: boolean
  runtimeImagePushed: boolean
  jobDeployed: boolean
  jobExecuted: boolean
  phase34DReadiness: {
    readyForControlledEnhancementSample: boolean
    reason: string
  }
  providerExecuted: false
  modelDownloadedExternally: false
  realMediaProcessed: false
  filmUsed: false
  slowMotionAllowed: false
  fullVideoEnhancementAllowed: false
  secretValuesCreated: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
}
