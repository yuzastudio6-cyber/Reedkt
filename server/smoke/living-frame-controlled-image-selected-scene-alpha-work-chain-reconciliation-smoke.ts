import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'

import type {
  LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-operation-request'
import {
  compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation,
  verifyLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation,
} from '../living-frame/living-frame-controlled-image-selected-scene-alpha-work-chain-reconciliation'
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

const isolatedFixture =
  await createLivingFrameControlledImageSelectedScenePrivateOperationRequestSmokeFixture(
    'isolated',
  )
const isolatedObservation = await observe(
  isolatedFixture.receipt,
  createOpaqueRgbPng(1_024, 1_024),
)
const isolatedInput = {
  selectedSceneRequest:
    livingFrameControlledImageSelectedSceneSmokeRequest,
  selectedSceneRequestInput:
    livingFrameControlledImageSelectedSceneSmokeInput,
  privateOutputObservation: isolatedObservation,
  canonicalWorkGraphProjection:
    livingFrameControlledImageSelectedSceneSmokeInput
      .workGraphProjection,
} as const
const blocked =
  compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation(
    isolatedInput,
  )

assert.equal(
  verifyLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation(
    blocked,
    isolatedInput,
  ),
  true,
)
assert.equal(
  blocked.reconciliationState,
  'blocked_by_missing_canonical_generated_alpha_work_chain',
)
assert.equal(
  blocked.workGraphEvidence.generationWorkItemMatched,
  true,
)
assert.equal(
  blocked.workGraphEvidence.generationOutputMatched,
  true,
)
assert.equal(
  blocked.workGraphEvidence.exactGeneratedAssetIntentMatched,
  true,
)
assert.equal(
  blocked.workGraphEvidence.generationWorkItemExpectedOutputCount,
  2,
)
assert.equal(
  blocked.workGraphEvidence
    .exactRembgGeneratedSourceDependencyMatched,
  false,
)
assert.equal(
  blocked.workGraphEvidence.sharpRgbaExpectedOutputMatched,
  false,
)
assert.deepEqual(blocked.conflictCodes, [
  'canonical_multi_output_generation_not_admitted_to_rembg',
  'canonical_rembg_mask_output_missing',
  'canonical_rembg_work_item_missing',
  'canonical_sharp_rgba_output_missing',
  'canonical_sharp_work_item_missing',
])
assert.equal(blocked.canonicalWorkGraphMutated, false)
assert.equal(blocked.rembgRequestCreated, false)
assert.equal(blocked.rembgInferenceExecuted, false)
assert.equal(blocked.maskArtifactCreated, false)
assert.equal(blocked.transparentComponentCreated, false)
assert.equal(blocked.assetManifestMutated, false)
assert.equal(blocked.qaApproved, false)
assert.equal(blocked.privateReviewApproved, false)
assert.equal(blocked.renderAuthorized, false)
assert.equal(blocked.finalCanvasCreatedByComfyUi, false)
assert.equal(blocked.productionReady, false)

const fullFrameFixture =
  await createLivingFrameControlledImageSelectedScenePrivateOperationRequestSmokeFixture(
    'full_frame',
  )
const fullFrameObservation = await observe(
  fullFrameFixture.receipt,
  createOpaqueRgbPng(1_920, 1_080),
)
const fullFrameInput = {
  ...isolatedInput,
  privateOutputObservation: fullFrameObservation,
} as const
const notApplicable =
  compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation(
    fullFrameInput,
  )
assert.equal(
  verifyLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation(
    notApplicable,
    fullFrameInput,
  ),
  true,
)
assert.equal(
  notApplicable.reconciliationState,
  'not_applicable_to_confirmed_full_frame_plate',
)
assert.deepEqual(notApplicable.conflictCodes, [])
assert.equal(
  notApplicable.alphaPipelineExpectation
    .fullFramePlateMustNotEnterAlphaPipeline,
  true,
)
assert.equal(
  notApplicable.alphaPipelineExpectation
    .remotionRemainsFinalCanvasOwner,
  true,
)

const serialized = JSON.stringify([blocked, notApplicable])
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

const promoted = structuredClone(blocked)
;(promoted as { productionReady: boolean }).productionReady = true
assert.equal(
  verifyLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation(
    promoted,
    isolatedInput,
  ),
  false,
)
adversarialAssertions += 1

const mutatedGraph = structuredClone(
  livingFrameControlledImageSelectedSceneSmokeInput
    .workGraphProjection,
)
;(mutatedGraph as { productionReady: boolean }).productionReady = true
assert.throws(
  () =>
    compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation({
      ...isolatedInput,
      canonicalWorkGraphProjection: mutatedGraph,
    }),
)
adversarialAssertions += 1

const staleGraph = structuredClone(
  livingFrameControlledImageSelectedSceneSmokeInput
    .workGraphProjection,
)
;(staleGraph as { projectionDigestSha256: string })
  .projectionDigestSha256 = '0'.repeat(64)
assert.throws(
  () =>
    compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation({
      ...isolatedInput,
      canonicalWorkGraphProjection: staleGraph,
    }),
)
adversarialAssertions += 1

const forgedObservation = structuredClone(isolatedObservation)
;(forgedObservation.exactOutputLineage as {
  outputKey: string
}).outputKey = 'cross-output.substitution'
assert.throws(
  () =>
    compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation({
      ...isolatedInput,
      privateOutputObservation: forgedObservation,
    }),
)
adversarialAssertions += 1

assert.equal(adversarialAssertions, 4)

process.stdout.write(
  `${JSON.stringify({
    status: 'passed',
    reconciliationState: blocked.reconciliationState,
    selectedOutputExpectedCount:
      blocked.workGraphEvidence
        .generationWorkItemExpectedOutputCount,
    conflictCodes: blocked.conflictCodes,
    fullFrameDisposition:
      notApplicable.reconciliationState,
    registryExpansionPermitted:
      blocked.registryPolicy.registryExpansionPermitted,
    canonicalWorkGraphMutated: false,
    rembgRequestCreated: false,
    productionReady: false,
    adversarialAssertions,
  })}\n`,
)

async function observe(
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
  outputPng: Buffer,
) {
  const reader =
    createLivingFrameControlledImageSelectedScenePrivateOutputReader({
      operationRequestReceipt: receipt,
      evidenceClass: 'controlled_source_fixture',
      readServerOwnedOutput: async () =>
        packet(receipt, outputPng),
    })
  const consumer =
    createLivingFrameControlledImageSelectedSceneVerifiedOutputConsumer(
      async () => undefined,
    )
  return observeLivingFrameControlledImageSelectedScenePrivateOutput({
    operationRequestReceipt: receipt,
    outputReader: reader,
    outputConsumer: consumer,
  })
}

function packet(
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
      `selected-alpha-output.${digest({
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
    crc32(Buffer.concat([typeBytes, data])),
    8 + data.byteLength,
  )
  return output
}

function crc32(value: Buffer): number {
  let crc = 0xffffffff
  for (const byte of value) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc =
        (crc & 1) === 1
          ? 0xedb88320 ^ (crc >>> 1)
          : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function digestBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(value), 'utf8')
    .digest('hex')
}
