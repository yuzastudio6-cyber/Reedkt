import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioKimiK3ProviderSession,
  compileMotionStudioKimiK3ProviderSession,
  motionStudioKimiK3SessionCompileInputV1Schema,
  type MotionStudioKimiK3ProviderSessionRequestV1,
} from './kimi-k3-session-adapter'
import {
  assertMotionStudioStorytellingModelDataResolution,
  motionStudioStorytellingModelDataResolutionV1Schema,
  type MotionStudioStorytellingModelDataResolutionV1,
} from './storytelling-model-data-policy'
import {
  MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
  MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
} from './storytelling-reasoning-policy'

export const MOTION_STUDIO_STORYTELLING_MODEL_DATA_SESSION_BINDING_SCHEMA_VERSION =
  'motion-studio.storytelling-model-data-session-binding.v1' as const

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))

export const motionStudioStorytellingModelDataSessionBindingInputV1Schema = z.object({
  bindingId: stableId,
  resolution: motionStudioStorytellingModelDataResolutionV1Schema,
  sessionCompileInput: motionStudioKimiK3SessionCompileInputV1Schema,
}).strict()

export type MotionStudioStorytellingModelDataSessionBindingInputV1 = z.infer<
  typeof motionStudioStorytellingModelDataSessionBindingInputV1Schema
>

export interface MotionStudioStorytellingModelDataSessionBindingV1 {
  schemaVersion: typeof MOTION_STUDIO_STORYTELLING_MODEL_DATA_SESSION_BINDING_SCHEMA_VERSION
  bindingId: string
  workloadScope: typeof MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE
  routePolicyVersion: typeof MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION
  workspaceId: string
  projectId: string
  editSessionId: string
  productionId: string
  roleId: MotionStudioKimiK3ProviderSessionRequestV1['roleId']
  requestedUse: MotionStudioKimiK3ProviderSessionRequestV1['requestedUse']
  modelDataResolution: MotionStudioStorytellingModelDataResolutionV1
  providerSession: MotionStudioKimiK3ProviderSessionRequestV1
  modelDataResolutionDigest: string
  projectPolicyDigest: string
  requestClassificationDigest: string
  kimiRouteAssuranceDigest: string
  compiledKimiProjectPolicyDigest: string
  providerSessionRequestDigest: string
  routeEligibility: 'allowed'
  modelDataPolicyEnforced: true
  transportAuthorityState: 'required_not_granted'
  transportAuthorized: false
  providerCallMade: false
  credentialReadMade: false
  toolExecutionMade: false
  customerChargeCreated: false
  bindingDigest: string
  immutable: true
}

export function compileMotionStudioStorytellingModelDataBoundKimiSession(
  inputValue: MotionStudioStorytellingModelDataSessionBindingInputV1,
): MotionStudioStorytellingModelDataSessionBindingV1 {
  assertMotionStudioStorytellingModelDataResolution(inputValue.resolution)
  const input = motionStudioStorytellingModelDataSessionBindingInputV1Schema.parse(inputValue)
  const resolution = input.resolution
  const sessionInput = input.sessionCompileInput
  const kimiRoute = resolution.routeDecisions.find(
    (route) => route.policyRouteId === 'kimi_k3_primary',
  )
  const compiledPolicy = resolution.compiledKimiProjectDataPolicy

  if (!kimiRoute || kimiRoute.eligibility !== 'allowed') {
    blocked('The exact project model-data resolution does not permit the Kimi primary route.')
  }
  if (
    resolution.disposition !== 'kimi_primary_with_gpt_fallback' &&
    resolution.disposition !== 'kimi_primary_only'
  ) {
    blocked('A Kimi provider session requires an explicit Kimi-primary Storytelling disposition.')
  }
  if (!compiledPolicy || compiledPolicy.decision !== 'moonshot_allowed') {
    blocked('The exact model-data resolution did not compile an allowed Kimi project policy.')
  }

  for (const field of ['workspaceId', 'projectId', 'editSessionId', 'productionId'] as const) {
    if (sessionInput[field] !== resolution[field]) {
      blocked(`Kimi session ${field} does not match the exact model-data resolution.`)
    }
  }
  if (sessionInput.roleId !== resolution.roleId || sessionInput.requestedUse !== resolution.requestedUse) {
    blocked('Kimi session role and requested use must match the exact classified model-data request.')
  }
  if (
    sessionInput.projectDataPolicy.decisionDigest !== compiledPolicy.decisionDigest ||
    sha256CanonicalJson(sessionInput.projectDataPolicy) !== sha256CanonicalJson(compiledPolicy)
  ) {
    blocked('Kimi session project policy must be the exact policy compiled by the model-data resolution.')
  }

  const providerSession = compileMotionStudioKimiK3ProviderSession(sessionInput)
  if (
    providerSession.projectDataPolicyDigest !== compiledPolicy.decisionDigest ||
    providerSession.transportAuthorized ||
    providerSession.providerCallMade ||
    providerSession.credentialReadMade ||
    providerSession.toolExecutionMade ||
    providerSession.customerChargeCreated
  ) {
    blocked('Compiled Kimi session weakened the exact model-data or non-execution boundary.')
  }

  const base = {
    schemaVersion: MOTION_STUDIO_STORYTELLING_MODEL_DATA_SESSION_BINDING_SCHEMA_VERSION,
    bindingId: input.bindingId,
    workloadScope: MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
    routePolicyVersion: MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
    workspaceId: resolution.workspaceId,
    projectId: resolution.projectId,
    editSessionId: resolution.editSessionId,
    productionId: resolution.productionId,
    roleId: resolution.roleId,
    requestedUse: resolution.requestedUse,
    modelDataResolution: structuredClone(resolution),
    providerSession: structuredClone(providerSession),
    modelDataResolutionDigest: resolution.resolutionDigest,
    projectPolicyDigest: resolution.projectPolicyDigest,
    requestClassificationDigest: resolution.requestClassificationDigest,
    kimiRouteAssuranceDigest: kimiRoute.assuranceDigest,
    compiledKimiProjectPolicyDigest: compiledPolicy.decisionDigest,
    providerSessionRequestDigest: providerSession.sessionRequestDigest,
    routeEligibility: 'allowed' as const,
    modelDataPolicyEnforced: true as const,
    transportAuthorityState: 'required_not_granted' as const,
    transportAuthorized: false as const,
    providerCallMade: false as const,
    credentialReadMade: false as const,
    toolExecutionMade: false as const,
    customerChargeCreated: false as const,
    immutable: true as const,
  }
  return deepFreeze({ ...base, bindingDigest: sha256CanonicalJson(base) })
}

