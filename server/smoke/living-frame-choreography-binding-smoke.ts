import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameProfessionalSkillComponentDraft,
} from '../../src/types/living-frame'
import type {
  LivingFrameMotionTrackDraft,
} from '../../src/types/living-frame-deterministic-motion'
import {
  createLivingFrameProfessionalSkillComponent,
} from '../../src/lib/living-frame/living-frame-contract'
import {
  createLivingFrameFixtureDrafts,
} from '../../src/lib/living-frame/living-frame-fixtures'
import {
  compileLivingFrameChoreographyBinding,
  verifyLivingFrameChoreographyBindingDigest,
} from '../living-frame/living-frame-choreography-binding'
import {
  compileLivingFrameDeterministicMotion,
} from '../living-frame/living-frame-deterministic-motion'

const parentDraft = structuredClone(
  createLivingFrameFixtureDrafts().hormuzLivingARoll,
) as LivingFrameProfessionalSkillComponentDraft
const mutableScene = parentDraft.scenePlans[0] as unknown as {
  attentionSequence: Array<{ methods: string[] }>
}
mutableScene.attentionSequence[0]!.methods = [
  'motion_emphasis_expectation',
]
mutableScene.attentionSequence[1]!.methods = [
  'focus_depth_expectation',
  'motion_emphasis_expectation',
  'sound_emphasis_expectation',
]
mutableScene.attentionSequence[2]!.methods = [
  'motion_emphasis_expectation',
]
mutableScene.attentionSequence[3]!.methods = [
  'focus_depth_expectation',
]
const parent = await createLivingFrameProfessionalSkillComponent(parentDraft)
export const livingFrameChoreographyFixtureMotionBundle =
  compileMotion()
const motion = livingFrameChoreographyFixtureMotionBundle
const input = {
  livingFrameComponent: parent,
  sceneId: 'scene.hormuz-a-roll',
  motionBundle: motion,
  attentionTrackBindings: [
    {
      attentionEventId: 'attention.hormuz-prepare',
      motionTrackIds: ['track.hormuz-route-reveal'],
      soundRequestIds: ['sound.hormuz-route'],
    },
    {
      attentionEventId: 'attention.hormuz-handoff',
      motionTrackIds: [
        'track.hormuz-focus',
        'track.hormuz-route-reveal',
      ],
      soundRequestIds: ['sound.hormuz-handoff'],
    },
    {
      attentionEventId: 'attention.hormuz-hold',
      motionTrackIds: ['track.hormuz-route-reveal'],
      soundRequestIds: [],
    },
    {
      attentionEventId: 'attention.hormuz-restore',
      motionTrackIds: ['track.hormuz-focus'],
      soundRequestIds: [],
    },
  ],
  semanticScaleTrackBindings: [{
    semanticScaleRequestId: 'scale.hormuz-map-truth',
    motionTrackIds: [],
  }],
} as const

export const livingFrameChoreographyFixtureBinding =
  await compileLivingFrameChoreographyBinding(input)
const binding = livingFrameChoreographyFixtureBinding
assert.equal(verifyLivingFrameChoreographyBindingDigest(binding), true)
assert.equal(
  binding.bindingState,
  'candidate_pending_canonical_timing_soundsync_and_snapshot',
)
assert.equal(binding.attentionBindings.length, 4)
assert.equal(binding.semanticScaleBindings.length, 1)
assert.equal(
  binding.semanticScaleBindings[0]?.treatment,
  'literal_relationship_preserved_without_component_scale',
)
assert.equal(binding.soundRequestProjections.length, 2)
assert.equal(
  binding.soundRequestProjections.every((request) =>
    request.narrationProtection === 'strict'
    && request.semanticTriggerBound
    && request.linkedComponentMotionPolicy ===
      'required_and_matched'
    && request.semanticTriggerExactFramesProvided === false
    && request.exactCuePlacementProvided === false
    && request.exactMixProvided === false
    && request.downstreamSoundSyncRequired),
  true,
)
assert.deepEqual(
  binding.soundRequestProjections.map((request) => ({
    soundRequestId: request.soundRequestId,
    attentionEventId:
      request.semanticTriggerAttentionEventId,
    eventType: request.semanticTriggerEventType,
    motionTrackIds:
      request.semanticTriggerMotionTrackIds,
  })),
  [
    {
      soundRequestId: 'sound.hormuz-route',
      attentionEventId: 'attention.hormuz-prepare',
      eventType: 'prepare',
      motionTrackIds: ['track.hormuz-route-reveal'],
    },
    {
      soundRequestId: 'sound.hormuz-handoff',
      attentionEventId: 'attention.hormuz-handoff',
      eventType: 'handoff',
      motionTrackIds: [
        'track.hormuz-focus',
        'track.hormuz-route-reveal',
      ],
    },
  ],
)
const environmentalDraft = structuredClone(parentDraft)
const environmentalScene =
  environmentalDraft.scenePlans[0] as unknown as {
    soundRequests: Array<{
      purpose: string
      linkedComponentId: string | null
    }>
  }
