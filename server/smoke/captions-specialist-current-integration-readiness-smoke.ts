import assert from 'node:assert/strict'

import {
  CAPTION_CURRENT_INTEGRATION_READINESS,
  parseCaptionCurrentIntegrationReadiness,
} from '../captions-specialist/caption-current-integration-readiness'
import {
  CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT,
} from '../captions-specialist/caption-goal-completion-audit'
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
  record.readinessDigestSha256 = calculateSkillContractDigest(
    record, 'readinessDigestSha256')
  return record
}

const readiness = parseCaptionCurrentIntegrationReadiness(
  CAPTION_CURRENT_INTEGRATION_READINESS)
check(readiness.currentStatus
  === 'caption_owned_integration_surface_complete_waiting_on_canonical_mounts'
  && !readiness.terminalStatusClaimed,
'The current record separates Caption source completion from terminal status.')
check(!readiness.supersedesFrozenAudit
  && readiness.sourceFrozenGoalAuditRef.contentHash
    === CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT.auditDigestSha256,
'The additive record binds but does not rewrite the frozen CAP-20 audit.')
check(readiness.counts.declaredCaptionJobs === 41
  && readiness.counts.captionOwnedSharedOwnerBoundariesComplete === 5
  && readiness.counts.strictAuthenticatedMultiOwnerSourceFixturePaths === 1
  && readiness.counts.actualAuthenticatedPrivateSharedOwnerIntegrations === 0
  && readiness.counts.remainingTerminalGaps === 9,
'Current counts distinguish source boundaries from actual mounted evidence.')
check(readiness.currentEvidence.captionOwnedFeatureSurfaceComplete
  && readiness.currentEvidence.captionOwnedSharedOwnerContractsComplete
  && readiness.currentEvidence.strictTypedOwnerAdmissionImplemented
  && readiness.currentEvidence.priorOwnerCanonicalRereadImplemented
  && readiness.currentEvidence.referenceOnlyOwnerEvidenceRejected,
'All safe Caption-owned integration behavior is recorded as complete.')
check(readiness.currentEvidence.strictMultiOwnerSourceFixtureCompleted
  && !readiness.currentEvidence.liveProviderOrGpuRuntimeRelabeledFromFixture
  && !readiness.currentEvidence.actualCanonicalResumeRecordConsumed,
'The strict source fixture is not relabeled as a live owner run.')
check(readiness.gapStates.length === 9
  && readiness.gapStates.every((gap) => gap.blocksTerminalStatus
    && !gap.actualCanonicalOwnerRecordConsumed
    && !gap.liveOwnerRuntimeEvidenceConsumed
    && !gap.captionMayImplementDuplicateOwner),
'All nine terminal gaps remain exact and duplicate-owner closed.')
check(readiness.gapStates.slice(0, 5).every((gap) =>
  gap.captionSourceImplementationComplete),
'The five shared-owner Caption boundaries are source-complete.')
check(readiness.gapStates.find((gap) =>
  gap.gapId === 'visual_intelligence_authenticated_evidence')
  ?.canonicalOwnerState === 'actual_owner_evidence_missing'
  && readiness.gapStates.find((gap) =>
    gap.gapId === 'track_all_authenticated_evidence')
    ?.canonicalOwnerState === 'actual_owner_evidence_missing',
'Visual Intelligence and Track All now wait on actual owner evidence, not DTOs.')
check(readiness.gapStates.find((gap) =>
  gap.gapId === 'soundsync_authenticated_evidence')
  ?.canonicalOwnerState === 'canonical_adapter_and_owner_result_missing'
  && readiness.gapStates.find((gap) =>
    gap.gapId === 'broll_owner_authenticated_read')
    ?.canonicalOwnerState === 'authenticated_owner_result_missing',
'SoundSync and B-roll retain their distinct remaining backend gaps.')
check(!readiness.currentEvidence.canonicalBackendPrivateExecutionMounted
  && !readiness.currentEvidence.qualifiedAiCompleteTimeVisualReviewIntegrated
  && !readiness.currentEvidence.independentFinalQaRereadIntegrated
  && !readiness.currentEvidence.terminalPerJobProjectionPublished,
'Missing canonical execution, visual review, final QA, and terminal projection stay closed.')
check(!readiness.centralOrchestraImplemented
  && !readiness.operationDispatchAuthority
  && !readiness.providerOrModelRuntimeAuthority
  && !readiness.assetMutationAuthority
  && !readiness.finalQaApprovalAuthority
  && !readiness.creditOrBillingAuthority
  && !readiness.publicDeliveryAuthority
  && !readiness.productionAuthority,
'The readiness record grants no external authority.')

const staleDigest = structuredClone(readiness)
staleDigest.currentStatus =
  'caption_owned_integration_surface_complete_waiting_on_canonical_mounts'
staleDigest.gapStates[0].sourceEvidenceRefs[0].contentHash = '0'.repeat(64)
expectThrow(() => parseCaptionCurrentIntegrationReadiness(staleDigest))
const semanticOverclaim = structuredClone(readiness) as unknown as
  Record<string, unknown>
const currentEvidence = semanticOverclaim.currentEvidence as
  Record<string, unknown>
currentEvidence.actualCanonicalResumeRecordConsumed = true
expectThrow(() => parseCaptionCurrentIntegrationReadiness(
  redigest(semanticOverclaim)))
const changedGap = structuredClone(readiness)
changedGap.gapStates[0].canonicalOwnerState = 'actual_owner_evidence_missing'
expectThrow(() => parseCaptionCurrentIntegrationReadiness(
  redigest(changedGap)))
const reordered = structuredClone(readiness)
reordered.gapStates.reverse()
expectThrow(() => parseCaptionCurrentIntegrationReadiness(
  redigest(reordered)))
const unknown = structuredClone(readiness) as unknown as Record<string, unknown>
unknown.unexpected = true
expectThrow(() => parseCaptionCurrentIntegrationReadiness(unknown))
const inherited = Object.create({ productionAuthority: true })
Object.assign(inherited, structuredClone(readiness))
expectThrow(() => parseCaptionCurrentIntegrationReadiness(inherited))
const cyclic = structuredClone(readiness) as unknown as Record<string, unknown>
cyclic.cycle = cyclic
expectThrow(() => parseCaptionCurrentIntegrationReadiness(cyclic))

console.log(JSON.stringify({
  smoke: 'captions_specialist_current_integration_readiness',
  assertions,
  readinessVersion: readiness.schemaVersion,
  readinessDigestSha256: readiness.readinessDigestSha256,
  captionOwnedSharedOwnerBoundariesComplete:
    readiness.counts.captionOwnedSharedOwnerBoundariesComplete,
  strictAuthenticatedMultiOwnerSourceFixturePaths:
    readiness.counts.strictAuthenticatedMultiOwnerSourceFixturePaths,
  actualAuthenticatedPrivateSharedOwnerIntegrations:
    readiness.counts.actualAuthenticatedPrivateSharedOwnerIntegrations,
  remainingTerminalGaps: readiness.counts.remainingTerminalGaps,
  terminalStatusClaimed: readiness.terminalStatusClaimed,
  result: 'passed',
}, null, 2))
