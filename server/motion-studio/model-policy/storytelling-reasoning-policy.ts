import { z } from 'zod'

import {
  REEDITPRO_REASONING_FALLBACK_TRIGGERS,
  REEDITPRO_REASONING_NON_FALLBACK_BLOCKERS,
  type ReEditProReasoningFallbackTrigger,
  type ReEditProReasoningNonFallbackBlocker,
} from '../../../src/types/reasoning-model-routing'
import {
  listReEditProReasoningModelRoutes,
  REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
  validateReEditProReasoningModelRouteChain,
} from '../../../src/lib/reasoning-model-routing-contract'
import {
  REEDITPRO_REASONING_MODEL_RATE_CARD,
  REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
} from '../../reasoning-model-cost'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

export const MOTION_STUDIO_STORYTELLING_REASONING_POLICY_SCHEMA_VERSION =
  'motion-studio.storytelling-reasoning-policy.v3' as const
export const MOTION_STUDIO_STORYTELLING_REASONING_POLICY_LEGACY_V2_SCHEMA_VERSION =
  'motion-studio.storytelling-reasoning-policy.v2' as const
export const MOTION_STUDIO_STORYTELLING_REASONING_POLICY_LEGACY_V2_DIGEST =
  'd02b8a310c6f6ef3f470be9be0c7fe5171286c5862eb5264db4123da2db2603a' as const
export const MOTION_STUDIO_STORYTELLING_REASONING_POLICY_LEGACY_V1_SCHEMA_VERSION =
  'motion-studio.storytelling-reasoning-policy.v1' as const
export const MOTION_STUDIO_STORYTELLING_REASONING_POLICY_LEGACY_V1_DIGEST =
  'dc35c9e2b8d4d845a63e40aa7fde2994f17f8fdcc6183cc388dc090e06d00c7b' as const
export const MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION =
  'motion-studio-storytelling-kimi-gpt-workload-route-v1-2026-07-18' as const
export const MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE =
  'motion_studio_storytelling' as const
export const MOTION_STUDIO_STORYTELLING_PRIMARY_MODEL_ID = 'kimi-k3' as const
export const MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID =
  'gpt-5.6-sol' as const
export const MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_ID =
  'motion-studio-kimi-k3-server-session-adapter-v1' as const

export const MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS = [
  'motion_studio.director',
  'motion_studio.executive_reasoner',
  'motion_studio.research_reasoner',
  'motion_studio.story_architect',
  'motion_studio.script_writer',
  'motion_studio.creative_director',
  'motion_studio.visual_planner',
  'motion_studio.video_understanding_reasoner',
  'motion_studio.character_continuity_reasoner',
  'motion_studio.production_planner',
  'motion_studio.scene_recipe_planner',
  'motion_studio.motion_engineer',
  'motion_studio.code_engineer',
  'motion_studio.change_impact_reasoner',
  'motion_studio.cost_planner',
  'motion_studio.quality_reviewer',
] as const

export type MotionStudioStorytellingReasoningRoleId =
  (typeof MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS)[number]

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)

export const motionStudioStorytellingFallbackInputV1Schema = z.object({
  workloadScope: z.literal(MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE),
  routePolicyVersion: z.literal(
    MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
  ),
  roleId: z.enum(MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS),
  failureTrigger: z.enum([
    ...REEDITPRO_REASONING_FALLBACK_TRIGGERS,
    ...REEDITPRO_REASONING_NON_FALLBACK_BLOCKERS,
  ]),
  approvedPlanSnapshotId: stableId,
  approvedExecutionPackageDigest: digest,
  creditReservationId: stableId,
  costEstimateItemId: stableId,
  maximumAuthorizedInternalCostMicros: z.number().int().positive().safe(),
  idempotencyKey: stableId,
  requestPayloadHash: digest,
  previousAttemptRouteId: z.literal('kimi_k3_primary'),
  previousAttemptTerminal: z.boolean(),
  previousToolSideEffectsReconciled: z.boolean(),
  modelDataPolicyDecision: z.enum([
    'gpt_allowed',
    'gpt_disallowed',
    'unresolved',
  ]),
}).strict()

