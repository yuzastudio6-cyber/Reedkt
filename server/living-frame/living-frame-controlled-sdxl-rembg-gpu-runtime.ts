import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_EVIDENCE_CLASSES,
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_FAILURE_CODES,
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_RECEIPT_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_TERMINAL_STATES,
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_VERSION,
  type LivingFrameControlledSdxlRembgAlphaSourceLease,
  type LivingFrameControlledSdxlRembgGpuMaskLease,
  type LivingFrameControlledSdxlRembgGpuRuntimeAuthority,
  type LivingFrameControlledSdxlRembgGpuRuntimeEvidenceClass,
  type LivingFrameControlledSdxlRembgGpuRuntimeFailureCode,
  type LivingFrameControlledSdxlRembgGpuRuntimeIssueCode,
  type LivingFrameControlledSdxlRembgGpuRuntimeReceipt,
} from '../../src/types/living-frame-controlled-sdxl-rembg-gpu-runtime'
import type {
  LivingFrameControlledSdxlRembgInputBinding,
} from '../../src/types/living-frame-controlled-sdxl-rembg-input-binding'
import {
  getCanonicalRembgGpuRuntimeContract,
} from '../model-artifacts/canonical-rembg-gpu-runtime-contract'
import {
  verifyCanonicalRembgGray8MaskPng,
} from '../model-artifacts/canonical-rembg-mask-png-verifier'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  canonicalPrivateToolDispatchConsumptionResponseSchema,
  type CanonicalPrivateToolDispatchConsumptionResponse,
} from '../validation/canonical-private-tool-dispatch-schemas'
import {
  verifyLivingFrameControlledSdxlRembgInputBinding,
} from './living-frame-controlled-sdxl-rembg-input-binding'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,191}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const MAX_SOURCE_BYTES = 16 * 1024 * 1024
const MAX_MASK_BYTES = 16 * 1024 * 1024
const WIDTH = 1024 as const
const HEIGHT = 1024 as const
const PIXEL_COUNT = WIDTH * HEIGHT
const RGBA_BYTE_COUNT = PIXEL_COUNT * 4

