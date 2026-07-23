import { z } from 'zod'

import { REEDITPRO_REQUESTED_MODEL_USES } from '../../../src/types/model-role-routing'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  motionStudioKimiK3ProjectDataPolicyV1Schema,
  type MotionStudioKimiK3ProjectDataPolicyV1,
} from './kimi-k3-session-adapter'
import {
  MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID,
  MOTION_STUDIO_STORYTELLING_PRIMARY_MODEL_ID,
  MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS,
  MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
  MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
} from './storytelling-reasoning-policy'

export const MOTION_STUDIO_STORYTELLING_PROJECT_MODEL_DATA_POLICY_SCHEMA_VERSION =
  'motion-studio.storytelling-project-model-data-policy.v1' as const
export const MOTION_STUDIO_STORYTELLING_MODEL_DATA_REQUEST_SCHEMA_VERSION =
  'motion-studio.storytelling-model-data-request.v1' as const
export const MOTION_STUDIO_STORYTELLING_ROUTE_ASSURANCE_SCHEMA_VERSION =
  'motion-studio.storytelling-route-assurance.v1' as const
export const MOTION_STUDIO_STORYTELLING_MODEL_DATA_RESOLUTION_SCHEMA_VERSION =
  'motion-studio.storytelling-model-data-resolution.v1' as const

export const MOTION_STUDIO_STORYTELLING_MODEL_DATA_ROUTE_IDS = [
  'kimi_k3_primary',
  'gpt_5_6_sol_fallback',
] as const

export type MotionStudioStorytellingModelDataRouteId =
  (typeof MOTION_STUDIO_STORYTELLING_MODEL_DATA_ROUTE_IDS)[number]

export const MOTION_STUDIO_STORYTELLING_MODEL_DATA_REASON_CODES = [
  'route_allowed',
  'organization_policy_missing',
  'organization_policy_expired',
  'organization_policy_conflict',
  'project_policy_evidence_missing',
  'project_policy_evidence_expired',
  'project_policy_evidence_conflict',
  'project_policy_not_yet_effective',
  'request_classification_not_yet_effective',
  'provider_not_permitted',
  'processing_region_not_permitted',
  'route_assurance_missing',
  'route_assurance_expired',
  'route_assurance_conflict',
  'route_assurance_not_yet_valid',
  'project_modality_not_permitted',
  'route_modality_not_supported',
  'sensitivity_exceeds_route_assurance',
  'retention_commitment_insufficient',
  'retention_commitment_unverified',
  'project_training_use_not_restricted',
  'route_training_use_permitted',
  'route_training_use_unverified',
  'confidential_source_project_forbidden',
  'confidential_source_project_review_required',
  'confidential_source_request_forbidden',
  'confidential_source_request_review_required',
  'confidential_source_route_forbidden',
  'confidential_source_route_review_required',
  'human_likeness_project_forbidden',
  'human_likeness_project_review_required',
  'human_likeness_consent_missing',
  'human_likeness_consent_review_required',
  'human_likeness_route_forbidden',
  'human_likeness_route_review_required',
  'minor_likeness_project_forbidden',
  'minor_likeness_project_review_required',
  'minor_guardian_consent_missing',
  'minor_guardian_consent_review_required',
  'minor_likeness_route_forbidden',
  'minor_likeness_route_review_required',
  'rights_safety_blocked',
  'rights_safety_review_required',
  'fact_safety_blocked',
  'fact_safety_review_required',
] as const

export type MotionStudioStorytellingModelDataReasonCode =
  (typeof MOTION_STUDIO_STORYTELLING_MODEL_DATA_REASON_CODES)[number]

const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const isoDate = z.string().datetime({ offset: true })
const providerId = z.enum(['moonshot', 'openai'])
const modality = z.enum(['text', 'image', 'video'])
const sensitivity = z.enum(['public', 'internal', 'confidential', 'restricted'])
const evidenceState = z.enum(['verified_current', 'missing', 'expired', 'conflict'])

const policyEvidenceSchema = z.object({
  state: evidenceState,
  evidenceReferenceId: stableId.nullable(),
  evidenceDigest: digest.nullable(),
  verifiedAt: isoDate.nullable(),
  expiresAt: isoDate.nullable(),
}).strict().superRefine((value, context) => {
  const fields = [
    value.evidenceReferenceId,
    value.evidenceDigest,
    value.verifiedAt,
    value.expiresAt,
  ]
  if (value.state === 'missing' && fields.some((field) => field !== null)) {
    context.addIssue({ code: 'custom', message: 'Missing policy evidence cannot retain invented evidence metadata.' })
  }
  if (value.state !== 'missing' && fields.some((field) => field === null)) {
    context.addIssue({ code: 'custom', message: 'Non-missing policy evidence requires its exact reference, digest, and validity window.' })
  }
  if (
    value.verifiedAt !== null &&
    value.expiresAt !== null &&
    Date.parse(value.verifiedAt) >= Date.parse(value.expiresAt)
  ) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Policy evidence must expire after it was verified.' })
  }
})

const projectPolicyDigestBaseSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_PROJECT_MODEL_DATA_POLICY_SCHEMA_VERSION),
  policyId: stableId,
  policyVersion: stableId,
  organizationPolicyId: stableId,
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  sensitivity,
  permittedProviderIds: z.array(providerId).max(2).readonly(),
  allowedProcessingRegions: z.array(stableId).max(16).readonly(),
  allowedModalities: z.array(modality).min(1).max(3).readonly(),
  retentionRequirement: z.enum([
    'zero_retention_required',
    'contractual_no_training',
    'standard_retention_allowed',
  ]),
  trainingUseRestriction: z.enum(['prohibited', 'contractually_disabled', 'allowed']),
  confidentialSourceRule: z.enum([
    'forbid_external',
    'allow_verified_provider',
    'review_required',
  ]),
  humanLikenessRule: z.enum([
    'forbid_external',
    'verified_consent_required',
    'review_required',
  ]),
  minorLikenessRule: z.enum([
    'forbid_external',
    'verified_guardian_consent_required',
    'review_required',
  ]),
  organizationPolicyEvidence: policyEvidenceSchema,
  projectPolicyEvidence: policyEvidenceSchema,
  decidedAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  for (const [path, items] of [
    ['permittedProviderIds', value.permittedProviderIds],
    ['allowedProcessingRegions', value.allowedProcessingRegions],
    ['allowedModalities', value.allowedModalities],
  ] as const) {
    if (new Set(items).size !== items.length) {
      context.addIssue({ code: 'custom', path: [path], message: `${path} must contain unique values.` })
    }
  }
})

export const motionStudioStorytellingProjectModelDataPolicyV1Schema =
  projectPolicyDigestBaseSchema.extend({ policyDigest: digest }).strict()

export type MotionStudioStorytellingProjectModelDataPolicyV1 = z.infer<
  typeof motionStudioStorytellingProjectModelDataPolicyV1Schema
>

export type MotionStudioStorytellingProjectModelDataPolicyDraftV1 = Omit<
  MotionStudioStorytellingProjectModelDataPolicyV1,
  'schemaVersion' | 'policyDigest' | 'immutable'
>

const requestClassificationDigestBaseSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_MODEL_DATA_REQUEST_SCHEMA_VERSION),
  requestClassificationId: stableId,
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  roleId: z.enum(MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS),
  requestedUse: z.enum(REEDITPRO_REQUESTED_MODEL_USES),
  requestedModalities: z.array(modality).min(1).max(3).readonly(),
  confidentialSourceState: z.enum([
    'not_present',
    'provider_processing_approved',
    'provider_processing_forbidden',
    'review_required',
  ]),
  humanLikenessState: z.enum([
    'not_present',
    'consent_verified',
    'consent_missing',
    'review_required',
  ]),
  minorLikenessState: z.enum([
    'not_present',
    'guardian_consent_verified',
    'guardian_consent_missing',
    'review_required',
  ]),
  rightsSafetyState: z.enum(['approved', 'blocked', 'review_required']),
  factSafetyState: z.enum(['not_applicable', 'approved', 'blocked', 'review_required']),
  classificationEvidenceDigest: digest,
  classifiedAt: isoDate,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (new Set(value.requestedModalities).size !== value.requestedModalities.length) {
    context.addIssue({ code: 'custom', path: ['requestedModalities'], message: 'Requested modalities must be unique.' })
  }
  if (!value.requestedModalities.includes('text')) {
    context.addIssue({ code: 'custom', path: ['requestedModalities'], message: 'Storytelling reasoning requests require bounded text instructions.' })
  }
  if (value.minorLikenessState !== 'not_present' && value.humanLikenessState === 'not_present') {
    context.addIssue({ code: 'custom', path: ['humanLikenessState'], message: 'A minor likeness is also a human likeness and cannot be classified as absent.' })
  }
})

export const motionStudioStorytellingModelDataRequestV1Schema =
  requestClassificationDigestBaseSchema.extend({ requestClassificationDigest: digest }).strict()

export type MotionStudioStorytellingModelDataRequestV1 = z.infer<
  typeof motionStudioStorytellingModelDataRequestV1Schema
>

export type MotionStudioStorytellingModelDataRequestDraftV1 = Omit<
  MotionStudioStorytellingModelDataRequestV1,
  'schemaVersion' | 'requestClassificationDigest' | 'immutable'
>

const routeAssuranceDigestBaseSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_ROUTE_ASSURANCE_SCHEMA_VERSION),
  assuranceId: stableId,
  routePolicyVersion: z.literal(MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION),
  policyRouteId: z.enum(MOTION_STUDIO_STORYTELLING_MODEL_DATA_ROUTE_IDS),
  providerId,
  exactProviderModelId: z.enum([
    MOTION_STUDIO_STORYTELLING_PRIMARY_MODEL_ID,
    MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID,
  ]),
  selectedProcessingRegion: stableId,
  supportedModalities: z.array(modality).min(1).max(3).readonly(),
  maximumSensitivity: sensitivity,
  retentionCommitment: z.enum([
    'zero_retention_verified',
    'contractual_no_training_verified',
    'standard_retention',
    'unknown',
  ]),
  trainingUseState: z.enum([
    'prohibited_by_contract',
    'provider_setting_disabled',
    'permitted',
    'unknown',
  ]),
  confidentialSourceHandling: z.enum([
    'contractually_permitted',
    'forbidden',
    'review_required',
    'unknown',
  ]),
  humanLikenessHandling: z.enum([
    'consent_bound_permitted',
    'forbidden',
    'review_required',
    'unknown',
  ]),
  minorLikenessHandling: z.enum([
    'guardian_consent_bound_permitted',
    'forbidden',
    'review_required',
    'unknown',
  ]),
  assuranceEvidence: policyEvidenceSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (new Set(value.supportedModalities).size !== value.supportedModalities.length) {
    context.addIssue({ code: 'custom', path: ['supportedModalities'], message: 'Route modalities must be unique.' })
  }
  const expected = routeIdentity(value.policyRouteId)
  if (value.providerId !== expected.providerId || value.exactProviderModelId !== expected.exactProviderModelId) {
    context.addIssue({ code: 'custom', message: 'Route assurance changed the frozen provider or exact model identity.' })
  }
})

export const motionStudioStorytellingRouteAssuranceV1Schema =
  routeAssuranceDigestBaseSchema.extend({ assuranceDigest: digest }).strict()

export type MotionStudioStorytellingRouteAssuranceV1 = z.infer<
  typeof motionStudioStorytellingRouteAssuranceV1Schema
>

export type MotionStudioStorytellingRouteAssuranceDraftV1 = Omit<
  MotionStudioStorytellingRouteAssuranceV1,
  'schemaVersion' | 'routePolicyVersion' | 'assuranceDigest' | 'immutable'
>

const routeDecisionSchema = z.object({
  policyRouteId: z.enum(MOTION_STUDIO_STORYTELLING_MODEL_DATA_ROUTE_IDS),
  providerId,
  exactProviderModelId: z.enum([
    MOTION_STUDIO_STORYTELLING_PRIMARY_MODEL_ID,
    MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID,
  ]),
  eligibility: z.enum(['allowed', 'disallowed', 'unresolved']),
  reasonCodes: z.array(z.enum(MOTION_STUDIO_STORYTELLING_MODEL_DATA_REASON_CODES)).min(1).readonly(),
  assuranceDigest: digest,
}).strict().superRefine((value, context) => {
  const expected = routeIdentity(value.policyRouteId)
  if (value.providerId !== expected.providerId || value.exactProviderModelId !== expected.exactProviderModelId) {
    context.addIssue({ code: 'custom', message: 'Route decision changed the frozen provider or exact model identity.' })
  }
})

const resolutionDigestBaseSchema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_STORYTELLING_MODEL_DATA_RESOLUTION_SCHEMA_VERSION),
  resolutionId: stableId,
  workloadScope: z.literal(MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE),
  routePolicyVersion: z.literal(MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION),
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  roleId: z.enum(MOTION_STUDIO_STORYTELLING_REASONING_ROLE_IDS),
  requestedUse: z.enum(REEDITPRO_REQUESTED_MODEL_USES),
  projectPolicyDigest: digest,
  requestClassificationDigest: digest,
  routeDecisions: z.array(routeDecisionSchema).length(2).readonly(),
  disposition: z.enum([
    'kimi_primary_with_gpt_fallback',
    'kimi_primary_only',
    'gpt_fallback_only',
    'all_external_routes_blocked',
    'requires_review',
  ]),
  gptPolicyDecision: z.enum(['gpt_allowed', 'gpt_disallowed', 'unresolved']),
  compiledKimiProjectDataPolicy: motionStudioKimiK3ProjectDataPolicyV1Schema.nullable(),
  requiresReview: z.boolean(),
  runtimeReady: z.literal(false),
  runtimeBlockers: z.array(stableId).min(1).readonly(),
  executionAuthorized: z.literal(false),
  providerCallMade: z.literal(false),
  credentialReadMade: z.literal(false),
  toolSideEffectMade: z.literal(false),
  customerChargeCreated: z.literal(false),
  evaluatedAt: isoDate,
  immutable: z.literal(true),
}).strict()

export const motionStudioStorytellingModelDataResolutionV1Schema =
  resolutionDigestBaseSchema.extend({ resolutionDigest: digest }).strict()

export type MotionStudioStorytellingModelDataResolutionV1 = z.infer<
  typeof motionStudioStorytellingModelDataResolutionV1Schema
>

