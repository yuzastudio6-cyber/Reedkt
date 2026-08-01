import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlRembgAlphaBridgeReceipt,
} from '../../src/types/living-frame-controlled-sdxl-rembg-alpha-bridge'
import {
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_OPEN_GATES,
} from '../../src/types/living-frame-controlled-sdxl-rembg-alpha-bridge'
import type {
  LivingFrameControlledSdxlRembgGpuRuntimeReceipt,
} from '../../src/types/living-frame-controlled-sdxl-rembg-gpu-runtime'
import {
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_OPEN_GATES,
} from '../../src/types/living-frame-controlled-sdxl-rembg-gpu-runtime'
import type {
  LivingFrameGeneratedStillArtifactQaProjection,
} from '../../src/types/living-frame-generated-still-artifact-qa-projection'
import {
  measureLivingFrameAlphaArtifact,
} from '../living-frame/living-frame-alpha-measurement'
import {
  projectLivingFrameGeneratedStillArtifactQa,
  verifyLivingFrameGeneratedStillArtifactQaProjection,
} from '../living-frame/living-frame-generated-still-artifact-qa-projection'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const WIDTH = 1024
const HEIGHT = 1024
const PIXELS = WIDTH * HEIGHT
const SOURCE_ARTIFACT_ID = 'lf-generated-source-001'
const MASK_ASSET_ID = 'lf.generated.mask.001'
const OUTPUT_ASSET_ID = 'lf-generated-alpha-001'
const SNAPSHOT_ID = 'approved-snapshot-lf-001'
const SOURCE_CONTENT = digest('opaque-source')
const SOURCE_RGBA = digest('opaque-source-rgba')
const MASK_CONTENT = digest('verified-mask')
const MASK_DECODED = digest('verified-mask-decoded')
const ALPHA_CONTENT = digest('alpha-png')

const rgba = createMeasuredAlphaRgba()
const alphaReport = measureLivingFrameAlphaArtifact({
  artifactId: OUTPUT_ASSET_ID,
  artifactDigestSha256: ALPHA_CONTENT,
  width: WIDTH,
  height: HEIGHT,
  rgbaBytes: rgba,
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
})
assert.deepEqual(alphaReport.findingCodes, [
  'alpha_channel_variation_present',
])
assert.equal(alphaReport.composites.length, 4)
assert.equal(
  alphaReport.compositeContext.destinationRasterProvided,
  false,
)

const rembgReceipt = createRembgReceipt(alphaReport)
const bridgeReceipt = createBridgeReceipt(
  rembgReceipt,
  alphaReport,
)
const projection =
  projectLivingFrameGeneratedStillArtifactQa({
    projectionId: 'lf-generated-artifact-qa-projection-001',
    rembgRuntimeReceipt: rembgReceipt,
    bridgeReceipt,
    alphaMeasurementReport: alphaReport,
  })

assert.equal(
  verifyLivingFrameGeneratedStillArtifactQaProjection(projection),
  true,
)
assert.equal(
  projection.dependencyProjection[0].expectedArtifactType,
  'living_frame_generated_opaque_still_png',
)
assert.equal(
  projection.dependencyProjection[1].expectedArtifactType,
  'living_frame_alpha_mask_png',
)
assert.equal(
  projection.canonicalSharpExpectation.outputArtifactType,
  'living_frame_component_rgba_png',
)
assert.equal(
  projection.canonicalSharpExpectation.runnerClass,
  'offline_sharp_structured_execution_v1',
)
assert.deepEqual(
  projection.canonicalQaExpectation.requiredGateIds,
  ['asset_received_gate', 'asset_quality_gate'],
)
assert.equal(
  projection.existingAuthorityReuse
    .canonicalPrivateArtifactQaAuthorityReused,
  true,
)
assert.equal(
  projection.existingAuthorityReuse.duplicateCreditSystemCreated,
  false,
)
assert.equal(projection.artifactPersisted, false)
assert.equal(projection.artifactQaPassed, false)
assert.equal(projection.assetManifestUpdated, false)
assert.equal(projection.renderAuthorized, false)
assert.equal(projection.productionReady, false)

const tamperedSource = mutable(projection)
tamperedSource.dependencyProjection[0]!.contentSha256 =
  digest('tampered-source')
assert.equal(
  verifyLivingFrameGeneratedStillArtifactQaProjection(tamperedSource),
  false,
)

