import type { ReEditProCanonicalEditLevel } from '../../src/types/edit-level'
import type { CreditEstimateLineItemType, CreditUsageCategory, ID, ISODateString, JSONObject } from '../../src/types'

export type ToolRuntimeComputeLevel = 'economy' | 'standard' | 'premium'

export type ToolCostSourceKind =
  | 'external_provider'
  | 'infrastructure_runtime'
  | 'deterministic_renderer'
  | 'human_manual'
  | 'mock_manual_entry'

export type ToolCostRiskLevel = 'low' | 'medium' | 'high'

export type ToolCostFailureCategory =
  | 'none'
  | 'provider_error'
  | 'provider_variance_absorbed'
  | 'reeditpro_error_absorbed'
  | 'user_requested_retry'
  | 'validation_error'
  | 'timeout'
  | 'cancelled'
  | 'unknown'

export type ToolCostUsageCategory =
  | CreditUsageCategory
  | 'transcription'
  | 'media_analysis'
  | 'captions'
  | 'render_export'

export const TOOL_COST_USAGE_CATEGORIES = [
  'basic_edit',
  'pro_edit',
  'signature_edit',
  'premium_signature_edit',
  'stroke_motion',
  'graphic_design',
  'real_motion',
  'soundsync',
  'rendering',
  'revision',
  'admin',
  'other',
  'transcription',
  'media_analysis',
  'captions',
  'render_export',
] as const satisfies readonly ToolCostUsageCategory[]

export const TOOL_COST_SOURCE_KINDS = [
  'external_provider',
  'infrastructure_runtime',
  'deterministic_renderer',
  'human_manual',
  'mock_manual_entry',
] as const satisfies readonly ToolCostSourceKind[]

export const TOOL_COST_RISK_LEVELS = [
  'low',
  'medium',
  'high',
] as const satisfies readonly ToolCostRiskLevel[]

export const TOOL_COST_FAILURE_CATEGORIES = [
  'none',
  'provider_error',
  'provider_variance_absorbed',
  'reeditpro_error_absorbed',
  'user_requested_retry',
  'validation_error',
  'timeout',
  'cancelled',
  'unknown',
] as const satisfies readonly ToolCostFailureCategory[]

export type ToolCostMathErrorCode =
  | 'invalid_cost_input'
  | 'invalid_micros'
  | 'invalid_cents'
  | 'invalid_credits'
  | 'invalid_milliseconds'
  | 'invalid_seconds'
  | 'invalid_count'
  | 'invalid_compute_level'
  | 'unsupported_cost_source'
  | 'secret_like_pricing_snapshot'

export interface ToolCostMathError {
  code: ToolCostMathErrorCode
  message: string
  field: string
  value: unknown
}

export type ToolCostMathResult<TData> =
  | {
      ok: true
      data: TData
    }
  | {
      ok: false
      error: ToolCostMathError
    }

export interface ToolCostPricingSnapshot extends JSONObject {
  mockOnly: true
  rateCardVersion: string
  creditValueCents: 10
  serviceFeeIncluded: false
  sourceKind: ToolCostSourceKind
  provider: string | null
  model: string | null
  computeLevel: ToolRuntimeComputeLevel | null
  riskLevel: ToolCostRiskLevel | null
  pricingUnits: JSONObject
  notes: string[]
}

export interface ToolCostRateCardRoundingPolicy {
  minimumBillableMilliseconds: number
  roundingIncrementMilliseconds: number
}

export interface ToolCostProviderRates {
  perRequestMicros: number
  perInputTokenMicros: number
  perOutputTokenMicros: number
  perInputVideoSecondMicros: number
  perOutputVideoSecondMicros: number
  perInputAudioSecondMicros: number
  perOutputAudioSecondMicros: number
  perImageMicros: number
}

export interface ToolCostRuntimeRates {
  perRenderSecondMicros: number
  perVcpuSecondMicros: number
  perMemoryGibSecondMicros: number
  perGpuSecondMicros: number
  perTempStorageGibHourMicros: number
  perOutputStorageGibHourMicros: number
  perNetworkEgressMibMicros: number
}

export interface ToolCostDeterministicRendererRates {
  flatRequestMicros: number
  perOutputSecondMicros: number
  perMegapixelFrameMicros: number
}

export interface ToolCostHumanManualRates {
  supported: false
  hourlyRateMicros: null
  notes: readonly string[]
}

