import { createHash } from 'node:crypto'

import type {
  LivingFrameAttentionEvent,
  LivingFrameProfessionalSkillComponent,
  LivingFrameScenePlan,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_ATTENTION_EVENT_TYPES,
  LIVING_FRAME_ATTENTION_METHODS,
  LIVING_FRAME_ATTENTION_TARGETS,
  LIVING_FRAME_DUCKING_EXPECTATIONS,
  LIVING_FRAME_FACTUAL_SCALE_GUARDS,
  LIVING_FRAME_NARRATION_PROTECTION,
  LIVING_FRAME_SEMANTIC_SCALE_MEANINGS,
  LIVING_FRAME_SEMANTIC_SCALE_MODES,
  LIVING_FRAME_SOUND_PRIORITIES,
  LIVING_FRAME_SOUND_PURPOSES,
} from '../../src/types/living-frame'
import type {
  LivingFrameAttentionChoreographyBinding,
  LivingFrameAttentionMethodCoverage,
  LivingFrameAttentionTrackBindingDraft,
  LivingFrameChoreographyAuthorityBoundary,
  LivingFrameChoreographyBinding,
  LivingFrameChoreographyBindingDraft,
  LivingFrameChoreographyMetrics,
  LivingFrameChoreographyMotionBudget,
  LivingFrameChoreographyOpenGate,
  LivingFrameSemanticScaleTrackBindingDraft,
  LivingFrameSoundChoreographyProjection,
} from '../../src/types/living-frame-choreography-binding'
import {
  LIVING_FRAME_CHOREOGRAPHY_BINDING_CLASS,
  LIVING_FRAME_CHOREOGRAPHY_BINDING_STATES,
  LIVING_FRAME_CHOREOGRAPHY_BINDING_VERSION,
  LIVING_FRAME_CHOREOGRAPHY_OPEN_GATES,
} from '../../src/types/living-frame-choreography-binding'
import type {
  LivingFrameCompiledMotionTrack,
  LivingFrameDeterministicMotionBundle,
} from '../../src/types/living-frame-deterministic-motion'
import {
  LIVING_FRAME_MOTION_PROPERTIES,
  LIVING_FRAME_MOTION_TRACK_ROLES,
} from '../../src/types/living-frame-deterministic-motion'
import {
  validateLivingFrameProfessionalSkillComponent,
} from '../../src/lib/living-frame/living-frame-contract'
import {
  verifyLivingFrameDeterministicMotionBundleDigest,
} from './living-frame-deterministic-motion'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/
const MAX_ATTENTION_EVENT_COUNT = 64
const MAX_SCALE_REQUEST_COUNT = 64
const MAX_SOUND_REQUEST_COUNT = 64
const MAX_TRACK_COUNT = 64

const BASE_OPEN_GATES: readonly LivingFrameChoreographyOpenGate[] = [
  'current_living_frame_component_reread_required',
  'current_motion_bundle_reread_required',
  'canonical_master_timing_revalidation_required',
  'canonical_output_frame_revalidation_required',
  'canonical_attention_event_timing_required',
  'canonical_soundsync_projection_required',
  'canonical_sound_mix_and_ducking_required',
  'canonical_renderer_plan_projection_required',
  'canonical_snapshot_projection_required',
  'canonical_asset_manifest_linkage_required',
  'canonical_work_graph_projection_required',
  'canonical_qa_projection_required',
  'canonical_private_remotion_review_required',
]

const AUTHORITY_BOUNDARY:
  LivingFrameChoreographyAuthorityBoundary = Object.freeze({
    semanticConformanceCandidateOnly: true,
    selectedSceneAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    soundSyncAuthority: false,
    exactSoundCueAuthority: false,
    soundMixAuthority: false,
    rendererPlanAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    remotionExecutionAuthority: false,
    privateReviewAuthority: false,
    runtimePromotionAuthority: false,
    productionAuthority: false,
  })

export interface CompileLivingFrameChoreographyBindingInput {
  readonly livingFrameComponent: LivingFrameProfessionalSkillComponent
  readonly sceneId: string
  readonly motionBundle: LivingFrameDeterministicMotionBundle
  readonly attentionTrackBindings:
    readonly LivingFrameAttentionTrackBindingDraft[]
  readonly semanticScaleTrackBindings:
    readonly LivingFrameSemanticScaleTrackBindingDraft[]
}

