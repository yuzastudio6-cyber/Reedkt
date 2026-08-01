import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'

import {
  createLivingFrameControlledSdxlGpuPrivateOutputReader,
  createLivingFrameControlledSdxlGpuVerifiedOutputConsumer,
  LivingFrameControlledSdxlGpuOutputObservationError,
  observeLivingFrameControlledSdxlGpuPrivateOutput,
  verifyLivingFrameControlledSdxlGpuOutputObservation,
  type LivingFrameControlledSdxlGpuPrivateOutputPacket,
} from '../living-frame/living-frame-controlled-sdxl-gpu-output-observation'
import {
  verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt,
} from '../living-frame/living-frame-controlled-sdxl-gpu-runtime-protocol'
import {
  LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_VERSION,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_REQUEST_RECEIPT_CLASS,
  type LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
  type LivingFrameControlledSdxlGpuRuntimeRequestReceiptDraft,
} from '../../src/types/living-frame-controlled-sdxl-gpu-runtime-protocol'

const WIDTH = 1024
const HEIGHT = 1024
const HASH_A = 'a'.repeat(64)
const HASH_B = 'b'.repeat(64)
const HASH_C = 'c'.repeat(64)
const HASH_D = 'd'.repeat(64)
const HASH_E = 'e'.repeat(64)
const HASH_F = 'f'.repeat(64)

