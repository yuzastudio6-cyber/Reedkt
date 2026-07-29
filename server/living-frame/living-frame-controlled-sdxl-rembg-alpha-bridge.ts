import { createHash } from 'node:crypto'
import { inflateSync } from 'node:zlib'

import { z } from 'zod'

import {
  LIVING_FRAME_ALPHA_FINDING_CODES,
  type LivingFrameAlphaMeasurementReport,
} from '../../src/types/living-frame-alpha-measurement'
import {
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_EVIDENCE_CLASSES,
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_RESULT_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_VERSION,
  type LivingFrameControlledSdxlRembgAlphaBridgeAuthority,
  type LivingFrameControlledSdxlRembgAlphaBridgeEvidenceClass,
  type LivingFrameControlledSdxlRembgAlphaBridgeIssueCode,
  type LivingFrameControlledSdxlRembgAlphaBridgeReceipt,
  type LivingFrameControlledSdxlRembgAlphaOutputLease,
  type LivingFrameControlledSdxlRembgAlphaOutputLeasePayload,
} from '../../src/types/living-frame-controlled-sdxl-rembg-alpha-bridge'
import type {
  LivingFrameControlledSdxlRembgAlphaSourceLease,
  LivingFrameControlledSdxlRembgGpuMaskLease,
  LivingFrameControlledSdxlRembgGpuRuntimeReceipt,
} from '../../src/types/living-frame-controlled-sdxl-rembg-gpu-runtime'
import type {
  OfflineNodeRunnerAlphaComponentSemanticEvidence,
} from '../tool-execution/node-runners/offline-node-runner-types'
import {
  openPrivateOfflineSharpStructuredExecutionRuntime,
  type OfflineSharpStructuredExecutionResult,
} from '../tool-execution/node-runner-execution'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  canonicalPrivateToolDispatchConsumptionResponseSchema,
  type CanonicalPrivateToolDispatchConsumptionResponse,
} from '../validation/canonical-private-tool-dispatch-schemas'
import {
  measureLivingFrameAlphaArtifact,
  verifyLivingFrameAlphaMeasurementReportDigest,
} from './living-frame-alpha-measurement'
import {
  consumeLivingFrameControlledSdxlRembgAlphaSourceLease,
  consumeLivingFrameControlledSdxlRembgGpuMaskLease,
  verifyLivingFrameControlledSdxlRembgGpuRuntimeReceipt,
} from './living-frame-controlled-sdxl-rembg-gpu-runtime'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,191}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const WIDTH = 1024 as const
const HEIGHT = 1024 as const
const PIXEL_COUNT = WIDTH * HEIGHT
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlRembgAlphaBridgeAuthority =
  deepFreeze({
    processBoundSourceMaskConsumptionAuthority: true,
    namespacedSharpObservationAuthority: true,
    alphaMeasurementAuthority: true,
    canonicalSourceVariantAuthority: false,
    canonicalDispatchAuthority: false,
    toolRegistryAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    serviceFeeAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    alphaQaAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const authoritySchema = z.object({
  processBoundSourceMaskConsumptionAuthority: z.literal(true),
  namespacedSharpObservationAuthority: z.literal(true),
  alphaMeasurementAuthority: z.literal(true),
  canonicalSourceVariantAuthority: z.literal(false),
  canonicalDispatchAuthority: z.literal(false),
  toolRegistryAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  actualCostAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  serviceFeeAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workItemAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  artifactPersistenceAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  alphaQaAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const receiptDraftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_RESULT_CLASS,
  ),
  bridgeObservationId: z.string().regex(SAFE_ID),
  evidenceClass: z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_EVIDENCE_CLASSES,
  ),
  sourceBindings: z.object({
    rembgRuntimeObservationDigestSha256: z.string().regex(SHA256),
    rembgInputBindingDigestSha256: z.string().regex(SHA256),
    generatedOpaqueSourceArtifactId: z.string().regex(SAFE_ID),
    generatedOpaqueSourceContentSha256: z.string().regex(SHA256),
    generatedOpaqueDecodedRgbaSha256: z.string().regex(SHA256),
    rembgMaskContentSha256: z.string().regex(SHA256),
    rembgMaskDecodedSha256: z.string().regex(SHA256),
    sharpDispatchConsumptionResponseHash: z.string().regex(SHA256),
    sharpExecutionAttemptId: z.string().regex(SAFE_ID),
    approvedPlanSnapshotId: z.string().regex(SAFE_ID),
    expectedAlphaComponentAssetId: z.string().regex(SAFE_ID),
  }).strict(),
  operation: z.object({
    canonicalToolId: z.literal('sharp'),
    operationId: z.literal(
      'tool.sharp.prepare_approved_image_asset.v1',
    ),
    imageRecipeId: z.literal(
      'approved_living_frame_alpha_component_v1',
    ),
    sourceVariant: z.literal(
      'living_frame_generated_opaque_still_png',
    ),
    maskVariant: z.literal(
      'verified_rembg_gray8_mask_png',
    ),
    outputVariant: z.literal(
      'living_frame_component_rgba_png',
    ),
    outputFormat: z.literal('png'),
    widthPixels: z.literal(WIDTH),
    heightPixels: z.literal(HEIGHT),
    alphaMode: z.literal('straight_alpha'),
    transparentRgbCleared: z.literal(true),
    metadataStripped: z.literal(true),
    networkAllowed: z.literal(false),
  }).strict(),
  packageObservation: z.object({
    packageName: z.literal('sharp'),
    packageVersion: z.literal('0.35.3'),
    actualSharpPackageExecuted: z.literal(true),
    sourceBytesVerified: z.literal(true),
    maskBytesVerified: z.literal(true),
    sourceOpaque: z.literal(true),
    maskGrayscale: z.literal(true),
    alphaDerivedFromMask: z.literal(true),
    sourcePixelsUnmodified: z.literal(true),
  }).strict(),
  alphaOutput: z.object({
    contentType: z.literal('image/png'),
    byteLength: z.number().int().min(64).max(MAX_OUTPUT_BYTES),
    contentSha256: z.string().regex(SHA256),
    decodedRgbaSha256: z.string().regex(SHA256),
    transparentPixelCount: z.number().int().positive()
      .max(PIXEL_COUNT),
    partialAlphaPixelCount: z.number().int().nonnegative()
      .max(PIXEL_COUNT),
    opaquePixelCount: z.number().int().positive()
      .max(PIXEL_COUNT),
    outputBytesIncluded: z.literal(false),
  }).strict(),
  alphaMeasurement: z.object({
    reportDigestSha256: z.string().regex(SHA256),
    measuredRgbaDigestSha256: z.string().regex(SHA256),
    findingCodes: z.array(z.enum(
      LIVING_FRAME_ALPHA_FINDING_CODES,
    )).max(LIVING_FRAME_ALPHA_FINDING_CODES.length),
    alphaQaApproved: z.literal(false),
  }).strict(),
  costLineage: z.object({
    comfyuiGpuAttemptChargedAgain: z.literal(false),
    rembgGpuAttemptChargedAgain: z.literal(false),
    sharpUsesExistingDeterministicToolCostOwner: z.literal(true),
    actualCostAmountIncluded: z.literal(false),
    customerPriceOrCreditIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  outputLeaseIssued: z.literal(true),
  outputArtifactPersisted: z.literal(false),
  assetManifestUpdated: z.literal(false),
  actualCostEvidenceCreated: z.literal(false),
  customerChargeCreated: z.literal(false),
  alphaQaPassed: z.literal(false),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_OPEN_GATES,
  )).length(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_OPEN_GATES.length,
  ),
  authorityBoundary: authoritySchema,
  productionReady: z.literal(false),
}).strict()

