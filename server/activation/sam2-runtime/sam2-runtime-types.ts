export type Sam2RuntimeStatus = 'planned' | 'ready' | 'blocked' | 'failed'

export type Sam2RuntimeQaGateStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface Sam2RuntimeConfig {
  phase: '35C'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'generated_synthetic_sequence'
  modelFamily: 'SAM2 / Segment Anything Model 2'
  modelId: 'sam2.1_hiera_tiny'
  checkpointFileName: 'sam2.1_hiera_tiny.pt'
  configFileName: 'sam2.1_hiera_t.yaml'
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/sam2.1-hiera-tiny/'
  checkpointSha256: '7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69'
  configSha256: 'f932eac1c6241e910031b2f000a81cd9f8a8d4896e2277ab5ffb721f378b188d'
  aggregateSha256: '45ad40cc297713cf822419c5b94a7025f80e96525fb2b9cb9b47a1bf4350c2b2'
  runtimeJobName: 'reeditpro-staging-sam2-runtime-job'
  runtimeImageTag: 'staging-sam2-runtime-001'
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime:staging-sam2-runtime-001'
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-sam2-runtime'
  serviceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  reportObjectPrefix: 'activation-sam2-runtime/phase35c'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  modelRuntimePath: '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny'
  gpuType: 'nvidia-l4'
  gpuCount: 1
  cpu: 4
  memory: '16Gi'
  fixtureFrameCount: 5
  fixtureWidth: 512
  fixtureHeight: 512
}

export interface Sam2RuntimeEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  modelGcsPath?: string
  checkpointSha256?: string
  configSha256?: string
  aggregateSha256?: string
  gpuType?: string
  providerExecutionEnabled?: string
  realMediaInputEnabled?: string
  productionReady?: string
}

export interface Sam2RuntimeValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface Sam2RuntimeCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface Sam2RuntimeIamPlan {
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

export interface Sam2RuntimeFixturePlan {
  generatedFixtureOnly: true
  frameCount: 5
  width: 512
  height: 512
  format: 'png'
  promptType: 'box'
  initialPrompt: [number, number, number, number]
  subjectDescription: string
  blockers: string[]
  warnings: string[]
}

export interface Sam2RuntimeArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface Sam2RuntimeQaGate {
  gateId:
    | 'model_artifacts'
    | 'runtime_integrity'
    | 'fixture_integrity'
    | 'mask_artifacts'
    | 'temporal_fixture_consistency'
    | 'artifact_privacy'
    | 'blocked_features'
  status: Sam2RuntimeQaGateStatus
  summary: string
}

export interface Sam2RuntimeExecutionReport {
  ok: boolean
  runId: string
  projectId: 'reeditpro'
  jobName: string
  executionId?: string
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
  fixture: {
    generated: true
    width: number
    height: number
    frameCount: number
    promptType: 'box'
    promptBox: [number, number, number, number]
    manifestUri?: string
    promptMetadataUri?: string
    frameUris: string[]
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
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: Sam2RuntimeQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: Sam2RuntimeArtifact[]
  safety: {
    generatedFixtureOnly: true
    providerExecuted: false
    modelDownloadedExternally: false
    realMediaUsed: false
    realVideoInputUsed: false
    fullVideoMaskExecuted: false
    fullVideoTextBehindSubjectExecuted: false
    filmUsed: false
    slowMotionExecuted: false
    revideoUsed: false
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

export interface ApprovedSam2RuntimeEvidence {
  phase: '35C'
  status: 'not_started' | 'verified' | 'blocked'
  runId?: string
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName: 'reeditpro-staging-sam2-runtime-job'
  cloudRunExecutionId?: string
  modelId: 'sam2.1_hiera_tiny'
  checkpointSha256: string
  configSha256: string
  aggregateSha256: string
  generatedFixture?: {
    width: number
    height: number
    frameCount: number
    promptType: 'box'
  }
  artifactPrefix?: string
  qaReportUri?: string
  phase35DReadiness: {
    readyForControlledShortRealVideoTemporalMaskTracking: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface Sam2RuntimeReport {
  reportId: 'activation-phase-35c-sam2-runtime'
  createdAt: string
  config: Sam2RuntimeConfig
  fixturePlan: Sam2RuntimeFixturePlan
  iamPlan: Sam2RuntimeIamPlan[]
  commandPlans: Sam2RuntimeCommandPlan[]
  approvedEvidence: ApprovedSam2RuntimeEvidence
  executionReport?: Sam2RuntimeExecutionReport
  status: Sam2RuntimeStatus
  blockers: string[]
  warnings: string[]
  runtimeImageBuilt: boolean
  runtimeImagePushed: boolean
  jobDeployed: boolean
  jobExecuted: boolean
  sam2RuntimeVerified: boolean
  phase35DReadiness: {
    readyForControlledShortRealVideoTemporalMaskTracking: boolean
    reason: string
  }
  generatedFixtureOnly: true
  realVideoInputAllowed: false
  realUserMediaAllowed: false
  temporalTrackingOnRealVideoAllowed: false
  sam2TemporalTrackingAllowed: false
  sam2FullVideoMaskAllowed: false
  fullVideoTextBehindSubjectAllowed: false
  providerAllowed: false
  revideoAllowed: false
  filmAllowed: false
  slowMotionAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}
