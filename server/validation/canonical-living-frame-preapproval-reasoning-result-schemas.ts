import { z } from 'zod'

import {
  LIVING_FRAME_IMPORTANCE_LEVELS,
  LIVING_FRAME_MODES,
  LIVING_FRAME_NARRATIVE_PURPOSE_CODES,
  LIVING_FRAME_REASON_CODES,
  LIVING_FRAME_SOURCE_TRUTH_MODES,
  LIVING_FRAME_VISUAL_VERBS,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_SCHEMA_VERSION,
} from '../../src/types/living-frame-preapproval-input-authority'
import {
  LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_BINDING_SOURCE,
  LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_BINDING_VERSION,
  LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_LOCATOR_VERSION,
  type LivingFrameControlledSemanticReasoningResult,
  type LivingFramePreapprovalReasoningResultBinding,
} from '../../src/types/living-frame-preapproval-reasoning-result'
import {
  validateLivingFrameControlledInternalBudgetAdmission,
  validatePrePlanLivingFrameSemanticReasoningAuthority,
  type LivingFrameControlledInternalBudgetAdmission,
  type PrePlanLivingFrameSemanticReasoningAuthority,
} from '../reasoning-model-cost'
import {
  validateCanonicalReasoningRunReceipt,
  type CanonicalReasoningRunReceipt,
} from '../reasoning-model-execution/canonical-reasoning-run-receipt'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  canonicalLivingFramePlanningEvidenceLocatorSchema,
} from './canonical-living-frame-planning-evidence-schemas'

export const CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_REQUEST_VERSION =
  'canonical-living-frame-preapproval-reasoning-result-request-v1' as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_READER_VERSION =
  'canonical-living-frame-preapproval-reasoning-result-reader-v1' as const
export const CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_READER_RESULT_VERSION =
  'canonical-living-frame-preapproval-reasoning-result-reader-result-v1' as const

const safeIdentitySchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const boundedCountSchema = z.number().int().nonnegative().max(3)
const nonNegativeMicrosSchema =
  z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)

const forbiddenUrlPattern =
  /(?:https?:\/\/|file:\/\/|s3:\/\/|gs:\/\/|data:|javascript:)/i
const forbiddenSecretPattern =
  /(?:sk-[A-Za-z0-9_-]{10,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{20,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/
const forbiddenPathPattern =
  /(?:^|\s)(?:\/Users\/|\/Volumes\/|\/home\/|[A-Za-z]:\\)/
const forbiddenCommandPattern =
  /(?:\brm\s+-rf\b|\bsudo\s+\b|\bcurl\s+\b|\bwget\s+\b|\bbash\s+-c\b|\bsh\s+-c\b|\bpowershell\b|<script\b)/i
const hasForbiddenControlCharacter = (value: string) => Array.from(value)
  .some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })

const safeDerivedSummarySchema = z.string().trim().min(1).max(500)
  .superRefine((value, context) => {
    if (
      hasForbiddenControlCharacter(value)
      || forbiddenUrlPattern.test(value)
      || forbiddenSecretPattern.test(value)
      || forbiddenPathPattern.test(value)
      || forbiddenCommandPattern.test(value)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'unsafe_derived_summary',
      })
    }
  })

export const canonicalLivingFramePreapprovalReasoningResultLocatorSchema =
  z.object({
    schemaVersion: z.literal(
      LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_LOCATOR_VERSION,
    ),
    serverOwnedLocatorId: safeIdentitySchema,
  }).strict()

export const canonicalLivingFramePreapprovalReasoningResultRequestSchema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_REQUEST_VERSION,
    ),
    purpose: z.literal(
      'bind_controlled_living_frame_preapproval_reasoning_result',
    ),
    workspaceId: safeIdentitySchema,
    projectId: safeIdentitySchema,
    editSessionId: safeIdentitySchema,
    handoffId: safeIdentitySchema,
    planningEvidenceLocator:
      canonicalLivingFramePlanningEvidenceLocatorSchema,
    reasoningResultLocator:
      canonicalLivingFramePreapprovalReasoningResultLocatorSchema,
  }).strict()

const sourceObservationEvidenceReferenceSchema = z.object({
  kind: z.literal('source_visual_observation'),
  sourceSequenceItemId: safeIdentitySchema,
  observationId: safeIdentitySchema,
  evidenceSetDigestSha256: sha256Schema,
}).strict()