environmentalScene.soundRequests[0]!.purpose =
  'environmental_presence'
const environmentalBinding =
  await compileLivingFrameChoreographyBinding({
    ...input,
    livingFrameComponent:
      await createLivingFrameProfessionalSkillComponent(
        environmentalDraft,
      ),
  })
assert.equal(
  environmentalBinding.soundRequestProjections[0]
    ?.linkedComponentMotionPolicy,
  'not_required_environmental_presence',
)
const unlinkedDraft = structuredClone(parentDraft)
const unlinkedScene =
  unlinkedDraft.scenePlans[0] as unknown as {
    soundRequests: Array<{
      linkedComponentId: string | null
    }>
  }
unlinkedScene.soundRequests[0]!.linkedComponentId = null
const unlinkedBinding =
  await compileLivingFrameChoreographyBinding({
    ...input,
    livingFrameComponent:
      await createLivingFrameProfessionalSkillComponent(
        unlinkedDraft,
      ),
  })
assert.equal(
  unlinkedBinding.soundRequestProjections[0]
    ?.linkedComponentMotionPolicy,
  'not_applicable_unlinked_sound',
)
assert.equal(
  binding.motionBudget.onePrimaryMotionGroupAtATimeVerified,
  true,
)
assert.equal(
  binding.motionBudget.stillnessPreservedAsDesignState,
  true,
)
assert.equal(binding.motionBudget.animatedSceneComponentCount, 2)
assert.equal(binding.motionBudget.stillSceneComponentCount, 3)
assert.equal(binding.authorityBoundary.masterTimingAuthority, false)
assert.equal(binding.authorityBoundary.soundSyncAuthority, false)
assert.equal(binding.authorityBoundary.approvalAuthority, false)
assert.equal(binding.authorityBoundary.snapshotAuthority, false)
assert.equal(binding.authorityBoundary.workGraphAuthority, false)
assert.equal(binding.authorityBoundary.remotionExecutionAuthority, false)
assert.equal(binding.authorityBoundary.productionAuthority, false)
assert.equal(binding.subjectSpecificRouting, false)

const replay = await compileLivingFrameChoreographyBinding(input)
assert.equal(replay.bindingDigestSha256, binding.bindingDigestSha256)

const originalFixtureParent =
  await createLivingFrameProfessionalSkillComponent(
    createLivingFrameFixtureDrafts().hormuzLivingARoll,
  )
const localContrastBinding = await compileLivingFrameChoreographyBinding({
  ...input,
  livingFrameComponent: originalFixtureParent,
})
assert.equal(
  localContrastBinding.bindingState,
  'blocked_by_unsupported_attention_or_scale_treatment',
)
assert.equal(
  localContrastBinding.openGateCodes.includes(
    'local_contrast_renderer_primitive_required',
  ),
  true,
)

