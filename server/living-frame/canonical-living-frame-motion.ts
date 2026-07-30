import type {
  LivingFrameComponentPlan,
  LivingFrameScenePlan,
  LivingFrameTimingPhase,
  LivingFrameVisualVerb,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_DEPTH_BANDS,
  LIVING_FRAME_IMPORTANCE_LEVELS,
  LIVING_FRAME_VISUAL_VERBS,
} from '../../src/types/living-frame'
import type {
  CanonicalLivingFrameMotionSpec,
  CanonicalLivingFrameMotionSpecAuthorityBoundary,
  CanonicalLivingFrameMotionSpecDraft,
  CanonicalLivingFrameMotionKeyframe,
  CanonicalLivingFrameMotionTarget,
  CanonicalLivingFrameRenderableMotionProperty,
} from '../../src/types/living-frame-canonical-motion'
import {
  CANONICAL_LIVING_FRAME_DEPTH_STYLES,
  CANONICAL_LIVING_FRAME_MOTION_PROFILE,
  CANONICAL_LIVING_FRAME_MOTION_SPEC_VERSION,
  CANONICAL_LIVING_FRAME_MOTION_TARGETS,
  CANONICAL_LIVING_FRAME_RENDERABLE_MOTION_PROPERTIES,
} from '../../src/types/living-frame-canonical-motion'
import type {
  LivingFrameMotionEasing,
  LivingFrameMotionTrackDraft,
  LivingFrameMotionTrackRole,
} from '../../src/types/living-frame-deterministic-motion'
import {
  LIVING_FRAME_MOTION_EASINGS,
  LIVING_FRAME_MOTION_TRACK_ROLES,
} from '../../src/types/living-frame-deterministic-motion'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameDeterministicMotion,
} from './living-frame-deterministic-motion'

const REQUIRED_PHASES: readonly LivingFrameTimingPhase[] = [
  'prepare',
  'activate',
  'demonstrate',
  'resolve',
  'settle',
]

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/
const MAX_TRACK_COUNT = 32
const MAX_KEYFRAME_COUNT = 16
const MAX_SCENE_FRAME_COUNT = 18_000

const PROPERTY_RANGES: Record<
  CanonicalLivingFrameRenderableMotionProperty,
  readonly [number, number]
> = {
  position_x_normalized: [-2, 2],
  position_y_normalized: [-2, 2],
  rotation_degrees: [-100_000, 100_000],
  scale_uniform: [0.01, 20],
  opacity: [0, 1],
  blur_pixels: [0, 100],
  light_intensity: [0, 4],
  shadow_opacity: [0, 1],
}

const DEPTH_RANK = {
  far_background: 0,
  background: 1,
  behind_subject: 2,
  subject_plane: 3,
  in_front_of_subject: 4,
  foreground: 5,
} as const

const PARALLAX_FACTOR = {
  far_background: -0.34,
  background: -0.22,
  behind_subject: -0.1,
  subject_plane: 0,
  in_front_of_subject: 0.18,
  foreground: 0.32,
} as const

const AUTHORITY_BOUNDARY:
  CanonicalLivingFrameMotionSpecAuthorityBoundary =
    Object.freeze({
      serverDerivedFromSelectedSceneAndMasterTiming: true,
      exactFrameAuthority: false,
      masterTimingMutationAuthority: false,
      soundSyncAuthority: false,
      approvalAuthority: false,
      workGraphAuthority: false,
      rendererCodeAuthority: false,
      providerAuthority: false,
      queueAuthority: false,
      productionAuthority: false,
    })

interface MotionTrackIntent {
  readonly target: CanonicalLivingFrameMotionTarget
  readonly property: CanonicalLivingFrameRenderableMotionProperty
  readonly role: LivingFrameMotionTrackRole
  readonly values: readonly [number, number, number, number, number, number]
  readonly easings: readonly [
    LivingFrameMotionEasing,
    LivingFrameMotionEasing,
    LivingFrameMotionEasing,
    LivingFrameMotionEasing,
    LivingFrameMotionEasing,
    LivingFrameMotionEasing,
  ]
}