const reversedDependencies = mutable(projection)
reversedDependencies.dependencyProjection.reverse()
resign(reversedDependencies)
assert.equal(
  verifyLivingFrameGeneratedStillArtifactQaProjection(
    reversedDependencies,
  ),
  false,
)

const promotedQa = mutable(projection)
promotedQa.artifactQaPassed = true
promotedQa.authorityBoundary.artifactQaAuthority = true
resign(promotedQa)
assert.equal(
  verifyLivingFrameGeneratedStillArtifactQaProjection(promotedQa),
  false,
)

const persisted = mutable(projection)
persisted.artifactPersisted = true
persisted.assetManifestUpdated = true
resign(persisted)
assert.equal(
  verifyLivingFrameGeneratedStillArtifactQaProjection(persisted),
  false,
)

const duplicateSystem = mutable(projection)
duplicateSystem.existingAuthorityReuse.duplicateWorkerSystemCreated =
  true
resign(duplicateSystem)
assert.equal(
  verifyLivingFrameGeneratedStillArtifactQaProjection(
    duplicateSystem,
  ),
  false,
)

const destinationForged = mutable(projection)
destinationForged.canonicalQaExpectation
  .destinationCompositeMeasurementPresent = true
destinationForged.canonicalQaExpectation
  .destinationCompositeQaStillRequired = false
resign(destinationForged)
assert.equal(
  verifyLivingFrameGeneratedStillArtifactQaProjection(
    destinationForged,
  ),
  false,
)

const wrongRuntime =
  structuredClone(rembgReceipt) as unknown as
    Mutable<LivingFrameControlledSdxlRembgGpuRuntimeReceipt>
wrongRuntime.sourceBindings.expectedMaskAssetId =
  'different-mask-asset'
wrongRuntime.runtimeObservationDigestSha256 =
  signWithoutDigest(
    wrongRuntime as unknown as Record<string, unknown>,
    'runtimeObservationDigestSha256',
  )
assert.throws(() =>
  projectLivingFrameGeneratedStillArtifactQa({
    projectionId: 'lf-generated-artifact-qa-wrong-runtime',
    rembgRuntimeReceipt:
      wrongRuntime as unknown as
        LivingFrameControlledSdxlRembgGpuRuntimeReceipt,
    bridgeReceipt,
    alphaMeasurementReport: alphaReport,
  }))

const blockingRgba = new Uint8Array(PIXELS * 4)
for (let index = 0; index < PIXELS; index += 1) {
  blockingRgba[index * 4] = 120
  blockingRgba[index * 4 + 1] = 80
  blockingRgba[index * 4 + 2] = 40
  blockingRgba[index * 4 + 3] = 255
}
const blockingReport = measureLivingFrameAlphaArtifact({
  artifactId: OUTPUT_ASSET_ID,
  artifactDigestSha256: ALPHA_CONTENT,
  width: WIDTH,
  height: HEIGHT,
  rgbaBytes: blockingRgba,
  alphaMode: 'straight_alpha',
  alphaExpectation: 'alpha_required',
})
assert.throws(() =>
  projectLivingFrameGeneratedStillArtifactQa({
    projectionId: 'lf-generated-artifact-qa-blocking-alpha',
    rembgRuntimeReceipt: rembgReceipt,
    bridgeReceipt: {
      ...bridgeReceipt,
      alphaMeasurement: {
        ...bridgeReceipt.alphaMeasurement,
        reportDigestSha256: blockingReport.reportDigestSha256,
        measuredRgbaDigestSha256:
          blockingReport.artifactIdentity.measuredRgbaDigestSha256,
        findingCodes: [...blockingReport.findingCodes],
      },
      bridgeObservationDigestSha256: signWithoutDigest({
        ...bridgeReceipt,
        alphaMeasurement: {
          ...bridgeReceipt.alphaMeasurement,
          reportDigestSha256: blockingReport.reportDigestSha256,
          measuredRgbaDigestSha256:
            blockingReport.artifactIdentity.measuredRgbaDigestSha256,
          findingCodes: [...blockingReport.findingCodes],
        },
      }, 'bridgeObservationDigestSha256'),
    },
    alphaMeasurementReport: blockingReport,
  }))

console.log(
  'Living Frame generated-still artifact/QA projection passed exact generated-source, rembg-mask, Sharp-output, canonical-authority reuse, alpha, destination-QA, tamper, and forged-promotion checks.',
)

