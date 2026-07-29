import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_SLOT_KINDS,
  type LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS,
} from '../../src/types/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_VERSION,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_REQUEST_RECEIPT_CLASS,
  type LivingFrameControlledSdxlGpuRuntimeArtifactReceipt,
  type LivingFrameControlledSdxlGpuRuntimeProtocolAuthority,
  type LivingFrameControlledSdxlGpuRuntimeProtocolIssue,
  type LivingFrameControlledSdxlGpuRuntimeProtocolIssueCode,
  type LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
  type LivingFrameControlledSdxlGpuRuntimeRequestReceiptDraft,
} from '../../src/types/living-frame-controlled-sdxl-gpu-runtime-protocol'
import type {
  LivingFrameControlledSdxlPrivatePromptMaterialization,
} from '../../src/types/living-frame-controlled-sdxl-private-prompt-materialization'
import {
  consumeLivingFrameControlledSdxlPrivatePromptLease,
  type LivingFrameControlledSdxlPrivatePromptLease,
  type LivingFramePrivateComfyUiApiPrompt,
  verifyLivingFrameControlledSdxlPrivatePromptMaterialization,
} from './living-frame-controlled-sdxl-private-prompt-materialization'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const PRIVATE_ALIAS =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,126}[A-Za-z0-9]$/u
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:)/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u
const MAX_WIRE_REQUEST_BYTES = 256 * 1_024
const MAX_ARTIFACT_BYTES = 20 * 1024 * 1024 * 1024

const MODEL_SLOT_KINDS = new Set<
  LivingFrameControlledSdxlBenchmarkRequestSlotKind
>([
  'base_checkpoint_artifact',
  'controlnet_checkpoint_artifact',
  'lora_adapter_artifact',
  'generic_ipadapter_checkpoint_artifact',
  'clip_vision_checkpoint_artifact',
])

const IMAGE_SLOT_KINDS = new Set<
  LivingFrameControlledSdxlBenchmarkRequestSlotKind
