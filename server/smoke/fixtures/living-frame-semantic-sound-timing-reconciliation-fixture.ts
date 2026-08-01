import type {
  LivingFrameAttentionTrackBindingDraft,
  LivingFrameSemanticScaleTrackBindingDraft,
} from '../../../src/types/living-frame-choreography-binding'
import type {
  LivingFrameMotionTrackDraft,
} from '../../../src/types/living-frame-deterministic-motion'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../../src/types/living-frame-selected-scene-binding'
import {
  compileCanonicalLivingFrameExecutionRequirements,
} from '../../living-frame/canonical-living-frame-execution-requirements'
import {
  compileCanonicalLivingFrameTimingBinding,
} from '../../living-frame/canonical-living-frame-timing-binding'
import {
  compileLivingFrameChoreographyBinding,
} from '../../living-frame/living-frame-choreography-binding'
import {
  compileLivingFrameDeterministicMotion,
} from '../../living-frame/living-frame-deterministic-motion'
import {
  reconcileLivingFrameSemanticSoundTiming,
} from '../../living-frame/living-frame-semantic-sound-timing-reconciliation'
import {
  createLivingFrameSelectedSceneVisualContinuityPackBindingSmokeFixture,
  type LivingFrameSelectedSceneFixtureScenario,
} from './living-frame-selected-scene-visual-continuity-pack-binding-fixture'

let sequence = 0

export async function createLivingFrameSemanticSoundTimingReconciliationSmokeFixture(
  scenario: LivingFrameSelectedSceneFixtureScenario,
) {
  const suffix = nextId()
  const selectedFixture =
    await createLivingFrameSelectedSceneVisualContinuityPackBindingSmokeFixture({
      scenario,
    })
  const components = selectedFixture.input.components
  const publication:
    CanonicalLivingFrameSelectedScenePublication = {
      binding: selectedFixture.input.selectedSceneBinding,
      admission: selectedFixture.input.selectedSceneAdmission,
      semanticPlanProjection:
        selectedFixture.input.semanticPlanProjection,
    }
  const requirements =
    compileCanonicalLivingFrameExecutionRequirements({
      publication,
      components,
    })
  const canonicalTimingBinding =
    compileCanonicalLivingFrameTimingBinding({
      publication,
      requirements,
      components,
    })
  const scene =
    publication.binding.selectedComponent.scenePlans[0]!
  const requirement = requirements.scenes[0]!
  const motionBundle =
    compileLivingFrameDeterministicMotion({
      timingExpectation: {
        masterTimingPlanId:
          publication.binding.selectedComponent
            .inputBindings.masterTiming.expectationRefId,
        masterTimingPlanDigestSha256:
          publication.binding.selectedComponent
            .inputBindings.masterTiming
            .expectedDigestSha256,
        outputFrameId:
          publication.binding.selectedComponent
            .inputBindings.outputFrame.expectationRefId,
        outputFrameDigestSha256:
          publication.binding.selectedComponent
            .inputBindings.outputFrame
            .expectedDigestSha256,
        sceneId: scene.sceneId,
        sceneStartFrame: requirement.startFrame,
        sceneEndFrame:
          requirement.endFrameExclusive - 1,
        fpsNumerator: canonicalTimingBinding.fps,
        fpsDenominator: 1,
        timingAuthorityRevalidationRequired: true,
      },
      tracks: motionTracks({
        scenario,
        startFrame: requirement.startFrame,
        endFrame: requirement.endFrameExclusive - 1,
      }),
    })
  const attentionTrackBindings =
    attentionBindings({
      scenario,
      scene,
    })
  const semanticScaleTrackBindings:
    readonly LivingFrameSemanticScaleTrackBindingDraft[] =
    scene.semanticScaleRequests.map((request) => ({
      semanticScaleRequestId:
        request.semanticScaleRequestId,
      motionTrackIds: [],
    }))
  const choreographyBinding =
    await compileLivingFrameChoreographyBinding({
      livingFrameComponent:
        publication.binding.selectedComponent,
      sceneId: scene.sceneId,
      motionBundle,
      attentionTrackBindings,
      semanticScaleTrackBindings,
    })
  const input = {
    reconciliationId:
      `living-frame.semantic-sound-timing.${scenario}.${suffix}`,
    choreographyBinding,
    canonicalTimingBinding,
    publication,
    requirements,
    components,
  } as const
  const reconciliation =
    reconcileLivingFrameSemanticSoundTiming(input)
  return {
    scenario,
    selectedFixture,
    input,
    reconciliation,
  }
}