const authorityBoundarySchema = z.object({
  privateGeneratedStillRereadAuthority: z.literal(true),
  namespacedRuntimeObservationAuthority: z.literal(true),
  canonicalSourceVariantAuthority: z.literal(false),
  canonicalDispatchAuthority: z.literal(false),
  modelArtifactRepositoryAuthority: z.literal(false),
  modelArtifactMountAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRegistryAuthority: z.literal(false),
  operationRegistryAuthority: z.literal(false),
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
  maskArtifactCommitAuthority: z.literal(false),
  maskQaAuthority: z.literal(false),
  alphaComponentAuthority: z.literal(false),
  alphaQaAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const maskOutputSchema = z.object({
  contentType: z.literal('image/png'),
  encodingProfile: z.literal('gray8_mask_png_v1'),
  widthPixels: z.literal(WIDTH),
  heightPixels: z.literal(HEIGHT),
  outputCount: z.literal(1),
  byteLength: z.number().int().min(67).max(MAX_MASK_BYTES),
  contentSha256: z.string().regex(SHA256),
  decodedMaskSha256: z.string().regex(SHA256),
  minimumMaskValue: z.number().int().min(0).max(254),
  maximumMaskValue: z.number().int().min(1).max(255),
  uniqueMaskValueCount: z.number().int().min(2).max(256),
  transparentPixelCount: z.number().int().nonnegative()
    .max(PIXEL_COUNT),
  partialPixelCount: z.number().int().positive()
    .max(PIXEL_COUNT),
  opaquePixelCount: z.number().int().nonnegative()
    .max(PIXEL_COUNT),
  thresholdMaskValue: z.literal(128),
  foregroundPixelCountAtThreshold:
    z.number().int().nonnegative().max(PIXEL_COUNT),
  sourceDimensionsPreserved: z.literal(true),
  maskVariationObserved: z.literal(true),
  outputBytesIncluded: z.literal(false),
}).strict()

const receiptDraftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_RECEIPT_CLASS,
  ),
  runtimeObservationId: z.string().regex(SAFE_ID),
  evidenceClass: z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_EVIDENCE_CLASSES,
  ),
  sourceBindings: z.object({
    rembgInputBindingId: z.string().regex(SAFE_ID),
    rembgInputBindingDigestSha256: z.string().regex(SHA256),
    gpuOutputObservationId: z.string().regex(SAFE_ID),
    gpuOutputObservationDigestSha256: z.string().regex(SHA256),
    generatedOpaqueSourceArtifactId: z.string().regex(SAFE_ID),
    generatedOpaqueSourceContentSha256: z.string().regex(SHA256),
    generatedOpaqueDecodedRgbaSha256: z.string().regex(SHA256),
    outputFrameExpectationDigestSha256: z.string().regex(SHA256),
    sourceReaderBindingDigestSha256: z.string().regex(SHA256),
    canonicalDispatchConsumptionResponseHash:
      z.string().regex(SHA256),
    executionAttemptId: z.string().regex(SAFE_ID),
    approvedPlanSnapshotId: z.string().regex(SAFE_ID),
    expectedMaskAssetId: z.string().regex(SAFE_ID),
  }).strict(),
  operation: z.object({
    canonicalToolId: z.literal('rembg'),
    operationId: z.literal(
      'tool.rembg.remove_image_background.v1',
    ),
    sourceVariant: z.literal(
      'living_frame_generated_opaque_still_png',
    ),
    sourceIsFfmpegExtractedFrame: z.literal(false),
    executionTarget: z.literal('google_cloud_run_gpu'),
    runtimeRegion: z.literal('europe-west1'),
    accelerator: z.literal('nvidia_l4'),
    gpuCount: z.literal(1),
    device: z.literal('cuda'),
    modelId: z.literal('u2netp'),
    outputMode: z.literal('mask_only_png'),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  runtimeContract: z.object({
    contractDigestSha256: z.string().regex(SHA256),
    sourceDigestSha256: z.string().regex(SHA256),
    rembgVersion: z.literal('2.0.76'),
    onnxRuntimeGpuVersion: z.literal('1.27.0'),
    exactFixedRunnerContractReused: z.literal(true),
  }).strict(),
  modelMountObservation: z.object({
    evidenceClass: z.enum([
      'controlled_non_promotable_u2netp_mount_fixture',
      'private_internal_u2netp_mount_observation_unreleased',
    ]),
    slotId: z.literal('rembg_u2netp_onnx'),
    artifactId: z.literal('rembg-u2netp-onnx'),
    revision: z.literal(
      'rembg-v0.0.0-u2netp-309c8469258d',
    ),
    byteLength: z.literal(4_574_861),
    contentSha256: z.literal(
      '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
    ),
    consumerScope: z.literal('rembg.private-inference'),
    readOnlyMountRequired: z.literal(true),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
    cpuFallbackAllowed: z.literal(false),
    modelBytesIncluded: z.literal(false),
    mountPathIncluded: z.literal(false),
    bindingDigestSha256: z.string().regex(SHA256),
  }).strict(),
  hostObservation: z.object({
    terminalState: z.enum(
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_TERMINAL_STATES,
    ),
    failureCode: z.enum(
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_FAILURE_CODES,
    ),
    requestAccepted: z.boolean(),
    modelInferenceExecuted: z.boolean(),
    startedAt: z.string().datetime({ offset: true }),
    finishedAt: z.string().datetime({ offset: true }),
    elapsedMilliseconds: z.number().int().nonnegative()
      .max(120_000),
  }).strict(),
  maskOutput: maskOutputSchema.optional(),
  maskOutputLeaseIssued: z.boolean(),
  alphaSourceLeaseIssued: z.boolean(),
  costLineage: z.object({
    comfyuiGpuAttemptChargedAgain: z.literal(false),
    rembgIsSeparateCanonicalToolAttempt: z.literal(true),
    oneRuntimeInvocationRepresentsOneRembgAttempt: z.literal(true),
    failedOrUnknownAttemptCostMustBeRetained: z.literal(true),
    canonicalWorkerResourceCostEvidenceRequired: z.literal(true),
    actualCostAmountIncluded: z.literal(false),
    customerPriceOrCreditIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  generatedStillSourceVariantAdmittedInCanonicalSharedAuthority:
    z.literal(false),
  outputArtifactPersisted: z.literal(false),
  assetManifestUpdated: z.literal(false),
  actualCostEvidenceCreated: z.literal(false),
  customerChargeCreated: z.literal(false),
  providerCallPerformed: z.literal(false),
  externalNetworkPerformed: z.literal(false),
  runtimeDownloadPerformed: z.literal(false),
  callerPathUrlCredentialCommandOrBytesAccepted: z.literal(false),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_OPEN_GATES,
  )).length(
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_OPEN_GATES.length,
  ),
  authorityBoundary: authorityBoundarySchema,
  productionReady: z.literal(false),
}).strict()

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlRembgGpuRuntimeAuthority =
  deepFreeze({
    privateGeneratedStillRereadAuthority: true,
    namespacedRuntimeObservationAuthority: true,
    canonicalSourceVariantAuthority: false,
    canonicalDispatchAuthority: false,
    modelArtifactRepositoryAuthority: false,
    modelArtifactMountAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
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
    maskArtifactCommitAuthority: false,
    maskQaAuthority: false,
    alphaComponentAuthority: false,
    alphaQaAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameControlledSdxlRembgGpuSourcePacket {
  readonly packetClass:
    'server_owned_verified_generated_still_runtime_source_v1'
  readonly inputBindingId: string
  readonly inputBindingDigestSha256: string
  readonly sourceArtifactId: string
  readonly sourceContentSha256: string
  readonly sourceByteLength: number
  readonly decodedRgbaSha256: string
  readonly outputFrameExpectationDigestSha256: string
  readonly sourcePng: Buffer
  readonly decodedRgba: Buffer
  readonly callerBytesPathUrlOrCredentialAccepted: false
  readonly canonicalSourceVariantAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlRembgGpuSourceReader {
  readonly readerVersion:
    'living-frame-controlled-sdxl-rembg-gpu-source-reader-v1'
  readonly readerClass:
    'process_bound_server_owned_generated_still_runtime_source_reader'
  readonly binding: {
    readonly inputBindingId: string
    readonly inputBindingDigestSha256: string
    readonly sourceArtifactId: string
    readonly sourceContentSha256: string
    readonly decodedRgbaSha256: string
    readonly outputFrameExpectationDigestSha256: string
    readonly readerBindingDigestSha256: string
  }
  readonly callerBytesAccepted: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly credentialsIncluded: false
  readonly canonicalSourceVariantAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
  readServerOwnedGeneratedStill():
    Promise<LivingFrameControlledSdxlRembgGpuSourcePacket>
}

export interface LivingFrameControlledSdxlRembgGpuModelMountObservation {
  readonly evidenceClass:
    | 'controlled_non_promotable_u2netp_mount_fixture'
    | 'private_internal_u2netp_mount_observation_unreleased'
  readonly slotId: 'rembg_u2netp_onnx'
  readonly artifactId: 'rembg-u2netp-onnx'
  readonly revision:
    'rembg-v0.0.0-u2netp-309c8469258d'
  readonly byteLength: 4_574_861
  readonly contentSha256:
    '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
  readonly consumerScope: 'rembg.private-inference'
  readonly executionTarget: 'google_cloud_run_gpu'
  readonly runtimeRegion: 'europe-west1'
  readonly accelerator: 'nvidia_l4'
  readonly device: 'cuda'
  readonly readOnlyMountObserved: boolean
  readonly runtimeDownloadAllowed: false
  readonly networkFetchAllowed: false
  readonly cpuFallbackAllowed: false
  readonly modelBytesIncluded: false
  readonly mountPathIncluded: false
}

export interface LivingFrameControlledSdxlRembgGpuModelMountPort {
  readonly portClass:
    | 'controlled_fixture_u2netp_model_mount_port_v1'
    | 'private_internal_u2netp_model_mount_port_v1'
  readonly callerArtifactAccepted: false
  readonly callerPathUrlOrBytesAccepted: false
  readonly runtimeDownloadsAllowed: false
  readonly networkFetchAllowed: false
  readonly productionQualified: false
  inspectExactMount():
    Promise<LivingFrameControlledSdxlRembgGpuModelMountObservation>
}

export interface LivingFrameControlledSdxlRembgGpuHostRequest {
  readonly requestClass:
    'process_bound_generated_still_rembg_gpu_request_v1'
  readonly requestId: string
  readonly executionAttemptId: string
  readonly sourceVariant:
    'living_frame_generated_opaque_still_png'
  readonly sourceArtifactId: string
  readonly sourceContentSha256: string
  readonly sourceByteLength: number
  readonly decodedRgbaSha256: string
  readonly widthPixels: 1024
  readonly heightPixels: 1024
  readonly sourcePng: Buffer
  readonly runtimeContractDigestSha256: string
  readonly modelMountBindingDigestSha256: string
  readonly operation: {
    readonly canonicalToolId: 'rembg'
    readonly operationId:
      'tool.rembg.remove_image_background.v1'
    readonly device: 'cuda'
    readonly modelId: 'u2netp'
    readonly outputMode: 'mask_only_png'
    readonly preserveSourceDimensions: true
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
}

export interface LivingFrameControlledSdxlRembgGpuHostExecutionResult {
  readonly evidenceClass:
    LivingFrameControlledSdxlRembgGpuRuntimeEvidenceClass
  readonly terminalState:
    | 'completed'
    | 'failed'
    | 'outcome_unknown'
  readonly failureCode:
    LivingFrameControlledSdxlRembgGpuRuntimeFailureCode
  readonly requestAccepted: boolean
  readonly modelInferenceExecuted: boolean
  readonly startedAt: string
  readonly finishedAt: string
  readonly maskPngBytes?: Buffer
  readonly maskOutputCount: number
  readonly externalNetworkPerformed: false
  readonly runtimeDownloadPerformed: false
  readonly cpuFallbackPerformed: false
}

export interface LivingFrameControlledSdxlRembgGpuHostPort {
  readonly hostPortClass:
    | 'controlled_fixture_generated_still_rembg_gpu_host_port_v1'
    | 'private_internal_generated_still_rembg_gpu_host_port_v1'
  readonly callerEndpointAccepted: false
  readonly callerPathUrlCredentialCommandAccepted: false
  readonly externalNetworkAllowed: false
  readonly runtimeDownloadsAllowed: false
  readonly cpuFallbackAllowed: false
  readonly productionQualified: false
  executeOne(
    request: LivingFrameControlledSdxlRembgGpuHostRequest,
  ): Promise<LivingFrameControlledSdxlRembgGpuHostExecutionResult>
}

export interface LivingFrameControlledSdxlRembgGpuRuntimeInput {
  readonly rembgInputBinding:
    LivingFrameControlledSdxlRembgInputBinding
  readonly sourceReader:
    LivingFrameControlledSdxlRembgGpuSourceReader
  readonly canonicalDispatchConsumption:
    CanonicalPrivateToolDispatchConsumptionResponse
  readonly modelMountPort:
    LivingFrameControlledSdxlRembgGpuModelMountPort
  readonly hostPort:
    LivingFrameControlledSdxlRembgGpuHostPort
}

export interface LivingFrameControlledSdxlRembgGpuRuntimeResult {
  readonly receipt:
    LivingFrameControlledSdxlRembgGpuRuntimeReceipt
  readonly maskLease?: LivingFrameControlledSdxlRembgGpuMaskLease
  readonly alphaSourceLease?:
    LivingFrameControlledSdxlRembgAlphaSourceLease
}

export interface LivingFrameControlledSdxlRembgGpuMaskLeasePayload {
  readonly maskPng: Buffer
  readonly verification: {
    readonly runtimeObservationDigestSha256: string
    readonly contentSha256: string
    readonly decodedMaskSha256: string
    readonly widthPixels: 1024
    readonly heightPixels: 1024
  }
}

export interface LivingFrameControlledSdxlRembgAlphaSourceLeasePayload {
  readonly sourcePng: Buffer
  readonly decodedRgba: Buffer
  readonly verification: {
    readonly runtimeObservationDigestSha256: string
    readonly sourceContentSha256: string
    readonly decodedRgbaSha256: string
    readonly widthPixels: 1024
    readonly heightPixels: 1024
  }
}

const sourceReaders = new WeakSet<object>()
const consumedSourceReaders = new WeakSet<object>()
const modelMountPorts = new WeakSet<object>()
const hostPorts = new WeakSet<object>()
const maskLeases = new WeakSet<object>()
const consumedMaskLeases = new WeakSet<object>()
const maskPayloads =
  new WeakMap<object, LivingFrameControlledSdxlRembgGpuMaskLeasePayload>()
const alphaSourceLeases = new WeakSet<object>()
const consumedAlphaSourceLeases = new WeakSet<object>()
const alphaSourcePayloads =
  new WeakMap<object, LivingFrameControlledSdxlRembgAlphaSourceLeasePayload>()

export class LivingFrameControlledSdxlRembgGpuRuntimeError
  extends Error {
  readonly code:
    LivingFrameControlledSdxlRembgGpuRuntimeIssueCode
  readonly path: string

  constructor(
    code: LivingFrameControlledSdxlRembgGpuRuntimeIssueCode,
    path: string,
  ) {
    super(`${code} at ${path}`)
    this.name =
      'LivingFrameControlledSdxlRembgGpuRuntimeError'
    this.code = code
    this.path = path
  }
}

export function createLivingFrameControlledSdxlRembgGpuSourceReader(
  input: {
    readonly rembgInputBinding:
      LivingFrameControlledSdxlRembgInputBinding
    readonly readServerOwnedGeneratedStill:
      LivingFrameControlledSdxlRembgGpuSourceReader[
        'readServerOwnedGeneratedStill'
      ]
  },
): LivingFrameControlledSdxlRembgGpuSourceReader {
  if (
    !verifyLivingFrameControlledSdxlRembgInputBinding(
      input.rembgInputBinding,
    )
    || typeof input.readServerOwnedGeneratedStill !== 'function'
  ) throw invalid('source_reader_invalid', '$.sourceReader')
  const binding = input.rembgInputBinding
  const bindingDraft = {
    inputBindingId: binding.bindingId,
    inputBindingDigestSha256: binding.bindingDigestSha256,
    sourceArtifactId: binding.sourceBindings.outputArtifactId,
    sourceContentSha256:
      binding.verifiedOpaqueInput.contentSha256,
    decodedRgbaSha256:
      binding.verifiedOpaqueInput.decodedRgbaSha256,
    outputFrameExpectationDigestSha256:
      binding.sourceBindings.outputFrameExpectationDigestSha256,
  }
  const reader:
    LivingFrameControlledSdxlRembgGpuSourceReader =
    Object.freeze({
      readerVersion:
        'living-frame-controlled-sdxl-rembg-gpu-source-reader-v1',
      readerClass:
        'process_bound_server_owned_generated_still_runtime_source_reader',
      binding: Object.freeze({
        ...bindingDraft,
        readerBindingDigestSha256: digest(bindingDraft),
      }),
      callerBytesAccepted: false,
      callerPathAccepted: false,
      callerUrlAccepted: false,
      credentialsIncluded: false,
      canonicalSourceVariantAuthority: false,
      actualCostAuthority: false,
      productionReady: false,
      readServerOwnedGeneratedStill:
        input.readServerOwnedGeneratedStill.bind(undefined),
    })
  sourceReaders.add(reader)
  return reader
}

export function registerLivingFrameControlledSdxlRembgGpuModelMountPort<
  T extends LivingFrameControlledSdxlRembgGpuModelMountPort,
>(port: T): T {
  if (
    !port
    || typeof port !== 'object'
    || ![
      'controlled_fixture_u2netp_model_mount_port_v1',
      'private_internal_u2netp_model_mount_port_v1',
    ].includes(port.portClass)
    || port.callerArtifactAccepted !== false
    || port.callerPathUrlOrBytesAccepted !== false
    || port.runtimeDownloadsAllowed !== false
    || port.networkFetchAllowed !== false
    || port.productionQualified !== false
    || typeof port.inspectExactMount !== 'function'
  ) throw invalid(
    'model_mount_port_invalid',
    '$.modelMountPort',
  )
  modelMountPorts.add(port)
  return port
}

export function registerLivingFrameControlledSdxlRembgGpuHostPort<
  T extends LivingFrameControlledSdxlRembgGpuHostPort,
>(port: T): T {
  if (
    !port
    || typeof port !== 'object'
    || ![
      'controlled_fixture_generated_still_rembg_gpu_host_port_v1',
      'private_internal_generated_still_rembg_gpu_host_port_v1',
    ].includes(port.hostPortClass)
    || port.callerEndpointAccepted !== false
    || port.callerPathUrlCredentialCommandAccepted !== false
    || port.externalNetworkAllowed !== false
    || port.runtimeDownloadsAllowed !== false
    || port.cpuFallbackAllowed !== false
    || port.productionQualified !== false
    || typeof port.executeOne !== 'function'
  ) throw invalid('host_port_invalid', '$.hostPort')
  hostPorts.add(port)
  return port
}

export async function executeLivingFrameControlledSdxlRembgGpuRuntime(
  input: LivingFrameControlledSdxlRembgGpuRuntimeInput,
): Promise<LivingFrameControlledSdxlRembgGpuRuntimeResult> {
  if (
    !input
    || typeof input !== 'object'
    || !verifyLivingFrameControlledSdxlRembgInputBinding(
      input.rembgInputBinding,
    )
  ) throw invalid('input_invalid', '$')
  const binding = input.rembgInputBinding
  const dispatch = assertCanonicalDispatch(
    input.canonicalDispatchConsumption,
  )
  const sourceReader = requireSourceReader(
    input.sourceReader,
    binding,
  )
  if (!modelMountPorts.has(input.modelMountPort)) {
    throw invalid(
      'model_mount_port_invalid',
      '$.modelMountPort',
    )
  }
  if (!hostPorts.has(input.hostPort)) {
    throw invalid('host_port_invalid', '$.hostPort')
  }

  consumedSourceReaders.add(sourceReader)
  let sourcePacket:
    LivingFrameControlledSdxlRembgGpuSourcePacket
  try {
    sourcePacket =
      await sourceReader.readServerOwnedGeneratedStill()
  } catch {
    throw invalid('source_reader_failed', '$.sourceReader')
  }
  const source = assertSourcePacket(sourcePacket, binding)

  const runtimeContract =
    await getCanonicalRembgGpuRuntimeContract()
  if (
    runtimeContract.operationIdentity.approvedToolId !== 'rembg'
    || runtimeContract.operationIdentity.operationId
      !== 'tool.rembg.remove_image_background.v1'
    || runtimeContract.runtimeProtocol.device !== 'cuda'
    || runtimeContract.runtimeProtocol.cpuFallbackAllowed
    || runtimeContract.runtimeProtocol.runtimeDownloadAllowed
    || runtimeContract.runtimeProtocol.networkFetchAllowed
    || runtimeContract.runtimeProtocol.outputMaskFormat
      !== 'gray8_mask_png'
  ) throw invalid(
    'runtime_contract_invalid',
    '$.runtimeContract',
  )

  let rawMount:
    LivingFrameControlledSdxlRembgGpuModelMountObservation
  try {
    rawMount = await input.modelMountPort.inspectExactMount()
  } catch {
    throw invalid(
      'model_mount_binding_invalid',
      '$.modelMountPort',
    )
  }
  const modelMount = assertModelMount(
    rawMount,
    input.modelMountPort.portClass,
    runtimeContract.fixedFileLayout.modelFiles[0],
  )
  const modelMountDraft = {
    evidenceClass: modelMount.evidenceClass,
    slotId: modelMount.slotId,
    artifactId: modelMount.artifactId,
    revision: modelMount.revision,
    byteLength: modelMount.byteLength,
    contentSha256: modelMount.contentSha256,
    consumerScope: modelMount.consumerScope,
    readOnlyMountRequired: true as const,
    runtimeDownloadAllowed: false as const,
    networkFetchAllowed: false as const,
    cpuFallbackAllowed: false as const,
    modelBytesIncluded: false as const,
    mountPathIncluded: false as const,
  }
  const modelMountObservation = Object.freeze({
    ...modelMountDraft,
    bindingDigestSha256: digest(modelMountDraft),
  })

  const request:
    LivingFrameControlledSdxlRembgGpuHostRequest =
    deepFreeze({
      requestClass:
        'process_bound_generated_still_rembg_gpu_request_v1',
      requestId:
        `lfrembgreq_${digest({
          binding: binding.bindingDigestSha256,
          dispatch: dispatch.responseHash,
          attempt: dispatch.executionAttemptId,
          model: modelMountObservation.bindingDigestSha256,
        }).slice(0, 40)}`,
      executionAttemptId: dispatch.executionAttemptId,
      sourceVariant:
        'living_frame_generated_opaque_still_png',
      sourceArtifactId: sourcePacket.sourceArtifactId,
      sourceContentSha256: sourcePacket.sourceContentSha256,
      sourceByteLength: source.sourcePng.byteLength,
      decodedRgbaSha256: sourcePacket.decodedRgbaSha256,
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      sourcePng: Buffer.from(source.sourcePng),
      runtimeContractDigestSha256:
        runtimeContract.contractDigestSha256,
      modelMountBindingDigestSha256:
        modelMountObservation.bindingDigestSha256,
      operation: {
        canonicalToolId: 'rembg',
        operationId:
          'tool.rembg.remove_image_background.v1',
        device: 'cuda',
        modelId: 'u2netp',
        outputMode: 'mask_only_png',
        preserveSourceDimensions: true,
        cpuFallbackAllowed: false,
        runtimeDownloadAllowed: false,
        networkFetchAllowed: false,
      },
    })

  let hostResult:
    LivingFrameControlledSdxlRembgGpuHostExecutionResult
  try {
    hostResult = await input.hostPort.executeOne(request)
  } catch {
    throw invalid('host_result_invalid', '$.hostPort')
  }
  assertHostResult(hostResult, input.hostPort.hostPortClass)
  const maskOutput =
    hostResult.terminalState === 'completed'
      ? inspectMaskOutput(hostResult)
      : undefined
  const elapsedMilliseconds =
    Date.parse(hostResult.finishedAt)
    - Date.parse(hostResult.startedAt)
  const runtimeObservationId =
    `lfrembgrun_${digest({
      binding: binding.bindingDigestSha256,
      dispatch: dispatch.responseHash,
      attempt: dispatch.executionAttemptId,
      startedAt: hostResult.startedAt,
      finishedAt: hostResult.finishedAt,
      terminalState: hostResult.terminalState,
      mask: maskOutput?.contentSha256 ?? null,
    }).slice(0, 40)}`
  const draft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_RECEIPT_CLASS,
    runtimeObservationId,
    evidenceClass: hostResult.evidenceClass,
    sourceBindings: {
      rembgInputBindingId: binding.bindingId,
      rembgInputBindingDigestSha256:
        binding.bindingDigestSha256,
      gpuOutputObservationId:
        binding.sourceBindings.gpuOutputObservationId,
      gpuOutputObservationDigestSha256:
        binding.sourceBindings.gpuOutputObservationDigestSha256,
      generatedOpaqueSourceArtifactId:
        binding.sourceBindings.outputArtifactId,
      generatedOpaqueSourceContentSha256:
        binding.verifiedOpaqueInput.contentSha256,
      generatedOpaqueDecodedRgbaSha256:
        binding.verifiedOpaqueInput.decodedRgbaSha256,
      outputFrameExpectationDigestSha256:
        binding.sourceBindings.outputFrameExpectationDigestSha256,
      sourceReaderBindingDigestSha256:
        sourceReader.binding.readerBindingDigestSha256,
      canonicalDispatchConsumptionResponseHash:
        dispatch.responseHash,
      executionAttemptId: dispatch.executionAttemptId,
      approvedPlanSnapshotId:
        dispatch.grant.binding.approvedPlanSnapshotId,
      expectedMaskAssetId:
        dispatch.grant.binding.expectedAssetId,
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
      contractDigestSha256:
        runtimeContract.contractDigestSha256,
      sourceDigestSha256:
        runtimeContract.sourceDigestSha256,
      rembgVersion: '2.0.76' as const,
      onnxRuntimeGpuVersion: '1.27.0' as const,
      exactFixedRunnerContractReused: true as const,
    },
    modelMountObservation,
    hostObservation: {
      terminalState: hostResult.terminalState,
      failureCode: hostResult.failureCode,
      requestAccepted: hostResult.requestAccepted,
      modelInferenceExecuted:
        hostResult.modelInferenceExecuted,
      startedAt: hostResult.startedAt,
      finishedAt: hostResult.finishedAt,
      elapsedMilliseconds,
    },
    ...(maskOutput ? { maskOutput } : {}),
    maskOutputLeaseIssued: maskOutput !== undefined,
    alphaSourceLeaseIssued: maskOutput !== undefined,
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
    authorityBoundary: AUTHORITY_BOUNDARY,
    productionReady: false as const,
  }
  assertReceiptSafe(draft)
  const receipt:
    LivingFrameControlledSdxlRembgGpuRuntimeReceipt =
    deepFreeze({
      ...draft,
      runtimeObservationDigestSha256: digest(draft),
    })
  if (!maskOutput || !hostResult.maskPngBytes) {
    return deepFreeze({ receipt })
  }

  const maskLease:
    LivingFrameControlledSdxlRembgGpuMaskLease =
    deepFreeze({
      leaseClass:
        'process_bound_single_use_unpersisted_rembg_gray8_mask_lease_v1',
      leaseId:
        `lfrembgmask_${digest({
          runtime: receipt.runtimeObservationDigestSha256,
          mask: maskOutput.contentSha256,
        }).slice(0, 40)}`,
      runtimeObservationDigestSha256:
        receipt.runtimeObservationDigestSha256,
      contentSha256: maskOutput.contentSha256,
      decodedMaskSha256: maskOutput.decodedMaskSha256,
      byteLength: maskOutput.byteLength,
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      callerSerializable: false,
      artifactPersistenceAuthority: false,
      maskQaAuthority: false,
      alphaAuthority: false,
      productionReady: false,
    })
  maskLeases.add(maskLease)
  maskPayloads.set(maskLease, {
    maskPng: Buffer.from(hostResult.maskPngBytes),
    verification: {
      runtimeObservationDigestSha256:
        receipt.runtimeObservationDigestSha256,
      contentSha256: maskOutput.contentSha256,
      decodedMaskSha256: maskOutput.decodedMaskSha256,
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
    },
  })

  const alphaSourceLease:
    LivingFrameControlledSdxlRembgAlphaSourceLease =
    deepFreeze({
      leaseClass:
        'process_bound_single_use_unpersisted_generated_still_alpha_source_lease_v1',
      leaseId:
        `lfalphasrc_${digest({
          runtime: receipt.runtimeObservationDigestSha256,
          source: sourcePacket.sourceContentSha256,
        }).slice(0, 40)}`,
      runtimeObservationDigestSha256:
        receipt.runtimeObservationDigestSha256,
      sourceContentSha256: sourcePacket.sourceContentSha256,
      decodedRgbaSha256: sourcePacket.decodedRgbaSha256,
      byteLength: source.sourcePng.byteLength,
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      callerSerializable: false,
      artifactPersistenceAuthority: false,
      alphaAuthority: false,
      productionReady: false,
    })
  alphaSourceLeases.add(alphaSourceLease)
  alphaSourcePayloads.set(alphaSourceLease, {
    sourcePng: Buffer.from(source.sourcePng),
    decodedRgba: Buffer.from(source.decodedRgba),
    verification: {
      runtimeObservationDigestSha256:
        receipt.runtimeObservationDigestSha256,
      sourceContentSha256: sourcePacket.sourceContentSha256,
      decodedRgbaSha256: sourcePacket.decodedRgbaSha256,
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
    },
  })
  return deepFreeze({
    receipt,
    maskLease,
    alphaSourceLease,
  })
}

export function consumeLivingFrameControlledSdxlRembgGpuMaskLease(
  lease: LivingFrameControlledSdxlRembgGpuMaskLease,
): LivingFrameControlledSdxlRembgGpuMaskLeasePayload {
  if (
    !maskLeases.has(lease)
    || consumedMaskLeases.has(lease)
    || lease.leaseClass !==
      'process_bound_single_use_unpersisted_rembg_gray8_mask_lease_v1'
    || lease.callerSerializable !== false
    || lease.artifactPersistenceAuthority !== false
    || lease.maskQaAuthority !== false
    || lease.alphaAuthority !== false
    || lease.productionReady !== false
  ) throw invalid('mask_lease_invalid', '$.maskLease')
  const payload = maskPayloads.get(lease)
  if (
    !payload
    || payload.maskPng.byteLength !== lease.byteLength
    || digestBytes(payload.maskPng) !== lease.contentSha256
    || payload.verification.decodedMaskSha256
      !== lease.decodedMaskSha256
  ) throw invalid('mask_lease_invalid', '$.maskLease')
  consumedMaskLeases.add(lease)
  maskPayloads.delete(lease)
  return deepFreeze({
    maskPng: Buffer.from(payload.maskPng),
    verification: { ...payload.verification },
  })
}

export function consumeLivingFrameControlledSdxlRembgAlphaSourceLease(
  lease: LivingFrameControlledSdxlRembgAlphaSourceLease,
): LivingFrameControlledSdxlRembgAlphaSourceLeasePayload {
  if (
    !alphaSourceLeases.has(lease)
    || consumedAlphaSourceLeases.has(lease)
    || lease.leaseClass !==
      'process_bound_single_use_unpersisted_generated_still_alpha_source_lease_v1'
    || lease.callerSerializable !== false
    || lease.artifactPersistenceAuthority !== false
    || lease.alphaAuthority !== false
    || lease.productionReady !== false
  ) throw invalid(
    'alpha_source_lease_invalid',
    '$.alphaSourceLease',
  )
  const payload = alphaSourcePayloads.get(lease)
  if (
    !payload
    || payload.sourcePng.byteLength !== lease.byteLength
    || digestBytes(payload.sourcePng)
      !== lease.sourceContentSha256
    || digestBytes(payload.decodedRgba)
      !== lease.decodedRgbaSha256
  ) throw invalid(
    'alpha_source_lease_invalid',
    '$.alphaSourceLease',
  )
  consumedAlphaSourceLeases.add(lease)
  alphaSourcePayloads.delete(lease)
  return deepFreeze({
    sourcePng: Buffer.from(payload.sourcePng),
    decodedRgba: Buffer.from(payload.decodedRgba),
    verification: { ...payload.verification },
  })
}

export function verifyLivingFrameControlledSdxlRembgGpuRuntimeReceipt(
  value: unknown,
): value is LivingFrameControlledSdxlRembgGpuRuntimeReceipt {
  if (!isRecord(value)) return false
  const receiptDigest = value.runtimeObservationDigestSha256
  if (
    typeof receiptDigest !== 'string'
    || !SHA256.test(receiptDigest)
  ) return false
  const {
    runtimeObservationDigestSha256: _digest,
    ...draft
  } = value
  void _digest
  try {
    assertReceiptSafe(
      draft as unknown as Omit<
        LivingFrameControlledSdxlRembgGpuRuntimeReceipt,
        'runtimeObservationDigestSha256'
      >,
    )
    return digest(draft) === receiptDigest
  } catch {
    return false
  }
}

function assertCanonicalDispatch(
  value: unknown,
): CanonicalPrivateToolDispatchConsumptionResponse {
  const parsed =
    canonicalPrivateToolDispatchConsumptionResponseSchema
      .safeParse(value)
  if (!parsed.success) {
    throw invalid(
      'canonical_dispatch_invalid',
      '$.canonicalDispatchConsumption',
    )
  }
  const {
    responseHash,
    ...withoutHash
  } = parsed.data
  if (sha256AuthorityValue(withoutHash) !== responseHash) {
    throw invalid(
      'canonical_dispatch_invalid',
      '$.canonicalDispatchConsumption.responseHash',
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
    'canonical_dispatch_replay_forbidden',
    '$.canonicalDispatchConsumption.executionAuthority',
  )
  const binding = parsed.data.grant.binding
  if (
    binding.canonicalToolId !== 'rembg'
    || binding.operationId !==
      'tool.rembg.remove_image_background.v1'
    || binding.expectedOutput.artifactType !==
      'living_frame_alpha_mask_png'
    || binding.expectedOutput.contentType !== 'image/png'
    || !binding.expectedOutput.required
    || binding.expectedOutput.previewPlaceholderAllowed
  ) throw invalid(
    'canonical_operation_mismatch',
    '$.canonicalDispatchConsumption.grant.binding',
  )
  return parsed.data
}

function requireSourceReader(
  reader: LivingFrameControlledSdxlRembgGpuSourceReader,
  binding: LivingFrameControlledSdxlRembgInputBinding,
): LivingFrameControlledSdxlRembgGpuSourceReader {
  if (
    reader
    && sourceReaders.has(reader)
    && consumedSourceReaders.has(reader)
  ) throw invalid('source_reader_reused', '$.sourceReader')
  if (
    !reader
    || !sourceReaders.has(reader)
    || consumedSourceReaders.has(reader)
    || reader.readerVersion !==
      'living-frame-controlled-sdxl-rembg-gpu-source-reader-v1'
    || reader.readerClass !==
      'process_bound_server_owned_generated_still_runtime_source_reader'
    || reader.callerBytesAccepted !== false
    || reader.callerPathAccepted !== false
    || reader.callerUrlAccepted !== false
    || reader.credentialsIncluded !== false
    || reader.canonicalSourceVariantAuthority !== false
    || reader.actualCostAuthority !== false
    || reader.productionReady !== false
  ) throw invalid('source_reader_invalid', '$.sourceReader')
  const expected = {
    inputBindingId: binding.bindingId,
    inputBindingDigestSha256: binding.bindingDigestSha256,
    sourceArtifactId: binding.sourceBindings.outputArtifactId,
    sourceContentSha256:
      binding.verifiedOpaqueInput.contentSha256,
    decodedRgbaSha256:
      binding.verifiedOpaqueInput.decodedRgbaSha256,
    outputFrameExpectationDigestSha256:
      binding.sourceBindings.outputFrameExpectationDigestSha256,
  }
  if (
    reader.binding.inputBindingId !== expected.inputBindingId
    || reader.binding.inputBindingDigestSha256
      !== expected.inputBindingDigestSha256
    || reader.binding.sourceArtifactId
      !== expected.sourceArtifactId
    || reader.binding.sourceContentSha256
      !== expected.sourceContentSha256
    || reader.binding.decodedRgbaSha256
      !== expected.decodedRgbaSha256
    || reader.binding.outputFrameExpectationDigestSha256
      !== expected.outputFrameExpectationDigestSha256
    || reader.binding.readerBindingDigestSha256
      !== digest(expected)
  ) throw invalid(
    'source_lineage_invalid',
    '$.sourceReader.binding',
  )
  return reader
}

function assertSourcePacket(
  value: unknown,
  binding: LivingFrameControlledSdxlRembgInputBinding,
): {
  readonly sourcePng: Buffer
  readonly decodedRgba: Buffer
} {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'packetClass',
      'inputBindingId',
      'inputBindingDigestSha256',
      'sourceArtifactId',
      'sourceContentSha256',
      'sourceByteLength',
      'decodedRgbaSha256',
      'outputFrameExpectationDigestSha256',
      'sourcePng',
      'decodedRgba',
      'callerBytesPathUrlOrCredentialAccepted',
      'canonicalSourceVariantAuthority',
      'actualCostAuthority',
      'productionReady',
    ])
    || value.packetClass !==
      'server_owned_verified_generated_still_runtime_source_v1'
    || value.inputBindingId !== binding.bindingId
    || value.inputBindingDigestSha256
      !== binding.bindingDigestSha256
    || value.sourceArtifactId
      !== binding.sourceBindings.outputArtifactId
    || value.sourceContentSha256
      !== binding.verifiedOpaqueInput.contentSha256
    || value.decodedRgbaSha256
      !== binding.verifiedOpaqueInput.decodedRgbaSha256
    || value.outputFrameExpectationDigestSha256
      !== binding.sourceBindings.outputFrameExpectationDigestSha256
    || !Number.isSafeInteger(value.sourceByteLength)
    || Number(value.sourceByteLength) < 33
    || Number(value.sourceByteLength) > MAX_SOURCE_BYTES
    || !Buffer.isBuffer(value.sourcePng)
    || value.sourcePng.buffer instanceof SharedArrayBuffer
    || !Buffer.isBuffer(value.decodedRgba)
    || value.decodedRgba.buffer instanceof SharedArrayBuffer
    || value.callerBytesPathUrlOrCredentialAccepted !== false
    || value.canonicalSourceVariantAuthority !== false
    || value.actualCostAuthority !== false
    || value.productionReady !== false
  ) throw invalid('source_packet_invalid', '$.sourcePacket')
  const sourcePng = Buffer.from(value.sourcePng)
  const decodedRgba = Buffer.from(value.decodedRgba)
  if (
    sourcePng.byteLength !== value.sourceByteLength
    || sourcePng.byteLength
      !== binding.verifiedOpaqueInput.byteLength
    || digestBytes(sourcePng)
      !== binding.verifiedOpaqueInput.contentSha256
    || decodedRgba.byteLength !== RGBA_BYTE_COUNT
    || digestBytes(decodedRgba)
      !== binding.verifiedOpaqueInput.decodedRgbaSha256
    || !sourcePng.subarray(0, 8).equals(
      Buffer.from('89504e470d0a1a0a', 'hex'),
    )
  ) throw invalid('source_bytes_invalid', '$.sourcePacket')
  for (
    let offset = 3;
    offset < decodedRgba.byteLength;
    offset += 4
  ) {
    if (decodedRgba[offset] !== 255) {
      throw invalid('source_bytes_invalid', '$.sourcePacket')
    }
  }
  return { sourcePng, decodedRgba }
}

function assertModelMount(
  value: unknown,
  portClass:
    LivingFrameControlledSdxlRembgGpuModelMountPort[
      'portClass'
    ],
  expected: {
    readonly slotId: 'rembg_u2netp_onnx'
    readonly byteLength: 4_574_861
    readonly contentSha256:
      '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
  },
): LivingFrameControlledSdxlRembgGpuModelMountObservation {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'evidenceClass',
      'slotId',
      'artifactId',
      'revision',
      'byteLength',
      'contentSha256',
      'consumerScope',
      'executionTarget',
      'runtimeRegion',
      'accelerator',
      'device',
      'readOnlyMountObserved',
      'runtimeDownloadAllowed',
      'networkFetchAllowed',
      'cpuFallbackAllowed',
      'modelBytesIncluded',
      'mountPathIncluded',
    ])
  ) throw invalid(
    'model_mount_binding_invalid',
    '$.modelMountPort.result',
  )
  const expectedEvidenceClass =
    portClass ===
      'controlled_fixture_u2netp_model_mount_port_v1'
      ? 'controlled_non_promotable_u2netp_mount_fixture'
      : 'private_internal_u2netp_mount_observation_unreleased'
  if (
    value.evidenceClass !== expectedEvidenceClass
    || value.slotId !== expected.slotId
    || value.artifactId !== 'rembg-u2netp-onnx'
    || value.revision !==
      'rembg-v0.0.0-u2netp-309c8469258d'
    || value.byteLength !== expected.byteLength
    || value.contentSha256 !== expected.contentSha256
    || value.consumerScope !== 'rembg.private-inference'
    || value.executionTarget !== 'google_cloud_run_gpu'
    || value.runtimeRegion !== 'europe-west1'
    || value.accelerator !== 'nvidia_l4'
    || value.device !== 'cuda'
    || typeof value.readOnlyMountObserved !== 'boolean'
    || (
      portClass ===
        'controlled_fixture_u2netp_model_mount_port_v1'
      && value.readOnlyMountObserved
    )
    || value.runtimeDownloadAllowed !== false
    || value.networkFetchAllowed !== false
    || value.cpuFallbackAllowed !== false
    || value.modelBytesIncluded !== false
    || value.mountPathIncluded !== false
  ) throw invalid(
    'model_mount_binding_invalid',
    '$.modelMountPort.result',
  )
  return value as unknown as
    LivingFrameControlledSdxlRembgGpuModelMountObservation
}

