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
const soundIncompletePackageRef = ref(
  'caption.sound.private-runtime.inspection.2026-08-05-v9',
  'caption-sound-private-runtime-inspection-package-v1',
  '8fc28a91ba4c139830468c564edd6c477101bc4d04b22570439c32c12734b194')
const brollOwnerRuntimeReceiptRef = ref(
  'caption.broll.owner.private-runtime.2026-08-05-v3',
  'caption-broll-owner-private-runtime-receipt-v1',
  'e21e08a9969db634d53d7d3c1d291f2360d7b99aab860a4b21dd96042e20047e')
const brollDirectInspectionRef = ref(
  'review.caption-broll.public-canonical.v3',
  'caption-broll-direct-private-inspection-v1',
  '0430a5e1ed801337e1a2d1967474dec1084e1cc0ee8ad1627fa2492731fa9dc4')
const realSourceDirectInspectionRef = ref(
  'caption.real-source.complete-time.direct-inspection-2026-08-05-v1',
  'caption-real-source-complete-time-direct-inspection-v1',
  '004ae03efbf920fdf43015ca4523e5371d3613d5cfdcc7124b8b43410914ba4d')
const realSourceMultiOutputDirectInspectionRef = ref(
  'caption.real-source.multi-output.direct-inspection-2026-08-05-v1',
  'caption-real-source-multi-output-direct-inspection-v1',
  'c4b686fdf2798eda32d1bb047b800b2269a90aed87fa513b0d4bcdbf9b91c34d')
const realSourceFullRenderRef = ref(
  'caption.real-source.render.full_motion',
  'caption-real-source-private-review-render-v1',
  '200abd32615cbed07739243880ed7993998609451ad911a1bddac9e686fa939f')
const realSourceReducedRenderRef = ref(
  'caption.real-source.render.reduced_motion',
  'caption-real-source-private-review-render-v1',
  'b8b87995c9031a0221a304bd1c06bfe6beeb1c186b5818d28758fd511f606e74')

const expectedGates: CaptionPrivateInternalEvidenceGateProgress[] = [
  gate('canonical_transcript_owner_authenticated_read',
    'actual_evidence_rejected', [transcriptRejectedInspectionRef], [
      'complete_independent_audio_truth_review_required',
      'mounted_reviewed_correction_owner_must_persist_and_reread_result',
      'corrected_transcript_must_bind_terminal_run_scope',
    ]),
  gate('visual_intelligence_authenticated_evidence',
    'source_ready_missing_actual_evidence', [], [
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
      brollOwnerRuntimeReceiptRef, brollDirectInspectionRef,
    ], [
      'accepted_broll_owner_result_must_be_rerun_or_rebound_in_terminal_scope',
      'same_package_snapshot_output_and_work_graph_required',
    ]),
  gate('canonical_backend_private_execution_mount',
    'actual_evidence_incomplete', [
      realSourceDirectInspectionRef,
      realSourceMultiOutputDirectInspectionRef,
    ], [
      'representative_approved_runs_must_cover_all_forty_one_caption_jobs',
      'each_run_must_reread_every_projected_result_and_artifact',
    ]),
  gate('qualified_ai_complete_time_visual_review',
    'actual_evidence_incomplete', [
      realSourceDirectInspectionRef,
      realSourceMultiOutputDirectInspectionRef,
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
  progressId: 'captions.private-internal.evidence-progress.2026-08-05-v2',
  observedAt: '2026-08-05T20:33:01.000-04:00',
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
    fullMotionRenderRef: realSourceFullRenderRef,
    reducedMotionRenderRef: realSourceReducedRenderRef,
    directInspectionReceiptRef: realSourceDirectInspectionRef,
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