export type MotionStudioStorytellingFallbackInputV1 = z.infer<
  typeof motionStudioStorytellingFallbackInputV1Schema
>

export interface MotionStudioStorytellingReasoningPolicyV3 {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_REASONING_POLICY_SCHEMA_VERSION
  workloadScope: typeof MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE
  routePolicyVersion: typeof MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION
  ownerDecisionId: 'D-031'
  domainArtifactRouting: 'provider_neutral_roles_only'
  roles: readonly MotionStudioStorytellingReasoningRoleId[]
  primary: {
    policyRouteId: 'kimi_k3_primary'
    canonicalGlobalRouteId: 'kimi_k3_primary'
    policyProviderId: 'moonshot'
    canonicalProviderId: 'moonshot_ai'
    exactProviderModelId: typeof MOTION_STUDIO_STORYTELLING_PRIMARY_MODEL_ID
    reasoningEffort: 'max'
    canonicalGlobalRoutePolicyVersion: string
    canonicalRateCardVersion: string
  }
  fallback: {
    policyRouteId: 'gpt_5_6_sol_fallback'
    policyProviderId: 'openai'
    exactProviderModelId: typeof MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID
    reasoningEffortPolicy: 'approved_task_criticality'
    purposes: readonly ['fallback', 'escalation', 'comparison']
    workloadScopedOnly: true
    canonicalGlobalRouteId: null
    canonicalRateCardVersion: null
    runtimeStatus: 'blocked_pending_shared_route_rate_adapter_and_qualification'
  }
  globalRoutePreservation: {
    version: string
    routeIds: readonly [
      'kimi_k3_primary',
      'qwen_3_7_fallback',
      'deepseek_v4_pro_fallback',
    ]
    mutationAllowed: false
    qwenOrDeepSeekAcceptedAsStorytellingFallback: false
  }
  preApprovalPlanningRequirements: {
    exactMutableInputSnapshot: true
    approvedPlanSnapshotForbidden: true
    creditReservationForbidden: true
    internalPlanningBudgetAuthority: true
    conservativeMaximumAttemptCost: true
    strictJsonSchema: true
    dynamicReadOnlyToolLoading: true
    fullToolCatalogByDefault: false
    stableIdempotencyKey: true
    terminalPriorAttemptForRetry: true
    reconciledPriorToolSideEffects: true
    projectModelDataPolicy: true
    providerTransportSeparatelyRequired: true
  }
  approvedExecutionRequirements: {
    strictJsonSchema: true
    dynamicToolLoading: true
    fullToolCatalogByDefault: false
    exactApprovedSnapshot: true
    exactReservation: true
    stableIdempotencyKey: true
    terminalPriorAttempt: true
    reconciledPriorToolSideEffects: true
    projectModelDataPolicy: true
    maximumOutputFromTaskContract: true
    maximumInternalCostFromApprovedEstimate: true
  }
  currentBoundary: {
    preApprovalPlanningAuthorityImplemented: true
    providerAdapterImplemented: true
    providerSessionAdapterId: typeof MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_ID
    providerSessionCapabilityContractImplemented: true
    providerTransportImplemented: false
    gptCanonicalRouteRegistered: false
    gptCanonicalRateCardRegistered: false
    qualificationAccepted: false
    providerCallAuthorized: false
    credentialReadAuthorized: false
    toolSideEffectAuthorized: false
    customerChargeAuthorized: false
  }
  policyDigest: string
  immutable: true
}

export interface MotionStudioStorytellingReasoningPolicyValidation {
  ok: boolean
  runtimeReady: boolean
  errors: string[]
  runtimeBlockers: string[]
  checkedRoleCount: number
  globalRouteMutationMade: false
  providerCallMade: false
  credentialReadMade: false
  customerChargeCreated: false
}

export interface MotionStudioStorytellingFallbackResolution {
  ok: boolean
  blocked: boolean
  policyEligible: boolean
  executionAuthorized: false
  workloadScope: typeof MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE
  routePolicyVersion: typeof MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION
  roleId: MotionStudioStorytellingReasoningRoleId
  currentCanonicalRouteId: 'kimi_k3_primary'
  intendedFallbackPolicyRouteId: 'gpt_5_6_sol_fallback' | null
  intendedFallbackProviderModelId: typeof MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID | null
  canonicalFallbackRouteId: null
  errors: string[]
  runtimeBlockers: string[]
  requiresUserReview: boolean
  globalRouteMutationMade: false
  providerCallMade: false
  credentialReadMade: false
  toolSideEffectMade: false
  customerChargeCreated: false
}

