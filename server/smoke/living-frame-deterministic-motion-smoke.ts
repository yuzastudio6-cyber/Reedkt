import assert from 'node:assert/strict'

import type {
  LivingFrameMotionTrackDraft,
} from '../../src/types/living-frame-deterministic-motion'
import {
  compileLivingFrameDeterministicMotion,
  verifyLivingFrameDeterministicMotionBundleDigest,
} from '../living-frame/living-frame-deterministic-motion'

const genericSelectiveMotionTracks: LivingFrameMotionTrackDraft[] = [
  track({
    trackId: 'track.primary.rotation',
    order: 0,
    motionGroupId: 'motion.primary.action',
    componentId: 'component.primary.moving-part',
    property: 'rotation_degrees',
    role: 'primary',
    keyframes: [
      keyframe(100, 0, 'mechanical_accelerate'),
      keyframe(130, 720, 'hold'),
    ],
  }),
  track({
    trackId: 'track.primary.position',
    order: 1,
    motionGroupId: 'motion.primary.action',
    componentId: 'component.primary.moving-part',
    property: 'position_x_normalized',
    role: 'primary',
    keyframes: [
      keyframe(100, 0, 'strike_accelerate'),
      keyframe(130, 0.25, 'hold'),
    ],
  }),
  track({
    trackId: 'track.secondary.follow-through',
    order: 2,
    motionGroupId: 'motion.secondary.follow-through',
    componentId: 'component.secondary.flexible-part',
    property: 'rotation_degrees',
    role: 'secondary',
    keyframes: [
      keyframe(118, 0, 'ease_out_quad'),
      keyframe(140, 18, 'settle_out'),
      keyframe(155, 4, 'hold'),
    ],
  }),
  track({
    trackId: 'track.camera.push',
    order: 3,
    motionGroupId: 'motion.camera.emphasis',
    componentId: 'component.virtual-camera',
    property: 'scale_uniform',
    role: 'camera',
    keyframes: [
      keyframe(95, 1, 'ease_in_out_cubic'),
      keyframe(155, 1.06, 'hold'),
    ],
  }),
  track({
    trackId: 'track.focus.restore',
    order: 4,
    motionGroupId: 'motion.attention.handoff',
    componentId: 'component.speaker',
    property: 'blur_pixels',
    role: 'secondary',
    restorationExpectation: 'required_return_to_initial',
    keyframes: [
      keyframe(90, 0, 'ease_in_out_cubic'),
      keyframe(110, 8, 'hold'),
      keyframe(135, 8, 'settle_out'),
      keyframe(160, 0, 'hold'),
    ],
  }),
]

const compiled = compileLivingFrameDeterministicMotion({
  timingExpectation: timing(),
  tracks: genericSelectiveMotionTracks,
})
assert.equal(verifyLivingFrameDeterministicMotionBundleDigest(compiled), true)
assert.equal(compiled.tracks.length, 5)
assert.equal(compiled.metrics.primaryMotionGroupCount, 1)
assert.equal(compiled.metrics.cameraTrackCount, 1)
assert.equal(compiled.metrics.restorationTrackCount, 1)
assert.equal(compiled.authorityBoundary.masterTimingAuthority, false)
assert.equal(compiled.authorityBoundary.exactFrameAuthority, false)
assert.equal(compiled.authorityBoundary.rendererAuthority, false)
assert.equal(compiled.authorityBoundary.renderExecutionAuthority, false)
assert.equal(compiled.authorityBoundary.productionAuthority, false)
assert.equal(compiled.canonicalTimingRevalidationStillRequired, true)
assert.equal(compiled.remotionCompilationStillRequired, true)
assert.equal(compiled.containsExecutableCode, false)
assert.equal(compiled.containsProviderOrToolRoute, false)
assert.equal(
  sample(compiled, 'track.primary.rotation', 115),
  180,
)
assert.equal(sample(compiled, 'track.focus.restore', 160), 0)

const replay = compileLivingFrameDeterministicMotion({
  timingExpectation: timing(),
  tracks: genericSelectiveMotionTracks,
})
assert.equal(replay.bundleDigestSha256, compiled.bundleDigestSha256)

const reordered = compileLivingFrameDeterministicMotion({
  timingExpectation: timing(),
  tracks: [...genericSelectiveMotionTracks].reverse(),
})
assert.equal(reordered.bundleDigestSha256, compiled.bundleDigestSha256)

assert.equal(
  verifyLivingFrameDeterministicMotionBundleDigest({
    ...compiled,
    tracks: compiled.tracks.map((entry, index) =>
      index === 0
        ? {
            ...entry,
            samples: entry.samples.map((value, sampleIndex) =>
              sampleIndex === 1 ? { ...value, value: 999 } : value),
          }
        : entry),
  }),
  false,
)
assert.equal(
  verifyLivingFrameDeterministicMotionBundleDigest({
    ...compiled,
    authorityBoundary: {
      ...compiled.authorityBoundary,
      exactFrameAuthority: true,
    },
  }),
  false,
)
assert.equal(
  verifyLivingFrameDeterministicMotionBundleDigest({
    ...compiled,
    providerId: 'forged-provider',
  }),
  false,
)

