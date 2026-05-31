export type RealVideoFilmSlowmotionStatus = 'planned' | 'ready' | 'blocked' | 'failed'
export type RealVideoFilmSlowmotionQaGateStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface RealVideoFilmSlowmotionConfig {
  phase: '38D'
  track: 'A visual/video'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'real_video_slowmotion_sample'
  approvedInputVideoGcsUri: string
  approvedAnchorTimestampSeconds: 7.7335
  segmentStartSeconds: 6.9835
  segmentEndSeconds: 8.4835
  segmentDurationSeconds: 1.5
  sourceFrameFps: 6
  sourceFrameCount: 9
  maxSourceFrames: 12
  frameWidth: 512
  frameHeight: 288
  fallbackFrameWidth: 384
  fallbackFrameHeight: 216
  outputFrameCount: 17
  maxOutputFrames: 24
  interpolationTime: 0.5
  artifactGcsPath: string
  artifactRuntimePath: string
  kerasMetadataSha256: string
  savedModelSha256: string
  variablesDataSha256: string
  variablesIndexSha256: string
  aggregateSha256: string
  approvedPhase38CRunId: 'phase38c-20260530T23315'
  approvedPhase38CImage: string
  approvedPhase38CExecutionId: 'reeditpro-staging-film-runtime-job-gbwhl'
  runtimeJobName: 'reeditpro-staging-film-runtime-job'
  runtimeImageTag: 'staging-film-real-video-slowmotion-001'
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
  reportObjectPrefix: 'activation-film-runtime/phase38d'
}

export interface RealVideoFilmSlowmotionEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  inputVideoGcsUri?: string
  artifactGcsPath?: string
  kerasMetadataSha256?: string
  savedModelSha256?: string
  variablesDataSha256?: string
  variablesIndexSha256?: string
  aggregateSha256?: string
  segmentStartSeconds?: number
  segmentEndSeconds?: number
  segmentDurationSeconds?: number
  sourceFrameCount?: number
  outputFrameCount?: number
  frameWidth?: number
  frameHeight?: number
  providerExecutionEnabled?: string
  publicAccessEnabled?: string
  revideoEnabled?: string
  audioStretchEnabled?: string
  fullVideoInterpolationEnabled?: string
  finalDeliveryEnabled?: string
  productionReady?: string
  externalBeta?: string
  broadRealMedia?: string
}

export interface RealVideoFilmSlowmotionValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface RealVideoFilmSlowmotionCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'plan-snapshot' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface RealVideoFilmSlowmotionIamPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  required: boolean
  commandString: string
}

export interface RealVideoFilmSlowmotionSourceSummary {
  approvedInputVideoGcsUri: string
  sourceChain: 'phase32_controlled_private_export'
  anchorTimestampSeconds: number
  blockers: string[]
  warnings: string[]
}

export interface RealVideoFilmSlowmotionSegmentPlan {
  startSeconds: number
  endSeconds: number
  durationSeconds: number
  sourceFrameFps: number
  sourceFrameCount: number
  maxSourceFrames: number
  frameWidth: number
  frameHeight: number
  outputFrameCount: number
  maxOutputFrames: number
  reason: string
  blockers: string[]
  warnings: string[]
}

export interface RealVideoFilmSlowmotionPlanSnapshot {
  phase: '38D'
  runId: string
  rawPromptExecution: false
  approvedSource: string
  segment: RealVideoFilmSlowmotionSegmentPlan
  interpolation: {
    pairwiseMidpointOnly: true
    interpolationTime: 0.5
    expectedOutputFrameCount: number
    maxOutputFrames: number
  }
  artifactPrefixes: {
    generatedAssets: string
    previews: string
    qa: string
    workerTemp: string
  }
  blockedFeatures: Record<string, false>
  safetyGates: Record<string, boolean | string | number>
}

export interface RealVideoFilmSlowmotionArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface RealVideoFilmSlowmotionQaGate {
  gateId:
    | 'source_integrity'
    | 'plan_snapshot_integrity'
    | 'segment_bounds'
    | 'model_artifacts'
    | 'runtime_integrity'
    | 'interpolated_artifacts'
    | 'motion_sanity'
    | 'preview_artifacts'
    | 'artifact_privacy'
    | 'blocked_features'
  status: RealVideoFilmSlowmotionQaGateStatus
  summary: string
}

