export type OpenTimelineIoGateId =
  | 'source_integrity'
  | 'phase45a_evidence'
  | 'phase45b_evidence'
  | 'otio_timeline_created_or_resolved'
  | 'otio_schema_valid'
  | 'timeline_duration_bounds'
  | 'clip_reference_integrity'
  | 'caption_render_reference_integrity'
  | 'no_public_artifacts'
  | 'no_final_delivery'
  | 'blocked_features'

export interface OpenTimelineIoValidationConfig {
  phase: '45C'
  track: 'A visual/video'
  projectId: string
  region: string
  env: 'staging'
  runtimeMode: 'opentimelineio_timeline_validation'
  approvedInputVideoGcsUri: string
  approvedPhase45ARunId: string
  approvedPhase45APreviewGcsUri: string
  approvedPhase45AReportGcsUri: string
  approvedPhase45BRunId: string
  approvedPhase45BPreviewGcsUri: string
  approvedPhase45BReportGcsUri: string
  finalExportsBucket: string
  previewsBucket: string
  generatedAssetsBucket: string
  qaBucket: string
  reportObjectPrefix: string
  timelineName: string
  timelineFps: number
  timelineDurationSeconds: number
  maxTimelineDurationSeconds: number
}

export interface OpenTimelineIoIamBindingPlan {
  bindingId: string
  bucket: string
  role: 'roles/storage.objectViewer' | 'roles/storage.objectCreator'
  member: string
  conditionTitle: string
  conditionExpression: string
  description: string
  commandString: string
}

export interface OpenTimelineIoCommandPlan {
  commandId: string
  phase: 'preflight' | 'execute'
  commandString: string
  requiresConfirmation: boolean
  textOnlyByDefault: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface OpenTimelineIoTime {
  value: number
  rate: number
}

export interface OpenTimelineIoTimeline {
  OTIO_SCHEMA: 'Timeline.1'
  name: string
  tracks: Array<{
    kind: 'Video'
    children: Array<{
      OTIO_SCHEMA: 'Clip.2'
      name: string
      source_range: {
        start_time: OpenTimelineIoTime
        duration: OpenTimelineIoTime
      }
      media_reference: {
        OTIO_SCHEMA: 'ExternalReference.1'
        target_url: string
      }
      metadata: Record<string, unknown>
    }>
  }>
  metadata: Record<string, unknown>
}

export interface OpenTimelineIoArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes: number
  sha256: string
}

export interface OpenTimelineIoQaGate {
  gateId: OpenTimelineIoGateId
  passed: boolean
  severity: 'mandatory'
  summary: string
}

export interface OpenTimelineIoQaSummary {
  status: 'passed' | 'blocked'
  gates: OpenTimelineIoQaGate[]
  blockers: string[]
  warnings: string[]
}

export interface OpenTimelineIoTimelineValidation {
  schemaValid: boolean
  timelineDurationSeconds: number
  timelineDurationFrames: number
  sourceReferenceMatches: boolean
  phase45AReferenceMatches: boolean
  phase45BReferenceMatches: boolean
  durationWithinBounds: boolean
  clipCount: number
  trackCount: number
}

export interface OpenTimelineIoExecutionReport {
  ok: boolean
  phase: '45C'
  runId: string
  projectId: string
  runtimeMode: string
  source: {
    inputVideoGcsUri: string
    objectExists: boolean
  }
  phase45A: {
    runId: string
    previewGcsUri: string
    reportGcsUri: string
    evidenceVerified: boolean
    reportHasNoBlockers: boolean
  }
  phase45B: {
    runId: string
    previewGcsUri: string
    reportGcsUri: string
    evidenceVerified: boolean
    reportHasNoBlockers: boolean
  }
  timeline: {
    name: string
    fps: number
    durationSeconds: number
    durationFrames: number
    artifactGcsUri: string
  }
  validation: OpenTimelineIoTimelineValidation
  artifacts: OpenTimelineIoArtifact[]
  qa: OpenTimelineIoQaSummary
  phase45DReadiness: {
    readyForFfmpegFfprobeFinalRenderHardening: boolean
    reason: string
  }
  safety: {
    approvedSourceOnly: boolean
    approvedPhase45AOnly: boolean
    approvedPhase45BOnly: boolean
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
}

export interface ApprovedOpenTimelineIoEvidence {
  phase: '45C'
  status: 'not_run' | 'verified' | 'blocked'
  runId?: string
  sourceInputVideo?: string
  phase45APreview?: string
  phase45BPreview?: string
  otioTimelineUri?: string
  qaReportUri?: string
  toolResults: {
    opentimelineio: 'skipped' | 'passed' | 'blocked'
    metadataValidation: 'skipped' | 'passed' | 'blocked'
  }
  phase45DReadiness: {
    readyForFfmpegFfprobeFinalRenderHardening: boolean
    reason: string
  }
  blockers: string[]
  warnings: string[]
}

export interface OpenTimelineIoValidationReport {
  reportId: string
  createdAt: string
  config: OpenTimelineIoValidationConfig
  approvedEvidence: ApprovedOpenTimelineIoEvidence
  executionReport?: OpenTimelineIoExecutionReport
  status: 'planned' | 'ready' | 'blocked'
  blockers: string[]
  warnings: string[]
  opentimelineioValidated: boolean
  phase45DReadiness: {
    readyForFfmpegFfprobeFinalRenderHardening: boolean
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
