import assert from 'node:assert/strict'

import {
  CAPTION_CURRENT_PRIVATE_INTERNAL_EVIDENCE_PROGRESS,
  parseCaptionPrivateInternalEvidenceProgress,
} from '../captions-specialist/caption-private-internal-evidence-progress'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function mutate(
  value: unknown,
  edit: (record: Record<string, unknown>) => void,
): Record<string, unknown> {
  const record = structuredClone(value) as Record<string, unknown>
  edit(record)
  return record
}
function redigest(record: Record<string, unknown>): Record<string, unknown> {
  return {
    ...record,
    progressDigestSha256: calculateSkillContractDigest({
      ...record,
      progressDigestSha256: '',
    }, 'progressDigestSha256'),
  }
}

const progress = parseCaptionPrivateInternalEvidenceProgress(
  CAPTION_CURRENT_PRIVATE_INTERNAL_EVIDENCE_PROGRESS)

check(progress.counts.captionOwnedImplementationsComplete === 41
  && progress.counts.sourcePathsReadyForPrivateEvidenceRun === 41
  && progress.counts.canonicalOwnerCompositionMountsComplete === 5,
'all Caption source paths and canonical owner mounts remain complete')
check(progress.counts.terminalPrivateInternalQualifiedJobs === 0
  && progress.counts.terminalEvidenceGatesSatisfied === 0,
'separate evidence is not relabelled as one terminal run')
check(progress.counts.gatesWithActualPrivateEvidenceObserved === 5
  && progress.counts.acceptedEvidenceOutsideTerminalScope === 1,
'the inventory records real progress without inflating qualification')
check(progress.gates.find((gate) =>
  gate.gapId === 'canonical_transcript_owner_authenticated_read')?.status
    === 'actual_evidence_rejected',
'the rejected private transcript remains rejected')
check(progress.gates.find((gate) =>
  gate.gapId === 'canonical_transcript_owner_authenticated_read')?.evidenceRefs
  .some((reference) => reference.version ===
    'canonical-caption-transcript-correction-review-package-v1'),
'the private transcript gate inventories the real correction review package')
check(progress.gates.find((gate) =>
  gate.gapId === 'visual_intelligence_authenticated_evidence')
  ?.nextRequiredEvidenceCodes.includes(
    'canonical_visual_intelligence_live_model_sku_qualification_executor_required')
  && progress.gates.find((gate) =>
    gate.gapId === 'visual_intelligence_authenticated_evidence')
    ?.nextRequiredEvidenceCodes.includes(
      'canonical_visual_intelligence_same_sku_concurrency_isolation_authority_required')
  && !progress.gates.find((gate) =>
    gate.gapId === 'visual_intelligence_authenticated_evidence')
    ?.nextRequiredEvidenceCodes.includes(
      'canonical_visual_intelligence_model_sku_qualification_finalizer_required')
  && !progress.gates.find((gate) =>
    gate.gapId === 'visual_intelligence_authenticated_evidence')
    ?.nextRequiredEvidenceCodes.includes(
      'canonical_visual_intelligence_billing_observation_create_only_repository_required')
  && !progress.gates.find((gate) =>
    gate.gapId === 'visual_intelligence_authenticated_evidence')
    ?.nextRequiredEvidenceCodes.includes(
      'canonical_visual_intelligence_detailed_billing_export_reconciliation_reader_required'),
'Visual Intelligence records its implemented billing reader, repository, and finalizer while keeping executor and isolation gaps open')
check(progress.gates.find((gate) =>
  gate.gapId === 'soundsync_authenticated_evidence')?.status
    === 'actual_evidence_incomplete',
'the real Sound execution remains incomplete without listening review')
check(progress.gates.find((gate) =>
  gate.gapId === 'broll_owner_authenticated_read')?.status
    === 'actual_evidence_accepted_outside_terminal_scope',
'accepted B-roll evidence remains separate from the terminal edit scope')
check(progress.gates.find((gate) =>
  gate.gapId === 'broll_owner_authenticated_read')?.evidenceRefs.some(
    (reference) => reference.version ===
      'caption-broll-direct-private-inspection-v3'),
'B-roll evidence requires the directly inspected real-source v3 review')
check(progress.gates.find((gate) =>
  gate.gapId === 'broll_owner_authenticated_read')?.evidenceRefs.some(
    (reference) => reference.version ===
      'caption-broll-owner-private-runtime-receipt-v2'),
'B-roll real-source evidence requires the v2 owner runtime receipt')
check(progress.gates.find((gate) =>
  gate.gapId === 'broll_owner_authenticated_read')?.evidenceRefs.some(
    (reference) => reference.version ===
      'caption-broll-owner-professional-direct-inspection-v1'),
'B-roll evidence includes the repaired professional all-frame inspection')
check(progress.gates.find((gate) =>
  gate.gapId === 'broll_owner_authenticated_read')?.evidenceRefs.some(
    (reference) => reference.version ===
      'caption-broll-approved-execution-inspection-package-v3'
      && reference.contentHash ===
        '064d0a4a33b8ae051f48e90e3420dccc4c1f068dcde65cae3a8356ad440f8d26'),
'B-roll evidence inventories the approved 17-job run and its exact readiness blocker')
check(progress.gates.find((gate) =>
  gate.gapId === 'broll_owner_authenticated_read')?.evidenceRefs.some(
    (reference) => reference.version ===
      'canonical-caption-approved-run-exact-frame-preterminal-evidence-v1'
      && reference.contentHash ===
        '2f44fb5d94cdb7a58f81d546976f77b55a6e433c66e902356ed7dd0c79286966'),
'B-roll evidence includes the create-only exact-frame preterminal projection')
check(progress.gates.find((gate) =>
  gate.gapId === 'broll_owner_authenticated_read')
  ?.nextRequiredEvidenceCodes.includes(
    'final_quality_source_and_final_render_required'),
'B-roll now waits on final-quality source and final-canvas evidence')
check(progress.professionalAppearanceEvidence.realTalkingHeadPixelsInspected
  && progress.professionalAppearanceEvidence
    .acceptedForCaptionOwnedProfessionalAppearance
  && progress.professionalAppearanceEvidence.directInspectionReceiptRef
    .version === 'caption-broll-owner-professional-direct-inspection-v1'
  && !progress.professionalAppearanceEvidence.syntheticEngineeringFixtureUsed,
'owner-bound real talking-head appearance evidence remains explicit')
check(progress.gates.find((gate) =>
  gate.gapId === 'canonical_backend_private_execution_mount')
  ?.evidenceRefs.some((reference) => reference.version ===
    'caption-real-source-multi-output-direct-inspection-v1')
  && progress.gates.find((gate) =>
    gate.gapId === 'canonical_backend_private_execution_mount')
    ?.evidenceRefs.some((reference) => reference.version ===
      'caption-broll-approved-execution-inspection-package-v3')
  && progress.gates.find((gate) =>
    gate.gapId === 'qualified_ai_complete_time_visual_review')
    ?.evidenceRefs.some((reference) => reference.version ===
      'caption-real-source-multi-output-direct-inspection-v1'),
'real multi-output and approved B-roll execution evidence is inventoried without closing gates')
check(progress.gates.find((gate) =>
  gate.gapId === 'canonical_backend_private_execution_mount')
  ?.evidenceRefs.some((reference) => reference.version ===
    'canonical-caption-original-source-final-quality-runtime-index-v1'
    && reference.contentHash ===
      'c6fffac088ae92a62ccdff0660055d45a9846c84e7c033991f3b72bd47f0b01d')
  && progress.gates.find((gate) =>
    gate.gapId === 'canonical_backend_private_execution_mount')
    ?.evidenceRefs.some((reference) => reference.version ===
      'caption-original-source-final-quality-render-v1'
      && reference.contentHash ===
        '2d73a761c667c4d40ced1c160d0a5f550bdc4f5987cd3cc70c868892b7b79840'),
'the canonical execution gate inventories the exact original-source 4K runtime and render')
check(progress.gates.find((gate) =>
  gate.gapId === 'canonical_backend_private_execution_mount')
  ?.evidenceRefs.some((reference) => reference.version ===
    'canonical-caption-approved-execution-campaign-v1'
    && reference.contentHash ===
      '2528766a9b029cde32aacb94000caf6d966fccb81a6e62e03b6fc905fd2e1fea')
  && progress.gates.find((gate) =>
    gate.gapId === 'canonical_backend_private_execution_mount')
    ?.nextRequiredEvidenceCodes.includes(
      'actual_owner_evidence_and_final_quality_media_required_in_terminal_scope')
  && !progress.gates.find((gate) =>
    gate.gapId === 'canonical_backend_private_execution_mount')
    ?.nextRequiredEvidenceCodes.includes(
      'representative_approved_runs_must_cover_all_forty_one_caption_jobs'),
'the 16-run campaign closes structural execution coverage without claiming terminal media evidence')
check(progress.gates.find((gate) =>
  gate.gapId === 'qualified_ai_complete_time_visual_review')
  ?.evidenceRefs.some((reference) => reference.version ===
    'canonical-caption-original-source-final-quality-direct-inspection-receipt-v1'
    && reference.contentHash ===
      '41acf13fe0cabc2cb43bd8a689696d0c9e9a7af0e9133edd779a0b5a4b93d28c'),
'complete-time direct inspection is inventoried without relabelling it as qualified visual AI')
check(!progress.professionalAppearanceEvidence
  .qualifiedSharedPostrenderAiReviewClaimed
  && !progress.professionalAppearanceEvidence.independentFinalQaClaimed,
'direct inspection is not relabelled as shared visual AI or final QA')
check(progress.gates.every((gate) =>
  !gate.sameCanonicalTerminalRunBound
  && !gate.terminalGateSatisfied
  && !gate.historicalOrSeparateFixtureRelabeledAsTerminalEvidence),
'every gate remains fail closed outside one exact canonical run')
check(!progress.oneExactCanonicalRunCompleted
  && !progress.terminalStatusClaimed
  && progress.terminalStatus ===
    'caption_private_internal_evidence_in_progress',
'current and target statuses remain distinct')
check(!progress.publicProductionRequiredForTarget
  && !progress.centralOrchestraRequiredForTarget,
'private internal qualification does not require public production or HQ')
check(!progress.operationOrRuntimeAuthorityGrantedToCaption
  && !progress.providerOrModelAuthorityGrantedToCaption
  && !progress.assetMutationAuthorityGrantedToCaption
  && !progress.finalQaApprovalAuthorityGrantedToCaption
  && !progress.creditOrBillingAuthorityGrantedToCaption
  && !progress.publicDeliveryAuthorityGrantedToCaption
  && !progress.productionAuthorityGrantedToCaption,
'the progress record grants no external authority')

