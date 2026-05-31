export type RealVideoProColorImageStatus = 'planned' | 'ready' | 'blocked'
export type RealVideoProColorImageRuntimeMode = 'real_video_sample'
export type RealVideoProColorImageToolId = 'ffprobe' | 'ffmpeg' | 'openimageio' | 'opencolorio' | 'kornia'
export type RealVideoProColorImageToolStatus = 'passed' | 'blocked' | 'skipped'
export type RealVideoProColorImageQaGateId =
  | 'source_integrity'
  | 'phase40b_evidence'
  | 'plan_snapshot_integrity'
  | 'sample_bounds'
  | 'openimageio_real_frame'
  | 'opencolorio_real_frame'
  | 'kornia_real_frame'
  | 'artifact_privacy'
  | 'blocked_features'

export interface RealVideoProColorImageConfig {
  phase: '40C'
  track: 'A visual/video'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: RealVideoProColorImageRuntimeMode
  approvedInputVideoGcsUri: string
  sourceRunId: 'phase32-20260528T13330'
  phase40BRunId: 'phase40b-20260531T10390'
  phase40BReportUri: string
  approvedPhase40BImage: string
  approvedPhase40BImageDigest: string
  approvedPhase40BExecutionId: 'reeditpro-staging-pro-color-image-runtime-job-s25z7'
  runtimeJobName: 'reeditpro-staging-pro-color-image-runtime-job'
  runtimeImageTag: 'staging-pro-color-image-real-video-001'
  runtimeTargetImage: string
  runtimeImageRepository: string
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  computeMode: 'cpu'
  cpu: 4
  memory: '8Gi'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  previewsBucket: 'reeditpro-staging-reeditpro-previews'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  reportObjectPrefix: 'activation-pro-color-image/phase40c'
  timestampsSeconds: readonly [0.5, 7.7335, 14.5]
  preferredFrameCount: 3
  maxFrameCount: 5
  maxFrameWidth: 768
  maxFrameHeight: 432
  expectedDurationSeconds: 15.467
  openColorIOVersion: '2.4.2'
  openImageIOVersion: '3.0.18.1'
  torchVersion: '2.7.1+cpu'
  korniaVersion: '0.8.1'
}

export interface RealVideoProColorImageEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  inputVideoGcsUri?: string
  frameCount?: number
  frameWidth?: number
  frameHeight?: number
  providerExecutionEnabled?: string
  revideoEnabled?: string
  publicAccessEnabled?: string
  fullVideoProcessingEnabled?: string
  finalDeliveryEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  broadRealMediaReady?: string
}

export interface RealVideoProColorImageValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface RealVideoProColorImageSourceSummary {
  inputVideoGcsUri: string
  sourceRunId: string
  sourcePhase: 32
  expectedDurationSeconds: number
  knownBaselineColorCorrection: string
  privateSourceOnly: true
  arbitraryMediaAllowed: false
  fullVideoProcessingAllowed: false
  warnings: string[]
}

export interface RealVideoProColorImageSamplePlan {
  runtimeMode: RealVideoProColorImageRuntimeMode
  timestampsSeconds: number[]
  frameCount: number
  maxFrameCount: number
  frameWidth: number
  frameHeight: number
  maxFrameWidth: number
  maxFrameHeight: number
  reason: string
  fullVideoExtractionAllowed: false
  full4KProcessingAllowed: false
}

export interface RealVideoProColorImagePlanSnapshot {
  planId: 'phase40c-real-video-pro-color-image-sample-plan-v1'
  phase: '40C'
  feature: 'real_video_pro_color_image_sample'
  approvedPlanSnapshot: true
  rawPromptExecution: false
  approvedInputVideo: string
  sourcePhase: 32
  phase40BRunId: string
  tools: RealVideoProColorImageToolId[]
  samplePlan: RealVideoProColorImageSamplePlan
  processingPlan: string[]
  outputPrefixes: {
    generatedAssets: string
    previews: string
    qa: string
    workerTemp: string
  }
  blockedFeatures: string[]
  safety: {
    providerAllowed: false
    revideoAllowed: false
    publicAccessAllowed: false
    productionReadyAllowed: false
    externalBetaAllowed: false
    broadRealUserMediaAllowed: false
    fullVideoProcessingAllowed: false
    finalDeliveryAllowed: false
  }
}

export interface RealVideoProColorImageIamBindingPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
}

