export type RealVideoMaskStatus = 'planned' | 'ready' | 'blocked' | 'failed'
export type RealVideoMaskQaGateStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface RealVideoMaskConfig {
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  phase32RunId: 'phase32-20260528T13330'
  sourceGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'
  sourceBucket: 'reeditpro-staging-reeditpro-final-exports'
  sourceObject: 'activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4'
  modelManifestId: 'birefnet_main_staging_v1'
  modelName: 'ZhengPeng7/BiRefNet'
  modelRevision: 'e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4'
  modelAggregateSha256: '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7'
  modelGcsPath: 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/'
  modelRuntimePath: '/tmp/reeditpro-model-weights/birefnet/main'
  renderJobName: 'reeditpro-staging-render-job'
  birefnetJobName: 'reeditpro-staging-birefnet-runtime-job'
  renderServiceAccountEmail: 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com'
  gpuServiceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  renderImageTag: 'staging-phase33d-frame-001'
  birefnetImageTag: 'staging-birefnet-realframe-001'
  renderTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-render-worker:staging-phase33d-frame-001'
  birefnetTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-birefnet-runtime:staging-birefnet-realframe-001'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  phase33dPrefix: 'activation-real-video/phase33d'
}

export interface RealVideoMaskArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface RealVideoRepresentativeFramePlan {
  sourceGcsUri: string
  defaultTimestampSeconds: 7.7
  selectionRule: 'duration_midpoint_if_available_else_default'
  outputObjectTemplate: string
  exactlyOneFrame: true
}

export interface RealVideoFrameExtractionReport {
  ok: boolean
  runId: string
  sourcePhase32RunId: string
  sourceGcsUri: string
  inputProbe: {
    durationSeconds?: number
    videoCodec?: string
    width?: number
    height?: number
    hasAudio: boolean
  }
  selectedTimestampSeconds: number
  selectionReason: string
  representativeFrame: RealVideoMaskArtifact
  artifacts: RealVideoMaskArtifact[]
  uploadedReport: {
    bucket: string
    object: string
    gcsUri: string
  }
  safety: {
    approvedPhase32InputOnly: true
    exactlyOneFrameExtracted: boolean
    secondSourceVideoUsed: false
    publicAccessEnabled: false
    sourceOverwritten: false
    providerExecuted: false
    modelDownloadedExternally: false
    revideoUsed: false
  }
  blockers: string[]
  warnings: string[]
}

export interface RealVideoMaskQaGate {
  gateId:
    | 'mask_edge_quality'
    | 'mask_subject_coverage'
    | 'render_asset_integrity'
    | 'mask_temporal_stability'
    | 'text_behind_subject_block'
  status: RealVideoMaskQaGateStatus
  summary: string
}

export interface RealVideoBiRefNetFrameMaskReport {
  ok: boolean
  runId: string
  sourcePhase32RunId: string
  projectId: 'reeditpro'
  jobName: string
  gpu: {
    requested: true
    type: 'nvidia-l4'
    count: 1
    cudaAvailable: boolean
    deviceName?: string
  }
  model: {
    manifestId: 'birefnet_main_staging_v1'
    name: 'ZhengPeng7/BiRefNet'
    revision: string
    gcsPath: string
    runtimePath: string
    aggregateSha256: string
    copiedFiles: string[]
  }
  customCodeScan: {
    customCodeFiles: string[]
    executedAllowlist: string[]
    neverImportedFiles: string[]
    blockedPatterns: string[]
    warnings: string[]
    blockers: string[]
  }
  representativeFrame: {
    gcsUri: string
    width: number
    height: number
  }
  mask: {
    status: 'completed' | 'failed'
    width?: number
    height?: number
    nonZeroRatio?: number
    meanAlpha?: number
    maskUri?: string
    cutoutUri?: string
    metadataUri?: string
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: RealVideoMaskQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: RealVideoMaskArtifact[]
  safety: {
    approvedPhase32InputOnly: true
    representativeFrameOnly: true
    fullVideoMaskExecuted: false
    secondSourceVideoUsed: false
    providerExecuted: false
    modelDownloadedExternally: false
    sam2Used: false
    textBehindSubjectExecuted: false
    secretValuesUsed: false
    publicAccessEnabled: false
    rtxPro6000Used: false
    revideoUsed: false
  }
  uploadedReport: {
    bucket: string
    object: string
    gcsUri: string
  }
  blockers: string[]
  warnings: string[]
}

export interface RealVideoMaskCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  warnings: string[]
}

export interface RealVideoMaskReport {
  reportId: string
  createdAt: string
  config: RealVideoMaskConfig
  representativeFramePlan: RealVideoRepresentativeFramePlan
  commandPlans: RealVideoMaskCommandPlan[]
  frameExtractionReport?: RealVideoFrameExtractionReport
  birefnetFrameMaskReport?: RealVideoBiRefNetFrameMaskReport
  status: RealVideoMaskStatus
  blockers: string[]
  warnings: string[]
  phase33EReadiness: {
    readyForTextBehindSubjectPlanning: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
  textBehindSubjectAllowed: false
}