expectThrow(() => parseCaptionPrivateInternalEvidenceProgress({
  ...progress,
  unknown: true,
}))
expectThrow(() => parseCaptionPrivateInternalEvidenceProgress({
  ...progress,
  progressDigestSha256: '0'.repeat(64),
}))
expectThrow(() => parseCaptionPrivateInternalEvidenceProgress(redigest(mutate(
  progress, (record) => {
    const counts = record.counts as Record<string, unknown>
    counts.terminalEvidenceGatesSatisfied = 1
  }))))
expectThrow(() => parseCaptionPrivateInternalEvidenceProgress(redigest(mutate(
  progress, (record) => {
    const gates = record.gates as Array<Record<string, unknown>>
    gates[4].sameCanonicalTerminalRunBound = true
  }))))
expectThrow(() => parseCaptionPrivateInternalEvidenceProgress(redigest(mutate(
  progress, (record) => {
    const gates = record.gates as Array<Record<string, unknown>>
    gates[0].status = 'actual_evidence_accepted_outside_terminal_scope'
  }))))
expectThrow(() => parseCaptionPrivateInternalEvidenceProgress(redigest(mutate(
  progress, (record) => {
    const appearance = record.professionalAppearanceEvidence as
      Record<string, unknown>
    appearance.qualifiedSharedPostrenderAiReviewClaimed = true
  }))))
