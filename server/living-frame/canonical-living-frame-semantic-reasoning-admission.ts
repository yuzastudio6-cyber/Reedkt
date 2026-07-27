import { z } from 'zod'

import {
  livingFrameSemanticRequestPayloadSchema,
  validateLivingFrameSemanticReasoningRequest,
} from '../../src/lib/living-frame/living-frame-semantic-reasoning-request-contract'
import type {
  LivingFrameSemanticReasoningRequest,
} from '../../src/types/living-frame-semantic-reasoning-request'
import {
  verifyCanonicalPreapprovalRouteDataAssuranceBinding,
  type CanonicalPreapprovalRouteDataAssuranceBinding,
} from '../model-data-assurance/canonical-preapproval-route-data-assurance-contract'
import {
  verifyCanonicalSourceSpeechEvidencePackage,
  type CanonicalSourceSpeechEvidencePackage,
} from '../source-speech-evidence/canonical-source-speech-evidence-contract'
import {
  canonicalLivingFramePreapprovalInputAuthoritySchema,
  type CanonicalLivingFramePreapprovalInputAuthority,
} from '../validation/canonical-living-frame-preapproval-input-authority-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_LIVING_FRAME_PROVIDER_NEUTRAL_PAYLOAD_VERSION =
  'canonical-living-frame-provider-neutral-semantic-payload-v1' as const
export const CANONICAL_LIVING_FRAME_SEMANTIC_ADMISSION_VERSION =
  'canonical-living-frame-semantic-reasoning-admission-v1' as const

const MAX_SELECTED_SPEECH_SEGMENTS = 256
const MAX_SELECTED_SPEECH_CHARACTERS = 64_000

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const safeSpeechTextSchema = z.string().trim().min(1).max(1_200)
  .refine((value) => !containsDisallowedControlCharacter(value))
  .refine(
    (value) => !/(?:https?:\/\/|file:\/\/|gs:\/\/|s3:\/\/)/iu.test(value),
  )
  .refine(
    (value) => !/(?:api[_-]?key|authorization:\s*bearer|private[_-]?key|secret[_-]?key)/iu
      .test(value),
  )

const workflowContextSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('ordinary_edit_video'),
    motionProductionContext: z.null(),
  }).strict(),
  z.object({
    kind: z.literal('motion_storytelling_optional_context'),
    motionProductionContext: z.object({
      productionId: safeIdentitySchema,
      authorityHashSha256: digestSchema,
      sourceProposalDigestSha256: digestSchema,
      sourceArtifactApprovalSnapshotId: safeIdentitySchema,
    }).strict(),
  }).strict(),
])

const admittedSpeechExpectationSchema = z.object({
  sourceContainsSpeech: z.boolean(),
  state: z.enum([
    'bound_verified_source_speech_evidence',
    'not_applicable_verified_no_speech',
    'not_applicable_idea_first',
  ]),
  genericSourceSpeechEvidenceDigestSha256: digestSchema,
  futureSharedAuthorityRequired: z.literal(false),
  sourceInstructionAuthority: z.literal(false),
}).strict()

const admittedEvidenceProjectionSchema =
  livingFrameSemanticRequestPayloadSchema.shape.evidence.extend({
    speechExpectation: admittedSpeechExpectationSchema,
  }).strict()

const admittedSemanticPayloadSchema =
  livingFrameSemanticRequestPayloadSchema.extend({
    evidence: admittedEvidenceProjectionSchema,
  }).strict()

const selectedSpeechSegmentSchema = z.object({
  projectionOrder: z.number().int().nonnegative()
    .max(MAX_SELECTED_SPEECH_SEGMENTS - 1),
  sourceSequenceItemId: safeIdentitySchema,
  sourceEvidenceRecordDigestSha256: digestSchema,
  segmentId: safeIdentitySchema,
  segmentOrder: z.number().int().positive().max(20_000),
  startMilliseconds: z.number().int().nonnegative()
    .max(24 * 60 * 60 * 1_000),
  endMillisecondsExclusive: z.number().int().positive()
    .max(24 * 60 * 60 * 1_000),
  text: safeSpeechTextSchema,
  confidenceBasisPoints: z.number().int().min(6_000).max(10_000),
  semanticContextIds: z.array(safeIdentitySchema).min(1).max(256),
}).strict()

