import type {
  CaptionLivingFrameAdaptationResult,
  CaptionLivingFrameContractVersions,
  CaptionLivingFrameFallbackStep,
  CaptionLivingFramePublicTypeReceipt,
  CaptionLivingFrameRequest,
  LivingFrameCaptionDirectionResponse,
} from '../../types/caption-direction-living-frame'
import type { BoundingBox } from '../../types/workflow-common'
import { sha256HexUtf8 } from '../sha256'
import {
  compareUtf16Lexical,
  validateClosedContractTree,
} from './closed-contract-validation'

import {
  CAPTION_LIVING_FRAME_ADAPTER_VERSION,
  CAPTION_LIVING_FRAME_PUBLIC_TYPE_RECEIPT_VERSION,
  CAPTION_LIVING_FRAME_REQUEST_VERSION,
  LIVING_FRAME_CAPTION_RESPONSE_VERSION,
} from '../../types/caption-direction-living-frame'

export const CAPTION_LIVING_FRAME_CONTRACT_VERSIONS =
  Object.freeze<CaptionLivingFrameContractVersions>({
    professionalSkillId: 'motion.living_frame_storytelling',
    professionalSkillComponent:
      'living-frame-professional-skill-component-v1',
    semanticPlanProjection:
      'living-frame-semantic-plan-projection-v1',
    selectedSceneAdmission:
      'living-frame-selected-scene-admission-candidate-v1',
    selectedSceneBinding:
      'canonical-living-frame-selected-scene-binding-v1',
    selectedSceneBindingComponentKey:
      'livingFrameSelectedSceneBinding',
    timingBinding: 'canonical-living-frame-timing-binding-v1',
    timingBindingComponentKey: 'livingFrameTimingBinding',
    motionSpec: 'canonical-living-frame-motion-spec-v2',
    motionProfile:
      'approved_visual_interval_scalar_keyframe_choreography_v2',
    estimateWorkAssetProjection:
      'canonical-living-frame-estimate-work-asset-projection-v6',
    estimateWorkAssetProjectionComponentKey:
      'livingFrameEstimateWorkAssetProjection',
    workGraphProjection:
      'canonical-living-frame-work-graph-projection-v10',
    workGraphProjectionComponentKey:
      'livingFrameCanonicalWorkGraphProjection',
    rendererPlanBinding: 'living-frame-renderer-plan-binding-v1',
    approvedLineageBinding:
      'living-frame-approved-lineage-binding-v1',
  })

const INVALID_LIVING_FRAME_BOUNDARY_DIGEST = 'sha256:invalid' as const

export const CAPTION_LIVING_FRAME_PUBLIC_TYPE_RECEIPT =
  Object.freeze<CaptionLivingFramePublicTypeReceipt>({
    schemaVersion:
      CAPTION_LIVING_FRAME_PUBLIC_TYPE_RECEIPT_VERSION,
    repository: 'yuzastudio6-cyber/Reedkt',
    branch: 'codex/living-frame-gpu-operation-preflight-v1',
    commitSha:
      '8f88f6d702781aec64b5b5795fc12c65619d93b0',
    publicTypeFiles: [
      {
        path: 'src/types/living-frame.ts',
        gitBlobSha: '2bc750980eddb3cc00ce71cd72f38a4a4ad82769',
        fileDigestSha256:
          'sha256:697f59a6597bf2eb8c3fcc3e6fdf3b1cc766c70ccd3af9a938335a7ffd7c3537',
      },
      {
        path: 'src/types/living-frame-semantic-plan-projection.ts',
        gitBlobSha: '1852d361e74bc239a9742c5baa9b9717170b1cb5',
        fileDigestSha256:
          'sha256:73aacf0b4206ff8cdff43a15ff84e39d9ab83a1f104f4a5cbdc8b7113bf668b0',
      },
      {
        path: 'src/types/living-frame-selected-scene-binding.ts',
        gitBlobSha: '14bfeed23c44e8d3aa8ba73e9426d0ba42f69eea',
        fileDigestSha256:
          'sha256:0ac3977657f1468ba265a289abd3d40333d19522b3f771d47896a8622d549563',
      },
      {
        path: 'src/types/living-frame-timing-binding.ts',
        gitBlobSha: 'd0ffbe0a5e18e25dcfc071118c1c39257e7598d6',
        fileDigestSha256:
          'sha256:b62b8dc007f2846f63a0ed5027da4fce8aaf1b97ca48dab75b31d259a4cb72fc',
      },
      {
        path: 'src/types/living-frame-approved-lineage-binding.ts',
        gitBlobSha: 'ba67f01748fd4b26119185e917ad2ec73d7478aa',
        fileDigestSha256:
          'sha256:4edeadbabbdd3cf0ecca644d50e79d051f7d653393c07f9f00d28f916dc093a5',
      },
    ],
    publicTypesMergedIntoActiveCheckout: false,
    structuralCompatibilityOnly: true,
    serverImplementationImported: false,
  })

export function digestCaptionLivingFrameRequest(
  request: CaptionLivingFrameRequest,
): string {
  return digestBoundaryObject(
    request,
    'requestDigestSha256',
  )
}

export function digestLivingFrameCaptionResponse(
  response: LivingFrameCaptionDirectionResponse,
): string {
  return digestBoundaryObject(
    response,
    'responseDigestSha256',
  )
}

export function validateCaptionLivingFrameRequest(
  request: CaptionLivingFrameRequest,
): { ok: boolean; errors: string[] } {
  try {
    if (!validateClosedContractTree(request).ok) {
      return {
        ok: false,
        errors: [
          'Caption-to-Living-Frame request is structurally malformed.',
        ],
      }
    }
    return validateCaptionLivingFrameRequestUnsafe(
      request,
    )
  } catch {
    return {
      ok: false,
      errors: [
        'Caption-to-Living-Frame request is structurally malformed.',
      ],
    }
  }
}

function validateCaptionLivingFrameRequestUnsafe(
  request: CaptionLivingFrameRequest,
): { ok: boolean; errors: string[] } {
  if (!hasCompleteClosedRequestSchema(request)) {
    return {
      ok: false,
      errors: [
        'Caption-to-Living-Frame request must use the complete closed wire schema.',
      ],
    }
  }
  const errors: string[] = []
  const scope = request.canonicalScope
  if (
    request.schemaVersion !==
      CAPTION_LIVING_FRAME_REQUEST_VERSION ||
    (
      request.createdForPhase !==
        'planning_draft' &&
      request.createdForPhase !==
        'approved_projection'
    ) ||
    !isOpaqueId(request.requestId) ||
    !isDigest(request.requestDigestSha256) ||
    request.requestDigestSha256 !==
      digestCaptionLivingFrameRequest(request) ||
    !isOpaqueId(request.idempotencyKey) ||
    !isOpaqueId(scope.workspaceId) ||
    !isOpaqueId(scope.projectId) ||
    !isOpaqueId(scope.editSessionId) ||
    !isOpaqueId(scope.handoffId) ||
    !isOpaqueId(scope.planVersionId) ||
    containsUnsafeSerializedBoundaryData(
      request,
    )
  ) {
    errors.push(
      'Caption-to-Living-Frame request identity, digest, or canonical scope is invalid.',
    )
  }
  if (
    (
      request.createdForPhase === 'planning_draft' &&
      scope.approvedSnapshotId !== null
    ) ||
    (
      request.createdForPhase === 'approved_projection' &&
      (
        !scope.approvedSnapshotId ||
        !('immutableApprovedSnapshotRef' in request) ||
        !request.immutableSnapshotRereadAndDigestMatched ||
        request.immutableApprovedSnapshotRef.id !==
          scope.approvedSnapshotId ||
        !isEvidenceRef(request.immutableApprovedSnapshotRef)
      )
    )
  ) {
    errors.push(
      'Caption-to-Living-Frame approval phase does not match immutable snapshot authority.',
    )
  }
  validateCaptionPlanAndTranscript(request, errors)
  validateSemanticFrameAndReservation(request, errors)
  validateTimingAndStyle(request, errors)
  validateDependencies(request, errors)
  validateFallbackSafetyAndPrivateScope(request, errors)
  validateRequestAuthority(request, errors)
  return { ok: errors.length === 0, errors: unique(errors) }
}

