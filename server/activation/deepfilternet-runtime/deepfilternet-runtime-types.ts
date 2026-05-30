export type DeepFilterNetRuntimeStatus = 'planned' | 'ready' | 'blocked' | 'failed'
export type DeepFilterNetRuntimeQaGateStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface DeepFilterNetRuntimeConfig {
  phase: '36C'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'generated_audio'
  toolId: 'deepfilternet'
  toolVersion: 'v0.5.6'
  artifactGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/'
  cliFileName: 'deep-filter-0.5.6-x86_64-unknown-linux-musl'
  modelArchiveFileName: 'DeepFilterNet3_onnx.tar.gz'
  cliSha256: '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da'
  modelArchiveSha256: 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616'
  aggregateSha256: 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b'
  runtimeJobName: 'reeditpro-staging-deepfilternet-runtime-job'
  runtimeImageTag: 'staging-deepfilternet-runtime-001'
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime:staging-deepfilternet-runtime-001'
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime'
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  artifactRuntimePath: '/tmp/reeditpro-audio-ai/deepfilternet/v0.5.6'
  reportObjectPrefix: 'activation-audio-ai/phase36c'
  cpu: 4
  memory: '8Gi'
  fixtureSampleRate: 48000
  fixtureChannels: 1
  fixtureDurationSeconds: 10
}

export interface DeepFilterNetRuntimeEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  artifactGcsPath?: string
  cliSha256?: string
  modelArchiveSha256?: string
  aggregateSha256?: string
  generatedAudioOnly?: string
  realMediaInputEnabled?: string
  providerExecutionEnabled?: string
  rnnoiseEnabled?: string
  demucsEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  broadRealMediaReady?: string
}

export interface DeepFilterNetRuntimeValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface DeepFilterNetRuntimeCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface DeepFilterNetRuntimeIamPlan {
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

export interface DeepFilterNetRuntimeFixturePlan {
  generatedAudioOnly: true
  sampleRate: 48000
  channels: 1
  durationSeconds: 10
  format: 'wav'
  cleanReferenceGenerated: true
  noiseProfile: string
  blockers: string[]
  warnings: string[]
}

export interface DeepFilterNetRuntimeArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface DeepFilterNetAudioMetrics {
  sampleRate: number
  channels: number
  durationSeconds: number
  sampleCount: number
  peakAbs: number
  rms: number
  clippingSampleCount: number
}

export interface DeepFilterNetRuntimeQaGate {
  gateId:
    | 'model_artifacts'
    | 'runtime_integrity'
    | 'fixture_integrity'
    | 'enhanced_audio_artifacts'
    | 'audio_safety_metrics'
    | 'artifact_privacy'
    | 'blocked_features'
  status: DeepFilterNetRuntimeQaGateStatus
  summary: string
}

export interface DeepFilterNetRuntimeExecutionReport {
  ok: boolean
  runId: string
  projectId: 'reeditpro'
  jobName: string
  executionId?: string
  image?: {
    image: string
    digest?: string
  }
  runtime: {
    mode: 'generated_audio'
    cpuOnly: true
    cliExecutable: boolean
    exitCode: number
    stderrPreview: string
  }
  model: {
    toolId: 'deepfilternet'
    toolVersion: 'v0.5.6'
    artifactGcsPath: string
    runtimePath: string
    cliFileName: string
    modelArchiveFileName: string
    cliSha256: string
    modelArchiveSha256: string
    aggregateSha256: string
    copiedFiles: string[]
  }
  fixture: {
    generated: true
    generatedAudioOnly: true
    sampleRate: 48000
    channels: 1
    durationSeconds: number
    cleanReferenceUri: string
    noisyInputUri: string
    manifestUri: string
  }
  enhancedAudio: {
    status: 'completed' | 'failed'
    enhancedAudioUri?: string
    inputMetrics: DeepFilterNetAudioMetrics
    outputMetrics?: DeepFilterNetAudioMetrics
    comparisonMetrics?: Record<string, number | string | boolean>
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: DeepFilterNetRuntimeQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: DeepFilterNetRuntimeArtifact[]
  safety: {
    generatedAudioOnly: true
    providerExecuted: false
    modelDownloadedExternally: false
    realMediaUsed: false
    realVideoInputUsed: false
    realAudioInputUsed: false
    rnnoiseUsed: false
    demucsUsed: false
    filmUsed: false
    slowMotionExecuted: false
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

export interface ApprovedDeepFilterNetRuntimeEvidence {
  phase: '36C'
  status: 'not_started' | 'verified' | 'blocked'
  runId?: string
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName: 'reeditpro-staging-deepfilternet-runtime-job'
  cloudRunExecutionId?: string
  toolId: 'deepfilternet'
  toolVersion: 'v0.5.6'
  artifactGcsPath: string
  cliSha256: string
  modelArchiveSha256: string
  aggregateSha256: string
  generatedFixture?: {
    sampleRate: number
    channels: number
    durationSeconds: number
  }
  enhancedAudioUri?: string
  artifactPrefix?: string
  qaReportUri?: string
  phase36DReadiness: {
    readyForControlledRealVideoAudioAiCleanupSample: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface DeepFilterNetRuntimeReport {
  reportId: 'activation-phase-36c-deepfilternet-runtime'
  createdAt: string
  config: DeepFilterNetRuntimeConfig
  fixturePlan: DeepFilterNetRuntimeFixturePlan
  iamPlan: DeepFilterNetRuntimeIamPlan[]
  commandPlans: DeepFilterNetRuntimeCommandPlan[]
  approvedEvidence: ApprovedDeepFilterNetRuntimeEvidence
  status: DeepFilterNetRuntimeStatus
  blockers: string[]
  warnings: string[]
  runtimeImageBuilt: boolean
  runtimeImagePushed: boolean
  jobDeployed: boolean
  jobExecuted: boolean
  deepFilterNetRuntimeVerified: boolean
  phase36DReadiness: {
    readyForControlledRealVideoAudioAiCleanupSample: boolean
    reason: string
  }
  generatedAudioOnly: true
  realVideoInputAllowed: false
  realUserMediaAllowed: false
  realMediaAudioAiAllowed: false
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
}