export function compileCanonicalLivingFrameMotionSpec(input: {
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly timingBinding:
    CanonicalLivingFrameTimingBinding
  readonly components: CanonicalPlanComponentsInput
  readonly sceneId: string
  readonly componentId: string
}): CanonicalLivingFrameMotionSpec {
  const scene =
    input.publication.binding.selectedComponent.scenePlans
      .find((candidate) =>
        candidate.sceneId === input.sceneId)
  const component =
    scene?.components.find((candidate) =>
      candidate.componentId === input.componentId)
  const timingScene =
    input.timingBinding.scenes.find((candidate) =>
      candidate.sceneId === input.sceneId)
  if (!scene || !component || !timingScene) {
    throw new Error(
      'Canonical Living Frame motion requires one selected scene, component, and exact timing binding.',
    )
  }
  assertCanonicalLivingFrameMotionLineage(input)
  if (
    timingScene.semanticPhaseBindings.length !==
      REQUIRED_PHASES.length
    || timingScene.semanticPhaseBindings.some(
      (binding, index) =>
        binding.order !== index
        || binding.phase !== REQUIRED_PHASES[index],
    )
  ) {
    throw new Error(
      'Canonical Living Frame motion requires one exact ordered five-phase MasterTiming sequence.',
    )
  }
  const phases = REQUIRED_PHASES.map((phase) => {
    const binding = timingScene.semanticPhaseBindings
      .find((candidate) => candidate.phase === phase)
    if (!binding) {
      throw new Error(
        'Canonical Living Frame motion requires all five exact semantic phases.',
      )
    }
    return binding
  })
  const segmentRange = timingScene.segmentFrameRange
  const visualRange = timingScene.visualTiming.frameRange
  if (
    phases.some((phase, index) =>
      phase.frameRange.startFrame !== (
        index === 0
          ? segmentRange.startFrame
          : phases[index - 1]!.frameRange.endFrameExclusive
      ))
    || phases[phases.length - 1]!.frameRange
      .endFrameExclusive !== segmentRange.endFrameExclusive
    || segmentRange.endFrameExclusive <=
      segmentRange.startFrame
    || segmentRange.durationFrames !==
      segmentRange.endFrameExclusive -
        segmentRange.startFrame
    || phases.some((phase) =>
      phase.frameRange.durationFrames !==
        phase.frameRange.endFrameExclusive -
          phase.frameRange.startFrame
      || phase.frameRange.durationFrames <= 0)
  ) {
    throw new Error(
      'Canonical Living Frame motion phases must exactly partition the full MasterTiming segment range.',
    )
  }
  const revealEndFrame =
    visualRange.startFrame +
      timingScene.visualTiming.revealFrames
  const exitStartFrame =
    visualRange.endFrameExclusive -
      timingScene.visualTiming.exitFrames
  if (
    visualRange.endFrameExclusive <= visualRange.startFrame
    || visualRange.durationFrames !==
      visualRange.endFrameExclusive -
        visualRange.startFrame
    || !Number.isSafeInteger(
      timingScene.visualTiming.revealFrames,
    )
    || timingScene.visualTiming.revealFrames < 2
    || !Number.isSafeInteger(
      timingScene.visualTiming.holdFrames,
    )
    || timingScene.visualTiming.holdFrames < 1
    || !Number.isSafeInteger(
      timingScene.visualTiming.exitFrames,
    )
    || timingScene.visualTiming.exitFrames < 2
    || timingScene.visualTiming.revealFrames +
      timingScene.visualTiming.holdFrames +
      timingScene.visualTiming.exitFrames !==
        visualRange.durationFrames
    || phases[0]!.frameRange.endFrameExclusive !==
      visualRange.startFrame
    || phases[1]!.frameRange.startFrame !==
      visualRange.startFrame
    || phases[1]!.frameRange.endFrameExclusive !==
      revealEndFrame
    || phases[1]!.frameRange.durationFrames !==
      timingScene.visualTiming.revealFrames
    || phases[2]!.frameRange.startFrame !==
      revealEndFrame
    || phases[2]!.frameRange.endFrameExclusive !==
      exitStartFrame
    || phases[2]!.frameRange.durationFrames !==
      timingScene.visualTiming.holdFrames
    || phases[3]!.frameRange.startFrame !==
      exitStartFrame
    || phases[3]!.frameRange.endFrameExclusive !==
      visualRange.endFrameExclusive
    || phases[3]!.frameRange.durationFrames !==
      timingScene.visualTiming.exitFrames
    || phases[4]!.frameRange.startFrame !==
      visualRange.endFrameExclusive
  ) {
    throw new Error(
      'Canonical Living Frame motion visual reveal, hold, exit, and semantic phase boundaries diverged.',
    )
  }
  const revealMidFrame = Math.min(
    revealEndFrame - 1,
    Math.max(
      visualRange.startFrame + 1,
      visualRange.startFrame + Math.floor(
        timingScene.visualTiming.revealFrames / 2,
      ),
    ),
  )
  const exitMidFrame = Math.min(
    visualRange.endFrameExclusive - 2,
    Math.max(
      exitStartFrame + 1,
      exitStartFrame + Math.floor(
        timingScene.visualTiming.exitFrames / 2,
      ),
    ),
  )
  const visualMotionFrames = [
    visualRange.startFrame,
    revealMidFrame,
    revealEndFrame,
    exitStartFrame,
    exitMidFrame,
    visualRange.endFrameExclusive - 1,
  ] as const
  if (
    new Set(visualMotionFrames).size !==
      visualMotionFrames.length
    || visualMotionFrames.some((frame, index) =>
      !Number.isSafeInteger(frame)
      || frame < visualRange.startFrame
      || frame >= visualRange.endFrameExclusive
      || (
        index > 0
        && frame <= visualMotionFrames[index - 1]!
      ))
  ) {
    throw new Error(
      'Canonical Living Frame visual timing is too short for six distinct bounded motion keyframes.',
    )
  }

  const depthStyle = deriveDepthStyle(scene)
  const trackIntents = deriveTrackIntents({
    scene,
    component,
    depthStyle,
  })
  const trackTargets = new Map<string, CanonicalLivingFrameMotionTarget>()
  const drafts: LivingFrameMotionTrackDraft[] =
    trackIntents.map((intent, order) => {
      const trackId = `lf.track.${
        sha256AuthorityValue({
          sceneId: scene.sceneId,
          componentId: component.componentId,
          target: intent.target,
          property: intent.property,
        }).slice(0, 32)
      }`
      trackTargets.set(trackId, intent.target)
      return {
        trackId,
        order,
        motionGroupId:
          intent.role === 'camera'
            ? `lf.camera.${
                sha256AuthorityValue(scene.sceneId).slice(0, 24)
              }`
            : `lf.layer.${
                sha256AuthorityValue(component.componentId).slice(0, 24)
              }`,
        componentId:
          intent.target === 'virtual_camera'
            ? `lf.camera.${
                sha256AuthorityValue(scene.sceneId).slice(0, 24)
              }`
            : component.componentId,
        property: intent.property,
        role: intent.role,
        restorationExpectation:
          intent.target === 'source'
          || intent.target === 'virtual_camera'
            ? 'required_return_to_initial'
            : 'not_applicable',
        keyframes: visualMotionFrames.map((frame, index) => ({
          frame,
          value: intent.values[index]!,
          easingToNext: intent.easings[index]!,
        })),
      }
    })
  const masterTimingPlanId =
    input.publication.binding.selectedComponent.inputBindings
      .masterTiming.expectationRefId
  if (!safeId(masterTimingPlanId)) {
    throw new Error(
      'Canonical Living Frame motion MasterTiming identity is invalid.',
    )
  }
  const outputFrameId =
    input.publication.binding.selectedComponent.inputBindings
      .outputFrame.expectationRefId
  const deterministicMotion =
    compileLivingFrameDeterministicMotion({
      timingExpectation: {
        masterTimingPlanId,
        masterTimingPlanDigestSha256:
          input.timingBinding.sourceBindings
            .currentMasterTimingDigestSha256,
        outputFrameId,
        outputFrameDigestSha256:
          input.publication.binding.sourceBindings
            .confirmedOutputFrameDigestSha256,
        sceneId: scene.sceneId,
        sceneStartFrame: visualRange.startFrame,
        sceneEndFrame:
          visualRange.endFrameExclusive - 1,
        fpsNumerator: input.timingBinding.fps,
        fpsDenominator: 1,
        timingAuthorityRevalidationRequired: true,
      },
      tracks: drafts,
    })
  const tracks = deterministicMotion.tracks.map((track) => {
    const keyframes = track.sourceKeyframes.map((keyframe) => ({
      frameOffset:
        keyframe.frame - visualRange.startFrame,
      value: keyframe.value,
      easingToNext: keyframe.easingToNext,
    }))
    const sceneFrameCount =
      visualRange.endFrameExclusive -
        visualRange.startFrame
    const compiledSampleDigestSha256 =
      deriveCanonicalLivingFrameCompiledSampleDigestSha256({
        keyframes,
        sceneFrameCount,
      })
    const deterministicSampleDigestSha256 =
      sha256AuthorityValue(
        track.samples.map((sample) => ({
          frameOffset:
            sample.frame - visualRange.startFrame,
          value: sample.value,
        })),
      )
    if (
      compiledSampleDigestSha256 !==
        deterministicSampleDigestSha256
    ) {
      throw new Error(
        'Canonical Living Frame motion sampling diverged from its deterministic compiler.',
      )
    }
    return {
      trackId: track.trackId,
      order: track.order,
      target: trackTargets.get(track.trackId)!,
      property: track.property as
        CanonicalLivingFrameRenderableMotionProperty,
      role: track.role,
      keyframes,
      compiledSampleCount: track.samples.length,
      compiledSampleDigestSha256,
    }
  })
  const draft: CanonicalLivingFrameMotionSpecDraft = {
    schemaVersion:
      CANONICAL_LIVING_FRAME_MOTION_SPEC_VERSION,
    motionProfileId:
      CANONICAL_LIVING_FRAME_MOTION_PROFILE,
    sceneId: scene.sceneId,
    componentId: component.componentId,
    sceneStartFrame: visualRange.startFrame,
    sceneEndFrameExclusive:
      visualRange.endFrameExclusive,
    visualVerb: scene.visualVerb,
    importance: scene.importance,
    depthStyle,
    depthBand: component.depthBand,
    parallaxFactor:
      PARALLAX_FACTOR[component.depthBand],
    sourceBindings: {
      selectedSceneBindingDigestSha256:
        input.publication.binding.bindingDigestSha256,
      timingBindingDigestSha256:
        input.timingBinding.timingBindingDigestSha256,
      deterministicMotionBundleDigestSha256:
        deterministicMotion.bundleDigestSha256,
    },
    attentionEventIds:
      scene.attentionSequence.map((event) =>
        event.attentionEventId),
    semanticScaleRequestIds:
      scene.semanticScaleRequests
        .filter((request) =>
          request.componentId === component.componentId)
        .map((request) =>
          request.semanticScaleRequestId),
    tracks,
    metrics: {
      layerTrackCount: tracks.filter((track) =>
        track.target === 'layer').length,
      cameraTrackCount: tracks.filter((track) =>
        track.target === 'virtual_camera').length,
      sourceTrackCount: tracks.filter((track) =>
        track.target === 'source').length,
      keyframeCount: tracks.reduce(
        (total, track) =>
          total + track.keyframes.length,
        0,
      ),
      compiledSampleCount:
        deterministicMotion.metrics.sampleCount,
    },
    authorityBoundary: AUTHORITY_BOUNDARY,
    exactFramesRemainOwnedByMasterTiming: true,
    captionsRemainAboveLivingFrame: true,
    containsExecutableOrOperationalPayload: false,
    subjectSpecificRouting: false,
  }
  return {
    ...draft,
    motionSpecDigestSha256:
      sha256AuthorityValue(draft),
  }
}