export interface LivingFrameControlledSdxlRembgAlphaBridgeInput {
  readonly rembgRuntimeReceipt:
    LivingFrameControlledSdxlRembgGpuRuntimeReceipt
  readonly sourceLease:
    LivingFrameControlledSdxlRembgAlphaSourceLease
  readonly maskLease:
    LivingFrameControlledSdxlRembgGpuMaskLease
  readonly sharpDispatchConsumption:
    CanonicalPrivateToolDispatchConsumptionResponse
}

export interface LivingFrameControlledSdxlRembgAlphaBridgeResult {
  readonly receipt:
    LivingFrameControlledSdxlRembgAlphaBridgeReceipt
  readonly alphaMeasurementReport:
    LivingFrameAlphaMeasurementReport
  readonly outputLease:
    LivingFrameControlledSdxlRembgAlphaOutputLease
}

const outputLeases = new WeakSet<object>()
const consumedOutputLeases = new WeakSet<object>()
const outputPayloads = new WeakMap<
  object,
  LivingFrameControlledSdxlRembgAlphaOutputLeasePayload
>()

export class LivingFrameControlledSdxlRembgAlphaBridgeError
  extends Error {
  readonly code:
    LivingFrameControlledSdxlRembgAlphaBridgeIssueCode
  readonly path: string

  constructor(
    code: LivingFrameControlledSdxlRembgAlphaBridgeIssueCode,
    path: string,
  ) {
    super(`${code} at ${path}`)
    this.name =
      'LivingFrameControlledSdxlRembgAlphaBridgeError'
    this.code = code
    this.path = path
  }
}

