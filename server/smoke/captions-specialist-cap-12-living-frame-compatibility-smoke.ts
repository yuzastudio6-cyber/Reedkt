import assert from 'node:assert/strict'
import {
  CAPTION_LIVING_FRAME_CONTRACT_VERSIONS,
  CAPTION_LIVING_FRAME_PUBLIC_TYPE_RECEIPT,
  adaptLivingFrameCaptionResponse,
  digestCaptionLivingFrameRequest,
  digestLivingFrameCaptionResponse,
  validateCaptionLivingFrameRequest,
} from '../../src/lib/caption-direction/caption-living-frame-adapter'
import {
  CAPTION_LIVING_FRAME_REQUEST_VERSION,
  LIVING_FRAME_CAPTION_RESPONSE_VERSION,
  type CaptionLivingFrameApprovedProjectionRequest,
  type LivingFrameCaptionDirectionResponse,
} from '../../src/types/caption-direction-living-frame'
import type {
  CaptionLivingFrameRequestV2,
  LivingFrameCaptionResponseV2,
} from '../../src/types/caption-living-frame-boundary'
import {
  bindCaptionLivingFrameRequestV1ToV2,
  bindCaptionLivingFrameRequestV2ToV1,
  bindLivingFrameCaptionResponseV1ToV2,
  bindLivingFrameCaptionResponseV2ToV1,
} from '../captions-specialist/caption-living-frame-compatibility'

function prefixed(digest: string): string {
  return digest.startsWith('sha256:') ? digest : `sha256:${digest}`
}

function evidenceRef(id: string, contentHash: string, version = 1) {
  return { id, version, contentHash: prefixed(contentHash) }
}

function opaqueRef(
  id: string,
  schemaVersion: string,
  contentHash: string,
  version = 1,
) {
  return { id, schemaVersion, version, digestSha256: prefixed(contentHash) }
}