function assertCanonicalLivingFrameMotionLineage(input: {
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly timingBinding:
    CanonicalLivingFrameTimingBinding
  readonly components: CanonicalPlanComponentsInput
}): void {
  const currentMasterTimingDigestSha256 =
    sha256AuthorityValue(input.components.masterTimingPlan)
  const confirmedOutputFrameDigestSha256 =
    sha256AuthorityValue(
      input.components.confirmedSettings.outputFrame,
    )
  if (
    input.publication.binding.bindingDigestSha256 !==
      input.timingBinding.sourceBindings
        .selectedSceneBindingDigestSha256
    || input.publication.binding.sourceBindings
      .currentMasterTimingDigestSha256 !==
        currentMasterTimingDigestSha256
    || input.timingBinding.sourceBindings
      .currentMasterTimingDigestSha256 !==
        currentMasterTimingDigestSha256
    || input.timingBinding.sourceBindings
      .confirmedOutputFrameDigestSha256 !==
        confirmedOutputFrameDigestSha256
    || input.timingBinding.timingBindingDigestSha256 !==
      sha256AuthorityValue(
        withoutTimingBindingDigest(input.timingBinding),
      )
  ) {
    throw new Error(
      'Canonical Living Frame motion selected-scene, MasterTiming, output-frame, or timing-binding lineage diverged.',
    )
  }
}

