import { createHash } from 'node:crypto'

export const EDIT_REFERENCE_REASONING_ROUTE_AUTHORIZATION_VERSION =
  'edit-reference-reasoning-route-authorization-v1' as const

export const REEDITPRO_SHARED_REASONING_ROUTE_CONTRACT_VERSION =
  'reeditpro-reasoning-model-route-v1-kimi-qwen-deepseek' as const

export const EDIT_REFERENCE_REASONING_LANES = [
  'study_chat',
  'preference_dna',
  'story_editorial',
  'speech_pacing',
  'long_form_semantic_synthesis',
] as const

export type EditReferenceReasoningLane = typeof EDIT_REFERENCE_REASONING_LANES[number]

export const EDIT_REFERENCE_REASONING_ROUTE_IDS = [
  'kimi_k3_primary',
  'qwen_3_7_fallback',
  'deepseek_v4_pro_fallback',
] as const

export type EditReferenceReasoningRouteId = typeof EDIT_REFERENCE_REASONING_ROUTE_IDS[number]

export const EDIT_REFERENCE_REASONING_FALLBACK_TRIGGERS = [
  'provider_unavailable',
  'provider_rate_limited',
  'provider_timeout',
  'transient_provider_error',
  'malformed_structured_output',
  'deterministic_quality_validation_failed',
] as const

export type EditReferenceReasoningFallbackTrigger =
  typeof EDIT_REFERENCE_REASONING_FALLBACK_TRIGGERS[number]

export interface EditReferenceReasoningCostAuthority {
  readonly executionScope: 'controlled_test' | 'production'
  readonly approvedUsageEstimateId: string | null
  readonly internalCostBudgetId: string | null
  readonly immutableRateCardSnapshotId: string | null
  readonly maximumAuthorizedInternalCostMicros: string | null
}

export type EditReferenceReasoningRouteAuthorizationResolver<
  TRequest extends EditReferenceReasoningCostAuthority,
> = (
  request: TRequest,
) => Promise<EditReferenceReasoningRouteAuthorization | null | undefined>

export type EditReferenceReasoningRouteProviderResolver<TProvider> = (
  authorization: EditReferenceReasoningRouteAuthorization,
) => TProvider | null | undefined | Promise<TProvider | null | undefined>

export async function resolveEditReferenceReasoningRouteAuthorizationFailClosed<
  TRequest extends EditReferenceReasoningCostAuthority,
