import { z } from 'zod'

import {
  LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_SOURCE,
  LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_VERSION,
  LIVING_FRAME_PREAPPROVAL_INTERNAL_COST_POLICY_VERSION,
  LIVING_FRAME_PREAPPROVAL_REASONING_REQUEST_VERSION,
  LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_SCHEMA_VERSION,
} from '../../src/types/living-frame-preapproval-input-authority'
import type {
  PrePlanEditReferenceStudyChatReasoningAuthority,
} from '../reasoning-model-cost'
import {
  validatePrePlanEditReferenceStudyChatReasoningAuthority,
} from '../reasoning-model-cost'
import {
  canonicalPlanComponentsSchema,
} from './edit-planning-authority-schemas'
import {
  canonicalLivingFramePlanningEvidenceLocatorSchema,
} from './canonical-living-frame-planning-evidence-schemas'
import {
  canonicalPlanningHandoffResponseSchema,
} from './canonical-planning-handoff-schemas'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_REQUEST_VERSION =
  'canonical-living-frame-preapproval-input-request-v1' as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_VERSION =
  'canonical-living-frame-preapproval-input-reader-v1' as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_RESULT_VERSION =
  'canonical-living-frame-preapproval-input-reader-result-v1' as const
export const CANONICAL_SHARED_PREAPPROVAL_AUTHORITY_ENVELOPE_VERSION =
  'canonical-shared-preapproval-authority-envelope-v1' as const

const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const positiveMicrosSchema = z.string().regex(/^[1-9][0-9]{0,15}$/)

export const canonicalLivingFramePreapprovalInputRequestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_REQUEST_VERSION,
  ),
  purpose: z.literal('bind_living_frame_preapproval_input_authority'),
  workspaceId: safeIdentitySchema,
  projectId: safeIdentitySchema,
  editSessionId: safeIdentitySchema,
  handoffId: safeIdentitySchema,
  planningEvidenceLocator:
    canonicalLivingFramePlanningEvidenceLocatorSchema,
}).strict()

export const canonicalLivingFramePreapprovalInternalCostExpectationSchema =
  z.object({
    policyVersion: z.literal(
      LIVING_FRAME_PREAPPROVAL_INTERNAL_COST_POLICY_VERSION,
    ),
    budgetExpectationId: safeIdentitySchema,
    evidenceClass: z.literal(
      'controlled_non_promotable_internal_cost_ceiling_expectation',
    ),
    rateCardVersion: z.string().trim().min(1).max(160),
    denomination: z.literal('normalized_usd_micros'),
    maximumAuthorizedInternalCostMicros: positiveMicrosSchema,
    actualAttemptReceiptProvided: z.literal(false),
    actualAttemptCostKnown: z.literal(false),
    providerInvoiceReconciled: z.literal(false),
    futureDurableAttemptEvidenceRequired: z.literal(true),
    customerPriceCalculated: z.literal(false),
    customerCreditsCalculated: z.literal(false),
    customerChargeCreated: z.literal(false),
    walletMutationMade: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict()

export const canonicalLivingFramePreapprovalInputReaderResultSchema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_LIVING_FRAME_PREAPPROVAL_INPUT_READER_RESULT_VERSION,
    ),
    sourceAuthority: z.literal(
      'canonical_private_current_planning_handoff_reader',
    ),
    evidenceClass: z.literal(
      'controlled_private_current_handoff_and_components_reader',
    ),
    productionReady: z.literal(false),
    identity: z.object({
      workspaceId: safeIdentitySchema,
      projectId: safeIdentitySchema,
      editSessionId: safeIdentitySchema,
      currentHandoffId: safeIdentitySchema,
    }).strict(),
    publicationStatus: z.literal('unpublished'),
    handoff: canonicalPlanningHandoffResponseSchema,
    canonicalPlanComponents: canonicalPlanComponentsSchema,
    internalCostExpectation:
      canonicalLivingFramePreapprovalInternalCostExpectationSchema,
  }).strict()

const motionProductionContextSchema = z.object({
  productionId: safeIdentitySchema,
  authorityHashSha256: sha256Schema,
  sourceProposalDigestSha256: sha256Schema,
  sourceArtifactApprovalSnapshotId: safeIdentitySchema,
}).strict()

const workflowContextSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('ordinary_edit_video'),
    motionProductionContext: z.null(),
  }).strict(),
  z.object({
    kind: z.literal('motion_storytelling_optional_context'),
    motionProductionContext: motionProductionContextSchema,
  }).strict(),
])

const authorityBoundarySchema = z.object({
  preapprovalInputOnly: z.literal(true),
  liveEvidenceAuthority: z.literal(false),
  reasoningRunAuthority: z.literal(false),
  reasoningResultAuthority: z.literal(false),
  providerTransportAuthority: z.literal(false),
  providerCallAuthority: z.literal(false),
  providerCredentialAuthority: z.literal(false),
  providerAttemptReceiptAuthority: z.literal(false),
  providerAttemptCostAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  creditReservationAuthority: z.literal(false),
  walletAuthority: z.literal(false),
  serviceFeeAuthority: z.literal(false),
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

export const canonicalLivingFramePreapprovalInputAuthoritySchema =
  z.object({
    schemaVersion: z.literal(
      LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_VERSION,
    ),
    authorityClass: z.literal('living_frame_preapproval_input'),
    sourceAuthority: z.literal(
      LIVING_FRAME_PREAPPROVAL_INPUT_AUTHORITY_SOURCE,
    ),
    evidenceClass: z.literal(
      'controlled_source_bound_preapproval_input_unreleased',
    ),
    promotionAllowed: z.literal(false),
    productionReady: z.literal(false),
    workflowContext: workflowContextSchema,
    identity: z.object({
      workspaceId: safeIdentitySchema,
      projectId: safeIdentitySchema,
      editSessionId: safeIdentitySchema,
      handoffId: safeIdentitySchema,
    }).strict(),
    lineage: z.object({
      handoffHashSha256: sha256Schema,
      canonicalPlanComponentsHashSha256: sha256Schema,
      planningInputBindingHashSha256: sha256Schema,
      livingFrameComponentDigestSha256: sha256Schema,
      planningEvidenceBindingDigestSha256: sha256Schema,
      compiledIntentDigestSha256: sha256Schema,
      sourceSequenceDigestSha256: sha256Schema,
      outputFrameDigestSha256: sha256Schema,
      masterTimingDigestSha256: sha256Schema,
      ideaFirstAuthorityDigestSha256: sha256Schema.nullable(),
    }).strict(),
    evidence: z.object({
      status: z.enum([
        'available_for_preapproval_reasoning',
        'not_applicable_idea_first',
      ]),
      sourceMode: z.enum([
        'uploaded_media',
        'idea_first_no_uploaded_media',
      ]),
      evidenceClass: z.enum([
        'private_source_bound_visual_observation_projection',
        'not_applicable_canonical_idea_first',
      ]),
      sourceEvidenceCount: z.number().int().nonnegative().max(1_000),
      evidenceSetDigestSha256: sha256Schema,
      evidenceReReadByServer: z.literal(true),
      selectedSceneAuthority: z.literal(false),
    }).strict(),
    reasoning: z.object({
      requestContractVersion: z.literal(
        LIVING_FRAME_PREAPPROVAL_REASONING_REQUEST_VERSION,
      ),
      requestDigestSha256: sha256Schema,
      resultSchemaVersion: z.literal(
        LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_SCHEMA_VERSION,
      ),
      resultSchemaDigestSha256: sha256Schema,
      routeContractVersion: z.string().trim().min(1).max(160),
      orderedRouteIds: z.tuple([
        z.literal('kimi_k3_primary'),
        z.literal('qwen_3_7_fallback'),
        z.literal('deepseek_v4_pro_fallback'),
      ]).readonly(),
      routeIdentityDigestSha256: sha256Schema,
      strictStructuredOutputRequired: z.literal(true),
      semanticDecisionsOnly: z.literal(true),
      exactFrameOutputForbidden: z.literal(true),
      exactSoundCueOutputForbidden: z.literal(true),
      providerTransportAuthorityState: z.literal('required_not_granted'),
      providerTransportAuthorized: z.literal(false),
      providerCallMade: z.literal(false),
      oldKimiToGptFallbackAllowed: z.literal(false),
      qwen25VlReasoningRouteAllowed: z.literal(false),
      mediaProviderOperationAllowed: z.literal(false),
    }).strict(),
    internalCost:
      canonicalLivingFramePreapprovalInternalCostExpectationSchema.extend({
        rateCardIdentityDigestSha256: sha256Schema,
      }).strict(),
    authorityBoundary: authorityBoundarySchema,
    authorityDigestSha256: sha256Schema,
  }).strict().superRefine((value, context) => {
    const evidence = value.evidence
    const lineage = value.lineage
    const workflow = value.workflowContext
    if (workflow.kind === 'ordinary_edit_video') {
      if (
        evidence.status !== 'available_for_preapproval_reasoning'
        || evidence.sourceMode !== 'uploaded_media'
        || evidence.evidenceClass !==
          'private_source_bound_visual_observation_projection'
        || evidence.sourceEvidenceCount < 1
        || lineage.ideaFirstAuthorityDigestSha256 !== null
      ) {
        context.addIssue({
          code: 'custom',
          path: ['workflowContext'],
          message:
            'Ordinary Living Frame preapproval requires uploaded source evidence and no Motion production authority.',
        })
      }
      return
    }
    if (
      evidence.status !== 'not_applicable_idea_first'
      || evidence.sourceMode !== 'idea_first_no_uploaded_media'
      || evidence.evidenceClass !== 'not_applicable_canonical_idea_first'
      || evidence.sourceEvidenceCount !== 0
      || lineage.ideaFirstAuthorityDigestSha256 === null
      || workflow.motionProductionContext.authorityHashSha256 !==
        lineage.ideaFirstAuthorityDigestSha256
    ) {
      context.addIssue({
        code: 'custom',
        path: ['workflowContext'],
        message:
          'Optional Motion context requires the exact separately bound idea-first authority.',
      })
    }
  }).superRefine((value, context) => {
    const {
      authorityDigestSha256,
      ...withoutDigest
    } = value
    if (
      authorityDigestSha256 !== sha256AuthorityValue(withoutDigest)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['authorityDigestSha256'],
        message:
          'Living Frame preapproval input authority failed content-addressed integrity verification.',
      })
    }
  })

