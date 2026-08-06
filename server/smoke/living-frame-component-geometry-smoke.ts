import assert from 'node:assert/strict'

import type {
  LivingFrameGeometryComponentDraft,
  LivingFrameGeometryOcclusionExpectation,
  LivingFrameGeometrySafeRegion,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameMotionTrackDraft,
} from '../../src/types/living-frame-deterministic-motion'
import {
  compileLivingFrameComponentGeometry,
  verifyLivingFrameComponentGeometryBundleDigest,
} from '../living-frame/living-frame-component-geometry'
import {
  compileLivingFrameDeterministicMotion,
} from '../living-frame/living-frame-deterministic-motion'

const outputFrameExpectation = {
  outputFrameId: 'output-frame.controlled',
  outputFrameDigestSha256: digest('a'),
  widthPixels: 3840,
  heightPixels: 2160,
  pixelAspectRatioNumerator: 1,
  pixelAspectRatioDenominator: 1,
  confirmedOutputFrameRevalidationRequired: true,
} as const

const motionBundle = compileLivingFrameDeterministicMotion({
  timingExpectation: {
    masterTimingPlanId: 'master-timing.controlled',
    masterTimingPlanDigestSha256: digest('b'),
    outputFrameId: outputFrameExpectation.outputFrameId,
    outputFrameDigestSha256:
      outputFrameExpectation.outputFrameDigestSha256,
    sceneId: 'scene.generic.selective-motion',
    sceneStartFrame: 0,
    sceneEndFrame: 120,
    fpsNumerator: 30,
    fpsDenominator: 1,
    timingAuthorityRevalidationRequired: true,
  },
  tracks: [
    motionTrack({
      trackId: 'track.primary.position',
      order: 0,
      motionGroupId: 'motion.primary',
      componentId: 'component.visual.primary',
      property: 'position_x_normalized',
      role: 'primary',
      keyframes: [
        { frame: 20, value: 0, easingToNext: 'ease_in_out_cubic' },
        { frame: 55, value: 0.18, easingToNext: 'hold' },
      ],
    }),
    motionTrack({
      trackId: 'track.speaker.focus',
      order: 1,
      motionGroupId: 'motion.attention',
      componentId: 'component.source.speaker',
      property: 'blur_pixels',
      role: 'secondary',
      restorationExpectation: 'required_return_to_initial',
      keyframes: [
        { frame: 10, value: 0, easingToNext: 'ease_in_out_cubic' },
        { frame: 25, value: 6, easingToNext: 'hold' },
        { frame: 55, value: 6, easingToNext: 'settle_out' },
        { frame: 75, value: 0, easingToNext: 'hold' },
      ],
    }),
    motionTrack({
      trackId: 'track.camera.push',
      order: 2,
      motionGroupId: 'motion.camera',
      componentId: 'component.virtual-camera',
      property: 'scale_uniform',
      role: 'camera',
      keyframes: [
        { frame: 10, value: 1, easingToNext: 'ease_in_out_cubic' },
        { frame: 75, value: 1.05, easingToNext: 'hold' },
      ],
    }),
  ],
})

const safeRegions: LivingFrameGeometrySafeRegion[] = [
  safeRegion(
    'safe.face',
    0,
    'face',
    { x: 0.68, y: 0.08, width: 0.2, height: 0.26 },
  ),
  safeRegion(
    'safe.gesture',
    1,
    'gesture',
    { x: 0.62, y: 0.38, width: 0.3, height: 0.25 },
  ),
  safeRegion(
    'safe.contact',
    2,
    'contact_object',
    { x: 0.02, y: 0.76, width: 0.2, height: 0.22 },
  ),
  safeRegion(
    'safe.caption',
    3,
    'caption',
    { x: 0.28, y: 0.78, width: 0.58, height: 0.16 },
  ),
]