function motionTracks(input: {
  readonly scenario: LivingFrameSelectedSceneFixtureScenario
  readonly startFrame: number
  readonly endFrame: number
}): readonly LivingFrameMotionTrackDraft[] {
  const midpoint =
    input.startFrame
    + Math.floor(
      (input.endFrame - input.startFrame) / 2,
    )
  if (input.scenario === 'musashi') {
    return [
      {
        trackId: 'track.semantic-sound.musashi-strike',
        order: 0,
        motionGroupId:
          'motion.semantic-sound.musashi-primary',
        componentId: 'component.sword',
        property: 'rotation_degrees',
        role: 'primary',
        restorationExpectation: 'not_applicable',
        keyframes: [
          {
            frame: input.startFrame,
            value: -8,
            easingToNext: 'ease_in_out_cubic',
          },
          {
            frame: midpoint,
            value: 38,
            easingToNext: 'settle_out',
          },
          {
            frame: input.endFrame,
            value: 38,
            easingToNext: 'hold',
          },
        ],
      },
      {
        trackId: 'track.semantic-sound.musashi-camera',
        order: 1,
        motionGroupId:
          'motion.semantic-sound.musashi-camera',
        componentId: 'component.musashi',
        property: 'scale_uniform',
        role: 'camera',
        restorationExpectation: 'not_applicable',
        keyframes: [
          {
            frame: input.startFrame,
            value: 1,
            easingToNext: 'ease_in_out_cubic',
          },
          {
            frame: midpoint,
            value: 1.05,
            easingToNext: 'settle_out',
          },
          {
            frame: input.endFrame,
            value: 1.05,
            easingToNext: 'hold',
          },
        ],
      },
    ]
  }
  return [
    {
      trackId: 'track.semantic-sound.hormuz-map',
      order: 0,
      motionGroupId:
        'motion.semantic-sound.hormuz-primary',
      componentId: 'component.hormuz.map',
      property: 'path_reveal',
      role: 'primary',
      restorationExpectation: 'not_applicable',
      keyframes: [
        {
          frame: input.startFrame,
          value: 0,
          easingToNext: 'ease_in_out_cubic',
        },
        {
          frame: midpoint,
          value: 1,
          easingToNext: 'settle_out',
        },
        {
          frame: input.endFrame,
          value: 1,
          easingToNext: 'hold',
        },
      ],
    },
    {
      trackId: 'track.semantic-sound.hormuz-focus',
      order: 1,
      motionGroupId:
        'motion.semantic-sound.hormuz-attention',
      componentId: 'component.hormuz.map',
      property: 'focus_depth_normalized',
      role: 'secondary',
      restorationExpectation:
        'required_return_to_initial',
      keyframes: [
        {
          frame: input.startFrame,
          value: 0,
          easingToNext: 'ease_in_out_cubic',
        },
        {
          frame: midpoint,
          value: 0.65,
          easingToNext: 'settle_out',
        },
        {
          frame: input.endFrame,
          value: 0,
          easingToNext: 'hold',
        },
      ],
    },
  ]
}

function attentionBindings(input: {
  readonly scenario: LivingFrameSelectedSceneFixtureScenario
  readonly scene:
    CanonicalLivingFrameSelectedScenePublication[
      'binding'
    ]['selectedComponent']['scenePlans'][number]
}): readonly LivingFrameAttentionTrackBindingDraft[] {
  if (input.scenario === 'musashi') {
    return [{
      attentionEventId:
        input.scene.attentionSequence[0]!.attentionEventId,
      motionTrackIds: [
        'track.semantic-sound.musashi-strike',
        'track.semantic-sound.musashi-camera',
      ],
      soundRequestIds: [
        input.scene.soundRequests[0]!.soundRequestId,
      ],
    }]
  }
  return input.scene.attentionSequence.map((event) => {
    if (event.eventType === 'handoff') {
      return {
        attentionEventId: event.attentionEventId,
        motionTrackIds: [
          'track.semantic-sound.hormuz-map',
          'track.semantic-sound.hormuz-focus',
        ],
        soundRequestIds: [
          input.scene.soundRequests[0]!.soundRequestId,
        ],
      }
    }
    if (event.eventType === 'hold') {
      return {
        attentionEventId: event.attentionEventId,
        motionTrackIds: [
          'track.semantic-sound.hormuz-map',
        ],
        soundRequestIds: [],
      }
    }
    return {
      attentionEventId: event.attentionEventId,
      motionTrackIds: [
        'track.semantic-sound.hormuz-focus',
      ],
      soundRequestIds: [],
    }
  })
}

function nextId(): string {
  sequence += 1
  return String(sequence).padStart(3, '0')
}
