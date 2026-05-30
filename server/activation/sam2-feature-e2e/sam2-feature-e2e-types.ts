export type Sam2FeatureE2EStatus = 'planned' | 'ready' | 'blocked' | 'failed'
export type Sam2FeatureReadinessStatus =
  | 'ready_for_internal_sam2_feature_testing'
  | 'ready_for_segment_level_internal_testing_only'
  | 'blocked'
export type Sam2FeatureQaGateStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'
export type Sam2FeaturePreviewScopeMode = 'full_controlled_clip_preview' | 'approved_segment_fallback'

export interface Sam2FeatureE2EConfig {
  phase: '35F'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  runtimeMode: 'sam2_feature_e2e_preview'
  approvedLocalSourceCandidates: string[]
  approvedGcsSource: string
  approvedPreviewSource: string
  approvedPhase35CExecutionId: 'phase35c-20260529T16082'
  approvedPhase35DRunId: 'phase35d-20260530T004442'
  approvedPhase35ERunId: 'phase35e-20260530T01355'
  approvedText: 'REEDITPRO'
  previewWidth: 768
  previewHeight: 432
  preferredFps: 5
  maxFps: 8
  maxFrames: 125
  fallbackSegmentStartSeconds: 6.9
  fallbackSegmentEndSeconds: 8.9
  fallbackSegmentDurationSeconds: 2.0
  fallbackFrameCount: 10
  controlledPreviewDurationSeconds: 15.467
  modelFamily: 'SAM2 / Segment Anything Model 2'
  modelId: 'sam2.1_hiera_tiny'
  checkpointFileName: 'sam2.1_hiera_tiny.pt'
  configFileName: 'sam2.1_hiera_t.yaml'
  modelGcsPath: string
  checkpointSha256: string
  configSha256: string
  aggregateSha256: string
  runtimeJobName: 'reeditpro-staging-sam2-runtime-job'
  runtimeImageTag: 'staging-sam2-feature-e2e-001'
  runtimeTargetImage: string
  runtimeImageRepository: string
  approvedPhase35DImage: string
  gpuServiceAccountEmail: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  renderServiceAccountEmail: 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com'
  qaServiceAccountEmail: 'reeditpro-stg-qa-sa@reeditpro.iam.gserviceaccount.com'
  sourceMediaBucket: 'reeditpro-staging-reeditpro-source-media'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  masksBucket: 'reeditpro-staging-reeditpro-masks'
  previewsBucket: 'reeditpro-staging-reeditpro-previews'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  modelRuntimePath: '/tmp/reeditpro-model-weights/sam2/sam2.1-hiera-tiny'
  gpuType: 'nvidia-l4'
  gpuCount: 1
  cpu: 4
  memory: '16Gi'
}

export interface Sam2FeatureE2EEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  runtimeMode?: string
  selectedSource?: string
  modelGcsPath?: string
  checkpointSha256?: string
  configSha256?: string
  aggregateSha256?: string
  text?: string
  previewWidth?: number
  previewHeight?: number
  fps?: number
  frameCount?: number
  maxFrames?: number
  providerExecutionEnabled?: string
  publicAccessEnabled?: string
  productionReady?: string
  externalBeta?: string
  paidProduction?: string
  broadRealMedia?: string
  fullVideoMaskEnabled?: string
  fullVideoTextBehindSubjectEnabled?: string
  finalExportEnabled?: string
  realEsrganEnabled?: string
}

export interface Sam2FeatureE2EValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface Sam2FeatureSourceValidation {
  selectedSource: string
  sourceMode: 'approved_gcs_export' | 'verified_local_source'
  approvedPreviewSource: string
  approvedGcsSource: string
  localCandidatesChecked: Array<{
    path: string
    exists: boolean
    selected: boolean
    durationSeconds?: number
    width?: number
    height?: number
    hasAudio?: boolean
    matchedApprovedEvidence?: boolean
    warning?: string
  }>
  durationSeconds: number
  width: number
  height: number
  hasAudio: boolean
  privateSourceOnly: true
  blockers: string[]
  warnings: string[]
}

export interface Sam2FeaturePreviewScope {
  mode: Sam2FeaturePreviewScopeMode
  startSeconds: number
  endSeconds: number
  durationSeconds: number
  fps: number
  frameCount: number
  width: 768
  height: 432
  maxFrames: 125
  fullControlledClip: boolean
  fallbackReason?: string
  blockers: string[]
  warnings: string[]
}