export const motionStudioStorytellingModelDataResolutionInputV1Schema = z.object({
  resolutionId: stableId,
  projectPolicy: motionStudioStorytellingProjectModelDataPolicyV1Schema,
  request: motionStudioStorytellingModelDataRequestV1Schema,
  routeAssurances: z.array(motionStudioStorytellingRouteAssuranceV1Schema).length(2).readonly(),
  evaluatedAt: isoDate,
}).strict().superRefine((value, context) => {
  const routeIds = value.routeAssurances.map((item) => item.policyRouteId)
  if (new Set(routeIds).size !== 2 ||
      !MOTION_STUDIO_STORYTELLING_MODEL_DATA_ROUTE_IDS.every((routeId) => routeIds.includes(routeId))) {
    context.addIssue({ code: 'custom', path: ['routeAssurances'], message: 'Resolution requires exactly one assurance for Kimi and one for the workload-scoped GPT fallback.' })
  }
  for (const field of ['workspaceId', 'projectId', 'editSessionId', 'productionId'] as const) {
    if (value.projectPolicy[field] !== value.request[field]) {
      context.addIssue({ code: 'custom', path: ['request', field], message: `Request ${field} must match the exact project policy scope.` })
    }
  }
})

export type MotionStudioStorytellingModelDataResolutionInputV1 = z.infer<
  typeof motionStudioStorytellingModelDataResolutionInputV1Schema
>

const DISALLOWED_REASON_CODES = new Set<MotionStudioStorytellingModelDataReasonCode>([
  'provider_not_permitted',
  'processing_region_not_permitted',
  'project_modality_not_permitted',
  'route_modality_not_supported',
  'sensitivity_exceeds_route_assurance',
  'retention_commitment_insufficient',
  'project_training_use_not_restricted',
  'route_training_use_permitted',
  'confidential_source_project_forbidden',
  'confidential_source_request_forbidden',
  'confidential_source_route_forbidden',
  'human_likeness_project_forbidden',
  'human_likeness_consent_missing',
  'human_likeness_route_forbidden',
  'minor_likeness_project_forbidden',
  'minor_guardian_consent_missing',
  'minor_likeness_route_forbidden',
  'rights_safety_blocked',
  'fact_safety_blocked',
])

export function createMotionStudioStorytellingProjectModelDataPolicy(
  input: MotionStudioStorytellingProjectModelDataPolicyDraftV1,
): MotionStudioStorytellingProjectModelDataPolicyV1 {
  const base = projectPolicyDigestBaseSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_PROJECT_MODEL_DATA_POLICY_SCHEMA_VERSION,
    ...structuredClone(input),
    immutable: true,
  })
  return deepFreeze(motionStudioStorytellingProjectModelDataPolicyV1Schema.parse({
    ...base,
    policyDigest: sha256CanonicalJson(base),
  }))
}

export function createMotionStudioStorytellingModelDataRequest(
  input: MotionStudioStorytellingModelDataRequestDraftV1,
): MotionStudioStorytellingModelDataRequestV1 {
  const base = requestClassificationDigestBaseSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_MODEL_DATA_REQUEST_SCHEMA_VERSION,
    ...structuredClone(input),
    immutable: true,
  })
  return deepFreeze(motionStudioStorytellingModelDataRequestV1Schema.parse({
    ...base,
    requestClassificationDigest: sha256CanonicalJson(base),
  }))
}

export function createMotionStudioStorytellingRouteAssurance(
  input: MotionStudioStorytellingRouteAssuranceDraftV1,
): MotionStudioStorytellingRouteAssuranceV1 {
  const base = routeAssuranceDigestBaseSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_ROUTE_ASSURANCE_SCHEMA_VERSION,
    routePolicyVersion: MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
    ...structuredClone(input),
    immutable: true,
  })
  return deepFreeze(motionStudioStorytellingRouteAssuranceV1Schema.parse({
    ...base,
    assuranceDigest: sha256CanonicalJson(base),
  }))
}

