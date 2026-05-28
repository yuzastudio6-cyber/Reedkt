export type RealVideoEnhancementSampleStatus = 'planned' | 'ready' | 'failed'
export type RealVideoEnhancementSampleQaGateStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface RealVideoEnhancementSampleConfig {
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  phase33dRunId: 'phase33d-20260528T161056'
  sourceFrameGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png'
  sourceBucket: 'reeditpro-staging-reeditpro-generated-assets'
  sourcePrefix: 'activation-real-video/phase33d/phase33d-20260528T161056/'
  modelManifestId: 'real_esrgan_x4plus_staging_v1'
  modelName: 'RealESRGAN_x4plus'
  modelReleaseVersion: 'v0.1.0'
  modelFileSha256: '4fa0d38905f75ac06eb49a7951b426670021be3018265fd191d2125df9d682f1'
  modelAggregateSha256: '5cee93bc531570df59a772293ecae30f89c4519f93478cbb74ddce9f0e9bb4a5'
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/real-esrgan/x4plus/'
  modelRuntimePath: '/tmp/reeditpro-model-weights/real-esrgan/x4plus'
  modelFileName: 'RealESRGAN_x4plus.pth'
  runtimeJobName: 'reeditpro-staging-real-esrgan-runtime-job'
  gpuServiceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  runtimeImageTag: 'staging-real-esrgan-sample-001'
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-real-esrgan-runtime:staging-real-esrgan-sample-001'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  phase34dPrefix: 'activation-real-video/phase34d'
  gpuType: 'nvidia-l4'
  gpuCount: 1
  cpu: 4
  memory: '16Gi'
}

export interface RealVideoEnhancementSampleArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface RealVideoEnhancementSampleCropPlan {
  sourceFrameGcsUri: string
  preferredCrop: {
    width: 512
    height: 512
    anchor: 'center'
  }
  fallbackCrop: {
    minWidth: 256
    minHeight: 256
    rule: 'largest_centered_square_if_source_smaller_than_512'
  }
  expectedScale: 4
  fullFrameEnhancementAllowed: false
  fullVideoEnhancementAllowed: false
  exactlyOneSample: true
  warnings: string[]
}

export interface RealVideoEnhancementSampleCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  warnings: string[]
}

export interface RealVideoEnhancementSampleQaGate {
  gateId:
    | 'enhancement_artifacts'
    | 'render_asset_integrity'
    | 'sample_first_policy'
    | 'hallucination_risk'
    | 'oversharpening_risk'
    | 'texture_artifact_risk'
    | 'runtime_safety'
  status: RealVideoEnhancementSampleQaGateStatus
  summary: string
}

export interface RealVideoEnhancementSampleExecutionReport {
  ok: boolean
  runId: string
  sourcePhase33DRunId: 'phase33d-20260528T161056'
  sourceFrameGcsUri: string
  projectId: 'reeditpro'
  jobName: string
  image?: {
    image?: string
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
    gcsPath: string
    runtimePath: string
    fileSha256: string
    aggregateSha256: string
    copiedFiles: string[]
  }
  sourceFrame: {
    gcsUri: string
    width: number
    height: number
  }
  sampleCrop: {
    x: number
    y: number
    width: number
    height: number
    reason: string
    gcsUri?: string
  }
  enhancedSample: {
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
    gates: RealVideoEnhancementSampleQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: RealVideoEnhancementSampleArtifact[]
  uploadedReport: {
    bucket: string
    object: string
    gcsUri: string
  }
  safety: {
    approvedPhase33DFrameOnly: true
    exactlyOneBoundedSample: boolean
    fullFrameEnhanced: boolean
    fullVideoEnhancementExecuted: boolean
    secondFrameOrVideoUsed: boolean
    filmUsed: boolean
    slowMotionExecuted: boolean
    faceEnhanceRan: boolean
    gfpganWeightsPresent: boolean
    facexlibWeightsPresent: boolean
    alternateRealEsrganWeightsPresent: boolean
    providerExecuted: boolean
    modelDownloadedExternally: boolean
    publicAccessEnabled: boolean
    secretValuesUsed: boolean
    rtxPro6000Used: boolean
    revideoUsed: boolean
  }
  blockers: string[]
  warnings: string[]
}

export interface RealVideoEnhancementSampleReport {
  reportId: string
  createdAt: string
  config: RealVideoEnhancementSampleConfig
  cropPlan: RealVideoEnhancementSampleCropPlan
  commandPlans: RealVideoEnhancementSampleCommandPlan[]
  executionReport?: RealVideoEnhancementSampleExecutionReport
  status: RealVideoEnhancementSampleStatus
  blockers: string[]
  warnings: string[]
  phase34EReadiness: {
    readyForNextEnhancementPhase: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
  fullVideoEnhancementAllowed: false
  slowMotionAllowed: false
}
