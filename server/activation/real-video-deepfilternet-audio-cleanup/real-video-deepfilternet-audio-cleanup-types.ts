export type RealVideoDeepFilterNetStatus = 'planned' | 'ready' | 'blocked'
export type RealVideoDeepFilterNetQaStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface RealVideoDeepFilterNetConfig {
  phase: '36D'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'real_video_audio_cleanup_sample'
  approvedInputVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'
  referencePhase31Audio: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4'
  expectedInputDurationSeconds: 15.467
  maxInputDurationSeconds: 20
  toolId: 'deepfilternet'
  toolVersion: 'v0.5.6'
  artifactGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/'
  cliFileName: 'deep-filter-0.5.6-x86_64-unknown-linux-musl'
  modelArchiveFileName: 'DeepFilterNet3_onnx.tar.gz'
  cliSha256: '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da'
  modelArchiveSha256: 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616'
  aggregateSha256: 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b'
  phase36CRunId: 'phase36c-20260530T133009'
  phase36CExecutionId: 'reeditpro-staging-deepfilternet-runtime-job-pxjbq'
  phase36CImageDigest: 'sha256:363d436bbd958a38ddb18cfb028ce2d3eb379317c28cef81dda502567a0aafce'
  runtimeJobName: 'reeditpro-staging-deepfilternet-runtime-job'
  runtimeImageTag: 'staging-deepfilternet-real-video-audio-001'
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime:staging-deepfilternet-real-video-audio-001'
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime'
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  artifactRuntimePath: '/tmp/reeditpro-audio-ai/deepfilternet/v0.5.6'
  reportObjectPrefix: 'activation-audio-ai/phase36d'
  cpu: 4
  memory: '8Gi'
}

export interface RealVideoDeepFilterNetValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  inputVideo?: string
  referencePhase31Audio?: string
  artifactGcsPath?: string
  cliSha256?: string
  modelArchiveSha256?: string
  aggregateSha256?: string
  inputDurationSeconds?: number
  providerExecutionEnabled?: string
  publicAccessEnabled?: string
  rnnoiseEnabled?: string
  demucsEnabled?: string
  finalDeliveryEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  broadRealMediaReady?: string
}

export interface RealVideoDeepFilterNetValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface RealVideoDeepFilterNetIamPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
  required: boolean
}

export interface RealVideoDeepFilterNetCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface RealVideoDeepFilterNetPlanSnapshot {
  planId: string
  phase36DRunId: string
  approvedInputVideo: string
  referencePhase31Audio: string
  sourceValidation: {
    expectedDurationSeconds: number
    maxDurationSeconds: number
    audioStreamRequired: true
    videoStreamRequired: true
  }
  feature: 'real_video_deepfilternet_audio_cleanup'
  tool: {
    id: 'deepfilternet'
    version: 'v0.5.6'
    artifactGcsPath: string
  }
  audioExtractionPlan: {
    outputFormat: 'wav'
    sampleRate: 48000
    channels: 1
  }
  cleanupPlan: {
    cliCommand: 'deep-filter --model <local DeepFilterNet3_onnx.tar.gz> --output-dir <enhanced-dir> <input-audio.wav>'
    externalDownloadsAllowed: false
  }
  remuxPlan: {
    privateReviewMp4Allowed: true
    finalDeliveryAllowed: false
    videoStreamPolicy: 'copy_original_stream_when_safe'
  }
  outputPrefixes: {
    generatedAssets: string
    finalExports: string
    analysis: string
    qa: string
    workerTemp: string
  }
  blockedFeatures: string[]
  approval: {
    approvedPlanSnapshot: true
    rawPromptExecution: false
  }
  safety: {
    providerAllowed: false
    rnnoiseAllowed: false
    demucsAllowed: false
    publicAccessAllowed: false
    productionReadyAllowed: false
    externalBetaAllowed: false
    broadRealUserMediaAllowed: false
    finalDeliveryAllowed: false
  }
}

export interface RealVideoDeepFilterNetSourceSummary {
  approvedInputVideo: string
  referencePhase31Audio: string
  phase36CRunId: string
  phase36CExecutionId: string
  sourceLocked: boolean
  blockers: string[]
  warnings: string[]
}

export interface RealVideoDeepFilterNetArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface RealVideoDeepFilterNetAudioMetrics {
  sampleRate: number
  channels: number
  durationSeconds: number
  sampleCount: number
  peakAbs: number
  rms: number
  clippingSampleCount: number
  peakDbfs?: number
  rmsDbfs?: number
}

export interface RealVideoDeepFilterNetQaGate {
  gateId:
    | 'source_integrity'
    | 'plan_snapshot_integrity'
    | 'model_artifacts'
    | 'audio_extraction'
    | 'deepfilternet_cleanup'
    | 'audio_safety_metrics'
    | 'review_preview'
    | 'artifact_privacy'
    | 'blocked_features'
  status: RealVideoDeepFilterNetQaStatus
  summary: string
}

export interface RealVideoDeepFilterNetExecutionReport {
  ok: boolean
  runId: string
  projectId: 'reeditpro'
  jobName: string
  executionId?: string
  image?: {
    image: string
    digest?: string
  }
  source: {
    inputVideo: string
    referencePhase31Audio: string
    durationSeconds?: number
    audioStreamPresent: boolean
    videoStreamPresent: boolean
  }
  planSnapshot: {
    gcsUri: string
    rawPromptExecution: false
  }
  model: {
    toolId: 'deepfilternet'
    toolVersion: 'v0.5.6'
    artifactGcsPath: string
    cliSha256: string
    modelArchiveSha256: string
    aggregateSha256: string
    copiedFiles: string[]
  }
  audioExtraction: {
    inputAudioUri?: string
    sampleRate?: number
    channels?: number
    durationSeconds?: number
  }
  cleanedAudio: {
    status: 'completed' | 'failed'
    cleanedAudioUri?: string
    inputMetrics?: RealVideoDeepFilterNetAudioMetrics
    outputMetrics?: RealVideoDeepFilterNetAudioMetrics
    comparisonMetrics?: Record<string, number | string | boolean>
  }
  reviewPreview: {
    status: 'created' | 'blocked'
    gcsUri?: string
    reason?: string
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: RealVideoDeepFilterNetQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: RealVideoDeepFilterNetArtifact[]
  safety: {
    approvedControlledVideoOnly: true
    arbitraryMediaUsed: false
    providerExecuted: false
    modelDownloadedExternally: false
    rnnoiseUsed: false
    demucsUsed: false
    filmUsed: false
    slowMotionExecuted: false
    revideoUsed: false
    publicAccessEnabled: false
    secretValuesUsed: false
    finalDeliveryCreated: false
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

export interface ApprovedRealVideoDeepFilterNetEvidence {
  phase: '36D'
  status: 'not_started' | 'completed' | 'blocked'
  runId?: string
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName: 'reeditpro-staging-deepfilternet-runtime-job'
  cloudRunExecutionId?: string
  sourceInputVideo: string
  referencePhase31Audio: string
  planSnapshotUri?: string
  cleanedAudioUri?: string
  privateReviewPreviewUri?: string
  qaReportUri?: string
  toolId: 'deepfilternet'
  toolVersion: 'v0.5.6'
  artifactGcsPath: string
  cliSha256: string
  modelArchiveSha256: string
  aggregateSha256: string
  realMediaAudioAiCleanupCompleted: boolean
  phase36EReadiness: {
    readyForDeepFilterNetPrivateAudioFeatureE2E: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface RealVideoDeepFilterNetReport {
  reportId: 'activation-phase-36d-real-video-deepfilternet-audio-cleanup'
  createdAt: string
  config: RealVideoDeepFilterNetConfig
  sourceSummary: RealVideoDeepFilterNetSourceSummary
  planSnapshot: RealVideoDeepFilterNetPlanSnapshot
  iamPlan: RealVideoDeepFilterNetIamPlan[]
  commandPlans: RealVideoDeepFilterNetCommandPlan[]
  approvedEvidence: ApprovedRealVideoDeepFilterNetEvidence
  status: RealVideoDeepFilterNetStatus
  blockers: string[]
  warnings: string[]
  realMediaAudioAiCleanupCompleted: boolean
  phase36EReadiness: {
    readyForDeepFilterNetPrivateAudioFeatureE2E: boolean
    reason: string
  }
  audioCleanupAllowedForApprovedChain: true
  arbitraryRealUserMediaAllowed: false
  rnnoiseAllowed: false
  demucsAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  filmAllowed: false
  slowMotionAllowed: false
  finalDeliveryAllowed: false
}
