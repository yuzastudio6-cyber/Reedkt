import {
  REEDITPRO_REASONING_FALLBACK_TRIGGERS,
  REEDITPRO_REASONING_MODEL_ROUTE_IDS,
  type ReEditProActiveReasoningModelRouteId,
  type ReEditProReasoningModelRouteContract,
  type ReEditProReasoningRouteResolution,
  type ReEditProReasoningRouteTransitionInput,
} from '../types/reasoning-model-routing'
import { getReEditProModelRoleContract } from './model-role-routing-contract'

export const REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION =
  'reeditpro-reasoning-model-route-v2-kimi-terra-deepseek'

const approvedReasoningUses = [
  'user_reasoning',
  'edit_planning',
  'creative_edit_strategy',
  'edit_qa_reasoning',
  'tool_code',
  'remotion_draft',
] as const

export const REEDITPRO_REASONING_MODEL_ROUTE_CHAIN: readonly ReEditProReasoningModelRouteContract[] = [
  {
    routeId: 'kimi_k3_primary',
    routeRole: 'primary',
    priority: 1,
    provider: 'moonshot_ai',
    modelRoleId: 'kimi_k3_main_edit_agent',
    exactProviderModelId: 'kimi-k3',
    providerBoundary: 'kimi_k3_provider_boundary',
    contextWindowTokens: 1_000_000,
    exactModelPinned: true,
    structuredOutputRequired: true,
    approvedUses: [...approvedReasoningUses],
    nextRouteId: 'gpt_5_6_terra_fallback',
    runtimeStatus: 'provider_activation_gated',
  },
  {
    routeId: 'gpt_5_6_terra_fallback',
    routeRole: 'fallback',
    priority: 2,
    provider: 'openai',
    modelRoleId: 'gpt_5_6_terra_fallback_edit_agent',
    exactProviderModelId: 'gpt-5.6-terra',
    providerBoundary: 'gpt_5_6_terra_provider_boundary',
    contextWindowTokens: 1_050_000,
    exactModelPinned: true,
    structuredOutputRequired: true,
    approvedUses: [...approvedReasoningUses],
    nextRouteId: 'deepseek_v4_pro_fallback',
    runtimeStatus: 'provider_activation_gated',
  },
  {
    routeId: 'deepseek_v4_pro_fallback',
    routeRole: 'fallback',
    priority: 3,
    provider: 'deepseek',
    modelRoleId: 'deepseek_v4_tool_code_agent',
    exactProviderModelId: 'deepseek-v4-pro',
    providerBoundary: 'deepseek_v4_pro_tool_code_boundary',
    contextWindowTokens: 1_000_000,
    exactModelPinned: true,
    structuredOutputRequired: true,
    approvedUses: [...approvedReasoningUses],
    nextRouteId: null,
    runtimeStatus: 'provider_activation_gated',
  },
] as const

export function listReEditProReasoningModelRoutes(): ReEditProReasoningModelRouteContract[] {
  return REEDITPRO_REASONING_MODEL_ROUTE_CHAIN.map((route) => ({
    ...route,
    approvedUses: [...route.approvedUses],
  }))
}

export function getReEditProReasoningModelRoute(
  routeId: ReEditProActiveReasoningModelRouteId,
): ReEditProReasoningModelRouteContract {
  const route = REEDITPRO_REASONING_MODEL_ROUTE_CHAIN.find((item) => item.routeId === routeId)
  if (!route) throw new Error(`Missing ReEditPro reasoning model route: ${routeId}`)
  return { ...route, approvedUses: [...route.approvedUses] }
}

export function findReEditProReasoningModelRoute(input: {
  modelRoleId?: string | null
  providerBoundary?: string | null
  providerModel?: string | null
}): ReEditProReasoningModelRouteContract | undefined {
  const normalizedValues = [input.modelRoleId, input.providerBoundary, input.providerModel]
    .map(normalize)
    .filter(Boolean)

  const route = REEDITPRO_REASONING_MODEL_ROUTE_CHAIN.find((candidate) =>
    normalizedValues.some((value) =>
      value === normalize(candidate.routeId) ||
      value === normalize(candidate.modelRoleId) ||
      value === normalize(candidate.providerBoundary) ||
      value === normalize(candidate.exactProviderModelId),
    ),
  )

  return route ? { ...route, approvedUses: [...route.approvedUses] } : undefined
}

