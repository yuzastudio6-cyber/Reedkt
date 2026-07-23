import { z } from 'zod'

import { REEDITPRO_REQUESTED_MODEL_USES } from '../../../src/types/model-role-routing'
import { REEDITPRO_REASONING_FALLBACK_TRIGGERS } from '../../../src/types/reasoning-model-routing'
import { ApiError } from '../../errors/api-error'
import { REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION } from '../../reasoning-model-cost'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  estimateMotionStudioKimiK3MaximumAttemptCost,
  MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID,
  MOTION_STUDIO_KIMI_K3_MODEL_ID,
  MOTION_STUDIO_KIMI_K3_OFFICIAL_PRICING_PROVENANCE,
} from './kimi-k3-cost'
import {
  inspectMotionStudioKimiK3ConversationToolState,
  isMotionStudioKimiK3RequestedUseAllowedForRole,
  MOTION_STUDIO_KIMI_K3_MAXIMUM_DYNAMIC_TOOLS,
  MOTION_STUDIO_KIMI_K3_MAXIMUM_OUTPUT_TOKENS,
  MOTION_STUDIO_KIMI_K3_MAXIMUM_SESSION_INPUT_BYTES,
  motionStudioKimiK3DynamicToolDefinitionV1Schema,
  motionStudioKimiK3SessionMessageV1Schema,
  validateMotionStudioKimiK3StrictJsonSchema,
  type MotionStudioKimiK3DynamicToolDefinitionV1,
} from './kimi-k3-session-adapter'
import {
  assertMotionStudioStorytellingModelDataResolution,
  motionStudioStorytellingModelDataResolutionV1Schema,
} from './storytelling-model-data-policy'
import {
  getMotionStudioStorytellingReasoningPolicyForRole,
  MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS,
  MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
  MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
} from './storytelling-reasoning-policy'

export const MOTION_STUDIO_STORYTELLING_PREAPPROVAL_INPUT_SNAPSHOT_SCHEMA_VERSION =
  'motion-studio.storytelling-preapproval-input-snapshot.v1' as const
export const MOTION_STUDIO_STORYTELLING_PREAPPROVAL_BUDGET_SCHEMA_VERSION =
  'motion-studio.storytelling-preapproval-internal-budget.v1' as const
export const MOTION_STUDIO_STORYTELLING_PREAPPROVAL_SESSION_SCHEMA_VERSION =
  'motion-studio.storytelling-preapproval-kimi-session.v1' as const
export const MOTION_STUDIO_STORYTELLING_PREAPPROVAL_BUDGET_POLICY_VERSION =
  'motion-studio-storytelling-preapproval-budget-v1-2026-07-19' as const
export const MOTION_STUDIO_STORYTELLING_PREAPPROVAL_MAXIMUM_ATTEMPTS = 2 as const

export const MOTION_STUDIO_STORYTELLING_PREAPPROVAL_PHASES = [
  'intake',
  'understanding_review',
  'research_synthesis',
  'story_structure',
  'script_draft',
  'creative_direction',
  'scene_planning',
  'plan_assembly',
  'plan_quality_review',
  'change_impact',
] as const

export type MotionStudioStorytellingPreApprovalPhase =
  (typeof MOTION_STUDIO_STORYTELLING_PREAPPROVAL_PHASES)[number]

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const isoDate = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().safe()

const optionalInputAuthoritySchema = z.object({
  status: z.enum(['not_present', 'draft', 'bound']),
  authorityId: stableId.nullable(),
  authorityRevision: safeInteger,
  authorityDigest: digest.nullable(),
}).strict().superRefine((value, context) => {
  if (value.status === 'not_present') {
    if (value.authorityId !== null || value.authorityDigest !== null || value.authorityRevision !== 0) {
      context.addIssue({
        code: 'custom',
        message: 'A missing planning input cannot retain invented authority identity, revision, or digest.',
      })
    }
    return
  }
  if (value.authorityId === null || value.authorityDigest === null) {
    context.addIssue({
      code: 'custom',
      message: 'A draft or bound planning input requires its exact authority identity and digest.',
    })
  }
})

const preApprovalInputSnapshotBaseSchema = z.object({
  schemaVersion: z.literal(
    MOTION_STUDIO_STORYTELLING_PREAPPROVAL_INPUT_SNAPSHOT_SCHEMA_VERSION,
  ),
  snapshotId: stableId,
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  conversation: z.object({
    conversationId: stableId,
    revision: safeInteger,
    messageCount: safeInteger,
    conversationDigest: digest,
  }).strict(),
  editSetup: z.object({
    setupSnapshotId: stableId,
    setupSnapshotDigest: digest,
  }).strict(),
  exactEditPreferences: z.object({
    authorityId: stableId,
    recordRevision: safeInteger,
    preferenceRevision: safeInteger,
    preferenceFingerprintDigest: digest,
  }).strict(),
  preferenceApplication: optionalInputAuthoritySchema,
  editBrief: optionalInputAuthoritySchema,
  sourceContext: optionalInputAuthoritySchema,
  referenceContext: optionalInputAuthoritySchema,
  currentPlanningStage: z.enum([
    'planning_setup',
    'understanding',
    'research',
    'story',
    'script',
    'style',
    'scene_planning',
    'plan_review',
  ]),
  sourceOptionalForIdeaFirstStorytelling: z.boolean(),
  planApproved: z.literal(false),
  approvedPlanSnapshotCreated: z.literal(false),
  creditReservationCreated: z.literal(false),
  mutableInputsCapturedReadOnly: z.literal(true),
  capturedAt: isoDate,
  immutable: z.literal(true),
}).strict()

