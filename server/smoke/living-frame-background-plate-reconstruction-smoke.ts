import assert from 'node:assert/strict'

import type {
  LivingFrameBackgroundPlateReconstructionSpec,
} from '../../src/types/living-frame-background-plate-reconstruction'
import {
  compileLivingFrameBackgroundPlateReconstruction,
  verifyLivingFrameBackgroundPlateReconstructionSpecDigest,
} from '../living-frame/living-frame-background-plate-reconstruction'
import {
  compileLivingFrameComponentGeometry,
} from '../living-frame/living-frame-component-geometry'
import {
  compileLivingFrameComponentRig,
} from '../living-frame/living-frame-component-rig'
import {
  compileLivingFrameDeterministicMotion,
} from '../living-frame/living-frame-deterministic-motion'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const outputFrameId = 'output-frame.controlled'
const outputFrameDigestSha256 = digest('output-frame')
const motionBundle = compileLivingFrameDeterministicMotion({
  timingExpectation: {
    masterTimingPlanId: 'master-timing.controlled',
    masterTimingPlanDigestSha256: digest('master-timing'),
    outputFrameId,
    outputFrameDigestSha256,
    sceneId: 'scene.generic.component-separation',
    sceneStartFrame: 0,
    sceneEndFrame: 60,
    fpsNumerator: 30,
    fpsDenominator: 1,
    timingAuthorityRevalidationRequired: true,
  },
  tracks: [{
    trackId: 'track.component.rotation',
    order: 0,
    motionGroupId: 'motion.primary',
    componentId: 'component.removable',
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
        frame: 60,
        value: 720,
        easingToNext: 'hold',
      },
    ],
  }],
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
      componentId: 'component.removable',
      order: 1,
      kind: 'visual_component',
      role: 'mechanical_component',
      focalRole: 'primary',
      depthBand: 'subject_plane',
      rect: { x: 0, y: 0.1, width: 0.7, height: 0.7 },
      pivot: { x: 0.4, y: 0.4 },
      parentComponentId: 'component.background',
      anchorComponentId: 'component.background',
      anchorPoint: { x: 0.4, y: 0.4 },
      collisionPolicy: 'avoid_all_protected_regions',
      transparencyExpectation: 'still_alpha_required',
      alphaSourceExpectation:
        'postprocessed_still_mask_requires_qa',
      maskExpectation: 'still_alpha_artifact_required',
    },
  ],
  occlusionExpectations: [{
    relationId: 'occlusion.removable-over-background',
    order: 0,
    kind: 'in_front_of',
    foregroundComponentId: 'component.removable',
    backgroundComponentId: 'component.background',
    downstreamDepthTransitionCompilationRequired: false,
  }],
})

const componentRig = compileLivingFrameComponentRig({
  geometryBundle,
  motionBundle,
})

const reconstruction =
  compileLivingFrameBackgroundPlateReconstruction({
    componentRig,
    holes: [
      {
        holeId: 'hole.small.ordinary',
        order: 0,
        plateComponentId: 'component.background',
        removedComponentId: 'component.removable',
        normalizedBounds: {
          x: 0.2,
          y: 0.2,
          width: 0.15,
          height: 0.15,
        },
        frameCoverageRatio: 0.015,
        touchesFrameBoundary: false,
        textureClass: 'low',
        safetyClass: 'ordinary_visual_region',
        maskEvidenceExpectation:
          'future_qa_passed_component_alpha_artifact_required',
      },
      {
        holeId: 'hole.bounded.ordinary',
        order: 1,
        plateComponentId: 'component.background',
        removedComponentId: 'component.removable',
        normalizedBounds: {
          x: 0.4,
          y: 0.3,
          width: 0.25,
          height: 0.2,
        },
        frameCoverageRatio: 0.04,
        touchesFrameBoundary: false,
        textureClass: 'medium',
        safetyClass: 'ordinary_visual_region',
        maskEvidenceExpectation:
          'future_qa_passed_component_alpha_artifact_required',
      },
      {
        holeId: 'hole.evidence.blocked',
        order: 2,
        plateComponentId: 'component.background',
        removedComponentId: 'component.removable',
        normalizedBounds: {
          x: 0.1,
          y: 0.6,
          width: 0.2,
          height: 0.15,
        },
        frameCoverageRatio: 0.02,
        touchesFrameBoundary: false,
        textureClass: 'low',
        safetyClass: 'documentary_evidence_region',
        maskEvidenceExpectation:
          'future_qa_passed_component_alpha_artifact_required',
      },
    ],
  })