function createRembgReceipt(
  report: typeof alphaReport,
): LivingFrameControlledSdxlRembgGpuRuntimeReceipt {
  const transparent =
    report.distribution.transparentPixelCount
  const partial =
    report.distribution.semiTransparentPixelCount
  const opaque = report.distribution.opaquePixelCount
  const draft = {
    contractVersion:
      'living-frame-controlled-sdxl-rembg-gpu-runtime-v1' as const,
    resultClass:
      'private_internal_generated_still_rembg_gpu_runtime_observation' as const,
    runtimeObservationId: 'lf-rembg-runtime-001',
    evidenceClass:
      'controlled_non_promotable_generated_still_rembg_gpu_fixture' as const,
    sourceBindings: {
      rembgInputBindingId: 'lf-rembg-input-001',
      rembgInputBindingDigestSha256: digest('rembg-input'),
      gpuOutputObservationId: 'lf-gpu-output-001',
      gpuOutputObservationDigestSha256: digest('gpu-output'),
      generatedOpaqueSourceArtifactId: SOURCE_ARTIFACT_ID,
      generatedOpaqueSourceContentSha256: SOURCE_CONTENT,
      generatedOpaqueDecodedRgbaSha256: SOURCE_RGBA,
      outputFrameExpectationDigestSha256: digest('output-frame'),
      sourceReaderBindingDigestSha256: digest('source-reader'),
      canonicalDispatchConsumptionResponseHash: digest('rembg-dispatch'),
      executionAttemptId: 'rembg-attempt-001',
      approvedPlanSnapshotId: SNAPSHOT_ID,
      expectedMaskAssetId: MASK_ASSET_ID,
    },
    operation: {
      canonicalToolId: 'rembg' as const,
      operationId:
        'tool.rembg.remove_image_background.v1' as const,
      sourceVariant:
        'living_frame_generated_opaque_still_png' as const,
      sourceIsFfmpegExtractedFrame: false as const,
      executionTarget: 'google_cloud_run_gpu' as const,
      runtimeRegion: 'europe-west1' as const,
      accelerator: 'nvidia_l4' as const,
      gpuCount: 1 as const,
      device: 'cuda' as const,
      modelId: 'u2netp' as const,
      outputMode: 'mask_only_png' as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
    },
    runtimeContract: {
      contractDigestSha256: digest('rembg-contract'),
      sourceDigestSha256: digest('rembg-source'),
      rembgVersion: '2.0.76' as const,
      onnxRuntimeGpuVersion: '1.27.0' as const,
      exactFixedRunnerContractReused: true as const,
    },
    modelMountObservation: {
      evidenceClass:
        'controlled_non_promotable_u2netp_mount_fixture' as const,
      slotId: 'rembg_u2netp_onnx' as const,
      artifactId: 'rembg-u2netp-onnx' as const,
      revision:
        'rembg-v0.0.0-u2netp-309c8469258d' as const,
      byteLength: 4_574_861 as const,
      contentSha256:
        '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8' as const,
      consumerScope: 'rembg.private-inference' as const,
      readOnlyMountRequired: true as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
      cpuFallbackAllowed: false as const,
      modelBytesIncluded: false as const,
      mountPathIncluded: false as const,
      bindingDigestSha256: digest('rembg-mount'),
    },
    hostObservation: {
      terminalState: 'completed' as const,
      failureCode: 'none' as const,
      requestAccepted: true,
      modelInferenceExecuted: false,
      startedAt: '2026-07-29T12:00:00.000Z',
      finishedAt: '2026-07-29T12:00:01.000Z',
      elapsedMilliseconds: 1000,
    },
    maskOutput: {
      contentType: 'image/png' as const,
      encodingProfile: 'gray8_mask_png_v1' as const,
      widthPixels: WIDTH as 1024,
      heightPixels: HEIGHT as 1024,
      outputCount: 1 as const,
      byteLength: 2048,
      contentSha256: MASK_CONTENT,
      decodedMaskSha256: MASK_DECODED,
      minimumMaskValue: 0,
      maximumMaskValue: 255,
      uniqueMaskValueCount: 256,
      transparentPixelCount: transparent,
      partialPixelCount: partial,
      opaquePixelCount: opaque,
      thresholdMaskValue: 128 as const,
      foregroundPixelCountAtThreshold: opaque,
      sourceDimensionsPreserved: true as const,
      maskVariationObserved: true as const,
      outputBytesIncluded: false as const,
    },
    maskOutputLeaseIssued: true,
    alphaSourceLeaseIssued: true,
    costLineage: {
      comfyuiGpuAttemptChargedAgain: false as const,
      rembgIsSeparateCanonicalToolAttempt: true as const,
      oneRuntimeInvocationRepresentsOneRembgAttempt: true as const,
      failedOrUnknownAttemptCostMustBeRetained: true as const,
      canonicalWorkerResourceCostEvidenceRequired: true as const,
      actualCostAmountIncluded: false as const,
      customerPriceOrCreditIncluded: false as const,
      serviceFeeIncluded: false as const,
    },
    generatedStillSourceVariantAdmittedInCanonicalSharedAuthority:
      false as const,
    outputArtifactPersisted: false as const,
    assetManifestUpdated: false as const,
    actualCostEvidenceCreated: false as const,
    customerChargeCreated: false as const,
    providerCallPerformed: false as const,
    externalNetworkPerformed: false as const,
    runtimeDownloadPerformed: false as const,
    callerPathUrlCredentialCommandOrBytesAccepted: false as const,
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_OPEN_GATES,
    authorityBoundary: {
      privateGeneratedStillRereadAuthority: true as const,
      namespacedRuntimeObservationAuthority: true as const,
      canonicalSourceVariantAuthority: false as const,
      canonicalDispatchAuthority: false as const,
      modelArtifactRepositoryAuthority: false as const,
      modelArtifactMountAuthority: false as const,
      providerAuthority: false as const,
      toolRegistryAuthority: false as const,
      operationRegistryAuthority: false as const,
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
      queueAuthority: false as const,
      artifactPersistenceAuthority: false as const,
      assetManifestAuthority: false as const,
      maskArtifactCommitAuthority: false as const,
      maskQaAuthority: false as const,
      alphaComponentAuthority: false as const,
      alphaQaAuthority: false as const,
      renderAuthority: false as const,
      runtimeAuthority: false as const,
      productionAuthority: false as const,
    },
    productionReady: false as const,
  }
  return {
    ...draft,
    runtimeObservationDigestSha256:
      sha256AuthorityValue(draft),
  }
}