export const motionStudioStorytellingPreApprovalInputSnapshotV1Schema =
  preApprovalInputSnapshotBaseSchema.extend({ snapshotDigest: digest }).strict()

export type MotionStudioStorytellingPreApprovalInputSnapshotV1 = z.infer<
  typeof motionStudioStorytellingPreApprovalInputSnapshotV1Schema
>

export type MotionStudioStorytellingPreApprovalInputSnapshotDraftV1 = Omit<
  MotionStudioStorytellingPreApprovalInputSnapshotV1,
  'schemaVersion' | 'snapshotDigest' | 'immutable'
>

const preApprovalBudgetBaseSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_PREAPPROVAL_BUDGET_SCHEMA_VERSION),
  budgetAuthorityId: stableId,
  budgetPolicyVersion: z.literal(
    MOTION_STUDIO_STORYTELLING_PREAPPROVAL_BUDGET_POLICY_VERSION,
  ),
  workloadScope: z.literal(MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE),
  routePolicyVersion: z.literal(
    MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
  ),
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  reasoningRunId: stableId,
  attemptLimit: z.number().int().min(1).max(
    MOTION_STUDIO_STORYTELLING_PREAPPROVAL_MAXIMUM_ATTEMPTS,
  ),
  maximumPromptTokensPerAttempt: z.number().int().min(1).max(967_232),
  maximumOutputTokensPerAttempt: z.number().int().min(1).max(
    MOTION_STUDIO_KIMI_K3_MAXIMUM_OUTPUT_TOKENS,
  ),
  maximumAttemptInternalCostMicros: z.number().int().positive().safe(),
  maximumRunInternalCostMicros: z.number().int().positive().safe(),
  committedRunInternalCostMicros: safeInteger,
  remainingRunInternalCostMicros: safeInteger,
  canonicalRateCardVersion: z.literal(REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION),
  budgetPurpose: z.literal('pre_approval_storytelling_reasoning_only'),
  customerCreditReservationRequired: z.literal(false),
  customerPriceIncluded: z.literal(false),
  customerCreditsIncluded: z.literal(false),
  serviceFeeIncluded: z.literal(false),
  walletMutationAuthorized: z.literal(false),
  customerChargeAuthorized: z.literal(false),
  providerTransportAuthorized: z.literal(false),
  durableRuntimeEnforcementRequired: z.literal(true),
  issuedAt: isoDate,
  expiresAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  const expectedRemaining = value.maximumRunInternalCostMicros -
    value.committedRunInternalCostMicros
  if (expectedRemaining < 0 || value.remainingRunInternalCostMicros !== expectedRemaining) {
    context.addIssue({
      code: 'custom',
      path: ['remainingRunInternalCostMicros'],
      message: 'Pre-approval budget remaining cost must exactly reconcile to maximum minus committed cost.',
    })
  }
  if (value.maximumAttemptInternalCostMicros > value.maximumRunInternalCostMicros) {
    context.addIssue({
      code: 'custom',
      path: ['maximumAttemptInternalCostMicros'],
      message: 'One pre-approval attempt cannot exceed the entire reasoning-run budget.',
    })
  }
  const issued = Date.parse(value.issuedAt)
  const expires = Date.parse(value.expiresAt)
  if (expires <= issued || expires - issued > 86_400_000) {
    context.addIssue({
      code: 'custom',
      path: ['expiresAt'],
      message: 'A pre-approval reasoning budget must expire after issuance and within 24 hours.',
    })
  }
})

export const motionStudioStorytellingPreApprovalBudgetV1Schema =
  preApprovalBudgetBaseSchema.safeExtend({ budgetDigest: digest }).strict()

export type MotionStudioStorytellingPreApprovalBudgetV1 = z.infer<
  typeof motionStudioStorytellingPreApprovalBudgetV1Schema
>

export type MotionStudioStorytellingPreApprovalBudgetDraftV1 = Omit<
  MotionStudioStorytellingPreApprovalBudgetV1,
  'schemaVersion' | 'budgetPolicyVersion' | 'workloadScope' | 'routePolicyVersion' |
  'canonicalRateCardVersion' | 'budgetPurpose' | 'customerCreditReservationRequired' |
  'customerPriceIncluded' | 'customerCreditsIncluded' | 'serviceFeeIncluded' |
  'walletMutationAuthorized' | 'customerChargeAuthorized' | 'providerTransportAuthorized' |
  'durableRuntimeEnforcementRequired' | 'budgetDigest' | 'immutable'
>

const retryFromSchema = z.object({
  priorAttemptId: stableId,
  priorAttemptOrdinal: z.literal(1),
  priorSessionDigest: digest,
  priorAttemptCostEvidenceDigest: digest,
  priorAttemptInternalCostMicros: safeInteger,
  terminalOutcome: z.literal('failed'),
  failureTrigger: z.enum(REEDITPRO_REASONING_FALLBACK_TRIGGERS),
  providerOutcomeReconciled: z.literal(true),
  priorToolSideEffectsReconciled: z.literal(true),
}).strict()

const readOnlyToolDefinitionSchema = motionStudioKimiK3DynamicToolDefinitionV1Schema
  .safeExtend({ sideEffectClass: z.literal('read_only') })
  .strict()

