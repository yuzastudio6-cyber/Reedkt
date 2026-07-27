import { z } from 'zod'

import {
  listReEditProReasoningModelRoutes,
  REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
  validateReEditProReasoningModelRouteChain,
} from '../../src/lib/reasoning-model-routing-contract'
import {
  REEDITPRO_REASONING_MODEL_ROUTE_IDS,
  type ReEditProReasoningModelProvider,
  type ReEditProReasoningModelRouteId,
} from '../../src/types/reasoning-model-routing'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_VERSION =
  'canonical-preapproval-route-data-assurance-v1' as const
export const CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_LOCATOR_VERSION =
  'canonical-preapproval-route-data-assurance-locator-v1' as const

export const CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_REASON_CODES = [
  'route_allowed',
  'organization_policy_missing',
  'organization_policy_expired',
  'organization_policy_conflict',
  'project_policy_missing',
  'project_policy_expired',
  'project_policy_conflict',
  'route_assurance_missing',
  'route_assurance_expired',
  'route_assurance_conflict',
  'policy_not_yet_effective',
  'classification_not_yet_effective',
  'provider_not_permitted',
  'processing_region_not_permitted',
  'text_modality_not_permitted',
  'route_text_modality_not_supported',
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

export type CanonicalPreapprovalRouteDataAssuranceReasonCode =
  (typeof CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_REASON_CODES)[number]

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const providerSchema = z.enum([
  'moonshot_ai',
  'alibaba_cloud_model_studio',
  'deepseek',
])
const routeIdSchema = z.enum(REEDITPRO_REASONING_MODEL_ROUTE_IDS)
const sensitivitySchema = z.enum([
  'public',
  'internal',
  'confidential',
  'restricted',
])
const evidenceStateSchema = z.enum([
  'verified_current',
  'missing',
  'expired',
  'conflict',
])

const policyEvidenceDraftSchema = z.object({
  state: evidenceStateSchema,
  evidenceReferenceId: safeIdentitySchema.nullable(),
  evidenceDigestSha256: digestSchema.nullable(),
  verifiedAt: isoDateSchema.nullable(),
  expiresAt: isoDateSchema.nullable(),
}).strict().superRefine((value, context) => {
  const fields = [
    value.evidenceReferenceId,
    value.evidenceDigestSha256,
    value.verifiedAt,
    value.expiresAt,
  ]
  if (value.state === 'missing' && fields.some((field) => field !== null)) {
    context.addIssue({
      code: 'custom',
      message: 'Missing policy evidence cannot retain invented metadata.',
    })
  }
  if (value.state !== 'missing' && fields.some((field) => field === null)) {
    context.addIssue({
      code: 'custom',
      message: 'Non-missing policy evidence requires exact metadata.',
    })
  }
  if (
    value.verifiedAt !== null
    && value.expiresAt !== null
    && Date.parse(value.verifiedAt) >= Date.parse(value.expiresAt)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['expiresAt'],
      message: 'Policy evidence must expire after verification.',
    })
  }
})

const policyEvidenceSchema = policyEvidenceDraftSchema.extend({
  evidenceRecordDigestSha256: digestSchema,
}).strict()

const projectPolicyDraftSchema = z.object({
  policyId: safeIdentitySchema,
  policyVersion: safeIdentitySchema,
  organizationPolicyId: safeIdentitySchema,
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  sensitivity: sensitivitySchema,
  permittedProviderIds: z.array(providerSchema).min(1).max(3),
  allowedProcessingRegions: z.array(safeIdentitySchema).min(1).max(16),
  allowedModalities: z.tuple([z.literal('text')]),
  retentionRequirement: z.enum([
    'zero_retention_required',
    'contractual_no_training',
    'standard_retention_allowed',
  ]),
  trainingUseRestriction: z.enum([
    'prohibited',
    'contractually_disabled',
    'allowed',
  ]),
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
  decidedAt: isoDateSchema,
  immutable: z.literal(true),
}).strict()

export const canonicalPreapprovalProjectModelDataPolicySchema =
  projectPolicyDraftSchema.extend({
    policyDigestSha256: digestSchema,
  }).strict()