export async function compileLivingFrameChoreographyBinding(
  input: CompileLivingFrameChoreographyBindingInput,
): Promise<LivingFrameChoreographyBinding> {
  const componentValidation =
    await validateLivingFrameProfessionalSkillComponent(
      input.livingFrameComponent,
    )
  if (!componentValidation.ok) {
    throw invalid('Living Frame choreography requires a valid parent component.')
  }
  if (
    !SAFE_ID.test(input.sceneId)
    || !verifyLivingFrameDeterministicMotionBundleDigest(input.motionBundle)
  ) {
    throw invalid('Living Frame choreography input lineage is invalid.')
  }
  const scene = componentValidation.component.scenePlans.find(
    (candidate) => candidate.sceneId === input.sceneId,
  )
  if (!scene) {
    throw invalid('Living Frame choreography requires one active scene.')
  }
  if (input.motionBundle.timingExpectation.sceneId !== scene.sceneId) {
    throw invalid('Living Frame choreography motion belongs to another scene.')
  }

  const tracksById = new Map(
    input.motionBundle.tracks.map((track) => [track.trackId, track]),
  )
  const sceneComponentIds = new Set(
    scene.components.map((component) => component.componentId),
  )
  assertMotionComponentReferences(input.motionBundle.tracks, sceneComponentIds)
  const attentionBindings = compileAttentionBindings({
    scene,
    drafts: input.attentionTrackBindings,
    tracksById,
  })
  const semanticScaleBindings = compileScaleBindings({
    scene,
    drafts: input.semanticScaleTrackBindings,
    tracksById,
  })
  const soundRequestProjections =
    compileSoundRequestProjections({
      scene,
      attentionBindings,
      tracksById,
    })
  const motionBudget = deriveMotionBudget(
    scene,
    input.motionBundle,
  )
  const boundTrackIds = new Set([
    ...attentionBindings.flatMap((binding) => binding.motionTrackIds),
    ...semanticScaleBindings.flatMap((binding) => binding.motionTrackIds),
  ])
  const boundMotionTracks = input.motionBundle.tracks
    .filter((track) => boundTrackIds.has(track.trackId))
    .map((track) => ({
      trackId: track.trackId,
      componentId: track.componentId,
      property: track.property,
      role: track.role,
      restorationExpectation: track.restorationExpectation,
    }))
  const openGateCodes = deriveOpenGates(attentionBindings)
  const bindingState = openGateCodes.some((gate) =>
    gate === 'local_contrast_renderer_primitive_required'
    || gate === 'unsupported_attention_method_binding'
    || gate === 'unsupported_semantic_scale_binding')
    ? 'blocked_by_unsupported_attention_or_scale_treatment'
    : 'candidate_pending_canonical_timing_soundsync_and_snapshot'
  const metrics: LivingFrameChoreographyMetrics = {
    attentionEventCount: attentionBindings.length,
    coveredAttentionMethodCount: attentionBindings.reduce(
      (total, binding) =>
        total + binding.methodCoverage.filter(
          (coverage) =>
            coverage.coverage !== 'renderer_primitive_still_required',
        ).length,
      0,
    ),
    rendererPrimitiveAttentionMethodCount: attentionBindings.reduce(
      (total, binding) =>
        total + binding.methodCoverage.filter(
          (coverage) =>
            coverage.coverage === 'renderer_primitive_still_required',
        ).length,
      0,
    ),
    semanticScaleRequestCount: semanticScaleBindings.length,
    soundRequestCount: soundRequestProjections.length,
    boundMotionTrackCount: boundMotionTracks.length,
    unboundMotionTrackCount:
      input.motionBundle.tracks.length - boundMotionTracks.length,
  }
  const draft: LivingFrameChoreographyBindingDraft = {
    contractVersion: LIVING_FRAME_CHOREOGRAPHY_BINDING_VERSION,
    bindingClass: LIVING_FRAME_CHOREOGRAPHY_BINDING_CLASS,
    sceneId: scene.sceneId,
    sourceBindings: {
      livingFrameComponentDigestSha256:
        componentValidation.component.contractDigestSha256,
      deterministicMotionBundleDigestSha256:
        input.motionBundle.bundleDigestSha256,
      masterTimingPlanId:
        input.motionBundle.timingExpectation.masterTimingPlanId,
      masterTimingPlanDigestSha256:
        input.motionBundle.timingExpectation.masterTimingPlanDigestSha256,
      outputFrameId:
        input.motionBundle.timingExpectation.outputFrameId,
      outputFrameDigestSha256:
        input.motionBundle.timingExpectation.outputFrameDigestSha256,
    },
    attentionBindings,
    semanticScaleBindings,
    soundRequestProjections,
    motionBudget,
    boundMotionTracks,
    bindingState,
    openGateCodes,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false,
    containsProviderToolWorkQueueCostOrApprovalRoute: false,
    containsExecutableCodeOrCommands: false,
    semanticRequestsRemainNonExecutable: true,
    canonicalMasterTimingAndSoundSyncRemainAuthority: true,
    subjectSpecificRouting: false,
  }
  return {
    ...draft,
    bindingDigestSha256: sha256(canonicalJsonStringify(draft)),
  }
}

export function verifyLivingFrameChoreographyBindingDigest(
  value: unknown,
): value is LivingFrameChoreographyBinding {
  if (!isBindingShape(value)) return false
  const { bindingDigestSha256, ...draft } = value
  return bindingDigestSha256 === sha256(canonicalJsonStringify(draft))
}

