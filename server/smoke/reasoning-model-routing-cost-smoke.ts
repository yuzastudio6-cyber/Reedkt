import assert from 'node:assert/strict'

import {
  getProviderSecretReference,
} from '../../src/backend/providers/gateway/provider-secret-boundary'
import {
  validateProviderGatewayRequest,
  type ProviderGatewayRequest,
} from '../../src/backend/cloud/provider-gateway-contracts'
import {
  getReEditProModelRoleContract,
  validateReEditProModelRoleContracts,
} from '../../src/lib/model-role-routing-contract'
import {
  findReEditProReasoningModelRoute,
  listReEditProReasoningModelRoutes,
  resolveReEditProReasoningFallback,
  validateReEditProReasoningModelRouteChain,
} from '../../src/lib/reasoning-model-routing-contract'
import {
  aggregateReasoningModelAttemptCosts,
  calculateReasoningModelInternalCost,
  createReasoningModelAttemptCostEvidence,
  REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
  type ReasoningModelTokenUsage,
} from '../reasoning-model-cost'

const routeChain = listReEditProReasoningModelRoutes()
assert.deepEqual(routeChain.map((route) => route.routeId), [
  'kimi_k3_primary',
  'gpt_5_6_terra_fallback',
  'deepseek_v4_pro_fallback',
])
assert.deepEqual(routeChain.map((route) => route.exactProviderModelId), [
  'kimi-k3',
  'gpt-5.6-terra',
  'deepseek-v4-pro',
])
assert.equal(validateReEditProReasoningModelRouteChain().ok, true)
assert.equal(validateReEditProModelRoleContracts().ok, true)

const kimi = getReEditProModelRoleContract('kimi_k3_main_edit_agent')
const terra = getReEditProModelRoleContract(
  'gpt_5_6_terra_fallback_edit_agent',
)
const qwen = getReEditProModelRoleContract('qwen_3_7_main_edit_agent')
const deepseek = getReEditProModelRoleContract('deepseek_v4_tool_code_agent')
assert.equal(kimi.reasoningRouteRole, 'primary')
assert.equal(kimi.reasoningRoutePriority, 1)
assert.equal(kimi.toolCodeAllowed, true)
assert.equal(terra.reasoningRouteRole, 'fallback')
assert.equal(terra.reasoningRoutePriority, 2)
assert.equal(terra.canonicalProviderModel, 'gpt-5.6-terra')
assert.equal(qwen.reasoningRouteRole, 'specialist')
assert.equal(qwen.reasoningRoutePriority, null)
assert.equal(qwen.canonicalProviderModel, 'qwen3.7-max-2026-06-08')
assert.equal(qwen.editPlanningAllowed, false)
assert.equal(deepseek.reasoningRouteRole, 'fallback')
assert.equal(deepseek.reasoningRoutePriority, 3)
assert.equal(deepseek.userReasoningAllowed, true)

assert.equal(
  findReEditProReasoningModelRoute({ providerModel: 'kimi-k3' })?.routeId,
  'kimi_k3_primary',
)
assert.equal(
  findReEditProReasoningModelRoute({
    providerBoundary: 'gpt_5_6_terra_provider_boundary',
  })?.routeId,
  'gpt_5_6_terra_fallback',
)

const terraTransition = resolveReEditProReasoningFallback({
  currentRouteId: 'kimi_k3_primary',
  failureTrigger: 'provider_timeout',
  approvedPlanSnapshotId: 'snapshot-routing-cost-smoke',
  creditReservationId: 'reservation-routing-cost-smoke',
  idempotencyKey: 'reasoning-routing-cost-smoke',
  previousAttemptTerminal: true,
})
assert.equal(terraTransition.ok, true)
assert.equal(terraTransition.nextRouteId, 'gpt_5_6_terra_fallback')
assert.equal(terraTransition.providerCallMade, false)
assert.equal(terraTransition.customerChargeCreated, false)