function createV1Request(
  v2: CaptionLivingFrameRequestV2,
): CaptionLivingFrameApprovedProjectionRequest {
  assert.ok(v2.canonicalScope.approvedSnapshotRef)
  const approvedSnapshotRef = v2.canonicalScope.approvedSnapshotRef
  const base: CaptionLivingFrameApprovedProjectionRequest = {
    schemaVersion: CAPTION_LIVING_FRAME_REQUEST_VERSION,
    requestId: 'caption-lf-v1-cap12-compatibility',
    requestDigestSha256: `sha256:${'0'.repeat(64)}`,
    idempotencyKey: v2.idempotencyKey,
    createdForPhase: 'approved_projection',
    canonicalScope: {
      workspaceId: v2.canonicalScope.workspaceId,
      projectId: v2.canonicalScope.projectId,
      editSessionId: v2.canonicalScope.editSessionId,
      handoffId: v2.canonicalScope.handoffId,
      planVersionId: v2.canonicalScope.planVersionId,
      approvedSnapshotId: approvedSnapshotRef.id,
    },
    captionPlanRef: {
      captionDirectionPlanId: v2.captionPlanRef.id,
      captionDirectionPlanVersion: 1,
      captionDirectionPlanDigestSha256: prefixed(v2.captionPlanRef.contentHash),
      captionDirectionProjectionId: v2.captionProjectionRef.id,
      captionDirectionProjectionVersion: 1,
      captionDirectionProjectionDigestSha256:
        prefixed(v2.captionProjectionRef.contentHash),
      sceneGraphRef: evidenceRef(
        v2.captionPlanRef.id,
        v2.captionPlanRef.contentHash,
      ),
    },
    canonicalTranscriptRef: {
      artifactId: v2.canonicalTranscript.artifactRef.id,
      artifactVersion: 1,
      artifactDigestSha256: prefixed(v2.canonicalTranscript.artifactRef.contentHash),
      language: v2.canonicalTranscript.language,
      sourceSegmentIds: [...v2.canonicalTranscript.sourceSegmentIds],
      semanticPhraseIds: [...v2.canonicalTranscript.phraseIds],
      exactSourceWordIds: [...v2.canonicalTranscript.exactSourceWordIds],
      containsRawTranscriptText: false,
    },
    semanticRequest: {
      stableConceptId: v2.semanticRequest.conceptId,
      classification: 'cross_system_transform',
      semanticPurpose: 'reinforce_key_concept',
      visualVerbIntent: 'transform',
      sourceSemanticPhraseIds: [...v2.semanticRequest.sourcePhraseIds],
      exactSourceWordIds: [...v2.semanticRequest.exactSourceWordIds],
      informationOwnerBefore: 'caption',
      informationOwnerRequestedAfter: 'living_frame',
      noDuplicateVisibleInformationAfterTransfer: true,
      restoreCaptionOwnershipOnFailureOrExit: true,
    },
    confirmedFrame: {
      outputId: v2.confirmedFrame.outputId,
      width: v2.confirmedFrame.width,
      height: v2.confirmedFrame.height,
      aspectRatio:
        `${v2.confirmedFrame.aspectRatioNumerator}:${v2.confirmedFrame.aspectRatioDenominator}`,
      aspectRatioNumerator: v2.confirmedFrame.aspectRatioNumerator,
      aspectRatioDenominator: v2.confirmedFrame.aspectRatioDenominator,
      confirmedOutputFrameDigestSha256:
        prefixed(v2.confirmedFrame.confirmedOutputFrameDigestSha256),
      userConfirmed: true,
      silentlyInferredOrSubstituted: false,
    },
    captionReservation: {
      reservedRegions: v2.reservation.regions.map((region) => ({
        regionId: region.regionId,
        normalizedBox: {
          x: region.normalizedBasisPoints.x / 10_000,
          y: region.normalizedBasisPoints.y / 10_000,
          width: region.normalizedBasisPoints.width / 10_000,
          height: region.normalizedBasisPoints.height / 10_000,
        },
        pixelBox: { ...region.pixelBounds },
        regionDigestSha256: `sha256:${'1'.repeat(64)}`,
      })),
      captionPlanePriority: v2.reservation.captionPlanePriority / 10,
      protectedRegions: v2.reservation.protectedRegionIds.map((regionId) => ({
        regionId,
        kind: 'face' as const,
        regionDigestSha256: `sha256:${'2'.repeat(64)}`,
      })),
      desiredReservationBoundary: 'semantic_phrase',
      desiredReservationDurationIntent: 'extended_for_comprehension',
      fallbackRegionIds: [...v2.reservation.fallbackRegionIds],
    },
    timingRequest: {
      masterTimingPlanId: v2.timing.masterTimingRef.id,
      masterTimingDigestSha256: prefixed(v2.timing.masterTimingRef.contentHash),
      storyTimingPlanId: v2.timing.storyTimingRef.id,
      storyTimingDigestSha256: prefixed(v2.timing.storyTimingRef.contentHash),
      existingStoryTimingEventIds: v2.timing.eventRefs.map((ref) => ref.id),
      existingStoryTimingCueIds: v2.timing.cueRefs.map((ref) => ref.id),
      semanticStartIntent: 'spoken_meaning_begins',
      semanticHitIntent: 'primary_motion_requested',
      semanticHoldIntent: 'meaning_comprehension_hold_requested',
      semanticExitIntent: 'attention_return_requested',
      captionDirectionAssignsFinalLivingFrameFrames: false,
      masterTimingRemainsSoleClockAuthority: true,
    },
    styleRequest: {
      captionStyleProfileId: v2.style.captionStyleProfileRef.id,
      captionStyleProfileVersion: 1,
      captionStyleProfileDigestSha256:
        prefixed(v2.style.captionStyleProfileRef.contentHash),
      approvedSemanticColorTokenIds:
        v2.style.approvedSemanticColorTokenRefs.map((ref) => ref.id),
      motionIntent: 'moderate',
      reducedMotionIntent: 'static_hierarchy',
      containsCssReactAssCommandsOrExecutablePrompt: false,
    },
    dependencyRefs: {
      layoutPlanRef: evidenceRef(
        'layout-plan-cap12-compatibility',
        v2.dependencies.layoutOccupancyManifestRef.contentHash,
      ),
      occupancyManifestRef: evidenceRef(
        v2.dependencies.layoutOccupancyManifestRef.id,
        v2.dependencies.layoutOccupancyManifestRef.contentHash,
      ),
      expectedLivingFrameComponentVersion:
        'living-frame-professional-skill-component-v1',
      captionDirectionComponentVersion: 'caption-direction-contract-v1',
      contractVersions: structuredClone(CAPTION_LIVING_FRAME_CONTRACT_VERSIONS),
      publicTypeReceipt: structuredClone(CAPTION_LIVING_FRAME_PUBLIC_TYPE_RECEIPT),
    },
    estimateInputs: {
      requestedComplexityCeiling: 'medium',
      premiumOperationPermissionExpectation:
        v2.estimateInputs.premiumOperationPermissionExpected
          ? 'expected_if_approved' : 'not_expected',
      lowerCostFallbackPreference: v2.estimateInputs.lowerCostFallbackPreferred
        ? 'prefer_simpler_treatment' : 'no_preference',
      pricingOrBillingAuthorityProvided: false,
    },
    fallbackPolicy: {
      orderedSteps: ['simplified_depth_composition', 'static_card', 'captions_only'],
      captionRetainsOrRegainsInformationOwnership: true,
      structuralFailureRequiresReview: true,
    },
    accessibilityAndSafety: {
      qaExpectationCodes: [
        'caption_safe_region_expected',
        'semantic_timing_binding_required',
        'attention_restoration_required',
        'visual_density_restraint_expected',
        'narration_protection_required',
      ],
      accessibleCaptionTrackId: 'accessible-caption-track-cap12-compatibility',
      completeAccessibleWordingRetained: true,
      reducedMotionRequired: v2.accessibility.reducedMotionRequired,
      reducedMotionParityRequired: true,
      documentaryFactSafetyRefIds:
        v2.documentaryFactSafetyRefs.map((ref) => ref.id),
      narrationProtection: 'strict',
    },
    privateArtifactMetadata: {
      tenantScope: {
        workspaceId: v2.canonicalScope.workspaceId,
        projectId: v2.canonicalScope.projectId,
      },
      retentionClass: 'approved_private_artifact',
      accessClass: 'tenant_private',
      byteFreeRequest: true,
      replayPolicy: 'reject_stale_or_changed_authority',
      stalenessRefs: {
        transcriptDigestSha256: prefixed(v2.canonicalTranscript.artifactRef.contentHash),
        captionPlanDigestSha256: prefixed(v2.captionPlanRef.contentHash),
        confirmedFrameDigestSha256:
          prefixed(v2.confirmedFrame.confirmedOutputFrameDigestSha256),
        layoutOccupancyDigestSha256:
          prefixed(v2.dependencies.layoutOccupancyManifestRef.contentHash),
        masterTimingDigestSha256: prefixed(v2.timing.masterTimingRef.contentHash),
        approvedSnapshotDigestSha256: prefixed(approvedSnapshotRef.contentHash),
      },
    },
    authority: {
      captionOwnsRequestShape: true,
      livingFrameOwnsResponseAndExecution: true,
      preapprovalIntentReservationOnly: true,
      operationAuthority: false,
      dispatchAuthority: false,
      providerAuthority: false,
      runtimeAuthority: false,
      assetCreationAuthority: false,
      qaApprovalAuthority: false,
      approvalAuthority: false,
      creditOrBillingAuthority: false,
      publicDeliveryAuthority: false,
      productionAuthority: false,
    },
    containsRawChatMediaBytesPathsUrlsCredentialsOrExecutableText: false,
    immutableApprovedSnapshotRef: evidenceRef(
      approvedSnapshotRef.id,
      approvedSnapshotRef.contentHash,
    ),
    immutableSnapshotRereadAndDigestMatched: true,
  }
  base.requestDigestSha256 = digestCaptionLivingFrameRequest(base)
  return base
}