export async function executeLivingFrameControlledSdxlRembgAlphaBridge(
  input: LivingFrameControlledSdxlRembgAlphaBridgeInput,
): Promise<LivingFrameControlledSdxlRembgAlphaBridgeResult> {
  if (
    !input
    || typeof input !== 'object'
    || !verifyLivingFrameControlledSdxlRembgGpuRuntimeReceipt(
      input.rembgRuntimeReceipt,
    )
    || input.rembgRuntimeReceipt.hostObservation.terminalState
      !== 'completed'
    || !input.rembgRuntimeReceipt.maskOutput
    || !input.rembgRuntimeReceipt.maskOutputLeaseIssued
    || !input.rembgRuntimeReceipt.alphaSourceLeaseIssued
  ) throw invalid('runtime_receipt_invalid', '$.rembgRuntimeReceipt')
  const runtimeReceipt = input.rembgRuntimeReceipt
  const runtimeMaskOutput = runtimeReceipt.maskOutput
  if (!runtimeMaskOutput) {
    throw invalid('runtime_receipt_invalid', '$.rembgRuntimeReceipt')
  }
  const dispatch = assertSharpDispatch(
    input.sharpDispatchConsumption,
  )
  const source = consumeSourceLease(input.sourceLease)
  const mask = consumeMaskLease(input.maskLease)
  assertSourceMaskLineage(runtimeReceipt, source, mask)

  let sharpResult: OfflineSharpStructuredExecutionResult
  try {
    const runtime =
      await openPrivateOfflineSharpStructuredExecutionRuntime()
    sharpResult = await runtime.execute({
      toolId: 'sharp',
      operationId:
        'tool.sharp.prepare_approved_image_asset.v1',
      payload: {
        imageRecipeId:
          'approved_living_frame_alpha_component_v1',
        outputFormat: 'png',
        outputWidth: WIDTH,
        outputHeight: HEIGHT,
        preserveMetadata: false,
        allowUpscale: false,
        sourceMimeType: 'image/png',
        sourceByteLength: source.sourcePng.byteLength,
        sourceSha256: digestBytes(source.sourcePng),
        sourceBytesBase64:
          source.sourcePng.toString('base64'),
        maskMimeType: 'image/png',
        maskByteLength: mask.maskPng.byteLength,
        maskSha256: digestBytes(mask.maskPng),
        maskBytesBase64:
          mask.maskPng.toString('base64'),
      },
    })
  } catch {
    throw invalid('sharp_result_invalid', '$.sharp')
  }
  const sharpEvidence = assertSharpResult(
    sharpResult,
    source.sourcePng,
    mask.maskPng,
  )
  const imageArtifact = sharpResult.imageArtifact
  if (
    imageArtifact.mimeType !== 'image/png'
    || imageArtifact.byteLength !== imageArtifact.bytes.byteLength
    || imageArtifact.sha256 !== digestBytes(imageArtifact.bytes)
  ) {
    throw invalid('alpha_output_invalid', '$.sharp.artifacts')
  }
  const alphaPng = Buffer.from(imageArtifact.bytes)
  const decodedMask = decodeVerifiedGray8Mask(mask.maskPng)
  const decodedRgba = composeStraightAlpha(
    source.decodedRgba,
    decodedMask,
  )
  const alphaMeasurementReport = measureLivingFrameAlphaArtifact({
    artifactId: dispatch.grant.binding.expectedAssetId,
    artifactDigestSha256: imageArtifact.sha256,
    width: WIDTH,
    height: HEIGHT,
    rgbaBytes: decodedRgba,
    alphaMode: 'straight_alpha',
    alphaExpectation: 'alpha_required',
  })
  if (
    !verifyLivingFrameAlphaMeasurementReportDigest(
      alphaMeasurementReport,
    )
    || alphaMeasurementReport.artifactIdentity
      .artifactDigestSha256 !== imageArtifact.sha256
    || alphaMeasurementReport.artifactIdentity
      .measuredRgbaDigestSha256 !== digestBytes(decodedRgba)
    || alphaMeasurementReport.raster.width !== WIDTH
    || alphaMeasurementReport.raster.height !== HEIGHT
    || alphaMeasurementReport.raster.alphaMode
      !== 'straight_alpha'
  ) throw invalid(
    'alpha_measurement_invalid',
    '$.alphaMeasurement',
  )

  const draft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_RESULT_CLASS,
    bridgeObservationId:
      `lfalpha_${digest({
        runtime:
          runtimeReceipt.runtimeObservationDigestSha256,
        dispatch: dispatch.responseHash,
        output: imageArtifact.sha256,
      }).slice(0, 40)}`,
    evidenceClass:
      resolveEvidenceClass(runtimeReceipt.evidenceClass),
    sourceBindings: {
      rembgRuntimeObservationDigestSha256:
        runtimeReceipt.runtimeObservationDigestSha256,
      rembgInputBindingDigestSha256:
        runtimeReceipt.sourceBindings
          .rembgInputBindingDigestSha256,
      generatedOpaqueSourceArtifactId:
        runtimeReceipt.sourceBindings
          .generatedOpaqueSourceArtifactId,
      generatedOpaqueSourceContentSha256:
        runtimeReceipt.sourceBindings
          .generatedOpaqueSourceContentSha256,
      generatedOpaqueDecodedRgbaSha256:
        runtimeReceipt.sourceBindings
          .generatedOpaqueDecodedRgbaSha256,
      rembgMaskContentSha256:
        runtimeMaskOutput.contentSha256,
      rembgMaskDecodedSha256:
        runtimeMaskOutput.decodedMaskSha256,
      sharpDispatchConsumptionResponseHash:
        dispatch.responseHash,
      sharpExecutionAttemptId: dispatch.executionAttemptId,
      approvedPlanSnapshotId:
        dispatch.grant.binding.approvedPlanSnapshotId,
      expectedAlphaComponentAssetId:
        dispatch.grant.binding.expectedAssetId,
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
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      alphaMode: 'straight_alpha' as const,
      transparentRgbCleared: true as const,
      metadataStripped: true as const,
      networkAllowed: false as const,
    },
    packageObservation: {
      packageName: 'sharp' as const,
      packageVersion: '0.35.3' as const,
      actualSharpPackageExecuted: true as const,
      sourceBytesVerified: sharpEvidence.sourceBytesVerified,
      maskBytesVerified: sharpEvidence.maskBytesVerified,
      sourceOpaque: sharpEvidence.sourceOpaque,
      maskGrayscale: sharpEvidence.maskGrayscale,
      alphaDerivedFromMask: sharpEvidence.alphaDerivedFromMask,
      sourcePixelsUnmodified:
        sharpEvidence.sourcePixelsUnmodified,
    },
    alphaOutput: {
      contentType: 'image/png' as const,
      byteLength: imageArtifact.byteLength,
      contentSha256: imageArtifact.sha256,
      decodedRgbaSha256: digestBytes(decodedRgba),
      transparentPixelCount:
        sharpEvidence.transparentPixelCount,
      partialAlphaPixelCount:
        sharpEvidence.partialAlphaPixelCount,
      opaquePixelCount: sharpEvidence.opaquePixelCount,
      outputBytesIncluded: false as const,
    },
    alphaMeasurement: {
      reportDigestSha256:
        alphaMeasurementReport.reportDigestSha256,
      measuredRgbaDigestSha256:
        alphaMeasurementReport.artifactIdentity
          .measuredRgbaDigestSha256,
      findingCodes: [...alphaMeasurementReport.findingCodes],
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
    authorityBoundary: AUTHORITY_BOUNDARY,
    productionReady: false as const,
  }
  assertReceiptSafe(draft)
  const receipt:
    LivingFrameControlledSdxlRembgAlphaBridgeReceipt =
    deepFreeze({
      ...draft,
      bridgeObservationDigestSha256: digest(draft),
    })
  const outputLease:
    LivingFrameControlledSdxlRembgAlphaOutputLease =
    deepFreeze({
      leaseClass:
        'process_bound_single_use_unpersisted_generated_still_straight_alpha_png_v1',
      leaseId:
        `lfalphaout_${receipt.bridgeObservationDigestSha256.slice(0, 40)}`,
      bridgeObservationDigestSha256:
        receipt.bridgeObservationDigestSha256,
      contentSha256: imageArtifact.sha256,
      decodedRgbaSha256: digestBytes(decodedRgba),
      byteLength: alphaPng.byteLength,
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      alphaMode: 'straight_alpha',
      callerSerializable: false,
      artifactPersistenceAuthority: false,
      alphaQaAuthority: false,
      renderAuthority: false,
      productionReady: false,
    })
  outputLeases.add(outputLease)
  outputPayloads.set(outputLease, {
    alphaPng: Buffer.from(alphaPng),
    decodedRgba: Buffer.from(decodedRgba),
    alphaMeasurementReport,
    verification: {
      bridgeObservationDigestSha256:
        receipt.bridgeObservationDigestSha256,
      contentSha256: imageArtifact.sha256,
      decodedRgbaSha256: digestBytes(decodedRgba),
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      alphaMode: 'straight_alpha',
    },
  })
  return deepFreeze({
    receipt,
    alphaMeasurementReport,
    outputLease,
  })
}