const ideaFirstEvidenceReferenceSchema = z.object({
  kind: z.literal('canonical_idea_first_context'),
  ideaFirstAuthorityDigestSha256: sha256Schema,
  evidenceSetDigestSha256: sha256Schema,
}).strict()

const semanticEvidenceReferenceSchema = z.discriminatedUnion('kind', [
  sourceObservationEvidenceReferenceSchema,
  ideaFirstEvidenceReferenceSchema,
])

const semanticDecisionBase = {
  decisionId: safeIdentitySchema,
  order: z.number().int().nonnegative().max(7),
  reasonCode: z.enum(LIVING_FRAME_REASON_CODES),
  derivedSummary: safeDerivedSummarySchema,
  evidenceReferences:
    z.array(semanticEvidenceReferenceSchema).min(1).max(16).readonly(),
}

const semanticCandidateSchema = z.object({
  ...semanticDecisionBase,
  decisionKind: z.literal('semantic_candidate'),
  mode: z.enum(LIVING_FRAME_MODES),
  narrativePurpose: z.enum(LIVING_FRAME_NARRATIVE_PURPOSE_CODES),
  visualVerb: z.enum(LIVING_FRAME_VISUAL_VERBS),
  importance: z.enum(LIVING_FRAME_IMPORTANCE_LEVELS),
  sourceTruthMode: z.enum(LIVING_FRAME_SOURCE_TRUTH_MODES),
}).strict()

const rejectedCandidateSchema = z.object({
  ...semanticDecisionBase,
  decisionKind: z.literal('rejected_candidate'),
  mode: z.enum(LIVING_FRAME_MODES),
  narrativePurpose: z.enum(LIVING_FRAME_NARRATIVE_PURPOSE_CODES),
  visualVerb: z.enum(LIVING_FRAME_VISUAL_VERBS),
  importance: z.enum(LIVING_FRAME_IMPORTANCE_LEVELS),
  sourceTruthMode: z.enum(LIVING_FRAME_SOURCE_TRUTH_MODES),
}).strict()

const deliberateNonUseSchema = z.object({
  ...semanticDecisionBase,
  decisionKind: z.literal('deliberate_non_use'),
}).strict()

const blockedDecisionSchema = z.object({
  ...semanticDecisionBase,
  decisionKind: z.literal('blocked'),
}).strict()

const semanticDecisionSchema = z.discriminatedUnion('decisionKind', [
  semanticCandidateSchema,
  rejectedCandidateSchema,
  deliberateNonUseSchema,
  blockedDecisionSchema,
])

