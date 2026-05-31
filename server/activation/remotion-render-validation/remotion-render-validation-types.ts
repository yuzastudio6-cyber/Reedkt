export type RemotionRenderGateId =
  | 'source_integrity'
  | 'phase45a_evidence'
  | 'remotion_render_invoked'
  | 'render_preview_created'
  | 'ffprobe_preview_validation'
  | 'duration_bounds'
  | 'private_artifacts'
  | 'no_final_delivery'
  | 'blocked_features'

export interface RemotionRenderValidationConfig {
  phase: '45B'
  track: 'A visual/video'
  projectId: string
  region: string
  env: 'staging'
  runtimeMode: 'remotion_render_validation'
  approvedInputVideoGcsUri: string
  approvedPhase45ARunId: string
  approvedPhase45APreviewGcsUri: string
  approvedPhase45AReportGcsUri: string
  runtimeJobName: string
  runtimeImageTag: string
  runtimeTargetImage: string
  runtimeImageRepository: string
  serviceAccountEmail: string
  computeMode: 'cpu'
  cpu: number
  memory: string
  finalExportsBucket: string
  previewsBucket: string
  qaBucket: string
  reportObjectPrefix: string
  previewDurationSeconds: number
  maxPreviewDurationSeconds: number
  previewWidth: number
  previewHeight: number
  previewFps: number
}

export interface RemotionRenderIamBindingPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
}

export interface RemotionRenderCommandPlan {
  commandId: string
  phase: 'preflight' | 'build' | 'deploy' | 'execute'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface RemotionRenderArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface RemotionRenderQaGate {
  gateId: RemotionRenderGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface RemotionRenderQaSummary {
  status: 'passed' | 'blocked'
  gates: RemotionRenderQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface RemotionRenderExecutionReport {
  ok: boolean
  phase: '45B'
  runId: string
  projectId: string
  jobName: string
  runtimeMode: string
  image: {
    image: string
    digest: string
  }
  compute: {
    mode: 'cpu'
    cpu: number
    memory: string
    gpuRequested: false
  }
  source: {
    inputVideoGcsUri: string
    durationSeconds: number
    videoStreamPresent: boolean
    audioStreamPresent: boolean
  }
  phase45A: {
    runId: string
    previewGcsUri: string
    reportGcsUri: string
    qaPassed: boolean
    phase45BReady: boolean
  }
  render: {
    remotionInvoked: boolean
    compositionId: string
    width: number
    height: number
    fps: number
    durationSeconds: number
    durationFrames: number
    commandSummary: string
    remotionVersion?: string
  }
  preview: {
    gcsUri: string
    durationSeconds: number
    width: number
    height: number
    videoStreamPresent: boolean
    audioStreamPresent: boolean
  }
  artifacts: RemotionRenderArtifact[]
  qa: RemotionRenderQaSummary
  phase45CReadiness: {
    readyForOpenTimelineIoValidation: boolean
    reason: string
  }
  safety: {
    approvedSourceOnly: boolean
    approvedPhase45AOnly: boolean
    arbitraryMediaUsed: boolean
    finalDeliveryCreated: boolean
    providerExecuted: boolean
    revideoUsed: boolean
    trackBToolsUsed: boolean
    publicAccessEnabled: boolean
    productionReadyAllowed: boolean
    externalBetaAllowed: boolean
    paidProductionAllowed: boolean
    broadRealUserMediaAllowed: boolean
  }
  blockers: string[]
  warnings: string[]
  executionId?: string
}

export interface ApprovedRemotionRenderEvidence {
  phase: '45B'
  status: 'not_run' | 'verified' | 'blocked'
  runId?: string
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName?: string
  cloudRunExecutionId?: string
  sourceInputVideo?: string
  phase45APreview?: string
  remotionPreviewUri?: string
  qaReportUri?: string
  toolResults: {
    remotion: 'skipped' | 'passed' | 'blocked'
    ffprobe: 'skipped' | 'passed' | 'blocked'
  }
  phase45CReadiness: {
    readyForOpenTimelineIoValidation: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface RemotionRenderValidationReport {
  reportId: string
  createdAt: string
  config: RemotionRenderValidationConfig
  approvedEvidence: ApprovedRemotionRenderEvidence
  executionReport?: RemotionRenderExecutionReport
  status: 'planned' | 'ready' | 'blocked'
  blockers: string[]
  warnings: string[]
  remotionRenderValidated: boolean
  phase45CReadiness: {
    readyForOpenTimelineIoValidation: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  finalDeliveryAllowed: false
  providerAllowed: false
  revideoAllowed: false
  trackBAllowed: false
}
