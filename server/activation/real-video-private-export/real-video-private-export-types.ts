import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'

export type RealVideoPrivateExportStatus = 'planned' | 'ready' | 'blocked' | 'failed'
export type RealVideoPrivateExportCaptionHandling = 'sidecar_only' | 'burned_in' | 'skipped'

export interface RealVideoPrivateExportConfig {
  projectId: 'reeditpro'
  region: 'us-central1'
  phase28RunId: 'phase28-20260528T01552'
  phase29RunId: 'phase29-20260528T02254'
  sourceBucket: 'reeditpro-staging-reeditpro-source-media'
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts'
  transcriptsBucket: 'reeditpro-staging-reeditpro-transcripts'
  finalExportsBucket: 'reeditpro-staging-reeditpro-final-exports'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  phase28Prefix: string
  phase29Prefix: string
  sourceGcsUri: string
  expectedTimelineDurationSeconds: 15.443
}

export interface RealVideoPrivateExportArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface RealVideoPrivateExportRenderPlan {
  planId: string
  sourcePhase28RunId: string
  sourcePhase29RunId: string
  sourceGcsUri: string
  timelineDurationSeconds: number
  keepSegments: Array<{ startSeconds: number; endSeconds: number }>
  removeSegments: Array<{ startSeconds: number; endSeconds: number; reason?: string }>
  output: {
    container: 'mp4'
    videoCodec: 'h264'
    audioCodec: 'aac'
    pixelFormat: 'yuv420p'
    gcsUri: string
  }
  captionHandling: {
    mode: RealVideoPrivateExportCaptionHandling
    reason: string
    sidecarRefs: string[]
  }
  safety: {
    privateExportOnly: true
    sourceOverwriteAllowed: false
    publicDeliveryAllowed: false
    providerExecutionAllowed: false
    gpuAllowed: false
    modelDownloadAllowed: false
  }
}

export interface RealVideoPrivateExportRuntimeReport {
  ok: boolean
  runId: string
  sourcePhase28RunId: string
  sourcePhase29RunId: string
  sourceVideoObject: string
  timelineDurationSeconds: number
  keepSegmentCount: number
  removeSegmentCount: number
  captionHandling: RealVideoPrivateExportCaptionHandling
  finalExport?: {
    bucket: string
    object: string
    gcsUri: string
    durationSeconds?: number
    videoCodec?: string
    audioCodec?: string
    hasAudio?: boolean
    sizeBytes?: number
    sha256?: string
  }
  artifacts: RealVideoPrivateExportArtifact[]
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: QualityGateResult[]
    blockers: string[]
    warnings: string[]
  }
  safety: {
    controlledPhase28SourceOnly: true
    controlledPhase29TimelineOnly: true
    secondSourceVideoUsed: false
    providerExecuted: false
    gpuUsed: false
    modelDownloadedExternally: false
    secretValuesUsed: false
    publicAccessEnabled: false
    finalExportCreated: boolean
    audioCleanupExecuted: false
    colorExecuted: false
    masksOrEnhancementExecuted: false
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

export interface RealVideoPrivateExportReport {
  reportId: string
  createdAt: string
  config: RealVideoPrivateExportConfig
  runtimeReport?: RealVideoPrivateExportRuntimeReport
  status: RealVideoPrivateExportStatus
  blockers: string[]
  warnings: string[]
  phase31Readiness: {
    readyForPrivateReview: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}
