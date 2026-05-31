export type ProColorImageRuntimeStatus = 'planned' | 'ready' | 'blocked'
export type ProColorImageRuntimeMode = 'generated_fixture_color_image'
export type ProColorImageToolRuntimeStatus = 'passed' | 'blocked' | 'skipped'
export type ProColorImageQaGateId =
  | 'tool_runtime_integrity'
  | 'fixture_integrity'
  | 'opencolorio_result'
  | 'openimageio_result'
  | 'kornia_result'
  | 'image_artifact_integrity'
  | 'metadata_integrity'
  | 'color_transform_safety'
  | 'artifact_privacy'
  | 'blocked_features'

export interface ProColorImageRuntimeConfig {
  phase: '40B'
  track: 'A visual/video'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: ProColorImageRuntimeMode
  runtimeJobName: 'reeditpro-staging-pro-color-image-runtime-job'
  runtimeImageTag: 'staging-pro-color-image-runtime-torch-001'
  runtimeTargetImage: string
  runtimeImageRepository: string
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  computeMode: 'cpu'
  cpu: 4
  memory: '8Gi'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  reportObjectPrefix: 'activation-pro-color-image/phase40b'
  fixtureWidth: 256
  fixtureHeight: 256
  fixtureFrameCount: 3
}

export interface ProColorImageRuntimeEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  korniaTorchFixConfirmation?: string
  runtimeMode?: string
  providerExecutionEnabled?: string
  realMediaInputEnabled?: string
  revideoEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  broadRealMediaReady?: string
}

export interface ProColorImageRuntimeValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface ProColorImageRuntimeFixturePlan {
  mode: ProColorImageRuntimeMode
  generatedOnly: true
  width: number
  height: number
  frameCount: number
  fixtures: string[]
  expectedOperations: string[]
  blockers: string[]
  warnings: string[]
}

export interface ProColorImageRuntimeToolResolver {
  toolId: 'opencolorio' | 'openimageio' | 'kornia'
  displayName: string
  pythonImport: string
  pinnedPackage: string
  expectedOperation: string
  requiredForPhase40CPromotion: true
}

export interface ProColorImageRuntimeIamBindingPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
}

export interface ProColorImageRuntimeCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface ProColorImageToolExecutionResult {
  toolId: 'opencolorio' | 'openimageio' | 'kornia'
  status: ProColorImageToolRuntimeStatus
  version?: string
  operation: string
  artifacts: string[]
  metrics: Record<string, number | string | boolean>
  blockers: string[]
  warnings: string[]
}

export interface ProColorImageArtifactRecord {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface ProColorImageRuntimeQaGate {
  gateId: ProColorImageQaGateId
  passed: boolean
  severity: 'mandatory' | 'warning'
  summary: string
}

export interface ProColorImageRuntimeExecutionReport {
  ok: boolean
  phase: '40B'
  runId: string
  projectId: string
  jobName: string
  executionId?: string
  runtimeMode: ProColorImageRuntimeMode
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
  fixture: {
    generated: true
    width: number
    height: number
    frameCount: number
    frameUris: string[]
  }
  tools: ProColorImageToolExecutionResult[]
  artifacts: ProColorImageArtifactRecord[]
  qa: {
    status: 'passed' | 'blocked'
    gates: ProColorImageRuntimeQaGate[]
    blockers: string[]
    warnings: string[]
  }
  safety: {
    realMediaUsed: false
    realVideoUsed: false
    userMediaUsed: false
    providerExecuted: false
    revideoUsed: false
    publicAccessEnabled: false
    finalDeliveryCreated: false
    productionReadyAllowed: false
    externalBetaAllowed: false
    paidProductionAllowed: false
    broadRealUserMediaAllowed: false
  }
  phase40CReadiness: {
    readyForControlledRealVideoProColorImageSample: boolean
    reason: string
  }
  warnings: string[]
}

export interface ApprovedProColorImageRuntimeEvidence {
  phase: '40B'
  status: 'verified' | 'blocked' | 'not_run'
  runId?: string
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName?: string
  cloudRunExecutionId?: string
  computeMode: 'cpu'
  fixture?: {
    width: number
    height: number
    frameCount: number
  }
  artifactPrefix?: string
  qaReportUri?: string
  toolResults: {
    opencolorio: ProColorImageToolRuntimeStatus
    openimageio: ProColorImageToolRuntimeStatus
    kornia: ProColorImageToolRuntimeStatus
  }
  phase40CReadiness: {
    readyForControlledRealVideoProColorImageSample: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface ProColorImageRuntimeReport {
  reportId: 'activation-phase-40b-pro-color-image-runtime'
  createdAt: string
  config: ProColorImageRuntimeConfig
  fixturePlan: ProColorImageRuntimeFixturePlan
  toolResolver: ProColorImageRuntimeToolResolver[]
  iamPlan: ProColorImageRuntimeIamBindingPlan[]
  commandPlans: ProColorImageRuntimeCommandPlan[]
  approvedEvidence: ApprovedProColorImageRuntimeEvidence
  executionReport?: ProColorImageRuntimeExecutionReport
  status: ProColorImageRuntimeStatus
  blockers: string[]
  warnings: string[]
  runtimeImageBuilt: boolean
  runtimeImagePushed: boolean
  jobDeployed: boolean
  jobExecuted: boolean
  proColorImageRuntimeVerified: boolean
  phase40CReadiness: {
    readyForControlledRealVideoProColorImageSample: boolean
    reason: string
  }
  generatedFixtureOnly: true
  realVideoInputAllowed: false
  realUserMediaAllowed: false
  finalDeliveryAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}
