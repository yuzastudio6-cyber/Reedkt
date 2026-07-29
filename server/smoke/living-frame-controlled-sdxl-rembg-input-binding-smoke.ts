import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  createLivingFrameControlledSdxlRembgInputBinding,
  createLivingFrameControlledSdxlRembgInputConsumer,
  createLivingFrameControlledSdxlRembgPrivateInputReader,
  LivingFrameControlledSdxlRembgInputBindingError,
  verifyLivingFrameControlledSdxlRembgInputBinding,
  type LivingFrameControlledSdxlRembgPrivateInputPacket,
} from '../living-frame/living-frame-controlled-sdxl-rembg-input-binding'
import {
  verifyLivingFrameControlledSdxlGpuOutputObservation,
} from '../living-frame/living-frame-controlled-sdxl-gpu-output-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_VERSION,
  type LivingFrameControlledSdxlGpuOutputObservation,
  type LivingFrameControlledSdxlGpuOutputObservationDraft,
} from '../../src/types/living-frame-controlled-sdxl-gpu-output-observation'
import {
  LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_OPEN_GATES,
} from '../../src/types/living-frame-controlled-sdxl-rembg-input-binding'

const WIDTH = 1024
const HEIGHT = 1024
const PIXEL_COUNT = WIDTH * HEIGHT
const RGBA_BYTES = PIXEL_COUNT * 4
const HASH_A = 'a'.repeat(64)
const HASH_B = 'b'.repeat(64)
const HASH_C = 'c'.repeat(64)
const HASH_D = 'd'.repeat(64)
const HASH_E = 'e'.repeat(64)
const HASH_F = 'f'.repeat(64)