function compileAttentionBindings(input: {
  scene: LivingFrameScenePlan
  drafts: readonly LivingFrameAttentionTrackBindingDraft[]
  tracksById: ReadonlyMap<string, LivingFrameCompiledMotionTrack>
}) {
  if (
    input.scene.attentionSequence.length > MAX_ATTENTION_EVENT_COUNT
    || input.drafts.length !== input.scene.attentionSequence.length
  ) {
    throw invalid('Living Frame attention binding coverage is incomplete.')
  }
  const byEventId = uniqueDraftMap(
    input.drafts,
    (draft) => draft.attentionEventId,
    'Living Frame attention binding IDs must be unique.',
  )
  const soundRequestIds = new Set(
    input.scene.soundRequests.map((request) => request.soundRequestId),
  )
  return input.scene.attentionSequence.map((event) => {
    const draft = byEventId.get(event.attentionEventId)
    if (!draft) {
      throw invalid('Living Frame attention event is not bound.')
    }
    const tracks = resolveTrackIds(
      draft.motionTrackIds,
      input.tracksById,
      'Living Frame attention binding references an unknown motion track.',
    )
    assertUniqueSafeIds(draft.soundRequestIds)
    if (
      draft.soundRequestIds.some((requestId) => !soundRequestIds.has(requestId))
    ) {
      throw invalid('Living Frame attention binding references unknown sound.')
    }
    const methodCoverage = event.methods.map((method) =>
      coverAttentionMethod({
        event,
        method,
        tracks,
        soundRequestIds: draft.soundRequestIds,
      }))
    const restorationCandidatePresent =
      event.eventType === 'restore'
      && tracks.some((track) =>
        track.restorationExpectation === 'required_return_to_initial')
    if (
      event.eventType === 'restore'
      && !restorationCandidatePresent
      && !input.scene.attentionSequence.some(
        (candidate) => candidate.eventType === 'transition_away',
      )
    ) {
      throw invalid('Living Frame attention restoration is not represented.')
    }
    return {
      order: event.order,
      attentionEventId: event.attentionEventId,
      eventType: event.eventType,
      target: event.target,
      methodCoverage,
      motionTrackIds: tracks.map((track) => track.trackId).sort(),
      soundRequestIds: [...draft.soundRequestIds].sort(),
      restorationCandidatePresent,
      exactFramesStillOwnedByMasterTiming: true as const,
    }
  })
}

function compileSoundRequestProjections(input: {
  readonly scene: LivingFrameScenePlan
  readonly attentionBindings:
    readonly LivingFrameAttentionChoreographyBinding[]
  readonly tracksById:
    ReadonlyMap<string, LivingFrameCompiledMotionTrack>
}): readonly LivingFrameSoundChoreographyProjection[] {
  const triggerBySoundRequestId = new Map<
    string,
    LivingFrameAttentionChoreographyBinding
  >()
  for (const attentionBinding of input.attentionBindings) {
    for (const soundRequestId of attentionBinding.soundRequestIds) {
      if (triggerBySoundRequestId.has(soundRequestId)) {
        throw invalid(
          'Each Living Frame sound request requires exactly one semantic attention trigger.',
        )
      }
      triggerBySoundRequestId.set(
        soundRequestId,
        attentionBinding,
      )
    }
  }
  if (
    triggerBySoundRequestId.size !==
      input.scene.soundRequests.length
  ) {
    throw invalid(
      'Every Living Frame sound request requires exactly one semantic attention trigger.',
    )
  }
  return input.scene.soundRequests.map((request) => {
    const trigger =
      triggerBySoundRequestId.get(request.soundRequestId)
    if (!trigger) {
      throw invalid(
        'Every Living Frame sound request requires exactly one semantic attention trigger.',
      )
    }
    const linkedComponentMotionMatched =
      request.linkedComponentId !== null
      && trigger.motionTrackIds.some((trackId) =>
        input.tracksById.get(trackId)?.componentId ===
          request.linkedComponentId)
    const linkedComponentMotionPolicy =
      request.linkedComponentId === null
        ? 'not_applicable_unlinked_sound' as const
        : request.purpose === 'environmental_presence'
          ? 'not_required_environmental_presence' as const
          : linkedComponentMotionMatched
            ? 'required_and_matched' as const
            : null
    if (linkedComponentMotionPolicy === null) {
      throw invalid(
        'A motion-dependent component-linked Living Frame sound request must trigger with motion from that component.',
      )
    }
    return {
      order: request.order,
      soundRequestId: request.soundRequestId,
      linkedComponentId: request.linkedComponentId,
      purpose: request.purpose,
      priority: request.priority,
      narrationProtection: request.narrationProtection,
      duckingExpectation: request.duckingExpectation,
      semanticTriggerAttentionEventId:
        trigger.attentionEventId,
      semanticTriggerEventType: trigger.eventType,
      semanticTriggerMotionTrackIds:
        [...trigger.motionTrackIds],
      semanticTriggerBound: true as const,
      linkedComponentMotionPolicy,
      semanticTriggerExactFramesProvided: false as const,
      exactCuePlacementProvided: false as const,
      exactMixProvided: false as const,
      downstreamSoundSyncRequired:
        request.duckingExpectation ===
          'downstream_soundsync_required',
    }
  })
}