export interface RealVideoFilmSlowmotionExecutionReport {
  ok: boolean
  runId: string
  projectId: 'reeditpro'
  jobName: string
  executionId?: string
  image?: {
    image: string
    digest?: string
  }
  compute: {
    mode: 'cpu'
    cpu: 4
    memory: '8Gi'
    gpuRequested: false
  }
  source: {
    inputVideoGcsUri: string
    durationSeconds: number
    hasAudio: boolean
    width: number
    height: number
  }
  planSnapshot: {
    gcsUri: string
    rawPromptExecution: false
    validated: boolean
  }
  segment: {
    startSeconds: number
    endSeconds: number
    durationSeconds: number
    sourceFrameFps: number
    sourceFrameCount: number
    width: number
    height: number
    sourceFrameUris: string[]
    manifestUri?: string
  }
  model: {
    artifactId: 'film_net_style_saved_model'
    gcsPath: string
    runtimePath: string
    kerasMetadataSha256: string
    savedModelSha256: string
    variablesDataSha256: string
    variablesIndexSha256: string
    aggregateSha256: string
    copiedFiles: string[]
  }
  interpolation: {
    status: 'completed' | 'failed'
    interpolatedFrameCount: number
    outputFrameCount: number
    interpolatedFrameUris: string[]
    previewFrameUris: string[]
    metrics: {
      meanMidpointDiffFromPreviousSource: number
      meanMidpointDiffFromNextSource: number
      meanOutputStddev: number
    }
  }
  preview: {
    previewFrameCount: number
    previewMp4Status: 'completed' | 'blocked'
    previewMp4Uri?: string
    blocker?: string
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: RealVideoFilmSlowmotionQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: RealVideoFilmSlowmotionArtifact[]
  safety: {
    realVideoShortSegmentOnly: true
    approvedSourceOnly: true
    providerExecuted: false
    modelDownloadedExternally: false
    fullVideoInterpolationExecuted: false
    audioStretchExecuted: false
    finalDeliveryCreated: false
    revideoUsed: false
    publicAccessEnabled: false
    secretValuesUsed: false
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

export interface ApprovedRealVideoFilmSlowmotionEvidence {
  phase: '38D'
  status: 'not_started' | 'verified' | 'blocked'
  runId?: string
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName: 'reeditpro-staging-film-runtime-job'
  cloudRunExecutionId?: string
  sourceVideo: string
  selectedSegment?: {
    startSeconds: number
    endSeconds: number
    durationSeconds: number
    sourceFrameCount: number
    width: number
    height: number
    outputFrameCount: number
  }
  artifactPrefix?: string
  previewPrefix?: string
  qaReportUri?: string
  phase38EReadiness: {
    readyForFilmPrivateFeatureE2EReadinessGate: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface RealVideoFilmSlowmotionReport {
  reportId: 'activation-phase-38d-real-video-film-slowmotion'
  createdAt: string
  config: RealVideoFilmSlowmotionConfig
  source: RealVideoFilmSlowmotionSourceSummary
  segmentPlan: RealVideoFilmSlowmotionSegmentPlan
  planSnapshot: RealVideoFilmSlowmotionPlanSnapshot
  iamPlan: RealVideoFilmSlowmotionIamPlan[]
  commandPlans: RealVideoFilmSlowmotionCommandPlan[]
  approvedEvidence: ApprovedRealVideoFilmSlowmotionEvidence
  executionReport?: RealVideoFilmSlowmotionExecutionReport
  status: RealVideoFilmSlowmotionStatus
  blockers: string[]
  warnings: string[]
  runtimeImageBuilt: boolean
  runtimeImagePushed: boolean
  jobDeployed: boolean
  jobExecuted: boolean
  realVideoSlowmotionSampleCompleted: boolean
  phase38EReadiness: {
    readyForFilmPrivateFeatureE2EReadinessGate: boolean
    reason: string
  }
  realVideoShortSegmentAllowed: true
  fullVideoInterpolationAllowed: false
  finalDeliveryAllowed: false
  audioStretchAllowed: false
  providerAllowed: false
  revideoAllowed: false
  trackBToolsAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}