export function resolveMotionStudioStorytellingModelDataRouting(
  inputValue: MotionStudioStorytellingModelDataResolutionInputV1,
): MotionStudioStorytellingModelDataResolutionV1 {
  const input = motionStudioStorytellingModelDataResolutionInputV1Schema.parse(inputValue)
  assertOwnDigest(input.projectPolicy, 'policyDigest', 'Storytelling project model-data policy')
  assertOwnDigest(input.request, 'requestClassificationDigest', 'Storytelling model-data request')
  input.routeAssurances.forEach((assurance) =>
    assertOwnDigest(assurance, 'assuranceDigest', `${assurance.policyRouteId} route assurance`))

  const kimiAssurance = input.routeAssurances.find(
    (candidate) => candidate.policyRouteId === 'kimi_k3_primary',
  )
  if (!kimiAssurance) blocked('Missing exact Kimi route assurance after schema validation.')

  const decisions = MOTION_STUDIO_STORYTELLING_MODEL_DATA_ROUTE_IDS.map((routeId) => {
    const assurance = input.routeAssurances.find((candidate) => candidate.policyRouteId === routeId)
    if (!assurance) blocked(`Missing exact ${routeId} route assurance after schema validation.`)
    return evaluateRoute(input.projectPolicy, input.request, assurance, input.evaluatedAt)
  })
  const kimiDecision = decisions[0]
  const gptDecision = decisions[1]
  if (!kimiDecision || !gptDecision) blocked('Storytelling route decision ordering failed closed.')

  const disposition = resolveDisposition(kimiDecision.eligibility, gptDecision.eligibility)
  const requiresReview = disposition === 'requires_review'
  const runtimeBlockers = ['storytelling_model_data_policy_does_not_authorize_provider_transport']
  if (requiresReview) runtimeBlockers.push('storytelling_model_data_policy_review_required')
  if (disposition === 'all_external_routes_blocked') {
    runtimeBlockers.push('storytelling_model_data_policy_blocks_all_external_reasoning_routes')
  }

  const base = resolutionDigestBaseSchema.parse({
    schemaVersion: MOTION_STUDIO_STORYTELLING_MODEL_DATA_RESOLUTION_SCHEMA_VERSION,
    resolutionId: input.resolutionId,
    workloadScope: MOTION_STUDIO_STORYTELLING_WORKLOAD_SCOPE,
    routePolicyVersion: MOTION_STUDIO_STORYTELLING_REASONING_ROUTE_POLICY_VERSION,
    workspaceId: input.projectPolicy.workspaceId,
    projectId: input.projectPolicy.projectId,
    editSessionId: input.projectPolicy.editSessionId,
    productionId: input.projectPolicy.productionId,
    roleId: input.request.roleId,
    requestedUse: input.request.requestedUse,
    projectPolicyDigest: input.projectPolicy.policyDigest,
    requestClassificationDigest: input.request.requestClassificationDigest,
    routeDecisions: decisions,
    disposition,
    gptPolicyDecision: gptDecision.eligibility === 'allowed'
      ? 'gpt_allowed'
      : gptDecision.eligibility === 'disallowed'
        ? 'gpt_disallowed'
        : 'unresolved',
    compiledKimiProjectDataPolicy: compileKimiProjectDataPolicy(
      input.projectPolicy,
      input.request,
      kimiAssurance,
      kimiDecision.eligibility,
      input.evaluatedAt,
    ),
    requiresReview,
    runtimeReady: false,
    runtimeBlockers,
    executionAuthorized: false,
    providerCallMade: false,
    credentialReadMade: false,
    toolSideEffectMade: false,
    customerChargeCreated: false,
    evaluatedAt: input.evaluatedAt,
    immutable: true,
  })
  return deepFreeze(motionStudioStorytellingModelDataResolutionV1Schema.parse({
    ...base,
    resolutionDigest: sha256CanonicalJson(base),
  }))
}

export function assertMotionStudioStorytellingModelDataResolution(
  resolution: MotionStudioStorytellingModelDataResolutionV1,
): void {
  if (
    resolution.runtimeReady ||
    resolution.executionAuthorized ||
    resolution.providerCallMade ||
    resolution.credentialReadMade ||
    resolution.toolSideEffectMade ||
    resolution.customerChargeCreated
  ) {
    blocked('Storytelling model-data resolution cannot authorize runtime, credentials, side effects, or commercial activity.')
  }
  const parsed = motionStudioStorytellingModelDataResolutionV1Schema.safeParse(resolution)
  if (!parsed.success) blocked('Storytelling model-data resolution failed strict schema validation.')
  assertOwnDigest(parsed.data, 'resolutionDigest', 'Storytelling model-data resolution')
  const [kimi, gpt] = parsed.data.routeDecisions
  if (!kimi || !gpt ||
      kimi.policyRouteId !== 'kimi_k3_primary' ||
      gpt.policyRouteId !== 'gpt_5_6_sol_fallback' ||
      parsed.data.disposition !== resolveDisposition(kimi.eligibility, gpt.eligibility)) {
    blocked('Storytelling model-data resolution changed its exact route ordering or disposition.')
  }
  for (const route of parsed.data.routeDecisions) {
    const hasDisallowedReason = route.reasonCodes.some((reason) => DISALLOWED_REASON_CODES.has(reason))
    if (
      (route.eligibility === 'allowed' &&
        (route.reasonCodes.length !== 1 || route.reasonCodes[0] !== 'route_allowed')) ||
      (route.eligibility === 'disallowed' && !hasDisallowedReason) ||
      (route.eligibility === 'unresolved' &&
        (hasDisallowedReason || route.reasonCodes.includes('route_allowed')))
    ) {
      blocked('Storytelling model-data route eligibility no longer matches its reason codes.')
    }
  }
  const expectedGptDecision = gpt.eligibility === 'allowed'
    ? 'gpt_allowed'
    : gpt.eligibility === 'disallowed'
      ? 'gpt_disallowed'
      : 'unresolved'
  const expectedRuntimeBlockers = ['storytelling_model_data_policy_does_not_authorize_provider_transport']
  if (parsed.data.disposition === 'requires_review') {
    expectedRuntimeBlockers.push('storytelling_model_data_policy_review_required')
  }
  if (parsed.data.disposition === 'all_external_routes_blocked') {
    expectedRuntimeBlockers.push('storytelling_model_data_policy_blocks_all_external_reasoning_routes')
  }
  if (
    parsed.data.gptPolicyDecision !== expectedGptDecision ||
    parsed.data.requiresReview !== (parsed.data.disposition === 'requires_review') ||
    sha256CanonicalJson(parsed.data.runtimeBlockers) !== sha256CanonicalJson(expectedRuntimeBlockers)
  ) {
    blocked('Storytelling model-data resolution changed its fallback, review, or runtime-blocker semantics.')
  }
  if (parsed.data.compiledKimiProjectDataPolicy !== null) {
    const compiled = parsed.data.compiledKimiProjectDataPolicy
    assertOwnDigest(compiled, 'decisionDigest', 'Compiled Kimi project model-data policy')
    const expectedDecision = kimi.eligibility === 'allowed'
      ? 'moonshot_allowed'
      : kimi.eligibility === 'disallowed'
        ? 'moonshot_disallowed'
        : 'unresolved'
    if (
      compiled.decision !== expectedDecision ||
      compiled.workspaceId !== parsed.data.workspaceId ||
      compiled.projectId !== parsed.data.projectId ||
      compiled.editSessionId !== parsed.data.editSessionId ||
      compiled.productionId !== parsed.data.productionId ||
      compiled.decidedAt !== parsed.data.evaluatedAt
    ) {
      blocked('Compiled Kimi project policy no longer matches the exact route, scope, or evaluation.')
    }
  } else if (kimi.eligibility === 'allowed') {
    blocked('An allowed Kimi route requires its exact compiled provider-session project policy.')
  }
  if (!parsed.data.immutable || !isDeeplyFrozen(resolution)) {
    blocked('Storytelling model-data resolution must remain deeply immutable in active memory.')
  }
}