export interface RealVideoProColorImageCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface RealVideoProColorImageToolExecutionResult {
  toolId: RealVideoProColorImageToolId
  status: RealVideoProColorImageToolStatus
  version?: string
  operation: string
  artifacts: string[]
  metrics: Record<string, number | string | boolean>
  blockers: string[]
  warnings: string[]
}

export interface RealVideoProColorImageArtifactRecord {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface RealVideoProColorImageQaGate {
  gateId: RealVideoProColorImageQaGateId
  passed: boolean
  severity: 'mandatory' | 'warning'
  summary: string
}

export interface RealVideoProColorImageExecutionReport {
  ok: boolean
  phase: '40C'
  runId: string
  projectId: string
  jobName: string
  executionId?: string
  runtimeMode: RealVideoProColorImageRuntimeMode
  compute: {
    mode: 'cpu'
    cpu: number
    memory: string
    gpuRequested: false
  }
  image?: {
    image?: string
    digest?: string
  }
  runtimeDiagnostics?: {
    pythonVersion?: string
    pythonExecutable?: string
    numpyVersion?: string
    pillowVersion?: string
  }
  source: {
    inputVideoGcsUri: string
    durationSeconds?: number
    videoStreamPresent: boolean
    audioStreamPresent: boolean
    sourceRunId: string
  }
  sample: {
    timestampsSeconds: number[]
    frameCount: number
    width: number
    height: number
    frameUris: string[]
  }
  planSnapshot: {
    approvedPlanSnapshot: true
    rawPromptExecution: false
    gcsUri: string
  }
  tools: RealVideoProColorImageToolExecutionResult[]
  artifacts: RealVideoProColorImageArtifactRecord[]
  qa: {
    status: 'passed' | 'blocked'
    gates: RealVideoProColorImageQaGate[]
    blockers: string[]
    warnings: string[]
  }
  safety: {
    approvedSourceOnly: boolean
    arbitraryMediaUsed: false
    fullVideoProcessed: false
    full4KFramesProcessed: false
    finalDeliveryCreated: false
    providerExecuted: false
    revideoUsed: false
    publicAccessEnabled: false
    productionReadyAllowed: false
    externalBetaAllowed: false
    paidProductionAllowed: false
    broadRealUserMediaAllowed: false
  }
  phase40DReadiness: {
    readyForProColorImagePrivateFeatureE2EReadinessGate: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedRealVideoProColorImageEvidence {
  phase: '40C'
  status: 'verified' | 'blocked' | 'not_run'
  runId?: string
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName?: string
  cloudRunExecutionId?: string
  sourceInputVideo?: string
  sample?: {
    timestampsSeconds: number[]
    width: number
    height: number
    frameCount: number
  }
  artifactPrefix?: string
  qaReportUri?: string
  toolResults: {
    ffprobe: RealVideoProColorImageToolStatus
    ffmpeg: RealVideoProColorImageToolStatus
    opencolorio: RealVideoProColorImageToolStatus
    openimageio: RealVideoProColorImageToolStatus
    kornia: RealVideoProColorImageToolStatus
  }
  phase40DReadiness: {
    readyForProColorImagePrivateFeatureE2EReadinessGate: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface RealVideoProColorImageReport {
  reportId: 'activation-phase-40c-real-video-pro-color-image'
  createdAt: string
  config: RealVideoProColorImageConfig
  sourceSummary: RealVideoProColorImageSourceSummary
  samplePlan: RealVideoProColorImageSamplePlan
  planSnapshot: RealVideoProColorImagePlanSnapshot
  iamPlan: RealVideoProColorImageIamBindingPlan[]
  commandPlans: RealVideoProColorImageCommandPlan[]
  approvedEvidence: ApprovedRealVideoProColorImageEvidence
  executionReport?: RealVideoProColorImageExecutionReport
  status: RealVideoProColorImageStatus
  blockers: string[]
  warnings: string[]
  runtimeImageBuilt: boolean
  runtimeImagePushed: boolean
  jobDeployed: boolean
  jobExecuted: boolean
  realVideoProColorSampleCompleted: boolean
  phase40DReadiness: {
    readyForProColorImagePrivateFeatureE2EReadinessGate: boolean
    reason: string
  }
  fullVideoProcessingAllowed: false
  full4KProcessingAllowed: false
  finalDeliveryAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}