export function consumeLivingFrameControlledSdxlRembgAlphaOutputLease(
  lease: LivingFrameControlledSdxlRembgAlphaOutputLease,
): LivingFrameControlledSdxlRembgAlphaOutputLeasePayload {
  if (
    !outputLeases.has(lease)
    || consumedOutputLeases.has(lease)
    || lease.leaseClass !==
      'process_bound_single_use_unpersisted_generated_still_straight_alpha_png_v1'
    || lease.callerSerializable !== false
    || lease.artifactPersistenceAuthority !== false
    || lease.alphaQaAuthority !== false
    || lease.renderAuthority !== false
    || lease.productionReady !== false
  ) throw invalid('output_lease_invalid', '$.outputLease')
  const payload = outputPayloads.get(lease)
  if (
    !payload
    || digestBytes(payload.alphaPng) !== lease.contentSha256
    || digestBytes(payload.decodedRgba)
      !== lease.decodedRgbaSha256
    || !verifyLivingFrameAlphaMeasurementReportDigest(
      payload.alphaMeasurementReport,
    )
  ) throw invalid('output_lease_invalid', '$.outputLease')
  consumedOutputLeases.add(lease)
  outputPayloads.delete(lease)
  return deepFreeze({
    alphaPng: Buffer.from(payload.alphaPng),
    decodedRgba: Buffer.from(payload.decodedRgba),
    alphaMeasurementReport: payload.alphaMeasurementReport,
    verification: { ...payload.verification },
  })
}

