import {
  CAPTION_LIVING_FRAME_REQUEST_VERSION,
  LIVING_FRAME_CAPTION_RESPONSE_VERSION,
  type CaptionLivingFrameRequest,
  type LivingFrameCaptionDirectionResponse,
} from '../../src/types/caption-direction-living-frame'
import {
  CAPTION_LIVING_FRAME_REQUEST_V2_VERSION,
  LIVING_FRAME_CAPTION_RESPONSE_V2_VERSION,
  type CaptionLivingFrameRequestV2,
  type LivingFrameCaptionResponseV2,
} from '../../src/types/caption-living-frame-boundary'
import {
  CAPTION_LIVING_FRAME_V1_V2_COMPATIBILITY_VERSION,
  type CaptionLivingFrameRequestCompatibilityBinding,
  type CaptionLivingFrameResponseCompatibilityBinding,
} from '../../src/types/caption-living-frame-compatibility'
import {
  adaptLivingFrameCaptionResponse,
  validateCaptionLivingFrameRequest,
} from '../../src/lib/caption-direction/caption-living-frame-adapter'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import {
  parseCaptionLivingFrameRequestV2,
  parseLivingFrameCaptionResponseV2,
} from './caption-living-frame-boundary'

interface RequestCompatibilityInput {
  bindingId: string
  v1Request: CaptionLivingFrameRequest
  v2Request: CaptionLivingFrameRequestV2
}

interface ResponseCompatibilityInput extends RequestCompatibilityInput {
  requestCompatibilityBinding: CaptionLivingFrameRequestCompatibilityBinding
  v1Response: LivingFrameCaptionDirectionResponse
  v2Response: LivingFrameCaptionResponseV2
}

function normalizedDigest(value: string): string {
  return value.startsWith('sha256:') ? value.slice(7) : value
}

function exactArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function refIds(refs: ReadonlyArray<{ id: string }>): string[] {
  return refs.map((ref) => ref.id)
}

function exactWireRef(
  v1: { id: string; digestSha256: string } | undefined,
  v2: { id: string; contentHash: string } | null,
): boolean {
  return v1 === undefined || v2 === null
    ? v1 === undefined && v2 === null
    : v1.id === v2.id && normalizedDigest(v1.digestSha256) === v2.contentHash
}

function includesRef(
  refs: ReadonlyArray<{ id: string; contentHash: string }>,
  id: string,
  digest: string,
): boolean {
  return refs.some((ref) => ref.id === id
    && ref.contentHash === normalizedDigest(digest))
}

function includesDigest(
  refs: ReadonlyArray<{ contentHash: string }>,
  digest: string,
): boolean {
  return refs.some((ref) => ref.contentHash === normalizedDigest(digest))
}

function exactRequestScope(
  v1: CaptionLivingFrameRequest,
  v2: CaptionLivingFrameRequestV2,
): boolean {
  const left = v1.canonicalScope
  const right = v2.canonicalScope
  return left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.handoffId === right.handoffId
    && left.planVersionId === right.planVersionId
    && (right.approvedSnapshotRef === null
      ? left.approvedSnapshotId === null
      : left.approvedSnapshotId === right.approvedSnapshotRef.id)
}

function exactReservation(
  v1: CaptionLivingFrameRequest,
  v2: CaptionLivingFrameRequestV2,
): boolean {
  if (v1.captionReservation.reservedRegions.length !== v2.reservation.regions.length
    || v1.captionReservation.captionPlanePriority * 10
      !== v2.reservation.captionPlanePriority
    || !exactArray(
      v1.captionReservation.protectedRegions.map((region) => region.regionId),
      v2.reservation.protectedRegionIds,
    )
    || !exactArray(v1.captionReservation.fallbackRegionIds, v2.reservation.fallbackRegionIds)) {
    return false
  }
  return v1.captionReservation.reservedRegions.every((region, index) => {
    const v2Region = v2.reservation.regions[index]
    return region.regionId === v2Region.regionId
      && region.pixelBox.x === v2Region.pixelBounds.x
      && region.pixelBox.y === v2Region.pixelBounds.y
      && region.pixelBox.width === v2Region.pixelBounds.width
      && region.pixelBox.height === v2Region.pixelBounds.height
      && Math.round(region.normalizedBox.x * 10_000) === v2Region.normalizedBasisPoints.x
      && Math.round(region.normalizedBox.y * 10_000) === v2Region.normalizedBasisPoints.y
      && Math.round(region.normalizedBox.width * 10_000)
        === v2Region.normalizedBasisPoints.width
      && Math.round(region.normalizedBox.height * 10_000)
        === v2Region.normalizedBasisPoints.height
  })
}