function evaluateRoute(
  policy: MotionStudioStorytellingProjectModelDataPolicyV1,
  request: MotionStudioStorytellingModelDataRequestV1,
  assurance: MotionStudioStorytellingRouteAssuranceV1,
  evaluatedAt: string,
): z.infer<typeof routeDecisionSchema> {
  const reasons: MotionStudioStorytellingModelDataReasonCode[] = []
  addEvidenceReasons(policy.organizationPolicyEvidence, 'organization', evaluatedAt, reasons)
  addEvidenceReasons(policy.projectPolicyEvidence, 'project', evaluatedAt, reasons)
  addEvidenceReasons(assurance.assuranceEvidence, 'route', evaluatedAt, reasons)
  if (Date.parse(policy.decidedAt) > Date.parse(evaluatedAt)) reasons.push('project_policy_not_yet_effective')
  if (Date.parse(request.classifiedAt) > Date.parse(evaluatedAt)) reasons.push('request_classification_not_yet_effective')
  if (!policy.permittedProviderIds.includes(assurance.providerId)) reasons.push('provider_not_permitted')
  if (!policy.allowedProcessingRegions.includes(assurance.selectedProcessingRegion)) reasons.push('processing_region_not_permitted')
  if (request.requestedModalities.some((item) => !policy.allowedModalities.includes(item))) {
    reasons.push('project_modality_not_permitted')
  }
  if (request.requestedModalities.some((item) => !assurance.supportedModalities.includes(item))) {
    reasons.push('route_modality_not_supported')
  }
  if (sensitivityRank(policy.sensitivity) > sensitivityRank(assurance.maximumSensitivity)) {
    reasons.push('sensitivity_exceeds_route_assurance')
  }
  addRetentionReasons(policy, assurance, reasons)
  addConfidentialSourceReasons(policy, request, assurance, reasons)
  addHumanLikenessReasons(policy, request, assurance, reasons)
  addMinorLikenessReasons(policy, request, assurance, reasons)
  if (request.rightsSafetyState === 'blocked') reasons.push('rights_safety_blocked')
  if (request.rightsSafetyState === 'review_required') reasons.push('rights_safety_review_required')
  if (request.factSafetyState === 'blocked') reasons.push('fact_safety_blocked')
  if (request.factSafetyState === 'review_required') reasons.push('fact_safety_review_required')

  const uniqueReasons = [...new Set(reasons)]
  const eligibility = uniqueReasons.some((reason) => DISALLOWED_REASON_CODES.has(reason))
    ? 'disallowed' as const
    : uniqueReasons.length > 0
      ? 'unresolved' as const
      : 'allowed' as const
  const identity = routeIdentity(assurance.policyRouteId)
  return routeDecisionSchema.parse({
    policyRouteId: assurance.policyRouteId,
    providerId: identity.providerId,
    exactProviderModelId: identity.exactProviderModelId,
    eligibility,
    reasonCodes: eligibility === 'allowed' ? ['route_allowed'] : uniqueReasons,
    assuranceDigest: assurance.assuranceDigest,
  })
}

