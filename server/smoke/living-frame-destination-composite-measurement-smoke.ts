import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameAlphaMeasurementReport,
} from '../../src/types/living-frame-alpha-measurement'
import {
  LIVING_FRAME_GENERATED_STILL_ARTIFACT_QA_OPEN_GATES,
  type LivingFrameGeneratedStillArtifactQaProjection,
  type LivingFrameGeneratedStillArtifactQaProjectionDraft,
} from '../../src/types/living-frame-generated-still-artifact-qa-projection'
import {
  measureLivingFrameAlphaArtifact,
} from '../living-frame/living-frame-alpha-measurement'
import {
  measureLivingFrameDestinationComposite,
  verifyLivingFrameDestinationCompositeMeasurement,
} from '../living-frame/living-frame-destination-composite-measurement'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const WIDTH = 64
const HEIGHT = 64
const ARTIFACT_ID = 'lf.component.destination.qa.001'
const ARTIFACT_DIGEST = digest('component-png')
const DESTINATION_ID = 'lf.destination.frame.001'
const DESTINATION_DIGEST = digest('destination-frame-png')
const FRAME_INDEX = 150

const component = cutout([235, 196, 74])
const baseReport = baseMeasurement(component)
assert.deepEqual(baseReport.findingCodes, [
  'alpha_channel_variation_present',
])
const projection = qaProjection(baseReport)
const destination = destinationRaster([18, 27, 42])

const measurement = measureLivingFrameDestinationComposite({
  measurementId: 'lf.destination.measurement.001',
  artifactQaProjection: projection,
  baseAlphaMeasurementReport: baseReport,
  sceneBinding: {
    sceneId: 'lf.scene.generic.001',
    componentId: 'lf.component.generic.001',
    outputFrameId: 'frame.landscape.1920x1080',
    outputFrameDigestSha256: digest('output-frame'),
    masterTimingPlanId: 'master-timing-plan-001',
    masterTimingDigestSha256: digest('master-timing'),
    destinationFrameIndex: FRAME_INDEX,
  },
  componentArtifact: {
    artifactId: ARTIFACT_ID,
    artifactDigestSha256: ARTIFACT_DIGEST,
    width: WIDTH,
    height: HEIGHT,
    rgbaBytes: component,
  },
  destinationFrame: {
    artifactId: DESTINATION_ID,
    artifactDigestSha256: DESTINATION_DIGEST,
    frameIndex: FRAME_INDEX,
    width: WIDTH,
    height: HEIGHT,
    rgbBytes: destination,
  },
})

assert.equal(
  verifyLivingFrameDestinationCompositeMeasurement(measurement),
  true,
)
assert.equal(
  measurement.measurementState,
  'measurement_clear_pending_canonical_qa',
)
assert.equal(
  measurement.destinationAlphaMeasurementReport
    .compositeContext.destinationRasterProvided,
  true,
)
assert.deepEqual(
  measurement.destinationAlphaMeasurementReport
    .composites.map((entry) => entry.backgroundId),
  [
    'black',
    'white',
    'mid_gray',
    'saturated_red',
    'destination_raster',
  ],
)
assert.deepEqual(measurement.blockingFindingCodes, [])
assert.equal(measurement.canonicalQaPassed, false)
assert.equal(measurement.assetManifestUpdated, false)
assert.equal(measurement.sceneEvidenceReconciled, false)
assert.equal(measurement.remotionAuthorized, false)
assert.equal(measurement.productionReady, false)
assert.equal(
  JSON.stringify(measurement).includes('rgbaBytes'),
  false,
)
assert.equal(
  JSON.stringify(measurement).includes('rgbBytes'),
  false,
)