export function verifyCanonicalLivingFrameMotionSpec(
  value: unknown,
): value is CanonicalLivingFrameMotionSpec {
  if (!isRecord(value)) return false
  const spec =
    value as unknown as CanonicalLivingFrameMotionSpec
  if (
    !hasExactKeys(value, [
      'attentionEventIds',
      'authorityBoundary',
      'captionsRemainAboveLivingFrame',
      'componentId',
      'containsExecutableOrOperationalPayload',
      'depthBand',
      'depthStyle',
      'exactFramesRemainOwnedByMasterTiming',
      'importance',
      'metrics',
      'motionProfileId',
      'motionSpecDigestSha256',
      'parallaxFactor',
      'sceneEndFrameExclusive',
      'sceneId',
      'sceneStartFrame',
      'schemaVersion',
      'semanticScaleRequestIds',
      'sourceBindings',
      'subjectSpecificRouting',
      'tracks',
      'visualVerb',
    ])
    ||
    spec.schemaVersion !==
      CANONICAL_LIVING_FRAME_MOTION_SPEC_VERSION
    || spec.motionProfileId !==
      CANONICAL_LIVING_FRAME_MOTION_PROFILE
    || !safeId(spec.sceneId)
    || !safeId(spec.componentId)
    || !Number.isSafeInteger(spec.sceneStartFrame)
    || spec.sceneStartFrame < 0
    || !Number.isSafeInteger(spec.sceneEndFrameExclusive)
    || spec.sceneEndFrameExclusive <= spec.sceneStartFrame
    || spec.sceneEndFrameExclusive - spec.sceneStartFrame >
      MAX_SCENE_FRAME_COUNT
    || !includesString(
      LIVING_FRAME_VISUAL_VERBS,
      spec.visualVerb,
    )
    || !includesString(
      LIVING_FRAME_IMPORTANCE_LEVELS,
      spec.importance,
    )
    || !CANONICAL_LIVING_FRAME_DEPTH_STYLES.includes(
      spec.depthStyle,
    )
    || !includesString(
      LIVING_FRAME_DEPTH_BANDS,
      spec.depthBand,
    )
    || !Number.isFinite(spec.parallaxFactor)
    || spec.parallaxFactor < -1
    || spec.parallaxFactor > 1
    || !validSourceBindings(spec.sourceBindings)
    || !safeIdArray(spec.attentionEventIds)
    || !safeIdArray(spec.semanticScaleRequestIds)
    || !validTracks(spec)
    || !validMetrics(spec)
    || !validAuthorityBoundary(spec.authorityBoundary)
    || spec.exactFramesRemainOwnedByMasterTiming !== true
    || spec.captionsRemainAboveLivingFrame !== true
    || spec.containsExecutableOrOperationalPayload !== false
    || spec.subjectSpecificRouting !== false
    || !SHA256.test(spec.motionSpecDigestSha256)
    || spec.motionSpecDigestSha256 !==
      sha256AuthorityValue(withoutDigest(spec))
  ) return false
  return true
}

