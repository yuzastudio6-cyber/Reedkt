import type { ControlledRealVideoGcsObjectMetadata } from '../controlled-real-video-ocr-safe-zone'

export type OcrCaptionRenderQaStatus = 'not_started' | 'planned' | 'passed' | 'warning' | 'manual_review' | 'blocked' | 'failed'

export type OcrCaptionRenderQaFixtureKind = 'generated_metadata' | 'controlled_phase37d_metadata' | 'blocked_guard'

export type OcrCaptionRenderQaZoneId = 'lower_third_default' | 'upper_third_default' | 'center_safe_default'

export interface OcrCaptionRenderQaBox {
  x: number
  y: number
  width: number
  height: number
}

export interface OcrCaptionRenderQaTextRegion {
  regionId: string
  fixtureId: string
  frameId: string
  source: 'generated' | 'phase37d_private_redacted'
  box: OcrCaptionRenderQaBox
  confidence?: number
  text?: string
  textRedaction: {
    mode: 'synthetic_text_allowed' | 'controlled_text_redacted'
    sha256?: string
    tokenCount?: number
  }
  warnings: string[]
  blockers: string[]
}

export interface OcrCaptionRenderQaFrame {
  frameId: string
  offsetSeconds?: number
  width: number
  height: number
  regions: OcrCaptionRenderQaTextRegion[]
}

export interface OcrCaptionRenderQaFixture {
  fixtureId: string
  kind: OcrCaptionRenderQaFixtureKind
  label: string
  required: boolean
  expectedStatus: OcrCaptionRenderQaStatus
  expectedLowerThirdCollision: boolean
  frames: OcrCaptionRenderQaFrame[]
  sourceArtifactRefs: string[]
  blockersExpected: string[]
  warnings: string[]
}

export interface OcrCaptionRenderQaCaptionZone extends OcrCaptionRenderQaBox {
  zoneId: OcrCaptionRenderQaZoneId
  label: string
  priority: number
  coordinateSpace: 'normalized'
  purpose: 'caption_candidate_zone'
}

export interface OcrCaptionRenderQaOverlapEntry {
  fixtureId: string
  frameId: string
  zoneId: OcrCaptionRenderQaZoneId
  maxOverlapRatio: number
  overlappingRegionIds: string[]
  status: OcrCaptionRenderQaStatus
}

export interface OcrCaptionRenderQaFrameRecommendation {
  fixtureId: string
  frameId: string
  recommendedZoneId?: OcrCaptionRenderQaZoneId
  lowerThirdCollisionDetected: boolean
  status: OcrCaptionRenderQaStatus
  overlapEntries: OcrCaptionRenderQaOverlapEntry[]
  avoidRegions: Array<OcrCaptionRenderQaBox & {
    avoidRegionId: string
    sourceRegionId: string
    padding: number
  }>
  warnings: string[]
  blockers: string[]
}

export interface OcrCaptionRenderQaFixtureEvaluation {
  fixtureId: string
  kind: OcrCaptionRenderQaFixtureKind
  expectedStatus: OcrCaptionRenderQaStatus
  expectedLowerThirdCollision: boolean
  status: OcrCaptionRenderQaStatus
  framesChecked: number
  textRegionCount: number
  lowerThirdCollisionFrames: number
  recommendedZoneIds: OcrCaptionRenderQaZoneId[]
  recommendations: OcrCaptionRenderQaFrameRecommendation[]
  blockersExpected: string[]
  blockers: string[]
  warnings: string[]
}

export interface OcrCaptionRenderQaEvidenceManifest {
  phase: '37E'
  createdAt: string
  phase37C: {
    status: string
    runId?: string
    artifactPrefix?: string
    qaReportUri?: string
    fixtureIds: string[]
    warnings: string[]
    blockers: string[]
  }
  phase37D: {
    status: string
    runId?: string
    sampleId: string
    artifactPrefix?: string
    frameCount: number
    textRegionCount: number
    framesWithLowerThirdCollision: number
    phase37EPlanningReady: boolean
    warnings: string[]
    blockers: string[]
  }
  privateArtifacts: {
    readAttempted: boolean
    readConfirmed: boolean
    allowedSourcesOnly: boolean
    artifactsRead: Array<{
      artifactName: string
      gcsUri: string
      metadata?: ControlledRealVideoGcsObjectMetadata
      localPath?: string
    }>
    warnings: string[]
    blockers: string[]
  }
}

export interface OcrCaptionRenderQaPlan {
  phase: '37E'
  planId: 'phase37e_ocr_caption_render_qa_plan'
  createdAt: string
  executionScope: 'metadata_only_caption_render_qa_integration'
  requiredConfirmations: string[]
  expectedArtifacts: readonly string[]
  candidateZones: OcrCaptionRenderQaCaptionZone[]
  blockedScopes: readonly string[]
  safety: {
    trackBOnly: true
    ocrRuntimeExecuted: false
    frameExtractionPerformed: false
    mediaBytesRead: false
    renderExecuted: false
    trackAImported: false
    betaProductionUnlocked: false
  }
}

export interface OcrCaptionRenderQaNormalizationReport {
  phase: '37E'
  runId: string
  fixtureCount: number
  frameCount: number
  textRegionCount: number
  controlledTextRedacted: true
  invalidRegionCount: number
  normalizedFixtures: OcrCaptionRenderQaFixture[]
  blockers: string[]
  warnings: string[]
}