export function adaptLivingFrameCaptionResponse(input: {
  request: CaptionLivingFrameRequest
  response: LivingFrameCaptionDirectionResponse
}): CaptionLivingFrameAdaptationResult {
  try {
    if (!validateClosedContractTree(input).ok) {
      return {
        ok: false,
        errors: [
          'Living Frame response or Caption request is structurally malformed.',
        ],
        adapterVersion:
          CAPTION_LIVING_FRAME_ADAPTER_VERSION,
        runtimeOrExecutionAuthorityGranted: false,
      }
    }
    return adaptLivingFrameCaptionResponseUnsafe(
      input,
    )
  } catch {
    return {
      ok: false,
      errors: [
        'Living Frame response or Caption request is structurally malformed.',
      ],
      adapterVersion:
        CAPTION_LIVING_FRAME_ADAPTER_VERSION,
      runtimeOrExecutionAuthorityGranted: false,
    }
  }
}

function adaptLivingFrameCaptionResponseUnsafe(input: {
  request: CaptionLivingFrameRequest
  response: LivingFrameCaptionDirectionResponse
}): CaptionLivingFrameAdaptationResult {
  const errors = validateCaptionLivingFrameRequest(
    input.request,
  ).errors
  const { request, response } = input
  if (!hasCompleteClosedResponseSchema(response)) {
    return {
      ok: false,
      errors: unique([
        ...errors,
        'Living Frame response must use the complete closed wire schema.',
      ]),
      adapterVersion:
        CAPTION_LIVING_FRAME_ADAPTER_VERSION,
      runtimeOrExecutionAuthorityGranted: false,
    }
  }
  if (
    response.schemaVersion !==
      LIVING_FRAME_CAPTION_RESPONSE_VERSION ||
    !isOpaqueId(response.responseId) ||
    !isOpaqueId(response.reasonCode) ||
    !isSafeSummary(response.safeUserFacingSummary) ||
    !isDigest(response.responseDigestSha256) ||
    response.responseDigestSha256 !==
      digestLivingFrameCaptionResponse(response) ||
    response.originalRequestId !== request.requestId ||
    response.originalRequestDigestSha256 !==
      request.requestDigestSha256 ||
    response.idempotencyKey !== request.idempotencyKey ||
    containsUnsafeSerializedBoundaryData(
      response,
    )
  ) {
    errors.push(
      'Living Frame response does not bind the exact Caption Direction request and idempotency lineage.',
    )
  }
  if (!sameScope(response.canonicalScope, request.canonicalScope)) {
    errors.push(
      'Living Frame response canonical tenant, edit, plan, handoff, or snapshot scope was substituted.',
    )
  }
  validateResponseStaleness(request, response, errors)
  validateResponseOpaqueRefs(response, errors)
  validateResponseDisposition(response, errors)
  validateResponseTimingAndLayout(request, response, errors)
  validateResponseAuthority(response, errors)
  return {
    ok: errors.length === 0,
    errors: unique(errors),
    disposition:
      errors.length === 0 ? response.disposition : undefined,
    informationOwner:
      errors.length === 0
        ? response.fallbackResult
          .informationOwnerAfterDisposition
        : undefined,
    acceptedResponseRef:
      errors.length === 0
        ? {
          id: response.responseId,
          schemaVersion: response.schemaVersion,
          version: 1,
          digestSha256: response.responseDigestSha256,
        }
        : undefined,
    adapterVersion: CAPTION_LIVING_FRAME_ADAPTER_VERSION,
    runtimeOrExecutionAuthorityGranted: false,
  }
}

function validateCaptionPlanAndTranscript(
  request: CaptionLivingFrameRequest,
  errors: string[],
): void {
  const planRef = request.captionPlanRef
  const transcript = request.canonicalTranscriptRef
  if (
    !isOpaqueId(planRef.captionDirectionPlanId) ||
    planRef.captionDirectionPlanVersion < 1 ||
    !isDigest(planRef.captionDirectionPlanDigestSha256) ||
    !isOpaqueId(planRef.captionDirectionProjectionId) ||
    planRef.captionDirectionProjectionVersion < 1 ||
    !isDigest(
      planRef.captionDirectionProjectionDigestSha256,
    ) ||
    !isEvidenceRef(planRef.sceneGraphRef)
  ) {
    errors.push(
      'Caption-to-Living-Frame request requires exact caption plan, projection, and scene-graph lineage.',
    )
  }
  if (
    !isOpaqueId(transcript.artifactId) ||
    transcript.artifactVersion < 1 ||
    !isDigest(transcript.artifactDigestSha256) ||
    !transcript.language.trim() ||
    transcript.sourceSegmentIds.length === 0 ||
    transcript.semanticPhraseIds.length === 0 ||
    transcript.exactSourceWordIds.length === 0 ||
    !allOpaqueIds(transcript.sourceSegmentIds) ||
    !allOpaqueIds(transcript.semanticPhraseIds) ||
    !allOpaqueIds(transcript.exactSourceWordIds) ||
    hasDuplicates(transcript.sourceSegmentIds) ||
    hasDuplicates(transcript.semanticPhraseIds) ||
    hasDuplicates(transcript.exactSourceWordIds) ||
    transcript.containsRawTranscriptText
  ) {
    errors.push(
      'Caption-to-Living-Frame transcript reference must be byte-free and preserve exact segment, phrase, and word lineage.',
    )
  }
}

function validateSemanticFrameAndReservation(
  request: CaptionLivingFrameRequest,
  errors: string[],
): void {
  const semantic = request.semanticRequest
  const transcript = request.canonicalTranscriptRef
  if (
    !isOpaqueId(semantic.stableConceptId) ||
    semantic.classification !== 'cross_system_transform' ||
    !SEMANTIC_PURPOSES.has(semantic.semanticPurpose) ||
    !VISUAL_VERBS.has(semantic.visualVerbIntent) ||
    semantic.sourceSemanticPhraseIds.length === 0 ||
    semantic.exactSourceWordIds.length === 0 ||
    !allOpaqueIds(
      semantic.sourceSemanticPhraseIds,
    ) ||
    !allOpaqueIds(semantic.exactSourceWordIds) ||
    hasDuplicates(semantic.sourceSemanticPhraseIds) ||
    hasDuplicates(semantic.exactSourceWordIds) ||
    !isSubset(
      semantic.sourceSemanticPhraseIds,
      transcript.semanticPhraseIds,
    ) ||
    !isSubset(
      semantic.exactSourceWordIds,
      transcript.exactSourceWordIds,
    ) ||
    semantic.informationOwnerBefore !== 'caption' ||
    semantic.informationOwnerRequestedAfter !==
      'living_frame' ||
    !semantic.noDuplicateVisibleInformationAfterTransfer ||
    !semantic.restoreCaptionOwnershipOnFailureOrExit
  ) {
    errors.push(
      'Caption-to-Living-Frame semantic request violates source lineage or information-ownership transfer rules.',
    )
  }
  const frame = request.confirmedFrame
  if (
    !isOpaqueId(frame.outputId) ||
    !Number.isInteger(frame.width) ||
    !Number.isInteger(frame.height) ||
    frame.width < 1 ||
    frame.height < 1 ||
    !Number.isInteger(frame.aspectRatioNumerator) ||
    !Number.isInteger(frame.aspectRatioDenominator) ||
    frame.aspectRatioNumerator < 1 ||
    frame.aspectRatioDenominator < 1 ||
    frame.aspectRatio !==
      `${frame.aspectRatioNumerator}:${frame.aspectRatioDenominator}` ||
    frame.width * frame.aspectRatioDenominator !==
      frame.height * frame.aspectRatioNumerator ||
    !isDigest(frame.confirmedOutputFrameDigestSha256) ||
    !frame.userConfirmed ||
    frame.silentlyInferredOrSubstituted
  ) {
    errors.push(
      'Caption-to-Living-Frame request requires an exact user-confirmed output frame without silent aspect-ratio substitution.',
    )
  }
  const reservation = request.captionReservation
  if (
    reservation.reservedRegions.length === 0 ||
    reservation.fallbackRegionIds.length === 0 ||
    hasDuplicates(
      reservation.reservedRegions.map((region) => region.regionId),
    ) ||
    hasDuplicates(reservation.fallbackRegionIds) ||
    !allOpaqueIds(reservation.fallbackRegionIds) ||
    !RESERVATION_BOUNDARIES.has(
      reservation.desiredReservationBoundary,
    ) ||
    !RESERVATION_DURATIONS.has(
      reservation.desiredReservationDurationIntent,
    ) ||
    reservation.captionPlanePriority < 0 ||
    reservation.captionPlanePriority > 100
  ) {
    errors.push(
      'Caption-to-Living-Frame reservation requires unique primary/fallback regions and a bounded caption-plane priority.',
    )
  }
  for (const region of reservation.reservedRegions) {
    if (
      !isOpaqueId(region.regionId) ||
      !isNormalizedBox(region.normalizedBox) ||
      !isPixelBox(region.pixelBox, frame.width, frame.height) ||
      !isDigest(region.regionDigestSha256)
    ) {
      errors.push(
        `Caption reservation region ${region.regionId} is invalid for the confirmed frame.`,
      )
    }
  }
  for (const region of reservation.protectedRegions) {
    if (
      !isOpaqueId(region.regionId) ||
      !PROTECTED_REGION_KINDS.has(region.kind) ||
      !isDigest(region.regionDigestSha256)
    ) {
      errors.push(
        'Caption protected-region references must be opaque and digest-bound.',
      )
    }
  }
}

