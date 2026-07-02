import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'

export type EnhancementExecutionMode =
  | 'dry_run'
  | 'local_dev'
  | 'container_ready'
  | 'production_blocked'
  | 'production_ready'

export type EnhancementIntent =
  | 'upscale_image'
  | 'restore_video_frames'
  | 'enhance_thumbnail'
  | 'improve_low_resolution_clip'
  | 'custom'

export type EnhancementToolId =
  | 'real_esrgan'
  | 'ffmpeg'
  | 'opencv'
  | 'sharp'
  | 'none'

export interface EnhancementClipRange {
  startSeconds: number
  endSeconds: number
  reason?: string
}

export interface EnhancementExecutionInput {
  mode: EnhancementExecutionMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  workerPayload?: ProductionWorkerJobPayload
  mediaAnalysisReportId?: string
  sourceImageArtifactId?: string
  sourceVideoArtifactId?: string
  proxyVideoArtifactId?: string
  representativeFrameArtifactIds?: string[]
  sourceImageLocalPath?: string
  sourceVideoLocalPath?: string
  proxyVideoLocalPath?: string
  representativeFrameLocalPaths?: string[]
  outputDirectory?: string
  enhancementIntent: EnhancementIntent
  targetScale?: number
  targetResolution?: { width: number; height: number }
  sourceResolution?: { width: number; height: number }
  sourceQualityIssueDetected?: boolean
  approvedEnhancementReason?: string
  sampleOnly?: boolean
  selectedClipRanges?: EnhancementClipRange[]
  sampleCount?: number
  modelWeightManifestIds?: string[]
  realEsrganModelLocalPath?: string
  modeNotes?: string[]
  enableModelEnhancementExecution?: boolean
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

export interface EnhancementSamplePolicy {
  sampleFirst: true
  selectedSamples: Array<{ sampleId: string; artifactId?: string; timeSeconds?: number; reason: string }>
  maxSampleCount: number
  beforeAfterComparisonRequired: true
  rejectConditions: Array<'plastic_skin' | 'oversharpening' | 'texture_artifacts' | 'flicker_risk' | 'hallucinated_detail' | 'no_measurable_improvement'>
  missingEvidenceWarnings: string[]
}

export interface EnhancementTaskPlan {
  taskPlanId: string
  enhancementIntent: EnhancementIntent
  primaryTool: EnhancementToolId
  fallbackTools: EnhancementToolId[]
  selectedSamples: EnhancementSamplePolicy['selectedSamples']
  selectedClipRanges: EnhancementClipRange[]
  sampleFirstPolicy: EnhancementSamplePolicy
  targetScale: number
  targetResolution?: { width: number; height: number }
  expectedArtifacts: Array<Extract<ToolArtifact['artifactType'], 'enhanced_video' | 'representative_frame' | 'preview_video' | 'qa_report'>>
  modelWeightRequirements: Array<'real_esrgan_model'>
  qaGatePlan: Array<Extract<QualityGateResult['gateType'], 'enhancement_artifacts' | 'render_asset_integrity'>>
  previewAllowed: boolean
  finalRenderAllowed: false
  reasons: string[]
  warnings: string[]
  recommendedNoEnhancement: boolean
}

export interface EnhancementExecutionValidationIssue {
  code: string
  message: string
  severity: 'warning' | 'blocking'
}

export interface EnhancementExecutionValidationResult {
  valid: boolean
  issues: EnhancementExecutionValidationIssue[]
}

export interface EnhancementToolCommandPlan {
  tool: EnhancementToolId
  command?: string
  args: string[]
  expectedOutputPath?: string
  executes: false
  summary: string
}

export interface EnhancementToolSkipReason {
  code: string
  message: string
  tool?: EnhancementToolId
}

export interface EnhancementToolExecutionResult {
  status: 'planned' | 'completed' | 'skipped' | 'failed'
  tool: EnhancementToolId
  commandPlan?: EnhancementToolCommandPlan
  artifact?: ToolArtifact
  artifacts?: ToolArtifact[]
  skipReason?: EnhancementToolSkipReason
  warnings: string[]
  errorMessage?: string
}

export interface EnhancementExecutionResult {
  mode: EnhancementExecutionMode
  status: 'dry_run' | 'partial' | 'container_ready' | 'blocked' | 'failed'
  enhancementTaskPlan?: EnhancementTaskPlan
  enhancedArtifacts: ToolArtifact[]
  previewArtifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  fallbackDecisions: string[]
  skippedReasons: EnhancementToolSkipReason[]
  warnings: string[]
  blocksPreview: boolean
  blocksFinalExport: boolean
}

export function enhancementIssue(code: string, message: string, severity: ProductionToolIssue['severity']): ProductionToolIssue {
  return { code, message, severity }
}
