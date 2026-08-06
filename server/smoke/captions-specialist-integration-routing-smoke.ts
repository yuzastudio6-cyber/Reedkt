import assert from 'node:assert/strict'

import {
  CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES,
  CAPTIONS_SUPPORT_JOB_TYPES,
  CAPTIONS_SUPPORTED_JOB_TYPES,
  type CaptionsSupportJobType,
} from '../../src/types/captions-specialist'
import {
  CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF,
} from '../captions-specialist/caption-shared-owner-integration'
import { CAPTIONS_SPECIALIST_MANIFEST } from
  '../captions-specialist/captions-specialist-manifest'
import { CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT } from
  '../captions-specialist/captions-specialist-qualification'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST,
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2,
} from '../captions-specialist/captions-specialist-integration-manifest'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT_V2,
} from '../captions-specialist/captions-specialist-integration-qualification'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import {
  createCaptionsHarnessCall,
  runCaptionsInternalHarnessToCompletion,
} from '../internal-testing/captions-specialist-harness'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  BROLL_CAPTION_PUBLIC_RECEIPT_DIGEST,
  CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT,
} from '../captions-specialist/caption-broll-owner-read-adapter'
import { CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_RECEIPT } from
  '../captions-specialist/caption-canonical-specialist-resume-read'
import { CAPTION_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_RECEIPT } from
  '../captions-specialist/caption-visual-intelligence-spatial-adapter'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}

check(CAPTIONS_SPECIALIST_MANIFEST.manifestHash
  === '35581a7e584dadb397302ebddf83bdc811442d141c060b4ba2ba1263acb2af2d',
'the frozen CAP-01 planning manifest hash remains unchanged')
check(CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.snapshotDigestSha256
  === '4d988d1dd94f13ff3ef95cedbd2b69d4c80f81458f8bb29f391ba18d2bb1b268',
'the frozen CAP-01 planning qualification remains unchanged')
check(CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestId
  === 'captions.specialist.integration.manifest'
  && CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash
    === '66d8c5559f828ee6e61933b8c930c7b50b9dedd92458f7b46ffe939e9b2ad954',
'the post-CAP-20 manifest is an additive wire identity')
check(CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
  .manifestRef.contentHash
  === CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash
  && CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
    .snapshotDigestSha256
    === '88370247b34496bb1b62b340b31b726905bf71db191858dd43c3920a6b906231',
'the integration qualification binds only the additive manifest')
check(CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.jobEntries.length
  === CAPTIONS_SUPPORTED_JOB_TYPES.length
  && CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.jobEntries.every(
    (entry) => entry.status === 'qualified'
      && entry.qualifiedModes.join('|') === 'planning'),
'the additive qualification remains planning-only and per job')
check(!CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
  .wholeSkillQualificationClaimed
  && !CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
    .productionQualificationClaimed,
'integration routing does not claim whole-skill or production qualification')
check(CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2.manifestId
  === 'captions.specialist.integration.manifest.v2'
  && CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2.manifestHash
    !== CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash,
'incoming Caption support uses an additive integration manifest identity')
check(CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT_V2
  .manifestRef.contentHash
  === CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2.manifestHash
  && CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT_V2.jobEntries.length
    === CAPTIONS_SUPPORTED_JOB_TYPES.length,
'the additive V2 qualification binds all jobs to only the V2 manifest')
check(CAPTIONS_SUPPORT_JOB_TYPES.every((jobType) => {
  const entry = CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2.capabilityEntries
    .find((candidate) => candidate.supportedJobType === jobType)
  return entry !== undefined
    && entry.producedArtifactTypes.includes(
      CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES[
        jobType as CaptionsSupportJobType])
    && entry.integrationQa.includes(
      'incoming_support_request_v2_exact_reread_and_result_binding')
}), 'all eight support jobs declare their exact V2 semantic result artifact')

