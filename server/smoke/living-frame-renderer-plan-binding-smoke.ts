import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameGeometryComponentDraft,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameMotionTrackDraft,
} from '../../src/types/living-frame-deterministic-motion'
import type {
  LivingFrameRendererPlanBinding,
} from '../../src/types/living-frame-renderer-plan-binding'
import type {
  LivingFrameSceneComponentEvidenceInput,
} from '../../src/types/living-frame-scene-evidence-package'
import type {
  RendererCompositionPlan,
  RendererLayerPlan,
} from '../../src/types/reeditpro'
import {
  measureLivingFrameAlphaArtifact,
} from '../living-frame/living-frame-alpha-measurement'
import {
  compileLivingFrameComponentGeometry,
} from '../living-frame/living-frame-component-geometry'
import {
  compileLivingFrameDeterministicMotion,
} from '../living-frame/living-frame-deterministic-motion'
import {
  compileLivingFrameRendererPlanBinding,
  verifyLivingFrameRendererPlanBindingDigest,
} from '../living-frame/living-frame-renderer-plan-binding'
import {
  compileLivingFrameRenderProjection,
} from '../living-frame/living-frame-render-projection'
import {
  compileLivingFrameSceneEvidencePackage,
} from '../living-frame/living-frame-scene-evidence-package'
import {
  measureLivingFrameTemporalMaskSequence,
} from '../living-frame/living-frame-temporal-mask-measurement'

const outputFrameExpectation = {
  outputFrameId: 'output-frame.renderer-binding',
  outputFrameDigestSha256: digest('a'),
  widthPixels: 1920,
  heightPixels: 1080,
  pixelAspectRatioNumerator: 1,
  pixelAspectRatioDenominator: 1,
  confirmedOutputFrameRevalidationRequired: true,
} as const

const motionBundle = createMotionBundle()
const geometryComponents = createGeometryComponents()
const geometryBundle = createGeometryBundle(
  motionBundle,
  geometryComponents,
)
const componentEvidence = createComponentEvidence()
const sceneEvidencePackage = compileLivingFrameSceneEvidencePackage({
  motionBundle,
  componentGeometryBundle: geometryBundle,
  componentEvidence,
})
const renderProjection = compileLivingFrameRenderProjection({
  motionBundle,
  componentGeometryBundle: geometryBundle,
  sceneEvidencePackage,
})
const rendererCompositionPlan = createRendererPlan()
const layerBindings = [
  {
    order: 0,
    projectedComponentId: 'component.background',
    rendererLayerId: 'renderer-layer.background',
  },
  {
    order: 1,
    projectedComponentId: 'component.primary',
    rendererLayerId: 'renderer-layer.primary',
  },
  {
    order: 2,
    projectedComponentId: 'component.speaker',
    rendererLayerId: 'renderer-layer.speaker',
  },
] as const

const binding = compileLivingFrameRendererPlanBinding({
  renderProjection,
  motionBundle,
  rendererCompositionPlan,
  layerBindings,
})

