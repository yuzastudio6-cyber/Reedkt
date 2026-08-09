import assert from 'node:assert/strict'

import {
  CAPTION_CURRENT_JOB_READINESS_LEDGER,
  CAPTION_CURRENT_JOB_READINESS_LEDGER_V2,
  parseCaptionCurrentJobReadinessLedger,
  parseCaptionCurrentJobReadinessLedgerV2,
} from '../captions-specialist/caption-current-job-readiness'
import { CAPTIONS_SUPPORTED_JOB_TYPES } from
  '../../src/types/captions-specialist'
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
function redigest(value: unknown): Record<string, unknown> {
  const record = structuredClone(value) as Record<string, unknown>
  record.ledgerDigestSha256 = calculateSkillContractDigest(
    record, 'ledgerDigestSha256')
  return record
}

const ledger = parseCaptionCurrentJobReadinessLedger(
  CAPTION_CURRENT_JOB_READINESS_LEDGER)
const readyJobs = ledger.jobs.filter((job) =>
  job.sourceReadiness === 'ready_for_private_internal_evidence_run')
const waitingJobs = ledger.jobs.filter((job) =>
  job.sourceReadiness === 'waiting_on_canonical_owner_mount')

check(ledger.jobs.length === 41
  && ledger.jobs.map((job) => job.jobType).join('|')
    === CAPTIONS_SUPPORTED_JOB_TYPES.join('|'),
'The current readiness ledger covers all 41 supported jobs in canonical order.')
check(ledger.counts.captionOwnedImplementationsComplete === 41
  && readyJobs.length === 37
  && waitingJobs.length === 4
  && ledger.counts.terminalPrivateInternalQualifiedJobs === 0,
'Caption source completion, source-path readiness, and terminal evidence remain distinct.')
check(waitingJobs.map((job) => job.jobType).join('|') === [
  'provide_typographic_transition_support',
  'prepare_caption_boundary_timing_requirements',
  'provide_typographic_transition_component',
  'provide_caption_broll_composition_constraints',
].join('|'),
'Only the three SoundSync jobs and one B-roll job wait on owner composition mounts.')
check(waitingJobs.slice(0, 3).every((job) =>
  job.missingCanonicalOwnerMountKeys.join('|') === 'soundsync')
  && waitingJobs[3]?.missingCanonicalOwnerMountKeys.join('|') === 'broll_owner',
'Each blocked source path identifies its exact missing canonical owner.')
check(ledger.jobs.find((job) => job.jobType === 'resolve_spatial_typography')
  ?.requiredSharedOwnerKeys.join('|')
    === 'canonical_transcript|visual_intelligence'
  && ledger.jobs.find((job) =>
    job.jobType === 'provide_caption_safe_region_constraints')
    ?.requiredSharedOwnerKeys.join('|') === 'track_all|visual_intelligence',
'Multi-owner Caption jobs retain their exact owner requirements.')
check(ledger.ownerMounts.map((owner) =>
  `${owner.ownerKey}:${owner.canonicalCompositionMountImplemented}`).join('|')
  === [
    'visual_intelligence:true',
    'canonical_transcript:true',
    'track_all:true',
    'soundsync:false',
    'broll_owner:false',
  ].join('|'),
'The owner mount ledger records the exact three mounted and two pending owners.')
check(ledger.jobs.every((job) =>
  job.captionOwnedImplementationComplete
  && job.planningModeQualified
  && !job.actualPrivateEvidenceAccepted
  && !job.terminalPrivateInternalQualified
  && !job.excludedFromSupportedCapabilitySurface),
'No source-ready job is relabeled as terminally qualified or silently excluded.')
check(!ledger.publicProductionRequiredForInternalQualification
  && !ledger.centralOrchestraRequiredForInternalQualification
  && !ledger.centralOrchestraImplemented
  && !ledger.operationOrRuntimeAuthorityGrantedToCaption
  && !ledger.providerOrModelAuthorityGrantedToCaption
  && !ledger.assetMutationAuthorityGrantedToCaption
  && !ledger.finalQaApprovalAuthorityGrantedToCaption
  && !ledger.creditOrBillingAuthorityGrantedToCaption
  && !ledger.publicDeliveryAuthorityGrantedToCaption
  && !ledger.productionAuthorityGrantedToCaption,
'Internal-test readiness grants no shared-owner, runtime, billing, delivery, or production authority.')