export function deriveCanonicalLivingFrameCompiledSampleDigestSha256(
  input: {
    readonly keyframes:
      readonly CanonicalLivingFrameMotionKeyframe[]
    readonly sceneFrameCount: number
  },
): string {
  if (
    !Number.isSafeInteger(input.sceneFrameCount)
    || input.sceneFrameCount < 2
    || input.sceneFrameCount > MAX_SCENE_FRAME_COUNT
    || !Array.isArray(input.keyframes)
    || input.keyframes.length < 2
    || input.keyframes.length > MAX_KEYFRAME_COUNT
    || input.keyframes[0]?.frameOffset !== 0
    || input.keyframes[input.keyframes.length - 1]
      ?.frameOffset !== input.sceneFrameCount - 1
  ) {
    throw new Error(
      'Canonical Living Frame compiled-sample digest input is invalid.',
    )
  }
  return sha256AuthorityValue(
    Array.from(
      { length: input.sceneFrameCount },
      (_, frameOffset) => ({
        frameOffset,
        value: sampleCanonicalLivingFrameKeyframes(
          input.keyframes,
          frameOffset,
        ),
      }),
    ),
  )
}

function deriveTrackIntents(input: {
  readonly scene: LivingFrameScenePlan
  readonly component: LivingFrameComponentPlan
  readonly depthStyle:
    (typeof CANONICAL_LIVING_FRAME_DEPTH_STYLES)[number]
}): MotionTrackIntent[] {
  const { scene, component } = input
  const subtle = scene.decision === 'use_subtle'
    || scene.importance === 'support'
  const semanticScale =
    scene.semanticScaleRequests.find((request) =>
      request.componentId === component.componentId)
  const preserveLiteralScale =
    semanticScale?.mode === 'literal_physical'
    || semanticScale?.mode === 'data_proportional'
    || component.role === 'exact_map_component'
    || component.role === 'exact_data_component'
  const scale = preserveLiteralScale
    ? [1, 1, 1, 1, 1, 1] as const
    : scaleValues(scene.visualVerb, subtle)
  const x = horizontalValues(scene.visualVerb, subtle)
  const y = verticalValues(scene.visualVerb, subtle)
  const tracks: MotionTrackIntent[] = [{
    target: 'layer',
    property: 'opacity',
    role: 'primary',
    values: [0, 0.18, 1, 1, 0.76, 0],
    easings: [
      'ease_out_quad',
      'ease_in_out_cubic',
      'hold',
      'settle_out',
      'ease_in_out_cubic',
      'hold',
    ],
  }, {
    target: 'layer',
    property: 'scale_uniform',
    role: 'primary',
    values: scale,
    easings: [
      'ease_out_quad',
      'ease_in_out_cubic',
      'hold',
      'settle_out',
      'ease_in_out_cubic',
      'hold',
    ],
  }]
  if (x.some((value) => value !== 0)) {
    tracks.push({
      target: 'layer',
      property: 'position_x_normalized',
      role: 'primary',
      values: x,
      easings: standardEasings(),
    })
  }
  if (y.some((value) => value !== 0)) {
    tracks.push({
      target: 'layer',
      property: 'position_y_normalized',
      role: 'primary',
      values: y,
      easings: standardEasings(),
    })
  }
  if (scene.visualVerb === 'rotate') {
    tracks.push({
      target: 'layer',
      property: 'rotation_degrees',
      role: 'primary',
      values: [
        0,
        subtle ? 8 : 18,
        subtle ? 120 : 360,
        subtle ? 210 : 720,
        subtle ? 240 : 780,
        subtle ? 240 : 780,
      ],
      easings: [
        'mechanical_accelerate',
        'mechanical_accelerate',
        'linear',
        'settle_out',
        'hold',
        'hold',
      ],
    })
  }
  if (input.depthStyle !== 'flat') {
    tracks.push({
      target: 'layer',
      property: 'shadow_opacity',
      role: 'secondary',
      values: [0, 0.1, 0.22, 0.22, 0.12, 0],
      easings: standardEasings(),
    })
  }
  const focusHandoff =
    scene.attentionSequence.some((event) =>
      event.eventType === 'handoff'
      && event.target === 'visual'
      && event.methods.some((method) =>
        method === 'focus_depth_expectation'
        || method === 'local_contrast_expectation'))
  if (
    focusHandoff
    && (
      scene.mode === 'living_a_roll'
      || scene.mode === 'hybrid_expansion'
    )
  ) {
    const blur = subtle ? 2.4 : scene.importance === 'hero'
      ? 6
      : 4
    tracks.push({
      target: 'source',
      property: 'blur_pixels',
      role: 'secondary',
      values: [0, 0, blur, blur, 0, 0],
      easings: standardEasings(),
    })
  }
  const lightEmphasis =
    scene.attentionSequence.some((event) =>
      event.methods.includes(
        'light_emphasis_expectation',
      ))
  if (lightEmphasis) {
    tracks.push({
      target: 'layer',
      property: 'light_intensity',
      role: 'secondary',
      values: [1, 1.02, 1.12, 1.12, 1.02, 1],
      easings: standardEasings(),
    })
  }
  const cameraRequested =
    input.depthStyle !== 'flat'
    && (
      scene.skillActivations.some((activation) =>
        activation.miniSkillKey ===
          'camera_choreography'
        && activation.decision !== 'do_not_use')
      || scene.attentionSequence.some((event) =>
        event.methods.some((method) =>
          method === 'camera_push_expectation'
          || method === 'camera_reframe_expectation'))
    )
  if (cameraRequested) {
    const cameraScale = subtle
      ? 1.018
      : scene.importance === 'hero'
        ? 1.07
        : 1.04
    tracks.push({
      target: 'virtual_camera',
      property: 'scale_uniform',
      role: 'camera',
      values: [
        1,
        1,
        cameraScale,
        cameraScale,
        1,
        1,
      ],
      easings: standardEasings(),
    }, {
      target: 'virtual_camera',
      property: 'position_x_normalized',
      role: 'camera',
      values: [
        0,
        0,
        subtle ? 0.006 : 0.012,
        subtle ? 0.01 : 0.02,
        0,
        0,
      ],
      easings: standardEasings(),
    })
  }
  return tracks
}

