import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionStorageReference, ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { RenderCanvas, RenderExportSettings, RenderManifest } from '../../../src/backend/contracts/render-manifest-contracts'
import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { MediaProbeResult } from '../media/media-worker-types'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'

export type FinalRenderExecutionMode =
  | 'dry_run'
  | 'local_dev'
  | 'container_ready'
  | 'production_blocked'
  | 'production_ready'

export type FinalRenderEngine = 'remotion' | 'ffmpeg' | 'libass' | 'hybrid'
export type FinalRenderMode = 'preview' | 'final_export' | 'command_plan_only'

export interface TimedRasterOverlayInput {
  localPath: string
  startSeconds: number
  endSeconds: number
  x?: number
  y?: number
  fadeInSeconds?: number
  fadeOutSeconds?: number
}

export interface VoiceCleanupEvidence {
  measuredNoiseFloorDbfs: number
  measuredSpeechRmsDbfs: number
  speechToNoiseFloorDb: number
  spectralNoiseReductionDb: number
  naturalnessQaRequired: true
  evidenceNote: string
}

export interface FinalRenderExecutionInput {
  mode: FinalRenderExecutionMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  creditReservationId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  workerPayload?: ProductionWorkerJobPayload
  timelineManifestId?: string
  timelineManifest?: TimelineManifest
  renderManifestId?: string
  renderManifest?: RenderManifest
  sourceVideoArtifactIds?: string[]
  proxyVideoArtifactIds?: string[]
  captionArtifactIds?: string[]
  audioArtifactIds?: string[]
  colorArtifactIds?: string[]
  maskArtifactIds?: string[]
  enhancementArtifactIds?: string[]
  slowMotionArtifactIds?: string[]
  qaGateResultIds?: string[]
  upstreamQaResults?: QualityGateResult[]
  requiredUpstreamQaGateTypes?: QualityGateResult['gateType'][]
  sourceLocalPaths?: string[]
  proxyLocalPaths?: string[]
  captionLocalPaths?: string[]
  captionOverlayInputs?: TimedRasterOverlayInput[]
  visualOverlayInputs?: TimedRasterOverlayInput[]
  audioLocalPaths?: string[]
  outputDirectory?: string
  outputFileName?: string
  renderEngine: FinalRenderEngine
  renderMode: FinalRenderMode
  canvas: RenderCanvas
  fps: number
  durationSeconds: number
  exportSettings: RenderExportSettings
  enableLocalDevRender?: boolean
  enableRemotionLocalRender?: boolean
  enableCaptionBurnIn?: boolean
  sourceAudioRequired?: boolean
  ffmpegBin?: string
  ffprobeBin?: string
  localDevRenderProfile?: {
    visualFinish: 'none' | 'clean_natural' | 'premium_clean'
    audioFinish: 'none' | 'clean_voice' | 'clean_voice_denoised'
    subtlePunchIns: boolean
    voiceCleanupEvidence?: VoiceCleanupEvidence
  }
  allowRevideo?: boolean
  timeoutMs?: number
  readinessReport?: { overallStatus?: string; blockers?: unknown[]; blockerSummaries?: unknown[] }
  rawPrompt?: unknown
  promptText?: unknown
  rawUserChat?: unknown
  signedUrl?: unknown
  serviceRoleKey?: unknown
  providerApiKey?: unknown
  secretValue?: unknown
  arbitraryFfmpegArgs?: string[]
  arbitraryRemotionArgs?: string[]
  arbitraryLibassArgs?: string[]
}

export interface RenderResolvedAsset {
  assetId: string
  artifactType?: ToolArtifact['artifactType']
  storageRef?: ProductionStorageReference
  localPath?: string
  required: boolean
  optional: boolean
  source: 'artifact_id' | 'local_path' | 'manifest_ref'
}

export interface RenderExecutionManifest {
  executionManifestId: string
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  timelineManifestId?: string
  renderManifestId?: string
  clips: Array<{
    clipId: string
    sourceArtifactId?: string
    sourceStartSeconds: number
    sourceEndSeconds: number
    timelineStartSeconds: number
    timelineEndSeconds: number
  }>
  captions: Array<{ artifactId: string; burnInRequired: boolean }>
  audio: Array<{ artifactId: string; role: 'mix' | 'stem' | 'source' }>
  overlays: string[]
  masks: string[]
  colorArtifactIds: string[]
  enhancementArtifactIds: string[]
  slowMotionArtifactIds: string[]
  canvas: RenderCanvas
  fps: number
  durationSeconds: number
  renderEngine: FinalRenderEngine
  renderMode: FinalRenderMode
  exportSettings: RenderExportSettings
  resolvedAssets: RenderResolvedAsset[]
  qaRequirements: Array<QualityGateResult['gateType']>
  hyperframeBridgeOnly: boolean
  revideoUsed: false
  finalDeliveryCandidate: boolean
}

export interface RenderExecutionValidationIssue {
  code: string
  message: string
  severity: 'warning' | 'blocking'
}

export interface RenderExecutionValidationResult {
  valid: boolean
  issues: RenderExecutionValidationIssue[]
}

export interface RenderCommandPlan {
  planId: string
  tool: 'remotion' | 'ffmpeg' | 'libass'
  command: string
  args: string[]
  expectedOutputPath?: string
  executes: boolean
  renderMode: FinalRenderMode
  summary: string
}

export interface RenderToolSkipReason {
  code: string
  message: string
  tool?: RenderCommandPlan['tool']
}

export interface RenderToolExecutionResult {
  status: 'planned' | 'completed' | 'skipped' | 'failed'
  tool: RenderCommandPlan['tool']
  commandPlan: RenderCommandPlan
  artifact?: ToolArtifact
  outputLocalPath?: string
  outputProbe?: MediaProbeResult
  skipReason?: RenderToolSkipReason
  warnings: string[]
  errorMessage?: string
}

export interface FinalRenderExecutionResult {
  mode: FinalRenderExecutionMode
  status: 'dry_run' | 'partial' | 'completed' | 'container_ready' | 'blocked' | 'failed'
  executionManifest?: RenderExecutionManifest
  commandPlans: RenderCommandPlan[]
  renderArtifacts: ToolArtifact[]
  previewArtifact?: ToolArtifact
  finalExportArtifact?: ToolArtifact
  outputLocalPath?: string
  outputProbe?: MediaProbeResult
  qaResults: QualityGateResult[]
  skippedReasons: RenderToolSkipReason[]
  warnings: string[]
  blocksPreview: boolean
  blocksFinalExport: boolean
  finalDeliveryAllowed: boolean
}

export function renderIssue(code: string, message: string, severity: ProductionToolIssue['severity']): ProductionToolIssue {
  return { code, message, severity }
}
