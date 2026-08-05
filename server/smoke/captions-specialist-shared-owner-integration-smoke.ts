import assert from 'node:assert/strict'

import {
  CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF,
  parseCaptionSharedOwnerIntegrationHandoff,
} from '../captions-specialist/caption-shared-owner-integration'
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
  record.handoffDigestSha256 = calculateSkillContractDigest(
    record, 'handoffDigestSha256')
  return record
}

const handoff = parseCaptionSharedOwnerIntegrationHandoff(
  CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF)
const ownerByKey = new Map(handoff.ownerBindings.map((item) => [
  item.ownerKey, item,
]))
const jobByType = new Map(handoff.conditionalJobBindings.map((item) => [
  item.jobType, item,
]))

check(handoff.schemaVersion === 'caption-shared-owner-integration-handoff-v1',
  'The integration handoff must expose one exact versioned public identity.')
check(handoff.sourceCommitRef.id.endsWith(
  'a07219c141bb5f2b7628949ffcbcc7bfbfd06108'),
'The handoff must bind the published CAP-20 source commit.')
check(handoff.sourceCap20ReleaseRef.contentHash
  === 'ea24f3593733c3f8c62a5758fdad099aa256c90dd7118903586628f453e8d8af',
'The handoff must bind the frozen CAP-20 release receipt.')
check(handoff.sourceCap20FinalJobReportRef.contentHash
  === 'b1444a56f07c324109b6e947ecce82c170d896909d6e11e127ea3ada7364c8b1',
'The handoff must bind the frozen CAP-20 job report.')
check(handoff.counts.sharedOwners === 5
  && handoff.counts.conditionalJobs === 12
  && handoff.ownerBindings.length === 5
  && handoff.conditionalJobBindings.length === 12,
'The exact five-owner and 12-job boundary must be exhaustive.')
check(handoff.ownerBindings.map((item) => item.ownerKey).join('|')
  === 'visual_intelligence|canonical_transcript|track_all|soundsync|broll_owner',
'Shared owners must retain the frozen deterministic order.')
check(handoff.counts.ownerBoundariesWithCompleteCaptionContracts === 5
  && handoff.counts.ownerAdaptersStillRequired === 2
  && handoff.counts.authenticatedPrivateIntegrationsComplete === 0,
'Caption contract completion must remain distinct from backend owner adapters.')

check(ownerByKey.get('visual_intelligence')?.publicContracts.map((item) =>
  item.schemaVersion).join('|')
  === 'caption-visual-intelligence-support-payload-v1|skill-support-request-v1|caption-visual-intelligence-evidence-packet-v1|caption-visual-occupancy-manifest-v1|caption-final-visual-hierarchy-v1',
'Visual Intelligence must expose the exact request, result, and Caption projection chain.')
check(ownerByKey.get('track_all')?.publicContracts.map((item) =>
  item.schemaVersion).join('|')
  === 'caption-track-all-support-payload-v1|skill-support-request-v1|caption-track-all-evidence-packet-v1|caption-track-all-admission-v1',
'Track All must expose the exact request, evidence, and admission chain.')
check(ownerByKey.get('soundsync')?.publicContracts.map((item) =>
  item.schemaVersion).join('|')
  === 'caption-sound-cue-request-v1|skill-support-request-v1|caption-sound-support-result-v1|caption-sound-admission-v1',
'SoundSync must expose the exact semantic cue, result, and admission chain.')
check(ownerByKey.get('canonical_transcript')?.publicContracts.some((item) =>
  item.schemaVersion === 'caption-canonical-transcript-v1'
    && item.artifactType === 'canonical_transcript'
    && item.contractRole === 'initial_input'),
'Canonical transcript must be an authenticated initial input, not a peer dispatch.')
check(ownerByKey.get('canonical_transcript')?.currentGapCodes.includes(
  'canonical_transcript_authenticated_read_binding_not_frozen')
  && !ownerByKey.get('canonical_transcript')?.authenticatedOwnerAdapterComplete,
'The missing canonical transcript authenticated read adapter must stay explicit.')
check(ownerByKey.get('broll_owner')?.publicContracts.some((item) =>
  item.schemaVersion === 'caption-broll-owner-read-binding-v1'
    && item.artifactType === 'caption_broll_owner_read_binding'),
'B-roll must use the existing authenticated owner-read binding target.')
check(ownerByKey.get('broll_owner')?.currentGapCodes.includes(
  'broll_owner_public_request_result_adapter_not_frozen')
  && !ownerByKey.get('broll_owner')?.authenticatedOwnerAdapterComplete,
'The missing B-roll owner request/result adapter must stay explicit.')