const sourceSpeechProjectionSchema = z.object({
  projectionClass: z.literal(
    'bounded_redacted_untrusted_source_speech_context',
  ),
  sourceInstructionAuthority: z.literal(false),
  rawTranscriptIncluded: z.literal(false),
  browserShareable: z.literal(false),
  sourceMode: z.enum([
    'uploaded_media',
    'idea_first_no_uploaded_media',
  ]),
  sourceContainsSpeech: z.boolean(),
  sourceSpeechEvidencePackageDigestSha256: digestSchema,
  sourceSpeechEvidenceSetDigestSha256: digestSchema,
  sourceSpeechEvidenceSnapshotId: safeIdentitySchema,
  sourceSpeechEvidenceRevision:
    z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  sourceSpeechEvidenceRecordCount:
    z.number().int().nonnegative().max(10_000),
  verifiedSpeechRecordCount:
    z.number().int().nonnegative().max(10_000),
  verifiedNoSpeechRecordCount:
    z.number().int().nonnegative().max(10_000),
  selectedSegmentCount:
    z.number().int().nonnegative().max(MAX_SELECTED_SPEECH_SEGMENTS),
  totalSelectedTextCharacters:
    z.number().int().nonnegative().max(MAX_SELECTED_SPEECH_CHARACTERS),
  selectedSegments:
    z.array(selectedSpeechSegmentSchema).max(MAX_SELECTED_SPEECH_SEGMENTS),
}).strict()

const providerNeutralPayloadDraftSchema = z.object({
  payloadVersion: z.literal(
    CANONICAL_LIVING_FRAME_PROVIDER_NEUTRAL_PAYLOAD_VERSION,
  ),
  payloadClass: z.literal(
    'private_provider_neutral_preapproval_semantic_payload',
  ),
  purpose: z.literal('propose_living_frame_semantic_scene_candidates'),
  identity: z.object({
    workspaceId: safeIdentitySchema,
    projectId: safeIdentitySchema,
    editSessionId: safeIdentitySchema,
    handoffId: safeIdentitySchema,
  }).strict(),
  workflowContext: workflowContextSchema,
  canonicalBindings: z.object({
    preapprovalInputAuthorityDigestSha256: digestSchema,
    preapprovalReasoningRequestDigestSha256: digestSchema,
    livingFrameComponentDigestSha256: digestSchema,
    planningEvidenceBindingDigestSha256: digestSchema,
    sourceSequenceDigestSha256: digestSchema,
    visualEvidenceBindingDigestSha256: digestSchema,
    semanticRequestContractDigestSha256: digestSchema,
    semanticPayloadDigestSha256: digestSchema,
    strictOutputSchemaDigestSha256: digestSchema,
  }).strict(),
  semanticPayload: admittedSemanticPayloadSchema,
  sourceSpeechProjection: sourceSpeechProjectionSchema,
  outputContract: z.object({
    schemaVersion:
      z.literal('living-frame-semantic-scene-proposal-schema-v1'),
    outputJsonSchemaDigestSha256: digestSchema,
    strictJsonObjectRequired: z.literal(true),
    unknownKeysRejected: z.literal(true),
    hiddenReasoningOutputAllowed: z.literal(false),
    rawEvidenceOutputAllowed: z.literal(false),
    exactFrameOutputAllowed: z.literal(false),
    exactSoundCueOutputAllowed: z.literal(false),
    providerOrToolSelectionOutputAllowed: z.literal(false),
    selectedSceneOutputAuthority: z.literal(false),
  }).strict(),
  sourceRequestBlockersFulfilled: z.array(z.enum([
    'generic_source_speech_evidence_required',
    'shared_route_data_assurance_required',
  ])).min(1).max(2),
  textOnly: z.literal(true),
  sourceEvidenceProjectionOnly: z.literal(true),
  sourceInstructionAuthority: z.literal(false),
  providerSelectionAuthority: z.literal(false),
  providerEnvelopeAuthority: z.literal(false),
  providerTransportAuthority: z.literal(false),
}).strict()

