export type FilmRuntimeStatus = 'planned' | 'ready' | 'blocked' | 'failed'
export type FilmRuntimeQaGateStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'
export type FilmRuntimeComputeMode = 'cpu'

export interface FilmRuntimeConfig {
  phase: '38C'
  track: 'A visual/video'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'generated_frame_interpolation'
  toolFamily: 'FILM / frame interpolation / slow motion'
  toolId: 'film'
  artifactId: 'film_net_style_saved_model'
  artifactGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/film/film-net-style-saved-model/'
  artifactRuntimePath: '/tmp/reeditpro-model-weights/film/film-net-style-saved-model'
  kerasMetadataSha256: '0291f451e35e62a042fa49a1341af1dc8a94632188a24a16b71a9516e9fc6853'
  savedModelSha256: '4df311e80e9a7282b362a7e93bef22a1ce4f84e7cdeda01f246894545eaaf985'
  variablesDataSha256: '8c47323923bc4826b730dd882c8c7700761aa3ac03b2c8180d3ffc82d18111f9'
  variablesIndexSha256: 'd19bb117eb9abe6121b5711649bb7d5d1c4fe1912b9deabbdafa2be3f5a273e5'
  aggregateSha256: '6f619330c4785a251883b96627dad6ed3a1e1aedc56ed4aa54e5e3f0b57ec97b'
  runtimeJobName: 'reeditpro-staging-film-runtime-job'
  runtimeImageTag: 'staging-film-runtime-001'
  runtimeTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime:staging-film-runtime-001'
  runtimeImageRepository: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime'
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  computeMode: FilmRuntimeComputeMode
  cpu: 4
  memory: '8Gi'
  reportObjectPrefix: 'activation-film-runtime/phase38c'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  fixtureFrameCount: 2
  fixtureWidth: 256
  fixtureHeight: 256
  interpolationTime: 0.5
}

export interface FilmRuntimeEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  artifactGcsPath?: string
  kerasMetadataSha256?: string
  savedModelSha256?: string
  variablesDataSha256?: string
  variablesIndexSha256?: string
  aggregateSha256?: string
  generatedFramesOnly?: string
  providerExecutionEnabled?: string
  realMediaInputEnabled?: string
  revideoEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  broadRealMediaReady?: string
}

export interface FilmRuntimeValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface FilmRuntimeCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface FilmRuntimeIamPlan {
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

export interface FilmRuntimeFixturePlan {
  generatedFramesOnly: true
  frameCount: 2
  width: 256
  height: 256
  format: 'png'
  interpolationTime: 0.5
  subjectDescription: string
  blockers: string[]
  warnings: string[]
}

export interface FilmRuntimeArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface FilmRuntimeQaGate {
  gateId:
    | 'model_artifacts'
    | 'runtime_integrity'
    | 'fixture_integrity'
    | 'interpolated_frame_artifacts'
    | 'motion_sanity'
    | 'artifact_privacy'
    | 'blocked_features'
  status: FilmRuntimeQaGateStatus
  summary: string
}

export interface FilmRuntimeExecutionReport {
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
  model: {
    toolId: 'film'
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
  fixture: {
    generated: true
    width: number
    height: number
    frameCount: 2
    interpolationTime: 0.5
    frameUris: string[]
    manifestUri?: string
  }
  interpolation: {
    status: 'completed' | 'failed'
    interpolatedFrameCount: number
    interpolatedFrameUris: string[]
    metrics: {
      meanAbsoluteDiffFromFrameA: number
      meanAbsoluteDiffFromFrameB: number
      outputStddev: number
    }
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: FilmRuntimeQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: FilmRuntimeArtifact[]
  safety: {
    generatedFramesOnly: true
    providerExecuted: false
    modelDownloadedExternally: false
    realMediaUsed: false
    realVideoInputUsed: false
    realVideoSlowMotionExecuted: false
    fullVideoInterpolationExecuted: false
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

export interface ApprovedFilmRuntimeEvidence {
  phase: '38C'
  status: 'not_started' | 'verified' | 'blocked'
  runId?: string
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName: 'reeditpro-staging-film-runtime-job'
  cloudRunExecutionId?: string
  computeMode: 'cpu'
  artifactId: 'film_net_style_saved_model'
  aggregateSha256: string
  generatedFixture?: {
    width: number
    height: number
    frameCount: 2
    interpolationTime: 0.5
  }
  interpolatedFrameCount?: number
  artifactPrefix?: string
  qaReportUri?: string
  phase38DReadiness: {
    readyForControlledSelectedRealVideoSlowMotionSample: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface FilmRuntimeReport {
  reportId: 'activation-phase-38c-film-runtime'
  createdAt: string
  config: FilmRuntimeConfig
  fixturePlan: FilmRuntimeFixturePlan
  iamPlan: FilmRuntimeIamPlan[]
  commandPlans: FilmRuntimeCommandPlan[]
  approvedEvidence: ApprovedFilmRuntimeEvidence
  executionReport?: FilmRuntimeExecutionReport
  status: FilmRuntimeStatus
  blockers: string[]
  warnings: string[]
  runtimeImageBuilt: boolean
  runtimeImagePushed: boolean
  jobDeployed: boolean
  jobExecuted: boolean
  filmRuntimeVerified: boolean
  phase38DReadiness: {
    readyForControlledSelectedRealVideoSlowMotionSample: boolean
    reason: string
  }
  generatedFramesOnly: true
  realVideoInputAllowed: false
  realUserMediaAllowed: false
  realVideoSlowMotionAllowed: false
  fullVideoInterpolationAllowed: false
  slowMotionAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}