const conditionalByJob = new Map(
  CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF.conditionalJobBindings.map(
    (binding) => [binding.jobType, binding]),
)
check([...conditionalByJob].every(([jobType, binding]) => {
  const entry = CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.capabilityEntries
    .find((item) => item.supportedJobType === jobType)
  return entry !== undefined
    && binding.requiredArtifactTypes.every((artifactType) =>
      entry.requiredEvidence.includes(artifactType)
        && entry.acceptedArtifactTypes.includes(artifactType))
}), 'all twelve conditional jobs expose their exact CAP-20 owner evidence')
check(CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.acceptedArtifactTypes.includes(
  'caption_sound_support_result')
  && CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.acceptedArtifactTypes.includes(
    'caption_broll_owner_read_binding'),
'the additive manifest accepts SoundSync and B-roll owner results')
check(CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.integrationQa.includes(
  'backend_wire_projection_must_be_distinctly_versioned')
  && CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.knownLimitations.some((item) =>
    item.includes('digest-recomputed bridge')),
'materially different backend V1 shapes require an additive projection')
check(CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.integrationQa.includes(
  'broll_owner_read_public_adapter_frozen')
  && CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.qualificationEvidenceRefs.some(
    (item) => item.evidenceId === 'captions.broll.owner-read.public-adapter'),
'the integration profile binds the additive frozen B-roll adapter evidence')
check(CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.integrationQa.includes(
  'canonical_transcript_authenticated_read_adapter_frozen')
  && CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.qualificationEvidenceRefs.some(
    (item) => item.evidenceId
      === 'captions.canonical-transcript.authenticated-read-adapter'),
'the integration profile binds the canonical transcript read adapter evidence')
check(CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.integrationQa.includes(
  'canonical_backend_sequential_resume_consumer_frozen')
  && CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.qualificationEvidenceRefs.some(
    (item) => item.evidenceId
      === 'captions.canonical-specialist.resume-read-adapter')
  && CAPTION_CANONICAL_SPECIALIST_RESUME_READ_ADAPTER_RECEIPT.backendSource
    .sourceCommit === '832f56fc41c90413f6c99cc70d5cd658c8e44675',
'the integration profile binds the exact canonical backend resume consumer')
check(CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.integrationQa.includes(
  'visual_intelligence_spatial_evidence_adapter_frozen')
  && CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.qualificationEvidenceRefs.some(
    (item) => item.evidenceId
      === 'captions.visual-intelligence.spatial-evidence-adapter')
  && CAPTION_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_RECEIPT.backendSource
    .sourceCommit === '5130e3c70f3f633e6877aa3feff4dc296eba525b'
  && !CAPTION_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_RECEIPT
    .renderedCaptionInspectionAdmitted,
'the integration profile binds the exact provider-neutral spatial adapter')

const legacySoundCall = createCaptionsHarnessCall({
  callId: 'captions.integration.legacy-sound',
  jobType: 'prepare_caption_boundary_timing_requirements',
  scopeLevel: 'boundary',
})
check(runCaptionsSpecialistJob({ call: legacySoundCall }).disposition
  === 'completed',
'the frozen CAP-01 compatibility lane remains readable and unchanged')
const legacyMissingTranscriptCall = createCaptionsHarnessCall({
  callId: 'captions.integration.legacy-missing-transcript',
  jobType: 'resolve_multi_track_caption_scene',
  scopeLevel: 'scene',
  inputArtifactTypes: [
    'confirmed_output_frame', 'master_timing_or_planning_timing',
  ],
})
const legacyMissingTranscriptResult = runCaptionsSpecialistJob({
  call: legacyMissingTranscriptCall,
})
check(legacyMissingTranscriptResult.disposition === 'blocked'
  && legacyMissingTranscriptResult.reasonCodes.join('|')
    === 'input.canonical_transcript.authenticated_read.missing'
  && legacyMissingTranscriptResult.supportRequests.length === 0,
'the compatibility lane receives the same fail-closed transcript hardening')

