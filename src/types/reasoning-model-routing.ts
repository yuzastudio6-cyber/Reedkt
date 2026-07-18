import type {
  ReEditProModelRoleId,
  ReEditProRequestedModelUse,
} from './model-role-routing'

export const REEDITPRO_REASONING_MODEL_ROUTE_IDS = [
  'kimi_k3_primary',
  'qwen_3_7_fallback',
  'deepseek_v4_pro_fallback',
] as const

export type ReEditProReasoningModelRouteId =
  (typeof REEDITPRO_REASONING_MODEL_ROUTE_IDS)[number]

export type ReEditProReasoningModelProvider =
  | 'moonshot_ai'
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
  routeId: ReEditProReasoningModelRouteId
  routeRole: 'primary' | 'fallback'
  priority: 1 | 2 | 3
  provider: ReEditProReasoningModelProvider
  modelRoleId: ReEditProModelRoleId
  exactProviderModelId: string
  providerBoundary: string
  contextWindowTokens: 1_000_000
  exactModelPinned: true
  structuredOutputRequired: true
  approvedUses: ReEditProRequestedModelUse[]
  nextRouteId: ReEditProReasoningModelRouteId | null
  runtimeStatus: 'provider_activation_gated'
}

export interface ReEditProReasoningRouteTransitionInput {
  currentRouteId: ReEditProReasoningModelRouteId
  failureTrigger: ReEditProReasoningFallbackTrigger | ReEditProReasoningNonFallbackBlocker
  approvedPlanSnapshotId: string
  creditReservationId: string
  idempotencyKey: string
  previousAttemptTerminal: boolean
}

export interface ReEditProReasoningRouteResolution {
  ok: boolean
  blocked: boolean
  currentRouteId: ReEditProReasoningModelRouteId
  nextRouteId: ReEditProReasoningModelRouteId | null
  failureTrigger: ReEditProReasoningFallbackTrigger | ReEditProReasoningNonFallbackBlocker
  errors: string[]
  requiresUserReview: boolean
  providerCallMade: false
  customerChargeCreated: false
}
