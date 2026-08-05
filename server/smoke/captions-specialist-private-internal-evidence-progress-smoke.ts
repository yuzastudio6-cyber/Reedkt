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
  gate.gapId === 'soundsync_authenticated_evidence')?.status
    === 'actual_evidence_incomplete',
'the real Sound execution remains incomplete without listening review')
check(progress.gates.find((gate) =>
  gate.gapId === 'broll_owner_authenticated_read')?.status
    === 'actual_evidence_accepted_outside_terminal_scope',
'accepted B-roll evidence remains separate from the terminal edit scope')
check(progress.professionalAppearanceEvidence.realTalkingHeadPixelsInspected
  && progress.professionalAppearanceEvidence
    .acceptedForCaptionOwnedProfessionalAppearance
  && !progress.professionalAppearanceEvidence.syntheticEngineeringFixtureUsed,
'real talking-head appearance evidence remains explicit')
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