export function validateReEditProReasoningModelRouteChain(): {
  ok: boolean
  blocked: boolean
  errors: string[]
  checkedRouteCount: number
  providerCallMade: false
} {
  const errors: string[] = []

  if (REEDITPRO_REASONING_MODEL_ROUTE_CHAIN.length !== 3) {
    errors.push('The canonical reasoning route chain must contain exactly three routes.')
  }

  REEDITPRO_REASONING_MODEL_ROUTE_CHAIN.forEach((route, index) => {
    const expectedPriority = index + 1
    const expectedRouteId = REEDITPRO_REASONING_MODEL_ROUTE_IDS[index]
    if (route.priority !== expectedPriority || route.routeId !== expectedRouteId) {
      errors.push(`Reasoning route ${route.routeId} is out of canonical order.`)
    }
    if (route.routeRole === 'primary' && route.priority !== 1) {
      errors.push(`${route.routeId} cannot be primary outside priority 1.`)
    }
    if (route.routeRole === 'fallback' && route.priority === 1) {
      errors.push(`${route.routeId} cannot be a fallback at priority 1.`)
    }
    const expectedNext = REEDITPRO_REASONING_MODEL_ROUTE_CHAIN[index + 1]?.routeId ?? null
    if (route.nextRouteId !== expectedNext) {
      errors.push(`${route.routeId} must advance only to ${expectedNext ?? 'no further model route'}.`)
    }

    const role = getReEditProModelRoleContract(route.modelRoleId)
    if (
      role.canonicalProviderModel !== route.exactProviderModelId ||
      role.providerBoundary !== route.providerBoundary ||
      role.reasoningRoutePriority !== route.priority ||
      role.reasoningRouteRole !== route.routeRole
    ) {
      errors.push(`${route.routeId} conflicts with the canonical model-role contract.`)
    }
    if (
      !role.userReasoningAllowed || !role.editPlanningAllowed ||
      !role.creativeStrategyAllowed || !role.editQaReasoningAllowed ||
      !role.toolCodeAllowed || !role.remotionDraftAllowed || role.visualUnderstandingAllowed
    ) {
      errors.push(`${route.routeId} does not preserve the required reasoning/coding capability boundary.`)
    }
  })

  return {
    ok: errors.length === 0,
    blocked: errors.length > 0,
    errors,
    checkedRouteCount: REEDITPRO_REASONING_MODEL_ROUTE_CHAIN.length,
    providerCallMade: false,
  }
}

export function resolveReEditProReasoningFallback(
  input: ReEditProReasoningRouteTransitionInput,
): ReEditProReasoningRouteResolution {
  const current = getReEditProReasoningModelRoute(input.currentRouteId)
  const errors: string[] = []
  const allowedTrigger = REEDITPRO_REASONING_FALLBACK_TRIGGERS.includes(
    input.failureTrigger as (typeof REEDITPRO_REASONING_FALLBACK_TRIGGERS)[number],
  )

  if (!input.approvedPlanSnapshotId.trim()) errors.push('Fallback requires the exact approved plan snapshot.')
  if (!input.creditReservationId.trim()) errors.push('Fallback requires the existing edit credit reservation.')
  if (!input.idempotencyKey.trim()) errors.push('Fallback requires a stable idempotency key.')
  if (!input.previousAttemptTerminal) errors.push('Fallback cannot start before the previous attempt is terminal.')
  if (!allowedTrigger) errors.push(`Failure ${input.failureTrigger} must block instead of selecting another model.`)
  if (!current.nextRouteId) errors.push('The final reasoning fallback failed; deterministic recovery or user review is required.')

  return {
    ok: errors.length === 0,
    blocked: errors.length > 0,
    currentRouteId: current.routeId,
    nextRouteId: errors.length === 0 ? current.nextRouteId : null,
    failureTrigger: input.failureTrigger,
    errors,
    requiresUserReview: !current.nextRouteId,
    providerCallMade: false,
    customerChargeCreated: false,
  }
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}