>([
  'control_image_artifact',
  'reference_image_artifact',
])

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlGpuRuntimeProtocolAuthority =
  deepFreeze({
    privateWireProtocolCompilationAuthority: true,
    materializationAuthority: false,
    artifactRepositoryAuthority: false,
    artifactMountAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    artifactCreationAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameControlledSdxlGpuRuntimePrivateArtifact {
  readonly order: number
  readonly slotKind:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind
  readonly artifactClass:
    | 'canonical_model_artifact'
    | 'private_input_image_artifact'
  readonly artifactRecordId: string
  readonly artifactContentSha256: string
  readonly artifactByteLength: number
  readonly artifactSourceBindingDigestSha256: string
  readonly privateAlias: string
  readonly readOnlyMountRequired: true
}

export interface LivingFrameControlledSdxlGpuRuntimeArtifactPacket {
  readonly sourceAuthority:
    'controlled_living_frame_gpu_artifact_fixture_reader'
  readonly evidenceClass:
    'controlled_non_promotable_gpu_runtime_artifact_packet'
  readonly materializationDigestSha256: string
  readonly outputFrameExpectationDigestSha256: string
  readonly artifactSetDigestSha256: string
  readonly artifacts:
    readonly LivingFrameControlledSdxlGpuRuntimePrivateArtifact[]
  readonly workerExpectation: {
    readonly runtimeRegion: 'europe-west1'
    readonly accelerator: 'nvidia_l4'
    readonly gpuCount: 1
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly callerBytesPathUrlOrCredentialAccepted: false
  readonly dispatchAuthority: false
  readonly actualCostAuthority: false
  readonly productionReady: false
  readonly artifactPacketDigestSha256: string
}

export interface LivingFrameControlledSdxlGpuRuntimeArtifactReaderPort {
  readonly readerClass:
    'process_bound_server_owned_living_frame_gpu_artifact_reader_v1'
  readonly sourceAuthority:
    'current_private_model_mount_and_input_artifact_repository'
  readonly callerArtifactPacketAccepted: false
  readonly callerArtifactBytesAccepted: false
  readonly callerPathUrlOrCredentialAccepted: false
  readonly artifactRepositoryAuthority: false
  readonly artifactMountAuthority: false
  readonly dispatchAuthority: false
  readonly actualCostAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
  readCurrentByServerOwnedLocator(
    serverOwnedArtifactLocatorId: string,
  ): Promise<unknown>
}

export interface LivingFrameControlledSdxlPrivateGpuWireRequest {
  readonly protocolVersion:
    typeof LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_VERSION
  readonly requestId: string
  readonly clientId: string
  readonly expectedOperation: {
    readonly canonicalToolId: 'comfyui'
    readonly operationId:
      'tool.comfyui.generate_controlled_image.v1'
  }
  readonly prompt:
    LivingFramePrivateComfyUiApiPrompt
  readonly artifactMountBindings: readonly {
    readonly order: number
    readonly slotKind:
      LivingFrameControlledSdxlBenchmarkRequestSlotKind
    readonly artifactRecordId: string
    readonly artifactContentSha256: string
    readonly artifactSourceBindingDigestSha256: string
    readonly privateAlias: string
    readonly readOnlyMountRequired: true
  }[]
  readonly outputExpectation: {
    readonly transport: 'websocket_image_output'
    readonly contentType: 'image/png'
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly imageCount: 1
  }
  readonly costEventExpectation: {
    readonly costComponentId:
      'shared_controlled_illustration_gpu_host'
    readonly sharedGpuCapabilityKeys: readonly [
      'comfyui',
      'comfyui_controlnet_aux',
      'controlnet',
      'ip_adapter',
      'peft_lora',
    ]
    readonly separateCpuQaCapabilityKey: 'auraface'
    readonly oneRequestEqualsOneGpuAttempt: true
    readonly fiveGpuCapabilitiesShareAttemptLifetime: true
    readonly auraFaceCpuMeasurementExcluded: true
    readonly exactReuseCreatesNoNewGpuAttempt: true
    readonly failedOrUnknownAttemptCostMustBeRetained: true
  }
}

export interface LivingFrameControlledSdxlPrivateGpuWireRequestLease {
  readonly leaseClass:
    'process_bound_single_use_non_dispatched_comfyui_gpu_wire_request_v1'
  readonly leaseId: string
  readonly requestReceiptDigestSha256: string
  readonly callerSerializable: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly dispatchAuthority: false
  readonly workerLeaseAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlGpuRuntimeProtocolResult {
  readonly receipt:
    LivingFrameControlledSdxlGpuRuntimeRequestReceipt
  readonly privateWireRequestLease:
    LivingFrameControlledSdxlPrivateGpuWireRequestLease
}

const privateArtifactSchema = z.object({
  order: z.number().int().nonnegative().max(16),
  slotKind: z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_SLOT_KINDS,
  ),
  artifactClass: z.enum([
    'canonical_model_artifact',
    'private_input_image_artifact',
  ]),
  artifactRecordId: z.string().regex(SAFE_ID),
  artifactContentSha256: z.string().regex(SHA256),
  artifactByteLength:
    z.number().int().positive().max(MAX_ARTIFACT_BYTES),
  artifactSourceBindingDigestSha256:
    z.string().regex(SHA256),
  privateAlias: z.string().min(3).max(128).regex(PRIVATE_ALIAS),
  readOnlyMountRequired: z.literal(true),
}).strict()

const artifactPacketDraftSchema = z.object({
  sourceAuthority: z.literal(
    'controlled_living_frame_gpu_artifact_fixture_reader',
  ),
  evidenceClass: z.literal(
    'controlled_non_promotable_gpu_runtime_artifact_packet',
  ),
  materializationDigestSha256: z.string().regex(SHA256),
  outputFrameExpectationDigestSha256: z.string().regex(SHA256),
  artifactSetDigestSha256: z.string().regex(SHA256),
  artifacts: z.array(privateArtifactSchema).min(1).max(7),
  workerExpectation: z.object({
    runtimeRegion: z.literal('europe-west1'),
    accelerator: z.literal('nvidia_l4'),
    gpuCount: z.literal(1),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  callerBytesPathUrlOrCredentialAccepted: z.literal(false),
  dispatchAuthority: z.literal(false),
  actualCostAuthority: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const artifactPacketSchema = artifactPacketDraftSchema.extend({
  artifactPacketDigestSha256: z.string().regex(SHA256),
}).strict()

const artifactReceiptSchema = z.object({
  order: z.number().int().nonnegative().max(16),
  slotKind: z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_SLOT_KINDS,
  ),
  artifactClass: z.enum([
    'canonical_model_artifact',
    'private_input_image_artifact',
  ]),
  artifactRecordId: z.string().regex(SAFE_ID),
  artifactContentSha256: z.string().regex(SHA256),
  artifactByteLength:
    z.number().int().positive().max(MAX_ARTIFACT_BYTES),
  artifactSourceBindingDigestSha256:
    z.string().regex(SHA256),
  privateAliasDigestSha256: z.string().regex(SHA256),
  privateAliasIncluded: z.literal(false),
  artifactBytesIncluded: z.literal(false),
  pathOrUrlIncluded: z.literal(false),
  readOnlyMountRequired: z.literal(true),
}).strict()

const authorityBoundarySchema = z.object({
  privateWireProtocolCompilationAuthority: z.literal(true),
  materializationAuthority: z.literal(false),
  artifactRepositoryAuthority: z.literal(false),
  artifactMountAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRegistryAuthority: z.literal(false),
  operationRegistryAuthority: z.literal(false),
  dispatchAuthority: z.literal(false),
  workerLeaseAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  actualCostAuthority: z.literal(false),
  customerPriceAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workItemAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  artifactCreationAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const receiptDraftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_REQUEST_RECEIPT_CLASS,
  ),
  requestReceiptId: z.string().regex(SAFE_ID),
  serverOwnedArtifactLocatorId: z.string().regex(SAFE_ID),
  caseId: z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS,
  ).exclude(['exact_bundle_load']),
  sourceBindings: z.object({
    promptMaterializationId: z.string().regex(SAFE_ID),
    promptMaterializationDigestSha256: z.string().regex(SHA256),
    privatePromptDigestSha256: z.string().regex(SHA256),
    privatePromptLeaseId: z.string().regex(SAFE_ID),
    artifactSetDigestSha256: z.string().regex(SHA256),
    artifactPacketDigestSha256: z.string().regex(SHA256),
    outputFrameExpectationDigestSha256: z.string().regex(SHA256),
  }).strict(),
  operationExpectation: z.object({
    expectedCanonicalToolId: z.literal('comfyui'),
    expectedCanonicalOperationId: z.literal(
      'tool.comfyui.generate_controlled_image.v1',
    ),
    sharedWorkerType: z.literal('gpu_ai_worker'),
    executionTarget: z.literal('google_cloud_run_gpu'),
    runtimeRegion: z.literal('europe-west1'),
    accelerator: z.literal('nvidia_l4'),
    gpuCount: z.literal(1),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
  }).strict(),
  requestSummary: z.object({
    privateWireRequestLeaseId: z.string().regex(SAFE_ID),
    privateWireRequestDigestSha256: z.string().regex(SHA256),
    serializedWireRequestByteLength:
      z.number().int().positive().max(MAX_WIRE_REQUEST_BYTES),
    promptNodeCount: z.number().int().positive().max(64),
    modelArtifactCount: z.number().int().positive().max(5),
    inputImageArtifactCount: z.number().int().nonnegative().max(2),
    artifactReceipts:
      z.array(artifactReceiptSchema).min(1).max(7),
    outputContentType: z.literal('image/png'),
    outputWidthPixels: z.literal(1024),
    outputHeightPixels: z.literal(1024),
    websocketImageOutputRequired: z.literal(true),
    privateWireRequestIncludedInReceipt: z.literal(false),
    privatePromptIncludedInReceipt: z.literal(false),
  }).strict(),
  costBinding: z.object({
    costComponentId: z.literal(
      'shared_controlled_illustration_gpu_host',
    ),
    sharedGpuCapabilityKeys: z.tuple([
      z.literal('comfyui'),
      z.literal('comfyui_controlnet_aux'),
      z.literal('controlnet'),
      z.literal('ip_adapter'),
      z.literal('peft_lora'),
    ]),
    separateCpuQaCapabilityKey: z.literal('auraface'),
    oneWireRequestRepresentsOneGpuAttempt: z.literal(true),
    fiveGpuCapabilitiesShareAttemptLifetime: z.literal(true),
    auraFaceExcludedFromGpuRequest: z.literal(true),
    actualWorkerResourceCostEvidenceRequired: z.literal(true),
    costAmountIncluded: z.literal(false),
    customerCreditAmountIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    failedOrUnknownAttemptCostMustBeRetained: z.literal(true),
    exactReuseCreatesNoNewGpuAttempt: z.literal(true),
    creditsMustRoundOnceAfterBundleAggregation: z.literal(true),
    customerServiceFeeAppliedOnceDownstream: z.literal(true),
  }).strict(),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_OPEN_GATES,
  )).length(
    LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_OPEN_GATES.length,
  ),
  authorityBoundary: authorityBoundarySchema,
  materializationReceiptRevalidated: z.literal(true),
  materializationLeaseConsumedExactlyOnce: z.literal(true),
  artifactPacketReadThroughProcessBoundPort: z.literal(true),
  exactArtifactSlotsMatchedMaterialization: z.literal(true),
  privateWireRequestLeaseCreated: z.literal(true),
  canonicalToolIdentityRegistered: z.literal(false),
  canonicalOperationRegistered: z.literal(false),
  dispatchReady: z.literal(false),
  gpuAttemptCreated: z.literal(false),
  gpuResponseAccepted: z.literal(false),
  actualAttemptCostEvidenceCreated: z.literal(false),
  selectedSceneCreated: z.literal(false),
  artifactCreated: z.literal(false),
  containsPrivatePromptAliasPathUrlCredentialCommandOrBytes:
    z.literal(false),
  containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    z.literal(false),
  subjectSpecificRouting: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const receiptSchema = receiptDraftSchema.extend({
  requestReceiptDigestSha256: z.string().regex(SHA256),
}).strict()

const readers = new WeakSet<object>()
const consumedReaders = new WeakSet<object>()
const wireRequestLeases = new WeakSet<object>()
const consumedWireRequestLeases = new WeakSet<object>()
const wireRequests = new WeakMap<
  object,
  LivingFrameControlledSdxlPrivateGpuWireRequest
>()

export class LivingFrameControlledSdxlGpuRuntimeProtocolError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlGpuRuntimeProtocolIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlGpuRuntimeProtocolIssue[],
  ) {
    super(
      'Living Frame controlled SDXL GPU runtime protocol compilation failed.',
    )
    this.name =
      'LivingFrameControlledSdxlGpuRuntimeProtocolError'
    this.issues = issues
  }
}

export function createLivingFrameControlledSdxlGpuRuntimeArtifactReader(
  readCurrentByServerOwnedLocator:
    LivingFrameControlledSdxlGpuRuntimeArtifactReaderPort[
      'readCurrentByServerOwnedLocator'
    ],
): LivingFrameControlledSdxlGpuRuntimeArtifactReaderPort {
  if (typeof readCurrentByServerOwnedLocator !== 'function') {
    throw invalid('reader_invalid', '$.reader')
  }
  const reader:
    LivingFrameControlledSdxlGpuRuntimeArtifactReaderPort =
    Object.freeze({
      readerClass:
        'process_bound_server_owned_living_frame_gpu_artifact_reader_v1',
      sourceAuthority:
        'current_private_model_mount_and_input_artifact_repository',
      callerArtifactPacketAccepted: false,
      callerArtifactBytesAccepted: false,
      callerPathUrlOrCredentialAccepted: false,
      artifactRepositoryAuthority: false,
      artifactMountAuthority: false,
      dispatchAuthority: false,
      actualCostAuthority: false,
      runtimeAuthority: false,
      productionReady: false,
      readCurrentByServerOwnedLocator:
        readCurrentByServerOwnedLocator.bind(undefined),
    })
  readers.add(reader)
  return reader
}

export async function compileLivingFrameControlledSdxlGpuRuntimeRequest(
  input: {
    readonly serverOwnedArtifactLocatorId: string
    readonly reader:
      LivingFrameControlledSdxlGpuRuntimeArtifactReaderPort | null
    readonly materializationReceipt:
      LivingFrameControlledSdxlPrivatePromptMaterialization
    readonly privatePromptLease:
      LivingFrameControlledSdxlPrivatePromptLease
  },
): Promise<LivingFrameControlledSdxlGpuRuntimeProtocolResult> {
  assertInput(input)
  const reader = requireReader(input.reader)
  assertMaterializationLineage(
    input.materializationReceipt,
    input.privatePromptLease,
  )
  consumedReaders.add(reader)
  let packetValue: unknown
  try {
    packetValue =
      await reader.readCurrentByServerOwnedLocator(
        input.serverOwnedArtifactLocatorId,
      )
  } catch {
    throw invalid('reader_failed', '$.reader')
  }
  const packet = assertArtifactPacket(
    packetValue,
    input.materializationReceipt,
  )
  const prompt =
    consumeLivingFrameControlledSdxlPrivatePromptLease(
      input.privatePromptLease,
    )
  assertPromptLineage(prompt, input.materializationReceipt)
  assertArtifactsAppearExactlyOnce(
    prompt,
    packet.artifacts,
  )

  const requestReceiptId =
    `lfgpureq_${digest({
      materialization:
        input.materializationReceipt.materializationDigestSha256,
      artifacts: packet.artifactSetDigestSha256,
      output:
        packet.outputFrameExpectationDigestSha256,
    }).slice(0, 40)}`
  const privateWireRequest:
    LivingFrameControlledSdxlPrivateGpuWireRequest =
    deepFreeze({
      protocolVersion:
        LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_VERSION,
      requestId: requestReceiptId,
      clientId:
        `lfclient_${digest(requestReceiptId).slice(0, 40)}`,
      expectedOperation: {
        canonicalToolId: 'comfyui',
        operationId:
          'tool.comfyui.generate_controlled_image.v1',
      },
      prompt,
      artifactMountBindings: packet.artifacts.map((artifact) => ({
        order: artifact.order,
        slotKind: artifact.slotKind,
        artifactRecordId: artifact.artifactRecordId,
        artifactContentSha256:
          artifact.artifactContentSha256,
        artifactSourceBindingDigestSha256:
          artifact.artifactSourceBindingDigestSha256,
        privateAlias: artifact.privateAlias,
        readOnlyMountRequired: true,
      })),
      outputExpectation: {
        transport: 'websocket_image_output',
        contentType: 'image/png',
        widthPixels: 1024,
        heightPixels: 1024,
        imageCount: 1,
      },
      costEventExpectation: {
        costComponentId:
          'shared_controlled_illustration_gpu_host',
        sharedGpuCapabilityKeys: [
          'comfyui',
          'comfyui_controlnet_aux',
          'controlnet',
          'ip_adapter',
          'peft_lora',
        ],
        separateCpuQaCapabilityKey: 'auraface',
        oneRequestEqualsOneGpuAttempt: true,
        fiveGpuCapabilitiesShareAttemptLifetime: true,
        auraFaceCpuMeasurementExcluded: true,
        exactReuseCreatesNoNewGpuAttempt: true,
        failedOrUnknownAttemptCostMustBeRetained: true,
      },
    })
  const serializedWireRequest = canonicalJson(privateWireRequest)
  const serializedWireRequestByteLength =
    Buffer.byteLength(serializedWireRequest, 'utf8')
  if (
    serializedWireRequestByteLength < 2
    || serializedWireRequestByteLength > MAX_WIRE_REQUEST_BYTES
  ) throw invalid(
    'wire_request_too_large',
    '$.requestSummary.serializedWireRequestByteLength',
  )
  const privateWireRequestDigestSha256 =
    digest(privateWireRequest)
  const leaseId =
    `lfgpureqlease_${digest({
      requestReceiptId,
      privateWireRequestDigestSha256,
    }).slice(0, 40)}`
  const artifactReceipts = compileArtifactReceipts(
    packet.artifacts,
  )
  const modelArtifactCount =
    packet.artifacts.filter((artifact) =>
      artifact.artifactClass ===
        'canonical_model_artifact').length
  const inputImageArtifactCount =
    packet.artifacts.length - modelArtifactCount
  const draft:
    LivingFrameControlledSdxlGpuRuntimeRequestReceiptDraft = {
      contractVersion:
        LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_REQUEST_RECEIPT_CLASS,
      requestReceiptId,
      serverOwnedArtifactLocatorId:
        input.serverOwnedArtifactLocatorId,
      caseId: input.materializationReceipt.caseId,
      sourceBindings: {
        promptMaterializationId:
          input.materializationReceipt.materializationId,
        promptMaterializationDigestSha256:
          input.materializationReceipt
            .materializationDigestSha256,
        privatePromptDigestSha256:
          input.materializationReceipt.privatePrompt
            .promptDigestSha256,
        privatePromptLeaseId:
          input.materializationReceipt.privatePrompt.leaseId,
        artifactSetDigestSha256:
          packet.artifactSetDigestSha256,
        artifactPacketDigestSha256:
          packet.artifactPacketDigestSha256,
        outputFrameExpectationDigestSha256:
          packet.outputFrameExpectationDigestSha256,
      },
      operationExpectation: {
        expectedCanonicalToolId: 'comfyui',
        expectedCanonicalOperationId:
          'tool.comfyui.generate_controlled_image.v1',
        sharedWorkerType: 'gpu_ai_worker',
        executionTarget: 'google_cloud_run_gpu',
        runtimeRegion: 'europe-west1',
        accelerator: 'nvidia_l4',
        gpuCount: 1,
        cpuFallbackAllowed: false,
        runtimeDownloadAllowed: false,
        networkFetchAllowed: false,
      },
      requestSummary: {
        privateWireRequestLeaseId: leaseId,
        privateWireRequestDigestSha256,
        serializedWireRequestByteLength,
        promptNodeCount: Object.keys(prompt).length,
        modelArtifactCount,
        inputImageArtifactCount,
        artifactReceipts,
        outputContentType: 'image/png',
        outputWidthPixels: 1024,
        outputHeightPixels: 1024,
        websocketImageOutputRequired: true,
        privateWireRequestIncludedInReceipt: false,
        privatePromptIncludedInReceipt: false,
      },
      costBinding: {
        costComponentId:
          'shared_controlled_illustration_gpu_host',
        sharedGpuCapabilityKeys: [
          'comfyui',
          'comfyui_controlnet_aux',
          'controlnet',
          'ip_adapter',
          'peft_lora',
        ],
        separateCpuQaCapabilityKey: 'auraface',
        oneWireRequestRepresentsOneGpuAttempt: true,
        fiveGpuCapabilitiesShareAttemptLifetime: true,
        auraFaceExcludedFromGpuRequest: true,
        actualWorkerResourceCostEvidenceRequired: true,
        costAmountIncluded: false,
        customerCreditAmountIncluded: false,
        serviceFeeIncluded: false,
        failedOrUnknownAttemptCostMustBeRetained: true,
        exactReuseCreatesNoNewGpuAttempt: true,
        creditsMustRoundOnceAfterBundleAggregation: true,
        customerServiceFeeAppliedOnceDownstream: true,
      },
      openGateCodes:
        LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      materializationReceiptRevalidated: true,
      materializationLeaseConsumedExactlyOnce: true,
      artifactPacketReadThroughProcessBoundPort: true,
      exactArtifactSlotsMatchedMaterialization: true,
      privateWireRequestLeaseCreated: true,
      canonicalToolIdentityRegistered: false,
      canonicalOperationRegistered: false,
      dispatchReady: false,
      gpuAttemptCreated: false,
      gpuResponseAccepted: false,
      actualAttemptCostEvidenceCreated: false,
      selectedSceneCreated: false,
      artifactCreated: false,
      containsPrivatePromptAliasPathUrlCredentialCommandOrBytes:
        false,
      containsPriceCreditServiceFeeReservationWalletOrLedgerData:
        false,
      subjectSpecificRouting: false,
      productionReady: false,
    }
  assertReceiptSafe(draft)
  const receipt:
    LivingFrameControlledSdxlGpuRuntimeRequestReceipt =
    deepFreeze({
      ...draft,
      requestReceiptDigestSha256: digest(draft),
    })
  const lease:
    LivingFrameControlledSdxlPrivateGpuWireRequestLease =
    Object.freeze({
      leaseClass:
        'process_bound_single_use_non_dispatched_comfyui_gpu_wire_request_v1',
      leaseId,
      requestReceiptDigestSha256:
        receipt.requestReceiptDigestSha256,
      callerSerializable: false,
      callerPathAccepted: false,
      callerUrlAccepted: false,
      dispatchAuthority: false,
      workerLeaseAuthority: false,
      runtimeAuthority: false,
      productionReady: false,
    })
  wireRequestLeases.add(lease)
  wireRequests.set(lease, privateWireRequest)
  return Object.freeze({
    receipt,
    privateWireRequestLease: lease,
  })
}

export function consumeLivingFrameControlledSdxlPrivateGpuWireRequestLease(
  lease: LivingFrameControlledSdxlPrivateGpuWireRequestLease,
): LivingFrameControlledSdxlPrivateGpuWireRequest {
  if (
    !wireRequestLeases.has(lease)
    || consumedWireRequestLeases.has(lease)
    || lease.leaseClass
      !==
        'process_bound_single_use_non_dispatched_comfyui_gpu_wire_request_v1'
    || lease.callerSerializable !== false
    || lease.callerPathAccepted !== false
    || lease.callerUrlAccepted !== false
    || lease.dispatchAuthority !== false
    || lease.workerLeaseAuthority !== false
    || lease.runtimeAuthority !== false
    || lease.productionReady !== false
  ) throw invalid('reader_reused', '$.privateWireRequestLease')
  const request = wireRequests.get(lease)
  if (!request) {
    throw invalid('reader_invalid', '$.privateWireRequestLease')
  }
  consumedWireRequestLeases.add(lease)
  wireRequests.delete(lease)
  return request
}

export function verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt(
  value: unknown,
): value is LivingFrameControlledSdxlGpuRuntimeRequestReceipt {
  try {
    const parsed = receiptSchema.safeParse(value)
    if (!parsed.success) return false
    const {
      requestReceiptDigestSha256,
      ...draft
    } = parsed.data
    assertReceiptSafe(draft)
    return digest(draft) === requestReceiptDigestSha256
  } catch {
    return false
  }
}

function assertInput(
  value: unknown,
): asserts value is {
  readonly serverOwnedArtifactLocatorId: string
  readonly reader:
    LivingFrameControlledSdxlGpuRuntimeArtifactReaderPort | null
  readonly materializationReceipt:
    LivingFrameControlledSdxlPrivatePromptMaterialization
  readonly privatePromptLease:
    LivingFrameControlledSdxlPrivatePromptLease
} {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'serverOwnedArtifactLocatorId',
      'reader',
      'materializationReceipt',
      'privatePromptLease',
    ])
    || typeof value.serverOwnedArtifactLocatorId !== 'string'
    || !SAFE_ID.test(value.serverOwnedArtifactLocatorId)
  ) throw invalid('input_invalid', '$')
}