const components: LivingFrameGeometryComponentDraft[] = [
  visualComponent({
    componentId: 'component.background',
    order: 0,
    role: 'opaque_background_plate',
    focalRole: 'static_anchor',
    depthBand: 'background',
    rect: fullFrame(),
    collisionPolicy: 'base_layer_coverage',
    transparencyExpectation: 'opaque_plate',
    alphaSourceExpectation: 'opaque_plate',
    maskExpectation: 'opaque',
  }),
  visualComponent({
    componentId: 'component.visual.primary',
    order: 1,
    role: 'primary_subject',
    focalRole: 'primary',
    depthBand: 'behind_subject',
    rect: { x: 0.06, y: 0.12, width: 0.34, height: 0.42 },
    parentComponentId: 'component.background',
    anchorComponentId: 'component.background',
    collisionPolicy: 'avoid_all_protected_regions',
    transparencyExpectation: 'still_alpha_required',
    alphaSourceExpectation: 'postprocessed_still_mask_requires_qa',
    maskExpectation: 'still_alpha_artifact_required',
  }),
  visualComponent({
    componentId: 'component.source.speaker',
    order: 2,
    role: 'source_a_roll',
    focalRole: 'secondary',
    depthBand: 'subject_plane',
    rect: fullFrame(),
    parentComponentId: 'component.background',
    anchorComponentId: 'component.background',
    collisionPolicy: 'base_layer_coverage',
    transparencyExpectation: 'temporal_mask_required',
    alphaSourceExpectation: 'temporal_mask_sequence_requires_qa',
    maskExpectation: 'temporal_mask_artifact_required',
  }),
  visualComponent({
    componentId: 'component.contact-occluder',
    order: 3,
    role: 'foreground_occluder',
    focalRole: 'none',
    depthBand: 'foreground',
    rect: { x: 0.05, y: 0.8, width: 0.12, height: 0.14 },
    parentComponentId: 'component.source.speaker',
    anchorComponentId: 'component.source.speaker',
    collisionPolicy: 'contact_region_overlap_only',
    transparencyExpectation: 'temporal_mask_required',
    alphaSourceExpectation: 'temporal_mask_sequence_requires_qa',
    maskExpectation: 'temporal_mask_artifact_required',
  }),
  {
    componentId: 'component.virtual-camera',
    order: 4,
    kind: 'virtual_camera',
    role: 'virtual_camera',
    focalRole: 'none',
    depthBand: null,
    rect: null,
    pivot: null,
    parentComponentId: null,
    anchorComponentId: null,
    anchorPoint: null,
    collisionPolicy: 'no_surface',
    transparencyExpectation: null,
    alphaSourceExpectation: null,
    maskExpectation: null,
  },
]

const occlusionExpectations: LivingFrameGeometryOcclusionExpectation[] = [
  {
    relationId: 'occlusion.primary-over-background',
    order: 0,
    kind: 'in_front_of',
    foregroundComponentId: 'component.visual.primary',
    backgroundComponentId: 'component.background',
    downstreamDepthTransitionCompilationRequired: false,
  },
  {
    relationId: 'occlusion.contact-over-primary',
    order: 1,
    kind: 'contact_preserves_foreground',
    foregroundComponentId: 'component.contact-occluder',
    backgroundComponentId: 'component.visual.primary',
    downstreamDepthTransitionCompilationRequired: false,
  },
  {
    relationId: 'occlusion.speaker-primary-transition',
    order: 2,
    kind: 'depth_transition_required',
    foregroundComponentId: 'component.source.speaker',
    backgroundComponentId: 'component.visual.primary',
    downstreamDepthTransitionCompilationRequired: true,
  },
]

const compiled = compileLivingFrameComponentGeometry({
  outputFrameExpectation,
  motionBundle,
  safeRegions,
  components,
  occlusionExpectations,
})

assert.equal(verifyLivingFrameComponentGeometryBundleDigest(compiled), true)
assert.equal(compiled.metrics.componentCount, 5)
assert.equal(compiled.metrics.visualComponentCount, 4)
assert.equal(compiled.metrics.motionBoundComponentCount, 3)
assert.equal(compiled.metrics.focalPrimaryCount, 1)
assert.equal(compiled.metrics.protectedCollisionCount, 0)
assert.equal(compiled.metrics.unresolvedDepthTransitionCount, 1)
assert.deepEqual(compiled.relativeDepthOrderComponentIds, [
  'component.background',
  'component.visual.primary',
  'component.source.speaker',
  'component.contact-occluder',
])
assert.deepEqual(
  component(compiled, 'component.visual.primary').linkedMotionTrackIds,
  ['track.primary.position'],
)
assert.deepEqual(
  component(compiled, 'component.contact-occluder')
    .intersectingSafeRegionIds,
  ['safe.contact'],
)
assert.equal(compiled.authorityBoundary.outputFrameAuthority, false)
assert.equal(compiled.authorityBoundary.layoutPlanningAuthority, false)
assert.equal(compiled.authorityBoundary.maskEvidenceAuthority, false)
assert.equal(compiled.authorityBoundary.rendererAuthority, false)
assert.equal(compiled.authorityBoundary.productionAuthority, false)
assert.equal(compiled.canonicalRendererProjectionStillRequired, true)

const replay = compileLivingFrameComponentGeometry({
  outputFrameExpectation,
  motionBundle,
  safeRegions: [...safeRegions].reverse(),
  components: [...components].reverse(),
  occlusionExpectations: [...occlusionExpectations].reverse(),
})
assert.equal(replay.bundleDigestSha256, compiled.bundleDigestSha256)