export const motionStudioStorytellingPreApprovalSessionCompileInputV1Schema = z.object({
  authorityId: stableId,
  providerSessionId: stableId,
  reasoningRunId: stableId,
  logicalArtifactKey: stableId,
  attemptId: stableId,
  attemptOrdinal: z.union([z.literal(1), z.literal(2)]),
  retryFrom: retryFromSchema.nullable(),
  roleId: z.enum(MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS),
  requestedUse: z.enum(REEDITPRO_REQUESTED_MODEL_USES),
  phase: z.enum(MOTION_STUDIO_STORYTELLING_PREAPPROVAL_PHASES),
  planningInputSnapshot: motionStudioStorytellingPreApprovalInputSnapshotV1Schema,
  internalBudget: motionStudioStorytellingPreApprovalBudgetV1Schema,
  modelDataResolution: motionStudioStorytellingModelDataResolutionV1Schema,
  idempotencyKey: stableId,
  projectedPromptTokens: z.number().int().positive().safe(),
  maximumOutputTokens: z.number().int().min(1).max(
    MOTION_STUDIO_KIMI_K3_MAXIMUM_OUTPUT_TOKENS,
  ),
  outputJsonSchema: z.record(z.string(), z.unknown()),
  messages: z.array(motionStudioKimiK3SessionMessageV1Schema).min(1).max(512).readonly(),
  requestedReadOnlyToolIds: z.array(stableId).max(
    MOTION_STUDIO_KIMI_K3_MAXIMUM_DYNAMIC_TOOLS,
  ).readonly(),
  availableReadOnlyTools: z.array(readOnlyToolDefinitionSchema).max(
    MOTION_STUDIO_KIMI_K3_MAXIMUM_DYNAMIC_TOOLS,
  ).readonly(),
  fullToolCatalogRequested: z.literal(false),
  streamingRequested: z.literal(true),
  interruptionPolicy: z.literal('checkpoint_then_reconcile'),
  reconnectionPolicy: z.literal('restore_exact_session_no_automatic_resubmit'),
  compiledAt: isoDate,
}).strict().superRefine((value, context) => {
  if (value.attemptOrdinal === 1 && value.retryFrom !== null) {
    context.addIssue({ code: 'custom', path: ['retryFrom'], message: 'The first attempt cannot claim prior retry evidence.' })
  }
  if (value.attemptOrdinal === 2 && value.retryFrom === null) {
    context.addIssue({ code: 'custom', path: ['retryFrom'], message: 'The second attempt requires exact terminal and reconciled first-attempt evidence.' })
  }
  const inputBytes = new TextEncoder().encode(JSON.stringify({
    outputJsonSchema: value.outputJsonSchema,
    messages: value.messages,
    requestedReadOnlyToolIds: value.requestedReadOnlyToolIds,
    availableReadOnlyTools: value.availableReadOnlyTools,
  })).byteLength
  if (inputBytes > MOTION_STUDIO_KIMI_K3_MAXIMUM_SESSION_INPUT_BYTES) {
    context.addIssue({
      code: 'custom',
      message: `Pre-approval Kimi input exceeds the ${MOTION_STUDIO_KIMI_K3_MAXIMUM_SESSION_INPUT_BYTES}-byte boundary.`,
    })
  }
})

export type MotionStudioStorytellingPreApprovalSessionCompileInputV1 = z.infer<
  typeof motionStudioStorytellingPreApprovalSessionCompileInputV1Schema
>

const preApprovalKimiSessionBaseSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_PREAPPROVAL_SESSION_SCHEMA_VERSION),
  authorityKind: z.literal('pre_approval_storytelling_planning'),
  authorityId: stableId,
  workloadScope: z.literal(MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE),
  routePolicyVersion: z.literal(MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION),
  canonicalRouteId: z.literal(MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID),
  providerId: z.literal('moonshot'),
  exactProviderModelId: z.literal(MOTION_STUDIO_KIMI_K3_MODEL_ID),
  reasoningEffort: z.literal('max'),
  providerSessionId: stableId,
  reasoningRunId: stableId,
  logicalArtifactKey: stableId,
  attemptId: stableId,
  attemptOrdinal: z.union([z.literal(1), z.literal(2)]),
  retryFrom: retryFromSchema.nullable(),
  roleId: z.enum(MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS),
  requestedUse: z.enum(REEDITPRO_REQUESTED_MODEL_USES),
  phase: z.enum(MOTION_STUDIO_STORYTELLING_PREAPPROVAL_PHASES),
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  planningInputSnapshotId: stableId,
  planningInputSnapshotDigest: digest,
  modelDataResolutionId: stableId,
  modelDataResolutionDigest: digest,
  modelDataPolicyId: stableId,
  compiledKimiProjectPolicyDigest: digest,
  internalBudgetAuthorityId: stableId,
  internalBudgetDigest: digest,
  canonicalRateCardVersion: z.literal(REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION),
  officialPricingProvenanceDigest: digest,
  projectedPromptTokens: z.number().int().positive().safe(),
  maximumOutputTokens: z.number().int().min(1).max(
    MOTION_STUDIO_KIMI_K3_MAXIMUM_OUTPUT_TOKENS,
  ),
  conservativeMaximumInternalCostMicros: z.number().int().positive().safe(),
  remainingRunInternalCostMicros: safeInteger,
  providerTokenCountPreflightRequired: z.literal(true),
  idempotencyKey: stableId,
  requestPayloadHash: digest,
  outputJsonSchema: z.record(z.string(), z.unknown()),
  outputJsonSchemaDigest: digest,
  messages: z.array(motionStudioKimiK3SessionMessageV1Schema).min(1).max(512).readonly(),
  loadedReadOnlyTools: z.array(readOnlyToolDefinitionSchema).max(
    MOTION_STUDIO_KIMI_K3_MAXIMUM_DYNAMIC_TOOLS,
  ).readonly(),
  unresolvedReadOnlyToolCallIds: z.array(stableId).max(512).readonly(),
  state: z.enum([
    'compiled_transport_authority_required',
    'waiting_for_read_only_tool_results',
  ]),
  approvedPlanSnapshotId: z.null(),
  approvedExecutionPackageDigest: z.null(),
  creditReservationId: z.null(),
  planApprovalCreated: z.literal(false),
  customerCreditReservationRequired: z.literal(false),
  strictJsonSchema: z.literal(true),
  dynamicReadOnlyToolLoading: z.literal(true),
  fullToolCatalogLoaded: z.literal(false),
  samplingOverridesOmitted: z.literal(true),
  streaming: z.literal(true),
  interruptionPolicy: z.literal('checkpoint_then_reconcile'),
  reconnectionPolicy: z.literal('restore_exact_session_no_automatic_resubmit'),
  reasoningContentProjectAuthority: z.literal(false),
  providerUsageCostRecordingRequired: z.literal(true),
  transportAuthorityState: z.literal('required_not_granted'),
  readOnlyToolExecutionAuthorityState: z.literal('separate_controlled_authority_required'),
  providerTransportAuthorized: z.literal(false),
  providerCallMade: z.literal(false),
  credentialReadMade: z.literal(false),
  toolExecutionMadeByCompilation: z.literal(false),
  mediaGenerationAuthorized: z.literal(false),
  sourcePreparationAuthorized: z.literal(false),
  planPublicationAuthorized: z.literal(false),
  planApprovalAuthorized: z.literal(false),
  creditReservationAuthorized: z.literal(false),
  timelineMutationAuthorized: z.literal(false),
  renderAuthorized: z.literal(false),
  exportAuthorized: z.literal(false),
  customerChargeCreated: z.literal(false),
  compiledAt: isoDate,
  immutable: z.literal(true),
}).strict()

export const motionStudioStorytellingPreApprovalKimiSessionV1Schema =
  preApprovalKimiSessionBaseSchema.extend({ sessionDigest: digest }).strict()

export type MotionStudioStorytellingPreApprovalKimiSessionV1 = z.infer<
  typeof motionStudioStorytellingPreApprovalKimiSessionV1Schema
>

export function createMotionStudioStorytellingPreApprovalInputSnapshot(
  input: MotionStudioStorytellingPreApprovalInputSnapshotDraftV1,
): MotionStudioStorytellingPreApprovalInputSnapshotV1 {
  const base = preApprovalInputSnapshotBaseSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_PREAPPROVAL_INPUT_SNAPSHOT_SCHEMA_VERSION,
    ...structuredClone(input),
    immutable: true,
  })
  return deepFreeze(motionStudioStorytellingPreApprovalInputSnapshotV1Schema.parse({
    ...base,
    snapshotDigest: sha256CanonicalJson(base),
  }))
}

export function createMotionStudioStorytellingPreApprovalBudget(
  input: MotionStudioStorytellingPreApprovalBudgetDraftV1,
): MotionStudioStorytellingPreApprovalBudgetV1 {
  const base = preApprovalBudgetBaseSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_PREAPPROVAL_BUDGET_SCHEMA_VERSION,
    budgetPolicyVersion: MOTION_STUDIO_STORYTELLING_PREAPPROVAL_BUDGET_POLICY_VERSION,
    workloadScope: MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
    routePolicyVersion: MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
    canonicalRateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
    budgetPurpose: 'pre_approval_storytelling_reasoning_only',
    customerCreditReservationRequired: false,
    customerPriceIncluded: false,
    customerCreditsIncluded: false,
    serviceFeeIncluded: false,
    walletMutationAuthorized: false,
    customerChargeAuthorized: false,
    providerTransportAuthorized: false,
    durableRuntimeEnforcementRequired: true,
    ...structuredClone(input),
    immutable: true,
  })
  const maximum = estimateMotionStudioKimiK3MaximumAttemptCost({
    projectedPromptTokens: base.maximumPromptTokensPerAttempt,
    maximumCompletionTokens: base.maximumOutputTokensPerAttempt,
  }).totalInternalCostMicros
  if (maximum > base.maximumAttemptInternalCostMicros) {
    blocked('Pre-approval budget is lower than the conservative zero-cache Kimi attempt maximum.')
  }
  if (base.maximumAttemptInternalCostMicros > base.remainingRunInternalCostMicros) {
    blocked('Pre-approval budget cannot authorize another full attempt inside the remaining run cost.')
  }
  return deepFreeze(motionStudioStorytellingPreApprovalBudgetV1Schema.parse({
    ...base,
    budgetDigest: sha256CanonicalJson(base),
  }))
}