function deriveDepthStyle(
  scene: LivingFrameScenePlan,
): (typeof CANONICAL_LIVING_FRAME_DEPTH_STYLES)[number] {
  const ranks = uniqueSortedNumbers(
    scene.components.map((component) =>
      DEPTH_RANK[component.depthBand]),
  )
  const cameraOrOrbit =
    scene.skillActivations.some((activation) =>
      (
        activation.miniSkillKey ===
          'camera_choreography'
        || activation.miniSkillKey ===
          'visual_orbit'
      )
      && activation.decision !== 'do_not_use')
  if (
    ranks.length >= 3
    && (
      scene.mode === 'living_archive'
      || scene.mode === 'hybrid_expansion'
      || scene.importance === 'hero'
    )
  ) return 'deep_multiplane'
  if (ranks.length >= 2 || cameraOrOrbit) {
    return 'shallow_2_5d'
  }
  return 'flat'
}

function scaleValues(
  verb: LivingFrameVisualVerb,
  subtle: boolean,
): readonly [number, number, number, number, number, number] {
  const amplitude = subtle ? 0.055 : 0.12
  switch (verb) {
    case 'expand':
    case 'approach':
    case 'surround':
      return [
        1 - amplitude,
        1 - amplitude * 0.7,
        1,
        1 + amplitude * 0.45,
        1,
        1,
      ]
    case 'contract':
    case 'restrict':
    case 'retreat':
      return [
        1 + amplitude * 0.45,
        1 + amplitude * 0.35,
        1,
        1 - amplitude,
        1,
        1,
      ]
    case 'reveal':
    case 'transform':
      return [
        1 - amplitude * 0.55,
        1 - amplitude * 0.35,
        1,
        1.01,
        1,
        1,
      ]
    default:
      return [1, 1, 1, 1.012, 1, 1]
  }
}

function horizontalValues(
  verb: LivingFrameVisualVerb,
  subtle: boolean,
): readonly [number, number, number, number, number, number] {
  const distance = subtle ? 0.025 : 0.065
  switch (verb) {
    case 'converge':
    case 'connect':
    case 'approach':
      return [
        -distance,
        -distance * 0.65,
        0,
        distance * 0.18,
        0,
        0,
      ]
    case 'separate':
    case 'retreat':
      return [
        0,
        0,
        distance * 0.22,
        distance,
        distance * 0.35,
        0,
      ]
    default:
      return [0, 0, 0, 0, 0, 0]
  }
}

function verticalValues(
  verb: LivingFrameVisualVerb,
  subtle: boolean,
): readonly [number, number, number, number, number, number] {
  const distance = subtle ? 0.016 : 0.038
  if (verb === 'reveal' || verb === 'transform') {
    return [
      distance,
      distance * 0.7,
      0,
      -distance * 0.12,
      0,
      0,
    ]
  }
  return [0, 0, 0, 0, 0, 0]
}

function standardEasings(): MotionTrackIntent['easings'] {
  return [
    'ease_out_quad',
    'ease_in_out_cubic',
    'hold',
    'settle_out',
    'ease_in_out_cubic',
    'hold',
  ]
}

function withoutDigest(
  value: CanonicalLivingFrameMotionSpec,
): CanonicalLivingFrameMotionSpecDraft {
  const {
    motionSpecDigestSha256: _digest,
    ...draft
  } = value
  void _digest
  return draft
}

function withoutTimingBindingDigest(
  value: CanonicalLivingFrameTimingBinding,
): Omit<
  CanonicalLivingFrameTimingBinding,
  'timingBindingDigestSha256'
> {
  const {
    timingBindingDigestSha256: _digest,
    ...draft
  } = value
  void _digest
  return draft
}