function requireReader(
  reader:
    LivingFrameControlledSdxlGpuRuntimeArtifactReaderPort | null,
): LivingFrameControlledSdxlGpuRuntimeArtifactReaderPort {
  if (
    !reader
    || !readers.has(reader)
    || consumedReaders.has(reader)
    || reader.readerClass
      !==
        'process_bound_server_owned_living_frame_gpu_artifact_reader_v1'
    || reader.sourceAuthority
      !== 'current_private_model_mount_and_input_artifact_repository'
    || reader.callerArtifactPacketAccepted !== false
    || reader.callerArtifactBytesAccepted !== false
    || reader.callerPathUrlOrCredentialAccepted !== false
    || reader.artifactRepositoryAuthority !== false
    || reader.artifactMountAuthority !== false
    || reader.dispatchAuthority !== false
    || reader.actualCostAuthority !== false
    || reader.runtimeAuthority !== false
    || reader.productionReady !== false
  ) throw invalid('reader_invalid', '$.reader')
  return reader
}

function assertMaterializationLineage(
  receipt: LivingFrameControlledSdxlPrivatePromptMaterialization,
  lease: LivingFrameControlledSdxlPrivatePromptLease,
): void {
  if (
    !verifyLivingFrameControlledSdxlPrivatePromptMaterialization(
      receipt,
    )
    || !isRecord(lease)
    || lease.leaseClass
      !== 'process_bound_single_use_comfyui_api_prompt_lease_v1'
    || lease.leaseId !== receipt.privatePrompt.leaseId
    || lease.materializationDigestSha256
      !== receipt.materializationDigestSha256
    || lease.caseId !== receipt.caseId
    || lease.callerSerializable !== false
    || lease.dispatchAuthority !== false
    || lease.runtimeAuthority !== false
    || lease.productionReady !== false
  ) throw invalid(
    'materialization_invalid',
    '$.materializationReceipt',
  )
}