const blockedSafetyFallback = resolveReEditProReasoningFallback({
  currentRouteId: 'kimi_k3_primary',
  failureTrigger: 'safety_policy_blocked',
  approvedPlanSnapshotId: 'snapshot-routing-cost-smoke',
  creditReservationId: 'reservation-routing-cost-smoke',
  idempotencyKey: 'reasoning-routing-cost-smoke',
  previousAttemptTerminal: true,
})
assert.equal(blockedSafetyFallback.blocked, true)
assert.equal(blockedSafetyFallback.nextRouteId, null)

const finalFallbackExhausted = resolveReEditProReasoningFallback({
  currentRouteId: 'deepseek_v4_pro_fallback',
  failureTrigger: 'provider_unavailable',
  approvedPlanSnapshotId: 'snapshot-routing-cost-smoke',
  creditReservationId: 'reservation-routing-cost-smoke',
  idempotencyKey: 'reasoning-routing-cost-smoke',
  previousAttemptTerminal: true,
})
assert.equal(finalFallbackExhausted.blocked, true)
assert.equal(finalFallbackExhausted.requiresUserReview, true)

const baseRequest: Omit<ProviderGatewayRequest, 'providerRoute' | 'providerModel' | 'modelRoleId' | 'safetyConstraints'> = {
  generationRequestId: 'generation-routing-cost-smoke',
  jobId: 'job-routing-cost-smoke',
  workspaceId: 'workspace-routing-cost-smoke',
  projectId: 'project-routing-cost-smoke',
  approvedPlanSnapshotId: 'snapshot-routing-cost-smoke',
  editPlanId: 'plan-routing-cost-smoke',
  creditReservationId: 'reservation-routing-cost-smoke',
  requestedModelUse: 'edit_planning',
  signatureSystem: 'reasoning_model_routing_cost_smoke',
  generationType: 'none',
  qualityLevel: 'draft',
  modelTier: 'premium',
  inputAssetIds: [],
  outputRequirements: { outputAssetType: 'structured_edit_plan' },
  idempotencyKey: 'gateway-routing-cost-smoke',
}

assert.equal(validateProviderGatewayRequest({
  ...baseRequest,
  providerRoute: 'kimi_k3_provider_boundary',
  providerModel: 'kimi-k3',
  modelRoleId: 'kimi_k3_main_edit_agent',
  safetyConstraints: { routeRole: 'primary' },
}).ok, true)
assert.equal(validateProviderGatewayRequest({
  ...baseRequest,
  providerRoute: 'gpt_5_6_terra_provider_boundary',
  providerModel: 'gpt-5.6-terra',
  modelRoleId: 'gpt_5_6_terra_fallback_edit_agent',
  safetyConstraints: { routeRole: 'primary' },
}).ok, false)
assert.equal(validateProviderGatewayRequest({
  ...baseRequest,
  providerRoute: 'gpt_5_6_terra_provider_boundary',
  providerModel: 'gpt-5.6-terra',
  modelRoleId: 'gpt_5_6_terra_fallback_edit_agent',
  safetyConstraints: {} as ProviderGatewayRequest['safetyConstraints'],
}).ok, false)
assert.equal(validateProviderGatewayRequest({
  ...baseRequest,
  providerRoute: 'gpt_5_6_terra_provider_boundary',
  providerModel: 'gpt-5.6-terra',
  modelRoleId: 'gpt_5_6_terra_fallback_edit_agent',
  safetyConstraints: { routeRole: 'fallback' },
}).ok, true)
assert.equal(validateProviderGatewayRequest({
  ...baseRequest,
  providerRoute: 'qwen_3_7_provider_boundary',
  providerModel: 'qwen3.7-max-2026-06-08',
  modelRoleId: 'qwen_3_7_main_edit_agent',
  safetyConstraints: { routeRole: 'fallback' },
}).ok, false)
assert.equal(validateProviderGatewayRequest({
  ...baseRequest,
  providerRoute: 'deepseek_v4_pro_tool_code_boundary',
  providerModel: 'deepseek-v4-pro',
  modelRoleId: 'deepseek_v4_tool_code_agent',
  safetyConstraints: { routeRole: 'fallback' },
}).ok, true)
assert.equal(
  getProviderSecretReference('kimi_k3_provider_boundary')?.secretName,
  'reeditpro-prod-kimi-api-key',
)
assert.equal(
  getProviderSecretReference('gpt_5_6_terra_provider_boundary')?.secretName,
  'reeditpro-prod-openai-api-key',
)

