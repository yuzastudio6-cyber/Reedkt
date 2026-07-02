import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'

export type SlowMotionExecutionMode =
  | 'dry_run'
  | 'local_dev'
  | 'container_ready'
  | 'production_blocked'
  | 'production_ready'

export type SlowMotionInterpolationMode =
  | 'film'
  | 'ffmpeg_native_speed'
  | 'planning_only'

export type SlowMotionToolId = 'film' | 'ffmpeg' | 'none'

export interface SlowMotionClipRange {
  startSeconds: number
  endSeconds: number
  reason?: string
}

export interface SlowMotionExecutionInput {
  mode: SlowMotionExecutionMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  workerPayload?: ProductionWorkerJobPayload
  mediaAnalysisReportId?: string
  sourceVideoArtifactId?: string
  proxyVideoArtifactId?: string
  sourceVideoLocalPath?: string
  proxyVideoLocalPath?: string
  outputDirectory?: string
  selectedClipRanges: SlowMotionClipRange[]
  slowMotionFactor: number
  interpolationMode: SlowMotionInterpolationMode
  modelWeightManifestIds?: string[]
  filmModelLocalPath?: string
  modeNotes?: string[]
  enableModelSlowMotionExecution?: boolean
  enableFfmpegFallbackPreview?: boolean
  allowModelDownload?: boolean
  allowFinalRender?: boolean
  ffmpegBin?: string
  timeoutMs?: number
  readinessReport?: { overallStatus?: string; blockers?: unknown[]; blockerSummaries?: unknown[] }
  rawPrompt?: unknown
  promptText?: unknown
  rawUserChat?: unknown
  signedUrl?: unknown
  serviceRoleKey?: unknown
  providerApiKey?: unknown
  secretValue?: unknown
  arbitraryModelArgs?: string[]
  arbitraryFfmpegArgs?: string[]
}

export interface SlowMotionTaskPlan {
  taskPlanId: string
  selectedClipRanges: SlowMotionClipRange[]
  slowMotionFactor: number
  interpolationMode: SlowMotionInterpolationMode
  primaryTool: SlowMotionToolId
  fallbackTools: SlowMotionToolId[]
  modelWeightRequirements: Array<'film_model'>
  expectedArtifacts: Array<Extract<ToolArtifact['artifactType'], 'interpolated_video' | 'preview_video' | 'qa_report'>>
  qaGatePlan: Array<Extract<QualityGateResult['gateType'], 'slow_motion_artifacts' | 'render_asset_integrity'>>
  previewAllowed: boolean
  finalRenderAllowed: false
  reasons: string[]
  warnings: string[]
}

export interface SlowMotionExecutionValidationIssue {
  code: string
  message: string
  severity: 'warning' | 'blocking'
}

export interface SlowMotionExecutionValidationResult {
  valid: boolean
  issues: SlowMotionExecutionValidationIssue[]
}

export interface SlowMotionToolCommandPlan {
  tool: SlowMotionToolId
  command?: string
  args: string[]
  expectedOutputPath?: string
  executes: false
  summary: string
}

export interface SlowMotionToolSkipReason {
  code: string
  message: string
  tool?: SlowMotionToolId
}

export interface SlowMotionToolExecutionResult {
  status: 'planned' | 'completed' | 'skipped' | 'failed'
  tool: SlowMotionToolId
  commandPlan?: SlowMotionToolCommandPlan
  artifact?: ToolArtifact
  artifacts?: ToolArtifact[]
  skipReason?: SlowMotionToolSkipReason
  warnings: string[]
  errorMessage?: string
}

export interface SlowMotionExecutionResult {
  mode: SlowMotionExecutionMode
  status: 'dry_run' | 'partial' | 'container_ready' | 'blocked' | 'failed'
  slowMotionTaskPlan?: SlowMotionTaskPlan
  interpolatedArtifacts: ToolArtifact[]
  previewArtifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  fallbackDecisions: string[]
  skippedReasons: SlowMotionToolSkipReason[]
  warnings: string[]
  blocksPreview: boolean
  blocksFinalExport: boolean
}

export function slowMotionIssue(code: string, message: string, severity: ProductionToolIssue['severity']): ProductionToolIssue {
  return { code, message, severity }
}