>(input: {
  readonly resolver: EditReferenceReasoningRouteAuthorizationResolver<TRequest> | null | undefined
  readonly request: TRequest
}): Promise<EditReferenceReasoningRouteAuthorization | undefined> {
  if (!input.resolver) return undefined
  try {
    return await input.resolver(input.request) ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Resolves a lane-specific provider supplied by the shared backend route.
 *
 * This feature-side helper never creates route authority or provider clients.
 * Kimi and DeepSeek therefore remain unavailable unless the shared backend
 * explicitly supplies the exact authorized provider. The legacy Qwen provider
 * may be used only for an already-authorized Qwen fallback attempt.
 */
export async function resolveEditReferenceReasoningRouteProviderFailClosed<TProvider>(input: {
  readonly authorization: EditReferenceReasoningRouteAuthorization | null | undefined
  readonly resolver: EditReferenceReasoningRouteProviderResolver<TProvider> | null | undefined
  readonly qwenFallbackProvider?: TProvider | null
}): Promise<TProvider | undefined> {
  if (!input.authorization) return undefined
  if (input.resolver) {
    try {
      const provider = await input.resolver(input.authorization)
      if (provider) return provider
    } catch {
      return undefined
    }
  }
  return input.authorization.routeId === 'qwen_3_7_fallback'
    ? input.qwenFallbackProvider ?? undefined
    : undefined
}

export function getEditReferenceReasoningRouteDisplayName(
  routeId: EditReferenceReasoningRouteId,
): string {
  if (routeId === 'kimi_k3_primary') return 'Kimi K3 primary'
  if (routeId === 'qwen_3_7_fallback') return 'Qwen 3.7 fallback'
  return 'DeepSeek V4 Pro final fallback'
}

export function getEditReferenceReasoningRouteRetryReason(
  routeId: EditReferenceReasoningRouteId,
): string {
  if (routeId === 'kimi_k3_primary') {
    return 'Retry after the shared backend issues exact Kimi primary route and internal-cost authority.'
  }
  if (routeId === 'qwen_3_7_fallback') {
    return 'Retry only after Kimi reaches an allowed terminal failure and shared Qwen fallback authority is issued.'
  }
  return 'Retry only after Qwen reaches an allowed terminal failure and shared final-fallback authority is issued.'
}

/**
 * Feature-side consumption envelope for the backend-owned reasoning route.
 *
 * Edit Reference validates this envelope but does not mint production route
 * authority. A future shared backend coordinator must issue it after binding
 * the exact request, route attempt, internal-cost budget, and immediately
 * preceding terminal attempt. Qwen2.5-VL is intentionally absent because it
 * remains a visual specialist rather than a reasoning fallback.
 */
export interface EditReferenceReasoningRouteAuthorization {
  readonly schemaVersion: typeof EDIT_REFERENCE_REASONING_ROUTE_AUTHORIZATION_VERSION
  readonly sourceAuthority: 'shared_backend_reasoning_route'
  readonly canonicalRouteContractVersion: typeof REEDITPRO_SHARED_REASONING_ROUTE_CONTRACT_VERSION
  readonly lane: EditReferenceReasoningLane
  readonly reasoningRunId: string
  readonly attemptId: string
  readonly routeId: EditReferenceReasoningRouteId
  readonly routeRole: 'primary' | 'fallback'
  readonly routePriority: 1 | 2 | 3
  readonly provider: 'moonshot_ai' | 'alibaba_cloud_model_studio' | 'deepseek'
  readonly exactProviderModelId: 'kimi-k3' | 'qwen3.7-max-2026-06-08' | 'deepseek-v4-pro'
  readonly providerBoundary:
    | 'kimi_k3_provider_boundary'
    | 'qwen_3_7_provider_boundary'
    | 'deepseek_v4_pro_tool_code_boundary'
  readonly requestDigestSha256: string
  readonly previousRouteId: EditReferenceReasoningRouteId | null
  readonly previousAttemptTerminal: boolean
  readonly fallbackTrigger: EditReferenceReasoningFallbackTrigger | null
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly immutableRateCardSnapshotId: string
  readonly maximumAuthorizedInternalCostMicros: string
  readonly idempotencyKeyDigestSha256: string
  readonly authorizedAt: string
  readonly providerCallAuthorized: true
  readonly qwenVisualSpecialistSubstituted: false
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly authorizationDigestSha256: string
}

export interface EditReferenceReasoningRouteAuthorizationValidation {
  readonly ok: boolean
  readonly blocked: boolean
  readonly providerCallAllowed: boolean
  readonly errors: readonly string[]
  readonly routeId: EditReferenceReasoningRouteId | null
  readonly routeRole: 'primary' | 'fallback' | null
  readonly productionAuthorityVerified: boolean
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
}

type AuthorizationWithoutDigest = Omit<
  EditReferenceReasoningRouteAuthorization,
  'authorizationDigestSha256'
>

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/

const ROUTE_METADATA: Readonly<Record<EditReferenceReasoningRouteId, {
  readonly routeRole: 'primary' | 'fallback'
  readonly routePriority: 1 | 2 | 3
  readonly provider: EditReferenceReasoningRouteAuthorization['provider']
  readonly exactProviderModelId: EditReferenceReasoningRouteAuthorization['exactProviderModelId']
  readonly providerBoundary: EditReferenceReasoningRouteAuthorization['providerBoundary']
  readonly previousRouteId: EditReferenceReasoningRouteId | null
}>> = {
  kimi_k3_primary: {
    routeRole: 'primary',
    routePriority: 1,
    provider: 'moonshot_ai',
    exactProviderModelId: 'kimi-k3',
    providerBoundary: 'kimi_k3_provider_boundary',
    previousRouteId: null,
  },
  qwen_3_7_fallback: {
    routeRole: 'fallback',
    routePriority: 2,
    provider: 'alibaba_cloud_model_studio',
    exactProviderModelId: 'qwen3.7-max-2026-06-08',
    providerBoundary: 'qwen_3_7_provider_boundary',
    previousRouteId: 'kimi_k3_primary',
  },
  deepseek_v4_pro_fallback: {
    routeRole: 'fallback',
    routePriority: 3,
    provider: 'deepseek',
    exactProviderModelId: 'deepseek-v4-pro',
    providerBoundary: 'deepseek_v4_pro_tool_code_boundary',
    previousRouteId: 'qwen_3_7_fallback',
  },
}

export function hashEditReferenceReasoningRouteAuthorization(
  authorization: AuthorizationWithoutDigest,
): string {
  return createHash('sha256').update(JSON.stringify({
    schemaVersion: authorization.schemaVersion,
    sourceAuthority: authorization.sourceAuthority,
    canonicalRouteContractVersion: authorization.canonicalRouteContractVersion,
    lane: authorization.lane,
    reasoningRunId: authorization.reasoningRunId,
    attemptId: authorization.attemptId,
    routeId: authorization.routeId,
    routeRole: authorization.routeRole,
    routePriority: authorization.routePriority,
    provider: authorization.provider,
    exactProviderModelId: authorization.exactProviderModelId,
    providerBoundary: authorization.providerBoundary,
    requestDigestSha256: authorization.requestDigestSha256,
    previousRouteId: authorization.previousRouteId,
    previousAttemptTerminal: authorization.previousAttemptTerminal,
    fallbackTrigger: authorization.fallbackTrigger,
    approvedUsageEstimateId: authorization.approvedUsageEstimateId,
    internalCostBudgetId: authorization.internalCostBudgetId,
    immutableRateCardSnapshotId: authorization.immutableRateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: authorization.maximumAuthorizedInternalCostMicros,
    idempotencyKeyDigestSha256: authorization.idempotencyKeyDigestSha256,
    authorizedAt: authorization.authorizedAt,
    providerCallAuthorized: authorization.providerCallAuthorized,
    qwenVisualSpecialistSubstituted: authorization.qwenVisualSpecialistSubstituted,
    customerPriceCalculated: authorization.customerPriceCalculated,
    customerCreditsMutated: authorization.customerCreditsMutated,
    serviceFeeIncluded: authorization.serviceFeeIncluded,
  })).digest('hex')
}

export function validateEditReferenceReasoningRouteAuthorization(input: {
  readonly authorization: EditReferenceReasoningRouteAuthorization | null | undefined
  readonly expectedLane: EditReferenceReasoningLane
  readonly expectedRouteId: EditReferenceReasoningRouteId
  readonly requestDigestSha256: string
  readonly costAuthority: EditReferenceReasoningCostAuthority
}): EditReferenceReasoningRouteAuthorizationValidation {
  const errors: string[] = []
  const { authorization } = input

  if (!authorization) {
    errors.push('The shared backend reasoning-route authorization is unavailable.')
    return validation(errors, null, null, false)
  }

  const keys = Object.keys(authorization).sort()
  const expectedKeys = [
    'schemaVersion', 'sourceAuthority', 'canonicalRouteContractVersion', 'lane',
    'reasoningRunId', 'attemptId', 'routeId', 'routeRole', 'routePriority', 'provider',
    'exactProviderModelId', 'providerBoundary', 'requestDigestSha256', 'previousRouteId',
    'previousAttemptTerminal', 'fallbackTrigger', 'approvedUsageEstimateId',
    'internalCostBudgetId', 'immutableRateCardSnapshotId', 'maximumAuthorizedInternalCostMicros',
    'idempotencyKeyDigestSha256', 'authorizedAt', 'providerCallAuthorized',
    'qwenVisualSpecialistSubstituted', 'customerPriceCalculated',
    'customerCreditsMutated', 'serviceFeeIncluded', 'authorizationDigestSha256',
  ].sort()
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    errors.push('The reasoning-route authorization has unexpected or missing fields.')
  }
  if (authorization.schemaVersion !== EDIT_REFERENCE_REASONING_ROUTE_AUTHORIZATION_VERSION) {
    errors.push('The Edit Reference reasoning-route authorization version is unsupported.')
  }
  if (authorization.sourceAuthority !== 'shared_backend_reasoning_route') {
    errors.push('Only the shared backend reasoning route may authorize a provider attempt.')
  }
  if (authorization.canonicalRouteContractVersion !== REEDITPRO_SHARED_REASONING_ROUTE_CONTRACT_VERSION) {
    errors.push('The shared reasoning-route contract version does not match the reviewed Kimi-primary policy.')
  }
  if (authorization.lane !== input.expectedLane) {
    errors.push(`Reasoning-route lane ${authorization.lane} does not match ${input.expectedLane}.`)
  }
  if (authorization.routeId !== input.expectedRouteId) {
    errors.push(`Reasoning route ${authorization.routeId} cannot execute where ${input.expectedRouteId} is required.`)
  }
  if (!ID_PATTERN.test(authorization.reasoningRunId) || !ID_PATTERN.test(authorization.attemptId)) {
    errors.push('The reasoning run or attempt identity is invalid.')
  }
  if (!SHA256_PATTERN.test(input.requestDigestSha256) || authorization.requestDigestSha256 !== input.requestDigestSha256) {
    errors.push('The reasoning-route authorization is not bound to the exact request digest.')
  }
  if (!SHA256_PATTERN.test(authorization.idempotencyKeyDigestSha256)) {
    errors.push('The reasoning-route authorization lacks a valid idempotency digest.')
  }
  if (!Number.isFinite(Date.parse(authorization.authorizedAt))) {
    errors.push('The reasoning-route authorization timestamp is invalid.')
  }

  const metadata = ROUTE_METADATA[authorization.routeId]
  if (
    authorization.routeRole !== metadata.routeRole
    || authorization.routePriority !== metadata.routePriority
    || authorization.provider !== metadata.provider
    || authorization.exactProviderModelId !== metadata.exactProviderModelId
    || authorization.providerBoundary !== metadata.providerBoundary
    || authorization.previousRouteId !== metadata.previousRouteId
  ) errors.push('The reasoning-route authorization conflicts with the canonical route metadata.')

  if (authorization.routeRole === 'primary') {
    if (
      authorization.previousRouteId !== null
      || authorization.previousAttemptTerminal
      || authorization.fallbackTrigger !== null
    ) errors.push('The Kimi primary route cannot claim a preceding fallback attempt.')
  } else if (
    !authorization.previousAttemptTerminal
    || authorization.fallbackTrigger === null
    || !EDIT_REFERENCE_REASONING_FALLBACK_TRIGGERS.includes(authorization.fallbackTrigger)
  ) errors.push('A reasoning fallback requires one allowed failure from the immediately preceding terminal route.')

  if (input.costAuthority.executionScope !== 'production') {
    errors.push('A live reasoning route requires production-scoped internal-cost authority.')
  }
  for (const [field, value] of Object.entries({
    approvedUsageEstimateId: input.costAuthority.approvedUsageEstimateId,
    internalCostBudgetId: input.costAuthority.internalCostBudgetId,
    immutableRateCardSnapshotId: input.costAuthority.immutableRateCardSnapshotId,
  })) {
    if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
      errors.push(`Live reasoning route ${field} is invalid.`)
    } else if (authorization[field as keyof Pick<
      EditReferenceReasoningRouteAuthorization,
      'approvedUsageEstimateId' | 'internalCostBudgetId' | 'immutableRateCardSnapshotId'
    >] !== value) {
      errors.push(`The reasoning-route authorization does not match ${field}.`)
    }
  }
  const maximumAuthorizedInternalCostMicros = input.costAuthority.maximumAuthorizedInternalCostMicros
  if (
    typeof maximumAuthorizedInternalCostMicros !== 'string'
    || !MONEY_MICROS_PATTERN.test(maximumAuthorizedInternalCostMicros)
    || BigInt(maximumAuthorizedInternalCostMicros) <= 0n
    || authorization.maximumAuthorizedInternalCostMicros !== maximumAuthorizedInternalCostMicros
  ) errors.push('The reasoning-route authorization does not match a positive internal-cost ceiling.')

  if (
    authorization.providerCallAuthorized !== true
    || authorization.qwenVisualSpecialistSubstituted !== false
    || authorization.customerPriceCalculated !== false
    || authorization.customerCreditsMutated !== false
    || authorization.serviceFeeIncluded !== false
  ) errors.push('The reasoning-route authorization crosses a forbidden visual or commercial boundary.')

  if (
    !SHA256_PATTERN.test(authorization.authorizationDigestSha256)
    || authorization.authorizationDigestSha256 !== hashEditReferenceReasoningRouteAuthorization(
      authorization,
    )
  ) errors.push('The reasoning-route authorization digest is invalid.')

  return validation(errors, authorization.routeId, authorization.routeRole, errors.length === 0)
}

function validation(
  errors: readonly string[],
  routeId: EditReferenceReasoningRouteId | null,
  routeRole: 'primary' | 'fallback' | null,
  productionAuthorityVerified: boolean,
): EditReferenceReasoningRouteAuthorizationValidation {
  return {
    ok: errors.length === 0,
    blocked: errors.length > 0,
    providerCallAllowed: errors.length === 0,
    errors: [...errors],
    routeId,
    routeRole,
    productionAuthorityVerified,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
  }
}