const reordered = structuredClone(ledger)
reordered.jobs.reverse()
expectThrow(() => parseCaptionCurrentJobReadinessLedger(redigest(reordered)))
const falseMount = structuredClone(ledger)
falseMount.ownerMounts[3]!.canonicalCompositionMountImplemented = true
expectThrow(() => parseCaptionCurrentJobReadinessLedger(redigest(falseMount)))
const hiddenBlocker = structuredClone(ledger)
hiddenBlocker.jobs.find((job) =>
  job.jobType === 'provide_typographic_transition_support')!
  .sourceReadiness = 'ready_for_private_internal_evidence_run'
expectThrow(() => parseCaptionCurrentJobReadinessLedger(redigest(hiddenBlocker)))
const terminalOverclaim = structuredClone(ledger)
terminalOverclaim.jobs[0]!.terminalPrivateInternalQualified = true as false
expectThrow(() => parseCaptionCurrentJobReadinessLedger(
  redigest(terminalOverclaim)))
const authorityOverclaim = structuredClone(ledger)
authorityOverclaim.productionAuthorityGrantedToCaption = true as false
expectThrow(() => parseCaptionCurrentJobReadinessLedger(
  redigest(authorityOverclaim)))
const unknown = structuredClone(ledger) as unknown as Record<string, unknown>
unknown.unexpected = true
expectThrow(() => parseCaptionCurrentJobReadinessLedger(redigest(unknown)))
const inherited = Object.create(ledger)
expectThrow(() => parseCaptionCurrentJobReadinessLedger(inherited))

const ledgerV2 = parseCaptionCurrentJobReadinessLedgerV2(
  CAPTION_CURRENT_JOB_READINESS_LEDGER_V2)
check(ledgerV2.counts.sourcePathsReadyForPrivateEvidenceRun === 41
  && ledgerV2.counts.jobsWaitingOnCanonicalOwnerMount === 0
  && ledgerV2.counts.canonicalOwnerCompositionMounts === 5,
'The additive V2 ledger records all five concrete owner mounts and 41 source-ready paths.')
check(ledgerV2.ownerMounts.every((owner) =>
  owner.canonicalCompositionMountImplemented
  && !owner.actualAuthenticatedPrivateEvidenceConsumed)
  && ledgerV2.jobs.every((job) =>
    job.sourceReadiness === 'ready_for_private_internal_evidence_run'
    && job.missingCanonicalOwnerMountKeys.length === 0
    && !job.terminalPrivateInternalQualified),
'Source-mount closure must not be relabeled as private execution evidence.')
check(!ledgerV2.actualSoundPrivateEvidenceConsumed
  && !ledgerV2.actualBrollPrivateEvidenceConsumed
  && !ledgerV2.directCaptionVisualInspectionCompletedForThisLedger
  && !ledgerV2.independentFinalQaCompletedForThisLedger
  && !ledgerV2.terminalStatusClaimed,
'The V2 ledger keeps every remaining private-evidence gate explicit.')
const v2Overclaim = structuredClone(ledgerV2)
v2Overclaim.actualSoundPrivateEvidenceConsumed = true as false
expectThrow(() => parseCaptionCurrentJobReadinessLedgerV2(
  redigest(v2Overclaim)))
const v2MissingMount = structuredClone(ledgerV2)
v2MissingMount.ownerMounts[3]!.canonicalCompositionMountImplemented = false
expectThrow(() => parseCaptionCurrentJobReadinessLedgerV2(
  redigest(v2MissingMount)))

console.log(JSON.stringify({
  smoke: 'captions_specialist_current_job_readiness',
  status: 'passed',
  assertions,
  declaredSupportedJobs: ledger.counts.declaredSupportedJobs,
  captionOwnedImplementationsComplete:
    ledger.counts.captionOwnedImplementationsComplete,
  sourcePathsReadyForPrivateEvidenceRun:
    ledgerV2.counts.sourcePathsReadyForPrivateEvidenceRun,
  jobsWaitingOnCanonicalOwnerMount:
    ledgerV2.counts.jobsWaitingOnCanonicalOwnerMount,
  terminalPrivateInternalQualifiedJobs:
    ledger.counts.terminalPrivateInternalQualifiedJobs,
  pendingCanonicalOwners: ledgerV2.ownerMounts.filter((owner) =>
    !owner.canonicalCompositionMountImplemented).map((owner) => owner.ownerKey),
  productionAuthority: ledger.productionAuthorityGrantedToCaption,
}, null, 2))