async function main(): Promise<void> {
  const outputPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x4c, 0x46, 0x2d, 0x4f, 0x50, 0x41, 0x51, 0x55, 0x45,
  ])
  const decodedRgba = Buffer.alloc(RGBA_BYTES, 0)
  for (let offset = 3; offset < RGBA_BYTES; offset += 4) {
    decodedRgba[offset] = 255
  }
  const observation = observationFor(outputPng, decodedRgba)
  assert.equal(
    verifyLivingFrameControlledSdxlGpuOutputObservation(observation),
    true,
  )

  let consumed:
    | {
        readonly outputPngSha256: string
        readonly decodedRgbaSha256: string
      }
    | undefined
  const reader = readerFor(observation, outputPng, decodedRgba)
  const consumer =
    createLivingFrameControlledSdxlRembgInputConsumer(
      async (payload) => {
        consumed = {
          outputPngSha256: sha256(payload.outputPng),
          decodedRgbaSha256: sha256(payload.decodedRgba),
        }
        assert.equal(
          payload.verification.sourceVariant,
          'living_frame_generated_opaque_still_png',
        )
        assert.equal(payload.verification.opaqueSourceOnly, true)
      },
    )
  const binding =
    await createLivingFrameControlledSdxlRembgInputBinding({
      gpuOutputObservation: observation,
      inputReader: reader,
      inputConsumer: consumer,
    })
  assert.equal(
    verifyLivingFrameControlledSdxlRembgInputBinding(binding),
    true,
  )
  assert(consumed)
  assert.equal(
    consumed.outputPngSha256,
    observation.verifiedOutput.contentSha256,
  )
  assert.equal(
    consumed.decodedRgbaSha256,
    observation.verifiedOutput.decodedRgbaSha256,
  )
  assert.deepEqual(
    binding.openGateCodes,
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_INPUT_BINDING_OPEN_GATES,
  )
  assert.equal(
    binding.verifiedOpaqueInput.sourceIsFfmpegExtractedFrame,
    false,
  )
  assert.equal(
    binding.downstreamContract
      .existingSourceFrameOnlyAdmissionCannotBeRelabeledEquivalent,
    true,
  )
  assert.equal(
    binding.costLineage.comfyuiGpuAttemptNotChargedAgain,
    true,
  )
  assert.equal(
    binding.costLineage.rembgIsSeparateCanonicalToolAttempt,
    true,
  )
  assert.equal(
    binding.costLineage
      .rembgAttemptCostOwnedByExistingToolCostAuthority,
    true,
  )
  assertAllPromotionAuthoritiesFalse(binding)
  const serialized = JSON.stringify(binding)
  for (const forbidden of [
    '"outputPng"',
    '"decodedRgba"',
    'https://',
    'file://',
    '/tmp/',
    'musashi',
    'hormuz',
    'helicopter',
    '"priceUsd"',
    '"customerCredits"',
    '"serviceFee"',
  ]) {
    assert.equal(serialized.includes(forbidden), false)
  }

  let adversarialAssertions = 0
  await expectIssue(
    () => createLivingFrameControlledSdxlRembgInputBinding({
      gpuOutputObservation: observation,
      inputReader: reader,
      inputConsumer: successConsumer(),
    }),
    'reader_reused',
  )
  adversarialAssertions += 1

  const reusedConsumer = successConsumer()
  await createBinding(
    observation,
    outputPng,
    decodedRgba,
    reusedConsumer,
  )
  await expectIssue(
    () => createBinding(
      observation,
      outputPng,
      decodedRgba,
      reusedConsumer,
    ),
    'consumer_reused',
  )
  adversarialAssertions += 1

  await expectIssue(
    () => createLivingFrameControlledSdxlRembgInputBinding({
      gpuOutputObservation: observation,
      inputReader: {
        ...readerFor(observation, outputPng, decodedRgba),
      },
      inputConsumer: successConsumer(),
    }),
    'reader_invalid',
  )
  adversarialAssertions += 1

  const wrongObservation = observationFor(
    Buffer.from('different opaque source'),
    decodedRgba,
    'lfgpuout_wrong',
  )
  await expectIssue(
    () => createLivingFrameControlledSdxlRembgInputBinding({
      gpuOutputObservation: wrongObservation,
      inputReader: readerFor(observation, outputPng, decodedRgba),
      inputConsumer: successConsumer(),
    }),
    'reader_lineage_invalid',
  )
  adversarialAssertions += 1

  await expectPacketMutation(
    observation,
    outputPng,
    decodedRgba,
    (packet) => {
      packet.gpuOutputObservationDigestSha256 = HASH_F
    },
    'packet_lineage_invalid',
  )
  adversarialAssertions += 1
  await expectPacketMutation(
    observation,
    outputPng,
    decodedRgba,
    (packet) => {
      packet.outputArtifactId = 'lf.output.wrong'
    },
    'packet_lineage_invalid',
  )
  adversarialAssertions += 1
  await expectPacketMutation(
    observation,
    outputPng,
    decodedRgba,
    (packet) => {
      packet.outputPng = Buffer.from('tampered')
    },
    'source_byte_digest_mismatch',
  )
  adversarialAssertions += 1
  await expectPacketMutation(
    observation,
    outputPng,
    decodedRgba,
    (packet) => {
      packet.decodedRgba = Buffer.alloc(16)
    },
    'decoded_rgba_shape_invalid',
  )
  adversarialAssertions += 1
  await expectPacketMutation(
    observation,
    outputPng,
    decodedRgba,
    (packet) => {
      const changed = Buffer.from(packet.decodedRgba)
      changed[0] = 1
      packet.decodedRgba = changed
    },
    'decoded_rgba_digest_mismatch',
  )
  adversarialAssertions += 1
  const nonOpaqueRgba = Buffer.from(decodedRgba)
  nonOpaqueRgba[3] = 254
  const forgedOpaqueObservation = observationFor(
    outputPng,
    nonOpaqueRgba,
    'lfgpuout_forged_opaque_measurement_v1',
  )
  assert.equal(
    verifyLivingFrameControlledSdxlGpuOutputObservation(
      forgedOpaqueObservation,
    ),
    true,
  )
  await expectIssue(
    () => createBinding(
      forgedOpaqueObservation,
      outputPng,
      nonOpaqueRgba,
    ),
    'opaque_alpha_policy_invalid',
  )
  adversarialAssertions += 1

  await expectUnknownPacketKey(
    observation,
    outputPng,
    decodedRgba,
  )
  adversarialAssertions += 1

  await expectIssue(
    () => createLivingFrameControlledSdxlRembgInputBinding({
      gpuOutputObservation: observation,
      inputReader: readerFor(observation, outputPng, decodedRgba),
      inputConsumer:
        createLivingFrameControlledSdxlRembgInputConsumer(
          async () => {
            throw new Error('controlled consumer failure')
          },
        ),
    }),
    'consumer_failed',
  )
  adversarialAssertions += 1

  const digestTamper = {
    ...binding,
    bindingDigestSha256: HASH_A,
  }
  assert.equal(
    verifyLivingFrameControlledSdxlRembgInputBinding(digestTamper),
    false,
  )
  adversarialAssertions += 1

  const authorityPromotion = {
    ...binding,
    authorityBoundary: {
      ...binding.authorityBoundary,
      rembgAdmissionAuthority: true,
    },
  }
  assert.equal(
    verifyLivingFrameControlledSdxlRembgInputBinding(
      authorityPromotion,
    ),
    false,
  )
  adversarialAssertions += 1

  const forgedAllGreen = {
    ...binding,
    genericRembgSourceVariantAdmitted: true,
    rembgRequestCreated: true,
    rembgInferenceExecuted: true,
    maskArtifactCreated: true,
    transparentComponentCreated: true,
    productionReady: true,
  }
  assert.equal(
    verifyLivingFrameControlledSdxlRembgInputBinding(forgedAllGreen),
    false,
  )
  adversarialAssertions += 1

  const extraUnsafeField = {
    ...binding,
    providerUrl: 'https://example.invalid',
  }
  assert.equal(
    verifyLivingFrameControlledSdxlRembgInputBinding(extraUnsafeField),
    false,
  )
  adversarialAssertions += 1

  const reorderedOpenGates = {
    ...binding,
    openGateCodes: [...binding.openGateCodes].reverse(),
  }
  assert.equal(
    verifyLivingFrameControlledSdxlRembgInputBinding(
      reorderedOpenGates,
    ),
    false,
  )
  adversarialAssertions += 1

  assert.equal(adversarialAssertions, 17)
  console.log(
    'Living Frame controlled SDXL rembg input binding smoke passed: '
      + '1 process-bound opaque-input handoff and '
      + `${adversarialAssertions} adversarial assertions.`,
  )
}