export interface CanonicalToolCostRateCard {
  rateCardVersion: string
  creditValueCents: 10
  serviceFeeIncluded: false
  productEditLevelsAreSeparate: true
  supportedProductEditLevels: readonly ReEditProCanonicalEditLevel[]
  computeLevels: readonly ToolRuntimeComputeLevel[]
  roundingPolicy: ToolCostRateCardRoundingPolicy
  computeLevelMultipliersBasisPoints: Record<ToolRuntimeComputeLevel, number>
  qualityMultipliersBasisPoints: Record<ToolRuntimeComputeLevel, number>
  riskBuffersBasisPoints: Record<ToolCostRiskLevel, number>
  provider: ToolCostProviderRates
  runtime: ToolCostRuntimeRates
  deterministicRenderer: ToolCostDeterministicRendererRates
  humanManual: ToolCostHumanManualRates
  notes: readonly string[]
}

export interface ExternalProviderCostInput {
  requestCount?: number
  inputTokens?: number
  outputTokens?: number
  inputVideoSeconds?: number
  outputVideoSeconds?: number
  inputAudioSeconds?: number
  outputAudioSeconds?: number
  imageCount?: number
  provider?: string | null
  model?: string | null
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

export interface HumanManualCostInput {
  hours?: number
}

export type CalculateToolActualCostMicrosInput =
  | {
      sourceKind: 'external_provider'
      provider: ExternalProviderCostInput
      computeLevel?: ToolRuntimeComputeLevel
      riskLevel?: ToolCostRiskLevel
    }
  | {
      sourceKind: 'infrastructure_runtime'
      runtime: InfrastructureRuntimeCostInput
      riskLevel?: ToolCostRiskLevel
    }
  | {
      sourceKind: 'deterministic_renderer'
      deterministicRenderer: DeterministicRendererCostInput
      riskLevel?: ToolCostRiskLevel
    }
  | {
      sourceKind: 'human_manual'
      humanManual: HumanManualCostInput
      riskLevel?: ToolCostRiskLevel
    }
  | {
      sourceKind: 'mock_manual_entry'
      actualInternalCostCents: number
      riskLevel?: ToolCostRiskLevel
    }

export interface ToolCostMicrosCalculation {
  actualInternalCostMicros: number
  sourceKind: ToolCostSourceKind
  rateCardVersion: string
  billableMilliseconds?: number
  provider?: string | null
  model?: string | null
  computeLevel?: ToolRuntimeComputeLevel | null
  pricingSnapshot: ToolCostPricingSnapshot
  breakdownMicros: JSONObject
}

export interface ToolCostEstimateInput {
  expectedInternalCostMicros: number
  riskLevel?: ToolCostRiskLevel
  approvedReservationCredits?: number
  sourceKind?: ToolCostSourceKind
  provider?: string | null
  model?: string | null
  computeLevel?: ToolRuntimeComputeLevel | null
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
  pricingSnapshot: ToolCostPricingSnapshot
  canRunWithinApprovedReservation: boolean | null
  serviceFeeIncluded: false
}

export interface MockToolCostEvent {
  id: ID
  workspaceId: ID
  projectId: ID
  creditEstimateId?: ID | null
  creditReservationId?: ID | null
  label: string
  usageCategory: ToolCostUsageCategory
  lineItemType?: CreditEstimateLineItemType | 'media_analysis'
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
  failureCategory: ToolCostFailureCategory
  retryAttempt: number
  idempotencyKey?: string | null
  nonBillableReason?: string
  createdAt: ISODateString
  metadata: JSONObject
}

export interface ToolCostEventAggregation {
  eventCount: number
  billableEventCount: number
  nonBillableEventCount: number
  actualBillableCostCents: number
  actualBillableCostCredits: number
  nonBillableCostCents: number
  nonBillableCredits: number
  billableEventIds: ID[]
  nonBillableEventIds: ID[]
  nonBillableReasons: string[]
  byUsageCategory: Record<string, {
    eventCount: number
    billableEventCount: number
    nonBillableEventCount: number
    actualInternalCostCents: number
    credits: number
    billableCostCents: number
    nonBillableCostCents: number
  }>
}

export interface ToolCostMeteringRateCardEntry {
  computeLevel: ToolRuntimeComputeLevel
  creditValueCents: 10
  serviceFeeIncluded: false
  productEditLevelsAreSeparate: true
  supportedProductEditLevels: readonly ReEditProCanonicalEditLevel[]
  notes: readonly string[]
}

export interface ToolOwnerCostEventPolicy {
  ownerReportsActualInternalToolCostOnly: true
  serviceFeeIncluded: false
  reeditproServiceFeeOwner: 'reeditpro_billing_policy'
  noWalletMutation: true
  noProviderCall: true
  noSettlement: true
  notes: readonly string[]
}
