import { z } from 'zod'

import { REEDITPRO_REASONING_FALLBACK_TRIGGERS } from '../../../src/types/reasoning-model-routing'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioStorytellingModelDataResolution,
  motionStudioStorytellingModelDataResolutionV1Schema,
  type MotionStudioStorytellingModelDataResolutionV1,
} from './storytelling-model-data-policy'
import {
  assertMotionStudioStorytellingModelDataSessionBinding,
  type MotionStudioStorytellingModelDataSessionBindingV1,
} from './storytelling-model-data-session-binding'
import {
  MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
  MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
  motionStudioStorytellingFallbackInputV1Schema,
  resolveMotionStudioStorytellingGptFallback,
  type MotionStudioStorytellingFallbackInputV1,
  type MotionStudioStorytellingFallbackResolution,
} from './storytelling-reasoning-policy'

export const MOTION_STUDIO_STORYTELLING_PRIOR_KIMI_ATTEMPT_SCHEMA_VERSION =
  'motion-studio.storytelling-prior-kimi-attempt.v1' as const
export const MOTION_STUDIO_STORYTELLING_MODEL_DATA_FALLBACK_BINDING_SCHEMA_VERSION =
  'motion-studio.storytelling-model-data-fallback-binding.v1' as const

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)

const priorKimiAttemptDigestBaseSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_PRIOR_KIMI_ATTEMPT_SCHEMA_VERSION),
  routePolicyVersion: z.literal(MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION),
  routeId: z.literal('kimi_k3_primary'),
  reasoningRunId: stableId,
  jobId: stableId,
  attemptId: stableId,
  providerSessionRequestDigest: digest,
  approvedPlanSnapshotId: stableId,
  approvedExecutionPackageDigest: digest,
  creditReservationId: stableId,
  costEstimateItemId: stableId,
  maximumAuthorizedInternalCostMicros: z.number().int().positive().safe(),
  idempotencyKey: stableId,
  requestPayloadHash: digest,
  failureTrigger: z.enum(REEDITPRO_REASONING_FALLBACK_TRIGGERS),
  terminalOutcome: z.enum(['failed', 'completed_rejected']),
  attemptResultDigest: digest,
  terminal: z.literal(true),
  toolSideEffectsReconciled: z.literal(true),
  unknownOutcomeReconciled: z.literal(true),
  terminalAt: z.string().datetime({ offset: true }),
  immutable: z.literal(true),
}).strict()

export const motionStudioStorytellingPriorKimiAttemptV1Schema =
  priorKimiAttemptDigestBaseSchema.extend({ attemptEvidenceDigest: digest }).strict()

export type MotionStudioStorytellingPriorKimiAttemptV1 = z.infer<
  typeof motionStudioStorytellingPriorKimiAttemptV1Schema
>

export type MotionStudioStorytellingPriorKimiAttemptDraftV1 = Omit<
  MotionStudioStorytellingPriorKimiAttemptV1,
  'schemaVersion' | 'attemptEvidenceDigest' | 'immutable'
>

export interface MotionStudioStorytellingModelDataFallbackBindingInputV1 {
  bindingId: string
  resolution: MotionStudioStorytellingModelDataResolutionV1
  kimiSessionBinding: MotionStudioStorytellingModelDataSessionBindingV1
  priorKimiAttempt: MotionStudioStorytellingPriorKimiAttemptV1
  fallbackInput: MotionStudioStorytellingFallbackInputV1
}

export interface MotionStudioStorytellingModelDataFallbackBindingV1 {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_MODEL_DATA_FALLBACK_BINDING_SCHEMA_VERSION
  bindingId: string
  workloadScope: typeof MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE
  routePolicyVersion: typeof MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  roleId: MotionStudioStorytellingModelDataResolutionV1['roleId']
  requestedUse: MotionStudioStorytellingModelDataResolutionV1['requestedUse']
  modelDataResolution: MotionStudioStorytellingModelDataResolutionV1
  kimiSessionBinding: MotionStudioStorytellingModelDataSessionBindingV1
  priorKimiAttempt: MotionStudioStorytellingPriorKimiAttemptV1
  fallbackInput: MotionStudioStorytellingFallbackInputV1
  fallbackResolution: MotionStudioStorytellingFallbackResolution
  modelDataResolutionDigest: string
  kimiSessionBindingDigest: string
  kimiProviderSessionRequestDigest: string
  priorKimiAttemptEvidenceDigest: string
  gptRouteAssuranceDigest: string
  projectPolicyDigest: string
  requestClassificationDigest: string
  fallbackStatus: 'policy_eligible_runtime_blocked'
  modelDataPolicyEnforced: true
  priorAttemptTerminalAndReconciled: true
  executionAuthorized: false
  providerCallMadeByBinding: false
  credentialReadMadeByBinding: false
  toolExecutionMadeByBinding: false
  customerChargeCreatedByBinding: false
  bindingDigest: string
  immutable: true
}