const reorderedWithinBand = compileLivingFrameComponentGeometry({
  outputFrameExpectation,
  motionBundle,
  safeRegions,
  components: components.map((entry) => {
    if (entry.componentId === 'component.background') {
      return { ...entry, order: 1 }
    }
    if (entry.componentId === 'component.visual.primary') {
      return { ...entry, order: 0 }
    }
    return entry
  }),
  occlusionExpectations,
})
assert.notEqual(
  reorderedWithinBand.bundleDigestSha256,
  compiled.bundleDigestSha256,
)

assert.equal(
  verifyLivingFrameComponentGeometryBundleDigest({
    ...compiled,
    metrics: { ...compiled.metrics, protectedCollisionCount: 1 },
  }),
  false,
)
assert.equal(
  verifyLivingFrameComponentGeometryBundleDigest({
    ...compiled,
    authorityBoundary: {
      ...compiled.authorityBoundary,
      rendererAuthority: true,
    },
  }),
  false,
)
assert.equal(
  verifyLivingFrameComponentGeometryBundleDigest({
    ...compiled,
    providerId: 'forged-provider',
  }),
  false,
)
assert.equal(
  verifyLivingFrameComponentGeometryBundleDigest({
    ...compiled,
    components: compiled.components.map((entry) =>
      entry.componentId === 'component.visual.primary'
        ? { ...entry, linkedMotionTrackIds: ['track.forged'] }
        : entry),
  }),
  false,
)

assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation: {
      ...outputFrameExpectation,
      outputFrameDigestSha256: digest('c'),
    },
    motionBundle,
    safeRegions,
    components,
    occlusionExpectations,
  }),
  /output-frame lineage is inconsistent/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle: {
      ...motionBundle,
      bundleDigestSha256: digest('d'),
    },
    safeRegions,
    components,
    occlusionExpectations,
  }),
  /motion bundle is invalid/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components: components.filter(
      (entry) => entry.componentId !== 'component.virtual-camera',
    ),
    occlusionExpectations: occlusionExpectations.slice(0, 2),
  }),
  /motion component is dangling/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components: [
      components[0]!,
      { ...components[0]!, order: 1 },
    ],
    occlusionExpectations: [],
  }),
  /components must be unique/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components: components.map((entry) =>
      entry.componentId === 'component.visual.primary'
        ? { ...entry, focalRole: 'secondary' }
        : entry),
    occlusionExpectations,
  }),
  /one focal primary/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components: components.map((entry) =>
      entry.componentId === 'component.source.speaker'
        ? { ...entry, focalRole: 'primary' }
        : entry),
    occlusionExpectations,
  }),
  /one focal primary/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components: components.map((entry) => {
      if (entry.componentId === 'component.background') {
        return { ...entry, parentComponentId: 'component.visual.primary' }
      }
      return entry
    }),
    occlusionExpectations,
  }),
  /component dependency graph must be acyclic/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components: components.map((entry) =>
      entry.componentId === 'component.visual.primary'
        ? { ...entry, anchorComponentId: 'component.missing' }
        : entry),
    occlusionExpectations,
  }),
  /anchor reference is dangling/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components: components.map((entry) =>
      entry.componentId === 'component.visual.primary'
        ? {
            ...entry,
            rect: { x: 0.9, y: 0.1, width: 0.2, height: 0.2 },
          }
        : entry),
    occlusionExpectations,
  }),
  /normalized rectangle is invalid/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components: components.map((entry) =>
      entry.componentId === 'component.visual.primary'
        ? {
            ...entry,
            rect: { x: 0.7, y: 0.1, width: 0.15, height: 0.15 },
          }
        : entry),
    occlusionExpectations,
  }),
  /protected-region collision exists/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components: components.map((entry) =>
      entry.componentId === 'component.contact-occluder'
        ? {
            ...entry,
            rect: { x: 0.35, y: 0.8, width: 0.12, height: 0.1 },
          }
        : entry),
    occlusionExpectations,
  }),
  /contact object crosses another protected region/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components: components.map((entry) =>
      entry.componentId === 'component.visual.primary'
        ? { ...entry, collisionPolicy: 'base_layer_coverage' }
        : entry),
    occlusionExpectations,
  }),
  /base coverage role is invalid/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components: components.map((entry) =>
      entry.componentId === 'component.visual.primary'
        ? { ...entry, maskExpectation: 'opaque' }
        : entry),
    occlusionExpectations,
  }),
  /alpha expectations are inconsistent/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components,
    occlusionExpectations: occlusionExpectations.map((entry) =>
      entry.relationId === 'occlusion.primary-over-background'
        ? {
            ...entry,
            foregroundComponentId: 'component.background',
            backgroundComponentId: 'component.visual.primary',
          }
        : entry),
  }),
  /occlusion depth is inconsistent/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components,
    occlusionExpectations: occlusionExpectations.map((entry) =>
      entry.relationId === 'occlusion.contact-over-primary'
        ? {
            ...entry,
            foregroundComponentId: 'component.source.speaker',
          }
        : entry),
  }),
  /contact preservation requires a foreground occluder/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components,
    occlusionExpectations: [
      occlusionExpectations[0]!,
      {
        ...occlusionExpectations[0]!,
        relationId: 'occlusion.duplicate-pair',
        order: 1,
      },
    ],
  }),
  /occlusion pair is duplicated/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components,
    occlusionExpectations: [
      {
        relationId: 'occlusion.contact-over-speaker',
        order: 0,
        kind: 'in_front_of',
        foregroundComponentId: 'component.contact-occluder',
        backgroundComponentId: 'component.source.speaker',
        downstreamDepthTransitionCompilationRequired: false,
      },
      {
        relationId: 'occlusion.speaker-over-background',
        order: 1,
        kind: 'in_front_of',
        foregroundComponentId: 'component.source.speaker',
        backgroundComponentId: 'component.background',
        downstreamDepthTransitionCompilationRequired: false,
      },
      {
        relationId: 'occlusion.background-over-contact',
        order: 2,
        kind: 'in_front_of',
        foregroundComponentId: 'component.background',
        backgroundComponentId: 'component.contact-occluder',
        downstreamDepthTransitionCompilationRequired: false,
      },
    ],
  }),
  /component geometry occlusion depth is inconsistent|occlusion graph must be acyclic/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components,
    occlusionExpectations: occlusionExpectations.map((entry) =>
      entry.kind === 'depth_transition_required'
        ? {
            ...entry,
            downstreamDepthTransitionCompilationRequired: false,
          }
        : entry),
  }),
  /depth transition must retain its downstream gate/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components: components.map((entry) =>
      entry.kind === 'virtual_camera'
        ? { ...entry, rect: fullFrame() }
        : entry),
    occlusionExpectations,
  }),
  /virtual camera geometry is invalid/,
)
assert.throws(
  () => compileLivingFrameComponentGeometry(({
    outputFrameExpectation,
    motionBundle,
    safeRegions,
    components,
    occlusionExpectations,
    toolRouteId: 'forged-tool-route',
  }) as unknown as Parameters<
    typeof compileLivingFrameComponentGeometry
  >[0]),
  /input shape is invalid/,
)