const requestClassificationDraftSchema = z.object({
  classificationId: safeIdentitySchema,
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  requestDigestSha256: digestSchema,
  requestedUse: z.enum([
    'user_reasoning',
    'edit_planning',
    'creative_edit_strategy',
    'edit_qa_reasoning',
    'tool_code',
    'remotion_draft',
  ]),
  requestedModalities: z.tuple([z.literal('text')]),
  sourceEvidenceProjectionOnly: z.literal(true),
  rawMediaIncluded: z.literal(false),
  rawTranscriptIncluded: z.literal(false),
  browserCaptureIncluded: z.literal(false),
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
  factSafetyState: z.enum([
    'not_applicable',
    'approved',
    'blocked',
    'review_required',
  ]),
  classificationEvidenceDigestSha256: digestSchema,
  classifiedAt: isoDateSchema,
  immutable: z.literal(true),
}).strict().superRefine((value, context) => {
  if (
    value.minorLikenessState !== 'not_present'
    && value.humanLikenessState === 'not_present'
  ) {
    context.addIssue({
      code: 'custom',
      path: ['humanLikenessState'],
      message: 'A minor likeness is also a human likeness.',
    })
  }
})

export const canonicalPreapprovalModelDataRequestClassificationSchema =
  requestClassificationDraftSchema.extend({
    requestClassificationDigestSha256: digestSchema,
  }).strict()

const routeAssuranceDraftSchema = z.object({
  assuranceId: safeIdentitySchema,
  routeContractVersion: z.literal(
    REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
  ),
  routeId: routeIdSchema,
  provider: providerSchema,
  exactProviderModelId: safeIdentitySchema,
  providerBoundary: safeIdentitySchema,
  selectedProcessingRegion: safeIdentitySchema,
  supportedModalities: z.tuple([z.literal('text')]),
  maximumSensitivity: sensitivitySchema,
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
}).strict()

export const canonicalPreapprovalModelRouteDataAssuranceSchema =
  routeAssuranceDraftSchema.extend({
    assuranceDigestSha256: digestSchema,
  }).strict()

const routeDecisionSchema = z.object({
  routeId: routeIdSchema,
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  provider: providerSchema,
  exactProviderModelId: safeIdentitySchema,
  providerBoundary: safeIdentitySchema,
  eligibility: z.enum(['allowed', 'disallowed', 'unresolved']),
  reasonCodes: z.array(z.enum(
    CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_REASON_CODES,
  )).min(1),
  assuranceDigestSha256: digestSchema,
}).strict()

export const CANONICAL_PREAPPROVAL_ROUTE_DATA_AUTHORITY_BOUNDARY =
  Object.freeze({
    routeDataAssuranceOnly: true as const,
    rawMediaAuthority: false as const,
    rawTranscriptAuthority: false as const,
    browserCaptureAuthority: false as const,
    providerEnvelopeAuthority: false as const,
    providerTransportAuthority: false as const,
    providerCallAuthority: false as const,
    credentialAuthority: false as const,
    reasoningRunAuthority: false as const,
    reasoningResultAuthority: false as const,
    selectedSceneAuthority: false as const,
    planningAuthority: false as const,
    timingAuthority: false as const,
    soundAuthority: false as const,
    estimateAuthority: false as const,
    customerPriceAuthority: false as const,
    customerCreditAuthority: false as const,
    creditReservationAuthority: false as const,
    approvalAuthority: false as const,
    snapshotAuthority: false as const,
    workGraphAuthority: false as const,
    queueAuthority: false as const,
    toolRouteAuthority: false as const,
    renderAuthority: false as const,
    runtimeAuthority: false as const,
    productionReady: false as const,
  })