export function compileMotionStudioStorytellingPreApprovalKimiSession(
  inputValue: MotionStudioStorytellingPreApprovalSessionCompileInputV1,
): MotionStudioStorytellingPreApprovalKimiSessionV1 {
  assertMotionStudioStorytellingPreApprovalInputSnapshot(inputValue.planningInputSnapshot)
  assertMotionStudioStorytellingPreApprovalBudget(inputValue.internalBudget)
  assertMotionStudioStorytellingModelDataResolution(inputValue.modelDataResolution)
  const input = motionStudioStorytellingPreApprovalSessionCompileInputV1Schema.parse(inputValue)
  const policy = getMotionStudioStorytellingReasoningPolicyForRole(input.roleId)
  const errors: string[] = []

  if (!policy.preApprovalPlanningRequirements.exactMutableInputSnapshot ||
      !policy.preApprovalPlanningRequirements.approvedPlanSnapshotForbidden ||
      !policy.preApprovalPlanningRequirements.creditReservationForbidden) {
    blocked('Storytelling policy no longer permits the bounded pre-approval planning authority.')
  }
  if (!isMotionStudioKimiK3RequestedUseAllowedForRole(input.roleId, input.requestedUse)) {
    errors.push(`${input.roleId} cannot perform requested model use ${input.requestedUse}.`)
  }
  if (input.requestedUse === 'visual_understanding' ||
      input.requestedUse === 'provider_asset_generation') {
    errors.push('Pre-approval reasoning cannot replace deterministic visual evidence or generate provider media.')
  }
  if (input.messages[0]?.role !== 'system') {
    errors.push('Pre-approval Kimi sessions must begin with the complete bounded system instruction.')
  }

  const snapshot = input.planningInputSnapshot
  const budget = input.internalBudget
  const resolution = input.modelDataResolution
  for (const field of ['workspaceId', 'projectId', 'editSessionId', 'productionId'] as const) {
    if (snapshot[field] !== resolution[field] || budget[field] !== resolution[field]) {
      errors.push(`Pre-approval ${field} must match the exact input snapshot, model-data resolution and budget.`)
    }
  }
  if (budget.reasoningRunId !== input.reasoningRunId) {
    errors.push('Pre-approval session reasoning run must match the exact internal budget.')
  }
  if (resolution.roleId !== input.roleId || resolution.requestedUse !== input.requestedUse) {
    errors.push('Pre-approval role and requested use must match the exact model-data classification.')
  }
  const kimiRoute = resolution.routeDecisions.find((route) =>
    route.policyRouteId === 'kimi_k3_primary')
  const compiledProjectPolicy = resolution.compiledKimiProjectDataPolicy
  if (!kimiRoute || kimiRoute.eligibility !== 'allowed' ||
      (resolution.disposition !== 'kimi_primary_with_gpt_fallback' &&
        resolution.disposition !== 'kimi_primary_only') ||
      !compiledProjectPolicy || compiledProjectPolicy.decision !== 'moonshot_allowed') {
    errors.push('The exact project model-data resolution does not permit the Kimi primary route.')
  }
  if (Date.parse(input.compiledAt) < Date.parse(snapshot.capturedAt) ||
      Date.parse(input.compiledAt) < Date.parse(budget.issuedAt) ||
      Date.parse(input.compiledAt) >= Date.parse(budget.expiresAt)) {
    errors.push('Pre-approval compilation must occur after input capture and budget issuance but before budget expiry.')
  }
  if (input.attemptOrdinal > budget.attemptLimit) {
    errors.push('Pre-approval attempt ordinal exceeds the exact internal budget attempt limit.')
  }
  if (input.projectedPromptTokens > budget.maximumPromptTokensPerAttempt ||
      input.maximumOutputTokens > budget.maximumOutputTokensPerAttempt) {
    errors.push('Pre-approval token request exceeds the exact internal budget envelope.')
  }
  if (input.retryFrom?.priorAttemptId === input.attemptId) {
    errors.push('A pre-approval retry must use a new attempt identity.')
  }
  if (input.retryFrom &&
      input.retryFrom.priorAttemptInternalCostMicros > budget.committedRunInternalCostMicros) {
    errors.push('A pre-approval retry budget must retain at least the exact prior failed-attempt internal cost.')
  }

  const mediaInputs = input.messages.flatMap((message) =>
    message.role === 'system' || message.role === 'user'
      ? message.content.filter((part) => part.type === 'media_reference')
      : [])
  for (const media of mediaInputs) {
    if (!compiledProjectPolicy?.allowedModalities.includes(media.modality)) {
      errors.push(`The exact project model-data policy does not permit ${media.modality} input.`)
    }
    if (media.containsHumanLikeness &&
        compiledProjectPolicy?.likenessConsentState !== 'verified') {
      errors.push('Pre-approval image or video input containing a human likeness requires verified consent authority.')
    }
  }

  const requestedIds = new Set(input.requestedReadOnlyToolIds)
  const availableById = new Map(input.availableReadOnlyTools.map((tool) => [tool.toolId, tool]))
  if (requestedIds.size !== input.requestedReadOnlyToolIds.length ||
      availableById.size !== input.availableReadOnlyTools.length) {
    errors.push('Pre-approval dynamic read-only tools cannot contain duplicate identities.')
  }
  const loadedTools = input.requestedReadOnlyToolIds.map((toolId) => availableById.get(toolId))
  if (loadedTools.some((tool) => !tool)) {
    errors.push('Every requested pre-approval tool must resolve through the bounded capability router.')
  }
  if (input.availableReadOnlyTools.some((tool) => !requestedIds.has(tool.toolId))) {
    errors.push('Pre-approval reasoning accepts only dynamically requested tools, never an unused catalog.')
  }
  const exactLoadedTools = loadedTools.filter(Boolean) as MotionStudioKimiK3DynamicToolDefinitionV1[]
  const toolState = inspectMotionStudioKimiK3ConversationToolState(input.messages, exactLoadedTools)
  errors.push(...toolState.errors)
  if (toolState.unreconciledMutationCallIds.length > 0 || input.messages.some((message) =>
    message.role === 'assistant' && message.toolCalls.some((call) => call.sideEffectClass !== 'read_only'))) {
    errors.push('Pre-approval reasoning can retain only reconciled read-only research and planning tools.')
  }
  errors.push(...validateMotionStudioKimiK3StrictJsonSchema(input.outputJsonSchema))
  if (errors.length > 0) invalid([...new Set(errors)].join(' '))

  const conservativeMaximum = estimateMotionStudioKimiK3MaximumAttemptCost({
    projectedPromptTokens: input.projectedPromptTokens,
    maximumCompletionTokens: input.maximumOutputTokens,
  }).totalInternalCostMicros
  if (conservativeMaximum > budget.maximumAttemptInternalCostMicros ||
      conservativeMaximum > budget.remainingRunInternalCostMicros) {
    blocked('Pre-approval Kimi request exceeds its conservative internal attempt or remaining-run budget.')
  }

  const outputJsonSchemaDigest = sha256CanonicalJson(input.outputJsonSchema)
  const requestPayloadHash = sha256CanonicalJson({
    authorityId: input.authorityId,
    providerSessionId: input.providerSessionId,
    reasoningRunId: input.reasoningRunId,
    logicalArtifactKey: input.logicalArtifactKey,
    attemptId: input.attemptId,
    attemptOrdinal: input.attemptOrdinal,
    retryFrom: input.retryFrom,
    roleId: input.roleId,
    requestedUse: input.requestedUse,
    phase: input.phase,
    planningInputSnapshotId: snapshot.snapshotId,
    planningInputSnapshotDigest: snapshot.snapshotDigest,
    modelDataResolutionId: resolution.resolutionId,
    internalBudgetDigest: budget.budgetDigest,
    modelDataResolutionDigest: resolution.resolutionDigest,
    modelDataPolicyId: compiledProjectPolicy!.policyId,
    internalBudgetAuthorityId: budget.budgetAuthorityId,
    idempotencyKey: input.idempotencyKey,
    projectedPromptTokens: input.projectedPromptTokens,
    maximumOutputTokens: input.maximumOutputTokens,
    outputJsonSchemaDigest,
    messages: input.messages,
    loadedReadOnlyTools: exactLoadedTools,
  })
  const base = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_PREAPPROVAL_SESSION_SCHEMA_VERSION,
    authorityKind: 'pre_approval_storytelling_planning' as const,
    authorityId: input.authorityId,
    workloadScope: MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
    routePolicyVersion: MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
    canonicalRouteId: MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID,
    providerId: 'moonshot' as const,
    exactProviderModelId: MOTION_STUDIO_KIMI_K3_MODEL_ID,
    reasoningEffort: 'max' as const,
    providerSessionId: input.providerSessionId,
    reasoningRunId: input.reasoningRunId,
    logicalArtifactKey: input.logicalArtifactKey,
    attemptId: input.attemptId,
    attemptOrdinal: input.attemptOrdinal,
    retryFrom: structuredClone(input.retryFrom),
    roleId: input.roleId,
    requestedUse: input.requestedUse,
    phase: input.phase,
    workspaceId: resolution.workspaceId,
    projectId: resolution.projectId,
    editSessionId: resolution.editSessionId,
    productionId: resolution.productionId,
    planningInputSnapshotId: snapshot.snapshotId,
    planningInputSnapshotDigest: snapshot.snapshotDigest,
    modelDataResolutionId: resolution.resolutionId,
    modelDataResolutionDigest: resolution.resolutionDigest,
    modelDataPolicyId: compiledProjectPolicy!.policyId,
    compiledKimiProjectPolicyDigest: compiledProjectPolicy!.decisionDigest,
    internalBudgetAuthorityId: budget.budgetAuthorityId,
    internalBudgetDigest: budget.budgetDigest,
    canonicalRateCardVersion: REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION,
    officialPricingProvenanceDigest:
      MOTION_STUDIO_KIMI_K3_OFFICIAL_PRICING_PROVENANCE.provenanceDigest,
    projectedPromptTokens: input.projectedPromptTokens,
    maximumOutputTokens: input.maximumOutputTokens,
    conservativeMaximumInternalCostMicros: conservativeMaximum,
    remainingRunInternalCostMicros: budget.remainingRunInternalCostMicros,
    providerTokenCountPreflightRequired: true as const,
    idempotencyKey: input.idempotencyKey,
    requestPayloadHash,
    outputJsonSchema: structuredClone(input.outputJsonSchema),
    outputJsonSchemaDigest,
    messages: structuredClone(input.messages),
    loadedReadOnlyTools: structuredClone(exactLoadedTools),
    unresolvedReadOnlyToolCallIds: [...toolState.unresolvedToolCallIds],
    state: toolState.unresolvedToolCallIds.length === 0
      ? 'compiled_transport_authority_required' as const
      : 'waiting_for_read_only_tool_results' as const,
    approvedPlanSnapshotId: null,
    approvedExecutionPackageDigest: null,
    creditReservationId: null,
    planApprovalCreated: false as const,
    customerCreditReservationRequired: false as const,
    strictJsonSchema: true as const,
    dynamicReadOnlyToolLoading: true as const,
    fullToolCatalogLoaded: false as const,
    samplingOverridesOmitted: true as const,
    streaming: true as const,
    interruptionPolicy: input.interruptionPolicy,
    reconnectionPolicy: input.reconnectionPolicy,
    reasoningContentProjectAuthority: false as const,
    providerUsageCostRecordingRequired: true as const,
    transportAuthorityState: 'required_not_granted' as const,
    readOnlyToolExecutionAuthorityState: 'separate_controlled_authority_required' as const,
    providerTransportAuthorized: false as const,
    providerCallMade: false as const,
    credentialReadMade: false as const,
    toolExecutionMadeByCompilation: false as const,
    mediaGenerationAuthorized: false as const,
    sourcePreparationAuthorized: false as const,
    planPublicationAuthorized: false as const,
    planApprovalAuthorized: false as const,
    creditReservationAuthorized: false as const,
    timelineMutationAuthorized: false as const,
    renderAuthorized: false as const,
    exportAuthorized: false as const,
    customerChargeCreated: false as const,
    compiledAt: input.compiledAt,
    immutable: true as const,
  }
  return deepFreeze(motionStudioStorytellingPreApprovalKimiSessionV1Schema.parse({
    ...base,
    sessionDigest: sha256CanonicalJson(base),
  }))
}

