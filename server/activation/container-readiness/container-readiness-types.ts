import type { ContainerBuildImageId } from '../container-build'

export type ContainerReadinessImageId = ContainerBuildImageId

export type ContainerReadinessMode =
  | 'static_plan'
  | 'report_from_logs'
  | 'phase22_ready_check'
  | 'phase23_blocked'

export type ContainerReadinessStatus =
  | 'passed'
  | 'warning'
  | 'missing'
  | 'failed'
  | 'blocked'
  | 'not_checked'
  | 'not_applicable'
  | 'optional_missing'
  | 'pending_manual_review'
  | 'source_install_review_required'
  | 'model_weight_missing'
  | 'model_weight_blocked'
  | 'evaluation_only'
  | 'deferred'

export type ContainerReadinessToolId =
  | 'node-runtime'
  | 'server-build'
  | 'python-runtime'
  | 'shell-utilities'
  | 'readiness-scripts'
  | 'ffmpeg'
  | 'ffprobe'
  | 'python3'
  | 'pyav'
  | 'pyscenedetect'
  | 'opencv-python-headless'
  | 'duckdb'
  | 'polars'
  | 'opentimelineio'
  | 'sharp-libvips'
  | 'opencolorio'
  | 'openimageio'
  | 'remotion'
  | 'libass'
  | 'cuda-gpu-base-policy'
  | 'torch-torchvision'
  | 'ctranslate2-faster-whisper'
  | 'kornia'
  | 'opencv'
  | 'deepfilternet-demucs'
  | 'birefnet-sam2-real-esrgan-film'
  | 'model-weight-directories'

export interface ContainerReadinessExpectedTool {
  toolId: ContainerReadinessToolId
  displayName: string
  requiredForPhase23: boolean
  requiredForGpuPhase: boolean
  optionalForNonGpuStaging: boolean
  manualReviewRequired: boolean
  sourceInstallReviewRequired: boolean
  modelWeightRelated: boolean
  defaultStatusWhenMissing: ContainerReadinessStatus
  aliases: string[]
  notes: string[]
}

export interface ContainerReadinessImageExpectation {
  imageId: ContainerReadinessImageId
  displayName: string
  productionImageRole: string
  dockerfilePath: string
  expectedTools: ContainerReadinessExpectedTool[]
  forbiddenTools: string[]
  heavy: boolean
  optionalForNonGpuStaging: boolean
  requiredForGpuPhase: boolean
  productionBlockedUntilApprovals: boolean
  notes: string[]
}

export interface ContainerReadinessCommandPlan {
  commandId: string
  imageId?: ContainerReadinessImageId | 'all-images' | 'static-readiness'
  requiredEnvVars: string[]
  commandString: string
  safeToRunManually: boolean
  requiresHumanConfirmation: true
  confirmationEnvVar: 'REEDITPRO_CONFIRM_CONTAINER_READINESS'
  doesNotDo: string[]
  expectedOutput: string
  notes: string[]
}

export interface ContainerToolReadinessResult {
  imageId: ContainerReadinessImageId
  toolId: ContainerReadinessToolId
  displayName: string
  status: ContainerReadinessStatus
  requiredForPhase23: boolean
  requiredForGpuPhase: boolean
  warnings: string[]
  blockers: string[]
}

export interface ContainerModelWeightReadinessResult {
  imageId: ContainerReadinessImageId
  toolId: ContainerReadinessToolId
  status: ContainerReadinessStatus
  blocksGpuPhase: boolean
  warnings: string[]
  blockers: string[]
}

export interface ContainerImageReadinessResult {
  imageId: ContainerReadinessImageId
  imageName?: string
  imageDigest?: string
  buildEvidenceStatus: ContainerReadinessStatus
  readinessEvidenceStatus: ContainerReadinessStatus
  expectedTools: ContainerReadinessExpectedTool[]
  passedTools: ContainerReadinessToolId[]
  missingTools: ContainerReadinessToolId[]
  optionalMissingTools: ContainerReadinessToolId[]
  blockedTools: ContainerReadinessToolId[]
  manualReviewTools: ContainerReadinessToolId[]
  forbiddenFindings: string[]
  productionAllowed: false
  stagingAllowed: boolean
  notes: string[]
}

export interface ParsedContainerReadinessToolResult {
  toolId: ContainerReadinessToolId
  status: ContainerReadinessStatus
  sourceLine: string
}

export interface ParsedContainerReadinessLog {
  parsedStatus: ContainerReadinessStatus
  imageId?: ContainerReadinessImageId
  imageName?: string
  imageDigest?: string
  toolResults: ParsedContainerReadinessToolResult[]
  blockers: string[]
  warnings: string[]
  forbiddenFindings: string[]
  nextActions: string[]
}

export interface ContainerReadinessBlocker {
  id: string
  imageId?: ContainerReadinessImageId | 'unknown'
  summary: string
}

export interface ContainerReadinessWarning {
  id: string
  imageId?: ContainerReadinessImageId | 'unknown'
  summary: string
}

export interface ContainerReadinessManualReviewItem {
  id: string
  imageId: ContainerReadinessImageId
  toolId?: ContainerReadinessToolId
  summary: string
  status: ContainerReadinessStatus
}

export interface ContainerReadinessNextAction {
  id: string
  title: string
  summary: string
}

export interface ContainerPhase22Readiness {
  readyForGcpStagingFoundationSetup: boolean
  gpuReadinessRequired: false
  requiredBeforePhase22: string[]
  blockers: string[]
  warnings: string[]
}

export interface ContainerPhase23Readiness {
  readyForArtifactRegistryPush: boolean
  requiredImagesReady: ContainerReadinessImageId[]
  optionalImagesDeferred: ContainerReadinessImageId[]
  blockers: string[]
  warnings: string[]
}

export interface ContainerReadinessReport {
  reportId: string
  createdAt: string
  mode: ContainerReadinessMode
  imageTag?: string
  imageReadinessResults: ContainerImageReadinessResult[]
  toolReadinessResults: ContainerToolReadinessResult[]
  modelWeightReadinessResults: ContainerModelWeightReadinessResult[]
  manualReviewItems: ContainerReadinessManualReviewItem[]
  blockers: ContainerReadinessBlocker[]
  warnings: ContainerReadinessWarning[]
  commandPlans: ContainerReadinessCommandPlan[]
  phase22Readiness: ContainerPhase22Readiness
  phase23Readiness: ContainerPhase23Readiness
  nextActions: ContainerReadinessNextAction[]
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
  dockerExecuted: false
  gcloudExecuted: false
  providerExecuted: false
  modelDownloadExecuted: false
  mediaProcessingExecuted: false
}

export interface BuildContainerReadinessReportInput {
  mode?: ContainerReadinessMode
  imageTag?: string
  parsedLogs?: ParsedContainerReadinessLog[]
  createdAt?: string
}
