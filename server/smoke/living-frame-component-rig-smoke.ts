import assert from 'node:assert/strict'

import type {
  LivingFrameComponentRigSpec,
} from '../../src/types/living-frame-component-rig'
import {
  compileLivingFrameComponentGeometry,
} from '../living-frame/living-frame-component-geometry'
import {
  compileLivingFrameComponentRig,
  verifyLivingFrameComponentRigSpecDigest,
} from '../living-frame/living-frame-component-rig'
import {
  compileLivingFrameDeterministicMotion,
} from '../living-frame/living-frame-deterministic-motion'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const sceneId = 'scene.generic.mechanical-selective-motion'
const outputFrameId = 'output-frame.controlled'
const outputFrameDigestSha256 = digest('output-frame')

const motionBundle = compileLivingFrameDeterministicMotion({
  timingExpectation: {
    masterTimingPlanId: 'master-timing.controlled',
    masterTimingPlanDigestSha256: digest('master-timing'),
    outputFrameId,
    outputFrameDigestSha256,
    sceneId,
    sceneStartFrame: 0,
    sceneEndFrame: 60,
    fpsNumerator: 30,
    fpsDenominator: 1,
    timingAuthorityRevalidationRequired: true,
  },
  tracks: [
    {
      trackId: 'track.mechanical.rotation',
      order: 0,
      motionGroupId: 'motion.primary',
      componentId: 'component.mechanical',
      property: 'rotation_degrees',
      role: 'primary',
      restorationExpectation: 'not_applicable',
      keyframes: [
        {
          frame: 0,
          value: 0,
          easingToNext: 'mechanical_accelerate',
        },
        {
          frame: 30,
          value: 720,
          easingToNext: 'linear',
        },
        {
          frame: 60,
          value: 1_440,
          easingToNext: 'hold',
        },
      ],
    },
    {
      trackId: 'track.camera.scale',
      order: 1,
      motionGroupId: 'motion.camera',
      componentId: 'component.virtual-camera',
      property: 'scale_uniform',
      role: 'camera',
      restorationExpectation: 'not_applicable',
      keyframes: [
        {
          frame: 0,
          value: 1,
          easingToNext: 'ease_in_out_cubic',
        },
        {
          frame: 60,
          value: 1.04,
          easingToNext: 'hold',
        },
      ],
    },
  ],
})