export function assertMotionStudioStorytellingPreApprovalInputSnapshot(
  snapshot: MotionStudioStorytellingPreApprovalInputSnapshotV1,
): void {
  const parsed = motionStudioStorytellingPreApprovalInputSnapshotV1Schema.safeParse(snapshot)
  if (!parsed.success || snapshot.planApproved || snapshot.approvedPlanSnapshotCreated ||
      snapshot.creditReservationCreated || !snapshot.mutableInputsCapturedReadOnly) {
    blocked('Storytelling pre-approval input snapshot weakened its exact mutable-input boundary.')
  }
  if (snapshot.sourceContext.status === 'not_present' &&
      snapshot.currentPlanningStage === 'planning_setup' &&
      !snapshot.sourceOptionalForIdeaFirstStorytelling) {
    blocked('Source-less pre-approval planning setup is permitted only for an explicit idea-first Storytelling intake.')
  }
  assertDigest(snapshot, 'snapshotDigest', 'Storytelling pre-approval input snapshot')
  assertDeepFreeze(snapshot, 'Storytelling pre-approval input snapshot')
}

export function assertMotionStudioStorytellingPreApprovalBudget(
  budget: MotionStudioStorytellingPreApprovalBudgetV1,
): void {
  const parsed = motionStudioStorytellingPreApprovalBudgetV1Schema.safeParse(budget)
  if (!parsed.success || budget.providerTransportAuthorized || budget.customerChargeAuthorized ||
      budget.walletMutationAuthorized || budget.customerPriceIncluded ||
      budget.customerCreditsIncluded || budget.serviceFeeIncluded ||
      budget.customerCreditReservationRequired || !budget.durableRuntimeEnforcementRequired) {
    blocked('Storytelling pre-approval budget weakened its internal-only or runtime-enforcement boundary.')
  }
  const maximum = estimateMotionStudioKimiK3MaximumAttemptCost({
    projectedPromptTokens: budget.maximumPromptTokensPerAttempt,
    maximumCompletionTokens: budget.maximumOutputTokensPerAttempt,
  }).totalInternalCostMicros
  if (maximum > budget.maximumAttemptInternalCostMicros ||
      budget.maximumAttemptInternalCostMicros > budget.remainingRunInternalCostMicros) {
    blocked('Storytelling pre-approval budget cannot cover its conservative Kimi attempt maximum.')
  }
  assertDigest(budget, 'budgetDigest', 'Storytelling pre-approval budget')
  assertDeepFreeze(budget, 'Storytelling pre-approval budget')
}