const globalRouteIds = [
  'kimi_k3_primary',
  'qwen_3_7_fallback',
  'deepseek_v4_pro_fallback',
] as const

const policyBase = {
  schemaVersion: MOTION_STUDIO_STORYTELLING_REASONING_POLICY_SCHEMA_VERSION,
  workloadScope: MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
  routePolicyVersion: MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
  ownerDecisionId: 'D-031' as const,
  domainArtifactRouting: 'provider_neutral_roles_only' as const,
  roles: [...MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS],
  primary: {
    policyRouteId: 'kimi_k3_primary' as const,
    canonicalGlobalRouteId: 'kimi_k3_primary' as const,
    policyProviderId: 'moonshot' as const,
    canonicalProviderId: 'moonshot_ai' as const,
    exactProviderModelId: MOTION_STUDIO_STORYTELLING_PRIMARY_MODEL_ID,
    reasoningEffort: 'max' as const,
    canonicalGlobalRoutePolicyVersion:
      REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
    canonicalRateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
  },
  fallback: {
    policyRouteId: 'gpt_5_6_sol_fallback' as const,
    policyProviderId: 'openai' as const,
    exactProviderModelId: MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID,
    reasoningEffortPolicy: 'approved_task_criticality' as const,
    purposes: ['fallback', 'escalation', 'comparison'] as const,
    workloadScopedOnly: true as const,
    canonicalGlobalRouteId: null,
    canonicalRateCardVersion: null,
    runtimeStatus:
      'blocked_pending_shared_route_rate_adapter_and_qualification' as const,
  },
  globalRoutePreservation: {
    version: REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
    routeIds: globalRouteIds,
    mutationAllowed: false as const,
    qwenOrDeepSeekAcceptedAsStorytellingFallback: false as const,
  },
  preApprovalPlanningRequirements: {
    exactMutableInputSnapshot: true as const,
    approvedPlanSnapshotForbidden: true as const,
    creditReservationForbidden: true as const,
    internalPlanningBudgetAuthority: true as const,
    conservativeMaximumAttemptCost: true as const,
    strictJsonSchema: true as const,
    dynamicReadOnlyToolLoading: true as const,
    fullToolCatalogByDefault: false as const,
    stableIdempotencyKey: true as const,
    terminalPriorAttemptForRetry: true as const,
    reconciledPriorToolSideEffects: true as const,
    projectModelDataPolicy: true as const,
    providerTransportSeparatelyRequired: true as const,
  },
  approvedExecutionRequirements: {
    strictJsonSchema: true as const,
    dynamicToolLoading: true as const,
    fullToolCatalogByDefault: false as const,
    exactApprovedSnapshot: true as const,
    exactReservation: true as const,
    stableIdempotencyKey: true as const,
    terminalPriorAttempt: true as const,
    reconciledPriorToolSideEffects: true as const,
    projectModelDataPolicy: true as const,
    maximumOutputFromTaskContract: true as const,
    maximumInternalCostFromApprovedEstimate: true as const,
  },
  currentBoundary: {
    preApprovalPlanningAuthorityImplemented: true as const,
    providerAdapterImplemented: true as const,
    providerSessionAdapterId: MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_ID,
    providerSessionCapabilityContractImplemented: true as const,
    providerTransportImplemented: false as const,
    gptCanonicalRouteRegistered: false as const,
    gptCanonicalRateCardRegistered: false as const,
    qualificationAccepted: false as const,
    providerCallAuthorized: false as const,
    credentialReadAuthorized: false as const,
    toolSideEffectAuthorized: false as const,
    customerChargeAuthorized: false as const,
  },
  immutable: true as const,
}

export const MOTION_STUDIO_STORYTELLING_REASONING_POLICY:
MotionStudioStorytellingReasoningPolicyV3 = deepFreeze({
  ...policyBase,
  policyDigest: sha256CanonicalJson(policyBase),
})