function coverAttentionMethod(input: {
  event: LivingFrameAttentionEvent
  method: LivingFrameAttentionEvent['methods'][number]
  tracks: readonly LivingFrameCompiledMotionTrack[]
  soundRequestIds: readonly string[]
}): LivingFrameAttentionMethodCoverage {
  const matchingTracks = input.tracks.filter((track) => {
    switch (input.method) {
      case 'focus_depth_expectation':
        return track.property === 'focus_depth_normalized'
          || track.property === 'blur_pixels'
      case 'camera_reframe_expectation':
        return track.role === 'camera'
          && (
            track.property === 'position_x_normalized'
            || track.property === 'position_y_normalized'
          )
      case 'camera_push_expectation':
        return track.role === 'camera'
          && track.property === 'scale_uniform'
      case 'motion_emphasis_expectation':
        return track.role === 'primary'
      case 'light_emphasis_expectation':
        return track.property === 'light_intensity'
      case 'local_contrast_expectation':
      case 'sound_emphasis_expectation':
        return false
    }
  })
  if (input.method === 'sound_emphasis_expectation') {
    if (input.soundRequestIds.length === 0) {
      throw invalid('Living Frame sound attention lacks a semantic sound request.')
    }
    return {
      method: input.method,
      motionTrackIds: [],
      soundRequestIds: [...input.soundRequestIds].sort(),
      coverage: 'semantic_sound_request_preserved',
    }
  }
  if (input.method === 'local_contrast_expectation') {
    return {
      method: input.method,
      motionTrackIds: [],
      soundRequestIds: [],
      coverage: 'renderer_primitive_still_required',
    }
  }
  if (matchingTracks.length === 0) {
    throw invalid(
      `Living Frame attention method ${input.method} lacks deterministic coverage.`,
    )
  }
  return {
    method: input.method,
    motionTrackIds: matchingTracks.map((track) => track.trackId).sort(),
    soundRequestIds: [],
    coverage: 'deterministic_motion_candidate',
  }
}

function compileScaleBindings(input: {
  scene: LivingFrameScenePlan
  drafts: readonly LivingFrameSemanticScaleTrackBindingDraft[]
  tracksById: ReadonlyMap<string, LivingFrameCompiledMotionTrack>
}) {
  if (
    input.scene.semanticScaleRequests.length > MAX_SCALE_REQUEST_COUNT
    || input.drafts.length !== input.scene.semanticScaleRequests.length
  ) {
    throw invalid('Living Frame semantic scale binding coverage is incomplete.')
  }
  const byRequestId = uniqueDraftMap(
    input.drafts,
    (draft) => draft.semanticScaleRequestId,
    'Living Frame semantic scale binding IDs must be unique.',
  )
  return input.scene.semanticScaleRequests.map((request) => {
    const draft = byRequestId.get(request.semanticScaleRequestId)
    if (!draft) throw invalid('Living Frame semantic scale request is unbound.')
    const tracks = resolveTrackIds(
      draft.motionTrackIds,
      input.tracksById,
      'Living Frame semantic scale binding references an unknown track.',
    )
    if (tracks.some((track) => track.componentId !== request.componentId)) {
      throw invalid('Living Frame semantic scale track targets the wrong component.')
    }
    const scaleTracks = tracks.filter(
      (track) => track.property === 'scale_uniform',
    )
    let treatment:
      | 'literal_relationship_preserved_without_component_scale'
      | 'data_proportion_preserved_without_component_scale'
      | 'perspective_scale_track_candidate'
      | 'editorial_symbolic_scale_track_candidate'
    if (request.mode === 'literal_physical') {
      if (
        request.factualGuard !== 'literal_relationship_must_be_preserved'
        || scaleTracks.length !== 0
      ) {
        throw invalid('Literal Living Frame scale cannot distort the component.')
      }
      treatment = 'literal_relationship_preserved_without_component_scale'
    } else if (request.mode === 'data_proportional') {
      if (
        request.factualGuard !== 'data_proportions_must_be_preserved'
        || scaleTracks.length !== 0
      ) {
        throw invalid('Data-proportional Living Frame scale cannot distort data.')
      }
      treatment = 'data_proportion_preserved_without_component_scale'
    } else if (request.mode === 'perspective') {
      if (
        request.factualGuard !== 'perspective_only'
        || scaleTracks.length < 1
      ) {
        throw invalid('Perspective Living Frame scale requires a scale track.')
      }
      treatment = 'perspective_scale_track_candidate'
    } else {
      if (
        request.factualGuard !== 'symbolic_treatment_must_be_disclosed'
        || scaleTracks.length < 1
      ) {
        throw invalid('Editorial Living Frame scale requires a disclosed scale track.')
      }
      treatment = 'editorial_symbolic_scale_track_candidate'
    }
    return {
      semanticScaleRequestId: request.semanticScaleRequestId,
      componentId: request.componentId,
      mode: request.mode,
      meaning: request.meaning,
      factualGuard: request.factualGuard,
      treatment,
      motionTrackIds: tracks.map((track) => track.trackId).sort(),
      factualRelationshipMustBeRevalidated: true as const,
    }
  })
}