function validateTimingAndStyle(
  request: CaptionLivingFrameRequest,
  errors: string[],
): void {
  const timing = request.timingRequest
  if (
    !isOpaqueId(timing.masterTimingPlanId) ||
    !isDigest(timing.masterTimingDigestSha256) ||
    !isOpaqueId(timing.storyTimingPlanId) ||
    !isDigest(timing.storyTimingDigestSha256) ||
    hasDuplicates(timing.existingStoryTimingEventIds) ||
    hasDuplicates(timing.existingStoryTimingCueIds) ||
    !allOpaqueIds(
      timing.existingStoryTimingEventIds,
    ) ||
    !allOpaqueIds(
      timing.existingStoryTimingCueIds,
    ) ||
    !SEMANTIC_START_INTENTS.has(timing.semanticStartIntent) ||
    !SEMANTIC_HIT_INTENTS.has(timing.semanticHitIntent) ||
    timing.semanticHoldIntent !==
      'meaning_comprehension_hold_requested' ||
    !SEMANTIC_EXIT_INTENTS.has(timing.semanticExitIntent) ||
    timing.captionDirectionAssignsFinalLivingFrameFrames ||
    !timing.masterTimingRemainsSoleClockAuthority
  ) {
    errors.push(
      'Caption-to-Living-Frame timing request must remain semantic and preserve MasterTiming as the sole clock.',
    )
  }
  const style = request.styleRequest
  if (
    !isOpaqueId(style.captionStyleProfileId) ||
    style.captionStyleProfileVersion < 1 ||
    !isDigest(style.captionStyleProfileDigestSha256) ||
    style.approvedSemanticColorTokenIds.length === 0 ||
    !allOpaqueIds(
      style.approvedSemanticColorTokenIds,
    ) ||
    hasDuplicates(style.approvedSemanticColorTokenIds) ||
    !STYLE_MOTION_INTENTS.has(style.motionIntent) ||
    !REDUCED_MOTION_INTENTS.has(style.reducedMotionIntent) ||
    style.containsCssReactAssCommandsOrExecutablePrompt
  ) {
    errors.push(
      'Caption-to-Living-Frame style request must use approved semantic tokens without executable renderer or prompt text.',
    )
  }
}

function validateDependencies(
  request: CaptionLivingFrameRequest,
  errors: string[],
): void {
  const dependencies = request.dependencyRefs
  if (
    !isEvidenceRef(dependencies.layoutPlanRef) ||
    !isEvidenceRef(dependencies.occupancyManifestRef) ||
    (
      dependencies.visualAssetPlanRef &&
      !isEvidenceRef(dependencies.visualAssetPlanRef)
    ) ||
    (
      dependencies.depthPlanRef &&
      !isEvidenceRef(dependencies.depthPlanRef)
    ) ||
    (
      dependencies.maskManifestRef &&
      !isEvidenceRef(dependencies.maskManifestRef)
    ) ||
    dependencies.expectedLivingFrameComponentVersion !==
      CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
        .professionalSkillComponent ||
    dependencies.captionDirectionComponentVersion !==
      'caption-direction-contract-v1' ||
    !sameJson(
      dependencies.contractVersions,
      CAPTION_LIVING_FRAME_CONTRACT_VERSIONS,
    ) ||
    !sameJson(
      dependencies.publicTypeReceipt,
      CAPTION_LIVING_FRAME_PUBLIC_TYPE_RECEIPT,
    )
  ) {
    errors.push(
      'Caption-to-Living-Frame dependency versions or pinned public-type receipt are stale or incomplete.',
    )
  }
}

function validateFallbackSafetyAndPrivateScope(
  request: CaptionLivingFrameRequest,
  errors: string[],
): void {
  const fallback = request.fallbackPolicy
  const safety = request.accessibilityAndSafety
  const metadata = request.privateArtifactMetadata
  const estimate = request.estimateInputs
  if (
    fallback.orderedSteps.length === 0 ||
    hasDuplicates(fallback.orderedSteps) ||
    fallback.orderedSteps.some(
      (step) => !FALLBACK_STEPS.has(step),
    ) ||
    fallback.orderedSteps.some(
      (step) => !ACTIVE_NON_ILLUSTRATION_FALLBACK_STEPS.has(step),
    ) ||
    !fallback.orderedSteps.includes('captions_only') ||
    !fallback.captionRetainsOrRegainsInformationOwnership ||
    safety.qaExpectationCodes.length === 0 ||
    hasDuplicates(safety.qaExpectationCodes) ||
    safety.qaExpectationCodes.some(
      (code) => !QA_CODES.has(code),
    ) ||
    !safety.qaExpectationCodes.includes(
      'caption_safe_region_expected',
    ) ||
    !safety.qaExpectationCodes.includes(
      'semantic_timing_binding_required',
    ) ||
    !safety.qaExpectationCodes.includes(
      'attention_restoration_required',
    ) ||
    !isOpaqueId(safety.accessibleCaptionTrackId) ||
    !allOpaqueIds(safety.documentaryFactSafetyRefIds) ||
    hasDuplicates(safety.documentaryFactSafetyRefIds) ||
    !safety.completeAccessibleWordingRetained ||
    !safety.reducedMotionParityRequired ||
    safety.narrationProtection !== 'strict'
  ) {
    errors.push(
      'Caption-to-Living-Frame fallback and accessibility policy must preserve captions, timing, attention restoration, and narration.',
    )
  }
  const stale = metadata.stalenessRefs
  if (
    metadata.tenantScope.workspaceId !==
      request.canonicalScope.workspaceId ||
    metadata.tenantScope.projectId !==
      request.canonicalScope.projectId ||
    metadata.accessClass !== 'tenant_private' ||
    !RETENTION_CLASSES.has(metadata.retentionClass) ||
    !metadata.byteFreeRequest ||
    !REPLAY_POLICIES.has(metadata.replayPolicy) ||
    !ESTIMATE_COMPLEXITIES.has(
      estimate.requestedComplexityCeiling,
    ) ||
    !PREMIUM_EXPECTATIONS.has(
      estimate.premiumOperationPermissionExpectation,
    ) ||
    !LOWER_COST_PREFERENCES.has(
      estimate.lowerCostFallbackPreference,
    ) ||
    estimate.pricingOrBillingAuthorityProvided ||
    stale.transcriptDigestSha256 !==
      request.canonicalTranscriptRef.artifactDigestSha256 ||
    stale.captionPlanDigestSha256 !==
      request.captionPlanRef.captionDirectionPlanDigestSha256 ||
    stale.confirmedFrameDigestSha256 !==
      request.confirmedFrame.confirmedOutputFrameDigestSha256 ||
    stale.masterTimingDigestSha256 !==
      request.timingRequest.masterTimingDigestSha256 ||
    !isDigest(stale.layoutOccupancyDigestSha256) ||
    (
      request.createdForPhase === 'planning_draft' &&
      stale.approvedSnapshotDigestSha256 !== null
    ) ||
    (
      request.createdForPhase === 'approved_projection' &&
      stale.approvedSnapshotDigestSha256 !==
        request.immutableApprovedSnapshotRef.contentHash
    )
  ) {
    errors.push(
      'Caption-to-Living-Frame private-artifact metadata or staleness tuple does not match canonical request scope.',
    )
  }
}