function assertArtifactPacket(
  value: unknown,
  materialization:
    LivingFrameControlledSdxlPrivatePromptMaterialization,
): LivingFrameControlledSdxlGpuRuntimeArtifactPacket {
  const parsed = artifactPacketSchema.safeParse(value)
  if (!parsed.success) {
    throw invalid('artifact_packet_invalid', '$.artifactPacket')
  }
  const {
    artifactPacketDigestSha256,
    ...draft
  } = parsed.data
  if (digest(draft) !== artifactPacketDigestSha256) {
    throw invalid(
      'digest_mismatch',
      '$.artifactPacket.artifactPacketDigestSha256',
    )
  }
  if (
    parsed.data.materializationDigestSha256
      !== materialization.materializationDigestSha256
    || parsed.data.outputFrameExpectationDigestSha256
      !== materialization.sourceBindings
        .outputFrameExpectationDigestSha256
  ) throw invalid(
    'artifact_lineage_invalid',
    '$.artifactPacket',
  )
  const expectedSlots =
    materialization.privatePrompt.slotReceipts.filter((slot) =>
      slot.valueClass !== 'private_conditioning_text')
  if (
    parsed.data.artifacts.length !== expectedSlots.length
    || digest(parsed.data.artifacts)
      !== parsed.data.artifactSetDigestSha256
  ) throw invalid(
    'artifact_slot_set_invalid',
    '$.artifactPacket.artifacts',
  )
  parsed.data.artifacts.forEach((artifact, order) => {
    const expected = expectedSlots[order]
    const expectedClass = MODEL_SLOT_KINDS.has(artifact.slotKind)
      ? 'canonical_model_artifact'
      : IMAGE_SLOT_KINDS.has(artifact.slotKind)
        ? 'private_input_image_artifact'
        : null
    const expectedSuffix =
      expectedClass === 'canonical_model_artifact'
        ? '.safetensors'
        : '.png'
    if (
      !expected
      || artifact.order !== order
      || artifact.slotKind !== expected.slotKind
      || artifact.artifactClass !== expectedClass
      || expectedClass === null
      || digest(artifact.privateAlias)
        !== expected.valueDigestSha256
      || Buffer.byteLength(artifact.privateAlias, 'utf8')
        !== expected.valueByteLength
      || !artifact.privateAlias.endsWith(expectedSuffix)
      || artifact.privateAlias.includes('..')
      || artifact.privateAlias.includes('/')
      || artifact.privateAlias.includes('\\')
      || URL_LIKE.test(artifact.privateAlias)
      || SECRET_LIKE.test(artifact.privateAlias)
  ) throw invalid(
    'private_alias_invalid',
    `$.artifactPacket.artifacts.${order}`,
  )
  })
  return deepFreeze(parsed.data)
}

