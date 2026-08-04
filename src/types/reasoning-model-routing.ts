import type {
  ReEditProModelRoleId,
  ReEditProRequestedModelUse,
} from './model-role-routing'

export const REEDITPRO_REASONING_MODEL_ROUTE_IDS = [
  'kimi_k3_primary',
  'gpt_5_6_terra_fallback',
  'deepseek_v4_pro_fallback',
] as const

export type ReEditProActiveReasoningModelRouteId =
  (typeof REEDITPRO_REASONING_MODEL_ROUTE_IDS)[number]

/**
 * Frozen v1 records may still contain this route ID. It is not part of the
 * active head-reasoning chain and must never be selected by the v2 fallback
 * resolver.
 */
export const REEDITPRO_LEGACY_REASONING_MODEL_ROUTE_IDS = [
  'qwen_3_7_fallback',
] as const

export type ReEditProLegacyReasoningModelRouteId =
  (typeof REEDITPRO_LEGACY_REASONING_MODEL_ROUTE_IDS)[number]

export type ReEditProReasoningModelRouteId =
  | ReEditProActiveReasoningModelRouteId
  | ReEditProLegacyReasoningModelRouteId

export type ReEditProReasoningModelProvider =
  | 'moonshot_ai'
  | 'openai'
  | 'alibaba_cloud_model_studio'
  | 'deepseek'

export const REEDITPRO_REASONING_FALLBACK_TRIGGERS = [
  'provider_unavailable',
  'provider_rate_limited',
  'provider_timeout',
  'transient_provider_error',
  'malformed_structured_output',
  'deterministic_quality_validation_failed',
] as const

export type ReEditProReasoningFallbackTrigger =
  (typeof REEDITPRO_REASONING_FALLBACK_TRIGGERS)[number]

export const REEDITPRO_REASONING_NON_FALLBACK_BLOCKERS = [
  'approval_missing',
  'credit_reservation_missing',
  'immutable_snapshot_missing',
  'tenant_authority_missing',
  'safety_policy_blocked',
  'invalid_request',
  'unsupported_model_use',
] as const

export type ReEditProReasoningNonFallbackBlocker =
  (typeof REEDITPRO_REASONING_NON_FALLBACK_BLOCKERS)[number]

export interface ReEditProReasoningModelRouteContract {
  routeId: ReEditProActiveReasoningModelRouteId
  routeRole: 'primary' | 'fallback'
  priority: 1 | 2 | 3
  provider: ReEditProReasoningModelProvider
  modelRoleId: ReEditProModelRoleId
  exactProviderModelId: string
  providerBoundary: string
  contextWindowTokens: number
  exactModelPinned: true
  structuredOutputRequired: true
  approvedUses: ReEditProRequestedModelUse[]
  nextRouteId: ReEditProActiveReasoningModelRouteId | null
  runtimeStatus: 'provider_activation_gated'
}

export interface ReEditProReasoningRouteTransitionInput {
  currentRouteId: ReEditProActiveReasoningModelRouteId
  failureTrigger: ReEditProReasoningFallbackTrigger | ReEditProReasoningNonFallbackBlocker
  approvedPlanSnapshotId: string
  creditReservationId: string
  idempotencyKey: string
  previousAttemptTerminal: boolean
}

export interface ReEditProReasoningRouteResolution {
  ok: boolean
  blocked: boolean
  currentRouteId: ReEditProActiveReasoningModelRouteId
  nextRouteId: ReEditProActiveReasoningModelRouteId | null
  failureTrigger: ReEditProReasoningFallbackTrigger | ReEditProReasoningNonFallbackBlocker
  errors: string[]
  requiresUserReview: boolean
  providerCallMade: false
  customerChargeCreated: false
}