export function createMotionStudioStorytellingPriorKimiAttempt(
  input: MotionStudioStorytellingPriorKimiAttemptDraftV1,
): MotionStudioStorytellingPriorKimiAttemptV1 {
  const base = priorKimiAttemptDigestBaseSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_PRIOR_KIMI_ATTEMPT_SCHEMA_VERSION,
    ...structuredClone(input),
    immutable: true,
  })
  return deepFreeze(motionStudioStorytellingPriorKimiAttemptV1Schema.parse({
    ...base,
    attemptEvidenceDigest: sha256CanonicalJson(base),
  }))
}

export function compileMotionStudioStorytellingModelDataBoundGptFallback(
  inputValue: MotionStudioStorytellingModelDataFallbackBindingInputV1,
): MotionStudioStorytellingModelDataFallbackBindingV1 {
  const bindingId = stableId.parse(inputValue.bindingId)
  assertMotionStudioStorytellingModelDataResolution(inputValue.resolution)
  assertMotionStudioStorytellingModelDataSessionBinding(inputValue.kimiSessionBinding)
  assertMotionStudioStorytellingPriorKimiAttempt(inputValue.priorKimiAttempt)
  const resolution = motionStudioStorytellingModelDataResolutionV1Schema.parse(
    inputValue.resolution,
  )
  const fallbackInput = motionStudioStorytellingFallbackInputV1Schema.parse(
    inputValue.fallbackInput,
  )
  const kimiSessionBinding = inputValue.kimiSessionBinding
  const priorAttempt = inputValue.priorKimiAttempt
  const gptRoute = resolution.routeDecisions.find(
    (route) => route.policyRouteId === 'gpt_5_6_sol_fallback',
  )

  if (
    resolution.disposition !== 'kimi_primary_with_gpt_fallback' ||
    resolution.gptPolicyDecision !== 'gpt_allowed' ||
    gptRoute?.eligibility !== 'allowed'
  ) {
    blocked('Kimi-to-GPT fallback requires the exact both-routes-allowed model-data resolution.')
  }
  if (
    kimiSessionBinding.modelDataResolutionDigest !== resolution.resolutionDigest ||
    sha256CanonicalJson(kimiSessionBinding.modelDataResolution) !==
      sha256CanonicalJson(resolution)
  ) {
    blocked('Kimi session binding must contain the exact model-data resolution used for fallback.')
  }
  assertSameScope(resolution, kimiSessionBinding)
  assertFallbackAuthorityMatchesSession(fallbackInput, kimiSessionBinding)
  assertPriorAttemptMatchesSession(priorAttempt, kimiSessionBinding, fallbackInput)
  if (fallbackInput.modelDataPolicyDecision !== resolution.gptPolicyDecision) {
    blocked('Fallback model-data decision must come from the exact project resolution.')
  }

  const fallbackResolution = resolveMotionStudioStorytellingGptFallback(fallbackInput)
  if (
    !fallbackResolution.policyEligible ||
    fallbackResolution.executionAuthorized ||
    fallbackResolution.intendedFallbackPolicyRouteId !== 'gpt_5_6_sol_fallback' ||
    fallbackResolution.intendedFallbackProviderModelId !== 'gpt-5.6-sol' ||
    fallbackResolution.canonicalFallbackRouteId !== null ||
    fallbackResolution.providerCallMade ||
    fallbackResolution.credentialReadMade ||
    fallbackResolution.toolSideEffectMade ||
    fallbackResolution.customerChargeCreated
  ) {
    blocked('Fallback resolution is not exactly policy eligible and runtime blocked.')
  }

  const base = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_MODEL_DATA_FALLBACK_BINDING_SCHEMA_VERSION,
    bindingId,
    workloadScope: MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
    routePolicyVersion: MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
    workspaceId: resolution.workspaceId,
    projectId: resolution.projectId,
    editSessionId: resolution.editSessionId,
    productionId: resolution.productionId,
    roleId: resolution.roleId,
    requestedUse: resolution.requestedUse,
    modelDataResolution: structuredClone(resolution),
    kimiSessionBinding: structuredClone(kimiSessionBinding),
    priorKimiAttempt: structuredClone(priorAttempt),
    fallbackInput: structuredClone(fallbackInput),
    fallbackResolution: structuredClone(fallbackResolution),
    modelDataResolutionDigest: resolution.resolutionDigest,
    kimiSessionBindingDigest: kimiSessionBinding.bindingDigest,
    kimiProviderSessionRequestDigest: kimiSessionBinding.providerSessionRequestDigest,
    priorKimiAttemptEvidenceDigest: priorAttempt.attemptEvidenceDigest,
    gptRouteAssuranceDigest: gptRoute.assuranceDigest,
    projectPolicyDigest: resolution.projectPolicyDigest,
    requestClassificationDigest: resolution.requestClassificationDigest,
    fallbackStatus: 'policy_eligible_runtime_blocked' as const,
    modelDataPolicyEnforced: true as const,
    priorAttemptTerminalAndReconciled: true as const,
    executionAuthorized: false as const,
    providerCallMadeByBinding: false as const,
    credentialReadMadeByBinding: false as const,
    toolExecutionMadeByBinding: false as const,
    customerChargeCreatedByBinding: false as const,
    immutable: true as const,
  }
  const binding = deepFreeze({ ...base, bindingDigest: sha256CanonicalJson(base) })
  assertMotionStudioStorytellingModelDataFallbackBinding(binding)
  return binding
}