const authorityBoundarySchema = z.object({
  routeDataAssuranceOnly: z.literal(true),
  rawMediaAuthority: z.literal(false),
  rawTranscriptAuthority: z.literal(false),
  browserCaptureAuthority: z.literal(false),
  providerEnvelopeAuthority: z.literal(false),
  providerTransportAuthority: z.literal(false),
  providerCallAuthority: z.literal(false),
  credentialAuthority: z.literal(false),
  reasoningRunAuthority: z.literal(false),
  reasoningResultAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  planningAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  creditReservationAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  toolRouteAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const bindingDraftSchema = z.object({
  contractVersion: z.literal(
    CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_VERSION,
  ),
  evidenceClass: z.literal(
    'private_workflow_neutral_preapproval_route_data_assurance',
  ),
  status: z.enum([
    'ready_for_provider_envelope',
    'requires_review',
    'blocked',
  ]),
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  requestDigestSha256: digestSchema,
  evidenceSnapshotId: safeIdentitySchema,
  evidenceRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  evaluatedAt: isoDateSchema,
  validUntil: isoDateSchema,
  routeContractVersion: z.literal(
    REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
  ),
  orderedRouteIds: z.tuple([
    z.literal('kimi_k3_primary'),
    z.literal('qwen_3_7_fallback'),
    z.literal('deepseek_v4_pro_fallback'),
  ]),
  projectPolicy: canonicalPreapprovalProjectModelDataPolicySchema,
  requestClassification:
    canonicalPreapprovalModelDataRequestClassificationSchema,
  routeAssurances: z.array(
    canonicalPreapprovalModelRouteDataAssuranceSchema,
  ).length(3),
  routeDecisions: z.array(routeDecisionSchema).length(3),
  allRoutesAllowed: z.boolean(),
  requiresReview: z.boolean(),
  runtimeBlockers: z.array(safeIdentitySchema).min(2).max(6),
  providerEnvelopeDigestSha256: z.null(),
  providerTransportAuthorized: z.literal(false),
  providerCallMade: z.literal(false),
  authorityBoundary: authorityBoundarySchema,
}).strict()

export const canonicalPreapprovalRouteDataAssuranceBindingSchema =
  bindingDraftSchema.extend({
    contractDigestSha256: digestSchema,
  }).strict()

export const canonicalPreapprovalRouteDataAssuranceLocatorSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_LOCATOR_VERSION,
  ),
  serverOwnedLocatorId: safeIdentitySchema,
}).strict()

export type CanonicalPreapprovalPolicyEvidence = z.infer<
  typeof policyEvidenceSchema
>
export type CanonicalPreapprovalProjectModelDataPolicy = z.infer<
  typeof canonicalPreapprovalProjectModelDataPolicySchema
>
export type CanonicalPreapprovalModelDataRequestClassification = z.infer<
  typeof canonicalPreapprovalModelDataRequestClassificationSchema
>
export type CanonicalPreapprovalModelRouteDataAssurance = z.infer<
  typeof canonicalPreapprovalModelRouteDataAssuranceSchema
>
export type CanonicalPreapprovalRouteDataAssuranceBinding = z.infer<
  typeof canonicalPreapprovalRouteDataAssuranceBindingSchema
>
export type CanonicalPreapprovalRouteDataAssuranceLocator = z.infer<
  typeof canonicalPreapprovalRouteDataAssuranceLocatorSchema
>

type PolicyEvidenceDraft = z.infer<typeof policyEvidenceDraftSchema>
type ProjectPolicyDraft = z.infer<typeof projectPolicyDraftSchema>
type RequestClassificationDraft = z.infer<
  typeof requestClassificationDraftSchema
>
type RouteAssuranceDraft = z.infer<typeof routeAssuranceDraftSchema>

