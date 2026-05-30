export type DeepFilterNetFeatureE2EStatus = 'planned' | 'ready' | 'blocked'
export type DeepFilterNetFeatureE2EQaStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface DeepFilterNetFeatureE2EConfig {
  phase: '36E'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'audio_feature_e2e'
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
  phase36DRunId: 'phase36d-20260530T141724'
  phase36DExecutionId: 'reeditpro-staging-deepfilternet-runtime-job-gqbkz'
  phase36DImageDigest: 'sha256:053a35cdbe3cac2d73be83fa19696b65b5d492b526d57e00c87d4e48506b09c4'
  phase36DReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36d/phase36d-20260530T141724/reports/phase36d-report.json'
  runtimeJobName: 'reeditpro-staging-deepfilternet-runtime-job'
  runtimeImageTag: 'staging-deepfilternet-audio-feature-e2e-001'
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime:staging-deepfilternet-audio-feature-e2e-001'
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime'
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  artifactRuntimePath: '/tmp/reeditpro-audio-ai/deepfilternet/v0.5.6'
  reportObjectPrefix: 'activation-audio-ai/phase36e'
  cpu: 4
  memory: '8Gi'
}

export interface DeepFilterNetFeatureE2EValidationInput {
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

export interface DeepFilterNetFeatureE2EValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface DeepFilterNetFeatureE2EIamPlan {
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

export interface DeepFilterNetFeatureE2ECommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface DeepFilterNetFeatureE2EPlanSnapshot {
  planId: string
  phase36ERunId: string
  phase36DRunId: string
  approvedInputVideo: string
  referencePhase31Audio: string
  sourceValidation: {
    expectedDurationSeconds: number
    maxDurationSeconds: number
    audioStreamRequired: true
    videoStreamRequired: true
  }
  feature: 'deepfilternet_audio_feature_e2e'
  tool: {
    id: 'deepfilternet'
    version: 'v0.5.6'
    artifactGcsPath: string
  }
  phase36DEvidence: {
    qaReportUri: string
    previousRuntimeImageDigest: string
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

export interface DeepFilterNetFeatureE2ESourceSummary {
  approvedInputVideo: string
  referencePhase31Audio: string
  phase36CRunId: string
  phase36CExecutionId: string
  phase36DRunId: string
  phase36DExecutionId: string
  phase36DReportUri: string
  sourceLocked: boolean
  blockers: string[]
  warnings: string[]
}

export interface DeepFilterNetFeatureE2EArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface DeepFilterNetFeatureE2EAudioMetrics {
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

export interface DeepFilterNetFeatureE2EQaGate {
  gateId:
    | 'source_integrity'
    | 'plan_snapshot_integrity'
    | 'phase36d_evidence'
    | 'model_artifacts'
    | 'audio_extraction'
    | 'deepfilternet_cleanup'
    | 'audio_safety_metrics'
    | 'review_preview'
    | 'artifact_privacy'
    | 'feature_readiness_evidence'
    | 'blocked_features'
  status: DeepFilterNetFeatureE2EQaStatus
  summary: string
}

export interface DeepFilterNetFeatureE2EExecutionReport {
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
  phase36DEvidence?: {
    runId: string
    reportUri: string
    completed: boolean
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
    inputMetrics?: DeepFilterNetFeatureE2EAudioMetrics
    outputMetrics?: DeepFilterNetFeatureE2EAudioMetrics
    comparisonMetrics?: Record<string, number | string | boolean>
  }
  reviewPreview: {
    status: 'created' | 'blocked'
    gcsUri?: string
    reason?: string
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: DeepFilterNetFeatureE2EQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: DeepFilterNetFeatureE2EArtifact[]
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

export interface ApprovedDeepFilterNetFeatureE2EEvidence {
  phase: '36E'
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
  deepFilterNetFeatureE2ECompleted: boolean
  phase37AReadiness: {
    readyForOcrApprovalWorkflow: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface DeepFilterNetFeatureE2EReport {
  reportId: 'activation-phase-36e-deepfilternet-feature-e2e'
  createdAt: string
  config: DeepFilterNetFeatureE2EConfig
  sourceSummary: DeepFilterNetFeatureE2ESourceSummary
  planSnapshot: DeepFilterNetFeatureE2EPlanSnapshot
  iamPlan: DeepFilterNetFeatureE2EIamPlan[]
  commandPlans: DeepFilterNetFeatureE2ECommandPlan[]
  approvedEvidence: ApprovedDeepFilterNetFeatureE2EEvidence
  status: DeepFilterNetFeatureE2EStatus
  blockers: string[]
  warnings: string[]
  deepFilterNetFeatureE2ECompleted: boolean
  phase37AReadiness: {
    readyForOcrApprovalWorkflow: boolean
    reason: string
  }
  audioFeatureE2EAllowed: true
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