function validateRequestAuthority(
  request: CaptionLivingFrameRequest,
  errors: string[],
): void {
  const authority = request.authority
  if (
    !authority.captionOwnsRequestShape ||
    !authority.livingFrameOwnsResponseAndExecution ||
    !authority.preapprovalIntentReservationOnly ||
    authority.operationAuthority ||
    authority.dispatchAuthority ||
    authority.providerAuthority ||
    authority.runtimeAuthority ||
    authority.assetCreationAuthority ||
    authority.qaApprovalAuthority ||
    authority.approvalAuthority ||
    authority.creditOrBillingAuthority ||
    authority.publicDeliveryAuthority ||
    authority.productionAuthority ||
    request.containsRawChatMediaBytesPathsUrlsCredentialsOrExecutableText
  ) {
    errors.push(
      'Caption-to-Living-Frame request grants forbidden execution, approval, commercial, artifact, or delivery authority.',
    )
  }
}

function validateResponseStaleness(
  request: CaptionLivingFrameRequest,
  response: LivingFrameCaptionDirectionResponse,
  errors: string[],
): void {
  const expected = request.privateArtifactMetadata.stalenessRefs
  const actual = response.staleness
  if (
    actual.transcriptDigestSha256 !==
      expected.transcriptDigestSha256 ||
    actual.captionPlanDigestSha256 !==
      expected.captionPlanDigestSha256 ||
    actual.confirmedFrameDigestSha256 !==
      expected.confirmedFrameDigestSha256 ||
    actual.layoutOccupancyDigestSha256 !==
      expected.layoutOccupancyDigestSha256 ||
    actual.masterTimingDigestSha256 !==
      expected.masterTimingDigestSha256 ||
    actual.approvedSnapshotDigestSha256 !==
      expected.approvedSnapshotDigestSha256 ||
    actual.livingFrameComponentVersion !==
      CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
        .professionalSkillComponent ||
    actual.selectedSceneBindingVersion !==
      CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
        .selectedSceneBinding
  ) {
    errors.push(
      'Living Frame response is stale against transcript, caption, frame, layout, timing, component, binding, or snapshot authority.',
    )
  }
}

function validateResponseDisposition(
  response: LivingFrameCaptionDirectionResponse,
  errors: string[],
): void {
  const dispositionIsSupported =
    [
      'supported_selected',
      'supported_simpler_treatment',
      'declined_not_applicable',
      'declined_caption_or_speaker_priority',
      'blocked_stale_authority',
      'blocked_missing_canonical_authority',
    ].includes(response.disposition)
  const supported =
    response.disposition === 'supported_selected' ||
    response.disposition ===
      'supported_simpler_treatment'
  const selected = response.selectedSceneResult
  const attentionKinds = response.attentionEvents.map(
    (event) => event.eventType,
  )
  if (!dispositionIsSupported) {
    errors.push(
      'Living Frame response disposition is unsupported.',
    )
  }
  if (
    supported &&
    (
      !response.professionalComponentRef ||
      response.professionalComponentRef.professionalSkillId !==
        CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
          .professionalSkillId ||
      response.professionalComponentRef.contractVersion !==
        CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
          .professionalSkillComponent ||
      !response.semanticProjectionRef ||
      !response.motionSpecRef ||
      !selected.selectedSceneAdmissionRef ||
      !selected.selectedSceneBindingRef ||
      selected.selectedSceneIds.length === 0 ||
      !allOpaqueIds(selected.selectedSceneIds) ||
      hasDuplicates(selected.selectedSceneIds) ||
      selected.selectedModes.some(
        (mode) => !LIVING_FRAME_MODES.has(mode),
      ) ||
      selected.selectedTreatments.some(
        (treatment) =>
          !SELECTED_SCENE_TREATMENTS.has(treatment),
      ) ||
      selected.selectedSceneIds.length !==
        selected.selectedModes.length ||
      selected.selectedSceneIds.length !==
        selected.selectedTreatments.length ||
      selected.deliberateNonUse ||
      selected.executionClaimed ||
      response.requestedInformationOwnerHandoff !==
        'caption_to_living_frame' ||
      response.fallbackResult
        .informationOwnerAfterDisposition !== 'living_frame' ||
      !attentionKinds.includes('handoff') ||
      !attentionKinds.includes('hold') ||
      !attentionKinds.includes('restore')
    )
  ) {
    errors.push(
      'Supported Living Frame response lacks selected-scene, semantic, ownership, or attention-restoration evidence.',
    )
  }
  if (
    !supported &&
    (
      selected.selectedSceneIds.length > 0 ||
      selected.selectedModes.length > 0 ||
      selected.selectedTreatments.length > 0 ||
      !selected.deliberateNonUse ||
      selected.executionClaimed ||
      response.requestedInformationOwnerHandoff !==
        'caption_retains_ownership' ||
      response.fallbackResult
        .informationOwnerAfterDisposition !== 'caption' ||
      !response.fallbackResult
        .captionRetainsOrRegainsInformationOwnership
    )
  ) {
    errors.push(
      'Declined or blocked Living Frame response must deliberately preserve Caption Direction information ownership.',
    )
  }
  const attentionIds = response.attentionEvents.map(
    (event) => event.attentionEventId,
  )
  const attentionOrders = response.attentionEvents.map(
    (event) => String(event.order),
  )
  if (
    hasDuplicates(attentionIds) ||
    hasDuplicates(attentionOrders)
  ) {
    errors.push(
      'Living Frame attention event identities and ordering must be unique.',
    )
  }
  for (const event of response.attentionEvents) {
    if (
      !isOpaqueId(event.attentionEventId) ||
      !Number.isInteger(event.order) ||
      event.order < 0 ||
      !ATTENTION_EVENT_TYPES.has(event.eventType) ||
      !ATTENTION_TARGETS.has(event.target) ||
      event.methods.length === 0 ||
      hasDuplicates(event.methods) ||
      event.methods.some(
        (method) => !ATTENTION_METHODS.has(method),
      ) ||
      !isSafeSummary(event.summary) ||
      event.exactFramesProvided
    ) {
      errors.push(
        `Living Frame attention event ${event.attentionEventId} is invalid or claims exact frames.`,
      )
    }
  }
}

function validateResponseOpaqueRefs(
  response: LivingFrameCaptionDirectionResponse,
  errors: string[],
): void {
  const refs: Array<{
    value:
      | {
        id: string
        schemaVersion: string
        version: number
        digestSha256: string
      }
      | undefined
    expectedSchemaVersion: string
  }> = [
    {
      value: response.professionalComponentRef,
      expectedSchemaVersion:
        CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
          .professionalSkillComponent,
    },
    {
      value: response.semanticProjectionRef,
      expectedSchemaVersion:
        CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
          .semanticPlanProjection,
    },
    {
      value: response.motionSpecRef,
      expectedSchemaVersion:
        CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
          .motionSpec,
    },
    {
      value:
        response.selectedSceneResult
          .selectedSceneAdmissionRef,
      expectedSchemaVersion:
        CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
          .selectedSceneAdmission,
    },
    {
      value:
        response.selectedSceneResult
          .selectedSceneBindingRef,
      expectedSchemaVersion:
        CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
          .selectedSceneBinding,
    },
    {
      value:
        response.timingDependencies
          .canonicalTimingBindingRef,
      expectedSchemaVersion:
        CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
          .timingBinding,
    },
    {
      value:
        response.estimateProjection
          .estimateProjectionRef,
      expectedSchemaVersion:
        CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
          .estimateWorkAssetProjection,
    },
    {
      value: response.workGraphProjectionRef,
      expectedSchemaVersion:
        CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
          .workGraphProjection,
    },
    {
      value: response.rendererPlanBindingRef,
      expectedSchemaVersion:
        CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
          .rendererPlanBinding,
    },
    {
      value: response.approvedLineageBindingRef,
      expectedSchemaVersion:
        CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
          .approvedLineageBinding,
    },
  ]
  if (
    refs.some(
      ({ value, expectedSchemaVersion }) =>
        value !== undefined &&
        !isOpaqueContractRef(
          value,
          expectedSchemaVersion,
        ),
    )
  ) {
    errors.push(
      'Living Frame response contains an invalid or stale opaque contract reference.',
    )
  }
}