function deriveMotionBudget(
  scene: LivingFrameScenePlan,
  motion: LivingFrameDeterministicMotionBundle,
): LivingFrameChoreographyMotionBudget {
  if (
    scene.soundRequests.length > MAX_SOUND_REQUEST_COUNT
    || motion.tracks.length > MAX_TRACK_COUNT
  ) {
    throw invalid('Living Frame motion budget is invalid.')
  }
  const animatedComponents = new Set(
    motion.tracks
      .filter((track) => track.role !== 'camera')
      .map((track) => track.componentId),
  )
  return {
    primaryMotionGroupCount: motion.metrics.primaryMotionGroupCount,
    maximumConcurrentTrackCount: motion.metrics.maximumConcurrentTrackCount,
    cameraTrackCount: motion.metrics.cameraTrackCount,
    restorationTrackCount: motion.metrics.restorationTrackCount,
    sceneComponentCount: scene.components.length,
    animatedSceneComponentCount: animatedComponents.size,
    stillSceneComponentCount:
      scene.components.length - animatedComponents.size,
    onePrimaryMotionGroupAtATimeVerified: true,
    stillnessPreservedAsDesignState: true,
  }
}

function deriveOpenGates(
  bindings: readonly {
    methodCoverage: readonly LivingFrameAttentionMethodCoverage[]
  }[],
): LivingFrameChoreographyOpenGate[] {
  const gates = new Set<LivingFrameChoreographyOpenGate>(BASE_OPEN_GATES)
  if (bindings.some((binding) =>
    binding.methodCoverage.some((coverage) =>
      coverage.method === 'local_contrast_expectation'
      && coverage.coverage === 'renderer_primitive_still_required'))) {
    gates.add('local_contrast_renderer_primitive_required')
  }
  return [...gates]
}

function assertMotionComponentReferences(
  tracks: readonly LivingFrameCompiledMotionTrack[],
  sceneComponentIds: ReadonlySet<string>,
): void {
  for (const track of tracks) {
    if (track.role === 'camera') continue
    if (!sceneComponentIds.has(track.componentId)) {
      throw invalid('Living Frame motion references a non-scene component.')
    }
  }
}

function resolveTrackIds(
  ids: readonly string[],
  tracksById: ReadonlyMap<string, LivingFrameCompiledMotionTrack>,
  message: string,
): LivingFrameCompiledMotionTrack[] {
  assertUniqueSafeIds(ids)
  return ids.map((id) => {
    const track = tracksById.get(id)
    if (!track) throw invalid(message)
    return track
  })
}

function uniqueDraftMap<T>(
  values: readonly T[],
  key: (value: T) => string,
  message: string,
): Map<string, T> {
  const result = new Map<string, T>()
  for (const value of values) {
    const id = key(value)
    if (!SAFE_ID.test(id) || result.has(id)) throw invalid(message)
    result.set(id, value)
  }
  return result
}

function assertUniqueSafeIds(ids: readonly string[]): void {
  if (
    ids.length > MAX_TRACK_COUNT
    || ids.some((id) => !SAFE_ID.test(id))
    || new Set(ids).size !== ids.length
  ) throw invalid('Living Frame choreography IDs must be unique and safe.')
}

function isBindingShape(
  value: unknown,
): value is LivingFrameChoreographyBinding {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'contractVersion',
      'bindingClass',
      'sceneId',
      'sourceBindings',
      'attentionBindings',
      'semanticScaleBindings',
      'soundRequestProjections',
      'motionBudget',
      'boundMotionTracks',
      'bindingState',
      'openGateCodes',
      'metrics',
      'authorityBoundary',
      'containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials',
      'containsProviderToolWorkQueueCostOrApprovalRoute',
      'containsExecutableCodeOrCommands',
      'semanticRequestsRemainNonExecutable',
      'canonicalMasterTimingAndSoundSyncRemainAuthority',
      'subjectSpecificRouting',
      'bindingDigestSha256',
    ])
    || value.contractVersion !== LIVING_FRAME_CHOREOGRAPHY_BINDING_VERSION
    || value.bindingClass !== LIVING_FRAME_CHOREOGRAPHY_BINDING_CLASS
    || !SAFE_ID.test(String(value.sceneId))
    || !SHA256.test(String(value.bindingDigestSha256))
    || !LIVING_FRAME_CHOREOGRAPHY_BINDING_STATES.includes(
      value.bindingState as never,
    )
    || value.containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials !== false
    || value.containsProviderToolWorkQueueCostOrApprovalRoute !== false
    || value.containsExecutableCodeOrCommands !== false
    || value.semanticRequestsRemainNonExecutable !== true
    || value.canonicalMasterTimingAndSoundSyncRemainAuthority !== true
    || value.subjectSpecificRouting !== false
    || !isSourceBindings(value.sourceBindings)
    || !isAuthorityBoundary(value.authorityBoundary)
    || !isOpenGates(value.openGateCodes)
    || !bindingStateMatchesGates(
      value.bindingState as LivingFrameChoreographyBinding['bindingState'],
      value.openGateCodes as LivingFrameChoreographyOpenGate[],
    )
    || !Array.isArray(value.attentionBindings)
    || !Array.isArray(value.semanticScaleBindings)
    || !Array.isArray(value.soundRequestProjections)
    || !Array.isArray(value.boundMotionTracks)
    || !isRecord(value.motionBudget)
    || !isRecord(value.metrics)
  ) return false
  try {
    assertBindingCollections(
      value as unknown as LivingFrameChoreographyBinding,
    )
    return true
  } catch {
    return false
  }
}