function assertPromptLineage(
  prompt: LivingFramePrivateComfyUiApiPrompt,
  materialization:
    LivingFrameControlledSdxlPrivatePromptMaterialization,
): void {
  if (
    digest(prompt)
      !== materialization.privatePrompt.promptDigestSha256
    || Object.keys(prompt).length
      !== materialization.privatePrompt.nodeCount
  ) throw invalid(
    'private_prompt_lineage_invalid',
    '$.privatePromptLease',
  )
}

function assertArtifactsAppearExactlyOnce(
  prompt: LivingFramePrivateComfyUiApiPrompt,
  artifacts:
    readonly LivingFrameControlledSdxlGpuRuntimePrivateArtifact[],
): void {
  const strings: string[] = []
  walkValues(prompt, (value) => {
    if (typeof value === 'string') strings.push(value)
  })
  for (const artifact of artifacts) {
    if (
      strings.filter((value) =>
        value === artifact.privateAlias).length !== 1
    ) throw invalid(
      'artifact_slot_set_invalid',
      `$.artifactPacket.artifacts.${artifact.order}`,
    )
  }
}

function compileArtifactReceipts(
  artifacts:
    readonly LivingFrameControlledSdxlGpuRuntimePrivateArtifact[],
): readonly LivingFrameControlledSdxlGpuRuntimeArtifactReceipt[] {
  return deepFreeze(artifacts.map((artifact) => ({
    order: artifact.order,
    slotKind: artifact.slotKind,
    artifactClass: artifact.artifactClass,
    artifactRecordId: artifact.artifactRecordId,
    artifactContentSha256: artifact.artifactContentSha256,
    artifactByteLength: artifact.artifactByteLength,
    artifactSourceBindingDigestSha256:
      artifact.artifactSourceBindingDigestSha256,
    privateAliasDigestSha256: digest(artifact.privateAlias),
    privateAliasIncluded: false,
    artifactBytesIncluded: false,
    pathOrUrlIncluded: false,
    readOnlyMountRequired: true,
  })))
}

