import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  CAPTION_GOAL_COMPLETION_AUDIT_VERSION,
  CAPTION_GOAL_COMPLETION_GAP_IDS,
  type CaptionGoalCompletionAudit,
  type CaptionGoalCompletionGap,
  type CaptionGoalCompletionOwnerKey,
} from '../../src/types/caption-goal-completion-audit'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF } from
  './caption-shared-owner-integration'
import { CAPTIONS_SPECIALIST_MANIFEST } from
  './captions-specialist-manifest'
import { CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT } from
  './captions-specialist-qualification'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const ownerKeySchema = z.enum([
  'captions', 'backend_workflow', 'canonical_transcript',
  'visual_intelligence', 'track_all', 'soundsync', 'broll_owner',
  'canonical_postrender_visual_qa', 'canonical_private_review',
])
const gapIdSchema = z.enum(CAPTION_GOAL_COMPLETION_GAP_IDS)

const gapSchema: z.ZodType<CaptionGoalCompletionGap> = z.object({
  gapId: gapIdSchema,
  ownerKeys: z.array(ownerKeySchema).min(1).max(3),
  missingEvidenceCodes: z.array(safeKey).min(1).max(8),
  prerequisiteRefs: z.array(refSchema).max(8),
  blocksTerminalStatus: z.literal(true),
  captionMayImplementDuplicateOwner: z.literal(false),
  runtimeOrDispatchAuthorityGrantedByAudit: z.literal(false),
}).strict()

