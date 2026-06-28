export const TOOL_COST_USAGE_CATEGORIES = [
  'admin',
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
  serviceFeeIncluded: false
  assumptions: string[]
  riskLevel: ToolCostRiskLevel
  requiresExternalProvider: boolean
  providerOptions: string[]
  canRunWithinApprovedReservation: boolean
  creditPrerequisiteStatus?: string
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

export type ToolRuntimeComputeLevel = ToolCostComputeLevel
export type ToolCostSourceKind =
  | 'external_provider'
  | 'infrastructure_runtime'
  | 'deterministic_renderer'
  | 'mock_manual_entry'

export type ToolCostMathErrorCode =
  | 'invalid_cents'
  | 'invalid_count'
  | 'invalid_milliseconds'
  | 'invalid_seconds'
  | 'invalid_compute_level'
  | 'secret_like_payload'
  | 'invalid_source_kind'

export type ToolCostMathResult<TData> =
  | { ok: true; data: TData }
  | { ok: false; error: { code: ToolCostMathErrorCode; message: string; field?: string } }

export interface ToolCostPricingSnapshot {
  rateCardVersion: string
  sourceKind: ToolCostSourceKind
  provider: string | null
  model: string | null
  computeLevel: ToolRuntimeComputeLevel | null
  riskLevel: ToolCostRiskLevel | null
  serviceFeeIncluded: false
  pricingUnits: Record<string, unknown>
}

export interface ExternalProviderCostInput {
  provider?: string | null
  model?: string | null
  requestCount?: number
  inputTokens?: number
  outputTokens?: number
  imageCount?: number
  inputVideoSeconds?: number
  outputVideoSeconds?: number
  inputAudioSeconds?: number
  outputAudioSeconds?: number
}

export interface InfrastructureRuntimeCostInput {
  wallTimeMilliseconds: number
  renderSeconds?: number
  vcpuCount?: number
  memoryGib?: number
  gpuCount?: number
  tempStorageGibHours?: number
  outputStorageGibHours?: number
  networkEgressMib?: number
  computeLevel?: ToolRuntimeComputeLevel
}

export interface DeterministicRendererCostInput {
  requestCount?: number
  outputSeconds?: number
  megapixelFrames?: number
  computeLevel?: ToolRuntimeComputeLevel
}

export type CalculateToolActualCostMicrosInput =
  | ({ sourceKind: 'external_provider'; riskLevel?: ToolCostRiskLevel } & ExternalProviderCostInput)
  | { sourceKind: 'infrastructure_runtime'; runtime: InfrastructureRuntimeCostInput; riskLevel?: ToolCostRiskLevel }
  | { sourceKind: 'deterministic_renderer'; deterministicRenderer: DeterministicRendererCostInput; riskLevel?: ToolCostRiskLevel }
  | { sourceKind: 'mock_manual_entry'; actualInternalCostCents?: number; actualInternalCostMicros?: number; riskLevel?: ToolCostRiskLevel }

export interface ToolCostMicrosCalculation {
  actualInternalCostMicros: number
  sourceKind: ToolCostSourceKind
  rateCardVersion: string
  provider: string | null
  model: string | null
  computeLevel: ToolRuntimeComputeLevel | null
  pricingSnapshot: ToolCostPricingSnapshot
  breakdownMicros: Record<string, number>
  billableMilliseconds?: number
}

export interface ToolCostEstimateRange {
  lowInternalCostCents: number
  expectedInternalCostCents: number
  highInternalCostCents: number
  lowCredits: number
  expectedCredits: number
  highCredits: number
  riskLevel: ToolCostRiskLevel
  rateCardVersion: string
  sourceKind: ToolCostSourceKind
  provider: string | null
  model: string | null
  computeLevel: ToolRuntimeComputeLevel | null
  serviceFeeIncluded: false
  pricingSnapshot: ToolCostPricingSnapshot
  canRunWithinApprovedReservation: boolean | null
}

export interface MockToolCostEvent {
  id: string
  workspaceId: string
  projectId: string
  creditEstimateId: string | null
  creditReservationId: string | null
  label: string
  usageCategory: ToolCostUsageCategory
  lineItemType?: string
  computeLevel: ToolRuntimeComputeLevel
  billableToUser: boolean
  serviceFeeIncluded: false
  sourceKind: ToolCostSourceKind
  actualInternalCostMicros: number
  actualInternalCostCents: number
  toolCostCredits: number
  credits: number
  rateCardVersion: string
  pricingSnapshot: ToolCostPricingSnapshot
  failureCategory: ToolCostFailureCategory | 'provider_variance_absorbed'
  retryAttempt: number
  idempotencyKey: string | null
  nonBillableReason?: string
  createdAt: string
  metadata: Record<string, unknown>
}

export interface ToolCostEventAggregation {
  actualBillableCostCents: number
  actualBillableCostCredits: number
  nonBillableCostCents: number
  nonBillableCredits: number
  billableEventCount: number
  nonBillableEventCount: number
  billableEventIds: string[]
  nonBillableEventIds: string[]
  nonBillableReasons: string[]
  byUsageCategory: Record<string, {
    actualInternalCostCents: number
    credits: number
    eventCount: number
    billableEventCount: number
    nonBillableEventCount: number
  }>
}

export interface CanonicalToolCostRateCard {
  rateCardVersion: string
  creditValueCents: number
  serviceFeeIncluded: false
  productEditLevelsAreSeparate: true
  supportedProductEditLevels: readonly string[]
  computeLevels: readonly ToolRuntimeComputeLevel[]
  roundingPolicy: {
    minimumBillableMilliseconds: number
    roundingIncrementMilliseconds: number
  }
  computeLevelMultipliersBasisPoints: Record<ToolRuntimeComputeLevel, number>
  qualityMultipliersBasisPoints: Record<ToolRuntimeComputeLevel, number>
  riskBuffersBasisPoints: Record<ToolCostRiskLevel, number>
  provider: Record<string, number>
  runtime: Record<string, number>
  deterministicRenderer: Record<string, number>
  humanManual: {
    supported: false
    hourlyRateMicros: null
    notes: string[]
  }
  notes: string[]
}

export interface ToolCostMeteringRateCardEntry {
  computeLevel: ToolRuntimeComputeLevel
  creditValueCents: number
  serviceFeeIncluded: false
  productEditLevelsAreSeparate: true
  supportedProductEditLevels: readonly string[]
  notes: string[]
}

export interface ToolOwnerCostEventPolicy {
  ownerReportsActualInternalToolCostOnly: true
  serviceFeeIncluded: false
  reeditproServiceFeeOwner: string
  noWalletMutation: true
  noProviderCall: true
  noSettlement: true
  notes: string[]
}
