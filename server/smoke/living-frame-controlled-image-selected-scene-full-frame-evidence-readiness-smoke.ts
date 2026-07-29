import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'

import type {
  LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-operation-request'
import type {
  LivingFrameControlledImageSelectedScenePrivateOutputObservation,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-output-observation'
import {
  compileLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness,
  verifyLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness,
} from '../living-frame/living-frame-controlled-image-selected-scene-full-frame-evidence-readiness'
import {
  createLivingFrameControlledImageSelectedScenePrivateOutputReader,
  createLivingFrameControlledImageSelectedSceneVerifiedOutputConsumer,
  observeLivingFrameControlledImageSelectedScenePrivateOutput,
  type LivingFrameControlledImageSelectedScenePrivateOutputPacket,
} from '../living-frame/living-frame-controlled-image-selected-scene-private-output-observation'
import {
  createLivingFrameControlledImageSelectedScenePrivateOperationRequestSmokeFixture,
} from './fixtures/living-frame-controlled-image-selected-scene-private-operation-request-fixture'

const fullFrameFixture =
  await createLivingFrameControlledImageSelectedScenePrivateOperationRequestSmokeFixture(
    'full_frame',
  )
const fullFrameObservation = await observe(
  fullFrameFixture.receipt,
  createOpaqueRgbPng(1_920, 1_080),
)
export const input = {
  selectedSceneRequest:
    fullFrameFixture.selectedSceneRequest,
  selectedSceneRequestInput:
    fullFrameFixture.selectedSceneRequestInput,
  fullFrameRatioExtension:
    fullFrameFixture.fullFrameRatioExtension,
  fullFrameRatioExtensionInput:
    fullFrameFixture.fullFrameRatioExtensionInput,
  privateOutputObservation: fullFrameObservation,
  canonicalWorkGraphProjection:
    fullFrameFixture.selectedSceneRequestInput
      .workGraphProjection,
} as const
export const readiness =
  await compileLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness(
    input,
  )

assert.equal(
  await verifyLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness(
    readiness,
    input,
  ),
  true,
)
assert.equal(
  readiness.readinessState,
  'full_frame_output_bound_canonical_artifact_and_qa_evidence_pending',
)
assert.equal(
  readiness.confirmedFrameBinding.frameClass,
  'landscape_16_9',
)
assert.equal(readiness.confirmedFrameBinding.widthPixels, 1_920)
assert.equal(readiness.confirmedFrameBinding.heightPixels, 1_080)
assert.equal(
  readiness.confirmedFrameBinding.squareSubstitutionApplied,
  false,
)
assert.equal(
  readiness.canonicalArtifactCandidate.sceneEvidenceArtifactKind,
  'opaque_raster',
)
assert.equal(
  readiness.destinationEvidenceExpectation
    .continuityRequirement,
  'required_by_approved_visual_continuity_pack',
)
assert.equal(
  readiness.destinationEvidenceExpectation
    .fullFramePlateMayEnterRembg,
  false,
)
assert.equal(
  readiness.destinationEvidenceExpectation
    .fullFramePlateMayReplaceRemotionFinalCanvas,
  false,
)
assert.deepEqual(
  readiness.canonicalOwnerBindings.requiredArtifactQaGateIds,
  ['asset_received_gate', 'asset_quality_gate'],
)
assert.equal(
  readiness.evidenceReadiness
    .alphaWorkChainCorrectlyNotApplicable,
  true,
)
assert.equal(
  readiness.evidenceReadiness.privateArtifactPersisted,
  false,
)
assert.deepEqual(
  readiness.costAndRegistryPolicy.sharedGpuCapabilityRoles,
  [
    'comfyui_host',
    'controlnet_aux_preprocessing',
    'controlnet_conditioning',
    'generic_ip_adapter_conditioning',
    'lora_adapter_loading',
  ],
)
assert.equal(readiness.persistenceExecuted, false)
assert.equal(readiness.qaExecuted, false)
assert.equal(readiness.assetManifestMutated, false)
assert.equal(readiness.privateReviewApproved, false)
assert.equal(readiness.renderAuthorized, false)
assert.equal(readiness.finalCanvasCreatedByComfyUi, false)
assert.equal(readiness.productionReady, false)

const serialized = JSON.stringify(readiness)
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

const isolatedFixture =
  await createLivingFrameControlledImageSelectedScenePrivateOperationRequestSmokeFixture(
    'isolated',
  )
const isolatedObservation = await observe(
  isolatedFixture.receipt,
  createOpaqueRgbPng(1_024, 1_024),
)
await assert.rejects(
  () =>
    compileLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness({
      ...input,
      privateOutputObservation: isolatedObservation,
    }),
)
adversarialAssertions += 1

const squareSubstitution = resignObservation({
  ...structuredClone(fullFrameObservation),
  verifiedOutput: {
    ...structuredClone(fullFrameObservation.verifiedOutput),
    widthPixels: 1_024,
    heightPixels: 1_024,
    opaquePixelCount: 1_024 * 1_024,
  },
})
await assert.rejects(
  () =>
    compileLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness({
      ...input,
      privateOutputObservation: squareSubstitution,
    }),
  (error: unknown) =>
    hasIssue(error, 'square_full_frame_substitution_forbidden'),
)
adversarialAssertions += 1

const crossOutput = resignObservation({
  ...structuredClone(fullFrameObservation),
  exactOutputLineage: {
    ...structuredClone(fullFrameObservation.exactOutputLineage),
    outputKey: 'cross-output.substitution',
  },
})
await assert.rejects(
  () =>
    compileLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness({
      ...input,
      privateOutputObservation: crossOutput,
    }),
)
adversarialAssertions += 1

const forgedExtension = structuredClone(
  fullFrameFixture.fullFrameRatioExtension,
)
;(forgedExtension.fullFrameRequestUnits[0]!.frameProfile as {
  finalCanvasCreatedByComfyUi: boolean
}).finalCanvasCreatedByComfyUi = true
await assert.rejects(
  () =>
    compileLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness({
      ...input,
      fullFrameRatioExtension: forgedExtension,
    }),
)
adversarialAssertions += 1

const promoted = structuredClone(readiness)
;(promoted as { productionReady: boolean }).productionReady = true
assert.equal(
  await verifyLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness(
    promoted,
    input,
  ),
  false,
)
adversarialAssertions += 1

assert.equal(adversarialAssertions, 5)

process.stdout.write(
  `${JSON.stringify({
    status: 'passed',
    readinessState: readiness.readinessState,
    confirmedFrame:
      `${readiness.confirmedFrameBinding.widthPixels}x${readiness.confirmedFrameBinding.heightPixels}`,
    continuityRequirement:
      readiness.destinationEvidenceExpectation
        .continuityRequirement,
    documentaryFactRequirement:
      readiness.destinationEvidenceExpectation
        .documentaryFactRequirement,
    artifactQaGates:
      readiness.canonicalOwnerBindings
        .requiredArtifactQaGateIds,
    registryExpansionPermitted:
      readiness.costAndRegistryPolicy
        .registryExpansionPermitted,
    persistenceExecuted: false,
    qaExecuted: false,
    renderAuthorized: false,
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
      `selected-full-frame-output.${digest({
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

function resignObservation(
  value: Omit<
    LivingFrameControlledImageSelectedScenePrivateOutputObservation,
    'observationDigestSha256'
  > & {
    readonly observationDigestSha256?: string
  },
): LivingFrameControlledImageSelectedScenePrivateOutputObservation {
  const draft =
    structuredClone(value) as unknown as Record<string, unknown>
  delete draft.observationDigestSha256
  return {
    ...draft,
    observationDigestSha256: digest(draft),
  } as unknown as
    LivingFrameControlledImageSelectedScenePrivateOutputObservation
}

function hasIssue(
  error: unknown,
  code: string,
): boolean {
  return (
    error !== null
    && typeof error === 'object'
    && 'issues' in error
    && Array.isArray(error.issues)
    && error.issues.some((issue) =>
      issue !== null
      && typeof issue === 'object'
      && 'code' in issue
      && issue.code === code)
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
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (
    value !== null
    && typeof value === 'object'
    && !Buffer.isBuffer(value)
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
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
