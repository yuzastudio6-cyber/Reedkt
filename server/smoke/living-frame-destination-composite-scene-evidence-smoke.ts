import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameGeneratedStillArtifactQaProjection,
  LivingFrameGeneratedStillArtifactQaProjectionDraft,
} from '../../src/types/living-frame-generated-still-artifact-qa-projection'
import {
  LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_OPEN_GATES,
} from '../../src/types/living-frame-generated-still-artifact-qa-projection'
import type {
  LivingFrameGeometryComponentDraft,
} from '../../src/types/living-frame-component-geometry'
import type {
  LivingFrameMotionTrackDraft,
} from '../../src/types/living-frame-deterministic-motion'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  measureLivingFrameAlphaArtifact,
} from '../living-frame/living-frame-alpha-measurement'
import {
  compileLivingFrameComponentGeometry,
} from '../living-frame/living-frame-component-geometry'
import {
  measureLivingFrameDestinationComposite,
} from '../living-frame/living-frame-destination-composite-measurement'
import {
  compileLivingFrameDestinationCompositeSceneEvidence,
} from '../living-frame/living-frame-destination-composite-scene-evidence'
import {
  compileLivingFrameDeterministicMotion,
} from '../living-frame/living-frame-deterministic-motion'
import {
  compileLivingFrameSceneEvidencePackage,
} from '../living-frame/living-frame-scene-evidence-package'

const WIDTH = 64
const HEIGHT = 64
const FRAME_INDEX = 12
const ARTIFACT_ID = 'lf.component.destination.scene.001'
const ARTIFACT_DIGEST = digest('rgba-png')
const rgba = cutout()
const baseAlpha = measureLivingFrameAlphaArtifact({
  artifactId: ARTIFACT_ID,
  artifactDigestSha256: ARTIFACT_DIGEST,
  width: WIDTH,
  height: HEIGHT,
  rgbaBytes: rgba,
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
})
const outputFrame = {
  outputFrameId: 'frame.landscape.1920x1080',
  outputFrameDigestSha256: digest('output-frame'),
  widthPixels: 1920,
  heightPixels: 1080,
  pixelAspectRatioNumerator: 1,
  pixelAspectRatioDenominator: 1,
  confirmedOutputFrameRevalidationRequired: true,
} as const
const motion = compileLivingFrameDeterministicMotion({
  timingExpectation: {
    masterTimingPlanId: 'master-timing-plan-001',
    masterTimingPlanDigestSha256: digest('master-timing'),
    outputFrameId: outputFrame.outputFrameId,
    outputFrameDigestSha256:
      outputFrame.outputFrameDigestSha256,
    sceneId: 'lf.scene.destination.001',
    sceneStartFrame: 10,
    sceneEndFrame: 20,
    fpsNumerator: 30,
    fpsDenominator: 1,
    timingAuthorityRevalidationRequired: true,
  },
  tracks: [motionTrack()],
})
const geometry = compileLivingFrameComponentGeometry({
  outputFrameExpectation: outputFrame,
  motionBundle: motion,
  safeRegions: [],
  components: [geometryComponent()],
  occlusionExpectations: [],
})
const destination = new Uint8Array(WIDTH * HEIGHT * 3)
destination.fill(24)
const measurement = measureLivingFrameDestinationComposite({
  measurementId: 'lf.destination.scene.measurement.001',
  artifactQaProjection: qaProjection(),
  baseAlphaMeasurementReport: baseAlpha,
  sceneBinding: {
    sceneId: motion.timingExpectation.sceneId,
    componentId: 'component.primary',
    outputFrameId: outputFrame.outputFrameId,
    outputFrameDigestSha256:
      outputFrame.outputFrameDigestSha256,
    masterTimingPlanId:
      motion.timingExpectation.masterTimingPlanId,
    masterTimingDigestSha256:
      motion.timingExpectation.masterTimingPlanDigestSha256,
    destinationFrameIndex: FRAME_INDEX,
  },
  componentArtifact: {
    artifactId: ARTIFACT_ID,
    artifactDigestSha256: ARTIFACT_DIGEST,
    width: WIDTH,
    height: HEIGHT,
    rgbaBytes: rgba,
  },
  destinationFrame: {
    artifactId: 'lf.destination.frame.001',
    artifactDigestSha256: digest('destination-frame'),
    frameIndex: FRAME_INDEX,
    width: WIDTH,
    height: HEIGHT,
    rgbBytes: destination,
  },
})

const componentEvidence =
  compileLivingFrameDestinationCompositeSceneEvidence({
    measurement,
    motionBundle: motion,
    componentGeometryBundle: geometry,
    alphaEdgeDecontaminationReport: null,
    continuity: {
      expectation: 'not_applicable',
      referenceArtifact: null,
      measurementReport: null,
    },
  })
const sceneEvidence = compileLivingFrameSceneEvidencePackage({
  motionBundle: motion,
  componentGeometryBundle: geometry,
  componentEvidence: [componentEvidence],
})