export function assertMotionStudioStorytellingPreApprovalKimiSession(
  session: MotionStudioStorytellingPreApprovalKimiSessionV1,
): void {
  const parsed = motionStudioStorytellingPreApprovalKimiSessionV1Schema.safeParse(session)
  if (!parsed.success ||
      session.schemaVersion !== MOTION_STUDIO_STORYTELLING_PREAPPROVAL_SESSION_SCHEMA_VERSION ||
      session.authorityKind !== 'pre_approval_storytelling_planning' ||
      session.workloadScope !== MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE ||
      session.routePolicyVersion !== MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION ||
      session.canonicalRouteId !== MOTION_STUDIO_KIMI_K3_CANONICAL_ROUTE_ID ||
      session.exactProviderModelId !== MOTION_STUDIO_KIMI_K3_MODEL_ID ||
      session.providerId !== 'moonshot' || session.reasoningEffort !== 'max' ||
      session.approvedPlanSnapshotId !== null ||
      session.approvedExecutionPackageDigest !== null ||
      session.creditReservationId !== null || session.planApprovalCreated ||
      session.customerCreditReservationRequired || session.providerTransportAuthorized ||
      session.providerCallMade || session.credentialReadMade ||
      session.toolExecutionMadeByCompilation || session.mediaGenerationAuthorized ||
      session.sourcePreparationAuthorized || session.planPublicationAuthorized ||
      session.planApprovalAuthorized || session.creditReservationAuthorized ||
      session.timelineMutationAuthorized || session.renderAuthorized ||
      session.exportAuthorized || session.customerChargeCreated) {
    blocked('Storytelling pre-approval Kimi session weakened its planning-only or non-execution boundary.')
  }
  const toolState = inspectMotionStudioKimiK3ConversationToolState(
    session.messages,
    session.loadedReadOnlyTools,
  )
  if (toolState.errors.length > 0 || toolState.unreconciledMutationCallIds.length > 0 ||
      sha256CanonicalJson(toolState.unresolvedToolCallIds) !==
        sha256CanonicalJson(session.unresolvedReadOnlyToolCallIds) ||
      session.loadedReadOnlyTools.some((tool) => tool.sideEffectClass !== 'read_only') ||
      validateMotionStudioKimiK3StrictJsonSchema(session.outputJsonSchema).length > 0 ||
      sha256CanonicalJson(session.outputJsonSchema) !== session.outputJsonSchemaDigest) {
    blocked('Storytelling pre-approval Kimi session failed tool or strict-output reconciliation.')
  }
  const expectedState = toolState.unresolvedToolCallIds.length === 0
    ? 'compiled_transport_authority_required'
    : 'waiting_for_read_only_tool_results'
  const expectedMaximum = estimateMotionStudioKimiK3MaximumAttemptCost({
    projectedPromptTokens: session.projectedPromptTokens,
    maximumCompletionTokens: session.maximumOutputTokens,
  }).totalInternalCostMicros
  if (session.state !== expectedState ||
      !session.strictJsonSchema || !session.dynamicReadOnlyToolLoading ||
      session.fullToolCatalogLoaded || !session.samplingOverridesOmitted ||
      !session.streaming || session.interruptionPolicy !== 'checkpoint_then_reconcile' ||
      session.reconnectionPolicy !== 'restore_exact_session_no_automatic_resubmit' ||
      session.reasoningContentProjectAuthority || !session.providerUsageCostRecordingRequired ||
      session.transportAuthorityState !== 'required_not_granted' ||
      session.readOnlyToolExecutionAuthorityState !== 'separate_controlled_authority_required' ||
      session.canonicalRateCardVersion !== REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION ||
      session.officialPricingProvenanceDigest !==
        MOTION_STUDIO_KIMI_K3_OFFICIAL_PRICING_PROVENANCE.provenanceDigest ||
      session.conservativeMaximumInternalCostMicros !== expectedMaximum ||
      expectedMaximum > session.remainingRunInternalCostMicros ||
      (session.attemptOrdinal === 1 && session.retryFrom !== null) ||
      (session.attemptOrdinal === 2 &&
        (session.retryFrom === null || session.retryFrom.priorAttemptOrdinal !== 1 ||
          !session.retryFrom.providerOutcomeReconciled ||
          !session.retryFrom.priorToolSideEffectsReconciled))) {
    blocked('Storytelling pre-approval Kimi session weakened its retry, cost, stream, schema, or transport contract.')
  }
  const expectedRequestPayloadHash = sha256CanonicalJson({
    authorityId: session.authorityId,
    providerSessionId: session.providerSessionId,
    reasoningRunId: session.reasoningRunId,
    logicalArtifactKey: session.logicalArtifactKey,
    attemptId: session.attemptId,
    attemptOrdinal: session.attemptOrdinal,
    retryFrom: session.retryFrom,
    roleId: session.roleId,
    requestedUse: session.requestedUse,
    phase: session.phase,
    planningInputSnapshotId: session.planningInputSnapshotId,
    planningInputSnapshotDigest: session.planningInputSnapshotDigest,
    modelDataResolutionId: session.modelDataResolutionId,
    internalBudgetDigest: session.internalBudgetDigest,
    modelDataResolutionDigest: session.modelDataResolutionDigest,
    modelDataPolicyId: session.modelDataPolicyId,
    internalBudgetAuthorityId: session.internalBudgetAuthorityId,
    idempotencyKey: session.idempotencyKey,
    projectedPromptTokens: session.projectedPromptTokens,
    maximumOutputTokens: session.maximumOutputTokens,
    outputJsonSchemaDigest: session.outputJsonSchemaDigest,
    messages: session.messages,
    loadedReadOnlyTools: session.loadedReadOnlyTools,
  })
  if (session.requestPayloadHash !== expectedRequestPayloadHash) {
    blocked('Storytelling pre-approval Kimi session lost its exact request-payload identity.')
  }
  assertDigest(session, 'sessionDigest', 'Storytelling pre-approval Kimi session')
  assertDeepFreeze(session, 'Storytelling pre-approval Kimi session')
}

function assertDigest<T extends object>(value: T, field: keyof T, label: string): void {
  const expected = value[field]
  const base = { ...(value as Record<string, unknown>) }
  delete base[field as string]
  if (typeof expected !== 'string' || sha256CanonicalJson(base) !== expected) {
    blocked(`${label} failed immutable digest verification.`)
  }
}

function assertDeepFreeze(value: unknown, label: string): void {
  if (!isDeeplyFrozen(value)) blocked(`${label} must remain deeply immutable in active memory.`)
}

function isDeeplyFrozen(value: unknown): boolean {
  if (!value || typeof value !== 'object') return true
  if (!Object.isFrozen(value)) return false
  return Object.values(value as Record<string, unknown>).every(isDeeplyFrozen)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    if (!Object.isFrozen(value)) Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