function createBridgeReceipt(
  runtime: LivingFrameControlledSdxlRembgGpuRuntimeReceipt,
  report: typeof alphaReport,
): LivingFrameControlledSdxlRembgAlphaBridgeReceipt {
  const draft = {
    contractVersion:
      'living-frame-controlled-sdxl-rembg-alpha-bridge-v1' as const,
    resultClass:
      'private_internal_generated_still_sharp_alpha_observation' as const,
    bridgeObservationId: 'lf-alpha-bridge-001',
    evidenceClass:
      'controlled_non_promotable_generated_still_sharp_alpha_fixture' as const,
    sourceBindings: {
      rembgRuntimeObservationDigestSha256:
        runtime.runtimeObservationDigestSha256,
      rembgInputBindingDigestSha256:
        runtime.sourceBindings.rembgInputBindingDigestSha256,
      generatedOpaqueSourceArtifactId: SOURCE_ARTIFACT_ID,
      generatedOpaqueSourceContentSha256: SOURCE_CONTENT,
      generatedOpaqueDecodedRgbaSha256: SOURCE_RGBA,
      rembgMaskContentSha256: MASK_CONTENT,
      rembgMaskDecodedSha256: MASK_DECODED,
      sharpDispatchConsumptionResponseHash: digest('sharp-dispatch'),
      sharpExecutionAttemptId: 'sharp-attempt-001',
      approvedPlanSnapshotId: SNAPSHOT_ID,
      expectedAlphaComponentAssetId: OUTPUT_ASSET_ID,
    },
    operation: {
      canonicalToolId: 'sharp' as const,
      operationId:
        'tool.sharp.prepare_approved_image_asset.v1' as const,
      imageRecipeId:
        'approved_living_frame_alpha_component_v1' as const,
      sourceVariant:
        'living_frame_generated_opaque_still_png' as const,
      maskVariant:
        'verified_rembg_gray8_mask_png' as const,
      outputVariant:
        'living_frame_component_rgba_png' as const,
      outputFormat: 'png' as const,
      widthPixels: WIDTH as 1024,
      heightPixels: HEIGHT as 1024,
      alphaMode: 'straight_alpha' as const,
      transparentRgbCleared: true as const,
      metadataStripped: true as const,
      networkAllowed: false as const,
    },
    packageObservation: {
      packageName: 'sharp' as const,
      packageVersion: '0.35.3' as const,
      actualSharpPackageExecuted: true as const,
      sourceBytesVerified: true as const,
      maskBytesVerified: true as const,
      sourceOpaque: true as const,
      maskGrayscale: true as const,
      alphaDerivedFromMask: true as const,
      sourcePixelsUnmodified: true as const,
    },
    alphaOutput: {
      contentType: 'image/png' as const,
      byteLength: 4096,
      contentSha256: ALPHA_CONTENT,
      decodedRgbaSha256:
        report.artifactIdentity.measuredRgbaDigestSha256,
      transparentPixelCount:
        report.distribution.transparentPixelCount,
      partialAlphaPixelCount:
        report.distribution.semiTransparentPixelCount,
      opaquePixelCount:
        report.distribution.opaquePixelCount,
      outputBytesIncluded: false as const,
    },
    alphaMeasurement: {
      reportDigestSha256: report.reportDigestSha256,
      measuredRgbaDigestSha256:
        report.artifactIdentity.measuredRgbaDigestSha256,
      findingCodes: [...report.findingCodes],
      alphaQaApproved: false as const,
    },
    costLineage: {
      comfyuiGpuAttemptChargedAgain: false as const,
      rembgGpuAttemptChargedAgain: false as const,
      sharpUsesExistingDeterministicToolCostOwner: true as const,
      actualCostAmountIncluded: false as const,
      customerPriceOrCreditIncluded: false as const,
      serviceFeeIncluded: false as const,
    },
    outputLeaseIssued: true as const,
    outputArtifactPersisted: false as const,
    assetManifestUpdated: false as const,
    actualCostEvidenceCreated: false as const,
    customerChargeCreated: false as const,
    alphaQaPassed: false as const,
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_OPEN_GATES,
    authorityBoundary: {
      processBoundSourceMaskConsumptionAuthority: true as const,
      namespacedSharpObservationAuthority: true as const,
      alphaMeasurementAuthority: true as const,
      canonicalSourceVariantAuthority: false as const,
      canonicalDispatchAuthority: false as const,
      toolRegistryAuthority: false as const,
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
      queueAuthority: false as const,
      artifactPersistenceAuthority: false as const,
      assetManifestAuthority: false as const,
      alphaQaAuthority: false as const,
      renderAuthority: false as const,
      runtimeAuthority: false as const,
      productionAuthority: false as const,
    },
    productionReady: false as const,
  }
  return {
    ...draft,
    bridgeObservationDigestSha256:
      sha256AuthorityValue(draft),
  }
}