export interface OcrCaptionRenderQaCaptionConstraintManifest {
  phase: '37E'
  runId: string
  padding: number
  warningOverlapRatio: number
  blockingOverlapRatio: number
  lowConfidenceWarningThreshold: number
  candidateZones: OcrCaptionRenderQaCaptionZone[]
  constraints: string[]
}

export interface OcrCaptionRenderQaCandidateZoneReport {
  phase: '37E'
  runId: string
  evaluations: OcrCaptionRenderQaFixtureEvaluation[]
  candidateZoneCoverage: Array<{
    zoneId: OcrCaptionRenderQaZoneId
    recommendedFrameCount: number
    blockedFrameCount: number
    warningFrameCount: number
  }>
  blockers: string[]
  warnings: string[]
}

export interface OcrCaptionRenderQaOverlapQaReport {
  phase: '37E'
  runId: string
  framesChecked: number
  fixturesChecked: number
  lowerThirdCollisionFixtures: string[]
  manualReviewFixtures: string[]
  blockedGuardFixturesPassed: string[]
  blockers: string[]
  warnings: string[]
}

export interface OcrCaptionRenderQaRenderCompatibilityManifest {
  phase: '37E'
  runId: string
  compatibleWithFutureRenderQa: boolean
  futureOnlyHandoff: true
  trackATouched: false
  renderExecuted: false
  adapterContract: {
    input: 'normalized_ocr_text_regions_and_caption_candidate_zones'
    output: 'caption_avoid_regions_and_recommended_caption_zones'
    rawTextAllowedForControlledRealMedia: false
    coordinates: 'normalized_0_to_1'
  }
  handoffNotes: string[]
  blockers: string[]
  warnings: string[]
}

export interface OcrCaptionRenderQaGateReport {
  phase: '37E'
  runId: string
  status: OcrCaptionRenderQaStatus
  gates: Array<{
    gateId:
      | 'phase37c_generated_runtime_evidence'
      | 'phase37d_controlled_execution_evidence'
      | 'metadata_only_scope'
      | 'generated_fixture_policy'
      | 'controlled_phase37d_integration'
      | 'blocked_input_guards'
      | 'caption_overlap_qa'
      | 'render_qa_handoff_contract'
      | 'private_json_artifact_policy'
      | 'beta_production_blocked'
    status: OcrCaptionRenderQaStatus
    summary: string
  }>
  blockers: string[]
  warnings: string[]
}

export interface OcrCaptionRenderQaPrivateArtifactManifest {
  phase: '37E'
  runId: string
  privateOnly: true
  bucket: string
  prefix: string
  artifactCount: number
  jsonOnly: true
  rawTextCommitted: false
  rawFramesUploaded: false
  overlaysUploaded: false
  mediaUploaded: false
  artifacts: Array<{
    id: string
    localPath?: string
    object?: string
    gcsUri?: string
    sizeBytes: number
    sha256: string
  }>
  uploadedArtifacts: ControlledRealVideoGcsObjectMetadata[]
  blocked: {
    publicAccess: true
    signedUrls: true
    ocrRuntime: true
    frameExtraction: true
    renderExecution: true
    arbitraryMedia: true
    trackA: true
    beta: true
    production: true
  }
}

export interface OcrCaptionRenderQaReport {
  ok: boolean
  phase: '37E'
  runId: string
  projectId: 'reeditpro'
  status: OcrCaptionRenderQaStatus
  plan: OcrCaptionRenderQaPlan
  inputManifest: OcrCaptionRenderQaEvidenceManifest
  normalizationReport: OcrCaptionRenderQaNormalizationReport
  captionConstraintManifest: OcrCaptionRenderQaCaptionConstraintManifest
  candidateZoneReport: OcrCaptionRenderQaCandidateZoneReport
  overlapQaReport: OcrCaptionRenderQaOverlapQaReport
  renderCompatibilityManifest: OcrCaptionRenderQaRenderCompatibilityManifest
  qaGateReport: OcrCaptionRenderQaGateReport
  privateArtifactManifest?: OcrCaptionRenderQaPrivateArtifactManifest
  phase37FReadiness: {
    readyForCaptionRenderRuntimeHookPlanning: boolean
    reason: string
  }
  safety: {
    metadataOnly: true
    privateJsonOnly: true
    rawControlledTextCommitted: false
    mediaBytesRead: false
    ocrRuntimeExecuted: false
    frameExtractionPerformed: false
    renderExecuted: false
    iamMutated: false
    trackATouched: false
    betaAllowed: false
    productionAllowed: false
  }
  blockers: string[]
  warnings: string[]
}

export interface ApprovedOcrCaptionRenderQaEvidence {
  phase: '37E'
  status: OcrCaptionRenderQaStatus
  runId?: string
  artifactPrefix?: string
  privateArtifactObjectCount: number
  phase37CRunId?: string
  phase37DRunId?: string
  generatedFixtureCount: number
  controlledFixtureCount: number
  blockedGuardFixtureCount: number
  framesChecked: number
  textRegionCount: number
  lowerThirdCollisionFixtureCount: number
  manualReviewFixtureCount: number
  phase37FReadiness: OcrCaptionRenderQaReport['phase37FReadiness']
  blockers: string[]
  warnings: string[]
}

export interface OcrCaptionRenderQaRunnerResult {
  evidence: ApprovedOcrCaptionRenderQaEvidence
  report: OcrCaptionRenderQaReport
  localArtifactDir: string
  localReportPath: string
  uploadedArtifacts: ControlledRealVideoGcsObjectMetadata[]
}