export function verifyLivingFrameControlledSdxlRembgAlphaBridgeReceipt(
  value: unknown,
): value is LivingFrameControlledSdxlRembgAlphaBridgeReceipt {
  if (!isRecord(value)) return false
  const receiptDigest = value.bridgeObservationDigestSha256
  if (
    typeof receiptDigest !== 'string'
    || !SHA256.test(receiptDigest)
  ) return false
  const {
    bridgeObservationDigestSha256: _digest,
    ...draft
  } = value
  void _digest
  try {
    assertReceiptSafe(
      draft as unknown as Omit<
        LivingFrameControlledSdxlRembgAlphaBridgeReceipt,
        'bridgeObservationDigestSha256'
      >,
    )
    return digest(draft) === receiptDigest
  } catch {
    return false
  }
}

function assertSharpDispatch(
  value: unknown,
): CanonicalPrivateToolDispatchConsumptionResponse {
  const parsed =
    canonicalPrivateToolDispatchConsumptionResponseSchema
      .safeParse(value)
  if (!parsed.success) {
    throw invalid(
      'sharp_dispatch_invalid',
      '$.sharpDispatchConsumption',
    )
  }
  const { responseHash, ...withoutHash } = parsed.data
  if (sha256AuthorityValue(withoutHash) !== responseHash) {
    throw invalid(
      'sharp_dispatch_invalid',
      '$.sharpDispatchConsumption.responseHash',
    )
  }
  if (
    parsed.data.consumptionReplayed
    || !parsed.data.executionAuthority
      .newExecutionStartAuthorized
    || parsed.data.executionAuthority
      .resumeSameIdempotentAttemptOnly
    || !parsed.data.executionAuthority.toolExecutionAuthorized
  ) throw invalid(
    'sharp_dispatch_replay_forbidden',
    '$.sharpDispatchConsumption.executionAuthority',
  )
  const binding = parsed.data.grant.binding
  if (
    binding.canonicalToolId !== 'sharp'
    || binding.operationId !==
      'tool.sharp.prepare_approved_image_asset.v1'
    || binding.expectedOutput.artifactType !==
      'living_frame_component_rgba_png'
    || binding.expectedOutput.contentType !== 'image/png'
    || !binding.expectedOutput.required
    || binding.expectedOutput.previewPlaceholderAllowed
  ) throw invalid(
    'sharp_operation_mismatch',
    '$.sharpDispatchConsumption.grant.binding',
  )
  return parsed.data
}