check(jobByType.get('resolve_spatial_typography')?.requiredOwnerKeys.join('|')
  === 'canonical_transcript|visual_intelligence',
'Spatial typography must wait for both transcript and visual evidence.')
check(jobByType.get('provide_caption_safe_region_constraints')
  ?.requiredOwnerKeys.join('|') === 'track_all|visual_intelligence',
'Safe-region constraints must wait for tracking and visual evidence.')
check(jobByType.get('resolve_subject_occluded_typography')
  ?.requiredArtifactTypes.join('|') === 'track_all_mask_binding',
'Subject occlusion must consume Track All rather than direct SAM output.')
check(jobByType.get('provide_typographic_transition_support')
  ?.requiredArtifactTypes.join('|') === 'caption_sound_support_result'
  && jobByType.get('prepare_caption_boundary_timing_requirements')
    ?.requiredArtifactTypes.join('|') === 'caption_sound_support_result'
  && jobByType.get('provide_typographic_transition_component')
    ?.requiredArtifactTypes.join('|') === 'caption_sound_support_result',
'All three Sound-dependent jobs must consume the same SoundSync owner result.')
check(jobByType.get('provide_caption_broll_composition_constraints')
  ?.requiredOwnerKeys.join('|') === 'broll_owner',
'Caption B-roll co-composition must consume the one B-roll owner.')
check(handoff.conditionalJobBindings.every((job) =>
  job.fallbackCode === 'caption_fail_closed_without_required_integration'
    && !job.currentlyAdmitted && job.exactOriginalCallResumeRequired),
'Every conditional job must remain excluded and replay-bound until integration.')
check(handoff.conditionalJobBindings.every((job) =>
  job.requiredArtifactTypes.every((artifactType) =>
    job.requiredOwnerKeys.some((ownerKey) =>
      ownerByKey.get(ownerKey)?.requiredArtifactTypes.includes(artifactType)))),
'Every required job artifact must be owned by one declared shared owner.')
check(handoff.ownerBindings.every((owner) =>
  !owner.captionMayConstructOwnerResult
    && !owner.captionMayDispatchOwnerDirectly
    && !owner.duplicateSharedOwnerCreated
    && !owner.operationOrRuntimeAuthorityGrantedToCaption
    && !owner.assetMutationAuthorityGrantedToCaption
    && !owner.finalQaApprovalGrantedToCaption),
'No owner binding may grant Caption peer execution, artifact, or QA authority.')
check(!handoff.sharedOwnerRuntimeIntegrationComplete
  && !handoff.currentAdmittedSurfaceChanged
  && !handoff.privateInternalSpecialistQualified
  && !handoff.finalGoalCompletionClaimed,
'The handoff must not relabel mapping as completed private integration.')
check(!handoff.centralOrchestraImplemented && !handoff.directPeerDispatchAdded
  && !handoff.providerOrModelAuthorityGranted
  && !handoff.publicDeliveryAuthorityGranted
  && !handoff.productionAuthorityGranted,
'The integration handoff must not implement Orchestra or external authority.')

const staleDigest = structuredClone(handoff)
staleDigest.ownerBindings[0].currentGapCodes[0] = 'changed.gap'
expectThrow(() => parseCaptionSharedOwnerIntegrationHandoff(staleDigest))
const duplicateJob = structuredClone(handoff)
duplicateJob.conditionalJobBindings[1] = structuredClone(
  duplicateJob.conditionalJobBindings[0])
expectThrow(() => parseCaptionSharedOwnerIntegrationHandoff(
  redigest(duplicateJob)))
const wrongCount = structuredClone(handoff)
wrongCount.counts.ownerAdaptersStillRequired = 1
expectThrow(() => parseCaptionSharedOwnerIntegrationHandoff(
  redigest(wrongCount)))
const overclaim = structuredClone(handoff) as unknown as Record<string, unknown>
overclaim.privateInternalSpecialistQualified = true
expectThrow(() => parseCaptionSharedOwnerIntegrationHandoff(
  redigest(overclaim)))
const inherited = Object.create({ productionAuthorityGranted: true })
Object.assign(inherited, structuredClone(handoff))
expectThrow(() => parseCaptionSharedOwnerIntegrationHandoff(inherited))

console.log(JSON.stringify({
  smoke: 'captions_specialist_shared_owner_integration_handoff',
  assertions,
  sharedOwners: handoff.counts.sharedOwners,
  conditionalJobs: handoff.counts.conditionalJobs,
  captionContractBoundariesComplete:
    handoff.counts.ownerBoundariesWithCompleteCaptionContracts,
  backendOwnerAdaptersStillRequired: handoff.counts.ownerAdaptersStillRequired,
  authenticatedPrivateIntegrationsComplete:
    handoff.counts.authenticatedPrivateIntegrationsComplete,
  handoffDigestSha256: handoff.handoffDigestSha256,
  currentAdmittedSurfaceChanged: handoff.currentAdmittedSurfaceChanged,
  terminalQualificationClaimed: handoff.finalGoalCompletionClaimed,
  result: 'passed',
}, null, 2))
