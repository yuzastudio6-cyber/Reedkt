import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type { ProductionTimeRange, ToolArtifactType } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'
import type { OpenTimelineIOStyleManifest, HyperframeTimelineBridge, RemotionCompositionManifest } from '../timeline'
import type { SmartCutPlan, CutRisk } from './smart-cut-worker-types'
import type { TranscriptWord } from '../speech'

export type SmartCutTimelineExecutionMode =
  | 'dry_run'
  | 'local_dev'
  | 'container_ready'
  | 'production_blocked'
  | 'production_ready'

export type SmartCutOperationType =
  | 'keep_segment'
  | 'remove_segment'
  | 'trim_segment'
  | 'concatenate_segments'
  | 'preview_only'

export interface SmartCutTimelineExecutionInput {
  mode: SmartCutTimelineExecutionMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  editPlanId?: string
  workerPayload?: ProductionWorkerJobPayload
  mediaAnalysisReportId?: string
  smartCutPlanId?: string
  smartCutPlan?: SmartCutPlan
  timelineManifestId?: string
  sourceVideoArtifactId?: string
  proxyVideoArtifactId?: string
  sourceVideoLocalPath?: string
  proxyVideoLocalPath?: string
  sourceStorageObjectPath?: string
  captionArtifactIds?: string[]
  transcriptArtifactIds?: string[]
  wordTimestamps?: TranscriptWord[]
  outputDirectory?: string
  enableProxyPreview?: boolean
  allowFinalExport?: boolean
  ffmpegBin?: string
  ffprobeBin?: string
  timeoutMs?: number
  fps?: number
  canvas?: { width: number; height: number }
  mediaDurationSeconds?: number
  readinessReport?: {
    overallStatus?: string
    blockerSummaries?: unknown[]
    blockers?: unknown[]
    warnings?: unknown[]
  }
  rawPrompt?: unknown
  promptText?: unknown
  rawUserChat?: unknown
  signedUrl?: unknown
  serviceRoleKey?: unknown
  providerApiKey?: unknown
  secretValue?: unknown
  arbitraryFfmpegArgs?: string[]
}

export interface SmartCutOperation extends ProductionTimeRange {
  operationId: string
  operationType: SmartCutOperationType
  sourceStartSeconds: number
  sourceEndSeconds: number
  timelineStartSeconds: number
  durationSeconds: number
  sourceArtifactId?: string
  reason: string
  riskFlags: CutRisk[]
  qaStatus: 'pending' | 'passed' | 'warning' | 'blocked'
}

export interface SmartCutFfmpegOperationPlan {
  strategy: 'trim_then_concat_proxy'
  previewOnly: true
  finalExportAllowed: false
  operations: SmartCutOperationType[]
  expectedTempFileCount: number
  expectedOutputArtifactTypes: ToolArtifactType[]
  notes: string[]
}

export interface SmartCutExecutionPlan {
  executionPlanId: string
  sourceDurationSeconds: number
  targetDurationSeconds: number
  keepSegments: SmartCutPlan['keepSegments']
  removeSegments: SmartCutPlan['removeSegments']
  cutOperations: SmartCutOperation[]
  ffmpegOperationPlan: SmartCutFfmpegOperationPlan
  expectedArtifacts: ToolArtifactType[]
  requiredQualityGates: QualityGateResult['gateType'][]
  previewAllowed: boolean
  finalExportAllowed: false
  reasons: string[]
  warnings: string[]
}

export interface SmartCutFfmpegCommand {
  operationId: string
  operationType: Extract<SmartCutOperationType, 'trim_segment' | 'concatenate_segments' | 'preview_only'>
  command: string
  args: string[]
  expectedOutputPath?: string
  summary: string
}

export interface SmartCutFfmpegCommandPlan {
  planId: string
  mode: SmartCutTimelineExecutionMode
  previewEnabled: boolean
  finalExportAllowed: false
  command: string
  commands: SmartCutFfmpegCommand[]
  concatListPath?: string
  tempDirectory?: string
  expectedPreviewOutputPath?: string
  timeoutMs: number
  executes: false
  safetyNotes: string[]
}

export interface SmartCutPreviewResult {
  status: 'created' | 'skipped' | 'failed'
  previewLocalPath?: string
  artifact?: ToolArtifact
  commandPlan?: SmartCutFfmpegCommandPlan
  skipReason?: string
  errorMessage?: string
}

export interface SmartCutExecutionPolicyResult {
  allowed: boolean
  blockingReasons: string[]
  warnings: string[]
}

export interface SmartCutExecutionValidationResult {
  valid: boolean
  issues: Array<{
    code: string
    message: string
    severity: 'warning' | 'blocking'
  }>
}

export interface SmartCutTimelineExecutionResult {
  mode: SmartCutTimelineExecutionMode
  status: 'dry_run' | 'partial' | 'container_ready' | 'blocked' | 'failed'
  executionPlan?: SmartCutExecutionPlan
  ffmpegCommandPlan?: SmartCutFfmpegCommandPlan
  timelineManifest?: TimelineManifest
  otioManifest?: OpenTimelineIOStyleManifest
  hyperframeBridge?: HyperframeTimelineBridge
  remotionManifest?: RemotionCompositionManifest
  previewArtifact?: ToolArtifact
  artifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  skippedReasons: string[]
  warnings: string[]
  blocksPreview: boolean
  blocksFinalExport: boolean
}