const nativeCacheUsage: ReasoningModelTokenUsage = {
  uncachedInputTokens: 100_000,
  cachedInputTokens: 50_000,
  cacheCreationInputTokens: 0,
  outputTokens: 10_000,
  cacheBillingMode: 'provider_native',
}
const kimiCost = calculateReasoningModelInternalCost({
  routeId: 'kimi_k3_primary',
  usage: nativeCacheUsage,
})
if (!kimiCost.ok) throw new Error(kimiCost.error.message)
assert.equal(kimiCost.data.nativeCurrency, 'USD')
assert.equal(kimiCost.data.nativeCostMicros, 465_000)
assert.equal(kimiCost.data.normalizedUsdCostMicros, 465_000)
assert.equal(kimiCost.data.customerPriceIncluded, false)
assert.equal(kimiCost.data.customerCreditsIncluded, false)
assert.equal(kimiCost.data.serviceFeeIncluded, false)

const deepseekCost = calculateReasoningModelInternalCost({
  routeId: 'deepseek_v4_pro_fallback',
  usage: nativeCacheUsage,
})
if (!deepseekCost.ok) throw new Error(deepseekCost.error.message)
assert.equal(deepseekCost.data.nativeCostMicros, 52_382)

const terraUsage: ReasoningModelTokenUsage = {
  uncachedInputTokens: 100_000,
  cachedInputTokens: 50_000,
  cacheCreationInputTokens: 0,
  outputTokens: 10_000,
  cacheBillingMode: 'provider_native',
}
const terraCost = calculateReasoningModelInternalCost({
  routeId: 'gpt_5_6_terra_fallback',
  usage: terraUsage,
})
if (!terraCost.ok) throw new Error(terraCost.error.message)
assert.equal(terraCost.data.nativeCurrency, 'USD')
assert.equal(terraCost.data.nativeCostMicros, 412_500)
assert.equal(terraCost.data.normalizedUsdCostMicros, 412_500)
assert.equal(terraCost.data.normalization, 'native_usd')
assert.equal(terraCost.data.pricingClass, 'standard')

const terraLongContextCost = calculateReasoningModelInternalCost({
  routeId: 'gpt_5_6_terra_fallback',
  usage: {
    uncachedInputTokens: 280_000,
    cachedInputTokens: 20_000,
    cacheCreationInputTokens: 10_000,
    outputTokens: 20_000,
    cacheBillingMode: 'provider_native',
  },
})
if (!terraLongContextCost.ok) {
  throw new Error(terraLongContextCost.error.message)
}
assert.equal(terraLongContextCost.data.pricingClass, 'long_context')
assert.equal(terraLongContextCost.data.nativeCostMicros, 1_922_500)
assert.equal(calculateReasoningModelInternalCost({
  routeId: 'kimi_k3_primary',
  usage: { ...nativeCacheUsage, outputTokens: 900_001 },
}).ok, false)

const primaryAttempt = createReasoningModelAttemptCostEvidence({
  reasoningRunId: 'reasoning-run-routing-cost-smoke',
  attemptId: 'attempt-kimi-routing-smoke',
  attemptOrdinal: 1,
  routeId: 'kimi_k3_primary',
  approvedPlanSnapshotId: 'snapshot-routing-cost-smoke',
  creditReservationId: 'reservation-routing-cost-smoke',
  idempotencyKey: 'reasoning-routing-cost-smoke:1',
  requestPayloadHash: 'a'.repeat(64),
  responseUsageHash: 'b'.repeat(64),
  outcome: 'failed',
  failureTrigger: null,
  usage: nativeCacheUsage,
  recordedAt: '2026-07-18T12:00:00.000Z',
})
if (!primaryAttempt.ok) throw new Error(primaryAttempt.error.message)