async function main(): Promise<void> {
  const request = requestReceipt()
  assert.equal(
    verifyLivingFrameControlledSdxlGpuRuntimeRequestReceipt(
      request,
    ),
    true,
  )
  const opaquePng = await createOpaquePng(WIDTH, HEIGHT)
  let delivered:
    | {
        outputPng: Buffer
        decodedRgba: Buffer
      }
    | undefined
  const reader = readerFor(request, opaquePng)
  const consumer =
    createLivingFrameControlledSdxlGpuVerifiedOutputConsumer(
      async (payload) => {
        delivered = {
          outputPng: Buffer.from(payload.outputPng),
          decodedRgba: Buffer.from(payload.decodedRgba),
        }
        assert.equal(
          payload.verification.requestReceiptDigestSha256,
          request.requestReceiptDigestSha256,
        )
        assert.equal(payload.verification.opaqueSourceOnly, true)
      },
    )
  const observation =
    await observeLivingFrameControlledSdxlGpuPrivateOutput({
      requestReceipt: request,
      outputReader: reader,
      outputConsumer: consumer,
    })
  assert.equal(
    verifyLivingFrameControlledSdxlGpuOutputObservation(
      observation,
    ),
    true,
  )
  assert(delivered)
  assert.equal(delivered.outputPng.byteLength, opaquePng.byteLength)
  assert.equal(delivered.decodedRgba.byteLength, WIDTH * HEIGHT * 4)
  assert.equal(
    observation.verifiedOutput.sourcePngHadAlphaChannel,
    false,
  )
  assert.equal(observation.verifiedOutput.transparentPixelCount, 0)
  assert.equal(
    observation.verifiedOutput.semiTransparentPixelCount,
    0,
  )
  assert.equal(
    observation.verifiedOutput.opaquePixelCount,
    WIDTH * HEIGHT,
  )
  assert(
    observation.verifiedOutput.alphaFindingCodes.includes(
      'alpha_channel_fully_opaque',
    ),
  )
  assert.equal(observation.outputIsOpaqueSourceOnly, true)
  assert.equal(observation.transparentComponentCreated, false)
  assert.equal(observation.artifactCommitted, false)
  assert.equal(observation.actualAttemptCostEvidenceVerified, false)
  assert.equal(
    observation.costLineage.oneObservedOutputBelongsToOneGpuAttempt,
    true,
  )
  assert.equal(
    observation.costLineage
      .fiveGpuCapabilitiesShareAttemptLifetime,
    true,
  )
  assert.equal(
    observation.costLineage.auraFaceCpuMeasurementExcluded,
    true,
  )
  const serialized = JSON.stringify(observation)
  for (const forbidden of [
    '"outputPng":',
    '"decodedRgba":',
    'https://',
    'file://',
    '/tmp/',
    'musashi',
    'hormuz',
    'helicopter',
  ]) {
    assert.equal(serialized.includes(forbidden), false)
  }

  let adversarialAssertions = 0
  await expectIssue(
    () => observeLivingFrameControlledSdxlGpuPrivateOutput({
      requestReceipt: request,
      outputReader: reader,
      outputConsumer:
        createLivingFrameControlledSdxlGpuVerifiedOutputConsumer(
          async () => undefined,
        ),
    }),
    'reader_reused',
  )
  adversarialAssertions += 1

  const reusedConsumer =
    createLivingFrameControlledSdxlGpuVerifiedOutputConsumer(
      async () => undefined,
    )
  await observeLivingFrameControlledSdxlGpuPrivateOutput({
    requestReceipt: request,
    outputReader: readerFor(request, opaquePng),
    outputConsumer: reusedConsumer,
  })
  await expectIssue(
    () => observeLivingFrameControlledSdxlGpuPrivateOutput({
      requestReceipt: request,
      outputReader: readerFor(request, opaquePng),
      outputConsumer: reusedConsumer,
    }),
    'consumer_reused',
  )
  adversarialAssertions += 1

  const forgedReader = {
    ...readerFor(request, opaquePng),
  }
  await expectIssue(
    () => observeLivingFrameControlledSdxlGpuPrivateOutput({
      requestReceipt: request,
      outputReader: forgedReader,
      outputConsumer: consumerForSuccess(),
    }),
    'reader_invalid',
  )
  adversarialAssertions += 1

  const otherRequest =
    requestReceipt('lf.gpu.request.other.v1')
  await expectIssue(
    () => observeLivingFrameControlledSdxlGpuPrivateOutput({
      requestReceipt: otherRequest,
      outputReader: readerFor(request, opaquePng),
      outputConsumer: consumerForSuccess(),
    }),
    'reader_lineage_invalid',
  )
  adversarialAssertions += 1

  await expectPacketMutation(
    request,
    opaquePng,
    (packet) => {
      packet.requestReceiptId = 'lf.gpu.request.wrong.v1'
    },
    'output_lineage_invalid',
  )
  adversarialAssertions += 1
  await expectPacketMutation(
    request,
    opaquePng,
    (packet) => {
      packet.requestReceiptDigestSha256 = HASH_F
    },
    'output_lineage_invalid',
  )
  adversarialAssertions += 1
  await expectPacketMutation(
    request,
    opaquePng,
    (packet) => {
      packet.privateWireRequestDigestSha256 = HASH_E
    },
    'output_lineage_invalid',
  )
  adversarialAssertions += 1
  await expectPacketMutation(
    request,
    opaquePng,
    (packet) => {
      packet.outputContentSha256 = HASH_F
    },
    'output_digest_mismatch',
  )
  adversarialAssertions += 1
  await expectPacketMutation(
    request,
    opaquePng,
    (packet) => {
      packet.outputByteLength += 1
    },
    'output_digest_mismatch',
  )
  adversarialAssertions += 1

  const invalidPng = Buffer.from('not-a-png', 'utf8')
  await expectIssue(
    () => observeWithOutput(request, invalidPng),
    'output_format_invalid',
  )
  adversarialAssertions += 1

  const wrongSizePng = await createOpaquePng(512, 512)
  await expectIssue(
    () => observeWithOutput(request, wrongSizePng),
    'output_dimension_invalid',
  )
  adversarialAssertions += 1

  const alphaPng = await createAlphaPng(WIDTH, HEIGHT)
  await expectIssue(
    () => observeWithOutput(request, alphaPng),
    'output_alpha_policy_invalid',
  )
  adversarialAssertions += 1

  await expectUnknownPacketKey(request, opaquePng)
  adversarialAssertions += 1

  await expectIssue(
    () => observeLivingFrameControlledSdxlGpuPrivateOutput({
      requestReceipt: request,
      outputReader: null as unknown as ReturnType<
        typeof createLivingFrameControlledSdxlGpuPrivateOutputReader
      >,
      outputConsumer: consumerForSuccess(),
    }),
    'reader_invalid',
  )
  adversarialAssertions += 1

  await expectIssue(
    () => observeLivingFrameControlledSdxlGpuPrivateOutput({
      requestReceipt: request,
      outputReader: readerFor(request, opaquePng),
      outputConsumer:
        createLivingFrameControlledSdxlGpuVerifiedOutputConsumer(
          async () => {
            throw new Error('controlled consumer failure')
          },
        ),
    }),
    'consumer_failed',
  )
  adversarialAssertions += 1

  const digestTamper = structuredClone(observation)
  ;(digestTamper as {
    observationDigestSha256: string
  }).observationDigestSha256 = HASH_F
  assert.equal(
    verifyLivingFrameControlledSdxlGpuOutputObservation(
      digestTamper,
    ),
    false,
  )
  adversarialAssertions += 1

  const promoted = structuredClone(observation)
  ;(promoted as {
    transparentComponentCreated: boolean
    artifactCommitted: boolean
    productionReady: boolean
  }).transparentComponentCreated = true
  ;(promoted as { artifactCommitted: boolean })
    .artifactCommitted = true
  ;(promoted as { productionReady: boolean })
    .productionReady = true
  assert.equal(
    verifyLivingFrameControlledSdxlGpuOutputObservation(
      promoted,
    ),
    false,
  )
  adversarialAssertions += 1

  const outputLeak = structuredClone(observation) as unknown as
    Record<string, unknown>
  outputLeak.outputPng = 'forbidden'
  assert.equal(
    verifyLivingFrameControlledSdxlGpuOutputObservation(
      outputLeak,
    ),
    false,
  )
  adversarialAssertions += 1

  const costInjection = structuredClone(observation) as unknown as
    Record<string, unknown>
  costInjection.actualCostMicros = 123
  assert.equal(
    verifyLivingFrameControlledSdxlGpuOutputObservation(
      costInjection,
    ),
    false,
  )
  adversarialAssertions += 1

  const alphaPromotion = structuredClone(observation)
  ;(alphaPromotion as {
    verifiedOutput: {
      alphaDisposition: string
    }
  }).verifiedOutput.alphaDisposition =
    'transparent_component_ready'
  assert.equal(
    verifyLivingFrameControlledSdxlGpuOutputObservation(
      alphaPromotion,
    ),
    false,
  )
  adversarialAssertions += 1

  assert.equal(adversarialAssertions, 20)
  process.stdout.write(JSON.stringify({
    status: 'passed',
    controlledFixtures: 1,
    adversarialAssertions,
    outputByteLength:
      observation.verifiedOutput.byteLength,
    outputWidthPixels:
      observation.verifiedOutput.widthPixels,
    outputHeightPixels:
      observation.verifiedOutput.heightPixels,
    sourcePngHadAlphaChannel: false,
    outputIsOpaqueSourceOnly: true,
    transparentComponentCreated: false,
    segmentationOrMattingStillRequired: true,
    alphaEdgeDecontaminationStillRequired: true,
    multiBackgroundAndDestinationQaStillRequired: true,
    sharedGpuAttemptCountPerOutput: 1,
    actualAttemptCostEvidenceVerified: false,
    productionReady: false,
  }, null, 2))
  process.stdout.write('\n')
}