function validateResponseTimingAndLayout(
  request: CaptionLivingFrameRequest,
  response: LivingFrameCaptionDirectionResponse,
  errors: string[],
): void {
  const timing = response.timingDependencies
  const layout = response.layoutDependencies
  if (
    response.motionSpecRef &&
    response.motionSpecRef.schemaVersion !==
      CAPTION_LIVING_FRAME_CONTRACT_VERSIONS.motionSpec
  ) {
    errors.push(
      'Living Frame response motion-spec reference is stale.',
    )
  }
  if (
    response.workGraphProjectionRef &&
    response.workGraphProjectionRef.schemaVersion !==
      CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
        .workGraphProjection
  ) {
    errors.push(
      'Living Frame response work-graph projection reference is stale.',
    )
  }
  if (
    response.rendererPlanBindingRef &&
    response.rendererPlanBindingRef.schemaVersion !==
      CAPTION_LIVING_FRAME_CONTRACT_VERSIONS
        .rendererPlanBinding
  ) {
    errors.push(
      'Living Frame response renderer-plan binding reference is stale.',
    )
  }
  if (
    timing.masterTimingPlanId !==
      request.timingRequest.masterTimingPlanId ||
    timing.masterTimingDigestSha256 !==
      request.timingRequest.masterTimingDigestSha256 ||
    !isSubset(
      timing.consumedStoryTimingEventIds,
      request.timingRequest.existingStoryTimingEventIds,
    ) ||
    !isSubset(
      timing.consumedStoryTimingCueIds,
      request.timingRequest.existingStoryTimingCueIds,
    ) ||
    timing.semanticTimingRequestIds.length === 0 ||
    !allOpaqueIds(
      timing.consumedStoryTimingEventIds,
    ) ||
    !allOpaqueIds(
      timing.consumedStoryTimingCueIds,
    ) ||
    !allOpaqueIds(
      timing.semanticTimingRequestIds,
    ) ||
    hasDuplicates(timing.consumedStoryTimingEventIds) ||
    hasDuplicates(timing.consumedStoryTimingCueIds) ||
    hasDuplicates(timing.semanticTimingRequestIds) ||
    timing.parallelClockCreated ||
    !timing.masterTimingRemainsSoleClockAuthority
  ) {
    errors.push(
      'Living Frame timing response created a parallel clock or substituted canonical StoryTiming/MasterTiming lineage.',
    )
  }
  if (
    layout.occupancyRegionIds.length === 0 ||
    layout.captionSafeExpectationRegionIds.length === 0 ||
    !allOpaqueIds(layout.occupancyRegionIds) ||
    !allOpaqueIds(
      layout.captionSafeExpectationRegionIds,
    ) ||
    !allOpaqueIds(
      layout.faceProtectionRegionIds,
    ) ||
    !allOpaqueIds(
      layout.gestureProtectionRegionIds,
    ) ||
    !allOpaqueIds(
      layout.maskArtifactDependencyIds,
    ) ||
    !allOpaqueIds(layout.unresolvedGateCodes) ||
    hasDuplicates(layout.occupancyRegionIds) ||
    hasDuplicates(layout.captionSafeExpectationRegionIds) ||
    hasDuplicates(layout.faceProtectionRegionIds) ||
    hasDuplicates(layout.gestureProtectionRegionIds) ||
    hasDuplicates(layout.depthBandNeeds) ||
    hasDuplicates(layout.maskArtifactDependencyIds) ||
    hasDuplicates(layout.unresolvedGateCodes) ||
    layout.depthBandNeeds.some(
      (need) => !DEPTH_BAND_NEEDS.has(need),
    ) ||
    !layout.captionPlaneRemainsAboveLivingFrame ||
    !layout
      .explicitStoryTimingBoundInformationHandoffRequiredForException
  ) {
    errors.push(
      'Living Frame response must preserve caption-safe occupancy and the caption plane unless an explicit timed handoff applies.',
    )
  }
  const qa = response.qaEvidenceRequirements
  const estimate = response.estimateProjection
  const fallback = response.fallbackResult
  if (
    !qa.captionSafeRegionRequired ||
    !qa.attentionRestorationRequired ||
    !qa.semanticTimingRequired ||
    !qa.visualDensityReviewRequired ||
    !qa.narrationProtectionRequired ||
    !qa.reducedMotionParityRequired ||
    qa.requiredQaCodes.length === 0 ||
    hasDuplicates(qa.requiredQaCodes) ||
    qa.requiredQaCodes.some((code) => !QA_CODES.has(code)) ||
    !ESTIMATE_COMPLEXITIES_WITH_NONE.has(
      estimate.requestedComplexity,
    ) ||
    !allOpaqueIds(estimate.requiredCapabilityKeys) ||
    !allOpaqueIds(estimate.requiredWorkCategories) ||
    hasDuplicates(estimate.requiredCapabilityKeys) ||
    hasDuplicates(estimate.requiredWorkCategories) ||
    !FALLBACK_STEPS.has(fallback.selectedTreatment) ||
    !ACTIVE_NON_ILLUSTRATION_FALLBACK_STEPS.has(
      fallback.selectedTreatment,
    ) ||
    fallback.evaluatedLadder.length === 0 ||
    hasDuplicates(fallback.evaluatedLadder) ||
    fallback.evaluatedLadder.some(
      (step) => !FALLBACK_STEPS.has(step),
    ) ||
    fallback.evaluatedLadder.some(
      (step) => !ACTIVE_NON_ILLUSTRATION_FALLBACK_STEPS.has(step),
    ) ||
    !fallback.evaluatedLadder.includes(
      fallback.selectedTreatment,
    ) ||
    estimate.pricingOrReservationDecisionProvided
  ) {
    errors.push(
      'Living Frame response lacks required QA evidence or improperly provides commercial authority.',
    )
  }
}

function validateResponseAuthority(
  response: LivingFrameCaptionDirectionResponse,
  errors: string[],
): void {
  const authority = response.authority
  if (
    authority.operationRegistered ||
    authority.dispatchGranted ||
    authority.providerAuthority ||
    authority.runtimeAuthority ||
    authority.assetCreatedOrApproved ||
    authority.qaApprovalGranted ||
    authority.publicDeliveryCreated ||
    authority.productionReady ||
    response.containsRawChatMediaBytesPathsUrlsCredentialsOrExecutableText
  ) {
    errors.push(
      'Living Frame response grants forbidden operation, dispatch, runtime, asset, QA, delivery, or production authority.',
    )
  }
}