function validSourceBindings(
  value: unknown,
): value is CanonicalLivingFrameMotionSpec['sourceBindings'] {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'deterministicMotionBundleDigestSha256',
      'selectedSceneBindingDigestSha256',
      'timingBindingDigestSha256',
    ])
  ) return false
  return (
    typeof value.selectedSceneBindingDigestSha256 === 'string'
    && SHA256.test(value.selectedSceneBindingDigestSha256)
    && typeof value.timingBindingDigestSha256 === 'string'
    && SHA256.test(value.timingBindingDigestSha256)
    && typeof value.deterministicMotionBundleDigestSha256 ===
      'string'
    && SHA256.test(
      value.deterministicMotionBundleDigestSha256,
    )
  )
}

function validTracks(
  spec: CanonicalLivingFrameMotionSpec,
): boolean {
  if (
    !Array.isArray(spec.tracks)
    || spec.tracks.length < 1
    || spec.tracks.length > MAX_TRACK_COUNT
  ) return false
  const trackIds = new Set<string>()
  const targetProperties = new Set<string>()
  return spec.tracks.every((track, order) => {
    const trackRecord = track as unknown
    if (
      !isRecord(trackRecord)
      || !hasExactKeys(trackRecord, [
        'compiledSampleCount',
        'compiledSampleDigestSha256',
        'keyframes',
        'order',
        'property',
        'role',
        'target',
        'trackId',
      ])
      || !safeId(track.trackId)
      || trackIds.has(track.trackId)
      || track.order !== order
      || !CANONICAL_LIVING_FRAME_MOTION_TARGETS.includes(
        track.target as CanonicalLivingFrameMotionTarget,
      )
      || !CANONICAL_LIVING_FRAME_RENDERABLE_MOTION_PROPERTIES
        .includes(
          track.property as
            CanonicalLivingFrameRenderableMotionProperty,
        )
      || !includesString(
        LIVING_FRAME_MOTION_TRACK_ROLES,
        track.role,
      )
      || !validTargetProperty(
        track.target as CanonicalLivingFrameMotionTarget,
        track.property as
          CanonicalLivingFrameRenderableMotionProperty,
      )
      || targetProperties.has(
        `${String(track.target)}:${String(track.property)}`,
      )
      || !Array.isArray(track.keyframes)
      || track.keyframes.length < 2
      || track.keyframes.length > MAX_KEYFRAME_COUNT
      || !Number.isSafeInteger(track.compiledSampleCount)
      || track.compiledSampleCount !==
        spec.sceneEndFrameExclusive -
          spec.sceneStartFrame
      || typeof track.compiledSampleDigestSha256 !== 'string'
      || !SHA256.test(track.compiledSampleDigestSha256)
    ) return false
    trackIds.add(track.trackId)
    targetProperties.add(
      `${String(track.target)}:${String(track.property)}`,
    )
    let previousFrameOffset = -1
    const property = track.property as
      CanonicalLivingFrameRenderableMotionProperty
    const keyframesValid = track.keyframes.every((
      keyframe: CanonicalLivingFrameMotionKeyframe,
      index: number,
    ) => {
      const keyframeRecord = keyframe as unknown
      if (
        !isRecord(keyframeRecord)
        || !hasExactKeys(keyframeRecord, [
          'easingToNext',
          'frameOffset',
          'value',
        ])
        || !Number.isSafeInteger(keyframe.frameOffset)
        || keyframe.frameOffset <= previousFrameOffset
        || keyframe.frameOffset < 0
        || keyframe.frameOffset >=
          spec.sceneEndFrameExclusive -
            spec.sceneStartFrame
        || !Number.isFinite(keyframe.value)
        || !validPropertyValue(property, keyframe.value)
        || !includesString(
          LIVING_FRAME_MOTION_EASINGS,
          keyframe.easingToNext,
        )
        || (
          index === 0
          && keyframe.frameOffset !== 0
        )
        || (
          index === track.keyframes.length - 1
          && keyframe.frameOffset !==
            spec.sceneEndFrameExclusive -
              spec.sceneStartFrame - 1
        )
      ) return false
      previousFrameOffset = keyframe.frameOffset
      return true
    })
    if (!keyframesValid) return false
    return (
      track.compiledSampleDigestSha256 ===
        deriveCanonicalLivingFrameCompiledSampleDigestSha256({
          keyframes: track.keyframes,
          sceneFrameCount:
            spec.sceneEndFrameExclusive -
              spec.sceneStartFrame,
        })
    )
  })
}

function sampleCanonicalLivingFrameKeyframes(
  keyframes: readonly CanonicalLivingFrameMotionKeyframe[],
  frameOffset: number,
): number {
  const final = keyframes[keyframes.length - 1]!
  if (frameOffset >= final.frameOffset) {
    return roundedMotionValue(final.value)
  }
  for (
    let index = 0;
    index < keyframes.length - 1;
    index += 1
  ) {
    const from = keyframes[index]!
    const to = keyframes[index + 1]!
    if (
      frameOffset < from.frameOffset
      || frameOffset > to.frameOffset
    ) continue
    const progress =
      (frameOffset - from.frameOffset)
      / (to.frameOffset - from.frameOffset)
    const eased = applyCanonicalLivingFrameEasing(
      from.easingToNext,
      progress,
    )
    return roundedMotionValue(
      from.value + (to.value - from.value) * eased,
    )
  }
  return roundedMotionValue(keyframes[0]!.value)
}