function assertBindingCollections(
  value: LivingFrameChoreographyBinding,
): void {
  if (
    value.attentionBindings.length > MAX_ATTENTION_EVENT_COUNT
    || value.semanticScaleBindings.length > MAX_SCALE_REQUEST_COUNT
    || value.soundRequestProjections.length > MAX_SOUND_REQUEST_COUNT
    || value.boundMotionTracks.length > MAX_TRACK_COUNT
  ) throw invalid('Living Frame choreography output exceeds bounds.')
  assertUniqueSafeIds(value.attentionBindings.map((item) =>
    item.attentionEventId))
  assertUniqueSafeIds(value.semanticScaleBindings.map((item) =>
    item.semanticScaleRequestId))
  assertUniqueSafeIds(value.soundRequestProjections.map((item) =>
    item.soundRequestId))
  assertUniqueSafeIds(value.boundMotionTracks.map((item) => item.trackId))
  if (
    value.attentionBindings.some((item, index) =>
      item.order !== index
      || item.exactFramesStillOwnedByMasterTiming !== true
      || !Array.isArray(item.methodCoverage)
      || !Array.isArray(item.motionTrackIds)
      || !Array.isArray(item.soundRequestIds)
      || !LIVING_FRAME_ATTENTION_EVENT_TYPES.includes(item.eventType)
      || !LIVING_FRAME_ATTENTION_TARGETS.includes(item.target)
      || item.motionTrackIds.some((trackId) =>
        !value.boundMotionTracks.some((track) => track.trackId === trackId))
      || item.soundRequestIds.some((soundRequestId) =>
        !value.soundRequestProjections.some((request) =>
          request.soundRequestId === soundRequestId))
      || item.methodCoverage.some((coverage) =>
        !LIVING_FRAME_ATTENTION_METHODS.includes(coverage.method)
        || ![
          'deterministic_motion_candidate',
          'semantic_sound_request_preserved',
          'renderer_primitive_still_required',
        ].includes(coverage.coverage)
        || coverage.motionTrackIds.some((trackId: string) =>
          !item.motionTrackIds.includes(trackId))
        || coverage.soundRequestIds.some((soundRequestId: string) =>
          !item.soundRequestIds.includes(soundRequestId)))
      || !attentionCoverageIsConsistent(item, value.boundMotionTracks))
    || value.semanticScaleBindings.some((item) =>
      !SAFE_ID.test(item.componentId)
      || item.factualRelationshipMustBeRevalidated !== true
      || !Array.isArray(item.motionTrackIds)
      || !LIVING_FRAME_SEMANTIC_SCALE_MODES.includes(item.mode)
      || !LIVING_FRAME_SEMANTIC_SCALE_MEANINGS.includes(item.meaning)
      || !LIVING_FRAME_FACTUAL_SCALE_GUARDS.includes(item.factualGuard)
      || !scaleTreatmentIsConsistent(item)
      || item.motionTrackIds.some((trackId) =>
        !value.boundMotionTracks.some((track) =>
          track.trackId === trackId
          && track.componentId === item.componentId
          && track.property === 'scale_uniform')))
    || value.soundRequestProjections.some((item, index) =>
      !isRecord(item)
      || !hasExactKeys(item, [
        'order',
        'soundRequestId',
        'linkedComponentId',
        'purpose',
        'priority',
        'narrationProtection',
        'duckingExpectation',
        'semanticTriggerAttentionEventId',
        'semanticTriggerEventType',
        'semanticTriggerMotionTrackIds',
        'semanticTriggerBound',
        'linkedComponentMotionPolicy',
        'semanticTriggerExactFramesProvided',
        'exactCuePlacementProvided',
        'exactMixProvided',
        'downstreamSoundSyncRequired',
      ])
      || item.order !== index
      || item.narrationProtection !== 'strict'
      || !LIVING_FRAME_SOUND_PURPOSES.includes(item.purpose)
      || !LIVING_FRAME_SOUND_PRIORITIES.includes(item.priority)
      || !LIVING_FRAME_NARRATION_PROTECTION.includes(
        item.narrationProtection,
      )
      || !LIVING_FRAME_DUCKING_EXPECTATIONS.includes(
        item.duckingExpectation,
      )
      || !SAFE_ID.test(item.semanticTriggerAttentionEventId)
      || !LIVING_FRAME_ATTENTION_EVENT_TYPES.includes(
        item.semanticTriggerEventType,
      )
      || !Array.isArray(
        item.semanticTriggerMotionTrackIds,
      )
      || item.semanticTriggerMotionTrackIds.some(
        (trackId) =>
          typeof trackId !== 'string'
          || !SAFE_ID.test(trackId),
      )
      || item.semanticTriggerBound !== true
      || ![
        'required_and_matched',
        'not_required_environmental_presence',
        'not_applicable_unlinked_sound',
      ].includes(item.linkedComponentMotionPolicy)
      || item.semanticTriggerExactFramesProvided !== false
      || item.exactCuePlacementProvided !== false
      || item.exactMixProvided !== false
      || item.downstreamSoundSyncRequired !==
        (item.duckingExpectation === 'downstream_soundsync_required')
      || !soundTriggerIsConsistent(item, value))
    || value.boundMotionTracks.some((item) =>
      !SAFE_ID.test(item.componentId)
      || !LIVING_FRAME_MOTION_PROPERTIES.includes(item.property)
      || !LIVING_FRAME_MOTION_TRACK_ROLES.includes(item.role)
      || ![
        'not_applicable',
        'required_return_to_initial',
      ].includes(item.restorationExpectation))
    || !motionBudgetIsConsistent(value.motionBudget)
    || !metricsAreConsistent(value.metrics, value)
    || value.motionBudget.onePrimaryMotionGroupAtATimeVerified !== true
    || value.motionBudget.stillnessPreservedAsDesignState !== true
  ) throw invalid('Living Frame choreography output is inconsistent.')
}