assert.equal(
  componentEvidence.alphaMeasurementReport?.compositeContext
    .destinationRasterProvided,
  true,
)
assert.equal(
  componentEvidence.alphaMeasurementReport?.reportDigestSha256,
  measurement.destinationAlphaMeasurementReport.reportDigestSha256,
)
assert.equal(
  sceneEvidence.packageState,
  'evidence_bound_pending_canonical_qa',
)
assert.deepEqual(sceneEvidence.packageBlockerCodes, [
  'canonical_artifact_qa_required',
  'canonical_snapshot_revalidation_required',
])
assert.equal(sceneEvidence.metrics.alphaMeasurementCount, 1)
assert.equal(sceneEvidence.authorityBoundary.artifactQaAuthority, false)
assert.equal(sceneEvidence.authorityBoundary.rendererAuthority, false)
assert.equal(sceneEvidence.authorityBoundary.productionAuthority, false)

assert.throws(() =>
  compileLivingFrameDestinationCompositeSceneEvidence({
    measurement,
    motionBundle: {
      ...motion,
      timingExpectation: {
        ...motion.timingExpectation,
        sceneId: 'lf.scene.wrong',
      },
    },
    componentGeometryBundle: geometry,
    alphaEdgeDecontaminationReport: null,
    continuity: {
      expectation: 'not_applicable',
      referenceArtifact: null,
      measurementReport: null,
    },
  }))

const lowContrastMeasurement =
  measureLivingFrameDestinationComposite({
    measurementId: 'lf.destination.scene.measurement.blocked',
    artifactQaProjection: qaProjection(),
    baseAlphaMeasurementReport: baseAlpha,
    sceneBinding: measurement.sceneBinding,
    componentArtifact: {
      artifactId: ARTIFACT_ID,
      artifactDigestSha256: ARTIFACT_DIGEST,
      width: WIDTH,
      height: HEIGHT,
      rgbaBytes: rgba,
    },
    destinationFrame: {
      artifactId: 'lf.destination.frame.blocked',
      artifactDigestSha256: digest('destination-frame-blocked'),
      frameIndex: FRAME_INDEX,
      width: WIDTH,
      height: HEIGHT,
      rgbBytes: matchingDestination(),
    },
  })
assert.equal(
  lowContrastMeasurement.measurementState,
  'blocked_by_destination_composite_findings',
)
assert.throws(() =>
  compileLivingFrameDestinationCompositeSceneEvidence({
    measurement: lowContrastMeasurement,
    motionBundle: motion,
    componentGeometryBundle: geometry,
    alphaEdgeDecontaminationReport: null,
    continuity: {
      expectation: 'not_applicable',
      referenceArtifact: null,
      measurementReport: null,
    },
  }))

console.log(
  'Living Frame destination-composite scene evidence passed exact scene/component/frame/timing lineage, existing package integration, low-contrast blocking, and closed-authority checks.',
)