export function assertMotionStudioStorytellingPriorKimiAttempt(
  attempt: MotionStudioStorytellingPriorKimiAttemptV1,
): void {
  const parsed = motionStudioStorytellingPriorKimiAttemptV1Schema.safeParse(attempt)
  if (!parsed.success) blocked('Prior Kimi attempt failed strict terminal-evidence validation.')
  assertOwnDigest(parsed.data, 'attemptEvidenceDigest', 'Prior Kimi attempt')
  if (!isDeeplyFrozen(attempt)) {
    blocked('Prior Kimi attempt evidence must remain deeply immutable in active memory.')
  }
}

export function assertMotionStudioStorytellingModelDataFallbackBinding(
  binding: MotionStudioStorytellingModelDataFallbackBindingV1,
): void {
  if (
    binding.schemaVersion !==
      MOTION_STUDIO_STORYTELLING_MODEL_DATA_FALLBACK_BINDING_SCHEMA_VERSION ||
    binding.workloadScope !== MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE ||
    binding.routePolicyVersion !== MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION ||
    binding.fallbackStatus !== 'policy_eligible_runtime_blocked' ||
    !binding.modelDataPolicyEnforced ||
    !binding.priorAttemptTerminalAndReconciled ||
    binding.executionAuthorized ||
    binding.providerCallMadeByBinding ||
    binding.credentialReadMadeByBinding ||
    binding.toolExecutionMadeByBinding ||
    binding.customerChargeCreatedByBinding ||
    !binding.immutable
  ) {
    blocked('Storytelling fallback binding weakened its policy, reconciliation, or non-execution boundary.')
  }
  assertMotionStudioStorytellingModelDataResolution(binding.modelDataResolution)
  assertMotionStudioStorytellingModelDataSessionBinding(binding.kimiSessionBinding)
  assertMotionStudioStorytellingPriorKimiAttempt(binding.priorKimiAttempt)
  const resolution = binding.modelDataResolution
  const sessionBinding = binding.kimiSessionBinding
  const priorAttempt = binding.priorKimiAttempt
  const fallbackInput = motionStudioStorytellingFallbackInputV1Schema.parse(
    binding.fallbackInput,
  )
  const gptRoute = resolution.routeDecisions.find(
    (route) => route.policyRouteId === 'gpt_5_6_sol_fallback',
  )
  if (
    resolution.disposition !== 'kimi_primary_with_gpt_fallback' ||
    resolution.gptPolicyDecision !== 'gpt_allowed' ||
    gptRoute?.eligibility !== 'allowed'
  ) {
    blocked('Storytelling fallback binding no longer contains an eligible GPT route after Kimi.')
  }
  assertSameScope(resolution, sessionBinding)
  assertFallbackAuthorityMatchesSession(fallbackInput, sessionBinding)
  assertPriorAttemptMatchesSession(priorAttempt, sessionBinding, fallbackInput)
  const expectedResolution = resolveMotionStudioStorytellingGptFallback(fallbackInput)
  if (
    !expectedResolution.policyEligible ||
    expectedResolution.executionAuthorized ||
    sha256CanonicalJson(binding.fallbackResolution) !==
      sha256CanonicalJson(expectedResolution)
  ) {
    blocked('Storytelling fallback binding no longer contains the exact runtime-blocked resolution.')
  }
  if (
    binding.workspaceId !== resolution.workspaceId ||
    binding.projectId !== resolution.projectId ||
    binding.editSessionId !== resolution.editSessionId ||
    binding.productionId !== resolution.productionId ||
    binding.roleId !== resolution.roleId ||
    binding.requestedUse !== resolution.requestedUse ||
    binding.modelDataResolutionDigest !== resolution.resolutionDigest ||
    binding.kimiSessionBindingDigest !== sessionBinding.bindingDigest ||
    binding.kimiProviderSessionRequestDigest !== sessionBinding.providerSessionRequestDigest ||
    binding.priorKimiAttemptEvidenceDigest !== priorAttempt.attemptEvidenceDigest ||
    binding.gptRouteAssuranceDigest !== gptRoute.assuranceDigest ||
    binding.projectPolicyDigest !== resolution.projectPolicyDigest ||
    binding.requestClassificationDigest !== resolution.requestClassificationDigest ||
    fallbackInput.modelDataPolicyDecision !== resolution.gptPolicyDecision ||
    sessionBinding.modelDataResolutionDigest !== resolution.resolutionDigest ||
    sha256CanonicalJson(sessionBinding.modelDataResolution) !== sha256CanonicalJson(resolution)
  ) {
    blocked('Storytelling fallback binding lost an exact scope, policy, attempt, session, or route digest.')
  }
  assertOwnDigest(binding, 'bindingDigest', 'Storytelling model-data fallback binding')
  if (!isDeeplyFrozen(binding)) {
    blocked('Storytelling model-data fallback binding must remain deeply immutable in active memory.')
  }
}