await assert.rejects(
  () => compileLivingFrameChoreographyBinding({
    ...input,
    livingFrameComponent: {
      ...parent,
      contractDigestSha256: digest('0'),
    },
  }),
  /valid parent component/,
)
await assert.rejects(
  () => compileLivingFrameChoreographyBinding({
    ...input,
    sceneId: 'scene.unknown',
  }),
  /active scene/,
)
await assert.rejects(
  () => compileLivingFrameChoreographyBinding({
    ...input,
    attentionTrackBindings: input.attentionTrackBindings.slice(1),
  }),
  /coverage is incomplete/,
)
await assert.rejects(
  () => compileLivingFrameChoreographyBinding({
    ...input,
    attentionTrackBindings: input.attentionTrackBindings.map(
      (item, index) => index === 1
        ? { ...item, motionTrackIds: ['track.unknown'] }
        : item,
    ),
  }),
  /unknown motion track/,
)
await assert.rejects(
  () => compileLivingFrameChoreographyBinding({
    ...input,
    attentionTrackBindings: input.attentionTrackBindings.map(
      (item, index) => index === 1
        ? { ...item, motionTrackIds: ['track.hormuz-route-reveal'] }
        : item,
    ),
  }),
  /focus_depth_expectation lacks deterministic coverage/,
)
await assert.rejects(
  () => compileLivingFrameChoreographyBinding({
    ...input,
    motionBundle: compileMotion('restoration_missing'),
  }),
  /attention restoration is not represented/,
)
await assert.rejects(
  () => compileLivingFrameChoreographyBinding({
    ...input,
    motionBundle: compileMotion('literal_scale_distortion'),
    semanticScaleTrackBindings: [{
      semanticScaleRequestId: 'scale.hormuz-map-truth',
      motionTrackIds: ['track.hormuz-map-scale'],
    }],
  }),
  /Literal Living Frame scale cannot distort/,
)
await assert.rejects(
  () => compileLivingFrameChoreographyBinding({
    ...input,
    semanticScaleTrackBindings: [{
      semanticScaleRequestId: 'scale.unknown',
      motionTrackIds: [],
    }],
  }),
  /semantic scale request is unbound/,
)
await assert.rejects(
  () => compileLivingFrameChoreographyBinding({
    ...input,
    attentionTrackBindings:
      input.attentionTrackBindings.map(
        (item) => ({
          ...item,
          soundRequestIds: [],
        }),
      ),
  }),
  /sound attention lacks a semantic sound request/,
)
await assert.rejects(
  () => compileLivingFrameChoreographyBinding({
    ...input,
    attentionTrackBindings:
      input.attentionTrackBindings.map(
        (item, index) => index === 2
          ? {
              ...item,
              soundRequestIds: [
                'sound.hormuz-handoff',
              ],
            }
          : item,
      ),
  }),
  /sound request requires exactly one semantic attention trigger/,
)
await assert.rejects(
  () => compileLivingFrameChoreographyBinding({
    ...input,
    attentionTrackBindings:
      input.attentionTrackBindings.map(
        (item, index) => index === 0
          ? {
              ...item,
              soundRequestIds: [],
            }
          : index === 3
            ? {
                ...item,
                soundRequestIds: [
                  'sound.hormuz-route',
                ],
              }
            : item,
      ),
  }),
  /motion-dependent component-linked Living Frame sound request must trigger with motion from that component/,
)
await assert.rejects(
  () => compileLivingFrameChoreographyBinding({
    ...input,
    motionBundle: compileMotion('unknown_component'),
  }),
  /non-scene component/,
)

assert.equal(
  verifyLivingFrameChoreographyBindingDigest({
    ...binding,
    bindingDigestSha256: digest('1'),
  }),
  false,
)
assert.equal(
  verifyLivingFrameChoreographyBindingDigest(resign({
    ...binding,
    authorityBoundary: {
      ...binding.authorityBoundary,
      soundSyncAuthority: true,
      approvalAuthority: true,
      productionAuthority: true,
    },
  })),
  false,
)
assert.equal(
  verifyLivingFrameChoreographyBindingDigest(resign({
    ...binding,
    subjectSpecificRouting: true,
  })),
  false,
)
const forgedAttention = asObject(structuredClone(binding))
asObject(asArray(
  asObject(asArray(forgedAttention.attentionBindings)[1])
    .methodCoverage,
)[0]).method = 'camera_push_expectation'
assert.equal(
  verifyLivingFrameChoreographyBindingDigest(resign(forgedAttention)),
  false,
)
const forgedScale = asObject(structuredClone(binding))
asObject(asArray(forgedScale.semanticScaleBindings)[0]).treatment =
  'editorial_symbolic_scale_track_candidate'
assert.equal(
  verifyLivingFrameChoreographyBindingDigest(resign(forgedScale)),
  false,
)
const forgedSoundEvent = asObject(structuredClone(binding))
asObject(asArray(
  forgedSoundEvent.soundRequestProjections,
)[1]).semanticTriggerAttentionEventId =
  'attention.hormuz-hold'
assert.equal(
  verifyLivingFrameChoreographyBindingDigest(
    resign(forgedSoundEvent),
  ),
  false,
)
const forgedSoundMotion = asObject(structuredClone(binding))
asObject(asArray(
  forgedSoundMotion.soundRequestProjections,
)[1]).semanticTriggerMotionTrackIds = [
  'track.hormuz-route-reveal',
]
assert.equal(
  verifyLivingFrameChoreographyBindingDigest(
    resign(forgedSoundMotion),
  ),
  false,
)
const forgedSoundPolicy = asObject(structuredClone(binding))
asObject(asArray(
  forgedSoundPolicy.soundRequestProjections,
)[1]).linkedComponentMotionPolicy =
  'not_required_environmental_presence'