function consumeSourceLease(
  lease: LivingFrameControlledSdxlRembgAlphaSourceLease,
) {
  try {
    return consumeLivingFrameControlledSdxlRembgAlphaSourceLease(
      lease,
    )
  } catch {
    throw invalid('source_lease_invalid', '$.sourceLease')
  }
}

function consumeMaskLease(
  lease: LivingFrameControlledSdxlRembgGpuMaskLease,
) {
  try {
    return consumeLivingFrameControlledSdxlRembgGpuMaskLease(lease)
  } catch {
    throw invalid('mask_lease_invalid', '$.maskLease')
  }
}

function assertSourceMaskLineage(
  receipt: LivingFrameControlledSdxlRembgGpuRuntimeReceipt,
  source: ReturnType<typeof consumeSourceLease>,
  mask: ReturnType<typeof consumeMaskLease>,
): void {
  if (
    source.verification.runtimeObservationDigestSha256
      !== receipt.runtimeObservationDigestSha256
    || mask.verification.runtimeObservationDigestSha256
      !== receipt.runtimeObservationDigestSha256
    || source.verification.sourceContentSha256
      !== receipt.sourceBindings
        .generatedOpaqueSourceContentSha256
    || source.verification.decodedRgbaSha256
      !== receipt.sourceBindings
        .generatedOpaqueDecodedRgbaSha256
    || mask.verification.contentSha256
      !== receipt.maskOutput?.contentSha256
    || mask.verification.decodedMaskSha256
      !== receipt.maskOutput?.decodedMaskSha256
  ) throw invalid(
    'source_mask_lineage_mismatch',
    '$.sourceMaskLineage',
  )
}

function assertSharpResult(
  result: OfflineSharpStructuredExecutionResult,
  sourcePng: Buffer,
  maskPng: Buffer,
): OfflineNodeRunnerAlphaComponentSemanticEvidence {
  const evidence = result.evidence.semanticEvidence
  if (
    result.evidence.toolId !== 'sharp'
    || result.evidence.operationId !==
      'tool.sharp.prepare_approved_image_asset.v1'
    || result.evidence.packageName !== 'sharp'
    || result.evidence.packageVersion !== '0.35.3'
    || result.evidence.imageMimeType !== 'image/png'
    || result.evidence.imageSha256
      !== result.imageArtifact.sha256
    || result.evidence.containerExitCode !== 0
    || result.evidence.oomKilled !== false
    || result.readiness.privateInternalOnly !== true
    || result.readiness.productReady !== false
    || result.readiness.externalBetaReady !== false
    || result.readiness.productionReady !== false
    || !isAlphaEvidence(evidence)
    || !evidence.sourceBytesVerified
    || !evidence.maskBytesVerified
    || evidence.outputWidth !== WIDTH
    || evidence.outputHeight !== HEIGHT
    || evidence.outputChannels !== 4
    || !evidence.alphaPreserved
    || !evidence.sourceOpaque
    || !evidence.maskGrayscale
    || !evidence.maskOpaqueContainer
    || !evidence.alphaDerivedFromMask
    || !evidence.straightAlpha
    || !evidence.transparentRgbCleared
    || !evidence.sourcePixelsUnmodified
    || !evidence.actualSharpOperationCompleted
    || evidence.transparentPixelCount < 1
    || evidence.opaquePixelCount < 1
    || evidence.transparentPixelCount
      + evidence.partialAlphaPixelCount
      + evidence.opaquePixelCount !== PIXEL_COUNT
    || digestBytes(sourcePng) === digestBytes(maskPng)
  ) throw invalid('sharp_result_invalid', '$.sharp')
  return evidence
}