assert.equal(
  verifyLivingFrameBackgroundPlateReconstructionSpecDigest(
    reconstruction,
  ),
  true,
)
assert.equal(reconstruction.metrics.holeCount, 3)
assert.equal(reconstruction.metrics.smallHoleCandidateCount, 1)
assert.equal(reconstruction.metrics.boundedHoleCandidateCount, 1)
assert.equal(reconstruction.metrics.fallbackOnlyCount, 1)
assert.equal(reconstruction.metrics.prohibitedSafetyRegionCount, 1)
assert.equal(
  reconstruction.decisions[0]?.reconstructionProfile,
  'openimageio_pushpull_small_hole_candidate',
)
assert.equal(
  reconstruction.decisions[1]?.reconstructionProfile,
  'openimageio_pushpull_bounded_hole_candidate',
)
assert.equal(
  reconstruction.decisions[2]?.reconstructionProfile,
  'no_pixel_reconstruction_use_fallback',
)
assert.equal(
  reconstruction.decisions[0]?.fillholesModeExpectation,
  'pushpull',
)
assert.equal(
  reconstruction.decisions[2]?.fillholesModeExpectation,
  'none',
)
assert.equal(
  reconstruction.decisions[2]?.blockerCodes.includes(
    'documentary_evidence_reconstruction_prohibited',
  ),
  true,
)
assert.deepEqual(
  reconstruction.decisions[0]?.fallbackLadder,
  [
    'keep_component_static_over_original_plate',
    'reframe_to_hide_unreconstructed_region',
    'use_opaque_full_scene_or_panel',
    'omit_living_frame_depth_effect',
  ],
)
assert.equal(
  reconstruction.artifactExpectation.workItemTypeExpectation,
  'reconstruct_background_plate',
)
assert.equal(
  reconstruction.artifactExpectation.artifactTypeExpectation,
  'living_frame_reconstructed_background_plate_png',
)
assert.equal(
  reconstruction.authorityBoundary.pixelExecutionAuthority,
  false,
)
assert.equal(
  reconstruction.authorityBoundary.toolRouteAuthority,
  false,
)
assert.equal(
  reconstruction.authorityBoundary.assetManifestMutationAuthority,
  false,
)
assert.equal(reconstruction.subjectSpecificRouting, false)
assert.equal(reconstruction.createsPixels, false)

const replay =
  compileLivingFrameBackgroundPlateReconstruction({
    componentRig,
    holes: [
      expectation(reconstruction, 0),
      expectation(reconstruction, 1),
      expectation(reconstruction, 2),
    ],
  })
assert.equal(
  replay.reconstructionDigestSha256,
  reconstruction.reconstructionDigestSha256,
)

const wrongRig = mutable(componentRig)
wrongRig.rigDigestSha256 = digest('wrong-rig')
assert.throws(
  () => compileLivingFrameBackgroundPlateReconstruction({
    componentRig: wrongRig,
    holes: [expectation(reconstruction, 0)],
  }),
  /component rig is invalid/,
)

const duplicateOrder = expectation(reconstruction, 0)
duplicateOrder.order = 1
assert.throws(
  () => compileLivingFrameBackgroundPlateReconstruction({
    componentRig,
    holes: [duplicateOrder],
  }),
  /hole values are invalid/,
)

const outsideComponent = expectation(reconstruction, 0)
outsideComponent.normalizedBounds = {
  x: 0.8,
  y: 0.2,
  width: 0.1,
  height: 0.1,
}
outsideComponent.frameCoverageRatio = 0.005
assert.throws(
  () => compileLivingFrameBackgroundPlateReconstruction({
    componentRig,
    holes: [outsideComponent],
  }),
  /bounded removable component/,
)

const impossibleCoverage = expectation(reconstruction, 0)
impossibleCoverage.frameCoverageRatio = 0.1
assert.throws(
  () => compileLivingFrameBackgroundPlateReconstruction({
    componentRig,
    holes: [impossibleCoverage],
  }),
  /hole values are invalid/,
)

const falseBoundaryClaim = expectation(reconstruction, 0)
falseBoundaryClaim.normalizedBounds = {
  x: 0,
  y: 0.2,
  width: 0.15,
  height: 0.15,
}
assert.throws(
  () => compileLivingFrameBackgroundPlateReconstruction({
    componentRig,
    holes: [falseBoundaryClaim],
  }),
  /hole values are invalid/,
)

const boundaryFallback =
  compileLivingFrameBackgroundPlateReconstruction({
    componentRig,
    holes: [{
      ...falseBoundaryClaim,
      touchesFrameBoundary: true,
    }],
  })
assert.equal(
  boundaryFallback.decisions[0]?.reconstructionProfile,
  'no_pixel_reconstruction_use_fallback',
)
assert.equal(
  boundaryFallback.decisions[0]?.blockerCodes.includes(
    'hole_touches_frame_boundary',
  ),
  true,
)

const oversizedFallback =
  compileLivingFrameBackgroundPlateReconstruction({
    componentRig,
    holes: [{
      ...expectation(reconstruction, 1),
      order: 0,
      frameCoverageRatio: 0.06,
      normalizedBounds: {
        x: 0.35,
        y: 0.25,
        width: 0.3,
        height: 0.25,
      },
    }],
  })
assert.equal(
  oversizedFallback.decisions[0]?.blockerCodes.includes(
    'hole_area_exceeds_deterministic_ceiling',
  ),
  true,
)
assert.equal(
  oversizedFallback.decisions[0]?.reconstructionProfile,
  'no_pixel_reconstruction_use_fallback',
)