const soundCall = createCaptionsHarnessCall({
  callId: 'captions.integration.sound',
  jobType: 'prepare_caption_boundary_timing_requirements',
  scopeLevel: 'boundary',
  runtimeProfile: 'post_cap20_integration',
})
const soundRun = runCaptionsInternalHarnessToCompletion({ call: soundCall })
check(soundRun.initialResult.disposition === 'needs_followup'
  && soundRun.initialResult.supportRequests.length === 1
  && soundRun.initialResult.supportRequests[0].targetSkillKey === 'soundsync'
  && soundRun.initialResult.supportRequests[0].requestedArtifactTypes
    .join('|') === 'caption_sound_support_result',
'Sound-dependent boundary planning requests the exact SoundSync result')
check(soundRun.initialResult.supportRequests[0].typedPayloadType
  === 'caption-sound-cue-request-ref-v1'
  && soundRun.initialResult.supportRequests[0].typedPayload
  && (soundRun.initialResult.supportRequests[0].typedPayload as
    Record<string, unknown>).typedPayloadEmbedded === false,
'Sound support carries a byte-free typed-payload reference requirement')
check(soundRun.finalResult.disposition === 'blocked'
  && soundRun.finalResult.reasonCodes.join('|')
    === 'input.soundsync.payload.missing'
  && !soundRun.completedWithoutDirectPeerDispatch,
'a reference-only SoundSync injection cannot impersonate typed audio evidence')

const brollCall = createCaptionsHarnessCall({
  callId: 'captions.integration.broll',
  jobType: 'provide_caption_broll_composition_constraints',
  scopeLevel: 'scene',
  runtimeProfile: 'post_cap20_integration',
})
const brollRun = runCaptionsInternalHarnessToCompletion({ call: brollCall })
check(brollRun.initialResult.disposition === 'needs_followup'
  && brollRun.initialResult.supportRequests.length === 1
  && brollRun.initialResult.supportRequests[0].targetSkillKey === 'broll_owner'
  && brollRun.initialResult.supportRequests[0].requestedArtifactTypes
    .join('|') === 'caption_broll_owner_read_binding',
'B-roll co-composition cannot complete without its authenticated owner read')
check(brollRun.initialResult.supportRequests[0].typedPayloadType
  === 'caption-broll-owner-read-request-ref-v1',
'B-roll support labels the receipt-only marker as a reference, not a request')
const brollTypedPayload = brollRun.initialResult.supportRequests[0]
  .typedPayload as Record<string, unknown>
const brollReceiptRef = brollTypedPayload.publicContractReceiptRef as
  Record<string, unknown>
const brollAdapterRef = brollTypedPayload.captionAdapterRef as
  Record<string, unknown>
check(brollReceiptRef.contentHash === BROLL_CAPTION_PUBLIC_RECEIPT_DIGEST
  && brollAdapterRef.contentHash
    === CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT.adapterDigestSha256
  && brollTypedPayload.requestPayloadEmbedded === false
  && brollTypedPayload.exactScopeFrameTimingRereadRequired === true,
'the support request freezes the B-roll receipt and Caption adapter without inventing authority fields')
check(brollRun.finalResult.disposition === 'blocked'
  && brollRun.finalResult.reasonCodes.join('|')
    === 'input.broll_owner.request.missing'
  && !brollRun.completedWithoutDirectPeerDispatch,
'a reference-only B-roll injection cannot impersonate the frozen owner result')

const safeRegionCall = createCaptionsHarnessCall({
  callId: 'captions.integration.safe-region',
  jobType: 'provide_caption_safe_region_constraints',
  scopeLevel: 'scene',
  runtimeProfile: 'post_cap20_integration',
})
const safeRegionRun = runCaptionsInternalHarnessToCompletion({
  call: safeRegionCall,
})
check(safeRegionRun.initialResult.supportRequests.map((request) =>
  request.targetSkillKey).join('|') === 'track_all|visual_intelligence',
'safe-region planning requests both exact Track All and Visual Intelligence evidence')
check(safeRegionRun.resumeSteps.length === 1
  && safeRegionRun.finalResult.disposition === 'blocked'
  && safeRegionRun.finalResult.reasonCodes.join('|')
    === 'input.track_all.payload.missing',
'safe-region integration stops at the first owner lacking exact typed evidence')