const lowContrastComponent = cutout([128, 128, 128])
const lowContrastBase = baseMeasurement(lowContrastComponent)
const lowContrast = measureLivingFrameDestinationComposite({
  measurementId: 'lf.destination.measurement.low-contrast',
  artifactQaProjection: qaProjection(lowContrastBase),
  baseAlphaMeasurementReport: lowContrastBase,
  sceneBinding: {
    ...sceneBinding(),
  },
  componentArtifact: {
    artifactId: ARTIFACT_ID,
    artifactDigestSha256: ARTIFACT_DIGEST,
    width: WIDTH,
    height: HEIGHT,
    rgbaBytes: lowContrastComponent,
  },
  destinationFrame: {
    artifactId: DESTINATION_ID,
    artifactDigestSha256: DESTINATION_DIGEST,
    frameIndex: FRAME_INDEX,
    width: WIDTH,
    height: HEIGHT,
    rgbBytes: destinationRaster([128, 128, 128]),
  },
})
assert.equal(
  lowContrast.measurementState,
  'blocked_by_destination_composite_findings',
)
assert(
  lowContrast.blockingFindingCodes.includes(
    'destination_edge_contrast_low',
  ),
)

const tampered = structuredClone(measurement) as
  Mutable<typeof measurement>
tampered.destinationFrame.decodedRgbDigestSha256 =
  digest('forged-destination')
assert.equal(
  verifyLivingFrameDestinationCompositeMeasurement(tampered),
  false,
)

const {
  measurementDigestSha256: _promotedDigest,
  ...promotionDraft
} = structuredClone(measurement)
void _promotedDigest
const promotedDraft = {
  ...promotionDraft,
  canonicalQaPassed: true,
  authorityBoundary: {
    ...promotionDraft.authorityBoundary,
    artifactQaAuthority: true,
  },
}
const promoted = {
  ...promotedDraft,
  measurementDigestSha256:
    sha256AuthorityValue(promotedDraft),
}
assert.equal(
  verifyLivingFrameDestinationCompositeMeasurement(promoted),
  false,
)

const {
  measurementDigestSha256: _unknownDigest,
  ...unknownDraft
} = structuredClone(measurement)
void _unknownDigest
const unknownKeyDraft = {
  ...unknownDraft,
  providerId: 'forbidden-provider',
}
assert.equal(
  verifyLivingFrameDestinationCompositeMeasurement({
    ...unknownKeyDraft,
    measurementDigestSha256:
      sha256AuthorityValue(unknownKeyDraft),
  }),
  false,
)

assert.throws(() =>
  measureLivingFrameDestinationComposite({
    measurementId: 'lf.destination.measurement.wrong-pixels',
    artifactQaProjection: projection,
    baseAlphaMeasurementReport: baseReport,
    sceneBinding: sceneBinding(),
    componentArtifact: {
      artifactId: ARTIFACT_ID,
      artifactDigestSha256: ARTIFACT_DIGEST,
      width: WIDTH,
      height: HEIGHT,
      rgbaBytes: cutout([50, 100, 150]),
    },
    destinationFrame: {
      artifactId: DESTINATION_ID,
      artifactDigestSha256: DESTINATION_DIGEST,
      frameIndex: FRAME_INDEX,
      width: WIDTH,
      height: HEIGHT,
      rgbBytes: destination,
    },
  }))

assert.throws(() =>
  measureLivingFrameDestinationComposite({
    measurementId: 'lf.destination.measurement.wrong-frame',
    artifactQaProjection: projection,
    baseAlphaMeasurementReport: baseReport,
    sceneBinding: sceneBinding(),
    componentArtifact: {
      artifactId: ARTIFACT_ID,
      artifactDigestSha256: ARTIFACT_DIGEST,
      width: WIDTH,
      height: HEIGHT,
      rgbaBytes: component,
    },
    destinationFrame: {
      artifactId: DESTINATION_ID,
      artifactDigestSha256: DESTINATION_DIGEST,
      frameIndex: FRAME_INDEX + 1,
      width: WIDTH,
      height: HEIGHT,
      rgbBytes: destination,
    },
  }))

