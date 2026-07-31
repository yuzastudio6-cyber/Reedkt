import type {
  LivingFrameAttentionEventType,
  LivingFrameAttentionMethod,
  LivingFrameScenePlan,
  LivingFrameTimingPhase,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_ATTENTION_SOUNDSYNC_INTEGRATION_CLASS,
  LIVING_FRAME_ATTENTION_SOUNDSYNC_INTEGRATION_STATE,
  LIVING_FRAME_ATTENTION_SOUNDSYNC_INTEGRATION_VERSION,
  LIVING_FRAME_ATTENTION_SOUNDSYNC_OPEN_GATES,
  type LivingFrameAttentionMethodResolution,
  type LivingFrameAttentionResolvedMotionTrack,
  type LivingFrameAttentionSoundSyncIntegration,
  type LivingFrameAttentionSoundSyncIntegrationAuthority,
  type LivingFrameAttentionSoundSyncIntegrationDraft,
  type LivingFrameExactAttentionEventBinding,
  type LivingFrameSoundSyncSemanticCueRequest,
} from '../../src/types/living-frame-attention-soundsync-integration'
import type {
  CanonicalLivingFrameMotionSpec,
  CanonicalLivingFrameMotionTrack,
} from '../../src/types/living-frame-canonical-motion'
import type {
  LivingFrameChoreographyBinding,
} from '../../src/types/living-frame-choreography-binding'
import type {
  CanonicalLivingFrameExecutionRequirements,
} from '../../src/types/living-frame-execution-requirements'
import type {
  LivingFrameOwnerScopeAmendment,
} from '../../src/types/living-frame-owner-scope-amendment'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  LivingFrameSelectedSceneAdmission,
} from '../../src/types/living-frame-selected-scene-admission'
import type {
  LivingFrameSemanticPlanProjection,
} from '../../src/types/living-frame-semantic-plan-projection'
import type {
  CanonicalLivingFrameFrameRange,
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyCanonicalLivingFrameMotionSpec,
} from './canonical-living-frame-motion'
import {
  verifyCanonicalLivingFrameSelectedSceneBinding,
} from './canonical-living-frame-selected-scene-binding'
import {
  verifyCanonicalLivingFrameTimingBinding,
} from './canonical-living-frame-timing-binding'
import {
  verifyLivingFrameChoreographyBindingDigest,
} from './living-frame-choreography-binding'
import {
  verifyLivingFrameOwnerScopeAmendment,
} from './living-frame-owner-scope-amendment'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const ATTENTION_PHASE: Readonly<
  Record<LivingFrameAttentionEventType, LivingFrameTimingPhase>
> = Object.freeze({
  prepare: 'prepare',
  handoff: 'activate',
  hold: 'demonstrate',
  restore: 'resolve',
  transition_away: 'resolve',
})

const PAUSED_MOTION_SKILLS = new Set([
  'animation_aware_illustration',
  'component_rigging',
  'mechanical_part_motion',
  'deformation_motion',
])