assert.equal(
  verifyLivingFrameChoreographyBindingDigest(
    resign(forgedSoundPolicy),
  ),
  false,
)
const missingRequiredGate = {
  ...binding,
  openGateCodes: binding.openGateCodes.filter(
    (gate) => gate !== 'canonical_snapshot_projection_required',
  ),
}
assert.equal(
  verifyLivingFrameChoreographyBindingDigest(resign(missingRequiredGate)),
  false,
)
assert.equal(
  verifyLivingFrameChoreographyBindingDigest(resign({
    ...binding,
    rawTranscript: 'forged',
  })),
  false,
)

console.log(JSON.stringify({
  suite: 'living-frame-choreography-binding',
  controlledCases: 4,
  adversarialCases: 21,
  subjectSpecificRouting: binding.subjectSpecificRouting,
  semanticScaleTruthPreserved:
    binding.semanticScaleBindings[0]?.treatment,
  stillSceneComponentCount:
    binding.motionBudget.stillSceneComponentCount,
  authority: {
    masterTiming: binding.authorityBoundary.masterTimingAuthority,
    soundSync: binding.authorityBoundary.soundSyncAuthority,
    snapshot: binding.authorityBoundary.snapshotAuthority,
    workGraph: binding.authorityBoundary.workGraphAuthority,
    remotion: binding.authorityBoundary.remotionExecutionAuthority,
    production: binding.authorityBoundary.productionAuthority,
  },
}))

function compileMotion(
  variant:
    | 'valid'
    | 'restoration_missing'
    | 'literal_scale_distortion'
    | 'unknown_component' = 'valid',
) {
  const tracks: LivingFrameMotionTrackDraft[] = [
    {
      trackId: 'track.hormuz-route-reveal',
      order: 0,
      motionGroupId: 'motion.hormuz-primary',
      componentId: variant === 'unknown_component'
        ? 'component.unrelated-subject'
        : 'hormuz.routes',
      property: 'path_reveal',
      role: 'primary',
      restorationExpectation: 'not_applicable',
      keyframes: [
        { frame: 10, value: 0, easingToNext: 'ease_in_out_cubic' },
        { frame: 60, value: 1, easingToNext: 'hold' },
      ],
    },
    {
      trackId: 'track.hormuz-focus',
      order: 1,
      motionGroupId: 'motion.hormuz-attention',
      componentId: 'hormuz.map',
      property: 'focus_depth_normalized',
      role: 'secondary',
      restorationExpectation: variant === 'restoration_missing'
        ? 'not_applicable'
        : 'required_return_to_initial',
      keyframes: [
        { frame: 0, value: 0, easingToNext: 'ease_in_out_cubic' },
        { frame: 30, value: 0.72, easingToNext: 'settle_out' },
        {
          frame: 89,
          value: variant === 'restoration_missing' ? 0.2 : 0,
          easingToNext: 'hold',
        },
      ],
    },
  ]
  if (variant === 'literal_scale_distortion') {
    tracks.push({
      trackId: 'track.hormuz-map-scale',
      order: 2,
      motionGroupId: 'motion.hormuz-scale',
      componentId: 'hormuz.map',
      property: 'scale_uniform',
      role: 'secondary',
      restorationExpectation: 'required_return_to_initial',
      keyframes: [
        { frame: 0, value: 1, easingToNext: 'ease_in_out_cubic' },
        { frame: 30, value: 1.2, easingToNext: 'settle_out' },
        { frame: 89, value: 1, easingToNext: 'hold' },
      ],
    })
  }
  return compileLivingFrameDeterministicMotion({
    timingExpectation: {
      masterTimingPlanId: 'master-timing.generic-choreography',
      masterTimingPlanDigestSha256: digest('a'),
      outputFrameId: 'output-frame.generic-choreography',
      outputFrameDigestSha256: digest('b'),
      sceneId: 'scene.hormuz-a-roll',
      sceneStartFrame: 0,
      sceneEndFrame: 89,
      fpsNumerator: 30,
      fpsDenominator: 1,
      timingAuthorityRevalidationRequired: true,
    },
    tracks,
  })
}

function resign<T extends Record<string, unknown>>(value: T): T {
  const clone = structuredClone(value) as Record<string, unknown>
  delete clone.bindingDigestSha256
  return {
    ...clone,
    bindingDigestSha256: createHash('sha256')
      .update(canonicalJson(clone), 'utf8')
      .digest('hex'),
  } as unknown as T
}

function canonicalJson(value: unknown): string {
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
  throw new Error('Non-canonical smoke value.')
}

function digest(character: string): string {
  return character.repeat(64)
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Expected a smoke-test object.')
  }
  return value as Record<string, unknown>
}

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError('Expected a smoke-test array.')
  }
  return value
}