const geometryBundle = compileLivingFrameComponentGeometry({
  outputFrameExpectation: {
    outputFrameId,
    outputFrameDigestSha256,
    widthPixels: 1_920,
    heightPixels: 1_080,
    pixelAspectRatioNumerator: 1,
    pixelAspectRatioDenominator: 1,
    confirmedOutputFrameRevalidationRequired: true,
  },
  motionBundle,
  safeRegions: [],
  components: [
    {
      componentId: 'component.background',
      order: 0,
      kind: 'visual_component',
      role: 'opaque_background_plate',
      focalRole: 'static_anchor',
      depthBand: 'background',
      rect: fullFrame(),
      pivot: { x: 0.5, y: 0.5 },
      parentComponentId: null,
      anchorComponentId: null,
      anchorPoint: { x: 0.5, y: 0.5 },
      collisionPolicy: 'base_layer_coverage',
      transparencyExpectation: 'opaque_plate',
      alphaSourceExpectation: 'opaque_plate',
      maskExpectation: 'opaque',
    },
    {
      componentId: 'component.mechanical',
      order: 1,
      kind: 'visual_component',
      role: 'mechanical_component',
      focalRole: 'primary',
      depthBand: 'subject_plane',
      rect: { x: 0.25, y: 0.2, width: 0.5, height: 0.5 },
      pivot: { x: 0.5, y: 0.5 },
      parentComponentId: 'component.background',
      anchorComponentId: 'component.background',
      anchorPoint: { x: 0.5, y: 0.5 },
      collisionPolicy: 'avoid_all_protected_regions',
      transparencyExpectation: 'still_alpha_required',
      alphaSourceExpectation:
        'postprocessed_still_mask_requires_qa',
      maskExpectation: 'still_alpha_artifact_required',
    },
    {
      componentId: 'component.virtual-camera',
      order: 2,
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
  ],
  occlusionExpectations: [
    {
      relationId: 'occlusion.mechanical-over-background',
      order: 0,
      kind: 'in_front_of',
      foregroundComponentId: 'component.mechanical',
      backgroundComponentId: 'component.background',
      downstreamDepthTransitionCompilationRequired: false,
    },
  ],
})

const rig = compileLivingFrameComponentRig({
  geometryBundle,
  motionBundle,
})

assert.equal(verifyLivingFrameComponentRigSpecDigest(rig), true)
assert.deepEqual(rig.topologicalNodeIds, [
  'component.background',
  'component.mechanical',
  'component.virtual-camera',
])
assert.deepEqual(rig.rootNodeIds, [
  'component.background',
  'component.virtual-camera',
])
assert.equal(rig.metrics.nodeCount, 3)
assert.equal(rig.metrics.animatedVisualNodeCount, 1)
assert.equal(rig.metrics.virtualCameraNodeCount, 1)
assert.equal(rig.metrics.motionTrackBindingCount, 2)
assert.equal(
  node(rig, 'component.mechanical').motionTracks[0]?.property,
  'rotation_degrees',
)
assert.equal(
  rig.artifactExpectation.workItemTypeExpectation,
  'build_component_rig',
)
assert.equal(
  rig.artifactExpectation.artifactTypeExpectation,
  'living_frame_component_rig_spec_json',
)
assert.equal(rig.authorityBoundary.selectedSceneAuthority, false)
assert.equal(rig.authorityBoundary.masterTimingAuthority, false)
assert.equal(rig.authorityBoundary.workItemCreationAuthority, false)
assert.equal(rig.authorityBoundary.assetManifestMutationAuthority, false)
assert.equal(rig.authorityBoundary.renderExecutionAuthority, false)
assert.equal(rig.authorityBoundary.productionAuthority, false)

const replay = compileLivingFrameComponentRig({
  geometryBundle,
  motionBundle,
})
assert.equal(replay.rigDigestSha256, rig.rigDigestSha256)

const wrongMotion = compileLivingFrameDeterministicMotion({
  timingExpectation: {
    ...motionBundle.timingExpectation,
    sceneId: 'scene.other',
  },
  tracks: motionBundle.tracks.map((track) => ({
    trackId: track.trackId,
    order: track.order,
    motionGroupId: track.motionGroupId,
    componentId: track.componentId,
    property: track.property,
    role: track.role,
    restorationExpectation: track.restorationExpectation,
    keyframes: track.sourceKeyframes,
  })),
})
assert.throws(
  () => compileLivingFrameComponentRig({
    geometryBundle,
    motionBundle: wrongMotion,
  }),
  /source lineage is inconsistent/,
)

const duplicateNode = mutable(rig)
duplicateNode.nodes[1]!.componentId =
  duplicateNode.nodes[0]!.componentId
assert.equal(verifyLivingFrameComponentRigSpecDigest(sign(duplicateNode)), false)

const cyclic = mutable(rig)
cyclic.nodes[0]!.parentNodeId = 'component.mechanical'
cyclic.nodes[0]!.dependencyNodeIds = ['component.mechanical']
assert.equal(verifyLivingFrameComponentRigSpecDigest(sign(cyclic)), false)

const missingDependency = mutable(rig)
missingDependency.nodes[1]!.parentNodeId = 'component.missing'
missingDependency.nodes[1]!.dependencyNodeIds = [
  'component.background',
  'component.missing',
]
assert.equal(
  verifyLivingFrameComponentRigSpecDigest(sign(missingDependency)),
  false,
)

const changedTopologicalOrder = mutable(rig)
changedTopologicalOrder.topologicalNodeIds.reverse()
assert.equal(
  verifyLivingFrameComponentRigSpecDigest(sign(changedTopologicalOrder)),
  false,
)

const invalidMotionProperty = mutable(rig)
invalidMotionProperty.nodes[1]!.motionTracks[0]!.property =
  'generated_magic' as never
assert.equal(
  verifyLivingFrameComponentRigSpecDigest(sign(invalidMotionProperty)),
  false,
)

const duplicateMotionTrack = mutable(rig)
duplicateMotionTrack.nodes[2]!.motionTracks[0]!.trackId =
  duplicateMotionTrack.nodes[1]!.motionTracks[0]!.trackId
assert.equal(
  verifyLivingFrameComponentRigSpecDigest(sign(duplicateMotionTrack)),
  false,
)

const cameraWithVisualGeometry = mutable(rig)
cameraWithVisualGeometry.nodes[2]!.rect = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
}
assert.equal(
  verifyLivingFrameComponentRigSpecDigest(sign(cameraWithVisualGeometry)),
  false,
)

