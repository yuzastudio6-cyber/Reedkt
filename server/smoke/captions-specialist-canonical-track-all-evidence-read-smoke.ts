import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
} from '../../src/types/canonical-caption-track-all-support'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CaptionTrackAllSubjectEvidence,
} from '../../src/types/caption-track-all-support'
import type {
  CanonicalAuthenticatedSpecialistSupportArtifactProjection,
  CanonicalSpecialistSupportResumeRecord,
} from '../../src/types/canonical-specialist-support-resume'
import {
  CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT,
  parseCaptionCanonicalTrackAllEvidenceReadReceipt,
  parseCaptionCanonicalTrackAllEvidenceRecord,
} from '../captions-specialist/caption-canonical-track-all-evidence-read'
import {
  CAPTION_CANONICAL_TRACK_ALL_RESUME_ADMISSION_RECEIPT,
  parseCaptionCanonicalTrackAllResumeAdmissionReceipt,
  runCaptionCanonicalTrackAllResumeAdmission,
} from '../captions-specialist/caption-canonical-track-all-resume'
import { parseCaptionCanonicalSpecialistSupportResumeRecord } from
  '../captions-specialist/caption-canonical-specialist-resume-read'
import {
  createCaptionTrackAllAdmission,
  createCaptionTrackAllEvidencePacketForContractFixture,
  createCaptionTrackAllSupport,
  parseCaptionTrackAllEvidencePacket,
} from '../captions-specialist/caption-track-all-support'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import {
  createCaptionsHarnessCall,
  resumeCaptionsHarnessCall,
} from '../internal-testing/captions-specialist-harness'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function hash(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
function ref(id: string, version = 'fixture-v1'): CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}:${version}`) }
}
function redigest<T extends Record<string, unknown>>(
  value: T,
  field: string,
): T {
  return {
    ...structuredClone(value),
    [field]: calculateSkillContractDigest(value, field),
  }
}

const range = { startFrame: 300, endFrameExclusive: 450 }
const scope: CaptionDomainCanonicalScope = {
  ownerUserId: 'user.track.canonical',
  workspaceId: 'workspace.track.canonical',
  projectId: 'project.track.canonical',
  editSessionId: 'edit.track.canonical',
  planVersionId: 'plan.track.canonical.v1',
  approvedSnapshotRef: ref(
    'snapshot.track.canonical', 'approved-plan-snapshot-v1'),
  outputId: 'output.track.canonical',
  sceneId: 'scene.track.canonical',
  authorizedFrameRanges: [range],
}
const runtimeCallSeed = createCaptionsHarnessCall({
  callId: 'captions.track.canonical.call',
  jobType: 'resolve_subject_occluded_typography',
  scopeLevel: 'scene',
  runtimeProfile: 'post_cap20_integration',
  inputArtifactTypes: [
    'canonical_transcript', 'confirmed_output_frame',
    'master_timing_or_planning_timing', 'visual_intelligence_report',
  ],
})
const callWithoutDigest = {
  ...structuredClone(runtimeCallSeed),
  canonicalScope: {
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
    approvedSnapshotRef: structuredClone(scope.approvedSnapshotRef),
    outputId: scope.outputId,
    sceneId: scope.sceneId,
    boundaryId: null,
    authorizedFrameRanges: structuredClone(scope.authorizedFrameRanges),
  },
}
const runtimeCall = parseOrchestraSkillCall(redigest(
  { ...callWithoutDigest, callDigestSha256: '' }, 'callDigestSha256'))
const sourceFrameMappingRef = ref('source.mapping.track.canonical')
const outputFrameDigest = hash('output.frame.track.canonical')
const support = createCaptionTrackAllSupport({
  payloadId: 'caption.track.canonical.payload',
  requestId: `${runtimeCall.callId}.support.track_all`,
  idempotencyKey: runtimeCall.idempotencyKey,
  originalCallRef: {
    id: runtimeCall.callId,
    version: runtimeCall.schemaVersion,
    contentHash: runtimeCall.callDigestSha256,
  },
  purpose: 'subject_occlusion',
  canonicalScope: scope,
  pictureLockRef: ref('picture.lock.track.canonical'),
  finishReadinessRef: ref('finish.readiness.track.canonical'),
  visualOccupancyManifestRef: ref('occupancy.track.canonical'),
  confirmedOutputFrameDigestSha256: outputFrameDigest,
  sourcePrivateArtifactRef: ref('source.private.track.canonical'),
  sourceFrameMappingRef,
  subjectRequests: [{
    subjectRequestId: 'subject.request.track.canonical',
    subjectRole: 'primary_speaker',
    visualObservationRefs: [ref('visual.observation.track.canonical')],
    sourcePhraseRefs: [ref('phrase.track.canonical')],
    maskRequired: true,
    trackRequired: true,
    anchorRequired: false,
    preserveHairAndFineEdges: true,
    preserveContactObjects: false,
  }],
  korniaRefinementAllowed: false,
})
const subjectEvidence: CaptionTrackAllSubjectEvidence = {
  subjectRequestId: support.payload.subjectRequests[0].subjectRequestId,
  subjectEvidenceId: 'subject.evidence.track.canonical',
  subjectRole: 'primary_speaker',
  frameRange: range,
  maskSequenceRef: ref('mask.sequence.track.canonical'),
  trackManifestRef: ref('track.manifest.track.canonical'),
  anchorManifestRef: null,
  sourceFrameMappingRef,
  outputFrameDigestSha256: outputFrameDigest,
  temporalQa: {
    measuredFrameCount: 150,
    expectedFrameCount: 150,
    emptyMaskFrameCount: 0,
    fullFrameMaskCount: 0,
    minimumBinaryIntersectionOverUnionBasisPoints: 8_500,
    maximumNormalizedCentroidShiftBasisPoints: 400,
    maximumBoundaryDisagreementBasisPoints: 700,
    maximumAlphaFlickerBasisPoints: 500,
    minimumEdgeQualityBasisPoints: 9_000,
    minimumSubjectCoverageBasisPoints: 9_800,
    identitySwapCount: 0,
    lostAnchorFrameCount: 0,
    completeRequestedRangeCoverage: true,
  },
  refinementEvidence: [{
    refinementId: 'opencv.track.canonical',
    tool: 'opencv',
    operation: 'temporal_median_check',
    inputArtifactRef: ref('mask.raw.track.canonical'),
    outputArtifactRef: ref('mask.sequence.track.canonical'),
    executionEvidenceRef: ref('opencv.evidence.track.canonical'),
    actualExecutionObserved: true,
  }],
  evidenceRefs: [
    ref('mask.measurement.track.canonical'),
    ref('private.review.track.canonical'),
  ],
}
const contractPacket = createCaptionTrackAllEvidencePacketForContractFixture({
  packetId: 'caption.track.canonical.packet',
  payload: support.payload,
  supportRequest: support.supportRequest,
  trackAllResultRef: ref('track.result.track.canonical'),
  subjectEvidence: [{
    ...subjectEvidence,
    refinementEvidence: subjectEvidence.refinementEvidence.map((item) => ({
      ...item,
      actualExecutionObserved: false,
    })),
  }],
})
const sceneEvidenceRef = ref(
  'track.scene.evidence.canonical',
  'canonical-track-all-sam3_1-caption-scene-evidence-v1')
const samAdmissionRef = ref(
  'sam31.runtime.admission.canonical',
  'canonical-sam3_1-runtime-result-admission-v1')
const authenticatedPacket = parseCaptionTrackAllEvidencePacket(redigest({
  ...structuredClone(contractPacket),
  authenticatedReadResultRef: sceneEvidenceRef,
  canonicalSam31RuntimeResultAdmissionRef: samAdmissionRef,
  subjectEvidence: [subjectEvidence],
  evidenceMode: 'authenticated_private_runtime',
  exactCanonicalScopeReread: true,
  exactPrivateArtifactsReread: true,
  exactSam31ResultLineageVerified: true,
  actualSam31GpuExecutionObserved: true,
  actualOpenCvExecutionObserved: true,
  actualKorniaExecutionObserved: false,
  independentMaskArtifactQaCompleted: true,
  privateVisualReviewCompleted: true,
  packetDigestSha256: '',
} as unknown as Record<string, unknown>, 'packetDigestSha256'), {
  payload: support.payload,
  supportRequest: support.supportRequest,
})
const admission = createCaptionTrackAllAdmission({
  admissionId: 'caption.track.canonical.admission',
  packet: authenticatedPacket,
  payload: support.payload,
  supportRequest: support.supportRequest,
})
const supportRequestRef = {
  id: support.supportRequest.requestId,
  version: support.supportRequest.schemaVersion,
  contentHash: support.supportRequest.requestDigestSha256,
}
const packetArtifact = {
  id: authenticatedPacket.packetId,
  version: authenticatedPacket.schemaVersion,
  contentHash: authenticatedPacket.packetDigestSha256,
  artifactType: 'track_all_mask_binding',
  producerSkillKey: 'track_all',
  privateArtifact: true as const,
  byteFreeRef: true as const,
  sourceSupportRequestRef: supportRequestRef,
}
const projectionWithoutDigest: Omit<
  CanonicalAuthenticatedSpecialistSupportArtifactProjection,
  'projectionDigestSha256'
> = {
  schemaVersion: 'canonical-authenticated-specialist-support-artifact-projection-v1',
  projectionId: 'caption.track.canonical.projection',
  originalCallRef: structuredClone(support.supportRequest.originalCallRef),
  supportRequestRef,
  ownerResultRef: sceneEvidenceRef,
  ownerKey: 'track_all',
  canonicalScope: structuredClone(support.supportRequest.canonicalScope),
  artifactRefs: [packetArtifact],
  authenticatedPrincipalVerified: true,
  exactApprovedSnapshotReread: true,
  exactCanonicalScopeReread: true,
  exactOwnerResultReread: true,
  ownerResultPersistedBeforeProjection: true,
  browserLocalStateUsed: false,
  rawChatMediaBytesPathsUrlsOrCredentialsAccepted: false,
  directPeerDispatchPerformed: false,
  timelineMutationPerformed: false,
  runtimeExecutionAuthorityGrantedToSpecialist: false,
  assetMutationAuthorityGrantedToSpecialist: false,
  costOrBillingAuthorityGrantedToSpecialist: false,
  finalQaApprovalGrantedToSpecialist: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}
const projection = redigest({
  ...projectionWithoutDigest,
  projectionDigestSha256: '',
}, 'projectionDigestSha256')
const sceneQaAuthorityRef = ref(
  'track-all.scene-qa-authority.canonical',
  'canonical-track-all-sam3_1-caption-scene-qa-authority-v1')
const recordWithoutDigest: Omit<
  CanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
  'recordDigestSha256'
> = {
  schemaVersion: 'canonical-caption-track-all-authenticated-evidence-record-v2',
  recordId: 'caption.track.canonical.record',
  originalCallRef: structuredClone(support.supportRequest.originalCallRef),
  supportRequestRef,
  supportRequest: structuredClone(support.supportRequest),
  supportPayload: structuredClone(support.payload),
  backendTrackAllCallRef: ref('backend.track.call.canonical'),
  backendTrackAllSupportRequestRef: ref('backend.track.support.canonical'),
  sam31TaskRef: ref('sam31.task.track.canonical'),
  sam31RuntimeResultAdmissionRef: samAdmissionRef,
  trackAllSceneQaAuthorityRef: sceneQaAuthorityRef,
  trackAllSceneEvidenceRef: sceneEvidenceRef,
  captionEvidencePacket: authenticatedPacket,
  captionAdmission: admission,
  authenticatedOwnerProjection: projection,
  authenticatedPrincipalVerified: true,
  priorCallAndSupportRequestExactReread: true,
  backendTrackAllCallAndSupportRequestExactReread: true,
  distinctCaptionAndBackendSupportWireIdentitiesPreserved: true,
  sam31TaskAndResultExactReread: true,
  taskLevelSceneQaAuthorityExactReread: true,
  independentSceneEvidenceExactReread: true,
  exactCaptionScopeOutputSceneRangeSourceAndFrameBindingVerified: true,
  ownerProjectionCreateOnlyPersisted: true,
  evidenceRecordCreateOnlyPersisted: true,
  browserLocalStateUsed: false,
  rawMaskMediaBytesPathsUrlsOrCredentialsAccepted: false,
  directPeerDispatchPerformed: false,
  runtimeExecutionPerformedByBridge: false,
  timelineMutationPerformed: false,
  runtimeExecutionAuthorityGrantedToCaption: false,
  assetMutationAuthorityGrantedToCaption: false,
  costOrBillingAuthorityGrantedToCaption: false,
  finalQaApprovalGrantedToCaption: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}
const record = parseCaptionCanonicalTrackAllEvidenceRecord(redigest({
  ...recordWithoutDigest,
  recordDigestSha256: '',
}, 'recordDigestSha256'))

check(record.captionAdmission.disposition
  === 'admitted_for_caption_scene_graph'
  && record.captionEvidencePacket.actualSam31GpuExecutionObserved
  && record.captionEvidencePacket.actualOpenCvExecutionObserved,
'The source fixture validates the exact authenticated Track All projection.')
check(record.authenticatedOwnerProjection.ownerKey === 'track_all'
  && record.authenticatedOwnerProjection.artifactRefs.length === 1,
'The canonical record projects one neutral Track All artifact only.')
check(hash(readFileSync(
  'src/types/canonical-caption-track-all-support.ts'))
  === '43c80e3ca576d4cd93eb6c2e0a96dc556d84f8f14c25c284f8c13b88254571db',
'The backend public type is copied byte-for-byte from the frozen commit.')
check(parseCaptionCanonicalTrackAllEvidenceReadReceipt(
  CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT).backendSource.sourceCommit
  === 'b4241b6023de986de634fd1a20b705dbedf811cb',
'The Caption adapter receipt pins the exact backend source commit.')

const initial = runCaptionsSpecialistJob({
  call: runtimeCall,
  trackAllSupportPayload: support.payload,
})
check(initial.disposition === 'needs_followup'
  && initial.supportRequests[0]?.requestDigestSha256
    === support.supportRequest.requestDigestSha256,
'The runtime emits the exact request embedded in the canonical record.')
let resumedCall = resumeCaptionsHarnessCall(runtimeCall, support.supportRequest)
resumedCall.injectedSupportArtifactRefs = [packetArtifact]
resumedCall = parseOrchestraSkillCall(redigest({
  ...resumedCall,
  callDigestSha256: '',
}, 'callDigestSha256'))
const completed = runCaptionsSpecialistJob({
  call: resumedCall,
  resumeSupportRequest: support.supportRequest,
  canonicalTrackAllEvidenceRecord: record,
})
check(completed.disposition === 'completed'
  && completed.reasonCodes.includes(
    'track_all.authenticated_admission.accepted'),
'The canonical record satisfies the strict Track All runtime admission.')

const resumeRecordWithoutDigest: Omit<
  CanonicalSpecialistSupportResumeRecord,
  'recordDigestSha256'
> = {
  schemaVersion: 'canonical-specialist-support-resume-record-v1',
  recordId: 'caption.track.canonical.resume-record',
  stepOrdinal: 1,
  priorCall: structuredClone(runtimeCall),
  priorResult: structuredClone(initial),
  selectedSupportRequest: structuredClone(support.supportRequest),
  authenticatedOwnerProjection: structuredClone(projection),
  resumedCall: structuredClone(resumedCall),
  resumedResult: structuredClone(completed),
  promotedPriorSupportArtifactRefs: [],
  persistedAt: '2026-08-05T20:00:00.000Z',
  priorCallAndResultExactReread: true,
  selectedRequestExactResultMember: true,
  authenticatedOwnerProjectionExactReread: true,
  onlyCurrentOwnerResultInjected: true,
  priorOwnerResultsPromotedAsCanonicalInputs: true,
  exactImmediateCallAndRequestLineage: true,
  directPeerDispatchPerformed: false,
  timelineMutationPerformed: false,
  providerCallPerformedByResumeOwner: false,
  runtimeExecutionPerformedByResumeOwner: false,
  assetMutationPerformedByResumeOwner: false,
  costOrBillingMutationPerformedByResumeOwner: false,
  finalQaApprovalGrantedByResumeOwner: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}
const resumeRecord = parseCaptionCanonicalSpecialistSupportResumeRecord(
  redigest({
    ...resumeRecordWithoutDigest,
    recordDigestSha256: '',
  }, 'recordDigestSha256'))
const replayed = runCaptionCanonicalTrackAllResumeAdmission({
  canonicalResumeRecord: resumeRecord,
  canonicalTrackAllEvidenceRecord: record,
})
check(replayed.resultDigestSha256 === completed.resultDigestSha256,
'Canonical Track All evidence replays to the exact persisted Caption result.')
check(parseCaptionCanonicalTrackAllResumeAdmissionReceipt(
  CAPTION_CANONICAL_TRACK_ALL_RESUME_ADMISSION_RECEIPT)
  .runtimeResultMustMatchPersistedResultDigest,
'The resume receipt freezes exact persisted-result replay.')

const changedPersistedResult = structuredClone(resumeRecord)
changedPersistedResult.resumedResult.safeUserSummary =
  'A different persisted Caption result.'
changedPersistedResult.resumedResult.resultDigestSha256 =
  calculateSkillContractDigest(
    changedPersistedResult.resumedResult as unknown as Record<string, unknown>,
    'resultDigestSha256')
changedPersistedResult.recordDigestSha256 = calculateSkillContractDigest(
  changedPersistedResult as unknown as Record<string, unknown>,
  'recordDigestSha256')
expectThrow(() => runCaptionCanonicalTrackAllResumeAdmission({
  canonicalResumeRecord: changedPersistedResult,
  canonicalTrackAllEvidenceRecord: record,
}))

const crossedScene = structuredClone(record)
crossedScene.trackAllSceneEvidenceRef = ref('track.scene.evidence.crossed')
crossedScene.recordDigestSha256 = calculateSkillContractDigest(
  crossedScene as unknown as Record<string, unknown>, 'recordDigestSha256')
expectThrow(() => parseCaptionCanonicalTrackAllEvidenceRecord(crossedScene))

const aliasedSceneQaAuthority = structuredClone(record)
aliasedSceneQaAuthority.trackAllSceneQaAuthorityRef =
  structuredClone(aliasedSceneQaAuthority.trackAllSceneEvidenceRef)
aliasedSceneQaAuthority.recordDigestSha256 = calculateSkillContractDigest(
  aliasedSceneQaAuthority as unknown as Record<string, unknown>,
  'recordDigestSha256')
expectThrow(() => parseCaptionCanonicalTrackAllEvidenceRecord(
  aliasedSceneQaAuthority))

const missingTaskQaReread = structuredClone(record) as unknown as
  Record<string, unknown>
delete missingTaskQaReread.taskLevelSceneQaAuthorityExactReread
missingTaskQaReread.recordDigestSha256 = calculateSkillContractDigest(
  missingTaskQaReread, 'recordDigestSha256')
expectThrow(() => parseCaptionCanonicalTrackAllEvidenceRecord(
  missingTaskQaReread))

const crossedProjection = structuredClone(record)
crossedProjection.authenticatedOwnerProjection.ownerResultRef =
  ref('track.scene.evidence.crossed')
crossedProjection.authenticatedOwnerProjection.projectionDigestSha256 =
  calculateSkillContractDigest(
    crossedProjection.authenticatedOwnerProjection as unknown as
      Record<string, unknown>,
    'projectionDigestSha256')
crossedProjection.recordDigestSha256 = calculateSkillContractDigest(
  crossedProjection as unknown as Record<string, unknown>,
  'recordDigestSha256')
expectThrow(() => parseCaptionCanonicalTrackAllEvidenceRecord(
  crossedProjection))

const ambiguous = runCaptionsSpecialistJob({
  call: resumedCall,
  resumeSupportRequest: support.supportRequest,
  canonicalTrackAllEvidenceRecord: record,
  trackAllSupportPayload: support.payload,
})
check(ambiguous.disposition === 'blocked'
  && ambiguous.reasonCodes.join('|') === 'input.track_all.evidence.ambiguous',
'Canonical and unbound Track All evidence cannot be mixed.')

const unexpected = runCaptionsSpecialistJob({
  call: runtimeCall,
  canonicalTrackAllEvidenceRecord: record,
})
check(unexpected.disposition === 'blocked'
  && unexpected.reasonCodes.join('|')
    === 'input.track_all.canonical_record.unexpected',
'Canonical Track All evidence cannot be supplied outside an exact resume.')

console.log(JSON.stringify({
  smoke: 'captions_specialist_canonical_track_all_evidence_read',
  assertions,
  publicTypeSha256:
    CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT
      .backendSource.publicTypeFileSha256,
  adapterVersion:
    CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT.schemaVersion,
  adapterDigestSha256:
    CAPTION_CANONICAL_TRACK_ALL_EVIDENCE_READ_RECEIPT.adapterDigestSha256,
  canonicalRecordVersion: record.schemaVersion,
  resumeAdmissionVersion:
    CAPTION_CANONICAL_TRACK_ALL_RESUME_ADMISSION_RECEIPT.schemaVersion,
  resumeAdmissionDigestSha256:
    CAPTION_CANONICAL_TRACK_ALL_RESUME_ADMISSION_RECEIPT.receiptDigestSha256,
  canonicalResumeReplayMatched: true,
  sourceFixtureAdmitted: true,
  actualCanonicalEvidenceRecordConsumed: false,
  actualSam31RuntimeStartedByCaption: false,
  backendImplementationImported: false,
  productionAuthorityGranted: false,
  result: 'passed',
}, null, 2))
