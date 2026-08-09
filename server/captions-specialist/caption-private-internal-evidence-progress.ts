import { z } from 'zod'

import {
  CAPTION_PRIVATE_INTERNAL_EVIDENCE_PROGRESS_VERSION,
  type CaptionPrivateInternalEvidenceGateProgress,
  type CaptionPrivateInternalEvidenceProgress,
} from '../../src/types/caption-private-internal-evidence-progress'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTION_GOAL_COMPLETION_GAP_IDS,
} from '../../src/types/caption-goal-completion-audit'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { CAPTION_CURRENT_JOB_READINESS_LEDGER_V2 } from
  './caption-current-job-readiness'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const gateSchema = z.object({
  gapId: z.enum(CAPTION_GOAL_COMPLETION_GAP_IDS),
  status: z.enum([
    'actual_evidence_rejected',
    'source_ready_missing_actual_evidence',
    'actual_evidence_incomplete',
    'actual_evidence_accepted_outside_terminal_scope',
    'blocked_by_upstream_gates',
  ]),
  evidenceRefs: z.array(refSchema).max(8),
  nextRequiredEvidenceCodes: z.array(safeKey).min(1).max(8),
  actualPrivateEvidenceObserved: z.boolean(),
  sameCanonicalTerminalRunBound: z.literal(false),
  terminalGateSatisfied: z.literal(false),
  historicalOrSeparateFixtureRelabeledAsTerminalEvidence: z.literal(false),
}).strict()
const progressSchema: z.ZodType<CaptionPrivateInternalEvidenceProgress> =
z.object({
  schemaVersion: z.literal(
    CAPTION_PRIVATE_INTERNAL_EVIDENCE_PROGRESS_VERSION),
  progressId: safeKey,
  progressDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  sourceCurrentJobReadinessRef: refSchema,
  counts: z.object({
    declaredCaptionJobs: z.literal(41),
    captionOwnedImplementationsComplete: z.literal(41),
    sourcePathsReadyForPrivateEvidenceRun: z.literal(41),
    canonicalOwnerCompositionMountsComplete: z.literal(5),
    terminalPrivateInternalQualifiedJobs: z.literal(0),
    terminalEvidenceGates: z.literal(9),
    terminalEvidenceGatesSatisfied: z.literal(0),
    gatesWithActualPrivateEvidenceObserved: z.literal(5),
    acceptedEvidenceOutsideTerminalScope: z.literal(1),
    incompleteOrRejectedEvidenceGates: z.literal(4),
    missingActualEvidenceGates: z.literal(3),
    gatesBlockedByUpstreamEvidence: z.literal(1),
  }).strict(),
  gates: z.array(gateSchema).length(9),
  professionalAppearanceEvidence: z.object({
    realTalkingHeadPixelsInspected: z.literal(true),
    fullMotionRenderRef: refSchema,
    reducedMotionRenderRef: refSchema,
    directInspectionReceiptRef: refSchema,
    acceptedForCaptionOwnedProfessionalAppearance: z.literal(true),
    syntheticEngineeringFixtureUsed: z.literal(false),
    qualifiedSharedPostrenderAiReviewClaimed: z.literal(false),
    independentFinalQaClaimed: z.literal(false),
  }).strict(),
  terminalStatus: z.literal(
    'caption_private_internal_evidence_in_progress'),
  targetTerminalStatus: z.literal(
    'caption_specialist_private_internal_qualified'),
  oneExactCanonicalRunCompleted: z.literal(false),
  terminalStatusClaimed: z.literal(false),
  publicProductionRequiredForTarget: z.literal(false),
  centralOrchestraRequiredForTarget: z.literal(false),
  callerSuppliedEvidenceAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()

function ref(id: string, version: string, contentHash: string):
CaptionDomainRef {
  return { id, version, contentHash }
}

function gate(
  gapId: CaptionPrivateInternalEvidenceGateProgress['gapId'],
  status: CaptionPrivateInternalEvidenceGateProgress['status'],
  evidenceRefs: CaptionDomainRef[],
  nextRequiredEvidenceCodes: string[],
): CaptionPrivateInternalEvidenceGateProgress {
  return {
    gapId,
    status,
    evidenceRefs,
    nextRequiredEvidenceCodes,
    actualPrivateEvidenceObserved: evidenceRefs.length > 0,
    sameCanonicalTerminalRunBound: false,
    terminalGateSatisfied: false,
    historicalOrSeparateFixtureRelabeledAsTerminalEvidence: false,
  }
}

const transcriptRejectedInspectionRef = ref(
  'caption.private.transcript.inspection.rejected.a1640b8a2da4bf076c6ecfbd',
  'caption-private-transcript-direct-inspection-receipt-v1',
  '08da86485883639439bf357512b9e0d021c0f010909eee3512c525e753e3fba5')
const transcriptCorrectionReviewPackageRef = ref(
  'caption.transcript.correction.review.a4351e35dc730da196fcdd29d3978df5',
  'canonical-caption-transcript-correction-review-package-v1',
  '911610fb7a111a76585fdeaa12cc92f035820b900dbc76398226326a514e4a03')
const soundIncompletePackageRef = ref(
  'caption.sound.private-runtime.inspection.2026-08-05-v9',
  'caption-sound-private-runtime-inspection-package-v1',
  '8fc28a91ba4c139830468c564edd6c477101bc4d04b22570439c32c12734b194')
const brollOwnerRuntimeReceiptRef = ref(
  'caption.broll.owner.real-source.private-runtime.2026-08-06-v1',
  'caption-broll-owner-private-runtime-receipt-v2',
  '99aaf04e82eff6c628d42e4c33eb99c6ef0b01961d9b82b16ac117efb73ffb94')
const brollDirectInspectionRef = ref(
  'review.caption-broll.real-source.co-composition.2026-08-06-v1',
  'caption-broll-direct-private-inspection-v3',
  'f574f5827033ff8ba809d617241c82cc0523cd9077090f836deab6dbbd727c80')
const brollProfessionalInspectionRef = ref(
  'caption.broll-owner.professional.direct-inspection-2026-08-06-v1',
  'caption-broll-owner-professional-direct-inspection-v1',
  '93f1a59310c6fa5e41f57b39e4b6db6ae82d7b015a800b50ad3b6235ef818adc')
const approvedBrollExecutionInspectionRef = ref(
  'caption.broll-approved.execution.private-inspection.2026-08-07-v14',
  'caption-broll-approved-execution-inspection-package-v3',
  '064d0a4a33b8ae051f48e90e3420dccc4c1f068dcde65cae3a8356ad440f8d26')
const approvedRunExactFramePreterminalEvidenceRef = ref(
  'caption.broll.approved-run.v14.exact-frame-preterminal-evidence',
  'canonical-caption-approved-run-exact-frame-preterminal-evidence-v1',
  '2f44fb5d94cdb7a58f81d546976f77b55a6e433c66e902356ed7dd0c79286966')
const realSourceDirectInspectionRef = ref(
  'caption.real-source.complete-time.direct-inspection-2026-08-05-v1',
  'caption-real-source-complete-time-direct-inspection-v1',
  '004ae03efbf920fdf43015ca4523e5371d3613d5cfdcc7124b8b43410914ba4d')
const realSourceMultiOutputDirectInspectionRef = ref(
  'caption.real-source.multi-output.direct-inspection-2026-08-05-v1',
  'caption-real-source-multi-output-direct-inspection-v1',
  'c4b686fdf2798eda32d1bb047b800b2269a90aed87fa513b0d4bcdbf9b91c34d')
const originalSourceFinalQualityRuntimeIndexRef = ref(
  'caption.original-source.final-quality.runtime-index.2026-08-07-v1',
  'canonical-caption-original-source-final-quality-runtime-index-v1',
  'c6fffac088ae92a62ccdff0660055d45a9846c84e7c033991f3b72bd47f0b01d')
const originalSourceFinalQualityRenderRef = ref(
  'caption.original-source.final-quality.render.2026-08-07-v1',
  'caption-original-source-final-quality-render-v1',
  '2d73a761c667c4d40ced1c160d0a5f550bdc4f5987cd3cc70c868892b7b79840')
const originalSourceCompleteTimeInspectionRef = ref(
  'caption.original-source.final-quality.direct-inspection.2026-08-07-v1',
  'canonical-caption-original-source-final-quality-direct-inspection-receipt-v1',
  '41acf13fe0cabc2cb43bd8a689696d0c9e9a7af0e9133edd779a0b5a4b93d28c')
const approvedExecutionCampaignRef = ref(
  'caption.approved-execution-campaign.77c6cc5730426608eceb07268521ea2e8b178054',
  'canonical-caption-approved-execution-campaign-v1',
  '2528766a9b029cde32aacb94000caf6d966fccb81a6e62e03b6fc905fd2e1fea')
const brollProfessionalFullRenderRef = ref(
  'caption.broll-owner.professional.accepted.full.render',
  'caption-broll-owner-professional-private-render-v1',
  'a75bcfe4dabd4ca4af1cc0893150e4ee66971efd585b826ae2082a95ae76babf')
const brollProfessionalReducedRenderRef = ref(
  'caption.broll-owner.professional.accepted.reduced.render',
  'caption-broll-owner-professional-private-render-v1',
  'a6e5f9089d8be6834fffa504c9653a566412ba544cf55f854747b964f8583128')

const expectedGates: CaptionPrivateInternalEvidenceGateProgress[] = [
  gate('canonical_transcript_owner_authenticated_read',
    'actual_evidence_rejected', [
      transcriptRejectedInspectionRef,
      transcriptCorrectionReviewPackageRef,
    ], [
      'complete_independent_audio_truth_review_required',
      'reviewer_completion_seam_must_emit_exact_review_artifact_and_request',
      'actual_reviewed_correction_owner_v2_expectation_binding_required',
      'corrected_transcript_must_bind_terminal_run_scope',
    ]),
  gate('visual_intelligence_authenticated_evidence',
    'source_ready_missing_actual_evidence', [], [
      'canonical_visual_intelligence_live_model_sku_qualification_executor_required',
      'canonical_visual_intelligence_model_sku_qualification_finalizer_required',
      'canonical_visual_intelligence_same_sku_concurrency_isolation_authority_required',
      'actual_canonical_visual_intelligence_owner_record_required',
      'exact_terminal_run_scope_and_output_frame_binding_required',
    ]),
  gate('track_all_authenticated_evidence',
    'source_ready_missing_actual_evidence', [], [
      'actual_admitted_sam3_1_owner_record_required',
      'independent_scene_qa_authority_and_terminal_scope_binding_required',
    ]),
  gate('soundsync_authenticated_evidence',
    'actual_evidence_incomplete', [soundIncompletePackageRef], [
      'complete_time_independent_listening_review_required',
      'exact_terminal_run_scope_and_final_audio_reread_required',
    ]),
  gate('broll_owner_authenticated_read',
    'actual_evidence_accepted_outside_terminal_scope', [
      brollOwnerRuntimeReceiptRef,
      brollDirectInspectionRef,
      brollProfessionalInspectionRef,
      approvedBrollExecutionInspectionRef,
      approvedRunExactFramePreterminalEvidenceRef,
    ], [
      'final_quality_source_and_final_render_required',
      'preterminal_evidence_must_not_be_relabelled_as_terminal',
      'same_campaign_owner_and_final_canvas_evidence_required',
    ]),
  gate('canonical_backend_private_execution_mount',
    'actual_evidence_incomplete', [
      realSourceDirectInspectionRef,
      realSourceMultiOutputDirectInspectionRef,
      approvedExecutionCampaignRef,
      approvedBrollExecutionInspectionRef,
      approvedRunExactFramePreterminalEvidenceRef,
      originalSourceFinalQualityRuntimeIndexRef,
      originalSourceFinalQualityRenderRef,
      originalSourceCompleteTimeInspectionRef,
    ], [
      'approved_execution_campaign_is_preterminal_structural_evidence_only',
      'actual_owner_evidence_and_final_quality_media_required_in_terminal_scope',
    ]),
  gate('qualified_ai_complete_time_visual_review',
    'actual_evidence_incomplete', [
      realSourceDirectInspectionRef,
      realSourceMultiOutputDirectInspectionRef,
      brollProfessionalInspectionRef,
      originalSourceFinalQualityRenderRef,
      originalSourceCompleteTimeInspectionRef,
    ], [
      'shared_qualified_postrender_ai_review_required_for_each_output',
      'direct_agent_raster_inspection_must_remain_separate_evidence',
    ]),
  gate('independent_final_qa_reread',
    'source_ready_missing_actual_evidence', [], [
      'independent_final_qa_and_private_review_decision_required',
      'exact_repaired_output_reread_required',
    ]),
  gate('final_per_job_qualification_projection',
    'blocked_by_upstream_gates', [], [
      'first_eight_terminal_gates_must_pass_in_one_exact_canonical_run',
      'terminal_projection_must_be_persisted_create_only_and_reread',
    ]),
]

function jobReadinessRef(): CaptionDomainRef {
  return ref(
    CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.ledgerId,
    CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.schemaVersion,
    CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.ledgerDigestSha256)
}

export function parseCaptionPrivateInternalEvidenceProgress(
  value: unknown,
): CaptionPrivateInternalEvidenceProgress {
  assertClosedContractTree(value, 'Caption private evidence progress')
  const parsed = progressSchema.parse(value)
  const digest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'progressDigestSha256')
  if (parsed.progressDigestSha256 !== digest
    || JSON.stringify(parsed.sourceCurrentJobReadinessRef)
      !== JSON.stringify(jobReadinessRef())
    || JSON.stringify(parsed.gates) !== JSON.stringify(expectedGates)
    || parsed.gates.map((item) => item.gapId).join('|')
      !== CAPTION_GOAL_COMPLETION_GAP_IDS.join('|')
    || new Set(parsed.gates.map((item) => item.gapId)).size !== 9) {
    throw new Error('Caption private evidence progress is inconsistent.')
  }
  return structuredClone(parsed)
}

const withoutDigest: Omit<CaptionPrivateInternalEvidenceProgress,
  'progressDigestSha256'> = {
  schemaVersion: CAPTION_PRIVATE_INTERNAL_EVIDENCE_PROGRESS_VERSION,
  progressId: 'captions.private-internal.evidence-progress.2026-08-09-v15',
  observedAt: '2026-08-09T00:55:00.000Z',
  sourceCurrentJobReadinessRef: jobReadinessRef(),
  counts: {
    declaredCaptionJobs: 41,
    captionOwnedImplementationsComplete: 41,
    sourcePathsReadyForPrivateEvidenceRun: 41,
    canonicalOwnerCompositionMountsComplete: 5,
    terminalPrivateInternalQualifiedJobs: 0,
    terminalEvidenceGates: 9,
    terminalEvidenceGatesSatisfied: 0,
    gatesWithActualPrivateEvidenceObserved: 5,
    acceptedEvidenceOutsideTerminalScope: 1,
    incompleteOrRejectedEvidenceGates: 4,
    missingActualEvidenceGates: 3,
    gatesBlockedByUpstreamEvidence: 1,
  },
  gates: expectedGates,
  professionalAppearanceEvidence: {
    realTalkingHeadPixelsInspected: true,
    fullMotionRenderRef: brollProfessionalFullRenderRef,
    reducedMotionRenderRef: brollProfessionalReducedRenderRef,
    directInspectionReceiptRef: brollProfessionalInspectionRef,
    acceptedForCaptionOwnedProfessionalAppearance: true,
    syntheticEngineeringFixtureUsed: false,
    qualifiedSharedPostrenderAiReviewClaimed: false,
    independentFinalQaClaimed: false,
  },
  terminalStatus: 'caption_private_internal_evidence_in_progress',
  targetTerminalStatus: 'caption_specialist_private_internal_qualified',
  oneExactCanonicalRunCompleted: false,
  terminalStatusClaimed: false,
  publicProductionRequiredForTarget: false,
  centralOrchestraRequiredForTarget: false,
  callerSuppliedEvidenceAccepted: false,
  browserLocalCompletionAccepted: false,
  operationOrRuntimeAuthorityGrantedToCaption: false,
  providerOrModelAuthorityGrantedToCaption: false,
  assetMutationAuthorityGrantedToCaption: false,
  finalQaApprovalAuthorityGrantedToCaption: false,
  creditOrBillingAuthorityGrantedToCaption: false,
  publicDeliveryAuthorityGrantedToCaption: false,
  productionAuthorityGrantedToCaption: false,
}

export const CAPTION_CURRENT_PRIVATE_INTERNAL_EVIDENCE_PROGRESS =
parseCaptionPrivateInternalEvidenceProgress({
  ...withoutDigest,
  progressDigestSha256: calculateSkillContractDigest(
    { ...withoutDigest, progressDigestSha256: '' },
    'progressDigestSha256'),
})
