import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'

export type ColorExecutionMode =
  | 'dry_run'
  | 'local_dev'
  | 'container_ready'
  | 'production_blocked'
  | 'production_ready'

export type ColorGradeStyle =
  | 'clean_natural'
  | 'premium_clean'
  | 'warm_lifestyle'
  | 'cinematic_contrast'
  | 'documentary_neutral'
  | 'luxury_real_estate'
  | 'corporate_neutral'
  | 'bright_social'
  | 'moody_dramatic'
  | 'film_emulation_light'
  | 'muted_editorial'
  | 'high_key_clean'
  | 'monochrome'
  | 'custom'

export type ColorExecutionOperation =
  | 'analyze_color'
  | 'exposure_correction'
  | 'white_balance'
  | 'contrast_curve'
  | 'highlight_recovery'
  | 'shadow_control'
  | 'saturation_vibrance_control'
  | 'skin_tone_protection'
  | 'shot_matching'
  | 'lut_application'
  | 'look_transform'
  | 'display_transform'
  | 'output_color_transform'
  | 'color_qa'

export interface ColorExecutionInput {
  mode: ColorExecutionMode
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
  representativeFrameArtifactIds?: string[]
  sourceVideoLocalPath?: string
  proxyVideoLocalPath?: string
  representativeFrameLocalPaths?: string[]
  sourceStorageObjectPath?: string
  outputDirectory?: string
  colorGradeStyle?: ColorGradeStyle
  colorIntensity?: number
  lutStrength?: number
  colorCorrectionPlan?: ColorCorrectionPlan
  lutArtifactId?: string
  lutLocalPath?: string
  referenceClipArtifactId?: string
  mockAnalysis?: Partial<ColorAnalysisSummary>
  modeNotes?: string[]
  enableFfmpegColorPreview?: boolean
  enableOpenColorIOExecution?: boolean
  enableOpenImageIOExecution?: boolean
  allowFinalExport?: boolean
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
  arbitraryFfmpegArgs?: string[]
  arbitraryLutArgs?: string[]
}

export interface ColorAnalysisSummary {
  representativeFrameCount: number
  colorSpaceAssumption: 'bt709' | 'srgb' | 'rec2020' | 'unknown'
  transferAssumption: 'bt709' | 'srgb' | 'pq' | 'hlg' | 'unknown'
  hdrDetected: boolean
  underexposed: boolean
  overexposed: boolean
  whiteBalanceIssue: boolean
  shotMismatch: boolean
  skinToneRisk: 'low' | 'medium' | 'high' | 'unknown'
  highlightRisk: 'low' | 'medium' | 'high'
  shadowRisk: 'low' | 'medium' | 'high'
  saturationRisk: 'low' | 'medium' | 'high'
  histogramSummary?: {
    lumaMean?: number
    lumaStdDev?: number
    saturationMean?: number
    artifactId?: string
  }
  issues: ProductionToolIssue[]
  confidence: number
  advancedAnalysisRan: boolean
  missingEvidenceWarnings: string[]
}

export interface ColorCorrectionOperation {
  operationId: string
  operationType: Extract<ColorExecutionOperation,
    | 'exposure_correction'
    | 'white_balance'
    | 'contrast_curve'
    | 'highlight_recovery'
    | 'shadow_control'
    | 'saturation_vibrance_control'
    | 'skin_tone_protection'
  >
  amount: number
  reason: string
  risks: string[]
}

export interface ColorCorrectionPlan {
  id: string
  style: ColorGradeStyle
  intensity: number
  operations: ColorCorrectionOperation[]
  cleanFirst: true
  reasons: string[]
  warnings: string[]
}

export interface ColorShotMatchPlan {
  enabled: boolean
  operations: Array<{
    operationId: string
    matchType: 'exposure' | 'white_balance' | 'contrast' | 'saturation' | 'skin_tone'
    tolerance: 'loose' | 'balanced' | 'strict'
    reason: string
  }>
  referenceClipArtifactId?: string
  warnings: string[]
}

export interface ColorLookTransformPlan {
  enabled: boolean
  style: ColorGradeStyle
  lookIntensity: number
  lutStrength: number
  lutArtifactId?: string
  lutLocalPath?: string
  operations: Array<{
    operationId: string
    operationType: Extract<ColorExecutionOperation, 'look_transform' | 'lut_application' | 'display_transform' | 'output_color_transform'>
    strength: number
    reason: string
    risks: string[]
  }>
  warnings: string[]
}

export interface ColorFfmpegCommandPlan {
  command: string
  args: string[]
  expectedOutputPath?: string
  operation: 'color_preview'
  executes: false
  summary: string
}

export interface ColorToolSkipReason {
  code: string
  message: string
  tool?: 'ffmpeg' | 'opencolorio' | 'openimageio'
}

export interface ColorExecutionPlan {
  executionPlanId: string
  selectedOperations: ColorExecutionOperation[]
  correctionPlan: ColorCorrectionPlan
  shotMatchPlan: ColorShotMatchPlan
  lookTransformPlan: ColorLookTransformPlan
  ffmpegOperationPlan: {
    previewOnly: true
    commandPlan?: ColorFfmpegCommandPlan
  }
  opencolorioOperationPlan?: {
    enabled: boolean
    skipSafe: true
    reason: string
  }
  openimageioOperationPlan?: {
    enabled: boolean
    skipSafe: true
    reason: string
  }
  expectedArtifacts: Array<Extract<ToolArtifact['artifactType'], 'color_analysis_json' | 'color_grade_recipe' | 'graded_preview' | 'qa_report'>>
  requiredQualityGates: Array<Extract<QualityGateResult['gateType'], 'color_exposure' | 'color_skin_tone' | 'color_export_space' | 'color_shot_match'>>
  reasons: string[]
  warnings: string[]
  finalExportAllowed: false
}

export interface ColorExecutionValidationIssue {
  code: string
  message: string
  severity: 'warning' | 'blocking'
}

export interface ColorExecutionValidationResult {
  valid: boolean
  issues: ColorExecutionValidationIssue[]
}

export interface ColorPreviewExecutionResult {
  status: 'planned' | 'completed' | 'skipped' | 'failed'
  commandPlan: ColorFfmpegCommandPlan
  gradedPreviewArtifact?: ToolArtifact
  outputVideoLocalPath?: string
  skipReason?: ColorToolSkipReason
  errorMessage?: string
}

export interface ColorAdapterResult {
  status: 'planned' | 'skipped'
  skipReason?: ColorToolSkipReason
  warnings: string[]
}

export interface ColorExecutionResult {
  mode: ColorExecutionMode
  status: 'dry_run' | 'partial' | 'container_ready' | 'blocked' | 'failed'
  executionPlan?: ColorExecutionPlan
  colorAnalysisSummary?: ColorAnalysisSummary
  colorGradeRecipeArtifact?: ToolArtifact
  gradedPreviewArtifact?: ToolArtifact
  artifacts: ToolArtifact[]
  qaResults: QualityGateResult[]
  skippedReasons: ColorToolSkipReason[]
  warnings: string[]
  blocksPreview: boolean
  blocksFinalExport: boolean
}