function assertHostResult(
  value: unknown,
  hostPortClass:
    LivingFrameControlledSdxlRembgGpuHostPort[
      'hostPortClass'
    ],
): asserts value is
  LivingFrameControlledSdxlRembgGpuHostExecutionResult {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'evidenceClass',
      'terminalState',
      'failureCode',
      'requestAccepted',
      'modelInferenceExecuted',
      'startedAt',
      'finishedAt',
      ...(value.maskPngBytes === undefined
        ? []
        : ['maskPngBytes']),
      'maskOutputCount',
      'externalNetworkPerformed',
      'runtimeDownloadPerformed',
      'cpuFallbackPerformed',
    ])
  ) throw invalid('host_result_invalid', '$.hostPort.result')
  const expectedEvidenceClass =
    hostPortClass ===
      'controlled_fixture_generated_still_rembg_gpu_host_port_v1'
      ? 'controlled_non_promotable_generated_still_rembg_gpu_fixture'
      : 'private_internal_generated_still_rembg_gpu_observation_unreleased'
  const startedAt =
    typeof value.startedAt === 'string'
      ? Date.parse(value.startedAt)
      : Number.NaN
  const finishedAt =
    typeof value.finishedAt === 'string'
      ? Date.parse(value.finishedAt)
      : Number.NaN
  const completed = value.terminalState === 'completed'
  if (
    value.evidenceClass !== expectedEvidenceClass
    || !(LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_TERMINAL_STATES as
      readonly unknown[]).includes(value.terminalState)
    || !(LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_FAILURE_CODES as
      readonly unknown[]).includes(value.failureCode)
    || typeof value.requestAccepted !== 'boolean'
    || typeof value.modelInferenceExecuted !== 'boolean'
    || !Number.isFinite(startedAt)
    || !Number.isFinite(finishedAt)
    || finishedAt < startedAt
    || finishedAt - startedAt > 120_000
    || !Number.isSafeInteger(value.maskOutputCount)
    || Number(value.maskOutputCount) < 0
    || Number(value.maskOutputCount) > 1
    || value.externalNetworkPerformed !== false
    || value.runtimeDownloadPerformed !== false
    || value.cpuFallbackPerformed !== false
    || (completed && (
      value.failureCode !== 'none'
      || value.requestAccepted !== true
      || value.maskOutputCount !== 1
      || !Buffer.isBuffer(value.maskPngBytes)
    ))
    || (!completed && (
      value.failureCode === 'none'
      || value.maskOutputCount !== 0
      || value.maskPngBytes !== undefined
    ))
    || (
      hostPortClass ===
        'controlled_fixture_generated_still_rembg_gpu_host_port_v1'
      && value.modelInferenceExecuted
    )
    || (
      hostPortClass ===
        'private_internal_generated_still_rembg_gpu_host_port_v1'
      && completed
      && !value.modelInferenceExecuted
    )
  ) throw invalid('host_result_invalid', '$.hostPort.result')
}