assert.equal(verifyLivingFrameRendererPlanBindingDigest(binding), true)
assert.equal(
  binding.bindingState,
  'candidate_pending_canonical_snapshot_projection',
)
assert.deepEqual(
  binding.layerBindings.map((entry) => entry.projectedComponentId),
  [
    'component.background',
    'component.primary',
    'component.speaker',
  ],
)
assert.deepEqual(
  binding.layerBindings.map((entry) => entry.rendererLayerId),
  [
    'renderer-layer.background',
    'renderer-layer.primary',
    'renderer-layer.speaker',
  ],
)
assert.deepEqual(
  binding.layerBindings.map((entry) => entry.rendererLayerType),
  ['background_panel', 'still_image', 'speaker_video'],
)
assert.deepEqual(
  binding.layerBindings.map((entry) => entry.zonePixels),
  [
    { x: 0, y: 0, width: 1920, height: 1080 },
    { x: 96, y: 108, width: 730, height: 562 },
    { x: 0, y: 0, width: 1920, height: 1080 },
  ],
)
assert.equal(binding.cameraBindings.length, 1)
assert.deepEqual(binding.captionLayerIds, ['renderer-layer.caption'])
assert.equal(binding.metrics.projectedLayerBindingCount, 3)
assert.equal(binding.metrics.projectedCameraBindingCount, 1)
assert.equal(binding.metrics.projectedMotionTrackCount, 3)
assert.equal(binding.metrics.projectedMotionSampleCount, 9)
assert.equal(binding.metrics.captionLayerCount, 1)
assert.equal(binding.authorityBoundary.rendererPlanAuthority, false)
assert.equal(binding.authorityBoundary.rendererLayerIdAuthority, false)
assert.equal(binding.authorityBoundary.masterTimingAuthority, false)
assert.equal(binding.authorityBoundary.snapshotAuthority, false)
assert.equal(binding.authorityBoundary.assetManifestAuthority, false)
assert.equal(binding.authorityBoundary.workGraphAuthority, false)
assert.equal(binding.authorityBoundary.remotionExecutionAuthority, false)
assert.equal(binding.authorityBoundary.productionAuthority, false)
assert.equal(binding.existingRendererCompositionPlanRemainsAuthority, true)
assert.equal(binding.remotionExecutionStillForbidden, true)

const replay = compileLivingFrameRendererPlanBinding({
  renderProjection,
  motionBundle,
  rendererCompositionPlan,
  layerBindings,
})
assert.equal(replay.bindingDigestSha256, binding.bindingDigestSha256)

const depthGeometry = createGeometryBundle(
  motionBundle,
  geometryComponents,
  true,
)
const depthPackage = compileLivingFrameSceneEvidencePackage({
  motionBundle,
  componentGeometryBundle: depthGeometry,
  componentEvidence,
})
const blockedProjection = compileLivingFrameRenderProjection({
  motionBundle,
  componentGeometryBundle: depthGeometry,
  sceneEvidencePackage: depthPackage,
})
const blockedBinding = compileLivingFrameRendererPlanBinding({
  renderProjection: blockedProjection,
  motionBundle,
  rendererCompositionPlan,
  layerBindings,
})
assert.equal(
  blockedBinding.bindingState,
  'blocked_by_living_frame_projection_gates',
)
assert.equal(
  blockedBinding.openGateCodes.includes(
    'living_frame_projection_blockers_must_resolve',
  ),
  true,
)

assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan: {
      ...rendererCompositionPlan,
      masterTimingPlanId: 'master-timing.wrong',
    },
    layerBindings,
  }),
  /lineage is inconsistent/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan: {
      ...rendererCompositionPlan,
      frameTemplate: {
        ...rendererCompositionPlan.frameTemplate,
        canvasWidth: 1280,
      },
    },
    layerBindings,
  }),
  /lineage is inconsistent/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan: {
      ...rendererCompositionPlan,
      fps: 24,
    },
    layerBindings,
  }),
  /lineage is inconsistent/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan: {
      ...rendererCompositionPlan,
      durationSeconds: 0.05,
    },
    layerBindings,
  }),
  /lineage is inconsistent/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan: {
      ...rendererCompositionPlan,
      approvalRequired: false,
    },
    layerBindings,
  }),
  /Renderer composition plan is invalid/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan: {
      ...rendererCompositionPlan,
      renderReady: true,
    },
    layerBindings,
  }),
  /Renderer composition plan is invalid/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan,
    layerBindings: layerBindings.slice(0, 2),
  }),
  /layer coverage is invalid/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan,
    layerBindings: [
      layerBindings[0],
      {
        ...layerBindings[1],
        projectedComponentId: 'component.background',
      },
      layerBindings[2],
    ],
  }),
  /layer binding is invalid/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan: modifyLayer(
      rendererCompositionPlan,
      'renderer-layer.primary',
      { layerType: 'source_video' },
    ),
    layerBindings,
  }),
  /mapping is incompatible/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan: modifyLayer(
      rendererCompositionPlan,
      'renderer-layer.primary',
      {
        zone: {
          ...rendererCompositionPlan.layers[1]!.zone,
          x: 97,
        },
      },
    ),
    layerBindings,
  }),
  /zone is inconsistent/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan: modifyLayer(
      rendererCompositionPlan,
      'renderer-layer.primary',
      { endTimeSeconds: 0.05 },
    ),
    layerBindings,
  }),
  /mapping is incompatible/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan: modifyLayer(
      rendererCompositionPlan,
      'renderer-layer.primary',
      { zIndex: -1 },
    ),
    layerBindings,
  }),
  /mapping is incompatible/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding({
    renderProjection,
    motionBundle,
    rendererCompositionPlan: modifyLayer(
      rendererCompositionPlan,
      'renderer-layer.caption',
      { zIndex: 15 },
    ),
    layerBindings,
  }),
  /would cover captions/,
)
assert.throws(
  () => compileLivingFrameRendererPlanBinding(({
    renderProjection,
    motionBundle,
    rendererCompositionPlan,
    layerBindings,
    providerId: 'forged-provider',
  }) as unknown as Parameters<
    typeof compileLivingFrameRendererPlanBinding
  >[0]),
  /input is invalid/,
)

assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(resignBinding({
    ...binding,
    authorityBoundary: {
      ...binding.authorityBoundary,
      rendererPlanAuthority: true,
      remotionExecutionAuthority: true,
      productionAuthority: true,
    },
  } as unknown as LivingFrameRendererPlanBinding)),
  false,
)
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(resignBinding({
    ...binding,
    bindingState: 'candidate_pending_canonical_snapshot_projection',
    projectionState: 'blocked_on_primitive_or_depth_qa',
  })),
  false,
)
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(resignBinding({
    ...binding,
    openGateCodes: binding.openGateCodes.filter(
      (gate) => gate !== 'canonical_snapshot_projection_required',
    ),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(resignBinding({
    ...binding,
    metrics: {
      ...binding.metrics,
      projectedMotionSampleCount: 999,
    },
  })),
  false,
)
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(resignBinding({
    ...binding,
    layerBindings: binding.layerBindings.map((entry, index) =>
      index === 1
        ? {
            ...entry,
            projectedComponentId: 'component.background',
          }
        : entry),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(resignBinding({
    ...binding,
    layerBindings: binding.layerBindings.map((entry, index) =>
      index === 1
        ? {
            ...entry,
            rendererLayerId: 'renderer-layer.background',
          }
        : entry),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(resignBinding({
    ...binding,
    layerBindings: binding.layerBindings.map((entry, index) =>
      index === 1
        ? { ...entry, zIndex: 0 }
        : entry),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(resignBinding({
    ...binding,
    layerBindings: binding.layerBindings.map((entry, index) =>
      index === 1
        ? {
            ...entry,
            rendererLayerType: 'source_video',
          }
        : entry),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(resignBinding({
    ...binding,
    cameraBindings: binding.cameraBindings.map((camera) => ({
      ...camera,
      motionTrackIds: ['track.primary.reveal'],
    })),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(resignBinding({
    ...binding,
    cameraBindings: binding.cameraBindings.map((camera) => ({
      ...camera,
      projectedComponentId: 'component.primary',
    })),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(resignBinding({
    ...binding,
    captionLayerIds: ['renderer-layer.primary'],
  })),
  false,
)
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest(resignBinding({
    ...binding,
    layerBindings: binding.layerBindings.map((entry, index) =>
      index === 1
        ? { ...entry, motionSampleCount: 0 }
        : entry),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRendererPlanBindingDigest({
    ...binding,
    workItemId: 'forged-work-item',
  }),
  false,
)

console.log(JSON.stringify({
  suite: 'living-frame-renderer-plan-binding',
  genericLayerBindingCount:
    binding.metrics.projectedLayerBindingCount,
  genericCameraBindingCount:
    binding.metrics.projectedCameraBindingCount,
  projectedMotionTrackCount:
    binding.metrics.projectedMotionTrackCount,
  projectedMotionSampleCount:
    binding.metrics.projectedMotionSampleCount,
  controlledBlockedBindingVariants: 1,
  adversarialAssertions: 26,
  deterministicReplay: true,
  subjectSpecificRouting: false,
  existingRendererPlanReused: true,
  rendererPlanAuthorityGranted:
    binding.authorityBoundary.rendererPlanAuthority,
  snapshotAuthorityGranted:
    binding.authorityBoundary.snapshotAuthority,
  remotionExecutionAuthorityGranted:
    binding.authorityBoundary.remotionExecutionAuthority,
  productionAuthorityGranted:
    binding.authorityBoundary.productionAuthority,
}))

function createMotionBundle() {
  return compileLivingFrameDeterministicMotion({
    timingExpectation: {
      masterTimingPlanId: 'master-timing.renderer-binding',
      masterTimingPlanDigestSha256: digest('b'),
      outputFrameId: outputFrameExpectation.outputFrameId,
      outputFrameDigestSha256:
        outputFrameExpectation.outputFrameDigestSha256,
      sceneId: 'scene.generic.renderer-binding',
      sceneStartFrame: 0,
      sceneEndFrame: 2,
      fpsNumerator: 30,
      fpsDenominator: 1,
      timingAuthorityRevalidationRequired: true,
    },
    tracks: [
      motionTrack({
        trackId: 'track.primary.reveal',
        order: 0,
        motionGroupId: 'motion.primary',
        componentId: 'component.primary',
        property: 'opacity',
        role: 'primary',
        keyframes: [
          { frame: 0, value: 0, easingToNext: 'ease_out_quad' },
          { frame: 2, value: 1, easingToNext: 'hold' },
        ],
      }),
      motionTrack({
        trackId: 'track.speaker.emphasis',
        order: 1,
        motionGroupId: 'motion.secondary',
        componentId: 'component.speaker',
        property: 'light_intensity',
        role: 'secondary',
        keyframes: [
          { frame: 0, value: 1, easingToNext: 'linear' },
          { frame: 2, value: 0.9, easingToNext: 'hold' },
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
          { frame: 0, value: 1, easingToNext: 'linear' },
          { frame: 2, value: 1.02, easingToNext: 'hold' },
        ],
      }),
    ],
  })
}

function createGeometryComponents(): LivingFrameGeometryComponentDraft[] {
  return [
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
      componentId: 'component.primary',
      order: 1,
      role: 'primary_subject',
      focalRole: 'primary',
      depthBand: 'behind_subject',
      rect: { x: 0.05, y: 0.1, width: 0.38, height: 0.52 },
      parentComponentId: 'component.background',
      anchorComponentId: 'component.background',
      collisionPolicy: 'avoid_all_protected_regions',
      transparencyExpectation: 'still_alpha_required',
      alphaSourceExpectation: 'postprocessed_still_mask_requires_qa',
      maskExpectation: 'still_alpha_artifact_required',
    }),
    visualComponent({
      componentId: 'component.speaker',
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
    {
      componentId: 'component.virtual-camera',
      order: 3,
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
}

function createGeometryBundle(
  motion: ReturnType<typeof createMotionBundle>,
  components: readonly LivingFrameGeometryComponentDraft[],
  depthTransition = false,
) {
  return compileLivingFrameComponentGeometry({
    outputFrameExpectation,
    motionBundle: motion,
    safeRegions: [],
    components,
    occlusionExpectations: [
      {
        relationId: 'occlusion.primary-over-background',
        order: 0,
        kind: 'in_front_of',
        foregroundComponentId: 'component.primary',
        backgroundComponentId: 'component.background',
        downstreamDepthTransitionCompilationRequired: false,
      },
      {
        relationId: 'occlusion.speaker-over-primary',
        order: 1,
        kind: depthTransition
          ? 'depth_transition_required'
          : 'in_front_of',
        foregroundComponentId: 'component.speaker',
        backgroundComponentId: 'component.primary',
        downstreamDepthTransitionCompilationRequired: depthTransition,
      },
    ],
  })
}

function createComponentEvidence():
  LivingFrameSceneComponentEvidenceInput[] {
  const rgbaBytes = cleanRgba(8, 8)
  const alphaReport = measureLivingFrameAlphaArtifact({
    artifactId: 'artifact.primary',
    artifactDigestSha256: digest('c'),
    width: 8,
    height: 8,
    rgbaBytes,
    alphaMode: 'straight_alpha',
    alphaExpectation: 'alpha_required',
    destinationRgbBytes: new Uint8Array(8 * 8 * 3).fill(20),
  })
  const maskReport = stableMaskReport()
  return [
    {
      componentId: 'component.background',
      artifactKind: 'opaque_raster',
      artifact: {
        artifactId: 'artifact.background',
        artifactDigestSha256: digest('d'),
      },
      maskArtifact: null,
      continuityExpectation: 'not_applicable',
      continuityReferenceArtifact: null,
      alphaMeasurementReport: null,
      temporalMaskMeasurementReport: null,
      alphaEdgeDecontaminationReport: null,
      visualContinuityMeasurementReport: null,
      primitiveQaExpectationRef: null,
    },
    {
      componentId: 'component.primary',
      artifactKind: 'still_rgba',
      artifact: {
        artifactId: 'artifact.primary',
        artifactDigestSha256: digest('c'),
      },
      maskArtifact: null,
      continuityExpectation: 'not_applicable',
      continuityReferenceArtifact: null,
      alphaMeasurementReport: alphaReport,
      temporalMaskMeasurementReport: null,
      alphaEdgeDecontaminationReport: null,
      visualContinuityMeasurementReport: null,
      primitiveQaExpectationRef: null,
    },
    {
      componentId: 'component.speaker',
      artifactKind: 'source_a_roll',
      artifact: {
        artifactId: 'artifact.source.a-roll',
        artifactDigestSha256: digest('e'),
      },
      maskArtifact: {
        artifactId: maskReport.sequenceIdentity.sequenceId,
        artifactDigestSha256:
          maskReport.sequenceIdentity.frameSetDigestSha256,
      },
      continuityExpectation: 'not_applicable',
      continuityReferenceArtifact: null,
      alphaMeasurementReport: null,
      temporalMaskMeasurementReport: maskReport,
      alphaEdgeDecontaminationReport: null,
      visualContinuityMeasurementReport: null,
      primitiveQaExpectationRef: null,
    },
  ]
}

function createRendererPlan(): RendererCompositionPlan {
  const layers: RendererLayerPlan[] = [
    rendererLayer({
      id: 'renderer-layer.background',
      layerType: 'background_panel',
      label: 'Generic background',
      zIndex: 0,
      zone: { x: 0, y: 0, width: 1920, height: 1080 },
      fitMode: 'fill',
    }),
    rendererLayer({
      id: 'renderer-layer.primary',
      layerType: 'still_image',
      label: 'Generic primary visual',
      zIndex: 10,
      zone: { x: 96, y: 108, width: 730, height: 562 },
      fitMode: 'contain',
    }),
    rendererLayer({
      id: 'renderer-layer.speaker',
      layerType: 'speaker_video',
      label: 'Source speaker',
      zIndex: 20,
      zone: { x: 0, y: 0, width: 1920, height: 1080 },
      fitMode: 'cover',
    }),
    rendererLayer({
      id: 'renderer-layer.caption',
      layerType: 'caption',
      label: 'Canonical captions',
      zIndex: 100,
      zone: { x: 96, y: 864, width: 1728, height: 162 },
      fitMode: 'safe_contain',
    }),
  ]
  return {
    id: 'renderer-composition.generic-living-frame',
    engine: 'remotion',
    frameTemplate: {
      templateType: 'horizontal_wide_frame',
      aspectRatio: '16:9',
      canvasWidth: 1920,
      canvasHeight: 1080,
      speakerZone: { x: 0, y: 0, width: 1920, height: 1080 },
      animationZone: { x: 0, y: 0, width: 1920, height: 1080 },
      captionSafeZone: {
        x: 96,
        y: 864,
        width: 1728,
        height: 162,
      },
      safeMargin: 96,
      panelBackgroundColor: '#101820',
      notes: ['Existing frame plan remains authoritative.'],
    },
    durationSeconds: 3,
    fps: 30,
    masterTimingPlanId: 'master-timing.renderer-binding',
    layers,
    captionSafeZone: {
      x: 96,
      y: 864,
      width: 1728,
      height: 162,
    },
    panelBackgroundColor: '#101820',
    rendererNotes: [
      'Existing renderer composition remains draft and approval-gated.',
    ],
    approvalRequired: true,
    renderReady: false,
  }
}

function rendererLayer(
  input: Pick<
    RendererLayerPlan,
    'id' | 'layerType' | 'label' | 'zIndex' | 'zone' | 'fitMode'
  >,
): RendererLayerPlan {
  return {
    ...input,
    startTimeSeconds: 0,
    endTimeSeconds: 3,
    notes: ['Controlled renderer-layer fixture.'],
  }
}

function modifyLayer(
  plan: RendererCompositionPlan,
  layerId: string,
  patch: Partial<RendererLayerPlan>,
): RendererCompositionPlan {
  return {
    ...plan,
    layers: plan.layers.map((layer) =>
      layer.id === layerId ? { ...layer, ...patch } : layer),
  }
}

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

function motionTrack(
  value: Omit<
    LivingFrameMotionTrackDraft,
    'restorationExpectation'
  >,
): LivingFrameMotionTrackDraft {
  return {
    restorationExpectation: 'not_applicable',
    ...value,
  }
}

function stableMaskReport() {
  const width = 8
  const height = 8
  const alphaBytes = new Uint8Array(width * height)
  for (let y = 2; y <= 5; y += 1) {
    for (let x = 2; x <= 5; x += 1) alphaBytes[y * width + x] = 255
  }
  return measureLivingFrameTemporalMaskSequence({
    sequenceId: 'artifact.mask.sequence',
    width,
    height,
    frames: [0, 1, 2].map((frameIndex) => ({
      frameIndex,
      artifactId: `artifact.mask.frame.${frameIndex}`,
      artifactDigestSha256: digest(String(frameIndex + 1)),
      alphaBytes: new Uint8Array(alphaBytes),
    })),
  })
}

function cleanRgba(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const edgeDistance = Math.min(
        x,
        y,
        width - 1 - x,
        height - 1 - y,
      )
      bytes[index] = 220
      bytes[index + 1] = 80
      bytes[index + 2] = 40
      bytes[index + 3] = edgeDistance === 0
        ? 0
        : edgeDistance === 1 ? 96 : edgeDistance === 2 ? 208 : 255
    }
  }
  return bytes
}

function fullFrame() {
  return { x: 0, y: 0, width: 1, height: 1 } as const
}

function digest(character: string): string {
  return character.repeat(64).slice(0, 64)
}

function resignBinding(
  value: LivingFrameRendererPlanBinding,
): LivingFrameRendererPlanBinding {
  const { bindingDigestSha256: _bindingDigestSha256, ...draft } = value
  void _bindingDigestSha256
  return {
    ...draft,
    bindingDigestSha256: createHash('sha256')
      .update(canonicalJsonStringify(draft))
      .digest('hex'),
  }
}

function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(canonicalize)
  return Object.fromEntries(
    Object.entries(value as Readonly<Record<string, unknown>>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  )
}