export const canonicalLivingFrameControlledSemanticReasoningResultSchema =
  z.object({
    schemaVersion: z.literal(
      LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_SCHEMA_VERSION,
    ),
    resultClass: z.literal(
      'controlled_living_frame_semantic_reasoning_result_fixture',
    ),
    evidenceClass: z.literal(
      'controlled_non_promotable_semantic_reasoning_result',
    ),
    promotionAllowed: z.literal(false),
    productionReady: z.literal(false),
    identity: z.object({
      workspaceId: safeIdentitySchema,
      projectId: safeIdentitySchema,
      editSessionId: safeIdentitySchema,
      handoffId: safeIdentitySchema,
    }).strict(),
    livingFramePreapprovalInputAuthorityDigestSha256: sha256Schema,
    planningEvidenceBindingDigestSha256: sha256Schema,
    reasoningRequestDigestSha256: sha256Schema,
    reasoningResultSchemaDigestSha256: sha256Schema,
    overallDecision: z.enum([
      'candidates_proposed',
      'deliberate_non_use',
      'blocked',
    ]),
    decisions: z.array(semanticDecisionSchema).min(1).max(8).readonly(),
    selectedSceneAuthority: z.literal(false),
    exactFrameAuthority: z.literal(false),
    exactSoundCueAuthority: z.literal(false),
    customerEstimateAuthority: z.literal(false),
    providerOrToolSelectionAuthority: z.literal(false),
    approvalOrRuntimeAuthority: z.literal(false),
    resultDigestSha256: sha256Schema,
  }).strict().superRefine((value, context) => {
    const decisionIds = new Set<string>()
    const evidenceKeys = new Set<string>()
    value.decisions.forEach((decision, index) => {
      if (
        decision.order !== index
        || decisionIds.has(decision.decisionId)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['decisions', index],
          message: 'semantic_decision_order_or_identity_invalid',
        })
      }
      decisionIds.add(decision.decisionId)
      for (const evidence of decision.evidenceReferences) {
        const key = sha256AuthorityValue(evidence)
        if (evidenceKeys.has(`${decision.decisionId}:${key}`)) {
          context.addIssue({
            code: 'custom',
            path: ['decisions', index, 'evidenceReferences'],
            message: 'duplicate_semantic_evidence_reference',
          })
        }
        evidenceKeys.add(`${decision.decisionId}:${key}`)
      }
    })

    const candidateCount = value.decisions.filter(
      (decision) => decision.decisionKind === 'semantic_candidate',
    ).length
    const nonUseCount = value.decisions.filter(
      (decision) => decision.decisionKind === 'deliberate_non_use',
    ).length
    const blockedCount = value.decisions.filter(
      (decision) => decision.decisionKind === 'blocked',
    ).length
    if (
      (value.overallDecision === 'candidates_proposed'
        && (candidateCount < 1 || nonUseCount !== 0 || blockedCount !== 0))
      || (value.overallDecision === 'deliberate_non_use'
        && (value.decisions.length !== 1 || nonUseCount !== 1))
      || (value.overallDecision === 'blocked'
        && (value.decisions.length !== 1 || blockedCount !== 1))
    ) {
      context.addIssue({
        code: 'custom',
        path: ['overallDecision'],
        message: 'semantic_overall_decision_inconsistent',
      })
    }

    const {
      resultDigestSha256,
      ...withoutDigest
    } = value
    if (
      resultDigestSha256 !== sha256AuthorityValue(withoutDigest)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['resultDigestSha256'],
        message: 'semantic_result_digest_invalid',
      })
    }
  })

const livingFrameBudgetAdmissionSchema =
  z.custom<LivingFrameControlledInternalBudgetAdmission>(
    (value) => (
      typeof value === 'object'
      && value !== null
      && validateLivingFrameControlledInternalBudgetAdmission(
        value as LivingFrameControlledInternalBudgetAdmission,
      ).ok
    ),
    { message: 'Controlled Living Frame budget admission is invalid.' },
  )

const livingFrameRunReceiptSchema = z.custom<
  CanonicalReasoningRunReceipt<
    PrePlanLivingFrameSemanticReasoningAuthority
  >
>(
  (value) => {
    if (!value || typeof value !== 'object') return false
    const receipt = value as CanonicalReasoningRunReceipt<
      PrePlanLivingFrameSemanticReasoningAuthority
    >
    return (
      receipt.workloadAuthority?.authorityClass ===
        'pre_plan_living_frame_semantic_reasoning'
      && validatePrePlanLivingFrameSemanticReasoningAuthority(
        receipt.workloadAuthority,
      ).ok
      && validateCanonicalReasoningRunReceipt(receipt).ok
    )
  },
  { message: 'Controlled Living Frame reasoning run receipt is invalid.' },
)

export const canonicalLivingFramePreapprovalReasoningResultReaderResultSchema =
  z.object({
    schemaVersion: z.literal(
      CANONICAL_LIVING_FRAME_PREAPPROVAL_RESULT_READER_RESULT_VERSION,
    ),
    sourceAuthority: z.literal(
      'controlled_living_frame_reasoning_result_fixture_reader',
    ),
    evidenceClass: z.literal(
      'controlled_non_promotable_reasoning_result_reader_projection',
    ),
    promotionAllowed: z.literal(false),
    productionReady: z.literal(false),
    serverOwnedLocatorId: safeIdentitySchema,
    budgetAdmission: livingFrameBudgetAdmissionSchema,
    canonicalRunReceipt: livingFrameRunReceiptSchema,
    semanticResult:
      canonicalLivingFrameControlledSemanticReasoningResultSchema,
  }).strict()

const workflowContextSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('ordinary_edit_video'),
    motionProductionContext: z.null(),
  }).strict(),
  z.object({
    kind: z.literal('motion_storytelling_optional_context'),
    motionProductionContext: z.object({
      productionId: safeIdentitySchema,
      authorityHashSha256: sha256Schema,
      sourceProposalDigestSha256: sha256Schema,
      sourceArtifactApprovalSnapshotId: safeIdentitySchema,
    }).strict(),
  }).strict(),
])

