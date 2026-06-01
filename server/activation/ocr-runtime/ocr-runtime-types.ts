export type OcrRuntimeStatus = 'planned' | 'verified' | 'blocked' | 'failed'
export type OcrRuntimeMode = 'generated_ui_text_frame'
export type OcrRuntimeQaStatus = 'passed' | 'warning' | 'blocked' | 'skipped'
export type OcrGeneratedFixtureId =
  | 'basic-ui-text'
  | 'caption-safe-zone-conflict'
  | 'multi-region-ui'
  | 'low-contrast-warning'
  | 'small-text-warning'
  | 'rotated-text-blocked-or-warning'

export interface OcrRuntimeConfig {
  phase: '37C'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: OcrRuntimeMode
  modelFamily: 'PP-OCRv5'
  assetVersion: 'paddle3.0.0-mobile-safe-zone-v1'
  modelGcsPath: string
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  qaArtifactPrefix: 'activation/phase37c/generated-ocr-runtime'
  localTempRoot: '/tmp/reeditpro-ocr-runtime/phase37c'
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  cpuOnly: true
  fixtureWidth: 1280
  fixtureHeight: 720
  requiredTokenRecallThreshold: 0.8
  requiredAverageConfidenceThreshold: 0.6
  detectionArchiveSha256: string
  recognitionArchiveSha256: string
  dictionarySha256: string
  aggregateSha256: string
}

export interface OcrRuntimeEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  privateGcsReadConfirmation?: string
  runtimeExecuteConfirmation?: string
  artifactUploadConfirmation?: string
  dockerBuildConfirmation?: string
  runtimeMode?: string
  modelGcsPath?: string
  aggregateSha256?: string
  generatedFixturesOnly?: string
  realMediaInputEnabled?: string
  providerExecutionEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  broadRealMediaReady?: string
  publicOutputEnabled?: string
}

export interface OcrRuntimeValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface OcrRuntimeCommandPlan {
  commandId: string
  phase: 'preflight' | 'model-copy' | 'checksum' | 'extract' | 'fixture' | 'execute' | 'upload' | 'docker' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  confirmationEnvVar?:
    | 'REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ'
    | 'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE'
    | 'REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD'
    | 'REEDITPRO_CONFIRM_OCR_RUNTIME_DOCKER_BUILD'
  textOnlyByDefault: true
  doesNotDo: string[]
  warnings: string[]
}

export interface OcrRuntimeIamPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
  required: false
}

export interface OcrExpectedRegion {
  regionId: string
  label: string
  x: number
  y: number
  width: number
  height: number
  required: boolean
}

export interface OcrGeneratedFixtureSpec {
  fixtureId: OcrGeneratedFixtureId
  width: number
  height: number
  generatedOnly: true
  riskCategory: 'required_pass' | 'warning_only' | 'orientation_deferred'
  seed: string
  expectedTokens: string[]
  criticalTokens: string[]
  expectedRegions: OcrExpectedRegion[]
  captionConflictZone?: OcrExpectedRegion
  passCriteria: string[]
  warningCriteria: string[]
}

export interface OcrModelAssetVerificationEntry {
  relativePath: string
  gcsUri: string
  localPath: string
  expectedSha256: string
  actualSha256: string
  sizeBytes: number
  verified: boolean
}

export interface OcrModelAssetVerificationReport {
  phase: '37C'
  runId: string
  modelGcsPath: string
  aggregateSha256: string
  entries: OcrModelAssetVerificationEntry[]
  status: 'verified' | 'blocked'
  blockers: string[]
  warnings: string[]
}

export interface OcrRuntimeTextBox {
  text: string
  confidence?: number
  polygon: Array<[number, number]>
  center: [number, number]
}

export interface OcrFixtureRuntimeResult {
  fixtureId: OcrGeneratedFixtureId
  imagePath: string
  generatedOnly: true
  status: OcrRuntimeQaStatus
  textBoxes: OcrRuntimeTextBox[]
  recognizedText: string[]
  tokenRecall: number
  averageConfidence?: number
  matchedCriticalTokens: string[]
  missingCriticalTokens: string[]
  matchedRegionIds: string[]
  safeZoneCollision: boolean
  blockers: string[]
  warnings: string[]
}

export interface OcrTextMatchReport {
  phase: '37C'
  runId: string
  requiredTokenRecallThreshold: number
  requiredAverageConfidenceThreshold: number
  fixtureResults: Array<{
    fixtureId: OcrGeneratedFixtureId
    status: OcrRuntimeQaStatus
    tokenRecall: number
    averageConfidence?: number
    matchedCriticalTokens: string[]
    missingCriticalTokens: string[]
  }>
  blockers: string[]
  warnings: string[]
}