function assertSameScope(
  resolution: MotionStudioStorytellingModelDataResolutionV1,
  binding: MotionStudioStorytellingModelDataSessionBindingV1,
): void {
  for (const field of [
    'workspaceId',
    'projectId',
    'editSessionId',
    'productionId',
    'roleId',
    'requestedUse',
  ] as const) {
    if (resolution[field] !== binding[field]) {
      blocked(`Fallback ${field} must match the exact model-data Kimi session binding.`)
    }
  }
}

function assertFallbackAuthorityMatchesSession(
  fallback: MotionStudioStorytellingFallbackInputV1,
  binding: MotionStudioStorytellingModelDataSessionBindingV1,
): void {
  const session = binding.providerSession
  if (
    fallback.roleId !== binding.roleId ||
    fallback.approvedPlanSnapshotId !== session.approvedPlanSnapshotId ||
    fallback.approvedExecutionPackageDigest !== session.approvedExecutionPackageDigest ||
    fallback.creditReservationId !== session.creditReservationId ||
    fallback.costEstimateItemId !== session.costEstimateItemId ||
    fallback.maximumAuthorizedInternalCostMicros !==
      session.maximumAuthorizedInternalCostMicros ||
    fallback.idempotencyKey !== session.idempotencyKey ||
    fallback.requestPayloadHash !== session.approvedRequestPayloadHash ||
    fallback.previousAttemptRouteId !== session.canonicalRouteId ||
    !fallback.previousAttemptTerminal ||
    !fallback.previousToolSideEffectsReconciled
  ) {
    blocked('Fallback authority must match the exact prior Kimi session and terminal state.')
  }
}

function assertPriorAttemptMatchesSession(
  attempt: MotionStudioStorytellingPriorKimiAttemptV1,
  binding: MotionStudioStorytellingModelDataSessionBindingV1,
  fallback: MotionStudioStorytellingFallbackInputV1,
): void {
  const session = binding.providerSession
  if (
    attempt.reasoningRunId !== session.reasoningRunId ||
    attempt.jobId !== session.jobId ||
    attempt.attemptId !== session.attemptId ||
    attempt.providerSessionRequestDigest !== session.sessionRequestDigest ||
    attempt.approvedPlanSnapshotId !== session.approvedPlanSnapshotId ||
    attempt.approvedExecutionPackageDigest !== session.approvedExecutionPackageDigest ||
    attempt.creditReservationId !== session.creditReservationId ||
    attempt.costEstimateItemId !== session.costEstimateItemId ||
    attempt.maximumAuthorizedInternalCostMicros !==
      session.maximumAuthorizedInternalCostMicros ||
    attempt.idempotencyKey !== session.idempotencyKey ||
    attempt.requestPayloadHash !== session.approvedRequestPayloadHash ||
    attempt.failureTrigger !== fallback.failureTrigger ||
    !attempt.terminal ||
    !attempt.toolSideEffectsReconciled ||
    !attempt.unknownOutcomeReconciled
  ) {
    blocked('Prior Kimi terminal evidence must match the exact session, authority, and fallback trigger.')
  }
}

function assertOwnDigest<T extends object>(
  value: T,
  digestField: keyof T,
  label: string,
): void {
  const expected = value[digestField]
  const base = { ...(value as Record<string, unknown>) }
  delete base[digestField as string]
  if (typeof expected !== 'string' || sha256CanonicalJson(base) !== expected) {
    blocked(`${label} failed immutable digest verification.`)
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    if (!Object.isFrozen(value)) Object.freeze(value)
  }
  return value
}

function isDeeplyFrozen(value: unknown): boolean {
  if (!value || typeof value !== 'object') return true
  if (!Object.isFrozen(value)) return false
  return Object.values(value as Record<string, unknown>).every(isDeeplyFrozen)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
