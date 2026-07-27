import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameGeometryComponentDraft,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameMotionTrackDraft,
} from '../../src/types/living-frame-deterministic-motion'
import type {
  LivingFrameRenderProjection,
} from '../../src/types/living-frame-render-projection'
import type {
  LivingFrameSceneComponentEvidenceInput,
} from '../../src/types/living-frame-scene-evidence-package'
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
  compileLivingFrameRenderProjection,
  verifyLivingFrameRenderProjectionDigest,
} from '../living-frame/living-frame-render-projection'
import {
  compileLivingFrameSceneEvidencePackage,
} from '../living-frame/living-frame-scene-evidence-package'
import {
  measureLivingFrameTemporalMaskSequence,
} from '../living-frame/living-frame-temporal-mask-measurement'

const outputFrameExpectation = {
  outputFrameId: 'output-frame.render-projection',
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
const projection = compileLivingFrameRenderProjection({
  motionBundle,
  componentGeometryBundle: geometryBundle,
  sceneEvidencePackage,
})

assert.equal(verifyLivingFrameRenderProjectionDigest(projection), true)
assert.equal(
  projection.projectionState,
  'candidate_pending_canonical_renderer_adapter',
)
assert.deepEqual(
  projection.projectedLayers.map((layer) => layer.componentId),
  ['component.background', 'component.primary', 'component.speaker'],
)
assert.deepEqual(
  projection.projectedLayers.map((layer) => layer.primitive),
  [
    'opaque_raster_layer',
    'rgba_raster_layer',
    'temporally_masked_source_layer',
  ],
)
assert.equal(projection.projectedCameras.length, 1)
assert.equal(projection.metrics.projectedLayerCount, 3)
assert.equal(projection.metrics.projectedCameraCount, 1)
assert.equal(projection.metrics.projectedMotionTrackCount, 3)
assert.equal(projection.metrics.maskedLayerCount, 1)
assert.equal(projection.metrics.alphaLayerCount, 1)
assert.equal(projection.metrics.proceduralLayerCount, 0)
assert.equal(projection.openGateCodes.includes(
  'canonical_renderer_plan_projection_required',
), true)
assert.equal(projection.openGateCodes.includes(
  'canonical_caption_layering_required',
), true)
assert.equal(projection.authorityBoundary.rendererPlanAuthority, false)
assert.equal(projection.authorityBoundary.rendererLayerIdAuthority, false)
assert.equal(projection.authorityBoundary.assetManifestAuthority, false)
assert.equal(projection.authorityBoundary.masterTimingAuthority, false)
assert.equal(projection.authorityBoundary.remotionExecutionAuthority, false)
assert.equal(projection.authorityBoundary.productionAuthority, false)
assert.equal(projection.remotionExecutionStillForbidden, true)
assert.equal(projection.containsExecutableCodeOrCommands, false)

const replay = compileLivingFrameRenderProjection({
  motionBundle,
  componentGeometryBundle: geometryBundle,
  sceneEvidencePackage,
})
assert.equal(replay.projectionDigestSha256, projection.projectionDigestSha256)

const proceduralGeometry = createGeometryBundle(
  motionBundle,
  geometryComponents.map((component) =>
    component.componentId === 'component.primary'
      ? {
          ...component,
          transparencyExpectation: 'procedural_alpha',
          alphaSourceExpectation: 'procedural_alpha_requires_qa',
          maskExpectation: 'procedural_alpha_artifact_required',
        }
      : component),
)
const proceduralPackage = compileLivingFrameSceneEvidencePackage({
  motionBundle,
  componentGeometryBundle: proceduralGeometry,
  componentEvidence: componentEvidence.map((entry) =>
    entry.componentId === 'component.primary'
      ? {
          ...entry,
          artifactKind: 'procedural_alpha_primitive',
          alphaMeasurementReport: null,
          primitiveQaExpectationRef: {
            refId: 'primitive-qa.primary',
            version: 'controlled-v1',
            digestSha256: digest('9'),
            currentCanonicalQaRevalidationRequired: true,
          },
        }
      : entry),
})
const proceduralProjection = compileLivingFrameRenderProjection({
  motionBundle,
  componentGeometryBundle: proceduralGeometry,
  sceneEvidencePackage: proceduralPackage,
})
assert.equal(
  proceduralProjection.projectionState,
  'blocked_on_primitive_or_depth_qa',
)
assert.equal(proceduralProjection.metrics.proceduralLayerCount, 1)
assert.equal(proceduralProjection.openGateCodes.includes(
  'procedural_primitive_qa_required',
), true)

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
const depthProjection = compileLivingFrameRenderProjection({
  motionBundle,
  componentGeometryBundle: depthGeometry,
  sceneEvidencePackage: depthPackage,
})
assert.equal(
  depthProjection.projectionState,
  'blocked_on_primitive_or_depth_qa',
)
assert.equal(depthProjection.openGateCodes.includes(
  'depth_transition_compilation_required',
), true)

const badAlpha = measureLivingFrameAlphaArtifact({
  artifactId: 'artifact.primary',
  artifactDigestSha256: digest('c'),
  width: 8,
  height: 8,
  rgbaBytes: new Uint8Array(8 * 8 * 4).fill(255),
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
  destinationRgbBytes: new Uint8Array(8 * 8 * 3).fill(20),
})
const measurementBlockedPackage = compileLivingFrameSceneEvidencePackage({
  motionBundle,
  componentGeometryBundle: geometryBundle,
  componentEvidence: componentEvidence.map((entry) =>
    entry.componentId === 'component.primary'
      ? { ...entry, alphaMeasurementReport: badAlpha }
      : entry),
})
assert.throws(
  () => compileLivingFrameRenderProjection({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    sceneEvidencePackage: measurementBlockedPackage,
  }),
  /rejects measurement-blocked evidence/,
)

assert.equal(
  verifyLivingFrameRenderProjectionDigest({
    ...projection,
    projectionState: 'render_ready',
  }),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest({
    ...projection,
    authorityBoundary: {
      ...projection.authorityBoundary,
      rendererPlanAuthority: true,
      productionAuthority: true,
    },
  }),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest({
    ...projection,
    captionLayerRequirement: {
      ...projection.captionLayerRequirement,
      canonicalCaptionLayerMustRemainAboveProjectedComponents: false,
    },
  }),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest({
    ...projection,
    openGateCodes: projection.openGateCodes.filter(
      (gate) => gate !== 'canonical_renderer_plan_projection_required',
    ),
  }),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest({
    ...projection,
    metrics: { ...projection.metrics, projectedLayerCount: 99 },
  }),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest({
    ...projection,
    projectedLayers: projection.projectedLayers.map((layer, index) =>
      index === 1
        ? {
            ...layer,
            motionTracks: layer.motionTracks.map((track) => ({
              ...track,
              samples: track.samples.map((sample, sampleIndex) =>
                sampleIndex === 0
                  ? { ...sample, frame: sample.frame + 1 }
                  : sample),
            })),
          }
        : layer),
  }),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest({
    ...projection,
    providerId: 'forged-provider',
  }),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest(resignProjection({
    ...projection,
    projectedLayers: projection.projectedLayers.map((layer) =>
      layer.componentId === 'component.primary'
        ? {
            ...layer,
            motionTracks: layer.motionTracks.map((track) => ({
              ...track,
              componentId: 'component.background',
            })),
          }
        : layer),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest(resignProjection({
    ...projection,
    projectedCameras: projection.projectedCameras.map((camera) => ({
      ...camera,
      motionTracks: camera.motionTracks.map((track) => ({
        ...track,
        trackId: 'track.primary.reveal',
      })),
    })),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest(resignProjection({
    ...projection,
    projectedLayers: projection.projectedLayers.map((layer) =>
      layer.componentId === 'component.primary'
        ? { ...layer, parentComponentId: 'component.missing-parent' }
        : layer),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest(resignProjection({
    ...projection,
    projectedLayers: projection.projectedLayers.map((layer) =>
      layer.componentId === 'component.primary'
        ? { ...layer, anchorComponentId: 'component.missing-anchor' }
        : layer),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest(resignProjection({
    ...projection,
    projectedLayers: projection.projectedLayers.map((layer) =>
      layer.componentId === 'component.primary'
        ? {
            ...layer,
            intersectingSafeRegionIds: ['safe-region.missing'],
          }
        : layer),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest(resignProjection({
    ...projection,
    occlusionExpectations: projection.occlusionExpectations.map(
      (relation, index) =>
        index === 0
          ? {
              ...relation,
              foregroundComponentId: 'component.missing-foreground',
            }
          : relation,
    ),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest(resignProjection({
    ...projection,
    projectedLayers: projection.projectedLayers.map((layer) =>
      layer.componentId === 'component.primary'
        ? { ...layer, depthRank: 99 }
        : layer),
  })),
  false,
)
assert.equal(
  verifyLivingFrameRenderProjectionDigest(resignProjection({
    ...projection,
    projectedLayers: projection.projectedLayers.map((layer) =>
      layer.componentId === 'component.primary'
        ? { ...layer, relativeDepthOrder: 99 }
        : layer),
  })),
  false,
)

assert.throws(
  () => compileLivingFrameRenderProjection({
    motionBundle: {
      ...motionBundle,
      bundleDigestSha256: digest('1'),
    },
    componentGeometryBundle: geometryBundle,
    sceneEvidencePackage,
  }),
  /input is invalid/,
)
assert.throws(
  () => compileLivingFrameRenderProjection({
    motionBundle,
    componentGeometryBundle: {
      ...geometryBundle,
      bundleDigestSha256: digest('2'),
    },
    sceneEvidencePackage,
  }),
  /input is invalid/,
)
assert.throws(
  () => compileLivingFrameRenderProjection({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    sceneEvidencePackage: {
      ...sceneEvidencePackage,
      packageDigestSha256: digest('3'),
    },
  }),
  /input is invalid/,
)
assert.throws(
  () => compileLivingFrameRenderProjection(({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    sceneEvidencePackage,
    workItemId: 'forged-work-item',
  }) as unknown as Parameters<
    typeof compileLivingFrameRenderProjection
  >[0]),
  /input is invalid/,
)

const cameraOnVisualMotion = createMotionBundle({
  primaryRole: 'camera',
})
const cameraOnVisualGeometry = createGeometryBundle(
  cameraOnVisualMotion,
  geometryComponents,
)
const cameraOnVisualPackage = compileLivingFrameSceneEvidencePackage({
  motionBundle: cameraOnVisualMotion,
  componentGeometryBundle: cameraOnVisualGeometry,
  componentEvidence,
})
assert.throws(
  () => compileLivingFrameRenderProjection({
    motionBundle: cameraOnVisualMotion,
    componentGeometryBundle: cameraOnVisualGeometry,
    sceneEvidencePackage: cameraOnVisualPackage,
  }),
  /motion role placement is invalid/,
)

const visualOnCameraMotion = createMotionBundle({
  cameraRole: 'secondary',
})
const visualOnCameraGeometry = createGeometryBundle(
  visualOnCameraMotion,
  geometryComponents,
)
const visualOnCameraPackage = compileLivingFrameSceneEvidencePackage({
  motionBundle: visualOnCameraMotion,
  componentGeometryBundle: visualOnCameraGeometry,
  componentEvidence,
})
assert.throws(
  () => compileLivingFrameRenderProjection({
    motionBundle: visualOnCameraMotion,
    componentGeometryBundle: visualOnCameraGeometry,
    sceneEvidencePackage: visualOnCameraPackage,
  }),
  /motion role placement is invalid/,
)

const multipleCameraGeometry = createGeometryBundle(
  motionBundle,
  [
    ...geometryComponents,
    {
      ...geometryComponents[3]!,
      componentId: 'component.virtual-camera.second',
      order: 4,
    },
  ],
)
const multipleCameraPackage = compileLivingFrameSceneEvidencePackage({
  motionBundle,
  componentGeometryBundle: multipleCameraGeometry,
  componentEvidence,
})
assert.throws(
  () => compileLivingFrameRenderProjection({
    motionBundle,
    componentGeometryBundle: multipleCameraGeometry,
    sceneEvidencePackage: multipleCameraPackage,
  }),
  /supports one virtual camera/,
)

console.log(JSON.stringify({
  suite: 'living-frame-render-projection',
  genericProjectedLayerCount: projection.metrics.projectedLayerCount,
  projectedMotionTrackCount:
    projection.metrics.projectedMotionTrackCount,
  projectedMotionSampleCount:
    projection.metrics.projectedMotionSampleCount,
  controlledBlockedProjectionVariants: 2,
  adversarialAssertions: 24,
  deterministicReplay: true,
  subjectSpecificRouting: false,
  rendererPlanAuthorityGranted:
    projection.authorityBoundary.rendererPlanAuthority,
  remotionExecutionAuthorityGranted:
    projection.authorityBoundary.remotionExecutionAuthority,
  productionAuthorityGranted:
    projection.authorityBoundary.productionAuthority,
}))

function createMotionBundle(options: {
  readonly primaryRole?: LivingFrameMotionTrackDraft['role']
  readonly cameraRole?: LivingFrameMotionTrackDraft['role']
} = {}) {
  return compileLivingFrameDeterministicMotion({
    timingExpectation: {
      masterTimingPlanId: 'master-timing.render-projection',
      masterTimingPlanDigestSha256: digest('b'),
      outputFrameId: outputFrameExpectation.outputFrameId,
      outputFrameDigestSha256:
        outputFrameExpectation.outputFrameDigestSha256,
      sceneId: 'scene.generic.render-projection',
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
        role: options.primaryRole ?? 'primary',
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
        role: options.cameraRole ?? 'camera',
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
      const edgeDistance = Math.min(x, y, width - 1 - x, height - 1 - y)
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

function resignProjection(
  value: LivingFrameRenderProjection,
): LivingFrameRenderProjection {
  const { projectionDigestSha256: _projectionDigestSha256, ...draft } = value
  void _projectionDigestSha256
  return {
    ...draft,
    projectionDigestSha256: createHash('sha256')
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