export function listMotionStudioStorytellingReasoningRoles():
MotionStudioStorytellingReasoningRoleId[] {
  return [...MOTION_STUDIO_STORYTELLING_REASONING_POLICY.roles]
}

export function getMotionStudioStorytellingReasoningPolicyForRole(
  roleId: MotionStudioStorytellingReasoningRoleId,
): MotionStudioStorytellingReasoningPolicyV3 {
  if (!MOTION_STUDIO_STORYTELLING_REASONING_POLICY.roles.includes(roleId)) {
    invalid(`Unsupported Motion Studio Storytelling reasoning role: ${roleId}`)
  }
  return MOTION_STUDIO_STORYTELLING_REASONING_POLICY
}

export function validateMotionStudioStorytellingReasoningPolicy(
  policy: MotionStudioStorytellingReasoningPolicyV3 =
    MOTION_STUDIO_STORYTELLING_REASONING_POLICY,
): MotionStudioStorytellingReasoningPolicyValidation {
  const errors: string[] = []
  const runtimeBlockers: string[] = []
  const globalValidation = validateReEditProReasoningModelRouteChain()
  const sharedRoutes = listReEditProReasoningModelRoutes()
  const sharedRouteIds = sharedRoutes.map((route) => route.routeId)
  const sharedRateCards = Object.values(REEDITPRO_REASONING_MODEL_RATE_CARD)

  if (policy.schemaVersion !==
      MOTION_STUDIO_STORYTELLING_REASONING_POLICY_SCHEMA_VERSION) {
    errors.push('Storytelling reasoning policy has an unsupported schema version.')
  }
  if (policy.ownerDecisionId !== 'D-031' ||
      policy.domainArtifactRouting !== 'provider_neutral_roles_only') {
    errors.push('Storytelling reasoning policy lost its owner decision or provider-neutral domain boundary.')
  }
  if (policy.workloadScope !== MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE ||
      policy.routePolicyVersion !==
      MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION) {
    errors.push('Storytelling reasoning policy lost its exact workload or version authority.')
  }
  if (!globalValidation.ok ||
      REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION !==
      policy.globalRoutePreservation.version ||
      sha256CanonicalJson(sharedRouteIds) !==
      sha256CanonicalJson(policy.globalRoutePreservation.routeIds)) {
    errors.push('The canonical global Kimi to Qwen to DeepSeek route changed or failed validation.')
  }
  if (policy.globalRoutePreservation.mutationAllowed ||
      policy.globalRoutePreservation.qwenOrDeepSeekAcceptedAsStorytellingFallback) {
    errors.push('A workload-scoped Storytelling policy cannot mutate or silently adopt the global fallbacks.')
  }
  if (new Set(policy.roles).size !==
      MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS.length ||
      sha256CanonicalJson(policy.roles) !==
      sha256CanonicalJson(MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS)) {
    errors.push('Storytelling reasoning role coverage is incomplete, reordered, or duplicated.')
  }
  if (policy.roles.some((role) => /kimi|gpt|moonshot|openai/i.test(role))) {
    errors.push('Storytelling domain role IDs must remain provider neutral.')
  }
  const kimiRoute = sharedRoutes.find((route) =>
    route.routeId === policy.primary.canonicalGlobalRouteId)
  const kimiRate = sharedRateCards.find((entry) =>
    entry.routeId === policy.primary.canonicalGlobalRouteId)
  if (policy.primary.policyRouteId !== 'kimi_k3_primary' ||
      policy.primary.canonicalGlobalRouteId !== 'kimi_k3_primary' ||
      policy.primary.policyProviderId !== 'moonshot' ||
      policy.primary.canonicalProviderId !== 'moonshot_ai' ||
      policy.primary.canonicalGlobalRoutePolicyVersion !==
      REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION ||
      policy.primary.canonicalRateCardVersion !==
      REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION ||
      kimiRoute?.exactProviderModelId !== policy.primary.exactProviderModelId ||
      kimiRate?.exactProviderModelId !== policy.primary.exactProviderModelId ||
      policy.primary.reasoningEffort !== 'max') {
    errors.push('Storytelling primary policy lost its canonical Kimi route, rate, or maximum-effort binding.')
  }
  if (policy.fallback.policyRouteId !== 'gpt_5_6_sol_fallback' ||
      policy.fallback.policyProviderId !== 'openai' ||
      policy.fallback.exactProviderModelId !==
      MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID ||
      policy.fallback.reasoningEffortPolicy !== 'approved_task_criticality' ||
      !policy.fallback.workloadScopedOnly ||
      policy.fallback.canonicalGlobalRouteId !== null ||
      policy.fallback.canonicalRateCardVersion !== null ||
      policy.fallback.runtimeStatus !==
      'blocked_pending_shared_route_rate_adapter_and_qualification' ||
      sha256CanonicalJson(policy.fallback.purposes) !==
      sha256CanonicalJson(['fallback', 'escalation', 'comparison'])) {
    errors.push('Storytelling fallback must remain workload-scoped GPT with no invented shared route or rate authority.')
  }
  if (
    !policy.preApprovalPlanningRequirements.exactMutableInputSnapshot ||
    !policy.preApprovalPlanningRequirements.approvedPlanSnapshotForbidden ||
    !policy.preApprovalPlanningRequirements.creditReservationForbidden ||
    !policy.preApprovalPlanningRequirements.internalPlanningBudgetAuthority ||
    !policy.preApprovalPlanningRequirements.conservativeMaximumAttemptCost ||
    !policy.preApprovalPlanningRequirements.strictJsonSchema ||
    !policy.preApprovalPlanningRequirements.dynamicReadOnlyToolLoading ||
    policy.preApprovalPlanningRequirements.fullToolCatalogByDefault ||
    !policy.preApprovalPlanningRequirements.stableIdempotencyKey ||
    !policy.preApprovalPlanningRequirements.terminalPriorAttemptForRetry ||
    !policy.preApprovalPlanningRequirements.reconciledPriorToolSideEffects ||
    !policy.preApprovalPlanningRequirements.projectModelDataPolicy ||
    !policy.preApprovalPlanningRequirements.providerTransportSeparatelyRequired ||
    !policy.approvedExecutionRequirements.strictJsonSchema ||
    !policy.approvedExecutionRequirements.dynamicToolLoading ||
    policy.approvedExecutionRequirements.fullToolCatalogByDefault ||
    !policy.approvedExecutionRequirements.exactApprovedSnapshot ||
    !policy.approvedExecutionRequirements.exactReservation ||
    !policy.approvedExecutionRequirements.stableIdempotencyKey ||
    !policy.approvedExecutionRequirements.terminalPriorAttempt ||
    !policy.approvedExecutionRequirements.reconciledPriorToolSideEffects ||
    !policy.approvedExecutionRequirements.projectModelDataPolicy ||
    !policy.approvedExecutionRequirements.maximumOutputFromTaskContract ||
    !policy.approvedExecutionRequirements.maximumInternalCostFromApprovedEstimate
  ) {
    errors.push('Storytelling reasoning policy weakened a required pre-approval or approved-execution authority, data, tool, schema, or cost gate.')
  }
  if (
    !policy.currentBoundary.preApprovalPlanningAuthorityImplemented ||
    !policy.currentBoundary.providerAdapterImplemented ||
    policy.currentBoundary.providerSessionAdapterId !==
      MOTION_STUDIO_KIMI_K3_SESSION_ADAPTER_ID ||
    !policy.currentBoundary.providerSessionCapabilityContractImplemented ||
    policy.currentBoundary.providerTransportImplemented ||
    policy.currentBoundary.gptCanonicalRouteRegistered ||
    policy.currentBoundary.gptCanonicalRateCardRegistered ||
    policy.currentBoundary.qualificationAccepted ||
    policy.currentBoundary.providerCallAuthorized ||
    policy.currentBoundary.credentialReadAuthorized ||
    policy.currentBoundary.toolSideEffectAuthorized ||
    policy.currentBoundary.customerChargeAuthorized
  ) {
    errors.push('Storytelling must preserve its accepted session adapter while keeping transport, credential, tool-side-effect, qualification, and commercial gates closed.')
  }
  const base = { ...policy } as Record<string, unknown>
  delete base.policyDigest
  if (sha256CanonicalJson(base) !== policy.policyDigest) {
    errors.push('Storytelling reasoning policy failed immutable digest verification.')
  }
  if (!policy.immutable) {
    errors.push('Storytelling reasoning policy must remain immutable.')
  }

  const gptRouteRegistered = sharedRoutes.some((route) =>
    route.exactProviderModelId === MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID)
  const gptRateRegistered = sharedRateCards.some((entry) =>
    entry.exactProviderModelId === MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID)
  if (!gptRouteRegistered) {
    runtimeBlockers.push('gpt_canonical_shared_route_missing')
  }
  if (!gptRateRegistered) {
    runtimeBlockers.push('gpt_canonical_shared_rate_card_missing')
  }
  if (
    !policy.currentBoundary.providerTransportImplemented ||
    !policy.currentBoundary.providerCallAuthorized
  ) {
    runtimeBlockers.push('storytelling_reasoning_provider_transport_authority_missing')
  }
  if (!policy.currentBoundary.qualificationAccepted) {
    runtimeBlockers.push('storytelling_model_qualification_not_accepted')
  }

  return {
    ok: errors.length === 0,
    runtimeReady: errors.length === 0 && runtimeBlockers.length === 0,
    errors,
    runtimeBlockers,
    checkedRoleCount: policy.roles.length,
    globalRouteMutationMade: false,
    providerCallMade: false,
    credentialReadMade: false,
    customerChargeCreated: false,
  }
}