function addEvidenceReasons(
  evidence: z.infer<typeof policyEvidenceSchema>,
  kind: 'organization' | 'project' | 'route',
  evaluatedAt: string,
  reasons: MotionStudioStorytellingModelDataReasonCode[],
): void {
  const prefix = kind === 'organization'
    ? 'organization_policy'
    : kind === 'project'
      ? 'project_policy_evidence'
      : 'route_assurance'
  if (evidence.state === 'missing') reasons.push(`${prefix}_missing` as MotionStudioStorytellingModelDataReasonCode)
  if (evidence.state === 'expired') reasons.push(`${prefix}_expired` as MotionStudioStorytellingModelDataReasonCode)
  if (evidence.state === 'conflict') reasons.push(`${prefix}_conflict` as MotionStudioStorytellingModelDataReasonCode)
  if (evidence.state === 'verified_current') {
    if (evidence.verifiedAt !== null && Date.parse(evidence.verifiedAt) > Date.parse(evaluatedAt)) {
      reasons.push(kind === 'route' ? 'route_assurance_not_yet_valid' : `${prefix}_conflict` as MotionStudioStorytellingModelDataReasonCode)
    }
    if (evidence.expiresAt !== null && Date.parse(evidence.expiresAt) <= Date.parse(evaluatedAt)) {
      reasons.push(`${prefix}_expired` as MotionStudioStorytellingModelDataReasonCode)
    }
  }
}

function addRetentionReasons(
  policy: MotionStudioStorytellingProjectModelDataPolicyV1,
  assurance: MotionStudioStorytellingRouteAssuranceV1,
  reasons: MotionStudioStorytellingModelDataReasonCode[],
): void {
  if (policy.trainingUseRestriction === 'allowed') reasons.push('project_training_use_not_restricted')
  if (assurance.trainingUseState === 'permitted') reasons.push('route_training_use_permitted')
  if (assurance.trainingUseState === 'unknown') reasons.push('route_training_use_unverified')
  if (assurance.retentionCommitment === 'unknown') {
    reasons.push('retention_commitment_unverified')
    return
  }
  if (
    policy.retentionRequirement === 'zero_retention_required' &&
    assurance.retentionCommitment !== 'zero_retention_verified'
  ) {
    reasons.push('retention_commitment_insufficient')
  }
  if (
    policy.retentionRequirement === 'contractual_no_training' &&
    !['zero_retention_verified', 'contractual_no_training_verified'].includes(assurance.retentionCommitment)
  ) {
    reasons.push('retention_commitment_insufficient')
  }
}

function addConfidentialSourceReasons(
  policy: MotionStudioStorytellingProjectModelDataPolicyV1,
  request: MotionStudioStorytellingModelDataRequestV1,
  assurance: MotionStudioStorytellingRouteAssuranceV1,
  reasons: MotionStudioStorytellingModelDataReasonCode[],
): void {
  if (request.confidentialSourceState === 'not_present') return
  if (policy.confidentialSourceRule === 'forbid_external') reasons.push('confidential_source_project_forbidden')
  if (policy.confidentialSourceRule === 'review_required') reasons.push('confidential_source_project_review_required')
  if (request.confidentialSourceState === 'provider_processing_forbidden') reasons.push('confidential_source_request_forbidden')
  if (request.confidentialSourceState === 'review_required') reasons.push('confidential_source_request_review_required')
  if (assurance.confidentialSourceHandling === 'forbidden') reasons.push('confidential_source_route_forbidden')
  if (['review_required', 'unknown'].includes(assurance.confidentialSourceHandling)) {
    reasons.push('confidential_source_route_review_required')
  }
}

function addHumanLikenessReasons(
  policy: MotionStudioStorytellingProjectModelDataPolicyV1,
  request: MotionStudioStorytellingModelDataRequestV1,
  assurance: MotionStudioStorytellingRouteAssuranceV1,
  reasons: MotionStudioStorytellingModelDataReasonCode[],
): void {
  if (request.humanLikenessState === 'not_present') return
  if (policy.humanLikenessRule === 'forbid_external') reasons.push('human_likeness_project_forbidden')
  if (policy.humanLikenessRule === 'review_required') reasons.push('human_likeness_project_review_required')
  if (request.humanLikenessState === 'consent_missing') reasons.push('human_likeness_consent_missing')
  if (request.humanLikenessState === 'review_required') reasons.push('human_likeness_consent_review_required')
  if (assurance.humanLikenessHandling === 'forbidden') reasons.push('human_likeness_route_forbidden')
  if (['review_required', 'unknown'].includes(assurance.humanLikenessHandling)) {
    reasons.push('human_likeness_route_review_required')
  }
}