function qaProjection():
  LivingFrameGeneratedStillArtifactQaProjection {
  const authorityBoundary = {
    structuralProjectionOnly: true as const,
    sourceTruthAuthority: false as const,
    selectedSceneAuthority: false as const,
    timingAuthority: false as const,
    soundAuthority: false as const,
    estimateAuthority: false as const,
    actualCostAuthority: false as const,
    customerPriceAuthority: false as const,
    customerCreditAuthority: false as const,
    serviceFeeAuthority: false as const,
    approvalAuthority: false as const,
    snapshotAuthority: false as const,
    workItemAuthority: false as const,
    workGraphAuthority: false as const,
    workerLeaseAuthority: false as const,
    queueAuthority: false as const,
    toolRegistryAuthority: false as const,
    dispatchAuthority: false as const,
    artifactPersistenceAuthority: false as const,
    artifactQaAuthority: false as const,
    assetManifestAuthority: false as const,
    continuityQaAuthority: false as const,
    documentaryFactAuthority: false as const,
    privateReviewAuthority: false as const,
    renderAuthority: false as const,
    runtimeAuthority: false as const,
    productionAuthority: false as const,
  }
  const draft:
    LivingFrameGeneratedStillArtifactQaProjectionDraft = {
    contractVersion:
      'living-frame-generated-still-artifact-qa-projection-v1',
    resultClass:
      'controlled_non_promotable_generated_still_artifact_qa_projection',
    projectionId: 'lf.destination.scene.qa.001',
    projectionState:
      'measured_alpha_ready_for_canonical_execution_admission',
    sourceBindings: {
      bridgeObservationId: 'lf.bridge.001',
      bridgeObservationDigestSha256: digest('bridge'),
      rembgRuntimeObservationDigestSha256: digest('rembg'),
      approvedPlanSnapshotId: 'approved-snapshot-001',
      expectedMaskAssetId: 'lf.mask.001',
      expectedAlphaComponentAssetId: ARTIFACT_ID,
      alphaMeasurementReportDigestSha256:
        baseAlpha.reportDigestSha256,
      measuredRgbaDigestSha256:
        baseAlpha.artifactIdentity.measuredRgbaDigestSha256,
    },
    dependencyProjection: [{
      order: 0,
      role: 'opaque_generated_source',
      artifactId: 'lf.generated.source.001',
      contentSha256: digest('generated-source'),
      expectedArtifactType:
        'living_frame_generated_opaque_still_png',
      contentType: 'image/png',
      serverRereadRequired: true,
      qaReconciliationRequired: true,
    }, {
      order: 1,
      role: 'verified_alpha_mask',
      artifactId: 'lf.mask.001',
      contentSha256: digest('mask'),
      expectedArtifactType: 'living_frame_alpha_mask_png',
      contentType: 'image/png',
      serverRereadRequired: true,
      qaReconciliationRequired: true,
    }],
    canonicalSharpExpectation: {
      canonicalToolId: 'sharp',
      operationId:
        'tool.sharp.prepare_approved_image_asset.v1',
      imageRecipeId:
        'approved_living_frame_alpha_component_v1',
      runnerClass:
        'offline_sharp_structured_execution_v1',
      outputArtifactId: ARTIFACT_ID,
      outputArtifactType:
        'living_frame_component_rgba_png',
      outputContentType: 'image/png',
      outputContentSha256: ARTIFACT_DIGEST,
      outputDecodedRgbaSha256:
        baseAlpha.artifactIdentity.measuredRgbaDigestSha256,
      alphaMode: 'straight_alpha',
      transparentRgbCleared: true,
      sourcePixelsUnmodified: true,
      canonicalDispatchRereadRequired: true,
      canonicalWorkerLeaseRequired: true,
      canonicalExecutionStillRequired: true,
    },
    canonicalQaExpectation: {
      requiredGateIds: [
        'asset_received_gate',
        'asset_quality_gate',
      ],
      alphaMeasurementFindingCodes: [
        'alpha_channel_variation_present',
      ],
      onlyNonBlockingAlphaVariationFindingPresent: true,
      multiBackgroundMeasurementPresent: true,
      destinationCompositeMeasurementPresent: false,
      canonicalArtifactQaStillRequired: true,
      destinationCompositeQaStillRequired: true,
    },
    existingAuthorityReuse: {
      canonicalWorkerLeaseAuthorityReused: true,
      canonicalPrivateImageArtifactStorageReused: true,
      canonicalPrivateArtifactQaAuthorityReused: true,
      canonicalAssetManifestReconciliationReused: true,
      canonicalPrivateReviewReused: true,
      duplicateTimingSystemCreated: false,
      duplicateWorkerSystemCreated: false,
      duplicateCreditSystemCreated: false,
      duplicateApprovalSystemCreated: false,
      duplicateQaSystemCreated: false,
      duplicateRendererCreated: false,
    },
    openGateCodes: [
      ...LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_OPEN_GATES,
    ],
    authorityBoundary,
    containsRawImageMaskOrAlphaBytes: false,
    containsPathUrlCredentialPromptOrCommand: false,
    artifactPersisted: false,
    artifactQaPassed: false,
    assetManifestUpdated: false,
    renderAuthorized: false,
    productionReady: false,
  }
  return {
    ...draft,
    projectionDigestSha256: sha256AuthorityValue(draft),
  }
}

function motionTrack(): LivingFrameMotionTrackDraft {
  return {
    trackId: 'track.primary.opacity',
    order: 0,
    motionGroupId: 'motion.primary',
    componentId: 'component.primary',
    property: 'opacity',
    role: 'primary',
    restorationExpectation: 'not_applicable',
    keyframes: [
      { frame: 10, value: 0, easingToNext: 'ease_out_quad' },
      { frame: 20, value: 1, easingToNext: 'hold' },
    ],
  }
}

function geometryComponent():
  LivingFrameGeometryComponentDraft {
  return {
    componentId: 'component.primary',
    order: 0,
    kind: 'visual_component',
    role: 'primary_subject',
    focalRole: 'primary',
    depthBand: 'subject_plane',
    rect: { x: 0.1, y: 0.1, width: 0.4, height: 0.6 },
    pivot: { x: 0.5, y: 0.5 },
    parentComponentId: null,
    anchorComponentId: null,
    anchorPoint: { x: 0.5, y: 0.5 },
    collisionPolicy: 'avoid_all_protected_regions',
    transparencyExpectation: 'still_alpha_required',
    alphaSourceExpectation:
      'postprocessed_still_mask_requires_qa',
    maskExpectation: 'still_alpha_artifact_required',
  }
}

function cutout(): Uint8Array {
  const output = new Uint8Array(WIDTH * HEIGHT * 4)
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const offset = (y * WIDTH + x) * 4
      const distance = Math.hypot(x - 31.5, y - 31.5)
      output[offset] = 220
      output[offset + 1] = 140
      output[offset + 2] = 80
      output[offset + 3] = distance <= 18
        ? 255
        : distance >= 24
          ? 0
          : Math.round((24 - distance) / 6 * 255)
    }
  }
  return output
}

function matchingDestination(): Uint8Array {
  const output = new Uint8Array(WIDTH * HEIGHT * 3)
  for (let index = 0; index < WIDTH * HEIGHT; index += 1) {
    output[index * 3] = 220
    output[index * 3 + 1] = 140
    output[index * 3 + 2] = 80
  }
  return output
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