export function assertMotionStudioStorytellingModelDataSessionBinding(
  binding: MotionStudioStorytellingModelDataSessionBindingV1,
): void {
  if (
    binding.schemaVersion !== MOTION_STUDIO_STORYTELLING_MODEL_DATA_SESSION_BINDING_SCHEMA_VERSION ||
    binding.workloadScope !== MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE ||
    binding.routePolicyVersion !== MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION ||
    binding.routeEligibility !== 'allowed' ||
    !binding.modelDataPolicyEnforced ||
    binding.transportAuthorityState !== 'required_not_granted' ||
    binding.transportAuthorized ||
    binding.providerCallMade ||
    binding.credentialReadMade ||
    binding.toolExecutionMade ||
    binding.customerChargeCreated ||
    !binding.immutable
  ) {
    blocked('Storytelling model-data session binding weakened its exact policy or non-execution boundary.')
  }
  assertMotionStudioStorytellingModelDataResolution(binding.modelDataResolution)
  assertMotionStudioKimiK3ProviderSession(binding.providerSession)
  const resolution = binding.modelDataResolution
  const session = binding.providerSession
  const kimiRoute = resolution.routeDecisions.find(
    (route) => route.policyRouteId === 'kimi_k3_primary',
  )
  const compiledPolicy = resolution.compiledKimiProjectDataPolicy
  if (
    !kimiRoute ||
    kimiRoute.eligibility !== 'allowed' ||
    !compiledPolicy ||
    compiledPolicy.decision !== 'moonshot_allowed' ||
    (resolution.disposition !== 'kimi_primary_with_gpt_fallback' &&
      resolution.disposition !== 'kimi_primary_only')
  ) {
    blocked('Storytelling model-data session binding no longer contains an eligible Kimi resolution.')
  }
  if (
    binding.workspaceId !== resolution.workspaceId ||
    binding.projectId !== resolution.projectId ||
    binding.editSessionId !== resolution.editSessionId ||
    binding.productionId !== resolution.productionId ||
    binding.roleId !== resolution.roleId ||
    binding.requestedUse !== resolution.requestedUse ||
    session.workspaceId !== resolution.workspaceId ||
    session.projectId !== resolution.projectId ||
    session.editSessionId !== resolution.editSessionId ||
    session.productionId !== resolution.productionId ||
    session.roleId !== resolution.roleId ||
    session.requestedUse !== resolution.requestedUse
  ) {
    blocked('Storytelling model-data session binding lost its exact scope, role, or request identity.')
  }
  if (
    binding.modelDataResolutionDigest !== resolution.resolutionDigest ||
    binding.projectPolicyDigest !== resolution.projectPolicyDigest ||
    binding.requestClassificationDigest !== resolution.requestClassificationDigest ||
    binding.kimiRouteAssuranceDigest !== kimiRoute.assuranceDigest ||
    binding.compiledKimiProjectPolicyDigest !== compiledPolicy.decisionDigest ||
    binding.providerSessionRequestDigest !== session.sessionRequestDigest ||
    session.projectDataPolicyDigest !== compiledPolicy.decisionDigest
  ) {
    blocked('Storytelling model-data session binding lost an exact policy, assurance, or session digest.')
  }
  assertOwnDigest(binding, 'bindingDigest', 'Storytelling model-data session binding')
  if (!isDeeplyFrozen(binding)) {
    blocked('Storytelling model-data session binding must remain deeply immutable in active memory.')
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