const auditSchema: z.ZodType<CaptionGoalCompletionAudit> = z.object({
  schemaVersion: z.literal(CAPTION_GOAL_COMPLETION_AUDIT_VERSION),
  auditId: safeKey,
  auditDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  sourceSequentialResumeCheckpointRef: refSchema,
  sourceCap20ReleaseRef: refSchema,
  sourceSharedOwnerIntegrationHandoffRef: refSchema,
  sourcePlanningManifestRef: refSchema,
  sourcePlanningQualificationSnapshotRef: refSchema,
  counts: z.object({
    declaredCaptionJobs: z.literal(41),
    currentlyAdmittedJobs: z.literal(29),
    conditionalSharedOwnerJobs: z.literal(12),
    requiredSharedOwners: z.literal(5),
    authenticatedPrivateSharedOwnerIntegrations: z.literal(0),
    remainingTerminalGaps: z.literal(9),
  }).strict(),
  completedEvidence: z.object({
    cap00rThroughCap20SourceMilestonesComplete: z.literal(true),
    captionFeatureModulesComplete: z.literal(true),
    planningManifestComplete: z.literal(true),
    perJobPlanningQualificationComplete: z.literal(true),
    standalonePlanningRuntimeAndHarnessComplete: z.literal(true),
    boundedSequentialSupportResumeProved: z.literal(true),
    currentAdmittedSurfaceQualified: z.literal(true),
    actualPrivateRenderedMediaEvidencePresent: z.literal(true),
    directRenderedRasterInspectionPresent: z.literal(true),
    captionLivingFrameTypedBoundaryComplete: z.literal(true),
    sharedOwnerPublicHandoffComplete: z.literal(true),
  }).strict(),
  terminalEvidence: z.object({
    canonicalBackendPrivateExecutionMounted: z.literal(false),
    fullConditionalJobSurfaceIntegrated: z.literal(false),
    authenticatedPrivateSharedOwnerEvidenceIntegrated: z.literal(false),
    qualifiedAiCompleteTimeVisualReviewIntegrated: z.literal(false),
    independentFinalQaRereadIntegrated: z.literal(false),
    finalPerJobQualificationProjectionPublished: z.literal(false),
  }).strict(),
  gaps: z.array(gapSchema).length(9),
  currentStatus: z.literal('ready_for_shared_pipeline_integration'),
  targetTerminalStatus: z.literal(
    'caption_specialist_private_internal_qualified'),
  terminalStatusClaimed: z.literal(false),
  publicProductionRequiredForTerminalStatus: z.literal(false),
  centralOrchestraRequiredForTerminalStatus: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  historicalEvidenceRelabeledAsFreshRuntime: z.literal(false),
  technicalQaRelabeledAsVisualAiReview: z.literal(false),
  directVisualInspectionRelabeledAsCompleteTimeAiReview: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerOrModelRuntimeAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  finalQaApprovalAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const cap20ReleaseRef: CaptionDomainRef = {
  id: 'captions.private.internal.release.cap20',
  version: 'caption-private-internal-release-manifest-v1',
  contentHash:
    'ea24f3593733c3f8c62a5758fdad099aa256c90dd7118903586628f453e8d8af',
}
const sequentialResumeCheckpointRef: CaptionDomainRef = {
  id: 'captions.specialist.sequential-resume.06633bf72258a47fa9c360d471a16f69a46224ab',
  version: 'captions-specialist-v1',
  contentHash: hashText('06633bf72258a47fa9c360d471a16f69a46224ab'),
}
const sharedOwnerHandoffRef: CaptionDomainRef = {
  id: CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF.handoffId,
  version: CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF.schemaVersion,
  contentHash:
    CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF.handoffDigestSha256,
}
const planningManifestRef: CaptionDomainRef = {
  id: CAPTIONS_SPECIALIST_MANIFEST.manifestId,
  version: CAPTIONS_SPECIALIST_MANIFEST.manifestSchemaVersion,
  contentHash: CAPTIONS_SPECIALIST_MANIFEST.manifestHash,
}
const planningQualificationSnapshotRef: CaptionDomainRef = {
  id: CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.snapshotId,
  version: CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.schemaVersion,
  contentHash:
    CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.snapshotDigestSha256,
}

function gap(
  gapId: CaptionGoalCompletionGap['gapId'],
  ownerKeys: CaptionGoalCompletionOwnerKey[],
  missingEvidenceCodes: string[],
  prerequisiteRefs: CaptionDomainRef[] = [],
): CaptionGoalCompletionGap {
  return {
    gapId,
    ownerKeys,
    missingEvidenceCodes,
    prerequisiteRefs,
    blocksTerminalStatus: true,
    captionMayImplementDuplicateOwner: false,
    runtimeOrDispatchAuthorityGrantedByAudit: false,
  }
}

const expectedGaps: CaptionGoalCompletionGap[] = [
  gap('canonical_transcript_owner_authenticated_read',
    ['canonical_transcript', 'backend_workflow'], [
      'canonical_transcript_authenticated_read_binding_not_frozen',
      'speaker_diarization_owner_result_not_integrated',
    ]),
  gap('visual_intelligence_authenticated_evidence',
    ['visual_intelligence', 'backend_workflow'], [
      'visual_intelligence_private_owner_result_not_reread',
      'caption_visual_evidence_admission_not_exercised_end_to_end',
    ]),
  gap('track_all_authenticated_evidence',
    ['track_all', 'backend_workflow'], [
      'track_all_private_owner_result_not_reread',
      'sam3_1_qualified_scene_evidence_not_integrated',
    ]),
  gap('soundsync_authenticated_evidence',
    ['soundsync', 'backend_workflow'], [
      'soundsync_private_owner_result_not_reread',
      'caption_sound_admission_not_exercised_end_to_end',
    ]),
  gap('broll_owner_authenticated_read',
    ['broll_owner', 'backend_workflow'], [
      'caption_broll_owner_request_result_adapter_not_frozen',
      'broll_selected_crop_timing_occupancy_result_not_reread',
    ]),
  gap('canonical_backend_private_execution_mount',
    ['backend_workflow', 'captions'], [
      'caption_execution_bundle_not_mounted_by_canonical_backend',
      'caption_job_results_not_persisted_and_reread_end_to_end',
    ], [sequentialResumeCheckpointRef]),
  gap('qualified_ai_complete_time_visual_review',
    ['canonical_postrender_visual_qa', 'backend_workflow'], [
      'qualified_ai_complete_time_review_not_performed',
      'authenticated_postrender_visual_result_not_reread_for_each_output',
    ]),
  gap('independent_final_qa_reread',
    ['canonical_private_review', 'backend_workflow'], [
      'independent_final_qa_result_not_reread',
      'private_review_decision_not_bound_to_repaired_output',
    ]),
  gap('final_per_job_qualification_projection',
    ['captions', 'backend_workflow'], [
      'private_internal_per_job_snapshot_not_published',
      'terminal_release_manifest_not_published',
    ], [cap20ReleaseRef, sharedOwnerHandoffRef]),
]

function refKey(ref: CaptionDomainRef): string {
  return `${ref.id}|${ref.version}|${ref.contentHash}`
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return refKey(left) === refKey(right)
}

function listsAreUnique(gapValue: CaptionGoalCompletionGap): boolean {
  return new Set(gapValue.ownerKeys).size === gapValue.ownerKeys.length
    && new Set(gapValue.missingEvidenceCodes).size
      === gapValue.missingEvidenceCodes.length
    && new Set(gapValue.prerequisiteRefs.map(refKey)).size
      === gapValue.prerequisiteRefs.length
}

export function parseCaptionGoalCompletionAudit(
  value: unknown,
): CaptionGoalCompletionAudit {
  assertClosedContractTree(value, 'Caption goal completion audit')
  const parsed = auditSchema.parse(value)
  const expectedDigest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'auditDigestSha256')
  if (expectedDigest !== parsed.auditDigestSha256
    || !sameRef(parsed.sourceSequentialResumeCheckpointRef,
      sequentialResumeCheckpointRef)
    || !sameRef(parsed.sourceCap20ReleaseRef, cap20ReleaseRef)
    || !sameRef(parsed.sourceSharedOwnerIntegrationHandoffRef,
      sharedOwnerHandoffRef)
    || !sameRef(parsed.sourcePlanningManifestRef, planningManifestRef)
    || !sameRef(parsed.sourcePlanningQualificationSnapshotRef,
      planningQualificationSnapshotRef)
    || parsed.gaps.map((item) => item.gapId).join('|')
      !== CAPTION_GOAL_COMPLETION_GAP_IDS.join('|')
    || JSON.stringify(parsed.gaps) !== JSON.stringify(expectedGaps)
    || !parsed.gaps.every(listsAreUnique)) {
    throw new Error('Caption goal completion audit semantics are invalid.')
  }
  return structuredClone(parsed)
}

const auditWithoutDigest: Omit<CaptionGoalCompletionAudit,
  'auditDigestSha256'> = {
  schemaVersion: CAPTION_GOAL_COMPLETION_AUDIT_VERSION,
  auditId: 'captions.goal.completion.audit.post-cap20',
  observedAt: '2026-08-04T00:00:00.000Z',
  sourceSequentialResumeCheckpointRef: sequentialResumeCheckpointRef,
  sourceCap20ReleaseRef: cap20ReleaseRef,
  sourceSharedOwnerIntegrationHandoffRef: sharedOwnerHandoffRef,
  sourcePlanningManifestRef: planningManifestRef,
  sourcePlanningQualificationSnapshotRef: planningQualificationSnapshotRef,
  counts: {
    declaredCaptionJobs: 41,
    currentlyAdmittedJobs: 29,
    conditionalSharedOwnerJobs: 12,
    requiredSharedOwners: 5,
    authenticatedPrivateSharedOwnerIntegrations: 0,
    remainingTerminalGaps: 9,
  },
  completedEvidence: {
    cap00rThroughCap20SourceMilestonesComplete: true,
    captionFeatureModulesComplete: true,
    planningManifestComplete: true,
    perJobPlanningQualificationComplete: true,
    standalonePlanningRuntimeAndHarnessComplete: true,
    boundedSequentialSupportResumeProved: true,
    currentAdmittedSurfaceQualified: true,
    actualPrivateRenderedMediaEvidencePresent: true,
    directRenderedRasterInspectionPresent: true,
    captionLivingFrameTypedBoundaryComplete: true,
    sharedOwnerPublicHandoffComplete: true,
  },
  terminalEvidence: {
    canonicalBackendPrivateExecutionMounted: false,
    fullConditionalJobSurfaceIntegrated: false,
    authenticatedPrivateSharedOwnerEvidenceIntegrated: false,
    qualifiedAiCompleteTimeVisualReviewIntegrated: false,
    independentFinalQaRereadIntegrated: false,
    finalPerJobQualificationProjectionPublished: false,
  },
  gaps: expectedGaps,
  currentStatus: 'ready_for_shared_pipeline_integration',
  targetTerminalStatus: 'caption_specialist_private_internal_qualified',
  terminalStatusClaimed: false,
  publicProductionRequiredForTerminalStatus: false,
  centralOrchestraRequiredForTerminalStatus: false,
  centralOrchestraImplemented: false,
  browserLocalCompletionAccepted: false,
  historicalEvidenceRelabeledAsFreshRuntime: false,
  technicalQaRelabeledAsVisualAiReview: false,
  directVisualInspectionRelabeledAsCompleteTimeAiReview: false,
  operationDispatchAuthority: false,
  providerOrModelRuntimeAuthority: false,
  assetMutationAuthority: false,
  finalQaApprovalAuthority: false,
  creditOrBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}

export const CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT =
parseCaptionGoalCompletionAudit({
  ...auditWithoutDigest,
  auditDigestSha256: calculateSkillContractDigest(
    { ...auditWithoutDigest, auditDigestSha256: '' }, 'auditDigestSha256'),
})

function hashText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
