import { createHash } from 'node:crypto'

import type {
  CanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
} from '../../src/types/canonical-caption-track-all-support'
import type {
  CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord,
} from '../../src/types/canonical-caption-visual-intelligence-support'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CaptionTrackAllSubjectEvidence,
} from '../../src/types/caption-track-all-support'
import type {
  CaptionVisualEvidenceObservation,
} from '../../src/types/caption-visual-intelligence-support'
import type {
  CanonicalAuthenticatedSpecialistSupportArtifactProjection,
} from '../../src/types/canonical-specialist-support-resume'
import type {
  OrchestraSkillCall,
  SkillArtifactRef,
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import {
  parseCaptionCanonicalTrackAllEvidenceRecord,
} from '../captions-specialist/caption-canonical-track-all-evidence-read'
import {
  parseCaptionCanonicalVisualIntelligenceEvidenceRecord,
} from '../captions-specialist/caption-canonical-visual-intelligence-evidence-read'
import {
  parseCaptionCanonicalAuthenticatedSpecialistProjection,
} from '../captions-specialist/caption-canonical-specialist-resume-read'
import {
  createCaptionTrackAllAdmission,
  createCaptionTrackAllEvidencePacketForContractFixture,
  createCaptionTrackAllSupport,
  parseCaptionTrackAllEvidencePacket,
  parseCaptionTrackAllSupportPayload,
} from '../captions-specialist/caption-track-all-support'
import {
  createCaptionVisualEvidencePacketForContractFixture,
  createCaptionVisualIntelligenceSupport,
  parseCaptionVisualIntelligenceEvidencePacket,
  parseCaptionVisualIntelligenceSupportPayload,
} from '../captions-specialist/caption-visual-intelligence-support'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import type {
  CaptionsHarnessRuntimeEvidenceInput,
  CaptionsHarnessSupportResolution,
  CaptionsHarnessSupportResolutionContext,
} from './captions-specialist-harness'

export const CAPTIONS_AUTHENTICATED_OWNER_FIXTURE_VERSION =
  'captions-authenticated-owner-fixture-v1' as const

export interface CaptionsAuthenticatedOwnerFixture {
  fixtureVersion: typeof CAPTIONS_AUTHENTICATED_OWNER_FIXTURE_VERSION
  initialRuntimeEvidence: CaptionsHarnessRuntimeEvidenceInput
  resolveSupportRequest: (
    context: CaptionsHarnessSupportResolutionContext,
  ) => CaptionsHarnessSupportResolution
  sourceFixtureOnly: true
  liveProviderOrGpuRuntimeObservedByFixtureBuilder: false
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function domainRef(id: string, version = 'caption-internal-fixture-v1'):
CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}:${version}`) }
}

function visualRef(id: string): VisualIntelligenceEvidenceRef {
  return { id, version: 1, contentHash: `sha256:${hash(id)}` }
}

function callRef(call: OrchestraSkillCall): SkillContractRef {
  return {
    id: call.callId,
    version: call.schemaVersion,
    contentHash: call.callDigestSha256,
  }
}

function requestRef(request: SkillSupportRequest): SkillContractRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function redigest<T extends Record<string, unknown>>(
  value: T,
  digestField: string,
): T {
  const clone = structuredClone(value)
  clone[digestField as keyof T] = calculateSkillContractDigest(
    clone, digestField) as T[keyof T]
  return clone
}

function domainScope(call: OrchestraSkillCall): CaptionDomainCanonicalScope {
  if (call.job.scopeLevel !== 'scene'
    || call.canonicalScope.sceneId === null
    || call.canonicalScope.outputId === null
    || call.canonicalScope.approvedSnapshotRef === null
    || call.canonicalScope.authorizedFrameRanges.length !== 1) {
    throw new Error(
      'Authenticated owner fixtures require one approved Caption scene range.')
  }
  return {
    ownerUserId: call.canonicalScope.ownerUserId,
    workspaceId: call.canonicalScope.workspaceId,
    projectId: call.canonicalScope.projectId,
    editSessionId: call.canonicalScope.editSessionId,
    planVersionId: 'plan.caption.authenticated-owner-fixture.v1',
    approvedSnapshotRef: structuredClone(
      call.canonicalScope.approvedSnapshotRef),
    outputId: call.canonicalScope.outputId,
    sceneId: call.canonicalScope.sceneId,
    authorizedFrameRanges: structuredClone(
      call.canonicalScope.authorizedFrameRanges),
  }
}

function projection(input: {
  id: string
  request: SkillSupportRequest
  ownerResultRef: SkillContractRef
  ownerKey: 'visual_intelligence' | 'track_all'
  artifact: SkillArtifactRef
}): CanonicalAuthenticatedSpecialistSupportArtifactProjection {
  const withoutDigest: Omit<
    CanonicalAuthenticatedSpecialistSupportArtifactProjection,
    'projectionDigestSha256'
  > = {
    schemaVersion:
      'canonical-authenticated-specialist-support-artifact-projection-v1',
    projectionId: input.id,
    originalCallRef: structuredClone(input.request.originalCallRef),
    supportRequestRef: requestRef(input.request),
    ownerResultRef: structuredClone(input.ownerResultRef),
    ownerKey: input.ownerKey,
    canonicalScope: structuredClone(input.request.canonicalScope),
    artifactRefs: [structuredClone(input.artifact)],
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
  return parseCaptionCanonicalAuthenticatedSpecialistProjection(redigest({
    ...withoutDigest,
    projectionDigestSha256: '',
  }, 'projectionDigestSha256'))
}

function visualObservation(
  request: SkillSupportRequest,
  role: CaptionVisualEvidenceObservation['role'],
  index: number,
): CaptionVisualEvidenceObservation {
  const range = request.canonicalScope.authorizedFrameRanges[0]!
  return {
    observationId: `caption.visual.observation.${index + 1}`,
    sceneId: request.canonicalScope.sceneId!,
    frameRange: structuredClone(range),
    role,
    regionBasisPoints: role === 'safe_candidate'
      ? { x: 500, y: 7_000, width: 3_000, height: 1_500 }
      : { x: 4_000 + index * 500, y: 800, width: 2_000, height: 2_500 },
    confidenceBasisPoints: 9_000,
    temporalStabilityBasisPoints: 9_000,
    measuredContrastRatioMilli: null,
    clutterBasisPoints: 1_000,
    cropResilienceBasisPoints: 9_000,
    compositionBalanceBasisPoints: 8_500,
    findingIds: [],
    evidenceRefs: [visualRef(`caption.visual.evidence.${index + 1}`)],
    uncertaintyCode: null,
  }
}

function resolveVisual(
  context: CaptionsHarnessSupportResolutionContext,
  pendingTrackPayload: unknown,
): CaptionsHarnessSupportResolution {
  const request = context.selectedSupportRequest
  const payload = parseCaptionVisualIntelligenceSupportPayload(
    request.typedPayload)
  const suffix = hash(request.requestDigestSha256).slice(0, 12)
  const reportRef = visualRef(`caption.visual.report.${suffix}`)
  const fixturePacket = createCaptionVisualEvidencePacketForContractFixture({
    packetId: `caption.visual.packet.${suffix}`,
    payload,
    supportRequest: request,
    visualIntelligenceReportRef: reportRef,
    observations: payload.requiredObservationRoles.map((role, index) =>
      visualObservation(request, role, index)),
    findingIds: [],
  })
  const authenticatedReadResultRef = domainRef(
    `caption.visual.authenticated-read.${suffix}`,
    'visual-intelligence-authenticated-read-result-v1')
  const packet = parseCaptionVisualIntelligenceEvidencePacket(redigest({
    ...structuredClone(fixturePacket),
    authenticatedReadResultRef,
    evidenceMode: 'authenticated_private_runtime',
    canonicalReportRereadVerified: true,
    exactCanonicalScopeVerified: true,
    actualVisualInferenceObserved: true,
    actualRenderedPixelsInspected: false,
    immutableReportReread: true,
    packetDigestSha256: '',
  } as unknown as Record<string, unknown>, 'packetDigestSha256'), {
    payload,
    supportRequest: request,
  })
  const artifact: SkillArtifactRef = {
    id: packet.packetId,
    version: packet.schemaVersion,
    contentHash: packet.packetDigestSha256,
    artifactType: request.requestedArtifactTypes[0]!,
    producerSkillKey: 'visual_intelligence',
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: requestRef(request),
  }
  const authenticatedProjection = projection({
    id: `caption.visual.projection.${suffix}`,
    request,
    ownerResultRef: authenticatedReadResultRef,
    ownerKey: 'visual_intelligence',
    artifact,
  })
  const recordWithoutDigest: Omit<
    CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord,
    'recordDigestSha256'
  > = {
    schemaVersion:
      'canonical-caption-visual-intelligence-authenticated-evidence-record-v1',
    recordId: `caption.visual.record.${suffix}`,
    originalCallRef: structuredClone(request.originalCallRef),
    supportRequestRef: requestRef(request),
    supportRequest: structuredClone(request),
    supportPayload: structuredClone(payload),
    visualIntelligenceRequestRef: visualRef(
      `caption.visual.request.${suffix}`),
    visualIntelligenceReportRef: reportRef,
    visualIntelligenceSpatialEvidenceRef: visualRef(
      `caption.visual.spatial.${suffix}`),
    authenticatedReadResultRef,
    captionEvidencePacket: packet,
    authenticatedOwnerProjection: authenticatedProjection,
    authenticatedPrincipalVerified: true,
    priorCallAndSupportRequestExactReread: true,
    canonicalVisualIntelligenceRequestExactReread: true,
    immutableReportExactReread: true,
    immutableSpatialEvidenceExactReread: true,
    exactCaptionScopeOutputSceneRangeAndArtifactBindingVerified: true,
    exactExpectedOutcomeLineageVerified: true,
    exactRequiredObservationRoleCoverageVerified: true,
    ownerProjectionCreateOnlyPersisted: true,
    evidenceRecordCreateOnlyPersisted: true,
    browserLocalStateUsed: false,
    rawChatMediaBytesPathsUrlsOrCredentialsAccepted: false,
    directPeerDispatchPerformed: false,
    providerCallPerformedByBridge: false,
    timelineMutationPerformed: false,
    runtimeExecutionAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    costOrBillingAuthorityGrantedToCaption: false,
    finalQaApprovalGrantedToCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
  const record = parseCaptionCanonicalVisualIntelligenceEvidenceRecord(
    redigest({
      ...recordWithoutDigest,
      recordDigestSha256: '',
    }, 'recordDigestSha256'))
  return {
    injectedSupportArtifactRefs: [artifact],
    runtimeEvidence: {
      canonicalVisualIntelligenceEvidenceRecord: record,
      trackAllSupportPayload: pendingTrackPayload,
    },
  }
}

function resolveTrack(
  context: CaptionsHarnessSupportResolutionContext,
): CaptionsHarnessSupportResolution {
  const request = context.selectedSupportRequest
  const payload = parseCaptionTrackAllSupportPayload(request.typedPayload)
  const suffix = hash(request.requestDigestSha256).slice(0, 12)
  const requestedRange = payload.requestedRange
  const expectedFrames = requestedRange.endFrameExclusive
    - requestedRange.startFrame
  const sourceFrameMappingRef = payload.sourceFrameMappingRef
  const subjectEvidence: CaptionTrackAllSubjectEvidence = {
    subjectRequestId: payload.subjectRequests[0]!.subjectRequestId,
    subjectEvidenceId: `caption.track.subject-evidence.${suffix}`,
    subjectRole: payload.subjectRequests[0]!.subjectRole,
    frameRange: structuredClone(requestedRange),
    maskSequenceRef: domainRef(`caption.track.mask-sequence.${suffix}`),
    trackManifestRef: domainRef(`caption.track.manifest.${suffix}`),
    anchorManifestRef: null,
    sourceFrameMappingRef: structuredClone(sourceFrameMappingRef),
    outputFrameDigestSha256: payload.confirmedOutputFrameDigestSha256,
    temporalQa: {
      measuredFrameCount: expectedFrames,
      expectedFrameCount: expectedFrames,
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
      refinementId: `caption.track.opencv.${suffix}`,
      tool: 'opencv',
      operation: 'temporal_median_check',
      inputArtifactRef: domainRef(`caption.track.mask-raw.${suffix}`),
      outputArtifactRef: domainRef(`caption.track.mask-sequence.${suffix}`),
      executionEvidenceRef: domainRef(`caption.track.opencv-evidence.${suffix}`),
      actualExecutionObserved: true,
    }],
    evidenceRefs: [
      domainRef(`caption.track.measurement.${suffix}`),
      domainRef(`caption.track.private-review.${suffix}`),
    ],
  }
  const fixturePacket = createCaptionTrackAllEvidencePacketForContractFixture({
    packetId: `caption.track.packet.${suffix}`,
    payload,
    supportRequest: request,
    trackAllResultRef: domainRef(`caption.track.result.${suffix}`),
    subjectEvidence: [{
      ...subjectEvidence,
      refinementEvidence: subjectEvidence.refinementEvidence.map((item) => ({
        ...item,
        actualExecutionObserved: false,
      })),
    }],
  })
  const sceneEvidenceRef = domainRef(
    `caption.track.scene-evidence.${suffix}`,
    'canonical-track-all-sam3_1-caption-scene-evidence-v1')
  const sceneQaAuthorityRef = domainRef(
    `caption.track.scene-qa-authority.${suffix}`,
    'canonical-track-all-sam3_1-caption-scene-qa-authority-v1')
  const samAdmissionRef = domainRef(
    `caption.track.sam31-admission.${suffix}`,
    'canonical-sam3_1-runtime-result-admission-v1')
  const packet = parseCaptionTrackAllEvidencePacket(redigest({
    ...structuredClone(fixturePacket),
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
    payload,
    supportRequest: request,
  })
  const admission = createCaptionTrackAllAdmission({
    admissionId: `caption.track.admission.${suffix}`,
    packet,
    payload,
    supportRequest: request,
  })
  const artifact: SkillArtifactRef = {
    id: packet.packetId,
    version: packet.schemaVersion,
    contentHash: packet.packetDigestSha256,
    artifactType: 'track_all_mask_binding',
    producerSkillKey: 'track_all',
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: requestRef(request),
  }
  const authenticatedProjection = projection({
    id: `caption.track.projection.${suffix}`,
    request,
    ownerResultRef: sceneEvidenceRef,
    ownerKey: 'track_all',
    artifact,
  })
  const recordWithoutDigest: Omit<
    CanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
    'recordDigestSha256'
  > = {
    schemaVersion:
      'canonical-caption-track-all-authenticated-evidence-record-v2',
    recordId: `caption.track.record.${suffix}`,
    originalCallRef: structuredClone(request.originalCallRef),
    supportRequestRef: requestRef(request),
    supportRequest: structuredClone(request),
    supportPayload: structuredClone(payload),
    backendTrackAllCallRef: domainRef(`caption.track.backend-call.${suffix}`),
    backendTrackAllSupportRequestRef: domainRef(
      `caption.track.backend-support.${suffix}`),
    sam31TaskRef: domainRef(`caption.track.sam31-task.${suffix}`),
    sam31RuntimeResultAdmissionRef: samAdmissionRef,
    trackAllSceneQaAuthorityRef: sceneQaAuthorityRef,
    trackAllSceneEvidenceRef: sceneEvidenceRef,
    captionEvidencePacket: packet,
    captionAdmission: admission,
    authenticatedOwnerProjection: authenticatedProjection,
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
  return {
    injectedSupportArtifactRefs: [artifact],
    runtimeEvidence: {
      canonicalTrackAllEvidenceRecord: record,
    },
  }
}

export function createCaptionsAuthenticatedOwnerFixture(
  call: OrchestraSkillCall,
): CaptionsAuthenticatedOwnerFixture {
  if (call.job.jobType !== 'resolve_subject_occluded_typography') {
    throw new Error(
      'The authenticated multi-owner fixture is scoped to subject occlusion.')
  }
  const scope = domainScope(call)
  const frameDigest = hash(`caption.output-frame:${scope.outputId}`)
  const visualSupport = createCaptionVisualIntelligenceSupport({
    payloadId: 'caption.visual.multi-owner.payload',
    requestId: `${call.callId}.support.visual_intelligence`,
    idempotencyKey: call.idempotencyKey,
    originalCallRef: callRef(call),
    purpose: 'final_frame_occupancy',
    canonicalScope: scope,
    pictureLockRef: domainRef('caption.picture-lock.multi-owner'),
    finishReadinessRef: domainRef('caption.finish-readiness.multi-owner'),
    confirmedOutputFrame: {
      outputId: scope.outputId,
      width: 1920,
      height: 1080,
      aspectRatioNumerator: 16,
      aspectRatioDenominator: 9,
      fpsNumerator: 30,
      fpsDenominator: 1,
      confirmedOutputFrameDigestSha256: frameDigest,
    },
    sourcePrivateArtifactRef: domainRef(
      'caption.source-private.multi-owner'),
    canonicalLayoutOccupancyRef: domainRef(
      'caption.layout-occupancy.multi-owner'),
    requiredObservationRoles: ['safe_candidate', 'face'],
    expectedOutcomeRefs: [domainRef('caption.outcome.safe.multi-owner')],
  })
  const trackSupport = createCaptionTrackAllSupport({
    payloadId: 'caption.track.multi-owner.payload',
    requestId: `${call.callId}.support.track_all`,
    idempotencyKey: call.idempotencyKey,
    originalCallRef: callRef(call),
    purpose: 'subject_occlusion',
    canonicalScope: scope,
    pictureLockRef: domainRef('caption.picture-lock.multi-owner'),
    finishReadinessRef: domainRef('caption.finish-readiness.multi-owner'),
    visualOccupancyManifestRef: domainRef(
      'caption.layout-occupancy.multi-owner'),
    confirmedOutputFrameDigestSha256: frameDigest,
    sourcePrivateArtifactRef: domainRef(
      'caption.source-private.multi-owner'),
    sourceFrameMappingRef: domainRef(
      'caption.source-frame-mapping.multi-owner'),
    subjectRequests: [{
      subjectRequestId: 'caption.subject-request.multi-owner',
      subjectRole: 'primary_speaker',
      visualObservationRefs: [domainRef(
        'caption.visual-observation.multi-owner')],
      sourcePhraseRefs: [domainRef('caption.source-phrase.multi-owner')],
      maskRequired: true,
      trackRequired: true,
      anchorRequired: false,
      preserveHairAndFineEdges: true,
      preserveContactObjects: false,
    }],
    korniaRefinementAllowed: false,
  })
  let admittedVisualRecord:
  CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord | null = null
  return {
    fixtureVersion: CAPTIONS_AUTHENTICATED_OWNER_FIXTURE_VERSION,
    initialRuntimeEvidence: {
      visualIntelligenceSupportPayload: visualSupport.payload,
      trackAllSupportPayload: trackSupport.payload,
    },
    resolveSupportRequest: (context) => {
      if (context.selectedSupportRequest.targetSkillKey
          === 'visual_intelligence') {
        const resolved = resolveVisual(context, trackSupport.payload)
        admittedVisualRecord = resolved.runtimeEvidence
          .canonicalVisualIntelligenceEvidenceRecord as
            CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord
        return resolved
      }
      if (context.selectedSupportRequest.targetSkillKey === 'track_all') {
        const resolved = resolveTrack(context)
        if (admittedVisualRecord !== null) {
          resolved.runtimeEvidence.canonicalVisualIntelligenceEvidenceRecord =
            admittedVisualRecord
        }
        return resolved
      }
      throw new Error(
        'The authenticated multi-owner fixture received an unexpected owner.')
    },
    sourceFixtureOnly: true,
    liveProviderOrGpuRuntimeObservedByFixtureBuilder: false,
  }
}
