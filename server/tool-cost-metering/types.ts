export const TOOL_COST_USAGE_CATEGORIES = [
  'planning',
  'transcription',
  'media_analysis',
  'captions',
  'stroke_motion',
  'graphic_design',
  'real_motion',
  'soundsync',
  'music',
  'sfx',
  'rendering',
  'export',
  'qa',
  'revision',
  'other',
] as const

export type ToolCostUsageCategory = typeof TOOL_COST_USAGE_CATEGORIES[number]

export const TOOL_COST_COMPUTE_LEVELS = ['economy', 'standard', 'premium'] as const
export type ToolCostComputeLevel = typeof TOOL_COST_COMPUTE_LEVELS[number]

export const TOOL_COST_PROVIDER_TYPES = [
  'external_api',
  'cloud_run_request',
  'cloud_run_job',
  'compute_engine_vm',
  'gpu_worker',
  'deterministic_renderer',
  'human',
  'unknown',
] as const
export type ToolCostProviderType = typeof TOOL_COST_PROVIDER_TYPES[number]

export const TOOL_COST_QUALITY_LEVELS = ['draft', 'preview', 'production', 'premium'] as const
export type ToolCostQualityLevel = typeof TOOL_COST_QUALITY_LEVELS[number]

export const TOOL_COST_RISK_LEVELS = ['low', 'medium', 'high'] as const
export type ToolCostRiskLevel = typeof TOOL_COST_RISK_LEVELS[number]

export const TOOL_COST_FAILURE_CATEGORIES = [
  'none',
  'provider_error',
  'timeout',
  'invalid_prompt',
  'unsafe_output',
  'asset_missing',
  'credit_not_reserved',
  'approval_missing',
  'worker_error',
  'quality_failed',
  'user_requested_retry',
  'user_requested_revision',
  'unknown',
] as const
export type ToolCostFailureCategory = typeof TOOL_COST_FAILURE_CATEGORIES[number]

export interface ToolCostEstimateInput {
  toolId: string
  toolName: string
  usageCategory: ToolCostUsageCategory
  computeLevel: ToolCostComputeLevel
  providerType: ToolCostProviderType
  providerName?: string | null
  modelName?: string | null
  qualityLevel: ToolCostQualityLevel
  inputVideoSeconds?: number
  outputVideoSeconds?: number
  inputAudioSeconds?: number
  outputAudioSeconds?: number
  imageCount?: number
  estimatedRuntimeSeconds?: number
  resolution?: string
  frameRate?: number
  inputTokens?: number
  outputTokens?: number
  renderDurationSeconds?: number
  vcpuCount?: number
  memoryGiB?: number
  gpuType?: string | null
  gpuCount?: number
  temporaryStorageGiBHours?: number
  outputStorageGiBHours?: number
  networkEgressMiB?: number
  approvedReservationRemainingCredits?: number
  providerOptions?: string[]
  assumptions?: string[]
  metadata?: Record<string, unknown>
}

export interface ToolCostEstimate {
  toolId: string
  toolName: string
  usageCategory: ToolCostUsageCategory
  computeLevel: ToolCostComputeLevel
  providerType: ToolCostProviderType
  providerName: string | null
  modelName: string | null
  qualityLevel: ToolCostQualityLevel
  inputVideoSeconds: number
  outputVideoSeconds: number
  inputAudioSeconds: number
  outputAudioSeconds: number
  imageCount: number
  estimatedRuntimeSeconds: number
  resolution: string
  frameRate: number
  lowInternalCostCents: number
  expectedInternalCostCents: number
  highInternalCostCents: number
  lowCredits: number
  expectedCredits: number
  highCredits: number
  rateCardVersion: string
  pricingSnapshot: Record<string, unknown>
  assumptions: string[]
  riskLevel: ToolCostRiskLevel
  requiresExternalProvider: boolean
  providerOptions: string[]
  canRunWithinApprovedReservation: boolean
}

export interface ToolCostEventInput {
  id?: string
  workspaceId: string
  projectId: string
  editPlanId?: string | null
  jobId?: string | null
  jobBatchId?: string | null
  generationRequestId?: string | null
  renderJobId?: string | null
  creditEstimateId?: string | null
  creditReservationId?: string | null
  toolId: string
  toolName: string
  usageCategory: ToolCostUsageCategory
  providerType: ToolCostProviderType
  providerName?: string | null
  modelName?: string | null
  qualityLevel: ToolCostQualityLevel
  startedAt: string
  completedAt: string
  wallClockMs: number
  billableMs?: number
  vcpuCount?: number
  memoryGiB?: number
  gpuType?: string | null
  gpuCount?: number
  inputTokens?: number
  outputTokens?: number
  inputVideoSeconds?: number
  outputVideoSeconds?: number
  inputAudioSeconds?: number
  outputAudioSeconds?: number
  imageCount?: number
  renderDurationSeconds?: number
  outputResolution?: string | null
  outputFrameRate?: number
  estimatedInternalCostCents?: number
  retryAttempt?: number
  retryReason?: string | null
  failureCategory?: ToolCostFailureCategory
  billableToUser?: boolean
  approvedReservationRemainingCredits?: number
  temporaryStorageGiBHours?: number
  outputStorageGiBHours?: number
  networkEgressMiB?: number
  metadata?: Record<string, unknown>
}

export interface ToolCostEvent {
  id: string
  workspaceId: string
  projectId: string
  editPlanId: string | null
  jobId: string | null
  jobBatchId: string | null
  generationRequestId: string | null
  renderJobId: string | null
  creditEstimateId: string | null
  creditReservationId: string | null
  toolId: string
  toolName: string
  usageCategory: ToolCostUsageCategory
  providerType: ToolCostProviderType
  providerName: string | null
  modelName: string | null
  qualityLevel: ToolCostQualityLevel
  startedAt: string
  completedAt: string
  wallClockMs: number
  billableMs: number
  vcpuCount: number
  memoryGiB: number
  gpuType: string | null
  gpuCount: number
  inputTokens: number
  outputTokens: number
  inputVideoSeconds: number
  outputVideoSeconds: number
  inputAudioSeconds: number
  outputAudioSeconds: number
  imageCount: number
  renderDurationSeconds: number
  outputResolution: string | null
  outputFrameRate: number
  rateCardVersion: string
  pricingSnapshot: Record<string, unknown>
  estimatedInternalCostCents: number
  actualInternalCostCents: number
  actualInternalCostMicros: number
  toolCostCredits: number
  retryAttempt: number
  retryReason: string | null
  failureCategory: ToolCostFailureCategory
  billableToUser: boolean
  metadata: Record<string, unknown>
}

export interface ToolCostSummary {
  workspaceId: string
  projectId: string
  rateCardVersion: string
  billableEventCount: number
  nonBillableEventCount: number
  actualToolCostCents: number
  actualToolCostCredits: number
  byUsageCategory: Record<ToolCostUsageCategory, {
    eventCount: number
    actualInternalCostCents: number
    credits: number
  }>
  events: ToolCostEvent[]
  warnings: string[]
}
