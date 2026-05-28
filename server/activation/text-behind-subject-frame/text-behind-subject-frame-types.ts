export type TextBehindSubjectFrameStatus = 'planned' | 'ready' | 'failed'
export type TextBehindSubjectFrameQaGateStatus = 'passed' | 'warning' | 'blocked' | 'not_applicable'

export interface TextBehindSubjectFrameConfig {
  projectId: 'reeditpro'
  region: 'us-central1'
  env: 'staging'
  phase32RunId: 'phase32-20260528T13330'
  phase33dRunId: 'phase33d-20260528T161056'
  approvedText: 'REEDITPRO'
  representativeFrameGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png'
  maskGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png'
  cutoutGcsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png'
  sourceBucket: 'reeditpro-staging-reeditpro-generated-assets'
  phase33dPrefix: 'activation-real-video/phase33d/phase33d-20260528T161056'
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets'
  previewsBucket: 'reeditpro-staging-reeditpro-previews'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  workerTempBucket: 'reeditpro-staging-reeditpro-worker-temp'
  phase33ePrefix: 'activation-real-video/phase33e'
  renderJobName: 'reeditpro-staging-render-job'
  renderServiceAccountEmail: 'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com'
  renderImageTag: 'staging-phase33e-text-frame-001'
  renderTargetImage: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-render-worker:staging-phase33e-text-frame-001'
}

export interface TextBehindSubjectFrameArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface TextBehindSubjectFrameCommandPlan {
  commandId: string
  phase: 'preflight' | 'iam' | 'build' | 'deploy' | 'execute' | 'fetch-report' | 'validate'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  warnings: string[]
}

export interface TextBehindSubjectFrameTextLayerPlan {
  textLayerId: string
  textContent: 'REEDITPRO'
  sanitizedText: 'REEDITPRO'
  fontFamilyFallback: 'DejaVu Sans Bold'
  fontFile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
  fontSize: number
  position: {
    x: number
    y: number
    width: number
    height: number
    anchor: 'center_upper_mid' | 'center_mid' | 'center_lower_mid'
  }
  layerOrder: ['background_frame', 'text_layer', 'foreground_cutout']
  behindSubject: true
  estimatedSubjectOcclusionRatio: number
  fallbackPlacement: 'center_upper_mid' | 'center_mid' | 'center_lower_mid'
  warnings: string[]
}

export interface TextBehindSubjectDepthCompositionManifest {
  id: string
  manifestKind: 'depth_composition_frame_manifest'
  runId: string
  sourcePhase33DRunId: 'phase33d-20260528T161056'
  inputRefs: {
    backgroundFrame: string
    mask: string
    foregroundCutout: string
  }
  textLayerPlanRef: string
  layerOrder: ['background_frame', 'text_layer', 'foreground_cutout']
  outputPreviewRef: string
  renderMode: 'single_frame_preview_only'
  renderEngineHandoff: {
    ffmpegSingleFrame: true
    remotionUsed: false
    revideoUsed: false
    finalRenderAllowed: false
    videoRenderAllowed: false
  }
  qaRequirements: Array<'mask_edge_quality' | 'mask_subject_coverage' | 'render_asset_integrity' | 'text_readability' | 'text_safe_zone' | 'text_behind_subject_composition' | 'final_delivery'>
}

export interface TextBehindSubjectFrameQaGate {
  gateId:
    | 'mask_edge_quality'
    | 'mask_subject_coverage'
    | 'render_asset_integrity'
    | 'text_readability'
    | 'text_safe_zone'
    | 'text_behind_subject_composition'
    | 'final_delivery'
  status: TextBehindSubjectFrameQaGateStatus
  summary: string
}

export interface TextBehindSubjectFrameExecutionReport {
  ok: boolean
  runId: string
  sourcePhase33DRunId: 'phase33d-20260528T161056'
  representativeFrameGcsUri: string
  maskGcsUri: string
  cutoutGcsUri: string
  inputDimensions: {
    width?: number
    height?: number
  }
  textLayerPlan: TextBehindSubjectFrameTextLayerPlan
  depthCompositionManifest: TextBehindSubjectDepthCompositionManifest
  preview: {
    status: 'created' | 'blocked'
    gcsUri?: string
    width?: number
    height?: number
  }
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: TextBehindSubjectFrameQaGate[]
    blockers: string[]
    warnings: string[]
  }
  artifacts: TextBehindSubjectFrameArtifact[]
  uploadedReport: {
    bucket: string
    object: string
    gcsUri: string
  }
  safety: {
    approvedPhase33DInputsOnly: true
    singleFramePreviewOnly: true
    videoProcessed: false
    biRefNetRerun: false
    sam2Used: false
    gpuUsed: false
    providerExecuted: false
    modelDownloadedExternally: false
    publicAccessEnabled: false
    secretValuesUsed: false
    revideoUsed: false
    finalVideoExported: false
  }
  blockers: string[]
  warnings: string[]
}

export interface TextBehindSubjectFrameReport {
  reportId: string
  createdAt: string
  config: TextBehindSubjectFrameConfig
  commandPlans: TextBehindSubjectFrameCommandPlan[]
  executionReport?: TextBehindSubjectFrameExecutionReport
  status: TextBehindSubjectFrameStatus
  blockers: string[]
  warnings: string[]
  phase34Readiness: {
    ready: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  broadRealUserMediaAllowed: false
  fullVideoTextBehindSubjectAllowed: false
}