const missingTranscriptCall = createCaptionsHarnessCall({
  callId: 'captions.integration.missing-transcript',
  jobType: 'resolve_multi_track_caption_scene',
  scopeLevel: 'scene',
  runtimeProfile: 'post_cap20_integration',
  inputArtifactTypes: [
    'confirmed_output_frame', 'master_timing_or_planning_timing',
  ],
})
const missingTranscriptResult = runCaptionsSpecialistJob({
  call: missingTranscriptCall,
})
check(missingTranscriptResult.disposition === 'blocked'
  && missingTranscriptResult.reasonCodes.join('|')
    === 'input.canonical_transcript.authenticated_read.missing'
  && missingTranscriptResult.supportRequests.length === 0,
'missing canonical transcript fails closed as an authenticated initial-input gap')

const missingTranscriptBindingCall = createCaptionsHarnessCall({
  callId: 'captions.integration.missing-transcript-binding',
  jobType: 'resolve_multi_track_caption_scene',
  scopeLevel: 'scene',
  runtimeProfile: 'post_cap20_integration',
  inputArtifactTypes: [
    'canonical_transcript',
    'confirmed_output_frame',
    'master_timing_or_planning_timing',
  ],
})
const missingTranscriptBindingResult = runCaptionsSpecialistJob({
  call: missingTranscriptBindingCall,
})
check(missingTranscriptBindingResult.disposition === 'blocked'
  && missingTranscriptBindingResult.reasonCodes.join('|')
    === 'input.canonical_transcript.authenticated_read.binding.missing'
  && missingTranscriptBindingResult.supportRequests.length === 0,
'a transcript ref without its exact authenticated reread binding fails closed')
const completeTranscriptInputCall = createCaptionsHarnessCall({
  callId: 'captions.integration.complete-transcript-input',
  jobType: 'resolve_multi_track_caption_scene',
  scopeLevel: 'scene',
  runtimeProfile: 'post_cap20_integration',
  inputArtifactTypes: [
    'canonical_transcript',
    'canonical_transcript_authenticated_read_binding',
    'confirmed_output_frame',
    'master_timing_or_planning_timing',
    'visual_intelligence_report',
  ],
})
const referenceOnlyTranscriptResult = runCaptionsSpecialistJob({
  call: completeTranscriptInputCall,
})
check(referenceOnlyTranscriptResult.disposition === 'blocked'
  && referenceOnlyTranscriptResult.reasonCodes.join('|')
    === 'input.canonical_transcript.authenticated_payload.missing',
'transcript and authenticated-read refs still require exact persisted payload admission')

const staleCrossProfileCall = structuredClone(soundCall)
staleCrossProfileCall.qualificationSnapshotRef = {
  id: CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.snapshotId,
  version: CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.schemaVersion,
  contentHash:
    CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.snapshotDigestSha256,
}
staleCrossProfileCall.callDigestSha256 = calculateSkillContractDigest(
  staleCrossProfileCall as unknown as Record<string, unknown>,
  'callDigestSha256')
check(runCaptionsSpecialistJob({ call: staleCrossProfileCall }).disposition
  === 'blocked',
'CAP-01 qualification cannot be paired with the integration manifest')
check(soundRun.resumeSteps.every((step) =>
  !step.selectedSupportRequest.mediationPolicy.directPeerDispatchAllowed
    && !step.resumedResult.authorityBoundary.runtimeExecutionGranted
    && !step.resumedResult.authorityBoundary.assetCreationGranted
    && !step.resumedResult.authorityBoundary.qaApprovalGranted
    && !step.resumedResult.authorityBoundary.productionAuthorityGranted),
'integration routing grants no peer, runtime, asset, QA, or production authority')

console.log(JSON.stringify({
  smoke: 'captions_specialist_post_cap20_integration_routing',
  assertions,
  integrationManifestHash:
    CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash,
  integrationQualificationDigest:
    CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
      .snapshotDigestSha256,
  conditionalJobs: conditionalByJob.size,
  soundResumeSteps: soundRun.resumeSteps.length,
  brollResumeSteps: brollRun.resumeSteps.length,
  safeRegionResumeSteps: safeRegionRun.resumeSteps.length,
  terminalQualificationClaimed: false,
  result: 'passed',
}, null, 2))