const fallbackAttempt = createReasoningModelAttemptCostEvidence({
  reasoningRunId: 'reasoning-run-routing-cost-smoke',
  attemptId: 'attempt-terra-routing-smoke',
  attemptOrdinal: 2,
  routeId: 'gpt_5_6_terra_fallback',
  approvedPlanSnapshotId: 'snapshot-routing-cost-smoke',
  creditReservationId: 'reservation-routing-cost-smoke',
  idempotencyKey: 'reasoning-routing-cost-smoke:2',
  requestPayloadHash: 'c'.repeat(64),
  responseUsageHash: 'd'.repeat(64),
  outcome: 'completed',
  failureTrigger: 'provider_timeout',
  usage: terraUsage,
  recordedAt: '2026-07-18T12:01:00.000Z',
})
if (!fallbackAttempt.ok) throw new Error(fallbackAttempt.error.message)

const aggregate = aggregateReasoningModelAttemptCosts([
  primaryAttempt.data,
  fallbackAttempt.data,
])
if (!aggregate.ok) throw new Error(aggregate.error.message)
assert.equal(aggregate.data.attemptCount, 2)
assert.equal(aggregate.data.reasoningRunId, 'reasoning-run-routing-cost-smoke')
assert.deepEqual(aggregate.data.routeIds, [
  'kimi_k3_primary',
  'gpt_5_6_terra_fallback',
])
assert.equal(aggregate.data.failedAttemptCount, 1)
assert.equal(aggregate.data.completedAttemptCount, 1)
assert.equal(
  aggregate.data.nativeCostMicrosByCurrency.USD,
  877_500,
)
assert.equal(aggregate.data.normalizedUsdCostMicros, 877_500)
assert.equal(aggregate.data.customerChargeCreated, false)

assert.equal(aggregateReasoningModelAttemptCosts([
  primaryAttempt.data,
  {
    ...fallbackAttempt.data,
    approvedPlanSnapshotId: 'different-snapshot',
  },
]).ok, false)
assert.equal(aggregateReasoningModelAttemptCosts([fallbackAttempt.data]).ok, false)
assert.equal(aggregateReasoningModelAttemptCosts([{
  ...primaryAttempt.data,
  evidenceHash: '0'.repeat(64),
}]).ok, false)

assert.equal(createReasoningModelAttemptCostEvidence({
  reasoningRunId: 'reasoning-run-routing-cost-smoke',
  attemptId: 'attempt-invalid-order',
  attemptOrdinal: 1,
  routeId: 'gpt_5_6_terra_fallback',
  approvedPlanSnapshotId: 'snapshot-routing-cost-smoke',
  creditReservationId: 'reservation-routing-cost-smoke',
  idempotencyKey: 'reasoning-routing-cost-smoke:invalid',
  requestPayloadHash: 'e'.repeat(64),
  responseUsageHash: 'f'.repeat(64),
  outcome: 'failed',
  failureTrigger: 'provider_timeout',
  usage: terraUsage,
  recordedAt: '2026-07-18T12:02:00.000Z',
}).ok, false)

console.log(JSON.stringify({
  smoke: 'reasoning-model-routing-cost',
  status: 'passed',
  routeOrder: routeChain.map((route) => route.routeId),
  exactModels: routeChain.map((route) => route.exactProviderModelId),
  rateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
  kimiInternalUsdMicros: kimiCost.data.nativeCostMicros,
  terraInternalUsdMicros: terraCost.data.nativeCostMicros,
  terraLongContextUsdMicros:
    terraLongContextCost.data.nativeCostMicros,
  deepseekInternalUsdMicros: deepseekCost.data.nativeCostMicros,
  fallbackAttemptCostIncluded: true,
  providerCallMade: false,
  customerChargeCreated: false,
  customerCreditsCalculated: false,
  serviceFeeIncluded: false,
}))
