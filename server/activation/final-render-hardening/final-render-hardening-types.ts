export type FinalRenderHardeningGateId =
  | 'source_integrity'
  | 'phase45a_evidence'
  | 'phase45b_evidence'
  | 'phase45c_evidence'
  | 'ffmpeg_export_invoked'
  | 'ffprobe_export_validation'
  | 'codec_container_integrity'
  | 'duration_bounds'
  | 'audio_video_integrity'
  | 'private_artifacts'
  | 'no_public_access'
  | 'no_final_delivery'
  | 'blocked_features'

export interface FinalRenderHardeningConfig {
  phase: '45D'
  track: 'A visual/video'
  projectId: string
  region: string
  env: 'staging'
  runtimeMode: 'ffmpeg_final_render_hardening'
  approvedInputVideoGcsUri: string
  approvedPhase45ARunId: string
  approvedPhase45APreviewGcsUri: string
  approvedPhase45AReportGcsUri: string
  approvedPhase45BRunId: string
  approvedPhase45BPreviewGcsUri: string
  approvedPhase45BReportGcsUri: string
  approvedPhase45CRunId: string
  approvedPhase45COtioGcsUri: string
  approvedPhase45CReportGcsUri: string
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
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: string
  exportDurationSeconds: number
  maxExportDurationSeconds: number
  maxWidth: number
  maxHeight: number
  expectedVideoCodec: 'h264'
  expectedAudioCodec: 'aac'
  expectedContainer: 'mp4'
}

export interface FinalRenderHardeningIamBindingPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
}

export interface FinalRenderHardeningCommandPlan {
  commandId: string
  phase: 'preflight' | 'build' | 'deploy' | 'execute'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface FinalRenderHardeningArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface FinalRenderHardeningQaGate {
  gateId: FinalRenderHardeningGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface FinalRenderHardeningQaSummary {
  status: 'passed' | 'blocked'
  gates: FinalRenderHardeningQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface FinalRenderHardeningExecutionReport {
  ok: boolean
  phase: '45D'
  runId: string
  projectId: string
  jobName: string
  executionId?: string
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
  evidence: {
    phase45A: { runId: string; previewGcsUri: string; reportGcsUri: string; reportPassed: boolean }
    phase45B: { runId: string; previewGcsUri: string; reportGcsUri: string; reportPassed: boolean }
    phase45C: { runId: string; otioGcsUri: string; reportGcsUri: string; reportPassed: boolean; otioSchemaValid: boolean }
  }
  export: {
    gcsUri: string
    durationSeconds: number
    width: number
    height: number
    videoCodec: string
    audioCodec?: string
    audioStreamPresent: boolean
    videoStreamPresent: boolean
    container: string
    bitRate?: number
    faststart: boolean
    unexpectedStreams: string[]
  }
  artifacts: FinalRenderHardeningArtifact[]
  qa: FinalRenderHardeningQaSummary
  phase45EReadiness: {
    readyForFullVisualVideoPrivateE2E: boolean
    reason: string
  }
  safety: {
    approvedSourceOnly: boolean
    approvedPhase45AOnly: boolean
    approvedPhase45BOnly: boolean
    approvedPhase45COnly: boolean
    arbitraryMediaUsed: boolean
    finalDeliveryCreated: boolean
    privateReviewOnly: boolean
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
}

export interface ApprovedFinalRenderHardeningEvidence {
  phase: '45D'
  status: 'not_run' | 'verified' | 'blocked'
  runId?: string
  runtimeImage?: string
  runtimeImageDigest?: string
  cloudRunJobName?: string
  cloudRunExecutionId?: string
  sourceInputVideo?: string
  phase45APreview?: string
  phase45BPreview?: string
  phase45COtio?: string
  hardenedReviewExportUri?: string
  ffprobeValidationUri?: string
  qaReportUri?: string
  toolResults: {
    ffmpeg: 'skipped' | 'passed' | 'blocked'
    ffprobe: 'skipped' | 'passed' | 'blocked'
  }
  phase45EReadiness: {
    readyForFullVisualVideoPrivateE2E: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface FinalRenderHardeningReport {
  reportId: string
  createdAt: string
  config: FinalRenderHardeningConfig
  approvedEvidence: ApprovedFinalRenderHardeningEvidence
  executionReport?: FinalRenderHardeningExecutionReport
  status: 'planned' | 'ready' | 'blocked'
  blockers: string[]
  warnings: string[]
  finalRenderHardeningValidated: boolean
  phase45EReadiness: {
    readyForFullVisualVideoPrivateE2E: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  paidProductionAllowed: false
  broadRealUserMediaAllowed: false
  finalDeliveryAllowed: false
  privateReviewOnly: true
  providerAllowed: false
  revideoAllowed: false
  trackBAllowed: false
}