const DISALLOWED_REASON_CODES =
  new Set<CanonicalPreapprovalRouteDataAssuranceReasonCode>([
    'provider_not_permitted',
    'processing_region_not_permitted',
    'text_modality_not_permitted',
    'route_text_modality_not_supported',
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

export function createCanonicalPreapprovalPolicyEvidence(
  input: PolicyEvidenceDraft,
): CanonicalPreapprovalPolicyEvidence {
  const draft = policyEvidenceDraftSchema.parse(input)
  return policyEvidenceSchema.parse({
    ...draft,
    evidenceRecordDigestSha256: sha256AuthorityValue(draft),
  })
}

export function createCanonicalPreapprovalProjectModelDataPolicy(
  input: Omit<
    ProjectPolicyDraft,
    | 'permittedProviderIds'
    | 'allowedProcessingRegions'
    | 'allowedModalities'
    | 'immutable'
  > & {
    readonly permittedProviderIds:
      readonly ReEditProReasoningModelProvider[]
    readonly allowedProcessingRegions: readonly string[]
  },
): CanonicalPreapprovalProjectModelDataPolicy {
  const draft = projectPolicyDraftSchema.parse({
    ...structuredClone(input),
    permittedProviderIds: canonicalSet(input.permittedProviderIds),
    allowedProcessingRegions:
      canonicalSet(input.allowedProcessingRegions),
    allowedModalities: ['text'],
    immutable: true,
  })
  return canonicalPreapprovalProjectModelDataPolicySchema.parse({
    ...draft,
    policyDigestSha256: sha256AuthorityValue(draft),
  })
}

export function createCanonicalPreapprovalModelDataRequestClassification(
  input: Omit<
    RequestClassificationDraft,
    | 'requestedModalities'
    | 'sourceEvidenceProjectionOnly'
    | 'rawMediaIncluded'
    | 'rawTranscriptIncluded'
    | 'browserCaptureIncluded'
    | 'immutable'
  >,
): CanonicalPreapprovalModelDataRequestClassification {
  const draft = requestClassificationDraftSchema.parse({
    ...structuredClone(input),
    requestedModalities: ['text'],
    sourceEvidenceProjectionOnly: true,
    rawMediaIncluded: false,
    rawTranscriptIncluded: false,
    browserCaptureIncluded: false,
    immutable: true,
  })
  return canonicalPreapprovalModelDataRequestClassificationSchema.parse({
    ...draft,
    requestClassificationDigestSha256: sha256AuthorityValue(draft),
  })
}

export function createCanonicalPreapprovalModelRouteDataAssurance(
  input: Omit<
    RouteAssuranceDraft,
    | 'routeContractVersion'
    | 'provider'
    | 'exactProviderModelId'
    | 'providerBoundary'
    | 'supportedModalities'
    | 'immutable'
  >,
): CanonicalPreapprovalModelRouteDataAssurance {
  const route = canonicalRoute(input.routeId)
  const draft = routeAssuranceDraftSchema.parse({
    ...structuredClone(input),
    routeContractVersion:
      REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
    provider: route.provider,
    exactProviderModelId: route.exactProviderModelId,
    providerBoundary: route.providerBoundary,
    supportedModalities: ['text'],
    immutable: true,
  })
  return canonicalPreapprovalModelRouteDataAssuranceSchema.parse({
    ...draft,
    assuranceDigestSha256: sha256AuthorityValue(draft),
  })
}

export function createCanonicalPreapprovalRouteDataAssuranceBinding(input: {
  readonly evidenceSnapshotId: string
  readonly evidenceRevision: number
  readonly evaluatedAt: string
  readonly projectPolicy: CanonicalPreapprovalProjectModelDataPolicy
  readonly requestClassification:
    CanonicalPreapprovalModelDataRequestClassification
  readonly routeAssurances:
    readonly CanonicalPreapprovalModelRouteDataAssurance[]
}): CanonicalPreapprovalRouteDataAssuranceBinding {
  assertCanonicalRouteContract()
  const projectPolicy = verifyProjectPolicy(input.projectPolicy)
  const requestClassification = verifyRequestClassification(
    input.requestClassification,
  )
  const routeAssurances = input.routeAssurances.map(verifyRouteAssurance)
  assertScopeAndRouteSet({
    projectPolicy,
    requestClassification,
    routeAssurances,
  })
  const routeDecisions = REEDITPRO_REASONING_MODEL_ROUTE_IDS.map(
    (routeId) => evaluateRoute({
      projectPolicy,
      requestClassification,
      assurance: requiredRouteAssurance(routeAssurances, routeId),
      evaluatedAt: input.evaluatedAt,
    }),
  )
  const allRoutesAllowed = routeDecisions.every(
    (decision) => decision.eligibility === 'allowed',
  )
  const anyDisallowed = routeDecisions.some(
    (decision) => decision.eligibility === 'disallowed',
  )
  const status = allRoutesAllowed
    ? 'ready_for_provider_envelope' as const
    : anyDisallowed
      ? 'blocked' as const
      : 'requires_review' as const
  const validUntil = earliestEvidenceExpiry({
    projectPolicy,
    routeAssurances,
    evaluatedAt: input.evaluatedAt,
  })
  if (Date.parse(input.evaluatedAt) >= Date.parse(validUntil)) {
    throw new Error(
      'canonical_preapproval_route_data_assurance_already_expired',
    )
  }
  const runtimeBlockers = [
    'provider_envelope_required',
    'provider_transport_not_authorized',
  ]
  if (status === 'blocked') {
    runtimeBlockers.push('route_data_assurance_blocked')
  } else if (status === 'requires_review') {
    runtimeBlockers.push('route_data_assurance_review_required')
  }
  const draft = bindingDraftSchema.parse({
    contractVersion:
      CANONICAL_PREAPPROVAL_ROUTE_DATA_ASSURANCE_VERSION,
    evidenceClass:
      'private_workflow_neutral_preapproval_route_data_assurance',
    status,
    workspaceId: projectPolicy.workspaceId,
    projectId: projectPolicy.projectId,
    editSessionId: projectPolicy.editSessionId,
    requestDigestSha256: requestClassification.requestDigestSha256,
    evidenceSnapshotId: input.evidenceSnapshotId,
    evidenceRevision: input.evidenceRevision,
    evaluatedAt: input.evaluatedAt,
    validUntil,
    routeContractVersion:
      REEDITPRO_REASONING_MODEL_ROUTE_CONTRACT_VERSION,
    orderedRouteIds: [...REEDITPRO_REASONING_MODEL_ROUTE_IDS],
    projectPolicy,
    requestClassification,
    routeAssurances,
    routeDecisions,
    allRoutesAllowed,
    requiresReview: status === 'requires_review',
    runtimeBlockers,
    providerEnvelopeDigestSha256: null,
    providerTransportAuthorized: false,
    providerCallMade: false,
    authorityBoundary:
      CANONICAL_PREAPPROVAL_ROUTE_DATA_AUTHORITY_BOUNDARY,
  })
  return canonicalPreapprovalRouteDataAssuranceBindingSchema.parse({
    ...draft,
    contractDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyCanonicalPreapprovalRouteDataAssuranceBinding(
  input: unknown,
): CanonicalPreapprovalRouteDataAssuranceBinding {
  const parsed =
    canonicalPreapprovalRouteDataAssuranceBindingSchema.parse(input)
  const rebuilt = createCanonicalPreapprovalRouteDataAssuranceBinding({
    evidenceSnapshotId: parsed.evidenceSnapshotId,
    evidenceRevision: parsed.evidenceRevision,
    evaluatedAt: parsed.evaluatedAt,
    projectPolicy: parsed.projectPolicy,
    requestClassification: parsed.requestClassification,
    routeAssurances: parsed.routeAssurances,
  })
  if (
    parsed.contractDigestSha256 !== rebuilt.contractDigestSha256
    || stableAuthorityStringify(parsed) !== stableAuthorityStringify(rebuilt)
  ) {
    throw new Error(
      'canonical_preapproval_route_data_assurance_binding_invalid',
    )
  }
  return structuredClone(parsed)
}

function verifyProjectPolicy(
  input: unknown,
): CanonicalPreapprovalProjectModelDataPolicy {
  const parsed =
    canonicalPreapprovalProjectModelDataPolicySchema.parse(input)
  const { policyDigestSha256, ...draft } = parsed
  if (
    policyDigestSha256 !== sha256AuthorityValue(draft)
    || !isCanonicalSet(parsed.permittedProviderIds)
    || !isCanonicalSet(parsed.allowedProcessingRegions)
  ) {
    throw new Error(
      'canonical_preapproval_route_data_project_policy_invalid',
    )
  }
  verifyEvidence(parsed.organizationPolicyEvidence)
  verifyEvidence(parsed.projectPolicyEvidence)
  return parsed
}

function verifyRequestClassification(
  input: unknown,
): CanonicalPreapprovalModelDataRequestClassification {
  const parsed =
    canonicalPreapprovalModelDataRequestClassificationSchema.parse(input)
  const { requestClassificationDigestSha256, ...draft } = parsed
  if (
    requestClassificationDigestSha256 !== sha256AuthorityValue(draft)
  ) {
    throw new Error(
      'canonical_preapproval_route_data_request_classification_invalid',
    )
  }
  return parsed
}

function verifyRouteAssurance(
  input: unknown,
): CanonicalPreapprovalModelRouteDataAssurance {
  const parsed =
    canonicalPreapprovalModelRouteDataAssuranceSchema.parse(input)
  const { assuranceDigestSha256, ...draft } = parsed
  const route = canonicalRoute(parsed.routeId)
  if (
    assuranceDigestSha256 !== sha256AuthorityValue(draft)
    || parsed.provider !== route.provider
    || parsed.exactProviderModelId !== route.exactProviderModelId
    || parsed.providerBoundary !== route.providerBoundary
  ) {
    throw new Error(
      'canonical_preapproval_route_data_route_assurance_invalid',
    )
  }
  verifyEvidence(parsed.assuranceEvidence)
  return parsed
}

function verifyEvidence(input: CanonicalPreapprovalPolicyEvidence): void {
  const { evidenceRecordDigestSha256, ...draft } = input
  if (evidenceRecordDigestSha256 !== sha256AuthorityValue(draft)) {
    throw new Error(
      'canonical_preapproval_route_data_policy_evidence_invalid',
    )
  }
}

function assertScopeAndRouteSet(input: {
  projectPolicy: CanonicalPreapprovalProjectModelDataPolicy
  requestClassification:
    CanonicalPreapprovalModelDataRequestClassification
  routeAssurances: readonly CanonicalPreapprovalModelRouteDataAssurance[]
}): void {
  for (const field of [
    'workspaceId',
    'projectId',
    'editSessionId',
  ] as const) {
    if (
      input.projectPolicy[field] !== input.requestClassification[field]
    ) {
      throw new Error(
        'canonical_preapproval_route_data_scope_mismatch',
      )
    }
  }
  if (
    input.routeAssurances.length !==
      REEDITPRO_REASONING_MODEL_ROUTE_IDS.length
    || input.routeAssurances.some(
      (assurance, index) =>
        assurance.routeId !== REEDITPRO_REASONING_MODEL_ROUTE_IDS[index],
    )
  ) {
    throw new Error(
      'canonical_preapproval_route_data_route_order_invalid',
    )
  }
}

function evaluateRoute(input: {
  projectPolicy: CanonicalPreapprovalProjectModelDataPolicy
  requestClassification:
    CanonicalPreapprovalModelDataRequestClassification
  assurance: CanonicalPreapprovalModelRouteDataAssurance
  evaluatedAt: string
}): z.infer<typeof routeDecisionSchema> {
  const reasons: CanonicalPreapprovalRouteDataAssuranceReasonCode[] = []
  addEvidenceReasons(
    input.projectPolicy.organizationPolicyEvidence,
    'organization',
    input.evaluatedAt,
    reasons,
  )
  addEvidenceReasons(
    input.projectPolicy.projectPolicyEvidence,
    'project',
    input.evaluatedAt,
    reasons,
  )
  addEvidenceReasons(
    input.assurance.assuranceEvidence,
    'route',
    input.evaluatedAt,
    reasons,
  )
  if (
    Date.parse(input.projectPolicy.decidedAt) >
      Date.parse(input.evaluatedAt)
  ) reasons.push('policy_not_yet_effective')
  if (
    Date.parse(input.requestClassification.classifiedAt) >
      Date.parse(input.evaluatedAt)
  ) reasons.push('classification_not_yet_effective')
  if (
    !input.projectPolicy.permittedProviderIds.includes(
      input.assurance.provider,
    )
  ) reasons.push('provider_not_permitted')
  if (
    !input.projectPolicy.allowedProcessingRegions.includes(
      input.assurance.selectedProcessingRegion,
    )
  ) reasons.push('processing_region_not_permitted')
  if (!input.projectPolicy.allowedModalities.includes('text')) {
    reasons.push('text_modality_not_permitted')
  }
  if (!input.assurance.supportedModalities.includes('text')) {
    reasons.push('route_text_modality_not_supported')
  }
  if (
    sensitivityRank(input.projectPolicy.sensitivity) >
      sensitivityRank(input.assurance.maximumSensitivity)
  ) reasons.push('sensitivity_exceeds_route_assurance')
  addRetentionReasons(
    input.projectPolicy,
    input.assurance,
    reasons,
  )
  addConfidentialSourceReasons(
    input.projectPolicy,
    input.requestClassification,
    input.assurance,
    reasons,
  )
  addHumanLikenessReasons(
    input.projectPolicy,
    input.requestClassification,
    input.assurance,
    reasons,
  )
  addMinorLikenessReasons(
    input.projectPolicy,
    input.requestClassification,
    input.assurance,
    reasons,
  )
  if (input.requestClassification.rightsSafetyState === 'blocked') {
    reasons.push('rights_safety_blocked')
  }
  if (
    input.requestClassification.rightsSafetyState === 'review_required'
  ) reasons.push('rights_safety_review_required')
  if (input.requestClassification.factSafetyState === 'blocked') {
    reasons.push('fact_safety_blocked')
  }
  if (
    input.requestClassification.factSafetyState === 'review_required'
  ) reasons.push('fact_safety_review_required')

  const uniqueReasons = [...new Set(reasons)]
  const eligibility = uniqueReasons.some(
    (reason) => DISALLOWED_REASON_CODES.has(reason),
  )
    ? 'disallowed' as const
    : uniqueReasons.length > 0
      ? 'unresolved' as const
      : 'allowed' as const
  const route = canonicalRoute(input.assurance.routeId)
  return routeDecisionSchema.parse({
    routeId: route.routeId,
    priority: route.priority,
    provider: route.provider,
    exactProviderModelId: route.exactProviderModelId,
    providerBoundary: route.providerBoundary,
    eligibility,
    reasonCodes: eligibility === 'allowed'
      ? ['route_allowed']
      : uniqueReasons,
    assuranceDigestSha256: input.assurance.assuranceDigestSha256,
  })
}

function addEvidenceReasons(
  evidence: CanonicalPreapprovalPolicyEvidence,
  kind: 'organization' | 'project' | 'route',
  evaluatedAt: string,
  reasons: CanonicalPreapprovalRouteDataAssuranceReasonCode[],
): void {
  const prefix = kind === 'organization'
    ? 'organization_policy'
    : kind === 'project'
      ? 'project_policy'
      : 'route_assurance'
  if (evidence.state === 'missing') {
    reasons.push(
      `${prefix}_missing` as
        CanonicalPreapprovalRouteDataAssuranceReasonCode,
    )
  }
  if (evidence.state === 'expired') {
    reasons.push(
      `${prefix}_expired` as
        CanonicalPreapprovalRouteDataAssuranceReasonCode,
    )
  }
  if (evidence.state === 'conflict') {
    reasons.push(
      `${prefix}_conflict` as
        CanonicalPreapprovalRouteDataAssuranceReasonCode,
    )
  }
  if (
    evidence.state === 'verified_current'
    && (
      Date.parse(evidence.verifiedAt!) > Date.parse(evaluatedAt)
      || Date.parse(evidence.expiresAt!) <= Date.parse(evaluatedAt)
    )
  ) {
    reasons.push(
      `${prefix}_${
        Date.parse(evidence.expiresAt!) <= Date.parse(evaluatedAt)
          ? 'expired'
          : 'conflict'
      }` as CanonicalPreapprovalRouteDataAssuranceReasonCode,
    )
  }
}

function addRetentionReasons(
  policy: CanonicalPreapprovalProjectModelDataPolicy,
  assurance: CanonicalPreapprovalModelRouteDataAssurance,
  reasons: CanonicalPreapprovalRouteDataAssuranceReasonCode[],
): void {
  if (policy.trainingUseRestriction === 'allowed') {
    reasons.push('project_training_use_not_restricted')
  }
  if (assurance.trainingUseState === 'permitted') {
    reasons.push('route_training_use_permitted')
  }
  if (assurance.trainingUseState === 'unknown') {
    reasons.push('route_training_use_unverified')
  }
  if (assurance.retentionCommitment === 'unknown') {
    reasons.push('retention_commitment_unverified')
    return
  }
  if (
    policy.retentionRequirement === 'zero_retention_required'
    && assurance.retentionCommitment !== 'zero_retention_verified'
  ) reasons.push('retention_commitment_insufficient')
  if (
    policy.retentionRequirement === 'contractual_no_training'
    && ![
      'zero_retention_verified',
      'contractual_no_training_verified',
    ].includes(assurance.retentionCommitment)
  ) reasons.push('retention_commitment_insufficient')
}

function addConfidentialSourceReasons(
  policy: CanonicalPreapprovalProjectModelDataPolicy,
  request: CanonicalPreapprovalModelDataRequestClassification,
  assurance: CanonicalPreapprovalModelRouteDataAssurance,
  reasons: CanonicalPreapprovalRouteDataAssuranceReasonCode[],
): void {
  if (request.confidentialSourceState === 'not_present') return
  if (policy.confidentialSourceRule === 'forbid_external') {
    reasons.push('confidential_source_project_forbidden')
  }
  if (policy.confidentialSourceRule === 'review_required') {
    reasons.push('confidential_source_project_review_required')
  }
  if (
    request.confidentialSourceState === 'provider_processing_forbidden'
  ) reasons.push('confidential_source_request_forbidden')
  if (request.confidentialSourceState === 'review_required') {
    reasons.push('confidential_source_request_review_required')
  }
  if (assurance.confidentialSourceHandling === 'forbidden') {
    reasons.push('confidential_source_route_forbidden')
  }
  if (
    ['review_required', 'unknown'].includes(
      assurance.confidentialSourceHandling,
    )
  ) reasons.push('confidential_source_route_review_required')
}

function addHumanLikenessReasons(
  policy: CanonicalPreapprovalProjectModelDataPolicy,
  request: CanonicalPreapprovalModelDataRequestClassification,
  assurance: CanonicalPreapprovalModelRouteDataAssurance,
  reasons: CanonicalPreapprovalRouteDataAssuranceReasonCode[],
): void {
  if (request.humanLikenessState === 'not_present') return
  if (policy.humanLikenessRule === 'forbid_external') {
    reasons.push('human_likeness_project_forbidden')
  }
  if (policy.humanLikenessRule === 'review_required') {
    reasons.push('human_likeness_project_review_required')
  }
  if (request.humanLikenessState === 'consent_missing') {
    reasons.push('human_likeness_consent_missing')
  }
  if (request.humanLikenessState === 'review_required') {
    reasons.push('human_likeness_consent_review_required')
  }
  if (assurance.humanLikenessHandling === 'forbidden') {
    reasons.push('human_likeness_route_forbidden')
  }
  if (
    ['review_required', 'unknown'].includes(
      assurance.humanLikenessHandling,
    )
  ) reasons.push('human_likeness_route_review_required')
}

function addMinorLikenessReasons(
  policy: CanonicalPreapprovalProjectModelDataPolicy,
  request: CanonicalPreapprovalModelDataRequestClassification,
  assurance: CanonicalPreapprovalModelRouteDataAssurance,
  reasons: CanonicalPreapprovalRouteDataAssuranceReasonCode[],
): void {
  if (request.minorLikenessState === 'not_present') return
  if (policy.minorLikenessRule === 'forbid_external') {
    reasons.push('minor_likeness_project_forbidden')
  }
  if (policy.minorLikenessRule === 'review_required') {
    reasons.push('minor_likeness_project_review_required')
  }
  if (
    request.minorLikenessState === 'guardian_consent_missing'
  ) reasons.push('minor_guardian_consent_missing')
  if (request.minorLikenessState === 'review_required') {
    reasons.push('minor_guardian_consent_review_required')
  }
  if (assurance.minorLikenessHandling === 'forbidden') {
    reasons.push('minor_likeness_route_forbidden')
  }
  if (
    ['review_required', 'unknown'].includes(
      assurance.minorLikenessHandling,
    )
  ) reasons.push('minor_likeness_route_review_required')
}

function earliestEvidenceExpiry(input: {
  projectPolicy: CanonicalPreapprovalProjectModelDataPolicy
  routeAssurances: readonly CanonicalPreapprovalModelRouteDataAssurance[]
  evaluatedAt: string
}): string {
  const records = [
    input.projectPolicy.organizationPolicyEvidence,
    input.projectPolicy.projectPolicyEvidence,
    ...input.routeAssurances.map(
      (assurance) => assurance.assuranceEvidence,
    ),
  ]
  if (
    records.some((record) => record.state !== 'verified_current')
  ) {
    return new Date(
      Date.parse(input.evaluatedAt) + 5 * 60 * 1_000,
    ).toISOString()
  }
  const expirations = records.map((record) => record.expiresAt!)
  return expirations.reduce((earliest, candidate) =>
    Date.parse(candidate) < Date.parse(earliest) ? candidate : earliest)
}

function requiredRouteAssurance(
  assurances: readonly CanonicalPreapprovalModelRouteDataAssurance[],
  routeId: ReEditProReasoningModelRouteId,
): CanonicalPreapprovalModelRouteDataAssurance {
  const assurance = assurances.find((candidate) =>
    candidate.routeId === routeId)
  if (!assurance) {
    throw new Error(
      'canonical_preapproval_route_data_assurance_route_missing',
    )
  }
  return assurance
}

function canonicalRoute(routeId: ReEditProReasoningModelRouteId) {
  const route = listReEditProReasoningModelRoutes().find(
    (candidate) => candidate.routeId === routeId,
  )
  if (!route) {
    throw new Error(
      'canonical_preapproval_route_data_assurance_route_missing',
    )
  }
  return route
}

function assertCanonicalRouteContract(): void {
  const validation = validateReEditProReasoningModelRouteChain()
  if (
    !validation.ok
    || validation.blocked
    || validation.providerCallMade
  ) {
    throw new Error(
      'canonical_preapproval_route_data_assurance_route_contract_invalid',
    )
  }
}

function sensitivityRank(
  value: z.infer<typeof sensitivitySchema>,
): number {
  return [
    'public',
    'internal',
    'confidential',
    'restricted',
  ].indexOf(value)
}

function canonicalSet<T extends string>(
  values: readonly T[],
): T[] {
  return [...new Set(values)].sort()
}

function isCanonicalSet(values: readonly string[]): boolean {
  return (
    new Set(values).size === values.length
    && values.every((value, index) =>
      index === 0 || values[index - 1]! < value)
  )
}