assert.throws(
  () => compileLivingFrameDeterministicMotion({
    timingExpectation: timing(),
    tracks: [
      genericSelectiveMotionTracks[0]!,
      {
        ...genericSelectiveMotionTracks[0]!,
        trackId: 'track.conflict',
        order: 1,
      },
    ],
  }),
  /property tracks conflict/,
)
assert.throws(
  () => compileLivingFrameDeterministicMotion({
    timingExpectation: timing(),
    tracks: [
      genericSelectiveMotionTracks[0]!,
      track({
        trackId: 'track.competing-primary',
        order: 1,
        motionGroupId: 'motion.competing',
        componentId: 'component.competing',
        property: 'opacity',
        role: 'primary',
        keyframes: [
          keyframe(110, 0, 'linear'),
          keyframe(125, 1, 'hold'),
        ],
      }),
    ],
  }),
  /competing primary groups/,
)
assert.throws(
  () => compileLivingFrameDeterministicMotion({
    timingExpectation: timing(),
    tracks: [{
      ...genericSelectiveMotionTracks[4]!,
      order: 0,
      keyframes: [
        keyframe(90, 0, 'linear'),
        keyframe(120, 8, 'hold'),
      ],
    }],
  }),
  /restoration is incomplete/,
)
assert.throws(
  () => compileLivingFrameDeterministicMotion({
    timingExpectation: timing(),
    tracks: [{
      ...genericSelectiveMotionTracks[0]!,
      order: 0,
      keyframes: [
        keyframe(80, 0, 'linear'),
        keyframe(100, 1, 'hold'),
      ],
    }],
  }),
  /keyframe is invalid/,
)
assert.throws(
  () => compileLivingFrameDeterministicMotion({
    timingExpectation: timing(),
    tracks: [{
      ...genericSelectiveMotionTracks[0]!,
      order: 0,
      keyframes: [
        keyframe(100, 0, 'linear'),
        keyframe(130, 100_001, 'hold'),
      ],
    }],
  }),
  /keyframe is invalid/,
)
assert.throws(
  () => compileLivingFrameDeterministicMotion({
    timingExpectation: {
      ...timing(),
      masterTimingPlanDigestSha256: 'bad',
    },
    tracks: [genericSelectiveMotionTracks[0]!],
  }),
  /timing expectation is invalid/,
)
assert.throws(
  () => compileLivingFrameDeterministicMotion({
    timingExpectation: {
      ...timing(),
      timingAuthorityRevalidationRequired: false,
    } as unknown as ReturnType<typeof timing>,
    tracks: [genericSelectiveMotionTracks[0]!],
  }),
  /timing expectation is invalid/,
)
assert.throws(
  () => compileLivingFrameDeterministicMotion({
    timingExpectation: timing(),
    tracks: [
      genericSelectiveMotionTracks[0]!,
      {
        ...genericSelectiveMotionTracks[1]!,
        order: 2,
      },
    ],
  }),
  /track orders must be contiguous/,
)
assert.throws(
  () => compileLivingFrameDeterministicMotion({
    timingExpectation: timing(),
    tracks: [({
        ...genericSelectiveMotionTracks[0]!,
        providerId: 'forged-provider',
      }) as unknown as LivingFrameMotionTrackDraft],
  }),
  /track shape is invalid/,
)
assert.throws(
  () => compileLivingFrameDeterministicMotion(({
      timingExpectation: timing(),
      tracks: [genericSelectiveMotionTracks[0]!],
      toolRoute: 'forged-tool',
    }) as unknown as Parameters<
      typeof compileLivingFrameDeterministicMotion
    >[0]),
  /input shape is invalid/,
)

console.log(JSON.stringify({
  suite: 'living-frame-deterministic-motion',
  genericTrackCount: compiled.tracks.length,
  sampleCount: compiled.metrics.sampleCount,
  adversarialAssertions: 18,
  deterministicReplay: true,
  masterTimingAuthorityGranted: false,
  exactFrameAuthorityGranted: false,
  rendererOrRuntimeAuthorityGranted: false,
  subjectSpecificRouting: false,
}))

function timing() {
  return {
    masterTimingPlanId: 'master-timing.plan.generic-scene',
    masterTimingPlanDigestSha256: 'a'.repeat(64),
    outputFrameId: 'output-frame.confirmed.generic-scene',
    outputFrameDigestSha256: 'b'.repeat(64),
    sceneId: 'scene.generic-selective-motion',
    sceneStartFrame: 90,
    sceneEndFrame: 180,
    fpsNumerator: 30,
    fpsDenominator: 1,
    timingAuthorityRevalidationRequired: true as const,
  }
}

function track(input: Omit<
  LivingFrameMotionTrackDraft,
  'restorationExpectation'
> & {
  readonly restorationExpectation?:
    LivingFrameMotionTrackDraft['restorationExpectation']
}): LivingFrameMotionTrackDraft {
  return {
    restorationExpectation: 'not_applicable',
    ...input,
  }
}

function keyframe(
  frame: number,
  value: number,
  easingToNext: LivingFrameMotionTrackDraft['keyframes'][number]['easingToNext'],
) {
  return { frame, value, easingToNext }
}

function sample(
  bundle: ReturnType<typeof compileLivingFrameDeterministicMotion>,
  trackId: string,
  frame: number,
): number {
  const trackValue = bundle.tracks.find((entry) => entry.trackId === trackId)
  const sampleValue = trackValue?.samples.find((entry) => entry.frame === frame)
  assert.ok(sampleValue)
  return sampleValue.value
}