const resultAuthorityBoundarySchema = z.object({
  controlledPlanningProjectionOnly: z.literal(true),
  liveEvidenceAuthority: z.literal(false),
  releasedReasoningRunAuthority: z.literal(false),
  reasoningResultAuthority: z.literal(false),
  providerTransportAuthority: z.literal(false),
  providerCallAuthority: z.literal(false),
  providerCredentialAuthority: z.literal(false),
  providerAttemptReceiptAuthority: z.literal(false),
  providerAttemptCostAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  componentPlanAuthority: z.literal(false),
  capabilityPlanAuthority: z.literal(false),
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

export const canonicalLivingFramePreapprovalReasoningResultBindingSchema =
  z.object({
    contractVersion: z.literal(
      LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_BINDING_VERSION,
    ),
    contractSource: z.literal(
      LIVING_FRAME_PREAPPROVAL_REASONING_RESULT_BINDING_SOURCE,
    ),
    evidenceClass: z.literal(
      'controlled_non_promotable_reasoning_result_binding',
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
    canonicalBindings: z.object({
      livingFramePreapprovalInputAuthorityDigestSha256: sha256Schema,
      planningEvidenceBindingDigestSha256: sha256Schema,
      reasoningRequestDigestSha256: sha256Schema,
      reasoningResultSchemaDigestSha256: sha256Schema,
      routeIdentityDigestSha256: sha256Schema,
      rateCardIdentityDigestSha256: sha256Schema,
      internalCostBudgetAdmissionDigestSha256: sha256Schema,
      workloadAuthorityDigestSha256: sha256Schema,
      canonicalReasoningRunReceiptDigestSha256: sha256Schema,
      semanticResultDigestSha256: sha256Schema,
    }).strict(),
    overallDecision: z.enum([
      'candidates_proposed',
      'deliberate_non_use',
      'blocked',
    ]),
    decisions: z.array(semanticDecisionSchema).min(1).max(8).readonly(),
    reasoningResultReReadByServer: z.literal(true),
    controlledRunSummary: z.object({
      evidenceClass: z.literal(
        'controlled_non_promotable_reasoning_run_summary',
      ),
      terminalState: z.literal('completed'),
      attemptCount: boundedCountSchema.refine((value) => value >= 1),
      failedAttemptCount: boundedCountSchema,
      completedAttemptCount: z.literal(1),
      unknownAttemptCount: z.literal(0),
      failedAttemptCostRetained: z.literal(true),
      normalizedUsdCostMicros: nonNegativeMicrosSchema,
      withinAuthorizedInternalCostCeiling: z.literal(true),
      providerCallsMadeByBindingService: z.literal(false),
      customerPriceCalculated: z.literal(false),
      customerCreditsCalculated: z.literal(false),
      serviceFeeIncluded: z.literal(false),
    }).strict(),
    authorityBoundary: resultAuthorityBoundarySchema,
    contractDigestSha256: sha256Schema,
  }).strict().superRefine((value, context) => {
    const {
      contractDigestSha256,
      ...withoutDigest
    } = value
    if (
      contractDigestSha256 !== sha256AuthorityValue(withoutDigest)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['contractDigestSha256'],
        message: 'reasoning_result_binding_digest_invalid',
      })
    }
  })

export type CanonicalLivingFramePreapprovalReasoningResultRequest =
  z.infer<
    typeof canonicalLivingFramePreapprovalReasoningResultRequestSchema
  >
export type CanonicalLivingFramePreapprovalReasoningResultReaderResult =
  z.infer<
    typeof canonicalLivingFramePreapprovalReasoningResultReaderResultSchema
  >
export type CanonicalLivingFrameControlledSemanticReasoningResult =
  z.infer<
    typeof canonicalLivingFrameControlledSemanticReasoningResultSchema
  > & LivingFrameControlledSemanticReasoningResult
export type CanonicalLivingFramePreapprovalReasoningResultBinding =
  z.infer<
    typeof canonicalLivingFramePreapprovalReasoningResultBindingSchema
  > & LivingFramePreapprovalReasoningResultBinding