function createV1Response(
  request: CaptionLivingFrameApprovedProjectionRequest,
  v2: LivingFrameCaptionResponseV2,
): LivingFrameCaptionDirectionResponse {
  assert.ok(v2.selectedScene.admissionRef)
  assert.ok(v2.selectedScene.bindingRef)
  assert.ok(v2.timing.livingFrameTimingBindingRef)
  assert.ok(v2.estimateProjectionRef)
  const base: LivingFrameCaptionDirectionResponse = {
    schemaVersion: LIVING_FRAME_CAPTION_RESPONSE_VERSION,
    responseId: 'living-frame-caption-v1-cap12-compatibility',
    responseDigestSha256: `sha256:${'0'.repeat(64)}`,
    originalRequestId: request.requestId,
    originalRequestDigestSha256: request.requestDigestSha256,
    idempotencyKey: request.idempotencyKey,
    canonicalScope: structuredClone(request.canonicalScope),
    disposition: v2.disposition,
    reasonCode: v2.reasonCode,
    safeUserFacingSummary: v2.safeUserSummary,
    professionalComponentRef: {
      ...opaqueRef(
        v2.livingFrameComponentRef.id,
        'living-frame-professional-skill-component-v1',
        v2.livingFrameComponentRef.contentHash,
      ),
      professionalSkillId: 'motion.living_frame_storytelling',
      contractVersion: 'living-frame-professional-skill-component-v1',
    },
    semanticProjectionRef: opaqueRef(
      v2.semanticProjectionRef.id,
      'living-frame-semantic-plan-projection-v1',
      v2.semanticProjectionRef.contentHash,
    ),
    motionSpecRef: opaqueRef(
      'living-frame-motion-spec-cap12-compatibility',
      'canonical-living-frame-motion-spec-v2',
      '3'.repeat(64),
      2,
    ),
    selectedSceneResult: {
      selectedSceneAdmissionRef: opaqueRef(
        v2.selectedScene.admissionRef.id,
        'living-frame-selected-scene-admission-candidate-v1',
        v2.selectedScene.admissionRef.contentHash,
      ),
      selectedSceneBindingRef: opaqueRef(
        v2.selectedScene.bindingRef.id,
        'canonical-living-frame-selected-scene-binding-v1',
        v2.selectedScene.bindingRef.contentHash,
      ),
      selectedSceneIds: [...v2.selectedScene.selectedSceneIds],
      selectedModes: [...v2.selectedScene.selectedModes] as Array<'living_diagram' | 'living_archive'>,
      selectedTreatments: [...v2.selectedScene.selectedTreatments] as Array<'use_full' | 'use_subtle'>,
      deliberateNonUse: v2.selectedScene.deliberateNonUse,
      executionClaimed: false,
    },
    requestedInformationOwnerHandoff: 'caption_to_living_frame',
    attentionEvents: [
      ['handoff', 'visual'],
      ['hold', 'visual'],
      ['restore', 'speaker'],
    ].map(([eventType, target], order) => ({
      attentionEventId: `attention-cap12-compatibility-${eventType}`,
      order,
      eventType: eventType as 'handoff' | 'hold' | 'restore',
      target: target as 'visual' | 'speaker',
      methods: ['motion_emphasis_expectation'] as const,
      summary: `Caption and Living Frame ${eventType} attention safely.`,
      exactFramesProvided: false as const,
    })),
    timingDependencies: {
      masterTimingPlanId: v2.timing.masterTimingRef.id,
      masterTimingDigestSha256: prefixed(v2.timing.masterTimingRef.contentHash),
      consumedStoryTimingEventIds: v2.timing.storyTimingEventRefs.map((ref) => ref.id),
      consumedStoryTimingCueIds: v2.timing.storyTimingCueRefs.map((ref) => ref.id),
      canonicalTimingBindingRef: opaqueRef(
        v2.timing.livingFrameTimingBindingRef.id,
        'canonical-living-frame-timing-binding-v1',
        v2.timing.livingFrameTimingBindingRef.contentHash,
      ),
      semanticTimingRequestIds: [...v2.informationOwnerHandoff.semanticTimingRequestIds],
      parallelClockCreated: false,
      masterTimingRemainsSoleClockAuthority: true,
    },
    layoutDependencies: {
      occupancyRegionIds: v2.layoutDependencies.occupancyRegionRefs.map((ref) => ref.id),
      captionSafeExpectationRegionIds:
        v2.layoutDependencies.captionSafeExpectationRefs.map((ref) => ref.id),
      faceProtectionRegionIds:
        v2.layoutDependencies.faceGestureProtectionRefs.map((ref) => ref.id),
      gestureProtectionRegionIds: [],
      depthBandNeeds: ['mid_background'],
      occlusionNeeded: v2.layoutDependencies.occlusionExpectationRefs.length > 0,
      captionPlaneRemainsAboveLivingFrame: true,
      explicitStoryTimingBoundInformationHandoffRequiredForException: true,
      maskArtifactDependencyIds: v2.layoutDependencies.maskArtifactRefs.map((ref) => ref.id),
      unresolvedGateCodes: [...v2.layoutDependencies.unresolvedGateCodes],
    },
    estimateProjection: {
      estimateProjectionRef: opaqueRef(
        v2.estimateProjectionRef.id,
        'canonical-living-frame-estimate-work-asset-projection-v6',
        v2.estimateProjectionRef.contentHash,
        6,
      ),
      requestedComplexity: 'medium',
      requiredCapabilityKeys: [...v2.requiredCapabilityCategories],
      requiredWorkCategories: [...v2.requiredWorkCategories],
      pricingOrReservationDecisionProvided: false,
    },
    workGraphProjectionRef: opaqueRef(
      'living-frame-work-graph-cap12-compatibility',
      'canonical-living-frame-work-graph-projection-v10',
      '4'.repeat(64),
      10,
    ),
    rendererPlanBindingRef: opaqueRef(
      'living-frame-renderer-cap12-compatibility',
      'living-frame-renderer-plan-binding-v1',
      '5'.repeat(64),
    ),
    fallbackResult: {
      selectedTreatment: 'simplified_depth_composition',
      evaluatedLadder: ['simplified_depth_composition', 'static_card', 'captions_only'],
      informationOwnerAfterDisposition: 'living_frame',
      captionRetainsOrRegainsInformationOwnership: true,
    },
    qaEvidenceRequirements: {
      captionSafeRegionRequired: true,
      attentionRestorationRequired: true,
      semanticTimingRequired: true,
      visualDensityReviewRequired: true,
      narrationProtectionRequired: true,
      documentaryFactSafetyRequired: false,
      reducedMotionParityRequired: true,
      privateArtifactReviewRequired: true,
      requiredQaCodes: [...v2.qaEvidenceRequirementCodes] as Array<
        'caption_safe_region_expected'
        | 'semantic_timing_binding_required'
        | 'attention_restoration_required'
        | 'visual_density_restraint_expected'
        | 'narration_protection_required'
      >,
    },
    staleness: {
      transcriptDigestSha256:
        request.privateArtifactMetadata.stalenessRefs.transcriptDigestSha256,
      captionPlanDigestSha256:
        request.privateArtifactMetadata.stalenessRefs.captionPlanDigestSha256,
      confirmedFrameDigestSha256:
        request.privateArtifactMetadata.stalenessRefs.confirmedFrameDigestSha256,
      layoutOccupancyDigestSha256:
        request.privateArtifactMetadata.stalenessRefs.layoutOccupancyDigestSha256,
      masterTimingDigestSha256:
        request.privateArtifactMetadata.stalenessRefs.masterTimingDigestSha256,
      livingFrameComponentVersion: 'living-frame-professional-skill-component-v1',
      selectedSceneBindingVersion: 'canonical-living-frame-selected-scene-binding-v1',
      approvedSnapshotDigestSha256:
        request.privateArtifactMetadata.stalenessRefs.approvedSnapshotDigestSha256,
    },
    approvedLineageBindingRef: opaqueRef(
      'living-frame-approved-lineage-cap12-compatibility',
      'living-frame-approved-lineage-binding-v1',
      '6'.repeat(64),
    ),
    authority: {
      operationRegistered: false,
      dispatchGranted: false,
      providerAuthority: false,
      runtimeAuthority: false,
      assetCreatedOrApproved: false,
      qaApprovalGranted: false,
      publicDeliveryCreated: false,
      productionReady: false,
    },
    containsRawChatMediaBytesPathsUrlsCredentialsOrExecutableText: false,
  }
  base.responseDigestSha256 = digestLivingFrameCaptionResponse(base)
  return base
}