const SEMANTIC_PURPOSES = new Set([
  'explain_relationship',
  'show_cause_and_effect',
  'demonstrate_operation',
  'organize_evidence',
  'establish_geography',
  'reinforce_key_concept',
] as const)
const VISUAL_VERBS = new Set([
  'reveal',
  'converge',
  'restrict',
  'surround',
  'expand',
  'contract',
  'connect',
  'separate',
  'rotate',
  'approach',
  'retreat',
  'transform',
  'hold',
] as const)
const RESERVATION_BOUNDARIES = new Set([
  'semantic_phrase',
  'story_beat',
  'scene',
] as const)
const RESERVATION_DURATIONS = new Set([
  'brief',
  'standard',
  'extended_for_comprehension',
] as const)
const PROTECTED_REGION_KINDS = new Set([
  'caption',
  'face',
  'gesture',
  'product',
  'map_label',
  'chart_label',
  'browser_highlight',
  'fact_safety_note',
] as const)
const SEMANTIC_START_INTENTS = new Set([
  'spoken_meaning_begins',
  'visual_introduction_requested',
] as const)
const SEMANTIC_HIT_INTENTS = new Set([
  'primary_motion_requested',
  'visual_resolution_requested',
] as const)
const SEMANTIC_EXIT_INTENTS = new Set([
  'visual_resolution_requested',
  'attention_return_requested',
] as const)
const STYLE_MOTION_INTENTS = new Set([
  'restrained',
  'moderate',
  'expressive',
] as const)
const REDUCED_MOTION_INTENTS = new Set([
  'static_hierarchy',
  'opacity_only',
  'direct_state_change',
] as const)
const FALLBACK_STEPS = new Set([
  'full_living_frame',
  'simplified_depth_composition',
  'safe_space_overlay',
  'lower_visual_stage',
  'side_by_side',
  'full_illustrated_scene',
  'static_card',
  'captions_only',
  'no_extra_visual',
] as const)
const ACTIVE_NON_ILLUSTRATION_FALLBACK_STEPS = new Set<CaptionLivingFrameFallbackStep>([
  'full_living_frame',
  'simplified_depth_composition',
  'safe_space_overlay',
  'lower_visual_stage',
  'side_by_side',
  'static_card',
  'captions_only',
  'no_extra_visual',
] as const)
const QA_CODES = new Set([
  'narrative_relevance_expected',
  'one_focal_primary_expected',
  'visual_density_restraint_expected',
  'caption_safe_region_expected',
  'face_safe_region_expected',
  'gesture_safe_region_expected',
  'continuity_comparison_required',
  'component_separability_required',
  'alpha_multi_background_qa_required',
  'temporal_mask_stability_required',
  'pivot_physics_qa_required',
  'semantic_timing_binding_required',
  'attention_restoration_required',
  'semantic_scale_truth_required',
  'narration_protection_required',
  'documentary_integrity_required',
  'exact_geography_verification_required',
  'exact_data_verification_required',
  'generated_video_restraint_required',
] as const)
const RETENTION_CLASSES = new Set([
  'planning_receipt_short_lived',
  'approved_private_artifact',
] as const)
const REPLAY_POLICIES = new Set([
  'same_digest_same_result',
  'reject_stale_or_changed_authority',
] as const)
const ESTIMATE_COMPLEXITIES = new Set([
  'low',
  'medium',
  'high',
] as const)
const ESTIMATE_COMPLEXITIES_WITH_NONE = new Set([
  'none',
  'low',
  'medium',
  'high',
] as const)
const PREMIUM_EXPECTATIONS = new Set([
  'not_expected',
  'expected_if_approved',
] as const)
const LOWER_COST_PREFERENCES = new Set([
  'prefer_simpler_treatment',
  'prefer_captions_only',
  'no_preference',
] as const)
const LIVING_FRAME_MODES = new Set([
  'living_a_roll',
  'living_still',
  'living_archive',
  'living_diagram',
  'hybrid_expansion',
] as const)
const SELECTED_SCENE_TREATMENTS = new Set([
  'use_full',
  'use_subtle',
  'use_simpler_treatment',
] as const)
const ATTENTION_EVENT_TYPES = new Set([
  'handoff',
  'hold',
  'restore',
] as const)
const ATTENTION_TARGETS = new Set([
  'speaker',
  'visual',
  'shared',
] as const)
const ATTENTION_METHODS = new Set([
  'focus_depth_expectation',
  'local_contrast_expectation',
  'camera_reframe_expectation',
  'camera_push_expectation',
  'motion_emphasis_expectation',
  'light_emphasis_expectation',
  'sound_emphasis_expectation',
] as const)
const DEPTH_BAND_NEEDS = new Set([
  'far_background',
  'mid_background',
  'subject_plane',
  'foreground',
] as const)

const ALLOWED_SAFETY_ASSERTION_KEYS =
  new Set([
    'containsrawtranscripttext',
    'containscssreactasscommandsorexecutableprompt',
    'containsrawchatmediabytespathsurlscredentialsorexecutabletext',
  ])

function hasCompleteClosedRequestSchema(
  value: unknown,
): value is CaptionLivingFrameRequest {
  if (!record(value)) return false
  const requiredTopLevel = [
    'schemaVersion',
    'requestId',
    'requestDigestSha256',
    'idempotencyKey',
    'createdForPhase',
    'canonicalScope',
    'captionPlanRef',
    'canonicalTranscriptRef',
    'semanticRequest',
    'confirmedFrame',
    'captionReservation',
    'timingRequest',
    'styleRequest',
    'dependencyRefs',
    'estimateInputs',
    'fallbackPolicy',
    'accessibilityAndSafety',
    'privateArtifactMetadata',
    'authority',
    'containsRawChatMediaBytesPathsUrlsCredentialsOrExecutableText',
  ]
  if (value.createdForPhase === 'approved_projection') {
    requiredTopLevel.push(
      'immutableApprovedSnapshotRef',
      'immutableSnapshotRereadAndDigestMatched',
    )
  }
  if (!exactKeys(value, requiredTopLevel)) return false
  const request = value as Record<string, unknown>
  const reservation = request.captionReservation
  const transcript = request.canonicalTranscriptRef
  const semantic = request.semanticRequest
  const timing = request.timingRequest
  const style = request.styleRequest
  const dependencies = request.dependencyRefs
  const fallback = request.fallbackPolicy
  const safety = request.accessibilityAndSafety
  const metadata = request.privateArtifactMetadata
  if (
    !record(reservation) ||
    !record(transcript) ||
    !record(semantic) ||
    !record(timing) ||
    !record(style) ||
    !record(dependencies) ||
    !record(fallback) ||
    !record(safety) ||
    !record(metadata)
  ) return false
  const reservedRegions = reservation.reservedRegions
  const protectedRegions = reservation.protectedRegions
  const publicTypeReceipt = dependencies.publicTypeReceipt
  if (
    !Array.isArray(transcript.sourceSegmentIds) ||
    !Array.isArray(transcript.semanticPhraseIds) ||
    !Array.isArray(transcript.exactSourceWordIds) ||
    !Array.isArray(semantic.sourceSemanticPhraseIds) ||
    !Array.isArray(semantic.exactSourceWordIds) ||
    !Array.isArray(reservedRegions) ||
    !Array.isArray(protectedRegions) ||
    !Array.isArray(reservation.fallbackRegionIds) ||
    !Array.isArray(timing.existingStoryTimingEventIds) ||
    !Array.isArray(timing.existingStoryTimingCueIds) ||
    !Array.isArray(style.approvedSemanticColorTokenIds) ||
    !Array.isArray(fallback.orderedSteps) ||
    !Array.isArray(safety.qaExpectationCodes) ||
    !Array.isArray(safety.documentaryFactSafetyRefIds) ||
    !record(publicTypeReceipt) ||
    !Array.isArray(publicTypeReceipt.publicTypeFiles)
  ) return false
  return exactKeys(request.canonicalScope, [
    'workspaceId',
    'projectId',
    'editSessionId',
    'handoffId',
    'planVersionId',
    'approvedSnapshotId',
  ]) &&
    exactKeys(request.captionPlanRef, [
      'captionDirectionPlanId',
      'captionDirectionPlanVersion',
      'captionDirectionPlanDigestSha256',
      'captionDirectionProjectionId',
      'captionDirectionProjectionVersion',
      'captionDirectionProjectionDigestSha256',
      'sceneGraphRef',
    ]) &&
    evidenceRefShape(
      (request.captionPlanRef as Record<string, unknown>).sceneGraphRef,
    ) &&
    exactKeys(transcript, [
      'artifactId',
      'artifactVersion',
      'artifactDigestSha256',
      'language',
      'sourceSegmentIds',
      'semanticPhraseIds',
      'exactSourceWordIds',
      'containsRawTranscriptText',
    ]) &&
    exactKeys(semantic, [
      'stableConceptId',
      'classification',
      'semanticPurpose',
      'visualVerbIntent',
      'sourceSemanticPhraseIds',
      'exactSourceWordIds',
      'informationOwnerBefore',
      'informationOwnerRequestedAfter',
      'noDuplicateVisibleInformationAfterTransfer',
      'restoreCaptionOwnershipOnFailureOrExit',
    ]) &&
    exactKeys(request.confirmedFrame, [
      'outputId',
      'width',
      'height',
      'aspectRatio',
      'aspectRatioNumerator',
      'aspectRatioDenominator',
      'confirmedOutputFrameDigestSha256',
      'userConfirmed',
      'silentlyInferredOrSubstituted',
    ]) &&
    exactKeys(reservation, [
      'reservedRegions',
      'captionPlanePriority',
      'protectedRegions',
      'desiredReservationBoundary',
      'desiredReservationDurationIntent',
      'fallbackRegionIds',
    ]) &&
    reservedRegions.every((region) =>
      exactKeys(region, [
        'regionId',
        'normalizedBox',
        'pixelBox',
        'regionDigestSha256',
      ]) &&
      record(region) &&
      exactKeys(region.normalizedBox, ['x', 'y', 'width', 'height']) &&
      exactKeys(region.pixelBox, ['x', 'y', 'width', 'height'])) &&
    protectedRegions.every((region) =>
      exactKeys(region, ['regionId', 'kind', 'regionDigestSha256'])) &&
    exactKeys(timing, [
      'masterTimingPlanId',
      'masterTimingDigestSha256',
      'storyTimingPlanId',
      'storyTimingDigestSha256',
      'existingStoryTimingEventIds',
      'existingStoryTimingCueIds',
      'semanticStartIntent',
      'semanticHitIntent',
      'semanticHoldIntent',
      'semanticExitIntent',
      'captionDirectionAssignsFinalLivingFrameFrames',
      'masterTimingRemainsSoleClockAuthority',
    ]) &&
    exactKeys(style, [
      'captionStyleProfileId',
      'captionStyleProfileVersion',
      'captionStyleProfileDigestSha256',
      'approvedSemanticColorTokenIds',
      'motionIntent',
      'reducedMotionIntent',
      'containsCssReactAssCommandsOrExecutablePrompt',
    ]) &&
    exactKeys(
      dependencies,
      [
        'layoutPlanRef',
        'occupancyManifestRef',
        'expectedLivingFrameComponentVersion',
        'captionDirectionComponentVersion',
        'contractVersions',
        'publicTypeReceipt',
      ],
      ['visualAssetPlanRef', 'depthPlanRef', 'maskManifestRef'],
    ) &&
    [
      dependencies.layoutPlanRef,
      dependencies.occupancyManifestRef,
      dependencies.visualAssetPlanRef,
      dependencies.depthPlanRef,
      dependencies.maskManifestRef,
    ].filter((ref) => ref !== undefined).every(evidenceRefShape) &&
    exactContractVersionsShape(dependencies.contractVersions) &&
    exactKeys(publicTypeReceipt, [
      'schemaVersion',
      'repository',
      'branch',
      'commitSha',
      'publicTypeFiles',
      'publicTypesMergedIntoActiveCheckout',
      'structuralCompatibilityOnly',
      'serverImplementationImported',
    ]) &&
    publicTypeReceipt.publicTypeFiles.every((file) =>
      exactKeys(file, ['path', 'gitBlobSha', 'fileDigestSha256'])) &&
    exactKeys(request.estimateInputs, [
      'requestedComplexityCeiling',
      'premiumOperationPermissionExpectation',
      'lowerCostFallbackPreference',
      'pricingOrBillingAuthorityProvided',
    ]) &&
    exactKeys(fallback, [
      'orderedSteps',
      'captionRetainsOrRegainsInformationOwnership',
      'structuralFailureRequiresReview',
    ]) &&
    exactKeys(safety, [
      'qaExpectationCodes',
      'accessibleCaptionTrackId',
      'completeAccessibleWordingRetained',
      'reducedMotionRequired',
      'reducedMotionParityRequired',
      'documentaryFactSafetyRefIds',
      'narrationProtection',
    ]) &&
    exactKeys(metadata, [
      'tenantScope',
      'retentionClass',
      'accessClass',
      'byteFreeRequest',
      'replayPolicy',
      'stalenessRefs',
    ]) &&
    exactKeys(metadata.tenantScope, ['workspaceId', 'projectId']) &&
    exactKeys(metadata.stalenessRefs, [
      'transcriptDigestSha256',
      'captionPlanDigestSha256',
      'confirmedFrameDigestSha256',
      'layoutOccupancyDigestSha256',
      'masterTimingDigestSha256',
      'approvedSnapshotDigestSha256',
    ]) &&
    exactKeys(request.authority, [
      'captionOwnsRequestShape',
      'livingFrameOwnsResponseAndExecution',
      'preapprovalIntentReservationOnly',
      'operationAuthority',
      'dispatchAuthority',
      'providerAuthority',
      'runtimeAuthority',
      'assetCreationAuthority',
      'qaApprovalAuthority',
      'approvalAuthority',
      'creditOrBillingAuthority',
      'publicDeliveryAuthority',
      'productionAuthority',
    ]) &&
    (
      value.createdForPhase !== 'approved_projection' ||
      evidenceRefShape(value.immutableApprovedSnapshotRef)
    )
}