function attentionCoverageIsConsistent(
  item: LivingFrameChoreographyBinding['attentionBindings'][number],
  tracks: LivingFrameChoreographyBinding['boundMotionTracks'],
): boolean {
  const byId = new Map(tracks.map((track) => [track.trackId, track]))
  const methodValid = item.methodCoverage.every((coverage) => {
    const selected = coverage.motionTrackIds.map((trackId) =>
      byId.get(trackId)).filter((track) => track !== undefined)
    if (coverage.method === 'local_contrast_expectation') {
      return coverage.coverage === 'renderer_primitive_still_required'
        && selected.length === 0
        && coverage.soundRequestIds.length === 0
    }
    if (coverage.method === 'sound_emphasis_expectation') {
      return coverage.coverage === 'semantic_sound_request_preserved'
        && selected.length === 0
        && coverage.soundRequestIds.length > 0
    }
    if (
      coverage.coverage !== 'deterministic_motion_candidate'
      || selected.length === 0
      || coverage.soundRequestIds.length > 0
    ) return false
    return selected.every((track) => {
      if (coverage.method === 'focus_depth_expectation') {
        return track.property === 'focus_depth_normalized'
          || track.property === 'blur_pixels'
      }
      if (coverage.method === 'camera_reframe_expectation') {
        return track.role === 'camera'
          && (
            track.property === 'position_x_normalized'
            || track.property === 'position_y_normalized'
          )
      }
      if (coverage.method === 'camera_push_expectation') {
        return track.role === 'camera'
          && track.property === 'scale_uniform'
      }
      if (coverage.method === 'motion_emphasis_expectation') {
        return track.role === 'primary'
      }
      return coverage.method === 'light_emphasis_expectation'
        && track.property === 'light_intensity'
    })
  })
  const restoration = item.motionTrackIds.some((trackId) =>
    byId.get(trackId)?.restorationExpectation
      === 'required_return_to_initial')
  return methodValid
    && item.restorationCandidatePresent
      === (item.eventType === 'restore' && restoration)
}

function soundTriggerIsConsistent(
  item:
    LivingFrameChoreographyBinding['soundRequestProjections'][number],
  binding: LivingFrameChoreographyBinding,
): boolean {
  const matchingAttentionBindings =
    binding.attentionBindings.filter(
      (attentionBinding) =>
        attentionBinding.soundRequestIds.includes(
          item.soundRequestId,
        ),
    )
  if (
    matchingAttentionBindings.length !== 1
    || matchingAttentionBindings[0]!.attentionEventId !==
      item.semanticTriggerAttentionEventId
    || matchingAttentionBindings[0]!.eventType !==
      item.semanticTriggerEventType
    || canonicalJsonStringify(
      matchingAttentionBindings[0]!.motionTrackIds,
    ) !== canonicalJsonStringify(
      item.semanticTriggerMotionTrackIds,
    )
  ) return false
  if (item.linkedComponentId === null) {
    return item.linkedComponentMotionPolicy ===
      'not_applicable_unlinked_sound'
  }
  if (item.purpose === 'environmental_presence') {
    return item.linkedComponentMotionPolicy ===
      'not_required_environmental_presence'
  }
  return item.linkedComponentMotionPolicy ===
    'required_and_matched'
    && item.semanticTriggerMotionTrackIds.some(
    (trackId) =>
      binding.boundMotionTracks.some(
        (track) =>
          track.trackId === trackId
          && track.componentId === item.linkedComponentId,
      ),
    )
}