export interface CaptionLivingFrameCompatibilitySmokeReceipt {
  assertions: number
  v1Request: CaptionLivingFrameApprovedProjectionRequest
  v1Response: LivingFrameCaptionDirectionResponse
  requestCompatibilityDigestSha256: string
  responseCompatibilityDigestSha256: string
}

export function runCaptionLivingFrameCompatibilitySmoke(input: {
  v2Request: CaptionLivingFrameRequestV2
  v2Response: LivingFrameCaptionResponseV2
}): CaptionLivingFrameCompatibilitySmokeReceipt {
  let assertions = 0
  const check = (condition: unknown, message: string): void => {
    assert.ok(condition, message)
    assertions += 1
  }
  const expectThrow = (action: () => unknown): void => {
    assert.throws(action)
    assertions += 1
  }
  const v1Request = createV1Request(input.v2Request)
  const v1Response = createV1Response(v1Request, input.v2Response)
  const requestCompatibility = bindCaptionLivingFrameRequestV1ToV2({
    bindingId: 'caption-lf-request-v1-v2-cap12-compatibility',
    v1Request,
    v2Request: input.v2Request,
  })
  const responseCompatibility = bindLivingFrameCaptionResponseV1ToV2({
    bindingId: 'caption-lf-response-v1-v2-cap12-compatibility',
    requestCompatibilityBinding: requestCompatibility,
    v1Request,
    v2Request: input.v2Request,
    v1Response,
    v2Response: input.v2Response,
  })
  const reverseRequestCompatibility = bindCaptionLivingFrameRequestV2ToV1({
    bindingId: requestCompatibility.bindingId,
    v2Request: input.v2Request,
    v1Request,
  })
  const reverseResponseCompatibility = bindLivingFrameCaptionResponseV2ToV1({
    bindingId: responseCompatibility.bindingId,
    requestCompatibilityBinding: requestCompatibility,
    v2Request: input.v2Request,
    v1Request,
    v2Response: input.v2Response,
    v1Response,
  })

  check(validateCaptionLivingFrameRequest(v1Request).ok,
    'The frozen V1 request must remain independently valid.')
  check(adaptLivingFrameCaptionResponse({ request: v1Request, response: v1Response }).ok,
    'The frozen V1 response must remain independently valid.')
  check(requestCompatibility.wireSchemaRelabelingPerformed === false
    && requestCompatibility.missingCompatibilityDataInvented === false,
  'The V1/V2 request bridge must pair complete payloads without relabeling or invention.')
  check(responseCompatibility.selectedSceneIds.length === 2,
    'The compatibility bridge must preserve one-request-to-multiple-scenes V1 semantics.')
  check(responseCompatibility.livingFrameServerImplementationImported === false,
    'The compatibility bridge must remain Caption-owned and type-boundary only.')
  check(reverseRequestCompatibility.bindingDigestSha256
    === requestCompatibility.bindingDigestSha256,
  'V2-to-V1 request verification must produce the same exact compatibility binding.')
  check(reverseResponseCompatibility.bindingDigestSha256
    === responseCompatibility.bindingDigestSha256,
  'V2-to-V1 response verification must produce the same exact compatibility binding.')

  const badV1Digest = structuredClone(v1Request)
  badV1Digest.requestDigestSha256 = `sha256:${'f'.repeat(64)}`
  expectThrow(() => bindCaptionLivingFrameRequestV1ToV2({
    bindingId: 'caption-lf-bad-v1-digest',
    v1Request: badV1Digest,
    v2Request: input.v2Request,
  }))

  const staleV2Frame = structuredClone(input.v2Request)
  staleV2Frame.confirmedFrame.confirmedOutputFrameDigestSha256 = 'f'.repeat(64)
  staleV2Frame.requestDigestSha256 = input.v2Request.requestDigestSha256
  expectThrow(() => bindCaptionLivingFrameRequestV1ToV2({
    bindingId: 'caption-lf-stale-v2-frame',
    v1Request,
    v2Request: staleV2Frame,
  }))

  const staleCompatibility = structuredClone(requestCompatibility)
  staleCompatibility.bindingDigestSha256 = 'f'.repeat(64)
  expectThrow(() => bindLivingFrameCaptionResponseV1ToV2({
    bindingId: 'caption-lf-stale-compatibility',
    requestCompatibilityBinding: staleCompatibility,
    v1Request,
    v2Request: input.v2Request,
    v1Response,
    v2Response: input.v2Response,
  }))

  const collapsedV1Scenes = structuredClone(v1Response)
  collapsedV1Scenes.selectedSceneResult.selectedSceneIds.pop()
  collapsedV1Scenes.selectedSceneResult.selectedModes.pop()
  collapsedV1Scenes.selectedSceneResult.selectedTreatments.pop()
  collapsedV1Scenes.responseDigestSha256 = digestLivingFrameCaptionResponse(collapsedV1Scenes)
  expectThrow(() => bindLivingFrameCaptionResponseV1ToV2({
    bindingId: 'caption-lf-collapsed-v1-scenes',
    requestCompatibilityBinding: requestCompatibility,
    v1Request,
    v2Request: input.v2Request,
    v1Response: collapsedV1Scenes,
    v2Response: input.v2Response,
  }))

  return {
    assertions,
    v1Request,
    v1Response,
    requestCompatibilityDigestSha256: requestCompatibility.bindingDigestSha256,
    responseCompatibilityDigestSha256: responseCompatibility.bindingDigestSha256,
  }
}
