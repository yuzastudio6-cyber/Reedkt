export type RealVideoSam2TemporalMaskStatus = 'planned' | 'ready' | 'blocked' | 'failed'
export type RealVideoSam2QaGateStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface RealVideoSam2TemporalMaskConfig {
  phase: '35D'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'real_video_temporal_mask_sample'
  approvedInputVideoGcsUri: string
  approvedAnchorFrameGcsUri: string
  approvedAnchorMaskGcsUri: string
  approvedAnchorCutoutGcsUri: string
  anchorTimestampSeconds: 7.7335
  segmentStartSeconds: 6.9
  segmentEndSeconds: 8.9
  maxSegmentDurationSeconds: 2.0
  preferredFrameCount: 10
  maxFrames: 12
  frameWidth: 768
  frameHeight: 432
  modelFamily: 'SAM2 / Segment Anything Model 2'
  modelId: 'sam2.1_hiera_tiny'
  checkpointFileName: 'sam2.1_hiera_tiny.pt'
  configFileName: 'sam2.1_hiera_t.yaml'
  modelGcsPath: string
  checkpointSha256: string
  configSha256: string
  aggregateSha256: string
  runtimeJobName: 'reeditpro-staging-sam2-runtime-job'
  runtimeImageTag: 'staging-sam2-real-video-temporal-001'
  runtimeTargetImage: string
  runtimeImageRepository: string
  approvedPhase35CImage: string
  approvedPhase35CExecutionId: string
  serviceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  masksBucket: 'reeditpro-staging-reeditpro-masks'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  modelRuntimePath: '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny'
  gpuType: 'nvidia-l4'
  gpuCount: 1
  cpu: 4
  memory: '16Gi'
}

export interface RealVideoSam2TemporalMaskEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  inputVideoGcsUri?: string
  anchorFrameGcsUri?: string
  anchorMaskGcsUri?: string
  anchorCutoutGcsUri?: string
  modelGcsPath?: string
  checkpointSha256?: string
  configSha256?: string
  aggregateSha256?: string
  segmentStartSeconds?: number
  segmentEndSeconds?: number
  segmentDurationSeconds?: number
  frameCount?: number
  gpuType?: string
  providerExecutionEnabled?: string
  publicAccessEnabled?: string
  productionReady?: string
  externalBeta?: string
  broadRealMedia?: string
}

export interface RealVideoSam2TemporalMaskValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface RealVideoSam2SegmentPlan {
  inputVideoGcsUri: string
  anchorTimestampSeconds: number
  startSeconds: number
  endSeconds: number
  durationSeconds: number
  frameCount: number
  maxFrames: number
  frameWidth: number
  frameHeight: number
  extractionMode: 'bounded_short_segment_only'
  reason: string
  blockers: string[]
  warnings: string[]
}

export interface RealVideoSam2PromptPlan {
  promptSource: 'phase33d_mask_bbox'
  promptType: 'box'
  anchorFrameGcsUri: string
  anchorMaskGcsUri: string
  anchorCutoutGcsUri: string
  promptFrameIndex: number
  reason: string
  blockers: string[]
  warnings: string[]
}

export interface RealVideoSam2IamPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
}

export interface RealVideoSam2CommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface RealVideoSam2QaGate {
  gateId:
    | 'source_integrity'
    | 'segment_bounds'
    | 'model_artifacts'
    | 'prompt_integrity'
    | 'runtime_integrity'
    | 'mask_artifacts'
    | 'temporal_consistency'
    | 'artifact_privacy'
    | 'blocked_features'
  status: RealVideoSam2QaGateStatus
  summary: string
}