function applyCanonicalLivingFrameEasing(
  easing: LivingFrameMotionEasing,
  progress: number,
): number {
  switch (easing) {
    case 'linear':
      return progress
    case 'hold':
      return progress < 1 ? 0 : 1
    case 'ease_in_quad':
    case 'mechanical_accelerate':
      return progress ** 2
    case 'ease_out_quad':
      return 1 - (1 - progress) ** 2
    case 'ease_in_out_cubic':
      return progress < 0.5
        ? 4 * progress ** 3
        : 1 - (-2 * progress + 2) ** 3 / 2
    case 'strike_accelerate':
      return progress ** 5
    case 'settle_out':
      return 1 - (1 - progress) ** 3
  }
}

function roundedMotionValue(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

function validTargetProperty(
  target: CanonicalLivingFrameMotionTarget,
  property:
    CanonicalLivingFrameRenderableMotionProperty,
): boolean {
  if (target === 'virtual_camera') {
    return (
      property === 'position_x_normalized'
      || property === 'position_y_normalized'
      || property === 'scale_uniform'
    )
  }
  if (target === 'source') {
    return (
      property === 'position_x_normalized'
      || property === 'position_y_normalized'
      || property === 'scale_uniform'
      || property === 'opacity'
      || property === 'blur_pixels'
      || property === 'light_intensity'
    )
  }
  return true
}

function validMetrics(
  spec: CanonicalLivingFrameMotionSpec,
): boolean {
  const metrics = spec.metrics
  if (
    !isRecord(metrics)
    || !hasExactKeys(metrics, [
      'cameraTrackCount',
      'compiledSampleCount',
      'keyframeCount',
      'layerTrackCount',
      'sourceTrackCount',
    ])
  ) return false
  const layerTrackCount = spec.tracks.filter(
    (track) => track.target === 'layer',
  ).length
  const cameraTrackCount = spec.tracks.filter(
    (track) => track.target === 'virtual_camera',
  ).length
  const sourceTrackCount = spec.tracks.filter(
    (track) => track.target === 'source',
  ).length
  const keyframeCount = spec.tracks.reduce(
    (total, track) => total + track.keyframes.length,
    0,
  )
  const compiledSampleCount = spec.tracks.reduce(
    (total, track) =>
      total + track.compiledSampleCount,
    0,
  )
  return (
    metrics.layerTrackCount === layerTrackCount
    && metrics.cameraTrackCount === cameraTrackCount
    && metrics.sourceTrackCount === sourceTrackCount
    && metrics.keyframeCount === keyframeCount
    && metrics.compiledSampleCount === compiledSampleCount
  )
}

function validAuthorityBoundary(
  value: unknown,
): value is CanonicalLivingFrameMotionSpecAuthorityBoundary {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'approvalAuthority',
      'exactFrameAuthority',
      'masterTimingMutationAuthority',
      'productionAuthority',
      'providerAuthority',
      'queueAuthority',
      'rendererCodeAuthority',
      'serverDerivedFromSelectedSceneAndMasterTiming',
      'soundSyncAuthority',
      'workGraphAuthority',
    ])
  ) return false
  return (
    value.serverDerivedFromSelectedSceneAndMasterTiming === true
    && value.exactFrameAuthority === false
    && value.masterTimingMutationAuthority === false
    && value.soundSyncAuthority === false
    && value.approvalAuthority === false
    && value.workGraphAuthority === false
    && value.rendererCodeAuthority === false
    && value.providerAuthority === false
    && value.queueAuthority === false
    && value.productionAuthority === false
  )
}

function validPropertyValue(
  property:
    CanonicalLivingFrameRenderableMotionProperty,
  value: number,
): boolean {
  const [minimum, maximum] = PROPERTY_RANGES[property]
  return value >= minimum && value <= maximum
}

function safeIdArray(
  value: readonly string[],
): boolean {
  return (
    Array.isArray(value)
    && value.length <= 64
    && value.every(safeId)
    && new Set(value).size === value.length
  )
}

function safeId(value: unknown): value is string {
  return (
    typeof value === 'string'
    && SAFE_ID.test(value)
    && !value.includes('..')
  )
}

function includesString(
  values: readonly string[],
  value: unknown,
): value is string {
  return (
    typeof value === 'string'
    && values.includes(value)
  )
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const received = Object.keys(value).sort()
  const expected = [...keys].sort()
  return (
    received.length === expected.length
    && received.every(
      (key, index) => key === expected[index],
    )
  )
}

function uniqueSortedNumbers(
  values: readonly number[],
): number[] {
  return [...new Set(values)].sort((left, right) =>
    left - right)
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value),
  )
}