export interface Sam2FeatureApprovedPlanSnapshot {
  planId: string
  phase: '35F'
  phase35FRunId: string
  approvedSource: string
  selectedSource: string
  sourceValidation: Sam2FeatureSourceValidation
  feature: 'sam2_text_behind_subject_preview'
  text: 'REEDITPRO'
  model: {
    modelId: 'sam2.1_hiera_tiny'
    modelGcsPath: string
    checkpointSha256: string
    configSha256: string
    aggregateSha256: string
  }
  previewScope: Sam2FeaturePreviewScope
  promptSource: 'phase33d_mask_bbox'
  compositionStrategy: 'native_node_png_alpha_composite_with_sam2_mask_foreground'
  executionSteps: [
    'extract_preview_frames',
    'run_sam2_temporal_tracking',
    'compose_text_behind_subject',
    'assemble_private_preview_if_ffmpeg_available',
    'run_qa',
  ]
  outputPrefixes: {
    generatedAssets: string
    masks: string
    previews: string
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
    publicAccessAllowed: false
    productionReadyAllowed: false
    externalBetaAllowed: false
    paidProductionAllowed: false
    broadRealUserMediaAllowed: false
    full4KProcessingAllowed: false
  }
}

export interface Sam2FeatureIamPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
}

export interface Sam2FeatureCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface Sam2FeatureQaGate {
  gateId:
    | 'source_integrity'
    | 'plan_snapshot_integrity'
    | 'preview_scope'
    | 'model_integrity'
    | 'sam2_mask_tracking'
    | 'composition_integrity'
    | 'artifact_privacy'
    | 'beta_readiness_evidence'
    | 'blocked_features'
  status: Sam2FeatureQaGateStatus
  summary: string
}

export interface Sam2FeatureArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface Sam2FeatureRuntimeReport {
  ok: boolean
  runId: string
  projectId: 'reeditpro'
  jobName: string
  executionId?: string
  image?: {
    image?: string
    digest?: string
  }
  source: {
    inputVideoGcsUri: string
    sourceDurationSeconds: number
  }
  previewScope: Sam2FeaturePreviewScope
  prompt: {
    source: 'phase33d_mask_bbox'
    type: 'box'
    promptFrameIndex: number
    anchorMaskDimensions: { width: number; height: number }
    frameDimensions: { width: number; height: number }
    sourceBoundingBox: [number, number, number, number]
    scaledBoundingBox: [number, number, number, number]
    metadataUri?: string
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
  frames: {
    frameCount: number
    frameUris: string[]
    manifestUri?: string
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
    metadataUri?: string
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: Sam2FeatureQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: Sam2FeatureArtifact[]
  safety: {
    approvedControlledSourceOnly: true
    arbitraryRealUserMediaUsed: false
    full4KProcessingUsed: false
    fullResolutionVideoProcessed: false
    productionFullVideoMaskExported: false
    finalDeliveryExportCreated: false
    providerExecuted: false
    modelDownloadedExternally: false
    realEsrganUsed: false
    revideoUsed: false
    filmUsed: false
    slowMotionExecuted: false
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

export interface Sam2FeatureE2EExecutionReport extends Sam2FeatureRuntimeReport {
  sourceValidation: Sam2FeatureSourceValidation
  planSnapshot: {
    planId: string
    gcsUri: string
    approvedPlanSnapshot: true
    rawPromptExecution: false
  }
  textLayerPlan: {
    text: 'REEDITPRO'
    renderer: 'native_node_png_compositor'
    compositionStrategy: 'native_node_png_alpha_composite_with_sam2_mask_foreground'
  }
  composition: {
    method: 'native_node_png_alpha_composite'
    previewFrameUris: string[]
    previewClipUri?: string
    previewClipGenerated: boolean
    contactSheetUri?: string
    compositionManifestUri: string
    privateReviewManifestUri: string
    sourceFrameMaskMapUri: string
    textStyleUri: string
  }
  featureReadiness: {
    status: Sam2FeatureReadinessStatus
    reason: string
  }
  blockers: string[]
}

export interface ApprovedSam2FeatureE2EEvidence {
  phase: '35F'
  status: 'not_started' | 'verified' | 'segment_only' | 'blocked'
  runId?: string
  source?: string
  previewScope?: {
    mode: Sam2FeaturePreviewScopeMode
    startSeconds: number
    endSeconds: number
    durationSeconds: number
    frameCount: number
    width: number
    height: number
    fps: number
  }
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName?: string
  cloudRunExecutionId?: string
  planSnapshotUri?: string
  generatedAssetsPrefix?: string
  masksPrefix?: string
  previewsPrefix?: string
  qaReportUri?: string
  previewFrameCount?: number
  previewClipGenerated?: boolean
  featureReadiness: {
    status: Sam2FeatureReadinessStatus
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface Sam2FeatureE2EReport {
  reportId: 'activation-phase-35f-sam2-feature-e2e-beta-readiness'
  createdAt: string
  config: Sam2FeatureE2EConfig
  approvedEvidence: ApprovedSam2FeatureE2EEvidence
  commandPlans: Sam2FeatureCommandPlan[]
  iamPlan: Sam2FeatureIamPlan[]
  executionReport?: Sam2FeatureE2EExecutionReport
  status: Sam2FeatureE2EStatus
  featureReadiness: {
    status: Sam2FeatureReadinessStatus
    reason: string
  }
  blockers: string[]
  warnings: string[]
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  providerAllowed: false
  revideoAllowed: false
  filmAllowed: false
  slowMotionAllowed: false
}