function hasCompleteClosedResponseSchema(
  value: unknown,
): value is LivingFrameCaptionDirectionResponse {
  if (!record(value)) return false
  if (!exactKeys(
    value,
    [
      'schemaVersion',
      'responseId',
      'responseDigestSha256',
      'originalRequestId',
      'originalRequestDigestSha256',
      'idempotencyKey',
      'canonicalScope',
      'disposition',
      'reasonCode',
      'safeUserFacingSummary',
      'selectedSceneResult',
      'requestedInformationOwnerHandoff',
      'attentionEvents',
      'timingDependencies',
      'layoutDependencies',
      'estimateProjection',
      'fallbackResult',
      'qaEvidenceRequirements',
      'staleness',
      'authority',
      'containsRawChatMediaBytesPathsUrlsCredentialsOrExecutableText',
    ],
    [
      'professionalComponentRef',
      'semanticProjectionRef',
      'motionSpecRef',
      'workGraphProjectionRef',
      'rendererPlanBindingRef',
      'approvedLineageBindingRef',
    ],
  )) return false
  const response = value as Record<string, unknown>
  const selected = response.selectedSceneResult
  const timing = response.timingDependencies
  const layout = response.layoutDependencies
  const estimate = response.estimateProjection
  const fallback = response.fallbackResult
  const qa = response.qaEvidenceRequirements
  if (
    !record(selected) ||
    !record(timing) ||
    !record(layout) ||
    !record(estimate) ||
    !record(fallback) ||
    !record(qa) ||
    !Array.isArray(response.attentionEvents) ||
    !Array.isArray(selected.selectedSceneIds) ||
    !Array.isArray(selected.selectedModes) ||
    !Array.isArray(selected.selectedTreatments) ||
    !Array.isArray(timing.consumedStoryTimingEventIds) ||
    !Array.isArray(timing.consumedStoryTimingCueIds) ||
    !Array.isArray(timing.semanticTimingRequestIds) ||
    !Array.isArray(layout.occupancyRegionIds) ||
    !Array.isArray(layout.captionSafeExpectationRegionIds) ||
    !Array.isArray(layout.faceProtectionRegionIds) ||
    !Array.isArray(layout.gestureProtectionRegionIds) ||
    !Array.isArray(layout.depthBandNeeds) ||
    !Array.isArray(layout.maskArtifactDependencyIds) ||
    !Array.isArray(layout.unresolvedGateCodes) ||
    !Array.isArray(estimate.requiredCapabilityKeys) ||
    !Array.isArray(estimate.requiredWorkCategories) ||
    !Array.isArray(fallback.evaluatedLadder) ||
    !Array.isArray(qa.requiredQaCodes)
  ) return false
  const optionalContractRefs = [
    response.semanticProjectionRef,
    response.motionSpecRef,
    response.workGraphProjectionRef,
    response.rendererPlanBindingRef,
    response.approvedLineageBindingRef,
    selected.selectedSceneAdmissionRef,
    selected.selectedSceneBindingRef,
    timing.canonicalTimingBindingRef,
    estimate.estimateProjectionRef,
  ].filter((ref) => ref !== undefined)
  return exactKeys(response.canonicalScope, [
    'workspaceId',
    'projectId',
    'editSessionId',
    'handoffId',
    'planVersionId',
    'approvedSnapshotId',
  ]) &&
    (
      response.professionalComponentRef === undefined ||
      exactKeys(response.professionalComponentRef, [
        'id',
        'schemaVersion',
        'version',
        'digestSha256',
        'professionalSkillId',
        'contractVersion',
      ])
    ) &&
    optionalContractRefs.every(contractRefShape) &&
    exactKeys(
      selected,
      [
        'selectedSceneIds',
        'selectedModes',
        'selectedTreatments',
        'deliberateNonUse',
        'executionClaimed',
      ],
      ['selectedSceneAdmissionRef', 'selectedSceneBindingRef'],
    ) &&
    response.attentionEvents.every((event) =>
      exactKeys(event, [
        'attentionEventId',
        'order',
        'eventType',
        'target',
        'methods',
        'summary',
        'exactFramesProvided',
      ]) &&
      record(event) &&
      Array.isArray(event.methods)) &&
    exactKeys(
      timing,
      [
        'masterTimingPlanId',
        'masterTimingDigestSha256',
        'consumedStoryTimingEventIds',
        'consumedStoryTimingCueIds',
        'semanticTimingRequestIds',
        'parallelClockCreated',
        'masterTimingRemainsSoleClockAuthority',
      ],
      ['canonicalTimingBindingRef'],
    ) &&
    exactKeys(layout, [
      'occupancyRegionIds',
      'captionSafeExpectationRegionIds',
      'faceProtectionRegionIds',
      'gestureProtectionRegionIds',
      'depthBandNeeds',
      'occlusionNeeded',
      'captionPlaneRemainsAboveLivingFrame',
      'explicitStoryTimingBoundInformationHandoffRequiredForException',
      'maskArtifactDependencyIds',
      'unresolvedGateCodes',
    ]) &&
    exactKeys(
      estimate,
      [
        'requestedComplexity',
        'requiredCapabilityKeys',
        'requiredWorkCategories',
        'pricingOrReservationDecisionProvided',
      ],
      ['estimateProjectionRef'],
    ) &&
    exactKeys(fallback, [
      'selectedTreatment',
      'evaluatedLadder',
      'informationOwnerAfterDisposition',
      'captionRetainsOrRegainsInformationOwnership',
    ]) &&
    exactKeys(qa, [
      'captionSafeRegionRequired',
      'attentionRestorationRequired',
      'semanticTimingRequired',
      'visualDensityReviewRequired',
      'narrationProtectionRequired',
      'documentaryFactSafetyRequired',
      'reducedMotionParityRequired',
      'privateArtifactReviewRequired',
      'requiredQaCodes',
    ]) &&
    exactKeys(response.staleness, [
      'transcriptDigestSha256',
      'captionPlanDigestSha256',
      'confirmedFrameDigestSha256',
      'layoutOccupancyDigestSha256',
      'masterTimingDigestSha256',
      'livingFrameComponentVersion',
      'selectedSceneBindingVersion',
      'approvedSnapshotDigestSha256',
    ]) &&
    exactKeys(response.authority, [
      'operationRegistered',
      'dispatchGranted',
      'providerAuthority',
      'runtimeAuthority',
      'assetCreatedOrApproved',
      'qaApprovalGranted',
      'publicDeliveryCreated',
      'productionReady',
    ])
}

