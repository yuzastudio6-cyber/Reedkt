import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'

import type {
  CanonicalLivingFrameControlledIllustrationGenerationWorkItem,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import type {
  LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-operation-request'
import type {
  LivingFrameControlledImageSelectedSceneVerifiedOpaqueOutput,
} from '../living-frame/living-frame-controlled-image-selected-scene-private-output-observation'
import {
  compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation,
} from '../living-frame/living-frame-controlled-image-selected-scene-alpha-work-chain-reconciliation'
import {
  LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffError,
  compileLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff,
  consumeLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceLease,
  createLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader,
  type CreateLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffInput,
  type LivingFrameControlledImageSelectedSceneExactOutputAlphaSourcePacket,
  verifyLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff,
} from '../living-frame/living-frame-controlled-image-selected-scene-exact-output-alpha-source-handoff'
import {
  createLivingFrameControlledImageSelectedScenePrivateOutputReader,
  createLivingFrameControlledImageSelectedSceneVerifiedOutputConsumer,
  observeLivingFrameControlledImageSelectedScenePrivateOutput,
  type LivingFrameControlledImageSelectedScenePrivateOutputPacket,
} from '../living-frame/living-frame-controlled-image-selected-scene-private-output-observation'
import {
  createLivingFrameControlledImageSelectedScenePrivateOperationRequestSmokeFixture,
} from './fixtures/living-frame-controlled-image-selected-scene-private-operation-request-fixture'
import {
  livingFrameControlledImageSelectedSceneSmokeInput,
  livingFrameControlledImageSelectedSceneSmokeRequest,
} from './living-frame-controlled-image-selected-scene-request-smoke'

const PNG_CRC32_TABLE = Array.from(
  { length: 256 },
  (_, index) => {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value =
        (value & 1) !== 0
          ? 0xedb88320 ^ (value >>> 1)
          : value >>> 1
    }
    return value >>> 0
  },
)

const isolatedFixture =
  await createLivingFrameControlledImageSelectedScenePrivateOperationRequestSmokeFixture(
    'isolated',
  )
const outputPng = createOpaqueRgbPng(1_024, 1_024)
const {
  observation,
  delivered,
} = await observe(isolatedFixture.receipt, outputPng)
const reconciliationInput = {
  selectedSceneRequest:
    livingFrameControlledImageSelectedSceneSmokeRequest,
  selectedSceneRequestInput:
    livingFrameControlledImageSelectedSceneSmokeInput,
  privateOutputObservation: observation,
  canonicalWorkGraphProjection:
    livingFrameControlledImageSelectedSceneSmokeInput
      .workGraphProjection,
} as const
const reconciliation =
  compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation(
    reconciliationInput,
  )
const sourceReader = sourceReaderFor({
  observation,
  reconciliation,
  receipt: isolatedFixture.receipt,
  delivered,
})
const input:
  CreateLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffInput =
  {
    ...reconciliationInput,
    alphaWorkChainReconciliation: reconciliation,
    sourceReader,
  }
const result =
  await compileLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff(
    input,
  )

assert.equal(
  verifyLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff(
    result.receipt,
    input,
  ),
  true,
)
assert.equal(
  result.receipt.handoffState,
  'exact_isolated_output_source_lease_created_canonical_alpha_work_admission_blocked',
)
assert.equal(
  result.receipt.exactSourceSelector.parentExpectedOutputCount,
  2,
)
assert.equal(
  result.receipt.exactSourceSelector.outputKey,
  isolatedFixture.receipt.exactOutputLineage.outputKey,
)
assert.equal(
  result.receipt.exactSourceSelector.generatedAssetIntentId,
  reconciliation.exactOutputLineage.generatedAssetIntentId,
)
assert.equal(
  result.receipt.knownCanonicalConflict
    .parentGenerationHasMultipleExpectedOutputs,
  true,
)
assert.equal(
  result.receipt.canonicalOwnerHandoff
    .canonicalOwnerMustSelectExactParentOutput,
  true,
)
assert.equal(
  result.receipt.canonicalOwnerHandoff
    .requiredRembgOperationId,
  'tool.rembg.remove_image_background.v1',
)
assert.equal(
  result.receipt.canonicalOwnerHandoff
    .requiredSharpOperationId,
  'tool.sharp.prepare_approved_image_asset.v1',
)
assert.equal(
  result.receipt.registryPolicy.registryExpansionPermitted,
  true,
)
assert.equal(
  result.receipt.fixedRuntimeLineage
    .exactModelArtifactByteLength,
  11_700_367_157,
)
assert.deepEqual(
  result.receipt.fixedRuntimeLineage.deniedTopLevelImports,
  ['sam2'],
)
assert.equal(result.receipt.canonicalWorkGraphMutated, false)
assert.equal(result.receipt.rembgRequestCreated, false)
assert.equal(result.receipt.rembgInferenceExecuted, false)
assert.equal(result.receipt.sharpRequestCreated, false)
assert.equal(result.receipt.maskArtifactCreated, false)
assert.equal(result.receipt.transparentComponentCreated, false)
assert.equal(result.receipt.assetManifestMutated, false)
assert.equal(result.receipt.qaApproved, false)
assert.equal(result.receipt.privateReviewApproved, false)
assert.equal(result.receipt.renderAuthorized, false)
assert.equal(result.receipt.finalCanvasCreatedByComfyUi, false)
assert.equal(result.receipt.productionReady, false)

const privateSource =
  consumeLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceLease(
    result.privateSourceLease,
  )
assert.deepEqual(privateSource.outputPng, outputPng)
assert.deepEqual(privateSource.decodedRgba, delivered.decodedRgba)
assert.equal(
  privateSource.exactSourceSelector.outputKey,
  result.receipt.exactSourceSelector.outputKey,
)
assert.equal(privateSource.dispatchAuthority, false)
assert.equal(privateSource.artifactPersistenceAuthority, false)
assert.equal(privateSource.productionReady, false)
assert.throws(
  () =>
    consumeLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceLease(
      result.privateSourceLease,
    ),
  (error: unknown) => {
    assert(
      error instanceof
        LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffError,
    )
    assert.equal(error.issues[0]?.code, 'lease_reused')
    return true
  },
)

const serialized = JSON.stringify(result.receipt)
for (const forbidden of [
  '"outputPng":',
  '"decodedRgba":',
  '"bytes":',
  '"path":',
  '"url":',
  '"prompt":',
  '"seed":',
  '"modelAlias":',
  '"command":',
  '"environment":',
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

await expectCompileIssue(
  {
    ...input,
    sourceReader,
  },
  'source_reader_reused',
)
adversarialAssertions += 1

await expectCompileIssue(
  {
    ...input,
    sourceReader: {
      ...sourceReaderFor({
        observation,
        reconciliation,
        receipt: isolatedFixture.receipt,
        delivered,
      }),
    },
  },
  'source_reader_invalid',
)
adversarialAssertions += 1

for (const [code, mutate] of [
  [
    'source_packet_lineage_invalid',
    (packet: MutableSourcePacket) => {
      packet.sceneId = 'scene-cross-substituted'
    },
  ],
  [
    'source_packet_lineage_invalid',
    (packet: MutableSourcePacket) => {
      packet.outputKey = 'output.cross-substituted'
    },
  ],
  [
    'source_packet_lineage_invalid',
    (packet: MutableSourcePacket) => {
      packet.approvedWorkItemId = 'work-cross-substituted'
    },
  ],
  [
    'source_packet_lineage_invalid',
    (packet: MutableSourcePacket) => {
      packet.parentExpectedOutputIndex += 1
    },
  ],
  [
    'source_packet_lineage_invalid',
    (packet: MutableSourcePacket) => {
      packet.generatedAssetIntentId =
        'asset-intent.cross-substituted'
    },
  ],
  [
    'source_packet_lineage_invalid',
    (packet: MutableSourcePacket) => {
      packet.outputContentSha256 = 'd'.repeat(64)
    },
  ],
  [
    'source_packet_lineage_invalid',
    (packet: MutableSourcePacket) => {
      packet.decodedRgbaSha256 = 'e'.repeat(64)
    },
  ],
  [
    'source_packet_invalid',
    (packet: MutableSourcePacket) => {
      packet.dispatchAuthority = true as false
    },
  ],
] as const) {
  await expectPacketIssue(
    {
      observation,
      reconciliation,
      receipt: isolatedFixture.receipt,
      delivered,
    },
    mutate,
    code,
  )
  adversarialAssertions += 1
}

await expectUnknownPacketKey({
  observation,
  reconciliation,
  receipt: isolatedFixture.receipt,
  delivered,
})
adversarialAssertions += 1

const decodedTamper = Buffer.from(delivered.decodedRgba)
decodedTamper[3] = 128
await expectPacketIssue(
  {
    observation,
    reconciliation,
    receipt: isolatedFixture.receipt,
    delivered,
  },
  (packet) => {
    packet.decodedRgba = decodedTamper
  },
  'decoded_rgba_digest_mismatch',
)
adversarialAssertions += 1

const fullFrameFixture =
  await createLivingFrameControlledImageSelectedScenePrivateOperationRequestSmokeFixture(
    'full_frame',
  )
const fullFrameObserved =
  await observe(
    fullFrameFixture.receipt,
    createOpaqueRgbPng(1_920, 1_080),
  )
const fullFrameReconciliationInput = {
  ...reconciliationInput,
  privateOutputObservation:
    fullFrameObserved.observation,
} as const
const fullFrameReconciliation =
  compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation(
    fullFrameReconciliationInput,
  )
const fullFrameReader =
  createLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader({
    privateOutputObservation:
      fullFrameObserved.observation,
    alphaWorkChainReconciliation:
      fullFrameReconciliation,
    canonicalWorkGraphProjection:
      livingFrameControlledImageSelectedSceneSmokeInput
        .workGraphProjection,
    readCurrentExactOpaqueOutput: async () =>
      sourcePacketFor({
        observation: fullFrameObserved.observation,
        reconciliation: fullFrameReconciliation,
        receipt: fullFrameFixture.receipt,
        delivered: fullFrameObserved.delivered,
      }),
  })
await expectCompileIssue(
  {
    ...fullFrameReconciliationInput,
    alphaWorkChainReconciliation:
      fullFrameReconciliation,
    sourceReader: fullFrameReader,
  },
  'isolated_component_required',
)
adversarialAssertions += 1

const forgedReceipt = structuredClone(result.receipt)
;(forgedReceipt as { productionReady: boolean })
  .productionReady = true
assert.equal(
  verifyLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff(
    forgedReceipt,
    input,
  ),
  false,
)
adversarialAssertions += 1

const copiedLease = {
  ...result.privateSourceLease,
}
assert.throws(
  () =>
    consumeLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceLease(
      copiedLease,
    ),
  (error: unknown) => {
    assert(
      error instanceof
        LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffError,
    )
    assert.equal(error.issues[0]?.code, 'lease_invalid')
    return true
  },
)
adversarialAssertions += 1

assert.equal(adversarialAssertions, 15)

process.stdout.write(
  `${JSON.stringify({
    status: 'passed',
    contractVersion: result.receipt.contractVersion,
    handoffState: result.receipt.handoffState,
    parentExpectedOutputCount:
      result.receipt.exactSourceSelector
        .parentExpectedOutputCount,
    exactOutputIndex:
      result.receipt.exactSourceSelector
        .parentExpectedOutputIndex,
    exactGeneratedAssetIntentId:
      result.receipt.exactSourceSelector
        .generatedAssetIntentId,
    privateSourceLeaseConsumed: true,
    canonicalWorkGraphMutated: false,
    rembgRequestCreated: false,
    sharpRequestCreated: false,
    productionReady: false,
    adversarialAssertions,
  })}\n`,
)

function sourceReaderFor(input: SourceFixture) {
  return createLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader({
    privateOutputObservation: input.observation,
    alphaWorkChainReconciliation: input.reconciliation,
    canonicalWorkGraphProjection:
      livingFrameControlledImageSelectedSceneSmokeInput
        .workGraphProjection,
    readCurrentExactOpaqueOutput: async () =>
      sourcePacketFor(input),
  })
}

function sourcePacketFor(
  input: SourceFixture,
): LivingFrameControlledImageSelectedSceneExactOutputAlphaSourcePacket {
  const generation =
    livingFrameControlledImageSelectedSceneSmokeInput
      .workGraphProjection.workItems.find(
        (item) =>
          item.workItemKey ===
            input.receipt.exactOutputLineage.approvedWorkItemKey
          && item.workItemType === 'generate_image_asset',
      )
  assert(generation)
  assert(
    'pendingOperationAuthority' in
      generation.executionInput,
  )
  assert(
    'generatedAssetIntentIds' in
      generation.executionInput.pendingOperationAuthority,
  )
  const controlledGeneration =
    generation as
      CanonicalLivingFrameControlledIllustrationGenerationWorkItem
  const outputIndex =
    controlledGeneration.expectedOutputs.findIndex(
    (output) =>
      output.outputKey ===
        input.receipt.exactOutputLineage.outputKey,
  )
  assert(outputIndex >= 0)
  const generatedAssetIntentId =
    controlledGeneration.executionInput
      .pendingOperationAuthority
      .generatedAssetIntentIds[outputIndex]
  assert(generatedAssetIntentId)
  return {
    packetClass:
      'server_owned_exact_selected_scene_isolated_opaque_alpha_source_packet_v1',
    evidenceClass: 'controlled_source_fixture',
    privateOutputObservationId:
      input.observation.observationId,
    privateOutputObservationDigestSha256:
      input.observation.observationDigestSha256,
    alphaWorkChainReconciliationId:
      input.reconciliation.reconciliationId,
    alphaWorkChainReconciliationDigestSha256:
      input.reconciliation.reconciliationDigestSha256,
    sceneId: input.receipt.canonicalScope.sceneId,
    componentId:
      input.receipt.exactOutputLineage.componentId,
    outputKey:
      input.receipt.exactOutputLineage.outputKey,
    approvedWorkItemId:
      input.receipt.exactOutputLineage.approvedWorkItemId,
    parentGenerationWorkItemKey:
      controlledGeneration.workItemKey,
    parentExpectedOutputIndex: outputIndex,
    generatedAssetIntentId,
    approvedPlannedAssetManifestEntryId:
      input.receipt.exactOutputLineage
        .approvedPlannedAssetManifestEntryId,
    outputCandidateId:
      input.observation.verifiedOutput.outputCandidateId,
    outputContentType: 'image/png',
    outputByteLength:
      input.delivered.outputPng.byteLength,
    outputContentSha256:
      digestBytes(input.delivered.outputPng),
    decodedRgbaSha256:
      digestBytes(input.delivered.decodedRgba),
    outputPng: Buffer.from(input.delivered.outputPng),
    decodedRgba: Buffer.from(input.delivered.decodedRgba),
    callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted:
      false,
    workGraphMutationAuthority: false,
    rembgAdmissionAuthority: false,
    dispatchAuthority: false,
    artifactPersistenceAuthority: false,
    actualCostAuthority: false,
    productionReady: false,
  }
}

async function observe(
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
  outputPng: Buffer,
) {
  let delivered:
    LivingFrameControlledImageSelectedSceneVerifiedOpaqueOutput
      | undefined
  const observation =
    await observeLivingFrameControlledImageSelectedScenePrivateOutput({
      operationRequestReceipt: receipt,
      outputReader:
        createLivingFrameControlledImageSelectedScenePrivateOutputReader({
          operationRequestReceipt: receipt,
          evidenceClass: 'controlled_source_fixture',
          readServerOwnedOutput: async () =>
            outputPacket(receipt, outputPng),
        }),
      outputConsumer:
        createLivingFrameControlledImageSelectedSceneVerifiedOutputConsumer(
          async (payload) => {
            delivered = {
              ...payload,
              outputPng: Buffer.from(payload.outputPng),
              decodedRgba: Buffer.from(payload.decodedRgba),
            }
          },
        ),
    })
  assert(delivered)
  return {
    observation,
    delivered,
  }
}

function outputPacket(
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
  outputPng: Buffer,
): LivingFrameControlledImageSelectedScenePrivateOutputPacket {
  return {
    packetClass:
      'server_owned_selected_scene_comfyui_opaque_png_output_packet_v1',
    evidenceClass: 'controlled_source_fixture',
    operationRequestReceiptId:
      receipt.operationRequestReceiptId,
    operationRequestReceiptDigestSha256:
      receipt.operationRequestReceiptDigestSha256,
    privateOperationRequestDigestSha256:
      receipt.requestSummary.privateOperationRequestDigestSha256,
    materializationUnitId:
      receipt.exactOutputLineage.materializationUnitId,
    requestUnitId:
      receipt.exactOutputLineage.requestUnitId,
    sceneId: receipt.canonicalScope.sceneId,
    componentId: receipt.exactOutputLineage.componentId,
    outputKey: receipt.exactOutputLineage.outputKey,
    approvedWorkItemId:
      receipt.exactOutputLineage.approvedWorkItemId,
    approvedWorkItemKey:
      receipt.exactOutputLineage.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      receipt.exactOutputLineage
        .approvedPlannedAssetManifestEntryId,
    confirmedOutputFrameExpectationDigestSha256:
      receipt.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256,
    widthPixels: receipt.generationCanvas.widthPixels,
    heightPixels: receipt.generationCanvas.heightPixels,
    outputCandidateId:
      `selected-alpha-source.${digest({
        request: receipt.operationRequestReceiptDigestSha256,
        output: digestBytes(outputPng),
      }).slice(0, 32)}`,
    outputContentType: 'image/png',
    outputByteLength: outputPng.byteLength,
    outputContentSha256: digestBytes(outputPng),
    outputPng: Buffer.from(outputPng),
    callerBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentAccepted:
      false,
    workerCompletionAuthority: false,
    gpuAttemptAuthority: false,
    actualCostAuthority: false,
    artifactPersistenceAuthority: false,
    qaApprovalAuthority: false,
    finalCanvasAuthority: false,
    productionReady: false,
  }
}

interface SourceFixture {
  readonly observation:
    Awaited<ReturnType<typeof observe>>['observation']
  readonly reconciliation:
    ReturnType<
      typeof compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation
    >
  readonly receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt
  readonly delivered:
    LivingFrameControlledImageSelectedSceneVerifiedOpaqueOutput
}

type MutableSourcePacket = {
  -readonly [Key in keyof
    LivingFrameControlledImageSelectedSceneExactOutputAlphaSourcePacket]:
      LivingFrameControlledImageSelectedSceneExactOutputAlphaSourcePacket[Key]
}

async function expectCompileIssue(
  candidate:
    CreateLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffInput,
  expectedCode: string,
): Promise<void> {
  let thrown: unknown
  try {
    await compileLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoff(
      candidate,
    )
  } catch (error) {
    thrown = error
  }
  assert(
    thrown instanceof
      LivingFrameControlledImageSelectedSceneExactOutputAlphaSourceHandoffError,
  )
  assert.equal(thrown.issues[0]?.code, expectedCode)
}

async function expectPacketIssue(
  fixture: SourceFixture,
  mutate: (packet: MutableSourcePacket) => void,
  expectedCode: string,
): Promise<void> {
  const packet =
    sourcePacketFor(fixture) as MutableSourcePacket
  mutate(packet)
  const reader =
    createLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader({
      privateOutputObservation: fixture.observation,
      alphaWorkChainReconciliation:
        fixture.reconciliation,
      canonicalWorkGraphProjection:
        livingFrameControlledImageSelectedSceneSmokeInput
          .workGraphProjection,
      readCurrentExactOpaqueOutput: async () => packet,
    })
  await expectCompileIssue(
    {
      ...input,
      sourceReader: reader,
    },
    expectedCode,
  )
}

async function expectUnknownPacketKey(
  fixture: SourceFixture,
): Promise<void> {
  const packet =
    sourcePacketFor(fixture) as unknown as
      Record<string, unknown>
  packet.path = '/tmp/forbidden.png'
  const reader =
    createLivingFrameControlledImageSelectedSceneExactOutputAlphaSourceReader({
      privateOutputObservation: fixture.observation,
      alphaWorkChainReconciliation:
        fixture.reconciliation,
      canonicalWorkGraphProjection:
        livingFrameControlledImageSelectedSceneSmokeInput
          .workGraphProjection,
      readCurrentExactOpaqueOutput: async () =>
        packet as unknown as
          LivingFrameControlledImageSelectedSceneExactOutputAlphaSourcePacket,
    })
  await expectCompileIssue(
    {
      ...input,
      sourceReader: reader,
    },
    'source_packet_invalid',
  )
}

function createOpaqueRgbPng(
  width: number,
  height: number,
): Buffer {
  const rowByteLength = width * 3
  const raw = Buffer.alloc((rowByteLength + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (rowByteLength + 1)
    raw[rowOffset] = 0
    for (let x = 0; x < width; x += 1) {
      const offset = rowOffset + 1 + x * 3
      raw[offset] = (x * 7 + y * 3) & 0xff
      raw[offset + 1] = (x * 5 + y * 11) & 0xff
      raw[offset + 2] = (x * 13 + y * 17) & 0xff
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a,
    ]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, 'ascii')
  const output = Buffer.alloc(12 + data.byteLength)
  output.writeUInt32BE(data.byteLength, 0)
  typeBytes.copy(output, 4)
  data.copy(output, 8)
  output.writeUInt32BE(
    pngCrc32(Buffer.concat([typeBytes, data])),
    8 + data.byteLength,
  )
  return output
}

function pngCrc32(bytes: Uint8Array): number {
  let value = 0xffffffff
  for (const byte of bytes) {
    value =
      PNG_CRC32_TABLE[(value ^ byte) & 0xff]! ^
      (value >>> 8)
  }
  return (value ^ 0xffffffff) >>> 0
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function digestBytes(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (
    value !== null
    && typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) =>
          left.localeCompare(right))
        .map(([key, child]) => [
          key,
          canonicalize(child),
        ]),
    )
  }
  return value
}