export const canonicalLivingFrameProviderNeutralPayloadSchema =
  providerNeutralPayloadDraftSchema.extend({
    payloadDigestSha256: digestSchema,
  }).strict()

const routeDataAssuranceProjectionSchema = z.object({
  contractVersion: z.literal(
    'canonical-preapproval-route-data-assurance-v1',
  ),
  contractDigestSha256: digestSchema,
  requestDigestSha256: digestSchema,
  evidenceSnapshotId: safeIdentitySchema,
  evidenceRevision:
    z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  evaluatedAt: isoDateSchema,
  validUntil: isoDateSchema,
  policyDigestSha256: digestSchema,
  requestClassificationDigestSha256: digestSchema,
  routeContractVersion: safeIdentitySchema,
  orderedRouteIds: z.tuple([
    z.literal('kimi_k3_primary'),
    z.literal('qwen_3_7_fallback'),
    z.literal('deepseek_v4_pro_fallback'),
  ]),
  routeDecisionSetDigestSha256: digestSchema,
  allRoutesAllowed: z.literal(true),
  requiresReview: z.literal(false),
  providerEnvelopeDigestSha256: z.null(),
  providerTransportAuthorized: z.literal(false),
  providerCallMade: z.literal(false),
}).strict()

export const CANONICAL_LIVING_FRAME_SEMANTIC_ADMISSION_AUTHORITY_BOUNDARY =
  Object.freeze({
    semanticAdmissionOnly: true as const,
    sourceSpeechEvidenceAuthority: false as const,
    routeDataAssuranceAuthority: false as const,
    providerEnvelopeAuthority: false as const,
    providerTransportAuthority: false as const,
    providerCallAuthority: false as const,
    providerCredentialAuthority: false as const,
    reasoningRunAuthority: false as const,
    reasoningResultAuthority: false as const,
    selectedSceneAuthority: false as const,
    componentPlanAuthority: false as const,
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
    mediaGenerationAuthority: false as const,
    renderAuthority: false as const,
    exportAuthority: false as const,
    runtimeAuthority: false as const,
    productionReady: false as const,
  })