function evidenceRefShape(value: unknown): boolean {
  return exactKeys(value, ['id', 'version', 'contentHash'])
}

function contractRefShape(value: unknown): boolean {
  return exactKeys(value, [
    'id',
    'schemaVersion',
    'version',
    'digestSha256',
  ])
}

function exactContractVersionsShape(value: unknown): boolean {
  return exactKeys(value, [
    'professionalSkillId',
    'professionalSkillComponent',
    'semanticPlanProjection',
    'selectedSceneAdmission',
    'selectedSceneBinding',
    'selectedSceneBindingComponentKey',
    'timingBinding',
    'timingBindingComponentKey',
    'motionSpec',
    'motionProfile',
    'estimateWorkAssetProjection',
    'estimateWorkAssetProjectionComponentKey',
    'workGraphProjection',
    'workGraphProjectionComponentKey',
    'rendererPlanBinding',
    'approvedLineageBinding',
  ])
}

function exactKeys(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean {
  if (!record(value)) return false
  const keys = Object.getOwnPropertyNames(value)
  const allowed = new Set([...required, ...optional])
  return required.every((key) =>
    Object.prototype.hasOwnProperty.call(value, key)) &&
    keys.every((key) => allowed.has(key))
}

function containsUnsafeSerializedBoundaryData(
  value: unknown,
  seen = new WeakSet<object>(),
): boolean {
  if (typeof value === 'string') {
    return /(?:https?:\/\/|file:|javascript:|\$\(|`|&&|\|\||#!)/i
      .test(value)
  }
  if (
    value === null ||
    typeof value !== 'object'
  ) {
    return false
  }
  if (
    ArrayBuffer.isView(value) ||
    value instanceof ArrayBuffer
  ) {
    return true
  }
  if (seen.has(value)) {
    return true
  }
  seen.add(value)
  if (Array.isArray(value)) {
    return value.some((child) =>
      containsUnsafeSerializedBoundaryData(
        child,
        seen,
      ))
  }
  return Object.entries(
    value as Record<string, unknown>,
  ).some(([key, child]) => {
    const normalizedKey =
      key.toLowerCase().replace(/[^a-z0-9]/g, '')
    const unsafeKey =
      !ALLOWED_SAFETY_ASSERTION_KEYS.has(
        normalizedKey,
      ) &&
      (
        normalizedKey.includes('rawchat') ||
        normalizedKey.includes(
          'rawtranscript',
        ) ||
        normalizedKey.includes('mediabytes') ||
        normalizedKey.includes(
          'credential',
        ) ||
        normalizedKey.includes(
          'executabletext',
        ) ||
        normalizedKey === 'command' ||
        normalizedKey === 'commands' ||
        normalizedKey === 'url' ||
        normalizedKey === 'urls'
      )
    return (
      unsafeKey ||
      containsUnsafeSerializedBoundaryData(
        child,
        seen,
      )
    )
  })
}

function isEvidenceRef(value: {
  id: string
  version: number
  schemaVersion?: string
  contentHash?: string
} | undefined): boolean {
  return Boolean(
    value &&
    isOpaqueId(value.id) &&
    Number.isInteger(value.version) &&
    value.version >= 1 &&
    value.contentHash &&
    isDigest(value.contentHash),
  )
}

function isOpaqueContractRef(
  value: {
    id: string
    schemaVersion: string
    version: number
    digestSha256: string
  },
  expectedSchemaVersion: string,
): boolean {
  return (
    isOpaqueId(value.id) &&
    value.schemaVersion ===
      expectedSchemaVersion &&
    Number.isInteger(value.version) &&
    value.version >= 1 &&
    isDigest(value.digestSha256)
  )
}

function isNormalizedBox(box: BoundingBox): boolean {
  return (
    [box.x, box.y, box.width, box.height].every(Number.isFinite) &&
    box.x >= 0 &&
    box.y >= 0 &&
    box.width > 0 &&
    box.height > 0 &&
    box.x + box.width <= 1.000001 &&
    box.y + box.height <= 1.000001
  )
}

function isPixelBox(
  box: BoundingBox,
  width: number,
  height: number,
): boolean {
  return (
    [box.x, box.y, box.width, box.height].every(Number.isFinite) &&
    box.x >= 0 &&
    box.y >= 0 &&
    box.width > 0 &&
    box.height > 0 &&
    box.x + box.width <= width &&
    box.y + box.height <= height
  )
}

function isOpaqueId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9:._-]{1,255}$/.test(value) &&
    !value.includes('..') &&
    !/(?:secret|token|credential|signature|x-goog)/i.test(value)
}

function isDigest(value: string): boolean {
  return /^sha256:[a-f0-9]{64}$/.test(value)
}

function isSafeSummary(value: string): boolean {
  return value.trim().length > 0 &&
    value.length <= 400 &&
    ![...value].some((character) => {
      const code = character.codePointAt(0) ?? 0
      return code < 32 || code === 127
    })
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length
}

function allOpaqueIds(
  values: readonly string[],
): boolean {
  return values.every(isOpaqueId)
}

function isSubset(
  candidate: readonly string[],
  allowed: readonly string[],
): boolean {
  return candidate.every((value) => allowed.includes(value))
}

function sameScope(
  left: CaptionLivingFrameRequest['canonicalScope'],
  right: CaptionLivingFrameRequest['canonicalScope'],
): boolean {
  return (
    left.workspaceId === right.workspaceId &&
    left.projectId === right.projectId &&
    left.editSessionId === right.editSessionId &&
    left.handoffId === right.handoffId &&
    left.planVersionId === right.planVersionId &&
    left.approvedSnapshotId === right.approvedSnapshotId
  )
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function digestBoundaryObject(
  value: object,
  digestKey: string,
): string {
  try {
    if (!validateClosedContractTree(value).ok) {
      return INVALID_LIVING_FRAME_BOUNDARY_DIGEST
    }
    const digestable = {
      ...value,
      [digestKey]: null,
    }
    return `sha256:${sha256HexUtf8(
      JSON.stringify(canonicalize(digestable)),
    )}`
  } catch {
    return INVALID_LIVING_FRAME_BOUNDARY_DIGEST
  }
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!record(value)) return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => compareUtf16Lexical(left, right))
      .map(([key, nested]) => [key, canonicalize(nested)]),
  )
}

function record(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