export interface OcrSafeZoneReport {
  phase: '37C'
  runId: string
  fixtureResults: Array<{
    fixtureId: OcrGeneratedFixtureId
    matchedRegionIds: string[]
    safeZoneCollision: boolean
    status: OcrRuntimeQaStatus
  }>
  blockers: string[]
  warnings: string[]
}

export interface OcrRuntimeQaGate {
  gateId:
    | 'phase37b_model_assets'
    | 'checksum_verification'
    | 'model_extraction'
    | 'runtime_integrity'
    | 'generated_fixture_integrity'
    | 'ocr_text_match'
    | 'caption_safe_zone_collision'
    | 'artifact_privacy'
    | 'blocked_features'
  status: OcrRuntimeQaStatus
  summary: string
}

export interface OcrRuntimeArtifact {
  id: string
  kind: 'report' | 'fixture_image' | 'metadata'
  localPath?: string
  bucket?: string
  object?: string
  gcsUri?: string
  sizeBytes?: number
  sha256?: string
}

export interface OcrRuntimeExecutionReport {
  ok: boolean
  runId: string
  phase: '37C'
  projectId: 'reeditpro'
  runtime: {
    mode: OcrRuntimeMode
    cpuOnly: true
    paddleOcrImported: boolean
    paddlePaddleImported: boolean
    paddleOcrVersion?: string
    paddlePaddleVersion?: string
    exitCode: number
    stderrPreview: string
    networkBlocked: boolean
    runtimeModelAutoDownloadBlocked: boolean
    localModelPathsUsed: boolean
    dictionaryPathUsed: boolean
  }
  model: {
    modelFamily: 'PP-OCRv5'
    assetVersion: 'paddle3.0.0-mobile-safe-zone-v1'
    modelGcsPath: string
    detectionModelDir: string
    recognitionModelDir: string
    dictionaryPath: string
    detectionArchiveSha256: string
    recognitionArchiveSha256: string
    dictionarySha256: string
    aggregateSha256: string
  }
  fixtures: OcrFixtureRuntimeResult[]
  textMatchReport: OcrTextMatchReport
  safeZoneReport: OcrSafeZoneReport
  qa: {
    status: OcrRuntimeQaStatus
    gates: OcrRuntimeQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: OcrRuntimeArtifact[]
  safety: {
    generatedFixturesOnly: true
    realMediaUsed: false
    realVideoInputUsed: false
    broadMediaUsed: false
    providerExecuted: false
    publicAccessEnabled: false
    signedUrlSourceOfTruthUsed: false
    cloudRunDeployed: false
    gpuJobUsed: false
    trackATouched: false
    productionReadyAllowed: false
    internalBetaAllowed: false
    externalBetaAllowed: false
    broadRealUserMediaAllowed: false
  }
  uploadedReport?: {
    bucket: string
    object: string
    gcsUri: string
  }
  warnings: string[]
}

export interface ApprovedOcrRuntimeEvidence {
  phase: '37C'
  status: 'not_started' | 'verified' | 'blocked'
  runId?: string
  modelFamily: 'PP-OCRv5'
  assetVersion: 'paddle3.0.0-mobile-safe-zone-v1'
  modelGcsPath: string
  detectionArchiveSha256: string
  recognitionArchiveSha256: string
  dictionarySha256: string
  aggregateSha256: string
  fixtureIds: OcrGeneratedFixtureId[]
  artifactPrefix?: string
  qaReportUri?: string
  phase37DReadiness: {
    readyForControlledRealVideoOcrSafeZone: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface OcrRuntimeReport {
  reportId: 'activation-phase-37c-generated-ocr-runtime-verification'
  createdAt: string
  config: OcrRuntimeConfig
  status: OcrRuntimeStatus
  fixtureSpecs: OcrGeneratedFixtureSpec[]
  iamPlan: OcrRuntimeIamPlan[]
  commandPlans: OcrRuntimeCommandPlan[]
  approvedEvidence: ApprovedOcrRuntimeEvidence
  blockers: string[]
  warnings: string[]
  ocrRuntimeVerified: boolean
  phase37DReadiness: {
    readyForControlledRealVideoOcrSafeZone: boolean
    reason: string
  }
  generatedFixturesOnly: true
  realMediaOcrAllowed: false
  realVideoOcrAllowed: false
  captionRenderIntegrationAllowed: false
  providerAllowed: false
  publicOutputAllowed: false
  signedUrlSourceOfTruthAllowed: false
  cloudRunDeployAllowed: false
  gpuJobAllowed: false
  productionReadyAllowed: false
  internalBetaAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  trackAAllowed: false
}

export interface OcrRuntimeExecutionResult {
  evidence: ApprovedOcrRuntimeEvidence
  executionReport: OcrRuntimeExecutionReport
  localReportPath: string
  localArtifactDir: string
  uploadedArtifacts: OcrRuntimeArtifact[]
}
