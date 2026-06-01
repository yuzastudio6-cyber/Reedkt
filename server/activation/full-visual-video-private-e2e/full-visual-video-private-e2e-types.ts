export type FullVisualVideoPrivateE2eGateId =
  | 'source_integrity'
  | 'phase45a_libass_evidence'
  | 'phase45b_remotion_evidence'
  | 'phase45c_otio_evidence'
  | 'phase45d_ffmpeg_ffprobe_evidence'
  | 'private_review_export_integrity'
  | 'ffprobe_review_export_validation'
  | 'evidence_manifest_created'
  | 'artifact_privacy'
  | 'no_public_access'
  | 'no_final_delivery'
  | 'blocked_features'

export interface FullVisualVideoPrivateE2eConfig {
  phase: '45E'
  track: 'A visual/video'
  projectId: string
  region: string
  env: 'staging'
  runtimeMode: 'full_visual_video_private_e2e'
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
  approvedPhase45DRunId: string
  approvedPhase45DReviewExportGcsUri: string
  approvedPhase45DFfprobeValidationGcsUri: string
  approvedPhase45DReportGcsUri: string
  finalExportsBucket: string
  previewsBucket: string
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: string
  maxReviewDurationSeconds: number
  maxWidth: number
  maxHeight: number
  expectedVideoCodec: 'h264'
  expectedAudioCodec: 'aac'
}

export interface FullVisualVideoPrivateE2eIamPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
  reportOnly: true
}

export interface FullVisualVideoPrivateE2eCommandPlan {
  commandId: string
  phase: 'preflight' | 'execute'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface FullVisualVideoPrivateE2eArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface FullVisualVideoPrivateE2eQaGate {
  gateId: FullVisualVideoPrivateE2eGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface FullVisualVideoPrivateE2eQaSummary {
  status: 'passed' | 'blocked'
  gates: FullVisualVideoPrivateE2eQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface FullVisualVideoPrivateE2eExecutionReport {
  ok: boolean
  phase: '45E'
  runId: string
  projectId: string
  runtimeMode: string
  source: {
    inputVideoGcsUri: string
    objectExists: boolean
    sizeBytes: number
  }
  evidence: {
    phase45A: { runId: string; previewGcsUri: string; reportGcsUri: string; reportPassed: boolean }
    phase45B: { runId: string; previewGcsUri: string; reportGcsUri: string; reportPassed: boolean }
    phase45C: { runId: string; otioGcsUri: string; reportGcsUri: string; reportPassed: boolean; otioSchemaValid: boolean }
    phase45D: { runId: string; reviewExportGcsUri: string; reportGcsUri: string; ffprobeValidationGcsUri: string; reportPassed: boolean }
  }
  canonicalPrivateReviewExport: {
    gcsUri: string
    durationSeconds: number
    width: number
    height: number
    videoCodec: string
    audioCodec?: string
    videoStreamPresent: boolean
    audioStreamPresent: boolean
    container: string
    faststart: boolean
    unexpectedStreams: string[]
    sizeBytes: number
    sha256: string
  }
  e2eReviewManifestGcsUri: string
  artifacts: FullVisualVideoPrivateE2eArtifact[]
  qa: FullVisualVideoPrivateE2eQaSummary
  trackAVisualVideoReadiness: {
    readyForInternalPrivateVisualVideoTesting: boolean
    reason: string
  }
  safety: {
    approvedSourceOnly: boolean
    approvedPhase45AOnly: boolean
    approvedPhase45BOnly: boolean
    approvedPhase45COnly: boolean
    approvedPhase45DOnly: boolean
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

export interface ApprovedFullVisualVideoPrivateE2eEvidence {
  phase: '45E'
  status: 'not_run' | 'verified' | 'blocked'
  runId?: string
  sourceInputVideo?: string
  canonicalPrivateReviewExportUri?: string
  e2eReviewManifestUri?: string
  ffprobeReviewExportValidationUri?: string
  qaReportUri?: string
  toolResults: {
    evidencePackage: 'skipped' | 'passed' | 'blocked'
    ffprobe: 'skipped' | 'passed' | 'blocked'
  }
  trackAVisualVideoReadiness: {
    readyForInternalPrivateVisualVideoTesting: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface FullVisualVideoPrivateE2eReport {
  reportId: string
  createdAt: string
  config: FullVisualVideoPrivateE2eConfig
  approvedEvidence: ApprovedFullVisualVideoPrivateE2eEvidence
  executionReport?: FullVisualVideoPrivateE2eExecutionReport
  status: 'planned' | 'ready' | 'blocked'
  blockers: string[]
  warnings: string[]
  fullVisualVideoPrivateE2eValidated: boolean
  trackAVisualVideoReadiness: {
    readyForInternalPrivateVisualVideoTesting: boolean
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