function scaleTreatmentIsConsistent(
  item: LivingFrameChoreographyBinding['semanticScaleBindings'][number],
): boolean {
  const hasScaleTrack = item.motionTrackIds.length > 0
  if (item.mode === 'literal_physical') {
    return item.factualGuard === 'literal_relationship_must_be_preserved'
      && item.treatment ===
        'literal_relationship_preserved_without_component_scale'
      && !hasScaleTrack
  }
  if (item.mode === 'data_proportional') {
    return item.factualGuard === 'data_proportions_must_be_preserved'
      && item.treatment ===
        'data_proportion_preserved_without_component_scale'
      && !hasScaleTrack
  }
  if (item.mode === 'perspective') {
    return item.factualGuard === 'perspective_only'
      && item.treatment === 'perspective_scale_track_candidate'
      && hasScaleTrack
  }
  return item.factualGuard === 'symbolic_treatment_must_be_disclosed'
    && item.treatment === 'editorial_symbolic_scale_track_candidate'
    && hasScaleTrack
}

function motionBudgetIsConsistent(
  budget: LivingFrameChoreographyMotionBudget,
): boolean {
  const values = [
    budget.primaryMotionGroupCount,
    budget.maximumConcurrentTrackCount,
    budget.cameraTrackCount,
    budget.restorationTrackCount,
    budget.sceneComponentCount,
    budget.animatedSceneComponentCount,
    budget.stillSceneComponentCount,
  ]
  return values.every((value) =>
    Number.isInteger(value) && value >= 0 && value <= 100_000)
    && budget.animatedSceneComponentCount
      + budget.stillSceneComponentCount === budget.sceneComponentCount
}

function metricsAreConsistent(
  metrics: LivingFrameChoreographyMetrics,
  binding: LivingFrameChoreographyBinding,
): boolean {
  const values = [
    metrics.attentionEventCount,
    metrics.coveredAttentionMethodCount,
    metrics.rendererPrimitiveAttentionMethodCount,
    metrics.semanticScaleRequestCount,
    metrics.soundRequestCount,
    metrics.boundMotionTrackCount,
    metrics.unboundMotionTrackCount,
  ]
  const methodCount = binding.attentionBindings.reduce(
    (total, item) => total + item.methodCoverage.length,
    0,
  )
  const rendererPrimitiveMethodCount = binding.attentionBindings.reduce(
    (total, item) =>
      total + item.methodCoverage.filter((coverage) =>
        coverage.coverage === 'renderer_primitive_still_required').length,
    0,
  )
  return values.every((value) =>
    Number.isInteger(value) && value >= 0 && value <= 100_000)
    && metrics.attentionEventCount === binding.attentionBindings.length
    && metrics.coveredAttentionMethodCount
      + metrics.rendererPrimitiveAttentionMethodCount === methodCount
    && metrics.rendererPrimitiveAttentionMethodCount
      === rendererPrimitiveMethodCount
    && metrics.semanticScaleRequestCount
      === binding.semanticScaleBindings.length
    && metrics.soundRequestCount
      === binding.soundRequestProjections.length
    && metrics.boundMotionTrackCount === binding.boundMotionTracks.length
}

function bindingStateMatchesGates(
  state: LivingFrameChoreographyBinding['bindingState'],
  gates: readonly LivingFrameChoreographyOpenGate[],
): boolean {
  const hasLocalContrastGate = gates.includes(
    'local_contrast_renderer_primitive_required',
  )
  return state === 'blocked_by_unsupported_attention_or_scale_treatment'
    ? hasLocalContrastGate
    : !hasLocalContrastGate
}

function isSourceBindings(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, [
    'livingFrameComponentDigestSha256',
    'deterministicMotionBundleDigestSha256',
    'masterTimingPlanId',
    'masterTimingPlanDigestSha256',
    'outputFrameId',
    'outputFrameDigestSha256',
  ])) return false
  return SHA256.test(String(value.livingFrameComponentDigestSha256))
    && SHA256.test(String(value.deterministicMotionBundleDigestSha256))
    && SAFE_ID.test(String(value.masterTimingPlanId))
    && SHA256.test(String(value.masterTimingPlanDigestSha256))
    && SAFE_ID.test(String(value.outputFrameId))
    && SHA256.test(String(value.outputFrameDigestSha256))
}

function isAuthorityBoundary(value: unknown): boolean {
  return isRecord(value)
    && canonicalJsonStringify(value)
      === canonicalJsonStringify(AUTHORITY_BOUNDARY)
}

function isOpenGates(value: unknown): boolean {
  if (
    !Array.isArray(value)
    || new Set(value).size !== value.length
    || value.some((gate) =>
      typeof gate !== 'string'
      || !LIVING_FRAME_CHOREOGRAPHY_OPEN_GATES.includes(gate as never))
  ) return false
  return BASE_OPEN_GATES.every((gate) => value.includes(gate))
    && value.every((gate) =>
      BASE_OPEN_GATES.includes(gate as LivingFrameChoreographyOpenGate)
      || gate === 'local_contrast_renderer_primitive_required')
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalize(record[key])]),
    )
  }
  throw invalid('Living Frame choreography is not canonical JSON.')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

function invalid(message: string): Error {
  return new Error(message)
}
