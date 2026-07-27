import assert from 'node:assert/strict'

import type {
  LivingFrameGeometryComponentDraft,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameSceneComponentEvidenceInput,
} from '../../src/types/living-frame-scene-evidence-package'
import type {
  LivingFrameMotionTrackDraft,
} from '../../src/types/living-frame-deterministic-motion'
import {
  decontaminateLivingFrameAlphaEdges,
} from '../living-frame/living-frame-alpha-edge-decontamination'
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
  compileLivingFrameSceneEvidencePackage,
  verifyLivingFrameSceneEvidencePackageDigest,
} from '../living-frame/living-frame-scene-evidence-package'
import {
  measureLivingFrameTemporalMaskSequence,
} from '../living-frame/living-frame-temporal-mask-measurement'
import {
  measureLivingFrameVisualContinuity,
} from '../living-frame/living-frame-visual-continuity-measurement'

const outputFrameExpectation = {
  outputFrameId: 'output-frame.generic-scene',
  outputFrameDigestSha256: digest('a'),
  widthPixels: 1920,
  heightPixels: 1080,
  pixelAspectRatioNumerator: 1,
  pixelAspectRatioDenominator: 1,
  confirmedOutputFrameRevalidationRequired: true,
} as const

const motionBundle = compileLivingFrameDeterministicMotion({
  timingExpectation: {
    masterTimingPlanId: 'master-timing.generic-scene',
    masterTimingPlanDigestSha256: digest('b'),
    outputFrameId: outputFrameExpectation.outputFrameId,
    outputFrameDigestSha256:
      outputFrameExpectation.outputFrameDigestSha256,
    sceneId: 'scene.generic.evidence-package',
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
        { frame: 0, value: 1, easingToNext: 'ease_in_out_cubic' },
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
        { frame: 0, value: 1, easingToNext: 'ease_in_out_cubic' },
        { frame: 2, value: 1.02, easingToNext: 'hold' },
      ],
    }),
  ],
})

const geometryComponents: LivingFrameGeometryComponentDraft[] = [
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
    rect: { x: 0.06, y: 0.12, width: 0.36, height: 0.5 },
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

const geometryBundle = compileLivingFrameComponentGeometry({
  outputFrameExpectation,
  motionBundle,
  safeRegions: [],
  components: geometryComponents,
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
      kind: 'in_front_of',
      foregroundComponentId: 'component.speaker',
      backgroundComponentId: 'component.primary',
      downstreamDepthTransitionCompilationRequired: false,
    },
  ],
})

const primaryArtifact = {
  artifactId: 'artifact.primary.rgba',
  artifactDigestSha256: digest('c'),
}
const referenceArtifact = {
  artifactId: 'artifact.primary.reference',
  artifactDigestSha256: digest('d'),
}
const primaryRgba = cleanRgba(8, 8)
const destinationRgb = new Uint8Array(8 * 8 * 3).fill(32)
const alphaReport = measureLivingFrameAlphaArtifact({
  ...primaryArtifact,
  width: 8,
  height: 8,
  rgbaBytes: primaryRgba,
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
  destinationRgbBytes: destinationRgb,
})
assert.deepEqual(alphaReport.findingCodes, [
  'alpha_channel_variation_present',
])

const continuityReport = measureLivingFrameVisualContinuity({
  comparisonMode: 'aligned_same_view_component',
  width: 8,
  height: 8,
  reference: {
    ...referenceArtifact,
    rgbaBytes: primaryRgba,
  },
  candidate: {
    ...primaryArtifact,
    rgbaBytes: primaryRgba,
  },
})
assert.deepEqual(continuityReport.findingCodes, [])

const maskReport = stableMaskReport(0, 2)
assert.deepEqual(maskReport.findingCodes, [])