for (const [safetyClass, blockerCode] of [
  [
    'identity_or_likeness_sensitive_region',
    'identity_or_likeness_reconstruction_prohibited',
  ],
  [
    'exact_map_or_data_region',
    'exact_map_or_data_reconstruction_prohibited',
  ],
] as const) {
  const protectedRegion =
    compileLivingFrameBackgroundPlateReconstruction({
      componentRig,
      holes: [{
        ...expectation(reconstruction, 0),
        safetyClass,
      }],
    })
  assert.equal(
    protectedRegion.decisions[0]?.reconstructionProfile,
    'no_pixel_reconstruction_use_fallback',
  )
  assert.equal(
    protectedRegion.decisions[0]?.blockerCodes.includes(
      blockerCode,
    ),
    true,
  )
}

const alteredFallback = mutable(reconstruction)
alteredFallback.decisions[0]!.fallbackLadder.reverse()
assert.equal(
  verifyLivingFrameBackgroundPlateReconstructionSpecDigest(
    sign(alteredFallback),
  ),
  false,
)

const forgedExecutable = mutable(reconstruction)
;(
  forgedExecutable.decisions[0] as unknown as {
    executablePixelOperationAdmitted: boolean
  }
).executablePixelOperationAdmitted = true
assert.equal(
  verifyLivingFrameBackgroundPlateReconstructionSpecDigest(
    sign(forgedExecutable),
  ),
  false,
)

const forgedAuthority = mutable(reconstruction)
;(
  forgedAuthority.authorityBoundary as unknown as {
    pixelExecutionAuthority: boolean
  }
).pixelExecutionAuthority = true
assert.equal(
  verifyLivingFrameBackgroundPlateReconstructionSpecDigest(
    sign(forgedAuthority),
  ),
  false,
)

const subjectSpecific = mutable(reconstruction) as Record<
  string,
  unknown
>
subjectSpecific.musashiRoute = true
assert.equal(
  verifyLivingFrameBackgroundPlateReconstructionSpecDigest(
    sign(subjectSpecific),
  ),
  false,
)

const executablePayload = mutable(reconstruction) as Record<
  string,
  unknown
>
executablePayload.command = 'python -c'
assert.equal(
  verifyLivingFrameBackgroundPlateReconstructionSpecDigest(
    sign(executablePayload),
  ),
  false,
)

const unknownProfile = mutable(reconstruction)
;(
  unknownProfile.decisions[0] as unknown as {
    reconstructionProfile: string
  }
).reconstructionProfile = 'generate_video_to_hide_hole'
assert.equal(
  verifyLivingFrameBackgroundPlateReconstructionSpecDigest(
    sign(unknownProfile),
  ),
  false,
)

const allGreenForgery = mutable(reconstruction) as Record<
  string,
  unknown
>
allGreenForgery.productionReady = true
allGreenForgery.approved = true
allGreenForgery.providerRoute = 'forged'
assert.equal(
  verifyLivingFrameBackgroundPlateReconstructionSpecDigest(
    sign(allGreenForgery),
  ),
  false,
)

console.log(JSON.stringify({
  ok: true,
  contractVersion: reconstruction.contractVersion,
  holeCount: reconstruction.metrics.holeCount,
  smallHoleCandidateCount:
    reconstruction.metrics.smallHoleCandidateCount,
  boundedHoleCandidateCount:
    reconstruction.metrics.boundedHoleCandidateCount,
  fallbackOnlyCount:
    reconstruction.metrics.fallbackOnlyCount,
  adversarialAssertions: 18,
  subjectSpecificRouting: reconstruction.subjectSpecificRouting,
  pixelExecutionAuthority:
    reconstruction.authorityBoundary.pixelExecutionAuthority,
  productionAuthority:
    reconstruction.authorityBoundary.productionAuthority,
}))

function expectation(
  spec: LivingFrameBackgroundPlateReconstructionSpec,
  index: number,
) {
  const decision = spec.decisions[index]!
  return {
    holeId: decision.holeId,
    order: decision.order,
    plateComponentId: decision.plateComponentId,
    removedComponentId: decision.removedComponentId,
    normalizedBounds: { ...decision.normalizedBounds },
    frameCoverageRatio: decision.frameCoverageRatio,
    touchesFrameBoundary: decision.blockerCodes.includes(
      'hole_touches_frame_boundary',
    ),
    textureClass: decision.textureClass,
    safetyClass: decision.safetyClass,
    maskEvidenceExpectation:
      'future_qa_passed_component_alpha_artifact_required' as const,
  }
}

function fullFrame() {
  return { x: 0, y: 0, width: 1, height: 1 }
}

function digest(label: string) {
  return sha256AuthorityValue({ label })
}

type Mutable<T> =
  T extends readonly (infer U)[]
    ? Mutable<U>[]
    : T extends object
      ? { -readonly [K in keyof T]: Mutable<T[K]> }
      : T

function mutable<T>(value: T): Mutable<T> {
  return structuredClone(value) as Mutable<T>
}

function sign<T extends Record<string, unknown>>(value: T): T {
  const draft = { ...value }
  delete draft.reconstructionDigestSha256
  return {
    ...draft,
    reconstructionDigestSha256: sha256AuthorityValue(draft),
  } as unknown as T
}