const authorityBoundarySchema = z.object({
  semanticAdmissionOnly: z.literal(true),
  sourceSpeechEvidenceAuthority: z.literal(false),
  routeDataAssuranceAuthority: z.literal(false),
  providerEnvelopeAuthority: z.literal(false),
  providerTransportAuthority: z.literal(false),
  providerCallAuthority: z.literal(false),
  providerCredentialAuthority: z.literal(false),
  reasoningRunAuthority: z.literal(false),
  reasoningResultAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  componentPlanAuthority: z.literal(false),
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
  mediaGenerationAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  exportAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const admissionBindingDraftSchema = z.object({
  contractVersion: z.literal(
    CANONICAL_LIVING_FRAME_SEMANTIC_ADMISSION_VERSION,
  ),
  evidenceClass: z.literal(
    'private_current_shared_evidence_bound_semantic_request',
  ),
  status: z.literal('ready_for_provider_envelope'),
  promotionAllowed: z.literal(false),
  productionReady: z.literal(false),
  identity: z.object({
    workspaceId: safeIdentitySchema,
    projectId: safeIdentitySchema,
    editSessionId: safeIdentitySchema,
    handoffId: safeIdentitySchema,
  }).strict(),
  providerNeutralPayload:
    canonicalLivingFrameProviderNeutralPayloadSchema,
  routeDataAssurance: routeDataAssuranceProjectionSchema,
  runtimeBlockers: z.tuple([
    z.literal('provider_envelope_required'),
    z.literal('provider_transport_not_authorized'),
    z.literal('durable_reasoning_lifecycle_required'),
    z.literal('canonical_selected_scene_admission_required'),
  ]),
  authorityBoundary: authorityBoundarySchema,
}).strict()

export const canonicalLivingFrameSemanticReasoningAdmissionSchema =
  admissionBindingDraftSchema.extend({
    contractDigestSha256: digestSchema,
  }).strict()

export type CanonicalLivingFrameProviderNeutralPayload = z.infer<
  typeof canonicalLivingFrameProviderNeutralPayloadSchema
>

export type CanonicalLivingFrameSemanticReasoningAdmission = z.infer<
  typeof canonicalLivingFrameSemanticReasoningAdmissionSchema
>

export async function createCanonicalLivingFrameProviderNeutralPayload(
  input: {
    readonly preapprovalInputAuthority:
      CanonicalLivingFramePreapprovalInputAuthority
    readonly semanticRequest: LivingFrameSemanticReasoningRequest
    readonly sourceSpeechEvidence: CanonicalSourceSpeechEvidencePackage
  },
): Promise<CanonicalLivingFrameProviderNeutralPayload> {
  const authority =
    canonicalLivingFramePreapprovalInputAuthoritySchema.parse(
      input.preapprovalInputAuthority,
    )
  const semanticValidation =
    await validateLivingFrameSemanticReasoningRequest(input.semanticRequest)
  if (!semanticValidation.ok) {
    throw new Error(
      'canonical_living_frame_semantic_admission_request_invalid',
    )
  }
  const semanticRequest = semanticValidation.request
  const sourceSpeechEvidence = verifyCanonicalSourceSpeechEvidencePackage(
    input.sourceSpeechEvidence,
  )
  assertSharedScope({
    authority,
    semanticRequest,
    sourceSpeechEvidence,
  })
  const sourceSpeechProjection = projectSourceSpeech({
    semanticRequest,
    sourceSpeechEvidence,
  })
  const fulfilledBlockers =
    semanticRequest.blockingReasonCodes.includes(
      'generic_source_speech_evidence_required',
    )
      ? [
          'generic_source_speech_evidence_required',
          'shared_route_data_assurance_required',
        ] as const
      : ['shared_route_data_assurance_required'] as const
  const semanticPayload = admittedSemanticPayloadSchema.parse({
    ...semanticRequest.semanticPayload,
    evidence: {
      ...semanticRequest.semanticPayload.evidence,
      speechExpectation: {
        sourceContainsSpeech:
          sourceSpeechProjection.sourceContainsSpeech,
        state: admittedSpeechState(sourceSpeechProjection),
        genericSourceSpeechEvidenceDigestSha256:
          sourceSpeechEvidence.contractDigestSha256,
        futureSharedAuthorityRequired: false,
        sourceInstructionAuthority: false,
      },
    },
  })
  const draft = providerNeutralPayloadDraftSchema.parse({
    payloadVersion:
      CANONICAL_LIVING_FRAME_PROVIDER_NEUTRAL_PAYLOAD_VERSION,
    payloadClass:
      'private_provider_neutral_preapproval_semantic_payload',
    purpose: 'propose_living_frame_semantic_scene_candidates',
    identity: authority.identity,
    workflowContext: authority.workflowContext,
    canonicalBindings: {
      preapprovalInputAuthorityDigestSha256:
        authority.authorityDigestSha256,
      preapprovalReasoningRequestDigestSha256:
        authority.reasoning.requestDigestSha256,
      livingFrameComponentDigestSha256:
        authority.lineage.livingFrameComponentDigestSha256,
      planningEvidenceBindingDigestSha256:
        authority.lineage.planningEvidenceBindingDigestSha256,
      sourceSequenceDigestSha256:
        authority.lineage.sourceSequenceDigestSha256,
      visualEvidenceBindingDigestSha256:
        semanticRequest.canonicalBindings
          .visualEvidenceBindingDigestSha256,
      semanticRequestContractDigestSha256:
        semanticRequest.contractDigestSha256,
      semanticPayloadDigestSha256:
        semanticRequest.semanticPayloadDigestSha256,
      strictOutputSchemaDigestSha256:
        semanticRequest.outputContract.outputJsonSchemaDigestSha256,
    },
    semanticPayload,
    sourceSpeechProjection,
    outputContract: semanticRequest.outputContract,
    sourceRequestBlockersFulfilled: fulfilledBlockers,
    textOnly: true,
    sourceEvidenceProjectionOnly: true,
    sourceInstructionAuthority: false,
    providerSelectionAuthority: false,
    providerEnvelopeAuthority: false,
    providerTransportAuthority: false,
  })
  return canonicalLivingFrameProviderNeutralPayloadSchema.parse({
    ...draft,
    payloadDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyCanonicalLivingFrameProviderNeutralPayload(
  input: unknown,
): CanonicalLivingFrameProviderNeutralPayload {
  const parsed =
    canonicalLivingFrameProviderNeutralPayloadSchema.parse(input)
  const { payloadDigestSha256, ...draft } = parsed
  const projection = parsed.sourceSpeechProjection
  const expectedFulfilledBlockers = projection.sourceContainsSpeech
    ? [
        'generic_source_speech_evidence_required',
        'shared_route_data_assurance_required',
      ]
    : ['shared_route_data_assurance_required']
  if (
    payloadDigestSha256 !== sha256AuthorityValue(draft)
    || projection.selectedSegmentCount !==
      projection.selectedSegments.length
    || projection.totalSelectedTextCharacters !==
      projection.selectedSegments.reduce(
        (total, segment) => total + segment.text.length,
        0,
      )
    || projection.verifiedSpeechRecordCount
      + projection.verifiedNoSpeechRecordCount !==
      projection.sourceSpeechEvidenceRecordCount
    || (
      projection.sourceContainsSpeech
      && (
        projection.verifiedSpeechRecordCount === 0
        || projection.selectedSegmentCount === 0
      )
    )
    || (
      !projection.sourceContainsSpeech
      && (
        projection.verifiedSpeechRecordCount !== 0
        || projection.selectedSegmentCount !== 0
      )
    )
    || (
      projection.sourceMode === 'idea_first_no_uploaded_media'
      && (
        projection.sourceContainsSpeech
        || projection.sourceSpeechEvidenceRecordCount !== 0
      )
    )
    || parsed.semanticPayload.evidence.speechExpectation
      .genericSourceSpeechEvidenceDigestSha256 !==
      projection.sourceSpeechEvidencePackageDigestSha256
    || parsed.semanticPayload.evidence.speechExpectation
      .sourceContainsSpeech !==
      projection.sourceContainsSpeech
    || parsed.semanticPayload.evidence.speechExpectation.state !==
      admittedSpeechState(projection)
    || parsed.outputContract.outputJsonSchemaDigestSha256 !==
      parsed.canonicalBindings.strictOutputSchemaDigestSha256
    || parsed.semanticPayload.evidence
      .visualEvidenceBindingDigestSha256 !==
      parsed.canonicalBindings.visualEvidenceBindingDigestSha256
    || stableAuthorityStringify(parsed.sourceRequestBlockersFulfilled) !==
      stableAuthorityStringify(expectedFulfilledBlockers)
  ) {
    throw new Error(
      'canonical_living_frame_provider_neutral_payload_invalid',
    )
  }
  assertSelectedSpeechOrder(parsed.sourceSpeechProjection.selectedSegments)
  return structuredClone(parsed)
}

export function createCanonicalLivingFrameSemanticReasoningAdmission(
  input: {
    readonly providerNeutralPayload:
      CanonicalLivingFrameProviderNeutralPayload
    readonly routeDataAssurance:
      CanonicalPreapprovalRouteDataAssuranceBinding
  },
): CanonicalLivingFrameSemanticReasoningAdmission {
  const payload = verifyCanonicalLivingFrameProviderNeutralPayload(
    input.providerNeutralPayload,
  )
  const routeDataAssurance =
    verifyCanonicalPreapprovalRouteDataAssuranceBinding(
      input.routeDataAssurance,
    )
  assertRouteAssuranceMatchesPayload({
    payload,
    routeDataAssurance,
  })
  const draft = admissionBindingDraftSchema.parse({
    contractVersion:
      CANONICAL_LIVING_FRAME_SEMANTIC_ADMISSION_VERSION,
    evidenceClass:
      'private_current_shared_evidence_bound_semantic_request',
    status: 'ready_for_provider_envelope',
    promotionAllowed: false,
    productionReady: false,
    identity: payload.identity,
    providerNeutralPayload: payload,
    routeDataAssurance: {
      contractVersion: routeDataAssurance.contractVersion,
      contractDigestSha256:
        routeDataAssurance.contractDigestSha256,
      requestDigestSha256:
        routeDataAssurance.requestDigestSha256,
      evidenceSnapshotId: routeDataAssurance.evidenceSnapshotId,
      evidenceRevision: routeDataAssurance.evidenceRevision,
      evaluatedAt: routeDataAssurance.evaluatedAt,
      validUntil: routeDataAssurance.validUntil,
      policyDigestSha256:
        routeDataAssurance.projectPolicy.policyDigestSha256,
      requestClassificationDigestSha256:
        routeDataAssurance.requestClassification
          .requestClassificationDigestSha256,
      routeContractVersion:
        routeDataAssurance.routeContractVersion,
      orderedRouteIds: routeDataAssurance.orderedRouteIds,
      routeDecisionSetDigestSha256:
        sha256AuthorityValue(routeDataAssurance.routeDecisions),
      allRoutesAllowed: true,
      requiresReview: false,
      providerEnvelopeDigestSha256: null,
      providerTransportAuthorized: false,
      providerCallMade: false,
    },
    runtimeBlockers: [
      'provider_envelope_required',
      'provider_transport_not_authorized',
      'durable_reasoning_lifecycle_required',
      'canonical_selected_scene_admission_required',
    ],
    authorityBoundary:
      CANONICAL_LIVING_FRAME_SEMANTIC_ADMISSION_AUTHORITY_BOUNDARY,
  })
  return canonicalLivingFrameSemanticReasoningAdmissionSchema.parse({
    ...draft,
    contractDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyCanonicalLivingFrameSemanticReasoningAdmission(
  input: unknown,
): CanonicalLivingFrameSemanticReasoningAdmission {
  const parsed =
    canonicalLivingFrameSemanticReasoningAdmissionSchema.parse(input)
  verifyCanonicalLivingFrameProviderNeutralPayload(
    parsed.providerNeutralPayload,
  )
  const { contractDigestSha256, ...draft } = parsed
  if (
    contractDigestSha256 !== sha256AuthorityValue(draft)
    || stableAuthorityStringify(parsed.identity) !==
      stableAuthorityStringify(
        parsed.providerNeutralPayload.identity,
      )
    || parsed.routeDataAssurance.requestDigestSha256 !==
      parsed.providerNeutralPayload.payloadDigestSha256
  ) {
    throw new Error(
      'canonical_living_frame_semantic_reasoning_admission_invalid',
    )
  }
  return structuredClone(parsed)
}

function assertSharedScope(input: {
  authority: CanonicalLivingFramePreapprovalInputAuthority
  semanticRequest: LivingFrameSemanticReasoningRequest
  sourceSpeechEvidence: CanonicalSourceSpeechEvidencePackage
}): void {
  const { authority, semanticRequest, sourceSpeechEvidence } = input
  if (
    semanticRequest.canonicalBindings.workspaceId !==
      authority.identity.workspaceId
    || semanticRequest.canonicalBindings.projectId !==
      authority.identity.projectId
    || semanticRequest.canonicalBindings.editSessionId !==
      authority.identity.editSessionId
    || semanticRequest.canonicalBindings.handoffId !==
      authority.identity.handoffId
    || semanticRequest.canonicalBindings
      .preapprovalInputAuthorityDigestSha256 !==
      authority.authorityDigestSha256
    || semanticRequest.canonicalBindings
      .visualEvidenceBindingDigestSha256 !==
      authority.lineage.planningEvidenceBindingDigestSha256
    || stableAuthorityStringify(semanticRequest.workflowContext) !==
      stableAuthorityStringify(authority.workflowContext)
    || sourceSpeechEvidence.workspaceId !== authority.identity.workspaceId
    || sourceSpeechEvidence.projectId !== authority.identity.projectId
    || sourceSpeechEvidence.editSessionId !==
      authority.identity.editSessionId
    || sourceSpeechEvidence.sourceSequenceDigestSha256 !==
      authority.lineage.sourceSequenceDigestSha256
  ) {
    throw new Error(
      'canonical_living_frame_semantic_admission_scope_mismatch',
    )
  }
  const sourceMode = semanticRequest.semanticPayload.evidence.sourceMode
  if (
    sourceMode !== sourceSpeechEvidence.sourceMode
    || (
      sourceMode === 'uploaded_media'
      && sourceSpeechEvidence.status !==
        'available_for_preapproval_reasoning'
    )
    || (
      sourceMode === 'idea_first_no_uploaded_media'
      && (
        sourceSpeechEvidence.status !==
          'not_applicable_idea_first'
        || sourceSpeechEvidence.ideaFirstAuthorityDigestSha256 !==
          authority.lineage.ideaFirstAuthorityDigestSha256
      )
    )
  ) {
    throw new Error(
      'canonical_living_frame_semantic_admission_source_mode_mismatch',
    )
  }
}

function projectSourceSpeech(input: {
  semanticRequest: LivingFrameSemanticReasoningRequest
  sourceSpeechEvidence: CanonicalSourceSpeechEvidencePackage
}): z.infer<typeof sourceSpeechProjectionSchema> {
  const records = input.sourceSpeechEvidence.evidenceRecords
  const verifiedSpeechRecordCount = records.filter(
    (record) => record.evidenceStatus === 'verified_speech',
  ).length
  const verifiedNoSpeechRecordCount = records.length
    - verifiedSpeechRecordCount
  const evidenceContainsSpeech = verifiedSpeechRecordCount > 0
  const requestContainsSpeech =
    input.semanticRequest.semanticPayload.evidence
      .speechExpectation.sourceContainsSpeech
  if (evidenceContainsSpeech !== requestContainsSpeech) {
    throw new Error(
      'canonical_living_frame_semantic_admission_speech_state_mismatch',
    )
  }
  const segmentIndex = new Map<string, {
    recordDigestSha256: string
    segment: CanonicalSourceSpeechEvidencePackage[
      'evidenceRecords'
    ][number]['segments'][number]
  }>()
  for (const record of records) {
    for (const segment of record.segments) {
      const key = speechSegmentKey(
        record.sourceSequenceItemId,
        segment.segmentId,
      )
      if (segmentIndex.has(key)) {
        throw new Error(
          'canonical_living_frame_semantic_admission_speech_segment_duplicate',
        )
      }
      segmentIndex.set(key, {
        recordDigestSha256: record.recordDigestSha256,
        segment,
      })
    }
  }
  const selections = new Map<string, z.infer<
    typeof selectedSpeechSegmentSchema
  >>()
  if (requestContainsSpeech) {
    for (
      const context
      of input.semanticRequest.semanticPayload.segmentContexts
    ) {
      if (
        context.sourceSequenceItemId === null
        || context.sourceSegmentRefId === null
      ) continue
      const key = speechSegmentKey(
        context.sourceSequenceItemId,
        context.sourceSegmentRefId,
      )
      const match = segmentIndex.get(key)
      if (!match) {
        if (context.speakerState === 'present') {
          throw new Error(
            'canonical_living_frame_semantic_admission_speech_segment_missing',
          )
        }
        continue
      }
      const existing = selections.get(key)
      if (existing) {
        existing.semanticContextIds.push(context.segmentContextId)
        continue
      }
      if (selections.size >= MAX_SELECTED_SPEECH_SEGMENTS) {
        throw new Error(
          'canonical_living_frame_semantic_admission_speech_projection_too_large',
        )
      }
      selections.set(key, {
        projectionOrder: selections.size,
        sourceSequenceItemId: context.sourceSequenceItemId,
        sourceEvidenceRecordDigestSha256:
          match.recordDigestSha256,
        segmentId: match.segment.segmentId,
        segmentOrder: match.segment.order,
        startMilliseconds: match.segment.startMilliseconds,
        endMillisecondsExclusive:
          match.segment.endMillisecondsExclusive,
        text: match.segment.text,
        confidenceBasisPoints:
          match.segment.confidenceBasisPoints,
        semanticContextIds: [context.segmentContextId],
      })
    }
    if (selections.size === 0) {
      throw new Error(
        'canonical_living_frame_semantic_admission_speech_projection_empty',
      )
    }
  }
  const selectedSegments = [...selections.values()]
  const totalSelectedTextCharacters = selectedSegments.reduce(
    (total, segment) => total + segment.text.length,
    0,
  )
  if (totalSelectedTextCharacters > MAX_SELECTED_SPEECH_CHARACTERS) {
    throw new Error(
      'canonical_living_frame_semantic_admission_speech_projection_too_large',
    )
  }
  return sourceSpeechProjectionSchema.parse({
    projectionClass:
      'bounded_redacted_untrusted_source_speech_context',
    sourceInstructionAuthority: false,
    rawTranscriptIncluded: false,
    browserShareable: false,
    sourceMode: input.sourceSpeechEvidence.sourceMode,
    sourceContainsSpeech: evidenceContainsSpeech,
    sourceSpeechEvidencePackageDigestSha256:
      input.sourceSpeechEvidence.contractDigestSha256,
    sourceSpeechEvidenceSetDigestSha256:
      input.sourceSpeechEvidence.evidenceSetDigestSha256,
    sourceSpeechEvidenceSnapshotId:
      input.sourceSpeechEvidence.evidenceSnapshotId,
    sourceSpeechEvidenceRevision:
      input.sourceSpeechEvidence.evidenceRevision,
    sourceSpeechEvidenceRecordCount:
      input.sourceSpeechEvidence.evidenceRecordCount,
    verifiedSpeechRecordCount,
    verifiedNoSpeechRecordCount,
    selectedSegmentCount: selectedSegments.length,
    totalSelectedTextCharacters,
    selectedSegments,
  })
}

function admittedSpeechState(
  projection: z.infer<typeof sourceSpeechProjectionSchema>,
): z.infer<typeof admittedSpeechExpectationSchema>['state'] {
  if (projection.sourceMode === 'idea_first_no_uploaded_media') {
    return 'not_applicable_idea_first'
  }
  return projection.sourceContainsSpeech
    ? 'bound_verified_source_speech_evidence'
    : 'not_applicable_verified_no_speech'
}

function assertRouteAssuranceMatchesPayload(input: {
  payload: CanonicalLivingFrameProviderNeutralPayload
  routeDataAssurance: CanonicalPreapprovalRouteDataAssuranceBinding
}): void {
  const { payload, routeDataAssurance } = input
  if (
    routeDataAssurance.status !== 'ready_for_provider_envelope'
    || !routeDataAssurance.allRoutesAllowed
    || routeDataAssurance.requiresReview
    || routeDataAssurance.requestDigestSha256 !==
      payload.payloadDigestSha256
    || routeDataAssurance.workspaceId !== payload.identity.workspaceId
    || routeDataAssurance.projectId !== payload.identity.projectId
    || routeDataAssurance.editSessionId !==
      payload.identity.editSessionId
    || routeDataAssurance.requestClassification.requestedUse !==
      'edit_planning'
    || !routeDataAssurance.requestClassification
      .sourceEvidenceProjectionOnly
    || routeDataAssurance.requestClassification.rawMediaIncluded
    || routeDataAssurance.requestClassification.rawTranscriptIncluded
    || routeDataAssurance.requestClassification.browserCaptureIncluded
    || routeDataAssurance.providerEnvelopeDigestSha256 !== null
    || routeDataAssurance.providerTransportAuthorized
    || routeDataAssurance.providerCallMade
  ) {
    throw new Error(
      'canonical_living_frame_semantic_admission_route_assurance_mismatch',
    )
  }
}

function assertSelectedSpeechOrder(
  segments: readonly z.infer<typeof selectedSpeechSegmentSchema>[],
): void {
  const segmentKeys = new Set<string>()
  for (const [index, segment] of segments.entries()) {
    const key = speechSegmentKey(
      segment.sourceSequenceItemId,
      segment.segmentId,
    )
    if (
      segment.projectionOrder !== index
      || segmentKeys.has(key)
      || segment.endMillisecondsExclusive <= segment.startMilliseconds
      || new Set(segment.semanticContextIds).size !==
        segment.semanticContextIds.length
    ) {
      throw new Error(
        'canonical_living_frame_provider_neutral_speech_order_invalid',
      )
    }
    segmentKeys.add(key)
  }
}

function speechSegmentKey(
  sourceSequenceItemId: string,
  segmentId: string,
): string {
  return `${sourceSequenceItemId}\u0000${segmentId}`
}

function containsDisallowedControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (
      code === 0
      || (code < 32 && code !== 9 && code !== 10 && code !== 13)
      || code === 127
    ) return true
  }
  return false
}
