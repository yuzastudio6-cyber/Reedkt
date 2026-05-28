import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type { HyperframeTimelineBridge, OpenTimelineIOStyleManifest, RemotionCompositionManifest } from '../../workers/timeline'
import type { SmartCutExecutionPlan, SmartCutTimelineExecutionResult } from '../../workers/smart-cut'
import type { SmartCutPlan } from '../../workers/smart-cut'

export type RealVideoSmartCutStatus = 'planned' | 'ready' | 'blocked' | 'failed'

export interface RealVideoSmartCutConfig {
  projectId: 'reeditpro'
  region: 'us-central1'
  phase28RunId: 'phase28-20260528T01552'
  sourceBucket: 'reeditpro-staging-reeditpro-source-media'
  analysisBucket: 'reeditpro-staging-reeditpro-analysis-artifacts'
  transcriptsBucket: 'reeditpro-staging-reeditpro-transcripts'
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts'
  phase28SourceObject: string
  phase28Prefix: string
  sourceGcsUri: string
}

export interface RealVideoSmartCutArtifact {
  id: string
  kind: string
  bucket: string
  object: string
  gcsUri: string
  sizeBytes?: number
  sha256?: string
}

export interface RealVideoSmartCutLoadedArtifacts {
  phase28Report: Record<string, unknown>
  mediaProbe: Record<string, unknown>
  transcript: Record<string, unknown>
  wordTimestamps: Record<string, unknown>
  captionSegments: Record<string, unknown>
  captionQa: Record<string, unknown>
}

export interface RealVideoSmartCutNormalizedInput {
  sourceGcsUri: string
  sourceDurationSeconds: number
  width?: number
  height?: number
  transcriptSegments: Array<{
    segmentId: string
    startSeconds: number
    endSeconds: number
    text: string
    words: Array<{
      word: string
      startSeconds: number
      endSeconds: number
      confidence?: number
      segmentId: string
    }>
    confidence?: number
  }>
  wordTimestamps: Array<{
    word: string
    startSeconds: number
    endSeconds: number
    confidence?: number
    segmentId: string
  }>
  captionSegments: Array<{
    captionId: string
    startSeconds: number
    endSeconds: number
    text: string
    lines: string[]
    words: Array<{
      word: string
      startSeconds: number
      endSeconds: number
      confidence?: number
      segmentId: string
    }>
    styleHints: {
      presetId: 'clean_subtitle'
      placement: 'bottom_safe'
      emphasisWords: string[]
    }
  }>
  captionArtifactIds: string[]
  transcriptArtifactIds: string[]
}

export interface RealVideoSmartCutRuntimeReport {
  ok: boolean
  runId: string
  sourcePhase28RunId: string
  sourceVideoObject: string
  sourceDurationSeconds: number
  transcriptSegmentCount: number
  wordTimestampCount: number
  captionSegmentCount: number
  smartCut: {
    intent: string[]
    aggressiveness: string
    keepSegmentCount: number
    removeSegmentCount: number
    protectedSegmentCount: number
    targetDurationSeconds: number
    previewStatus: 'skipped' | 'created'
    previewReason: string
  }
  timeline: {
    durationSeconds: number
    clipCount: number
    captionLayerCount: number
  }
  artifacts: RealVideoSmartCutArtifact[]
  qa: {
    status: 'passed' | 'warning' | 'blocked'
    gates: QualityGateResult[]
    blockers: string[]
    warnings: string[]
  }
  safety: {
    controlledPhase28SourceOnly: true
    secondSourceVideoUsed: false
    providerExecuted: false
    gpuUsed: false
    modelDownloadedExternally: false
    secretValuesUsed: false
    publicAccessEnabled: false
    finalExportCreated: false
    audioCleanupExecuted: false
    colorExecuted: false
    masksOrEnhancementExecuted: false
  }
  uploadedReport: {
    bucket: string
    object: string
    gcsUri: string
  }
  warnings: string[]
}

export interface RealVideoSmartCutReport {
  reportId: string
  createdAt: string
  config: RealVideoSmartCutConfig
  runtimeReport?: RealVideoSmartCutRuntimeReport
  status: RealVideoSmartCutStatus
  blockers: string[]
  warnings: string[]
  phase30Readiness: {
    readyForPrivatePreviewOrRenderPlanning: boolean
    reason: string
  }
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}

export interface RealVideoSmartCutBuildResult {
  smartCutPlan: SmartCutPlan
  executionResult: SmartCutTimelineExecutionResult
  executionPlan: SmartCutExecutionPlan
  timelineManifest: TimelineManifest
  otioManifest: OpenTimelineIOStyleManifest
  hyperframeBridge: HyperframeTimelineBridge
  remotionManifest: RemotionCompositionManifest
  qaResults: QualityGateResult[]
}