function validateSharedRequestLineage(
  v1: CaptionLivingFrameRequest,
  v2: CaptionLivingFrameRequestV2,
): void {
  const expectedComplexity = {
    low: 'restrained',
    medium: 'moderate',
    high: 'expressive',
  } as const
  const approvedSnapshotDigest = v1.createdForPhase === 'approved_projection'
    ? v1.immutableApprovedSnapshotRef.contentHash : null
  const v2ApprovedSnapshot = v2.canonicalScope.approvedSnapshotRef
  if (v1.createdForPhase !== v2.createdForPhase
    || !exactRequestScope(v1, v2)
    || (approvedSnapshotDigest === null
      ? v2ApprovedSnapshot !== null
      : v2ApprovedSnapshot === null
        || v2ApprovedSnapshot.contentHash !== normalizedDigest(approvedSnapshotDigest))
    || v1.captionPlanRef.captionDirectionPlanId !== v2.captionPlanRef.id
    || normalizedDigest(v1.captionPlanRef.captionDirectionPlanDigestSha256)
      !== v2.captionPlanRef.contentHash
    || v1.canonicalTranscriptRef.artifactId !== v2.canonicalTranscript.artifactRef.id
    || normalizedDigest(v1.canonicalTranscriptRef.artifactDigestSha256)
      !== v2.canonicalTranscript.artifactRef.contentHash
    || v1.canonicalTranscriptRef.language !== v2.canonicalTranscript.language
    || !exactArray(v1.canonicalTranscriptRef.sourceSegmentIds,
      v2.canonicalTranscript.sourceSegmentIds)
    || !exactArray(v1.canonicalTranscriptRef.semanticPhraseIds,
      v2.canonicalTranscript.phraseIds)
    || !exactArray(v1.canonicalTranscriptRef.exactSourceWordIds,
      v2.canonicalTranscript.exactSourceWordIds)
    || v1.semanticRequest.stableConceptId !== v2.semanticRequest.conceptId
    || v1.semanticRequest.semanticPurpose !== v2.semanticRequest.purposeCode
    || v1.semanticRequest.visualVerbIntent !== v2.semanticRequest.visualVerbCode
    || !exactArray(v1.semanticRequest.sourceSemanticPhraseIds,
      v2.semanticRequest.sourcePhraseIds)
    || !exactArray(v1.semanticRequest.exactSourceWordIds,
      v2.semanticRequest.exactSourceWordIds)
    || v1.confirmedFrame.outputId !== v2.confirmedFrame.outputId
    || v1.confirmedFrame.width !== v2.confirmedFrame.width
    || v1.confirmedFrame.height !== v2.confirmedFrame.height
    || v1.confirmedFrame.aspectRatioNumerator !== v2.confirmedFrame.aspectRatioNumerator
    || v1.confirmedFrame.aspectRatioDenominator !== v2.confirmedFrame.aspectRatioDenominator
    || normalizedDigest(v1.confirmedFrame.confirmedOutputFrameDigestSha256)
      !== v2.confirmedFrame.confirmedOutputFrameDigestSha256
    || !exactReservation(v1, v2)
    || v1.timingRequest.masterTimingPlanId !== v2.timing.masterTimingRef.id
    || normalizedDigest(v1.timingRequest.masterTimingDigestSha256)
      !== v2.timing.masterTimingRef.contentHash
    || v1.timingRequest.storyTimingPlanId !== v2.timing.storyTimingRef.id
    || normalizedDigest(v1.timingRequest.storyTimingDigestSha256)
      !== v2.timing.storyTimingRef.contentHash
    || !exactArray(v1.timingRequest.existingStoryTimingEventIds, refIds(v2.timing.eventRefs))
    || !exactArray(v1.timingRequest.existingStoryTimingCueIds, refIds(v2.timing.cueRefs))
    || v1.styleRequest.captionStyleProfileId !== v2.style.captionStyleProfileRef.id
    || normalizedDigest(v1.styleRequest.captionStyleProfileDigestSha256)
      !== v2.style.captionStyleProfileRef.contentHash
    || !exactArray(v1.styleRequest.approvedSemanticColorTokenIds,
      refIds(v2.style.approvedSemanticColorTokenRefs))
    || v1.dependencyRefs.occupancyManifestRef.id
      !== v2.dependencies.layoutOccupancyManifestRef.id
    || normalizedDigest(v1.dependencyRefs.occupancyManifestRef.contentHash)
      !== v2.dependencies.layoutOccupancyManifestRef.contentHash
    || v1.dependencyRefs.expectedLivingFrameComponentVersion
      !== v2.dependencies.livingFrameComponentVersionExpected
    || expectedComplexity[v1.estimateInputs.requestedComplexityCeiling]
      !== v2.estimateInputs.requestedComplexityCeiling
    || (v1.estimateInputs.premiumOperationPermissionExpectation === 'expected_if_approved')
      !== v2.estimateInputs.premiumOperationPermissionExpected
    || (v1.estimateInputs.lowerCostFallbackPreference !== 'no_preference')
      !== v2.estimateInputs.lowerCostFallbackPreferred
    || v1.accessibilityAndSafety.reducedMotionRequired
      !== v2.accessibility.reducedMotionRequired
    || !exactArray(v1.accessibilityAndSafety.documentaryFactSafetyRefIds,
      refIds(v2.documentaryFactSafetyRefs))
    || !includesRef(v2.privateArtifactPolicy.stalenessRefs,
      v1.canonicalTranscriptRef.artifactId,
      v1.privateArtifactMetadata.stalenessRefs.transcriptDigestSha256)
    || !includesRef(v2.privateArtifactPolicy.stalenessRefs,
      v1.captionPlanRef.captionDirectionPlanId,
      v1.privateArtifactMetadata.stalenessRefs.captionPlanDigestSha256)
    || !includesDigest(v2.privateArtifactPolicy.stalenessRefs,
      v1.privateArtifactMetadata.stalenessRefs.confirmedFrameDigestSha256)
    || !includesRef(v2.privateArtifactPolicy.stalenessRefs,
      v1.timingRequest.masterTimingPlanId,
      v1.privateArtifactMetadata.stalenessRefs.masterTimingDigestSha256)
    || !includesRef(v2.privateArtifactPolicy.stalenessRefs,
      v1.dependencyRefs.occupancyManifestRef.id,
      v1.privateArtifactMetadata.stalenessRefs.layoutOccupancyDigestSha256)) {
    throw new Error('Caption Living Frame V1/V2 requests do not share exact canonical lineage.')
  }
}