function isAlphaEvidence(
  value:
    OfflineSharpStructuredExecutionResult[
      'evidence'
    ]['semanticEvidence'],
): value is OfflineNodeRunnerAlphaComponentSemanticEvidence {
  return isRecord(value)
    && value.sourceMimeType === 'image/png'
    && 'maskBytesVerified' in value
}

function decodeVerifiedGray8Mask(maskPng: Buffer): Buffer {
  try {
    let offset = 8
    let width = 0
    let height = 0
    const compressed: Buffer[] = []
    while (offset + 12 <= maskPng.byteLength) {
      const length = maskPng.readUInt32BE(offset)
      const type =
        maskPng.subarray(offset + 4, offset + 8)
          .toString('ascii')
      const dataStart = offset + 8
      const dataEnd = dataStart + length
      if (dataEnd + 4 > maskPng.byteLength) {
        throw new Error('chunk bound')
      }
      if (type === 'IHDR') {
        width = maskPng.readUInt32BE(dataStart)
        height = maskPng.readUInt32BE(dataStart + 4)
      } else if (type === 'IDAT') {
        compressed.push(
          Buffer.from(maskPng.subarray(dataStart, dataEnd)),
        )
      } else if (type === 'IEND') {
        offset = dataEnd + 4
        break
      }
      offset = dataEnd + 4
    }
    if (
      width !== WIDTH
      || height !== HEIGHT
      || compressed.length === 0
      || offset !== maskPng.byteLength
    ) throw new Error('mask shape')
    const inflated = inflateSync(Buffer.concat(compressed), {
      maxOutputLength: (WIDTH + 1) * HEIGHT,
    })
    if (inflated.byteLength !== (WIDTH + 1) * HEIGHT) {
      throw new Error('mask decoded length')
    }
    const decoded = Buffer.allocUnsafe(PIXEL_COUNT)
    for (let y = 0; y < HEIGHT; y += 1) {
      const sourceOffset = y * (WIDTH + 1)
      const filter = inflated[sourceOffset]!
      if (filter > 4) throw new Error('mask filter')
      for (let x = 0; x < WIDTH; x += 1) {
        const raw = inflated[sourceOffset + 1 + x]!
        const left = x > 0
          ? decoded[y * WIDTH + x - 1]!
          : 0
        const above = y > 0
          ? decoded[(y - 1) * WIDTH + x]!
          : 0
        const upperLeft = y > 0 && x > 0
          ? decoded[(y - 1) * WIDTH + x - 1]!
          : 0
        const value = filter === 0
          ? raw
          : filter === 1
            ? raw + left
            : filter === 2
              ? raw + above
              : filter === 3
                ? raw + Math.floor((left + above) / 2)
                : raw + paeth(left, above, upperLeft)
        decoded[y * WIDTH + x] = value & 0xff
      }
    }
    return decoded
  } catch {
    throw invalid('mask_lease_invalid', '$.maskLease')
  }
}

function composeStraightAlpha(
  sourceRgba: Buffer,
  mask: Buffer,
): Buffer {
  if (
    sourceRgba.byteLength !== PIXEL_COUNT * 4
    || mask.byteLength !== PIXEL_COUNT
  ) throw invalid('alpha_output_invalid', '$.alphaOutput')
  const output = Buffer.allocUnsafe(sourceRgba.byteLength)
  for (let index = 0; index < PIXEL_COUNT; index += 1) {
    const offset = index * 4
    if (sourceRgba[offset + 3] !== 255) {
      throw invalid('alpha_output_invalid', '$.alphaOutput')
    }
    const alpha = mask[index]!
    output[offset] = alpha === 0 ? 0 : sourceRgba[offset]!
    output[offset + 1] =
      alpha === 0 ? 0 : sourceRgba[offset + 1]!
    output[offset + 2] =
      alpha === 0 ? 0 : sourceRgba[offset + 2]!
    output[offset + 3] = alpha
  }
  return output
}

