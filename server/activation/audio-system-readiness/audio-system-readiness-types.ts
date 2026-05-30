export type AudioSystemReadinessStatus = 'planned' | 'ready' | 'blocked'
export type AudioSystemReadinessQaStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface AudioSystemReadinessConfig {
  phase: '36F'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  approvedInputVideo: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'
  referencePhase31Audio: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4'
  phase31RunId: 'phase31-20260528T13060'
  phase36ERunId: 'phase36e-20260530T152327'
  phase36EExecutionId: 'reeditpro-staging-deepfilternet-runtime-job-hk6jm'
  phase36EReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36e/phase36e-20260530T152327/reports/phase36e-report.json'
  phase36ERuntimeImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:26aea2fc373322996430e9c677c5661e814777b2fe44714d508f3cdf50dd1e93'
  deepFilterNetToolVersion: 'v0.5.6'
  deepFilterNetArtifactGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/'
  deepFilterNetCliSha256: '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da'
  deepFilterNetModelArchiveSha256: 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616'
  deepFilterNetAggregateSha256: 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  reportObjectPrefix: 'activation-audio-ai/phase36f'
}

export interface AudioSystemReadinessValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  approvedInputVideo?: string
  phase36ERunId?: string
  providerExecutionEnabled?: string
  publicAccessEnabled?: string
  rnnoiseEnabled?: string
  demucsEnabled?: string
  productionReady?: string
  externalBetaReady?: string
  paidProductionReady?: string
  broadRealMediaReady?: string
}

export interface AudioSystemReadinessValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface AudioSystemEvidenceChainEntry {
  phase: '31' | '36A' | '36B' | '36C' | '36D' | '36E'
  name: string
  status: 'complete' | 'verified' | 'ready' | 'blocked'
  runId?: string
  reportUri?: string
  summary: string
  blockers: string[]
}

export interface AudioSystemBetaScopeManifest {
  phase: '36F'
  runId: string
  createdAt: string
  includedFeatures: Array<'ffmpeg_loudness_normalization' | 'deepfilternet_noise_reduction'>
  excludedFeatures: Array<'rnnoise' | 'demucs' | 'provider_audio' | 'provider_music' | 'provider_sfx' | 'revideo' | 'film' | 'slow_motion' | 'arbitrary_media' | 'production_delivery'>
  allowedInputs: string[]
  requiredRuntime: string[]
  privateReviewArtifacts: string[]
  gates: string[]
  readiness: {
    readyForInternalAudioFeatureTesting: boolean
    externalBetaAllowed: false
    paidProductionAllowed: false
    broadRealUserMediaAllowed: false
    productionReadyAllowed: false
  }
}

export interface AudioSystemArtifactVerification {
  artifactId: string
  gcsUri: string
  required: boolean
  exists: boolean
  private: boolean
  sizeBytes?: number
  blocker?: string
}

export interface AudioSystemRisk {
  riskId: string
  severity: 'blocker' | 'warning'
  mitigation: string
  currentStatus: string
}

export interface AudioSystemReadinessCommandPlan {
  commandId: string
  phase: 'preflight' | 'verify-artifacts' | 'execute' | 'report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface AudioSystemReadinessIamPlan {
  bindingId: string
  bucket: string
  role: 'existing-read-check' | 'existing-create-check'
  member: 'active-gcloud-account'
  conditionExpression: string
  description: string
  commandString: string
  mutationPlanned: false
}

export interface AudioSystemReadinessQaGate {
  gateId:
    | 'evidence_chain'
    | 'artifact_integrity'
    | 'source_integrity'
    | 'plan_snapshot_integrity'
    | 'audio_metrics'
    | 'privacy_security'
    | 'operational_readiness'
    | 'beta_scope'
    | 'blocked_features'
  status: AudioSystemReadinessQaStatus
  summary: string
}

export interface AudioSystemReadinessExecutionReport {
  ok: boolean
  phase: '36F'
  runId: string
  createdAt: string
  projectId: 'reeditpro'
  evidenceChain: AudioSystemEvidenceChainEntry[]
  phase36EReportUri: string
  phase36EArtifactVerification: AudioSystemArtifactVerification[]
  audioBetaScopeManifestUri?: string
  betaScope: AudioSystemBetaScopeManifest
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: AudioSystemReadinessQaGate[]
    blockers: string[]
    warnings: string[]
  }
  rollbackFallbackPlan: string[]
  operationalNotes: string[]
  readiness: {
    audioSystemInternalFeatureTestingReady: boolean
    reason: string
  }
  phase37AReadiness: {
    readyForOcrApprovalWorkflow: boolean
    reason: string
  }
  safety: {
    productionReadyAllowed: false
    externalBetaAllowed: false
    paidProductionAllowed: false
    broadRealUserMediaAllowed: false
    arbitraryRealUserMediaAllowed: false
    rnnoiseAllowed: false
    demucsAllowed: false
    providerAllowed: false
    revideoAllowed: false
    filmAllowed: false
    slowMotionAllowed: false
  }
  uploadedReport?: {
    bucket: string
    object: string
    gcsUri: string
  }
}

export interface ApprovedAudioSystemReadinessEvidence {
  phase: '36F'
  status: 'not_started' | 'completed' | 'blocked'
  runId?: string
  phase36ERunId: string
  phase36EReportUri: string
  betaScopeManifestUri?: string
  qaReportUri?: string
  audioSystemInternalFeatureTestingReady: boolean
  phase37AReadiness: {
    readyForOcrApprovalWorkflow: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface AudioSystemReadinessReport {
  reportId: 'activation-phase-36f-audio-system-internal-beta-readiness'
  createdAt: string
  config: AudioSystemReadinessConfig
  evidenceChain: AudioSystemEvidenceChainEntry[]
  betaScope: AudioSystemBetaScopeManifest
  iamPlan: AudioSystemReadinessIamPlan[]
  commandPlans: AudioSystemReadinessCommandPlan[]
  risks: AudioSystemRisk[]
  approvedEvidence: ApprovedAudioSystemReadinessEvidence
  status: AudioSystemReadinessStatus
  blockers: string[]
  warnings: string[]
  audioSystemInternalFeatureTestingReady: boolean
  phase37AReadiness: {
    readyForOcrApprovalWorkflow: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  arbitraryRealUserMediaAllowed: false
  rnnoiseAllowed: false
  demucsAllowed: false
  providerAllowed: false
  revideoAllowed: false
  filmAllowed: false
  slowMotionAllowed: false
}
