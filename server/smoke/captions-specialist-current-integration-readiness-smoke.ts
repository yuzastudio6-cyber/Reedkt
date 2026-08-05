import assert from 'node:assert/strict'

import {
  CAPTION_CURRENT_INTEGRATION_READINESS,
  CAPTION_CURRENT_INTEGRATION_READINESS_V2,
  CAPTION_CURRENT_INTEGRATION_READINESS_V3,
  parseCaptionCurrentIntegrationReadiness,
  parseCaptionCurrentIntegrationReadinessV2,
  parseCaptionCurrentIntegrationReadinessV3,
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

const readinessV2 = parseCaptionCurrentIntegrationReadinessV2(
  CAPTION_CURRENT_INTEGRATION_READINESS_V2)
check(readinessV2.currentStatus
  === 'source_integration_complete_waiting_on_private_runtime_evidence'
  && readinessV2.supersedesReadinessRef.contentHash
    === readiness.readinessDigestSha256,
'V2 advances the source-mount truth while preserving the frozen V1 checkpoint.')
check(readinessV2.counts.canonicalSharedOwnerSourceMounts === 5
  && readinessV2.counts.canonicalBackendExecutionMounts === 1
  && readinessV2.counts.postrenderAndPrivateReviewSourceMounts === 2
  && readinessV2.counts.terminalProjectionContractsPublished === 1
  && readinessV2.counts.actualAuthenticatedPrivateSharedOwnerIntegrations === 0,
'V2 distinguishes completed source mounts from missing actual private evidence.')
check(readinessV2.gapStates.length === 9
  && readinessV2.gapStates.every((gap) =>
    gap.captionSourceImplementationComplete
    && gap.canonicalSourceMountImplemented
    && !gap.actualCanonicalOwnerRecordConsumed
    && gap.blocksTerminalStatus),
'Every source gap is closed while every corresponding evidence gate stays closed.')
check(readinessV2.currentEvidence.canonicalTranscriptExecutionMountImplemented
  && readinessV2.currentEvidence.visualIntelligenceSupportResumeMountImplemented
  && readinessV2.currentEvidence.trackAllSupportResumeMountImplemented
  && readinessV2.currentEvidence.soundSyncSupportResumeMountImplemented
  && readinessV2.currentEvidence.brollSupportResumeMountImplemented
  && readinessV2.currentEvidence.canonicalBackendPrivateExecutionMountImplemented
  && readinessV2.currentEvidence.terminalPerJobProjectionContractPublished,
'The complete Caption source integration surface is represented exactly.')
const v2Overclaim = structuredClone(readinessV2) as unknown as
  Record<string, unknown>
const v2Evidence = v2Overclaim.currentEvidence as Record<string, unknown>
v2Evidence.actualPrivateOwnerRuntimeEvidenceConsumed = true
expectThrow(() => parseCaptionCurrentIntegrationReadinessV2(
  redigest(v2Overclaim)))

const readinessV3 = parseCaptionCurrentIntegrationReadinessV3(
  CAPTION_CURRENT_INTEGRATION_READINESS_V3)
check(readinessV3.correctsSupersededReadinessOverclaim
  && readinessV3.supersedesReadinessRef.contentHash
    === readinessV2.readinessDigestSha256
  && readinessV3.currentStatus
    === 'caption_source_complete_with_two_owner_mount_gaps',
'V3 preserves V2 while correcting its source-mount overclaim.')
check(readinessV3.counts.captionSharedOwnerBridgeImplementations === 5
  && readinessV3.counts.canonicalSharedOwnerCompositionMounts === 3
  && readinessV3.counts.sharedOwnerCompositionMountGaps === 2
  && readinessV3.counts.terminalProjectionContractsPublished === 2
  && readinessV3.counts.actualAuthenticatedPrivateSharedOwnerIntegrations
    === 0,
'V3 separates complete Caption bridges from actual canonical compositions.')
check(readinessV3.gapStates.slice(0, 3).every((gap) =>
  gap.canonicalSourceMountImplemented)
  && readinessV3.gapStates.slice(3, 5).every((gap) =>
    !gap.canonicalSourceMountImplemented
    && gap.sourceIntegrationState
      === 'caption_bridge_complete_waiting_on_canonical_owner_mount'),
'Only transcript, Visual Intelligence, and Track All are canonically mounted.')
check(readinessV3.currentEvidence.soundSyncSupportBridgeImplemented
  && !readinessV3.currentEvidence.soundSyncCanonicalOwnerMountImplemented
  && readinessV3.currentEvidence.brollSupportBridgeImplemented
  && !readinessV3.currentEvidence.brollCanonicalOwnerMountImplemented,
'SoundSync and B-roll remain exact owner-mount gaps without losing bridge work.')
const v3MountOverclaim = structuredClone(readinessV3) as unknown as
  Record<string, unknown>
const v3Evidence = v3MountOverclaim.currentEvidence as Record<string, unknown>
v3Evidence.soundSyncCanonicalOwnerMountImplemented = true
expectThrow(() => parseCaptionCurrentIntegrationReadinessV3(
  redigest(v3MountOverclaim)))
const v3CountOverclaim = structuredClone(readinessV3) as unknown as
  Record<string, unknown>
const v3Counts = v3CountOverclaim.counts as Record<string, unknown>
v3Counts.canonicalSharedOwnerCompositionMounts = 5
v3Counts.sharedOwnerCompositionMountGaps = 0
expectThrow(() => parseCaptionCurrentIntegrationReadinessV3(
  redigest(v3CountOverclaim)))

console.log(JSON.stringify({
  smoke: 'captions_specialist_current_integration_readiness',
  assertions,
  historicalReadinessVersion: readiness.schemaVersion,
  readinessVersion: readinessV3.schemaVersion,
  readinessDigestSha256: readinessV3.readinessDigestSha256,
  captionOwnedSharedOwnerBoundariesComplete:
    readiness.counts.captionOwnedSharedOwnerBoundariesComplete,
  strictAuthenticatedMultiOwnerSourceFixturePaths:
    readiness.counts.strictAuthenticatedMultiOwnerSourceFixturePaths,
  actualAuthenticatedPrivateSharedOwnerIntegrations:
    readinessV3.counts.actualAuthenticatedPrivateSharedOwnerIntegrations,
  canonicalSharedOwnerSourceMounts:
    readinessV3.counts.canonicalSharedOwnerCompositionMounts,
  sharedOwnerCompositionMountGaps:
    readinessV3.counts.sharedOwnerCompositionMountGaps,
  canonicalBackendExecutionMounts:
    readinessV2.counts.canonicalBackendExecutionMounts,
  remainingTerminalGaps: readinessV3.counts.remainingPrivateEvidenceGaps,
  terminalStatusClaimed: readinessV3.terminalStatusClaimed,
  result: 'passed',
}, null, 2))