export function bindCaptionLivingFrameRequestV1ToV2(
  input: RequestCompatibilityInput,
): CaptionLivingFrameRequestCompatibilityBinding {
  assertClosedContractTree(input, 'Caption Living Frame V1/V2 request compatibility input')
  const v1Validation = validateCaptionLivingFrameRequest(input.v1Request)
  if (!v1Validation.ok) {
    throw new Error(`Caption Living Frame V1 request is invalid: ${v1Validation.errors.join(' ')}`)
  }
  const v2 = parseCaptionLivingFrameRequestV2(input.v2Request)
  validateSharedRequestLineage(input.v1Request, v2)
  const base: Omit<CaptionLivingFrameRequestCompatibilityBinding, 'bindingDigestSha256'> = {
    schemaVersion: CAPTION_LIVING_FRAME_V1_V2_COMPATIBILITY_VERSION,
    bindingId: input.bindingId,
    v1RequestRef: {
      id: input.v1Request.requestId,
      schemaVersion: CAPTION_LIVING_FRAME_REQUEST_VERSION,
      digestSha256: input.v1Request.requestDigestSha256,
    },
    v2RequestRef: {
      id: v2.requestId,
      schemaVersion: CAPTION_LIVING_FRAME_REQUEST_V2_VERSION,
      digestSha256: v2.requestDigestSha256,
    },
    canonicalScope: {
      workspaceId: v1Scope(input).workspaceId,
      projectId: v1Scope(input).projectId,
      editSessionId: v1Scope(input).editSessionId,
      handoffId: v1Scope(input).handoffId,
      planVersionId: v1Scope(input).planVersionId,
      approvedSnapshotId: v1Scope(input).approvedSnapshotId,
      outputId: input.v1Request.confirmedFrame.outputId,
    },
    sharedLineageAssertions: {
      phaseMatched: true,
      canonicalScopeMatched: true,
      approvedSnapshotMatched: true,
      captionPlanMatched: true,
      transcriptMatched: true,
      semanticIntentMatched: true,
      confirmedFrameMatched: true,
      reservationMatched: true,
      masterAndStoryTimingMatched: true,
      styleAndOccupancyMatched: true,
      privateStalenessMatched: true,
    },
    versionSpecificFieldsRemainOwnedByTheirWireVersion: true,
    wireSchemaRelabelingPerformed: false,
    missingCompatibilityDataInvented: false,
    livingFrameServerImplementationImported: false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeAuthority: false,
    assetCreated: false,
    qaApprovalGranted: false,
    publicDeliveryCreated: false,
    productionReady: false,
  }
  return {
    ...base,
    bindingDigestSha256: calculateSkillContractDigest(
      { ...base, bindingDigestSha256: '' }, 'bindingDigestSha256'),
  }
}