function createMeasuredAlphaRgba(): Uint8Array {
  const output = new Uint8Array(PIXELS * 4)
  const centerX = WIDTH / 2
  const centerY = HEIGHT / 2
  const innerRadius = 300
  const outerRadius = 360
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const distance = Math.hypot(x - centerX, y - centerY)
      const alpha = distance <= innerRadius
        ? 255
        : distance >= outerRadius
          ? 0
          : Math.round(
              255
              * (1 - (distance - innerRadius)
                / (outerRadius - innerRadius)),
            )
      const offset = (y * WIDTH + x) * 4
      output[offset] = alpha === 0 ? 0 : 150
      output[offset + 1] = alpha === 0 ? 0 : 100
      output[offset + 2] = alpha === 0 ? 0 : 60
      output[offset + 3] = alpha
    }
  }
  return output
}

type Mutable<T> =
  T extends boolean
    ? boolean
    : T extends string
      ? string
      : T extends number
        ? number
        : T extends readonly (infer Item)[]
          ? Mutable<Item>[]
          : T extends object
            ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
            : T

function mutable(
  value: LivingFrameGeneratedStillArtifactQaProjection,
): Mutable<LivingFrameGeneratedStillArtifactQaProjection> {
  return structuredClone(value) as
    unknown as
      Mutable<LivingFrameGeneratedStillArtifactQaProjection>
}

function resign(
  value: Mutable<LivingFrameGeneratedStillArtifactQaProjection>,
): void {
  value.projectionDigestSha256 = signWithoutDigest(
    value,
    'projectionDigestSha256',
  )
}

function signWithoutDigest(
  value: Record<string, unknown>,
  digestKey: string,
): string {
  const clone = structuredClone(value)
  delete clone[digestKey]
  return sha256AuthorityValue(clone)
}

function digest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