function inspectMaskOutput(
  result: LivingFrameControlledSdxlRembgGpuHostExecutionResult,
) {
  if (
    !result.maskPngBytes
    || result.maskPngBytes.byteLength < 67
    || result.maskPngBytes.byteLength > MAX_MASK_BYTES
  ) throw invalid('mask_output_invalid', '$.hostPort.result')
  let verification:
    ReturnType<typeof verifyCanonicalRembgGray8MaskPng>
  try {
    verification = verifyCanonicalRembgGray8MaskPng(
      result.maskPngBytes,
      {
        expectedWidth: WIDTH,
        expectedHeight: HEIGHT,
        maximumPixelCount: PIXEL_COUNT,
      },
    )
  } catch {
    throw invalid('mask_output_invalid', '$.hostPort.result')
  }
  const {
    width: _verifiedWidth,
    height: _verifiedHeight,
    ...maskMeasurement
  } = verification
  void _verifiedWidth
  void _verifiedHeight
  return deepFreeze({
    contentType: 'image/png' as const,
    encodingProfile: 'gray8_mask_png_v1' as const,
    widthPixels: WIDTH,
    heightPixels: HEIGHT,
    outputCount: 1 as const,
    byteLength: result.maskPngBytes.byteLength,
    contentSha256: digestBytes(result.maskPngBytes),
    ...maskMeasurement,
    sourceDimensionsPreserved: true as const,
    maskVariationObserved: true as const,
    outputBytesIncluded: false as const,
  })
}

