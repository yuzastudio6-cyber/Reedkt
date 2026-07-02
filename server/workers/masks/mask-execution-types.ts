import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'
import type { TextBehindSubjectExecutionInput, TextLayerPlan, DepthCompositionManifest } from '../text-behind-subject/text-behind-subject-types'

export type MaskExecutionMode =
  | 'dry_run'
  | 'local_dev'
  | 'container_ready'
  | 'production_blocked'
  | 'production_ready'

export type MaskIntent =
  | 'background_removal_image'
  | 'background_removal_video'
  | 'subject_cutout'
  | 'text_behind_subject'
  | 'blur_background'
  | 'custom'

export type MaskToolId =
  | 'birefnet'
  | 'sam2'
  | 'transparent_background'
  | 'rembg'
  | 'opencv'
  | 'kornia'
  | 'none'

export interface MaskBoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface MaskPointPrompt {
  x: number
  y: number
  label: 'foreground' | 'background'
}

export interface MaskSubjectSelection {
  boundingBox?: MaskBoundingBox
  pointPrompts?: MaskPointPrompt[]
  frameTimeSeconds?: number
  approvedSubjectLabel?: string
}

export interface MaskExecutionInput {
  mode: MaskExecutionMode
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
  maskIntent: MaskIntent
  subjectSelection?: MaskSubjectSelection
  selectedPrimaryTool?: MaskToolId
  fallbackTools?: MaskToolId[]
  modelWeightManifestIds?: string[]
  modelLocalPaths?: string[]
  birefnetModelLocalPath?: string
  sam2CheckpointLocalPath?: string
  maskConfidenceHint?: number
  motionRequiresTracking?: boolean
  frameSamplingMaxFrames?: number
  textBehindSubject?: TextBehindSubjectExecutionInput
  modeNotes?: string[]
  enableModelMaskExecution?: boolean
  enableMaskPreview?: boolean
  allowModelDownload?: boolean
  allowFinalRender?: boolean
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

export interface MaskTaskPlan {
  taskPlanId: string
  maskIntent: MaskIntent
  primaryTool: MaskToolId
  fallbackTools: MaskToolId[]
  selectedFrames: Array<{ frameId: string; timeSeconds?: number; reason: string }>
  videoFrameSamplingPolicy: {
    mode: 'keyframes_only' | 'proxy_sampled' | 'single_frame'
    maxFrames: number
    fullResolutionEveryFrame: false
  }
  subjectSelection?: MaskSubjectSelection
  expectedArtifacts: Array<Extract<ToolArtifact['artifactType'], 'mask_image' | 'mask_sequence' | 'rgba_cutout' | 'qa_report' | 'preview_video' | 'render_manifest'>>
  modelWeightRequirements: Array<'birefnet_model' | 'sam2_checkpoint' | 'rembg_model' | 'transparent_background_model'>
  refinementPlan: {
    opencv: boolean
    kornia: boolean
    operations: Array<'edge_cleanup' | 'hole_fill' | 'morphology' | 'temporal_smoothing'>
  }
  temporalSmoothingPlan: MaskTemporalSmoothingPlan
  qaGatePlan: Array<Extract<QualityGateResult['gateType'], 'mask_edge_quality' | 'mask_temporal_stability' | 'mask_subject_coverage' | 'render_asset_integrity'>>
  previewAllowed: boolean
  finalRenderAllowed: false
  reasons: string[]
  warnings: string[]
}

export interface MaskTemporalSmoothingPlan {
  required: boolean
  trackingRequired: boolean
  maxAllowedFlickerRisk: 'low' | 'medium'
  frameConsistencyChecks: string[]
  warningIfNotRun: string
}

export interface MaskExecutionValidationIssue {
  code: string
  message: string
  severity: 'warning' | 'blocking'
}

export interface MaskExecutionValidationResult {
  valid: boolean
  issues: MaskExecutionValidationIssue[]
}

export interface MaskToolCommandPlan {
  tool: MaskToolId
  command?: string
  args: string[]
  expectedOutputPath?: string
  executes: false
  summary: string
}

export interface MaskToolSkipReason {
  code: string
  message: string
  tool?: MaskToolId | 'ffmpeg'
}

export interface MaskToolExecutionResult {
  status: 'planned' | 'completed' | 'skipped' | 'failed'
  tool: MaskToolId
  commandPlan?: MaskToolCommandPlan
  artifact?: ToolArtifact
  artifacts?: ToolArtifact[]
  skipReason?: MaskToolSkipReason
  warnings: string[]
  errorMessage?: string
}

export interface MaskFallbackDecision {
  trigger: string
  action: 'switch_tool' | 'use_shorter_segment' | 'keyframe_only_cutout' | 'normal_foreground_text' | 'side_panel' | 'lower_third' | 'skip_effect' | 'request_review' | 'block_preview'
  reason: string
  toolIds?: MaskToolId[]
  blocksPreview?: boolean
}

export interface MaskExecutionResult {
  mode: MaskExecutionMode
  status: 'dry_run' | 'partial' | 'container_ready' | 'blocked' | 'failed'
  maskTaskPlan?: MaskTaskPlan
  maskArtifacts: ToolArtifact[]
  textLayerPlan?: TextLayerPlan
  depthCompositionManifest?: DepthCompositionManifest
  previewArtifact?: ToolArtifact
  qaResults: QualityGateResult[]
  fallbackDecisions: MaskFallbackDecision[]
  skippedReasons: MaskToolSkipReason[]
  warnings: string[]
  blocksPreview: boolean
  blocksFinalExport: boolean
}

export function issue(code: string, message: string, severity: ProductionToolIssue['severity']): ProductionToolIssue {
  return { code, message, severity }
}