export function bindCaptionLivingFrameRequestV2ToV1(input: {
  bindingId: string
  v2Request: CaptionLivingFrameRequestV2
  v1Request: CaptionLivingFrameRequest
}): CaptionLivingFrameRequestCompatibilityBinding {
  return bindCaptionLivingFrameRequestV1ToV2(input)
}

function v1Scope(input: RequestCompatibilityInput) {
  return input.v1Request.canonicalScope
}

function expectedV2HandoffState(response: LivingFrameCaptionDirectionResponse): string[] {
  return response.requestedInformationOwnerHandoff === 'caption_to_living_frame'
    ? ['requested', 'accepted'] : ['retained_by_caption', 'restored_to_caption']
}

function validateSharedResponseLineage(input: ResponseCompatibilityInput): void {
  const { v1Response: v1, v2Response: v2 } = input
  if (v1.disposition !== v2.disposition
    || v1.reasonCode !== v2.reasonCode
    || v1.safeUserFacingSummary !== v2.safeUserSummary
    || !exactWireRef(v1.professionalComponentRef, v2.livingFrameComponentRef)
    || !exactWireRef(v1.semanticProjectionRef, v2.semanticProjectionRef)
    || !exactWireRef(v1.selectedSceneResult.selectedSceneAdmissionRef,
      v2.selectedScene.admissionRef)
    || !exactWireRef(v1.selectedSceneResult.selectedSceneBindingRef,
      v2.selectedScene.bindingRef)
    || !exactWireRef(v1.timingDependencies.canonicalTimingBindingRef,
      v2.timing.livingFrameTimingBindingRef)
    || !exactWireRef(v1.estimateProjection.estimateProjectionRef,
      v2.estimateProjectionRef)
    || !exactArray(v1.selectedSceneResult.selectedSceneIds, v2.selectedScene.selectedSceneIds)
    || !exactArray(v1.selectedSceneResult.selectedModes, v2.selectedScene.selectedModes)
    || !exactArray(v1.selectedSceneResult.selectedTreatments,
      v2.selectedScene.selectedTreatments)
    || v1.selectedSceneResult.deliberateNonUse !== v2.selectedScene.deliberateNonUse
    || !expectedV2HandoffState(v1).includes(v2.informationOwnerHandoff.state)
    || v1.timingDependencies.masterTimingPlanId !== v2.timing.masterTimingRef.id
    || normalizedDigest(v1.timingDependencies.masterTimingDigestSha256)
      !== v2.timing.masterTimingRef.contentHash
    || !exactArray(v1.timingDependencies.consumedStoryTimingEventIds,
      refIds(v2.timing.storyTimingEventRefs))
    || !exactArray(v1.timingDependencies.consumedStoryTimingCueIds,
      refIds(v2.timing.storyTimingCueRefs))
    || !exactArray(v1.layoutDependencies.occupancyRegionIds,
      refIds(v2.layoutDependencies.occupancyRegionRefs))
    || !exactArray(v1.layoutDependencies.captionSafeExpectationRegionIds,
      refIds(v2.layoutDependencies.captionSafeExpectationRefs))
    || !exactArray([
      ...v1.layoutDependencies.faceProtectionRegionIds,
      ...v1.layoutDependencies.gestureProtectionRegionIds,
    ], refIds(v2.layoutDependencies.faceGestureProtectionRefs))
    || !exactArray(v1.layoutDependencies.maskArtifactDependencyIds,
      refIds(v2.layoutDependencies.maskArtifactRefs))
    || !v2.layoutDependencies.captionPlaneAboveLivingFrame
    || !exactArray(v1.estimateProjection.requiredCapabilityKeys,
      v2.requiredCapabilityCategories)
    || !exactArray(v1.estimateProjection.requiredWorkCategories,
      v2.requiredWorkCategories)
    || v1.fallbackResult.selectedTreatment !== v2.selectedFallbackCode
    || v1.fallbackResult.captionRetainsOrRegainsInformationOwnership
      !== v2.captionRetainsOrRegainsInformationOwnership
    || !exactArray(v1.qaEvidenceRequirements.requiredQaCodes,
      v2.qaEvidenceRequirementCodes)
    || v1.staleness.transcriptDigestSha256.slice(7)
      !== v2.stalenessTuple.transcriptRef.contentHash
    || v1.staleness.captionPlanDigestSha256.slice(7)
      !== v2.stalenessTuple.captionPlanRef.contentHash
    || v1.staleness.confirmedFrameDigestSha256.slice(7)
      !== v2.stalenessTuple.confirmedFrameRef.contentHash
    || v1.staleness.layoutOccupancyDigestSha256.slice(7)
      !== v2.stalenessTuple.layoutOccupancyRef.contentHash
    || v1.staleness.masterTimingDigestSha256.slice(7)
      !== v2.stalenessTuple.masterTimingRef.contentHash
    || (v1.staleness.approvedSnapshotDigestSha256 === null
      ? v2.stalenessTuple.approvedSnapshotRef !== null
      : v2.stalenessTuple.approvedSnapshotRef === null
        || normalizedDigest(v1.staleness.approvedSnapshotDigestSha256)
          !== v2.stalenessTuple.approvedSnapshotRef.contentHash)) {
    throw new Error('Caption Living Frame V1/V2 responses do not share exact canonical lineage.')
  }
}