function assertReceiptSafe(
  value: Omit<
    LivingFrameControlledSdxlRembgGpuRuntimeReceipt,
    'runtimeObservationDigestSha256'
  >,
): void {
  if (!receiptDraftSchema.safeParse(value).success) {
    throw invalid('unsafe_receipt_forbidden', '$')
  }
  const completed =
    value.hostObservation.terminalState === 'completed'
  if (
    value.maskOutputLeaseIssued !== completed
    || value.alphaSourceLeaseIssued !== completed
    || completed !== (value.maskOutput !== undefined)
    || value.generatedStillSourceVariantAdmittedInCanonicalSharedAuthority
      !== false
    || value.outputArtifactPersisted !== false
    || value.assetManifestUpdated !== false
    || value.actualCostEvidenceCreated !== false
    || value.customerChargeCreated !== false
    || value.providerCallPerformed !== false
    || value.externalNetworkPerformed !== false
    || value.runtimeDownloadPerformed !== false
    || value.callerPathUrlCredentialCommandOrBytesAccepted
      !== false
    || value.productionReady !== false
    || canonicalJson(value.openGateCodes) !== canonicalJson(
      LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_OPEN_GATES,
    )
    || canonicalJson(value.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
  ) throw invalid('unsafe_receipt_forbidden', '$')
  if (value.maskOutput) {
    const population =
      value.maskOutput.transparentPixelCount
      + value.maskOutput.partialPixelCount
      + value.maskOutput.opaquePixelCount
    if (
      population !== PIXEL_COUNT
      || value.maskOutput.minimumMaskValue
        >= value.maskOutput.maximumMaskValue
    ) throw invalid('unsafe_receipt_forbidden', '$.maskOutput')
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
    '"sourcePng"',
    '"decodedRgba"',
    '"maskPngBytes"',
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

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const required = [...expected].sort()
  return actual.length === required.length
    && actual.every((key, index) => key === required[index])
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
  code: LivingFrameControlledSdxlRembgGpuRuntimeIssueCode,
  path: string,
): LivingFrameControlledSdxlRembgGpuRuntimeError {
  return new LivingFrameControlledSdxlRembgGpuRuntimeError(
    code,
    path,
  )
}