const AUTHORITY_BOUNDARY:
  LivingFrameAttentionSoundSyncIntegrationAuthority =
  Object.freeze({
    readOnlyIntegrationCandidateAuthority: true,
    planningAuthority: false,
    selectedSceneAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    soundAssetAuthority: false,
    soundMixAuthority: false,
    narrationDuckingAuthority: false,
    rendererAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workGraphAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameAttentionSoundSyncIntegrationInput {
  readonly integrationId: string
  readonly sceneId: string
  readonly ownerScopeAmendment:
    LivingFrameOwnerScopeAmendment
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly canonicalTimingBinding:
    CanonicalLivingFrameTimingBinding
  readonly choreographyBinding:
    LivingFrameChoreographyBinding
  readonly canonicalMotionSpecs:
    readonly CanonicalLivingFrameMotionSpec[]
  readonly components: CanonicalPlanComponentsInput
}

interface IndexedMotionTrack {
  readonly spec: CanonicalLivingFrameMotionSpec
  readonly track: CanonicalLivingFrameMotionTrack
}

export async function compileLivingFrameAttentionSoundSyncIntegration(
  input: CompileLivingFrameAttentionSoundSyncIntegrationInput,
): Promise<LivingFrameAttentionSoundSyncIntegration> {
  assertInput(input)
  if (!verifyLivingFrameOwnerScopeAmendment(
    input.ownerScopeAmendment,
  )) throw invalid('Owner scope amendment is invalid.')
  const selectedVerification =
    await verifyCanonicalLivingFrameSelectedSceneBinding({
      binding: input.publication.binding,
      components: input.components,
      semanticPlanProjection:
        input.publication.semanticPlanProjection as
          LivingFrameSemanticPlanProjection,
      admission: input.publication.admission as
        LivingFrameSelectedSceneAdmission,
    })
  if (!selectedVerification.ok) {
    throw invalid('Selected-scene publication is invalid or stale.')
  }
  if (!verifyCanonicalLivingFrameTimingBinding({
    timingBinding: input.canonicalTimingBinding,
    publication: input.publication,
    requirements: input.requirements,
    components: input.components,
  })) throw invalid('Canonical timing binding is invalid or stale.')
  if (!verifyLivingFrameChoreographyBindingDigest(
    input.choreographyBinding,
  )) throw invalid('Living Frame choreography binding is invalid.')

  const scene = selectedVerification.binding.selectedComponent
    .scenePlans.find((candidate) =>
      candidate.sceneId === input.sceneId)
  const timingScene = input.canonicalTimingBinding.scenes
    .find((candidate) => candidate.sceneId === input.sceneId)
  if (
    !scene
    || !timingScene
    || input.choreographyBinding.sceneId !== input.sceneId
  ) throw invalid('Attention integration scene lineage is invalid.')
  assertActiveOwnerScope(scene)
  assertSourceLineage(input, scene)

  const motionSpecs = indexAndVerifyMotionSpecs({
    scene,
    timingBinding: input.canonicalTimingBinding,
    publication: input.publication,
    specs: input.canonicalMotionSpecs,
  })
  const indexedTracks = [...motionSpecs.values()]
    .flatMap((spec) => spec.tracks.map((track) => ({ spec, track })))
  assertPausedSubjectsAreNotAnimated(scene, indexedTracks)

  const attentionJourney = compileAttentionJourney({
    scene,
    timingScene,
    choreography: input.choreographyBinding,
    indexedTracks,
  })
  const localContrastPrimitiveRequests = attentionJourney
    .flatMap((event) => event.methodResolutions)
    .filter((method) =>
      method.rendererPrimitiveRequestId !== null)
    .map((method) => {
      const event = attentionJourney.find((candidate) =>
        candidate.methodResolutions.includes(method))!
      return {
        rendererPrimitiveRequestId:
          method.rendererPrimitiveRequestId!,
        attentionEventId: event.attentionEventId,
        target: event.target,
        frameRange: event.frameRange,
        styleProfileMustResolveExactStrength: true as const,
        localContrastCannotBeSilentlyReplacedWithBlur: true as const,
        exactRendererValuesProvided: false as const,
      }
    })
  const semanticScaleBindings = scene.semanticScaleRequests.map(
    (request) => {
      const spec = motionSpecs.get(request.componentId)
      if (!spec) throw invalid('Semantic scale component motion is missing.')
      const demonstrate = exactPhaseRange(
        timingScene.semanticPhaseBindings,
        'demonstrate',
      )
      const scaleTracks = spec.tracks.filter((track) =>
        track.target === 'layer'
        && track.property === 'scale_uniform')
      const allUnitScale = scaleTracks.every((track) =>
        track.keyframes.every((keyframe) => keyframe.value === 1))
      let treatment:
        LivingFrameAttentionSoundSyncIntegrationDraft[
          'semanticScaleBindings'
        ][number]['treatment']
      if (request.mode === 'literal_physical') {
        if (
          request.factualGuard !==
            'literal_relationship_must_be_preserved'
          || !allUnitScale
        ) throw invalid('Literal semantic scale was distorted.')
        treatment = 'literal_relationship_preserved_at_unit_scale'
      } else if (request.mode === 'data_proportional') {
        if (
          request.factualGuard !==
            'data_proportions_must_be_preserved'
          || !allUnitScale
        ) throw invalid('Data-proportional semantic scale was distorted.')
        treatment = 'data_proportion_preserved_at_unit_scale'
      } else if (request.mode === 'perspective') {
        if (
          request.factualGuard !== 'perspective_only'
          || scaleTracks.length === 0
          || allUnitScale
        ) throw invalid('Perspective semantic scale lacks exact motion.')
        treatment = 'perspective_scale_candidate'
      } else {
        if (
          request.factualGuard !==
            'symbolic_treatment_must_be_disclosed'
          || scaleTracks.length === 0
          || allUnitScale
        ) throw invalid('Editorial semantic scale lacks disclosed motion.')
        treatment = 'disclosed_editorial_symbolic_scale_candidate'
      }
      return {
        semanticScaleRequestId: request.semanticScaleRequestId,
        componentId: request.componentId,
        mode: request.mode,
        meaning: request.meaning,
        factualGuard: request.factualGuard,
        evaluationPhase: 'demonstrate' as const,
        evaluationFrameRange: demonstrate.frameRange,
        scaleTrackIds: scaleTracks.map((track) => track.trackId).sort(),
        treatment,
        factualRelationshipPreservedByCandidate: true as const,
        downstreamFactQaStillRequired: true as const,
      }
    },
  )
  const cameraAttentionIds = new Set(
    attentionJourney
      .filter((event) => event.methodResolutions.some((method) =>
        method.method === 'camera_push_expectation'
        || method.method === 'camera_reframe_expectation'))
      .map((event) => event.attentionEventId),
  )
  const cameraBindings = indexedTracks
    .filter(({ track }) => track.target === 'virtual_camera')
    .map(({ spec, track }) => {
      if (![
        'position_x_normalized',
        'position_y_normalized',
        'scale_uniform',
      ].includes(track.property)) {
        throw invalid('Unsupported virtual camera property.')
      }
      return {
        cameraBindingId: safeDerivedId('lf-camera-binding', {
          spec: spec.motionSpecDigestSha256,
          track: track.trackId,
        }),
        motionSpecDigestSha256: spec.motionSpecDigestSha256,
        trackId: track.trackId,
        property: track.property as
          'position_x_normalized'
          | 'position_y_normalized'
          | 'scale_uniform',
        sceneFrameRange: frameRange(
          spec.sceneStartFrame,
          spec.sceneEndFrameExclusive,
        ),
        linkedAttentionEventIds: [...cameraAttentionIds].sort(),
        returnsToInitialValue:
          track.keyframes[0]!.value ===
          track.keyframes[track.keyframes.length - 1]!.value,
        exactFramesDerivedFromCanonicalMasterTiming: true as const,
      }
    })
  if (
    cameraAttentionIds.size > 0
    && cameraBindings.length === 0
  ) throw invalid('Requested camera attention lacks canonical motion.')

  const soundSyncRequests = compileSoundRequests({
    scene,
    attentionJourney,
    choreography: input.choreographyBinding,
    motionSpecs,
  })
  const metrics = {
    attentionEventCount: attentionJourney.length,
    motionBoundAttentionMethodCount: attentionJourney.reduce(
      (total, event) => total + event.methodResolutions.filter(
        (method) => method.resolution === 'canonical_motion_v3_tracks',
      ).length,
      0,
    ),
    localContrastPrimitiveRequestCount:
      localContrastPrimitiveRequests.length,
    soundEmphasisMethodCount: attentionJourney.reduce(
      (total, event) => total + event.methodResolutions.filter(
        (method) => method.resolution === 'semantic_soundsync_request',
      ).length,
      0,
    ),
    semanticScaleBindingCount: semanticScaleBindings.length,
    cameraTrackCount: cameraBindings.length,
    soundSyncRequestCount: soundSyncRequests.length,
  }
  const draft: LivingFrameAttentionSoundSyncIntegrationDraft = {
    contractVersion:
      LIVING_FRAME_ATTENTION_SOUNDSYNC_INTEGRATION_VERSION,
    resultClass:
      LIVING_FRAME_ATTENTION_SOUNDSYNC_INTEGRATION_CLASS,
    integrationState:
      LIVING_FRAME_ATTENTION_SOUNDSYNC_INTEGRATION_STATE,
    integrationId: input.integrationId,
    canonicalScope: {
      workspaceId:
        selectedVerification.binding.identity.workspaceId,
      projectId:
        selectedVerification.binding.identity.projectId,
      editSessionId:
        selectedVerification.binding.identity.editSessionId,
      sceneId: scene.sceneId,
    },
    sourceBindings: {
      ownerScopeAmendmentDigestSha256:
        input.ownerScopeAmendment.amendmentDigestSha256,
      selectedSceneBindingDigestSha256:
        selectedVerification.binding.bindingDigestSha256,
      executionRequirementsDigestSha256:
        input.requirements.requirementsDigestSha256,
      canonicalTimingBindingDigestSha256:
        input.canonicalTimingBinding.timingBindingDigestSha256,
      choreographyBindingDigestSha256:
        input.choreographyBinding.bindingDigestSha256,
      currentMasterTimingDigestSha256:
        input.canonicalTimingBinding.sourceBindings
          .currentMasterTimingDigestSha256,
      currentSoundSyncDigestSha256:
        input.canonicalTimingBinding.sourceBindings
          .currentSoundSyncDigestSha256,
      confirmedOutputFrameDigestSha256:
        input.canonicalTimingBinding.sourceBindings
          .confirmedOutputFrameDigestSha256,
      canonicalMotionSpecDigestsSha256:
        [...motionSpecs.values()]
          .map((spec) => spec.motionSpecDigestSha256)
          .sort(),
    },
    attentionJourney,
    localContrastPrimitiveRequests,
    semanticScaleBindings,
    cameraBindings,
    soundSyncRequests,
    metrics,
    attentionOrderAndCanonicalPhaseAlignmentVerified: true,
    focusHandoffRestorePolicyVerified: true,
    literalAndDataScaleTruthPreserved: true,
    pausedLivingCharacterAndMechanicalRiggingExcluded: true,
    semanticSoundTriggersCarryExactAttentionAndMotionLineage: true,
    canonicalRendererResolutionPending:
      localContrastPrimitiveRequests.length > 0,
    canonicalSoundSyncResolutionPending:
      soundSyncRequests.length > 0,
    activePrivateInternalReady: false,
    openGateCodes: [...LIVING_FRAME_ATTENTION_SOUNDSYNC_OPEN_GATES],
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsRawChatTranscriptCaptionAudioMediaBytesPathsUrlsPromptsCredentialsCommandsOrEnvironment:
      false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    artifactCreated: false,
    canonicalQaApproved: false,
    privateReviewApproved: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    integrationDigestSha256: sha256AuthorityValue(draft),
  })
}

export async function verifyLivingFrameAttentionSoundSyncIntegration(
  value: unknown,
  input: CompileLivingFrameAttentionSoundSyncIntegrationInput,
): Promise<boolean> {
  if (
    !isRecord(value)
    || !SHA256.test(String(value.integrationDigestSha256))
  ) return false
  try {
    const expected =
      await compileLivingFrameAttentionSoundSyncIntegration(input)
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function compileAttentionJourney(input: {
  readonly scene: LivingFrameScenePlan
  readonly timingScene:
    CanonicalLivingFrameTimingBinding['scenes'][number]
  readonly choreography: LivingFrameChoreographyBinding
  readonly indexedTracks: readonly IndexedMotionTrack[]
}): readonly LivingFrameExactAttentionEventBinding[] {
  const choreographyById = new Map(
    input.choreography.attentionBindings.map((binding) => [
      binding.attentionEventId,
      binding,
    ]),
  )
  if (
    choreographyById.size !== input.scene.attentionSequence.length
    || input.scene.attentionSequence.some((event, index) =>
      event.order !== index)
  ) throw invalid('Attention journey coverage or order is invalid.')
  const journey = input.scene.attentionSequence.map((event) => {
    const choreography = choreographyById.get(event.attentionEventId)
    if (!choreography) throw invalid('Attention event lacks choreography.')
    const phase = ATTENTION_PHASE[event.eventType]
    const exact = exactPhaseRange(
      input.timingScene.semanticPhaseBindings,
      phase,
    )
    const methodResolutions = event.methods.map((method) =>
      resolveAttentionMethod({
        eventId: event.attentionEventId,
        method,
        soundRequestIds: choreography.soundRequestIds,
        tracks: input.indexedTracks,
      }))
    const motionTracks = uniqueMotionTracks(
      methodResolutions.flatMap((method) => method.motionTracks),
    )
    const restorationRequired = event.eventType === 'restore'
      && !input.scene.attentionSequence.some((candidate) =>
        candidate.eventType === 'transition_away')
    const localContrastRestoration = methodResolutions.some((method) =>
      method.resolution ===
        'canonical_renderer_local_contrast_primitive_request')
    const motionRestoration = motionTracks.length > 0
      && motionTracks.every((reference) => {
        const indexed = input.indexedTracks.find(({ spec, track }) =>
          spec.motionSpecDigestSha256 === reference.motionSpecDigestSha256
          && track.trackId === reference.trackId)
        return indexed != null
          && indexed.track.keyframes[0]!.value ===
            indexed.track.keyframes[
              indexed.track.keyframes.length - 1
            ]!.value
      })
    const restorationCandidateVerified = !restorationRequired
      || localContrastRestoration
      || motionRestoration
    if (!restorationCandidateVerified) {
      throw invalid('Attention restoration lacks a returning treatment.')
    }
    return {
      order: event.order,
      attentionEventId: event.attentionEventId,
      eventType: event.eventType,
      target: event.target,
      requiredSemanticPhase: phase,
      semanticPhaseTimingRequestId: exact.timingRequestId,
      frameRange: exact.frameRange,
      methodResolutions,
      motionTracks,
      soundRequestIds: [...choreography.soundRequestIds].sort(),
      restorationRequired,
      restorationCandidateVerified,
      exactRangeDerivedFromCanonicalMasterTiming: true as const,
    }
  })
  const handoffIndex = journey.findIndex((event) =>
    event.eventType === 'handoff')
  const restoreIndex = journey.findIndex((event) =>
    event.eventType === 'restore')
  const transitionsAway = journey.some((event) =>
    event.eventType === 'transition_away')
  if (
    handoffIndex >= 0
    && !transitionsAway
    && restoreIndex <= handoffIndex
  ) throw invalid('Focus handoff requires a later restore event.')
  return journey
}

function resolveAttentionMethod(input: {
  readonly eventId: string
  readonly method: LivingFrameAttentionMethod
  readonly soundRequestIds: readonly string[]
  readonly tracks: readonly IndexedMotionTrack[]
}): LivingFrameAttentionMethodResolution {
  if (input.method === 'local_contrast_expectation') return {
    method: input.method,
    resolution:
      'canonical_renderer_local_contrast_primitive_request',
    motionTracks: [],
    soundRequestIds: [],
    rendererPrimitiveRequestId: safeDerivedId(
      'lf-local-contrast',
      { attentionEventId: input.eventId },
    ),
  }
  if (input.method === 'sound_emphasis_expectation') {
    if (input.soundRequestIds.length === 0) {
      throw invalid('Sound emphasis lacks a semantic sound request.')
    }
    return {
      method: input.method,
      resolution: 'semantic_soundsync_request',
      motionTracks: [],
      soundRequestIds: [...input.soundRequestIds].sort(),
      rendererPrimitiveRequestId: null,
    }
  }
  const matching = input.tracks.filter(({ track }) => {
    switch (input.method) {
      case 'focus_depth_expectation':
        return track.target === 'source'
          && track.property === 'blur_pixels'
      case 'camera_reframe_expectation':
        return track.target === 'virtual_camera'
          && (
            track.property === 'position_x_normalized'
            || track.property === 'position_y_normalized'
          )
      case 'camera_push_expectation':
        return track.target === 'virtual_camera'
          && track.property === 'scale_uniform'
      case 'motion_emphasis_expectation':
        return track.target === 'layer'
          && (
            track.role === 'primary'
            || track.role === 'secondary'
          )
          && trackHasChange(track)
      case 'light_emphasis_expectation':
        return track.property === 'light_intensity'
      case 'local_contrast_expectation':
      case 'sound_emphasis_expectation':
        return false
    }
  })
  if (matching.length === 0) {
    throw invalid(`Attention method ${input.method} lacks motion-v3 coverage.`)
  }
  return {
    method: input.method,
    resolution: 'canonical_motion_v3_tracks',
    motionTracks: matching.map(toMotionReference),
    soundRequestIds: [],
    rendererPrimitiveRequestId: null,
  }
}

function compileSoundRequests(input: {
  readonly scene: LivingFrameScenePlan
  readonly attentionJourney:
    readonly LivingFrameExactAttentionEventBinding[]
  readonly choreography: LivingFrameChoreographyBinding
  readonly motionSpecs:
    ReadonlyMap<string, CanonicalLivingFrameMotionSpec>
}): readonly LivingFrameSoundSyncSemanticCueRequest[] {
  const projectionById = new Map(
    input.choreography.soundRequestProjections.map((projection) => [
      projection.soundRequestId,
      projection,
    ]),
  )
  if (projectionById.size !== input.scene.soundRequests.length) {
    throw invalid('Sound choreography coverage is incomplete.')
  }
  return input.scene.soundRequests.map((request) => {
    const projection = projectionById.get(request.soundRequestId)
    if (!projection) throw invalid('Sound request lacks choreography.')
    const attention = input.attentionJourney.find((event) =>
      event.attentionEventId ===
        projection.semanticTriggerAttentionEventId)
    if (
      !attention
      || attention.eventType !== projection.semanticTriggerEventType
      || !attention.soundRequestIds.includes(request.soundRequestId)
    ) throw invalid('Sound semantic trigger lineage is invalid.')
    const linkedSpec = request.linkedComponentId == null
      ? null
      : input.motionSpecs.get(request.linkedComponentId)
    if (request.linkedComponentId != null && !linkedSpec) {
      throw invalid('Sound-linked component motion spec is missing.')
    }
    const canonicalMotionTracks = linkedSpec == null
      ? attention.motionTracks
      : linkedSpec.tracks
        .filter((track) => trackHasChange(track))
        .map((track) => toMotionReference({
          spec: linkedSpec,
          track,
        }))
    if (
      request.linkedComponentId != null
      && request.purpose !== 'environmental_presence'
      && canonicalMotionTracks.length === 0
    ) throw invalid('Sound-linked component lacks meaningful motion-v3 lineage.')
    const anchor = derivePreferredHitFrame({
      attention,
      canonicalMotionTracks,
      motionSpecs: input.motionSpecs,
    })
    const requestWithoutDigest = {
      order: request.order,
      soundRequestId: request.soundRequestId,
      linkedComponentId: request.linkedComponentId,
      purpose: request.purpose,
      priority: request.priority,
      narrationProtection: request.narrationProtection,
      duckingExpectation: request.duckingExpectation,
      semanticTrigger: {
        attentionEventId: attention.attentionEventId,
        eventType: attention.eventType,
        exactAllowedFrameRange: attention.frameRange,
        choreographyMotionTrackIds:
          [...projection.semanticTriggerMotionTrackIds].sort(),
        canonicalMotionTracks,
        preferredHitFrameCandidate: anchor.frame,
        preferredHitFrameDerivation: anchor.derivation,
        finalHitFrameAuthorityProvidedByLivingFrame: false as const,
      },
      canonicalSoundSyncMustReturn: {
        exactStartHitAndEndFrames: true as const,
        attackAndReleaseEnvelope: true as const,
        approvedAssetIdDigestAndProvenance: true as const,
        gainPanStereoRoomAndReverb: true as const,
        narrationDuckingAutomation: true as const,
        storyTimingEventLineage: true as const,
        approvedSnapshotWorkAssetAndRendererLineage: true as const,
        audioQaAndPrivateReviewEvidence: true as const,
      },
      currentResolutionState:
        'pending_canonical_soundsync_resolution' as const,
      exactCuePlacementProvidedByLivingFrame: false as const,
      exactMixProvidedByLivingFrame: false as const,
    }
    return {
      ...requestWithoutDigest,
      requestDigestSha256:
        sha256AuthorityValue(requestWithoutDigest),
    }
  })
}

function derivePreferredHitFrame(input: {
  readonly attention: LivingFrameExactAttentionEventBinding
  readonly canonicalMotionTracks:
    readonly LivingFrameAttentionResolvedMotionTrack[]
  readonly motionSpecs:
    ReadonlyMap<string, CanonicalLivingFrameMotionSpec>
}): {
  readonly frame: number
  readonly derivation:
    LivingFrameSoundSyncSemanticCueRequest[
      'semanticTrigger'
    ]['preferredHitFrameDerivation']
} {
  if (
    input.attention.eventType === 'hold'
    || input.attention.eventType === 'restore'
    || input.attention.eventType === 'transition_away'
  ) return {
    frame: input.attention.frameRange.startFrame,
    derivation: 'attention_range_entry',
  }
  const frames = input.canonicalMotionTracks.flatMap((reference) => {
    const spec = input.motionSpecs.get(reference.componentId)
    const track = spec?.tracks.find((candidate) =>
      candidate.trackId === reference.trackId)
    if (!spec || !track) return []
    return track.keyframes
      .map((keyframe) => spec.sceneStartFrame + keyframe.frameOffset)
      .filter((frame) =>
        frame >= input.attention.frameRange.startFrame
        && frame < input.attention.frameRange.endFrameExclusive)
  })
  if (frames.length > 0) return {
    frame: Math.max(...frames),
    derivation: 'last_motion_keyframe_inside_attention_range',
  }
  return {
    frame: input.attention.frameRange.endFrameExclusive - 1,
    derivation: 'attention_range_exit_minus_one',
  }
}

function indexAndVerifyMotionSpecs(input: {
  readonly scene: LivingFrameScenePlan
  readonly timingBinding: CanonicalLivingFrameTimingBinding
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly specs: readonly CanonicalLivingFrameMotionSpec[]
}): ReadonlyMap<string, CanonicalLivingFrameMotionSpec> {
  if (input.specs.length !== input.scene.components.length) {
    throw invalid('Every scene component requires one motion-v3 spec.')
  }
  const map = new Map<string, CanonicalLivingFrameMotionSpec>()
  for (const spec of input.specs) {
    if (
      !verifyCanonicalLivingFrameMotionSpec(spec)
      || spec.sceneId !== input.scene.sceneId
      || spec.sourceBindings.selectedSceneBindingDigestSha256 !==
        input.publication.binding.bindingDigestSha256
      || spec.sourceBindings.timingBindingDigestSha256 !==
        input.timingBinding.timingBindingDigestSha256
      || map.has(spec.componentId)
    ) throw invalid('Motion-v3 spec lineage or uniqueness is invalid.')
    map.set(spec.componentId, spec)
  }
  if (input.scene.components.some((component) =>
    !map.has(component.componentId))) {
    throw invalid('Motion-v3 component coverage is incomplete.')
  }
  return map
}

function assertSourceLineage(
  input: CompileLivingFrameAttentionSoundSyncIntegrationInput,
  scene: LivingFrameScenePlan,
): void {
  if (
    input.requirements.sourceBindings
      .selectedSceneBindingDigestSha256 !==
        input.publication.binding.bindingDigestSha256
    || input.canonicalTimingBinding.sourceBindings
      .executionRequirementsDigestSha256 !==
        input.requirements.requirementsDigestSha256
    || input.choreographyBinding.sourceBindings
      .livingFrameComponentDigestSha256 !==
        input.publication.binding.selectedComponent
          .contractDigestSha256
    || input.choreographyBinding.sourceBindings
      .masterTimingPlanDigestSha256 !==
        input.canonicalTimingBinding.sourceBindings
          .currentMasterTimingDigestSha256
    || input.choreographyBinding.sourceBindings
      .outputFrameDigestSha256 !==
        input.publication.binding.selectedComponent
          .inputBindings.outputFrame.expectedDigestSha256
    || input.choreographyBinding.sceneId !== scene.sceneId
  ) throw invalid('Attention integration source lineage diverged.')
}

function assertActiveOwnerScope(scene: LivingFrameScenePlan): void {
  if (scene.skillActivations.some((activation) =>
    activation.decision !== 'do_not_use'
    && PAUSED_MOTION_SKILLS.has(activation.miniSkillKey))) {
    throw invalid('Paused illustration or rigging scope cannot enter active integration.')
  }
  if ([
    'introduce_character',
    'demonstrate_decisive_action',
    'explain_mechanical_operation',
  ].includes(scene.narrativePurposeCode)) {
    throw invalid('Character or mechanical action is paused by owner scope.')
  }
}

function assertPausedSubjectsAreNotAnimated(
  scene: LivingFrameScenePlan,
  tracks: readonly IndexedMotionTrack[],
): void {
  const roleByComponent = new Map(
    scene.components.map((component) => [
      component.componentId,
      component.role,
    ]),
  )
  if (tracks.some(({ spec, track }) => {
    const role = roleByComponent.get(spec.componentId)
    return (
      role === 'primary_subject'
      || role === 'mechanical_component'
    )
      && track.target === 'layer'
      && trackHasChange(track)
  })) throw invalid('Paused living-character or mechanical component motion detected.')
}

function exactPhaseRange(
  bindings:
    CanonicalLivingFrameTimingBinding['scenes'][number][
      'semanticPhaseBindings'
    ],
  phase: LivingFrameTimingPhase,
) {
  const matches = bindings.filter((binding) => binding.phase === phase)
  if (matches.length !== 1) {
    throw invalid(`Canonical semantic phase ${phase} is not unique.`)
  }
  return matches[0]!
}

function trackHasChange(track: CanonicalLivingFrameMotionTrack): boolean {
  return new Set(track.keyframes.map((keyframe) => keyframe.value)).size > 1
}

function toMotionReference(
  input: IndexedMotionTrack,
): LivingFrameAttentionResolvedMotionTrack {
  return {
    motionSpecDigestSha256: input.spec.motionSpecDigestSha256,
    componentId: input.spec.componentId,
    trackId: input.track.trackId,
    target: input.track.target,
    property: input.track.property,
    role: input.track.role,
  }
}

function uniqueMotionTracks(
  values: readonly LivingFrameAttentionResolvedMotionTrack[],
): readonly LivingFrameAttentionResolvedMotionTrack[] {
  const map = new Map<string, LivingFrameAttentionResolvedMotionTrack>()
  for (const value of values) map.set(
    `${value.motionSpecDigestSha256}:${value.trackId}`,
    value,
  )
  return [...map.values()].sort((left, right) =>
    left.trackId.localeCompare(right.trackId))
}

function frameRange(
  startFrame: number,
  endFrameExclusive: number,
): CanonicalLivingFrameFrameRange {
  if (
    !Number.isSafeInteger(startFrame)
    || !Number.isSafeInteger(endFrameExclusive)
    || startFrame < 0
    || endFrameExclusive <= startFrame
  ) throw invalid('Invalid exact frame range.')
  return {
    startFrame,
    endFrameExclusive,
    durationFrames: endFrameExclusive - startFrame,
  }
}

function safeDerivedId(prefix: string, value: unknown): string {
  return `${prefix}.${sha256AuthorityValue(value).slice(0, 32)}`
}

function assertInput(
  input: CompileLivingFrameAttentionSoundSyncIntegrationInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'integrationId',
      'sceneId',
      'ownerScopeAmendment',
      'publication',
      'requirements',
      'canonicalTimingBinding',
      'choreographyBinding',
      'canonicalMotionSpecs',
      'components',
    ])
    || !SAFE_ID.test(String(input.integrationId))
    || !SAFE_ID.test(String(input.sceneId))
    || !Array.isArray(input.canonicalMotionSpecs)
  ) throw invalid('Attention integration input is invalid.')
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const child of Object.values(
    value as Record<string, unknown>,
  )) deepFreeze(child)
  return value
}

function invalid(message: string): Error {
  return new Error(`Living Frame attention/SoundSync integration: ${message}`)
}