function addMinorLikenessReasons(
  policy: MotionStudioStorytellingProjectModelDataPolicyV1,
  request: MotionStudioStorytellingModelDataRequestV1,
  assurance: MotionStudioStorytellingRouteAssuranceV1,
  reasons: MotionStudioStorytellingModelDataReasonCode[],
): void {
  if (request.minorLikenessState === 'not_present') return
  if (policy.minorLikenessRule === 'forbid_external') reasons.push('minor_likeness_project_forbidden')
  if (policy.minorLikenessRule === 'review_required') reasons.push('minor_likeness_project_review_required')
  if (request.minorLikenessState === 'guardian_consent_missing') reasons.push('minor_guardian_consent_missing')
  if (request.minorLikenessState === 'review_required') reasons.push('minor_guardian_consent_review_required')
  if (assurance.minorLikenessHandling === 'forbidden') reasons.push('minor_likeness_route_forbidden')
  if (['review_required', 'unknown'].includes(assurance.minorLikenessHandling)) {
    reasons.push('minor_likeness_route_review_required')
  }
}

function compileKimiProjectDataPolicy(
  policy: MotionStudioStorytellingProjectModelDataPolicyV1,
  request: MotionStudioStorytellingModelDataRequestV1,
  assurance: MotionStudioStorytellingRouteAssuranceV1,
  eligibility: 'allowed' | 'disallowed' | 'unresolved',
  evaluatedAt: string,
): MotionStudioKimiK3ProjectDataPolicyV1 | null {
  if (
    policy.permittedProviderIds.length === 0 ||
    policy.allowedProcessingRegions.length === 0 ||
    policy.allowedModalities.length === 0
  ) return null
  const base = {
    schemaVersion: 'motion-studio.model-data-routing-policy.v1' as const,
    policyId: policy.policyId,
    policyVersion: policy.policyVersion,
    organizationPolicyId: policy.organizationPolicyId,
    workspaceId: policy.workspaceId,
    projectId: policy.projectId,
    editSessionId: policy.editSessionId,
    productionId: policy.productionId,
    sensitivity: policy.sensitivity,
    permittedProviderIds: [...policy.permittedProviderIds],
    allowedProcessingRegions: [...policy.allowedProcessingRegions],
    selectedProcessingRegion: assurance.selectedProcessingRegion,
    retentionRequirement: policy.retentionRequirement,
    trainingUseRestriction: policy.trainingUseRestriction,
    likenessConsentState: request.humanLikenessState === 'not_present'
      ? 'not_applicable' as const
      : request.humanLikenessState === 'consent_verified' &&
          request.minorLikenessState !== 'guardian_consent_missing' &&
          request.minorLikenessState !== 'review_required'
        ? 'verified' as const
        : 'missing' as const,
    confidentialSourcePolicy: request.confidentialSourceState === 'not_present'
      ? 'not_present' as const
      : policy.confidentialSourceRule === 'allow_verified_provider' &&
          request.confidentialSourceState === 'provider_processing_approved'
        ? 'provider_permitted' as const
        : 'provider_forbidden' as const,
    allowedModalities: [...policy.allowedModalities],
    decision: eligibility === 'allowed'
      ? 'moonshot_allowed' as const
      : eligibility === 'disallowed'
        ? 'moonshot_disallowed' as const
        : 'unresolved' as const,
    decidedAt: evaluatedAt,
    immutable: true as const,
  }
  return deepFreeze(motionStudioKimiK3ProjectDataPolicyV1Schema.parse({
    ...base,
    decisionDigest: sha256CanonicalJson(base),
  }))
}

function resolveDisposition(
  kimi: 'allowed' | 'disallowed' | 'unresolved',
  gpt: 'allowed' | 'disallowed' | 'unresolved',
): MotionStudioStorytellingModelDataResolutionV1['disposition'] {
  if (kimi === 'allowed' && gpt === 'allowed') return 'kimi_primary_with_gpt_fallback'
  if (kimi === 'allowed' && gpt === 'disallowed') return 'kimi_primary_only'
  if (kimi === 'disallowed' && gpt === 'allowed') return 'gpt_fallback_only'
  if (kimi === 'disallowed' && gpt === 'disallowed') return 'all_external_routes_blocked'
  return 'requires_review'
}

function routeIdentity(routeId: MotionStudioStorytellingModelDataRouteId) {
  return routeId === 'kimi_k3_primary'
    ? {
        providerId: 'moonshot' as const,
        exactProviderModelId: MOTION_STUDIO_STORYTELLING_PRIMARY_MODEL_ID,
      }
    : {
        providerId: 'openai' as const,
        exactProviderModelId: MOTION_STUDIO_STORYTELLING_FALLBACK_MODEL_ID,
      }
}

function sensitivityRank(value: z.infer<typeof sensitivity>): number {
  return ['public', 'internal', 'confidential', 'restricted'].indexOf(value)
}

function assertOwnDigest<T extends Record<string, unknown>>(
  value: T,
  digestField: keyof T,
  label: string,
): void {
  const expected = value[digestField]
  const base = { ...value }
  delete base[digestField]
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