function assertReceiptSafe(
  draft:
    LivingFrameControlledSdxlGpuRuntimeRequestReceiptDraft,
): void {
  if (!receiptDraftSchema.safeParse(draft).success) {
    throw invalid('unsafe_receipt_forbidden', '$')
  }
  if (
    canonicalJson(draft.openGateCodes)
      !== canonicalJson(
        LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_OPEN_GATES,
      )
    || canonicalJson(draft.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
    || draft.canonicalToolIdentityRegistered !== false
    || draft.canonicalOperationRegistered !== false
    || draft.dispatchReady !== false
    || draft.gpuAttemptCreated !== false
    || draft.gpuResponseAccepted !== false
    || draft.actualAttemptCostEvidenceCreated !== false
    || draft.selectedSceneCreated !== false
    || draft.artifactCreated !== false
    || draft.productionReady !== false
    || draft.requestSummary.modelArtifactCount
      + draft.requestSummary.inputImageArtifactCount
      !== draft.requestSummary.artifactReceipts.length
    || draft.requestSummary.promptNodeCount < 1
    || draft.containsPrivatePromptAliasPathUrlCredentialCommandOrBytes
      !== false
    || draft.containsPriceCreditServiceFeeReservationWalletOrLedgerData
      !== false
    || draft.subjectSpecificRouting !== false
    || containsUnsafeReceiptKey(draft)
  ) throw invalid('unsafe_receipt_forbidden', '$')
}

function containsUnsafeReceiptKey(value: unknown): boolean {
  const denied = new Set([
    'prompt',
    'privateAlias',
    'artifactBytes',
    'path',
    'url',
    'credential',
    'secret',
    'command',
    'price',
    'credits',
    'serviceFeeAmount',
    'reservation',
    'wallet',
    'ledger',
  ])
  let unsafe = false
  walkEntries(value, (key, child) => {
    if (denied.has(key)) unsafe = true
    if (
      typeof child === 'string'
      && (URL_LIKE.test(child) || SECRET_LIKE.test(child))
    ) unsafe = true
  })
  return unsafe
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  return canonicalJson(actual) === canonicalJson(sortedExpected)
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function walkEntries(
  value: unknown,
  visitor: (key: string, child: unknown) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((child) => walkEntries(child, visitor))
    return
  }
  if (!isRecord(value)) return
  Object.entries(value).forEach(([key, child]) => {
    visitor(key, child)
    walkEntries(child, visitor)
  })
}

function walkValues(
  value: unknown,
  visitor: (value: unknown) => void,
): void {
  visitor(value)
  if (Array.isArray(value)) {
    value.forEach((child) => walkValues(child, visitor))
    return
  }
  if (!isRecord(value)) return
  Object.values(value).forEach((child) =>
    walkValues(child, visitor))
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    Object.values(value).forEach((child) => deepFreeze(child))
  }
  return value
}

function invalid(
  code: LivingFrameControlledSdxlGpuRuntimeProtocolIssueCode,
  path: string,
): LivingFrameControlledSdxlGpuRuntimeProtocolError {
  if (
    !(LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_ISSUES as
      readonly string[]).includes(code)
  ) {
    throw new Error('Unknown Living Frame GPU protocol issue code.')
  }
  return new LivingFrameControlledSdxlGpuRuntimeProtocolError([
    { code, path },
  ])
}