const componentEvidence: LivingFrameSceneComponentEvidenceInput[] = [
  {
    componentId: 'component.background',
    artifactKind: 'opaque_raster',
    artifact: {
      artifactId: 'artifact.background',
      artifactDigestSha256: digest('e'),
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
    artifact: primaryArtifact,
    maskArtifact: null,
    continuityExpectation: 'required',
    continuityReferenceArtifact: referenceArtifact,
    alphaMeasurementReport: alphaReport,
    temporalMaskMeasurementReport: null,
    alphaEdgeDecontaminationReport: null,
    visualContinuityMeasurementReport: continuityReport,
    primitiveQaExpectationRef: null,
  },
  {
    componentId: 'component.speaker',
    artifactKind: 'source_a_roll',
    artifact: {
      artifactId: 'artifact.source.a-roll',
      artifactDigestSha256: digest('f'),
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

const compiled = compileLivingFrameSceneEvidencePackage({
  motionBundle,
  componentGeometryBundle: geometryBundle,
  componentEvidence,
})

assert.equal(verifyLivingFrameSceneEvidencePackageDigest(compiled), true)
assert.equal(
  compiled.packageState,
  'evidence_bound_pending_canonical_qa',
)
assert.deepEqual(compiled.packageBlockerCodes, [
  'canonical_artifact_qa_required',
  'canonical_snapshot_revalidation_required',
])
assert.equal(compiled.metrics.visualComponentCount, 3)
assert.equal(compiled.metrics.alphaMeasurementCount, 1)
assert.equal(compiled.metrics.temporalMaskMeasurementCount, 1)
assert.equal(compiled.metrics.continuityMeasurementCount, 1)
assert.equal(compiled.metrics.blockedComponentCount, 0)
assert.equal(compiled.authorityBoundary.selectedSceneAuthority, false)
assert.equal(compiled.authorityBoundary.artifactQaAuthority, false)
assert.equal(compiled.authorityBoundary.masterTimingAuthority, false)
assert.equal(compiled.authorityBoundary.assetManifestAuthority, false)
assert.equal(compiled.authorityBoundary.rendererAuthority, false)
assert.equal(compiled.authorityBoundary.productionAuthority, false)
assert.equal(compiled.containsRawMediaOrMaskBytes, false)

const replay = compileLivingFrameSceneEvidencePackage({
  motionBundle,
  componentGeometryBundle: geometryBundle,
  componentEvidence: [...componentEvidence].reverse(),
})
assert.equal(replay.packageDigestSha256, compiled.packageDigestSha256)

const opaqueAlphaReport = measureLivingFrameAlphaArtifact({
  ...primaryArtifact,
  width: 8,
  height: 8,
  rgbaBytes: new Uint8Array(8 * 8 * 4).fill(255),
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
  destinationRgbBytes: destinationRgb,
})
const blockedByAlpha = compileLivingFrameSceneEvidencePackage({
  motionBundle,
  componentGeometryBundle: geometryBundle,
  componentEvidence: componentEvidence.map((entry) =>
    entry.componentId === 'component.primary'
      ? {
          ...entry,
          continuityExpectation: 'not_applicable',
          continuityReferenceArtifact: null,
          visualContinuityMeasurementReport: null,
          alphaMeasurementReport: opaqueAlphaReport,
        }
      : entry),
})
assert.equal(
  blockedByAlpha.packageState,
  'blocked_by_measurement_findings',
)
assert.equal(
  blockedByAlpha.packageBlockerCodes.includes(
    'alpha_measurement_findings_block',
  ),
  true,
)

const unstableMask = stableMaskReport(0, 2, true)
const blockedByMask = compileLivingFrameSceneEvidencePackage({
  motionBundle,
  componentGeometryBundle: geometryBundle,
  componentEvidence: componentEvidence.map((entry) =>
    entry.componentId === 'component.speaker'
      ? {
          ...entry,
          maskArtifact: {
            artifactId: unstableMask.sequenceIdentity.sequenceId,
            artifactDigestSha256:
              unstableMask.sequenceIdentity.frameSetDigestSha256,
          },
          temporalMaskMeasurementReport: unstableMask,
        }
      : entry),
})
assert.equal(
  blockedByMask.packageState,
  'blocked_by_measurement_findings',
)
assert.equal(
  blockedByMask.packageBlockerCodes.includes(
    'temporal_mask_measurement_findings_block',
  ),
  true,
)

const matteSource = matteContaminatedRgba(8, 8)
const decontaminated = decontaminateLivingFrameAlphaEdges({
  artifactId: 'artifact.primary.pre-decontamination',
  artifactDigestSha256: digest('6'),
  width: 8,
  height: 8,
  rgbaBytes: matteSource,
  inputAlphaMode: 'straight_alpha_with_known_matte_contamination',
  knownSourceMatteRgb: [255, 255, 255],
})
const decontaminatedAlphaReport = measureLivingFrameAlphaArtifact({
  ...primaryArtifact,
  width: 8,
  height: 8,
  rgbaBytes: decontaminated.outputRgbaBytes,
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
  destinationRgbBytes: destinationRgb,
})
const decontaminatedContinuity = measureLivingFrameVisualContinuity({
  comparisonMode: 'aligned_same_view_component',
  width: 8,
  height: 8,
  reference: {
    ...referenceArtifact,
    rgbaBytes: decontaminated.outputRgbaBytes,
  },
  candidate: {
    ...primaryArtifact,
    rgbaBytes: decontaminated.outputRgbaBytes,
  },
})
const decontaminationBound = compileLivingFrameSceneEvidencePackage({
  motionBundle,
  componentGeometryBundle: geometryBundle,
  componentEvidence: componentEvidence.map((entry) =>
    entry.componentId === 'component.primary'
      ? {
          ...entry,
          alphaMeasurementReport: decontaminatedAlphaReport,
          alphaEdgeDecontaminationReport: decontaminated.report,
          visualContinuityMeasurementReport: decontaminatedContinuity,
        }
      : entry),
})
assert.equal(
  decontaminationBound.metrics.decontaminationMeasurementCount,
  1,
)

const proceduralGeometry = compileLivingFrameComponentGeometry({
  outputFrameExpectation,
  motionBundle,
  safeRegions: [],
  components: geometryComponents.map((entry) =>
    entry.componentId === 'component.primary'
      ? {
          ...entry,
          transparencyExpectation: 'procedural_alpha',
          alphaSourceExpectation: 'procedural_alpha_requires_qa',
          maskExpectation: 'procedural_alpha_artifact_required',
        }
      : entry),
  occlusionExpectations: geometryBundle.occlusionExpectations,
})
const proceduralBlocked = compileLivingFrameSceneEvidencePackage({
  motionBundle,
  componentGeometryBundle: proceduralGeometry,
  componentEvidence: componentEvidence.map((entry) =>
    entry.componentId === 'component.primary'
      ? {
          ...entry,
          artifactKind: 'procedural_alpha_primitive',
          continuityExpectation: 'not_applicable',
          continuityReferenceArtifact: null,
          alphaMeasurementReport: null,
          visualContinuityMeasurementReport: null,
          primitiveQaExpectationRef: {
            refId: 'primitive-qa.primary',
            version: 'controlled-v1',
            digestSha256: digest('7'),
            currentCanonicalQaRevalidationRequired: true,
          },
        }
      : entry),
})
assert.equal(
  proceduralBlocked.packageState,
  'blocked_by_unresolved_primitive_qa',
)
assert.equal(
  proceduralBlocked.packageBlockerCodes.includes(
    'procedural_alpha_qa_required',
  ),
  true,
)

assert.equal(
  verifyLivingFrameSceneEvidencePackageDigest({
    ...compiled,
    packageState: 'production_ready',
  }),
  false,
)
assert.equal(
  verifyLivingFrameSceneEvidencePackageDigest({
    ...compiled,
    authorityBoundary: {
      ...compiled.authorityBoundary,
      artifactQaAuthority: true,
      productionAuthority: true,
    },
  }),
  false,
)
assert.equal(
  verifyLivingFrameSceneEvidencePackageDigest({
    ...compiled,
    metrics: { ...compiled.metrics, blockedComponentCount: 99 },
  }),
  false,
)
assert.equal(
  verifyLivingFrameSceneEvidencePackageDigest({
    ...compiled,
    componentEvidenceBindings: compiled.componentEvidenceBindings.map(
      (entry) =>
        entry.componentId === 'component.primary'
          ? { ...entry, alphaFindingCodes: ['forged_all_green'] }
          : entry,
    ),
  }),
  false,
)
assert.equal(
  verifyLivingFrameSceneEvidencePackageDigest({
    ...compiled,
    queueId: 'forged-queue',
  }),
  false,
)

assert.throws(
  () => compileLivingFrameSceneEvidencePackage({
    motionBundle: {
      ...motionBundle,
      bundleDigestSha256: digest('1'),
    },
    componentGeometryBundle: geometryBundle,
    componentEvidence,
  }),
  /input shape is invalid/,
)
assert.throws(
  () => compileLivingFrameSceneEvidencePackage({
    motionBundle,
    componentGeometryBundle: {
      ...geometryBundle,
      bundleDigestSha256: digest('2'),
    },
    componentEvidence,
  }),
  /input shape is invalid/,
)
assert.throws(
  () => compileLivingFrameSceneEvidencePackage({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    componentEvidence: componentEvidence.slice(0, 2),
  }),
  /cover every visual component/,
)
assert.throws(
  () => compileLivingFrameSceneEvidencePackage({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    componentEvidence: [
      componentEvidence[0]!,
      componentEvidence[1]!,
      { ...componentEvidence[1]!, componentId: 'component.primary' },
    ],
  }),
  /component evidence identity is invalid/,
)
assert.throws(
  () => compileLivingFrameSceneEvidencePackage({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    componentEvidence: componentEvidence.map((entry) =>
      entry.componentId === 'component.primary'
        ? {
            ...entry,
            artifact: {
              ...entry.artifact,
              artifactDigestSha256: digest('3'),
            },
          }
        : entry),
  }),
  /still-alpha component evidence is invalid/,
)
assert.throws(
  () => compileLivingFrameSceneEvidencePackage({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    componentEvidence: componentEvidence.map((entry) =>
      entry.componentId === 'component.speaker'
        ? {
            ...entry,
            maskArtifact: {
              ...entry.maskArtifact!,
              artifactDigestSha256: digest('4'),
            },
          }
        : entry),
  }),
  /temporal-mask component evidence is invalid/,
)
const wrongFrameMask = stableMaskReport(1, 3)
assert.throws(
  () => compileLivingFrameSceneEvidencePackage({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    componentEvidence: componentEvidence.map((entry) =>
      entry.componentId === 'component.speaker'
        ? {
            ...entry,
            maskArtifact: {
              artifactId: wrongFrameMask.sequenceIdentity.sequenceId,
              artifactDigestSha256:
                wrongFrameMask.sequenceIdentity.frameSetDigestSha256,
            },
            temporalMaskMeasurementReport: wrongFrameMask,
          }
        : entry),
  }),
  /temporal-mask component evidence is invalid/,
)
assert.throws(
  () => compileLivingFrameSceneEvidencePackage({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    componentEvidence: componentEvidence.map((entry) =>
      entry.componentId === 'component.primary'
        ? {
            ...entry,
            continuityReferenceArtifact: {
              ...referenceArtifact,
              artifactDigestSha256: digest('5'),
            },
          }
        : entry),
  }),
  /continuity component evidence is invalid/,
)
const mismatchedMeasuredContinuity = measureLivingFrameVisualContinuity({
  comparisonMode: 'aligned_same_view_component',
  width: 8,
  height: 8,
  reference: {
    ...referenceArtifact,
    rgbaBytes: primaryRgba,
  },
  candidate: {
    ...primaryArtifact,
    rgbaBytes: decontaminated.outputRgbaBytes,
  },
})
assert.throws(
  () => compileLivingFrameSceneEvidencePackage({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    componentEvidence: componentEvidence.map((entry) =>
      entry.componentId === 'component.primary'
        ? {
            ...entry,
            visualContinuityMeasurementReport:
              mismatchedMeasuredContinuity,
          }
        : entry),
  }),
  /continuity component evidence is invalid/,
)
assert.throws(
  () => compileLivingFrameSceneEvidencePackage({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    componentEvidence: componentEvidence.map((entry) =>
      entry.componentId === 'component.primary'
        ? { ...entry, visualContinuityMeasurementReport: null }
        : entry),
  }),
  /continuity component evidence is invalid/,
)
assert.throws(
  () => compileLivingFrameSceneEvidencePackage({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    componentEvidence: componentEvidence.map((entry) =>
      entry.componentId === 'component.background'
        ? { ...entry, alphaMeasurementReport: alphaReport }
        : entry),
  }),
  /opaque component evidence is invalid/,
)
assert.throws(
  () => compileLivingFrameSceneEvidencePackage(({
    motionBundle,
    componentGeometryBundle: geometryBundle,
    componentEvidence,
    providerId: 'forged-provider',
  }) as unknown as Parameters<
    typeof compileLivingFrameSceneEvidencePackage
  >[0]),
  /input shape is invalid/,
)

console.log(JSON.stringify({
  suite: 'living-frame-scene-evidence-package',
  genericVisualComponentCount: compiled.metrics.visualComponentCount,
  alphaMeasurementCount: compiled.metrics.alphaMeasurementCount,
  temporalMaskMeasurementCount:
    compiled.metrics.temporalMaskMeasurementCount,
  continuityMeasurementCount:
    compiled.metrics.continuityMeasurementCount,
  controlledBlockedVariants: 3,
  adversarialAssertions: 16,
  deterministicReplay: true,
  subjectSpecificRouting: false,
  selectedSceneAuthorityGranted:
    compiled.authorityBoundary.selectedSceneAuthority,
  artifactQaAuthorityGranted:
    compiled.authorityBoundary.artifactQaAuthority,
  rendererOrProductionAuthorityGranted:
    compiled.authorityBoundary.rendererAuthority
    || compiled.authorityBoundary.productionAuthority,
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

function cleanRgba(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const edgeDistance = Math.min(x, y, width - 1 - x, height - 1 - y)
      const alpha = edgeDistance === 0
        ? 0
        : edgeDistance === 1 ? 96 : edgeDistance === 2 ? 208 : 255
      bytes[index] = 220
      bytes[index + 1] = 80
      bytes[index + 2] = 40
      bytes[index + 3] = alpha
    }
  }
  return bytes
}

function matteContaminatedRgba(
  width: number,
  height: number,
): Uint8Array {
  const clean = cleanRgba(width, height)
  const matte: readonly [number, number, number] = [255, 255, 255]
  for (let index = 0; index < clean.length; index += 4) {
    const alpha = clean[index + 3]! / 255
    for (let channel = 0; channel < 3; channel += 1) {
      clean[index + channel] = Math.round(
        clean[index + channel]! * alpha + matte[channel]! * (1 - alpha),
      )
    }
  }
  return clean
}

function stableMaskReport(
  firstFrame: number,
  lastFrame: number,
  unstable = false,
) {
  const width = 8
  const height = 8
  const base = new Uint8Array(width * height)
  for (let y = 2; y <= 5; y += 1) {
    for (let x = 2; x <= 5; x += 1) base[y * width + x] = 255
  }
  const frames = []
  for (let frameIndex = firstFrame; frameIndex <= lastFrame; frameIndex += 1) {
    const alphaBytes = new Uint8Array(base)
    if (unstable && frameIndex === lastFrame) {
      alphaBytes.fill(0)
      for (let y = 0; y <= 2; y += 1) {
        for (let x = 0; x <= 2; x += 1) alphaBytes[y * width + x] = 255
      }
    }
    frames.push({
      frameIndex,
      artifactId: `artifact.mask.frame.${frameIndex}`,
      artifactDigestSha256: digest(String((frameIndex % 9) + 1)),
      alphaBytes,
    })
  }
  return measureLivingFrameTemporalMaskSequence({
    sequenceId: `artifact.mask.sequence.${firstFrame}-${lastFrame}${unstable ? '.unstable' : ''}`,
    width,
    height,
    frames,
  })
}

function fullFrame() {
  return { x: 0, y: 0, width: 1, height: 1 } as const
}

function digest(character: string): string {
  return character.repeat(64).slice(0, 64)
}