const artifactSubstitution = mutable(rig)
artifactSubstitution.artifactExpectation.workItemTypeExpectation =
  'custom' as never
assert.equal(
  verifyLivingFrameComponentRigSpecDigest(sign(artifactSubstitution)),
  false,
)

const promotedAuthority = mutable(rig)
promotedAuthority.authorityBoundary.workItemCreationAuthority = true
promotedAuthority.authorityBoundary.productionAuthority = true
assert.equal(
  verifyLivingFrameComponentRigSpecDigest(sign(promotedAuthority)),
  false,
)

const executablePayload = mutable(rig)
executablePayload.containsExecutableCodeOrCommands = true
assert.equal(
  verifyLivingFrameComponentRigSpecDigest(sign(executablePayload)),
  false,
)

const subjectSpecific = mutable(rig) as Record<string, unknown>
subjectSpecific.musashiRig = true
assert.equal(verifyLivingFrameComponentRigSpecDigest(signUnknown(
  subjectSpecific,
)), false)

assert.equal(
  verifyLivingFrameComponentRigSpecDigest({
    ...rig,
    rigDigestSha256: digest('forged'),
  }),
  false,
)

console.log(JSON.stringify({
  suite: 'living-frame-component-rig',
  genericRigNodeCount: rig.metrics.nodeCount,
  motionTrackBindingCount: rig.metrics.motionTrackBindingCount,
  adversarialAssertions: 12,
  deterministicReplay: true,
  subjectSpecificRouting: false,
  workItemCreationAuthorityGranted:
    rig.authorityBoundary.workItemCreationAuthority,
  assetManifestMutationAuthorityGranted:
    rig.authorityBoundary.assetManifestMutationAuthority,
  renderOrProductionAuthorityGranted:
    rig.authorityBoundary.renderExecutionAuthority
      || rig.authorityBoundary.productionAuthority,
}))

function fullFrame() {
  return { x: 0, y: 0, width: 1, height: 1 }
}

function node(
  value: LivingFrameComponentRigSpec,
  componentId: string,
) {
  return value.nodes.find((entry) =>
    entry.componentId === componentId)!
}

function digest(value: string): string {
  return sha256AuthorityValue(value)
}

type Mutable<T> =
  T extends boolean ? boolean
    : T extends string ? string
      : T extends number ? number
        : T extends readonly (infer Item)[] ? Mutable<Item>[]
          : T extends object
            ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
            : T

function mutable(
  value: LivingFrameComponentRigSpec,
): Mutable<Omit<LivingFrameComponentRigSpec, 'rigDigestSha256'>> {
  const {
    rigDigestSha256: _ignored,
    ...draft
  } = structuredClone(value)
  void _ignored
  return draft as Mutable<Omit<
    LivingFrameComponentRigSpec,
    'rigDigestSha256'
  >>
}

function sign(
  draft: Mutable<Omit<
    LivingFrameComponentRigSpec,
    'rigDigestSha256'
  >>,
): LivingFrameComponentRigSpec {
  return {
    ...draft,
    rigDigestSha256: sha256AuthorityValue(draft),
  } as LivingFrameComponentRigSpec
}

function signUnknown(
  draft: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...draft,
    rigDigestSha256: sha256AuthorityValue(draft),
  }
}