export function bindLivingFrameCaptionResponseV1ToV2(
  input: ResponseCompatibilityInput,
): CaptionLivingFrameResponseCompatibilityBinding {
  assertClosedContractTree(input, 'Caption Living Frame V1/V2 response compatibility input')
  const requestBinding = bindCaptionLivingFrameRequestV1ToV2({
    bindingId: input.requestCompatibilityBinding.bindingId,
    v1Request: input.v1Request,
    v2Request: input.v2Request,
  })
  if (requestBinding.bindingDigestSha256
      !== input.requestCompatibilityBinding.bindingDigestSha256) {
    throw new Error('Caption Living Frame request compatibility binding is stale.')
  }
  const v1Adaptation = adaptLivingFrameCaptionResponse({
    request: input.v1Request,
    response: input.v1Response,
  })
  if (!v1Adaptation.ok) {
    throw new Error(`Living Frame Caption V1 response is invalid: ${v1Adaptation.errors.join(' ')}`)
  }
  const v2 = parseLivingFrameCaptionResponseV2(input.v2Response, input.v2Request)
  validateSharedResponseLineage({ ...input, v2Response: v2 })
  const base: Omit<CaptionLivingFrameResponseCompatibilityBinding, 'bindingDigestSha256'> = {
    schemaVersion: CAPTION_LIVING_FRAME_V1_V2_COMPATIBILITY_VERSION,
    bindingId: input.bindingId,
    requestCompatibilityBindingRef: {
      id: requestBinding.bindingId,
      version: requestBinding.schemaVersion,
      contentHash: requestBinding.bindingDigestSha256,
    },
    v1ResponseRef: {
      id: input.v1Response.responseId,
      schemaVersion: LIVING_FRAME_CAPTION_RESPONSE_VERSION,
      digestSha256: input.v1Response.responseDigestSha256,
    },
    v2ResponseRef: {
      id: v2.responseId,
      schemaVersion: LIVING_FRAME_CAPTION_RESPONSE_V2_VERSION,
      digestSha256: v2.responseDigestSha256,
    },
    selectedSceneIds: [...v2.selectedScene.selectedSceneIds],
    sharedLineageAssertions: {
      dispositionMatched: true,
      requestAndScopeMatched: true,
      selectedSceneDecisionMatched: true,
      informationOwnerHandoffMatched: true,
      masterAndStoryTimingMatched: true,
      layoutAndCaptionPlaneMatched: true,
      estimateFallbackAndQaMatched: true,
      stalenessMatched: true,
    },
    versionSpecificFieldsRemainOwnedByTheirWireVersion: true,
    wireSchemaRelabelingPerformed: false,
    missingCompatibilityDataInvented: false,
    livingFrameServerImplementationImported: false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeAuthority: false,
    assetCreated: false,
    qaApprovalGranted: false,
    publicDeliveryCreated: false,
    productionReady: false,
  }
  return {
    ...base,
    bindingDigestSha256: calculateSkillContractDigest(
      { ...base, bindingDigestSha256: '' }, 'bindingDigestSha256'),
  }
}

export function bindLivingFrameCaptionResponseV2ToV1(input: {
  bindingId: string
  requestCompatibilityBinding: CaptionLivingFrameRequestCompatibilityBinding
  v2Request: CaptionLivingFrameRequestV2
  v1Request: CaptionLivingFrameRequest
  v2Response: LivingFrameCaptionResponseV2
  v1Response: LivingFrameCaptionDirectionResponse
}): CaptionLivingFrameResponseCompatibilityBinding {
  return bindLivingFrameCaptionResponseV1ToV2(input)
}