const editReferenceAuthorityPayloadSchema =
  z.custom<PrePlanEditReferenceStudyChatReasoningAuthority>(
    (value) => (
      typeof value === 'object'
      && value !== null
      && validatePrePlanEditReferenceStudyChatReasoningAuthority(
        value as PrePlanEditReferenceStudyChatReasoningAuthority,
      ).ok
    ),
    { message: 'Edit Reference Study Chat authority is invalid.' },
  )

export const canonicalSharedPreapprovalAuthorityEnvelopeSchema =
  z.discriminatedUnion('authorityLane', [
    z.object({
      schemaVersion: z.literal(
        CANONICAL_SHARED_PREAPPROVAL_AUTHORITY_ENVELOPE_VERSION,
      ),
      authorityLane: z.literal('living_frame_preapproval_v1'),
      authority: canonicalLivingFramePreapprovalInputAuthoritySchema,
    }).strict(),
    z.object({
      schemaVersion: z.literal(
        CANONICAL_SHARED_PREAPPROVAL_AUTHORITY_ENVELOPE_VERSION,
      ),
      authorityLane: z.literal('edit_reference_study_chat_v6'),
      authority: editReferenceAuthorityPayloadSchema,
    }).strict(),
  ])

export type CanonicalLivingFramePreapprovalInputRequest = z.infer<
  typeof canonicalLivingFramePreapprovalInputRequestSchema
>
export type CanonicalLivingFramePreapprovalInputReaderResult = z.infer<
  typeof canonicalLivingFramePreapprovalInputReaderResultSchema
>
export type CanonicalLivingFramePreapprovalInputAuthority = z.infer<
  typeof canonicalLivingFramePreapprovalInputAuthoritySchema
>
export type CanonicalSharedPreapprovalAuthorityEnvelope = z.infer<
  typeof canonicalSharedPreapprovalAuthorityEnvelopeSchema
>
