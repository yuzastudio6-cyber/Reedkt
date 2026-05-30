export type SegmentTextBehindSubjectPreviewStatus = 'planned' | 'ready' | 'blocked' | 'failed'
export type SegmentTextBehindSubjectPreviewQaGateStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface SegmentTextBehindSubjectPreviewConfig {
  phase: '35E'
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  approvedPhase35DRunId: 'phase35d-20260530T004442'
  approvedInputVideoGcsUri: string
  approvedSegmentStartSeconds: 6.9
  approvedSegmentEndSeconds: 8.9
  approvedSegmentDurationSeconds: 2.0
  approvedFrameCount: 10
  approvedFrameWidth: 768
  approvedFrameHeight: 432
  approvedText: 'REEDITPRO'
  generatedAssetsInputPrefix: string
  masksInputPrefix: string
  qaInputPrefix: string
  outputPreviewPrefix: string
  outputGeneratedAssetsPrefix: string
  outputQaPrefix: string
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  masksBucket: 'reeditpro-staging-reeditpro-masks'
  previewsBucket: 'reeditpro-staging-reeditpro-previews'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  renderServiceAccountEmail: 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com'
  segmentTextBehindSubjectAllowed: true
  fullVideoTextBehindSubjectAllowed: false
  fullVideoMaskAllowed: false
  finalExportAllowed: false
  publicAccessAllowed: false
  providerAllowed: false
  revideoAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  filmAllowed: false
  slowMotionAllowed: false
}

export interface SegmentTextBehindSubjectPreviewEnvValidationInput {
  projectId?: string
  activeProject?: string
  region?: string
  env?: string
  confirmation?: string
  phase35DRunId?: string
  text?: string
  segmentDurationSeconds?: number
  frameCount?: number
  generatedAssetsInputPrefix?: string
  masksInputPrefix?: string
  qaInputPrefix?: string
  outputPreviewPrefix?: string
  outputGeneratedAssetsPrefix?: string
  outputQaPrefix?: string
  providerExecutionEnabled?: string
  publicAccessEnabled?: string
  productionReady?: string
  externalBeta?: string
  broadRealMedia?: string
  fullVideoTextBehindSubjectEnabled?: string
  fullVideoMaskEnabled?: string
  finalExportEnabled?: string
}

export interface SegmentTextBehindSubjectPreviewValidationResult {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

export interface SegmentTextBehindSubjectPreviewArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface SegmentTextBehindSubjectPreviewSourceSummary {
  phase35DRunId: string
  inputVideoGcsUri: string
  generatedAssetsPrefix: string
  masksPrefix: string
  qaPrefix: string
  segmentManifestUri: string
  promptMetadataUri: string
  maskMetadataUri: string
  phase35DReportUri: string
  frameUris: string[]
  maskUris: string[]
  blockers: string[]
  warnings: string[]
}

export interface SegmentTextBehindSubjectPreviewCompositionPlan {
  compositionId: 'phase35e-segment-text-behind-subject'
  text: 'REEDITPRO'
  sanitizedText: 'REEDITPRO'
  renderer: 'native_node_png_compositor'
  previewClipStrategy: 'not_generated_no_local_ffmpeg_required'
  frameCount: 10
  frameWidth: 768
  frameHeight: 432
  textStyle: {
    fontFamilyFallback: 'built_in_block_font'
    fillColor: '#FFFFFF'
    strokeColor: '#101820'
    opacity: 0.94
    blockScale: 12
  }
  position: {
    x: number
    y: number
    width: number
    height: number
    anchor: 'center_upper_mid'
  }
  layerOrder: ['source_frame', 'text_layer', 'subject_from_phase35d_mask']
  maskMode: 'phase35d_sam2_alpha_mask'
  behindSubject: true
  promptBoundingBox: [number, number, number, number]
  warnings: string[]
}

export interface SegmentTextBehindSubjectPreviewIamPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
}

export interface SegmentTextBehindSubjectPreviewCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface SegmentTextBehindSubjectPreviewQaGate {
  gateId:
    | 'source_integrity'
    | 'segment_bounds'
    | 'mask_integrity'
    | 'composition_artifacts'
    | 'behind_subject_effect'
    | 'temporal_preview_consistency'
    | 'artifact_privacy'
    | 'blocked_features'
  status: SegmentTextBehindSubjectPreviewQaGateStatus
  summary: string
}

export interface SegmentTextBehindSubjectPreviewExecutionReport {
  ok: boolean
  runId: string
  projectId: 'reeditpro'
  source: {
    phase35DRunId: 'phase35d-20260530T004442'
    inputVideoGcsUri: string
    generatedAssetsPrefix: string
    masksPrefix: string
    qaReportUri: string
  }
  segment: {
    startSeconds: 6.9
    endSeconds: 8.9
    durationSeconds: 2.0
    frameCount: 10
    width: 768
    height: 432
    fps: 5
    frameUris: string[]
    maskUris: string[]
    segmentManifestUri: string
    maskMetadataUri: string
    promptMetadataUri: string
  }
  textLayerPlan: SegmentTextBehindSubjectPreviewCompositionPlan
  composition: {
    method: 'native_node_png_alpha_composite'
    previewFrameUris: string[]
    previewClipUri?: string
    previewClipGenerated: false
    compositionManifestUri: string
    sourceFrameMaskMapUri: string
    textStyleUri: string
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: SegmentTextBehindSubjectPreviewQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: SegmentTextBehindSubjectPreviewArtifact[]
  safety: {
    approvedPhase35DRunOnly: true
    approvedFrameMaskManifestsOnly: true
    arbitraryRealUserMediaUsed: false
    fullVideoMaskExecuted: false
    fullVideoTextBehindSubjectExecuted: false
    finalExportCreated: false
    providerExecuted: false
    modelDownloaded: false
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
  blockers: string[]
  warnings: string[]
}

export interface ApprovedSegmentTextBehindSubjectPreviewEvidence {
  phase: '35E'
  status: 'not_started' | 'verified' | 'blocked'
  runId?: string
  sourcePhase35DRunId: 'phase35d-20260530T004442'
  selectedSegment: {
    startSeconds: 6.9
    endSeconds: 8.9
    durationSeconds: 2.0
    frameCount: 10
    width: 768
    height: 432
  }
  text: 'REEDITPRO'
  compositionMethod?: 'native_node_png_alpha_composite'
  previewPrefix?: string
  generatedAssetsPrefix?: string
  qaReportUri?: string
  previewFrameCount?: number
  previewClipGenerated?: false
  phase36AReadiness: {
    readyForAudioAiApprovalWorkflow: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface SegmentTextBehindSubjectPreviewReport {
  reportId: 'activation-phase-35e-segment-text-behind-subject-preview'
  createdAt: string
  config: SegmentTextBehindSubjectPreviewConfig
  source: SegmentTextBehindSubjectPreviewSourceSummary
  compositionPlan: SegmentTextBehindSubjectPreviewCompositionPlan
  iamPlan: SegmentTextBehindSubjectPreviewIamPlan[]
  commandPlans: SegmentTextBehindSubjectPreviewCommandPlan[]
  approvedEvidence: ApprovedSegmentTextBehindSubjectPreviewEvidence
  executionReport?: SegmentTextBehindSubjectPreviewExecutionReport
  status: SegmentTextBehindSubjectPreviewStatus
  blockers: string[]
  warnings: string[]
  segmentTextBehindSubjectPreviewCompleted: boolean
  phase36AReadiness: {
    readyForAudioAiApprovalWorkflow: boolean
    reason: string
  }
  segmentTextBehindSubjectAllowed: true
  fullVideoTextBehindSubjectAllowed: false
  fullVideoMaskAllowed: false
  finalExportAllowed: false
  providerAllowed: false
  revideoAllowed: false
  filmAllowed: false
  slowMotionAllowed: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
}