export interface RealVideoSam2Artifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface RealVideoSam2TemporalMaskExecutionReport {
  ok: boolean
  runId: string
  projectId: 'reeditpro'
  jobName: string
  executionId?: string
  image?: {
    image?: string
    digest?: string
  }
  source: {
    inputVideoGcsUri: string
    anchorFrameGcsUri: string
    anchorMaskGcsUri: string
    anchorCutoutGcsUri: string
    sourceDurationSeconds: number
  }
  segment: {
    startSeconds: number
    endSeconds: number
    durationSeconds: number
    frameCount: number
    width: number
    height: number
    fps: number
    frameUris: string[]
    manifestUri?: string
  }
  prompt: {
    source: 'phase33d_mask_bbox'
    type: 'box'
    promptFrameIndex: number
    anchorMaskDimensions: { width: number; height: number }
    frameDimensions: { width: number; height: number }
    sourceBoundingBox: [number, number, number, number]
    scaledBoundingBox: [number, number, number, number]
    metadataUri?: string
  }
  gpu: {
    requested: true
    type: 'nvidia-l4'
    count: 1
    cudaAvailable: boolean
    deviceName?: string
  }
  model: {
    family: 'SAM2 / Segment Anything Model 2'
    modelId: 'sam2.1_hiera_tiny'
    checkpointFileName: 'sam2.1_hiera_tiny.pt'
    configFileName: 'sam2.1_hiera_t.yaml'
    gcsPath: string
    runtimePath: string
    checkpointSha256: string
    configSha256: string
    aggregateSha256: string
    copiedFiles: string[]
  }
  masks: {
    status: 'completed' | 'failed'
    frameCount: number
    maskUris: string[]
    overlayUris: string[]
    perFrame: Array<{
      frameIndex: number
      nonZeroRatio: number
      centroidX?: number
      centroidY?: number
    }>
    metadataUri?: string
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: RealVideoSam2QaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: RealVideoSam2Artifact[]
  safety: {
    approvedPhase32VideoOnly: true
    approvedPhase33DAnchorOnly: true
    arbitraryRealUserMediaUsed: false
    fullVideoMaskExecuted: false
    fullVideoTextBehindSubjectExecuted: false
    textBehindSubjectVideoExecuted: false
    providerExecuted: false
    modelDownloadedExternally: false
    revideoUsed: false
    filmUsed: false
    slowMotionExecuted: false
    publicAccessEnabled: false
    secretValuesUsed: false
    rtxPro6000Used: false
    productionReadyAllowed: false
    externalBetaAllowed: false
    broadRealUserMediaAllowed: false
  }
  uploadedReport: {
    bucket: string
    object: string
    gcsUri: string
  }
  warnings: string[]
}

export interface ApprovedRealVideoSam2TemporalMaskEvidence {
  phase: '35D'
  status: 'not_started' | 'verified' | 'blocked'
  runId?: string
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName: 'reeditpro-staging-sam2-runtime-job'
  cloudRunExecutionId?: string
  sourceVideo: string
  selectedSegment?: {
    startSeconds: number
    endSeconds: number
    durationSeconds: number
    frameCount: number
    width: number
    height: number
  }
  prompt?: {
    source: 'phase33d_mask_bbox'
    type: 'box'
    promptFrameIndex: number
    scaledBoundingBox: [number, number, number, number]
  }
  modelId: 'sam2.1_hiera_tiny'
  checkpointSha256: string
  configSha256: string
  aggregateSha256: string
  artifactPrefix?: string
  masksPrefix?: string
  qaReportUri?: string
  phase35EReadiness: {
    readyForControlledSegmentTextBehindSubjectPreview: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface RealVideoSam2TemporalMaskReport {
  reportId: 'activation-phase-35d-real-video-sam2-temporal-mask'
  createdAt: string
  config: RealVideoSam2TemporalMaskConfig
  source: {
    inputVideoGcsUri: string
    anchorFrameGcsUri: string
    anchorMaskGcsUri: string
    anchorCutoutGcsUri: string
    blockers: string[]
    warnings: string[]
  }
  segmentPlan: RealVideoSam2SegmentPlan
  promptPlan: RealVideoSam2PromptPlan
  iamPlan: RealVideoSam2IamPlan[]
  commandPlans: RealVideoSam2CommandPlan[]
  approvedEvidence: ApprovedRealVideoSam2TemporalMaskEvidence
  executionReport?: RealVideoSam2TemporalMaskExecutionReport
  status: RealVideoSam2TemporalMaskStatus
  blockers: string[]
  warnings: string[]
  runtimeImageBuilt: boolean
  runtimeImagePushed: boolean
  jobDeployed: boolean
  jobExecuted: boolean
  realVideoTemporalTrackingCompleted: boolean
  phase35EReadiness: {
    readyForControlledSegmentTextBehindSubjectPreview: boolean
    reason: string
  }
  realVideoShortSegmentAllowed: true
  arbitraryRealUserMediaAllowed: false
  fullVideoMaskAllowed: false
  fullVideoTextBehindSubjectAllowed: false
  textBehindSubjectVideoAllowed: false
  providerAllowed: false
  revideoAllowed: false
  filmAllowed: false
  slowMotionAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}