function requestReceipt(
  requestReceiptId = 'lf.gpu.request.fixture.v1',
): LivingFrameControlledSdxlGpuRuntimeRequestReceipt {
  const draft:
    LivingFrameControlledSdxlGpuRuntimeRequestReceiptDraft = {
      contractVersion:
        LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_REQUEST_RECEIPT_CLASS,
      requestReceiptId,
      serverOwnedArtifactLocatorId:
        'lf.gpu.artifacts.fixture.v1',
      caseId: 'full_combined_primary',
      sourceBindings: {
        promptMaterializationId:
          'lf.prompt.materialization.fixture.v1',
        promptMaterializationDigestSha256: HASH_A,
        privatePromptDigestSha256: HASH_B,
        privatePromptLeaseId:
          'lf.prompt.lease.fixture.v1',
        artifactSetDigestSha256: HASH_C,
        artifactPacketDigestSha256: HASH_D,
        outputFrameExpectationDigestSha256: HASH_E,
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
        privateWireRequestLeaseId:
          'lf.gpu.wire-lease.fixture.v1',
        privateWireRequestDigestSha256: HASH_F,
        serializedWireRequestByteLength: 8192,
        promptNodeCount: 15,
        modelArtifactCount: 5,
        inputImageArtifactCount: 2,
        artifactReceipts: [
          artifactReceipt(0, 'base_checkpoint_artifact'),
          artifactReceipt(1, 'controlnet_checkpoint_artifact'),
          artifactReceipt(2, 'lora_adapter_artifact'),
          artifactReceipt(
            3,
            'generic_ipadapter_checkpoint_artifact',
          ),
          artifactReceipt(4, 'clip_vision_checkpoint_artifact'),
          artifactReceipt(5, 'control_image_artifact'),
          artifactReceipt(6, 'reference_image_artifact'),
        ],
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
      authorityBoundary: {
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
      },
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
  return {
    ...draft,
    requestReceiptDigestSha256: digest(draft),
  }
}

function artifactReceipt(
  order: number,
  slotKind:
    LivingFrameControlledSdxlGpuRuntimeRequestReceipt[
      'requestSummary'
    ]['artifactReceipts'][number]['slotKind'],
) {
  const model = !slotKind.includes('image_artifact')
  return {
    order,
    slotKind,
    artifactClass: model
      ? 'canonical_model_artifact' as const
      : 'private_input_image_artifact' as const,
    artifactRecordId: `artifact.${slotKind}.fixture.v1`,
    artifactContentSha256: digest(`content:${slotKind}`),
    artifactByteLength: model
      ? 1_000_000_000 + order
      : 50_000 + order,
    artifactSourceBindingDigestSha256:
      digest(`source:${slotKind}`),
    privateAliasDigestSha256:
      digest(`alias:${slotKind}`),
    privateAliasIncluded: false as const,
    artifactBytesIncluded: false as const,
    pathOrUrlIncluded: false as const,
    readOnlyMountRequired: true as const,
  }
}

function readerFor(
  request:
    LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
  outputPng: Buffer,
) {
  return createLivingFrameControlledSdxlGpuPrivateOutputReader({
    requestReceipt: request,
    evidenceClass: 'controlled_source_fixture',
    readServerOwnedOutput: async () =>
      packetFor(request, outputPng),
  })
}

function packetFor(
  request:
    LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
  outputPng: Buffer,
): LivingFrameControlledSdxlGpuPrivateOutputPacket {
  return {
    packetClass:
      'server_owned_controlled_comfyui_png_output_packet_v1',
    evidenceClass: 'controlled_source_fixture',
    requestReceiptId: request.requestReceiptId,
    requestReceiptDigestSha256:
      request.requestReceiptDigestSha256,
    privateWireRequestDigestSha256:
      request.requestSummary.privateWireRequestDigestSha256,
    outputArtifactId: 'lf.gpu.output.fixture.v1',
    outputContentType: 'image/png',
    outputByteLength: outputPng.byteLength,
    outputContentSha256: digestBytes(outputPng),
    outputPng: Buffer.from(outputPng),
    callerBytesPathUrlOrCredentialAccepted: false,
    workerCompletionAuthority: false,
    actualCostAuthority: false,
    productionReady: false,
  }
}

function consumerForSuccess() {
  return createLivingFrameControlledSdxlGpuVerifiedOutputConsumer(
    async () => undefined,
  )
}

async function observeWithOutput(
  request:
    LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
  outputPng: Buffer,
) {
  return observeLivingFrameControlledSdxlGpuPrivateOutput({
    requestReceipt: request,
    outputReader: readerFor(request, outputPng),
    outputConsumer: consumerForSuccess(),
  })
}

type MutablePacket = {
  -readonly [Key in keyof
    LivingFrameControlledSdxlGpuPrivateOutputPacket]:
      LivingFrameControlledSdxlGpuPrivateOutputPacket[Key]
}

async function expectPacketMutation(
  request:
    LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
  outputPng: Buffer,
  mutate: (packet: MutablePacket) => void,
  expectedCode: string,
): Promise<void> {
  const packet = packetFor(request, outputPng) as MutablePacket
  mutate(packet)
  await expectIssue(
    () => observeLivingFrameControlledSdxlGpuPrivateOutput({
      requestReceipt: request,
      outputReader:
        createLivingFrameControlledSdxlGpuPrivateOutputReader({
          requestReceipt: request,
          evidenceClass: 'controlled_source_fixture',
          readServerOwnedOutput: async () => packet,
        }),
      outputConsumer: consumerForSuccess(),
    }),
    expectedCode,
  )
}

async function expectUnknownPacketKey(
  request:
    LivingFrameControlledSdxlGpuRuntimeRequestReceipt,
  outputPng: Buffer,
): Promise<void> {
  const packet = packetFor(
    request,
    outputPng,
  ) as unknown as Record<string, unknown>
  packet.providerId = 'forbidden-provider'
  await expectIssue(
    () => observeLivingFrameControlledSdxlGpuPrivateOutput({
      requestReceipt: request,
      outputReader:
        createLivingFrameControlledSdxlGpuPrivateOutputReader({
          requestReceipt: request,
          evidenceClass: 'controlled_source_fixture',
          readServerOwnedOutput: async () =>
            packet as unknown as
              LivingFrameControlledSdxlGpuPrivateOutputPacket,
        }),
      outputConsumer: consumerForSuccess(),
    }),
    'output_packet_invalid',
  )
}

function createOpaquePng(
  width: number,
  height: number,
): Buffer {
  const rgb = Buffer.alloc(width * height * 3)
  for (let offset = 0; offset < rgb.length; offset += 3) {
    const pixel = offset / 3
    rgb[offset] = pixel % 251
    rgb[offset + 1] = (pixel * 3) % 253
    rgb[offset + 2] = (pixel * 7) % 255
  }
  return encodePng(width, height, 2, rgb, 3)
}

function createAlphaPng(
  width: number,
  height: number,
): Buffer {
  const rgba = Buffer.alloc(width * height * 4)
  for (let offset = 0; offset < rgba.length; offset += 4) {
    rgba[offset] = 120
    rgba[offset + 1] = 70
    rgba[offset + 2] = 180
    rgba[offset + 3] = offset % 8 === 0 ? 128 : 255
  }
  return encodePng(width, height, 6, rgba, 4)
}

function encodePng(
  width: number,
  height: number,
  colorType: 2 | 6,
  pixels: Buffer,
  channels: 3 | 4,
): Buffer {
  assert.equal(pixels.byteLength, width * height * channels)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = colorType
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const rowByteLength = width * channels
  const raw = Buffer.alloc((rowByteLength + 1) * height)
  for (let row = 0; row < height; row += 1) {
    const rowOffset = row * (rowByteLength + 1)
    raw[rowOffset] = 0
    pixels.copy(
      raw,
      rowOffset + 1,
      row * rowByteLength,
      (row + 1) * rowByteLength,
    )
  }
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, 'ascii')
  const chunk = Buffer.alloc(12 + data.byteLength)
  chunk.writeUInt32BE(data.byteLength, 0)
  typeBytes.copy(chunk, 4)
  data.copy(chunk, 8)
  chunk.writeUInt32BE(
    pngCrc32(Buffer.concat([typeBytes, data])),
    8 + data.byteLength,
  )
  return chunk
}

const PNG_CRC32_TABLE = Uint32Array.from(
  { length: 256 },
  (_, index) => {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1
        ? 0xedb88320 ^ (value >>> 1)
        : value >>> 1
    }
    return value >>> 0
  },
)

function pngCrc32(bytes: Buffer): number {
  let value = 0xffffffff
  for (const byte of bytes) {
    value = PNG_CRC32_TABLE[(value ^ byte) & 0xff]! ^ (value >>> 8)
  }
  return (value ^ 0xffffffff) >>> 0
}

async function expectIssue(
  action: () => Promise<unknown>,
  expectedCode: string,
): Promise<void> {
  let thrown: unknown
  try {
    await action()
  } catch (error) {
    thrown = error
  }
  assert(
    thrown instanceof
      LivingFrameControlledSdxlGpuOutputObservationError,
  )
  assert.equal(thrown.issues[0]?.code, expectedCode)
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function digestBytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (
    value !== null
    && typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) =>
          left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

await main()