function paeth(
  left: number,
  above: number,
  upperLeft: number,
): number {
  const prediction = left + above - upperLeft
  const leftDistance = Math.abs(prediction - left)
  const aboveDistance = Math.abs(prediction - above)
  const upperLeftDistance =
    Math.abs(prediction - upperLeft)
  if (
    leftDistance <= aboveDistance
    && leftDistance <= upperLeftDistance
  ) return left
  return aboveDistance <= upperLeftDistance
    ? above
    : upperLeft
}

function resolveEvidenceClass(
  value: LivingFrameControlledSdxlRembgGpuRuntimeReceipt[
    'evidenceClass'
  ],
): LivingFrameControlledSdxlRembgAlphaBridgeEvidenceClass {
  return value ===
    'controlled_non_promotable_generated_still_rembg_gpu_fixture'
    ? 'controlled_non_promotable_generated_still_sharp_alpha_fixture'
    : 'private_internal_generated_still_sharp_alpha_observation_unreleased'
}

function assertReceiptSafe(
  value: Omit<
    LivingFrameControlledSdxlRembgAlphaBridgeReceipt,
    'bridgeObservationDigestSha256'
  >,
): void {
  if (!receiptDraftSchema.safeParse(value).success) {
    throw invalid('unsafe_receipt_forbidden', '$')
  }
  if (
    canonicalJson(value.openGateCodes)
      !== canonicalJson(
        LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_OPEN_GATES,
      )
    || canonicalJson(value.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
    || value.outputArtifactPersisted !== false
    || value.assetManifestUpdated !== false
    || value.actualCostEvidenceCreated !== false
    || value.customerChargeCreated !== false
    || value.alphaQaPassed !== false
    || value.productionReady !== false
  ) throw invalid('unsafe_receipt_forbidden', '$')
  const population =
    value.alphaOutput.transparentPixelCount
    + value.alphaOutput.partialAlphaPixelCount
    + value.alphaOutput.opaquePixelCount
  if (population !== PIXEL_COUNT) {
    throw invalid('unsafe_receipt_forbidden', '$.alphaOutput')
  }
  const serialized = canonicalJson(value)
  for (const forbidden of [
    'https://',
    'http://',
    'file://',
    'data:',
    'AKIA',
    'sk-',
    'BEGIN PRIVATE KEY',
    '"sourceBytes"',
    '"maskBytes"',
    '"alphaPng"',
    '"decodedRgba"',
    '"path"',
    '"url"',
    '"credential"',
    '"command"',
    '"customerCredits"',
    '"serviceFeeAmount"',
    '"priceUsd"',
  ]) {
    if (
      serialized.toLowerCase().includes(
        forbidden.toLowerCase(),
      )
    ) throw invalid('unsafe_receipt_forbidden', '$')
  }
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function digestBytes(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (
      typeof value === 'number'
      && Number.isFinite(value)
    )
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    const output: Record<string, unknown> = {}
    for (const key of Object.keys(value).sort()) {
      const child = value[key]
      if (child === undefined) {
        throw new TypeError('undefined is not canonical JSON')
      }
      output[key] = canonicalize(child)
    }
    return output
  }
  throw new TypeError('non-JSON value')
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !ArrayBuffer.isView(value)
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

function invalid(
  code: LivingFrameControlledSdxlRembgAlphaBridgeIssueCode,
  path: string,
): LivingFrameControlledSdxlRembgAlphaBridgeError {
  if (
    !(LIVING_FRAME_CONTROLLED_SDXL_REMBG_ALPHA_BRIDGE_ISSUE_CODES as
      readonly unknown[]).includes(code)
  ) throw new TypeError('invalid issue code')
  return new LivingFrameControlledSdxlRembgAlphaBridgeError(
    code,
    path,
  )
}