function observationFor(
  outputPng: Buffer,
  decodedRgba: Buffer,
  observationId = 'lfgpuout_controlled_fixture_v1',
): LivingFrameControlledSdxlGpuOutputObservation {
  const draft: LivingFrameControlledSdxlGpuOutputObservationDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_CLASS,
    observationId,
    caseId: 'full_combined_primary',
    sourceBindings: {
      requestReceiptId: 'lf.gpu.request.controlled.v1',
      requestReceiptDigestSha256: HASH_A,
      privateWireRequestDigestSha256: HASH_B,
      promptMaterializationDigestSha256: HASH_C,
      artifactSetDigestSha256: HASH_D,
      outputFrameExpectationDigestSha256: HASH_E,
      readerBindingDigestSha256: HASH_F,
    },
    outputReader: {
      evidenceClass: 'controlled_source_fixture',
      oneShotReaderConsumed: true,
      oneShotConsumerConsumed: true,
      verifiedBytesDeliveredOutOfBand: true,
    },
    verifiedOutput: {
      outputArtifactId: 'lf.output.opaque.controlled.v1',
      contentType: 'image/png',
      byteLength: outputPng.byteLength,
      contentSha256: sha256(outputPng),
      decodedRgbaSha256: sha256(decodedRgba),
      widthPixels: 1024,
      heightPixels: 1024,
      decodedChannelCount: 4,
      sourcePngHadAlphaChannel: false,
      transparentPixelCount: 0,
      semiTransparentPixelCount: 0,
      opaquePixelCount: 1_048_576,
      alphaMeasurementReportDigestSha256: HASH_A,
      alphaFindingCodes: ['alpha_channel_fully_opaque'],
      alphaDisposition:
        'opaque_generated_source_requires_segmentation_matting_decontamination_and_alpha_qa',
    },
    costLineage: {
      costComponentId: 'shared_controlled_illustration_gpu_host',
      oneObservedOutputBelongsToOneGpuAttempt: true,
      fiveGpuCapabilitiesShareAttemptLifetime: true,
      auraFaceCpuMeasurementExcluded: true,
      canonicalWorkerResourceCostEvidenceRequired: true,
      completedFailedOrUnknownOutcomeNotInferred: true,
      actualCostAmountIncluded: false,
      customerPriceOrCreditIncluded: false,
      serviceFeeIncluded: false,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_GPU_OUTPUT_OBSERVATION_OPEN_GATES,
    authorityBoundary: {
      privateOutputRereadAuthority: true,
      requestAuthority: false,
      operationAuthority: false,
      dispatchAuthority: false,
      workerCompletionAuthority: false,
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
      artifactCommitAuthority: false,
      segmentationOrMattingAuthority: false,
      alphaQaAuthority: false,
      continuityQaAuthority: false,
      documentarySafetyQaAuthority: false,
      renderAuthority: false,
      runtimeAuthority: false,
      productionAuthority: false,
    },
    requestReceiptRevalidated: true,
    exactRequestAndOutputLineageMatched: true,
    exactPrivateOutputBytesRereadAndDecoded: true,
    alphaMeasurementRecomputedFromDecodedBytes: true,
    outputIsOpaqueSourceOnly: true,
    transparentComponentCreated: false,
    artifactCommitted: false,
    actualAttemptCostEvidenceVerified: false,
    selectedSceneCreated: false,
    containsOutputBytesPathUrlCredentialPromptAliasOrCommand: false,
    containsPriceCreditServiceFeeReservationWalletOrLedgerData: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return {
    ...draft,
    observationDigestSha256: digest(draft),
  }
}

function readerFor(
  observation: LivingFrameControlledSdxlGpuOutputObservation,
  outputPng: Buffer,
  decodedRgba: Buffer,
  mutate?: (
    packet: Mutable<
      LivingFrameControlledSdxlRembgPrivateInputPacket
    >,
  ) => void,
) {
  return createLivingFrameControlledSdxlRembgPrivateInputReader({
    gpuOutputObservation: observation,
    readServerOwnedOpaqueOutput: async () => {
      const packet:
        Mutable<
          LivingFrameControlledSdxlRembgPrivateInputPacket
        > = {
          packetClass:
            'server_owned_living_frame_opaque_output_for_rembg_v1',
          evidenceClass: observation.outputReader.evidenceClass,
          gpuOutputObservationId: observation.observationId,
          gpuOutputObservationDigestSha256:
            observation.observationDigestSha256,
          outputArtifactId:
            observation.verifiedOutput.outputArtifactId,
          outputContentType: 'image/png',
          outputByteLength: outputPng.byteLength,
          outputContentSha256:
            observation.verifiedOutput.contentSha256,
          decodedRgbaSha256:
            observation.verifiedOutput.decodedRgbaSha256,
          outputPng: Buffer.from(outputPng),
          decodedRgba: Buffer.from(decodedRgba),
          callerBytesPathUrlOrCredentialAccepted: false,
          genericRembgSourceVariantAuthority: false,
          rembgAdmissionAuthority: false,
          actualCostAuthority: false,
          productionReady: false,
        }
      mutate?.(packet)
      return packet
    },
  })
}

function successConsumer() {
  return createLivingFrameControlledSdxlRembgInputConsumer(
    async () => undefined,
  )
}

async function createBinding(
  observation: LivingFrameControlledSdxlGpuOutputObservation,
  outputPng: Buffer,
  decodedRgba: Buffer,
  inputConsumer = successConsumer(),
) {
  return createLivingFrameControlledSdxlRembgInputBinding({
    gpuOutputObservation: observation,
    inputReader: readerFor(observation, outputPng, decodedRgba),
    inputConsumer,
  })
}

async function expectPacketMutation(
  observation: LivingFrameControlledSdxlGpuOutputObservation,
  outputPng: Buffer,
  decodedRgba: Buffer,
  mutate: (
    packet: Mutable<
      LivingFrameControlledSdxlRembgPrivateInputPacket
    >,
  ) => void,
  expectedCode:
    LivingFrameControlledSdxlRembgInputBindingError[
      'issues'
    ][number]['code'],
): Promise<void> {
  await expectIssue(
    () => createLivingFrameControlledSdxlRembgInputBinding({
      gpuOutputObservation: observation,
      inputReader: readerFor(
        observation,
        outputPng,
        decodedRgba,
        mutate,
      ),
      inputConsumer: successConsumer(),
    }),
    expectedCode,
  )
}

async function expectUnknownPacketKey(
  observation: LivingFrameControlledSdxlGpuOutputObservation,
  outputPng: Buffer,
  decodedRgba: Buffer,
): Promise<void> {
  const reader =
    createLivingFrameControlledSdxlRembgPrivateInputReader({
      gpuOutputObservation: observation,
      readServerOwnedOpaqueOutput: async () => ({
        ...basePacket(observation, outputPng, decodedRgba),
        path: '/private/forbidden',
      }) as unknown as
        LivingFrameControlledSdxlRembgPrivateInputPacket,
    })
  await expectIssue(
    () => createLivingFrameControlledSdxlRembgInputBinding({
      gpuOutputObservation: observation,
      inputReader: reader,
      inputConsumer: successConsumer(),
    }),
    'packet_invalid',
  )
}

function basePacket(
  observation: LivingFrameControlledSdxlGpuOutputObservation,
  outputPng: Buffer,
  decodedRgba: Buffer,
): LivingFrameControlledSdxlRembgPrivateInputPacket {
  return {
    packetClass:
      'server_owned_living_frame_opaque_output_for_rembg_v1',
    evidenceClass: observation.outputReader.evidenceClass,
    gpuOutputObservationId: observation.observationId,
    gpuOutputObservationDigestSha256:
      observation.observationDigestSha256,
    outputArtifactId: observation.verifiedOutput.outputArtifactId,
    outputContentType: 'image/png',
    outputByteLength: outputPng.byteLength,
    outputContentSha256: observation.verifiedOutput.contentSha256,
    decodedRgbaSha256:
      observation.verifiedOutput.decodedRgbaSha256,
    outputPng: Buffer.from(outputPng),
    decodedRgba: Buffer.from(decodedRgba),
    callerBytesPathUrlOrCredentialAccepted: false,
    genericRembgSourceVariantAuthority: false,
    rembgAdmissionAuthority: false,
    actualCostAuthority: false,
    productionReady: false,
  }
}

async function expectIssue(
  action: () => Promise<unknown>,
  expectedCode:
    LivingFrameControlledSdxlRembgInputBindingError[
      'issues'
    ][number]['code'],
): Promise<void> {
  await assert.rejects(
    action,
    (error: unknown) => {
      assert(
        error instanceof
          LivingFrameControlledSdxlRembgInputBindingError,
      )
      assert.equal(error.issues[0]?.code, expectedCode)
      return true
    },
  )
}

function assertAllPromotionAuthoritiesFalse(
  binding: Awaited<
    ReturnType<
      typeof createLivingFrameControlledSdxlRembgInputBinding
    >
  >,
): void {
  const authority = binding.authorityBoundary
  assert.equal(authority.privateOpaqueInputRereadAuthority, true)
  for (const [key, value] of Object.entries(authority)) {
    if (key === 'privateOpaqueInputRereadAuthority') continue
    assert.equal(value, false, `${key} must remain false`)
  }
  assert.equal(binding.genericRembgSourceVariantAdmitted, false)
  assert.equal(binding.rembgRequestCreated, false)
  assert.equal(binding.rembgInferenceExecuted, false)
  assert.equal(binding.maskArtifactCreated, false)
  assert.equal(binding.transparentComponentCreated, false)
  assert.equal(binding.productionReady, false)
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (
    value !== null
    && typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
