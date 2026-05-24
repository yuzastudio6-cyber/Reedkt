export const EDITING_TOOL_IDS = [
  'ffmpeg',
  'ffprobe',
  'remotion',
  'sharp_libvips',
  'opencv',
  'audioflux',
  'signalsmith_stretch',
  'whisper',
  'pyscenedetect',
  'playwright',
  'vapoursynth',
] as const

export type EditingToolId = typeof EDITING_TOOL_IDS[number]

export type EditingWorkerBoundary =
  | 'media-analysis-worker'
  | 'render-worker'
  | 'audio-soundsync-worker'
  | 'image-asset-worker'
  | 'browser-capture-worker'
  | 'advanced-frame-worker'
  | 'staging-canary-worker'
  | 'future-worker'

export type EditingToolInstallTarget =
  | 'cloud_run_render_image'
  | 'worker_image'
  | 'python_worker_image'
  | 'node_worker_image'
  | 'future_worker_image'

export type EditingToolReviewStatus =
  | 'approved_for_staging_smoke'
  | 'pending_review'
  | 'not_required_current_milestone'

export type EditingToolProductionApprovalStatus =
  | 'staging_smoke_only'
  | 'planning_only'
  | 'blocked_until_review'

export type EditingToolCurrentReadiness =
  | 'code_enforced_proven_staging'
  | 'safe_check_available'
  | 'planned_stub'
  | 'not_installed_optional'

export interface EditingToolRuntimeCheckSpec {
  runtimeCheckCommand?: string
  importCheck?: string
  safeCheckOnly: boolean
}

export interface EditingToolContract {
  toolId: EditingToolId
  displayName: string
  productionPurpose: string
  workerBoundary: EditingWorkerBoundary
  requiredForMilestones: string[]
  optionalUntil: string
  installTarget: EditingToolInstallTarget
  runtimeCheck: EditingToolRuntimeCheckSpec
  expectedVersionShape: string
  inputContracts: string[]
  outputContracts: string[]
  timeoutMs: number
  memoryHint: string
  cpuHint: string
  failureMode: string
  licenseReviewStatus: EditingToolReviewStatus
  securityReviewStatus: EditingToolReviewStatus
  productionApprovalStatus: EditingToolProductionApprovalStatus
  currentReadiness: EditingToolCurrentReadiness
}

export const CURRENT_MILESTONE_REQUIRED_TOOL_IDS = [
  'ffmpeg',
  'ffprobe',
  'remotion',
] as const satisfies readonly EditingToolId[]

export function isEditingToolId(value: string): value is EditingToolId {
  return (EDITING_TOOL_IDS as readonly string[]).includes(value)
}