expectThrow(() => parseCaptionPrivateInternalEvidenceProgress(redigest(mutate(
  progress, (record) => { record.terminalStatusClaimed = true }))))

const inherited = Object.create({
  productionAuthorityGrantedToCaption: true,
}) as Record<string, unknown>
Object.assign(inherited, progress)
expectThrow(() => parseCaptionPrivateInternalEvidenceProgress(inherited))
const cyclic = structuredClone(progress) as unknown as Record<string, unknown>
cyclic.cycle = cyclic
expectThrow(() => parseCaptionPrivateInternalEvidenceProgress(cyclic))

console.log(JSON.stringify({
  smoke: 'captions_specialist_private_internal_evidence_progress',
  assertions,
  captionOwnedImplementationsComplete:
    progress.counts.captionOwnedImplementationsComplete,
  sourcePathsReadyForPrivateEvidenceRun:
    progress.counts.sourcePathsReadyForPrivateEvidenceRun,
  gatesWithActualPrivateEvidenceObserved:
    progress.counts.gatesWithActualPrivateEvidenceObserved,
  terminalEvidenceGatesSatisfied:
    progress.counts.terminalEvidenceGatesSatisfied,
  terminalStatus: progress.terminalStatus,
  targetTerminalStatus: progress.targetTerminalStatus,
  result: 'passed',
}, null, 2))
