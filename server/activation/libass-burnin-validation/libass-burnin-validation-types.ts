export type LibassBurninValidationStatus = 'planned' | 'ready' | 'blocked'
export type LibassBurninRuntimeMode = 'libass_caption_burnin_validation'
export type LibassBurninQaGateId =
  | 'source_integrity'
  | 'caption_sidecar_integrity'
  | 'libass_filter_available'
  | 'burnin_preview_created'
  | 'preview_decodes'
  | 'duration_bounds'
  | 'no_final_delivery'
  | 'artifact_privacy'
  | 'blocked_features'

export interface LibassBurninValidationConfig {
  phase: '45A'
  track: 'A visual/video'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: LibassBurninRuntimeMode
  approvedInputVideoGcsUri: string
  approvedCaptionAssGcsUri: string
  approvedCaptionSha256: string
  sourceRunId: 'phase32-20260528T13330'
  captionRunId: 'phase28-20260528T01552'
  phase40DRunId: 'phase40d-20260531T12493'
  phase40DReportUri: string
  runtimeJobName: 'reeditpro-staging-libass-burnin-validation-job'
  runtimeImageTag: 'staging-libass-burnin-validation-001'
  runtimeTargetImage: string
  runtimeImageRepository: string
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  computeMode: 'cpu'
  cpu: 4
  memory: '4Gi'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  transcriptsBucket: 'reeditpro-staging-reeditpro-transcripts'
  previewsBucket: 'reeditpro-staging-reeditpro-previews'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  reportObjectPrefix: 'activation-render-hardening/phase45a'
  previewStartSeconds: 0
  previewDurationSeconds: 5
  maxPreviewDurationSeconds: 6
  previewWidth: 432
  previewHeight: 768
}

export interface LibassBurninExecutionReport {
  ok: boolean
  phase: '45A'
  runId: string
  projectId: string
  jobName: string
  executionId?: string
  runtimeMode: LibassBurninRuntimeMode
  image?: {
    image?: string
    digest?: string
  }
  compute: {
    mode: 'cpu'
    cpu: number
    memory: string
    gpuRequested: false
  }
  source: {
    inputVideoGcsUri: string
    durationSeconds?: number
    videoStreamPresent: boolean
    audioStreamPresent: boolean
  }
  captions: {
    assGcsUri: string
    sha256: string
    sizeBytes: number
    hasScriptInfo: boolean
    hasStyles: boolean
    hasEvents: boolean
  }
  preview: {
    gcsUri?: string
    startSeconds: number
    durationSeconds?: number
    width?: number
    height?: number
    videoStreamPresent: boolean
    audioStreamPresent: boolean
  }
  artifacts: Array<{
    id: string
    kind: string
    bucket: string
    object: string
    gcsUri: string
    sizeBytes: number
    sha256: string
  }>
  qa: {
    status: 'passed' | 'blocked'
    gates: Array<{
      gateId: LibassBurninQaGateId
      passed: boolean
      severity: 'mandatory' | 'warning'
      summary: string
    }>
    blockers: string[]
    warnings: string[]
  }
  phase45BReadiness: {
    readyForRemotionRenderValidation: boolean
    reason: string
  }
  safety: {
    approvedSourceOnly: boolean
    approvedCaptionOnly: boolean
    arbitraryMediaUsed: false
    finalDeliveryCreated: false
    providerExecuted: false
    revideoUsed: false
    trackBToolsUsed: false
    publicAccessEnabled: false
    productionReadyAllowed: false
    externalBetaAllowed: false
    broadRealUserMediaAllowed: false
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedLibassBurninEvidence {
  phase: '45A'
  status: 'verified' | 'blocked' | 'not_run'
  runId?: string
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName?: string
  cloudRunExecutionId?: string
  sourceInputVideo?: string
  captionSource?: string
  previewUri?: string
  qaReportUri?: string
  toolResults: {
    ffmpeg: 'passed' | 'blocked' | 'skipped'
    ffprobe: 'passed' | 'blocked' | 'skipped'
    libass: 'passed' | 'blocked' | 'skipped'
  }
  phase45BReadiness: {
    readyForRemotionRenderValidation: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface LibassBurninReport {
  reportId: 'activation-phase-45a-libass-burnin-validation'
  createdAt: string
  config: LibassBurninValidationConfig
  approvedEvidence: ApprovedLibassBurninEvidence
  executionReport?: LibassBurninExecutionReport
  status: LibassBurninValidationStatus
  blockers: string[]
  warnings: string[]
  libassBurninValidated: boolean
  phase45BReadiness: {
    readyForRemotionRenderValidation: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
  finalDeliveryAllowed: false
  providerAllowed: false
  revideoAllowed: false
  trackBAllowed: false
}
