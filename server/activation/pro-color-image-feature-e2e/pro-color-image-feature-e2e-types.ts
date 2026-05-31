export type ProColorImageFeatureE2EStatus = 'planned' | 'ready' | 'blocked'
export type ProColorImageFeatureE2ERuntimeMode = 'pro_color_image_feature_e2e'
export type ProColorImageFeatureE2EToolId = 'ffprobe' | 'ffmpeg' | 'openimageio' | 'opencolorio' | 'kornia'
export type ProColorImageFeatureE2EToolStatus = 'passed' | 'blocked' | 'skipped'
export type ProColorImageFeatureE2EQaGateId =
  | 'source_integrity'
  | 'phase40c_evidence'
  | 'plan_snapshot_integrity'
  | 'sample_bounds'
  | 'openimageio_feature'
  | 'opencolorio_feature'
  | 'kornia_feature'
  | 'review_artifacts'
  | 'artifact_privacy'
  | 'feature_readiness_evidence'
  | 'blocked_features'

export interface ProColorImageFeatureE2EConfig {
  phase: '40D'
  track: 'A visual/video'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: ProColorImageFeatureE2ERuntimeMode
  approvedInputVideoGcsUri: string
  sourceRunId: 'phase32-20260528T13330'
  phase40CRunId: 'phase40c-20260531T11504'
  phase40CReportUri: string
  approvedPhase40CImage: string
  approvedPhase40CImageDigest: string
  approvedPhase40CExecutionId: 'reeditpro-staging-pro-color-image-runtime-job-xzz4f'
  runtimeJobName: 'reeditpro-staging-pro-color-image-runtime-job'
  runtimeImageTag: 'staging-pro-color-image-feature-e2e-001'
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
  reportObjectPrefix: 'activation-pro-color-image/phase40d'
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

export interface ProColorImageFeatureE2EEnvValidationInput {
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

export interface ProColorImageFeatureE2EValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface ProColorImageFeatureE2ESourceSummary {
  inputVideoGcsUri: string
  sourceRunId: string
  sourcePhase: 32
  expectedDurationSeconds: number
  phase40CRunId: string
  phase40CReportUri: string
  privateSourceOnly: true
  arbitraryMediaAllowed: false
  fullVideoProcessingAllowed: false
  warnings: string[]
}

export interface ProColorImageFeatureE2ESamplePlan {
  runtimeMode: ProColorImageFeatureE2ERuntimeMode
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

export interface ProColorImageFeatureE2EPlanSnapshot {
  planId: 'phase40d-pro-color-image-feature-e2e-plan-v1'
  phase: '40D'
  phase40DRunId: string
  feature: 'pro_color_image_feature_e2e'
  approvedPlanSnapshot: true
  rawPromptExecution: false
  approvedInputVideo: string
  sourcePhase: 32
  phase40CRunId: string
  sourceValidation: {
    expectedDurationSeconds: 15.467
    approvedSourceOnly: true
    privateSourceOnly: true
  }
  tools: ProColorImageFeatureE2EToolId[]
  toolVersions: {
    openColorIOVersion: string
    openImageIOVersion: string
    torchVersion: string
    korniaVersion: string
  }
  samplePlan: ProColorImageFeatureE2ESamplePlan
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

export interface ProColorImageFeatureE2EIamBindingPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
}

export interface ProColorImageFeatureE2ECommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface ProColorImageFeatureE2EToolExecutionResult {
  toolId: ProColorImageFeatureE2EToolId
  status: ProColorImageFeatureE2EToolStatus
  version?: string
  operation: string
  artifacts: string[]
  metrics: Record<string, number | string | boolean>
  blockers: string[]
  warnings: string[]
}

export interface ProColorImageFeatureE2EArtifactRecord {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface ProColorImageFeatureE2EQaGate {
  gateId: ProColorImageFeatureE2EQaGateId
  passed: boolean
  severity: 'mandatory' | 'warning'
  summary: string
}

export interface ProColorImageFeatureE2EExecutionReport {
  ok: boolean
  phase: '40D'
  runId: string
  projectId: string
  jobName: string
  executionId?: string
  runtimeMode: ProColorImageFeatureE2ERuntimeMode
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
  phase40CEvidence: {
    runId: string
    reportUri: string
    ok: boolean
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
  reviewArtifacts: {
    contactSheetUri?: string
    reviewManifestUri?: string
  }
  tools: ProColorImageFeatureE2EToolExecutionResult[]
  artifacts: ProColorImageFeatureE2EArtifactRecord[]
  qa: {
    status: 'passed' | 'blocked'
    gates: ProColorImageFeatureE2EQaGate[]
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
  featureReadiness: {
    readyForInternalProColorImageFeatureTesting: boolean
    reason: string
  }
  phase45AReadiness: {
    readyForLibassCaptionBurnInValidation: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedProColorImageFeatureE2EEvidence {
  phase: '40D'
  status: 'verified' | 'blocked' | 'not_run'
  runId?: string
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName?: string
  cloudRunExecutionId?: string
  sourceInputVideo?: string
  planSnapshotUri?: string
  reviewManifestUri?: string
  contactSheetUri?: string
  sample?: {
    timestampsSeconds: number[]
    width: number
    height: number
    frameCount: number
  }
  artifactPrefix?: string
  qaReportUri?: string
  toolResults: {
    ffprobe: ProColorImageFeatureE2EToolStatus
    ffmpeg: ProColorImageFeatureE2EToolStatus
    opencolorio: ProColorImageFeatureE2EToolStatus
    openimageio: ProColorImageFeatureE2EToolStatus
    kornia: ProColorImageFeatureE2EToolStatus
  }
  featureReadiness: {
    readyForInternalProColorImageFeatureTesting: boolean
    reason: string
  }
  phase45AReadiness: {
    readyForLibassCaptionBurnInValidation: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface ProColorImageFeatureE2EReport {
  reportId: 'activation-phase-40d-pro-color-image-feature-e2e'
  createdAt: string
  config: ProColorImageFeatureE2EConfig
  sourceSummary: ProColorImageFeatureE2ESourceSummary
  samplePlan: ProColorImageFeatureE2ESamplePlan
  planSnapshot: ProColorImageFeatureE2EPlanSnapshot
  iamPlan: ProColorImageFeatureE2EIamBindingPlan[]
  commandPlans: ProColorImageFeatureE2ECommandPlan[]
  approvedEvidence: ApprovedProColorImageFeatureE2EEvidence
  executionReport?: ProColorImageFeatureE2EExecutionReport
  status: ProColorImageFeatureE2EStatus
  blockers: string[]
  warnings: string[]
  runtimeImageBuilt: boolean
  runtimeImagePushed: boolean
  jobDeployed: boolean
  jobExecuted: boolean
  proColorImageFeatureE2ECompleted: boolean
  featureReadiness: {
    readyForInternalProColorImageFeatureTesting: boolean
    reason: string
  }
  phase45AReadiness: {
    readyForLibassCaptionBurnInValidation: boolean
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