console.log(JSON.stringify({
  suite: 'living-frame-component-geometry',
  genericComponentCount: compiled.metrics.componentCount,
  safeRegionCount: compiled.metrics.safeRegionCount,
  occlusionExpectationCount:
    compiled.metrics.occlusionExpectationCount,
  adversarialAssertions: 21,
  deterministicReplay: true,
  subjectSpecificRouting: false,
  outputFrameAuthorityGranted:
    compiled.authorityBoundary.outputFrameAuthority,
  rendererAuthorityGranted: compiled.authorityBoundary.rendererAuthority,
  productionAuthorityGranted:
    compiled.authorityBoundary.productionAuthority,
}))

function visualComponent(
  overrides: Partial<LivingFrameGeometryComponentDraft>
    & Pick<
      LivingFrameGeometryComponentDraft,
      | 'componentId'
      | 'order'
      | 'role'
      | 'focalRole'
      | 'depthBand'
      | 'rect'
      | 'collisionPolicy'
      | 'transparencyExpectation'
      | 'alphaSourceExpectation'
      | 'maskExpectation'
    >,
): LivingFrameGeometryComponentDraft {
  return {
    kind: 'visual_component',
    pivot: { x: 0.5, y: 0.5 },
    parentComponentId: null,
    anchorComponentId: null,
    anchorPoint: { x: 0.5, y: 0.5 },
    ...overrides,
  }
}

function safeRegion(
  regionId: string,
  order: number,
  kind: LivingFrameGeometrySafeRegion['kind'],
  rect: LivingFrameGeometrySafeRegion['rect'],
): LivingFrameGeometrySafeRegion {
  return {
    regionId,
    order,
    kind,
    rect,
    evidenceRef: {
      refId: `evidence.${regionId}`,
      version: 'controlled-v1',
      digestSha256: digest(String(order + 1)),
      currentAuthorityRevalidationRequired: true,
    },
  }
}

function motionTrack(
  value: Omit<
    LivingFrameMotionTrackDraft,
    'restorationExpectation'
  > & {
    readonly restorationExpectation?:
      LivingFrameMotionTrackDraft['restorationExpectation']
  },
): LivingFrameMotionTrackDraft {
  return {
    restorationExpectation: 'not_applicable',
    ...value,
  }
}

function fullFrame() {
  return { x: 0, y: 0, width: 1, height: 1 } as const
}

function component(
  bundle: ReturnType<typeof compileLivingFrameComponentGeometry>,
  componentId: string,
) {
  const value = bundle.components.find(
    (entry) => entry.componentId === componentId,
  )
  assert.ok(value)
  return value
}

function digest(character: string): string {
  return character.repeat(64).slice(0, 64)
}