export function assertMotionStudioStorytellingReasoningPolicy(
  policy: MotionStudioStorytellingReasoningPolicyV3 =
    MOTION_STUDIO_STORYTELLING_REASONING_POLICY,
): void {
  const validation = validateMotionStudioStorytellingReasoningPolicy(policy)
  if (!validation.ok) blocked(validation.errors.join(' '))
}

export function resolveMotionStudioStorytellingGptFallback(
  inputValue: MotionStudioStorytellingFallbackInputV1,
): MotionStudioStorytellingFallbackResolution {
  const input = motionStudioStorytellingFallbackInputV1Schema.parse(inputValue)
  const errors: string[] = []
  const policyValidation = validateMotionStudioStorytellingReasoningPolicy()
  const allowedFailure = REEDITPRO_REASONING_FALLBACK_TRIGGERS.includes(
    input.failureTrigger as ReEditProReasoningFallbackTrigger,
  )

  if (!allowedFailure) {
    errors.push(
      `Failure ${input.failureTrigger as ReEditProReasoningNonFallbackBlocker} must block instead of selecting another model.`,
    )
  }
  if (!input.previousAttemptTerminal) {
    errors.push('Storytelling fallback requires the prior Kimi attempt to be terminal.')
  }
  if (!input.previousToolSideEffectsReconciled) {
    errors.push('Storytelling fallback requires reconciliation of all prior tool side effects.')
  }
  if (input.modelDataPolicyDecision !== 'gpt_allowed') {
    errors.push('The project model-data policy does not permit the GPT fallback route.')
  }
  if (!policyValidation.ok) errors.push(...policyValidation.errors)

  const policyEligible = errors.length === 0
  const runtimeBlockers = [...policyValidation.runtimeBlockers]
  if (policyEligible) {
    runtimeBlockers.push('gpt_fallback_execution_not_authorized_by_this_policy_slice')
  }

  return deepFreeze({
    ok: false,
    blocked: true,
    policyEligible,
    executionAuthorized: false,
    workloadScope: MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
    routePolicyVersion: MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
    roleId: input.roleId,
    currentCanonicalRouteId: 'kimi_k3_primary',
    intendedFallbackPolicyRouteId: policyEligible ? 'gpt_5_6_sol_fallback' : null,
    intendedFallbackProviderModelId:
      policyEligible ? MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID : null,
    canonicalFallbackRouteId: null,
    errors,
    runtimeBlockers,
    requiresUserReview: !policyEligible,
    globalRouteMutationMade: false,
    providerCallMade: false,
    credentialReadMade: false,
    toolSideEffectMade: false,
    customerChargeCreated: false,
  })
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