assert.throws(() =>
  measureLivingFrameDestinationComposite({
    measurementId: 'lf.destination.measurement.wrong-size',
    artifactQaProjection: projection,
    baseAlphaMeasurementReport: baseReport,
    sceneBinding: sceneBinding(),
    componentArtifact: {
      artifactId: ARTIFACT_ID,
      artifactDigestSha256: ARTIFACT_DIGEST,
      width: WIDTH,
      height: HEIGHT,
      rgbaBytes: component,
    },
    destinationFrame: {
      artifactId: DESTINATION_ID,
      artifactDigestSha256: DESTINATION_DIGEST,
      frameIndex: FRAME_INDEX,
      width: WIDTH / 2,
      height: HEIGHT * 2,
      rgbBytes: destination,
    },
  }))

console.log(
  'Living Frame destination-composite measurement passed exact RGBA/frame/timing lineage, five-background measurement, low-contrast blocking, tamper, and forged-promotion checks.',
)

function baseMeasurement(
  rgbaBytes: Uint8Array,
): LivingFrameAlphaMeasurementReport {
  return measureLivingFrameAlphaArtifact({
    artifactId: ARTIFACT_ID,
    artifactDigestSha256: ARTIFACT_DIGEST,
    width: WIDTH,
    height: HEIGHT,
    rgbaBytes,
    alphaMode: 'straight_alpha',
    alphaExpectation: 'alpha_required',
  })
}

function qaProjection(
  report: LivingFrameAlphaMeasurementReport,
): LivingFrameGeneratedStillArtifactQaProjection {
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
    projectionId: 'lf.generated.artifact.qa.001',
    projectionState:
      'measured_alpha_ready_for_canonical_execution_admission',
    sourceBindings: {
      bridgeObservationId: 'lf.bridge.001',
      bridgeObservationDigestSha256: digest('bridge'),
      rembgRuntimeObservationDigestSha256: digest('rembg-runtime'),
      approvedPlanSnapshotId: 'approved-snapshot-001',
      expectedMaskAssetId: 'lf.mask.001',
      expectedAlphaComponentAssetId: ARTIFACT_ID,
      alphaMeasurementReportDigestSha256:
        report.reportDigestSha256,
      measuredRgbaDigestSha256:
        report.artifactIdentity.measuredRgbaDigestSha256,
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
        report.artifactIdentity.measuredRgbaDigestSha256,
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
    projectionDigestSha256:
      sha256AuthorityValue(draft),
  }
}

function sceneBinding() {
  return {
    sceneId: 'lf.scene.generic.001',
    componentId: 'lf.component.generic.001',
    outputFrameId: 'frame.landscape.1920x1080',
    outputFrameDigestSha256: digest('output-frame'),
    masterTimingPlanId: 'master-timing-plan-001',
    masterTimingDigestSha256: digest('master-timing'),
    destinationFrameIndex: FRAME_INDEX,
  }
}

function cutout(
  rgb: readonly [number, number, number],
): Uint8Array {
  const output = new Uint8Array(WIDTH * HEIGHT * 4)
  const centerX = (WIDTH - 1) / 2
  const centerY = (HEIGHT - 1) / 2
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const offset = (y * WIDTH + x) * 4
      const distance = Math.hypot(
        x - centerX,
        y - centerY,
      )
      const alpha = distance <= 18
        ? 255
        : distance >= 24
        ? 0
        : Math.round((24 - distance) / 6 * 255)
      output[offset] = rgb[0]
      output[offset + 1] = rgb[1]
      output[offset + 2] = rgb[2]
      output[offset + 3] = alpha
    }
  }
  return output
}

function destinationRaster(
  rgb: readonly [number, number, number],
): Uint8Array {
  const output = new Uint8Array(WIDTH * HEIGHT * 3)
  for (let index = 0; index < WIDTH * HEIGHT; index += 1) {
    output[index * 3] = rgb[0]
    output[index * 3 + 1] = rgb[1]
    output[index * 3 + 2] = rgb[2]
  }
  return output
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

type Mutable<T> = {
  -readonly [K in keyof T]:
    T[K] extends readonly (infer U)[]
      ? Mutable<U>[]
      : T[K] extends object
      ? Mutable<T[K]>
      : T[K]
}
